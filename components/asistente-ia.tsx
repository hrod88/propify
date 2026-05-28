'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Minus, Sparkles } from 'lucide-react'
import { formatCLP } from '@/lib/db'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useEdificio } from '@/context/edificio-context'
import type { GastoComun, SolicitudMantencion, Paquete, Visita, Unidad, Comunicacion, EspacioComun, Reserva, Edificio } from '@/types'

// ─── Types ────────────────────────────────────────────────────
interface Mensaje {
  id: string
  rol: 'usuario' | 'asistente'
  contenido: string
  hora: string
}

interface DatosEdificio {
  gastos:        GastoComun[]
  solicitudes:   SolicitudMantencion[]
  paquetes:      Paquete[]
  visitas:       Visita[]
  unidades:      Unidad[]
  comunicaciones: Comunicacion[]
  espacios:      EspacioComun[]
  reservas:      Reserva[]
  edificio:      Edificio | null
}

// ─── Helpers ──────────────────────────────────────────────────
function getHora() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

/** Renderiza texto con soporte para **negrita** y saltos de línea */
function RenderText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <span key={i} style={{ display: 'block', minHeight: line === '' ? '0.5em' : undefined }}>
          {line.split(/\*\*([^*]+)\*\*/g).map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
        </span>
      ))}
    </>
  )
}

