'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Plus, SlidersHorizontal, Layers } from 'lucide-react'
import { formatCLP } from '@/lib/db'
import type { Unidad, User } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────
type TipoFiltro   = 'todos' | 'departamento' | 'bodega' | 'estacionamiento' | 'local_comercial' | 'oficina'
type EstadoFiltro = 'todos' | 'ocupado' | 'disponible' | 'en_mantención'

// ─── Configs ──────────────────────────────────────────────────
const estadoCfg = {
  ocupado:          { label: 'Ocupado',     bg: '#dcfce7', color: '#16a34a' },
  disponible:       { label: 'Disponible',  bg: '#dbeafe', color: '#2563ae' },
  'en_mantención':  { label: 'Mantención',  bg: '#fef3c7', color: '#d97706' },
} as const

const tipoCfg: Record<string, { label: string; bg: string; color: string }> = {
  departamento:    { label: 'Depto',  bg: '#f1f5f9', color: '#475569' },
  casa:            { label: 'Casa',   bg: '#f1f5f9', color: '#475569' },
  local_comercial: { label: 'Local',  bg: '#f3e8ff', color: '#9333ea' },
  oficina:         { label: 'Oficina',bg: '#fce7f3', color: '#db2777' },
  bodega:          { label: 'Bodega', bg: '#fef3c7', color: '#d97706' },
  estacionamiento: { label: 'Estac.', bg: '#ecfdf5', color: '#059669' },
}

const tipoFiltros: { value: TipoFiltro; label: string }[] = [
  { value: 'todos',          label: 'Todos' },
  { value: 'departamento',   label: 'Deptos' },
  { value: 'bodega',         label: 'Bodegas' },
  { value: 'estacionamiento',label: 'Estacionamientos' },
  { value: 'local_comercial',label: 'Locales' },
  { value: 'oficina',        label: 'Oficinas' },
]

const estadoFiltros: { value: EstadoFiltro; label: string }[] = [
  { value: 'todos',        label: 'Todos' },
  { value: 'ocupado',      label: 'Ocupado' },
  { value: 'disponible',   label: 'Disponible' },
  { value: 'en_mantención',label: 'En mantención' },
]

function formatPiso(piso: number) {
  if (piso < 0) return `Sótano ${Math.abs(piso)}`
  if (piso === 0) return 'PB'
  return `Piso ${piso}`
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  unidades: Unidad[]
  users: User[]
}

