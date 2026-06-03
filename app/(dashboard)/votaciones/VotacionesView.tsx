'use client'

/**
 * VotacionesView.tsx — Votaciones Digitales
 * Asambleas digitales con quórum, conteo automático, resultado legal.
 */

import { useState, useMemo } from 'react'
import {
  Plus, Vote, CheckCircle2, XCircle, Clock,
  Users, TrendingUp, Shield, Edit2, Trash2,
  ThumbsUp, ThumbsDown, Minus, Trophy,
} from 'lucide-react'
import Modal from '@/components/modal'
import { supabase } from '@/lib/supabase'
import type { Votacion, TipoVotacion, EstadoVotacion, DecisionVoto } from '@/types'

const estadoCfg: Record<EstadoVotacion, { label: string; color: string; bg: string }> = {
  borrador: { label: 'Borrador', color: '#64748b', bg: '#f1f5f9' },
  abierta:  { label: '🟢 Abierta',color: '#16a34a', bg: '#dcfce7' },
  cerrada:  { label: 'Cerrada',  color: '#d97706', bg: '#fef3c7' },
  anulada:  { label: 'Anulada',  color: '#dc2626', bg: '#fee2e2' },
}
const decisionCfg: Record<DecisionVoto, { label: string; color: string; Icon: React.ElementType }> = {
  a_favor:    { label: 'A favor',    color: '#16a34a', Icon: ThumbsUp   },
  en_contra:  { label: 'En contra',  color: '#dc2626', Icon: ThumbsDown },
  abstencion: { label: 'Abstención', color: '#64748b', Icon: Minus      },
}

interface Props {
  votaciones:     Votacion[]
  totalUnidades:  number
  edificioNombre: string
  edificioId:     string
}

