<?php
// ============================================================
// api/auth/cambiar-password.php
// POST — Cambio de contraseña para cualquier usuario autenticado
// Body: { password_actual?, password_nuevo }
//
// Si el usuario tiene primera_vez = 1 en BD, no se requiere
// password_actual (viene con contraseña temporal = matrícula).
// Después del cambio exitoso, primera_vez se pone en 0.
//
// Requisitos de la nueva contraseña:
//   - Mínimo 8 caracteres
//   - Al menos 1 mayúscula, 1 minúscula, 1 dígito, 1 carácter especial
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$usuario = requireRol('admin', 'coordinador', 'alumno');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$body           = json_decode(file_get_contents('php://input'), true);
$passActual     = $body['password_actual'] ?? '';
$passNuevo      = $body['password_nuevo']  ?? '';

// Validar formato de la nueva contraseña
if (strlen($passNuevo) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres.']);
    exit;
}

if (!preg_match('/[A-Z]/', $passNuevo)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La contraseña debe contener al menos una letra mayúscula.']);
    exit;
}

if (!preg_match('/[a-z]/', $passNuevo)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La contraseña debe contener al menos una letra minúscula.']);
    exit;
}

if (!preg_match('/[0-9]/', $passNuevo)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La contraseña debe contener al menos un número.']);
    exit;
}

if (!preg_match('/[#?!@$%^&*\-_.]/', $passNuevo)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'La contraseña debe contener al menos un carácter especial (#?!@$%^&*-_.).']);
    exit;
}

$pdo = getDB();

// Obtener datos actuales del usuario
$stmt = $pdo->prepare("
    SELECT password_hash, primera_vez
    FROM usuarios
    WHERE id_usuario = :id AND activo = 1
");
$stmt->execute([':id' => $usuario->id_usuario]);
$dbUser = $stmt->fetch();

if (!$dbUser) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
    exit;
}

// Verificar contraseña actual solo si no es primer ingreso
if ($dbUser['primera_vez'] == 0) {
    if ($passActual === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Se requiere la contraseña actual.']);
        exit;
    }

    $valida = password_verify($passActual, $dbUser['password_hash'])
           || $passActual === $dbUser['password_hash']; // fallback texto plano (dev)

    if (!$valida) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'La contraseña actual es incorrecta.']);
        exit;
    }
}

// Actualizar contraseña y marcar primera_vez = 0
$nuevoHash = password_hash($passNuevo, PASSWORD_DEFAULT);

$upd = $pdo->prepare("
    UPDATE usuarios
    SET password_hash = :hash, primera_vez = 0
    WHERE id_usuario = :id
");
$upd->execute([':hash' => $nuevoHash, ':id' => $usuario->id_usuario]);

echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente.']);
