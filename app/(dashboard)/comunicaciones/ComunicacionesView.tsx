'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Eye, Bell, Info, Users, FileText, Check,
  Pencil, Trash2, Video, ExternalLink, Calendar, Clock,
} from 'lucide-react'
import Modal from '@/components/modal'
import { useNotificaciones } from '@/context/notificaciones-context'
import { supabase } from '@/lib/supabase'
import type { Comunicacion, User } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
type TipoFiltro = 'todos' | 'circular' | 'urgente' | 'informativo' | 'reunión'

const tipoCfg = {
  circular:    { Icon: FileText, label: 'Circular',    bg: '#dbeafe', color: '#2563ae' },
  urgente:     { Icon: Bell,     label: 'Urgente',     bg: '#fee2e2', color: '#dc2626' },
  informativo: { Icon: Info,     label: 'Informativo', bg: '#dcfce7', color: '#16a34a' },
  'reunión':   { Icon: Users,    label: 'Reunión',     bg: '#f3e8ff', color: '#7c3aed' },
} as const

// ─── Form state ───────────────────────────────────────────────
interface FormState {
  tipo:         Comunicacion['tipo']
  titulo:       string
  contenido:    string
  linkReunion:  string
  fechaReunion: string   // formato datetime-local "YYYY-MM-DDTHH:mm"
}

const EMPTY_FORM: FormState = {
  tipo:         'circular',
  titulo:       '',
  contenido:    '',
  linkReunion:  '',
  fechaReunion: '',
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  comunicaciones: Comunicacion[]
  users: User[]
}

// ─── Helper UI ────────────────────────────────────────────────
function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  )
}

// ─── Estado reunión ───────────────────────────────────────────
type EstadoR = 'en_vivo' | 'proxima' | 'finalizada'

function getEstadoReunion(fechaReunion: string, now: number): { estado: EstadoR; texto: string } {
  const inicio = new Date(fechaReunion).getTime()
  const fin    = inicio + 2 * 60 * 60 * 1000   // 2 h de duración estimada
  const diff   = inicio - now

  if (now >= inicio - 5 * 60 * 1000 && now <= fin) {
    return { estado: 'en_vivo', texto: 'EN VIVO' }
  }
  if (diff > 0) {
    const d = Math.floor(diff / 86_400_000)
    const h = Math.floor((diff % 86_400_000) / 3_600_000)
    const m = Math.ceil((diff % 3_600_000) / 60_000)
    const texto = d > 0 ? `En ${d}d ${h}h` : h > 0 ? `En ${h}h ${m}m` : `En ${m} min`
    return { estado: 'proxima', texto }
  }
  return { estado: 'finalizada', texto: 'Finalizada' }
}

