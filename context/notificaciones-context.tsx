'use client'

/**
 * Fase 19 — Notificaciones persistentes en Supabase + Realtime
 *
 * Cambios respecto a la versión anterior:
 * - Se elimina el array INITIAL con datos hardcodeados.
 * - Las notificaciones se cargan desde la tabla `notificaciones` de Supabase.
 * - agregarNotificacion() persiste en Supabase (optimistic update local + INSERT).
 * - marcarLeida / marcarTodasLeidas / limpiarTodas sincronizan con Supabase.
 * - Supabase Realtime escucha INSERT / UPDATE / DELETE para actualizar en vivo
 *   cuando otro usuario (p. ej. el conserje) genera una notificación.
 */

import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef,
} from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useRol }          from '@/context/rol-context'

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
  tiempo:      string   // relativo, p. ej. "hace 5 min"
  leida:       boolean
  creadoEn:    string   // ISO string
}

interface NotificacionesCtx {
  notificaciones:      Notificacion[]
  noLeidas:            number
  cargando:            boolean
  agregarNotificacion: (tipo: TipoNotif, titulo: string, descripcion: string) => void
  marcarLeida:         (id: string) => void
  marcarTodasLeidas:   () => void
  limpiarTodas:        () => void
}

const NotificacionesContext = createContext<NotificacionesCtx | null>(null)

// ─── Helpers ──────────────────────────────────────────────────
function formatTiempo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)  return 'justo ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days > 1 ? 's' : ''}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToNotif(row: Record<string, any>): Notificacion {
  return {
    id:          String(row.id),
    tipo:        (row.tipo as TipoNotif) || 'solicitud',
    titulo:      String(row.titulo ?? ''),
    descripcion: String(row.descripcion ?? ''),
    tiempo:      formatTiempo(String(row.creadoEn ?? new Date().toISOString())),
    leida:       Boolean(row.leida),
    creadoEn:    String(row.creadoEn ?? new Date().toISOString()),
  }
}

// ─── Provider ─────────────────────────────────────────────────
export function NotificacionesProvider({ children }: { children: React.ReactNode }) {
  const { usuario, unidad, cargado } = useRol()

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [cargandoNotif,  setCargandoNotif]  = useState(true)

  // Ref para limpiar el canal de Realtime al desmontar / cambiar edificio
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null)

  // edificioId resuelto: unidad > usuario > fallback 'e1'
  const edificioId = unidad?.edificioId ?? usuario?.edificioId ?? 'e1'

  // ── 1. Carga inicial desde Supabase ──────────────────────────
  useEffect(() => {
    if (!cargado) return

    async function cargar() {
      setCargandoNotif(true)
      const { data, error } = await supabaseBrowser
        .from('notificaciones')
        .select('*')
        .eq('edificioId', edificioId)
        .order('creadoEn', { ascending: false })
        .limit(30)

      if (error) {
        // La tabla puede no existir aún en local dev — no es fatal
        console.warn('[Notificaciones] Error cargando:', error.message)
      }
      setNotificaciones((data ?? []).map(rowToNotif))
      setCargandoNotif(false)
    }

    cargar()
  }, [cargado, edificioId])

  // ── 2. Supabase Realtime ─────────────────────────────────────
  useEffect(() => {
    if (!cargado) return

    // Limpiar canal previo
    if (channelRef.current) {
      supabaseBrowser.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabaseBrowser
      .channel(`notif-${edificioId}`)

      // INSERT — nueva notificación de otro usuario / proceso
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        ({ new: row }) => {
          // Filtrar por edificio en cliente (fallback si el filtro server falla)
          if ((row as Record<string, unknown>).edificioId !== edificioId) return
          const nueva = rowToNotif(row as Record<string, unknown>)
          setNotificaciones(prev =>
            prev.some(n => n.id === nueva.id) ? prev : [nueva, ...prev],
          )
        },
      )

      // UPDATE — marcar leída desde otro dispositivo
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notificaciones' },
        ({ new: row }) => {
          const upd = rowToNotif(row as Record<string, unknown>)
          setNotificaciones(prev => prev.map(n => n.id === upd.id ? upd : n))
        },
      )

      // DELETE — limpiarTodas desde otro dispositivo
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notificaciones' },
        ({ old: row }) => {
          setNotificaciones(prev =>
            prev.filter(n => n.id !== (row as { id: string }).id),
          )
        },
      )

      .subscribe()

    channelRef.current = channel

    return () => {
      supabaseBrowser.removeChannel(channel)
      channelRef.current = null
    }
  }, [cargado, edificioId])

  // ── Derivados ────────────────────────────────────────────────
  const noLeidas = notificaciones.filter(n => !n.leida).length

  // ── Acciones ─────────────────────────────────────────────────

  /**
   * Agrega una notificación con optimistic update inmediato + INSERT a Supabase.
   * El canal Realtime ignorará el duplicado (mismo ID) si llega la confirmación.
   */
  const agregarNotificacion = useCallback((
    tipo:        TipoNotif,
    titulo:      string,
    descripcion: string,
  ): void => {
    const id  = crypto.randomUUID()
    const now = new Date().toISOString()

    // Optimistic: aparece al instante en la UI
    const nueva: Notificacion = {
      id, tipo, titulo, descripcion,
      tiempo: 'justo ahora', leida: false, creadoEn: now,
    }
    setNotificaciones(prev => [nueva, ...prev])

    // Persistir en Supabase (fire-and-forget)
    supabaseBrowser
      .from('notificaciones')
      .insert({ id, edificioId, tipo, titulo, descripcion, leida: false, creadoEn: now })
      .then(({ error }) => {
        if (error) console.warn('[Notificaciones] Error guardando:', error.message)
      })
  }, [edificioId])

  /** Marca una notificación como leída (optimistic + UPDATE Supabase). */
  const marcarLeida = useCallback((id: string): void => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    supabaseBrowser
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('[Notificaciones] Error marcando leída:', error.message)
      })
  }, [])

  /** Marca todas como leídas (optimistic + UPDATE Supabase). */
  const marcarTodasLeidas = useCallback((): void => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    supabaseBrowser
      .from('notificaciones')
      .update({ leida: true })
      .eq('edificioId', edificioId)
      .eq('leida', false)
      .then(({ error }) => {
        if (error) console.warn('[Notificaciones] Error marcando todas:', error.message)
      })
  }, [edificioId])

  /** Elimina todas las notificaciones del edificio (local + Supabase). */
  const limpiarTodas = useCallback((): void => {
    setNotificaciones([])
    supabaseBrowser
      .from('notificaciones')
      .delete()
      .eq('edificioId', edificioId)
      .then(({ error }) => {
        if (error) console.warn('[Notificaciones] Error limpiando:', error.message)
      })
  }, [edificioId])

  return (
    <NotificacionesContext.Provider value={{
      notificaciones,
      noLeidas,
      cargando: cargandoNotif,
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
