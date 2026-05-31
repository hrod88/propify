/**
 * POST /api/webpay/iniciar
 * Inicia una transacción WebPay Plus con Transbank.
 *
 * Body: { gastoId: string }
 * Returns: { url: string; token: string }
 *
 * Credenciales:
 *   - Test:       WEBPAY_COMMERCE_CODE + WEBPAY_API_KEY no definidos → usa credenciales de integración Transbank
 *   - Producción: definir WEBPAY_COMMERCE_CODE y WEBPAY_API_KEY en variables de entorno Vercel
 */
import { NextRequest, NextResponse } from 'next/server'
import { WebpayPlus, IntegrationCommerceCodes, IntegrationApiKeys } from 'transbank-sdk'
import { getGastoComunById, getUnidades } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://propify-rust.vercel.app'

export async function POST(req: NextRequest) {
  let body: { gastoId?: string }
  try { body = await req.json() as typeof body }
  catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const { gastoId } = body
  if (!gastoId) return NextResponse.json({ error: 'gastoId requerido' }, { status: 400 })

  const gasto = await getGastoComunById(gastoId)
  if (!gasto) return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })

  if (gasto.estadoPago === 'pagado') {
    return NextResponse.json({ error: 'Este gasto ya está pagado' }, { status: 409 })
  }

  const unidades  = await getUnidades(gasto.edificioId)
  const unidad    = unidades.find(u => u.id === gasto.unidadId)
  const unidadNum = unidad?.numero ?? '?'

  // ── Configurar Transbank usando static builders ─────────────
  const commerceCode = process.env.WEBPAY_COMMERCE_CODE
  const apiKey       = process.env.WEBPAY_API_KEY

  const tx = (commerceCode && apiKey)
    ? WebpayPlus.Transaction.buildForProduction(commerceCode, apiKey)
    : WebpayPlus.Transaction.buildForIntegration(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
      )

  const returnUrl = `${BASE_URL}/api/webpay/retorno`
  const sessionId = `propify-${gastoId}-${Date.now()}`
  const buyOrder  = `GC-${unidadNum}-${gasto.mes}-${gasto['año'] as number}`.slice(0, 26)

  try {
    const response = await tx.create(buyOrder, sessionId, gasto.montoTotal, returnUrl)
    return NextResponse.json({ url: response.url, token: response.token })
  } catch (err) {
    console.error('[webpay/iniciar]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error Transbank' },
      { status: 500 },
    )
  }
}
