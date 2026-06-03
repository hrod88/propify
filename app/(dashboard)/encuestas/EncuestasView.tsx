'use client'

/**
 * EncuestasView.tsx — Encuestas comunitarias
 * Admin crea, residentes votan. Resultados en tiempo real con barras.
 */

import { useState, useMemo } from 'react'
import {
  Plus, BarChart2, CheckCircle2, Clock, Archive,
  Trash2, Edit2, X, ChevronRight, Users,
} from 'lucide-react'
import Modal from '@/components/modal'
import { supabase } from '@/lib/supabase'
import type { Encuesta, EstadoEncuesta, EncuestaOpcion } from '@/types'

const estadoCfg: Record<EstadoEncuesta, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  borrador: { label: 'Borrador', color: '#64748b', bg: '#f1f5f9', Icon: Edit2        },
  activa:   { label: 'Activa',   color: '#16a34a', bg: '#dcfce7', Icon: CheckCircle2 },
  cerrada:  { label: 'Cerrada',  color: '#d97706', bg: '#fef3c7', Icon: Archive      },
}

interface Props {
  encuestas:      Encuesta[]
  edificioNombre: string
  edificioId:     string
}

export default function EncuestasView({ encuestas: inicial, edificioNombre, edificioId }: Props) {
  const [encuestas, setEncuestas] = useState<Encuesta[]>(inicial)
  const [filtro, setFiltro]       = useState<EstadoEncuesta | 'todas'>('todas')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<Encuesta | null>(null)
  const [saving, setSaving]       = useState(false)
  const [voting, setVoting]       = useState<string | null>(null)

  // Form state
  const [pregunta,    setPregunta]    = useState('')
  const [descripcion, setDesc]        = useState('')
  const [opciones,    setOpciones]    = useState<string[]>(['', ''])
  const [multiple,    setMultiple]    = useState(false)
  const [anonima,     setAnonima]     = useState(true)
  const [cierreEn,    setCierre]      = useState('')

  const filtradas = useMemo(() =>
    encuestas.filter(e => filtro === 'todas' || e.estado === filtro)
  , [encuestas, filtro])

  function openNew() {
    setEditando(null); setPregunta(''); setDesc(''); setOpciones(['', ''])
    setMultiple(false); setAnonima(true); setCierre('')
    setShowModal(true)
  }
  function openEdit(e: Encuesta) {
    setEditando(e); setPregunta(e.pregunta); setDesc(e.descripcion ?? '')
    setOpciones((e.opciones ?? []).map(o => o.texto).concat(['', '']))
    setMultiple(e.multiple); setAnonima(e.anonima); setCierre(e.cierreEn ?? '')
    setShowModal(true)
  }

  async function handleSave(ev: React.SyntheticEvent<HTMLFormElement>) {
    ev.preventDefault()
    const optsLimpias = opciones.filter(o => o.trim())
    if (!pregunta.trim() || optsLimpias.length < 2) return
    setSaving(true)

    const payload = { edificioId, pregunta: pregunta.trim(), descripcion: descripcion || null,
      estado: 'activa' as EstadoEncuesta, multiple, anonima, cierreEn: cierreEn || null }

    if (editando) {
      const { data } = await supabase.from('encuestas').update(payload).eq('id', editando.id).select().single()
      if (data) setEncuestas(p => p.map(e => e.id === editando.id ? { ...data as Encuesta, opciones: editando.opciones } : e))
    } else {
      const { data } = await supabase.from('encuestas').insert(payload).select().single()
      if (data) {
        const enc = data as Encuesta
        const optsPayload = optsLimpias.map((texto, i) => ({ encuestaId: enc.id, texto, orden: i, votos: 0 }))
        const { data: opts } = await supabase.from('encuesta_opciones').insert(optsPayload).select()
        setEncuestas(p => [{ ...enc, opciones: (opts ?? []) as EncuestaOpcion[] }, ...p])
      }
    }
    setSaving(false); setShowModal(false)
  }

  async function cambiarEstado(id: string, estado: EstadoEncuesta) {
    await supabase.from('encuestas').update({ estado }).eq('id', id)
    setEncuestas(p => p.map(e => e.id === id ? { ...e, estado } : e))
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar encuesta?')) return
    await supabase.from('encuestas').delete().eq('id', id)
    setEncuestas(p => p.filter(e => e.id !== id))
  }

  async function votar(encuestaId: string, opcionId: string) {
    setVoting(opcionId)
    // Incremento optimista: buscar votos actuales y sumar 1
    const votosActuales = (encuestas.find(e => e.id === encuestaId)?.opciones ?? [])
      .find(o => o.id === opcionId)?.votos ?? 0
    const { data } = await supabase.from('encuesta_opciones')
      .update({ votos: votosActuales + 1 })
      .eq('id', opcionId).select().single()
    if (data) {
      setEncuestas(prev => prev.map(e => e.id === encuestaId
        ? { ...e, opciones: (e.opciones ?? []).map(o => o.id === opcionId ? data as EncuestaOpcion : o) }
        : e))
    }
    setVoting(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encuestas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{edificioNombre}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
          <Plus className="w-4 h-4" /> Nueva Encuesta
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-4">
        {([['activa','Activas'],['borrador','Borradores'],['cerrada','Cerradas']] as const).map(([e, l]) => (
          <div key={e} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: estadoCfg[e].color }}>
              {encuestas.filter(x => x.estado === e).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{l}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="flex gap-2">
        {(['todas','activa','borrador','cerrada'] as const).map(f => (
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
          <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay encuestas</p>
          <button onClick={openNew} className="mt-4 text-blue-600 text-sm hover:underline">+ Crear primera encuesta</button>
        </div>
      ) : filtradas.map(enc => {
        const cfg         = estadoCfg[enc.estado]
        const totalVotos  = (enc.opciones ?? []).reduce((s, o) => s + o.votos, 0)
        return (
          <div key={enc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <cfg.Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                  {enc.anonima && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Anónima</span>}
                  {enc.multiple && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Múltiple</span>}
                </div>
                <h3 className="font-semibold text-gray-900">{enc.pregunta}</h3>
                {enc.descripcion && <p className="text-sm text-gray-500 mt-1">{enc.descripcion}</p>}
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {totalVotos} votos totales
                  {enc.cierreEn && <span> · Cierra {new Date(enc.cierreEn).toLocaleDateString('es-CL')}</span>}
                </p>
              </div>
              <div className="flex gap-1 ml-3">
                {enc.estado === 'activa' && (
                  <button onClick={() => cambiarEstado(enc.id, 'cerrada')}
                    className="p-1.5 rounded-lg text-xs text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Cerrar">
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                {enc.estado === 'borrador' && (
                  <button onClick={() => cambiarEstado(enc.id, 'activa')}
                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Activar">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => openEdit(enc)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => eliminar(enc.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Opciones con barras */}
            <div className="space-y-2">
              {(enc.opciones ?? []).sort((a, b) => a.orden - b.orden).map(op => {
                const pct = totalVotos > 0 ? Math.round(op.votos / totalVotos * 100) : 0
                return (
                  <div key={op.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{op.texto}</span>
                      <span className="text-xs font-semibold text-gray-500">{op.votos} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#2563ae,#3b82f6)' }} />
                    </div>
                    {enc.estado === 'activa' && (
                      <button onClick={() => votar(enc.id, op.id)} disabled={voting === op.id}
                        className="text-xs text-blue-600 hover:underline mt-1 disabled:opacity-50">
                        Votar por esta opción
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* ── Modal nueva encuesta ── */}
      <Modal abierto={showModal} onCerrar={() => setShowModal(false)} titulo={editando ? 'Editar Encuesta' : 'Nueva Encuesta'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pregunta *</label>
            <input required value={pregunta} onChange={e => setPregunta(e.target.value)}
              placeholder="¿Cuándo prefieren la asamblea anual?"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea rows={2} value={descripcion} onChange={e => setDesc(e.target.value)}
              placeholder="Contexto adicional..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opciones (mínimo 2) *</label>
            <div className="space-y-2">
              {opciones.map((op, i) => (
                <div key={i} className="flex gap-2">
                  <input value={op} onChange={e => setOpciones(p => p.map((v, j) => j === i ? e.target.value : v))}
                    placeholder={`Opción ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                  {opciones.length > 2 && (
                    <button type="button" onClick={() => setOpciones(p => p.filter((_, j) => j !== i))}
                      className="p-2 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setOpciones(p => [...p, ''])}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Agregar opción
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de cierre</label>
              <input type="date" value={cierreEn} onChange={e => setCierre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div className="space-y-2 flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={multiple} onChange={e => setMultiple(e.target.checked)} className="rounded" />
                Selección múltiple
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={anonima} onChange={e => setAnonima(e.target.checked)} className="rounded" />
                Votación anónima
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {saving ? 'Guardando...' : editando ? 'Guardar' : 'Crear Encuesta'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
