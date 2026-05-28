import type { MetadataRoute } from 'next'

/**
 * Fase 22 — PWA Manifest
 * Next.js genera automáticamente /manifest.webmanifest con este archivo.
 * El ícono SVG con sizes="any" es suficiente para el install prompt en Chrome/Android.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'Propify — Administración de Edificios',
    short_name:       'Propify',
    description:      'Gestión inteligente de edificios y condominios',
    start_url:        '/dashboard',
    display:          'standalone',
    background_color: '#ffffff',
    theme_color:      '#2563ae',
    orientation:      'portrait-primary',
    categories:       ['business', 'utilities'],
    icons: [
      {
        src:     '/icon.svg',
        sizes:   'any',
        type:    'image/svg+xml',
        purpose: 'any',
      },
      {
        src:     '/icon.svg',
        sizes:   'any',
        type:    'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
  }
}
