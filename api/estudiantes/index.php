<?php
// ============================================================
// api/estudiantes/index.php
// GET    — listar estudiantes (filtro ?carrera=ISC)
// POST   — crear estudiante
// PUT    — actualizar estudiante  (?id=X)
// DELETE — soft delete            (?id=X)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$usuario = requireRol('admin', 'coordinador');

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // --------------------------------------------------------
    case 'GET':
        // Coordinador solo puede ver su propia carrera
        if ($usuario->rol === 'coordinador') {
            $carrera = $usuario->id_carrera;
        } else {
            $carrera = trim($_GET['carrera'] ?? '');
        }

        $sql = "
            SELECT e.id_estudiante, e.matricula, e.nombre,
                   e.apellido_paterno, e.apellido_materno,
                   e.id_carrera, c.nombre AS carrera_nombre,
                   e.semestre, e.activo, e.created_at
            FROM estudiantes e
            JOIN carreras c ON c.id_carrera = e.id_carrera
        ";
        $params = [];

        if ($carrera !== '') {
            $sql .= " WHERE e.id_carrera = :carrera";
            $params[':carrera'] = $carrera;
        }

        $sql .= " ORDER BY e.apellido_paterno, e.apellido_materno, e.nombre ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    // --------------------------------------------------------
    case 'POST':
        if ($usuario->rol !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Acceso denegado.']); exit; }
        $body = json_decode(file_get_contents('php://input'), true);

        $matricula  = trim($body['matricula']         ?? '');
        $nombre     = trim($body['nombre']            ?? '');
        $ap_pat     = trim($body['apellido_paterno']  ?? '') ?: null;
        $ap_mat     = trim($body['apellido_materno']  ?? '') ?: null;
        $id_carrera = strtoupper(trim($body['id_carrera'] ?? ''));
        $semestre   = isset($body['semestre']) && $body['semestre'] !== '' ? (int)$body['semestre'] : null;

        if (!$matricula || !$nombre || !$id_carrera) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Matrícula, nombre y carrera son requeridos.']);
            exit;
        }

        if ($semestre !== null && ($semestre < 1 || $semestre > 12)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El semestre debe estar entre 1 y 12.']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO estudiantes (matricula, nombre, apellido_paterno, apellido_materno, id_carrera, semestre)
                VALUES (:mat, :nom, :ap, :am, :car, :sem)
            ");
            $stmt->execute([
                ':mat' => $matricula,
                ':nom' => $nombre,
                ':ap'  => $ap_pat,
                ':am'  => $ap_mat,
                ':car' => $id_carrera,
                ':sem' => $semestre,
            ]);
            echo json_encode(['success' => true, 'message' => 'Estudiante registrado correctamente.']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => "Ya existe un estudiante con la matrícula '$matricula'."]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al registrar el estudiante.']);
            }
        }
        break;

    // --------------------------------------------------------
    case 'PUT':
        if ($usuario->rol !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Acceso denegado.']); exit; }
        $id   = (int)($_GET['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID requerido.']);
            exit;
        }

        $sets   = [];
        $params = [':id' => $id];

        $mapa = [
            'nombre'           => ':nom',
            'apellido_paterno' => ':ap',
            'apellido_materno' => ':am',
            'id_carrera'       => ':car',
            'semestre'         => ':sem',
            'activo'           => ':activo',
        ];

        foreach ($mapa as $col => $ph) {
            if (array_key_exists($col, $body)) {
                $val = $body[$col];
                if ($col === 'id_carrera') $val = strtoupper(trim($val));
                elseif ($col === 'activo' || $col === 'semestre') $val = $val !== '' && $val !== null ? (int)$val : null;
                else $val = trim($val) ?: null;
                $sets[]     = "$col = $ph";
                $params[$ph] = $val;
            }
        }

        if (empty($sets)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Sin campos a actualizar.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE estudiantes SET " . implode(', ', $sets) . " WHERE id_estudiante = :id");
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Estudiante no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Estudiante actualizado correctamente.']);
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

        $stmt = $pdo->prepare("UPDATE estudiantes SET activo = 0 WHERE id_estudiante = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Estudiante no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Estudiante desactivado correctamente.']);
        break;

    // --------------------------------------------------------
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
