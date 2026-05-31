-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: Lecturas de medidores, Fondos comunidad, nombreAdmin, nDoc/fecha
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── A. nombreAdmin en edificios ──────────────────────────────────────────────
ALTER TABLE edificios
  ADD COLUMN IF NOT EXISTS "nombreAdmin" TEXT;

-- ── B. nDoc y fecha en egresos_comunidad ─────────────────────────────────────
ALTER TABLE egresos_comunidad
  ADD COLUMN IF NOT EXISTS "nDoc" TEXT,
  ADD COLUMN IF NOT EXISTS fecha DATE;

-- ── C. Lecturas de medidores por unidad ──────────────────────────────────────
-- Una fila por unidad/servicio/período.
-- Si unidadId IS NULL: registro comunitario (total consumo + precio_m3 global).
CREATE TABLE IF NOT EXISTS lecturas (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "edificioId"        TEXT        NOT NULL REFERENCES edificios(id) ON DELETE CASCADE,
  "unidadId"          UUID        REFERENCES unidades(id) ON DELETE CASCADE,
  mes                 INTEGER     NOT NULL CHECK (mes BETWEEN 1 AND 12),
  año                 INTEGER     NOT NULL,
  servicio            TEXT        NOT NULL DEFAULT 'Agua Caliente',
  "lecturaInicial"    NUMERIC(10,2),
  "lecturaFinal"      NUMERIC(10,2),
  "consumoM3"         NUMERIC(10,2),
  "precioM3"          NUMERIC(12,2),
  "porcentajeConsumo" NUMERIC(8,4),
  total               INTEGER,
  observacion         TEXT,
  "creadoEn"          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lecturas_edificio_periodo
  ON lecturas("edificioId", mes, año);
CREATE INDEX IF NOT EXISTS idx_lecturas_unidad
  ON lecturas("unidadId");

-- ── D. Fondos de la comunidad ─────────────────────────────────────────────────
-- Registra el estado mensual de cada fondo del edificio.
CREATE TABLE IF NOT EXISTS fondos_comunidad (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "edificioId"  TEXT        NOT NULL REFERENCES edificios(id) ON DELETE CASCADE,
  mes           INTEGER     NOT NULL CHECK (mes BETWEEN 1 AND 12),
  año           INTEGER     NOT NULL,
  nombre        TEXT        NOT NULL,
  cobrado       INTEGER     NOT NULL DEFAULT 0,
  ingresos      INTEGER     NOT NULL DEFAULT 0,
  egresos       INTEGER     NOT NULL DEFAULT 0,
  "saldoActual" INTEGER     NOT NULL DEFAULT 0,
  nota          TEXT,
  "creadoEn"    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fondos_edificio_periodo
  ON fondos_comunidad("edificioId", mes, año);
