/**
 * POST /api/gastos/enviar-masivo
 * Envía la liquidación por email a todos los residentes con gasto
 * pendiente o vencido para el período indicado.
 *
 * Body: { edificioId: string; mes: number; año: number }
 * Returns: { ok: true; enviados: number; fallidos: number; detalle: Result[] }
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
  getGastosComunes, getUnidades, getUsuarios,
  getEdificioById, getHistorialGastosUnidad, formatCLP,
  getEgresosByPeriodo, getLecturasByPeriodo, getFondosByPeriodo, getEvolucionEgresos,
} from '@/lib/db'

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://propify-rust.vercel.app'

interface Result {
  unidadNumero: string
  email:        string | null
  status:       'ok' | 'sin_email' | 'error'
  error?:       string
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY no configurada.' },
      { status: 503 },
    )
  }

  let body: { edificioId?: string; mes?: number; año?: number }
  try { body = await req.json() as typeof body }
  catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const { edificioId, mes, año } = body
  if (!edificioId || !mes || !año) {
    return NextResponse.json({ error: 'Faltan edificioId, mes o año' }, { status: 400 })
  }

  // ── Cargar datos ──────────────────────────────────────────────
  const [todosGastos, unidades, users, edificio, egresosGlobal, lecturasGlobal, fondosGlobal, evolucion] =
    await Promise.all([
      getGastosComunes(edificioId),
      getUnidades(edificioId),
      getUsuarios(edificioId),
      getEdificioById(edificioId),
      getEgresosByPeriodo(edificioId, mes, año),
      getLecturasByPeriodo(edificioId, mes, año),
      getFondosByPeriodo(edificioId, mes, año),
      getEvolucionEgresos(edificioId, 12),
    ])

  // Solo los del período seleccionado que estén pendientes o vencidos
  const gastosPeriodo = todosGastos.filter(
    g => g.mes === mes && (g['año'] as number) === año
      && (g.estadoPago === 'pendiente' || g.estadoPago === 'vencido'),
  )

  if (gastosPeriodo.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0, fallidos: 0, detalle: [] })
  }

  const resend = new Resend(apiKey)
  const from   = process.env.RESEND_FROM ?? 'Propify <onboarding@resend.dev>'
  const mesNombre = MESES[mes]

  const resultados: Result[] = []

  // Procesar uno por uno (para no disparar rate limit de Resend)
  for (const gasto of gastosPeriodo) {
    const unidad    = unidades.find(u => u.id === gasto.unidadId)
    const uid       = unidad?.arrendatarioId ?? unidad?.propietarioId
    const residente = uid ? users.find(u => u.id === uid) : undefined
    const unidadNum = unidad?.numero ?? '?'

    if (!residente?.email) {
      resultados.push({ unidadNumero: unidadNum, email: null, status: 'sin_email' })
      continue
    }

    try {
      const anoNum    = gasto['año'] as number
      const portalUrl = `${BASE_URL}/portal/pagar/${gasto.id}`
      const historial = await getHistorialGastosUnidad(gasto.unidadId, gasto.id, 3)

      let qrDataUrl: string | undefined
      try {
        qrDataUrl = await QRCode.toDataURL(portalUrl, {
          width: 200, margin: 1,
          color: { dark: '#1e3a5f', light: '#ffffff' },
        })
      } catch { /* optional */ }

      // Lecturas específicas de esta unidad + las comunitarias
      const lecturasUnidad = lecturasGlobal.filter(
        l => !l.unidadId || l.unidadId === gasto.unidadId,
      )

      const element = createElement(
        LiquidacionPDF,
        {
          gasto, unidad, edificio, residente, historial, qrDataUrl,
          egresos:   egresosGlobal,
          lecturas:  lecturasUnidad,
          fondos:    fondosGlobal,
          evolucion,
        },
      ) as unknown as ReactElement<DocumentProps>

      const pdfBuffer = await renderToBuffer(element)

      const subject = `Liquidación de Gastos Comunes — Unidad ${unidadNum} · ${mesNombre} ${anoNum}`
      const fechaVenc = new Date(gasto.fechaVencimiento + 'T12:00:00')
        .toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

      const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:#1e3a5f;border-radius:16px 16px 0 0;padding:28px 32px;">
    <p style="margin:0;color:#fff;font-size:22px;font-weight:700;">propify</p>
    <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">${edificio?.nombre ?? ''}</p>
  </div>
  <div style="background:#fff;padding:32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      Estimado/a <strong>${residente.nombre} ${residente.apellido}</strong>,
    </p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
      Se ha emitido su liquidación de gastos comunes para <strong>${mesNombre} ${anoNum}</strong>.
      Por favor, realice el pago antes de la fecha de vencimiento.
    </p>
    <div style="background:#eff6ff;border-left:4px solid #2563ae;border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Unidad ${unidadNum} · ${mesNombre} ${anoNum}</p>
      <p style="margin:8px 0 0;color:#1e3a5f;font-size:32px;font-weight:700;">${formatCLP(gasto.montoTotal)}</p>
      <p style="margin:6px 0 0;color:#dc2626;font-size:13px;">Vence el <strong>${fechaVenc}</strong></p>
    </div>
    <a href="${portalUrl}" style="display:block;background:#2563ae;color:#fff;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:20px;">
      Ver liquidación completa →
    </a>
    <p style="margin:0;color:#9ca3af;font-size:13px;">El PDF con el desglose completo está adjunto a este correo.</p>
  </div>
  <div style="background:#f9fafb;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">
      Enviado por <strong style="color:#6b7280;">propify</strong> · ${edificio?.nombre ?? ''}
    </p>
  </div>
</div></body></html>`

      const filename = `liquidacion-unidad-${unidadNum}-${mes}-${anoNum}.pdf`

      const { error: sendError } = await resend.emails.send({
        from,
        to:      residente.email,
        subject,
        html,
        attachments: [{ filename, content: Buffer.from(pdfBuffer).toString('base64') }],
      })

      if (sendError) {
        resultados.push({ unidadNumero: unidadNum, email: residente.email, status: 'error', error: sendError.message })
      } else {
        resultados.push({ unidadNumero: unidadNum, email: residente.email, status: 'ok' })
      }
    } catch (err) {
      resultados.push({
        unidadNumero: unidadNum, email: residente.email, status: 'error',
        error: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  const enviados = resultados.filter(r => r.status === 'ok').length
  const fallidos = resultados.filter(r => r.status === 'error').length

  return NextResponse.json({ ok: true, enviados, fallidos, detalle: resultados })
}
