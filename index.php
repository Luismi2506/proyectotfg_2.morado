<?php
session_start();

if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit();
}

$name = $_SESSION['username'] ?? ($_SESSION['user']['usuario'] ?? '');
$email = $_SESSION['useremail'] ?? ($_SESSION['user']['correo'] ?? '');
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>App Finanzas</title>
  <link rel="stylesheet" href="estilos.css">
</head>
<body>

<div class="app" id="app">
  <div class="sidebar">
    <div class="sidebar-user">
      <div class="avatar" onclick="goTo('perfil', null)" style="cursor:pointer;">
        <?php
          $initials = $name !== '' ? strtoupper(substr($name, 0, 1)) : '?';
          echo $initials;
        ?>
      </div>
      <div class="name"><?php echo htmlspecialchars($name, ENT_QUOTES, 'UTF-8'); ?></div>
      <div class="sub">Plan mensual</div>
    </div>

    <button class="nav-item active" onclick="goTo('dashboard',this)">
      <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="1" y="1" width="6" height="6" rx="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5"/>
      </svg>
      Dashboard
    </button>

    <button class="nav-item" onclick="goTo('ingresos',this)">
      <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="8" cy="8" r="6.5"/>
        <path d="M8 5v6M5.5 7.5L8 5l2.5 2.5"/>
      </svg>
      Ingresos
    </button>

    <button class="nav-item" onclick="goTo('gastos',this)">
      <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="8" cy="8" r="6.5"/>
        <path d="M8 11V5M5.5 8.5L8 11l2.5-2.5"/>
      </svg>
      Gastos fijos
    </button>

    <button class="nav-item" onclick="goTo('movimientos',this)">
      <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M2 4h12M2 8h8M2 12h5"/>
      </svg>
      Movimientos
    </button>

    <button class="nav-item" onclick="goTo('presupuesto',this)">
      <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="1.5" y="2" width="13" height="12" rx="2"/>
        <path d="M5 6h6M5 9h4"/>
      </svg>
      Presupuesto
    </button>

    <button class="nav-item" onclick="goTo('objetivos',this)">
      <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="8" cy="8" r="6.5"/>
        <circle cx="8" cy="8" r="3"/>
        <circle cx="8" cy="8" r=".5" fill="currentColor"/>
      </svg>
      Objetivos
    </button>

    <button class="nav-item" onclick="goTo('historico',this)">
      <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 2.5h10v11H3z"/>
        <path d="M5 1.5v2M11 1.5v2M3 5.5h10"/>
        <path d="M5 8h2M5 10.5h6"/>
      </svg>
      Histórico
    </button>

    <button class="nav-item" onclick="goTo('grok',this)">
      <svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M2 2h12v12H2z"/>
        <path d="M2 6h12M6 2v12"/>
      </svg>
      Grok IA
    </button>

    <button class="nav-item" onclick="window.location.href='logout.php'" style="color: #f28b82;">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Cerrar sesión
    </button>
  </div>

  <div class="main">
    <div class="topbar">
      <h1 id="page-title">Dashboard</h1>
      <div class="month-nav">
        <button onclick="changeMonth(-1)">‹</button>
        <span id="month-label">Abril 2026</span>
        <button onclick="changeMonth(1)">›</button>
      </div>
    </div>

    <div class="content" style="position:relative">

      <div class="screen active" id="screen-dashboard">
        <div class="metrics-grid">
          <div class="metric"><div class="metric-label">Ingresos</div><div class="metric-value blue" id="m-ingresos">0 €</div><div class="metric-sub up" id="m-ingresos-sub"></div></div>
          <div class="metric"><div class="metric-label">Gastos fijos</div><div class="metric-value red" id="m-gastos">0 €</div></div>
          <div class="metric"><div class="metric-label">Disponible</div><div class="metric-value green" id="m-disponible">0 €</div></div>
          <div class="metric"><div class="metric-label">Ahorro estimado</div><div class="metric-value amber" id="m-ahorro">0 €</div></div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-header"><span class="card-title">Distribución de gastos</span></div>
            <div id="dist-gastos"></div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">Últimos movimientos</span>
              <button class="btn" onclick="goToNav('movimientos')">Ver todos</button>
            </div>
            <div id="dash-movimientos"></div>
          </div>
        </div>

        <div class="two-col">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Progreso de objetivos</span>
              <button class="btn" onclick="goToNav('objetivos')">Gestionar</button>
            </div>
            <div id="dash-objetivos" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px"></div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">Presupuestos activos</span>
              <button class="btn" onclick="goToNav('presupuesto')">Ver todos</button>
            </div>
            <div id="dash-presupuestos"></div>
          </div>
        </div>
      </div>

      <div class="screen" id="screen-ingresos">
        <div class="two-col" style="align-items:start">
          <div class="card">
            <div class="card-header"><span class="card-title">Mis ingresos</span><button class="btn btn-primary" onclick="showModal('ingreso')">+ Añadir</button></div>
            <div id="lista-ingresos"></div>
            <div style="border-top:0.5px solid var(--color-border-tertiary);margin-top:10px;padding-top:10px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px;color:var(--color-text-secondary)">Total mensual</span>
              <span style="font-size:16px;font-weight:500;color:#185FA5" id="total-ingresos-label">0 €</span>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Resumen</span></div>
            <div id="resumen-ingresos"></div>
          </div>
        </div>
      </div>

      <div class="screen" id="screen-gastos">
        <div class="two-col" style="align-items:start">
          <div class="card">
            <div class="card-header"><span class="card-title">Gastos y compromisos</span><button class="btn btn-primary" onclick="showModal('gasto')">+ Añadir</button></div>
            <div id="lista-gastos"></div>
            <div style="border-top:0.5px solid var(--color-border-tertiary);margin-top:10px;padding-top:10px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px;color:var(--color-text-secondary)">Total mensual</span>
              <span style="font-size:16px;font-weight:500;color:#A32D2D" id="total-gastos-label">0 €</span>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Por categoría</span></div>
            <div id="gastos-por-cat"></div>
          </div>
        </div>
      </div>

      <div class="screen" id="screen-movimientos">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Todos los movimientos</span>
            <button class="btn btn-primary" onclick="showModal('movimiento')">+ Nuevo</button>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <select id="filtro-tipo" onchange="renderMovimientos()" style="flex:1;padding:6px 8px;border:0.5px solid var(--color-border-secondary);border-radius:6px;font-size:12px;background:var(--color-background-primary);color:var(--color-text-primary)">
              <option value="">Todos</option><option value="ingreso">Ingresos</option><option value="gasto">Gastos</option>
            </select>
            <select id="filtro-cat" onchange="renderMovimientos()" style="flex:1;padding:6px 8px;border:0.5px solid var(--color-border-secondary);border-radius:6px;font-size:12px;background:var(--color-background-primary);color:var(--color-text-primary)">
              <option value="">Todas las categorías</option><option value="Vivienda">Vivienda</option><option value="Comida">Comida</option><option value="Ocio">Ocio</option><option value="Transporte">Transporte</option><option value="Salud">Salud</option><option value="Otros">Otros</option>
            </select>
          </div>
          <div id="lista-movimientos"></div>
        </div>
      </div>

      <div class="screen" id="screen-presupuesto">
        <div style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
          <div class="metrics-grid" style="flex:1;margin:0;margin-right:1rem">
            <div class="metric"><div class="metric-label">Presupuesto total</div><div class="metric-value blue" id="pres-total">0 €</div></div>
            <div class="metric"><div class="metric-label">Gastado</div><div class="metric-value red" id="pres-gastado">0 €</div></div>
            <div class="metric"><div class="metric-label">Disponible</div><div class="metric-value green" id="pres-disponible">0 €</div></div>
          </div>
          <button class="btn btn-primary" onclick="showModal('presupuesto')" style="white-space:nowrap">+ Crear presupuesto</button>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Presupuestos activos</span></div>
          <div id="lista-presupuestos"></div>
        </div>
      </div>

      <div class="screen" id="screen-objetivos">
        <div style="display:flex;justify-content:flex-end;margin-bottom:1rem">
          <button class="btn btn-primary" onclick="showModal('objetivo')">+ Nuevo objetivo</button>
        </div>
        <div id="lista-objetivos"></div>
      </div>

      <div class="screen" id="screen-historico">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Histórico mensual</span>
          </div>

          <div style="margin-bottom:12px; display:flex; justify-content:flex-end;">
            <button class="btn btn-primary" onclick="downloadHistoricoCSV()">
              Descargar mes actual
            </button>
          </div>

          <div id="historico-resumen" class="metrics-grid" style="margin-bottom:16px;">
            <div class="metric">
              <div class="metric-label">Ingresos</div>
              <div class="metric-value blue" id="h-ingresos">0 €</div>
            </div>
            <div class="metric">
              <div class="metric-label">Gastos fijos</div>
              <div class="metric-value red" id="h-gastos">0 €</div>
            </div>
            <div class="metric">
              <div class="metric-label">Movimientos netos</div>
              <div class="metric-value amber" id="h-mov-netos">0 €</div>
            </div>
            <div class="metric">
              <div class="metric-label">Disponible</div>
              <div class="metric-value green" id="h-disponible">0 €</div>
            </div>
          </div>

          <div id="historico-tabla"></div>
        </div>
      </div>

      <div class="screen" id="screen-perfil">
        <div class="perfil-wrapper">
          <div class="card perfil-card">
            <div class="card-header">
              <span class="card-title">Mi perfil</span>
            </div>

            <div class="perfil-body">
              <div class="form-group">
                <label>Nombre</label>
                <input type="text" id="perfil-nombre" value="<?php echo htmlspecialchars($name, ENT_QUOTES, 'UTF-8'); ?>">
              </div>

              <div class="form-group">
                <label>Email</label>
                <input type="email" id="perfil-email" value="<?php echo htmlspecialchars($email, ENT_QUOTES, 'UTF-8'); ?>">
              </div>

              <div class="form-group">
                <label>Nueva contraseña</label>
                <input type="password" id="perfil-pass" placeholder="Opcional">
              </div>

              <button class="btn btn-primary btn-full" onclick="guardarPerfil()">Guardar cambios</button>
            </div>

            <div class="perfil-danger">
              <h3>Zona peligrosa</h3>
              <p>Eliminará tu cuenta permanentemente.</p>
              <button class="btn btn-danger btn-full" onclick="borrarCuenta()">Eliminar cuenta</button>
            </div>
          </div>
        </div>
      </div>

      <div id="modal-container" style="display:none;position:absolute;inset:0;background:rgba(0,0,0,.3);align-items:center;justify-content:center;z-index:200;min-height:500px">
        <div class="modal" id="modal-box">
          <div class="modal-title" id="modal-title">Añadir</div>
          <div id="modal-body"></div>
          <div class="modal-footer">
            <button class="btn" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="saveModal()">Guardar</button>
          </div>
        </div>
      </div>

      <div class="screen" id="screen-grok">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Chat con Grok (IA)</span>
          </div>
          <div class="chat-container">
            <div class="chat-messages" id="grok-messages"></div>
            <div class="chat-input-container">
              <input type="text" class="chat-input" id="grok-input" placeholder="Escribe un mensaje...">
              <button class="chat-send-btn" onclick="sendGrokMessage()">Enviar</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</div>

<script src="app.js"></script>
</body>
</html>