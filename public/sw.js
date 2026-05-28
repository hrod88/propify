/**
 * Propify Service Worker — Fase 22 (PWA)
 * Estrategia: network-first para todo.
 * El SW mínimo es suficiente para habilitar el install prompt del navegador.
 * No cacheamos rutas dinámicas (Supabase, Next.js SSR) para evitar stale data.
 */
const CACHE_NAME = 'propify-v1'

self.addEventListener('install', () => {
  // Activa inmediatamente sin esperar que tabs anteriores se cierren
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  // Limpia caches de versiones anteriores
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  )
})

/**
 * Network-first: siempre intenta la red.
 * Si falla (offline) y hay algo en cache, lo usa.
 * Si no hay cache, devuelve la respuesta de error de red.
 */
self.addEventListener('fetch', event => {
  // Ignorar requests non-GET y extensiones de chrome
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith('http')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Solo cachear responses exitosas de la misma origen (no Supabase)
        const url = new URL(event.request.url)
        if (
          response.ok &&
          url.origin === self.location.origin &&
          (event.request.destination === 'document' ||
           event.request.destination === 'style' ||
           event.request.destination === 'script' ||
           event.request.destination === 'image')
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached
          // Fallback para navegación offline
          if (event.request.destination === 'document') {
            return caches.match('/login')
          }
          return new Response('Offline', { status: 503 })
        }),
      ),
  )
})
