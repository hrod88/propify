'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, XCircle, AlertCircle,
  Mail, Phone, Clock, Send, Home,
} from 'lucide-react'
import { formatCLP } from '@/lib/db'
import type { GastoComun, Unidad, User } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
const moroCfg = {
  vencido: {
    Icon: XCircle,
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fecaca',
    accent: '#dc2626',
    label: 'Vencido',
  },
  parcial: {
    Icon: AlertCircle,
    color: '#9333ea',
    bg: '#f3e8ff',
    border: '#e9d5ff',
    accent: '#9333ea',
    label: 'Pago parcial',
  },
} as const

// ─── Props ────────────────────────────────────────────────────
interface Props {
  morosos: GastoComun[]
  unidades: Unidad[]
  users: User[]
}

// ─── Componente ───────────────────────────────────────────────
export default function MorosView({ morosos, unidades, users }: Props) {
  const [recordatorioEnviado, setRecordatorioEnviado] = useState<Set<string>>(new Set())

  const totalMoroso = morosos.reduce((s, g) => s + g.montoTotal, 0)
  const diasPromedio = morosos.filter(g => g.diasMora).reduce((s, g) => s + (g.diasMora ?? 0), 0) / (morosos.filter(g => g.diasMora).length || 1)

  const getUnidad    = (id: string) => unidades.find(u => u.id === id)
  const getResidente = (unidad?: Unidad) => {
    if (!unidad) return null
    const uid = unidad.arrendatarioId ?? unidad.propietarioId
    if (!uid) return null
    return users.find(u => u.id === uid) ?? null
  }

  const enviarRecordatorio = (id: string) => {
    setRecordatorioEnviado(prev => new Set(prev).add(id))
  }

  if (morosos.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Morosos</h1>
          <p className="text-gray-500 mt-1">Panel de morosidad</p>
        </div>
        <div
          className="bg-white rounded-2xl border shadow-sm py-20 text-center"
          style={{ borderColor: '#e2e8f0' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#dcfce7' }}>
            <AlertTriangle className="w-7 h-7" style={{ color: '#16a34a' }} />
          </div>
          <p className="font-bold text-gray-900">¡Sin morosos este mes!</p>
          <p className="text-sm text-gray-400 mt-1">Todos los gastos comunes están al día.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Morosos</h1>
          <p className="text-gray-500 mt-1">
            {morosos.length} unidad{morosos.length !== 1 ? 'es' : ''} con morosidad · Mayo 2026
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#dc2626' }}
        >
          <Send className="w-4 h-4" />
          Enviar recordatorio masivo
        </button>
      </div>

      {/* Banner de alerta */}
      <div
        className="rounded-2xl border p-5"
        style={{ background: '#fff5f5', borderColor: '#fecaca' }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#fee2e2' }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: '#dc2626' }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 mb-3">Resumen de morosidad — Mayo 2026</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>{morosos.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Unidades en mora</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>{formatCLP(totalMoroso)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total adeudado</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>{Math.round(diasPromedio)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Días promedio de mora</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de morosos */}
      <div className="space-y-3">
        {morosos.map(g => {
          const unidad    = getUnidad(g.unidadId)
          const residente = getResidente(unidad)
          const cfg       = moroCfg[g.estadoPago as 'vencido' | 'parcial'] ?? moroCfg.vencido
          const { Icon }  = cfg
          const enviado   = recordatorioEnviado.has(g.id)

          return (
            <div
              key={g.id}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden"
              style={{ borderColor: cfg.border }}
            >
              {/* Barra de color superior */}
              <div className="h-1 w-full" style={{ background: cfg.accent }} />

              <div className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-4">

                  {/* Info principal */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Número de unidad */}
                    <div
                      className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl shrink-0 text-center"
                      style={{ background: cfg.bg }}
                    >
                      <Home className="w-4 h-4 mb-0.5" style={{ color: cfg.color }} />
                      <p className="text-xs font-bold" style={{ color: cfg.color }}>
                        {unidad?.numero ?? '—'}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Nombre + estado */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">
                          {residente
                            ? `${residente.nombre} ${residente.apellido}`
                            : `Unidad ${unidad?.numero ?? g.unidadId}`}
                        </h3>
                        <span
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Contacto */}
                      {residente && (
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {residente.email}
                          </span>
                          {residente.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {residente.telefono}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Datos de mora */}
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Monto adeudado</p>
                          <p className="text-lg font-bold mt-0.5" style={{ color: cfg.color }}>
                            {formatCLP(g.montoTotal)}
                          </p>
                        </div>
                        {g.diasMora && (
                          <div>
                            <p className="text-xs text-gray-400">Días en mora</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-4 h-4" style={{ color: cfg.color }} />
                              <p className="text-lg font-bold" style={{ color: cfg.color }}>
                                {g.diasMora} días
                              </p>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-400">Fecha vencimiento</p>
                          <p className="text-sm font-semibold text-gray-700 mt-0.5">
                            {new Date(g.fechaVencimiento).toLocaleDateString('es-CL', {
                              day: 'numeric', month: 'long',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => enviarRecordatorio(g.id)}
                      disabled={enviado}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={
                        enviado
                          ? { background: '#dcfce7', color: '#16a34a', cursor: 'default' }
                          : { background: cfg.bg, color: cfg.color }
                      }
                    >
                      <Send className="w-3.5 h-3.5" />
                      {enviado ? 'Recordatorio enviado' : 'Enviar recordatorio'}
                    </button>
                    <Link
                      href={`/gastos/${g.id}`}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                      style={{ background: '#f1f5f9', color: '#1e3a5f' }}
                    >
                      Ver detalle →
                    </Link>
                    {residente && (
                      <Link
                        href={`/residentes/${residente.id}`}
                        className="text-xs font-semibold text-center hover:opacity-75 transition-opacity"
                        style={{ color: '#64748b' }}
                      >
                        Ver perfil residente
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center pb-2">
        {morosos.length} unidad{morosos.length !== 1 ? 'es' : ''} en mora ·{' '}
        Total adeudado: <span className="font-semibold">{formatCLP(totalMoroso)}</span>
      </p>
    </div>
  )
}

