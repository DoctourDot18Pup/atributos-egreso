<?php
// ============================================================
// api/materias/index.php
// GET    — listar materias (con carreras asociadas)
// POST   — crear materia
// PUT    — actualizar materia  (?id=XXX)
// DELETE — soft delete         (?id=XXX)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

requireRol('admin', 'coordinador');

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    case 'GET':
        // Filtro opcional por carrera
        $id_carrera = trim($_GET['carrera'] ?? '');

        if ($id_carrera) {
            $stmt = $pdo->prepare("
                SELECT m.id_materia, m.nombre, m.fecha_inicio, m.fecha_fin, m.activo,
                       GROUP_CONCAT(mc.id_carrera ORDER BY mc.id_carrera SEPARATOR ', ') AS carreras
                FROM materias m
                JOIN materias_carreras mc ON mc.id_materia = m.id_materia
                WHERE mc.id_carrera = :carrera
                GROUP BY m.id_materia
                ORDER BY m.nombre ASC
            ");
            $stmt->execute([':carrera' => $id_carrera]);
        } else {
            $stmt = $pdo->query("
                SELECT m.id_materia, m.nombre, m.fecha_inicio, m.fecha_fin, m.activo,
                       GROUP_CONCAT(mc.id_carrera ORDER BY mc.id_carrera SEPARATOR ', ') AS carreras
                FROM materias m
                LEFT JOIN materias_carreras mc ON mc.id_materia = m.id_materia
                GROUP BY m.id_materia
                ORDER BY m.nombre ASC
            ");
        }

        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'POST':
        requireRol('admin');
        $body = json_decode(file_get_contents('php://input'), true);

        $id_materia   = strtoupper(trim($body['id_materia']   ?? ''));
        $nombre       = trim($body['nombre']                   ?? '');
        $fecha_inicio = trim($body['fecha_inicio']             ?? '') ?: null;
        $fecha_fin    = trim($body['fecha_fin']                ?? '') ?: null;
        $carreras     = $body['carreras'] ?? []; // array de id_carrera

        if (!$id_materia || !$nombre) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID y nombre son requeridos.']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO materias (id_materia, nombre, fecha_inicio, fecha_fin)
                VALUES (:id, :nombre, :inicio, :fin)
            ");
            $stmt->execute([
                ':id'     => $id_materia,
                ':nombre' => $nombre,
                ':inicio' => $fecha_inicio,
                ':fin'    => $fecha_fin,
            ]);

            // Insertar relaciones con carreras
            if (!empty($carreras)) {
                $stmtMC = $pdo->prepare("
                    INSERT INTO materias_carreras (id_materia, id_carrera) VALUES (:mat, :car)
                ");
                foreach ($carreras as $car) {
                    $stmtMC->execute([':mat' => $id_materia, ':car' => $car]);
                }
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Materia creada correctamente.']);

        } catch (PDOException $e) {
            $pdo->rollBack();
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => "Ya existe una materia con el ID '$id_materia'."]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear la materia.']);
            }
        }
        break;

    case 'PUT':
        requireRol('admin');
        $id   = trim($_GET['id'] ?? '');
        $body = json_decode(file_get_contents('php://input'), true);

        $nombre       = trim($body['nombre']       ?? '');
        $fecha_inicio = trim($body['fecha_inicio'] ?? '') ?: null;
        $fecha_fin    = trim($body['fecha_fin']    ?? '') ?: null;
        $activo       = isset($body['activo']) ? (int)(bool)$body['activo'] : null;
        $carreras     = $body['carreras'] ?? null;

        if (!$id || !$nombre) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID y nombre son requeridos.']);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $activoSQL = $activo !== null ? ', activo = :activo' : '';
            $params = [':nombre' => $nombre, ':inicio' => $fecha_inicio, ':fin' => $fecha_fin, ':id' => $id];
            if ($activo !== null) $params[':activo'] = $activo;

            $stmt = $pdo->prepare("
                UPDATE materias SET nombre = :nombre, fecha_inicio = :inicio, fecha_fin = :fin$activoSQL
                WHERE id_materia = :id
            ");
            $stmt->execute($params);

            // Actualizar carreras si se enviaron
            if ($carreras !== null) {
                $pdo->prepare("DELETE FROM materias_carreras WHERE id_materia = :id")
                    ->execute([':id' => $id]);

                $stmtMC = $pdo->prepare("
                    INSERT INTO materias_carreras (id_materia, id_carrera) VALUES (:mat, :car)
                ");
                foreach ($carreras as $car) {
                    $stmtMC->execute([':mat' => $id, ':car' => $car]);
                }
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Materia actualizada correctamente.']);

        } catch (PDOException $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al actualizar la materia.']);
        }
        break;

    case 'DELETE':
        requireRol('admin');
        $id = trim($_GET['id'] ?? '');

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID requerido.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE materias SET activo = 0 WHERE id_materia = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Materia no encontrada.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Materia desactivada correctamente.']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}