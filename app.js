const fmt = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

let state = {
  currentScreen: 'dashboard',
  currentMonth: new Date(),
  modalType: null,
  editIndex: null,
  ingresos: [],
  gastosFijos: [],
  movimientos: [],
  presupuestos: [],
  objetivos: []
};

const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('month-label').textContent = `${months[state.currentMonth.getMonth()]} ${state.currentMonth.getFullYear()}`;
  loadData();
  goTo('dashboard', document.querySelector('.nav-item.active'));
});

window.guardarPerfil = function () {
  const nombre = document.getElementById('perfil-nombre')?.value.trim();
  const email = document.getElementById('perfil-email')?.value.trim();
  const pass = document.getElementById('perfil-pass')?.value || '';

  if (!nombre || !email) {
    alert('Nombre y email son obligatorios');
    return;
  }

  fetch('perfil_update.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, pass })
  })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar el perfil');
      return data;
    })
    .then((data) => {
      alert(data.message || 'Perfil actualizado correctamente');
      window.location.reload();
    })
    .catch((error) => {
      console.error('guardarPerfil:', error);
      alert(error.message || 'Error de conexión');
    });
};

window.borrarCuenta = function () {
  const confirmacion = confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción es irreversible?');
  if (!confirmacion) return;

  fetch('delete_account.php', { method: 'POST' })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al eliminar la cuenta');
      return data;
    })
    .then((data) => {
      alert(data.message || 'Cuenta eliminada correctamente');
      window.location.href = 'login.php';
    })
    .catch((error) => {
      console.error('borrarCuenta:', error);
      alert(error.message || 'Error de conexión');
    });
};

window.sendGrokMessage = async function () {
  const input = document.getElementById("grok-input");
  const msg = input.value.trim();
  if (!msg) return;

  const chat = document.getElementById("grok-messages");

  const userMsg = document.createElement("div");
  userMsg.className = "chat-message user";
  userMsg.textContent = msg;
  chat.appendChild(userMsg);

  input.value = "";
  chat.scrollTop = chat.scrollHeight;

  const res = await fetch("groq.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: msg })
  });

  const data = await res.json();
  const reply = data?.raw_response?.choices?.[0]?.message?.content;

  const grokMsg = document.createElement("div");
  grokMsg.className = "chat-message grok";
  grokMsg.textContent = reply || "ERROR GROQ: " + JSON.stringify(data.raw_response || data.raw_text);

  chat.appendChild(grokMsg);
  chat.scrollTop = chat.scrollHeight;
};

