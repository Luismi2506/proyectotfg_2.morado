const fmt = n => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(n);

// Datos por defecto
const defaultData = {
  currentScreen:'dashboard',
  currentMonth:new Date(2026,3,1),
  modalType:null,
  editIndex:null,
  ingresos:[
    {id:1,nombre:'Salario',cantidad:2500,tipo:'fijo'},
    {id:2,nombre:'Freelance',cantidad:400,tipo:'variable'}
  ],
  gastosFijos:[
    {id:1,nombre:'Hipoteca',cantidad:850,categoria:'Vivienda',tipo:'plazo'},
    {id:2,nombre:'Suministros',cantidad:120,categoria:'Vivienda',tipo:'fijo'},
    {id:3,nombre:'Seguro médico',cantidad:80,categoria:'Salud',tipo:'fijo'},
    {id:4,nombre:'Móvil (a plazos)',cantidad:45,categoria:'Otros',tipo:'plazo'},
    {id:5,nombre:'Netflix',cantidad:18,categoria:'Ocio',tipo:'fijo'},
    {id:6,nombre:'Gimnasio',cantidad:35,categoria:'Salud',tipo:'fijo'},
    {id:7,nombre:'Alimentación',cantidad:350,categoria:'Comida',tipo:'fijo'},
    {id:8,nombre:'Transporte',cantidad:90,categoria:'Transporte',tipo:'fijo'}
  ],
  movimientos:[
    {id:1,tipo:'ingreso',descripcion:'Salario',cantidad:2500,categoria:'Otros',fecha:'2026-04-01'},
    {id:2,tipo:'gasto',descripcion:'Supermercado',cantidad:87,categoria:'Comida',fecha:'2026-04-02'},
    {id:3,tipo:'ingreso',descripcion:'Freelance',cantidad:400,categoria:'Otros',fecha:'2026-04-03'},
    {id:4,tipo:'gasto',descripcion:'Cena restaurante',cantidad:55,categoria:'Ocio',fecha:'2026-04-04'},
    {id:5,tipo:'gasto',descripcion:'Gasolinera',cantidad:65,categoria:'Transporte',fecha:'2026-04-05'}
  ],
  presupuestos:[
    {id:1,nombre:'Ocio abril',limite:200,categoria:'Ocio'},
    {id:2,nombre:'Comida abril',limite:400,categoria:'Comida'},
    {id:3,nombre:'Transporte abril',limite:150,categoria:'Transporte'}
  ],
  objetivos:[
    {id:1,nombre:'Fondo de emergencia',meta:5000,actual:1800,color:'#185FA5'},
    {id:2,nombre:'Vacaciones verano',meta:1500,actual:650,color:'#3B6D11'},
    {id:3,nombre:'Coche nuevo',meta:12000,actual:2400,color:'#BA7517'}
  ]
};

// Cargar datos guardados o usar los de defecto
function loadData() {
  const saved = localStorage.getItem('finanzasApp');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Restaurar fecha (se guarda como string)
    if (parsed.currentMonth) {
      parsed.currentMonth = new Date(parsed.currentMonth);
    }
    return parsed;
  }
  return { ...defaultData };
}

// Guardar datos en localStorage
function saveData() {
  const toSave = {
    ...state,
    currentMonth: state.currentMonth.toISOString() // Convertir fecha a string para guardar
  };
  localStorage.setItem('finanzasApp', JSON.stringify(toSave));
}

// Estado global (cargado desde localStorage)
let state = loadData();

// Restaurar fecha si es necesario
if (typeof state.currentMonth === 'string') {
  state.currentMonth = new Date(state.currentMonth);
}

