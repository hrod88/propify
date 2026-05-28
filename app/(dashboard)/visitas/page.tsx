import type { Metadata } from 'next'
import { getVisitas, getUnidades, getUsuarios } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import VisitasView from './VisitasView'

export const metadata: Metadata = { title: 'Control de Visitas' }

export default async function VisitasPage() {
  const edificioId = await getEdificioActual()
  const [visitas, unidades, users] = await Promise.all([
    getVisitas(edificioId),
    getUnidades(edificioId),
    getUsuarios(edificioId),
  ])
  return <VisitasView visitas={visitas} unidades={unidades} users={users} />
}
