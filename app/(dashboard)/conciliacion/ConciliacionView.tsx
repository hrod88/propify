'use client'

/**
 * ConciliacionView.tsx — Conciliación Bancaria
 * Tab A: Importar CSV del banco → matchear con gastos comunes.
 * Tab B: Conectar con Fintoc API (automático, próximamente).
 */

import { useState, useRef, useMemo } from 'react'
import {
  Upload, Link2, CheckCircle2, AlertCircle, RefreshCw,
  X, DollarSign, Calendar, FileText, Zap, Shield,
  Search, Download, TrendingUp, Info,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCLP } from '@/lib/format'
import type { ConciliacionMovimiento, GastoComun } from '@/types'

// ─── Parsers CSV bancarios ────────────────────────────────────
interface MovimientoCSV { fecha: string; descripcion: string; monto: number; tipo: 'abono' | 'cargo' }

function parsearCSVBancoEstado(text: string): MovimientoCSV[] {
  const rows: MovimientoCSV[] = []
  const lines = text.split('\n').slice(1)
  for (const line of lines) {
    const cols = line.split(';')
    if (cols.length < 4) continue
    const fecha = cols[0]?.trim()
    const desc  = cols[1]?.trim()
    const cargo = parseFloat((cols[2] ?? '0').replace(/[$.]/g,'').replace(',','.'))
    const abono = parseFloat((cols[3] ?? '0').replace(/[$.]/g,'').replace(',','.'))
    if (!fecha || (!cargo && !abono)) continue
    rows.push({ fecha, descripcion: desc ?? '', monto: abono || cargo, tipo: abono ? 'abono' : 'cargo' })
  }
  return rows
}

