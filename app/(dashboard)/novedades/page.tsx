import type { Metadata } from 'next'
import { getNovedades, getUsuarios, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import NovedadesView from './NovedadesView'

export const metadata: Metadata = { title: 'Libro de Novedades' }

export default async function NovedadesPage() {
  const edificioId = await getEdificioActual()
  const [novedades, usuarios, edificio] = await Promise.all([
    getNovedades(edificioId),
    getUsuarios(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <NovedadesView
      novedades={novedades}
      usuarios={usuarios}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
