import type { Metadata } from 'next'
import { getActas, getUsuarios, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ActasView from './ActasView'

export const metadata: Metadata = { title: 'Actas de Reunión' }

export default async function ActasPage() {
  const edificioId = await getEdificioActual()
  const [actas, usuarios, edificio] = await Promise.all([
    getActas(edificioId),
    getUsuarios(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <ActasView
      actas={actas}
      usuarios={usuarios}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
