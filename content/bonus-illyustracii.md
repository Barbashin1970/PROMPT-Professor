---
title: Бонусный урок 2. Нейроиллюстрации — картинка к лекции словами
description: Как бесплатно нарисовать иллюстрацию к слайду в Алисе AI или GigaChat, сделать своё изображение по найденному образцу и не нарушить условия сервисов.
nomer: бонус 2
slug: bonus-illyustracii
servisy: risovanie
slajdy:
video:
---

Картинку к слайду не обязательно искать в интернете и гадать, можно ли её брать. Её можно
нарисовать словами — бесплатно, в Алисе AI или GigaChat, — а найденную картинку взять
как образец и получить своё решение.

> **Благодарность** Дамиру Халилову: рисовать картинки нейросетями автор курса учился
> по его бесплатным урокам. Сайт Дамира — [damir-khalilov.com](https://damir-khalilov.com/).

## Что вы унесёте с урока

- где рисовать бесплатно и что можно делать с картинками по условиям сервисов;
- формулу промпта картинки из 11 блоков;
- как сделать своё изображение по найденному образцу и довести его до нужного;
- коллекцию из 11 стилей с готовыми промптами и навык-иллюстратор.

## 1. Где рисовать бесплатно {#gde-risovat}

`[проверено 29.09.2026]`

| | Алиса AI | GigaChat |
|---|---|---|
| Как попросить | «Нарисуй…» или кнопка «Нарисовать картинку» | «Нарисуй…» |
| Бесплатно | да; в часы нагрузки первыми рисуют подписчики «Алисы Плюс» | да |
| Формат | соотношение сторон можно указать в запросе | указывайте словами, например «горизонтальный формат 16:9» |
| Картинка-образец | как образец для рисунка — нельзя, но загруженную картинку Алиса опишет | загруженную картинку опишет; рисовать после этого — в новом диалоге |
| Правка своего фото | режим редактирования: JPEG или PNG до 20 МБ, изменения описываются словами; сверх лимита — платно | — |
| Сколько хранятся | 14 дней | — |

Источники: справка Алисы AI о [генерации](https://alice.yandex.ru/support/ru/assistant/chat/picture)
и [редактировании](https://alice.yandex.ru/support/ru/assistant/chat/edit-photos), справка GigaChat
о [генерации](https://giga.chat/help/articles/how-to-generate-images) и
[загрузке изображений](https://giga.chat/help/articles/gigachat-load-picture).

Ещё два бесплатных сервиса работают из России. **Шедеврум** Яндекса — сайт
[shedevrum.ai](https://shedevrum.ai) и приложения: вход по Яндекс ID, на сайте до 70 картинок
в день, в приложении без ограничений; без подписки Про — только для личных целей
([Яндекс](https://b2b.yandex.ru/adv/edu/materials/kak-polzovatsya-shedevrumom-instrukciya)).
**Qwen Chat** — [chat.qwen.ai](https://chat.qwen.ai), режим Image Generation: вход по почте,
бесплатно с ограничениями, по данным
[РБК Трендов](https://trends.rbc.ru/trends/innovation/69270dde9a7947adb7695fdc) работает
без VPN. Кнопка «Открыть в…» у промптов этого урока предлагает все четыре сервиса.
Midjourney в курсе нет: бесплатного доступа на сайте у него нет
([справка Midjourney](https://docs.midjourney.com/hc/en-us/articles/27870399340173-Free-Trials)).

Автор курса рисовал примеры этого урока в Алисе AI — получается красиво; GigaChat по тем же
промптам рисует тоже неплохо. Промпты можно писать по-русски, а английские промпты
из коллекции ниже — вставлять как есть.

## 2. Формула промпта картинки {#formula}

У текстового промпта восемь элементов (лекция 1), у картинки — 11 блоков. Заполнять все
не нужно: для слайда обычно хватает первых семи.

| Блок | Что написать | Пример |
|---|---|---|
| 1. Объект | кто или что главное, сколько, какое | «пожилой учёный с седой бородой», «три колбы» |
| 2. Действие, поза | что делает, как расположен | «склонился над микроскопом» |
| 3. Окружение | где, когда, какая погода | «лаборатория XIX века, вечер» |
| 4. Свет | откуда, какой, тёплый или холодный | «мягкий свет из окна слева», «золотой час» |
| 5. Цвет | главные цвета, насыщенность | «приглушённые сине-зелёные тона» |
| 6. Стиль, техника | фото, акварель, масло, 3D, бумажная аппликация | «акварель с мягкими переходами» |
| 7. Композиция и формат | план, ракурс, место под текст, соотношение сторон | «общий план, свободное место слева, 16:9» |
| 8. Камера | для «фото»: объектив, глубина резкости | «85 мм, размытый фон» |
| 9. Настроение | какое чувство вызывает | «спокойное, вдохновляющее» |
| 10. Качество | уровень детализации | «высокая детализация» |
| 11. Что исключить | чего не должно быть | «без текста и надписей» |

Формула одной строкой: `[стиль] — [объект], [действие], [окружение], [свет], [цвет],
[композиция и формат], [камера], [настроение], [качество]. Без: [что исключить].`

**Шесть правил:**

- **Конкретно:** «три колбы с зелёной жидкостью», а не «колбы».
- **Главное — в начале:** стиль и объект ставьте первыми.
- **Что нужно, а не чего не нужно:** «яркий солнечный день», а не «не тёмный»; исключения —
  отдельным блоком «без».
- **Числа и формат:** сколько объектов, какое соотношение сторон.
- **Короче — свободнее, длиннее — точнее:** 30–50 слов для пробы, 80–150 — для точного
  результата.
- **Без противоречий:** «фотореализм» и «масляная живопись» в одном промпте спорят друг
  с другом.

## 3. Картинка к слайду {#k-slajdu}

| Задача | Что указать в промпте |
|---|---|
| Обложка лекции | тема образом, свободное место под заголовок, 16:9 |
| Метафора понятия | образ вместо схемы: «энтропия — рассыпающаяся башня из кубиков» |
| Историческая сцена | эпоха, место, одежда; на слайде — подпись «реконструкция нейросетью, не источник» |
| Фон для слайда | мягкий, без мелких деталей, большое свободное поле под текст |
| Иконки разделов | один стиль на все иконки — например, неоновые контуры (стиль 10) |

- **Без надписей.** Буквы нейросеть может исказить — текст добавьте в редакторе презентаций,
  а в промпт допишите «без текста и надписей».
- **Одна презентация — один стиль.** Блоки стиля, света и цвета держите одинаковыми, меняйте
  объект (промпт «Серия в одном стиле»).
- **Проверьте содержание.** Нейросеть рисует правдоподобно, а не точно: руки, приборы,
  детали эпохи и анатомию сверяйте так же, как факты в тексте (лекция 1).

## 4. Своё изображение по образцу {#po-obrazcu}

Нашли картинку с нужной композицией, настроением или техникой — возьмите её как образец,
а содержание сделайте своим.

1. Загрузите образец в Алису AI или GigaChat и дайте промпт «Опиши образец по 11 блокам»
   (ниже, среди промптов урока). Нейросеть разложит картинку по формуле и соберёт промпт.
2. Поменяйте в промпте то, что делает картинку вашей: объект, эпоху, цвета, формат.
   От образца остаются приёмы, а не содержание.
3. Нарисуйте по новому промпту. В GigaChat после загрузки картинки рисовать можно только
   в новом диалоге — перенесите промпт туда.

Так автор курса собрал стиль «классическая морская живопись маслом» (стиль 11): загрузил
фото картины с парусником, попросил описать, как написаны волны и солнечный свет,
получил подробный промпт и нарисовал по нему в GigaChat.

Образец — источник приёмов, а не копия: не воспроизводите чужую картину целиком и перед
публикацией убедитесь, что результат не повторяет узнаваемое чужое произведение.

## 5. Доработка за несколько шагов {#dorabotka}

Первая картинка редко бывает окончательной. Правьте в том же чате: «перерисуй: …» — и меняйте
**одно за раз**, иначе непонятно, что сработало. Так автор курса дорабатывал парусник
в GigaChat:

> перерисуй, чтобы парусник был с 3 мачтами и по 2–3 паруса на мачтах, кливер впереди, ход
> корабля под 45 градусов на зрителя — нос вправо, солнце сделай круглым, детально прорисуй лучи

| Что не так | Что поправить |
|---|---|
| искажённые буквы | убрать текст из картинки: «без надписей» |
| странные руки, лишние пальцы | спрятать руки или сменить позу: «руки за спиной», «вид со спины» |
| перегружено деталями | меньше объектов, «минималистично», «много свободного места» |
| не тот стиль | поставить стиль первым и убрать слова, которые ему противоречат |
| плоско и скучно | добавить свет: «контровой свет», «золотой час» |

## 6. Права и честность {#prava}

`[проверено 29.09.2026]`

- **Бесплатно — для личных некоммерческих целей.** Так в условиях
  [Алисы AI](https://yandex.ru/legal/alice_chat/ru/) (п. 3.1, редакция 10.09.2026; с «Алисой Плюс»
  картинки можно использовать и в иных целях) и
  [GigaChat](https://developers.sber.ru/docs/ru/policies/gigachat-agreement/individuals)
  (п. 2.4, редакция 06.02.2026; права на результат — у автора запроса, п. 6.2). Для пособия
  на продажу, рекламы или издания нужен платный доступ; относится ли слайд вашей лекции
  к личным некоммерческим целям, уточните у юриста вуза.
- **Чужие права проверяете вы** (Алиса AI, п. 3.2): картинка может случайно повторить чужое
  произведение.
- **Без персональных данных.** Не загружайте фотографии студентов и коллег: соглашение
  GigaChat запрещает загружать чужие персональные данные (п. 8.7).
- **Подпишите** «Изображение создано нейросетью» — так же, как с текстом (лекция 3).
- **Имя художника** в промпте помогает поймать стиль; для публикаций надёжнее описать
  приёмы словами, особенно у современных авторов.

## 7. Навык-иллюстратор {#navyk}

Системная инструкция агента ART PROMPT MASTER из курса 2025 года теперь — навык
`illustrating-lessons`. По короткому запросу или загруженному образцу он раскладывает
задачу по 11 блокам и выдаёт три промпта — краткий, стандартный и подробный — для Алисы AI
и GigaChat, а по неудачному результату подсказывает, что поправить. Скачать — на странице
[«Навыки»](/navyki/); как поставить — в [бонусном уроке 1](/bonus-navyki/#kak-postavit).

Бесплатно: приложите `SKILL.md` и справочники к чату Алисы AI или GigaChat, попросите
следовать инструкции — и нарисуйте по лучшему варианту.

## 8. Коллекция: 11 стилей {#stili}

Промпты — из материалов курса 2025 года. Они по-английски, так их и вставляйте; параметры
Midjourney убраны, формат указан словами. Картинки — образцы стилей из тех же материалов.

### Стиль 1. 3D-рендер — футуристические киборги {#stil-1}

![Стиль 1: 3D-рендер, футуристические киборги](/kartinki/illyustracii/stil-01.jpg){: width="624" height="287" loading="lazy" }

Фотореалистичный 3D-рендер с глянцевыми пластиковыми поверхностями, хромированными деталями
и футуристическими персонажами-киборгами; контраст органического (кожа) и синтетического
(пластик, металл).

**Приметы:** оранжево-красные глянцевые шлемы и маски; хром с отражениями; идеальная кожа;
визоры и импланты; холодный голубой градиентный фон; студийный свет с чёткими бликами.

```prompt
id: b2-stil-01
title: Стиль 1 — 3D-рендер, футуристические киборги
kogda: обложка про технологии, будущее, ИИ
---
Photorealistic 3D render of futuristic female cyborg, wearing glossy orange-red plastic helmet with chrome metallic details, perfect human skin visible on face, cybernetic implants, futuristic visor, studio lighting with sharp highlights and reflections, cold blue gradient background, contrast between organic and synthetic materials, shot in portrait orientation, rendered in Octane Render with ray tracing, ultra-detailed textures, hyperrealistic, vertical 9:16 format
```

### Стиль 2. Деконструктивизм — архитектурный хаос {#stil-2}

![Стиль 2: деконструктивизм, архитектурный хаос](/kartinki/illyustracii/stil-02.jpg){: width="624" height="633" loading="lazy" }

Монохромная композиция из фрагментированных геометрических структур: архитектурный хаос,
монументальность, несколько перспектив одновременно.

**Приметы:** строгая чёрно-белая палитра; фрагменты архитектуры; лучи света из центра;
толпы тёмных силуэтов; колонны, ступени и платформы в хаотичном порядке; центральная
симметрия; высокий контраст.

```prompt
id: b2-stil-02
title: Стиль 2 — деконструктивизм
kogda: архитектура, сложные системы, образ «хаоса» и структуры
---
Monochrome black and white deconstructivist architectural illustration, fragmented geometric structures, multiple perspectives simultaneously, dramatic rays of light radiating from center, crowds of people as dark silhouettes, architectural elements like columns steps platforms in chaotic arrangement, central symmetrical composition, high contrast chiaroscuro lighting, sense of monumentality and controlled chaos, inspired by M.C. Escher and Zaha Hadid, digital art, intricate details, square 1:1 format
```

### Стиль 3. Нуар — драматичный чёрно-белый портрет {#stil-3}

![Стиль 3: нуар, чёрно-белый портрет](/kartinki/illyustracii/stil-03.jpg){: width="624" height="300" loading="lazy" }

Классический нуар-портрет с контрастным светом: таинственная, мрачная атмосфера, развевающаяся
ткань добавляет движения.

**Приметы:** строгая чёрно-белая фотография; выразительный макияж; ткань или волосы
на ветру; сильный контрастный свет сбоку или снизу; детальная фактура ткани.

```prompt
id: b2-stil-03
title: Стиль 3 — нуар, чёрно-белый портрет
kogda: драматичный акцент, история кино и фотографии
---
Film noir style black and white portrait photography, mysterious woman with dark lipstick, dramatic fabric or veil flowing dynamically around face as if blown by wind, strong chiaroscuro lighting from side, high contrast shadows, moody and mysterious atmosphere, detailed fabric textures, cinematic composition, inspired by classic 1940s film noir, fashion photography aesthetic, shot on medium format camera, sharp focus on face, 3:2 format
```

### Стиль 4. Томас Кинкейд — романтический пейзаж {#stil-4}

![Стиль 4: романтический пейзаж](/kartinki/illyustracii/stil-04.jpg){: width="624" height="419" loading="lazy" }

Идиллический пейзаж с тёплым светом, уютными домиками и живописной природой — фирменный
стиль художника Томаса Кинкейда с объёмным светом.

**Приметы:** фахверковый дом; горы или лес на заднем плане; золотой час; тёплый свет в окнах;
извилистая тропинка; пышная зелень и цветы; водоём; облачное небо с просветами.

```prompt
id: b2-stil-04
title: Стиль 4 — романтический пейзаж
kogda: спокойный фон, литература, краеведение
---
Thomas Kinkade style romantic landscape painting, cozy cottage with half-timbered architecture, warm glowing lights from windows, winding stone path leading to house, lush green meadow with wildflowers, majestic mountains in background, serene lake reflecting scene, golden hour sunset lighting with volumetric light rays, soft clouds with sunlight breaking through, magical warm atmosphere, rich colors, oil painting texture, idyllic and peaceful mood, highly detailed foliage and architectural details, wide 16:9 format
```

### Стиль 5. Бумажная аппликация — многослойный объём {#stil-5}

![Стиль 5: многослойная бумажная аппликация](/kartinki/illyustracii/stil-05.jpg){: width="624" height="372" loading="lazy" }

Вырезание из бумаги: несколько слоёв цветной бумаги и тени между ними дают объём.

**Приметы:** чёткие слои; тени между слоями; природная или морская тема; волнистые формы;
силуэты животных и растений; 2–5 цветов без градиентов.

```prompt
id: b2-stil-05
title: Стиль 5 — бумажная аппликация
kogda: биология, география, детская и научно-популярная тема
---
Paper cut art, layered papercraft illustration, underwater ocean scene with whales and marine life, multiple layers of colored paper creating depth, wave patterns in turquoise and dark blue paper layers, coral reefs and seaweed in foreground, two whales swimming, small tropical fish, gold and yellow accent elements, visible shadows between layers creating 3D effect, paper texture visible, limited color palette of teal turquoise navy blue white gold, clean silhouettes, papercraft style, top view lighting, wide 16:9 format
```

### Стиль 6. Карикатура — детальная характерная иллюстрация {#stil-6}

Яркая иллюстрация с преувеличенными пропорциями и богатой детализацией; юмористический,
праздничный характер, акцент на фактурах и атмосфере.

**Приметы:** большая голова и живот; выразительные глаза и усы; детально прописанная
традиционная еда и напитки; тёплый свет свечей и фонарей; богатый интерьер; праздничное
настроение. В промпте курса пивная кружка заменена чайной.

```prompt
id: b2-stil-06
title: Стиль 6 — карикатура
kogda: весёлый персонаж, разрядка в середине лекции
---
Detailed cartoon illustration, cheerful plump Bavarian chef character with exaggerated proportions, large head, big bushy moustache, holding huge steaming mug of tea, table full of traditional food (sausages, pretzels, sauerkraut), warm cozy lighting from lanterns and candles, traditional Bavarian restaurant interior with wooden barrels in background, people celebrating, rich detailed textures on food glass and wood, caricature style but highly detailed, festive joyful atmosphere, warm golden brown color palette, professional digital illustration, concept art quality, wide 16:9 format
```

### Стиль 7. Кинопанорама — эпический древний город {#stil-7}

![Стиль 7: кинематографическая панорама древнего города](/kartinki/illyustracii/stil-07.jpg){: width="624" height="376" loading="lazy" }

Широкоформатная эпическая композиция в духе исторических фильмов: монументальная
архитектура, массовые сцены, драматичный свет золотого часа.

**Приметы:** формат 21:9 или 16:9; античный город; войска и толпы; храмы, стены, башни;
закатное небо; пыль и дымка; фигуры на переднем плане; тёплая цветокоррекция.

```prompt
id: b2-stil-07
title: Стиль 7 — кинопанорама древнего города
kogda: история, античность, масштаб события
---
Epic cinematic panoramic shot, ancient city at golden hour, massive armies and crowds, monumental classical architecture with temples walls towers, dramatic sunset sky with volumetric clouds, atmospheric dust and haze in air, silhouettes of warriors on foreground, wide-angle perspective, sense of epic scale and grandeur, warm color grading with golden ochre brown tones, cinematic lighting, inspired by films like Gladiator and 300, matte painting quality, photorealistic, ultra-wide 21:9 panorama
```

### Стиль 8. Ультрареализм — как настоящая фотография {#stil-8}

![Стиль 8: ультрареалистичная фотография, туристы в горах](/kartinki/illyustracii/stil-08.jpg){: width="624" height="344" loading="lazy" }

Фотореалистичный снимок с естественным светом и параметрами профессиональной съёмки;
документальный стиль.

**Приметы:** естественный солнечный свет; реалистичные фактуры ткани, кожи, природы;
композиция как у настоящего фото; размытый фон; естественные цвета; люди в естественных
позах.

```prompt
id: b2-stil-08
title: Стиль 8 — ультрареалистичная фотография
kogda: «живая» сцена вместо стоковой фотографии
---
Ultra realistic photography, three hikers with backpacks walking away on mountain trail, shot from behind, golden dry grass field, majestic mountains in background, clear blue sky with white clouds, natural sunlight, authentic outdoor adventure aesthetic, shot on Canon EOS R5 with 24-70mm lens at f/4, slight shallow depth of field with background softly blurred, realistic textures on clothing backpacks and landscape, warm natural color palette, professional outdoor photography, documentary style, wide 16:9 format
```

### Стиль 9. Гротеск — сюрреалистическая иллюстрация {#stil-9}

Детальная гротескная иллюстрация: искажённые фигуры, органические спирали,
отталкивающе-завораживающая эстетика — смесь Босха, Гигера и лоубрау.

**Приметы:** искажённые фигуры и черты лица; спиральные формы; множество глаз и странных
деталей; узорчатая фактура кожи; приглушённая винтажная палитра; предельная детализация.

```prompt
id: b2-stil-09
title: Стиль 9 — гротеск
kogda: искусствоведение, сюрреализм, образ тревоги
---
Grotesque surrealist illustration, distorted human figures with exaggerated features, spiral organic patterns throughout, multiple eyes and strange details, textured skin with intricate patterns, unsettling chubby baby-like creatures with wide grins, elderly man with elongated features covered in swirls, vintage muted color palette of beige sepia grey-green, extreme level of detail, style combining Hieronymus Bosch and HR Giger and Mark Ryden, lowbrow surrealism, simultaneously repulsive and mesmerizing, intricate pen and ink quality, square 1:1 format
```

### Стиль 10. Неоновые контурные иконки {#stil-10}

Минималистичные иконки из светящихся неоновых контуров на чёрном фоне — стиль логотипов,
элементов интерфейса и иконок разделов.

**Приметы:** абсолютно чёрный фон; контуры без заливки; разноцветное неоновое свечение;
отражения на глянцевой поверхности; векторная чёткость; тематический набор предметов.
В промпте курса тема бара заменена учебной.

```prompt
id: b2-stil-10
title: Стиль 10 — неоновые контурные иконки
kogda: иконки разделов курса, обложка в «технологичном» стиле
---
Neon outline icon illustration on pure black background, science and education theme with flasks microscope books globe light bulb, glowing neon line art in multiple colors (pink cyan yellow green orange), no fill only outlines, neon tubes effect, reflections on glossy black surface below, minimalist clean design, vector art style, glowing edges, electric aesthetic, vibrant neon colors against darkness, modern icon design, square 1:1 format
```

### Стиль 11. Масляная живопись — маяк и море {#stil-11}

![Стиль 11: масляная живопись, маяк и море](/kartinki/illyustracii/stil-11.jpg){: width="624" height="348" loading="lazy" }

Традиционная масляная живопись: видимые мазки, фактура импасто, классическая композиция
морского пейзажа.

**Приметы:** маяк на скалах; бурное море; драматичное небо; видимые мазки и толстый слой
краски; мольберт на переднем плане; контраст тёплого и холодного; свет сквозь облака.

```prompt
id: b2-stil-11
title: Стиль 11 — масляная живопись, маяк и море
kogda: литература, история искусства, образ «маяка» в теме
---
Traditional oil painting on canvas, lighthouse on rocky cliff by stormy sea, dramatic cloudy sky with sunlight breaking through, rough ocean waves crashing, visible thick brushstrokes and impasto texture, rich oil paint quality, artist's easel in foreground showing the painting (meta reference), warm oranges and cool blues in contrast, romantic maritime landscape, style of Ivan Aivazovsky or J.M.W. Turner, textured canvas visible, classical composition, museum quality artwork, 3:2 format
```

Вариант того же стиля, собранный по образцу (раздел 4), — «классическая морская живопись»:

```prompt
id: b2-stil-11-parusnik
title: Стиль 11, вариант по образцу — парусник на закате
kogda: подробный промпт, собранный по картине-образцу
---
Classical maritime oil painting on textured canvas, detailed tall ship sailing vessel with multiple masts and rigging clearly visible, wind-filled sails with realistic fabric folds and shadows showing volume, sails illuminated by warm golden-orange sunset light creating dramatic backlight effect, dark silhouette of ship hull with deck details, ship positioned against dramatic sky, highly detailed dynamic ocean with translucent multi-layered waves structure, each wave showing depth and three-dimensional form with pronounced crests and troughs, thick impasto paint application creating visible physical texture on wave surfaces, color gradient within waves from deep emerald-green in depths to light turquoise-cyan on illuminated surfaces, golden-yellow sunlight reflections painted with thick brushstrokes in diagonal patterns naturally following organic wave movement, white foaming wave crests with fine textural detail, light penetrating through water creating realistic luminosity effect, spectacular sunset sky with volumetric clouds and atmospheric depth, warm color palette dominated by golden orange pink and coral tones, dramatic sunlight breaking through clouds with volumetric rays creating atmospheric perspective, strong contrast between warm lighting (sky, water reflections) and cool tones (deep ocean shadows), visible expressive brushstrokes throughout showing passionate artist's hand and technique, rich impasto texture especially pronounced on wave surfaces, romantic and dramatic maritime atmosphere evoking emotion and grandeur, inspired by Russian marine painter Ivan Aivazovsky's mastery combined with J.M.W. Turner's atmospheric effects and light philosophy, authentic 19th century classical academic painting technique, museum quality artwork, 3:2 format
```

## Промпты урока {#promty}

```prompt
id: b2-shablon
title: Картинка к слайду по формуле
kogda: нужна иллюстрация к конкретному слайду
---
Нарисуй [СТИЛЬ, например: акварельную иллюстрацию]: [ОБЪЕКТ — кто или что главное], [ДЕЙСТВИЕ ИЛИ ПОЗА], [ОКРУЖЕНИЕ — где и когда].
Свет: [ОТКУДА И КАКОЙ]. Цвета: [ГЛАВНЫЕ ЦВЕТА].
Композиция: [ПЛАН И РАКУРС], свободное место [ГДЕ] под заголовок слайда, горизонтальный формат 16:9.
Настроение: [КАКОЕ].
Без текста и надписей, без водяных знаков.
```

```prompt
id: b2-tri-varianta
title: Три промпта к слайду — краткий, стандартный, подробный
kogda: не знаете, что нарисовать, — пусть нейросеть предложит
---
Ты — иллюстратор учебных презентаций. Вот текст слайда: [ТЕКСТ СЛАЙДА]. Аудитория: [КТО].
Предложи образ, который поможет понять слайд, а не просто украсит его, и напиши три промпта для генерации картинки:
– краткий — 30–50 слов;
– стандартный — 80–120 слов;
– подробный — 150–250 слов.
Каждый промпт строй по блокам: стиль, объект, действие, окружение, свет, цвет, композиция (свободное место под заголовок, формат 16:9), настроение, что исключить. Без текста и надписей на картинке.
```

```prompt
id: b2-po-obrazcu
title: Опиши образец по 11 блокам
kogda: нашли картинку-образец и хотите своё изображение в том же приёме
---
Опиши приложенную картинку по 11 блокам: объект, действие или поза, окружение, свет, цвет, стиль и техника, композиция и формат, камера (если это фото), настроение, качество, чего на картинке нет.
Отдельно — в чём особый приём автора (как написаны свет, фактура, линии).
Затем составь промпт, который передаёт эти приёмы, но с моим содержанием: [ЧТО ДОЛЖНО БЫТЬ НА МОЕЙ КАРТИНКЕ]. Формат — [СООТНОШЕНИЕ СТОРОН]. Без текста и надписей.
```

```prompt
id: b2-seriya
title: Серия в одном стиле
kogda: несколько картинок для одной презентации
---
Мне нужна серия из [ЧИСЛО] картинок для одной презентации на тему «[ТЕМА]».
Сначала напиши общий блок стиля — техника, свет, цвет, композиция, формат 16:9, «без текста и надписей», — одинаковый для всех картинок.
Затем для каждого слайда — [СПИСОК СЛАЙДОВ] — напиши промпт: общий блок стиля плюс свой объект и действие.
```

## Самостоятельная практика {#samostoyatelno}

**Время:** около 2 часов. Практика — для вас: ничего отправлять не нужно. Зачёт по курсу —
[итоговый тест](/test/), от 44 баллов из 72 (60 %).

1. **Обложка.** Нарисуйте обложку к своей следующей лекции по одному промпту в Алисе AI
   и в GigaChat — сравните.
2. **Метафора.** Выберите трудное понятие своего курса и нарисуйте его образом, без надписей.
3. **По образцу.** Найдите картинку, которая нравится, получите описание по 11 блокам
   и нарисуйте своё: другое содержание — тот же приём.
4. **Серия.** Три картинки в одном стиле для одной презентации.
5. **Проверка.** Подпишите картинки и проверьте содержание: руки, приборы, детали эпохи.

**Как понять, что получилось:** картинка помогает понять слайд, а не только украшает его;
на ней нет текста и ошибок по сути; серия выглядит одной; под картинкой стоит подпись.

## Проверьте себя {#proverte-sebya}

<details>
<summary>Из каких блоков состоит промпт картинки?</summary>

Объект, действие или поза, окружение, свет, цвет, стиль и техника, композиция и формат,
камера, настроение, качество, что исключить. Для слайда обычно хватает первых семи.
</details>

<details>
<summary>Почему на картинке для слайда лучше обойтись без надписей?</summary>

Нейросеть может исказить буквы. Текст надёжнее добавить в редакторе презентаций, а в промпт
дописать «без текста и надписей».
</details>

<details>
<summary>Как получить своё изображение по найденной картинке?</summary>

Загрузить её в Алису AI или GigaChat, попросить описать по 11 блокам и составить промпт,
заменить содержание своим и нарисовать. В GigaChat — в новом диалоге.
</details>

<details>
<summary>Можно ли картинку с бесплатного тарифа поставить в пособие на продажу?</summary>

Нет: бесплатно картинки можно использовать в личных некоммерческих целях (Алиса AI — п. 3.1,
GigaChat — п. 2.4). Для иных целей нужны «Алиса Плюс» или платный доступ GigaChat.
</details>

<details>
<summary>Как сделать серию картинок в одном стиле?</summary>

Держать одинаковыми блоки стиля, света, цвета и формата и менять только объект и действие.
</details>

## Источники {#istochniki}

- Алиса AI: генерация изображений — https://alice.yandex.ru/support/ru/assistant/chat/picture; редактирование фото — https://alice.yandex.ru/support/ru/assistant/chat/edit-photos; условия использования, редакция 10.09.2026 — https://yandex.ru/legal/alice_chat/ru/
- Яндекс. «В Алисе AI теперь можно редактировать изображения», 25.12.2025 — https://yandex.ru/company/news/25-12-2025-02
- GigaChat: генерация изображений — https://giga.chat/help/articles/how-to-generate-images; загрузка изображений — https://giga.chat/help/articles/gigachat-load-picture; соглашение для физических лиц, редакция 06.02.2026 — https://developers.sber.ru/docs/ru/policies/gigachat-agreement/individuals
- Материалы автора курса 2025 года: универсальный фреймворк промпта для нейроиллюстраций, коллекция промптов, системная инструкция агента ART PROMPT MASTER.
