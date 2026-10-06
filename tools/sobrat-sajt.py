#!/usr/bin/env python3
"""Сборка сайта курса «ИИ в учебном процессе»: content/ + skills/ → site/.

Запуск из корня проекта:

    python3 tools/sobrat-sajt.py

Что делает (проект сайта — docs/SAIT-PROEKT.md, §6):
  1. Лекции, бонусный урок, словарь и служебные страницы — из content/*.md.
  2. Блоки ```prompt → карточки «Копировать» / «Открыть в…»; все промпты курса
     собираются в библиотеку /promty/ — руками библиотека не пишется.
  3. Образцы текстов — из content/obrazcy/*.md → /obrazcy/ плюс .txt и .docx.
  4. Навыки — из skills/*/ → zip в site/files/navyki/ и каталог на /navyki/.
  5. Конспекты → .docx через pandoc (если pandoc установлен).
  6. Список нейросетей — из content/servisy.json → site/assets/servisy.js и главная.
  7. Главная и 404.

Проверки-сторожа — отдельно: tools/proverit-sajt.py.
Нужны: Python 3.12 и Python-Markdown 3.5; для .docx — pandoc.
"""

import datetime
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

import markdown
from markdown.extensions.toc import slugify_unicode

KOREN = Path(__file__).resolve().parent.parent
CONTENT = KOREN / "content"
SITE = KOREN / "site"
SKILLS = KOREN / "skills"
SHABLON = (KOREN / "tools" / "shablon-stranicy.html").read_text(encoding="utf-8")
SEGODNYA = datetime.date.today().isoformat()

# Порядок страниц-уроков и подписи над заголовком
UROKI = [
    ("lekciya-1", "Лекция 1"),
    ("lekciya-2", "Лекция 2"),
    ("lekciya-3", "Лекция 3"),
    ("bonus-navyki", "Бонусный урок 1"),
    ("bonus-illyustracii", "Бонусный урок 2"),
]

NAVYKI_RU = {
    "thinking-with-six-hats": "Шесть шляп мышления",
    "writing-in-styles": "Копирайтер в восьми стилях",
    "researching-literature": "Исследователь литературы",
    "spotting-ai-writing": "Проверка текста на следы ИИ",
    "editing-ai-writing": "Редактор ИИ-штампов",
    "illustrating-lessons": "Иллюстратор лекций",
    "niokr": "Отчёт о НИР по ГОСТ 7.32",
}

# 01.09.2026 00:00 UTC — дата редакции курса для метаданных .docx (SOURCE_DATE_EPOCH)
DATA_REDAKCII = int(datetime.datetime(2026, 9, 1, tzinfo=datetime.timezone.utc).timestamp())

# Навыки в работе — на сайт не попадают, пока не проверены (пример: {"niokr"} на время обезличивания)
NAVYKI_V_RABOTE = set()

PREDEL_OPISANIYA = 1024   # байт — предел Perplexity, замер автора 19.09.2026
PREDEL_FAJLOV = 100       # файлов в одном архиве навыка (5 — сколько навыков принимает одна загрузка)

zamechaniya = []


def zamechanie(tekst):
    zamechaniya.append(tekst)
    print("  ! " + tekst)


# ── Разбор md ─────────────────────────────────────────────────────────────────

# Зачёт — на сайте НГУ: видео лекций и итоговый тест из 10 вопросов. Тесты этого сайта —
# для самопроверки: среднего уровня (/test/) и повышенной сложности (/test/prodvinutyj/).
# Форма Google с ведомостью (tools/google-forma/) с 03.10.2026 не используется — ссылок на
# неё на сайте нет, чтобы не путать слушателей. Поток задаётся здесь; в текстах — {{potok}}.
POTOK = "1-й поток — с 15 октября 2026 года"

# Адреса сайта (решение автора 06.10.2026): основной — GitHub Pages, второй — Vercel; содержимое
# одно. Основной идёт в QR-код главной (tools/sobrat-qr.py), в ссылки скачанных .docx
# (в файле относительная ссылка никуда не ведёт) и в выгрузку вопросов; оба — рядом в подвале
# главной и на «О курсе» (подстановки {{adres_osnovnoj}} и {{adres_vtoroj}}).
ADRES_SAJTA = "https://barbashin1970.github.io/PROMPT-Professor"
ADRES_VTOROJ = "https://ai-in-the-education.vercel.app"
PODSTANOVKI_TEKSTA = {"{{potok}}": POTOK, "{{adres_osnovnoj}}": ADRES_SAJTA + "/",
                      "{{adres_vtoroj}}": ADRES_VTOROJ + "/"}

# Авторы заимствованных промптов: поле «avtor:» в шапке промпта → подпись на карточке
# и в .docx. Каждый автор назван и на «О курсе», в «Заимствованиях» — это сверяет сторож.
AVTORY_PROMPTOV = {
    "halilov": ("По материалам Дамира Халилова", "https://t.me/ai2smm", "канал «Промт дня»"),
}


def razobrat(put):
    """Шапка между строками --- и тело."""
    tekst = put.read_text(encoding="utf-8")
    for klyuch, znachenie in PODSTANOVKI_TEKSTA.items():
        tekst = tekst.replace(klyuch, znachenie)
    meta = {}
    m = re.match(r"^---\n(.*?)\n---\n", tekst, re.S)
    if m:
        for stroka in m.group(1).splitlines():
            klyuch, _, znachenie = stroka.partition(":")
            if klyuch.strip():
                meta[klyuch.strip()] = znachenie.strip()
        tekst = tekst[m.end():]
    return meta, tekst


BLOK_PROMPTA = re.compile(r"^```prompt\n(.*?)\n```[ \t]*$", re.S | re.M)


def razobrat_prompt(syroe):
    """Шапка промпта до первой строки --- (id, title, kogda, avtor), дальше — текст."""
    shapka, _, telo = syroe.partition("\n---\n")
    polya = {}
    for stroka in shapka.splitlines():
        klyuch, _, znachenie = stroka.partition(":")
        polya[klyuch.strip()] = znachenie.strip()
    return {
        "id": polya.get("id", ""),
        "title": polya.get("title", "Промпт"),
        "kogda": polya.get("kogda", ""),
        "avtor": polya.get("avtor", ""),
        "telo": telo.strip("\n"),
    }


