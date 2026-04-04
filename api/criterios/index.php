<?php
// ============================================================
// api/criterios/index.php
// GET    — listar criterios (filtro ?ae=X o ?carrera=ISC)
// POST   — crear criterio
// PUT    — actualizar criterio  (?id=X)
// DELETE — soft delete          (?id=X)
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
        $id_ae   = (int)($_GET['ae']      ?? 0);
        $carrera = trim($_GET['carrera']  ?? '');

        $sql = "
            SELECT cr.id_criterio, cr.id_ae,
                   ae.codigo_ae, ae.nombre_corto AS ae_nombre_corto,
                   ae.id_carrera,
                   cr.codigo_criterio, cr.descripcion,
                   cr.desc_n1, cr.desc_n2, cr.desc_n3, cr.desc_n4,
                   cr.orden, cr.activo
            FROM criterios cr
            JOIN atributos_egreso ae ON ae.id_ae = cr.id_ae
            WHERE 1=1
        ";
        $params = [];

        if ($id_ae > 0) {
            $sql .= " AND cr.id_ae = :ae";
            $params[':ae'] = $id_ae;
        }

        if ($carrera !== '') {
            $sql .= " AND ae.id_carrera = :carrera";
            $params[':carrera'] = $carrera;
        }

        $sql .= " ORDER BY ae.id_carrera, ae.codigo_ae, cr.orden, cr.codigo_criterio";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    // --------------------------------------------------------
    case 'POST':
        if ($usuario->rol !== 'admin') { http_response_code(403); echo json_encode(['success'=>false,'message'=>'Acceso denegado.']); exit; }
        $body = json_decode(file_get_contents('php://input'), true);

        $id_ae          = (int)($body['id_ae']          ?? 0);
        $codigo         = trim($body['codigo_criterio']  ?? '');
        $descripcion    = trim($body['descripcion']      ?? '');
        $desc_n1        = trim($body['desc_n1']          ?? 'No suficiente');
        $desc_n2        = trim($body['desc_n2']          ?? 'Suficiente');
        $desc_n3        = trim($body['desc_n3']          ?? 'Bueno');
        $desc_n4        = trim($body['desc_n4']          ?? 'Muy Bueno');
        $orden          = (int)($body['orden']           ?? 0);

        if (!$id_ae || !$codigo || !$descripcion) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'AE, código y descripción son requeridos.']);
            exit;
        }

        if (!preg_match('/^\d{2}$/', $codigo)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El código debe ser un número de 2 dígitos (ej: 01).']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO criterios
                    (id_ae, codigo_criterio, descripcion, desc_n1, desc_n2, desc_n3, desc_n4, orden)
                VALUES
                    (:ae, :codigo, :desc, :n1, :n2, :n3, :n4, :orden)
            ");
            $stmt->execute([
                ':ae'     => $id_ae,
                ':codigo' => $codigo,
                ':desc'   => $descripcion,
                ':n1'     => $desc_n1 ?: 'No suficiente',
                ':n2'     => $desc_n2 ?: 'Suficiente',
                ':n3'     => $desc_n3 ?: 'Bueno',
                ':n4'     => $desc_n4 ?: 'Muy Bueno',
                ':orden'  => $orden,
            ]);
            echo json_encode(['success' => true, 'message' => 'Criterio creado correctamente.']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => "Ya existe el criterio $codigo para ese AE."]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear el criterio.']);
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

        $campos = [
            'descripcion' => ':desc',
            'desc_n1'     => ':n1',
            'desc_n2'     => ':n2',
            'desc_n3'     => ':n3',
            'desc_n4'     => ':n4',
            'orden'       => ':orden',
            'activo'      => ':activo',
        ];

        foreach ($campos as $col => $placeholder) {
            if (isset($body[$col])) {
                $sets[]           = "$col = $placeholder";
                $params[$placeholder] = ($col === 'activo' || $col === 'orden')
                    ? (int)$body[$col]
                    : trim($body[$col]);
            }
        }

        if (empty($sets)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Sin campos a actualizar.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE criterios SET " . implode(', ', $sets) . " WHERE id_criterio = :id");
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Criterio no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Criterio actualizado correctamente.']);
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

        $stmt = $pdo->prepare("UPDATE criterios SET activo = 0 WHERE id_criterio = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Criterio no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Criterio desactivado correctamente.']);
        break;

    // --------------------------------------------------------
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
