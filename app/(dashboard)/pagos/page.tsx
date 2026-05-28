import type { Metadata } from 'next'
import { getPagos, getUnidades, getUsuarios } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import PagosView from './PagosView'

export const metadata: Metadata = { title: 'Pagos' }

export default async function PagosPage() {
  const edificioId = await getEdificioActual()
  const [pagos, unidades, users] = await Promise.all([
    getPagos(edificioId),
    getUnidades(edificioId),
    getUsuarios(edificioId),
  ])
  return <PagosView pagos={pagos} unidades={unidades} users={users} />
}
