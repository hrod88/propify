-- ═══════════════════════════════════════════════════════════════
-- PROPIFY — Datos Reales Edificio Mirador Sacramentinos 297
-- Fuente: Liquidaciones GG.CC Enero–Abril 2026 (ComunidadFeliz)
-- RUT Edificio: 65.018.713-K
-- ───────────────────────────────────────────────────────────────
-- INSTRUCCIONES:
--   1. Ir a https://app.supabase.com → tu proyecto → SQL Editor
--   2. Pegar este script completo → Run
-- ═══════════════════════════════════════════════════════════════

-- ─── 0. ACTUALIZAR EDIFICIO ────────────────────────────────────
-- Estimado basado en prorrateo: 0.5573% × 179 ≈ 100% → ~179 unidades
UPDATE edificios
SET "totalUnidades" = 179
WHERE id = 'mirador-sacramentinos';

-- ─── 1. PROVEEDORES REALES ─────────────────────────────────────
INSERT INTO proveedores (id, "edificioId", nombre, rut, categoria, contacto, telefono, email, activo, nota, created_at) VALUES
  ('pv-01','mirador-sacramentinos','Enel Distribución Chile SA',               null,  'Electricidad',     null,                        null,         null,                              true, 'Suministro eléctrico espacios comunes',                           NOW()),
  ('pv-02','mirador-sacramentinos','Aguas Andinas',                            null,  'Agua Fría',        null,                        null,         null,                              true, 'Agua potable áreas comunes y sala de caldera',                   NOW()),
  ('pv-03','mirador-sacramentinos','Metrogas S.A',                             null,  'Gas / Calefacción',null,                        null,         null,                              true, 'Gas para calderas del sistema de agua caliente',                  NOW()),
  ('pv-04','mirador-sacramentinos','Sura Seguros Generales',                   null,  'Seguros',          null,                        null,         null,                              true, 'Póliza seguros obligatorios edificio — 11 cuotas anuales',        NOW()),
  ('pv-05','mirador-sacramentinos','Empresa Nacional de Telecomunicaciones ENTEL', null, 'Comunicaciones', null,                       null,         null,                              true, 'Telefonía e internet conserjería y oficina administración',       NOW()),
  ('pv-06','mirador-sacramentinos','Quality Tech Maintenance Service Limitada', null, 'Ascensores',       null,                        null,         null,                              true, 'Mantención mensual ascensores',                                   NOW()),
  ('pv-07','mirador-sacramentinos','HIDROTANQUES SERVICIOS SPA',               null,  'Mantenimiento',    null,                        null,         null,                              true, 'Mantención preventiva calderas, grupo electrógeno y sala bombas', NOW()),
  ('pv-08','mirador-sacramentinos','Luis Soto Espinoza',                       null,  'Mantenimiento',    null,                        null,         null,                              true, 'Sistema de seguridad electrónica',                                NOW()),
  ('pv-09','mirador-sacramentinos','Be Clean SPA',                             null,  'Control de Plagas',null,                        null,         null,                              true, 'Control de plagas mensual — fumigación, sanitización, desratización', NOW()),
  ('pv-10','mirador-sacramentinos','Juan Carlos Arancibia Avedano',            null,  'Jardín',           null,                        null,         null,                              true, 'Mantención jardín mensual',                                       NOW()),
  ('pv-11','mirador-sacramentinos','Soluciones Integrales de Chile SPA',       null,  'Administración',   'Adan Jose Caicedo Herrera', '225568281',  'adan.caicedo@servistarspa.com',   true, 'Honorario administrador mensual del edificio',                    NOW()),
  ('pv-12','mirador-sacramentinos','Mariano Alberto Troncoso Riveros',         null,  'Contabilidad',     null,                        null,         null,                              true, 'Asesoría integral laboral, contable y financiera',                NOW()),
  ('pv-13','mirador-sacramentinos','ODIHNX SPA',                               null,  'Otros',            null,                        null,         null,                              true, 'Arriendo 2 unidades lockers inteligentes de 16 casillas',         NOW()),
  ('pv-14','mirador-sacramentinos','BID Servicios Integrales SPA',             null,  'Reparaciones',     null,                        null,         null,                              true, 'Reparación y mantención bajadas de agua exteriores',              NOW()),
  ('pv-15','mirador-sacramentinos','Pedro Morales Saavedra',                   null,  'Jardín',           null,                        null,         null,                              true, 'Jardinería y sistema de riego por aspersión',                     NOW()),
  ('pv-16','mirador-sacramentinos','Juan Carlos Lueiza',                       null,  'Comunicaciones',   null,                        null,         null,                              true, 'Servicio cartero — conducción correspondencia mensual Correos Chile', NOW()),
  ('pv-17','mirador-sacramentinos','Comunidad Feliz Spa',                      null,  'Otros',            null,                        null,         null,                              true, 'Plataforma software administración — plan anual (cuotas mensuales)', NOW()),
  ('pv-18','mirador-sacramentinos','Ossa Sistema Contra Incendios SPA',        null,  'Mantenimiento',    null,                        null,         null,                              true, 'Mantención red húmeda, red seca y sistema contra incendios',      NOW())
