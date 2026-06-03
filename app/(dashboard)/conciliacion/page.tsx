import type { Metadata } from 'next'
import { getConciliacionMovimientos, getGastosComunes, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ConciliacionView from './ConciliacionView'

export const metadata: Metadata = { title: 'Conciliación Bancaria' }

export default async function ConciliacionPage() {
  const edificioId = await getEdificioActual()
  const [movimientos, gastos, edificio] = await Promise.all([
    getConciliacionMovimientos(edificioId),
    getGastosComunes(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <ConciliacionView
      movimientos={movimientos}
      gastos={gastos}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
