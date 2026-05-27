import type { Metadata } from 'next'
import { mockUnidades, mockUsers } from '@/lib/mock-data'
import UnidadesView from './UnidadesView'

export const metadata: Metadata = { title: 'Unidades' }

export default function UnidadesPage() {
  return <UnidadesView unidades={mockUnidades} users={mockUsers} />
}
