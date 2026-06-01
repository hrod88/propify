/**
 * POST /api/onboarding
 * Crea el edificio, el usuario administrador, y opcionalmente
 * configura datos financieros en la DB después del signUp.
 * Usa getSupabaseAdmin() (service_role) para bypassear RLS.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>
    const {
      nombre, apellido, email,
      edificioNombre, direccion, comuna, ciudad, rut,
      pisos, totalUnidades,
      // Datos financieros (step 3 — opcionales)
      banco, cuentaCorriente, emailPago,
      nombreAdmin, telefonoAdmin, horarioAdmin,
    } = body

    if (!nombre || !apellido || !email || !edificioNombre || !direccion || !comuna || !ciudad) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    const db         = getSupabaseAdmin()
    const edificioId = crypto.randomUUID()
    const adminId    = crypto.randomUUID()
    const ahora      = new Date().toISOString()

    // 1. Crear edificio (con datos financieros si vienen)
    const { error: errEdificio } = await db.from('edificios').insert({
      id:              edificioId,
      nombre:          edificioNombre,
      direccion,
      comuna,
      ciudad,
      rut:               rut             || null,
      pisos:             Number(pisos)   || 1,
      totalUnidades:     Number(totalUnidades) || 0,
      administradorId:   adminId,
      activo:            true,
      creadoEn:          ahora,
      // Financiero
      banco:             banco           || null,
      cuentaCorriente:   cuentaCorriente || null,
      emailPago:         emailPago       || null,
      nombreAdmin:       nombreAdmin     || `${nombre} ${apellido}`,
      telefonoAdmin:     telefonoAdmin   || null,
      horarioAdmin:      horarioAdmin    || null,
    })

    if (errEdificio) {
      console.error('onboarding/edificio:', errEdificio.message)
      return NextResponse.json({ error: errEdificio.message }, { status: 500 })
    }

    // 2. Crear usuario administrador
    const { error: errUsuario } = await db.from('usuarios').insert({
      id:          adminId,
      nombre,
      apellido,
      email:       email.trim().toLowerCase(),
      rol:         'administrador',
      edificioId,
      activo:      true,
      creadoEn:    ahora,
    })

    if (errUsuario) {
      console.error('onboarding/usuario:', errUsuario.message)
      // Rollback edificio
      await db.from('edificios').delete().eq('id', edificioId)
      return NextResponse.json({ error: errUsuario.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, edificioId })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
