<?php
// ============================================================
// api/evaluaciones/crear.php
// POST — crear evaluación completa (cabecera + detalle)
// Body: { id_materia, id_periodo, observaciones?, respuestas: [{id_criterio, likert}] }
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$usuario = requireRol('alumno');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$pdo  = getDB();
$body = json_decode(file_get_contents('php://input'), true);

$id_materia   = trim($body['id_materia']    ?? '');
$id_periodo   = (int)($body['id_periodo']   ?? 0);
$observaciones = trim($body['observaciones'] ?? '') ?: null;
$respuestas   = $body['respuestas']          ?? [];

if (!$id_materia || !$id_periodo || empty($respuestas)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Materia, período y respuestas son requeridos.']);
    exit;
}

// Validar que el período esté activo
$stmtPer = $pdo->prepare("SELECT id_periodo FROM periodos WHERE id_periodo = :id AND activo = 1");
$stmtPer->execute([':id' => $id_periodo]);
if (!$stmtPer->fetch()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El período indicado no está activo.']);
    exit;
}

// Verificar que el alumno no haya evaluado esta materia en este período
$stmtDup = $pdo->prepare("
    SELECT id_evaluacion FROM evaluaciones
    WHERE id_estudiante = :est AND id_materia = :mat AND id_periodo = :per
");
$stmtDup->execute([
    ':est' => $usuario->id_estudiante,
    ':mat' => $id_materia,
    ':per' => $id_periodo,
]);
if ($stmtDup->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Ya completaste la evaluación de esta materia en este período.']);
    exit;
}

// Validar respuestas: cada una debe tener id_criterio (int > 0) y likert (1-4)
foreach ($respuestas as $r) {
    $lic = (int)($r['id_criterio'] ?? 0);
    $lik = (int)($r['likert']      ?? 0);
    if ($lic <= 0 || $lik < 1 || $lik > 4) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Respuestas inválidas. Cada criterio debe tener un valor del 1 al 4.']);
        exit;
    }
}

try {
    $pdo->beginTransaction();

    // Insertar cabecera
    $stmtEv = $pdo->prepare("
        INSERT INTO evaluaciones (id_estudiante, id_materia, id_periodo, observaciones, fecha_evaluacion)
        VALUES (:est, :mat, :per, :obs, NOW())
    ");
    $stmtEv->execute([
        ':est' => $usuario->id_estudiante,
        ':mat' => $id_materia,
        ':per' => $id_periodo,
        ':obs' => $observaciones,
    ]);
    $id_evaluacion = (int)$pdo->lastInsertId();

    // Insertar detalle
    $stmtDet = $pdo->prepare("
        INSERT INTO evaluaciones_detalle (id_evaluacion, id_criterio, likert)
        VALUES (:ev, :cr, :lik)
    ");
    foreach ($respuestas as $r) {
        $stmtDet->execute([
            ':ev'  => $id_evaluacion,
            ':cr'  => (int)$r['id_criterio'],
            ':lik' => (int)$r['likert'],
        ]);
    }

    $pdo->commit();
    echo json_encode([
        'success'       => true,
        'message'       => 'Evaluación registrada correctamente.',
        'id_evaluacion' => $id_evaluacion,
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al guardar la evaluación.']);
}
