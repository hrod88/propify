'use client'

/**
 * RegistrarPagoButton — Modal para registrar un pago de gasto común.
 * Inserta en `pagos` y actualiza `gastos_comunes.estadoPago + fechaPago`.
 * Llama router.refresh() para recargar los datos del Server Component padre.
 */

import { useState }            from 'react'
import { useRouter }           from 'next/navigation'
import { X, Check, CreditCard } from 'lucide-react'
import { supabaseBrowser }     from '@/lib/supabase-browser'
import { useNotificaciones }   from '@/context/notificaciones-context'
import type { MetodoPago, EstadoPago } from '@/types'

// ─── Props ────────────────────────────────────────────────────
interface Props {
  gastoId:         string
  montoTotal:      number
  unidadNumero:    string
  mesNombre:       string
  año:             number
  mes:             number
  edificioId:      string
  unidadId:        string
  registradoPorId: string
}

// ─── Constantes ───────────────────────────────────────────────
const METODOS: { value: MetodoPago; label: string; emoji: string }[] = [
  { value: 'transferencia', label: 'Transferencia bancaria', emoji: '🏦' },
  { value: 'efectivo',      label: 'Efectivo',              emoji: '💵' },
  { value: 'webpay',        label: 'WebPay',                emoji: '💳' },
  { value: 'tarjeta',       label: 'Débito / Crédito',      emoji: '💳' },
  { value: 'cheque',        label: 'Cheque',                emoji: '📄' },
]

function fmtCLP(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(n)
}

// ─── Componente ───────────────────────────────────────────────
export default function RegistrarPagoButton({
  gastoId, montoTotal, unidadNumero, mesNombre, año, mes,
  edificioId, unidadId, registradoPorId,
}: Props) {
  const router = useRouter()
  const { agregarNotificacion } = useNotificaciones()

  const [open,      setOpen]      = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error,     setError]     = useState('')

  const hoyISO = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    monto:  montoTotal,
    metodo: 'transferencia' as MetodoPago,
    fecha:  hoyISO,
    nota:   '',
  })

  const esParcial   = form.monto > 0 && form.monto < montoTotal
  const estadoNuevo: EstadoPago = esParcial ? 'parcial' : 'pagado'

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (form.monto < 1) {
      setError('Ingresa un monto válido')
      return
    }
    if (form.monto > montoTotal) {
      setError(`El monto no puede superar ${fmtCLP(montoTotal)}`)
      return
    }
    setError('')
    setGuardando(true)

    const fechaDate = new Date(form.fecha + 'T12:00:00')
    const mesAno    = fechaDate.getMonth() + 1
    const anoAno    = fechaDate.getFullYear()

    // Insertar en pagos
    const { error: errPago } = await supabaseBrowser.from('pagos').insert({
      id:              crypto.randomUUID(),
      gastoId,
      unidadId,
      edificioId,
      monto:           form.monto,
      mes:             mesAno,
      año:             anoAno,
      metodo:          form.metodo,
      estado:          'completado',
      registradoPorId: registradoPorId || edificioId,
      nota:            form.nota || null,
      creadoEn:        new Date().toISOString(),
    })

    if (errPago) {
      console.warn('[RegistrarPago] Error pagos:', errPago.message)
    }

    // Actualizar gasto común
    const { error: errGasto } = await supabaseBrowser
      .from('gastos_comunes')
      .update({
        estadoPago: estadoNuevo,
        fechaPago:  form.fecha,
        diasMora:   0,
      })
      .eq('id', gastoId)

    if (errGasto) {
      console.warn('[RegistrarPago] Error gasto:', errGasto.message)
    }

    agregarNotificacion(
      'pago',
      'Pago registrado',
      `Unidad ${unidadNumero} · ${fmtCLP(form.monto)} · ${METODOS.find(m => m.value === form.metodo)?.label}`,
    )

    setGuardando(false)
    setOpen(false)
    router.refresh()
  }

  // ── JSX ────────────────────────────────────────────────────
  return (
    <>
      {/* Botón disparador */}
      <button
        onClick={() => {
          setForm({ monto: montoTotal, metodo: 'transferencia', fecha: hoyISO, nota: '' })
          setError('')
          setOpen(true)
        }}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        style={{ background: '#2563ae' }}
      >
        <CreditCard className="w-4 h-4" />
        Registrar pago
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            style={{ border: '1px solid #e2e8f0' }}
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Registrar pago</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Unidad {unidadNumero} · {mesNombre} {año}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">

              {/* Fecha */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Fecha de pago
                </label>
                <input
                  type="date"
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  style={{ borderColor: '#e2e8f0' }}
                  value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                />
              </div>

              {/* Método */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Método de pago
                </label>
                <select
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  style={{ borderColor: '#e2e8f0' }}
                  value={form.metodo}
                  onChange={e => setForm(f => ({ ...f, metodo: e.target.value as MetodoPago }))}
                >
                  {METODOS.map(m => (
                    <option key={m.value} value={m.value}>
                      {m.emoji} {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Monto pagado (CLP)
                </label>
                <input
                  type="number"
                  min={1}
                  max={montoTotal}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  style={{ borderColor: error ? '#dc2626' : '#e2e8f0' }}
                  value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) }))}
                />
                {error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
                {esParcial && !error && (
                  <p className="text-xs mt-1" style={{ color: '#9333ea' }}>
                    ⚠️ Pago parcial — quedan {fmtCLP(montoTotal - form.monto)} por cobrar
                  </p>
                )}
              </div>

              {/* Nota */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Nota / Comprobante <span className="font-normal text-gray-300">(opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Transferencia #000123"
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  style={{ borderColor: '#e2e8f0' }}
                  value={form.nota}
                  onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
                />
              </div>

              {/* Preview del nuevo estado */}
              <div
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: esParcial ? '#f3e8ff' : '#dcfce7' }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: esParcial ? '#9333ea' : '#16a34a' }}
                >
                  El gasto quedará como
                </span>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: esParcial ? '#e9d5ff' : '#bbf7d0',
                    color:      esParcial ? '#7c3aed' : '#15803d',
                  }}
                >
                  {esParcial ? 'Pago parcial' : '✓ Pagado'}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#e2e8f0' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={guardando}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#2563ae' }}
              >
                {guardando ? (
                  'Guardando…'
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Confirmar pago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
