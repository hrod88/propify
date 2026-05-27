/**
 * lib/supabase-browser.ts
 * Cliente Supabase para Client Components ('use client').
 * Usa @supabase/ssr → guarda la sesión en cookies (no en localStorage),
 * lo que permite que proxy.ts la lea server-side.
 */
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!

export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseKey)
