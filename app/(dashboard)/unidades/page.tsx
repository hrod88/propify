import type { Metadata } from 'next'
import { getUnidades, getUsuarios } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import UnidadesView from './UnidadesView'

export const metadata: Metadata = { title: 'Unidades' }

export default async function UnidadesPage() {
  const edificioId = await getEdificioActual()
  const [unidades, users] = await Promise.all([
    getUnidades(edificioId),
    getUsuarios(edificioId),
  ])
  return <UnidadesView unidades={unidades} users={users} />
}
