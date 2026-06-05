'use client'

/**
 * ActasView.tsx — Fase 33: Actas de Reunión
 * CRUD completo + cambio de estado + export PDF/print.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus, Search, FileText, CheckCircle2, Clock,
  Globe, Printer, Download, Eye, Pencil, Trash2,
  CalendarDays, Users, ChevronRight, BookOpen, PenLine,
} from 'lucide-react'
import Modal from '@/components/modal'
import { supabase } from '@/lib/supabase'
import type { Acta, TipoActa, EstadoActa, User, ActaFirma } from '@/types'

// ─── Configs ──────────────────────────────────────────────────
const tipoCfg: Record<TipoActa, { label: string; bg: string; color: string }> = {
  ordinaria:       { label: 'Ordinaria',     bg: '#dbeafe', color: '#2563ae' },
  extraordinaria:  { label: 'Extraordinaria', bg: '#fef3c7', color: '#d97706' },
  directiva:       { label: 'Directiva',     bg: '#f3e8ff', color: '#7c3aed' },
}

const estadoCfg: Record<EstadoActa, { label: string; bg: string; color: string; Icon: React.ElementType }> = {
  borrador:   { label: 'Borrador',  bg: '#f1f5f9', color: '#64748b', Icon: Clock       },
  aprobada:   { label: 'Aprobada',  bg: '#dcfce7', color: '#16a34a', Icon: CheckCircle2 },
  publicada:  { label: 'Publicada', bg: '#dbeafe', color: '#2563ae', Icon: Globe        },
}

const FORM_VACÍO = {
  titulo:     '',
  fecha:      new Date().toISOString().slice(0, 10),
  tipo:       'ordinaria' as TipoActa,
  quorum:     '',
  acuerdos:   '',
  asistentes: '',
  estado:     'borrador' as EstadoActa,
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  actas:          Acta[]
  usuarios:       User[]
  edificioNombre: string
  edificioId:     string
}

// ─── Componente ───────────────────────────────────────────────
export default function ActasView({ actas: initActas, usuarios, edificioNombre, edificioId }: Props) {
  const [actas,        setActas]        = useState(initActas)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState<'todos' | TipoActa>('todos')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoActa>('todos')

  // Modales
  const [modalForm,    setModalForm]    = useState(false)
  const [modalVer,     setModalVer]     = useState(false)
  const [modalBorrar,  setModalBorrar]  = useState(false)
  const [actaActual,   setActaActual]   = useState<Acta | null>(null)
  const [modoEditar,   setModoEditar]   = useState(false)

  // Formulario
  const [form,   setForm]   = useState(FORM_VACÍO)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // Firmas
  const [modalCanvas,    setModalCanvas]    = useState(false)
  const [firmasActual,   setFirmasActual]   = useState<ActaFirma[]>([])
  const [cargandoFirmas, setCargandoFirmas] = useState(false)
  const [formFirma,      setFormFirma]      = useState({ firmante: '', cargo: '' })
  const [firmando,       setFirmando]       = useState(false)
  const [errorFirma,     setErrorFirma]     = useState('')
  // Canvas
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const dibujandoRef = useRef(false)
  const ultimoPunto  = useRef<{ x: number; y: number } | null>(null)

  // ── Filtrado ──────────────────────────────────────────────
  const filtered = useMemo(() => actas.filter(a => {
    if (filtroTipo   !== 'todos' && a.tipo   !== filtroTipo)   return false
    if (filtroEstado !== 'todos' && a.estado !== filtroEstado) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!a.titulo.toLowerCase().includes(q) && !a.acuerdos?.toLowerCase().includes(q)) return false
    }
    return true
  }), [actas, filtroTipo, filtroEstado, busqueda])

  // ── KPIs ──────────────────────────────────────────────────
  const kpis = {
    total:     actas.length,
    publicadas: actas.filter(a => a.estado === 'publicada').length,
    aprobadas:  actas.filter(a => a.estado === 'aprobada').length,
    borradores: actas.filter(a => a.estado === 'borrador').length,
  }

  // ── Guardar ───────────────────────────────────────────────
  async function handleGuardar() {
    if (!form.titulo || !form.fecha) { setError('Título y fecha son obligatorios'); return }
    setSaving(true); setError('')

    if (modoEditar && actaActual) {
      const updates = {
        titulo:       form.titulo,
        fecha:        form.fecha,
        tipo:         form.tipo,
        quorum:       parseInt(form.quorum) || 0,
        acuerdos:     form.acuerdos,
        asistentes:   form.asistentes,
        estado:       form.estado,
        actualizadoEn: new Date().toISOString(),
      }
      const { error: err } = await supabase.from('actas').update(updates).eq('id', actaActual.id)
      if (err) { setError(err.message); setSaving(false); return }
      setActas(prev => prev.map(a => a.id === actaActual.id ? { ...a, ...updates } : a))
    } else {
      const nuevo: Acta = {
        id:            `acta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        edificioId,
        titulo:        form.titulo,
        fecha:         form.fecha,
        tipo:          form.tipo,
        quorum:        parseInt(form.quorum) || 0,
        acuerdos:      form.acuerdos,
        asistentes:    form.asistentes,
        estado:        form.estado,
        creadoPorId:   null,
        creadoEn:      new Date().toISOString(),
        actualizadoEn: new Date().toISOString(),
      }
      const { error: err } = await supabase.from('actas').insert([nuevo])
      if (err) { setError(err.message); setSaving(false); return }
      setActas(prev => [nuevo, ...prev])
    }

    setSaving(false)
    setModalForm(false)
    setForm(FORM_VACÍO)
  }

  // ── Cambiar estado ────────────────────────────────────────
  async function cambiarEstado(id: string, estado: EstadoActa) {
    const { error } = await supabase.from('actas').update({ estado, actualizadoEn: new Date().toISOString() }).eq('id', id)
    if (error) return
    setActas(prev => prev.map(a => a.id === id ? { ...a, estado } : a))
    if (actaActual?.id === id) setActaActual(a => a ? { ...a, estado } : a)
  }

  // ── Eliminar ──────────────────────────────────────────────
  async function handleEliminar() {
    if (!actaActual) return
    await supabase.from('actas').delete().eq('id', actaActual.id)
    setActas(prev => prev.filter(a => a.id !== actaActual.id))
    setModalBorrar(false)
    setActaActual(null)
  }

  // ── Canvas init ───────────────────────────────────────────
  useEffect(() => {
    if (!modalCanvas) return
    const t = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#1e3a5f'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }, 30)
    return () => clearTimeout(t)
  }, [modalCanvas])

  // ── Canvas drawing ─────────────────────────────────────────
  function getCanvasPos(e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  function iniciarDibujo(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    dibujandoRef.current = true
    ultimoPunto.current  = getCanvasPos(e, canvas)
  }

  function dibujar(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dibujandoRef.current) return
    const canvas = canvasRef.current
    if (!canvas || !ultimoPunto.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(ultimoPunto.current.x, ultimoPunto.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ultimoPunto.current = pos
  }

  function iniciarDibujoTouch(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas || !e.touches[0]) return
    dibujandoRef.current = true
    ultimoPunto.current  = getCanvasPos(e.touches[0], canvas)
  }

  function dibujarTouch(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!dibujandoRef.current || !e.touches[0]) return
    const canvas = canvasRef.current
    if (!canvas || !ultimoPunto.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(e.touches[0], canvas)
    ctx.beginPath()
    ctx.moveTo(ultimoPunto.current.x, ultimoPunto.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    ultimoPunto.current = pos
  }

  function finDibujo() {
    dibujandoRef.current = false
    ultimoPunto.current  = null
  }

  function limpiarCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // ── Firmas CRUD ────────────────────────────────────────────
  async function cargarFirmas(actaId: string) {
    setCargandoFirmas(true)
    const { data } = await supabase
      .from('actas_firmas')
      .select('*')
      .eq('actaId', actaId)
      .order('firmadoEn', { ascending: true })
    setFirmasActual((data as ActaFirma[]) ?? [])
    setCargandoFirmas(false)
  }

  async function guardarFirma() {
    if (!actaActual || !formFirma.firmante.trim()) {
      setErrorFirma('El nombre del firmante es requerido')
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    setFirmando(true)
    setErrorFirma('')
    const nuevaFirma = {
      id:            crypto.randomUUID(),
      actaId:        actaActual.id,
      firmante:      formFirma.firmante.trim(),
      firmanteCargo: formFirma.cargo.trim() || null,
      firmaData:     canvas.toDataURL('image/png'),
      firmadoEn:     new Date().toISOString(),
    }
    const { error: err } = await supabase.from('actas_firmas').insert([nuevaFirma])
    if (err) { setErrorFirma(err.message); setFirmando(false); return }
    setFirmasActual(prev => [...prev, nuevaFirma as ActaFirma])
    setModalCanvas(false)
    setFormFirma({ firmante: '', cargo: '' })
    setFirmando(false)
  }

  async function eliminarFirma(id: string) {
    await supabase.from('actas_firmas').delete().eq('id', id)
    setFirmasActual(prev => prev.filter(f => f.id !== id))
  }

  // ── Imprimir PDF ──────────────────────────────────────────
  function imprimirActa(acta: Acta) {
    const html = `
      <!DOCTYPE html><html><head>
        <meta charset="utf-8" />
        <title>Acta — ${acta.titulo}</title>
        <style>
          body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #1a202c; line-height: 1.6; }
          h1 { font-size: 22px; border-bottom: 2px solid #2563ae; padding-bottom: 8px; }
          h2 { font-size: 15px; color: #2563ae; margin-top: 28px; text-transform: uppercase; letter-spacing: 0.05em; }
          .meta { display: flex; gap: 32px; margin: 16px 0 24px; font-size: 13px; color: #64748b; }
          .meta strong { color: #374151; }
          p { white-space: pre-wrap; }
          .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head><body>
        <h1>${acta.titulo}</h1>
        <div class="meta">
          <span>📅 <strong>Fecha:</strong> ${new Date(acta.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span>🏢 <strong>Tipo:</strong> ${tipoCfg[acta.tipo]?.label ?? acta.tipo}</span>
          <span>👥 <strong>Quórum:</strong> ${acta.quorum} personas</span>
          <span>📋 <strong>Estado:</strong> ${estadoCfg[acta.estado]?.label ?? acta.estado}</span>
        </div>
        ${acta.asistentes ? `<h2>Asistentes</h2><p>${acta.asistentes}</p>` : ''}
        ${acta.acuerdos   ? `<h2>Acuerdos</h2><p>${acta.acuerdos}</p>`   : ''}
        <div class="footer">${edificioNombre} · Propify · ${new Date().toLocaleDateString('es-CL')}</div>
      </body></html>
    `
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.print()
  }

  // ── Export CSV ────────────────────────────────────────────
  function exportarCSV() {
    const bom    = '﻿'
    const header = ['Fecha', 'Título', 'Tipo', 'Estado', 'Quórum', 'Acuerdos'].join(';')
    const rows   = actas.map(a => [
      a.fecha,
      a.titulo,
      tipoCfg[a.tipo]?.label ?? a.tipo,
      estadoCfg[a.estado]?.label ?? a.estado,
      a.quorum,
      (a.acuerdos ?? '').replace(/\n/g, ' '),
    ].join(';'))
    const csv  = bom + [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(blob)
    a.download = `actas-${edificioNombre.replace(/\s/g, '_')}.csv`
    a.click()
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actas de Reunión</h1>
          <p className="text-gray-500 mt-1">{edificioNombre} · {actas.length} actas registradas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#e2e8f0' }}
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => { setModoEditar(false); setForm(FORM_VACÍO); setError(''); setModalForm(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#2563ae' }}
          >
            <Plus className="w-4 h-4" />
            Nueva acta
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total actas',   value: kpis.total,      color: '#2563ae', bg: '#eff6ff' },
          { label: 'Publicadas',    value: kpis.publicadas, color: '#2563ae', bg: '#dbeafe' },
          { label: 'Aprobadas',     value: kpis.aprobadas,  color: '#16a34a', bg: '#dcfce7' },
          { label: 'Borradores',    value: kpis.borradores, color: '#d97706', bg: '#fef3c7' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
            <p className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#e2e8f0' }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 flex-wrap">
            {(['todos', 'ordinaria', 'extraordinaria', 'directiva'] as const).map(v => (
              <button key={v} onClick={() => setFiltroTipo(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                style={filtroTipo === v ? { background: '#2563ae', color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
              >
                {v === 'todos' ? 'Todos' : tipoCfg[v].label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />
          <div className="flex gap-1 flex-wrap">
            {(['todos', 'borrador', 'aprobada', 'publicada'] as const).map(v => (
              <button key={v} onClick={() => setFiltroEstado(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={filtroEstado === v ? { background: '#1e3a5f', color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
              >
                {v === 'todos' ? 'Todos' : estadoCfg[v].label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar acta…"
              className="pl-9 pr-4 py-1.5 rounded-lg border text-sm outline-none transition-all"
              style={{ borderColor: '#e2e8f0', background: '#f8fafc', color: '#0f172a', width: 220 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#2563ae'; e.currentTarget.style.background = 'white' }}
              onBlur={e  => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border shadow-sm p-12 text-center" style={{ borderColor: '#e2e8f0' }}>
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay actas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(acta => {
            const tipo  = tipoCfg[acta.tipo]
            const est   = estadoCfg[acta.estado]
            const { Icon: EstIcon } = est

            return (
              <div key={acta.id}
                className="bg-white rounded-2xl border shadow-sm p-5 hover:border-blue-200 transition-colors"
                style={{ borderColor: '#e2e8f0' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: tipo.bg, color: tipo.color }}>
                        {tipo.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: est.bg, color: est.color }}>
                        <EstIcon className="w-3 h-3" />
                        {est.label}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 truncate">{acta.titulo}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(acta.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {acta.quorum} asistentes
                      </span>
                      {acta.acuerdos && (
                        <span className="text-gray-300">
                          {acta.acuerdos.slice(0, 80)}{acta.acuerdos.length > 80 ? '…' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setActaActual(acta); setModalVer(true); cargarFirmas(acta.id) }}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setActaActual(acta); setModoEditar(true); setForm({ titulo: acta.titulo, fecha: acta.fecha, tipo: acta.tipo, quorum: String(acta.quorum), acuerdos: acta.acuerdos ?? '', asistentes: acta.asistentes ?? '', estado: acta.estado }); setError(''); setModalForm(true) }}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => imprimirActa(acta)}
                      className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Imprimir PDF">
                      <Printer className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setActaActual(acta); setModalBorrar(true) }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal: Ver detalle ── */}
      <Modal abierto={modalVer} onCerrar={() => setModalVer(false)} titulo={actaActual?.titulo ?? ''} subtitulo={actaActual ? `${tipoCfg[actaActual.tipo]?.label} · ${new Date(actaActual.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''} ancho="lg">
        {actaActual && (
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: tipoCfg[actaActual.tipo].bg, color: tipoCfg[actaActual.tipo].color }}>
                {tipoCfg[actaActual.tipo].label}
              </span>
              {(() => { const e = estadoCfg[actaActual.estado]; return (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: e.bg, color: e.color }}>
                  <e.Icon className="w-3 h-3" /> {e.label}
                </span>
              )})()}
              <span className="text-xs text-gray-400">{actaActual.quorum} asistentes</span>
            </div>

            {/* Cambiar estado */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Cambiar estado</p>
              <div className="flex gap-2">
                {(['borrador', 'aprobada', 'publicada'] as const).map(e => (
                  <button key={e} onClick={() => cambiarEstado(actaActual.id, e)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                    style={actaActual.estado === e
                      ? { borderColor: estadoCfg[e].color, background: estadoCfg[e].bg, color: estadoCfg[e].color }
                      : { borderColor: '#e2e8f0', color: '#94a3b8' }}
                  >
                    {estadoCfg[e].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Firmas digitales */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5" /> Firmas digitales
                  {firmasActual.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: '#dbeafe', color: '#2563ae' }}>
                      {firmasActual.length}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => { setErrorFirma(''); setFormFirma({ firmante: '', cargo: '' }); setModalCanvas(true) }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: '#dbeafe', color: '#2563ae' }}
                >
                  + Agregar firma
                </button>
              </div>
              {cargandoFirmas ? (
                <p className="text-xs text-gray-400 text-center py-4">Cargando firmas…</p>
              ) : firmasActual.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4 rounded-xl border border-dashed" style={{ borderColor: '#e2e8f0' }}>
                  Sin firmas registradas
                </p>
              ) : (
                <div className="space-y-2">
                  {firmasActual.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: '#e2e8f0' }}>
                      <img src={f.firmaData} alt="firma" className="h-12 w-24 object-contain rounded border bg-white" style={{ borderColor: '#f1f5f9' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{f.firmante}</p>
                        {f.firmanteCargo && <p className="text-xs text-gray-400">{f.firmanteCargo}</p>}
                        <p className="text-xs text-gray-300 mt-0.5">
                          {new Date(f.firmadoEn).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <button
                        onClick={() => eliminarFirma(f.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                        style={{ color: '#dc2626' }}
                        title="Eliminar firma"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {actaActual.asistentes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Asistentes
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-3">{actaActual.asistentes}</p>
              </div>
            )}
            {actaActual.acuerdos && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Acuerdos
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-3">{actaActual.acuerdos}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setModalVer(false); imprimirActa(actaActual) }}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-violet-600 border-violet-200 hover:bg-violet-50 transition-colors flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Imprimir PDF
              </button>
              <button onClick={() => { setModalVer(false); setModoEditar(true); setForm({ titulo: actaActual.titulo, fecha: actaActual.fecha, tipo: actaActual.tipo, quorum: String(actaActual.quorum), acuerdos: actaActual.acuerdos ?? '', asistentes: actaActual.asistentes ?? '', estado: actaActual.estado }); setModalForm(true) }}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                <Pencil className="w-4 h-4" /> Editar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Formulario ── */}
      <Modal abierto={modalForm} onCerrar={() => setModalForm(false)} titulo={modoEditar ? 'Editar acta' : 'Nueva acta'} subtitulo={edificioNombre} ancho="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Título *</label>
            <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              placeholder="Ej: Asamblea General Ordinaria Mayo 2026"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoActa }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              >
                {(Object.keys(tipoCfg) as TipoActa[]).map(t => (
                  <option key={t} value={t}>{tipoCfg[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quórum</label>
              <input type="number" min="0" value={form.quorum} onChange={e => setForm(f => ({ ...f, quorum: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
            <div className="flex gap-2">
              {(['borrador', 'aprobada', 'publicada'] as const).map(e => (
                <button key={e} onClick={() => setForm(f => ({ ...f, estado: e }))}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                  style={form.estado === e
                    ? { borderColor: estadoCfg[e].color, background: estadoCfg[e].bg, color: estadoCfg[e].color }
                    : { borderColor: '#e2e8f0', color: '#94a3b8' }}
                >
                  {estadoCfg[e].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Asistentes</label>
            <textarea value={form.asistentes} onChange={e => setForm(f => ({ ...f, asistentes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              placeholder="Lista de asistentes…"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Acuerdos</label>
            <textarea value={form.acuerdos} onChange={e => setForm(f => ({ ...f, acuerdos: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
              placeholder="1. Aprobación del acta anterior…&#10;2. Presupuesto 2026…"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalForm(false)}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#e2e8f0' }}
            >
              Cancelar
            </button>
            <button onClick={handleGuardar} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#2563ae' }}
            >
              <ChevronRight className="w-4 h-4" />
              {saving ? 'Guardando…' : modoEditar ? 'Guardar cambios' : 'Crear acta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Canvas Firma ── */}
      <Modal
        abierto={modalCanvas}
        onCerrar={() => { setModalCanvas(false); setErrorFirma('') }}
        titulo="Agregar firma digital"
        subtitulo={actaActual?.titulo ?? ''}
        colorAccento="#2563ae"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre firmante *</label>
              <input
                type="text"
                value={formFirma.firmante}
                onChange={e => setFormFirma(f => ({ ...f, firmante: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cargo (opcional)</label>
              <input
                type="text"
                value={formFirma.cargo}
                onChange={e => setFormFirma(f => ({ ...f, cargo: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                placeholder="Ej: Presidente"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-600">Firma</label>
              <button onClick={limpiarCanvas} type="button" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Limpiar
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={480}
              height={180}
              className="w-full rounded-xl border cursor-crosshair touch-none"
              style={{ borderColor: '#e2e8f0', background: '#ffffff' }}
              onMouseDown={iniciarDibujo}
              onMouseMove={dibujar}
              onMouseUp={finDibujo}
              onMouseLeave={finDibujo}
              onTouchStart={iniciarDibujoTouch}
              onTouchMove={dibujarTouch}
              onTouchEnd={finDibujo}
            />
            <p className="text-xs text-gray-400 mt-1.5 text-center">Dibuja tu firma en el área de arriba</p>
          </div>

          {errorFirma && <p className="text-xs font-medium" style={{ color: '#dc2626' }}>{errorFirma}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setModalCanvas(false); setErrorFirma('') }}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#e2e8f0' }}
            >
              Cancelar
            </button>
            <button
              onClick={guardarFirma}
              disabled={firmando}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              style={{ background: '#2563ae' }}
            >
              {firmando ? 'Guardando…' : 'Guardar firma'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Confirmar eliminar ── */}
      <Modal abierto={modalBorrar} onCerrar={() => setModalBorrar(false)} titulo="Eliminar acta" ancho="sm" colorAccento="#dc2626">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro que deseas eliminar el acta <strong>"{actaActual?.titulo}"</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setModalBorrar(false)}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600 hover:bg-gray-50"
              style={{ borderColor: '#e2e8f0' }}
            >
              Cancelar
            </button>
            <button onClick={handleEliminar}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#dc2626' }}
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
