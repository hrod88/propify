'use client'

import { useState } from 'react'
import { Plus, Calendar, Clock, Users, DollarSign } from 'lucide-react'
import { formatCLP } from '@/lib/format'
import type { EspacioComun, Reserva, Unidad, User } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
const estadoCfg = {
  disponible:     { label: 'Disponible',        bg: '#dcfce7', color: '#16a34a' },
  ocupado:        { label: 'Ocupado',           bg: '#fee2e2', color: '#dc2626' },
  reservado:      { label: 'Reservado',         bg: '#fef3c7', color: '#d97706' },
  fuera_servicio: { label: 'Fuera de servicio', bg: '#f1f5f9', color: '#64748b' },
} as const

const tipoEmoji: Record<string, string> = {
  quincho:                 '🔥',
  sala_multiuso:           '🏛️',
  lavanderia:              '🧺',
  gimnasio:                '💪',
  piscina:                 '🏊',
  sala_reuniones:          '📋',
  estacionamiento_visitas: '🚗',
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  espacios: EspacioComun[]
  reservas: Reserva[]
  unidades: Unidad[]
  users: User[]
}

// ─── Componente ───────────────────────────────────────────────
export default function ReservasView({ espacios, reservas, unidades, users }: Props) {
  const [tab, setTab] = useState<'espacios' | 'reservas'>('espacios')

  const disponibles = espacios.filter(e => e.estado === 'disponible').length
  const reservados  = espacios.filter(e => e.estado === 'reservado').length
  const fuera       = espacios.filter(e => e.estado === 'fuera_servicio').length

  const getUnidad  = (id: string) => unidades.find(u => u.id === id)
  const getEspacio = (id: string) => espacios.find(e => e.id === id)
  const getUser    = (id: string) => users.find(u => u.id === id)

  const formatFechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })

  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500 mt-1">
            {espacios.length} espacios · {disponibles} disponibles · {reservas.length} reservas activas
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#2563ae' }}
        >
          <Plus className="w-4 h-4" />
          Nueva reserva
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Disponibles',       value: disponibles, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Reservados',        value: reservados,  color: '#d97706', bg: '#fef3c7' },
          { label: 'Fuera de servicio', value: fuera,       color: '#64748b', bg: '#f1f5f9' },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border shadow-sm p-4"
            style={{ borderColor: '#e2e8f0' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
              style={{ background: bg }}
            >
              <Calendar className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { value: 'espacios', label: `Espacios (${espacios.length})` },
          { value: 'reservas', label: `Reservas (${reservas.length})` },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value as typeof tab)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={
              tab === value
                ? { background: '#2563ae', color: 'white' }
                : { background: '#f1f5f9', color: '#64748b' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid de espacios */}
      {tab === 'espacios' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {espacios.map(e => {
            const cfg = estadoCfg[e.estado]
            return (
              <div
                key={e.id}
                className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow"
                style={{ borderColor: '#e2e8f0' }}
              >
                {/* Cabecera */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tipoEmoji[e.tipo] ?? '🏢'}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{e.nombre}</h3>
                      <p className="text-xs text-gray-400 capitalize">
                        {e.tipo.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>

                {e.descripcion && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{e.descripcion}</p>
                )}

                {/* Footer de la card */}
                <div
                  className="flex items-center justify-between pt-3 border-t text-xs text-gray-400"
                  style={{ borderColor: '#f1f5f9' }}
                >
                  {e.capacidad ? (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {e.capacidad} personas
                    </span>
                  ) : (
                    <span />
                  )}
                  {e.tarifaUso ? (
                    <span
                      className="flex items-center gap-1 font-semibold"
                      style={{ color: '#16a34a' }}
                    >
                      <DollarSign className="w-3 h-3" />
                      {formatCLP(e.tarifaUso)}
                    </span>
                  ) : (
                    <span className="text-gray-300">Sin tarifa</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista de reservas */}
      {tab === 'reservas' && (
        <div className="space-y-3">
          {reservas.length === 0 ? (
            <div
              className="bg-white rounded-2xl border shadow-sm py-12 text-center"
              style={{ borderColor: '#e2e8f0' }}
            >
              <Calendar className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">No hay reservas registradas</p>
            </div>
          ) : reservas.map(r => {
            const espacio = getEspacio(r.espacioId)
            const unidad  = getUnidad(r.unidadId)
            const usuario = getUser(r.usuarioId)

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow"
                style={{ borderColor: '#e2e8f0' }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    {/* Emoji espacio */}
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 text-2xl"
                      style={{ background: '#f1f5f9' }}
                    >
                      {espacio ? (tipoEmoji[espacio.tipo] ?? '🏢') : '🏢'}
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        {espacio?.nombre ?? 'Espacio'}
                      </h3>
                      <p className="text-xs text-gray-400">
                        Unidad {unidad?.numero ?? r.unidadId}
                        {usuario && ` · ${usuario.nombre} ${usuario.apellido}`}
                      </p>
                      {r.nota && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{r.nota}"</p>
                      )}
                    </div>
                  </div>

                  {/* Fecha y hora */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 justify-end">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatFechaCorta(r.fechaInicio)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 justify-end">
                      <Clock className="w-3 h-3" />
                      {formatHora(r.fechaInicio)} – {formatHora(r.fechaFin)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

