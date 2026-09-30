// Выгрузка тестов в Markdown с верными ответами — для переноса вопросов в систему НГУ
// и для проверки автором. Источник — те же файлы, что у сайта и зачётной формы.
// Запуск: node tools/vygruzit-test.js
//   → docs/TEST-ZACHET-VOPROSY-I-OTVETY.md        (зачёт: 6 модулей, 30 вопросов, 72 балла)
//   → docs/TEST-PRODVINUTYJ-VOPROSY-I-OTVETY.md   (продвинутый: 10 модулей, 50 вопросов, 120 баллов)
// Папка docs/ на сайт не публикуется: в файлах — ответы.
// С ключом --proverka ничего не пишет: сверяет файлы с вопросами (так зовёт proverit-sajt.py).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KOREN = path.join(__dirname, '..');
const PROVERKA = process.argv.includes('--proverka');
const SAJT = 'https://ai-in-the-education.vercel.app';
const BUKVY = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];   // варианты по порядку: первый — А, второй — Б…

function prochitat(fajl) {
  const c = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(KOREN, 'content', fajl), 'utf8'), c);
  return c.window.TEST_MODULI;
}

function urok(l) {
  if (l === 'bonus-1') return 'бонусный урок 1';
  if (l === 'bonus-2') return 'бонусный урок 2';
  return 'лекция ' + l;
}

function vygruzit({ fajl, vyhod, zagolovok, naznachenie, porog }) {
  const moduli = prochitat(fajl);
  const vsego = moduli.reduce((s, m) => s + m.voprosy.reduce((t, v) => t + v.points, 0), 0);
  const voprosov = moduli.reduce((s, m) => s + m.voprosy.length, 0);
  const L = [];
  const klyuch = [];
  L.push(`# ${zagolovok} — вопросы и ответы`, '');
  L.push(`> ${naznachenie}`);
  L.push('> **Не публиковать:** в файле верные ответы. Собран из `content/' + fajl + '` командой');
  L.push('> `node tools/vygruzit-test.js` — после правки вопросов собрать заново.', '');
  L.push(`Модулей — ${moduli.length}, вопросов — ${voprosov}, баллов — ${vsego}; порог — от ${porog} (60 %).`);
  L.push('Вопрос с выбором одного ответа — 2 балла. Сопоставление трёх пар — 3 балла, по баллу за пару.');
  L.push('Буквы вариантов — кириллица по порядку: А — первый, Б — второй, В — третий, Г — четвёртый.');
  L.push('На сайте те же варианты с выбором подписаны латиницей: A = А, B = Б, C = В, D = Г.', '');

  let nomer = 0;
  moduli.forEach((m) => {
    L.push(`## Модуль ${m.id}. ${m.nazvanie}`, '');
    L.push(`${urok(m.lekciya)[0].toUpperCase() + urok(m.lekciya).slice(1)}; раздел конспекта для повторения: ${SAJT}${m.razdel}`, '');
    m.voprosy.forEach((v) => {
      nomer += 1;
      if (v.type === 'multiple_choice') {
        const i = v.options.findIndex((o) => o.letter === v.correctAnswer);
        if (i < 0) throw new Error(`${fajl}, вопрос ${v.id}: нет ответа ${v.correctAnswer}`);
        L.push(`### Вопрос ${nomer}. Выбор одного ответа · ${v.points} балла`, '');
        L.push(v.text, '');
        v.options.forEach((o, j) => L.push(`${BUKVY[j]}) ${o.text}`, ''));
        L.push(`**Ответ: (${BUKVY[i]})**`, '');
        klyuch.push([nomer, m.id, 'выбор', v.points, `(${BUKVY[i]})`]);
      } else {
        L.push(`### Вопрос ${nomer}. Сопоставление · ${v.points} балла, по баллу за пару`, '');
        L.push(v.text, '');
        v.items.forEach((it) => L.push(`${it.number}) ${it.text}`, ''));
        v.rightOptions.forEach((o, j) => {
          if (o.letter !== BUKVY[j]) throw new Error(`${fajl}, вопрос ${v.id}: буквы справа не по порядку`);
          L.push(`${o.letter}) ${o.text}`, '');
        });
        const pary = v.items.map((it) => `${it.number} — (${it.correct})`).join(', ');
        L.push(`**Ответ: ${pary}**`, '');
        L.push('Пары целиком — для ввода по парам:', '');
        v.items.forEach((it) => {
          const o = v.rightOptions.find((r) => r.letter === it.correct);
          if (!o) throw new Error(`${fajl}, вопрос ${v.id}: нет варианта ${it.correct}`);
          L.push(`- ${it.text} → ${o.text}`);
        });
        L.push('');
        klyuch.push([nomer, m.id, 'сопоставление', v.points, pary]);
      }
    });
  });

  L.push('## Ключ ответов', '');
  L.push('| № | Модуль | Тип | Баллы | Ответ |', '|---|---|---|---|---|');
  klyuch.forEach((r) => L.push(`| ${r.join(' | ')} |`));
  L.push('');
  const put = path.join(KOREN, 'docs', vyhod);
  if (PROVERKA) {
    const byl = fs.existsSync(put) ? fs.readFileSync(put, 'utf8') : '';
    if (byl !== L.join('\n')) {
      console.log(`docs/${vyhod} отстал от content/${fajl}: node tools/vygruzit-test.js`);
      process.exitCode = 1;
    }
    return;
  }
  fs.writeFileSync(put, L.join('\n'), 'utf8');
  console.log(`docs/${vyhod} — модулей ${moduli.length}, вопросов ${voprosov}, баллов ${vsego}`);
}

vygruzit({
  fajl: 'test-voprosy.js',
  vyhod: 'TEST-ZACHET-VOPROSY-I-OTVETY.md',
  zagolovok: 'Зачётный тест «ИИ в учебном процессе»',
  naznachenie: 'Для переноса в систему НГУ. Те же вопросы — в тренировочном тесте на сайте и в зачётной форме.',
  porog: 44
});
vygruzit({
  fajl: 'test-prodvinutyj.js',
  vyhod: 'TEST-PRODVINUTYJ-VOPROSY-I-OTVETY.md',
  zagolovok: 'Продвинутый тест «ИИ в учебном процессе»',
  naznachenie: 'Самооценка на сайте: /test/prodvinutyj/. Файл — для проверки вопросов автором.',
  porog: 72
});
