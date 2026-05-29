import { getAmenidades } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import AmenidadesView from './AmenidadesView'

export const dynamic = 'force-dynamic'

export default async function AmenidadesPage() {
  const edificioId = await getEdificioActual()
  const amenidades = await getAmenidades(edificioId)
  return <AmenidadesView amenidades={amenidades} />
}
