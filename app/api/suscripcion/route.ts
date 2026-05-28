/**
 * GET /api/suscripcion?edificioId=xxx
 * Retorna la suscripción activa del edificio con el plan joinado.
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
    const { data, error } = await db
      .from('suscripciones')
      .select('*, plan:planes(*)')
      .eq('edificioId', edificioId)
      .eq('estado', 'activa')
      .order('creadoEn', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // Sin suscripción → devuelve plan gratuito virtual
      if (error.code === 'PGRST116') {
        return NextResponse.json({ suscripcion: null })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ suscripcion: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
