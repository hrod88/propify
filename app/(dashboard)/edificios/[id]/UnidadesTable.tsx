'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import type { Unidad } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────
const estadoUnidadCfg = {
  ocupado:         { label: 'Ocupado',    bg: '#dcfce7', color: '#16a34a' },
  disponible:      { label: 'Disponible', bg: '#dbeafe', color: '#2563ae' },
  'en_mantención': { label: 'Mantención', bg: '#fef3c7', color: '#d97706' },
} as const

const tipoLabel: Record<string, string> = {
  departamento:    'Depto',
  casa:            'Casa',
  local_comercial: 'Local',
  oficina:         'Oficina',
  bodega:          'Bodega',
  estacionamiento: 'Estac.',
}

function formatPiso(piso: number) {
  if (piso < 0) return `Sótano ${Math.abs(piso)}`
  if (piso === 0) return 'PB'
  return `Piso ${piso}`
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
}

interface Props {
  unidades: Unidad[]
}

export default function UnidadesTable({ unidades }: Props) {
  const [pisoFiltro, setPisoFiltro] = useState<number | null>(null)
  const [busqueda,   setBusqueda]   = useState('')

  // Lista de pisos únicos ordenados
  const pisos = useMemo(() => {
    const set = new Set(unidades.map(u => u.piso))
    return Array.from(set).sort((a, b) => a - b)
  }, [unidades])

  // Filtrado combinado: piso + búsqueda
  const filtradas = useMemo(() => {
    let lista = unidades
    if (pisoFiltro !== null) lista = lista.filter(u => u.piso === pisoFiltro)
    const q = busqueda.trim().toLowerCase()
    if (q) lista = lista.filter(u => u.numero.toLowerCase().includes(q))
    return lista
  }, [unidades, pisoFiltro, busqueda])

  const hayFiltro = pisoFiltro !== null || busqueda.trim() !== ''

  return (
    <div className="xl:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b space-y-3" style={{ borderColor: '#f1f5f9' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Unidades</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              {filtradas.length !== unidades.length
                ? `${filtradas.length} de ${unidades.length}`
                : `${unidades.length} registros`}
            </span>
            <Link href="/unidades" className="text-xs font-semibold hover:opacity-75" style={{ color: '#2563ae' }}>
              Ver todas →
            </Link>
          </div>
        </div>

        {/* Búsqueda + pills de piso */}
        <div className="space-y-2.5">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por número de unidad..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ borderColor: '#e2e8f0' }}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Pills de piso */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setPisoFiltro(null)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
              style={
                pisoFiltro === null
                  ? { background: '#1e3a5f', color: '#fff' }
                  : { background: '#f1f5f9', color: '#64748b' }
              }
            >
              Todos
            </button>
            {pisos.map(p => (
              <button
                key={p}
                onClick={() => setPisoFiltro(pisoFiltro === p ? null : p)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={
                  pisoFiltro === p
                    ? { background: '#2563ae', color: '#fff' }
                    : { background: '#f1f5f9', color: '#64748b' }
                }
              >
                {formatPiso(p)}
              </button>
            ))}
            {hayFiltro && (
              <button
                onClick={() => { setPisoFiltro(null); setBusqueda('') }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                <X className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {filtradas.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No hay unidades que coincidan con el filtro.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                {['Número', 'Piso', 'Tipo', 'Estado', 'Superficie', 'Gastos C.', ''].map(h => (
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
              {filtradas.map(u => {
                const est = estadoUnidadCfg[u.estado as keyof typeof estadoUnidadCfg]
                  ?? { label: u.estado, bg: '#f1f5f9', color: '#64748b' }
                return (
                  <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#f8fafc' }}>
                    <td className="px-4 py-3.5 font-semibold text-gray-900 text-sm">Unidad {u.numero}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatPiso(u.piso)}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: '#f1f5f9', color: '#64748b' }}>
                        {tipoLabel[u.tipo] ?? u.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap" style={{ background: est.bg, color: est.color }}>
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{u.superficieM2} m²</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-700 whitespace-nowrap">{formatCLP(u.gastosComunesMonto)}</td>
                    <td className="px-4 py-3.5">
                      <Link href={`/unidades/${u.id}`} className="text-xs font-semibold hover:opacity-75" style={{ color: '#2563ae' }}>
                        Ver →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
