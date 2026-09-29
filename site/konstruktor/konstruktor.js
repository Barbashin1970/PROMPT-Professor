/* Конструктор промптов для преподавателя — /konstruktor/.
   Проект — docs/SAIT-PROEKT.md, §4.7. Собран из двух конструкторов автора:
     prompt-main          — списки роли, задачи, аудитории, формата; поле темы; шесть ползунков
                            качества; живой предпросмотр с правкой; запись с «:::»;
     smartcityprompt-main — три вида записи (:::, XML-теги, Markdown), заготовки в браузере,
                            блок источников, работа без сервера и ключей.
   Добавлено по разбору (docs/LEKCII-RAZBOR.md, §7): два слоя промпта, разрешение ответить
   «не знаю», ограничения как строки проверки VERIFY, пример с ходом решения, оценка токенов.

   Общие механики — из /assets/sajt.js: кнопка data-kopirovat, меню «Открыть в…»,
   KursII.soobshchenie и KursII.kopirovat. Если sajt.js не загрузился (страница открыта
   с диска), у копирования и сообщений есть запасной путь, а меню «Открыть в…» прячется.

   Чистая часть (справочники, сборка, кодирование ссылки) работает и в node — для проверок:
   node -e "const k = require('./konstruktor.js'); console.log(k.sobrat(k.primer()).zadachnyi)" */
