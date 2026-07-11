/* ============== DATA MODEL ============== */
const CATEGORIES = [
  {id:'foundation', en:'Foundation & Concrete', ta:'அஸ்திவாரம்', icon:'🧱', status:'live'},
  {id:'bricks', en:'Brick & Block', ta:'செங்கல் & பிளாக்', icon:'🧊', status:'live'},
  {id:'steel', en:'Steel', ta:'எஃகு', icon:'🔩', status:'live'},
  {id:'flooring', en:'Flooring & Finishing', ta:'தரை வேலை', icon:'🏠', status:'live'},
  {id:'earthwork', en:'Earthwork', ta:'மண் வேலை', icon:'⛏️', status:'live'},
  {id:'roofing', en:'Roofing', ta:'கூரை வேலை', icon:'🏚️', status:'live'},
  {id:'masonry', en:'Masonry', ta:'கொத்து வேலை', icon:'🪨', status:'live'},
  {id:'structural', en:'Structural', ta:'கட்டமைப்பு', icon:'🏗️', status:'live'},
  {id:'road', en:'Road & Survey', ta:'சாலை & சர்வே', icon:'🛣️', status:'live'},
  {id:'plumbing', en:'Plumbing', ta:'குழாய் வேலை', icon:'🚿', status:'live'},
  {id:'advanced', en:'Advanced / Business', ta:'மேம்பட்டவை', icon:'📊', status:'live'},
];

