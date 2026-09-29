#!/usr/bin/env python3
"""Счётчик признаков ИИ-текста по каталогу references/priznaki-ii-teksta.md.

Запуск:
    python3 scripts/schitat-priznaki.py ФАЙЛ [ФАЙЛ …]
    cat текст.txt | python3 scripts/schitat-priznaki.py
    python3 scripts/schitat-priznaki.py --sverit ИСХОДНИК ПРАВКА

Считает то, что ловится поиском. Смысловые признаки — ложное ли противопоставление (А3),
всё ли по три (Б2), повтор конструкции (Б5), подтверждает ли ссылка сказанное (Г6),
несоответствие автору (Ж) — определяет только чтение по каталогу.

Перед поиском строки каждого абзаца и пункта склеиваются, а разметка снимается: перенос
строки не прячет «не только…, но и». Не считаются упоминания: текст в «ёлочках»
и "лапках", `код`, блоки кода (в том числе промпты), цитаты (строки с >),
HTML-комментарии, адреса ссылок и устойчивые термины вроде «условия использования».
Жирный считается раздельно: внутри фраз — возможный признак; метки в начале абзаца,
пункта или ячейки таблицы — норма учебного текста.

Число — не приговор: это повод перечитать места, которые скрипт показал.
Плотность считается на 1000 слов, чтобы сравнивать тексты разной длины.

Режим --sverit сверяет правку с исходником: ссылки, числа, текст в «ёлочках», блоки
кода, цитаты, якоря и шапка должны совпасть. Код выхода 1 — есть расхождения.
"""

import re
import statistics
import sys
from collections import Counter
from pathlib import Path

PRIZNAKI = {
    "А1 вводная-пустышка": [
        r"важно отметить", r"важно подчеркнуть", r"следует (?:отметить|подчеркнуть)",
        r"стоит (?:отметить|подчеркнуть|обратить внимание)", r"необходимо (?:отметить|подчеркнуть)",
        r"нельзя не (?:упомянуть|отметить)", r"(?:^|(?<=[.!?]\s))важно:",
    ],
    "А2 раздутая значимость": [
        r"игра(?:ет|ют|л[аои]?) (?:ключевую|важную|решающую|огромную|значительную) роль",
        r"име(?:ет|ют) (?:огромное|большое|ключевое|важнейшее) значение",
        r"неотъемлем\w* част\w*", r"открыва(?:ет|ют) новые (?:горизонты|возможности)",
        r"в современном мире", r"в эпоху цифровизации",
    ],
    "А3 противопоставление по форме": [
        r"не просто [^.,;!?]{1,60}, а\b", r"не только [^.;!?]{1,60}, но и\b",
    ],
    "А4 обещание вместо содержания": [
        r"давайте (?:разбер[её]мся|рассмотрим|погрузимся)", r"погруз\w+ в (?:тему|мир)",
        r"рассмотрим подробнее",
    ],
    "А5 мораль в конце": [
        r"таким образом,? можно (?:сделать вывод|заключить)", r"подводя итог",
        r"в заключение (?:стоит|следует|отметим|можно)",
    ],
    "Б4 механическая связка": [
        r"(?:^|(?<=[.!?]\s))(?:кроме того|более того|помимо этого|во-первых|во-вторых|в-третьих)\b",
    ],
    "В1 является / представляет собой": [
        r"\bявля(?:ется|ются|лся|лась|лось|лись|ясь)\b", r"представля(?:ет|ют) (?:собой|из себя)",
    ],
    "В2 отглагольное существительное": [
        r"\b(?:использовани|применени|осуществлени|реализаци|функционировани|взаимодействи|формировани)\w*",
    ],
    "В3 калька": [
        r"делает возможным", r"является базовым", r"имеет место быть", r"адресовать проблему",
    ],
    "В6 канцелярский указатель": [
        r"\bданн(?:ый|ая|ое|ого|ой|ому|ую)\b", r"\bв рамках\b", r"\bс последующ\w+",
        r"\bв целях\b", r"\bна сегодняшний день\b", r"\bв настоящее время\b",
    ],
    "Г1 авторитет без адреса": [
        r"исследования показывают", r"уч[её]ные (?:считают|доказали|установили)",
        r"по мнению экспертов", r"эксперты (?:считают|отмечают)", r"как известно",
    ],
    "Г4 рекламный тон": [
        r"революционн\w+", r"беспрецедентн\w+", r"инновационн\w+ подход\w*", r"уникальн\w+ возможност\w*",
    ],
    "Е1 обращение к пользователю": [
        r"конечно!? вот", r"надеюсь, это поможет", r"если хотите,? (?:я )?могу",
    ],
    "Е2 оговорка модели": [
        r"как (?:большая )?языковая модель,? я\b", r"на момент моего обучения", r"я не могу просматривать",
    ],
    "Е5 метка сервиса в ссылке": [
        r"utm_source=chatgpt", r"oaicite",
    ],
    "З1 шаблонный разговорный зачин": [
        r"(?:^|(?<=[.!?…]\s))(?:знаете|смотрите|короче|представьте),", r"и вот (?:штука|тут начинается)",
        r"а тут\s*[–—-]\s*раз",
    ],
    "З2 выдуманный личный опыт": [
        r"когда я впервые", r"для меня лично", r"я (?:сам )?(?:не раз )?сталкивал\w*", r"я не раз видел",
    ],
    "З3 восклицательная оценка": [
        r"нечто невероятное", r"гениальн\w+ решени\w*", r"поразительн\w+", r"потрясающ\w+",
    ],
}

