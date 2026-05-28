/**
 * GET /api/suscripcion?edificioId=xxx
 * Retorna la suscripción activa del edificio con el plan incluido.
 * Usa dos queries separadas (sin JOIN FK) para máxima compatibilidad con PostgREST.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const edificioId = req.nextUrl.searchParams.get('edificioId')
    if (!edificioId) {
      return NextResponse.json({ error: 'edificioId requerido.' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // 1. Obtener suscripción activa
    const { data: sub, error: subError } = await db
      .from('suscripciones')
      .select('*')
      .eq('edificioId', edificioId)
      .eq('estado', 'activa')
      .order('creadoEn', { ascending: false })
      .limit(1)
      .single()

    if (subError) {
      // Sin suscripción activa → devuelve null (el componente usará plan_free)
      if (subError.code === 'PGRST116') {
        return NextResponse.json({ suscripcion: null })
      }
      return NextResponse.json({ error: subError.message }, { status: 500 })
    }

    // 2. Obtener el plan asociado (query separada, sin FK join)
    const { data: plan } = await db
      .from('planes')
      .select('*')
      .eq('id', sub.planId)
      .single()

    return NextResponse.json({ suscripcion: { ...sub, plan: plan ?? null } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