async function loadData() {
  const mes = state.currentMonth.getMonth() + 1;
  const ano = state.currentMonth.getFullYear();

  try {
    const res = await fetch(`api.php?action=load&mes=${mes}&ano=${ano}`);
    const json = await res.json();

    if (json.status !== 'success') {
      console.error('Error del backend:', json.message);
      return;
    }

    const data = json.data || {};

    state.ingresos = data.ingresos || [];
    state.gastosFijos = data.gastosFijos || [];
    state.movimientos = data.movimientos || [];
    state.presupuestos = data.presupuestos || [];
    state.objetivos = data.objetivos || [];

    state.ingresos.forEach(i => i.cantidad = parseFloat(i.cantidad));
    state.gastosFijos.forEach(g => g.cantidad = parseFloat(g.cantidad));
    state.movimientos.forEach(m => m.cantidad = parseFloat(m.cantidad));
    state.presupuestos.forEach(p => p.limite = parseFloat(p.limite));
    state.objetivos.forEach(o => {
      o.meta = parseFloat(o.meta);
      o.actual = parseFloat(o.actual);
    });

    renderAll();
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

window.goTo = function (screen, btn) {
  state.currentScreen = screen;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${screen}`).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    ingresos: 'Ingresos',
    gastos: 'Gastos fijos',
    movimientos: 'Movimientos',
    presupuesto: 'Presupuesto',
    objetivos: 'Objetivos',
    historico: 'Histórico',
    perfil: 'Mi perfil',
    grok: 'Grok IA'
  };

  if (titles[screen]) document.getElementById('page-title').textContent = titles[screen];
  renderAll();
};

window.goToNav = function (screen) {
  const btns = document.querySelectorAll('.nav-item');
  const screens = ['dashboard','ingresos','gastos','movimientos','presupuesto','objetivos','historico','grok'];
  const idx = screens.indexOf(screen);
  goTo(screen, btns[idx + 1]);
};

window.changeMonth = function (d) {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + d, 1);
  document.getElementById('month-label').textContent = `${months[state.currentMonth.getMonth()]} ${state.currentMonth.getFullYear()}`;
  loadData();
};

function totalIngresos() {
  return state.ingresos.reduce((s, i) => s + i.cantidad, 0);
}

function totalGastosFijos() {
  return state.gastosFijos.reduce((s, i) => s + i.cantidad, 0);
}

function disponible() {
  const movIngresos = state.movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.cantidad, 0);
  const movGastos = state.movimientos.filter(m => m.tipo === 'gasto').reduce((s, m) => s + m.cantidad, 0);
  return (totalIngresos() + movIngresos) - (totalGastosFijos() + movGastos);
}

function ahorroEstimado() {
  return Math.max(0, disponible() * 0.2);
}

function gastoMovMes(cat) {
  return state.movimientos.filter(m => m.tipo === 'gasto' && m.categoria === cat).reduce((s, m) => s + m.cantidad, 0);
}

function movimientosIngresosMes() {
  return state.movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.cantidad, 0);
}

function movimientosGastosMes() {
  return state.movimientos.filter(m => m.tipo === 'gasto').reduce((s, m) => s + m.cantidad, 0);
}

function movimientosNetosMes() {
  return movimientosIngresosMes() - movimientosGastosMes();
}

function escapeCSV(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.downloadHistoricoCSV = function () {
  const mesNombre = months[state.currentMonth.getMonth()];
  const ano = state.currentMonth.getFullYear();

  const ingresos = totalIngresos();
  const gastos = totalGastosFijos();
  const movIngresos = movimientosIngresosMes();
  const movGastos = movimientosGastosMes();
  const netoMov = movimientosNetosMes();
  const disp = disponible();
  const ahorro = ahorroEstimado();

  let csv = '';
  csv += 'TIPO,NOMBRE/CATEGORIA,DETALLE,CANTIDAD,FECHA\n';

  state.ingresos.forEach(i => {
    csv += [
      escapeCSV('Ingreso fijo'),
      escapeCSV(i.nombre),
      escapeCSV(i.tipo),
      escapeCSV(i.cantidad),
      escapeCSV(`${mesNombre} ${ano}`)
    ].join(',') + '\n';
  });

  state.gastosFijos.forEach(g => {
    csv += [
      escapeCSV('Gasto fijo'),
      escapeCSV(g.nombre),
      escapeCSV(g.categoria),
      escapeCSV(g.cantidad),
      escapeCSV(`${mesNombre} ${ano}`)
    ].join(',') + '\n';
  });

  state.movimientos.forEach(m => {
    csv += [
      escapeCSV(`Movimiento ${m.tipo}`),
      escapeCSV(m.descripcion),
      escapeCSV(m.categoria),
      escapeCSV(m.cantidad),
      escapeCSV(m.fecha)
    ].join(',') + '\n';
  });

  csv += '\n';
  csv += 'RESUMEN,VALOR\n';
  csv += `${escapeCSV('Ingresos fijos')},${escapeCSV(ingresos)}\n`;
  csv += `${escapeCSV('Gastos fijos')},${escapeCSV(gastos)}\n`;
  csv += `${escapeCSV('Ingresos en movimientos')},${escapeCSV(movIngresos)}\n`;
  csv += `${escapeCSV('Gastos en movimientos')},${escapeCSV(movGastos)}\n`;
  csv += `${escapeCSV('Movimientos netos')},${escapeCSV(netoMov)}\n`;
  csv += `${escapeCSV('Disponible')},${escapeCSV(disp)}\n`;
  csv += `${escapeCSV('Ahorro estimado')},${escapeCSV(ahorro)}\n`;

  downloadCSV(csv, `historico-${ano}-${String(state.currentMonth.getMonth() + 1).padStart(2, '0')}.csv`);
};

function renderAll() {
  renderDashboard();
  renderIngresos();
  renderGastosFijos();
  renderMovimientos();
  renderPresupuesto();
  renderObjetivos();
  renderHistorico();
}

function renderDashboard() {
  document.getElementById('m-ingresos').textContent = fmt(totalIngresos());
  document.getElementById('m-gastos').textContent = fmt(totalGastosFijos());

  const disp = disponible();
  const el = document.getElementById('m-disponible');
  el.textContent = fmt(disp);
  el.className = 'metric-value ' + (disp >= 0 ? 'green' : 'red');

  document.getElementById('m-ahorro').textContent = fmt(ahorroEstimado());

  const cats = {};
  state.gastosFijos.forEach(g => {
    cats[g.categoria] = (cats[g.categoria] || 0) + g.cantidad;
  });

  const colors = {
    Vivienda: '#D4537E',
    Comida: '#D85A30',
    Ocio: '#BA7517',
    Transporte: '#378ADD',
    Salud: '#1D9E75',
    Otros: '#7F77DD'
  };

  const total = totalGastosFijos() || 1;

  document.getElementById('dist-gastos').innerHTML =
    Object.entries(cats).map(([cat, val]) => `
      <div class="dist-row">
        <div class="dist-info">
          <span class="dist-dot" style="background:${colors[cat] || '#666'}"></span>
          <span class="dist-name">${cat}</span>
          <span class="dist-pct">${Math.round((val / total) * 100)}%</span>
        </div>
        <span class="dist-val">${fmt(val)}</span>
      </div>
    `).join('') || '<div style="color:var(--color-text-secondary); text-align:center; padding:20px 0;">No hay gastos fijos para analizar.</div>';

  const catsIcon = {
    Vivienda: '🏠',
    Comida: '🍔',
    Ocio: '🎮',
    Transporte: '🚗',
    Salud: '💊',
    Otros: '📦'
  };

  const ultimosMovs = [...state.movimientos].slice(-5).reverse();

  document.getElementById('dash-movimientos').innerHTML =
    ultimosMovs.length
      ? ultimosMovs.map(m => {
          const isGasto = m.tipo === 'gasto';
          return `
            <div class="list-item">
              <div class="list-item-icon">${catsIcon[m.categoria] || '📦'}</div>
              <div class="list-item-info">
                <div class="list-item-title">${m.descripcion}</div>
                <div class="list-item-sub">${m.categoria} • ${m.fecha}</div>
              </div>
              <div class="list-item-right">
                <div class="list-item-amount ${isGasto ? 'red' : 'green'}">
                  ${isGasto ? '-' : '+'}${fmt(m.cantidad)}
                </div>
              </div>
            </div>
          `;
        }).join('')
      : '<div style="text-align:center; padding:20px; color:var(--text-light);">No hay movimientos recientes.</div>';

  document.getElementById('dash-presupuestos').innerHTML =
    state.presupuestos.length
      ? state.presupuestos.slice(0, 4).map(p => {
          const gastado = gastoMovMes(p.categoria);
          const pct = p.limite > 0 ? Math.min(100, Math.round((gastado / p.limite) * 100)) : 0;
          const over = gastado > p.limite;
          const barColor = over ? '#E24B4A' : (pct > 75 ? '#BA7517' : (colors[p.categoria] || '#378ADD'));

          return `
            <div class="card p-3 mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="fw-bold">${p.nombre}</div>
                <div class="text-muted" style="font-size:0.9em">${p.categoria}</div>
              </div>
              <div class="d-flex justify-content-between align-items-end mb-2">
                <span style="font-size:1.05em; font-weight:bold">${fmt(gastado)}</span>
                <span class="text-muted">de ${fmt(p.limite)}</span>
              </div>
              <div class="progress" style="height:10px;">
                <div class="progress-bar" style="width:${pct}%; background-color:${barColor}"></div>
              </div>
              <div class="text-muted" style="font-size:0.8em; margin-top:6px;">
                ${over ? 'Presupuesto excedido' : `${pct}% usado`}
              </div>
            </div>
          `;
        }).join('')
      : '<div style="text-align:center; padding:20px; color:var(--text-light);">Sin presupuestos activos.</div>';

  document.getElementById('dash-objetivos').innerHTML =
    state.objetivos.length
      ? state.objetivos.slice(0, 4).map(o => {
          const pct = Math.min(100, Math.round((o.actual / o.meta) * 100));
          return `
            <div class="card p-3" style="border-left:4px solid ${o.color || '#378ADD'}">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="fw-bold">${o.nombre}</div>
                <div style="color:${o.color || '#378ADD'}; font-weight:bold">${pct}%</div>
              </div>
              <div class="text-muted" style="font-size:0.9em; margin-bottom:8px;">
                ${fmt(o.actual)} / ${fmt(o.meta)}
              </div>
              <div class="progress" style="height:10px;">
                <div class="progress-bar" style="width:${pct}%; background-color:${o.color || '#378ADD'}"></div>
              </div>
            </div>
          `;
        }).join('')
      : '<div style="text-align:center; padding:20px; color:var(--text-light);">Sin objetivos definidos.</div>';
}

function renderIngresos() {
  document.getElementById('lista-ingresos').innerHTML = state.ingresos.length ? state.ingresos.map(i => `
    <div class="list-item">
      <div class="list-item-info">
        <div class="list-item-title">${i.nombre}</div>
        <div class="list-item-sub" style="text-transform: capitalize;">${i.tipo}</div>
      </div>
      <div class="list-item-right">
        <div class="list-item-amount green">+${fmt(i.cantidad)}</div>
        <button class="btn btn-danger btn-sm" onclick="deleteRecord('ingreso_fijo', ${i.id})">×</button>
      </div>
    </div>
  `).join('') : '<div style="text-align:center; padding:20px; color:var(--text-light);">Sin ingresos fijos.</div>';

  const total = totalIngresos();
  document.getElementById('total-ingresos-label').textContent = fmt(total);

  document.getElementById('resumen-ingresos').innerHTML = `
    <div class="metric">
      <div class="metric-label">Total ingresos del mes</div>
      <div class="metric-value blue">${fmt(total)}</div>
    </div>
  `;
}

function renderGastosFijos() {
  const cats = { Vivienda: '🏠', Comida: '🍔', Ocio: '🎮', Transporte: '🚗', Salud: '💊', Otros: '📦' };

  document.getElementById('lista-gastos').innerHTML = state.gastosFijos.length ? state.gastosFijos.map(g => `
    <div class="list-item">
      <div class="list-item-icon">${cats[g.categoria] || '📦'}</div>
      <div class="list-item-info">
        <div class="list-item-title">${g.nombre}</div>
        <div class="list-item-sub">${g.categoria} • ${g.tipo === 'fijo' ? 'Fijo' : (g.tipo === 'plazo' ? 'A plazos' : 'Variable')}</div>
      </div>
      <div class="list-item-right">
        <div class="list-item-amount red">-${fmt(g.cantidad)}</div>
        <button class="btn btn-danger btn-sm" onclick="deleteRecord('gasto_fijo', ${g.id})">×</button>
      </div>
    </div>
  `).join('') : '<div style="text-align:center; padding:20px; color:var(--text-light);">Sin gastos fijos.</div>';

  document.getElementById('total-gastos-label').textContent = fmt(totalGastosFijos());

  const resumen = {};
  state.gastosFijos.forEach(g => {
    resumen[g.categoria] = (resumen[g.categoria] || 0) + g.cantidad;
  });

  document.getElementById('gastos-por-cat').innerHTML = Object.keys(resumen).length
    ? Object.entries(resumen).map(([cat, val]) => `
        <div class="list-item">
          <div class="list-item-info">
            <div class="list-item-title">${cat}</div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount red">-${fmt(val)}</div>
          </div>
        </div>
      `).join('')
    : '<div style="text-align:center; padding:20px; color:var(--text-light);">Sin categorías para mostrar.</div>';
}

function renderMovimientos() {
  const cats = { Vivienda: '🏠', Comida: '🍔', Ocio: '🎮', Transporte: '🚗', Salud: '💊', Otros: '📦' };

  const filtroTipo = document.getElementById('filtro-tipo')?.value || '';
  const filtroCat = document.getElementById('filtro-cat')?.value || '';

  let movimientosFiltrados = [...state.movimientos];

  if (filtroTipo) movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === filtroTipo);
  if (filtroCat) movimientosFiltrados = movimientosFiltrados.filter(m => m.categoria === filtroCat);

  let html = '';

  if (movimientosFiltrados.length === 0) {
    html = '<div style="text-align:center; padding:20px; color:var(--text-light);">No hay movimientos en este mes.</div>';
  } else {
    let currentDate = '';

    movimientosFiltrados.forEach(m => {
      if (m.fecha !== currentDate) {
        const dateObj = new Date(m.fecha);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());

        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
        const dayNum = dateObj.getDate();
        const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
        const formattedDate = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNum} ${monthName}`;

        html += `<div class="mov-date-header">${formattedDate}</div>`;
        currentDate = m.fecha;
      }

      const isGasto = m.tipo === 'gasto';
      html += `
        <div class="list-item">
          <div class="list-item-icon">${cats[m.categoria] || '📦'}</div>
          <div class="list-item-info">
            <div class="list-item-title">${m.descripcion}</div>
            <div class="list-item-sub">${m.categoria}</div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount ${isGasto ? 'red' : 'green'}">
              ${isGasto ? '-' : '+'}${fmt(m.cantidad)}
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteRecord('movimiento', ${m.id})">×</button>
          </div>
        </div>
      `;
    });
  }

  document.getElementById('lista-movimientos').innerHTML = html;
}

