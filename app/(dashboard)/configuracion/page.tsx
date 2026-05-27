import type { Metadata } from 'next'
import { mockEdificios, mockUsers, mockUnidades } from '@/lib/mock-data'
import ConfiguracionView from './ConfiguracionView'

export const metadata: Metadata = { title: 'Configuración' }

export default function ConfiguracionPage() {
  return (
    <ConfiguracionView
      edificio={mockEdificios[0]}
      users={mockUsers}
      unidades={mockUnidades}
    />
  )
}
