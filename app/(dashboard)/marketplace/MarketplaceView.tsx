'use client'

/**
 * MarketplaceView.tsx — Marketplace Vecinal
 * Compra/venta/regalo/busco entre residentes del edificio.
 */

import { useState, useMemo } from 'react'
import {
  Plus, ShoppingBag, Tag, Gift, Search, Edit2,
  Trash2, Phone, Mail, Home, CheckCircle2,
} from 'lucide-react'
import Modal from '@/components/modal'
import { supabase } from '@/lib/supabase'
import { formatCLP } from '@/lib/format'
import type { MarketplaceItem, TipoItem, EstadoItem } from '@/types'

const tipoCfg: Record<TipoItem, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  venta:   { label: 'Venta',   color: '#2563ae', bg: '#dbeafe', Icon: Tag       },
  arriendo:{ label: 'Arriendo',color: '#7c3aed', bg: '#ede9fe', Icon: Home      },
  regalo:  { label: 'Regalo',  color: '#16a34a', bg: '#dcfce7', Icon: Gift      },
  busco:   { label: 'Busco',   color: '#d97706', bg: '#fef3c7', Icon: Search    },
}
const estadoCfg: Record<EstadoItem, { label: string; color: string }> = {
  activo:  { label: 'Disponible', color: '#16a34a' },
  vendido: { label: 'Vendido',    color: '#64748b'  },
  pausado: { label: 'Pausado',    color: '#d97706'  },
}

interface Props {
  items:          MarketplaceItem[]
  edificioNombre: string
  edificioId:     string
}

const EMPTY: Omit<MarketplaceItem,'id'|'creadoEn'> = {
  edificioId: '', vendedorId: null, vendedorNombre: '', vendedorUnidad: null,
  titulo: '', descripcion: null, precio: null, tipo: 'venta',
  estado: 'activo', imagen: null, contacto: null,
}

