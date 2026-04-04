<?php
// ============================================================
// api/evaluaciones/pendientes.php
// GET — materias pendientes de evaluar para el alumno autenticado
//   Retorna las materias de su carrera que tienen criterios activos
//   y que el alumno NO ha evaluado en el período activo actual.
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

// 1. Obtener carrera del estudiante
$stmtEst = $pdo->prepare("SELECT id_carrera FROM estudiantes WHERE id_estudiante = :id");
$stmtEst->execute([':id' => $usuario->id_estudiante]);
$est = $stmtEst->fetch();

if (!$est) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Estudiante no encontrado.']);
    exit;
}

$id_carrera = $est['id_carrera'];

// 2. Período activo (el más reciente con activo=1)
$stmtPer = $pdo->query("
    SELECT id_periodo, nombre, fecha_inicio, fecha_fin
    FROM periodos
    WHERE activo = 1
    ORDER BY fecha_inicio DESC
    LIMIT 1
");
$periodo = $stmtPer->fetch();

if (!$periodo) {
    echo json_encode(['success' => true, 'periodo' => null, 'pendientes' => []]);
    exit;
}

$id_periodo = $periodo['id_periodo'];

// 3. Materias de la carrera que tienen al menos 1 criterio activo
$stmtMat = $pdo->prepare("
    SELECT DISTINCT m.id_materia, m.nombre AS materia_nombre
    FROM materias m
    JOIN materias_carreras mc ON mc.id_materia = m.id_materia
    JOIN materias_ae       mae ON mae.id_materia = m.id_materia
    JOIN atributos_egreso  ae  ON ae.id_ae = mae.id_ae
    JOIN criterios         cr  ON cr.id_ae = ae.id_ae AND cr.activo = 1
    WHERE mc.id_carrera = :carrera
      AND m.activo = 1
      AND ae.id_carrera = :carrera2
    GROUP BY m.id_materia
    ORDER BY m.nombre ASC
");
$stmtMat->execute([':carrera' => $id_carrera, ':carrera2' => $id_carrera]);
$materias = $stmtMat->fetchAll();

// 4. Materias ya evaluadas en este período
$stmtEval = $pdo->prepare("
    SELECT id_materia FROM evaluaciones
    WHERE id_estudiante = :est AND id_periodo = :per
");
$stmtEval->execute([':est' => $usuario->id_estudiante, ':per' => $id_periodo]);
$yaEvaluadas = array_column($stmtEval->fetchAll(), 'id_materia');

// 5. Filtrar pendientes
$pendientes = array_filter($materias, fn($m) => !in_array($m['id_materia'], $yaEvaluadas, true));

echo json_encode([
    'success'    => true,
    'periodo'    => $periodo,
    'pendientes' => array_values($pendientes),
    'evaluadas'  => $yaEvaluadas,
]);
