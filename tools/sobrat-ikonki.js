// Иконки для установки сайта на экран «Домой» (PWA) — из значка site/assets/ikonka.svg.
// Готовые PNG лежат в site/assets/; пересобирать только при смене значка:
//   node tools/sobrat-ikonki.js
// Нужен Playwright: в проекте его нет, берётся из ~/SILL (бэклог, п. 9).
'use strict';
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || '/Users/olegbarbashin/SILL/node_modules/playwright');

const PAPKA = path.join(__dirname, '..', 'site', 'assets');
const ZVEZDA = '<path d="M16 6c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z" fill="#fff"/>';
// «any» — как значок сайта, со скруглением; «во весь квадрат» — для iOS и маскируемой иконки
// Android: скругление или круг система накладывает сама, звезда внутри безопасной зоны (80 %).
const SKRUGLENNAYA = `<rect width="32" height="32" rx="7" fill="#0071e3"/>${ZVEZDA}`;
const KVADRAT = `<rect width="32" height="32" fill="#0071e3"/>${ZVEZDA}`;
const IKONKI = [
  ['ikonka-192.png', 192, SKRUGLENNAYA],
  ['ikonka-512.png', 512, SKRUGLENNAYA],
  ['ikonka-maskable-512.png', 512, KVADRAT],
  ['ikonka-180.png', 180, KVADRAT],
];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [imya, razmer, risunok] of IKONKI) {
    await p.setViewportSize({ width: razmer, height: razmer });
    await p.setContent(`<html><body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${razmer}" height="${razmer}" style="display:block">${risunok}</svg></body></html>`);
    await p.screenshot({ path: path.join(PAPKA, imya), omitBackground: true, clip: { x: 0, y: 0, width: razmer, height: razmer } });
    console.log(`site/assets/${imya} — ${razmer}×${razmer}`);
  }
  await b.close();
})();
