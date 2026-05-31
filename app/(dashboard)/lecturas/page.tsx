import type { Metadata } from 'next'
import { getLecturas, getUnidades, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import LecturasView from './LecturasView'

export const metadata: Metadata = { title: 'Lecturas de Medidores' }

export default async function LecturasPage() {
  const edificioId = await getEdificioActual()
  const [lecturas, unidades, edificio] = await Promise.all([
    getLecturas(edificioId),
    getUnidades(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <LecturasView
      lecturas={lecturas}
      unidades={unidades}
      edificioId={edificioId}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
    />
  )
}
