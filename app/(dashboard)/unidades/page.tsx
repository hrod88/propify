import type { Metadata } from 'next'
import { getUnidades, getUsuarios } from '@/lib/db'
import UnidadesView from './UnidadesView'

export const metadata: Metadata = { title: 'Unidades' }

export default async function UnidadesPage() {
  const [unidades, users] = await Promise.all([getUnidades(), getUsuarios()])
  return <UnidadesView unidades={unidades} users={users} />
}
