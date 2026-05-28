/**
 * POST /api/suscripcion/upgrade
 * Cambia el plan de un edificio (mock: sin pasarela real).
 * Body: { edificioId, planId }
 *
 * En producción, aquí iría la creación de la sesión de pago
 * (Stripe Checkout / Flow) antes de activar el plan.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>
    const { edificioId, planId } = body

    if (!edificioId || !planId) {
      return NextResponse.json({ error: 'edificioId y planId son requeridos.' }, { status: 400 })
    }

    const db   = getSupabaseAdmin()
    const ahora = new Date().toISOString()

    // 1. Verificar que el plan existe
    const { data: plan, error: planError } = await db
      .from('planes')
      .select('id, nombre')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado.' }, { status: 404 })
    }

    // 2. Cancelar suscripciones activas anteriores
    await db
      .from('suscripciones')
      .update({ estado: 'cancelada' })
      .eq('edificioId', edificioId)
      .eq('estado', 'activa')

    // 3. Crear nueva suscripción activa
    const nuevaSubId = crypto.randomUUID()
    const { error: insertError } = await db.from('suscripciones').insert({
      id:          nuevaSubId,
      edificioId,
      planId,
      estado:      'activa',
      fechaInicio: ahora,
      creadoEn:    ahora,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, planNombre: plan.nombre })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
