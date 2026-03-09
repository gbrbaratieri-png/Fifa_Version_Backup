const CACHE_NAME = 'mundial-pwa-v1';

// Arquivos essenciais para funcionar offline
const FILES_TO_CACHE = [
  '/',
  '/index.html',
];

// Instala e faz cache dos arquivos principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Limpa caches antigos ao ativar nova versão
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Serve do cache quando offline, busca da rede quando online
self.addEventListener('fetch', event => {
  // Ignora requisições de extensões do navegador
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Só faz cache de requisições GET bem-sucedidas
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Se falhar e for navegação, retorna o index.html do cache
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
