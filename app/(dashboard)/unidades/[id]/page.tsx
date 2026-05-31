import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowLeft, ChevronRight, Home, User, Wrench,
  DollarSign, Phone, Mail, CheckCircle, Clock, XCircle, AlertCircle,
  History, TrendingUp, FileDown,
} from 'lucide-react'
import {
  getUnidadById, getUsuarioById, getGastosComunes,
  getSolicitudes, formatCLP,
} from '@/lib/db'

type PageProps = { params: Promise<{ id: string }> }

// ─── Metadata ─────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const u = await getUnidadById(id)
  return { title: u ? `Unidad ${u.numero}` : 'Unidad' }
}

// ─── Helpers ──────────────────────────────────────────────────
const estadoCfg = {
  ocupado:         { label: 'Ocupado',    bg: '#dcfce7', color: '#16a34a' },
  disponible:      { label: 'Disponible', bg: '#dbeafe', color: '#2563ae' },
  'en_mantención': { label: 'Mantención', bg: '#fef3c7', color: '#d97706' },
} as const

const tipoCfg: Record<string, string> = {
  departamento:    'Departamento',
  casa:            'Casa',
  local_comercial: 'Local comercial',
  oficina:         'Oficina',
  bodega:          'Bodega',
  estacionamiento: 'Estacionamiento',
}

