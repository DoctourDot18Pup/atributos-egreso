-- ============================================================
-- Atributos de Egreso — ITC Celaya
-- seed.sql — Datos de prueba para desarrollo local
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

USE atributos_egreso;

-- ============================================================
-- CARRERAS
-- ============================================================

INSERT INTO carreras (id_carrera, nombre) VALUES
('IAM',  'Ingeniería Ambiental'),
('IBQ',  'Ingeniería Bioquímica'),
('IE',   'Ingeniería en Electrónica'),
('IGE',  'Ingeniería en Gestión Empresarial'),
('ISC',  'Ingeniería en Sistemas Computacionales'),
('II',   'Ingeniería Industrial'),
('IMCN', 'Ingeniería Mecánica'),
('IMCT', 'Ingeniería Mecatrónica'),
('IQ',   'Ingeniería Química'),
('LA',   'Licenciatura en Administración');

-- ============================================================
-- MATERIAS (ISC — muestra representativa)
-- ============================================================

INSERT INTO materias (id_materia, nombre, fecha_inicio) VALUES
('ACA-0907', 'Taller de Ética',                          '2010-01-01'),
('AED-1285', 'Fundamentos de Programación',              '2010-01-01'),
('AEF-1041', 'Matemáticas Discretas',                    '2010-01-01'),
('ACC-0906', 'Fundamentos de Investigación',             '2010-01-01'),
('ACF-0901', 'Cálculo Diferencial',                      '2010-01-01'),
('AED-1286', 'Programación Orientada a Objetos',         '2010-01-01'),
('AED-1026', 'Estructura de Datos',                      '2010-01-01'),
('AEF-1031', 'Fundamentos de Base de Datos',             '2010-01-01'),
('AEC-1061', 'Sistemas Operativos',                      '2010-01-01'),
('SCC-1007', 'Fundamentos de Ingeniería de Software',    '2010-01-01'),
('SCD-1011', 'Ingeniería de Software',                   '2010-01-01'),
('AEB-1055', 'Programación Web',                         '2010-01-01'),
('SCC-1012', 'Inteligencia Artificial',                  '2010-01-01'),
('SCD-1021', 'Redes de Computadoras',                    '2010-01-01'),
('ACA-0910', 'Taller de Investigación I',                '2010-01-01'),
('CDD-2101', 'Introducción a la Ciencia de Datos',       '2021-08-01'),
('IDP-2501', 'Big Data',                                 '2026-01-01'),
('IDP-2503', 'Tópicos Avanzados de Desarrollo Web',      '2026-01-01');

-- ============================================================
-- RELACIÓN MATERIAS — CARRERAS
-- ============================================================

INSERT INTO materias_carreras (id_materia, id_carrera, semestre) VALUES
('ACA-0907', 'ISC', 1),
('AED-1285', 'ISC', 1),
('AEF-1041', 'ISC', 2),
('ACC-0906', 'ISC', 1),
('ACF-0901', 'ISC', 1),
('AED-1286', 'ISC', 2),
('AED-1026', 'ISC', 3),
('AEF-1031', 'ISC', 3),
('AEC-1061', 'ISC', 4),
('SCC-1007', 'ISC', 4),
('SCD-1011', 'ISC', 5),
('AEB-1055', 'ISC', 5),
('SCC-1012', 'ISC', 6),
('SCD-1021', 'ISC', 6),
('ACA-0910', 'ISC', 7),
('CDD-2101', 'ISC', 5),
('IDP-2501', 'ISC', 7),
('IDP-2503', 'ISC', 7);

-- ============================================================
-- ATRIBUTOS DE EGRESO — ISC
-- ============================================================

INSERT INTO atributos_egreso (id_carrera, codigo_ae, nombre, nombre_corto) VALUES
('ISC', '01', 'Identificar, formular y resolver problemas complejos de ingeniería aplicando los principios de las ciencias básicas y ciencias computacionales.', 'Resuelve problemas de Ingeniería'),
('ISC', '02', 'Aplicar diversas técnicas de análisis y diseño para crear soluciones de Software que satisfagan necesidades con enfoque en diferentes contextos.', 'Análisis y diseño de Software'),
('ISC', '03', 'Desarrollar y realizar pruebas funcionales y de integración de Software de Sistemas y Redes de Computadora, analizando los resultados.', 'Desarrollar y Probar Software y Redes'),
('ISC', '04', 'Comunicarse de manera efectiva en foros y con audiencias multidisciplinarias.', 'Comunicación Efectiva'),
('ISC', '05', 'Reconocer sus responsabilidades éticas y profesionales en situaciones relevantes para la ingeniería en Sistemas.', 'Ética'),
('ISC', '06', 'Reconoce la necesidad de actualizar constantemente sus competencias profesionales en beneficio de mejorar sus conocimientos.', 'Actualización Profesional'),
('ISC', '07', 'Dirigir y colaborar efectivamente en equipos de trabajo involucrándose en la gestión para lograr objetivos comunes.', 'Trabajo en Equipo'),
('ISC', '08', 'Desarrollar una visión de innovación y emprendimiento que le permitan generar proyectos tecnológicos aplicando los Sistemas Computacionales.', 'Innovación y Emprendimiento');

