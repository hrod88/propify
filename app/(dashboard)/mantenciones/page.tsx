import type { Metadata } from 'next'
import { getSolicitudes, getUnidades, getUsuarios } from '@/lib/db'
import MantencionesView from './MantencionesView'

export const metadata: Metadata = { title: 'Mantenciones' }

export default async function MantencionesPage() {
  const [solicitudes, unidades, users] = await Promise.all([
    getSolicitudes(),
    getUnidades(),
    getUsuarios(),
  ])
  return <MantencionesView solicitudes={solicitudes} unidades={unidades} users={users} />
}
