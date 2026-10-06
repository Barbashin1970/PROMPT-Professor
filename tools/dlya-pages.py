#!/usr/bin/env python3
"""Дубль сайта для GitHub Pages: копия site/ с адресами под подпапку репозитория.

Сайт ссылается от корня (/lekciya-1/, /assets/…), а Pages раздаёт репозиторий по адресу
https://<ник>.github.io/<Repo>/ — в подпапке. Поэтому к каждому адресу от корня
приписывается основа /<Repo>: в атрибутах страниц, в адресах внутри скриптов, в manifest
и в списке сохранения service worker. Сам site/ не меняется — его публикует Vercel.

    python3 tools/dlya-pages.py --osnova /PROMPT-Professor --vyhod _pages

Запускает workflow .github/workflows/pages.yml; локально — для проверки (папка _pages/
в .gitignore). В конце — самопроверка: адрес от корня без основы — остановка.
"""

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

KOREN = Path(__file__).resolve().parent.parent
SITE = KOREN / "site"
ATRIBUT = re.compile(r'\b(href|src|srcset|action|poster)="([^"]*)"')
# строка в скрипте, похожая на адрес сайта: '/praktika/', "/lekciya-1/#…", '/sw.js'.
# Одиночная '/' сюда не попадает намеренно: в конструкторе это символ base64, не адрес.
ADRES_V_STROKE = re.compile(r"""(['"])(/[A-Za-z0-9][^'"\s]*)\1""")


def s_osnovoj(adres, osnova):
    """'/x' → '/Repo/x'. Внешние, относительные, '//host' и уже с основой — как есть."""
    if not adres.startswith("/") or adres.startswith("//") or adres == osnova or adres.startswith(osnova + "/"):
        return adres
    return osnova + adres


def v_html(tekst, osnova):
    def atribut(m):
        imya, znachenie = m.group(1), m.group(2)
        if imya == "srcset":
            chasti = []
            for kusok in znachenie.split(","):
                slova = kusok.strip().split(" ")
                chasti.append(" ".join([s_osnovoj(slova[0], osnova)] + slova[1:]))
            znachenie = ", ".join(chasti)
        else:
            znachenie = s_osnovoj(znachenie, osnova)
        return f'{imya}="{znachenie}"'
    return ATRIBUT.sub(atribut, tekst)


def v_js(tekst, osnova):
    return ADRES_V_STROKE.sub(lambda m: m.group(1) + s_osnovoj(m.group(2), osnova) + m.group(1), tekst)


def zamenit_rovno_raz(tekst, staroe, novoe, gde):
    if tekst.count(staroe) != 1:
        sys.exit(f"СТОП: в {gde} не найдено ровно одно «{staroe}» — скрипт сайта изменился, поправьте dlya-pages.py")
    return tekst.replace(staroe, novoe)


def main():
    argumenty = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    argumenty.add_argument("--osnova", required=True, help="подпапка сайта на Pages, например /PROMPT-Professor")
    argumenty.add_argument("--vyhod", default=str(KOREN / "_pages"), help="куда положить копию")
    a = argumenty.parse_args()
    osnova = "/" + a.osnova.strip("/")
    vyhod = Path(a.vyhod).resolve()
    if vyhod == SITE.resolve():
        sys.exit("СТОП: выход не может совпадать с site/")
    if vyhod.exists():
        shutil.rmtree(vyhod)
    shutil.copytree(SITE, vyhod, ignore=shutil.ignore_patterns(".DS_Store"))

    stranic = skriptov = 0
    for fajl in vyhod.rglob("*.html"):
        fajl.write_text(v_html(fajl.read_text(encoding="utf-8"), osnova), encoding="utf-8")
        stranic += 1
    for fajl in vyhod.rglob("*.js"):
        tekst = v_js(fajl.read_text(encoding="utf-8"), osnova)
        otn = fajl.relative_to(vyhod).as_posix()
        if otn == "sw.js":
            # список сохранения — целиком, вместе с главной "/"; ссылка «На главную» на странице «Нет связи»
            m = re.search(r"const PREDZAGRUZKA = (\[.*?\]);", tekst, re.S)
            spisok = [s_osnovoj(x, osnova) for x in json.loads(m.group(1))]
            tekst = tekst[:m.start(1)] + json.dumps(spisok, ensure_ascii=False, indent=2) + tekst[m.end(1):]
            tekst = zamenit_rovno_raz(tekst, 'href="/"', f'href="{osnova}/"', "sw.js")
        if otn == "assets/sajt.js":
            # «это не главная» — главная на Pages живёт в подпапке
            tekst = zamenit_rovno_raz(tekst, "put !== '/'", f"put !== '{osnova}/'", "assets/sajt.js")
        fajl.write_text(tekst, encoding="utf-8")
        skriptov += 1
    manifest = vyhod / "manifest.webmanifest"
    if manifest.exists():
        d = json.loads(manifest.read_text(encoding="utf-8"))
        for pole in ("id", "start_url", "scope"):
            if pole in d:
                d[pole] = s_osnovoj(d[pole], osnova)
        for ikonka in d.get("icons", []):
            ikonka["src"] = s_osnovoj(ikonka["src"], osnova)
        manifest.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (vyhod / ".nojekyll").write_text("", encoding="utf-8")

    # Самопроверка: ни одного адреса от корня без основы
    oshibki = []
    for fajl in vyhod.rglob("*.html"):
        for _, znachenie in ATRIBUT.findall(fajl.read_text(encoding="utf-8")):
            for kusok in znachenie.split(","):
                adres = kusok.strip().split(" ")[0]
                if adres.startswith("/") and not adres.startswith("//") and not adres.startswith(osnova + "/"):
                    oshibki.append(f"{fajl.relative_to(vyhod)}: {adres}")
    for fajl in vyhod.rglob("*.js"):
        for _, adres in ADRES_V_STROKE.findall(fajl.read_text(encoding="utf-8")):
            if not adres.startswith(osnova + "/"):
                oshibki.append(f"{fajl.relative_to(vyhod)}: {adres}")
    if oshibki:
        print("Адреса от корня без основы:\n  " + "\n  ".join(oshibki[:20]))
        sys.exit(1)
    print(f"{vyhod.name}/ — копия site/ под {osnova}/: страниц {stranic}, скриптов {skriptov}; адресов без основы нет.")


if __name__ == "__main__":
    main()
