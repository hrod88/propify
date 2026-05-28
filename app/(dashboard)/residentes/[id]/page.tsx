import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowLeft, ChevronRight, Mail, Phone,
  Home, DollarSign, Wrench, Calendar,
  CheckCircle, Clock, XCircle, AlertCircle,
} from 'lucide-react'
import { getUsuarioById, getUnidades, getGastosComunes, getSolicitudes, formatCLP } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'

type PageProps = { params: Promise<{ id: string }> }

// ─── Metadata ─────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const user = await getUsuarioById(id)
  return { title: user ? `${user.nombre} ${user.apellido}` : 'Residente' }
}

// ─── Helpers ──────────────────────────────────────────────────
const rolCfg = {
  propietario:  { label: 'Propietario',  bg: '#dbeafe', color: '#2563ae',  avatar: '#1e3a5f' },
  arrendatario: { label: 'Arrendatario', bg: '#f3e8ff', color: '#7c3aed',  avatar: '#7c3aed' },
} as const

const pagoCfg = {
  pagado:   { Icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', label: 'Pagado' },
  pendiente:{ Icon: Clock,       color: '#d97706', bg: '#fef3c7', label: 'Pendiente' },
  vencido:  { Icon: XCircle,     color: '#dc2626', bg: '#fee2e2', label: 'Vencido' },
  parcial:  { Icon: AlertCircle, color: '#9333ea', bg: '#f3e8ff', label: 'Pago parcial' },
} as const

const solicitudEstadoCfg = {
  pendiente:   { label: 'Pendiente',   bg: '#fef3c7', color: '#d97706' },
  en_progreso: { label: 'En progreso', bg: '#dbeafe', color: '#2563ae' },
  resuelto:    { label: 'Resuelto',    bg: '#dcfce7', color: '#16a34a' },
  cancelado:   { label: 'Cancelado',   bg: '#f1f5f9', color: '#64748b' },
} as const

const tipoLabel: Record<string, string> = {
  departamento:    'Departamento',
  casa:            'Casa',
  local_comercial: 'Local comercial',
  oficina:         'Oficina',
  bodega:          'Bodega',
  estacionamiento: 'Estacionamiento',
}

function formatFecha(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('es-CL', opts ?? { day: 'numeric', month: 'long', year: 'numeric' })
}

function getInitials(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase()
}

// ─── Página ───────────────────────────────────────────────────
export default async function ResidenteDetailPage({ params }: PageProps) {
  const { id } = await params
  const edificioId = await getEdificioActual()
  const [residente, unidades, gastosComunes, solicitudesAll] = await Promise.all([
    getUsuarioById(id),
    getUnidades(edificioId),
    getGastosComunes(edificioId),
    getSolicitudes(edificioId),
  ])

  if (!residente || (residente.rol !== 'propietario' && residente.rol !== 'arrendatario')) {
    return notFound()
  }

  const cfg         = rolCfg[residente.rol as keyof typeof rolCfg]
  const unidad      = residente.unidadId ? unidades.find(u => u.id === residente.unidadId) : undefined
  const gastos      = unidad ? gastosComunes.filter(g => g.unidadId === unidad.id) : []
  const solicitudes = solicitudesAll.filter(s => s.solicitanteId === id)
  const historialMeses = ['Mayo 2026', 'Abril 2026', 'Marzo 2026']

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/residentes" className="flex items-center gap-1.5 font-medium hover:opacity-75 transition-opacity" style={{ color: '#2563ae' }}>
          <ArrowLeft className="w-4 h-4" /> Residentes
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span>{residente.nombre} {residente.apellido}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl text-white text-xl font-bold shrink-0" style={{ background: cfg.avatar }}>
              {getInitials(residente.nombre, residente.apellido)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{residente.nombre} {residente.apellido}</h1>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: residente.activo ? '#dcfce7' : '#f1f5f9', color: residente.activo ? '#16a34a' : '#64748b' }}>
                  {residente.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />{residente.email}</span>
                {residente.telefono && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{residente.telefono}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />Desde {formatFecha(residente.creadoEn, { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity" style={{ background: '#f1f5f9', color: '#1e3a5f' }}>
            Editar residente
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          {/* Unidad */}
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-4 h-4" style={{ color: '#2563ae' }} />
              <h2 className="font-bold text-gray-900">Unidad Asignada</h2>
            </div>
            {unidad ? (
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                  {[
                    { label: 'Unidad',     value: `Nº ${unidad.numero}` },
                    { label: 'Tipo',       value: tipoLabel[unidad.tipo] ?? unidad.tipo },
                    { label: 'Piso',       value: unidad.piso > 0 ? `Piso ${unidad.piso}` : 'PB' },
                    { label: 'Superficie', value: `${unidad.superficieM2} m²` },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                <Link href={`/unidades/${unidad.id}`} className="text-sm font-semibold hover:opacity-75 transition-opacity shrink-0" style={{ color: '#2563ae' }}>Ver unidad →</Link>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2">Sin unidad asignada</p>
            )}
          </div>

          {/* Gastos */}
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" style={{ color: '#16a34a' }} />
                <h2 className="font-bold text-gray-900">Gastos Comunes</h2>
              </div>
              <Link href="/gastos" className="text-xs font-semibold hover:opacity-75" style={{ color: '#2563ae' }}>Ver historial →</Link>
            </div>
            {gastos.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Sin gastos comunes registrados</p>
            ) : (
              <div className="space-y-2">
                {gastos.slice(0, 3).map((g, i) => {
                  const cfg2 = pagoCfg[g.estadoPago as keyof typeof pagoCfg]
                  const { Icon } = cfg2
                  return (
                    <div key={g.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{historialMeses[i] ?? `Mes ${g.mes}/${g['año']}`}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Vence: {formatFecha(g.fechaVencimiento, { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCLP(g.montoTotal)}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold mt-0.5" style={{ color: cfg2.color }}>
                          <Icon className="w-3 h-3" />{cfg2.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4" style={{ color: '#d97706' }} />
                <h2 className="font-bold text-gray-900">Solicitudes</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#f1f5f9', color: '#64748b' }}>{solicitudes.length} total</span>
            </div>
            {solicitudes.length === 0 ? (
              <p className="text-sm text-gray-400 py-2 text-center">Sin solicitudes</p>
            ) : (
              <div className="space-y-2">
                {solicitudes.map(s => {
                  const estSol = solicitudEstadoCfg[s.estado as keyof typeof solicitudEstadoCfg] ?? { label: s.estado, bg: '#f1f5f9', color: '#64748b' }
                  return (
                    <div key={s.id} className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{s.titulo}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: estSol.bg, color: estSol.color }}>{estSol.label}</span>
                      </div>
                      <p className="text-xs text-gray-400">{formatFecha(s.creadoEn, { day: 'numeric', month: 'short', year: 'numeric' })} · {s.categoria}</p>
                    </div>
                  )
                })}
              </div>
            )}
            <Link href="/mantenciones" className="block w-full mt-4 py-2 rounded-xl text-sm font-semibold text-center hover:opacity-80 transition-opacity" style={{ background: '#f1f5f9', color: '#1e3a5f' }}>
              Ver mantenciones
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