function renderPresupuesto() {
  const totalLimit = state.presupuestos.reduce((s, p) => s + p.limite, 0);
  const totalGast = state.presupuestos.reduce((s, p) => s + gastoMovMes(p.categoria), 0);

  document.getElementById('pres-total').textContent = fmt(totalLimit);
  document.getElementById('pres-gastado').textContent = fmt(totalGast);
  document.getElementById('pres-disponible').textContent = fmt(totalLimit - totalGast);

  const colors = { Ocio: '#BA7517', Comida: '#D85A30', Transporte: '#378ADD', Vivienda: '#D4537E', Salud: '#1D9E75', Otros: '#7F77DD' };

  document.getElementById('lista-presupuestos').innerHTML = state.presupuestos.length ? state.presupuestos.map(p => {
    const gastado = gastoMovMes(p.categoria);
    const pct = p.limite > 0 ? Math.min(100, Math.round((gastado / p.limite) * 100)) : 0;
    const over = gastado > p.limite;
    const barColor = over ? '#E24B4A' : (pct > 75 ? '#BA7517' : (colors[p.categoria] || '#378ADD'));

    return `
      <div class="card p-3 mb-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="fw-bold">${p.nombre}</div>
          <div>
            <span class="text-muted" style="font-size:0.9em">${p.categoria}</span>
            <button class="btn btn-danger btn-sm" style="margin-left:8px" onclick="deleteRecord('presupuesto', ${p.id})">×</button>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-end mb-2">
          <span style="font-size:1.2em; font-weight:bold">${fmt(gastado)}</span>
          <span class="text-muted">de ${fmt(p.limite)}</span>
        </div>
        <div class="progress" style="height:10px;">
          <div class="progress-bar" style="width:${pct}%; background-color:${barColor}"></div>
        </div>
      </div>
    `;
  }).join('') : '<div style="text-align:center; padding:20px; color:var(--text-light);">Sin presupuestos activos.</div>';
}

