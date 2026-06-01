/**
 * lib/db.ts — Capa de datos Supabase
 * Todas las queries aceptan edificioId para soporte multi-tenant.
 * El parámetro tiene default 'mirador-sacramentinos' para compatibilidad.
 *
 * CLIENTE: usa createSupabaseServerClient() → session desde cookies →
 * queries autenticadas que respetan las políticas RLS por edificio.
 * Solo llamar desde Server Components (page.tsx) y Route Handlers.
 */
import { createSupabaseServerClient } from './supabase-server'
import { formatCLP } from './format'
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
  Amenidad,
  DashboardKPIs,
  ActividadReciente,
  Plan,
  Suscripcion,
  EgresoComunidad,
  Presupuesto,
  Proveedor,
  ConfigFacturacion,
  GeneracionFacturacion,
  Contrato,
  Acta,
  Novedad,
  Lectura,
  FondoComunidad,
  PersonalEdificio,
} from '@/types'

// ─── Helpers ──────────────────────────────────────────────────
// formatCLP importado desde lib/format.ts y re-exportado para compatibilidad
export { formatCLP }

// ─── Edificios ────────────────────────────────────────────────

/** Retorna solo el edificio del tenant activo. Sin parámetro: retorna todos. */
export async function getEdificios(edificioId?: string): Promise<Edificio[]> {
  const supabase = await createSupabaseServerClient()
  let q = supabase.from('edificios').select('*').order('nombre')
  if (edificioId) q = q.eq('id', edificioId)
  const { data, error } = await q
  if (error) { console.error('getEdificios:', error.message); return [] }
  return (data ?? []) as Edificio[]
}

export async function getEdificioById(id: string): Promise<Edificio | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('edificios').select('*').eq('id', id).single()
  if (error) { console.error('getEdificioById:', error.message); return null }
  return data as Edificio
}

// ─── Usuarios ─────────────────────────────────────────────────

export async function getUsuarios(edificioId = 'mirador-sacramentinos'): Promise<User[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('edificioId', edificioId)
    .order('apellido')
  if (error) { console.error('getUsuarios:', error.message); return [] }
  return (data ?? []) as User[]
}

export async function getResidentes(edificioId = 'mirador-sacramentinos'): Promise<User[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('edificioId', edificioId)
    .in('rol', ['propietario', 'arrendatario'])
    .order('apellido')
  if (error) { console.error('getResidentes:', error.message); return [] }
  return (data ?? []) as User[]
}

export async function getUsuarioById(id: string): Promise<User | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single()
  if (error) { console.error('getUsuarioById:', error.message); return null }
  return data as User
}

// ─── Unidades ─────────────────────────────────────────────────

export async function getUnidades(edificioId = 'mirador-sacramentinos'): Promise<Unidad[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('unidades')
    .select('*')
    .eq('edificioId', edificioId)
    .order('numero')
  if (error) { console.error('getUnidades:', error.message); return [] }
  return (data ?? []) as Unidad[]
}

export async function getUnidadById(id: string): Promise<Unidad | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('unidades').select('*').eq('id', id).single()
  if (error) { console.error('getUnidadById:', error.message); return null }
  return data as Unidad
}

// ─── Gastos Comunes ───────────────────────────────────────────

export async function getGastosComunes(edificioId = 'mirador-sacramentinos'): Promise<GastoComun[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('gastos_comunes')
    .select('*')
    .eq('edificioId', edificioId)
    .order('mes', { ascending: false })
  if (error) { console.error('getGastosComunes:', error.message); return [] }
  return (data ?? []) as GastoComun[]
}

export async function getGastoComunById(id: string): Promise<GastoComun | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('gastos_comunes').select('*').eq('id', id).single()
  if (error) { console.error('getGastoComunById:', error.message); return null }
  return data as GastoComun
}