// ─── Componente ───────────────────────────────────────────────
export default function UnidadesView({ unidades, users }: Props) {
  const [tipoFiltro,   setTipoFiltro]   = useState<TipoFiltro>('todos')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos')
  const [pisoFiltro,   setPisoFiltro]   = useState<number | null>(null)
  const [busqueda,     setBusqueda]     = useState('')

  // Pisos únicos ordenados
  const pisos = useMemo(() =>
    Array.from(new Set(unidades.map(u => u.piso))).sort((a, b) => a - b),
    [unidades]
  )

  const filtered = useMemo(() => {
    return unidades.filter(u => {
      if (tipoFiltro !== 'todos' && u.tipo !== tipoFiltro) return false
      if (estadoFiltro !== 'todos' && u.estado !== estadoFiltro) return false
      if (pisoFiltro !== null && u.piso !== pisoFiltro) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        const prop = u.propietarioId ? users.find(usr => usr.id === u.propietarioId) : undefined
        const arr  = u.arrendatarioId ? users.find(usr => usr.id === u.arrendatarioId) : undefined
        const nombreProp = prop ? `${prop.nombre} ${prop.apellido}`.toLowerCase() : ''
        const nombreArr  = arr  ? `${arr.nombre}  ${arr.apellido}`.toLowerCase()  : ''
        if (!u.numero.toLowerCase().includes(q) && !nombreProp.includes(q) && !nombreArr.includes(q)) return false
      }
      return true
    })
  }, [unidades, users, tipoFiltro, estadoFiltro, busqueda])

  const totales = {
    total:      unidades.length,
    ocupadas:   unidades.filter(u => u.estado === 'ocupado').length,
    disponibles:unidades.filter(u => u.estado === 'disponible').length,
    mantención: unidades.filter(u => u.estado === 'en_mantención').length,
  }

  const getResidente = (u: Unidad) => {
    const arr  = u.arrendatarioId ? users.find(usr => usr.id === u.arrendatarioId) : undefined
    const prop = u.propietarioId  ? users.find(usr => usr.id === u.propietarioId)  : undefined
    if (arr)  return { nombre: `${arr.nombre} ${arr.apellido}`,   rol: 'Arr.' }
    if (prop) return { nombre: `${prop.nombre} ${prop.apellido}`, rol: 'Prop.' }
    return null
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unidades</h1>
          <p className="text-gray-500 mt-1">{unidades.length} unidades registradas</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Nueva unidad
        </button>
      </div>

      {/* Chips de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total',        value: totales.total,       color: '#2563ae', bg: '#dbeafe' },
          { label: 'Ocupadas',     value: totales.ocupadas,    color: '#16a34a', bg: '#dcfce7' },
          { label: 'Disponibles',  value: totales.disponibles, color: '#2563ae', bg: '#dbeafe' },
          { label: 'Mantención',   value: totales.mantención,  color: '#d97706', bg: '#fef3c7' },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border p-4 shadow-sm"
            style={{ borderColor: '#e2e8f0' }}
          >
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div
        className="bg-white rounded-2xl border shadow-sm p-4"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtro tipo */}
          <div className="flex items-center gap-1 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 mr-1" />
            {tipoFiltros.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTipoFiltro(value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  tipoFiltro === value
                    ? { background: '#2563ae', color: 'white' }
                    : { background: '#f1f5f9', color: '#64748b' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* Filtro estado */}
          <div className="flex items-center gap-1 flex-wrap">
            {estadoFiltros.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setEstadoFiltro(value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  estadoFiltro === value
                    ? { background: '#1e3a5f', color: 'white' }
                    : { background: '#f1f5f9', color: '#64748b' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />

          {/* Filtro piso */}
          <div className="flex items-center gap-1 flex-wrap">
            <Layers className="w-4 h-4 text-gray-400 mr-1" />
            <button
              onClick={() => setPisoFiltro(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={pisoFiltro === null
                ? { background: '#1e3a5f', color: 'white' }
                : { background: '#f1f5f9', color: '#64748b' }}
            >
              Todos
            </button>
            {pisos.map(p => (
              <button
                key={p}
                onClick={() => setPisoFiltro(pisoFiltro === p ? null : p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={pisoFiltro === p
                  ? { background: '#2563ae', color: 'white' }
                  : { background: '#f1f5f9', color: '#64748b' }}
              >
                {formatPiso(p)}
              </button>
            ))}
          </div>

          {/* Búsqueda */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar unidad o residente..."
              className="pl-9 pr-4 py-1.5 rounded-lg border text-sm outline-none transition-all"
              style={{
                borderColor: '#e2e8f0',
                background: '#f8fafc',
                color: '#0f172a',
                width: 220,
              }}
              onFocus={e  => { e.currentTarget.style.borderColor = '#2563ae'; e.currentTarget.style.background = 'white' }}
              onBlur={e   => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
        style={{ borderColor: '#e2e8f0' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                {['Unidad', 'Piso', 'Tipo', 'Estado', 'Residente', 'M²', 'Gastos C.', ''].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No se encontraron unidades con los filtros seleccionados
                  </td>
                </tr>
              ) : filtered.map(u => {
                const est     = estadoCfg[u.estado as keyof typeof estadoCfg] ?? { label: u.estado, bg: '#f1f5f9', color: '#64748b' }
                const tipo    = tipoCfg[u.tipo] ?? { label: u.tipo, bg: '#f1f5f9', color: '#64748b' }
                const residente = getResidente(u)

                return (
                  <tr
                    key={u.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#f8fafc' }}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-gray-900 text-sm">Unidad {u.numero}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {formatPiso(u.piso)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{ background: tipo.bg, color: tipo.color }}
                      >
                        {tipo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap"
                        style={{ background: est.bg, color: est.color }}
                      >
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {residente ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700 font-medium">{residente.nombre}</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-medium"
                            style={{ background: '#f1f5f9', color: '#64748b' }}
                          >
                            {residente.rol}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                      {u.superficieM2} m²
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-800 whitespace-nowrap">
                      {formatCLP(u.gastosComunesMonto)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/unidades/${u.id}`}
                        className="text-xs font-semibold hover:opacity-75 transition-opacity"
                        style={{ color: '#2563ae' }}
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div
            className="px-5 py-3 border-t flex items-center justify-between"
            style={{ borderColor: '#f1f5f9' }}
          >
            <p className="text-xs text-gray-400">
              Mostrando {filtered.length} de {unidades.length} unidades
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

