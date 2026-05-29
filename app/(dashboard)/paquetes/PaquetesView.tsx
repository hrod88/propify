'use client'

import { useState, useMemo } from 'react'
import { Package, CheckCircle, Bell, Archive, Clock, Plus, Check, Pencil, Trash2 } from 'lucide-react'
import Modal from '@/components/modal'
import { useNotificaciones } from '@/context/notificaciones-context'
import { supabase } from '@/lib/supabase'
import type { Paquete, Unidad, User } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
type EstadoFiltro = 'todos' | 'recibido' | 'notificado' | 'retirado'

const estadoCfg = {
  recibido:   { Icon: Archive,     label: 'En conserjería', bg: '#dbeafe', color: '#2563ae' },
  notificado: { Icon: Bell,        label: 'Notificado',     bg: '#fef3c7', color: '#d97706' },
  retirado:   { Icon: CheckCircle, label: 'Retirado',       bg: '#dcfce7', color: '#16a34a' },
} as const

const COURIERS = ['Chilexpress', 'DHL', 'StarKen', 'Correos Chile', 'Amazon', 'Rappi', 'MercadoLibre', 'Otro']

// ─── Props ────────────────────────────────────────────────────
interface Props {
  paquetes: Paquete[]
  unidades: Unidad[]
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

function generarCodigo() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// ─── Componente ───────────────────────────────────────────────
export default function PaquetesView({ paquetes, unidades, users }: Props) {
  const { agregarNotificacion }     = useNotificaciones()
  const [lista, setLista]           = useState<Paquete[]>(paquetes)
  const [filtro, setFiltro]         = useState<EstadoFiltro>('todos')
  const [modalCrear, setModalCrear] = useState(false)
  const [editando, setEditando]     = useState<Paquete | null>(null)
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  // ─── Formulario crear ────────────────────────────────────────
  const [form, setForm] = useState({
    unidadId:         unidades[0]?.id ?? '',
    courier:          COURIERS[0],
    descripcion:      '',
    numeroCasillero:  '',
  })
  const [errores, setErrores] = useState<Record<string, string>>({})

  // ─── Formulario edición ──────────────────────────────────────
  const [formEdit, setFormEdit] = useState({
    unidadId:         '',
    courier:          COURIERS[0],
    descripcion:      '',
    numeroCasillero:  '',
  })
  const [erroresEdit, setErroresEdit] = useState<Record<string, string>>({})

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Datos derivados ────────────────────────────────────────
  const filtered = useMemo(() =>
    filtro === 'todos' ? lista : lista.filter(p => p.estado === filtro),
    [lista, filtro],
  )

  const counts = useMemo(() => ({
    todos:      lista.length,
    recibido:   lista.filter(p => p.estado === 'recibido').length,
    notificado: lista.filter(p => p.estado === 'notificado').length,
    retirado:   lista.filter(p => p.estado === 'retirado').length,
  }), [lista])

  const pendientes = counts.recibido + counts.notificado

  const getUnidad = (id: string) => unidades.find(u => u.id === id)
  const getResidente = (unidad?: Unidad) => {
    if (!unidad) return null
    const uid = unidad.arrendatarioId ?? unidad.propietarioId
    if (!uid) return null
    const u = users.find(u => u.id === uid)
    return u ? `${u.nombre} ${u.apellido}` : null
  }

  const formatHora  = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })

  const paqueteAEliminar = lista.find(x => x.id === eliminarId)

  // ─── Handlers ───────────────────────────────────────────────
  function handleCrear() {
    const e: Record<string, string> = {}
    if (!form.unidadId) e.unidadId = 'Selecciona una unidad'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    const nc = parseInt(form.numeroCasillero)
    const nuevo: Paquete = {
      id:               `p${Date.now()}`,
      edificioId:       'e1',
      unidadId:         form.unidadId,
      courier:          form.courier,
      descripcion:      form.descripcion.trim() || undefined,
      estado:           'recibido',
      recibidoEn:       new Date().toISOString(),
      codigoRetiro:     generarCodigo(),
      numeroCasillero:  !isNaN(nc) && nc > 0 ? nc : undefined,
    }
    setLista(prev => [nuevo, ...prev])
    setModalCrear(false)
    setForm({ unidadId: unidades[0]?.id ?? '', courier: COURIERS[0], descripcion: '', numeroCasillero: '' })
    setErrores({})
    showToast(`Paquete registrado · Código: ${nuevo.codigoRetiro}`)
    const unidadNum = getUnidad(nuevo.unidadId)?.numero ?? nuevo.unidadId
    agregarNotificacion('paquete', 'Nuevo paquete registrado', `${nuevo.courier} para Unidad ${unidadNum}`)
    supabase.from('paquetes').insert(nuevo).then(({ error }) => { if (error) console.error('insert paquete:', error.message) })
  }

  function marcarRetirado(id: string) {
    setLista(prev => prev.map(p =>
      p.id !== id ? p : { ...p, estado: 'retirado', retiradoEn: new Date().toISOString() }
    ))
    showToast('Paquete marcado como retirado')
  }

  function abrirEditar(p: Paquete) {
    setEditando(p)
    setFormEdit({
      unidadId:        p.unidadId,
      courier:         p.courier,
      descripcion:     p.descripcion ?? '',
      numeroCasillero: p.numeroCasillero != null ? String(p.numeroCasillero) : '',
    })
    setErroresEdit({})
  }

  function handleEditar() {
    if (!editando) return
    const e: Record<string, string> = {}
    if (!formEdit.unidadId) e.unidadId = 'Selecciona una unidad'
    setErroresEdit(e)
    if (Object.keys(e).length > 0) return

    const nc = parseInt(formEdit.numeroCasillero)
    setLista(prev => prev.map(p =>
      p.id !== editando.id ? p : {
        ...p,
        unidadId:        formEdit.unidadId,
        courier:         formEdit.courier,
        descripcion:     formEdit.descripcion.trim() || undefined,
        numeroCasillero: !isNaN(nc) && nc > 0 ? nc : undefined,
      }
    ))
    supabase.from('paquetes').update({
      unidadId:        formEdit.unidadId,
      courier:         formEdit.courier,
      descripcion:     formEdit.descripcion.trim() || null,
      numeroCasillero: !isNaN(nc) && nc > 0 ? nc : null,
    }).eq('id', editando.id).then(({ error }) => { if (error) console.error('update paquete:', error.message) })
    setEditando(null)
    setErroresEdit({})
    showToast('Paquete actualizado correctamente')
  }

  function handleEliminar() {
    setLista(prev => prev.filter(p => p.id !== eliminarId))
    supabase.from('paquetes').delete().eq('id', eliminarId).then(({ error }) => { if (error) console.error('delete paquete:', error.message) })
    setEliminarId(null)
    showToast('Paquete eliminado')
  }

  // ─── Clases comunes ─────────────────────────────────────────
  const inp = 'w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'

  const tabs: { value: EstadoFiltro; label: string }[] = [
    { value: 'todos',      label: 'Todos' },
    { value: 'recibido',   label: 'En conserjería' },
    { value: 'notificado', label: 'Notificados' },
    { value: 'retirado',   label: 'Retirados' },
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
          <h1 className="text-2xl font-bold text-gray-900">Paquetes</h1>
          <p className="text-gray-500 mt-1">
            {pendientes} pendiente{pendientes !== 1 ? 's' : ''} de retiro ·{' '}
            {counts.retirado} retirado{counts.retirado !== 1 ? 's' : ''} hoy
          </p>
        </div>
        <button
          onClick={() => { setModalCrear(true); setErrores({}) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Registrar paquete
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['recibido', 'notificado', 'retirado'] as const).map(estado => {
          const cfg      = estadoCfg[estado]
          const { Icon } = cfg
          return (
            <div key={estado} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: cfg.bg }}>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{counts[estado]}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cfg.label}</p>
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
                ? { background: '#2563ae', color: 'white' }
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

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm py-16 text-center" style={{ borderColor: '#e2e8f0' }}>
            <Package className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm">No hay paquetes en esta categoría</p>
          </div>
        ) : filtered.map(p => {
          const unidad    = getUnidad(p.unidadId)
          const residente = getResidente(unidad)
          const cfg       = estadoCfg[p.estado]
          const { Icon }  = cfg

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              style={{ borderColor: '#e2e8f0' }}
            >
              <div className="h-1 w-full" style={{ background: cfg.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="flex items-center justify-center w-14 h-14 rounded-xl shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <Package className="w-6 h-6" style={{ color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">{p.courier}</h3>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {p.descripcion ?? 'Paquete'} · Unidad {unidad?.numero ?? p.unidadId}
                      </p>
                      {residente && <p className="text-xs text-gray-400 mt-0.5">{residente}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Recibido {formatFecha(p.recibidoEn)} · {formatHora(p.recibidoEn)}
                        </span>
                        {p.retiradoEn && <span>· Retirado {formatHora(p.retiradoEn)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      {p.codigoRetiro && (
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-0.5">Código de retiro</p>
                          <span className="text-2xl font-bold font-mono tracking-widest" style={{ color: '#1e3a5f' }}>
                            {p.codigoRetiro}
                          </span>
                        </div>
                      )}
                      {p.numeroCasillero != null && (
                        <div
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}
                        >
                          <Package className="w-3 h-3" />
                          Casillero #{p.numeroCasillero}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {p.estado !== 'retirado' && (
                        <button
                          onClick={() => marcarRetirado(p.id)}
                          className="px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                          style={{ background: '#dcfce7', color: '#16a34a' }}
                        >
                          Marcar retirado
                        </button>
                      )}
                      {p.estado !== 'retirado' && (
                        <button
                          onClick={() => abrirEditar(p)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                          style={{ background: '#dbeafe', color: '#2563ae' }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      )}
                      <button
                        onClick={() => setEliminarId(p.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                        style={{ background: '#fee2e2', color: '#dc2626' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center pb-2">
        {lista.length} paquete{lista.length !== 1 ? 's' : ''} registrados hoy
      </p>

      {/* ─── Modal: Registrar Paquete ─────────────────────────── */}
      <Modal
        abierto={modalCrear}
        onCerrar={() => { setModalCrear(false); setErrores({}) }}
        titulo="Registrar nuevo paquete"
        subtitulo="Ingresa los datos del paquete recibido en conserjería"
        colorAccento="#2563ae"
      >
        <div className="space-y-4">
          <Campo label="Unidad destinataria" error={errores.unidadId}>
            <select
              className={inp}
              style={{ borderColor: errores.unidadId ? '#dc2626' : '#e2e8f0' }}
              value={form.unidadId}
              onChange={e => setForm(f => ({ ...f, unidadId: e.target.value }))}
            >
              {unidades.map(u => {
                const uid = u.arrendatarioId ?? u.propietarioId
                const res = uid ? users.find(x => x.id === uid) : undefined
                return (
                  <option key={u.id} value={u.id}>
                    Unidad {u.numero}{res ? ` — ${res.nombre} ${res.apellido}` : ''}
                  </option>
                )
              })}
            </select>
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Courier / Servicio">
              <select
                className={inp}
                style={{ borderColor: '#e2e8f0' }}
                value={form.courier}
                onChange={e => setForm(f => ({ ...f, courier: e.target.value }))}
              >
                {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Campo>
            <Campo label="Descripción (opcional)">
              <input
                type="text"
                className={inp}
                style={{ borderColor: '#e2e8f0' }}
                placeholder="Ej: Caja mediana"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              />
            </Campo>
          </div>

          <Campo label="Casillero Odihnx (opcional)">
            <select
              className={inp}
              style={{ borderColor: '#e2e8f0' }}
              value={form.numeroCasillero}
              onChange={e => setForm(f => ({ ...f, numeroCasillero: e.target.value }))}
            >
              <option value="">— Sin casillero —</option>
              {Array.from({ length: 32 }, (_, i) => i + 1).map(n => (
                <option key={n} value={String(n)}>Casillero #{n}</option>
              ))}
            </select>
          </Campo>

          <p className="text-xs text-gray-400 p-3 rounded-xl" style={{ background: '#f8fafc' }}>
            💡 Se generará un <strong>código de retiro</strong> automáticamente al registrar el paquete.
          </p>

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
              Registrar paquete
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Editar Paquete ────────────────────────────── */}
      <Modal
        abierto={editando !== null}
        onCerrar={() => { setEditando(null); setErroresEdit({}) }}
        titulo="Editar paquete"
        subtitulo={editando ? `${editando.courier} · Cód. ${editando.codigoRetiro}` : ''}
        colorAccento="#2563ae"
      >
        {editando && (
          <div className="space-y-4">
            <Campo label="Unidad destinataria" error={erroresEdit.unidadId}>
              <select
                className={inp}
                style={{ borderColor: erroresEdit.unidadId ? '#dc2626' : '#e2e8f0' }}
                value={formEdit.unidadId}
                onChange={e => setFormEdit(f => ({ ...f, unidadId: e.target.value }))}
              >
                {unidades.map(u => {
                  const uid = u.arrendatarioId ?? u.propietarioId
                  const res = uid ? users.find(x => x.id === uid) : undefined
                  return (
                    <option key={u.id} value={u.id}>
                      Unidad {u.numero}{res ? ` — ${res.nombre} ${res.apellido}` : ''}
                    </option>
                  )
                })}
              </select>
            </Campo>

            <div className="grid grid-cols-2 gap-4">
              <Campo label="Courier / Servicio">
                <select
                  className={inp}
                  style={{ borderColor: '#e2e8f0' }}
                  value={formEdit.courier}
                  onChange={e => setFormEdit(f => ({ ...f, courier: e.target.value }))}
                >
                  {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Campo>
              <Campo label="Descripción (opcional)">
                <input
                  type="text"
                  className={inp}
                  style={{ borderColor: '#e2e8f0' }}
                  placeholder="Ej: Caja mediana"
                  value={formEdit.descripcion}
                  onChange={e => setFormEdit(f => ({ ...f, descripcion: e.target.value }))}
                />
              </Campo>
            </div>

            <Campo label="Casillero Odihnx (opcional)">
              <select
                className={inp}
                style={{ borderColor: '#e2e8f0' }}
                value={formEdit.numeroCasillero}
                onChange={e => setFormEdit(f => ({ ...f, numeroCasillero: e.target.value }))}
              >
                <option value="">— Sin casillero —</option>
                {Array.from({ length: 32 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={String(n)}>Casillero #{n}</option>
                ))}
              </select>
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
                style={{ background: '#2563ae' }}
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
        titulo="Eliminar paquete"
        subtitulo="Esta acción no se puede deshacer"
        colorAccento="#dc2626"
      >
        <div className="space-y-4">
          {paqueteAEliminar && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#fff1f2' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fee2e2' }}>
                <Package className="w-4 h-4" style={{ color: '#dc2626' }} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{paqueteAEliminar.courier}</p>
                <p className="text-xs text-gray-500">
                  {paqueteAEliminar.descripcion ?? 'Paquete'} · Unidad {getUnidad(paqueteAEliminar.unidadId)?.numero ?? paqueteAEliminar.unidadId}
                </p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600">¿Confirmas que deseas eliminar este paquete del registro?</p>
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
