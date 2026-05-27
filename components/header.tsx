'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Bell, Search, ChevronDown, Settings, LogOut,
  User, HelpCircle, Home, Wrench, Users, Trash2,
} from 'lucide-react'
import { mockUsers, mockUnidades, mockSolicitudes } from '@/lib/mock-data'
import { useNotificaciones } from '@/context/notificaciones-context'

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

// ─── Tipos para búsqueda ──────────────────────────────────────
interface SearchResult {
  id: string
  tipo: 'residente' | 'unidad' | 'solicitud'
  titulo: string
  subtitulo: string
  href: string
}

// ─── Componente ───────────────────────────────────────────────
export default function Header() {
  const [showNotif,   setShowNotif]   = useState(false)
  const [showUser,    setShowUser]    = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchFocus, setSearchFocus] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, limpiarTodas } = useNotificaciones()

  // ── Búsqueda global ──
  const resultados = useMemo((): SearchResult[] => {
    const q = searchValue.toLowerCase().trim()
    if (q.length < 2) return []

    const res: SearchResult[] = []

    // Residentes
    mockUsers
      .filter(u => u.rol === 'propietario' || u.rol === 'arrendatario')
      .filter(u =>
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .forEach(u => {
        const unidad = u.unidadId ? mockUnidades.find(un => un.id === u.unidadId) : undefined
        res.push({
          id: u.id,
          tipo: 'residente',
          titulo: `${u.nombre} ${u.apellido}`,
          subtitulo: `${u.rol === 'propietario' ? 'Propietario' : 'Arrendatario'}${unidad ? ` · Unidad ${unidad.numero}` : ''} · ${u.email}`,
          href: `/residentes/${u.id}`,
        })
      })

    // Unidades
    mockUnidades
      .filter(u =>
        u.numero.toLowerCase().includes(q) ||
        u.tipo.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .forEach(u => {
        res.push({
          id: u.id,
          tipo: 'unidad',
          titulo: `Unidad ${u.numero}`,
          subtitulo: `${u.tipo.replace('_', ' ')} · Piso ${u.piso > 0 ? u.piso : 'PB'} · ${u.estado.replace('_', ' ')}`,
          href: `/unidades/${u.id}`,
        })
      })

    // Solicitudes de mantención
    mockSolicitudes
      .filter(s =>
        s.titulo.toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .forEach(s => {
        res.push({
          id: s.id,
          tipo: 'solicitud',
          titulo: s.titulo,
          subtitulo: `${s.categoria} · ${s.prioridad} · ${s.estado.replace('_', ' ')}`,
          href: `/mantenciones`,
        })
      })

    return res.slice(0, 8)
  }, [searchValue])

  const showResults = searchFocus && searchValue.length >= 2

  // Cerrar al hacer click fuera
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

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b bg-white"
      style={{ borderColor: '#e2e8f0', height: 64 }}
    >
      {/* ── Búsqueda global ── */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onKeyDown={e => { if (e.key === 'Escape') { setSearchFocus(false); setSearchValue('') } }}
            placeholder="Buscar residente, unidad, solicitud..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none transition-all"
            style={{
              borderColor: searchFocus ? '#2563ae' : '#e2e8f0',
              background: searchFocus ? 'white' : '#f8fafc',
              color: '#0f172a',
              boxShadow: searchFocus ? '0 0 0 3px rgba(37,99,174,0.08)' : 'none',
            }}
            suppressHydrationWarning
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(''); setSearchFocus(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Dropdown de resultados ── */}
        {showResults && (
          <div
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border bg-white z-50 overflow-hidden"
            style={{ borderColor: '#e2e8f0' }}
          >
            {resultados.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-400">Sin resultados para «{searchValue}»</p>
                <p className="text-xs text-gray-300 mt-1">Intenta con otro nombre, número o categoría</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b" style={{ borderColor: '#f1f5f9' }}>
                  <p className="text-xs text-gray-400 font-medium">
                    {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} para «{searchValue}»
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: '#f8fafc' }}>
                  {resultados.map(r => {
                    const Icon  = tipoIcon[r.tipo]
                    const badge = tipoBadgeStyle[r.tipo]
                    return (
                      <Link
                        key={r.id + r.tipo}
                        href={r.href}
                        onClick={() => { setSearchFocus(false); setSearchValue('') }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                          style={{ background: badge.bg }}
                        >
                          <Icon className="w-4 h-4" style={{ color: badge.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{r.titulo}</p>
                          <p className="text-xs text-gray-400 truncate capitalize mt-0.5">{r.subtitulo}</p>
                        </div>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {tipoLabel[r.tipo]}
                        </span>
                      </Link>
                    )
                  })}
                </div>
                <div className="px-4 py-2 border-t text-center" style={{ borderColor: '#f1f5f9' }}>
                  <p className="text-xs text-gray-400">Presiona <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-xs font-mono">ESC</kbd> para cerrar</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Acciones ── */}
      <div className="flex items-center gap-2 ml-4 relative">

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowUser(false); setSearchFocus(false) }}
            className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-500" />
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
              className="absolute right-0 top-12 w-96 rounded-2xl shadow-2xl border bg-white z-50 overflow-hidden animate-fade-in"
              style={{ borderColor: '#e2e8f0' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                {noLeidas > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ background: '#2563ae' }}
                  >
                    {noLeidas} nuevas
                  </span>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: '#f8fafc' }}>
                {notificaciones.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm text-gray-400">Sin notificaciones</p>
                  </div>
                ) : notificaciones.map(n => {
                  const c = tipoColores[n.tipo as keyof typeof tipoColores] ?? tipoColores.solicitud
                  return (
                    <div
                      key={n.id}
                      onClick={() => marcarLeida(n.id)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      style={{ background: n.leida ? 'white' : '#f0f7ff' }}
                    >
                      <span
                        className="flex items-center justify-center w-9 h-9 rounded-xl text-lg shrink-0"
                        style={{ background: c.bg }}
                      >
                        {c.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{n.titulo}</p>
                          {!n.leida && (
                            <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: '#2563ae' }} />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{n.descripcion}</p>
                        <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{n.tiempo}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
                <button
                  onClick={marcarTodasLeidas}
                  className="text-sm font-medium hover:opacity-70 transition-opacity"
                  style={{ color: '#2563ae' }}
                >
                  Marcar todas como leídas
                </button>
                <button
                  onClick={limpiarTodas}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ayuda */}
        <button className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition-colors">
          <HelpCircle className="w-5 h-5 text-gray-500" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ background: '#e2e8f0' }} />

        {/* Usuario */}
        <div className="relative">
          <button
            onClick={() => { setShowUser(!showUser); setShowNotif(false); setSearchFocus(false) }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div
              className="flex items-center justify-center rounded-full text-white text-sm font-bold shrink-0"
              style={{ width: 32, height: 32, background: '#1e3a5f' }}
            >
              RA
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-none">Rodrigo Admin</p>
              <p className="text-xs text-gray-400 mt-0.5">Administrador</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {showUser && (
            <div
              className="absolute right-0 top-12 w-56 rounded-2xl shadow-2xl border bg-white z-50 overflow-hidden animate-fade-in"
              style={{ borderColor: '#e2e8f0' }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                <p className="font-semibold text-gray-900">Rodrigo Admin</p>
                <p className="text-xs text-gray-400 mt-0.5">admin@propify.cl</p>
              </div>
              <div className="py-1">
                {[
                  { icon: User,       label: 'Mi perfil',          href: '/residentes/u1' },
                  { icon: Settings,   label: 'Configuración',       href: '/configuracion' },
                  { icon: HelpCircle, label: 'Ayuda y soporte',     href: '#' },
                ].map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setShowUser(false)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-gray-400" />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="py-1 border-t" style={{ borderColor: '#f1f5f9' }}>
                <button
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-red-50 transition-colors"
                  style={{ color: '#ef4444' }}
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay para cerrar paneles */}
      {(showNotif || showUser) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotif(false); setShowUser(false) }}
        />
      )}
    </header>
  )
}
