import type { Metadata } from 'next'
import { getProveedores, getEgresos, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ProveedoresView from './ProveedoresView'

export const metadata: Metadata = { title: 'Proveedores' }

export default async function ProveedoresPage() {
  const edificioId = await getEdificioActual()
  const [proveedores, egresos, edificio] = await Promise.all([
    getProveedores(edificioId),
    getEgresos(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <ProveedoresView
      proveedores={proveedores}
      egresos={egresos}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
