/**
 * GET /api/cron/vencimientos
 * Ejecutado por Vercel Cron todos los días a las 10:00 AM Chile (UTC-4 → 13:00 UTC)
 * Envía recordatorio de pago a residentes con gasto venciendo en 3 días o ya vencido.
 *
 * Protegido con CRON_SECRET para evitar ejecución externa no autorizada.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { formatCLP } from '@/lib/db'

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://propify-rust.vercel.app'

export async function GET(req: NextRequest) {
  // Verificar CRON_SECRET (Vercel lo envía como header Authorization)
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[cron/vencimientos] RESEND_API_KEY no configurada')
    return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 503 })
  }

  // ── Calcular fechas clave ─────────────────────────────────────────────
  const hoy = new Date()
  hoy.setUTCHours(0, 0, 0, 0)

  const en3dias = new Date(hoy)
  en3dias.setUTCDate(en3dias.getUTCDate() + 3)

  const fmt = (d: Date) => d.toISOString().split('T')[0]

  // ── Obtener gastos pendientes / vencidos ──────────────────────────────
  const { data: gastos, error: gastosErr } = await supabase
    .from('gastos_comunes')
    .select('*')
    .in('estadoPago', ['pendiente', 'vencido'])
    .or(`fechaVencimiento.eq.${fmt(en3dias)},fechaVencimiento.eq.${fmt(hoy)}`)

  if (gastosErr) {
    console.error('[cron/vencimientos] query gastos:', gastosErr.message)
    return NextResponse.json({ error: gastosErr.message }, { status: 500 })
  }

  if (!gastos || gastos.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0, mensaje: 'Sin vencimientos hoy' })
  }

  // ── Cargar unidades y usuarios en batch ──────────────────────────────
  const edificioIds = [...new Set(gastos.map((g: { edificioId: string }) => g.edificioId))]

  const [{ data: unidades }, { data: usuarios }, { data: edificios }] = await Promise.all([
    supabase.from('unidades').select('*').in('edificioId', edificioIds),
    supabase.from('usuarios').select('*').in('edificioId', edificioIds),
    supabase.from('edificios').select('*').in('id', edificioIds),
  ])

  const resend = new Resend(apiKey)
  const from   = process.env.RESEND_FROM ?? 'Propify <onboarding@resend.dev>'

  let enviados = 0
  let errores  = 0

  for (const gasto of gastos) {
    const unidad    = (unidades ?? []).find((u: { id: string }) => u.id === gasto.unidadId)
    const uid       = unidad?.arrendatarioId ?? unidad?.propietarioId
    const residente = uid ? (usuarios ?? []).find((u: { id: string }) => u.id === uid) : null
    const edificio  = (edificios ?? []).find((e: { id: string }) => e.id === gasto.edificioId)

    if (!residente?.email) continue

    const año        = gasto['año'] as number
    const mesNombre  = MESES[gasto.mes]
    const portalUrl  = `${BASE_URL}/portal/pagar/${gasto.id}`
    const fechaVenc  = new Date(gasto.fechaVencimiento + 'T12:00:00')
      .toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

    const esVencido  = gasto.estadoPago === 'vencido'
    const esHoy      = fmt(new Date(gasto.fechaVencimiento + 'T12:00:00')) === fmt(hoy)

    const asunto = esVencido
      ? `⚠️ Pago vencido — Unidad ${unidad?.numero} · ${mesNombre} ${año}`
      : esHoy
        ? `🔔 Tu gasto común vence HOY — Unidad ${unidad?.numero}`
        : `📅 Recordatorio: gasto común vence en 3 días — Unidad ${unidad?.numero}`

    const colorBanner = esVencido ? '#dc2626' : esHoy ? '#d97706' : '#2563ae'
    const bgBanner    = esVencido ? '#fee2e2' : esHoy ? '#fef3c7' : '#eff6ff'
    const mensajeTop  = esVencido
      ? `Tu pago está <strong>vencido</strong>. Por favor regulariza lo antes posible para evitar recargos.`
      : esHoy
        ? `Tu gasto común vence <strong>hoy</strong>. ¡No olvides realizar el pago!`
        : `Tu gasto común vence el <strong>${fechaVenc}</strong>. Te recordamos realizar el pago a tiempo.`

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
    <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">${mensajeTop}</p>
    <div style="background:${bgBanner};border-left:4px solid ${colorBanner};border-radius:0 8px 8px 0;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;">Unidad ${unidad?.numero ?? ''} · ${mesNombre} ${año}</p>
      <p style="margin:8px 0 0;color:#1e3a5f;font-size:32px;font-weight:700;">${formatCLP(gasto.montoTotal)}</p>
      <p style="margin:6px 0 0;font-size:13px;color:${colorBanner};">Vence el <strong>${fechaVenc}</strong></p>
    </div>
    <a href="${portalUrl}" style="display:block;background:#2563ae;color:#fff;text-align:center;padding:14px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
      Ver liquidación y datos de pago →
    </a>
  </div>
  <div style="background:#f9fafb;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">Enviado automáticamente por <strong>propify</strong> · ${edificio?.nombre ?? ''}</p>
  </div>
</div></body></html>`

    try {
      const { error } = await resend.emails.send({
        from,
        to:      residente.email,
        subject: asunto,
        html,
      })
      if (error) { errores++; console.warn('[cron/vencimientos] send error:', error.message) }
      else        { enviados++ }
    } catch (err) {
      errores++
      console.error('[cron/vencimientos] catch:', err)
    }
  }

  console.log(`[cron/vencimientos] enviados=${enviados} errores=${errores}`)
  return NextResponse.json({ ok: true, enviados, errores, total: gastos.length })
}
