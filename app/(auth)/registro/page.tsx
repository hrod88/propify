'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Eye, EyeOff, Lock, Mail, User,
  MapPin, Hash, Layers, Home, ChevronRight,
  CheckCircle, Shield,
} from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'

type Step = 1 | 2

// ─── Helpers ──────────────────────────────────────────────────
function Field({
  label, value, onChange, type = 'text', placeholder, icon: Icon, required = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  icon: React.ElementType
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          suppressHydrationWarning
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900 placeholder:text-gray-400 text-sm"
        />
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────
export default function RegistroPage() {
  const router = useRouter()

  const [step, setStep]       = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPass, setShow]   = useState(false)
  const [showConf, setShowC]  = useState(false)

  // Paso 1 — Datos personales
  const [nombre,          setNombre]          = useState('')
  const [apellido,        setApellido]        = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Paso 2 — Datos del edificio
  const [edificioNombre,  setEdificioNombre]  = useState('')
  const [direccion,       setDireccion]       = useState('')
  const [comuna,          setComuna]          = useState('')
  const [ciudad,          setCiudad]          = useState('Santiago')
  const [rut,             setRut]             = useState('')
  const [pisos,           setPisos]           = useState('')
  const [totalUnidades,   setTotalUnidades]   = useState('')

  // ── Paso 1: validar y avanzar ──────────────────────────────
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password) {
      setError('Completa todos los campos.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setStep(2)
  }

  // ── Paso 2: crear cuenta y edificio ───────────────────────
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!edificioNombre.trim() || !direccion.trim() || !comuna.trim() || !ciudad.trim()) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    if (!pisos || !totalUnidades) {
      setError('Indica el número de pisos y unidades.')
      return
    }

    setLoading(true)
    try {
      // 1. Crear cuenta en Supabase Auth
      const { error: authError } = await supabaseBrowser.auth.signUp({
        email:    email.trim().toLowerCase(),
        password,
        options:  { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // 2. Crear edificio + usuario admin en la DB
      const res = await fetch('/api/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:         nombre.trim(),
          apellido:       apellido.trim(),
          email:          email.trim().toLowerCase(),
          edificioNombre: edificioNombre.trim(),
          direccion:      direccion.trim(),
          comuna:         comuna.trim(),
          ciudad:         ciudad.trim(),
          rut:            rut.trim(),
          pisos,
          totalUnidades,
        }),
      })

      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Error al crear el edificio. Intenta de nuevo.')
        return
      }

      // 3. Guardar rol y redirigir al dashboard
      localStorage.setItem('propify_rol', 'administrador')
      router.push('/dashboard')
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Barra de progreso ──────────────────────────────────────
  const steps = [
    { n: 1, label: 'Cuenta' },
    { n: 2, label: 'Edificio' },
  ]

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo: branding ── */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2341 0%, #1e3a5f 50%, #2563ae 100%)' }}
      >
        {/* Decorativo */}
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

        {/* Contenido */}
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Registra tu<br />
            <span className="text-blue-300">edificio</span> en<br />
            minutos.
          </h2>
          <p className="text-blue-200 text-lg max-w-md leading-relaxed">
            Crea tu cuenta de administrador, configura tu edificio y comienza a gestionar desde el día uno.
          </p>
          <div className="space-y-3">
            {[
              { icon: '🏢', text: 'Gestión completa de tu edificio' },
              { icon: '👥', text: 'Invita a residentes con un clic' },
              { icon: '💳', text: 'Gastos comunes en tiempo real' },
              { icon: '📦', text: 'Control de paquetes y visitas' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-blue-100">
                <span className="text-lg">{icon}</span>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-blue-300 text-sm">
          <Shield className="w-4 h-4" />
          <span>Cumple con la Ley de Copropiedad 2022 vigente 2026</span>
        </div>
      </div>

      {/* ── Panel derecho: wizard ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white overflow-y-auto">

        {/* Logo móvil */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: '#1e3a5f' }}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: '#1e3a5f' }}>Propify</span>
        </div>

        <div className="w-full max-w-md">

          {/* Encabezado + pasos */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {step === 1 ? 'Crea tu cuenta' : 'Tu edificio'}
            </h2>
            <p className="text-gray-500 mt-2">
              {step === 1
                ? 'Primero configura tu cuenta de administrador.'
                : 'Cuéntanos sobre el edificio que administrarás.'}
            </p>

            {/* Progress steps */}
            <div className="flex items-center gap-2 mt-5">
              {steps.map(({ n, label }, i) => (
                <div key={n} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all"
                      style={
                        step > n
                          ? { background: '#16a34a', color: 'white' }
                          : step === n
                          ? { background: '#1e3a5f', color: 'white' }
                          : { background: '#f1f5f9', color: '#94a3b8' }
                      }
                    >
                      {step > n ? <CheckCircle className="w-4 h-4" /> : n}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: step >= n ? '#1e3a5f' : '#94a3b8' }}
                    >
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-px mx-2" style={{ background: step > n ? '#16a34a' : '#e2e8f0', minWidth: 24 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm mb-5">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── PASO 1 ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre" value={nombre} onChange={setNombre} icon={User} placeholder="Juan" />
                <Field label="Apellido" value={apellido} onChange={setApellido} icon={User} placeholder="Pérez" />
              </div>

              <Field label="Correo electrónico" value={email} onChange={setEmail}
                icon={Mail} type="email" placeholder="admin@miedificio.cl" />

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    suppressHydrationWarning
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShow(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConf ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    suppressHydrationWarning
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                  />
                  <button type="button" onClick={() => setShowC(!showConf)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-white font-semibold transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563ae)' }}
              >
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ── PASO 2 ── */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <Field label="Nombre del edificio *" value={edificioNombre} onChange={setEdificioNombre}
                icon={Building2} placeholder="Edificio Las Torres" />

              <Field label="Dirección *" value={direccion} onChange={setDireccion}
                icon={MapPin} placeholder="Av. Principal 1234" />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Comuna *" value={comuna} onChange={setComuna}
                  icon={MapPin} placeholder="Providencia" />
                <Field label="Ciudad *" value={ciudad} onChange={setCiudad}
                  icon={MapPin} placeholder="Santiago" />
              </div>

              <Field label="RUT del edificio" value={rut} onChange={setRut}
                icon={Hash} placeholder="76.123.456-7" required={false} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    N° de pisos *
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number" min="1" value={pisos}
                      onChange={e => setPisos(e.target.value)}
                      placeholder="10"
                      suppressHydrationWarning
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Total unidades *
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number" min="1" value={totalUnidades}
                      onChange={e => setTotalUnidades(e.target.value)}
                      placeholder="80"
                      suppressHydrationWarning
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ background: '#f1f5f9', color: '#1e3a5f' }}
                >
                  ← Atrás
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #2563ae)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Creando…
                    </span>
                  ) : (
                    'Crear edificio 🏢'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#2563ae' }}>
              Inicia sesión
            </Link>
          </p>
        </div>

        <p className="mt-8 text-xs text-gray-300 text-center">
          © 2026 Propify · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
