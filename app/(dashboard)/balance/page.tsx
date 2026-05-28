import type { Metadata } from 'next'
import { getPagos, getEgresos, getGastosComunes, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import BalanceView from './BalanceView'

export const metadata: Metadata = { title: 'Balance Financiero' }

export default async function BalancePage() {
  const edificioId = await getEdificioActual()
  const [pagos, egresos, gastos, edificio] = await Promise.all([
    getPagos(edificioId),
    getEgresos(edificioId),
    getGastosComunes(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <BalanceView
      pagos={pagos}
      egresos={egresos}
      gastos={gastos}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
    />
  )
}
