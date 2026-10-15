// Service worker do aplicativo SETIC (PWA).
// - A página do sistema é SEMPRE buscada no servidor (versão mais nova); sem internet, mostra offline.html.
// - Só ícones e a tela "sem conexão" ficam guardados no aparelho.
// - Firebase, Worker do assistente e bibliotecas externas NÃO passam por aqui (vão direto à internet).
const VERSAO = 'setic-pwa-2026.10.01-9';
const ARQUIVOS = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png', '/icons/favicon-32.png', '/manifest.webmanifest'];

self.addEventListener('install', evento => {
  evento.waitUntil(caches.open(VERSAO).then(cache => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n.startsWith('setic-pwa-') && n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evento => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (pedido.mode === 'navigate') {
    // Sempre a versão mais nova do servidor (evita página antiga presa no cache).
    evento.respondWith(
      fetch(pedido.url, { cache: 'no-cache', credentials: 'same-origin' })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }
  if (url.origin === self.location.origin && ARQUIVOS.includes(url.pathname)) {
    evento.respondWith(caches.match(pedido).then(guardado => guardado || fetch(pedido)));
  }
  // Demais pedidos seguem normalmente pela internet.
});
