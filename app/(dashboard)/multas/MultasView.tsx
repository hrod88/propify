'use client'

/**
 * MultasView.tsx — Multas y Sanciones
 * 2 tabs: Multas activas + Reglas configurables.
 */

import { useState, useMemo } from 'react'
import {
  Plus, AlertTriangle, CheckCircle2, Ban, Scale,
  Settings, Edit2, Trash2, DollarSign, Calendar,
  Home, FileText,
} from 'lucide-react'
import Modal from '@/components/modal'
import { supabase } from '@/lib/supabase'
import { formatCLP } from '@/lib/format'
import type { Multa, ReglaMulta, EstadoMulta, Unidad } from '@/types'

const estadoCfg: Record<EstadoMulta, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  pendiente: { label: 'Pendiente',  color: '#d97706', bg: '#fef3c7', Icon: AlertTriangle },
  pagada:    { label: 'Pagada',     color: '#16a34a', bg: '#dcfce7', Icon: CheckCircle2  },
  anulada:   { label: 'Anulada',    color: '#64748b', bg: '#f1f5f9', Icon: Ban           },
  apelando:  { label: 'En apelación', color: '#7c3aed', bg: '#ede9fe', Icon: Scale       },
}

interface Props {
  multas:         Multa[]
  reglas:         ReglaMulta[]
  unidades:       Unidad[]
  edificioNombre: string
  edificioId:     string
}

