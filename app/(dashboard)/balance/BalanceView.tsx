'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, ArrowLeftRight, Shield, Download } from 'lucide-react'
import type { Pago, EgresoComunidad, GastoComun } from '@/types'

// ─── Constantes ───────────────────────────────────────────────
const MESES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_LARGO = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function fmtCLP(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(n)
}

function fmtM(n: number) {
  const abs  = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${sign}$${Math.round(abs / 1_000)}K`
  return fmtCLP(n)
}

// ─── Mini gráfico de barras ───────────────────────────────────
function TrendChart({
  data, color,
}: {
  data:  { l: string; v: number }[]
  color: string
}) {
  const max     = Math.max(...data.map(d => d.v), 1)
  const W       = 280
  const H       = 110
  const PAD     = 10
  const BAR_W   = 30
  const chartH  = H - PAD - 22
  const spacing = (W - PAD * 2) / data.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      {/* Líneas de referencia */}
      {[0.33, 0.66, 1].map(f => {
        const y = PAD + chartH * (1 - f)
        return (
          <line key={f}
            x1={PAD} x2={W - PAD} y1={y} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth={1}
          />
        )
      })}
      {data.map((d, i) => {
        const cx = PAD + spacing * i + spacing / 2
        const bh = d.v > 0 ? Math.max((d.v / max) * chartH, 3) : 3
        return (
          <g key={i}>
            <rect
              x={cx - BAR_W / 2} y={PAD + chartH - bh}
              width={BAR_W} height={bh}
              rx={4} fill={color} opacity={0.78}
            />
            <text
              x={cx} y={H - 5}
              textAnchor="middle" fontSize={9}
              fill="rgba(148,180,212,0.65)"
            >
              {d.l}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  pagos:          Pago[]
  egresos:        EgresoComunidad[]
  gastos:         GastoComun[]
  edificioNombre: string
}

// ─── Componente principal ─────────────────────────────────────
export default function BalanceView({ pagos, egresos, gastos, edificioNombre }: Props) {

  // Ingresos agrupados por mes (solo pagos completados)
  const ingresosPorMes = useMemo(() => {
    const m: Record<string, number> = {}
    pagos.filter(p => p.estado === 'completado').forEach(p => {
      const k = `${p.año}-${String(p.mes).padStart(2, '0')}`
      m[k] = (m[k] ?? 0) + p.monto
    })
    return m
  }, [pagos])

  // Egresos agrupados por mes
  const egresosPorMes = useMemo(() => {
    const m: Record<string, number> = {}
    egresos.forEach(e => {
      const k = `${e.año}-${String(e.mes).padStart(2, '0')}`
      m[k] = (m[k] ?? 0) + e.monto
    })
    return m
  }, [egresos])

  // Unión de todos los meses con datos, ordenados desc
  const allMeses = useMemo(() => {
    const s = new Set<string>()
    pagos.forEach(p  => s.add(`${p.año}-${String(p.mes).padStart(2, '0')}`))
    egresos.forEach(e => s.add(`${e.año}-${String(e.mes).padStart(2, '0')}`))
    return Array.from(s).sort().reverse()
  }, [pagos, egresos])

  // Mes más reciente con datos
  const mesActualKey = allMeses[0]
    ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const [añoActual, mesActual] = mesActualKey.split('-').map(Number)

  // KPIs del mes actual
  const ingMes    = ingresosPorMes[mesActualKey] ?? 0
  const egrMes    = egresosPorMes[mesActualKey]  ?? 0
  const balMes    = ingMes - egrMes
  const cobertura = egrMes > 0 ? Math.round((ingMes / egrMes) * 100) : 0

  // Fondo de reserva acumulado (suma de todos los cobros de fondo reserva)
  const fondoReserva = useMemo(() =>
    gastos.reduce((s, g) => s + (g.montoFondoReserva ?? 0), 0)
  , [gastos])

  // Historial mensual con saldo acumulado
  const historial = useMemo(() => {
    let acum = 0
    return [...allMeses].reverse().map(k => {
      const [a, m] = k.split('-').map(Number)
      const ing = ingresosPorMes[k] ?? 0
      const egr = egresosPorMes[k]  ?? 0
      const bal = ing - egr
      acum += bal
      return { key: k, mes: m, año: a, ingresos: ing, egresos: egr, balance: bal, acumulado: acum }
    }).reverse()           // más reciente arriba en la tabla
  }, [allMeses, ingresosPorMes, egresosPorMes])

  // Últimos 6 meses para gráficos (izq → der = pasado → presente)
  const chart6 = useMemo(() =>
    [...allMeses].slice(0, 6).reverse().map(k => {
      const [, m] = k.split('-').map(Number)
      return {
        l:        MESES_ABREV[m - 1],
        ingresos: ingresosPorMes[k] ?? 0,
        egresos:  egresosPorMes[k]  ?? 0,
      }
    })
  , [allMeses, ingresosPorMes, egresosPorMes])

  // Export CSV (BOM + separador ; para Excel Chile)
  function exportCSV() {
    const rows = [
      ['Mes', 'Año', 'Ingresos', 'Egresos', 'Balance', 'Saldo Acumulado'],
      ...historial.map(r => [
        MESES_LARGO[r.mes - 1], String(r.año),
        String(r.ingresos), String(r.egresos),
        String(r.balance),  String(r.acumulado),
      ]),
    ]
    const csv = '﻿' + rows.map(r => r.join(';')).join('\n')
    const a = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
      download: `balance-${edificioNombre.replace(/\s+/g, '-')}-${mesActualKey}.csv`,
    })
    a.click()
  }

  const periodoLabel = `${MESES_LARGO[mesActual - 1]} ${añoActual}`
  const fechaHoy     = new Date().toLocaleDateString('es-CL')
  const primerMes    = historial.at(-1)

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Balance Financiero</h1>
          <p className="text-sm mt-0.5" style={{ color: '#94b4d4' }}>
            {edificioNombre} · {periodoLabel}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: '#1e3a5f', color: '#94b4d4', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Recaudado */}
        <div className="rounded-2xl p-4 space-y-1"
          style={{ background: '#0f2341', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#94b4d4' }}>
              Recaudado
            </p>
            <TrendingUp className="w-4 h-4" style={{ color: '#22c55e' }} />
          </div>
          <p className="text-2xl font-bold text-white">{fmtM(ingMes)}</p>
          <p className="text-xs" style={{ color: '#94b4d4' }}>{periodoLabel}</p>
        </div>

        {/* Egresos */}
        <div className="rounded-2xl p-4 space-y-1"
          style={{ background: '#0f2341', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#94b4d4' }}>
              Egresos
            </p>
            <TrendingDown className="w-4 h-4" style={{ color: '#ef4444' }} />
          </div>
          <p className="text-2xl font-bold text-white">{fmtM(egrMes)}</p>
          <p className="text-xs" style={{ color: '#94b4d4' }}>{periodoLabel}</p>
        </div>

        {/* Balance */}
        <div className="rounded-2xl p-4 space-y-1"
          style={{ background: '#0f2341', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#94b4d4' }}>
              Balance Mes
            </p>
            <ArrowLeftRight className="w-4 h-4"
              style={{ color: balMes >= 0 ? '#22c55e' : '#f97316' }} />
          </div>
          <p className="text-2xl font-bold"
            style={{ color: balMes >= 0 ? '#22c55e' : '#f97316' }}>
            {fmtM(balMes)}
          </p>
          <p className="text-xs" style={{ color: '#94b4d4' }}>Cobertura {cobertura}%</p>
        </div>

        {/* Fondo Reserva */}
        <div className="rounded-2xl p-4 space-y-1"
          style={{ background: '#0f2341', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#94b4d4' }}>
              Fondo Reserva
            </p>
            <Shield className="w-4 h-4" style={{ color: '#2563ae' }} />
          </div>
          <p className="text-2xl font-bold text-white">{fmtM(fondoReserva)}</p>
          <p className="text-xs" style={{ color: '#94b4d4' }}>Acumulado</p>
        </div>
      </div>

      {/* ── Gráficos de tendencia ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recaudación */}
        <div className="rounded-2xl p-5"
          style={{ background: '#0f2341', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-semibold text-white mb-0.5">Tendencia Recaudación</p>
          <p className="text-xs mb-4" style={{ color: '#94b4d4' }}>
            Gastos comunes cobrados — últimos 6 meses
          </p>
          <TrendChart
            data={chart6.map(d => ({ l: d.l, v: d.ingresos }))}
            color="#22c55e"
          />
        </div>

        {/* Egresos */}
        <div className="rounded-2xl p-5"
          style={{ background: '#0f2341', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-semibold text-white mb-0.5">Tendencia Egresos</p>
          <p className="text-xs mb-4" style={{ color: '#94b4d4' }}>
            Gastos operacionales comunitarios — últimos 6 meses
          </p>
          <TrendChart
            data={chart6.map(d => ({ l: d.l, v: d.egresos }))}
            color="#ef4444"
          />
        </div>
      </div>

      {/* ── Historial mensual ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: '#0f2341', border: '1px solid rgba(255,255,255,0.07)' }}>

        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-semibold text-white">Historial Mensual</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['Período', 'Recaudado', 'Egresos', 'Balance', 'Saldo Acum.', 'Cobertura'].map(h => (
                  <th key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'rgba(148,180,212,0.6)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historial.map(r => {
                const cob      = r.egresos > 0 ? Math.round((r.ingresos / r.egresos) * 100) : 100
                const isCur    = r.mes === mesActual && r.año === añoActual
                const cobColor = cob >= 80 ? '#22c55e' : cob >= 40 ? '#f59e0b' : '#ef4444'

                return (
                  <tr
                    key={r.key}
                    className="hover:bg-white/[0.02] transition-colors border-b"
                    style={{
                      borderColor: 'rgba(255,255,255,0.04)',
                      background:  isCur ? 'rgba(37,99,174,0.1)' : undefined,
                    }}
                  >
                    {/* Período */}
                    <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">
                      {MESES_LARGO[r.mes - 1]} {r.año}
                      {isCur && (
                        <span
                          className="ml-2 text-xs px-1.5 py-0.5 rounded-md font-medium"
                          style={{ background: '#2563ae', color: 'white' }}
                        >
                          actual
                        </span>
                      )}
                    </td>

                    {/* Recaudado */}
                    <td className="px-5 py-3.5 font-medium tabular-nums"
                      style={{ color: '#22c55e' }}>
                      {fmtCLP(r.ingresos)}
                    </td>

                    {/* Egresos */}
                    <td className="px-5 py-3.5 font-medium tabular-nums"
                      style={{ color: '#ef4444' }}>
                      {fmtCLP(r.egresos)}
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-3.5 font-bold tabular-nums"
                      style={{ color: r.balance >= 0 ? '#22c55e' : '#f97316' }}>
                      {fmtCLP(r.balance)}
                    </td>

                    {/* Saldo acumulado */}
                    <td className="px-5 py-3.5 font-medium tabular-nums"
                      style={{ color: r.acumulado >= 0 ? '#94b4d4' : '#f97316' }}>
                      {fmtCLP(r.acumulado)}
                    </td>

                    {/* Cobertura */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ width: 64, background: 'rgba(255,255,255,0.1)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(cob, 100)}%`, background: cobColor }}
                          />
                        </div>
                        <span className="text-xs tabular-nums" style={{ color: cobColor }}>
                          {cob}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t text-xs"
          style={{ borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(148,180,212,0.45)' }}
        >
          Actualizado al {fechaHoy}
          {' · '}Recaudado = pagos de gastos comunes completados
          {' · '}Egresos = gastos operacionales comunitarios
          {primerMes && (
            <>{' · '}Saldo acumulado desde {MESES_LARGO[primerMes.mes - 1]} {primerMes.año}</>
          )}
        </div>
      </div>

    </div>
  )
}