export default function VotacionesView({ votaciones: init, totalUnidades, edificioNombre, edificioId }: Props) {
  const [votaciones, setVotaciones] = useState<Votacion[]>(init)
  const [filtro, setFiltro]         = useState<EstadoVotacion | 'todas'>('todas')
  const [showModal, setShowModal]   = useState(false)
  const [editando, setEditando]     = useState<Votacion | null>(null)
  const [saving, setSaving]         = useState(false)
  const [votando, setVotando]       = useState<string | null>(null)

  const [form, setForm] = useState<Omit<Votacion,'id'|'creadoEn'|'totalVotos'|'votosAFavor'|'votosEnContra'|'votosAbstencion'|'resultado'>>({
    edificioId, titulo: '', descripcion: null, tipo: 'ordinaria',
    estado: 'borrador', quorumRequerido: 50,
    fechaInicio: new Date().toISOString().slice(0,16),
    fechaFin:    new Date(Date.now() + 7 * 86400000).toISOString().slice(0,16),
  })

  const filtradas = useMemo(() =>
    votaciones.filter(v => filtro === 'todas' || v.estado === filtro)
      .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime())
  , [votaciones, filtro])

  function openNew() {
    setEditando(null)
    setForm({ edificioId, titulo: '', descripcion: null, tipo: 'ordinaria', estado: 'borrador',
      quorumRequerido: 50, fechaInicio: new Date().toISOString().slice(0,16),
      fechaFin: new Date(Date.now() + 7 * 86400000).toISOString().slice(0,16) })
    setShowModal(true)
  }
  function openEdit(v: Votacion) {
    setEditando(v)
    setForm({ edificioId: v.edificioId, titulo: v.titulo, descripcion: v.descripcion, tipo: v.tipo,
      estado: v.estado, quorumRequerido: v.quorumRequerido,
      fechaInicio: v.fechaInicio.slice(0,16), fechaFin: v.fechaFin.slice(0,16) })
    setShowModal(true)
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.titulo.trim()) return
    setSaving(true)
    const payload = { ...form, edificioId }
    if (editando) {
      const { data } = await supabase.from('votaciones').update(payload).eq('id', editando.id).select().single()
      if (data) setVotaciones(p => p.map(v => v.id === editando.id ? data as Votacion : v))
    } else {
      const { data } = await supabase.from('votaciones').insert({
        ...payload, totalVotos: 0, votosAFavor: 0, votosEnContra: 0, votosAbstencion: 0, resultado: null,
      }).select().single()
      if (data) setVotaciones(p => [data as Votacion, ...p])
    }
    setSaving(false); setShowModal(false)
  }

  async function cambiarEstado(id: string, estado: EstadoVotacion) {
    const { data } = await supabase.from('votaciones').update({ estado }).eq('id', id).select().single()
    if (data) setVotaciones(p => p.map(v => v.id === id ? data as Votacion : v))
  }

  async function votar(votacionId: string, decision: DecisionVoto) {
    setVotando(votacionId + decision)
    const vot = votaciones.find(v => v.id === votacionId)
    if (!vot) return
    const update: Partial<Votacion> = {
      totalVotos: vot.totalVotos + 1,
      votosAFavor:     decision === 'a_favor'   ? vot.votosAFavor    + 1 : vot.votosAFavor,
      votosEnContra:   decision === 'en_contra'  ? vot.votosEnContra  + 1 : vot.votosEnContra,
      votosAbstencion: decision === 'abstencion' ? vot.votosAbstencion+ 1 : vot.votosAbstencion,
    }
    const quorumAlcanzado = ((update.totalVotos ?? 0) / totalUnidades * 100) >= vot.quorumRequerido
    const { data } = await supabase.from('votaciones').update(update).eq('id', votacionId).select().single()
    if (data) setVotaciones(p => p.map(v => v.id === votacionId ? data as Votacion : v))
    setVotando(null)
  }

  async function cerrarVotacion(vot: Votacion) {
    const quorumAlcanzado = (vot.totalVotos / totalUnidades * 100) >= vot.quorumRequerido
    let resultado: string
    if (!quorumAlcanzado) resultado = 'sin_quorum'
    else if (vot.votosAFavor > vot.votosEnContra) resultado = 'aprobado'
    else if (vot.votosEnContra > vot.votosAFavor) resultado = 'rechazado'
    else resultado = 'nulo'

    const { data } = await supabase.from('votaciones').update({ estado: 'cerrada', resultado }).eq('id', vot.id).select().single()
    if (data) setVotaciones(p => p.map(v => v.id === vot.id ? data as Votacion : v))
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar votación?')) return
    await supabase.from('votaciones').delete().eq('id', id)
    setVotaciones(p => p.filter(v => v.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Vote className="w-6 h-6 text-blue-600" /> Votaciones Digitales
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{edificioNombre} · {totalUnidades} unidades habilitadas</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
          <Plus className="w-4 h-4" /> Nueva Votación
        </button>
      </div>

      {/* ── Banner legal ── */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Cumple con la <strong>Ley N°21.442 de Copropiedad Inmobiliaria 2022</strong>.
          El quórum se calcula sobre el total de unidades del edificio. Los resultados quedan registrados.
        </p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',       val: votaciones.length,                                      color: '#1e3a5f' },
          { label: 'Abiertas',    val: votaciones.filter(v => v.estado === 'abierta').length,   color: '#16a34a' },
          { label: 'Cerradas',    val: votaciones.filter(v => v.estado === 'cerrada').length,   color: '#d97706' },
          { label: 'Aprobadas',   val: votaciones.filter(v => v.resultado === 'aprobado').length, color: '#7c3aed' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-2">
        {(['todas','abierta','borrador','cerrada','anulada'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'todas' ? 'Todas' : estadoCfg[f].label}
          </button>
        ))}
      </div>

      {/* ── Lista ── */}
      {filtradas.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
          <Vote className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay votaciones</p>
          <button onClick={openNew} className="mt-4 text-blue-600 text-sm hover:underline">+ Crear primera votación</button>
        </div>
      ) : filtradas.map(v => {
        const cfg = estadoCfg[v.estado]
        const quorumActual = totalUnidades > 0 ? (v.totalVotos / totalUnidades * 100) : 0
        const quorumOk     = quorumActual >= v.quorumRequerido

        return (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full capitalize">{v.tipo}</span>
                  {v.resultado && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      v.resultado === 'aprobado' ? 'bg-green-100 text-green-700' :
                      v.resultado === 'rechazado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      {v.resultado === 'aprobado' ? '✅ Aprobado' :
                       v.resultado === 'rechazado' ? '❌ Rechazado' :
                       v.resultado === 'sin_quorum' ? '⚠️ Sin quórum' : '🔄 Nulo'}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base">{v.titulo}</h3>
                {v.descripcion && <p className="text-sm text-gray-500 mt-1">{v.descripcion}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(v.fechaInicio).toLocaleDateString('es-CL')} → {new Date(v.fechaFin).toLocaleDateString('es-CL')}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {v.totalVotos} votos de {totalUnidades}</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Quórum: {v.quorumRequerido}%</span>
                </div>
              </div>
              <div className="flex gap-1 ml-3">
                {v.estado === 'borrador' && (
                  <button onClick={() => cambiarEstado(v.id, 'abierta')}
                    className="px-3 py-1.5 text-xs rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors font-medium">
                    Abrir
                  </button>
                )}
                {v.estado === 'abierta' && (
                  <button onClick={() => cerrarVotacion(v)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors font-medium">
                    Cerrar y contar
                  </button>
                )}
                <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => eliminar(v.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Barra de quórum */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Quórum ({quorumActual.toFixed(1)}% de {v.quorumRequerido}% requerido)</span>
                <span className={quorumOk ? 'text-green-600 font-semibold' : 'text-amber-600'}>{quorumOk ? '✅ Alcanzado' : '⚠️ No alcanzado'}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(quorumActual, 100)}%`, background: quorumOk ? '#16a34a' : '#d97706' }} />
              </div>
            </div>

            {/* Resultados */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {([
                ['a_favor',   v.votosAFavor,     '#16a34a', '#dcfce7'],
                ['en_contra', v.votosEnContra,    '#dc2626', '#fee2e2'],
                ['abstencion',v.votosAbstencion,  '#64748b', '#f1f5f9'],
              ] as const).map(([decision, votos, color, bg]) => {
                const pct = v.totalVotos > 0 ? Math.round(votos / v.totalVotos * 100) : 0
                const cfg = decisionCfg[decision]
                return (
                  <div key={decision} className="rounded-xl p-3 text-center" style={{ background: bg }}>
                    <cfg.Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                    <p className="text-xl font-bold" style={{ color }}>{votos}</p>
                    <p className="text-xs" style={{ color }}>{cfg.label} · {pct}%</p>
                  </div>
                )
              })}
            </div>

            {/* Botones de voto */}
            {v.estado === 'abierta' && (
              <div className="flex gap-3 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-500 self-center mr-auto">Registrar voto:</p>
                {([
                  ['a_favor',   'A favor',    '#16a34a', '#dcfce7'],
                  ['en_contra', 'En contra',  '#dc2626', '#fee2e2'],
                  ['abstencion','Abstención', '#64748b', '#f1f5f9'],
                ] as const).map(([decision, label, color, bg]) => (
                  <button key={decision} onClick={() => votar(v.id, decision)}
                    disabled={!!votando}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: bg, color }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Modal nueva votación ── */}
      <Modal abierto={showModal} onCerrar={() => setShowModal(false)} titulo={editando ? 'Editar Votación' : 'Nueva Votación'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input required value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              placeholder="Aprobación de presupuesto 2026"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea rows={2} value={form.descripcion ?? ''} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value || null }))}
              placeholder="Contexto de la votación..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as TipoVotacion }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="ordinaria">Ordinaria</option>
                <option value="extraordinaria">Extraordinaria</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quórum requerido: <span className="text-blue-600 font-bold">{form.quorumRequerido}%</span></label>
              <input type="range" min={10} max={100} step={5} value={form.quorumRequerido}
                onChange={e => setForm(p => ({ ...p, quorumRequerido: +e.target.value }))}
                className="w-full accent-blue-600 mt-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
              <input required type="datetime-local" value={form.fechaInicio} onChange={e => setForm(p => ({ ...p, fechaInicio: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cierre *</label>
              <input required type="datetime-local" value={form.fechaFin} onChange={e => setForm(p => ({ ...p, fechaFin: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {saving ? 'Guardando...' : editando ? 'Guardar' : 'Crear Votación'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
