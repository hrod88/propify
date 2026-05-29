'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Eye, Info, Users, FileText, Check,
  Pencil, Trash2, Video, ExternalLink, Calendar, Clock,
  Building2, Phone, Tag, Paperclip, AlertTriangle,
} from 'lucide-react'
import Modal from '@/components/modal'
import { useNotificaciones } from '@/context/notificaciones-context'
import { supabase } from '@/lib/supabase'
import type { Comunicacion, User } from '@/types'

// ─── Selects / opciones ───────────────────────────────────────
const AREAS_AFECTADAS = [
  'Todo el edificio', 'Agua fría', 'Agua caliente', 'Electricidad',
  'Gas / Calefacción', 'Ascensores', 'Áreas comunes', 'Estacionamientos',
  'Jardín / Exterior', 'Otro',
]
const TIEMPOS_RESOLUCION = [
  'Sin estimado', 'En proceso', 'Menos de 1 hora',
  '1 a 2 horas', '2 a 4 horas', 'Durante el día',
]
const CATEGORIAS_INFO = [
  'Obras y reparaciones', 'Amenidades', 'Normativa',
  'Eventos', 'Bienestar', 'Gestión administrativa', 'Seguridad', 'Otro',
]

// ─── Configs de tipo ──────────────────────────────────────────
type TipoFiltro = 'todos' | 'circular' | 'urgente' | 'informativo' | 'reunión'

const tipoCfg = {
  circular:    { Icon: FileText,       label: 'Circular',    bg: '#dbeafe', color: '#2563ae' },
  urgente:     { Icon: AlertTriangle,  label: 'Urgente',     bg: '#fee2e2', color: '#dc2626' },
  informativo: { Icon: Info,           label: 'Informativo', bg: '#dcfce7', color: '#16a34a' },
  'reunión':   { Icon: Users,          label: 'Reunión',     bg: '#f3e8ff', color: '#7c3aed' },
} as const

// ─── Form state ───────────────────────────────────────────────
interface FormState {
  tipo:             Comunicacion['tipo']
  titulo:           string
  contenido:        string
  // Reunión
  linkReunion:      string
  fechaReunion:     string
  // Urgente
  areaAfectada:     string
  contactoUrgencia: string
  tiempoResolucion: string
  // Circular
  urlDocumento:     string
  validoHasta:      string
  requiereAcuse:    boolean
  // Informativo
  categoriaInfo:    string
  linkReferencia:   string
}

const EMPTY_FORM: FormState = {
  tipo:             'circular',
  titulo:           '',
  contenido:        '',
  linkReunion:      '',
  fechaReunion:     '',
  areaAfectada:     '',
  contactoUrgencia: '',
  tiempoResolucion: '',
  urlDocumento:     '',
  validoHasta:      '',
  requiereAcuse:    false,
  categoriaInfo:    '',
  linkReferencia:   '',
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  comunicaciones: Comunicacion[]
  users: User[]
}

