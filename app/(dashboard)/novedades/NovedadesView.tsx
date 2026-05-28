'use client'

/**
 * NovedadesView.tsx — Fase 34: Libro de Novedades
 * Bitácora del conserje: incidencias, entregas, mantenimiento, visitantes.
 * Admin y conserje pueden crear/editar. Admin puede cerrar y ver historial.
 */

import { useState, useMemo } from 'react'
import {
  Plus, Search, BookOpen, AlertTriangle, Wrench,
  Users, Package, MoreHorizontal, CheckCircle2,
  Clock, Loader2, Pencil, Trash2, X,
  ArrowRight, CalendarDays, ChevronDown, Eye,
} from 'lucide-react'
import Modal from '@/components/modal'
import { supabase } from '@/lib/supabase'
import type { Novedad, CategoriaNovedad, PrioridadNovedad, EstadoNovedad, User } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
const categoriaCfg: Record<CategoriaNovedad, { label: string; bg: string; color: string; Icon: React.ElementType }> = {
  incidencia:    { label: 'Incidencia',    bg: '#fee2e2', color: '#dc2626', Icon: AlertTriangle },
  mantenimiento: { label: 'Mantenimiento', bg: '#fef3c7', color: '#d97706', Icon: Wrench        },
  visitante:     { label: 'Visitante',     bg: '#dbeafe', color: '#2563ae', Icon: Users          },
  entrega:       { label: 'Entrega',       bg: '#f3e8ff', color: '#7c3aed', Icon: Package        },
  otro:          { label: 'Otro',          bg: '#f1f5f9', color: '#64748b', Icon: MoreHorizontal },
}

const prioridadCfg: Record<PrioridadNovedad, { label: string; color: string; dot: string }> = {
  alta:  { label: 'Alta',  color: '#dc2626', dot: '#ef4444' },
  media: { label: 'Media', color: '#d97706', dot: '#f59e0b' },
  baja:  { label: 'Baja',  color: '#64748b', dot: '#94a3b8' },
}

const estadoCfg: Record<EstadoNovedad, { label: string; bg: string; color: string; Icon: React.ElementType }> = {
  abierto:    { label: 'Abierto',     bg: '#fee2e2', color: '#dc2626', Icon: AlertTriangle },
  en_proceso: { label: 'En proceso',  bg: '#fef3c7', color: '#d97706', Icon: Loader2      },
  cerrado:    { label: 'Cerrado',     bg: '#dcfce7', color: '#16a34a', Icon: CheckCircle2 },
}

const FORM_VACÍO = {
  titulo:          '',
  descripcion:     '',
  categoria:       'incidencia' as CategoriaNovedad,
  prioridad:       'media'      as PrioridadNovedad,
  estado:          'abierto'    as EstadoNovedad,
  reportadoPorId:  '',
}

interface Props {
  novedades:       Novedad[]
  usuarios:        User[]
  edificioNombre:  string
  edificioId:      string
}

