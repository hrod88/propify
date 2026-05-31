/**
 * PATCH /api/edificios/[id]
 * Actualiza campos configurables del edificio:
 * nombre, rut, banco, cuentaCorriente, emailPago, telefonoAdmin, horarioAdmin
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

type RouteContext = { params: Promise<{ id: string }> }

// Campos permitidos para actualizar vía esta ruta
const ALLOWED = new Set([
  'nombre', 'direccion', 'comuna', 'ciudad', 'rut',
  'banco', 'cuentaCorriente', 'emailPago', 'telefonoAdmin', 'horarioAdmin', 'nombreAdmin',
  'totalUnidades', 'pisos', 'anoconstruccion',
])

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  // Filtrar sólo campos permitidos
  const updates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED.has(k)) updates[k] = v
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin campos válidos para actualizar' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase
    .from('edificios')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[PATCH edificios]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, edificio: data })
}
