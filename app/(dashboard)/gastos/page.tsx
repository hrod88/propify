import type { Metadata } from 'next'
import { getGastosComunes, getUnidades, getUsuarios } from '@/lib/db'
import GastosView from './GastosView'

export const metadata: Metadata = { title: 'Gastos Comunes' }

export default async function GastosPage() {
  const [gastos, unidades, users] = await Promise.all([
    getGastosComunes(),
    getUnidades(),
    getUsuarios(),
  ])
  return <GastosView gastos={gastos} unidades={unidades} users={users} />
}