// ─── Helper UI ────────────────────────────────────────────────
function Campo({ label, error, hint, children }: {
  label: string; error?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
      {hint  && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  )
}

// ─── Estado reunión ───────────────────────────────────────────
type EstadoR = 'en_vivo' | 'proxima' | 'finalizada'

function getEstadoReunion(fechaReunion: string, now: number): { estado: EstadoR; texto: string } {
  const inicio = new Date(fechaReunion).getTime()
  const fin    = inicio + 2 * 60 * 60 * 1000
  const diff   = inicio - now
  if (now >= inicio - 5 * 60 * 1000 && now <= fin) return { estado: 'en_vivo', texto: 'EN VIVO' }
  if (diff > 0) {
    const d = Math.floor(diff / 86_400_000)
    const h = Math.floor((diff % 86_400_000) / 3_600_000)
    const m = Math.ceil((diff % 3_600_000) / 60_000)
    return { estado: 'proxima', texto: d > 0 ? `En ${d}d ${h}h` : h > 0 ? `En ${h}h ${m}m` : `En ${m} min` }
  }
  return { estado: 'finalizada', texto: 'Finalizada' }
}

// ─── Componente principal ─────────────────────────────────────
export default function ComunicacionesView({ comunicaciones, users }: Props) {
  const { agregarNotificacion }       = useNotificaciones()
  const [lista, setLista]             = useState<Comunicacion[]>(comunicaciones)
  const [filtro, setFiltro]           = useState<TipoFiltro>('todos')
  const [modalCrear, setModalCrear]   = useState(false)
  const [editando, setEditando]       = useState<Comunicacion | null>(null)
  const [eliminarId, setEliminarId]   = useState<string | null>(null)
  const [toast, setToast]             = useState<string | null>(null)
  const [now, setNow]                 = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const [form, setForm]               = useState<FormState>(EMPTY_FORM)
  const [errores, setErrores]         = useState<Record<string, string>>({})
  const [formEdit, setFormEdit]       = useState<FormState>(EMPTY_FORM)
  const [erroresEdit, setErroresEdit] = useState<Record<string, string>>({})

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3200) }

  // ─── Datos derivados ──────────────────────────────────────
  const filtered = useMemo(() =>
    filtro === 'todos' ? lista : lista.filter(c => c.tipo === filtro), [lista, filtro])
  const getAutor = (id: string) => { const u = users.find(u => u.id === id); return u ? `${u.nombre} ${u.apellido}` : 'Admin' }
  const formatFecha = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
  const formatFechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatFechaHora = (iso: string) => new Date(iso).toLocaleString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  const totalLecturas = useMemo(() => lista.reduce((s, c) => s + (c.lecturasCount ?? 0), 0), [lista])
  const comunicacionAEliminar = lista.find(x => x.id === eliminarId)

  // ─── Validación ───────────────────────────────────────────
  function validateForm(f: FormState): Record<string, string> {
    const e: Record<string, string> = {}
    if (!f.titulo.trim())    e.titulo    = 'El título es requerido'
    if (!f.contenido.trim()) e.contenido = 'El contenido es requerido'
    if (f.tipo === 'reunión' && !f.fechaReunion) e.fechaReunion = 'La fecha y hora son requeridas para reuniones'
    return e
  }

  // ─── Armar payload Supabase ────────────────────────────────
  function buildPayload(f: FormState) {
    const r = f.tipo === 'reunión'
    const u = f.tipo === 'urgente'
    const c = f.tipo === 'circular'
    const i = f.tipo === 'informativo'
    return {
      tipo:             f.tipo,
      titulo:           f.titulo.trim(),
      contenido:        f.contenido.trim(),
      // Reunión
      linkReunion:      r && f.linkReunion.trim()      ? f.linkReunion.trim()                        : null,
      fechaReunion:     r && f.fechaReunion             ? new Date(f.fechaReunion).toISOString()      : null,
      // Urgente
      areaAfectada:     u && f.areaAfectada             ? f.areaAfectada                              : null,
      contactoUrgencia: u && f.contactoUrgencia.trim()  ? f.contactoUrgencia.trim()                  : null,
      tiempoResolucion: u && f.tiempoResolucion         ? f.tiempoResolucion                         : null,
      // Circular
      urlDocumento:     c && f.urlDocumento.trim()      ? f.urlDocumento.trim()                      : null,
      validoHasta:      (c || i) && f.validoHasta       ? f.validoHasta                              : null,
      requiereAcuse:    c ? f.requiereAcuse : false,
      // Informativo
      categoriaInfo:    i && f.categoriaInfo             ? f.categoriaInfo                            : null,
      linkReferencia:   i && f.linkReferencia.trim()    ? f.linkReferencia.trim()                    : null,
    }
  }

  // ─── Handler crear ────────────────────────────────────────
  function handleCrear() {
    const e = validateForm(form)
    setErrores(e)
    if (Object.keys(e).length > 0) return

    const payload = buildPayload(form)
    const nueva: Comunicacion = {
      id: `c${Date.now()}`, edificioId: 'e1', autorId: 'u1',
      creadoEn: new Date().toISOString(), lecturasCount: 0,
      ...payload,
      linkReunion:      payload.linkReunion      ?? undefined,
      fechaReunion:     payload.fechaReunion     ?? undefined,
      areaAfectada:     payload.areaAfectada     ?? undefined,
      contactoUrgencia: payload.contactoUrgencia ?? undefined,
      tiempoResolucion: payload.tiempoResolucion ?? undefined,
      urlDocumento:     payload.urlDocumento     ?? undefined,
      validoHasta:      payload.validoHasta      ?? undefined,
      categoriaInfo:    payload.categoriaInfo    ?? undefined,
      linkReferencia:   payload.linkReferencia   ?? undefined,
    }
    setLista(prev => [nueva, ...prev])
    setModalCrear(false)
    setForm(EMPTY_FORM)
    setErrores({})

    const toastMsg = {
      'reunión':    '📹 Reunión programada y notificada a residentes',
      urgente:      '🚨 Comunicado urgente publicado',
      circular:     '📄 Circular publicada correctamente',
      informativo:  'ℹ️ Comunicado informativo publicado',
    }[form.tipo] ?? 'Comunicación publicada'
    showToast(toastMsg)
    agregarNotificacion('circular', `Nueva: ${tipoCfg[form.tipo].label}`, form.titulo.trim())
    supabase.from('comunicaciones').insert(nueva).then(({ error }) => { if (error) console.error(error.message) })
  }

  // ─── Handler editar ───────────────────────────────────────
  function abrirEditar(c: Comunicacion) {
    setEditando(c)
    setFormEdit({
      tipo:             c.tipo,
      titulo:           c.titulo,
      contenido:        c.contenido,
      linkReunion:      c.linkReunion      ?? '',
      fechaReunion:     c.fechaReunion     ? new Date(c.fechaReunion).toISOString().slice(0, 16) : '',
      areaAfectada:     c.areaAfectada     ?? '',
      contactoUrgencia: c.contactoUrgencia ?? '',
      tiempoResolucion: c.tiempoResolucion ?? '',
      urlDocumento:     c.urlDocumento     ?? '',
      validoHasta:      c.validoHasta      ?? '',
      requiereAcuse:    c.requiereAcuse    ?? false,
      categoriaInfo:    c.categoriaInfo    ?? '',
      linkReferencia:   c.linkReferencia   ?? '',
    })
    setErroresEdit({})
  }

  function handleEditar() {
    if (!editando) return
    const e = validateForm(formEdit)
    setErroresEdit(e)
    if (Object.keys(e).length > 0) return

    const payload = buildPayload(formEdit)
    setLista(prev => prev.map(c => c.id !== editando.id ? c : {
      ...c, ...payload,
      linkReunion:      payload.linkReunion      ?? undefined,
      fechaReunion:     payload.fechaReunion     ?? undefined,
      areaAfectada:     payload.areaAfectada     ?? undefined,
      contactoUrgencia: payload.contactoUrgencia ?? undefined,
      tiempoResolucion: payload.tiempoResolucion ?? undefined,
      urlDocumento:     payload.urlDocumento     ?? undefined,
      validoHasta:      payload.validoHasta      ?? undefined,
      categoriaInfo:    payload.categoriaInfo    ?? undefined,
      linkReferencia:   payload.linkReferencia   ?? undefined,
    }))
    setEditando(null)
    setErroresEdit({})
    showToast('Comunicación actualizada correctamente')
    supabase.from('comunicaciones').update(payload).eq('id', editando.id).then(({ error }) => { if (error) console.error(error.message) })
  }

  // ─── Handler eliminar ─────────────────────────────────────
  function handleEliminar() {
    setLista(prev => prev.filter(c => c.id !== eliminarId))
    supabase.from('comunicaciones').delete().eq('id', eliminarId).then(({ error }) => { if (error) console.error(error.message) })
    setEliminarId(null)
    showToast('Comunicación eliminada')
  }

  // ─── Estilos ─────────────────────────────────────────────
  const inp = 'w-full px-3 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
  const sel = inp + ' cursor-pointer'

  const tabs: { value: TipoFiltro; label: string }[] = [
    { value: 'todos', label: 'Todas' }, { value: 'circular', label: 'Circulares' },
    { value: 'urgente', label: 'Urgentes' }, { value: 'informativo', label: 'Informativos' },
    { value: 'reunión', label: 'Reuniones' },
  ]

  // ─── Selector de tipo (reutilizable) ──────────────────────
  function renderTipoSelector(f: FormState, setF: React.Dispatch<React.SetStateAction<FormState>>) {
    return (
      <Campo label="Tipo de comunicación">
        <div className="grid grid-cols-2 gap-2">
          {(['circular', 'urgente', 'informativo', 'reunión'] as const).map(tipo => {
            const cfg = tipoCfg[tipo]; const activo = f.tipo === tipo; const { Icon } = cfg
            return (
              <button key={tipo} type="button" onClick={() => setF(p => ({ ...p, tipo }))}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                style={{ borderColor: activo ? cfg.color : '#e2e8f0', background: activo ? cfg.bg : 'white', color: activo ? cfg.color : '#64748b' }}>
                <Icon className="w-4 h-4" />{cfg.label}
              </button>
            )
          })}
        </div>
      </Campo>
    )
  }

  // ─── Campos extra según tipo ──────────────────────────────
  function renderCamposExtra(
    f: FormState,
    setF: React.Dispatch<React.SetStateAction<FormState>>,
    errs: Record<string, string>,
  ) {
    // ── Reunión ──────────────────────────────────────────────
    if (f.tipo === 'reunión') return (
      <>
        <Campo label="📅 Fecha y hora de la reunión" error={errs.fechaReunion}>
          <input type="datetime-local" className={inp}
            style={{ borderColor: errs.fechaReunion ? '#dc2626' : '#e2e8f0' }}
            value={f.fechaReunion}
            onChange={ev => setF(p => ({ ...p, fechaReunion: ev.target.value }))} />
        </Campo>
        <Campo label="🔗 Link de reunión (Zoom / Meet / Teams)"
          hint="Opcional — aparecerá un botón 'Unirse' visible para todos los residentes">
          <div className="relative">
            <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="url" className={inp + ' pl-9'} style={{ borderColor: '#e2e8f0' }}
              placeholder="https://zoom.us/j/123456789"
              value={f.linkReunion}
              onChange={ev => setF(p => ({ ...p, linkReunion: ev.target.value }))} />
          </div>
        </Campo>
      </>
    )

    // ── Urgente ──────────────────────────────────────────────
    if (f.tipo === 'urgente') return (
      <>
        <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: '#fff5f5', border: '1px solid #fecaca' }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
          <p className="text-xs font-medium" style={{ color: '#dc2626' }}>
            Esta comunicación se marcará como urgente y se notificará inmediatamente a todos los residentes.
          </p>
        </div>
        <Campo label="🏢 Área afectada">
          <select className={sel} style={{ borderColor: '#e2e8f0' }}
            value={f.areaAfectada}
            onChange={ev => setF(p => ({ ...p, areaAfectada: ev.target.value }))}>
            <option value="">Seleccionar área afectada...</option>
            {AREAS_AFECTADAS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="⏱️ Tiempo estimado de resolución">
            <select className={sel} style={{ borderColor: '#e2e8f0' }}
              value={f.tiempoResolucion}
              onChange={ev => setF(p => ({ ...p, tiempoResolucion: ev.target.value }))}>
              <option value="">Sin estimado</option>
              {TIEMPOS_RESOLUCION.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Campo>
          <Campo label="📞 Contacto de emergencia">
            <input type="text" className={inp} style={{ borderColor: '#e2e8f0' }}
              placeholder="Nombre · Teléfono"
              value={f.contactoUrgencia}
              onChange={ev => setF(p => ({ ...p, contactoUrgencia: ev.target.value }))} />
          </Campo>
        </div>
      </>
    )

    // ── Circular ─────────────────────────────────────────────
    if (f.tipo === 'circular') return (
      <>
        <Campo label="📎 Documento adjunto (URL de PDF o link)"
          hint="Opcional — aparecerá un botón 'Ver documento' en la tarjeta">
          <div className="relative">
            <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="url" className={inp + ' pl-9'} style={{ borderColor: '#e2e8f0' }}
              placeholder="https://drive.google.com/..."
              value={f.urlDocumento}
              onChange={ev => setF(p => ({ ...p, urlDocumento: ev.target.value }))} />
          </div>
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="📅 Válido hasta (opcional)">
            <input type="date" className={inp} style={{ borderColor: '#e2e8f0' }}
              value={f.validoHasta}
              onChange={ev => setF(p => ({ ...p, validoHasta: ev.target.value }))} />
          </Campo>
          <Campo label="✅ Acuse de recibo">
            <label
              className="flex items-center gap-3 h-[42px] px-3 border rounded-xl cursor-pointer transition-colors"
              style={{
                borderColor: f.requiereAcuse ? '#2563ae' : '#e2e8f0',
                background:  f.requiereAcuse ? '#eff6ff' : 'white',
              }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors"
                style={{ background: f.requiereAcuse ? '#2563ae' : '#e2e8f0' }}
              >
                {f.requiereAcuse && <Check className="w-3 h-3 text-white" />}
              </div>
              <input type="checkbox" className="sr-only"
                checked={f.requiereAcuse}
                onChange={ev => setF(p => ({ ...p, requiereAcuse: ev.target.checked }))} />
              <span className="text-xs font-semibold" style={{ color: f.requiereAcuse ? '#2563ae' : '#64748b' }}>
                Requiere confirmación
              </span>
            </label>
          </Campo>
        </div>
      </>
    )

    // ── Informativo ──────────────────────────────────────────
    if (f.tipo === 'informativo') return (
      <>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="🏷️ Categoría">
            <select className={sel} style={{ borderColor: '#e2e8f0' }}
              value={f.categoriaInfo}
              onChange={ev => setF(p => ({ ...p, categoriaInfo: ev.target.value }))}>
              <option value="">Sin categoría</option>
              {CATEGORIAS_INFO.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo label="📅 Válido hasta (opcional)">
            <input type="date" className={inp} style={{ borderColor: '#e2e8f0' }}
              value={f.validoHasta}
              onChange={ev => setF(p => ({ ...p, validoHasta: ev.target.value }))} />
          </Campo>
        </div>
        <Campo label="🔗 Link de referencia (opcional)"
          hint="Aparecerá un botón 'Más información' en la tarjeta">
          <div className="relative">
            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="url" className={inp + ' pl-9'} style={{ borderColor: '#e2e8f0' }}
              placeholder="https://..."
              value={f.linkReferencia}
              onChange={ev => setF(p => ({ ...p, linkReferencia: ev.target.value }))} />
          </div>
        </Campo>
      </>
    )

    return null
  }

  // ─── Info bar de tarjeta según tipo ───────────────────────
  function renderCardInfoBar(c: Comunicacion, estadoR: { estado: EstadoR; texto: string } | null) {
    const borderStyle = { borderTop: `1px dashed ${tipoCfg[c.tipo].bg}` }

    // Reunión
    if (c.tipo === 'reunión' && (c.fechaReunion || c.linkReunion)) return (
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3" style={borderStyle}>
        {c.fechaReunion && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Calendar className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
            <span>{formatFechaHora(c.fechaReunion)}</span>
          </div>
        )}
        {c.linkReunion && (
          <a href={c.linkReunion} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ background: estadoR?.estado === 'en_vivo' ? '#dc2626' : '#7c3aed', color: 'white' }}>
            <Video className="w-3.5 h-3.5" />
            {estadoR?.estado === 'en_vivo' ? '🔴 Unirse ahora' : 'Unirse a la reunión'}
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        )}
      </div>
    )

    // Urgente
    if (c.tipo === 'urgente' && (c.areaAfectada || c.tiempoResolucion || c.contactoUrgencia)) return (
      <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-3" style={{ borderTop: '1px dashed #fecaca' }}>
        {c.areaAfectada && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Building2 className="w-3 h-3" />{c.areaAfectada}
          </span>
        )}
        {c.tiempoResolucion && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Clock className="w-3.5 h-3.5 text-orange-400" />{c.tiempoResolucion}
          </span>
        )}
        {c.contactoUrgencia && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Phone className="w-3.5 h-3.5 text-gray-400" />{c.contactoUrgencia}
          </span>
        )}
      </div>
    )

    // Circular
    if (c.tipo === 'circular' && (c.urlDocumento || c.validoHasta || c.requiereAcuse)) return (
      <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-3" style={{ borderTop: '1px dashed #bfdbfe' }}>
        {c.urlDocumento && (
          <a href={c.urlDocumento} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ background: '#2563ae', color: 'white' }}>
            <Paperclip className="w-3.5 h-3.5" />Ver documento
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        )}
        {c.validoHasta && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: new Date(c.validoHasta) < new Date() ? '#dc2626' : '#64748b' }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: '#2563ae' }} />
            {new Date(c.validoHasta) < new Date()
              ? `⚠️ Venció el ${formatFechaCorta(c.validoHasta)}`
              : `Válido hasta ${formatFechaCorta(c.validoHasta)}`}
          </span>
        )}
        {c.requiereAcuse && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#dbeafe', color: '#2563ae' }}>
            <Check className="w-3 h-3" />Requiere acuse de recibo
          </span>
        )}
      </div>
    )

    // Informativo
    if (c.tipo === 'informativo' && (c.categoriaInfo || c.validoHasta || c.linkReferencia)) return (
      <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-3" style={{ borderTop: '1px dashed #bbf7d0' }}>
        {c.categoriaInfo && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Tag className="w-3 h-3" />{c.categoriaInfo}
          </span>
        )}
        {c.validoHasta && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: new Date(c.validoHasta) < new Date() ? '#dc2626' : '#64748b' }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
            {new Date(c.validoHasta) < new Date()
              ? `⚠️ Venció el ${formatFechaCorta(c.validoHasta)}`
              : `Vigente hasta ${formatFechaCorta(c.validoHasta)}`}
          </span>
        )}
        {c.linkReferencia && (
          <a href={c.linkReferencia} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ background: '#16a34a', color: 'white' }}>
            <ExternalLink className="w-3.5 h-3.5" />Más información
          </a>
        )}
      </div>
    )

    return null
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl"
          style={{ background: '#16a34a' }}>
          <Check className="w-4 h-4" />{toast}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicaciones</h1>
          <p className="text-gray-500 mt-1">{lista.length} publicaciones · {totalLecturas} lecturas totales</p>
        </div>
        <button onClick={() => { setModalCrear(true); setForm(EMPTY_FORM); setErrores({}) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#7c3aed' }}>
          <Plus className="w-4 h-4" />Nueva comunicación
        </button>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(['circular', 'urgente', 'informativo', 'reunión'] as const).map(tipo => {
          const cfg      = tipoCfg[tipo]
          const items    = lista.filter(c => c.tipo === tipo)
          const lecturas = items.reduce((s, c) => s + (c.lecturasCount ?? 0), 0)
          const { Icon } = cfg
          const enVivo   = tipo === 'reunión' && items.some(c =>
            c.fechaReunion && getEstadoReunion(c.fechaReunion, now).estado === 'en_vivo')
          // Urgentes activos (sin resolución confirmada)
          const count    = items.length
          const isFiltered = filtro === tipo
          return (
            <div key={tipo} className="bg-white rounded-2xl p-4 transition-all"
              style={{
                border: isFiltered
                  ? `2px solid ${cfg.color}`
                  : `1px solid ${enVivo ? '#fca5a5' : '#e2e8f0'}`,
                boxShadow: isFiltered
                  ? `0 0 0 3px ${cfg.bg}, 0 4px 12px -2px rgba(0,0,0,0.06)`
                  : '0 1px 2px 0 rgba(0,0,0,0.05)',
              }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enVivo ? 'animate-pulse-soft' : ''}`}
                  style={{ background: cfg.bg }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                {enVivo && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#fee2e2', color: '#dc2626' }}>EN VIVO</span>
                )}
              </div>
              <p className="text-xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400 mt-0.5">{lecturas} lecturas</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ value, label }) => {
          const activeColor = value === 'todos' ? undefined : tipoCfg[value as keyof typeof tipoCfg].color
          const activeBg    = value === 'todos' ? undefined : tipoCfg[value as keyof typeof tipoCfg].bg
          const isActive    = filtro === value
          return (
            <button key={value} onClick={() => setFiltro(value)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                isActive && value !== 'todos'
                  ? { background: activeColor, color: 'white', boxShadow: `0 0 0 3px ${activeBg}` }
                  : isActive
                  ? { background: '#cbd5e1', color: '#334155' }
                  : { background: '#f1f5f9', color: '#64748b' }
              }>
              {label}
            </button>
          )
        })}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm py-16 text-center" style={{ borderColor: '#e2e8f0' }}>
            <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm">No hay comunicaciones en esta categoría</p>
          </div>
        ) : filtered.map(c => {
          const cfg      = tipoCfg[c.tipo]
          const { Icon } = cfg
          const estadoR  = c.tipo === 'reunión' && c.fechaReunion
            ? getEstadoReunion(c.fechaReunion, now) : null

          return (
            <div key={c.id}
              className="bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              style={{ borderColor: estadoR?.estado === 'en_vivo' ? '#fca5a5' : '#e2e8f0' }}>
              <div className="h-1 w-full" style={{ background: cfg.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">

                  {/* Izquierda */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${estadoR?.estado === 'en_vivo' ? 'animate-pulse-soft' : ''}`}
                      style={{ background: cfg.bg }}>
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Título + badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">{c.titulo}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>

                        {/* Badge estado reunión */}
                        {estadoR && (
                          estadoR.estado === 'en_vivo' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse-soft"
                              style={{ background: '#fee2e2', color: '#dc2626' }}>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />EN VIVO
                            </span>
                          ) : estadoR.estado === 'proxima' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                              <Clock className="w-3 h-3" />{estadoR.texto}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={{ background: '#f1f5f9', color: '#94a3b8' }}>Finalizada</span>
                          )
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mb-2">{getAutor(c.autorId)} · {formatFecha(c.creadoEn)}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{c.contenido}</p>

                      {/* Info bar específica del tipo */}
                      {renderCardInfoBar(c, estadoR)}
                    </div>
                  </div>

                  {/* Derecha */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <div>
                      <div className="flex items-center gap-1 justify-end">
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-bold text-gray-700">{c.lecturasCount ?? 0}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">lecturas</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => abrirEditar(c)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        <Pencil className="w-3 h-3" />Editar
                      </button>
                      <button onClick={() => setEliminarId(c.id)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                        style={{ background: '#fee2e2', color: '#dc2626' }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Modal: Nueva Comunicación ────────────────────────── */}
      <Modal abierto={modalCrear}
        onCerrar={() => { setModalCrear(false); setForm(EMPTY_FORM); setErrores({}) }}
        titulo="Nueva comunicación"
        subtitulo="Publica un comunicado para todos los residentes del edificio"
        colorAccento="#7c3aed">
        <div className="space-y-4">
          {renderTipoSelector(form, setForm)}

          <Campo label="Título" error={errores.titulo}>
            <input type="text" className={inp}
              style={{ borderColor: errores.titulo ? '#dc2626' : '#e2e8f0' }}
              placeholder={
                form.tipo === 'reunión'    ? 'Ej: Reunión de copropietarios vía Zoom' :
                form.tipo === 'urgente'    ? 'Ej: Corte de agua emergencia' :
                form.tipo === 'circular'   ? 'Ej: Circular N°12 – Normas de convivencia' :
                'Ej: Apertura del quincho en verano'
              }
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
          </Campo>

          <Campo label="Contenido" error={errores.contenido}>
            <textarea rows={4} className={inp + ' resize-none'}
              style={{ borderColor: errores.contenido ? '#dc2626' : '#e2e8f0' }}
              placeholder={
                form.tipo === 'urgente'    ? 'Describe la situación, acciones tomadas y recomendaciones...' :
                form.tipo === 'reunión'    ? 'Agenda, temas a tratar, instrucciones de acceso...' :
                'Escribe el contenido completo de la comunicación...'
              }
              value={form.contenido}
              onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))} />
          </Campo>

          {renderCamposExtra(form, setForm, errores)}

          {/* Vista previa */}
          {form.titulo && (
            <div className="p-3 rounded-xl" style={{ background: '#f8fafc' }}>
              <p className="text-xs text-gray-400 mb-1.5">Vista previa</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: tipoCfg[form.tipo].bg, color: tipoCfg[form.tipo].color }}>
                  {tipoCfg[form.tipo].label}
                </span>
                <span className="text-sm font-bold text-gray-800 truncate">{form.titulo}</span>
                {form.tipo === 'urgente' && form.areaAfectada && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#fee2e2', color: '#dc2626' }}>{form.areaAfectada}</span>
                )}
                {form.tipo === 'reunión' && form.fechaReunion && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatFechaHora(new Date(form.fechaReunion).toISOString())}
                  </span>
                )}
                {form.tipo === 'circular' && form.requiereAcuse && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#dbeafe', color: '#2563ae' }}>✅ Acuse requerido</span>
                )}
                {form.tipo === 'informativo' && form.categoriaInfo && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#dcfce7', color: '#16a34a' }}>{form.categoriaInfo}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setModalCrear(false); setForm(EMPTY_FORM); setErrores({}) }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button onClick={handleCrear}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: tipoCfg[form.tipo].color }}>
              {form.tipo === 'reunión'  && <><Video className="w-4 h-4" />Programar reunión</>}
              {form.tipo === 'urgente'  && <><AlertTriangle className="w-4 h-4" />Publicar urgente</>}
              {form.tipo === 'circular' && <><FileText className="w-4 h-4" />Publicar circular</>}
              {form.tipo === 'informativo' && <><Info className="w-4 h-4" />Publicar</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Editar Comunicación ───────────────────────── */}
      <Modal abierto={editando !== null}
        onCerrar={() => { setEditando(null); setErroresEdit({}) }}
        titulo="Editar comunicación"
        subtitulo={editando?.titulo ?? ''}
        colorAccento="#7c3aed">
        {editando && (
          <div className="space-y-4">
            {renderTipoSelector(formEdit, setFormEdit)}

            <Campo label="Título" error={erroresEdit.titulo}>
              <input type="text" className={inp}
                style={{ borderColor: erroresEdit.titulo ? '#dc2626' : '#e2e8f0' }}
                value={formEdit.titulo}
                onChange={e => setFormEdit(f => ({ ...f, titulo: e.target.value }))} />
            </Campo>

            <Campo label="Contenido" error={erroresEdit.contenido}>
              <textarea rows={4} className={inp + ' resize-none'}
                style={{ borderColor: erroresEdit.contenido ? '#dc2626' : '#e2e8f0' }}
                value={formEdit.contenido}
                onChange={e => setFormEdit(f => ({ ...f, contenido: e.target.value }))} />
            </Campo>

            {renderCamposExtra(formEdit, setFormEdit, erroresEdit)}

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => { setEditando(null); setErroresEdit({}) }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleEditar}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: '#7c3aed' }}>
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Modal: Confirmar eliminación ────────────────────── */}
      <Modal abierto={eliminarId !== null} onCerrar={() => setEliminarId(null)}
        titulo="Eliminar comunicación" subtitulo="Esta acción no se puede deshacer" colorAccento="#dc2626">
        <div className="space-y-4">
          {comunicacionAEliminar && (
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#fff1f2' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: tipoCfg[comunicacionAEliminar.tipo].bg }}>
                {(() => { const { Icon } = tipoCfg[comunicacionAEliminar.tipo]; return <Icon className="w-4 h-4" style={{ color: tipoCfg[comunicacionAEliminar.tipo].color }} /> })()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{comunicacionAEliminar.titulo}</p>
                <p className="text-xs text-gray-500">
                  {tipoCfg[comunicacionAEliminar.tipo].label} · {formatFecha(comunicacionAEliminar.creadoEn)}
                </p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600">¿Confirmas que deseas eliminar esta comunicación?</p>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setEliminarId(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button onClick={handleEliminar}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#dc2626' }}>
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
