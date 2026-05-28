'use client'

/**
 * FacturacionView.tsx — Fase 30
 * Gestión y generación automática de cobros mensuales.
 * - Config: día vencimiento, % fondo reserva, auto-generar
 * - Generar cobros del mes actual para todas las unidades
 * - Historial de generaciones
 */

import { useState, useMemo } from 'react'
import {
  Zap, Settings2, History, ChevronLeft, ChevronRight,
  Play, CheckCircle2, AlertCircle, Loader2, Download,
  Building2, CalendarDays, Percent, ToggleLeft, ToggleRight,
  Receipt,
} from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { formatCLP }       from '@/lib/db'
import type { ConfigFacturacion, GeneracionFacturacion, Unidad } from '@/types'

// ─── Props ────────────────────────────────────────────────────
interface Props {
  config:         ConfigFacturacion | null
  generaciones:   GeneracionFacturacion[]
  unidades:       Unidad[]
  edificioNombre: string
  edificioId:     string
}

// ─── Helpers ──────────────────────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function mesNombre(mes: number) { return MESES[mes - 1] ?? `M${mes}` }

function calcVencimiento(mes: number, anio: number, dia: number): string {
  // vencimiento = mes siguiente al cobro
  let mesVenc = mes + 1
  let anioVenc = anio
  if (mesVenc > 12) { mesVenc = 1; anioVenc++ }
  const d = String(dia).padStart(2, '0')
  const m = String(mesVenc).padStart(2, '0')
  return `${anioVenc}-${m}-${d}`
}