ON CONFLICT (id) DO NOTHING;


-- ─── 2. EGRESOS REALES (Enero–Abril 2026) ──────────────────────
-- Totales exactos verificados contra liquidaciones ComunidadFeliz:
--   Enero  2026: $21.707.897
--   Febrero 2026: $21.651.842
--   Marzo  2026: $21.642.256
--   Abril  2026: $20.987.469

INSERT INTO egresos_comunidad (id, "edificioId", mes, "año", categoria, descripcion, monto, proveedor, comprobante, "creadoEn") VALUES

  -- ══════════════════════════════════════════════════════════════
  -- ENERO 2026 — Egresos comunidad: $21.707.897
  -- ══════════════════════════════════════════════════════════════
  ('eg-202601-01','mirador-sacramentinos',1,2026,
    'Administración',
    'Remuneraciones 13 trabajadores (liquidaciones + Previred)',
    8917271, 'Previred / Personal planta', null, '2026-02-15'),

  ('eg-202601-02','mirador-sacramentinos',1,2026,
    'Administración',
    'Honorario Administrador enero 2026',
    1071000, 'Soluciones Integrales de Chile SPA', '376', '2026-01-14'),

  ('eg-202601-03','mirador-sacramentinos',1,2026,
    'Administración',
    'Personal Part-Time — reemplazos vacaciones y licencias',
    980000, null, null, '2026-01-31'),

  ('eg-202601-04','mirador-sacramentinos',1,2026,
    'Administración',
    'Caja chica enero (trámites notariales, inscripción Conservador) + control reloj personal',
    296357, 'Victoria S.A', '257356', '2026-02-03'),

  ('eg-202601-05','mirador-sacramentinos',1,2026,
    'Contabilidad',
    'Asesoría legal-laboral-contable + abogados cobranza laboral + servicios jurídicos',
    1112027, 'M. Troncoso / O. Garay / A. Velásquez', null, '2026-02-09'),

  ('eg-202601-06','mirador-sacramentinos',1,2026,
    'Electricidad',
    'Boleta Enel período 31-12-2025 al 30-01-2026',
    2785449, 'Enel Distribución Chile SA', '361816748', '2026-02-09'),

  ('eg-202601-07','mirador-sacramentinos',1,2026,
    'Agua Fría',
    'Aguas Andinas — sala de basura + piso N°19',
    84720, 'Aguas Andinas', null, '2026-02-09'),

  ('eg-202601-08','mirador-sacramentinos',1,2026,
    'Mantenimiento',
    'Artículos eléctricos espacios comunes (materiales + apliques LED)',
    131780, 'Sodimac', null, '2026-02-03'),

  ('eg-202601-09','mirador-sacramentinos',1,2026,
    'Mantenimiento',
    'Mantención mensual: ascensores + seguridad electrónica + calderas/bombas',
    1815722, 'Quality Tech + Luis Soto + Hidrotanques', null, '2026-01-31'),

  ('eg-202601-10','mirador-sacramentinos',1,2026,
    'Reparaciones',
    'Reparación llave shaft piso 12 + regadores jardín + bajadas agua exteriores (cuota 1/2)',
    1513423, 'HIDROTANQUES + Pedro Morales + BID Servicios', null, '2026-02-10'),

  ('eg-202601-11','mirador-sacramentinos',1,2026,
    'Seguros',
    'Cuota N°1 de 11 — Póliza seguros obligatorios Sura Edificio Mirador',
    1196830, 'Sura Seguros Generales', '12022026', '2026-02-12'),

  ('eg-202601-12','mirador-sacramentinos',1,2026,
    'Control de Plagas',
    'Fumigación, sanitización y desratización enero 2026',
    450000, 'Be Clean SPA', '854', '2026-02-11'),

  ('eg-202601-13','mirador-sacramentinos',1,2026,
    'Jardín',
    'Instalación sistema riego por aspersión + cambio aspersores + insumos + mantención jardín',
    838615, 'Pedro Morales Saavedra + Juan C. Arancibia', null, '2026-01-31'),

  ('eg-202601-14','mirador-sacramentinos',1,2026,
    'Comunicaciones',
    'Servicio cartero enero + telefonía e internet ENTEL conserjería',
    76656, 'Juan C. Lueiza + ENTEL', '20998338', '2026-01-31'),

  ('eg-202601-15','mirador-sacramentinos',1,2026,
    'Otros',
    'Lockers inteligentes ODIHNX + plataforma ComunidadFeliz + lavado/reparación cortinas Decosuite',
    438047, 'ODIHNX + Comunidad Feliz + Decosuite', null, '2026-01-31'),

  -- ══════════════════════════════════════════════════════════════
  -- FEBRERO 2026 — Egresos comunidad: $21.651.842
  -- ══════════════════════════════════════════════════════════════
  ('eg-202602-01','mirador-sacramentinos',2,2026,
    'Administración',
    'Remuneraciones 13 trabajadores (liquidaciones + Previred)',
    9423767, 'Previred / Personal planta', null, '2026-03-09'),

  ('eg-202602-02','mirador-sacramentinos',2,2026,
    'Administración',
    'Honorario Administrador febrero 2026',
    1071000, 'Soluciones Integrales de Chile SPA', '383', '2026-02-25'),

  ('eg-202602-03','mirador-sacramentinos',2,2026,
    'Administración',
    'Personal Part-Time — reemplazos vacaciones (conserjería + aseo)',
    620000, null, null, '2026-02-28'),

  ('eg-202602-04','mirador-sacramentinos',2,2026,
    'Administración',
    'Control reloj personal servicio febrero',
    48385, 'Victoria S.A', '265449', '2026-03-05'),

  ('eg-202602-05','mirador-sacramentinos',2,2026,
    'Contabilidad',
    'Asesoría integral laboral y contable financiera febrero',
    530973, 'Mariano Alberto Troncoso Riveros', '478', '2026-02-09'),

  ('eg-202602-06','mirador-sacramentinos',2,2026,
    'Electricidad',
    'Boleta Enel período 31-01-2026 al 27-02-2026',
    2631667, 'Enel Distribución Chile SA', '363753863', '2026-03-05'),

  ('eg-202602-07','mirador-sacramentinos',2,2026,
    'Agua Fría',
    'Aguas Andinas — sala de basura + piso N°19',
    365060, 'Aguas Andinas', null, '2026-03-05'),

  ('eg-202602-08','mirador-sacramentinos',2,2026,
    'Jardín',
    'Artículos jardín: apliques LED exterior + semillas + fertilizante',
    115100, 'Sodimac', '819187257', '2026-02-16'),

  ('eg-202602-09','mirador-sacramentinos',2,2026,
    'Mantenimiento',
    'Mantención mensual: ascensores + seguridad electrónica + calderas/bombas',
    1814443, 'Quality Tech + Luis Soto + Hidrotanques', null, '2026-02-28'),

  ('eg-202602-10','mirador-sacramentinos',2,2026,
    'Reparaciones',
    'Cambio portero + central citofonía + monitores CCTV + bajadas agua exteriores (cuota 2/2)',
    2970109, 'Luis Soto Espinoza + BID Servicios Integrales', null, '2026-02-18'),

  ('eg-202602-11','mirador-sacramentinos',2,2026,
    'Seguros',
    'Cuota N°2 de 11 — Póliza seguros obligatorios Sura Edificio Mirador',
    1196830, 'Sura Seguros Generales', '11022026', '2026-02-17'),

  ('eg-202602-12','mirador-sacramentinos',2,2026,
    'Control de Plagas',
    'Fumigación, sanitización y desratización febrero 2026',
    450000, 'Be Clean SPA', '871', '2026-02-18'),

  ('eg-202602-13','mirador-sacramentinos',2,2026,
    'Comunicaciones',
    'Servicio cartero febrero + telefonía e internet ENTEL',
    76736, 'Juan C. Lueiza + ENTEL', '21144315', '2026-02-28'),

  ('eg-202602-14','mirador-sacramentinos',2,2026,
    'Otros',
    'Lockers inteligentes ODIHNX + plataforma ComunidadFeliz',
    337772, 'ODIHNX + Comunidad Feliz', null, '2026-02-28'),

  -- ══════════════════════════════════════════════════════════════
  -- MARZO 2026 — Egresos comunidad: $21.642.256
  -- ══════════════════════════════════════════════════════════════
  ('eg-202603-01','mirador-sacramentinos',3,2026,
    'Administración',
    'Remuneraciones 12 trabajadores (liquidaciones + Previred)',
    8182564, 'Previred / Personal planta', null, '2026-04-06'),

  ('eg-202603-02','mirador-sacramentinos',3,2026,
    'Administración',
    'Honorario Administrador marzo 2026',
    1071000, 'Soluciones Integrales de Chile SPA', '392', '2026-03-23'),

  ('eg-202603-03','mirador-sacramentinos',3,2026,
    'Administración',
    'Personal Part-Time — reemplazos vacaciones y ausentismo',
    425000, null, null, '2026-03-31'),

  ('eg-202603-04','mirador-sacramentinos',3,2026,
    'Administración',
    'Control reloj personal servicio marzo',
    48454, 'Victoria S.A', '273516', '2026-04-06'),

  ('eg-202603-05','mirador-sacramentinos',3,2026,
    'Contabilidad',
    'Asesoría integral laboral y contable financiera marzo',
    530973, 'Mariano Alberto Troncoso Riveros', '458', '2026-03-05'),

  ('eg-202603-06','mirador-sacramentinos',3,2026,
    'Electricidad',
    'Boleta Enel período 28-02-2026 al 31-03-2026',
    3184516, 'Enel Distribución Chile SA', '365666626', '2026-04-06'),

  ('eg-202603-07','mirador-sacramentinos',3,2026,
    'Agua Fría',
    'Aguas Andinas — sala de basura + piso N°19',
    190480, 'Aguas Andinas', null, '2026-04-06'),

  ('eg-202603-08','mirador-sacramentinos',3,2026,
    'Mantenimiento',
    'Mantención mensual ascensores + seguridad + calderas + instalación parlantes + sistema contra incendios',
    4000237, 'Quality Tech + Luis Soto + Hidrotanques + Ossa CI', null, '2026-03-31'),

  ('eg-202603-09','mirador-sacramentinos',3,2026,
    'Reparaciones',
    'Reparación sala de bombas — 50% final trabajos cotización HET-722',
    1874250, 'HIDROTANQUES SERVICIOS SPA', '467', '2026-03-10'),

  ('eg-202603-10','mirador-sacramentinos',3,2026,
    'Seguros',
    'Cuota N°3 de 11 — Póliza seguros obligatorios Sura Edificio Mirador',
    1198423, 'Sura Seguros Generales', null, '2026-04-01'),

  ('eg-202603-11','mirador-sacramentinos',3,2026,
    'Control de Plagas',
    'Fumigación, sanitización y desratización marzo 2026',
    450000, 'Be Clean SPA', '886', '2026-03-19'),

  ('eg-202603-12','mirador-sacramentinos',3,2026,
    'Jardín',
    'Mantención jardín marzo 2026',
    70796, 'Juan Carlos Arancibia Avedano', '18', '2026-03-05'),

  ('eg-202603-13','mirador-sacramentinos',3,2026,
    'Comunicaciones',
    'Servicio cartero marzo + telefonía e internet ENTEL',
    76798, 'Juan C. Lueiza + ENTEL', '21173491', '2026-03-31'),

  ('eg-202603-14','mirador-sacramentinos',3,2026,
    'Otros',
    'Lockers inteligentes ODIHNX + plataforma ComunidadFeliz',
    338765, 'ODIHNX + Comunidad Feliz', null, '2026-03-31'),

  -- ══════════════════════════════════════════════════════════════
  -- ABRIL 2026 — Egresos comunidad: $20.987.469
  -- ══════════════════════════════════════════════════════════════
  ('eg-202604-01','mirador-sacramentinos',4,2026,
    'Administración',
    'Remuneraciones 12 trabajadores + finiquito (liquidaciones + Previred)',
    9202012, 'Previred / Personal planta', null, '2026-05-15'),

  ('eg-202604-02','mirador-sacramentinos',4,2026,
    'Administración',
    'Honorario Administrador abril 2026',
    1071000, 'Soluciones Integrales de Chile SPA', '398', '2026-04-27'),

  ('eg-202604-03','mirador-sacramentinos',4,2026,
    'Administración',
    'Personal Part-Time — reemplazos conserjería (vacaciones + renuncia Abreu)',
    560000, null, null, '2026-04-30'),

  ('eg-202604-04','mirador-sacramentinos',4,2026,
    'Administración',
    'Control reloj personal + artículos de oficina administración',
    138075, 'Victoria S.A + Equality Chile SPA', '278845', '2026-04-30'),

  ('eg-202604-05','mirador-sacramentinos',4,2026,
    'Contabilidad',
    'Asesoría integral laboral y contable financiera abril',
    530973, 'Mariano Alberto Troncoso Riveros', '492', '2026-04-08'),

  ('eg-202604-06','mirador-sacramentinos',4,2026,
    'Electricidad',
    'Boleta Enel período 28-03-2026 al 30-04-2026',
    2852690, 'Enel Distribución Chile SA', '367602910', '2026-05-05'),

  ('eg-202604-07','mirador-sacramentinos',4,2026,
    'Agua Fría',
    'Aguas Andinas — sala de basura + piso N°19',
    120370, 'Aguas Andinas', null, '2026-05-05'),

  ('eg-202604-08','mirador-sacramentinos',4,2026,
    'Limpieza',
    'Artículos de aseo espacios comunes + 6 contenedores de basura',
    1870139, 'Equality Chile SPA + Limpieza Verde SPA', null, '2026-04-30'),

  ('eg-202604-09','mirador-sacramentinos',4,2026,
    'Mantenimiento',
    'Mantención mensual: ascensores + seguridad electrónica + calderas/bombas',
    1818681, 'Quality Tech + Luis Soto + Hidrotanques', null, '2026-04-30'),

  ('eg-202604-10','mirador-sacramentinos',4,2026,
    'Reparaciones',
    'Reemplazo conexiones/mangueras/válvulas sala de bombas + cañería filtración estanques',
    428400, 'HIDROTANQUES SERVICIOS SPA', null, '2026-04-30'),

  ('eg-202604-11','mirador-sacramentinos',4,2026,
    'Seguros',
    'Cuota N°4 de 11 — Póliza seguros obligatorios Sura Edificio Mirador',
    1213437, 'Sura Seguros Generales', '05052026', '2026-05-15'),

  ('eg-202604-12','mirador-sacramentinos',4,2026,
    'Control de Plagas',
    'Fumigación, sanitización y desratización abril 2026',
    450000, 'Be Clean SPA', '903', '2026-04-24'),

  ('eg-202604-13','mirador-sacramentinos',4,2026,
    'Jardín',
    'Mantención jardín abril + artículos jardinería (insecticida, cargador pilas)',
    118656, 'Juan C. Arancibia + Sodimac', null, '2026-04-30'),

  ('eg-202604-14','mirador-sacramentinos',4,2026,
    'Comunicaciones',
    'Servicio cartero abril + telefonía e internet ENTEL',
    138618, 'Juan C. Lueiza + ENTEL', '21325477', '2026-04-30'),

  ('eg-202604-15','mirador-sacramentinos',4,2026,
    'Otros',
    'Lockers ODIHNX + numerales adhesivos/letrero Grafica Letrilandia + plataforma ComunidadFeliz',
    474418, 'ODIHNX + Grafica Letrilandia + Comunidad Feliz', null, '2026-04-30')
