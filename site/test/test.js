/* Тесты курса «ИИ в учебном процессе» — движок страниц /test/ (тренировочный тест) и
   /test/prodvinutyj/ (продвинутый). Проект — docs/SAIT-PROEKT.md, §4.8; основа — тест
   stroyka-test-main. Вопросы — voprosy.js рядом со страницей; настройки страницы —
   window.TEST_NASTROJKI (ключ хранения, название, слова итога). Имени и других данных
   слушателя тест не спрашивает и не хранит: это тренировка, баллы — только в браузере.
   Ядро (подсчёт баллов) — чистые функции раздела 1: в Node они доступны через require,
   в браузере их прогоняет служебная самопроверка window.__proverkaTesta(). */
(function () {
  'use strict';


  var BALL_ZA_VYBOR = 2;        // вопрос с одним верным ответом
  var BALL_ZA_PARU = 1;         // верная пара в сопоставлении: три пары — 3 балла
  var PROCENT_ZACHETA = 60;     // 44 из 72 — тот же порог, что 6 из 10 в программе на 16 ч
  var VOPROSOV_V_MODULE = 5;    // пока в каком-то модуле меньше — плашка «Тест готовится»
  var MODULEI_V_TESTE = 6;      // сверяет самопроверка
  var BALLOV_V_MODULE = 12;     // 3 × 2 + 2 × 3; сверяет самопроверка

  // Настройки страницы — до движка: window.TEST_NASTROJKI = { klyuch, nazvanie, modulei, itog,
  // zagolovokItoga, knopkaZacheta, podpisItoga }. Без них — тренировочный тест.
  var NASTROJKI = (typeof window !== 'undefined' && window.TEST_NASTROJKI) || {};
  var NAZVANIE_TESTA = NASTROJKI.nazvanie || 'Тренировочный тест «ИИ в учебном процессе»';
  var SLOVA_ITOGA = NASTROJKI.itog || { da: 'Готово к зачёту', net: 'Пока не хватает до зачёта', porog: 'Зачёт' };

  /* ── 1. Ядро: баллы, зачёт, итог. Без DOM и хранилища ────────────────────── */

  function spisok(x) { return Array.isArray(x) ? x : []; }
  function stroka(x) { return x == null ? '' : String(x); }
  function chisto(x) { return stroka(x).replace(/\s+/g, ' ').trim(); }
  function celoe(x) { return typeof x === 'number' && isFinite(x) && Math.floor(x) === x; }
  function povtory(ryad) { return ryad.some(function (x, i) { return ryad.indexOf(x) !== i; }); }

  function vybor(v) { return !!v && v.type === 'multiple_choice'; }
  function sopostavlenie(v) { return !!v && v.type === 'matching'; }

  // Пункт сопоставления узнаётся по number, а без номера — по порядку.
  function klyuchPunkta(punkt, j) {
    var n = chisto(punkt && punkt.number);
    return n !== '' ? n : String(j + 1);
  }

  function bukvyVybora(v) { return spisok(v.options).map(function (o) { return chisto(o && o.letter); }); }
  function bukvySprava(v) { return spisok(v.rightOptions).map(function (o) { return chisto(o && o.letter); }); }

  function maksZaVopros(v) {
    if (vybor(v)) return BALL_ZA_VYBOR;
    if (sopostavlenie(v)) return spisok(v.items).length * BALL_ZA_PARU;
    return 0;
  }

  // Ответ на выбор — буква; на сопоставление — объект { номер пункта: буква }.
  function ballZaVopros(v, otvet) {
    if (vybor(v)) {
      var b = chisto(otvet);
      return b !== '' && b === chisto(v.correctAnswer) ? BALL_ZA_VYBOR : 0;
    }
    if (sopostavlenie(v)) {
      var pary = otvet && typeof otvet === 'object' ? otvet : {};
      var ball = 0;
      spisok(v.items).forEach(function (p, j) {
        var vybrano = chisto(pary[klyuchPunkta(p, j)]);
        if (vybrano !== '' && vybrano === chisto(p && p.correct)) ball += BALL_ZA_PARU;
      });
      return ball;
    }
    return 0;
  }

  // Ответ дан целиком: в выборе — одна из букв вопроса, в сопоставлении — все пары.
  function otvetPolon(v, otvet) {
    if (vybor(v)) {
      var b = chisto(otvet);
      return b !== '' && bukvyVybora(v).indexOf(b) !== -1;
    }
    if (sopostavlenie(v)) {
      var pary = otvet && typeof otvet === 'object' ? otvet : {};
      var sprava = bukvySprava(v);
      return spisok(v.items).every(function (p, j) {
        var x = chisto(pary[klyuchPunkta(p, j)]);
        return x !== '' && sprava.indexOf(x) !== -1;
      });
    }
    return false;
  }

  function voprosyModulya(m) { return m ? spisok(m.voprosy) : []; }

  function maksModulya(m) {
    return voprosyModulya(m).reduce(function (s, v) { return s + maksZaVopros(v); }, 0);
  }

  // otvety — { номер вопроса в модуле, с нуля: ответ }.
  function schitatModul(m, otvety) {
    var ball = 0;
    voprosyModulya(m).forEach(function (v, i) { ball += ballZaVopros(v, otvety ? otvety[i] : undefined); });
    return { ball: ball, maks: maksModulya(m) };
  }

  // Номера (с нуля) вопросов модуля, на которые ответ не дан целиком.
  function propushchennye(m, otvety) {
    var net = [];
    voprosyModulya(m).forEach(function (v, i) {
      if (!otvetPolon(v, otvety ? otvety[i] : undefined)) net.push(i);
    });
    return net;
  }

  // Зачёт и «ниже 60 %» — в целых числах, без округлений: 44 · 100 ≥ 72 · 60.
  function dostatochno(ball, maks) { return maks > 0 && ball * 100 >= maks * PROCENT_ZACHETA; }
  function porogBallov(maks) { return Math.floor((maks * PROCENT_ZACHETA + 99) / 100); }
  // Процент — с округлением вниз: 43 из 72 — это 59 %, а не «60 %» рядом с незачётом.
  function protsent(ball, maks) { return maks > 0 ? Math.floor(ball * 100 / maks) : 0; }

  function testGotov(moduli) {
    var vse = spisok(moduli);
    return vse.length > 0 && vse.every(function (m) { return voprosyModulya(m).length >= VOPROSOV_V_MODULE; });
  }

  // rezultaty — { id модуля: { ball, maks, data } }. Результат модуля действует, пока
  // у модуля тот же максимум: вопросы переписали — модуль надо пройти заново.
  function itogTesta(moduli, rezultaty) {
    var vse = spisok(moduli);
    var r = rezultaty || {};
    var itog = {
      poModulyam: [], vsego: 0, maks: 0, proideno: 0, modulei: vse.length,
      gotov: testGotov(vse), vseProideny: false, zachet: null, porog: 0, protsent: 0, data: ''
    };
    vse.forEach(function (m) {
      var maks = maksModulya(m);
      var zapis = m ? r[stroka(m.id)] : null;
      var deistvuet = !!zapis && maks > 0 && zapis.maks === maks;
      itog.poModulyam.push({
        id: m ? m.id : null,
        maks: maks,
        ball: deistvuet ? zapis.ball : null,
        data: deistvuet ? zapis.data : '',
        proiden: deistvuet,
        ustarel: !!zapis && !deistvuet,
        slabyi: deistvuet && !dostatochno(zapis.ball, maks)
      });
      itog.maks += maks;
      if (deistvuet) {
        itog.vsego += zapis.ball;
        itog.proideno += 1;
        if (zapis.data > itog.data) itog.data = zapis.data;
      }
    });
    itog.porog = porogBallov(itog.maks);
    itog.protsent = protsent(itog.vsego, itog.maks);
    // «Готово к зачёту» или «Пока не хватает» — только когда тест готов и пройдены все модули.
    itog.vseProideny = itog.gotov && itog.proideno === vse.length;
    if (itog.vseProideny) itog.zachet = dostatochno(itog.vsego, itog.maks);
    return itog;
  }

  // Сохранённое в браузере читается с недоверием: чужое и битое отбрасывается.
  function razobratRezultaty(syroe) {
    var chistye = {};
    if (!syroe || typeof syroe !== 'object' || Array.isArray(syroe)) return chistye;
    Object.keys(syroe).forEach(function (k) {
      var z = syroe[k];
      if (z && typeof z === 'object' && celoe(z.ball) && celoe(z.maks) && z.maks > 0 &&
          z.ball >= 0 && z.ball <= z.maks &&
          typeof z.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(z.data)) {
        chistye[k] = { ball: z.ball, maks: z.maks, data: z.data };
      }
    });
    return chistye;
  }

  /* Слова и строки результата */

  function formaChisla(n, formy) {       // 1 балл, 2 балла, 5 баллов
    var d = n % 10, s = n % 100;
    if (d === 1 && s !== 11) return formy[0];
    if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return formy[1];
    return formy[2];
  }
  var BALL = ['балл', 'балла', 'баллов'];
  var VOPROS = ['вопрос', 'вопроса', 'вопросов'];
  function izBallov(n) { return n % 10 === 1 && n % 100 !== 11 ? 'балла' : 'баллов'; }  // «из 12 баллов»

  function dataRu(iso) {
    var c = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stroka(iso));
    return c ? c[3] + '.' + c[2] + '.' + c[1] : '';
  }

  function podpisLekcii(l) {
    if (l === 'bonus') return 'бонусный урок';
    var b = /^bonus-([12])$/.exec(stroka(l));
    if (b) return 'бонусный урок ' + b[1];
    var n = Number(l);
    return l !== '' && l != null && n >= 1 && n <= 3 && Math.floor(n) === n ? 'лекция ' + n : '';
  }

  // Итог — в начале текста: в заметке и на распечатке вердикт виден сразу.
  function tekstRezultata(moduli, itog) {
    var nabrano = itog.vsego + ' из ' + itog.maks + ' (' + itog.protsent + ' %)';
    var stroki = [
      NAZVANIE_TESTA + ', НГУ, 2026',
      'Дата прохождения: ' + (dataRu(itog.data) || 'тест не завершён'),
      itog.zachet === null
        ? 'Набрано: ' + nabrano
        : 'Итог: ' + (itog.zachet ? SLOVA_ITOGA.da : SLOVA_ITOGA.net).toLowerCase() + ' — ' + nabrano + ', ' +
          SLOVA_ITOGA.porog.toLowerCase() + ' — от ' + itog.porog,
      ''
    ];
    spisok(moduli).forEach(function (m, i) {
      var st = itog.poModulyam[i];
      stroki.push(stroka(m.id) + '. ' + chisto(m.nazvanie) + ': ' +
        (st && st.proiden ? st.ball + ' из ' + st.maks : 'не пройден'));
    });
    return stroki.join('\n');
  }


  /* Данные и самопроверка */

  function pravilnyiOtvet(v) {
    if (vybor(v)) return chisto(v.correctAnswer);
    var pary = {};
    if (sopostavlenie(v)) {
      spisok(v.items).forEach(function (p, j) { pary[klyuchPunkta(p, j)] = chisto(p && p.correct); });
    }
    return pary;
  }

  // Изъян, из-за которого вопрос нельзя показать; такой вопрос движок пропускает.
  function izyanStruktury(v) {
    if (!v || typeof v !== 'object') return 'вопрос — не объект';
    if (vybor(v)) return spisok(v.options).length ? '' : 'нет вариантов (options)';
    if (sopostavlenie(v)) {
      if (!spisok(v.items).length) return 'нет пунктов (items)';
      if (!spisok(v.rightOptions).length) return 'нет вариантов (rightOptions)';
      return '';
    }
    return 'тип «' + stroka(v.type) + '» — нужен multiple_choice или matching';
  }

  function prigotovitModuli(syrye) {
    if (!Array.isArray(syrye)) {
      return { moduli: [], zagruzheny: false,
               zamechaniya: ['window.TEST_MODULI не задан: voprosy.js не загрузился или в нём ошибка.'] };
    }
    var zamechaniya = [];
    var moduli = [];
    syrye.forEach(function (m, mi) {
      if (!m || typeof m !== 'object') {
        zamechaniya.push('Модуль № ' + (mi + 1) + ' в списке — не объект, пропущен.');
        return;
      }
      var voprosy = [];
      spisok(m.voprosy).forEach(function (v, i) {
        var izyan = izyanStruktury(v);
        if (izyan) zamechaniya.push('Модуль ' + stroka(m.id) + ', вопрос ' + (i + 1) + ': ' + izyan + ' — вопрос не показан.');
        else voprosy.push(v);
      });
      moduli.push({
        id: m.id,
        nazvanie: chisto(m.nazvanie) || 'Модуль ' + stroka(m.id),
        lekciya: m.lekciya,
        razdel: stroka(m.razdel),
        voprosy: voprosy
      });
    });
    return { moduli: moduli, zagruzheny: true, zamechaniya: zamechaniya };
  }

  function razdelNaSaite(adres) { return /^\/(?!\/)/.test(stroka(adres)); }

  function proveritVopros(v, gde, zam) {
    var bukvy, podskazka = ' — не перепутаны ли латинская и русская буквы?';
    if (!chisto(v.text)) zam.push(gde + ': нет текста вопроса.');
    if (vybor(v)) {
      bukvy = bukvyVybora(v);
      if (bukvy.length < 2) zam.push(gde + ': вариантов меньше двух.');
      if (bukvy.indexOf('') !== -1) zam.push(gde + ': у варианта нет буквы (letter).');
      if (povtory(bukvy)) zam.push(gde + ': буквы вариантов повторяются.');
      if (bukvy.indexOf(chisto(v.correctAnswer)) === -1) {
        zam.push(gde + ': верный ответ «' + chisto(v.correctAnswer) + '» не найден среди букв ' + bukvy.join(', ') + podskazka);
      }
      if (Number(v.points) !== BALL_ZA_VYBOR) {
        zam.push(gde + ': points = ' + stroka(v.points) + ', а за выбор начисляется ' + BALL_ZA_VYBOR + '.');
      }
      return;
    }
    var punkty = spisok(v.items);
    bukvy = bukvySprava(v);
    if (punkty.length !== 3) zam.push(gde + ': пар ' + punkty.length + ', а в сопоставлении их три.');
    if (bukvy.length < punkty.length) zam.push(gde + ': вариантов справа меньше, чем пунктов.');
    if (bukvy.indexOf('') !== -1) zam.push(gde + ': у варианта справа нет буквы (letter).');
    if (povtory(bukvy)) zam.push(gde + ': буквы вариантов справа повторяются.');
    if (povtory(punkty.map(klyuchPunkta))) zam.push(gde + ': номера пунктов повторяются — ответы на них смешаются.');
    punkty.forEach(function (p, j) {
      var c = chisto(p && p.correct);
      if (bukvy.indexOf(c) === -1) {
        zam.push(gde + ', пункт ' + klyuchPunkta(p, j) + ': верный вариант «' + c + '» не найден среди букв ' + bukvy.join(', ') + podskazka);
      }
    });
    if (Number(v.points) !== punkty.length * BALL_ZA_PARU) {
      zam.push(gde + ': points = ' + stroka(v.points) + ', а за ' + punkty.length + ' пары начисляется ' + punkty.length * BALL_ZA_PARU + '.');
    }
  }

  // Проходит все модули верными ответами (как runAutomatedTest исходника) и сверяет
  // данные с правилами теста. Сохранённых результатов не трогает.
  function proverkaTesta(moduli, uzhe, modulei) {
    var vse = spisok(moduli);
    var nuzhnoModulei = modulei || NASTROJKI.modulei || MODULEI_V_TESTE;
    var zam = spisok(uzhe).slice();
    var otchet = { gotov: testGotov(vse), moduli: [], vsego: 0, maks: 0, porog: 0, zachet: false, zamechaniya: zam };
    var vstrechen = {};
    if (vse.length !== nuzhnoModulei) zam.push('Модулей ' + vse.length + ', а в тесте их ' + nuzhnoModulei + '.');
    vse.forEach(function (m) {
      var imya = 'Модуль ' + stroka(m.id);
      if (stroka(m.id) === '') zam.push('У модуля «' + m.nazvanie + '» нет id.');
      if (vstrechen[stroka(m.id)]) zam.push(imya + ': такой id уже есть — результаты модулей смешаются.');
      vstrechen[stroka(m.id)] = true;
      if (!podpisLekcii(m.lekciya)) zam.push(imya + ': lekciya «' + stroka(m.lekciya) + '» — нужен номер 1–3, \'bonus\', \'bonus-1\' или \'bonus-2\'.');
      if (!razdelNaSaite(m.razdel)) zam.push(imya + ': razdel «' + stroka(m.razdel) + '» — нужен адрес раздела на сайте, от «/».');
      var voprosy = voprosyModulya(m);
      if (voprosy.length !== VOPROSOV_V_MODULE) zam.push(imya + ': вопросов ' + voprosy.length + ' из ' + VOPROSOV_V_MODULE + '.');
      voprosy.forEach(function (v, i) { proveritVopros(v, imya + ', вопрос ' + (i + 1), zam); });
      var otvety = {};
      voprosy.forEach(function (v, i) { otvety[i] = pravilnyiOtvet(v); });
      var net = propushchennye(m, otvety);
      if (net.length) {
        zam.push(imya + ': верными ответами не заполняются вопросы ' + net.map(function (i) { return i + 1; }).join(', ') + '.');
      }
      var sch = schitatModul(m, otvety);
      if (voprosy.length && sch.ball !== sch.maks) zam.push(imya + ': верные ответы дают ' + sch.ball + ' из ' + sch.maks + '.');
      if (voprosy.length && sch.maks !== BALLOV_V_MODULE) {
        zam.push(imya + ': максимум ' + sch.maks + ' ' + formaChisla(sch.maks, BALL) + ', а нужно ' + BALLOV_V_MODULE +
          ' — три вопроса с выбором и два сопоставления.');
      }
      otchet.moduli.push({ id: m.id, nazvanie: m.nazvanie, voprosov: voprosy.length, ball: sch.ball, maks: sch.maks });
      otchet.vsego += sch.ball;
      otchet.maks += sch.maks;
    });
    otchet.porog = porogBallov(otchet.maks);
    otchet.zachet = dostatochno(otchet.vsego, otchet.maks);
    return otchet;
  }

  var yadro = {
    BALL_ZA_VYBOR: BALL_ZA_VYBOR,
    BALL_ZA_PARU: BALL_ZA_PARU,
    PROCENT_ZACHETA: PROCENT_ZACHETA,
    VOPROSOV_V_MODULE: VOPROSOV_V_MODULE,
    maksZaVopros: maksZaVopros,
    ballZaVopros: ballZaVopros,
    otvetPolon: otvetPolon,
    maksModulya: maksModulya,
    schitatModul: schitatModul,
    propushchennye: propushchennye,
    dostatochno: dostatochno,
    porogBallov: porogBallov,
    protsent: protsent,
    testGotov: testGotov,
    itogTesta: itogTesta,
    razobratRezultaty: razobratRezultaty,
    tekstRezultata: tekstRezultata,
    pravilnyiOtvet: pravilnyiOtvet,
    prigotovitModuli: prigotovitModuli,
    proverkaTesta: proverkaTesta
  };

  if (typeof module === 'object' && module && module.exports) module.exports = yadro;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  /* ── 2. Страница ─────────────────────────────────────────────────────────── */

  var KLYUCH_REZULTATOV = (NASTROJKI.klyuch || 'kurs-ii:test') + ':rezultaty';
  var KLYUCH_STAROJ_PODPISI = 'kurs-ii:test:podpis';   // прежние версии хранили имя — стираем
  var VIDY = ['test-panel', 'test-modul', 'test-rezultat'];

  var podgotovka = { moduli: [], zagruzheny: false, zamechaniya: [] };
  var MODULI = [];
  var rezultaty = {};
  var tekushchii = null;        // { modul, nomer, otvety, pokazatPropuski }
  var pamyat = {};              // запасное хранилище: память вкладки
  var tolkoPamyat = false;
  var otkryvshaya = null;       // кнопка, открывшая окно очистки

  function uzel(id) { return document.getElementById(id); }

  function el(teg, svoistva, deti) {
    var u = document.createElement(teg);
    if (svoistva) {
      Object.keys(svoistva).forEach(function (k) {
        var z = svoistva[k];
        if (z == null || z === false) return;
        if (k === 'text') u.textContent = z;
        else if (k === 'class') u.className = z;
        else u.setAttribute(k, z === true ? '' : String(z));
      });
    }
    spisok(deti).forEach(function (d) {
      if (d == null || d === '') return;
      u.appendChild(typeof d === 'string' ? document.createTextNode(d) : d);
    });
    return u;
  }

  /* Хранилище: localStorage, а если браузер его не даёт — память вкладки, как в исходнике. */

  function hranilishcheDostupno() {
    try {
      var k = 'kurs-ii:test:proba';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }

  function vPamyat() {
    if (tolkoPamyat) return;
    tolkoPamyat = true;
    risovatPlashki();
  }

  function prochitat(klyuch) {
    var syroe = null;
    if (!tolkoPamyat) {
      try { syroe = window.localStorage.getItem(klyuch); } catch (e) { vPamyat(); }
    }
    if (syroe == null && Object.prototype.hasOwnProperty.call(pamyat, klyuch)) syroe = pamyat[klyuch];
    if (!syroe) return null;
    try { return JSON.parse(syroe); } catch (e) { return null; }
  }

  function zapisat(klyuch, znachenie) {
    var tekst = JSON.stringify(znachenie);
    pamyat[klyuch] = tekst;
    if (tolkoPamyat) return;
    try { window.localStorage.setItem(klyuch, tekst); } catch (e) { vPamyat(); }
  }

  function udalit(klyuch) {
    delete pamyat[klyuch];
    if (tolkoPamyat) return;
    try { window.localStorage.removeItem(klyuch); } catch (e) { vPamyat(); }
  }

  /* Общие механики сайта (sajt.js) — с запасом на случай, если он не загрузился. */

  function soobshchenie(tekst) {
    if (window.KursII && window.KursII.soobshchenie) window.KursII.soobshchenie(tekst);
  }

  function kopirovat(tekst) {
    if (window.KursII && window.KursII.kopirovat) return window.KursII.kopirovat(tekst);
    return Promise.resolve(false);
  }

  function vydelit(u) {
    var diapazon = document.createRange();
    diapazon.selectNodeContents(u);
    var vybrannoe = window.getSelection();
    vybrannoe.removeAllRanges();
    vybrannoe.addRange(diapazon);
  }

  /* Прокрутка и фокус: цель встаёт под липкую шапку, высота шапки замеряется. */

  function podvesti(u) {
    if (!u) return;
    var shapka = document.querySelector('.nav');
    var otstup = (shapka ? shapka.getBoundingClientRect().height : 0) + 16;
    var y = u.getBoundingClientRect().top + window.pageYOffset - otstup;
    window.scrollTo(0, Math.max(0, Math.round(y)));
  }

  function fokus(u) {
    if (!u) return;
    try { u.focus({ preventScroll: true }); } catch (e) { u.focus(); }
  }

  function pokazatVid(id) {
    VIDY.forEach(function (v) { uzel(v).hidden = v !== id; });
  }

  function segodnya() {
    var d = new Date();
    function dva(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + dva(d.getMonth() + 1) + '-' + dva(d.getDate());
  }

  function korotko(tekst, n) {
    var s = chisto(tekst);
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function najtiModul(id) {
    for (var i = 0; i < MODULI.length; i++) {
      if (stroka(MODULI[i].id) === stroka(id)) return MODULI[i];
    }
    return null;
  }

  function podpisModulya(m) {
    var l = podpisLekcii(m.lekciya);
    return 'Модуль ' + stroka(m.id) + (l ? ' · ' + l : '');
  }

  function ssylkaPovtora(m, klass) {
    if (!razdelNaSaite(m.razdel)) return null;
    var l = podpisLekcii(m.lekciya);
    return el('a', { href: m.razdel, class: klass, text: 'Повторить: ' + (l ? l + ', ' : '') + 'раздел «' + m.nazvanie + '»' });
  }

  function balliIz(ball, maks) { return ball + ' из ' + maks; }
  function procentyTekst(ball, maks) { return protsent(ball, maks) + ' %'; }

  /* Плашки наверху */

  function plashka(glavnoe, dalshe) {
    return el('p', { class: 'note' }, [el('strong', { text: glavnoe }), dalshe ? ' ' + dalshe : null]);
  }

  function risovatPlashki() {
    var mesto = uzel('test-plashki');
    if (!mesto) return;
    mesto.textContent = '';
    if (!podgotovka.zagruzheny) {
      mesto.appendChild(plashka('Вопросы теста не загрузились.', 'Обновите страницу; если не поможет — напишите автору курса.'));
    } else if (!testGotov(MODULI)) {
      mesto.appendChild(plashka('Тест готовится:', 'вопросы появятся вместе с конспектами 2026 года.'));
    }
    if (tolkoPamyat) {
      mesto.appendChild(plashka('Результаты сохранятся только до закрытия вкладки.',
        'Браузер не даёт сохранить их надолго — не обновляйте страницу и не уходите с неё, пока не скопируете итог.'));
    }
  }

  /* Панель: итог, сводка, карточки модулей */

  function risovatPanel() {
    var itog = itogTesta(MODULI, rezultaty);
    risovatItog(itog);
    risovatSvodku(itog);
    risovatKartochki(itog);
    return itog;
  }

  function risovatSvodku(itog) {
    var s = uzel('test-svodka');
    s.hidden = !itog.proideno;
    s.textContent = itog.proideno
      ? 'Пройдено модулей: ' + itog.proideno + ' из ' + itog.modulei + ' · набрано ' +
        balliIz(itog.vsego, itog.maks) + ' ' + izBallov(itog.maks) + '.'
      : '';
  }

  function risovatKartochki(itog) {
    var setka = uzel('test-moduli');
    setka.textContent = '';
    MODULI.forEach(function (m, i) {
      var st = itog.poModulyam[i];
      var n = m.voprosy.length;
      var status = null;
      var knopka;
      if (!n) {
        knopka = el('button', { type: 'button', class: 'btn', disabled: true, text: 'Готовится' });
      } else {
        if (st.proiden) {
          status = el('p', null, ['Пройден: ', el('strong', { text: balliIz(st.ball, st.maks) }),
            ' ' + izBallov(st.maks) + ' · ' + dataRu(st.data)]);
        } else if (st.ustarel) {
          status = el('p', { text: 'Вопросы модуля обновились — пройдите его заново.' });
        } else if (n < VOPROSOV_V_MODULE) {
          status = el('p', { text: 'Готово вопросов: ' + n + ' из ' + VOPROSOV_V_MODULE + '.' });
        } else {
          status = el('p', { text: n + ' ' + formaChisla(n, VOPROS) + ' · ' + st.maks + ' ' + formaChisla(st.maks, BALL) });
        }
        knopka = el('button', {
          type: 'button',
          class: st.proiden ? 'btn' : 'btn btn--primary',
          'data-deistvie': 'nachat',
          'data-modul': m.id
        }, [st.proiden ? 'Пройти заново' : 'Пройти модуль', el('span', { class: 'visually-hidden', text: ': ' + m.nazvanie })]);
      }
      setka.appendChild(el('div', { class: 'card test-kartochka' }, [
        el('p', { class: 'num', text: podpisModulya(m) }),
        el('h3', { text: m.nazvanie }),
        status,
        el('div', { class: 'btn-row' }, [knopka])
      ]));
    });
  }

  /* Итоговая карточка — когда тест готов и пройдены все модули */

  function risovatItog(itog) {
    var karta = uzel('test-itog');
    var bylo = uzel('test-itog-detali');
    var detaliOtkryty = !!(bylo && bylo.open);
    karta.textContent = '';
    if (!itog.vseProideny) { karta.hidden = true; return; }
    karta.hidden = false;

    var tekst = tekstRezultata(MODULI, itog);

    karta.appendChild(el('h2', { id: 'test-itog-zag', tabindex: '-1', text: NASTROJKI.zagolovokItoga || 'Итог тренировки' }));
    karta.appendChild(el('dl', { class: 'test-itog__svedeniya' }, [
      el('dt', { text: 'Дата прохождения' }),
      el('dd', { text: dataRu(itog.data) })
    ]));

    var telo = el('tbody');
    MODULI.forEach(function (m, i) {
      var st = itog.poModulyam[i];
      var imya = el('th', { scope: 'row' }, [stroka(m.id) + '. ' + m.nazvanie]);
      var povtor = st.slabyi ? ssylkaPovtora(m, 'test-itog__povtor') : null;
      if (povtor) imya.appendChild(povtor);
      telo.appendChild(el('tr', null, [imya, el('td', { text: balliIz(st.ball, st.maks) })]));
    });
    karta.appendChild(el('table', null, [
      el('caption', { class: 'visually-hidden', text: 'Баллы по модулям' }),
      telo,
      el('tfoot', null, [el('tr', null, [
        el('th', { scope: 'row', text: 'Всего' }),
        // процент — второй строкой: иначе столбец баллов на телефоне отнимает место у названий
        el('td', null, [balliIz(itog.vsego, itog.maks), ' ',
          el('span', { class: 'test-itog__procent', text: procentyTekst(itog.vsego, itog.maks) })])
      ])])
    ]));

    karta.appendChild(el('p', {
      class: 'test-itog__verdikt' + (itog.zachet ? ' is-zachet' : ''),
      text: itog.zachet ? SLOVA_ITOGA.da : SLOVA_ITOGA.net
    }));
    karta.appendChild(el('p', {
      text: SLOVA_ITOGA.porog + ' — от ' + itog.porog + ' из ' + itog.maks + ' ' + izBallov(itog.maks) +
        ' (' + PROCENT_ZACHETA + ' %).' +
        (itog.zachet ? '' : ' Модули ниже ' + PROCENT_ZACHETA + ' % отмечены ссылками на разделы конспекта; их можно пройти заново.')
    }));

    // Зачёт сдаётся в форме: кнопка берёт адрес со страницы (data-forma-zacheta), он живёт в одном месте
    var forma = NASTROJKI.knopkaZacheta === false ? null : document.querySelector('[data-forma-zacheta]');
    if (forma) {
      karta.appendChild(el('p', { class: 'test-net-pechati' }, [
        el('a', { class: 'btn ' + (itog.zachet ? 'btn--primary ' : '') + 'ext', href: forma.getAttribute('href'),
          target: '_blank', rel: 'noopener noreferrer',
          text: itog.zachet ? 'Сдать зачёт в ведомость' : 'Зачёт — в форме, когда будете готовы' })
      ]));
    }

    var detali = el('details', { id: 'test-itog-detali', class: 'test-itog__detali test-net-pechati' }, [
      el('summary', { text: 'Текст результата' }),
      el('pre', { id: 'test-itog-tekst', class: 'test-itog__tekst', text: tekst })
    ]);
    if (detaliOtkryty) detali.open = true;
    karta.appendChild(detali);

    karta.appendChild(el('div', { class: 'btn-row' }, [
      el('button', { type: 'button', class: 'btn btn--primary', 'data-deistvie': 'kopirovat', text: 'Скопировать результат' }),
      el('button', { type: 'button', class: 'btn', 'data-deistvie': 'pechat', text: 'Распечатать' })
    ]));
    karta.appendChild(el('p', {
      class: 'caption test-net-pechati',
      text: NASTROJKI.podpisItoga || 'Это тренировка: баллы хранятся только в этом браузере. Зачёт — в форме, результат попадёт в ведомость.'
    }));
  }

  /* Модуль: вопросы по одному, «Назад» и «Далее» */

  function nachatModul(id) {
    var m = najtiModul(id);
    if (!m || !m.voprosy.length) return;
    tekushchii = { modul: m, nomer: 0, otvety: {}, pokazatPropuski: false };
    uzel('test-modul-kicker').textContent = podpisModulya(m);
    uzel('test-modul-zag').textContent = m.nazvanie;
    var oshibka = uzel('test-oshibka');
    oshibka.hidden = true;
    oshibka.textContent = '';
    oshibka.removeAttribute('data-sostav');
    pokazatVid('test-modul');
    risovatVopros();
    podvesti(uzel('test-modul'));
    fokus(uzel('test-modul-zag'));
  }

  function sobratVybor(v, otvet) {
    var nado = chisto(otvet);
    var gruppa = el('div', { class: 'test-varianty' });
    spisok(v.options).forEach(function (o) {
      var b = chisto(o && o.letter);
      var knopka = el('input', { type: 'radio', name: 'test-otvet', value: b });
      if (b !== '' && b === nado) knopka.checked = true;
      gruppa.appendChild(el('label', { class: 'test-variant' }, [
        knopka,
        el('span', { class: 'test-bukva', text: b ? b + '.' : '' }),
        el('span', { class: 'test-variant__tekst', text: stroka(o && o.text) })
      ]));
    });
    return [gruppa, el('p', { id: 'test-propusk', class: 'test-propusk', hidden: true, text: 'Выберите один вариант ответа.' })];
  }

  function sobratSopostavlenie(v, otvet) {
    var pary = otvet && typeof otvet === 'object' ? otvet : {};
    var sprava = spisok(v.rightOptions);
    var spisokSprava = el('ul', { class: 'test-sopost-varianty' });
    sprava.forEach(function (o) {
      var b = chisto(o && o.letter);
      spisokSprava.appendChild(el('li', null, [
        el('span', { class: 'test-bukva', text: b ? b + '.' : '' }),
        el('span', { text: stroka(o && o.text) })
      ]));
    });
    var blok = el('div', { class: 'test-pary' });
    spisok(v.items).forEach(function (p, j) {
      var k = klyuchPunkta(p, j);
      var idVybora = 'test-para-' + j;
      var spisokVybora = el('select', { id: idVybora, 'data-punkt': k });
      spisokVybora.appendChild(el('option', { value: '', text: 'Выберите вариант' }));
      sprava.forEach(function (o) {
        var b = chisto(o && o.letter);
        spisokVybora.appendChild(el('option', { value: b, text: b + ' — ' + chisto(o && o.text) }));
      });
      var nado = chisto(pary[k]);
      spisokVybora.value = nado !== '' && bukvySprava(v).indexOf(nado) !== -1 ? nado : '';
      blok.appendChild(el('div', { class: 'test-para' }, [
        el('label', { for: idVybora }, [
          el('span', { class: 'test-bukva', text: k + '.' }),
          el('span', { text: stroka(p && p.text) })
        ]),
        el('div', { class: 'test-strelka' }, [spisokVybora]),
        el('p', { id: idVybora + '-propusk', class: 'test-propusk', hidden: true, text: 'Пара не выбрана.' })
      ]));
    });
    return [
      el('p', { class: 'test-vopros__podskazka', text: 'Для каждого пункта выберите подходящий вариант. Каждая верная пара — ' +
        BALL_ZA_PARU + ' ' + formaChisla(BALL_ZA_PARU, BALL) + '.' }),
      el('p', { class: 'test-podzag', text: 'Варианты' }),
      spisokSprava,
      el('p', { class: 'test-podzag', text: 'Пары' }),
      blok
    ];
  }

  function sobratVopros(v, i, n, otvet) {
    var maks = maksZaVopros(v);
    var fs = el('fieldset', { class: 'test-vopros' }, [
      el('legend', null, [
        el('h3', { id: 'test-vopros-zag', class: 'test-vopros__zag', tabindex: '-1' }, [
          el('span', { class: 'test-vopros__nomer', text: 'Вопрос ' + (i + 1) + ' из ' + n + ' · ' + maks + ' ' + formaChisla(maks, BALL) }),
          el('span', { class: 'test-vopros__tekst', text: stroka(v.text) })
        ])
      ])
    ]);
    (vybor(v) ? sobratVybor(v, otvet) : sobratSopostavlenie(v, otvet)).forEach(function (u) { fs.appendChild(u); });
    return fs;
  }

  // Ответ читается из формы — тем же кодом пользуется и самопроверка.
  function otvetIzFormy(koren, v) {
    if (vybor(v)) {
      var otmechen = koren.querySelector('input[type="radio"]:checked');
      return otmechen ? otmechen.value : '';
    }
    var pary = {};
    Array.prototype.forEach.call(koren.querySelectorAll('select[data-punkt]'), function (s) {
      pary[s.getAttribute('data-punkt')] = s.value;
    });
    return pary;
  }

  function tekushchayaForma() { return uzel('test-vopros-mesto').firstChild; }

  function zapomnitOtvet() {
    var t = tekushchii;
    var fs = tekushchayaForma();
    if (t && fs) t.otvety[t.nomer] = otvetIzFormy(fs, t.modul.voprosy[t.nomer]);
  }

  // Подсказки у пропущенного — только после попытки завершить модуль.
  function otmetitPropuski() {
    var t = tekushchii;
    var fs = tekushchayaForma();
    if (!t || !fs) return;
    var v = t.modul.voprosy[t.nomer];
    if (vybor(v)) {
      var net = t.pokazatPropuski && !otvetPolon(v, otvetIzFormy(fs, v));
      uzel('test-propusk').hidden = !net;
      Array.prototype.forEach.call(fs.querySelectorAll('input[type="radio"]'), function (r) {
        if (net) r.setAttribute('aria-describedby', 'test-propusk');
        else r.removeAttribute('aria-describedby');
      });
      return;
    }
    Array.prototype.forEach.call(fs.querySelectorAll('select[data-punkt]'), function (s) {
      var pusto = t.pokazatPropuski && s.value === '';
      uzel(s.id + '-propusk').hidden = !pusto;
      if (pusto) {
        s.setAttribute('aria-invalid', 'true');
        s.setAttribute('aria-describedby', s.id + '-propusk');
      } else {
        s.removeAttribute('aria-invalid');
        s.removeAttribute('aria-describedby');
      }
    });
  }

  // Перечень пропущенных вопросов под вопросом: кнопки ведут к каждому.
  function obnovitSvodkuPropuskov(sFokusom) {
    var t = tekushchii;
    var box = uzel('test-oshibka');
    if (!t || !t.pokazatPropuski) {
      box.hidden = true;
      box.textContent = '';
      box.removeAttribute('data-sostav');
      return;
    }
    var net = propushchennye(t.modul, t.otvety);
    var sostav = net.join(',');
    if (box.getAttribute('data-sostav') !== sostav || box.hidden) {
      box.setAttribute('data-sostav', sostav);
      box.textContent = '';
      box.hidden = false;
      if (!net.length) {
        box.appendChild(el('p', { class: 'note__title', text: 'Все вопросы отвечены — модуль можно завершить.' }));
      } else {
        box.appendChild(el('p', {
          class: 'note__title',
          text: 'Ответьте на все вопросы модуля. Без ответа: ' + (net.length === 1 ? 'вопрос ' : 'вопросы ') +
            net.map(function (i) { return i + 1; }).join(', ') + '.'
        }));
        var ryad = el('ul');
        net.forEach(function (i) {
          ryad.appendChild(el('li', null, [el('button', {
            type: 'button', class: 'btn btn--quiet', 'data-deistvie': 'k-voprosu', 'data-nomer': i,
            text: 'Вопрос ' + (i + 1) + ': ' + korotko(t.modul.voprosy[i].text, 70)
          })]));
        });
        box.appendChild(ryad);
      }
    }
    if (sFokusom) { podvesti(box); fokus(box); }
  }

  function risovatVopros() {
    var t = tekushchii;
    var n = t.modul.voprosy.length;
    var mesto = uzel('test-vopros-mesto');
    mesto.textContent = '';
    mesto.appendChild(sobratVopros(t.modul.voprosy[t.nomer], t.nomer, n, t.otvety[t.nomer]));
    otmetitPropuski();
    uzel('test-progress-polosa').style.width = Math.round((t.nomer + 1) * 100 / n) + '%';
    uzel('test-nazad').textContent = t.nomer === 0 ? 'К списку модулей' : 'Назад';
    uzel('test-dalee').textContent = t.nomer === n - 1 ? 'Завершить модуль' : 'Далее';
    obnovitSvodkuPropuskov(false);
  }

  function perejti(nomer) {
    var t = tekushchii;
    if (!t || !(nomer >= 0 && nomer < t.modul.voprosy.length)) return;
    t.nomer = nomer;
    risovatVopros();
    podvesti(uzel('test-modul'));
    fokus(uzel('test-vopros-zag'));
  }

  function dalee() {
    var t = tekushchii;
    if (!t) return;
    zapomnitOtvet();
    if (t.nomer < t.modul.voprosy.length - 1) { perejti(t.nomer + 1); return; }
    if (propushchennye(t.modul, t.otvety).length) {
      t.pokazatPropuski = true;
      otmetitPropuski();
      obnovitSvodkuPropuskov(true);
      return;
    }
    zavershitModul();
  }

  function nazad() {
    var t = tekushchii;
    if (!t) return;
    zapomnitOtvet();
    if (t.nomer === 0) { kSpisku(); return; }
    perejti(t.nomer - 1);
  }

  // После модуля — только его балл, без разбора ответов: тест аттестационный.
  function zavershitModul() {
    var t = tekushchii;
    var sch = schitatModul(t.modul, t.otvety);
    rezultaty[stroka(t.modul.id)] = { ball: sch.ball, maks: sch.maks, data: segodnya() };
    zapisat(KLYUCH_REZULTATOV, rezultaty);
    tekushchii = null;
    pokazatRezultat(t.modul, sch);
  }

  function pokazatRezultat(m, sch) {
    var itog = itogTesta(MODULI, rezultaty);
    uzel('test-rezultat-kicker').textContent = podpisModulya(m) + ' · ' + m.nazvanie;
    var ball = uzel('test-rezultat-ball');
    ball.textContent = '';
    ball.appendChild(el('strong', { text: balliIz(sch.ball, sch.maks) }));
    ball.appendChild(document.createTextNode(' ' + izBallov(sch.maks) + ' · ' + procentyTekst(sch.ball, sch.maks)));

    var dop = uzel('test-rezultat-dop');
    dop.textContent = '';
    if (!dostatochno(sch.ball, sch.maks)) {
      dop.appendChild(el('p', null, ['Результат ниже ' + PROCENT_ZACHETA + ' %. ', ssylkaPovtora(m)]));
    }
    if (itog.vseProideny) dop.appendChild(el('p', { text: 'Все модули пройдены — итог теста готов.' }));

    var knopki = uzel('test-rezultat-knopki');
    knopki.textContent = '';
    if (itog.vseProideny) {
      knopki.appendChild(el('button', { type: 'button', class: 'btn btn--primary', 'data-deistvie': 'k-itogu', text: 'Открыть итог' }));
    }
    knopki.appendChild(el('button', {
      type: 'button', class: itog.vseProideny ? 'btn' : 'btn btn--primary', 'data-deistvie': 'k-spisku', text: 'К списку модулей'
    }));
    knopki.appendChild(el('button', {
      type: 'button', class: 'btn btn--quiet', 'data-deistvie': 'nachat', 'data-modul': m.id, text: 'Пройти модуль заново'
    }));

    pokazatVid('test-rezultat');
    podvesti(uzel('test-rezultat'));
    fokus(uzel('test-rezultat-zag'));
  }

  function kSpisku() {
    tekushchii = null;
    pokazatVid('test-panel');
    risovatPanel();
    podvesti(uzel('test-moduli-zag'));
    fokus(uzel('test-moduli-zag'));
  }

  function kItogu() {
    tekushchii = null;
    pokazatVid('test-panel');
    risovatPanel();
    podvesti(uzel('test-itog'));
    fokus(uzel('test-itog-zag'));
  }

  /* Итог: скопировать, отправить, распечатать */

  function otmetitKnopku(knopka) {
    if (knopka.getAttribute('data-bylo')) return;
    knopka.setAttribute('data-bylo', knopka.textContent);
    knopka.textContent = 'Скопировано';
    setTimeout(function () {
      knopka.textContent = knopka.getAttribute('data-bylo');
      knopka.removeAttribute('data-bylo');
    }, 2000);
  }

  function kopirovatItog(knopka) {
    var tekst = tekstRezultata(MODULI, itogTesta(MODULI, rezultaty));
    var gotovo = function (vyshlo) {
      if (vyshlo) {
        otmetitKnopku(knopka);
        soobshchenie('Результат скопирован. Сохраните его в заметке или документе: ⌘V или Ctrl+V.');
        return;
      }
      var detali = uzel('test-itog-detali');
      var pre = uzel('test-itog-tekst');
      if (detali) detali.open = true;
      if (pre) vydelit(pre);
      soobshchenie('Текст выделен — нажмите ⌘C или Ctrl+C.');
    };
    kopirovat(tekst).then(gotovo, function () { gotovo(false); });
  }

  /* Очистка — нативное окно <dialog>. Очищает только нажатие «Очистить» (сразу, по щелчку);
     Escape и «Отмена» просто закрывают окно. Событие close приходит позже, с кадром
     отрисовки, — на нём только возврат фокуса. */

  function sprositOchistku(knopka) {
    var okno = uzel('test-ochistka-dialog');
    if (!okno || typeof okno.showModal !== 'function') {
      if (window.confirm('Очистить результаты? Баллы всех модулей удалятся из этого браузера.')) ochistitVse();
      return;
    }
    otkryvshaya = knopka;
    okno.showModal();
    fokus(uzel('test-ochistka-otmena'));
  }

  function ochistitVse() {
    rezultaty = {};
    udalit(KLYUCH_REZULTATOV);
    tekushchii = null;
    pokazatVid('test-panel');
    risovatPanel();
    soobshchenie('Результаты очищены.');
  }

  /* Служебная самопроверка — только из консоли: __proverkaTesta() */

  function samoproverka() {
    var otchet = proverkaTesta(MODULI, podgotovka.zamechaniya, NASTROJKI.modulei);
    // Второй проход — через форму: верный ответ рисуется в вопросе и читается обратно
    // тем же кодом, что и ответы слушателя.
    MODULI.forEach(function (m, mi) {
      var otvety = {};
      m.voprosy.forEach(function (v, i) {
        otvety[i] = otvetIzFormy(sobratVopros(v, i, m.voprosy.length, pravilnyiOtvet(v)), v);
      });
      var sch = schitatModul(m, otvety);
      otchet.moduli[mi].cherezFormu = sch.ball;
      if (sch.ball !== otchet.moduli[mi].ball) {
        otchet.zamechaniya.push('Модуль ' + stroka(m.id) + ': через форму ' + sch.ball + ' из ' + sch.maks +
          ', а по данным ' + otchet.moduli[mi].ball + '.');
      }
    });
    if (console.table) {
      console.table(otchet.moduli.map(function (r) {
        return { 'модуль': r.id, 'название': r.nazvanie, 'вопросов': r.voprosov,
                 'баллы': balliIz(r.ball, r.maks), 'через форму': r.cherezFormu };
      }));
    }
    var svodka = 'Самопроверка: верные ответы дают ' + balliIz(otchet.vsego, otchet.maks) + ' ' + izBallov(otchet.maks) +
      ', порог зачёта — ' + otchet.porog + '.';
    if (!otchet.gotov) console.info('Тест готовится: вопросов пока меньше, чем нужно. ' + svodka);
    if (otchet.zamechaniya.length) {
      console.warn(svodka + ' Замечаний: ' + otchet.zamechaniya.length + '\n— ' + otchet.zamechaniya.join('\n— '));
    } else {
      console.info(svodka + ' Замечаний нет.');
    }
    return otchet;
  }

  /* Запуск */

  function podklyuchit() {
    uzel('test-koren').addEventListener('click', function (sobytie) {
      var u = sobytie.target.closest ? sobytie.target.closest('[data-deistvie]') : null;
      if (!u) return;
      var d = u.getAttribute('data-deistvie');
      if (d === 'nachat') nachatModul(u.getAttribute('data-modul'));
      else if (d === 'nazad') nazad();
      else if (d === 'k-voprosu') { zapomnitOtvet(); perejti(Number(u.getAttribute('data-nomer'))); }
      else if (d === 'k-spisku') kSpisku();
      else if (d === 'k-itogu') kItogu();
      else if (d === 'kopirovat') kopirovatItog(u);
      else if (d === 'pechat') window.print();
      else if (d === 'ochistit') sprositOchistku(u);
      else if (d === 'ochistit-da') ochistitVse();   // окно затем закроет сама форма method="dialog"
    });

    var forma = uzel('test-forma');
    forma.addEventListener('submit', function (sobytie) { sobytie.preventDefault(); dalee(); });
    forma.addEventListener('change', function () {
      zapomnitOtvet();
      otmetitPropuski();
      obnovitSvodkuPropuskov(false);
    });

    var okno = uzel('test-ochistka-dialog');
    if (okno) {
      okno.addEventListener('close', function () {
        if (otkryvshaya) fokus(otkryvshaya);
        otkryvshaya = null;
      });
    }
  }

  function zapusk() {
    podgotovka = prigotovitModuli(window.TEST_MODULI);
    MODULI = podgotovka.moduli;
    podgotovka.zamechaniya.forEach(function (z) { console.warn(NAZVANIE_TESTA + ': ' + z); });
    tolkoPamyat = !hranilishcheDostupno();
    rezultaty = razobratRezultaty(prochitat(KLYUCH_REZULTATOV));
    udalit(KLYUCH_STAROJ_PODPISI);
    risovatPlashki();
    uzel('test-moduli-razdel').hidden = false;
    pokazatVid('test-panel');
    risovatPanel();
    podklyuchit();
    window.__proverkaTesta = samoproverka;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', zapusk);
  else zapusk();
})();
