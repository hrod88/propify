import type { Metadata } from 'next'
import { getSolicitudes, getUnidades, getUsuarios } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import MantencionesView from './MantencionesView'

export const metadata: Metadata = { title: 'Mantenciones' }

export default async function MantencionesPage() {
  const edificioId = await getEdificioActual()
  const [solicitudes, unidades, users] = await Promise.all([
    getSolicitudes(edificioId),
    getUnidades(edificioId),
    getUsuarios(edificioId),
  ])
  return <MantencionesView solicitudes={solicitudes} unidades={unidades} users={users} />
}