ON CONFLICT (id) DO NOTHING;


-- ─── 3. UNIDAD 0804 ────────────────────────────────────────────
-- Prorrateo 0.5573% → estimado de 179 unidades totales
-- gastosComunesMonto: monto cobrado en abril 2026
INSERT INTO unidades (id, "edificioId", numero, piso, tipo, estado, "superficieM2", habitaciones, banos, "propietarioId", "arrendatarioId", "gastosComunesMonto") VALUES
  ('un-0804','mirador-sacramentinos','0804', 8, 'departamento', 'ocupado', null, null, null, 'u-jorge-alzamora', null, 189602)
ON CONFLICT (id) DO NOTHING;


-- ─── 4. RESIDENTE JORGE ALZAMORA ───────────────────────────────
-- Residente unidad 0804 según liquidaciones ComunidadFeliz
-- Email ficticio — actualizar cuando se tenga el real
INSERT INTO usuarios (id, nombre, apellido, email, telefono, rol, "edificioId", "unidadId", activo, "creadoEn") VALUES
  ('u-jorge-alzamora','Jorge','Alzamora Vejarez','jorge.alzamora@mirador297.cl', null, 'propietario','mirador-sacramentinos','un-0804', true, NOW())
ON CONFLICT (id) DO NOTHING;