-- ============================================================
-- CRITERIOS DE EVALUACIÓN — ISC
-- ============================================================

-- AE 01 — Resuelve problemas
INSERT INTO criterios (id_ae, codigo_criterio, descripcion, desc_n1, desc_n2, desc_n3, desc_n4, orden)
SELECT id_ae, codigo_criterio, descripcion, desc_n1, desc_n2, desc_n3, desc_n4, orden
FROM (
    SELECT '01' AS codigo_criterio, 'Comprende problemas de ingeniería' AS descripcion,
           'No comprende' AS desc_n1, 'No aplica métodos' AS desc_n2,
           'Comprende y no soluciona' AS desc_n3, 'Comprende y soluciona' AS desc_n4, 1 AS orden
    UNION ALL
    SELECT '02', 'Realiza análisis crítico',
           'No analiza', 'Analiza y no plantea', 'Analiza y soluciona', 'Análisis sobresaliente', 2
    UNION ALL
    SELECT '03', 'Encuentra solución',
           'No soluciona', 'Identifica pero no aplica', 'Soluciona parcialmente', 'Encuentra soluciones eficientes', 3
) AS c
CROSS JOIN (SELECT id_ae FROM atributos_egreso WHERE id_carrera = 'ISC' AND codigo_ae = '01') AS ae;

-- AE 04 — Comunicación Efectiva
INSERT INTO criterios (id_ae, codigo_criterio, descripcion, orden)
SELECT id_ae, codigo_criterio, descripcion, orden
FROM (
    SELECT '01' AS codigo_criterio, 'Organiza la información'       AS descripcion, 1 AS orden
    UNION ALL SELECT '02', 'Utiliza recursos gráficos',             2
    UNION ALL SELECT '03', 'Utiliza normas gramaticales',           3
) AS c
CROSS JOIN (SELECT id_ae FROM atributos_egreso WHERE id_carrera = 'ISC' AND codigo_ae = '04') AS ae;

-- AE 05 — Ética
INSERT INTO criterios (id_ae, codigo_criterio, descripcion, orden)
SELECT id_ae, codigo_criterio, descripcion, orden
FROM (
    SELECT '01' AS codigo_criterio, 'Conoce y aplica el código de ética del TecNM' AS descripcion, 1 AS orden
    UNION ALL SELECT '02', 'Capaz de evaluar dimensiones éticas', 2
) AS c
CROSS JOIN (SELECT id_ae FROM atributos_egreso WHERE id_carrera = 'ISC' AND codigo_ae = '05') AS ae;

-- AE 06 — Actualización Profesional
INSERT INTO criterios (id_ae, codigo_criterio, descripcion, orden)
SELECT id_ae, codigo_criterio, descripcion, orden
FROM (
    SELECT '01' AS codigo_criterio, 'Capacidad de aprendizaje independiente' AS descripcion, 1 AS orden
    UNION ALL SELECT '02', 'Identifica situaciones de investigación', 2
    UNION ALL SELECT '03', 'Consulta fuentes de información',         3
) AS c
CROSS JOIN (SELECT id_ae FROM atributos_egreso WHERE id_carrera = 'ISC' AND codigo_ae = '06') AS ae;

-- AE 07 — Trabajo en Equipo
INSERT INTO criterios (id_ae, codigo_criterio, descripcion, orden)
SELECT id_ae, codigo_criterio, descripcion, orden
FROM (
    SELECT '01' AS codigo_criterio, 'Participa en equipos'               AS descripcion, 1 AS orden
    UNION ALL SELECT '02', 'Fomenta la cohesión del equipo',             2
    UNION ALL SELECT '03', 'Es responsable de tareas en equipo',         3
) AS c
CROSS JOIN (SELECT id_ae FROM atributos_egreso WHERE id_carrera = 'ISC' AND codigo_ae = '07') AS ae;

-- AE 08 — Innovación y Emprendimiento
INSERT INTO criterios (id_ae, codigo_criterio, descripcion, orden)
SELECT id_ae, codigo_criterio, descripcion, orden
FROM (
    SELECT '01' AS codigo_criterio, 'Desarrolla capacidad de innovación'     AS descripcion, 1 AS orden
    UNION ALL SELECT '02', 'Desarrolla capacidad de emprendimiento',         2
) AS c
CROSS JOIN (SELECT id_ae FROM atributos_egreso WHERE id_carrera = 'ISC' AND codigo_ae = '08') AS ae;

-- ============================================================
-- NIVELES DE APORTACIÓN MATERIA — AE
-- ============================================================

