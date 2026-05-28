import type { Metadata } from 'next'
import { getEgresos, getPresupuestos, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import PresupuestoView from './PresupuestoView'

export const metadata: Metadata = { title: 'Presupuesto Anual' }

export default async function PresupuestoPage() {
  const edificioId = await getEdificioActual()
  const [egresos, presupuestos, edificio] = await Promise.all([
    getEgresos(edificioId),
    getPresupuestos(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <PresupuestoView
      egresos={egresos}
      presupuestos={presupuestos}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
