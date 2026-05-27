'use client'

import { createContext, useContext, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────
export type TipoNotif =
  | 'paquete'
  | 'visita'
  | 'solicitud'
  | 'circular'
  | 'mora'
  | 'pago'
  | 'residente'

export interface Notificacion {
  id:          string
  tipo:        TipoNotif
  titulo:      string
  descripcion: string
  tiempo:      string
  leida:       boolean
}

// ─── Context interface ────────────────────────────────────────
interface NotificacionesCtx {
  notificaciones:      Notificacion[]
  noLeidas:            number
  agregarNotificacion: (tipo: TipoNotif, titulo: string, descripcion: string) => void
  marcarLeida:         (id: string) => void
  marcarTodasLeidas:   () => void
  limpiarTodas:        () => void
}

const NotificacionesContext = createContext<NotificacionesCtx | null>(null)

// ─── Initial data ─────────────────────────────────────────────
const INITIAL: Notificacion[] = [
  {
    id:          'n1',
    tipo:        'pago',
    titulo:      'Pago recibido',
    descripcion: 'Depto 501 pagó gastos de mayo',
    tiempo:      'hace 12 min',
    leida:       false,
  },
  {
    id:          'n2',
    tipo:        'solicitud',
    titulo:      'Solicitud urgente',
    descripcion: 'Puerta ascensor no cierra bien',
    tiempo:      'hace 35 min',
    leida:       false,
  },
  {
    id:          'n3',
    tipo:        'paquete',
    titulo:      'Nuevo paquete',
    descripcion: 'Chilexpress para Depto 101',
    tiempo:      'hace 1 hora',
    leida:       false,
  },
  {
    id:          'n4',
    tipo:        'mora',
    titulo:      'Alerta morosidad',
    descripcion: 'Depto 102 — 16 días de mora',
    tiempo:      'hace 5 horas',
    leida:       true,
  },
  {
    id:          'n5',
    tipo:        'circular',
    titulo:      'Circular enviada',
    descripcion: 'Corte de agua programado 28/05',
    tiempo:      'hace 2 horas',
    leida:       true,
  },
]

// ─── Provider ─────────────────────────────────────────────────
export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(INITIAL)

  const noLeidas = notificaciones.filter(n => !n.leida).length

  const agregarNotificacion = useCallback((
    tipo:        TipoNotif,
    titulo:      string,
    descripcion: string,
  ) => {
    const nueva: Notificacion = {
      id:          `notif-${Date.now()}`,
      tipo,
      titulo,
      descripcion,
      tiempo:      'justo ahora',
      leida:       false,
    }
    setNotificaciones(prev => [nueva, ...prev])
  }, [])

  const marcarLeida = useCallback((id: string) => {
    setNotificaciones(prev =>
      prev.map(n => n.id === id ? { ...n, leida: true } : n)
    )
  }, [])

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }, [])

  const limpiarTodas = useCallback(() => {
    setNotificaciones([])
  }, [])

  return (
    <NotificacionesContext.Provider value={{
      notificaciones,
      noLeidas,
      agregarNotificacion,
      marcarLeida,
      marcarTodasLeidas,
      limpiarTodas,
    }}>
      {children}
    </NotificacionesContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────
export function useNotificaciones() {
  const c = useContext(NotificacionesContext)
  if (!c) throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider')
  return c
}
