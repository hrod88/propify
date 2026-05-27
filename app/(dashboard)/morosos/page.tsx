import type { Metadata } from 'next'
import { getGastosComunes, getUnidades, getUsuarios } from '@/lib/db'
import MorosView from './MorosView'

export const metadata: Metadata = { title: 'Morosos' }

export default async function MorosPage() {
  const [gastosComunes, unidades, users] = await Promise.all([
    getGastosComunes(),
    getUnidades(),
    getUsuarios(),
  ])
  const morosos = gastosComunes.filter(
    g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial'
  )
  return <MorosView morosos={morosos} unidades={unidades} users={users} />
}