const CALCULATORS = [
  {
    id:'concrete-volume', cat:'foundation', icon:'📐',
    en:'Concrete Volume', ta:'கான்கிரீட் அளவு',
    desc:'Length × Width × Depth → total concrete volume in cubic feet & cubic meters.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:10},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:10},
      {id:'d',en:'Depth / Thickness',ta:'ஆழம்',unit:'inch',def:4},
    ],
    calc:(v)=>{
      const cft = v.l * v.w * (v.d/12);
      const cum = cft * 0.0283168;
      const bags = cum * 1440 * 0.15 / 50; // rough cement estimate placeholder not used
      return [
        {label:'Volume', main:true, value:cft.toFixed(2)+' cu.ft'},
        {label:'Volume (cu.m)', value:cum.toFixed(3)+' m³'},
        {label:'Volume (litres)', value:(cum*1000).toFixed(0)+' L'},
      ];
    }
  },
  {
    id:'cement-sand-agg', cat:'foundation', icon:'🪣',
    en:'Cement, Sand & Aggregate', ta:'சிமெண்ட், மணல், கல்',
    desc:'Enter volume + mix ratio → get bags of cement, sand & aggregate needed.',
    fields:[
      {id:'vol',en:'Concrete Volume',ta:'கான்கிரீட் அளவு',unit:'cu.ft',def:100},
      {id:'ratio',en:'Mix Ratio (C:S:A)',ta:'கலவை விகிதம்',type:'select',
        options:[{v:'1:1.5:3',l:'1:1.5:3 (M20)'},{v:'1:2:4',l:'1:2:4 (M15)'},{v:'1:3:6',l:'1:3:6 (M10)'},{v:'1:4:8',l:'1:4:8 (M7.5)'}],def:'1:2:4'},
    ],
    calc:(v)=>{
      const parts = v.ratio.split(':').map(Number);
      const total = parts[0]+parts[1]+parts[2];
      const dryVol = v.vol * 1.54; // dry volume factor
      const cementCft = dryVol * parts[0]/total;
      const sandCft = dryVol * parts[1]/total;
      const aggCft = dryVol * parts[2]/total;
      const cementBags = (cementCft * 0.0283168 * 1440) / 50;
      return [
        {label:'Cement', main:true, value:cementBags.toFixed(1)+' bags (50kg)'},
        {label:'Sand', value:sandCft.toFixed(2)+' cu.ft'},
        {label:'Aggregate', value:aggCft.toFixed(2)+' cu.ft'},
        {label:'Dry Volume (1.54x)', value:dryVol.toFixed(2)+' cu.ft'},
      ];
    }
  },
  {
    id:'mix-ratio', cat:'foundation', icon:'🧪',
    en:'Concrete Mix Ratio', ta:'கலவை விகித கால்குலேட்டர்',
    desc:'Pick grade of concrete → get standard cement:sand:aggregate ratio & water-cement ratio.',
    fields:[
      {id:'grade',en:'Concrete Grade',ta:'கிரேடு',type:'select',
        options:[{v:'M5',l:'M5'},{v:'M7.5',l:'M7.5'},{v:'M10',l:'M10'},{v:'M15',l:'M15'},{v:'M20',l:'M20'},{v:'M25',l:'M25'}],def:'M20'},
    ],
    calc:(v)=>{
      const table = {
        'M5':{ratio:'1:5:10',wc:'0.60',strength:'5 MPa'},
        'M7.5':{ratio:'1:4:8',wc:'0.55',strength:'7.5 MPa'},
        'M10':{ratio:'1:3:6',wc:'0.50',strength:'10 MPa'},
        'M15':{ratio:'1:2:4',wc:'0.45',strength:'15 MPa'},
        'M20':{ratio:'1:1.5:3',wc:'0.40',strength:'20 MPa'},
        'M25':{ratio:'1:1:2',wc:'0.40',strength:'25 MPa'},
      };
      const r = table[v.grade];
      return [
        {label:'Mix Ratio', main:true, value:r.ratio},
        {label:'Water-Cement Ratio', value:r.wc},
        {label:'Design Strength (28 days)', value:r.strength},
      ];
    }
  },
  {
    id:'pcc-calc', cat:'foundation', icon:'⬜',
    en:'PCC Calculator', ta:'PCC கால்குலேட்டர்',
    desc:'Plain Cement Concrete quantity for leveling course / base layer.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:20},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:15},
      {id:'t',en:'Thickness',ta:'தடிமன்',unit:'inch',def:3},
      {id:'ratio',en:'Mix Ratio',ta:'விகிதம்',type:'select',
        options:[{v:'1:4:8',l:'1:4:8 (Standard PCC)'},{v:'1:3:6',l:'1:3:6'},{v:'1:5:10',l:'1:5:10 (Lean)'}],def:'1:4:8'},
    ],
    calc:(v)=>{
      const cft = v.l * v.w * (v.t/12);
      const dryVol = cft * 1.54;
      const parts = v.ratio.split(':').map(Number);
      const total = parts[0]+parts[1]+parts[2];
      const cementBags = (dryVol * parts[0]/total * 0.0283168 * 1440) / 50;
      const sandCft = dryVol * parts[1]/total;
      const aggCft = dryVol * parts[2]/total;
      return [
        {label:'PCC Volume', main:true, value:cft.toFixed(2)+' cu.ft'},
        {label:'Cement', value:cementBags.toFixed(1)+' bags'},
        {label:'Sand', value:sandCft.toFixed(2)+' cu.ft'},
        {label:'Aggregate', value:aggCft.toFixed(2)+' cu.ft'},
      ];
    }
  },
  {
    id:'rcc-calc', cat:'foundation', icon:'🏛️',
    en:'RCC Calculator', ta:'RCC கால்குலேட்டர்',
    desc:'Reinforced Cement Concrete quantity + approx steel requirement (1-2% of volume).',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:12},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:10},
      {id:'t',en:'Thickness',ta:'தடிமன்',unit:'inch',def:5},
      {id:'steelPct',en:'Steel %',ta:'எஃகு %',type:'select',
        options:[{v:'1',l:'1% (Slab, light)'},{v:'1.5',l:'1.5% (Beam)'},{v:'2',l:'2% (Column, heavy)'}],def:'1'},
    ],
    calc:(v)=>{
      const cft = v.l * v.w * (v.t/12);
      const cum = cft * 0.0283168;
      const dryVol = cft * 1.54;
      const cementBags = (dryVol * 1/5.5 * 0.0283168 * 1440) / 50; // approx M20 1:1.5:3
      const steelKg = cum * (Number(v.steelPct)/100) * 7850;
      return [
        {label:'RCC Volume', main:true, value:cft.toFixed(2)+' cu.ft'},
        {label:'Approx Cement (M20)', value:cementBags.toFixed(1)+' bags'},
        {label:'Approx Steel Required', value:steelKg.toFixed(1)+' kg'},
        {label:'Volume (cu.m)', value:cum.toFixed(3)+' m³'},
      ];
    }
  },
  {
    id:'ready-mix', cat:'foundation', icon:'🚛',
    en:'Ready Mix Concrete', ta:'ரெடி மிக்ஸ் கான்கிரீட்',
    desc:'Volume needed → number of transit mixer truck loads (6 m³ each).',
    fields:[
      {id:'vol',en:'Concrete Volume',ta:'கான்கிரீட் அளவு',unit:'cu.ft',def:500},
      {id:'grade',en:'Grade',ta:'கிரேடு',type:'select',options:[{v:'M15',l:'M15'},{v:'M20',l:'M20'},{v:'M25',l:'M25'},{v:'M30',l:'M30'}],def:'M20'},
    ],
    calc:(v)=>{
      const cum = v.vol*0.0283168;
      const trucks = cum/6;
      return [
        {label:'RMC Required', main:true, value:cum.toFixed(2)+' m³'},
        {label:'Truck Mixer Loads (6m³ each)', value:Math.ceil(trucks)+' trucks'},
        {label:'Grade', value:v.grade},
      ];
    }
  },
  {
    id:'brick-calc', cat:'bricks', icon:'🧱',
    en:'Brick Calculator', ta:'செங்கல் கால்குலேட்டர்',
    desc:'Wall dimensions → number of bricks & mortar needed.',
    fields:[
      {id:'l',en:'Wall Length',ta:'சுவர் நீளம்',unit:'ft',def:20},
      {id:'h',en:'Wall Height',ta:'சுவர் உயரம்',unit:'ft',def:10},
      {id:'t',en:'Wall Thickness',ta:'சுவர் தடிமன்',unit:'inch',def:9},
    ],
    calc:(v)=>{
      const cft = v.l*v.h*(v.t/12);
      const bricks = cft*13.5; // standard modular brick w/ mortar
      const mortarCft = cft*0.25;
      const cementBags = (mortarCft*0.0283168*1440*(1/7))/50;
      return [
        {label:'Bricks Required', main:true, value:Math.ceil(bricks)+' nos'},
        {label:'Wall Volume', value:cft.toFixed(2)+' cu.ft'},
        {label:'Mortar Volume', value:mortarCft.toFixed(2)+' cu.ft'},
        {label:'Cement (approx, 1:6)', value:cementBags.toFixed(1)+' bags'},
      ];
    }
  },
  {
    id:'aac-block', cat:'bricks', icon:'⬛',
    en:'AAC Block Calculator', ta:'AAC பிளாக் கால்குலேட்டர்',
    desc:'Wall dimensions + block size → number of AAC blocks.',
    fields:[
      {id:'l',en:'Wall Length',ta:'சுவர் நீளம்',unit:'ft',def:20},
      {id:'h',en:'Wall Height',ta:'சுவர் உயரம்',unit:'ft',def:10},
      {id:'block',en:'Block Size (mm)',ta:'பிளாக் அளவு',type:'select',
        options:[{v:'600x200x100',l:'600×200×100mm'},{v:'600x200x150',l:'600×200×150mm'},{v:'600x200x200',l:'600×200×200mm'}],def:'600x200x100'},
    ],
    calc:(v)=>{
      const wallArea = v.l*v.h*0.0929; // sqm
      const dims = v.block.split('x').map(Number);
      const blockFaceArea = (dims[0]/1000)*(dims[1]/1000);
      const blocks = (wallArea/blockFaceArea)*1.05;
      return [
        {label:'AAC Blocks Required', main:true, value:Math.ceil(blocks)+' nos'},
        {label:'Wall Area', value:wallArea.toFixed(2)+' m²'},
        {label:'Wastage Included', value:'5%'},
      ];
    }
  },
  {
    id:'solid-block', cat:'bricks', icon:'🔲',
    en:'Solid Block Calculator', ta:'சாலிட் பிளாக் கால்குலேட்டர்',
    desc:'Wall dimensions + concrete block size → number of blocks.',
    fields:[
      {id:'l',en:'Wall Length',ta:'சுவர் நீளம்',unit:'ft',def:20},
      {id:'h',en:'Wall Height',ta:'சுவர் உயரம்',unit:'ft',def:10},
      {id:'block',en:'Block Size (mm)',ta:'பிளாக் அளவு',type:'select',
        options:[{v:'400x200x200',l:'400×200×200mm'},{v:'400x200x150',l:'400×200×150mm'},{v:'400x200x100',l:'400×200×100mm'}],def:'400x200x200'},
    ],
    calc:(v)=>{
      const wallArea = v.l*v.h*0.0929;
      const dims = v.block.split('x').map(Number);
      const blockFaceArea = (dims[0]/1000)*(dims[1]/1000);
      const blocks = (wallArea/blockFaceArea)*1.05;
      return [
        {label:'Solid Blocks Required', main:true, value:Math.ceil(blocks)+' nos'},
        {label:'Wall Area', value:wallArea.toFixed(2)+' m²'},
        {label:'Wastage Included', value:'5%'},
      ];
    }
  },
  {
    id:'mortar-calc', cat:'bricks', icon:'🥣',
    en:'Mortar Calculator', ta:'மோட்டார் கால்குலேட்டர்',
    desc:'Wall/brickwork volume + ratio → cement & sand for mortar.',
    fields:[
      {id:'vol',en:'Brickwork Volume',ta:'செங்கல் வேலை அளவு',unit:'cu.ft',def:100},
      {id:'ratio',en:'Mortar Ratio',ta:'மோட்டார் விகிதம்',type:'select',options:[{v:'1:4',l:'1:4'},{v:'1:6',l:'1:6'},{v:'1:8',l:'1:8'}],def:'1:6'},
    ],
    calc:(v)=>{
      const mortarVol = v.vol*0.3; // approx 30% of brickwork is mortar
      const parts = v.ratio.split(':').map(Number);
      const total = parts[0]+parts[1];
      const dryVol = mortarVol*1.33;
      const cementBags = (dryVol*parts[0]/total*0.0283168*1440)/50;
      const sandCft = dryVol*parts[1]/total;
      return [
        {label:'Cement', main:true, value:cementBags.toFixed(1)+' bags'},
        {label:'Sand', value:sandCft.toFixed(2)+' cu.ft'},
        {label:'Mortar Volume', value:mortarVol.toFixed(2)+' cu.ft'},
      ];
    }
  },
  {
    id:'steel-weight', cat:'steel', icon:'⚙️',
    en:'Steel Weight Calculator', ta:'எஃகு எடை கால்குலேட்டர்',
    desc:'Bar diameter & length → weight in kg (d²/162 formula).',
    fields:[
      {id:'dia',en:'Bar Diameter',ta:'விட்டம்',type:'select',
        options:[{v:6,l:'6mm'},{v:8,l:'8mm'},{v:10,l:'10mm'},{v:12,l:'12mm'},{v:16,l:'16mm'},{v:20,l:'20mm'},{v:25,l:'25mm'},{v:32,l:'32mm'}],def:12},
      {id:'len',en:'Total Length',ta:'மொத்த நீளம்',unit:'m',def:100},
    ],
    calc:(v)=>{
      const kgPerM = (v.dia*v.dia)/162;
      const totalKg = kgPerM*v.len;
      return [
        {label:'Total Weight', main:true, value:totalKg.toFixed(2)+' kg'},
        {label:'Weight per metre', value:kgPerM.toFixed(3)+' kg/m'},
        {label:'Approx bags-equivalent bundles', value:(totalKg/100).toFixed(2)+' (per 100kg)'},
      ];
    }
  },
  {
    id:'rebar-qty', cat:'steel', icon:'📏',
    en:'Rebar Quantity', ta:'கம்பி அளவு',
    desc:'Concrete volume + steel % → total reinforcement steel weight.',
    fields:[
      {id:'vol',en:'Concrete Volume',ta:'கான்கிரீட் அளவு',unit:'cu.ft',def:200},
      {id:'pct',en:'Steel Percentage',ta:'எஃகு %',type:'select',options:[{v:'0.8',l:'0.8% (Footing)'},{v:'1',l:'1% (Slab)'},{v:'1.5',l:'1.5% (Beam)'},{v:'2',l:'2% (Column)'}],def:'1'},
    ],
    calc:(v)=>{
      const cum = v.vol*0.0283168;
      const kg = cum*(Number(v.pct)/100)*7850;
      return [
        {label:'Steel Required', main:true, value:kg.toFixed(1)+' kg'},
        {label:'Concrete Volume', value:cum.toFixed(3)+' m³'},
      ];
    }
  },
  {
    id:'bbs-calc', cat:'steel', icon:'📋',
    en:'Bar Bending Schedule (BBS)', ta:'BBS கால்குலேட்டர்',
    desc:'Bar length, diameter, bends → cutting length & total weight.',
    fields:[
      {id:'num',en:'Number of Bars',ta:'கம்பிகள் எண்ணிக்கை',unit:'nos',def:20},
      {id:'dia',en:'Diameter',ta:'விட்டம்',type:'select',options:[{v:8,l:'8mm'},{v:10,l:'10mm'},{v:12,l:'12mm'},{v:16,l:'16mm'},{v:20,l:'20mm'}],def:12},
      {id:'len',en:'Length per Bar',ta:'ஒரு கம்பி நீளம்',unit:'m',def:3},
      {id:'bends',en:'Number of Bends',ta:'மடிப்புகள்',type:'select',options:[{v:0,l:'0'},{v:1,l:'1'},{v:2,l:'2'},{v:4,l:'4 (stirrup)'}],def:2},
    ],
    calc:(v)=>{
      const deduction = (Number(v.bends)*2*v.dia)/1000;
      const cuttingLen = v.len - deduction;
      const kgPerM = (v.dia*v.dia)/162;
      const totalWeight = cuttingLen*v.num*kgPerM;
      return [
        {label:'Total Steel Weight', main:true, value:totalWeight.toFixed(2)+' kg'},
        {label:'Cutting Length per Bar', value:cuttingLen.toFixed(3)+' m'},
        {label:'Total Cutting Length', value:(cuttingLen*v.num).toFixed(2)+' m'},
      ];
    }
  },
  {
    id:'cutting-length', cat:'steel', icon:'✂️',
    en:'Steel Cutting Length', ta:'வெட்டும் நீளம்',
    desc:'Member length + bends → actual cutting length (bend deduction).',
    fields:[
      {id:'len',en:'Member Length',ta:'உறுப்பு நீளம்',unit:'m',def:3},
      {id:'dia',en:'Diameter',ta:'விட்டம்',type:'select',options:[{v:8,l:'8mm'},{v:10,l:'10mm'},{v:12,l:'12mm'},{v:16,l:'16mm'},{v:20,l:'20mm'}],def:12},
      {id:'bends',en:'Number of 90° Bends',ta:'மடிப்புகள்',type:'select',options:[{v:0,l:'0'},{v:1,l:'1'},{v:2,l:'2'},{v:4,l:'4'}],def:2},
    ],
    calc:(v)=>{
      const deduction = (Number(v.bends)*2*v.dia)/1000;
      const cuttingLen = v.len - deduction;
      return [
        {label:'Cutting Length', main:true, value:cuttingLen.toFixed(3)+' m'},
        {label:'Total Deduction', value:(deduction*1000).toFixed(1)+' mm'},
      ];
    }
  },
  {
    id:'lap-length', cat:'steel', icon:'🔗',
    en:'Lap Length Calculator', ta:'லேப் லெங்த் கால்குலேட்டர்',
    desc:'Bar diameter → recommended lap length (50d rule for tension).',
    fields:[
      {id:'dia',en:'Diameter',ta:'விட்டம்',type:'select',options:[{v:8,l:'8mm'},{v:10,l:'10mm'},{v:12,l:'12mm'},{v:16,l:'16mm'},{v:20,l:'20mm'},{v:25,l:'25mm'}],def:12},
      {id:'zone',en:'Zone Type',ta:'மண்டலம்',type:'select',options:[{v:'50',l:'Tension (50d)'},{v:'24',l:'Compression (24d)'}],def:'50'},
    ],
    calc:(v)=>{
      const lapMm = Number(v.zone)*v.dia;
      return [
        {label:'Lap Length', main:true, value:lapMm+' mm'},
        {label:'Lap Length (m)', value:(lapMm/1000).toFixed(3)+' m'},
      ];
    }
  },
  {
    id:'dev-length', cat:'steel', icon:'📐',
    en:'Development Length', ta:'டெவலப்மென்ட் லெங்த்',
    desc:'Bar diameter + grade of steel/concrete → development length.',
    fields:[
      {id:'dia',en:'Diameter',ta:'விட்டம்',type:'select',options:[{v:8,l:'8mm'},{v:10,l:'10mm'},{v:12,l:'12mm'},{v:16,l:'16mm'},{v:20,l:'20mm'}],def:12},
      {id:'combo',en:'Steel / Concrete Grade',ta:'கிரேடு சேர்க்கை',type:'select',
        options:[{v:'47',l:'Fe415 + M20 (≈47d)'},{v:'40',l:'Fe415 + M25 (≈40d)'},{v:'56',l:'Fe500 + M20 (≈56d)'},{v:'50',l:'Fe500 + M25 (≈50d)'}],def:'47'},
    ],
    calc:(v)=>{
      const ldMm = Number(v.combo)*v.dia;
      return [
        {label:'Development Length', main:true, value:ldMm+' mm'},
        {label:'Development Length (m)', value:(ldMm/1000).toFixed(3)+' m'},
      ];
    }
  },
  {
    id:'tiles-calc', cat:'flooring', icon:'🀄',
    en:'Tiles Calculator', ta:'டைல்ஸ் கால்குலேட்டர்',
    desc:'Room size + tile size → number of tiles with wastage.',
    fields:[
      {id:'l',en:'Room Length',ta:'நீளம்',unit:'ft',def:12},
      {id:'w',en:'Room Width',ta:'அகலம்',unit:'ft',def:10},
      {id:'tile',en:'Tile Size',ta:'டைல் அளவு',type:'select',options:[{v:'1',l:'1×1 ft'},{v:'2',l:'2×2 ft'},{v:'4',l:'2×4 ft'}],def:'2'},
    ],
    calc:(v)=>{
      const area = v.l*v.w;
      const tileArea = Number(v.tile)===4 ? 8 : Number(v.tile)*Number(v.tile);
      const tiles = Math.ceil((area/tileArea)*1.1);
      return [
        {label:'Tiles Required', main:true, value:tiles+' nos'},
        {label:'Room Area', value:area.toFixed(2)+' sq.ft'},
        {label:'Wastage Included', value:'10%'},
      ];
    }
  },
  {
    id:'flooring-calc', cat:'flooring', icon:'🟫',
    en:'Flooring Calculator', ta:'தரை பொருள் கால்குலேட்டர்',
    desc:'Room size + flooring material → area & estimated material cost.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:12},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:10},
      {id:'rate',en:'Rate per sq.ft',ta:'சதுர அடி விலை',unit:'₹',def:80},
    ],
    calc:(v)=>{
      const area = v.l*v.w;
      const cost = area*v.rate;
      return [
        {label:'Total Cost', main:true, value:'₹'+cost.toFixed(0)},
        {label:'Area', value:area.toFixed(2)+' sq.ft'},
      ];
    }
  },
  {
    id:'paint-calc', cat:'flooring', icon:'🎨',
    en:'Paint Calculator', ta:'பெயின்ட் கால்குலேட்டர்',
    desc:'Wall area + coats → litres of paint needed.',
    fields:[
      {id:'area',en:'Wall Area',ta:'சுவர் பரப்பளவு',unit:'sq.ft',def:500},
      {id:'coats',en:'Number of Coats',ta:'கோட்டுகள்',type:'select',options:[{v:1,l:'1'},{v:2,l:'2'},{v:3,l:'3'}],def:2},
      {id:'cov',en:'Coverage per Litre',ta:'கவரேஜ்',unit:'sq.ft/L',def:120},
    ],
    calc:(v)=>{
      const litres = (v.area*Number(v.coats))/v.cov;
      return [
        {label:'Paint Required', main:true, value:litres.toFixed(2)+' L'},
        {label:'Approx Litre Cans (4L)', value:Math.ceil(litres/4)+' cans'},
      ];
    }
  },
  {
    id:'plaster-calc', cat:'flooring', icon:'🧴',
    en:'Plaster Calculator', ta:'பிளாஸ்டர் கால்குலேட்டர்',
    desc:'Wall area + thickness + ratio → cement & sand for plastering.',
    fields:[
      {id:'area',en:'Wall Area',ta:'சுவர் பரப்பளவு',unit:'sq.ft',def:500},
      {id:'thick',en:'Thickness',ta:'தடிமன்',type:'select',options:[{v:12,l:'12mm'},{v:15,l:'15mm'},{v:20,l:'20mm'}],def:12},
      {id:'ratio',en:'Ratio',ta:'விகிதம்',type:'select',options:[{v:'1:4',l:'1:4'},{v:'1:6',l:'1:6'}],def:'1:6'},
    ],
    calc:(v)=>{
      const areaSqm = v.area*0.0929;
      const volCum = areaSqm*(Number(v.thick)/1000);
      const dryVol = volCum*1.33;
      const parts = v.ratio.split(':').map(Number);
      const total = parts[0]+parts[1];
      const cementBags = (dryVol*parts[0]/total*1440)/50;
      const sandCft = dryVol*parts[1]/total*35.3147;
      return [
        {label:'Cement', main:true, value:cementBags.toFixed(1)+' bags'},
        {label:'Sand', value:sandCft.toFixed(2)+' cu.ft'},
      ];
    }
  },
  {
    id:'putty-calc', cat:'flooring', icon:'🧱',
    en:'Putty Calculator', ta:'பட்டி கால்குலேட்டர்',
    desc:'Wall area + coats → wall putty quantity in kg.',
    fields:[
      {id:'area',en:'Wall Area',ta:'சுவர் பரப்பளவு',unit:'sq.ft',def:500},
      {id:'coats',en:'Coats',ta:'கோட்டுகள்',type:'select',options:[{v:1,l:'1'},{v:2,l:'2'}],def:2},
    ],
    calc:(v)=>{
      const kg = (v.area*Number(v.coats))/16; // 16 sqft/kg per coat approx
      return [
        {label:'Putty Required', main:true, value:kg.toFixed(1)+' kg'},
        {label:'Bags (40kg)', value:(kg/40).toFixed(2)+' bags'},
      ];
    }
  },
  {
    id:'excavation-calc', cat:'earthwork', icon:'⛏️',
    en:'Excavation Calculator', ta:'மண் வெட்டு கால்குலேட்டர்',
    desc:'Pit dimensions → excavation volume + disposal (swell) volume.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:20},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:15},
      {id:'d',en:'Depth',ta:'ஆழம்',unit:'ft',def:5},
    ],
    calc:(v)=>{
      const cft = v.l*v.w*v.d;
      const cum = cft*0.0283168;
      const swell = cum*1.25;
      return [
        {label:'Excavation Volume', main:true, value:cft.toFixed(2)+' cu.ft'},
        {label:'Volume (cu.m)', value:cum.toFixed(3)+' m³'},
        {label:'Disposal Volume (swell 25%)', value:swell.toFixed(3)+' m³'},
      ];
    }
  },
  {
    id:'backfill-calc', cat:'earthwork', icon:'🪣',
    en:'Backfill Calculator', ta:'மண் மூடல் கால்குலேட்டர்',
    desc:'Excavation volume − structure volume → backfill needed.',
    fields:[
      {id:'exc',en:'Excavation Volume',ta:'வெட்டிய அளவு',unit:'cu.ft',def:1500},
      {id:'struct',en:'Structure Volume',ta:'கட்டமைப்பு அளவு',unit:'cu.ft',def:600},
    ],
    calc:(v)=>{
      const backfill = (v.exc-v.struct)*0.9; // compaction factor
      return [
        {label:'Backfill Required', main:true, value:backfill.toFixed(2)+' cu.ft'},
        {label:'Volume (cu.m)', value:(backfill*0.0283168).toFixed(3)+' m³'},
      ];
    }
  },
  {
    id:'soil-volume', cat:'earthwork', icon:'🌍',
    en:'Soil Volume Calculator', ta:'மண் அளவு கால்குலேட்டர்',
    desc:'Dimensions + soil state → bulked or compacted volume.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:20},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:10},
      {id:'d',en:'Depth',ta:'ஆழம்',unit:'ft',def:3},
      {id:'state',en:'Soil State',ta:'மண் நிலை',type:'select',options:[{v:'1.25',l:'Loose (bulking)'},{v:'0.9',l:'Compacted'},{v:'1',l:'Natural'}],def:'1'},
    ],
    calc:(v)=>{
      const cft = v.l*v.w*v.d;
      const adjusted = cft*Number(v.state);
      return [
        {label:'Adjusted Volume', main:true, value:adjusted.toFixed(2)+' cu.ft'},
        {label:'Natural Volume', value:cft.toFixed(2)+' cu.ft'},
      ];
    }
  },
  {
    id:'trench-volume', cat:'earthwork', icon:'🕳️',
    en:'Trench Volume Calculator', ta:'அகழி அளவு கால்குலேட்டர்',
    desc:'Trench length, width, depth → excavation volume.',
    fields:[
      {id:'l',en:'Trench Length',ta:'நீளம்',unit:'ft',def:50},
      {id:'w',en:'Trench Width',ta:'அகலம்',unit:'ft',def:2},
      {id:'d',en:'Trench Depth',ta:'ஆழம்',unit:'ft',def:3},
    ],
    calc:(v)=>{
      const cft = v.l*v.w*v.d;
      const cum = cft*0.0283168;
      return [
        {label:'Trench Volume', main:true, value:cft.toFixed(2)+' cu.ft'},
        {label:'Volume (cu.m)', value:cum.toFixed(3)+' m³'},
      ];
    }
  },
  {
    id:'roofing-sheet', cat:'roofing', icon:'🏚️',
    en:'Roofing Sheet Calculator', ta:'கூரை தகடு கால்குலேட்டர்',
    desc:'Roof size + sheet size → number of sheets needed.',
    fields:[
      {id:'l',en:'Roof Length',ta:'கூரை நீளம்',unit:'ft',def:30},
      {id:'w',en:'Roof Width',ta:'கூரை அகலம்',unit:'ft',def:20},
      {id:'sheetLen',en:'Sheet Length',ta:'தகடு நீளம்',unit:'ft',def:10},
      {id:'effWidth',en:'Sheet Effective Width',ta:'பயன் அகலம்',unit:'ft',def:2.5},
    ],
    calc:(v)=>{
      const totalArea = v.l*v.w;
      const sheetArea = v.sheetLen*v.effWidth;
      const sheets = Math.ceil((totalArea/sheetArea)*1.05);
      return [
        {label:'Sheets Required', main:true, value:sheets+' nos'},
        {label:'Roof Area', value:totalArea.toFixed(2)+' sq.ft'},
      ];
    }
  },
  {
    id:'roof-area', cat:'roofing', icon:'📐',
    en:'Roof Area Calculator', ta:'கூரை பரப்பளவு கால்குலேட்டர்',
    desc:'Flat or sloped roof → actual surface area accounting for slope.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:30},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:20},
      {id:'angle',en:'Slope Angle',ta:'சாய்வு கோணம்',type:'select',options:[{v:0,l:'Flat (0°)'},{v:15,l:'15°'},{v:20,l:'20°'},{v:30,l:'30°'}],def:0},
    ],
    calc:(v)=>{
      const flatArea = v.l*v.w;
      const rad = Number(v.angle)*Math.PI/180;
      const actualArea = Number(v.angle)===0 ? flatArea : flatArea/Math.cos(rad);
      return [
        {label:'Actual Roof Area', main:true, value:actualArea.toFixed(2)+' sq.ft'},
        {label:'Flat Footprint Area', value:flatArea.toFixed(2)+' sq.ft'},
      ];
    }
  },
  {
    id:'wall-area', cat:'masonry', icon:'🧱',
    en:'Wall Area Calculator', ta:'சுவர் பரப்பளவு கால்குலேட்டர்',
    desc:'Wall size minus door/window openings → net wall area.',
    fields:[
      {id:'l',en:'Wall Length',ta:'நீளம்',unit:'ft',def:20},
      {id:'h',en:'Wall Height',ta:'உயரம்',unit:'ft',def:10},
      {id:'ded',en:'Door/Window Deductions',ta:'கழிவு பரப்பு',unit:'sq.ft',def:30},
    ],
    calc:(v)=>{
      const gross = v.l*v.h;
      const net = gross - v.ded;
      return [
        {label:'Net Wall Area', main:true, value:net.toFixed(2)+' sq.ft'},
        {label:'Gross Area', value:gross.toFixed(2)+' sq.ft'},
      ];
    }
  },
  {
    id:'wall-material', cat:'masonry', icon:'🧮',
    en:'Wall Material Calculator', ta:'சுவர் பொருள் கால்குலேட்டர்',
    desc:'Wall area + thickness → volume, bricks & mortar cement bags.',
    fields:[
      {id:'area',en:'Wall Area',ta:'சுவர் பரப்பளவு',unit:'sq.ft',def:300},
      {id:'thick',en:'Wall Thickness',ta:'தடிமன்',type:'select',options:[{v:4.5,l:'4.5 inch (Half brick)'},{v:9,l:'9 inch (Full brick)'}],def:9},
    ],
    calc:(v)=>{
      const cft = v.area*(Number(v.thick)/12);
      const bricks = cft*13.5;
      const mortarCft = cft*0.25;
      const cementBags = (mortarCft*0.0283168*1440/7)/50;
      return [
        {label:'Bricks Required', main:true, value:Math.ceil(bricks)+' nos'},
        {label:'Wall Volume', value:cft.toFixed(2)+' cu.ft'},
        {label:'Cement (mortar)', value:cementBags.toFixed(1)+' bags'},
      ];
    }
  },
  {
    id:'beam-load', cat:'structural', icon:'🏗️',
    en:'Beam Load Calculator', ta:'பீம் லோட் கால்குலேட்டர்',
    desc:'Beam dimensions → self-weight (UDL) of RCC beam.',
    fields:[
      {id:'w',en:'Beam Width',ta:'அகலம்',unit:'inch',def:9},
      {id:'d',en:'Beam Depth',ta:'ஆழம்',unit:'inch',def:12},
      {id:'len',en:'Beam Length',ta:'நீளம்',unit:'ft',def:12},
    ],
    calc:(v)=>{
      const wM = v.w*0.0254, dM = v.d*0.0254, lenM = v.len*0.3048;
      const selfWeightKgM = wM*dM*2500; // kg per metre (2500kg/m3 RCC density)
      const totalKg = selfWeightKgM*lenM;
      const udlKn = (selfWeightKgM*9.81)/1000;
      return [
        {label:'Self Weight (UDL)', main:true, value:udlKn.toFixed(3)+' kN/m'},
        {label:'Total Beam Self Weight', value:totalKg.toFixed(1)+' kg'},
      ];
    }
  },
  {
    id:'slab-concrete', cat:'structural', icon:'🔲',
    en:'Slab Concrete Calculator', ta:'ஸ்லாப் கான்கிரீட் கால்குலேட்டர்',
    desc:'Slab size + thickness → concrete volume & steel (1%).',
    fields:[
      {id:'l',en:'Slab Length',ta:'நீளம்',unit:'ft',def:20},
      {id:'w',en:'Slab Width',ta:'அகலம்',unit:'ft',def:15},
      {id:'t',en:'Slab Thickness',ta:'தடிமன்',unit:'inch',def:5},
    ],
    calc:(v)=>{
      const cft = v.l*v.w*(v.t/12);
      const cum = cft*0.0283168;
      const cementBags = (cft*1.54*1/5.5*0.0283168*1440)/50;
      const steelKg = cum*0.01*7850;
      return [
        {label:'Slab Volume', main:true, value:cft.toFixed(2)+' cu.ft'},
        {label:'Cement (approx M20)', value:cementBags.toFixed(1)+' bags'},
        {label:'Steel (1%)', value:steelKg.toFixed(1)+' kg'},
      ];
    }
  },
  {
    id:'column-concrete', cat:'structural', icon:'🏛️',
    en:'Column Concrete Calculator', ta:'தூண் கான்கிரீட் கால்குலேட்டர்',
    desc:'Column size + height + count → total concrete & steel (2%).',
    fields:[
      {id:'w',en:'Column Width',ta:'அகலம்',unit:'inch',def:9},
      {id:'d',en:'Column Depth',ta:'ஆழம்',unit:'inch',def:9},
      {id:'h',en:'Column Height',ta:'உயரம்',unit:'ft',def:10},
      {id:'num',en:'Number of Columns',ta:'தூண்களின் எண்ணிக்கை',unit:'nos',def:8},
    ],
    calc:(v)=>{
      const cftPerCol = (v.w/12)*(v.d/12)*v.h;
      const totalCft = cftPerCol*v.num;
      const cum = totalCft*0.0283168;
      const steelKg = cum*0.02*7850;
      return [
        {label:'Total Concrete Volume', main:true, value:totalCft.toFixed(2)+' cu.ft'},
        {label:'Steel (2%)', value:steelKg.toFixed(1)+' kg'},
        {label:'Volume per Column', value:cftPerCol.toFixed(2)+' cu.ft'},
      ];
    }
  },
  {
    id:'staircase-calc', cat:'structural', icon:'🪜',
    en:'Staircase Calculator', ta:'படிக்கட்டு கால்குலேட்டர்',
    desc:'Floor height + riser/tread → number of steps & going length.',
    fields:[
      {id:'height',en:'Floor to Floor Height',ta:'மொத்த உயரம்',unit:'ft',def:10},
      {id:'riser',en:'Riser Height',ta:'ரைசர்',unit:'inch',def:7},
      {id:'tread',en:'Tread Width',ta:'ட்ரெட்',unit:'inch',def:10},
    ],
    calc:(v)=>{
      const heightInch = v.height*12;
      const steps = Math.ceil(heightInch/v.riser);
      const treads = steps-1;
      const goingLen = (treads*v.tread)/12;
      return [
        {label:'Number of Steps', main:true, value:steps+' steps'},
        {label:'Going Length', value:goingLen.toFixed(2)+' ft'},
        {label:'Actual Riser (adjusted)', value:(heightInch/steps).toFixed(2)+' inch'},
      ];
    }
  },
  {
    id:'footing-calc', cat:'structural', icon:'🔩',
    en:'Footing Calculator', ta:'ஃபூட்டிங் கால்குலேட்டர்',
    desc:'Footing size + count → total concrete volume for footings.',
    fields:[
      {id:'l',en:'Footing Length',ta:'நீளம்',unit:'ft',def:5},
      {id:'w',en:'Footing Width',ta:'அகலம்',unit:'ft',def:5},
      {id:'d',en:'Footing Depth',ta:'ஆழம்',unit:'inch',def:12},
      {id:'num',en:'Number of Footings',ta:'எண்ணிக்கை',unit:'nos',def:8},
    ],
    calc:(v)=>{
      const cftPerFooting = v.l*v.w*(v.d/12);
      const totalCft = cftPerFooting*v.num;
      const cementBags = (totalCft*1.54*1/5.5*0.0283168*1440)/50;
      return [
        {label:'Total Concrete Volume', main:true, value:totalCft.toFixed(2)+' cu.ft'},
        {label:'Cement (approx M20)', value:cementBags.toFixed(1)+' bags'},
        {label:'Volume per Footing', value:cftPerFooting.toFixed(2)+' cu.ft'},
      ];
    }
  },
  {
    id:'asphalt-calc', cat:'road', icon:'🛣️',
    en:'Asphalt Calculator', ta:'தார் கால்குலேட்டர்',
    desc:'Road area + thickness → asphalt volume & tonnage.',
    fields:[
      {id:'l',en:'Road Length',ta:'நீளம்',unit:'ft',def:500},
      {id:'w',en:'Road Width',ta:'அகலம்',unit:'ft',def:20},
      {id:'t',en:'Thickness',ta:'தடிமன்',unit:'inch',def:2},
    ],
    calc:(v)=>{
      const cft = v.l*v.w*(v.t/12);
      const cum = cft*0.0283168;
      const tonnes = cum*2.4; // density ~2400 kg/m3
      return [
        {label:'Asphalt Required', main:true, value:tonnes.toFixed(2)+' tonnes'},
        {label:'Volume', value:cum.toFixed(2)+' m³'},
      ];
    }
  },
  {
    id:'road-material', cat:'road', icon:'🪨',
    en:'Road Material Calculator (GSB/WBM)', ta:'சாலை பொருள் கால்குலேட்டர்',
    desc:'Layer area + thickness → base material volume & tonnage.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:500},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:20},
      {id:'t',en:'Layer Thickness',ta:'அடுக்கு தடிமன்',unit:'inch',def:6},
      {id:'layer',en:'Layer Type',ta:'அடுக்கு வகை',type:'select',options:[{v:'2.0',l:'GSB (~2000 kg/m³)'},{v:'2.15',l:'WBM (~2150 kg/m³)'},{v:'2.3',l:'WMM (~2300 kg/m³)'}],def:'2.15'},
    ],
    calc:(v)=>{
      const cft = v.l*v.w*(v.t/12);
      const cum = cft*0.0283168;
      const tonnes = cum*Number(v.layer);
      return [
        {label:'Material Required', main:true, value:tonnes.toFixed(2)+' tonnes'},
        {label:'Volume', value:cum.toFixed(2)+' m³'},
      ];
    }
  },
  {
    id:'unit-convert', cat:'road', icon:'🔁',
    en:'Unit Conversion', ta:'யூனிட் மாற்றி',
    desc:'Quick construction unit conversions (length, area, volume, weight).',
    fields:[
      {id:'val',en:'Value',ta:'மதிப்பு',unit:'',def:1},
      {id:'conv',en:'Conversion',ta:'மாற்றம்',type:'select',options:[
        {v:'ft-m',l:'Feet → Metre'},{v:'m-ft',l:'Metre → Feet'},
        {v:'sqft-sqm',l:'Sq.ft → Sq.m'},{v:'sqm-sqft',l:'Sq.m → Sq.ft'},
        {v:'cft-cum',l:'Cu.ft → Cu.m'},{v:'cum-cft',l:'Cu.m → Cu.ft'},
        {v:'kg-lb',l:'Kg → Pound'},{v:'lb-kg',l:'Pound → Kg'},
        {v:'inch-mm',l:'Inch → mm'},{v:'mm-inch',l:'mm → Inch'},
      ],def:'ft-m'},
    ],
    calc:(v)=>{
      const factors = {'ft-m':0.3048,'m-ft':3.28084,'sqft-sqm':0.0929,'sqm-sqft':10.7639,
        'cft-cum':0.0283168,'cum-cft':35.3147,'kg-lb':2.20462,'lb-kg':0.453592,'inch-mm':25.4,'mm-inch':0.0393701};
      const result = v.val*factors[v.conv];
      return [
        {label:'Converted Value', main:true, value:result.toFixed(4)},
      ];
    }
  },
  {
    id:'slope-calc', cat:'road', icon:'📉',
    en:'Slope Calculator', ta:'சாய்வு கால்குலேட்டர்',
    desc:'Horizontal distance & vertical rise → slope %, angle & ratio.',
    fields:[
      {id:'h',en:'Horizontal Distance',ta:'கிடைமட்ட தூரம்',unit:'ft',def:100},
      {id:'r',en:'Vertical Rise',ta:'செங்குத்து உயர்வு',unit:'ft',def:5},
    ],
    calc:(v)=>{
      const slopePct = (v.r/v.h)*100;
      const angle = Math.atan(v.r/v.h)*180/Math.PI;
      const ratio = (v.h/v.r).toFixed(1);
      return [
        {label:'Slope Percentage', main:true, value:slopePct.toFixed(2)+' %'},
        {label:'Angle', value:angle.toFixed(2)+' °'},
        {label:'Slope Ratio', value:'1:'+ratio},
      ];
    }
  },
  {
    id:'water-tank', cat:'plumbing', icon:'🚰',
    en:'Water Tank Volume', ta:'நீர் தொட்டி அளவு',
    desc:'Rectangular tank dimensions → capacity in litres & gallons.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:6},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:4},
      {id:'h',en:'Height',ta:'உயரம்',unit:'ft',def:5},
    ],
    calc:(v)=>{
      const cft = v.l*v.w*v.h;
      const litres = cft*28.3168;
      const gallons = litres*0.219969;
      return [
        {label:'Capacity', main:true, value:litres.toFixed(0)+' litres'},
        {label:'Capacity (gallons)', value:gallons.toFixed(0)+' gal'},
        {label:'Volume', value:cft.toFixed(2)+' cu.ft'},
      ];
    }
  },
  {
    id:'pipe-volume', cat:'plumbing', icon:'🚿',
    en:'Pipe Volume Calculator', ta:'குழாய் அளவு கால்குலேட்டர்',
    desc:'Pipe diameter & length → internal water volume.',
    fields:[
      {id:'dia',en:'Internal Diameter',ta:'உள் விட்டம்',unit:'inch',def:1},
      {id:'len',en:'Pipe Length',ta:'நீளம்',unit:'ft',def:100},
    ],
    calc:(v)=>{
      const rM = (v.dia*0.0254)/2;
      const lenM = v.len*0.3048;
      const volM3 = Math.PI*rM*rM*lenM;
      const litres = volM3*1000;
      return [
        {label:'Water Volume', main:true, value:litres.toFixed(2)+' litres'},
        {label:'Volume (m³)', value:volM3.toFixed(4)+' m³'},
      ];
    }
  },
  {
    id:'pipe-weight', cat:'plumbing', icon:'⚖️',
    en:'Pipe Weight Calculator', ta:'குழாய் எடை கால்குலேட்டர்',
    desc:'Steel pipe OD, thickness & length → total weight.',
    fields:[
      {id:'od',en:'Outer Diameter',ta:'வெளிவிட்டம்',unit:'mm',def:33.7},
      {id:'t',en:'Wall Thickness',ta:'தடிமன்',unit:'mm',def:3.2},
      {id:'len',en:'Length',ta:'நீளம்',unit:'m',def:6},
    ],
    calc:(v)=>{
      const kgPerM = 0.02466*v.t*(v.od-v.t);
      const totalKg = kgPerM*v.len;
      return [
        {label:'Total Weight', main:true, value:totalKg.toFixed(2)+' kg'},
        {label:'Weight per metre', value:kgPerM.toFixed(3)+' kg/m'},
      ];
    }
  },
  {
    id:'construction-cost', cat:'advanced', icon:'💰',
    en:'Construction Cost Estimator', ta:'கட்டுமான செலவு மதிப்பீடு',
    desc:'Built-up area + finish quality → total construction cost.',
    fields:[
      {id:'area',en:'Built-up Area',ta:'கட்டப்பட்ட பரப்பளவு',unit:'sq.ft',def:1200},
      {id:'quality',en:'Construction Quality',ta:'தரம்',type:'select',options:[{v:1500,l:'Basic (₹1500/sqft)'},{v:1900,l:'Standard (₹1900/sqft)'},{v:2500,l:'Premium (₹2500/sqft)'}],def:1900},
    ],
    calc:(v)=>{
      const cost = v.area*Number(v.quality);
      return [
        {label:'Estimated Total Cost', main:true, value:'₹'+cost.toLocaleString('en-IN')},
        {label:'Rate Used', value:'₹'+v.quality+'/sq.ft'},
      ];
    }
  },
  {
    id:'house-construction', cat:'advanced', icon:'🏡',
    en:'House Construction Calculator', ta:'வீடு கட்டுமான கால்குலேட்டர்',
    desc:'Plot area + floors → built-up area & rough total cost.',
    fields:[
      {id:'plot',en:'Plot Area',ta:'மனை பரப்பளவு',unit:'sq.ft',def:1800},
      {id:'floors',en:'Number of Floors',ta:'மாடிகள்',unit:'nos',def:2},
      {id:'rate',en:'Rate per sq.ft',ta:'விலை',unit:'₹',def:1900},
    ],
    calc:(v)=>{
      const builtUp = v.plot*0.65*v.floors;
      const cost = builtUp*v.rate;
      return [
        {label:'Total Built-up Area', main:true, value:builtUp.toFixed(0)+' sq.ft'},
        {label:'Estimated Cost', value:'₹'+cost.toLocaleString('en-IN')},
      ];
    }
  },
  {
    id:'material-estimator', cat:'advanced', icon:'📦',
    en:'Material Estimator', ta:'பொருள் மதிப்பீட்டாளர்',
    desc:'Built-up area → rough thumb-rule material quantities.',
    fields:[
      {id:'area',en:'Built-up Area',ta:'பரப்பளவு',unit:'sq.ft',def:1200},
    ],
    calc:(v)=>{
      const cementBags = v.area*0.4;
      const steelKg = v.area*4;
      const sandCft = v.area*1.2;
      const bricks = v.area*8;
      return [
        {label:'Cement', main:true, value:cementBags.toFixed(0)+' bags'},
        {label:'Steel', value:steelKg.toFixed(0)+' kg'},
        {label:'Sand', value:sandCft.toFixed(0)+' cu.ft'},
        {label:'Bricks', value:bricks.toFixed(0)+' nos'},
      ];
    }
  },
  {
    id:'labour-cost', cat:'advanced', icon:'👷',
    en:'Labour Cost Calculator', ta:'கூலி செலவு கால்குலேட்டர்',
    desc:'Mason & helper count + days → total labour cost.',
    fields:[
      {id:'masons',en:'Number of Masons',ta:'கொத்தனார்கள்',unit:'nos',def:2},
      {id:'helpers',en:'Number of Helpers',ta:'உதவியாளர்கள்',unit:'nos',def:3},
      {id:'days',en:'Number of Days',ta:'நாட்கள்',unit:'days',def:20},
      {id:'masonWage',en:'Mason Daily Wage',ta:'கொத்தனார் கூலி',unit:'₹',def:800},
      {id:'helperWage',en:'Helper Daily Wage',ta:'உதவியாளர் கூலி',unit:'₹',def:500},
    ],
    calc:(v)=>{
      const total = (v.masons*v.masonWage + v.helpers*v.helperWage)*v.days;
      return [
        {label:'Total Labour Cost', main:true, value:'₹'+total.toLocaleString('en-IN')},
        {label:'Daily Cost', value:'₹'+((v.masons*v.masonWage)+(v.helpers*v.helperWage)).toLocaleString('en-IN')},
      ];
    }
  },
  {
    id:'boq-calc', cat:'advanced', icon:'📋',
    en:'BOQ Line Item Calculator', ta:'BOQ கால்குலேட்டர்',
    desc:'Quantity × rate → amount for a Bill of Quantities line item.',
    fields:[
      {id:'qty',en:'Quantity',ta:'அளவு',unit:'',def:100},
      {id:'rate',en:'Rate per Unit',ta:'யூனிட் விலை',unit:'₹',def:65},
    ],
    calc:(v)=>{
      const amount = v.qty*v.rate;
      return [
        {label:'Amount', main:true, value:'₹'+amount.toLocaleString('en-IN')},
      ];
    }
  },
  {
    id:'gst-calc', cat:'advanced', icon:'🧾',
    en:'GST Calculator', ta:'GST கால்குலேட்டர்',
    desc:'Base amount + GST% → GST amount & total payable.',
    fields:[
      {id:'amount',en:'Base Amount',ta:'அடிப்படை தொகை',unit:'₹',def:10000},
      {id:'gst',en:'GST %',ta:'',type:'select',options:[{v:5,l:'5%'},{v:12,l:'12%'},{v:18,l:'18%'},{v:28,l:'28%'}],def:18},
    ],
    calc:(v)=>{
      const gstAmt = v.amount*Number(v.gst)/100;
      const total = v.amount+gstAmt;
      return [
        {label:'Total Payable', main:true, value:'₹'+total.toLocaleString('en-IN')},
        {label:'GST Amount', value:'₹'+gstAmt.toLocaleString('en-IN')},
      ];
    }
  },
  {
    id:'emi-calc', cat:'advanced', icon:'🏦',
    en:'EMI Calculator', ta:'EMI கால்குலேட்டர்',
    desc:'Loan amount, interest rate & tenure → monthly EMI.',
    fields:[
      {id:'loan',en:'Loan Amount',ta:'கடன் தொகை',unit:'₹',def:1000000},
      {id:'rate',en:'Annual Interest Rate',ta:'வட்டி விகிதம்',unit:'%',def:9},
      {id:'months',en:'Tenure',ta:'காலம்',unit:'months',def:120},
    ],
    calc:(v)=>{
      const r = (v.rate/12)/100;
      const n = v.months;
      const emi = (v.loan*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
      return [
        {label:'Monthly EMI', main:true, value:'₹'+emi.toFixed(0).toLocaleString('en-IN')},
        {label:'Total Payment', value:'₹'+(emi*n).toFixed(0).toLocaleString('en-IN')},
      ];
    }
  },
  {
    id:'project-profit', cat:'advanced', icon:'📈',
    en:'Project Profit Calculator', ta:'திட்ட லாப கால்குலேட்டர்',
    desc:'Revenue vs cost → profit amount and margin %.',
    fields:[
      {id:'revenue',en:'Total Revenue',ta:'மொத்த வருவாய்',unit:'₹',def:500000},
      {id:'cost',en:'Total Cost',ta:'மொத்த செலவு',unit:'₹',def:400000},
    ],
    calc:(v)=>{
      const profit = v.revenue-v.cost;
      const margin = (profit/v.revenue)*100;
      return [
        {label:'Profit', main:true, value:'₹'+profit.toLocaleString('en-IN')},
        {label:'Profit Margin', value:margin.toFixed(2)+' %'},
      ];
    }
  },
  {
    id:'quantity-takeoff', cat:'advanced', icon:'📊',
    en:'Quantity Takeoff', ta:'அளவு கணக்கீடு',
    desc:'Dimensions + measurement type → volume, area or length.',
    fields:[
      {id:'l',en:'Length',ta:'நீளம்',unit:'ft',def:20},
      {id:'w',en:'Width',ta:'அகலம்',unit:'ft',def:10},
      {id:'h',en:'Height/Depth',ta:'உயரம்',unit:'ft',def:1},
      {id:'type',en:'Measurement Type',ta:'வகை',type:'select',options:[{v:'vol',l:'Volume (L×W×H)'},{v:'area',l:'Area (L×W)'},{v:'len',l:'Length only'}],def:'vol'},
    ],
    calc:(v)=>{
      if(v.type==='vol'){
        const val = v.l*v.w*v.h;
        return [{label:'Volume', main:true, value:val.toFixed(2)+' cu.ft'},{label:'Volume (cu.m)',value:(val*0.0283168).toFixed(3)+' m³'}];
      } else if(v.type==='area'){
        const val = v.l*v.w;
        return [{label:'Area', main:true, value:val.toFixed(2)+' sq.ft'},{label:'Area (sq.m)',value:(val*0.0929).toFixed(3)+' m²'}];
      } else {
        return [{label:'Length', main:true, value:v.l.toFixed(2)+' ft'},{label:'Length (m)',value:(v.l*0.3048).toFixed(3)+' m'}];
      }
    }
  },
];

