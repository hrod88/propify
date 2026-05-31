/**
 * /portal/webpay/error
 * Página de error cuando Transbank rechaza o cancela el pago.
 */
import Link from 'next/link'

export const metadata = { title: 'Pago no completado — Propify' }

const RAZONES: Record<string, string> = {
  cancelled:  'El pago fue cancelado.',
  rejected:   'El pago fue rechazado por Transbank.',
  exception:  'Ocurrió un error al procesar el pago.',
}

export default async function WebpayErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; code?: string }>
}) {
  const sp     = await searchParams
  const reason = sp.reason ?? 'exception'
  const msg    = RAZONES[reason] ?? 'No se pudo completar el pago.'

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-6">

        {/* Ícono error */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
               style={{ background: '#fef2f2' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#fee2e2"/>
              <path d="M13 13l14 14M27 13L13 27" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Pago no completado</h1>
          <p className="text-gray-500">{msg}</p>
          {sp.code && (
            <p className="text-xs text-gray-400">Código de respuesta: {sp.code}</p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-sm text-gray-500">
            Tu dinero <strong>no fue cobrado</strong>. Puedes intentarlo nuevamente.
          </p>
          <Link
            href="/"
            className="inline-block w-full py-3 rounded-xl font-semibold text-white text-center"
            style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)' }}
          >
            Volver al inicio
          </Link>
        </div>

      </div>
    </main>
  )
}
