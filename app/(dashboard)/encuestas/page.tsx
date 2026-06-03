import type { Metadata } from 'next'
import { getEncuestas, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import EncuestasView from './EncuestasView'

export const metadata: Metadata = { title: 'Encuestas' }

export default async function EncuestasPage() {
  const edificioId = await getEdificioActual()
  const [encuestas, edificio] = await Promise.all([
    getEncuestas(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <EncuestasView
      encuestas={encuestas}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
