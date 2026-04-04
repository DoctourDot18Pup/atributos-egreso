<?php
// ============================================================
// api/estudiantes/importar.php
// POST — Importación masiva de alumnos desde CSV (coordinador)
// Body: { filas: [{matricula, nombre, apellido_paterno, apellido_materno, semestre}] }
// Genera automáticamente:
//   email         = {matricula}@itcelaya.edu.mx
//   password_hash = bcrypt({matricula})
//   primera_vez   = 1  (el alumno debe cambiar contraseña en su primer ingreso)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$usuario = requireRol('admin', 'coordinador');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

$body  = json_decode(file_get_contents('php://input'), true);
$filas = $body['filas'] ?? [];

if (empty($filas) || !is_array($filas)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere al menos una fila.']);
    exit;
}

// La carrera la toma del JWT (coordinador) o del body (admin)
$id_carrera = ($usuario->rol === 'coordinador')
    ? (string)($usuario->id_carrera ?? '')
    : trim($body['id_carrera'] ?? '');

if ($id_carrera === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Se requiere carrera.']);
    exit;
}

$pdo = getDB();

// Verificar que la carrera exista
$chkCarrera = $pdo->prepare("SELECT id_carrera FROM carreras WHERE id_carrera = :c");
$chkCarrera->execute([':c' => $id_carrera]);
if (!$chkCarrera->fetch()) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Carrera no encontrada.']);
    exit;
}

$insertados = 0;
$duplicados = 0;
$errores    = [];

foreach ($filas as $idx => $fila) {
    $numFila        = $idx + 2;   // +2 porque fila 1 = encabezado
    $matricula      = strtoupper(trim($fila['matricula']       ?? ''));
    $nombre         = trim($fila['nombre']                     ?? '');
    $ap_paterno     = trim($fila['apellido_paterno']           ?? '');
    $ap_materno     = trim($fila['apellido_materno']           ?? '');
    $semestre       = (int)($fila['semestre']                  ?? 0);

    // Validaciones básicas
    if ($matricula === '' || $nombre === '') {
        $errores[] = [
            'fila'      => $numFila,
            'matricula' => $matricula ?: '(vacía)',
            'motivo'    => 'Matrícula y nombre son requeridos.',
        ];
        continue;
    }

    if ($semestre < 1 || $semestre > 12) {
        $errores[] = [
            'fila'      => $numFila,
            'matricula' => $matricula,
            'motivo'    => 'Semestre inválido (debe ser 1–12).',
        ];
        continue;
    }

    try {
        // ¿El alumno ya existe?
        $chkEst = $pdo->prepare(
            "SELECT id_estudiante FROM estudiantes WHERE matricula = :mat"
        );
        $chkEst->execute([':mat' => $matricula]);
        $estExistente = $chkEst->fetch();

        if ($estExistente) {
            $duplicados++;
            continue;
        }

        // Insertar estudiante
        $stmtEst = $pdo->prepare("
            INSERT INTO estudiantes
                (matricula, nombre, apellido_paterno, apellido_materno, id_carrera, semestre)
            VALUES (:mat, :nom, :ap, :am, :car, :sem)
        ");
        $stmtEst->execute([
            ':mat' => $matricula,
            ':nom' => $nombre,
            ':ap'  => $ap_paterno,
            ':am'  => $ap_materno,
            ':car' => $id_carrera,
            ':sem' => $semestre,
        ]);
        $id_estudiante = (int)$pdo->lastInsertId();

        // Crear cuenta de usuario
        $email = strtolower($matricula) . '@itcelaya.edu.mx';
        $hash  = password_hash($matricula, PASSWORD_DEFAULT);

        $stmtUsr = $pdo->prepare("
            INSERT IGNORE INTO usuarios
                (email, password_hash, rol, id_estudiante, primera_vez)
            VALUES (:email, :hash, 'alumno', :id_est, 1)
        ");
        $stmtUsr->execute([
            ':email'  => $email,
            ':hash'   => $hash,
            ':id_est' => $id_estudiante,
        ]);

        $insertados++;

    } catch (PDOException $e) {
        $errores[] = [
            'fila'      => $numFila,
            'matricula' => $matricula,
            'motivo'    => 'Error de base de datos al insertar.',
        ];
    }
}

echo json_encode([
    'success'    => true,
    'insertados' => $insertados,
    'duplicados' => $duplicados,
    'errores'    => $errores,
]);
