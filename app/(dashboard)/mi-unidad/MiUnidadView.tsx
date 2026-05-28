'use client'

import { useState, useEffect } from 'react'
import {
  Home, DoorOpen, Wrench, Package, Calendar, MessageSquare,
  CheckCircle, Clock, XCircle, AlertCircle, MapPin, Layers,
  ArrowRight, Plus, X, Send, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useRol } from '@/context/rol-context'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { formatCLP } from '@/lib/db'
import type {
  GastoComun, Pago, SolicitudMantencion, Paquete, Reserva,
  EspacioComun, Comunicacion, EstadoPago,
  PrioridadSolicitud, EstadoSolicitud, TipoComunicacion, User,
} from '@/types'

// ─── Constantes ────────────────────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const CATEGORIAS = ['Plomería','Electricidad','Ascensor','Climatización','Mantención','Pintura','Carpintería','Otro']

const estadoGastoCfg: Record<EstadoPago, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  pagado:    { color: '#10b981', bg: '#d1fae5', label: 'Pagado',    icon: CheckCircle },
  pendiente: { color: '#f59e0b', bg: '#fef3c7', label: 'Pendiente', icon: Clock },
  vencido:   { color: '#dc2626', bg: '#fee2e2', label: 'Vencido',   icon: XCircle },
  parcial:   { color: '#8b5cf6', bg: '#ede9fe', label: 'Parcial',   icon: AlertCircle },
}

const prioridadCfg: Record<PrioridadSolicitud, { color: string; bg: string; label: string }> = {
  baja:    { color: '#64748b', bg: '#f1f5f9', label: 'Baja' },
  media:   { color: '#f59e0b', bg: '#fef3c7', label: 'Media' },
  alta:    { color: '#ef4444', bg: '#fee2e2', label: 'Alta' },
  urgente: { color: '#dc2626', bg: '#fecaca', label: 'Urgente' },
}

const estadoSolCfg: Record<EstadoSolicitud, { color: string; label: string }> = {
  pendiente:   { color: '#f59e0b', label: 'Pendiente' },
  en_progreso: { color: '#3b82f6', label: 'En progreso' },
  resuelto:    { color: '#10b981', label: 'Resuelto' },
  cancelado:   { color: '#94a3b8', label: 'Cancelado' },
}

const tipoComunCfg: Record<TipoComunicacion, { bg: string; emoji: string }> = {
  circular:    { bg: '#dbeafe', emoji: '📋' },
  urgente:     { bg: '#fee2e2', emoji: '🚨' },
  informativo: { bg: '#d1fae5', emoji: 'ℹ️' },
  'reunión':   { bg: '#ede9fe', emoji: '📅' },
}

// ─── Helpers ───────────────────────────────────────────────────
function formatFecha(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

function getNombreMes(mes: number) {
  return MESES[mes - 1] ?? '—'
}

// ─── Skeleton de carga ─────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-100 ${className ?? ''}`}
    />
  )
}