def podpis_avtora(p):
    """(подпись, адрес, название ссылки) автора промпта или None."""
    if not p.get("avtor"):
        return None
    if p["avtor"] not in AVTORY_PROMPTOV:
        zamechanie(f"промпт {p['id']}: автор «{p['avtor']}» не описан в AVTORY_PROMPTOV")
        return None
    return AVTORY_PROMPTOV[p["avtor"]]


DLINNYJ_PROMPT = 60   # строк; длиннее — текст промпта на странице свёрнут


def podsvetit_podstanovki(tekst_html):
    """[ТЕМА] → <mark class="ph">[ТЕМА]</mark>; «[ ]» из чек-листов не трогаем."""
    return re.sub(r"\[([^\[\]\n]{2,120})\]", r'<mark class="ph">[\1]</mark>', tekst_html)


def kartochka_prompta(p, uroven="h3"):
    tid = "t-" + p["id"]
    nabor = f' data-svc-nabor="{html.escape(p["servisy"])}"' if p.get("servisy") else ""
    kogda = f'<p class="prompt__when">Когда: {html.escape(p["kogda"])}</p>' if p["kogda"] else ""
    avtor = podpis_avtora(p)
    if avtor:
        kogda += (f'\n      <p class="prompt__avtor">{html.escape(avtor[0])} — '
                  f'<a href="{html.escape(avtor[1])}">{html.escape(avtor[2])}</a></p>')
    telo = podsvetit_podstanovki(html.escape(p["telo"]))
    # Длинный промпт (самодиагностика — около 200 строк) свёрнут: на странице — заголовок,
    # кнопки и «Показать весь промпт». Кнопки копируют весь текст и из свёрнутого.
    strok = p["telo"].count("\n") + 1
    svernut = strok > DLINNYJ_PROMPT
    if svernut:
        slovo = "строка" if strok % 10 == 1 and strok % 100 != 11 else (
            "строки" if 2 <= strok % 10 <= 4 and not 12 <= strok % 100 <= 14 else "строк")
        nachalo = f'  <details class="prompt__razvernut"><summary>Показать весь промпт — {strok} {slovo}</summary>\n'
        konec = "  </details>\n"
    else:
        nachalo = konec = ""
    return (
        f'<section class="prompt" id="p-{p["id"]}" data-prompt>\n'
        f'  <div class="prompt__head">\n'
        f'    <div class="prompt__titles">\n'
        f'      <{uroven} class="prompt__title">{html.escape(p["title"])}</{uroven}>\n'
        f"      {kogda}\n"
        f"    </div>\n"
        f'    <div class="prompt__actions">\n'
        f'      <button class="btn btn--small" type="button" data-kopirovat="#{tid}">Копировать</button>\n'
        f'      <div class="svc" data-svc{nabor} data-kopirovat-pered="#{tid}">\n'
        f'        <button class="btn btn--small btn--primary" type="button" aria-haspopup="true" '
        f'aria-expanded="false" data-svc-knopka>Открыть в…</button>\n'
        f'        <ul class="svc__menu" hidden data-svc-menu></ul>\n'
        f"      </div>\n"
        f"    </div>\n"
        f"  </div>\n"
        f'{nachalo}  <div class="prompt__body" id="{tid}">{telo}</div>\n{konec}'
        f"</section>"
    )


# ── Преобразование md → html ──────────────────────────────────────────────────

GOLAYA_SSYLKA = re.compile(r"(?<![\(<\"\]=/])\b(https?://[^\s<>()\[\]]+[^\s<>()\[\].,;:!?»])")


def md_v_html(tekst, promty_sbor=None, uroven_prompta="h3"):
    """Возвращает (html, оглавление h2, список промптов страницы)."""
    promty = []

    def zamena_prompta(m):
        p = razobrat_prompt(m.group(1))
        promty.append(p)
        return f"\n\nPROMPTBLOK{len(promty) - 1}KONEC\n\n"

    tekst = BLOK_PROMPTA.sub(zamena_prompta, tekst)
    tekst = tekst.replace("<details>", '<details markdown="1">')
    tekst = re.sub(r"^(\s*)- \[ \] ", r"\1- ☐ ", tekst, flags=re.M)
    tekst = GOLAYA_SSYLKA.sub(r"<\1>", tekst)

    md = markdown.Markdown(
        extensions=["extra", "toc", "sane_lists", "md_in_html"],
        extension_configs={"toc": {"slugify": slugify_unicode, "toc_depth": "2-3"}},
    )
    rezultat = md.convert(tekst)

    for i, p in enumerate(promty):
        rezultat = rezultat.replace(f"<p>PROMPTBLOK{i}KONEC</p>", kartochka_prompta(p, uroven_prompta))
        if promty_sbor is not None:
            promty_sbor.append(p)

    oglavlenie = [(t["id"], t["name"]) for t in md.toc_tokens]
    return oformit_ssylki(rezultat), oglavlenie, promty


def oformit_ssylki(tekst_html):
    """Внешние ссылки открываются новой вкладкой того же браузера; вкладка курса остаётся на месте."""
    def zamena(m):
        href, atributy, nadpis = m.group(1), m.group(2), m.group(3)
        return (
            f'<a href="{href}"{atributy} class="ext" target="_blank" rel="noopener noreferrer" '
            f'data-ryadom>{nadpis}<span class="visually-hidden"> (откроется в новой вкладке)</span></a>'
        )
    return re.sub(r'<a href="(https?://[^"]+)"([^>]*)>(.*?)</a>', zamena, tekst_html, flags=re.S)


# ── Страница целиком ──────────────────────────────────────────────────────────

# Подвал — карта сайта по рецепту «толстого подвала» навыка apple-design-web. Здесь же
# все страницы, которые меню телефона показывает ниже черты: на широком экране их место —
# в подвале. Колонка уроков строится из UROKI, чтобы новый урок попадал сюда сам.
KRATKO_UROKOV = {
    "lekciya-1": "Как устроен ИИ",
    "lekciya-2": "Промпты и адаптация",
    "lekciya-3": "Агенты и проверка работ",
    "bonus-navyki": "Навыки",
    "bonus-illyustracii": "Нейроиллюстрации",
}
KARTA_SAJTA = [
    ("Инструменты", [("/promty/", "Библиотека промптов"), ("/konstruktor/", "Конструктор промптов"),
                     ("/navyki/", "Навыки для нейросетей"), ("/obrazcy/", "Образцы текстов"),
                     ("/slovar/", "Словарь терминов")]),
    ("Практика и самопроверка", [("/praktika/", "Самостоятельная практика"), ("/praktika/#nir", "Свой отчёт о НИР"),
                                 ("/test/", "Тест среднего уровня"), ("/test/prodvinutyj/", "Тест повышенной сложности"),
                                 ("/lekciya-1/#samodiagnostika", "Самодиагностика по Адизесу"),
                                 ("/praktika/#zachet", "Как сдать зачёт")]),
    ("О курсе", [("/o-kurse/", "Автор и программа"), ("/o-kurse/#ustanovit", "Курс на телефоне и ноутбуке"),
                 ("/o-kurse/#obratnaya-svyaz", "Обратная связь"),
                 ("/o-kurse/#licenzii", "Заимствования и лицензии")]),
]


