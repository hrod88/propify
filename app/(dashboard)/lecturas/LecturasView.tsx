'use client'

import { useState, useMemo, useCallback } from 'react'
import { Plus, Pencil, Trash2, Gauge, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCLP } from '@/lib/db'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Modal from '@/components/modal'
import type { Lectura, Unidad } from '@/types'

// ─── Constantes ───────────────────────────────────────────────
const SERVICIOS = ['Agua Caliente', 'Agua Fría', 'Gas', 'Electricidad']
const MESES     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ─── Props & Form ─────────────────────────────────────────────
interface Props {
  lecturas:      Lectura[]
  unidades:      Unidad[]
  edificioId:    string
  edificioNombre: string
}

interface FormState {
  unidadId:          string   // '' = comunitario (sin unidad)
  servicio:          string
  lecturaInicial:    string
  lecturaFinal:      string
  consumoM3:         string
  precioM3:          string
  porcentajeConsumo: string
  total:             string
  observacion:       string
}

const FORM_EMPTY: FormState = {
  unidadId: '', servicio: 'Agua Caliente', lecturaInicial: '',
  lecturaFinal: '', consumoM3: '', precioM3: '', porcentajeConsumo: '',
  total: '', observacion: '',
}

type FormErrors = Partial<Record<keyof FormState, string>>

