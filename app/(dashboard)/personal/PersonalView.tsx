'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Users, Plus, Pencil, Trash2,
  Search, FileDown,
} from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Modal from '@/components/modal'
import type { PersonalEdificio, TipoContratoPersonal } from '@/types'

// ─── Constantes ───────────────────────────────────────────────
const TIPOS: TipoContratoPersonal[] = ['planta', 'part-time', 'honorario', 'finiquitado']

const TIPO_CFG: Record<TipoContratoPersonal, { label: string; color: string; bg: string }> = {
  'planta':       { label: 'Planta',       color: '#16a34a', bg: '#dcfce7' },
  'part-time':    { label: 'Part-Time',    color: '#2563ae', bg: '#dbeafe' },
  'honorario':    { label: 'Honorario',    color: '#7c3aed', bg: '#f3e8ff' },
  'finiquitado':  { label: 'Finiquitado',  color: '#6b7280', bg: '#f1f5f9' },
}

const CARGOS = [
  'Conserje Jefe', 'Conserje', 'Aseo y Limpieza', 'Jardinero',
  'Mantenimiento', 'Portería', 'Administración', 'Personal de Planta',
  'Personal Part-Time', 'Otro',
]

// ─── CSV ──────────────────────────────────────────────────────
function descargarCSV(rows: PersonalEdificio[]) {
  const SEP = ';', BOM = '﻿'
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const enc = ['Nombre', 'Apellido', 'Cargo', 'Tipo', 'RUT', 'F.Ingreso', 'F.Finiquito', 'Estado', 'Nota']
  const filas = rows.map(p => [
    p.nombre, p.apellido, p.cargo, p.tipoContrato,
    p.rut ?? '', p.fechaIngreso ?? '', p.fechaFiniquito ?? '',
    p.activo ? 'Activo' : 'Inactivo', p.nota ?? '',
  ])
  const body = [enc.map(esc).join(SEP), ...filas.map(f => f.map(esc).join(SEP))].join('\r\n')
  const url = URL.createObjectURL(new Blob([BOM + body], { type: 'text/csv;charset=utf-8;' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'propify_personal.csv' })
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ─── Interfaces de formulario ─────────────────────────────────
interface FormState {
  nombre:         string
  apellido:       string
  cargo:          string
  tipoContrato:   TipoContratoPersonal
  rut:            string
  fechaIngreso:   string
  fechaFiniquito: string
  sueldo:         string
  activo:         boolean
  nota:           string
}
const FORM_VACIO: FormState = {
  nombre: '', apellido: '', cargo: 'Personal de Planta',
  tipoContrato: 'planta', rut: '', fechaIngreso: '',
  fechaFiniquito: '', sueldo: '', activo: true, nota: '',
}
type FormErrors = Partial<Record<keyof FormState, string>>

// ─── Props ────────────────────────────────────────────────────
interface Props {
  personal:   PersonalEdificio[]
  edificioId: string
}

// ─── Componente ───────────────────────────────────────────────
export default function PersonalView({ personal: initial, edificioId }: Props) {
  const [personal,  setPersonal]  = useState<PersonalEdificio[]>(initial)
  const [busqueda,  setBusqueda]  = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoContratoPersonal | 'todos'>('todos')

  // Modal crear
  const [modalCrear,  setModalCrear]  = useState(false)
  const [formCrear,   setFormCrear]   = useState<FormState>(FORM_VACIO)
  const [erroresCrear, setErroresCrear] = useState<FormErrors>({})
  const [guardando,   setGuardando]   = useState(false)

  // Modal editar
  const [editandoId,  setEditandoId]  = useState<string | null>(null)
  const [formEdit,    setFormEdit]    = useState<FormState>(FORM_VACIO)
  const [erroresEdit, setErroresEdit] = useState<FormErrors>({})

  // Confirmar eliminar
  const [eliminarId, setEliminarId] = useState<string | null>(null)

  // ── Filtrado ────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    let r = personal
    if (filtroTipo !== 'todos') r = r.filter(p => p.tipoContrato === filtroTipo)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      r = r.filter(p =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(q) ||
        p.cargo.toLowerCase().includes(q) ||
        (p.rut ?? '').includes(q),
      )
    }
    return r
  }, [personal, filtroTipo, busqueda])

  // ── Stats ───────────────────────────────────────────────────
  const totalPlanta     = personal.filter(p => p.tipoContrato === 'planta').length
  const totalPartTime   = personal.filter(p => p.tipoContrato === 'part-time').length
  const totalHonorario  = personal.filter(p => p.tipoContrato === 'honorario').length
  const totalFiniquitado= personal.filter(p => p.tipoContrato === 'finiquitado').length

  // ── Validar ─────────────────────────────────────────────────
  const validar = (f: FormState): FormErrors => {
    const e: FormErrors = {}
    if (!f.nombre.trim())   e.nombre   = 'Nombre requerido'
    if (!f.apellido.trim()) e.apellido = 'Apellido requerido'
    if (!f.cargo.trim())    e.cargo    = 'Cargo requerido'
    return e
  }

  // ── Crear ───────────────────────────────────────────────────
  const handleCrear = useCallback(async () => {
    const err = validar(formCrear)
    if (Object.keys(err).length) { setErroresCrear(err); return }
    setGuardando(true)

    const nuevo: PersonalEdificio = {
      id:              crypto.randomUUID(),
      edificioId,
      nombre:          formCrear.nombre.trim(),
      apellido:        formCrear.apellido.trim(),
      cargo:           formCrear.cargo.trim(),
      tipoContrato:    formCrear.tipoContrato,
      rut:             formCrear.rut.trim()            || null,
      fechaIngreso:    formCrear.fechaIngreso           || null,
      fechaFiniquito:  formCrear.fechaFiniquito         || null,
      sueldo:          formCrear.sueldo ? Number(formCrear.sueldo) : null,
      activo:          formCrear.tipoContrato !== 'finiquitado',
      nota:            formCrear.nota.trim()            || null,
      creadoEn:        new Date().toISOString(),
    }

    setPersonal(prev => [nuevo, ...prev])
    setModalCrear(false)
    setFormCrear(FORM_VACIO)
    setGuardando(false)

    supabaseBrowser
      .from('personal_edificio')
      .insert({
        id:             nuevo.id,
        edificioId:     nuevo.edificioId,
        nombre:         nuevo.nombre,
        apellido:       nuevo.apellido,
        cargo:          nuevo.cargo,
        tipoContrato:   nuevo.tipoContrato,
        rut:            nuevo.rut,
        fechaIngreso:   nuevo.fechaIngreso,
        fechaFiniquito: nuevo.fechaFiniquito,
        sueldo:         nuevo.sueldo,
        activo:         nuevo.activo,
        nota:           nuevo.nota,
      })
      .then(({ error }) => { if (error) console.warn('[Personal] Error creando:', error.message) })
  }, [formCrear, edificioId])

  // ── Abrir editar ────────────────────────────────────────────
  const abrirEditar = useCallback((p: PersonalEdificio) => {
    setEditandoId(p.id)
    setFormEdit({
      nombre:         p.nombre,
      apellido:       p.apellido,
      cargo:          p.cargo,
      tipoContrato:   p.tipoContrato,
      rut:            p.rut            ?? '',
      fechaIngreso:   p.fechaIngreso   ?? '',
      fechaFiniquito: p.fechaFiniquito ?? '',
      sueldo:         p.sueldo != null ? String(p.sueldo) : '',
      activo:         p.activo,
      nota:           p.nota           ?? '',
    })
    setErroresEdit({})
  }, [])

  // ── Guardar edición ─────────────────────────────────────────
  const handleEditar = useCallback(() => {
    const err = validar(formEdit)
    if (Object.keys(err).length) { setErroresEdit(err); return }
    if (!editandoId) return

    setPersonal(prev => prev.map(p =>
      p.id === editandoId
        ? {
            ...p,
            nombre:         formEdit.nombre.trim(),
            apellido:       formEdit.apellido.trim(),
            cargo:          formEdit.cargo.trim(),
            tipoContrato:   formEdit.tipoContrato,
            rut:            formEdit.rut.trim()           || null,
            fechaIngreso:   formEdit.fechaIngreso          || null,
            fechaFiniquito: formEdit.fechaFiniquito        || null,
            sueldo:         formEdit.sueldo ? Number(formEdit.sueldo) : null,
            activo:         formEdit.tipoContrato !== 'finiquitado',
            nota:           formEdit.nota.trim()           || null,
          }
        : p,
    ))
    const id = editandoId
    setEditandoId(null)

    supabaseBrowser
      .from('personal_edificio')
      .update({
        nombre:         formEdit.nombre.trim(),
        apellido:       formEdit.apellido.trim(),
        cargo:          formEdit.cargo.trim(),
        tipoContrato:   formEdit.tipoContrato,
        rut:            formEdit.rut.trim()           || null,
        fechaIngreso:   formEdit.fechaIngreso          || null,
        fechaFiniquito: formEdit.fechaFiniquito        || null,
        sueldo:         formEdit.sueldo ? Number(formEdit.sueldo) : null,
        activo:         formEdit.tipoContrato !== 'finiquitado',
        nota:           formEdit.nota.trim()           || null,
      })
      .eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Personal] Error editando:', error.message) })
  }, [editandoId, formEdit])

  // ── Eliminar ────────────────────────────────────────────────
  const handleEliminar = useCallback(() => {
    if (!eliminarId) return
    setPersonal(prev => prev.filter(p => p.id !== eliminarId))
    const id = eliminarId
    setEliminarId(null)
    supabaseBrowser
      .from('personal_edificio')
      .delete()
      .eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Personal] Error eliminando:', error.message) })
  }, [eliminarId])

  // ── Form helper ─────────────────────────────────────────────
  function FormPersonal({
    form, setForm, errores,
  }: {
    form: FormState
    setForm: React.Dispatch<React.SetStateAction<FormState>>
    errores: FormErrors
  }) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre *</label>
            <input
              type="text"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: errores.nombre ? '#dc2626' : '#e2e8f0' }}
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Juan"
            />
            {errores.nombre && <p className="text-xs text-red-500 mt-1">{errores.nombre}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Apellido *</label>
            <input
              type="text"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: errores.apellido ? '#dc2626' : '#e2e8f0' }}
              value={form.apellido}
              onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
              placeholder="Ej: Pérez"
            />
            {errores.apellido && <p className="text-xs text-red-500 mt-1">{errores.apellido}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cargo *</label>
          <select
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: errores.cargo ? '#dc2626' : '#e2e8f0' }}
            value={form.cargo}
            onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
          >
            {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tipo de contrato</label>
          <select
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: '#e2e8f0' }}
            value={form.tipoContrato}
            onChange={e => setForm(f => ({ ...f, tipoContrato: e.target.value as TipoContratoPersonal }))}
          >
            {TIPOS.map(t => (
              <option key={t} value={t}>{TIPO_CFG[t].label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">RUT</label>
            <input
              type="text"
              placeholder="12.345.678-9"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: '#e2e8f0' }}
              value={form.rut}
              onChange={e => setForm(f => ({ ...f, rut: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sueldo base (CLP)</label>
            <input
              type="number"
              placeholder="500000"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: '#e2e8f0' }}
              value={form.sueldo}
              onChange={e => setForm(f => ({ ...f, sueldo: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fecha ingreso</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: '#e2e8f0' }}
              value={form.fechaIngreso}
              onChange={e => setForm(f => ({ ...f, fechaIngreso: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Fecha finiquito</label>
            <input
              type="date"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: '#e2e8f0' }}
              value={form.fechaFiniquito}
              onChange={e => setForm(f => ({ ...f, fechaFiniquito: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nota</label>
          <textarea
            rows={2}
            placeholder="Observaciones..."
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            style={{ borderColor: '#e2e8f0' }}
            value={form.nota}
            onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
          />
        </div>
      </div>
    )
  }

  // ── JSX ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal del Edificio</h1>
          <p className="text-gray-500 mt-1">
            {personal.filter(p => p.activo).length} activos ·{' '}
            {totalPlanta} planta · {totalPartTime} part-time · {totalHonorario} honorario
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => descargarCSV(filtrados)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#f1f5f9', color: '#1e3a5f' }}
          >
            <FileDown className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => { setFormCrear(FORM_VACIO); setErroresCrear({}); setModalCrear(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#2563ae' }}
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Planta',      value: totalPlanta,      color: '#16a34a', bg: '#dcfce7' },
          { label: 'Part-Time',   value: totalPartTime,    color: '#2563ae', bg: '#dbeafe' },
          { label: 'Honorario',   value: totalHonorario,   color: '#7c3aed', bg: '#f3e8ff' },
          { label: 'Finiquitado', value: totalFiniquitado, color: '#6b7280', bg: '#f1f5f9' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl p-4 text-center" style={{ background: bg }}>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cargo, RUT…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: '#e2e8f0' }}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['todos', ...TIPOS] as const).map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={
                filtroTipo === t
                  ? { background: '#1e3a5f', color: 'white' }
                  : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              {t === 'todos' ? 'Todos' : TIPO_CFG[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-semibold">Sin resultados</p>
            <p className="text-sm mt-1">Ajusta los filtros o agrega personal</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Nombre', 'Cargo', 'Tipo', 'RUT', 'F. Ingreso', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => {
                  const cfg = TIPO_CFG[p.tipoContrato]
                  return (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-slate-50 transition-colors"
                      style={{ borderColor: '#f1f5f9', opacity: p.activo ? 1 : 0.55 }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {p.nombre.charAt(0)}{p.apellido.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{p.nombre} {p.apellido}</p>
                            {p.nota && (
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.nota}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.cargo}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.rut ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p.fechaIngreso
                          ? new Date(p.fechaIngreso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: '#64748b' }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEliminarId(p.id)}
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
            <div className="px-5 py-3 border-t flex justify-between items-center" style={{ borderColor: '#f1f5f9' }}>
              <p className="text-xs text-gray-400">
                Mostrando {filtrados.length} de {personal.length} personas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Crear ── */}
      <Modal abierto={modalCrear} onCerrar={() => setModalCrear(false)} titulo="Agregar Personal">
        <FormPersonal form={formCrear} setForm={setFormCrear} errores={erroresCrear} />
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setModalCrear(false)}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50"
            style={{ borderColor: '#e2e8f0' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={guardando}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            style={{ background: '#2563ae' }}
          >
            {guardando ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
      </Modal>

      {/* ── Modal Editar ── */}
      {editandoId && (
        <Modal abierto={!!editandoId} onCerrar={() => setEditandoId(null)} titulo="Editar Personal">
          <FormPersonal form={formEdit} setForm={setFormEdit} errores={erroresEdit} />
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setEditandoId(null)}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50"
              style={{ borderColor: '#e2e8f0' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleEditar}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
              style={{ background: '#2563ae' }}
            >
              Guardar cambios
            </button>
          </div>
        </Modal>
      )}

      {/* ── Confirmar eliminar ── */}
      {eliminarId && (() => {
        const p = personal.find(x => x.id === eliminarId)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEliminarId(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-4" style={{ background: '#fee2e2' }}>
                <Trash2 className="w-5 h-5" style={{ color: '#dc2626' }} />
              </div>
              <h2 className="text-lg font-bold text-gray-900 text-center">¿Eliminar persona?</h2>
              <p className="text-sm text-gray-500 text-center mt-2">
                {p ? `${p.nombre} ${p.apellido} — ${p.cargo}` : ''}
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEliminarId(null)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50"
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
            </div>
          </div>
        )
      })()}
    </div>
  )
}
