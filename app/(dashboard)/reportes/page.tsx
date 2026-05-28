import type { Metadata } from 'next'
import { getGastosComunes, getPagos, getSolicitudes, getUnidades, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import ReportesView from './ReportesView'

export const metadata: Metadata = { title: 'Reportes' }

export default async function ReportesPage() {
  const edificioId = await getEdificioActual()
  const [gastos, pagos, solicitudes, unidades, edificio] = await Promise.all([
    getGastosComunes(edificioId),
    getPagos(edificioId),
    getSolicitudes(edificioId),
    getUnidades(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <ReportesView
      gastos={gastos}
      pagos={pagos}
      solicitudes={solicitudes}
      unidades={unidades}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
    />
  )
}
