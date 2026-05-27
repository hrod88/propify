'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, Clock, AlertTriangle,
  CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'
import { formatCLP } from '@/lib/mock-data'
import type { GastoComun, Unidad, User } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────
type EstadoFiltro = 'todos' | 'pagado' | 'pendiente' | 'vencido' | 'parcial'

// ─── Configs ──────────────────────────────────────────────────
const pagoCfg = {
  pagado:   { Icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', label: 'Pagado' },
  pendiente:{ Icon: Clock,       color: '#d97706', bg: '#fef3c7', label: 'Pendiente' },
  vencido:  { Icon: XCircle,     color: '#dc2626', bg: '#fee2e2', label: 'Vencido' },
  parcial:  { Icon: AlertCircle, color: '#9333ea', bg: '#f3e8ff', label: 'Pago parcial' },
} as const

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  gastos: GastoComun[]
  unidades: Unidad[]
  users: User[]
}

// ─── Componente ───────────────────────────────────────────────
export default function GastosView({ gastos, unidades, users }: Props) {
  const [filtro, setFiltro] = useState<EstadoFiltro>('todos')

  const filtered = useMemo(() => {
    if (filtro === 'todos') return gastos
    return gastos.filter(g => g.estadoPago === filtro)
  }, [gastos, filtro])

  // ── Stats ──
  const totalCobrado = gastos.reduce((s, g) => s + g.montoTotal, 0)
  const recaudado    = gastos.filter(g => g.estadoPago === 'pagado').reduce((s, g) => s + g.montoTotal, 0)
  const pendiente    = gastos.filter(g => g.estadoPago === 'pendiente').reduce((s, g) => s + g.montoTotal, 0)
  const moroso       = gastos.filter(g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial').reduce((s, g) => s + g.montoTotal, 0)
  const pctRecaudado = totalCobrado > 0 ? Math.round(recaudado / totalCobrado * 100) : 0

  const conteos = {
    todos:    gastos.length,
    pagado:   gastos.filter(g => g.estadoPago === 'pagado').length,
    pendiente:gastos.filter(g => g.estadoPago === 'pendiente').length,
    vencido:  gastos.filter(g => g.estadoPago === 'vencido').length,
    parcial:  gastos.filter(g => g.estadoPago === 'parcial').length,
  }

  const tabs: { value: EstadoFiltro; label: string }[] = [
    { value: 'todos',    label: `Todos (${conteos.todos})` },
    { value: 'pagado',   label: `Pagados (${conteos.pagado})` },
    { value: 'pendiente',label: `Pendientes (${conteos.pendiente})` },
    { value: 'vencido',  label: `Vencidos (${conteos.vencido})` },
    { value: 'parcial',  label: `Parcial (${conteos.parcial})` },
  ]

  const getUnidad    = (id: string) => unidades.find(u => u.id === id)
  const getResidente = (unidad?: Unidad) => {
    if (!unidad) return null
    const uid = unidad.arrendatarioId ?? unidad.propietarioId
    if (!uid) return null
    const u = users.find(u => u.id === uid)
    return u ? { nombre: `${u.nombre} ${u.apellido}`, rol: u.rol === 'arrendatario' ? 'Arr.' : 'Prop.' } : null
  }

  const mesActual = gastos[0]?.mes ?? 5
  const añoActual = gastos[0]?.año ?? 2026

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Comunes</h1>
          <p className="text-gray-500 mt-1">
            {MESES[mesActual]} {añoActual} · {gastos.length} unidades cobradas
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <DollarSign className="w-4 h-4" />
          Generar cobro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total cobrado', value: formatCLP(totalCobrado), Icon: DollarSign,    color: '#2563ae', bg: '#dbeafe', desc: `${gastos.length} unidades` },
          { label: 'Recaudado',     value: formatCLP(recaudado),    Icon: TrendingUp,    color: '#16a34a', bg: '#dcfce7', desc: `${pctRecaudado}% del total` },
          { label: 'Por cobrar',    value: formatCLP(pendiente),    Icon: Clock,         color: '#d97706', bg: '#fef3c7', desc: `${conteos.pendiente} pendiente${conteos.pendiente !== 1 ? 's' : ''}` },
          { label: 'En mora',       value: formatCLP(moroso),       Icon: AlertTriangle, color: '#dc2626', bg: '#fee2e2', desc: `${conteos.vencido + conteos.parcial} unidades` },
        ].map(({ label, value, Icon, color, bg, desc }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border shadow-sm p-4"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs mt-1" style={{ color }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs filtro */}
      <div
        className="bg-white rounded-2xl border shadow-sm p-4"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div className="flex items-center gap-1 flex-wrap">
          {tabs.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltro(value)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                filtro === value
                  ? { background: '#2563ae', color: 'white' }
                  : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                {['Unidad', 'Residente', 'Monto total', 'Estado', 'Vencimiento', 'Días mora', ''].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No hay gastos con este estado
                  </td>
                </tr>
              ) : filtered.map(g => {
                const unidad    = getUnidad(g.unidadId)
                const residente = getResidente(unidad)
                const cfg       = pagoCfg[g.estadoPago]
                const { Icon }  = cfg

                return (
                  <tr
                    key={g.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#f8fafc' }}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-gray-900 text-sm">
                        {unidad ? `Unidad ${unidad.numero}` : g.unidadId}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {residente ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">{residente.nombre}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: '#f1f5f9', color: '#64748b' }}
                          >
                            {residente.rol}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin residente</span>
                      )}
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
                    <td className="px-4 py-3.5">
                      {g.diasMora ? (
                        <span className="text-sm font-bold" style={{ color: '#dc2626' }}>
                          {g.diasMora} días
                        </span>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/gastos/${g.id}`}
                        className="text-xs font-semibold hover:opacity-75 transition-opacity"
                        style={{ color: '#2563ae' }}
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div
            className="px-5 py-3 border-t flex items-center justify-between"
            style={{ borderColor: '#f1f5f9' }}
          >
            <p className="text-xs text-gray-400">
              Mostrando {filtered.length} de {gastos.length} gastos
            </p>
            <p className="text-xs font-semibold text-gray-600">
              Total filtrado: {formatCLP(filtered.reduce((s, g) => s + g.montoTotal, 0))}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
