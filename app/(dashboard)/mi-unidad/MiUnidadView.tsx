'use client'

import {
  Home,
  DoorOpen,
  CreditCard,
  Wrench,
  Package,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MapPin,
  Layers,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { useRol } from '@/context/rol-context'
import {
  mockGastosComunes,
  mockPagos,
  mockSolicitudes,
  mockPaquetes,
  mockReservas,
  mockEspacios,
  mockComunicaciones,
  mockUsers,
  formatCLP,
} from '@/lib/mock-data'
import type { EstadoPago, PrioridadSolicitud, EstadoSolicitud, TipoComunicacion } from '@/types'

// ─── Config de estados ─────────────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const estadoGastoCfg: Record<EstadoPago, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  pagado:    { color: '#10b981', bg: '#d1fae5', label: 'Pagado',    icon: CheckCircle },
  pendiente: { color: '#f59e0b', bg: '#fef3c7', label: 'Pendiente', icon: Clock },
  vencido:   { color: '#dc2626', bg: '#fee2e2', label: 'Vencido',   icon: XCircle },
  parcial:   { color: '#8b5cf6', bg: '#ede9fe', label: 'Parcial',   icon: AlertCircle },
}

const prioridadCfg: Record<PrioridadSolicitud, { color: string; bg: string; label: string }> = {
  baja:    { color: '#64748b', bg: '#f1f5f9', label: 'Baja' },
  media:   { color: '#f59e0b', bg: '#fef3c7', label: 'Media' },
  alta:    { color: '#ef4444', bg: '#fee2e2', label: 'Alta' },
  urgente: { color: '#dc2626', bg: '#fecaca', label: 'Urgente' },
}

const estadoSolCfg: Record<EstadoSolicitud, { color: string; label: string }> = {
  pendiente:   { color: '#f59e0b', label: 'Pendiente' },
  en_progreso: { color: '#3b82f6', label: 'En progreso' },
  resuelto:    { color: '#10b981', label: 'Resuelto' },
  cancelado:   { color: '#94a3b8', label: 'Cancelado' },
}

const tipoComunCfg: Record<TipoComunicacion, { bg: string; emoji: string }> = {
  circular:    { bg: '#dbeafe', emoji: '📋' },
  urgente:     { bg: '#fee2e2', emoji: '🚨' },
  informativo: { bg: '#d1fae5', emoji: 'ℹ️' },
  'reunión':   { bg: '#ede9fe', emoji: '📅' },
}

