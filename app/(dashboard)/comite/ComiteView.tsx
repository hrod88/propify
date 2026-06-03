'use client'

/**
 * ComiteView.tsx — Panel de Comité de Administración
 * Gestión de miembros del directorio y documentos confidenciales.
 */

import { useState, useMemo } from 'react'
import {
  Plus, Users, FileText, Crown, Edit2, Trash2,
  Lock, Globe, Calendar, Phone, Mail, Shield,
} from 'lucide-react'
import Modal from '@/components/modal'
import { supabase } from '@/lib/supabase'
import type { ComiteMiembro, ComiteDocumento, CargoComite, TipoDocComite } from '@/types'

const cargoCfg: Record<CargoComite, { label: string; color: string; bg: string }> = {
  presidente: { label: 'Presidente',  color: '#7c3aed', bg: '#ede9fe' },
  secretario: { label: 'Secretario',  color: '#2563ae', bg: '#dbeafe' },
  tesorero:   { label: 'Tesorero',    color: '#16a34a', bg: '#dcfce7' },
  vocal:      { label: 'Vocal',       color: '#d97706', bg: '#fef3c7' },
}
const tipoCfg: Record<TipoDocComite, { label: string; icon: React.ElementType }> = {
  acuerdo:      { label: 'Acuerdo',      icon: Shield    },
  convocatoria: { label: 'Convocatoria', icon: Calendar  },
  reglamento:   { label: 'Reglamento',  icon: FileText  },
  acta:         { label: 'Acta',        icon: FileText  },
  otro:         { label: 'Otro',        icon: FileText  },
}

interface Props {
  miembros:       ComiteMiembro[]
  documentos:     ComiteDocumento[]
  edificioNombre: string
  edificioId:     string
}