INSERT INTO materias_ae (id_materia, id_ae, nivel_ae)
SELECT id_materia, id_ae, nivel_ae FROM (
    -- ACA-0907 Taller de Ética
    SELECT 'ACA-0907' AS id_materia, '04' AS codigo_ae, 'I' AS nivel_ae
    UNION ALL SELECT 'ACA-0907', '05', 'M'
    UNION ALL SELECT 'ACA-0907', '07', 'M'
    -- ACC-0906 Fundamentos de Investigación
    UNION ALL SELECT 'ACC-0906', '04', 'M'
    UNION ALL SELECT 'ACC-0906', '05', 'M'
    UNION ALL SELECT 'ACC-0906', '07', 'M'
    -- ACA-0910 Taller de Investigación I
    UNION ALL SELECT 'ACA-0910', '04', 'A'
    UNION ALL SELECT 'ACA-0910', '05', 'A'
    UNION ALL SELECT 'ACA-0910', '06', 'A'
    UNION ALL SELECT 'ACA-0910', '07', 'A'
    UNION ALL SELECT 'ACA-0910', '08', 'A'
    -- AED-1285 Fundamentos de Programación
    UNION ALL SELECT 'AED-1285', '01', 'I'
    UNION ALL SELECT 'AED-1285', '02', 'I'
    -- AED-1286 Programación Orientada a Objetos
    UNION ALL SELECT 'AED-1286', '01', 'M'
    UNION ALL SELECT 'AED-1286', '02', 'M'
    -- SCC-1007 Fundamentos de Ingeniería de Software
    UNION ALL SELECT 'SCC-1007', '02', 'I'
    UNION ALL SELECT 'SCC-1007', '03', 'I'
    UNION ALL SELECT 'SCC-1007', '07', 'I'
    -- SCD-1011 Ingeniería de Software
    UNION ALL SELECT 'SCD-1011', '02', 'A'
    UNION ALL SELECT 'SCD-1011', '03', 'M'
    UNION ALL SELECT 'SCD-1011', '07', 'M'
    UNION ALL SELECT 'SCD-1011', '08', 'M'
    -- AEB-1055 Programación Web
    UNION ALL SELECT 'AEB-1055', '01', 'M'
    UNION ALL SELECT 'AEB-1055', '02', 'M'
    UNION ALL SELECT 'AEB-1055', '03', 'M'
) AS src
JOIN atributos_egreso ae ON ae.codigo_ae = src.codigo_ae AND ae.id_carrera = 'ISC';

-- ============================================================
-- PERÍODO ACADÉMICO
-- ============================================================

INSERT INTO periodos (nombre, fecha_inicio, fecha_fin, activo) VALUES
('ENE-JUN 2025', '2025-01-13', '2025-06-27', 0),
('AGO-DIC 2025', '2025-08-11', '2025-12-19', 0),
('ENE-JUN 2026', '2026-01-12', '2026-06-26', 1);

-- ============================================================
-- ESTUDIANTE Y USUARIO DE PRUEBA
-- ============================================================

INSERT INTO estudiantes (matricula, nombre, apellido_paterno, apellido_materno, id_carrera, semestre) VALUES
('25030001', 'Juan', 'Pérez', 'García', 'ISC', 4);

-- Contraseña: Admin2026! (bcrypt — se reemplazará en backend)
-- Por ahora se inserta texto plano para validar el flujo de login local
-- IMPORTANTE: sustituir por hash real al implementar api/auth/login.php

INSERT INTO usuarios (email, password_hash, rol, id_estudiante) VALUES
('admin@itcelaya.edu.mx',       'Admin2026!',      'admin',        NULL),
('coord.isc@itcelaya.edu.mx',   'Coord2026!',      'coordinador',  NULL),
('25030001@itcelaya.edu.mx',    'Alumno2026!',     'alumno',
    (SELECT id_estudiante FROM estudiantes WHERE matricula = '25030001'));

-- ============================================================
-- EVALUACIÓN DE PRUEBA — Juan Pérez / ACA-0907 / ENE-JUN 2026
-- ============================================================

INSERT INTO evaluaciones (id_estudiante, id_materia, id_periodo) VALUES (
    (SELECT id_estudiante FROM estudiantes WHERE matricula = '25030001'),
    'ACA-0907',
    (SELECT id_periodo FROM periodos WHERE nombre = 'ENE-JUN 2026')
);

INSERT INTO evaluaciones_detalle (id_evaluacion, id_criterio, likert)
SELECT
    (SELECT id_evaluacion FROM evaluaciones LIMIT 1),
    c.id_criterio,
    v.likert
FROM (
    SELECT '04' AS codigo_ae, '01' AS codigo_criterio, 3 AS likert UNION ALL
    SELECT '04', '02', 4 UNION ALL
    SELECT '04', '03', 3 UNION ALL
    SELECT '05', '01', 2 UNION ALL
    SELECT '05', '02', 3 UNION ALL
    SELECT '07', '01', 4 UNION ALL
    SELECT '07', '02', 3 UNION ALL
    SELECT '07', '03', 4
) AS v
JOIN atributos_egreso ae ON ae.codigo_ae = v.codigo_ae AND ae.id_carrera = 'ISC'
JOIN criterios c ON c.id_ae = ae.id_ae AND c.codigo_criterio = v.codigo_criterio;