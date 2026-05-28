// ─── Roles ────────────────────────────────────────────────────
export type UserRole =
  | 'super_admin'
  | 'administrador'
  | 'conserje'
  | 'propietario'
  | 'arrendatario'

// ─── Usuario ──────────────────────────────────────────────────
export interface User {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  avatar?: string
  rol: UserRole
  edificioId?: string
  unidadId?: string
  activo: boolean
  creadoEn: string
}

// ─── Edificio ─────────────────────────────────────────────────
export interface Edificio {
  id: string
  nombre: string
  direccion: string
  comuna: string
  ciudad: string
  totalUnidades: number
  pisos: number
  anoconstruccion?: number
  imagen?: string
  administradorId: string
  rut?: string
  activo: boolean
  creadoEn: string
}

// ─── Unidad ───────────────────────────────────────────────────
export type TipoUnidad =
  | 'departamento'
  | 'casa'
  | 'local_comercial'
  | 'oficina'
  | 'bodega'
  | 'estacionamiento'

export type EstadoUnidad = 'ocupado' | 'disponible' | 'en_mantención'

export interface Unidad {
  id: string
  edificioId: string
  numero: string
  piso: number
  tipo: TipoUnidad
  estado: EstadoUnidad
  superficieM2: number
  habitaciones?: number
  banos?: number
  propietarioId?: string
  arrendatarioId?: string
  gastosComunesMonto: number
}

// ─── Gastos Comunes ───────────────────────────────────────────
export type EstadoPago = 'pagado' | 'pendiente' | 'vencido' | 'parcial'

export interface GastoComun {
  id: string
  unidadId: string
  edificioId: string
  mes: number
  año: number
  montoBase: number
  montoAgua?: number
  montoElectricidad?: number
  montoGas?: number
  montoFondoReserva?: number
  montoTotal: number
  estadoPago: EstadoPago
  fechaVencimiento: string
  fechaPago?: string
  diasMora?: number
}

// ─── Solicitud de Mantención ──────────────────────────────────
export type EstadoSolicitud =
  | 'pendiente'
  | 'en_progreso'
  | 'resuelto'
  | 'cancelado'

export type PrioridadSolicitud = 'baja' | 'media' | 'alta' | 'urgente'

export interface SolicitudMantencion {
  id: string
  unidadId: string
  edificioId: string
  titulo: string
  descripcion: string
  estado: EstadoSolicitud
  prioridad: PrioridadSolicitud
  categoria: string
  solicitanteId: string
  asignadoA?: string
  creadoEn: string
  actualizadoEn: string
  resueltoEn?: string
  imagen?: string
}

// ─── Reservas ─────────────────────────────────────────────────
export type TipoEspacio =
  | 'quincho'
  | 'sala_multiuso'
  | 'lavanderia'
  | 'gimnasio'
  | 'piscina'
  | 'sala_reuniones'
  | 'estacionamiento_visitas'

export type EstadoReserva = 'disponible' | 'ocupado' | 'reservado' | 'fuera_servicio'

export interface EspacioComun {
  id: string
  edificioId: string
  nombre: string
  tipo: TipoEspacio
  capacidad?: number
  estado: EstadoReserva
  descripcion?: string
  imagen?: string
  requiereReserva: boolean
  tarifaUso?: number
}

export interface Reserva {
  id: string
  espacioId: string
  unidadId: string
  usuarioId: string
  fechaInicio: string
  fechaFin: string
  estado: 'confirmada' | 'cancelada' | 'pendiente'
  nota?: string
  creadoEn: string
}

// ─── Comunicaciones ───────────────────────────────────────────
export type TipoComunicacion = 'circular' | 'urgente' | 'informativo' | 'reunión'

export interface Comunicacion {
  id: string
  edificioId: string
  titulo: string
  contenido: string
  tipo: TipoComunicacion
  autorId: string
  creadoEn: string
  lecturasCount?: number
}

// ─── Visitas ──────────────────────────────────────────────────
export interface Visita {
  id: string
  edificioId: string
  unidadId: string
  nombreVisitante: string
  rutVisitante?: string
  motivoVisita: string
  vehiculoPatente?: string
  entradaEn: string
  salidaEn?: string
  registradoPorId: string
}

// ─── Paquetes / Delivery ──────────────────────────────────────
export type EstadoPaquete = 'recibido' | 'notificado' | 'retirado'

export interface Paquete {
  id: string
  edificioId: string
  unidadId: string
  courier: string
  descripcion?: string
  estado: EstadoPaquete
  recibidoEn: string
  retiradoEn?: string
  codigoRetiro?: string
  imagen?: string
}

// ─── Dashboard KPIs ───────────────────────────────────────────
export interface DashboardKPIs {
  totalUnidades: number
  unidadesOcupadas: number
  morosos: number
  montoMoroso: number
  solicitudesPendientes: number
  ingresosMes: number
  fondoReserva: number
  visitasHoy: number
  paquetesPendientes: number
  reservasHoy: number
}

// ─── Pagos ────────────────────────────────────────────────────
export type MetodoPago = 'transferencia' | 'webpay' | 'efectivo' | 'tarjeta' | 'cheque'
export type EstadoTransaccion = 'completado' | 'pendiente' | 'rechazado'

export interface Pago {
  id: string
  gastoId?: string
  unidadId: string
  edificioId: string
  monto: number
  mes: number
  año: number
  metodo: MetodoPago
  estado: EstadoTransaccion
  registradoPorId: string
  pagadoPorId?: string
  comprobante?: string
  nota?: string
  creadoEn: string
}

// ─── Planes & Suscripciones ───────────────────────────────────

export interface Plan {
  id: string
  nombre: string
  precio: number          // CLP mensual, 0 = gratuito
  maxUnidades: number
  maxUsuarios: number
  features: string[]
  popular: boolean
  activo: boolean
}

export type EstadoSuscripcion = 'activa' | 'vencida' | 'cancelada'

export interface Suscripcion {
  id: string
  edificioId: string
  planId: string
  estado: EstadoSuscripcion
  fechaInicio: string
  fechaVencimiento?: string
  creadoEn: string
  plan?: Plan             // join opcional
}

// ─── Egresos Comunitarios ─────────────────────────────────────
export type CategoriaEgreso =
  | 'Administración'
  | 'Electricidad'
  | 'Gas / Calefacción'
  | 'Agua Fría'
  | 'Limpieza'
  | 'Portería'
  | 'Ascensores'
  | 'Mantenimiento'
  | 'Seguros'
  | 'Extintores'
  | 'Reparaciones'
  | 'Jardín'
  | 'Contabilidad'
  | 'Comunicaciones'
  | 'Aseo Exterior'
  | 'Control de Plagas'
  | 'Fondo Reserva'
  | 'Otros'

export interface EgresoComunidad {
  id:                string
  edificioId:        string
  mes:               number
  año:               number
  categoria:         CategoriaEgreso | string
  descripcion?:      string | null
  monto:             number
  comprobante?:      string | null
  proveedor?:        string | null
  registradoPorId?:  string | null
  creadoEn:          string
}

// ─── Actividad Reciente ───────────────────────────────────────
export type TipoActividad =
  | 'pago'
  | 'solicitud'
  | 'circular'
  | 'visita'
  | 'paquete'
  | 'reserva'
  | 'mora'

export interface ActividadReciente {
  id: string
  tipo: TipoActividad
  titulo: string
  descripcion: string
  tiempo: string
  unidad?: string
  monto?: number
}
