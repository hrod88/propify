'use client'

import { useState } from 'react'
import {
  Building2, Users, Bell, User, Save, Shield,
  Mail, Phone, MapPin, Hash, ChevronRight, LogOut,
  X, UserPlus, Send,
} from 'lucide-react'
import type { Edificio, Unidad, User as UserType } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────
type Tab = 'edificio' | 'usuarios' | 'notificaciones' | 'cuenta'

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

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const getUnidadNumero = (unidadId?: string) => {
    if (!unidadId) return null
    return unidades.find(u => u.id === unidadId)?.numero ?? unidadId
  }

  const tabs: { value: Tab; label: string; Icon: React.ElementType }[] = [
    { value: 'edificio',       label: 'Edificio',       Icon: Building2 },
    { value: 'usuarios',       label: 'Usuarios',       Icon: Users },
    { value: 'notificaciones', label: 'Notificaciones', Icon: Bell },
    { value: 'cuenta',         label: 'Mi cuenta',      Icon: User },
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
