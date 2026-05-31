/**
 * GET /api/liquidacion/[id]
 * Genera el PDF de Liquidación de Gastos Comunes.
 * Runtime Node.js (no Edge) — @react-pdf/renderer requiere APIs de Node.
 *
 * v3: incluye egresos comunidad, lecturas medidores, fondos, evolución de egresos.
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
  getEgresosByPeriodo,
  getLecturasByPeriodo,
  getFondosByPeriodo,
  getEvolucionEgresos,
} from '@/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://propify-rust.vercel.app'

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    // ── Datos principales ────────────────────────────────────
    const gasto = await getGastoComunById(id)
    if (!gasto) return new Response('Gasto no encontrado', { status: 404 })

    const mes = gasto.mes
    const año = gasto['año'] as number

    const [unidades, users, edificio, historial, egresos, lecturas, fondos, evolucion] =
      await Promise.all([
        getUnidades(gasto.edificioId),
        getUsuarios(gasto.edificioId),
        getEdificioById(gasto.edificioId),
        getHistorialGastosUnidad(gasto.unidadId, id, 3),
        getEgresosByPeriodo(gasto.edificioId, mes, año),
        getLecturasByPeriodo(gasto.edificioId, mes, año),
        getFondosByPeriodo(gasto.edificioId, mes, año),
        getEvolucionEgresos(gasto.edificioId, 12),
      ])

    const unidad    = unidades.find(u => u.id === gasto.unidadId) ?? null
    const uid       = unidad?.arrendatarioId ?? unidad?.propietarioId ?? null
    const residente = uid ? (users.find(u => u.id === uid) ?? null) : null

    // ── QR portal de pago ───────────────────────────────────
    const portalUrl = `${BASE_URL}/portal/pagar/${id}`
    let qrDataUrl: string | undefined
    try {
      qrDataUrl = await QRCode.toDataURL(portalUrl, {
        width: 200, margin: 1,
        color: { dark: '#1e3a5f', light: '#ffffff' },
      })
    } catch (qrErr) {
      console.warn('[liquidacion/pdf] QR failed:', qrErr)
    }

    // ── Generar PDF ─────────────────────────────────────────
    const element = createElement(
      LiquidacionPDF,
      { gasto, unidad, edificio, residente, historial, qrDataUrl, egresos, lecturas, fondos, evolucion },
    ) as unknown as ReactElement<DocumentProps>

    const buffer   = await renderToBuffer(element)
    const filename = `liquidacion-unidad-${unidad?.numero ?? 'X'}-${mes}-${año}.pdf`

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
