'use client'

/**
 * GastosView — Fase 21: CRUD admin de gastos comunes
 * Generar cobros mensuales (Create), Editar estado/monto, Liquidar (quick), Eliminar.
 */

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, Clock, AlertTriangle,
  CheckCircle, XCircle, AlertCircle, Plus, Edit2, Trash2, X, Check,
} from 'lucide-react'
import { formatCLP } from '@/lib/mock-data'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useNotificaciones } from '@/context/notificaciones-context'
import type { GastoComun, Unidad, User, EstadoPago } from '@/types'

// ─── Tipos locales ────────────────────────────────────────────
type EstadoFiltro = 'todos' | EstadoPago

// ─── Configs ──────────────────────────────────────────────────
const pagoCfg: Record<EstadoPago, { Icon: React.ElementType; color: string; bg: string; label: string }> = {
  pagado:    { Icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', label: 'Pagado' },
  pendiente: { Icon: Clock,       color: '#d97706', bg: '#fef3c7', label: 'Pendiente' },
  vencido:   { Icon: XCircle,     color: '#dc2626', bg: '#fee2e2', label: 'Vencido' },
  parcial:   { Icon: AlertCircle, color: '#9333ea', bg: '#f3e8ff', label: 'Pago parcial' },
}

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatFecha(iso: string) {
  try { return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) }
  catch { return iso }
}

/** Vencimiento: día 5 del mes siguiente al período */
function calcFechaVenc(mes: number, año: number): string {
  const m = mes === 12 ? 1   : mes + 1
  const y = mes === 12 ? año + 1 : año
  return `${y}-${String(m).padStart(2,'0')}-05`
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  gastos:   GastoComun[]
  unidades: Unidad[]
  users:    User[]
}

interface FormCrear {
  mes:               number
  año:               number
  montoBase:         number
  montoFondoReserva: number
}

interface FormEdit {
  estadoPago:       EstadoPago
  montoTotal:       number
  fechaVencimiento: string
}

