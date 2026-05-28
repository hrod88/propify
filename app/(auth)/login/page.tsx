'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { supabase }         from '@/lib/supabase'
import type { UserRole }    from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShow] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor completa todos los campos.')
      return
    }

    setLoading(true)

    // 1. Autenticar con Supabase Auth (sesión guardada en cookies automáticamente)
    const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (authError) {
      setError('Email o contraseña incorrectos. Verifica tus datos.')
      setLoading(false)
      return
    }

    // 2. Obtener rol del usuario desde la tabla usuarios
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('email', email.trim().toLowerCase())
      .single()

    const rol = (usuario?.rol ?? 'administrador') as UserRole

    // 3. Guardar en localStorage para que RolProvider lo lea mientras carga
    localStorage.setItem('propify_rol', rol)

    // 4. Redirigir según rol
    const destino =
      rol === 'propietario' || rol === 'arrendatario' ? '/mi-unidad' : '/dashboard'
    router.push(destino)
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Panel izquierdo: branding ── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2341 0%, #1e3a5f 50%, #2563ae 100%)' }}
      >
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full bg-blue-300 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Propify</h1>
            <p className="text-blue-200 text-sm">Administración de Edificios</p>
          </div>
        </div>

        {/* Contenido central */}
        <div className="relative space-y-6">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
            Tu edificio,<br />
            <span className="text-blue-300">gestionado</span> de<br />
            forma inteligente.
          </h2>
          <p className="text-blue-200 text-lg max-w-md leading-relaxed">
            Plataforma integral para administradoras, conserjes, propietarios y arrendatarios.
            Transparencia total, comunidad digital.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[
              '✅ Gastos comunes transparentes',
              '📦 Control de paquetes y lockers',
              '🔧 Solicitudes de mantención',
              '📅 Reservas de espacios comunes',
              '💳 Pagos en línea',
              '🤖 Asistente IA 24/7',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-blue-100 text-sm">
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative flex items-center gap-2 text-blue-300 text-sm">
          <Shield className="w-4 h-4" />
          <span>Cumple con la Ley de Copropiedad 2022 vigente 2026</span>
        </div>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        {/* Logo móvil */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: '#1e3a5f' }}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: '#1e3a5f' }}>Propify</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Iniciar sesión</h2>
            <p className="text-gray-500 mt-2">Bienvenido de vuelta 👋</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nombre@ejemplo.cl"
                  autoComplete="email"
                  suppressHydrationWarning
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  suppressHydrationWarning
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShow(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #2563ae)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : (
                'Ingresar al portal'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            ¿Eres administrador de un edificio?{' '}
            <Link href="/registro" className="text-blue-600 hover:text-blue-700 font-medium">
              Registra tu edificio →
            </Link>
          </p>

          {/* Nota informativa */}
          <div className="mt-6 p-3 rounded-xl border border-blue-100 bg-blue-50">
            <p className="text-xs text-blue-600 text-center leading-relaxed">
              🔐 Tu acceso y rol son asignados por el administrador del edificio.
              Contacta a tu administrador si no tienes credenciales.
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-300 text-center">
          © 2026 Propify · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
