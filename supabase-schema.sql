-- ══════════════════════════════════════════════════════════════
-- PROPIFY — Schema + Seed para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

-- ─── 1. TABLAS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS edificios (
  id                TEXT PRIMARY KEY,
  nombre            TEXT NOT NULL,
  direccion         TEXT NOT NULL,
  comuna            TEXT NOT NULL,
  ciudad            TEXT NOT NULL,
  "totalUnidades"   INTEGER DEFAULT 0,
  pisos             INTEGER DEFAULT 1,
  "anoconstruccion" INTEGER,
  "administradorId" TEXT,
  rut               TEXT,
  activo            BOOLEAN DEFAULT true,
  "creadoEn"        TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
  id           TEXT PRIMARY KEY,
  nombre       TEXT NOT NULL,
  apellido     TEXT NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  telefono     TEXT,
  rol          TEXT NOT NULL,
  "edificioId" TEXT REFERENCES edificios(id),
  "unidadId"   TEXT,
  activo       BOOLEAN DEFAULT true,
  "creadoEn"   TEXT
);

CREATE TABLE IF NOT EXISTS unidades (
  id                   TEXT PRIMARY KEY,
  "edificioId"         TEXT REFERENCES edificios(id),
  numero               TEXT NOT NULL,
  piso                 INTEGER NOT NULL,
  tipo                 TEXT NOT NULL,
  estado               TEXT NOT NULL DEFAULT 'disponible',
  "superficieM2"       NUMERIC,
  habitaciones         INTEGER,
  banos                INTEGER,
  "propietarioId"      TEXT,
  "arrendatarioId"     TEXT,
  "gastosComunesMonto" NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gastos_comunes (
  id                   TEXT PRIMARY KEY,
  "unidadId"           TEXT REFERENCES unidades(id),
  "edificioId"         TEXT REFERENCES edificios(id),
  mes                  INTEGER NOT NULL,
  "año"                INTEGER NOT NULL,
  "montoBase"          NUMERIC NOT NULL,
  "montoAgua"          NUMERIC,
  "montoElectricidad"  NUMERIC,
  "montoGas"           NUMERIC,
  "montoFondoReserva"  NUMERIC,
  "montoTotal"         NUMERIC NOT NULL,
  "estadoPago"         TEXT NOT NULL DEFAULT 'pendiente',
  "fechaVencimiento"   TEXT,
  "fechaPago"          TEXT,
  "diasMora"           INTEGER
);

CREATE TABLE IF NOT EXISTS pagos (
  id                TEXT PRIMARY KEY,
  "gastoId"         TEXT REFERENCES gastos_comunes(id),
  "unidadId"        TEXT REFERENCES unidades(id),
  "edificioId"      TEXT REFERENCES edificios(id),
  monto             NUMERIC NOT NULL,
  mes               INTEGER NOT NULL,
  "año"             INTEGER NOT NULL,
  metodo            TEXT NOT NULL,
  estado            TEXT NOT NULL DEFAULT 'completado',
  "registradoPorId" TEXT REFERENCES usuarios(id),
  "pagadoPorId"     TEXT,
  comprobante       TEXT,
  nota              TEXT,
  "creadoEn"        TEXT
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id               TEXT PRIMARY KEY,
  "unidadId"       TEXT REFERENCES unidades(id),
  "edificioId"     TEXT REFERENCES edificios(id),
  titulo           TEXT NOT NULL,
  descripcion      TEXT,
  estado           TEXT NOT NULL DEFAULT 'pendiente',
  prioridad        TEXT NOT NULL DEFAULT 'media',
  categoria        TEXT NOT NULL,
  "solicitanteId"  TEXT REFERENCES usuarios(id),
  "asignadoA"      TEXT,
  "creadoEn"       TEXT,
  "actualizadoEn"  TEXT,
  "resueltoEn"     TEXT
);

CREATE TABLE IF NOT EXISTS espacios_comunes (
  id               TEXT PRIMARY KEY,
  "edificioId"     TEXT REFERENCES edificios(id),
  nombre           TEXT NOT NULL,
  tipo             TEXT NOT NULL,
  capacidad        INTEGER,
  estado           TEXT NOT NULL DEFAULT 'disponible',
  descripcion      TEXT,
  "requiereReserva" BOOLEAN DEFAULT false,
  "tarifaUso"      NUMERIC
);

CREATE TABLE IF NOT EXISTS reservas (
  id           TEXT PRIMARY KEY,
  "espacioId"  TEXT REFERENCES espacios_comunes(id),
  "unidadId"   TEXT REFERENCES unidades(id),
  "usuarioId"  TEXT REFERENCES usuarios(id),
  "fechaInicio" TEXT NOT NULL,
  "fechaFin"   TEXT NOT NULL,
  estado       TEXT NOT NULL DEFAULT 'confirmada',
  nota         TEXT,
  "creadoEn"   TEXT
);

CREATE TABLE IF NOT EXISTS comunicaciones (
  id             TEXT PRIMARY KEY,
  "edificioId"   TEXT REFERENCES edificios(id),
  titulo         TEXT NOT NULL,
  contenido      TEXT NOT NULL,
  tipo           TEXT NOT NULL,
  "autorId"      TEXT REFERENCES usuarios(id),
  "creadoEn"     TEXT,
  "lecturasCount" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS visitas (
  id                 TEXT PRIMARY KEY,
  "edificioId"       TEXT REFERENCES edificios(id),
  "unidadId"         TEXT REFERENCES unidades(id),
  "nombreVisitante"  TEXT NOT NULL,
  "rutVisitante"     TEXT,
  "motivoVisita"     TEXT NOT NULL,
  "vehiculoPatente"  TEXT,
  "entradaEn"        TEXT NOT NULL,
  "salidaEn"         TEXT,
  "registradoPorId"  TEXT REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS paquetes (
  id             TEXT PRIMARY KEY,
  "edificioId"   TEXT REFERENCES edificios(id),
  "unidadId"     TEXT REFERENCES unidades(id),
  courier        TEXT NOT NULL,
  descripcion    TEXT,
  estado         TEXT NOT NULL DEFAULT 'recibido',
  "recibidoEn"   TEXT,
  "retiradoEn"   TEXT,
  "codigoRetiro" TEXT
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "edificioId" TEXT NOT NULL,
  tipo         TEXT NOT NULL,
  titulo       TEXT NOT NULL,
  descripcion  TEXT DEFAULT '',
  leida        BOOLEAN DEFAULT false,
  "creadoEn"   TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. RLS — Acceso público (demo sin autenticación) ─────────

ALTER TABLE edificios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_comunes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacios_comunes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicaciones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE paquetes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones    ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir todo al rol anon (demo)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['edificios','usuarios','unidades','gastos_comunes','pagos',
    'solicitudes','espacios_comunes','reservas','comunicaciones','visitas','paquetes',
    'notificaciones']
  LOOP
    EXECUTE format('CREATE POLICY "public_all_%s" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- Realtime para notificaciones (eventos en tiempo real)
ALTER TABLE notificaciones REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;

-- ─── Egresos Comunitarios (Fase 24) ───────────────────────────
CREATE TABLE egresos_comunidad (
  id                  TEXT PRIMARY KEY,
  "edificioId"        TEXT NOT NULL REFERENCES edificios(id) ON DELETE CASCADE,
  mes                 INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  "año"               INTEGER NOT NULL,
  categoria           TEXT NOT NULL,
  descripcion         TEXT,
  monto               INTEGER NOT NULL CHECK (monto > 0),
  comprobante         TEXT,
  proveedor           TEXT,
  "registradoPorId"   TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  "creadoEn"          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE egresos_comunidad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all_egresos_comunidad" ON egresos_comunidad
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── 3. SEED DATA ─────────────────────────────────────────────

-- Edificios
INSERT INTO edificios (id, nombre, direccion, comuna, ciudad, "totalUnidades", pisos, "anoconstruccion", "administradorId", rut, activo, "creadoEn") VALUES
  ('e1', 'Edificio Mirador Sacramentinos', 'Carmen 297', 'Santiago Centro', 'Santiago', 179, 20, 2015, 'u1', '65.018.713-K', true, '2024-01-01'),
  ('e2', 'Condominio Los Aromos', 'Calle Los Aromos 234', 'Ñuñoa', 'Santiago', 24, 6, 2020, 'u1', '76.234.567-8', true, '2024-01-15'),
  ('e3', 'Torre Bicentenario', 'Av. Vitacura 2939', 'Vitacura', 'Santiago', 80, 20, 2015, 'u1', '76.345.678-9', true, '2024-02-01');

-- Usuarios
INSERT INTO usuarios (id, nombre, apellido, email, telefono, rol, "edificioId", "unidadId", activo, "creadoEn") VALUES
  ('u1',  'Rodrigo',    'Administrador', 'admin@propify.cl',          '+56 9 8765 4321', 'administrador', 'e1', null,  true, '2024-01-15'),
  ('u2',  'María José', 'González',      'mariajose@gmail.com',       '+56 9 7654 3210', 'propietario',   'e1', 'un1', true, '2024-02-10'),
  ('u3',  'Carlos',     'Muñoz',         'carlos.munoz@gmail.com',    '+56 9 6543 2109', 'arrendatario',  'e1', 'un5', true, '2024-03-20'),
  ('u4',  'Juan',       'Pérez',         'juan.perez@propify.cl',     '+56 9 5432 1098', 'conserje',      'e1', null,  true, '2024-01-20'),
  ('u5',  'Roberto',    'Silva',         'roberto.silva@gmail.com',   '+56 9 4321 0987', 'propietario',   'e1', 'un2', true, '2024-02-15'),
  ('u6',  'Patricia',   'Herrera',       'patricia.h@gmail.com',      '+56 9 3210 9876', 'propietario',   'e1', 'un4', true, '2024-03-01'),
  ('u7',  'Diego',      'Ramírez',       'diego.ramirez@gmail.com',   '+56 9 2109 8765', 'arrendatario',  'e1', 'un4', true, '2024-04-01'),
  ('u8',  'Claudia',    'Torres',        'claudia.torres@gmail.com',  '+56 9 1098 7654', 'propietario',   'e1', 'un6', true, '2024-01-20'),
  ('u9',  'Felipe',     'Morales',       'felipe.m@gmail.com',        '+56 9 0987 6543', 'propietario',   'e1', 'un7', true, '2024-02-28'),
  ('u10', 'Valentina',  'Castro',        'valentina.c@gmail.com',     '+56 9 9876 5432', 'arrendatario',  'e1', 'un7', true, '2024-05-01');

-- Unidades
-- gastosComunesMonto refleja montoTotal real (base + agua + fondo reserva) según datos reales Edif. Mirador Sacramentinos
INSERT INTO unidades (id, "edificioId", numero, piso, tipo, estado, "superficieM2", habitaciones, banos, "propietarioId", "arrendatarioId", "gastosComunesMonto") VALUES
  ('un1',  'e1', '101', 1,  'departamento',       'ocupado',    65,  2, 1, 'u2',  null,  144350),
  ('un2',  'e1', '102', 1,  'departamento',       'ocupado',    72,  2, 2, 'u5',  null,  160800),
  ('un3',  'e1', '201', 2,  'departamento',       'disponible', 85,  3, 2, null,  null,  186650),
  ('un4',  'e1', '202', 2,  'departamento',       'ocupado',    90,  3, 2, 'u6',  'u7',  198000),
  ('un5',  'e1', '301', 3,  'departamento',       'ocupado',    65,  2, 1, null,  'u3',  144350),
  ('un6',  'e1', '501', 5,  'departamento',       'ocupado',    110, 3, 2, 'u8',  null,  240300),
  ('un7',  'e1', '502', 5,  'departamento',       'ocupado',    95,  3, 2, 'u9',  'u10', 207300),
  ('un8',  'e1', 'B-1', -1, 'bodega',             'ocupado',    8,   null, null, null, null, 20000),
  ('un9',  'e1', 'E-1', -1, 'estacionamiento',    'ocupado',    15,  null, null, null, null, 35000),
  ('un10', 'e1', 'L-1', 0,  'local_comercial',    'disponible', 45,  null, null, null, null, 95000);

-- Gastos Comunes
-- Montos reales basados en liquidaciones Edificio Mirador Sacramentinos (Ene–Abr 2026)
-- Fórmula: montoBase = Egresos totales × prorrateo%; Agua Caliente por m3 medido; Fondo Reserva = 5% montoBase
-- Vencimiento real: día 10 del mes 2 meses después del período cobrado (ej: mayo 2026 → 10 jul 2026)
INSERT INTO gastos_comunes (id, "unidadId", "edificioId", mes, "año", "montoBase", "montoAgua", "montoElectricidad", "montoFondoReserva", "montoTotal", "estadoPago", "fechaVencimiento", "fechaPago", "diasMora") VALUES
  -- Mayo 2026 — cobros actuales (vencen 10 julio 2026)
  ('gc1', 'un1', 'e1', 5, 2026,  87000, 53000, 0, 4350, 144350, 'pagado',    '2026-07-10', '2026-05-08', null),
  ('gc3', 'un3', 'e1', 5, 2026, 113000, 68000, 0, 5650, 186650, 'pendiente', '2026-07-10', null,         null),
  ('gc4', 'un4', 'e1', 5, 2026, 120000, 72000, 0, 6000, 198000, 'pagado',    '2026-07-10', '2026-05-07', null),
  ('gc6', 'un6', 'e1', 5, 2026, 146000, 87000, 0, 7300, 240300, 'pagado',    '2026-07-10', '2026-05-05', null),
  ('gc7', 'un7', 'e1', 5, 2026, 126000, 75000, 0, 6300, 207300, 'parcial',   '2026-07-10', null,         null),
  -- Marzo 2026 — cobros vencidos (venció 10 mayo 2026; hoy 28 mayo → 18 días mora)
  ('gc2', 'un2', 'e1', 3, 2026,  94000, 58000, 0, 4700, 156700, 'vencido',   '2026-05-10', null,         18),
  ('gc5', 'un5', 'e1', 3, 2026,  87000, 52000, 0, 4350, 143350, 'vencido',   '2026-05-10', null,         18);

-- Pagos
-- Montos actualizados para reflejar gastos reales (base + agua + fondo reserva)
INSERT INTO pagos (id, "gastoId", "unidadId", "edificioId", monto, mes, "año", metodo, estado, "registradoPorId", "pagadoPorId", comprobante, nota, "creadoEn") VALUES
  -- Mayo 2026 — pagos del mes actual
  ('pag1',  'gc1', 'un1', 'e1', 144350, 5, 2026, 'transferencia', 'completado', 'u1', 'u2',  'TR-20260508-001', null, '2026-05-08T10:30:00'),
  ('pag2',  'gc4', 'un4', 'e1', 198000, 5, 2026, 'webpay',        'completado', 'u1', 'u7',  'WP-20260507-045', null, '2026-05-07T14:15:00'),
  ('pag3',  'gc6', 'un6', 'e1', 240300, 5, 2026, 'transferencia', 'completado', 'u1', 'u8',  'TR-20260505-089', null, '2026-05-05T09:00:00'),
  ('pag4',  'gc7', 'un7', 'e1', 103600, 5, 2026, 'efectivo',      'completado', 'u1', 'u10', null, 'Pago parcial · saldo pendiente $103.700', '2026-05-12T16:00:00'),
  -- Abril 2026 — mes anterior (pagos históricos sin gasto vinculado)
  ('pag5',  null,  'un1', 'e1', 143000, 4, 2026, 'transferencia', 'completado', 'u1', 'u2',  'TR-20260408-012', null, '2026-04-08T11:00:00'),
  ('pag6',  null,  'un2', 'e1', 159000, 4, 2026, 'webpay',        'completado', 'u1', 'u5',  'WP-20260409-023', null, '2026-04-09T09:30:00'),
  ('pag7',  null,  'un4', 'e1', 196000, 4, 2026, 'transferencia', 'completado', 'u1', 'u7',  'TR-20260407-008', null, '2026-04-07T14:00:00'),
  ('pag8',  null,  'un6', 'e1', 238000, 4, 2026, 'tarjeta',       'completado', 'u1', 'u8',  'TC-20260405-034', null, '2026-04-05T10:00:00'),
  ('pag9',  null,  'un7', 'e1', 205000, 4, 2026, 'transferencia', 'completado', 'u1', 'u10', 'TR-20260406-056', null, '2026-04-06T13:00:00'),
  -- Febrero 2026 — dos meses atrás
  ('pag10', null,  'un1', 'e1', 141500, 2, 2026, 'webpay',        'completado', 'u1', 'u2',  'WP-20260308-078', null, '2026-03-08T09:00:00'),
  ('pag11', null,  'un4', 'e1', 194500, 2, 2026, 'transferencia', 'completado', 'u1', 'u7',  'TR-20260307-034', null, '2026-03-07T15:00:00'),
  ('pag12', null,  'un6', 'e1', 236000, 2, 2026, 'efectivo',      'completado', 'u1', 'u8',  null, 'Pago en efectivo en conserjería', '2026-03-05T11:00:00');

-- Solicitudes
INSERT INTO solicitudes (id, "unidadId", "edificioId", titulo, descripcion, estado, prioridad, categoria, "solicitanteId", "asignadoA", "creadoEn", "actualizadoEn", "resueltoEn") VALUES
  ('s1', 'un2', 'e1', 'Gotera en baño principal', 'Hay una gotera en el techo del baño que moja el piso constantemente.', 'pendiente',   'alta',    'Plomería',    'u2', null, '2026-05-24T10:30:00', '2026-05-24T10:30:00', null),
  ('s2', 'un5', 'e1', 'Puerta ascensor piso 3',   'La puerta del ascensor en el piso 3 no cierra correctamente.',        'en_progreso', 'urgente', 'Ascensor',    'u3', 'u4', '2026-05-23T08:00:00', '2026-05-25T09:00:00', null),
  ('s3', 'un1', 'e1', 'Cambio ampolleta hall',     'La ampolleta del hall de entrada está fundida.',                      'resuelto',    'baja',    'Electricidad','u2', 'u4', '2026-05-20T14:00:00', '2026-05-21T11:00:00', '2026-05-21T11:00:00'),
  ('s4', 'un6', 'e1', 'Ruido en cañería noche',   'Se escucha un ruido fuerte en las cañerías durante la noche.',        'pendiente',   'media',   'Plomería',    'u2', null, '2026-05-25T22:00:00', '2026-05-25T22:00:00', null),
  ('s5', 'un4', 'e1', 'Pintura corredor piso 2',  'La pintura del corredor del piso 2 está descascarada.',               'pendiente',   'baja',    'Mantención',  'u2', null, '2026-05-22T16:00:00', '2026-05-22T16:00:00', null),
  ('s6', 'un7', 'e1', 'Termostato calefacción',   'El termostato de la calefacción central no responde.',               'en_progreso', 'alta',    'Climatización','u3','u4', '2026-05-24T07:30:00', '2026-05-25T10:00:00', null);

-- Espacios Comunes
INSERT INTO espacios_comunes (id, "edificioId", nombre, tipo, capacidad, estado, descripcion, "requiereReserva", "tarifaUso") VALUES
  ('esp1', 'e1', 'Quincho A',         'quincho',                 30, 'disponible',    'Quincho con parrilla y mesas para 30 personas.', true,  15000),
  ('esp2', 'e1', 'Quincho B',         'quincho',                 20, 'reservado',     'Quincho techado con parrilla.',                  true,  12000),
  ('esp3', 'e1', 'Sala Multiuso',     'sala_multiuso',           50, 'disponible',    null,                                             true,  10000),
  ('esp4', 'e1', 'Lavandería Piso 1', 'lavanderia',              4,  'ocupado',       '4 lavadoras y 4 secadoras.',                     true,  2500),
  ('esp5', 'e1', 'Lavandería Piso 6', 'lavanderia',              4,  'disponible',    null,                                             true,  2500),
  ('esp6', 'e1', 'Gimnasio',          'gimnasio',                15, 'disponible',    null,                                             false, null),
  ('esp7', 'e1', 'Piscina',           'piscina',                 20, 'fuera_servicio','En mantención hasta el 01/06/2026.',             false, null),
  ('esp8', 'e1', 'Sala de Reuniones', 'sala_reuniones',          12, 'disponible',    null,                                             true,  null),
  ('esp9', 'e1', 'Estac. Visitas',    'estacionamiento_visitas', 5,  'ocupado',       null,                                             true,  null);

-- Reservas
INSERT INTO reservas (id, "espacioId", "unidadId", "usuarioId", "fechaInicio", "fechaFin", estado, nota, "creadoEn") VALUES
  ('r1', 'esp1', 'un1', 'u2',  '2026-06-01T13:00:00', '2026-06-01T19:00:00', 'confirmada', 'Cumpleaños',         '2026-05-20T10:00:00'),
  ('r2', 'esp2', 'un4', 'u7',  '2026-05-27T12:00:00', '2026-05-27T17:00:00', 'confirmada', null,                 '2026-05-22T14:00:00'),
  ('r3', 'esp3', 'un6', 'u8',  '2026-05-28T18:00:00', '2026-05-28T21:00:00', 'confirmada', 'Reunión de trabajo', '2026-05-23T09:00:00'),
  ('r4', 'esp8', 'un2', 'u5',  '2026-05-27T09:00:00', '2026-05-27T11:00:00', 'confirmada', null,                 '2026-05-24T11:00:00'),
  ('r5', 'esp4', 'un7', 'u10', '2026-05-27T15:00:00', '2026-05-27T16:00:00', 'confirmada', null,                 '2026-05-25T08:00:00');

-- Comunicaciones
INSERT INTO comunicaciones (id, "edificioId", titulo, contenido, tipo, "autorId", "creadoEn", "lecturasCount") VALUES
  ('com1', 'e1', 'Corte de agua programado 28/05',    'Se informa que el día 28 de mayo de 10:00 a 14:00 hrs se realizará corte de agua para mantención de red.', 'urgente',     'u1', '2026-05-25T09:00:00', 32),
  ('com2', 'e1', 'Asamblea Ordinaria de Copropietarios', 'Se convoca a todos los copropietarios a la Asamblea Ordinaria del día 15 de junio a las 19:00 hrs vía Zoom.', 'reunión', 'u1', '2026-05-20T11:00:00', 28),
  ('com3', 'e1', 'Nuevas normas uso del quincho',     'Se recuerda que el horario máximo de uso del quincho es hasta las 23:00 hrs los días de semana y 00:00 hrs los fines de semana.', 'informativo', 'u1', '2026-05-15T10:00:00', 40),
  ('com4', 'e1', 'Circular gastos comunes mayo 2026', 'Se adjunta detalle de gastos comunes correspondiente al mes de mayo 2026.', 'circular', 'u1', '2026-05-05T08:00:00', 45);

-- Visitas
INSERT INTO visitas (id, "edificioId", "unidadId", "nombreVisitante", "motivoVisita", "vehiculoPatente", "entradaEn", "salidaEn", "registradoPorId") VALUES
  ('v1', 'e1', 'un1', 'Pedro Rojas',      'Visita familiar',      null,     '2026-05-26T09:30:00', null,                  'u4'),
  ('v2', 'e1', 'un5', 'Ana Soto',         'Visita de negocios',   null,     '2026-05-26T10:15:00', '2026-05-26T11:00:00', 'u4'),
  ('v3', 'e1', 'un6', 'Técnico Movistar', 'Instalación internet', 'BBCD12', '2026-05-26T11:00:00', null,                  'u4'),
  ('v4', 'e1', 'un2', 'Laura Fernández',  'Visita familiar',      null,     '2026-05-26T14:00:00', null,                  'u4');

-- Paquetes
INSERT INTO paquetes (id, "edificioId", "unidadId", courier, descripcion, estado, "recibidoEn", "retiradoEn", "codigoRetiro") VALUES
  ('p1', 'e1', 'un1', 'Chilexpress',   'Caja mediana',   'notificado', '2026-05-26T09:00:00', null,                  '4521'),
  ('p2', 'e1', 'un4', 'Starken',       'Sobre pequeño',  'recibido',   '2026-05-26T10:30:00', null,                  '7823'),
  ('p3', 'e1', 'un7', 'Correos Chile', 'Paquete grande', 'notificado', '2026-05-25T15:00:00', null,                  '1149'),
  ('p4', 'e1', 'un6', 'Pedidos Ya',    'Comida',         'retirado',   '2026-05-26T12:00:00', '2026-05-26T12:10:00', '3392');

-- Notificaciones
INSERT INTO notificaciones ("edificioId", tipo, titulo, descripcion, leida, "creadoEn") VALUES
  ('e1', 'pago',      'Pago recibido',      'Depto 501 pagó gastos comunes de mayo',  true,  NOW() - INTERVAL '1 hour'),
  ('e1', 'solicitud', 'Solicitud urgente',  'Puerta ascensor piso 3 no cierra bien',  false, NOW() - INTERVAL '35 minutes'),
  ('e1', 'paquete',   'Nuevo paquete',      'Chilexpress para Depto 101',             false, NOW() - INTERVAL '20 minutes'),
  ('e1', 'mora',      'Alerta morosidad',   'Depto 102 — 16 días de mora',            true,  NOW() - INTERVAL '5 hours'),
  ('e1', 'circular',  'Circular enviada',   'Corte de agua programado para el 28/05', true,  NOW() - INTERVAL '2 hours');

-- Egresos Comunitarios — datos reales Edif. Mirador Sacramentinos (Ene–May 2026)
-- Total mensual ~$21.5M según liquidaciones reales (prorrateo 179 unidades)
INSERT INTO egresos_comunidad (id, "edificioId", mes, "año", categoria, monto, proveedor, comprobante) VALUES
  -- ── Enero 2026 ──────────────────────────────────────────────
  ('eg01','e1',1,2026,'Administración',    8800000,'Administradora Propify SpA',   'FAC-2026-0101'),
  ('eg02','e1',1,2026,'Portería',          2480000,'Securitas Chile',              'FAC-2026-0102'),
  ('eg03','e1',1,2026,'Electricidad',      3200000,'Enel Distribución',            'FAC-2026-0103'),
  ('eg04','e1',1,2026,'Gas / Calefacción', 1800000,'Abastible',                   'FAC-2026-0104'),
  ('eg05','e1',1,2026,'Mantenimiento',     1750000,'Mant. Integral Ltda.',         'FAC-2026-0105'),
  ('eg06','e1',1,2026,'Limpieza',          1200000,'Aseos Pro SpA',                'FAC-2026-0106'),
  ('eg07','e1',1,2026,'Seguros',           1200000,'HDI Seguros',                  'FAC-2026-0107'),
  ('eg08','e1',1,2026,'Ascensores',         380000,'Otis Elevator',                'FAC-2026-0108'),
  ('eg09','e1',1,2026,'Reparaciones',       710000,null,                           null),
  ('eg10','e1',1,2026,'Jardín',             300000,'Jardines del Sur',             'FAC-2026-0110'),
  ('eg11','e1',1,2026,'Extintores',         180000,'Fire Safe Chile',              'FAC-2026-0111'),
  -- ── Febrero 2026 ────────────────────────────────────────────
  ('eg12','e1',2,2026,'Administración',    8900000,'Administradora Propify SpA',   'FAC-2026-0201'),
  ('eg13','e1',2,2026,'Portería',          2500000,'Securitas Chile',              'FAC-2026-0202'),
  ('eg14','e1',2,2026,'Electricidad',      2600000,'Enel Distribución',            'FAC-2026-0203'),
  ('eg15','e1',2,2026,'Gas / Calefacción', 1600000,'Abastible',                   'FAC-2026-0204'),
  ('eg16','e1',2,2026,'Mantenimiento',     1800000,'Mant. Integral Ltda.',         'FAC-2026-0205'),
  ('eg17','e1',2,2026,'Limpieza',          1200000,'Aseos Pro SpA',                'FAC-2026-0206'),
  ('eg18','e1',2,2026,'Seguros',           1200000,'HDI Seguros',                  'FAC-2026-0207'),
  ('eg19','e1',2,2026,'Ascensores',         400000,'Otis Elevator',                'FAC-2026-0208'),
  ('eg20','e1',2,2026,'Reparaciones',       800000,null,                           null),
  ('eg21','e1',2,2026,'Jardín',             300000,'Jardines del Sur',             'FAC-2026-0210'),
  ('eg22','e1',2,2026,'Extintores',         200000,'Fire Safe Chile',              'FAC-2026-0211'),
  -- ── Marzo 2026 ──────────────────────────────────────────────
  ('eg23','e1',3,2026,'Administración',    8850000,'Administradora Propify SpA',   'FAC-2026-0301'),
  ('eg24','e1',3,2026,'Portería',          2500000,'Securitas Chile',              'FAC-2026-0302'),
  ('eg25','e1',3,2026,'Electricidad',      2900000,'Enel Distribución',            'FAC-2026-0303'),
  ('eg26','e1',3,2026,'Gas / Calefacción', 1550000,'Abastible',                   'FAC-2026-0304'),
  ('eg27','e1',3,2026,'Mantenimiento',     1850000,'Mant. Integral Ltda.',         'FAC-2026-0305'),
  ('eg28','e1',3,2026,'Limpieza',          1200000,'Aseos Pro SpA',                'FAC-2026-0306'),
  ('eg29','e1',3,2026,'Seguros',           1200000,'HDI Seguros',                  'FAC-2026-0307'),
  ('eg30','e1',3,2026,'Ascensores',         400000,'Otis Elevator',                'FAC-2026-0308'),
  ('eg31','e1',3,2026,'Reparaciones',       550000,null,                           null),
  ('eg32','e1',3,2026,'Jardín',             320000,'Jardines del Sur',             'FAC-2026-0310'),
  ('eg33','e1',3,2026,'Extintores',         180000,'Fire Safe Chile',              'FAC-2026-0311'),
  -- ── Abril 2026 ──────────────────────────────────────────────
  ('eg34','e1',4,2026,'Administración',    8900000,'Administradora Propify SpA',   'FAC-2026-0401'),
  ('eg35','e1',4,2026,'Portería',          2500000,'Securitas Chile',              'FAC-2026-0402'),
  ('eg36','e1',4,2026,'Electricidad',      2800000,'Enel Distribución',            'FAC-2026-0403'),
  ('eg37','e1',4,2026,'Gas / Calefacción', 1480000,'Abastible',                   'FAC-2026-0404'),
  ('eg38','e1',4,2026,'Mantenimiento',     1780000,'Mant. Integral Ltda.',         'FAC-2026-0405'),
  ('eg39','e1',4,2026,'Limpieza',          1200000,'Aseos Pro SpA',                'FAC-2026-0406'),
  ('eg40','e1',4,2026,'Seguros',           1200000,'HDI Seguros',                  'FAC-2026-0407'),
  ('eg41','e1',4,2026,'Ascensores',         420000,'Otis Elevator',                'FAC-2026-0408'),
  ('eg42','e1',4,2026,'Reparaciones',       620000,null,                           null),
  ('eg43','e1',4,2026,'Jardín',             300000,'Jardines del Sur',             'FAC-2026-0410'),
  ('eg44','e1',4,2026,'Extintores',         200000,'Fire Safe Chile',              'FAC-2026-0411'),
  -- ── Mayo 2026 ───────────────────────────────────────────────
  ('eg45','e1',5,2026,'Administración',    8900000,'Administradora Propify SpA',   'FAC-2026-0501'),
  ('eg46','e1',5,2026,'Portería',          2500000,'Securitas Chile',              'FAC-2026-0502'),
  ('eg47','e1',5,2026,'Electricidad',      2800000,'Enel Distribución',            'FAC-2026-0503'),
  ('eg48','e1',5,2026,'Gas / Calefacción', 1500000,'Abastible',                   'FAC-2026-0504'),
  ('eg49','e1',5,2026,'Mantenimiento',     1800000,'Mant. Integral Ltda.',         'FAC-2026-0505'),
  ('eg50','e1',5,2026,'Limpieza',          1200000,'Aseos Pro SpA',                'FAC-2026-0506'),
  ('eg51','e1',5,2026,'Seguros',           1200000,'HDI Seguros',                  'FAC-2026-0507'),
  ('eg52','e1',5,2026,'Ascensores',         400000,'Otis Elevator',                'FAC-2026-0508'),
  ('eg53','e1',5,2026,'Reparaciones',       700000,null,                           null),
  ('eg54','e1',5,2026,'Jardín',             300000,'Jardines del Sur',             'FAC-2026-0510'),
  ('eg55','e1',5,2026,'Extintores',         200000,'Fire Safe Chile',              'FAC-2026-0511');