function goTo(screen,btn){
  state.currentScreen=screen;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+screen).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  const titles={dashboard:'Dashboard',ingresos:'Ingresos',gastos:'Gastos fijos',movimientos:'Movimientos',presupuesto:'Presupuesto',objetivos:'Objetivos'};
  document.getElementById('page-title').textContent=titles[screen]||screen;
  renderAll();
}
function goToNav(screen){
  const btns=document.querySelectorAll('.nav-item');
  const screens=['dashboard','ingresos','gastos','movimientos','presupuesto','objetivos'];
  const idx=screens.indexOf(screen);
  goTo(screen,btns[idx]);
}
const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function changeMonth(d){
  state.currentMonth=new Date(state.currentMonth.getFullYear(),state.currentMonth.getMonth()+d,1);
  document.getElementById('month-label').textContent=months[state.currentMonth.getMonth()]+' '+state.currentMonth.getFullYear();
  saveData();
  renderAll();
}
function totalIngresos(){return state.ingresos.reduce((s,i)=>s+i.cantidad,0)}
function totalGastosFijos(){return state.gastosFijos.reduce((s,i)=>s+i.cantidad,0)}
function disponible(){return totalIngresos()-totalGastosFijos()}
function ahorroEstimado(){return Math.max(0,disponible()*0.2)}
function gastoMovMes(cat){
  return state.movimientos.filter(m=>m.tipo==='gasto'&&(!cat||m.categoria===cat)).reduce((s,m)=>s+m.cantidad,0);
}
function renderAll(){renderDashboard();renderIngresos();renderGastosFijos();renderMovimientos();renderPresupuesto();renderObjetivos()}

function renderDashboard(){
  document.getElementById('m-ingresos').textContent=fmt(totalIngresos());
  document.getElementById('m-gastos').textContent=fmt(totalGastosFijos());
  const disp=disponible();
  const el=document.getElementById('m-disponible');
  el.textContent=fmt(disp);el.className='metric-value '+(disp>=0?'green':'red');
  document.getElementById('m-ahorro').textContent=fmt(ahorroEstimado());
  const cats={};
  state.gastosFijos.forEach(g=>{cats[g.categoria]=(cats[g.categoria]||0)+g.cantidad});
  const colors={Vivienda:'#D4537E',Comida:'#D85A30',Ocio:'#BA7517',Transporte:'#378ADD',Salud:'#1D9E75',Otros:'#7F77DD'};
  const total=totalGastosFijos()||1;
  document.getElementById('dist-gastos').innerHTML=Object.entries(cats).map(([cat,val])=>`
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="color:var(--color-text-secondary)">${cat}</span><span style="font-weight:500">${fmt(val)}</span></div>
      <div style="height:5px;background:var(--color-background-secondary);border-radius:3px;overflow:hidden"><div style="height:100%;width:${(val/total*100).toFixed(1)}%;background:${colors[cat]||'#888780'};border-radius:3px"></div></div>
    </div>`).join('');
  const recent=state.movimientos.slice(-4).reverse();
  document.getElementById('dash-movimientos').innerHTML=recent.map(m=>`
    <div class="mov-row"><div class="mov-dot ${m.tipo}"></div><div class="mov-desc">${m.descripcion}<br><span style="font-size:11px;color:var(--color-text-secondary)">${m.fecha}</span></div><div class="mov-amount ${m.tipo}">${m.tipo==='ingreso'?'+':'-'}${fmt(m.cantidad)}</div></div>`).join('');
  document.getElementById('dash-objetivos').innerHTML=state.objetivos.map(o=>{
    const pct=Math.min(100,Math.round(o.actual/o.meta*100));
    return `<div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span style="font-weight:500">${o.nombre}</span><span style="color:var(--color-text-secondary)">${pct}%</span></div><div style="height:6px;background:var(--color-background-secondary);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${o.color};border-radius:3px"></div></div><div style="font-size:11px;color:var(--color-text-secondary);margin-top:3px">${fmt(o.actual)} de ${fmt(o.meta)}</div></div>`}).join('');
}

function renderIngresos(){
  const catPill=t=>t==='fijo'?'<span class="pill pill-fijo">Fijo</span>':'<span class="pill pill-plazo">Variable</span>';
  document.getElementById('lista-ingresos').innerHTML=state.ingresos.map((i,idx)=>`
    <div class="expense-row"><div><div class="expense-name">${i.nombre} ${catPill(i.tipo)}</div></div><div style="display:flex;align-items:center;gap:8px"><span style="font-size:13px;font-weight:500;color:#185FA5">${fmt(i.cantidad)}</span><button class="btn btn-danger btn-sm" onclick="deleteItem('ingresos',${idx})">✕</button></div></div>`).join('');
  document.getElementById('total-ingresos-label').textContent=fmt(totalIngresos());
  document.getElementById('resumen-ingresos').innerHTML=`
    <div class="expense-row"><span style="font-size:13px;color:var(--color-text-secondary)">Total ingresos: </span><span style="font-weight:500;color:#3B6D11">${fmt(totalIngresos())}</span></div>
    <div class="expense-row"><span style="font-size:13px;color:var(--color-text-secondary)">Gastos fijos: </span><span style="font-weight:500;color:#A32D2D">-${fmt(totalGastosFijos())}</span></div>
    <div class="expense-row"><span style="font-size:13px;color:var(--color-text-secondary)">Disponible: </span><span style="font-weight:500;color:${disponible()>=0?'#3B6D11':'#A32D2D'}">${fmt(disponible())}</span></div>
    <div class="expense-row"><span style="font-size:13px;color:var(--color-text-secondary)">Ahorro sugerido (20%): </span><span style="font-weight:500;color:#BA7517">${fmt(ahorroEstimado())}</span></div>`;
}

