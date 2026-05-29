'use client'

import { useState } from 'react'
import {
  Droplets, Package, Globe, Phone, MapPin,
  CheckCircle2, Wrench, XCircle, ChevronDown,
  Sparkles, Check, Info, CreditCard,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNotificaciones } from '@/context/notificaciones-context'
import type { Amenidad, EstadoAmenidad } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
const estadoCfg: Record<EstadoAmenidad, { label: string; bg: string; color: string; Icon: React.ElementType }> = {
  disponible:      { label: 'Disponible',     bg: '#dcfce7', color: '#16a34a', Icon: CheckCircle2 },
  mantencion:      { label: 'En mantención',  bg: '#fef3c7', color: '#d97706', Icon: Wrench       },
  fuera_servicio:  { label: 'Fuera de servicio', bg: '#fee2e2', color: '#dc2626', Icon: XCircle   },
}

const iconoCfg: Record<string, React.ElementType> = {
  droplets: Droplets,
  package:  Package,
}

// Parsea "5L=650|10L=1100|20L=1650" → [{ label:'5L', precio:650 }, ...]
function parsePrecioInfo(raw?: string): { label: string; precio: number }[] {
  if (!raw) return []
  return raw.split('|').map(seg => {
    const [label, precio] = seg.split('=')
    return { label: label ?? seg, precio: Number(precio ?? 0) }
  })
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  amenidades: Amenidad[]
}

// ─── Componente ───────────────────────────────────────────────
export default function AmenidadesView({ amenidades: initial }: Props) {
  const { agregarNotificacion }   = useNotificaciones()
  const [lista, setLista]         = useState<Amenidad[]>(initial)
  const [toast, setToast]         = useState<string | null>(null)
  const [cambiando, setCambiando] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function cambiarEstado(id: string, nuevoEstado: EstadoAmenidad) {
    setCambiando(null)
    const amenidad = lista.find(a => a.id === id)
    setLista(prev => prev.map(a => a.id === id ? { ...a, estado: nuevoEstado } : a))
    const estadoLabel = estadoCfg[nuevoEstado].label
    showToast(`${amenidad?.nombre ?? 'Amenidad'} → ${estadoLabel}`)
    // Notificar a todos los residentes del cambio de estado
    if (amenidad) {
      agregarNotificacion(
        'circular',
        `${amenidad.nombre}: ${estadoLabel}`,
        nuevoEstado === 'disponible'
          ? 'El servicio está disponible nuevamente.'
          : nuevoEstado === 'mantencion'
          ? 'El servicio está temporalmente en mantención.'
          : 'El servicio no está disponible por el momento.',
      )
    }
    supabase.from('amenidades').update({ estado: nuevoEstado }).eq('id', id).then(({ error }) => {
      if (error) console.error('update amenidad:', error.message)
    })
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl"
          style={{ background: '#16a34a' }}
        >
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Amenidades & Servicios</h1>
        <p className="text-gray-500 mt-1">
          Servicios disponibles en el edificio para los residentes
        </p>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#0369a1' }} />
        <p className="text-sm" style={{ color: '#0369a1' }}>
          El administrador puede actualizar el estado de cada servicio (disponible / mantención / fuera de servicio)
          para que todos los residentes vean el estado actual en tiempo real.
        </p>
      </div>

      {/* Cards de amenidades */}
      {lista.length === 0 ? (
        <div className="bg-white rounded-2xl border shadow-sm py-16 text-center" style={{ borderColor: '#e2e8f0' }}>
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 text-sm">No hay amenidades registradas</p>
          <p className="text-gray-300 text-xs mt-1">Ejecuta el SQL de seed en Supabase para agregar AMAWA y Odihnx</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {lista.map(amenidad => {
            const est     = estadoCfg[amenidad.estado] ?? estadoCfg.disponible
            const EstIcon = est.Icon
            const IcoComp = iconoCfg[amenidad.icono ?? ''] ?? Sparkles
            const precios = parsePrecioInfo(amenidad.precioInfo)
            const abierto = cambiando === amenidad.id

            return (
              <div
                key={amenidad.id}
                className="bg-white rounded-2xl border shadow-sm overflow-hidden"
                style={{ borderColor: '#e2e8f0' }}
              >
                {/* Barra de color */}
                <div className="h-1.5 w-full" style={{ background: est.color }} />

                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
                        style={{ background: est.bg }}
                      >
                        <IcoComp className="w-6 h-6" style={{ color: est.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 leading-tight">{amenidad.nombre}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 leading-snug">{amenidad.descripcion}</p>
                      </div>
                    </div>

                    {/* Badge estado + dropdown */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setCambiando(abierto ? null : amenidad.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-opacity hover:opacity-80"
                        style={{ background: est.bg, color: est.color }}
                      >
                        <EstIcon className="w-3 h-3" />
                        {est.label}
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      </button>

                      {/* Dropdown cambio de estado */}
                      {abierto && (
                        <div
                          className="absolute right-0 top-full mt-1 bg-white rounded-xl border shadow-lg z-20 overflow-hidden"
                          style={{ borderColor: '#e2e8f0', minWidth: 180 }}
                        >
                          {(Object.entries(estadoCfg) as [EstadoAmenidad, typeof estadoCfg[EstadoAmenidad]][]).map(([key, cfg]) => {
                            const Ic = cfg.Icon
                            return (
                              <button
                                key={key}
                                onClick={() => cambiarEstado(amenidad.id, key)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-left hover:bg-gray-50 transition-colors"
                                style={{ color: key === amenidad.estado ? cfg.color : '#374151' }}
                              >
                                <Ic className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                                {cfg.label}
                                {key === amenidad.estado && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: cfg.color }} />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabla de precios — solo para AMAWA */}
                  {precios.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tarifas</p>
                      <div className="grid grid-cols-3 gap-2">
                        {precios.map(({ label, precio }) => (
                          <div
                            key={label}
                            className="flex flex-col items-center p-3 rounded-xl"
                            style={{ background: '#f8fafc' }}
                          >
                            <span className="text-xs font-semibold text-gray-500">{label}</span>
                            <span className="text-base font-bold text-gray-900 mt-0.5">{formatCLP(precio)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 px-1">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">Pago con tarjeta Transbank (crédito / débito)</span>
                      </div>
                    </div>
                  )}

                  {/* Info adicional */}
                  <div className="space-y-1.5">
                    {amenidad.ubicacion && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        {amenidad.ubicacion}
                      </div>
                    )}
                    {amenidad.contacto && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                        {amenidad.contacto}
                      </div>
                    )}
                    {amenidad.website && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: '#2563ae' }}>
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <a
                          href={`https://${amenidad.website.replace(/^https?:\/\//, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {amenidad.website}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Nota Odihnx → Paquetes */}
                  {amenidad.icono === 'package' && (
                    <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <Package className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#0369a1' }} />
                      <p className="text-xs" style={{ color: '#0369a1' }}>
                        Los paquetes recibidos en estos casilleros se registran en el módulo{' '}
                        <strong>Paquetes</strong> con el número de casillero para que el residente sepa dónde retirar su encomienda.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
