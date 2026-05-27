/**
 * lib/db.ts — Capa de datos Supabase
 * Reemplaza lib/mock-data.ts para todas las queries de lectura.
 * Los nombres de columna en la DB coinciden con los tipos TypeScript.
 */
import { supabase } from './supabase'
import type {
  User,
  Edificio,
  Unidad,
  GastoComun,
  Pago,
  SolicitudMantencion,
  EspacioComun,
  Reserva,
  Comunicacion,
  Visita,
  Paquete,
  DashboardKPIs,
  ActividadReciente,
} from '@/types'

// ─── Helpers ──────────────────────────────────────────────────
export const formatCLP = (monto: number): string =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)

// ─── Queries de lectura ───────────────────────────────────────

export async function getEdificios(): Promise<Edificio[]> {
  const { data, error } = await supabase.from('edificios').select('*').order('nombre')
  if (error) { console.error('getEdificios:', error.message); return [] }
  return (data ?? []) as Edificio[]
}

export async function getEdificioById(id: string): Promise<Edificio | null> {
  const { data, error } = await supabase.from('edificios').select('*').eq('id', id).single()
  if (error) { console.error('getEdificioById:', error.message); return null }
  return data as Edificio
}

export async function getUsuarios(): Promise<User[]> {
  const { data, error } = await supabase.from('usuarios').select('*').order('apellido')
  if (error) { console.error('getUsuarios:', error.message); return [] }
  return (data ?? []) as User[]
}

export async function getResidentes(): Promise<User[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .in('rol', ['propietario', 'arrendatario'])
    .order('apellido')
  if (error) { console.error('getResidentes:', error.message); return [] }
  return (data ?? []) as User[]
}

export async function getUsuarioById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single()
  if (error) { console.error('getUsuarioById:', error.message); return null }
  return data as User
}

export async function getUnidades(): Promise<Unidad[]> {
  const { data, error } = await supabase.from('unidades').select('*').order('numero')
  if (error) { console.error('getUnidades:', error.message); return [] }
  return (data ?? []) as Unidad[]
}

export async function getUnidadById(id: string): Promise<Unidad | null> {
  const { data, error } = await supabase.from('unidades').select('*').eq('id', id).single()
  if (error) { console.error('getUnidadById:', error.message); return null }
  return data as Unidad
}

export async function getGastosComunes(): Promise<GastoComun[]> {
  const { data, error } = await supabase
    .from('gastos_comunes')
    .select('*')
    .order('mes', { ascending: false })
  if (error) { console.error('getGastosComunes:', error.message); return [] }
  return (data ?? []) as GastoComun[]
}

export async function getGastoComunById(id: string): Promise<GastoComun | null> {
  const { data, error } = await supabase.from('gastos_comunes').select('*').eq('id', id).single()
  if (error) { console.error('getGastoComunById:', error.message); return null }
  return data as GastoComun
}

export async function getPagos(): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .order('creadoEn', { ascending: false })
  if (error) { console.error('getPagos:', error.message); return [] }
  return (data ?? []) as Pago[]
}

export async function getSolicitudes(): Promise<SolicitudMantencion[]> {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*')
    .order('creadoEn', { ascending: false })
  if (error) { console.error('getSolicitudes:', error.message); return [] }
  return (data ?? []) as SolicitudMantencion[]
}

export async function getEspaciosComunes(): Promise<EspacioComun[]> {
  const { data, error } = await supabase.from('espacios_comunes').select('*').order('nombre')
  if (error) { console.error('getEspaciosComunes:', error.message); return [] }
  return (data ?? []) as EspacioComun[]
}

export async function getReservas(): Promise<Reserva[]> {
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .order('fechaInicio', { ascending: false })
  if (error) { console.error('getReservas:', error.message); return [] }
  return (data ?? []) as Reserva[]
}

export async function getComunicaciones(): Promise<Comunicacion[]> {
  const { data, error } = await supabase
    .from('comunicaciones')
    .select('*')
    .order('creadoEn', { ascending: false })
  if (error) { console.error('getComunicaciones:', error.message); return [] }
  return (data ?? []) as Comunicacion[]
}

export async function getVisitas(): Promise<Visita[]> {
  const { data, error } = await supabase
    .from('visitas')
    .select('*')
    .order('entradaEn', { ascending: false })
  if (error) { console.error('getVisitas:', error.message); return [] }
  return (data ?? []) as Visita[]
}

export async function getPaquetes(): Promise<Paquete[]> {
  const { data, error } = await supabase
    .from('paquetes')
    .select('*')
    .order('recibidoEn', { ascending: false })
  if (error) { console.error('getPaquetes:', error.message); return [] }
  return (data ?? []) as Paquete[]
}

// ─── KPIs calculados ──────────────────────────────────────────
export async function getDashboardData() {
  const [gastos, pagos, solicitudes, espacios, visitas, paquetes, reservas, unidades] =
    await Promise.all([
      getGastosComunes(),
      getPagos(),
      getSolicitudes(),
      getEspaciosComunes(),
      getVisitas(),
      getPaquetes(),
      getReservas(),
      getUnidades(),
    ])

  const hoy = new Date().toISOString().slice(0, 10)

  const kpis: DashboardKPIs = {
    totalUnidades:          unidades.length,
    unidadesOcupadas:       unidades.filter(u => u.estado === 'ocupado').length,
    morosos:                gastos.filter(g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial').length,
    montoMoroso:            gastos.filter(g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial').reduce((s, g) => s + g.montoTotal, 0),
    solicitudesPendientes:  solicitudes.filter(s => s.estado === 'pendiente').length,
    ingresosMes:            pagos.filter(p => p.mes === new Date().getMonth() + 1 && p.año === new Date().getFullYear()).reduce((s, p) => s + p.monto, 0),
    fondoReserva:           gastos.reduce((s, g) => s + (g.montoFondoReserva ?? 0), 0) * 12,
    visitasHoy:             visitas.filter(v => v.entradaEn.slice(0, 10) === hoy).length,
    paquetesPendientes:     paquetes.filter(p => p.estado !== 'retirado').length,
    reservasHoy:            reservas.filter(r => r.fechaInicio.slice(0, 10) === hoy).length,
  }

  const actividad: ActividadReciente[] = [
    ...pagos.slice(0, 3).map((p, i) => ({
      id: `act-pago-${i}`,
      tipo: 'pago' as const,
      titulo: 'Pago recibido',
      descripcion: `Gastos comunes — ${formatCLP(p.monto)}`,
      tiempo: 'reciente',
      unidad: `Unidad ${p.unidadId}`,
      monto: p.monto,
    })),
    ...solicitudes.filter(s => s.prioridad === 'urgente' || s.prioridad === 'alta').slice(0, 2).map((s, i) => ({
      id: `act-sol-${i}`,
      tipo: 'solicitud' as const,
      titulo: 'Solicitud de mantención',
      descripcion: s.titulo,
      tiempo: 'reciente',
      unidad: `Unidad ${s.unidadId}`,
    })),
    ...paquetes.filter(p => p.estado !== 'retirado').slice(0, 2).map((p, i) => ({
      id: `act-paq-${i}`,
      tipo: 'paquete' as const,
      titulo: 'Paquete pendiente',
      descripcion: `${p.courier} — ${p.descripcion ?? 'paquete'}`,
      tiempo: 'reciente',
      unidad: `Unidad ${p.unidadId}`,
    })),
  ].slice(0, 7)

  return { kpis, actividad, gastos, pagos, solicitudes, espacios, visitas, paquetes, reservas, unidades }
}
