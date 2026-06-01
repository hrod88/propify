-- ============================================================
-- Propify — A+B+C: folio, emailAdmin, tabla personal_edificio
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- ── A. folioBoleta + folioUltimoPago en gastos_comunes ───────
ALTER TABLE gastos_comunes
  ADD COLUMN IF NOT EXISTS "folioBoleta"     TEXT,
  ADD COLUMN IF NOT EXISTS "folioUltimoPago" TEXT;

-- ── B. emailAdmin en edificios ───────────────────────────────
ALTER TABLE edificios
  ADD COLUMN IF NOT EXISTS "emailAdmin" TEXT;

-- ── C. Tabla personal del edificio (RRHH) ────────────────────
CREATE TABLE IF NOT EXISTS personal_edificio (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"      TEXT NOT NULL REFERENCES edificios(id) ON DELETE CASCADE,
  nombre            TEXT NOT NULL,
  apellido          TEXT NOT NULL DEFAULT '',
  cargo             TEXT NOT NULL DEFAULT 'Personal de Planta',
  "tipoContrato"    TEXT NOT NULL DEFAULT 'planta',
  -- planta | part-time | honorario | finiquitado
  rut               TEXT,
  "fechaIngreso"    DATE,
  "fechaFiniquito"  DATE,
  sueldo            NUMERIC(12,2),
  activo            BOOLEAN NOT NULL DEFAULT true,
  nota              TEXT,
  "creadoEn"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_edificio_id
  ON personal_edificio("edificioId");

CREATE INDEX IF NOT EXISTS idx_personal_edificio_tipo
  ON personal_edificio("edificioId", "tipoContrato");

-- RLS
ALTER TABLE personal_edificio ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  BEGIN
    CREATE POLICY "anon_all_personal_edificio"
      ON personal_edificio FOR ALL TO anon
      USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    CREATE POLICY "auth_all_personal_edificio"
      ON personal_edificio FOR ALL TO authenticated
      USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
