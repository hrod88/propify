import type { Metadata } from 'next'
import { getResidentes, getUnidades } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ResidentesView from './ResidentesView'

export const metadata: Metadata = { title: 'Residentes' }

export default async function ResidentesPage() {
  const edificioId = await getEdificioActual()
  const [residentes, unidades] = await Promise.all([
    getResidentes(edificioId),
    getUnidades(edificioId),
  ])
  return <ResidentesView residentes={residentes} unidades={unidades} edificioId={edificioId} />
}