function parsearCSVGenerico(text: string): MovimientoCSV[] {
  const rows: MovimientoCSV[] = []
  const lines = text.split('\n').slice(1)
  for (const line of lines) {
    const cols = line.split(',').map(c => c.trim().replace(/"/g,''))
    if (cols.length < 3) continue
    const fecha  = cols[0]
    const desc   = cols[1] ?? ''
    const monto  = parseFloat((cols[2] ?? '0').replace(/[$.]/g,'').replace(',','.'))
    if (!fecha || !monto) continue
    rows.push({ fecha, descripcion: desc, monto: Math.abs(monto), tipo: monto > 0 ? 'abono' : 'cargo' })
  }
  return rows
}

// ─── Auto-match por monto+unidad ─────────────────────────────
function autoMatch(movs: MovimientoCSV[], gastos: GastoComun[]): Array<MovimientoCSV & { gastoId?: string }> {
  return movs.map(m => {
    if (m.tipo !== 'abono') return m
    const g = gastos.find(g => g.montoTotal === m.monto && g.estadoPago !== 'pagado')
    return g ? { ...m, gastoId: g.id } : m
  })
}

interface Props {
  movimientos:    ConciliacionMovimiento[]
  gastos:         GastoComun[]
  edificioNombre: string
  edificioId:     string
}

export default function ConciliacionView({ movimientos: init, gastos, edificioNombre, edificioId }: Props) {
  const [tab, setTab]             = useState<'csv' | 'fintoc'>('csv')
  const [movimientos, setMovs]    = useState<ConciliacionMovimiento[]>(init)
  const [importando, setImportando] = useState(false)
  const [preview, setPreview]     = useState<Array<MovimientoCSV & { gastoId?: string }>>([])
  const [bancoFmt, setBancoFmt]   = useState<'banco_estado' | 'generico'>('banco_estado')
  const [filtro, setFiltro]       = useState<'todos' | 'sin_match' | 'matcheado' | 'ignorado'>('todos')
  const [search, setSearch]       = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const filtrados = useMemo(() =>
    movimientos.filter(m => {
      const matchF = filtro === 'todos' || m.estado === filtro
      const matchS = (m.descripcion ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (m.referencia ?? '').toLowerCase().includes(search.toLowerCase())
      return matchF && matchS
    })
  , [movimientos, filtro, search])

  const stats = {
    total:     movimientos.length,
    matcheado: movimientos.filter(m => m.estado === 'matcheado').length,
    sinMatch:  movimientos.filter(m => m.estado === 'sin_match').length,
    montoMatch: movimientos.filter(m => m.estado === 'matcheado').reduce((s, m) => s + m.monto, 0),
  }

  // ── Cargar archivo CSV ──
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const raw  = bancoFmt === 'banco_estado' ? parsearCSVBancoEstado(text) : parsearCSVGenerico(text)
      setPreview(autoMatch(raw, gastos))
    }
    reader.readAsText(file, 'latin1')
  }

  async function importarMovimientos() {
    if (preview.length === 0) return
    setImportando(true)
    const payload = preview.map(m => ({
      edificioId, fecha: m.fecha, descripcion: m.descripcion,
      monto: m.monto, tipo: m.tipo, fuente: 'csv' as const,
      gastoId:  m.gastoId ?? null,
      estado:   m.gastoId ? 'matcheado' as const : 'sin_match' as const,
    }))
    const { data } = await supabase.from('conciliacion_movimientos').insert(payload).select()
    if (data) {
      setMovs(prev => [...(data as ConciliacionMovimiento[]), ...prev])
      // Marcar como pagado los gastos matcheados
      const gastoIds = payload.filter(p => p.gastoId).map(p => p.gastoId!)
      if (gastoIds.length > 0) {
        await supabase.from('gastos_comunes').update({ estadoPago: 'pagado' }).in('id', gastoIds)
      }
    }
    setPreview([]); setImportando(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function marcarIgnorado(id: string) {
    await supabase.from('conciliacion_movimientos').update({ estado: 'ignorado' }).eq('id', id)
    setMovs(p => p.map(m => m.id === id ? { ...m, estado: 'ignorado' } : m))
  }

  async function matchearManual(movId: string, gastoId: string) {
    await supabase.from('conciliacion_movimientos').update({ estado: 'matcheado', gastoId }).eq('id', movId)
    await supabase.from('gastos_comunes').update({ estadoPago: 'pagado' }).eq('id', gastoId)
    setMovs(p => p.map(m => m.id === movId ? { ...m, estado: 'matcheado', gastoId } : m))
  }

  const estadoColor: Record<string, string> = {
    matcheado: '#16a34a', sin_match: '#d97706', ignorado: '#64748b',
  }
  const estadoBg: Record<string, string> = {
    matcheado: '#dcfce7', sin_match: '#fef3c7', ignorado: '#f1f5f9',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conciliación Bancaria</h1>
        <p className="text-gray-500 text-sm mt-0.5">{edificioNombre} · Cruza pagos del banco con gastos comunes</p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Importados',   val: stats.total,                    color: '#1e3a5f' },
          { label: 'Matcheados',   val: stats.matcheado,                color: '#16a34a' },
          { label: 'Sin match',    val: stats.sinMatch,                  color: '#d97706' },
          { label: 'Conciliado',   val: formatCLP(stats.montoMatch),     color: '#7c3aed' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('csv')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'csv' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Upload className="w-4 h-4" /> Importar CSV
        </button>
        <button onClick={() => setTab('fintoc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'fintoc' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Zap className="w-4 h-4" /> Fintoc API
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Próximamente</span>
        </button>
      </div>

      {/* ── Tab CSV ── */}
      {tab === 'csv' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" /> Importar movimientos bancarios
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Formato del banco</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['banco_estado', 'Banco Estado', 'Separado por ; (punto y coma)'],
                    ['generico',     'Genérico CSV',  'Separado por , (coma) — Santander, BCI, etc.'],
                  ] as const).map(([val, label, desc]) => (
                    <button key={val} type="button" onClick={() => setBancoFmt(val)}
                      className={`text-left p-3 rounded-xl border transition-colors ${
                        bancoFmt === val ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <p className="font-medium text-sm text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <label className="block text-sm font-medium text-gray-700 mb-2">Archivo CSV</label>
                <button onClick={() => fileRef.current?.click()}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex flex-col items-center gap-2">
                  <Upload className="w-5 h-5" />
                  <span>Seleccionar archivo</span>
                </button>
                <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
              </div>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    {preview.length} movimientos detectados ·
                    <span className="text-green-600 ml-1">{preview.filter(p => p.gastoId).length} matcheados automáticamente</span>
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => { setPreview([]); if (fileRef.current) fileRef.current.value = '' }}
                      className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                      Cancelar
                    </button>
                    <button onClick={importarMovimientos} disabled={importando}
                      className="px-4 py-1.5 text-xs rounded-lg text-white font-medium disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
                      {importando ? 'Importando...' : `Importar ${preview.length} movimientos`}
                    </button>
                  </div>
                </div>
                <div className="overflow-auto max-h-64 rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {['Fecha','Descripción','Monto','Tipo','Match'].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.map((m, i) => (
                        <tr key={i} className={m.gastoId ? 'bg-green-50' : 'hover:bg-gray-50'}>
                          <td className="px-3 py-2 text-gray-600">{m.fecha}</td>
                          <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{m.descripcion}</td>
                          <td className="px-3 py-2 font-semibold text-gray-900">{formatCLP(m.monto)}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${m.tipo === 'abono' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {m.tipo}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {m.gastoId
                              ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />Auto</span>
                              : <span className="text-gray-400">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Instrucciones */}
            <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Banco Estado:</strong> Menú → Movimientos → Exportar CSV (separador punto y coma)</p>
                <p><strong>BCI / Santander / Scotiabank:</strong> Cartola → Descargar → CSV (separador coma)</p>
                <p>El sistema matchea automáticamente abonos que coincidan exactamente con un gasto común pendiente.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Fintoc ── */}
      {tab === 'fintoc' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Integración con Fintoc</h2>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Conecta la cuenta bancaria del edificio directamente. Fintoc sincroniza los movimientos
            automáticamente cada día, sin necesidad de subir archivos.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            {[
              { icon: RefreshCw, label: 'Sincronización automática diaria' },
              { icon: Shield,    label: 'Datos bancarios encriptados' },
              { icon: Link2,     label: 'Compatible con todos los bancos chilenos' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs text-gray-600 text-center">{label}</p>
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl text-amber-700 text-sm font-medium border border-amber-200">
            <Zap className="w-4 h-4" /> Disponible en próxima versión — cuando Propify tenga clientes activos
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Mientras tanto, usa la importación CSV — funciona con todos los bancos ahora mismo.
          </p>
        </div>
      )}

      {/* ── Historial de movimientos ── */}
      {movimientos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Historial importado</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </div>
              {(['todos','sin_match','matcheado','ignorado'] as const).map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filtro === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {f === 'todos' ? 'Todos' : f === 'sin_match' ? 'Sin match' : f === 'matcheado' ? 'Matcheado' : 'Ignorado'}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {['Fecha','Descripción','Monto','Tipo','Estado',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(m.fecha).toLocaleDateString('es-CL')}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{m.descripcion ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCLP(m.monto)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.tipo === 'abono' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: estadoBg[m.estado] ?? '#f1f5f9', color: estadoColor[m.estado] ?? '#64748b' }}>
                        {m.estado === 'matcheado' && <CheckCircle2 className="w-3 h-3" />}
                        {m.estado === 'sin_match' && <AlertCircle className="w-3 h-3" />}
                        {m.estado === 'matcheado' ? 'Matcheado' : m.estado === 'sin_match' ? 'Sin match' : 'Ignorado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.estado === 'sin_match' && m.tipo === 'abono' && (
                        <div className="flex items-center gap-2">
                          <select onChange={e => { if (e.target.value) matchearManual(m.id, e.target.value) }}
                            defaultValue=""
                            className="text-xs px-2 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-300">
                            <option value="">Vincular gasto...</option>
                            {gastos.filter(g => g.estadoPago !== 'pagado').map(g => (
                              <option key={g.id} value={g.id}>Gasto {g.mes}/{g.año} — {formatCLP(g.montoTotal)}</option>
                            ))}
                          </select>
                          <button onClick={() => marcarIgnorado(m.id)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors" title="Ignorar">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
