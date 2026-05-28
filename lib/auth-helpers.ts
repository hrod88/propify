/**
 * lib/auth-helpers.ts
 * Helpers para obtener datos del usuario autenticado en Server Components.
 * Usados por page.tsx para scoping multi-tenant de todas las queries.
 */
import { createSupabaseServerClient } from './supabase-server'
import { supabase } from './supabase'

/**
 * Retorna el edificioId del usuario autenticado actualmente.
 * Fallback a 'e1' si no hay sesión o el usuario no tiene edificio asignado.
 */
export async function getEdificioActual(): Promise<string> {
  try {
    const client = await createSupabaseServerClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user?.email) return 'e1'

    const { data } = await supabase
      .from('usuarios')
      .select('edificioId')
      .eq('email', user.email)
      .single()

    return (data as { edificioId?: string } | null)?.edificioId ?? 'e1'
  } catch {
    return 'e1'
  }
}
