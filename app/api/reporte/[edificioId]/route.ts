/**
 * GET /api/reporte/[edificioId]?mes=N&año=N
 * Genera el PDF de reporte contable mensual.
 */
import { NextRequest } from 'next/server'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import {
  getGastosComunes, getUnidades, getUsuarios, getEdificioById,
  getEgresosByPeriodo, getFondosByPeriodo,
} from '@/lib/db'
import { ReportePDF } from '@/components/pdf/ReportePDF'

type RouteContext = { params: Promise<{ edificioId: string }> }

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { edificioId } = await params
    const url  = new URL(req.url)
    const mes  = Number(url.searchParams.get('mes'))  || new Date().getMonth() + 1
    const año  = Number(url.searchParams.get('año'))  || new Date().getFullYear()

    const [gastos, unidades, usuarios, edificio, egresos, fondos] = await Promise.all([
      getGastosComunes(edificioId),
      getUnidades(edificioId),
      getUsuarios(edificioId),
      getEdificioById(edificioId),
      getEgresosByPeriodo(edificioId, mes, año),
      getFondosByPeriodo(edificioId, mes, año),
    ])

    const element = createElement(ReportePDF, {
      edificioNombre: edificio?.nombre ?? edificioId,
      mes, año, gastos, egresos, fondos, unidades, usuarios,
    }) as unknown as ReactElement<DocumentProps>

    const buffer   = await renderToBuffer(element)
    const filename = `reporte-${edificioId}-${mes}-${año}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (err) {
    console.error('[reporte/pdf]', err)
    return new Response('Error generando reporte', { status: 500 })
  }
}
