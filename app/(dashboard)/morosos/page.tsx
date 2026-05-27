import type { Metadata } from 'next'
import { mockGastosComunes, mockUnidades, mockUsers } from '@/lib/mock-data'
import MorosView from './MorosView'

export const metadata: Metadata = { title: 'Morosos' }

export default function MorosPage() {
  const morosos = mockGastosComunes.filter(
    g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial'
  )
  return (
    <MorosView
      morosos={morosos}
      unidades={mockUnidades}
      users={mockUsers}
    />
  )
}
