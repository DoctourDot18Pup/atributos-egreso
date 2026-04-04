-- ============================================================
-- Atributos de Egreso — ITC Celaya
-- schema.sql — MySQL 8+
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS atributos_egreso
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE atributos_egreso;

-- ============================================================
-- 1. TABLAS CATÁLOGO
-- ============================================================

CREATE TABLE carreras (
    id_carrera   VARCHAR(10)  NOT NULL,
    nombre       VARCHAR(100) NOT NULL,
    activo       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_carrera)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------

CREATE TABLE materias (
    id_materia   VARCHAR(20)  NOT NULL,
    nombre       VARCHAR(200) NOT NULL,
    fecha_inicio DATE         DEFAULT NULL,
    fecha_fin    DATE         DEFAULT NULL,   -- NULL = vigente sin fecha límite
    activo       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_materia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------

CREATE TABLE atributos_egreso (
    id_ae        INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_carrera   VARCHAR(10)  NOT NULL,
    codigo_ae    VARCHAR(5)   NOT NULL,   -- '01', '02', etc.
    nombre       TEXT         NOT NULL,
    nombre_corto VARCHAR(100) DEFAULT NULL,
    activo       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_ae),
    UNIQUE KEY uq_carrera_codigo (id_carrera, codigo_ae),
    CONSTRAINT fk_ae_carrera FOREIGN KEY (id_carrera)
        REFERENCES carreras (id_carrera)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------

CREATE TABLE criterios (
    id_criterio       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_ae             INT UNSIGNED NOT NULL,
    codigo_criterio   VARCHAR(5)   NOT NULL,   -- '01', '02', etc.
    descripcion       TEXT         NOT NULL,
    desc_n1           VARCHAR(100) NOT NULL DEFAULT 'No suficiente',
    desc_n2           VARCHAR(100) NOT NULL DEFAULT 'Suficiente',
    desc_n3           VARCHAR(100) NOT NULL DEFAULT 'Bueno',
    desc_n4           VARCHAR(100) NOT NULL DEFAULT 'Muy Bueno',
    orden             TINYINT      NOT NULL DEFAULT 0,
    activo            TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id_criterio),
    UNIQUE KEY uq_ae_codigo (id_ae, codigo_criterio),
    CONSTRAINT fk_criterio_ae FOREIGN KEY (id_ae)
        REFERENCES atributos_egreso (id_ae)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------

CREATE TABLE periodos (
    id_periodo   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre       VARCHAR(50)  NOT NULL,   -- 'ENE-JUN 2025', '2025/06'
    fecha_inicio DATE         NOT NULL,
    fecha_fin    DATE         NOT NULL,
    activo       TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id_periodo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. TABLAS DE RELACIÓN
-- ============================================================

-- Materia puede pertenecer a varias carreras
CREATE TABLE materias_carreras (
    id_materia   VARCHAR(20)  NOT NULL,
    id_carrera   VARCHAR(10)  NOT NULL,
    semestre     TINYINT      DEFAULT NULL CHECK (semestre BETWEEN 1 AND 12),
    PRIMARY KEY (id_materia, id_carrera),
    CONSTRAINT fk_mc_materia  FOREIGN KEY (id_materia)
        REFERENCES materias (id_materia)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mc_carrera  FOREIGN KEY (id_carrera)
        REFERENCES carreras (id_carrera)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------

-- Nivel de aportación de cada AE dentro de una materia (I / M / A)
CREATE TABLE materias_ae (
    id_materia_ae  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_materia     VARCHAR(20)  NOT NULL,
    id_ae          INT UNSIGNED NOT NULL,
    nivel_ae       CHAR(1)      NOT NULL CHECK (nivel_ae IN ('I','M','A')),
    PRIMARY KEY (id_materia_ae),
    UNIQUE KEY uq_materia_ae (id_materia, id_ae),
    CONSTRAINT fk_mae_materia FOREIGN KEY (id_materia)
        REFERENCES materias (id_materia)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mae_ae      FOREIGN KEY (id_ae)
        REFERENCES atributos_egreso (id_ae)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. USUARIOS Y ESTUDIANTES
-- ============================================================

CREATE TABLE estudiantes (
    id_estudiante      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    matricula          VARCHAR(20)  NOT NULL,
    nombre             VARCHAR(100) NOT NULL,
    apellido_paterno   VARCHAR(50)  DEFAULT NULL,
    apellido_materno   VARCHAR(50)  DEFAULT NULL,
    id_carrera         VARCHAR(10)  NOT NULL,
    semestre           TINYINT      DEFAULT NULL CHECK (semestre BETWEEN 1 AND 12),
    activo             TINYINT(1)   NOT NULL DEFAULT 1,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_estudiante),
    UNIQUE KEY uq_matricula (matricula),
    CONSTRAINT fk_est_carrera FOREIGN KEY (id_carrera)
        REFERENCES carreras (id_carrera)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------

-- Tabla única de autenticación para los tres roles
CREATE TABLE usuarios (
    id_usuario      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email           VARCHAR(150) NOT NULL,
    password_hash   TEXT         NOT NULL,
    rol             ENUM('admin','coordinador','alumno') NOT NULL DEFAULT 'alumno',
    id_estudiante   INT UNSIGNED DEFAULT NULL,   -- solo cuando rol = alumno
    id_carrera      VARCHAR(10)  DEFAULT NULL,   -- para coordinador: su carrera asignada
    activo          TINYINT(1)   NOT NULL DEFAULT 1,
    ultimo_acceso   TIMESTAMP    DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uq_email (email),
    CONSTRAINT fk_usr_estudiante FOREIGN KEY (id_estudiante)
        REFERENCES estudiantes (id_estudiante)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_usr_carrera    FOREIGN KEY (id_carrera)
        REFERENCES carreras (id_carrera)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. EVALUACIONES
-- ============================================================

CREATE TABLE evaluaciones (
    id_evaluacion    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_estudiante    INT UNSIGNED NOT NULL,
    id_materia       VARCHAR(20)  NOT NULL,
    id_periodo       INT UNSIGNED NOT NULL,
    fecha_evaluacion TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones    TEXT         DEFAULT NULL,
    PRIMARY KEY (id_evaluacion),
    -- Un alumno solo puede evaluar una materia una vez por período
    UNIQUE KEY uq_evaluacion (id_estudiante, id_materia, id_periodo),
    CONSTRAINT fk_ev_estudiante FOREIGN KEY (id_estudiante)
        REFERENCES estudiantes (id_estudiante)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ev_materia    FOREIGN KEY (id_materia)
        REFERENCES materias (id_materia)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ev_periodo    FOREIGN KEY (id_periodo)
        REFERENCES periodos (id_periodo)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------

CREATE TABLE evaluaciones_detalle (
    id_detalle     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_evaluacion  INT UNSIGNED NOT NULL,
    id_criterio    INT UNSIGNED NOT NULL,
    likert         TINYINT      NOT NULL CHECK (likert BETWEEN 1 AND 4),
    PRIMARY KEY (id_detalle),
    UNIQUE KEY uq_detalle (id_evaluacion, id_criterio),
    CONSTRAINT fk_det_evaluacion FOREIGN KEY (id_evaluacion)
        REFERENCES evaluaciones (id_evaluacion)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_det_criterio   FOREIGN KEY (id_criterio)
        REFERENCES criterios (id_criterio)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. AUDITORÍA
-- ============================================================

CREATE TABLE auditoria (
    id_auditoria    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    tabla_afectada  VARCHAR(50)  NOT NULL,
    accion          ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    datos_anteriores JSON        DEFAULT NULL,
    datos_nuevos     JSON        DEFAULT NULL,
    id_usuario      INT UNSIGNED DEFAULT NULL,
    ip              VARCHAR(45)  DEFAULT NULL,
    fecha           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_auditoria),
    CONSTRAINT fk_aud_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. ÍNDICES DE RENDIMIENTO
-- ============================================================

CREATE INDEX idx_ae_carrera            ON atributos_egreso (id_carrera);
CREATE INDEX idx_criterios_ae          ON criterios (id_ae);
CREATE INDEX idx_mae_materia           ON materias_ae (id_materia);
CREATE INDEX idx_mae_ae                ON materias_ae (id_ae);
CREATE INDEX idx_ev_estudiante         ON evaluaciones (id_estudiante);
CREATE INDEX idx_ev_periodo            ON evaluaciones (id_periodo);
CREATE INDEX idx_ev_materia            ON evaluaciones (id_materia);
CREATE INDEX idx_det_evaluacion        ON evaluaciones_detalle (id_evaluacion);
CREATE INDEX idx_usr_rol               ON usuarios (rol);

SET FOREIGN_KEY_CHECKS = 1;