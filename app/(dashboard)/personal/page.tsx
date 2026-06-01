import type { Metadata } from 'next'
import { getPersonal } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import PersonalView from './PersonalView'

export const metadata: Metadata = { title: 'Personal' }

export default async function PersonalPage() {
  const edificioId = await getEdificioActual()
  const personal   = await getPersonal(edificioId)
  return <PersonalView personal={personal} edificioId={edificioId} />
}
