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
} from 'lucide-react'
import type { Metadata } from 'next'
import { getDashboardData, formatCLP } from '@/lib/db'
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
  const PAD_T   = 28   // espacio para la etiqueta de valor
  const PAD_B   = 22   // espacio para la etiqueta del mes
  const PAD_H   = 10   // padding horizontal total
  const chartW  = W - PAD_H * 2
  const chartH  = H - PAD_T - PAD_B
  const n       = datos.length
  const gap     = 14
  const barW    = (chartW - gap * (n - 1)) / n

  const COLORES = ['#bfdbfe', '#60a5fa', '#2563ae', '#1e3a5f']

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {/* Línea base */}
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
            {/* Barra */}
            <rect x={x} y={y} width={barW} height={barH} rx={5} fill={color} />
            {/* Valor encima */}
            <text
              x={x + barW / 2} y={y - 5}
              textAnchor="middle"
              fontSize={9}
              fontWeight="700"
              fill="#374151"
            >
              {formatCLP(d.valor)}
            </text>
            {/* Etiqueta mes */}
            <text
              x={x + barW / 2} y={H - 4}
              textAnchor="middle"
              fontSize={9}
              fill="#94a3b8"
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

  const fontSize1 = size * 0.108   // ~13 para size=120
  const fontSize2 = size * 0.067   // ~8 para size=120

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
    >
      {/* Anillo de fondo */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={sw}
      />

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

      {/* Texto central */}
      {centro && (
        <>
          <text
            x={cx} y={cy - fontSize1 * 0.3}
            textAnchor="middle"
            fontSize={fontSize1}
            fontWeight="700"
            fill="#1e293b"
          >
            {centro.linea1}
          </text>
          <text
            x={cx} y={cy + fontSize1 * 0.9}
            textAnchor="middle"
            fontSize={fontSize2}
            fill="#94a3b8"
          >
            {centro.linea2}
          </text>
        </>
      )}
    </svg>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────
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
      className="bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow"
      style={{ borderColor: '#e2e8f0' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl"
          style={{ background: bg }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {tendencia && tendenciaValor && (
          <div
            className="flex items-center gap-1 text-xs font-medium"
            style={{
              color:
                tendencia === 'up'
                  ? '#16a34a'
                  : tendencia === 'down'
                  ? '#dc2626'
                  : '#64748b',
            }}
          >
            {tendencia === 'up'   && <TrendingUp   className="w-3.5 h-3.5" />}
            {tendencia === 'down' && <TrendingDown  className="w-3.5 h-3.5" />}
            <span>{tendenciaValor}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{valor}</p>
      <p className="text-sm font-medium text-gray-600 mt-1">{titulo}</p>
      {subtitulo && <p className="text-xs text-gray-400 mt-0.5">{subtitulo}</p>}
    </div>
  )
}

// ─── Actividad reciente ───────────────────────────────────────
function ActividadItem({ item }: { item: ActividadReciente }) {
  const cfg = tipoActividadConfig[item.tipo]
  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className="flex items-center justify-center w-9 h-9 rounded-xl text-base shrink-0"
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
        <div className="flex items-center gap-2 mt-1">
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

// ─── Página principal ─────────────────────────────────────────
export default async function DashboardPage() {
  const { kpis: kpi, actividad, gastos, pagos, solicitudes: sols, espacios } = await getDashboardData()
  const ocupacion = Math.round((kpi.unidadesOcupadas / kpi.totalUnidades) * 100)
  const pagadosPct = Math.round(((kpi.totalUnidades - kpi.morosos) / kpi.totalUnidades) * 100)

  // Estado gastos comunes para mini-reporte (lado derecho)
  const gcPorEstado = {
    pagado:    gastos.filter(g => g.estadoPago === 'pagado').length,
    pendiente: gastos.filter(g => g.estadoPago === 'pendiente').length,
    vencido:   gastos.filter(g => g.estadoPago === 'vencido').length,
    parcial:   gastos.filter(g => g.estadoPago === 'parcial').length,
  }

  // ── Analítica: datos calculados desde los arrays ──────────
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  // Ingresos por mes (últimos 3 meses)
  const ingresosMensuales = [3, 4, 5].map(mes => ({
    label: MESES[mes - 1],
    valor: pagos
      .filter(p => p.mes === mes && p.año === 2026)
      .reduce((s, p) => s + p.monto, 0),
  }))

  // Recaudación de mayo
  const totalEsperado    = gastos.reduce((s, g) => s + g.montoTotal, 0)
  const totalCobradoMes  = pagos
    .filter(p => p.mes === 5 && p.año === 2026)
    .reduce((s, p) => s + p.monto, 0)
  const totalPendienteMes = totalEsperado - totalCobradoMes
  const pctCobrado        = Math.round((totalCobradoMes / totalEsperado) * 100)

  // Total acumulado Q2 (Mar–May)
  const totalQ2 = ingresosMensuales.reduce((s, m) => s + m.valor, 0)

  // Variación mes a mes
  const varMes = ingresosMensuales[2].valor - ingresosMensuales[1].valor
  const varMesPct = Math.round((varMes / ingresosMensuales[1].valor) * 100)

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

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Encabezado ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Buenos días, Rodrigo 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Jueves, 27 de mayo de 2026 · Edificio Las Palmas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: '#dcfce7', color: '#16a34a' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Sistema operativo
          </span>
        </div>
      </div>

      {/* ── KPI Cards fila 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Total Unidades"
          valor={`${kpi.unidadesOcupadas}/${kpi.totalUnidades}`}
          subtitulo={`${ocupacion}% de ocupación`}
          icon={Building2}
          color="#2563ae"
          bg="#dbeafe"
          tendencia="up"
          tendenciaValor="+2 este mes"
        />
        <KPICard
          titulo="Ingresos del Mes"
          valor={formatCLP(kpi.ingresosMes)}
          subtitulo={`${pagadosPct}% de cobros al día`}
          icon={DollarSign}
          color="#16a34a"
          bg="#dcfce7"
          tendencia="up"
          tendenciaValor="+8.3%"
        />
        <KPICard
          titulo="Morosos"
          valor={String(kpi.morosos)}
          subtitulo={formatCLP(kpi.montoMoroso) + ' en mora'}
          icon={AlertTriangle}
          color="#dc2626"
          bg="#fee2e2"
          tendencia="down"
          tendenciaValor="-2 vs mes ant."
        />
        <KPICard
          titulo="Mantenciones Pendientes"
          valor={String(kpi.solicitudesPendientes)}
          subtitulo="2 urgentes"
          icon={Wrench}
          color="#d97706"
          bg="#fef3c7"
        />
      </div>

      {/* ── KPI Cards fila 2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="Fondo de Reserva"
          valor={formatCLP(kpi.fondoReserva)}
          subtitulo="Actualizado al 27/05"
          icon={TrendingUp}
          color="#059669"
          bg="#ecfdf5"
        />
        <KPICard
          titulo="Visitas Hoy"
          valor={String(kpi.visitasHoy)}
          subtitulo="2 aún en el edificio"
          icon={Users}
          color="#7c3aed"
          bg="#f3e8ff"
        />
        <KPICard
          titulo="Paquetes Pendientes"
          valor={String(kpi.paquetesPendientes)}
          subtitulo="Por retirar en conserjería"
          icon={Package}
          color="#db2777"
          bg="#fce7f3"
        />
        <KPICard
          titulo="Reservas Hoy"
          valor={String(kpi.reservasHoy)}
          subtitulo="Quincho A · Lavandería ×2"
          icon={Calendar}
          color="#0891b2"
          bg="#cffafe"
        />
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── FASE 10: Analítica del Mes ──────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <div className="space-y-4">

        {/* Título de sección */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: '#dbeafe' }}
          >
            <Activity className="w-4 h-4" style={{ color: '#2563ae' }} />
          </div>
          <h2 className="font-bold text-gray-900">Analítica del Mes</h2>
          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
            style={{ background: '#dbeafe', color: '#2563ae' }}
          >
            Mayo 2026
          </span>
        </div>

        {/* ── Fila A: Ingresos + Donut recaudación ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Gráfico de barras: ingresos mensuales */}
          <div
            className="xl:col-span-2 bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-semibold text-gray-900">Ingresos Mensuales</h3>
                <p className="text-xs text-gray-400 mt-0.5">Últimos 3 meses · Pagos completados</p>
              </div>
              <BarChart3 className="w-4 h-4" style={{ color: '#cbd5e1' }} />
            </div>

            <GraficoBarras datos={ingresosMensuales} />

            <div
              className="flex items-center justify-between mt-2 pt-3 border-t"
              style={{ borderColor: '#f1f5f9' }}
            >
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                {varMes >= 0
                  ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                }
                <span>
                  May vs Abr:{' '}
                  <span
                    className="font-semibold"
                    style={{ color: varMes >= 0 ? '#16a34a' : '#dc2626' }}
                  >
                    {varMes >= 0 ? '+' : ''}{varMesPct}%
                  </span>
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total Q2 (Mar–May)</p>
                <p className="text-sm font-bold text-gray-900">{formatCLP(totalQ2)}</p>
              </div>
            </div>
          </div>

          {/* Donut: recaudación del mes */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Recaudación</h3>
                <p className="text-xs text-gray-400 mt-0.5">Gastos comunes mayo</p>
              </div>
              <PieChart className="w-4 h-4" style={{ color: '#cbd5e1' }} />
            </div>

            <div className="flex items-center gap-4">
              <GraficoDonut
                size={110}
                segmentos={[
                  { label: 'Cobrado',   valor: totalCobradoMes,   color: '#10b981' },
                  { label: 'Pendiente', valor: totalPendienteMes, color: '#f1f5f9' },
                ]}
                centro={{ linea1: `${pctCobrado}%`, linea2: 'cobrado' }}
              />

              <div className="flex-1 space-y-3">
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
                <div
                  className="pt-2 border-t"
                  style={{ borderColor: '#f1f5f9' }}
                >
                  <p className="text-xs text-gray-400">Esperado total</p>
                  <p className="text-xs font-semibold text-gray-700">{formatCLP(totalEsperado)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Fila B: Operacional ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Donut: solicitudes por estado */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h3 className="font-semibold text-gray-900 mb-4">Estado de Solicitudes</h3>
            <div className="flex items-center gap-4">
              <GraficoDonut
                size={96}
                segmentos={solPorEstado}
                centro={{
                  linea1: String(sols.length),
                  linea2: 'total',
                }}
              />
              <div className="flex-1 space-y-2.5">
                {solPorEstado.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: s.color }}
                      />
                      <span className="text-xs text-gray-600">{s.label}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: s.color }}>
                      {s.valor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Barras horizontales: solicitudes por categoría */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h3 className="font-semibold text-gray-900 mb-4">Solicitudes por Categoría</h3>
            <div className="space-y-3">
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
            <p
              className="text-xs text-gray-400 mt-4 pt-3 border-t"
              style={{ borderColor: '#f1f5f9' }}
            >
              {sols.length} solicitudes · {solPorCategoria.length} categorías
            </p>
          </div>

          {/* Espacios comunes */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <h3 className="font-semibold text-gray-900 mb-4">Espacios Comunes</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Disponibles',    valor: espaciosEstado.disponible, color: '#10b981', bg: '#d1fae5' },
                { label: 'Ocupados',       valor: espaciosEstado.ocupado,    color: '#2563ae', bg: '#dbeafe' },
                { label: 'Reservados',     valor: espaciosEstado.reservado,  color: '#8b5cf6', bg: '#ede9fe' },
                { label: 'Fuera servicio', valor: espaciosEstado.fuera,      color: '#dc2626', bg: '#fee2e2' },
              ].map(e => (
                <div
                  key={e.label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: e.bg }}
                >
                  <span className="text-xs font-medium" style={{ color: e.color }}>
                    {e.label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: e.color }}>
                    {e.valor}
                  </span>
                </div>
              ))}
            </div>
            <p
              className="text-xs text-gray-400 mt-3 pt-3 border-t"
              style={{ borderColor: '#f1f5f9' }}
            >
              Total: {espacios.length} espacios del edificio
            </p>
          </div>
        </div>
      </div>
      {/* ══════════════════════════════════════════════════════ */}

      {/* ── Contenido principal: actividad + panel derecho ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Actividad reciente (2/3) */}
        <div
          className="xl:col-span-2 bg-white rounded-2xl border shadow-sm"
          style={{ borderColor: '#e2e8f0' }}
        >
          <div
            className="flex items-center justify-between px-5 pt-5 pb-4 border-b"
            style={{ borderColor: '#f1f5f9' }}
          >
            <h2 className="font-bold text-gray-900">Actividad Reciente</h2>
            <button
              className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#2563ae' }}
            >
              Ver todo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="px-5 divide-y" style={{ borderColor: '#f8fafc' }}>
            {actividad.map((item: ActividadReciente) => (
              <ActividadItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Panel derecho (1/3) */}
        <div className="space-y-4">

          {/* Estado gastos comunes del mes */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Gastos Comunes</h2>
              <span className="text-xs text-gray-400 font-medium">Mayo 2026</span>
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
                        className="flex items-center justify-center w-7 h-7 rounded-lg"
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
              className="w-full mt-4 py-2 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
              style={{ background: '#f1f5f9', color: '#1e3a5f' }}
            >
              Ver detalle completo
            </button>
          </div>

          {/* Solicitudes urgentes */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-5"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Solicitudes Urgentes</h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                2 activas
              </span>
            </div>

            <div className="space-y-3">
              {sols
                .filter(s => s.prioridad === 'urgente' || s.prioridad === 'alta')
                .filter(s => s.estado !== 'resuelto')
                .slice(0, 3)
                .map(s => (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: s.prioridad === 'urgente' ? '#fff7ed' : '#f8fafc' }}
                  >
                    <div
                      className="flex items-center justify-center w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{
                        background: s.prioridad === 'urgente' ? '#dc2626' : '#d97706',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.titulo}</p>
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
              className="w-full mt-3 py-2 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
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
