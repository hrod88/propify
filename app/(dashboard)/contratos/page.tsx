import type { Metadata } from 'next'
import {
  getContratos,
  getUsuarios,
  getUnidades,
  getEdificioById,
} from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ContratosView from './ContratosView'

export const metadata: Metadata = { title: 'Contratos' }

export default async function ContratosPage() {
  const edificioId = await getEdificioActual()
  const [contratos, usuarios, unidades, edificio] = await Promise.all([
    getContratos(edificioId),
    getUsuarios(edificioId),
    getUnidades(edificioId),
    getEdificioById(edificioId),
  ])

  return (
    <ContratosView
      contratos={contratos}
      usuarios={usuarios}
      unidades={unidades}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
