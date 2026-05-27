import type { Metadata } from 'next'
import { mockSolicitudes, mockUnidades, mockUsers } from '@/lib/mock-data'
import MantencionesView from './MantencionesView'

export const metadata: Metadata = { title: 'Mantenciones' }

export default function MantencionesPage() {
  return (
    <MantencionesView
      solicitudes={mockSolicitudes}
      unidades={mockUnidades}
      users={mockUsers}
    />
  )
}
