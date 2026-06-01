'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Check, Shield, Zap, Crown } from 'lucide-react'
import { formatCLP } from '@/lib/format'

// ─── Datos de planes (espejo del seed SQL) ────────────────────
const PLANES = [
  {
    id:           'plan_free',
    nombre:       'Gratuito',
    precio:       0,
    maxUnidades:  10,
    maxUsuarios:  15,
    popular:      false,
    icon:         Shield,
    color:        '#64748b',
    bg:           '#f8fafc',
    border:       '#e2e8f0',
    features: [
      'Hasta 10 unidades',
      'Hasta 15 usuarios',
      'Gastos comunes básicos',
      'Registro de visitas',
      'Control de paquetes',
      'Soporte por email',
    ],
  },
  {
    id:           'plan_basico',
    nombre:       'Básico',
    precio:       29990,
    maxUnidades:  50,
    maxUsuarios:  100,
    popular:      true,
    icon:         Zap,
    color:        '#2563ae',
    bg:           '#eff6ff',
    border:       '#93c5fd',
    features: [
      'Hasta 50 unidades',
      'Hasta 100 usuarios',
      'Todo del plan Gratuito',
      'Invitación de residentes',
      'Comunicaciones ilimitadas',
      'Reservas de espacios',
      'Exportar CSV',
      'Soporte prioritario',
    ],
  },
  {
    id:           'plan_pro',
    nombre:       'Pro',
    precio:       59990,
    maxUnidades:  999,
    maxUsuarios:  9999,
    popular:      false,
    icon:         Crown,
    color:        '#7c3aed',
    bg:           '#faf5ff',
    border:       '#c4b5fd',
    features: [
      'Unidades ilimitadas',
      'Usuarios ilimitados',
      'Todo del plan Básico',
      'Múltiples edificios',
      'Asistente IA 24/7',
      'API acceso completo',
      'Reportes avanzados',
      'Soporte dedicado',
    ],
  },
]

export default function PreciosPage() {
  const [anual, setAnual] = useState(false)
  const descuento = 0.2 // 20% descuento anual

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav mínimo ── */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #0f2341, #2563ae)' }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">Propify</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="text-sm px-4 py-2 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563ae)' }}
          >
            Comenzar gratis
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="py-16 px-6 text-center">
        <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
          Planes y precios
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Simple y transparente
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Elige el plan que se adapta a tu edificio. Sin sorpresas, sin costos ocultos.
          Puedes cambiar de plan en cualquier momento.
        </p>

        {/* Toggle mensual / anual */}
        <div className="inline-flex items-center gap-3 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setAnual(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !anual ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setAnual(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              anual ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Anual
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
              -20%
            </span>
          </button>
        </div>
      </section>

      {/* ── Cards de planes ── */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {PLANES.map(plan => {
            const Icon = plan.icon
            const precioFinal = anual && plan.precio > 0
              ? Math.round(plan.precio * (1 - descuento))
              : plan.precio

            return (
              <div
                key={plan.id}
                className="relative rounded-2xl border-2 p-6 flex flex-col transition-shadow hover:shadow-lg"
                style={{
                  background:   plan.bg,
                  borderColor:  plan.popular ? plan.color : plan.border,
                  boxShadow:    plan.popular ? `0 0 0 1px ${plan.color}20` : undefined,
                }}
              >
                {/* Badge popular */}
                {plan.popular && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow"
                    style={{ background: plan.color }}
                  >
                    ✨ Más popular
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${plan.color}18` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: plan.color }} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{plan.nombre}</h2>
                </div>

                {/* Precio */}
                <div className="mb-6">
                  {plan.precio === 0 ? (
                    <div className="text-4xl font-bold text-gray-900">Gratis</div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatCLP(precioFinal)}
                      </span>
                      <span className="text-gray-400 mb-1">/mes</span>
                    </div>
                  )}
                  {anual && plan.precio > 0 && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      Ahorra {formatCLP(plan.precio * 12 - precioFinal * 12)} al año
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {plan.maxUnidades >= 999
                      ? 'Unidades ilimitadas'
                      : `Hasta ${plan.maxUnidades} unidades`}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href="/registro"
                  className="block w-full text-center py-3 rounded-xl font-semibold text-sm mb-6 transition-all hover:opacity-90 active:scale-[0.98]"
                  style={
                    plan.popular
                      ? { background: plan.color, color: '#fff' }
                      : { background: '#fff', color: plan.color, border: `1.5px solid ${plan.border}` }
                  }
                >
                  {plan.precio === 0 ? 'Comenzar gratis' : 'Probar 14 días gratis'}
                </Link>

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: plan.color }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FAQ mínimo ── */}
      <section className="pb-20 px-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Preguntas frecuentes
        </h2>
        <div className="space-y-4">
          {[
            {
              q: '¿Puedo cambiar de plan en cualquier momento?',
              a: 'Sí. Puedes actualizar o bajar de plan desde Configuración en cualquier momento. El cambio es inmediato.',
            },
            {
              q: '¿Qué pasa si supero el límite de unidades?',
              a: 'Te mostraremos un aviso antes de que llegues al límite. No te cobraremos extra de forma automática — simplemente deberás actualizar tu plan para seguir agregando.',
            },
            {
              q: '¿Los datos están seguros?',
              a: 'Sí. Propify usa Supabase con Row Level Security, HTTPS en todo momento y backups automáticos diarios.',
            },
            {
              q: '¿Hay soporte en español?',
              a: 'Por supuesto. Nuestro equipo es 100% chileno y atiende en español de lunes a viernes.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="border border-gray-100 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-1.5">{q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        © 2026 Propify · Todos los derechos reservados ·{' '}
        <Link href="/login" className="hover:text-gray-600">Iniciar sesión</Link>
      </footer>
    </div>
  )
}