function renderGastosFijos(){
  const catClass={Vivienda:'pill-vivienda',Comida:'pill-comida',Ocio:'pill-ocio',Transporte:'pill-plazo',Salud:'pill-fijo',Otros:'pill-plazo'};
  const tipoLabel={fijo:'Fijo',plazo:'A plazos',variable:'Variable'};
  document.getElementById('lista-gastos').innerHTML=state.gastosFijos.map((g,idx)=>`
    <div class="expense-row"><div><div class="expense-name">${g.nombre} <span class="pill ${catClass[g.categoria]||'pill-fijo'}">${tipoLabel[g.tipo]||g.tipo}</span></div><div class="expense-cat">${g.categoria}</div></div><div style="display:flex;align-items:center;gap:8px"><span class="expense-amount">-${fmt(g.cantidad)}</span><button class="btn btn-danger btn-sm" onclick="deleteItem('gastosFijos',${idx})">✕</button></div></div>`).join('');
  document.getElementById('total-gastos-label').textContent=fmt(totalGastosFijos());
  const cats={};
  state.gastosFijos.forEach(g=>{cats[g.categoria]=(cats[g.categoria]||0)+g.cantidad});
  const total=totalGastosFijos()||1;
  const colors={Vivienda:'#D4537E',Comida:'#D85A30',Ocio:'#BA7517',Transporte:'#378ADD',Salud:'#1D9E75',Otros:'#7F77DD'};
  document.getElementById('gastos-por-cat').innerHTML=Object.entries(cats).map(([cat,val])=>`
    <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>${cat}</span><span style="font-weight:500">${fmt(val)} <span style="color:var(--color-text-secondary);font-weight:400">(${(val/total*100).toFixed(0)}%)</span></span></div><div style="height:6px;background:var(--color-background-secondary);border-radius:3px;overflow:hidden"><div style="height:100%;width:${(val/total*100).toFixed(1)}%;background:${colors[cat]||'#888780'};border-radius:3px"></div></div></div>`).join('');
}

function renderMovimientos(){
  const tipoFiltro=document.getElementById('filtro-tipo').value;
  const catFiltro=document.getElementById('filtro-cat').value;
  const filtered=state.movimientos.filter(m=>(!tipoFiltro||m.tipo===tipoFiltro)&&(!catFiltro||m.categoria===catFiltro)).slice().reverse();
  document.getElementById('lista-movimientos').innerHTML=filtered.length?filtered.map((m,idx)=>`
    <div class="mov-row"><div class="mov-dot ${m.tipo}"></div><div class="mov-desc"><span style="font-weight:500">${m.descripcion}</span><br><span style="font-size:11px;color:var(--color-text-secondary)">${m.categoria} · ${m.fecha}</span></div><div style="display:flex;align-items:center;gap:8px"><div class="mov-amount ${m.tipo}">${m.tipo==='ingreso'?'+':'-'}${fmt(m.cantidad)}</div><button class="btn btn-danger btn-sm" onclick="deleteMovimiento(${state.movimientos.indexOf(m)})">✕</button></div></div>`).join(''):'<p style="font-size:13px;color:var(--color-text-secondary);padding:1rem 0">Sin movimientos para este filtro.</p>';
}

