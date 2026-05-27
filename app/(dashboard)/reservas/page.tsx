import type { Metadata } from 'next'
import { mockEspacios, mockReservas, mockUnidades, mockUsers } from '@/lib/mock-data'
import ReservasView from './ReservasView'

export const metadata: Metadata = { title: 'Reservas' }

export default function ReservasPage() {
  return (
    <ReservasView
      espacios={mockEspacios}
      reservas={mockReservas}
      unidades={mockUnidades}
      users={mockUsers}
    />
  )
}