def podpis_v_podvale(slug, podpis):
    kratko = KRATKO_UROKOV.get(slug)
    korotkaya = podpis.replace("Бонусный урок", "Бонус")
    return f"{korotkaya}. {kratko}" if kratko else korotkaya


def karta_sajta():
    uroki = [(f"/{slug}/", podpis_v_podvale(slug, podpis)) for slug, podpis in UROKI]
    kolonki = []
    for i, (zagolovok, ssylki) in enumerate([("Уроки", uroki)] + KARTA_SAJTA):
        punkty = "".join(f'<li><a href="{href}">{html.escape(tekst)}</a></li>' for href, tekst in ssylki)
        kolonki.append(f'<div class="foot__kolonka"><p class="foot__zag" id="podval-{i}">{html.escape(zagolovok)}</p>'
                       f'<ul aria-labelledby="podval-{i}">{punkty}</ul></div>')
    # внешние ссылки — новой вкладкой, как везде на сайте
    return oformit_ssylki('<nav class="foot__karta" aria-label="Карта сайта">' + "".join(kolonki) + "</nav>")


def stranica(title, description, soderzhimoe, tekushchij="", head_extra="", podval_dop=""):
    zamenitel = {
        "{{title}}": html.escape(title),
        "{{description}}": html.escape(description),
        "{{content}}": soderzhimoe,
        "{{date}}": SEGODNYA,
        "{{head_extra}}": head_extra,
        "{{karta_sajta}}": karta_sajta(),
        "{{podval_dop}}": podval_dop,
    }
    for razdel in ("lekcii", "promty", "konstruktor", "navyki", "test"):
        zamenitel["{{cur_" + razdel + "}}"] = ' aria-current="page"' if razdel == tekushchij else ""
    rezultat = SHABLON
    for klyuch, znachenie in zamenitel.items():
        rezultat = rezultat.replace(klyuch, znachenie)
    return rezultat


def zapisat(otnositelnyj_put, soderzhimoe):
    put = SITE / otnositelnyj_put
    put.parent.mkdir(parents=True, exist_ok=True)
    put.write_text(soderzhimoe, encoding="utf-8")


def razmer_faila(put):
    b = put.stat().st_size
    return f"{b / 1024:.0f} КБ" if b < 1024 * 1024 else f"{b / 1024 / 1024:.1f} МБ"


# ── .docx через pandoc ────────────────────────────────────────────────────────

def md_dlya_docx(tekst):
    def zamena(m):
        p = razobrat_prompt(m.group(1))
        kogda = f" Когда: {p['kogda']}." if p["kogda"] else ""
        avtor = podpis_avtora(p)
        if avtor:
            kogda += f" {avtor[0]} — [{avtor[2]}]({avtor[1]})."
        return f"**Промпт: {p['title']}.**{kogda}\n\n```\n{p['telo']}\n```"
    tekst = BLOK_PROMPTA.sub(zamena, tekst)
    tekst = re.sub(r"<details>\s*<summary>(.*?)</summary>", r"**\1**\n", tekst, flags=re.S)
    tekst = tekst.replace("</details>", "")
    tekst = re.sub(r"<!--.*?-->", "", tekst, flags=re.S)
    tekst = re.sub(r"\]\((/[^)]*)\)", lambda m: "](" + ADRES_SAJTA + m.group(1) + ")", tekst)
    return tekst


def sobrat_docx(title, tekst, vyhod):
    if not shutil.which("pandoc"):
        zamechanie(f"pandoc не найден — {vyhod.name} не собран")
        return False
    vyhod.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
        f.write(f"---\ntitle: \"{title}\"\nlang: ru\n---\n\n" + md_dlya_docx(tekst))
        vremennyj = f.name
    # Дата внутри .docx — одна на редакцию курса: иначе pandoc вписывает время сборки,
    # и каждая пересборка меняет все .docx в git, даже если текст тот же.
    okruzhenie = dict(os.environ, SOURCE_DATE_EPOCH=str(DATA_REDAKCII))
    rezultat = subprocess.run(["pandoc", "-f", "markdown", "-t", "docx", "-o", str(vyhod), vremennyj],
                              capture_output=True, text=True, env=okruzhenie)
    Path(vremennyj).unlink(missing_ok=True)
    if rezultat.returncode != 0:
        zamechanie(f"pandoc: {vyhod.name}: {rezultat.stderr.strip()[:200]}")
        return False
    return True


# ── Видео ─────────────────────────────────────────────────────────────────────
# С 30.09.2026 видео и слайды на сайт не выкладываются — по запросу у автора (решение
# автора): поле video: и slajdy: в шапке пустые, на странице — строка «по запросу».
# Встраивание оставлено на случай, если автор решит иначе.
# В шапке конспекта: video: <ссылка> — или несколько ссылок через « | » (части лекции).
# Яндекс Диск кода для встраивания не даёт и на чужих страницах показывает проверку
# «не робот», поэтому его ссылка — кнопка, видео открывается рядом с сайтом.
# RuTube и VK Видео дают официальный плеер — его встраиваем прямо в страницу.

def vstraivanie(url):
    m = re.search(r"rutube\.ru/(?:video|play/embed)/([0-9a-f]{32})", url)
    if m:
        return f"https://rutube.ru/play/embed/{m.group(1)}"
    m = re.search(r"(?:vkvideo\.ru|vk\.com)/video(-?\d+)_(\d+)", url)
    if m:
        return f"https://vkvideo.ru/video_ext.php?oid={m.group(1)}&id={m.group(2)}&hd=2"
    return None


