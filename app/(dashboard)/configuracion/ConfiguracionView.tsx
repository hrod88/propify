'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Users, Bell, User, Save, Shield,
  Mail, Phone, MapPin, Hash, ChevronRight, LogOut,
  X, UserPlus, Send, CreditCard, Zap, Crown, Check,
  Smartphone, BellOff, BellRing, Banknote, Clock,
} from 'lucide-react'
import {
  isPushEnabled, getPermission,
  requestPushPermission, disablePush,
} from '@/lib/push-notifications'
import Link from 'next/link'
import { formatCLP } from '@/lib/db'
import type { Edificio, Unidad, User as UserType, Suscripcion } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────
type Tab = 'edificio' | 'facturacion' | 'usuarios' | 'notificaciones' | 'cuenta' | 'plan'

// ─── Planes (espejo del seed SQL) ─────────────────────────────
const PLANES_INFO = [
  {
    id: 'plan_free', nombre: 'Gratuito', precio: 0,
    maxUnidades: 10, maxUsuarios: 15, popular: false,
    icon: Shield, color: '#64748b', bg: '#f8fafc', border: '#e2e8f0',
    features: ['Hasta 10 unidades','Hasta 15 usuarios','Gastos comunes básicos','Registro de visitas','Control de paquetes','Soporte por email'],
  },
  {
    id: 'plan_basico', nombre: 'Básico', precio: 29990,
    maxUnidades: 50, maxUsuarios: 100, popular: true,
    icon: Zap, color: '#2563ae', bg: '#eff6ff', border: '#93c5fd',
    features: ['Hasta 50 unidades','Hasta 100 usuarios','Todo del plan Gratuito','Invitación de residentes','Comunicaciones ilimitadas','Reservas de espacios','Exportar CSV','Soporte prioritario'],
  },
  {
    id: 'plan_pro', nombre: 'Pro', precio: 59990,
    maxUnidades: 999, maxUsuarios: 9999, popular: false,
    icon: Crown, color: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd',
    features: ['Unidades ilimitadas','Usuarios ilimitados','Todo del plan Básico','Múltiples edificios','Asistente IA 24/7','API acceso completo','Reportes avanzados','Soporte dedicado'],
  },
]

// ─── Configs ──────────────────────────────────────────────────
const rolCfg = {
  administrador: { label: 'Administrador', bg: '#dbeafe', color: '#2563ae' },
  conserje:      { label: 'Conserje',      bg: '#dcfce7', color: '#16a34a' },
  propietario:   { label: 'Propietario',   bg: '#f3e8ff', color: '#7c3aed' },
  arrendatario:  { label: 'Arrendatario',  bg: '#fef3c7', color: '#d97706' },
  super_admin:   { label: 'Super Admin',   bg: '#fee2e2', color: '#dc2626' },
} as const

// ─── Props ────────────────────────────────────────────────────
interface Props {
  edificio: Edificio
  users: UserType[]
  unidades: Unidad[]
}

