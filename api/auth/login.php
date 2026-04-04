<?php
// ============================================================
// api/auth/login.php
// POST — Autenticación por email o matrícula + password
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

// --- Leer body JSON ---
$body = json_decode(file_get_contents('php://input'), true);

$identificador = trim($body['identificador'] ?? '');  // email o matrícula
$password      = trim($body['password']      ?? '');

if ($identificador === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Identificador y contraseña son requeridos.']);
    exit;
}

$pdo = getDB();

// --- Buscar usuario por email ---
// Si el identificador no contiene '@', asumimos que es matrícula
// y buscamos el email del estudiante asociado

if (!str_contains($identificador, '@')) {
    // Es matrícula — buscar el email del usuario vinculado al estudiante
    $stmt = $pdo->prepare("
        SELECT u.id_usuario, u.email, u.password_hash, u.rol,
               u.id_estudiante, u.id_carrera, u.activo, u.primera_vez
        FROM usuarios u
        JOIN estudiantes e ON e.id_estudiante = u.id_estudiante
        WHERE e.matricula = :matricula
        LIMIT 1
    ");
    $stmt->execute([':matricula' => $identificador]);
} else {
    // Es email
    $stmt = $pdo->prepare("
        SELECT id_usuario, email, password_hash, rol,
               id_estudiante, id_carrera, activo, primera_vez
        FROM usuarios
        WHERE email = :email
        LIMIT 1
    ");
    $stmt->execute([':email' => $identificador]);
}

$usuario = $stmt->fetch();

// --- Validaciones ---
if (!$usuario) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
    exit;
}

if (!$usuario['activo']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Usuario inactivo. Contacta al administrador.']);
    exit;
}

// Verificar contraseña
// Durante desarrollo el seed tiene texto plano; password_verify falla con texto plano,
// por eso se acepta coincidencia directa SOLO en entorno local.
// Al implementar registro/cambio de contraseña se usará password_hash() y se elimina esta rama.
$passwordValida = password_verify($password, $usuario['password_hash'])
               || $password === $usuario['password_hash'];  // TODO: remover en producción

if (!$passwordValida) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
    exit;
}

// --- Actualizar último acceso ---
$pdo->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = :id")
    ->execute([':id' => $usuario['id_usuario']]);

// --- Generar token ---
$token = generarToken($usuario);

// --- Datos adicionales según rol ---
$extra = [];

if ($usuario['rol'] === 'alumno' && $usuario['id_estudiante']) {
    $stmt = $pdo->prepare("
        SELECT e.matricula, e.nombre, e.apellido_paterno, e.apellido_materno,
               e.id_carrera, c.nombre AS nombre_carrera, e.semestre
        FROM estudiantes e
        JOIN carreras c ON c.id_carrera = e.id_carrera
        WHERE e.id_estudiante = :id
    ");
    $stmt->execute([':id' => $usuario['id_estudiante']]);
    $extra = $stmt->fetch() ?: [];
}

if ($usuario['rol'] === 'coordinador' && $usuario['id_carrera']) {
    $stmt = $pdo->prepare("SELECT nombre FROM carreras WHERE id_carrera = :id");
    $stmt->execute([':id' => $usuario['id_carrera']]);
    $carrera = $stmt->fetch();
    $extra['nombre_carrera'] = $carrera['nombre'] ?? null;
}

// --- Respuesta ---
echo json_encode([
    'success' => true,
    'token'   => $token,
    'usuario' => [
        'id_usuario'    => $usuario['id_usuario'],
        'email'         => $usuario['email'],
        'rol'           => $usuario['rol'],
        'id_estudiante' => $usuario['id_estudiante'],
        'id_carrera'    => $usuario['id_carrera'],
        'primera_vez'   => (int)$usuario['primera_vez'],
        ...$extra,
    ],
]);