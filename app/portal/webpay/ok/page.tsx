/**
 * /portal/webpay/ok
 * Página de éxito genérica (fallback si no se recupera el gastoId).
 * El flujo normal redirige a /portal/pagar/[id]?webpay=ok en su lugar.
 */
import Link from 'next/link'

export const metadata = { title: 'Pago exitoso — Propify' }

export default function WebpayOkPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-6">

        {/* Ícono éxito */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
               style={{ background: '#f0fdf4' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#dcfce7"/>
              <path d="M12 20l6 6 10-12" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">¡Pago exitoso!</h1>
          <p className="text-gray-500">
            Tu pago fue procesado correctamente por Transbank.
          </p>
        </div>

        <div className="rounded-xl p-4 text-sm text-green-800" style={{ background: '#f0fdf4' }}>
          Recibirás un comprobante por email en breve.
        </div>

        <Link
          href="/"
          className="inline-block w-full py-3 rounded-xl font-semibold text-white text-center"
          style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)' }}
        >
          Volver al inicio
        </Link>

      </div>
    </main>
  )
}
