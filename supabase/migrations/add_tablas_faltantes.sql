-- ============================================================
-- Propify — Tablas faltantes (todas con IF NOT EXISTS)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- ─── pagos ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagos (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "gastoId"        TEXT REFERENCES gastos_comunes(id) ON DELETE SET NULL,
  "unidadId"       TEXT NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  "edificioId"     TEXT NOT NULL,
  monto            NUMERIC(12,2) NOT NULL,
  mes              SMALLINT NOT NULL,
  "año"            SMALLINT NOT NULL,
  metodo           TEXT NOT NULL DEFAULT 'transferencia',
  estado           TEXT NOT NULL DEFAULT 'completado',
  "registradoPorId" TEXT,
  "pagadoPorId"    TEXT,
  comprobante      TEXT,
  nota             TEXT,
  "creadoEn"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── solicitudes (mantenciones) ──────────────────────────────
CREATE TABLE IF NOT EXISTS solicitudes (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "unidadId"       TEXT NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  "edificioId"     TEXT NOT NULL,
  titulo           TEXT NOT NULL,
  descripcion      TEXT NOT NULL DEFAULT '',
  estado           TEXT NOT NULL DEFAULT 'pendiente',
  prioridad        TEXT NOT NULL DEFAULT 'media',
  categoria        TEXT NOT NULL DEFAULT 'General',
  "solicitanteId"  TEXT,
  "asignadoA"      TEXT,
  imagen           TEXT,
  "resueltoEn"     TIMESTAMPTZ,
  "creadoEn"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "actualizadoEn"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── espacios_comunes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS espacios_comunes (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"      TEXT NOT NULL,
  nombre            TEXT NOT NULL,
  tipo              TEXT NOT NULL DEFAULT 'sala_multiuso',
  capacidad         SMALLINT,
  estado            TEXT NOT NULL DEFAULT 'disponible',
  descripcion       TEXT,
  imagen            TEXT,
  "requiereReserva" BOOLEAN NOT NULL DEFAULT true,
  "tarifaUso"       NUMERIC(10,2)
);

-- ─── reservas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservas (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "espacioId"     TEXT NOT NULL REFERENCES espacios_comunes(id) ON DELETE CASCADE,
  "unidadId"      TEXT NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  "usuarioId"     TEXT,
  "fechaInicio"   TIMESTAMPTZ NOT NULL,
  "fechaFin"      TIMESTAMPTZ NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'confirmada',
  nota            TEXT,
  "creadoEn"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── paquetes (encomiendas) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS paquetes (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"     TEXT NOT NULL,
  "unidadId"       TEXT NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  courier          TEXT NOT NULL DEFAULT 'Sin especificar',
  descripcion      TEXT,
  estado           TEXT NOT NULL DEFAULT 'recibido',
  "recibidoEn"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "retiradoEn"     TIMESTAMPTZ,
  "codigoRetiro"   TEXT,
  imagen           TEXT,
  "numeroCasillero" SMALLINT
);

-- ─── amenidades ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amenidades (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId" TEXT NOT NULL,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  tipo         TEXT NOT NULL DEFAULT 'servicio',
  estado       TEXT NOT NULL DEFAULT 'disponible',
  "precioInfo" TEXT,
  contacto     TEXT,
  website      TEXT,
  ubicacion    TEXT,
  icono        TEXT
);

-- ─── proveedores ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId" TEXT NOT NULL,
  nombre       TEXT NOT NULL,
  rut          TEXT,
  categoria    TEXT NOT NULL DEFAULT 'General',
  contacto     TEXT,
  telefono     TEXT,
  email        TEXT,
  activo       BOOLEAN NOT NULL DEFAULT true,
  nota         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── presupuestos ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS presupuestos (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId" TEXT NOT NULL,
  anio         SMALLINT NOT NULL,
  categoria    TEXT NOT NULL,
  monto        NUMERIC(12,2) NOT NULL DEFAULT 0,
  nota         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── config_facturacion ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS config_facturacion (
  id                        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"              TEXT NOT NULL UNIQUE,
  "diaVencimiento"          SMALLINT NOT NULL DEFAULT 10,
  "porcentajeFondoReserva"  NUMERIC(5,2) NOT NULL DEFAULT 10,
  "autoGenerar"             BOOLEAN NOT NULL DEFAULT false,
  "diaGeneracion"           SMALLINT NOT NULL DEFAULT 1,
  "ultimaGeneracion"        DATE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── generaciones_facturacion ────────────────────────────────
CREATE TABLE IF NOT EXISTS generaciones_facturacion (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"     TEXT NOT NULL,
  mes              SMALLINT NOT NULL,
  anio             SMALLINT NOT NULL,
  "totalUnidades"  SMALLINT NOT NULL DEFAULT 0,
  "totalGenerado"  SMALLINT NOT NULL DEFAULT 0,
  "montoTotal"     NUMERIC(14,2) NOT NULL DEFAULT 0,
  "generadoPorId"  TEXT,
  "creadoEn"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── contratos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"     TEXT NOT NULL,
  "unidadId"       TEXT NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  "usuarioId"      TEXT,
  tipo             TEXT NOT NULL DEFAULT 'arriendo',
  "fechaInicio"    DATE NOT NULL,
  "fechaFin"       DATE,
  monto            NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposito         NUMERIC(12,2),
  estado           TEXT NOT NULL DEFAULT 'activo',
  observaciones    TEXT,
  "documentoUrl"   TEXT,
  "creadoEn"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "actualizadoEn"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── actas ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS actas (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"   TEXT NOT NULL,
  titulo         TEXT NOT NULL,
  fecha          DATE NOT NULL,
  tipo           TEXT NOT NULL DEFAULT 'ordinaria',
  quorum         SMALLINT NOT NULL DEFAULT 0,
  acuerdos       TEXT NOT NULL DEFAULT '',
  asistentes     TEXT NOT NULL DEFAULT '',
  estado         TEXT NOT NULL DEFAULT 'borrador',
  "creadoPorId"  TEXT,
  "creadoEn"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "actualizadoEn" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── novedades ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS novedades (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"     TEXT NOT NULL,
  titulo           TEXT NOT NULL,
  descripcion      TEXT NOT NULL DEFAULT '',
  categoria        TEXT NOT NULL DEFAULT 'otro',
  prioridad        TEXT NOT NULL DEFAULT 'media',
  estado           TEXT NOT NULL DEFAULT 'abierto',
  "reportadoPorId" TEXT,
  "creadoEn"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "cerradoEn"      TIMESTAMPTZ
);

-- ─── planes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planes (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nombre         TEXT NOT NULL,
  precio         NUMERIC(12,2) NOT NULL DEFAULT 0,
  "maxUnidades"  SMALLINT NOT NULL DEFAULT 50,
  "maxUsuarios"  SMALLINT NOT NULL DEFAULT 10,
  features       JSONB NOT NULL DEFAULT '[]',
  popular        BOOLEAN NOT NULL DEFAULT false,
  activo         BOOLEAN NOT NULL DEFAULT true
);

-- ─── suscripciones ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suscripciones (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"        TEXT NOT NULL,
  "planId"            TEXT REFERENCES planes(id),
  estado              TEXT NOT NULL DEFAULT 'activa',
  "fechaInicio"       DATE NOT NULL DEFAULT CURRENT_DATE,
  "fechaVencimiento"  DATE,
  "creadoEn"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS — acceso abierto anon + authenticated (igual que resto)
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'pagos','solicitudes','espacios_comunes','reservas','paquetes',
    'amenidades','proveedores','presupuestos','config_facturacion',
    'generaciones_facturacion','contratos','actas','novedades',
    'planes','suscripciones'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    BEGIN
      EXECUTE format(
        'CREATE POLICY "anon_all_%1$s" ON %1$I FOR ALL TO anon USING (true) WITH CHECK (true)', tbl
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      EXECUTE format(
        'CREATE POLICY "auth_all_%1$s" ON %1$I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
