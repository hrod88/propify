import type { Metadata } from 'next'
import MiUnidadView from './MiUnidadView'

export const metadata: Metadata = {
  title: 'Mi Unidad',
}

export default function MiUnidadPage() {
  return <MiUnidadView />
}