// ─── Componente ───────────────────────────────────────────────
export default function GastosView({ gastos: initial, unidades, users }: Props) {
  const { agregarNotificacion } = useNotificaciones()

  const [gastos,  setGastos]  = useState<GastoComun[]>(initial)
  const [filtro,  setFiltro]  = useState<EstadoFiltro>('todos')

  // ── Modal: Generar cobro ───────────────────────────────────
  const [modalCrear, setModalCrear] = useState(false)
  const [formCrear,  setFormCrear]  = useState<FormCrear>({
    mes:               new Date().getMonth() + 1,
    año:               new Date().getFullYear(),
    montoBase:         85_000,
    montoFondoReserva: 10_000,
  })
  const [erroresCrear, setErroresCrear] = useState<Partial<Record<keyof FormCrear, string>>>({})
  const [generando,    setGenerando]    = useState(false)

  // ── Modal: Editar ──────────────────────────────────────────
  const [editandoId,  setEditandoId]  = useState<string | null>(null)
  const [formEdit,    setFormEdit]    = useState<FormEdit>({ estadoPago: 'pendiente', montoTotal: 0, fechaVencimiento: '' })
  const [erroresEdit, setErroresEdit] = useState<Partial<Record<keyof FormEdit, string>>>({})

  // ── Confirmar eliminar ─────────────────────────────────────
  const [eliminarId, setEliminarId] = useState<string | null>(null)

  // ── Computed ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filtro === 'todos') return gastos
    return gastos.filter(g => g.estadoPago === filtro)
  }, [gastos, filtro])

  const totalCobrado   = gastos.reduce((s, g) => s + g.montoTotal, 0)
  const recaudado      = gastos.filter(g => g.estadoPago === 'pagado').reduce((s, g) => s + g.montoTotal, 0)
  const pendienteTotal = gastos.filter(g => g.estadoPago === 'pendiente').reduce((s, g) => s + g.montoTotal, 0)
  const moroso         = gastos.filter(g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial').reduce((s, g) => s + g.montoTotal, 0)
  const pctRecaudado   = totalCobrado > 0 ? Math.round(recaudado / totalCobrado * 100) : 0

  const conteos = {
    todos:    gastos.length,
    pagado:   gastos.filter(g => g.estadoPago === 'pagado').length,
    pendiente:gastos.filter(g => g.estadoPago === 'pendiente').length,
    vencido:  gastos.filter(g => g.estadoPago === 'vencido').length,
    parcial:  gastos.filter(g => g.estadoPago === 'parcial').length,
  }

  /** Si ya existen cobros para el período seleccionado */
  const periodoExiste = useMemo(
    () => gastos.some(g => g.mes === formCrear.mes && g.año === formCrear.año),
    [gastos, formCrear.mes, formCrear.año],
  )

  const getUnidad = (id: string) => unidades.find(u => u.id === id)
  const getResidente = (unidad?: Unidad) => {
    if (!unidad) return null
    const uid = unidad.arrendatarioId ?? unidad.propietarioId
    if (!uid) return null
    const u = users.find(u => u.id === uid)
    return u ? { nombre: `${u.nombre} ${u.apellido}`, rol: u.rol === 'arrendatario' ? 'Arr.' : 'Prop.' } : null
  }

  const mesRef = gastos[0]?.mes ?? new Date().getMonth() + 1
  const añoRef = gastos[0]?.año ?? new Date().getFullYear()

  // ── Acciones CRUD ──────────────────────────────────────────

  /** Genera un gasto por cada unidad para el período indicado */
  const handleGenerar = useCallback(async () => {
    const err: typeof erroresCrear = {}
    if (formCrear.montoBase < 1) err.montoBase = 'Ingrese un monto válido'
    if (Object.keys(err).length) { setErroresCrear(err); return }

    if (periodoExiste) {
      const ok = window.confirm(
        `Ya existen cobros para ${MESES[formCrear.mes]} ${formCrear.año}. ¿Agregar igualmente?`,
      )
      if (!ok) return
    }

    setGenerando(true)
    const fechaVencimiento = calcFechaVenc(formCrear.mes, formCrear.año)
    const montoTotal       = formCrear.montoBase + formCrear.montoFondoReserva

    const nuevos: GastoComun[] = unidades.map(u => ({
      id:               crypto.randomUUID(),
      edificioId:       u.edificioId,
      unidadId:         u.id,
      mes:              formCrear.mes,
      año:              formCrear.año,
      montoBase:        formCrear.montoBase,
      montoFondoReserva:formCrear.montoFondoReserva,
      montoTotal,
      estadoPago:       'pendiente' as EstadoPago,
      fechaVencimiento,
      diasMora:         0,
    }))

    // Optimistic
    setGastos(prev => [...nuevos, ...prev])
    setModalCrear(false)
    setGenerando(false)

    // Persist (fire-and-forget)
    supabaseBrowser
      .from('gastos_comunes')
      .insert(
        nuevos.map(({ id, edificioId, unidadId, mes, año, montoBase, montoFondoReserva, montoTotal, estadoPago, fechaVencimiento, diasMora }) =>
          ({ id, edificioId, unidadId, mes, año, montoBase, montoFondoReserva, montoTotal, estadoPago, fechaVencimiento, diasMora }),
        ),
      )
      .then(({ error }) => { if (error) console.warn('[Gastos] Error generando:', error.message) })

    agregarNotificacion(
      'pago',
      'Cobros generados',
      `${nuevos.length} gastos comunes — ${MESES[formCrear.mes]} ${formCrear.año}`,
    )
  }, [formCrear, unidades, periodoExiste, agregarNotificacion])

  /** Abre el modal de edición cargando los valores del gasto */
  const abrirEditar = useCallback((g: GastoComun) => {
    setEditandoId(g.id)
    setFormEdit({
      estadoPago:      g.estadoPago,
      montoTotal:      g.montoTotal,
      fechaVencimiento:g.fechaVencimiento.slice(0, 10),
    })
    setErroresEdit({})
  }, [])

  /** Guarda los cambios del modal de edición */
  const handleEditar = useCallback(() => {
    if (!editandoId) return
    const err: typeof erroresEdit = {}
    if (formEdit.montoTotal < 1)    err.montoTotal = 'Monto inválido'
    if (!formEdit.fechaVencimiento) err.fechaVencimiento = 'Fecha requerida'
    if (Object.keys(err).length) { setErroresEdit(err); return }

    setGastos(prev => prev.map(g => g.id === editandoId ? { ...g, ...formEdit } : g))
    const id = editandoId
    setEditandoId(null)

    supabaseBrowser
      .from('gastos_comunes')
      .update({ estadoPago: formEdit.estadoPago, montoTotal: formEdit.montoTotal, fechaVencimiento: formEdit.fechaVencimiento })
      .eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Gastos] Error editando:', error.message) })

    agregarNotificacion('pago', 'Gasto actualizado', `Estado → ${pagoCfg[formEdit.estadoPago].label}`)
  }, [editandoId, formEdit, agregarNotificacion])

  /** Marca el gasto como pagado directamente desde la tabla */
  const handleLiquidar = useCallback((id: string) => {
    setGastos(prev =>
      prev.map(g => g.id === id ? { ...g, estadoPago: 'pagado' as EstadoPago, diasMora: 0 } : g),
    )
    supabaseBrowser
      .from('gastos_comunes')
      .update({ estadoPago: 'pagado', diasMora: 0 })
      .eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Gastos] Error liquidando:', error.message) })
    agregarNotificacion('pago', 'Gasto liquidado', 'Marcado como pagado exitosamente')
  }, [agregarNotificacion])

  /** Elimina el gasto confirmado */
  const handleEliminar = useCallback(() => {
    if (!eliminarId) return
    setGastos(prev => prev.filter(g => g.id !== eliminarId))
    const id = eliminarId
    setEliminarId(null)
    supabaseBrowser
      .from('gastos_comunes')
      .delete()
      .eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Gastos] Error eliminando:', error.message) })
    agregarNotificacion('mora', 'Gasto eliminado', 'El registro fue removido correctamente')
  }, [eliminarId, agregarNotificacion])

  const mesVencLabel = formCrear.mes === 12 ? MESES[1] : MESES[formCrear.mes + 1]
  const añoVencLabel = formCrear.mes === 12 ? formCrear.año + 1 : formCrear.año

  // ── JSX ────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Comunes</h1>
          <p className="text-gray-500 mt-1">
            {MESES[mesRef]} {añoRef} · {gastos.length} unidades cobradas
          </p>
        </div>
        <button
          onClick={() => {
            setFormCrear(f => ({ ...f, mes: new Date().getMonth() + 1, año: new Date().getFullYear() }))
            setErroresCrear({})
            setModalCrear(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Generar cobro
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total cobrado', value: formatCLP(totalCobrado),   Icon: DollarSign,    color: '#2563ae', bg: '#dbeafe', desc: `${gastos.length} unidades` },
          { label: 'Recaudado',     value: formatCLP(recaudado),      Icon: TrendingUp,    color: '#16a34a', bg: '#dcfce7', desc: `${pctRecaudado}% del total` },
          { label: 'Por cobrar',    value: formatCLP(pendienteTotal), Icon: Clock,         color: '#d97706', bg: '#fef3c7', desc: `${conteos.pendiente} pendiente${conteos.pendiente !== 1 ? 's' : ''}` },
          { label: 'En mora',       value: formatCLP(moroso),         Icon: AlertTriangle, color: '#dc2626', bg: '#fee2e2', desc: `${conteos.vencido + conteos.parcial} unidades` },
        ].map(({ label, value, Icon, color, bg, desc }) => (
          <div key={label} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
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

      {/* ── Tabs filtro ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-center gap-1 flex-wrap">
          {(
            [
              { value: 'todos'     as EstadoFiltro, label: `Todos (${conteos.todos})` },
              { value: 'pagado'    as EstadoFiltro, label: `Pagados (${conteos.pagado})` },
              { value: 'pendiente' as EstadoFiltro, label: `Pendientes (${conteos.pendiente})` },
              { value: 'vencido'   as EstadoFiltro, label: `Vencidos (${conteos.vencido})` },
              { value: 'parcial'   as EstadoFiltro, label: `Parcial (${conteos.parcial})` },
            ] as const
          ).map(({ value, label }) => (
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

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                {['Unidad', 'Residente', 'Monto total', 'Estado', 'Vencimiento', 'Días mora', 'Acciones'].map(h => (
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
                const cfg       = pagoCfg[g.estadoPago] ?? pagoCfg.pendiente
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
                      <div className="flex items-center gap-1">
                        {/* Ver detalle */}
                        <Link
                          href={`/gastos/${g.id}`}
                          title="Ver detalle"
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          style={{ color: '#2563ae' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>

                        {/* Liquidar rápido (solo si no está pagado) */}
                        {g.estadoPago !== 'pagado' && (
                          <button
                            onClick={() => handleLiquidar(g.id)}
                            title="Marcar como pagado"
                            className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                            style={{ color: '#16a34a' }}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Editar */}
                        <button
                          onClick={() => abrirEditar(g)}
                          title="Editar"
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          style={{ color: '#64748b' }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Eliminar */}
                        <button
                          onClick={() => setEliminarId(g.id)}
                          title="Eliminar"
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── Modal: Generar Cobro Mensual ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalCrear(false)}
          />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            style={{ border: '1px solid #e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Generar Cobro Mensual</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Crea un gasto por cada unidad del edificio ({unidades.length} unidades)
                </p>
              </div>
              <button
                onClick={() => setModalCrear(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Período */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mes</label>
                  <select
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: '#e2e8f0' }}
                    value={formCrear.mes}
                    onChange={e => setFormCrear(f => ({ ...f, mes: Number(e.target.value) }))}
                  >
                    {MESES.slice(1).map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Año</label>
                  <input
                    type="number"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: '#e2e8f0' }}
                    value={formCrear.año}
                    min={2020}
                    max={2035}
                    onChange={e => setFormCrear(f => ({ ...f, año: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Advertencia si ya existe el período */}
              {periodoExiste && (
                <div
                  className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: '#fef3c7' }}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#d97706' }} />
                  <p className="text-xs" style={{ color: '#92400e' }}>
                    Ya existen cobros para {MESES[formCrear.mes]} {formCrear.año}. Se agregarán registros adicionales.
                  </p>
                </div>
              )}

              {/* Montos */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Gasto común base (CLP)</label>
                <input
                  type="number"
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  style={{ borderColor: erroresCrear.montoBase ? '#dc2626' : '#e2e8f0' }}
                  value={formCrear.montoBase}
                  onChange={e => setFormCrear(f => ({ ...f, montoBase: Number(e.target.value) }))}
                />
                {erroresCrear.montoBase && (
                  <p className="text-xs text-red-500 mt-1">{erroresCrear.montoBase}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fondo de reserva (CLP)</label>
                <input
                  type="number"
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  style={{ borderColor: '#e2e8f0' }}
                  value={formCrear.montoFondoReserva}
                  onChange={e => setFormCrear(f => ({ ...f, montoFondoReserva: Number(e.target.value) }))}
                />
              </div>

              {/* Preview */}
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <div>
                  <p className="text-xs text-gray-400">Total por unidad</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCLP(formCrear.montoBase + formCrear.montoFondoReserva)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total edificio ({unidades.length} unidades)</p>
                  <p className="text-sm font-bold" style={{ color: '#2563ae' }}>
                    {formatCLP((formCrear.montoBase + formCrear.montoFondoReserva) * unidades.length)}
                  </p>
                </div>
              </div>

              {/* Vencimiento automático */}
              <p className="text-xs text-gray-400">
                📅 Vencimiento automático: 5 de {mesVencLabel} {añoVencLabel}
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalCrear(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#e2e8f0' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerar}
                disabled={generando}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: '#2563ae' }}
              >
                {generando ? 'Generando…' : `Generar ${unidades.length} cobros`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── Modal: Editar Gasto ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {editandoId && (() => {
        const g      = gastos.find(x => x.id === editandoId)
        const unidad = g ? getUnidad(g.unidadId) : null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setEditandoId(null)}
            />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Editar Gasto</h2>
                  {unidad && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Unidad {unidad.numero} · {g ? `${MESES[g.mes]} ${g.año}` : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setEditandoId(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Estado de pago</label>
                  <select
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: '#e2e8f0' }}
                    value={formEdit.estadoPago}
                    onChange={e => setFormEdit(f => ({ ...f, estadoPago: e.target.value as EstadoPago }))}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="vencido">Vencido</option>
                    <option value="parcial">Pago parcial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Monto total (CLP)</label>
                  <input
                    type="number"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: erroresEdit.montoTotal ? '#dc2626' : '#e2e8f0' }}
                    value={formEdit.montoTotal}
                    onChange={e => setFormEdit(f => ({ ...f, montoTotal: Number(e.target.value) }))}
                  />
                  {erroresEdit.montoTotal && (
                    <p className="text-xs text-red-500 mt-1">{erroresEdit.montoTotal}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fecha de vencimiento</label>
                  <input
                    type="date"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: erroresEdit.fechaVencimiento ? '#dc2626' : '#e2e8f0' }}
                    value={formEdit.fechaVencimiento}
                    onChange={e => setFormEdit(f => ({ ...f, fechaVencimiento: e.target.value }))}
                  />
                  {erroresEdit.fechaVencimiento && (
                    <p className="text-xs text-red-500 mt-1">{erroresEdit.fechaVencimiento}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditandoId(null)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditar}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: '#2563ae' }}
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── Confirmar eliminación ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      {eliminarId && (() => {
        const g      = gastos.find(x => x.id === eliminarId)
        const unidad = g ? getUnidad(g.unidadId) : null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setEliminarId(null)}
            />
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-4"
                style={{ background: '#fee2e2' }}
              >
                <Trash2 className="w-5 h-5" style={{ color: '#dc2626' }} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 text-center">¿Eliminar gasto?</h2>
              <p className="text-sm text-gray-500 text-center mt-2">
                {unidad ? `Unidad ${unidad.numero}` : 'Unidad desconocida'}
                {g ? ` · ${MESES[g.mes]} ${g.año} · ${formatCLP(g.montoTotal)}` : ''}
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">Esta acción no se puede deshacer.</p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEliminarId(null)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminar}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: '#dc2626' }}
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
