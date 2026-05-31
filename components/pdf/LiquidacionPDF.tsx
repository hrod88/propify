/**
 * LiquidacionPDF — Template PDF Liquidación de Gastos Comunes
 * Renderizado server-side por /api/liquidacion/[id] con renderToBuffer.
 * NO agregar 'use client' — usa el reconciler de @react-pdf/renderer, no React DOM.
 *
 * Mejoras v2:
 *   - Watermark diagonal PAGADO / PENDIENTE / VENCIDO
 *   - Historial últimos 3 períodos de la unidad
 *   - QR code que apunta al portal de pago
 *   - Recargo estimado por mora
 *   - Folio correlativo legible
 */
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { GastoComun, Unidad, Edificio, User } from '@/types'

// ─── Paleta ───────────────────────────────────────────────────
const C = {
  navy:    '#1e3a5f',
  blue:    '#2563ae',
  sky:     '#dbeafe',
  gray:    '#6b7280',
  grayLt:  '#9ca3af',
  border:  '#d1d5db',
  bg:      '#f9fafb',
  text:    '#111827',
  textSm:  '#374151',
  white:   '#ffffff',
  green:   '#16a34a',
  greenBg: '#dcfce7',
  amber:   '#d97706',
  amberBg: '#fef3c7',
  red:     '#dc2626',
  redBg:   '#fee2e2',
  purple:  '#7c3aed',
  purpleBg:'#f3e8ff',
} as const

// ─── Helpers ──────────────────────────────────────────────────
const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const MESES_CORTO = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

function fechaCorta(iso: string) {
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}
function fechaLarga(iso: string) {
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return iso }
}
function folio(id: string, mes: number, año: number) {
  const seq = id.replace(/-/g, '').slice(-6).toUpperCase()
  return `GC-${año}-${String(mes).padStart(2, '0')}-${seq}`
}

