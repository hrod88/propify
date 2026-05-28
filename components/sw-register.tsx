'use client'

/**
 * SwRegister — Fase 22 (PWA)
 * Registra el service worker en el cliente una sola vez al montar.
 * Componente vacío (no renderiza nada visible).
 */
import { useEffect } from 'react'

export default function SwRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.log('[SW] Registrado:', reg.scope)
      })
      .catch(err => {
        console.warn('[SW] Error al registrar:', err)
      })
  }, [])

  return null
}