def blok_video_uroka(pole):
    ssylki = [s.strip() for s in pole.split("|") if s.strip()]
    if not ssylki:
        return ""
    bloki = []
    for nomer, url in enumerate(ssylki, 1):
        chast = f"Часть {nomer}" if len(ssylki) > 1 else "Видео лекции"
        kod = vstraivanie(url)
        if kod:
            bloki.append(f'<div class="video"><iframe src="{html.escape(kod)}" title="{chast}" '
                         f'style="width:100%;height:100%;border:0;border-radius:inherit" '
                         f'allow="clipboard-write; autoplay; encrypted-media; fullscreen; picture-in-picture" '
                         f'allowfullscreen loading="lazy"></iframe></div>')
            continue
        gde = "на Яндекс Диске" if ("disk.yandex" in url or "yadi.sk" in url) else "по ссылке"
        bloki.append(
            f'<div class="dl"><span class="dl__name">{chast}</span>'
            f'<span class="dl__meta">откроется {gde} в новой вкладке</span>'
            f'<a class="btn btn--small btn--primary ext" href="{html.escape(url)}" target="_blank" '
            f'rel="noopener noreferrer" data-ryadom>Смотреть</a></div>'
        )
    return "\n".join(bloki)


# ── Уроки ─────────────────────────────────────────────────────────────────────

def sobrat_uroki(vse_promty):
    kartochki = []
    for slug, podpis in UROKI:
        put = CONTENT / f"{slug}.md"
        if not put.exists():
            zamechanie(f"нет {put.name}")
            continue
        meta, tekst = razobrat(put)
        promty_uroka = []
        telo, oglavlenie, _ = md_v_html(tekst, promty_uroka)
        # первый абзац — вводный: он встаёт под заголовок страницы
        m_lead = re.match(r"\s*<p>(.*?)</p>", telo, re.S)
        lead = ""
        if m_lead:
            lead = f'<p class="lead">{m_lead.group(1)}</p>'
            telo = telo[m_lead.end():]
        # Свой набор сервисов у урока (servisy: в шапке) — например, рисующие нейросети
        if meta.get("servisy"):
            telo = telo.replace('<div class="svc" data-svc data-kopirovat-pered=',
                                f'<div class="svc" data-svc data-svc-nabor="{html.escape(meta["servisy"])}" data-kopirovat-pered=')
        for p in promty_uroka:
            p["urok"] = slug
            p["podpis_uroka"] = podpis
            if meta.get("servisy"):
                p["servisy"] = meta["servisy"]
        vse_promty.extend(promty_uroka)

        zagolovok = re.sub(r"^(Лекция \d+|Бонусный урок(?: \d+)?)\.\s*", "", meta.get("title", slug))

        blok_video = blok_video_uroka(meta.get("video", ""))

        skachat = []
        slajdy = meta.get("slajdy", "")
        est_slajdy = bool(slajdy) and (SITE / slajdy.lstrip("/")).exists()
        if est_slajdy:
            skachat.append(f'<div class="dl"><span class="dl__name">Слайды лекции</span>'
                           f'<span class="dl__meta">PDF, {razmer_faila(SITE / slajdy.lstrip("/"))}</span>'
                           f'<a class="btn btn--small" href="{slajdy}" download>Скачать</a></div>')
        docx = SITE / "files" / f"konspekt-{slug}.docx"
        if sobrat_docx(meta.get("title", slug), tekst, docx):
            skachat.append(f'<div class="dl"><span class="dl__name">Конспект с промптами и практикой</span>'
                           f'<span class="dl__meta">DOCX, {razmer_faila(docx)} · сборка {SEGODNYA}</span>'
                           f'<a class="btn btn--small" href="/files/{docx.name}" download>Скачать</a></div>')
        if not blok_video and not est_slajdy:
            skachat.append('<p class="caption">Видео лекций — на сайте НГУ, где сдаётся зачёт. Слайды — '
                           'по запросу: <a href="/o-kurse/#obratnaya-svyaz">напишите автору</a>.</p>')

        toc = "".join(f'<li><a href="#{i}">{html.escape(n)}</a></li>' for i, n in oglavlenie)
        # data-urok: по нему sajt.js узнаёт урок и ставит «Назад к уроку» на страницах, открытых из него
        soderzhimoe = (
            f'<div class="wrap wrap--wide" data-urok="{slug}" data-urok-podpis="{html.escape(podpis)}">\n'
            f'<header class="page-head"><p class="kicker">{podpis}</p><h1>{html.escape(zagolovok)}</h1>{lead}</header>\n'
            f'<div class="layout-toc">\n'
            f'<nav class="toc" aria-label="Содержание"><ol>{toc}</ol></nav>\n'
            f'<article class="prose">\n{blok_video}\n<div class="downloads">{"".join(skachat)}</div>\n{telo}\n</article>\n'
            f"</div>\n</div>"
        )
        zapisat(f"{slug}/index.html",
                stranica(meta.get("title", slug), meta.get("description", ""), soderzhimoe, "lekcii"))
        kartochki.append((slug, podpis, zagolovok, meta.get("description", "")))
    return kartochki


# ── Библиотека промптов ───────────────────────────────────────────────────────

RAZDEL_PRAKTIKI = ("praktika", "Практика")


def sobrat_biblioteku(vse_promty):
    razdely = []
    for slug, podpis in UROKI + [RAZDEL_PRAKTIKI]:
        svoi = [p for p in vse_promty if p.get("urok") == slug]
        if not svoi:
            continue
        # через oformit_ssylki — ссылка на автора промпта открывается в новой вкладке, как в уроке
        kartochki = oformit_ssylki("\n".join(kartochka_prompta(p, "h3") for p in svoi))
        razdely.append(f'<section class="section" id="{slug}"><h2>{podpis}</h2>\n{kartochki}\n</section>')
    filtr = (
        '<div class="poisk"><label class="poisk__podpis" for="poisk">Найти промпт</label>'
        '<input class="poisk__pole" id="poisk" type="search" autocomplete="off" '
        'placeholder="например: тест, адаптация, эссе">'
        '<p class="caption poisk__itog" id="poisk-itog" aria-live="polite"></p></div>'
        "<script>(function(){var p=document.getElementById('poisk'),it=document.getElementById('poisk-itog');"
        "p.addEventListener('input',function(){var q=p.value.trim().toLowerCase(),n=0;"
        "document.querySelectorAll('[data-prompt]').forEach(function(k){var v=!q||k.textContent.toLowerCase().indexOf(q)>-1;"
        "k.hidden=!v;if(v)n++;});it.textContent=q?('Найдено: '+n):'';});})();</script>"
    )
    navigaciya = " · ".join(f'<a href="#{s}">{p}</a>' for s, p in UROKI + [RAZDEL_PRAKTIKI]
                            if any(x.get("urok") == s for x in vse_promty))
    soderzhimoe = (
        '<div class="wrap wrap--wide"><header class="page-head"><p class="kicker">Библиотека</p>'
        f'<h1>Промпты курса</h1><p class="lead">Все {len(vse_promty)} промптов курса — из трёх лекций, '
        'двух бонусных уроков и практики. '
        'Нажмите «Копировать» или «Открыть в…» — промпт скопируется, а нейросеть откроется в новой вкладке. '
        'Подсвеченные места в квадратных скобках замените своими данными. '
        'Знаете, как улучшить промпт, — <a href="/o-kurse/#obratnaya-svyaz">напишите автору</a>.</p></header>'
        f'<p>{navigaciya}</p>{filtr}\n{"".join(razdely)}</div>'
    )
    zapisat("promty/index.html", stranica("Промпты курса",
            "Все промпты курса «ИИ в учебном процессе»: скопировать и открыть в нейросети рядом.",
            soderzhimoe, "promty"))