// ─── Componente ───────────────────────────────────────────────
export default function FacturacionView({
  config: configInicial,
  generaciones: genInicial,
  unidades,
  edificioNombre,
  edificioId,
}: Props) {
  const hoy        = new Date()
  const mesActual  = hoy.getMonth() + 1
  const anioActual = hoy.getFullYear()

  // ── Config state ──────────────────────────────────────────
  const defaultCfg = {
    diaVencimiento:         configInicial?.diaVencimiento         ?? 10,
    porcentajeFondoReserva: configInicial?.porcentajeFondoReserva ?? 5,
    autoGenerar:            configInicial?.autoGenerar            ?? false,
    diaGeneracion:          configInicial?.diaGeneracion          ?? 1,
  }

  const [cfg,          setCfg]          = useState(defaultCfg)
  const [guardandoCfg, setGuardandoCfg] = useState(false)
  const [cfgOk,        setCfgOk]        = useState(false)

  // ── Generaciones state ────────────────────────────────────
  const [generaciones, setGeneraciones] = useState<GeneracionFacturacion[]>(genInicial)
  const [generando,    setGenerando]    = useState(false)
  const [genError,     setGenError]     = useState('')
  const [genOk,        setGenOk]        = useState('')

  // ── Tab ───────────────────────────────────────────────────
  const [tab, setTab] = useState<'generar' | 'config' | 'historial'>('generar')

  // ── Datos derivados ───────────────────────────────────────
  const unidadesOcupadas = useMemo(
    () => unidades.filter(u => u.estado === 'ocupado'),
    [unidades],
  )

  const yaGenerado = useMemo(
    () => generaciones.some(g => g.mes === mesActual && g.anio === anioActual),
    [generaciones, mesActual, anioActual],
  )

  const montoEstimado = useMemo(() => {
    const factor = 1 + cfg.porcentajeFondoReserva / 100
    return unidadesOcupadas.reduce((s, u) => s + u.gastosComunesMonto * factor, 0)
  }, [unidadesOcupadas, cfg.porcentajeFondoReserva])

  // ── Guardar config ────────────────────────────────────────
  const guardarConfig = async () => {
    setGuardandoCfg(true)
    setCfgOk(false)

    const payload = {
      edificioId,
      diaVencimiento:         cfg.diaVencimiento,
      porcentajeFondoReserva: cfg.porcentajeFondoReserva,
      autoGenerar:            cfg.autoGenerar,
      diaGeneracion:          cfg.diaGeneracion,
      updated_at:             new Date().toISOString(),
    }

    if (configInicial?.id) {
      await supabaseBrowser
        .from('config_facturacion')
        .update(payload)
        .eq('id', configInicial.id)
    } else {
      await supabaseBrowser
        .from('config_facturacion')
        .insert({ id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() })
    }

    setGuardandoCfg(false)
    setCfgOk(true)
    setTimeout(() => setCfgOk(false), 2500)
  }

  // ── Generar cobros del mes ────────────────────────────────
  const generarCobros = async () => {
    if (yaGenerado) return
    setGenError('')
    setGenOk('')
    setGenerando(true)

    try {
      const fechaVenc = calcVencimiento(mesActual, anioActual, cfg.diaVencimiento)
      const factor    = 1 + cfg.porcentajeFondoReserva / 100
      const now       = new Date().toISOString()

      const registros = unidadesOcupadas.map(u => ({
        id:                 crypto.randomUUID(),
        edificioId,
        unidadId:           u.id,
        mes:                mesActual,
        año:                anioActual,
        montoBase:          u.gastosComunesMonto,
        montoFondoReserva:  Math.round(u.gastosComunesMonto * (cfg.porcentajeFondoReserva / 100)),
        montoTotal:         Math.round(u.gastosComunesMonto * factor),
        estadoPago:         'pendiente',
        fechaVencimiento:   fechaVenc,
        creadoEn:           now,
      }))

      const { error } = await supabaseBrowser
        .from('gastos_comunes')
        .insert(registros)

      if (error) throw new Error(error.message)

      // Registrar generación
      const genId = crypto.randomUUID()
      await supabaseBrowser.from('generaciones_facturacion').insert({
        id:            genId,
        edificioId,
        mes:           mesActual,
        anio:          anioActual,
        totalUnidades: unidadesOcupadas.length,
        totalGenerado: registros.length,
        montoTotal:    Math.round(montoEstimado),
        creadoEn:      now,
      })

      // Optimistic update
      const nueva: GeneracionFacturacion = {
        id:            genId,
        edificioId,
        mes:           mesActual,
        anio:          anioActual,
        totalUnidades: unidadesOcupadas.length,
        totalGenerado: registros.length,
        montoTotal:    Math.round(montoEstimado),
        generadoPorId: null,
        creadoEn:      now,
      }
      setGeneraciones(prev => [nueva, ...prev])
      setGenOk(`✓ ${registros.length} cobros generados para ${mesNombre(mesActual)} ${anioActual}`)
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Error al generar cobros')
    } finally {
      setGenerando(false)
    }
  }

  // ── CSV historial ─────────────────────────────────────────
  const exportarCSV = () => {
    const bom  = '﻿'
    const cols = ['Mes','Año','Unidades','Cobros Generados','Monto Total','Generado']
    const rows = generaciones.map(g =>
      [mesNombre(g.mes), g.anio, g.totalUnidades, g.totalGenerado,
       g.montoTotal, new Date(g.creadoEn).toLocaleDateString('es-CL')].join(';'),
    )
    const csv  = bom + [cols.join(';'), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `facturacion_${edificioNombre.replace(/\s+/g,'_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── KPI Cards ─────────────────────────────────────────────
  const kpis = [
    {
      label:  'Unidades a cobrar',
      value:  `${unidadesOcupadas.length} / ${unidades.length}`,
      sub:    'ocupadas',
      color:  '#2563ae',
      bg:     '#eff6ff',
      Icon:   Building2,
    },
    {
      label:  'Monto estimado',
      value:  formatCLP(Math.round(montoEstimado)),
      sub:    `${mesNombre(mesActual)} ${anioActual}`,
      color:  '#16a34a',
      bg:     '#f0fdf4',
      Icon:   Receipt,
    },
    {
      label:  'Estado mes actual',
      value:  yaGenerado ? 'Generado' : 'Pendiente',
      sub:    yaGenerado ? 'cobros creados' : 'aún no generado',
      color:  yaGenerado ? '#16a34a' : '#d97706',
      bg:     yaGenerado ? '#f0fdf4' : '#fffbeb',
      Icon:   yaGenerado ? CheckCircle2 : AlertCircle,
    },
    {
      label:  'Generaciones totales',
      value:  String(generaciones.length),
      sub:    'histórico',
      color:  '#7c3aed',
      bg:     '#faf5ff',
      Icon:   History,
    },
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6" style={{ color: '#2563ae' }} />
            Facturación Automática
          </h1>
          <p className="text-gray-500 mt-1">{edificioNombre} · Generación de cobros mensuales</p>
        </div>
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ background: '#f1f5f9', color: '#64748b' }}
        >
          <Download className="w-4 h-4" /> Exportar historial
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, color, bg, Icon }) => (
          <div key={label} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon className="w-4.5 h-4.5" style={{ color, width: 18, height: 18 }} />
              </div>
              <p className="text-xs font-semibold text-gray-500 leading-tight">{label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { v: 'generar',   label: 'Generar cobros',  Icon: Play        },
          { v: 'config',    label: 'Configuración',   Icon: Settings2   },
          { v: 'historial', label: 'Historial',       Icon: History     },
        ] as const).map(({ v, label, Icon }) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab === v
              ? { background: '#1e3a5f', color: 'white' }
              : { background: '#f1f5f9', color: '#64748b' }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ════ GENERAR ════ */}
      {tab === 'generar' && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5" style={{ borderColor: '#e2e8f0' }}>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              Generar cobros — {mesNombre(mesActual)} {anioActual}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Crea los gastos comunes pendientes para todas las unidades ocupadas del mes.
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="text-sm font-semibold text-gray-700">Resumen de generación</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Período</p>
                <p className="font-semibold text-gray-900">{mesNombre(mesActual)} {anioActual}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Vencimiento</p>
                <p className="font-semibold text-gray-900">
                  día {cfg.diaVencimiento} de {mesNombre(mesActual === 12 ? 1 : mesActual + 1)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Unidades</p>
                <p className="font-semibold text-gray-900">{unidadesOcupadas.length} ocupadas</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Fondo reserva</p>
                <p className="font-semibold text-gray-900">{cfg.porcentajeFondoReserva}%</p>
              </div>
            </div>
            <div className="border-t pt-3" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Monto total estimado</p>
                <p className="text-lg font-bold" style={{ color: '#2563ae' }}>
                  {formatCLP(Math.round(montoEstimado))}
                </p>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {genOk && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {genOk}
            </div>
          )}
          {genError && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {genError}
            </div>
          )}
          {yaGenerado && !genOk && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
              style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              Ya existen cobros generados para {mesNombre(mesActual)} {anioActual}.
            </div>
          )}

          <button
            onClick={generarCobros}
            disabled={generando || yaGenerado}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: yaGenerado ? '#94a3b8' : '#2563ae' }}
          >
            {generando
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</>
              : yaGenerado
                ? <><CheckCircle2 className="w-4 h-4" /> Ya generado</>
                : <><Play className="w-4 h-4" /> Generar {unidadesOcupadas.length} cobros</>
            }
          </button>
        </div>
      )}

      {/* ════ CONFIG ════ */}
      {tab === 'config' && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5" style={{ borderColor: '#e2e8f0' }}>
          <h2 className="font-bold text-gray-900 text-lg">Parámetros de facturación</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Día vencimiento */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" style={{ color: '#2563ae' }} />
                Día de vencimiento
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCfg(p => ({ ...p, diaVencimiento: Math.max(1, p.diaVencimiento - 1) }))}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="w-16 text-center font-bold text-gray-900 text-lg">
                  {cfg.diaVencimiento}
                </span>
                <button
                  onClick={() => setCfg(p => ({ ...p, diaVencimiento: Math.min(28, p.diaVencimiento + 1) }))}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm text-gray-400">del mes siguiente</span>
              </div>
            </div>

            {/* % Fondo reserva */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Percent className="w-4 h-4" style={{ color: '#7c3aed' }} />
                Fondo de reserva
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCfg(p => ({ ...p, porcentajeFondoReserva: Math.max(0, p.porcentajeFondoReserva - 1) }))}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="w-16 text-center font-bold text-gray-900 text-lg">
                  {cfg.porcentajeFondoReserva}%
                </span>
                <button
                  onClick={() => setCfg(p => ({ ...p, porcentajeFondoReserva: Math.min(30, p.porcentajeFondoReserva + 1) }))}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm text-gray-400">del monto base</span>
              </div>
            </div>

            {/* Auto-generar */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                {cfg.autoGenerar
                  ? <ToggleRight className="w-4 h-4" style={{ color: '#16a34a' }} />
                  : <ToggleLeft  className="w-4 h-4 text-gray-400" />
                }
                Generación automática
              </label>
              <button
                onClick={() => setCfg(p => ({ ...p, autoGenerar: !p.autoGenerar }))}
                className="relative w-11 h-6 rounded-full transition-all duration-200"
                style={{ background: cfg.autoGenerar ? '#16a34a' : '#e2e8f0' }}
              >
                <div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                  style={{ left: cfg.autoGenerar ? '24px' : '4px' }}
                />
              </button>
              <p className="text-xs text-gray-400 mt-1">
                {cfg.autoGenerar
                  ? 'Se generarán automáticamente el día indicado'
                  : 'Deberás generarlos manualmente cada mes'}
              </p>
            </div>

            {/* Día generación (solo si autoGenerar) */}
            {cfg.autoGenerar && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" style={{ color: '#16a34a' }} />
                  Día de generación automática
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCfg(p => ({ ...p, diaGeneracion: Math.max(1, p.diaGeneracion - 1) }))}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="w-16 text-center font-bold text-gray-900 text-lg">
                    {cfg.diaGeneracion}
                  </span>
                  <button
                    onClick={() => setCfg(p => ({ ...p, diaGeneracion: Math.min(28, p.diaGeneracion + 1) }))}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="text-sm text-gray-400">de cada mes</span>
                </div>
              </div>
            )}
          </div>

          {cfgOk && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Configuración guardada correctamente
            </div>
          )}

          <button
            onClick={guardarConfig}
            disabled={guardandoCfg}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: '#2563ae' }}
          >
            {guardandoCfg
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
              : <><Settings2 className="w-4 h-4" /> Guardar configuración</>
            }
          </button>
        </div>
      )}

      {/* ════ HISTORIAL ════ */}
      {tab === 'historial' && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
            <h2 className="font-bold text-gray-900">Historial de generaciones</h2>
            <p className="text-sm text-gray-400 mt-0.5">{generaciones.length} registros</p>
          </div>

          {generaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Aún no hay generaciones registradas</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {['Período','Unidades','Cobros','Monto Total','Fecha'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                {generaciones.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-900">
                        {mesNombre(g.mes)} {g.anio}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{g.totalUnidades}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: '#dbeafe', color: '#2563ae' }}>
                        {g.totalGenerado} cobros
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: '#16a34a' }}>
                      {formatCLP(g.montoTotal)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {new Date(g.creadoEn).toLocaleDateString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
