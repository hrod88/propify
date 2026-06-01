-- ============================================================
-- Propify — RLS real por edificio (multi-tenant isolation)
-- Ejecutar en Supabase → SQL Editor
--
-- Reemplaza las políticas USING(true) por restricciones reales:
-- cada usuario autenticado solo ve datos de su propio edificio.
-- ============================================================

-- ─── 1. Función helper SECURITY DEFINER ───────────────────────
-- Retorna el edificioId del usuario autenticado (vía auth.email()).
-- SECURITY DEFINER → corre con privilegios del owner, bypaseando
-- RLS sobre la tabla usuarios para evitar recursión infinita.
CREATE OR REPLACE FUNCTION get_user_edificio_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "edificioId" FROM usuarios WHERE email = auth.email() LIMIT 1
$$;

-- ─── 2. Limpiar políticas permisivas anon_all_* / auth_all_* ──
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (policyname LIKE 'anon_all_%' OR policyname LIKE 'auth_all_%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ─── 3. edificios ──────────────────────────────────────────────
ALTER TABLE edificios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_edificios"   ON edificios;
DROP POLICY IF EXISTS "anon_sel_edificios" ON edificios;

-- Autenticados: solo su propio edificio
CREATE POLICY "tenant_edificios" ON edificios
  FOR ALL TO authenticated
  USING (id = get_user_edificio_id())
  WITH CHECK (id = get_user_edificio_id());

-- Anon: lectura libre (portal de pagos muestra nombre/banco del edificio)
CREATE POLICY "anon_sel_edificios" ON edificios
  FOR SELECT TO anon USING (true);

-- ─── 4. usuarios ───────────────────────────────────────────────
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_usuarios" ON usuarios;

-- Autenticados: solo usuarios del mismo edificio
CREATE POLICY "tenant_usuarios" ON usuarios
  FOR ALL TO authenticated
  USING ("edificioId" = get_user_edificio_id())
  WITH CHECK ("edificioId" = get_user_edificio_id());

-- ─── 5. gastos_comunes ─────────────────────────────────────────
ALTER TABLE gastos_comunes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_gastos_comunes" ON gastos_comunes;
DROP POLICY IF EXISTS "anon_sel_gastos"       ON gastos_comunes;

CREATE POLICY "tenant_gastos_comunes" ON gastos_comunes
  FOR ALL TO authenticated
  USING ("edificioId" = get_user_edificio_id())
  WITH CHECK ("edificioId" = get_user_edificio_id());

-- Anon: lectura libre (portal /portal/pagar/[id] es público)
CREATE POLICY "anon_sel_gastos" ON gastos_comunes
  FOR SELECT TO anon USING (true);

-- ─── 6. unidades ───────────────────────────────────────────────
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_unidades"   ON unidades;
DROP POLICY IF EXISTS "anon_sel_unidades" ON unidades;

CREATE POLICY "tenant_unidades" ON unidades
  FOR ALL TO authenticated
  USING ("edificioId" = get_user_edificio_id())
  WITH CHECK ("edificioId" = get_user_edificio_id());

-- Anon: lectura libre (portal muestra datos de la unidad)
CREATE POLICY "anon_sel_unidades" ON unidades
  FOR SELECT TO anon USING (true);

-- ─── 7. Tablas con edificioId directo — solo authenticated ─────
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'pagos','solicitudes','espacios_comunes',
    'paquetes','comunicaciones','visitas','amenidades','egresos_comunidad',
    'proveedores','presupuestos','config_facturacion',
    'generaciones_facturacion','contratos','actas','novedades',
    'lecturas','fondos_comunidad','suscripciones','personal_edificio'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    -- Drop si ya existe
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "tenant_%s" ON %I', tbl, tbl);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    -- Crear política tenant
    BEGIN
      EXECUTE format(
        'CREATE POLICY "tenant_%1$s" ON %1$I '
        'FOR ALL TO authenticated '
        'USING ("edificioId" = get_user_edificio_id()) '
        'WITH CHECK ("edificioId" = get_user_edificio_id())',
        tbl
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ─── 8. planes (catálogo global, sin edificioId) ───────────────
ALTER TABLE planes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_planes" ON planes;
CREATE POLICY "auth_read_planes" ON planes
  FOR SELECT TO authenticated
  USING (true);

-- ─── 9. reservas (sin edificioId directo) ──────────────────────
-- TODO: restringir via espacios_comunes.edificioId en fase siguiente
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_reservas" ON reservas;
CREATE POLICY "auth_reservas" ON reservas
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
