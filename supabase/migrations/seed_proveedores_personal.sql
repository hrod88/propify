-- ============================================================
-- Propify — Seed Proveedores + Personal Mirador Sacramentinos
-- Ejecutar DESPUÉS de add_folio_emailadmin_personal.sql
-- ============================================================

DO $$
DECLARE
  v_eid TEXT;
BEGIN
  SELECT id INTO v_eid FROM edificios
    WHERE nombre ILIKE '%Mirador Sacramentinos%'
    LIMIT 1;

  IF v_eid IS NULL THEN
    RAISE NOTICE 'Edificio Mirador Sacramentinos no encontrado — abortando';
    RETURN;
  END IF;

  RAISE NOTICE 'edificioId=%', v_eid;

  -- ════════════════════════════════════════════════════════════
  -- D. PROVEEDORES
  -- ════════════════════════════════════════════════════════════
  DELETE FROM proveedores WHERE "edificioId" = v_eid;

  INSERT INTO proveedores
    (id, "edificioId", nombre, rut, categoria, contacto, telefono, email, activo, nota)
  VALUES
    -- Servicios básicos
    (gen_random_uuid()::text, v_eid, 'Enel Distribución Chile SA',         NULL, 'Electricidad',      NULL, NULL, NULL, true, 'Suministro eléctrico espacios comunes'),
    (gen_random_uuid()::text, v_eid, 'Aguas Andinas',                      NULL, 'Agua Fría',         NULL, NULL, NULL, true, 'Agua potable sala basura y piso N°19'),
    (gen_random_uuid()::text, v_eid, 'Metrogas',                           NULL, 'Gas / Calefacción', NULL, NULL, NULL, true, 'Suministro gas natural agua caliente'),
    (gen_random_uuid()::text, v_eid, 'ENTEL',                              NULL, 'Comunicaciones',    NULL, NULL, NULL, true, 'Telefonía e internet conserjería'),

    -- Administración y gestión
    (gen_random_uuid()::text, v_eid, 'Soluciones Integrales de Chile SPA', NULL, 'Administración',    NULL, NULL, NULL, true, 'Honorario administrador del edificio — Adan Jose Caicedo Herrera'),
    (gen_random_uuid()::text, v_eid, 'Mariano Alberto Troncoso Riveros',   NULL, 'Contabilidad',      NULL, NULL, NULL, true, 'Asesoría integral laboral y contable mensual'),
    (gen_random_uuid()::text, v_eid, 'Osvaldo Garay',                      NULL, 'Contabilidad',      NULL, NULL, NULL, true, 'Asesoría legal/notarial enero 2026'),
    (gen_random_uuid()::text, v_eid, 'Previred',                           NULL, 'Administración',    NULL, NULL, NULL, true, 'Pago cotizaciones previsionales personal planta'),
    (gen_random_uuid()::text, v_eid, 'Victoria S.A',                       NULL, 'Administración',    NULL, NULL, NULL, true, 'Mantención reloj control y asistencia personal'),
    (gen_random_uuid()::text, v_eid, 'Comunidad Feliz SPA',                NULL, 'Otros',             NULL, NULL, NULL, true, 'Plataforma software gestión comunidad (cuota mensual)'),

    -- Mantenimiento y seguridad
    (gen_random_uuid()::text, v_eid, 'Luis Soto Espinoza',                 NULL, 'Mantenimiento',     NULL, NULL, NULL, true, 'Seguridad electrónica, CCTV, citofonía, portero automático'),
    (gen_random_uuid()::text, v_eid, 'Quality Tech',                       NULL, 'Ascensores',        NULL, NULL, NULL, true, 'Mantención mensual ascensores'),
    (gen_random_uuid()::text, v_eid, 'HIDROTANQUES SERVICIOS SPA',         NULL, 'Mantenimiento',     NULL, NULL, NULL, true, 'Calderas, bombas, reparaciones sala de bombas HET-722'),
    (gen_random_uuid()::text, v_eid, 'BID Servicios Integrales',           NULL, 'Reparaciones',      NULL, NULL, NULL, true, 'Reparaciones infraestructura, bajadas de agua, CCTV'),
    (gen_random_uuid()::text, v_eid, 'Ossa Sistema Contra Incendios',      NULL, 'Extintores',        NULL, NULL, NULL, true, 'Instalación y mantención sistema contra incendios'),

    -- Limpieza y control
    (gen_random_uuid()::text, v_eid, 'Be Clean SPA',                       NULL, 'Control de Plagas', NULL, NULL, NULL, true, 'Fumigación, sanitización y desratización mensual'),
    (gen_random_uuid()::text, v_eid, 'Equality Chile SPA',                 NULL, 'Limpieza',          NULL, NULL, NULL, true, 'Artículos de aseo, librería oficina administración'),
    (gen_random_uuid()::text, v_eid, 'Limpieza Verde SPA',                 NULL, 'Limpieza',          NULL, NULL, NULL, true, 'Contenedores basura y artículos de limpieza espacios comunes'),

    -- Jardín y exterior
    (gen_random_uuid()::text, v_eid, 'Juan Carlos Arancibia Avedano',      NULL, 'Jardín',            NULL, NULL, NULL, true, 'Mantención jardín y áreas verdes mensual'),
    (gen_random_uuid()::text, v_eid, 'Pedro Morales Saavedra',             NULL, 'Jardín',            NULL, NULL, NULL, true, 'Instalación riego aspersión, reparaciones menores'),

    -- Portería y mensajería
    (gen_random_uuid()::text, v_eid, 'Juan Carlos Lueiza',                 NULL, 'Portería',          NULL, NULL, NULL, true, 'Distribución correspondencia Correos Chile'),

    -- Seguros
    (gen_random_uuid()::text, v_eid, 'Sura Seguros Generales',             NULL, 'Seguros',           NULL, NULL, NULL, true, 'Póliza seguro edificio Mirador Sacramentinos — 11 cuotas'),

    -- Materiales y varios
    (gen_random_uuid()::text, v_eid, 'Sodimac',                            NULL, 'Mantenimiento',     NULL, NULL, NULL, true, 'Materiales, herramientas, insumos jardinería y eléctricos'),
    (gen_random_uuid()::text, v_eid, 'ODIHNX SPA',                        NULL, 'Otros',             NULL, NULL, NULL, true, 'Arriendo lockers inteligentes 16 casillas (mensual)'),
    (gen_random_uuid()::text, v_eid, 'Decosuite Limitada',                 NULL, 'Otros',             NULL, NULL, NULL, true, 'Decoración y mobiliario: cortinas roller conserjería'),
    (gen_random_uuid()::text, v_eid, 'Grafica Letrilandia Ltda.',          NULL, 'Otros',             NULL, NULL, NULL, true, 'Señalética, numerales adhesivos, rótulos');

  RAISE NOTICE 'Proveedores insertados OK';

  -- ════════════════════════════════════════════════════════════
  -- C. PERSONAL DEL EDIFICIO
  -- ════════════════════════════════════════════════════════════
  DELETE FROM personal_edificio WHERE "edificioId" = v_eid;

  INSERT INTO personal_edificio
    (id, "edificioId", nombre, apellido, cargo, "tipoContrato", activo, nota)
  VALUES
    -- ── Finiquitados ─────────────────────────────────────────
    (gen_random_uuid()::text, v_eid, 'Matías Ignacio', 'Abreu Rojas',
     'Personal de Planta', 'finiquitado', false,
     'Finiquitado abril 2026 — liquidación $1.607'),

    -- ── Part-Time conocidos (desde PDFs) ─────────────────────
    (gen_random_uuid()::text, v_eid, 'Deibys', 'Garcia Vergara',
     'Personal Part-Time', 'part-time', true,
     'Part-time activo desde abril 2026'),
    (gen_random_uuid()::text, v_eid, 'Yohanny', 'Camacaro Mendez',
     'Personal Part-Time', 'part-time', true,
     'Part-time activo desde abril 2026'),

    -- ── Personal de Planta (12 activos — nombres no disponibles en PDFs) ──
    -- Los PDFs registran "13 empleados enero/febrero", "12 empleados marzo/abril"
    -- Actualizar con nombres reales cuando estén disponibles
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 01', 'Conserje Jefe',       'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 02', 'Conserje',            'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 03', 'Conserje',            'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 04', 'Conserje',            'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 05', 'Aseo y Limpieza',     'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 06', 'Aseo y Limpieza',     'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 07', 'Aseo y Limpieza',     'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 08', 'Jardinero',           'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 09', 'Mantenimiento',       'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 10', 'Mantenimiento',       'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 11', 'Portería',            'planta', true, 'Actualizar con nombre real'),
    (gen_random_uuid()::text, v_eid, 'Empleado',  'Planta 12', 'Administración',      'planta', true, 'Actualizar con nombre real');

  RAISE NOTICE 'Personal insertado OK (1 finiquitado + 2 part-time + 12 planta)';
  RAISE NOTICE 'Seed proveedores + personal completado OK';
END $$;
