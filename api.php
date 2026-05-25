<?php
error_reporting(E_ALL);
ini_set('display_errors', 0); // Evitar imprimir HTML que rompa el JSON

session_start();
header('Content-Type: application/json');

try {
    // IMPORTANTE: Ajusta "root" y "" a los de tu servidor (XAMPP = "", MAMP = "root")
    $pdo = new PDO("mysql:host=localhost;dbname=gestor_ahorro;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Fallo de conexión: " . $e->getMessage()]);
    exit;
}

// Buscar el ID del usuario de la sesión de forma segura
$usuario_id = $_SESSION['user']['id'] ?? $_SESSION['user']['idusuario'] ?? null;

// Si no hay sesión, o el usuario fue borrado, asignamos automáticamente el primer usuario que exista en la BD
if (!$usuario_id) {
    $usuario_id = $pdo->query("SELECT idusuario FROM usuario LIMIT 1")->fetchColumn() ?: 4;
} else {
    $existe = $pdo->prepare("SELECT idusuario FROM usuario WHERE idusuario = ?");
    $existe->execute([$usuario_id]);
    if ($existe->rowCount() == 0) {
        $usuario_id = $pdo->query("SELECT idusuario FROM usuario LIMIT 1")->fetchColumn() ?: 4;
    }
}

$action = $_GET['action'] ?? '';
$data = json_decode(file_get_contents("php://input"), true);

try {
    if ($action === 'load') {
        $mes = $_GET['mes'] ?? date('n');
        $ano = $_GET['ano'] ?? date('Y');

        $out = [];
        $out['ingresos'] = $pdo->query("SELECT id, nombre, cantidad, tipo FROM ingreso_fijo WHERE idusuario=$usuario_id")->fetchAll(PDO::FETCH_ASSOC);
        $out['gastosFijos'] = $pdo->query("SELECT id, nombre, cantidad, categoria, tipo FROM gasto_fijo WHERE idusuario=$usuario_id")->fetchAll(PDO::FETCH_ASSOC);
        $out['movimientos'] = $pdo->query("SELECT idmovimiento as id, tipo, descripcion, cantidad, categoria, fecha FROM movimiento WHERE idusuario=$usuario_id AND MONTH(fecha)=$mes AND YEAR(fecha)=$ano ORDER BY fecha DESC")->fetchAll(PDO::FETCH_ASSOC);
        $out['presupuestos'] = $pdo->query("SELECT idpresupuesto as id, nombre, limite, categoria FROM presupuesto WHERE idusuario=$usuario_id AND mes=$mes AND ano=$ano")->fetchAll(PDO::FETCH_ASSOC);
        $out['objetivos'] = $pdo->query("SELECT idobjetivo as id, nombre, meta, actual, color FROM objetivo WHERE idusuario=$usuario_id")->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["status" => "success", "data" => $out]);
        exit;
    }

    if ($action === 'save_ingreso') {
        $stmt = $pdo->prepare("INSERT INTO ingreso_fijo (idusuario, nombre, cantidad, tipo) VALUES (?,?,?,?)");
        $stmt->execute([$usuario_id, $data['nombre'], $data['cantidad'], $data['tipo']]);
    }
    elseif ($action === 'save_gasto') {
        $stmt = $pdo->prepare("INSERT INTO gasto_fijo (idusuario, nombre, cantidad, categoria, tipo) VALUES (?,?,?,?,?)");
        $stmt->execute([$usuario_id, $data['nombre'], $data['cantidad'], $data['categoria'], $data['tipo']]);
    }
    elseif ($action === 'save_movimiento') {
        $stmt = $pdo->prepare("INSERT INTO movimiento (idusuario, tipo, descripcion, cantidad, categoria, fecha) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$usuario_id, $data['tipo'], $data['descripcion'], $data['cantidad'], $data['categoria'], $data['fecha']]);
    }
    elseif ($action === 'save_presupuesto') {
        $stmt = $pdo->prepare("INSERT INTO presupuesto (idusuario, nombre, limite, categoria, mes, ano) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$usuario_id, $data['nombre'], $data['cantidad'], $data['categoria'], $data['mes'], $data['ano']]);
    }
    elseif ($action === 'save_objetivo') {
        $stmt = $pdo->prepare("INSERT INTO objetivo (idusuario, nombre, meta, actual, color) VALUES (?,?,?,?,?)");
        $stmt->execute([$usuario_id, $data['nombre'], $data['meta'], 0, $data['color']]);
    }
    elseif ($action === 'aportar_objetivo') {
        $stmt = $pdo->prepare("UPDATE objetivo SET actual = ? WHERE idobjetivo = ? AND idusuario = ?");
        $stmt->execute([$data['nuevo_actual'], $data['idobjetivo'], $usuario_id]);
        
        $stmt2 = $pdo->prepare("INSERT INTO movimiento (idusuario, tipo, descripcion, cantidad, categoria, fecha) VALUES (?, 'gasto', ?, ?, 'Otros', ?)");
        $stmt2->execute([$usuario_id, "Aportación a: " . $data['nombre_objetivo'], $data['cantidad'], $data['fecha']]);
    }
    elseif ($action === 'delete') {
        $tabla = $data['tabla'];
        $id = $data['id'];
        $id_col = ($tabla === 'movimiento') ? 'idmovimiento' : (($tabla === 'presupuesto') ? 'idpresupuesto' : (($tabla === 'objetivo') ? 'idobjetivo' : 'id'));
        
        $tablas_permitidas = ['ingreso_fijo', 'gasto_fijo', 'movimiento', 'presupuesto', 'objetivo'];
        if (in_array($tabla, $tablas_permitidas)) {
            $stmt = $pdo->prepare("DELETE FROM $tabla WHERE $id_col = ? AND idusuario = ?");
            $stmt->execute([$id, $usuario_id]);
        }
    }

    echo json_encode(["status" => "success"]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error DB: " . $e->getMessage()]);
}
?>