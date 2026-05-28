import type { Metadata } from 'next'
import { getReservas, getEspaciosComunes, getUnidades, getUsuarios } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ReservasView from './ReservasView'

export const metadata: Metadata = { title: 'Reservas' }

export default async function ReservasPage() {
  const edificioId = await getEdificioActual()
  const [reservas, espacios, unidades, users] = await Promise.all([
    getReservas(edificioId),
    getEspaciosComunes(edificioId),
    getUnidades(edificioId),
    getUsuarios(edificioId),
  ])
  return <ReservasView reservas={reservas} espacios={espacios} unidades={unidades} users={users} />
}
