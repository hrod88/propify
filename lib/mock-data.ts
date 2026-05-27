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

// ─── Usuarios ─────────────────────────────────────────────────
export const mockUsers: User[] = [
  {
    id: 'u1',
    nombre: 'Rodrigo',
    apellido: 'Administrador',
    email: 'admin@propify.cl',
    telefono: '+56 9 8765 4321',
    rol: 'administrador',
    edificioId: 'e1',
    activo: true,
    creadoEn: '2024-01-15',
  },
  {
    id: 'u2',
    nombre: 'María José',
    apellido: 'González',
    email: 'mariajose@gmail.com',
    telefono: '+56 9 7654 3210',
    rol: 'propietario',
    edificioId: 'e1',
    unidadId: 'un1',
    activo: true,
    creadoEn: '2024-02-10',
  },
  {
    id: 'u3',
    nombre: 'Carlos',
    apellido: 'Muñoz',
    email: 'carlos.munoz@gmail.com',
    telefono: '+56 9 6543 2109',
    rol: 'arrendatario',
    edificioId: 'e1',
    unidadId: 'un5',
    activo: true,
    creadoEn: '2024-03-20',
  },
  {
    id: 'u4',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@propify.cl',
    telefono: '+56 9 5432 1098',
    rol: 'conserje',
    edificioId: 'e1',
    activo: true,
    creadoEn: '2024-01-20',
  },
  {
    id: 'u5',
    nombre: 'Roberto',
    apellido: 'Silva',
    email: 'roberto.silva@gmail.com',
    telefono: '+56 9 4321 0987',
    rol: 'propietario',
    edificioId: 'e1',
    unidadId: 'un2',
    activo: true,
    creadoEn: '2024-02-15',
  },
  {
    id: 'u6',
    nombre: 'Patricia',
    apellido: 'Herrera',
    email: 'patricia.h@gmail.com',
    telefono: '+56 9 3210 9876',
    rol: 'propietario',
    edificioId: 'e1',
    unidadId: 'un4',
    activo: true,
    creadoEn: '2024-03-01',
  },
  {
    id: 'u7',
    nombre: 'Diego',
    apellido: 'Ramírez',
    email: 'diego.ramirez@gmail.com',
    telefono: '+56 9 2109 8765',
    rol: 'arrendatario',
    edificioId: 'e1',
    unidadId: 'un4',
    activo: true,
    creadoEn: '2024-04-01',
  },
  {
    id: 'u8',
    nombre: 'Claudia',
    apellido: 'Torres',
    email: 'claudia.torres@gmail.com',
    telefono: '+56 9 1098 7654',
    rol: 'propietario',
    edificioId: 'e1',
    unidadId: 'un6',
    activo: true,
    creadoEn: '2024-01-20',
  },
  {
    id: 'u9',
    nombre: 'Felipe',
    apellido: 'Morales',
    email: 'felipe.m@gmail.com',
    telefono: '+56 9 0987 6543',
    rol: 'propietario',
    edificioId: 'e1',
    unidadId: 'un7',
    activo: true,
    creadoEn: '2024-02-28',
  },
  {
    id: 'u10',
    nombre: 'Valentina',
    apellido: 'Castro',
    email: 'valentina.c@gmail.com',
    telefono: '+56 9 9876 5432',
    rol: 'arrendatario',
    edificioId: 'e1',
    unidadId: 'un7',
    activo: true,
    creadoEn: '2024-05-01',
  },
]

// ─── Edificios ────────────────────────────────────────────────
export const mockEdificios: Edificio[] = [
  {
    id: 'e1',
    nombre: 'Edificio Las Palmas',
    direccion: 'Av. Apoquindo 4501',
    comuna: 'Las Condes',
    ciudad: 'Santiago',
    totalUnidades: 48,
    pisos: 12,
    anoconstruccion: 2018,
    administradorId: 'u1',
    rut: '76.123.456-7',
    activo: true,
    creadoEn: '2024-01-01',
  },
  {
    id: 'e2',
    nombre: 'Condominio Los Aromos',
    direccion: 'Calle Los Aromos 234',
    comuna: 'Ñuñoa',
    ciudad: 'Santiago',
    totalUnidades: 24,
    pisos: 6,
    anoconstruccion: 2020,
    administradorId: 'u1',
    rut: '76.234.567-8',
    activo: true,
    creadoEn: '2024-01-15',
  },
  {
    id: 'e3',
    nombre: 'Torre Bicentenario',
    direccion: 'Av. Vitacura 2939',
    comuna: 'Vitacura',
    ciudad: 'Santiago',
    totalUnidades: 80,
    pisos: 20,
    anoconstruccion: 2015,
    administradorId: 'u1',
    rut: '76.345.678-9',
    activo: true,
    creadoEn: '2024-02-01',
  },
]