# Устойчивые термины: находка внутри них не считается
ISKLYUCHENIYA = {
    "В2 отглагольное существительное": [
        r"(?:област|сфер)\w* применени\w*",
        r"(?:услови|правил|политик|срок|способ|инструкци)\w* (?:по )?(?:использовани|применени)\w*",
    ],
}

# Места для перечитывания: не считаются в итог, их проверяет человек
PROVERIT = {
    "Е7 отсылка — есть ли то, на что она указывает": [
        r"как (?:показано|сказано|отмечено|указано) выше", r"\bсм\. (?:выше|ниже)",
        r"в (?:таблице|схеме|списке|примере) ниже", r"(?:числа|цифры) (?:тут|здесь) условн\w+",
    ],
}

# Признаки, которые ищутся по сырому тексту до очистки (сноски, заголовки-вопросы)
SYRYE = {
    "Г5 пачка сносок": r"(?:\[\d+\]\s*){3,}",
    "З4 заголовок-вопрос": r"(?m)^(?:#+\s*)?(?:\*\*)?[^\n.!]{2,50}\?(?:\*\*)?\s*$",
}

MARKER = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+")


def ochistit(tekst):
    """Убирает то, что не является прозой автора: шапку, код, цитаты, упоминания."""
    tekst = re.sub(r"^---\n.*?\n---\n", "", tekst, flags=re.S)
    tekst = re.sub(r"```.*?```", "", tekst, flags=re.S)
    tekst = re.sub(r"<!--.*?-->", "", tekst, flags=re.S)
    tekst = re.sub(r"^\s*>.*$", "", tekst, flags=re.M)
    tekst = re.sub(r"`[^`\n]*`", "", tekst)
    tekst = re.sub(r"\]\([^)]*\)", "]", tekst)
    tekst = re.sub(r"https?://\S+", "", tekst)
    tekst = re.sub(r"«[^«»]{0,300}»", "", tekst)  # цитата может переходить через строку
    tekst = re.sub(r"\"[^\"\n]*\"", "", tekst)
    tekst = re.sub(r"</?[a-z][^>]*>", " ", tekst)
    return tekst


def snyat_razmetku(s):
    s = re.sub(r"\{#[^}]*\}", "", s)
    s = re.sub(r"^#+\s*", "", s)
    s = s.replace("**", "").replace("__", "")
    s = re.sub(r"(?<!\w)\*(?=\S)|(?<=\S)\*(?!\w)", "", s)
    return re.sub(r"\s+", " ", s).strip()