(function () {
  'use strict';

  /* ── 1. Справочники ────────────────────────────────────────────────────────
     nazvanie — подпись в списке; chto — строка «что делает» под списком;
     ty — то же во втором лице, для промпта; disc — как роль сочетается с дисциплиной. */

  const ROLI = {
    metodist: {
      nazvanie: 'Методист по [дисциплине]', fraza: 'методист', disc: 'nuzhna',
      chto: 'Готовит задания, тесты и планы занятий точно по программе дисциплины.',
      ty: 'готовишь задания, тесты и планы занятий точно по программе дисциплины'
    },
    lektor: {
      nazvanie: 'Лектор-визионер', fraza: 'лектор-визионер', disc: 'da',
      chto: 'Объясняет сложное так, чтобы студенты поняли не только «что», но и «почему это важно».',
      ty: 'объясняешь сложное так, чтобы студенты поняли не только «что», но и «почему это важно»'
    },
    arhitektor: {
      nazvanie: 'Методист-архитектор', fraza: 'методист-архитектор', disc: 'da',
      chto: 'Проектирует курсы и программы: цели, модули, часы, формы контроля.',
      ty: 'проектируешь курсы и программы — цели, модули, часы, формы контроля'
    },
    fasilitator: {
      nazvanie: 'Практик-фасилитатор', fraza: 'практик-фасилитатор', disc: 'da',
      chto: 'Превращает теорию в задания и кейсы, где студенты учатся через действие.',
      ty: 'превращаешь теорию в задания и кейсы, где студенты учатся через действие'
    },
    kurator: {
      nazvanie: 'Куратор НИР', fraza: 'куратор НИР', disc: 'da',
      chto: 'Ведёт студенческие исследования: тема, гипотеза, методы, отзыв на черновики.',
      ty: 'ведёшь студенческие исследования — помогаешь с темой, гипотезой и методами и даёшь требовательный, но доброжелательный отзыв на черновики'
    },
    publikant: {
      nazvanie: 'Исследователь-публикант', fraza: 'исследователь-публикант', disc: 'da',
      chto: 'Пишет научные статьи и обзоры: опирается на литературу, отделяет факты от гипотез.',
      ty: 'пишешь научные статьи и обзоры — опираешься на литературу, отделяешь факты от гипотез и аргументируешь выводы'
    },
    administrator: {
      nazvanie: 'Администратор-организатор', fraza: 'администратор-организатор учебного процесса', disc: 'net',
      chto: 'Превращает решения кафедры в ясные документы и планы: сроки, ответственные, критерии.',
      ty: 'превращаешь решения кафедры в ясные документы и планы — со сроками, ответственными и критериями'
    },
    avtor: {
      nazvanie: 'Автор учебного пособия', fraza: 'автор учебного пособия', disc: 'da',
      chto: 'Пишет учебные тексты: объясняет просто, но не упрощает; даёт примеры и вопросы для самопроверки.',
      ty: 'пишешь учебные тексты — объясняешь просто, но не упрощаешь, даёшь примеры и вопросы для самопроверки'
    }
  };

  const ADAPTACII = {
    uproshchenie: {
      nazvanie: 'Упрощение',
      cel: (t) => `Адаптируй учебный материал по теме «${t}» — упрости его: короткие предложения, термины с пояснением в скобках, 2–3 примера из повседневной жизни. Научная корректность сохраняется.`,
      proverka: 'упрощение не исказило смысл: каждое утверждение осталось верным'
    },
    uglublenie: {
      nazvanie: 'Углубление',
      cel: (t) => `Адаптируй учебный материал по теме «${t}» — углуби его: теоретические обоснования, открытые вопросы и конкурирующие подходы, междисциплинарные связи, 2–3 исследовательские задачи.`,
      proverka: 'открытые вопросы отделены от установленных фактов, каждое добавление проверяемо'
    },
    gorizontal: {
      nazvanie: 'Горизонтальная — под другую специальность',
      cel: (t, spec) => `Адаптируй учебный материал по теме «${t}» для студентов специальности «${spec}»: уровень сложности сохрани, а примеры, задачи и контекст замени на близкие этой специальности.`,
      proverka: 'уровень сложности тот же, что в исходнике, все примеры — из новой специальности'
    }
  };

  const FREIMVORKI = {
    forest: { nazvanie: 'FOREST', imya: 'FOREST', razdely: 'факты, возможности, риски, примеры, решения, тренды' },
    pestle: { nazvanie: 'PESTLE', imya: 'PESTLE', razdely: 'политические, экономические, социальные, технологические, правовые и экологические факторы' },
    shlyapy: { nazvanie: '6 шляп де Боно', imya: '«6 шляп» де Боно', razdely: 'белая — факты, красная — чувства, чёрная — риски, жёлтая — выгоды, зелёная — идеи, синяя — выводы и следующий шаг' },
    swot: { nazvanie: 'SWOT', imya: 'SWOT', razdely: 'сильные стороны, слабые стороны, возможности, угрозы' }
  };

  const ZHANRY = {
    pismo: { nazvanie: 'Письмо', vin: 'письмо' },
    post: { nazvanie: 'Пост для Telegram-канала', vin: 'пост для Telegram-канала' },
    obyavlenie: { nazvanie: 'Объявление', vin: 'объявление' }
  };

  /* cel(тема, состояние) — строка GOAL; proverka(состояние) — первая строка VERIFY:
     проверка именно этой задачи, до строк из ограничений. */
  const ZADACHI = {
    test: {
      nazvanie: 'Тест с ключом ответов',
      cel: (t) => `Составь тест из 10 вопросов по теме «${t}» и ключ ответов к нему: 7 вопросов — с выбором одного ответа из четырёх, 2 — на установление соответствия, 1 — с открытым ответом.`,
      proverka: () => 'в каждом вопросе с выбором ровно один верный ответ, формулировки однозначны'
    },
    plan: {
      nazvanie: 'План занятия',
      cel: (t) => `Составь план занятия по теме «${t}» на одну пару (90 минут): цель, ожидаемые результаты, этапы с хронометражем, вопросы и задания для студентов, домашнее задание.`,
      proverka: () => 'время этапов складывается в 90 минут, у каждого этапа есть цель'
    },
    konspekt: {
      nazvanie: 'Конспект',
      cel: (t) => `Напиши конспект по теме «${t}»: ключевые понятия с определениями, основные положения, примеры, вопросы для самопроверки.`,
      proverka: () => 'каждое ключевое понятие определено до того, как используется'
    },
    adapt: {
      nazvanie: 'Адаптация материала',
      cel: (t, s) => ADAPTACII[s.adapt].cel(t, bezKavychek(s.spec.trim()) || '[СПЕЦИАЛЬНОСТЬ]'),
      proverka: (s) => ADAPTACII[s.adapt].proverka
    },
    keis: {
      nazvanie: 'Кейс для семинара',
      cel: (t) => `Разработай кейс для семинара по теме «${t}»: ситуация и исходные данные, 3–5 вопросов для обсуждения, ход работы на 60–80 минут, критерии оценки и ожидаемые выводы для преподавателя.`,
      proverka: () => 'на каждый вопрос кейса можно ответить по его исходным данным'
    },
    proverka: {
      nazvanie: 'Проверка студенческой работы по критериям',
      cel: (t) => `Проверь студенческую работу по теме «${t}» по критериям ниже: по каждому критерию — оценка, обоснование с цитатой из работы и совет, как улучшить. Итоговую отметку не ставь — её ставит преподаватель.`,
      proverka: () => 'по каждому критерию есть оценка, цитата из работы и совет'
    },
    obzor: {
      nazvanie: 'Обзор источников',
      cel: (t) => `Составь обзор источников по теме «${t}»: ключевые работы (не больше 10), для каждой — полное библиографическое описание, о чём она и чем полезна по теме; в конце — чего в литературе не хватает.`,
      proverka: () => 'у каждой работы указаны автор, название, год и место публикации'
    },
    freim: {
      nazvanie: 'Разбор темы по фреймворку',
      cel: (t, s) => `Разбери тему «${t}» по фреймворку ${FREIMVORKI[s.freim].imya} (${FREIMVORKI[s.freim].razdely}): каждый раздел — отдельным блоком, в конце — общий вывод.`,
      proverka: (s) => `все разделы ${FREIMVORKI[s.freim].imya} на месте, ни один не пропущен`
    },
    karta: {
      nazvanie: 'Текст по карте смыслов',
      cel: (t) => `Напиши текст по теме «${t}» по карте смыслов: возьми 2–3 рациональных и 2–3 эмоциональных смысла и авторский акцент. Карта смыслов — в материалах; если её там нет, сначала составь её по шести уровням (рациональный, эмоциональный, авторский, студенческий, контекстуальный, ценностный) и покажи до текста.`,
      proverka: () => 'в тексте есть 2–3 рациональных и 2–3 эмоциональных смысла из карты и авторский акцент'
    },
    pismo: {
      nazvanie: 'Письмо, пост или объявление',
      cel: (t, s) => `Напиши ${ZHANRY[s.zhanr].vin} по теме «${t}»: одна главная мысль, конкретика вместо общих слов, в конце — что сделать читателю.`,
      proverka: () => 'главная мысль ясна из первых двух предложений, в конце есть призыв к действию'
    },
    programma: {
      nazvanie: 'Программа курса',
      cel: (t) => `Составь программу курса по теме «${t}»: цель и планируемые результаты, 5–7 модулей с темами и часами лекций и практик, формы контроля, критерии оценки, список литературы.`,
      proverka: () => 'часы модулей складываются в общий объём курса, у каждого модуля есть форма контроля'
    }
  };

  const AUDITORII = {
    shkola: { nazvanie: 'Школьники', komu: 'школьники 9–11 классов', uroven: 'школьный: каждый термин объясняется, примеры из школьной программы и жизни' },
    k12: { nazvanie: '1–2 курс', komu: 'студенты 1–2 курса', uroven: 'базовый: термины вводятся с определениями, примеры простые и близкие' },
    k34: { nazvanie: '3–4 курс', komu: 'студенты 3–4 курса', uroven: 'продвинутый: базовые понятия дисциплины известны, профессиональные термины уместны' },
    mag: { nazvanie: 'Магистратура', komu: 'магистранты', uroven: 'исследовательский: дискуссионные вопросы, современные работы, междисциплинарные связи' },
    asp: { nazvanie: 'Аспирантура', komu: 'аспиранты', uroven: 'научный: методология, открытые проблемы, требования к публикациям' },
    koll: { nazvanie: 'Коллеги-преподаватели', komu: 'коллеги-преподаватели', uroven: 'профессиональный: разговор на равных, без азов дисциплины, с опорой на методику' }
  };

  const FORMATY = {
    tekst: { nazvanie: 'Связный текст', opis: 'Связный текст — абзацы по 3–5 предложений, подзаголовки там, где меняется мысль.' },
    spisok: { nazvanie: 'Список', opis: 'Список — один пункт на одну мысль, вложенность не глубже двух уровней.' },
    tablica: { nazvanie: 'Таблица', opis: 'Таблица — первая строка с заголовками столбцов, в ячейках коротко, без длинных абзацев.' },
    test: { nazvanie: 'Тест с ключом в конце', opis: 'Тест — вопросы пронумерованы, у вопросов с выбором варианты а)–г); ключ ответов — отдельным блоком в конце, после всех вопросов.' },
    slaidy: { nazvanie: 'План слайдов', opis: 'План слайдов — для каждого слайда номер, заголовок, 3–5 тезисов и что показать на картинке; без сплошного текста.' },
    latex: { nazvanie: 'LaTeX', opis: 'LaTeX — документ, который собирается в Overleaf без правок (pdfLaTeX; для русского языка — \\usepackage[T2A]{fontenc}, \\usepackage[utf8]{inputenc}, \\usepackage[russian]{babel}); формулы — в математическом режиме; весь ответ — один блок кода.' }
  };

  /* Шесть ползунков — как в prompt-main: пять по шкале 0–10 (уровни 0–3, 4–7, 8–10)
     и объём: 2000, 4000, 6000, 8000 знаков или «без ограничений». */
  const POLZUNKI = [
    { kl: 'detal', imya: 'детализация', urovni: ['общие сведения, только главное', 'главное и важные детали', 'детальный разбор, всё существенное'] },
    { kl: 'struk', imya: 'структурность', urovni: ['свободное изложение', 'разделы и абзацы без жёсткой схемы', 'строгая структура, логический порядок, нумерация'] },
    { kl: 'form', imya: 'формальность', urovni: ['дружеский, разговорный тон', 'нейтральный деловой тон', 'академический, формальный стиль'] },
    { kl: 'kreat', imya: 'креативность', urovni: ['стандартный, проверенный подход', 'свежие примеры в привычных рамках', 'неожиданный угол зрения'] },
    { kl: 'glub', imya: 'глубина анализа', urovni: ['базовый уровень, простые примеры', 'причины и следствия, сравнение подходов', 'глубокий анализ, продвинутые концепции'] }
  ];
  const OBEM = {
    1: { znakov: 2000, slovo: 'кратко' },
    2: { znakov: 4000, slovo: 'стандартно' },
    3: { znakov: 6000, slovo: 'подробно' },
    4: { znakov: 8000, slovo: 'очень подробно' },
    5: { znakov: 0, slovo: 'без ограничений' }
  };

  /* Ограничения: tekst — строка CONSTRAINTS, proverka — строка «☐» в VERIFY.
     Каждое сформулировано так, чтобы его можно было отметить галочкой. */
  const OGRANICHENIYA = [
    { kl: 'istochniki', tekst: () => 'Не выдумывай источники: каждая ссылка — с DOI, URL или ISBN; нет их — не приводи ссылку.', proverka: () => 'выдуманных источников нет, у каждой ссылки — DOI, URL или ISBN' },
    { kl: 'chisla', tekst: () => 'Каждое число — с источником и годом.', proverka: () => 'у каждого числа указаны источник и год' },
    { kl: 'kancelyarit', tekst: () => 'Без канцелярита и штампов («осуществляется», «играет важную роль», «в современном мире»): простые глаголы, конкретные слова.', proverka: () => 'нет канцелярита и штампов' },
    { kl: 'yazyk', tekst: (c) => `Язык — по уровню аудитории: ${c.komu}.`, proverka: (c) => `язык понятен аудитории: ${c.komu}` },
    { kl: 'dlina', nuzhenObem: true, tekst: (c) => `Не длиннее ${c.znakov} знаков.`, proverka: (c) => `объём не больше ${c.znakov} знаков` },
    { kl: 'klyuch', tekst: () => 'Дай ключ ответов и к каждому ответу — короткое пояснение, почему он верный.', proverka: () => 'есть ключ ответов, у каждого ответа — пояснение' },
    { kl: 'pd', tekst: () => 'Без персональных данных студентов: не используй и не запрашивай ФИО, контакты, оценки конкретных людей; в примерах — вымышленные имена.', proverka: () => 'нет персональных данных студентов' }
  ];
  const OGR_KLYUCHI = OGRANICHENIYA.map((o) => o.kl);

  const NE_ZNAYU = 'Если в материалах нет ответа или ты не уверен — прямо скажи об этом; не угадывай и не придумывай.';
  const ITOG_PROVERKI = 'Сверь ответ со списком и исправь, прежде чем выдавать.';
  const BEZ_PRIMEROV = 'образца нет — держись формата и ограничений выше.';
  const BEZ_OGRANICHENII = 'особых ограничений нет.';
  const VVOD_PROVERKI = 'перед выдачей пройди по списку:';
  const FINAL = 'Начни выполнение задачи.';
  const VIDY = { kolon: ':::', xml: 'XML-теги', md: 'Markdown' };

  /* ── 2. Состояние формы ────────────────────────────────────────────────────
     Одно и то же состояние — в форме, в заготовке и в ссылке после «#s=». Всё, что
     пришло извне (ссылка, localStorage), проходит normalizovat: неизвестное — по умолчанию. */

  const PREDELY = { disc: 120, spec: 120, tema: 300, krit: 20000, mat: 20000, prim: 20000, hod: 20000, slov: 20000 };

  function defoltnoe() {
    return {
      v: 1,
      rol: 'metodist', disc: '', zad: 'test', adapt: 'uproshchenie', freim: 'forest', zhanr: 'pismo', krit: '',
      tema: '', aud: 'k12', spec: '', fmt: 'tekst',
      detal: 5, struk: 5, form: 5, kreat: 5, glub: 5, obem: 2,
      ogr: ['istochniki', 'yazyk'], nz: true,
      mat: '', prim: '', hod: '', slov: '',
      vyvod: 'kolon'
    };
  }

  // Демонстрационный набор кнопки «Пример»
  const PRIMER = {
    rol: 'metodist', disc: 'истории', zad: 'test', tema: 'Крещение Руси и его последствия',
    aud: 'k12', fmt: 'test', ogr: ['istochniki', 'klyuch', 'yazyk'], nz: true
  };

  function primer() {
    return normalizovat(Object.assign(defoltnoe(), PRIMER));
  }

  function izSpiska(x, spravochnik, zapas) {
    return typeof x === 'string' && Object.prototype.hasOwnProperty.call(spravochnik, x) ? x : zapas;
  }

  function celoe(x, min, max, zapas) {
    const n = typeof x === 'number' ? x : (typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN);
    return Number.isInteger(n) && n >= min && n <= max ? n : zapas;
  }

  function stroka(x, predel) {
    return typeof x === 'string' ? x.slice(0, predel) : '';
  }

  function normalizovat(syroe) {
    const d = defoltnoe();
    const r = syroe && typeof syroe === 'object' && !Array.isArray(syroe) ? syroe : {};
    const s = {
      v: 1,
      rol: izSpiska(r.rol, ROLI, d.rol),
      disc: stroka(r.disc, PREDELY.disc),
      zad: izSpiska(r.zad, ZADACHI, d.zad),
      adapt: izSpiska(r.adapt, ADAPTACII, d.adapt),
      freim: izSpiska(r.freim, FREIMVORKI, d.freim),
      zhanr: izSpiska(r.zhanr, ZHANRY, d.zhanr),
      krit: stroka(r.krit, PREDELY.krit),
      tema: stroka(r.tema, PREDELY.tema),
      aud: izSpiska(r.aud, AUDITORII, d.aud),
      spec: stroka(r.spec, PREDELY.spec),
      fmt: izSpiska(r.fmt, FORMATY, d.fmt)
    };
    POLZUNKI.forEach((p) => { s[p.kl] = celoe(r[p.kl], 0, 10, d[p.kl]); });
    s.obem = celoe(r.obem, 1, 5, d.obem);
    // порядок ограничений — всегда как в справочнике: одна и та же форма даёт один и тот же текст
    s.ogr = Array.isArray(r.ogr) ? OGR_KLYUCHI.filter((k) => r.ogr.indexOf(k) !== -1) : d.ogr.slice();
    s.nz = typeof r.nz === 'boolean' ? r.nz : d.nz;
    s.mat = stroka(r.mat, PREDELY.mat);
    s.prim = stroka(r.prim, PREDELY.prim);
    s.hod = stroka(r.hod, PREDELY.hod);
    s.slov = stroka(r.slov, PREDELY.slov);
    s.vyvod = izSpiska(r.vyvod, VIDY, d.vyvod);
    return s;
  }

  /* ── 3. Сборка промпта ─────────────────────────────────────────────────────
     Сначала — смысловые части (sobratChasti), потом — запись в одном из трёх видов.
     Задачный промпт — восемь элементов формулы курса ROLE–GOAL–INPUT–FORMAT–STYLE–
     CONSTRAINTS–EXAMPLES–VERIFY; системный слой — роль, словарь дисциплины, правила,
     опора на файлы, проверка и отказ. */

  function bezKavychek(t) {
    return t.replace(/^[\s«»"“”„']+|[\s«»"“”„']+$/g, '');
  }

  function zaglavnaya(t) {
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  }

  function uroven(z) {
    return z <= 3 ? 0 : (z <= 7 ? 1 : 2);
  }

  // «Заголовок: текст» в строку или «Заголовок:» и текст с новой строки, если он многострочный
  function blok(zagolovok, tekst) {
    return tekst.indexOf('\n') === -1 ? zagolovok + ': ' + tekst : zagolovok + ':\n' + tekst;
  }

  function sobratChasti(s) {
    const rol = ROLI[s.rol];
    const aud = AUDITORII[s.aud];
    const obem = OBEM[s.obem];
    const disc = s.disc.trim();
    const spec = bezKavychek(s.spec.trim());
    const tema = bezKavychek(s.tema.trim());
    const mat = s.mat.trim();

    let po = '';
    if (rol.disc !== 'net') po = disc ? ' по ' + disc : (rol.disc === 'nuzhna' ? ' по [ДИСЦИПЛИНЕ]' : '');
    const kto = rol.fraza + po;
    const auditoriya = aud.komu + (spec ? ', специальность «' + spec + '»' : '');
    const kontekst = { komu: aud.komu, znakov: obem.znakov };

    // INPUT: аудитория, затем материалы — или честная пометка, что их нет
    const vhod = [`Аудитория — ${auditoriya}. Уровень ${aud.uroven}.`];
    if (s.zad === 'proverka') vhod.push(blok('Критерии оценки', s.krit.trim() || '[КРИТЕРИИ ОЦЕНКИ]'));
    if (mat) vhod.push(blok('Материалы и источники', mat));
    else if (s.zad === 'adapt') vhod.push('Исходный материал: [ВСТАВЬТЕ ИЛИ ПРИЛОЖИТЕ ИСХОДНЫЙ ТЕКСТ]');
    else if (s.zad === 'proverka') vhod.push('Работа студента: [ВСТАВЬТЕ ТЕКСТ РАБОТЫ БЕЗ ФИО СТУДЕНТА]');
    else vhod.push('Материалы не приложены: опирайся на общепринятые проверяемые сведения.');

    // CONSTRAINTS и VERIFY строятся из одних и тех же отмеченных ограничений
    const aktivnye = OGRANICHENIYA.filter((o) => s.ogr.indexOf(o.kl) !== -1 && !(o.nuzhenObem && !obem.znakov));
    const ogr = aktivnye.map((o) => o.tekst(kontekst));
    if (s.nz) ogr.push(NE_ZNAYU);
    const proverki = [ZADACHI[s.zad].proverka(s)].concat(aktivnye.map((o) => o.proverka(kontekst)));

    const primery = [];
    if (s.prim.trim()) primery.push({ zag: 'Пример хорошего результата — ориентир по форме и уровню, содержание не копируй', teg: 'example', tekst: s.prim.trim() });
    if (s.hod.trim()) primery.push({ zag: 'Пример с ходом решения — рассуждай так же, по шагам', teg: 'worked_example', tekst: s.hod.trim() });

    const zadacha = {
      rol: `Ты — ${kto}: ${rol.ty}.`,
      cel: ZADACHI[s.zad].cel(tema || '[ТЕМА]', s),
      vhod: vhod,
      format: FORMATY[s.fmt].opis + (obem.znakov ? ` Объём — около ${obem.znakov} знаков.` : ''),
      stil: POLZUNKI.map((p) => `${p.imya} ${s[p.kl]}/10 — ${p.urovni[uroven(s[p.kl])]}`),
      ogr: ogr,
      primery: primery,
      proverki: proverki
    };

    const sistema = {
      rol: `Ты — ${kto}: ${rol.ty}. Эти правила действуют в каждом ответе.`,
      slovarVvod: 'Держись этих значений терминов; термин не из словаря поясни при первом упоминании.',
      slovar: s.slov.trim() || '[СЛОВАРЬ: 5–15 ТЕРМИНОВ С ОПРЕДЕЛЕНИЯМИ, ПО ОДНОМУ НА СТРОКУ]',
      pravila: [
        `Аудитория — ${auditoriya}; уровень ${aud.uroven}.`,
        'Точность: не выдумывай факты, числа и источники; каждая ссылка — с DOI, URL или ISBN, каждое число — с источником и годом.',
        'Этика: не используй и не запрашивай персональные данные студентов; работы студентов разбирай обезличенно.'
      ],
      opora: 'Отвечай по приложенным материалам; чего в них нет — так и скажи. Сведения не из материалов помечай словами «вне материалов».',
      proverka: ['Перед ответом сверь его со словарём и правилами выше и исправь расхождения.']
        .concat(s.nz ? [NE_ZNAYU] : [])
        .concat(['Если просьба требует персональных данных студентов или нарушает эти правила — откажись и предложи, как сделать иначе.'])
    };

    return { tema: tema, zadacha: zadacha, sistema: sistema };
  }

  // XML-тег: однострочное содержимое — в строку, многострочное — между тегами
  function teg(imya, podpis, soderzhimoe) {
    const tekst = Array.isArray(soderzhimoe) ? soderzhimoe.join('\n') : soderzhimoe;
    const otkryt = `<${imya} label="${podpis}">`;
    return tekst.indexOf('\n') === -1 ? `${otkryt}${tekst}</${imya}>` : `${otkryt}\n${tekst}\n</${imya}>`;
  }

  // Блок кода Markdown; если в тексте уже есть ```, забор из тильд
  function zabor(tekst) {
    const z = tekst.indexOf('```') === -1 ? '```' : '~~~~';
    return z + '\n' + tekst + '\n' + z;
  }

  function zapisatZadachu(ch, vid) {
    const L = [];
    if (vid === 'xml') {
      L.push(teg('ROLE', 'Роль', ch.rol));
      L.push(teg('GOAL', 'Задача', ch.cel));
      L.push(teg('INPUT', 'Контекст и аудитория', ch.vhod));
      L.push(teg('FORMAT', 'Формат', ch.format));
      L.push(teg('STYLE', 'Стиль', ch.stil.map((x) => '– ' + x)));
      L.push(teg('CONSTRAINTS', 'Ограничения', ch.ogr.length ? ch.ogr.map((x) => '– ' + x) : zaglavnaya(BEZ_OGRANICHENII)));
      L.push(teg('EXAMPLES', 'Примеры', ch.primery.length
        ? ch.primery.map((p) => `${p.zag}:\n<${p.teg}>\n${p.tekst}\n</${p.teg}>`)
        : zaglavnaya(BEZ_PRIMEROV)));
      L.push(teg('VERIFY', 'Проверка', [zaglavnaya(VVOD_PROVERKI)].concat(ch.proverki.map((x) => '☐ ' + x), [ITOG_PROVERKI])));
      L.push('', FINAL);
    } else if (vid === 'md') {
      const razdel = (zagolovok) => { if (L.length) L.push(''); L.push('## ' + zagolovok); };
      razdel('ROLE (Роль)'); L.push(ch.rol);
      razdel('GOAL (Задача)'); L.push(ch.cel);
      razdel('INPUT (Контекст и аудитория)'); L.push(ch.vhod.join('\n\n'));
      razdel('FORMAT (Формат)'); L.push(ch.format);
      razdel('STYLE (Стиль)'); ch.stil.forEach((x) => L.push('- ' + x));
      razdel('CONSTRAINTS (Ограничения)');
      if (ch.ogr.length) ch.ogr.forEach((x) => L.push('- ' + x)); else L.push(zaglavnaya(BEZ_OGRANICHENII));
      razdel('EXAMPLES (Примеры)');
      if (ch.primery.length) {
        ch.primery.forEach((p, i) => { if (i) L.push(''); L.push('**' + p.zag + ':**', '', zabor(p.tekst)); });
      } else {
        L.push(zaglavnaya(BEZ_PRIMEROV));
      }
      razdel('VERIFY (Проверка)');
      L.push(zaglavnaya(VVOD_PROVERKI), '');
      ch.proverki.forEach((x) => L.push('- ☐ ' + x));
      L.push('', ITOG_PROVERKI, '', '---', FINAL);
    } else {
      L.push('::: ROLE (Роль): ' + ch.rol);
      L.push('::: GOAL (Задача): ' + ch.cel);
      L.push('::: INPUT (Контекст и аудитория): ' + ch.vhod.join('\n'));
      L.push('::: FORMAT (Формат): ' + ch.format);
      L.push('::: STYLE (Стиль): ' + ch.stil.join('; ') + '.');
      if (ch.ogr.length) {
        L.push('::: CONSTRAINTS (Ограничения):');
        ch.ogr.forEach((x) => L.push('– ' + x));
      } else {
        L.push('::: CONSTRAINTS (Ограничения): ' + BEZ_OGRANICHENII);
      }
      if (ch.primery.length) {
        L.push('::: EXAMPLES (Примеры):');
        ch.primery.forEach((p) => L.push(p.zag + ':', p.tekst));
      } else {
        L.push('::: EXAMPLES (Примеры): ' + BEZ_PRIMEROV);
      }
      L.push('::: VERIFY (Проверка): ' + VVOD_PROVERKI);
      ch.proverki.forEach((x) => L.push('☐ ' + x));
      L.push(ITOG_PROVERKI, '', FINAL);
    }
    return L.join('\n');
  }

  function zapisatSistemu(ch, vid) {
    const L = [];
    if (vid === 'xml') {
      L.push(teg('ROLE', 'Роль', ch.rol));
      L.push(teg('GLOSSARY', 'Словарь дисциплины', [ch.slovarVvod, ch.slovar]));
      L.push(teg('RULES', 'Правила', ch.pravila.map((x) => '– ' + x)));
      L.push(teg('GROUNDING', 'Опора на файлы', ch.opora));
      L.push(teg('CHECK', 'Проверка и отказ', ch.proverka.map((x) => '– ' + x)));
    } else if (vid === 'md') {
      L.push('## Роль', ch.rol, '');
      L.push('## Словарь дисциплины', ch.slovarVvod, '', ch.slovar, '');
      L.push('## Правила');
      ch.pravila.forEach((x) => L.push('- ' + x));
      L.push('', '## Опора на файлы', ch.opora, '');
      L.push('## Проверка и отказ');
      ch.proverka.forEach((x) => L.push('- ' + x));
    } else {
      L.push('::: Роль: ' + ch.rol);
      L.push('::: Словарь дисциплины: ' + ch.slovarVvod, ch.slovar);
      L.push('::: Правила:');
      ch.pravila.forEach((x) => L.push('– ' + x));
      L.push('::: Опора на файлы: ' + ch.opora);
      L.push('::: Проверка и отказ:');
      ch.proverka.forEach((x) => L.push('– ' + x));
    }
    return L.join('\n');
  }

  /* Итог: задачный промпт (null, пока нет темы) и системный слой (от темы не зависит:
     он один на семестр). vid — 'kolon', 'xml' или 'md'; по умолчанию — из состояния. */
  function sobrat(syroe, vid) {
    const s = normalizovat(syroe);
    const v = izSpiska(vid, VIDY, s.vyvod);
    const ch = sobratChasti(s);
    return {
      zadachnyi: ch.tema ? zapisatZadachu(ch.zadacha, v) : null,
      sistemnyi: zapisatSistemu(ch.sistema, v)
    };
  }

  /* ── 4. Мелочи: токены, подстановки, ссылка ─────────────────────────────── */

  // Грубо: ≈ 3,3 знака на токен — замер курса для токенизатора GPT-4o (tools/zamer-tokenov.py)
  function otsenkaTokenov(tekst) {
    return Math.round(String(tekst).length / 3.3);
  }

  // Подстановки вида [ТЕМА]: в скобках заглавные буквы, строчных нет
  function podstanovki(tekst) {
    const vse = String(tekst).match(/\[[А-ЯЁA-Z][^\]\n]{0,100}\]/g) || [];
    return vse.filter((x, i) => !/[а-яёa-z]/.test(x) && vse.indexOf(x) === i);
  }

  // Состояние → JSON → UTF-8 → base64 без «+», «/» и «=» (безопасно для адреса)
  function zakodirovat(sostoyanie) {
    const bajty = new TextEncoder().encode(JSON.stringify(normalizovat(sostoyanie)));
    let dvoichnoe = '';
    for (let i = 0; i < bajty.length; i += 0x8000) {
      dvoichnoe += String.fromCharCode.apply(null, bajty.subarray(i, i + 0x8000));
    }
    return btoa(dvoichnoe).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Обратно; бросает исключение, если ссылка повреждена
  function raskodirovat(kod) {
    let b64 = String(kod).trim().replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*$/.test(b64) || b64.length % 4 === 1) throw new Error('не base64');
    while (b64.length % 4) b64 += '=';
    const dvoichnoe = atob(b64);
    const bajty = new Uint8Array(dvoichnoe.length);
    for (let i = 0; i < dvoichnoe.length; i++) bajty[i] = dvoichnoe.charCodeAt(i);
    return normalizovat(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bajty)));
  }

  const API = {
    ROLI, ZADACHI, ADAPTACII, FREIMVORKI, ZHANRY, AUDITORII, FORMATY, POLZUNKI, OBEM, OGR_KLYUCHI, VIDY,
    NE_ZNAYU, ITOG_PROVERKI,
    defoltnoe, primer, normalizovat, sobrat, otsenkaTokenov, podstanovki, zakodirovat, raskodirovat
  };
  if (typeof module === 'object' && module && module.exports) module.exports = API;
  if (typeof document === 'undefined') return;

  /* ── 5. Страница ─────────────────────────────────────────────────────────── */

  const $ = (id) => document.getElementById(id);
  const forma = $('k-forma');
  if (!forma) return;

  const SPISKI = { rol: ROLI, zad: ZADACHI, adapt: ADAPTACII, freim: FREIMVORKI, zhanr: ZHANRY, aud: AUDITORII, fmt: FORMATY };
  const TEKSTY = ['disc', 'tema', 'spec', 'krit', 'mat', 'prim', 'hod', 'slov'];
  const DVIZHKI = POLZUNKI.map((p) => p.kl).concat(['obem']);
  const SLOI = ['zad', 'sis'];
  const vyvod = { zad: $('k-zadachnyi'), sis: $('k-sistemnyi') };
  const pravka = { zad: false, sis: false };   // текст правлен вручную — автосборка его не трогает
  let tronuto = false;                         // тему уже вводили: пустое поле — ошибка, а не начало

  function chislo(n) {
    return n.toLocaleString('ru-RU');
  }

  function mn(n, formy) {
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return formy[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return formy[1];
    return formy[2];
  }

  /* Сообщения и копирование — общими механиками сайта; запасной путь нужен,
     только если sajt.js не загрузился (страница открыта с диска). */
  let taimerSoobshcheniya = 0;
  function soobshchit(tekst) {
    if (window.KursII && typeof window.KursII.soobshchenie === 'function') {
      window.KursII.soobshchenie(tekst);
      return;
    }
    let t = $('k-soobshchenie');
    if (!t) {
      t = document.createElement('div');
      t.id = 'k-soobshchenie';
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = tekst;
    t.classList.add('is-on');
    clearTimeout(taimerSoobshcheniya);
    taimerSoobshcheniya = setTimeout(() => t.classList.remove('is-on'), 2800);
  }

  function kopirovatStaroe(tekst) {
    const pole = document.createElement('textarea');
    pole.value = tekst;
    pole.setAttribute('readonly', '');
    pole.style.position = 'fixed';
    pole.style.opacity = '0';
    document.body.appendChild(pole);
    pole.select();
    let vyshlo = false;
    try { vyshlo = document.execCommand('copy'); } catch (e) { vyshlo = false; }
    document.body.removeChild(pole);
    return vyshlo;
  }

  function kopirovatTekst(tekst) {
    if (window.KursII && typeof window.KursII.kopirovat === 'function') return window.KursII.kopirovat(tekst);
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(tekst).then(() => true, () => kopirovatStaroe(tekst));
    }
    return Promise.resolve(kopirovatStaroe(tekst));
  }

  /* ── Форма ⇄ состояние ── */

  function zapolnitSpiski() {
    Object.keys(SPISKI).forEach((kl) => {
      const sel = $('k-' + kl);
      Object.keys(SPISKI[kl]).forEach((id) => {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = SPISKI[kl][id].nazvanie;
        sel.appendChild(o);
      });
    });
  }

  function prochitatFormu() {
    const r = { v: 1 };
    Object.keys(SPISKI).forEach((kl) => { r[kl] = $('k-' + kl).value; });
    TEKSTY.forEach((kl) => { r[kl] = $('k-' + kl).value; });
    DVIZHKI.forEach((kl) => { r[kl] = Number($('k-' + kl).value); });
    r.ogr = Array.from(forma.querySelectorAll('input[name="ogr"]:checked'), (i) => i.value);
    r.nz = $('k-nz').checked;
    const vid = document.querySelector('input[name="vyvod"]:checked');
    r.vyvod = vid ? vid.value : 'kolon';
    return normalizovat(r);
  }

  function zapolnitFormu(s) {
    Object.keys(SPISKI).forEach((kl) => { $('k-' + kl).value = s[kl]; });
    TEKSTY.forEach((kl) => { $('k-' + kl).value = s[kl]; });
    DVIZHKI.forEach((kl) => { $('k-' + kl).value = String(s[kl]); });
    forma.querySelectorAll('input[name="ogr"]').forEach((i) => { i.checked = s.ogr.indexOf(i.value) !== -1; });
    $('k-nz').checked = s.nz;
    document.querySelectorAll('input[name="vyvod"]').forEach((i) => { i.checked = i.value === s.vyvod; });
  }

  function obnovitPodskazki(s) {
    const rol = ROLI[s.rol];
    $('k-rol-opis').textContent = rol.chto;
    $('k-disc-opis').textContent = rol.disc === 'net'
      ? 'Для этой роли дисциплина в промпт не попадает.'
      : 'Как после слова «по»: «истории России», «органической химии». Попадает в роль обоих слоёв.';
    $('k-pole-adapt').hidden = s.zad !== 'adapt';
    $('k-pole-freim').hidden = s.zad !== 'freim';
    $('k-pole-zhanr').hidden = s.zad !== 'pismo';
    $('k-pole-krit').hidden = s.zad !== 'proverka';
    $('k-freim-opis').textContent = 'Разделы: ' + FREIMVORKI[s.freim].razdely + '.';
    $('k-aud-opis').textContent = 'Уровень ' + AUDITORII[s.aud].uroven + '.';
    $('k-fmt-opis').textContent = FORMATY[s.fmt].opis;

    POLZUNKI.forEach((p) => {
      const z = s[p.kl];
      const opis = p.urovni[uroven(z)];
      $('k-' + p.kl + '-znach').textContent = z + ' из 10';
      $('k-' + p.kl + '-opis').textContent = zaglavnaya(opis) + '.';
      $('k-' + p.kl).setAttribute('aria-valuetext', z + ' из 10: ' + opis);
    });
    const o = OBEM[s.obem];
    $('k-obem-znach').textContent = o.znakov ? chislo(o.znakov) + ' знаков' : 'без ограничений';
    $('k-obem-opis').textContent = o.znakov ? zaglavnaya(o.slovo) + '.' : 'Объём не задан — модель решит сама.';
    $('k-obem').setAttribute('aria-valuetext', o.znakov ? o.znakov + ' знаков, ' + o.slovo : 'без ограничений');

    // «Не длиннее N знаков» имеет смысл, только когда объём задан
    $('k-ogr-dlina').disabled = !o.znakov;
    $('k-ogr-dlina-stroka').classList.toggle('is-off', !o.znakov);
    $('k-ogr-dlina-tekst').textContent = o.znakov
      ? 'не длиннее ' + o.znakov + ' знаков'
      : 'не длиннее N знаков — сначала задайте объём ползунком «Объём ответа»';

    const terminov = s.slov.split('\n').filter((x) => x.trim()).length;
    $('k-slov-schet').textContent = 'Терминов: ' + terminov + (terminov >= 5 && terminov <= 15 ? '.' : ' — лучше 5–15.');
  }

  function obnovitOshibku(s) {
    const pokazat = tronuto && !s.tema.trim();
    const pole = $('k-tema');
    $('k-tema-oshibka').textContent = pokazat ? 'Впишите тему — без неё промпт не собирается.' : '';
    if (pokazat) pole.setAttribute('aria-invalid', 'true'); else pole.removeAttribute('aria-invalid');
  }

  /* ── Результат ── */

  // textContent держим равным value: общий sajt.js копирует именно textContent элемента
  function pokazatTekst(ta, tekst) {
    ta.textContent = tekst;
    ta.value = tekst;
  }

  function obnovitMetu(sloi) {
    const tekst = vyvod[sloi].value;
    const n = tekst.length;
    const tok = otsenkaTokenov(tekst);
    $('k-dlina-' + sloi).textContent = chislo(n) + ' ' + mn(n, ['знак', 'знака', 'знаков']) +
      ' · ≈ ' + chislo(tok) + ' ' + mn(tok, ['токен', 'токена', 'токенов']);

    const mesto = $('k-zamenit-' + sloi);
    const ph = podstanovki(tekst);
    mesto.textContent = '';
    if (ph.length) {
      mesto.appendChild(document.createTextNode('Осталось заменить: '));
      ph.forEach((x, i) => {
        if (i) mesto.appendChild(document.createTextNode(' '));
        const metka = document.createElement('span');
        metka.className = 'ph';
        metka.textContent = x;
        mesto.appendChild(metka);
      });
    }
    mesto.hidden = !ph.length;
    $('k-pravka-' + sloi).hidden = !pravka[sloi];

    // пустое не копируем и не открываем: кнопки выключены, причина — в подсказке поля
    const pusto = !tekst.trim();
    $('k-kop-' + sloi).disabled = pusto;
    const menu = $('k-panel-' + sloi).querySelector('[data-svc-knopka]');
    if (menu) menu.disabled = pusto;
  }

  function obnovit() {
    const s = prochitatFormu();
    obnovitPodskazki(s);
    const gotovo = sobrat(s);
    if (!pravka.zad) pokazatTekst(vyvod.zad, gotovo.zadachnyi || '');
    if (!pravka.sis) pokazatTekst(vyvod.sis, gotovo.sistemnyi);
    SLOI.forEach(obnovitMetu);
    obnovitOshibku(s);
  }

  // Заменить всю форму (пример, очистка, заготовка, ссылка); ручную правку не затираем
  function primenit(s, tekstSoobshcheniya) {
    zapolnitFormu(s);
    tronuto = false;
    obnovit();
    const zamok = pravka.zad || pravka.sis;
    soobshchit(tekstSoobshcheniya + (zamok ? ' Текст промпта правлен вручную — чтобы собрать его по форме, нажмите «Собрать заново».' : ''));
  }

  function estVvod() {
    const s = prochitatFormu();
    return TEKSTY.some((kl) => s[kl].trim() !== '');
  }

  // Пример и очистка: спрашиваем, только если есть что терять
  function zamenitFormu(syroe, vopros, tekstSoobshcheniya) {
    const tekushchee = prochitatFormu();
    const novoe = normalizovat(Object.assign({}, syroe, { vyvod: tekushchee.vyvod }));   // вид записи — выбор читателя
    const toZhe = JSON.stringify(novoe) === JSON.stringify(tekushchee);
    if (!toZhe && estVvod() && !window.confirm(vopros)) return;
    primenit(novoe, tekstSoobshcheniya);
  }

  /* ── Вкладки: стрелки влево-вправо, Home и End ── */

  const taby = [$('k-tab-zad'), $('k-tab-sis')];

  function vybratTab(tab, fokus) {
    taby.forEach((t) => {
      const da = t === tab;
      t.setAttribute('aria-selected', da ? 'true' : 'false');
      t.tabIndex = da ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !da;
    });
    if (fokus) tab.focus();
  }

  taby.forEach((t, i) => {
    t.addEventListener('click', () => vybratTab(t, false));
    t.addEventListener('keydown', (e) => {
      let j = -1;
      if (e.key === 'ArrowRight') j = (i + 1) % taby.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + taby.length) % taby.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = taby.length - 1;
      if (j === -1) return;
      e.preventDefault();
      vybratTab(taby[j], true);
    });
  });

  /* ── Заготовки в localStorage: каждое обращение — в try/catch ── */

  const KLYUCH_ZAGOTOVOK = 'kurs-ii:konstruktor:zagotovki';
  const MAKS_ZAGOTOVOK = 50;
  const NE_SOHRANILOS = 'Не сохранилось: браузер не даёт хранить данные (например, в приватном окне). Сохраните настройки ссылкой — «Поделиться ссылкой».';

  // [] — заготовок нет; null — хранилище недоступно
  function prochitatZagotovki() {
    let syroe;
    try { syroe = window.localStorage.getItem(KLYUCH_ZAGOTOVOK); } catch (e) { return null; }
    if (!syroe) return [];
    try {
      const spisok = JSON.parse(syroe);
      return Array.isArray(spisok)
        ? spisok.filter((z) => z && typeof z.imya === 'string' && z.imya && z.sostoyanie && typeof z.sostoyanie === 'object')
        : [];
    } catch (e) {
      return [];
    }
  }

  function zapisatZagotovki(spisok) {
    try {
      window.localStorage.setItem(KLYUCH_ZAGOTOVOK, JSON.stringify(spisok));
      return true;
    } catch (e) {
      return false;
    }
  }

  function obnovitSpisokZagotovok(vybrat) {
    const sel = $('k-zag-spisok');
    const spisok = prochitatZagotovki();
    const est = Array.isArray(spisok) && spisok.length > 0;
    sel.textContent = '';
    if (!est) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = spisok === null ? 'браузер не даёт хранить заготовки' : 'заготовок пока нет';
      sel.appendChild(o);
    } else {
      spisok.slice().sort((a, b) => a.imya.localeCompare(b.imya, 'ru')).forEach((z) => {
        const o = document.createElement('option');
        o.value = z.imya;
        o.textContent = z.imya;
        if (z.imya === vybrat) o.selected = true;
        sel.appendChild(o);
      });
    }
    sel.disabled = !est;
    $('k-zag-zagruzit').disabled = !est;
    $('k-zag-udalit').disabled = !est;
    if (spisok === null) {
      $('k-zag-opis').textContent = 'Этот браузер не даёт хранить заготовки (например, в приватном окне). Настройки можно сохранить ссылкой — «Поделиться ссылкой».';
    }
  }

  function avtoImya(s) {
    const tema = bezKavychek(s.tema.trim());
    const zadacha = ZADACHI[s.zad].nazvanie;
    return tema ? zadacha + ' — ' + tema : zadacha;
  }

  $('k-zag-sohranit').addEventListener('click', () => {
    const s = prochitatFormu();
    const pole = $('k-zag-imya');
    const imya = (pole.value.trim() || avtoImya(s)).slice(0, 80);
    const spisok = prochitatZagotovki();
    if (spisok === null) { soobshchit(NE_SOHRANILOS); return; }
    const i = spisok.findIndex((z) => z.imya === imya);
    if (i === -1 && spisok.length >= MAKS_ZAGOTOVOK) {
      soobshchit('Заготовок уже ' + MAKS_ZAGOTOVOK + ' — удалите ненужные, чтобы сохранить новую.');
      return;
    }
    const zapis = { imya: imya, sostoyanie: s };
    if (i === -1) spisok.push(zapis); else spisok[i] = zapis;
    if (!zapisatZagotovki(spisok)) { soobshchit(NE_SOHRANILOS); return; }
    pole.value = '';
    obnovitSpisokZagotovok(imya);
    soobshchit((i === -1 ? 'Заготовка сохранена: «' : 'Заготовка обновлена: «') + imya + '».');
  });

  $('k-zag-zagruzit').addEventListener('click', () => {
    const imya = $('k-zag-spisok').value;
    const z = (prochitatZagotovki() || []).find((x) => x.imya === imya);
    if (!z) {
      obnovitSpisokZagotovok();
      soobshchit('Заготовка не найдена — возможно, её удалили в другой вкладке.');
      return;
    }
    primenit(normalizovat(z.sostoyanie), 'Заготовка загружена: «' + imya + '».');
  });

  $('k-zag-udalit').addEventListener('click', () => {
    const imya = $('k-zag-spisok').value;
    if (!imya || !window.confirm('Удалить заготовку «' + imya + '»?')) return;
    const spisok = prochitatZagotovki();
    if (spisok === null || !zapisatZagotovki(spisok.filter((z) => z.imya !== imya))) {
      soobshchit('Не удалось удалить: браузер не даёт записывать данные.');
      return;
    }
    obnovitSpisokZagotovok();
    soobshchit('Заготовка удалена: «' + imya + '».');
  });

  // заготовку сохранили или удалили в другой вкладке — список обновится и здесь
  window.addEventListener('storage', (e) => {
    if (e.key === KLYUCH_ZAGOTOVOK || e.key === null) obnovitSpisokZagotovok($('k-zag-spisok').value);
  });

  /* ── «Поделиться»: состояние — в адресе после «#s=» ── */

  $('k-podelitsya').addEventListener('click', () => {
    let kod;
    try { kod = zakodirovat(prochitatFormu()); } catch (e) { soobshchit('Не удалось собрать ссылку.'); return; }
    const ssylka = window.location.href.split('#')[0] + '#s=' + kod;
    kopirovatTekst(ssylka).then((vyshlo) => {
      if (vyshlo) {
        soobshchit(ssylka.length > 8000
          ? 'Ссылка скопирована, но она длинная (' + chislo(ssylka.length) + ' знаков) — мессенджер может её обрезать. Сократите материалы и примеры.'
          : 'Ссылка скопирована: по ней форма откроется заполненной так же.');
        return;
      }
      try { window.history.replaceState(null, '', '#s=' + kod); } catch (e) { /* адрес не поменять — останется сообщение */ }
      soobshchit('Скопировать не вышло — ссылка теперь в адресной строке, скопируйте её оттуда.');
    });
  });

  // «#s=…» — наши настройки; прочие якоря (#main, #k-rezultat) не трогаем
  function izAdresa() {
    const h = window.location.hash;
    if (h.indexOf('#s=') !== 0) return false;
    let s;
    try {
      s = raskodirovat(h.slice(3));
    } catch (e) {
      soobshchit('Ссылка на настройки повреждена — из неё ничего не загружено.');
      return false;
    }
    primenit(s, 'Настройки из ссылки загружены.');
    return true;
  }

  /* ── События ── */

  forma.addEventListener('submit', (e) => e.preventDefault());
  forma.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'k-tema') tronuto = true;
    obnovit();
  });
  forma.addEventListener('change', obnovit);
  document.querySelectorAll('input[name="vyvod"]').forEach((r) => r.addEventListener('change', obnovit));

  SLOI.forEach((sloi) => {
    const ta = vyvod[sloi];
    ta.addEventListener('input', () => {
      pravka[sloi] = true;
      ta.textContent = ta.value;
      obnovitMetu(sloi);
    });
    // запасной путь копирования, если общий sajt.js не загрузился
    $('k-kop-' + sloi).addEventListener('click', () => {
      if (window.KursII) return;
      kopirovatTekst(ta.value.replace(/\s+$/, '')).then((vyshlo) => {
        soobshchit(vyshlo ? 'Скопировано. Вставьте во вкладке нейросети: ⌘V или Ctrl+V.' : 'Скопировать не вышло — выделите текст и нажмите ⌘C или Ctrl+C.');
      });
    });
  });

  document.querySelectorAll('[data-sobrat]').forEach((knopka) => {
    knopka.addEventListener('click', () => {
      const sloi = knopka.getAttribute('data-sobrat');
      pravka[sloi] = false;
      obnovit();
      if (sloi === 'zad' && !prochitatFormu().tema.trim()) {
        tronuto = true;
        obnovitOshibku(prochitatFormu());
        $('k-tema').focus();
        soobshchit('Впишите тему — без неё задачный промпт не собирается.');
        return;
      }
      vyvod[sloi].focus();   // кнопка спряталась вместе с пометкой — фокус не теряем
      soobshchit('Промпт собран заново по форме.');
    });
  });

  $('k-primer-knopka').addEventListener('click', () => {
    zamenitFormu(primer(), 'Заменить введённое примером?', 'Форма заполнена примером.');
  });

  $('k-ochistit').addEventListener('click', () => {
    zamenitFormu(defoltnoe(), 'Очистить форму? Введённое пропадёт.', 'Форма очищена.');
  });

  window.addEventListener('hashchange', izAdresa);

  // без общего sajt.js меню сервисов не заполнится — не показываем пустую кнопку
  if (!window.KursII || !window.SERVISY) {
    document.querySelectorAll('.k-result [data-svc]').forEach((el) => { el.hidden = true; });
  }

  /* ── Старт ── */

  zapolnitSpiski();
  zapolnitFormu(defoltnoe());
  obnovitSpisokZagotovok();
  if (!izAdresa()) obnovit();
})();