// ─── Unidades ─────────────────────────────────────────────────
export const mockUnidades: Unidad[] = [
  { id: 'un1',  edificioId: 'e1', numero: '101', piso: 1,  tipo: 'departamento', estado: 'ocupado',    superficieM2: 65,  habitaciones: 2, banos: 1, propietarioId: 'u2', gastosComunesMonto: 95000 },
  { id: 'un2',  edificioId: 'e1', numero: '102', piso: 1,  tipo: 'departamento', estado: 'ocupado',    superficieM2: 72,  habitaciones: 2, banos: 2, propietarioId: 'u5', gastosComunesMonto: 105000 },
  { id: 'un3',  edificioId: 'e1', numero: '201', piso: 2,  tipo: 'departamento', estado: 'disponible', superficieM2: 85,  habitaciones: 3, banos: 2, gastosComunesMonto: 125000 },
  { id: 'un4',  edificioId: 'e1', numero: '202', piso: 2,  tipo: 'departamento', estado: 'ocupado',    superficieM2: 90,  habitaciones: 3, banos: 2, propietarioId: 'u6', arrendatarioId: 'u7', gastosComunesMonto: 130000 },
  { id: 'un5',  edificioId: 'e1', numero: '301', piso: 3,  tipo: 'departamento', estado: 'ocupado',    superficieM2: 65,  habitaciones: 2, banos: 1, arrendatarioId: 'u3', gastosComunesMonto: 95000 },
  { id: 'un6',  edificioId: 'e1', numero: '501', piso: 5,  tipo: 'departamento', estado: 'ocupado',    superficieM2: 110, habitaciones: 3, banos: 2, propietarioId: 'u8', gastosComunesMonto: 155000 },
  { id: 'un7',  edificioId: 'e1', numero: '502', piso: 5,  tipo: 'departamento', estado: 'ocupado',    superficieM2: 95,  habitaciones: 3, banos: 2, propietarioId: 'u9', arrendatarioId: 'u10', gastosComunesMonto: 140000 },
  { id: 'un8',  edificioId: 'e1', numero: 'B-1', piso: -1, tipo: 'bodega',       estado: 'ocupado',    superficieM2: 8,   gastosComunesMonto: 15000 },
  { id: 'un9',  edificioId: 'e1', numero: 'E-1', piso: -1, tipo: 'estacionamiento', estado: 'ocupado', superficieM2: 15,  gastosComunesMonto: 25000 },
  { id: 'un10', edificioId: 'e1', numero: 'L-1', piso: 0,  tipo: 'local_comercial', estado: 'disponible', superficieM2: 45, gastosComunesMonto: 65000 },
]

// ─── Gastos Comunes ───────────────────────────────────────────
export const mockGastosComunes: GastoComun[] = [
  { id: 'gc1', unidadId: 'un1', edificioId: 'e1', mes: 5, año: 2026, montoBase: 75000, montoAgua: 12000, montoElectricidad: 5000, montoFondoReserva: 3000, montoTotal: 95000, estadoPago: 'pagado',   fechaVencimiento: '2026-05-10', fechaPago: '2026-05-08' },
  { id: 'gc2', unidadId: 'un2', edificioId: 'e1', mes: 5, año: 2026, montoBase: 83000, montoAgua: 14000, montoElectricidad: 5000, montoFondoReserva: 3000, montoTotal: 105000, estadoPago: 'vencido',  fechaVencimiento: '2026-05-10', diasMora: 16 },
  { id: 'gc3', unidadId: 'un3', edificioId: 'e1', mes: 5, año: 2026, montoBase: 99000, montoAgua: 16000, montoElectricidad: 7000, montoFondoReserva: 3000, montoTotal: 125000, estadoPago: 'pendiente', fechaVencimiento: '2026-05-31' },
  { id: 'gc4', unidadId: 'un4', edificioId: 'e1', mes: 5, año: 2026, montoBase: 103000, montoAgua: 17000, montoElectricidad: 7000, montoFondoReserva: 3000, montoTotal: 130000, estadoPago: 'pagado',  fechaVencimiento: '2026-05-10', fechaPago: '2026-05-07' },
  { id: 'gc5', unidadId: 'un5', edificioId: 'e1', mes: 5, año: 2026, montoBase: 75000, montoAgua: 12000, montoElectricidad: 5000, montoFondoReserva: 3000, montoTotal: 95000, estadoPago: 'vencido',   fechaVencimiento: '2026-05-10', diasMora: 16 },
  { id: 'gc6', unidadId: 'un6', edificioId: 'e1', mes: 5, año: 2026, montoBase: 122000, montoAgua: 20000, montoElectricidad: 9000, montoFondoReserva: 4000, montoTotal: 155000, estadoPago: 'pagado',  fechaVencimiento: '2026-05-10', fechaPago: '2026-05-05' },
  { id: 'gc7', unidadId: 'un7', edificioId: 'e1', mes: 5, año: 2026, montoBase: 110000, montoAgua: 18000, montoElectricidad: 8000, montoFondoReserva: 4000, montoTotal: 140000, estadoPago: 'parcial', fechaVencimiento: '2026-05-10', diasMora: 16 },
]

