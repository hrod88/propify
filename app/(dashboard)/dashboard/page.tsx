import {
  Building2,
  AlertTriangle,
  Wrench,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  BarChart3,
  PieChart,
} from 'lucide-react'
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
        className="text-xs shrink-0 text-gray-600 truncate"
        style={{ width: 90 }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: '#f1f5f9' }}
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

  const COLORES = ['#bfdbfe', '#60a5fa', '#2563ae', '#1e3a5f']

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <line
        x1={PAD_H} y1={PAD_T + chartH}
        x2={W - PAD_H} y2={PAD_T + chartH}
        stroke="#e2e8f0" strokeWidth={1}
      />
      {datos.map((d, i) => {
        const barH  = (d.valor / max) * chartH
        const x     = PAD_H + i * (barW + gap)
        const y     = PAD_T + chartH - barH
        const color = COLORES[i] ?? COLORES[COLORES.length - 1]
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={5} fill={color} />
            <text
              x={x + barW / 2} y={y - 5}
              textAnchor="middle" fontSize={9} fontWeight="700" fill="#374151"
            >
              {formatCLP(d.valor)}
            </text>
            <text
              x={x + barW / 2} y={H - 4}
              textAnchor="middle" fontSize={9} fill="#94a3b8"
            >
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
  const r     = size * 0.367
  const cx    = size / 2
  const cy    = size / 2
  const circ  = 2 * Math.PI * r
  const sw    = size * 0.117

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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
      {segs.map((seg, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={sw}
          strokeDasharray={`${seg.len} ${circ - seg.len}`}
          strokeDashoffset={seg.dashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      {centro && (
        <>
          <text x={cx} y={cy - fontSize1 * 0.3} textAnchor="middle" fontSize={fontSize1} fontWeight="700" fill="#1e293b">
            {centro.linea1}
          </text>
          <text x={cx} y={cy + fontSize1 * 0.9} textAnchor="middle" fontSize={fontSize2} fill="#94a3b8">
            {centro.linea2}
          </text>
        </>
      )}
    </svg>
  )
}

// ─── KPI Card principal (compacta) ───────────────────────────
function KPICard({
  titulo, valor, subtitulo, icon: Icon, color, bg, tendencia, tendenciaValor,
}: {
  titulo: string
  valor: string
  subtitulo?: string
  icon: React.ElementType
  color: string
  bg: string
  tendencia?: 'up' | 'down' | 'neutral'
  tendenciaValor?: string
}) {
  return (
    <div
      className="bg-white rounded-xl p-4 border hover:shadow-md transition-shadow"
      style={{ borderColor: '#e2e8f0' }}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: bg }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {tendencia && tendenciaValor && (
          <div
            className="flex items-center gap-1 text-xs font-medium"
            style={{
              color:
                tendencia === 'up'   ? '#16a34a' :
                tendencia === 'down' ? '#dc2626' : '#64748b',
            }}
          >
            {tendencia === 'up'   && <TrendingUp   className="w-3 h-3" />}
            {tendencia === 'down' && <TrendingDown  className="w-3 h-3" />}
            <span>{tendenciaValor}</span>
          </div>
        )}
      </div>
      <p className="text-xl font-bold text-gray-900 leading-none">{valor}</p>
      <p className="text-sm font-medium text-gray-600 mt-1">{titulo}</p>
      {subtitulo && <p className="text-xs text-gray-400 mt-0.5">{subtitulo}</p>}
    </div>
  )
}

// ─── KPI Mini card (fila secundaria) ─────────────────────────
function KPICardMini({
  titulo, valor, subtitulo, color,
}: {
  titulo: string
  valor: string
  subtitulo?: string
  color: string
}) {
  return (
    <div
      className="bg-white rounded-xl p-3.5 border"
      style={{ borderColor: '#e2e8f0', borderTop: `3px solid ${color}` }}
    >
      <p className="text-lg font-bold text-gray-900 leading-none">{valor}</p>
      <p className="text-sm font-medium text-gray-600 mt-1">{titulo}</p>
      {subtitulo && <p className="text-xs text-gray-400 mt-0.5">{subtitulo}</p>}
    </div>
  )
}

// ─── Actividad reciente ───────────────────────────────────────
function ActividadItem({ item }: { item: ActividadReciente }) {
  const cfg = tipoActividadConfig[item.tipo]
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className="flex items-center justify-center w-8 h-8 rounded-lg text-sm shrink-0"
        style={{ background: cfg.bg }}
      >
        {cfg.emoji}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.titulo}</p>
          {item.monto && (
            <span
              className="text-sm font-bold shrink-0"
              style={{ color: item.tipo === 'mora' ? '#dc2626' : '#16a34a' }}
            >
              {formatCLP(item.monto)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{item.descripcion}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.unidad && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md font-medium"
              style={{ background: '#f1f5f9', color: '#64748b' }}
            >
              {item.unidad}
            </span>
          )}
          <span className="text-xs" style={{ color: '#94a3b8' }}>{item.tiempo}</span>
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
  const { edificioId } = await getUsuarioActual()
  const { kpis: kpi, actividad, gastos, pagos, solicitudes: sols, espacios, edificio } =
    await getDashboardData(edificioId)

  // ── Fecha dinámica (Chile ≈ UTC-4 en invierno) ─────────────
  const ahora        = new Date()
  const horaChile    = (ahora.getUTCHours() - 4 + 24) % 24
  const saludo       = horaChile < 12 ? 'Buenos días' : horaChile < 19 ? 'Buenas tardes' : 'Buenas noches'
  const emojiSaludo  = horaChile < 12 ? '👋' : horaChile < 19 ? '☀️' : '🌙'
  const diaNum       = ahora.getUTCDate()
  const mesActual    = ahora.getUTCMonth() + 1
  const añoActual    = ahora.getUTCFullYear()
  const diaSemana    = DIAS_SEMANA[ahora.getUTCDay()]
  const mesNombre    = MESES_LARGO[mesActual - 1]
  const mesCapital   = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)
  const fechaLarga   = `${diaSemana}, ${diaNum} de ${mesNombre} de ${añoActual}`
  const fechaCorta   = `${diaNum.toString().padStart(2,'0')}/${mesActual.toString().padStart(2,'0')}`

  const nombreEdificio = edificio?.nombre ?? 'Edificio'

  // ── KPIs ────────────────────────────────────────────────────
  const ocupacion  = kpi.totalUnidades > 0 ? Math.round((kpi.unidadesOcupadas / kpi.totalUnidades) * 100) : 0
  const pagadosPct = kpi.totalUnidades > 0 ? Math.round(((kpi.totalUnidades - kpi.morosos) / kpi.totalUnidades) * 100) : 0

  const gcPorEstado = {
    pagado:    gastos.filter(g => g.estadoPago === 'pagado').length,
    pendiente: gastos.filter(g => g.estadoPago === 'pendiente').length,
    vencido:   gastos.filter(g => g.estadoPago === 'vencido').length,
    parcial:   gastos.filter(g => g.estadoPago === 'parcial').length,
  }

  const solsUrgentes = sols.filter(
    s => (s.prioridad === 'urgente' || s.prioridad === 'alta') && s.estado !== 'resuelto',
  )

  // ── Analítica: últimos 3 meses ─────────────────────────────
  const ultimosMeses = [-2, -1, 0].map(offset => {
    let mes = mesActual + offset
    let año = añoActual
    if (mes <= 0) { mes += 12; año -= 1 }
    return { mes, año, label: MESES_CORTO[mes - 1] }
  })

  const ingresosMensuales = ultimosMeses.map(({ mes, año, label }) => ({
    label,
    valor: pagos
      .filter(p => p.mes === mes && p.año === año)
      .reduce((s, p) => s + p.monto, 0),
  }))

  const totalEsperado     = gastos.reduce((s, g) => s + g.montoTotal, 0)
  const totalCobradoMes   = pagos
    .filter(p => p.mes === mesActual && p.año === añoActual)
    .reduce((s, p) => s + p.monto, 0)
  const totalPendienteMes = Math.max(0, totalEsperado - totalCobradoMes)
  const pctCobrado        = totalEsperado > 0
    ? Math.round((totalCobradoMes / totalEsperado) * 100)
    : 0

  const totalUltimos3 = ingresosMensuales.reduce((s, m) => s + m.valor, 0)
  const ingMesAnt     = ingresosMensuales[1].valor
  const ingMesAct     = ingresosMensuales[2].valor
  const varMes        = ingMesAct - ingMesAnt
  const varMesPct     = ingMesAnt > 0 ? Math.round((varMes / ingMesAnt) * 100) : 0
  const labelPeriodo  = `${ultimosMeses[0].label}–${ultimosMeses[2].label}`

  const solPorEstado = [
    { label: 'Pendiente',   valor: sols.filter(s => s.estado === 'pendiente').length,   color: '#f59e0b' },
    { label: 'En progreso', valor: sols.filter(s => s.estado === 'en_progreso').length, color: '#3b82f6' },
    { label: 'Resuelto',    valor: sols.filter(s => s.estado === 'resuelto').length,    color: '#10b981' },
  ]

  const catMap: Record<string, number> = {}
  sols.forEach(s => { catMap[s.categoria] = (catMap[s.categoria] ?? 0) + 1 })
  const solPorCategoria = Object.entries(catMap)
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor)
  const maxSolCat = Math.max(...solPorCategoria.map(s => s.valor), 1)

  const espaciosEstado = {
    disponible: espacios.filter(e => e.estado === 'disponible').length,
    reservado:  espacios.filter(e => e.estado === 'reservado').length,
    ocupado:    espacios.filter(e => e.estado === 'ocupado').length,
    fuera:      espacios.filter(e => e.estado === 'fuera_servicio').length,
  }

  // Color de la barra de recaudación según porcentaje
  const barColor = pctCobrado >= 80 ? '#4ade80' : pctCobrado >= 50 ? '#fbbf24' : '#f87171'

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Header con gradiente de marca ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2341 0%, #1e3a5f 50%, #2563ae 100%)' }}
      >
        {/* Fila superior: saludo + badge */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              {saludo}, {nombreEdificio} {emojiSaludo}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#93c5fd' }}>
              {fechaLarga}
            </p>
          </div>
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#bbf7d0' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Sistema operativo
          </span>
        </div>

        {/* Barra de recaudación */}
        <div
          className="px-6 pb-5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center justify-between pt-3 mb-2">
            <span className="text-xs font-medium" style={{ color: '#93c5fd' }}>
              Recaudación {mesCapital} {añoActual}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white">{formatCLP(totalCobradoMes)}</span>
              <span className="text-xs" style={{ color: '#93c5fd' }}>
                de {formatCLP(totalEsperado)}
              </span>
              <span className="text-sm font-bold" style={{ color: barColor }}>
                {pctCobrado}%
              </span>
            </div>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pctCobrado}%`, background: barColor }}
            />
          </div>
        </div>
      </div>

      {/* ── KPI Cards principales (fila 1) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          titulo="Total Unidades"
          valor={`${kpi.unidadesOcupadas}/${kpi.totalUnidades}`}
          subtitulo={`${ocupacion}% de ocupación`}
          icon={Building2}
          color="#2563ae"
          bg="#dbeafe"
        />
        <KPICard
          titulo="Ingresos del Mes"
          valor={formatCLP(kpi.ingresosMes)}
          subtitulo={`${pagadosPct}% de cobros al día`}
          icon={DollarSign}
          color="#16a34a"
          bg="#dcfce7"
          tendencia={varMes >= 0 ? 'up' : 'down'}
          tendenciaValor={`${varMes >= 0 ? '+' : ''}${varMesPct}% vs ant.`}
        />
        <KPICard
          titulo="Morosos"
          valor={String(kpi.morosos)}
          subtitulo={formatCLP(kpi.montoMoroso) + ' en mora'}
          icon={AlertTriangle}
          color="#dc2626"
          bg="#fee2e2"
        />
        <KPICard
          titulo="Mantenciones"
          valor={String(kpi.solicitudesPendientes)}
          subtitulo={`${solsUrgentes.length} urgente${solsUrgentes.length !== 1 ? 's' : ''}`}
          icon={Wrench}
          color="#d97706"
          bg="#fef3c7"
        />
      </div>

      {/* ── KPI Mini cards (fila 2 — estadísticas secundarias) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICardMini
          titulo="Fondo de Reserva"
          valor={formatCLP(kpi.fondoReserva)}
          subtitulo={`Al ${fechaCorta}`}
          color="#059669"
        />
        <KPICardMini
          titulo="Visitas Hoy"
          valor={String(kpi.visitasHoy)}
          subtitulo={kpi.visitasHoy > 0 ? `${kpi.visitasHoy} registro${kpi.visitasHoy !== 1 ? 's' : ''}` : 'Sin visitas'}
          color="#7c3aed"
        />
        <KPICardMini
          titulo="Paquetes Pendientes"
          valor={String(kpi.paquetesPendientes)}
          subtitulo="Por retirar"
          color="#db2777"
        />
        <KPICardMini
          titulo="Reservas Hoy"
          valor={String(kpi.reservasHoy)}
          subtitulo={kpi.reservasHoy > 0 ? `${kpi.reservasHoy} espacio${kpi.reservasHoy !== 1 ? 's' : ''}` : 'Sin reservas'}
          color="#0891b2"
        />
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── Analítica del Mes ─────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="space-y-3">

        {/* Título sección */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-md"
            style={{ background: '#dbeafe' }}
          >
            <Activity className="w-3.5 h-3.5" style={{ color: '#2563ae' }} />
          </div>
          <h2 className="font-bold text-gray-900 text-sm">Analítica del Mes</h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#dbeafe', color: '#2563ae' }}
          >
            {mesCapital} {añoActual}
          </span>
        </div>

        {/* ── Fila A: Ingresos + Donut recaudación ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">

          {/* Gráfico de barras */}
          <div
            className="xl:col-span-2 bg-white rounded-xl border p-4"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Ingresos Mensuales</h3>
                <p className="text-xs text-gray-400 mt-0.5">Últimos 3 meses · Pagos completados</p>
              </div>
              <BarChart3 className="w-4 h-4" style={{ color: '#cbd5e1' }} />
            </div>

            <GraficoBarras datos={ingresosMensuales} />

            <div
              className="flex items-center justify-between mt-2 pt-2.5 border-t"
              style={{ borderColor: '#f1f5f9' }}
            >
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                {varMes >= 0
                  ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                }
                <span>
                  {ultimosMeses[2].label} vs {ultimosMeses[1].label}:{' '}
                  <span className="font-semibold" style={{ color: varMes >= 0 ? '#16a34a' : '#dc2626' }}>
                    {varMes >= 0 ? '+' : ''}{varMesPct}%
                  </span>
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total {labelPeriodo}</p>
                <p className="text-sm font-bold text-gray-900">{formatCLP(totalUltimos3)}</p>
              </div>
            </div>
          </div>

          {/* Donut recaudación */}
          <div
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Recaudación</h3>
                <p className="text-xs text-gray-400 mt-0.5">Gastos comunes {mesNombre}</p>
              </div>
              <PieChart className="w-4 h-4" style={{ color: '#cbd5e1' }} />
            </div>

            <div className="flex items-center gap-4">
              <GraficoDonut
                size={96}
                segmentos={[
                  { label: 'Cobrado',   valor: totalCobradoMes,   color: '#10b981' },
                  { label: 'Pendiente', valor: totalPendienteMes, color: '#f1f5f9' },
                ]}
                centro={{ linea1: `${pctCobrado}%`, linea2: 'cobrado' }}
              />

              <div className="flex-1 space-y-2.5">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
                    <p className="text-xs text-gray-500">Cobrado</p>
                  </div>
                  <p className="text-sm font-bold ml-3.5" style={{ color: '#10b981' }}>
                    {formatCLP(totalCobradoMes)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                    <p className="text-xs text-gray-500">Por cobrar</p>
                  </div>
                  <p className="text-sm font-bold ml-3.5" style={{ color: '#f59e0b' }}>
                    {formatCLP(totalPendienteMes)}
                  </p>
                </div>
                <div className="pt-2 border-t" style={{ borderColor: '#f1f5f9' }}>
                  <p className="text-xs text-gray-400">Esperado total</p>
                  <p className="text-xs font-semibold text-gray-700">{formatCLP(totalEsperado)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Fila B: Estado solicitudes + Categorías + Espacios ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Donut solicitudes */}
          <div
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Estado de Solicitudes</h3>
            <div className="flex items-center gap-4">
              <GraficoDonut
                size={88}
                segmentos={solPorEstado}
                centro={{ linea1: String(sols.length), linea2: 'total' }}
              />
              <div className="flex-1 space-y-2">
                {solPorEstado.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-gray-600">{s.label}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: s.color }}>{s.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Barras categorías */}
          <div
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Solicitudes por Categoría</h3>
            <div className="space-y-2.5">
              {solPorCategoria.map(s => (
                <BarraH
                  key={s.label}
                  label={s.label}
                  valor={s.valor}
                  maxValor={maxSolCat}
                  color={CAT_COLORS[s.label] ?? '#94a3b8'}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 pt-2.5 border-t" style={{ borderColor: '#f1f5f9' }}>
              {sols.length} solicitudes · {solPorCategoria.length} categorías
            </p>
          </div>

          {/* Espacios comunes */}
          <div
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Espacios Comunes</h3>
            <div className="space-y-2">
              {[
                { label: 'Disponibles',    valor: espaciosEstado.disponible, color: '#10b981', bg: '#d1fae5' },
                { label: 'Ocupados',       valor: espaciosEstado.ocupado,    color: '#2563ae', bg: '#dbeafe' },
                { label: 'Reservados',     valor: espaciosEstado.reservado,  color: '#8b5cf6', bg: '#ede9fe' },
                { label: 'Fuera servicio', valor: espaciosEstado.fuera,      color: '#dc2626', bg: '#fee2e2' },
              ].map(e => (
                <div
                  key={e.label}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: e.bg }}
                >
                  <span className="text-xs font-medium" style={{ color: e.color }}>{e.label}</span>
                  <span className="text-sm font-bold" style={{ color: e.color }}>{e.valor}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 pt-2.5 border-t" style={{ borderColor: '#f1f5f9' }}>
              Total: {espacios.length} espacios
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── Actividad + Panel derecho ─────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Actividad reciente (2/3) */}
        <div
          className="xl:col-span-2 bg-white rounded-xl border"
          style={{ borderColor: '#e2e8f0' }}
        >
          <div
            className="flex items-center justify-between px-5 pt-4 pb-3 border-b"
            style={{ borderColor: '#f1f5f9' }}
          >
            <h2 className="font-bold text-gray-900 text-sm">Actividad Reciente</h2>
            <button
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#2563ae' }}
            >
              Ver todo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="px-5 divide-y" style={{ borderColor: '#f8fafc' }}>
            {actividad.map((item: ActividadReciente) => (
              <ActividadItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Panel derecho (1/3) */}
        <div className="space-y-3">

          {/* Estado gastos comunes */}
          <div
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-sm">Gastos Comunes</h2>
              <span className="text-xs text-gray-400 font-medium">
                {mesCapital} {añoActual}
              </span>
            </div>

            <div className="space-y-2.5">
              {(Object.entries(gcPorEstado) as [keyof typeof estadoPagoConfig, number][]).map(
                ([estado, count]) => {
                  const cfg  = estadoPagoConfig[estado]
                  const Icon = cfg.icon
                  const pct  = Math.round((count / (gastos.length || 1)) * 100)
                  return (
                    <div key={estado} className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                        style={{ background: cfg.bg }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">{cfg.label}</span>
                          <span className="font-bold" style={{ color: cfg.color }}>{count}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: cfg.color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                }
              )}
            </div>

            <button
              className="w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
              style={{ background: '#f1f5f9', color: '#1e3a5f' }}
            >
              Ver detalle completo
            </button>
          </div>

          {/* Solicitudes urgentes */}
          <div
            className="bg-white rounded-xl border p-4"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-sm">Solicitudes Urgentes</h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                {solsUrgentes.length} activa{solsUrgentes.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2.5">
              {solsUrgentes.slice(0, 3).map(s => (
                <div
                  key={s.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ background: s.prioridad === 'urgente' ? '#fff7ed' : '#f8fafc' }}
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: s.prioridad === 'urgente' ? '#dc2626' : '#d97706' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{s.titulo}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{s.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-medium capitalize"
                        style={{
                          background: s.prioridad === 'urgente' ? '#fee2e2' : '#fef3c7',
                          color:      s.prioridad === 'urgente' ? '#dc2626' : '#d97706',
                        }}
                      >
                        {s.prioridad}
                      </span>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>
                        {s.estado === 'en_progreso' ? '🔄 En progreso' : '⏳ Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="w-full mt-3 py-2 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
              style={{ background: '#f1f5f9', color: '#1e3a5f' }}
            >
              Ver todas las solicitudes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
