import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import SwRegister from '@/components/sw-register'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// ─── Metadata SEO + PWA ───────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default:  'Propify — Administración de Edificios',
    template: '%s | Propify',
  },
  description:
    'Plataforma integral para la administración de edificios y condominios. Gestión de gastos comunes, residentes, mantenciones y más.',
  keywords: ['administración', 'edificios', 'condominios', 'gastos comunes', 'propify'],
  authors: [{ name: 'Propify' }],
  creator: 'Propify',

  // ── PWA / Manifest ──────────────────────────────────────────
  manifest: '/manifest.webmanifest',

  // ── Icons ───────────────────────────────────────────────────
  icons: {
    icon:  '/icon.svg',
    apple: '/icon.svg',
  },

  // ── Apple Web App (iOS "Agregar a pantalla de inicio") ──────
  appleWebApp: {
    capable:         true,
    title:           'Propify',
    statusBarStyle:  'default',
  },
}

// ─── Viewport + theme color (debe ser export separado en Next 14+) ──
export const viewport: Viewport = {
  themeColor:     '#2563ae',
  width:          'device-width',
  initialScale:   1,
  minimumScale:   1,
  maximumScale:   5,
}

// ─── Layout ───────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-background antialiased" suppressHydrationWarning>
        {/* Service Worker — habilita instalación PWA en Chrome/Android/Edge */}
        <SwRegister />
        {children}
      </body>
    </html>
  )
}
