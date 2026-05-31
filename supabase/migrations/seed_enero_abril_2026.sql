-- ============================================================
-- Propify — Seed datos reales Mirador Sacramentinos Ene–Abr 2026
-- Fuente: Liquidaciones GG.CC. Comunidad Feliz (PDFs)
-- Ejecutar DESPUÉS de add_montoMultas_gastos.sql
-- ============================================================

DO $$
DECLARE
  v_eid   TEXT;  -- edificioId
  v_u0804 TEXT;  -- unidadId de 0804
BEGIN

  -- ── 1. Obtener IDs ────────────────────────────────────────────
  SELECT id INTO v_eid FROM edificios
    WHERE nombre ILIKE '%Mirador Sacramentinos%'
    LIMIT 1;

  IF v_eid IS NULL THEN
    v_eid := 'mirador-sacramentinos';
  END IF;

  SELECT id INTO v_u0804 FROM unidades
    WHERE "edificioId" = v_eid AND numero = '0804'
    LIMIT 1;

  RAISE NOTICE 'edificioId=%  unidad0804=%', v_eid, v_u0804;

  -- ════════════════════════════════════════════════════════════
  -- 2. EGRESOS COMUNIDAD (por categoría, 1 fila por categoría/mes)
  --    Totales extraídos directamente de los PDFs
  -- ════════════════════════════════════════════════════════════

  -- Limpiar egresos existentes de estos 4 meses para evitar duplicados
  DELETE FROM egresos_comunidad
    WHERE "edificioId" = v_eid
      AND mes IN (1,2,3,4)
      AND año = 2026;

  -- ── ENERO 2026 (total comunidad $21.707.897) ─────────────────
  INSERT INTO egresos_comunidad
    (id, "edificioId", mes, año, categoria, descripcion, monto, proveedor, fecha, "creadoEn")
  VALUES
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Administración',
      'Liquidaciones personal enero 2026 (13 empleados)',
      7189275, 'Personal planta Edificio', '2026-01-26', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Administración',
      'Pago Previred enero 2026',
      1727996, 'Previred', '2026-01-27', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Agua Fría',
      'Aguas Andinas sala basura + piso N°19 enero 2026',
      84720, 'Aguas Andinas', '2026-02-09', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Electricidad',
      'Enel período 31-12-2025 al 30-01-2026',
      2785449, 'Enel Distribución Chile SA', '2026-02-09', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Administración',
      'Mantenimiento reloj control personal enero 2026',
      48293, 'Victoria S.A', '2026-02-03', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Otros',
      'Materiales eléctricos + apliques LED espacios comunes',
      131780, 'Sodimac', '2026-02-11', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Otros',
      'Caja chica enero 2026 (trámites notariales, Conservador Bs Raíces)',
      248064, 'Comunidad Mirador Sacramentinos', '2026-02-16', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Portería',
      'Cartero correspondencia enero 2026 (Correos Chile)',
      40000, 'Juan Carlos Lueiza', '2026-01-22', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Otros',
      'Gastos extraordinarios: cortinas roller conserjería',
      99960, 'Decosuite Limitada', '2026-02-03', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Contabilidad',
      'Asesoría legal/contable enero 2026 (Troncoso + Garay + Velásquez)',
      1112027, 'Mariano A. Troncoso / Osvaldo Garay / A. Velásquez', '2026-02-09', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Administración',
      'Honorario Administrador enero 2026',
      1071000, 'Soluciones Integrales de Chile SPA', '2026-01-14', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Mantenimiento',
      'Seguridad electrónica + ascensores + calderas/bombas enero 2026',
      1815722, 'Luis Soto Espinoza / Quality Tech / HIDROTANQUES SPA', '2026-01-21', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Jardín',
      'Mantención jardín enero 2026',
      70796, 'Juan Carlos Arancibia Avedano', '2026-01-22', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Control de Plagas',
      'Fumigación, sanitización y desratización enero 2026',
      450000, 'Be Clean SPA', '2026-02-11', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Otros',
      'Arriendo 2 unidades lockers inteligentes 16 casillas enero 2026',
      283794, 'ODIHNX SPA', '2026-01-06', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Portería',
      'Personal Part-Time enero 2026 (4 personas)',
      980000, 'Personal Part-Time', '2026-01-27', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Reparaciones',
      'Reparaciones enero 2026 (llave shaft piso 12 + riego + bajadas agua)',
      1513423, 'HIDROTANQUES SPA / Pedro Morales / BID Servicios', '2026-02-10', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Seguros',
      'Cuota 1/11 Póliza Sura Edificio Mirador Sacramentinos enero 2026',
      1196830, 'Sura Seguros Generales', '2026-02-12', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Jardín',
      'Instalación riego aspersión + aspersor + insumos áreas verdes enero 2026',
      767819, 'Pedro Morales Saavedra / Sodimac', '2026-01-21', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Comunicaciones',
      'Telefonía e internet conserjería enero 2026',
      36656, 'ENTEL', '2026-02-03', NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Otros',
      'Uso Plataforma Comunidad Feliz (cuota 4/12)',
      54293, 'Comunidad Feliz SPA', '2025-10-10', NOW());

  -- ── FEBRERO 2026 (total comunidad $21.651.842) ───────────────
  INSERT INTO egresos_comunidad
    (id, "edificioId", mes, año, categoria, descripcion, monto, proveedor, fecha, "creadoEn")
  VALUES
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Administración',
      'Liquidaciones personal febrero 2026 (13 empleados + marzo Richomont)',
      7678242, 'Personal planta Edificio', '2026-02-25', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Administración',
      'Pago Previred febrero 2026',
      1745525, 'Previred', '2026-03-09', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Agua Fría',
      'Aguas Andinas sala basura + piso N°19 feb 2026',
      365060, 'Aguas Andinas', '2026-03-05', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Jardín',
      'Artículos jardinería (apliques LED, semillas, fertilizante) feb 2026',
      115100, 'Sodimac', '2026-02-16', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Portería',
      'Cartero correspondencia febrero 2026',
      40000, 'Juan Carlos Lueiza', '2026-03-16', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Electricidad',
      'Enel período 31-01-2026 al 27-02-2026',
      2631667, 'Enel Distribución Chile SA', '2026-03-05', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Administración',
      'Mantenimiento reloj control personal febrero 2026',
      48385, 'Victoria S.A', '2026-03-05', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Contabilidad',
      'Asesoría integral laboral y contable febrero 2026',
      530973, 'Mariano Alberto Troncoso Riveros', '2026-02-09', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Administración',
      'Honorario Administrador febrero 2026',
      1071000, 'Soluciones Integrales de Chile SPA', '2026-02-25', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Mantenimiento',
      'Seguridad electrónica + ascensores + calderas/bombas feb 2026',
      1814443, 'Luis Soto Espinoza / Quality Tech / HIDROTANQUES SPA', '2026-02-10', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Control de Plagas',
      'Fumigación, sanitización y desratización febrero 2026',
      450000, 'Be Clean SPA', '2026-02-18', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Otros',
      'Arriendo lockers inteligentes 16 casillas febrero 2026',
      283479, 'ODIHNX SPA', '2026-02-09', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Portería',
      'Personal Part-Time febrero 2026',
      620000, 'Personal Part-Time', '2026-02-24', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Reparaciones',
      'Reparaciones feb 2026: portero/citofonía + CCTV + bajadas agua (cuota 2/2)',
      2970109, 'Luis Soto Espinoza / BID Servicios Integrales', '2026-02-10', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Seguros',
      'Cuota 2/11 Póliza Sura Edificio Mirador Sacramentinos febrero 2026',
      1196830, 'Sura Seguros Generales', '2026-02-17', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Comunicaciones',
      'Telefonía e internet período 21-12-2025 al 20-01-2026',
      36736, 'ENTEL', '2026-03-06', NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Otros',
      'Uso Plataforma Comunidad Feliz (cuota 5/12)',
      54293, 'Comunidad Feliz SPA', '2025-10-10', NOW());

  -- ── MARZO 2026 (total comunidad $21.642.256) ─────────────────
  INSERT INTO egresos_comunidad
    (id, "edificioId", mes, año, categoria, descripcion, monto, proveedor, fecha, "creadoEn")
  VALUES
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Administración',
      'Liquidaciones personal marzo 2026 (12 empleados)',
      6520101, 'Personal planta Edificio', '2026-03-23', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Administración',
      'Pago Previred marzo 2026',
      1662463, 'Previred', '2026-04-06', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Agua Fría',
      'Aguas Andinas sala basura + piso N°19 marzo 2026',
      190480, 'Aguas Andinas', '2026-04-06', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Portería',
      'Cartero correspondencia marzo 2026',
      40000, 'Juan Carlos Lueiza', '2026-03-27', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Electricidad',
      'Enel período 28-02-2026 al 31-03-2026',
      3184516, 'Enel Distribución Chile SA', '2026-04-06', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Administración',
      'Mantenimiento reloj control personal marzo 2026',
      48454, 'Victoria S.A', '2026-04-06', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Otros',
      'Gastos extraordinarios: parlantes/sirenas estacionamientos + contra incendios',
      2182389, 'Luis Soto Espinoza / Ossa Sistema Contra Incendios', '2026-03-19', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Contabilidad',
      'Asesoría integral laboral y contable marzo 2026',
      530973, 'Mariano Alberto Troncoso Riveros', '2026-03-05', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Administración',
      'Honorario Administrador marzo 2026',
      1071000, 'Soluciones Integrales de Chile SPA', '2026-03-23', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Mantenimiento',
      'Seguridad electrónica + calderas/bombas + ascensores marzo 2026',
      1817848, 'Luis Soto Espinoza / HIDROTANQUES SPA / Quality Tech', '2026-03-23', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Jardín',
      'Mantención jardín marzo 2026',
      70796, 'Juan Carlos Arancibia Avedano', '2026-03-05', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Control de Plagas',
      'Fumigación, sanitización y desratización marzo 2026',
      450000, 'Be Clean SPA', '2026-03-19', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Otros',
      'Arriendo lockers inteligentes 16 casillas marzo 2026',
      284472, 'ODIHNX SPA', '2026-03-19', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Portería',
      'Personal Part-Time marzo 2026 (3 personas)',
      425000, 'Personal Part-Time', '2026-03-26', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Reparaciones',
      '50% final reparación sala de bombas HET-722',
      1874250, 'HIDROTANQUES SERVICIOS SPA', '2026-03-10', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Seguros',
      'Cuota 3/11 Póliza Sura Edificio Mirador Sacramentinos marzo 2026',
      1198423, 'Sura Seguros Generales', '2026-04-01', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Comunicaciones',
      'Telefonía e internet período 21-01-2026 al 20-02-2026',
      36798, 'ENTEL', '2026-03-10', NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Otros',
      'Uso Plataforma Comunidad Feliz (cuota 6/12)',
      54293, 'Comunidad Feliz SPA', '2025-10-10', NOW());

  -- ── ABRIL 2026 (total comunidad $20.987.469) ─────────────────
  INSERT INTO egresos_comunidad
    (id, "edificioId", mes, año, categoria, descripcion, monto, proveedor, fecha, "creadoEn")
  VALUES
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Administración',
      'Finiquito Matías Ignacio Abreu Rojas',
      1607, 'Matías Ignacio Abreu Rojas', '2026-05-11', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Administración',
      'Liquidaciones personal abril 2026 (12 empleados activos)',
      7389662, 'Personal planta Edificio', '2026-04-25', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Administración',
      'Pago Previred abril 2026',
      1810743, 'Previred', '2026-05-15', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Agua Fría',
      'Aguas Andinas sala basura + piso N°19 abril 2026',
      120370, 'Aguas Andinas', '2026-05-05', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Jardín',
      'Artículos jardinería: cargador pilas + insecticida plantas',
      36060, 'Sodimac', '2026-04-21', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Limpieza',
      'Artículos librería oficina administración',
      89298, 'Equality Chile SPA', '2026-04-17', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Limpieza',
      'Artículos de aseo espacios comunes + 6 contenedores basura',
      1870139, 'Equality Chile SPA / Limpieza Verde SPA', '2026-04-27', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Portería',
      'Cartero correspondencia abril 2026',
      40000, 'Juan Carlos Lueiza', '2026-04-21', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Electricidad',
      'Enel período 28-03-2026 al 31-04-2026',
      2852690, 'Enel Distribución Chile SA', '2026-05-05', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Administración',
      'Mantenimiento reloj control personal abril 2026',
      48777, 'Victoria S.A', '2026-05-05', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Otros',
      'Gastos extraordinarios: numerales adhesivos + letrero',
      135660, 'Grafica Letrilandia Ltda.', '2026-04-21', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Contabilidad',
      'Asesoría integral laboral y contable abril 2026',
      530973, 'Mariano Alberto Troncoso Riveros', '2026-04-08', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Administración',
      'Honorario Administrador abril 2026',
      1071000, 'Soluciones Integrales de Chile SPA', '2026-04-27', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Mantenimiento',
      'Seguridad electrónica + ascensores + calderas/bombas abril 2026',
      1818681, 'Luis Soto Espinoza / Quality Tech / HIDROTANQUES SPA', '2026-04-09', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Jardín',
      'Mantención jardín abril 2026',
      82596, 'Juan Carlos Arancibia Avedano', '2026-04-21', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Control de Plagas',
      'Fumigación, sanitización y desratización abril 2026',
      450000, 'Be Clean SPA', '2026-04-24', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Otros',
      'Arriendo lockers inteligentes 16 casillas abril 2026',
      284465, 'ODIHNX SPA', '2026-04-09', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Portería',
      'Personal Part-Time abril 2026 (2 personas)',
      560000, 'Deibys Garcia Vergara / Yohanny Camacaro Mendez', '2026-04-27', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Reparaciones',
      'Reparaciones abril 2026: mangueras sala bomba + cañería estanques',
      428400, 'HIDROTANQUES SERVICIOS SPA', '2026-05-15', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Seguros',
      'Cuota 4/11 Póliza Sura Edificio Mirador Sacramentinos abril 2026',
      1213437, 'Sura Seguros Generales', '2026-05-15', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Comunicaciones',
      'Telefonía e internet período 21-02-2026 al 20-04-2026',
      98618, 'ENTEL', '2026-05-15', NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Otros',
      'Uso Plataforma Comunidad Feliz (cuota 7/12)',
      54293, 'Comunidad Feliz SPA', '2025-10-10', NOW());

  -- ════════════════════════════════════════════════════════════
  -- 3. LECTURAS DE MEDIDORES AGUA CALIENTE (unidad 0804)
  -- ════════════════════════════════════════════════════════════
  DELETE FROM lecturas
    WHERE "edificioId" = v_eid
      AND mes IN (1,2,3,4)
      AND año = 2026
      AND servicio = 'Agua Caliente';

  INSERT INTO lecturas
    (id, "edificioId", "unidadId", mes, año, servicio,
     "lecturaInicial", "lecturaFinal", "consumoM3", "precioM3",
     "porcentajeConsumo", total, observacion, "creadoEn")
  VALUES
    -- Comunidad total enero 2026
    (gen_random_uuid()::text, v_eid, NULL, 1, 2026, 'Agua Caliente',
     NULL, NULL, 364.23, 16388.11, NULL, 5969043,
     'Total comunidad: Aguas Andinas + Metrogas. 364.23 m3 a $16.388,11/m3', NOW()),
    -- Unidad 0804 enero 2026
    (gen_random_uuid()::text, v_eid, v_u0804, 1, 2026, 'Agua Caliente',
     389.0, 393.0, 4.0, 16388.11, 1.098, 65553,
     'Lectura inicial 389 m3 → final 393 m3', NOW()),

    -- Comunidad total febrero 2026
    (gen_random_uuid()::text, v_eid, NULL, 2, 2026, 'Agua Caliente',
     NULL, NULL, 347.97, 18326.25, NULL, 6376984,
     'Total comunidad: Aguas Andinas + Metrogas. 347.97 m3 a $18.326,25/m3', NOW()),
    -- Unidad 0804 febrero 2026
    (gen_random_uuid()::text, v_eid, v_u0804, 2, 2026, 'Agua Caliente',
     393.0, 396.0, 3.0, 18326.25, 0.862, 54979,
     'Lectura inicial 393 m3 → final 396 m3', NOW()),

    -- Comunidad total marzo 2026
    (gen_random_uuid()::text, v_eid, NULL, 3, 2026, 'Agua Caliente',
     NULL, NULL, 489.392, 13297.84, NULL, 6507857,
     'Total comunidad: Aguas Andinas + Metrogas. 489.392 m3 a $13.297,84/m3', NOW()),
    -- Unidad 0804 marzo 2026
    (gen_random_uuid()::text, v_eid, v_u0804, 3, 2026, 'Agua Caliente',
     396.0, 400.0, 4.0, 13297.84, 0.817, 53191,
     'Lectura inicial 396 m3 → final 400 m3', NOW()),

    -- Comunidad total abril 2026
    (gen_random_uuid()::text, v_eid, NULL, 4, 2026, 'Agua Caliente',
     NULL, NULL, 563.06, 14271.51, NULL, 8035714,
     'Total comunidad: Aguas Andinas + Metrogas. 563.06 m3 a $14.271,51/m3', NOW()),
    -- Unidad 0804 abril 2026
    (gen_random_uuid()::text, v_eid, v_u0804, 4, 2026, 'Agua Caliente',
     400.0, 404.68, 4.68, 14271.51, 0.831, 66791,
     'Lectura inicial 400 m3 → final 404.68 m3', NOW());

  -- ════════════════════════════════════════════════════════════
  -- 4. FONDOS COMUNIDAD
  -- ════════════════════════════════════════════════════════════
  DELETE FROM fondos_comunidad
    WHERE "edificioId" = v_eid
      AND mes IN (1,2,3,4)
      AND año = 2026;

  INSERT INTO fondos_comunidad
    (id, "edificioId", mes, año, nombre, cobrado, ingresos, egresos, "saldoActual", nota, "creadoEn")
  VALUES
    -- Enero 2026
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Fondo de reserva',
      1515892, 402, 7821191, -26283064, NULL, NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Fondo Mudanza y Uso sala Multiuso',
      79481, 79397, 0, 6214039, NULL, NOW()),
    (gen_random_uuid()::text, v_eid, 1, 2026, 'Fondo Cobro sobre tiempo Estacionamientos',
      202206, 0, 0, 1924539, NULL, NOW()),

    -- Febrero 2026
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Fondo de reserva',
      1664494, 291, 9684465, -34748870, NULL, NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Fondo Mudanza y Uso sala Multiuso',
      39819, 79400, 0, 6372920, NULL, NOW()),
    (gen_random_uuid()::text, v_eid, 2, 2026, 'Fondo Cobro sobre tiempo Estacionamientos',
      20000, 0, 0, 2086745, NULL, NOW()),

    -- Marzo 2026
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Fondo de reserva',
      1500688, 0, 2796200, -35942275, NULL, NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Fondo Cobro sobre tiempo Estacionamientos',
      78000, 0, 0, 2126745, NULL, NOW()),
    (gen_random_uuid()::text, v_eid, 3, 2026, 'Fondo Ingreso por Multas',
      239448, 0, 0, 645899, NULL, NOW()),

    -- Abril 2026
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Fondo de reserva',
      1561600, 0, 3798592, -38158199, NULL, NOW()),
    (gen_random_uuid()::text, v_eid, 4, 2026, 'Fondo Cobro sobre tiempo Estacionamientos',
      180000, 268, 0, 2190013, NULL, NOW());

  -- ════════════════════════════════════════════════════════════
  -- 5. GASTOS COMUNES UNIDAD 0804 — Ene-Abr 2026
  --    (actualiza o inserta según PDF, con montoMultas incluido)
  -- ════════════════════════════════════════════════════════════
  IF v_u0804 IS NOT NULL THEN
    -- Eliminar gastos existentes de estos 4 meses para unidad 0804
    DELETE FROM gastos_comunes
      WHERE "unidadId" = v_u0804
        AND mes IN (1,2,3,4)
        AND año = 2026;

    INSERT INTO gastos_comunes
      (id, "unidadId", "edificioId", mes, año,
       "montoBase", "montoFondoReserva", "montoAgua",
       "montoMultas", "notaMultas",
       "montoTotal", "estadoPago", "fechaVencimiento", "diasMora")
    VALUES
      -- Enero 2026: base $120.978 + fondo $6.049 + agua $65.553 + multa $20.000 = $212.580
      (gen_random_uuid()::text, v_u0804, v_eid, 1, 2026,
       120978, 6049, 65553,
       20000, 'Sobre tiempos excedidos estacionamientos visitas',
       212580, 'pagado', '2026-03-10', 0),

      -- Febrero 2026: base $120.666 + fondo $6.033 + agua $54.979 + multas $159.027 = $340.705
      (gen_random_uuid()::text, v_u0804, v_eid, 2, 2026,
       120666, 6033, 54979,
       159027, 'Multa xenofobia $119.185 + Multa estacionamiento sin autorizar $39.842',
       340705, 'pagado', '2026-04-10', 0),

      -- Marzo 2026: base $120.612 + fondo $6.031 + agua $53.191 = $179.834
      (gen_random_uuid()::text, v_u0804, v_eid, 3, 2026,
       120612, 6031, 53191,
       NULL, NULL,
       179834, 'pagado', '2026-05-10', 0),

      -- Abril 2026: base $116.963 + fondo $5.848 + agua $66.791 = $189.602
      (gen_random_uuid()::text, v_u0804, v_eid, 4, 2026,
       116963, 5848, 66791,
       NULL, NULL,
       189602, 'pendiente', '2026-06-10', 0);

    RAISE NOTICE 'Gastos comunes unidad 0804 insertados OK';
  ELSE
    RAISE NOTICE 'Unidad 0804 no encontrada — gastos_comunes no insertados';
  END IF;

  RAISE NOTICE 'Seed Ene-Abr 2026 completado OK';
END $$;