function renderPresupuesto(){
  const totalLimit=state.presupuestos.reduce((s,p)=>s+p.limite,0);
  const totalGast=state.presupuestos.reduce((s,p)=>s+gastoMovMes(p.categoria),0);
  document.getElementById('pres-total').textContent=fmt(totalLimit);
  document.getElementById('pres-gastado').textContent=fmt(totalGast);
  document.getElementById('pres-disponible').textContent=fmt(totalLimit-totalGast);
  const colors={Ocio:'#BA7517',Comida:'#D85A30',Transporte:'#378ADD',Vivienda:'#D4537E',Salud:'#1D9E75',Otros:'#7F77DD'};
  document.getElementById('lista-presupuestos').innerHTML=state.presupuestos.length?state.presupuestos.map((p,idx)=>{
    const gastado=gastoMovMes(p.categoria);
    const pct=Math.min(100,Math.round(gastado/p.limite*100));
    const over=gastado>p.limite;
    const barColor=over?'#E24B4A':(pct>75?'#BA7517':(colors[p.categoria]||'#378ADD'));
    return `<div class="budget-item"><div class="budget-left"><div class="budget-name">${p.nombre}</div><div class="budget-cat">${p.categoria}</div></div><div class="budget-bar"><div style="height:6px;background:var(--color-background-secondary);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width .3s"></div></div><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--color-text-secondary);margin-top:2px"><span>${pct}% usado</span>${over?'<span style="color:#A32D2D">Superado</span>':''}</div></div><div class="budget-nums"><div class="budget-spent" style="color:${over?'#A32D2D':'var(--color-text-primary)'}">${fmt(gastado)}</div><div class="budget-limit">/ ${fmt(p.limite)}</div></div><button class="btn btn-danger btn-sm" style="margin-left:8px" onclick="deletePres(${idx})">✕</button></div>`}).join(''):'<p style="font-size:13px;color:var(--color-text-secondary);padding:1rem 0">Sin presupuestos activos.</p>';
}

function renderObjetivos(){
  document.getElementById('lista-objetivos').innerHTML=state.objetivos.length?state.objetivos.map((o,idx)=>{
    const pct=Math.min(100,Math.round(o.actual/o.meta*100));
    const restante=o.meta-o.actual;
    return `<div class="obj-card"><div class="obj-header"><div><div class="obj-name">${o.nombre}</div><div class="obj-target">Meta: ${fmt(o.meta)}</div></div><button class="btn btn-danger btn-sm" onclick="deleteObj(${idx})">✕</button></div><div class="obj-progress-text">${fmt(o.actual)}</div><div style="height:8px;background:var(--color-background-secondary);border-radius:4px;overflow:hidden;margin-bottom:6px"><div style="height:100%;width:${pct}%;background:${o.color};border-radius:4px;transition:width .3s"></div></div><div style="display:flex;justify-content:space-between"><div class="obj-sub">${pct}% completado</div><div class="obj-sub">Faltan ${fmt(restante)}</div></div><div style="margin-top:10px;display:flex;gap:6px"><input type="number" placeholder="Añadir aportación" id="ap-${idx}" style="flex:1;padding:6px 8px;border:0.5px solid var(--color-border-secondary);border-radius:6px;font-size:12px;background:var(--color-background-primary);color:var(--color-text-primary)"><button class="btn btn-primary btn-sm" onclick="addAportacion(${idx})">Aportar</button></div></div>`}).join(''):'<p style="font-size:13px;color:var(--color-text-secondary)">Sin objetivos definidos.</p>';
}

function addAportacion(idx){
  const input=document.getElementById('ap-'+idx);
  const val=parseFloat(input.value);
  if(!isNaN(val)&&val>0){state.objetivos[idx].actual=Math.min(state.objetivos[idx].meta,state.objetivos[idx].actual+val);input.value='';saveData();renderAll()}
}
function deleteItem(list,idx){state[list].splice(idx,1);saveData();renderAll()}
function deleteMovimiento(idx){state.movimientos.splice(idx,1);saveData();renderAll()}
function deletePres(idx){state.presupuestos.splice(idx,1);saveData();renderAll()}
function deleteObj(idx){state.objetivos.splice(idx,1);saveData();renderAll()}

