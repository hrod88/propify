import type { Metadata } from 'next'
import { getVisitas, getUnidades, getUsuarios } from '@/lib/db'
import VisitasView from './VisitasView'

export const metadata: Metadata = { title: 'Control de Visitas' }

export default async function VisitasPage() {
  const [visitas, unidades, users] = await Promise.all([
    getVisitas(),
    getUnidades(),
    getUsuarios(),
  ])
  return <VisitasView visitas={visitas} unidades={unidades} users={users} />
}
