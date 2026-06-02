/**
 * POST /api/leads
 * Guarda un lead capturado desde el exit-intent popup de la landing page.
 * Usa service_role para bypassear RLS (la policy de SELECT está bloqueada para anon).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, edificio, interes } = await req.json() as {
      nombre:   string
      email:    string
      edificio?: string
      interes:  string
    }

    if (!nombre?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('leads').insert({
      nombre:  nombre.trim(),
      email:   email.trim().toLowerCase(),
      edificio: edificio?.trim() || null,
      interes: interes ?? 'demo',
      fuente:  'exit_intent',
    })

    if (error) {
      console.error('[leads] Supabase error:', error.message)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[leads] Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
