import type { Metadata } from 'next'
import NuevoEdificioView from './NuevoEdificioView'

export const metadata: Metadata = { title: 'Nuevo Edificio — Propify' }

export default function NuevoEdificioPage() {
  return <NuevoEdificioView />
}