/* ============== STATE ============== */
let lang = 'en'; // 'en' | 'ta'
let activeCat = 'all';
let history = JSON.parse(localStorage.getItem('ccp_history') || '[]');

/* ============== RENDER: CATEGORY RAIL ============== */
function renderRail(){
  const rail = document.getElementById('categoryRail');
  let html = `<div class="cat-chip ${activeCat==='all'?'active':''}" onclick="setCat('all')">
    <span class="dot"></span> ${lang==='en'?'All':'அனைத்தும்'}</div>`;
  CATEGORIES.forEach(c=>{
    if(c.status==='soon'){
      html += `<div class="cat-chip soon">${c.icon} ${lang==='en'?c.en:c.ta} <span class="badge">SOON</span></div>`;
    } else {
      html += `<div class="cat-chip ${activeCat===c.id?'active':''}" onclick="setCat('${c.id}')">
        <span class="dot"></span> ${c.icon} ${lang==='en'?c.en:c.ta}</div>`;
    }
  });
  rail.innerHTML = html;
}
function setCat(id){ activeCat = id; renderRail(); renderGrid(); }

/* ============== RENDER: CALC GRID ============== */
function renderGrid(){
  const grid = document.getElementById('calcGrid');
  const list = CALCULATORS.filter(c => activeCat==='all' || c.cat===activeCat);
  if(list.length===0){
    grid.innerHTML = `<div class="empty-note" style="grid-column:1/-1;">${lang==='en'?'More calculators coming soon in this category.':'இந்த பிரிவில் விரைவில் மேலும் கால்குலேட்டர்கள் வரும்.'}</div>`;
    return;
  }
  grid.innerHTML = list.map(c=>`
    <div class="calc-card" onclick="openCalc('${c.id}')">
      <div class="calc-icon">${c.icon}</div>
      <h3>${lang==='en'?c.en:c.ta}</h3>
      <p>${c.desc}</p>
    </div>
  `).join('');
}

