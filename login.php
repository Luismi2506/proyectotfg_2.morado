<?php
session_start();
$errors = $_SESSION['errors'] ?? [];
$success = $_SESSION['success'] ?? '';
unset($_SESSION['errors'], $_SESSION['success']);
?>

<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Login - PocketSaver</title>
<link rel="stylesheet" href="estilos.css">

<style>
body{
  margin:0;
  font-family:var(--font-sans, system-ui, sans-serif);
  background: radial-gradient(circle at top, var(--royal-violet), var(--dark-amethyst));
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  color:white;
}

/* Caja principal */
.auth-box{
  width:100%;
  max-width:380px;
  background: var(--indigo-velvet);
  border: 1px solid var(--indigo-ink);
  border-radius:16px;
  padding:2rem;
  box-shadow:0 10px 30px rgba(0,0,0,0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}

.auth-box:hover{
  transform: translateY(-4px);
  box-shadow:0 15px 40px rgba(0,0,0,0.7);
}

/* Header */
.auth-title{
  text-align:center;
  margin-bottom:20px;
}

.auth-title h2{
  margin:0;
  font-weight:600;
}

.auth-title p{
  font-size:13px;
  opacity:0.7;
}

/* Inputs */
.form-group{
  margin-bottom:14px;
}

.form-group label{
  font-size:12px;
  opacity:0.8;
  display:block;
  margin-bottom:4px;
}

.form-group input{
  width:100%;
  padding:10px;
  border-radius:8px;
  border:1px solid var(--indigo-ink);
  outline:none;
  background: transparent;
  color:white;
  font-size:14px;
  transition: border 0.2s, box-shadow 0.2s;
}

.form-group input::placeholder{
  color:rgba(255,255,255,0.5);
}

.form-group input:focus{
  border-color: var(--lavender-purple);
  box-shadow: 0 0 0 2px rgba(157,78,221,0.3);
}

/* Botón */
.btn-login,
.btn-register{
  width:100%;
  padding:10px;
  border:none;
  border-radius:8px;
  background:white;
  color:var(--dark-amethyst);
  font-weight:600;
  cursor:pointer;
  margin-top:10px;
  transition: all 0.2s;
}

.btn-login:hover,
.btn-register:hover{
  background: var(--mauve);
  transform: scale(1.05);
}

/* Alertas */
.alert{
  padding:8px;
  border-radius:6px;
  font-size:12px;
  margin-bottom:10px;
}

.alert-error{
  background:#ff6b6b33;
  color:#ff6b6b;
}

.alert-success{
  background:#c77dff33;
  color:var(--mauve-magic);
}

/* Footer */
.auth-footer{
  text-align:center;
  margin-top:15px;
  font-size:13px;
}

.auth-footer a{
  color: var(--mauve);
  font-weight:500;
  text-decoration:none;
}

.auth-footer a:hover{
  text-decoration:underline;
}
</style>
</head>

<body>

<div class="auth-box">

  <div class="auth-title">
    <h2>💰 Pocket Saver</h2>
    <p>Gestiona tu dinero fácil</p>
  </div>

  <?php if($success): ?>
    <div class="alert alert-success"><?php echo $success; ?></div>
  <?php endif; ?>

  <?php if(!empty($errors)): ?>
    <div class="alert alert-error"><?php echo $errors[0]; ?></div>
  <?php endif; ?>

  <form method="POST" action="login_procesar.php">

    <div class="form-group">
      <label>Email</label>
      <input type="email" name="email" placeholder="ejemplo@email.com" required>
    </div>

    <div class="form-group">
      <label>Contraseña</label>
      <input type="password" name="password" placeholder="••••••••" required>
    </div>

    <button class="btn-login">Entrar</button>

  </form>

  <div class="auth-footer">
    ¿No tienes cuenta? <a href="register.php">Regístrate</a>
  </div>

</div>

</body>
</html>