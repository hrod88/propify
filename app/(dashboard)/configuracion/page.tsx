import type { Metadata } from 'next'
import { getEdificios, getUsuarios, getUnidades } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ConfiguracionView from './ConfiguracionView'

export const metadata: Metadata = { title: 'Configuración' }

export default async function ConfiguracionPage() {
  const edificioId = await getEdificioActual()
  const [edificios, users, unidades] = await Promise.all([
    getEdificios(edificioId),
    getUsuarios(edificioId),
    getUnidades(edificioId),
  ])
  return (
    <ConfiguracionView
      edificio={edificios[0] ?? null}
      users={users}
      unidades={unidades}
    />
  )
}