/* ============== CALCULATOR PANEL ============== */
function openCalc(id, prefill){
  const c = CALCULATORS.find(x=>x.id===id);
  const panel = document.getElementById('calcPanel');
  let fieldsHtml = c.fields.map(f=>{
    const pv = (prefill && prefill[f.id]!==undefined) ? prefill[f.id] : f.def;
    if(f.type==='select'){
      return `<div class="field">
        <label>${lang==='en'?f.en:f.ta}</label>
        <select id="f_${f.id}">${f.options.map(o=>`<option value="${o.v}" ${String(o.v)===String(pv)?'selected':''}>${o.l}</option>`).join('')}</select>
      </div>`;
    }
    return `<div class="field">
      <label>${lang==='en'?f.en:f.ta} — ${f.unit}</label>
      <input type="number" id="f_${f.id}" value="${pv}" step="any">
    </div>`;
  }).join('');

  panel.innerHTML = `
    <button class="panel-close" onclick="closeCalc()">✕</button>
    <h3>${lang==='en'?c.en:c.ta}</h3>
    ${fieldsHtml}
    <button class="calc-btn" onclick="runCalc('${c.id}')">${lang==='en'?'Calculate':'கணக்கிடு'}</button>
    <div class="result" id="calcResult"></div>
  `;
  document.getElementById('calcOverlay').classList.add('open');
  if(prefill){ runCalc(id); }
}
function closeCalc(){ document.getElementById('calcOverlay').classList.remove('open'); }

function runCalc(id){
  const c = CALCULATORS.find(x=>x.id===id);
  const values = {};
  const inputsForPdf = [];
  c.fields.forEach(f=>{
    const el = document.getElementById('f_'+f.id);
    if(f.type==='select'){
      values[f.id] = el.value;
      const opt = f.options.find(o=>String(o.v)===String(el.value));
      inputsForPdf.push({label:lang==='en'?f.en:f.ta, value: opt ? opt.l : el.value});
    } else {
      values[f.id] = parseFloat(el.value)||0;
      inputsForPdf.push({label:lang==='en'?f.en:f.ta, value: el.value + ' ' + (f.unit||'')});
    }
  });
  const results = c.calc(values);
  const estCost = estimateCost(results);
  if(estCost !== null){
    results.push({
      label: lang==='en' ? '💰 Estimated Material Cost (auto)' : '💰 மதிப்பிடப்பட்ட செலவு (auto)',
      value: '₹' + Math.round(estCost).toLocaleString('en-IN'),
      chartExclude: true
    });
  }
  const resDiv = document.getElementById('calcResult');
  resDiv.innerHTML = results.map(r=>`
    <div class="r-row"><span class="r-label">${r.label}</span>
    <span class="${r.main?'r-main':'r-value'}">${r.value}</span></div>
  `).join('') + `
    <div class="chart-box" id="resultChartBox" style="display:none;">
      <div class="chart-title">${lang==='en'?'Quick Visual':'விரைவு காட்சி'}</div>
      <canvas id="resultChart" height="180"></canvas>
    </div>
    <div class="result-actions">
      <button class="ghost-btn" onclick="saveToHistory('${c.id}')">💾 Save</button>
      <button class="ghost-btn" onclick="downloadPdf()">📄 PDF</button>
      <button class="ghost-btn" onclick="window.print()">🖨️ Print</button>
      <button class="ghost-btn" onclick="explainResult()" id="aiExplainBtn">🤖 ${lang==='en'?'AI Explain':'AI விளக்கம்'}</button>
      <button class="ghost-btn" onclick="shareResultImage()" id="shareImgBtn">📤 ${lang==='en'?'Share Image':'படமாக பகிர்'}</button>
    </div>
    <div class="ai-explain-box" id="aiExplainBox" style="display:none;"></div>`;
  resDiv.classList.add('show');
  window._lastResult = {calcId:c.id, name:lang==='en'?c.en:c.ta, nameTa: c.ta, nameEn: c.en, inputs: inputsForPdf, results, rawValues: values, time:new Date().toISOString()};
  renderResultChart(results);
}

/* ============== CHARTS ============== */
let _resultChartInst = null;
let _historyChartInst = null;
const CHART_COLORS = ['#ff7a2f','#ffb454','#3ddc97','#5b9dff','#c98fff','#ff6b9d','#4ad0c8','#e8c14a'];

function parseNumeric(str){
  const m = String(str).match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function renderResultChart(results){
  const box = document.getElementById('resultChartBox');
  const canvas = document.getElementById('resultChart');
  if(!box || !canvas || typeof Chart==='undefined') return;
  const points = results.filter(r=>!r.chartExclude)
                         .map(r=>({label:r.label, value:parseNumeric(r.value)}))
                         .filter(p=>p.value!==null && !isNaN(p.value));
  if(points.length < 2){ box.style.display='none'; return; }
  box.style.display='block';
  if(_resultChartInst){ _resultChartInst.destroy(); }
  _resultChartInst = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: points.map(p=>p.label),
      datasets: [{
        data: points.map(p=>p.value),
        backgroundColor: points.map((_,i)=>CHART_COLORS[i % CHART_COLORS.length]),
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display:false } },
      scales: {
        x: { ticks: { color:'#8b93ab', font:{size:9} }, grid:{ color:'#233254' } },
        y: { ticks: { color:'#8b93ab', font:{size:9} }, grid:{ color:'#233254' } }
      }
    }
  });
}

