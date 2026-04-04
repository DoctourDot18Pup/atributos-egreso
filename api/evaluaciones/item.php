<?php
// ============================================================
// api/evaluaciones/item.php
// GET ?id=X — detalle completo de una evaluación
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$usuario = requireRol('admin', 'coordinador', 'alumno');

$pdo = getDB();
$id  = (int)($_GET['id'] ?? 0);

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID requerido.']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT ev.id_evaluacion, ev.fecha_evaluacion, ev.observaciones,
           e.matricula, e.nombre AS est_nombre,
           e.apellido_paterno, e.apellido_materno, e.id_carrera,
           m.id_materia, m.nombre AS materia_nombre,
           p.nombre AS periodo_nombre
    FROM evaluaciones ev
    JOIN estudiantes e ON e.id_estudiante = ev.id_estudiante
    JOIN materias    m ON m.id_materia    = ev.id_materia
    JOIN periodos    p ON p.id_periodo    = ev.id_periodo
    WHERE ev.id_evaluacion = :id
");
$stmt->execute([':id' => $id]);
$cabecera = $stmt->fetch();

if (!$cabecera) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Evaluación no encontrada.']);
    exit;
}

if ($usuario->rol === 'coordinador' && $cabecera['id_carrera'] !== $usuario->id_carrera) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No tienes acceso a esta evaluación.']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT ae.codigo_ae, ae.nombre_corto AS ae_nombre,
           cr.codigo_criterio, cr.descripcion AS criterio_desc,
           cr.desc_n1, cr.desc_n2, cr.desc_n3, cr.desc_n4,
           ed.likert
    FROM evaluaciones_detalle ed
    JOIN criterios          cr ON cr.id_criterio = ed.id_criterio
    JOIN atributos_egreso   ae ON ae.id_ae        = cr.id_ae
    WHERE ed.id_evaluacion = :id
    ORDER BY ae.codigo_ae, cr.codigo_criterio
");
$stmt->execute([':id' => $id]);
$detalle = $stmt->fetchAll();

$porAE = [];
foreach ($detalle as $fila) {
    $key = $fila['codigo_ae'];
    if (!isset($porAE[$key])) {
        $porAE[$key] = ['codigo_ae' => $fila['codigo_ae'], 'nombre' => $fila['ae_nombre'], 'criterios' => []];
    }
    $porAE[$key]['criterios'][] = [
        'codigo'      => $fila['codigo_criterio'],
        'descripcion' => $fila['criterio_desc'],
        'desc_n1'     => $fila['desc_n1'],
        'desc_n2'     => $fila['desc_n2'],
        'desc_n3'     => $fila['desc_n3'],
        'desc_n4'     => $fila['desc_n4'],
        'likert'      => (int)$fila['likert'],
    ];
}

echo json_encode([
    'success'  => true,
    'cabecera' => $cabecera,
    'detalle'  => array_values($porAE),
]);
