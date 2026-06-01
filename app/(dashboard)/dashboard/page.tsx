import {
  Building2,
  Users,
  AlertTriangle,
  Wrench,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  BarChart3,
  PieChart,
  Receipt,
  Send,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getDashboardData, formatCLP } from '@/lib/db'
import { getUsuarioActual } from '@/lib/auth-helpers'
import type { ActividadReciente } from '@/types'

export const metadata: Metadata = {
  title: 'Dashboard',
}

// ─── Helpers de config ────────────────────────────────────────
const tipoActividadConfig = {
  pago:      { emoji: '💰', bg: '#dcfce7', color: '#16a34a', label: 'Pago' },
  solicitud: { emoji: '🔧', bg: '#fef3c7', color: '#d97706', label: 'Mantención' },
  circular:  { emoji: '📢', bg: '#dbeafe', color: '#2563eb', label: 'Circular' },
  visita:    { emoji: '🚪', bg: '#f3e8ff', color: '#9333ea', label: 'Visita' },
  paquete:   { emoji: '📦', bg: '#fce7f3', color: '#db2777', label: 'Paquete' },
  reserva:   { emoji: '📅', bg: '#ecfdf5', color: '#059669', label: 'Reserva' },
  mora:      { emoji: '⚠️', bg: '#fee2e2', color: '#dc2626', label: 'Mora' },
}

const estadoPagoConfig = {
  pagado:    { icon: CheckCircle, color: '#16a34a', bg: '#dcfce7', label: 'Pagado' },
  pendiente: { icon: Clock,       color: '#d97706', bg: '#fef3c7', label: 'Pendiente' },
  vencido:   { icon: XCircle,     color: '#dc2626', bg: '#fee2e2', label: 'Vencido' },
  parcial:   { icon: AlertCircle, color: '#9333ea', bg: '#f3e8ff', label: 'Parcial' },
}

const CAT_COLORS: Record<string, string> = {
  'Plomería':     '#06b6d4',
  'Ascensor':     '#8b5cf6',
  'Electricidad': '#f59e0b',
  'Mantención':   '#10b981',
  'Climatización':'#ec4899',
}

// ─── Componentes de visualización ────────────────────────────

/** Barra horizontal con label + progreso + valor */
function BarraH({
  label, valor, maxValor, color,
}: {
  label: string; valor: number; maxValor: number; color: string
}) {
  const pct = maxValor > 0 ? (valor / maxValor) * 100 : 0
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="text-xs shrink-0 truncate"
        style={{ width: 90, color: '#94a3b8' }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(51,65,85,0.6)' }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span
        className="text-xs font-bold shrink-0 w-4 text-right"
        style={{ color }}
      >
        {valor}
      </span>
    </div>
  )
}