// ─── Pagos ────────────────────────────────────────────────────
export const mockPagos: Pago[] = [
  // Mayo 2026
  { id: 'pag1',  gastoId: 'gc1', unidadId: 'un1', edificioId: 'e1', monto: 95000,  mes: 5, año: 2026, metodo: 'transferencia', estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u2',  comprobante: 'TR-20260508-001', creadoEn: '2026-05-08T10:30:00' },
  { id: 'pag2',  gastoId: 'gc4', unidadId: 'un4', edificioId: 'e1', monto: 130000, mes: 5, año: 2026, metodo: 'webpay',        estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u7',  comprobante: 'WP-20260507-045', creadoEn: '2026-05-07T14:15:00' },
  { id: 'pag3',  gastoId: 'gc6', unidadId: 'un6', edificioId: 'e1', monto: 155000, mes: 5, año: 2026, metodo: 'transferencia', estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u8',  comprobante: 'TR-20260505-089', creadoEn: '2026-05-05T09:00:00' },
  { id: 'pag4',  gastoId: 'gc7', unidadId: 'un7', edificioId: 'e1', monto: 70000,  mes: 5, año: 2026, metodo: 'efectivo',      estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u10', nota: 'Pago parcial · saldo pendiente $70.000', creadoEn: '2026-05-12T16:00:00' },
  // Abril 2026
  { id: 'pag5',  unidadId: 'un1', edificioId: 'e1', monto: 93000,  mes: 4, año: 2026, metodo: 'transferencia', estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u2',  comprobante: 'TR-20260408-012', creadoEn: '2026-04-08T11:00:00' },
  { id: 'pag6',  unidadId: 'un2', edificioId: 'e1', monto: 103000, mes: 4, año: 2026, metodo: 'webpay',        estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u5',  comprobante: 'WP-20260409-023', creadoEn: '2026-04-09T09:30:00' },
  { id: 'pag7',  unidadId: 'un4', edificioId: 'e1', monto: 128000, mes: 4, año: 2026, metodo: 'transferencia', estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u7',  comprobante: 'TR-20260407-008', creadoEn: '2026-04-07T14:00:00' },
  { id: 'pag8',  unidadId: 'un6', edificioId: 'e1', monto: 152000, mes: 4, año: 2026, metodo: 'tarjeta',       estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u8',  comprobante: 'TC-20260405-034', creadoEn: '2026-04-05T10:00:00' },
  { id: 'pag9',  unidadId: 'un7', edificioId: 'e1', monto: 137000, mes: 4, año: 2026, metodo: 'transferencia', estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u10', comprobante: 'TR-20260406-056', creadoEn: '2026-04-06T13:00:00' },
  // Marzo 2026
  { id: 'pag10', unidadId: 'un1', edificioId: 'e1', monto: 92000,  mes: 3, año: 2026, metodo: 'webpay',        estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u2',  comprobante: 'WP-20260308-078', creadoEn: '2026-03-08T09:00:00' },
  { id: 'pag11', unidadId: 'un4', edificioId: 'e1', monto: 126000, mes: 3, año: 2026, metodo: 'transferencia', estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u7',  comprobante: 'TR-20260307-034', creadoEn: '2026-03-07T15:00:00' },
  { id: 'pag12', unidadId: 'un6', edificioId: 'e1', monto: 150000, mes: 3, año: 2026, metodo: 'efectivo',      estado: 'completado', registradoPorId: 'u1', pagadoPorId: 'u8',  nota: 'Pago en efectivo en conserjería', creadoEn: '2026-03-05T11:00:00' },
]

// ─── Solicitudes de Mantención ────────────────────────────────
export const mockSolicitudes: SolicitudMantencion[] = [
  { id: 's1', unidadId: 'un2', edificioId: 'e1', titulo: 'Gotera en baño principal', descripcion: 'Hay una gotera en el techo del baño que moja el piso constantemente.', estado: 'pendiente',    prioridad: 'alta',    categoria: 'Plomería',   solicitanteId: 'u2', creadoEn: '2026-05-24T10:30:00', actualizadoEn: '2026-05-24T10:30:00' },
  { id: 's2', unidadId: 'un5', edificioId: 'e1', titulo: 'Puerta ascensor piso 3',  descripcion: 'La puerta del ascensor en el piso 3 no cierra correctamente.',         estado: 'en_progreso',  prioridad: 'urgente', categoria: 'Ascensor',   solicitanteId: 'u3', asignadoA: 'u4', creadoEn: '2026-05-23T08:00:00', actualizadoEn: '2026-05-25T09:00:00' },
  { id: 's3', unidadId: 'un1', edificioId: 'e1', titulo: 'Cambio ampolleta hall',    descripcion: 'La ampolleta del hall de entrada está fundida.',                        estado: 'resuelto',     prioridad: 'baja',    categoria: 'Electricidad', solicitanteId: 'u2', asignadoA: 'u4', creadoEn: '2026-05-20T14:00:00', actualizadoEn: '2026-05-21T11:00:00', resueltoEn: '2026-05-21T11:00:00' },
  { id: 's4', unidadId: 'un6', edificioId: 'e1', titulo: 'Ruido en cañería noche',  descripcion: 'Se escucha un ruido fuerte en las cañerías durante la noche.',           estado: 'pendiente',    prioridad: 'media',   categoria: 'Plomería',   solicitanteId: 'u2', creadoEn: '2026-05-25T22:00:00', actualizadoEn: '2026-05-25T22:00:00' },
  { id: 's5', unidadId: 'un4', edificioId: 'e1', titulo: 'Pintura corredor piso 2', descripcion: 'La pintura del corredor del piso 2 está descascarada.',                  estado: 'pendiente',    prioridad: 'baja',    categoria: 'Mantención',  solicitanteId: 'u2', creadoEn: '2026-05-22T16:00:00', actualizadoEn: '2026-05-22T16:00:00' },
  { id: 's6', unidadId: 'un7', edificioId: 'e1', titulo: 'Termostato calefacción',  descripcion: 'El termostato de la calefacción central no responde.',                   estado: 'en_progreso',  prioridad: 'alta',    categoria: 'Climatización', solicitanteId: 'u3', asignadoA: 'u4', creadoEn: '2026-05-24T07:30:00', actualizadoEn: '2026-05-25T10:00:00' },
]

// ─── Espacios Comunes ─────────────────────────────────────────
export const mockEspacios: EspacioComun[] = [
  { id: 'esp1', edificioId: 'e1', nombre: 'Quincho A',         tipo: 'quincho',                 capacidad: 30, estado: 'disponible', requiereReserva: true, tarifaUso: 15000, descripcion: 'Quincho con parrilla y mesas para 30 personas.' },
  { id: 'esp2', edificioId: 'e1', nombre: 'Quincho B',         tipo: 'quincho',                 capacidad: 20, estado: 'reservado',  requiereReserva: true, tarifaUso: 12000, descripcion: 'Quincho techado con parrilla.' },
  { id: 'esp3', edificioId: 'e1', nombre: 'Sala Multiuso',     tipo: 'sala_multiuso',           capacidad: 50, estado: 'disponible', requiereReserva: true, tarifaUso: 10000 },
  { id: 'esp4', edificioId: 'e1', nombre: 'Lavandería Piso 1', tipo: 'lavanderia',              capacidad: 4,  estado: 'ocupado',    requiereReserva: true, tarifaUso: 2500, descripcion: '4 lavadoras y 4 secadoras.' },
  { id: 'esp5', edificioId: 'e1', nombre: 'Lavandería Piso 6', tipo: 'lavanderia',              capacidad: 4,  estado: 'disponible', requiereReserva: true, tarifaUso: 2500 },
  { id: 'esp6', edificioId: 'e1', nombre: 'Gimnasio',          tipo: 'gimnasio',                capacidad: 15, estado: 'disponible', requiereReserva: false },
  { id: 'esp7', edificioId: 'e1', nombre: 'Piscina',           tipo: 'piscina',                 capacidad: 20, estado: 'fuera_servicio', requiereReserva: false, descripcion: 'En mantención hasta el 01/06/2026.' },
  { id: 'esp8', edificioId: 'e1', nombre: 'Sala de Reuniones', tipo: 'sala_reuniones',          capacidad: 12, estado: 'disponible', requiereReserva: true },
  { id: 'esp9', edificioId: 'e1', nombre: 'Estac. Visitas',    tipo: 'estacionamiento_visitas', capacidad: 5,  estado: 'ocupado',    requiereReserva: true },
]

// ─── Reservas ─────────────────────────────────────────────────
export const mockReservas: Reserva[] = [
  { id: 'r1', espacioId: 'esp1', unidadId: 'un1', usuarioId: 'u2',  fechaInicio: '2026-06-01T13:00:00', fechaFin: '2026-06-01T19:00:00', estado: 'confirmada', nota: 'Cumpleaños', creadoEn: '2026-05-20T10:00:00' },
  { id: 'r2', espacioId: 'esp2', unidadId: 'un4', usuarioId: 'u7',  fechaInicio: '2026-05-27T12:00:00', fechaFin: '2026-05-27T17:00:00', estado: 'confirmada', creadoEn: '2026-05-22T14:00:00' },
  { id: 'r3', espacioId: 'esp3', unidadId: 'un6', usuarioId: 'u8',  fechaInicio: '2026-05-28T18:00:00', fechaFin: '2026-05-28T21:00:00', estado: 'confirmada', nota: 'Reunión de trabajo', creadoEn: '2026-05-23T09:00:00' },
  { id: 'r4', espacioId: 'esp8', unidadId: 'un2', usuarioId: 'u5',  fechaInicio: '2026-05-27T09:00:00', fechaFin: '2026-05-27T11:00:00', estado: 'confirmada', creadoEn: '2026-05-24T11:00:00' },
  { id: 'r5', espacioId: 'esp4', unidadId: 'un7', usuarioId: 'u10', fechaInicio: '2026-05-27T15:00:00', fechaFin: '2026-05-27T16:00:00', estado: 'confirmada', creadoEn: '2026-05-25T08:00:00' },
]

// ─── Comunicaciones ───────────────────────────────────────────
export const mockComunicaciones: Comunicacion[] = [
  { id: 'com1', edificioId: 'e1', titulo: 'Corte de agua programado 28/05', contenido: 'Se informa que el día 28 de mayo de 10:00 a 14:00 hrs se realizará corte de agua para mantención de red.', tipo: 'urgente',     autorId: 'u1', creadoEn: '2026-05-25T09:00:00', lecturasCount: 32 },
  { id: 'com2', edificioId: 'e1', titulo: 'Asamblea Ordinaria de Copropietarios', contenido: 'Se convoca a todos los copropietarios a la Asamblea Ordinaria del día 15 de junio a las 19:00 hrs vía Zoom.', tipo: 'reunión',    autorId: 'u1', creadoEn: '2026-05-20T11:00:00', lecturasCount: 28 },
  { id: 'com3', edificioId: 'e1', titulo: 'Nuevas normas uso del quincho', contenido: 'Se recuerda que el horario máximo de uso del quincho es hasta las 23:00 hrs los días de semana y 00:00 hrs los fines de semana.', tipo: 'informativo', autorId: 'u1', creadoEn: '2026-05-15T10:00:00', lecturasCount: 40 },
  { id: 'com4', edificioId: 'e1', titulo: 'Circular gastos comunes mayo 2026', contenido: 'Se adjunta detalle de gastos comunes correspondiente al mes de mayo 2026.', tipo: 'circular',    autorId: 'u1', creadoEn: '2026-05-05T08:00:00', lecturasCount: 45 },
]

// ─── Visitas ──────────────────────────────────────────────────
export const mockVisitas: Visita[] = [
  { id: 'v1', edificioId: 'e1', unidadId: 'un1', nombreVisitante: 'Pedro Rojas',     motivoVisita: 'Visita familiar',   entradaEn: '2026-05-26T09:30:00', registradoPorId: 'u4' },
  { id: 'v2', edificioId: 'e1', unidadId: 'un5', nombreVisitante: 'Ana Soto',        motivoVisita: 'Visita de negocios', entradaEn: '2026-05-26T10:15:00', salidaEn: '2026-05-26T11:00:00', registradoPorId: 'u4' },
  { id: 'v3', edificioId: 'e1', unidadId: 'un6', nombreVisitante: 'Técnico Movistar', motivoVisita: 'Instalación internet', vehiculoPatente: 'BBCD12', entradaEn: '2026-05-26T11:00:00', registradoPorId: 'u4' },
  { id: 'v4', edificioId: 'e1', unidadId: 'un2', nombreVisitante: 'Laura Fernández', motivoVisita: 'Visita familiar',   entradaEn: '2026-05-26T14:00:00', registradoPorId: 'u4' },
]

// ─── Paquetes ─────────────────────────────────────────────────
export const mockPaquetes: Paquete[] = [
  { id: 'p1', edificioId: 'e1', unidadId: 'un1', courier: 'Chilexpress',   descripcion: 'Caja mediana',   estado: 'notificado', recibidoEn: '2026-05-26T09:00:00', codigoRetiro: '4521' },
  { id: 'p2', edificioId: 'e1', unidadId: 'un4', courier: 'Starken',       descripcion: 'Sobre pequeño',  estado: 'recibido',   recibidoEn: '2026-05-26T10:30:00', codigoRetiro: '7823' },
  { id: 'p3', edificioId: 'e1', unidadId: 'un7', courier: 'Correos Chile', descripcion: 'Paquete grande', estado: 'notificado', recibidoEn: '2026-05-25T15:00:00', codigoRetiro: '1149' },
  { id: 'p4', edificioId: 'e1', unidadId: 'un6', courier: 'Pedidos Ya',    descripcion: 'Comida',         estado: 'retirado',   recibidoEn: '2026-05-26T12:00:00', retiradoEn: '2026-05-26T12:10:00', codigoRetiro: '3392' },
]

// ─── Dashboard KPIs ───────────────────────────────────────────
export const mockKPIs: DashboardKPIs = {
  totalUnidades: 48,
  unidadesOcupadas: 44,
  morosos: 12,
  montoMoroso: 1_845_000,
  solicitudesPendientes: 7,
  ingresosMes: 4_250_000,
  fondoReserva: 15_800_000,
  visitasHoy: 4,
  paquetesPendientes: 3,
  reservasHoy: 5,
}

// ─── Actividad Reciente ───────────────────────────────────────
export const mockActividad: ActividadReciente[] = [
  { id: 'a1', tipo: 'pago',      titulo: 'Pago recibido',          descripcion: 'Gastos comunes mayo pagados',       tiempo: 'hace 12 min',  unidad: 'Depto 501', monto: 155000 },
  { id: 'a2', tipo: 'solicitud', titulo: 'Nueva solicitud urgente', descripcion: 'Puerta ascensor piso 3 no cierra', tiempo: 'hace 35 min',  unidad: 'Área común' },
  { id: 'a3', tipo: 'paquete',   titulo: 'Paquete recibido',        descripcion: 'Chilexpress — caja mediana',       tiempo: 'hace 1 hora',  unidad: 'Depto 101' },
  { id: 'a4', tipo: 'circular',  titulo: 'Circular enviada',        descripcion: 'Corte de agua 28/05 — 48 residentes notificados', tiempo: 'hace 2 horas' },
  { id: 'a5', tipo: 'visita',    titulo: 'Visita registrada',       descripcion: 'Técnico Movistar ingresó',         tiempo: 'hace 3 horas', unidad: 'Depto 601' },
  { id: 'a6', tipo: 'mora',      titulo: 'Alerta morosidad',        descripcion: 'Depto 102 — 16 días de mora',     tiempo: 'hace 5 horas', unidad: 'Depto 102', monto: 105000 },
  { id: 'a7', tipo: 'reserva',   titulo: 'Reserva confirmada',      descripcion: 'Quincho A reservado para el 01/06', tiempo: 'hace 6 horas', unidad: 'Depto 301' },
]

// ─── Helpers ──────────────────────────────────────────────────
export const formatCLP = (monto: number): string =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)

export const getMorososCount = (): number =>
  mockGastosComunes.filter(g => g.estadoPago === 'vencido' || g.estadoPago === 'parcial').length

export const getUnidadesDisponibles = (): number =>
  mockUnidades.filter(u => u.estado === 'disponible').length
