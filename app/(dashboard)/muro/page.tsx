import type { Metadata } from 'next'
import { getMuroPosts, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import MuroView from './MuroView'

export const metadata: Metadata = { title: 'Muro Comunitario' }

export default async function MuroPage() {
  const edificioId = await getEdificioActual()
  const [posts, edificio] = await Promise.all([
    getMuroPosts(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <MuroView
      posts={posts}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
