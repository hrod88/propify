/**
 * GET + POST /api/webpay/retorno
 * Transbank redirige aquí después del pago (con token_ws en query o body).
 * Confirma la transacción y actualiza el gasto en Supabase.
 */
import { NextRequest, NextResponse } from 'next/server'
import { WebpayPlus, IntegrationCommerceCodes, IntegrationApiKeys } from 'transbank-sdk'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://propify-rust.vercel.app'

async function handleRetorno(token: string | null) {
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/portal/webpay/error?reason=cancelled`)
  }

  const commerceCode = process.env.WEBPAY_COMMERCE_CODE
  const apiKey       = process.env.WEBPAY_API_KEY

  const tx = (commerceCode && apiKey)
    ? WebpayPlus.Transaction.buildForProduction(commerceCode, apiKey)
    : WebpayPlus.Transaction.buildForIntegration(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
      )

  try {
    const response = await tx.commit(token)

    // response.responseCode === 0 → pago aprobado
    if (response.responseCode !== 0) {
      console.warn('[webpay/retorno] rechazado:', response.responseCode)
      return NextResponse.redirect(`${BASE_URL}/portal/webpay/error?reason=rejected&code=${response.responseCode}`)
    }

    // ── Extraer gastoId desde sessionId: "propify-{gastoId}-{timestamp}" ──
    const sessionId = response.sessionId ?? ''
    const gastoId   = sessionId.replace(/^propify-/, '').replace(/-\d+$/, '')

    if (gastoId) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceKey) {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceKey,
          { auth: { persistSession: false } },
        )
        const hoy = new Date().toISOString().split('T')[0]
        await admin
          .from('gastos_comunes')
          .update({ estadoPago: 'pagado', fechaPago: hoy })
          .eq('id', gastoId)
          .eq('estadoPago', 'pendiente')

        console.log(`[webpay/retorno] gasto ${gastoId} marcado como pagado`)
        return NextResponse.redirect(`${BASE_URL}/portal/pagar/${gastoId}?webpay=ok`)
      }
    }

    return NextResponse.redirect(`${BASE_URL}/portal/webpay/ok`)
  } catch (err) {
    console.error('[webpay/retorno]', err)
    return NextResponse.redirect(`${BASE_URL}/portal/webpay/error?reason=exception`)
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token_ws')
  return handleRetorno(token)
}

export async function POST(req: NextRequest) {
  let token: string | null = null
  try {
    const form = await req.formData()
    token = form.get('token_ws') as string | null
  } catch {
    token = req.nextUrl.searchParams.get('token_ws')
  }
  return handleRetorno(token)
}