/** Últimos N gastos de una unidad (excluye el actual), ordenados más reciente primero. */
export async function getHistorialGastosUnidad(
  unidadId: string,
  excludeId: string,
  limit = 3,
): Promise<GastoComun[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('gastos_comunes')
    .select('*')
    .eq('unidadId', unidadId)
    .neq('id', excludeId)
    .limit(limit + 4)
  if (error) { console.error('getHistorialGastosUnidad:', error.message); return [] }
  return ((data ?? []) as GastoComun[])
    .sort((a, b) => {
      const ay = a['año'] as number
      const by = b['año'] as number
      if (by !== ay) return by - ay
      return b.mes - a.mes
    })
    .slice(0, limit)
}

// ─── Pagos ────────────────────────────────────────────────────

export async function getPagos(edificioId = 'mirador-sacramentinos'): Promise<Pago[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('edificioId', edificioId)
    .order('creadoEn', { ascending: false })
  if (error) { console.error('getPagos:', error.message); return [] }
  return (data ?? []) as Pago[]
}

// ─── Solicitudes de Mantención ────────────────────────────────

export async function getSolicitudes(edificioId = 'mirador-sacramentinos'): Promise<SolicitudMantencion[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('edificioId', edificioId)
    .order('creadoEn', { ascending: false })
  if (error) { console.error('getSolicitudes:', error.message); return [] }
  return (data ?? []) as SolicitudMantencion[]
}

// ─── Espacios Comunes ─────────────────────────────────────────

export async function getEspaciosComunes(edificioId = 'mirador-sacramentinos'): Promise<EspacioComun[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('espacios_comunes')
    .select('*')
    .eq('edificioId', edificioId)
    .order('nombre')
  if (error) { console.error('getEspaciosComunes:', error.message); return [] }
  return (data ?? []) as EspacioComun[]
}

// ─── Reservas ─────────────────────────────────────────────────

export async function getReservas(edificioId = 'mirador-sacramentinos'): Promise<Reserva[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('reservas')
    .select('*')
    .eq('edificioId', edificioId)
    .order('fechaInicio', { ascending: false })
  if (error) { console.error('getReservas:', error.message); return [] }
  return (data ?? []) as Reserva[]
}

// ─── Comunicaciones ───────────────────────────────────────────

export async function getComunicaciones(edificioId = 'mirador-sacramentinos'): Promise<Comunicacion[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('comunicaciones')
    .select('*')
    .eq('edificioId', edificioId)
    .order('creadoEn', { ascending: false })
  if (error) { console.error('getComunicaciones:', error.message); return [] }
  return (data ?? []) as Comunicacion[]
}

// ─── Visitas ──────────────────────────────────────────────────

export async function getVisitas(edificioId = 'mirador-sacramentinos'): Promise<Visita[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('visitas')
    .select('*')
    .eq('edificioId', edificioId)
    .order('entradaEn', { ascending: false })
  if (error) { console.error('getVisitas:', error.message); return [] }
  return (data ?? []) as Visita[]
}

// ─── Paquetes ─────────────────────────────────────────────────

export async function getPaquetes(edificioId = 'mirador-sacramentinos'): Promise<Paquete[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('paquetes')
    .select('*')
    .eq('edificioId', edificioId)
    .order('recibidoEn', { ascending: false })
  if (error) { console.error('getPaquetes:', error.message); return [] }
  return (data ?? []) as Paquete[]
}

// ─── Amenidades ───────────────────────────────────────────────

export async function getAmenidades(edificioId = 'e1'): Promise<Amenidad[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('amenidades')
    .select('*')
    .eq('edificioId', edificioId)
    .order('nombre')
  if (error) { console.error('getAmenidades:', error.message); return [] }
  return (data ?? []) as Amenidad[]
}

// ─── Planes & Suscripciones ──────────────────────────────────

export async function getPlanes(): Promise<Plan[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('planes')
    .select('*')
    .eq('activo', true)
    .order('precio')
  if (error) { console.error('getPlanes:', error.message); return [] }
  return (data ?? []) as Plan[]
}

export async function getSuscripcionActual(edificioId: string): Promise<Suscripcion | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('suscripciones')
    .select('*, plan:planes(*)')
    .eq('edificioId', edificioId)
    .eq('estado', 'activa')
    .order('creadoEn', { ascending: false })
    .limit(1)
    .single()
  if (error) { console.error('getSuscripcionActual:', error.message); return null }
  return data as Suscripcion
}

