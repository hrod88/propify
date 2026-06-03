import type { Metadata } from 'next'
import { getMultas, getReglasMulta, getUnidades, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import MultasView from './MultasView'

export const metadata: Metadata = { title: 'Multas' }

export default async function MultasPage() {
  const edificioId = await getEdificioActual()
  const [multas, reglas, unidades, edificio] = await Promise.all([
    getMultas(edificioId),
    getReglasMulta(edificioId),
    getUnidades(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <MultasView
      multas={multas}
      reglas={reglas}
      unidades={unidades}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
