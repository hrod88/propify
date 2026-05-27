import type { Metadata } from 'next'
import { mockComunicaciones, mockUsers } from '@/lib/mock-data'
import ComunicacionesView from './ComunicacionesView'

export const metadata: Metadata = { title: 'Comunicaciones' }

export default function ComunicacionesPage() {
  return (
    <ComunicacionesView
      comunicaciones={mockComunicaciones}
      users={mockUsers}
    />
  )
}