function renderObjetivos() {
  document.getElementById('lista-objetivos').innerHTML = state.objetivos.length ? state.objetivos.map(o => {
    const pct = Math.min(100, Math.round((o.actual / o.meta) * 100));
    const restante = o.meta - o.actual;

    return `
      <div class="card p-3 mb-3" style="border-left: 4px solid ${o.color || '#378ADD'}">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <div class="fw-bold">${o.nombre}</div>
            <div class="text-muted" style="font-size:0.9em">${fmt(o.actual)} / ${fmt(o.meta)}</div>
          </div>
          <div class="text-end">
            <div style="color:${o.color || '#378ADD'}; font-weight:bold">${pct}%</div>
            <button class="btn btn-danger btn-sm" onclick="deleteRecord('objetivo', ${o.id})">×</button>
          </div>
        </div>
        <div class="progress mb-3" style="height:10px;">
          <div class="progress-bar" style="width:${pct}%; background-color:${o.color || '#378ADD'}"></div>
        </div>
        <div class="d-flex gap-2">
          <input type="number" id="ap-${o.id}" class="form-control form-control-sm" placeholder="Aportar...">
          <button class="btn btn-primary btn-sm" onclick="addAportacion(${o.id})">Aportar</button>
        </div>
        ${restante > 0
          ? `<div class="text-center mt-2 text-muted" style="font-size:0.8em">Faltan ${fmt(restante)}</div>`
          : `<div class="text-center mt-2 text-success fw-bold" style="font-size:0.8em">¡Completado!</div>`}
      </div>
    `;
  }).join('') : '<div style="text-align:center; padding:20px; color:var(--text-light);">Sin objetivos definidos.</div>';
}