function renderHistoryChart(){
  const box = document.getElementById('historyChartBox');
  const canvas = document.getElementById('historyChart');
  if(!box || !canvas || typeof Chart==='undefined') return;
  if(!history || history.length===0){ box.style.display='none'; return; }
  const counts = {};
  history.forEach(h=>{
    const c = CALCULATORS.find(x=>x.id===h.calcId);
    const catObj = c ? CATEGORIES.find(cat=>cat.id===c.cat) : null;
    const key = catObj ? (lang==='en'?catObj.en:catObj.ta) : (lang==='en'?'Other':'மற்றவை');
    counts[key] = (counts[key]||0) + 1;
  });
  const labels = Object.keys(counts);
  if(labels.length < 1){ box.style.display='none'; return; }
  box.style.display='block';
  document.getElementById('historyChartTitle').textContent = lang==='en' ? 'Category Usage' : 'பிரிவு பயன்பாடு';
  if(_historyChartInst){ _historyChartInst.destroy(); }
  _historyChartInst = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: labels.map(l=>counts[l]),
        backgroundColor: labels.map((_,i)=>CHART_COLORS[i % CHART_COLORS.length]),
        borderColor: '#0d1424',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position:'right', labels:{ color:'#c7cee2', font:{size:9}, boxWidth:10 } }
      }
    }
  });
}

/* Standard PDF fonts (times/helvetica) can't render the ₹ glyph — swap for Rs. in PDF output only */
function pdfSafe(s){ return String(s).replace(/₹/g, 'Rs.'); }

/* ============== SETTINGS: BUSINESS INFO + MATERIAL RATES ============== */
function loadBusiness(){
  try{ return JSON.parse(localStorage.getItem('ccp_business') || '{}'); }catch(e){ return {}; }
}
function loadRates(){
  try{ return JSON.parse(localStorage.getItem('ccp_rates') || '{}'); }catch(e){ return {}; }
}
function openSettings(){
  const biz = loadBusiness();
  const rates = loadRates();
  document.getElementById('bizName').value = biz.name || '';
  document.getElementById('bizPhone').value = biz.phone || '';
  document.getElementById('bizAddr').value = biz.addr || '';
  document.getElementById('bizGst').value = biz.gst || '';
  document.getElementById('rateCement').value = rates.cement || '';
  document.getElementById('rateSand').value = rates.sand || '';
  document.getElementById('rateAgg').value = rates.agg || '';
  document.getElementById('rateBrick').value = rates.brick || '';
  document.getElementById('rateBlock').value = rates.block || '';
  document.getElementById('rateSteel').value = rates.steel || '';
  document.getElementById('rateMason').value = rates.mason || '';
  document.getElementById('rateHelper').value = rates.helper || '';
  document.getElementById('settingsOverlay').classList.add('open');
}
function closeSettings(){ document.getElementById('settingsOverlay').classList.remove('open'); }
function saveSettings(){
  const gv = id => document.getElementById(id).value.trim();
  const gn = id => parseFloat(document.getElementById(id).value) || 0;
  const biz = {name:gv('bizName'), phone:gv('bizPhone'), addr:gv('bizAddr'), gst:gv('bizGst')};
  const rates = {
    cement:gn('rateCement'), sand:gn('rateSand'), agg:gn('rateAgg'),
    brick:gn('rateBrick'), block:gn('rateBlock'), steel:gn('rateSteel'),
    mason:gn('rateMason'), helper:gn('rateHelper')
  };
  localStorage.setItem('ccp_business', JSON.stringify(biz));
  localStorage.setItem('ccp_rates', JSON.stringify(rates));
  closeSettings();
}

/* Generic material-cost estimator — matches result labels against configured rates.
   Skips calculators that already output their own ₹ cost to avoid double-counting. */
function estimateCost(results){
  if(results.some(r=>String(r.value).includes('₹'))) return null;
  const rates = loadRates();
  let total = 0, matched = 0;
  results.forEach(r=>{
    const label = String(r.label).toLowerCase();
    const m = String(r.value).match(/-?\d+(\.\d+)?/);
    if(!m) return;
    const qty = parseFloat(m[0]);
    let rate = 0;
    if(label.includes('cement') && label.includes('bag')) rate = rates.cement;
    else if(label.includes('sand')) rate = rates.sand;
    else if(label.includes('aggregate')) rate = rates.agg;
    else if(label.includes('block')) rate = rates.block;
    else if(label.includes('brick')) rate = rates.brick;
    else if(label.includes('steel') && (label.includes('weight') || label.includes('kg'))) rate = rates.steel;
    if(rate && rate > 0){
      total += qty * rate;
      matched++;
    }
  });
  return matched > 0 ? total : null;
}

/* ============== PDF EXPORT (Royal Premium Edition) ============== */
function downloadPdf(){
  if(!window._lastResult){ return; }
  const r = window._lastResult;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 50;
  const frameTop = 118, frameBottom = pageH - 70;

  const NAVY = [12, 20, 38];
  const NAVY2 = [22, 33, 58];
  const GOLD = [196, 155, 66];
  const GOLD_DK = [150, 112, 40];
  const CREAM = [246, 239, 220];
  const INK = [32, 34, 46];
  const SUBINK = [92, 98, 116];
  const ROW_TINT = [251, 246, 232];
  const RULE = [222, 208, 168];

  let pageNum = 1;
  const BIZ = loadBusiness();

  function drawOrnamentDiamond(cx, cy, s, color){
    doc.setFillColor(...color);
    doc.triangle(cx, cy-s, cx-s, cy, cx, cy+s, 'F');
    doc.triangle(cx, cy-s, cx+s, cy, cx, cy+s, 'F');
  }

  function drawFrame(){
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.1);
    doc.rect(18, 18, pageW-36, pageH-36);
    doc.setLineWidth(0.5);
    doc.rect(22, 22, pageW-44, pageH-44);
  }

  function drawHeader(){
    doc.setFillColor(...NAVY);
    doc.rect(18, 18, pageW-36, 92, 'F');
    doc.setFillColor(...NAVY2);
    doc.rect(18, 92, pageW-36, 4, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.2);
    doc.line(marginX, 96, pageW-marginX, 96);

    drawOrnamentDiamond(marginX+4, 46, 5, GOLD);
    doc.setTextColor(...GOLD);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('CIVIL CALCULATOR PRO', marginX+18, 52);

    doc.setTextColor(...CREAM);
    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.text('Premium Calculation Report  ·  Certified Estimate Summary', marginX+18, 70);

    doc.setTextColor(...GOLD);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(new Date(r.time).toLocaleString(), pageW-marginX, 44, {align:'right'});
    doc.setTextColor(...CREAM);
    doc.text('Ref: ' + r.calcId.toUpperCase() + '-' + String(Date.now()).slice(-6), pageW-marginX, 58, {align:'right'});

    if(BIZ && BIZ.name){
      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...GOLD);
      doc.text(BIZ.name + (BIZ.phone ? '  ·  ' + BIZ.phone : ''), marginX+18, 85);
    }
  }

  function drawFooter(){
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.line(marginX, frameBottom, pageW-marginX, frameBottom);
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...SUBINK);
    doc.text('Generated by Civil Calculator Pro · Estimates are approximate — verify on site before ordering material.', marginX, frameBottom+16);
    doc.setFont('times', 'bold');
    doc.setTextColor(...GOLD_DK);
    doc.text('Page ' + pageNum, pageW-marginX, frameBottom+16, {align:'right'});
  }

  function newPage(){
    doc.addPage();
    pageNum++;
    drawFrame();
    drawHeader();
    drawFooter();
    return frameTop + 20;
  }

  function ensureSpace(y, needed){
    if(y + needed > frameBottom - 10){
      return newPage();
    }
    return y;
  }

  function sectionTitle(y, label){
    y = ensureSpace(y, 34);
    doc.setFillColor(...GOLD);
    doc.rect(marginX, y-11, 4, 14, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(label, marginX+12, y);
    y += 8;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.8);
    doc.line(marginX, y, pageW-marginX, y);
    return y + 20;
  }

  function dottedLeader(x1, x2, y){
    doc.setLineDashPattern([1.2, 1.6], 0);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.6);
    doc.line(x1, y, x2, y);
    doc.setLineDashPattern([], 0);
  }

  // ---- Build document ----
  drawFrame();
  drawHeader();
  drawFooter();
  let y = frameTop + 20;

  doc.setFont('times', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...INK);
  doc.text(r.nameEn, marginX, y);
  y += 20;
  doc.setFont('times', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(...GOLD_DK);
  doc.text(r.nameTa, marginX, y);
  y += 26;

  y = sectionTitle(y, 'INPUT PARAMETERS');
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  r.inputs.forEach((inp, i)=>{
    y = ensureSpace(y, 22);
    if(i % 2 === 0){
      doc.setFillColor(...ROW_TINT);
      doc.rect(marginX-4, y-13, pageW-2*marginX+8, 20, 'F');
    }
    doc.setTextColor(...SUBINK);
    doc.text(pdfSafe(inp.label), marginX, y);
    const labelW = doc.getTextWidth(pdfSafe(inp.label));
    const valW = doc.getTextWidth(pdfSafe(inp.value));
    dottedLeader(marginX+labelW+8, pageW-marginX-valW-8, y-3);
    doc.setTextColor(...INK);
    doc.setFont('times', 'bold');
    doc.text(pdfSafe(inp.value), pageW-marginX, y, {align:'right'});
    doc.setFont('times', 'normal');
    y += 20;
  });

  y += 12;
  y = sectionTitle(y, 'RESULTS');
  r.results.forEach(res=>{
    const rowH = res.main ? 34 : 22;
    y = ensureSpace(y, rowH+4);
    if(res.main){
      doc.setFillColor(...NAVY);
      doc.rect(marginX-4, y-18, pageW-2*marginX+8, 28, 'F');
      doc.setFillColor(...GOLD);
      doc.rect(marginX-4, y-18, 3, 28, 'F');
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...GOLD);
      doc.text(pdfSafe(res.label), marginX+8, y);
      doc.setTextColor(...CREAM);
      doc.text(pdfSafe(res.value), pageW-marginX, y, {align:'right'});
      y += 34;
    } else {
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...SUBINK);
      doc.text(pdfSafe(res.label), marginX, y);
      const labelW = doc.getTextWidth(pdfSafe(res.label));
      const valW = doc.getTextWidth(pdfSafe(res.value));
      dottedLeader(marginX+labelW+8, pageW-marginX-valW-8, y-3);
      doc.setFont('times', 'bold');
      doc.setTextColor(...INK);
      doc.text(pdfSafe(res.value), pageW-marginX, y, {align:'right'});
      y += 22;
    }
  });

  y = ensureSpace(y, 70);
  y += 20;
  const sealCx = pageW - marginX - 34, sealCy = y + 20;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.1);
  doc.circle(sealCx, sealCy, 26);
  doc.setLineWidth(0.5);
  doc.circle(sealCx, sealCy, 21);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD_DK);
  doc.text('CCP', sealCx, sealCy-1, {align:'center'});
  doc.setFontSize(6.2);
  doc.text('CERTIFIED', sealCx, sealCy+9, {align:'center'});
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(...SUBINK);
  doc.text('Civil Calculator Pro', marginX, sealCy+4);
  doc.text('Estimate Verified Format', marginX, sealCy+16);

  const fileName = 'CivilCalc_' + r.calcId + '_' + Date.now() + '.pdf';
  doc.save(fileName);
}

