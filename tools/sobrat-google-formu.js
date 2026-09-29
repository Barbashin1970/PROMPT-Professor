// Сборка сценария Google Apps Script, который превращает форму Google в итоговый тест курса
// и заводит ведомость. Источник вопросов — content/test-voprosy.js (тот же, что у теста на сайте).
// Запуск: node tools/sobrat-google-formu.js  →  tools/google-forma/Kod.gs
// Как вставить сценарий в форму — tools/google-forma/README.md.
'use strict';
const fs = require('fs');
const path = require('path');

const KOREN = path.join(__dirname, '..');
global.window = {};
require(path.join(KOREN, 'content', 'test-voprosy.js'));
const MODULI = window.TEST_MODULI;

// Вопросы — в простой вид для формы. Сопоставление из трёх пар становится тремя вопросами
// с выбором ответа по 1 баллу: так сохраняется счёт «по баллу за пару», а форма Google
// умеет проверять такие вопросы сама.
const moduli = MODULI.map((m) => ({
  id: m.id,
  nazvanie: m.nazvanie,
  lekciya: m.lekciya,
  razdel: m.razdel,
  voprosy: m.voprosy.map((v) => {
    if (v.type === 'multiple_choice') {
      const vernyj = v.options.findIndex((o) => o.letter === v.correctAnswer);
      if (vernyj < 0) throw new Error(`модуль ${m.id}, вопрос ${v.id}: нет верного ответа ${v.correctAnswer}`);
      return { tip: 'vybor', tekst: v.text, varianty: v.options.map((o) => o.text), vernyj, bally: v.points };
    }
    if (v.type === 'matching') {
      const pravye = v.rightOptions.map((o) => o.text);
      const pary = v.items.map((it) => {
        const vernyj = v.rightOptions.findIndex((o) => o.letter === it.correct);
        if (vernyj < 0) throw new Error(`модуль ${m.id}, вопрос ${v.id}: нет пары ${it.correct}`);
        return { levoe: it.text, vernyj };
      });
      if (pary.length !== v.points) throw new Error(`модуль ${m.id}, вопрос ${v.id}: пар ${pary.length}, баллов ${v.points}`);
      return { tip: 'para', tekst: v.text, pravye, pary };
    }
    throw new Error(`модуль ${m.id}, вопрос ${v.id}: неизвестный тип ${v.type}`);
  }),
}));

const vsego = moduli.reduce((s, m) => s + m.voprosy.reduce((t, v) => t + (v.tip === 'vybor' ? v.bally : v.pary.length), 0), 0);
if (vsego !== 72) throw new Error(`сумма баллов ${vsego}, ожидалось 72`);

