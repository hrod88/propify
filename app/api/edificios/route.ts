/**
 * POST /api/edificios
 * Crea un nuevo edificio en la base de datos.
 * Requiere SUPABASE_SERVICE_ROLE_KEY para bypassear RLS.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED = new Set([
  'nombre', 'direccion', 'comuna', 'ciudad',
  'totalUnidades', 'pisos', 'anoconstruccion',
  'rut', 'banco', 'cuentaCorriente', 'emailPago',
  'telefonoAdmin', 'horarioAdmin', 'nombreAdmin',
  'administradorId',
])

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const { nombre, direccion, comuna, ciudad } = body as {
    nombre?: string; direccion?: string; comuna?: string; ciudad?: string
  }
  if (!nombre?.trim() || !direccion?.trim() || !comuna?.trim() || !ciudad?.trim()) {
    return NextResponse.json({ error: 'nombre, dirección, comuna y ciudad son obligatorios' }, { status: 400 })
  }

  // Generar ID slug a partir del nombre
  const id = nombre.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
    + '-' + Date.now().toString(36)

  // Filtrar solo campos permitidos
  const payload: Record<string, unknown> = { id }
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED.has(k)) payload[k] = v
  }
  payload['activo']     = true
  payload['creadoEn']   = new Date().toISOString()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } },
  )

  const { data, error } = await admin
    .from('edificios')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('[POST /api/edificios]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, edificio: data }, { status: 201 })
}
