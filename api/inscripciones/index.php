<?php
// ============================================================
// api/inscripciones/index.php
// GET    — listar inscripciones (?periodo=X  &carrera=ISC  o  &estudiante=Y)
// POST   — inscribir alumno en materia  {id_estudiante, id_materia, id_periodo}
// DELETE — eliminar inscripción         (?id=X)
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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
        $id_periodo    = (int)($_GET['periodo']    ?? 0);
        $id_estudiante = (int)($_GET['estudiante'] ?? 0);

        // Coordinador siempre usa su propia carrera del JWT
        $carrera = ($usuario->rol === 'coordinador')
            ? (string)($usuario->id_carrera ?? '')
            : trim($_GET['carrera'] ?? '');

        if (!$id_periodo) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El parámetro período es requerido.']);
            exit;
        }

        // LEFT JOIN desde estudiantes: siempre devuelve todos los alumnos
        // con o sin inscripciones en el período solicitado.
        $sql = "
            SELECT e.id_estudiante, e.matricula,
                   e.nombre AS est_nombre, e.apellido_paterno, e.apellido_materno, e.semestre,
                   i.id_inscripcion, i.id_materia,
                   m.nombre AS materia_nombre
            FROM estudiantes e
            LEFT JOIN inscripciones i
                ON  i.id_estudiante = e.id_estudiante
                AND i.id_periodo    = :periodo
            LEFT JOIN materias m ON m.id_materia = i.id_materia
            WHERE e.activo = 1
        ";
        $params = [':periodo' => $id_periodo];

        // Filtrar por carrera (requerido cuando se consulta lista completa)
        if ($carrera !== '') {
            $sql .= " AND e.id_carrera = :carrera";
            $params[':carrera'] = $carrera;
        }

        // O filtrar por estudiante específico (modal de gestión)
        if ($id_estudiante > 0) {
            $sql .= " AND e.id_estudiante = :est";
            $params[':est'] = $id_estudiante;
        }

        if ($carrera === '' && $id_estudiante === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Se requiere carrera o estudiante.']);
            exit;
        }

        $sql .= " ORDER BY e.apellido_paterno, e.apellido_materno, e.nombre, m.nombre";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    // --------------------------------------------------------
    case 'POST':
        $body          = json_decode(file_get_contents('php://input'), true);
        $id_estudiante = (int)($body['id_estudiante'] ?? 0);
        $id_materia    = trim($body['id_materia']     ?? '');
        $id_periodo    = (int)($body['id_periodo']    ?? 0);

        if (!$id_estudiante || !$id_materia || !$id_periodo) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Estudiante, materia y período son requeridos.']);
            exit;
        }

        // Coordinador solo puede inscribir alumnos de su carrera
        if ($usuario->rol === 'coordinador') {
            $chk = $pdo->prepare("SELECT id_carrera FROM estudiantes WHERE id_estudiante = :id");
            $chk->execute([':id' => $id_estudiante]);
            $est = $chk->fetch();
            if (!$est || $est['id_carrera'] !== $usuario->id_carrera) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'El alumno no pertenece a tu carrera.']);
                exit;
            }
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO inscripciones (id_estudiante, id_materia, id_periodo)
                VALUES (:est, :mat, :per)
            ");
            $stmt->execute([':est' => $id_estudiante, ':mat' => $id_materia, ':per' => $id_periodo]);
            echo json_encode(['success' => true, 'message' => 'Inscripción registrada.']);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'El alumno ya está inscrito en esa materia para ese período.']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al registrar la inscripción.']);
            }
        }
        break;

    // --------------------------------------------------------
    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);

        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID requerido.']);
            exit;
        }

        // Coordinador solo puede borrar inscripciones de su carrera
        if ($usuario->rol === 'coordinador') {
            $chk = $pdo->prepare("
                SELECT e.id_carrera FROM inscripciones i
                JOIN estudiantes e ON e.id_estudiante = i.id_estudiante
                WHERE i.id_inscripcion = :id
            ");
            $chk->execute([':id' => $id]);
            $fila = $chk->fetch();
            if (!$fila || $fila['id_carrera'] !== $usuario->id_carrera) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'No tienes permiso para eliminar esta inscripción.']);
                exit;
            }
        }

        $stmt = $pdo->prepare("DELETE FROM inscripciones WHERE id_inscripcion = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Inscripción no encontrada.']);
            exit;
        }

        echo json_encode(['success' => true, 'message' => 'Inscripción eliminada.']);
        break;

    // --------------------------------------------------------
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
