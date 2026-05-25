<?php
session_start();
require_once 'conexion.php';

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');
$password_confirmation = trim($_POST['password_confirmation'] ?? '');

$errors = [];

if (empty($name)) $errors[] = "Ingresa tu nombre.";
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "Email no válido.";
if (strlen($password) < 6) $errors[] = "Mínimo 6 caracteres.";
if ($password !== $password_confirmation) $errors[] = "Las contraseñas no coinciden.";

if (!empty($errors)) {
    $_SESSION['errors'] = $errors;
    header("Location: register.php");
    exit();
}

$stmt = $conn->prepare("SELECT idusuario FROM usuario WHERE correo = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $_SESSION['errors'] = ["Ese correo ya está registrado."];
    header("Location: register.php");
    exit();
}

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO usuario (usuario, correo, contrasena) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $name, $email, $hashedPassword);

if ($stmt->execute()) {
    $_SESSION['success'] = "✅ Registro exitoso. Ahora inicia sesión.";
    header("Location: login.php");
    exit();
}

$_SESSION['errors'] = ["No se pudo registrar el usuario."];
header("Location: register.php");
exit();