# ── Образцы текстов ───────────────────────────────────────────────────────────

def sobrat_obrazcy():
    papka = CONTENT / "obrazcy"
    kartochki = []
    for put in sorted(papka.glob("*.md")) if papka.exists() else []:
        meta, tekst = razobrat(put)
        imya = put.stem
        tekst = tekst.strip()
        (SITE / "files" / "obrazcy").mkdir(parents=True, exist_ok=True)
        txt = SITE / "files" / "obrazcy" / f"{imya}.txt"
        txt.write_text(tekst + "\n", encoding="utf-8")
        docx = SITE / "files" / "obrazcy" / f"{imya}.docx"
        est_docx = sobrat_docx(meta.get("title", imya), tekst, docx)
        tid = f"o-{imya}"
        knopki = (f'<button class="btn btn--small" type="button" data-kopirovat="#{tid}" '
                  f'data-soobshchenie="Текст скопирован.">Копировать текст</button>'
                  f'<a class="btn btn--small" href="/files/obrazcy/{imya}.txt" download>Скачать .txt</a>')
        if est_docx:
            knopki += f'<a class="btn btn--small" href="/files/obrazcy/{imya}.docx" download>Скачать .docx</a>'
        kartochki.append(
            f'<section class="prompt obrazec" id="{imya}">'
            f'<div class="prompt__head"><div class="prompt__titles"><h2 class="prompt__title">{html.escape(meta.get("title", imya))}</h2>'
            f'<p class="prompt__when">{html.escape(meta.get("opisanie", ""))}</p></div>'
            f'<div class="prompt__actions">{knopki}</div></div>'
            f'<div class="prompt__body" id="{tid}">{html.escape(tekst)}</div></section>'
        )
    soderzhimoe = (
        '<div class="wrap"><header class="page-head"><p class="kicker">Для упражнений</p><h1>Образцы текстов</h1>'
        '<p class="lead">Тексты для упражнений лекций: скопируйте в нейросеть или скачайте файлом.</p></header>'
        + "\n".join(kartochki) + "</div>"
    )
    zapisat("obrazcy/index.html", stranica("Образцы текстов",
            "Тексты для упражнений курса: скопировать или скачать.", soderzhimoe))


# ── Навыки ────────────────────────────────────────────────────────────────────

def opisanie_navyka(put_skill):
    tekst = put_skill.read_text(encoding="utf-8")
    m = re.search(r'^description: "(.*?)"\s*$', tekst, re.M)
    return m.group(1) if m else ""


def zagolovok_navyka(skill):
    """Первый заголовок «# …» из SKILL.md — название для навыка, которого нет в NAVYKI_RU."""
    m = re.search(r"(?m)^# (.+)$", skill.read_text(encoding="utf-8").split("\n---\n", 1)[-1])
    return m.group(1).strip() if m else ""


def sobrat_navyki():
    (SITE / "files" / "navyki").mkdir(parents=True, exist_ok=True)
    kartochki = []
    # Порядок — как в NAVYKI_RU; новая папка в skills/ с SKILL.md попадает на сайт сама
    novye = sorted(p.parent.name for p in SKILLS.glob("*/SKILL.md") if p.parent.name not in NAVYKI_RU)
    # Навык в работе не публикуется: PROPUSTIT_NAVYKI=imya1,imya2 python3 tools/sobrat-sajt.py
    propustit = {s.strip() for s in os.environ.get("PROPUSTIT_NAVYKI", "").split(",") if s.strip()}
    propustit |= NAVYKI_V_RABOTE
    for imya in [i for i in list(NAVYKI_RU) + novye if i not in propustit]:
        papka = SKILLS / imya
        skill = papka / "SKILL.md"
        if not skill.exists():
            zamechanie(f"навык {imya}: нет SKILL.md — пропущен")
            continue
        # Служебное не попадает в архив: скрытые файлы и папки (.DS_Store, ._*, .obsidian —
        # Obsidian кладёт её в папку, открытую как хранилище), __MACOSX, __pycache__
        fajly = sorted(p for p in papka.rglob("*")
                       if p.is_file() and p.name not in {"Thumbs.db", "desktop.ini"} and p.suffix != ".pyc"
                       and not any(ch.startswith(".") or ch in {"__MACOSX", "__pycache__"}
                                   for ch in p.relative_to(papka).parts))
        if any(p.suffix.lower() == ".pdf" for p in fajly):
            zamechanie(f"навык {imya}: внутри PDF — архив не собирается")
            continue
        opisanie = opisanie_navyka(skill)
        bajty = len(opisanie.encode("utf-8"))
        if bajty > PREDEL_OPISANIYA:
            zamechanie(f"навык {imya}: описание {bajty} байт > {PREDEL_OPISANIYA}")
        if len(fajly) > PREDEL_FAJLOV:
            zamechanie(f"навык {imya}: {len(fajly)} файлов > {PREDEL_FAJLOV}")
        arhiv = SITE / "files" / "navyki" / f"{imya}.zip"
        with zipfile.ZipFile(arhiv, "w", zipfile.ZIP_DEFLATED) as z:
            for p in fajly:
                z.write(p, p.relative_to(papka).as_posix())
        spisok = ", ".join(p.relative_to(papka).as_posix() for p in fajly)
        kartochki.append(
            f'<div class="card"><p class="num">{html.escape(imya)}</p><h3>{html.escape(NAVYKI_RU.get(imya) or zagolovok_navyka(skill) or imya)}</h3>'
            f"<p>{html.escape(opisanie)}</p>"
            f'<p class="caption">Файлы: {html.escape(spisok)} · описание {bajty} байт · zip {razmer_faila(arhiv)}</p>'
            f'<div class="btn-row"><a class="btn btn--primary" href="/files/navyki/{imya}.zip" download>Скачать zip</a></div></div>'
        )
    return '<div class="card-grid">' + "\n".join(kartochki) + "</div>"


