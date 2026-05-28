'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { UserRole, User, Unidad } from '@/types'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { supabase }         from '@/lib/supabase'

// ─── Tipos ────────────────────────────────────────────────────
interface RolContextValue {
  rol:     UserRole
  usuario: User | null
  unidad:  Unidad | null
  cargado: boolean          // true después de resolver la sesión
  setRol:  (r: UserRole) => void
}

// ─── Contexto ─────────────────────────────────────────────────
const RolContext = createContext<RolContextValue>({
  rol:     'administrador',
  usuario: null,
  unidad:  null,
  cargado: false,
  setRol:  () => {},
})

// ─── Provider ─────────────────────────────────────────────────
export function RolProvider({ children }: { children: React.ReactNode }) {
  const [rol,     setRolEstado] = useState<UserRole>('administrador')
  const [usuario, setUsuario]   = useState<User | null>(null)
  const [unidad,  setUnidad]    = useState<Unidad | null>(null)
  const [cargado, setCargado]   = useState(false)

  useEffect(() => {
    async function cargarSesion() {
      // 1. Verificar si hay sesión activa en Supabase Auth
      const { data: { user } } = await supabaseBrowser.auth.getUser()

      if (user?.email) {
        // 2. Obtener datos del usuario real desde la BD
        const { data: dbUser } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', user.email)
          .single()

        if (dbUser) {
          const rolDB = dbUser.rol as UserRole
          setRolEstado(rolDB)
          localStorage.setItem('propify_rol', rolDB)
          setUsuario(dbUser as User)

          // 3. Cargar su unidad si tiene una asignada
          if (dbUser.unidadId) {
            const { data: unidadDB } = await supabase
              .from('unidades')
              .select('*')
              .eq('id', dbUser.unidadId)
              .single()
            if (unidadDB) setUnidad(unidadDB as Unidad)
          }
        } else {
          // Usuario en Supabase Auth pero sin registro en usuarios → usar localStorage
          const guardado = localStorage.getItem('propify_rol') as UserRole | null
          if (guardado) setRolEstado(guardado)

          // Si hay unidad de preview, cargarla
          const previewUnidadId = localStorage.getItem('propify_preview_unidad')
          if (previewUnidadId) {
            const { data: unidadPreview } = await supabase
              .from('unidades').select('*').eq('id', previewUnidadId).single()
            if (unidadPreview) setUnidad(unidadPreview as Unidad)
          }
        }
      } else {
        // Sin sesión activa → usar localStorage como fallback
        const guardado = localStorage.getItem('propify_rol') as UserRole | null
        if (guardado) setRolEstado(guardado)

        // Si hay unidad de preview, cargarla
        const previewUnidadId = localStorage.getItem('propify_preview_unidad')
        if (previewUnidadId) {
          const { data: unidadPreview } = await supabase
            .from('unidades').select('*').eq('id', previewUnidadId).single()
          if (unidadPreview) setUnidad(unidadPreview as Unidad)
        }
      }

      setCargado(true)
    }

    cargarSesion()
  }, [])

  function setRol(r: UserRole) {
    setRolEstado(r)
    if (typeof window !== 'undefined') {
      localStorage.setItem('propify_rol', r)
    }
  }

  return (
    <RolContext.Provider value={{ rol, usuario, unidad, cargado, setRol }}>
      {children}
    </RolContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────
export const useRol = () => useContext(RolContext)
