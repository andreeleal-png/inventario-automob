// Guarda o app no celular para abrir rápido e funcionar sem sinal. A planilha continua no Google.
const CACHE = 'inventario-automob-v12';
const FONTES = 'inventario-fontes'; // fonte da marca d'água (Barlow), guardada para funcionar sem sinal
const ARQUIVOS = ['./', './index.html', './instalar.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './splash-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTES).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // usa a cópia guardada e atualiza por trás quando tiver internet
    e.respondWith(caches.open(FONTES).then(c => c.match(e.request).then(guardada => {
      const nova = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; });
      if (guardada) { nova.catch(() => {}); return guardada; }
      return nova;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  // páginas sempre buscadas sem cache do navegador, para a versão nova chegar na hora
  const busca = e.request.mode === 'navigate' ? fetch(e.request.url, { cache: 'no-store' }) : fetch(e.request);
  e.respondWith(busca.then(r => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
