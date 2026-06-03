'use client'

/**
 * CalculadoraView.tsx — Calculadora de Dividendos / Gastos Comunes
 * Proyecta el gasto común de cada unidad basado en egresos y prorrateo.
 */

import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, Home, Info, RefreshCw } from 'lucide-react'
import { formatCLP } from '@/lib/format'
import type { Unidad } from '@/types'

interface Props {
  unidades:        Unidad[]
  edificioNombre:  string
  totalEgresosMes: number
}

export default function CalculadoraView({ unidades, edificioNombre, totalEgresosMes }: Props) {
  const [gastoBase,   setGastoBase]   = useState(totalEgresosMes)
  const [fondoReserva, setFondoReserva] = useState(10)   // %
  const [seguro,       setSeguro]       = useState(0)
  const [extra,        setExtra]        = useState(0)
  const [modo,         setModo]         = useState<'prorrateo' | 'igualitario'>('prorrateo')

  const totalUnidades = unidades.length

  const totalCalculado = useMemo(() =>
    gastoBase + (gastoBase * fondoReserva / 100) + seguro + extra
  , [gastoBase, fondoReserva, seguro, extra])

  const montoIgualitario = totalUnidades > 0 ? totalCalculado / totalUnidades : 0

  const resultados = useMemo(() =>
    unidades.map(u => {
      const prorrateo = u.prorrateo ?? (100 / totalUnidades)
      const monto = modo === 'igualitario'
        ? montoIgualitario
        : totalCalculado * (prorrateo / 100)
      return { ...u, monto: Math.round(monto), prorrateo }
    }).sort((a, b) => b.monto - a.monto)
  , [unidades, totalCalculado, modo, montoIgualitario, totalUnidades])

  const desglose = [
    { label: 'Egresos base',    monto: gastoBase,                      color: '#2563ae' },
    { label: 'Fondo de reserva', monto: gastoBase * fondoReserva / 100, color: '#7c3aed' },
    { label: 'Seguro',          monto: seguro,                         color: '#16a34a' },
    { label: 'Gastos extra',    monto: extra,                          color: '#d97706' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calculadora de Dividendos</h1>
        <p className="text-gray-500 text-sm mt-0.5">{edificioNombre} · Proyección mensual</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Panel izquierdo: variables ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" /> Variables
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Egresos base del mes
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={gastoBase} onChange={e => setGastoBase(+e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Basado en egresos de este mes</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fondo de reserva: <span className="text-blue-600 font-bold">{fondoReserva}%</span>
              </label>
              <input type="range" min={0} max={30} value={fondoReserva}
                onChange={e => setFondoReserva(+e.target.value)}
                className="w-full accent-blue-600" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seguro del edificio</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={seguro} onChange={e => setSeguro(+e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gastos extraordinarios</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" value={extra} onChange={e => setExtra(+e.target.value)}
                  className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distribución</label>
              <div className="grid grid-cols-2 gap-2">
                {(['prorrateo', 'igualitario'] as const).map(m => (
                  <button key={m} onClick={() => setModo(m)}
                    className={`py-2 rounded-xl text-xs font-medium transition-colors ${
                      modo === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {m === 'prorrateo' ? '% Prorrateo' : 'Igualitario'}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => { setGastoBase(totalEgresosMes); setFondoReserva(10); setSeguro(0); setExtra(0) }}
              className="w-full py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm text-gray-600 transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-3.5 h-3.5" /> Restablecer
            </button>
          </div>

          {/* ── Desglose ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Desglose total</h3>
            <div className="space-y-2">
              {desglose.filter(d => d.monto > 0).map(d => (
                <div key={d.label} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-gray-600">{d.label}</span>
                  </div>
                  <span className="font-medium text-gray-900">{formatCLP(d.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900">TOTAL</span>
                <span className="font-bold text-blue-600 text-lg">{formatCLP(totalCalculado)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Panel derecho: resultados por unidad ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" /> Monto por unidad
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5" />
                <span>{modo === 'prorrateo' ? 'Distribuido por prorrateo' : 'Monto igual por unidad'}</span>
              </div>
            </div>

            {unidades.length === 0 ? (
              <div className="py-16 text-center">
                <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay unidades registradas</p>
              </div>
            ) : (
              <>
                {/* Barra de progreso visual */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                    {resultados.slice(0, 20).map((u, i) => (
                      <div key={u.id} className="flex-1 rounded-sm"
                        style={{ background: `hsl(${220 + i * 3}, 70%, ${55 + i * 1.5}%)` }} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">{resultados.length} unidades</p>
                </div>

                <div className="overflow-y-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white border-b border-gray-100">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Unidad</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                        {modo === 'prorrateo' && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prorrateo</th>}
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Gasto Común</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {resultados.map((u, i) => (
                        <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${i === 0 ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-5 py-3 font-semibold text-gray-900">Depto {u.numero}</td>
                          <td className="px-4 py-3 text-gray-500 capitalize">{u.tipo}</td>
                          {modo === 'prorrateo' && (
                            <td className="px-4 py-3 text-right text-gray-500">{u.prorrateo.toFixed(4)}%</td>
                          )}
                          <td className="px-5 py-3 text-right">
                            <span className="font-bold text-gray-900">{formatCLP(u.monto)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={modo === 'prorrateo' ? 3 : 2} className="px-5 py-3 font-bold text-gray-700">TOTAL RECAUDADO</td>
                        <td className="px-5 py-3 text-right font-bold text-blue-600 text-base">
                          {formatCLP(resultados.reduce((s, u) => s + u.monto, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex items-start gap-2 bg-amber-50">
                  <TrendingUp className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Esta es una <strong>proyección estimada</strong>. Los montos finales se definen al generar la facturación mensual oficial.
                    {modo === 'prorrateo' && ' Si una unidad no tiene prorrateo configurado, se asume distribución igualitaria.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