-- ─── 5. GASTOS COMUNES — UNIDAD 0804 ───────────────────────────
-- Detalle cobrado por unidad según liquidaciones (prorrateo 0.5573%)
-- montoBase incluye GC base + cargos extra del período (multas, estacionamiento)
-- fechaPago: extraída de campo "Último pago" de la liquidación del mes siguiente
INSERT INTO gastos_comunes (id, "unidadId", "edificioId", mes, "año", "montoBase", "montoAgua", "montoFondoReserva", "montoTotal", "estadoPago", "fechaVencimiento", "fechaPago", "diasMora") VALUES
  -- Enero 2026: GC $120.978 + FR $6.049 + AC $65.553 + estacionamiento $20.000 = $212.580
  -- Pagado el 08/03/2026 (confirmado en PDF feb — último pago $212.580)
  ('gc-0804-ene','un-0804','mirador-sacramentinos', 1, 2026, 140978, 65553, 6049, 212580, 'pagado',    '2026-03-10', '2026-03-08', null),

  -- Febrero 2026: GC $120.666 + FR $6.033 + AC $54.979 + multas $159.027 = $340.705
  -- Pagado el 07/04/2026 (confirmado en PDF mar — último pago $340.705)
  ('gc-0804-feb','un-0804','mirador-sacramentinos', 2, 2026, 279693, 54979, 6033, 340705, 'pagado',    '2026-04-10', '2026-04-07', null),

  -- Marzo 2026: GC $120.612 + FR $6.031 + AC $53.191 = $179.834
  -- Pagado el 09/05/2026 (confirmado en PDF abr — último pago $179.834)
  ('gc-0804-mar','un-0804','mirador-sacramentinos', 3, 2026, 120612, 53191, 6031, 179834, 'pagado',    '2026-05-10', '2026-05-09', null),

  -- Abril 2026: GC $116.963 + FR $5.848 + AC $66.791 = $189.602
  -- Pendiente — vence 10/06/2026
  ('gc-0804-abr','un-0804','mirador-sacramentinos', 4, 2026, 116963, 66791, 5848, 189602, 'pendiente', '2026-06-10', null,         null)
