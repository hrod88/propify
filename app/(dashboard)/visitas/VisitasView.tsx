'use client'

import { useState, useMemo } from 'react'
import { Plus, LogIn, LogOut, Car, Clock, Users, Check, Pencil, Trash2, ParkingSquare, Timer } from 'lucide-react'
import Modal from '@/components/modal'
import { useNotificaciones } from '@/context/notificaciones-context'
import { supabase } from '@/lib/supabase'
import type { Visita, Unidad, User } from '@/types'

// ─── Constantes ───────────────────────────────────────────────
const MOTIVOS_VISITA = [
  'Visita familiar',
  'Delivery / Encomienda',
  'Servicio técnico',
  'Visita médica / cuidados',
  'Mudanza',
  'Reunión / Negocios',
  'Arriendo / Propietario',
  'Otro',
]

const TIPOS_VEHICULO = [
  { value: 'auto',      label: 'Auto' },
  { value: 'camioneta', label: 'Camioneta / SUV' },
  { value: 'furgon',    label: 'Furgón / Minivan' },
  { value: 'moto',      label: 'Moto' },
  { value: 'bicicleta', label: 'Bicicleta' },
  { value: 'otro',      label: 'Otro' },
]

const TIEMPOS_ESTADIA = [
  { value: 0,   label: 'Indefinido' },
  { value: 30,  label: 'Menos de 1 hora' },
  { value: 60,  label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' },
  { value: 480, label: 'Más de 4 horas' },
]

// ─── Props ────────────────────────────────────────────────────
interface Props {
  visitas: Visita[]
  unidades: Unidad[]
  users: User[]
}

// ─── Helpers ──────────────────────────────────────────────────
function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  )
}

function formatTiempo(min?: number) {
  if (!min || min === 0) return null
  if (min < 60) return `${min} min`
  const h = min / 60
  return h === 1 ? '1h' : `${h}h`
}

function labelTipoVehiculo(val?: string) {
  return TIPOS_VEHICULO.find(t => t.value === val)?.label ?? val ?? ''
}

// ─── Tipo formulario ──────────────────────────────────────────
type FormState = {
  nombreVisitante: string
  rutVisitante: string
  unidadId: string
  motivoVisita: string
  tieneVehiculo: boolean
  tipoVehiculo: string
  vehiculoPatente: string
  estacionamiento: string
  tiempoEstadiaMin: number
}

