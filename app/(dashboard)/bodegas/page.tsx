import type { Metadata } from 'next'
import { getBodegas, getUnidades, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import BodegasView from './BodegasView'

export const metadata: Metadata = { title: 'Bodegas' }

export default async function BodegasPage() {
  const edificioId = await getEdificioActual()
  const [bodegas, unidades, edificio] = await Promise.all([
    getBodegas(edificioId),
    getUnidades(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <BodegasView
      bodegas={bodegas}
      unidades={unidades}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
