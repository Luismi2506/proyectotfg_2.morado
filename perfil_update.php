<?php
session_start();
header('Content-Type: application/json; charset=UTF-8');
require_once 'conexion.php';

if (!isset($_SESSION['user']['idusuario'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Sesión no válida']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'Datos no válidos']);
    exit;
}

$usuario = trim($data['nombre'] ?? '');
$correo = trim($data['email'] ?? '');
$contrasena = trim($data['pass'] ?? '');

if ($usuario === '' || $correo === '') {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Nombre y email son obligatorios']);
    exit;
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'El email no es válido']);
    exit;
}

$id = (int)$_SESSION['user']['idusuario'];

$stmt = $conn->prepare("SELECT idusuario FROM usuario WHERE correo = ? AND idusuario <> ?");
$stmt->bind_param("si", $correo, $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['ok' => false, 'message' => 'Ese correo ya está en uso']);
    exit;
}

if ($contrasena !== '') {
    $hashed = password_hash($contrasena, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE usuario SET usuario = ?, correo = ?, contrasena = ? WHERE idusuario = ?");
    $stmt->bind_param("sssi", $usuario, $correo, $hashed, $id);
} else {
    $stmt = $conn->prepare("UPDATE usuario SET usuario = ?, correo = ? WHERE idusuario = ?");
    $stmt->bind_param("ssi", $usuario, $correo, $id);
}

if ($stmt->execute()) {
    $_SESSION['user']['usuario'] = $usuario;
    $_SESSION['user']['correo'] = $correo;
    $_SESSION['username'] = $usuario;
    $_SESSION['useremail'] = $correo;

    echo json_encode(['ok' => true, 'message' => 'Perfil actualizado correctamente']);
    exit;
}

http_response_code(500);
echo json_encode(['ok' => false, 'message' => 'No se pudo actualizar el perfil']);