// ─── AI Engine ────────────────────────────────────────────────
function processQuery(query: string, datos: DatosEdificio): string {
  const q    = query.toLowerCase().trim()
  const { gastos, solicitudes, paquetes, visitas, unidades, comunicaciones, espacios, reservas, edificio } = datos
  const nomEdificio = edificio?.nombre ?? 'el edificio'

  // ── Saludos ──
  if (/^(hola|buenas?|hey|hi|qué tal|que tal|buenos días|buenas tardes|buenas noches)/.test(q)) {
    return `¡Hola! Soy el **Asistente Propify** 🤖\n\nEstoy conectado al **${nomEdificio}**. Pregúntame sobre morosos, gastos, solicitudes, paquetes, visitas, reservas y más.\n\n¿En qué puedo ayudarte?`
  }

  // ── Ayuda / capacidades ──
  if (q.includes('ayuda') || q.includes('puedes') || q.includes('capacidad') || q.includes('qué sab') || q.includes('que sab') || q === '?') {
    return 'Puedo ayudarte con:\n\n• 📊 **Gastos y morosos** — estado de cobros\n• 🔧 **Solicitudes** — mantenciones y urgencias\n• 📦 **Paquetes** — encomiendas en conserjería\n• 🚪 **Visitas** — registro de accesos del día\n• 📅 **Reservas** — espacios comunes\n• 🏠 **Unidades** — ocupación y disponibilidad\n• 💰 **Finanzas** — ingresos y fondo de reserva\n• 📢 **Circulares** — comunicaciones recientes\n\n¡Solo pregúntame!'
  }

  // ── Morosos / deuda ──
  if (q.includes('moroso') || q.includes('mora') || q.includes('deuda') || q.includes('vencido') || q.includes('atrasado') || q.includes('impago')) {
    if (gastos.length === 0) {
      return 'Aún no hay gastos comunes registrados en el sistema. Ve a **Gastos Comunes** para comenzar a registrar cobros.'
    }
    const vencidos  = gastos.filter(g => g.estadoPago === 'vencido')
    const parciales = gastos.filter(g => g.estadoPago === 'parcial')
    const total     = vencidos.length + parciales.length
    if (total === 0) return '✅ ¡Sin morosos! Todos los cobros están al día. Excelente gestión de pagos.'
    const montoTotal      = [...vencidos, ...parciales].reduce((acc, g) => acc + g.montoTotal, 0)
    const unidadesVencidas = vencidos.map(g => {
      const u = unidades.find(un => un.id === g.unidadId)
      const dias = g.diasMora ? ` (${g.diasMora} días)` : ''
      return `• Unidad ${u?.numero ?? g.unidadId}${dias}`
    })
    const unidadesParciales = parciales.map(g => {
      const u = unidades.find(un => un.id === g.unidadId)
      return `• Unidad ${u?.numero ?? g.unidadId} (pago parcial)`
    })
    let resp = `Hay **${total} unidades con cobros sin regularizar** por **${formatCLP(montoTotal)}** en total.\n\n`
    if (vencidos.length > 0) resp += `**Pagos vencidos (${vencidos.length}):**\n${unidadesVencidas.join('\n')}\n\n`
    if (parciales.length > 0) resp += `**Pagos parciales (${parciales.length}):**\n${unidadesParciales.join('\n')}\n\n`
    resp += 'Ir a **Morosos** para enviar recordatorios.'
    return resp
  }

  // ── Gastos / pagos / recaudación / ingresos ──
  if (q.includes('gasto') || q.includes('cobro') || q.includes('recaudaci') || q.includes('ingreso') || q.includes('factura') || q.includes('cuota')) {
    if (gastos.length === 0) {
      return 'Aún no hay gastos comunes registrados. Ve a **Gastos Comunes** para comenzar a emitir cobros.'
    }
    const mesActual  = new Date().getMonth() + 1
    const añoActual  = new Date().getFullYear()
    const gastosMes  = gastos.filter(g => g.mes === mesActual && g.año === añoActual)
    const pagados    = gastosMes.filter(g => g.estadoPago === 'pagado')
    const pendientes = gastosMes.filter(g => g.estadoPago === 'pendiente')
    const vencidos   = gastosMes.filter(g => g.estadoPago === 'vencido')
    const parciales  = gastosMes.filter(g => g.estadoPago === 'parcial')
    const montoPagado = pagados.reduce((acc, g) => acc + g.montoTotal, 0)
    const montoTotal  = gastosMes.reduce((acc, g) => acc + g.montoTotal, 0)
    const pct = montoTotal > 0 ? Math.round((montoPagado / montoTotal) * 100) : 0
    const mes = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    return `**Gastos Comunes — ${mes}:**\n\n✅ **Pagados:** ${pagados.length} · ${formatCLP(montoPagado)}\n⏳ **Pendientes:** ${pendientes.length}\n❌ **Vencidos:** ${vencidos.length}\n🔶 **Parciales:** ${parciales.length}\n\nRecaudación del mes: **${pct}%** (${formatCLP(montoPagado)} de ${formatCLP(montoTotal)}).\n\nVe a **Reportes** para un análisis completo.`
  }

  // ── Solicitudes / mantenciones ──
  if (q.includes('solicitud') || q.includes('mantenci') || q.includes('reparaci') || q.includes('urgente') || q.includes('avería') || q.includes('averia') || q.includes('daño') || q.includes('ascensor') || q.includes('gotera') || q.includes('ruido')) {
    if (solicitudes.length === 0) {
      return '✅ No hay solicitudes de mantención activas. El edificio está sin pendientes técnicos.'
    }
    const activas    = solicitudes.filter(s => s.estado !== 'resuelto' && s.estado !== 'cancelado')
    if (activas.length === 0) return '✅ Todas las solicitudes están resueltas. ¡Excelente trabajo!'
    const urgentes   = activas.filter(s => s.prioridad === 'urgente')
    const altas      = activas.filter(s => s.prioridad === 'alta')
    const enProgreso = activas.filter(s => s.estado === 'en_progreso')
    let resp = `Hay **${activas.length} solicitudes activas** en el edificio:\n\n`
    if (urgentes.length > 0) resp += `🚨 **Urgentes (${urgentes.length}):**\n${urgentes.map(s => `• ${s.titulo} — ${s.categoria}`).join('\n')}\n\n`
    if (altas.length > 0)    resp += `🔴 **Alta prioridad (${altas.length}):**\n${altas.map(s => `• ${s.titulo}`).join('\n')}\n\n`
    resp += `🔄 **En progreso:** ${enProgreso.length} · ⏳ **Pendientes:** ${activas.filter(s => s.estado === 'pendiente').length}`
    return resp
  }

  // ── Paquetes / encomiendas ──
  if (q.includes('paquete') || q.includes('encomienda') || q.includes('courier') || q.includes('retiro') || q.includes('chilexpress') || q.includes('starken') || q.includes('despacho')) {
    const pendientes = paquetes.filter(p => p.estado !== 'retirado')
    if (pendientes.length === 0) {
      return 'No hay paquetes pendientes de retiro. ¡Todo al día en conserjería! 📦✅'
    }
    const lista = pendientes.map(p => {
      const u = unidades.find(un => un.id === p.unidadId)
      return `• **${p.courier}** para Unidad ${u?.numero ?? p.unidadId} — ${p.descripcion} (cód. ${p.codigoRetiro})`
    })
    return `Hay **${pendientes.length} paquetes** esperando retiro en conserjería:\n\n${lista.join('\n')}`
  }

  // ── Visitas / accesos ──
  if (q.includes('visita') || q.includes('acceso') || q.includes('ingreso') || q.includes('visitante') || q.includes('guest')) {
    const hoy     = new Date().toISOString().slice(0, 10)
    const hoyVisitas = visitas.filter(v => v.entradaEn.startsWith(hoy))
    const activas = hoyVisitas.filter(v => !v.salidaEn)
    if (hoyVisitas.length === 0) return 'No se han registrado visitas hoy en el edificio.'
    const listaActivas = activas.map(v => {
      const u = unidades.find(un => un.id === v.unidadId)
      return `• ${v.nombreVisitante} → Unidad ${u?.numero ?? ''} (${v.motivoVisita})`
    })
    return `Hoy se registraron **${hoyVisitas.length} visitas** al edificio.\n\n**Actualmente en el edificio (${activas.length}):**\n${activas.length > 0 ? listaActivas.join('\n') : '• Ninguna en este momento.'}`
  }

  // ── Reservas / espacios ──
  if (q.includes('reserva') || q.includes('quincho') || q.includes('lavandería') || q.includes('lavanderia') || q.includes('espacio') || q.includes('piscina') || q.includes('gimnasio') || q.includes('sala')) {
    if (espacios.length === 0) {
      return 'No hay espacios comunes registrados aún. Puedes agregarlos desde **Espacios Comunes**.'
    }
    const hoy           = new Date().toISOString().slice(0, 10)
    const reservasHoy   = reservas.filter(r => r.fechaInicio.startsWith(hoy))
    const disponibles   = espacios.filter(e => e.estado === 'disponible')
    const fueraServicio = espacios.filter(e => e.estado === 'fuera_servicio')
    let resp = `**Espacios Comunes — ${nomEdificio}:**\n\n`
    resp += `✅ **Disponibles:** ${disponibles.length} espacios\n`
    if (fueraServicio.length > 0) resp += `🔧 **Fuera de servicio:** ${fueraServicio.map(e => e.nombre).join(', ')}\n`
    resp += `\n📅 **Reservas para hoy (${reservasHoy.length}):**\n`
    if (reservasHoy.length > 0) {
      reservasHoy.forEach(r => {
        const esp  = espacios.find(e => e.id === r.espacioId)
        const hora = new Date(r.fechaInicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        resp += `• ${esp?.nombre ?? 'Espacio'} — ${hora} hrs\n`
      })
    } else {
      resp += '• No hay reservas confirmadas para hoy.'
    }
    return resp.trim()
  }

  // ── Unidades / ocupación ──
  if (q.includes('ocupaci') || q.includes('unidad') || q.includes('disponible') || q.includes('departamento') || q.includes('dpto')) {
    if (unidades.length === 0) {
      return `El **${nomEdificio}** tiene **${edificio?.pisos ?? 19} pisos** y más de 100 departamentos, pero aún no se han registrado las unidades individualmente. Ve a **Unidades** para comenzar a agregar los departamentos.`
    }
    const ocupadas    = unidades.filter(u => u.estado === 'ocupado').length
    const disponibles = unidades.filter(u => u.estado === 'disponible').length
    const pct         = unidades.length > 0 ? Math.round((ocupadas / unidades.length) * 100) : 0
    return `**Ocupación — ${nomEdificio}:**\n\n🏠 **Ocupadas:** ${ocupadas} de ${unidades.length} unidades (${pct}%)\n🟢 **Disponibles:** ${disponibles} unidades\n\nVe a **Unidades** para ver el detalle completo.`
  }

  // ── Fondo de reserva / finanzas ──
  if (q.includes('fondo') || q.includes('finanza') || q.includes('presupuesto') || q.includes('plata') || q.includes('caja') || q.includes('reserva financ')) {
    const mesActual   = new Date().getMonth() + 1
    const añoActual   = new Date().getFullYear()
    const ingresosMes = gastos
      .filter(g => g.estadoPago === 'pagado' && g.mes === mesActual && g.año === añoActual)
      .reduce((s, g) => s + g.montoTotal, 0)
    const montoMoroso = gastos
      .filter(g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial')
      .reduce((s, g) => s + g.montoTotal, 0)
    const fondoReserva = gastos.reduce((s, g) => s + (g.montoFondoReserva ?? 0), 0)
    const mes = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    return `**Situación Financiera — ${mes}:**\n\n💰 **Ingresos del mes:** ${formatCLP(ingresosMes)}\n🏦 **Fondo de reserva acumulado:** ${formatCLP(fondoReserva)}\n⚠️ **Monto en mora:** ${formatCLP(montoMoroso)}\n\nPara análisis detallado ve a **Reportes**.`
  }

  // ── Comunicaciones / circulares ──
  if (q.includes('circular') || q.includes('comunicaci') || q.includes('aviso') || q.includes('anuncio') || q.includes('notif')) {
    if (comunicaciones.length === 0) {
      return 'No hay comunicaciones enviadas aún. Ve a **Comunicaciones** para redactar y enviar circulares a los residentes.'
    }
    const recientes = comunicaciones.slice(0, 3)
    const lista = recientes.map(c => {
      const fecha = new Date(c.creadoEn).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
      return `• **${c.titulo}** (${fecha})${c.lecturasCount ? ` — ${c.lecturasCount} lecturas` : ''}`
    })
    return `**Comunicaciones Recientes:**\n\n${lista.join('\n')}\n\nPuedes ver y enviar circulares desde la sección **Comunicaciones**.`
  }

  // ── Residentes / vecinos ──
  if (q.includes('residente') || q.includes('vecino') || q.includes('propietario') || q.includes('arrendatario') || q.includes('inquilino')) {
    const propietarios   = unidades.filter(u => u.propietarioId).length
    const arrendatarios  = unidades.filter(u => u.arrendatarioId).length
    return `**Unidades con residentes — ${nomEdificio}:**\n\n🏡 **Con propietario asignado:** ${propietarios}\n🔑 **Con arrendatario:** ${arrendatarios}\n\nGestiona los residentes desde la sección **Residentes**.`
  }

  // ── Gracias ──
  if (q.includes('gracias') || q.includes('thank') || q.includes('perfecto') || q.includes('listo') || q.includes('ok') || q === 'genial') {
    return '¡Con gusto! 😊 Si necesitas cualquier otra cosa sobre el edificio, aquí estaré. ¿Algo más en lo que pueda ayudarte?'
  }

  // ── Datos del edificio ──
  if (q.includes('edificio') || q.includes('rut') || q.includes('dirección') || q.includes('direccion') || q.includes('pisos')) {
    if (!edificio) return 'No encuentro información del edificio registrado.'
    return `**${edificio.nombre}:**\n\n📍 **Dirección:** ${edificio.direccion}, ${edificio.comuna}\n🏢 **Pisos:** ${edificio.pisos}\n🆔 **RUT:** ${edificio.rut ?? 'No registrado'}\n🏠 **Unidades:** ${unidades.length > 0 ? unidades.length : `${edificio.totalUnidades ?? 'por registrar'}`}`
  }

  // ── Default ──
  return 'Entiendo, pero no tengo datos específicos sobre eso. Puedo ayudarte con:\n\n• **Morosos y gastos** — estado financiero\n• **Solicitudes** — mantenciones activas\n• **Paquetes** — encomiendas pendientes\n• **Visitas** — accesos del día\n• **Reservas** — espacios comunes\n• **Unidades** — ocupación\n\n¿Sobre cuál te cuento?'
}

// ─── Sugerencias de preguntas ──────────────────────────────────
const SUGERENCIAS = [
  '¿Cuántos morosos hay?',
  '¿Hay solicitudes urgentes?',
  '¿Qué paquetes están pendientes?',
  '¿Cuál es la recaudación del mes?',
  '¿Qué unidades están disponibles?',
  '¿Hay reservas para hoy?',
]

// ─── Componente principal ─────────────────────────────────────
export default function AsistenteIA() {
  const { edificioActivo: edificioId } = useEdificio()

  const [abierto,     setAbierto]     = useState(false)
  const [minimizado,  setMinimizado]  = useState(false)
  const [input,       setInput]       = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [datos,       setDatos]       = useState<DatosEdificio>({
    gastos: [], solicitudes: [], paquetes: [], visitas: [],
    unidades: [], comunicaciones: [], espacios: [], reservas: [], edificio: null,
  })
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Cargar datos reales desde Supabase
  useEffect(() => {
    if (!edificioId) return
    const sb = supabaseBrowser

    async function cargar() {
      const [
        { data: gastos },
        { data: solicitudes },
        { data: paquetes },
        { data: visitas },
        { data: unidades },
        { data: comunicaciones },
        { data: espacios },
        { data: reservas },
        { data: edificioArr },
      ] = await Promise.all([
        sb.from('gastos_comunes').select('*').eq('edificioId', edificioId),
        sb.from('solicitudes').select('*').eq('edificioId', edificioId),
        sb.from('paquetes').select('*').eq('edificioId', edificioId),
        sb.from('visitas').select('*').eq('edificioId', edificioId),
        sb.from('unidades').select('*').eq('edificioId', edificioId),
        sb.from('comunicaciones').select('*').eq('edificioId', edificioId).order('creadoEn', { ascending: false }),
        sb.from('espacios_comunes').select('*').eq('edificioId', edificioId),
        sb.from('reservas').select('*').eq('edificioId', edificioId),
        sb.from('edificios').select('*').eq('id', edificioId),
      ])

      const edif = edificioArr?.[0] ?? null
      setDatos({
        gastos:         (gastos         ?? []) as GastoComun[],
        solicitudes:    (solicitudes    ?? []) as SolicitudMantencion[],
        paquetes:       (paquetes       ?? []) as Paquete[],
        visitas:        (visitas        ?? []) as Visita[],
        unidades:       (unidades       ?? []) as Unidad[],
        comunicaciones: (comunicaciones ?? []) as Comunicacion[],
        espacios:       (espacios       ?? []) as EspacioComun[],
        reservas:       (reservas       ?? []) as Reserva[],
        edificio:       edif,
      })

      const nom = edif?.nombre ?? 'el edificio'
      setMensajes([{
        id: 'm0',
        rol: 'asistente',
        contenido: `¡Hola! Soy el **Asistente Propify** 🤖\n\nEstoy conectado al **${nom}** y puedo ayudarte con gastos, morosos, solicitudes, paquetes, visitas, reservas y más.\n\n¿En qué puedo ayudarte hoy?`,
        hora: getHora(),
      }])
    }

    cargar()
  }, [edificioId])

  // Auto-scroll al último mensaje
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [mensajes, escribiendo])

  // Focus al abrir
  useEffect(() => {
    if (abierto && !minimizado) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [abierto, minimizado])

  async function enviar(texto: string) {
    const trimmed = texto.trim()
    if (!trimmed || escribiendo) return

    const msgUsuario: Mensaje = { id: `m${Date.now()}`, rol: 'usuario', contenido: trimmed, hora: getHora() }
    setMensajes(prev => [...prev, msgUsuario])
    setInput('')
    setEscribiendo(true)

    await new Promise(r => setTimeout(r, 700 + Math.random() * 700))

    const respuesta = processQuery(trimmed, datos)
    setEscribiendo(false)
    setMensajes(prev => [...prev, { id: `m${Date.now() + 1}`, rol: 'asistente', contenido: respuesta, hora: getHora() }])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); enviar(input) }
  }

  function toggleAbrir() {
    if (!abierto) { setAbierto(true); setMinimizado(false) }
    else          { setAbierto(false) }
  }

  const nomEdificio = datos.edificio?.nombre ?? 'Edificio'

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">

      {/* ── Panel de chat ── */}
      {abierto && (
        <div
          className="pointer-events-auto flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: 376,
            height: minimizado ? 'auto' : 520,
            background: 'white',
            border: '1px solid #e2e8f0',
            animation: 'slide-up 0.25s ease-out',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: 'linear-gradient(135deg, #0f2341 0%, #1e3a5f 60%, #2563ae 100%)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white leading-none">Propify IA</p>
                  <Sparkles className="w-3 h-3 text-blue-300" />
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-xs" style={{ color: '#94b4d4' }}>
                    Activo · {nomEdificio}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimizado(!minimizado)}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 transition-colors"
                title={minimizado ? 'Expandir' : 'Minimizar'}
              >
                <Minus className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => setAbierto(false)}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 transition-colors"
                title="Cerrar"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Contenido (oculto si minimizado) */}
          {!minimizado && (
            <>
              {/* Mensajes */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
                style={{ background: '#f8fafc' }}
              >
                {mensajes.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.rol === 'asistente' && (
                      <div
                        className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mr-2 mt-1"
                        style={{ background: '#1e3a5f' }}
                      >
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div style={{ maxWidth: '80%' }}>
                      <div
                        className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                        style={
                          msg.rol === 'usuario'
                            ? { background: '#2563ae', color: 'white', borderBottomRightRadius: 4 }
                            : { background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }
                        }
                      >
                        <RenderText text={msg.contenido} />
                      </div>
                      <p
                        className="text-xs mt-1 px-1"
                        style={{ color: '#94a3b8', textAlign: msg.rol === 'usuario' ? 'right' : 'left' }}
                      >
                        {msg.hora}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {escribiendo && (
                  <div className="flex justify-start">
                    <div
                      className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mr-2 mt-1"
                      style={{ background: '#1e3a5f' }}
                    >
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div
                      className="flex items-center gap-1 px-3.5 py-3 rounded-2xl"
                      style={{ background: 'white', border: '1px solid #e2e8f0', borderBottomLeftRadius: 4 }}
                    >
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: '#94a3b8',
                            animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sugerencias (chips) */}
              {mensajes.length <= 1 && (
                <div
                  className="px-4 py-2 border-t overflow-x-auto"
                  style={{ borderColor: '#e2e8f0', background: 'white' }}
                >
                  <p className="text-xs text-gray-400 mb-2">Preguntas frecuentes</p>
                  <div className="flex gap-2 pb-1" style={{ minWidth: 'max-content' }}>
                    {SUGERENCIAS.map(s => (
                      <button
                        key={s}
                        onClick={() => enviar(s)}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium hover:opacity-80 transition-opacity whitespace-nowrap"
                        style={{ borderColor: '#2563ae', color: '#2563ae', background: '#eff6ff' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div
                className="px-3 py-3 border-t flex items-center gap-2"
                style={{ borderColor: '#e2e8f0', background: 'white' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 text-sm py-2 px-3 rounded-xl outline-none transition-all"
                  style={{
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#0f172a',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2563ae'; e.currentTarget.style.background = 'white' }}
                  onBlur={e  => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
                  suppressHydrationWarning
                />
                <button
                  onClick={() => enviar(input)}
                  disabled={!input.trim() || escribiendo}
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-85"
                  style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563ae)', flexShrink: 0 }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Botón flotante ── */}
      <button
        onClick={toggleAbrir}
        className="pointer-events-auto flex items-center gap-2.5 px-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
        style={{
          height: 52,
          background: abierto
            ? 'linear-gradient(135deg, #dc2626, #ef4444)'
            : 'linear-gradient(135deg, #0f2341 0%, #1e3a5f 50%, #2563ae 100%)',
        }}
        title={abierto ? 'Cerrar asistente' : 'Abrir asistente IA'}
      >
        {abierto
          ? <X className="w-5 h-5 text-white" />
          : (
            <>
              <Bot className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold text-white">Asistente IA</span>
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#4ade80' }}
              />
            </>
          )
        }
      </button>

      {/* CSS para animaciones */}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes typing-dot {
          0%, 60%, 100% { transform: translateY(0);    opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1;   }
        }
      `}</style>
    </div>
  )
}