function renderHistorico() {
  const ingresos = totalIngresos();
  const gastos = totalGastosFijos();
  const netoMov = movimientosNetosMes();
  const disp = disponible();
  const ahorro = ahorroEstimado();
  const movIngresos = movimientosIngresosMes();
  const movGastos = movimientosGastosMes();

  document.getElementById('h-ingresos').textContent = fmt(ingresos);
  document.getElementById('h-gastos').textContent = fmt(gastos);
  document.getElementById('h-mov-netos').textContent = fmt(netoMov);

  const elDisp = document.getElementById('h-disponible');
  elDisp.textContent = fmt(disp);
  elDisp.className = 'metric-value ' + (disp >= 0 ? 'green' : 'red');

  const totalMovs = state.movimientos.length;
  const mesTexto = `${months[state.currentMonth.getMonth()]} ${state.currentMonth.getFullYear()}`;

  document.getElementById('historico-tabla').innerHTML = `
    <div class="card" style="padding:0; box-shadow:none; border:0.5px solid var(--color-border-secondary);">
      <div style="padding:14px 16px; border-bottom:0.5px solid var(--color-border-secondary); font-weight:600;">
        Resumen de ${mesTexto}
      </div>

      <div style="overflow:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:var(--color-background-secondary); text-align:left;">
              <th style="padding:10px 12px;">Concepto</th>
              <th style="padding:10px 12px;">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary);">Ingresos fijos</td>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary); color:#185FA5; font-weight:600;">${fmt(ingresos)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary);">Gastos fijos</td>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary); color:#A32D2D; font-weight:600;">${fmt(gastos)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary);">Ingresos en movimientos</td>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary); color:#3B6D11; font-weight:600;">${fmt(movIngresos)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary);">Gastos en movimientos</td>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary); color:#A32D2D; font-weight:600;">${fmt(movGastos)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary);">Movimientos netos</td>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary); font-weight:600;">${fmt(netoMov)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary);">Disponible del mes</td>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary); font-weight:700; color:${disp >= 0 ? '#3B6D11' : '#E24B4A'};">${fmt(disp)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary);">Ahorro estimado</td>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary); color:#BA7517; font-weight:600;">${fmt(ahorro)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary);">Número de movimientos</td>
              <td style="padding:10px 12px; border-top:0.5px solid var(--color-border-secondary);">${totalMovs}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <div class="card-header">
        <span class="card-title">Movimientos del mes</span>
      </div>
      <div>
        ${
          state.movimientos.length
            ? [...state.movimientos].map(m => `
              <div class="list-item">
                <div class="list-item-info">
                  <div class="list-item-title">${m.descripcion}</div>
                  <div class="list-item-sub">${m.categoria} • ${m.fecha}</div>
                </div>
                <div class="list-item-right">
                  <div class="list-item-amount ${m.tipo === 'gasto' ? 'red' : 'green'}">
                    ${m.tipo === 'gasto' ? '-' : '+'}${fmt(m.cantidad)}
                  </div>
                </div>
              </div>
            `).join('')
            : '<div style="text-align:center; padding:20px; color:var(--text-light);">No hay movimientos este mes.</div>'
        }
      </div>
    </div>
  `;
}