// ─── Componente ───────────────────────────────────────────────
export default function LecturasView({ lecturas: initial, unidades, edificioId }: Props) {
  const [lista,    setLista]   = useState<Lectura[]>(initial)
  const [toast,    setToast]   = useState<string | null>(null)

  const hoy = new Date()
  const [filtroMes, setFiltroMes] = useState(hoy.getUTCMonth() + 1)
  const [filtroAño, setFiltroAño] = useState(hoy.getUTCFullYear())

  const [modalCrear,  setModalCrear]  = useState(false)
  const [form,        setForm]        = useState<FormState>(FORM_EMPTY)
  const [errores,     setErrores]     = useState<FormErrors>({})

  const [editandoId,  setEditandoId]  = useState<string | null>(null)
  const [formEdit,    setFormEdit]    = useState<FormState>(FORM_EMPTY)
  const [erroresEdit, setErroresEdit] = useState<FormErrors>({})

  const [eliminarId, setEliminarId]  = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const lecturasMes = useMemo(
    () => lista.filter(l => l.mes === filtroMes && l.año === filtroAño),
    [lista, filtroMes, filtroAño],
  )

  function mesAnterior() {
    if (filtroMes === 1) { setFiltroMes(12); setFiltroAño(y => y - 1) }
    else setFiltroMes(m => m - 1)
  }
  function mesSiguiente() {
    if (filtroMes === 12) { setFiltroMes(1); setFiltroAño(y => y + 1) }
    else setFiltroMes(m => m + 1)
  }

  function upd(k: keyof FormState, setter: React.Dispatch<React.SetStateAction<FormState>>) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setter(f => ({ ...f, [k]: e.target.value }))
  }

  function validar(f: FormState): FormErrors {
    const e: FormErrors = {}
    if (!f.servicio) e.servicio = 'Elige un servicio'
    return e
  }

  function buildPayload(f: FormState, mes: number, año: number): Omit<Lectura, 'id' | 'creadoEn'> {
    return {
      edificioId,
      unidadId:          f.unidadId || null,
      mes,
      año,
      servicio:          f.servicio,
      lecturaInicial:    f.lecturaInicial    ? Number(f.lecturaInicial)    : null,
      lecturaFinal:      f.lecturaFinal      ? Number(f.lecturaFinal)      : null,
      consumoM3:         f.consumoM3         ? Number(f.consumoM3)         : null,
      precioM3:          f.precioM3          ? Number(f.precioM3)          : null,
      porcentajeConsumo: f.porcentajeConsumo ? Number(f.porcentajeConsumo) : null,
      total:             f.total             ? Number(f.total)             : null,
      observacion:       f.observacion       || null,
    }
  }

  const handleCrear = useCallback(() => {
    const e = validar(form)
    setErrores(e)
    if (Object.keys(e).length) return

    const id    = crypto.randomUUID()
    const nueva = { ...buildPayload(form, filtroMes, filtroAño), id, creadoEn: new Date().toISOString() } as Lectura
    setLista(prev => [nueva, ...prev])
    setModalCrear(false); setForm(FORM_EMPTY)
    showToast('Lectura registrada')
    supabaseBrowser.from('lecturas').insert(nueva)
      .then(({ error }) => { if (error) console.warn('[Lecturas] insert:', error.message) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, filtroMes, filtroAño, edificioId])

  const abrirEditar = useCallback((l: Lectura) => {
    setEditandoId(l.id)
    setFormEdit({
      unidadId:          l.unidadId          ?? '',
      servicio:          l.servicio,
      lecturaInicial:    l.lecturaInicial     != null ? String(l.lecturaInicial)    : '',
      lecturaFinal:      l.lecturaFinal       != null ? String(l.lecturaFinal)      : '',
      consumoM3:         l.consumoM3          != null ? String(l.consumoM3)         : '',
      precioM3:          l.precioM3           != null ? String(l.precioM3)          : '',
      porcentajeConsumo: l.porcentajeConsumo  != null ? String(l.porcentajeConsumo) : '',
      total:             l.total              != null ? String(l.total)             : '',
      observacion:       l.observacion        ?? '',
    })
    setErroresEdit({})
  }, [])

  const handleEditar = useCallback(() => {
    if (!editandoId) return
    const e = validar(formEdit)
    setErroresEdit(e)
    if (Object.keys(e).length) return
    const cambios = buildPayload(formEdit, filtroMes, filtroAño)
    setLista(prev => prev.map(l => l.id === editandoId ? { ...l, ...cambios } : l))
    const id = editandoId; setEditandoId(null)
    showToast('Lectura actualizada')
    supabaseBrowser.from('lecturas').update(cambios).eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Lecturas] update:', error.message) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editandoId, formEdit, filtroMes, filtroAño, edificioId])

  const handleEliminar = useCallback(() => {
    if (!eliminarId) return
    setLista(prev => prev.filter(l => l.id !== eliminarId))
    const id = eliminarId; setEliminarId(null)
    showToast('Lectura eliminada')
    supabaseBrowser.from('lecturas').delete().eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Lecturas] delete:', error.message) })
  }, [eliminarId])

  const numLabel = (u: Unidad) => `Depto/Unidad ${u.numero}${u.piso ? ` · Piso ${u.piso}` : ''}`

  // ── Formulario reutilizable ──
  function FormLectura({ f, setF, errs, onOk, onCancel, label }: {
    f: FormState; setF: React.Dispatch<React.SetStateAction<FormState>>
    errs: FormErrors; onOk: () => void; onCancel: () => void; label: string
  }) {
    const u = (k: keyof FormState) => upd(k, setF)
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Servicio *</label>
            <select value={f.servicio} onChange={u('servicio')}
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: errs.servicio ? '#dc2626' : '#e2e8f0' }}>
              {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Unidad (vacío = comunidad)</label>
            <select value={f.unidadId} onChange={u('unidadId')}
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: '#e2e8f0' }}>
              <option value="">— Comunitario —</option>
              {unidades.map(un => <option key={un.id} value={un.id}>{numLabel(un)}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['lecturaInicial','lecturaFinal'] as const).map(k => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {k === 'lecturaInicial' ? 'Lectura inicial (m³)' : 'Lectura final (m³)'}
              </label>
              <input type="number" step="0.01" value={f[k]} onChange={u(k)}
                placeholder="ej: 389.0"
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                style={{ borderColor: '#e2e8f0' }} suppressHydrationWarning />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Consumo m³</label>
            <input type="number" step="0.01" value={f.consumoM3} onChange={u('consumoM3')}
              placeholder="ej: 4.0"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: '#e2e8f0' }} suppressHydrationWarning />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Precio / m³ ($)</label>
            <input type="number" step="0.01" value={f.precioM3} onChange={u('precioM3')}
              placeholder="ej: 16388"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: '#e2e8f0' }} suppressHydrationWarning />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">% del total</label>
            <input type="number" step="0.0001" value={f.porcentajeConsumo} onChange={u('porcentajeConsumo')}
              placeholder="ej: 1.098"
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              style={{ borderColor: '#e2e8f0' }} suppressHydrationWarning />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Total a pagar ($)</label>
          <input type="number" value={f.total} onChange={u('total')}
            placeholder="ej: 65553"
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: '#e2e8f0' }} suppressHydrationWarning />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Observación</label>
          <textarea value={f.observacion} onChange={u('observacion')} rows={2}
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
            style={{ borderColor: '#e2e8f0' }} />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-slate-50"
            style={{ borderColor: '#e2e8f0' }}>Cancelar</button>
          <button onClick={onOk}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
            style={{ background: '#2563ae' }}>{label}</button>
        </div>
      </div>
    )
  }

  const lecturaPorEliminar = lista.find(l => l.id === eliminarId)

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl animate-fade-in"
          style={{ background: '#1e3a5f' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lecturas de Medidores</h1>
          <p className="text-gray-500 mt-1 text-sm">Registra lecturas de agua, gas y electricidad por unidad</p>
        </div>
        <button
          onClick={() => { setForm(FORM_EMPTY); setErrores({}); setModalCrear(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}>
          <Plus className="w-4 h-4" /> Nueva lectura
        </button>
      </div>

      {/* Selector mes */}
      <div className="flex items-center gap-3">
        <button onClick={mesAnterior}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          style={{ border: '1px solid #e2e8f0' }}>
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="font-bold text-gray-900 text-lg min-w-[160px] text-center">
          {MESES[filtroMes - 1]} {filtroAño}
        </span>
        <button onClick={mesSiguiente}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          style={{ border: '1px solid #e2e8f0' }}>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        {lecturasMes.length === 0 ? (
          <div className="text-center py-16">
            <Gauge className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-3">Sin lecturas para {MESES[filtroMes - 1]} {filtroAño}</p>
            <button onClick={() => { setForm(FORM_EMPTY); setErrores({}); setModalCrear(true) }}
              className="text-sm font-semibold hover:opacity-80" style={{ color: '#2563ae' }}>
              + Agregar primera lectura
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Servicio','Unidad','Lect. Ini','Lect. Fin','Consumo m³','% Total','Total $',''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lecturasMes.map((l, i) => {
                const unidad = unidades.find(u => u.id === l.unidadId)
                return (
                  <tr key={l.id}
                    style={{ borderBottom: i < lecturasMes.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{l.servicio}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {unidad ? `Unidad ${unidad.numero}` : <span className="text-blue-600 font-medium">Comunitario</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{l.lecturaInicial ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{l.lecturaFinal ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{l.consumoM3 != null ? `${l.consumoM3} m³` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{l.porcentajeConsumo != null ? `${l.porcentajeConsumo}%` : '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{l.total != null ? formatCLP(l.total) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => abrirEditar(l)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => setEliminarId(l.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear */}
      <Modal abierto={modalCrear} onCerrar={() => setModalCrear(false)} titulo="Nueva lectura">
        <FormLectura f={form} setF={setForm} errs={errores}
          onOk={handleCrear} onCancel={() => setModalCrear(false)} label="Registrar" />
      </Modal>

      {/* Modal editar */}
      <Modal abierto={!!editandoId} onCerrar={() => setEditandoId(null)} titulo="Editar lectura">
        <FormLectura f={formEdit} setF={setFormEdit} errs={erroresEdit}
          onOk={handleEditar} onCancel={() => setEditandoId(null)} label="Guardar" />
      </Modal>

      {/* Modal eliminar */}
      <Modal abierto={!!eliminarId} onCerrar={() => setEliminarId(null)} titulo="Eliminar lectura" colorAccento="#dc2626">
        <p className="text-sm text-gray-600 mb-5">
          ¿Eliminar lectura de <strong>{lecturaPorEliminar?.servicio}</strong>
          {lecturaPorEliminar?.unidadId
            ? ` — ${unidades.find(u => u.id === lecturaPorEliminar.unidadId)?.numero ?? '?'}`
            : ' (comunitario)'}?
        </p>
        <div className="flex gap-3">
          <button onClick={() => setEliminarId(null)}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-slate-50"
            style={{ borderColor: '#e2e8f0' }}>Cancelar</button>
          <button onClick={handleEliminar}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
            style={{ background: '#dc2626' }}>Eliminar</button>
        </div>
      </Modal>
    </div>
  )
}