// ─── Estilos ──────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.textSm,
    backgroundColor: C.white,
    paddingBottom: 48,
  },

  // ── Watermark ──
  watermarkWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkText: {
    fontSize: 78,
    fontFamily: 'Helvetica-Bold',
    opacity: 0.055,
    letterSpacing: 6,
    transform: 'rotate(-38deg)',
  },

  // ── Header ──
  headerStripe: {
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hBrand:       { color: C.white,   fontSize: 22, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5 },
  hBrandSub:    { color: '#93c5fd', fontSize: 8,  marginTop: 2 },
  hBrandAddr:   { color: '#bfdbfe', fontSize: 7.5, marginTop: 1 },
  hDocLabel:    { color: '#93c5fd', fontSize: 7,  fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, textAlign: 'right' },
  hDocTitle:    { color: C.white,   fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 3, textAlign: 'right' },
  hFolio:       { color: '#bfdbfe', fontSize: 7.5, marginTop: 4, textAlign: 'right' },

  // ── Summary stripe ──
  summaryStripe: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 40,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCell: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  summaryCellBorder: { borderRightWidth: 1, borderRightColor: C.border },
  summaryLabel: { color: C.grayLt, fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6, marginBottom: 3 },
  summaryValue: { color: C.text,   fontSize: 10, fontFamily: 'Helvetica-Bold' },
  summaryMonto: { color: C.blue,   fontSize: 13, fontFamily: 'Helvetica-Bold' },

  // ── Body ──
  body: { paddingHorizontal: 40, paddingTop: 18 },

  // ── Section labels ──
  secLabel: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.grayLt,
    letterSpacing: 1, marginBottom: 8,
  },

  // ── Destinatario ──
  destRow:   { flexDirection: 'row', gap: 16, marginBottom: 16 },
  destBox:   { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  destBoxHeader:    { backgroundColor: C.bg, paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border },
  destBoxHeaderTxt: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray, letterSpacing: 0.6 },
  destBoxBody: { padding: 12 },
  destName:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 6 },
  destRow2:  { flexDirection: 'row', marginBottom: 3 },
  destLabel: { width: 72, fontSize: 8, color: C.gray },
  destVal:   { flex: 1, fontSize: 8, color: C.text, fontFamily: 'Helvetica-Bold' },

  // ── Tabla conceptos ──
  table: { marginBottom: 0 },
  tHead: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderTopLeftRadius: 4, borderTopRightRadius: 4,
  },
  tHeadTxt: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.gray, letterSpacing: 0.3 },
  tRow: {
    flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12,
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.border,
  },
  tRowAlt:  { backgroundColor: '#fafbfc' },
  tCell:    { flex: 1, fontSize: 9, color: C.textSm },
  tCellAmt: { width: 100, textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  tTotalRow: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: C.navy, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignItems: 'center',
  },
  tTotalLabel: { flex: 1, fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.3 },
  tTotalAmt:   { width: 100, textAlign: 'right', fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white },

  // ── Mora box ──
  moraBox: {
    flexDirection: 'row', marginTop: 8, marginBottom: 4,
    backgroundColor: '#fff5f5', borderLeftWidth: 3, borderLeftColor: C.red,
    borderWidth: 1, borderColor: '#fecaca', borderRadius: 4, padding: 10, gap: 8,
  },
  moraGrid: { flexDirection: 'row', gap: 10 },
  moraCell: { flex: 1, padding: 8, borderRadius: 4 },

  // ── Historial ──
  histSection: { marginTop: 16, marginBottom: 0 },
  histHead: {
    flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderTopLeftRadius: 4, borderTopRightRadius: 4,
  },
  histRow: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10,
    borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: C.border,
  },
  histRowLast: { borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  histCell:    { fontSize: 8, color: C.textSm },

  // ── Sección pago ──
  paySection: { marginTop: 18, marginBottom: 14 },
  payBox: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  payBoxHeader:    { backgroundColor: C.navy, paddingHorizontal: 12, paddingVertical: 8 },
  payBoxHeaderTxt: { color: C.white, fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.3 },
  payBoxBody: { padding: 14 },
  payGrid:    { flexDirection: 'row', gap: 16 },
  payCol:     { flex: 1 },
  payColQr:   { width: 90, alignItems: 'center' },
  payRow:     { flexDirection: 'row', marginBottom: 6 },
  payLabel:   { width: 80, fontSize: 8, color: C.gray },
  payVal:     { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text },
  payVence: {
    marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  payVenceLabel: { fontSize: 8, color: C.red, fontFamily: 'Helvetica-Bold' },
  payVenceVal:   { fontSize: 8, color: C.red },
  qrLabel: { fontSize: 6.5, color: C.grayLt, textAlign: 'center', marginTop: 4 },

  // ── Legal ──
  legalNote: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  legalTxt:  { fontSize: 7, color: C.grayLt, lineHeight: 1.6 },

  // ── Footer ──
  footer: {
    position: 'absolute', bottom: 18, left: 40, right: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6,
  },
  footerTxt:  { fontSize: 7, color: C.grayLt },
  footerBold: { fontSize: 7, color: C.gray, fontFamily: 'Helvetica-Bold' },
})

// ─── Config estados ───────────────────────────────────────────
const ESTADOS = {
  pagado:    { label: 'PAGADO',            color: C.green,  bg: C.greenBg  },
  pendiente: { label: 'PENDIENTE DE PAGO', color: C.amber,  bg: C.amberBg  },
  vencido:   { label: 'VENCIDO',           color: C.red,    bg: C.redBg    },
  parcial:   { label: 'PAGO PARCIAL',      color: C.purple, bg: C.purpleBg },
} as const

type EstadoKey = keyof typeof ESTADOS

// ─── Props ────────────────────────────────────────────────────
export interface LiquidacionPDFProps {
  gasto:       GastoComun
  unidad?:     Unidad | null
  edificio?:   Edificio | null
  residente?:  User | null
  historial?:  GastoComun[]
  qrDataUrl?:  string     // data:image/png;base64,...
}

// ─── Estado badge ─────────────────────────────────────────────
function EstadoBadge({ estadoKey }: { estadoKey: EstadoKey }) {
  const e = ESTADOS[estadoKey]
  return (
    <View style={{ backgroundColor: e.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, alignSelf: 'center', marginTop: 2 }}>
      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: e.color }}>{e.label}</Text>
    </View>
  )
}

