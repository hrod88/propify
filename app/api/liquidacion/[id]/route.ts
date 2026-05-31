/**
 * GET /api/liquidacion/[id]
 * Genera y retorna el PDF de la Liquidación de Gastos Comunes.
 * Corre en runtime Node.js (no Edge) — @react-pdf/renderer requiere APIs de Node.
 *
 * v2: incluye historial de la unidad + QR code al portal de pago.
 */
import { NextRequest } from 'next/server'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import QRCode from 'qrcode'
import { LiquidacionPDF } from '@/components/pdf/LiquidacionPDF'
import {
  getGastoComunById,
  getUnidades,
  getUsuarios,
  getEdificioById,
  getHistorialGastosUnidad,
} from '@/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

// URL base del portal de pago (pública, sin auth)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://propify-rust.vercel.app'

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    // ── Obtener datos principales ──────────────────────────────
    const gasto = await getGastoComunById(id)
    if (!gasto) return new Response('Gasto no encontrado', { status: 404 })

    const [unidades, users, edificio, historial] = await Promise.all([
      getUnidades(gasto.edificioId),
      getUsuarios(gasto.edificioId),
      getEdificioById(gasto.edificioId),
      getHistorialGastosUnidad(gasto.unidadId, id, 3),
    ])

    const unidad    = unidades.find(u => u.id === gasto.unidadId) ?? null
    const uid       = unidad?.arrendatarioId ?? unidad?.propietarioId ?? null
    const residente = uid ? (users.find(u => u.id === uid) ?? null) : null

    // ── Generar QR apuntando al portal de pago ─────────────────
    const portalUrl = `${BASE_URL}/portal/pagar/${id}`
    let qrDataUrl: string | undefined
    try {
      qrDataUrl = await QRCode.toDataURL(portalUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#1e3a5f', light: '#ffffff' },
      })
    } catch (qrErr) {
      console.warn('[liquidacion/pdf] QR generation failed:', qrErr)
    }

    // ── Generar PDF ────────────────────────────────────────────
    const element = createElement(
      LiquidacionPDF,
      { gasto, unidad, edificio, residente, historial, qrDataUrl },
    ) as unknown as ReactElement<DocumentProps>

    const buffer = await renderToBuffer(element)

    const año      = gasto['año'] as number
    const filename = `liquidacion-unidad-${unidad?.numero ?? 'X'}-${gasto.mes}-${año}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('[liquidacion/pdf]', err)
    return new Response('Error generando PDF', { status: 500 })
  }
}
