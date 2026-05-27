import type { Metadata } from 'next'
import { mockGastosComunes, mockUnidades, mockUsers } from '@/lib/mock-data'
import GastosView from './GastosView'

export const metadata: Metadata = { title: 'Gastos Comunes' }

export default function GastosPage() {
  return (
    <GastosView
      gastos={mockGastosComunes}
      unidades={mockUnidades}
      users={mockUsers}
    />
  )
}
