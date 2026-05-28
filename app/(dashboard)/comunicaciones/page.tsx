import type { Metadata } from 'next'
import { getComunicaciones, getUsuarios } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ComunicacionesView from './ComunicacionesView'

export const metadata: Metadata = { title: 'Comunicaciones' }

export default async function ComunicacionesPage() {
  const edificioId = await getEdificioActual()
  const [comunicaciones, users] = await Promise.all([
    getComunicaciones(edificioId),
    getUsuarios(edificioId),
  ])
  return <ComunicacionesView comunicaciones={comunicaciones} users={users} />
}