const modalForms={
  ingreso:`<div class="form-group"><label>Nombre</label><input id="f-nombre" placeholder="Ej: Salario, Alquiler..."></div><div class="form-row"><div class="form-group"><label>Cantidad (€)</label><input id="f-cantidad" type="number" placeholder="0.00"></div><div class="form-group"><label>Tipo</label><select id="f-tipo"><option value="fijo">Fijo</option><option value="variable">Variable</option></select></div></div>`,
  gasto:`<div class="form-group"><label>Nombre</label><input id="f-nombre" placeholder="Ej: Hipoteca, Móvil..."></div><div class="form-row"><div class="form-group"><label>Cantidad (€/mes)</label><input id="f-cantidad" type="number" placeholder="0.00"></div><div class="form-group"><label>Categoría</label><select id="f-cat"><option>Vivienda</option><option>Comida</option><option>Ocio</option><option>Transporte</option><option>Salud</option><option>Otros</option></select></div></div><div class="form-group"><label>Tipo de gasto</label><select id="f-tipo"><option value="fijo">Gasto fijo</option><option value="plazo">A plazos</option><option value="variable">Variable</option></select></div>`,
  movimiento:`<div class="form-group"><label>Descripción</label><input id="f-nombre" placeholder="Ej: Supermercado"></div><div class="form-row"><div class="form-group"><label>Cantidad (€)</label><input id="f-cantidad" type="number" placeholder="0.00"></div><div class="form-group"><label>Tipo</label><select id="f-tipo"><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select></div></div><div class="form-row"><div class="form-group"><label>Categoría</label><select id="f-cat"><option>Vivienda</option><option>Comida</option><option>Ocio</option><option>Transporte</option><option>Salud</option><option>Otros</option></select></div><div class="form-group"><label>Fecha</label><input id="f-fecha" type="date" value="${new Date().toISOString().split('T')[0]}"></div></div>`,
  presupuesto:`<div class="form-group"><label>Nombre del presupuesto</label><input id="f-nombre" placeholder="Ej: Ocio de abril"></div><div class="form-row"><div class="form-group"><label>Límite (€)</label><input id="f-cantidad" type="number" placeholder="0.00"></div><div class="form-group"><label>Categoría</label><select id="f-cat"><option>Vivienda</option><option>Comida</option><option>Ocio</option><option>Transporte</option><option>Salud</option><option>Otros</option></select></div></div>`,
  objetivo:`<div class="form-group"><label>Nombre del objetivo</label><input id="f-nombre" placeholder="Ej: Fondo de emergencia"></div><div class="form-row"><div class="form-group"><label>Meta (€)</label><input id="f-cantidad" type="number" placeholder="0.00"></div><div class="form-group"><label>Ahorrado hasta ahora (€)</label><input id="f-actual" type="number" placeholder="0.00" value="0"></div></div>`
};
const modalTitles={ingreso:'Añadir ingreso',gasto:'Añadir gasto fijo',movimiento:'Nuevo movimiento',presupuesto:'Crear presupuesto',objetivo:'Nuevo objetivo'};

function showModal(type){
  state.modalType = type;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="modal-container">
      <div class="modal">
        <div class="modal-title" id="modal-title">${modalTitles[type]}</div>
        <div id="modal-body">${modalForms[type]}</div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="saveModal()">Guardar</button>
          <button class="btn" onclick="closeModal()">Cancelar</button>
        </div>
      </div>
    </div>
  `);
}

function closeModal(){
  const modal = document.getElementById('modal-container');
  if(modal) modal.remove();
}

function saveModal(){
  const nombre = document.getElementById('f-nombre')?.value.trim();
  const cantidad = parseFloat(document.getElementById('f-cantidad')?.value);
  if(!nombre || isNaN(cantidad) || cantidad <= 0) return;
  const tipo = document.getElementById('f-tipo')?.value;
  const cat = document.getElementById('f-cat')?.value || 'Otros';
  const t = state.modalType;

  if(t==='ingreso') state.ingresos.push({id:Date.now(), nombre, cantidad, tipo});
  else if(t==='gasto') state.gastosFijos.push({id:Date.now(), nombre, cantidad, categoria:cat, tipo});
  else if(t==='movimiento'){
    const fecha = document.getElementById('f-fecha')?.value || new Date().toISOString().split('T')[0];
    state.movimientos.push({id:Date.now(), tipo, descripcion:nombre, cantidad, categoria:cat, fecha});
  }
  else if(t==='presupuesto') state.presupuestos.push({id:Date.now(), nombre, limite:cantidad, categoria:cat});
  else if(t==='objetivo'){
    const actual = parseFloat(document.getElementById('f-actual')?.value) || 0;
    const colors = ['#185FA5','#3B6D11','#BA7517','#D4537E','#1D9E75','#534AB7'];
    state.objetivos.push({id:Date.now(), nombre, meta:cantidad, actual, color:colors[state.objetivos.length % colors.length]});
  }

  closeModal();
  saveData();
  renderAll();
}

// Inicializar la UI después de cargar
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('month-label').textContent = months[state.currentMonth.getMonth()] + ' ' + state.currentMonth.getFullYear();
  renderAll();
  goTo('dashboard', document.querySelector('.nav-item.active'));
});

//PERFIL UD