export default function ComiteView({ miembros: initM, documentos: initD, edificioNombre, edificioId }: Props) {
  const [tab, setTab]             = useState<'miembros' | 'documentos'>('miembros')
  const [miembros, setMiembros]   = useState<ComiteMiembro[]>(initM)
  const [docs, setDocs]           = useState<ComiteDocumento[]>(initD)
  const [showModal, setShowModal] = useState(false)
  const [modalTipo, setModalTipo] = useState<'miembro' | 'documento'>('miembro')
  const [editMiembro, setEditM]   = useState<ComiteMiembro | null>(null)
  const [editDoc, setEditDoc]     = useState<ComiteDocumento | null>(null)
  const [saving, setSaving]       = useState(false)

  const [formM, setFormM] = useState<Omit<ComiteMiembro,'id'|'creadoEn'>>({
    edificioId, usuarioId: null, nombre: '', cargo: 'vocal', rut: null,
    email: null, telefono: null, activo: true, periodoInicio: null, periodoFin: null,
  })
  const [formD, setFormD] = useState<Omit<ComiteDocumento,'id'|'creadoEn'>>({
    edificioId, titulo: '', tipo: 'acuerdo', contenido: null, url: null, confidencial: false,
  })

  function openNewMiembro() {
    setEditM(null)
    setFormM({ edificioId, usuarioId: null, nombre: '', cargo: 'vocal', rut: null,
      email: null, telefono: null, activo: true, periodoInicio: null, periodoFin: null })
    setModalTipo('miembro')
    setShowModal(true)
  }
  function openEditMiembro(m: ComiteMiembro) {
    setEditM(m)
    setFormM({ edificioId: m.edificioId, usuarioId: m.usuarioId, nombre: m.nombre, cargo: m.cargo,
      rut: m.rut, email: m.email, telefono: m.telefono, activo: m.activo,
      periodoInicio: m.periodoInicio, periodoFin: m.periodoFin })
    setModalTipo('miembro')
    setShowModal(true)
  }
  function openNewDoc() {
    setEditDoc(null)
    setFormD({ edificioId, titulo: '', tipo: 'acuerdo', contenido: null, url: null, confidencial: false })
    setModalTipo('documento')
    setShowModal(true)
  }
  function openEditDoc(d: ComiteDocumento) {
    setEditDoc(d)
    setFormD({ edificioId: d.edificioId, titulo: d.titulo, tipo: d.tipo,
      contenido: d.contenido, url: d.url, confidencial: d.confidencial })
    setModalTipo('documento')
    setShowModal(true)
  }

  async function saveMiembro(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formM.nombre.trim()) return
    setSaving(true)
    if (editMiembro) {
      const { data } = await supabase.from('comite_miembros').update(formM).eq('id', editMiembro.id).select().single()
      if (data) setMiembros(p => p.map(x => x.id === editMiembro.id ? data as ComiteMiembro : x))
    } else {
      const { data } = await supabase.from('comite_miembros').insert(formM).select().single()
      if (data) setMiembros(p => [...p, data as ComiteMiembro])
    }
    setSaving(false); setShowModal(false)
  }

  async function saveDoc(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formD.titulo.trim()) return
    setSaving(true)
    if (editDoc) {
      const { data } = await supabase.from('comite_documentos').update(formD).eq('id', editDoc.id).select().single()
      if (data) setDocs(p => p.map(x => x.id === editDoc.id ? data as ComiteDocumento : x))
    } else {
      const { data } = await supabase.from('comite_documentos').insert(formD).select().single()
      if (data) setDocs(p => [data as ComiteDocumento, ...p])
    }
    setSaving(false); setShowModal(false)
  }

  async function deleteMiembro(id: string) {
    if (!confirm('¿Eliminar miembro?')) return
    await supabase.from('comite_miembros').delete().eq('id', id)
    setMiembros(p => p.filter(x => x.id !== id))
  }
  async function deleteDoc(id: string) {
    if (!confirm('¿Eliminar documento?')) return
    await supabase.from('comite_documentos').delete().eq('id', id)
    setDocs(p => p.filter(x => x.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Comité</h1>
          <p className="text-gray-500 text-sm mt-0.5">{edificioNombre}</p>
        </div>
        <button onClick={tab === 'miembros' ? openNewMiembro : openNewDoc}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
          <Plus className="w-4 h-4" />
          {tab === 'miembros' ? 'Nuevo Miembro' : 'Nuevo Documento'}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([['miembros', 'Directorio', Users], ['documentos', 'Documentos', FileText]] as const).map(([val, label, Icon]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === val ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Miembros ── */}
      {tab === 'miembros' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {miembros.length === 0 ? (
            <div className="col-span-3 py-16 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay miembros registrados</p>
              <button onClick={openNewMiembro} className="mt-4 text-blue-600 text-sm hover:underline">
                + Agregar primer miembro
              </button>
            </div>
          ) : miembros.map(m => {
            const cfg = cargoCfg[m.cargo]
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
                    {m.nombre[0]}
                  </div>
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {m.cargo === 'presidente' && <Crown className="w-3 h-3 inline mr-1" />}
                    {cfg.label}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 mb-1">{m.nombre}</p>
                {m.rut && <p className="text-xs text-gray-500">RUT: {m.rut}</p>}
                <div className="mt-3 space-y-1">
                  {m.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail className="w-3 h-3" />{m.email}</div>}
                  {m.telefono && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="w-3 h-3" />{m.telefono}</div>}
                  {m.periodoInicio && <div className="flex items-center gap-2 text-xs text-gray-500"><Calendar className="w-3 h-3" />Desde {m.periodoInicio}</div>}
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
                  <button onClick={() => openEditMiembro(m)} className="flex-1 py-1.5 text-xs rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors flex items-center justify-center gap-1">
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>
                  <button onClick={() => deleteMiembro(m.id)} className="flex-1 py-1.5 text-xs rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center gap-1">
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Documentos ── */}
      {tab === 'documentos' && (
        <div className="space-y-3">
          {docs.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No hay documentos registrados</p>
              <button onClick={openNewDoc} className="mt-4 text-blue-600 text-sm hover:underline">+ Agregar documento</button>
            </div>
          ) : docs.map(d => {
            const cfg = tipoCfg[d.tipo]
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
                  <cfg.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">{d.titulo}</p>
                    {d.confidencial && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">{cfg.label}</span>
                    <span>{new Date(d.creadoEn).toLocaleDateString('es-CL')}</span>
                    {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><Globe className="w-3 h-3" />Ver</a>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditDoc(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteDoc(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modales ── */}
      <Modal abierto={showModal && modalTipo === 'miembro'} onCerrar={() => setShowModal(false)} titulo={editMiembro ? 'Editar Miembro' : 'Nuevo Miembro'}>
        <form onSubmit={saveMiembro} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input required value={formM.nombre} onChange={e => setFormM(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ana Torres Vega"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <select value={formM.cargo} onChange={e => setFormM(p => ({ ...p, cargo: e.target.value as CargoComite }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="presidente">Presidente</option>
                <option value="secretario">Secretario</option>
                <option value="tesorero">Tesorero</option>
                <option value="vocal">Vocal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
              <input value={formM.rut ?? ''} onChange={e => setFormM(p => ({ ...p, rut: e.target.value || null }))}
                placeholder="12.345.678-9"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={formM.email ?? ''} onChange={e => setFormM(p => ({ ...p, email: e.target.value || null }))}
                placeholder="correo@ejemplo.cl"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input value={formM.telefono ?? ''} onChange={e => setFormM(p => ({ ...p, telefono: e.target.value || null }))}
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período desde</label>
              <input type="date" value={formM.periodoInicio ?? ''} onChange={e => setFormM(p => ({ ...p, periodoInicio: e.target.value || null }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período hasta</label>
              <input type="date" value={formM.periodoFin ?? ''} onChange={e => setFormM(p => ({ ...p, periodoFin: e.target.value || null }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {saving ? 'Guardando...' : editMiembro ? 'Guardar' : 'Agregar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal abierto={showModal && modalTipo === 'documento'} onCerrar={() => setShowModal(false)} titulo={editDoc ? 'Editar Documento' : 'Nuevo Documento'}>
        <form onSubmit={saveDoc} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input required value={formD.titulo} onChange={e => setFormD(p => ({ ...p, titulo: e.target.value }))}
              placeholder="Acuerdo N°1 - Pintura hall"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={formD.tipo} onChange={e => setFormD(p => ({ ...p, tipo: e.target.value as TipoDocComite }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                <option value="acuerdo">Acuerdo</option>
                <option value="convocatoria">Convocatoria</option>
                <option value="reglamento">Reglamento</option>
                <option value="acta">Acta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={formD.confidencial} onChange={e => setFormD(p => ({ ...p, confidencial: e.target.checked }))}
                  className="rounded" />
                <Lock className="w-3.5 h-3.5 text-amber-500" /> Confidencial
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del documento</label>
            <input value={formD.url ?? ''} onChange={e => setFormD(p => ({ ...p, url: e.target.value || null }))}
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido / Resumen</label>
            <textarea rows={3} value={formD.contenido ?? ''} onChange={e => setFormD(p => ({ ...p, contenido: e.target.value || null }))}
              placeholder="Descripción del acuerdo..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {saving ? 'Guardando...' : editDoc ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