/** Gráfico de barras verticales con SVG */
function GraficoBarras({
  datos,
}: {
  datos: { label: string; valor: number }[]
}) {
  const max     = Math.max(...datos.map(d => d.valor), 1)
  const W       = 320
  const H       = 148
  const PAD_T   = 28
  const PAD_B   = 22
  const PAD_H   = 10
  const chartW  = W - PAD_H * 2
  const chartH  = H - PAD_T - PAD_B
  const n       = datos.length
  const gap     = 14
  const barW    = (chartW - gap * (n - 1)) / n

  const COLORES = ['#1e3a5f', '#2563ae', '#3b82f6', '#60a5fa']

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <line
        x1={PAD_H} y1={PAD_T + chartH}
        x2={W - PAD_H} y2={PAD_T + chartH}
        stroke="rgba(51,65,85,0.6)" strokeWidth={1}
      />
      {datos.map((d, i) => {
        const barH  = (d.valor / max) * chartH
        const x     = PAD_H + i * (barW + gap)
        const y     = PAD_T + chartH - barH
        const color = COLORES[i] ?? COLORES[COLORES.length - 1]
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={5} fill={color} />
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9} fontWeight="700" fill="#94a3b8">
              {formatCLP(d.valor)}
            </text>
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fontSize={9} fill="#475569">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/** Gráfico donut con segmentos coloreados */
function GraficoDonut({
  segmentos,
  centro,
  size = 120,
}: {
  segmentos: { label: string; valor: number; color: string }[]
  centro?: { linea1: string; linea2: string }
  size?: number
}) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0)
  const r     = size * 0.367   // ~44 para size=120
  const cx    = size / 2
  const cy    = size / 2
  const circ  = 2 * Math.PI * r
  const sw    = size * 0.117   // ~14 para size=120

  // Pre-calcular posición de cada segmento
  let acum = 0
  const segs = segmentos.map(seg => {
    const len        = total > 0 ? (seg.valor / total) * circ : 0
    const dashoffset = -acum
    acum += len
    return { ...seg, len, dashoffset }
  })

  const fontSize1 = size * 0.108
  const fontSize2 = size * 0.067

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(51,65,85,0.6)" strokeWidth={sw} />
      {segs.map((seg, i) => (
        <circle
          key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={seg.color} strokeWidth={sw}
          strokeDasharray={`${seg.len} ${circ - seg.len}`}
          strokeDashoffset={seg.dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      {centro && (
        <>
          <text x={cx} y={cy - fontSize1 * 0.3} textAnchor="middle" fontSize={fontSize1} fontWeight="700" fill="#f1f5f9">
            {centro.linea1}
          </text>
          <text x={cx} y={cy + fontSize1 * 0.9} textAnchor="middle" fontSize={fontSize2} fill="#64748b">
            {centro.linea2}
          </text>
        </>
      )}
    </svg>
  )
}

// ─── KPI Card dark glass ──────────────────────────────────────
function KPICard({
  titulo, valor, subtitulo, icon: Icon, color, tendencia, tendenciaValor,
}: {
  titulo: string
  valor: string
  subtitulo?: string
  icon: React.ElementType
  color: string
  bg?: string
  tendencia?: 'up' | 'down' | 'neutral'
  tendenciaValor?: string
}) {
  return (
    <div
      className="rounded-2xl p-5 border transition-all duration-200 hover:border-opacity-100 group"
      style={{
        background:           'rgba(30,41,59,0.6)',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor:          'rgba(51,65,85,0.8)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl"
          style={{ background: `${color}1a` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {tendencia && tendenciaValor && (
          <div
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: tendencia === 'up' ? '#4ade80' : tendencia === 'down' ? '#f87171' : '#64748b' }}
          >
            {tendencia === 'up'   && <TrendingUp   className="w-3.5 h-3.5" />}
            {tendencia === 'down' && <TrendingDown  className="w-3.5 h-3.5" />}
            <span>{tendenciaValor}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold leading-none" style={{ color: '#f1f5f9' }}>{valor}</p>
      <p className="text-sm font-medium mt-1" style={{ color: '#94a3b8' }}>{titulo}</p>
      {subtitulo && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{subtitulo}</p>}
    </div>
  )
}

// ─── Actividad reciente ───────────────────────────────────────
function ActividadItem({ item }: { item: ActividadReciente }) {
  const cfg = tipoActividadConfig[item.tipo]
  return (
    <div className="flex items-start gap-3 py-3 border-b" style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
      <span
        className="flex items-center justify-center w-9 h-9 rounded-xl text-base shrink-0"
        style={{ background: `${cfg.color}18` }}
      >
        {cfg.emoji}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>{item.titulo}</p>
          {item.monto && (
            <span className="text-sm font-bold shrink-0" style={{ color: item.tipo === 'mora' ? '#f87171' : '#4ade80' }}>
              {formatCLP(item.monto)}
            </span>
          )}
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: '#64748b' }}>{item.descripcion}</p>
        <div className="flex items-center gap-2 mt-1">
          {item.unidad && (
            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(51,65,85,0.6)', color: '#94a3b8' }}>
              {item.unidad}
            </span>
          )}
          <span className="text-xs" style={{ color: '#475569' }}>{item.tiempo}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers de fecha ──────────────────────────────────────────
const DIAS_SEMANA  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES_LARGO  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
const MESES_CORTO  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// ─── Página principal ─────────────────────────────────────────
export default async function DashboardPage() {
  const { edificioId, nombre: nombreUsuario } = await getUsuarioActual()
  const { kpis: kpi, actividad, gastos, pagos, solicitudes: sols, espacios, edificio } =
    await getDashboardData(edificioId)

  // ── Fecha y hora dinámica (Chile ≈ UTC-4 en invierno) ──────
  const ahora        = new Date()
  const horaChile    = (ahora.getUTCHours() - 4 + 24) % 24
  const saludo       = horaChile < 12 ? 'Buenos días' : horaChile < 19 ? 'Buenas tardes' : 'Buenas noches'
  const emojiSaludo  = horaChile < 12 ? '👋' : horaChile < 19 ? '☀️' : '🌙'
  const diaNum       = ahora.getUTCDate()
  const mesActual    = ahora.getUTCMonth() + 1   // 1-12
  const añoActual    = ahora.getUTCFullYear()
  const diaSemana    = DIAS_SEMANA[ahora.getUTCDay()]
  const mesNombre    = MESES_LARGO[mesActual - 1]
  const mesCapital   = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)
  const fechaLarga   = `${diaSemana}, ${diaNum} de ${mesNombre} de ${añoActual}`
  const fechaCorta   = `${diaNum.toString().padStart(2,'0')}/${mesActual.toString().padStart(2,'0')}`

  // Nombre del edificio desde Supabase
  const nombreEdificio = edificio?.nombre ?? 'Edificio'

  // ── KPIs básicos ────────────────────────────────────────────
  const ocupacion  = kpi.totalUnidades > 0 ? Math.round((kpi.unidadesOcupadas / kpi.totalUnidades) * 100) : 0
  const pagadosPct = kpi.totalUnidades > 0 ? Math.round(((kpi.totalUnidades - kpi.morosos) / kpi.totalUnidades) * 100) : 0

  // Estado gastos comunes para mini-reporte (lado derecho)
  const gcPorEstado = {
    pagado:    gastos.filter(g => g.estadoPago === 'pagado').length,
    pendiente: gastos.filter(g => g.estadoPago === 'pendiente').length,
    vencido:   gastos.filter(g => g.estadoPago === 'vencido').length,
    parcial:   gastos.filter(g => g.estadoPago === 'parcial').length,
  }

  // Solicitudes urgentes activas (real)
  const solsUrgentes = sols.filter(
    s => (s.prioridad === 'urgente' || s.prioridad === 'alta') && s.estado !== 'resuelto',
  )

  // ── Analítica: últimos 3 meses dinámicos ──────────────────
  // Soporta cruce de año (p. ej. nov/dic/ene)
  const ultimosMeses = [-2, -1, 0].map(offset => {
    let mes = mesActual + offset
    let año = añoActual
    if (mes <= 0) { mes += 12; año -= 1 }
    return { mes, año, label: MESES_CORTO[mes - 1] }
  })

  // Ingresos por mes (últimos 3 meses)
  const ingresosMensuales = ultimosMeses.map(({ mes, año, label }) => ({
    label,
    valor: pagos
      .filter(p => p.mes === mes && p.año === año)
      .reduce((s, p) => s + p.monto, 0),
  }))

  // Recaudación del mes actual
  const totalEsperado     = gastos.reduce((s, g) => s + g.montoTotal, 0)
  const totalCobradoMes   = pagos
    .filter(p => p.mes === mesActual && p.año === añoActual)
    .reduce((s, p) => s + p.monto, 0)
  const totalPendienteMes = Math.max(0, totalEsperado - totalCobradoMes)
  const pctCobrado        = totalEsperado > 0
    ? Math.round((totalCobradoMes / totalEsperado) * 100)
    : 0

  // Acumulado últimos 3 meses
  const totalUltimos3 = ingresosMensuales.reduce((s, m) => s + m.valor, 0)

  // Variación mes a mes (mes actual vs mes anterior)
  const ingMesAnt = ingresosMensuales[1].valor
  const ingMesAct = ingresosMensuales[2].valor
  const varMes    = ingMesAct - ingMesAnt
  const varMesPct = ingMesAnt > 0
    ? Math.round((varMes / ingMesAnt) * 100)
    : 0

  // Label del periodo
  const labelPeriodo = `${ultimosMeses[0].label}–${ultimosMeses[2].label}`

  // Solicitudes por estado
  const solPorEstado = [
    { label: 'Pendiente',   valor: sols.filter(s => s.estado === 'pendiente').length,   color: '#f59e0b' },
    { label: 'En progreso', valor: sols.filter(s => s.estado === 'en_progreso').length, color: '#3b82f6' },
    { label: 'Resuelto',    valor: sols.filter(s => s.estado === 'resuelto').length,    color: '#10b981' },
  ]

  // Solicitudes por categoría
  const catMap: Record<string, number> = {}
  sols.forEach(s => {
    catMap[s.categoria] = (catMap[s.categoria] ?? 0) + 1
  })
  const solPorCategoria = Object.entries(catMap)
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor)
  const maxSolCat = Math.max(...solPorCategoria.map(s => s.valor), 1)

  // Espacios comunes por estado
  const espaciosEstado = {
    disponible: espacios.filter(e => e.estado === 'disponible').length,
    reservado:  espacios.filter(e => e.estado === 'reservado').length,
    ocupado:    espacios.filter(e => e.estado === 'ocupado').length,
    fuera:      espacios.filter(e => e.estado === 'fuera_servicio').length,
  }

  // Constante reutilizable para glass cards
  const GLASS = {
    background:           'rgba(30,41,59,0.6)',
    backdropFilter:       'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderColor:          'rgba(51,65,85,0.8)',
  } as const
  const DIVIDER = { borderColor: 'rgba(51,65,85,0.5)' }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── HERO: Recaudación del mes + acciones rápidas ── */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          background:  'linear-gradient(135deg, rgba(30,58,95,0.95) 0%, rgba(15,35,65,0.95) 100%)',
          borderColor: 'rgba(37,99,174,0.4)',
        }}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {saludo}, {nombreUsuario} {emojiSaludo}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#94b4d4' }}>{fechaLarga}</p>
          </div>
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Sistema operativo
          </span>
        </div>

        {/* Barra de recaudación */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
              Cobro {mesCapital} {añoActual}
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: pctCobrado >= 80 ? '#4ade80' : pctCobrado >= 50 ? '#fbbf24' : '#f87171' }}
            >
              {pctCobrado}% recaudado
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pctCobrado}%`,
                background: pctCobrado >= 80
                  ? 'linear-gradient(90deg,#16a34a,#4ade80)'
                  : pctCobrado >= 50
                  ? 'linear-gradient(90deg,#d97706,#fbbf24)'
                  : 'linear-gradient(90deg,#dc2626,#f87171)',
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs" style={{ color: '#94b4d4' }}>
            <span>
              ✓ Cobrado:{' '}
              <span className="font-semibold text-white">{formatCLP(totalCobradoMes)}</span>
            </span>
            <span>
              Pendiente:{' '}
              <span className="font-semibold" style={{ color: '#f87171' }}>{formatCLP(totalPendienteMes)}</span>
            </span>
          </div>
        </div>

        {/* Botones de acción rápida */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/gastos"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: '#2563ae', color: 'white' }}
          >
            <Receipt className="w-4 h-4" />
            Gastos Comunes
          </Link>
          <Link
            href="/gastos"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Send className="w-4 h-4" />
            Enviar Liquidaciones
          </Link>
          {kpi.morosos > 0 && (
            <Link
              href="/morosos"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <AlertTriangle className="w-4 h-4" />
              {kpi.morosos} Moroso{kpi.morosos !== 1 ? 's' : ''}
            </Link>
          )}
          <Link
            href="/reportes"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#94b4d4', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Zap className="w-4 h-4" />
            Reportes
          </Link>
        </div>
      </div>

      {/* ── KPI Cards fila 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard titulo="Total Unidades"        valor={`${kpi.unidadesOcupadas}/${kpi.totalUnidades}`} subtitulo={`${ocupacion}% de ocupación`}                                                                                   icon={Building2}      color="#3b82f6" />
        <KPICard titulo="Ingresos del Mes"       valor={formatCLP(kpi.ingresosMes)}                      subtitulo={`${pagadosPct}% de cobros al día`}                                                                            icon={DollarSign}     color="#4ade80" tendencia={varMes >= 0 ? 'up' : 'down'} tendenciaValor={`${varMes >= 0 ? '+' : ''}${varMesPct}% vs mes ant.`} />
        <KPICard titulo="Morosos"                valor={String(kpi.morosos)}                              subtitulo={kpi.morosos === 0 ? '✓ Sin deudas pendientes' : formatCLP(kpi.montoMoroso) + ' en mora'}                    icon={AlertTriangle}  color={kpi.morosos === 0 ? '#4ade80' : '#f87171'} />
        <KPICard titulo="Mantenciones"           valor={String(kpi.solicitudesPendientes)}                subtitulo={`${solsUrgentes.length} urgente${solsUrgentes.length !== 1 ? 's' : ''}`}                                    icon={Wrench}         color="#fbbf24" />
      </div>

      {/* ── KPI Cards fila 2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard titulo="Fondo de Reserva"  valor={formatCLP(kpi.fondoReserva)}          subtitulo={`Actualizado al ${fechaCorta}`}                                                                                              icon={TrendingUp}  color="#34d399" />
        <KPICard titulo="Visitas Hoy"       valor={String(kpi.visitasHoy)}               subtitulo={kpi.visitasHoy > 0 ? `${kpi.visitasHoy} registro${kpi.visitasHoy !== 1 ? 's' : ''} de entrada` : 'Sin visitas hoy'}       icon={Users}       color="#a78bfa" />
        <KPICard titulo="Paquetes"          valor={String(kpi.paquetesPendientes)}        subtitulo={kpi.paquetesPendientes === 0 ? 'Sin paquetes pendientes' : 'Por retirar en conserjería'}                                   icon={Package}     color="#f472b6" />
        <KPICard titulo="Reservas Hoy"      valor={String(kpi.reservasHoy)}               subtitulo={kpi.reservasHoy > 0 ? `${kpi.reservasHoy} espacio${kpi.reservasHoy !== 1 ? 's' : ''} reservado${kpi.reservasHoy !== 1 ? 's' : ''}` : 'Sin reservas hoy'} icon={Calendar} color="#38bdf8" />
      </div>

      {/* ── Analítica ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'rgba(59,130,246,0.2)' }}>
            <Activity className="w-4 h-4" style={{ color: '#60a5fa' }} />
          </div>
          <h2 className="font-bold" style={{ color: '#f1f5f9' }}>Analítica del Mes</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
            {mesCapital} {añoActual}
          </span>
        </div>

        {/* Fila A: Ingresos + Donut */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          <div className="xl:col-span-2 rounded-2xl border p-5" style={GLASS}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Ingresos Mensuales</h3>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Últimos 3 meses · Pagos completados</p>
              </div>
              <BarChart3 className="w-4 h-4" style={{ color: '#334155' }} />
            </div>
            <GraficoBarras datos={ingresosMensuales} />
            <div className="flex items-center justify-between mt-2 pt-3 border-t" style={DIVIDER}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#94a3b8' }}>
                {varMes >= 0
                  ? <TrendingUp className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />
                  : <TrendingDown className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
                }
                <span>
                  {ultimosMeses[2].label} vs {ultimosMeses[1].label}:{' '}
                  <span className="font-semibold" style={{ color: varMes >= 0 ? '#4ade80' : '#f87171' }}>
                    {varMes >= 0 ? '+' : ''}{varMesPct}%
                  </span>
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#64748b' }}>Total {labelPeriodo}</p>
                <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{formatCLP(totalUltimos3)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={GLASS}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold" style={{ color: '#f1f5f9' }}>Recaudación</h3>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Gastos comunes {mesNombre}</p>
              </div>
              <PieChart className="w-4 h-4" style={{ color: '#334155' }} />
            </div>
            <div className="flex items-center gap-4">
              <GraficoDonut
                size={110}
                segmentos={[
                  { label: 'Cobrado',   valor: totalCobradoMes,   color: '#10b981' },
                  { label: 'Pendiente', valor: totalPendienteMes, color: '#334155' },
                ]}
                centro={{ linea1: `${pctCobrado}%`, linea2: 'cobrado' }}
              />
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                    <p className="text-xs" style={{ color: '#94a3b8' }}>Cobrado</p>
                  </div>
                  <p className="text-sm font-bold ml-3.5" style={{ color: '#4ade80' }}>{formatCLP(totalCobradoMes)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                    <p className="text-xs" style={{ color: '#94a3b8' }}>Por cobrar</p>
                  </div>
                  <p className="text-sm font-bold ml-3.5" style={{ color: '#fbbf24' }}>{formatCLP(totalPendienteMes)}</p>
                </div>
                <div className="pt-2 border-t" style={DIVIDER}>
                  <p className="text-xs" style={{ color: '#64748b' }}>Esperado total</p>
                  <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>{formatCLP(totalEsperado)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fila B: Operacional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="rounded-2xl border p-5" style={GLASS}>
            <h3 className="font-semibold mb-4" style={{ color: '#f1f5f9' }}>Estado de Solicitudes</h3>
            <div className="flex items-center gap-4">
              <GraficoDonut size={96} segmentos={solPorEstado} centro={{ linea1: String(sols.length), linea2: 'total' }} />
              <div className="flex-1 space-y-2.5">
                {solPorEstado.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-xs" style={{ color: '#94a3b8' }}>{s.label}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: s.color }}>{s.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={GLASS}>
            <h3 className="font-semibold mb-4" style={{ color: '#f1f5f9' }}>Solicitudes por Categoría</h3>
            <div className="space-y-3">
              {solPorCategoria.map(s => (
                <BarraH key={s.label} label={s.label} valor={s.valor} maxValor={maxSolCat} color={CAT_COLORS[s.label] ?? '#94a3b8'} />
              ))}
            </div>
            <p className="text-xs mt-4 pt-3 border-t" style={{ ...DIVIDER, color: '#475569' }}>
              {sols.length} solicitudes · {solPorCategoria.length} categorías
            </p>
          </div>

          <div className="rounded-2xl border p-5" style={GLASS}>
            <h3 className="font-semibold mb-4" style={{ color: '#f1f5f9' }}>Espacios Comunes</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Disponibles',    valor: espaciosEstado.disponible, color: '#4ade80' },
                { label: 'Ocupados',       valor: espaciosEstado.ocupado,    color: '#60a5fa' },
                { label: 'Reservados',     valor: espaciosEstado.reservado,  color: '#a78bfa' },
                { label: 'Fuera servicio', valor: espaciosEstado.fuera,      color: '#f87171' },
              ].map(e => (
                <div key={e.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: `${e.color}14` }}>
                  <span className="text-xs font-medium" style={{ color: e.color }}>{e.label}</span>
                  <span className="text-sm font-bold" style={{ color: e.color }}>{e.valor}</span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3 pt-3 border-t" style={{ ...DIVIDER, color: '#475569' }}>
              Total: {espacios.length} espacios del edificio
            </p>
          </div>
        </div>
      </div>

      {/* ── Actividad + Panel derecho ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Actividad reciente */}
        <div className="xl:col-span-2 rounded-2xl border" style={GLASS}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={DIVIDER}>
            <h2 className="font-bold" style={{ color: '#f1f5f9' }}>Actividad Reciente</h2>
            <Link href="/reportes" className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#60a5fa' }}>
              Ver todo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="px-5">
            {actividad.length === 0 ? (
              <div className="py-10 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2" style={{ color: '#334155' }} />
                <p className="text-sm" style={{ color: '#64748b' }}>Sin actividad reciente</p>
              </div>
            ) : (
              actividad.map((item: ActividadReciente) => (
                <ActividadItem key={item.id} item={item} />
              ))
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">

          {/* Estado gastos comunes */}
          <div className="rounded-2xl border p-5" style={GLASS}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ color: '#f1f5f9' }}>Gastos Comunes</h2>
              <span className="text-xs font-medium" style={{ color: '#64748b' }}>{mesCapital} {añoActual}</span>
            </div>
            <div className="space-y-2.5">
              {(Object.entries(gcPorEstado) as [keyof typeof estadoPagoConfig, number][]).map(([estado, count]) => {
                const cfg  = estadoPagoConfig[estado]
                const Icon = cfg.icon
                const pct  = Math.round((count / (gastos.length || 1)) * 100)
                return (
                  <div key={estado} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: `${cfg.color}18` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium" style={{ color: '#94a3b8' }}>{cfg.label}</span>
                        <span className="font-bold" style={{ color: cfg.color }}>{count}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(51,65,85,0.6)' }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Link
              href="/gastos"
              className="flex items-center justify-center gap-1.5 w-full mt-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'rgba(37,99,174,0.2)', color: '#60a5fa', border: '1px solid rgba(37,99,174,0.3)' }}
            >
              Ver detalle completo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Solicitudes urgentes */}
          <div className="rounded-2xl border p-5" style={GLASS}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ color: '#f1f5f9' }}>Solicitudes Urgentes</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                {solsUrgentes.length} activa{solsUrgentes.length !== 1 ? 's' : ''}
              </span>
            </div>
            {solsUrgentes.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm" style={{ color: '#4ade80' }}>✓ Sin solicitudes urgentes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {solsUrgentes.slice(0, 3).map(s => (
                  <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: s.prioridad === 'urgente' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)' }}>
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: s.prioridad === 'urgente' ? '#f87171' : '#fbbf24' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#f1f5f9' }}>{s.titulo}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#64748b' }}>{s.descripcion}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-medium capitalize" style={{ background: s.prioridad === 'urgente' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: s.prioridad === 'urgente' ? '#f87171' : '#fbbf24' }}>
                          {s.prioridad}
                        </span>
                        <span className="text-xs" style={{ color: '#475569' }}>
                          {s.estado === 'en_progreso' ? '🔄 En progreso' : '⏳ Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              href="/mantenciones"
              className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.8)' }}
            >
              Ver todas las solicitudes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
