/**
 * LiquidacionPDF — Template PDF Liquidación de Gastos Comunes
 * Renderizado server-side por /api/liquidacion/[id] con renderToBuffer.
 * NO agregar 'use client' — usa el reconciler de @react-pdf/renderer, no React DOM.
 */
import { Document, Page, Text, View, StyleSheet, Line, Svg } from '@react-pdf/renderer'
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
} as const

// ─── Helpers ──────────────────────────────────────────────────
const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

function fechaCorta(iso: string) {
  try { return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}
function fechaLarga(iso: string) {
  try { return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return iso }
}
function folio(id: string) {
  return id.replace(/-/g, '').slice(-8).toUpperCase()
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

  // ── Franja superior azul oscuro ──
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

  // ── Franja de resumen (debajo del header) ──
  summaryStripe: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 40,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  summaryCellBorder: {
    borderRightWidth: 1,
    borderRightColor: C.border,
  },
  summaryLabel: { color: C.grayLt, fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6, marginBottom: 3 },
  summaryValue: { color: C.text,   fontSize: 10, fontFamily: 'Helvetica-Bold' },
  summaryMonto: { color: C.blue,   fontSize: 13, fontFamily: 'Helvetica-Bold' },

  // ── Cuerpo ──
  body: { paddingHorizontal: 40, paddingTop: 20 },

  // ── Títulos de sección ──
  secLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.grayLt,
    letterSpacing: 1,
    marginBottom: 10,
  },

  // ── Bloque destinatario (2 columnas) ──
  destRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  destBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  destBoxHeader: {
    backgroundColor: C.bg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  destBoxHeaderTxt: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray, letterSpacing: 0.6 },
  destBoxBody: { padding: 12 },
  destName:  { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 6 },
  destRow2:  { flexDirection: 'row', marginBottom: 3 },
  destLabel: { width: 72, fontSize: 8, color: C.gray },
  destVal:   { flex: 1, fontSize: 8, color: C.text, fontFamily: 'Helvetica-Bold' },

  // ── Tabla de conceptos ──
  table: { marginBottom: 0 },
  tHead: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tHeadTxt: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.gray, letterSpacing: 0.3 },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  tRowAlt: { backgroundColor: '#fafbfc' },
  tCell:    { flex: 1, fontSize: 9, color: C.textSm },
  tCellAmt: { width: 100, textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },

  // ── Fila total ──
  tTotalRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: C.navy,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
  },
  tTotalLabel: { flex: 1, fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.3 },
  tTotalAmt:   { width: 100, textAlign: 'right', fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white },

  // ── Mora ──
  moraBox: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: '#fff5f5',
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 4,
    padding: 10,
    gap: 6,
  },

  // ── Sección de pago ──
  paySection: { marginTop: 20, marginBottom: 18 },
  payBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  payBoxHeader: {
    backgroundColor: C.navy,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  payBoxHeaderTxt: { color: C.white, fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 0.3 },
  payBoxBody: { padding: 14 },
  payGrid:    { flexDirection: 'row', gap: 20 },
  payCol:     { flex: 1 },
  payRow:     { flexDirection: 'row', marginBottom: 6 },
  payLabel:   { width: 80, fontSize: 8, color: C.gray },
  payVal:     { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text },
  payVence: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payVenceLabel: { fontSize: 8, color: '#dc2626', fontFamily: 'Helvetica-Bold' },
  payVenceVal:   { fontSize: 8, color: '#dc2626' },

  // ── Nota legal ──
  legalNote: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  legalTxt: { fontSize: 7, color: C.grayLt, lineHeight: 1.6 },

  // ── Footer fijo ──
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerTxt:  { fontSize: 7, color: C.grayLt },
  footerBold: { fontSize: 7, color: C.gray, fontFamily: 'Helvetica-Bold' },
})

// ─── Configs estado ───────────────────────────────────────────
const ESTADOS = {
  pagado:    { label: 'PAGADO',            color: '#16a34a', bg: '#dcfce7' },
  pendiente: { label: 'PENDIENTE DE PAGO', color: '#d97706', bg: '#fef3c7' },
  vencido:   { label: 'VENCIDO — EN MORA', color: '#dc2626', bg: '#fee2e2' },
  parcial:   { label: 'PAGO PARCIAL',      color: '#7c3aed', bg: '#f3e8ff' },
} as const