window.addAportacion = async function (idObjetivo) {
  const input = document.getElementById(`ap-${idObjetivo}`);
  const val = parseFloat(input.value);

  if (!isNaN(val) && val > 0) {
    const obj = state.objetivos.find(o => o.id === idObjetivo);
    const newActual = Math.min(obj.meta, obj.actual + val);

    await fetch('api.php?action=aportar_objetivo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idobjetivo: obj.id,
        nombre_objetivo: obj.nombre,
        cantidad: val,
        nuevo_actual: newActual,
        fecha: new Date().toISOString().split('T')[0]
      })
    });

    input.value = "";
    loadData();
  }
};

window.deleteRecord = async function (tabla, id) {
  if (confirm('¿Eliminar este registro?')) {
    await fetch('api.php?action=delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tabla, id })
    });
    loadData();
  }
};

const modalForms = {
  ingreso: `
    <div class="mb-3"><label class="form-label">Nombre</label><input id="f-nombre" class="form-control" placeholder="Ej: Salario..."></div>
    <div class="row">
      <div class="col"><label class="form-label">Cantidad (€)</label><input id="f-cantidad" type="number" class="form-control" placeholder="0.00"></div>
      <div class="col"><label class="form-label">Tipo</label><select id="f-tipo" class="form-select"><option value="fijo">Fijo</option><option value="variable">Variable</option></select></div>
    </div>
  `,
  gasto: `
    <div class="mb-3"><label class="form-label">Nombre</label><input id="f-nombre" class="form-control" placeholder="Ej: Hipoteca..."></div>
    <div class="row mb-3">
      <div class="col"><label class="form-label">Cantidad</label><input id="f-cantidad" type="number" class="form-control" placeholder="0.00"></div>
      <div class="col"><label class="form-label">Categoría</label><select id="f-cat" class="form-select"><option>Vivienda</option><option>Comida</option><option>Ocio</option><option>Transporte</option><option>Salud</option><option>Otros</option></select></div>
    </div>
    <div class="mb-3"><label class="form-label">Tipo</label><select id="f-tipo" class="form-select"><option value="fijo">Fijo</option><option value="plazo">Plazos</option><option value="variable">Variable</option></select></div>
  `,
  movimiento: `
    <div class="mb-3"><label class="form-label">Descripción</label><input id="f-nombre" class="form-control" placeholder="Ej: Supermercado"></div>
    <div class="row mb-3">
      <div class="col"><label class="form-label">Cantidad (€)</label><input id="f-cantidad" type="number" class="form-control" placeholder="0.00"></div>
      <div class="col"><label class="form-label">Tipo</label><select id="f-tipo" class="form-select"><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select></div>
    </div>
    <div class="row">
      <div class="col"><label class="form-label">Categoría</label><select id="f-cat" class="form-select"><option>Vivienda</option><option>Comida</option><option>Ocio</option><option>Transporte</option><option>Salud</option><option>Otros</option></select></div>
      <div class="col"><label class="form-label">Fecha</label><input id="f-fecha" type="date" class="form-control"></div>
    </div>
  `,
  presupuesto: `
    <div class="mb-3"><label class="form-label">Nombre</label><input id="f-nombre" class="form-control" placeholder="Ej: Límite comidas"></div>
    <div class="row">
      <div class="col"><label class="form-label">Límite (€)</label><input id="f-cantidad" type="number" class="form-control" placeholder="0.00"></div>
      <div class="col"><label class="form-label">Categoría</label><select id="f-cat" class="form-select"><option>Comida</option><option>Ocio</option><option>Transporte</option><option>Vivienda</option><option>Salud</option><option>Otros</option></select></div>
    </div>
  `,
  objetivo: `
    <div class="mb-3"><label class="form-label">¿Qué quieres lograr?</label><input id="f-nombre" class="form-control" placeholder="Ej: Viaje"></div>
    <div class="mb-3"><label class="form-label">Cantidad (€)</label><input id="f-cantidad" type="number" class="form-control" placeholder="0.00"></div>
  `
};