// ─── Componente principal ────────────────────────────────────
export default function ComunicacionesView({ comunicaciones, users }: Props) {
  const { agregarNotificacion }       = useNotificaciones()
  const [lista, setLista]             = useState<Comunicacion[]>(comunicaciones)
  const [filtro, setFiltro]           = useState<TipoFiltro>('todos')
  const [modalCrear, setModalCrear]   = useState(false)
  const [editando, setEditando]       = useState<Comunicacion | null>(null)
  const [eliminarId, setEliminarId]   = useState<string | null>(null)
  const [toast, setToast]             = useState<string | null>(null)
  const [now, setNow]                 = useState(Date.now())

  // Actualiza "ahora" cada minuto → badges EN VIVO se auto-actualizan
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const [form, setForm]               = useState<FormState>(EMPTY_FORM)
  const [errores, setErrores]         = useState<Record<string, string>>({})
  const [formEdit, setFormEdit]       = useState<FormState>(EMPTY_FORM)
  const [erroresEdit, setErroresEdit] = useState<Record<string, string>>({})

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  // ─── Datos derivados ──────────────────────────────────────
  const filtered = useMemo(() =>
    filtro === 'todos' ? lista : lista.filter(c => c.tipo === filtro),
    [lista, filtro],
  )
  const getAutor = (id: string) => {
    const u = users.find(u => u.id === id)
    return u ? `${u.nombre} ${u.apellido}` : 'Admin'
  }
  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatFechaHora = (iso: string) =>
    new Date(iso).toLocaleString('es-CL', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  const totalLecturas = useMemo(() =>
    lista.reduce((s, c) => s + (c.lecturasCount ?? 0), 0), [lista])
  const comunicacionAEliminar = lista.find(x => x.id === eliminarId)

  // ─── Validación ───────────────────────────────────────────
  function validateForm(f: FormState): Record<string, string> {
    const e: Record<string, string> = {}
    if (!f.titulo.trim())    e.titulo    = 'El título es requerido'
    if (!f.contenido.trim()) e.contenido = 'El contenido es requerido'
    if (f.tipo === 'reunión' && !f.fechaReunion)
      e.fechaReunion = 'La fecha y hora son requeridas para reuniones'
    return e
  }

  // ─── Handler crear ────────────────────────────────────────
  function handleCrear() {
    const e = validateForm(form)
    setErrores(e)
    if (Object.keys(e).length > 0) return

    const esReunion = form.tipo === 'reunión'
    const nueva: Comunicacion = {
      id:            `c${Date.now()}`,
      edificioId:    'e1',
      titulo:        form.titulo.trim(),
      contenido:     form.contenido.trim(),
      tipo:          form.tipo,
      autorId:       'u1',
      creadoEn:      new Date().toISOString(),
      lecturasCount: 0,
      linkReunion:   esReunion && form.linkReunion.trim()
                       ? form.linkReunion.trim() : undefined,
      fechaReunion:  esReunion && form.fechaReunion
                       ? new Date(form.fechaReunion).toISOString() : undefined,
    }
    setLista(prev => [nueva, ...prev])
    setModalCrear(false)
    setForm(EMPTY_FORM)
    setErrores({})

    if (esReunion) {
      showToast('📹 Reunión programada y notificada a residentes')
      agregarNotificacion('circular', '📹 Nueva reunión programada', form.titulo.trim())
    } else {
      showToast('Comunicación publicada correctamente')
      agregarNotificacion('circular', `Nueva: ${tipoCfg[form.tipo].label}`, form.titulo.trim())
    }
    supabase.from('comunicaciones').insert(nueva).then(({ error }) => {
      if (error) console.error('insert comunicacion:', error.message)
    })
  }

  // ─── Handler editar ───────────────────────────────────────
  function abrirEditar(c: Comunicacion) {
    setEditando(c)
    setFormEdit({
      tipo:         c.tipo,
      titulo:       c.titulo,
      contenido:    c.contenido,
      linkReunion:  c.linkReunion ?? '',
      // datetime-local necesita "YYYY-MM-DDTHH:mm"
      fechaReunion: c.fechaReunion
        ? new Date(c.fechaReunion).toISOString().slice(0, 16)
        : '',
    })
    setErroresEdit({})
  }

  function handleEditar() {
    if (!editando) return
    const e = validateForm(formEdit)
    setErroresEdit(e)
    if (Object.keys(e).length > 0) return

    const esReunion = formEdit.tipo === 'reunión'
    const payload = {
      tipo:         formEdit.tipo,
      titulo:       formEdit.titulo.trim(),
      contenido:    formEdit.contenido.trim(),
      linkReunion:  esReunion && formEdit.linkReunion.trim()
                      ? formEdit.linkReunion.trim() : null,
      fechaReunion: esReunion && formEdit.fechaReunion
                      ? new Date(formEdit.fechaReunion).toISOString() : null,
    }
    setLista(prev => prev.map(c => c.id !== editando.id ? c : {
      ...c, ...payload,
      linkReunion:  payload.linkReunion  ?? undefined,
      fechaReunion: payload.fechaReunion ?? undefined,
    }))
    setEditando(null)
    setErroresEdit({})
    showToast('Comunicación actualizada correctamente')
    supabase.from('comunicaciones').update(payload).eq('id', editando.id).then(({ error }) => {
      if (error) console.error('update comunicacion:', error.message)
    })
  }

  // ─── Handler eliminar ─────────────────────────────────────
  function handleEliminar() {
    setLista(prev => prev.filter(c => c.id !== eliminarId))
    supabase.from('comunicaciones').delete().eq('id', eliminarId).then(({ error }) => {
      if (error) console.error('delete comunicacion:', error.message)
    })
    setEliminarId(null)
    showToast('Comunicación eliminada')
  }

  // ─── Constantes de estilo ─────────────────────────────────
  const inp = 'w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'

  const tabs: { value: TipoFiltro; label: string }[] = [
    { value: 'todos',       label: 'Todas'        },
    { value: 'circular',    label: 'Circulares'   },
    { value: 'urgente',     label: 'Urgentes'     },
    { value: 'informativo', label: 'Informativos' },
    { value: 'reunión',     label: 'Reuniones'    },
  ]

  // ─── Campos extra para tipo reunión (helper, no componente) ──
  function renderCamposReunion(
    f: FormState,
    setF: React.Dispatch<React.SetStateAction<FormState>>,
    errs: Record<string, string>,
  ) {
    if (f.tipo !== 'reunión') return null
    return (
      <>
        <Campo label="📅 Fecha y hora de la reunión" error={errs.fechaReunion}>
          <input
            type="datetime-local"
            className={inp}
            style={{ borderColor: errs.fechaReunion ? '#dc2626' : '#e2e8f0' }}
            value={f.fechaReunion}
            onChange={ev => setF(p => ({ ...p, fechaReunion: ev.target.value }))}
          />
        </Campo>
        <Campo label="🔗 Link de reunión (Zoom / Meet / Teams)">
          <div className="relative">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="url"
              className={inp + ' pl-9'}
              style={{ borderColor: '#e2e8f0' }}
              placeholder="https://zoom.us/j/123456789"
              value={f.linkReunion}
              onChange={ev => setF(p => ({ ...p, linkReunion: ev.target.value }))}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Opcional — aparecerá un botón "Unirse" en la tarjeta para todos los residentes
          </p>
        </Campo>
      </>
    )
  }

  // ─── Render tipo-selector (reutilizable en ambos modales) ────
  function renderTipoSelector(
    f: FormState,
    setF: React.Dispatch<React.SetStateAction<FormState>>,
  ) {
    return (
      <Campo label="Tipo de comunicación">
        <div className="grid grid-cols-2 gap-2">
          {(['circular', 'urgente', 'informativo', 'reunión'] as const).map(tipo => {
            const cfg      = tipoCfg[tipo]
            const activo   = f.tipo === tipo
            const { Icon } = cfg
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => setF(p => ({ ...p, tipo }))}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                style={{
                  borderColor: activo ? cfg.color : '#e2e8f0',
                  background:  activo ? cfg.bg    : 'white',
                  color:       activo ? cfg.color : '#64748b',
                }}
              >
                <Icon className="w-4 h-4" />
                {cfg.label}
              </button>
            )
          })}
        </div>
      </Campo>
    )
  }

  // ─── Render principal ────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl"
          style={{ background: '#16a34a' }}
        >
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicaciones</h1>
          <p className="text-gray-500 mt-1">
            {lista.length} publicaciones · {totalLecturas} lecturas totales
          </p>
        </div>
        <button
          onClick={() => { setModalCrear(true); setForm(EMPTY_FORM); setErrores({}) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#7c3aed' }}
        >
          <Plus className="w-4 h-4" />
          Nueva comunicación
        </button>
      </div>

      {/* Resumen por tipo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['circular', 'urgente', 'informativo', 'reunión'] as const).map(tipo => {
          const cfg      = tipoCfg[tipo]
          const count    = lista.filter(c => c.tipo === tipo).length
          const lecturas = lista.filter(c => c.tipo === tipo)
                               .reduce((s, c) => s + (c.lecturasCount ?? 0), 0)
          const { Icon } = cfg
          // ¿Hay alguna reunión EN VIVO ahora?
          const enVivo = tipo === 'reunión' && lista.some(c =>
            c.tipo === 'reunión' && c.fechaReunion &&
            getEstadoReunion(c.fechaReunion, now).estado === 'en_vivo',
          )
          return (
            <div
              key={tipo}
              className="bg-white rounded-2xl border shadow-sm p-4"
              style={{ borderColor: enVivo ? '#dc2626' : '#e2e8f0' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${enVivo ? 'animate-pulse-soft' : ''}`}
                  style={{ background: cfg.bg }}
                >
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                {enVivo && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#dc2626' }}>
                    EN VIVO
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400 mt-0.5">{lecturas} lecturas</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFiltro(value)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              filtro === value
                ? { background: '#7c3aed', color: 'white' }
                : { background: '#f1f5f9', color: '#64748b' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de comunicaciones */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm py-16 text-center" style={{ borderColor: '#e2e8f0' }}>
            <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm">No hay comunicaciones en esta categoría</p>
          </div>
        ) : filtered.map(c => {
          const cfg     = tipoCfg[c.tipo]
          const { Icon } = cfg
          const estadoR = c.tipo === 'reunión' && c.fechaReunion
            ? getEstadoReunion(c.fechaReunion, now)
            : null

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              style={{
                borderColor: estadoR?.estado === 'en_vivo' ? '#fca5a5' : '#e2e8f0',
              }}
            >
              {/* Barra superior de color */}
              <div className="h-1 w-full" style={{ background: cfg.color }} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">

                  {/* Izquierda: icono + contenido */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${estadoR?.estado === 'en_vivo' ? 'animate-pulse-soft' : ''}`}
                      style={{ background: cfg.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Título + badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">{c.titulo}</h3>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>

                        {/* Badge estado reunión */}
                        {estadoR && (
                          estadoR.estado === 'en_vivo' ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse-soft"
                              style={{ background: '#fee2e2', color: '#dc2626' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                              EN VIVO
                            </span>
                          ) : estadoR.estado === 'proxima' ? (
                            <span
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={{ background: '#f3e8ff', color: '#7c3aed' }}
                            >
                              <Clock className="w-3 h-3" />
                              {estadoR.texto}
                            </span>
                          ) : (
                            <span
                              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={{ background: '#f1f5f9', color: '#94a3b8' }}
                            >
                              Finalizada
                            </span>
                          )
                        )}
                      </div>

                      {/* Autor y fecha */}
                      <p className="text-xs text-gray-400 mb-2">
                        {getAutor(c.autorId)} · {formatFecha(c.creadoEn)}
                      </p>

                      {/* Contenido */}
                      <p className="text-sm text-gray-600 line-clamp-2">{c.contenido}</p>

                      {/* Barra de reunión: fecha + botón Unirse */}
                      {c.tipo === 'reunión' && (c.fechaReunion || c.linkReunion) && (
                        <div
                          className="flex flex-wrap items-center gap-3 mt-3 pt-3"
                          style={{ borderTop: '1px dashed #e2e8f0' }}
                        >
                          {c.fechaReunion && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                              <Calendar className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
                              <span>{formatFechaHora(c.fechaReunion)}</span>
                            </div>
                          )}
                          {c.linkReunion && (
                            <a
                              href={c.linkReunion}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                              style={{
                                background: estadoR?.estado === 'en_vivo' ? '#dc2626' : '#7c3aed',
                                color: 'white',
                              }}
                            >
                              <Video className="w-3.5 h-3.5" />
                              {estadoR?.estado === 'en_vivo' ? '🔴 Unirse ahora' : 'Unirse a la reunión'}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Derecha: lecturas + acciones */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <div>
                      <div className="flex items-center gap-1 justify-end">
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-bold text-gray-700">{c.lecturasCount ?? 0}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">lecturas</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => abrirEditar(c)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => setEliminarId(c.id)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ background: '#fee2e2', color: '#dc2626' }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Modal: Nueva Comunicación ────────────────────────── */}
      <Modal
        abierto={modalCrear}
        onCerrar={() => { setModalCrear(false); setForm(EMPTY_FORM); setErrores({}) }}
        titulo="Nueva comunicación"
        subtitulo="Publica un comunicado para todos los residentes del edificio"
        colorAccento="#7c3aed"
      >
        <div className="space-y-4">
          {renderTipoSelector(form, setForm)}

          <Campo label="Título" error={errores.titulo}>
            <input
              type="text"
              className={inp}
              style={{ borderColor: errores.titulo ? '#dc2626' : '#e2e8f0' }}
              placeholder={
                form.tipo === 'reunión'
                  ? 'Ej: Reunión de copropietarios vía Zoom'
                  : 'Ej: Corte de agua programado'
              }
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            />
          </Campo>

          <Campo label="Contenido" error={errores.contenido}>
            <textarea
              rows={4}
              className={inp + ' resize-none'}
              style={{ borderColor: errores.contenido ? '#dc2626' : '#e2e8f0' }}
              placeholder={
                form.tipo === 'reunión'
                  ? 'Agenda, temas a tratar, instrucciones de acceso...'
                  : 'Escribe el contenido completo de la comunicación...'
              }
              value={form.contenido}
              onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
            />
          </Campo>

          {renderCamposReunion(form, setForm, errores)}

          {/* Vista previa */}
          {form.titulo && (
            <div className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-1.5">Vista previa</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: tipoCfg[form.tipo].bg, color: tipoCfg[form.tipo].color }}
                >
                  {tipoCfg[form.tipo].label}
                </span>
                <span className="text-sm font-bold text-gray-800 truncate">{form.titulo}</span>
                {form.tipo === 'reunión' && form.fechaReunion && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatFechaHora(new Date(form.fechaReunion).toISOString())}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => { setModalCrear(false); setForm(EMPTY_FORM); setErrores({}) }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrear}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#7c3aed' }}
            >
              {form.tipo === 'reunión' ? (
                <><Video className="w-4 h-4" /> Programar reunión</>
              ) : (
                'Publicar'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Editar Comunicación ───────────────────────── */}
      <Modal
        abierto={editando !== null}
        onCerrar={() => { setEditando(null); setErroresEdit({}) }}
        titulo="Editar comunicación"
        subtitulo={editando?.titulo ?? ''}
        colorAccento="#7c3aed"
      >
        {editando && (
          <div className="space-y-4">
            {renderTipoSelector(formEdit, setFormEdit)}

            <Campo label="Título" error={erroresEdit.titulo}>
              <input
                type="text"
                className={inp}
                style={{ borderColor: erroresEdit.titulo ? '#dc2626' : '#e2e8f0' }}
                value={formEdit.titulo}
                onChange={e => setFormEdit(f => ({ ...f, titulo: e.target.value }))}
              />
            </Campo>

            <Campo label="Contenido" error={erroresEdit.contenido}>
              <textarea
                rows={4}
                className={inp + ' resize-none'}
                style={{ borderColor: erroresEdit.contenido ? '#dc2626' : '#e2e8f0' }}
                value={formEdit.contenido}
                onChange={e => setFormEdit(f => ({ ...f, contenido: e.target.value }))}
              />
            </Campo>

            {renderCamposReunion(formEdit, setFormEdit, erroresEdit)}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setEditando(null); setErroresEdit({}) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditar}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: '#7c3aed' }}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Modal: Confirmar eliminación ────────────────────── */}
      <Modal
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        titulo="Eliminar comunicación"
        subtitulo="Esta acción no se puede deshacer"
        colorAccento="#dc2626"
      >
        <div className="space-y-4">
          {comunicacionAEliminar && (
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#fff1f2' }}>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: tipoCfg[comunicacionAEliminar.tipo].bg }}
              >
                {(() => {
                  const { Icon } = tipoCfg[comunicacionAEliminar.tipo]
                  return <Icon className="w-4 h-4" style={{ color: tipoCfg[comunicacionAEliminar.tipo].color }} />
                })()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{comunicacionAEliminar.titulo}</p>
                <p className="text-xs text-gray-500">
                  {tipoCfg[comunicacionAEliminar.tipo].label} · {formatFecha(comunicacionAEliminar.creadoEn)}
                </p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600">¿Confirmas que deseas eliminar esta comunicación?</p>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setEliminarId(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#dc2626' }}
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