// ─── Tipos ────────────────────────────────────────────────────
export interface LiquidacionPDFProps {
  gasto:     GastoComun
  unidad?:   Unidad | null
  edificio?: Edificio | null
  residente?: User | null
}

// ─── Componente ───────────────────────────────────────────────
export function LiquidacionPDF({ gasto, unidad, edificio, residente }: LiquidacionPDFProps) {
  const año     = gasto['año'] as number
  const estado  = ESTADOS[gasto.estadoPago as keyof typeof ESTADOS] ?? ESTADOS.pendiente
  const hoy     = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  const conceptos = [
    { label: 'Gastos comunes base',  monto: gasto.montoBase },
    { label: 'Fondo de reserva',     monto: gasto.montoFondoReserva  ?? 0 },
    { label: 'Agua',                 monto: gasto.montoAgua           ?? 0 },
    { label: 'Electricidad',         monto: gasto.montoElectricidad   ?? 0 },
    { label: 'Gas / Calefacción',    monto: gasto.montoGas            ?? 0 },
  ].filter(c => c.monto > 0)

  const edificioStr  = edificio?.nombre ?? 'Edificio'
  const direccionStr = [edificio?.direccion, edificio?.comuna].filter(Boolean).join(', ')

  return (
    <Document title={`Liquidación GC ${MESES[gasto.mes]} ${año} · Unidad ${unidad?.numero ?? ''}`}>
      <Page size="A4" style={s.page}>

        {/* ══════════════════════════════════════════════════════
            HEADER — marca + datos del edificio
        ══════════════════════════════════════════════════════ */}
        <View style={s.headerStripe}>
          {/* Izquierda: marca + edificio */}
          <View>
            <Text style={s.hBrand}>propify</Text>
            <Text style={s.hBrandSub}>{edificioStr}</Text>
            <Text style={s.hBrandAddr}>{direccionStr}</Text>
          </View>
          {/* Derecha: documento */}
          <View>
            <Text style={s.hDocLabel}>DOCUMENTO</Text>
            <Text style={s.hDocTitle}>Liquidación de{'\n'}Gastos Comunes</Text>
            <Text style={s.hFolio}>Folio N° {folio(gasto.id)}</Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════
            FRANJA RESUMEN — período · vencimiento · estado · monto
        ══════════════════════════════════════════════════════ */}
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
            <View style={{
              backgroundColor: estado.bg,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 100,
              alignSelf: 'center',
              marginTop: 2,
            }}>
              <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: estado.color }}>
                {estado.label}
              </Text>
            </View>
          </View>
          <View style={s.summaryCell}>
            <Text style={s.summaryLabel}>MONTO TOTAL</Text>
            <Text style={s.summaryMonto}>{CLP(gasto.montoTotal)}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ══════════════════════════════════════════════════════
              DESTINATARIO — unidad | residente
          ══════════════════════════════════════════════════════ */}
          <Text style={s.secLabel}>DESTINATARIO</Text>
          <View style={s.destRow}>

            {/* Unidad */}
            <View style={s.destBox}>
              <View style={s.destBoxHeader}>
                <Text style={s.destBoxHeaderTxt}>UNIDAD</Text>
              </View>
              <View style={s.destBoxBody}>
                <Text style={s.destName}>N° {unidad?.numero ?? '—'}</Text>
                <View style={s.destRow2}>
                  <Text style={s.destLabel}>Piso</Text>
                  <Text style={s.destVal}>{unidad?.piso ? `Piso ${unidad.piso}` : 'Planta baja'}</Text>
                </View>
                <View style={s.destRow2}>
                  <Text style={s.destLabel}>Superficie</Text>
                  <Text style={s.destVal}>{unidad?.superficieM2 ?? '—'} m²</Text>
                </View>
                <View style={s.destRow2}>
                  <Text style={s.destLabel}>Tipo</Text>
                  <Text style={s.destVal}>
                    {unidad?.tipo === 'departamento'    ? 'Departamento'
                      : unidad?.tipo === 'local_comercial' ? 'Local comercial'
                      : unidad?.tipo === 'oficina'         ? 'Oficina'
                      : unidad?.tipo === 'bodega'          ? 'Bodega'
                      : unidad?.tipo ?? '—'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Residente */}
            <View style={s.destBox}>
              <View style={s.destBoxHeader}>
                <Text style={s.destBoxHeaderTxt}>RESPONSABLE DEL PAGO</Text>
              </View>
              <View style={s.destBoxBody}>
                {residente ? (
                  <>
                    <Text style={s.destName}>{residente.nombre} {residente.apellido}</Text>
                    <View style={s.destRow2}>
                      <Text style={s.destLabel}>Calidad</Text>
                      <Text style={s.destVal}>
                        {residente.rol === 'arrendatario' ? 'Arrendatario' : 'Propietario'}
                      </Text>
                    </View>
                    <View style={s.destRow2}>
                      <Text style={s.destLabel}>Correo</Text>
                      <Text style={s.destVal}>{residente.email}</Text>
                    </View>
                    {residente.telefono && (
                      <View style={s.destRow2}>
                        <Text style={s.destLabel}>Teléfono</Text>
                        <Text style={s.destVal}>{residente.telefono}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={{ ...s.destName, color: C.gray, fontSize: 9 }}>Sin residente asignado</Text>
                    <Text style={{ fontSize: 8, color: C.grayLt, marginTop: 4 }}>
                      Asignar propietario o arrendatario desde el módulo de unidades.
                    </Text>
                  </>
                )}
              </View>
            </View>

          </View>

          {/* ══════════════════════════════════════════════════════
              DESGLOSE
          ══════════════════════════════════════════════════════ */}
          <Text style={[s.secLabel, { marginBottom: 8 }]}>DESGLOSE DEL COBRO</Text>

          <View style={s.table}>
            {/* Cabecera */}
            <View style={s.tHead}>
              <Text style={[s.tHeadTxt, { flex: 1 }]}>CONCEPTO</Text>
              <Text style={[s.tHeadTxt, { width: 100, textAlign: 'right' }]}>MONTO</Text>
            </View>

            {/* Filas */}
            {conceptos.map((c, i) => (
              <View key={c.label} style={[s.tRow, i % 2 === 1 ? s.tRowAlt : {}]}>
                <Text style={s.tCell}>{c.label}</Text>
                <Text style={s.tCellAmt}>{CLP(c.monto)}</Text>
              </View>
            ))}

            {/* Total */}
            <View style={s.tTotalRow}>
              <Text style={s.tTotalLabel}>TOTAL A PAGAR</Text>
              <Text style={s.tTotalAmt}>{CLP(gasto.montoTotal)}</Text>
            </View>
          </View>

          {/* ── Aviso mora ── */}
          {(gasto.diasMora ?? 0) > 0 && (
            <View style={s.moraBox}>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#dc2626' }}>
                ⚠ {gasto.diasMora} días en mora.
              </Text>
              <Text style={{ fontSize: 8, color: '#b91c1c' }}>
                Pago no realizado después de la fecha de vencimiento. Se recomienda regularizar a la brevedad.
              </Text>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════
              INSTRUCCIONES DE PAGO
          ══════════════════════════════════════════════════════ */}
          {gasto.estadoPago !== 'pagado' && (
            <View style={s.paySection}>
              <Text style={[s.secLabel, { marginBottom: 8 }]}>INSTRUCCIONES DE PAGO</Text>
              <View style={s.payBox}>
                <View style={s.payBoxHeader}>
                  <Text style={s.payBoxHeaderTxt}>TRANSFERENCIA BANCARIA</Text>
                </View>
                <View style={s.payBoxBody}>
                  <View style={s.payGrid}>
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
                    </View>
                    <View style={s.payCol}>
                      <View style={s.payRow}>
                        <Text style={s.payLabel}>Glosa / Referencia</Text>
                        <Text style={s.payVal}>
                          GC Unidad {unidad?.numero ?? ''} {MESES[gasto.mes]} {año}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.payVence}>
                    <Text style={s.payVenceLabel}>Fecha límite de pago:</Text>
                    <Text style={s.payVenceVal}> {fechaLarga(gasto.fechaVencimiento)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── Nota legal ── */}
          <View style={s.legalNote}>
            <Text style={s.legalTxt}>
              Este documento es una liquidación informativa de gastos comunes emitida por la administración del
              condominio. No constituye boleta ni factura tributaria ante el SII. Para consultas, contactar
              directamente a la administración del edificio.
            </Text>
          </View>

        </View>

        {/* ══════════════════════════════════════════════════════
            FOOTER FIJO
        ══════════════════════════════════════════════════════ */}
        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>
            {edificioStr}{direccionStr ? ` · ${direccionStr}` : ''}
          </Text>
          <Text style={s.footerTxt}>Generado el {hoy} mediante{' '}
            <Text style={s.footerBold}>propify</Text>
          </Text>
        </View>

      </Page>
    </Document>
  )
}
