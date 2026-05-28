/**
 * GET /auth/callback
 * Callback de Supabase Auth para flujos PKCE:
 *  - Invitaciones de residentes (inviteUserByEmail)
 *  - Magic links (signInWithOtp)
 *
 * Intercambia el `code` por una sesión activa, luego redirige
 * al destino correcto según el rol del usuario.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') as 'invite' | 'magiclink' | 'recovery' | null

  const client = await createSupabaseServerClient()

  let userEmail: string | undefined

  // ── Flujo PKCE (código de autorización) ──
  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code)
    if (!error) userEmail = data.user?.email ?? undefined
  }

  // ── Flujo legacy token_hash (OTP / invite antiguo) ──
  if (!userEmail && tokenHash && type) {
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) userEmail = data.user?.email ?? undefined
  }

  if (userEmail) {
    // Determinar redirección según rol del usuario
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('email', userEmail)
      .single()

    const rol = usuario?.rol as string | undefined

    if (rol === 'propietario' || rol === 'arrendatario') {
      return NextResponse.redirect(new URL('/mi-unidad', origin))
    }
    if (rol === 'conserje') {
      return NextResponse.redirect(new URL('/visitas', origin))
    }
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  // Si algo falla, volver al login con mensaje de error
  return NextResponse.redirect(new URL('/login?error=auth_callback', origin))
}
