import type { Metadata } from 'next'
import { getGastosComunes, getPagos, getSolicitudes, getUnidades } from '@/lib/db'
import ReportesView from './ReportesView'

export const metadata: Metadata = { title: 'Reportes' }

export default async function ReportesPage() {
  const [gastos, pagos, solicitudes, unidades] = await Promise.all([
    getGastosComunes(),
    getPagos(),
    getSolicitudes(),
    getUnidades(),
  ])
  return <ReportesView gastos={gastos} pagos={pagos} solicitudes={solicitudes} unidades={unidades} />
}
