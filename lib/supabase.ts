/**
 * lib/supabase.ts
 * Re-exporta supabaseBrowser como 'supabase' para mantener compatibilidad
 * con todos los imports existentes en View.tsx (Client Components).
 *
 * supabaseBrowser usa @supabase/ssr → guarda la sesión en cookies
 * (no en localStorage) → las queries fire-and-forget en View.tsx
 * se ejecutan como `authenticated`, respetando las políticas RLS.
 *
 * IMPORTANTE: solo usar en Client Components ('use client').
 * Para Server Components / Route Handlers usar createSupabaseServerClient().
 */
export { supabaseBrowser as supabase } from './supabase-browser'