// ─── Componente ───────────────────────────────────────────────
export default function VisitasView({ visitas, unidades, users }: Props) {
  const { agregarNotificacion }     = useNotificaciones()
  const [lista, setLista]           = useState<Visita[]>(visitas)
  const [filtro, setFiltro]         = useState<'todos' | 'dentro' | 'salieron'>('todos')
  const [modalCrear, setModalCrear] = useState(false)
  const [editando, setEditando]     = useState<Visita | null>(null)
  const [eliminarId, setEliminarId] = useState<string | null>(null)
  const [toast, setToast]           = useState<string | null>(null)

  const formVacio: FormState = {
    nombreVisitante:  '',
    rutVisitante:     '',
    unidadId:         unidades[0]?.id ?? '',
    motivoVisita:     '',
    tieneVehiculo:    false,
    tipoVehiculo:     '',
    vehiculoPatente:  '',
    estacionamiento:  '',
    tiempoEstadiaMin: 0,
  }

  const [form, setForm]         = useState<FormState>(formVacio)
  const [formEdit, setFormEdit] = useState<FormState>(formVacio)
  const [errores, setErrores]   = useState<Record<string, string>>({})
  const [erroresEdit, setErroresEdit] = useState<Record<string, string>>({})

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Datos derivados ────────────────────────────────────────
  const dentro   = useMemo(() => lista.filter(v => !v.salidaEn), [lista])
  const salieron = useMemo(() => lista.filter(v =>  v.salidaEn), [lista])

  const filtered = useMemo(() =>
    filtro === 'dentro'   ? dentro :
    filtro === 'salieron' ? salieron :
    lista,
    [lista, dentro, salieron, filtro],
  )

  const getUnidad   = (id: string) => unidades.find(u => u.id === id)
  const formatHora  = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  const formatFecha = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })

  const visitaAEliminar = lista.find(x => x.id === eliminarId)

  function validar(f: FormState) {
    const e: Record<string, string> = {}
    if (!f.nombreVisitante.trim()) e.nombreVisitante = 'El nombre es requerido'
    if (!f.unidadId)               e.unidadId        = 'Selecciona una unidad'
    if (!f.motivoVisita)           e.motivoVisita    = 'Selecciona un motivo'
    if (f.tieneVehiculo && !f.tipoVehiculo) e.tipoVehiculo = 'Selecciona el tipo'
    return e
  }

  function formAVisita(f: FormState, base: Partial<Visita>): Visita {
    return {
      id:               base.id ?? `v${Date.now()}`,
      edificioId:       base.edificioId ?? 'e1',
      entradaEn:        base.entradaEn ?? new Date().toISOString(),
      salidaEn:         base.salidaEn,
      registradoPorId:  base.registradoPorId ?? 'u1',
      unidadId:         f.unidadId,
      nombreVisitante:  f.nombreVisitante.trim(),
      rutVisitante:     f.rutVisitante.trim() || undefined,
      motivoVisita:     f.motivoVisita,
      tipoVehiculo:     f.tieneVehiculo && f.tipoVehiculo ? f.tipoVehiculo : undefined,
      vehiculoPatente:  f.tieneVehiculo && f.vehiculoPatente ? f.vehiculoPatente.trim().toUpperCase() : undefined,
      estacionamiento:  f.tieneVehiculo && f.estacionamiento ? f.estacionamiento.trim() : undefined,
      tiempoEstadiaMin: f.tiempoEstadiaMin || undefined,
    }
  }

  // ─── Handlers ───────────────────────────────────────────────
  function handleCrear() {
    const e = validar(form)
    setErrores(e)
    if (Object.keys(e).length > 0) return

    const nueva = formAVisita(form, {})
    setLista(prev => [nueva, ...prev])
    setModalCrear(false)
    setForm(formVacio)
    setErrores({})
    showToast(`Visita registrada · ${nueva.nombreVisitante}`)
    const unidadNum = getUnidad(nueva.unidadId)?.numero ?? nueva.unidadId
    agregarNotificacion('visita', 'Visita registrada', `${nueva.nombreVisitante} → Unidad ${unidadNum}`)
    supabase.from('visitas').insert(nueva).then(({ error }) => { if (error) console.error('insert visita:', error.message) })
  }

  function registrarSalida(id: string) {
    const salidaEn = new Date().toISOString()
    setLista(prev => prev.map(v => v.id !== id ? v : { ...v, salidaEn }))
    supabase.from('visitas').update({ salidaEn }).eq('id', id).then(({ error }) => { if (error) console.error('salida visita:', error.message) })
    showToast('Salida registrada correctamente')
  }

  function abrirEditar(v: Visita) {
    setEditando(v)
    setFormEdit({
      nombreVisitante:  v.nombreVisitante,
      rutVisitante:     v.rutVisitante ?? '',
      unidadId:         v.unidadId,
      motivoVisita:     v.motivoVisita,
      tieneVehiculo:    !!(v.tipoVehiculo || v.vehiculoPatente),
      tipoVehiculo:     v.tipoVehiculo ?? '',
      vehiculoPatente:  v.vehiculoPatente ?? '',
      estacionamiento:  v.estacionamiento ?? '',
      tiempoEstadiaMin: v.tiempoEstadiaMin ?? 0,
    })
    setErroresEdit({})
  }

  function handleEditar() {
    if (!editando) return
    const e = validar(formEdit)
    setErroresEdit(e)
    if (Object.keys(e).length > 0) return

    const updated = formAVisita(formEdit, editando)
    setLista(prev => prev.map(v => v.id !== editando.id ? v : updated))
    supabase.from('visitas').update(updated).eq('id', editando.id).then(({ error }) => { if (error) console.error('update visita:', error.message) })
    setEditando(null)
    setErroresEdit({})
    showToast('Visita actualizada correctamente')
  }

  function handleEliminar() {
    setLista(prev => prev.filter(v => v.id !== eliminarId))
    supabase.from('visitas').delete().eq('id', eliminarId).then(({ error }) => { if (error) console.error('delete visita:', error.message) })
    setEliminarId(null)
    showToast('Visita eliminada')
  }

  // ─── Clases comunes ─────────────────────────────────────────
  const inp = 'w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'

  // ─── Sección formulario ──────────────────────────────────────
  function renderForm(f: FormState, setF: React.Dispatch<React.SetStateAction<FormState>>, errs: Record<string, string>) {
    return (
      <div className="space-y-4">
        {/* Nombre */}
        <Campo label="Nombre del visitante" error={errs.nombreVisitante}>
          <input
            type="text"
            className={inp}
            style={{ borderColor: errs.nombreVisitante ? '#dc2626' : '#e2e8f0' }}
            placeholder="Nombre completo"
            value={f.nombreVisitante}
            onChange={e => setF(p => ({ ...p, nombreVisitante: e.target.value }))}
          />
        </Campo>

        {/* RUT + Unidad */}
        <div className="grid grid-cols-2 gap-4">
          <Campo label="RUT (opcional)">
            <input
              type="text"
              className={inp}
              style={{ borderColor: '#e2e8f0' }}
              placeholder="12.345.678-9"
              value={f.rutVisitante}
              onChange={e => setF(p => ({ ...p, rutVisitante: e.target.value }))}
            />
          </Campo>
          <Campo label="Unidad destino" error={errs.unidadId}>
            <select
              className={inp}
              style={{ borderColor: errs.unidadId ? '#dc2626' : '#e2e8f0' }}
              value={f.unidadId}
              onChange={e => setF(p => ({ ...p, unidadId: e.target.value }))}
            >
              {unidades.map(u => {
                const uid = u.arrendatarioId ?? u.propietarioId
                const res = uid ? users.find(x => x.id === uid) : undefined
                return (
                  <option key={u.id} value={u.id}>
                    Unidad {u.numero}{res ? ` — ${res.nombre}` : ''}
                  </option>
                )
              })}
            </select>
          </Campo>
        </div>

        {/* Motivo + Tiempo */}
        <div className="grid grid-cols-2 gap-4">
          <Campo label="Motivo de visita" error={errs.motivoVisita}>
            <select
              className={inp}
              style={{ borderColor: errs.motivoVisita ? '#dc2626' : '#e2e8f0' }}
              value={f.motivoVisita}
              onChange={e => setF(p => ({ ...p, motivoVisita: e.target.value }))}
            >
              <option value="">Selecciona...</option>
              {MOTIVOS_VISITA.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Tiempo de estadía">
            <select
              className={inp}
              style={{ borderColor: '#e2e8f0' }}
              value={f.tiempoEstadiaMin}
              onChange={e => setF(p => ({ ...p, tiempoEstadiaMin: Number(e.target.value) }))}
            >
              {TIEMPOS_ESTADIA.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Campo>
        </div>

        {/* Vehículo */}
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              checked={f.tieneVehiculo}
              onChange={e => setF(p => ({
                ...p,
                tieneVehiculo:   e.target.checked,
                tipoVehiculo:    '',
                vehiculoPatente: '',
                estacionamiento: '',
              }))}
            />
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-400" />
              Viene en vehículo
            </span>
          </label>

          {f.tieneVehiculo && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Tipo de vehículo" error={errs.tipoVehiculo}>
                  <select
                    className={inp}
                    style={{ borderColor: errs.tipoVehiculo ? '#dc2626' : '#e2e8f0' }}
                    value={f.tipoVehiculo}
                    onChange={e => setF(p => ({ ...p, tipoVehiculo: e.target.value }))}
                  >
                    <option value="">Selecciona...</option>
                    {TIPOS_VEHICULO.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Patente (opcional)">
                  <input
                    type="text"
                    className={inp + ' uppercase'}
                    style={{ borderColor: '#e2e8f0' }}
                    placeholder="ABCD12"
                    maxLength={8}
                    value={f.vehiculoPatente}
                    onChange={e => setF(p => ({ ...p, vehiculoPatente: e.target.value.toUpperCase() }))}
                  />
                </Campo>
              </div>
              <Campo label="Estacionamiento asignado (opcional)">
                <input
                  type="text"
                  className={inp}
                  style={{ borderColor: '#e2e8f0' }}
                  placeholder="Ej: E-101, Visita 2, Subterráneo 3..."
                  value={f.estacionamiento}
                  onChange={e => setF(p => ({ ...p, estacionamiento: e.target.value }))}
                />
              </Campo>
            </div>
          )}
        </div>
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Control de Visitas</h1>
          <p className="text-gray-500 mt-1">
            {lista.length} visita{lista.length !== 1 ? 's' : ''} hoy ·{' '}
            {dentro.length} actualmente dentro
          </p>
        </div>
        <button
          onClick={() => { setModalCrear(true); setErrores({}) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Registrar visita
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total hoy',    value: lista.length,    Icon: Users,  color: '#2563ae', bg: '#dbeafe' },
          { label: 'Dentro ahora', value: dentro.length,   Icon: LogIn,  color: '#16a34a', bg: '#dcfce7' },
          { label: 'Salieron',     value: salieron.length, Icon: LogOut, color: '#64748b', bg: '#f1f5f9' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { value: 'todos',    label: `Todas (${lista.length})` },
          { value: 'dentro',   label: `Dentro (${dentro.length})` },
          { value: 'salieron', label: `Salieron (${salieron.length})` },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFiltro(value as typeof filtro)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              filtro === value
                ? { background: '#2563ae', color: 'white' }
                : { background: '#f1f5f9', color: '#64748b' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                {['Estado', 'Visitante', 'Destino', 'Motivo', 'Vehículo', 'Estadía', 'Entrada', 'Salida', ''].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No hay visitas en esta categoría
                  </td>
                </tr>
              ) : filtered.map(v => {
                const unidad = getUnidad(v.unidadId)
                const activo = !v.salidaEn
                const tiempo = formatTiempo(v.tiempoEstadiaMin)

                return (
                  <tr key={v.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#f8fafc' }}>
                    {/* Estado */}
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={
                          activo
                            ? { background: '#dcfce7', color: '#16a34a' }
                            : { background: '#f1f5f9', color: '#64748b' }
                        }
                      >
                        {activo ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                        {activo ? 'Dentro' : 'Salió'}
                      </span>
                    </td>

                    {/* Visitante */}
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">{v.nombreVisitante}</p>
                      {v.rutVisitante && <p className="text-xs text-gray-400">{v.rutVisitante}</p>}
                    </td>

                    {/* Destino */}
                    <td className="px-4 py-3.5 text-sm text-gray-600">
                      {unidad ? `Unidad ${unidad.numero}` : v.unidadId}
                    </td>

                    {/* Motivo */}
                    <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{v.motivoVisita}</td>

                    {/* Vehículo */}
                    <td className="px-4 py-3.5">
                      {v.tipoVehiculo || v.vehiculoPatente ? (
                        <div className="space-y-0.5">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ background: '#f1f5f9', color: '#1e3a5f' }}
                          >
                            <Car className="w-3 h-3" />
                            {labelTipoVehiculo(v.tipoVehiculo)}
                            {v.vehiculoPatente && ` · ${v.vehiculoPatente}`}
                          </span>
                          {v.estacionamiento && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <ParkingSquare className="w-3 h-3 text-gray-400" />
                              {v.estacionamiento}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>

                    {/* Estadía */}
                    <td className="px-4 py-3.5">
                      {tiempo ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded" style={{ background: '#fef9c3', color: '#854d0e' }}>
                          <Timer className="w-3 h-3" />
                          {tiempo}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Entrada */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3 text-gray-300" />
                        <span suppressHydrationWarning>{formatHora(v.entradaEn)}</span>
                      </div>
                      <p className="text-xs text-gray-400" suppressHydrationWarning>
                        {formatFecha(v.entradaEn)}
                      </p>
                    </td>

                    {/* Salida */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {v.salidaEn ? (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3 h-3 text-gray-300" />
                          <span suppressHydrationWarning>{formatHora(v.salidaEn)}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => registrarSalida(v.id)}
                          className="text-xs font-semibold px-3 py-1 rounded-lg hover:opacity-80 transition-opacity"
                          style={{ background: '#f1f5f9', color: '#2563ae' }}
                        >
                          Registrar salida
                        </button>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => abrirEditar(v)}
                          className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                          style={{ background: '#dbeafe', color: '#2563ae' }}
                          title="Editar visita"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEliminarId(v.id)}
                          className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                          style={{ background: '#fee2e2', color: '#dc2626' }}
                          title="Eliminar visita"
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

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t" style={{ borderColor: '#f1f5f9' }}>
            <p className="text-xs text-gray-400">
              Mostrando {filtered.length} de {lista.length} visitas
            </p>
          </div>
        )}
      </div>

      {/* ─── Modal: Registrar Visita ──────────────────────────── */}
      <Modal
        abierto={modalCrear}
        onCerrar={() => { setModalCrear(false); setErrores({}); setForm(formVacio) }}
        titulo="Registrar visita"
        subtitulo="Completa los datos del visitante al ingresar al edificio"
        colorAccento="#16a34a"
      >
        <div className="space-y-4">
          {renderForm(form, setForm, errores)}
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => { setModalCrear(false); setErrores({}); setForm(formVacio) }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCrear}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#16a34a' }}
            >
              Registrar entrada
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Editar Visita ─────────────────────────────── */}
      <Modal
        abierto={editando !== null}
        onCerrar={() => { setEditando(null); setErroresEdit({}) }}
        titulo="Editar visita"
        subtitulo={editando ? editando.nombreVisitante : ''}
        colorAccento="#2563ae"
      >
        {editando && (
          <div className="space-y-4">
            {renderForm(formEdit, setFormEdit, erroresEdit)}
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
        titulo="Eliminar visita"
        subtitulo="Esta acción no se puede deshacer"
        colorAccento="#dc2626"
      >
        <div className="space-y-4">
          {visitaAEliminar && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#fff1f2' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fee2e2' }}>
                <Users className="w-4 h-4" style={{ color: '#dc2626' }} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{visitaAEliminar.nombreVisitante}</p>
                <p className="text-xs text-gray-500">
                  {visitaAEliminar.motivoVisita} · Unidad {getUnidad(visitaAEliminar.unidadId)?.numero ?? visitaAEliminar.unidadId}
                </p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600">¿Confirmas que deseas eliminar este registro de visita?</p>
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
