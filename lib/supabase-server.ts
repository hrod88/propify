/**
 * lib/supabase-server.ts
 * Fábrica de cliente Supabase para Server Components, Server Actions y proxy.ts.
 * Lee/escribe la sesión desde las cookies de la request HTTP.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Llamado desde un Server Component: no puede mutar cookies.
          // proxy.ts se encarga de refrescar el token de sesión.
        }
      },
    },
  })
}
