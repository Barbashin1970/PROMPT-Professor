#!/usr/bin/env python3
"""Проверки-сторожа сайта курса. Запускать после сборки, перед публикацией:

    python3 tools/sobrat-sajt.py && python3 tools/proverit-sajt.py

Код выхода 0 — расхождений нет; иначе печатается каждое расхождение и код 1.
Что проверяется (проект сайта — docs/SAIT-PROEKT.md, §6):
  1. Внутренние ссылки и картинки ведут на существующие страницы и файлы; якоря — на существующие id.
  2. Внешние ссылки открываются в новом окне: target="_blank" и rel="noopener noreferrer".
  3. На странице нет повторяющихся id; у каждой карточки промпта есть заголовок.
  4. В собранных страницах нет незаполненных подстановок {{…}}; у каждой есть <title> и lang="ru".
  5. В конспектах нет пометок «ПРОВЕРИТЬ» — непроверенное не публикуется.
  6. Навыки: описание не длиннее 1024 байт, в архиве не больше 100 файлов, без PDF
     и без служебного: скрытых файлов и папок (.obsidian, .DS_Store), __MACOSX, __pycache__.
  7. Итоговый тест: 6 модулей по 5 вопросов, 72 балла; ключ каждого вопроса есть среди
     вариантов; разделы конспекта, на которые ссылается тест, существуют; «сдано» — от 44
     из 72 (60 %); в тесте нет адреса для писем — результаты автору не отправляются.
  8. Авторы промптов с пометкой на карточке названы в «Заимствованиях» на «О курсе».
  9. В скачиваемых .docx нет заглушек адреса и ссылок от корня сайта — в файле они никуда не ведут.
"""

import json
import re
import subprocess
import sys
import zipfile
from collections import Counter
from pathlib import Path
from urllib.parse import unquote, urlsplit

KOREN = Path(__file__).resolve().parent.parent
SITE = KOREN / "site"
CONTENT = KOREN / "content"

oshibki = []


def oshibka(tekst):
    oshibki.append(tekst)


def cel_ssylki(stranica, href):
    """Путь к файлу на диске для внутренней ссылки; None — ссылка не на файл сайта."""
    chasti = urlsplit(href)
    if chasti.scheme or href.startswith(("mailto:", "tel:", "#")):
        return None, chasti.fragment
    put = unquote(chasti.path)
    if put.startswith("/"):
        cel = SITE / put.lstrip("/")
    else:
        cel = (stranica.parent / put).resolve()
    if cel.is_dir() or put.endswith("/"):
        cel = cel / "index.html"
    return cel, chasti.fragment


def idy_stranicy(put, kesh={}):
    if put not in kesh:
        kesh[put] = set(re.findall(r'\bid="([^"]+)"', put.read_text(encoding="utf-8")))
    return kesh[put]


def proverit_stranicy():
    stranicy = sorted(SITE.rglob("*.html"))
    for stranica in stranicy:
        imya = stranica.relative_to(SITE).as_posix()
        html = stranica.read_text(encoding="utf-8")
        if "{{" in html:
            oshibka(f"{imya}: незаполненная подстановка {{{{…}}}}")
        if "<title>" not in html:
            oshibka(f"{imya}: нет <title>")
        if 'lang="ru"' not in html:
            oshibka(f"{imya}: нет lang=\"ru\"")
        # подвал с картой сайта — на каждой странице, включая рукописные (тест, конструктор):
        # на широком экране только он ведёт к страницам, которых нет в шапке
        if 'class="foot__karta"' not in html:
            oshibka(f"{imya}: в подвале нет карты сайта")
        povtory = [i for i, n in Counter(re.findall(r'\bid="([^"]+)"', html)).items() if n > 1]
        if povtory:
            oshibka(f"{imya}: повторяются id: {', '.join(povtory[:5])}")
        for kartochka in re.findall(r'<section class="prompt"[^>]*data-prompt>(.*?)</section>', html, re.S):
            if 'class="prompt__title"' not in kartochka:
                oshibka(f"{imya}: карточка промпта без заголовка")
        for src in re.findall(r'<img\s[^>]*src="([^"]+)"', html):
            if src.startswith(("http://", "https://", "data:")):
                continue
            cel, _ = cel_ssylki(stranica, src)
            if cel is not None and not cel.exists():
                oshibka(f"{imya}: картинки нет: {src}")
        for teg in re.findall(r"<a\s[^>]*>", html):
            href = re.search(r'href="([^"]*)"', teg)
            if not href:
                continue
            href = href.group(1)
            if href.startswith(("http://", "https://")):
                if 'target="_blank"' not in teg or "noopener" not in teg:
                    oshibka(f"{imya}: внешняя ссылка не в новом окне: {href[:70]}")
                continue
            cel, yakor = cel_ssylki(stranica, href)
            if cel is None:
                if yakor and yakor not in idy_stranicy(stranica):
                    oshibka(f"{imya}: якорь #{yakor} не найден на странице")
                continue
            if not cel.exists():
                oshibka(f"{imya}: ссылка ведёт в никуда: {href}")
            elif yakor and cel.suffix == ".html" and yakor not in idy_stranicy(cel):
                oshibka(f"{imya}: якорь не найден: {href}")
    return len(stranicy)


