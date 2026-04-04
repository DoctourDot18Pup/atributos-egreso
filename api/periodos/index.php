<?php
// ============================================================
// api/periodos/index.php
// GET    — listar períodos
// POST   — crear período
// PUT    — actualizar período  (?id=N)
// DELETE — soft delete         (?id=N)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

requireRol('admin', 'coordinador', 'alumno');

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        $stmt = $pdo->query("
            SELECT id_periodo, nombre, fecha_inicio, fecha_fin, activo
            FROM periodos
            ORDER BY fecha_inicio DESC
        ");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'POST':
        requireRol('admin');
        $body = json_decode(file_get_contents('php://input'), true);

        $nombre      = trim($body['nombre']      ?? '');
        $fecha_inicio = trim($body['fecha_inicio'] ?? '');
        $fecha_fin    = trim($body['fecha_fin']    ?? '');

        if (!$nombre || !$fecha_inicio || !$fecha_fin) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos.']);
            exit;
        }

        if ($fecha_fin <= $fecha_inicio) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La fecha de fin debe ser posterior a la de inicio.']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO periodos (nombre, fecha_inicio, fecha_fin)
            VALUES (:nombre, :inicio, :fin)
        ");
        $stmt->execute([':nombre' => $nombre, ':inicio' => $fecha_inicio, ':fin' => $fecha_fin]);
        echo json_encode(['success' => true, 'message' => 'Período creado correctamente.']);
        break;

    case 'PUT':
        requireRol('admin');
        $id   = (int)($_GET['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true);

        $nombre      = trim($body['nombre']      ?? '');
        $fecha_inicio = trim($body['fecha_inicio'] ?? '');
        $fecha_fin    = trim($body['fecha_fin']    ?? '');
        $activo       = isset($body['activo']) ? (int)(bool)$body['activo'] : null;

        if (!$id || !$nombre || !$fecha_inicio || !$fecha_fin) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos.']);
            exit;
        }

        if ($fecha_fin <= $fecha_inicio) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La fecha de fin debe ser posterior a la de inicio.']);
            exit;
        }

        $activoSQL = $activo !== null ? ', activo = :activo' : '';
        $params = [':nombre' => $nombre, ':inicio' => $fecha_inicio, ':fin' => $fecha_fin, ':id' => $id];
        if ($activo !== null) $params[':activo'] = $activo;

        $stmt = $pdo->prepare("
            UPDATE periodos SET nombre = :nombre, fecha_inicio = :inicio, fecha_fin = :fin$activoSQL
            WHERE id_periodo = :id
        ");
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Período no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Período actualizado correctamente.']);
        break;

    case 'DELETE':
        requireRol('admin');
        $id = (int)($_GET['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID requerido.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE periodos SET activo = 0 WHERE id_periodo = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Período no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Período desactivado correctamente.']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}