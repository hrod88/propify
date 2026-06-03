import type { Metadata } from 'next'
import { getUsuarios, getEdificioById, getUnidades } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import DirectorioView from './DirectorioView'

export const metadata: Metadata = { title: 'Directorio Vecinal' }

export default async function DirectorioPage() {
  const edificioId = await getEdificioActual()
  const [usuarios, unidades, edificio] = await Promise.all([
    getUsuarios(edificioId),
    getUnidades(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <DirectorioView
      usuarios={usuarios}
      unidades={unidades}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
