<?php
// ============================================================
// api/evaluaciones/index.php
// GET — listar evaluaciones
//   ?carrera=ISC  ?periodo=X  ?materia=X  ?estudiante=X
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

// Coordinador solo ve su carrera
$carrera    = $usuario->rol === 'coordinador'
    ? $usuario->id_carrera
    : trim($_GET['carrera'] ?? '');

$id_periodo  = (int)($_GET['periodo']    ?? 0);
$id_materia  = trim($_GET['materia']     ?? '');
$id_est      = (int)($_GET['estudiante'] ?? 0);

$sql = "
    SELECT ev.id_evaluacion, ev.fecha_evaluacion,
           e.matricula, e.nombre AS est_nombre,
           e.apellido_paterno, e.apellido_materno, e.id_carrera,
           m.id_materia, m.nombre AS materia_nombre,
           p.id_periodo, p.nombre AS periodo_nombre,
           COUNT(ed.id_detalle) AS total_criterios,
           ROUND(AVG(ed.likert), 2) AS promedio
    FROM evaluaciones ev
    JOIN estudiantes e  ON e.id_estudiante  = ev.id_estudiante
    JOIN materias    m  ON m.id_materia     = ev.id_materia
    JOIN periodos    p  ON p.id_periodo     = ev.id_periodo
    LEFT JOIN evaluaciones_detalle ed ON ed.id_evaluacion = ev.id_evaluacion
    WHERE 1=1
";
$params = [];

if ($carrera !== '') {
    $sql .= " AND e.id_carrera = :carrera";
    $params[':carrera'] = $carrera;
}
if ($id_periodo > 0) {
    $sql .= " AND ev.id_periodo = :periodo";
    $params[':periodo'] = $id_periodo;
}
if ($id_materia !== '') {
    $sql .= " AND ev.id_materia = :materia";
    $params[':materia'] = $id_materia;
}
if ($id_est > 0) {
    $sql .= " AND ev.id_estudiante = :est";
    $params[':est'] = $id_est;
}

$sql .= " GROUP BY ev.id_evaluacion ORDER BY ev.fecha_evaluacion DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