def edinicy(chistyj):
    """Абзацы, пункты списков, заголовки и строки таблиц — каждый одной строкой, с разметкой."""
    for blok in re.split(r"\n[ \t]*\n", chistyj):
        stroki = [s for s in blok.splitlines() if s.strip()]
        if not stroki:
            continue
        if all(s.lstrip().startswith("|") for s in stroki):
            for s in stroki:
                if not re.fullmatch(r"\s*\|[\s|:-]*", s):
                    yield "таблица", s.strip()
            continue
        tekushchij, vid = [], None
        for s in stroki:
            if s.lstrip().startswith("#"):
                if tekushchij:
                    yield vid, " ".join(tekushchij)
                    tekushchij = []
                yield "заголовок", s.strip()
                vid = None
            elif MARKER.match(s):
                if tekushchij:
                    yield vid, " ".join(tekushchij)
                tekushchij, vid = [MARKER.sub("", s, count=1).strip()], "пункт"
            else:
                vid = vid or "абзац"
                tekushchij.append(s.strip())
        if tekushchij:
            yield vid, " ".join(tekushchij)


def v_isklyuchenii(tekst, m, shablony):
    for shablon in shablony:
        for t in re.finditer(shablon, tekst, flags=re.I):
            if t.start() <= m.start() and m.end() <= t.end():
                return True
    return False


def najti(tekst, spisok, isklyucheniya=()):
    return [m.group(0) for shablon in spisok for m in re.finditer(shablon, tekst, flags=re.I)
            if not v_isklyuchenii(tekst, m, isklyucheniya)]


def schitat_zhirnyj(chasti):
    """Жирный в начале абзаца, пункта или ячейки — метка; остальной — внутри фразы."""
    metki = vnutri = 0
    for vid, syroj in chasti:
        yachejki = [c.strip() for c in syroj.strip().strip("|").split("|")] if vid == "таблица" else [syroj]
        for c in yachejki:
            for m in re.finditer(r"\*\*[^*]+\*\*", c):
                if m.start() == 0:
                    metki += 1
                else:
                    vnutri += 1
    return metki, vnutri


def dlina_predlozhenij(chasti):
    proza = " ".join(snyat_razmetku(t) for vid, t in chasti if vid == "абзац")
    predlozheniya = [p for p in re.split(r"(?<=[.!?…])\s+(?=[А-ЯЁA-Z«\"(0-9])", proza)
                     if len(p.split()) >= 3]
    return [len(p.split()) for p in predlozheniya]


def razobrat(imya, syroj):
    chistyj = ochistit(syroj)
    chasti = list(edinicy(chistyj))
    teksty = [snyat_razmetku(t) for _, t in chasti]
    slov = len(re.findall(r"\w+", chistyj))
    print(f"== {imya}: слов прозы {slov}")
    vsego = 0
    for kod, shablony in PRIZNAKI.items():
        nahodki = [n for t in teksty for n in najti(t, shablony, ISKLYUCHENIYA.get(kod, ()))]
        if nahodki:
            vsego += len(nahodki)
            plotnost = len(nahodki) / slov * 1000 if slov else 0
            primery = "; ".join(f"«{t}»" for t in nahodki[:4])
            print(f"  {kod}: {len(nahodki)} ({plotnost:.1f} на 1000 слов) — {primery}")
    bez_koda = re.sub(r"```.*?```", "", syroj, flags=re.S)
    bez_koda = re.sub(r"^---\n.*?\n---\n", "", bez_koda, flags=re.S)
    bez_istochnikov = re.sub(r"(?ms)^#+[^\n]*Источник[^\n]*\n.*?(?=^#|\Z)", "", bez_koda)
    bez_istochnikov = re.sub(r"(?m)^\s*\d+\.\s+https?://\S+\s*$", "", bez_istochnikov)
    bez_upominanij = re.sub(r"«[^«»]{0,300}»", "", bez_istochnikov)
    for kod, shablon in SYRYE.items():
        nahodki = re.findall(shablon, bez_upominanij)
        if nahodki:
            vsego += len(nahodki)
            print(f"  {kod}: {len(nahodki)} — " + "; ".join(f"«{n.strip()[:40]}»" for n in nahodki[:4]))
    chuzhoj = [m.group(0) for m in re.finditer(r"(?<![\w/.])[A-Za-z][A-Za-z'’-]*(?:[ ,]+[A-Za-z][A-Za-z'’-]*){5,}", ochistit(bez_istochnikov))]
    if chuzhoj:
        vsego += len(chuzhoj)
        print(f"  Е6 фрагмент на другом языке: {len(chuzhoj)} — " + "; ".join(f"«{c[:40]}»" for c in chuzhoj[:3]))
    for kod, shablony in PROVERIT.items():
        mesta = [n for t in teksty for n in najti(t, shablony)]
        if mesta:
            print(f"  Перечитать — {kod}: {len(mesta)} — " + "; ".join(f"«{t}»" for t in mesta[:4]))
    metki, vnutri = schitat_zhirnyj(chasti)
    emodzi = len(re.findall("[\U0001F300-\U0001FAFF☀-➿]", chistyj))
    anglijskie = len(re.findall(r"\"[^\"\n]{1,80}\"", re.sub(r"```.*?```", "", syroj, flags=re.S)))
    print(f"  Д2 жирный внутри фраз: {vnutri} ({vnutri / slov * 1000 if slov else 0:.1f} на 1000 слов); "
          f"жирных меток в начале абзаца, пункта, ячейки: {metki} — норма учебного текста")
    print(f"  Д2 эмодзи: {emodzi}; Д4 английских кавычек: {anglijskie}")
    dliny = dlina_predlozhenij(chasti)
    if len(dliny) >= 10:
        srednyaya = statistics.mean(dliny)
        razbros = statistics.pstdev(dliny) / srednyaya
        print(f"  Б1 ритм: предложений в абзацах {len(dliny)}, средняя длина {srednyaya:.1f} слова, "
              f"разброс длины {razbros:.2f} (чем меньше, тем ровнее ритм)")
    print(f"  Итого находок по словарю: {vsego} ({vsego / slov * 1000 if slov else 0:.1f} на 1000 слов)")
    return vsego, slov


