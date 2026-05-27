import type { Metadata } from 'next'
import { getEdificios, getUsuarios, getUnidades } from '@/lib/db'
import ConfiguracionView from './ConfiguracionView'

export const metadata: Metadata = { title: 'Configuración' }

export default async function ConfiguracionPage() {
  const [edificios, users, unidades] = await Promise.all([
    getEdificios(),
    getUsuarios(),
    getUnidades(),
  ])
  return (
    <ConfiguracionView
      edificio={edificios[0] ?? null}
      users={users}
      unidades={unidades}
    />
  )
}