ON CONFLICT (id) DO NOTHING;


-- ─── 6. PAGOS — UNIDAD 0804 ────────────────────────────────────
-- Folios de boleta confirmados en liquidaciones ComunidadFeliz
INSERT INTO pagos (id, "gastoId", "unidadId", "edificioId", monto, mes, "año", metodo, estado, "registradoPorId", "pagadoPorId", comprobante, nota, "creadoEn") VALUES
  ('pag-0804-ene','gc-0804-ene','un-0804','mirador-sacramentinos',
    212580, 1, 2026, 'transferencia', 'completado',
    'f675177e-6751-47ce-840e-f5c6a7573a0f', 'u-jorge-alzamora',
    'FOLIO-3006595', 'Boleta N°6789 — pagado 2 días antes del vencimiento', '2026-03-08'),

  ('pag-0804-feb','gc-0804-feb','un-0804','mirador-sacramentinos',
    340705, 2, 2026, 'transferencia', 'completado',
    'f675177e-6751-47ce-840e-f5c6a7573a0f', 'u-jorge-alzamora',
    'FOLIO-3006853', 'Boleta N°7048 — pagado 3 días antes del vencimiento', '2026-04-07'),

  ('pag-0804-mar','gc-0804-mar','un-0804','mirador-sacramentinos',
    179834, 3, 2026, 'transferencia', 'completado',
    'f675177e-6751-47ce-840e-f5c6a7573a0f', 'u-jorge-alzamora',
    'FOLIO-3007045', 'Boleta N°7252 — pagado 1 día antes del vencimiento', '2026-05-09')