export default function MultasView({ multas: initM, reglas: initR, unidades, edificioNombre, edificioId }: Props) {
  const [tab, setTab]             = useState<'multas' | 'reglas'>('multas')
  const [multas, setMultas]       = useState<Multa[]>(initM)
  const [reglas, setReglas]       = useState<ReglaMulta[]>(initR)
  const [filtro, setFiltro]       = useState<EstadoMulta | 'todas'>('todas')
  const [showModal, setShowModal] = useState(false)
  const [modalTipo, setModalTipo] = useState<'multa' | 'regla'>('multa')
  const [editMulta, setEditMulta] = useState<Multa | null>(null)
  const [editRegla, setEditRegla] = useState<ReglaMulta | null>(null)
  const [saving, setSaving]       = useState(false)

  const [formM, setFormM] = useState<Omit<Multa,'id'|'creadoEn'>>({
    edificioId, unidadId: null, unidadNumero: null, reglaId: null,
    infractorNombre: null, motivo: '', monto: 0, estado: 'pendiente',
    fecha: new Date().toISOString().split('T')[0], pagadoEn: null, nota: null,
  })
  const [formR, setFormR] = useState<Omit<ReglaMulta,'id'|'creadoEn'>>({
    edificioId, nombre: '', descripcion: null, monto: 0, activa: true,
  })

  const filtradas = useMemo(() =>
    multas.filter(m => filtro === 'todas' || m.estado === filtro)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  , [multas, filtro])

  const totalPendiente = multas.filter(m => m.estado === 'pendiente').reduce((s, m) => s + m.monto, 0)

  function openNewMulta() {
    setEditMulta(null)
    setFormM({ edificioId, unidadId: null, unidadNumero: null, reglaId: null,
      infractorNombre: null, motivo: '', monto: 0, estado: 'pendiente',
      fecha: new Date().toISOString().split('T')[0], pagadoEn: null, nota: null })
    setModalTipo('multa'); setShowModal(true)
  }
  function openEditMulta(m: Multa) {
    setEditMulta(m)
    setFormM({ edificioId: m.edificioId, unidadId: m.unidadId, unidadNumero: m.unidadNumero,
      reglaId: m.reglaId, infractorNombre: m.infractorNombre, motivo: m.motivo,
      monto: m.monto, estado: m.estado, fecha: m.fecha, pagadoEn: m.pagadoEn, nota: m.nota })
    setModalTipo('multa'); setShowModal(true)
  }
  function openNewRegla() {
    setEditRegla(null)
    setFormR({ edificioId, nombre: '', descripcion: null, monto: 0, activa: true })
    setModalTipo('regla'); setShowModal(true)
  }
  function openEditRegla(r: ReglaMulta) {
    setEditRegla(r)
    setFormR({ edificioId: r.edificioId, nombre: r.nombre, descripcion: r.descripcion, monto: r.monto, activa: r.activa })
    setModalTipo('regla'); setShowModal(true)
  }

  function aplicarRegla(reglaId: string) {
    const regla = reglas.find(r => r.id === reglaId)
    if (regla) setFormM(p => ({ ...p, reglaId, motivo: regla.nombre, monto: regla.monto }))
  }

  async function saveMulta(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formM.motivo.trim()) return
    setSaving(true)
    const payload = { ...formM, edificioId }
    if (editMulta) {
      const { data } = await supabase.from('multas').update(payload).eq('id', editMulta.id).select().single()
      if (data) setMultas(p => p.map(x => x.id === editMulta.id ? data as Multa : x))
    } else {
      const { data } = await supabase.from('multas').insert(payload).select().single()
      if (data) setMultas(p => [data as Multa, ...p])
    }
    setSaving(false); setShowModal(false)
  }

  async function saveRegla(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formR.nombre.trim()) return
    setSaving(true)
    if (editRegla) {
      const { data } = await supabase.from('reglas_multa').update(formR).eq('id', editRegla.id).select().single()
      if (data) setReglas(p => p.map(x => x.id === editRegla.id ? data as ReglaMulta : x))
    } else {
      const { data } = await supabase.from('reglas_multa').insert(formR).select().single()
      if (data) setReglas(p => [...p, data as ReglaMulta])
    }
    setSaving(false); setShowModal(false)
  }

  async function cambiarEstado(id: string, estado: EstadoMulta) {
    const extra = estado === 'pagada' ? { pagadoEn: new Date().toISOString() } : {}
    const { data } = await supabase.from('multas').update({ estado, ...extra }).eq('id', id).select().single()
    if (data) setMultas(p => p.map(m => m.id === id ? data as Multa : m))
  }

  async function deleteMulta(id: string) {
    if (!confirm('¿Eliminar multa?')) return
    await supabase.from('multas').delete().eq('id', id)
    setMultas(p => p.filter(x => x.id !== id))
  }
  async function deleteRegla(id: string) {
    if (!confirm('¿Eliminar regla?')) return
    await supabase.from('reglas_multa').delete().eq('id', id)
    setReglas(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Multas y Sanciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">{edificioNombre}</p>
        </div>
        <button onClick={tab === 'multas' ? openNewMulta : openNewRegla}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
          <Plus className="w-4 h-4" />
          {tab === 'multas' ? 'Nueva Multa' : 'Nueva Regla'}
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',         val: multas.length,                                    color: '#1e3a5f' },
          { label: 'Pendientes',    val: multas.filter(m => m.estado === 'pendiente').length, color: '#d97706' },
          { label: 'Pagadas',       val: multas.filter(m => m.estado === 'pagada').length,  color: '#16a34a' },
          { label: 'Monto pendiente', val: formatCLP(totalPendiente),                        color: '#dc2626' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([['multas','Multas',AlertTriangle],['reglas','Reglas',Settings]] as const).map(([val, label, Icon]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab Multas ── */}
      {tab === 'multas' && (
        <>
          <div className="flex gap-2">
            {(['todas','pendiente','pagada','apelando','anulada'] as const).map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtro === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f === 'todas' ? 'Todas' : estadoCfg[f].label}
              </button>
            ))}
          </div>
          {filtradas.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
              <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay multas registradas</p>
              <button onClick={openNewMulta} className="mt-4 text-blue-600 text-sm hover:underline">+ Registrar primera multa</button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Fecha','Unidad','Infractor','Motivo','Monto','Estado',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtradas.map(m => {
                    const cfg = estadoCfg[m.estado]
                    return (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 text-xs">{new Date(m.fecha).toLocaleDateString('es-CL')}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{m.unidadNumero ? `Depto ${m.unidadNumero}` : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{m.infractorNombre ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{m.motivo}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatCLP(m.monto)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            <cfg.Icon className="w-3 h-3" /> {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {m.estado === 'pendiente' && (
                              <button onClick={() => cambiarEstado(m.id, 'pagada')}
                                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Marcar pagada">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => openEditMulta(m)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteMulta(m.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Tab Reglas ── */}
      {tab === 'reglas' && (
        <div className="space-y-3">
          {reglas.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
              <Settings className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay reglas configuradas</p>
              <button onClick={openNewRegla} className="mt-4 text-blue-600 text-sm hover:underline">+ Agregar primera regla</button>
            </div>
          ) : reglas.map(r => (
            <div key={r.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${r.activa ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{r.nombre}</p>
                  {!r.activa && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactiva</span>}
                </div>
                {r.descripcion && <p className="text-xs text-gray-500 mt-0.5">{r.descripcion}</p>}
              </div>
              <p className="font-bold text-red-600 text-sm">{formatCLP(r.monto)}</p>
              <div className="flex gap-1">
                <button onClick={() => openEditRegla(r)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => deleteRegla(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Multa ── */}
      <Modal abierto={showModal && modalTipo === 'multa'} onCerrar={() => setShowModal(false)} titulo={editMulta ? 'Editar Multa' : 'Nueva Multa'}>
        <form onSubmit={saveMulta} className="space-y-4">
          {reglas.filter(r => r.activa).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Aplicar regla predefinida</label>
              <div className="grid grid-cols-2 gap-2">
                {reglas.filter(r => r.activa).map(r => (
                  <button key={r.id} type="button" onClick={() => aplicarRegla(r.id)}
                    className={`text-left px-3 py-2 rounded-xl border text-xs transition-colors ${formM.reglaId === r.id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                    <p className="font-medium">{r.nombre}</p>
                    <p className="text-red-600 font-bold">{formatCLP(r.monto)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select value={formM.unidadId ?? ''} onChange={e => {
                const u = unidades.find(x => x.id === e.target.value)
                setFormM(p => ({ ...p, unidadId: e.target.value || null, unidadNumero: u?.numero ?? null }))
              }} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="">Sin especificar</option>
                {unidades.map(u => <option key={u.id} value={u.id}>Depto {u.numero}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input required type="date" value={formM.fecha} onChange={e => setFormM(p => ({ ...p, fecha: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <input required value={formM.motivo} onChange={e => setFormM(p => ({ ...p, motivo: e.target.value }))}
              placeholder="Ruidos molestos después de las 22hs"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input required type="number" value={formM.monto} onChange={e => setFormM(p => ({ ...p, monto: +e.target.value }))}
                  className="w-full pl-7 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Infractor</label>
              <input value={formM.infractorNombre ?? ''} onChange={e => setFormM(p => ({ ...p, infractorNombre: e.target.value || null }))}
                placeholder="Nombre del infractor"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {saving ? 'Guardando...' : editMulta ? 'Guardar' : 'Registrar Multa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Regla ── */}
      <Modal abierto={showModal && modalTipo === 'regla'} onCerrar={() => setShowModal(false)} titulo={editRegla ? 'Editar Regla' : 'Nueva Regla'}>
        <form onSubmit={saveRegla} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input required value={formR.nombre} onChange={e => setFormR(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Ruidos molestos fuera de horario"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea rows={2} value={formR.descripcion ?? ''} onChange={e => setFormR(p => ({ ...p, descripcion: e.target.value || null }))}
              placeholder="Detalle de la infracción..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto de la multa *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input required type="number" value={formR.monto} onChange={e => setFormR(p => ({ ...p, monto: +e.target.value }))}
                className="w-full pl-7 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={formR.activa} onChange={e => setFormR(p => ({ ...p, activa: e.target.checked }))} className="rounded" />
            Regla activa
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {saving ? 'Guardando...' : editRegla ? 'Guardar' : 'Crear Regla'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
