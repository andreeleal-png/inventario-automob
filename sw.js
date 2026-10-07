// Mantém a casca do app no celular para abrir rápido. O app em si vem do Google.
const CACHE = 'inventario-automob-v3';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // páginas sempre buscadas sem cache do navegador, para a versão nova chegar na hora
  const pedido = e.request.mode === 'navigate' ? new Request(e.request, { cache: 'no-store' }) : e.request;
  e.respondWith(fetch(pedido).then(r => {
    const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