# ── Служебные страницы из md ──────────────────────────────────────────────────

def sobrat_prostuyu(slug, podstanovki=None, tekushchij="", promty_sbor=None, podpis=""):
    meta, tekst = razobrat(CONTENT / f"{slug}.md")
    for klyuch, znachenie in (podstanovki or {}).items():
        tekst = tekst.replace(klyuch, znachenie)
    promty = []
    telo, _, _ = md_v_html(tekst, promty)
    # промпты простой страницы (например, практики) тоже идут в библиотеку — своим разделом
    if promty_sbor is not None:
        for p in promty:
            p["urok"], p["podpis_uroka"] = slug, podpis
        promty_sbor.extend(promty)
    soderzhimoe = (f'<div class="wrap"><header class="page-head"><h1>{html.escape(meta.get("title", slug))}</h1></header>'
                   f'<article class="prose">{telo}</article></div>')
    zapisat(f"{slug}/index.html", stranica(meta.get("title", slug), meta.get("description", ""),
                                           soderzhimoe, tekushchij))


# ── Нейросети, главная, 404 ───────────────────────────────────────────────────

def sobrat_servisy(dannye):
    js = (
        "/* Собрано из content/servisy.json сценарием tools/sobrat-sajt.py — правьте JSON, а не этот файл. */\n"
        f"window.PROVERENO = {json.dumps(dannye['provereno'])};\n"
        f"window.SERVISY = {json.dumps(dannye['servisy'], ensure_ascii=False, indent=2)};\n"
        f"window.INSTRUMENTY = {json.dumps(dannye['instrumenty'], ensure_ascii=False, indent=2)};\n"
        f"window.SERVISY_NABORY = {json.dumps(dannye.get('nabory', {}), ensure_ascii=False, indent=2)};\n"
    )
    zapisat("assets/servisy.js", js)


def ssylka_ryadom(s):
    return (f'<a class="card card--link" href="{s["url"]}" target="_blank" rel="noopener noreferrer" data-ryadom>'
            f'<h3 class="ext">{html.escape(s["imya"])}</h3><p>{html.escape(s["zachem"])}</p>'
            f'<span class="visually-hidden"> (откроется в новой вкладке)</span></a>')


def sobrat_glavnuyu(uroki, dannye, primer_prompta):
    kartochki = "\n".join(
        f'<a class="card card--link" href="/{slug}/"><p class="num">{podpis}</p><h3>{html.escape(zag)}</h3>'
        f"<p>{html.escape(opis)}</p></a>"
        for slug, podpis, zag, opis in uroki
    )
    servisy = "\n".join(ssylka_ryadom(s) for s in dannye["servisy"])
    instrumenty = "\n".join(ssylka_ryadom(s) for s in dannye["instrumenty"])
    primer = kartochka_prompta(primer_prompta, "h3") if primer_prompta else ""
    # Обложка: картинка автора (Qwen Chat, промпт стиля 1 бонусного урока 2) — фоном справа,
    # на телефоне баннером над текстом; раскладка — в sajt.css, раздел «Обложка главной».
    soderzhimoe = f"""<div class="wrap wrap--wide">
<header class="page-head oblozhka">
  <img class="oblozhka__fon" src="/kartinki/glavnaya/oblozhka-1664.jpg"
    srcset="/kartinki/glavnaya/oblozhka-832.jpg 832w, /kartinki/glavnaya/oblozhka-1664.jpg 1664w"
    sizes="(max-width: 734px) 100vw, 680px" width="1664" height="928" alt="" fetchpriority="high">
  <div class="oblozhka__tekst">
  <p class="kicker">Курс повышения квалификации · Новосибирский государственный университет</p>
  <p class="oblozhka__potok">{POTOK} · всё уже открыто</p>
  <h1>ИИ в учебном процессе</h1>
  <p class="lead">Три лекции и два бонусных урока: как готовить материалы, проверять работы
  и собирать своих помощников — на бесплатных нейросетях.</p>
  <div class="btn-row"><a class="btn btn--primary" href="/lekciya-1/">Начать с лекции 1</a>
  <a class="btn" href="/promty/">Библиотека промптов</a><a class="btn" href="/konstruktor/">Конструктор промптов</a></div>
  </div>
  <p class="oblozhka__podpis">Картинку автор курса нарисовал в Qwen Chat по
  <a href="/bonus-illyustracii/#stil-1">промпту стиля 1</a> из бонусного урока 2.</p>
</header>

<section class="section">
  <h2>Как проходить курс</h2>
  <div class="card-grid">
    <div class="card"><p class="num">Шаг 1</p><h3>Читайте лекцию</h3><p>Конспект с примерами, промптами и источниками — на странице лекции, его можно скачать в DOCX. Видео лекций — на сайте НГУ, слайды — по запросу.</p></div>
    <div class="card"><p class="num">Шаг 2</p><h3>Пробуйте промпты</h3><p>«Открыть в…» копирует промпт и открывает нейросеть в новой вкладке — вкладка курса остаётся открытой.</p></div>
    <div class="card"><p class="num">Шаг 3</p><h3>Практика и самопроверка</h3><p>После лекции — <a href="/praktika/">самостоятельная практика</a> для себя, сдавать ничего не нужно. Проверьте себя в тестах <a href="/test/">среднего уровня</a> и <a href="/test/prodvinutyj/">повышенной сложности</a> и в <a href="/lekciya-1/#samodiagnostika">самодиагностике по Адизесу</a>. Зачёт — на сайте НГУ: итоговый тест из 10 вопросов.</p></div>
  </div>
</section>

<section class="section" id="lekcii">
  <h2>Лекции</h2>
  <div class="card-grid">{kartochki}</div>
</section>

<section class="section">
  <h2>Попробуйте прямо сейчас</h2>
  <p class="caption">Промпт из лекции 1. Замените подсвеченное своими данными.</p>
  {primer}
</section>

<section class="section">
  <h2>Нейросети</h2>
  <p class="caption">Открываются в новой вкладке. Бесплатность и доступность проверены {dannye['provereno']}; тарифы меняются — смотрите справку сервиса.</p>
  <div class="card-grid">{servisy}</div>
  <h3>Инструменты</h3>
  <div class="card-grid">{instrumenty}</div>
</section>

<section class="section">
  <h2>Ещё на сайте</h2>
  <div class="card-grid">
    <a class="card card--link" href="/navyki/"><h3>Навыки</h3><p>Помощники курса — скачать zip и поставить.</p></a>
    <a class="card card--link" href="/obrazcy/"><h3>Образцы текстов</h3><p>Тексты для упражнений: скопировать или скачать.</p></a>
    <a class="card card--link" href="/slovar/"><h3>Словарь</h3><p>Термины курса одним списком.</p></a>
    <a class="card card--link" href="/o-kurse/"><h3>О курсе</h3><p>Автор, программа, источники и лицензии.</p></a>
  </div>
</section>
</div>"""
    # Два QR-кода — только в подвале главной, по краям, чтобы камера не путала соседние:
    # слева основной адрес (GitHub Pages), справа второй (Vercel). Автор показывает их
    # в видео, слушатели сканируют с экрана. Картинки делает tools/sobrat-qr.py.
    def karta_qr(adres, kartinka, metka, klass):
        tekst = adres.split("://", 1)[-1]
        return (f'<figure class="foot__qr-karta {klass}">'
                f'<img src="/assets/{kartinka}" width="164" height="164" alt="QR-код: {metka.lower()} сайта курса, {tekst}" '
                f'loading="lazy" decoding="async"><figcaption><span class="foot__qr-metka">{metka}</span>'
                f'<a class="foot__qr-adres ext" href="{adres}/" target="_blank" rel="noopener noreferrer" data-ryadom>'
                f'{tekst}<span class="visually-hidden"> (откроется в новой вкладке)</span></a></figcaption></figure>')
    qr = ('<div class="foot__qr">'
          + karta_qr(ADRES_SAJTA, "qr-sajt.svg", "Основной адрес", "foot__qr-karta--osnovnoj")
          + '<p class="foot__qr-zag">Сайт курса — наведите камеру телефона на любой из кодов. '
            'Содержимое одно: если один адрес открывается медленно, откройте другой.</p>'
          + karta_qr(ADRES_VTOROJ, "qr-sajt-vtoroj.svg", "Второй адрес", "foot__qr-karta--vtoroj")
          + '</div>')
    zapisat("index.html", stranica("Главная",
            "Курс Новосибирского государственного университета «ИИ в учебном процессе»: лекции, промпты, конструктор, навыки и тесты для самопроверки.",
            oformit_ssylki(soderzhimoe), podval_dop=qr))


