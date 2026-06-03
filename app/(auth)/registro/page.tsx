'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Eye, EyeOff, Lock, Mail, User,
  MapPin, Hash, Layers, Home, ChevronRight,
  CheckCircle, Shield, CreditCard, Phone, Clock,
  ArrowRight, Users, DollarSign, Bell,
} from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'

type Step = 1 | 2 | 3 | 4   // 4 = pantalla de éxito

// ─── Campo genérico ───────────────────────────────────────────
function Field({
  label, value, onChange, type = 'text', placeholder, icon: Icon, required = true, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  icon: React.ElementType
  required?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
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
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Barra de progreso ────────────────────────────────────────
const STEPS_CFG = [
  { n: 1 as Step, label: 'Cuenta'   },
  { n: 2 as Step, label: 'Edificio' },
  { n: 3 as Step, label: 'Pago'     },
  { n: 4 as Step, label: 'Listo'    },
]

function StepsBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS_CFG.map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-1 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-all"
              style={
                step > n
                  ? { background: '#16a34a', color: 'white' }
                  : step === n
                  ? { background: '#1e3a5f', color: 'white' }
                  : { background: '#f1f5f9', color: '#94a3b8' }
              }
            >
              {step > n ? <CheckCircle className="w-3.5 h-3.5" /> : n}
            </div>
            <span
              className="text-xs font-medium hidden sm:block truncate"
              style={{ color: step >= n ? '#1e3a5f' : '#94a3b8' }}
            >
              {label}
            </span>
          </div>
          {i < STEPS_CFG.length - 1 && (
            <div
              className="flex-1 h-px mx-1"
              style={{ background: step > n ? '#16a34a' : '#e2e8f0', minWidth: 12 }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tarjeta "próximo paso" ───────────────────────────────────
function NextCard({
  icon: Icon, color, title, desc, href,
}: {
  icon: React.ElementType; color: string; title: string; desc: string; href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-3.5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ borderColor: '#e2e8f0' }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{ background: color + '1a' }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5 ml-auto" />
    </Link>
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

  // ── Paso 1 — Cuenta ──────────────────────────────────────
  const [nombre,          setNombre]          = useState('')
  const [apellido,        setApellido]        = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // ── Paso 2 — Edificio ────────────────────────────────────
  const [edificioNombre,  setEdificioNombre]  = useState('')
  const [direccion,       setDireccion]       = useState('')
  const [comuna,          setComuna]          = useState('')
  const [ciudad,          setCiudad]          = useState('Santiago')
  const [rut,             setRut]             = useState('')
  const [pisos,           setPisos]           = useState('')
  const [totalUnidades,   setTotalUnidades]   = useState('')

  // ── Paso 3 — Datos financieros ────────────────────────────
  const [banco,           setBanco]           = useState('')
  const [cuentaCorriente, setCuentaCorriente] = useState('')
  const [emailPago,       setEmailPago]       = useState('')
  const [telefonoAdmin,   setTelefonoAdmin]   = useState('')
  const [horarioAdmin,    setHorarioAdmin]    = useState('Lunes a Viernes 9:00-18:00')

  // ── Paso 1 → 2 ────────────────────────────────────────────
  const handleStep1 = (e: React.SyntheticEvent<HTMLFormElement>) => {
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

  // ── Paso 2 → 3 ────────────────────────────────────────────
  const handleStep2 = (e: React.SyntheticEvent<HTMLFormElement>) => {
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
    setStep(3)
  }

  // ── Paso 3 → crear cuenta y mostrar éxito ─────────────────
  const handleStep3 = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Crear cuenta en Supabase Auth
      const { error: authError } = await supabaseBrowser.auth.signUp({
        email:   email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (authError) { setError(authError.message); return }

      // 2. Crear edificio + usuario admin (con datos financieros)
      const res = await fetch('/api/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:          nombre.trim(),
          apellido:        apellido.trim(),
          email:           email.trim().toLowerCase(),
          edificioNombre:  edificioNombre.trim(),
          direccion:       direccion.trim(),
          comuna:          comuna.trim(),
          ciudad:          ciudad.trim(),
          rut:             rut.trim(),
          pisos,
          totalUnidades,
          banco:           banco.trim(),
          cuentaCorriente: cuentaCorriente.trim(),
          emailPago:       emailPago.trim(),
          nombreAdmin:     `${nombre.trim()} ${apellido.trim()}`,
          telefonoAdmin:   telefonoAdmin.trim(),
          horarioAdmin:    horarioAdmin.trim(),
        }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? 'Error al crear el edificio.'); return }

      localStorage.setItem('propify_rol', 'administrador')
      setStep(4)
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo: branding ────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f2341 0%, #1e3a5f 50%, #2563ae 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full bg-blue-300 blur-3xl" />
        </div>
        <Link href="/" className="relative flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Propify</h1>
            <p className="text-blue-200 text-sm">Administración de Edificios</p>
          </div>
        </Link>
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
              { icon: '📄', text: 'Liquidaciones PDF con un clic' },
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

      {/* ── Panel derecho: wizard ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white overflow-y-auto">

        {/* Logo móvil — vuelve a la landing */}
        <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 hover:opacity-70 transition-opacity">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: '#1e3a5f' }}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: '#1e3a5f' }}>Propify</span>
        </Link>

        <div className="w-full max-w-md">

          {step !== 4 && (
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4">
              ← Volver al inicio
            </Link>
          )}

          {/* ── Paso 4: Pantalla de éxito ─────────────────────── */}
          {step === 4 && (
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-5" style={{ background: '#dcfce7' }}>
                <CheckCircle className="w-10 h-10" style={{ color: '#16a34a' }} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Todo listo!</h2>
              <p className="text-gray-500 mb-8">
                Tu edificio <strong>{edificioNombre}</strong> ha sido creado.<br />
                Estos son los pasos recomendados a continuación:
              </p>
              <div className="space-y-3 text-left mb-8">
                <NextCard icon={Home}        color="#2563ae" title="Agregar unidades"         desc={`Carga las ${totalUnidades || 'N'} unidades del edificio`} href="/unidades" />
                <NextCard icon={Users}       color="#7c3aed" title="Cargar residentes"        desc="Invita a propietarios y arrendatarios"                     href="/residentes" />
                <NextCard icon={DollarSign}  color="#16a34a" title="Generar gastos comunes"   desc="Crea los cobros mensuales del edificio"                    href="/gastos" />
                <NextCard icon={Bell}        color="#d97706" title="Configurar notificaciones" desc="Email y push para residentes"                              href="/configuracion" />
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563ae)' }}
              >
                Ir al dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step !== 4 && (
            <>
              {/* Encabezado */}
              <div className="mb-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  {step === 1 ? 'Crea tu cuenta' : step === 2 ? 'Tu edificio' : 'Datos de pago'}
                </h2>
                <p className="text-gray-500 mt-1.5 text-sm">
                  {step === 1
                    ? 'Configura tu cuenta de administrador.'
                    : step === 2
                    ? 'Cuéntanos sobre el edificio que administrarás.'
                    : 'Aparecerán en las liquidaciones PDF — puedes completarlos después.'}
                </p>
              </div>

              {/* Barra de progreso */}
              <StepsBar step={step} />

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm mb-5">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              {/* ── PASO 1 ──────────────────────────────────── */}
              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombre"   value={nombre}   onChange={setNombre}   icon={User} placeholder="Juan" />
                    <Field label="Apellido" value={apellido} onChange={setApellido} icon={User} placeholder="Pérez" />
                  </div>
                  <Field label="Correo electrónico" value={email} onChange={setEmail}
                    icon={Mail} type="email" placeholder="admin@miedificio.cl" />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres" suppressHydrationWarning
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm" />
                      <button type="button" onClick={() => setShow(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showConf ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña" suppressHydrationWarning
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm" />
                      <button type="button" onClick={() => setShowC(!showConf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit"
                    className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563ae)' }}>
                    Continuar <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* ── PASO 2 ──────────────────────────────────── */}
              {step === 2 && (
                <form onSubmit={handleStep2} className="space-y-4">
                  <Field label="Nombre del edificio" value={edificioNombre} onChange={setEdificioNombre}
                    icon={Building2} placeholder="Edificio Las Torres" />
                  <Field label="Dirección" value={direccion} onChange={setDireccion}
                    icon={MapPin} placeholder="Av. Principal 1234" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Comuna" value={comuna} onChange={setComuna} icon={MapPin} placeholder="Providencia" />
                    <Field label="Ciudad" value={ciudad} onChange={setCiudad} icon={MapPin} placeholder="Santiago" />
                  </div>
                  <Field label="RUT del edificio" value={rut} onChange={setRut}
                    icon={Hash} placeholder="76.123.456-7" required={false} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">N° de pisos <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" min="1" value={pisos} onChange={e => setPisos(e.target.value)}
                          placeholder="10" suppressHydrationWarning
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Total unidades <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" min="1" value={totalUnidades} onChange={e => setTotalUnidades(e.target.value)}
                          placeholder="80" suppressHydrationWarning
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setStep(1); setError('') }}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                      style={{ background: '#f1f5f9', color: '#1e3a5f' }}>
                      ← Atrás
                    </button>
                    <button type="submit"
                      className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563ae)' }}>
                      Continuar →
                    </button>
                  </div>
                </form>
              )}

              {/* ── PASO 3 ──────────────────────────────────── */}
              {step === 3 && (
                <form onSubmit={handleStep3} className="space-y-4">
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: '#eff6ff', color: '#1e40af' }}>
                    <CreditCard className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Aparecen en las liquidaciones PDF que reciben los residentes. Puedes completarlos ahora o después en <strong>Configuración</strong>.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Banco" value={banco} onChange={setBanco}
                      icon={CreditCard} placeholder="Banco BCI" required={false} />
                    <Field label="N° cuenta corriente" value={cuentaCorriente} onChange={setCuentaCorriente}
                      icon={Hash} placeholder="1234567890" required={false} />
                  </div>
                  <Field label="Email para comprobantes" value={emailPago} onChange={setEmailPago}
                    icon={Mail} type="email" placeholder="pagos@miedificio.cl" required={false}
                    hint="Los residentes enviarán aquí sus comprobantes de transferencia" />
                  <Field label="Teléfono del administrador" value={telefonoAdmin} onChange={setTelefonoAdmin}
                    icon={Phone} placeholder="+56 9 1234 5678" required={false} />
                  <Field label="Horario de atención" value={horarioAdmin} onChange={setHorarioAdmin}
                    icon={Clock} placeholder="Lunes a Viernes 9:00-18:00" required={false} />
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => { setStep(2); setError('') }}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                      style={{ background: '#f1f5f9', color: '#1e3a5f' }}>
                      ← Atrás
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                      style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1e3a5f, #2563ae)' }}>
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                          Creando…
                        </span>
                      ) : 'Crear edificio 🏢'}
                    </button>
                  </div>
                  <p className="text-center text-xs text-gray-400">Puedes omitir los datos bancarios y configurarlos después</p>
                </form>
              )}

              {/* Footer */}
              <p className="mt-6 text-center text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#2563ae' }}>
                  Inicia sesión
                </Link>
              </p>
            </>
          )}

        </div>

        <p className="mt-8 text-xs text-gray-300 text-center">
          © 2026 Propify · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
