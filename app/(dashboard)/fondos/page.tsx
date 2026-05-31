import type { Metadata } from 'next'
import { getFondos, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import FondosView from './FondosView'

export const metadata: Metadata = { title: 'Fondos Comunidad' }

export default async function FondosPage() {
  const edificioId = await getEdificioActual()
  const [fondos, edificio] = await Promise.all([
    getFondos(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <FondosView
      fondos={fondos}
      edificioId={edificioId}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
    />
  )
}
