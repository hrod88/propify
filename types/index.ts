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
  fotos?: string[]
  administradorId: string
  rut?: string
  activo: boolean
  creadoEn: string
  // ── Datos financieros (configuración de pagos) ──
  banco?: string           // Banco BCI / Banco de Chile / etc.
  cuentaCorriente?: string // Número de cuenta corriente
  emailPago?: string       // Email donde enviar comprobante
  telefonoAdmin?: string   // Teléfono administrador (+56 9 3914 7492)
  horarioAdmin?: string    // Horario atención (Lunes a Viernes 9:30-17:30)
  nombreAdmin?: string     // Nombre del administrador (Adan Jose Caicedo Herrera)
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
  prorrateo?: number   // Porcentaje de prorrateo: 0.5573 = 0.5573%
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
  montoMultas?: number        // Multas / cargos adicionales específicos de la unidad
  notaMultas?: string | null  // Descripción del cargo (ej: "Multa ruidos molestos")
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
  // Reunión
  linkReunion?: string
  fechaReunion?: string
  // Urgente
  areaAfectada?: string
  contactoUrgencia?: string
  tiempoResolucion?: string
  // Circular
  urlDocumento?: string
  validoHasta?: string
  requiereAcuse?: boolean
  // Informativo
  categoriaInfo?: string
  linkReferencia?: string
}

// ─── Visitas ──────────────────────────────────────────────────
export type MetodoAcceso = 'manual' | 'facial' | 'huella' | 'tarjeta'
export type SentidoVisita = 'entrada' | 'salida'

export interface Visita {
  id: string
  edificioId: string
  unidadId: string
  nombreVisitante: string
  rutVisitante?: string
  motivoVisita: string
  tipoVehiculo?: string
  vehiculoPatente?: string
  estacionamiento?: string
  tiempoEstadiaMin?: number
  entradaEn: string
  salidaEn?: string
  registradoPorId: string
  metodoAcceso?: MetodoAcceso
  sentido?: SentidoVisita
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
  numeroCasillero?: number
}

// ─── Amenidades ───────────────────────────────────────────────
export type EstadoAmenidad = 'disponible' | 'mantencion' | 'fuera_servicio'
export type TipoAmenidad   = 'servicio' | 'instalacion' | 'espacio'

export interface Amenidad {
  id: string
  edificioId: string
  nombre: string
  descripcion?: string
  tipo: TipoAmenidad
  estado: EstadoAmenidad
  precioInfo?: string   // formato: "5L=650|10L=1100|20L=1650"
  contacto?: string
  website?: string
  ubicacion?: string
  icono?: string
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
  comprobante?:      string | null  // N° de documento / factura
  nDoc?:             string | null  // alias visible en UI (igual que comprobante)
  fecha?:            string | null  // fecha ISO de la boleta/factura
  proveedor?:        string | null
  registradoPorId?:  string | null
  creadoEn:          string
}

// ─── Lecturas de Medidores ────────────────────────────────────
export interface Lectura {
  id:                  string
  edificioId:          string
  unidadId?:           string | null   // null = registro comunitario (total)
  mes:                 number
  año:                 number
  servicio:            string          // 'Agua Caliente' | 'Agua Fría' | 'Gas'
  lecturaInicial?:     number | null
  lecturaFinal?:       number | null
  consumoM3?:          number | null
  precioM3?:           number | null
  porcentajeConsumo?:  number | null
  total?:              number | null
  observacion?:        string | null
  creadoEn:            string
}

// ─── Fondos Comunidad ─────────────────────────────────────────
export interface FondoComunidad {
  id:           string
  edificioId:   string
  mes:          number
  año:          number
  nombre:       string
  cobrado:      number
  ingresos:     number
  egresos:      number
  saldoActual:  number
  nota?:        string | null
  creadoEn:     string
}

// ─── Proveedores ─────────────────────────────────────────────
export interface Proveedor {
  id:          string
  edificioId:  string
  nombre:      string
  rut?:        string | null
  categoria:   string
  contacto?:   string | null
  telefono?:   string | null
  email?:      string | null
  activo:      boolean
  nota?:       string | null
  created_at:  string
}

// ─── Presupuesto Anual ────────────────────────────────────────
export interface Presupuesto {
  id:          string
  edificioId:  string
  anio:        number
  categoria:   string
  monto:       number
  nota?:       string | null
  created_at:  string
}

// ─── Facturación Automática ───────────────────────────────────
export interface ConfigFacturacion {
  id:                     string
  edificioId:             string
  diaVencimiento:         number
  porcentajeFondoReserva: number
  autoGenerar:            boolean
  diaGeneracion:          number
  ultimaGeneracion?:      string | null
  created_at:             string
  updated_at:             string
}

export interface GeneracionFacturacion {
  id:             string
  edificioId:     string
  mes:            number
  anio:           number
  totalUnidades:  number
  totalGenerado:  number
  montoTotal:     number
  generadoPorId?: string | null
  creadoEn:       string
}

// ─── Contratos ────────────────────────────────────────────────
export type TipoContrato   = 'arriendo' | 'comodato' | 'propietario' | 'otro'
export type EstadoContrato = 'activo' | 'vencido' | 'terminado' | 'pendiente'

export interface Contrato {
  id:              string
  edificioId:      string
  unidadId:        string
  usuarioId:       string
  tipo:            TipoContrato
  fechaInicio:     string
  fechaFin?:       string | null
  monto:           number
  deposito?:       number | null
  estado:          EstadoContrato
  observaciones?:  string | null
  documentoUrl?:   string | null
  creadoEn:        string
  actualizadoEn:   string
}

// ─── Actas de Reunión ─────────────────────────────────────────
export type TipoActa   = 'ordinaria' | 'extraordinaria' | 'directiva'
export type EstadoActa = 'borrador' | 'aprobada' | 'publicada'

export interface Acta {
  id:           string
  edificioId:   string
  titulo:       string
  fecha:        string
  tipo:         TipoActa
  quorum:       number
  acuerdos:     string
  asistentes:   string
  estado:       EstadoActa
  creadoPorId?: string | null
  creadoEn:     string
  actualizadoEn: string
}

// ─── Libro de Novedades ───────────────────────────────────────
export type CategoriaNovedad = 'incidencia' | 'mantenimiento' | 'visitante' | 'entrega' | 'otro'
export type PrioridadNovedad = 'alta' | 'media' | 'baja'
export type EstadoNovedad    = 'abierto' | 'en_proceso' | 'cerrado'

export interface Novedad {
  id:              string
  edificioId:      string
  titulo:          string
  descripcion:     string
  categoria:       CategoriaNovedad
  prioridad:       PrioridadNovedad
  estado:          EstadoNovedad
  reportadoPorId?: string | null
  creadoEn:        string
  cerradoEn?:      string | null
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
