'use client'

import { useState, useMemo } from 'react'
import {
  Target, TrendingDown, TrendingUp, AlertTriangle,
  CheckCircle, Pencil, Download, ChevronLeft, ChevronRight,
  Save, X, Shield,
} from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import type { EgresoComunidad, Presupuesto } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────
const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(n)

const fmtM = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

/** 🟢 en línea · 🟡 atención · 🔴 excedido */
function getSemaforo(ejecutado: number, presupuesto: number, mesesDatos: number) {
  if (presupuesto === 0 || ejecutado === 0) return 'gray'
  const avgMes    = ejecutado / mesesDatos
  const budgetMes = presupuesto / 12
  const ratio     = avgMes / budgetMes
  if (ratio <= 1.00) return 'green'
  if (ratio <= 1.15) return 'yellow'
  return 'red'
}

function Badge({ color }: { color: string }) {
  if (color === 'green')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: '#d1fae5', color: '#059669' }}>
        <CheckCircle className="w-3 h-3" /> En línea
      </span>
    )
  if (color === 'yellow')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: '#fef3c7', color: '#d97706' }}>
        <AlertTriangle className="w-3 h-3" /> Atención
      </span>
    )
  if (color === 'red')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: '#fee2e2', color: '#dc2626' }}>
        <AlertTriangle className="w-3 h-3" /> Excedido
      </span>
    )
  return <span className="text-xs text-gray-400">—</span>
}

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string; sub: string
  icon: React.ReactNode; color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4">
      <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${color}18` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1.5 leading-snug">{sub}</p>
      </div>
    </div>
  )
}

// ─── Tipos ────────────────────────────────────────────────────
interface Props {
  egresos:       EgresoComunidad[]
  presupuestos:  Presupuesto[]
  edificioNombre: string
  edificioId:    string
}

// ─── Componente principal ─────────────────────────────────────
export default function PresupuestoView({
  egresos,
  presupuestos: initialPresupuestos,
  edificioNombre,
  edificioId,
}: Props) {
  const currentYear = new Date().getFullYear()
  const [anio, setAnio]           = useState(currentYear)
  const [presupuestos, setPresupuestos] = useState(initialPresupuestos)
  const [editando, setEditando]   = useState<string | null>(null)
  const [editMonto, setEditMonto] = useState('')
  const [guardando, setGuardando] = useState(false)

  // ── Derivados ──────────────────────────────────────────────
  const egresosAnio = useMemo(
    () => egresos.filter(e => e.año === anio),
    [egresos, anio],
  )

  /** Cuántos meses distintos tienen datos reales */
  const mesesConDatos = useMemo(() => {
    const set = new Set(egresosAnio.map(e => e.mes))
    return Math.max(set.size, 1)
  }, [egresosAnio])

  /** Meses transcurridos del año (12 para años pasados) */
  const mesesTranscurridos = useMemo(
    () => anio < currentYear ? 12 : new Date().getMonth() + 1,
    [anio, currentYear],
  )

  const ejecutadoPorCat = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of egresosAnio) map[e.categoria] = (map[e.categoria] ?? 0) + e.monto
    return map
  }, [egresosAnio])

  const presupuestoPorCat = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of presupuestos.filter(p => p.anio === anio)) map[p.categoria] = p.monto
    return map
  }, [presupuestos, anio])

  /** Unión de categorías con datos de ejecución o presupuesto */
  const allCats = useMemo(() => {
    const set = new Set<string>()
    Object.keys(ejecutadoPorCat).forEach(c => set.add(c))
    Object.keys(presupuestoPorCat).forEach(c => set.add(c))
    return [...set].sort()
  }, [ejecutadoPorCat, presupuestoPorCat])

  // ── KPIs globales ──────────────────────────────────────────
  const totalPresupuesto = useMemo(
    () => Object.values(presupuestoPorCat).reduce((a, b) => a + b, 0),
    [presupuestoPorCat],
  )
  const totalEjecutado = useMemo(
    () => Object.values(ejecutadoPorCat).reduce((a, b) => a + b, 0),
    [ejecutadoPorCat],
  )
  const proyeccionAnual = useMemo(
    () => Math.round((totalEjecutado / mesesConDatos) * 12),
    [totalEjecutado, mesesConDatos],
  )
  const pctEjecucion  = totalPresupuesto > 0 ? Math.round((totalEjecutado / totalPresupuesto) * 100) : 0
  const pctEsperado   = Math.round((mesesTranscurridos / 12) * 100)
  const desviacionTotal = proyeccionAnual - totalPresupuesto
  const overallSem    = getSemaforo(totalEjecutado, totalPresupuesto, mesesConDatos)

  // ── Guardar presupuesto ─────────────────────────────────────
  async function handleSave(categoria: string) {
    const monto = parseInt(editMonto.replace(/\D/g, ''), 10)
    if (isNaN(monto) || monto < 0) { setEditando(null); return }

    setGuardando(true)
    const existing = presupuestos.find(
      p => p.anio === anio && p.categoria === categoria && p.edificioId === edificioId,
    )

    if (existing) {
      await supabaseBrowser
        .from('presupuestos')
        .update({ monto })
        .eq('id', existing.id)
    } else {
      await supabaseBrowser
        .from('presupuestos')
        .insert({ edificioId, anio, categoria, monto })
    }

    // Optimistic update
    setPresupuestos(prev => {
      const idx = prev.findIndex(p => p.anio === anio && p.categoria === categoria)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], monto }
        return next
      }
      return [...prev, {
        id: `tmp-${categoria}-${anio}`,
        edificioId, anio, categoria, monto,
        created_at: new Date().toISOString(),
      }]
    })
    setGuardando(false)
    setEditando(null)
  }

  // ── CSV export ──────────────────────────────────────────────
  function exportarCSV() {
    const SEP = ';', BOM = '﻿'
    const enc  = ['Categoría','Presupuesto Anual','Ejecutado YTD','Proyección Anual','Desviación','% Ejecución','Estado']
    const filas = allCats.map(cat => {
      const pres  = presupuestoPorCat[cat] ?? 0
      const ejec  = ejecutadoPorCat[cat] ?? 0
      const proy  = ejec > 0 ? Math.round((ejec / mesesConDatos) * 12) : 0
      const desv  = pres > 0 ? proy - pres : 0
      const pct   = pres > 0 ? Math.round((ejec / pres) * 100) : 0
      const sem   = getSemaforo(ejec, pres, mesesConDatos)
      const estado = sem === 'green' ? 'En línea' : sem === 'yellow' ? 'Atención' : sem === 'red' ? 'Excedido' : 'Sin presupuesto'
      return [cat, String(pres), String(ejec), String(proy), String(desv), `${pct}%`, estado]
    })
    const esc  = (v: string) => `"${v.replace(/"/g, '""')}"`
    const body = [enc.map(esc).join(SEP), ...filas.map(f => f.map(esc).join(SEP))].join('\r\n')
    const url  = URL.createObjectURL(new Blob([BOM + body], { type: 'text/csv;charset=utf-8;' }))
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `presupuesto_${anio}_${edificioNombre.replace(/ /g, '_')}.csv`,
    })
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presupuesto Anual</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {edificioNombre} · Proyección vs Real por Categoría
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selector año */}
          <div className="flex items-center gap-1 rounded-xl border bg-white px-1 py-1">
            <button
              onClick={() => setAnio(a => a - 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="px-3 text-sm font-semibold text-gray-800 min-w-[60px] text-center">
              {anio}
            </span>
            <button
              onClick={() => setAnio(a => a + 1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: '#2563ae' }}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Presupuesto Anual"
          value={fmtM(totalPresupuesto)}
          sub={`${allCats.filter(c => (presupuestoPorCat[c] ?? 0) > 0).length} categorías definidas`}
          icon={<Target className="w-5 h-5" />}
          color="#2563ae"
        />
        <KpiCard
          label={`Ejecutado ${anio === currentYear ? 'YTD' : anio}`}
          value={fmtM(totalEjecutado)}
          sub={`${pctEjecucion}% del presupuesto total`}
          icon={<TrendingDown className="w-5 h-5" />}
          color="#dc2626"
        />
        <KpiCard
          label="Proyección Anual"
          value={fmtM(proyeccionAnual)}
          sub={
            totalPresupuesto > 0
              ? desviacionTotal > 0
                ? `+${fmtM(desviacionTotal)} sobre presupuesto`
                : `${fmtM(Math.abs(desviacionTotal))} bajo presupuesto`
              : 'Sin presupuesto cargado'
          }
          icon={desviacionTotal > 0
            ? <TrendingUp className="w-5 h-5" />
            : <Shield className="w-5 h-5" />}
          color={desviacionTotal > 0 ? '#dc2626' : '#059669'}
        />
        <KpiCard
          label="Estado Presupuestario"
          value={`${pctEjecucion}%`}
          sub={`Esperado ${pctEsperado}% · ${mesesTranscurridos} mes${mesesTranscurridos !== 1 ? 'es' : ''} transcurridos`}
          icon={overallSem === 'green'
            ? <CheckCircle className="w-5 h-5" />
            : <AlertTriangle className="w-5 h-5" />}
          color={overallSem === 'green' ? '#059669' : overallSem === 'yellow' ? '#d97706' : '#dc2626'}
        />
      </div>

      {/* Barra global */}
      {totalPresupuesto > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">
              Ejecución presupuestaria {anio}
            </span>
            <Badge color={overallSem} />
          </div>
          <div className="h-3 rounded-full bg-gray-100 relative overflow-hidden">
            {/* Marca de porcentaje esperado */}
            <div
              className="absolute top-0 bottom-0 w-0.5 z-10"
              style={{ left: `${Math.min(pctEsperado, 100)}%`, background: '#94a3b8' }}
            />
            {/* Barra ejecutada */}
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(pctEjecucion, 100)}%`,
                background: overallSem === 'green' ? '#059669'
                  : overallSem === 'yellow' ? '#d97706'
                  : '#dc2626',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{pctEjecucion}% ejecutado</span>
            <span style={{ marginLeft: `${Math.min(pctEsperado, 96)}%`, transform: 'translateX(-50%)' }}>
              ↑ esperado {pctEsperado}%
            </span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Tabla por categoría */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Detalle por Categoría</h2>
          <span className="text-xs text-gray-400">
            {mesesConDatos} mes{mesesConDatos !== 1 ? 'es' : ''} con datos · haz clic en ✏️ para editar presupuesto
          </span>
        </div>

        {allCats.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No hay datos para {anio}. Navega a un año con egresos cargados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Categoría','Presupuesto','Ejecutado','Prom/mes','Proyección','Desviación','Ejecución','Estado',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allCats.map(cat => {
                  const pres    = presupuestoPorCat[cat] ?? 0
                  const ejec    = ejecutadoPorCat[cat] ?? 0
                  const promMes = ejec > 0 ? Math.round(ejec / mesesConDatos) : 0
                  const proy    = ejec > 0 ? promMes * 12 : 0
                  const desv    = pres > 0 && proy > 0 ? proy - pres : 0
                  const pct     = pres > 0 && ejec > 0 ? Math.round((ejec / pres) * 100) : 0
                  const sem     = getSemaforo(ejec, pres, mesesConDatos)
                  const isEdit  = editando === cat

                  return (
                    <tr key={cat} className="hover:bg-gray-50 transition-colors">

                      {/* Categoría */}
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {cat}
                      </td>

                      {/* Presupuesto (editable) */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {isEdit ? (
                          <input
                            type="number"
                            value={editMonto}
                            onChange={e => setEditMonto(e.target.value)}
                            className="w-32 text-right border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2"
                            style={{ '--tw-ring-color': '#2563ae' } as React.CSSProperties}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSave(cat)
                              if (e.key === 'Escape') setEditando(null)
                            }}
                          />
                        ) : pres > 0 ? (
                          <span className="text-gray-700">{fmtCLP(pres)}</span>
                        ) : (
                          <span className="text-gray-300 italic text-xs">Sin definir</span>
                        )}
                      </td>

                      {/* Ejecutado */}
                      <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">
                        {ejec > 0 ? fmtCLP(ejec) : '—'}
                      </td>

                      {/* Prom mensual */}
                      <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                        {promMes > 0 ? fmtCLP(promMes) : '—'}
                      </td>

                      {/* Proyección */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {proy > 0 ? (
                          <span className={pres > 0 && proy > pres ? 'text-red-600 font-medium' : 'text-gray-700'}>
                            {fmtCLP(proy)}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Desviación */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {pres > 0 && proy > 0 ? (
                          <span className={`font-semibold ${desv > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {desv > 0 ? '+' : ''}{fmtCLP(desv)}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Barra ejecución */}
                      <td className="px-4 py-3" style={{ minWidth: 120 }}>
                        {pres > 0 && ejec > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(pct, 100)}%`,
                                  background: sem === 'green' ? '#059669'
                                    : sem === 'yellow' ? '#d97706'
                                    : '#dc2626',
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-9 text-right shrink-0">{pct}%</span>
                          </div>
                        ) : '—'}
                      </td>

                      {/* Semáforo */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge color={pres > 0 ? sem : 'gray'} />
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        {isEdit ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSave(cat)}
                              disabled={guardando}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditando(null)}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditando(cat); setEditMonto(String(pres || '')) }}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar presupuesto"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>

              {/* Totales */}
              <tfoot>
                <tr style={{ background: '#f1f5f9', borderTop: '2px solid #e2e8f0' }}>
                  <td className="px-4 py-3 font-bold text-gray-800">TOTAL</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    {totalPresupuesto > 0 ? fmtCLP(totalPresupuesto) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    {totalEjecutado > 0 ? fmtCLP(totalEjecutado) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-500">
                    {totalEjecutado > 0 ? fmtCLP(Math.round(totalEjecutado / mesesConDatos)) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    {proyeccionAnual > 0 ? fmtCLP(proyeccionAnual) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {totalPresupuesto > 0 && proyeccionAnual > 0 ? (
                      <span className={`font-bold ${desviacionTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {desviacionTotal > 0 ? '+' : ''}{fmtCLP(desviacionTotal)}
                      </span>
                    ) : '—'}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Nota pie */}
      <p className="text-xs text-gray-400 text-right">
        * Proyección basada en promedio de {mesesConDatos} mes{mesesConDatos !== 1 ? 'es' : ''} con datos.
        Semáforo: 🟢 promedio mensual ≤ presupuesto mensual · 🟡 hasta +15% · 🔴 más de +15%.
      </p>
    </div>
  )
}
