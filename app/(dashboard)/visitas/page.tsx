import type { Metadata } from 'next'
import { mockVisitas, mockUnidades, mockUsers } from '@/lib/mock-data'
import VisitasView from './VisitasView'

export const metadata: Metadata = { title: 'Control de Visitas' }

export default function VisitasPage() {
  return (
    <VisitasView
      visitas={mockVisitas}
      unidades={mockUnidades}
      users={mockUsers}
    />
  )
}
