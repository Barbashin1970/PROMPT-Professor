/* Service worker курса «ИИ в учебном процессе». Собирается tools/sobrat-sajt.py из
   tools/shablon-sw.js: сборщик подставляет версию и список страниц — руками site/sw.js не правят.

   Что делает. При первом визите сохраняет в телефоне или браузере все данные курса: страницы,
   стили, скрипты, картинки и скачиваемые файлы — после этого курс открывается и без связи.
   Страница открывается из сохранённого сразу, а свежая версия подтягивается в фоне и
   покажется при следующем открытии. При новой версии сайта файл с тем же отпечатком (?v=)
   переносится из прежнего сохранённого, а не качается заново.
   Чего не делает. Видео и аудио не сохраняет и не трогает; чужие сайты — нейросети, форма
   зачёта, видеохостинги — идут мимо. Новая сборка сайта — новая версия: старое сохранённое
   удаляется, страницы сохраняются заново. */
'use strict';

const VERSIYA = '__VERSIYA__';
const KESH = 'kurs-ii-' + VERSIYA;
const PREDZAGRUZKA = __PREDZAGRUZKA__;

self.addEventListener('install', (sobytie) => {
  sobytie.waitUntil((async () => {
    const kesh = await caches.open(KESH);
    await Promise.all(PREDZAGRUZKA.map(async (adres) => {
      const sOtpechatkom = adres.includes('?v=');
      if (sOtpechatkom) {
        const byl = await caches.match(adres);   // тот же отпечаток — тот же файл
        if (byl) { await kesh.put(adres, byl); return; }
      }
      // страницы и файлы без отпечатка — мимо HTTP-кэша браузера: нужны свежие
      const otvet = await fetch(new Request(adres, { cache: sOtpechatkom ? 'default' : 'reload' }));
      if (!otvet.ok) throw new Error(adres + ': ' + otvet.status);
      await kesh.put(adres, otvet);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (sobytie) => {
  sobytie.waitUntil((async () => {
    for (const imya of await caches.keys()) {
      if (imya.startsWith('kurs-ii-') && imya !== KESH) await caches.delete(imya);
    }
    await self.clients.claim();
  })());
});

function etoVideo(zapros, adres) {
  return zapros.destination === 'video' || zapros.destination === 'audio' || zapros.headers.has('range')
    || /\.(mp4|m4v|webm|mov|mkv|avi|mp3|m4a|aac|ogg|oga|wav|flac)$/i.test(adres.pathname);
}

function mozhnoSohranit(otvet) {
  return otvet && otvet.ok && otvet.type === 'basic' && !otvet.redirected;
}

async function sohranit(klyuch, otvet) {
  const kesh = await caches.open(KESH);
  await kesh.put(klyuch, otvet);
}

function netSvyazi() {
  return new Response(
    '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Нет связи — ИИ в учебном процессе</title>'
    + '<body style="font:17px/1.5 system-ui,-apple-system,sans-serif;max-width:34em;margin:15vh auto;padding:0 16px">'
    + '<h1 style="font-size:28px">Нет связи</h1>'
    + '<p>Эта страница ещё не сохранена на устройстве. Страницы курса, которые вы уже открывали, работают и без связи.</p>'
    + '<p><a href="/">На главную</a></p></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

self.addEventListener('fetch', (sobytie) => {
  const zapros = sobytie.request;
  if (zapros.method !== 'GET') return;
  const adres = new URL(zapros.url);
  if (adres.origin !== self.location.origin) return;   // чужие сайты — мимо
  if (etoVideo(zapros, adres)) return;                  // видео не сохраняем
  if (adres.pathname === '/sw.js') return;

  if (zapros.mode === 'navigate') {
    // страница: сразу из сохранённого, свежая — в фоне
    const klyuch = adres.origin + adres.pathname;
    const svezhaya = fetch(zapros).then((otvet) => {
      if (mozhnoSohranit(otvet)) return sohranit(klyuch, otvet.clone()).then(() => otvet);
      return otvet;
    });
    sobytie.waitUntil(svezhaya.catch(() => {}));
    sobytie.respondWith((async () => {
      const est = await caches.match(klyuch, { ignoreSearch: true });
      if (est) return est;
      try { return await svezhaya; } catch (e) { return netSvyazi(); }
    })());
    return;
  }

  if (adres.searchParams.has('v')) {
    // адрес с отпечатком содержимого не меняется: из сохранённого без сети
    sobytie.respondWith((async () => {
      const est = await caches.match(zapros);
      if (est) return est;
      const otvet = await fetch(zapros);
      if (mozhnoSohranit(otvet)) sobytie.waitUntil(sohranit(zapros, otvet.clone()));
      return otvet;
    })());
    return;
  }

  // остальное своё без отпечатка (скрипт конструктора, manifest): из сохранённого, обновить в фоне
  const svezhij = fetch(zapros).then((otvet) => {
    if (mozhnoSohranit(otvet)) return sohranit(zapros, otvet.clone()).then(() => otvet);
    return otvet;
  });
  sobytie.waitUntil(svezhij.catch(() => {}));
  sobytie.respondWith((async () => (await caches.match(zapros)) || svezhij)());
});
