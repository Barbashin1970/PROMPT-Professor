/**
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
const VSEGO_BALLOV = 72;
const PROHODNOJ_BALL = 44;   // 60 % — как 6 из 10 в программе курса
const POLE_FIO = 'Фамилия, имя, отчество';
const POLE_MESTO = 'Место работы, кафедра или поток';
const ZAGOLOVKI_POPYTOK = ['Когда', 'ФИО', 'Электронная почта', 'Место работы, кафедра или поток', 'Баллы из ' + VSEGO_BALLOV, 'Итог', 'Номер ответа'];
const ZAGOLOVKI_VEDOMOSTI = ['ФИО', 'Электронная почта', 'Место работы, кафедра или поток', 'Лучший балл из ' + VSEGO_BALLOV, 'Попыток', 'Последняя попытка', 'Итог (сдано — от ' + PROHODNOJ_BALL + ')'];

const MODULI = [
  {
    "id": 1,
    "nazvanie": "Как устроен ИИ",
    "lekciya": 1,
    "razdel": "/lekciya-1/#kak-ustroen",
    "voprosy": [
      {
        "tip": "vybor",
        "tekst": "Что делает языковая модель, когда пишет ответ?",
        "varianty": [
          "Находит готовый ответ в своей базе знаний",
          "Проверяет каждое утверждение по интернету",
          "Выбирает наиболее вероятное продолжение текста, кусочек за кусочком",
          "Копирует подходящий фрагмент из учебника"
        ],
        "vernyj": 2,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Почему, по статье исследователей OpenAI «Why Language Models Hallucinate» (2025), моделям выгодно угадывать, а не отвечать «не знаю»?",
        "varianty": [
          "Большинство тестов ставит «не знаю» наравне с ошибкой, и угадывание в среднем даёт больше баллов",
          "Модели специально учат скрывать незнание",
          "Ответ «не знаю» запрещён правилами сервисов",
          "Модели технически не умеют отвечать «не знаю»"
        ],
        "vernyj": 0,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Русский текст делится на большее число токенов, чем английский. Что из этого следует на практике?",
        "varianty": [
          "Модели хуже понимают русский язык",
          "Промпты нужно писать только по-английски",
          "Ничего не следует",
          "В контекстное окно помещается меньше русского текста"
        ],
        "vernyj": 3,
        "bally": 2
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте этапы обучения языковой модели с их описанием:",
        "pravye": [
          "Модель читает огромные массивы текстов и учится предсказывать продолжение",
          "Люди сравнивают ответы модели, лучшие поощряются",
          "Разработчики показывают модели образцы хороших ответов на задания"
        ],
        "pary": [
          {
            "levoe": "Предобучение",
            "vernyj": 0
          },
          {
            "levoe": "Дообучение на примерах",
            "vernyj": 2
          },
          {
            "levoe": "Обучение на оценках людей (RLHF)",
            "vernyj": 1
          }
        ]
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте понятия с их определениями:",
        "pravye": [
          "Модель разбивает задачу на шаги и проверяет их",
          "Всё, что модель видит в разговоре; не поместившееся она не учитывает",
          "Модель сначала находит нужное в документах или в интернете, потом отвечает"
        ],
        "pary": [
          {
            "levoe": "Контекстное окно",
            "vernyj": 1
          },
          {
            "levoe": "RAG — поиск с дополнением",
            "vernyj": 2
          },
          {
            "levoe": "Режим рассуждений",
            "vernyj": 0
          }
        ]
      }
    ]
  },
  {
    "id": 2,
    "nazvanie": "Формула промпта и инструменты",
    "lekciya": 1,
    "razdel": "/lekciya-1/#formula",
    "voprosy": [
      {
        "tip": "vybor",
        "tekst": "Какой элемент формулы промпта отвечает на вопрос «что модель сверяет перед выдачей ответа»?",
        "varianty": [
          "ROLE — роль",
          "FORMAT — формат",
          "EXAMPLES — примеры",
          "VERIFY — проверка"
        ],
        "vernyj": 3,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Что относится к системному слою промпта?",
        "varianty": [
          "Тема сегодняшнего теста",
          "Словарь дисциплины и правила, которые действуют весь семестр",
          "Объём одного конкретного ответа",
          "Образец одного вопроса для этого теста"
        ],
        "vernyj": 1,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Как собрать постоянного помощника, если проектов нет в вашем тарифе?",
        "varianty": [
          "Вставить системный слой первым сообщением в новом чате и приложить файлы",
          "Никак — без подписки это невозможно",
          "Включить режим рассуждений",
          "Написать в поддержку сервиса"
        ],
        "vernyj": 0,
        "bally": 2
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте элементы формулы промпта с примерами:",
        "pravye": [
          "«Без двусмысленных вопросов, с ключом ответов»",
          "Один образцовый вопрос с вариантами и верным ответом",
          "«Ты — методист по истории»"
        ],
        "pary": [
          {
            "levoe": "ROLE — роль",
            "vernyj": 2
          },
          {
            "levoe": "CONSTRAINTS — ограничения",
            "vernyj": 0
          },
          {
            "levoe": "EXAMPLES — примеры",
            "vernyj": 1
          }
        ]
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте инструменты с тем, для чего они в курсе:",
        "pravye": [
          "Сравнить ответы двух моделей вслепую",
          "Ответы со ссылками на источники",
          "Модель на своём компьютере, без интернета"
        ],
        "pary": [
          {
            "levoe": "Perplexity",
            "vernyj": 1
          },
          {
            "levoe": "LM Studio",
            "vernyj": 2
          },
          {
            "levoe": "Arena (бывшая LMArena)",
            "vernyj": 0
          }
        ]
      }
    ]
  },
  {
    "id": 3,
    "nazvanie": "Техники промптинга",
    "lekciya": 2,
    "razdel": "/lekciya-2/#tehniki",
    "voprosy": [
      {
        "tip": "vybor",
        "tekst": "Какое ограничение можно проверить галочкой?",
        "varianty": [
          "«Пиши хорошо»",
          "«Будь креативным»",
          "«Каждое число — с источником и годом»",
          "«Сделай интересно»"
        ],
        "vernyj": 2,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Что такое обратный промптинг?",
        "varianty": [
          "Показать модели готовый образец и попросить восстановить промпт, который мог бы его породить",
          "Задать модели вопрос задом наперёд",
          "Попросить модель задавать вопросы вместо ответов",
          "Перевести промпт на английский и обратно"
        ],
        "vernyj": 0,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Зачем в диалоге с моделью просить: «Представь, что ты критик этого решения»?",
        "varianty": [
          "Чтобы ответ стал длиннее",
          "Чтобы сменить стиль на ироничный",
          "Чтобы модель перестала рассуждать",
          "Чтобы найти слабые места и контрпримеры в решении"
        ],
        "vernyj": 3,
        "bally": 2
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте фреймворки с их осями:",
        "pravye": [
          "Политика, экономика, общество, технологии, право, экология",
          "Факты, возможности, риски, примеры, решения, тренды",
          "Остановить, заинтересовать, побудить к действию, привести к записи"
        ],
        "pary": [
          {
            "levoe": "FOREST",
            "vernyj": 1
          },
          {
            "levoe": "PESTLE",
            "vernyj": 0
          },
          {
            "levoe": "SLAP",
            "vernyj": 2
          }
        ]
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте академические роли с тем, что они делают:",
        "pravye": [
          "Руководит научной работой студентов",
          "Ведёт семинары и практики, создаёт кейсы",
          "Проектирует программы и дисциплины"
        ],
        "pary": [
          {
            "levoe": "Методист-архитектор",
            "vernyj": 2
          },
          {
            "levoe": "Куратор НИР",
            "vernyj": 0
          },
          {
            "levoe": "Практик-фасилитатор",
            "vernyj": 1
          }
        ]
      }
    ]
  },
  {
    "id": 4,
    "nazvanie": "Адаптация материалов",
    "lekciya": 2,
    "razdel": "/lekciya-2/#adaptaciya",
    "voprosy": [
      {
        "tip": "vybor",
        "tekst": "Чем горизонтальная адаптация отличается от упрощения?",
        "varianty": [
          "Ничем — это синонимы",
          "Уровень сложности тот же, меняются контекст и примеры под другую специальность",
          "Текст сокращается вдвое",
          "Добавляются доказательства и открытые вопросы"
        ],
        "vernyj": 1,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Каково главное правило упрощения учебного материала?",
        "varianty": [
          "Убрать все термины",
          "Заменить текст картинками",
          "Упрощать язык, а не понятия",
          "Сократить материал до одного абзаца"
        ],
        "vernyj": 2,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "В ответе модели стоит ссылка на работу, которая действительно существует. Что ещё нужно проверить?",
        "varianty": [
          "Говорит ли работа то, что ей приписано",
          "Ничего — раз работа существует, ссылка верна",
          "Сколько раз работу цитировали",
          "На каком языке она написана"
        ],
        "vernyj": 0,
        "bally": 2
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте направления адаптации с их описанием:",
        "pravye": [
          "Для другой специальности: те же понятия, другие примеры",
          "Для начальных курсов: короткие предложения, термины с определениями",
          "Для магистрантов: доказательства, открытые вопросы, исследовательские задачи"
        ],
        "pary": [
          {
            "levoe": "Упрощение",
            "vernyj": 1
          },
          {
            "levoe": "Углубление",
            "vernyj": 2
          },
          {
            "levoe": "Горизонтальная адаптация",
            "vernyj": 0
          }
        ]
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте типичную ошибку адаптации с примером:",
        "pravye": [
          "Физика в курсе математики для экономистов — без объяснения связи",
          "«Электроны вращаются вокруг ядра, как планеты» — без оговорки о границах метафоры",
          "Тензорная запись для тех, кто не изучал линейную алгебру"
        ],
        "pary": [
          {
            "levoe": "Упрощение ломает научность",
            "vernyj": 1
          },
          {
            "levoe": "Углубление без базы",
            "vernyj": 2
          },
          {
            "levoe": "Чужие примеры",
            "vernyj": 0
          }
        ]
      }
    ]
  },
  {
    "id": 5,
    "nazvanie": "Агенты и проверка работ",
    "lekciya": 3,
    "razdel": "/lekciya-3/#agenty",
    "voprosy": [
      {
        "tip": "vybor",
        "tekst": "Что такое ИИ-агент в терминах курса?",
        "varianty": [
          "Робот с камерой",
          "Платная версия чата",
          "Программа для поиска списывания",
          "Модель с постоянной ролью и материалами: системный слой плюс ваши файлы"
        ],
        "vernyj": 3,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Какой вывод о детекторах ИИ-текста следует из исследований, разобранных в курсе?",
        "varianty": [
          "Детектор надёжно доказывает, что текст написал ИИ",
          "Результат детектора — не доказательство: детекторы заметно ошибаются, в том числе на текстах неносителей языка",
          "Детекторы ошибаются только на английском языке",
          "Детекторы безошибочны на текстах длиннее страницы"
        ],
        "vernyj": 1,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Какой текстовый признак участия ИИ самый сильный?",
        "varianty": [
          "Слово «является» в тексте",
          "Источник, который не находится: выдуманную ссылку не замаскировать правкой стиля",
          "Грамотный текст без ошибок",
          "Длинные сложные предложения"
        ],
        "vernyj": 1,
        "bally": 2
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте способы проверки без детектора с тем, что они показывают:",
        "pravye": [
          "Владеет ли студент своим текстом",
          "Резкий скачок уровня, пропавшие привычные ошибки",
          "Выдуманные ссылки и чужие числа"
        ],
        "pary": [
          {
            "levoe": "Сравнить с прежними работами студента",
            "vernyj": 1
          },
          {
            "levoe": "Проверить факты и источники",
            "vernyj": 2
          },
          {
            "levoe": "Поговорить с автором",
            "vernyj": 0
          }
        ]
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте признаки в студенческой работе с силой сигнала:",
        "pravye": [
          "Сильный сигнал",
          "Средний сигнал",
          "Слабый сигнал"
        ],
        "pary": [
          {
            "levoe": "Первая строка: «Конечно! Вот ваш текст»",
            "vernyj": 0
          },
          {
            "levoe": "Скопление «важно отметить», «играет ключевую роль»",
            "vernyj": 1
          },
          {
            "levoe": "Жирный шрифт через слово",
            "vernyj": 2
          }
        ]
      }
    ]
  },
  {
    "id": 6,
    "nazvanie": "Этика, навыки и карта смыслов",
    "lekciya": 3,
    "razdel": "/lekciya-3/#etika",
    "voprosy": [
      {
        "tip": "vybor",
        "tekst": "Что главное в правилах использования ИИ для студентов?",
        "varianty": [
          "Полный запрет ИИ во всех заданиях",
          "Проверка каждой работы детектором",
          "Студент указывает, пользовался ли он ИИ и как",
          "ИИ разрешён всегда и везде"
        ],
        "vernyj": 2,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Почему устная защита делает задание устойчивым к злоупотреблению ИИ?",
        "varianty": [
          "Чтобы защитить работу, нужно владеть темой — кто бы ни помогал с текстом",
          "ИИ не умеет говорить",
          "Устные ответы нельзя записать",
          "Устная защита короче письменной работы"
        ],
        "vernyj": 0,
        "bally": 2
      },
      {
        "tip": "vybor",
        "tekst": "Как пользоваться навыком без платной подписки?",
        "varianty": [
          "Никак — навыки работают только в платных тарифах",
          "Переписать навык на английском",
          "Отправить навык в поддержку сервиса",
          "Приложить SKILL.md и справочные файлы к новому чату и попросить следовать инструкции"
        ],
        "vernyj": 3,
        "bally": 2
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте уровень обучения с разумной свободой использования ИИ:",
        "pravye": [
          "Под контролем, с рефлексией: как использовал ИИ, что проверил, что изменил",
          "Свободно, с упором на критический разбор ответов ИИ",
          "Минимально: учимся писать и рассуждать сами"
        ],
        "pary": [
          {
            "levoe": "1–2 курс",
            "vernyj": 2
          },
          {
            "levoe": "3–4 курс",
            "vernyj": 0
          },
          {
            "levoe": "Магистратура",
            "vernyj": 1
          }
        ]
      },
      {
        "tip": "para",
        "tekst": "Сопоставьте уровни карты смыслов с вопросами, на которые они отвечают:",
        "pravye": [
          "С чем приходят студенты, где ошибаются, какие понятия даются трудно",
          "Почему это важно сейчас: что меняется в профессии и что в дисциплине изменил ИИ",
          "Что студент сможет сделать после курса — действием, которое можно проверить"
        ],
        "pary": [
          {
            "levoe": "Рациональный",
            "vernyj": 2
          },
          {
            "levoe": "Студенческий",
            "vernyj": 0
          },
          {
            "levoe": "Контекстный",
            "vernyj": 1
          }
        ]
      }
    ]
  }
];

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
