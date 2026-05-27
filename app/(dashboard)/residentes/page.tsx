import type { Metadata } from 'next'
import { getResidentes, getUnidades } from '@/lib/db'
import ResidentesView from './ResidentesView'

export const metadata: Metadata = { title: 'Residentes' }

export default async function ResidentesPage() {
  const [residentes, unidades] = await Promise.all([getResidentes(), getUnidades()])
  return <ResidentesView residentes={residentes} unidades={unidades} />
}
