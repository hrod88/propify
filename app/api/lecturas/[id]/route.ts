/**
 * PATCH  /api/lecturas/[id]
 * DELETE /api/lecturas/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type RouteContext = { params: Promise<{ id: string }> }

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const { data, error } = await sb()
    .from('lecturas').update(body).eq('id', id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, lectura: data })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const { error } = await sb().from('lecturas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
