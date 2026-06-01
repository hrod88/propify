'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, TrendingDown, BarChart3,
  ChevronLeft, ChevronRight, FileDown,
} from 'lucide-react'
import { formatCLP } from '@/lib/format'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Modal from '@/components/modal'
import type { EgresoComunidad, CategoriaEgreso } from '@/types'

// ─── Constantes ───────────────────────────────────────────────
const CATEGORIAS: CategoriaEgreso[] = [
  'Administración', 'Portería', 'Electricidad', 'Gas / Calefacción',
  'Mantenimiento', 'Limpieza', 'Seguros', 'Ascensores',
  'Reparaciones', 'Jardín', 'Extintores', 'Agua Fría', 'Agua Caliente',
  'Contabilidad', 'Comunicaciones', 'Aseo Exterior', 'Control de Plagas',
  'Fondo Reserva', 'Personal Part-Time', 'Caja Menor', 'Otros',
]

const CAT_COLOR: Record<string, string> = {
  'Administración':    '#2563ae',
  'Portería':          '#1e3a5f',
  'Electricidad':      '#f59e0b',
  'Gas / Calefacción': '#ef4444',
  'Mantenimiento':     '#8b5cf6',
  'Limpieza':          '#06b6d4',
  'Seguros':           '#10b981',
  'Ascensores':        '#f97316',
  'Reparaciones':      '#ec4899',
  'Jardín':            '#84cc16',
  'Extintores':        '#64748b',
  'Agua Fría':         '#0ea5e9',
  'Agua Caliente':     '#0284c7',
  'Contabilidad':      '#7c3aed',
  'Comunicaciones':    '#db2777',
  'Aseo Exterior':     '#059669',
  'Control de Plagas': '#92400e',
  'Fondo Reserva':     '#1d4ed8',
  'Personal Part-Time':'#0891b2',
  'Caja Menor':        '#78716c',
  'Otros':             '#94a3b8',
}

const MESES      = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MESES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── CSV helper ───────────────────────────────────────────────
function descargarCSV(enc: string[], filas: string[][], nombre: string) {
  const SEP = ';', BOM = '﻿', esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const body = [enc.map(esc).join(SEP), ...filas.map(f => f.map(esc).join(SEP))].join('\r\n')
  const url = URL.createObjectURL(new Blob([BOM + body], { type: 'text/csv;charset=utf-8;' }))
  const a   = Object.assign(document.createElement('a'), { href: url, download: `propify_${nombre}.csv` })
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ─── Donut SVG ────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  const C = 2 * Math.PI * 15.9
  let cum = 0
  return (
    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
      {data.map((d, i) => {
        const pct = d.value / total
        const dash = `${pct * C} ${C}`
        const off  = -(cum * C)
        cum += pct
        return (
          <circle
            key={i}
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke={d.color}
            strokeWidth="3.5"
            strokeDasharray={dash}
            strokeDashoffset={off}
            strokeLinecap="butt"
          />
        )
      })}
    </svg>
  )
}

// ─── Props & Form ─────────────────────────────────────────────
interface Props { egresos: EgresoComunidad[]; edificioNombre: string; edificioId: string }

interface FormState {
  categoria:   CategoriaEgreso
  monto:       string
  proveedor:   string
  comprobante: string
  fecha:       string
  descripcion: string
}

const FORM_EMPTY: FormState = {
  categoria: 'Administración', monto: '', proveedor: '', comprobante: '', fecha: '', descripcion: '',
}

type FormErrors = Partial<Record<keyof FormState, string>>

