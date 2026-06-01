'use client'

/**
 * ContratosView.tsx — Fase 31
 * CRUD completo de contratos de arriendo / comodato / propietario.
 * - KPIs: activos, próximos a vencer, monto total, sin contrato
 * - Filtros: tipo, estado, búsqueda
 * - Modales: crear, editar, ver, confirmar terminar/eliminar
 */

import { useState, useMemo } from 'react'
import {
  FileText, Plus, Search, Download, X, CheckCircle2,
  AlertCircle, Loader2, Calendar, DollarSign, User,
  Building2, Clock, Edit2, Trash2, Eye,
} from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { formatCLP }       from '@/lib/format'
import type { Contrato, User as UserType, Unidad } from '@/types'

// ─── Constantes ───────────────────────────────────────────────
const TIPOS_CONTRATO = ['arriendo', 'comodato', 'propietario', 'otro'] as const
const ESTADOS        = ['activo', 'pendiente', 'vencido', 'terminado'] as const

const TIPO_LABEL: Record<string, string> = {
  arriendo:    'Arriendo',
  comodato:    'Comodato',
  propietario: 'Propietario',
  otro:        'Otro',
}

const ESTADO_COLOR: Record<string, { bg: string; color: string }> = {
  activo:    { bg: '#dcfce7', color: '#16a34a' },
  pendiente: { bg: '#fef3c7', color: '#d97706' },
  vencido:   { bg: '#fee2e2', color: '#dc2626' },
  terminado: { bg: '#f1f5f9', color: '#64748b' },
}

const TIPO_COLOR: Record<string, { bg: string; color: string }> = {
  arriendo:    { bg: '#dbeafe', color: '#2563ae' },
  comodato:    { bg: '#faf5ff', color: '#7c3aed' },
  propietario: { bg: '#f0fdf4', color: '#16a34a' },
  otro:        { bg: '#f8fafc', color: '#64748b' },
}

// ─── Helpers ──────────────────────────────────────────────────
function diasParaVencer(fechaFin?: string | null): number | null {
  if (!fechaFin) return null
  return Math.ceil((new Date(fechaFin).getTime() - Date.now()) / 86_400_000)
}

function formatFecha(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Formulario vacío ─────────────────────────────────────────
const FORM_EMPTY = {
  unidadId:      '',
  usuarioId:     '',
  tipo:          'arriendo' as Contrato['tipo'],
  fechaInicio:   '',
  fechaFin:      '',
  monto:         '',
  deposito:      '',
  estado:        'activo' as Contrato['estado'],
  observaciones: '',
}

type FormContrato = typeof FORM_EMPTY

// ─── FormContrato (fuera del componente para evitar re-mount) ──
function FormContratoFields({
  form, setForm, errores, unidades, usuarios,
}: {
  form: FormContrato
  setForm: React.Dispatch<React.SetStateAction<FormContrato>>
  errores: Record<string, string>
  unidades: Unidad[]
  usuarios: UserType[]
}) {
  const inp = (
    field: keyof FormContrato,
    label: string,
    type = 'text',
    required = false,
  ) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200"
        style={{
          borderColor: errores[field] ? '#fca5a5' : '#e2e8f0',
          background:  errores[field] ? '#fef2f2' : 'white',
        }}
      />
      {errores[field] && <p className="text-xs text-red-500 mt-0.5">{errores[field]}</p>}
    </div>
  )

  const sel = <K extends keyof FormContrato>(
    field: K,
    label: string,
    options: { value: string; label: string }[],
    required = false,
  ) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={form[field] as string}
        onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        style={{
          borderColor: errores[field as string] ? '#fca5a5' : '#e2e8f0',
          background:  errores[field as string] ? '#fef2f2' : 'white',
        }}
      >
        <option value="">— Selecciona —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {errores[field as string] && <p className="text-xs text-red-500 mt-0.5">{errores[field as string]}</p>}
    </div>
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {sel('unidadId', 'Unidad', unidades.map(u => ({ value: u.id, label: `Nº ${u.numero} (Piso ${u.piso})` })), true)}
        {sel('usuarioId', 'Residente', usuarios.filter(u => u.rol === 'propietario' || u.rol === 'arrendatario').map(u => ({ value: u.id, label: `${u.nombre} ${u.apellido}` })), true)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {sel('tipo', 'Tipo', TIPOS_CONTRATO.map(t => ({ value: t, label: TIPO_LABEL[t] })), true)}
        {sel('estado', 'Estado', ESTADOS.map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) })))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {inp('fechaInicio', 'Fecha inicio', 'date', true)}
        {inp('fechaFin',    'Fecha término', 'date')}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {inp('monto',    'Monto mensual (CLP)', 'number', true)}
        {inp('deposito', 'Depósito (CLP)',       'number')}
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones</label>
        <textarea
          value={form.observaciones}
          onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          style={{ borderColor: '#e2e8f0' }}
        />
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  contratos:      Contrato[]
  usuarios:       UserType[]
  unidades:       Unidad[]
  edificioNombre: string
  edificioId:     string
}