// ─── Helper fecha ──────────────────────────────────────────────
function formatFecha(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

// ─── Vista principal ───────────────────────────────────────────
export default function MiUnidadView() {
  const { rol, usuario, unidad, cargado } = useRol()

  // Loading: esperando que localStorage cargue
  if (!cargado || !usuario || !unidad) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Home className="w-12 h-12 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
          <p className="text-gray-500 font-medium">Cargando tu portal…</p>
          <p className="text-xs text-gray-400 mt-1">Verificando tu sesión</p>
        </div>
      </div>
    )
  }

  const esPropietario = rol === 'propietario'

  // ── Datos filtrados para esta unidad/usuario ──────────────────
  const gastoActual     = mockGastosComunes.find(g => g.unidadId === unidad.id && g.mes === 5 && g.año === 2026)
  const misPagos        = mockPagos
    .filter(p => p.unidadId === unidad.id)
    .sort((a, b) => b.año !== a.año ? b.año - a.año : b.mes - a.mes)
  const misSolicitudes  = mockSolicitudes.filter(s => s.unidadId === unidad.id)
  const solActivas      = misSolicitudes.filter(s => s.estado !== 'resuelto' && s.estado !== 'cancelado')
  const misPaquetes     = mockPaquetes.filter(p => p.unidadId === unidad.id && p.estado !== 'retirado')
  const misReservas     = mockReservas
    .filter(r => r.usuarioId === usuario.id && r.estado === 'confirmada')
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
  const proximaReserva  = misReservas[0] ?? null
  const espacioReserva  = proximaReserva ? mockEspacios.find(e => e.id === proximaReserva.espacioId) : null
  const comunicaciones  = mockComunicaciones.slice(0, 4)

  // Arrendatario del propietario (si aplica)
  const arrendatario = esPropietario && unidad.arrendatarioId
    ? mockUsers.find(u => u.id === unidad.arrendatarioId) ?? null
    : null

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Banner de bienvenida ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, #0f2341 0%, #1e3a5f 55%, #2563ae 100%)' }}
      >
        {/* Decoración */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full opacity-10 bg-white blur-3xl" />
          <div className="absolute -bottom-10 left-16 w-36 h-36 rounded-full opacity-10 bg-blue-300 blur-2xl" />
        </div>

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-300 text-sm font-medium mb-1">Bienvenido/a 👋</p>
            <h1 className="text-2xl font-bold text-white">
              {usuario.nombre} {usuario.apellido}
            </h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-blue-200 text-sm">
                <DoorOpen className="w-4 h-4" />
                Departamento {unidad.numero}
              </span>
              <span className="flex items-center gap-1.5 text-blue-200 text-sm">
                <Layers className="w-4 h-4" />
                Piso {unidad.piso}
              </span>
              <span className="flex items-center gap-1.5 text-blue-200 text-sm">
                <MapPin className="w-4 h-4" />
                Edificio Las Palmas
              </span>
            </div>
          </div>

          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
          >
            {esPropietario ? '🏠 Propietario/a' : '🔑 Arrendatario/a'}
          </span>
        </div>
      </div>

      {/* ── Mini KPIs (4 tarjetas) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Gasto actual (propietario) */}
        {esPropietario && gastoActual ? (() => {
          const cfg = estadoGastoCfg[gastoActual.estadoPago]
          const StatusIcon = cfg.icon
          return (
            <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Gasto Mayo</span>
                <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCLP(gastoActual.montoTotal)}</p>
              <span
                className="mt-2 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          )
        })() : null}

        {/* Solicitudes (arrendatario en posición 1) */}
        {!esPropietario && (
          <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">Solicitudes</span>
              <Wrench className="w-4 h-4" style={{ color: solActivas.length > 0 ? '#f59e0b' : '#94a3b8' }} />
            </div>
            <p className="text-xl font-bold text-gray-900">{solActivas.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {solActivas.length === 0 ? 'Sin solicitudes activas' : `${solActivas.length} activa${solActivas.length > 1 ? 's' : ''}`}
            </p>
          </div>
        )}

        {/* Solicitudes (propietario en posición 2) */}
        {esPropietario && (
          <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">Solicitudes</span>
              <Wrench className="w-4 h-4" style={{ color: solActivas.length > 0 ? '#f59e0b' : '#10b981' }} />
            </div>
            <p className="text-xl font-bold text-gray-900">{solActivas.length}</p>
            <p className="text-xs mt-1" style={{ color: solActivas.length === 0 ? '#10b981' : '#f59e0b' }}>
              {solActivas.length === 0 ? '✓ Todo al día' : `${solActivas.length} activa${solActivas.length > 1 ? 's' : ''}`}
            </p>
          </div>
        )}

        {/* Paquetes */}
        <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Paquetes</span>
            <Package className="w-4 h-4" style={{ color: misPaquetes.length > 0 ? '#db2777' : '#94a3b8' }} />
          </div>
          <p className="text-xl font-bold text-gray-900">{misPaquetes.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {misPaquetes.length === 0 ? 'Sin paquetes' : 'Por retirar en conserjería'}
          </p>
        </div>

        {/* Próxima reserva */}
        <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Próxima Reserva</span>
            <Calendar className="w-4 h-4" style={{ color: proximaReserva ? '#0891b2' : '#94a3b8' }} />
          </div>
          {proximaReserva && espacioReserva ? (
            <>
              <p className="text-sm font-bold text-gray-900 truncate">{espacioReserva.nombre}</p>
              <p className="text-xs text-gray-400 mt-1">{formatFecha(proximaReserva.fechaInicio)}</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-900">—</p>
              <p className="text-xs text-gray-400 mt-1">Sin reservas</p>
            </>
          )}
        </div>

        {/* Comunicados (arrendatario en posición 4) */}
        {!esPropietario && (
          <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">Comunicados</span>
              <MessageSquare className="w-4 h-4" style={{ color: '#2563ae' }} />
            </div>
            <p className="text-xl font-bold text-gray-900">{comunicaciones.length}</p>
            <p className="text-xs text-gray-400 mt-1">Del edificio</p>
          </div>
        )}
      </div>

      {/* ── Fila principal ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Mi Unidad */}
        <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Mi Unidad</h2>
            <Link
              href={`/unidades/${unidad.id}`}
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#2563ae' }}
            >
              Ver detalle <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Grid de datos */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { icon: DoorOpen,  label: 'Departamento', valor: `N° ${unidad.numero}` },
              { icon: Layers,    label: 'Piso',         valor: `Piso ${unidad.piso}` },
              { icon: Home,      label: 'Superficie',   valor: `${unidad.superficieM2} m²` },
              { icon: CheckCircle, label: 'Composición', valor: `${unidad.habitaciones ?? '—'} hab · ${unidad.banos ?? '—'} baño${(unidad.banos ?? 0) !== 1 ? 's' : ''}` },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: '#f8fafc' }}
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                  style={{ background: '#dbeafe' }}
                >
                  <item.icon className="w-3.5 h-3.5" style={{ color: '#2563ae' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.valor}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gasto mensual base + arrendatario (propietario) */}
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: '#f1f5f9' }}
          >
            <div>
              <p className="text-xs text-gray-400">Gasto mensual base</p>
              <p className="text-base font-bold text-gray-900">
                {formatCLP(unidad.gastosComunesMonto)}
              </p>
            </div>
            {arrendatario && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Arrendatario/a</p>
                <p className="text-sm font-semibold text-gray-700">
                  {arrendatario.nombre} {arrendatario.apellido}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Gastos/Pagos (propietario) o Solicitudes detalle (arrendatario) */}
        {esPropietario ? (
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Gastos y Pagos</h2>
              <Link
                href="/gastos"
                className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
                style={{ color: '#2563ae' }}
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Gasto actual */}
            {gastoActual ? (() => {
              const cfg = estadoGastoCfg[gastoActual.estadoPago]
              return (
                <div
                  className="p-4 rounded-xl mb-4 border"
                  style={{ background: cfg.bg, borderColor: cfg.color + '40' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: cfg.color }}>
                        Gasto Común Mayo 2026
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCLP(gastoActual.montoTotal)}
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                      style={{ background: cfg.color, color: 'white' }}
                    >
                      {gastoActual.estadoPago.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: cfg.color }}>
                    <span>
                      Vence: {formatFecha(gastoActual.fechaVencimiento)}
                    </span>
                    {gastoActual.fechaPago && (
                      <span>Pagado: {formatFecha(gastoActual.fechaPago)}</span>
                    )}
                  </div>
                </div>
              )
            })() : (
              <p className="text-sm text-gray-400 text-center py-4">Sin gasto registrado para este mes</p>
            )}

            {/* Historial de pagos */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Historial de Pagos</h3>
            {misPagos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin registros de pago</p>
            ) : (
              <div className="space-y-0.5">
                {misPagos.slice(0, 5).map(pago => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between py-2.5 border-b"
                    style={{ borderColor: '#f1f5f9' }}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {MESES[pago.mes - 1]} {pago.año}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{pago.metodo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCLP(pago.monto)}</p>
                      <span className="text-xs font-medium" style={{ color: '#10b981' }}>✓ Pagado</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Arrendatario: detalle completo de solicitudes */
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Mis Solicitudes</h2>
              <Link
                href="/mantenciones"
                className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
                style={{ color: '#2563ae' }}
              >
                Ir al módulo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {misSolicitudes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Wrench className="w-10 h-10 mb-3" style={{ color: '#e2e8f0' }} />
                <p className="text-sm font-medium text-gray-500">Sin solicitudes registradas</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Puedes reportar un problema desde el módulo de Mantenciones.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {misSolicitudes.map(s => {
                  const pCfg = prioridadCfg[s.prioridad]
                  const sCfg = estadoSolCfg[s.estado]
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl border"
                      style={{ borderColor: '#f1f5f9', background: '#f8fafc' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-gray-900 flex-1">{s.titulo}</p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                          style={{ background: pCfg.bg, color: pCfg.color }}
                        >
                          {pCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{s.descripcion}</p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: sCfg.color }}
                        />
                        <span className="text-xs font-medium" style={{ color: sCfg.color }}>
                          {sCfg.label}
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{s.categoria}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fila inferior ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Mis Solicitudes (propietario en resumen) */}
        {esPropietario && (
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Mis Solicitudes</h3>
              <Link href="/mantenciones" className="text-xs hover:opacity-70" style={{ color: '#2563ae' }}>
                Ver →
              </Link>
            </div>

            {misSolicitudes.length === 0 ? (
              <div className="text-center py-5">
                <CheckCircle className="w-7 h-7 mx-auto mb-2" style={{ color: '#10b981' }} />
                <p className="text-xs text-gray-400">Sin solicitudes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {misSolicitudes.slice(0, 3).map(s => {
                  const pCfg = prioridadCfg[s.prioridad]
                  const sCfg = estadoSolCfg[s.estado]
                  return (
                    <div
                      key={s.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg"
                      style={{ background: '#f8fafc' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: sCfg.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{s.titulo}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs" style={{ color: sCfg.color }}>{sCfg.label}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{ background: pCfg.bg, color: pCfg.color }}
                          >
                            {pCfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Mis Paquetes */}
        <div
          className={`bg-white rounded-2xl border shadow-sm p-5 ${!esPropietario ? 'md:col-span-1' : ''}`}
          style={{ borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Mis Paquetes</h3>
            <Link href="/paquetes" className="text-xs hover:opacity-70" style={{ color: '#2563ae' }}>
              Ver →
            </Link>
          </div>

          {misPaquetes.length === 0 ? (
            <div className="text-center py-5">
              <Package className="w-7 h-7 mx-auto mb-2" style={{ color: '#e2e8f0' }} />
              <p className="text-xs text-gray-400">Sin paquetes pendientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {misPaquetes.map(p => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg"
                  style={{ background: '#f8fafc' }}
                >
                  <Package className="w-4 h-4 shrink-0" style={{ color: '#db2777' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{p.courier}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {p.descripcion ?? 'Sin descripción'} · Cód. {p.codigoRetiro}
                    </p>
                  </div>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                    style={{ background: '#fce7f3', color: '#db2777' }}
                  >
                    {p.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comunicaciones del edificio */}
        <div
          className={`bg-white rounded-2xl border shadow-sm p-5 ${!esPropietario ? 'md:col-span-2' : ''}`}
          style={{ borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Comunicaciones</h3>
            <Link href="/comunicaciones" className="text-xs hover:opacity-70" style={{ color: '#2563ae' }}>
              Ver →
            </Link>
          </div>

          <div className="space-y-2.5">
            {comunicaciones.map(c => {
              const cfg = tipoComunCfg[c.tipo]
              return (
                <div key={c.id} className="flex items-start gap-2.5">
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-xl text-sm shrink-0"
                    style={{ background: cfg.bg }}
                  >
                    {cfg.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{c.titulo}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.contenido}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Reservas próximas ── */}
      {misReservas.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Mis Reservas</h3>
            <Link
              href="/reservas"
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#2563ae' }}
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {misReservas.slice(0, 3).map(r => {
              const espacio = mockEspacios.find(e => e.id === r.espacioId)
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl border flex-1 min-w-48"
                  style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                    style={{ background: '#cffafe' }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: '#0891b2' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {espacio?.nombre ?? 'Espacio'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFecha(r.fechaInicio)} · {r.nota ?? 'Sin nota'}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-auto"
                    style={{ background: '#d1fae5', color: '#059669' }}
                  >
                    Confirmada
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
