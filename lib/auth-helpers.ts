/**
 * lib/auth-helpers.ts
 * Helpers para obtener datos del usuario autenticado en Server Components.
 * Usados por page.tsx para scoping multi-tenant de todas las queries.
 *
 * Fase 29: super_admin / administrador pueden sobreescribir el edificioId
 * con la cookie `propify_edificio_activo` (set por edificio-context.tsx).
 */
import { cookies }                    from 'next/headers'
import { createSupabaseServerClient } from './supabase-server'
import { supabase }                   from './supabase'

/**
 * Retorna el edificioId del usuario autenticado actualmente.
 * Para admin/super_admin: respeta la cookie de override si está presente.
 * Fallback a 'mirador-sacramentinos' si no hay sesión o el usuario no tiene edificio asignado.
 */
export async function getEdificioActual(): Promise<string> {
  try {
    const cookieStore = await cookies()

    const client = await createSupabaseServerClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user?.email) {
      // Sin sesión: usar cookie si existe, si no 'mirador-sacramentinos'
      return cookieStore.get('propify_edificio_activo')?.value ?? 'mirador-sacramentinos'
    }

    const { data } = await supabase
      .from('usuarios')
      .select('edificioId, rol')
      .eq('email', user.email)
      .single()

    const u           = data as { edificioId?: string; rol?: string } | null
    const userEdifId  = u?.edificioId ?? 'mirador-sacramentinos'
    const userRol     = u?.rol ?? ''

    // Admins pueden cambiar de edificio vía cookie
    if (userRol === 'super_admin' || userRol === 'administrador') {
      const override = cookieStore.get('propify_edificio_activo')?.value
      if (override) return override
    }

    return userEdifId
  } catch {
    return 'mirador-sacramentinos'
  }
}

/**
 * Retorna edificioId + nombre del usuario autenticado.
 * Fallback a 'mirador-sacramentinos' / 'Admin' si no hay sesión.
 */
export async function getUsuarioActual(): Promise<{
  edificioId: string
  nombre: string
  apellido: string
}> {
  try {
    const client = await createSupabaseServerClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user?.email) return { edificioId: 'mirador-sacramentinos', nombre: 'Admin', apellido: '' }

    const { data } = await supabase
      .from('usuarios')
      .select('edificioId, nombre, apellido')
      .eq('email', user.email)
      .single()

    const u = data as { edificioId?: string; nombre?: string; apellido?: string } | null
    return {
      edificioId: u?.edificioId ?? 'mirador-sacramentinos',
      nombre:     u?.nombre    ?? 'Admin',
      apellido:   u?.apellido  ?? '',
    }
  } catch {
    return { edificioId: 'mirador-sacramentinos', nombre: 'Admin', apellido: '' }
  }
}

