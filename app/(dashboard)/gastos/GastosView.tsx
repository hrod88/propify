'use client'

/**
 * GastosView — Gastos Comunes
 * Mejoras v2:
 *   - Filtro por período (mes/año) — vista por mes estilo Comunidad Feliz
 *   - Cobro masivo con desglose completo (agua, electricidad, gas)
 *   - vencimiento corregido: día 5 del mes siguiente
 */

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, Clock, AlertTriangle,
  CheckCircle, XCircle, AlertCircle, Plus, Edit2, Trash2, X, Check, FileDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { formatCLP } from '@/lib/db'
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
const MESES_CORTO = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function formatFecha(iso: string) {
  try { return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }) }
  catch { return iso }
}

/** Vencimiento: día 5 del mes siguiente al período (ej: mayo → 5 junio) */
function calcFechaVenc(mes: number, año: number): string {
  const m = mes === 12 ? 1  : mes + 1
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
  montoAgua:         number
  montoElectricidad: number
  montoGas:          number
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

  // ── Período seleccionado ───────────────────────────────────
  const hoy = new Date()
  const [periodoSel, setPeriodoSel] = useState<{ mes: number; año: number }>(() => {
    const first = initial[0]
    if (!first) return { mes: hoy.getMonth() + 1, año: hoy.getFullYear() }
    return { mes: first.mes, año: first.año }
  })

  // Lista de períodos únicos disponibles (ordenados más reciente primero)
  const periodos = useMemo(() => {
    const map = new Map<string, { mes: number; año: number }>()
    gastos.forEach(g => {
      const añoG = g.año
      const key  = `${añoG}-${String(g.mes).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, { mes: g.mes, año: añoG })
    })
    return Array.from(map.values()).sort((a, b) => b.año - a.año || b.mes - a.mes)
  }, [gastos])

  // Índice del período seleccionado (para navegar prev/next)
  const periodoIdx = periodos.findIndex(p => p.mes === periodoSel.mes && p.año === periodoSel.año)

  // Gastos del período seleccionado
  const gastosEnPeriodo = useMemo(
    () => gastos.filter(g => g.mes === periodoSel.mes && g.año === periodoSel.año),
    [gastos, periodoSel],
  )

  // ── Modal: Generar cobro ───────────────────────────────────
  const [modalCrear, setModalCrear] = useState(false)
  const [formCrear,  setFormCrear]  = useState<FormCrear>({
    mes:               hoy.getMonth() + 1,
    año:               hoy.getFullYear(),
    montoBase:         85_000,
    montoFondoReserva: 10_000,
    montoAgua:         0,
    montoElectricidad: 0,
    montoGas:          0,
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
    if (filtro === 'todos') return gastosEnPeriodo
    return gastosEnPeriodo.filter(g => g.estadoPago === filtro)
  }, [gastosEnPeriodo, filtro])

  // Stats del período seleccionado
  const totalCobrado   = gastosEnPeriodo.reduce((s, g) => s + g.montoTotal, 0)
  const recaudado      = gastosEnPeriodo.filter(g => g.estadoPago === 'pagado').reduce((s, g) => s + g.montoTotal, 0)
  const pendienteTotal = gastosEnPeriodo.filter(g => g.estadoPago === 'pendiente').reduce((s, g) => s + g.montoTotal, 0)
  const moroso         = gastosEnPeriodo.filter(g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial').reduce((s, g) => s + g.montoTotal, 0)
  const pctRecaudado   = totalCobrado > 0 ? Math.round(recaudado / totalCobrado * 100) : 0

  const conteos = {
    todos:    gastosEnPeriodo.length,
    pagado:   gastosEnPeriodo.filter(g => g.estadoPago === 'pagado').length,
    pendiente:gastosEnPeriodo.filter(g => g.estadoPago === 'pendiente').length,
    vencido:  gastosEnPeriodo.filter(g => g.estadoPago === 'vencido').length,
    parcial:  gastosEnPeriodo.filter(g => g.estadoPago === 'parcial').length,
  }

  /** Si ya existen cobros para el período del form */
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

  // Total por unidad (preview del form)
  const montoTotalPorUnidad = formCrear.montoBase + formCrear.montoFondoReserva + formCrear.montoAgua + formCrear.montoElectricidad + formCrear.montoGas

  // Mes/año de vencimiento para el modal
  const mesVencLabel = formCrear.mes === 12 ? MESES[1]               : MESES[formCrear.mes + 1]
  const añoVencLabel = formCrear.mes === 12 ? formCrear.año + 1       : formCrear.año

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
    const montoTotal       = montoTotalPorUnidad

    const añoForm = formCrear.año

    const nuevos: GastoComun[] = unidades.map(u => ({
      id:                crypto.randomUUID(),
      edificioId:        u.edificioId,
      unidadId:          u.id,
      mes:               formCrear.mes,
      año:               añoForm,
      montoBase:         formCrear.montoBase,
      montoFondoReserva: formCrear.montoFondoReserva,
      ...(formCrear.montoAgua         > 0 ? { montoAgua:         formCrear.montoAgua }         : {}),
      ...(formCrear.montoElectricidad > 0 ? { montoElectricidad: formCrear.montoElectricidad } : {}),
      ...(formCrear.montoGas          > 0 ? { montoGas:          formCrear.montoGas }          : {}),
      montoTotal,
      estadoPago:        'pendiente' as EstadoPago,
      fechaVencimiento,
      diasMora:          0,
    }))

    // Optimistic UI
    setGastos(prev => [...nuevos, ...prev])
    // Cambiar al período recién generado
    setPeriodoSel({ mes: formCrear.mes, año: añoForm })
    setModalCrear(false)
    setGenerando(false)

    // Persist (fire-and-forget)
    supabaseBrowser
      .from('gastos_comunes')
      .insert(
        nuevos.map(n => ({
          id:                n.id,
          edificioId:        n.edificioId,
          unidadId:          n.unidadId,
          mes:               n.mes,
          año:               n.año,
          montoBase:         n.montoBase,
          montoFondoReserva: n.montoFondoReserva,
          ...(n.montoAgua         != null ? { montoAgua:         n.montoAgua }         : {}),
          ...(n.montoElectricidad != null ? { montoElectricidad: n.montoElectricidad } : {}),
          ...(n.montoGas          != null ? { montoGas:          n.montoGas }          : {}),
          montoTotal:        n.montoTotal,
          estadoPago:        n.estadoPago,
          fechaVencimiento:  n.fechaVencimiento,
          diasMora:          n.diasMora,
        })),
      )
      .then(({ error }) => { if (error) console.warn('[Gastos] Error generando:', error.message) })

    agregarNotificacion(
      'pago',
      'Cobros generados',
      `${nuevos.length} unidades · ${MESES[formCrear.mes]} ${añoForm}`,
    )
  }, [formCrear, unidades, periodoExiste, montoTotalPorUnidad, agregarNotificacion])

  /** Abre el modal de edición */
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

  // ── JSX ────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Comunes</h1>
          <p className="text-gray-500 mt-1">
            {periodos.length} período{periodos.length !== 1 ? 's' : ''} · {unidades.length} unidades en el edificio
          </p>
        </div>
        <button
          onClick={() => {
            setFormCrear(f => ({ ...f, mes: hoy.getMonth() + 1, año: hoy.getFullYear() }))
            setErroresCrear({})
            setModalCrear(true)
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Generar cobros
        </button>
      </div>

      {/* ── Selector de período ── */}
      <div className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-center gap-3">
          {/* Botón anterior */}
          <button
            onClick={() => periodoIdx < periodos.length - 1 && setPeriodoSel(periodos[periodoIdx + 1])}
            disabled={periodoIdx >= periodos.length - 1}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>

          {/* Pills de períodos */}
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto">
            {periodos.length === 0 ? (
              <p className="text-sm text-gray-400">Sin períodos generados aún</p>
            ) : periodos.map(p => {
              const activo = p.mes === periodoSel.mes && p.año === periodoSel.año
              return (
                <button
                  key={`${p.año}-${p.mes}`}
                  onClick={() => setPeriodoSel(p)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={activo
                    ? { background: '#1e3a5f', color: 'white' }
                    : { background: '#f1f5f9', color: '#64748b' }
                  }
                >
                  {MESES_CORTO[p.mes]} {p.año}
                </button>
              )
            })}
          </div>

          {/* Botón siguiente */}
          <button
            onClick={() => periodoIdx > 0 && setPeriodoSel(periodos[periodoIdx - 1])}
            disabled={periodoIdx <= 0}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── Stats del período seleccionado ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total cobrado', value: formatCLP(totalCobrado),   Icon: DollarSign,    color: '#2563ae', bg: '#dbeafe', desc: `${gastosEnPeriodo.length} unidades` },
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
              {gastosEnPeriodo.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                        <DollarSign className="w-6 h-6 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-400">
                          Sin cobros para {MESES[periodoSel.mes]} {periodoSel.año}
                        </p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          Haz clic en «Generar cobros» para crear los gastos de este período
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
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
                        {/* Descargar PDF */}
                        <a
                          href={`/api/liquidacion/${g.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Descargar liquidación PDF"
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: '#dc2626' }}
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </a>

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
              {MESES[periodoSel.mes]} {periodoSel.año} · Mostrando {filtered.length} de {gastosEnPeriodo.length} gastos
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]"
            style={{ border: '1px solid #e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Generar Cobros del Período</h2>
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

              {/* ── Cobros base ── */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cobros base</p>
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
              </div>

              {/* ── Cobros opcionales ── */}
              <div className="space-y-3 pt-3 border-t" style={{ borderColor: '#f1f5f9' }}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cobros adicionales <span className="font-normal normal-case text-gray-300">(dejar en 0 si no aplica)</span></p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">💧 Agua</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                      style={{ borderColor: '#e2e8f0' }}
                      value={formCrear.montoAgua || ''}
                      onChange={e => setFormCrear(f => ({ ...f, montoAgua: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">⚡ Luz</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                      style={{ borderColor: '#e2e8f0' }}
                      value={formCrear.montoElectricidad || ''}
                      onChange={e => setFormCrear(f => ({ ...f, montoElectricidad: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">🔥 Gas</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                      style={{ borderColor: '#e2e8f0' }}
                      value={formCrear.montoGas || ''}
                      onChange={e => setFormCrear(f => ({ ...f, montoGas: Number(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              {/* Preview total */}
              <div
                className="p-4 rounded-xl"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Total por unidad</p>
                    <p className="text-xl font-bold text-gray-900">{formatCLP(montoTotalPorUnidad)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total edificio ({unidades.length} uds.)</p>
                    <p className="text-sm font-bold" style={{ color: '#2563ae' }}>
                      {formatCLP(montoTotalPorUnidad * unidades.length)}
                    </p>
                  </div>
                </div>
                {/* Desglose mini */}
                {[
                  { label: 'Base',        monto: formCrear.montoBase },
                  { label: 'Fdo. reserva',monto: formCrear.montoFondoReserva },
                  { label: 'Agua',        monto: formCrear.montoAgua },
                  { label: 'Electricidad',monto: formCrear.montoElectricidad },
                  { label: 'Gas',         monto: formCrear.montoGas },
                ].filter(c => c.monto > 0).map(c => (
                  <div key={c.label} className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{c.label}</span>
                    <span className="font-medium">{formatCLP(c.monto)}</span>
                  </div>
                ))}
              </div>

              {/* Vencimiento automático */}
              <p className="text-xs text-gray-400">
                📅 Vencimiento: 5 de {mesVencLabel} {añoVencLabel}
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
