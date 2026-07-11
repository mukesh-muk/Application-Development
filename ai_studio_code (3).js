/* ============== CONFIGURATION & DATA ============== */
const CATEGORIES = [
    {id:'foundation', en:'Foundation & Concrete', ta:'அஸ்திவாரம்', icon:'🏗️'},
    {id:'bricks', en:'Brick & Block', ta:'செங்கல் & பிளாக்', icon:'🧱'},
    {id:'steel', en:'Steel / Reinforcement', ta:'எஃகு (ஸ்டீல்)', icon:'⚙️'},
    {id:'finishing', en:'Finishing (Plaster/Floor)', ta:'பூச்சு & தரை வேலை', icon:'🏠'},
    {id:'earthwork', en:'Earthwork', ta:'மண் வேலை', icon:'⛏️'}
];

const CALCULATORS = [
    {
        id:'concrete-volume', cat:'foundation', icon:'📐',
        en:'Concrete Volume', ta:'கான்கிரீட் அளவு',
        desc:'Calculate volume and materials (Cement/Sand/Agg) for slabs or footings.',
        fields:[
            {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:10},
            {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:10},
            {id:'d',en:'Thickness',ta:'கனம்',unit:'inch',def:6},
            {id:'ratio',en:'Mix Ratio (C:S:A)',ta:'கலவை விகிதம்',unit:'M20=1:1.5:3',def:'1:1.5:3'}
        ],
        calc:(v)=>{
            const cft = v.l * v.w * (v.d/12);
            const dryVol = cft * 1.54;
            const parts = v.ratio.split(':').map(Number);
            const sum = parts.reduce((a,b)=>a+b, 0);
            const cementBag = (dryVol * (parts[0]/sum)) / 1.226;
            const sand = dryVol * (parts[1]/sum);
            const agg = dryVol * (parts[2]/sum);
            return [
                {label:'Total Volume', main:true, value:cft.toFixed(2)+' cu.ft'},
                {label:'Cement Required', value:Math.ceil(cementBag)+' Bags'},
                {label:'Sand Required', value:sand.toFixed(1)+' cu.ft'},
                {label:'Aggregate Required', value:agg.toFixed(1)+' cu.ft'}
            ];
        }
    },
    {
        id:'brick-calc', cat:'bricks', icon:'🧱',
        en:'Brick Calculator', ta:'செங்கல் கணக்கீடு',
        desc:'Wall dimensions to number of bricks and mortar required.',
        fields:[
            {id:'l',en:'Wall Length',ta:'சுவர் நீளம்',unit:'ft',def:10},
            {id:'h',en:'Wall Height',ta:'சுவர் உயரம்',unit:'ft',def:10},
            {id:'t',en:'Thickness',ta:'தடிமன்',unit:'inch',def:9}
        ],
        calc:(v)=>{
            const vol = v.l * v.h * (v.t/12);
            const bricks = vol * 13.5; // Standard rule of thumb for 9" wall
            const cement = vol * 0.25; // Bags approx
            return [
                {label:'Total Bricks', main:true, value:Math.ceil(bricks)+' nos'},
                {label:'Cement (Mortar)', value:Math.ceil(cement)+' Bags'},
                {label:'Wall Volume', value:vol.toFixed(2)+' cu.ft'}
            ];
        }
    },
    {
        id:'steel-weight', cat:'steel', icon:'⚙️',
        en:'Steel Weight', ta:'எஃகு எடை',
        desc:'Calculate total weight of reinforcement bars.',
        fields:[
            {id:'dia',en:'Diameter',ta:'விட்டம்',unit:'mm',def:12},
            {id:'len',en:'Total Length',ta:'மீட்டர்',unit:'m',def:12}
        ],
        calc:(v)=>{
            const kg = (v.dia * v.dia / 162) * v.len;
            return [
                {label:'Total Weight', main:true, value:kg.toFixed(2)+' kg'},
                {label:'Unit Weight', value:(v.dia*v.dia/162).toFixed(3)+' kg/m'}
            ];
        }
    }
];

