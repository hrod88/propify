'use client'

/**
 * Botón de pago con WebPay Plus.
 * Llama a /api/webpay/iniciar, recibe {url, token} y hace POST form a Transbank.
 */
import { useState } from 'react'
import { formatCLP } from '@/lib/db'

interface Props {
  gastoId: string
  monto:   number
}

export default function WebPayButton({ gastoId, monto }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handlePagar() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/webpay/iniciar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ gastoId }),
      })
      const data = await res.json() as { url?: string; token?: string; error?: string }

      if (!res.ok || !data.url || !data.token) {
        setError(data.error ?? 'No se pudo iniciar el pago')
        setLoading(false)
        return
      }

      // Crear formulario POST y hacer submit (requerido por Transbank)
      const form  = document.createElement('form')
      form.method = 'POST'
      form.action = data.url
      const input = document.createElement('input')
      input.type  = 'hidden'
      input.name  = 'token_ws'
      input.value = data.token
      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Pago en línea (WebPay)
      </p>
      <button
        onClick={handlePagar}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #e8192c 0%, #c0111f 100%)' }}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Redirigiendo a Transbank…
          </>
        ) : (
          <>
            {/* Logo WebPay simplificado */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="4" fill="white" fillOpacity="0.2"/>
              <text x="11" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">W</text>
            </svg>
            Pagar {formatCLP(monto)} con WebPay
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
      <p className="text-xs text-gray-400 text-center">
        Serás redirigido al portal seguro de Transbank
      </p>
      <div className="flex items-center gap-2 my-1">
        <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
        <span className="text-xs text-gray-400 font-medium">o paga por transferencia</span>
        <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
      </div>
    </div>
  )
}
