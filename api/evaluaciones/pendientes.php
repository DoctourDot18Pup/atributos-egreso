<?php
// ============================================================
// api/evaluaciones/pendientes.php
// GET — materias pendientes de evaluar para el alumno autenticado
//   Retorna las materias en las que el alumno está inscrito
//   (tabla inscripciones) en el período activo y que aún no ha evaluado.
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$usuario = requireRol('alumno');

$pdo = getDB();

// 1. Período activo (el más reciente con activo = 1)
$stmtPer = $pdo->query("
    SELECT id_periodo, nombre, fecha_inicio, fecha_fin
    FROM periodos
    WHERE activo = 1
    ORDER BY fecha_inicio DESC
    LIMIT 1
");
$periodo = $stmtPer->fetch();

if (!$periodo) {
    echo json_encode(['success' => true, 'periodo' => null, 'pendientes' => [], 'evaluadas' => []]);
    exit;
}

$id_periodo    = $periodo['id_periodo'];
$id_estudiante = (int)$usuario->id_estudiante;

// 2. Materias en las que el alumno está inscrito en este período
//    que además tienen al menos 1 criterio activo
$stmtMat = $pdo->prepare("
    SELECT i.id_materia, m.nombre AS materia_nombre
    FROM inscripciones i
    JOIN materias m ON m.id_materia = i.id_materia
    WHERE i.id_estudiante = :est
      AND i.id_periodo    = :per
      AND m.activo = 1
      AND EXISTS (
          SELECT 1
          FROM materias_ae mae
          JOIN atributos_egreso ae ON ae.id_ae = mae.id_ae
          JOIN criterios cr ON cr.id_ae = ae.id_ae AND cr.activo = 1
          WHERE mae.id_materia = i.id_materia
      )
    ORDER BY m.nombre ASC
");
$stmtMat->execute([':est' => $id_estudiante, ':per' => $id_periodo]);
$materias = $stmtMat->fetchAll();

// 3. Materias ya evaluadas en este período
$stmtEval = $pdo->prepare("
    SELECT id_materia FROM evaluaciones
    WHERE id_estudiante = :est AND id_periodo = :per
");
$stmtEval->execute([':est' => $id_estudiante, ':per' => $id_periodo]);
$yaEvaluadas = array_column($stmtEval->fetchAll(), 'id_materia');

// 4. Filtrar pendientes
$pendientes = array_filter($materias, fn($m) => !in_array($m['id_materia'], $yaEvaluadas, true));

echo json_encode([
    'success'    => true,
    'periodo'    => $periodo,
    'pendientes' => array_values($pendientes),
    'evaluadas'  => $yaEvaluadas,
]);