/* ============== FULL CONSOLIDATED REPORT (all saved calculators) ============== */
function downloadFullReportPdf(){
  if(!history || history.length===0){
    alert(lang==='en' ? 'No saved calculations yet. Save a few from the calculator results first.' : 'இன்னும் எந்த கணக்கீடும் சேமிக்கப்படவில்லை. முதலில் கணக்கீட்டு முடிவில் சேமிக்கவும்.');
    return;
  }
  const entries = history.slice().reverse(); // oldest -> newest
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 50;
  const frameTop = 118, frameBottom = pageH - 70;
  const genTime = new Date();
  const refCode = 'ALL-' + String(Date.now()).slice(-6);

  const NAVY = [12, 20, 38];
  const NAVY2 = [22, 33, 58];
  const GOLD = [196, 155, 66];
  const GOLD_DK = [150, 112, 40];
  const CREAM = [246, 239, 220];
  const INK = [32, 34, 46];
  const SUBINK = [92, 98, 116];
  const ROW_TINT = [251, 246, 232];
  const RULE = [222, 208, 168];

  let pageNum = 1;
  const BIZ = loadBusiness();

  function drawOrnamentDiamond(cx, cy, s, color){
    doc.setFillColor(...color);
    doc.triangle(cx, cy-s, cx-s, cy, cx, cy+s, 'F');
    doc.triangle(cx, cy-s, cx+s, cy, cx, cy+s, 'F');
  }

  function drawFrame(){
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.1);
    doc.rect(18, 18, pageW-36, pageH-36);
    doc.setLineWidth(0.5);
    doc.rect(22, 22, pageW-44, pageH-44);
  }

  function drawHeader(){
    doc.setFillColor(...NAVY);
    doc.rect(18, 18, pageW-36, 92, 'F');
    doc.setFillColor(...NAVY2);
    doc.rect(18, 92, pageW-36, 4, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.2);
    doc.line(marginX, 96, pageW-marginX, 96);

    drawOrnamentDiamond(marginX+4, 46, 5, GOLD);
    doc.setTextColor(...GOLD);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('CIVIL CALCULATOR PRO', marginX+18, 52);

    doc.setTextColor(...CREAM);
    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.text('Consolidated Project Report  ·  ' + entries.length + ' Calculation' + (entries.length>1?'s':''), marginX+18, 70);

    doc.setTextColor(...GOLD);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(genTime.toLocaleString(), pageW-marginX, 44, {align:'right'});
    doc.setTextColor(...CREAM);
    doc.text('Ref: ' + refCode, pageW-marginX, 58, {align:'right'});
    if(BIZ && BIZ.name){
      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...GOLD);
      doc.text(BIZ.name + (BIZ.phone ? '  ·  ' + BIZ.phone : ''), marginX+18, 85);
    }
  }

  function drawFooter(){
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.line(marginX, frameBottom, pageW-marginX, frameBottom);
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...SUBINK);
    doc.text('Generated by Civil Calculator Pro · Estimates are approximate — verify on site before ordering material.', marginX, frameBottom+16);
    doc.setFont('times', 'bold');
    doc.setTextColor(...GOLD_DK);
    doc.text('Page ' + pageNum, pageW-marginX, frameBottom+16, {align:'right'});
  }

  function newPage(){
    doc.addPage();
    pageNum++;
    drawFrame();
    drawHeader();
    drawFooter();
    return frameTop + 20;
  }

  function ensureSpace(y, needed){
    if(y + needed > frameBottom - 10){
      return newPage();
    }
    return y;
  }

  function sectionTitle(y, label){
    y = ensureSpace(y, 34);
    doc.setFillColor(...GOLD);
    doc.rect(marginX, y-11, 4, 14, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(label, marginX+12, y);
    y += 8;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.8);
    doc.line(marginX, y, pageW-marginX, y);
    return y + 20;
  }

  function dottedLeader(x1, x2, y){
    doc.setLineDashPattern([1.2, 1.6], 0);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.6);
    doc.line(x1, y, x2, y);
    doc.setLineDashPattern([], 0);
  }

  function mainResultOf(entry){
    const m = entry.results.find(res=>res.main);
    return m ? m.value : (entry.results[0] ? entry.results[0].value : '-');
  }

  // ---- Cover page ----
  drawFrame();
  drawHeader();
  drawFooter();
  let y = frameTop + 34;

  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text('CONSOLIDATED CALCULATION REPORT', marginX, y);
  y += 20;
  doc.setFont('times', 'italic');
  doc.setFontSize(11.5);
  doc.setTextColor(...GOLD_DK);
  doc.text('ஒருங்கிணைந்த கணக்கீட்டு அறிக்கை', marginX, y);
  y += 30;

  y = sectionTitle(y, 'SUMMARY');
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  entries.forEach((entry, i)=>{
    y = ensureSpace(y, 22);
    if(i % 2 === 0){
      doc.setFillColor(...ROW_TINT);
      doc.rect(marginX-4, y-13, pageW-2*marginX+8, 20, 'F');
    }
    doc.setTextColor(...GOLD_DK);
    doc.setFont('times', 'bold');
    doc.text(String(i+1) + '.', marginX, y);
    doc.setTextColor(...INK);
    doc.text(String(entry.name), marginX+18, y);
    const val = pdfSafe(mainResultOf(entry));
    doc.setTextColor(...SUBINK);
    doc.setFont('times', 'normal');
    const dt = new Date(entry.time).toLocaleDateString();
    doc.text(dt, pageW-marginX-110, y, {align:'right'});
    doc.setFont('times', 'bold');
    doc.setTextColor(...NAVY2);
    doc.text(val, pageW-marginX, y, {align:'right'});
    y += 20;
  });

  y += 10;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, pageW-marginX, y);

  // ---- Detail sections ----
  entries.forEach((entry, idx)=>{
    y = ensureSpace(y, 60);
    y += 24;
    y = ensureSpace(y, 60);

    // Entry title chip
    doc.setFillColor(...NAVY);
    doc.circle(marginX+9, y-5, 11, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...GOLD);
    doc.text(String(idx+1), marginX+9, y-2, {align:'center'});

    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...INK);
    doc.text(String(entry.name), marginX+28, y);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...SUBINK);
    doc.text(new Date(entry.time).toLocaleString(), pageW-marginX, y, {align:'right'});
    y += 12;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.6);
    doc.line(marginX, y, pageW-marginX, y);
    y += 18;

    // Inputs (compact)
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...GOLD_DK);
    y = ensureSpace(y, 16);
    doc.text('INPUTS', marginX, y);
    y += 14;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    (entry.inputs||[]).forEach((inp, i)=>{
      y = ensureSpace(y, 18);
      if(i % 2 === 0){
        doc.setFillColor(...ROW_TINT);
        doc.rect(marginX-4, y-11, pageW-2*marginX+8, 17, 'F');
      }
      doc.setTextColor(...SUBINK);
      doc.text(pdfSafe(inp.label), marginX, y);
      const labelW = doc.getTextWidth(pdfSafe(inp.label));
      const valW = doc.getTextWidth(pdfSafe(inp.value));
      dottedLeader(marginX+labelW+8, pageW-marginX-valW-8, y-3);
      doc.setTextColor(...INK);
      doc.setFont('times', 'bold');
      doc.text(pdfSafe(inp.value), pageW-marginX, y, {align:'right'});
      doc.setFont('times', 'normal');
      y += 17;
    });

    y += 8;
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...GOLD_DK);
    y = ensureSpace(y, 16);
    doc.text('RESULTS', marginX, y);
    y += 14;

    entry.results.forEach(res=>{
      const rowH = res.main ? 28 : 17;
      y = ensureSpace(y, rowH+2);
      if(res.main){
        doc.setFillColor(...NAVY);
        doc.rect(marginX-4, y-15, pageW-2*marginX+8, 23, 'F');
        doc.setFillColor(...GOLD);
        doc.rect(marginX-4, y-15, 3, 23, 'F');
        doc.setFont('times', 'bold');
        doc.setFontSize(11.5);
        doc.setTextColor(...GOLD);
        doc.text(pdfSafe(res.label), marginX+8, y);
        doc.setTextColor(...CREAM);
        doc.text(pdfSafe(res.value), pageW-marginX, y, {align:'right'});
        y += 28;
      } else {
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...SUBINK);
        doc.text(pdfSafe(res.label), marginX, y);
        const labelW = doc.getTextWidth(pdfSafe(res.label));
        const valW = doc.getTextWidth(pdfSafe(res.value));
        dottedLeader(marginX+labelW+8, pageW-marginX-valW-8, y-3);
        doc.setFont('times', 'bold');
        doc.setTextColor(...INK);
        doc.text(pdfSafe(res.value), pageW-marginX, y, {align:'right'});
        y += 17;
      }
    });

    if(idx < entries.length-1){
      y += 10;
      doc.setLineDashPattern([2,2], 0);
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.6);
      doc.line(marginX, y, pageW-marginX, y);
      doc.setLineDashPattern([], 0);
    }
  });

  // ---- Closing seal ----
  y = ensureSpace(y, 80);
  y += 24;
  const sealCx = pageW - marginX - 34, sealCy = y + 20;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.1);
  doc.circle(sealCx, sealCy, 26);
  doc.setLineWidth(0.5);
  doc.circle(sealCx, sealCy, 21);
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD_DK);
  doc.text('CCP', sealCx, sealCy-1, {align:'center'});
  doc.setFontSize(6.2);
  doc.text('CERTIFIED', sealCx, sealCy+9, {align:'center'});
  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(...SUBINK);
  doc.text('Civil Calculator Pro', marginX, sealCy+4);
  doc.text('Consolidated Report · ' + entries.length + ' entries', marginX, sealCy+16);

  const fileName = 'CivilCalc_FullReport_' + Date.now() + '.pdf';
  doc.save(fileName);
}

/* ============== BLANK TEMPLATE (all calculators, printable worksheet) ============== */
function downloadBlankTemplatePdf(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 50;
  const frameTop = 118, frameBottom = pageH - 70;
  const genTime = new Date();
  const refCode = 'TPL-' + String(Date.now()).slice(-6);
  const totalCalcs = CALCULATORS.length;

  const NAVY = [12, 20, 38];
  const NAVY2 = [22, 33, 58];
  const GOLD = [196, 155, 66];
  const GOLD_DK = [150, 112, 40];
  const CREAM = [246, 239, 220];
  const INK = [32, 34, 46];
  const SUBINK = [92, 98, 116];
  const ROW_TINT = [251, 246, 232];
  const RULE = [222, 208, 168];

  let pageNum = 1;
  const BIZ = loadBusiness();

  function drawOrnamentDiamond(cx, cy, s, color){
    doc.setFillColor(...color);
    doc.triangle(cx, cy-s, cx-s, cy, cx, cy+s, 'F');
    doc.triangle(cx, cy-s, cx+s, cy, cx, cy+s, 'F');
  }

  function drawFrame(){
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.1);
    doc.rect(18, 18, pageW-36, pageH-36);
    doc.setLineWidth(0.5);
    doc.rect(22, 22, pageW-44, pageH-44);
  }

  function drawHeader(){
    doc.setFillColor(...NAVY);
    doc.rect(18, 18, pageW-36, 92, 'F');
    doc.setFillColor(...NAVY2);
    doc.rect(18, 92, pageW-36, 4, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.2);
    doc.line(marginX, 96, pageW-marginX, 96);

    drawOrnamentDiamond(marginX+4, 46, 5, GOLD);
    doc.setTextColor(...GOLD);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('CIVIL CALCULATOR PRO', marginX+18, 52);

    doc.setTextColor(...CREAM);
    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.text('Blank Worksheet Template  ·  All ' + totalCalcs + ' Calculators', marginX+18, 70);

    doc.setTextColor(...GOLD);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(genTime.toLocaleString(), pageW-marginX, 44, {align:'right'});
    doc.setTextColor(...CREAM);
    doc.text('Ref: ' + refCode, pageW-marginX, 58, {align:'right'});
    if(BIZ && BIZ.name){
      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...GOLD);
      doc.text(BIZ.name + (BIZ.phone ? '  ·  ' + BIZ.phone : ''), marginX+18, 85);
    }
  }

  function drawFooter(){
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.line(marginX, frameBottom, pageW-marginX, frameBottom);
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...SUBINK);
    doc.text('Civil Calculator Pro · Fill values on site, then enter into the app for instant results.', marginX, frameBottom+16);
    doc.setFont('times', 'bold');
    doc.setTextColor(...GOLD_DK);
    doc.text('Page ' + pageNum, pageW-marginX, frameBottom+16, {align:'right'});
  }

  function newPage(){
    doc.addPage();
    pageNum++;
    drawFrame();
    drawHeader();
    drawFooter();
    return frameTop + 20;
  }

  function ensureSpace(y, needed){
    if(y + needed > frameBottom - 10){
      return newPage();
    }
    return y;
  }

  function categoryBand(y, label){
    y = ensureSpace(y, 40);
    doc.setFillColor(...NAVY);
    doc.rect(marginX-4, y-16, pageW-2*marginX+8, 24, 'F');
    doc.setFillColor(...GOLD);
    doc.rect(marginX-4, y-16, 3, 24, 'F');
    doc.setFont('times', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...GOLD);
    doc.text(label.toUpperCase(), marginX+8, y);
    return y + 26;
  }

  // ---- Cover ----
  drawFrame();
  drawHeader();
  drawFooter();
  let y = frameTop + 34;

  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text('BLANK CALCULATION WORKSHEET', marginX, y);
  y += 20;
  doc.setFont('times', 'italic');
  doc.setFontSize(11.5);
  doc.setTextColor(...GOLD_DK);
  doc.text('காலி கணக்கீட்டு படிவம் — தள பயன்பாட்டிற்கு', marginX, y);
  y += 22;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SUBINK);
  const introLines = doc.splitTextToSize('Print this and carry it to site. Fill each field with measured / chosen values by hand, then enter the same numbers into Civil Calculator Pro app for instant results, or keep as a paper record.', pageW-2*marginX);
  doc.text(introLines, marginX, y);
  y += introLines.length*13 + 14;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, pageW-marginX, y);
  y += 26;

  // ---- Categories & calculators ----
  CATEGORIES.forEach(cat=>{
    const calcsInCat = CALCULATORS.filter(c=>c.cat===cat.id);
    if(calcsInCat.length===0) return;
    y = categoryBand(y, cat.en + '  ·  ' + cat.ta);

    calcsInCat.forEach(calc=>{
      y = ensureSpace(y, 40);
      doc.setFont('times', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(...NAVY2);
      doc.text((calc.icon||'') + '  ' + calc.en, marginX, y);
      doc.setFont('times', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(...GOLD_DK);
      doc.text(calc.ta, pageW-marginX, y, {align:'right'});
      y += 16;

      (calc.fields||[]).forEach((f, i)=>{
        y = ensureSpace(y, 18);
        if(i % 2 === 0){
          doc.setFillColor(...ROW_TINT);
          doc.rect(marginX-4, y-11, pageW-2*marginX+8, 17, 'F');
        }
        let label = f.en + (f.ta ? '  (' + f.ta + ')' : '');
        if(f.unit) label += '  [' + f.unit + ']';
        if(f.type==='select' && f.options){
          const opts = f.options.map(o=>o.l!==undefined?o.l:o.v).join(' / ');
          label += '  — ' + opts;
        }
        label = pdfSafe(label);
        doc.setFont('times', 'normal');
        doc.setFontSize(9.3);
        doc.setTextColor(...SUBINK);
        const labelLines = doc.splitTextToSize(label, pageW - 2*marginX - 150);
        doc.text(labelLines[0], marginX, y);
        // blank fill line
        doc.setDrawColor(...RULE);
        doc.setLineWidth(0.6);
        doc.line(pageW-marginX-130, y, pageW-marginX, y);
        y += 16;
        if(labelLines.length>1){
          for(let li=1; li<labelLines.length; li++){
            y = ensureSpace(y, 14);
            doc.text(labelLines[li], marginX, y);
            y += 13;
          }
        }
      });
      y += 10;
    });
    y += 6;
  });

  const fileName = 'CivilCalc_BlankTemplate_' + Date.now() + '.pdf';
  doc.save(fileName);
}

/* ============== HISTORY ============== */
function saveToHistory(){
  if(!window._lastResult) return;
  history.unshift(window._lastResult);
  history = history.slice(0,30);
  localStorage.setItem('ccp_history', JSON.stringify(history));
  renderHistory();
}
function renderHistory(){
  const list = document.getElementById('historyList');
  if(history.length===0){
    list.innerHTML = `<div class="empty-note">${lang==='en'?'No saved calculations yet.':'இன்னும் சேமிக்கப்பட்ட கணக்கீடுகள் இல்லை.'}</div>`;
    return;
  }
  list.innerHTML = history.map((h,i)=>{
    const d = new Date(h.time);
    const main = h.results.find(r=>r.main) || h.results[0];
    return `<div class="history-item">
      <div class="h-top"><span>${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div>
      <div class="h-name">${h.name}</div>
      <div>${main.label}: <strong>${main.value}</strong></div>
      <div style="margin-top:6px;">
        <button class="ghost-btn" style="padding:4px 10px;font-size:11px;" onclick="reuseHistory(${i})">🔁 ${lang==='en'?'Reuse / Edit':'மீண்டும் பயன்படுத்து'}</button>
      </div>
    </div>`;
  }).join('');
}
function reuseHistory(i){
  const h = history[i];
  if(!h || !h.calcId) return;
  closeHistory();
  openCalc(h.calcId, h.rawValues || null);
}
function exportHistoryJson(){
  if(!history || history.length===0){
    alert(lang==='en' ? 'No history to export yet.' : 'ஏற்றுமதி செய்ய வரலாறு இல்லை.');
    return;
  }
  const blob = new Blob([JSON.stringify(history, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CivilCalc_History_Backup_' + Date.now() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function importHistoryJson(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const imported = JSON.parse(e.target.result);
      if(!Array.isArray(imported)) throw new Error('bad format');
      const existingKeys = new Set(history.map(h=>h.calcId+'|'+h.time));
      const fresh = imported.filter(h=>h && h.calcId && h.time && !existingKeys.has(h.calcId+'|'+h.time));
      history = fresh.concat(history).slice(0, 60);
      localStorage.setItem('ccp_history', JSON.stringify(history));
      renderHistory();
      renderHistoryChart();
      alert(lang==='en' ? ('Imported ' + fresh.length + ' calculation(s).') : (fresh.length + ' கணக்கீடுகள் இறக்குமதி செய்யப்பட்டன.'));
    }catch(err){
      alert(lang==='en' ? 'Invalid backup file.' : 'காப்பு கோப்பு சரியானதல்ல.');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}
function clearHistory(){
  history = [];
  localStorage.setItem('ccp_history', '[]');
  renderHistory();
  renderHistoryChart();
}
function openHistory(){ renderHistory(); renderHistoryChart(); document.getElementById('historyOverlay').classList.add('open'); }
function closeHistory(){ document.getElementById('historyOverlay').classList.remove('open'); }

/* ============== LANG TOGGLE ============== */
function setLang(target){
  lang = target;
  document.getElementById('langBtnEn').classList.toggle('active', lang==='en');
  document.getElementById('langBtnTa').classList.toggle('active', lang==='ta');
  document.getElementById('heroSub').textContent = lang==='en'
    ? 'Concrete, cement-sand-aggregate, mix ratios and more — built for Tamil Nadu contractor workflows. More categories rolling out in phases.'
    : 'கான்கிரீட், சிமெண்ட்-மணல்-கல் கலவை மற்றும் பலவும் — தமிழ்நாடு ஒப்பந்ததார் பணிக்கு ஏற்றவாறு. மேலும் பிரிவுகள் விரைவில்.';
  document.getElementById('historyToggle').textContent = lang==='en' ? '🕘 History' : '🕘 வரலாறு';
  document.getElementById('blankTemplateBtn').textContent = lang==='en' ? '📝 Blank Template' : '📝 காலி படிவம்';
  document.getElementById('historyTitle').textContent = lang==='en' ? 'Calculation History' : 'கணக்கீட்டு வரலாறு';
  document.getElementById('clearHistoryBtn').textContent = lang==='en' ? 'Clear all' : 'அனைத்தையும் அழி';
  document.getElementById('fullReportBtn').textContent = lang==='en' ? '📊 Full Report PDF' : '📊 முழு அறிக்கை PDF';
  document.getElementById('settingsToggle').textContent = lang==='en' ? '⚙️ Settings' : '⚙️ அமைப்புகள்';
  applyTheme(document.body.classList.contains('light-theme') ? 'light' : 'dark');
  document.getElementById('advisorToggle').textContent = lang==='en' ? '🏗️ AI Advisor' : '🏗️ AI ஆலோசகர்';
  document.getElementById('advisorTitle').textContent = lang==='en' ? 'AI Project Advisor' : 'AI திட்ட ஆலோசகர்';
  document.getElementById('advisorSubtitle').textContent = lang==='en'
    ? 'Describe your project — get a rough full material & cost estimate combining multiple calculators.'
    : 'உங்கள் திட்டத்தை விவரிக்கவும் — பல கால்குலேட்டர்களை இணைத்து மொத்த பொருள் & செலவு மதிப்பீட்டைப் பெறுங்கள்.';
  document.getElementById('lblProjType').textContent = lang==='en' ? 'Project Type' : 'திட்ட வகை';
  document.getElementById('optHouse').textContent = lang==='en' ? 'House / Building' : 'வீடு / கட்டிடம்';
  document.getElementById('optWall').textContent = lang==='en' ? 'Compound Wall' : 'சுற்றுச் சுவர்';
  document.getElementById('optShed').textContent = lang==='en' ? 'Shed / Godown' : 'ஷெட் / கிடங்கு';
  document.getElementById('optCommercial').textContent = lang==='en' ? 'Commercial Building' : 'வணிக கட்டிடம்';
  document.getElementById('optRenovation').textContent = lang==='en' ? 'Renovation' : 'புதுப்பித்தல்';
  document.getElementById('lblBuiltup').textContent = lang==='en' ? 'Built-up Area (sq.ft)' : 'கட்டப்படும் பரப்பளவு (sq.ft)';
  document.getElementById('lblFloors').textContent = lang==='en' ? 'No. of Floors' : 'மாடிகளின் எண்ணிக்கை';
  document.getElementById('lblQuality').textContent = lang==='en' ? 'Construction Quality' : 'கட்டுமான தரம்';
  document.getElementById('optBasic').textContent = lang==='en' ? 'Basic' : 'எளிய தரம்';
  document.getElementById('optStandard').textContent = lang==='en' ? 'Standard' : 'நடுத்தர தரம்';
  document.getElementById('optPremium').textContent = lang==='en' ? 'Premium' : 'உயர் தரம்';
  document.getElementById('lblExtra').textContent = lang==='en' ? 'Additional Details (optional)' : 'கூடுதல் விவரங்கள் (விருப்பம்)';
  document.getElementById('advisorGoBtn').textContent = lang==='en' ? '🏗️ Get Estimate' : '🏗️ மதிப்பீடு பெறு';
  document.getElementById('advisorPdfBtn').textContent = lang==='en' ? '📄 PDF' : '📄 PDF';
  document.getElementById('installBtn').textContent = lang==='en' ? '📲 Install App' : '📲 செயலியை நிறுவு';
  document.getElementById('iosInstallTipText').textContent = lang==='en'
    ? '📲 Use as an app on iPhone: tap Share → "Add to Home Screen".'
    : '📲 iPhone-ல் செயலி போல பயன்படுத்த: Share பொத்தானை தட்டவும் → "Add to Home Screen" தேர்ந்தெடுக்கவும்.';
  document.getElementById('settingsTitle').textContent = lang==='en' ? 'Settings' : 'அமைப்புகள்';
  document.getElementById('exportHistoryBtn').textContent = lang==='en' ? '⬇️ Export JSON' : '⬇️ ஏற்றுமதி';
  document.getElementById('importHistoryBtn').textContent = lang==='en' ? '⬆️ Import JSON' : '⬆️ இறக்குமதி';
  document.getElementById('saveSettingsBtn').textContent = lang==='en' ? '💾 Save Settings' : '💾 சேமி';
  document.getElementById('settingsNote').textContent = lang==='en'
    ? 'Saved only in this browser. Used to auto-estimate material cost and brand your PDF reports.'
    : 'இது இந்த உலாவியில் மட்டுமே சேமிக்கப்படும். இதை பொருள் செலவு தானாக மதிப்பிடவும், PDF அறிக்கைகளில் உங்கள் வணிகப் பெயரைச் சேர்க்கவும் பயன்படுத்துவோம்.';
  document.getElementById('aiTitle').textContent = lang==='en' ? 'AI Site Assistant' : 'AI உதவியாளர்';
  document.getElementById('aiSubtitle').textContent = lang==='en' ? 'Powered by Gemini · Ask any civil engineering question' : 'Gemini மூலம் · எந்த சிவில் கேள்வியும் கேளுங்கள்';
  document.getElementById('aiKeyNote').innerHTML = lang==='en'
    ? 'Your key is saved only in this browser (localStorage), never shared. Free key: <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com/apikey</a>'
    : 'Unga key browser la mattum save aagum, yarukkum theriyathu. Free key: <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com/apikey</a>';
  renderRail(); renderGrid(); renderHistory(); renderHistoryChart();
}

/* ============== AI ASSISTANT (Gemini) ============== */
/* ⚠️ WARNING: If you fill in a real key below AND publish this file on a public
   GitHub Pages site, anyone can view page source and steal your key.
   Only fill this in if you're testing locally / privately. For a public site,
   leave it as "YOUR_GEMINI_API_KEY" and let each visitor enter their own key. */
const API_KEY = "YOUR_GEMINI_API_KEY";

let geminiKey = (API_KEY && API_KEY !== "YOUR_GEMINI_API_KEY") ? API_KEY : (localStorage.getItem('ccp_gemini_key') || '');
let aiChatHistory = [];

function refreshAiKeyUi(){
  const bar = document.getElementById('aiKeyBar');
  const input = document.getElementById('geminiKeyInput');
  if(geminiKey){
    bar.style.display = 'none';
  } else {
    bar.style.display = 'block';
    input.value = '';
  }
}

function changeGeminiKey(){
  geminiKey = '';
  localStorage.removeItem('ccp_gemini_key');
  refreshAiKeyUi();
}

function saveGeminiKey(){
  const val = document.getElementById('geminiKeyInput').value.trim();
  if(!val){ return; }
  if(val.length < 15){
    alert(lang==='en'
      ? 'This key looks too short. Please copy the full key from aistudio.google.com/apikey'
      : 'இந்த key மிகவும் சிறியதாக இருக்கிறது. aistudio.google.com/apikey இலிருந்து முழு key-ஐ காபி செய்யவும்.');
    return;
  }
  geminiKey = val;
  localStorage.setItem('ccp_gemini_key', geminiKey);
  refreshAiKeyUi();
}

function openAi(){
  refreshAiKeyUi();
  document.getElementById('aiOverlay').classList.add('open');
  document.getElementById('aiInput').focus();
}
function closeAi(){ document.getElementById('aiOverlay').classList.remove('open'); }

function askQuick(el){
  document.getElementById('aiInput').value = el.textContent;
  sendAiMessage();
}

function appendAiMessage(role, text){
  const box = document.getElementById('aiMessages');
  const empty = document.getElementById('aiEmptyNote');
  if(empty) empty.remove();
  const div = document.createElement('div');
  div.className = 'ai-msg ' + (role==='user' ? 'user' : 'bot');
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

async function sendAiMessage(){
  const input = document.getElementById('aiInput');
  const question = input.value.trim();
  if(!question) return;

  if(!geminiKey){
    refreshAiKeyUi();
    appendAiMessage('bot', lang==='en'
      ? 'Please add your Gemini API key above first.'
      : 'முதலில் மேலே Gemini API key-ஐ சேர்க்கவும்.');
    return;
  }

  appendAiMessage('user', question);
  input.value = '';
  const loadingDiv = appendAiMessage('bot', lang==='en' ? 'Thinking...' : 'யோசிக்கிறேன்...');
  loadingDiv.classList.add('loading');

  const systemContext = "You are a helpful civil engineering site assistant for a freelance e-commerce and civil-tools developer in Tamil Nadu, India named Mukesh. Answer construction, civil engineering, material estimation, and site-related questions clearly and practically. Keep answers concise (under 120 words unless calculations need more detail). If the question is in Tamil or Tanglish, you may reply in the same style. Use Indian units (feet, sqft, cft, kg) where relevant.";

  try{
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemContext }] },
        contents: [
          ...aiChatHistory,
          { role:'user', parts:[{ text: question }] }
        ]
      })
    });
    const data = await resp.json();
    loadingDiv.remove();

    if(!resp.ok){
      const msg = (data && data.error && data.error.message) ? data.error.message : 'Request failed';
      appendAiMessage('bot', (lang==='en' ? 'Error: ' : 'தவறு: ') + msg);
      return;
    }

    const answer = data && data.candidates && data.candidates[0] && data.candidates[0].content
      ? data.candidates[0].content.parts.map(p=>p.text).join('')
      : (lang==='en' ? 'No response received.' : 'பதில் கிடைக்கவில்லை.');

    appendAiMessage('bot', answer);
    aiChatHistory.push({ role:'user', parts:[{ text: question }] });
    aiChatHistory.push({ role:'model', parts:[{ text: answer }] });
    if(aiChatHistory.length > 20) aiChatHistory = aiChatHistory.slice(-20);
  } catch(err){
    loadingDiv.remove();
    appendAiMessage('bot', (lang==='en' ? 'Network error: ' : 'நெட்வொர்க் பிழை: ') + (err && err.message ? err.message : 'unknown') + (lang==='en' ? '\n\nTip: open this file directly in Chrome/Safari (not inside an app preview) and make sure you have a valid Gemini key from aistudio.google.com/apikey' : '\n\nகுறிப்பு: இந்த கோப்பை Chrome/Safari-ல் நேரடியாகத் திறக்கவும் (ஆப் மாதிரிக்காட்சிக்குள் அல்ல), சரியான Gemini key aistudio.google.com/apikey இலிருந்து பெற்றிருக்கிறீர்களா என்பதை உறுதிசெய்யவும்.'));
  }
}

