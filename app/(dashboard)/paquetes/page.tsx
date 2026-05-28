import type { Metadata } from 'next'
import { getPaquetes, getUnidades, getUsuarios } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import PaquetesView from './PaquetesView'

export const metadata: Metadata = { title: 'Paquetes' }

export default async function PaquetesPage() {
  const edificioId = await getEdificioActual()
  const [paquetes, unidades, users] = await Promise.all([
    getPaquetes(edificioId),
    getUnidades(edificioId),
    getUsuarios(edificioId),
  ])
  return <PaquetesView paquetes={paquetes} unidades={unidades} users={users} />
}