def proverit_konspekty():
    for put in sorted(CONTENT.rglob("*.md")):
        if "ПРОВЕРИТЬ" in put.read_text(encoding="utf-8"):
            oshibka(f"content/{put.relative_to(CONTENT).as_posix()}: осталась пометка «ПРОВЕРИТЬ»")


def proverit_navyki():
    arhivy = sorted((SITE / "files" / "navyki").glob("*.zip"))
    if not arhivy:
        oshibka("нет ни одного архива навыка в site/files/navyki")
    for arhiv in arhivy:
        with zipfile.ZipFile(arhiv) as z:
            imena = [i for i in z.namelist() if not i.endswith("/")]
            if len(imena) > 100:
                oshibka(f"{arhiv.name}: {len(imena)} файлов > 100 (предел архива навыка в Perplexity)")
            if any(i.lower().endswith(".pdf") for i in imena):
                oshibka(f"{arhiv.name}: внутри PDF")
            sluzhebnye = [i for i in imena if any(ch.startswith(".") or ch in {"__MACOSX", "__pycache__"}
                                                   for ch in i.split("/"))]
            if sluzhebnye:
                oshibka(f"{arhiv.name}: служебные файлы в архиве: {', '.join(sluzhebnye[:3])}")
            if "SKILL.md" not in imena:
                oshibka(f"{arhiv.name}: SKILL.md не в корне архива")
                continue
            tekst = z.read("SKILL.md").decode("utf-8")
            m = re.search(r'^description: "(.*?)"\s*$', tekst, re.M)
            if not m:
                oshibka(f"{arhiv.name}: не найдено поле description")
            elif len(m.group(1).encode("utf-8")) > 1024:
                oshibka(f"{arhiv.name}: description {len(m.group(1).encode('utf-8'))} байт > 1024")
    return len(arhivy)


# Тесты сайта: (файл вопросов, модулей, всего баллов, порог 60 %). Движок у обоих один.
TESTY = [("test-voprosy.js", 6, 72, 44), ("test-prodvinutyj.js", 10, 120, 72)]


def proverit_nabor(imya_faila, modulei, ballov):
    istochnik = CONTENT / imya_faila
    gde = f"тест {imya_faila}"
    if not istochnik.exists():
        oshibka(f"нет content/{imya_faila}")
        return []
    kod = ("const vm=require('vm');const c={window:{}};"
           f"vm.runInNewContext(require('fs').readFileSync({json.dumps(str(istochnik))},'utf8'),c);"
           "process.stdout.write(JSON.stringify(c.window.TEST_MODULI));")
    rezultat = subprocess.run(["node", "-e", kod], capture_output=True, text=True)
    if rezultat.returncode != 0:
        oshibka(f"{imya_faila} не читается: {rezultat.stderr.strip()[:200]}")
        return []
    moduli = json.loads(rezultat.stdout)
    if len(moduli) != modulei:
        oshibka(f"{gde}: модулей {len(moduli)}, нужно {modulei}")
    vsego = 0
    for modul in moduli:
        voprosy = modul.get("voprosy", [])
        if len(voprosy) != 5:
            oshibka(f"{gde}, модуль {modul.get('id')}: вопросов {len(voprosy)}, нужно 5")
        for v in voprosy:
            vsego += v.get("points", 0)
            if v["type"] == "multiple_choice":
                bukvy = {o["letter"] for o in v["options"]}
                if v["correctAnswer"] not in bukvy:
                    oshibka(f"{gde}, вопрос {v['id']}: ключ {v['correctAnswer']} не среди вариантов")
            elif v["type"] == "matching":
                bukvy = {o["letter"] for o in v["rightOptions"]}
                kluchi = [i["correct"] for i in v["items"]]
                if not set(kluchi) <= bukvy or len(set(kluchi)) != len(kluchi):
                    oshibka(f"{gde}, вопрос {v['id']}: ключи сопоставления не совпадают с вариантами")
        razdel = modul.get("razdel", "")
        stranica, _, yakor = razdel.partition("#")
        cel = SITE / stranica.strip("/") / "index.html"
        if not cel.exists() or (yakor and yakor not in idy_stranicy(cel)):
            oshibka(f"{gde}, модуль {modul.get('id')}: раздел для повторения не найден: {razdel}")
    if vsego != ballov:
        oshibka(f"{gde}: всего баллов {vsego}, нужно {ballov}")
    # ядро движка проходит набор верными ответами и сверяет его с правилами теста
    dvizhok = SITE / "test" / "test.js"
    kod = ("const vm=require('vm'),fs=require('fs');const c={window:{}};"
           f"vm.runInNewContext(fs.readFileSync({json.dumps(str(istochnik))},'utf8'),c);"
           f"const Y=require({json.dumps(str(dvizhok))});const p=Y.prigotovitModuli(c.window.TEST_MODULI);"
           f"process.stdout.write(JSON.stringify(Y.proverkaTesta(p.moduli,p.zamechaniya,{modulei}).zamechaniya));")
    zam = subprocess.run(["node", "-e", kod], capture_output=True, text=True)
    for z in (json.loads(zam.stdout) if zam.returncode == 0 else [zam.stderr.strip()[:200]]):
        oshibka(f"{gde}: {z}")
    return moduli


