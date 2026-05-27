import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Building2, MapPin, Layers, ChevronRight,
  Plus, Home, Calendar, Users,
} from 'lucide-react'
import { getEdificios, getUnidades, getUsuarios, formatCLP } from '@/lib/db'
import type { Edificio, Unidad, User } from '@/types'

export const metadata: Metadata = { title: 'Edificios' }

// ─── Sub-componentes ──────────────────────────────────────────
function EdificioCard({
  edificio,
  unidades,
  users,
}: {
  edificio: Edificio
  unidades: Unidad[]
  users: User[]
}) {
  const unidadesEdificio = unidades.filter(u => u.edificioId === edificio.id)
  const ocupadas = unidadesEdificio.filter(u => u.estado === 'ocupado').length
  const pct      = Math.round((ocupadas / edificio.totalUnidades) * 100)
  const barColor = pct >= 90 ? '#16a34a' : pct >= 70 ? '#2563ae' : '#d97706'
  const admin    = users.find(u => u.id === edificio.administradorId)

  return (
    <div className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col" style={{ borderColor: '#e2e8f0' }}>
      <div className="p-5 border-b" style={{ borderColor: '#f1f5f9' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: '#dbeafe' }}>
            <Building2 className="w-6 h-6" style={{ color: '#2563ae' }} />
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#dcfce7', color: '#16a34a' }}>Activo</span>
        </div>
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{edificio.nombre}</h3>
        <div className="flex items-center gap-1.5 mt-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <p className="text-sm text-gray-500 truncate">{edificio.direccion}, {edificio.comuna}</p>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">RUT: {edificio.rut}</p>
      </div>

      <div className="p-5 pb-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Unidades', value: edificio.totalUnidades, Icon: Home },
          { label: 'Pisos',    value: edificio.pisos,         Icon: Layers },
          { label: 'Año',      value: edificio.anoconstruccion ?? '—', Icon: Calendar },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="text-center p-2.5 rounded-xl" style={{ background: '#f8fafc' }}>
            <p className="text-base font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-500">Ocupación</span>
          <span className="font-bold" style={{ color: barColor }}>{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{ocupadas} de {edificio.totalUnidades} unidades ocupadas</p>
      </div>

      <div className="mt-auto px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0" style={{ background: '#2563ae' }}>
            {admin ? admin.nombre[0] : '?'}
          </div>
          <span className="text-xs text-gray-500 truncate">
            {admin ? `${admin.nombre} ${admin.apellido}` : 'Sin administrador'}
          </span>
        </div>
        <Link
          href={`/edificios/${edificio.id}`}
          className="flex items-center gap-1 text-sm font-semibold hover:opacity-75 transition-opacity shrink-0 ml-2"
          style={{ color: '#2563ae' }}
        >
          Ver detalle <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────
export default async function EdificiosPage() {
  const [edificios, unidades, users] = await Promise.all([getEdificios(), getUnidades(), getUsuarios()])

  const totalUnidades    = edificios.reduce((acc, e) => acc + e.totalUnidades, 0)
  const totalOcupadas    = unidades.filter(u => u.estado === 'ocupado').length
  const totalDisponibles = unidades.filter(u => u.estado === 'disponible').length

  const resumen = [
    { label: 'Edificios',        value: edificios.length, color: '#2563ae' },
    { label: 'Unidades totales', value: totalUnidades,    color: '#16a34a' },
    { label: 'Ocupadas',         value: totalOcupadas,    color: '#059669' },
    { label: 'Disponibles',      value: totalDisponibles, color: '#d97706' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edificios</h1>
          <p className="text-gray-500 mt-1">{edificios.length} edificios · {totalUnidades} unidades en total</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: '#2563ae' }}>
          <Plus className="w-4 h-4" /> Nuevo edificio
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {resumen.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4 shadow-sm" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm mt-0.5" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {edificios.map(e => (
          <EdificioCard key={e.id} edificio={e} unidades={unidades} users={users} />
        ))}
      </div>
    </div>
  )
}
