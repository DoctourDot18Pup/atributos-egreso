<?php
// ============================================================
// api/auth/me.php
// GET — Retorna los datos del usuario autenticado
// Útil para que el frontend restaure la sesión al recargar
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$payload = validarToken();
$pdo     = getDB();

$stmt = $pdo->prepare("
    SELECT u.id_usuario, u.email, u.rol, u.id_estudiante, u.id_carrera, u.ultimo_acceso
    FROM usuarios u
    WHERE u.id_usuario = :id AND u.activo = 1
");
$stmt->execute([':id' => $payload->id_usuario]);
$usuario = $stmt->fetch();

if (!$usuario) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
    exit;
}

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

echo json_encode([
    'success' => true,
    'usuario' => [
        ...$usuario,
        ...$extra,
    ],
]);