// ─── Fila historial ───────────────────────────────────────────
function HistorialRow({ g, isLast }: { g: GastoComun; isLast: boolean }) {
  const año       = g['año'] as number
  const estadoKey = (g.estadoPago in ESTADOS ? g.estadoPago : 'pendiente') as EstadoKey
  const cfg       = ESTADOS[estadoKey]
  return (
    <View style={[s.histRow, isLast ? s.histRowLast : {}]}>
      <Text style={[s.histCell, { flex: 1 }]}>{MESES_CORTO[g.mes]} {año}</Text>
      <Text style={[s.histCell, { width: 80, textAlign: 'right' }]}>{CLP(g.montoTotal)}</Text>
      <View style={{ width: 100, alignItems: 'center' }}>
        <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: cfg.color }}>{cfg.label}</Text>
        </View>
      </View>
      <Text style={[s.histCell, { width: 80, textAlign: 'right' }]}>
        {g.fechaPago ? fechaCorta(g.fechaPago) : '—'}
      </Text>
    </View>
  )
}

// ─── Componente principal ─────────────────────────────────────
export function LiquidacionPDF({
  gasto, unidad, edificio, residente, historial = [], qrDataUrl,
}: LiquidacionPDFProps) {
  const año        = gasto['año'] as number
  const estadoKey  = (gasto.estadoPago in ESTADOS ? gasto.estadoPago : 'pendiente') as EstadoKey
  const estado     = ESTADOS[estadoKey]
  const hoy        = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const diasMora   = gasto.diasMora ?? 0

  // Recargo estimado por mora (1,5% mensual ~ 0,05% diario)
  const recargoMora = diasMora > 0
    ? Math.round(gasto.montoTotal * 0.0005 * diasMora)
    : 0

  const conceptos = [
    { label: 'Gastos comunes base',  monto: gasto.montoBase },
    { label: 'Fondo de reserva',     monto: gasto.montoFondoReserva  ?? 0 },
    { label: 'Agua',                 monto: gasto.montoAgua           ?? 0 },
    { label: 'Electricidad',         monto: gasto.montoElectricidad   ?? 0 },
    { label: 'Gas / Calefacción',    monto: gasto.montoGas            ?? 0 },
  ].filter(c => c.monto > 0)

  const edificioStr  = edificio?.nombre ?? 'Edificio'
  const direccionStr = [edificio?.direccion, edificio?.comuna].filter(Boolean).join(', ')
  const folioStr     = folio(gasto.id, gasto.mes, año)

  return (
    <Document title={`Liquidación GC ${MESES[gasto.mes]} ${año} · Unidad ${unidad?.numero ?? ''}`}>
      <Page size="A4" style={s.page}>

        {/* ══════════════ WATERMARK ══════════════ */}
        <View style={s.watermarkWrap} fixed>
          <Text style={[s.watermarkText, { color: estado.color }]}>
            {estado.label}
          </Text>
        </View>

        {/* ══════════════ HEADER ══════════════ */}
        <View style={s.headerStripe}>
          <View>
            <Text style={s.hBrand}>propify</Text>
            <Text style={s.hBrandSub}>{edificioStr}</Text>
            {!!direccionStr && <Text style={s.hBrandAddr}>{direccionStr}</Text>}
          </View>
          <View>
            <Text style={s.hDocLabel}>DOCUMENTO OFICIAL</Text>
            <Text style={s.hDocTitle}>Liquidación de{'\n'}Gastos Comunes</Text>
            <Text style={s.hFolio}>Folio {folioStr}</Text>
          </View>
        </View>

        {/* ══════════════ FRANJA RESUMEN ══════════════ */}
        <View style={s.summaryStripe}>
          <View style={[s.summaryCell, s.summaryCellBorder]}>
            <Text style={s.summaryLabel}>PERÍODO</Text>
            <Text style={s.summaryValue}>{MESES[gasto.mes]} {año}</Text>
          </View>
          <View style={[s.summaryCell, s.summaryCellBorder]}>
            <Text style={s.summaryLabel}>VENCIMIENTO</Text>
            <Text style={s.summaryValue}>{fechaCorta(gasto.fechaVencimiento)}</Text>
          </View>
          <View style={[s.summaryCell, s.summaryCellBorder]}>
            <Text style={s.summaryLabel}>ESTADO</Text>
            <EstadoBadge estadoKey={estadoKey} />
          </View>
          <View style={s.summaryCell}>
            <Text style={s.summaryLabel}>MONTO TOTAL</Text>
            <Text style={s.summaryMonto}>{CLP(gasto.montoTotal)}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ══════════════ DESTINATARIO ══════════════ */}
          <Text style={s.secLabel}>DESTINATARIO</Text>
          <View style={s.destRow}>

            {/* Unidad */}
            <View style={s.destBox}>
              <View style={s.destBoxHeader}><Text style={s.destBoxHeaderTxt}>UNIDAD</Text></View>
              <View style={s.destBoxBody}>
                <Text style={s.destName}>N° {unidad?.numero ?? '—'}</Text>
                {[
                  ['Piso',       unidad?.piso ? `Piso ${unidad.piso}` : 'Planta baja'],
                  ['Superficie', `${unidad?.superficieM2 ?? '—'} m²`],
                  ['Tipo',       unidad?.tipo === 'departamento' ? 'Departamento'
                               : unidad?.tipo === 'local_comercial' ? 'Local comercial'
                               : unidad?.tipo ?? '—'],
                ].map(([lbl, val]) => (
                  <View key={lbl} style={s.destRow2}>
                    <Text style={s.destLabel}>{lbl}</Text>
                    <Text style={s.destVal}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Residente */}
            <View style={s.destBox}>
              <View style={s.destBoxHeader}><Text style={s.destBoxHeaderTxt}>RESPONSABLE DEL PAGO</Text></View>
              <View style={s.destBoxBody}>
                {residente ? (
                  <>
                    <Text style={s.destName}>{residente.nombre} {residente.apellido}</Text>
                    {[
                      ['Calidad',  residente.rol === 'arrendatario' ? 'Arrendatario' : 'Propietario'],
                      ['Correo',   residente.email],
                      ...(residente.telefono ? [['Teléfono', residente.telefono]] : []),
                    ].map(([lbl, val]) => (
                      <View key={lbl} style={s.destRow2}>
                        <Text style={s.destLabel}>{lbl}</Text>
                        <Text style={s.destVal}>{val}</Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <Text style={{ ...s.destName, color: C.gray, fontSize: 9 }}>Sin residente asignado</Text>
                )}
              </View>
            </View>

          </View>

          {/* ══════════════ DESGLOSE ══════════════ */}
          <Text style={s.secLabel}>DESGLOSE DEL COBRO</Text>
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.tHeadTxt, { flex: 1 }]}>CONCEPTO</Text>
              <Text style={[s.tHeadTxt, { width: 100, textAlign: 'right' }]}>MONTO</Text>
            </View>
            {conceptos.map((c, i) => (
              <View key={c.label} style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}]}>
                <Text style={s.tCell}>{c.label}</Text>
                <Text style={s.tCellAmt}>{CLP(c.monto)}</Text>
              </View>
            ))}
            <View style={s.tTotalRow}>
              <Text style={s.tTotalLabel}>TOTAL A PAGAR</Text>
              <Text style={s.tTotalAmt}>{CLP(gasto.montoTotal)}</Text>
            </View>
          </View>

          {/* ── Mora + recargo estimado ── */}
          {diasMora > 0 && (
            <View style={s.moraBox}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.red }}>
                  ⚠  {diasMora} días en mora
                </Text>
                <Text style={{ fontSize: 7.5, color: '#b91c1c', marginTop: 3 }}>
                  Pago no realizado después del vencimiento. Regularice a la brevedad para evitar recargos.
                </Text>
              </View>
              {recargoMora > 0 && (
                <View style={{ width: 120, backgroundColor: C.redBg, borderRadius: 4, padding: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 6.5, color: C.red, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>RECARGO ESTIMADO</Text>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.red }}>{CLP(recargoMora)}</Text>
                  <Text style={{ fontSize: 6, color: '#b91c1c', marginTop: 1 }}>0,05% diario · referencial</Text>
                </View>
              )}
            </View>
          )}

          {/* ══════════════ HISTORIAL ÚLTIMOS 3 PERÍODOS ══════════════ */}
          {historial.length > 0 && (
            <View style={s.histSection}>
              <Text style={s.secLabel}>HISTORIAL DE PAGOS — UNIDAD {unidad?.numero ?? ''}</Text>
              <View>
                <View style={s.histHead}>
                  <Text style={[s.tHeadTxt, { flex: 1 }]}>PERÍODO</Text>
                  <Text style={[s.tHeadTxt, { width: 80, textAlign: 'right' }]}>MONTO</Text>
                  <Text style={[s.tHeadTxt, { width: 100, textAlign: 'center' }]}>ESTADO</Text>
                  <Text style={[s.tHeadTxt, { width: 80, textAlign: 'right' }]}>FECHA PAGO</Text>
                </View>
                {historial.map((g, i) => (
                  <HistorialRow key={g.id} g={g} isLast={i === historial.length - 1} />
                ))}
              </View>
            </View>
          )}

          {/* ══════════════ INSTRUCCIONES DE PAGO ══════════════ */}
          {gasto.estadoPago !== 'pagado' && (
            <View style={s.paySection}>
              <Text style={[s.secLabel, { marginBottom: 8 }]}>INSTRUCCIONES DE PAGO</Text>
              <View style={s.payBox}>
                <View style={s.payBoxHeader}>
                  <Text style={s.payBoxHeaderTxt}>TRANSFERENCIA BANCARIA</Text>
                </View>
                <View style={s.payBoxBody}>
                  <View style={s.payGrid}>

                    {/* Datos bancarios */}
                    <View style={s.payCol}>
                      <View style={s.payRow}>
                        <Text style={s.payLabel}>Beneficiario</Text>
                        <Text style={s.payVal}>Comunidad {edificioStr}</Text>
                      </View>
                      {edificio?.rut && (
                        <View style={s.payRow}>
                          <Text style={s.payLabel}>RUT</Text>
                          <Text style={s.payVal}>{edificio.rut}</Text>
                        </View>
                      )}
                      <View style={s.payRow}>
                        <Text style={s.payLabel}>Referencia</Text>
                        <Text style={s.payVal}>GC Unidad {unidad?.numero ?? ''} {MESES[gasto.mes]} {año}</Text>
                      </View>
                      <View style={s.payRow}>
                        <Text style={s.payLabel}>Folio</Text>
                        <Text style={s.payVal}>{folioStr}</Text>
                      </View>
                      <View style={s.payVence}>
                        <Text style={s.payVenceLabel}>Fecha límite:</Text>
                        <Text style={s.payVenceVal}> {fechaLarga(gasto.fechaVencimiento)}</Text>
                      </View>
                    </View>

                    {/* QR portal */}
                    {qrDataUrl && (
                      <View style={s.payColQr}>
                        <Image src={qrDataUrl} style={{ width: 80, height: 80 }} />
                        <Text style={s.qrLabel}>Escanear para{'\n'}ver y pagar online</Text>
                      </View>
                    )}

                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Si ya está pagado — confirmación */}
          {gasto.estadoPago === 'pagado' && gasto.fechaPago && (
            <View style={{ marginTop: 14, backgroundColor: C.greenBg, borderRadius: 4, borderWidth: 1, borderColor: '#86efac', padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.green }}>✓  Pago confirmado</Text>
                <Text style={{ fontSize: 8, color: '#166534', marginTop: 2 }}>
                  Fecha de pago: {fechaLarga(gasto.fechaPago)}
                </Text>
              </View>
              <Text style={{ fontSize: 7, color: C.green }}>Folio {folioStr}</Text>
            </View>
          )}

          {/* ── Nota legal ── */}
          <View style={s.legalNote}>
            <Text style={s.legalTxt}>
              Este documento es una liquidación informativa de gastos comunes emitida por la administración del
              condominio. No constituye boleta ni factura tributaria ante el SII. El recargo por mora es
              referencial y puede diferir del cobro definitivo según el reglamento del edificio.
              Para consultas, contactar directamente a la administración.
            </Text>
          </View>

        </View>

        {/* ══════════════ FOOTER ══════════════ */}
        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>
            {edificioStr}{direccionStr ? ` · ${direccionStr}` : ''}
          </Text>
          <Text style={s.footerTxt}>
            Generado el {hoy} · <Text style={s.footerBold}>propify.cl</Text>
          </Text>
        </View>

      </Page>
    </Document>
  )
}
