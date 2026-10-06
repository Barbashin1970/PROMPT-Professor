#!/usr/bin/env python3
"""QR-коды адресов сайта — для подвала главной и для показа в видео:
    site/assets/qr-sajt.svg          — основной адрес (ADRES_SAJTA, GitHub Pages);
    site/assets/qr-sajt-vtoroj.svg   — второй адрес (ADRES_VTOROJ, Vercel).

Адреса берутся из tools/sobrat-sajt.py. Сменился адрес — пересобрать (сторож сверяет
адрес в каждом коде с константой):

    python3 tools/sobrat-qr.py

Нужна библиотека qrcode (pip install qrcode). Уровень коррекции Q (25 %): код читается
и с экрана после сжатия видео. Модули тёмные на белом поле — так его берут все камеры,
и в тёмной теме сайта тоже. В код идёт адрес со слэшем на конце — без лишнего перенаправления.
"""

import re
from pathlib import Path

import qrcode

KOREN = Path(__file__).resolve().parent.parent
SBORSHCHIK = (KOREN / "tools" / "sobrat-sajt.py").read_text(encoding="utf-8")
KODY = [("ADRES_SAJTA", "qr-sajt.svg"), ("ADRES_VTOROJ", "qr-sajt-vtoroj.svg")]


def adres(konstanta):
    return re.search(rf'^{konstanta} = "([^"]+)"', SBORSHCHIK, re.M).group(1).rstrip("/") + "/"


def svg(tekst):
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4)
    qr.add_data(tekst)
    qr.make(fit=True)
    matrica = qr.get_matrix()            # с полем в 4 модуля
    n = len(matrica)
    moduli = "".join(f"M{x},{y}h1v1h-1z" for y, ryad in enumerate(matrica) for x, est in enumerate(ryad) if est)
    return qr.version, n, (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges">'
                           f'<title>{tekst}</title><rect width="{n}" height="{n}" fill="#fff"/>'
                           f'<path d="{moduli}" fill="#1d1d1f"/></svg>\n')


def main():
    for konstanta, imya in KODY:
        tekst = adres(konstanta)
        versiya, n, kod = svg(tekst)
        (KOREN / "site" / "assets" / imya).write_text(kod, encoding="utf-8")
        print(f"site/assets/{imya} — {tekst}; версия QR {versiya}, {n}×{n} модулей вместе с полем")


if __name__ == "__main__":
    main()
