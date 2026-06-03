import type { Metadata } from 'next'
import { getUnidades, getEdificioById, getEgresos } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import CalculadoraView from './CalculadoraView'

export const metadata: Metadata = { title: 'Calculadora de Dividendos' }

export default async function CalculadoraPage() {
  const edificioId = await getEdificioActual()
  const [unidades, edificio, egresos] = await Promise.all([
    getUnidades(edificioId),
    getEdificioById(edificioId),
    getEgresos(edificioId),
  ])
  const mesActual = new Date().getMonth()
  const totalEgresosMes = egresos.reduce((sum, e) => {
    const fecha = e.fecha
    if (!fecha) return sum
    const esMes = new Date(fecha).getMonth() === mesActual
    return esMes ? sum + (e.monto ?? 0) : sum
  }, 0)
  return (
    <CalculadoraView
      unidades={unidades}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      totalEgresosMes={totalEgresosMes}
    />
  )
}
