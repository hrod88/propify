'use client'

import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

// ─── Props ────────────────────────────────────────────────────
interface Props {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  subtitulo?: string
  children: React.ReactNode
  ancho?: 'sm' | 'md' | 'lg'
  colorAccento?: string
}

// ─── Componente ───────────────────────────────────────────────
export default function Modal({
  abierto,
  onCerrar,
  titulo,
  subtitulo,
  children,
  ancho = 'md',
  colorAccento = '#2563ae',
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  // ESC para cerrar
  useEffect(() => {
    if (!abierto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [abierto, onCerrar])

  // Click-outside para cerrar (con delay para no capturar el click que abrió el modal)
  useEffect(() => {
    if (!abierto) return
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onCerrar()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', onClick), 100)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onClick) }
  }, [abierto, onCerrar])

  if (!abierto) return null

  const maxW = ancho === 'sm' ? 440 : ancho === 'lg' ? 720 : 560

  return (
    <>
      <style>{`
        @keyframes modal-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-panel-in {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      {/* Fondo */}
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{
          background: 'rgba(15, 35, 65, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'modal-backdrop-in 0.15s ease',
        }}
      >
        {/* Panel */}
        <div
          ref={panelRef}
          className="relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{
            maxWidth: maxW,
            animation: 'modal-panel-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Barra de acento superior */}
          <div className="h-1 w-full" style={{ background: colorAccento }} />

          {/* Encabezado */}
          <div className="flex items-start justify-between px-6 pt-5 pb-1">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
              {subtitulo && (
                <p className="text-sm text-gray-500 mt-0.5">{subtitulo}</p>
              )}
            </div>
            <button
              onClick={onCerrar}
              className="ml-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cuerpo (scrollable) */}
          <div
            className="px-6 pt-4 pb-6 overflow-y-auto"
            style={{ maxHeight: 'calc(90vh - 100px)' }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