def sobrat_404():
    soderzhimoe = ('<div class="wrap"><header class="page-head"><p class="kicker">Ошибка 404</p><h1>Такой страницы нет</h1>'
                   '<p class="lead">Возможно, адрес изменился. Начните с <a href="/">главной</a> '
                   'или откройте <a href="/promty/">библиотеку промптов</a>.</p></header></div>')
    # noindex и без canonical: настоящей страницы по этому адресу нет (урок spa-catchall-rewrite-is-a-soft-404)
    zapisat("404.html", stranica("Страница не найдена", "Такой страницы на сайте курса нет.", soderzhimoe,
                                 head_extra='<meta name="robots" content="noindex">'))


# ── Сборка ────────────────────────────────────────────────────────────────────

# ── Версии общих файлов ───────────────────────────────────────────────────────
# Стили, скрипты и картинки отдаются с кэшем на год (vercel.json, immutable), и браузер
# не переспрашивает о них на каждом переходе — на медленном канале это лишний круг до
# сервера перед отрисовкой. Чтобы правка всё же доходила, к адресу приписывается отпечаток
# содержимого ?v=<8 знаков sha256>: изменился файл — изменился адрес. Проставляется во всех
# страницах, и в рукописных тоже; сторож сверяет отпечатки с файлами.

ATRIBUT_S_ADRESOM = re.compile(r'\b(src|href|srcset)="([^"]*)"')
# /files/ — тоже с отпечатком: service worker хранит скачиваемые файлы и по нему видит,
# что файл не менялся (кэш на год для /files/ не ставится — на них бывают прямые ссылки).
VERSIONIRUEMYJ_PUT = re.compile(
    r"(/(?:assets|kartinki|files)/[^\s?#,\"]+|/test/(?:prodvinutyj/)?(?:test|voprosy)\.js)(?:\?v=[0-9a-f]{8})?")


def otpechatok(put, kesh={}):
    """Первые 8 знаков sha256 файла сайта по его адресу; None — файла нет."""
    if put not in kesh:
        fajl = SITE / put.lstrip("/")
        kesh[put] = hashlib.sha256(fajl.read_bytes()).hexdigest()[:8] if fajl.is_file() else None
    return kesh[put]


def prostavit_versii():
    def v_znachenii(m):
        put = m.group(1)
        v = otpechatok(put)
        return f"{put}?v={v}" if v else m.group(0)

    def v_atribute(m):
        return f'{m.group(1)}="{VERSIONIRUEMYJ_PUT.sub(v_znachenii, m.group(2))}"'

    for stranica in SITE.rglob("*.html"):
        staryj = stranica.read_text(encoding="utf-8")
        novyj = ATRIBUT_S_ADRESOM.sub(v_atribute, staryj)
        if novyj != staryj:
            stranica.write_text(novyj, encoding="utf-8")


# ── PWA: manifest и service worker ────────────────────────────────────────────
# Курс можно поставить на экран «Домой», а страницы открываются из сохранённого на
# устройстве — сразу и без связи. Service worker собирается из tools/shablon-sw.js: версия
# меняется с любой правкой страниц и файлов, и устройства сохраняют курс заново. Видео он
# не сохраняет. Иконки — tools/sobrat-ikonki.js.

IKONKI_PWA = [("/assets/ikonka-192.png", "192x192", None),
              ("/assets/ikonka-512.png", "512x512", None),
              ("/assets/ikonka-maskable-512.png", "512x512", "maskable")]


