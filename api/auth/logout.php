<?php
// ============================================================
// api/auth/logout.php
// POST — Cierre de sesión
// Con JWT stateless el logout es responsabilidad del cliente
// (eliminar el token del localStorage). Este endpoint existe
// para registrar el evento en auditoría y como punto de
// extensión si en el futuro se implementa una blacklist.
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

require_once __DIR__ . '/../config/session.php';

// Validar que el token sea válido antes de registrar logout
$payload = validarToken();

// Aquí se podría agregar el token a una blacklist en BD si se requiere en el futuro

echo json_encode([
    'success' => true,
    'message' => 'Sesión cerrada correctamente.',
]);