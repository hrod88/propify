-- ============================================================
-- MIGRACIÓN: Fase B/C/D — 13 módulos nuevos
-- Ejecutar en Supabase SQL Editor (en orden)
-- Fecha: 2026-06-02
-- ============================================================

-- ─── 1. BODEGAS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bodegas (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"  TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  numero        TEXT NOT NULL,
  piso          INTEGER,
  "superficieM2" NUMERIC,
  estado        TEXT NOT NULL DEFAULT 'disponible',  -- disponible | ocupado | en_mantención
  "propietarioId" TEXT,
  "unidadId"    TEXT,
  precio        NUMERIC,
  nota          TEXT,
  "creadoEn"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. DIRECTORIO VECINAL (columna en usuarios) ──────────────
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "visibleDirectorio" BOOLEAN DEFAULT false;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "telefonoDirectorio" TEXT;

-- ─── 3. COMITÉ — documentos y miembros ──────────────────────
CREATE TABLE IF NOT EXISTS comite_miembros (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"  TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  "usuarioId"   TEXT,
  nombre        TEXT NOT NULL,
  cargo         TEXT NOT NULL DEFAULT 'vocal',  -- presidente | secretario | tesorero | vocal
  rut           TEXT,
  email         TEXT,
  telefono      TEXT,
  activo        BOOLEAN DEFAULT true,
  "periodoInicio" DATE,
  "periodoFin"  DATE,
  "creadoEn"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comite_documentos (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"  TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  titulo        TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'acuerdo',  -- acuerdo | convocatoria | reglamento | acta | otro
  contenido     TEXT,
  url           TEXT,
  confidencial  BOOLEAN DEFAULT false,
  "creadoEn"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. MURO COMUNITARIO ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS muro_posts (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"  TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  "autorId"     TEXT,
  "autorNombre" TEXT NOT NULL,
  "autorRol"    TEXT NOT NULL DEFAULT 'residente',
  contenido     TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'general',  -- general | aviso | evento | urgente
  imagen        TEXT,
  likes         INTEGER NOT NULL DEFAULT 0,
  fijado        BOOLEAN NOT NULL DEFAULT false,
  "creadoEn"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS muro_comentarios (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "postId"      TEXT REFERENCES muro_posts(id) ON DELETE CASCADE,
  "autorId"     TEXT,
  "autorNombre" TEXT NOT NULL,
  contenido     TEXT NOT NULL,
  "creadoEn"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 5. ENCUESTAS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS encuestas (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"  TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  pregunta      TEXT NOT NULL,
  descripcion   TEXT,
  estado        TEXT NOT NULL DEFAULT 'activa',  -- borrador | activa | cerrada
  multiple      BOOLEAN NOT NULL DEFAULT false,
  anonima       BOOLEAN NOT NULL DEFAULT true,
  "cierreEn"    DATE,
  "creadoEn"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS encuesta_opciones (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "encuestaId"  TEXT REFERENCES encuestas(id) ON DELETE CASCADE,
  texto         TEXT NOT NULL,
  votos         INTEGER NOT NULL DEFAULT 0,
  orden         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS encuesta_votos (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "encuestaId"  TEXT REFERENCES encuestas(id) ON DELETE CASCADE,
  "opcionId"    TEXT REFERENCES encuesta_opciones(id) ON DELETE CASCADE,
  "votanteId"   TEXT,
  "creadoEn"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("encuestaId", "votanteId", "opcionId")
);

-- ─── 6. MARKETPLACE VECINAL ───────────────────────────────────
CREATE TABLE IF NOT EXISTS marketplace_items (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"    TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  "vendedorId"    TEXT,
  "vendedorNombre" TEXT NOT NULL,
  "vendedorUnidad" TEXT,
  titulo          TEXT NOT NULL,
  descripcion     TEXT,
  precio          NUMERIC,
  tipo            TEXT NOT NULL DEFAULT 'venta',  -- venta | arriendo | regalo | busco
  estado          TEXT NOT NULL DEFAULT 'activo', -- activo | vendido | pausado
  imagen          TEXT,
  contacto        TEXT,
  "creadoEn"      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 7. RESERVAS MUDANZAS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservas_mudanza (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"        TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  "unidadId"          TEXT,
  "solicitanteNombre" TEXT NOT NULL,
  "solicitanteEmail"  TEXT,
  tipo                TEXT NOT NULL DEFAULT 'entrada',  -- entrada | salida
  fecha               DATE NOT NULL,
  "horaInicio"        TIME NOT NULL,
  "horaFin"           TIME NOT NULL,
  ascensor            BOOLEAN NOT NULL DEFAULT true,
  nota                TEXT,
  estado              TEXT NOT NULL DEFAULT 'pendiente',  -- pendiente | aprobado | rechazado
  "aprobadoEn"        TIMESTAMPTZ,
  "creadoEn"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 8. MULTAS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reglas_multa (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"  TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  descripcion   TEXT,
  monto         NUMERIC NOT NULL,
  activa        BOOLEAN NOT NULL DEFAULT true,
  "creadoEn"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS multas (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"      TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  "unidadId"        TEXT,
  "unidadNumero"    TEXT,
  "reglaId"         TEXT REFERENCES reglas_multa(id),
  "infractorNombre" TEXT,
  motivo            TEXT NOT NULL,
  monto             NUMERIC NOT NULL,
  estado            TEXT NOT NULL DEFAULT 'pendiente',  -- pendiente | pagada | anulada | apelando
  fecha             DATE NOT NULL,
  "pagadoEn"        TIMESTAMPTZ,
  nota              TEXT,
  "creadoEn"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 9. VOTACIONES DIGITALES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS votaciones (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"        TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  titulo              TEXT NOT NULL,
  descripcion         TEXT,
  tipo                TEXT NOT NULL DEFAULT 'ordinaria',  -- ordinaria | extraordinaria | urgente
  estado              TEXT NOT NULL DEFAULT 'borrador',   -- borrador | abierta | cerrada | anulada
  "quorumRequerido"   NUMERIC NOT NULL DEFAULT 50,  -- % de unidades necesario
  "fechaInicio"       TIMESTAMPTZ NOT NULL,
  "fechaFin"          TIMESTAMPTZ NOT NULL,
  resultado           TEXT,  -- aprobado | rechazado | sin_quorum | nulo
  "totalVotos"        INTEGER NOT NULL DEFAULT 0,
  "votosAFavor"       INTEGER NOT NULL DEFAULT 0,
  "votosEnContra"     INTEGER NOT NULL DEFAULT 0,
  "votosAbstencion"   INTEGER NOT NULL DEFAULT 0,
  "creadoEn"          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votos (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "votacionId"  TEXT REFERENCES votaciones(id) ON DELETE CASCADE,
  "votanteId"   TEXT,
  "unidadId"    TEXT,
  "unidadNumero" TEXT,
  decision      TEXT NOT NULL,  -- a_favor | en_contra | abstencion
  prorrateo     NUMERIC NOT NULL DEFAULT 1,
  "creadoEn"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("votacionId", "votanteId")
);

-- ─── 10. QR TEMPORAL VISITAS ──────────────────────────────────
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS "qrToken"  TEXT;
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS "qrExpira" TIMESTAMPTZ;
ALTER TABLE visitas ADD COLUMN IF NOT EXISTS "qrUsado"  BOOLEAN DEFAULT false;

-- ─── 11. FIRMA DIGITAL ACTAS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS actas_firmas (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "actaId"      TEXT REFERENCES actas(id) ON DELETE CASCADE,
  "firmante"    TEXT NOT NULL,
  "firmanteCargo" TEXT,
  "firmaData"   TEXT NOT NULL,  -- base64 del canvas
  "firmadoEn"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 12. CONCILIACIÓN BANCARIA ────────────────────────────────
CREATE TABLE IF NOT EXISTS conciliacion_movimientos (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "edificioId"  TEXT REFERENCES edificios(id) ON DELETE CASCADE,
  fecha         DATE NOT NULL,
  descripcion   TEXT,
  monto         NUMERIC NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'abono',  -- abono | cargo
  "rutPagador"  TEXT,
  referencia    TEXT,
  "gastoId"     TEXT,  -- FK a gastos_comunes si matcheó
  "unidadId"    TEXT,
  estado        TEXT NOT NULL DEFAULT 'sin_match',  -- sin_match | matcheado | ignorado
  fuente        TEXT NOT NULL DEFAULT 'csv',  -- csv | fintoc
  "importadoEn" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── ÍNDICES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bodegas_edificio        ON bodegas("edificioId");
CREATE INDEX IF NOT EXISTS idx_muro_posts_edificio     ON muro_posts("edificioId");
CREATE INDEX IF NOT EXISTS idx_muro_posts_fecha        ON muro_posts("creadoEn" DESC);
CREATE INDEX IF NOT EXISTS idx_muro_comentarios_post   ON muro_comentarios("postId");
CREATE INDEX IF NOT EXISTS idx_encuestas_edificio      ON encuestas("edificioId");
CREATE INDEX IF NOT EXISTS idx_marketplace_edificio    ON marketplace_items("edificioId");
CREATE INDEX IF NOT EXISTS idx_reservas_mudanza_fecha  ON reservas_mudanza(fecha);
CREATE INDEX IF NOT EXISTS idx_multas_edificio         ON multas("edificioId");
CREATE INDEX IF NOT EXISTS idx_votaciones_edificio     ON votaciones("edificioId");
CREATE INDEX IF NOT EXISTS idx_conciliacion_edificio   ON conciliacion_movimientos("edificioId");
CREATE INDEX IF NOT EXISTS idx_conciliacion_estado     ON conciliacion_movimientos(estado);