async function explainResult(){
  const box = document.getElementById('aiExplainBox');
  if(!box || !window._lastResult) return;

  if(!geminiKey){
    box.style.display = 'block';
    box.classList.remove('loading');
    box.innerHTML = `<div class="ai-explain-title">🤖 AI Explain</div>` +
      (lang==='en'
        ? 'Add your free Gemini API key in the AI assistant panel first (bottom right), then try again.'
        : 'முதலில் AI உதவியாளர் பலகத்தில் (கீழ் வலது பக்கம்) உங்கள் இலவச Gemini API key-ஐ சேர்க்கவும், பிறகு மீண்டும் முயற்சிக்கவும்.');
    return;
  }

  const r = window._lastResult;
  box.style.display = 'block';
  box.classList.add('loading');
  box.innerHTML = `<div class="ai-explain-title">🤖 AI Explain</div>` + (lang==='en' ? 'Thinking...' : 'யோசிக்கிறேன்...');

  const inputsText = r.inputs.map(i=>`${i.label}: ${i.value}`).join(', ');
  const resultsText = r.results.map(res=>`${res.label}: ${res.value}`).join(', ');
  const prompt = `Calculator used: "${r.name}". Inputs given: ${inputsText}. Results obtained: ${resultsText}. In 2-3 short simple sentences, explain to a site contractor how this result was calculated (the basic formula/logic in plain words, no heavy math notation). ${lang==='ta' ? 'Reply fully in the Tamil language (தமிழ்), not English, not a mix.' : 'Reply in simple English.'}`;

  try{
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are a civil engineering assistant explaining calculator results simply and briefly to a Tamil Nadu site contractor.' }] },
        contents: [{ role:'user', parts:[{ text: prompt }] }]
      })
    });
    const data = await resp.json();
    box.classList.remove('loading');

    if(!resp.ok){
      const msg = (data && data.error && data.error.message) ? data.error.message : 'Request failed';
      box.innerHTML = `<div class="ai-explain-title">🤖 AI Explain</div>` + (lang==='en' ? 'Error: ' : 'தவறு: ') + msg;
      return;
    }
    const answer = data && data.candidates && data.candidates[0] && data.candidates[0].content
      ? data.candidates[0].content.parts.map(p=>p.text).join('')
      : (lang==='en' ? 'No response received.' : 'பதில் கிடைக்கவில்லை.');
    box.innerHTML = `<div class="ai-explain-title">🤖 AI Explain</div>` + answer;
  } catch(err){
    box.classList.remove('loading');
    box.innerHTML = `<div class="ai-explain-title">🤖 AI Explain</div>` + (lang==='en' ? 'Network error — check your connection and API key.' : 'நெட்வொர்க் பிழை — உங்கள் இணைப்பு மற்றும் API key-ஐ சரிபார்க்கவும்.');
  }
}

/* ============== THEME (DARK / LIGHT) ============== */
function applyTheme(theme){
  const btn = document.getElementById('themeToggle');
  if(theme === 'light'){
    document.body.classList.add('light-theme');
    if(btn) btn.textContent = lang==='en' ? '☀️ Light' : '☀️ லைட்';
  } else {
    document.body.classList.remove('light-theme');
    if(btn) btn.textContent = lang==='en' ? '🌙 Dark' : '🌙 டார்க்';
  }
}
function toggleTheme(){
  const current = localStorage.getItem('ccp_theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('ccp_theme', next);
  applyTheme(next);
}
applyTheme(localStorage.getItem('ccp_theme') || 'dark');

/* ============== PWA INSTALL ============== */
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  _deferredInstallPrompt = e;
  const btn = document.getElementById('installBtn');
  if(btn) btn.style.display = 'inline-flex';
});
function installApp(){
  if(!_deferredInstallPrompt) return;
  _deferredInstallPrompt.prompt();
  _deferredInstallPrompt.userChoice.finally(()=>{
    _deferredInstallPrompt = null;
    const btn = document.getElementById('installBtn');
    if(btn) btn.style.display = 'none';
  });
}
window.addEventListener('appinstalled', ()=>{
  const btn = document.getElementById('installBtn');
  if(btn) btn.style.display = 'none';
});
function dismissIosTip(){
  document.getElementById('iosInstallTip').style.display = 'none';
  localStorage.setItem('ccp_ios_tip_dismissed', '1');
}
(function checkIosInstallTip(){
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  const dismissed = localStorage.getItem('ccp_ios_tip_dismissed');
  if(isIos && !isStandalone && !dismissed){
    const tip = document.getElementById('iosInstallTip');
    if(tip) tip.style.display = 'flex';
  }
})();

/* ============== AI PROJECT ADVISOR ============== */
function openAdvisor(){
  document.getElementById('advisorOverlay').classList.add('open');
}
function closeAdvisor(){
  document.getElementById('advisorOverlay').classList.remove('open');
}
window._lastAdvisorEstimate = null;

