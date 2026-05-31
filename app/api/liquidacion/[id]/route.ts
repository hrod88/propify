/**
 * GET /api/liquidacion/[id]
 * Genera y retorna el PDF de la Liquidación de Gastos Comunes para un gasto dado.
 * Corre en runtime Node.js (no Edge) — @react-pdf/renderer requiere APIs de Node.
 */
import { NextRequest } from 'next/server'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { LiquidacionPDF } from '@/components/pdf/LiquidacionPDF'
import { getGastoComunById, getUnidades, getUsuarios, getEdificioById } from '@/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    // ── Obtener datos ──────────────────────────────────────────
    const gasto = await getGastoComunById(id)
    if (!gasto) {
      return new Response('Gasto no encontrado', { status: 404 })
    }

    const [unidades, users, edificio] = await Promise.all([
      getUnidades(gasto.edificioId),
      getUsuarios(gasto.edificioId),
      getEdificioById(gasto.edificioId),
    ])

    const unidad    = unidades.find(u => u.id === gasto.unidadId) ?? null
    const uid       = unidad?.arrendatarioId ?? unidad?.propietarioId ?? null
    const residente = uid ? (users.find(u => u.id === uid) ?? null) : null

    // ── Generar PDF ──────────────────────────────────────────
    // Cast necesario: createElement infiere FunctionComponentElement<Props> pero
    // renderToBuffer espera ReactElement<DocumentProps>. LiquidacionPDF retorna
    // un <Document> así que el cast es seguro.
    const element = createElement(
      LiquidacionPDF,
      { gasto, unidad, edificio, residente },
    ) as unknown as ReactElement<DocumentProps>

    const buffer = await renderToBuffer(element)

    // año tiene acento — acceder con índice para evitar TS quirk en algunos entornos
    const año      = gasto['año'] as number
    const filename = `liquidacion-unidad-${unidad?.numero ?? 'X'}-${gasto.mes}-${año}.pdf`

    // Buffer de Node → Uint8Array para la Web Response API
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
