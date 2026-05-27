'use client'

import { useState, useMemo } from 'react'
import { Download, TrendingUp, DollarSign, AlertTriangle, Wrench, Home, ChevronDown, Printer, FileDown } from 'lucide-react'
import { formatCLP } from '@/lib/mock-data'
import type { GastoComun, Pago, SolicitudMantencion, Unidad } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────
type Tab = 'resumen' | 'finanzas' | 'mantenciones'

// ─── CSV helper ───────────────────────────────────────────────
function descargarCSV(nombreArchivo: string, encabezados: string[], filas: string[][]) {
  const SEP = ';'
  const BOM = '﻿'
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const contenido = [
    encabezados.map(esc).join(SEP),
    ...filas.map(f => f.map(esc).join(SEP)),
  ].join('\r\n')
  const blob = new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), {
    href:     url,
    download: `propify_${nombreArchivo}.csv`,
  })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const MESES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const CSV_SUBTITLE: Record<Tab, string> = {
  resumen:      'Gastos comunes Mayo 2026',
  finanzas:     'Historial de pagos 2026',
  mantenciones: 'Solicitudes de mantención',
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  gastos: GastoComun[]
  pagos: Pago[]
  solicitudes: SolicitudMantencion[]
  unidades: Unidad[]
}

// ─── Componente ───────────────────────────────────────────────
export default function ReportesView({ gastos, pagos, solicitudes, unidades }: Props) {
  const [tab, setTab]               = useState<Tab>('resumen')
  const [showExportMenu, setShowExportMenu] = useState(false)

  // ── Métricas financieras (gastos mayo) ──
  const totalMes   = gastos.reduce((s, g) => s + g.montoTotal, 0)
  const recaudado  = gastos.filter(g => g.estadoPago === 'pagado').reduce((s, g) => s + g.montoTotal, 0)
  const moroso     = gastos.filter(g => g.estadoPago === 'vencido').reduce((s, g) => s + g.montoTotal, 0)
  const pendiente  = gastos.filter(g => g.estadoPago === 'pendiente').reduce((s, g) => s + g.montoTotal, 0)
  const parcial    = gastos.filter(g => g.estadoPago === 'parcial').reduce((s, g) => s + g.montoTotal, 0)
  const recaudacionPct = Math.round((recaudado / totalMes) * 100)

  // ── Pagos por mes ──
  const pagosPorMes = useMemo(() => {
    const map: Record<string, number> = {}
    pagos.forEach(p => {
      const key = `${p.año}-${String(p.mes).padStart(2, '0')}`
      map[key] = (map[key] ?? 0) + p.monto
    })
    return map
  }, [pagos])

  const mesesData = [
    { label: 'Ene', value: pagosPorMes['2026-01'] ?? 0 },
    { label: 'Feb', value: pagosPorMes['2026-02'] ?? 0 },
    { label: 'Mar', value: pagosPorMes['2026-03'] ?? 0 },
    { label: 'Abr', value: pagosPorMes['2026-04'] ?? 0 },
    { label: 'May', value: pagosPorMes['2026-05'] ?? 0 },
  ]
  const maxMes = Math.max(...mesesData.map(m => m.value), 1)

  // ── Mantenciones ──
  const solPendiente  = solicitudes.filter(s => s.estado === 'pendiente').length
  const solEnProgreso = solicitudes.filter(s => s.estado === 'en_progreso').length
  const solResuelto   = solicitudes.filter(s => s.estado === 'resuelto').length

  const categorias = useMemo(() => {
    const map: Record<string, number> = {}
    solicitudes.forEach(s => { map[s.categoria] = (map[s.categoria] ?? 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [solicitudes])

  // ── Ocupación ──
  const ocupadas    = unidades.filter(u => u.estado === 'ocupado').length
  const disponibles = unidades.filter(u => u.estado === 'disponible').length
  const ocupacionPct = Math.round((ocupadas / unidades.length) * 100)

  // ── Métodos de pago ──
  const metodoCount = useMemo(() => {
    const map: Record<string, number> = {}
    pagos.forEach(p => { map[p.metodo] = (map[p.metodo] ?? 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [pagos])

  // ── Exportar CSV ──────────────────────────────────────────────
  function exportarCSV() {
    if (tab === 'resumen') {
      const enc = [
        'Unidad', 'Mes', 'Año', 'Monto Base (CLP)',
        'Monto Total (CLP)', 'Estado Pago', 'Fecha Vencimiento', 'Días Mora',
      ]
      const filas = gastos.map(g => [
        g.unidadId,
        String(g.mes),
        String(g.año),
        String(g.montoBase),
        String(g.montoTotal),
        g.estadoPago,
        g.fechaVencimiento,
        String(g.diasMora ?? 0),
      ])
      descargarCSV('gastos_mayo_2026', enc, filas)

    } else if (tab === 'finanzas') {
      const enc = ['ID Pago', 'Unidad', 'Período', 'Monto (CLP)', 'Método', 'Estado', 'Registrado el']
      const filas = pagos.map(p => [
        p.id,
        p.unidadId,
        `${MESES_ABREV[p.mes - 1]} ${p.año}`,
        String(p.monto),
        p.metodo,
        p.estado,
        p.creadoEn,
      ])
      descargarCSV('pagos_2026', enc, filas)

    } else {
      const enc = [
        'ID', 'Título', 'Categoría', 'Prioridad',
        'Estado', 'Unidad', 'Creado el', 'Resuelto el',
      ]
      const filas = solicitudes.map(s => [
        s.id,
        s.titulo,
        s.categoria,
        s.prioridad,
        s.estado,
        s.unidadId,
        s.creadoEn,
        s.resueltoEn ?? '',
      ])
      descargarCSV('solicitudes_mantenciones', enc, filas)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 mt-1">Edificio Las Palmas · Mayo 2026</p>
        </div>
        {/* ── Dropdown exportar ── */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#2563ae' }}
          >
            <Download className="w-4 h-4" />
            Exportar
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {showExportMenu && (
            <>
              {/* backdrop cierre */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowExportMenu(false)}
              />
              {/* menú */}
              <div
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border z-20 overflow-hidden"
                style={{ borderColor: '#e2e8f0' }}
              >
                {/* CSV */}
                <button
                  onClick={() => { exportarCSV(); setShowExportMenu(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: '#dcfce7' }}
                  >
                    <FileDown className="w-4 h-4" style={{ color: '#16a34a' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Exportar CSV</p>
                    <p className="text-xs text-gray-400">{CSV_SUBTITLE[tab]}</p>
                  </div>
                </button>

                <div className="border-t mx-4" style={{ borderColor: '#f1f5f9' }} />

                {/* PDF */}
                <button
                  onClick={() => { window.print(); setShowExportMenu(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: '#dbeafe' }}
                  >
                    <Printer className="w-4 h-4" style={{ color: '#2563ae' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Exportar PDF</p>
                    <p className="text-xs text-gray-400">Imprimir / Guardar como PDF</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'resumen',      label: 'Resumen general' },
          { value: 'finanzas',     label: 'Finanzas' },
          { value: 'mantenciones', label: 'Mantenciones' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value as Tab)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              tab === value
                ? { background: '#1e3a5f', color: 'white' }
                : { background: '#f1f5f9', color: '#64748b' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ════════════ RESUMEN ════════════ */}
      {tab === 'resumen' && (
        <div className="space-y-4">

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: 'Recaudado mayo',
                value: formatCLP(recaudado),
                sub: `${recaudacionPct}% del total`,
                color: '#16a34a', bg: '#dcfce7',
                Icon: DollarSign,
              },
              {
                label: 'En mora',
                value: formatCLP(moroso),
                sub: `${gastos.filter(g => g.estadoPago === 'vencido').length} unidades`,
                color: '#dc2626', bg: '#fee2e2',
                Icon: AlertTriangle,
              },
              {
                label: 'Ocupación',
                value: `${ocupacionPct}%`,
                sub: `${ocupadas} de ${unidades.length} unidades`,
                color: '#2563ae', bg: '#dbeafe',
                Icon: Home,
              },
              {
                label: 'Solicitudes activas',
                value: String(solPendiente + solEnProgreso),
                sub: `${solResuelto} resueltas`,
                color: '#d97706', bg: '#fef3c7',
                Icon: Wrench,
              },
            ].map(({ label, value, sub, color, bg, Icon }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border shadow-sm p-5"
                style={{ borderColor: '#e2e8f0' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400">{label}</p>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Gastos por estado */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h2 className="font-bold text-gray-900 mb-5">Gastos comunes mayo 2026</h2>
            <div className="space-y-4">
              {[
                { label: 'Pagado',    value: recaudado, color: '#16a34a' },
                { label: 'Vencido',   value: moroso,    color: '#dc2626' },
                { label: 'Pendiente', value: pendiente, color: '#d97706' },
                { label: 'Parcial',   value: parcial,   color: '#2563ae' },
              ].map(({ label, value, color }) => {
                const pct = totalMes > 0 ? Math.round((value / totalMes) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{label}</span>
                      <span className="font-bold" style={{ color }}>
                        {formatCLP(value)} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div
              className="mt-5 pt-4 border-t flex items-center justify-between"
              style={{ borderColor: '#f1f5f9' }}
            >
              <span className="text-sm text-gray-500">Total a recaudar</span>
              <span className="font-bold text-gray-900">{formatCLP(totalMes)}</span>
            </div>
          </div>

          {/* Ocupación circular */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h2 className="font-bold text-gray-900 mb-4">Ocupación de unidades</h2>
            <div className="flex items-center gap-8">
              {/* SVG donut */}
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#2563ae" strokeWidth="3.5"
                    strokeDasharray={`${ocupacionPct} ${100 - ocupacionPct}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{ocupacionPct}%</span>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {[
                  { label: 'Ocupadas',    value: ocupadas,                                    color: '#2563ae' },
                  { label: 'Disponibles', value: disponibles,                                  color: '#16a34a' },
                  { label: 'En mantención', value: unidades.filter(u => u.estado === 'en_mantención').length, color: '#d97706' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-sm text-gray-600">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ FINANZAS ════════════ */}
      {tab === 'finanzas' && (
        <div className="space-y-4">

          {/* Gráfico de barras (CSS) */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900">Pagos recibidos por mes</h2>
                <p className="text-xs text-gray-400 mt-0.5">Enero – Mayo 2026</p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>

            {/* Barras */}
            <div className="flex items-end gap-3" style={{ height: 140 }}>
              {mesesData.map(({ label, value }, i) => {
                const pct = value > 0 ? (value / maxMes) * 100 : 0
                const isCurrent = label === 'May'
                return (
                  <div
                    key={label}
                    className="flex-1 flex flex-col items-center gap-1.5"
                    style={{ height: 140 }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: isCurrent ? '#2563ae' : '#94a3b8' }}
                    >
                      {value > 0 ? `$${Math.round(value / 1000)}k` : ''}
                    </span>
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className="w-full rounded-t-xl transition-all duration-700"
                        style={{
                          height: `${Math.max(pct, value > 0 ? 6 : 0)}%`,
                          background: isCurrent
                            ? 'linear-gradient(180deg, #2563ae 0%, #1e3a5f 100%)'
                            : '#dbeafe',
                          minHeight: value > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isCurrent ? '#1e3a5f' : '#94a3b8' }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Historial mensual */}
          <div
            className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: '#f1f5f9' }}
            >
              <h2 className="font-bold text-gray-900">Historial de pagos</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Período', 'N° pagos', 'Total recaudado', 'Métodos'].map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Mayo 2026',  mes: 5, año: 2026 },
                  { label: 'Abril 2026', mes: 4, año: 2026 },
                  { label: 'Marzo 2026', mes: 3, año: 2026 },
                ].map(({ label, mes, año }, idx) => {
                  const mp     = pagos.filter(p => p.mes === mes && p.año === año)
                  const total  = mp.reduce((s, p) => s + p.monto, 0)
                  const mets   = [...new Set(mp.map(p => p.metodo))]
                  return (
                    <tr
                      key={label}
                      className="border-t"
                      style={{
                        borderColor: '#f1f5f9',
                        background: idx % 2 === 0 ? 'white' : '#fafafa',
                      }}
                    >
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{label}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{mp.length} pagos</td>
                      <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{formatCLP(total)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {mets.map(m => (
                            <span
                              key={m}
                              className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                              style={{ background: '#f1f5f9', color: '#64748b' }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Métodos de pago */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h2 className="font-bold text-gray-900 mb-4">Métodos de pago más usados</h2>
            <div className="space-y-3">
              {metodoCount.map(([metodo, count]) => {
                const pct = Math.round((count / pagos.length) * 100)
                return (
                  <div key={metodo}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 capitalize">{metodo}</span>
                      <span className="text-gray-400">
                        {count} pago{count !== 1 ? 's' : ''} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: '#2563ae' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ MANTENCIONES ════════════ */}
      {tab === 'mantenciones' && (
        <div className="space-y-4">

          {/* KPIs por estado */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pendientes',  value: solPendiente,  color: '#d97706', bg: '#fef3c7' },
              { label: 'En progreso', value: solEnProgreso, color: '#2563ae', bg: '#dbeafe' },
              { label: 'Resueltas',   value: solResuelto,   color: '#16a34a', bg: '#dcfce7' },
            ].map(({ label, value, color, bg }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border shadow-sm p-5"
                style={{ borderColor: '#e2e8f0' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: bg }}
                >
                  <Wrench className="w-5 h-5" style={{ color }} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Por categoría */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h2 className="font-bold text-gray-900 mb-4">Solicitudes por categoría</h2>
            <div className="space-y-4">
              {categorias.map(([cat, count]) => {
                const pct = solicitudes.length > 0
                  ? Math.round((count / solicitudes.length) * 100)
                  : 0
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700">{cat}</span>
                      <span className="font-bold" style={{ color: '#1e3a5f' }}>
                        {count} {count === 1 ? 'solicitud' : 'solicitudes'}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: '#2563ae' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lista detallada */}
          <div
            className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: '#f1f5f9' }}
            >
              <h2 className="font-bold text-gray-900">Detalle de solicitudes</h2>
            </div>
            <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
              {solicitudes.map(s => {
                const estadoStyle =
                  s.estado === 'resuelto'    ? { background: '#dcfce7', color: '#16a34a' } :
                  s.estado === 'en_progreso' ? { background: '#dbeafe', color: '#2563ae' } :
                  s.estado === 'cancelado'   ? { background: '#f1f5f9', color: '#64748b' } :
                                               { background: '#fef3c7', color: '#d97706' }
                const prioridadStyle =
                  s.prioridad === 'urgente' ? { background: '#fee2e2', color: '#dc2626' } :
                  s.prioridad === 'alta'    ? { background: '#ffedd5', color: '#ea580c' } :
                  s.prioridad === 'media'   ? { background: '#fef3c7', color: '#d97706' } :
                                              { background: '#f1f5f9', color: '#64748b' }

                return (
                  <div
                    key={s.id}
                    className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.categoria}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={prioridadStyle}
                      >
                        {s.prioridad}
                      </span>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                        style={estadoStyle}
                      >
                        {s.estado.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-300 text-center pb-2">
        Datos actualizados al 27 de mayo de 2026 · Propify v1.0
      </p>
    </div>
  )
}