const modalTitles = {
  ingreso: 'Añadir ingreso',
  gasto: 'Añadir gasto fijo',
  movimiento: 'Nuevo movimiento',
  presupuesto: 'Crear presupuesto',
  objetivo: 'Nuevo objetivo'
};

window.showModal = function (type) {
  state.modalType = type;
  document.getElementById('modal-title').textContent = modalTitles[type];
  document.getElementById('modal-body').innerHTML = modalForms[type];
  document.getElementById('modal-container').style.display = 'flex';
};

window.closeModal = function () {
  document.getElementById('modal-container').style.display = 'none';
};

window.saveModal = async function () {
  const nombre = document.getElementById('f-nombre')?.value.trim();
  const cantidad = parseFloat(document.getElementById('f-cantidad')?.value);

  if (!nombre || isNaN(cantidad) || cantidad <= 0) {
    alert('Por favor, rellena el nombre y una cantidad válida.');
    return;
  }

  const tipo = document.getElementById('f-tipo')?.value || '';
  const cat = document.getElementById('f-cat')?.value || 'Otros';

  const anioActual = state.currentMonth.getFullYear();
  const mesActual = String(state.currentMonth.getMonth() + 1).padStart(2, '0');
  const fechaPorDefecto = `${anioActual}-${mesActual}-01`;

  const fechaInput = document.getElementById('f-fecha')?.value;
  const fecha = fechaInput ? fechaInput : fechaPorDefecto;

  const color = ['#185FA5', '#3B6D11', '#BA7517', '#D4537E', '#1D9E75'][state.objetivos.length % 5];

  const payload = {
    nombre,
    descripcion: nombre,
    cantidad,
    meta: cantidad,
    tipo,
    categoria: cat,
    fecha,
    color,
    mes: state.currentMonth.getMonth() + 1,
    ano: state.currentMonth.getFullYear()
  };

  try {
    const res = await fetch(`api.php?action=save_${state.modalType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (json.status !== 'success') {
      alert(json.message || 'No se pudo guardar la información en la base de datos.');
      return;
    }

    closeModal();
    loadData();
  } catch (error) {
    console.error("Error al guardar:", error);
    alert('Hubo un problema de conexión con el servidor.');
  }
};