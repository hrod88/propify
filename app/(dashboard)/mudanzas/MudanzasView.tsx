'use client'

/**
 * MudanzasView.tsx — Reservas de Mudanza / Uso de ascensor
 * Residentes reservan slot horario, admin aprueba o rechaza.
 */

import { useState, useMemo } from 'react'
import {
  Plus, Truck, Clock, CheckCircle2, XCircle,
  AlertCircle, Calendar, User, Edit2, Trash2,
} from 'lucide-react'
import Modal from '@/components/modal'
import { supabase } from '@/lib/supabase'
import type { ReservaMudanza, TipoMudanza, EstadoMudanza, Unidad } from '@/types'

const estadoCfg: Record<EstadoMudanza, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  pendiente: { label: 'Pendiente', color: '#d97706', bg: '#fef3c7', Icon: AlertCircle  },
  aprobado:  { label: 'Aprobado',  color: '#16a34a', bg: '#dcfce7', Icon: CheckCircle2 },
  rechazado: { label: 'Rechazado', color: '#dc2626', bg: '#fee2e2', Icon: XCircle      },
}

interface Props {
  reservas:       ReservaMudanza[]
  unidades:       Unidad[]
  edificioNombre: string
  edificioId:     string
}

const EMPTY: Omit<ReservaMudanza,'id'|'creadoEn'> = {
  edificioId: '', unidadId: null, solicitanteNombre: '', solicitanteEmail: null,
  tipo: 'entrada', fecha: '', horaInicio: '09:00', horaFin: '11:00',
  ascensor: true, nota: null, estado: 'pendiente', aprobadoEn: null,
}

export default function MudanzasView({ reservas: inicial, unidades, edificioNombre, edificioId }: Props) {
  const [reservas, setReservas]   = useState<ReservaMudanza[]>(inicial)
  const [filtro, setFiltro]       = useState<EstadoMudanza | 'todas'>('todas')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<ReservaMudanza | null>(null)
  const [form, setForm]           = useState<Omit<ReservaMudanza,'id'|'creadoEn'>>(EMPTY)
  const [saving, setSaving]       = useState(false)

  const filtradas = useMemo(() =>
    reservas.filter(r => filtro === 'todas' || r.estado === filtro)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  , [reservas, filtro])

  const pendientes = reservas.filter(r => r.estado === 'pendiente').length

  function openNew() {
    setEditando(null); setForm({ ...EMPTY, edificioId }); setShowModal(true)
  }
  function openEdit(r: ReservaMudanza) {
    setEditando(r)
    setForm({ edificioId: r.edificioId, unidadId: r.unidadId, solicitanteNombre: r.solicitanteNombre,
      solicitanteEmail: r.solicitanteEmail, tipo: r.tipo, fecha: r.fecha, horaInicio: r.horaInicio,
      horaFin: r.horaFin, ascensor: r.ascensor, nota: r.nota, estado: r.estado, aprobadoEn: r.aprobadoEn })
    setShowModal(true)
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.solicitanteNombre.trim() || !form.fecha) return
    setSaving(true)
    if (editando) {
      const { data } = await supabase.from('reservas_mudanza').update(form).eq('id', editando.id).select().single()
      if (data) setReservas(p => p.map(r => r.id === editando.id ? data as ReservaMudanza : r))
    } else {
      const { data } = await supabase.from('reservas_mudanza').insert(form).select().single()
      if (data) setReservas(p => [data as ReservaMudanza, ...p])
    }
    setSaving(false); setShowModal(false)
  }

  async function cambiarEstado(id: string, estado: EstadoMudanza) {
    const extra = estado === 'aprobado' ? { aprobadoEn: new Date().toISOString() } : {}
    const { data } = await supabase.from('reservas_mudanza').update({ estado, ...extra }).eq('id', id).select().single()
    if (data) setReservas(p => p.map(r => r.id === id ? data as ReservaMudanza : r))
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar reserva?')) return
    await supabase.from('reservas_mudanza').delete().eq('id', id)
    setReservas(p => p.filter(r => r.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" /> Mudanzas
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{edificioNombre} · Reservas de ascensor y horarios</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
          <Plus className="w-4 h-4" /> Nueva Reserva
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-4">
        {([['pendiente','Por aprobar'],['aprobado','Aprobadas'],['rechazado','Rechazadas']] as const).map(([e, l]) => (
          <div key={e} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium">{l}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: estadoCfg[e].color }}>
              {reservas.filter(r => r.estado === e).length}
            </p>
            {e === 'pendiente' && pendientes > 0 && (
              <p className="text-xs text-amber-600 mt-1">Requieren tu atención</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-2">
        {(['todas','pendiente','aprobado','rechazado'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'todas' ? 'Todas' : estadoCfg[f].label}
            {f === 'pendiente' && pendientes > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-xs">{pendientes}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Lista ── */}
      {filtradas.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
          <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay reservas de mudanza</p>
          <button onClick={openNew} className="mt-4 text-blue-600 text-sm hover:underline">+ Registrar mudanza</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(r => {
            const cfg = estadoCfg[r.estado]
            const unidad = unidades.find(u => u.id === r.unidadId)
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: r.tipo === 'entrada' ? '#dbeafe' : '#fef3c7' }}>
                  <Truck className="w-5 h-5" style={{ color: r.tipo === 'entrada' ? '#2563ae' : '#d97706' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">{r.solicitanteNombre}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.tipo === 'entrada' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {r.tipo === 'entrada' ? '↓ Entrada' : '↑ Salida'}
                    </span>
                    {r.ascensor && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Ascensor</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(r.fecha).toLocaleDateString('es-CL')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.horaInicio} – {r.horaFin}</span>
                    {unidad && <span className="flex items-center gap-1"><User className="w-3 h-3" /> Depto {unidad.numero}</span>}
                  </div>
                  {r.nota && <p className="text-xs text-gray-400 mt-1">{r.nota}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <cfg.Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                  {r.estado === 'pendiente' && (
                    <>
                      <button onClick={() => cambiarEstado(r.id, 'aprobado')}
                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Aprobar">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => cambiarEstado(r.id, 'rechazado')}
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Rechazar">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => eliminar(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal ── */}
      <Modal abierto={showModal} onCerrar={() => setShowModal(false)} titulo={editando ? 'Editar Reserva' : 'Nueva Reserva de Mudanza'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante *</label>
              <input required value={form.solicitanteNombre} onChange={e => setForm(p => ({ ...p, solicitanteNombre: e.target.value }))}
                placeholder="Pedro González"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as TipoMudanza }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select value={form.unidadId ?? ''} onChange={e => setForm(p => ({ ...p, unidadId: e.target.value || null }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="">Sin especificar</option>
                {unidades.map(u => <option key={u.id} value={u.id}>Depto {u.numero}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input required type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input type="time" value={form.horaInicio} onChange={e => setForm(p => ({ ...p, horaInicio: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input type="time" value={form.horaFin} onChange={e => setForm(p => ({ ...p, horaFin: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ascensor" checked={form.ascensor} onChange={e => setForm(p => ({ ...p, ascensor: e.target.checked }))} className="rounded" />
            <label htmlFor="ascensor" className="text-sm text-gray-700">Requiere uso exclusivo del ascensor</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
            <textarea rows={2} value={form.nota ?? ''} onChange={e => setForm(p => ({ ...p, nota: e.target.value || null }))}
              placeholder="Observaciones adicionales..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {saving ? 'Guardando...' : editando ? 'Guardar' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
