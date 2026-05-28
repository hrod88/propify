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

/**
 * Retorna edificioId + nombre del usuario autenticado.
 * Fallback a 'e1' / 'Admin' si no hay sesión.
 */
export async function getUsuarioActual(): Promise<{
  edificioId: string
  nombre: string
  apellido: string
}> {
  try {
    const client = await createSupabaseServerClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user?.email) return { edificioId: 'e1', nombre: 'Admin', apellido: '' }

    const { data } = await supabase
      .from('usuarios')
      .select('edificioId, nombre, apellido')
      .eq('email', user.email)
      .single()

    const u = data as { edificioId?: string; nombre?: string; apellido?: string } | null
    return {
      edificioId: u?.edificioId ?? 'e1',
      nombre:     u?.nombre    ?? 'Admin',
      apellido:   u?.apellido  ?? '',
    }
  } catch {
    return { edificioId: 'e1', nombre: 'Admin', apellido: '' }
  }
}
