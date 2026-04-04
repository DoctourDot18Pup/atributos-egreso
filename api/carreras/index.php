<?php
// ============================================================
// api/carreras/index.php
// GET  — listar carreras
// POST — crear carrera
// PUT  — actualizar carrera  (?id=XXX)
// DELETE — eliminar (soft delete) (?id=XXX)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

// Todos los métodos requieren estar autenticado como admin
requireRol('admin');

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ============================================================
switch ($method) {

    // --------------------------------------------------------
    case 'GET':
        $stmt = $pdo->query("
            SELECT id_carrera, nombre, activo, created_at
            FROM carreras
            ORDER BY nombre ASC
        ");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    // --------------------------------------------------------
    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);

        $id_carrera = strtoupper(trim($body['id_carrera'] ?? ''));
        $nombre     = trim($body['nombre'] ?? '');

        if (!$id_carrera || !$nombre) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID y nombre son requeridos.']);
            exit;
        }

        if (!preg_match('/^[A-Z]{1,10}$/', $id_carrera)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El ID solo debe contener letras (máx. 10).']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO carreras (id_carrera, nombre) VALUES (:id, :nombre)");
            $stmt->execute([':id' => $id_carrera, ':nombre' => $nombre]);
            echo json_encode(['success' => true, 'message' => 'Carrera creada correctamente.']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => "Ya existe una carrera con el ID '$id_carrera'."]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear la carrera.']);
            }
        }
        break;

    // --------------------------------------------------------
    case 'PUT':
        $id   = trim($_GET['id'] ?? '');
        $body = json_decode(file_get_contents('php://input'), true);
        $nombre = trim($body['nombre'] ?? '');
        $activo = isset($body['activo']) ? (int)(bool)$body['activo'] : null;

        if (!$id || !$nombre) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID y nombre son requeridos.']);
            exit;
        }

        $params = [':nombre' => $nombre, ':id' => $id];
        $activoSQL = '';

        if ($activo !== null) {
            $activoSQL = ', activo = :activo';
            $params[':activo'] = $activo;
        }

        $stmt = $pdo->prepare("UPDATE carreras SET nombre = :nombre$activoSQL WHERE id_carrera = :id");
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Carrera no encontrada.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Carrera actualizada correctamente.']);
        break;

    // --------------------------------------------------------
    case 'DELETE':
        $id = trim($_GET['id'] ?? '');

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID requerido.']);
            exit;
        }

        // Soft delete
        $stmt = $pdo->prepare("UPDATE carreras SET activo = 0 WHERE id_carrera = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Carrera no encontrada.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Carrera desactivada correctamente.']);
        break;

    // --------------------------------------------------------
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}