export default function MarketplaceView({ items: inicial, edificioNombre, edificioId }: Props) {
  const [items, setItems]         = useState<MarketplaceItem[]>(inicial)
  const [filtroTipo, setFiltroT]  = useState<TipoItem | 'todos'>('todos')
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando]   = useState<MarketplaceItem | null>(null)
  const [form, setForm]           = useState<Omit<MarketplaceItem,'id'|'creadoEn'>>(EMPTY)
  const [saving, setSaving]       = useState(false)

  const filtrados = useMemo(() =>
    items.filter(i => {
      const matchT = filtroTipo === 'todos' || i.tipo === filtroTipo
      const matchS = i.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (i.descripcion ?? '').toLowerCase().includes(search.toLowerCase())
      return matchT && matchS
    })
  , [items, search, filtroTipo])

  function openNew() {
    setEditando(null); setForm({ ...EMPTY, edificioId }); setShowModal(true)
  }
  function openEdit(item: MarketplaceItem) {
    setEditando(item)
    setForm({ edificioId: item.edificioId, vendedorId: item.vendedorId, vendedorNombre: item.vendedorNombre,
      vendedorUnidad: item.vendedorUnidad, titulo: item.titulo, descripcion: item.descripcion,
      precio: item.precio, tipo: item.tipo, estado: item.estado, imagen: item.imagen, contacto: item.contacto })
    setShowModal(true)
  }

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.titulo.trim() || !form.vendedorNombre.trim()) return
    setSaving(true)
    if (editando) {
      const { data } = await supabase.from('marketplace_items').update(form).eq('id', editando.id).select().single()
      if (data) setItems(p => p.map(i => i.id === editando.id ? data as MarketplaceItem : i))
    } else {
      const { data } = await supabase.from('marketplace_items').insert(form).select().single()
      if (data) setItems(p => [data as MarketplaceItem, ...p])
    }
    setSaving(false); setShowModal(false)
  }

  async function cambiarEstado(id: string, estado: EstadoItem) {
    await supabase.from('marketplace_items').update({ estado }).eq('id', id)
    setItems(p => p.map(i => i.id === id ? { ...i, estado } : i))
  }

  async function eliminar(id: string) {
    if (!confirm('¿Eliminar publicación?')) return
    await supabase.from('marketplace_items').delete().eq('id', id)
    setItems(p => p.filter(i => i.id !== id))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace Vecinal</h1>
          <p className="text-gray-500 text-sm mt-0.5">{edificioNombre} · {items.filter(i => i.estado === 'activo').length} publicaciones activas</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
          <Plus className="w-4 h-4" /> Publicar
        </button>
      </div>

      {/* ── KPIs por tipo ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(tipoCfg) as [TipoItem, typeof tipoCfg[TipoItem]][]).map(([tipo, cfg]) => (
          <button key={tipo} onClick={() => setFiltroT(filtroTipo === tipo ? 'todos' : tipo)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              filtroTipo === tipo ? 'border-blue-300 ring-2 ring-blue-100 shadow-sm' : 'border-gray-100 bg-white hover:shadow-sm'}`}
            style={filtroTipo === tipo ? { background: cfg.bg } : {}}>
            <div className="flex items-center gap-2 mb-2">
              <cfg.Icon className="w-4 h-4" style={{ color: cfg.color }} />
              <span className="text-sm font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{items.filter(i => i.tipo === tipo && i.estado === 'activo').length}</p>
          </button>
        ))}
      </div>

      {/* ── Buscador ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en el marketplace..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
      </div>

      {/* ── Grid de items ── */}
      {filtrados.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay publicaciones</p>
          <button onClick={openNew} className="mt-4 text-blue-600 text-sm hover:underline">+ Crear primera publicación</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(item => {
            const cfg   = tipoCfg[item.tipo]
            const eCfg  = estadoCfg[item.estado]
            return (
              <div key={item.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${item.estado !== 'activo' ? 'opacity-60' : ''}`}>
                {/* Imagen placeholder */}
                <div className="h-36 flex items-center justify-center" style={{ background: cfg.bg }}>
                  <cfg.Icon className="w-12 h-12 opacity-30" style={{ color: cfg.color }} />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <cfg.Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                    <span className="text-xs font-medium" style={{ color: eCfg.color }}>{eCfg.label}</span>
                  </div>

                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{item.titulo}</h3>
                  {item.descripcion && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.descripcion}</p>}

                  {item.precio != null && item.tipo !== 'regalo' && item.tipo !== 'busco' && (
                    <p className="text-lg font-bold text-blue-700 mb-2">{formatCLP(item.precio)}</p>
                  )}
                  {item.tipo === 'regalo' && <p className="text-sm text-green-600 font-semibold mb-2">¡Gratis!</p>}

                  <div className="text-xs text-gray-400 space-y-1 mb-3">
                    <div className="flex items-center gap-1"><Home className="w-3 h-3" /> {item.vendedorNombre}{item.vendedorUnidad && ` · Depto ${item.vendedorUnidad}`}</div>
                    {item.contacto && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.contacto}</div>}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-50">
                    {item.estado === 'activo' && (
                      <button onClick={() => cambiarEstado(item.id, 'vendido')}
                        className="flex-1 py-1.5 text-xs rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Marcar vendido
                      </button>
                    )}
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => eliminar(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal ── */}
      <Modal abierto={showModal} onCerrar={() => setShowModal(false)} titulo={editando ? 'Editar Publicación' : 'Nueva Publicación'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input required value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
              placeholder="Sofá 2 plazas en buen estado"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as TipoItem }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="venta">Venta</option>
                <option value="arriendo">Arriendo</option>
                <option value="regalo">Regalo</option>
                <option value="busco">Busco</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={form.precio ?? ''} onChange={e => setForm(p => ({ ...p, precio: e.target.value ? +e.target.value : null }))}
                  placeholder="50000"
                  className="w-full pl-7 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea rows={3} value={form.descripcion ?? ''} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value || null }))}
              placeholder="Detalles del artículo..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor / Nombre *</label>
              <input required value={form.vendedorNombre} onChange={e => setForm(p => ({ ...p, vendedorNombre: e.target.value }))}
                placeholder="Pedro González"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° Depto</label>
              <input value={form.vendedorUnidad ?? ''} onChange={e => setForm(p => ({ ...p, vendedorUnidad: e.target.value || null }))}
                placeholder="304"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contacto (teléfono o email)</label>
            <input value={form.contacto ?? ''} onChange={e => setForm(p => ({ ...p, contacto: e.target.value || null }))}
              placeholder="+56 9 1234 5678"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {saving ? 'Guardando...' : editando ? 'Guardar' : 'Publicar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