def s_otpechatkom(put):
    v = otpechatok(put)
    if v is None:
        zamechanie(f"PWA: нет файла {put}")
        return put
    return f"{put}?v={v}"


def fajl_po_adresu(adres):
    put = adres.split("?", 1)[0]
    return SITE / (put.lstrip("/") + "index.html" if put.endswith("/") else put.lstrip("/"))


def sobrat_pwa():
    manifest = {
        "id": "/",
        "name": "ИИ в учебном процессе — курс НГУ",
        "short_name": "ИИ в учёбе",
        "description": "Курс для преподавателей: лекции, промпты, практика и тест — и без связи.",
        "lang": "ru",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "background_color": "#f5f5f7",
        "theme_color": "#f5f5f7",
        "icons": [{"src": s_otpechatkom(p), "sizes": r, "type": "image/png", **({"purpose": c} if c else {})}
                  for p, r, c in IKONKI_PWA],
    }
    zapisat("manifest.webmanifest", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

    # Сохраняется сразу всё своё, кроме видео и аудио: страницы, стили, скрипты, картинки,
    # скачиваемые файлы, manifest и иконки — после первого визита курс работает и без связи.
    # Адреса с отпечатком — те же, что на страницах: по ним service worker находит файл.
    stranicy, fajly = [], []
    for p in sorted(SITE.rglob("*")):
        otn = p.relative_to(SITE).as_posix()
        if (not p.is_file() or any(ch.startswith(".") for ch in otn.split("/"))
                or otn in ("sw.js", "404.html") or re.search(r"\.(mp4|m4v|webm|mov|mkv|avi|mp3|m4a|aac|ogg|oga|wav|flac)$", otn, re.I)):
            continue
        if p.name == "index.html":
            papka = p.parent.relative_to(SITE).as_posix()
            stranicy.append("/" if papka == "." else f"/{papka}/")
        elif VERSIONIRUEMYJ_PUT.fullmatch("/" + otn):
            fajly.append(s_otpechatkom("/" + otn))
        else:
            fajly.append("/" + otn)
    predzagruzka = stranicy + fajly
    for adres in predzagruzka:
        if not fajl_po_adresu(adres).is_file():
            zamechanie(f"PWA: в списке сохранения нет файла для {adres}")
    otpechatki = "\n".join(f"{a} {hashlib.sha256(fajl_po_adresu(a).read_bytes()).hexdigest()}"
                           for a in predzagruzka if fajl_po_adresu(a).is_file())
    versiya = hashlib.sha256(otpechatki.encode("utf-8")).hexdigest()[:12]
    shablon = (KOREN / "tools" / "shablon-sw.js").read_text(encoding="utf-8")
    zapisat("sw.js", shablon.replace("__VERSIYA__", versiya)
            .replace("__PREDZAGRUZKA__", json.dumps(predzagruzka, ensure_ascii=False, indent=2)))
    print(f"  PWA: версия {versiya}, сохраняется сразу {len(predzagruzka)} адресов")


def main():
    print(f"Сборка сайта → {SITE}")
    dannye = json.loads((CONTENT / "servisy.json").read_text(encoding="utf-8"))
    sobrat_servisy(dannye)

    vse_promty = []
    uroki = sobrat_uroki(vse_promty)
    sobrat_prostuyu("praktika", promty_sbor=vse_promty, podpis=RAZDEL_PRAKTIKI[1])
    print(f"  уроков: {len(uroki)}, промптов: {len(vse_promty)}")

    idy = [p["id"] for p in vse_promty]
    povtory = sorted({i for i in idy if idy.count(i) > 1})
    if povtory:
        zamechanie(f"повторяются id промптов: {', '.join(povtory)}")
    if any(not p["id"] for p in vse_promty):
        zamechanie("есть промпт без id")

    sobrat_biblioteku(vse_promty)
    sobrat_obrazcy()

    sobrat_prostuyu("slovar")
    sobrat_prostuyu("o-kurse")
    sobrat_prostuyu("navyki", {"{{katalog_navykov}}": sobrat_navyki()}, "navyki")

    # Сценарий замера токенов (tools/zamer-tokenov.py) на сайт не выкладывается: 30.09.2026
    # автор убрал ссылку из лекции 1 — файл по ссылке «зависал», слушателям он лишний.

    # Картинки уроков: источник — content/kartinki/, на сайте — /kartinki/
    kartinki = CONTENT / "kartinki"
    if kartinki.exists():
        shutil.copytree(kartinki, SITE / "kartinki", dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns(".*"))

    # Вопросы тестов: среднего уровня и повышенной сложности; движок у обоих один — site/test/test.js
    for istochnik, kuda in (("test-voprosy.js", "test"), ("test-prodvinutyj.js", "test/prodvinutyj")):
        voprosy = CONTENT / istochnik
        if voprosy.exists():
            (SITE / kuda).mkdir(parents=True, exist_ok=True)
            shutil.copyfile(voprosy, SITE / kuda / "voprosy.js")
        else:
            zamechanie(f"нет content/{istochnik} — тест без вопросов")

    primer = next((p for p in vse_promty if p["id"] == "l1-test-po-formule"), None)
    sobrat_glavnuyu(uroki, dannye, primer)
    sobrat_404()

    # Рукописные страницы (тест, конструктор) получают тот же подвал, что и собранные:
    # карта сайта и дата сборки не расходятся, править подвал нужно только в шаблоне.
    podval = re.search(r'<footer class="foot">.*?</footer>', stranica("", "", ""), re.S).group(0)
    for ruchnaya in ("test/index.html", "test/prodvinutyj/index.html", "konstruktor/index.html"):
        put = SITE / ruchnaya
        if not put.exists():
            continue
        staryj = put.read_text(encoding="utf-8")
        novyj, n = re.subn(r'<footer class="foot">.*?</footer>', lambda m: podval, staryj, flags=re.S)
        # поток — из той же константы, что в текстах сайта
        novyj = re.sub(r"(<span data-potok>).*?(</span>)", lambda m: m.group(1) + POTOK + m.group(2), novyj)
        if n != 1:
            zamechanie(f"{ruchnaya}: подвал не найден — не подставлен")
        elif novyj != staryj:
            put.write_text(novyj, encoding="utf-8")

    prostavit_versii()
    sobrat_pwa()

    print(f"Готово. Замечаний: {len(zamechaniya)}.")
    return 1 if zamechaniya else 0


if __name__ == "__main__":
    sys.exit(main())
