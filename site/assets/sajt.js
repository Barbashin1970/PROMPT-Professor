/* Сайт курса «ИИ в учебном процессе» — общие механики.
   Проект — docs/SAIT-PROEKT.md, §4.1–4.4. Прогрессивное улучшение: без скриптов ссылки
   на сервисы открываются в новой вкладке, а текст промпта можно выделить вручную.

   Разметка, которую понимает этот файл:
     <button data-kopirovat="#id">            — скопировать текст элемента #id
     <a href="…" target="_blank" data-ryadom>  — открыть в новой вкладке справа от курса
     <div class="svc" data-svc data-kopirovat-pered="#id"> — меню «Открыть в…»;
        перед открытием копирует текст #id (без атрибута — просто открывает)
*/
(function () {
  'use strict';

  var KLYUCH = 'kurs-ii:servis';          // последний выбранный сервис
  var PODSKAZKA = 'Скопировано. Вставьте во вкладке нейросети: ⌘V или Ctrl+V.';

  /* ── Сообщение внизу экрана ─────────────────────────────────────────────── */

  var tost = null;
  var tostTaimer = 0;

  function soobshchenie(tekst) {
    if (!tost) {
      tost = document.createElement('div');
      tost.className = 'toast';
      tost.setAttribute('role', 'status');
      tost.setAttribute('aria-live', 'polite');
      document.body.appendChild(tost);
    }
    tost.textContent = tekst;
    tost.classList.add('is-on');
    clearTimeout(tostTaimer);
    tostTaimer = setTimeout(function () { tost.classList.remove('is-on'); }, 2800);
  }

  /* ── Копирование ────────────────────────────────────────────────────────── */

  function kopirovat(tekst) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(tekst).then(
        function () { return true; },
        function () { return kopirovatStaroe(tekst); }
      );
    }
    return Promise.resolve(kopirovatStaroe(tekst));
  }

  function kopirovatStaroe(tekst) {
    var pole = document.createElement('textarea');
    pole.value = tekst;
    pole.setAttribute('readonly', '');
    pole.style.position = 'fixed';
    pole.style.opacity = '0';
    document.body.appendChild(pole);
    pole.select();
    var vyshlo = false;
    try { vyshlo = document.execCommand('copy'); } catch (e) { vyshlo = false; }
    document.body.removeChild(pole);
    return vyshlo;
  }

  function vydelit(el) {
    var diapazon = document.createRange();
    diapazon.selectNodeContents(el);
    var vybor = window.getSelection();
    vybor.removeAllRanges();
    vybor.addRange(diapazon);
  }

  function tekstElementa(selektor) {
    var el = selektor ? document.querySelector(selektor) : null;
    return el ? { el: el, tekst: el.textContent.replace(/\s+$/, '') } : null;
  }

  function otmetitKnopku(knopka) {
    var bylo = knopka.getAttribute('data-bylo') || knopka.textContent;
    knopka.setAttribute('data-bylo', bylo);
    knopka.textContent = 'Скопировано';
    knopka.classList.add('is-done');
    setTimeout(function () {
      knopka.textContent = bylo;
      knopka.classList.remove('is-done');
    }, 2000);
  }

  /* ── Новая вкладка ──────────────────────────────────────────────────────── */

  // Нейросети и источники открываются новой вкладкой того же браузера — браузер ставит её
  // справа от вкладки курса. Решение автора 29.09.2026 вместо окна-попапа без адресной
  // строки. Ссылки на странице открывает сам браузер (target="_blank"); эта функция —
  // для сценариев, которым нужно открыть адрес из кода.
  function otkrytVkladku(url) {
    var ssylka = document.createElement('a');
    ssylka.href = url;
    ssylka.target = '_blank';
    ssylka.rel = 'noopener noreferrer';
    document.body.appendChild(ssylka);
    ssylka.click();
    ssylka.remove();
  }

  /* ── Меню «Открыть в…» и «Нейросети» ───────────────────────────────────── */

  // Набор сервисов для меню: data-svc-nabor="risovanie" — рисующие нейросети (бонусный урок 2);
  // без атрибута — общий список. Последний выбор помнится для каждого набора отдельно.
  function klyuchVybora(nabor) { return nabor ? KLYUCH + ':' + nabor : KLYUCH; }

  function prochitatVybor(nabor) {
    try { return window.localStorage.getItem(klyuchVybora(nabor)); } catch (e) { return null; }
  }

  function zapomnitVybor(id, nabor) {
    try { window.localStorage.setItem(klyuchVybora(nabor), id); } catch (e) { /* не сохранилось — предложим выбрать снова */ }
  }

  function spisokServisov(nabor) {
    var nabory = window.SERVISY_NABORY || {};
    var vse = ((nabor && nabory[nabor]) || window.SERVISY || []).slice();
    var proshlyi = prochitatVybor(nabor);
    vse.sort(function (a, b) { return (b.id === proshlyi) - (a.id === proshlyi); });
    return vse;
  }

  function zapolnitMenu(obertka) {
    var menu = obertka.querySelector('[data-svc-menu]');
    if (!menu || menu.getAttribute('data-gotovo')) return;
    var dlyaKopii = obertka.getAttribute('data-kopirovat-pered');
    var nabor = obertka.getAttribute('data-svc-nabor');
    menu.innerHTML = '';
    spisokServisov(nabor).forEach(function (s) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('data-servis', s.id);
      if (dlyaKopii) a.setAttribute('data-kopirovat-pered', dlyaKopii);
      a.appendChild(document.createTextNode(s.imya));
      var poyasnenie = document.createElement('small');
      poyasnenie.textContent = s.zachem;
      a.appendChild(poyasnenie);
      var skrytoe = document.createElement('span');
      skrytoe.className = 'visually-hidden';
      skrytoe.textContent = ' (откроется в новой вкладке)';
      a.appendChild(skrytoe);
      li.appendChild(a);
      menu.appendChild(li);
    });
    menu.setAttribute('data-gotovo', '1');
  }

  function zakrytVseMenu(krome) {
    document.querySelectorAll('[data-svc]').forEach(function (obertka) {
      if (obertka === krome) return;
      var knopka = obertka.querySelector('[data-svc-knopka]');
      var menu = obertka.querySelector('[data-svc-menu]');
      if (knopka) knopka.setAttribute('aria-expanded', 'false');
      if (menu) menu.hidden = true;
    });
  }

  function pereklyuchitMenu(obertka) {
    var knopka = obertka.querySelector('[data-svc-knopka]');
    var menu = obertka.querySelector('[data-svc-menu]');
    if (!knopka || !menu) return;
    var otkryto = knopka.getAttribute('aria-expanded') === 'true';
    zakrytVseMenu(obertka);
    if (otkryto) {
      knopka.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      return;
    }
    zapolnitMenu(obertka);
    knopka.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    var pervaya = menu.querySelector('a');
    if (pervaya) pervaya.focus();
  }

  /* ── Обработчики ────────────────────────────────────────────────────────── */

  document.addEventListener('click', function (sobytie) {
    var cel = sobytie.target;

    var knopkaKopii = cel.closest('[data-kopirovat]');
    if (knopkaKopii) {
      var dannye = tekstElementa(knopkaKopii.getAttribute('data-kopirovat'));
      if (!dannye) return;
      kopirovat(dannye.tekst).then(function (vyshlo) {
        if (vyshlo) {
          otmetitKnopku(knopkaKopii);
          soobshchenie(knopkaKopii.getAttribute('data-soobshchenie') || PODSKAZKA);
        } else {
          vydelit(dannye.el);
          soobshchenie('Текст выделен — нажмите ⌘C или Ctrl+C.');
        }
      });
      return;
    }

    var knopkaMenu = cel.closest('[data-svc-knopka]');
    if (knopkaMenu) {
      pereklyuchitMenu(knopkaMenu.closest('[data-svc]'));
      return;
    }

    var ssylka = cel.closest('a[data-ryadom], [data-svc-menu] a');
    if (ssylka) {
      // Вкладку открывает сам браузер: у ссылки target="_blank", поэтому работают и щелчок
      // с ⌘ или Ctrl, и средняя кнопка. До перехода — запомнить сервис и скопировать промпт.
      var id = ssylka.getAttribute('data-servis');
      var obertkaMenu = ssylka.closest('[data-svc]');
      if (id) zapomnitVybor(id, obertkaMenu && obertkaMenu.getAttribute('data-svc-nabor'));
      var kopiya = tekstElementa(ssylka.getAttribute('data-kopirovat-pered'));
      if (kopiya) {
        // Копируем синхронно, пока вкладка курса в фокусе: новая вкладка заберёт фокус,
        // и асинхронный буфер обмена после этого откажет.
        if (kopirovatStaroe(kopiya.tekst)) {
          soobshchenie(PODSKAZKA);
        } else {
          kopirovat(kopiya.tekst).then(function (vyshlo) {
            soobshchenie(vyshlo ? PODSKAZKA : 'Скопировать не вышло — выделите текст промпта и нажмите ⌘C или Ctrl+C.');
          });
        }
      }
      // Меню закрываем после перехода: скрытая раньше времени ссылка может его не выполнить.
      setTimeout(function () { zakrytVseMenu(null); }, 0);
      return;
    }

    if (!cel.closest('[data-svc]')) zakrytVseMenu(null);
  });

  document.addEventListener('keydown', function (sobytie) {
    if (sobytie.key !== 'Escape') return;
    var otkrytoe = document.querySelector('[data-svc-knopka][aria-expanded="true"]');
    zakrytVseMenu(null);
    if (otkrytoe) otkrytoe.focus();
  });

  /* Тема оформления: «как в системе» → светлая → тёмная. Выбор хранится в браузере;
     ранний сценарий в <head> каждой страницы ставит его до отрисовки, чтобы страница
     не мигала. Без JavaScript тема просто следует системе. */
  var KLYUCH_TEMY = 'kurs-ii-tema';
  var TEMY = ['auto', 'light', 'dark'];
  var NAZVANIYA_TEM = { auto: 'как в системе', light: 'светлая', dark: 'тёмная' };
  var ZNACHKI_TEM = {
    auto: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  function tekushchayaTema() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'light' || t === 'dark' ? t : 'auto';
  }

  function sleduyushchayaTema(t) { return TEMY[(TEMY.indexOf(t) + 1) % TEMY.length]; }

  function postavitTemu(tema) {
    if (tema === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', tema);
    try {
      if (tema === 'auto') localStorage.removeItem(KLYUCH_TEMY);
      else localStorage.setItem(KLYUCH_TEMY, tema);
    } catch (e) { /* хранилище недоступно — тема действует до ухода со страницы */ }
  }

  function podpisatKnopkuTemy(knopka) {
    var t = tekushchayaTema();
    knopka.innerHTML = ZNACHKI_TEM[t];
    knopka.setAttribute('aria-label', 'Тема: ' + NAZVANIYA_TEM[t] +
      '. Нажмите, чтобы выбрать: ' + NAZVANIYA_TEM[sleduyushchayaTema(t)]);
    knopka.title = 'Тема: ' + NAZVANIYA_TEM[t];
  }

  function postavitPereklyuchatelTemy() {
    var ryad = document.querySelector('.nav__row');
    if (!ryad || document.getElementById('tema')) return;
    var knopka = document.createElement('button');
    knopka.type = 'button';
    knopka.id = 'tema';
    knopka.className = 'tema';
    podpisatKnopkuTemy(knopka);
    knopka.addEventListener('click', function () {
      var sled = sleduyushchayaTema(tekushchayaTema());
      postavitTemu(sled);
      podpisatKnopkuTemy(knopka);
      soobshchenie('Тема: ' + NAZVANIYA_TEM[sled] + '.');
    });
    ryad.insertBefore(knopka, ryad.querySelector('.svc'));
  }

  /* Кнопка «наверх» — как в ARCHI (web/obshchee.js): ставится сценарием, появляется
     после прокрутки на высоту экрана, плавность — только без prefers-reduced-motion.
     Пока кнопка не видна, она выведена из порядка Tab: невидимая кнопка
     не должна ловить фокус с клавиатуры. */
  function postavitNaverh() {
    if (document.getElementById('naverh')) return;
    var knopka = document.createElement('button');
    knopka.type = 'button';
    knopka.id = 'naverh';
    knopka.className = 'naverh';
    knopka.setAttribute('aria-label', 'Наверх страницы');
    knopka.title = 'Наверх';
    knopka.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M12 19V5M12 5l-6 6M12 5l6 6" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    knopka.addEventListener('click', function () {
      var tiho = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: tiho ? 'auto' : 'smooth' });
      // Следующий Tab продолжает с начала страницы, а не с кнопки внизу.
      var brend = document.querySelector('.nav__brand');
      if (brend) brend.focus({ preventScroll: true });
    });
    document.body.appendChild(knopka);

    var zaprosheno = false;
    function obnovit() {
      zaprosheno = false;
      var vidna = window.pageYOffset > window.innerHeight;
      knopka.classList.toggle('vidna', vidna);
      knopka.tabIndex = vidna ? 0 : -1;
      if (vidna) knopka.removeAttribute('aria-hidden');
      else knopka.setAttribute('aria-hidden', 'true');
    }
    function poprosit() {
      if (!zaprosheno) { zaprosheno = true; window.requestAnimationFrame(obnovit); }
    }
    window.addEventListener('scroll', poprosit, { passive: true });
    window.addEventListener('resize', poprosit, { passive: true });
    obnovit();
  }

  /* Высота закреплённой шапки — в --vysota-shapki: на неё опирается scroll-padding-top,
     чтобы переход по якорю не прятал заголовок под шапку. Замеряется, а не угадывается:
     шапка меняет высоту при переносе строк и масштабе. */
  function otmeritShapku() {
    var shapka = document.querySelector('.nav');
    if (!shapka) return;
    var vysota = Math.round(shapka.getBoundingClientRect().height);
    if (vysota > 0) document.documentElement.style.setProperty('--vysota-shapki', vysota + 'px');
  }
  /* «Назад к уроку». Урок запоминает себя в sessionStorage, а при уходе по ссылке — и место
     (прокрутку и ближайший заголовок). Страница, открытая из урока, ставит слева
     в закреплённой шапке ссылку назад: её видно, даже если страница открылась на середине —
     например, «Образцы» на тексте про Луну. Возврат приводит на то же место урока.
     На главной ссылки нет; хранилище вкладки очищается при её закрытии. */
  var KLYUCH_UROKA = 'kurs-ii:urok';
  var KLYUCH_VOZVRATA = 'kurs-ii:vozvrat';

  function prochitat(klyuch) {
    try { return JSON.parse(sessionStorage.getItem(klyuch) || 'null'); } catch (e) { return null; }
  }
  function zapomnit(klyuch, znachenie) {
    try { sessionStorage.setItem(klyuch, JSON.stringify(znachenie)); } catch (e) { /* без хранилища — без ссылки */ }
  }

  function yakorPered(ssylka) {
    var yakor = '';
    document.querySelectorAll('.prose h2[id], .prose h3[id]').forEach(function (z) {
      if (z.compareDocumentPosition(ssylka) & Node.DOCUMENT_POSITION_FOLLOWING) yakor = z.id;
    });
    return yakor;
  }

  function postavitNazad(urok) {
    var ryad = document.querySelector('.nav__row');
    if (!ryad || ryad.querySelector('.nav__nazad')) return;
    var a = document.createElement('a');
    a.className = 'nav__nazad';
    a.href = urok.put + (urok.yakor ? '#' + urok.yakor : '');
    a.title = urok.podpis;
    a.setAttribute('aria-label', 'Назад к уроку: ' + urok.podpis);
    a.innerHTML = '<span aria-hidden="true">←</span> Назад к уроку';
    a.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (typeof urok.y !== 'number') return;   // места нет — хватит якоря в адресе ссылки
      e.preventDefault();
      zapomnit(KLYUCH_VOZVRATA, { put: urok.put, y: urok.y });
      window.location.href = urok.put;
    });
    ryad.insertBefore(a, ryad.firstChild);
    ryad.classList.add('nav__row--nazad');
  }

  function vozvratKUroku() {
    var put = window.location.pathname;
    var bylUrok = prochitat(KLYUCH_UROKA);
    var izSajta = document.referrer.indexOf(window.location.origin + '/') === 0;
    if (bylUrok && bylUrok.put !== put && izSajta && put !== '/') postavitNazad(bylUrok);

    var urok = document.querySelector('[data-urok]');
    if (!urok) return;

    // Этот урок — теперь тот, к которому возвращаться.
    var etot = { put: put, podpis: urok.getAttribute('data-urok-podpis') || 'Урок' };
    zapomnit(KLYUCH_UROKA, etot);
    document.addEventListener('click', function (e) {
      var ssylka = e.target.closest ? e.target.closest('a[href]') : null;
      if (!ssylka || ssylka.target === '_blank') return;
      var adres;
      try { adres = new URL(ssylka.href, window.location.href); } catch (er) { return; }
      if (adres.origin !== window.location.origin || adres.pathname === put) return;
      etot.y = Math.round(window.pageYOffset);
      etot.yakor = yakorPered(ssylka);
      zapomnit(KLYUCH_UROKA, etot);
    }, true);

    // Вернулись по «Назад к уроку» — на то же место. Картинки дорисовываются и сдвигают
    // страницу, поэтому после загрузки место ставится ещё раз, если читатель не начал листать сам.
    var vozvrat = prochitat(KLYUCH_VOZVRATA);
    if (vozvrat && vozvrat.put === put) {
      try { sessionStorage.removeItem(KLYUCH_VOZVRATA); } catch (e) { /* не страшно */ }
      var trogali = false;
      ['wheel', 'touchstart', 'keydown'].forEach(function (sobytie) {
        window.addEventListener(sobytie, function () { trogali = true; }, { once: true, passive: true });
      });
      window.scrollTo(0, vozvrat.y);
      window.addEventListener('load', function () { if (!trogali) window.scrollTo(0, vozvrat.y); });
    }
  }

  vozvratKUroku();
  otmeritShapku();
  if (window.ResizeObserver && document.querySelector('.nav')) {
    new ResizeObserver(otmeritShapku).observe(document.querySelector('.nav'));
  } else {
    window.addEventListener('resize', otmeritShapku, { passive: true });
  }

  postavitPereklyuchatelTemy();
  postavitNaverh();

  // Для страниц со своими скриптами (конструктор, итоговый тест).
  window.KursII = {
    soobshchenie: soobshchenie,
    kopirovat: kopirovat,
    otkrytVkladku: otkrytVkladku,
    otkrytRyadom: otkrytVkladku,   // прежнее имя — для совместимости
    podskazka: PODSKAZKA
  };
})();
