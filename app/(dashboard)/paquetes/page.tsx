import type { Metadata } from 'next'
import { mockPaquetes, mockUnidades, mockUsers } from '@/lib/mock-data'
import PaquetesView from './PaquetesView'

export const metadata: Metadata = { title: 'Paquetes' }

export default function PaquetesPage() {
  return (
    <PaquetesView
      paquetes={mockPaquetes}
      unidades={mockUnidades}
      users={mockUsers}
    />
  )
}
