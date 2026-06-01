'use client'

/**
 * PagosView.tsx — Fase 32: Portal de Pagos
 * Admin: CRUD completo, filtros, export CSV.
 * Resident: simula flujo de pago con Webpay/transferencia.
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Search, Plus, CheckCircle2, Clock, XCircle,
  Download, CreditCard, Banknote, Smartphone,
  ArrowRight, Loader2, PartyPopper, ReceiptText,
  Filter, X,
} from 'lucide-react'
import Modal from '@/components/modal'
import { formatCLP } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { Pago, Unidad, User, GastoComun } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
const metodoCfg = {
  transferencia: { label: 'Transferencia', bg: '#dbeafe', color: '#2563ae', Icon: Banknote },
  webpay:        { label: 'Webpay',        bg: '#dcfce7', color: '#16a34a', Icon: CreditCard },
  efectivo:      { label: 'Efectivo',      bg: '#fef3c7', color: '#d97706', Icon: Banknote },
  tarjeta:       { label: 'Tarjeta',       bg: '#f3e8ff', color: '#7c3aed', Icon: CreditCard },
  cheque:        { label: 'Cheque',        bg: '#f1f5f9', color: '#64748b', Icon: ReceiptText },
} as const

const estadoCfg = {
  completado: { Icon: CheckCircle2, color: '#16a34a', bg: '#dcfce7', label: 'Completado' },
  pendiente:  { Icon: Clock,        color: '#d97706', bg: '#fef3c7', label: 'Pendiente'  },
  rechazado:  { Icon: XCircle,      color: '#dc2626', bg: '#fee2e2', label: 'Rechazado'  },
} as const

const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_FULL = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
type MetodoPago = keyof typeof metodoCfg
type EstadoTransaccion = keyof typeof estadoCfg

// ─── Estado por defecto del formulario ────────────────────────
const FORM_VACÍO = {
  unidadId:    '',
  gastoId:     '',
  monto:       '',
  mes:         String(new Date().getMonth() + 1),
  año:         String(new Date().getFullYear()),
  metodo:      'transferencia' as MetodoPago,
  comprobante: '',
  nota:        '',
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  pagos:          Pago[]
  unidades:       Unidad[]
  users:          User[]
  gastos:         GastoComun[]
  edificioNombre: string
  edificioId:     string
}

// ─── Helpers externos ─────────────────────────────────────────
function nombreUnidad(unidades: Unidad[], id: string) {
  const u = unidades.find(x => x.id === id)
  return u ? `Unidad ${u.numero}` : id
}
function nombreResidente(users: User[], unidades: Unidad[], unidadId: string) {
  const u   = unidades.find(x => x.id === unidadId)
  if (!u) return null
  const uid = u.arrendatarioId ?? u.propietarioId
  if (!uid) return null
  const usr = users.find(x => x.id === uid)
  return usr ? `${usr.nombre} ${usr.apellido}` : null
}

// ─── Componente ───────────────────────────────────────────────
export default function PagosView({ pagos: initPagos, unidades, users, gastos, edificioNombre, edificioId }: Props) {
  const [pagos,         setPagos]         = useState(initPagos)
  const [busqueda,      setBusqueda]      = useState('')
  const [filtroEstado,  setFiltroEstado]  = useState<'todos' | EstadoTransaccion>('todos')
  const [filtroMetodo,  setFiltroMetodo]  = useState<'todos' | MetodoPago>('todos')

  // Modales
  const [modalRegistrar, setModalRegistrar] = useState(false)
  const [modalWebpay,    setModalWebpay]    = useState(false)
  const [webpayStep,     setWebpayStep]     = useState<'form' | 'loading' | 'ok'>('form')

  // Formulario
  const [form,    setForm]    = useState(FORM_VACÍO)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  // ── Filtrado ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return pagos.filter(p => {
      if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false
      if (filtroMetodo !== 'todos' && p.metodo !== filtroMetodo) return false
      if (busqueda) {
        const q   = busqueda.toLowerCase()
        const nom = nombreResidente(users, unidades, p.unidadId)?.toLowerCase() ?? ''
        const uni = nombreUnidad(unidades, p.unidadId).toLowerCase()
        const comp = p.comprobante?.toLowerCase() ?? ''
        if (!nom.includes(q) && !uni.includes(q) && !comp.includes(q)) return false
      }
      return true
    })
  }, [pagos, filtroEstado, filtroMetodo, busqueda, users, unidades])

  // ── KPIs ──────────────────────────────────────────────────
  const mesActual = new Date().getMonth() + 1
  const añoActual = new Date().getFullYear()
  const pagosMes  = pagos.filter(p => p.mes === mesActual && p.año === añoActual)

  const kpis = {
    totalRecaudado:   pagos.filter(p => p.estado === 'completado').reduce((s, p) => s + p.monto, 0),
    recaudadoMes:     pagosMes.filter(p => p.estado === 'completado').reduce((s, p) => s + p.monto, 0),
    completados:      pagos.filter(p => p.estado === 'completado').length,
    pendientes:       pagos.filter(p => p.estado === 'pendiente').length,
    rechazados:       pagos.filter(p => p.estado === 'rechazado').length,
  }

  // ── Gastos pendientes por unidad ──────────────────────────
  const gastosPendientesUnidad = useCallback((unidadId: string) =>
    gastos.filter(g => g.unidadId === unidadId && (g.estadoPago === 'pendiente' || g.estadoPago === 'vencido'))
  , [gastos])

  // ── Registrar pago ────────────────────────────────────────
  const handleRegistrar = useCallback(async () => {
    if (!form.unidadId || !form.monto) { setError('Completa unidad y monto'); return }
    const monto = parseFloat(form.monto)
    if (isNaN(monto) || monto <= 0) { setError('Monto inválido'); return }
    setSaving(true); setError('')

    // Simulación de Webpay: mostrar modal de pago animado
    if (form.metodo === 'webpay') {
      setModalRegistrar(false)
      setModalWebpay(true)
      setWebpayStep('loading')
      await new Promise(r => setTimeout(r, 2200))
      setWebpayStep('ok')
      // Crear pago con estado completado tras simulación
      await crearPagoEnDB({ ...form, monto, estado: 'completado' })
      setSaving(false)
      return
    }

    await crearPagoEnDB({ ...form, monto, estado: 'completado' })
    setSaving(false)
    setModalRegistrar(false)
    setForm(FORM_VACÍO)
  }, [form])

  async function crearPagoEnDB(datos: {
    unidadId: string; gastoId: string; monto: number; mes: string; año: string
    metodo: string; comprobante: string; nota: string; estado: string
  }) {
    const id = `pago-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const nuevo: Pago = {
      id,
      edificioId:      edificioId,
      unidadId:        datos.unidadId,
      gastoId:         datos.gastoId || undefined,
      monto:           datos.monto,
      mes:             parseInt(datos.mes),
      año:             parseInt(datos.año),
      metodo:          datos.metodo as MetodoPago,
      estado:          datos.estado as EstadoTransaccion,
      registradoPorId: 'admin',
      comprobante:     datos.comprobante || undefined,
      nota:            datos.nota || undefined,
      creadoEn:        new Date().toISOString(),
    }
    const { error } = await supabase.from('pagos').insert([nuevo])
    if (error) { console.error('crearPago:', error.message); return }

    // Si hay gastoId, marcar gasto como pagado
    if (datos.gastoId) {
      await supabase.from('gastos_comunes').update({ estadoPago: 'pagado', fechaPago: new Date().toISOString().slice(0, 10) }).eq('id', datos.gastoId)
    }
    setPagos(prev => [nuevo, ...prev])
    setForm(FORM_VACÍO)
  }

  // ── Eliminar pago ─────────────────────────────────────────
  async function eliminarPago(id: string) {
    if (!confirm('¿Eliminar este pago?')) return
    await supabase.from('pagos').delete().eq('id', id)
    setPagos(prev => prev.filter(p => p.id !== id))
  }

  // ── Export CSV ────────────────────────────────────────────
  function exportarCSV() {
    const bom = '﻿'
    const header = ['Fecha', 'Unidad', 'Residente', 'Monto', 'Mes', 'Año', 'Método', 'Estado', 'Comprobante'].join(';')
    const rows = filtered.map(p => {
      const uni = nombreUnidad(unidades, p.unidadId)
      const res = nombreResidente(users, unidades, p.unidadId) ?? ''
      const fecha = new Date(p.creadoEn).toLocaleDateString('es-CL')
      return [fecha, uni, res, p.monto, MESES_FULL[p.mes] ?? p.mes, p.año, p.metodo, p.estado, p.comprobante ?? ''].join(';')
    })
    const csv   = bom + [header, ...rows].join('\n')
    const blob  = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a     = document.createElement('a')
    a.href      = URL.createObjectURL(blob)
    a.download  = `pagos-${edificioNombre.replace(/\s/g, '_')}.csv`
    a.click()
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal de Pagos</h1>
          <p className="text-gray-500 mt-1">{edificioNombre} · {pagos.length} pagos registrados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e2e8f0', color: '#64748b' }}
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => { setForm(FORM_VACÍO); setError(''); setModalRegistrar(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#2563ae' }}
          >
            <Plus className="w-4 h-4" />
            Registrar pago
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total recaudado',   value: formatCLP(kpis.totalRecaudado),  sub: 'histórico',              color: '#2563ae', bg: '#eff6ff' },
          { label: `Recaudado ${MESES_FULL[mesActual]}`, value: formatCLP(kpis.recaudadoMes), sub: `${kpis.completados} pagos completos`, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Pendientes',        value: String(kpis.pendientes),          sub: 'por cobrar',             color: '#d97706', bg: '#fef3c7' },
          { label: 'Rechazados',        value: String(kpis.rechazados),          sub: 'requieren acción',       color: '#dc2626', bg: '#fee2e2' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{k.label}</p>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: k.color }} />
            </div>
            <p className="text-xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />

          {/* Estado */}
          <div className="flex gap-1 flex-wrap">
            {(['todos', 'completado', 'pendiente', 'rechazado'] as const).map(v => (
              <button key={v} onClick={() => setFiltroEstado(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                style={filtroEstado === v ? { background: '#2563ae', color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
              >
                {v === 'todos' ? 'Todos' : estadoCfg[v].label}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* Método */}
          <div className="flex gap-1 flex-wrap">
            {(['todos', 'transferencia', 'webpay', 'efectivo', 'tarjeta'] as const).map(v => (
              <button key={v} onClick={() => setFiltroMetodo(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={filtroMetodo === v ? { background: '#1e3a5f', color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
              >
                {v === 'todos' ? 'Todos' : metodoCfg[v].label}
              </button>
            ))}
          </div>

          {/* Búsqueda */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
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
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                {['Fecha', 'Unidad', 'Residente', 'Monto', 'Período', 'Método', 'Comprobante', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">No se encontraron pagos</td>
                </tr>
              ) : filtered.map(p => {
                const met  = metodoCfg[p.metodo as MetodoPago] ?? { label: p.metodo, bg: '#f1f5f9', color: '#64748b', Icon: ReceiptText }
                const est  = estadoCfg[p.estado as EstadoTransaccion] ?? estadoCfg.pendiente
                const { Icon: EstIcon } = est
                const nom  = nombreResidente(users, unidades, p.unidadId)

                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#f8fafc' }}>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(p.creadoEn).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-gray-900">{nombreUnidad(unidades, p.unidadId)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">
                      {nom ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-gray-900">{formatCLP(p.monto)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {MESES[p.mes]} {p.año}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: met.bg, color: met.color }}>
                        {met.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.comprobante
                        ? <span className="text-xs font-mono text-gray-500">{p.comprobante}</span>
                        : p.nota
                          ? <span className="text-xs text-gray-400 italic">{p.nota}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: est.bg, color: est.color }}>
                        <EstIcon className="w-3 h-3" />
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => eliminarPago(p.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
            <p className="text-xs text-gray-400">Mostrando {filtered.length} de {pagos.length} pagos</p>
            <p className="text-xs font-bold text-gray-700">
              Total: {formatCLP(filtered.filter(p => p.estado === 'completado').reduce((s, p) => s + p.monto, 0))}
            </p>
          </div>
        )}
      </div>

      {/* ── Modal: Registrar Pago ── */}
      <Modal abierto={modalRegistrar} onCerrar={() => setModalRegistrar(false)} titulo="Registrar Pago" subtitulo="Registra un cobro o pago manual" ancho="md">
        <div className="space-y-4">
          {/* Unidad */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unidad *</label>
            <select
              value={form.unidadId}
              onChange={e => { setForm(f => ({ ...f, unidadId: e.target.value, gastoId: '' })) }}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
            >
              <option value="">Seleccionar unidad…</option>
              {unidades.map(u => (
                <option key={u.id} value={u.id}>Unidad {u.numero} — {nombreResidente(users, unidades, u.id) ?? 'Sin residente'}</option>
              ))}
            </select>
          </div>

          {/* Gasto pendiente (opcional) */}
          {form.unidadId && gastosPendientesUnidad(form.unidadId).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Gasto pendiente vinculado</label>
              <select
                value={form.gastoId}
                onChange={e => {
                  const g = gastos.find(x => x.id === e.target.value)
                  setForm(f => ({ ...f, gastoId: e.target.value, monto: g ? String(g.montoTotal) : f.monto, mes: g ? String(g.mes) : f.mes, año: g ? String(g.año) : f.año }))
                }}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              >
                <option value="">— Sin vincular (pago manual) —</option>
                {gastosPendientesUnidad(form.unidadId).map(g => (
                  <option key={g.id} value={g.id}>{MESES_FULL[g.mes]} {g.año} — {formatCLP(g.montoTotal)} ({g.estadoPago})</option>
                ))}
              </select>
            </div>
          )}

          {/* Monto + Período */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Monto (CLP) *</label>
              <input
                type="number" min="0" value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Período</label>
              <div className="flex gap-1">
                <select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))}
                  className="flex-1 px-2 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                >
                  {MESES_FULL.slice(1).map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                </select>
                <input type="number" value={form.año} onChange={e => setForm(f => ({ ...f, año: e.target.value }))}
                  className="w-20 px-2 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                />
              </div>
            </div>
          </div>

          {/* Método */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Método de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(metodoCfg) as MetodoPago[]).map(m => {
                const cfg = metodoCfg[m]
                const sel = form.metodo === m
                return (
                  <button key={m} onClick={() => setForm(f => ({ ...f, metodo: m }))}
                    className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all"
                    style={sel ? { borderColor: cfg.color, background: cfg.bg, color: cfg.color } : { borderColor: '#e2e8f0', color: '#94a3b8' }}
                  >
                    <cfg.Icon className="w-4 h-4" />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comprobante + Nota */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">N° Comprobante</label>
              <input type="text" value={form.comprobante} onChange={e => setForm(f => ({ ...f, comprobante: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                placeholder="TRF-000123"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nota</label>
              <input type="text" value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                placeholder="Opcional"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          {/* Botón */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalRegistrar(false)}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#e2e8f0' }}
            >
              Cancelar
            </button>
            <button onClick={handleRegistrar} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: form.metodo === 'webpay' ? '#16a34a' : '#2563ae' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                form.metodo === 'webpay'
                  ? <><Smartphone className="w-4 h-4" /> Pagar con Webpay</>
                  : <><CheckCircle2 className="w-4 h-4" /> Confirmar pago</>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Webpay simulado ── */}
      <Modal abierto={modalWebpay} onCerrar={() => { if (webpayStep === 'ok') { setModalWebpay(false); setWebpayStep('form') } }} titulo="Pago con Webpay" ancho="sm" colorAccento="#16a34a">
        <div className="flex flex-col items-center py-6 gap-5">
          {webpayStep === 'loading' && (
            <>
              {/* Logo Webpay simulado */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#dcfce7' }}>
                <CreditCard className="w-8 h-8" style={{ color: '#16a34a' }} />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">Procesando pago</p>
                <p className="text-sm text-gray-500 mt-1">Conectando con Webpay Plus…</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {['Verificando tarjeta', 'Autorizando transacción', 'Confirmando pago'].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: '#f8fafc' }}>
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" style={{ color: '#16a34a', animationDelay: `${i * 0.3}s` }} />
                    <span className="text-sm text-gray-600">{step}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">Simulación educativa — no se procesa ningún cobro real</p>
            </>
          )}
          {webpayStep === 'ok' && (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#dcfce7' }}>
                <PartyPopper className="w-8 h-8" style={{ color: '#16a34a' }} />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 text-lg">¡Pago exitoso!</p>
                <p className="text-sm text-gray-500 mt-1">El pago fue procesado correctamente.</p>
              </div>
              <div className="w-full max-w-xs p-4 rounded-2xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monto</span>
                    <span className="font-bold text-gray-900">{formatCLP(parseFloat(form.monto) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unidad</span>
                    <span className="font-semibold text-gray-900">{form.unidadId ? nombreUnidad(unidades, form.unidadId) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Período</span>
                    <span className="font-semibold text-gray-900">{MESES_FULL[parseInt(form.mes)]} {form.año}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setModalWebpay(false); setWebpayStep('form') }}
                className="w-full max-w-xs py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: '#16a34a' }}
              >
                <ArrowRight className="w-4 h-4" />
                Volver al portal
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
