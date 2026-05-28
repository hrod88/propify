import type { Metadata } from 'next'
import { getGastosComunes, getUnidades, getUsuarios } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import MorosView from './MorosView'

export const metadata: Metadata = { title: 'Morosos' }

export default async function MorosPage() {
  const edificioId = await getEdificioActual()
  const [gastosComunes, unidades, users] = await Promise.all([
    getGastosComunes(edificioId),
    getUnidades(edificioId),
    getUsuarios(edificioId),
  ])
  const morosos = gastosComunes.filter(
    g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial'
  )
  return <MorosView morosos={morosos} unidades={unidades} users={users} />
}
