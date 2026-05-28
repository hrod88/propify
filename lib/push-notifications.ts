/**
 * lib/push-notifications.ts — Fase 28
 * Helpers para Browser Notification API + Service Worker showNotification.
 * No requiere VAPID keys — usa notificaciones locales del SW instalado.
 * Compatible con Chrome, Edge, Firefox (desktop) y Android Chrome.
 */

const STORAGE_KEY = 'propify_push_enabled'

/** Retorna true si el usuario activó push Y el navegador tiene permiso. */
export function isPushEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window))   return false
  return (
    localStorage.getItem(STORAGE_KEY) === 'true' &&
    Notification.permission === 'granted'
  )
}

/** Retorna el permiso actual del navegador (sin pedir). */
export function getPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window))   return 'unsupported'
  return Notification.permission
}

/**
 * Solicita permiso al navegador para mostrar notificaciones.
 * Retorna true si fue concedido.
 */
export async function requestPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window))   return false

  const perm = await Notification.requestPermission()
  const ok   = perm === 'granted'
  if (ok) localStorage.setItem(STORAGE_KEY, 'true')
  else    localStorage.removeItem(STORAGE_KEY)
  return ok
}

/** Deshabilita push localmente (no revoca el permiso del navegador). */
export function disablePush(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
}

/**
 * Muestra una notificación del sistema.
 * Preferencia: Service Worker → constructor Notification() básico.
 * Solo actúa si push está habilitado.
 */
export async function showBrowserNotification(
  titulo: string,
  cuerpo: string,
  url = '/dashboard',
): Promise<void> {
  if (!isPushEnabled()) return

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(titulo, {
        body:  cuerpo,
        icon:  '/icon.svg',
        badge: '/icon.svg',
        tag:   'propify-notif',
        data:  { url },
      })
      return
    }
  } catch {
    /* silencioso — cae al fallback */
  }

  // Fallback para navegadores sin SW completo
  if (Notification.permission === 'granted') {
    new Notification(titulo, { body: cuerpo, icon: '/icon.svg' })
  }
}
