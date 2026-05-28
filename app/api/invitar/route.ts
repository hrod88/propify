/**
 * POST /api/invitar
 * Pre-crea el registro del residente en la tabla usuarios y envía
 * un email de invitación vía Supabase Auth Admin (inviteUserByEmail).
 * Usa getSupabaseAdmin() (service_role) — solo ejecutable en el servidor.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://propify-rust.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>
    const { email, nombre, apellido, rol, unidadId, edificioId } = body

    if (!email || !nombre || !apellido || !rol || !edificioId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const db        = getSupabaseAdmin()
    const usuarioId = crypto.randomUUID()
    const ahora     = new Date().toISOString()

    // 1. Pre-crear usuario en la tabla usuarios
    const { error: errUsuario } = await db.from('usuarios').insert({
      id:         usuarioId,
      nombre,
      apellido,
      email:      email.trim().toLowerCase(),
      rol,
      edificioId,
      unidadId:   unidadId || null,
      activo:     true,
      creadoEn:   ahora,
    })

    // Si el email ya existe en la tabla, continuamos igual (idempotente)
    if (errUsuario) {
      const isDuplicate =
        errUsuario.message.includes('duplicate') ||
        errUsuario.message.includes('unique')
      if (!isDuplicate) {
        console.error('invitar/usuario:', errUsuario.message)
        return NextResponse.json({ error: errUsuario.message }, { status: 500 })
      }
    }

    // 2. Enviar email de invitación vía Supabase Auth Admin
    const { error: errInvite } = await db.auth.admin.inviteUserByEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${SITE_URL}/auth/callback` },
    )

    if (errInvite) {
      console.error('invitar/email:', errInvite.message)
      return NextResponse.json({ error: errInvite.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
