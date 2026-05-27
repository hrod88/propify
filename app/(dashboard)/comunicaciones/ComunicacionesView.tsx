'use client'

import { useState, useMemo } from 'react'
import { Plus, Eye, Bell, Info, Users, FileText, Check, Pencil, Trash2 } from 'lucide-react'
import Modal from '@/components/modal'
import { useNotificaciones } from '@/context/notificaciones-context'
import type { Comunicacion, User } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
type TipoFiltro = 'todos' | 'circular' | 'urgente' | 'informativo' | 'reunión'

const tipoCfg = {
  circular:    { Icon: FileText, label: 'Circular',    bg: '#dbeafe', color: '#2563ae' },
  urgente:     { Icon: Bell,     label: 'Urgente',     bg: '#fee2e2', color: '#dc2626' },
  informativo: { Icon: Info,     label: 'Informativo', bg: '#dcfce7', color: '#16a34a' },
  'reunión':   { Icon: Users,    label: 'Reunión',     bg: '#f3e8ff', color: '#7c3aed' },
} as const

// ─── Props ────────────────────────────────────────────────────
interface Props {
  comunicaciones: Comunicacion[]
  users: User[]
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
export default function ComunicacionesView({ comunicaciones, users }: Props) {
  const { agregarNotificacion }     = useNotificaciones()
  const [lista, setLista]           = useState<Comunicacion[]>(comunicaciones)
  const [filtro, setFiltro]         = useState<TipoFiltro>('todos')
  const [modalCrear, setModalCrear] = useState(false)
  const [editando, setEditando]     = useState<Comunicacion | null>(null)
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  // ─── Formulario crear ────────────────────────────────────────
  const [form, setForm] = useState({
    tipo:      'circular' as Comunicacion['tipo'],
    titulo:    '',
    contenido: '',
  })
  const [errores, setErrores] = useState<Record<string, string>>({})

  // ─── Formulario edición ──────────────────────────────────────
  const [formEdit, setFormEdit] = useState({
    tipo:      'circular' as Comunicacion['tipo'],
    titulo:    '',
    contenido: '',
  })
  const [erroresEdit, setErroresEdit] = useState<Record<string, string>>({})

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Datos derivados ────────────────────────────────────────
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

  const totalLecturas = useMemo(() =>
    lista.reduce((s, c) => s + (c.lecturasCount ?? 0), 0),
    [lista],
  )

  const comunicacionAEliminar = lista.find(x => x.id === eliminarId)

  // ─── Handler crear ──────────────────────────────────────────
  function handleCrear() {
    const e: Record<string, string> = {}
    if (!form.titulo.trim())    e.titulo    = 'El título es requerido'
    if (!form.contenido.trim()) e.contenido = 'El contenido es requerido'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    const nueva: Comunicacion = {
      id:            `c${Date.now()}`,
      edificioId:    'e1',
      titulo:        form.titulo.trim(),
      contenido:     form.contenido.trim(),
      tipo:          form.tipo,
      autorId:       'u1',
      creadoEn:      new Date().toISOString(),
      lecturasCount: 0,
    }
    setLista(prev => [nueva, ...prev])
    setModalCrear(false)
    setForm({ tipo: 'circular', titulo: '', contenido: '' })
    setErrores({})
    showToast('Comunicación publicada correctamente')
    agregarNotificacion('circular', `Nueva comunicación: ${tipoCfg[form.tipo].label}`, form.titulo.trim())
  }

  // ─── Handler editar ─────────────────────────────────────────
  function abrirEditar(c: Comunicacion) {
    setEditando(c)
    setFormEdit({ tipo: c.tipo, titulo: c.titulo, contenido: c.contenido })
    setErroresEdit({})
  }

  function handleEditar() {
    if (!editando) return
    const e: Record<string, string> = {}
    if (!formEdit.titulo.trim())    e.titulo    = 'El título es requerido'
    if (!formEdit.contenido.trim()) e.contenido = 'El contenido es requerido'
    setErroresEdit(e)
    if (Object.keys(e).length > 0) return

    setLista(prev => prev.map(c =>
      c.id !== editando.id ? c : {
        ...c,
        tipo:      formEdit.tipo,
        titulo:    formEdit.titulo.trim(),
        contenido: formEdit.contenido.trim(),
      }
    ))
    setEditando(null)
    setErroresEdit({})
    showToast('Comunicación actualizada correctamente')
  }

  // ─── Handler eliminar ────────────────────────────────────────
  function handleEliminar() {
    setLista(prev => prev.filter(c => c.id !== eliminarId))
    setEliminarId(null)
    showToast('Comunicación eliminada')
  }

  // ─── Clases comunes ─────────────────────────────────────────
  const inp = 'w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'

  const tabs: { value: TipoFiltro; label: string }[] = [
    { value: 'todos',       label: 'Todas' },
    { value: 'circular',    label: 'Circulares' },
    { value: 'urgente',     label: 'Urgentes' },
    { value: 'informativo', label: 'Informativos' },
    { value: 'reunión',     label: 'Reuniones' },
  ]

  // ─── Render ──────────────────────────────────────────────────
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
          onClick={() => { setModalCrear(true); setErrores({}) }}
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
          const lecturas = lista.filter(c => c.tipo === tipo).reduce((s, c) => s + (c.lecturasCount ?? 0), 0)
          const { Icon } = cfg
          return (
            <div key={tipo} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
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

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm py-16 text-center" style={{ borderColor: '#e2e8f0' }}>
            <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm">No hay comunicaciones en esta categoría</p>
          </div>
        ) : filtered.map(c => {
          const cfg      = tipoCfg[c.tipo]
          const { Icon } = cfg
          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              style={{ borderColor: '#e2e8f0' }}
            >
              <div className="h-1 w-full" style={{ background: cfg.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">{c.titulo}</h3>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {getAutor(c.autorId)} · {formatFecha(c.creadoEn)}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">{c.contenido}</p>
                    </div>
                  </div>

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
        onCerrar={() => { setModalCrear(false); setErrores({}) }}
        titulo="Nueva comunicación"
        subtitulo="Publica un comunicado para todos los residentes del edificio"
        colorAccento="#7c3aed"
      >
        <div className="space-y-4">
          <Campo label="Tipo de comunicación">
            <div className="grid grid-cols-2 gap-2">
              {(['circular', 'urgente', 'informativo', 'reunión'] as const).map(tipo => {
                const cfg      = tipoCfg[tipo]
                const activo   = form.tipo === tipo
                const { Icon } = cfg
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, tipo }))}
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

          <Campo label="Título" error={errores.titulo}>
            <input
              type="text"
              className={inp}
              style={{ borderColor: errores.titulo ? '#dc2626' : '#e2e8f0' }}
              placeholder="Ej: Corte de agua programado"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            />
          </Campo>

          <Campo label="Contenido" error={errores.contenido}>
            <textarea
              rows={5}
              className={inp + ' resize-none'}
              style={{ borderColor: errores.contenido ? '#dc2626' : '#e2e8f0' }}
              placeholder="Escribe el contenido completo de la comunicación..."
              value={form.contenido}
              onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
            />
          </Campo>

          {form.titulo && (
            <div className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-1.5">Vista previa</p>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: tipoCfg[form.tipo].bg, color: tipoCfg[form.tipo].color }}
                >
                  {tipoCfg[form.tipo].label}
                </span>
                <span className="text-sm font-bold text-gray-800 truncate">{form.titulo}</span>
              </div>
            </div>
          )}

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
              style={{ background: '#7c3aed' }}
            >
              Publicar
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Editar Comunicación ───────────────────────── */}
      <Modal
        abierto={editando !== null}
        onCerrar={() => { setEditando(null); setErroresEdit({}) }}
        titulo="Editar comunicación"
        subtitulo={editando ? editando.titulo : ''}
        colorAccento="#7c3aed"
      >
        {editando && (
          <div className="space-y-4">
            <Campo label="Tipo de comunicación">
              <div className="grid grid-cols-2 gap-2">
                {(['circular', 'urgente', 'informativo', 'reunión'] as const).map(tipo => {
                  const cfg      = tipoCfg[tipo]
                  const activo   = formEdit.tipo === tipo
                  const { Icon } = cfg
                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setFormEdit(f => ({ ...f, tipo }))}
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
                rows={5}
                className={inp + ' resize-none'}
                style={{ borderColor: erroresEdit.contenido ? '#dc2626' : '#e2e8f0' }}
                value={formEdit.contenido}
                onChange={e => setFormEdit(f => ({ ...f, contenido: e.target.value }))}
              />
            </Campo>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setEditando(null); setErroresEdit({}) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditar}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
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
                <p className="text-xs text-gray-500">{tipoCfg[comunicacionAEliminar.tipo].label} · {formatFecha(comunicacionAEliminar.creadoEn)}</p>
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
