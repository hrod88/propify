import type { Metadata } from 'next'
import { mockPagos, mockUnidades, mockUsers } from '@/lib/mock-data'
import PagosView from './PagosView'

export const metadata: Metadata = { title: 'Pagos' }

export default function PagosPage() {
  return (
    <PagosView
      pagos={mockPagos}
      unidades={mockUnidades}
      users={mockUsers}
    />
  )
}
