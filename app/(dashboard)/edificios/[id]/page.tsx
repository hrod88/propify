import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  Building2, MapPin, ArrowLeft, ChevronRight,
  Home, Layers, Users, Pencil, Hash, ImageIcon,
} from 'lucide-react'
import { getEdificioById, getUnidades, getEspaciosComunes, getGastosComunes, getUsuarios, formatCLP } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'

type PageProps = { params: Promise<{ id: string }> }

// ─── Metadata dinámica ────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const edificio = await getEdificioById(id)
  return { title: edificio?.nombre ?? 'Edificio' }
}

// ─── Helpers ──────────────────────────────────────────────────
const estadoUnidadCfg = {
  ocupado:          { label: 'Ocupado',     bg: '#dcfce7', color: '#16a34a' },
  disponible:       { label: 'Disponible',  bg: '#dbeafe', color: '#2563ae' },
  'en_mantención':  { label: 'Mantención',  bg: '#fef3c7', color: '#d97706' },
} as const

const estadoEspacioCfg = {
  disponible:    { bg: '#dcfce7', color: '#16a34a' },
  ocupado:       { bg: '#fee2e2', color: '#dc2626' },
  reservado:     { bg: '#fef3c7', color: '#d97706' },
  fuera_servicio:{ bg: '#f1f5f9', color: '#64748b' },
} as const

const tipoLabel: Record<string, string> = {
  departamento:    'Depto',
  casa:            'Casa',
  local_comercial: 'Local',
  oficina:         'Oficina',
  bodega:          'Bodega',
  estacionamiento: 'Estac.',
}

function formatPiso(piso: number) {
  if (piso < 0) return `Sótano ${Math.abs(piso)}`
  if (piso === 0) return 'PB'
  return `Piso ${piso}`
}

