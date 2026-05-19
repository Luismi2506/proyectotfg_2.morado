<?php
session_start();
require_once 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: login.php");
    exit();
}

$correo = trim($_POST['email'] ?? '');
$contrasena = trim($_POST['password'] ?? '');

if ($correo === '' || $contrasena === '') {
    $_SESSION['error'] = "Debes rellenar correo y contraseña.";
    header("Location: login.php");
    exit();
}

$stmt = $conn->prepare("SELECT id_usuario, usuario, correo, contrasena FROM usuario WHERE correo = ?");
$stmt->bind_param("s", $correo);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows !== 1) {
    $_SESSION['error'] = "Correo o contraseña incorrectos.";
    header("Location: login.php");
    exit();
}

$user = $result->fetch_assoc();

if (!password_verify($contrasena, $user['contrasena'])) {
    $_SESSION['error'] = "Correo o contraseña incorrectos.";
    header("Location: login.php");
    exit();
}

$_SESSION['user'] = [
    'id_usuario' => $user['id_usuario'],
    'usuario' => $user['usuario'],
    'correo' => $user['correo']
];

$_SESSION['username'] = $user['usuario'];
$_SESSION['useremail'] = $user['correo'];

header("Location: index.php");
exit();