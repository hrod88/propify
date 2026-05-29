'use client'

/**
 * context/edificio-context.tsx — Fase 29 (Multi-edificio real)
 *
 * - Para super_admin / administrador: carga lista de todos los edificios activos
 *   y permite cambiar el edificio activo.
 * - La selección se persiste en la cookie `propify_edificio_activo` (leída por
 *   el Server Component getEdificioActual() en lib/auth-helpers.ts).
 * - Cambiar edificio recarga la página para que los Server Components refresquen.
 */

import {
  createContext, useContext,
  useState, useEffect, useCallback,
} from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRol }          from '@/context/rol-context'
import type { Edificio }   from '@/types'

// ─── Tipos ────────────────────────────────────────────────────
interface EdificioCtx {
  /** Lista de edificios disponibles (solo admins). Vacía para residentes. */
  edificios:       Edificio[]
  /** ID del edificio actualmente activo. */
  edificioActivo:  string
  /** Nombre del edificio activo (para mostrarlo en la UI). */
  nombreActivo:    string
  /** Cambia el edificio activo y recarga. */
  cambiarEdificio: (id: string) => void
  /** True mientras carga la lista de edificios. */
  cargando:        boolean
}

const EdificioContext = createContext<EdificioCtx | null>(null)

// ─── Helper: leer cookie ──────────────────────────────────────
function getCookieEdificio(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find(r => r.startsWith('propify_edificio_activo='))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

// ─── Helper: escribir cookie ──────────────────────────────────
function setCookieEdificio(id: string) {
  // 7 días, path raíz, SameSite Lax (leída por next/headers en el server)
  document.cookie = `propify_edificio_activo=${encodeURIComponent(id)}; path=/; max-age=604800; SameSite=Lax`
}

// ─── Provider ─────────────────────────────────────────────────
export function EdificioProvider({ children }: { children: React.ReactNode }) {
  const { rol, usuario } = useRol()

  const esAdmin = rol === 'super_admin' || rol === 'administrador'

  const [edificios,      setEdificios]      = useState<Edificio[]>([])
  const [edificioActivo, setEdificioActivo] = useState<string>('')
  const [cargando,       setCargando]       = useState(true)

  // ── Carga inicial ─────────────────────────────────────────
  useEffect(() => {
    async function cargar() {
      setCargando(true)

      let lista: Edificio[] = []

      if (esAdmin) {
        const { data } = await supabaseBrowser
          .from('edificios')
          .select('*')
          .eq('activo', true)
          .order('nombre')
        lista = (data ?? []) as Edificio[]
        setEdificios(lista)
      }

      // Prioridad: cookie > edificioId del usuario > primer edificio de la lista
      const cookieId  = getCookieEdificio()
      const usuarioId = usuario?.edificioId ?? ''

      let activo = cookieId ?? usuarioId

      if (esAdmin && lista.length > 0) {
        // Si el activo no existe en la lista, usar el primer edificio disponible
        const existe = lista.some(e => e.id === activo)
        if (!existe) activo = lista[0].id
      }

      setEdificioActivo(activo)
      setCargando(false)
    }

    cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdmin, usuario?.edificioId])

  // ── Cambiar edificio ──────────────────────────────────────
  const cambiarEdificio = useCallback((id: string) => {
    setEdificioActivo(id)
    setCookieEdificio(id)
    // Recarga para que Server Components lean el nuevo edificioId
    window.location.reload()
  }, [])

  // ── Nombre del edificio activo ────────────────────────────
  const nombreActivo =
    edificios.find(e => e.id === edificioActivo)?.nombre ?? 'Edificio activo'

  return (
    <EdificioContext.Provider value={{
      edificios,
      edificioActivo,
      nombreActivo,
      cambiarEdificio,
      cargando,
    }}>
      {children}
    </EdificioContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────
export function useEdificio() {
  const c = useContext(EdificioContext)
  if (!c) throw new Error('useEdificio debe usarse dentro de EdificioProvider')
  return c
}
