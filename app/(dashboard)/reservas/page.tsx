import type { Metadata } from 'next'
import { getReservas, getEspaciosComunes, getUnidades, getUsuarios } from '@/lib/db'
import ReservasView from './ReservasView'

export const metadata: Metadata = { title: 'Reservas' }

export default async function ReservasPage() {
  const [reservas, espacios, unidades, users] = await Promise.all([
    getReservas(),
    getEspaciosComunes(),
    getUnidades(),
    getUsuarios(),
  ])
  return <ReservasView reservas={reservas} espacios={espacios} unidades={unidades} users={users} />
}
