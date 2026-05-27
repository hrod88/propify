'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Plus, Mail, Phone, Home, Check, Pencil, Trash2 } from 'lucide-react'
import Modal from '@/components/modal'
import { useNotificaciones } from '@/context/notificaciones-context'
import { supabase } from '@/lib/supabase'
import type { User, Unidad } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
type TabFiltro = 'todos' | 'propietario' | 'arrendatario'

const rolCfg = {
  propietario:  { label: 'Propietario',  bg: '#dbeafe', color: '#2563ae', avatar: '#1e3a5f' },
  arrendatario: { label: 'Arrendatario', bg: '#f3e8ff', color: '#7c3aed', avatar: '#7c3aed' },
} as const

const tipoLabel: Record<string, string> = {
  departamento:    'Depto',
  casa:            'Casa',
  local_comercial: 'Local',
  oficina:         'Oficina',
  bodega:          'Bodega',
  estacionamiento: 'Estac.',
}

function getInitials(nombre: string, apellido: string) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase()
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  residentes: User[]
  unidades: Unidad[]
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
export default function ResidentesView({ residentes, unidades }: Props) {
  const { agregarNotificacion }     = useNotificaciones()
  const [lista, setLista]           = useState<User[]>(residentes)
  const [tab, setTab]               = useState<TabFiltro>('todos')
  const [busqueda, setBusqueda]     = useState('')
  const [modalCrear, setModalCrear] = useState(false)
  const [toast, setToast]           = useState<string | null>(null)

  // ─── Formulario crear ────────────────────────────────────────
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    rol: 'propietario' as 'propietario' | 'arrendatario',
    unidadId: '',
  })
  const [errores, setErrores] = useState<Record<string, string>>({})

  // ─── Estado edición / eliminación ───────────────────────────
  const [editando, setEditando]     = useState<User | null>(null)
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [formEdit, setFormEdit]     = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    rol: 'propietario' as 'propietario' | 'arrendatario',
    unidadId: '',
  })
  const [erroresEdit, setErroresEdit] = useState<Record<string, string>>({})

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Datos derivados ────────────────────────────────────────
  const filtered = useMemo(() =>
    lista.filter(r => {
      if (tab !== 'todos' && r.rol !== tab) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (!`${r.nombre} ${r.apellido}`.toLowerCase().includes(q) &&
            !r.email.toLowerCase().includes(q)) return false
      }
      return true
    }),
    [lista, tab, busqueda],
  )

  const counts = useMemo(() => ({
    todos:        lista.length,
    propietario:  lista.filter(r => r.rol === 'propietario').length,
    arrendatario: lista.filter(r => r.rol === 'arrendatario').length,
  }), [lista])

  const residenteAEliminar = lista.find(x => x.id === eliminarId)

  // ─── Handler crear ──────────────────────────────────────────
  function handleCrear() {
    const e: Record<string, string> = {}
    if (!form.nombre.trim())   e.nombre   = 'El nombre es requerido'
    if (!form.apellido.trim()) e.apellido = 'El apellido es requerido'
    if (!form.email.trim())    e.email    = 'El email es requerido'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Ingresa un email válido'
    setErrores(e)
    if (Object.keys(e).length > 0) return

    const nuevo: User = {
      id:         `u${Date.now()}`,
      nombre:     form.nombre.trim(),
      apellido:   form.apellido.trim(),
      email:      form.email.trim().toLowerCase(),
      telefono:   form.telefono.trim() || undefined,
      rol:        form.rol,
      edificioId: 'e1',
      unidadId:   form.unidadId || undefined,
      activo:     true,
      creadoEn:   new Date().toISOString().split('T')[0],
    }
    setLista(prev => [nuevo, ...prev])
    setModalCrear(false)
    setForm({ nombre: '', apellido: '', email: '', telefono: '', rol: 'propietario', unidadId: '' })
    setErrores({})
    showToast('Residente registrado correctamente')
    agregarNotificacion('residente', 'Nuevo residente registrado', `${nuevo.nombre} ${nuevo.apellido} — ${nuevo.rol === 'propietario' ? 'Propietario' : 'Arrendatario'}`)
    supabase.from('usuarios').insert(nuevo).then(({ error }) => { if (error) console.error('insert residente:', error.message) })
  }

  // ─── Handler editar ─────────────────────────────────────────
  function abrirEditar(r: User) {
    setEditando(r)
    setFormEdit({
      nombre:   r.nombre,
      apellido: r.apellido,
      email:    r.email,
      telefono: r.telefono ?? '',
      rol:      r.rol as 'propietario' | 'arrendatario',
      unidadId: r.unidadId ?? '',
    })
    setErroresEdit({})
  }

  function handleEditar() {
    if (!editando) return
    const e: Record<string, string> = {}
    if (!formEdit.nombre.trim())   e.nombre   = 'El nombre es requerido'
    if (!formEdit.apellido.trim()) e.apellido = 'El apellido es requerido'
    if (!formEdit.email.trim())    e.email    = 'El email es requerido'
    else if (!/\S+@\S+\.\S+/.test(formEdit.email)) e.email = 'Ingresa un email válido'
    setErroresEdit(e)
    if (Object.keys(e).length > 0) return

    setLista(prev => prev.map(r =>
      r.id !== editando.id ? r : {
        ...r,
        nombre:   formEdit.nombre.trim(),
        apellido: formEdit.apellido.trim(),
        email:    formEdit.email.trim().toLowerCase(),
        telefono: formEdit.telefono.trim() || undefined,
        rol:      formEdit.rol,
        unidadId: formEdit.unidadId || undefined,
      }
    ))
    setEditando(null)
    setErroresEdit({})
    showToast('Residente actualizado correctamente')
    const upd = { nombre: formEdit.nombre.trim(), apellido: formEdit.apellido.trim(), email: formEdit.email.trim().toLowerCase(), telefono: formEdit.telefono.trim() || null, rol: formEdit.rol, unidadId: formEdit.unidadId || null }
    supabase.from('usuarios').update(upd).eq('id', editando.id).then(({ error }) => { if (error) console.error('update residente:', error.message) })
  }

  // ─── Handler eliminar ────────────────────────────────────────
  function handleEliminar() {
    setLista(prev => prev.filter(r => r.id !== eliminarId))
    supabase.from('usuarios').delete().eq('id', eliminarId).then(({ error }) => { if (error) console.error('delete residente:', error.message) })
    setEliminarId(null)
    showToast('Residente eliminado')
  }

  // ─── Clases comunes ─────────────────────────────────────────
  const inp = 'w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'

  const tabs: { value: TabFiltro; label: string }[] = [
    { value: 'todos',        label: `Todos (${counts.todos})` },
    { value: 'propietario',  label: `Propietarios (${counts.propietario})` },
    { value: 'arrendatario', label: `Arrendatarios (${counts.arrendatario})` },
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
          <h1 className="text-2xl font-bold text-gray-900">Residentes</h1>
          <p className="text-gray-500 mt-1">
            {counts.propietario} propietario{counts.propietario !== 1 ? 's' : ''} ·{' '}
            {counts.arrendatario} arrendatario{counts.arrendatario !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setModalCrear(true); setErrores({}) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo residente
        </button>
      </div>

      {/* Tabs + Búsqueda */}
      <div className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {tabs.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={
                  tab === value
                    ? { background: '#2563ae', color: 'white' }
                    : { background: '#f1f5f9', color: '#64748b' }
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="pl-9 pr-4 py-2 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#0f172a', width: 240 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#2563ae'; e.currentTarget.style.background = 'white' }}
              onBlur={e  => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
              suppressHydrationWarning
            />
          </div>
        </div>
      </div>

      {/* Grid de cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border shadow-sm py-16 text-center" style={{ borderColor: '#e2e8f0' }}>
          <p className="text-gray-400 text-sm">No se encontraron residentes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(residente => {
            const cfg    = rolCfg[residente.rol as keyof typeof rolCfg]
            const unidad = residente.unidadId ? unidades.find(u => u.id === residente.unidadId) : undefined

            return (
              <div
                key={residente.id}
                className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 flex flex-col"
                style={{ borderColor: '#e2e8f0' }}
              >
                {/* Cabecera */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-full text-white text-sm font-bold shrink-0"
                    style={{ background: cfg.avatar }}
                  >
                    {getInitials(residente.nombre, residente.apellido)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {residente.nombre} {residente.apellido}
                    </p>
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-0.5"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full shrink-0 mt-1"
                    style={{ background: residente.activo ? '#16a34a' : '#94a3b8' }}
                    title={residente.activo ? 'Activo' : 'Inactivo'}
                  />
                </div>

                {/* Datos */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">{residente.email}</span>
                  </div>
                  {residente.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span>{residente.telefono}</span>
                    </div>
                  )}
                  {unidad && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Home className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span>
                        {tipoLabel[unidad.tipo] ?? unidad.tipo} {unidad.numero}
                        {unidad.piso > 0 ? ` · Piso ${unidad.piso}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-4">
                  Residente desde{' '}
                  {new Date(residente.creadoEn).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                </p>

                {/* Footer */}
                <div className="mt-auto pt-3 border-t space-y-2" style={{ borderColor: '#f1f5f9' }}>
                  <div className="flex items-center justify-between">
                    {unidad ? (
                      <Link
                        href={`/unidades/${unidad.id}`}
                        className="text-xs font-medium hover:opacity-75 transition-opacity"
                        style={{ color: '#64748b' }}
                      >
                        Ver unidad →
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-300">Sin unidad asignada</span>
                    )}
                    <Link
                      href={`/residentes/${residente.id}`}
                      className="text-xs font-semibold hover:opacity-75 transition-opacity"
                      style={{ color: '#2563ae' }}
                    >
                      Ver perfil →
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEditar(residente)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ background: '#dbeafe', color: '#2563ae' }}
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => setEliminarId(residente.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ background: '#fee2e2', color: '#dc2626' }}
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center pb-2">
          Mostrando {filtered.length} de {lista.length} residentes
        </p>
      )}

      {/* ─── Modal: Nuevo Residente ───────────────────────────── */}
      <Modal
        abierto={modalCrear}
        onCerrar={() => { setModalCrear(false); setErrores({}) }}
        titulo="Nuevo residente"
        subtitulo="Registra un propietario o arrendatario en el edificio"
        colorAccento="#2563ae"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Nombre" error={errores.nombre}>
              <input
                type="text"
                className={inp}
                style={{ borderColor: errores.nombre ? '#dc2626' : '#e2e8f0' }}
                placeholder="María"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </Campo>
            <Campo label="Apellido" error={errores.apellido}>
              <input
                type="text"
                className={inp}
                style={{ borderColor: errores.apellido ? '#dc2626' : '#e2e8f0' }}
                placeholder="González"
                value={form.apellido}
                onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
              />
            </Campo>
          </div>

          <Campo label="Email" error={errores.email}>
            <input
              type="email"
              className={inp}
              style={{ borderColor: errores.email ? '#dc2626' : '#e2e8f0' }}
              placeholder="residente@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </Campo>

          <div className="grid grid-cols-2 gap-4">
            <Campo label="Teléfono (opcional)">
              <input
                type="tel"
                className={inp}
                style={{ borderColor: '#e2e8f0' }}
                placeholder="+56 9 1234 5678"
                value={form.telefono}
                onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
              />
            </Campo>
            <Campo label="Rol">
              <select
                className={inp}
                style={{ borderColor: '#e2e8f0' }}
                value={form.rol}
                onChange={e => setForm(f => ({ ...f, rol: e.target.value as typeof form.rol }))}
              >
                <option value="propietario">Propietario</option>
                <option value="arrendatario">Arrendatario</option>
              </select>
            </Campo>
          </div>

          <Campo label="Unidad asignada (opcional)">
            <select
              className={inp}
              style={{ borderColor: '#e2e8f0' }}
              value={form.unidadId}
              onChange={e => setForm(f => ({ ...f, unidadId: e.target.value }))}
            >
              <option value="">— Sin asignar —</option>
              {unidades.map(u => (
                <option key={u.id} value={u.id}>
                  Unidad {u.numero} · Piso {u.piso} ({tipoLabel[u.tipo] ?? u.tipo})
                </option>
              ))}
            </select>
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
              Registrar
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Editar Residente ──────────────────────────── */}
      <Modal
        abierto={editando !== null}
        onCerrar={() => { setEditando(null); setErroresEdit({}) }}
        titulo="Editar residente"
        subtitulo={editando ? `${editando.nombre} ${editando.apellido}` : ''}
        colorAccento="#2563ae"
      >
        {editando && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Nombre" error={erroresEdit.nombre}>
                <input
                  type="text"
                  className={inp}
                  style={{ borderColor: erroresEdit.nombre ? '#dc2626' : '#e2e8f0' }}
                  value={formEdit.nombre}
                  onChange={e => setFormEdit(f => ({ ...f, nombre: e.target.value }))}
                />
              </Campo>
              <Campo label="Apellido" error={erroresEdit.apellido}>
                <input
                  type="text"
                  className={inp}
                  style={{ borderColor: erroresEdit.apellido ? '#dc2626' : '#e2e8f0' }}
                  value={formEdit.apellido}
                  onChange={e => setFormEdit(f => ({ ...f, apellido: e.target.value }))}
                />
              </Campo>
            </div>

            <Campo label="Email" error={erroresEdit.email}>
              <input
                type="email"
                className={inp}
                style={{ borderColor: erroresEdit.email ? '#dc2626' : '#e2e8f0' }}
                value={formEdit.email}
                onChange={e => setFormEdit(f => ({ ...f, email: e.target.value }))}
              />
            </Campo>

            <div className="grid grid-cols-2 gap-4">
              <Campo label="Teléfono (opcional)">
                <input
                  type="tel"
                  className={inp}
                  style={{ borderColor: '#e2e8f0' }}
                  value={formEdit.telefono}
                  onChange={e => setFormEdit(f => ({ ...f, telefono: e.target.value }))}
                />
              </Campo>
              <Campo label="Rol">
                <select
                  className={inp}
                  style={{ borderColor: '#e2e8f0' }}
                  value={formEdit.rol}
                  onChange={e => setFormEdit(f => ({ ...f, rol: e.target.value as typeof formEdit.rol }))}
                >
                  <option value="propietario">Propietario</option>
                  <option value="arrendatario">Arrendatario</option>
                </select>
              </Campo>
            </div>

            <Campo label="Unidad asignada (opcional)">
              <select
                className={inp}
                style={{ borderColor: '#e2e8f0' }}
                value={formEdit.unidadId}
                onChange={e => setFormEdit(f => ({ ...f, unidadId: e.target.value }))}
              >
                <option value="">— Sin asignar —</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>
                    Unidad {u.numero} · Piso {u.piso} ({tipoLabel[u.tipo] ?? u.tipo})
                  </option>
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
        titulo="Eliminar residente"
        subtitulo="Esta acción no se puede deshacer"
        colorAccento="#dc2626"
      >
        <div className="space-y-4">
          {residenteAEliminar && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#fff1f2' }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: '#dc2626' }}
              >
                {getInitials(residenteAEliminar.nombre, residenteAEliminar.apellido)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{residenteAEliminar.nombre} {residenteAEliminar.apellido}</p>
                <p className="text-xs text-gray-500">{residenteAEliminar.email}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600">¿Confirmas que deseas eliminar este residente del sistema?</p>
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
