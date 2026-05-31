/**
 * GET  /api/fondos?edificioId=&mes=&año=
 * POST /api/fondos   { edificioId, mes, año, nombre, cobrado, ingresos, egresos, saldoActual }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const edificioId = searchParams.get('edificioId')
  const mes        = searchParams.get('mes')
  const año        = searchParams.get('año')

  if (!edificioId) return NextResponse.json({ error: 'Falta edificioId' }, { status: 400 })

  let q = sb().from('fondos_comunidad').select('*').eq('edificioId', edificioId)
  if (mes) q = q.eq('mes', Number(mes))
  if (año) q = q.eq('año', Number(año))
  q = q.order('año', { ascending: false }).order('mes', { ascending: false }).order('nombre')

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ fondos: data ?? [] })
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const { edificioId, mes, año, nombre } = body
  if (!edificioId || !mes || !año || !nombre) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error } = await sb()
    .from('fondos_comunidad')
    .insert({ ...body, id: crypto.randomUUID() })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, fondo: data })
}
