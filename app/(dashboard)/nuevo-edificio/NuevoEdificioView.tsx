'use client'

/**
 * Wizard de onboarding — 3 pasos:
 *   1. Datos del edificio
 *   2. Cargar unidades (manual)
 *   3. Listo — acciones post-creación
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, MapPin, Hash, Banknote, Phone, Mail, Clock,
  User, Plus, Trash2, CheckCircle, ArrowRight, ArrowLeft,
  Home, ChevronRight,
} from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'

// ─── Tipos ────────────────────────────────────────────────────
interface EdificioForm {
  nombre:         string
  direccion:      string
  comuna:         string
  ciudad:         string
  totalUnidades:  string
  pisos:          string
  rut:            string
  banco:          string
  cuentaCorriente:string
  emailPago:      string
  nombreAdmin:    string
  telefonoAdmin:  string
  horarioAdmin:   string
}

interface UnidadRow {
  key:      string
  numero:   string
  piso:     string
  tipo:     string
  superficie:string
}

const TIPOS_UNIDAD = ['departamento','casa','local_comercial','oficina','bodega','estacionamiento']
const TIPOS_LABEL: Record<string, string> = {
  departamento:       'Departamento',
  casa:               'Casa',
  local_comercial:    'Local comercial',
  oficina:            'Oficina',
  bodega:             'Bodega',
  estacionamiento:    'Estacionamiento',
}

const FORM_EMPTY: EdificioForm = {
  nombre: '', direccion: '', comuna: '', ciudad: 'Santiago',
  totalUnidades: '', pisos: '', rut: '', banco: '',
  cuentaCorriente: '', emailPago: '', nombreAdmin: '',
  telefonoAdmin: '', horarioAdmin: 'Lunes a Viernes 9:00 a 18:00 hrs',
}

// ─── Componente ───────────────────────────────────────────────
export default function NuevoEdificioView() {
  const router = useRouter()
  const [paso,      setPaso]      = useState<1 | 2 | 3>(1)
  const [form,      setForm]      = useState<EdificioForm>(FORM_EMPTY)
  const [errores,   setErrores]   = useState<Partial<EdificioForm>>({})
  const [unidades,  setUnidades]  = useState<UnidadRow[]>([])
  const [guardando, setGuardando] = useState(false)
  const [edificioId, setEdificioId] = useState<string | null>(null)
  const [toast,     setToast]     = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function upd(k: keyof EdificioForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  // ── Paso 1: validar y avanzar ─────────────────────────────
  function validarPaso1(): boolean {
    const e: Partial<EdificioForm> = {}
    if (!form.nombre.trim())    e.nombre    = 'Obligatorio'
    if (!form.direccion.trim()) e.direccion = 'Obligatorio'
    if (!form.comuna.trim())    e.comuna    = 'Obligatorio'
    if (!form.ciudad.trim())    e.ciudad    = 'Obligatorio'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  // ── Paso 2: unidades ────────────────────────────────────
  function agregarUnidad() {
    setUnidades(prev => [
      ...prev,
      {
        key:        crypto.randomUUID(),
        numero:     String(prev.length + 1),
        piso:       '1',
        tipo:       'departamento',
        superficie: '50',
      },
    ])
  }

  function updUnidad(key: string, campo: keyof UnidadRow, valor: string) {
    setUnidades(prev => prev.map(u => u.key === key ? { ...u, [campo]: valor } : u))
  }

  function eliminarUnidad(key: string) {
    setUnidades(prev => prev.filter(u => u.key !== key))
  }

  // ── Guardar todo ─────────────────────────────────────────
  const handleGuardar = useCallback(async () => {
    setGuardando(true)
    try {
      // 1. Crear edificio
      const res = await fetch('/api/edificios', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:          form.nombre.trim(),
          direccion:       form.direccion.trim(),
          comuna:          form.comuna.trim(),
          ciudad:          form.ciudad.trim(),
          totalUnidades:   Number(form.totalUnidades) || unidades.length,
          pisos:           Number(form.pisos) || 1,
          rut:             form.rut.trim() || null,
          banco:           form.banco.trim() || null,
          cuentaCorriente: form.cuentaCorriente.trim() || null,
          emailPago:       form.emailPago.trim() || null,
          nombreAdmin:     form.nombreAdmin.trim() || null,
          telefonoAdmin:   form.telefonoAdmin.trim() || null,
          horarioAdmin:    form.horarioAdmin.trim() || null,
        }),
      })
      const data = await res.json() as { ok?: boolean; edificio?: { id: string }; error?: string }
      if (!res.ok || !data.ok) {
        showToast(`Error: ${data.error ?? 'No se pudo crear el edificio'}`)
        return
      }

      const newEdificioId = data.edificio!.id
      setEdificioId(newEdificioId)

      // 2. Crear unidades (fire-and-forget batch)
      if (unidades.length > 0) {
        const rows = unidades.map(u => ({
          id:                   crypto.randomUUID(),
          edificioId:           newEdificioId,
          numero:               u.numero.trim(),
          piso:                 Number(u.piso) || 1,
          tipo:                 u.tipo,
          estado:               'disponible',
          superficieM2:         Number(u.superficie) || 50,
          gastosComunesMonto:   0,
        }))
        supabaseBrowser.from('unidades').insert(rows)
          .then(({ error }) => { if (error) console.warn('[nuevo-edificio] insert unidades:', error.message) })
      }

      setPaso(3)
      showToast('¡Edificio creado correctamente!')
    } catch (err) {
      showToast('Error inesperado. Intenta de nuevo.')
      console.error('[nuevo-edificio]', err)
    } finally {
      setGuardando(false)
    }
  }, [form, unidades])

  // ── UI helper ────────────────────────────────────────────
  function Campo({ label, k, placeholder, type = 'text', icon: Icon }: {
    label: string; k: keyof EdificioForm; placeholder?: string; type?: string
    icon: React.ElementType
  }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={type}
            value={form[k]}
            onChange={upd(k)}
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            style={{ borderColor: errores[k] ? '#dc2626' : '#e2e8f0' }}
          />
        </div>
        {errores[k] && <p className="text-xs text-red-500 mt-1">{errores[k]}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl"
          style={{ background: '#1e3a5f' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Edificio</h1>
        <p className="text-gray-500 mt-1 text-sm">Configura un nuevo edificio en tu cuenta Propify</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {(['1','2','3'] as const).map((n, i) => {
          const num = Number(n)
          const activo    = paso === num
          const completado = paso > num
          return (
            <div key={n} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: completado ? '#16a34a' : activo ? '#2563ae' : '#e2e8f0',
                    color:      completado || activo ? '#fff' : '#94a3b8',
                  }}
                >
                  {completado ? '✓' : n}
                </div>
                <span className="text-xs font-semibold hidden sm:block"
                  style={{ color: activo ? '#1e3a5f' : completado ? '#16a34a' : '#94a3b8' }}>
                  {n === '1' ? 'Datos edificio' : n === '2' ? 'Unidades' : 'Listo'}
                </span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          )
        })}
      </div>

      {/* ══════════ PASO 1: Datos del edificio ══════════ */}
      {paso === 1 && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5" style={{ borderColor: '#e2e8f0' }}>
          <h2 className="font-bold text-gray-900">Información del edificio</h2>

          <Campo label="Nombre del edificio *" k="nombre" placeholder="Ej: Edificio Las Condes 123" icon={Building2} />
          <Campo label="Dirección *" k="direccion" placeholder="Av. Las Condes 1234" icon={MapPin} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Comuna *" k="comuna" placeholder="Las Condes" icon={MapPin} />
            <Campo label="Ciudad *" k="ciudad" placeholder="Santiago" icon={MapPin} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="N° de unidades" k="totalUnidades" placeholder="24" type="number" icon={Home} />
            <Campo label="N° de pisos" k="pisos" placeholder="8" type="number" icon={Building2} />
          </div>

          <hr style={{ borderColor: '#f1f5f9' }} />
          <h2 className="font-bold text-gray-900">Datos financieros <span className="text-gray-400 font-normal text-sm">(opcional)</span></h2>

          <Campo label="RUT del edificio" k="rut" placeholder="65.018.713-K" icon={Hash} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Banco" k="banco" placeholder="Banco BCI" icon={Banknote} />
            <Campo label="N° cuenta corriente" k="cuentaCorriente" placeholder="29922518" icon={Hash} />
          </div>

          <Campo label="Email para comprobantes" k="emailPago" placeholder="pagos@edificio.cl" type="email" icon={Mail} />

          <hr style={{ borderColor: '#f1f5f9' }} />
          <h2 className="font-bold text-gray-900">Administración <span className="text-gray-400 font-normal text-sm">(opcional)</span></h2>

          <Campo label="Nombre del administrador" k="nombreAdmin" placeholder="Juan Pérez González" icon={User} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Teléfono" k="telefonoAdmin" placeholder="+56 9 1234 5678" icon={Phone} />
            <Campo label="Horario de atención" k="horarioAdmin" placeholder="Lunes a Viernes 9:00-18:00" icon={Clock} />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => { if (validarPaso1()) setPaso(2) }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
              style={{ background: '#2563ae' }}
            >
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════ PASO 2: Unidades ══════════ */}
      {paso === 2 && (
        <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Cargar unidades</h2>
            <span className="text-xs text-gray-400">{unidades.length} unidades agregadas</span>
          </div>
          <p className="text-sm text-gray-500">Puedes agregar las unidades ahora o hacerlo después desde /unidades.</p>

          {unidades.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {unidades.map(u => (
                <div key={u.key} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl"
                  style={{ background: '#f8fafc' }}>
                  <input value={u.numero} onChange={e => updUnidad(u.key, 'numero', e.target.value)}
                    placeholder="N°" className="col-span-2 px-2 py-1.5 rounded-lg border text-sm text-center outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: '#e2e8f0' }} />
                  <input value={u.piso} onChange={e => updUnidad(u.key, 'piso', e.target.value)}
                    type="number" placeholder="Piso" className="col-span-2 px-2 py-1.5 rounded-lg border text-sm text-center outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: '#e2e8f0' }} />
                  <select value={u.tipo} onChange={e => updUnidad(u.key, 'tipo', e.target.value)}
                    className="col-span-4 px-2 py-1.5 rounded-lg border text-xs bg-white outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: '#e2e8f0' }}>
                    {TIPOS_UNIDAD.map(t => <option key={t} value={t}>{TIPOS_LABEL[t]}</option>)}
                  </select>
                  <div className="col-span-3 flex items-center gap-1">
                    <input value={u.superficie} onChange={e => updUnidad(u.key, 'superficie', e.target.value)}
                      type="number" placeholder="m²" className="w-full px-2 py-1.5 rounded-lg border text-sm text-center outline-none focus:ring-2 focus:ring-blue-100"
                      style={{ borderColor: '#e2e8f0' }} />
                    <span className="text-xs text-gray-400">m²</span>
                  </div>
                  <button onClick={() => eliminarUnidad(u.key)}
                    className="col-span-1 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex justify-center">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={agregarUnidad}
            className="flex items-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold transition-colors hover:bg-blue-50"
            style={{ borderColor: '#93c5fd', color: '#2563ae' }}>
            <Plus className="w-4 h-4" /> Agregar unidad
          </button>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setPaso(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-slate-50"
              style={{ borderColor: '#e2e8f0' }}>
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
              style={{ background: '#2563ae' }}>
              {guardando
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creando…</>
                : <>Crear edificio <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        </div>
      )}

      {/* ══════════ PASO 3: Éxito ══════════ */}
      {paso === 3 && (
        <div className="bg-white rounded-2xl border shadow-sm p-8 text-center space-y-5" style={{ borderColor: '#e2e8f0' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: '#dcfce7' }}>
            <CheckCircle className="w-8 h-8" style={{ color: '#16a34a' }} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">¡Edificio creado!</h2>
            <p className="text-gray-500 text-sm mt-2">
              <strong>{form.nombre}</strong> ya está disponible en tu cuenta.
              {unidades.length > 0 && ` Se cargaron ${unidades.length} unidades.`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {[
              { label: 'Ir al dashboard',       href: '/dashboard',        desc: 'Ver resumen del edificio' },
              { label: 'Gestionar unidades',     href: '/unidades',         desc: 'Editar y configurar unidades' },
              { label: 'Invitar residentes',     href: '/configuracion',    desc: 'Enviar invitaciones por email' },
            ].map(({ label, href, desc }) => (
              <button key={href}
                onClick={() => {
                  // Activar el nuevo edificio
                  if (edificioId) {
                    document.cookie = `propify_edificio_activo=${encodeURIComponent(edificioId)}; path=/; max-age=604800; SameSite=Lax`
                  }
                  router.push(href)
                }}
                className="p-4 rounded-xl border text-left hover:border-blue-300 hover:bg-blue-50 transition-all"
                style={{ borderColor: '#e2e8f0' }}>
                <p className="font-semibold text-sm text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
