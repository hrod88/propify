'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Clock, CheckCircle, XCircle, AlertCircle,
  Wrench, Home, User, Check, Pencil, Trash2,
} from 'lucide-react'
import Modal from '@/components/modal'
import { useNotificaciones } from '@/context/notificaciones-context'
import type { SolicitudMantencion, Unidad, User as UserType } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
type EstadoFiltro = 'todos' | 'pendiente' | 'en_progreso' | 'resuelto' | 'cancelado'

const prioridadCfg = {
  baja:    { label: 'Baja',    bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
  media:   { label: 'Media',   bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  alta:    { label: 'Alta',    bg: '#ffedd5', color: '#ea580c', border: '#fed7aa' },
  urgente: { label: 'Urgente', bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
} as const

const estadoCfg = {
  pendiente:   { Icon: Clock,        label: 'Pendiente',   bg: '#fef3c7', color: '#d97706' },
  en_progreso: { Icon: AlertCircle,  label: 'En progreso', bg: '#dbeafe', color: '#2563ae' },
  resuelto:    { Icon: CheckCircle,  label: 'Resuelto',    bg: '#dcfce7', color: '#16a34a' },
  cancelado:   { Icon: XCircle,      label: 'Cancelado',   bg: '#f1f5f9', color: '#64748b' },
} as const

const CATEGORIAS = [
  'Plomería', 'Electricidad', 'Pintura', 'Gas', 'Cerrajería',
  'Limpieza', 'Estructura', 'Ascensor', 'Jardín', 'Otro',
]

// ─── Props ────────────────────────────────────────────────────
interface Props {
  solicitudes: SolicitudMantencion[]
  unidades: Unidad[]
  users: UserType[]
}

// ─── Helpers de UI ────────────────────────────────────────────
function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  )
}

// ─── Componente ───────────────────────────────────────────────
export default function MantencionesView({ solicitudes, unidades, users }: Props) {
  const { agregarNotificacion }     = useNotificaciones()
  const [lista, setLista]           = useState<SolicitudMantencion[]>(solicitudes)
  const [filtro, setFiltro]         = useState<EstadoFiltro>('todos')
  const [modalCrear, setModalCrear] = useState(false)
  const [editando, setEditando]     = useState<SolicitudMantencion | null>(null)
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  // ─── Formulario nueva solicitud ─────────────────────────────
  const [form, setForm] = useState({
    titulo: '', descripcion: '', categoria: CATEGORIAS[0],
    prioridad: 'media' as SolicitudMantencion['prioridad'],
    unidadId: unidades[0]?.id ?? '',
  })

  // ─── Formulario edición ──────────────────────────────────────
  const [formEdit, setFormEdit] = useState({
    titulo:      '',
    descripcion: '',
    categoria:   CATEGORIAS[0],
    prioridad:   'media' as SolicitudMantencion['prioridad'],
    estado:      '' as SolicitudMantencion['estado'] | '',
    asignadoA:   '',
  })

  const [errores, setErrores] = useState<Record<string, string>>({})

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Datos derivados ────────────────────────────────────────
  const filtered = useMemo(() =>
    filtro === 'todos' ? lista : lista.filter(s => s.estado === filtro),
    [lista, filtro],
  )

  const counts = useMemo(() => ({
    todos:       lista.length,
    pendiente:   lista.filter(s => s.estado === 'pendiente').length,
    en_progreso: lista.filter(s => s.estado === 'en_progreso').length,
    resuelto:    lista.filter(s => s.estado === 'resuelto').length,
    cancelado:   lista.filter(s => s.estado === 'cancelado').length,
  }), [lista])

  const getUnidad = (id: string) => unidades.find(u => u.id === id)
  const getUser   = (id?: string) => id ? users.find(u => u.id === id) : undefined

  const solicitudAEliminar = lista.find(x => x.id === eliminarId)

  const diasDesde = (fecha: string) => {
    const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86_400_000)
    if (dias === 0) return 'Hoy'
    if (dias === 1) return 'Ayer'
    return `Hace ${dias} días`
  }

  // ─── Handlers ───────────────────────────────────────────────
  function handleCrear() {
    const e: Record<string, string> = {}
    if (!form.titulo.trim())      e.titulo      = 'El título es requerido'
    if (!form.descripcion.trim()) e.descripcion = 'La descripción es requerida'
    if (!form.unidadId)           e.unidadId    = 'Selecciona una unidad'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    const nueva: SolicitudMantencion = {
      id:            `s${Date.now()}`,
      edificioId:    'e1',
      unidadId:      form.unidadId,
      titulo:        form.titulo.trim(),
      descripcion:   form.descripcion.trim(),
      categoria:     form.categoria,
      prioridad:     form.prioridad,
      estado:        'pendiente',
      solicitanteId: 'u1',
      creadoEn:      new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    }
    setLista(prev => [nueva, ...prev])
    setModalCrear(false)
    setForm({ titulo: '', descripcion: '', categoria: CATEGORIAS[0], prioridad: 'media', unidadId: unidades[0]?.id ?? '' })
    setErrores({})
    showToast('Solicitud creada correctamente')
    agregarNotificacion('solicitud', 'Nueva solicitud de mantención', `${form.titulo.trim()} — ${form.categoria}`)
  }

  function abrirEditar(s: SolicitudMantencion) {
    setEditando(s)
    setFormEdit({
      titulo:      s.titulo,
      descripcion: s.descripcion,
      categoria:   s.categoria,
      prioridad:   s.prioridad,
      estado:      s.estado,
      asignadoA:   s.asignadoA ?? '',
    })
    setErrores({})
  }

  function handleEditar() {
    if (!editando) return
    const e: Record<string, string> = {}
    if (!formEdit.titulo.trim())      e.titulo      = 'El título es requerido'
    if (!formEdit.descripcion.trim()) e.descripcion = 'La descripción es requerida'
    if (!formEdit.estado)             e.estado      = 'Selecciona un estado'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    setLista(prev => prev.map(s =>
      s.id !== editando.id ? s : {
        ...s,
        titulo:        formEdit.titulo.trim(),
        descripcion:   formEdit.descripcion.trim(),
        categoria:     formEdit.categoria,
        prioridad:     formEdit.prioridad,
        estado:        formEdit.estado as SolicitudMantencion['estado'],
        asignadoA:     formEdit.asignadoA || undefined,
        actualizadoEn: new Date().toISOString(),
        resueltoEn:    formEdit.estado === 'resuelto' && !s.resueltoEn
          ? new Date().toISOString()
          : s.resueltoEn,
      }
    ))
    setEditando(null)
    setErrores({})
    showToast('Solicitud actualizada correctamente')
  }

  function handleEliminar() {
    setLista(prev => prev.filter(s => s.id !== eliminarId))
    setEliminarId(null)
    showToast('Solicitud eliminada')
  }

  // ─── Clases comunes ─────────────────────────────────────────
  const inp = 'w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'

  const tabs: { value: EstadoFiltro; label: string }[] = [
    { value: 'todos',       label: 'Todos' },
    { value: 'pendiente',   label: 'Pendientes' },
    { value: 'en_progreso', label: 'En progreso' },
    { value: 'resuelto',    label: 'Resueltos' },
    { value: 'cancelado',   label: 'Cancelados' },
  ]

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl"
          style={{ background: '#16a34a', animation: 'modal-panel-in 0.2s ease' }}
        >
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mantenciones</h1>
          <p className="text-gray-500 mt-1">
            {counts.pendiente + counts.en_progreso} activas · {counts.resuelto} resueltas este mes
          </p>
        </div>
        <button
          onClick={() => { setModalCrear(true); setErrores({}) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Nueva solicitud
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total',       value: counts.todos,       color: '#1e3a5f', bg: '#f1f5f9' },
          { label: 'Pendientes',  value: counts.pendiente,   color: '#d97706', bg: '#fef3c7' },
          { label: 'En progreso', value: counts.en_progreso, color: '#2563ae', bg: '#dbeafe' },
          { label: 'Resueltas',   value: counts.resuelto,    color: '#16a34a', bg: '#dcfce7' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400">{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Wrench className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
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
                ? { background: '#1e3a5f', color: 'white' }
                : { background: '#f1f5f9', color: '#64748b' }
            }
          >
            {label}
            {counts[value] > 0 && (
              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={
                  filtro === value
                    ? { background: 'rgba(255,255,255,0.2)', color: 'white' }
                    : { background: '#e2e8f0', color: '#64748b' }
                }
              >
                {counts[value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm py-16 text-center" style={{ borderColor: '#e2e8f0' }}>
            <Wrench className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm">No hay solicitudes en esta categoría</p>
          </div>
        ) : filtered.map(s => {
          const unidad   = getUnidad(s.unidadId)
          const asignado = getUser(s.asignadoA)
          const prCfg    = prioridadCfg[s.prioridad]
          const estCfg   = estadoCfg[s.estado]
          const { Icon } = estCfg

          return (
            <div
              key={s.id}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              style={{ borderColor: prCfg.border }}
            >
              <div className="h-1 w-full" style={{ background: prCfg.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0"
                      style={{ background: '#f1f5f9' }}
                    >
                      <Home className="w-4 h-4 text-gray-400 mb-0.5" />
                      <span className="text-xs font-bold text-gray-600">{unidad?.numero ?? '—'}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">{s.titulo}</h3>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: estCfg.bg, color: estCfg.color }}
                        >
                          <Icon className="w-3 h-3" />
                          {estCfg.label}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: prCfg.bg, color: prCfg.color }}
                        >
                          {prCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                        <span className="font-semibold" style={{ color: '#2563ae' }}>{s.categoria}</span>
                        <span>·</span>
                        <span suppressHydrationWarning>{diasDesde(s.creadoEn)}</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{s.descripcion}</p>
                      {asignado && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                          <User className="w-3 h-3" />
                          <span>
                            Asignado a{' '}
                            <span className="font-semibold text-gray-600">
                              {asignado.nombre} {asignado.apellido}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEditar(s)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                        style={{ background: '#dbeafe', color: '#2563ae' }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => setEliminarId(s.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                        style={{ background: '#fee2e2', color: '#dc2626' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                    {s.resueltoEn && (
                      <p className="text-xs font-semibold" style={{ color: '#16a34a' }} suppressHydrationWarning>
                        ✓ Resuelto {diasDesde(s.resueltoEn).toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center pb-2">
        Mostrando {filtered.length} de {lista.length} solicitudes
      </p>

      {/* ─── Modal: Nueva Solicitud ───────────────────────────── */}
      <Modal
        abierto={modalCrear}
        onCerrar={() => { setModalCrear(false); setErrores({}) }}
        titulo="Nueva solicitud de mantención"
        subtitulo="Completa los datos para registrar una nueva solicitud"
        colorAccento="#2563ae"
      >
        <div className="space-y-4">
          <Campo label="Unidad" error={errores.unidadId}>
            <select
              className={inp}
              style={{ borderColor: errores.unidadId ? '#dc2626' : '#e2e8f0' }}
              value={form.unidadId}
              onChange={e => setForm(f => ({ ...f, unidadId: e.target.value }))}
            >
              {unidades.map(u => (
                <option key={u.id} value={u.id}>Unidad {u.numero} (Piso {u.piso})</option>
              ))}
            </select>
          </Campo>

          <Campo label="Título" error={errores.titulo}>
            <input
              type="text"
              className={inp}
              style={{ borderColor: errores.titulo ? '#dc2626' : '#e2e8f0' }}
              placeholder="Ej: Fuga de agua en baño"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Categoría">
              <select
                className={inp}
                style={{ borderColor: '#e2e8f0' }}
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Campo>
            <Campo label="Prioridad">
              <select
                className={inp}
                style={{ borderColor: '#e2e8f0' }}
                value={form.prioridad}
                onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as SolicitudMantencion['prioridad'] }))}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </Campo>
          </div>

          <Campo label="Descripción" error={errores.descripcion}>
            <textarea
              rows={3}
              className={inp + ' resize-none'}
              style={{ borderColor: errores.descripcion ? '#dc2626' : '#e2e8f0' }}
              placeholder="Describe el problema con detalle..."
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            />
          </Campo>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => { setModalCrear(false); setErrores({}) }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrear}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#2563ae' }}
            >
              Crear solicitud
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Editar Solicitud ──────────────────────────── */}
      <Modal
        abierto={editando !== null}
        onCerrar={() => { setEditando(null); setErrores({}) }}
        titulo="Editar solicitud"
        subtitulo={editando ? editando.titulo : ''}
        colorAccento="#1e3a5f"
      >
        {editando && (
          <div className="space-y-4">
            <Campo label="Título" error={errores.titulo}>
              <input
                type="text"
                className={inp}
                style={{ borderColor: errores.titulo ? '#dc2626' : '#e2e8f0' }}
                value={formEdit.titulo}
                onChange={e => setFormEdit(f => ({ ...f, titulo: e.target.value }))}
              />
            </Campo>

            <div className="grid grid-cols-2 gap-4">
              <Campo label="Categoría">
                <select
                  className={inp}
                  style={{ borderColor: '#e2e8f0' }}
                  value={formEdit.categoria}
                  onChange={e => setFormEdit(f => ({ ...f, categoria: e.target.value }))}
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Campo>
              <Campo label="Prioridad">
                <select
                  className={inp}
                  style={{ borderColor: '#e2e8f0' }}
                  value={formEdit.prioridad}
                  onChange={e => setFormEdit(f => ({ ...f, prioridad: e.target.value as SolicitudMantencion['prioridad'] }))}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </Campo>
            </div>

            <Campo label="Descripción" error={errores.descripcion}>
              <textarea
                rows={3}
                className={inp + ' resize-none'}
                style={{ borderColor: errores.descripcion ? '#dc2626' : '#e2e8f0' }}
                value={formEdit.descripcion}
                onChange={e => setFormEdit(f => ({ ...f, descripcion: e.target.value }))}
              />
            </Campo>

            <div className="grid grid-cols-2 gap-4">
              <Campo label="Estado" error={errores.estado}>
                <select
                  className={inp}
                  style={{ borderColor: errores.estado ? '#dc2626' : '#e2e8f0' }}
                  value={formEdit.estado}
                  onChange={e => setFormEdit(f => ({ ...f, estado: e.target.value as SolicitudMantencion['estado'] }))}
                >
                  <option value="">— Seleccionar —</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </Campo>
              <Campo label="Asignar a (opcional)">
                <select
                  className={inp}
                  style={{ borderColor: '#e2e8f0' }}
                  value={formEdit.asignadoA}
                  onChange={e => setFormEdit(f => ({ ...f, asignadoA: e.target.value }))}
                >
                  <option value="">— Sin asignar —</option>
                  {users
                    .filter(u => u.rol === 'conserje' || u.rol === 'administrador')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellido} ({u.rol})
                      </option>
                    ))
                  }
                </select>
              </Campo>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setEditando(null); setErrores({}) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditar}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: '#1e3a5f' }}
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
        titulo="Eliminar solicitud"
        subtitulo="Esta acción no se puede deshacer"
        colorAccento="#dc2626"
      >
        <div className="space-y-4">
          {solicitudAEliminar && (
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#fff1f2' }}>
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: prioridadCfg[solicitudAEliminar.prioridad].bg }}
              >
                <Wrench className="w-4 h-4" style={{ color: prioridadCfg[solicitudAEliminar.prioridad].color }} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{solicitudAEliminar.titulo}</p>
                <p className="text-xs text-gray-500">{solicitudAEliminar.categoria} · {prioridadCfg[solicitudAEliminar.prioridad].label}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600">¿Confirmas que deseas eliminar esta solicitud de mantención?</p>
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