ON CONFLICT (id) DO NOTHING;


-- ─── 8. COMUNICACIONES ────────────────────────────────────────
-- Fuente: avisos físicos en ascensores Mirador Sacramentinos
INSERT INTO comunicaciones (id, "edificioId", titulo, contenido, tipo, "autorId", "creadoEn",
  "areaAfectada", "categoriaInfo", "urlDocumento", "requiereAcuse") VALUES

  -- Circular: valores comunitarios (foto 1)
  ('com-valores',
   'mirador-sacramentinos',
   'Juntos elegimos y creamos el lugar donde queremos vivir',
   'Seguridad · Convivencia · Respeto · Comunidad.

La voluntad de nuestra comunidad expresada en las asambleas fortalece nuestro edificio y su espíritu residencial.

Entre todos, hoy y siempre. Un mejor edificio, una mejor comunidad.',
   'circular',
   'f675177e-6751-47ce-840e-f5c6a7573a0f',
   '2026-01-05T09:00:00',
   NULL, 'convivencia', NULL, false),

  -- Urgente: demanda anfitriones arriendo temporal (foto 2)
  ('com-demanda',
   'mirador-sacramentinos',
   '⚠️ Comunidad enfrenta demanda millonaria por anfitriones de arriendo temporal',
   'Mientras trabajamos por una comunidad sana, la comunidad enfrenta una demanda millonaria.

5 anfitriones de plataformas de arriendo temporal (Airbnb y similares) demandaron a nuestra comunidad por $25.000.000 (veinticinco millones de pesos).

Reglamentar no es perjudicar, es PROTEGER.
Reglamentar hoy es evitar conflictos mayores, demandas más costosas y un daño irreparable a nuestra convivencia.

La comunidad somos todos, y juntos la cuidamos.
Actuamos por el bien común. No por intereses individuales.

— Administración y Comité de Administración
  Edificio Mirador Sacramentinos',
   'urgente',
   'f675177e-6751-47ce-840e-f5c6a7573a0f',
   '2026-04-01T10:00:00',
   'Legal / Arriendo temporal', NULL, NULL, true),

  -- Informativo: uso correcto ascensor (foto 3)
  ('com-ascensor',
   'mirador-sacramentinos',
   'Uso correcto del ascensor — instrucciones y seguridad',
   'Para subir, accionar el botón de subida; para bajar, el de bajada. Apretar ambos botones sólo genera viajes innecesarios.

Si el ascensor sigue subiendo sin parar, es porque hay llamadas más arriba. Los ascensores atienden las llamadas en dirección de bajada.

Al subir y bajar, tener precaución con posibles desniveles entre cabina y piso.

En caso de quedar atrapado: no se asuste, llame por citófono y espere hasta ser rescatado. El ascensor no se cae y existe ventilación interior.

Apretar solamente el botón del piso de destino. El viaje será más rápido y se ahorra energía.

No permitir que niños jueguen o viajen solos. Pueden dañar el equipo.

No forzar, interrumpir o presionar la puerta. Al abrir, mantener las manos lejos de los bordes.

No saltar ni hacer movimientos bruscos. Observar la capacidad máxima del ascensor.

Mantenimiento: Quality Tech Maintenance Service
Antonio Varas 2615 · Ñuñoa · Santiago
Fono: (+56) 2 2974 8320 · Emergencias: (+56) 2 2264 9867',
   'informativo',
   'f675177e-6751-47ce-840e-f5c6a7573a0f',
   '2026-01-02T08:00:00',
   NULL, 'seguridad', NULL, false)
