import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Propify — Administración de Edificios',
    template: '%s | Propify',
  },
  description:
    'Plataforma integral para la administración de edificios y condominios. Gestión de gastos comunes, residentes, mantenciones y más.',
  keywords: ['administración', 'edificios', 'condominios', 'gastos comunes', 'propify'],
  authors: [{ name: 'Propify' }],
  creator: 'Propify',
}

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
        {children}
      </body>
    </html>
  )
}
