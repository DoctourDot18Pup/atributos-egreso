<?php
// ============================================================
// api/config/session.php
// Generación y validación de JWT
// ============================================================

require_once __DIR__ . '/../../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

// Cambia este valor por uno seguro antes de producción
define('JWT_SECRET', 'itc_ae_celaya_2026_local_dev_key_secure_32x');
define('JWT_ALGO',   'HS256');
define('JWT_TTL',    60 * 60 * 8);  // 8 horas en segundos

// ------------------------------------------------------------
// Genera un JWT con los datos del usuario
// ------------------------------------------------------------
function generarToken(array $usuario): string {
    $ahora = time();

    $payload = [
        'iat'         => $ahora,
        'exp'         => $ahora + JWT_TTL,
        'id_usuario'  => $usuario['id_usuario'],
        'email'       => $usuario['email'],
        'rol'         => $usuario['rol'],
        'id_carrera'  => $usuario['id_carrera'] ?? null,
        'id_estudiante' => $usuario['id_estudiante'] ?? null,
    ];

    return JWT::encode($payload, JWT_SECRET, JWT_ALGO);
}

// ------------------------------------------------------------
// Valida el token del header Authorization: Bearer <token>
// Retorna el payload decodificado o termina con 401
// ------------------------------------------------------------
function validarToken(): object {
    $headers = getallheaders();
    $auth    = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!str_starts_with($auth, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token no proporcionado.']);
        exit;
    }

    $token = substr($auth, 7);

    try {
        $decoded = JWT::decode($token, new Key(JWT_SECRET, JWT_ALGO));
        return $decoded;
    } catch (ExpiredException) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'La sesión ha expirado.']);
        exit;
    } catch (SignatureInvalidException) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido.']);
        exit;
    } catch (Exception) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token malformado.']);
        exit;
    }
}

// ------------------------------------------------------------
// Verifica que el usuario autenticado tenga uno de los roles permitidos
// Uso: requireRol('admin') o requireRol('admin', 'coordinador')
// ------------------------------------------------------------
function requireRol(string ...$roles): object {
    $payload = validarToken();

    if (!in_array($payload->rol, $roles, true)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso no autorizado para este rol.']);
        exit;
    }

    return $payload;
}