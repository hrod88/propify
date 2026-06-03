import type { Metadata } from 'next'
import { getEdificioActual } from '@/lib/auth-helpers'
import { getEdificioById }   from '@/lib/db'
import AyudaView             from './AyudaView'

export const metadata: Metadata = { title: 'Centro de Ayuda' }

export default async function AyudaPage() {
  const edificioId = await getEdificioActual()
  const edificio   = await getEdificioById(edificioId)
  return <AyudaView edificioNombre={edificio?.nombre ?? 'Edificio'} />
}
