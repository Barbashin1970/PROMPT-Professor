#!/usr/bin/env python3
"""Проверка опубликованного сайта ответами сервера — в обе стороны.

    python3 tools/proverit-publikaciyu.py https://<проект>.vercel.app

Проверять надо не список файлов и не конфиг, а ответ сервера (уроки vault
vercelignore-negation-leaks-readme и spa-catchall-rewrite-is-a-soft-404):
  1. каждый файл из site/ отвечает 200 по своему адресу (страница — адресом со слэшем);
  2. исходники, внутренние документы и служебные файлы отвечают 404;
  3. несуществующий адрес отвечает 404 и страницей «Такой страницы нет» с noindex;
  4. адрес страницы без слэша отвечает 308 на адрес со слэшем (trailingSlash);
  5. на главной есть заголовок X-Kurs-Konfig — значит, vercel.json прочитан.
Код выхода 0 — всё сходится; иначе печатается каждое расхождение и код 1.
"""

import re
import ssl
import sys
import urllib.error
import urllib.request
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"

# Чего на хостинге быть не должно: исходники, документы, служебное, снятые страницы
LISHNEE = [
    "/README.md", "/vercel.json", "/.vercelignore", "/.gitignore", "/.git/config",
    "/content/lekciya-1.md", "/content/servisy.json", "/docs/LEKCII-RAZBOR.md",
    "/tools/sobrat-sajt.py", "/skills/editing-ai-writing/SKILL.md",
    "/vhod/", "/art-master/", "/site/index.html", "/dz/",
    # ключ ответов зачёта: выгрузка для системы НГУ и сценарий формы
    "/docs/TEST-ZACHET-VOPROSY-I-OTVETY.md", "/tools/google-forma/Kod.gs",
]


class BezPerehodov(urllib.request.HTTPRedirectHandler):
    """Переадресацию не выполняем: 308 должен быть виден сам по себе."""
    def redirect_request(self, *args, **kwargs):
        return None


def ssl_kontekst():
    """Корневые сертификаты: certifi, если стоит, иначе системный набор. У Python с python.org
    на Mac своего набора нет — без этого каждый запрос падал «certificate verify failed»,
    и проверка показывала «ответ None» вместо настоящих ответов сайта."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        pass
    for put in ("/etc/ssl/cert.pem", "/etc/ssl/certs/ca-certificates.crt"):
        if Path(put).exists():
            return ssl.create_default_context(cafile=put)
    return ssl.create_default_context()


OTKRYVATEL = urllib.request.build_opener(BezPerehodov, urllib.request.HTTPSHandler(context=ssl_kontekst()))


def zapros(url):
    """(код, заголовки, начало тела). Ошибка сети — код None."""
    zapros_ = urllib.request.Request(url, headers={"User-Agent": "proverit-publikaciyu"})
    try:
        with OTKRYVATEL.open(zapros_, timeout=20) as otvet:
            return otvet.status, otvet.headers, otvet.read(300_000)
    except urllib.error.HTTPError as oshibka:
        return oshibka.code, oshibka.headers, oshibka.read(300_000)
    except (urllib.error.URLError, TimeoutError) as oshibka:
        return None, {}, str(oshibka).encode()


def adresa_sajta():
    """Адрес каждого файла site/, кроме 404.html: у страницы — папка со слэшем."""
    adresa = []
    for fajl in sorted(SITE.rglob("*")):
        if not fajl.is_file() or fajl.name == "404.html" or fajl.name.startswith("."):
            continue
        put = fajl.relative_to(SITE).as_posix()
        adresa.append("/" + (put[: -len("index.html")] if put.endswith("index.html") else put))
    return adresa


def main(argv):
    if len(argv) != 2 or not argv[1].startswith(("http://", "https://")):
        print(__doc__)
        return 2
    osnova = argv[1].rstrip("/")
    oshibki = []

    zhivye = adresa_sajta()
    for adres in zhivye:
        kod, _, _ = zapros(osnova + adres)
        if kod != 200:
            oshibki.append(f"{adres}: ответ {kod}, нужно 200")

    for adres in LISHNEE:
        kod, zagolovki, _ = zapros(osnova + adres)
        if kod in (301, 308):
            # адрес без расширения Vercel сначала дополняет слэшем (trailingSlash) — смотрим, куда
            kuda = (zagolovki.get("Location") or zagolovki.get("location") or "") if zagolovki else ""
            kod, _, _ = zapros(kuda if kuda.startswith("http") else osnova + kuda)
        if kod != 404:
            oshibki.append(f"{adres}: ответ {kod}, нужно 404 — лишнее на хостинге")

    kod, _, telo = zapros(osnova + "/net-takoy-stranicy-12345/")
    telo = telo.decode("utf-8", "replace")
    if kod != 404:
        oshibki.append(f"несуществующий адрес: ответ {kod}, нужно 404")
    elif "Такой страницы нет" not in telo or "noindex" not in telo:
        oshibki.append("несуществующий адрес: 404 без нашей страницы или без noindex")

    kod, zagolovki, _ = zapros(osnova + "/lekciya-1")
    kuda = (zagolovki.get("Location") or zagolovki.get("location") or "") if zagolovki else ""
    if kod != 308 or not kuda.endswith("/lekciya-1/"):
        oshibki.append(f"/lekciya-1 без слэша: ответ {kod} → «{kuda}», нужно 308 → /lekciya-1/")

    kod, zagolovki, telo = zapros(osnova + "/")
    if not zagolovki or not zagolovki.get("X-Kurs-Konfig"):
        oshibki.append("на главной нет заголовка X-Kurs-Konfig — vercel.json не прочитан")

    # Кэш: стили с отпечатком — на год (иначе каждый переход переспрашивает их у сервера),
    # страница и sw.js — без долгого кэша (иначе не придут правки и новая версия PWA)
    def kesh(adres):
        _, z, _ = zapros(osnova + adres)
        return (z.get("Cache-Control") or z.get("cache-control") or "") if z else ""
    stil = re.search(r'href="(/assets/sajt\.css\?v=[0-9a-f]{8})"', telo.decode("utf-8", "replace"))
    if not stil:
        oshibki.append("на главной нет sajt.css с отпечатком ?v= — сайт собран старым сборщиком")
    elif "immutable" not in kesh(stil.group(1)):
        oshibki.append(f"{stil.group(1)}: нет кэша на год (immutable) — правило vercel.json не сработало")
    for adres in ("/", "/sw.js"):
        if "immutable" in kesh(adres) or "max-age=0" not in kesh(adres):
            oshibki.append(f"{adres}: кэш «{kesh(adres)}», нужен max-age=0 — иначе правки не дойдут")

    print(f"Проверено: {len(zhivye)} адресов сайта, {len(LISHNEE)} лишних, 404, 308, заголовок конфига, кэш.")
    if oshibki:
        print(f"Расхождений: {len(oshibki)}")
        for stroka in oshibki:
            print("  ✗ " + stroka)
        return 1
    print("Расхождений нет.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
