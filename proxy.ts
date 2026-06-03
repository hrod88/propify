/**
 * proxy.ts  ← Next.js 16 renombró middleware.ts a proxy.ts
 *
 * Intercepta todas las requests para:
 * 1. Redirigir usuarios no autenticados que intenten acceder al dashboard.
 * 2. Redirigir usuarios autenticados que visiten /login.
 * 3. Refrescar el token de sesión automáticamente si expiró.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Prefijos de rutas que requieren sesión activa
const RUTAS_PROTEGIDAS = [
  '/dashboard',
  '/edificios',
  '/unidades',
  '/residentes',
  '/gastos',
  '/pagos',
  '/morosos',
  '/mantenciones',
  '/comunicaciones',
  '/visitas',
  '/reservas',
  '/paquetes',
  '/reportes',
  '/configuracion',
  '/mi-unidad',
  // ── Módulos fase 31-34 ──────────────────────────────────────
  '/personal',
  '/novedades',
  '/contratos',
  '/actas',
  '/amenidades',
  '/egresos',
  '/proveedores',
  '/presupuesto',
  '/balance',
  '/facturacion',
  '/lecturas',
  '/fondos',
  // ── Módulos fase B/C/D (nuevos) ─────────────────────────────
  '/bodegas',
  '/directorio',
  '/comite',
  '/calculadora',
  '/muro',
  '/encuestas',
  '/marketplace',
  '/mudanzas',
  '/multas',
  '/votaciones',
  '/conciliacion',
]

function esRutaProtegida(pathname: string): boolean {
  return RUTAS_PROTEGIDAS.some(
    ruta => pathname === ruta || pathname.startsWith(ruta + '/')
  )
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Iniciar respuesta (se puede reemplazar si hay cookies de sesión que refrescar)
  let res = NextResponse.next({ request: req })

  // Crear cliente Supabase que lee/escribe cookies de la request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Propagar cookies refrescadas tanto al request como a la response
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() verifica el JWT contra Supabase Auth (más seguro que getSession())
  const { data: { user } } = await supabase.auth.getUser()

  const enRutaProtegida = esRutaProtegida(pathname)
  const enLogin         = pathname === '/login'

  // Sin sesión intentando acceder a ruta protegida → /login
  if (enRutaProtegida && !user) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión intentando acceder a /login → /dashboard
  if (enLogin && user) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return res
}

// El proxy corre en todas las rutas excepto assets estáticos y optimización de imágenes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
