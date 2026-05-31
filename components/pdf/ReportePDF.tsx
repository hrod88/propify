/**
 * components/pdf/ReportePDF.tsx
 * Reporte contable mensual — Balance de ingresos, egresos, morosos y fondos.
 * Generado con @react-pdf/renderer.
 */
import {
  Document, Page, Text, View, StyleSheet, Font, Svg, Rect, Line,
} from '@react-pdf/renderer'
import type { GastoComun, EgresoComunidad, FondoComunidad, Unidad, User } from '@/types'

Font.registerHyphenationCallback(w => [w])

// ─── Paleta ────────────────────────────────────────────────────
const C = {
  navy:    '#1e3a5f',
  blue:    '#2563ae',
  green:   '#16a34a',
  red:     '#dc2626',
  amber:   '#d97706',
  gray:    '#6b7280',
  light:   '#f8fafc',
  border:  '#e2e8f0',
  white:   '#ffffff',
  muted:   '#94a3b8',
}

// ─── Estilos ───────────────────────────────────────────────────
const S = StyleSheet.create({
  page:       { fontFamily: 'Helvetica', fontSize: 9, color: '#374151', padding: 36, backgroundColor: C.white },
  // header
  headerBar:  { backgroundColor: C.navy, borderRadius: 8, padding: '14 20', marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle:{ color: C.white, fontSize: 16, fontFamily: 'Helvetica-Bold' },
  headerSub:  { color: '#93c5fd', fontSize: 9, marginTop: 2 },
  headerRight:{ alignItems: 'flex-end' },
  headerPeriod:{ color: '#93c5fd', fontSize: 8 },
  // section
  section:    { marginBottom: 16 },
  sectionTitle:{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 8, borderBottom: `1pt solid ${C.border}`, paddingBottom: 4 },
  // KPI row
  kpiRow:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
  kpiCard:    { flex: 1, borderRadius: 6, padding: '10 12' },
  kpiLabel:   { fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  kpiValue:   { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  // table
  tableHead:  { flexDirection: 'row', backgroundColor: C.light, borderRadius: 4, padding: '5 8', marginBottom: 2 },
  tableRow:   { flexDirection: 'row', padding: '5 8', borderBottom: `0.5pt solid ${C.border}` },
  thText:     { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.muted, textTransform: 'uppercase' },
  tdText:     { fontSize: 8, color: '#374151' },
  tdBold:     { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  // badge
  badge:      { borderRadius: 4, padding: '2 5', fontSize: 7, fontFamily: 'Helvetica-Bold' },
  // footer
  footer:     { position: 'absolute', bottom: 24, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', borderTop: `0.5pt solid ${C.border}`, paddingTop: 6 },
  footerText: { fontSize: 7, color: C.muted },
})

// ─── Helpers ────────────────────────────────────────────────────
const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// ─── Props ─────────────────────────────────────────────────────
export interface ReportePDFProps {
  edificioNombre: string
  mes:            number
  año:            number
  gastos:         GastoComun[]
  egresos:        EgresoComunidad[]
  fondos:         FondoComunidad[]
  unidades:       Unidad[]
  usuarios:       User[]
}

// ─── Componente ────────────────────────────────────────────────
export function ReportePDF({
  edificioNombre, mes, año,
  gastos, egresos, fondos, unidades, usuarios,
}: ReportePDFProps) {

  // ── KPIs ─────────────────────────────────────────────────
  const gastosMes    = gastos.filter(g => g.mes === mes && (g['año'] as number) === año)
  const totalCobrado = gastosMes.reduce((s, g) => s + g.montoTotal, 0)
  const totalPagado  = gastosMes.filter(g => g.estadoPago === 'pagado').reduce((s, g) => s + g.montoTotal, 0)
  const totalPendiente = gastosMes.filter(g => g.estadoPago !== 'pagado').reduce((s, g) => s + g.montoTotal, 0)
  const totalEgresos = egresos.reduce((s, e) => s + e.monto, 0)
  const resultado    = totalPagado - totalEgresos
  const morosos      = gastosMes.filter(g => g.estadoPago === 'vencido' || g.estadoPago === 'pendiente')

  // ── Egresos por categoría ────────────────────────────────
  const catMap = new Map<string, number>()
  for (const e of egresos) {
    catMap.set(e.categoria, (catMap.get(e.categoria) ?? 0) + e.monto)
  }
  const categorias = [...catMap.entries()].sort((a, b) => b[1] - a[1])

  // ── Top morosos ──────────────────────────────────────────
  const topMorosos = morosos
    .map(g => {
      const u = unidades.find(u => u.id === g.unidadId)
      const uid = u?.arrendatarioId ?? u?.propietarioId
      const res = uid ? usuarios.find(u => u.id === uid) : undefined
      return { numero: u?.numero ?? '?', nombre: res ? `${res.nombre} ${res.apellido}` : 'Sin residente', monto: g.montoTotal, estado: g.estadoPago }
    })
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 10)

  const periodoStr = `${MESES[mes]} ${año}`
  const hoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Bar chart egresos por categoría ─────────────────────
  const CHART_W = 380
  const CHART_H = 60
  const maxCat  = Math.max(...categorias.map(c => c[1]), 1)
  const barW    = categorias.length > 0 ? Math.min(28, (CHART_W - 20) / categorias.length - 4) : 20

  return (
    <Document title={`Reporte ${periodoStr} — ${edificioNombre}`} author="Propify">

      {/* ══════════════════════════════════════════════
          PÁGINA 1 — KPIs + morosos
      ══════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>

        {/* Header */}
        <View style={S.headerBar}>
          <View>
            <Text style={S.headerTitle}>Reporte de Gestión</Text>
            <Text style={S.headerSub}>{edificioNombre}</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={[S.headerSub, { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white }]}>{periodoStr}</Text>
            <Text style={S.headerPeriod}>Generado: {hoy}</Text>
          </View>
        </View>

        {/* KPIs */}
        <View style={S.kpiRow}>
          {[
            { label: 'Total a cobrar',  value: formatCLP(totalCobrado),  bg: '#eff6ff', color: C.blue },
            { label: 'Recaudado',       value: formatCLP(totalPagado),   bg: '#dcfce7', color: C.green },
            { label: 'Pendiente',       value: formatCLP(totalPendiente),bg: '#fef3c7', color: C.amber },
            { label: 'Egresos',         value: formatCLP(totalEgresos),  bg: '#fee2e2', color: C.red },
            { label: 'Resultado neto',  value: formatCLP(resultado),     bg: resultado >= 0 ? '#dcfce7' : '#fee2e2', color: resultado >= 0 ? C.green : C.red },
          ].map(({ label, value, bg, color }) => (
            <View key={label} style={[S.kpiCard, { backgroundColor: bg }]}>
              <Text style={[S.kpiLabel, { color }]}>{label}</Text>
              <Text style={[S.kpiValue, { color }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Estado de cobros */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Estado de cobros — {periodoStr}</Text>
          <View style={S.tableHead}>
            {['Unidad','Residente','Monto','Estado','Vencimiento'].map((h, i) => (
              <Text key={h} style={[S.thText, { flex: i === 1 ? 2 : 1 }]}>{h}</Text>
            ))}
          </View>
          {gastosMes.slice(0, 20).map(g => {
            const u   = unidades.find(u => u.id === g.unidadId)
            const uid = u?.arrendatarioId ?? u?.propietarioId
            const res = uid ? usuarios.find(u => u.id === uid) : undefined
            const estadoColor = g.estadoPago === 'pagado' ? C.green : g.estadoPago === 'vencido' ? C.red : C.amber
            const estadoBg    = g.estadoPago === 'pagado' ? '#dcfce7' : g.estadoPago === 'vencido' ? '#fee2e2' : '#fef3c7'
            return (
              <View key={g.id} style={S.tableRow}>
                <Text style={[S.tdBold, { flex: 1 }]}>N° {u?.numero ?? '?'}</Text>
                <Text style={[S.tdText, { flex: 2 }]}>{res ? `${res.nombre} ${res.apellido}` : '—'}</Text>
                <Text style={[S.tdBold, { flex: 1, color: C.navy }]}>{formatCLP(g.montoTotal)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[S.badge, { backgroundColor: estadoBg, color: estadoColor }]}>
                    {g.estadoPago.charAt(0).toUpperCase() + g.estadoPago.slice(1)}
                  </Text>
                </View>
                <Text style={[S.tdText, { flex: 1 }]}>
                  {new Date(g.fechaVencimiento + 'T12:00:00').toLocaleDateString('es-CL')}
                </Text>
              </View>
            )
          })}
          {gastosMes.length === 0 && (
            <Text style={[S.tdText, { padding: 8, color: C.muted }]}>Sin cobros para este período</Text>
          )}
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Propify · {edificioNombre}</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>

      {/* ══════════════════════════════════════════════
          PÁGINA 2 — Egresos + Fondos
      ══════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>

        {/* Sub-header */}
        <View style={[S.headerBar, { marginBottom: 16 }]}>
          <View>
            <Text style={S.headerTitle}>Egresos & Fondos</Text>
            <Text style={S.headerSub}>{edificioNombre} · {periodoStr}</Text>
          </View>
          <Text style={[S.headerPeriod, { color: C.white, fontSize: 11 }]}>{formatCLP(totalEgresos)}</Text>
        </View>

        {/* Bar chart — egresos por categoría */}
        {categorias.length > 0 && (
          <View style={[S.section]}>
            <Text style={S.sectionTitle}>Egresos por categoría</Text>
            <Svg width={CHART_W} height={CHART_H + 20} style={{ marginBottom: 4 }}>
              <Line x1="0" y1={CHART_H} x2={CHART_W} y2={CHART_H} strokeWidth={0.5} stroke={C.border} />
              {categorias.map(([, monto], i) => {
                const h  = Math.max(3, (monto / maxCat) * CHART_H)
                const x  = i * (barW + 4) + 4
                return (
                  <Rect key={i} x={x} y={CHART_H - h} width={barW} height={h}
                    fill={C.blue} rx={2} />
                )
              })}
            </Svg>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {categorias.slice(0, 12).map(([cat, monto]) => (
                <View key={cat} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                  <View style={{ width: 6, height: 6, backgroundColor: C.blue, borderRadius: 1 }} />
                  <Text style={{ fontSize: 7, color: C.gray }}>{cat}: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{formatCLP(monto)}</Text></Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tabla egresos */}
        {egresos.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Detalle de egresos</Text>
            <View style={S.tableHead}>
              {['Categoría','Descripción','Proveedor','Monto'].map((h, i) => (
                <Text key={h} style={[S.thText, { flex: i === 1 ? 2 : i === 2 ? 1.5 : 1 }]}>{h}</Text>
              ))}
            </View>
            {egresos.map(e => (
              <View key={e.id} style={S.tableRow}>
                <Text style={[S.tdText, { flex: 1 }]}>{e.categoria}</Text>
                <Text style={[S.tdText, { flex: 2 }]}>{e.descripcion ?? '—'}</Text>
                <Text style={[S.tdText, { flex: 1.5 }]}>{e.proveedor ?? '—'}</Text>
                <Text style={[S.tdBold, { flex: 1, color: C.red }]}>{formatCLP(e.monto)}</Text>
              </View>
            ))}
            <View style={[S.tableRow, { backgroundColor: C.light, borderBottom: 'none' }]}>
              <Text style={[S.tdBold, { flex: 4.5, textAlign: 'right' }]}>Total egresos</Text>
              <Text style={[S.tdBold, { flex: 1, color: C.red }]}>{formatCLP(totalEgresos)}</Text>
            </View>
          </View>
        )}

        {/* Fondos */}
        {fondos.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Estado de fondos</Text>
            <View style={S.tableHead}>
              {['Fondo','Cobrado','Ingresos','Egresos','Saldo'].map(h => (
                <Text key={h} style={[S.thText, { flex: 1 }]}>{h}</Text>
              ))}
            </View>
            {fondos.map(f => (
              <View key={f.id} style={S.tableRow}>
                <Text style={[S.tdBold, { flex: 1 }]}>{f.nombre}</Text>
                <Text style={[S.tdText, { flex: 1 }]}>{formatCLP(f.cobrado)}</Text>
                <Text style={[S.tdText, { flex: 1 }]}>{formatCLP(f.ingresos)}</Text>
                <Text style={[S.tdText, { flex: 1 }]}>{formatCLP(f.egresos)}</Text>
                <Text style={[S.tdBold, { flex: 1, color: f.saldoActual >= 0 ? C.green : C.red }]}>
                  {formatCLP(f.saldoActual)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Morosos */}
        {topMorosos.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Unidades con deuda pendiente</Text>
            <View style={S.tableHead}>
              {['Unidad','Residente','Monto','Estado'].map((h, i) => (
                <Text key={h} style={[S.thText, { flex: i === 1 ? 2 : 1 }]}>{h}</Text>
              ))}
            </View>
            {topMorosos.map(m => {
              const color = m.estado === 'vencido' ? C.red : C.amber
              const bg    = m.estado === 'vencido' ? '#fee2e2' : '#fef3c7'
              return (
                <View key={m.numero} style={S.tableRow}>
                  <Text style={[S.tdBold, { flex: 1 }]}>N° {m.numero}</Text>
                  <Text style={[S.tdText, { flex: 2 }]}>{m.nombre}</Text>
                  <Text style={[S.tdBold, { flex: 1, color: C.navy }]}>{formatCLP(m.monto)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.badge, { backgroundColor: bg, color }]}>
                      {m.estado.charAt(0).toUpperCase() + m.estado.slice(1)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* Resumen financiero final */}
        <View style={{ backgroundColor: C.navy, borderRadius: 6, padding: '12 16', marginTop: 8 }}>
          <Text style={{ color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 8 }}>
            Resumen financiero — {periodoStr}
          </Text>
          {[
            ['Total cobrado (GC)',  formatCLP(totalCobrado)],
            ['Total recaudado',     formatCLP(totalPagado)],
            ['Total egresos',       formatCLP(totalEgresos)],
            ['Resultado neto',      formatCLP(resultado)],
          ].map(([label, value]) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#93c5fd', fontSize: 8 }}>{label}</Text>
              <Text style={{
                color: label === 'Resultado neto' ? (resultado >= 0 ? '#86efac' : '#fca5a5') : C.white,
                fontFamily: 'Helvetica-Bold', fontSize: 8,
              }}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Propify · {edificioNombre}</Text>
          <Text style={S.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
