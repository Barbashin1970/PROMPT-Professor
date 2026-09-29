// Module scores storage (in-memory)
const moduleScores = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0
};

// User info storage (in-memory, replaces localStorage)
const userInfo = {
  name: '',
  lastName: '',
  email: ''
};

// Module data
const modulesData = [
  {
    id: 1,
    title: "Основы промпт-инжиниринга",
    fullTitle: "Модуль 1. Основы промпт-инжиниринга для строителей",
    maxScore: 12,
    questions: [
      {
        id: 1,
        type: "multiple_choice",
        points: 2,
        text: "Что такое промпт-инжиниринг?",
        options: [
          { letter: "A", text: "Процесс программирования искусственного интеллекта на языке Python" },
          { letter: "B", text: "Искусство создания точных запросов для взаимодействия с ИИ" },
          { letter: "C", text: "Система проверки качества строительных конструкций" },
          { letter: "D", text: "Метод расчёта смет и графиков строительства" }
        ],
        correctAnswer: "B"
      },
      {
        id: 2,
        type: "multiple_choice",
        points: 2,
        text: "Нейросеть ошибается потому, что:",
        options: [
          { letter: "A", text: "Она обучена неправильно и требует переустановки" },
          { letter: "B", text: "Выбирает наиболее вероятное продолжение текста на основе вероятностей" },
          { letter: "C", text: "Её специально обучают говорить неправду" },
          { letter: "D", text: "Она не может работать с текстом на русском языке" }
        ],
        correctAnswer: "B"
      },
      {
        id: 3,
        type: "multiple_choice",
        points: 2,
        text: "Какие из указанных направлений применения ИИ в строительстве НЕ упоминаются в модуле?",
        options: [
          { letter: "A", text: "Автоматизация документооборота и отчётности" },
          { letter: "B", text: "Работа с персоналом и обучение сотрудников" },
          { letter: "C", text: "Производство строительных материалов на заводах" },
          { letter: "D", text: "Контроль качества документации" }
        ],
        correctAnswer: "C"
      },
      {
        id: 4,
        type: "matching",
        points: 3,
        text: "Сопоставьте этапы обучения нейросети с их описанием:",
        items: [
          { number: "1", text: "Pre-train (предобучение)", correct: "А" },
          { number: "2", text: "Fine-tuning (дообучение)", correct: "В" },
          { number: "3", text: "RLHF (обучение с подкреплением от человека)", correct: "Б" }
        ],
        rightOptions: [
          { letter: "А", text: "Модель читает массивы текстов из интернета и учится предсказывать следующее слово" },
          { letter: "Б", text: "Люди оценивают ответы модели и ставят 'награды' за хорошие ответы и 'штрафы' за плохие" },
          { letter: "В", text: "Разработчики пишут специальные тексты и задачи, чтобы модель лучше решала практические задачи" }
        ]
      },
      {
        id: 5,
        type: "matching",
        points: 3,
        text: "Сопоставьте понятия с их определениями:",
        items: [
          { number: "1", text: "Контекстное окно", correct: "Б" },
          { number: "2", text: "RAG (Retrieval-Augmented Generation)", correct: "В" },
          { number: "3", text: "Reasoning (рассуждения)", correct: "А" }
        ],
        rightOptions: [
          { letter: "А", text: "Метод, позволяющий модели пошагово рассуждать и проверять логику ответа, используя цепочку мыслей" },
          { letter: "Б", text: "Размер истории диалога и дополнительных данных, которые модель может помнить и учитывать при ответе" },
          { letter: "В", text: "Метод поиска и извлечения актуальной информации из внешних источников для обогащения ответа" }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Структура эффективного промпта",
    fullTitle: "Модуль 2. Структура эффективного промпта",
    maxScore: 12,
    questions: [
      {
        id: 6,
        type: "multiple_choice",
        points: 2,
        text: "Для чего нужна роль в структуре промпта?",
        options: [
          { letter: "A", text: "Для указания формата документа" },
          { letter: "B", text: "Для настройки на профессиональный язык и уровень детализации" },
          { letter: "C", text: "Для ограничения количества символов" },
          { letter: "D", text: "Для проверки грамматики" }
        ],
        correctAnswer: "B"
      },
      {
        id: 7,
        type: "multiple_choice",
        points: 2,
        text: "Какая из формулировок задачи является хорошей?",
        options: [
          { letter: "A", text: "Составь отчёт" },
          { letter: "B", text: "Составь отчёт по отклонению расхода материалов" },
          { letter: "C", text: "Напиши что-нибудь про проект" },
          { letter: "D", text: "Сделай анализ" }
        ],
        correctAnswer: "B"
      },
      {
        id: 8,
        type: "multiple_choice",
        points: 2,
        text: "Какой компонент промпта описывает пошаговый процесс?",
        options: [
          { letter: "A", text: "Роль" },
          { letter: "B", text: "Данные" },
          { letter: "C", text: "Инструкция" },
          { letter: "D", text: "Стиль ответа" }
        ],
        correctAnswer: "C"
      },
      {
        id: 9,
        type: "matching",
        points: 3,
        text: "Сопоставьте компоненты с их назначением:",
        items: [
          { number: "1", text: "Формат результата", correct: "Б" },
          { number: "2", text: "Данные", correct: "А" },
          { number: "3", text: "Стиль ответа", correct: "В" }
        ],
        rightOptions: [
          { letter: "А", text: "Входная информация, на основе которой нейросеть будет выполнять задачу" },
          { letter: "Б", text: "Определяет, в каком виде нейросеть должна представить результат" },
          { letter: "В", text: "Задаёт тональность и уровень детализации ответа" }
        ]
      },
      {
        id: 10,
        type: "matching",
        points: 3,
        text: "Сопоставьте форматы с типами задач:",
        items: [
          { number: "1", text: "Таблица", correct: "В" },
          { number: "2", text: "Деловое письмо", correct: "А" },
          { number: "3", text: "Структурированный документ", correct: "Б" }
        ],
        rightOptions: [
          { letter: "А", text: "Переписка с заказчиком, запрос продления сроков" },
          { letter: "Б", text: "Регламенты, инструкции, сводные отчёты по объекту" },
          { letter: "В", text: "Сметы, акты выполненных работ, ведомости материалов" }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Контекст и последовательные промпты",
    fullTitle: "Модуль 3. Контекст и последовательные промпты",
    maxScore: 12,
    questions: [
      {
        id: 11,
        type: "multiple_choice",
        points: 2,
        text: "Что такое контекст в работе с нейросетью?",
        options: [
          { letter: "A", text: "Техническая ошибка в коде программы" },
          { letter: "B", text: "\"Память\" нейросети, которая сохраняет все предыдущие вопросы и ответы в одном диалоге" },
          { letter: "C", text: "Размер оперативной памяти компьютера" },
          { letter: "D", text: "Перечень нормативных документов, которые знает нейросеть" }
        ],
        correctAnswer: "B"
      },
      {
        id: 12,
        type: "multiple_choice",
        points: 2,
        text: "Размер контекстного окна --- это:",
        options: [
          { letter: "A", text: "Высота экрана при работе с нейросетью" },
          { letter: "B", text: "Количество документов, которые можно загрузить в диалог" },
          { letter: "C", text: "Объём информации, который модель может одновременно запомнить и учитывать при ответе" },
          { letter: "D", text: "Время ответа нейросети на один запрос" }
        ],
        correctAnswer: "C"
      },
      {
        id: 13,
        type: "multiple_choice",
        points: 2,
        text: "В каком из указанных случаев ЛУЧШЕ всего использовать последовательные промпты?",
        options: [
          { letter: "A", text: "Для быстрого ответа на простой вопрос" },
          { letter: "B", text: "Для создания сложного документа (ТЗ, регламент) пошагово или для многоэтапной аналитики" },
          { letter: "C", text: "Для проверки орфографии текста" },
          { letter: "D", text: "Для перевода текста на другой язык" }
        ],
        correctAnswer: "B"
      },
      {
        id: 14,
        type: "matching",
        points: 3,
        text: "Сопоставьте шаги создания документа методом последовательных промптов с их назначением:",
        items: [
          { number: "1", text: "Задание роли и контекста", correct: "А" },
          { number: "2", text: "Предоставление исходных данных", correct: "Б" },
          { number: "3", text: "Наполнение раздела и смена ролей", correct: "В" }
        ],
        rightOptions: [
          { letter: "А", text: "Определение цели, аудитории и формата документа" },
          { letter: "Б", text: "Передача нейросети всей необходимой информации для работы" },
          { letter: "В", text: "Пошаговое создание разделов с переключением между ролями эксперта и критика" }
        ]
      },
      {
        id: 15,
        type: "matching",
        points: 3,
        text: "Сопоставьте преимущества последовательных промптов с примерами их применения:",
        items: [
          { number: "1", text: "Контроль качества на каждом этапе", correct: "А" },
          { number: "2", text: "Гибкость и адаптивность процесса", correct: "Б" },
          { number: "3", text: "Обучение модели вашему стилю", correct: "В" }
        ],
        rightOptions: [
          { letter: "А", text: "Проверка и корректировка каждого раздела документа перед переходом к следующему" },
          { letter: "Б", text: "Возможность изменить направление работы на основе промежуточных результатов" },
          { letter: "В", text: "Постепенное улучшение понимания моделью ваших требований и предпочтений" }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "Выбор инструментов и проверка результатов",
    fullTitle: "Модуль 4. Выбор инструментов и проверка результатов",
    maxScore: 12,
    questions: [
      {
        id: 16,
        type: "multiple_choice",
        points: 2,
        text: "Какой из этих форматов ЛУЧШЕ всего использовать для сметы или табличного расчёта, создаваемого с помощью ИИ?",
        options: [
          { letter: "A", text: "Таблица Markdown (с разделителями | )" },
          { letter: "B", text: "Текстовый абзац с перечислением через запятую" },
          { letter: "C", text: "JSON-массив объектов" },
          { letter: "D", text: "HTML-код с тегами <table>" }
        ],
        correctAnswer: "A"
      },
      {
        id: 17,
        type: "multiple_choice",
        points: 2,
        text: "Метод Chain-of-Thought (CoT) --- это:",
        options: [
          { letter: "A", text: "Способ одновременного запроса нескольких нейросетей для сравнения ответов" },
          { letter: "B", text: "Просьба к модели пошагово описать ход своих рассуждений перед финальным ответом" },
          { letter: "C", text: "Автоматическая проверка текста на плагиат и ошибки" },
          { letter: "D", text: "Загрузка большого контекста (документов) в один промпт" }
        ],
        correctAnswer: "B"
      },
      {
        id: 18,
        type: "multiple_choice",
        points: 2,
        text: "Для какого типа задачи в строительстве ЛУЧШЕ всего использовать Perplexity (поиск + генерация)?",
        options: [
          { letter: "A", text: "Переписать внутренний регламент компании в более формальном стиле" },
          { letter: "B", text: "Найти актуальные изменения в СНиПах и подготовить краткую справку" },
          { letter: "C", text: "Составить смету на основе уже имеющихся данных по проекту" },
          { letter: "D", text: "Перевести техническую документацию с английского на русский" }
        ],
        correctAnswer: "B"
      },
      {
        id: 19,
        type: "matching",
        points: 3,
        text: "Сопоставьте типы строительных задач с рекомендуемыми инструментами ИИ:",
        items: [
          { number: "1", text: "Поиск информации о новых стандартах и нормативах", correct: "А" },
          { number: "2", text: "Создание текстовых отчётов, писем, инструкций", correct: "Б" },
          { number: "3", text: "Обработка конфиденциальных данных (сметы с ценами, контракты)", correct: "В" }
        ],
        rightOptions: [
          { letter: "А", text: "Perplexity (поиск + генерация)" },
          { letter: "Б", text: "ChatGPT / Claude (универсальные чат-боты)" },
          { letter: "В", text: "Локальные модели (LM Studio, Ollama)" }
        ]
      },
      {
        id: 20,
        type: "matching",
        points: 3,
        text: "Сопоставьте методы проверки результатов ИИ с их назначением:",
        items: [
          { number: "1", text: "Перекрёстная проверка", correct: "В" },
          { number: "2", text: "Chain-of-Thought (CoT)", correct: "А" },
          { number: "3", text: "Экспертная оценка", correct: "Б" }
        ],
        rightOptions: [
          { letter: "А", text: "Просим модель объяснить логику своих рассуждений пошагово" },
          { letter: "Б", text: "Специалист проверяет результат на соответствие нормам и здравому смыслу" },
          { letter: "В", text: "Сравниваем ответы нескольких моделей или источников" }
        ]
      }
    ]
  },
  {
    id: 5,
    title: "Локальные модели для конфиденциальных данных",
    fullTitle: "Модуль 5. Локальные модели для конфиденциальных данных",
    maxScore: 12,
    questions: [
      {
        id: 21,
        type: "multiple_choice",
        points: 2,
        text: "Главное преимущество локальных моделей по сравнению с облачными ИИ-сервисами:",
        options: [
          { letter: "A", text: "Локальные модели всегда дают более точные и развёрнутые ответы" },
          { letter: "B", text: "Данные не покидают ваш компьютер, что критично для конфиденциальной информации" },
          { letter: "C", text: "Локальные модели работают быстрее любых облачных сервисов" },
          { letter: "D", text: "Они бесплатны и не требуют установки дополнительного ПО" }
        ],
        correctAnswer: "B"
      },
      {
        id: 22,
        type: "multiple_choice",
        points: 2,
        text: "Для какого типа документов в строительстве НЕОБХОДИМО использовать локальные модели?",
        options: [
          { letter: "A", text: "Публичные инструкции по технике безопасности, доступные всем сотрудникам" },
          { letter: "B", text: "Сметы с коммерческими ценами, условия контрактов, внутренние финансовые отчёты" },
          { letter: "C", text: "Общие вопросы о строительных нормативах (СНиП, ГОСТ)" },
          { letter: "D", text: "Переписка с поставщиками по типовым вопросам" }
        ],
        correctAnswer: "B"
      },
      {
        id: 23,
        type: "multiple_choice",
        points: 2,
        text: "Что такое формат GGUF в контексте локальных моделей?",
        options: [
          { letter: "A", text: "Оптимизированный формат файлов для быстрой загрузки и работы моделей на обычных компьютерах" },
          { letter: "B", text: "Специальный язык программирования для обучения нейросетей" },
          { letter: "C", text: "Тип графического процессора (GPU), необходимый для запуска ИИ" },
          { letter: "D", text: "Облачный сервис для хранения и обработки данных" }
        ],
        correctAnswer: "A"
      },
      {
        id: 24,
        type: "matching",
        points: 3,
        text: "Сопоставьте параметры настройки локальной модели с их функциями:",
        items: [
          { number: "1", text: "Temperature (температура)", correct: "Б" },
          { number: "2", text: "Context Length (длина контекста)", correct: "В" },
          { number: "3", text: "System Prompt", correct: "А" }
        ],
        rightOptions: [
          { letter: "А", text: "Постоянная инструкция, задающая роль и стиль работы модели" },
          { letter: "Б", text: "Управляет креативностью и предсказуемостью ответов модели" },
          { letter: "В", text: "Определяет, сколько текста (токенов) модель может удержать в памяти" }
        ]
      },
      {
        id: 25,
        type: "matching",
        points: 3,
        text: "Сопоставьте размер модели с её характеристиками:",
        items: [
          { number: "1", text: "Модели 7B (например, Llama 3.2)", correct: "Б" },
          { number: "2", text: "Модели 13B и выше", correct: "А" },
          { number: "3", text: "Модели онлайн, например GigaChat", correct: "В" }
        ],
        rightOptions: [
          { letter: "А", text: "Более качественные ответы, лучше понимают сложные задачи, но требуют мощного ПК (от 16 ГБ RAM)" },
          { letter: "Б", text: "Быстрые и лёгкие, подходят для большинства текстовых задач на обычных компьютерах (от 8 ГБ RAM)" },
          { letter: "В", text: "Максимальная скорость обработки, данные уходят на внешний сервер (не подходят для конфиденциальных задач)" }
        ]
      }
    ]
  },
  {
    id: 6,
    title: "Вайб-кодинг для автоматизации",
    fullTitle: "Модуль 6. Вайб-кодинг для автоматизации в строительстве",
    maxScore: 12,
    questions: [
      {
        id: 26,
        type: "multiple_choice",
        points: 2,
        text: "Что такое вайб-кодинг?",
        options: [
          { letter: "A", text: "Профессиональная разработка сложных корпоративных систем с использованием фреймворков" },
          { letter: "B", text: "Создание простых программ и скриптов с помощью ИИ путём описания задачи на естественном языке" },
          { letter: "C", text: "Специальный язык программирования для строительных расчётов" },
          { letter: "D", text: "Метод автоматического тестирования программного обеспечения" }
        ],
        correctAnswer: "B"
      },
      {
        id: 27,
        type: "multiple_choice",
        points: 2,
        text: "Для каких задач в строительстве вайб-кодинг является ЛУЧШИМ решением?",
        options: [
          { letter: "A", text: "Разработка полноценной ERP-системы для управления всеми процессами компании" },
          { letter: "B", text: "Быстрая автоматизация повторяющихся задач: парсинг таблиц, переименование файлов, простые калькуляторы" },
          { letter: "C", text: "Создание сложных алгоритмов расчёта несущих конструкций" },
          { letter: "D", text: "Написание операционной системы для строительных объектов" }
        ],
        correctAnswer: "B"
      },
      {
        id: 28,
        type: "multiple_choice",
        points: 2,
        text: "Когда вайб-кодинг НЕ ПОДХОДИТ для решения задачи?",
        options: [
          { letter: "A", text: "Нужно быстро создать скрипт для переименования 1000 файлов по шаблону" },
          { letter: "B", text: "Требуется простой калькулятор для расчёта объёма материалов" },
          { letter: "C", text: "Необходима высоконадёжная система с гарантией безопасности данных и долгосрочной поддержкой" },
          { letter: "D", text: "Нужно извлечь данные из PDF-отчёта и сохранить в Excel" }
        ],
        correctAnswer: "C"
      },
      {
        id: 29,
        type: "matching",
        points: 3,
        text: "Сопоставьте типы промптов для вайб-кодинга с их назначением:",
        items: [
          { number: "1", text: "Описание задачи и контекста", correct: "В" },
          { number: "2", text: "Уточнение формата входных и выходных данных", correct: "А" },
          { number: "3", text: "Запрос на исправление ошибок", correct: "Б" }
        ],
        rightOptions: [
          { letter: "А", text: "\"Входные данные — таблица Excel с колонками A, B, C. Результат — JSON-файл.\"" },
          { letter: "Б", text: "\"Скрипт выдаёт ошибку: [текст ошибки]. Как исправить?\"" },
          { letter: "В", text: "\"Напиши Python-скрипт, который извлекает из PDF все таблицы и сохраняет их в CSV\"" }
        ]
      },
      {
        id: 30,
        type: "matching",
        points: 3,
        text: "Сопоставьте этапы жизненного цикла программы с рекомендациями по вайб-кодингу:",
        items: [
          { number: "1", text: "Создание первой версии скрипта", correct: "В" },
          { number: "2", text: "Тестирование и отладка", correct: "А" },
          { number: "3", text: "Долгосрочное использование и поддержка", correct: "Б" }
        ],
        rightOptions: [
          { letter: "А", text: "Запускаем на тестовых данных, копируем ошибки в промпт для исправления" },
          { letter: "Б", text: "Если скрипт стал критичным для бизнеса, стоит передать его программисту для доработки" },
          { letter: "В", text: "Чётко описываем задачу, формат данных и желаемый результат в одном промпте" }
        ]
      }
    ]
  }
];

// Current test state
let currentModule = null;
let currentQuestionIndex = 0;
let userAnswers = {};

// Initialize app
function initApp() {
  loadScores();
  loadUserInfo();
  showDashboard();
  setupNavigationListeners();
  updateTotalScore();
  showPersistenceWarning();
}

// Setup navigation event listeners
function setupNavigationListeners() {
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');

  if (prevButton) {
    const newPrevButton = prevButton.cloneNode(true);
    prevButton.parentNode.replaceChild(newPrevButton, prevButton);
    newPrevButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      navigateToPrevious();
    });
  }

  if (nextButton) {
    const newNextButton = nextButton.cloneNode(true);
    nextButton.parentNode.replaceChild(newNextButton, nextButton);
    newNextButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      try { navigateToNext(); } catch (error) { console.error('ERROR in navigateToNext():', error); }
    }, false);
    newNextButton.disabled = false;
    newNextButton.style.pointerEvents = 'auto';
    newNextButton.style.opacity = '1';
    newNextButton.style.cursor = 'pointer';
  }
}

// Show dashboard
function showDashboard() {
  const dashboardView = document.getElementById('dashboardView');
  const testView = document.getElementById('testView');
  const modulesGrid = document.getElementById('modulesGrid');

  if (dashboardView) { dashboardView.classList.remove('hidden'); dashboardView.style.display = 'block'; }
  if (testView) { testView.classList.add('hidden'); }
  if (modulesGrid) { modulesGrid.classList.remove('hidden'); modulesGrid.style.display = 'grid'; }

  renderModulesGrid();
  updateTotalScore();
  loadUserInfo();
}

// Render modules grid
function renderModulesGrid() {
  const grid = document.getElementById('modulesGrid');
  if (grid) {
    grid.classList.remove('hidden');
    grid.style.display = 'grid';
  } else {
    console.error('❌ Modules grid element not found!');
    return;
  }

  let html = '';
  modulesData.forEach((module) => {
    const score = moduleScores[module.id];
    const percentage = Math.round((score / module.maxScore) * 100);
    html += `
      <div class="module-card">
        <div class="module-header">
          <div class="module-number">Модуль ${module.id}</div>
          <h3 class="module-title">${module.title}</h3>
        </div>
        <div class="score-display">
          <div class="score-text">${score}/${module.maxScore}</div>
          <div class="score-label">баллов</div>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${percentage}%"></div>
        </div>
        <button class="btn btn-primary" onclick="startModule('${module.id}')">
          📝 Пройти тест
        </button>
      </div>
    `;
  });
  grid.innerHTML = html;
}

// Start module test
function startModule(moduleId) {
  const normalizedId = (typeof moduleId === 'string') ? parseInt(moduleId) : moduleId;
  currentModule = modulesData.find(m => m.id === normalizedId);
  currentQuestionIndex = 0;
  userAnswers = {};

  document.getElementById('dashboardView').classList.add('hidden');
  document.getElementById('testView').classList.remove('hidden');

  const navigationDiv = document.getElementById('navigation');
  if (navigationDiv) { navigationDiv.classList.remove('hidden'); navigationDiv.style.display = 'flex'; }

  document.getElementById('testModuleTitle').textContent = currentModule.fullTitle;

  setupNavigationListeners();
  renderQuestion();
  updateProgress();
  updateNavigation();
}

// Render current question
function renderQuestion() {
  const question = currentModule.questions[currentQuestionIndex];
  const container = document.getElementById('questionContainer');
  if (question.type === 'multiple_choice') {
    container.innerHTML = renderMultipleChoice(question);
  } else if (question.type === 'matching') {
    container.innerHTML = renderMatching(question);
  }
}

// Render multiple choice question
function renderMultipleChoice(question) {
  const selectedAnswer = userAnswers[question.id];
  let html = `
    <div class="question-card">
      <div class="question-number">Вопрос ${currentQuestionIndex + 1} из ${currentModule.questions.length}</div>
      <h2 class="question-text">${question.text}</h2>
      <div class="options-container">
  `;
  question.options.forEach(option => {
    const isSelected = selectedAnswer === option.letter;
    html += `
      <button class="option-button ${isSelected ? 'selected' : ''}"
              onclick="selectAnswer(${question.id}, '${option.letter}')">
        <span class="option-letter">${option.letter}.</span>
        <span class="option-text">${option.text}</span>
      </button>
    `;
  });
  html += `</div></div>`;
  return html;
}

// Render matching question
function renderMatching(question) {
  let html = `
    <div class="question-card">
      <div class="question-number">Вопрос ${currentQuestionIndex + 1} из ${currentModule.questions.length}</div>
      <h2 class="question-text">${question.text}</h2>
      <div class="matching-container">
        <div class="matching-column">
          <div class="column-title">Утверждения</div>
  `;
  question.items.forEach(item => {
    const selectedMatch = userAnswers[question.id] ? userAnswers[question.id][item.number] : '';
    html += `
      <div class="matching-item">
        <div class="matching-item-number">${item.number}.</div>
        <div>${item.text}</div>
        <select class="matching-select" onchange="selectMatch(${question.id}, '${item.number}', this.value)">
          <option value="">Выберите соответствие...</option>
    `;
    question.rightOptions.forEach(opt => {
      const isSelected = selectedMatch === opt.letter;
      html += `<option value="${opt.letter}" ${isSelected ? 'selected' : ''}>${opt.letter}. ${opt.text}</option>`;
    });
    html += `</select></div>`;
  });
  html += `</div></div></div>`;
  return html;
}

// Select answer for multiple choice
function selectAnswer(questionId, answer) {
  userAnswers[questionId] = answer;
  renderQuestion();
}

// Select match for matching question
function selectMatch(questionId, itemNumber, selectedLetter) {
  if (!userAnswers[questionId]) { userAnswers[questionId] = {}; }
  userAnswers[questionId][itemNumber] = selectedLetter;
}

// Navigation
function navigateToPrevious() {
  if (currentQuestionIndex === 0) { returnToDashboard(); return; }
  currentQuestionIndex--;
  renderQuestion();
  updateProgress();
  updateNavigation();
}

function navigateToNext() {
  const isLastQuestion = (currentQuestionIndex === currentModule.questions.length - 1);
  if (isLastQuestion) {
    const validationResult = validateAllAnswers();
    if (!validationResult.isValid) { showValidationError(validationResult.unansweredQuestions); return; }
    const score = calculateScore();
    moduleScores[currentModule.id] = score;
    showResults();
    return;
  }
  currentQuestionIndex++;
  renderQuestion();
  updateProgress();
  updateNavigation();
}

// Update navigation buttons
function updateNavigation() {
  const prevButton = document.getElementById('prevButton');
  const nextButton = document.getElementById('nextButton');

  if (prevButton) { prevButton.disabled = false; prevButton.textContent = '← Назад'; }

  if (nextButton) {
    const isLastQuestion = (currentQuestionIndex === currentModule.questions.length - 1);
    nextButton.textContent = isLastQuestion ? 'Завершить' : 'Далее →';
    nextButton.disabled = false;
    nextButton.style.pointerEvents = 'auto';
    nextButton.style.opacity = '1';
    nextButton.style.cursor = 'pointer';
    nextButton.classList.remove('disabled');
    nextButton.setAttribute('tabindex', '0');
  }
}

// Update progress
function updateProgress() {
  const counter = document.getElementById('questionCounter');
  const progressBar = document.getElementById('progressBar');
  counter.textContent = `Вопрос ${currentQuestionIndex + 1} из ${currentModule.questions.length}`;
  const progress = ((currentQuestionIndex + 1) / currentModule.questions.length) * 100;
  progressBar.style.width = `${progress}%`;
}

// Validate that all questions have been answered
function validateAllAnswers() {
  const unansweredQuestions = [];
  currentModule.questions.forEach((question, index) => {
    if (question.type === 'multiple_choice') {
      const answer = userAnswers[question.id];
      if (!answer || !['A', 'B', 'C', 'D'].includes(answer)) {
        unansweredQuestions.push({ number: index + 1, id: question.id, type: 'multiple_choice', text: question.text });
      }
    } else if (question.type === 'matching') {
      const matches = userAnswers[question.id] || {};
      let allItemsAnswered = true;
      question.items.forEach(item => {
        if (!matches[item.number] || matches[item.number] === '') allItemsAnswered = false;
      });
      if (!allItemsAnswered) {
        unansweredQuestions.push({ number: index + 1, id: question.id, type: 'matching', text: question.text });
      }
    }
  });
  return { isValid: unansweredQuestions.length === 0, unansweredQuestions };
}

// Show validation error dialog
function showValidationError(unansweredQuestions) {
  const modal = document.createElement('div');
  modal.id = 'validationModal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: var(--space-24);
  `;
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: var(--space-32);
    max-width: 500px; width: 100%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    border: 2px solid var(--color-warning);
  `;
  let questionsList = '<ul style="margin: var(--space-16) 0; padding-left: var(--space-24); color: var(--color-text-secondary);">';
  unansweredQuestions.forEach(q => {
    questionsList += `<li style="margin-bottom: var(--space-8);">Вопрос ${q.number}: ${q.text.substring(0, 60)}${q.text.length > 60 ? '...' : ''}</li>`;
  });
  questionsList += '</ul>';
  modalContent.innerHTML = `
    <div style="text-align: center; margin-bottom: var(--space-24);">
      <div style="font-size: 48px; margin-bottom: var(--space-16);">⚠️</div>
      <h2 style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text); margin-bottom: var(--space-16);">Проверьте все вопросы</h2>
      <p style="font-size: var(--font-size-base); color: var(--color-text); line-height: var(--line-height-normal); margin-bottom: var(--space-16);">
        Вы ответили не на все вопросы модуля. Пожалуйста, выберите вариант ответа на каждый вопрос перед отправкой.
      </p>
      ${questionsList}
      <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); font-style: italic;">
        Используйте кнопку "Назад" для возврата к неотвеченным вопросам.
      </p>
    </div>
    <button id="closeValidationModal" class="btn btn-primary" style="width: 100%; font-size: var(--font-size-lg); padding: var(--space-16);">Понятно</button>
  `;
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  document.getElementById('closeValidationModal').addEventListener('click', function() { document.body.removeChild(modal); });
  modal.addEventListener('click', function(e) { if (e.target === modal) document.body.removeChild(modal); });
}

// Calculate score
function calculateScore() {
  let totalScore = 0;
  currentModule.questions.forEach((question) => {
    if (question.type === 'multiple_choice') {
      if (userAnswers[question.id] === question.correctAnswer) totalScore += 2;
    } else if (question.type === 'matching') {
      const userMatches = userAnswers[question.id] || {};
      question.items.forEach(item => {
        if (userMatches[item.number] === item.correct) totalScore += 1;
      });
    }
  });
  return totalScore;
}

// Show results — only score summary and buttons, no answer review block
function showResults() {
  const score = calculateScore();
  const percentage = Math.round((score / currentModule.maxScore) * 100);

  moduleScores[currentModule.id] = score;
  saveScores();

  let resultEmoji, resultMessage, resultColor;
  if (percentage === 100) {
    resultEmoji = '🎉';
    resultMessage = 'Отличный результат!';
    resultColor = 'var(--color-success)';
  } else if (percentage >= 70) {
    resultEmoji = '👍';
    resultMessage = 'Хороший результат!';
    resultColor = 'var(--color-primary)';
  } else {
    resultEmoji = '📚';
    resultMessage = 'Рекомендуем повторить материал';
    resultColor = 'var(--color-warning)';
  }

  const html = `
    <div class="question-card" style="max-width: 100%; text-align: center;">
      <h2 class="question-text" style="text-align: center; margin-bottom: var(--space-32); color: var(--color-primary);">
        Результаты тестирования
      </h2>

      <div style="font-size: 64px; margin-bottom: var(--space-16);">${resultEmoji}</div>

      <div style="background-color: var(--color-bg-1); padding: var(--space-32); border-radius: var(--radius-md); margin-bottom: var(--space-24); text-align: center;">
        <div style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-text); margin-bottom: var(--space-12);">
          ${score} из ${currentModule.maxScore} баллов
        </div>
        <div style="font-size: var(--font-size-xl); color: var(--color-text-secondary); margin-bottom: var(--space-16);">
          ${percentage}% правильных ответов
        </div>
        <div style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: ${resultColor};">
          ${resultMessage}
        </div>
      </div>

      <div style="margin-top: var(--space-32); display: flex; gap: var(--space-16); justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-secondary" onclick="returnToDashboard()" style="flex: 1; max-width: 300px; min-width: 200px;">Вернуться на главную</button>
        <button class="btn btn-primary" onclick="retakeTest()" style="flex: 1; max-width: 300px; min-width: 200px;">Пройти тест заново</button>
      </div>
    </div>
  `;

  document.getElementById('questionContainer').innerHTML = html;

  const navigationDiv = document.getElementById('navigation');
  if (navigationDiv) { navigationDiv.classList.add('hidden'); }
}

// Get question score (kept for potential future use)
function getQuestionScore(question) {
  if (question.type === 'multiple_choice') {
    const userAnswer = userAnswers[question.id];
    if (!userAnswer) return 0;
    return userAnswer === question.correctAnswer ? 2 : 0;
  } else if (question.type === 'matching') {
    const userMatches = userAnswers[question.id] || {};
    let score = 0;
    question.items.forEach(item => { if (userMatches[item.number] === item.correct) score += 1; });
    return score;
  }
  return 0;
}

// Return to dashboard
function returnToDashboard() { showDashboard(); }

// Retake test
function retakeTest() {
  currentQuestionIndex = 0;
  userAnswers = {};
  const navigationDiv = document.getElementById('navigation');
  if (navigationDiv) { navigationDiv.classList.remove('hidden'); navigationDiv.style.display = 'flex'; }
  renderQuestion();
  updateProgress();
  updateNavigation();
}

// Save user info
function saveUserInfo() {
  userInfo.name = document.getElementById('userName').value || '';
  userInfo.lastName = document.getElementById('userLastName').value || '';
  userInfo.email = document.getElementById('userEmail').value || '';
  try { window.localStorage.setItem('userInfo', JSON.stringify(userInfo)); }
  catch (e) { sessionData.userInfo = JSON.parse(JSON.stringify(userInfo)); }
}

// Load user info
function loadUserInfo() {
  try {
    const saved = window.localStorage.getItem('userInfo');
    if (saved) Object.assign(userInfo, JSON.parse(saved));
  } catch (e) {
    if (sessionData.userInfo) Object.assign(userInfo, sessionData.userInfo);
  }
  const nameField = document.getElementById('userName');
  const lastNameField = document.getElementById('userLastName');
  const emailField = document.getElementById('userEmail');
  if (nameField) nameField.value = userInfo.name;
  if (lastNameField) lastNameField.value = userInfo.lastName;
  if (emailField) emailField.value = userInfo.email;
}

// Calculate and update total score display
function updateTotalScore() {
  const totalScore = moduleScores[1] + moduleScores[2] + moduleScores[3] +
                     moduleScores[4] + moduleScores[5] + moduleScores[6];
  const maxScore = 72;
  const percentage = Math.round((totalScore / maxScore) * 100);
  const scoreNumberEl = document.getElementById('totalScoreNumber');
  const scorePercentageEl = document.getElementById('totalScorePercentage');
  const progressBarEl = document.getElementById('totalProgressBar');
  if (scoreNumberEl) scoreNumberEl.textContent = `${totalScore}/72`;
  if (scorePercentageEl) scorePercentageEl.textContent = `${percentage}%`;
  if (progressBarEl) progressBarEl.style.width = `${percentage}%`;
}

// Automated testing function
function runAutomatedTest() {
  for (let i = 1; i <= 6; i++) moduleScores[i] = 0;
  testModuleSequence(1);
}

function testModuleSequence(moduleId) {
  if (moduleId > 6) {
    const totalScore = moduleScores[1] + moduleScores[2] + moduleScores[3] + moduleScores[4] + moduleScores[5] + moduleScores[6];
    showDashboard();
    showTestResultsModal(totalScore);
    return;
  }
  const module = modulesData.find(m => m.id === moduleId);
  currentModule = module;
  currentQuestionIndex = 0;
  userAnswers = {};
  module.questions.forEach(question => {
    if (question.type === 'multiple_choice') {
      userAnswers[question.id] = question.correctAnswer;
    } else if (question.type === 'matching') {
      userAnswers[question.id] = {};
      question.items.forEach(item => { userAnswers[question.id][item.number] = item.correct; });
    }
  });
  moduleScores[module.id] = calculateScore();
  setTimeout(() => testModuleSequence(moduleId + 1), 100);
}

function showTestResultsModal(totalScore) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000; padding: var(--space-24);
  `;
  const isPerfectScore = totalScore === 72;
  const percentage = Math.round((totalScore / 72) * 100);
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: var(--space-32);
    max-width: 600px; width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 3px solid ${isPerfectScore ? 'var(--color-success)' : 'var(--color-warning)'};
  `;
  let detailsHtml = '<div style="margin: var(--space-24) 0; padding: var(--space-20); background-color: var(--color-bg-1); border-radius: var(--radius-md);">';
  for (let i = 1; i <= 6; i++) {
    const score = moduleScores[i];
    const statusIcon = score === 12 ? '✓' : '⚠️';
    const statusColor = score === 12 ? 'var(--color-success)' : 'var(--color-warning)';
    detailsHtml += `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-12); padding: var(--space-8); background-color: var(--color-surface); border-radius: var(--radius-sm);">
        <span style="font-weight: var(--font-weight-medium); color: var(--color-text);">Модуль ${i}</span>
        <span style="font-weight: var(--font-weight-bold); color: ${statusColor};">${statusIcon} ${score}/12 баллов</span>
      </div>
    `;
  }
  detailsHtml += '</div>';
  modalContent.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 64px; margin-bottom: var(--space-16);">${isPerfectScore ? '🎉' : '📊'}</div>
      <h2 style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-text); margin-bottom: var(--space-16);">
        ${isPerfectScore ? 'Тестирование завершено успешно!' : 'Тестирование завершено'}
      </h2>
      <div style="background: linear-gradient(135deg, var(--color-primary), var(--color-teal-700)); color: white; padding: var(--space-24); border-radius: var(--radius-lg); margin-bottom: var(--space-20);">
        <div style="font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); margin-bottom: var(--space-8);">${totalScore} / 72</div>
        <div style="font-size: var(--font-size-xl);">${percentage}% правильных ответов</div>
      </div>
      ${detailsHtml}
      <button id="closeTestModal" class="btn btn-primary" style="width: 100%; font-size: var(--font-size-lg); padding: var(--space-16);">Закрыть и вернуться на главную</button>
    </div>
  `;
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  document.getElementById('closeTestModal').addEventListener('click', function() { document.body.removeChild(modal); });
  modal.addEventListener('click', function(e) { if (e.target === modal) document.body.removeChild(modal); });
}

// Session storage fallback
const sessionData = { moduleScores: null, userInfo: null };

// Save scores
function saveScores() {
  try { window.localStorage.setItem('moduleScores', JSON.stringify(moduleScores)); }
  catch (e) { sessionData.moduleScores = JSON.parse(JSON.stringify(moduleScores)); }
}

// Load scores
function loadScores() {
  try {
    const saved = window.localStorage.getItem('moduleScores');
    if (saved) Object.assign(moduleScores, JSON.parse(saved));
  } catch (e) {
    if (sessionData.moduleScores) Object.assign(moduleScores, sessionData.moduleScores);
  }
}

// Show clear confirmation dialog
function showClearConfirmation() {
  const modal = document.createElement('div');
  modal.id = 'clearConfirmModal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: var(--space-24);
  `;
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: var(--space-32);
    max-width: 500px; width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 3px solid var(--color-error);
  `;
  modalContent.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 64px; margin-bottom: var(--space-16);">⚠️</div>
      <h2 style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-text); margin-bottom: var(--space-16);">Вы уверены?</h2>
      <p style="font-size: var(--font-size-lg); color: var(--color-text); line-height: 1.6; margin-bottom: var(--space-24);">
        Это действие удалит <strong>все баллы и результаты тестов</strong> по всем модулям, а также информацию о пользователе.
      </p>
      <p style="font-size: var(--font-size-base); color: var(--color-text-secondary); margin-bottom: var(--space-32); font-style: italic;">Отменить это действие будет невозможно.</p>
      <div style="display: flex; gap: var(--space-16); justify-content: center;">
        <button id="confirmClearNo" class="btn btn-secondary" style="flex: 1; max-width: 200px; padding: var(--space-16); font-size: var(--font-size-lg);">Нет</button>
        <button id="confirmClearYes" class="btn" style="flex: 1; max-width: 200px; padding: var(--space-16); font-size: var(--font-size-lg); background-color: var(--color-error); color: white; font-weight: var(--font-weight-bold);">Да, очистить</button>
      </div>
    </div>
  `;
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  document.getElementById('confirmClearNo').addEventListener('click', function() { document.body.removeChild(modal); });
  document.getElementById('confirmClearYes').addEventListener('click', function() { clearAllResults(); document.body.removeChild(modal); });
  modal.addEventListener('click', function(e) { if (e.target === modal) document.body.removeChild(modal); });
}

// Clear all results
function clearAllResults() {
  for (let i = 1; i <= 6; i++) moduleScores[i] = 0;
  userInfo.name = ''; userInfo.lastName = ''; userInfo.email = '';
  try { window.localStorage.removeItem('moduleScores'); window.localStorage.removeItem('userInfo'); } catch (e) {}
  sessionData.moduleScores = null;
  sessionData.userInfo = null;
  const nameField = document.getElementById('userName');
  const lastNameField = document.getElementById('userLastName');
  const emailField = document.getElementById('userEmail');
  if (nameField) nameField.value = '';
  if (lastNameField) lastNameField.value = '';
  if (emailField) emailField.value = '';
  showDashboard();
  showClearSuccessNotification();
}

// Show success notification after clearing
function showClearSuccessNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: var(--space-24); right: var(--space-24);
    background-color: var(--color-success); color: white;
    padding: var(--space-16) var(--space-24);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font-size: var(--font-size-base); font-weight: var(--font-weight-medium);
    z-index: 2000;
  `;
  notification.innerHTML = '✓ Все результаты успешно очищены';
  document.body.appendChild(notification);
  setTimeout(() => {
    setTimeout(() => { if (notification.parentNode) document.body.removeChild(notification); }, 300);
  }, 3000);
}

// Show persistence warning
function showPersistenceWarning() {
  let isLocalStorageAvailable = false;
  try {
    window.localStorage.setItem('test', 'test');
    window.localStorage.removeItem('test');
    isLocalStorageAvailable = true;
  } catch (e) { isLocalStorageAvailable = false; }

  if (!isLocalStorageAvailable) {
    const warningBanner = document.createElement('div');
    warningBanner.style.cssText = `
      background-color: rgba(var(--color-warning-rgb), 0.15);
      border: 2px solid var(--color-warning);
      border-radius: var(--radius-md);
      padding: var(--space-16); margin-bottom: var(--space-24); text-align: center;
    `;
    warningBanner.innerHTML = `
      <div style="font-size: var(--font-size-base); color: var(--color-text); line-height: 1.5;">
        <strong style="color: var(--color-warning);">⚠️ Внимание:</strong>
        Результаты тестов сохраняются только в рамках текущей сессии.
        При обновлении страницы данные будут сброшены из-за ограничений безопасности.
      </div>
    `;
    const dashboardView = document.getElementById('dashboardView');
    const header = dashboardView.querySelector('.header');
    if (header) header.insertAdjacentElement('afterend', warningBanner);
  }
}

// Initialize on load
initApp();
