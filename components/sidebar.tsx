'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  LayoutDashboard,
  DoorOpen,
  Users,
  Receipt,
  CreditCard,
  AlertTriangle,
  Wrench,
  MessageSquare,
  ClipboardList,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Package,
  LogOut,
  Home,
  TrendingDown,
} from 'lucide-react'
import { useRol } from '@/context/rol-context'
import type { UserRole } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────
interface NavItem {
  href:   string
  label:  string
  icon:   React.ElementType
  badge?: number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

// ─── Navegación por rol ────────────────────────────────────────

const NAV_ADMIN: NavGroup[] = [
  {
    title: 'General',
    items: [
      { href: '/dashboard',      label: 'Dashboard',        icon: LayoutDashboard },
      { href: '/edificios',      label: 'Edificios',        icon: Building2 },
      { href: '/unidades',       label: 'Unidades',         icon: DoorOpen },
      { href: '/residentes',     label: 'Residentes',       icon: Users },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { href: '/gastos',         label: 'Gastos Comunes',   icon: Receipt },
      { href: '/egresos',        label: 'Egresos',          icon: TrendingDown },
      { href: '/pagos',          label: 'Pagos',            icon: CreditCard },
      { href: '/morosos',        label: 'Morosos',          icon: AlertTriangle, badge: 12 },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { href: '/mantenciones',   label: 'Mantenciones',     icon: Wrench,        badge: 4 },
      { href: '/comunicaciones', label: 'Comunicaciones',   icon: MessageSquare },
      { href: '/visitas',        label: 'Visitas',          icon: ClipboardList },
      { href: '/reservas',       label: 'Reservas',         icon: Calendar },
      { href: '/paquetes',       label: 'Paquetes',         icon: Package,       badge: 3 },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { href: '/reportes',       label: 'Reportes',         icon: BarChart3 },
      { href: '/configuracion',  label: 'Configuración',    icon: Settings },
    ],
  },
]

const NAV_CONSERJE: NavGroup[] = [
  {
    title: 'General',
    items: [
      { href: '/dashboard',      label: 'Dashboard',        icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { href: '/visitas',        label: 'Visitas',          icon: ClipboardList },
      { href: '/paquetes',       label: 'Paquetes',         icon: Package,       badge: 3 },
      { href: '/reservas',       label: 'Reservas',         icon: Calendar },
      { href: '/comunicaciones', label: 'Comunicaciones',   icon: MessageSquare },
      { href: '/mantenciones',   label: 'Mantenciones',     icon: Wrench,        badge: 4 },
    ],
  },
]

const NAV_PROPIETARIO: NavGroup[] = [
  {
    title: 'Mi Portal',
    items: [
      { href: '/mi-unidad',      label: 'Mi Unidad',        icon: Home },
    ],
  },
  {
    title: 'Servicios',
    items: [
      { href: '/mantenciones',   label: 'Mis Solicitudes',  icon: Wrench },
      { href: '/reservas',       label: 'Reservas',         icon: Calendar },
      { href: '/paquetes',       label: 'Mis Paquetes',     icon: Package },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { href: '/gastos',         label: 'Gastos Comunes',   icon: Receipt },
    ],
  },
  {
    title: 'Información',
    items: [
      { href: '/comunicaciones', label: 'Comunicaciones',   icon: MessageSquare },
    ],
  },
]

const NAV_ARRENDATARIO: NavGroup[] = [
  {
    title: 'Mi Portal',
    items: [
      { href: '/mi-unidad',      label: 'Mi Unidad',        icon: Home },
    ],
  },
  {
    title: 'Servicios',
    items: [
      { href: '/mantenciones',   label: 'Mis Solicitudes',  icon: Wrench },
      { href: '/reservas',       label: 'Reservas',         icon: Calendar },
      { href: '/paquetes',       label: 'Mis Paquetes',     icon: Package },
    ],
  },
  {
    title: 'Información',
    items: [
      { href: '/comunicaciones', label: 'Comunicaciones',   icon: MessageSquare },
    ],
  },
]

// ─── Helpers de rol ───────────────────────────────────────────
function getNavGroups(rol: UserRole): NavGroup[] {
  if (rol === 'conserje')                                  return NAV_CONSERJE
  if (rol === 'propietario')                               return NAV_PROPIETARIO
  if (rol === 'arrendatario')                              return NAV_ARRENDATARIO
  return NAV_ADMIN
}

const PANEL_SUBTITULO: Record<string, string> = {
  administrador: 'Admin Panel',
  super_admin:   'Admin Panel',
  conserje:      'Portal Conserje',
  propietario:   'Portal Residente',
  arrendatario:  'Portal Residente',
}

const ROL_LABEL: Record<string, string> = {
  administrador: 'Administrador',
  super_admin:   'Super Admin',
  conserje:      'Conserje',
  propietario:   'Propietario',
  arrendatario:  'Arrendatario',
}

const AVATAR_BG: Record<string, string> = {
  administrador: '#1e3a5f',
  super_admin:   '#1e3a5f',
  conserje:      '#059669',
  propietario:   '#7c3aed',
  arrendatario:  '#db2777',
}

function getInitials(nombre: string, apellido: string) {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

// ─── Componente ───────────────────────────────────────────────
export default function Sidebar() {
  const pathname            = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { rol, usuario, unidad }  = useRol()

  const navGroups  = getNavGroups(rol)
  const esResidente = rol === 'propietario' || rol === 'arrendatario'

  const isActive = (href: string) =>
    href === '/dashboard' || href === '/mi-unidad'
      ? pathname === href
      : pathname.startsWith(href)

  const initials  = usuario ? getInitials(usuario.nombre, usuario.apellido) : 'RA'
  const nombre    = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario'
  const avatarBg  = AVATAR_BG[rol] ?? '#2563ae'

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 ease-in-out select-none"
      style={{
        width: collapsed ? '72px' : '256px',
        background: '#0f2341',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 40, height: 40, background: '#2563ae' }}
        >
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden animate-fade-in">
            <p className="text-white font-bold text-lg leading-none">Propify</p>
            <p className="text-xs mt-0.5" style={{ color: '#94b4d4' }}>
              {PANEL_SUBTITULO[rol] ?? 'Panel'}
            </p>
          </div>
        )}
      </div>

      {/* ── Info de edificio / unidad ── */}
      {!collapsed && (
        <div
          className="mx-3 my-3 px-3 py-2.5 rounded-xl cursor-default animate-fade-in"
          style={{ background: 'rgba(37,99,174,0.25)', border: '1px solid rgba(37,99,174,0.4)' }}
        >
          {esResidente && unidad ? (
            <>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#94b4d4' }}>Mi unidad</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">
                  Departamento {unidad.numero}
                </p>
                <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(255,255,255,0.12)', color: '#94b4d4' }}>
                  Piso {unidad.piso}
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-medium mb-0.5" style={{ color: '#94b4d4' }}>Edificio activo</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white truncate">Edificio Las Palmas</p>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-1" style={{ color: '#94b4d4' }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Navegación ── */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
        {navGroups.map(group => (
          <div key={group.title} className="mb-2">
            {!collapsed && (
              <p
                className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'rgba(148,180,212,0.5)' }}
              >
                {group.title}
              </p>
            )}

            {group.items.map(item => {
              const active = isActive(item.href)
              const Icon   = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5
                    transition-all duration-150 group
                    ${active ? 'text-white' : 'hover:bg-white/5'}
                  `}
                  style={active ? { background: '#2563ae' } : {}}
                >
                  <Icon
                    className="shrink-0"
                    style={{ width: 18, height: 18, color: active ? 'white' : '#94b4d4' }}
                  />
                  {!collapsed && (
                    <span
                      className="text-sm font-medium flex-1 truncate"
                      style={{ color: active ? 'white' : '#94b4d4' }}
                    >
                      {item.label}
                    </span>
                  )}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: active ? 'rgba(255,255,255,0.25)' : '#ef4444',
                        color: 'white',
                        minWidth: 20,
                        textAlign: 'center',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{ background: '#ef4444' }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Usuario ── */}
      <div
        className="border-t p-3"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
            <div
              className="flex items-center justify-center rounded-full text-white text-sm font-bold shrink-0"
              style={{ width: 36, height: 36, background: avatarBg }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{nombre}</p>
              <p className="text-xs truncate" style={{ color: '#94b4d4' }}>
                {ROL_LABEL[rol] ?? rol}
              </p>
            </div>
            <LogOut className="w-4 h-4 shrink-0" style={{ color: '#94b4d4' }} />
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="flex items-center justify-center rounded-full text-white text-sm font-bold cursor-pointer"
              style={{ width: 36, height: 36, background: avatarBg }}
            >
              {initials}
            </div>
          </div>
        )}
      </div>

      {/* ── Botón colapsar ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full border text-white z-10 transition-colors hover:opacity-80"
        style={{ background: '#2563ae', borderColor: '#1e3a5f' }}
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft  className="w-3 h-3" />
        }
      </button>
    </aside>
  )
}