def dlya_sverki(t):
    shapka = t.split("\n---\n", 1)[0] if t.startswith("---\n") else ""
    return {
        "ссылки": set(re.findall(r"https?://[^\s)\]>\"'»]+", t)),
        "числа": Counter(re.findall(r"\d+(?:[.,]\d+)*", t)),
        "текст в «ёлочках»": Counter(re.findall(r"«[^«»]{1,300}»", t)),
        "блоки кода": Counter(re.findall(r"```.*?```", t, flags=re.S)),
        "цитаты (строки с >)": Counter(s for s in t.splitlines() if s.lstrip().startswith(">")),
        "якоря {#…}": set(re.findall(r"\{#[^}]+\}", t)),
        "шапка": Counter([shapka]),
    }


def sverit(ishodnik, pravka):
    """Правка стиля не должна менять факты: печатает, что ушло и что пришло."""
    a = dlya_sverki(Path(ishodnik).read_text(encoding="utf-8"))
    b = dlya_sverki(Path(pravka).read_text(encoding="utf-8"))
    vse = True
    for kod in a:
        if a[kod] == b[kod]:
            print(f"  OK    {kod}")
            continue
        vse = False
        ushlo, prishlo = list(a[kod] - b[kod]), list(b[kod] - a[kod])
        print(f"  РАЗН  {kod}: ушло {[str(x)[:60] for x in ushlo[:5]]}, пришло {[str(x)[:60] for x in prishlo[:5]]}")
    print("ИТОГ: " + ("всё совпало" if vse else "есть расхождения — проверьте, не потерян ли факт"))
    return 0 if vse else 1


def main(argv):
    if len(argv) > 1 and argv[1] == "--sverit":
        if len(argv) != 4:
            print("Запуск: schitat-priznaki.py --sverit ИСХОДНИК ПРАВКА")
            return 2
        return sverit(argv[2], argv[3])
    if len(argv) > 1:
        itog = [razobrat(Path(p).name, Path(p).read_text(encoding="utf-8")) for p in argv[1:]]
    else:
        itog = [razobrat("stdin", sys.stdin.read())]
    if len(itog) > 1:
        n = sum(v for v, _ in itog)
        s = sum(w for _, w in itog)
        print(f"== Все файлы: {n} находок на {s} слов ({n / s * 1000 if s else 0:.1f} на 1000)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