const kod = `/**
 * Итоговый тест курса «ИИ в учебном процессе» → форма Google с баллами + ведомость.
 *
 * Файл собран сценарием tools/sobrat-google-formu.js из content/test-voprosy.js —
 * вопросы правятся там, потом файл собирается заново. Здесь ничего не править.
 *
 * Как запустить — один раз, минуты за три:
 *  1. Откройте форму в режиме редактирования → ⋮ справа вверху → «Apps Script».
 *  2. В файле «Код.gs» сотрите всё, вставьте этот файл целиком, сохраните (⌘S / Ctrl+S).
 *     Пустой «Вопрос без заголовка», который Google ставит в новую форму, сценарий уберёт сам.
 *  3. Вверху выберите функцию sobratTest → «Выполнить» → разрешите доступ своим аккаунтом
 *     (Google предупредит, что приложение не проверено: «Дополнительно» → «Перейти»).
 *  4. В журнале выполнения появится ссылка на таблицу с ответами и ведомостью.
 *  5. В форме: «Настройки» → «Ответы» → «Сбор адресов электронной почты» — выбрать вариант;
 *     затем «Опубликовать» и «Кто может отвечать: все, у кого есть ссылка».
 *
 * Функции:
 *  sobratTest          — заполнить пустую форму вопросами, завести таблицу и ведомость;
 *  perestroitVedomost  — пересобрать ведомость по всем ответам формы (если что-то сбилось);
 *  ochistitFormu       — УДАЛИТЬ все вопросы формы, чтобы собрать тест заново.
 */

const ADRES_SAJTA = 'https://ai-in-the-education.vercel.app';
const VSEGO_BALLOV = ${vsego};
const PROHODNOJ_BALL = 44;   // 60 % — как 6 из 10 в программе курса
const POLE_FIO = 'Фамилия, имя, отчество';
const POLE_MESTO = 'Место работы, кафедра или поток';
const ZAGOLOVKI_POPYTOK = ['Когда', 'ФИО', 'Электронная почта', 'Место работы, кафедра или поток', 'Баллы из ' + VSEGO_BALLOV, 'Итог', 'Номер ответа'];
const ZAGOLOVKI_VEDOMOSTI = ['ФИО', 'Электронная почта', 'Место работы, кафедра или поток', 'Лучший балл из ' + VSEGO_BALLOV, 'Попыток', 'Последняя попытка', 'Итог (сдано — от ' + PROHODNOJ_BALL + ')'];

const MODULI = ${JSON.stringify(moduli, null, 2)};

function sobratTest() {
  const forma = FormApp.getActiveForm();
  if (!forma) throw new Error('Сценарий запущен не из формы: откройте форму → ⋮ → «Apps Script».');
  // В новой форме Google уже стоит пустой «Вопрос без заголовка» — такую заготовку убираем сами;
  // вопросы с заголовком не трогаем, чтобы не стереть чужую работу
  forma.getItems().forEach(function (it) {
    const t = it.getTitle().trim();
    if (t === '' || t === 'Вопрос без заголовка' || t === 'Untitled Question') forma.deleteItem(it);
  });
  const uzhe = forma.getItems().length;
  if (uzhe > 0) {
    throw new Error('В форме уже есть элементы (' + uzhe + '). Чтобы собрать тест заново, выполните ochistitFormu — она удалит все вопросы, — и снова sobratTest.');
  }

  forma.setTitle('Итоговый тест — «ИИ в учебном процессе»')
    .setDescription('Шесть модулей по 12 баллов, всего ' + VSEGO_BALLOV + '. «Сдано» — от ' + PROHODNOJ_BALL +
      ' баллов (60 %). Пройти можно ещё раз — в ведомость идёт лучший результат. Материалы курса: ' + ADRES_SAJTA)
    .setIsQuiz(true)
    .setCollectEmail(true)
    .setProgressBar(true)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(true)
    .setConfirmationMessage('Спасибо! Ответы записаны. Баллы — по кнопке «Посмотреть баллы»; ' +
      'где ошибка — там ссылка на раздел конспекта, который стоит повторить.');

  forma.addTextItem().setTitle(POLE_FIO).setRequired(true);
  forma.addTextItem().setTitle(POLE_MESTO).setRequired(true);
  forma.addCheckboxItem()
    .setTitle('Согласие на обработку персональных данных')
    .setHelpText('ФИО, место работы и адрес почты нужны только для ведомости зачёта курса повышения квалификации.')
    .setChoiceValues(['Согласен(на) на обработку моих персональных данных для ведомости зачёта'])
    .setRequired(true);

  let ballov = 0;
  MODULI.forEach(function (m) {
    forma.addPageBreakItem()
      .setTitle('Модуль ' + m.id + '. ' + m.nazvanie)
      .setHelpText('Лекция ' + m.lekciya + '. Повторить перед ответом: ' + ADRES_SAJTA + m.razdel);
    const otzyv = FormApp.createFeedback()
      .setText('Повторите раздел конспекта к модулю ' + m.id + ' «' + m.nazvanie + '».')
      .addLink(ADRES_SAJTA + m.razdel, 'Раздел конспекта')
      .build();

    m.voprosy.forEach(function (v, n) {
      const nomer = m.id + '.' + (n + 1);
      if (v.tip === 'vybor') {
        const vopros = forma.addMultipleChoiceItem();
        vopros.setTitle(nomer + '. ' + v.tekst)
          .setChoices(v.varianty.map(function (tekst, i) { return vopros.createChoice(tekst, i === v.vernyj); }))
          .setPoints(v.bally)
          .setRequired(true)
          .setFeedbackForIncorrect(otzyv);
        ballov += v.bally;
      } else {
        forma.addSectionHeaderItem().setTitle(nomer + '. ' + v.tekst).setHelpText('По баллу за каждую верную пару.');
        v.pary.forEach(function (p, k) {
          const vopros = forma.addMultipleChoiceItem();
          vopros.setTitle(nomer + '.' + (k + 1) + '. ' + p.levoe)
            .setChoices(v.pravye.map(function (tekst, i) { return vopros.createChoice(tekst, i === p.vernyj); }))
            .setPoints(1)
            .setRequired(true)
            .setFeedbackForIncorrect(otzyv);
          ballov += 1;
        });
      }
    });
  });
  if (ballov !== VSEGO_BALLOV) throw new Error('Сумма баллов ' + ballov + ' вместо ' + VSEGO_BALLOV + ' — соберите файл заново.');

  const tablica = SpreadsheetApp.create('Итоговый тест «ИИ в учебном процессе» — ответы и ведомость');
  forma.setDestination(FormApp.DestinationType.SPREADSHEET, tablica.getId());
  PropertiesService.getScriptProperties().setProperty('TABLICA', tablica.getId());
  podgotovitList(tablica, 'Ведомость', ZAGOLOVKI_VEDOMOSTI);
  podgotovitList(tablica, 'Попытки', ZAGOLOVKI_POPYTOK);
  const pustoj = tablica.getSheetByName('Лист1') || tablica.getSheetByName('Sheet1');
  if (pustoj && tablica.getSheets().length > 1) tablica.deleteSheet(pustoj);

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'priOtvete') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('priOtvete').forForm(forma).onFormSubmit().create();

  Logger.log('Готово: ' + forma.getItems().length + ' элементов формы, ' + ballov + ' баллов.');
  Logger.log('Таблица с ответами и ведомостью: ' + tablica.getUrl());
  Logger.log('Осталось: «Настройки» → «Ответы» → сбор почты; затем «Опубликовать».');
}

// Срабатывает на каждый ответ: строка в «Попытки», ведомость пересчитывается
function priOtvete(e) {
  zapisatPopytku(e.response);
  obnovitVedomost();
}

function perestroitVedomost() {
  const list = tablica().getSheetByName('Попытки');
  if (list.getLastRow() > 1) list.getRange(2, 1, list.getLastRow() - 1, ZAGOLOVKI_POPYTOK.length).clearContent();
  FormApp.getActiveForm().getResponses().forEach(zapisatPopytku);
  obnovitVedomost();
  Logger.log('Ведомость пересобрана.');
}

function ochistitFormu() {
  const forma = FormApp.getActiveForm();
  const n = forma.getItems().length;
  forma.getItems().forEach(function (it) { forma.deleteItem(it); });
  Logger.log('Удалено элементов: ' + n + '. Теперь можно выполнить sobratTest.');
}

// ── Внутреннее ──────────────────────────────────────────────────────────────

function tablica() {
  const id = PropertiesService.getScriptProperties().getProperty('TABLICA');
  if (!id) throw new Error('Таблица ведомости не найдена — сначала выполните sobratTest.');
  return SpreadsheetApp.openById(id);
}

function podgotovitList(t, imya, zagolovki) {
  const list = t.getSheetByName(imya) || t.insertSheet(imya);
  list.getRange(1, 1, 1, zagolovki.length).setValues([zagolovki]).setFontWeight('bold');
  list.setFrozenRows(1);
  list.autoResizeColumns(1, zagolovki.length);
  return list;
}

function zapisatPopytku(otvet) {
  const pole = {};
  otvet.getItemResponses().forEach(function (r) { pole[r.getItem().getTitle()] = r.getResponse(); });
  let bally = 0;
  otvet.getGradableItemResponses().forEach(function (r) { bally += Number(r.getScore()) || 0; });
  tablica().getSheetByName('Попытки').appendRow([
    otvet.getTimestamp(), pole[POLE_FIO] || '', otvet.getRespondentEmail() || '', pole[POLE_MESTO] || '',
    bally, bally >= PROHODNOJ_BALL ? 'сдано' : 'не сдано', otvet.getId()
  ]);
}

// Ведомость: одна строка на участника (по почте, без почты — по ФИО), лучший балл из попыток
function obnovitVedomost() {
  const t = tablica();
  const popytki = t.getSheetByName('Попытки').getDataRange().getValues().slice(1);
  const uchastniki = {};
  popytki.forEach(function (r) {
    const kogda = r[0], fio = r[1], pochta = r[2], mesto = r[3], bally = Number(r[4]) || 0;
    const klyuch = String(pochta || fio || '').trim().toLowerCase();   // пустая строка листа — пропуск
    if (!klyuch) return;
    const u = uchastniki[klyuch];
    if (!u) {
      uchastniki[klyuch] = { fio: fio, pochta: pochta, mesto: mesto, luchshij: bally, popytok: 1, poslednyaya: kogda };
      return;
    }
    u.popytok += 1;
    if (bally > u.luchshij) u.luchshij = bally;
    if (kogda > u.poslednyaya) { u.poslednyaya = kogda; u.fio = fio || u.fio; u.mesto = mesto || u.mesto; }
  });
  const stroki = Object.keys(uchastniki).map(function (k) { return uchastniki[k]; })
    .sort(function (a, b) { return String(a.fio).localeCompare(String(b.fio), 'ru'); })
    .map(function (u) {
      return [u.fio, u.pochta, u.mesto, u.luchshij, u.popytok, u.poslednyaya, u.luchshij >= PROHODNOJ_BALL ? 'сдано' : 'не сдано'];
    });
  const vedomost = t.getSheetByName('Ведомость');
  if (vedomost.getLastRow() > 1) vedomost.getRange(2, 1, vedomost.getLastRow() - 1, ZAGOLOVKI_VEDOMOSTI.length).clearContent();
  if (stroki.length) vedomost.getRange(2, 1, stroki.length, ZAGOLOVKI_VEDOMOSTI.length).setValues(stroki);
}
`;

const vyhod = path.join(__dirname, 'google-forma', 'Kod.gs');
fs.mkdirSync(path.dirname(vyhod), { recursive: true });
fs.writeFileSync(vyhod, kod, 'utf-8');
const voprosovFormy = moduli.reduce((s, m) => s + m.voprosy.reduce((t, v) => t + (v.tip === 'vybor' ? 1 : v.pary.length), 0), 0);
console.log(`Готово: ${path.relative(KOREN, vyhod)} — модулей ${moduli.length}, вопросов в форме ${voprosovFormy}, баллов ${vsego}.`);
