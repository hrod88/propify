import type { Metadata } from 'next'
import {
  getConfigFacturacion,
  getGeneraciones,
  getUnidades,
  getEdificioById,
} from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import FacturacionView from './FacturacionView'

export const metadata: Metadata = { title: 'Facturación' }

export default async function FacturacionPage() {
  const edificioId = await getEdificioActual()
  const [config, generaciones, unidades, edificio] = await Promise.all([
    getConfigFacturacion(edificioId),
    getGeneraciones(edificioId),
    getUnidades(edificioId),
    getEdificioById(edificioId),
  ])

  return (
    <FacturacionView
      config={config}
      generaciones={generaciones}
      unidades={unidades}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
