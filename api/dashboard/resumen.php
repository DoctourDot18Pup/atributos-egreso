<?php
// ============================================================
// api/dashboard/resumen.php
// GET — KPIs y resumen por carrera
// ?carrera=ISC  (requerido para coordinador, opcional para admin)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$usuario = requireRol('admin', 'coordinador');

$pdo = getDB();

// Coordinador solo puede ver su carrera
$carrera = $usuario->rol === 'coordinador'
    ? $usuario->id_carrera
    : trim($_GET['carrera'] ?? '');

if (!$carrera) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere el parámetro carrera.']);
    exit;
}

// --- Total estudiantes activos ---
$stmt = $pdo->prepare("SELECT COUNT(*) FROM estudiantes WHERE id_carrera = :c AND activo = 1");
$stmt->execute([':c' => $carrera]);
$totalEstudiantes = (int)$stmt->fetchColumn();

// --- Total evaluaciones registradas ---
$stmt = $pdo->prepare("
    SELECT COUNT(*) FROM evaluaciones ev
    JOIN estudiantes e ON e.id_estudiante = ev.id_estudiante
    WHERE e.id_carrera = :c
");
$stmt->execute([':c' => $carrera]);
$totalEvaluaciones = (int)$stmt->fetchColumn();

// --- Período más reciente activo ---
$stmt = $pdo->query("
    SELECT id_periodo, nombre, fecha_inicio, fecha_fin
    FROM periodos
    WHERE activo = 1
    ORDER BY fecha_inicio DESC
    LIMIT 1
");
$periodoActivo = $stmt->fetch() ?: null;

// --- Promedio Likert por AE en la carrera ---
$stmt = $pdo->prepare("
    SELECT ae.codigo_ae, ae.nombre_corto, ae.nombre,
           ROUND(AVG(ed.likert), 2) AS promedio,
           COUNT(ed.id_detalle)     AS total_respuestas
    FROM evaluaciones_detalle ed
    JOIN criterios           cr ON cr.id_criterio = ed.id_criterio
    JOIN atributos_egreso    ae ON ae.id_ae        = cr.id_ae
    JOIN evaluaciones        ev ON ev.id_evaluacion = ed.id_evaluacion
    JOIN estudiantes          e ON e.id_estudiante  = ev.id_estudiante
    WHERE ae.id_carrera = :c AND ae.activo = 1
    GROUP BY ae.id_ae
    ORDER BY ae.codigo_ae
");
$stmt->execute([':c' => $carrera]);
$promediosPorAE = $stmt->fetchAll();

// --- Distribución Likert global ---
$stmt = $pdo->prepare("
    SELECT ed.likert, COUNT(*) AS total
    FROM evaluaciones_detalle ed
    JOIN criterios           cr ON cr.id_criterio  = ed.id_criterio
    JOIN atributos_egreso    ae ON ae.id_ae         = cr.id_ae
    JOIN evaluaciones        ev ON ev.id_evaluacion = ed.id_evaluacion
    JOIN estudiantes          e ON e.id_estudiante  = ev.id_estudiante
    WHERE ae.id_carrera = :c
    GROUP BY ed.likert
    ORDER BY ed.likert
");
$stmt->execute([':c' => $carrera]);
$distribucion = array_column($stmt->fetchAll(), 'total', 'likert');

echo json_encode([
    'success'           => true,
    'carrera'           => $carrera,
    'total_estudiantes' => $totalEstudiantes,
    'total_evaluaciones'=> $totalEvaluaciones,
    'periodo_activo'    => $periodoActivo,
    'promedios_por_ae'  => $promediosPorAE,
    'distribucion_likert' => [
        'N1' => (int)($distribucion[1] ?? 0),
        'N2' => (int)($distribucion[2] ?? 0),
        'N3' => (int)($distribucion[3] ?? 0),
        'N4' => (int)($distribucion[4] ?? 0),
    ],
]);
