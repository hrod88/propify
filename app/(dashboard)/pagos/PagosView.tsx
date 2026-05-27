'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatCLP } from '@/lib/mock-data'
import type { Pago, Unidad, User } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────
type MesFiltro    = 'todos' | '5-2026' | '4-2026' | '3-2026'
type MetodoFiltro = 'todos' | 'transferencia' | 'webpay' | 'efectivo' | 'tarjeta'

// ─── Configs ──────────────────────────────────────────────────
const metodoCfg = {
  transferencia: { label: 'Transferencia', bg: '#dbeafe', color: '#2563ae' },
  webpay:        { label: 'Webpay',        bg: '#dcfce7', color: '#16a34a' },
  efectivo:      { label: 'Efectivo',      bg: '#fef3c7', color: '#d97706' },
  tarjeta:       { label: 'Tarjeta',       bg: '#f3e8ff', color: '#7c3aed' },
  cheque:        { label: 'Cheque',        bg: '#f1f5f9', color: '#64748b' },
} as const

const estadoCfg = {
  completado: { Icon: CheckCircle, color: '#16a34a', label: 'Completado' },
  pendiente:  { Icon: Clock,       color: '#d97706', label: 'Pendiente' },
  rechazado:  { Icon: XCircle,     color: '#dc2626', label: 'Rechazado' },
} as const

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ─── Props ────────────────────────────────────────────────────
interface Props {
  pagos: Pago[]
  unidades: Unidad[]
  users: User[]
}

// ─── Componente ───────────────────────────────────────────────
export default function PagosView({ pagos, unidades, users }: Props) {
  const [mesFiltro,    setMesFiltro]    = useState<MesFiltro>('todos')
  const [metodoFiltro, setMetodoFiltro] = useState<MetodoFiltro>('todos')
  const [busqueda,     setBusqueda]     = useState('')

  const filtered = useMemo(() => {
    return pagos.filter(p => {
      if (mesFiltro !== 'todos') {
        const [mes, año] = mesFiltro.split('-').map(Number)
        if (p.mes !== mes || p.año !== año) return false
      }
      if (metodoFiltro !== 'todos' && p.metodo !== metodoFiltro) return false
      if (busqueda) {
        const q       = busqueda.toLowerCase()
        const unidad  = unidades.find(u => u.id === p.unidadId)
        const uid     = unidad?.arrendatarioId ?? unidad?.propietarioId
        const res     = uid ? users.find(u => u.id === uid) : undefined
        const nombre  = res ? `${res.nombre} ${res.apellido}`.toLowerCase() : ''
        const nro     = unidad?.numero?.toLowerCase() ?? ''
        const comp    = p.comprobante?.toLowerCase() ?? ''
        if (!nombre.includes(q) && !nro.includes(q) && !comp.includes(q)) return false
      }
      return true
    })
  }, [pagos, mesFiltro, metodoFiltro, busqueda, unidades, users])

  const totalGlobal   = pagos.reduce((s, p) => s + p.monto, 0)
  const totalFiltrado = filtered.reduce((s, p) => s + p.monto, 0)

  const getUnidad    = (id: string) => unidades.find(u => u.id === id)
  const getResidente = (unidad?: Unidad) => {
    if (!unidad) return null
    const uid = unidad.arrendatarioId ?? unidad.propietarioId
    if (!uid) return null
    const u = users.find(u => u.id === uid)
    return u ? `${u.nombre} ${u.apellido}` : null
  }

  const mesesFiltros: { value: MesFiltro; label: string }[] = [
    { value: 'todos',  label: 'Todos' },
    { value: '5-2026', label: 'Mayo 2026' },
    { value: '4-2026', label: 'Abril 2026' },
    { value: '3-2026', label: 'Marzo 2026' },
  ]

  const metodosFiltros: { value: MetodoFiltro; label: string }[] = [
    { value: 'todos',         label: 'Todos' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'webpay',        label: 'Webpay' },
    { value: 'efectivo',      label: 'Efectivo' },
    { value: 'tarjeta',       label: 'Tarjeta' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-500 mt-1">
            {pagos.length} pagos registrados · {formatCLP(totalGlobal)} total recaudado
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Registrar pago
        </button>
      </div>

      {/* Resumen por método */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['transferencia', 'webpay', 'efectivo', 'tarjeta'] as const).map(metodo => {
          const cfg   = metodoCfg[metodo]
          const tot   = pagos.filter(p => p.metodo === metodo).reduce((s, p) => s + p.monto, 0)
          const count = pagos.filter(p => p.metodo === metodo).length
          return (
            <div
              key={metodo}
              className="bg-white rounded-2xl border shadow-sm p-4"
              style={{ borderColor: '#e2e8f0' }}
            >
              <span
                className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
              <p className="text-lg font-bold text-gray-900">{formatCLP(tot)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {count} pago{count !== 1 ? 's' : ''}
              </p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div
        className="bg-white rounded-2xl border shadow-sm p-4"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Mes */}
          <div className="flex items-center gap-1 flex-wrap">
            {mesesFiltros.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setMesFiltro(value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  mesFiltro === value
                    ? { background: '#2563ae', color: 'white' }
                    : { background: '#f1f5f9', color: '#64748b' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* Método */}
          <div className="flex items-center gap-1 flex-wrap">
            {metodosFiltros.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setMetodoFiltro(value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  metodoFiltro === value
                    ? { background: '#1e3a5f', color: 'white' }
                    : { background: '#f1f5f9', color: '#64748b' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Búsqueda */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Unidad, residente, comprobante..."
              className="pl-9 pr-4 py-1.5 rounded-lg border text-sm outline-none transition-all"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#0f172a', width: 240 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#2563ae'; e.currentTarget.style.background = 'white' }}
              onBlur={e  => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
            />
          </div>
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
                {['Fecha', 'Unidad', 'Residente', 'Monto', 'Mes', 'Método', 'Comprobante / Nota', 'Estado'].map(h => (
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
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No se encontraron pagos
                  </td>
                </tr>
              ) : filtered.map(p => {
                const unidad    = getUnidad(p.unidadId)
                const residente = getResidente(unidad)
                const met       = metodoCfg[p.metodo] ?? { label: p.metodo, bg: '#f1f5f9', color: '#64748b' }
                const est       = estadoCfg[p.estado]
                const { Icon }  = est

                return (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#f8fafc' }}
                  >
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(p.creadoEn).toLocaleDateString('es-CL', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-gray-900">
                        {unidad ? `Unidad ${unidad.numero}` : p.unidadId}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">
                      {residente ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-gray-900">{formatCLP(p.monto)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {MESES[p.mes]} {p.año}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: met.bg, color: met.color }}
                      >
                        {met.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.comprobante ? (
                        <span className="text-xs font-mono text-gray-500">{p.comprobante}</span>
                      ) : p.nota ? (
                        <span className="text-xs text-gray-400 italic">{p.nota}</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: est.color }}
                      >
                        <Icon className="w-3 h-3" />
                        {est.label}
                      </span>
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
              Mostrando {filtered.length} de {pagos.length} pagos
            </p>
            <p className="text-xs font-bold text-gray-700">
              Total: {formatCLP(totalFiltrado)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
