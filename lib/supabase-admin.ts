/**
 * lib/supabase-admin.ts
 * Factory para cliente Supabase con service_role key.
 * Uso EXCLUSIVO en Route Handlers y Server Actions (nunca en cliente).
 *
 * Requiere: SUPABASE_SERVICE_ROLE_KEY en .env.local y Vercel env vars.
 * Lazy: el cliente se crea en runtime, no en el import del módulo.
 */
import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Faltan variables de entorno del servidor: NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY',
    )
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  })
}
