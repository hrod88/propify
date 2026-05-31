/**
 * /portal/pagar/[id]
 * Página pública (sin autenticación) donde el residente puede ver
 * su liquidación de gastos comunes y las instrucciones de pago.
 * La URL se incluye como QR en el PDF impreso.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle, Clock, XCircle, AlertCircle,
  DollarSign, Building2, FileDown, Home, User, Mail, Phone,
  CreditCard, Calendar,
} from 'lucide-react'
import { getGastoComunById, getUnidades, getUsuarios, getEdificioById, formatCLP } from '@/lib/db'
import { notFound } from 'next/navigation'
import WebPayButton from './WebPayButton'

type PageProps = { params: Promise<{ id: string }> }

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const estadoCfg = {
  pagado:    { Icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', border: '#86efac', label: 'Pagado' },
  pendiente: { Icon: Clock,       color: '#d97706', bg: '#fef3c7', border: '#fde68a', label: 'Pendiente de pago' },
  vencido:   { Icon: XCircle,     color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', label: 'Vencido — en mora' },
  parcial:   { Icon: AlertCircle, color: '#7c3aed', bg: '#f3e8ff', border: '#d8b4fe', label: 'Pago parcial' },
} as const

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const gasto = await getGastoComunById(id)
  if (!gasto) return { title: 'Liquidación' }
  const unidades = await getUnidades(gasto.edificioId)
  const unidad   = unidades.find(u => u.id === gasto.unidadId)
  const año      = gasto['año'] as number
  return {
    title: `Liquidación GC · Unidad ${unidad?.numero ?? ''} · ${MESES[gasto.mes]} ${año}`,
    robots: 'noindex',
  }
}

export default async function PortalPagarPage({ params }: PageProps) {
  const { id } = await params

  const gasto = await getGastoComunById(id)
  if (!gasto) return notFound()

  const [unidades, users, edificio] = await Promise.all([
    getUnidades(gasto.edificioId),
    getUsuarios(gasto.edificioId),
    getEdificioById(gasto.edificioId),
  ])

  const unidad    = unidades.find(u => u.id === gasto.unidadId)
  const uid       = unidad?.arrendatarioId ?? unidad?.propietarioId
  const residente = uid ? users.find(u => u.id === uid) : undefined
  const año       = gasto['año'] as number
  const cfg       = estadoCfg[gasto.estadoPago as keyof typeof estadoCfg] ?? estadoCfg.pendiente
  const { Icon }  = cfg
  const isPaid    = gasto.estadoPago === 'pagado'

  const conceptos = [
    { label: 'Gastos comunes base',                       monto: gasto.montoBase },
    { label: 'Fondo de reserva',                          monto: gasto.montoFondoReserva  ?? 0 },
    { label: 'Agua caliente',                             monto: gasto.montoAgua           ?? 0 },
    { label: 'Electricidad',                              monto: gasto.montoElectricidad   ?? 0 },
    { label: 'Gas / Calefacción',                         monto: gasto.montoGas            ?? 0 },
    { label: gasto.notaMultas ?? 'Cargos adicionales',    monto: gasto.montoMultas         ?? 0 },
  ].filter(c => c.monto > 0)

  const diasMora    = gasto.diasMora ?? 0
  const recargoMora = diasMora > 0 ? Math.round(gasto.montoTotal * 0.0005 * diasMora) : 0

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f8' }}>

      {/* ── Header de marca ─────────────────────────────────── */}
      <header style={{ background: '#1e3a5f' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#2563ae' }}
            >
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">propify</p>
              <p className="text-blue-300 text-xs mt-0.5">{edificio?.nombre ?? 'Portal de Pagos'}</p>
            </div>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* ── Tarjeta principal ─────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
          {/* Franja top */}
          <div className="px-6 py-5" style={{ background: '#1e3a5f' }}>
            <p className="text-blue-300 text-xs font-semibold tracking-widest uppercase mb-1">
              Liquidación de Gastos Comunes
            </p>
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-white text-2xl font-bold">Unidad {unidad?.numero ?? '—'}</h1>
                <p className="text-blue-200 text-sm mt-1">
                  {MESES[gasto.mes]} {año}
                  {' · '}
                  Vence{' '}
                  {new Date(gasto.fechaVencimiento + 'T12:00:00').toLocaleDateString('es-CL', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-blue-300 text-xs mb-1">TOTAL A PAGAR</p>
                <p className="text-white text-3xl font-bold">{formatCLP(gasto.montoTotal)}</p>
              </div>
            </div>
          </div>

          {/* Si está pagado — confirmación verde */}
          {isPaid && gasto.fechaPago && (
            <div className="px-6 py-4 flex items-center gap-3" style={{ background: '#dcfce7', borderBottom: '1px solid #86efac' }}>
              <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#16a34a' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#16a34a' }}>Pago confirmado</p>
                <p className="text-xs" style={{ color: '#166534' }}>
                  Fecha de pago:{' '}
                  {new Date(gasto.fechaPago + 'T12:00:00').toLocaleDateString('es-CL', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Mora */}
          {diasMora > 0 && (
            <div className="px-6 py-4 flex items-start gap-3" style={{ background: '#fff5f5', borderBottom: '1px solid #fecaca' }}>
              <XCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
              <div>
                <p className="font-bold text-sm" style={{ color: '#dc2626' }}>{diasMora} días en mora</p>
                {recargoMora > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>
                    Recargo estimado: <strong>{formatCLP(recargoMora)}</strong> (0,05% diario · referencial)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Desglose */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4" style={{ color: '#16a34a' }} />
              <h2 className="font-bold text-gray-900">Desglose del cobro</h2>
            </div>
            <div className="space-y-2">
              {conceptos.map(({ label, monto }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: '#f8fafc' }}
                >
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCLP(monto)}</span>
                </div>
              ))}
              <div
                className="flex items-center justify-between px-4 py-4 rounded-xl mt-2"
                style={{ background: '#1e3a5f' }}
              >
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-xl font-bold text-white">{formatCLP(gasto.montoTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Instrucciones de pago ────────────────────────── */}
        {!isPaid && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
            <div className="px-6 py-4" style={{ background: '#1e3a5f' }}>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-300" />
                <h2 className="font-bold text-white text-sm">Cómo pagar</h2>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Botón WebPay */}
              <WebPayButton gastoId={id} monto={gasto.montoTotal} />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Transferencia bancaria
                </p>
                <div className="space-y-2.5">
                  {[
                    ['Beneficiario',   `Comunidad ${edificio?.nombre ?? ''}`],
                    ...(edificio?.rut             ? [['RUT',          edificio.rut]]             : []),
                    ...(edificio?.banco           ? [['Banco',        edificio.banco]]           : []),
                    ...(edificio?.cuentaCorriente ? [['Cta. Cte.',    edificio.cuentaCorriente]] : []),
                    ...(edificio?.emailPago       ? [['Email pago',   edificio.emailPago]]       : []),
                    ['Referencia',     `GC Unidad ${unidad?.numero ?? ''} ${MESES[gasto.mes]} ${año}`],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="flex gap-3">
                      <span className="text-xs text-gray-400 w-24 shrink-0 mt-0.5">{lbl}</span>
                      <span className="text-sm font-semibold text-gray-900 flex-1">{val}</span>
                    </div>
                  ))}
                </div>
                {(edificio?.telefonoAdmin || edificio?.horarioAdmin) && (
                  <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: '#f1f5f9' }}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contacto administración</p>
                    {edificio.telefonoAdmin && (
                      <div className="flex gap-3">
                        <span className="text-xs text-gray-400 w-24 shrink-0">Teléfono</span>
                        <span className="text-sm font-semibold text-gray-900">{edificio.telefonoAdmin}</span>
                      </div>
                    )}
                    {edificio.horarioAdmin && (
                      <div className="flex gap-3">
                        <span className="text-xs text-gray-400 w-24 shrink-0">Horario</span>
                        <span className="text-sm font-semibold text-gray-900">{edificio.horarioAdmin}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl mt-2"
                style={{ background: '#fff5f5', border: '1px solid #fecaca' }}
              >
                <Calendar className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} />
                <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>
                  Fecha límite:{' '}
                  {new Date(gasto.fechaVencimiento + 'T12:00:00').toLocaleDateString('es-CL', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Residente + Unidad ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Unidad */}
          <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: '1px solid #e2e8f0' }}>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-4 h-4" style={{ color: '#2563ae' }} />
              <h2 className="font-bold text-gray-900 text-sm">Unidad</h2>
            </div>
            {unidad ? (
              <div className="space-y-2">
                {[
                  ['Número',     `N° ${unidad.numero}`],
                  ['Piso',       unidad.piso > 0 ? `Piso ${unidad.piso}` : 'Planta baja'],
                  ['Superficie', `${unidad.superficieM2} m²`],
                ].map(([lbl, val]) => (
                  <div key={lbl} className="flex justify-between items-center py-1.5 border-b last:border-0" style={{ borderColor: '#f1f5f9' }}>
                    <span className="text-xs text-gray-400">{lbl}</span>
                    <span className="text-sm font-semibold text-gray-900">{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin información</p>
            )}
          </div>

          {/* Residente */}
          {residente ? (
            <div className="bg-white rounded-2xl shadow-sm p-5" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4" style={{ color: '#7c3aed' }} />
                <h2 className="font-bold text-gray-900 text-sm">Responsable</h2>
              </div>
              <p className="font-bold text-gray-900">{residente.nombre} {residente.apellido}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{residente.rol}</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500 truncate">{residente.email}</span>
                </div>
                {residente.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">{residente.telefono}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-center" style={{ border: '1px solid #e2e8f0' }}>
              <p className="text-sm text-gray-400">Sin residente asignado</p>
            </div>
          )}
        </div>

        {/* ── Descargar PDF ────────────────────────────────── */}
        <a
          href={`/api/liquidacion/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: '#dc2626' }}
        >
          <FileDown className="w-4 h-4" />
          Descargar PDF oficial
        </a>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="text-center pb-6">
          <p className="text-xs text-gray-400">
            Este documento fue generado por{' '}
            <Link href="https://propify-rust.vercel.app" className="font-semibold" style={{ color: '#2563ae' }}>
              propify.cl
            </Link>
            {' '}en nombre de la administración de {edificio?.nombre ?? 'tu edificio'}.
          </p>
        </div>

      </main>
    </div>
  )
}
