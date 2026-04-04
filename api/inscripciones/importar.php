<?php
// ============================================================
// api/inscripciones/importar.php
// POST — importación masiva desde CSV
// Body: { id_periodo: X, filas: [{matricula, id_materia}] }
// Responde: { insertados, duplicados, errores:[{fila,matricula,id_materia,motivo}] }
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$usuario = requireRol('admin', 'coordinador');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$pdo  = getDB();
$body = json_decode(file_get_contents('php://input'), true);

$id_periodo = (int)($body['id_periodo'] ?? 0);
$filas      = $body['filas']            ?? [];

if (!$id_periodo || empty($filas)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Período y filas son requeridos.']);
    exit;
}

// Verificar que el período exista
$stmtPer = $pdo->prepare("SELECT id_periodo FROM periodos WHERE id_periodo = :id");
$stmtPer->execute([':id' => $id_periodo]);
if (!$stmtPer->fetch()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El período indicado no existe.']);
    exit;
}

// Cache de matrículas → id_estudiante (filtrado por carrera del coordinador)
$sqlEst = "SELECT e.id_estudiante, e.matricula, e.id_carrera FROM estudiantes e WHERE e.activo = 1";
$paramsEst = [];
if ($usuario->rol === 'coordinador') {
    $sqlEst .= " AND e.id_carrera = :carrera";
    $paramsEst[':carrera'] = $usuario->id_carrera;
}
$stmtEst = $pdo->prepare($sqlEst);
$stmtEst->execute($paramsEst);
$estudiantesMap = [];
foreach ($stmtEst->fetchAll() as $e) {
    $estudiantesMap[strtoupper(trim($e['matricula']))] = $e;
}

// Cache de materias válidas
$stmtMat = $pdo->query("SELECT id_materia FROM materias WHERE activo = 1");
$materiasValidas = array_column($stmtMat->fetchAll(), 'id_materia', 'id_materia');

// Preparar insert
$stmtIns = $pdo->prepare("
    INSERT IGNORE INTO inscripciones (id_estudiante, id_materia, id_periodo)
    VALUES (:est, :mat, :per)
");

$insertados  = 0;
$duplicados  = 0;
$errores     = [];

foreach ($filas as $i => $fila) {
    $numFila   = $i + 2; // +2 porque fila 1 es el encabezado
    $matricula = strtoupper(trim($fila['matricula'] ?? ''));
    $idMateria = strtoupper(trim($fila['id_materia'] ?? ''));

    if ($matricula === '' || $idMateria === '') {
        $errores[] = ['fila' => $numFila, 'matricula' => $matricula, 'id_materia' => $idMateria, 'motivo' => 'Campos vacíos'];
        continue;
    }

    if (!isset($estudiantesMap[$matricula])) {
        $errores[] = ['fila' => $numFila, 'matricula' => $matricula, 'id_materia' => $idMateria, 'motivo' => 'Matrícula no encontrada' . ($usuario->rol === 'coordinador' ? ' en tu carrera' : '')];
        continue;
    }

    if (!isset($materiasValidas[$idMateria])) {
        $errores[] = ['fila' => $numFila, 'matricula' => $matricula, 'id_materia' => $idMateria, 'motivo' => "Materia '$idMateria' no existe o está inactiva"];
        continue;
    }

    $idEstudiante = $estudiantesMap[$matricula]['id_estudiante'];

    $stmtIns->execute([':est' => $idEstudiante, ':mat' => $idMateria, ':per' => $id_periodo]);

    if ($stmtIns->rowCount() > 0) {
        $insertados++;
    } else {
        $duplicados++;
    }
}

echo json_encode([
    'success'    => true,
    'insertados' => $insertados,
    'duplicados' => $duplicados,
    'errores'    => $errores,
    'total'      => count($filas),
]);
