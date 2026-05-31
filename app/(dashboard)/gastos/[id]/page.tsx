import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowLeft, ChevronRight,
  CheckCircle, Clock, XCircle, AlertCircle,
  DollarSign, Home, User, Mail, Phone, Calendar, FileDown,
} from 'lucide-react'
import { getGastoComunById, getUnidades, getUsuarios, formatCLP } from '@/lib/db'
import { getEdificioActual, getUsuarioActual } from '@/lib/auth-helpers'
import RegistrarPagoButton from '@/components/gastos/RegistrarPagoButton'

type PageProps = { params: Promise<{ id: string }> }

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const pagoCfg = {
  pagado:   { Icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', label: 'Pagado' },
  pendiente:{ Icon: Clock,       color: '#d97706', bg: '#fef3c7', label: 'Pendiente' },
  vencido:  { Icon: XCircle,     color: '#dc2626', bg: '#fee2e2', label: 'Vencido' },
  parcial:  { Icon: AlertCircle, color: '#9333ea', bg: '#f3e8ff', label: 'Pago parcial' },
} as const

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const [gasto, unidades] = await Promise.all([getGastoComunById(id), getUnidades()])
  if (!gasto) return { title: 'Gasto' }
  const unidad = unidades.find(u => u.id === gasto.unidadId)
  return { title: `Unidad ${unidad?.numero ?? ''} · ${MESES[gasto.mes]} ${gasto['año']}` }
}

export default async function GastoDetailPage({ params }: PageProps) {
  const { id } = await params
  const [edificioId, usuarioActual] = await Promise.all([
    getEdificioActual(),
    getUsuarioActual(),
  ])
  const [gasto, unidades, users] = await Promise.all([
    getGastoComunById(id),
    getUnidades(edificioId),
    getUsuarios(edificioId),
  ])
  if (!gasto) return notFound()

  const unidad    = unidades.find(u => u.id === gasto.unidadId)
  const uid       = unidad?.arrendatarioId ?? unidad?.propietarioId
  const residente = uid ? users.find(u => u.id === uid) : undefined
  const cfg       = pagoCfg[gasto.estadoPago as keyof typeof pagoCfg]
  const { Icon }  = cfg

  const conceptos = [
    { label: 'Gastos base',      monto: gasto.montoBase },
    { label: 'Agua',             monto: gasto.montoAgua ?? 0 },
    { label: 'Electricidad',     monto: gasto.montoElectricidad ?? 0 },
    { label: 'Gas',              monto: gasto.montoGas ?? 0 },
    { label: 'Fondo de reserva', monto: gasto.montoFondoReserva ?? 0 },
  ].filter(c => c.monto > 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/gastos" className="flex items-center gap-1.5 font-medium hover:opacity-75 transition-opacity" style={{ color: '#2563ae' }}>
          <ArrowLeft className="w-4 h-4" /> Gastos Comunes
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span>Unidad {unidad?.numero} · {MESES[gasto.mes]} {gasto['año']}</span>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-gray-900">Unidad {unidad?.numero ?? gasto.unidadId}</h1>
              <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                <Icon className="w-3.5 h-3.5" />{cfg.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              {MESES[gasto.mes]} {gasto['año']} · Vence{' '}
              {new Date(gasto.fechaVencimiento).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Total cobrado</p>
            <p className="text-3xl font-bold text-gray-900 mb-3">{formatCLP(gasto.montoTotal)}</p>
            <a
              href={`/api/liquidacion/${gasto.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#dc2626' }}
            >
              <FileDown className="w-4 h-4" />
              Descargar PDF
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4" style={{ color: '#16a34a' }} />
              <h2 className="font-bold text-gray-900">Desglose del cobro</h2>
            </div>
            <div className="space-y-2">
              {conceptos.map(({ label, monto }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCLP(monto)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-4 rounded-xl mt-2" style={{ background: '#1e3a5f' }}>
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-xl font-bold text-white">{formatCLP(gasto.montoTotal)}</span>
              </div>
            </div>
          </div>

          {(gasto.estadoPago === 'pagado' || gasto.estadoPago === 'parcial') && gasto.fechaPago && (
            <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4" style={{ color: '#2563ae' }} />
                <h2 className="font-bold text-gray-900">Información de pago</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                  <p className="text-xs text-gray-400">Fecha de pago</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {new Date(gasto.fechaPago).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                  <p className="text-xs text-gray-400">Estado</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
                </div>
              </div>
            </div>
          )}

          {gasto.diasMora && (
            <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: '#fff5f5', borderColor: '#fecaca' }}>
              <XCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#dc2626' }}>{gasto.diasMora} días en mora</p>
                <p className="text-xs text-red-600 mt-0.5">Este cobro no ha sido pagado después de la fecha de vencimiento. Se recomienda enviar un recordatorio al residente.</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-4 h-4" style={{ color: '#2563ae' }} />
              <h2 className="font-bold text-gray-900">Unidad</h2>
            </div>
            {unidad ? (
              <div>
                {[
                  { label: 'Número',     value: `Nº ${unidad.numero}` },
                  { label: 'Piso',       value: unidad.piso > 0 ? `Piso ${unidad.piso}` : 'Planta baja' },
                  { label: 'Superficie', value: `${unidad.superficieM2} m²` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2.5 border-b last:border-0" style={{ borderColor: '#f1f5f9' }}>
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-sm font-semibold text-gray-900">{value}</span>
                  </div>
                ))}
                <Link href={`/unidades/${unidad.id}`} className="block text-xs font-semibold mt-3 hover:opacity-75 transition-opacity" style={{ color: '#2563ae' }}>Ver unidad →</Link>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin información de unidad</p>
            )}
          </div>

          {residente && (
            <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4" style={{ color: '#7c3aed' }} />
                <h2 className="font-bold text-gray-900">Responsable</h2>
              </div>
              <p className="font-bold text-gray-900">{residente.nombre} {residente.apellido}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{residente.rol}</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 truncate">{residente.email}</span>
                </div>
                {residente.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-500">{residente.telefono}</span>
                  </div>
                )}
              </div>
              <Link href={`/residentes/${residente.id}`} className="block text-xs font-semibold mt-3 hover:opacity-75 transition-opacity" style={{ color: '#2563ae' }}>Ver perfil →</Link>
            </div>
          )}

          {gasto.estadoPago !== 'pagado' && (
            <div className="space-y-2">
              <RegistrarPagoButton
                gastoId={gasto.id}
                montoTotal={gasto.montoTotal}
                unidadNumero={unidad?.numero ?? '?'}
                mesNombre={MESES[gasto.mes]}
                año={gasto['año'] as number}
                mes={gasto.mes}
                edificioId={edificioId}
                unidadId={gasto.unidadId}
                registradoPorId={usuarioActual.id}
              />
              <button
                disabled
                title="Próximamente: envío de email con Resend"
                className="w-full py-2.5 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed"
                style={{ background: '#f1f5f9', color: '#1e3a5f' }}
              >
                Enviar recordatorio por email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
