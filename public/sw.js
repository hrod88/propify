/**
 * Propify Service Worker — Fase 28 (Push Notifications)
 * Fase 22: network-first para assets estáticos.
 * Fase 28: push event + notificationclick handlers.
 */
const CACHE_NAME = 'propify-v2'

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
// ── Push Notifications ──────────────────────────────────────────
self.addEventListener('push', event => {
  const data    = event.data?.json?.() ?? {}
  const title   = data.title ?? 'Propify'
  const options = {
    body:  data.body ?? '',
    icon:  '/icon.svg',
    badge: '/icon.svg',
    tag:   data.tag  ?? 'propify-notif',
    data:  { url: data.url ?? '/dashboard' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        const existing = clients.find(c => 'focus' in c)
        if (existing) return existing.focus()
        return self.clients.openWindow(url)
      }),
  )
})

// ── Fetch (network-first) ───────────────────────────────────────
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