const pagoCfg = {
  pagado:   { Icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', label: 'Pagado' },
  pendiente:{ Icon: Clock,       color: '#d97706', bg: '#fef3c7', label: 'Pendiente' },
  vencido:  { Icon: XCircle,     color: '#dc2626', bg: '#fee2e2', label: 'Vencido' },
  parcial:  { Icon: AlertCircle, color: '#9333ea', bg: '#f3e8ff', label: 'Pago parcial' },
} as const

const solicitudCfg = {
  pendiente:   { label: 'Pendiente',   bg: '#fef3c7', color: '#d97706' },
  en_progreso: { label: 'En progreso', bg: '#dbeafe', color: '#2563ae' },
  resuelto:    { label: 'Resuelto',    bg: '#dcfce7', color: '#16a34a' },
  cancelado:   { label: 'Cancelado',   bg: '#f1f5f9', color: '#64748b' },
} as const

const prioridadCfg = {
  urgente: { label: 'Urgente', color: '#dc2626' },
  alta:    { label: 'Alta',    color: '#d97706' },
  media:   { label: 'Media',   color: '#2563ae' },
  baja:    { label: 'Baja',    color: '#64748b' },
} as const

const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function formatPiso(piso: number) {
  if (piso < 0) return `Sótano ${Math.abs(piso)}`
  if (piso === 0) return 'Planta Baja'
  return `Piso ${piso}`
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Página ───────────────────────────────────────────────────
export default async function UnidadDetailPage({ params }: PageProps) {
  const { id } = await params
  const unidad = await getUnidadById(id)
  if (!unidad) return notFound()

  const [propietario, arrendatario, todosGastos, todasSolicitudes] = await Promise.all([
    unidad.propietarioId  ? getUsuarioById(unidad.propietarioId)  : Promise.resolve(undefined),
    unidad.arrendatarioId ? getUsuarioById(unidad.arrendatarioId) : Promise.resolve(undefined),
    getGastosComunes(unidad.edificioId),
    getSolicitudes(unidad.edificioId),
  ])

  // Gastos de esta unidad, más reciente primero
  const gastosUnidad = todosGastos
    .filter(g => g.unidadId === id)
    .sort((a, b) => {
      const ay = a['año'] as number, by = b['año'] as number
      if (by !== ay) return by - ay
      return b.mes - a.mes
    })

  const mesActual = new Date().getMonth() + 1
  const añoActual = new Date().getFullYear()
  const gastoMes  = gastosUnidad.find(g => g.mes === mesActual && (g['año'] as number) === añoActual)
    ?? gastosUnidad[0]

  const solicitudes = todasSolicitudes.filter(
    s => s.unidadId === id && s.estado !== 'resuelto' && s.estado !== 'cancelado'
  )

  // Estadísticas historial
  const totalPagado   = gastosUnidad.filter(g => g.estadoPago === 'pagado').reduce((s, g) => s + g.montoTotal, 0)
  const totalPendiente= gastosUnidad.filter(g => g.estadoPago !== 'pagado').reduce((s, g) => s + g.montoTotal, 0)
  const vecesEnMora   = gastosUnidad.filter(g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial').length

  const est = estadoCfg[unidad.estado as keyof typeof estadoCfg]
    ?? { label: unidad.estado, bg: '#f1f5f9', color: '#64748b' }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/unidades"
          className="flex items-center gap-1.5 font-medium hover:opacity-75 transition-opacity"
          style={{ color: '#2563ae' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Unidades
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span>Unidad {unidad.numero}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0"
              style={{ background: '#dbeafe' }}
            >
              <Home className="w-7 h-7" style={{ color: '#2563ae' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-gray-900">Unidad {unidad.numero}</h1>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: est.bg, color: est.color }}
                >
                  {est.label}
                </span>
                {unidad.prorrateo && (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: '#f3e8ff', color: '#7c3aed' }}
                  >
                    {unidad.prorrateo.toFixed(4)}% prorrateo
                  </span>
                )}
              </div>
              <p className="text-gray-500">
                {tipoCfg[unidad.tipo] ?? unidad.tipo} · {formatPiso(unidad.piso)}
                {unidad.superficieM2 ? ` · ${unidad.superficieM2} m²` : ''}
                {unidad.habitaciones ? ` · ${unidad.habitaciones} hab.` : ''}
                {unidad.banos        ? ` · ${unidad.banos} baño(s)` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats rápidas de cobranza */}
      {gastosUnidad.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total pagado',   value: formatCLP(totalPagado),    color: '#16a34a', bg: '#dcfce7', Icon: CheckCircle },
            { label: 'Por cobrar',     value: formatCLP(totalPendiente), color: '#d97706', bg: '#fef3c7', Icon: Clock },
            { label: 'Períodos mora',  value: `${vecesEnMora}`,          color: '#dc2626', bg: '#fee2e2', Icon: XCircle },
          ].map(({ label, value, color, bg, Icon }) => (
            <div key={label} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Contenido */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Columna izquierda (2/3) */}
        <div className="xl:col-span-2 space-y-5">

          {/* Propietario */}
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4" style={{ color: '#2563ae' }} />
              <h2 className="font-bold text-gray-900">Propietario</h2>
            </div>
            {propietario ? (
              <div className="flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-full text-white text-sm font-bold shrink-0"
                  style={{ background: '#1e3a5f' }}
                >
                  {propietario.nombre[0]}{propietario.apellido[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">
                      {propietario.nombre} {propietario.apellido}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#dbeafe', color: '#2563ae' }}>
                      Propietario
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{propietario.email}</span>
                    {propietario.telefono && (
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{propietario.telefono}</span>
                    )}
                  </div>
                </div>
                <Link href={`/residentes/${propietario.id}`} className="text-xs font-semibold hover:opacity-75 shrink-0" style={{ color: '#2563ae' }}>
                  Ver perfil →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2">Sin propietario asignado</p>
            )}
          </div>

          {/* Arrendatario */}
          {(arrendatario || unidad.estado === 'ocupado') && (
            <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4" style={{ color: '#7c3aed' }} />
                <h2 className="font-bold text-gray-900">Arrendatario</h2>
              </div>
              {arrendatario ? (
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-full text-white text-sm font-bold shrink-0"
                    style={{ background: '#7c3aed' }}
                  >
                    {arrendatario.nombre[0]}{arrendatario.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">
                        {arrendatario.nombre} {arrendatario.apellido}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                        Arrendatario
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{arrendatario.email}</span>
                      {arrendatario.telefono && (
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{arrendatario.telefono}</span>
                      )}
                    </div>
                  </div>
                  <Link href={`/residentes/${arrendatario.id}`} className="text-xs font-semibold hover:opacity-75 shrink-0" style={{ color: '#7c3aed' }}>
                    Ver perfil →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-2">Sin arrendatario registrado</p>
              )}
            </div>
          )}

          {/* ── HISTORIAL COMPLETO DE PAGOS ── */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" style={{ color: '#2563ae' }} />
                <h2 className="font-bold text-gray-900">Historial de gastos comunes</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#dbeafe', color: '#2563ae' }}>
                {gastosUnidad.length} período{gastosUnidad.length !== 1 ? 's' : ''}
              </span>
            </div>

            {gastosUnidad.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">Sin gastos registrados para esta unidad</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      {['Período','Monto','Estado','Vencimiento','Fecha pago','Acciones'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gastosUnidad.map((g, idx) => {
                      const añoG = g['año'] as number
                      const cfg  = pagoCfg[g.estadoPago as keyof typeof pagoCfg] ?? pagoCfg.pendiente
                      const { Icon } = cfg
                      const esMesActual = g.mes === mesActual && añoG === añoActual
                      return (
                        <tr
                          key={g.id}
                          className="border-b hover:bg-gray-50 transition-colors"
                          style={{
                            borderColor: '#f8fafc',
                            background: idx === 0 && esMesActual ? '#fffbeb' : undefined,
                          }}
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {MESES[g.mes]} {añoG}
                              </span>
                              {esMesActual && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: '#fef3c7', color: '#d97706' }}>
                                  Actual
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-bold text-gray-900">{formatCLP(g.montoTotal)}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: cfg.bg, color: cfg.color }}
                            >
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                            {formatFecha(g.fechaVencimiento)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                            {g.fechaPago ? formatFecha(g.fechaPago) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`/api/liquidacion/${g.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Descargar PDF"
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                style={{ color: '#dc2626' }}
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </a>
                              <Link
                                href={`/gastos/${g.id}`}
                                title="Ver detalle"
                                className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-xs font-semibold"
                                style={{ color: '#2563ae' }}
                              >
                                Ver →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pie con total recaudado */}
            {gastosUnidad.length > 0 && (
              <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: '#f1f5f9', background: '#fafbfc' }}>
                <p className="text-xs text-gray-400">
                  {gastosUnidad.filter(g => g.estadoPago === 'pagado').length} pagados de {gastosUnidad.length} períodos
                </p>
                <p className="text-xs font-semibold text-gray-600">
                  Recaudado: {formatCLP(totalPagado)}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Columna derecha (1/3) */}
        <div className="space-y-5">

          {/* Gasto del mes */}
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" style={{ color: '#16a34a' }} />
                <h2 className="font-bold text-gray-900 text-sm">
                  {gastoMes ? `${MESES[gastoMes.mes]} ${gastoMes['año']}` : 'Sin cobros'}
                </h2>
              </div>
              {gastoMes && (() => {
                const cfg = pagoCfg[gastoMes.estadoPago as keyof typeof pagoCfg]
                  ?? { Icon: Clock, color: '#64748b', bg: '#f1f5f9', label: gastoMes.estadoPago }
                const { Icon } = cfg
                return (
                  <span
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                )
              })()}
            </div>

            {gastoMes ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: 'Base',          value: gastoMes.montoBase },
                    { label: 'Agua',          value: gastoMes.montoAgua ?? 0 },
                    { label: 'Electricidad',  value: gastoMes.montoElectricidad ?? 0 },
                    { label: 'Fondo reserva', value: gastoMes.montoFondoReserva ?? 0 },
                  ].filter(c => c.value > 0).map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatCLP(value)}</p>
                    </div>
                  ))}
                </div>
                <div
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: '#f0f9ff' }}
                >
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-lg font-bold" style={{ color: '#2563ae' }}>
                    {formatCLP(gastoMes.montoTotal)}
                  </span>
                </div>
                {gastoMes.diasMora != null && gastoMes.diasMora > 0 && (
                  <p className="text-xs mt-2 font-medium" style={{ color: '#dc2626' }}>
                    ⚠️ {gastoMes.diasMora} días de mora
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/api/liquidacion/${gastoMes.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity text-white"
                    style={{ background: '#dc2626' }}
                  >
                    <FileDown className="w-3.5 h-3.5" /> PDF
                  </a>
                  <Link
                    href={`/gastos/${gastoMes.id}`}
                    className="flex-1 flex items-center justify-center py-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{ background: '#f1f5f9', color: '#1e3a5f' }}
                  >
                    Ver detalle →
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 py-2">Sin gastos este mes</p>
            )}
          </div>

          {/* Solicitudes activas */}
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4" style={{ color: '#d97706' }} />
                <h2 className="font-bold text-gray-900 text-sm">Solicitudes</h2>
              </div>
              {solicitudes.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#fef3c7', color: '#d97706' }}>
                  {solicitudes.length} activa{solicitudes.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {solicitudes.length === 0 ? (
              <div className="py-4 text-center">
                <CheckCircle className="w-7 h-7 mx-auto mb-2" style={{ color: '#16a34a' }} />
                <p className="text-xs text-gray-400">Sin solicitudes pendientes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {solicitudes.map(s => {
                  const estSol    = solicitudCfg[s.estado as keyof typeof solicitudCfg] ?? { label: s.estado, bg: '#f1f5f9', color: '#64748b' }
                  const prioridad = prioridadCfg[s.prioridad as keyof typeof prioridadCfg] ?? { label: s.prioridad, color: '#64748b' }
                  return (
                    <div key={s.id} className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-900 leading-tight">{s.titulo}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: estSol.bg, color: estSol.color }}>
                          {estSol.label}
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: prioridad.color }}>● {prioridad.label}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <Link
              href="/mantenciones"
              className="block w-full mt-3 py-2 rounded-xl text-xs font-semibold text-center hover:opacity-80 transition-opacity"
              style={{ background: '#f1f5f9', color: '#1e3a5f' }}
            >
              Ver todas las solicitudes
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
