import type { Metadata } from 'next'
import { getVotaciones, getUnidades, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import VotacionesView from './VotacionesView'

export const metadata: Metadata = { title: 'Votaciones Digitales' }

export default async function VotacionesPage() {
  const edificioId = await getEdificioActual()
  const [votaciones, unidades, edificio] = await Promise.all([
    getVotaciones(edificioId),
    getUnidades(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <VotacionesView
      votaciones={votaciones}
      totalUnidades={unidades.length}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