def proverit_test():
    teksty = {}
    for imya_faila, modulei, ballov, porog_nuzhen in TESTY:
        moduli = proverit_nabor(imya_faila, modulei, ballov)
        teksty[imya_faila] = {v.get("text") for m in moduli for v in m.get("voprosy", [])}
        dvizhok = SITE / "test" / "test.js"
        porog = subprocess.run(["node", "-e", f"process.stdout.write(String(require({json.dumps(str(dvizhok))}).porogBallov({ballov})))"],
                               capture_output=True, text=True)
        if porog.stdout.strip() != str(porog_nuzhen):
            oshibka(f"тест {imya_faila}: порог {porog.stdout.strip() or '?'} из {ballov}, решено — от {porog_nuzhen} (60 %)")
    obshchie = teksty.get("test-voprosy.js", set()) & teksty.get("test-prodvinutyj.js", set())
    if obshchie:
        oshibka(f"продвинутый тест повторяет вопросы тренировочного: {len(obshchie)}")
    dvizhok = SITE / "test" / "test.js"
    stranicy_testov = [SITE / "test" / "index.html", SITE / "test" / "prodvinutyj" / "index.html"]
    kod_stranic = "".join(s.read_text(encoding="utf-8") for s in stranicy_testov if s.exists())
    if re.search(r"mailto:|@yandex\.ru|Отправить автору", dvizhok.read_text(encoding="utf-8") + kod_stranic):
        oshibka("тест: остался адрес или кнопка для писем автору — решено без писем")
    # На сайте результаты не собираются: полей имени и потока на страницах тестов нет
    if re.search(r'id="test-(familiya|imya|potok)"', kod_stranic):
        oshibka("тест: на странице остались поля имени или потока — решено без сбора результатов")
    # Тест на сайте — тренировка, зачёт — в форме с ведомостью: кнопка на странице теста
    # и та же ссылка на «Практике»
    forma = re.search(r'<a data-forma-zacheta href="(https://[^"]+)"', (SITE / "test" / "index.html").read_text(encoding="utf-8"))
    if not forma:
        oshibka("тест: нет кнопки «Сдать зачёт в ведомость» (data-forma-zacheta)")
    elif forma.group(1) not in (SITE / "praktika" / "index.html").read_text(encoding="utf-8"):
        oshibka("практика: нет ссылки на зачётную форму — той же, что на странице теста")
    # Сценарий зачётной формы и выгрузка для системы НГУ собираются из тех же вопросов
    # и не должны от них отставать
    for skript, chto in (("sobrat-google-formu.js", "форма зачёта"), ("vygruzit-test.js", "выгрузка теста")):
        sverka = subprocess.run(["node", str(KOREN / "tools" / skript), "--proverka"],
                                capture_output=True, text=True)
        if sverka.returncode != 0:
            for stroka in (sverka.stdout + sverka.stderr).strip().splitlines() or ["ошибка сверки"]:
                oshibka(f"{chto}: {stroka}")


def proverit_avtorov():
    """Автор с карточки промпта назван в «Заимствованиях» — той же ссылкой."""
    zaimstvovaniya = (SITE / "o-kurse" / "index.html").read_text(encoding="utf-8")
    zaimstvovaniya = zaimstvovaniya.split('id="licenzii"', 1)[-1]
    ssylki = set()
    for stranica in SITE.rglob("*.html"):
        ssylki |= set(re.findall(r'<p class="prompt__avtor">.*?<a href="([^"]+)"',
                                 stranica.read_text(encoding="utf-8")))
    for adres in sorted(ssylki):
        if f'href="{adres}"' not in zaimstvovaniya:
            oshibka(f"автор промптов {adres} не назван в «Заимствованиях» на «О курсе»")


def proverit_docx():
    """Ссылки в скачиваемых .docx — полные адреса: от корня сайта в файле ничего не открывается."""
    for fajl in sorted(SITE.rglob("*.docx")):
        with zipfile.ZipFile(fajl) as arhiv:
            tekst = "".join(arhiv.read(imya).decode("utf-8", "replace") for imya in arhiv.namelist()
                            if imya.startswith("word/") and imya.endswith((".xml", ".rels")))
        if "ТУТ-БУДЕТ" in tekst:
            oshibka(f"{fajl.relative_to(SITE)}: заглушка адреса сайта вместо адреса")
        if re.search(r'Target="/', tekst):
            oshibka(f"{fajl.relative_to(SITE)}: ссылка от корня сайта — в файле никуда не ведёт")


def main():
    n = proverit_stranicy()
    proverit_konspekty()
    k = proverit_navyki()
    proverit_test()
    proverit_avtorov()
    proverit_docx()
    print(f"Проверено страниц: {n}, архивов навыков: {k}.")
    if oshibki:
        print(f"Расхождений: {len(oshibki)}")
        for o in oshibki:
            print("  ✗ " + o)
        return 1
    print("Расхождений нет.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