// ─── Sub-componente Form ──────────────────────────────────────
function FormEgreso({
  form, setForm, errores, onSubmit, onCancel, submitLabel,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  errores: FormErrors
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
}) {
  const upd = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Categoría *</label>
        <select
          value={form.categoria}
          onChange={upd('categoria')}
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          style={{ borderColor: errores.categoria ? '#dc2626' : '#e2e8f0' }}
        >
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Monto (CLP) *</label>
        <input
          type="number" min="1"
          value={form.monto} onChange={upd('monto')}
          placeholder="ej: 1500000"
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          style={{ borderColor: errores.monto ? '#dc2626' : '#e2e8f0' }}
          suppressHydrationWarning
        />
        {errores.monto && <p className="text-xs text-red-500 mt-1">{errores.monto}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Proveedor</label>
        <input
          type="text" value={form.proveedor} onChange={upd('proveedor')}
          placeholder="ej: Enel, CGE, empresa de aseo…"
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          style={{ borderColor: '#e2e8f0' }}
          suppressHydrationWarning
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">N° Comprobante / Factura</label>
          <input
            type="text" value={form.comprobante} onChange={upd('comprobante')}
            placeholder="ej: FAC-2026-1234"
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: '#e2e8f0' }}
            suppressHydrationWarning
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fecha del documento</label>
          <input
            type="date" value={form.fecha} onChange={upd('fecha')}
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: '#e2e8f0' }}
            suppressHydrationWarning
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Descripción</label>
        <textarea
          value={form.descripcion} onChange={upd('descripcion')}
          rows={2} placeholder="Observaciones adicionales…"
          className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
          style={{ borderColor: '#e2e8f0' }}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-slate-50"
          style={{ borderColor: '#e2e8f0' }}
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────
export default function EgresosView({ egresos: initial, edificioNombre, edificioId }: Props) {
  const [lista,    setLista]    = useState<EgresoComunidad[]>(initial)
  const [toast,    setToast]    = useState<string | null>(null)

  // ── Filtro mes/año ──
  const hoy = new Date()
  const [filtroMes, setFiltroMes] = useState(hoy.getUTCMonth() + 1)
  const [filtroAño, setFiltroAño] = useState(hoy.getUTCFullYear())

  // ── Modales crear ──
  const [modalCrear,  setModalCrear]  = useState(false)
  const [form,        setForm]        = useState<FormState>(FORM_EMPTY)
  const [errores,     setErrores]     = useState<FormErrors>({})

  // ── Modales editar ──
  const [editandoId,  setEditandoId]  = useState<string | null>(null)
  const [formEdit,    setFormEdit]    = useState<FormState>(FORM_EMPTY)
  const [erroresEdit, setErroresEdit] = useState<FormErrors>({})

  // ── Eliminar ──
  const [eliminarId, setEliminarId] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Egresos del período ──
  const egresosMes = useMemo(
    () => lista.filter(e => e.mes === filtroMes && e.año === filtroAño),
    [lista, filtroMes, filtroAño],
  )

  const totalMes = useMemo(() => egresosMes.reduce((s, e) => s + e.monto, 0), [egresosMes])

  const porCategoria = useMemo(() => {
    const map: Record<string, number> = {}
    egresosMes.forEach(e => { map[e.categoria] = (map[e.categoria] ?? 0) + e.monto })
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, monto]) => ({ cat, monto, color: CAT_COLOR[cat] ?? '#94a3b8' }))
  }, [egresosMes])

  const donutData = useMemo(() => {
    if (porCategoria.length <= 6) return porCategoria.map(c => ({ label: c.cat, value: c.monto, color: c.color }))
    const top5  = porCategoria.slice(0, 5)
    const otros = porCategoria.slice(5).reduce((s, c) => s + c.monto, 0)
    return [
      ...top5.map(c => ({ label: c.cat, value: c.monto, color: c.color })),
      { label: 'Otros', value: otros, color: '#94a3b8' },
    ]
  }, [porCategoria])

  // ── Navegar mes ──
  function mesAnterior() {
    if (filtroMes === 1) { setFiltroMes(12); setFiltroAño(y => y - 1) }
    else setFiltroMes(m => m - 1)
  }
  function mesSiguiente() {
    if (filtroMes === 12) { setFiltroMes(1); setFiltroAño(y => y + 1) }
    else setFiltroMes(m => m + 1)
  }

  // ── Validar ──
  function validar(f: FormState): FormErrors {
    const e: FormErrors = {}
    if (!f.monto || isNaN(Number(f.monto)) || Number(f.monto) < 1) e.monto = 'Ingresa un monto válido'
    return e
  }

  // ── Crear ──
  const handleCrear = useCallback(() => {
    const e = validar(form)
    setErrores(e)
    if (Object.keys(e).length) return

    const nuevo: EgresoComunidad = {
      id:          crypto.randomUUID(),
      edificioId,
      mes:         filtroMes,
      año:         filtroAño,
      categoria:   form.categoria,
      descripcion: form.descripcion || null,
      monto:       Number(form.monto),
      proveedor:   form.proveedor   || null,
      comprobante: form.comprobante || null,
      fecha:       form.fecha       || null,
      creadoEn:    new Date().toISOString(),
    }

    setLista(prev => [nuevo, ...prev])
    setModalCrear(false)
    setForm(FORM_EMPTY)
    showToast('Egreso registrado')

    supabaseBrowser.from('egresos_comunidad').insert(nuevo)
      .then(({ error }) => { if (error) console.warn('[Egresos] insert:', error.message) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, filtroMes, filtroAño, edificioId])

  // ── Abrir editar ──
  const abrirEditar = useCallback((eg: EgresoComunidad) => {
    setEditandoId(eg.id)
    setFormEdit({
      categoria:   eg.categoria as CategoriaEgreso,
      monto:       String(eg.monto),
      proveedor:   eg.proveedor   ?? '',
      comprobante: eg.comprobante ?? '',
      fecha:       eg.fecha       ?? '',
      descripcion: eg.descripcion ?? '',
    })
    setErroresEdit({})
  }, [])

  // ── Editar ──
  const handleEditar = useCallback(() => {
    if (!editandoId) return
    const e = validar(formEdit)
    setErroresEdit(e)
    if (Object.keys(e).length) return

    const cambios = {
      categoria:   formEdit.categoria,
      monto:       Number(formEdit.monto),
      proveedor:   formEdit.proveedor   || null,
      comprobante: formEdit.comprobante || null,
      fecha:       formEdit.fecha       || null,
      descripcion: formEdit.descripcion || null,
    }

    setLista(prev => prev.map(e => e.id === editandoId ? { ...e, ...cambios } : e))
    const id = editandoId
    setEditandoId(null)
    showToast('Egreso actualizado')

    supabaseBrowser.from('egresos_comunidad').update(cambios).eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Egresos] update:', error.message) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editandoId, formEdit])

  // ── Eliminar ──
  const handleEliminar = useCallback(() => {
    if (!eliminarId) return
    setLista(prev => prev.filter(e => e.id !== eliminarId))
    const id = eliminarId
    setEliminarId(null)
    showToast('Egreso eliminado')

    supabaseBrowser.from('egresos_comunidad').delete().eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Egresos] delete:', error.message) })
  }, [eliminarId])

  const egresoPorEliminar = lista.find(e => e.id === eliminarId)

  // ── CSV ──
  function exportarCSV() {
    descargarCSV(
      ['Mes','Año','Categoría','Proveedor','Comprobante','Descripción','Monto (CLP)'],
      egresosMes.map(e => [
        MESES[e.mes - 1], String(e.año), e.categoria,
        e.proveedor ?? '', e.comprobante ?? '', e.descripcion ?? '', String(e.monto),
      ]),
      `egresos_${MESES_ABREV[filtroMes - 1].toLowerCase()}_${filtroAño}`,
    )
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <style>{`
        @keyframes fade-in-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        .fade-in-up { animation: fade-in-up .3s ease }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[70] bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg fade-in-up">
          {toast}
        </div>
      )}

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Egresos Comunitarios</h1>
          <p className="text-gray-500 mt-1">{edificioNombre}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border hover:bg-slate-50 transition-colors"
            style={{ borderColor: '#e2e8f0', color: '#64748b' }}
          >
            <FileDown className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => { setForm(FORM_EMPTY); setErrores({}); setModalCrear(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#2563ae' }}
          >
            <Plus className="w-4 h-4" />
            Agregar egreso
          </button>
        </div>
      </div>

      {/* ── Navegador mes ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={mesAnterior}
          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-slate-50 transition-colors"
          style={{ borderColor: '#e2e8f0' }}
        >
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </button>
        <span className="font-bold text-gray-900 min-w-[160px] text-center text-lg">
          {MESES[filtroMes - 1]} {filtroAño}
        </span>
        <button
          onClick={mesSiguiente}
          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-slate-50 transition-colors"
          style={{ borderColor: '#e2e8f0' }}
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
        <span className="text-sm text-gray-400">{egresosMes.length} ítems</span>
      </div>

      {/* ── KPIs + Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Total mes */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4"
          style={{ borderColor: '#e2e8f0' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#fee2e2' }}
          >
            <TrendingDown className="w-6 h-6" style={{ color: '#dc2626' }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Total {MESES[filtroMes - 1]}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCLP(totalMes)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{porCategoria.length} categorías</p>
          </div>
        </div>

        {/* Mayor gasto */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4"
          style={{ borderColor: '#e2e8f0' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#dbeafe' }}
          >
            <BarChart3 className="w-6 h-6" style={{ color: '#2563ae' }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">Mayor ítem</p>
            <p className="text-lg font-bold text-gray-900 leading-tight">
              {porCategoria[0]?.cat ?? '—'}
            </p>
            {porCategoria[0] && totalMes > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {Math.round((porCategoria[0].monto / totalMes) * 100)}% del total ·{' '}
                {formatCLP(porCategoria[0].monto)}
              </p>
            )}
          </div>
        </div>

        {/* Donut distribución */}
        <div
          className="bg-white rounded-2xl border shadow-sm p-5"
          style={{ borderColor: '#e2e8f0' }}
        >
          <p className="text-xs font-semibold text-gray-400 mb-3">Distribución por categoría</p>
          {egresosMes.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <DonutChart data={donutData} />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                {donutData.slice(0, 4).map(d => (
                  <div key={d.label} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: d.color }}
                    />
                    <span className="text-xs text-gray-500 truncate">{d.label}</span>
                    <span className="text-xs font-bold text-gray-700 ml-auto shrink-0">
                      {Math.round((d.value / totalMes) * 100)}%
                    </span>
                  </div>
                ))}
                {donutData.length > 4 && (
                  <p className="text-xs text-gray-400">+{donutData.length - 4} más…</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sin datos para este mes</p>
          )}
        </div>
      </div>

      {/* ── Barras por categoría ── */}
      {porCategoria.length > 0 && (
        <div
          className="bg-white rounded-2xl border shadow-sm p-5"
          style={{ borderColor: '#e2e8f0' }}
        >
          <h2 className="font-bold text-gray-900 mb-4">Egresos por categoría</h2>
          <div className="space-y-3">
            {porCategoria.map(({ cat, monto, color }) => {
              const pct = totalMes > 0 ? Math.round((monto / totalMes) * 100) : 0
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="font-medium text-gray-700">{cat}</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {formatCLP(monto)} <span className="text-gray-400 font-normal">· {pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Tabla detalle ── */}
      <div
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: '#f1f5f9' }}
        >
          <h2 className="font-bold text-gray-900">Detalle de egresos</h2>
          <span className="text-sm text-gray-400">{MESES[filtroMes - 1]} {filtroAño}</span>
        </div>

        {egresosMes.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm mb-3">Sin egresos registrados para este mes</p>
            <button
              onClick={() => { setForm(FORM_EMPTY); setErrores({}); setModalCrear(true) }}
              className="text-sm font-semibold hover:opacity-80"
              style={{ color: '#2563ae' }}
            >
              + Agregar primer egreso
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Categoría', 'Proveedor / Descripción', 'Comprobante', 'Monto', 'Acciones'].map(h => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {egresosMes.map((eg, idx) => (
                <tr
                  key={eg.id}
                  className="border-t hover:bg-slate-50 transition-colors"
                  style={{ borderColor: '#f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: CAT_COLOR[eg.categoria] ?? '#94a3b8' }}
                      />
                      <span className="text-sm font-semibold text-gray-800">{eg.categoria}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-gray-700">{eg.proveedor ?? '—'}</p>
                    {eg.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5">{eg.descripcion}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">
                    {eg.comprobante ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold text-gray-900">{formatCLP(eg.monto)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirEditar(eg)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ background: '#dbeafe' }}
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" style={{ color: '#2563ae' }} />
                      </button>
                      <button
                        onClick={() => setEliminarId(eg.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ background: '#fee2e2' }}
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                <td colSpan={3} className="px-5 py-3.5 text-sm font-bold text-gray-700">
                  Total {MESES[filtroMes - 1]} {filtroAño}
                </td>
                <td className="px-5 py-3.5 text-sm font-bold" style={{ color: '#dc2626' }}>
                  {formatCLP(totalMes)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ══════ MODAL CREAR ══════ */}
      <Modal
        abierto={modalCrear}
        onCerrar={() => setModalCrear(false)}
        titulo="Registrar egreso"
        subtitulo={`${MESES[filtroMes - 1]} ${filtroAño}`}
        colorAccento="#2563ae"
      >
        <FormEgreso
          form={form} setForm={setForm} errores={errores}
          onSubmit={handleCrear} onCancel={() => setModalCrear(false)}
          submitLabel="Registrar egreso"
        />
      </Modal>

      {/* ══════ MODAL EDITAR ══════ */}
      <Modal
        abierto={!!editandoId}
        onCerrar={() => setEditandoId(null)}
        titulo="Editar egreso"
        subtitulo={lista.find(e => e.id === editandoId)?.categoria}
        colorAccento="#2563ae"
      >
        <FormEgreso
          form={formEdit} setForm={setFormEdit} errores={erroresEdit}
          onSubmit={handleEditar} onCancel={() => setEditandoId(null)}
          submitLabel="Guardar cambios"
        />
      </Modal>

      {/* ══════ MODAL ELIMINAR ══════ */}
      <Modal
        abierto={!!eliminarId}
        onCerrar={() => setEliminarId(null)}
        titulo="Eliminar egreso"
        subtitulo={egresoPorEliminar?.categoria}
        colorAccento="#dc2626"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro de que quieres eliminar este egreso de{' '}
          <strong>{egresoPorEliminar ? formatCLP(egresoPorEliminar.monto) : ''}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setEliminarId(null)}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-slate-50"
            style={{ borderColor: '#e2e8f0' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleEliminar}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
            style={{ background: '#dc2626' }}
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}