ON CONFLICT (id) DO NOTHING;


-- ─── 9. SOLICITUDES — MANTENCIÓN PREVENTIVA ASCENSORES 2026 ───
-- Fuente: Registro de Mantención Preventiva 2026 (foto 4)
-- Técnico responsable: Quality Tech Maintenance Service (pv-06)
-- unidadId NULL → mantención de área común (no pertenece a unidad específica)
INSERT INTO solicitudes (id, "unidadId", "edificioId", titulo, descripcion,
  estado, prioridad, categoria, "solicitanteId", "asignadoA", "creadoEn", "actualizadoEn", "resueltoEn") VALUES

  ('sol-mant-ene26',
   NULL, 'mirador-sacramentinos',
   'Mantención preventiva mensual — ascensores (enero 2026)',
   'Mantención preventiva realizada por Quality Tech Maintenance Service. Técnico: Fabián Soto.',
   'resuelto', 'baja', 'Ascensor',
   'f675177e-6751-47ce-840e-f5c6a7573a0f',
   'Fabián Soto — Quality Tech',
   '2026-01-16T10:00:00', '2026-01-16T12:00:00', '2026-01-16T12:00:00'),

  ('sol-mant-feb26',
   NULL, 'mirador-sacramentinos',
   'Mantención preventiva mensual — ascensores (febrero 2026)',
   'Mantención preventiva realizada por Quality Tech Maintenance Service. Técnico: Roxan Arias.',
   'resuelto', 'baja', 'Ascensor',
   'f675177e-6751-47ce-840e-f5c6a7573a0f',
   'Roxan Arias — Quality Tech',
   '2026-02-10T10:00:00', '2026-02-10T12:00:00', '2026-02-10T12:00:00'),

  ('sol-mant-mar26',
   NULL, 'mirador-sacramentinos',
   'Mantención preventiva mensual — ascensores (marzo 2026)',
   'Mantención preventiva realizada por Quality Tech Maintenance Service. Técnico: Ángel Neira.',
   'resuelto', 'baja', 'Ascensor',
   'f675177e-6751-47ce-840e-f5c6a7573a0f',
   'Ángel Neira — Quality Tech',
   '2026-03-11T10:00:00', '2026-03-11T12:00:00', '2026-03-11T12:00:00'),

  ('sol-mant-abr26',
   NULL, 'mirador-sacramentinos',
   'Mantención preventiva mensual — ascensores (abril 2026)',
   'Mantención preventiva realizada por Quality Tech Maintenance Service. Técnico: Ángel Neira.',
   'resuelto', 'baja', 'Ascensor',
   'f675177e-6751-47ce-840e-f5c6a7573a0f',
   'Ángel Neira — Quality Tech',
   '2026-04-17T10:00:00', '2026-04-17T12:00:00', '2026-04-17T12:00:00'),

  ('sol-mant-may26',
   NULL, 'mirador-sacramentinos',
   'Mantención preventiva mensual — ascensores (mayo 2026)',
   'Mantención preventiva realizada por Quality Tech Maintenance Service. Técnico: Ángel Neira.',
   'resuelto', 'baja', 'Ascensor',
   'f675177e-6751-47ce-840e-f5c6a7573a0f',
   'Ángel Neira — Quality Tech',
   '2026-05-19T10:00:00', '2026-05-19T12:00:00', '2026-05-19T12:00:00')
