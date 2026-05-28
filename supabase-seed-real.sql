-- ═══════════════════════════════════════════════════════════════
-- PROPIFY — Limpieza de datos ficticios + Edificio real
-- Edificio: Mirador Sacramentinos 297
-- ───────────────────────────────────────────────────────────────
-- INSTRUCCIONES:
--   1. Ir a https://app.supabase.com → tu proyecto → SQL Editor
--   2. Pegar este script completo → Run
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. LIMPIAR TODOS LOS DATOS EXISTENTES ───────────────────
-- (en orden inverso de dependencias FK)
DELETE FROM novedades;
DELETE FROM actas;
DELETE FROM contratos;
DELETE FROM generaciones_facturacion;
DELETE FROM config_facturacion;
DELETE FROM presupuestos;
DELETE FROM proveedores;
DELETE FROM egresos_comunidad;
DELETE FROM reservas;
DELETE FROM espacios_comunes;
DELETE FROM paquetes;
DELETE FROM visitas;
DELETE FROM comunicaciones;
DELETE FROM solicitudes;
DELETE FROM pagos;
DELETE FROM gastos_comunes;
DELETE FROM unidades;
DELETE FROM suscripciones;
DELETE FROM usuarios;
DELETE FROM edificios;

-- ─── 2. INSERTAR EDIFICIO REAL ───────────────────────────────
INSERT INTO edificios (
  id,
  nombre,
  direccion,
  comuna,
  ciudad,
  "totalUnidades",
  pisos,
  rut,
  activo,
  "creadoEn"
) VALUES (
  'mirador-sacramentinos',
  'Mirador Sacramentinos 297',
  'Sacramentinos 297',
  'Santiago',
  'Santiago',
  0,   -- se actualizará a medida que se agreguen departamentos
  19,
  '65.018.713-K',
  true,
  NOW()::text
);

-- ─── 3. INSERTAR USUARIO ADMINISTRADOR ───────────────────────
-- Vincula tu cuenta Supabase Auth real con el edificio
INSERT INTO usuarios (
  id,
  nombre,
  apellido,
  email,
  rol,
  "edificioId",
  activo,
  "creadoEn"
)
SELECT
  au.id::text,
  'Rodrigo',
  '',
  'rorro88as@gmail.com',
  'administrador',
  'mirador-sacramentinos',
  true,
  NOW()::text
FROM auth.users au
WHERE au.email = 'rorro88as@gmail.com';

-- ─── 4. VERIFICAR ────────────────────────────────────────────
SELECT 'EDIFICIO' as tipo, id, nombre, direccion, rut, pisos FROM edificios;
SELECT 'USUARIO' as tipo, id, nombre, email, rol, "edificioId" FROM usuarios;
