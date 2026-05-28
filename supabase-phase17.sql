-- ══════════════════════════════════════════════════════════════
-- PROPIFY Phase 17 — Monetización
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

-- ─── 1. TABLA planes ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS planes (
  id              TEXT PRIMARY KEY,
  nombre          TEXT NOT NULL,
  precio          INTEGER NOT NULL DEFAULT 0,       -- CLP mensual, 0 = gratuito
  "maxUnidades"   INTEGER NOT NULL DEFAULT 10,
  "maxUsuarios"   INTEGER NOT NULL DEFAULT 15,
  features        TEXT[] NOT NULL DEFAULT '{}',
  popular         BOOLEAN DEFAULT false,
  activo          BOOLEAN DEFAULT true
);

-- ─── 2. TABLA suscripciones ──────────────────────────────────

CREATE TABLE IF NOT EXISTS suscripciones (
  id               TEXT PRIMARY KEY,
  "edificioId"     TEXT NOT NULL REFERENCES edificios(id) ON DELETE CASCADE,
  "planId"         TEXT NOT NULL REFERENCES planes(id),
  estado           TEXT NOT NULL DEFAULT 'activa',   -- activa | vencida | cancelada
  "fechaInicio"    TEXT NOT NULL,
  "fechaVencimiento" TEXT,
  "creadoEn"       TEXT NOT NULL
);

-- ─── 3. RLS ──────────────────────────────────────────────────

ALTER TABLE planes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_planes"        ON planes        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "public_all_suscripciones" ON suscripciones FOR ALL TO anon USING (true) WITH CHECK (true);

-- ─── 4. SEED — 3 planes ──────────────────────────────────────

INSERT INTO planes (id, nombre, precio, "maxUnidades", "maxUsuarios", features, popular, activo) VALUES
  ('plan_free', 'Gratuito', 0, 10, 15,
    ARRAY[
      'Hasta 10 unidades',
      'Hasta 15 usuarios',
      'Gastos comunes básicos',
      'Registro de visitas',
      'Control de paquetes',
      'Soporte por email'
    ], false, true),

  ('plan_basico', 'Básico', 29990, 50, 100,
    ARRAY[
      'Hasta 50 unidades',
      'Hasta 100 usuarios',
      'Todo del plan Gratuito',
      'Invitación de residentes',
      'Comunicaciones ilimitadas',
      'Reservas de espacios',
      'Exportar CSV',
      'Soporte prioritario'
    ], true, true),

  ('plan_pro', 'Pro', 59990, 999, 9999,
    ARRAY[
      'Unidades ilimitadas',
      'Usuarios ilimitados',
      'Todo del plan Básico',
      'Múltiples edificios',
      'Asistente IA 24/7',
      'API acceso completo',
      'Reportes avanzados',
      'Soporte dedicado'
    ], false, true);

-- ─── 5. SEED — suscripción gratuita para edificios existentes ─

INSERT INTO suscripciones (id, "edificioId", "planId", estado, "fechaInicio", "creadoEn") VALUES
  ('sub_e1', 'e1', 'plan_basico', 'activa', '2026-01-01', '2026-01-01'),
  ('sub_e2', 'e2', 'plan_free',   'activa', '2026-01-01', '2026-01-01'),
  ('sub_e3', 'e3', 'plan_pro',    'activa', '2026-01-01', '2026-01-01');