ON CONFLICT (id) DO NOTHING;


-- ─── 10. COLUMNAS CONTROL DE ACCESO (visitas) ─────────────────
-- Agrega campos de vehículo, método de acceso y sentido
-- Ejecutar solo una vez — IF NOT EXISTS hace la operación idempotente
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS "tipoVehiculo"   text;
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS "estacionamiento" text;
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS "tiempoEstadiaMin" integer;
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS "metodoAcceso"   text DEFAULT 'manual';
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS "sentido"        text DEFAULT 'entrada';

-- metodoAcceso: 'manual' | 'facial' | 'huella' | 'tarjeta'
-- sentido:      'entrada' | 'salida'
-- Fuente: terminal biométrico Dahua Technology en hall de ingreso


-- ─── 7. VERIFICAR ──────────────────────────────────────────────
SELECT 'EDIFICIO'         AS tabla, count(*) AS filas FROM edificios
UNION ALL
SELECT 'PROVEEDORES',     count(*) FROM proveedores
UNION ALL
SELECT 'EGRESOS',         count(*) FROM egresos_comunidad
UNION ALL
SELECT 'UNIDADES',        count(*) FROM unidades
UNION ALL
SELECT 'USUARIOS',        count(*) FROM usuarios
UNION ALL
SELECT 'GASTOS_COMUNES',  count(*) FROM gastos_comunes
UNION ALL
SELECT 'PAGOS',           count(*) FROM pagos
UNION ALL
SELECT 'COMUNICACIONES',  count(*) FROM comunicaciones
UNION ALL
SELECT 'SOLICITUDES',     count(*) FROM solicitudes;

-- ─── RESULTADO ESPERADO ────────────────────────────────────────
-- EDIFICIO         1
-- PROVEEDORES     18
-- EGRESOS         58  (15+14+14+15)
-- UNIDADES         1
-- USUARIOS         2  (Rodrigo admin + Jorge residente)
-- GASTOS_COMUNES   4  (4 meses unidad 0804)
-- PAGOS            3  (3 pagos realizados — abril pendiente)
-- COMUNICACIONES   3  (circular valores, urgente demanda, informativo ascensor)
-- SOLICITUDES      5  (mantenciones preventivas ene-may 2026 Quality Tech)
