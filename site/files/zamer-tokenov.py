"""Замер: сколько токенов занимает одна и та же фраза по-русски и по-английски.

Числа из этого замера стоят в конспекте лекции 1 (раздел «Токены»).
Запуск (tiktoken ставится в отдельное окружение, системный Python не трогаем):

    python3 -m venv .venv-tokens
    .venv-tokens/bin/pip install tiktoken
    .venv-tokens/bin/python tools/zamer-tokenov.py

Замер 2026-09-28 дал:
    cl100k_base (токенизатор GPT-4):         «Кошка сидит на коврике» — 12 токенов, русский дороже в 2,21 раза
    o200k_base  (токенизатор GPT-4o и новее): «Кошка сидит на коврике» — 9 токенов,  русский дороже в 1,45 раза

Токенизаторы GigaChat, YandexGPT и DeepSeek здесь не меряются: у них свои словари,
и публичного офлайн-счётчика для них нет.
"""

import tiktoken

PARY = [
    ("The cat sits on the mat", "Кошка сидит на коврике"),
    (
        "Create a test of 10 questions on the topic of Kievan Rus for first-year students, "
        "basic level, with an answer key.",
        "Создай тест из 10 вопросов по теме «Киевская Русь» для первокурсников, "
        "базовый уровень, с ключом ответов.",
    ),
    (
        "Hallucinations are confident answers that look plausible but are not true. "
        "Always check dates, names, formulas and sources.",
        "Галлюцинации — уверенные ответы, которые выглядят правдоподобно, но не соответствуют "
        "действительности. Всегда проверяйте даты, имена, формулы и источники.",
    ),
]

for imya in ("cl100k_base", "o200k_base"):
    enc = tiktoken.get_encoding(imya)
    tok_en = tok_ru = znaki_en = znaki_ru = 0
    print(f"== {imya}")
    for en, ru in PARY:
        a, b = len(enc.encode(en)), len(enc.encode(ru))
        tok_en += a
        tok_ru += b
        znaki_en += len(en)
        znaki_ru += len(ru)
        print(f"  EN {a:3d} / RU {b:3d} токенов | {ru[:40]}")
    print(
        f"  итого: RU/EN = {tok_ru / tok_en:.2f}; знаков на токен: "
        f"EN {znaki_en / tok_en:.1f}, RU {znaki_ru / tok_ru:.1f}"
    )
    print("  разбиение:", [enc.decode([t]) for t in enc.encode("Кошка сидит на коврике")])
