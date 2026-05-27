'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { UserRole, User, Unidad } from '@/types'
import { mockUsers, mockUnidades } from '@/lib/mock-data'

// ─── Demo: usuario representativo por cada rol ─────────────────
const USUARIO_ID_POR_ROL: Record<string, string> = {
  super_admin:   'u1',
  administrador: 'u1',   // Rodrigo Administrador
  conserje:      'u4',   // Juan Pérez
  propietario:   'u2',   // María José González — Depto 101
  arrendatario:  'u3',   // Carlos Muñoz       — Depto 301
}

// ─── Tipos ────────────────────────────────────────────────────
interface RolContextValue {
  rol:       UserRole
  usuario:   User | null
  unidad:    Unidad | null
  cargado:   boolean          // true después de leer localStorage
  setRol:    (r: UserRole) => void
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
  const [cargado, setCargado]   = useState(false)

  // Leer localStorage solo en cliente (después del primer render)
  useEffect(() => {
    const guardado = localStorage.getItem('propify_rol') as UserRole | null
    if (guardado) setRolEstado(guardado)
    setCargado(true)
  }, [])

  function setRol(r: UserRole) {
    setRolEstado(r)
    if (typeof window !== 'undefined') {
      localStorage.setItem('propify_rol', r)
    }
  }

  const userId  = USUARIO_ID_POR_ROL[rol] ?? 'u1'
  const usuario = mockUsers.find(u => u.id === userId) ?? null
  const unidad  = usuario?.unidadId
    ? mockUnidades.find(u => u.id === usuario.unidadId) ?? null
    : null

  return (
    <RolContext.Provider value={{ rol, usuario, unidad, cargado, setRol }}>
      {children}
    </RolContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────
export const useRol = () => useContext(RolContext)
