(() => {
  "use strict";

  // ========= DATA (správné) =========
  const data = [
    ["10-0","Vizuální kontakt ztracen"],
    ["10-1","Změňte frekvenci"],
    ["10-3","Ticho na vysílačce"],
    ["10-4","Ok, rozumím"],
    ["10-5","Přestávka"],
    ["10-6","Zaneprázdněný"],
    ["10-7","Mimo službu"],
    ["10-8","Ve službě"],
    ["10-9","Opakujte hlášení"],
    ["10-10","Napadení"],

    ["10-11","Traffic stop"],
    ["10-12","Samostatná jízda"],
    ["10-13","Střelba"],
    ["10-14","Prodej drog"],
    ["10-15","Převážení vězně směr Policejní stanice"],
    ["10-16","Krádež vozidla"],
    ["10-17","Podezřelá osoba"],
    ["10-18","Trespassing"],
    ["10-20","Lokace"],

    ["10-22","Ignorujte příkaz"],
    ["10-23","Dorazil na místo, ke scéně"],
    ["10-27","Kontrola řidičského průkazu"],
    ["10-28","Kontrola registrační značky"],
    ["10-29","Zkontrolujte, zda je osoba hledaná"],

    ["10-30","Hledaná osoba"],
    ["10-32","Je potřeba asistence"],
    ["10-35","Rozpustit perimetr"],

    ["10-41","Zahájení patroly"],
    ["10-42","Ukončení patroly"],
    ["10-43","Podejte informace"],
    ["10-44","Osoba zemřela"],

    ["10-50","Dopravní nehoda"],
    ["10-51","Potřebuju odtahovou službu"],
    ["10-52","Potřebuji záchranku"],
    ["10-53","Potřebuji fire department"],

    ["10-60","Únos"],
    ["10-62","Únos"],
    ["10-65","Převoz vězně směr věznice"],
    ["10-66","Bezohledný řidič"],
    ["10-68","Ozbrojená loupež"],

    ["10-70","Pěší nahánění - Suspect uniká"],
    ["10-71","Dozor na scénu"],

    ["10-80","Ujíždění hlídce"],

    ["10-90","Vykrádání bankomatu"],
    ["10-95","Suspect in custody (suspect zadržen)"],
    ["10-97","Na cestě"],
    ["10-98","Pokračuji v hlídce"],
    ["10-99","Officer v nouzi"],

    ["Kód-1","Bez majáku bez sirén"],
    ["Kód-2","Majáky (křížovatka prohouknout, zpomalit)"],
    ["Kód-3","Majáky sirény (křižovatka zpomalit)"],
    ["Kód-4","Situace pod kontrolou"],
    ["Kód-5","Felony stop"],
    ["Kód-6","Dorazil na místo, zahajuji vyšetřování"],
    ["Kód-7","Marked hlídky se vyhnou scéně"],
    ["Kód-10","Předvolání SWAT/SRT teamu"],
    ["Kód-12","Falešný poplach"],
  ];

  const sepIndex = data.findIndex(([c]) => String(c).startsWith("Kód-"));
  const codeToMeaning = new Map(data.map(([c,m]) => [c,m]));
  const allMeanings = data.map(x => x[1]);
  const allCodes = data.map(x => x[0]);

  const $ = (id) => document.getElementById(id);
  const now = () => Date.now();
  const clamp = (x,a,b) => Math.max(a, Math.min(b, x));
  const shuffle = (arr) => {
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  };
  const is10 = (code) => String(code).startsWith("10-");
  const isState = (code) => String(code).startsWith("Kód-");

  // ========= category (scénáře/report) =========
  function categoryOf(code, meaning){
    const m = (meaning||"").toLowerCase();
    const traffic = ["traffic","doprav","odtah","řidič","průkaz","registra","značk","bezohled"];
    const violence = ["střelb","únos","loupež","napaden","ozbrojen","v nouzi","smrt","zemř","bankomat"];
    const admin = ["rozum","opak","ticho","frekv","lokace","inform","patrol","perimetr","kontrol","hledan","trespass","podezřel","dorazil","na cestě","pokračuji"];
    if(traffic.some(w=>m.includes(w))) return "Dopravní";
    if(violence.some(w=>m.includes(w))) return "Násilné";
    if(admin.some(w=>m.includes(w))) return "Komunikace/Administrativa";
    if(isState(code)) return "Kódové stavy";
    return "Ostatní";
  }

  // ========= LocalStorage =========
  const LS_RATING  = "lspd_ratingByCode_v6";   // p|l|v|null
  const LS_MASTERY = "lspd_masteryByCode_v6";  // true|false|null
  const LS_STATS   = "lspd_statsByCode_v6";    // per-code stats

  const loadObj = (key) => { try{ const r=localStorage.getItem(key); return r?JSON.parse(r):null; }catch{ return null; } };
  const saveObj = (key, obj) => localStorage.setItem(key, JSON.stringify(obj));
  const defaultStats = () => ({ correct:0, wrong:0, total:0, streak:0, lastWrongTs:0, lastSeenTs:0, avgRtMs:0 });

  const ratingByCode = new Map();
  const masteryByCode = new Map();
  const statsByCode = new Map();

  const savedRatings = loadObj(LS_RATING) || {};
  const savedMastery = loadObj(LS_MASTERY) || {};
  const savedStats   = loadObj(LS_STATS) || {};

  for(const [code] of data){
    const r = (code in savedRatings) ? savedRatings[code] : null;
    ratingByCode.set(code, (r==="p"||r==="l"||r==="v") ? r : null);

    const m = (code in savedMastery) ? savedMastery[code] : null;
    masteryByCode.set(code, (m===true||m===false) ? m : null);

    const s = (code in savedStats) ? savedStats[code] : null;
    statsByCode.set(code, (s && typeof s === "object") ? {...defaultStats(), ...s} : defaultStats());
  }

  function saveAll(){
    const rObj={}, mObj={}, sObj={};
    for(const [code] of data){
      rObj[code]=ratingByCode.get(code);
      mObj[code]=masteryByCode.get(code);
      sObj[code]=statsByCode.get(code);
    }
    saveObj(LS_RATING, rObj);
    saveObj(LS_MASTERY, mObj);
    saveObj(LS_STATS, sObj);
  }

  // ========= NAV =========
  const tabStudy = $("tabStudy"), tabTest = $("tabTest");
  const panelStudy = $("panelStudy"), panelTest = $("panelTest");

  function show(which){
    const study = which === "study";
    tabStudy.classList.toggle("active", study);
    tabTest.classList.toggle("active", !study);
    panelStudy.classList.toggle("active", study);
    panelTest.classList.toggle("active", !study);
    if(!study) buildTestFromFilters();
  }
  tabStudy.addEventListener("click", ()=>show("study"));
  tabTest.addEventListener("click", ()=>show("test"));

  // ========= STUDY =========
  const studyList = $("studyList");
  const studySearch = $("studySearch");
  const btnReveal2s = $("btnReveal2s");
  const btnResetAll = $("btnResetAll");

  const rowElByCode = new Map();
  const masteryEls = new Map();
  const radioByCode = new Map();

  function setMasteryUI(code, value){
    const el = masteryEls.get(code);
    if(!el) return;
    el.badgeEl.classList.remove("ok","bad","unk");
    if(value === true){
      el.badgeEl.classList.add("ok"); el.textEl.textContent="UMÍ";
    } else if(value === false){
      el.badgeEl.classList.add("bad"); el.textEl.textContent="NEUMÍ";
    } else {
      el.badgeEl.classList.add("unk"); el.textEl.textContent="NEZNÁM";
    }
  }

  function setMastery(code, value){
    masteryByCode.set(code, value);
    setMasteryUI(code, value);
    saveAll();
    recountStudy();
    buildHeatmap();
    refreshChipDisables();
  }

  function recountStudy(){
    let p=0,l=0,v=0;
    for(const r of ratingByCode.values()){
      if(r==="p") p++; else if(r==="l") l++; else if(r==="v") v++;
    }
    $("p").textContent = p;
    $("l").textContent = l;
    $("v").textContent = v;

    let u=0,n=0,k=0;
    for(const m of masteryByCode.values()){
      if(m===true) u++; else if(m===false) n++; else k++;
    }
    $("uCnt").textContent = u;
    $("nCnt").textContent = n;
    $("kCnt").textContent = k;
  }

  function renderStudy(){
    studyList.innerHTML="";
    rowElByCode.clear(); masteryEls.clear(); radioByCode.clear();
    let idxRow = 0;

    data.forEach(([code, meaning], idx)=>{
      if(idx === sepIndex && sepIndex !== -1){
        const sep = document.createElement("div");
        sep.className="sep";
        sep.textContent="Kódové stavy";
        studyList.appendChild(sep);
      }

      const row = document.createElement("div");
      row.className="row";
      row.dataset.code = code;
      const name = `rate_${idxRow++}`;

      row.innerHTML = `
        <div class="codeCell">
          <div class="code">${code}</div>
          <div class="mastery unk" data-code="${code}">
            <span class="dot"></span>
            <span class="mText">NEZNÁM</span>
          </div>
        </div>

        <div class="meaningCell" title="Hover = odhalit">
          <span class="hidden">${meaning}</span>
        </div>

        <div class="cell"><input type="radio" name="${name}" value="p"></div>
        <div class="cell"><input type="radio" name="${name}" value="l"></div>
        <div class="cell"><input type="radio" name="${name}" value="v"></div>
      `;

      rowElByCode.set(code, row);

      // hover (velký hitbox)
      const cell = row.querySelector(".meaningCell");
      const txt = row.querySelector(".hidden");
      cell.addEventListener("mouseenter", ()=>txt.classList.add("visible"));
      cell.addEventListener("mouseleave", ()=>txt.classList.remove("visible"));

      // mastery badge
      const badge = row.querySelector(`.mastery[data-code="${code}"]`);
      const mText = badge.querySelector(".mText");
      masteryEls.set(code, { badgeEl: badge, textEl: mText });
      setMasteryUI(code, masteryByCode.get(code));

      // rating radios
      const inputs = [...row.querySelectorAll(`input[name="${name}"]`)];
      const pInp = inputs.find(x=>x.value==="p");
      const lInp = inputs.find(x=>x.value==="l");
      const vInp = inputs.find(x=>x.value==="v");
      radioByCode.set(code, {p:pInp,l:lInp,v:vInp});
      const curR = ratingByCode.get(code);
      if(curR==="p") pInp.checked=true;
      else if(curR==="l") lInp.checked=true;
      else if(curR==="v") vInp.checked=true;

      inputs.forEach(inp=>{
        inp.addEventListener("change", ()=>{
          ratingByCode.set(code, inp.value);
          saveAll();
          recountStudy();
          refreshChipDisables();
          if(panelTest.classList.contains("active")) buildTestFromFilters();
        });
      });

      studyList.appendChild(row);
    });

    recountStudy();
  }
  renderStudy();

  function applyStudySearch(){
    const q = (studySearch.value||"").trim().toLowerCase();
    for(const [code, meaning] of data){
      const row = rowElByCode.get(code);
      if(!row) continue;
      if(!q){ row.style.display=""; continue; }
      const hit = code.toLowerCase().includes(q) || meaning.toLowerCase().includes(q);
      row.style.display = hit ? "" : "none";
    }
  }
  studySearch.addEventListener("input", applyStudySearch);

  btnReveal2s.addEventListener("click", ()=>{
    const spans = [...document.querySelectorAll("#studyList .hidden")];
    spans.forEach(s=>s.classList.add("visible"));
    setTimeout(()=>spans.forEach(s=>s.classList.remove("visible")), 2000);
  });

  btnResetAll.addEventListener("click", ()=>{
    localStorage.removeItem(LS_RATING);
    localStorage.removeItem(LS_MASTERY);
    localStorage.removeItem(LS_STATS);
    for(const [code] of data){
      ratingByCode.set(code, null);
      masteryByCode.set(code, null);
      statsByCode.set(code, defaultStats());
    }
    renderStudy();
    buildHeatmap();
    refreshChipDisables();
    buildTestFromFilters();
  });

  // ========= HEATMAP =========
  const heatGrid = $("heatGrid");
  function errorRate(code){
    const s = statsByCode.get(code) || defaultStats();
    return s.total ? (s.wrong / s.total) : 0;
  }
  function heatColor(rate){
    const r = Math.round(87 + (255-87)*rate);
    const g = Math.round(255 + (107-255)*rate);
    const b = Math.round(154 + (107-154)*rate);
    return `rgba(${r},${g},${b},.18)`;
  }
  function buildHeatmap(){
    heatGrid.innerHTML="";
    for(const [code] of data){
      const s = statsByCode.get(code) || defaultStats();
      const pill = document.createElement("div");
      pill.className="heatPill";
      pill.style.background = heatColor(errorRate(code));
      pill.innerHTML = `${code}<small>${s.wrong}/${s.total}</small>`;
      pill.addEventListener("click", ()=>{
        const row = rowElByCode.get(code);
        if(row){
          row.scrollIntoView({behavior:"smooth", block:"center"});
          row.style.outline = "2px solid rgba(120,166,255,.45)";
          row.style.outlineOffset = "2px";
          setTimeout(()=>{ row.style.outline=""; row.style.outlineOffset=""; }, 900);
        }
      });
      heatGrid.appendChild(pill);
    }
  }
  buildHeatmap();

  // ========= POP QUIZ (idle overlay) =========
  const overlay = $("overlay");
  const overlayBody = $("overlayBody");
  const btnCloseOverlay = $("btnCloseOverlay");

  let lastUserActivityTs = now();
  ["mousemove","keydown","scroll","click","touchstart"].forEach(evt=>{
    window.addEventListener(evt, ()=>{ lastUserActivityTs = now(); }, {passive:true});
  });

  function closePopQuiz(){
    overlay.classList.remove("on");
    overlay.setAttribute("aria-hidden","true");
    overlayBody.innerHTML="";
  }
  btnCloseOverlay.addEventListener("click", closePopQuiz);

  function makeOptionsMeaning(correct){
    const pool = allMeanings.filter(x=>x!==correct);
    const d=[];
    while(d.length<3 && pool.length){
      const pick = pool[Math.floor(Math.random()*pool.length)];
      if(!d.includes(pick)) d.push(pick);
    }
    const opts = shuffle([correct, ...d]);
    return { opts, correctIndex: opts.indexOf(correct) };
  }
  function makeOptionsCode(correct){
    const pool = allCodes.filter(x=>x!==correct);
    const d=[];
    while(d.length<3 && pool.length){
      const pick = pool[Math.floor(Math.random()*pool.length)];
      if(!d.includes(pick)) d.push(pick);
    }
    const opts = shuffle([correct, ...d]);
    return { opts, correctIndex: opts.indexOf(correct) };
  }

  function bumpStats(code, ok, rtMs){
    const s = statsByCode.get(code) || defaultStats();
    s.total = (s.total||0)+1;
    s.lastSeenTs = now();
    if(ok){
      s.correct = (s.correct||0)+1;
      s.streak = (s.streak||0)+1;
    }else{
      s.wrong = (s.wrong||0)+1;
      s.streak = 0;
      s.lastWrongTs = now();
    }
    if(rtMs && rtMs>0){
      const prevAvg = s.avgRtMs || 0;
      const prevN = s.total - 1;
      s.avgRtMs = Math.round((prevAvg*prevN + rtMs)/s.total);
    }
    statsByCode.set(code, s);
    saveAll();
    buildHeatmap();
  }

  function openPopQuiz(){
    if(!panelStudy.classList.contains("active")) return;
    if(overlay.classList.contains("on")) return;

    const bag=[];
    for(const [code, meaning] of data){
      const s = statsByCode.get(code) || defaultStats();
      const m = masteryByCode.get(code);
      let w = 1 + Math.min(6, s.wrong);
      if(m===null) w+=2;
      if(m===false) w+=3;
      for(let i=0;i<w;i++) bag.push({code, meaning});
    }
    const pick = bag[Math.floor(Math.random()*bag.length)];
    if(!pick) return;

    const dir = Math.random()<0.6 ? "code2meaning" : "meaning2code";
    const letters = ["A","B","C","D"];

    let opts=[], correctIndex=0;
    let top="";

    if(dir==="code2meaning"){
      top = `<div class="qCode" style="font-size:30px;margin:6px 0 4px;">${pick.code}</div>
             <div class="qPrompt">Vyber správný význam</div>`;
      ({opts, correctIndex} = makeOptionsMeaning(pick.meaning));
    }else{
      top = `<div class="qCode" style="font-size:18px;margin:6px 0 4px;letter-spacing:.2px;">${pick.meaning}</div>
             <div class="qPrompt">Vyber správný kód</div>`;
      ({opts, correctIndex} = makeOptionsCode(pick.code));
    }

    overlayBody.innerHTML = `
      <div class="qBox" style="margin:0;">
        ${top}
        <div class="opts" id="ovOpts"></div>
        <div class="feedback" id="ovFb"></div>
      </div>
    `;
    const ovOpts = overlayBody.querySelector("#ovOpts");
    const ovFb = overlayBody.querySelector("#ovFb");

    let locked=false;
    const start=now();

    opts.forEach((t,i)=>{
      const b=document.createElement("div");
      b.className="optBtn";
      b.innerHTML=`<div class="letter">${letters[i]}</div><div class="optText">${t}</div>`;
      b.addEventListener("click", ()=>{
        if(locked) return;
        locked=true;

        const rt = now()-start;
        const ok = (i===correctIndex);

        bumpStats(pick.code, ok, rt);
        setMastery(pick.code, ok);

        [...ovOpts.querySelectorAll(".optBtn")].forEach((bb,idx)=>{
          if(idx===correctIndex) bb.classList.add("correct");
          if(idx===i && !ok) bb.classList.add("wrong");
        });

        ovFb.textContent = ok ? "Správně ✅" : "Špatně ❌";
        ovFb.className = "feedback " + (ok ? "ok" : "bad");
        setTimeout(closePopQuiz, 650);
      });
      ovOpts.appendChild(b);
    });

    overlay.classList.add("on");
    overlay.setAttribute("aria-hidden","false");
  }

  setInterval(()=>{
    if(!panelStudy.classList.contains("active")) return;
    if(overlay.classList.contains("on")) return;
    const idle = now() - lastUserActivityTs;
    if(idle > 25000){
      lastUserActivityTs = now();
      openPopQuiz();
    }
  }, 1000);

  // ======= TADY KONČÍ 1/3 =======
  // (Další část obsahuje: chips/filtry + test engine + report + graf)

  // ========= TEST UI =========
  const selMode = $("selMode"), selDir = $("selDir"), selScenario = $("selScenario"), selTimer = $("selTimer");
  const cbWeakOnly = $("cbWeakOnly"), cbAdaptive = $("cbAdaptive"), cbStress = $("cbStress"), cbSRS = $("cbSRS"), cbFlip = $("cbFlip");
  const btnRestart = $("btnRestart"), btnNext = $("btnNext");
  const chipAll = $("chipAll"), chipP = $("chipP"), chipL = $("chipL"), chipV = $("chipV");
  const chipKnow = $("chipKnow"), chipDont = $("chipDont"), chipUnk = $("chipUnk");
  const chip10 = $("chip10"), chipState = $("chipState");
  const qNum = $("qNum"), qTotal = $("qTotal"), scoreOk = $("scoreOk"), scoreAll = $("scoreAll"), rtAvg = $("rtAvg");
  const bar = $("bar"), testArea = $("testArea");

  // ===== Filter state =====
  const filter = { all:true, p:false, l:true, v:true };
  const mFilter = { know:true, dont:true, unk:true };
  const tFilter = { ten:true, state:true };

  const setChip = (el,on)=>el.classList.toggle("on", !!on);
  const setDisabled=(el,dis)=>el.classList.toggle("disabled", !!dis);

  function refreshChipUI(){
    setChip(chipAll, filter.all);
    setChip(chipP, filter.p);
    setChip(chipL, filter.l);
    setChip(chipV, filter.v);
    setChip(chipKnow, mFilter.know);
    setChip(chipDont, mFilter.dont);
    setChip(chipUnk, mFilter.unk);
    setChip(chip10, tFilter.ten);
    setChip(chipState, tFilter.state);
  }

  function matchFilters(code){
    // type group
    if(is10(code) && !tFilter.ten) return false;
    if(isState(code) && !tFilter.state) return false;

    // rating group
    const r = ratingByCode.get(code); // p/l/v/null
    const ratingOk =
      filter.all ||
      (filter.p && r==="p") ||
      (filter.l && r==="l") ||
      (filter.v && r==="v");
    if(!ratingOk) return false;

    // mastery group
    const m = masteryByCode.get(code); // true/false/null
    const masteryOk =
      (m===true && mFilter.know) ||
      (m===false && mFilter.dont) ||
      (m===null && mFilter.unk);
    if(!masteryOk) return false;

    return true;
  }

  function poolFromFilters(){
    let pool = data.filter(([code]) => matchFilters(code));

    // weak-only (19)
    if(cbWeakOnly.checked){
      pool = pool.filter(([code])=>{
        const s = statsByCode.get(code) || defaultStats();
        const m = masteryByCode.get(code);
        const rate = errorRate(code);
        return (m===null) || (m===false) || (s.total<2) || (rate>=0.35);
      });
    }
    return pool;
  }

  function refreshChipDisables(){
    // disable chip if it would produce empty pool
    const simulate = (mutator, el) => {
      const snap = { f:{...filter}, m:{...mFilter}, t:{...tFilter} };
      mutator();
      const cnt = data.filter(([code])=>matchFilters(code)).length;
      Object.assign(filter, snap.f);
      Object.assign(mFilter, snap.m);
      Object.assign(tFilter, snap.t);
      setDisabled(el, cnt===0);
    };

    simulate(()=>{ // P
      if(filter.all){ filter.all=false; filter.p=true; filter.l=false; filter.v=false; }
      else filter.p=!filter.p;
      if(!filter.p && !filter.l && !filter.v) filter.all=true;
    }, chipP);

    simulate(()=>{ // L
      if(filter.all){ filter.all=false; filter.p=false; filter.l=true; filter.v=false; }
      else filter.l=!filter.l;
      if(!filter.p && !filter.l && !filter.v) filter.all=true;
    }, chipL);

    simulate(()=>{ // V
      if(filter.all){ filter.all=false; filter.p=false; filter.l=false; filter.v=true; }
      else filter.v=!filter.v;
      if(!filter.p && !filter.l && !filter.v) filter.all=true;
    }, chipV);

    simulate(()=>{ mFilter.know=!mFilter.know; if(!mFilter.know&&!mFilter.dont&&!mFilter.unk) mFilter.know=true; }, chipKnow);
    simulate(()=>{ mFilter.dont=!mFilter.dont; if(!mFilter.know&&!mFilter.dont&&!mFilter.unk) mFilter.dont=true; }, chipDont);
    simulate(()=>{ mFilter.unk=!mFilter.unk; if(!mFilter.know&&!mFilter.dont&&!mFilter.unk) mFilter.unk=true; }, chipUnk);

    simulate(()=>{ tFilter.ten=!tFilter.ten; if(!tFilter.ten && !tFilter.state) tFilter.ten=true; }, chip10);
    simulate(()=>{ tFilter.state=!tFilter.state; if(!tFilter.ten && !tFilter.state) tFilter.state=true; }, chipState);

    setDisabled(chipAll, false);
  }

  function clickAll(){
    if(chipAll.classList.contains("disabled")) return;
    filter.all=true; filter.p=false; filter.l=false; filter.v=false;
    refreshChipUI(); refreshChipDisables(); buildTestFromFilters();
  }
  function clickRating(which){
    const el = which==="p"?chipP:which==="l"?chipL:chipV;
    if(el.classList.contains("disabled")) return;

    if(filter.all){
      filter.all=false;
      filter.p = which==="p";
      filter.l = which==="l";
      filter.v = which==="v";
    }else{
      filter[which]=!filter[which];
      if(!filter.p && !filter.l && !filter.v) filter.all=true;
    }
    refreshChipUI(); refreshChipDisables(); buildTestFromFilters();
  }
  function clickMastery(which){
    const el = which==="know"?chipKnow:which==="dont"?chipDont:chipUnk;
    if(el.classList.contains("disabled")) return;
    mFilter[which]=!mFilter[which];
    if(!mFilter.know && !mFilter.dont && !mFilter.unk) mFilter[which]=true;
    refreshChipUI(); refreshChipDisables(); buildTestFromFilters();
  }
  function clickType(which){
    const el = which==="ten"?chip10:chipState;
    if(el.classList.contains("disabled")) return;
    tFilter[which]=!tFilter[which];
    if(!tFilter.ten && !tFilter.state) tFilter[which]=true;
    refreshChipUI(); refreshChipDisables(); buildTestFromFilters();
  }

  chipAll.addEventListener("click", clickAll);
  chipP.addEventListener("click", ()=>clickRating("p"));
  chipL.addEventListener("click", ()=>clickRating("l"));
  chipV.addEventListener("click", ()=>clickRating("v"));

  chipKnow.addEventListener("click", ()=>clickMastery("know"));
  chipDont.addEventListener("click", ()=>clickMastery("dont"));
  chipUnk.addEventListener("click", ()=>clickMastery("unk"));

  chip10.addEventListener("click", ()=>clickType("ten"));
  chipState.addEventListener("click", ()=>clickType("state"));

  [selMode, selDir, selScenario, selTimer, cbWeakOnly, cbAdaptive, cbStress, cbSRS, cbFlip]
    .forEach(el => el.addEventListener("change", ()=>buildTestFromFilters()));

  btnRestart.addEventListener("click", ()=>buildTestFromFilters());

  // ========= TEST ENGINE =========
  let pool = [];             // [{code, meaning}]
  let queue = [];            // current queue
  let srsQueue = [];         // repeats
  let cur = null;            // {code, meaning, dir}
  let curAnswered = false;
  let curStartTs = 0;
  let curTimerMs = 0;
  let timerTick = null;
  let timerBarEl = null;

  let asked = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let rtSum = 0;
  let rtN = 0;

  let session = null; // {items:[{code, ok, rt, autoWrong, skipped}]}

  function mode(){ return selMode.value; }

  function effectiveDirection(){
    if(cbFlip.checked){
      return (asked % 2 === 0) ? "code2meaning" : "meaning2code";
    }
    return selDir.value;
  }

  function scenarioText(code, meaning){
    const cat = categoryOf(code, meaning);
    if(selScenario.value === "plain") return "";
    if(selScenario.value === "scenario"){
      if(cat === "Dopravní") return "Situace: dopravní incident – vyber správné hlášení.";
      if(cat === "Násilné") return "Situace: krizová událost – vyber správné hlášení.";
      if(cat === "Kódové stavy") return "Situace: měníš režim hlídky – vyber správné označení.";
      return "Situace: rádio provoz – vyber správné hlášení.";
    }
    return `Rádio: „Dispatch, potvrď ${is10(code) ? "10-code" : "kód"}.“`;
  }

  function adaptiveWeight(code){
    const s = statsByCode.get(code) || defaultStats();
    const m = masteryByCode.get(code);
    const rate = errorRate(code);
    let w = 1;
    if(cbAdaptive.checked){
      w += Math.min(6, s.wrong);
      w += Math.round(rate * 6);
      if(m === null) w += 2;
      if(m === false) w += 3;
      if(s.total < 2) w += 2;
    }
    return clamp(w, 1, 18);
  }

  function buildQueueFromPool(basePool){
    const bag = [];
    for(const [code, meaning] of basePool){
      const w = adaptiveWeight(code);
      for(let i=0;i<w;i++) bag.push({code, meaning});
    }
    // create queue by drawing unique-ish
    const out = [];
    const used = new Set();
    for(let i=0;i<Math.min(160, bag.length);i++){
      const pick = bag[Math.floor(Math.random()*bag.length)];
      if(!pick) continue;
      // allow repeats, but try to spread
      const key = pick.code + "|" + Math.floor(i/4);
      if(used.has(key)) continue;
      used.add(key);
      out.push(pick);
    }
    return shuffle(out.length?out:basePool.map(([code,meaning])=>({code,meaning})));
  }

  function resetSession(){
    asked=0; correct=0; wrong=0; skipped=0; rtSum=0; rtN=0;
    session = { items: [] };
    srsQueue = [];
    cur = null;
    curAnswered = false;
    stopTimer();
  }

  function updateTopBar(){
    qNum.textContent = String(asked);
    scoreOk.textContent = String(correct);
    scoreAll.textContent = String(correct+wrong+skipped);
    rtAvg.textContent = rtN ? `${Math.round(rtSum/rtN)} ms` : "–";

    const total = Number(qTotal.textContent)||0;
    const pct = total ? (asked/total)*100 : 0;
    bar.style.width = `${clamp(pct,0,100)}%`;
  }

  function startTimerIfNeeded(){
    stopTimer();
    const v = selTimer.value;
    if(v === "off") return;

    curTimerMs = Number(v) * 1000;
    // create a timer bar inside question
    const wrap = document.querySelector(".timerWrap");
    timerBarEl = wrap ? wrap.querySelector(".timerFill") : null;
    const start = now();

    timerTick = setInterval(()=>{
      const elapsed = now() - start;
      const left = clamp(curTimerMs - elapsed, 0, curTimerMs);
      const frac = curTimerMs ? (left/curTimerMs) : 0;
      if(timerBarEl) timerBarEl.style.width = `${Math.round(frac*100)}%`;

      if(left <= 0){
        stopTimer();
        // if not answered -> auto wrong
        if(!curAnswered){
          answer(null, true, true); // null choice, autoWrong=true, timedOut=true
        }
      }
    }, 50);
  }

  function stopTimer(){
    if(timerTick){ clearInterval(timerTick); timerTick=null; }
    timerBarEl = null;
  }

  function makeOptions(dir, code, meaning){
    const letters = ["A","B","C","D"];
    if(dir === "code2meaning"){
      const correctText = meaning;
      const pool = allMeanings.filter(x=>x !== correctText);
      const d=[];
      while(d.length<3 && pool.length){
        const pick = pool[Math.floor(Math.random()*pool.length)];
        if(!d.includes(pick)) d.push(pick);
      }
      const opts = shuffle([correctText, ...d]);
      return { letters, opts, correctIndex: opts.indexOf(correctText) };
    } else {
      const correctText = code;
      const pool = allCodes.filter(x=>x !== correctText);
      const d=[];
      while(d.length<3 && pool.length){
        const pick = pool[Math.floor(Math.random()*pool.length)];
        if(!d.includes(pick)) d.push(pick);
      }
      const opts = shuffle([correctText, ...d]);
      return { letters, opts, correctIndex: opts.indexOf(correctText) };
    }
  }

  function shouldAutoNext(){
    // learning/speed -> auto next after answer
    return (mode()==="learning" || mode()==="speed");
  }

  function nextQuestion(){
    // exam: exactly 20
    const exam = (mode()==="exam");
    const limit = exam ? 20 : Infinity;

    if(asked >= limit){
      endReport();
      return;
    }

    // pick from SRS (repeat wrong)
    let pick = null;
    if(cbSRS.checked && srsQueue.length){
      // bring it back after few steps
      if(asked % 3 === 0){
        pick = srsQueue.shift();
      }
    }
    if(!pick){
      if(queue.length === 0){
        // rebuild queue from pool
        queue = buildQueueFromPool(pool.map(x=>[x.code,x.meaning]));
      }
      pick = queue.shift();
    }

    if(!pick){
      endReport();
      return;
    }

    const dir = effectiveDirection();
    cur = { code: pick.code, meaning: pick.meaning, dir };
    curAnswered = false;
    curStartTs = now();

    renderQuestion();
    startTimerIfNeeded();
  }

  function renderQuestion(){
    const {code, meaning, dir} = cur;
    const sc = scenarioText(code, meaning);
    const {letters, opts, correctIndex} = makeOptions(dir, code, meaning);

    const main = (dir==="code2meaning")
      ? `<div class="qCode">${code}</div><div class="qPrompt">${sc || "Vyber správný význam"}</div>`
      : `<div class="qCode" style="font-size:18px;letter-spacing:.2px;">${meaning}</div><div class="qPrompt">${sc || "Vyber správný kód"}</div>`;

    // stress class (15)
    document.body.classList.toggle("stressLow", !!cbStress.checked);

    testArea.innerHTML = `
      <div class="qBox">
        ${main}
        <div class="timerWrap" style="${selTimer.value==="off" ? "display:none" : ""}">
          <div class="timerFill"></div>
        </div>
        <div class="opts" id="opts"></div>
        <div class="feedback" id="fb"></div>
      </div>
    `;

    const optsEl = $("opts");
    const fb = $("fb");
    let locked=false;

    opts.forEach((text, i)=>{
      const b = document.createElement("div");
      b.className="optBtn";
      b.innerHTML = `<div class="letter">${letters[i]}</div><div class="optText">${text}</div>`;
      b.addEventListener("click", ()=>{
        if(locked) return;
        locked=true;
        answer(i, false, false, {opts, correctIndex, dir, fb, optsEl});
      });
      optsEl.appendChild(b);
    });

    // store current correctIndex on element for "Next auto wrong" case
    testArea.dataset.correctIndex = String(correctIndex);
    testArea.dataset.dir = dir;
    testArea.dataset.code = code;
    testArea.dataset.opts = JSON.stringify(opts);

    updateTopBar();
  }

  function answer(choiceIndex, autoWrong=false, timedOut=false, injected){
    if(!cur || curAnswered) return;
    curAnswered = true;
    stopTimer();

    const code = cur.code;
    const meaning = cur.meaning;
    const dir = injected?.dir || testArea.dataset.dir || cur.dir;

    const opts = injected?.opts || JSON.parse(testArea.dataset.opts || "[]");
    const correctIndex = injected?.correctIndex ?? Number(testArea.dataset.correctIndex || -1);

    const rt = now() - curStartTs;
    const ok = (choiceIndex === correctIndex);

    // "Next without answer" means wrong (autoWrong) except exam is also wrong, but only if user clicks Next
    // timedOut also wrong.
    const isSkipped = (choiceIndex === null);

    // Update counters
    asked++;
    if(isSkipped){
      skipped++;
    }else if(ok){
      correct++;
    }else{
      wrong++;
    }

    if(!isSkipped){
      rtSum += rt; rtN++;
    }

    // stats + mastery from test
    bumpStats(code, (!isSkipped && ok), (!isSkipped ? rt : 0));
    if(isSkipped){
      // don't change mastery on skip
    }else{
      setMastery(code, ok);
    }

    // SRS: if wrong -> reinsert later
    if(cbSRS.checked && !isSkipped && !ok){
      srsQueue.push({code, meaning});
    }

    // Session record
    session.items.push({
      code,
      ok: (!isSkipped && ok),
      rt: (!isSkipped ? rt : null),
      autoWrong: !!autoWrong,
      skipped: !!isSkipped,
      timedOut: !!timedOut
    });

    // UI feedback
    const optsEl = injected?.optsEl || $("opts");
    const fb = injected?.fb || $("fb");

    const buttons = [...optsEl.querySelectorAll(".optBtn")];
    buttons.forEach((b, idx)=>{
      if(idx === correctIndex) b.classList.add("correct");
      if(choiceIndex !== null && idx === choiceIndex && !ok) b.classList.add("wrong");
    });

    if(mode() !== "hardcore"){
      if(isSkipped){
        fb.textContent = timedOut ? "Čas vypršel ❌" : "Přeskočeno ❌";
        fb.className = "feedback bad";
      }else{
        fb.textContent = ok ? "Správně ✅" : `Špatně ❌`;
        fb.className = "feedback " + (ok ? "ok" : "bad");
      }
    }else{
      fb.textContent = "";
      fb.className = "feedback";
    }

    // Auto-next
    updateTopBar();

    if(shouldAutoNext()){
      setTimeout(()=>nextQuestion(), 650);
    }
  }

  function onNextPressed(){
    // If no answer -> mark wrong automatically (unless already answered)
    if(!cur) return;

    const exam = (mode()==="exam");
    if(!curAnswered){
      // In exam, still count as wrong if user hits next (they asked: next=auto wrong)
      // But they also said exam is strict - next without answer should be wrong too.
      answer(null, true, false); // autoWrong
      if(!exam){
        // in learning/hardcore/speed -> move on
        setTimeout(()=>nextQuestion(), 250);
      }else{
        setTimeout(()=>nextQuestion(), 250);
      }
      return;
    }

    // already answered -> go next
    nextQuestion();
  }

  btnNext.addEventListener("click", ()=>onNextPressed());

  // ========= BUILD TEST =========
  function buildTestFromFilters(){
    refreshChipUI();
    refreshChipDisables();

    const base = poolFromFilters();
    pool = base.map(([code,meaning])=>({code,meaning}));

    // total planned label
    const exam = (mode()==="exam");
    qTotal.textContent = String(exam ? 20 : Math.max(10, Math.min(60, pool.length || 0)));

    resetSession();

    if(pool.length === 0){
      testArea.innerHTML = `<div class="empty">Nemáš nic v poolu. Zkus změnit filtry (chipy) nebo hodnocení.</div>`;
      updateTopBar();
      return;
    }

    queue = buildQueueFromPool(pool.map(x=>[x.code,x.meaning]));
    nextQuestion();
  }

  function resetSession(){
    asked=0; correct=0; wrong=0; skipped=0; rtSum=0; rtN=0;
    session = { items: [] };
    srsQueue = [];
    cur = null;
    curAnswered = false;
    stopTimer();
    bar.style.width = "0%";
    qNum.textContent = "0";
    scoreOk.textContent = "0";
    scoreAll.textContent = "0";
    rtAvg.textContent = "–";
  }

  btnRestart.addEventListener("click", ()=>buildTestFromFilters());

  // Initial chip state refresh
  refreshChipUI();
  refreshChipDisables();

  // ======= TADY KONČÍ 2/3 =======

  // ========= REPORT / RESULTS =========
  function pct(a,b){ return b ? Math.round((a/b)*100) : 0; }

  function pickTopFails(limit=8){
    // top by wrong count in ALL-TIME stats (nejen session)
    const arr = data.map(([code])=>{
      const s = statsByCode.get(code) || defaultStats();
      return { code, wrong: s.wrong||0, total: s.total||0, rate: (s.total? s.wrong/s.total : 0) };
    });
    arr.sort((A,B)=>{
      // prioritize higher wrong count, then higher rate
      if(B.wrong !== A.wrong) return B.wrong - A.wrong;
      return B.rate - A.rate;
    });
    return arr.slice(0, limit);
  }

  function categoryBreakdownFromSession(){
    const map = new Map(); // cat -> {ok, wrong, skip, total}
    const ensure = (cat)=>{
      if(!map.has(cat)) map.set(cat, {ok:0, wrong:0, skip:0, total:0});
      return map.get(cat);
    };
    for(const it of session.items){
      const meaning = codeToMeaning.get(it.code) || "";
      const cat = categoryOf(it.code, meaning);
      const s = ensure(cat);
      s.total++;
      if(it.skipped) s.skip++;
      else if(it.ok) s.ok++;
      else s.wrong++;
    }
    return [...map.entries()].map(([cat,s])=>({cat,...s}));
  }

  function endReport(){
    stopTimer();
    document.body.classList.remove("stressLow");
    cur = null;

    const total = session.items.length;
    const ok = session.items.filter(x=>x.ok).length;
    const sk = session.items.filter(x=>x.skipped).length;
    const wr = total - ok - sk;

    const accuracy = pct(ok, Math.max(1,total));
    const okDeg = Math.round((accuracy/100)*360);

    // average RT in session
    const rts = session.items.filter(x=>typeof x.rt==="number").map(x=>x.rt);
    const avgRt = rts.length ? Math.round(rts.reduce((a,b)=>a+b,0)/rts.length) : 0;

    // derive "UMÍ/NEUMÍ" counts from global mastery map
    let u=0,n=0,k=0;
    for(const m of masteryByCode.values()){
      if(m===true) u++; else if(m===false) n++; else k++;
    }

    // category breakdown
    const cats = categoryBreakdownFromSession();
    const catMax = Math.max(1, ...cats.map(x=>x.total));
    const catRows = cats.map(c=>{
      const w = Math.round((c.total/catMax)*100);
      const acc = pct(c.ok, c.total);
      return `
        <div class="barRow">
          <div>${c.cat}</div>
          <div class="barTrack"><div class="barFill blue" style="--w:${w}%"></div></div>
          <div>${acc}%</div>
        </div>
      `;
    }).join("");

    // top fails pills
    const top = pickTopFails(8).map(x=>{
      const meaning = codeToMeaning.get(x.code) || "";
      return `<div class="li"><div><b>${x.code}</b> <small>${meaning}</small></div><div>${x.wrong}/${x.total}</div></div>`;
    }).join("");

    // session summary bars
    const maxPart = Math.max(1, ok, wr, sk);
    const wOk = Math.round((ok/maxPart)*100);
    const wWr = Math.round((wr/maxPart)*100);
    const wSk = Math.round((sk/maxPart)*100);

    testArea.innerHTML = `
      <div class="qBox">
        <div class="qCode" style="font-size:28px;">Výsledky</div>
        <div class="qPrompt">Profesionální přehled session + dlouhodobé slabiny</div>

        <div class="resultGrid">
          <div class="resCard">
            <div class="resTitle">Úspěšnost</div>
            <div class="donutWrap">
              <div class="donut" style="--okDeg:${okDeg}deg">
                <div class="donutCenter">
                  <div class="label">Accuracy</div>
                  <div class="value">${accuracy}%</div>
                </div>
              </div>
            </div>
            <div class="smallRow"><span>Správně</span><span><b>${ok}</b></span></div>
            <div class="smallRow"><span>Špatně</span><span><b>${wr}</b></span></div>
            <div class="smallRow"><span>Přeskočeno</span><span><b>${sk}</b></span></div>
            <div class="smallRow"><span>Avg RT</span><span><b>${avgRt ? (avgRt+" ms") : "–"}</b></span></div>
          </div>

          <div class="resCard">
            <div class="resTitle">Rozpad odpovědí</div>
            <div class="bars">
              <div class="barRow">
                <div>Správně</div>
                <div class="barTrack"><div class="barFill ok" style="--w:${wOk}%"></div></div>
                <div>${pct(ok,total)}%</div>
              </div>
              <div class="barRow">
                <div>Špatně</div>
                <div class="barTrack"><div class="barFill bad" style="--w:${wWr}%"></div></div>
                <div>${pct(wr,total)}%</div>
              </div>
              <div class="barRow">
                <div>Přeskočeno</div>
                <div class="barTrack"><div class="barFill skip" style="--w:${wSk}%"></div></div>
                <div>${pct(sk,total)}%</div>
              </div>
            </div>

            <div class="resTitle" style="margin-top:12px;">Kategorie (session)</div>
            <div class="bars">
              ${catRows || `<div class="empty">Žádná data.</div>`}
            </div>

            <div class="resTitle" style="margin-top:12px;">Stav znalostí (globálně)</div>
            <div class="bars">
              <div class="barRow">
                <div>UMÍ</div>
                <div class="barTrack"><div class="barFill ok" style="--w:${pct(u, u+n+k)}%"></div></div>
                <div>${u}</div>
              </div>
              <div class="barRow">
                <div>NEUMÍ</div>
                <div class="barTrack"><div class="barFill bad" style="--w:${pct(n, u+n+k)}%"></div></div>
                <div>${n}</div>
              </div>
              <div class="barRow">
                <div>NEZNÁM</div>
                <div class="barTrack"><div class="barFill blue" style="--w:${pct(k, u+n+k)}%"></div></div>
                <div>${k}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="resCard" style="margin-top:14px;">
          <div class="resTitle">Top dlouhodobé chyby</div>
          <div class="list">
            ${top || `<div class="empty">Zatím nic – dej pár testů a ukáže se to.</div>`}
          </div>
        </div>

        <div class="toggleRow" style="margin-top:12px;justify-content:center;">
          <button class="btn" id="btnAgain" type="button">Znovu test</button>
          <button class="btn" id="btnGoStudy" type="button">Zpět do učení</button>
        </div>
      </div>
    `;

    // wire buttons
    $("btnAgain").addEventListener("click", ()=>buildTestFromFilters());
    $("btnGoStudy").addEventListener("click", ()=>show("study"));

    // update top bar to final
    qNum.textContent = String(total);
    scoreOk.textContent = String(ok);
    scoreAll.textContent = String(total);
    rtAvg.textContent = avgRt ? `${avgRt} ms` : "–";
    bar.style.width = "100%";
  }

  // ========= Boot: if already on test panel, build =========
  if(panelTest.classList.contains("active")) buildTestFromFilters();

  // Make sure chips are correct state after load
  refreshChipUI();
  refreshChipDisables();

})(); // end IIFE
