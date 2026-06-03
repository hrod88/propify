'use client'

/**
 * BodegasView.tsx — Gestión de bodegas del edificio
 * CRUD completo: asignación a unidades, estados, precios.
 */

import { useState, useMemo } from 'react'
import {
  Plus, Search, Warehouse, Edit2, Trash2, X,
  CheckCircle2, AlertCircle, Wrench, Filter,
} from 'lucide-react'
import Modal from '@/components/modal'
import { supabase } from '@/lib/supabase'
import { formatCLP } from '@/lib/format'
import type { Bodega, EstadoBodega, Unidad } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
const estadoCfg: Record<EstadoBodega, { label: string; bg: string; color: string; Icon: React.ElementType }> = {
  disponible:     { label: 'Disponible',     bg: '#dcfce7', color: '#16a34a', Icon: CheckCircle2 },
  ocupado:        { label: 'Ocupado',        bg: '#dbeafe', color: '#2563ae', Icon: Warehouse    },
  'en_mantención':{ label: 'En mantención', bg: '#fef3c7', color: '#d97706', Icon: Wrench       },
}

interface Props {
  bodegas:        Bodega[]
  unidades:       Unidad[]
  edificioNombre: string
  edificioId:     string
}

const EMPTY: Omit<Bodega, 'id' | 'creadoEn'> = {
  edificioId:    '',
  numero:        '',
  piso:          null,
  superficieM2:  null,
  estado:        'disponible',
  propietarioId: null,
  unidadId:      null,
  precio:        null,
  nota:          null,
}

export default function BodegasView({ bodegas: inicial, unidades, edificioNombre, edificioId }: Props) {
  const [bodegas, setBodegas]     = useState<Bodega[]>(inicial)
  const [search, setSearch]       = useState('')
  const [filtroEstado, setFiltro] = useState<EstadoBodega | 'todos'>('todos')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<Bodega | null>(null)
  const [form, setForm]           = useState<Omit<Bodega, 'id' | 'creadoEn'>>(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<string | null>(null)

  // ─── KPIs ──────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    total:       bodegas.length,
    disponibles: bodegas.filter(b => b.estado === 'disponible').length,
    ocupadas:    bodegas.filter(b => b.estado === 'ocupado').length,
    mantencion:  bodegas.filter(b => b.estado === 'en_mantención').length,
  }), [bodegas])

  // ─── Filtros ───────────────────────────────────────────────
  const filtradas = useMemo(() =>
    bodegas.filter(b => {
      const matchSearch = b.numero.toLowerCase().includes(search.toLowerCase()) ||
        (b.nota ?? '').toLowerCase().includes(search.toLowerCase())
      const matchEstado = filtroEstado === 'todos' || b.estado === filtroEstado
      return matchSearch && matchEstado
    }), [bodegas, search, filtroEstado])

  // ─── Helpers ───────────────────────────────────────────────
  function openNew() {
    setEditando(null)
    setForm({ ...EMPTY, edificioId })
    setShowModal(true)
  }
  function openEdit(b: Bodega) {
    setEditando(b)
    setForm({ edificioId: b.edificioId, numero: b.numero, piso: b.piso, superficieM2: b.superficieM2,
      estado: b.estado, propietarioId: b.propietarioId, unidadId: b.unidadId, precio: b.precio, nota: b.nota })
    setShowModal(true)
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.numero.trim()) return
    setSaving(true)
    const payload = { ...form, edificioId }

    if (editando) {
      const { data } = await supabase.from('bodegas').update(payload).eq('id', editando.id).select().single()
      if (data) setBodegas(prev => prev.map(b => b.id === editando.id ? data as Bodega : b))
    } else {
      const { data } = await supabase.from('bodegas').insert(payload).select().single()
      if (data) setBodegas(prev => [data as Bodega, ...prev])
    }
    setSaving(false)
    setShowModal(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta bodega?')) return
    setDeleting(id)
    await supabase.from('bodegas').delete().eq('id', id)
    setBodegas(prev => prev.filter(b => b.id !== id))
    setDeleting(null)
  }

  const unidadLabel = (uid: string | null | undefined) =>
    uid ? (unidades.find(u => u.id === uid)?.numero ?? uid) : '—'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bodegas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{edificioNombre}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
          <Plus className="w-4 h-4" /> Nueva Bodega
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',        value: kpis.total,       color: '#1e3a5f', bg: '#eff6ff' },
          { label: 'Disponibles',  value: kpis.disponibles, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Ocupadas',     value: kpis.ocupadas,    color: '#2563ae', bg: '#dbeafe' },
          { label: 'Mantención',   value: kpis.mantencion,  color: '#d97706', bg: '#fef3c7' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número o nota..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {(['todos', 'disponible', 'ocupado', 'en_mantención'] as const).map(e => (
            <button key={e} onClick={() => setFiltro(e)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroEstado === e ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {e === 'todos' ? 'Todos' : estadoCfg[e].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="py-16 text-center">
            <Warehouse className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay bodegas registradas</p>
            <button onClick={openNew} className="mt-4 text-blue-600 text-sm hover:underline">
              + Agregar primera bodega
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['N°', 'Piso', 'Superficie', 'Estado', 'Unidad asignada', 'Precio', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.map(b => {
                const cfg = estadoCfg[b.estado]
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{b.numero}</td>
                    <td className="px-4 py-3 text-gray-600">{b.piso ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{b.superficieM2 ? `${b.superficieM2} m²` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <cfg.Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{unidadLabel(b.unidadId)}</td>
                    <td className="px-4 py-3 text-gray-600">{b.precio ? formatCLP(b.precio) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(b)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ── Modal ── */}
      <Modal abierto={showModal} onCerrar={() => setShowModal(false)}
        titulo={editando ? 'Editar Bodega' : 'Nueva Bodega'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Bodega *</label>
              <input required value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))}
                placeholder="B-01"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
              <input type="number" value={form.piso ?? ''} onChange={e => setForm(p => ({ ...p, piso: e.target.value ? +e.target.value : null }))}
                placeholder="1"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Superficie (m²)</label>
              <input type="number" step="0.1" value={form.superficieM2 ?? ''} onChange={e => setForm(p => ({ ...p, superficieM2: e.target.value ? +e.target.value : null }))}
                placeholder="6.5"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio mensual</label>
              <input type="number" value={form.precio ?? ''} onChange={e => setForm(p => ({ ...p, precio: e.target.value ? +e.target.value : null }))}
                placeholder="30000"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value as EstadoBodega }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="disponible">Disponible</option>
                <option value="ocupado">Ocupado</option>
                <option value="en_mantención">En mantención</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad asignada</label>
              <select value={form.unidadId ?? ''} onChange={e => setForm(p => ({ ...p, unidadId: e.target.value || null }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="">Sin asignar</option>
                {unidades.map(u => <option key={u.id} value={u.id}>Depto {u.numero}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
            <textarea value={form.nota ?? ''} onChange={e => setForm(p => ({ ...p, nota: e.target.value || null }))}
              rows={2} placeholder="Observaciones..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear Bodega'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
