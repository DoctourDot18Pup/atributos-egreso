<?php
// ============================================================
// api/usuarios/index.php
// GET    — listar usuarios
// POST   — crear usuario
// PUT    — actualizar usuario  (?id=X)
// DELETE — soft delete         (?id=X)
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
        $rol = trim($_GET['rol'] ?? '');

        $sql = "
            SELECT u.id_usuario, u.email, u.rol,
                   u.id_estudiante, u.id_carrera,
                   u.activo, u.ultimo_acceso, u.created_at,
                   e.matricula, e.nombre AS est_nombre,
                   e.apellido_paterno, e.apellido_materno,
                   c.nombre AS carrera_nombre
            FROM usuarios u
            LEFT JOIN estudiantes e ON e.id_estudiante = u.id_estudiante
            LEFT JOIN carreras    c ON c.id_carrera    = u.id_carrera
        ";
        $params = [];

        if ($rol !== '') {
            $sql .= " WHERE u.rol = :rol";
            $params[':rol'] = $rol;
        }

        $sql .= " ORDER BY u.rol, u.email ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    // --------------------------------------------------------
    case 'POST':
        $body         = json_decode(file_get_contents('php://input'), true);
        $email        = strtolower(trim($body['email']        ?? ''));
        $password     = trim($body['password']                ?? '');
        $rol          = trim($body['rol']                     ?? 'alumno');
        $id_estudiante = isset($body['id_estudiante']) && $body['id_estudiante'] !== '' ? (int)$body['id_estudiante'] : null;
        $id_carrera   = strtoupper(trim($body['id_carrera']   ?? '')) ?: null;

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email y contraseña son requeridos.']);
            exit;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El email no tiene un formato válido.']);
            exit;
        }

        if (!in_array($rol, ['admin', 'coordinador', 'alumno'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Rol inválido.']);
            exit;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
            exit;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);

        try {
            $stmt = $pdo->prepare("
                INSERT INTO usuarios (email, password_hash, rol, id_estudiante, id_carrera)
                VALUES (:email, :hash, :rol, :est, :car)
            ");
            $stmt->execute([
                ':email' => $email,
                ':hash'  => $hash,
                ':rol'   => $rol,
                ':est'   => $id_estudiante,
                ':car'   => $id_carrera,
            ]);
            echo json_encode(['success' => true, 'message' => 'Usuario creado correctamente.']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => "Ya existe un usuario con el email '$email'."]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al crear el usuario.']);
            }
        }
        break;

    // --------------------------------------------------------
    case 'PUT':
        $id   = (int)($_GET['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID requerido.']);
            exit;
        }

        $sets   = [];
        $params = [':id' => $id];

        // Email
        if (isset($body['email'])) {
            $email = strtolower(trim($body['email']));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Email inválido.']);
                exit;
            }
            $sets[] = 'email = :email'; $params[':email'] = $email;
        }

        // Contraseña (opcional — solo si se envía)
        if (!empty($body['password'])) {
            if (strlen($body['password']) < 6) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.']);
                exit;
            }
            $sets[] = 'password_hash = :hash';
            $params[':hash'] = password_hash($body['password'], PASSWORD_BCRYPT);
        }

        if (isset($body['rol']))           { $sets[] = 'rol = :rol';                     $params[':rol']  = $body['rol']; }
        if (isset($body['activo']))        { $sets[] = 'activo = :activo';               $params[':activo'] = (int)$body['activo']; }
        if (array_key_exists('id_carrera', $body)) {
            $sets[] = 'id_carrera = :car';
            $params[':car'] = strtoupper(trim($body['id_carrera'])) ?: null;
        }
        if (array_key_exists('id_estudiante', $body)) {
            $sets[] = 'id_estudiante = :est';
            $params[':est'] = $body['id_estudiante'] !== '' && $body['id_estudiante'] !== null
                ? (int)$body['id_estudiante'] : null;
        }

        if (empty($sets)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Sin campos a actualizar.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE usuarios SET " . implode(', ', $sets) . " WHERE id_usuario = :id");
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Usuario actualizado correctamente.']);
        break;

    // --------------------------------------------------------
    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID requerido.']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE usuarios SET activo = 0 WHERE id_usuario = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Usuario desactivado correctamente.']);
        break;

    // --------------------------------------------------------
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