// ─── Vista principal ───────────────────────────────────────────
export default function MiUnidadView() {
  const { rol, usuario, unidad, cargado } = useRol()

  // ── Datos reales desde Supabase ────────────────────────────
  const [gastos,        setGastos]        = useState<GastoComun[]>([])
  const [pagos,         setPagos]         = useState<Pago[]>([])
  const [solicitudes,   setSolicitudes]   = useState<SolicitudMantencion[]>([])
  const [paquetes,      setPaquetes]      = useState<Paquete[]>([])
  const [reservas,      setReservas]      = useState<Reserva[]>([])
  const [espacios,      setEspacios]      = useState<EspacioComun[]>([])
  const [comunicaciones,setComunicaciones]= useState<Comunicacion[]>([])
  const [arrendatario,  setArrendatario]  = useState<User | null>(null)
  const [cargandoDatos, setCargandoDatos] = useState(true)

  // ── Modal: Nueva Solicitud ─────────────────────────────────
  const [showSolicitud, setShowSolicitud] = useState(false)
  const [solLoading,    setSolLoading]    = useState(false)
  const [solError,      setSolError]      = useState('')
  const [solOk,         setSolOk]         = useState(false)
  const [solTitulo,     setSolTitulo]     = useState('')
  const [solDesc,       setSolDesc]       = useState('')
  const [solCategoria,  setSolCategoria]  = useState('Mantención')
  const [solPrioridad,  setSolPrioridad]  = useState<PrioridadSolicitud>('media')

  // ── Fetch de datos reales ──────────────────────────────────
  useEffect(() => {
    if (!cargado || !usuario || !unidad) return

    const edificioId = unidad.edificioId ?? usuario.edificioId ?? 'e1'

    async function cargarDatos() {
      setCargandoDatos(true)
      try {
        const [
          gastosRes, pagosRes, solicitudesRes,
          paquetesRes, reservasRes, espaciosRes, comunicacionesRes,
        ] = await Promise.all([
          supabaseBrowser.from('gastos_comunes')
            .select('*')
            .eq('unidadId', unidad!.id)
            .order('mes', { ascending: false }),

          supabaseBrowser.from('pagos')
            .select('*')
            .eq('unidadId', unidad!.id)
            .order('creadoEn', { ascending: false }),

          supabaseBrowser.from('solicitudes')
            .select('*')
            .eq('unidadId', unidad!.id)
            .order('creadoEn', { ascending: false }),

          supabaseBrowser.from('paquetes')
            .select('*')
            .eq('unidadId', unidad!.id)
            .neq('estado', 'retirado'),

          supabaseBrowser.from('reservas')
            .select('*')
            .eq('unidadId', unidad!.id)
            .order('fechaInicio', { ascending: true }),

          supabaseBrowser.from('espacios_comunes')
            .select('*')
            .eq('edificioId', edificioId)
            .order('nombre'),

          supabaseBrowser.from('comunicaciones')
            .select('*')
            .eq('edificioId', edificioId)
            .order('creadoEn', { ascending: false })
            .limit(5),
        ])

        if (gastosRes.data)         setGastos(gastosRes.data as GastoComun[])
        if (pagosRes.data)          setPagos(pagosRes.data as Pago[])
        if (solicitudesRes.data)    setSolicitudes(solicitudesRes.data as SolicitudMantencion[])
        if (paquetesRes.data)       setPaquetes(paquetesRes.data as Paquete[])
        if (reservasRes.data)       setReservas(reservasRes.data as Reserva[])
        if (espaciosRes.data)       setEspacios(espaciosRes.data as EspacioComun[])
        if (comunicacionesRes.data) setComunicaciones(comunicacionesRes.data as Comunicacion[])

        // Cargar arrendatario si corresponde
        if (rol === 'propietario' && unidad!.arrendatarioId) {
          const { data: arr } = await supabaseBrowser
            .from('usuarios')
            .select('*')
            .eq('id', unidad!.arrendatarioId)
            .single()
          if (arr) setArrendatario(arr as User)
        }
      } catch (err) {
        console.error('MiUnidadView: error cargando datos', err)
      } finally {
        setCargandoDatos(false)
      }
    }

    cargarDatos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargado, usuario?.id, unidad?.id])

  // ── Crear nueva solicitud de mantención ────────────────────
  async function handleNuevaSolicitud(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario || !unidad) return
    setSolError('')
    if (!solTitulo.trim() || !solDesc.trim()) {
      setSolError('Completa el título y la descripción.')
      return
    }
    setSolLoading(true)
    try {
      const now = new Date().toISOString()
      const { error } = await supabaseBrowser.from('solicitudes').insert({
        id:           crypto.randomUUID(),
        unidadId:     unidad.id,
        edificioId:   unidad.edificioId ?? usuario.edificioId,
        titulo:       solTitulo.trim(),
        descripcion:  solDesc.trim(),
        categoria:    solCategoria,
        prioridad:    solPrioridad,
        estado:       'pendiente',
        solicitanteId: usuario.id,
        creadoEn:     now,
        actualizadoEn: now,
      })
      if (error) { setSolError(error.message); return }

      setSolOk(true)
      // Refrescar lista
      const { data } = await supabaseBrowser
        .from('solicitudes')
        .select('*')
        .eq('unidadId', unidad.id)
        .order('creadoEn', { ascending: false })
      if (data) setSolicitudes(data as SolicitudMantencion[])

      // Cerrar modal y resetear
      setTimeout(() => {
        setShowSolicitud(false)
        setSolOk(false)
        setSolTitulo('')
        setSolDesc('')
        setSolCategoria('Mantención')
        setSolPrioridad('media')
      }, 1500)
    } catch {
      setSolError('Error inesperado. Intenta de nuevo.')
    } finally {
      setSolLoading(false)
    }
  }

  // ── Loading: esperando que localStorage/auth cargue ───────
  if (!cargado || !usuario || !unidad) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Home className="w-12 h-12 mx-auto mb-3" style={{ color: '#cbd5e1' }} />
          <p className="text-gray-500 font-medium">Cargando tu portal…</p>
          <p className="text-xs text-gray-400 mt-1">Verificando tu sesión</p>
        </div>
      </div>
    )
  }

  const esPropietario = rol === 'propietario'

  // ── Datos filtrados / calculados ──────────────────────────
  const now          = new Date()
  const mesActual    = now.getMonth() + 1
  const añoActual    = now.getFullYear()

  const gastoActual  = gastos.find(g => g.mes === mesActual && g.año === añoActual)
  const misPagos     = [...pagos].sort((a, b) =>
    b.año !== a.año ? b.año - a.año : b.mes - a.mes
  )
  const solActivas   = solicitudes.filter(s => s.estado !== 'resuelto' && s.estado !== 'cancelado')
  const misReservas  = reservas
    .filter(r => r.estado === 'confirmada')
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))
  const proximaReserva  = misReservas[0] ?? null
  const espacioReserva  = proximaReserva
    ? espacios.find(e => e.id === proximaReserva.espacioId)
    : null

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Banner de bienvenida ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: 'linear-gradient(135deg, #0f2341 0%, #1e3a5f 55%, #2563ae 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full opacity-10 bg-white blur-3xl" />
          <div className="absolute -bottom-10 left-16 w-36 h-36 rounded-full opacity-10 bg-blue-300 blur-2xl" />
        </div>

        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-blue-300 text-sm font-medium mb-1">Bienvenido/a 👋</p>
            <h1 className="text-2xl font-bold text-white">
              {usuario.nombre} {usuario.apellido}
            </h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-blue-200 text-sm">
                <DoorOpen className="w-4 h-4" />
                Departamento {unidad.numero}
              </span>
              <span className="flex items-center gap-1.5 text-blue-200 text-sm">
                <Layers className="w-4 h-4" />
                Piso {unidad.piso}
              </span>
              <span className="flex items-center gap-1.5 text-blue-200 text-sm">
                <MapPin className="w-4 h-4" />
                Mi edificio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Nueva Solicitud */}
            <button
              onClick={() => setShowSolicitud(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva solicitud
            </button>

            <span
              className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
            >
              {esPropietario ? '🏠 Propietario/a' : '🔑 Arrendatario/a'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Mini KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Gasto actual (propietario) */}
        {esPropietario && (
          cargandoDatos ? (
            <Skeleton className="h-28" />
          ) : gastoActual ? (() => {
            const cfg = estadoGastoCfg[gastoActual.estadoPago]
            const StatusIcon = cfg.icon
            return (
              <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">
                    Gasto {getNombreMes(mesActual)}
                  </span>
                  <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <p className="text-xl font-bold text-gray-900">{formatCLP(gastoActual.montoTotal)}</p>
                <span
                  className="mt-2 inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>
            )
          })() : (
            <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Gasto del mes</span>
              </div>
              <p className="text-xl font-bold text-gray-900">—</p>
              <p className="text-xs text-gray-400 mt-1">Sin gasto registrado</p>
            </div>
          )
        )}

        {/* Solicitudes */}
        {cargandoDatos ? (
          <Skeleton className="h-28" />
        ) : (
          <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">Solicitudes</span>
              <Wrench className="w-4 h-4" style={{ color: solActivas.length > 0 ? '#f59e0b' : '#94a3b8' }} />
            </div>
            <p className="text-xl font-bold text-gray-900">{solActivas.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {solActivas.length === 0 ? 'Sin solicitudes activas' : `${solActivas.length} activa${solActivas.length > 1 ? 's' : ''}`}
            </p>
          </div>
        )}

        {/* Paquetes */}
        {cargandoDatos ? (
          <Skeleton className="h-28" />
        ) : (
          <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">Paquetes</span>
              <Package className="w-4 h-4" style={{ color: paquetes.length > 0 ? '#db2777' : '#94a3b8' }} />
            </div>
            <p className="text-xl font-bold text-gray-900">{paquetes.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {paquetes.length === 0 ? 'Sin paquetes' : 'Por retirar en conserjería'}
            </p>
          </div>
        )}

        {/* Próxima reserva */}
        {cargandoDatos ? (
          <Skeleton className="h-28" />
        ) : (
          <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">Próxima Reserva</span>
              <Calendar className="w-4 h-4" style={{ color: proximaReserva ? '#0891b2' : '#94a3b8' }} />
            </div>
            {proximaReserva && espacioReserva ? (
              <>
                <p className="text-sm font-bold text-gray-900 truncate">{espacioReserva.nombre}</p>
                <p className="text-xs text-gray-400 mt-1">{formatFecha(proximaReserva.fechaInicio)}</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-gray-900">—</p>
                <p className="text-xs text-gray-400 mt-1">Sin reservas</p>
              </>
            )}
          </div>
        )}

        {/* Comunicados (arrendatario) */}
        {!esPropietario && (
          cargandoDatos ? (
            <Skeleton className="h-28" />
          ) : (
            <div className="bg-white rounded-2xl p-4 border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">Comunicados</span>
                <MessageSquare className="w-4 h-4" style={{ color: '#2563ae' }} />
              </div>
              <p className="text-xl font-bold text-gray-900">{comunicaciones.length}</p>
              <p className="text-xs text-gray-400 mt-1">Del edificio</p>
            </div>
          )
        )}
      </div>

      {/* ── Fila principal ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Mi Unidad */}
        <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Mi Unidad</h2>
            <Link
              href={`/unidades/${unidad.id}`}
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#2563ae' }}
            >
              Ver detalle <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { icon: DoorOpen,    label: 'Departamento', valor: `N° ${unidad.numero}` },
              { icon: Layers,      label: 'Piso',         valor: `Piso ${unidad.piso}` },
              { icon: Home,        label: 'Superficie',   valor: `${unidad.superficieM2} m²` },
              { icon: CheckCircle, label: 'Composición',  valor: `${unidad.habitaciones ?? '—'} hab · ${unidad.banos ?? '—'} baño${(unidad.banos ?? 0) !== 1 ? 's' : ''}` },
            ].map(item => (
              <div
                key={item.label}
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: '#f8fafc' }}
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                  style={{ background: '#dbeafe' }}
                >
                  <item.icon className="w-3.5 h-3.5" style={{ color: '#2563ae' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.valor}</p>
                </div>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: '#f1f5f9' }}
          >
            <div>
              <p className="text-xs text-gray-400">Gasto mensual base</p>
              <p className="text-base font-bold text-gray-900">
                {formatCLP(unidad.gastosComunesMonto)}
              </p>
            </div>
            {arrendatario && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Arrendatario/a</p>
                <p className="text-sm font-semibold text-gray-700">
                  {arrendatario.nombre} {arrendatario.apellido}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Gastos/Pagos (propietario) o Solicitudes (arrendatario) */}
        {esPropietario ? (
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Gastos y Pagos</h2>
              <Link
                href="/gastos"
                className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
                style={{ color: '#2563ae' }}
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {cargandoDatos ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : gastoActual ? (() => {
              const cfg = estadoGastoCfg[gastoActual.estadoPago]
              return (
                <>
                  <div
                    className="p-4 rounded-xl mb-4 border"
                    style={{ background: cfg.bg, borderColor: cfg.color + '40' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: cfg.color }}>
                          Gasto Común {getNombreMes(mesActual)} {añoActual}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCLP(gastoActual.montoTotal)}
                        </p>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                        style={{ background: cfg.color, color: 'white' }}
                      >
                        {gastoActual.estadoPago.toUpperCase()}
                      </span>
                    </div>
                    {gastoActual.fechaVencimiento && (
                      <p className="text-xs mt-3 font-medium" style={{ color: cfg.color }}>
                        Vence: {formatFecha(gastoActual.fechaVencimiento)}
                        {gastoActual.fechaPago && ` · Pagado: ${formatFecha(gastoActual.fechaPago)}`}
                      </p>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Historial de Pagos</h3>
                  {misPagos.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Sin registros de pago</p>
                  ) : (
                    <div className="space-y-0.5">
                      {misPagos.slice(0, 5).map(pago => (
                        <div
                          key={pago.id}
                          className="flex items-center justify-between py-2.5 border-b"
                          style={{ borderColor: '#f1f5f9' }}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {getNombreMes(pago.mes)} {pago.año}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">{pago.metodo}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{formatCLP(pago.monto)}</p>
                            <span className="text-xs font-medium" style={{ color: '#10b981' }}>✓ Pagado</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            })() : (
              <p className="text-sm text-gray-400 text-center py-8">Sin gasto registrado para este mes</p>
            )}
          </div>
        ) : (
          /* Arrendatario: solicitudes detalle */
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Mis Solicitudes</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSolicitud(true)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:opacity-85"
                  style={{ background: '#dbeafe', color: '#2563ae' }}
                >
                  <Plus className="w-3.5 h-3.5" /> Nueva
                </button>
                <Link
                  href="/mantenciones"
                  className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
                  style={{ color: '#2563ae' }}
                >
                  Ver módulo <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {cargandoDatos ? (
              <div className="space-y-3">
                {[1,2].map(i => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Wrench className="w-10 h-10 mb-3" style={{ color: '#e2e8f0' }} />
                <p className="text-sm font-medium text-gray-500">Sin solicitudes registradas</p>
                <button
                  onClick={() => setShowSolicitud(true)}
                  className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-85"
                  style={{ background: '#dbeafe', color: '#2563ae' }}
                >
                  + Crear primera solicitud
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {solicitudes.slice(0, 4).map(s => {
                  const pCfg = prioridadCfg[s.prioridad]
                  const sCfg = estadoSolCfg[s.estado]
                  return (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-xl border"
                      style={{ borderColor: '#f1f5f9', background: '#f8fafc' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-gray-900 flex-1">{s.titulo}</p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                          style={{ background: pCfg.bg, color: pCfg.color }}
                        >
                          {pCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{s.descripcion}</p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sCfg.color }} />
                        <span className="text-xs font-medium" style={{ color: sCfg.color }}>{sCfg.label}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{s.categoria}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fila inferior ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Mis Solicitudes (propietario) */}
        {esPropietario && (
          <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Mis Solicitudes</h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowSolicitud(true)}
                  className="flex items-center justify-center w-6 h-6 rounded-lg transition-all hover:opacity-80"
                  style={{ background: '#dbeafe', color: '#2563ae' }}
                  title="Nueva solicitud"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <Link href="/mantenciones" className="text-xs hover:opacity-70" style={{ color: '#2563ae' }}>
                  Ver →
                </Link>
              </div>
            </div>

            {cargandoDatos ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : solicitudes.length === 0 ? (
              <div className="text-center py-5">
                <CheckCircle className="w-7 h-7 mx-auto mb-2" style={{ color: '#10b981' }} />
                <p className="text-xs text-gray-400">Sin solicitudes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {solicitudes.slice(0, 3).map(s => {
                  const pCfg = prioridadCfg[s.prioridad]
                  const sCfg = estadoSolCfg[s.estado]
                  return (
                    <div key={s.id} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: '#f8fafc' }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: sCfg.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{s.titulo}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs" style={{ color: sCfg.color }}>{sCfg.label}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: pCfg.bg, color: pCfg.color }}>
                            {pCfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Mis Paquetes */}
        <div
          className={`bg-white rounded-2xl border shadow-sm p-5 ${!esPropietario ? 'md:col-span-1' : ''}`}
          style={{ borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Mis Paquetes</h3>
            <Link href="/paquetes" className="text-xs hover:opacity-70" style={{ color: '#2563ae' }}>Ver →</Link>
          </div>

          {cargandoDatos ? (
            <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : paquetes.length === 0 ? (
            <div className="text-center py-5">
              <Package className="w-7 h-7 mx-auto mb-2" style={{ color: '#e2e8f0' }} />
              <p className="text-xs text-gray-400">Sin paquetes pendientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {paquetes.map(p => (
                <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ background: '#f8fafc' }}>
                  <Package className="w-4 h-4 shrink-0" style={{ color: '#db2777' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{p.courier}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {p.descripcion ?? 'Sin descripción'}
                      {p.codigoRetiro ? ` · Cód. ${p.codigoRetiro}` : ''}
                    </p>
                  </div>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                    style={{ background: '#fce7f3', color: '#db2777' }}
                  >
                    {p.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comunicaciones del edificio */}
        <div
          className={`bg-white rounded-2xl border shadow-sm p-5 ${!esPropietario ? 'md:col-span-2' : ''}`}
          style={{ borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Comunicaciones</h3>
            <Link href="/comunicaciones" className="text-xs hover:opacity-70" style={{ color: '#2563ae' }}>Ver →</Link>
          </div>

          {cargandoDatos ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : comunicaciones.length === 0 ? (
            <div className="text-center py-5">
              <MessageSquare className="w-7 h-7 mx-auto mb-2" style={{ color: '#e2e8f0' }} />
              <p className="text-xs text-gray-400">Sin comunicaciones recientes</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {comunicaciones.map(c => {
                const cfg = tipoComunCfg[c.tipo] ?? { bg: '#f1f5f9', emoji: '📢' }
                return (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <span
                      className="flex items-center justify-center w-8 h-8 rounded-xl text-sm shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      {cfg.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{c.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.contenido}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Reservas próximas ── */}
      {!cargandoDatos && misReservas.length > 0 && (
        <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Mis Reservas</h3>
            <Link
              href="/reservas"
              className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#2563ae' }}
            >
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {misReservas.slice(0, 3).map(r => {
              const espacio = espacios.find(e => e.id === r.espacioId)
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 rounded-xl border flex-1 min-w-48"
                  style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                    style={{ background: '#cffafe' }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: '#0891b2' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {espacio?.nombre ?? 'Espacio'}
                    </p>
                    <p className="text-xs text-gray-400">{formatFecha(r.fechaInicio)}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-auto"
                    style={{ background: '#d1fae5', color: '#059669' }}
                  >
                    Confirmada
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ════════════ MODAL: NUEVA SOLICITUD ════════════ */}
      {showSolicitud && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,35,65,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowSolicitud(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fef3c7' }}>
                  <Wrench className="w-4 h-4" style={{ color: '#d97706' }} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Nueva Solicitud</h3>
                  <p className="text-xs text-gray-400">Reporta un problema en tu unidad</p>
                </div>
              </div>
              <button onClick={() => setShowSolicitud(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleNuevaSolicitud} className="p-6 space-y-4">

              {/* Éxito */}
              {solOk && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: '#dcfce7', color: '#16a34a' }}>
                  ✅ Solicitud enviada. El administrador la revisará pronto.
                </div>
              )}

              {/* Error */}
              {solError && (
                <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  ⚠️ {solError}
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Título *</label>
                <input
                  type="text"
                  value={solTitulo}
                  onChange={e => setSolTitulo(e.target.value)}
                  placeholder="Ej: Filtración en baño"
                  suppressHydrationWarning
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Descripción *</label>
                <textarea
                  value={solDesc}
                  onChange={e => setSolDesc(e.target.value)}
                  placeholder="Describe el problema con el mayor detalle posible..."
                  rows={3}
                  suppressHydrationWarning
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all resize-none"
                  style={{ borderColor: '#e2e8f0' }}
                />
              </div>

              {/* Categoría + Prioridad */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Categoría</label>
                  <select
                    value={solCategoria}
                    onChange={e => setSolCategoria(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Prioridad</label>
                  <select
                    value={solPrioridad}
                    onChange={e => setSolPrioridad(e.target.value as PrioridadSolicitud)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all bg-white"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSolicitud(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ background: '#f1f5f9', color: '#64748b' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={solLoading || solOk}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#d97706' }}
                >
                  {solLoading
                    ? <Loader2 className="animate-spin w-4 h-4" />
                    : <Send className="w-4 h-4" />
                  }
                  {solLoading ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
