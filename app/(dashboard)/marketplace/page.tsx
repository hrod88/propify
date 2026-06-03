import type { Metadata } from 'next'
import { getMarketplaceItems, getEdificioById } from '@/lib/db'
import { getEdificioActual } from '@/lib/auth-helpers'
import MarketplaceView from './MarketplaceView'

export const metadata: Metadata = { title: 'Marketplace Vecinal' }

export default async function MarketplacePage() {
  const edificioId = await getEdificioActual()
  const [items, edificio] = await Promise.all([
    getMarketplaceItems(edificioId),
    getEdificioById(edificioId),
  ])
  return (
    <MarketplaceView
      items={items}
      edificioNombre={edificio?.nombre ?? 'Edificio'}
      edificioId={edificioId}
    />
  )
}