// ─── Página ───────────────────────────────────────────────────
export default async function EdificioDetailPage({ params }: PageProps) {
  const { id } = await params
  const edificioId = await getEdificioActual()
  const [edificio, todasUnidades, espacios, gastosComunes, users] = await Promise.all([
    getEdificioById(id),
    getUnidades(edificioId),
    getEspaciosComunes(edificioId),
    getGastosComunes(edificioId),
    getUsuarios(edificioId),
  ])
  if (!edificio) return notFound()

  const unidades  = todasUnidades.filter(u => u.edificioId === id)
  const espaciosE = espacios.filter(e => e.edificioId === id)
  const admin     = users.find(u => u.id === edificio.administradorId)
  const ocupadas  = unidades.filter(u => u.estado === 'ocupado').length
  const pct       = Math.round((ocupadas / edificio.totalUnidades) * 100)

  const ingresosMes = gastosComunes
    .filter(g => g.edificioId === id && g.estadoPago === 'pagado')
    .reduce((acc, g) => acc + g.montoTotal, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/edificios"
          className="flex items-center gap-1.5 font-medium hover:opacity-75 transition-opacity"
          style={{ color: '#2563ae' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Edificios
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span>{edificio.nombre}</span>
      </div>

      {/* Header del edificio */}
      <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl shrink-0" style={{ background: '#dbeafe' }}>
              <Building2 className="w-7 h-7" style={{ color: '#2563ae' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{edificio.nombre}</h1>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#dcfce7', color: '#16a34a' }}>Activo</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 mb-0.5">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{edificio.direccion}, {edificio.comuna}, {edificio.ciudad}</span>
              </div>
              <p className="text-sm text-gray-400">RUT: {edificio.rut} · Año construcción: {edificio.anoconstruccion}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity" style={{ background: '#f1f5f9', color: '#1e3a5f' }}>
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Unidades',     value: `${ocupadas}/${edificio.totalUnidades}`, Icon: Home,   color: '#2563ae', bg: '#dbeafe' },
            { label: 'Pisos',        value: edificio.pisos,                          Icon: Layers, color: '#7c3aed', bg: '#f3e8ff' },
            { label: 'Ocupación',    value: `${pct}%`,                               Icon: Users,  color: '#16a34a', bg: '#dcfce7' },
            { label: 'Ingresos mes', value: formatCLP(ingresosMes),                  Icon: Hash,   color: '#059669', bg: '#ecfdf5' },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8fafc' }}>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: bg }}>
                <Icon style={{ width: 18, height: 18, color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {admin && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl w-fit" style={{ background: '#f8fafc' }}>
            <div className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold" style={{ background: '#1e3a5f' }}>
              {admin.nombre[0]}{admin.apellido[0]}
            </div>
            <div>
              <span className="text-xs text-gray-400">Administrador: </span>
              <span className="text-xs font-semibold text-gray-700">{admin.nombre} {admin.apellido}</span>
              <span className="text-xs text-gray-400 ml-1">· {admin.email}</span>
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabla de unidades (2/3) */}
        <div className="xl:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: '#f1f5f9' }}>
            <h2 className="font-bold text-gray-900">Unidades</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{unidades.length} registros</span>
              <Link href="/unidades" className="text-xs font-semibold hover:opacity-75" style={{ color: '#2563ae' }}>Ver todas →</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
                  {['Número', 'Piso', 'Tipo', 'Estado', 'Superficie', 'Gastos C.', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => {
                  const est = estadoUnidadCfg[u.estado as keyof typeof estadoUnidadCfg] ?? { label: u.estado, bg: '#f1f5f9', color: '#64748b' }
                  return (
                    <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: '#f8fafc' }}>
                      <td className="px-4 py-3.5 font-semibold text-gray-900 text-sm">Unidad {u.numero}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{formatPiso(u.piso)}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: '#f1f5f9', color: '#64748b' }}>{tipoLabel[u.tipo] ?? u.tipo}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap" style={{ background: est.bg, color: est.color }}>{est.label}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{u.superficieM2} m²</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-700 whitespace-nowrap">{formatCLP(u.gastosComunesMonto)}</td>
                      <td className="px-4 py-3.5">
                        <Link href={`/unidades/${u.id}`} className="text-xs font-semibold hover:opacity-75" style={{ color: '#2563ae' }}>Ver →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Espacios comunes (1/3) */}
        <div className="bg-white rounded-2xl border shadow-sm" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: '#f1f5f9' }}>
            <h2 className="font-bold text-gray-900">Espacios Comunes</h2>
            <span className="text-xs text-gray-400">{espaciosE.length}</span>
          </div>
          <div className="p-4 space-y-2">
            {espaciosE.map(esp => {
              const cfg = estadoEspacioCfg[esp.estado as keyof typeof estadoEspacioCfg] ?? { bg: '#f1f5f9', color: '#64748b' }
              return (
                <div key={esp.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f8fafc' }}>
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{esp.nombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Cap. {esp.capacidad ?? '—'}{esp.tarifaUso ? ` · ${formatCLP(esp.tarifaUso)}/vez` : ''}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 capitalize" style={{ background: cfg.bg, color: cfg.color }}>{esp.estado.replace('_', ' ')}</span>
                </div>
              )
            })}
          </div>
          <div className="px-5 pb-4">
            <Link href="/reservas" className="block w-full py-2 rounded-xl text-sm font-semibold text-center hover:opacity-80 transition-opacity" style={{ background: '#f1f5f9', color: '#1e3a5f' }}>
              Gestionar reservas →
            </Link>
          </div>
        </div>
      </div>
      {/* Galería de fotos */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: '#f1f5f9' }}>
          <h2 className="font-bold text-gray-900">Galería del Edificio</h2>
          <span className="text-xs text-gray-400">{(edificio.fotos ?? []).length} foto{(edificio.fotos ?? []).length !== 1 ? 's' : ''}</span>
        </div>

        {(edificio.fotos ?? []).length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
              <ImageIcon className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sin fotos todavía</p>
              <p className="text-xs text-gray-400 mt-1">
                Para agregar fotos: actualiza el campo <code className="bg-gray-100 px-1 rounded">fotos</code> del
                edificio en Supabase con un array de URLs de imagen.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(edificio.fotos ?? []).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Foto ${i + 1} de ${edificio.nombre}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