// ─── Componente ───────────────────────────────────────────────
export default function NovedadesView({ novedades: initNov, usuarios, edificioNombre, edificioId }: Props) {
  const [novedades,    setNovedades]    = useState(initNov)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroCateg,  setFiltroCateg]  = useState<'todos' | CategoriaNovedad>('todos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoNovedad>('todos')
  const [filtroPrior,  setFiltroPrior]  = useState<'todos' | PrioridadNovedad>('todos')

  // Modales
  const [modalForm,   setModalForm]   = useState(false)
  const [modalVer,    setModalVer]    = useState(false)
  const [modalBorrar, setModalBorrar] = useState(false)
  const [novActual,   setNovActual]   = useState<Novedad | null>(null)
  const [modoEditar,  setModoEditar]  = useState(false)

  const [form,   setForm]   = useState(FORM_VACÍO)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // ── Filtrado ──────────────────────────────────────────────
  const filtered = useMemo(() => novedades.filter(n => {
    if (filtroCateg  !== 'todos' && n.categoria !== filtroCateg)  return false
    if (filtroEstado !== 'todos' && n.estado    !== filtroEstado) return false
    if (filtroPrior  !== 'todos' && n.prioridad !== filtroPrior)  return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!n.titulo.toLowerCase().includes(q) && !n.descripcion?.toLowerCase().includes(q)) return false
    }
    return true
  }), [novedades, filtroCateg, filtroEstado, filtroPrior, busqueda])

  // ── KPIs ──────────────────────────────────────────────────
  const hoy = new Date().toISOString().slice(0, 10)
  const kpis = {
    abiertas:   novedades.filter(n => n.estado === 'abierto').length,
    enProceso:  novedades.filter(n => n.estado === 'en_proceso').length,
    cerradasHoy: novedades.filter(n => n.estado === 'cerrado' && n.cerradoEn?.slice(0, 10) === hoy).length,
    urgentes:   novedades.filter(n => n.prioridad === 'alta' && n.estado !== 'cerrado').length,
  }

  // ── Nombre usuario ────────────────────────────────────────
  function nombreUsuario(id?: string | null) {
    if (!id) return 'Conserje'
    const u = usuarios.find(x => x.id === id)
    return u ? `${u.nombre} ${u.apellido}` : 'Desconocido'
  }

  // ── Guardar ───────────────────────────────────────────────
  async function handleGuardar() {
    if (!form.titulo) { setError('El título es obligatorio'); return }
    setSaving(true); setError('')

    if (modoEditar && novActual) {
      const updates = {
        titulo:        form.titulo,
        descripcion:   form.descripcion,
        categoria:     form.categoria,
        prioridad:     form.prioridad,
        estado:        form.estado,
        cerradoEn:     form.estado === 'cerrado' ? new Date().toISOString() : null,
      }
      const { error: err } = await supabase.from('novedades').update(updates).eq('id', novActual.id)
      if (err) { setError(err.message); setSaving(false); return }
      setNovedades(prev => prev.map(n => n.id === novActual.id ? { ...n, ...updates } : n))
    } else {
      const nuevo: Novedad = {
        id:             `nov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        edificioId,
        titulo:         form.titulo,
        descripcion:    form.descripcion,
        categoria:      form.categoria,
        prioridad:      form.prioridad,
        estado:         form.estado,
        reportadoPorId: form.reportadoPorId || null,
        creadoEn:       new Date().toISOString(),
        cerradoEn:      null,
      }
      const { error: err } = await supabase.from('novedades').insert([nuevo])
      if (err) { setError(err.message); setSaving(false); return }
      setNovedades(prev => [nuevo, ...prev])
    }

    setSaving(false)
    setModalForm(false)
    setForm(FORM_VACÍO)
  }

  // ── Cambiar estado ────────────────────────────────────────
  async function cambiarEstado(id: string, estado: EstadoNovedad) {
    const cerradoEn = estado === 'cerrado' ? new Date().toISOString() : null
    await supabase.from('novedades').update({ estado, cerradoEn }).eq('id', id)
    setNovedades(prev => prev.map(n => n.id === id ? { ...n, estado, cerradoEn } : n))
    if (novActual?.id === id) setNovActual(n => n ? { ...n, estado, cerradoEn } : n)
  }

  // ── Eliminar ──────────────────────────────────────────────
  async function handleEliminar() {
    if (!novActual) return
    await supabase.from('novedades').delete().eq('id', novActual.id)
    setNovedades(prev => prev.filter(n => n.id !== novActual.id))
    setModalBorrar(false)
    setNovActual(null)
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Libro de Novedades</h1>
          <p className="text-gray-500 mt-1">{edificioNombre} · {novedades.length} novedades registradas</p>
        </div>
        <button
          onClick={() => { setModoEditar(false); setForm(FORM_VACÍO); setError(''); setModalForm(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Nueva novedad
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Abiertas',     value: kpis.abiertas,    color: '#dc2626', bg: '#fee2e2' },
          { label: 'En proceso',   value: kpis.enProceso,   color: '#d97706', bg: '#fef3c7' },
          { label: 'Cerradas hoy', value: kpis.cerradasHoy, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Alta prioridad', value: kpis.urgentes,  color: '#7c3aed', bg: '#f3e8ff' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
            <p className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Categoría */}
          <div className="flex gap-1 flex-wrap">
            {(['todos', ...Object.keys(categoriaCfg)] as const).map(v => (
              <button key={v} onClick={() => setFiltroCateg(v as 'todos' | CategoriaNovedad)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={filtroCateg === v ? { background: '#2563ae', color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
              >
                {v === 'todos' ? 'Todos' : categoriaCfg[v as CategoriaNovedad].label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />
          {/* Estado */}
          <div className="flex gap-1 flex-wrap">
            {(['todos', 'abierto', 'en_proceso', 'cerrado'] as const).map(v => (
              <button key={v} onClick={() => setFiltroEstado(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={filtroEstado === v ? { background: '#1e3a5f', color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
              >
                {v === 'todos' ? 'Todos' : estadoCfg[v].label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />
          {/* Prioridad */}
          <div className="flex gap-1 flex-wrap">
            {(['todos', 'alta', 'media', 'baja'] as const).map(v => (
              <button key={v} onClick={() => setFiltroPrior(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                style={filtroPrior === v ? { background: '#1e3a5f', color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
              >
                {v !== 'todos' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: prioridadCfg[v].dot }} />}
                {v === 'todos' ? 'Todas' : prioridadCfg[v].label}
              </button>
            ))}
          </div>
          {/* Búsqueda */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar novedad…"
              className="pl-9 pr-4 py-1.5 rounded-lg border text-sm outline-none transition-all"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#0f172a', width: 200 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#2563ae'; e.currentTarget.style.background = 'white' }}
              onBlur={e  => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border shadow-sm p-12 text-center" style={{ borderColor: '#e2e8f0' }}>
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay novedades registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(nov => {
            const catCfg  = categoriaCfg[nov.categoria]
            const estCfg  = estadoCfg[nov.estado]
            const { Icon: CatIcon } = catCfg
            const { Icon: EstIcon } = estCfg
            const priorCfg = prioridadCfg[nov.prioridad]

            return (
              <div key={nov.id}
                className="bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 hover:border-blue-200 transition-colors group"
                style={{ borderColor: nov.estado === 'abierto' && nov.prioridad === 'alta' ? '#fca5a5' : '#e2e8f0' }}
              >
                {/* Icono categoría */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: catCfg.bg }}>
                  <CatIcon className="w-4 h-4" style={{ color: catCfg.color }} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: catCfg.bg, color: catCfg.color }}>
                      {catCfg.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: priorCfg.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: priorCfg.dot }} />
                      {priorCfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">{nov.titulo}</p>
                  {nov.descripcion && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{nov.descripcion}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(nov.creadoEn).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>{nombreUsuario(nov.reportadoPorId)}</span>
                  </div>
                </div>

                {/* Estado + acciones */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: estCfg.bg, color: estCfg.color }}>
                    <EstIcon className="w-3 h-3" />
                    {estCfg.label}
                  </span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setNovActual(nov); setModalVer(true) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setNovActual(nov); setModoEditar(true); setForm({ titulo: nov.titulo, descripcion: nov.descripcion ?? '', categoria: nov.categoria, prioridad: nov.prioridad, estado: nov.estado, reportadoPorId: nov.reportadoPorId ?? '' }); setError(''); setModalForm(true) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setNovActual(nov); setModalBorrar(true) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal: Ver detalle ── */}
      <Modal abierto={modalVer} onCerrar={() => setModalVer(false)} titulo={novActual?.titulo ?? ''} subtitulo={novActual ? `${categoriaCfg[novActual.categoria]?.label} · ${new Date(novActual.creadoEn).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''} ancho="md">
        {novActual && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: categoriaCfg[novActual.categoria].bg, color: categoriaCfg[novActual.categoria].color }}>
                {categoriaCfg[novActual.categoria].label}
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: estadoCfg[novActual.estado].bg, color: estadoCfg[novActual.estado].color }}>
                {novActual.estado.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: prioridadCfg[novActual.prioridad].color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: prioridadCfg[novActual.prioridad].dot }} />
                Prioridad {prioridadCfg[novActual.prioridad].label}
              </span>
            </div>

            {novActual.descripcion && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 leading-relaxed">{novActual.descripcion}</p>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <p>Reportado por: <strong className="text-gray-600">{nombreUsuario(novActual.reportadoPorId)}</strong></p>
              <p>Creado: <strong className="text-gray-600">{new Date(novActual.creadoEn).toLocaleString('es-CL')}</strong></p>
              {novActual.cerradoEn && <p>Cerrado: <strong className="text-gray-600">{new Date(novActual.cerradoEn).toLocaleString('es-CL')}</strong></p>}
            </div>

            {/* Cambiar estado */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Cambiar estado</p>
              <div className="flex gap-2">
                {(['abierto', 'en_proceso', 'cerrado'] as const).map(e => (
                  <button key={e} onClick={() => cambiarEstado(novActual.id, e)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                    style={novActual.estado === e
                      ? { borderColor: estadoCfg[e].color, background: estadoCfg[e].bg, color: estadoCfg[e].color }
                      : { borderColor: '#e2e8f0', color: '#94a3b8' }}
                  >
                    {estadoCfg[e].label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => { setModalVer(false); setNovActual(novActual); setModoEditar(true); setForm({ titulo: novActual.titulo, descripcion: novActual.descripcion ?? '', categoria: novActual.categoria, prioridad: novActual.prioridad, estado: novActual.estado, reportadoPorId: novActual.reportadoPorId ?? '' }); setModalForm(true) }}
              className="w-full py-2.5 rounded-xl border text-sm font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <Pencil className="w-4 h-4" /> Editar
            </button>
          </div>
        )}
      </Modal>

      {/* ── Modal: Formulario ── */}
      <Modal abierto={modalForm} onCerrar={() => setModalForm(false)} titulo={modoEditar ? 'Editar novedad' : 'Nueva novedad'} subtitulo={edificioNombre} ancho="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Título *</label>
            <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              placeholder="Ej: Fuga de agua en pasillo 3° piso"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Categoría</label>
              <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaNovedad }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              >
                {(Object.keys(categoriaCfg) as CategoriaNovedad[]).map(c => (
                  <option key={c} value={c}>{categoriaCfg[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prioridad</label>
              <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as PrioridadNovedad }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              >
                {(Object.keys(prioridadCfg) as PrioridadNovedad[]).map(p => (
                  <option key={p} value={p}>{prioridadCfg[p].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              placeholder="Descripción detallada de la novedad…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
              <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoNovedad }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              >
                {(Object.keys(estadoCfg) as EstadoNovedad[]).map(e => (
                  <option key={e} value={e}>{estadoCfg[e].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reportado por</label>
              <select value={form.reportadoPorId} onChange={e => setForm(f => ({ ...f, reportadoPorId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              >
                <option value="">Conserje (yo)</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalForm(false)}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#e2e8f0' }}
            >
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#2563ae' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {saving ? 'Guardando…' : modoEditar ? 'Guardar cambios' : 'Registrar novedad'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Confirmar eliminar ── */}
      <Modal abierto={modalBorrar} onCerrar={() => setModalBorrar(false)} titulo="Eliminar novedad" ancho="sm" colorAccento="#dc2626">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Eliminar la novedad <strong>"{novActual?.titulo}"</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setModalBorrar(false)}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50"
              style={{ borderColor: '#e2e8f0' }}>
              Cancelar
            </button>
            <button onClick={handleEliminar}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#dc2626' }}>
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
