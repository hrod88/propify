-- ─────────────────────────────────────────────────────────────
-- Migración: datos financieros del edificio + prorrateo unidades
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Campos de facturación en edificios
ALTER TABLE edificios
  ADD COLUMN IF NOT EXISTS banco             TEXT,
  ADD COLUMN IF NOT EXISTS "cuentaCorriente" TEXT,
  ADD COLUMN IF NOT EXISTS "emailPago"       TEXT,
  ADD COLUMN IF NOT EXISTS "telefonoAdmin"   TEXT,
  ADD COLUMN IF NOT EXISTS "horarioAdmin"    TEXT;

-- 2. Prorrateo por unidad (ej: 0.5573 = 0.5573%)
ALTER TABLE unidades
  ADD COLUMN IF NOT EXISTS prorrateo NUMERIC(8,6);

-- 3. Poblar con datos reales del Edificio Mirador Sacramentinos
UPDATE edificios
SET
  rut              = '65.018.713-K',
  banco            = 'Banco Crédito e Inversiones BCI',
  "cuentaCorriente"= '29922518',
  "emailPago"      = 'pagogastocomuncarmen297@gmail.com',
  "telefonoAdmin"  = '+56 9 3914 7492',
  "horarioAdmin"   = 'Lunes a Viernes 9:30 a 17:30 hrs'
WHERE id = 'mirador-sacramentinos';