// ─── Componente principal ─────────────────────────────────────
export default function ContratosView({
  contratos: contratosInicial,
  usuarios,
  unidades,
  edificioNombre,
  edificioId,
}: Props) {
  // ── State ──────────────────────────────────────────────────
  const [contratos,     setContratos]     = useState<Contrato[]>(contratosInicial)
  const [busqueda,      setBusqueda]      = useState('')
  const [filtroTipo,    setFiltroTipo]    = useState('')
  const [filtroEstado,  setFiltroEstado]  = useState('')

  const [modalCrear,    setModalCrear]    = useState(false)
  const [editando,      setEditando]      = useState<Contrato | null>(null)
  const [viendo,        setViendo]        = useState<Contrato | null>(null)
  const [eliminandoId,  setEliminandoId]  = useState<string | null>(null)

  const [form,          setForm]          = useState<FormContrato>(FORM_EMPTY)
  const [errores,       setErrores]       = useState<Record<string, string>>({})
  const [guardando,     setGuardando]     = useState(false)
  const [feedback,      setFeedback]      = useState('')

  // ── Helpers ────────────────────────────────────────────────
  const nombreUnidad  = (id: string) => `Nº ${unidades.find(u => u.id === id)?.numero ?? id}`
  const nombreUsuario = (id: string) => {
    const u = usuarios.find(u => u.id === id)
    return u ? `${u.nombre} ${u.apellido}` : id
  }

  // ── KPIs ───────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const activos       = contratos.filter(c => c.estado === 'activo')
    const proximosVenc  = activos.filter(c => {
      const d = diasParaVencer(c.fechaFin)
      return d !== null && d >= 0 && d <= 30
    })
    const montoTotal    = activos.reduce((s, c) => s + c.monto, 0)
    const unidadesConContrato = new Set(contratos.map(c => c.unidadId))
    const sinContrato   = unidades.filter(u =>
      u.estado === 'ocupado' && !unidadesConContrato.has(u.id),
    ).length

    return { activos: activos.length, proximosVenc: proximosVenc.length, montoTotal, sinContrato }
  }, [contratos, unidades])

  // ── Filtrados ──────────────────────────────────────────────
  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return contratos.filter(c => {
      if (filtroTipo   && c.tipo   !== filtroTipo)   return false
      if (filtroEstado && c.estado !== filtroEstado) return false
      if (q) {
        const unNum  = unidades.find(u => u.id === c.unidadId)?.numero ?? ''
        const usNom  = nombreUsuario(c.usuarioId).toLowerCase()
        if (!unNum.toLowerCase().includes(q) && !usNom.includes(q)) return false
      }
      return true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contratos, busqueda, filtroTipo, filtroEstado, unidades, usuarios])

  // ── Validar ────────────────────────────────────────────────
  const validar = (f: FormContrato): boolean => {
    const e: Record<string, string> = {}
    if (!f.unidadId)    e.unidadId    = 'Requerido'
    if (!f.usuarioId)   e.usuarioId   = 'Requerido'
    if (!f.tipo)        e.tipo        = 'Requerido'
    if (!f.fechaInicio) e.fechaInicio = 'Requerido'
    if (!f.monto || Number(f.monto) <= 0) e.monto = 'Monto inválido'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  // ── Crear ──────────────────────────────────────────────────
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validar(form)) return
    setGuardando(true)

    const now = new Date().toISOString()
    const id  = crypto.randomUUID()
    const payload: Contrato = {
      id,
      edificioId,
      unidadId:      form.unidadId,
      usuarioId:     form.usuarioId,
      tipo:          form.tipo,
      fechaInicio:   form.fechaInicio,
      fechaFin:      form.fechaFin || null,
      monto:         Number(form.monto),
      deposito:      form.deposito ? Number(form.deposito) : null,
      estado:        form.estado,
      observaciones: form.observaciones || null,
      documentoUrl:  null,
      creadoEn:      now,
      actualizadoEn: now,
    }

    await supabaseBrowser.from('contratos').insert(payload)
    setContratos(prev => [payload, ...prev])
    setModalCrear(false)
    setForm(FORM_EMPTY)
    setErrores({})
    setFeedback('Contrato creado correctamente')
    setTimeout(() => setFeedback(''), 3000)
    setGuardando(false)
  }

  // ── Editar ─────────────────────────────────────────────────
  const abrirEditar = (c: Contrato) => {
    setEditando(c)
    setForm({
      unidadId:      c.unidadId,
      usuarioId:     c.usuarioId,
      tipo:          c.tipo,
      fechaInicio:   c.fechaInicio,
      fechaFin:      c.fechaFin ?? '',
      monto:         String(c.monto),
      deposito:      c.deposito != null ? String(c.deposito) : '',
      estado:        c.estado,
      observaciones: c.observaciones ?? '',
    })
    setErrores({})
  }

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editando || !validar(form)) return
    setGuardando(true)

    const updated: Contrato = {
      ...editando,
      unidadId:      form.unidadId,
      usuarioId:     form.usuarioId,
      tipo:          form.tipo,
      fechaInicio:   form.fechaInicio,
      fechaFin:      form.fechaFin || null,
      monto:         Number(form.monto),
      deposito:      form.deposito ? Number(form.deposito) : null,
      estado:        form.estado,
      observaciones: form.observaciones || null,
      actualizadoEn: new Date().toISOString(),
    }

    await supabaseBrowser.from('contratos').update(updated).eq('id', editando.id)
    setContratos(prev => prev.map(c => c.id === editando.id ? updated : c))
    setEditando(null)
    setForm(FORM_EMPTY)
    setFeedback('Contrato actualizado')
    setTimeout(() => setFeedback(''), 3000)
    setGuardando(false)
  }

  // ── Eliminar ───────────────────────────────────────────────
  const handleEliminar = async () => {
    if (!eliminandoId) return
    await supabaseBrowser.from('contratos').delete().eq('id', eliminandoId)
    setContratos(prev => prev.filter(c => c.id !== eliminandoId))
    setEliminandoId(null)
  }

  // ── CSV export ────────────────────────────────────────────
  const exportarCSV = () => {
    const bom  = '﻿'
    const cols = ['Unidad','Residente','Tipo','Estado','Inicio','Término','Monto','Depósito']
    const rows = contratos.map(c =>
      [
        nombreUnidad(c.unidadId),
        nombreUsuario(c.usuarioId),
        TIPO_LABEL[c.tipo] ?? c.tipo,
        c.estado,
        formatFecha(c.fechaInicio),
        formatFecha(c.fechaFin),
        c.monto,
        c.deposito ?? 0,
      ].join(';'),
    )
    const csv  = bom + [cols.join(';'), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `contratos_${edificioNombre.replace(/\s+/g,'_')}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Modal helper ──────────────────────────────────────────
  const Modal = ({
    open, onClose, titulo, subtitulo, ancho = 'md', children,
  }: {
    open: boolean; onClose: () => void
    titulo: string; subtitulo?: string
    ancho?: 'sm' | 'md' | 'lg'
    children: React.ReactNode
  }) => {
    if (!open) return null
    const maxW = { sm: 400, md: 560, lg: 720 }[ancho]
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(15,35,65,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden"
          style={{ maxWidth: maxW }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div>
              <h2 className="font-bold text-gray-900">{titulo}</h2>
              {subtitulo && <p className="text-xs text-gray-400 mt-0.5">{subtitulo}</p>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" style={{ color: '#2563ae' }} />
            Contratos
          </h1>
          <p className="text-gray-500 mt-1">{edificioNombre} · Gestión de contratos de arriendo y propietarios</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: '#f1f5f9', color: '#64748b' }}
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => { setModalCrear(true); setForm(FORM_EMPTY); setErrores({}) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: '#2563ae' }}
          >
            <Plus className="w-4 h-4" /> Nuevo contrato
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {feedback}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Contratos activos',     value: kpis.activos,                color: '#2563ae', bg: '#eff6ff', Icon: FileText      },
          { label: 'Vencen en 30 días',     value: kpis.proximosVenc,            color: '#d97706', bg: '#fffbeb', Icon: Clock         },
          { label: 'Arriendo mensual total',value: formatCLP(kpis.montoTotal),   color: '#16a34a', bg: '#f0fdf4', Icon: DollarSign    },
          { label: 'Sin contrato (ocup.)',   value: kpis.sinContrato,             color: '#dc2626', bg: '#fef2f2', Icon: AlertCircle   },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon style={{ color, width: 18, height: 18 }} />
              </div>
              <p className="text-xs font-semibold text-gray-500 leading-tight">{label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por unidad o residente…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            style={{ borderColor: '#e2e8f0' }}
          />
        </div>
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          style={{ borderColor: '#e2e8f0' }}
        >
          <option value="">Todos los tipos</option>
          {TIPOS_CONTRATO.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
        </select>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          style={{ borderColor: '#e2e8f0' }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
          <p className="text-sm font-semibold text-gray-700">{filtrados.length} contratos</p>
        </div>

        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No hay contratos que coincidan con el filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {['Unidad','Residente','Tipo','Estado','Período','Monto mensual','Acciones'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                {filtrados.map(c => {
                  const dias = diasParaVencer(c.fechaFin)
                  const proxVenc = dias !== null && dias >= 0 && dias <= 30

                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      {/* Unidad */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-300" />
                          <span className="font-semibold text-gray-900">{nombreUnidad(c.unidadId)}</span>
                        </div>
                      </td>

                      {/* Residente */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-300" />
                          <span className="text-gray-700">{nombreUsuario(c.usuarioId)}</span>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: TIPO_COLOR[c.tipo]?.bg, color: TIPO_COLOR[c.tipo]?.color }}>
                          {TIPO_LABEL[c.tipo] ?? c.tipo}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: ESTADO_COLOR[c.estado]?.bg, color: ESTADO_COLOR[c.estado]?.color }}>
                          {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                        </span>
                      </td>

                      {/* Período */}
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatFecha(c.fechaInicio)}</span>
                        </div>
                        {c.fechaFin && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-gray-300">→</span>
                            <span className={proxVenc ? 'font-semibold' : ''} style={{ color: proxVenc ? '#d97706' : undefined }}>
                              {formatFecha(c.fechaFin)}
                            </span>
                            {proxVenc && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                                style={{ background: '#fef3c7', color: '#d97706' }}>
                                {dias}d
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Monto */}
                      <td className="px-5 py-3.5 font-semibold" style={{ color: '#16a34a' }}>
                        {formatCLP(c.monto)}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViendo(c)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-3.5 h-3.5" style={{ color: '#2563ae' }} />
                          </button>
                          <button
                            onClick={() => abrirEditar(c)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
                          </button>
                          <button
                            onClick={() => setEliminandoId(c.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
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

      {/* ─── Modal Crear ─────────────────────────────────────── */}
      <Modal
        open={modalCrear}
        onClose={() => { setModalCrear(false); setErrores({}) }}
        titulo="Nuevo contrato"
        subtitulo="Completa los datos del contrato"
      >
        <form onSubmit={handleCrear} className="space-y-4">
          <FormContratoFields form={form} setForm={setForm} errores={errores} unidades={unidades} usuarios={usuarios} />
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#f1f5f9' }}>
            <button type="submit" disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
              style={{ background: '#2563ae' }}>
              {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : <><Plus className="w-4 h-4" /> Crear contrato</>}
            </button>
            <button type="button" onClick={() => setModalCrear(false)}
              className="px-4 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid #e2e8f0' }}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal Editar ─────────────────────────────────────── */}
      <Modal
        open={!!editando}
        onClose={() => { setEditando(null); setErrores({}) }}
        titulo="Editar contrato"
        subtitulo={editando ? `${nombreUnidad(editando.unidadId)} — ${nombreUsuario(editando.usuarioId)}` : ''}
      >
        <form onSubmit={handleEditar} className="space-y-4">
          <FormContratoFields form={form} setForm={setForm} errores={errores} unidades={unidades} usuarios={usuarios} />
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#f1f5f9' }}>
            <button type="submit" disabled={guardando}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
              style={{ background: '#2563ae' }}>
              {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</> : <><CheckCircle2 className="w-4 h-4" /> Guardar cambios</>}
            </button>
            <button type="button" onClick={() => setEditando(null)}
              className="px-4 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid #e2e8f0' }}>
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal Ver detalle ────────────────────────────────── */}
      <Modal
        open={!!viendo}
        onClose={() => setViendo(null)}
        titulo="Detalle del contrato"
        subtitulo={viendo ? `${nombreUnidad(viendo.unidadId)} — ${nombreUsuario(viendo.usuarioId)}` : ''}
        ancho="lg"
      >
        {viendo && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { l: 'Unidad',          v: nombreUnidad(viendo.unidadId),  Icon: Building2  },
                { l: 'Residente',       v: nombreUsuario(viendo.usuarioId),Icon: User        },
                { l: 'Tipo',            v: TIPO_LABEL[viendo.tipo],        Icon: FileText    },
                { l: 'Estado',          v: viendo.estado.charAt(0).toUpperCase() + viendo.estado.slice(1), Icon: CheckCircle2 },
                { l: 'Fecha inicio',    v: formatFecha(viendo.fechaInicio),Icon: Calendar    },
                { l: 'Fecha término',   v: formatFecha(viendo.fechaFin),   Icon: Calendar    },
                { l: 'Monto mensual',   v: formatCLP(viendo.monto),        Icon: DollarSign  },
                { l: 'Depósito',        v: viendo.deposito ? formatCLP(viendo.deposito) : '—', Icon: DollarSign },
              ].map(({ l, v, Icon }) => (
                <div key={l} className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-400">{l}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{v}</p>
                </div>
              ))}
            </div>
            {viendo.observaciones && (
              <div className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                <p className="text-xs font-semibold text-gray-400 mb-1">Observaciones</p>
                <p className="text-sm text-gray-700">{viendo.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ─── Modal Eliminar ───────────────────────────────────── */}
      <Modal
        open={!!eliminandoId}
        onClose={() => setEliminandoId(null)}
        titulo="¿Eliminar contrato?"
        ancho="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Esta acción eliminará el contrato permanentemente. ¿Confirmas?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEliminar}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-all"
              style={{ background: '#dc2626' }}
            >
              Sí, eliminar
            </button>
            <button
              onClick={() => setEliminandoId(null)}
              className="flex-1 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid #e2e8f0' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
