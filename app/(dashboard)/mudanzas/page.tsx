import type { Metadata } from 'next'
import { getReservasMudanza, getUnidades, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import MudanzasView from './MudanzasView'

export const metadata: Metadata = { title: 'Reservas de Mudanza' }

export default async function MudanzasPage() {
  const edificioId = await getEdificioActual()
  const [reservas, unidades, edificio] = await Promise.all([
    getReservasMudanza(edificioId),
    getUnidades(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <MudanzasView
      reservas={reservas}
      unidades={unidades}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
