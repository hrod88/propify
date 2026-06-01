'use client'

/**
 * Fase 19 — Header actualizado
 * - Usuario real desde useRol() (nombre, email, iniciales, rol)
 * - Búsqueda global usa datos reales de Supabase (usuarios, unidades, solicitudes)
 *   Se carga una sola vez cuando el contexto de rol está listo (cargado === true).
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell, Search, ChevronDown, Settings, LogOut,
  User, HelpCircle, Home, Wrench, Users, Trash2,
  Eye, RotateCcw,
} from 'lucide-react'
import type { User as UserType, Unidad, SolicitudMantencion } from '@/types'
import { useNotificaciones } from '@/context/notificaciones-context'
import { supabaseBrowser }   from '@/lib/supabase-browser'
import { useRol }            from '@/context/rol-context'

// ─── Colores por tipo de notificación ────────────────────────
const tipoColores = {
  pago:      { bg: '#dcfce7', text: '#16a34a', emoji: '💰' },
  solicitud: { bg: '#fef3c7', text: '#d97706', emoji: '🔧' },
  circular:  { bg: '#dbeafe', text: '#2563eb', emoji: '📢' },
  mora:      { bg: '#fee2e2', text: '#dc2626', emoji: '⚠️' },
  paquete:   { bg: '#f3e8ff', text: '#9333ea', emoji: '📦' },
  visita:    { bg: '#e0f2fe', text: '#0284c7', emoji: '🚶' },
  residente: { bg: '#f0fdf4', text: '#16a34a', emoji: '👤' },
}

// ─── Etiquetas de rol ─────────────────────────────────────────
const ROL_LABELS: Record<string, string> = {
  super_admin:   'Super Admin',
  administrador: 'Administrador',
  conserje:      'Conserje',
  propietario:   'Propietario',
  arrendatario:  'Arrendatario',
}

// ─── Helpers ──────────────────────────────────────────────────
function getInitials(nombre = '', apellido = ''): string {
  const n = nombre.trim()[0]?.toUpperCase() ?? ''
  const a = apellido.trim()[0]?.toUpperCase() ?? ''
  return n + a || '??'
}

// ─── Tipos para búsqueda ──────────────────────────────────────
interface SearchResult {
  id:        string
  tipo:      'residente' | 'unidad' | 'solicitud'
  titulo:    string
  subtitulo: string
  href:      string
}

// ─── Componente ───────────────────────────────────────────────
export default function Header() {
  const router = useRouter()

  // Contextos
  const { rol, usuario, unidad, cargado } = useRol()
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, limpiarTodas } =
    useNotificaciones()

  // UI state
  const [showNotif,    setShowNotif]    = useState(false)
  const [showUser,     setShowUser]     = useState(false)
  const [searchValue,  setSearchValue]  = useState('')
  const [searchFocus,  setSearchFocus]  = useState(false)
  const [isPreview,    setIsPreview]    = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Detectar modo preview desde localStorage
  useEffect(() => {
    setIsPreview(localStorage.getItem('propify_preview') === 'true')
  }, [])

  // Simular rol (solo localStorage — no requiere usuario en contexto)
  function simularRol(nuevoRol: string) {
    const esResidente = nuevoRol === 'propietario' || nuevoRol === 'arrendatario'
    localStorage.setItem('propify_preview',       'true')
    localStorage.setItem('propify_rol',            nuevoRol)
    if (esResidente) {
      localStorage.setItem('propify_preview_unidad', 'un-0804')
    } else {
      localStorage.removeItem('propify_preview_unidad')
    }
    window.location.reload()
  }

  // Volver al rol de administrador
  function volverAlAdmin() {
    localStorage.setItem('propify_rol', 'administrador')
    localStorage.removeItem('propify_preview')
    localStorage.removeItem('propify_preview_unidad')
    window.location.reload()
  }

  // Datos para búsqueda — cargados desde Supabase una vez al montar
  const [searchUsuarios,    setSearchUsuarios]    = useState<UserType[]>([])
  const [searchUnidades,    setSearchUnidades]    = useState<Unidad[]>([])
  const [searchSolicitudes, setSearchSolicitudes] = useState<SolicitudMantencion[]>([])

  // ── Datos del usuario actual ──────────────────────────────────
  const displayName     = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Cargando...'
  const displayEmail    = usuario?.email ?? ''
  const displayInitials = getInitials(usuario?.nombre, usuario?.apellido)
  const displayRol      = ROL_LABELS[rol] ?? 'Usuario'

  // ── Logout ────────────────────────────────────────────────────
  async function handleLogout() {
    await supabaseBrowser.auth.signOut()
    localStorage.removeItem('propify_rol')
    router.push('/login')
  }

  // ── Cargar datos de búsqueda desde Supabase ──────────────────
  useEffect(() => {
    if (!cargado) return
    const eid = usuario?.edificioId ?? unidad?.edificioId ?? 'e1'

    Promise.all([
      supabaseBrowser
        .from('usuarios')
        .select('id,nombre,apellido,email,rol,unidadId,edificioId,activo,telefono,creadoEn')
        .eq('edificioId', eid),
      supabaseBrowser
        .from('unidades')
        .select('id,numero,piso,tipo,estado,edificioId,superficieM2,habitaciones,banos,propietarioId,arrendatarioId,gastosComunesMonto')
        .eq('edificioId', eid),
      supabaseBrowser
        .from('solicitudes')
        .select('id,titulo,categoria,descripcion,prioridad,estado,unidadId,edificioId,solicitanteId,actualizadoEn,creadoEn')
        .eq('edificioId', eid)
        .order('creadoEn', { ascending: false })
        .limit(50),
    ]).then(([u, un, s]) => {
      setSearchUsuarios((u.data    ?? []) as UserType[])
      setSearchUnidades((un.data   ?? []) as Unidad[])
      setSearchSolicitudes((s.data ?? []) as SolicitudMantencion[])
    })
  }, [cargado, usuario?.edificioId, unidad?.edificioId])

  // ── Búsqueda global (filtro client-side sobre datos Supabase) ─
  const resultados = useMemo((): SearchResult[] => {
    const q = searchValue.toLowerCase().trim()
    if (q.length < 2) return []

    const res: SearchResult[] = []

    // Residentes (propietarios y arrendatarios)
    searchUsuarios
      .filter(u => u.rol === 'propietario' || u.rol === 'arrendatario')
      .filter(u =>
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
      )
      .slice(0, 3)
      .forEach(u => {
        const unid = u.unidadId
          ? searchUnidades.find(un => un.id === u.unidadId)
          : undefined
        res.push({
          id:        u.id,
          tipo:      'residente',
          titulo:    `${u.nombre} ${u.apellido}`,
          subtitulo: `${u.rol === 'propietario' ? 'Propietario' : 'Arrendatario'}${unid ? ` · Unidad ${unid.numero}` : ''} · ${u.email}`,
          href:      `/residentes/${u.id}`,
        })
      })

    // Unidades
    searchUnidades
      .filter(u =>
        u.numero.toLowerCase().includes(q) ||
        u.tipo.toLowerCase().includes(q),
      )
      .slice(0, 3)
      .forEach(u => {
        res.push({
          id:        u.id,
          tipo:      'unidad',
          titulo:    `Unidad ${u.numero}`,
          subtitulo: `${u.tipo.replace(/_/g, ' ')} · Piso ${u.piso > 0 ? u.piso : 'PB'} · ${u.estado.replace(/_/g, ' ')}`,
          href:      `/unidades/${u.id}`,
        })
      })

    // Solicitudes de mantención
    searchSolicitudes
      .filter(s =>
        s.titulo.toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q),
      )
      .slice(0, 3)
      .forEach(s => {
        res.push({
          id:        s.id,
          tipo:      'solicitud',
          titulo:    s.titulo,
          subtitulo: `${s.categoria} · ${s.prioridad} · ${s.estado.replace(/_/g, ' ')}`,
          href:      '/mantenciones',
        })
      })

    return res.slice(0, 8)
  }, [searchValue, searchUsuarios, searchUnidades, searchSolicitudes])

  const showResults = searchFocus && searchValue.length >= 2

  // Cerrar búsqueda al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocus(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const tipoIcon = {
    residente: Users,
    unidad:    Home,
    solicitud: Wrench,
  }

  const tipoLabel = {
    residente: 'Residente',
    unidad:    'Unidad',
    solicitud: 'Solicitud',
  }

  const tipoBadgeStyle = {
    residente: { bg: '#dbeafe', color: '#2563ae' },
    unidad:    { bg: '#dcfce7', color: '#16a34a' },
    solicitud: { bg: '#fef3c7', color: '#d97706' },
  }

  // Estilos reutilizables dark mode
  const PANEL_DARK = {
    background:  '#0f172a',
    border:      '1px solid rgba(51,65,85,0.8)',
    borderColor: 'rgba(51,65,85,0.8)',
  }
  const DIVIDER_DARK = { borderColor: 'rgba(51,65,85,0.6)' }
  const ROW_HOVER    = 'rgba(255,255,255,0.05)'

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ background: '#0a0f1a', borderColor: 'rgba(51,65,85,0.8)', height: 64 }}
    >

      {/* ── Búsqueda global ─────────────────────────────────── */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#475569' }} />
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onKeyDown={e => {
              if (e.key === 'Escape') { setSearchFocus(false); setSearchValue('') }
            }}
            placeholder="Buscar residente, unidad, solicitud..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none transition-all"
            style={{
              borderColor: searchFocus ? '#3b82f6' : 'rgba(51,65,85,0.8)',
              background:  'rgba(30,41,59,0.8)',
              color:       '#f1f5f9',
              boxShadow:   searchFocus ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
            }}
            suppressHydrationWarning
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(''); setSearchFocus(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: '#64748b' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {showResults && (
          <div
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{ ...PANEL_DARK, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
          >
            {resultados.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm" style={{ color: '#94a3b8' }}>Sin resultados para «{searchValue}»</p>
                <p className="text-xs mt-1" style={{ color: '#475569' }}>Intenta con otro nombre, número o categoría</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b" style={DIVIDER_DARK}>
                  <p className="text-xs font-medium" style={{ color: '#64748b' }}>
                    {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} para «{searchValue}»
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {resultados.map(r => {
                    const Icon  = tipoIcon[r.tipo]
                    const badge = tipoBadgeStyle[r.tipo]
                    return (
                      <Link
                        key={r.id + r.tipo}
                        href={r.href}
                        onClick={() => { setSearchFocus(false); setSearchValue('') }}
                        className="flex items-center gap-3 px-4 py-3 transition-colors border-b"
                        style={{ borderColor: 'rgba(51,65,85,0.4)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = ROW_HOVER)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                          style={{ background: `${badge.color}20` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: badge.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>{r.titulo}</p>
                          <p className="text-xs truncate capitalize mt-0.5" style={{ color: '#64748b' }}>{r.subtitulo}</p>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                          style={{ background: `${badge.color}20`, color: badge.color }}
                        >
                          {tipoLabel[r.tipo]}
                        </span>
                      </Link>
                    )
                  })}
                </div>
                <div className="px-4 py-2 border-t text-center" style={DIVIDER_DARK}>
                  <p className="text-xs" style={{ color: '#475569' }}>
                    Presiona{' '}
                    <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>ESC</kbd>
                    {' '}para cerrar
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Acciones ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 ml-4 relative">

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowUser(false); setSearchFocus(false) }}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
            style={{ background: showNotif ? 'rgba(255,255,255,0.08)' : 'transparent' }}
            onMouseEnter={e => { if (!showNotif) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { if (!showNotif) e.currentTarget.style.background = 'transparent' }}
          >
            <Bell className="w-5 h-5" style={{ color: '#94a3b8' }} />
            {noLeidas > 0 && (
              <span
                className="absolute top-1 right-1 flex items-center justify-center text-white text-[10px] font-bold rounded-full"
                style={{ background: '#ef4444', minWidth: 16, height: 16, padding: '0 3px' }}
              >
                {noLeidas}
              </span>
            )}
          </button>

          {showNotif && (
            <div
              className="absolute right-0 top-12 w-96 rounded-2xl z-50 overflow-hidden"
              style={{ ...PANEL_DARK, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={DIVIDER_DARK}>
                <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Notificaciones</h3>
                {noLeidas > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ background: '#2563ae' }}>
                    {noLeidas} nuevas
                  </span>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: '#334155' }} />
                    <p className="text-sm" style={{ color: '#64748b' }}>Sin notificaciones</p>
                  </div>
                ) : (
                  notificaciones.map(n => {
                    const c = tipoColores[n.tipo as keyof typeof tipoColores] ?? tipoColores.solicitud
                    return (
                      <div
                        key={n.id}
                        onClick={() => marcarLeida(n.id)}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
                        style={{
                          borderColor: 'rgba(51,65,85,0.4)',
                          background: n.leida ? 'transparent' : 'rgba(37,99,174,0.08)',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = ROW_HOVER)}
                        onMouseLeave={e => (e.currentTarget.style.background = n.leida ? 'transparent' : 'rgba(37,99,174,0.08)')}
                      >
                        <span className="flex items-center justify-center w-9 h-9 rounded-xl text-lg shrink-0" style={{ background: `${c.text}18` }}>
                          {c.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>{n.titulo}</p>
                            {!n.leida && <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: '#3b82f6' }} />}
                          </div>
                          <p className="text-xs truncate mt-0.5" style={{ color: '#94a3b8' }}>{n.descripcion}</p>
                          <p className="text-xs mt-1" style={{ color: '#475569' }}>{n.tiempo}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="px-4 py-3 border-t flex items-center justify-between" style={DIVIDER_DARK}>
                <button onClick={marcarTodasLeidas} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#60a5fa' }}>
                  Marcar todas como leídas
                </button>
                <button onClick={limpiarTodas} className="flex items-center gap-1 text-xs transition-colors hover:opacity-70" style={{ color: '#64748b' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ayuda */}
        <button
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <HelpCircle className="w-5 h-5" style={{ color: '#94a3b8' }} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: 'rgba(51,65,85,0.8)' }} />

        {/* Usuario */}
        <div className="relative">
          <button
            onClick={() => { setShowUser(!showUser); setShowNotif(false); setSearchFocus(false) }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
            style={{ background: showUser ? 'rgba(255,255,255,0.08)' : 'transparent' }}
            onMouseEnter={e => { if (!showUser) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { if (!showUser) e.currentTarget.style.background = 'transparent' }}
          >
            <div
              className="flex items-center justify-center rounded-full text-white text-sm font-bold shrink-0"
              style={{ width: 32, height: 32, background: '#1e3a5f' }}
            >
              {displayInitials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold leading-none" style={{ color: '#f1f5f9' }}>{displayName}</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{displayRol}</p>
            </div>
            <ChevronDown className="w-4 h-4 hidden sm:block" style={{ color: '#64748b' }} />
          </button>

          {showUser && (
            <div
              className="absolute right-0 top-12 w-56 rounded-2xl z-50 overflow-hidden"
              style={{ ...PANEL_DARK, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            >
              <div className="px-4 py-3 border-b" style={DIVIDER_DARK}>
                <p className="font-semibold truncate" style={{ color: '#f1f5f9' }}>{displayName}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>{displayEmail}</p>
              </div>

              <div className="py-1">
                {[
                  { icon: User,       label: 'Mi perfil',       href: usuario ? `/residentes/${usuario.id}` : '/residentes' },
                  { icon: Settings,   label: 'Configuración',   href: '/configuracion' },
                  { icon: HelpCircle, label: 'Ayuda y soporte', href: '#' },
                ].map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setShowUser(false)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
                    style={{ color: '#cbd5e1' }}
                    onMouseEnter={e => (e.currentTarget.style.background = ROW_HOVER)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <item.icon className="w-4 h-4" style={{ color: '#64748b' }} />
                    {item.label}
                  </Link>
                ))}
              </div>

              {(rol === 'administrador' || rol === 'super_admin') && (
                <div className="py-1 border-t" style={DIVIDER_DARK}>
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
                    Vista previa como…
                  </p>
                  {(['propietario', 'arrendatario', 'conserje'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => { simularRol(r); setShowUser(false) }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
                      style={{ color: '#cbd5e1' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Eye className="w-4 h-4" style={{ color: '#818cf8' }} />
                      {ROL_LABELS[r]}
                    </button>
                  ))}
                </div>
              )}

              <div className="py-1 border-t" style={DIVIDER_DARK}>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
                  style={{ color: '#f87171' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banner flotante — vista previa de rol */}
      {isPreview && rol !== 'administrador' && rol !== 'super_admin' && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
          style={{ background: '#0f172a', color: 'white', border: '1px solid rgba(99,102,241,0.4)' }}
        >
          <Eye className="w-4 h-4 shrink-0" style={{ color: '#818cf8' }} />
          <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
            Vista previa: <span style={{ color: '#818cf8' }}>{ROL_LABELS[rol] ?? rol}</span>
          </span>
          <button
            onClick={volverAlAdmin}
            className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
            style={{ background: '#2563ae' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Volver al Admin
          </button>
        </div>
      )}

      {/* Overlay */}
      {(showNotif || showUser) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotif(false); setShowUser(false) }} />
      )}
    </header>
  )
}

