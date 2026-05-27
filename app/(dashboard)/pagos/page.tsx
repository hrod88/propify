import type { Metadata } from 'next'
import { getPagos, getUnidades, getUsuarios } from '@/lib/db'
import PagosView from './PagosView'

export const metadata: Metadata = { title: 'Pagos' }

export default async function PagosPage() {
  const [pagos, unidades, users] = await Promise.all([
    getPagos(),
    getUnidades(),
    getUsuarios(),
  ])
  return <PagosView pagos={pagos} unidades={unidades} users={users} />
}
