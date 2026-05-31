'use client'

/**
 * EnviarEmailButton — Envía la liquidación por email al residente.
 * Llama a POST /api/enviar-liquidacion/[id] que genera el PDF y
 * lo envía via Resend con el PDF como adjunto.
 */
import { useState } from 'react'
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useNotificaciones } from '@/context/notificaciones-context'

interface Props {
  gastoId:          string
  residenteEmail?:  string
  residenteNombre?: string
  unidadNumero:     string
}

type Estado = 'idle' | 'sending' | 'ok' | 'error'

export default function EnviarEmailButton({
  gastoId, residenteEmail, residenteNombre, unidadNumero,
}: Props) {
  const { agregarNotificacion } = useNotificaciones()
  const [estado, setEstado]     = useState<Estado>('idle')
  const [errMsg, setErrMsg]     = useState('')

  const hasEmail = !!residenteEmail

  const handleEnviar = async () => {
    if (!hasEmail || estado === 'sending' || estado === 'ok') return
    setEstado('sending')
    setErrMsg('')

    try {
      const res = await fetch(`/api/enviar-liquidacion/${gastoId}`, { method: 'POST' })
      const json = await res.json() as { ok?: boolean; error?: string; to?: string }

      if (!res.ok || !json.ok) {
        setEstado('error')
        setErrMsg(json.error ?? 'Error al enviar')
        return
      }

      setEstado('ok')
      agregarNotificacion(
        'circular',
        'Email enviado',
        `Liquidación enviada a ${json.to ?? residenteEmail} · Unidad ${unidadNumero}`,
      )

      // Reset tras 6 segundos para poder reenviar
      setTimeout(() => setEstado('idle'), 6000)
    } catch {
      setEstado('error')
      setErrMsg('No se pudo conectar con el servidor')
    }
  }

  // ── Estados visuales ──────────────────────────────────────
  if (estado === 'ok') {
    return (
      <button
        disabled
        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac' }}
      >
        <CheckCircle className="w-4 h-4" />
        Email enviado a {residenteEmail}
      </button>
    )
  }

  if (estado === 'error') {
    return (
      <div className="space-y-1.5">
        <button
          onClick={handleEnviar}
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
        >
          <AlertCircle className="w-4 h-4" />
          Error — click para reintentar
        </button>
        {errMsg && (
          <p className="text-xs text-red-500 text-center">{errMsg}</p>
        )}
      </div>
    )
  }

  if (!hasEmail) {
    return (
      <button
        disabled
        title="El residente no tiene email registrado"
        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
        style={{ background: '#f1f5f9', color: '#1e3a5f' }}
      >
        <Mail className="w-4 h-4" />
        Sin email registrado
      </button>
    )
  }

  return (
    <button
      onClick={handleEnviar}
      disabled={estado === 'sending'}
      className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
      style={{ background: '#f1f5f9', color: '#1e3a5f' }}
    >
      {estado === 'sending' ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
          Enviando a {residenteEmail}…
        </>
      ) : (
        <>
          <Send className="w-4 h-4" />
          Enviar liquidación por email
          {residenteNombre && (
            <span className="text-xs opacity-60 font-normal">
              ({residenteNombre.split(' ')[0]})
            </span>
          )}
        </>
      )}
    </button>
  )
}
