<?php
// ============================================================
// api/atributos/index.php
// GET    — listar AE (filtro opcional ?carrera=ISC)
// POST   — crear AE
// PUT    — actualizar AE  (?id=X)
// DELETE — soft delete    (?id=X)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

requireRol('admin');

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // --------------------------------------------------------
    case 'GET':
        $carrera = trim($_GET['carrera'] ?? '');

        $sql = "
            SELECT ae.id_ae, ae.id_carrera, c.nombre AS carrera_nombre,
                   ae.codigo_ae, ae.nombre, ae.nombre_corto, ae.activo, ae.created_at
            FROM atributos_egreso ae
            JOIN carreras c ON c.id_carrera = ae.id_carrera
        ";
        $params = [];

        if ($carrera !== '') {
            $sql .= " WHERE ae.id_carrera = :carrera";
            $params[':carrera'] = $carrera;
        }

        $sql .= " ORDER BY ae.id_carrera, ae.codigo_ae ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    // --------------------------------------------------------
    case 'POST':
        $body = json_decode(file_get_contents('php://input'), true);

        $id_carrera  = strtoupper(trim($body['id_carrera']  ?? ''));
        $codigo_ae   = trim($body['codigo_ae']   ?? '');
        $nombre      = trim($body['nombre']      ?? '');
        $nombre_corto = trim($body['nombre_corto'] ?? '');

        if (!$id_carrera || !$codigo_ae || !$nombre) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Carrera, código y nombre son requeridos.']);
            exit;
        }

        if (!preg_match('/^\d{2}$/', $codigo_ae)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El código AE debe ser un número de 2 dígitos (ej: 01, 08).']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO atributos_egreso (id_carrera, codigo_ae, nombre, nombre_corto)
                VALUES (:carrera, :codigo, :nombre, :corto)
            ");
            $stmt->execute([
                ':carrera' => $id_carrera,
                ':codigo'  => $codigo_ae,
                ':nombre'  => $nombre,
                ':corto'   => $nombre_corto ?: null,
            ]);
            echo json_encode(['success' => true, 'message' => 'Atributo de Egreso creado correctamente.']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => "Ya existe el AE $codigo_ae para esa carrera."]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear el AE.']);
            }
        }
        break;

    // --------------------------------------------------------
    case 'PUT':
        $id   = (int)($_GET['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true);

        $body         = json_decode(file_get_contents('php://input'), true);
        $nombre       = isset($body['nombre'])       ? trim($body['nombre'])       : null;
        $nombre_corto = isset($body['nombre_corto']) ? trim($body['nombre_corto']) : null;
        $activo       = isset($body['activo'])       ? (int)(bool)$body['activo'] : null;

        if (!$id || ($nombre === null && $activo === null)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Se requiere al menos nombre o activo.']);
            exit;
        }

        $sets   = [];
        $params = [':id' => $id];
        if ($nombre !== null)       { $sets[] = 'nombre = :nombre';       $params[':nombre'] = $nombre; }
        if ($nombre_corto !== null) { $sets[] = 'nombre_corto = :corto';  $params[':corto']  = $nombre_corto ?: null; }
        if ($activo !== null)       { $sets[] = 'activo = :activo';       $params[':activo'] = $activo; }

        $stmt = $pdo->prepare("UPDATE atributos_egreso SET " . implode(', ', $sets) . " WHERE id_ae = :id");
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Atributo no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Atributo actualizado correctamente.']);
        break;

    // --------------------------------------------------------
    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID requerido.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE atributos_egreso SET activo = 0 WHERE id_ae = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Atributo no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Atributo desactivado correctamente.']);
        break;

    // --------------------------------------------------------
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