// ─── Componente ───────────────────────────────────────────────
export default function ConfiguracionView({ edificio, users, unidades }: Props) {
  const [tab, setTab]   = useState<Tab>('edificio')
  const [saved, setSaved] = useState(false)

  // ─── Plan & suscripción ────────────────────────────────────
  const [suscripcion,     setSuscripcion]     = useState<Suscripcion | null>(null)
  const [planLoading,     setPlanLoading]     = useState(false)
  const [upgradeLoading,  setUpgradeLoading]  = useState<string | null>(null) // planId en proceso
  const [upgradeOk,       setUpgradeOk]       = useState('')

  useEffect(() => {
    if (!edificio?.id) return
    fetch(`/api/suscripcion?edificioId=${edificio.id}`)
      .then(r => r.json())
      .then(({ suscripcion: sub }) => setSuscripcion(sub ?? null))
      .catch(() => null)
  }, [edificio?.id])

  const handleUpgrade = async (planId: string) => {
    if (!edificio?.id) return
    setUpgradeOk('')
    setUpgradeLoading(planId)
    setPlanLoading(true)
    try {
      const res = await fetch('/api/suscripcion/upgrade', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edificioId: edificio.id, planId }),
      })
      const data = await res.json() as { ok?: boolean; planNombre?: string; error?: string }
      if (res.ok && data.ok) {
        setUpgradeOk(data.planNombre ?? planId)
        // Refrescar suscripción
        const r2 = await fetch(`/api/suscripcion?edificioId=${edificio.id}`)
        const { suscripcion: sub } = await r2.json() as { suscripcion: Suscripcion }
        setSuscripcion(sub ?? null)
      }
    } catch { /* silencioso */ }
    finally {
      setUpgradeLoading(null)
      setPlanLoading(false)
    }
  }

  const planActualId = suscripcion?.planId ?? 'plan_free'

  // ─── Invite modal state ────────────────────────────────────
  const [showInvite,    setShowInvite]    = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError,   setInviteError]   = useState('')
  const [inviteOk,      setInviteOk]      = useState(false)
  const [invEmail,      setInvEmail]      = useState('')
  const [invNombre,     setInvNombre]     = useState('')
  const [invApellido,   setInvApellido]   = useState('')
  const [invRol,        setInvRol]        = useState<'propietario' | 'arrendatario' | 'conserje'>('propietario')
  const [invUnidadId,   setInvUnidadId]   = useState('')

  const resetInvite = () => {
    setInviteError(''); setInviteOk(false)
    setInvEmail(''); setInvNombre(''); setInvApellido('')
    setInvRol('propietario'); setInvUnidadId('')
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(''); setInviteOk(false)
    if (!invEmail || !invNombre || !invApellido) {
      setInviteError('Completa todos los campos obligatorios.')
      return
    }
    setInviteLoading(true)
    try {
      const res = await fetch('/api/invitar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:      invEmail.trim().toLowerCase(),
          nombre:     invNombre.trim(),
          apellido:   invApellido.trim(),
          rol:        invRol,
          unidadId:   invUnidadId || null,
          edificioId: edificio?.id ?? '',
        }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setInviteError(data.error ?? 'Error al enviar la invitación.'); return }
      setInviteOk(true)
      resetInvite()
    } catch {
      setInviteError('Error inesperado. Intenta de nuevo.')
    } finally {
      setInviteLoading(false)
    }
  }

  // Notificaciones toggle state
  const [notifs, setNotifs] = useState({
    emailPago:       true,
    emailSolicitud:  true,
    emailCircular:   true,
    emailVisita:     false,
    emailPaquete:    true,
    whatsappMora:    true,
    whatsappVisita:  false,
    whatsappPaquete: true,
  })

  const toggle = (key: keyof typeof notifs) =>
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))

  // ─── Push Notifications (Fase 28) ─────────────────────────
  const [pushEnabled,    setPushEnabled]    = useState(false)
  const [pushPermission, setPushPermission] = useState<ReturnType<typeof getPermission>>('default')
  const [pushLoading,    setPushLoading]    = useState(false)

  useEffect(() => {
    setPushEnabled(isPushEnabled())
    setPushPermission(getPermission())
  }, [])

  const handleTogglePush = async () => {
    if (pushEnabled) {
      disablePush()
      setPushEnabled(false)
      return
    }
    setPushLoading(true)
    const ok = await requestPushPermission()
    setPushEnabled(ok)
    setPushPermission(getPermission())
    setPushLoading(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getUnidadNumero = (unidadId?: string) => {
    if (!unidadId) return null
    return unidades.find(u => u.id === unidadId)?.numero ?? unidadId
  }

  // ─── Facturación state ────────────────────────────────────
  const [fact, setFact] = useState({
    rut:             edificio?.rut             ?? '',
    banco:           edificio?.banco           ?? '',
    cuentaCorriente: edificio?.cuentaCorriente ?? '',
    emailPago:       edificio?.emailPago       ?? '',
    telefonoAdmin:   edificio?.telefonoAdmin   ?? '',
    horarioAdmin:    edificio?.horarioAdmin    ?? '',
  })
  const [factSaving,  setFactSaving]  = useState(false)
  const [factSaved,   setFactSaved]   = useState(false)
  const [factError,   setFactError]   = useState('')

  const handleGuardarFacturacion = async () => {
    if (!edificio?.id) return
    setFactSaving(true); setFactError(''); setFactSaved(false)
    try {
      const res = await fetch(`/api/edificios/${edificio.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(fact),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { setFactError(data.error ?? 'Error al guardar'); return }
      setFactSaved(true)
      setTimeout(() => setFactSaved(false), 3000)
    } catch {
      setFactError('Error de conexión')
    } finally {
      setFactSaving(false)
    }
  }

  const tabs: { value: Tab; label: string; Icon: React.ElementType }[] = [
    { value: 'edificio',       label: 'Edificio',       Icon: Building2   },
    { value: 'facturacion',    label: 'Facturación',    Icon: Banknote    },
    { value: 'usuarios',       label: 'Usuarios',       Icon: Users       },
    { value: 'notificaciones', label: 'Notificaciones', Icon: Bell        },
    { value: 'cuenta',         label: 'Mi cuenta',      Icon: User        },
    { value: 'plan',           label: 'Plan',           Icon: CreditCard  },
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Gestiona tu edificio y preferencias</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              tab === value
                ? { background: '#1e3a5f', color: 'white' }
                : { background: '#f1f5f9', color: '#64748b' }
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ════════════ EDIFICIO ════════════ */}
      {tab === 'edificio' && (
        <div
          className="bg-white rounded-2xl border shadow-sm p-6"
          style={{ borderColor: '#e2e8f0' }}
        >
          {/* Banner */}
          <div
            className="flex items-center gap-4 p-4 rounded-xl mb-6"
            style={{ background: 'linear-gradient(135deg, #0f2341 0%, #2563ae 100%)' }}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">{edificio.nombre}</p>
              <p className="text-sm" style={{ color: '#94b4d4' }}>
                {edificio.direccion} · {edificio.comuna}
              </p>
            </div>
          </div>

          <h2 className="font-bold text-gray-900 mb-4">Datos del edificio</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nombre del edificio', value: edificio.nombre,                    Icon: Building2, type: 'text'   },
              { label: 'RUT del edificio',     value: edificio.rut ?? '',                 Icon: Hash,      type: 'text'   },
              { label: 'Dirección',            value: edificio.direccion,                 Icon: MapPin,    type: 'text'   },
              { label: 'Comuna',               value: edificio.comuna,                    Icon: MapPin,    type: 'text'   },
              { label: 'Ciudad',               value: edificio.ciudad,                    Icon: MapPin,    type: 'text'   },
              { label: 'Año de construcción',  value: String(edificio.anoconstruccion ?? ''), Icon: Building2, type: 'number' },
            ].map(({ label, value, Icon, type }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={type}
                    defaultValue={value}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {[
              { label: 'Total de unidades', value: String(edificio.totalUnidades) },
              { label: 'Número de pisos',   value: String(edificio.pisos) },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
                <input
                  type="number"
                  defaultValue={value}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            {saved && (
              <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                ✓ Cambios guardados
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#2563ae' }}
            >
              <Save className="w-4 h-4" />
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* ════════════ FACTURACIÓN ════════════ */}
      {tab === 'facturacion' && (
        <div className="space-y-5">

          {/* Banner */}
          <div
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'linear-gradient(135deg,#0f2341 0%,#2563ae 100%)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Datos de pago del edificio</p>
              <p className="text-blue-200 text-xs mt-0.5">
                Esta información aparece en el PDF de liquidación y en el portal de pago del residente.
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: '#e2e8f0' }}>
            <h2 className="font-bold text-gray-900 mb-5">Identificación legal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">RUT del edificio</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={fact.rut}
                    onChange={e => setFact(f => ({ ...f, rut: e.target.value }))}
                    placeholder="65.018.713-K"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>
              <div className="sm:col-span-1" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: '#e2e8f0' }}>
            <h2 className="font-bold text-gray-900 mb-5">Cuenta de transferencia</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Banco</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={fact.banco}
                    onChange={e => setFact(f => ({ ...f, banco: e.target.value }))}
                    placeholder="Banco Crédito e Inversiones BCI"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">N° de cuenta corriente</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={fact.cuentaCorriente}
                    onChange={e => setFact(f => ({ ...f, cuentaCorriente: e.target.value }))}
                    placeholder="29922518"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Correo para comprobantes</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={fact.emailPago}
                    onChange={e => setFact(f => ({ ...f, emailPago: e.target.value }))}
                    placeholder="pagogastocomuncarmen297@gmail.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: '#e2e8f0' }}>
            <h2 className="font-bold text-gray-900 mb-5">Datos de contacto</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Teléfono administrador</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={fact.telefonoAdmin}
                    onChange={e => setFact(f => ({ ...f, telefonoAdmin: e.target.value }))}
                    placeholder="+56 9 3914 7492"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Horario de atención</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={fact.horarioAdmin}
                    onChange={e => setFact(f => ({ ...f, horarioAdmin: e.target.value }))}
                    placeholder="Lunes a Viernes 9:30 a 17:30 hrs"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview de cómo aparecerá en el PDF */}
          {(fact.banco || fact.cuentaCorriente || fact.emailPago) && (
            <div className="rounded-2xl border p-5" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Vista previa en PDF / portal de pago
              </p>
              <div className="space-y-2 text-sm">
                {fact.banco && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-28 shrink-0">Banco</span>
                    <span className="font-semibold text-gray-900">{fact.banco}</span>
                  </div>
                )}
                {fact.rut && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-28 shrink-0">RUT</span>
                    <span className="font-semibold text-gray-900">{fact.rut}</span>
                  </div>
                )}
                {fact.cuentaCorriente && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-28 shrink-0">Cta. corriente</span>
                    <span className="font-semibold text-gray-900">{fact.cuentaCorriente}</span>
                  </div>
                )}
                {fact.emailPago && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-28 shrink-0">Email pago</span>
                    <span className="font-semibold text-gray-900">{fact.emailPago}</span>
                  </div>
                )}
                {fact.telefonoAdmin && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-28 shrink-0">Teléfono</span>
                    <span className="font-semibold text-gray-900">{fact.telefonoAdmin}</span>
                  </div>
                )}
                {fact.horarioAdmin && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-28 shrink-0">Horario</span>
                    <span className="font-semibold text-gray-900">{fact.horarioAdmin}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guardar */}
          <div className="flex items-center justify-end gap-3">
            {factError && (
              <span className="text-sm font-medium" style={{ color: '#dc2626' }}>⚠ {factError}</span>
            )}
            {factSaved && (
              <span className="text-sm font-semibold flex items-center gap-1" style={{ color: '#16a34a' }}>
                <Check className="w-4 h-4" /> Datos guardados
              </span>
            )}
            <button
              onClick={handleGuardarFacturacion}
              disabled={factSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: '#2563ae' }}
            >
              {factSaving
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Guardando…</>
                : <><Save className="w-4 h-4" /> Guardar datos</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ════════════ USUARIOS ════════════ */}
      {tab === 'usuarios' && (
        <div
          className="bg-white rounded-2xl border shadow-sm overflow-hidden"
          style={{ borderColor: '#e2e8f0' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: '#f1f5f9' }}
          >
            <h2 className="font-bold text-gray-900">Usuarios del edificio</h2>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: '#dbeafe', color: '#2563ae' }}
            >
              {users.length} usuarios
            </span>
          </div>

          <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
            {users.map(u => {
              const cfg      = rolCfg[u.rol]
              const initials = `${u.nombre[0]}${u.apellido[0]}`
              const unidadNum = getUnidadNumero(u.unidadId)

              return (
                <div
                  key={u.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold text-white shrink-0"
                      style={{ background: '#2563ae' }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {u.nombre} {u.apellido}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {unidadNum && (
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        Unidad {unidadNum}
                      </span>
                    )}
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              )
            })}
          </div>

          <div
            className="px-5 py-3 border-t flex items-center justify-between"
            style={{ borderColor: '#f1f5f9', background: '#fafafa' }}
          >
            <span className="text-xs text-gray-400">{users.length} usuarios registrados</span>
            <button
              onClick={() => { resetInvite(); setShowInvite(true) }}
              className="flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ color: '#2563ae' }}
            >
              <UserPlus className="w-4 h-4" /> Invitar residente
            </button>
          </div>
        </div>
      )}

      {/* ════════════ NOTIFICACIONES ════════════ */}
      {tab === 'notificaciones' && (
        <div className="space-y-4">

          {/* Email */}
          <div
            className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div
              className="px-5 py-4 border-b flex items-center gap-2.5"
              style={{ borderColor: '#f1f5f9' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#dbeafe' }}
              >
                <Mail className="w-4 h-4" style={{ color: '#2563ae' }} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Notificaciones por email</h2>
                <p className="text-xs text-gray-400">Recibe alertas en tu correo electrónico</p>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
              {([
                { key: 'emailPago',      label: 'Pago recibido',       desc: 'Cuando un residente registra un pago' },
                { key: 'emailSolicitud', label: 'Nueva solicitud',      desc: 'Cuando se crea una solicitud de mantención' },
                { key: 'emailCircular',  label: 'Circular publicada',   desc: 'Confirmación de circulares enviadas' },
                { key: 'emailVisita',    label: 'Registro de visita',   desc: 'Cuando se registra una visita en conserjería' },
                { key: 'emailPaquete',   label: 'Paquete recibido',     desc: 'Cuando llega un paquete para un residente' },
              ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(key)}
                    className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-200"
                    style={{ background: notifs[key] ? '#2563ae' : '#e2e8f0' }}
                    aria-label={`${notifs[key] ? 'Desactivar' : 'Activar'} ${label}`}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                      style={{ left: notifs[key] ? '24px' : '4px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp */}
          <div
            className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div
              className="px-5 py-4 border-b flex items-center gap-2.5"
              style={{ borderColor: '#f1f5f9' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#dcfce7' }}
              >
                <Phone className="w-4 h-4" style={{ color: '#16a34a' }} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Notificaciones por WhatsApp</h2>
                <p className="text-xs text-gray-400">Alertas urgentes al celular</p>
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
              {([
                { key: 'whatsappMora',    label: 'Alerta de morosidad',  desc: 'Cuando un residente supera los días de mora configurados' },
                { key: 'whatsappVisita',  label: 'Visita no autorizada', desc: 'Cuando se registra una visita fuera del horario permitido' },
                { key: 'whatsappPaquete', label: 'Paquete sin retirar',  desc: 'Recordatorio automático luego de 3 días sin retiro' },
              ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(key)}
                    className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-200"
                    style={{ background: notifs[key] ? '#16a34a' : '#e2e8f0' }}
                    aria-label={`${notifs[key] ? 'Desactivar' : 'Activar'} ${label}`}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                      style={{ left: notifs[key] ? '24px' : '4px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── Push Notifications (Fase 28) ── */}
          <div
            className="bg-white rounded-2xl border shadow-sm overflow-hidden"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div
              className="px-5 py-4 border-b flex items-center gap-2.5"
              style={{ borderColor: '#f1f5f9' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#fef3c7' }}
              >
                <Smartphone className="w-4 h-4" style={{ color: '#d97706' }} />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 text-sm">Notificaciones Push</h2>
                <p className="text-xs text-gray-400">Alertas nativas del navegador / app instalada</p>
              </div>
              {pushPermission === 'denied' && (
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  Bloqueadas
                </span>
              )}
            </div>

            <div className="px-5 py-5 space-y-4">
              {/* Status banner */}
              {pushPermission === 'denied' ? (
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <BellOff className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Notificaciones bloqueadas</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Para habilitarlas, ve a la configuración de tu navegador y permite notificaciones para este sitio.
                    </p>
                  </div>
                </div>
              ) : pushEnabled ? (
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <BellRing className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#16a34a' }} />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Push activado</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      Recibirás alertas aunque la app esté en segundo plano.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Bell className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Push desactivado</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Activa para recibir alertas de paquetes, visitas, mantenciones y más.
                    </p>
                  </div>
                </div>
              )}

              {/* Toggle row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Alertas en tiempo real</p>
                  <p className="text-xs text-gray-400 mt-0.5">Paquetes, mantenciones, circulares, mora</p>
                </div>
                {pushPermission === 'denied' ? (
                  <span className="text-xs text-gray-400">Bloqueadas por el navegador</span>
                ) : (
                  <button
                    onClick={handleTogglePush}
                    disabled={pushLoading}
                    className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-200 disabled:opacity-50"
                    style={{ background: pushEnabled ? '#d97706' : '#e2e8f0' }}
                    aria-label={pushEnabled ? 'Desactivar push' : 'Activar push'}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                      style={{ left: pushEnabled ? '24px' : '4px' }}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Las notificaciones se envían únicamente en horario de 8:00 a 22:00 hrs
          </p>
        </div>
      )}

      {/* ════════════ CUENTA ════════════ */}
      {tab === 'cuenta' && (
        <div className="space-y-4">

          {/* Perfil */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-6"
            style={{ borderColor: '#e2e8f0' }}
          >
            {/* Avatar + info */}
            <div
              className="flex items-center gap-4 p-4 rounded-xl mb-6"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl text-white text-xl font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563ae)' }}
              >
                RA
              </div>
              <div>
                <p className="font-bold text-gray-900">Rodrigo Administrador</p>
                <p className="text-sm text-gray-400">admin@propify.cl</p>
                <span
                  className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mt-1.5"
                  style={{ background: '#dbeafe', color: '#2563ae' }}
                >
                  Administrador
                </span>
              </div>
            </div>

            <h2 className="font-bold text-gray-900 mb-4">Editar perfil</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Nombre',             value: 'Rodrigo',            type: 'text',  Icon: User },
                { label: 'Apellido',           value: 'Administrador',      type: 'text',  Icon: User },
                { label: 'Correo electrónico', value: 'admin@propify.cl',   type: 'email', Icon: Mail },
                { label: 'Teléfono',           value: '+56 9 8765 4321',    type: 'tel',   Icon: Phone },
              ].map(({ label, value, type, Icon }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={type}
                      defaultValue={value}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      style={{ borderColor: '#e2e8f0' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              {saved && (
                <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>
                  ✓ Cambios guardados
                </span>
              )}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: '#2563ae' }}
              >
                <Save className="w-4 h-4" />
                Guardar cambios
              </button>
            </div>
          </div>

          {/* Seguridad */}
          <div
            className="bg-white rounded-2xl border shadow-sm p-6"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-4 h-4" style={{ color: '#2563ae' }} />
              <h2 className="font-bold text-gray-900">Seguridad</h2>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Cambiar contraseña',                        danger: false },
                { label: 'Activar autenticación de dos factores',     danger: false },
              ].map(({ label }) => (
                <button
                  key={label}
                  className="w-full py-3 px-4 rounded-xl border text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <span>{label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}

              <button
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-colors text-left flex items-center gap-2"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión en todos los dispositivos
              </button>
            </div>
          </div>

          {/* Info versión */}
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <p className="text-xs text-gray-400">
              Propify v1.0.0 · Ley de Copropiedad 2022 · © 2026 Propify
            </p>
          </div>
        </div>
      )}

      {/* ════════════ PLAN ════════════ */}
      {tab === 'plan' && (
        <div className="space-y-5">

          {/* Banner plan actual */}
          {(() => {
            const actual = PLANES_INFO.find(p => p.id === planActualId) ?? PLANES_INFO[0]
            const Icon   = actual.icon
            const usadas = unidades.length
            const pct    = Math.min(100, Math.round((usadas / actual.maxUnidades) * 100))
            return (
              <div
                className="rounded-2xl border-2 p-5"
                style={{ background: actual.bg, borderColor: actual.border }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${actual.color}18` }}>
                      <Icon className="w-5 h-5" style={{ color: actual.color }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Plan actual</p>
                      <p className="font-bold text-gray-900 text-lg">{actual.nombre}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {actual.precio === 0
                      ? <p className="font-bold text-gray-900">Gratis</p>
                      : <p className="font-bold text-gray-900">{formatCLP(actual.precio)}<span className="text-xs font-normal text-gray-400">/mes</span></p>
                    }
                  </div>
                </div>

                {/* Uso unidades */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Unidades usadas</span>
                    <span className="font-bold" style={{ color: pct >= 90 ? '#dc2626' : actual.color }}>
                      {usadas} / {actual.maxUnidades >= 999 ? '∞' : actual.maxUnidades}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${actual.maxUnidades >= 999 ? 30 : pct}%`,
                        background: pct >= 90 ? '#dc2626' : actual.color,
                      }}
                    />
                  </div>
                  {pct >= 80 && actual.maxUnidades < 999 && (
                    <p className="text-xs font-semibold" style={{ color: pct >= 90 ? '#dc2626' : '#d97706' }}>
                      {pct >= 90 ? '⚠️ Casi al límite. Actualiza tu plan para seguir creciendo.' : '⚡ Cerca del límite — considera actualizar.'}
                    </p>
                  )}
                </div>

                {/* Éxito upgrade */}
                {upgradeOk && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: '#dcfce7', color: '#16a34a' }}>
                    <Check className="w-4 h-4" />
                    Plan <strong>{upgradeOk}</strong> activado correctamente.
                  </div>
                )}
              </div>
            )
          })()}

          {/* Cards de planes */}
          <div className="grid md:grid-cols-3 gap-4">
            {PLANES_INFO.map(plan => {
              const Icon      = plan.icon
              const esActual  = plan.id === planActualId
              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl border-2 p-5 flex flex-col transition-shadow hover:shadow-md"
                  style={{
                    background:  plan.bg,
                    borderColor: esActual ? plan.color : plan.border,
                  }}
                >
                  {plan.popular && !esActual && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ background: plan.color }}
                    >
                      ✨ Popular
                    </div>
                  )}
                  {esActual && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ background: plan.color }}
                    >
                      ✓ Plan actual
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${plan.color}18` }}>
                      <Icon className="w-4 h-4" style={{ color: plan.color }} />
                    </div>
                    <span className="font-bold text-gray-900">{plan.nombre}</span>
                  </div>

                  <div className="mb-4">
                    {plan.precio === 0
                      ? <p className="text-2xl font-bold text-gray-900">Gratis</p>
                      : <p className="text-2xl font-bold text-gray-900">{formatCLP(plan.precio)}<span className="text-xs font-normal text-gray-400">/mes</span></p>
                    }
                  </div>

                  <ul className="space-y-1.5 flex-1 mb-4">
                    {plan.features.slice(0, 4).map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: plan.color }} />
                        {f}
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs" style={{ color: plan.color }}>
                        +{plan.features.length - 4} más…
                      </li>
                    )}
                  </ul>

                  {esActual ? (
                    <div
                      className="w-full py-2 rounded-xl text-xs font-bold text-center"
                      style={{ background: `${plan.color}18`, color: plan.color }}
                    >
                      Plan activo
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={!!upgradeLoading || planLoading}
                      className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                      style={{ background: plan.color }}
                    >
                      {upgradeLoading === plan.id ? (
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : null}
                      {upgradeLoading === plan.id ? 'Activando…' : plan.precio === 0 ? 'Cambiar a Gratuito' : `Activar ${plan.nombre}`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Nota */}
          <div className="rounded-xl p-4 text-center text-xs text-gray-400" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            🔒 Los cambios de plan son inmediatos. Próximamente se habilitará el pago en línea.{' '}
            <Link href="/precios" className="text-blue-500 hover:underline">Ver comparativa completa →</Link>
          </div>
        </div>
      )}

      {/* ════════════ MODAL: INVITAR RESIDENTE ════════════ */}
      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,35,65,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowInvite(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#dbeafe' }}>
                  <UserPlus className="w-4 h-4" style={{ color: '#2563ae' }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Invitar residente</h3>
                  <p className="text-xs text-gray-400">Recibirá un email para crear su cuenta</p>
                </div>
              </div>
              <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleInvite} className="p-6 space-y-4">

              {/* Éxito */}
              {inviteOk && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  ✅ Invitación enviada correctamente al correo indicado.
                </div>
              )}

              {/* Error */}
              {inviteError && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  ⚠️ {inviteError}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email" value={invEmail} onChange={e => setInvEmail(e.target.value)}
                    placeholder="residente@email.cl"
                    suppressHydrationWarning
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              {/* Nombre + Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nombre *</label>
                  <input
                    type="text" value={invNombre} onChange={e => setInvNombre(e.target.value)}
                    placeholder="Juan"
                    suppressHydrationWarning
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Apellido *</label>
                  <input
                    type="text" value={invApellido} onChange={e => setInvApellido(e.target.value)}
                    placeholder="Pérez"
                    suppressHydrationWarning
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    style={{ borderColor: '#e2e8f0' }}
                  />
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Rol *</label>
                <select
                  value={invRol}
                  onChange={e => setInvRol(e.target.value as typeof invRol)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <option value="propietario">Propietario</option>
                  <option value="arrendatario">Arrendatario</option>
                  <option value="conserje">Conserje</option>
                </select>
              </div>

              {/* Unidad (solo para propietario/arrendatario) */}
              {invRol !== 'conserje' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Unidad asignada</label>
                  <select
                    value={invUnidadId}
                    onChange={e => setInvUnidadId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <option value="">Sin asignar</option>
                    {unidades
                      .filter(u => u.estado === 'disponible' || !u.arrendatarioId)
                      .map(u => (
                        <option key={u.id} value={u.id}>Unidad {u.numero} — Piso {u.piso}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#2563ae' }}
                >
                  {inviteLoading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {inviteLoading ? 'Enviando…' : 'Enviar invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
