/**
 * POST /api/enviar-liquidacion/[id]
 * Genera el PDF de la liquidación y lo envía por email al residente
 * usando Resend (resend.com).
 *
 * Requiere env vars:
 *   RESEND_API_KEY  — obtenida en resend.com/api-keys
 *   RESEND_FROM     — (opcional) "Propify <gastos@tudominio.cl>"
 *                     Por defecto usa el sandbox de Resend.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { Resend } from 'resend'
import QRCode from 'qrcode'
import { LiquidacionPDF } from '@/components/pdf/LiquidacionPDF'
import {
  getGastoComunById,
  getUnidades,
  getUsuarios,
  getEdificioById,
  getHistorialGastosUnidad,
  formatCLP,
} from '@/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://propify-rust.vercel.app'

// ─── Template HTML del email ──────────────────────────────────
function buildHtml(opts: {
  nombreResidente: string
  unidadNumero:    string
  mes:             string
  año:             number
  monto:           string
  fechaVenc:       string
  portalUrl:       string
  edificioNombre:  string
  isPaid:          boolean
}) {
  const {
    nombreResidente, unidadNumero, mes, año, monto,
    fechaVenc, portalUrl, edificioNombre, isPaid,
  } = opts

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Liquidación de Gastos Comunes</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:#1e3a5f;border-radius:16px 16px 0 0;padding:28px 32px;">
      <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">propify</p>
      <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">${edificioNombre}</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <p style="margin:0 0 16px;color:#374151;font-size:15px;">
        Estimado/a <strong>${nombreResidente}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
        ${isPaid
          ? 'Su pago de gastos comunes ha sido registrado exitosamente. A continuación encontrará el comprobante.'
          : `Se ha emitido su liquidación de gastos comunes correspondiente a <strong>${mes} ${año}</strong>. Por favor, realice el pago antes de la fecha de vencimiento.`
        }
      </p>

      <!-- Monto box -->
      <div style="background:#eff6ff;border-left:4px solid #2563ae;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:24px;">
        <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Unidad ${unidadNumero} · ${mes} ${año}</p>
        <p style="margin:8px 0 0;color:#1e3a5f;font-size:32px;font-weight:700;">${monto}</p>
        ${isPaid
          ? `<p style="margin:6px 0 0;color:#16a34a;font-size:13px;font-weight:600;">✓ Pago confirmado</p>`
          : `<p style="margin:6px 0 0;color:#dc2626;font-size:13px;">Vence el <strong>${fechaVenc}</strong></p>`
        }
      </div>

      <!-- CTA button -->
      <a href="${portalUrl}"
         style="display:block;background:#2563ae;color:#ffffff;text-align:center;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:20px;">
        Ver liquidación completa →
      </a>

      <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
        También puede descargar el PDF adjunto a este correo con todos los detalles y el desglose completo del cobro.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
        Este mensaje fue enviado automáticamente por <strong style="color:#6b7280;">propify</strong>
        en nombre de la administración de <strong style="color:#6b7280;">${edificioNombre}</strong>.<br/>
        No responder a este correo — para consultas, contactar directamente a la administración.
      </p>
    </div>

  </div>
</body>
</html>`
}

// ─── Handler ──────────────────────────────────────────────────
export async function POST(_req: NextRequest, { params }: RouteContext) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY no configurada. Agrégala en las variables de entorno de Vercel.' },
      { status: 503 },
    )
  }

  try {
    const { id } = await params

    // ── Datos ──────────────────────────────────────────────────
    const gasto = await getGastoComunById(id)
    if (!gasto) return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })

    const [unidades, users, edificio, historial] = await Promise.all([
      getUnidades(gasto.edificioId),
      getUsuarios(gasto.edificioId),
      getEdificioById(gasto.edificioId),
      getHistorialGastosUnidad(gasto.unidadId, id, 3),
    ])

    const unidad    = unidades.find(u => u.id === gasto.unidadId) ?? null
    const uid       = unidad?.arrendatarioId ?? unidad?.propietarioId ?? null
    const residente = uid ? (users.find(u => u.id === uid) ?? null) : null

    if (!residente?.email) {
      return NextResponse.json(
        { error: 'Esta unidad no tiene residente con email registrado.' },
        { status: 422 },
      )
    }

    const año         = gasto['año'] as number
    const portalUrl   = `${BASE_URL}/portal/pagar/${id}`
    const mesNombre   = MESES[gasto.mes]
    const isPaid      = gasto.estadoPago === 'pagado'
    const edificioStr = edificio?.nombre ?? 'Edificio'

    // Fecha vencimiento legible
    const fechaVenc = new Date(gasto.fechaVencimiento + 'T12:00:00')
      .toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

    // ── Generar QR ─────────────────────────────────────────────
    let qrDataUrl: string | undefined
    try {
      qrDataUrl = await QRCode.toDataURL(portalUrl, {
        width: 200, margin: 1,
        color: { dark: '#1e3a5f', light: '#ffffff' },
      })
    } catch { /* opcional */ }

    // ── Generar PDF ────────────────────────────────────────────
    const element = createElement(
      LiquidacionPDF,
      { gasto, unidad, edificio, residente, historial, qrDataUrl },
    ) as unknown as ReactElement<DocumentProps>

    const pdfBuffer = await renderToBuffer(element)

    // ── Construir email ────────────────────────────────────────
    const subject = isPaid
      ? `✓ Pago confirmado — Unidad ${unidad?.numero ?? ''} · ${mesNombre} ${año}`
      : `Liquidación de Gastos Comunes — Unidad ${unidad?.numero ?? ''} · ${mesNombre} ${año}`

    const html = buildHtml({
      nombreResidente: `${residente.nombre} ${residente.apellido}`,
      unidadNumero:    unidad?.numero ?? '—',
      mes:             mesNombre,
      año,
      monto:           formatCLP(gasto.montoTotal),
      fechaVenc,
      portalUrl,
      edificioNombre:  edificioStr,
      isPaid,
    })

    const filename = `liquidacion-unidad-${unidad?.numero ?? 'X'}-${gasto.mes}-${año}.pdf`

    // ── Enviar con Resend ──────────────────────────────────────
    const resend = new Resend(apiKey)
    const from   = process.env.RESEND_FROM ?? 'Propify <onboarding@resend.dev>'

    const { data, error } = await resend.emails.send({
      from,
      to:      residente.email,
      subject,
      html,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer).toString('base64'),
        },
      ],
    })

    if (error) {
      console.error('[enviar-liquidacion] Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok:      true,
      emailId: data?.id,
      to:      residente.email,
      subject,
    })
  } catch (err) {
    console.error('[enviar-liquidacion]', err)
    return NextResponse.json({ error: 'Error interno generando o enviando el email.' }, { status: 500 })
  }
}