/* ============== STATE & STORAGE ============== */
let lang = localStorage.getItem('ccp_lang') || 'en';
let activeCat = 'all';
let history = JSON.parse(localStorage.getItem('ccp_history') || '[]');
let settings = JSON.parse(localStorage.getItem('ccp_settings') || '{"rates":{}, "biz":{}}');
let geminiKey = localStorage.getItem('ccp_gemini_key') || '';
let chartObj = null;

/* ============== UI RENDERING ============== */
function renderRail() {
    const rail = document.getElementById('categoryRail');
    let html = `<div class="cat-chip ${activeCat==='all'?'active':''}" onclick="setCat('all')"><div class="dot"></div> ${lang==='en'?'All':'அனைத்தும்'}</div>`;
    CATEGORIES.forEach(c => {
        html += `<div class="cat-chip ${activeCat===c.id?'active':''}" onclick="setCat('${c.id}')">
            <div class="dot"></div> ${c.icon} ${lang==='en'?c.en:c.ta}
        </div>`;
    });
    rail.innerHTML = html;
}

function renderGrid() {
    const grid = document.getElementById('calcGrid');
    const filtered = CALCULATORS.filter(c => activeCat === 'all' || c.cat === activeCat);
    grid.innerHTML = filtered.map(c => `
        <div class="calc-card" onclick="openCalc('${c.id}')">
            <div class="calc-icon">${c.icon}</div>
            <div class="ta">${c.ta}</div>
            <h3>${lang==='en'?c.en:c.ta}</h3>
            <p>${c.desc}</p>
        </div>
    `).join('');
}

function setCat(id) { activeCat = id; renderRail(); renderGrid(); }

/* ============== CALCULATION ENGINE ============== */
function openCalc(id) {
    const c = CALCULATORS.find(x => x.id === id);
    const panel = document.getElementById('calcPanel');
    panel.innerHTML = `
        <button class="panel-close" onclick="closeOverlay('calcOverlay')">✕</button>
        <h3>${lang==='en'?c.en:c.ta}</h3>
        <p style="font-size:12px; color:var(--text-lo); margin-bottom:15px;">${c.desc}</p>
        ${c.fields.map(f => `
            <div class="field">
                <label>${lang==='en'?f.en:f.ta} (${f.unit})</label>
                <input type="${f.id==='ratio'?'text':'number'}" id="f_${f.id}" value="${f.def}">
            </div>
        `).join('')}
        <button class="calc-btn" onclick="runCalc('${c.id}')">${lang==='en'?'Calculate':'கணக்கிடு'}</button>
        <div class="result" id="calcResult"></div>
    `;
    document.getElementById('calcOverlay').classList.add('open');
}

function runCalc(id) {
    const c = CALCULATORS.find(x => x.id === id);
    const vals = {};
    c.fields.forEach(f => {
        const el = document.getElementById('f_'+f.id);
        vals[f.id] = (f.id === 'ratio') ? el.value : parseFloat(el.value);
    });

    const res = c.calc(vals);
    const resDiv = document.getElementById('calcResult');
    
    resDiv.innerHTML = res.map(r => `
        <div class="r-row">
            <span class="r-label">${r.label}</span>
            <span class="${r.main?'r-main':'r-value'}">${r.value}</span>
        </div>
    `).join('') + `
        <div class="result-actions">
            <button class="ghost-btn" onclick="saveToHistory('${id}')">💾 Save</button>
            <button class="ghost-btn" onclick="downloadPdf()">📄 PDF Report</button>
        </div>
    `;
    resDiv.classList.add('show');
    window._lastRes = { id, name: c.en, results: res, time: new Date() };
}

/* ============== HISTORY & CHARTS ============== */
function saveToHistory(id) {
    if(!window._lastRes) return;
    history.unshift({...window._lastRes});
    localStorage.setItem('ccp_history', JSON.stringify(history.slice(0, 50)));
    alert(lang === 'en' ? "Saved to history!" : "வரலாற்றில் சேமிக்கப்பட்டது!");
}

