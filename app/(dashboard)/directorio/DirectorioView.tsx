'use client'

/**
 * DirectorioView.tsx — Directorio Vecinal
 * Lista opt-in de residentes con contacto. Admin puede gestionar visibilidad.
 */

import { useState, useMemo } from 'react'
import { Search, Users, Phone, Mail, Home, Shield, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User, Unidad } from '@/types'

interface Props {
  usuarios:       User[]
  unidades:       Unidad[]
  edificioNombre: string
  edificioId:     string
}

const rolLabel: Record<string, string> = {
  administrador: 'Administrador',
  propietario:   'Propietario',
  arrendatario:  'Arrendatario',
  conserje:      'Conserje',
}
const rolColor: Record<string, { bg: string; color: string }> = {
  administrador: { bg: '#ede9fe', color: '#7c3aed' },
  propietario:   { bg: '#dbeafe', color: '#2563ae' },
  arrendatario:  { bg: '#dcfce7', color: '#16a34a' },
  conserje:      { bg: '#fef3c7', color: '#d97706' },
}

// Tipo extendido con campos opcionales del directorio
type UsuarioDir = User & { visibleDirectorio?: boolean; telefonoDirectorio?: string }

export default function DirectorioView({ usuarios: inicial, unidades, edificioNombre }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioDir[]>(inicial as UsuarioDir[])
  const [search, setSearch]     = useState('')
  const [filtroRol, setFiltroRol] = useState<string>('todos')
  const [toggling, setToggling]   = useState<string | null>(null)

  const filtrados = useMemo(() =>
    usuarios.filter(u => {
      const matchSearch =
        `${u.nombre} ${u.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(search.toLowerCase())
      const matchRol = filtroRol === 'todos' || u.rol === filtroRol
      return matchSearch && matchRol
    }), [usuarios, search, filtroRol])

  const visibles = filtrados.filter(u => u.visibleDirectorio)
  const ocultos  = filtrados.filter(u => !u.visibleDirectorio)

  const unidadDeUsuario = (uid: string) =>
    unidades.find(u => u.propietarioId === uid || u.arrendatarioId === uid)

  async function toggleVisibilidad(u: UsuarioDir) {
    setToggling(u.id)
    const next = !u.visibleDirectorio
    await supabase.from('usuarios').update({ visibleDirectorio: next }).eq('id', u.id)
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, visibleDirectorio: next } : x))
    setToggling(null)
  }

  const Card = ({ u }: { u: UsuarioDir }) => {
    const unidad = unidadDeUsuario(u.id)
    const cfg    = rolColor[u.rol] ?? { bg: '#f1f5f9', color: '#64748b' }
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
              {u.nombre[0]}{u.apellido[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{u.nombre} {u.apellido}</p>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5"
                style={cfg}>{rolLabel[u.rol] ?? u.rol}</span>
            </div>
          </div>
          <button onClick={() => toggleVisibilidad(u)} disabled={toggling === u.id}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title={u.visibleDirectorio ? 'Ocultar del directorio' : 'Mostrar en directorio'}>
            {u.visibleDirectorio
              ? <Eye className="w-4 h-4 text-blue-500" />
              : <EyeOff className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
        <div className="space-y-1.5 text-xs text-gray-500">
          {unidad && (
            <div className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-gray-400" />
              <span>Depto {unidad.numero} · Piso {unidad.piso}</span>
            </div>
          )}
          {u.visibleDirectorio && u.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <a href={`mailto:${u.email}`} className="text-blue-600 hover:underline">{u.email}</a>
            </div>
          )}
          {u.visibleDirectorio && u.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <a href={`tel:${u.telefono}`} className="text-blue-600 hover:underline">{u.telefono}</a>
            </div>
          )}
          {!u.visibleDirectorio && (
            <p className="text-gray-400 italic">No visible en el directorio</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Directorio Vecinal</h1>
        <p className="text-gray-500 text-sm mt-0.5">{edificioNombre} · {visibles.length} de {usuarios.length} vecinos visibles</p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Solo aparecen los vecinos que activaron la visibilidad. El administrador puede activarla manualmente
          con el ícono del ojo. Los datos de contacto son opt-in.
        </p>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar vecino..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
        </div>
        {(['todos', 'propietario', 'arrendatario', 'administrador', 'conserje'] as const).map(r => (
          <button key={r} onClick={() => setFiltroRol(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroRol === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {r === 'todos' ? 'Todos' : rolLabel[r]}
          </button>
        ))}
      </div>

      {/* ── Visibles ── */}
      {visibles.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" /> Visibles en el directorio ({visibles.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibles.map(u => <Card key={u.id} u={u} />)}
          </div>
        </div>
      )}

      {/* ── Ocultos ── */}
      {ocultos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-gray-400" /> No visibles ({ocultos.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-60">
            {ocultos.map(u => <Card key={u.id} u={u} />)}
          </div>
        </div>
      )}

      {filtrados.length === 0 && (
        <div className="py-16 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No se encontraron vecinos</p>
        </div>
      )}
    </div>
  )
}
