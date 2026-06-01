'use client'

import { useState, useMemo, useCallback } from 'react'
import { Plus, Pencil, Trash2, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCLP } from '@/lib/format'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Modal from '@/components/modal'
import type { FondoComunidad } from '@/types'

// ─── Constantes ───────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const FONDOS_SUGERIDOS = [
  'Fondo de reserva',
  'Fondo Mudanza y Uso sala Multiuso',
  'Fondo Cobro sobre tiempo Estacionamientos',
  'Fondo Mantención',
  'Fondo Emergencias',
]

// ─── Props & Form ─────────────────────────────────────────────
interface Props {
  fondos:         FondoComunidad[]
  edificioId:     string
  edificioNombre: string
}

interface FormState {
  nombre:      string
  cobrado:     string
  ingresos:    string
  egresos:     string
  saldoActual: string
  nota:        string
}

const FORM_EMPTY: FormState = {
  nombre: '', cobrado: '0', ingresos: '0', egresos: '0', saldoActual: '0', nota: '',
}

type FormErrors = Partial<Record<keyof FormState, string>>

// ─── Componente ───────────────────────────────────────────────
export default function FondosView({ fondos: initial, edificioId }: Props) {
  const [lista,  setLista]  = useState<FondoComunidad[]>(initial)
  const [toast,  setToast]  = useState<string | null>(null)

  const hoy = new Date()
  const [filtroMes, setFiltroMes] = useState(hoy.getUTCMonth() + 1)
  const [filtroAño, setFiltroAño] = useState(hoy.getUTCFullYear())

  const [modalCrear,  setModalCrear]  = useState(false)
  const [form,        setForm]        = useState<FormState>(FORM_EMPTY)
  const [errores,     setErrores]     = useState<FormErrors>({})

  const [editandoId,  setEditandoId]  = useState<string | null>(null)
  const [formEdit,    setFormEdit]    = useState<FormState>(FORM_EMPTY)
  const [erroresEdit, setErroresEdit] = useState<FormErrors>({})

  const [eliminarId,  setEliminarId]  = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fondosMes = useMemo(
    () => lista.filter(f => f.mes === filtroMes && f.año === filtroAño),
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
    if (!f.nombre.trim()) e.nombre = 'Ingresa el nombre del fondo'
    return e
  }

  function buildPayload(f: FormState, mes: number, año: number): Omit<FondoComunidad, 'id' | 'creadoEn'> {
    return {
      edificioId,
      mes,
      año,
      nombre:      f.nombre.trim(),
      cobrado:     Number(f.cobrado)     || 0,
      ingresos:    Number(f.ingresos)    || 0,
      egresos:     Number(f.egresos)     || 0,
      saldoActual: Number(f.saldoActual) || 0,
      nota:        f.nota || null,
    }
  }

  const handleCrear = useCallback(() => {
    const e = validar(form)
    setErrores(e)
    if (Object.keys(e).length) return
    const id     = crypto.randomUUID()
    const nuevo  = { ...buildPayload(form, filtroMes, filtroAño), id, creadoEn: new Date().toISOString() } as FondoComunidad
    setLista(prev => [nuevo, ...prev])
    setModalCrear(false); setForm(FORM_EMPTY)
    showToast('Fondo registrado')
    supabaseBrowser.from('fondos_comunidad').insert(nuevo)
      .then(({ error }) => { if (error) console.warn('[Fondos] insert:', error.message) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, filtroMes, filtroAño, edificioId])

  const abrirEditar = useCallback((f: FondoComunidad) => {
    setEditandoId(f.id)
    setFormEdit({
      nombre:      f.nombre,
      cobrado:     String(f.cobrado),
      ingresos:    String(f.ingresos),
      egresos:     String(f.egresos),
      saldoActual: String(f.saldoActual),
      nota:        f.nota ?? '',
    })
    setErroresEdit({})
  }, [])

  const handleEditar = useCallback(() => {
    if (!editandoId) return
    const e = validar(formEdit)
    setErroresEdit(e)
    if (Object.keys(e).length) return
    const cambios = buildPayload(formEdit, filtroMes, filtroAño)
    setLista(prev => prev.map(f => f.id === editandoId ? { ...f, ...cambios } : f))
    const id = editandoId; setEditandoId(null)
    showToast('Fondo actualizado')
    supabaseBrowser.from('fondos_comunidad').update(cambios).eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Fondos] update:', error.message) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editandoId, formEdit, filtroMes, filtroAño, edificioId])

  const handleEliminar = useCallback(() => {
    if (!eliminarId) return
    setLista(prev => prev.filter(f => f.id !== eliminarId))
    const id = eliminarId; setEliminarId(null)
    showToast('Fondo eliminado')
    supabaseBrowser.from('fondos_comunidad').delete().eq('id', id)
      .then(({ error }) => { if (error) console.warn('[Fondos] delete:', error.message) })
  }, [eliminarId])

  function FormFondo({ f, setF, errs, onOk, onCancel, label }: {
    f: FormState; setF: React.Dispatch<React.SetStateAction<FormState>>
    errs: FormErrors; onOk: () => void; onCancel: () => void; label: string
  }) {
    const u = (k: keyof FormState) => upd(k, setF)
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nombre del fondo *</label>
          <input list="fondos-sugeridos" value={f.nombre} onChange={u('nombre')}
            placeholder="ej: Fondo de reserva"
            className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
            style={{ borderColor: errs.nombre ? '#dc2626' : '#e2e8f0' }} suppressHydrationWarning />
          <datalist id="fondos-sugeridos">
            {FONDOS_SUGERIDOS.map(s => <option key={s} value={s} />)}
          </datalist>
          {errs.nombre && <p className="text-xs text-red-500 mt-1">{errs.nombre}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['cobrado','ingresos','egresos','saldoActual'] as const).map(k => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                {k === 'cobrado' ? 'Cobrado ($)' : k === 'ingresos' ? 'Ingresos ($)' : k === 'egresos' ? 'Egresos ($)' : 'Saldo actual ($)'}
              </label>
              <input type="number" value={f[k]} onChange={u(k)}
                placeholder="0"
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                style={{ borderColor: '#e2e8f0' }} suppressHydrationWarning />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nota</label>
          <textarea value={f.nota} onChange={u('nota')} rows={2}
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

  const fondoPorEliminar = lista.find(f => f.id === eliminarId)

  return (
    <div className="space-y-5 animate-fade-in">

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl animate-fade-in"
          style={{ background: '#1e3a5f' }}>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fondos Comunidad</h1>
          <p className="text-gray-500 mt-1 text-sm">Registra el estado de los fondos del edificio por período</p>
        </div>
        <button onClick={() => { setForm(FORM_EMPTY); setErrores({}); setModalCrear(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}>
          <Plus className="w-4 h-4" /> Nuevo fondo
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
        {fondosMes.length === 0 ? (
          <div className="text-center py-16">
            <PiggyBank className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm mb-3">Sin fondos para {MESES[filtroMes - 1]} {filtroAño}</p>
            <button onClick={() => { setForm(FORM_EMPTY); setErrores({}); setModalCrear(true) }}
              className="text-sm font-semibold hover:opacity-80" style={{ color: '#2563ae' }}>
              + Agregar primer fondo
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Fondo','Cobrado','Ingresos','Egresos','Saldo actual',''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fondosMes.map((f, i) => {
                const saldoColor = f.saldoActual < 0 ? '#dc2626' : f.saldoActual === 0 ? '#6b7280' : '#16a34a'
                return (
                  <tr key={f.id}
                    style={{ borderBottom: i < fondosMes.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{f.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatCLP(f.cobrado)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatCLP(f.ingresos)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatCLP(f.egresos)}</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: saldoColor }}>{formatCLP(f.saldoActual)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => abrirEditar(f)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button onClick={() => setEliminarId(f.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
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

      <Modal abierto={modalCrear} onCerrar={() => setModalCrear(false)} titulo="Nuevo fondo">
        <FormFondo f={form} setF={setForm} errs={errores}
          onOk={handleCrear} onCancel={() => setModalCrear(false)} label="Registrar" />
      </Modal>

      <Modal abierto={!!editandoId} onCerrar={() => setEditandoId(null)} titulo="Editar fondo">
        <FormFondo f={formEdit} setF={setFormEdit} errs={erroresEdit}
          onOk={handleEditar} onCancel={() => setEditandoId(null)} label="Guardar" />
      </Modal>

      <Modal abierto={!!eliminarId} onCerrar={() => setEliminarId(null)} titulo="Eliminar fondo" colorAccento="#dc2626">
        <p className="text-sm text-gray-600 mb-5">
          ¿Eliminar el fondo <strong>{fondoPorEliminar?.nombre}</strong>?
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