function updateHistoryUI() {
    const list = document.getElementById('historyList');
    if(history.length === 0) {
        list.innerHTML = `<div class="empty-note">No calculations yet.</div>`;
        return;
    }
    list.innerHTML = history.map((h, index) => `
        <div class="history-item">
            <div class="h-top"><span>${new Date(h.time).toLocaleString()}</span><span style="cursor:pointer" onclick="deleteHistory(${index})">✕</span></div>
            <div class="h-name">${h.name}</div>
            <div style="font-weight:700; color:var(--text-hi)">${h.results[0].value}</div>
        </div>
    `).join('');
    initChart();
}

function initChart() {
    const ctx = document.getElementById('historyChart');
    if(!ctx) return;
    document.getElementById('historyChartBox').style.display = 'block';
    
    const counts = {};
    history.forEach(h => counts[h.name] = (counts[h.name] || 0) + 1);

    if(chartObj) chartObj.destroy();
    chartObj = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: ['#ff7a2f', '#3ddc97', '#ffb454', '#182645'],
                borderWidth: 0
            }]
        },
        options: { plugins: { legend: { display: false } }, cutout: '70%' }
    });
}

/* ============== SETTINGS & PDF ============== */
function openSettings() { document.getElementById('settingsOverlay').classList.add('open'); }
function saveSettings() {
    settings.biz = {
        name: document.getElementById('bizName').value,
        phone: document.getElementById('bizPhone').value,
        addr: document.getElementById('bizAddr').value
    };
    localStorage.setItem('ccp_settings', JSON.stringify(settings));
    closeOverlay('settingsOverlay');
}

async function downloadPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = window._lastRes;
    
    doc.setFontSize(20);
    doc.text(settings.biz.name || "Civil Calculator Pro Report", 20, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()} | Phone: ${settings.biz.phone || '-'}`, 20, 28);
    doc.line(20, 32, 190, 32);

    doc.setFontSize(14);
    doc.text(`Calculation: ${data.name}`, 20, 45);

    let y = 55;
    data.results.forEach(r => {
        doc.setFontSize(11);
        doc.text(`${r.label}:`, 20, y);
        doc.text(`${r.value}`, 100, y);
        y += 8;
    });

    doc.setFontSize(9);
    doc.text("Generated by Civil Calculator Pro (Mukesh)", 20, 280);
    doc.save(`Estimate_${data.id}.pdf`);
}

/* ============== AI & ADVISOR ============== */
function openAdvisor() { document.getElementById('advisorOverlay').classList.add('open'); }
function getProjectEstimate() {
    const area = document.getElementById('advArea').value;
    const resBox = document.getElementById('advisorResultBox');
    if(!area) return alert("Please enter area");

    resBox.style.display = 'block';
    resBox.innerHTML = `Calculating for ${area} sq.ft ${document.getElementById('advQuality').value} quality...<br>
    Estimated Cement: ${Math.round(area * 0.45)} Bags<br>
    Estimated Steel: ${(area * 3.5).toFixed(0)} kg<br>
    Estimated Sand: ${(area * 1.8).toFixed(0)} cft`;
}

/* ============== THEME & LANG ============== */
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    document.getElementById('themeToggle').textContent = isLight ? '☀️ Light' : '🌙 Dark';
}

function setLang(l) {
    lang = l;
    localStorage.setItem('ccp_lang', l);
    document.getElementById('langBtnEn').classList.toggle('active', l === 'en');
    document.getElementById('langBtnTa').classList.toggle('active', l === 'ta');
    renderRail();
    renderGrid();
}

/* ============== INITIALIZATION ============== */
window.onload = () => {
    setLang(lang);
    document.getElementById('langBtnEn').onclick = () => setLang('en');
    document.getElementById('langBtnTa').onclick = () => setLang('ta');
    document.getElementById('historyToggle').onclick = () => {
        document.getElementById('historyOverlay').classList.add('open');
        updateHistoryUI();
    };
};

function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }