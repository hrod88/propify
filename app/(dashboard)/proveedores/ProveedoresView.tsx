'use client'

import { useState, useMemo } from 'react'
import {
  Truck, Plus, Pencil, Trash2, Eye,
  Search, Phone, Mail, CheckCircle, XCircle,
  Download, TrendingDown, BarChart3,
} from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Modal from '@/components/modal'
import type { Proveedor, EgresoComunidad, CategoriaEgreso } from '@/types'

// ─── Constantes ───────────────────────────────────────────────
const CATEGORIAS: CategoriaEgreso[] = [
  'Administración', 'Portería', 'Electricidad', 'Gas / Calefacción',
  'Mantenimiento', 'Limpieza', 'Seguros', 'Ascensores',
  'Reparaciones', 'Jardín', 'Extintores', 'Agua Fría',
  'Contabilidad', 'Comunicaciones', 'Aseo Exterior', 'Control de Plagas',
  'Fondo Reserva', 'Otros',
]

const CAT_COLOR: Record<string, string> = {
  'Administración':    '#2563ae', 'Portería':          '#1e3a5f',
  'Electricidad':      '#f59e0b', 'Gas / Calefacción': '#ef4444',
  'Mantenimiento':     '#8b5cf6', 'Limpieza':          '#06b6d4',
  'Seguros':           '#10b981', 'Ascensores':        '#f97316',
  'Reparaciones':      '#ec4899', 'Jardín':            '#84cc16',
  'Extintores':        '#64748b', 'Agua Fría':         '#0ea5e9',
  'Contabilidad':      '#7c3aed', 'Comunicaciones':    '#db2777',
  'Aseo Exterior':     '#059669', 'Control de Plagas': '#92400e',
  'Fondo Reserva':     '#1d4ed8', 'Otros':             '#94a3b8',
}

const MESES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const fmtM = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

// ─── Tipos internos ───────────────────────────────────────────
interface FormState {
  nombre: string; rut: string; categoria: CategoriaEgreso
  contacto: string; telefono: string; email: string; nota: string
}
const FORM_VACIO: FormState = {
  nombre: '', rut: '', categoria: 'Administración',
  contacto: '', telefono: '', email: '', nota: '',
}
type FormErrors = Partial<Record<keyof FormState, string>>

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4">
      <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${color}18` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
      </div>
    </div>
  )
}

// ─── Sub-componente: Form ─────────────────────────────────────
function FormProveedor({
  form, setForm, errores, onSubmit, onCancel, submitLabel, guardando,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  errores: FormErrors
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  guardando: boolean
}) {
  const upd = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">

        {/* Nombre */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Nombre / Razón Social *
          </label>
          <input
            value={form.nombre} onChange={upd('nombre')}
            placeholder="ej: Mantención Ascensores SpA"
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: errores.nombre ? '#dc2626' : '#e2e8f0' }}
          />
          {errores.nombre && <p className="text-xs text-red-500 mt-1">{errores.nombre}</p>}
        </div>

        {/* RUT */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">RUT</label>
          <input
            value={form.rut} onChange={upd('rut')}
            placeholder="ej: 76.543.210-K"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Categoría *</label>
          <select
            value={form.categoria} onChange={upd('categoria')}
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: errores.categoria ? '#dc2626' : '#e2e8f0' }}
          >
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Contacto */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Persona de contacto</label>
          <input
            value={form.contacto} onChange={upd('contacto')}
            placeholder="ej: Juan Pérez"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Teléfono</label>
          <input
            value={form.telefono} onChange={upd('telefono')}
            placeholder="+56 9 1234 5678"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Email */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
          <input
            type="email" value={form.email} onChange={upd('email')}
            placeholder="contacto@empresa.cl"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Nota */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nota interna</label>
          <textarea
            value={form.nota} onChange={upd('nota')} rows={2}
            placeholder="Observaciones, condiciones del contrato…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button" onClick={onSubmit} disabled={guardando}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ background: '#2563ae' }}
        >
          {guardando ? 'Guardando…' : submitLabel}
        </button>
        <button
          type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Sub-componente: Historial ────────────────────────────────
function HistorialPanel({ egresos }: { egresos: EgresoComunidad[] }) {
  const totalPagado = egresos.reduce((s, e) => s + e.monto, 0)
  const promedio    = egresos.length > 0 ? Math.round(totalPagado / egresos.length) : 0

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Servicios',      value: String(egresos.length) },
          { label: 'Total pagado',   value: egresos.length > 0 ? fmtCLP(totalPagado) : '—' },
          { label: 'Prom. / servicio', value: egresos.length > 0 ? fmtCLP(promedio) : '—' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#f8fafc' }}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-base font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      {egresos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Sin egresos registrados para este proveedor.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Período', 'Descripción', 'Comprobante', 'Monto'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {egresos.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-medium text-gray-700 whitespace-nowrap">
                    {MESES_ABREV[e.mes - 1]} {e.año}
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{e.descripcion ?? '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{e.comprobante ?? '—'}</td>
                  <td className="px-3 py-2.5 font-semibold text-gray-800 text-right whitespace-nowrap">
                    {fmtCLP(e.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={3} className="px-3 py-2.5 font-bold text-gray-700">TOTAL</td>
                <td className="px-3 py-2.5 font-bold text-gray-900 text-right">{fmtCLP(totalPagado)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────
interface Props {
  proveedores:    Proveedor[]
  egresos:        EgresoComunidad[]
  edificioNombre: string
  edificioId:     string
}

export default function ProveedoresView({
  proveedores: initial, egresos, edificioNombre, edificioId,
}: Props) {
  const [proveedores, setProveedores] = useState(initial)
  const [busqueda,    setBusqueda]    = useState('')
  const [filtroCat,   setFiltroCat]   = useState('')
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('activos')

  const [modalCrear,  setModalCrear]  = useState(false)
  const [editando,    setEditando]    = useState<Proveedor | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [verHistorial, setVerHistorial] = useState<Proveedor | null>(null)

  const [form,      setForm]      = useState<FormState>(FORM_VACIO)
  const [errores,   setErrores]   = useState<FormErrors>({})
  const [guardando, setGuardando] = useState(false)

  // ── Auxiliares de egresos ──────────────────────────────────
  const totalPorProv = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of egresos) {
      if (e.proveedor) {
        const k = e.proveedor.toLowerCase().trim()
        map[k] = (map[k] ?? 0) + e.monto
      }
    }
    return map
  }, [egresos])

  const ultimoPorProv = useMemo(() => {
    const map: Record<string, { mes: number; año: number }> = {}
    for (const e of egresos) {
      if (!e.proveedor) continue
      const k   = e.proveedor.toLowerCase().trim()
      const cur = map[k]
      if (!cur || e.año > cur.año || (e.año === cur.año && e.mes > cur.mes))
        map[k] = { mes: e.mes, año: e.año }
    }
    return map
  }, [egresos])

  function historialDe(p: Proveedor) {
    return egresos
      .filter(e => e.proveedor?.toLowerCase().trim() === p.nombre.toLowerCase().trim())
      .sort((a, b) => b.año !== a.año ? b.año - a.año : b.mes - a.mes)
  }

  // ── KPIs ──────────────────────────────────────────────────
  const totalActivos = useMemo(() => proveedores.filter(p => p.activo).length, [proveedores])
  const totalPagadoAnio = useMemo(() => {
    const anio = new Date().getFullYear()
    return egresos.filter(e => e.año === anio && e.proveedor).reduce((s, e) => s + e.monto, 0)
  }, [egresos])
  const categoriasDist = useMemo(
    () => new Set(proveedores.filter(p => p.activo).map(p => p.categoria)).size,
    [proveedores],
  )

  // ── Filtrado ──────────────────────────────────────────────
  const filtrados = useMemo(() => proveedores.filter(p => {
    if (filtroActivo === 'activos'   && !p.activo) return false
    if (filtroActivo === 'inactivos' &&  p.activo) return false
    if (filtroCat && p.categoria !== filtroCat)    return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      return (
        p.nombre.toLowerCase().includes(q)   ||
        (p.rut     ?? '').toLowerCase().includes(q) ||
        (p.contacto ?? '').toLowerCase().includes(q)
      )
    }
    return true
  }), [proveedores, filtroActivo, filtroCat, busqueda])

  // ── Validación ────────────────────────────────────────────
  function validar(): boolean {
    const err: FormErrors = {}
    if (!form.nombre.trim())            err.nombre    = 'Requerido'
    else if (form.nombre.trim().length < 2) err.nombre = 'Mínimo 2 caracteres'
    if (!form.categoria)                err.categoria = 'Requerido'
    setErrores(err)
    return Object.keys(err).length === 0
  }

  function cerrarModal() {
    setModalCrear(false)
    setEditando(null)
    setForm(FORM_VACIO)
    setErrores({})
  }

  // ── Crear ─────────────────────────────────────────────────
  async function handleCrear() {
    if (!validar()) return
    setGuardando(true)
    const row = {
      edificioId,
      nombre:   form.nombre.trim(),
      rut:      form.rut.trim()      || null,
      categoria: form.categoria,
      contacto: form.contacto.trim() || null,
      telefono: form.telefono.trim() || null,
      email:    form.email.trim()    || null,
      nota:     form.nota.trim()     || null,
      activo:   true,
    }
    const { data, error } = await supabaseBrowser
      .from('proveedores').insert(row).select().single()
    if (!error && data)
      setProveedores(prev =>
        [...prev, data as Proveedor].sort((a, b) => a.nombre.localeCompare(b.nombre))
      )
    setGuardando(false)
    cerrarModal()
  }

  // ── Editar ────────────────────────────────────────────────
  function abrirEditar(p: Proveedor) {
    setEditando(p)
    setForm({
      nombre:   p.nombre,
      rut:      p.rut      ?? '',
      categoria: p.categoria as CategoriaEgreso,
      contacto: p.contacto ?? '',
      telefono: p.telefono ?? '',
      email:    p.email    ?? '',
      nota:     p.nota     ?? '',
    })
    setErrores({})
  }

  async function handleEditar() {
    if (!validar() || !editando) return
    setGuardando(true)
    const row = {
      nombre:   form.nombre.trim(),
      rut:      form.rut.trim()      || null,
      categoria: form.categoria,
      contacto: form.contacto.trim() || null,
      telefono: form.telefono.trim() || null,
      email:    form.email.trim()    || null,
      nota:     form.nota.trim()     || null,
    }
    await supabaseBrowser.from('proveedores').update(row).eq('id', editando.id)
    setProveedores(prev => prev.map(p => p.id === editando.id ? { ...p, ...row } : p))
    setGuardando(false)
    cerrarModal()
  }

  // ── Eliminar ──────────────────────────────────────────────
  async function handleEliminar() {
    if (!eliminandoId) return
    await supabaseBrowser.from('proveedores').delete().eq('id', eliminandoId)
    setProveedores(prev => prev.filter(p => p.id !== eliminandoId))
    setEliminandoId(null)
  }

  // ── Toggle activo ─────────────────────────────────────────
  async function toggleActivo(p: Proveedor) {
    await supabaseBrowser.from('proveedores').update({ activo: !p.activo }).eq('id', p.id)
    setProveedores(prev => prev.map(x => x.id === p.id ? { ...x, activo: !x.activo } : x))
  }

  // ── CSV ───────────────────────────────────────────────────
  function exportarCSV() {
    const SEP = ';', BOM = '﻿', esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const enc = ['Nombre','Categoría','RUT','Contacto','Teléfono','Email','Total Pagado','Activo']
    const filas = filtrados.map(p => {
      const total = totalPorProv[p.nombre.toLowerCase().trim()] ?? 0
      return [
        p.nombre, p.categoria, p.rut ?? '', p.contacto ?? '',
        p.telefono ?? '', p.email ?? '', String(total), p.activo ? 'Sí' : 'No',
      ]
    })
    const body = [enc.map(esc).join(SEP), ...filas.map(r => r.map(esc).join(SEP))].join('\r\n')
    const url  = URL.createObjectURL(new Blob([BOM + body], { type: 'text/csv;charset=utf-8;' }))
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `proveedores_${edificioNombre.replace(/ /g, '_')}.csv`,
    })
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {edificioNombre} · Gestión y Historial de Pagos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => { setModalCrear(true); setForm(FORM_VACIO); setErrores({}) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: '#2563ae' }}
          >
            <Plus className="w-4 h-4" /> Nuevo proveedor
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Proveedores" value={String(proveedores.length)}
          sub={`${totalActivos} activos · ${proveedores.length - totalActivos} inactivos`}
          icon={<Truck className="w-5 h-5" />} color="#2563ae"
        />
        <KpiCard
          label="Activos" value={String(totalActivos)}
          sub={`${categoriasDist} categoría${categoriasDist !== 1 ? 's' : ''} distintas`}
          icon={<CheckCircle className="w-5 h-5" />} color="#059669"
        />
        <KpiCard
          label={`Total Pagado ${new Date().getFullYear()}`} value={fmtM(totalPagadoAnio)}
          sub="Suma egresos con proveedor identificado"
          icon={<TrendingDown className="w-5 h-5" />} color="#dc2626"
        />
        <KpiCard
          label="Categorías Activas" value={String(categoriasDist)}
          sub="Rubros de servicio cubiertos"
          icon={<BarChart3 className="w-5 h-5" />} color="#7c3aed"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, RUT, contacto…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 bg-white"
          />
        </div>
        <select
          value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-100 text-gray-600"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
          {(['todos','activos','inactivos'] as const).map(op => (
            <button
              key={op} onClick={() => setFiltroActivo(op)}
              className="px-4 py-2.5 text-sm font-medium transition-colors capitalize"
              style={{
                background: filtroActivo === op ? '#2563ae' : 'transparent',
                color:      filtroActivo === op ? 'white'   : '#6b7280',
              }}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm text-gray-500">
            {filtrados.length} proveedor{filtrados.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div className="px-6 py-14 text-center text-gray-400 text-sm">
            {busqueda || filtroCat
              ? 'Sin resultados para los filtros aplicados.'
              : 'No hay proveedores registrados. Agrega el primero con "Nuevo proveedor".'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Proveedor','Contacto','Total Pagado','Último Servicio','Estado',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(p => {
                  const key    = p.nombre.toLowerCase().trim()
                  const total  = totalPorProv[key] ?? 0
                  const ultimo = ultimoPorProv[key]
                  const txCount = egresos.filter(e => e.proveedor?.toLowerCase().trim() === key).length
                  const catCol = CAT_COLOR[p.categoria] ?? '#94a3b8'

                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">

                      {/* Nombre + categoría */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{p.nombre}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                            style={{ background: `${catCol}18`, color: catCol }}
                          >
                            {p.categoria}
                          </span>
                          {p.rut && (
                            <span className="text-xs text-gray-400">{p.rut}</span>
                          )}
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-4 py-3">
                        {p.contacto || p.telefono || p.email ? (
                          <div className="space-y-0.5">
                            {p.contacto && (
                              <div className="text-sm text-gray-700">{p.contacto}</div>
                            )}
                            {p.telefono && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3" /> {p.telefono}
                              </div>
                            )}
                            {p.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Mail className="w-3 h-3" /> {p.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Sin datos</span>
                        )}
                      </td>

                      {/* Total pagado */}
                      <td className="px-4 py-3">
                        {total > 0 ? (
                          <>
                            <div className="font-semibold text-gray-800">{fmtCLP(total)}</div>
                            <div className="text-xs text-gray-400">
                              {txCount} transacción{txCount !== 1 ? 'es' : ''}
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-300">Sin registros</span>
                        )}
                      </td>

                      {/* Último servicio */}
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {ultimo
                          ? `${MESES_ABREV[ultimo.mes - 1]} ${ultimo.año}`
                          : <span className="text-gray-300">—</span>
                        }
                      </td>

                      {/* Toggle activo */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActivo(p)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                          style={{
                            background: p.activo ? '#d1fae5' : '#fee2e2',
                            color:      p.activo ? '#059669' : '#dc2626',
                          }}
                        >
                          {p.activo
                            ? <><CheckCircle className="w-3 h-3" /> Activo</>
                            : <><XCircle    className="w-3 h-3" /> Inactivo</>
                          }
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setVerHistorial(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Ver historial de pagos"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => abrirEditar(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEliminandoId(p.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
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
        )}
      </div>

      {/* ── Modales ───────────────────────────────────────── */}

      {/* Crear */}
      <Modal
        abierto={modalCrear}
        onCerrar={cerrarModal}
        titulo="Nuevo Proveedor"
        subtitulo="Registra un proveedor o empresa de servicios"
      >
        <FormProveedor
          form={form} setForm={setForm} errores={errores}
          onSubmit={handleCrear} onCancel={cerrarModal}
          submitLabel="Crear proveedor" guardando={guardando}
        />
      </Modal>

      {/* Editar */}
      <Modal
        abierto={!!editando}
        onCerrar={cerrarModal}
        titulo="Editar Proveedor"
        subtitulo={editando?.nombre}
      >
        <FormProveedor
          form={form} setForm={setForm} errores={errores}
          onSubmit={handleEditar} onCancel={cerrarModal}
          submitLabel="Guardar cambios" guardando={guardando}
        />
      </Modal>

      {/* Historial */}
      <Modal
        abierto={!!verHistorial}
        onCerrar={() => setVerHistorial(null)}
        titulo={`Historial — ${verHistorial?.nombre ?? ''}`}
        subtitulo={verHistorial?.categoria}
        ancho="lg"
        colorAccento={CAT_COLOR[verHistorial?.categoria ?? ''] ?? '#2563ae'}
      >
        <HistorialPanel egresos={verHistorial ? historialDe(verHistorial) : []} />
      </Modal>

      {/* Confirmar eliminar */}
      <Modal
        abierto={!!eliminandoId}
        onCerrar={() => setEliminandoId(null)}
        titulo="¿Eliminar proveedor?"
        subtitulo="Esta acción no se puede deshacer"
        ancho="sm"
        colorAccento="#dc2626"
      >
        <p className="text-sm text-gray-600 mb-5">
          ¿Confirmas la eliminación? El historial de egresos no se verá afectado.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleEliminar}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#dc2626' }}
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => setEliminandoId(null)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  )
}