// ─── KPIs calculados ──────────────────────────────────────────

export async function getDashboardData(edificioId = 'mirador-sacramentinos') {
  const [gastos, pagos, solicitudes, espacios, visitas, paquetes, reservas, unidades, edificio] =
    await Promise.all([
      getGastosComunes(edificioId),
      getPagos(edificioId),
      getSolicitudes(edificioId),
      getEspaciosComunes(edificioId),
      getVisitas(edificioId),
      getPaquetes(edificioId),
      getReservas(edificioId),
      getUnidades(edificioId),
      getEdificioById(edificioId),
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

  return { kpis, actividad, gastos, pagos, solicitudes, espacios, visitas, paquetes, reservas, unidades, edificio }
}

// ─── Egresos Comunitarios ─────────────────────────────────────

export async function getEgresos(edificioId = 'mirador-sacramentinos'): Promise<EgresoComunidad[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('egresos_comunidad')
    .select('*')
    .eq('edificioId', edificioId)
    .order('año',      { ascending: false })
    .order('mes',      { ascending: false })
    .order('categoria')
  if (error) { console.error('getEgresos:', error.message); return [] }
  return (data ?? []) as EgresoComunidad[]
}

export async function getEgresosByPeriodo(
  edificioId: string, mes: number, año: number,
): Promise<EgresoComunidad[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('egresos_comunidad')
    .select('*')
    .eq('edificioId', edificioId)
    .eq('mes', mes)
    .eq('año', año)
    .order('categoria')
    .order('monto', { ascending: false })
  if (error) { console.error('getEgresosByPeriodo:', error.message); return [] }
  return (data ?? []) as EgresoComunidad[]
}

/** Retorna los totales mensuales de egresos para el gráfico de evolución (últimos N meses). */
export async function getEvolucionEgresos(
  edificioId: string, meses = 12,
): Promise<{ mes: number; año: number; total: number }[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('egresos_comunidad')
    .select('*')
    .eq('edificioId', edificioId)
    .order('año',  { ascending: false })
    .order('mes',  { ascending: false })
    .limit(meses * 50) // sobrecarga para agrupar en JS
  if (error) { console.error('getEvolucionEgresos:', error.message); return [] }

  // Agrupar por mes/año en JS
  const map = new Map<string, { mes: number; año: number; total: number }>()
  for (const row of (data ?? []) as EgresoComunidad[]) {
    const key = `${row.año}-${row.mes}`
    const existing = map.get(key)
    if (existing) existing.total += row.monto
    else map.set(key, { mes: row.mes, año: row.año, total: row.monto })
  }

  // Ordenar cronológicamente y limitar
  return Array.from(map.values())
    .sort((a, b) => a.año !== b.año ? a.año - b.año : a.mes - b.mes)
    .slice(-meses)
}

// ─── Lecturas de Medidores ────────────────────────────────────

export async function getLecturas(edificioId = 'mirador-sacramentinos'): Promise<Lectura[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('lecturas')
    .select('*')
    .eq('edificioId', edificioId)
    .order('año',  { ascending: false })
    .order('mes',  { ascending: false })
    .order('servicio')
  if (error) { console.error('getLecturas:', error.message); return [] }
  return (data ?? []) as Lectura[]
}

export async function getLecturasByPeriodo(
  edificioId: string, mes: number, año: number,
): Promise<Lectura[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('lecturas')
    .select('*')
    .eq('edificioId', edificioId)
    .eq('mes', mes)
    .eq('año', año)
    .order('servicio')
    .order('unidadId', { nullsFirst: true }) // comunitario primero
  if (error) { console.error('getLecturasByPeriodo:', error.message); return [] }
  return (data ?? []) as Lectura[]
}

export async function getLecturasByUnidad(
  unidadId: string, mes: number, año: number,
): Promise<Lectura[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('lecturas')
    .select('*')
    .eq('unidadId', unidadId)
    .eq('mes', mes)
    .eq('año', año)
    .order('servicio')
  if (error) { console.error('getLecturasByUnidad:', error.message); return [] }
  return (data ?? []) as Lectura[]
}

// ─── Fondos Comunidad ─────────────────────────────────────────

export async function getFondos(edificioId = 'mirador-sacramentinos'): Promise<FondoComunidad[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('fondos_comunidad')
    .select('*')
    .eq('edificioId', edificioId)
    .order('año',    { ascending: false })
    .order('mes',    { ascending: false })
    .order('nombre')
  if (error) { console.error('getFondos:', error.message); return [] }
  return (data ?? []) as FondoComunidad[]
}

export async function getFondosByPeriodo(
  edificioId: string, mes: number, año: number,
): Promise<FondoComunidad[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('fondos_comunidad')
    .select('*')
    .eq('edificioId', edificioId)
    .eq('mes', mes)
    .eq('año', año)
    .order('nombre')
  if (error) { console.error('getFondosByPeriodo:', error.message); return [] }
  return (data ?? []) as FondoComunidad[]
}

// ─── Proveedores ──────────────────────────────────────────────

export async function getProveedores(edificioId = 'mirador-sacramentinos'): Promise<Proveedor[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('edificioId', edificioId)
    .order('nombre')
  if (error) { console.error('getProveedores:', error.message); return [] }
  return (data ?? []) as Proveedor[]
}

export async function getPresupuestos(edificioId = 'mirador-sacramentinos', anio?: number): Promise<Presupuesto[]> {
  const supabase = await createSupabaseServerClient()
  let q = supabase
    .from('presupuestos')
    .select('*')
    .eq('edificioId', edificioId)
    .order('categoria')
  if (anio !== undefined) q = q.eq('anio', anio)
  const { data, error } = await q
  if (error) { console.error('getPresupuestos:', error.message); return [] }
  return (data ?? []) as Presupuesto[]
}

// ─── Facturación automática ───────────────────────────────────

export async function getConfigFacturacion(edificioId = 'mirador-sacramentinos'): Promise<ConfigFacturacion | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('config_facturacion')
    .select('*')
    .eq('edificioId', edificioId)
    .single()
  if (error) { console.error('getConfigFacturacion:', error.message); return null }
  return data as ConfigFacturacion
}

export async function getGeneraciones(edificioId = 'mirador-sacramentinos'): Promise<GeneracionFacturacion[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('generaciones_facturacion')
    .select('*')
    .eq('edificioId', edificioId)
    .order('anio',    { ascending: false })
    .order('mes',     { ascending: false })
    .limit(24)
  if (error) { console.error('getGeneraciones:', error.message); return [] }
  return (data ?? []) as GeneracionFacturacion[]
}

// ─── Contratos ────────────────────────────────────────────────

export async function getContratos(edificioId = 'mirador-sacramentinos'): Promise<Contrato[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('edificioId', edificioId)
    .order('creadoEn', { ascending: false })
  if (error) { console.error('getContratos:', error.message); return [] }
  return (data ?? []) as Contrato[]
}

// ─── Actas de Reunión ────────────────────────────────────────

export async function getActas(edificioId = 'mirador-sacramentinos'): Promise<Acta[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('actas')
    .select('*')
    .eq('edificioId', edificioId)
    .order('fecha', { ascending: false })
  if (error) { console.error('getActas:', error.message); return [] }
  return (data ?? []) as Acta[]
}

// ─── Libro de Novedades ──────────────────────────────────────

export async function getNovedades(edificioId = 'mirador-sacramentinos'): Promise<Novedad[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('novedades')
    .select('*')
    .eq('edificioId', edificioId)
    .order('creadoEn', { ascending: false })
  if (error) { console.error('getNovedades:', error.message); return [] }
  return (data ?? []) as Novedad[]
}

// ─── Personal del Edificio (RRHH) ────────────────────────────

export async function getPersonal(edificioId = 'mirador-sacramentinos'): Promise<PersonalEdificio[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('personal_edificio')
    .select('*')
    .eq('edificioId', edificioId)
    .order('tipoContrato')
    .order('apellido')
  if (error) { console.error('getPersonal:', error.message); return [] }
  return (data ?? []) as PersonalEdificio[]
}