async function getProjectEstimate(){
  const box = document.getElementById('advisorResultBox');
  const actions = document.getElementById('advisorActions');
  const projType = document.getElementById('advProjType').value;
  const area = document.getElementById('advArea').value.trim();
  const floors = document.getElementById('advFloors').value.trim() || '1';
  const quality = document.getElementById('advQuality').value;
  const extra = document.getElementById('advExtra').value.trim();

  if(!area){
    alert(lang==='en' ? 'Please enter the built-up area in sq.ft.' : 'கட்டப்படும் பரப்பளவை (sq.ft) உள்ளிடவும்.');
    return;
  }
  if(!geminiKey){
    box.style.display = 'block';
    box.classList.remove('loading');
    box.innerHTML = `<div class="ai-explain-title">🏗️ AI Project Advisor</div>` +
      (lang==='en'
        ? 'Add your free Gemini API key in the AI assistant panel first (bottom right), then try again.'
        : 'முதலில் AI உதவியாளர் பலகத்தில் (கீழ் வலது பக்கம்) உங்கள் இலவச Gemini API key-ஐ சேர்க்கவும், பிறகு மீண்டும் முயற்சிக்கவும்.');
    return;
  }

  box.style.display = 'block';
  box.classList.add('loading');
  actions.style.display = 'none';
  box.innerHTML = `<div class="ai-explain-title">🏗️ AI Project Advisor</div>` + (lang==='en' ? 'Estimating...' : 'மதிப்பிடுகிறேன்...');

  const prompt = `You are a civil engineering estimator helping a Tamil Nadu contractor. Give a rough, practical full-project material and cost estimate for:
- Project type: ${projType}
- Built-up area: ${area} sq.ft
- Floors: ${floors}
- Construction quality: ${quality}
${extra ? '- Additional details: ' + extra : ''}

Cover: approximate cement (bags), sand (cu.ft), aggregate (cu.ft), steel (kg), bricks/blocks (nos), and an overall approximate total cost range in Indian Rupees (₹). Present as short labeled lines, one item per line, no long paragraphs. Clearly state at the top and bottom that these are rough approximate figures and site verification / a qualified engineer's estimate is recommended before ordering material or budgeting. ${lang==='ta' ? 'Reply fully in the Tamil language (தமிழ்), not English, not a mix.' : 'Reply in simple English.'}`;

  try{
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are a civil engineering assistant giving rough whole-project material and cost estimates to a Tamil Nadu site contractor. Be concise and use plain labeled lines.' }] },
        contents: [{ role:'user', parts:[{ text: prompt }] }]
      })
    });
    const data = await resp.json();
    box.classList.remove('loading');

    if(!resp.ok){
      const msg = (data && data.error && data.error.message) ? data.error.message : 'Request failed';
      box.innerHTML = `<div class="ai-explain-title">🏗️ AI Project Advisor</div>` + (lang==='en' ? 'Error: ' : 'தவறு: ') + msg;
      return;
    }
    const answer = data && data.candidates && data.candidates[0] && data.candidates[0].content
      ? data.candidates[0].content.parts.map(p=>p.text).join('')
      : (lang==='en' ? 'No response received.' : 'பதில் கிடைக்கவில்லை.');

    box.innerHTML = `<div class="ai-explain-title">🏗️ AI Project Advisor</div>` + answer.replace(/\n/g, '<br>');
    window._lastAdvisorEstimate = {
      projType, area, floors, quality, extra,
      text: answer,
      time: new Date().toISOString()
    };
    actions.style.display = 'flex';
  } catch(err){
    box.classList.remove('loading');
    box.innerHTML = `<div class="ai-explain-title">🏗️ AI Project Advisor</div>` + (lang==='en' ? 'Network error — check your connection and API key.' : 'நெட்வொர்க் பிழை — உங்கள் இணைப்பு மற்றும் API key-ஐ சரிபார்க்கவும்.');
  }
}

function downloadAdvisorPdf(){
  const est = window._lastAdvisorEstimate;
  if(!est) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 50;
  const frameTop = 118, frameBottom = pageH - 70;
  const genTime = new Date(est.time);
  const refCode = 'ADV-' + String(Date.now()).slice(-6);

  const NAVY = [12, 20, 38];
  const NAVY2 = [22, 33, 58];
  const GOLD = [196, 155, 66];
  const GOLD_DK = [150, 112, 40];
  const CREAM = [246, 239, 220];
  const INK = [32, 34, 46];
  const SUBINK = [92, 98, 116];
  const RULE = [222, 208, 168];

  let pageNum = 1;
  const BIZ = loadBusiness();

  function drawOrnamentDiamond(cx, cy, s, color){
    doc.setFillColor(...color);
    doc.triangle(cx, cy-s, cx-s, cy, cx, cy+s, 'F');
    doc.triangle(cx, cy-s, cx+s, cy, cx, cy+s, 'F');
  }
  function drawFrame(){
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.1);
    doc.rect(18, 18, pageW-36, pageH-36);
    doc.setLineWidth(0.5);
    doc.rect(22, 22, pageW-44, pageH-44);
  }
  function drawHeader(){
    doc.setFillColor(...NAVY);
    doc.rect(18, 18, pageW-36, 92, 'F');
    doc.setFillColor(...NAVY2);
    doc.rect(18, 92, pageW-36, 4, 'F');
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1.2);
    doc.line(marginX, 96, pageW-marginX, 96);
    drawOrnamentDiamond(marginX+4, 46, 5, GOLD);
    doc.setTextColor(...GOLD);
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.text('CIVIL CALCULATOR PRO', marginX+18, 52);
    doc.setTextColor(...CREAM);
    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.text('AI Project Advisor  ·  Rough Estimate', marginX+18, 70);
    doc.setTextColor(...GOLD);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(genTime.toLocaleString(), pageW-marginX, 44, {align:'right'});
    doc.setTextColor(...CREAM);
    doc.text('Ref: ' + refCode, pageW-marginX, 58, {align:'right'});
    if(BIZ && BIZ.name){
      doc.setFont('times', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...GOLD);
      doc.text(BIZ.name + (BIZ.phone ? '  ·  ' + BIZ.phone : ''), marginX+18, 85);
    }
  }
  function drawFooter(){
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.8);
    doc.line(marginX, frameBottom, pageW-marginX, frameBottom);
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...SUBINK);
    doc.text('AI-generated rough estimate — verify with a qualified engineer before ordering material or budgeting.', marginX, frameBottom+16);
    doc.setFont('times', 'bold');
    doc.setTextColor(...GOLD_DK);
    doc.text('Page ' + pageNum, pageW-marginX, frameBottom+16, {align:'right'});
  }
  function newPage(){
    doc.addPage();
    pageNum++;
    drawFrame();
    drawHeader();
    drawFooter();
    return frameTop + 20;
  }
  function ensureSpace(y, needed){
    if(y + needed > frameBottom - 10) return newPage();
    return y;
  }

  drawFrame();
  drawHeader();
  drawFooter();
  let y = frameTop + 30;

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text('PROJECT ESTIMATE SUMMARY', marginX, y);
  y += 24;

  doc.setFillColor(...GOLD);
  doc.rect(marginX, y-11, 4, 14, 'F');
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY2);
  doc.text(pdfSafe(est.projType) + '  ·  ' + est.area + ' sq.ft  ·  ' + est.floors + ' floor(s)  ·  ' + est.quality, marginX+12, y);
  y += 10;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.7);
  doc.line(marginX, y, pageW-marginX, y);
  y += 22;

  if(est.extra){
    doc.setFont('times', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(...SUBINK);
    const extraLines = doc.splitTextToSize(pdfSafe(est.extra), pageW - 2*marginX);
    extraLines.forEach(line=>{
      y = ensureSpace(y, 14);
      doc.text(line, marginX, y);
      y += 13;
    });
    y += 10;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  const bodyText = pdfSafe(est.text);
  const paragraphs = bodyText.split('\n').filter(l=>l.trim().length>0);
  paragraphs.forEach(line=>{
    const wrapped = doc.splitTextToSize(line.trim(), pageW - 2*marginX);
    wrapped.forEach(wl=>{
      y = ensureSpace(y, 17);
      doc.text(wl, marginX, y);
      y += 17;
    });
    y += 3;
  });

  const fileName = 'CivilCalc_ProjectAdvisor_' + Date.now() + '.pdf';
  doc.save(fileName);
}

/* ============== SHARE RESULT AS IMAGE (WhatsApp-ready) ============== */
function wrapCanvasText(ctx, text, maxWidth){
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  words.forEach(w=>{
    const test = cur ? cur + ' ' + w : w;
    if(ctx.measureText(test).width > maxWidth && cur){
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  });
  if(cur) lines.push(cur);
  return lines;
}

function buildResultCanvas(){
  const r = window._lastResult;
  const BIZ = loadBusiness();
  const W = 720;
  const PAD = 36;
  const scale = 2;

  // Measure required height first with a scratch canvas
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = '600 15px Poppins, Arial, sans-serif';
  const wrappedInputs = r.inputs.map(inp=>({label:inp.label, value:inp.value}));
  const mainResults = r.results.filter(res=>res.main);
  const otherResults = r.results.filter(res=>!res.main);

  let h = 0;
  h += 128; // header block (logo + title + calc name)
  h += 14;
  h += wrappedInputs.length * 26 + (wrappedInputs.length ? 20 : 0);
  h += mainResults.length * 74;
  h += otherResults.length * 30 + 14;
  h += 74; // footer

  const H = Math.max(420, h + PAD*2);

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0d1424');
  grad.addColorStop(1, '#0a0f1c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Gold border
  ctx.strokeStyle = '#c49b42';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, W-12, H-12);
  ctx.strokeStyle = 'rgba(196,155,66,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, W-28, H-28);

  let y = PAD + 4;

  // Logo circle
  const logoGrad = ctx.createLinearGradient(PAD, y-18, PAD+36, y+18);
  logoGrad.addColorStop(0, '#ff7a2f');
  logoGrad.addColorStop(1, '#ff9d5c');
  ctx.beginPath();
  ctx.arc(PAD+18, y+2, 20, 0, Math.PI*2);
  ctx.fillStyle = logoGrad;
  ctx.fill();
  ctx.fillStyle = '#0d1424';
  ctx.font = '700 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', PAD+18, y+3);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#ffb454';
  ctx.font = '700 17px Poppins, Arial, sans-serif';
  ctx.fillText('CIVIL CALCULATOR PRO', PAD+48, y+8);
  ctx.fillStyle = '#8b93ab';
  ctx.font = '400 11px Poppins, Arial, sans-serif';
  ctx.fillText(new Date(r.time).toLocaleDateString(), W-PAD-70, y+8);

  y += 44;
  ctx.fillStyle = '#f4f0e6';
  ctx.font = '700 21px Georgia, serif';
  ctx.fillText(r.nameEn, PAD, y);
  y += 22;
  ctx.fillStyle = '#c49b42';
  ctx.font = 'italic 400 13px Georgia, serif';
  ctx.fillText(r.nameTa, PAD, y);
  y += 20;

  ctx.strokeStyle = 'rgba(222,208,168,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W-PAD, y);
  ctx.stroke();
  y += 22;

  // Inputs (compact two-col style rows)
  if(wrappedInputs.length){
    ctx.fillStyle = '#c49b42';
    ctx.font = '700 10px Poppins, Arial, sans-serif';
    ctx.fillText((lang==='en'?'INPUTS':'உள்ளீடுகள்'), PAD, y);
    y += 16;
    wrappedInputs.forEach((inp, i)=>{
      if(i % 2 === 0){
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(PAD-8, y-15, W-2*PAD+16, 24);
      }
      ctx.fillStyle = '#8b93ab';
      ctx.font = '400 12.5px Poppins, Arial, sans-serif';
      ctx.fillText(String(inp.label), PAD, y);
      ctx.fillStyle = '#e8ecf5';
      ctx.font = '700 12.5px Poppins, Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(inp.value), W-PAD, y);
      ctx.textAlign = 'left';
      y += 26;
    });
    y += 6;
  }

  // Main highlighted results
  mainResults.forEach(res=>{
    const boxH = 60;
    const rg = ctx.createLinearGradient(PAD, y, W-PAD, y);
    rg.addColorStop(0, '#ff7a2f');
    rg.addColorStop(1, '#ff9d5c');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(PAD, y, W-2*PAD, boxH, 12) : ctx.rect(PAD, y, W-2*PAD, boxH);
    ctx.fill();

    ctx.fillStyle = '#0d1424';
    ctx.font = '700 13px Poppins, Arial, sans-serif';
    ctx.fillText(String(res.label).toUpperCase(), PAD+20, y+24);
    ctx.font = '700 26px Poppins, Arial, sans-serif';
    ctx.fillText(String(res.value), PAD+20, y+48);

    y += boxH + 14;
  });

  // Other results
  otherResults.forEach((res, i)=>{
    if(i % 2 === 0){
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(PAD-8, y-15, W-2*PAD+16, 24);
    }
    ctx.fillStyle = '#8b93ab';
    ctx.font = '400 13px Poppins, Arial, sans-serif';
    ctx.fillText(String(res.label), PAD, y);
    ctx.fillStyle = '#3ddc97';
    ctx.font = '700 13px Poppins, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(res.value), W-PAD, y);
    ctx.textAlign = 'left';
    y += 28;
  });

  y += 10;
  ctx.strokeStyle = 'rgba(196,155,66,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W-PAD, y);
  ctx.stroke();
  y += 24;

  ctx.fillStyle = '#6d7893';
  ctx.font = 'italic 400 10.5px Poppins, Arial, sans-serif';
  const noteLines = wrapCanvasText(ctx, lang==='en'
    ? 'Estimates are approximate — verify on site before ordering material.'
    : 'இது ஒரு தோராயமான மதிப்பீடு — பொருள் ஆர்டர் செய்யும் முன் தளத்தில் சரிபார்க்கவும்.', W-2*PAD);
  noteLines.forEach(line=>{ ctx.fillText(line, PAD, y); y += 14; });

  if(BIZ && BIZ.name){
    ctx.fillStyle = '#c49b42';
    ctx.font = '700 11px Poppins, Arial, sans-serif';
    ctx.fillText(BIZ.name + (BIZ.phone ? '  ·  ' + BIZ.phone : ''), PAD, y+6);
  }

  return canvas;
}

async function shareResultImage(){
  if(!window._lastResult) return;
  const btn = document.getElementById('shareImgBtn');
  const origText = btn ? btn.textContent : '';
  if(btn) btn.textContent = lang==='en' ? '⏳ Preparing...' : '⏳ தயார் செய்கிறேன்...';

  try{
    const canvas = buildResultCanvas();
    canvas.toBlob(async (blob)=>{
      if(btn) btn.textContent = origText;
      if(!blob) return;
      const fileName = 'CivilCalc_' + (window._lastResult.calcId||'result') + '_' + Date.now() + '.png';
      const file = new File([blob], fileName, {type:'image/png'});

      if(navigator.canShare && navigator.canShare({files:[file]})){
        try{
          await navigator.share({
            files: [file],
            title: window._lastResult.name,
            text: (lang==='en' ? 'Civil Calculator Pro result: ' : 'Civil Calculator Pro முடிவு: ') + window._lastResult.name
          });
          return;
        } catch(shareErr){
          // user cancelled or share failed — fall through to download
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(lang==='en'
        ? 'Image saved! Open WhatsApp and attach it from your gallery/downloads.'
        : 'படம் save ஆயிடுச்சு! WhatsApp திறந்து, gallery/downloads-இல் இருந்து attach செய்யவும்.');
    }, 'image/png');
  } catch(err){
    if(btn) btn.textContent = origText;
    alert(lang==='en' ? 'Could not create image. Please try again.' : 'படத்தை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
  }
}

/* ============== INIT ============== */
document.getElementById('langBtnEn').addEventListener('click', ()=>setLang('en'));
document.getElementById('langBtnTa').addEventListener('click', ()=>setLang('ta'));
document.getElementById('historyToggle').addEventListener('click', openHistory);
document.getElementById('calcOverlay').addEventListener('click', (e)=>{ if(e.target.id==='calcOverlay') closeCalc(); });
document.getElementById('settingsOverlay').addEventListener('click', (e)=>{ if(e.target.id==='settingsOverlay') closeSettings(); });
document.getElementById('advisorOverlay').addEventListener('click', (e)=>{ if(e.target.id==='advisorOverlay') closeAdvisor(); });
document.getElementById('historyOverlay').addEventListener('click', (e)=>{ if(e.target.id==='historyOverlay') closeHistory(); });
document.getElementById('aiFab').addEventListener('click', openAi);
document.getElementById('aiOverlay').addEventListener('click', (e)=>{ if(e.target.id==='aiOverlay') closeAi(); });

renderRail();
renderGrid();
