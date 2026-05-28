import type { Metadata } from 'next'
import { getPagos, getUnidades, getUsuarios, getGastosComunes, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import PagosView from './PagosView'

export const metadata: Metadata = { title: 'Portal de Pagos' }

export default async function PagosPage() {
  const edificioId = await getEdificioActual()
  const [pagos, unidades, users, gastos, edificio] = await Promise.all([
    getPagos(edificioId),
    getUnidades(edificioId),
    getUsuarios(edificioId),
    getGastosComunes(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <PagosView
      pagos={pagos}
      unidades={unidades}
      users={users}
      gastos={gastos}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
