import type { Metadata } from 'next'
import { getGastosComunes, getUnidades, getUsuarios } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import GastosView from './GastosView'

export const metadata: Metadata = { title: 'Gastos Comunes' }

export default async function GastosPage() {
  const edificioId = await getEdificioActual()
  const [gastos, unidades, users] = await Promise.all([
    getGastosComunes(edificioId),
    getUnidades(edificioId),
    getUsuarios(edificioId),
  ])
  return <GastosView gastos={gastos} unidades={unidades} users={users} edificioId={edificioId} />
}
