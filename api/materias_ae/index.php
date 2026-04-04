<?php
// ============================================================
// api/materias_ae/index.php
// GET    — listar relaciones (filtro ?materia=X o ?carrera=ISC)
// POST   — crear relación
// PUT    — actualizar nivel  (?id=X)
// DELETE — eliminar relación (?id=X)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$usuario = requireRol('admin', 'coordinador', 'alumno');

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // --------------------------------------------------------
    case 'GET':
        $id_materia = trim($_GET['materia'] ?? '');
        // Coordinador solo puede ver AE de su carrera
        if ($usuario->rol === 'coordinador') {
            $carrera = $usuario->id_carrera;
        } else {
            $carrera = trim($_GET['carrera'] ?? '');
        }

        $sql = "
            SELECT mae.id_materia_ae, mae.id_materia, mae.id_ae, mae.nivel_ae,
                   m.nombre   AS materia_nombre,
                   ae.codigo_ae, ae.nombre_corto AS ae_nombre_corto,
                   ae.nombre  AS ae_nombre,
                   ae.id_carrera
            FROM materias_ae mae
            JOIN materias          m  ON m.id_materia = mae.id_materia
            JOIN atributos_egreso  ae ON ae.id_ae     = mae.id_ae
            WHERE 1=1
        ";
        $params = [];

        if ($id_materia !== '') {
            $sql .= " AND mae.id_materia = :materia";
            $params[':materia'] = $id_materia;
        }

        if ($carrera !== '') {
            $sql .= " AND ae.id_carrera = :carrera";
            $params[':carrera'] = $carrera;
        }

        $sql .= " ORDER BY mae.id_materia, ae.id_carrera, ae.codigo_ae";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    // --------------------------------------------------------
    case 'POST':
        if ($usuario->rol !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Acceso denegado.']); exit; }
        $body       = json_decode(file_get_contents('php://input'), true);
        $id_materia = trim($body['id_materia'] ?? '');
        $id_ae      = (int)($body['id_ae']     ?? 0);
        $nivel_ae   = strtoupper(trim($body['nivel_ae'] ?? ''));

        if (!$id_materia || !$id_ae || !in_array($nivel_ae, ['I', 'M', 'A'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Materia, AE y nivel (I/M/A) son requeridos.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO materias_ae (id_materia, id_ae, nivel_ae)
                VALUES (:materia, :ae, :nivel)
            ");
            $stmt->execute([':materia' => $id_materia, ':ae' => $id_ae, ':nivel' => $nivel_ae]);
            echo json_encode(['success' => true, 'message' => 'Relación creada correctamente.']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Esa materia ya tiene asignado ese AE.']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear la relación.']);
            }
        }
        break;

    // --------------------------------------------------------
    case 'PUT':
        if ($usuario->rol !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Acceso denegado.']); exit; }
        $id       = (int)($_GET['id'] ?? 0);
        $body     = json_decode(file_get_contents('php://input'), true);
        $nivel_ae = strtoupper(trim($body['nivel_ae'] ?? ''));

        if (!$id || !in_array($nivel_ae, ['I', 'M', 'A'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID y nivel (I/M/A) son requeridos.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE materias_ae SET nivel_ae = :nivel WHERE id_materia_ae = :id");
        $stmt->execute([':nivel' => $nivel_ae, ':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Relación no encontrada.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Nivel actualizado correctamente.']);
        break;

    // --------------------------------------------------------
    case 'DELETE':
        if ($usuario->rol !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Acceso denegado.']); exit; }
        $id = (int)($_GET['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID requerido.']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM materias_ae WHERE id_materia_ae = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Relación no encontrada.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Relación eliminada correctamente.']);
        break;

    // --------------------------------------------------------
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
