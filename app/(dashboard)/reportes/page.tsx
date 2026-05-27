import type { Metadata } from 'next'
import {
  mockGastosComunes,
  mockPagos,
  mockSolicitudes,
  mockUnidades,
} from '@/lib/mock-data'
import ReportesView from './ReportesView'

export const metadata: Metadata = { title: 'Reportes' }

export default function ReportesPage() {
  return (
    <ReportesView
      gastos={mockGastosComunes}
      pagos={mockPagos}
      solicitudes={mockSolicitudes}
      unidades={mockUnidades}
    />
  )
}
