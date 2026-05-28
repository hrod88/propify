import type { Metadata } from 'next'
import { getEgresos, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import EgresosView from './EgresosView'

export const metadata: Metadata = { title: 'Egresos' }

export default async function EgresosPage() {
  const edificioId = await getEdificioActual()
  const [egresos, edificio] = await Promise.all([
    getEgresos(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <EgresosView
      egresos={egresos}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
    />
  )
}
