-- ============================================================
-- Propify — Agregar montoMultas y notaMultas a gastos_comunes
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

ALTER TABLE gastos_comunes
  ADD COLUMN IF NOT EXISTS "montoMultas"  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS "notaMultas"   TEXT;

-- Índice opcional para consultas por unidad con multas
CREATE INDEX IF NOT EXISTS idx_gastos_comunes_multasnotnull
  ON gastos_comunes ("unidadId")
  WHERE "montoMultas" IS NOT NULL;
