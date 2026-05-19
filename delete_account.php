<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');
require_once 'conexion.php';

if (!isset($_SESSION['user']['id_usuario'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Sesión no válida']);
    exit;
}

$id = (int)$_SESSION['user']['id_usuario'];

$stmt = $conn->prepare("DELETE FROM usuario WHERE id_usuario = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }

    session_destroy();

    echo json_encode(['ok' => true, 'message' => 'Cuenta eliminada correctamente']);
    exit;
}

http_response_code(500);
echo json_encode(['ok' => false, 'message' => 'No se pudo eliminar la cuenta']);