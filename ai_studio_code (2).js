/* ============== CONFIGURATION & DATA ============== */
const CATEGORIES = [
  {id:'foundation', en:'Foundation & Concrete', ta:'அஸ்திவாரம்', icon:'🧱', status:'live'},
  {id:'bricks', en:'Brick & Block', ta:'செங்கல் & பிளாக்', icon:'🧊', status:'live'},
  {id:'steel', en:'Steel', ta:'எஃகு', icon:'🔩', status:'live'},
  {id:'flooring', en:'Flooring & Finishing', ta:'தரை வேலை', icon:'🏠', status:'live'},
  {id:'earthwork', en:'Earthwork', ta:'மண் வேலை', icon:'⛏️', status:'live'},
  {id:'advanced', en:'Advanced / Business', ta:'மேம்பட்டவை', icon:'📊', status:'live'},
];

const CALCULATORS = [
  {
    id:'concrete-volume', cat:'foundation', icon:'📐',
    en:'Concrete Volume', ta:'கான்கிரீட் அளவு',
    desc:'Length × Width × Depth → total concrete volume.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:10},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:10},
      {id:'d',en:'Depth / Thickness',ta:'ஆழம்',unit:'inch',def:4},
    ],
    calc:(v)=>{
      const cft = v.l * v.w * (v.d/12);
      return [
        {label:'Volume', main:true, value:cft.toFixed(2)+' cu.ft'},
        {label:'Volume (cu.m)', value:(cft * 0.0283168).toFixed(3)+' m³'},
      ];
    }
  },
  {
    id:'brick-calc', cat:'bricks', icon:'🧱',
    en:'Brick Calculator', ta:'செங்கல் கால்குலேட்டர்',
    desc:'Wall dimensions → number of bricks & mortar.',
    fields:[
      {id:'l',en:'Wall Length',ta:'சுவர் நீளம்',unit:'ft',def:20},
      {id:'h',en:'Wall Height',ta:'சுவர் உயரம்',unit:'ft',def:10},
      {id:'t',en:'Wall Thickness',ta:'சுவர் தடிமன்',unit:'inch',def:9},
    ],
    calc:(v)=>{
      const cft = v.l*v.h*(v.t/12);
      const bricks = cft*13.5;
      return [
        {label:'Bricks Required', main:true, value:Math.ceil(bricks)+' nos'},
        {label:'Wall Volume', value:cft.toFixed(2)+' cu.ft'},
      ];
    }
  },
  {
    id:'steel-weight', cat:'steel', icon:'⚙️',
    en:'Steel Weight', ta:'எஃகு எடை',
    desc:'Bar diameter & length → weight in kg.',
    fields:[
      {id:'dia',en:'Diameter',ta:'விட்டம்',unit:'mm',def:12},
      {id:'len',en:'Total Length',ta:'நீளம்',unit:'m',def:100},
    ],
    calc:(v)=>{
      const kg = (v.dia * v.dia / 162) * v.len;
      return [
        {label:'Total Weight', main:true, value:kg.toFixed(2)+' kg'}
      ];
    }
  }
];

/* ============== STATE ============== */
let lang = 'en';
let activeCat = 'all';
let history = JSON.parse(localStorage.getItem('ccp_history') || '[]');
let geminiKey = localStorage.getItem('ccp_gemini_key') || '';

/* ============== UI RENDERING ============== */
function renderRail() {
  const rail = document.getElementById('categoryRail');
  let html = `<div class="cat-chip ${activeCat==='all'?'active':''}" onclick="setCat('all')">${lang==='en'?'All':'அனைத்தும்'}</div>`;
  CATEGORIES.forEach(c => {
    html += `<div class="cat-chip ${activeCat===c.id?'active':''}" onclick="setCat('${c.id}')">${c.icon} ${lang==='en'?c.en:c.ta}</div>`;
  });
  rail.innerHTML = html;
}

function setCat(id) { activeCat = id; renderRail(); renderGrid(); }

function renderGrid() {
  const grid = document.getElementById('calcGrid');
  const list = CALCULATORS.filter(c => activeCat==='all' || c.cat===activeCat);
  grid.innerHTML = list.map(c => `
    <div class="calc-card" onclick="openCalc('${c.id}')">
      <div class="calc-icon">${c.icon}</div>
      <h3>${lang==='en'?c.en:c.ta}</h3>
      <p>${c.desc}</p>
    </div>
  `).join('');
}

/* ============== CALCULATION ENGINE ============== */
function openCalc(id) {
  const c = CALCULATORS.find(x => x.id === id);
  const panel = document.getElementById('calcPanel');
  panel.innerHTML = `
    <button class="panel-close" onclick="closeOverlay('calcOverlay')">✕</button>
    <h3>${lang==='en'?c.en:c.ta}</h3>
    ${c.fields.map(f => `
      <div class="field">
        <label>${lang==='en'?f.en:f.ta} (${f.unit})</label>
        <input type="number" id="f_${f.id}" value="${f.def}">
      </div>
    `).join('')}
    <button class="calc-btn" onclick="runCalc('${c.id}')">Calculate</button>
    <div class="result" id="calcResult"></div>
  `;
  document.getElementById('calcOverlay').classList.add('open');
}

function runCalc(id) {
  const c = CALCULATORS.find(x => x.id === id);
  const vals = {};
  c.fields.forEach(f => vals[f.id] = parseFloat(document.getElementById('f_'+f.id).value));
  const res = c.calc(vals);
  
  const resDiv = document.getElementById('calcResult');
  resDiv.innerHTML = res.map(r => `
    <div class="r-row"><span>${r.label}</span><span class="${r.main?'r-main':''}">${r.value}</span></div>
  `).join('') + `<button class="ghost-btn" onclick="saveHistory('${id}')">💾 Save Result</button>`;
  resDiv.style.display = 'block';
  window._lastRes = { id, results: res, time: new Date() };
}

/* ============== UTILS & HANDLERS ============== */
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }

function saveHistory(id) {
  if(!window._lastRes) return;
  history.unshift(window._lastRes);
  localStorage.setItem('ccp_history', JSON.stringify(history.slice(0, 20)));
  alert("Result saved!");
}

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  document.getElementById('themeToggle').textContent = isLight ? '☀️ Light' : '🌙 Dark';
}

/* ============== EVENT LISTENERS ============== */
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('historyToggle').addEventListener('click', () => {
  document.getElementById('historyOverlay').classList.add('open');
  const list = document.getElementById('historyList');
  list.innerHTML = history.map(h => `<div class="history-item">${h.results[0].value} - ${new Date(h.time).toLocaleDateString()}</div>`).join('');
});

document.getElementById('settingsToggle').addEventListener('click', () => document.getElementById('settingsOverlay').classList.add('open'));
document.getElementById('closeSettingsBtn').addEventListener('click', () => closeOverlay('settingsOverlay'));
document.getElementById('aiFab').addEventListener('click', () => document.getElementById('aiOverlay').classList.add('open'));
document.getElementById('closeAiBtn').addEventListener('click', () => closeOverlay('aiOverlay'));

/* ============== INITIALIZATION ============== */
window.onload = () => {
  renderRail();
  renderGrid();
};