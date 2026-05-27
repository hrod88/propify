import type { Metadata } from 'next'
import { getPaquetes, getUnidades, getUsuarios } from '@/lib/db'
import PaquetesView from './PaquetesView'

export const metadata: Metadata = { title: 'Paquetes' }

export default async function PaquetesPage() {
  const [paquetes, unidades, users] = await Promise.all([
    getPaquetes(),
    getUnidades(),
    getUsuarios(),
  ])
  return <PaquetesView paquetes={paquetes} unidades={unidades} users={users} />
}
