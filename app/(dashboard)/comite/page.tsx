import type { Metadata } from 'next'
import { getComiteMiembros, getComiteDocumentos, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ComiteView from './ComiteView'

export const metadata: Metadata = { title: 'Panel de Comité' }

export default async function ComitePage() {
  const edificioId = await getEdificioActual()
  const [miembros, documentos, edificio] = await Promise.all([
    getComiteMiembros(edificioId),
    getComiteDocumentos(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <ComiteView
      miembros={miembros}
      documentos={documentos}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
