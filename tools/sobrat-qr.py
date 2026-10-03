#!/usr/bin/env python3
"""QR-код адреса сайта — для подвала главной и для показа в видео: site/assets/qr-sajt.svg.

Адрес берётся из ADRES_SAJTA в tools/sobrat-sajt.py — тот же, что в ссылках .docx.
Сменился адрес — пересобрать (сторож сверяет адрес в QR с ADRES_SAJTA):

    python3 tools/sobrat-qr.py

Нужна библиотека qrcode (pip install qrcode). Уровень коррекции Q (25 %): код читается
и с экрана после сжатия видео. Модули тёмные на белом поле — так его берут все камеры,
и в тёмной теме сайта тоже.
"""

import re
from pathlib import Path

import qrcode

KOREN = Path(__file__).resolve().parent.parent
ADRES = re.search(r'^ADRES_SAJTA = "([^"]+)"', (KOREN / "tools" / "sobrat-sajt.py").read_text(encoding="utf-8"),
                  re.M).group(1)


def main():
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4)
    qr.add_data(ADRES)
    qr.make(fit=True)
    matrica = qr.get_matrix()            # с полем в 4 модуля
    n = len(matrica)
    moduli = "".join(f"M{x},{y}h1v1h-1z" for y, ryad in enumerate(matrica) for x, est in enumerate(ryad) if est)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges">'
           f'<title>{ADRES}</title><rect width="{n}" height="{n}" fill="#fff"/>'
           f'<path d="{moduli}" fill="#1d1d1f"/></svg>\n')
    (KOREN / "site" / "assets" / "qr-sajt.svg").write_text(svg, encoding="utf-8")
    print(f"site/assets/qr-sajt.svg — {ADRES}; версия QR {qr.version}, {n}×{n} модулей вместе с полем")


if __name__ == "__main__":
    main()
