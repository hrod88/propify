import type { Metadata } from 'next'
import { getComunicaciones, getUsuarios } from '@/lib/db'
import ComunicacionesView from './ComunicacionesView'

export const metadata: Metadata = { title: 'Comunicaciones' }

export default async function ComunicacionesPage() {
  const [comunicaciones, users] = await Promise.all([getComunicaciones(), getUsuarios()])
  return <ComunicacionesView comunicaciones={comunicaciones} users={users} />
}
