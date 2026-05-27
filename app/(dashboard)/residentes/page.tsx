import type { Metadata } from 'next'
import { mockUsers, mockUnidades } from '@/lib/mock-data'
import ResidentesView from './ResidentesView'

export const metadata: Metadata = { title: 'Residentes' }

export default function ResidentesPage() {
  // Solo propietarios y arrendatarios
  const residentes = mockUsers.filter(
    u => u.rol === 'propietario' || u.rol === 'arrendatario'
  )
  return <ResidentesView residentes={residentes} unidades={mockUnidades} />
}
