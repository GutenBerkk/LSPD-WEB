(() => {
  "use strict";

  // ========= DATA =========
  const data = [
    ["10-0", "Vizuální kontakt ztracen"],
    ["10-1", "Změňte frekvenci"],
    ["10-3", "Ticho na vysílačce"],
    ["10-4", "Ok, rozumím"],
    ["10-5", "Přestávka"],
    ["10-6", "Zaneprázdněný"],
    ["10-7", "Mimo službu"],
    ["10-8", "Ve službě"],
    ["10-9", "Opakujte hlášení"],
    ["10-10", "Napadení"],

    ["10-11", "Traffic stop"],
    ["10-12", "Samostatná jízda"],
    ["10-13", "Střelba"],
    ["10-14", "Prodej drog"],
    ["10-15", "Převážení vězně směr Policejní stanice"],
    ["10-16", "Krádež vozidla"],
    ["10-17", "Podezřelá osoba"],
    ["10-18", "Trespassing"],
    ["10-20", "Lokace"],

    ["10-22", "Ignorujte příkaz"],
    ["10-23", "Dorazil na místo, ke scéně"],
    ["10-27", "Kontrola řidičského průkazu"],
    ["10-28", "Kontrola registrační značky"],
    ["10-29", "Zkontrolujte, zda je osoba hledaná"],

    ["10-30", "Hledaná osoba"],
    ["10-32", "Je potřeba asistence"],
    ["10-35", "Rozpustit perimetr"],

    ["10-41", "Zahájení patroly"],
    ["10-42", "Ukončení patroly"],
    ["10-43", "Podejte informace"],
    ["10-44", "Osoba zemřela"],

    ["10-50", "Dopravní nehoda"],
    ["10-51", "Potřebuju odtahovou službu"],
    ["10-52", "Potřebuji záchranku"],
    ["10-53", "Potřebuji fire department"],

    ["10-60", "Únos"],
    ["10-62", "Únos"],
    ["10-65", "Převoz vězně směr věznice"],
    ["10-66", "Bezohledný řidič"],
    ["10-68", "Ozbrojená loupež"],

    ["10-70", "Pěší nahánění - Suspect uniká"],
    ["10-71", "Dozor na scénu"],

    ["10-80", "Ujíždění hlídce"],

    ["10-90", "Vykrádání bankomatu"],
    ["10-95", "Suspect in custody (suspect zadržen)"],
    ["10-97", "Na cestě"],
    ["10-98", "Pokračuji v hlídce"],
    ["10-99", "Officer v nouzi"],

    ["Kód-1", "Bez majáku bez sirén"],
    ["Kód-2", "Majáky (křížovatka prohouknout, zpomalit)"],
    ["Kód-3", "Majáky sirény (křižovatka zpomalit)"],
    ["Kód-4", "Situace pod kontrolou"],
    ["Kód-5", "Felony stop"],
    ["Kód-6", "Dorazil na místo, zahajuji vyšetřování"],
    ["Kód-7", "Marked hlídky se vyhnou scéně"],
    ["Kód-10", "Předvolání SWAT/SRT teamu"],
    ["Kód-12", "Falešný poplach"],
  ];

  const sepIndex = data.findIndex(([c]) => String(c).startsWith("Kód-"));
  const codeToMeaning = new Map(data.map(([c, m]) => [c, m]));
  const allMeanings = data.map(x => x[1]);
  const allCodes = data.map(x => x[0]);

  const $ = (id) => document.getElementById(id);
  const now = () => Date.now();
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const is10 = (code) => String(code).startsWith("10-");
  const isState = (code) => String(code).startsWith("Kód-");

  // ========= category =========
  function categoryOf(code, meaning) {
    const m = (meaning || "").toLowerCase();
    const traffic = ["traffic", "doprav", "odtah", "řidič", "průkaz", "registra", "značk", "bezohled"];
    const violence = ["střelb", "únos", "loupež", "napaden", "ozbrojen", "v nouzi", "smrt", "zemř", "bankomat"];
    const admin = ["rozum", "opak", "ticho", "frekv", "lokace", "inform", "patrol", "perimetr", "kontrol", "hledan", "trespass", "podezřel", "dorazil", "na cestě", "pokračuji"];
    if (traffic.some(w => m.includes(w))) return "Dopravní";
    if (violence.some(w => m.includes(w))) return "Násilné";
    if (admin.some(w => m.includes(w))) return "Komunikace/Administrativa";
    if (isState(code)) return "Kódové stavy";
    return "Ostatní";
  }

  // ========= LocalStorage =========
  const LS_RATING = "lspd_ratingByCode_v6";
  const LS_MASTERY = "lspd_masteryByCode_v6";
  const LS_STATS = "lspd_statsByCode_v6";

  const loadObj = (key) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } };
  const saveObj = (key, obj) => localStorage.setItem(key, JSON.stringify(obj));
  const defaultStats = () => ({ correct: 0, wrong: 0, total: 0, streak: 0, lastWrongTs: 0, lastSeenTs: 0, avgRtMs: 0 });

  const ratingByCode = new Map();
  const masteryByCode = new Map();
  const statsByCode = new Map();

  const savedRatings = loadObj(LS_RATING) || {};
  const savedMastery = loadObj(LS_MASTERY) || {};
  const savedStats = loadObj(LS_STATS) || {};

  for (const [code] of data) {
    const r = (code in savedRatings) ? savedRatings[code] : null;
    ratingByCode.set(code, (r === "p" || r === "l" || r === "v") ? r : null);

    const m = (code in savedMastery) ? savedMastery[code] : null;
    masteryByCode.set(code, (m === true || m === false) ? m : null);

    const s = (code in savedStats) ? savedStats[code] : null;
    statsByCode.set(code, (s && typeof s === "object") ? { ...defaultStats(), ...s } : defaultStats());
  }

  function saveAll() {
    const rObj = {}, mObj = {}, sObj = {};
    for (const [code] of data) {
      rObj[code] = ratingByCode.get(code);
      mObj[code] = masteryByCode.get(code);
      sObj[code] = statsByCode.get(code);
    }
    saveObj(LS_RATING, rObj);
    saveObj(LS_MASTERY, mObj);
    saveObj(LS_STATS, sObj);
  }

  // ========= NAV =========
  const tabStudy = $("tabStudy"), tabTest = $("tabTest"), tabAnalysis = $("tabAnalysis");
  const panelStudy = $("panelStudy"), panelTest = $("panelTest"), panelAnalysis = $("panelAnalysis");
  const allPanels = [panelStudy, panelTest, panelAnalysis];
  const allTabs = [tabStudy, tabTest, tabAnalysis];

  let currentPanel = panelStudy;

  function show(which) {
    const map = { study: [tabStudy, panelStudy], test: [tabTest, panelTest], analysis: [tabAnalysis, panelAnalysis] };
    const [newTab, newPanel] = map[which];
    if (newPanel === currentPanel) return;

    const outPanel = currentPanel;
    currentPanel = newPanel;

    // Activate new tab
    allTabs.forEach(t => t.classList.remove("active"));
    newTab.classList.add("active");

    // GSAP panel transition
    const gs = window.gsap;
    if (gs) {
      // Slide-out current
      gs.to(outPanel, {
        opacity: 0, y: 16, duration: 0.22, ease: "power2.in",
        onComplete: () => {
          outPanel.classList.remove("active");
          outPanel.style.cssText = "";
          // Show new
          newPanel.classList.add("active");
          gs.fromTo(newPanel,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.32, ease: "power3.out" }
          );
          // Stagger cards inside
          const cards = newPanel.querySelectorAll(".gsap-card");
          gs.fromTo(cards, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.06, ease: "power2.out" });
        }
      });
    } else {
      outPanel.classList.remove("active");
      newPanel.classList.add("active");
    }

    if (which === "test") buildTestFromFilters();
    if (which === "analysis") renderAnalysis();
  }

  tabStudy.addEventListener("click", () => show("study"));
  tabTest.addEventListener("click", () => show("test"));
  tabAnalysis.addEventListener("click", () => show("analysis"));

  // ========= STUDY =========
  const studyList = $("studyList");
  const studySearch = $("studySearch");
  const btnReveal2s = $("btnReveal2s");
  const btnResetAll = $("btnResetAll");

  const rowElByCode = new Map();
  const masteryEls = new Map();
  const radioByCode = new Map();

  function setMasteryUI(code, value) {
    const el = masteryEls.get(code);
    if (!el) return;
    el.badgeEl.classList.remove("ok", "bad", "unk");
    if (value === true) {
      el.badgeEl.classList.add("ok"); el.textEl.textContent = "UMÍ";
    } else if (value === false) {
      el.badgeEl.classList.add("bad"); el.textEl.textContent = "NEUMÍ";
    } else {
      el.badgeEl.classList.add("unk"); el.textEl.textContent = "NEZNÁM";
    }
  }

  function setMastery(code, value) {
    masteryByCode.set(code, value);
    setMasteryUI(code, value);
    saveAll();
    recountStudy();
    buildHeatmap();
    refreshChipDisables();
  }

  function recountStudy() {
    let p = 0, l = 0, v = 0;
    for (const r of ratingByCode.values()) {
      if (r === "p") p++; else if (r === "l") l++; else if (r === "v") v++;
    }
    $("p").textContent = p;
    $("l").textContent = l;
    $("v").textContent = v;

    let u = 0, n = 0, k = 0;
    for (const m of masteryByCode.values()) {
      if (m === true) u++; else if (m === false) n++; else k++;
    }
    $("uCnt").textContent = u;
    $("nCnt").textContent = n;
    $("kCnt").textContent = k;
  }

  function renderStudy() {
    studyList.innerHTML = "";
    rowElByCode.clear(); masteryEls.clear(); radioByCode.clear();
    let idxRow = 0;

    data.forEach(([code, meaning], idx) => {
      if (idx === sepIndex && sepIndex !== -1) {
        const sep = document.createElement("div");
        sep.className = "sep";
        sep.textContent = "Kódové stavy";
        studyList.appendChild(sep);
      }

      const row = document.createElement("div");
      row.className = "row";
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

      const cell = row.querySelector(".meaningCell");
      const txt = row.querySelector(".hidden");
      cell.addEventListener("mouseenter", () => txt.classList.add("visible"));
      cell.addEventListener("mouseleave", () => txt.classList.remove("visible"));

      const badge = row.querySelector(`.mastery[data-code="${code}"]`);
      const mText = badge.querySelector(".mText");
      masteryEls.set(code, { badgeEl: badge, textEl: mText });
      setMasteryUI(code, masteryByCode.get(code));

      const inputs = [...row.querySelectorAll(`input[name="${name}"]`)];
      const pInp = inputs.find(x => x.value === "p");
      const lInp = inputs.find(x => x.value === "l");
      const vInp = inputs.find(x => x.value === "v");
      radioByCode.set(code, { p: pInp, l: lInp, v: vInp });
      const curR = ratingByCode.get(code);
      if (curR === "p") pInp.checked = true;
      else if (curR === "l") lInp.checked = true;
      else if (curR === "v") vInp.checked = true;

      inputs.forEach(inp => {
        inp.addEventListener("change", () => {
          ratingByCode.set(code, inp.value);
          saveAll();
          recountStudy();
          refreshChipDisables();
          if (panelTest.classList.contains("active")) buildTestFromFilters();
        });
      });

      studyList.appendChild(row);
    });

    recountStudy();
  }
  renderStudy();

  function applyStudySearch() {
    const q = (studySearch.value || "").trim().toLowerCase();
    for (const [code, meaning] of data) {
      const row = rowElByCode.get(code);
      if (!row) continue;
      if (!q) { row.style.display = ""; continue; }
      const hit = code.toLowerCase().includes(q) || meaning.toLowerCase().includes(q);
      row.style.display = hit ? "" : "none";
    }
  }
  studySearch.addEventListener("input", applyStudySearch);

  const btnRevealToggle = $("btnRevealToggle");
  let revealed = false;
  btnRevealToggle.addEventListener("click", () => {
    revealed = !revealed;
    const spans = [...document.querySelectorAll("#studyList .hidden")];
    spans.forEach(s => s.classList.toggle("visible", revealed));
    btnRevealToggle.classList.toggle("revealed", revealed);
    $("revealIcon").textContent = revealed ? "🙈" : "👁";
    $("revealLabel").textContent = revealed ? "Skrýt vše" : "Odhalit vše";
  });

  btnResetAll.addEventListener("click", () => {
    localStorage.removeItem(LS_RATING);
    localStorage.removeItem(LS_MASTERY);
    localStorage.removeItem(LS_STATS);
    for (const [code] of data) {
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
  function errorRate(code) {
    const s = statsByCode.get(code) || defaultStats();
    return s.total ? (s.wrong / s.total) : 0;
  }
  function heatColor(rate) {
    const r = Math.round(87 + (255 - 87) * rate);
    const g = Math.round(255 + (107 - 255) * rate);
    const b = Math.round(154 + (107 - 154) * rate);
    return `rgba(${r},${g},${b},.18)`;
  }
  function buildHeatmap() {
    heatGrid.innerHTML = "";
    for (const [code] of data) {
      const s = statsByCode.get(code) || defaultStats();
      const pill = document.createElement("div");
      pill.className = "heatPill";
      pill.style.background = heatColor(errorRate(code));
      pill.innerHTML = `${code}<small>${s.wrong}/${s.total}</small>`;
      pill.addEventListener("click", () => {
        show("study");
        const row = rowElByCode.get(code);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          row.style.outline = "2px solid rgba(120,166,255,.45)";
          row.style.outlineOffset = "2px";
          setTimeout(() => { row.style.outline = ""; row.style.outlineOffset = ""; }, 900);
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
  ["mousemove", "keydown", "scroll", "click", "touchstart"].forEach(evt => {
    window.addEventListener(evt, () => { lastUserActivityTs = now(); }, { passive: true });
  });

  function closePopQuiz() {
    overlay.classList.remove("on");
    overlay.setAttribute("aria-hidden", "true");
    overlayBody.innerHTML = "";
  }
  btnCloseOverlay.addEventListener("click", closePopQuiz);

  function pickDistractors(pool, correct, count) {
    const filtered = pool.filter(x => x !== correct);
    const result = [];
    const used = new Set();
    let attempts = 0;
    while (result.length < count && filtered.length > 0 && attempts < 200) {
      const pick = filtered[Math.floor(Math.random() * filtered.length)];
      if (!used.has(pick)) { used.add(pick); result.push(pick); }
      attempts++;
    }
    return result;
  }

  function bumpStats(code, ok, rtMs) {
    const s = statsByCode.get(code) || defaultStats();
    s.total = (s.total || 0) + 1;
    s.lastSeenTs = now();
    if (ok) {
      s.correct = (s.correct || 0) + 1;
      s.streak = (s.streak || 0) + 1;
    } else {
      s.wrong = (s.wrong || 0) + 1;
      s.streak = 0;
      s.lastWrongTs = now();
    }
    if (rtMs && rtMs > 0) {
      const prevAvg = s.avgRtMs || 0;
      const prevN = s.total - 1;
      s.avgRtMs = Math.round((prevAvg * prevN + rtMs) / s.total);
    }
    statsByCode.set(code, s);
    saveAll();
    buildHeatmap();
  }

  function openPopQuiz() {
    if (!panelStudy.classList.contains("active")) return;
    if (overlay.classList.contains("on")) return;

    const bag = [];
    for (const [code, meaning] of data) {
      const s = statsByCode.get(code) || defaultStats();
      const m = masteryByCode.get(code);
      let w = 1 + Math.min(6, s.wrong);
      if (m === null) w += 2;
      if (m === false) w += 3;
      for (let i = 0; i < w; i++) bag.push({ code, meaning });
    }
    const pick = bag[Math.floor(Math.random() * bag.length)];
    if (!pick) return;

    const dir = Math.random() < 0.6 ? "code2meaning" : "meaning2code";
    const letters = ["A", "B", "C", "D"];

    let correctText, optPool, top;
    if (dir === "code2meaning") {
      correctText = pick.meaning;
      optPool = allMeanings;
      top = `<div class="qCode" style="font-size:30px;margin:6px 0 4px;">${pick.code}</div>
             <div class="qPrompt">Vyber správný význam</div>`;
    } else {
      correctText = pick.code;
      optPool = allCodes;
      top = `<div class="qCode" style="font-size:18px;margin:6px 0 4px;letter-spacing:.2px;">${pick.meaning}</div>
             <div class="qPrompt">Vyber správný kód</div>`;
    }

    const distractors = pickDistractors(optPool, correctText, 3);
    const opts = shuffle([correctText, ...distractors]);
    const correctIndex = opts.indexOf(correctText);

    overlayBody.innerHTML = `
      <div class="qBox" style="margin:0;">
        ${top}
        <div class="opts" id="ovOpts"></div>
        <div class="feedback" id="ovFb"></div>
      </div>
    `;
    const ovOpts = overlayBody.querySelector("#ovOpts");
    const ovFb = overlayBody.querySelector("#ovFb");

    let locked = false;
    const start = now();

    opts.forEach((t, i) => {
      const b = document.createElement("div");
      b.className = "optBtn";
      b.innerHTML = `<div class="letter">${letters[i]}</div><div class="optText">${t}</div>`;
      b.addEventListener("click", () => {
        if (locked) return;
        locked = true;
        const rt = now() - start;
        const ok = (i === correctIndex);
        bumpStats(pick.code, ok, rt);
        setMastery(pick.code, ok);
        [...ovOpts.querySelectorAll(".optBtn")].forEach((bb, idx) => {
          if (idx === correctIndex) bb.classList.add("correct");
          if (idx === i && !ok) bb.classList.add("wrong");
        });
        ovFb.textContent = ok ? "Správně ✅" : "Špatně ❌";
        ovFb.className = "feedback " + (ok ? "ok" : "bad");
        setTimeout(closePopQuiz, 800);
      });
      ovOpts.appendChild(b);
    });

    overlay.classList.add("on");
    overlay.setAttribute("aria-hidden", "false");
  }

  setInterval(() => {
    if (!panelStudy.classList.contains("active")) return;
    if (overlay.classList.contains("on")) return;
    const idle = now() - lastUserActivityTs;
    if (idle > 25000) {
      lastUserActivityTs = now(); // reset so it doesn't immediately re-fire
      openPopQuiz();
    }
  }, 1000);

  // ========= TEST UI =========
  const selMode = $("selMode"), selDir = $("selDir");
  const selScenario = $("selScenario"), selTimer = $("selTimer");
  const cbWeakOnly = $("cbWeakOnly"), cbAdaptive = $("cbAdaptive");
  const cbStress = $("cbStress"), cbSRS = $("cbSRS");
  const cbFlip = $("cbFlip");
  const btnRestart = $("btnRestart"), btnNext = $("btnNext");
  const chipAll = $("chipAll"), chipP = $("chipP");
  const chipL = $("chipL"), chipV = $("chipV");
  const chipKnow = $("chipKnow"), chipDont = $("chipDont"), chipUnk = $("chipUnk");
  const chip10 = $("chip10"), chipState = $("chipState");
  const qNum = $("qNum"), qTotal = $("qTotal");
  const scoreOk = $("scoreOk"), scoreAll = $("scoreAll"), rtAvg = $("rtAvg");
  const bar = $("bar"), testArea = $("testArea");

  // ===== Filter state =====
  const filter = { all: true, p: false, l: true, v: true };
  const mFilter = { know: true, dont: true, unk: true };
  const tFilter = { ten: true, state: true };

  const setChip = (el, on) => el.classList.toggle("on", !!on);
  const setDisabled = (el, dis) => el.classList.toggle("disabled", !!dis);

  function refreshChipUI() {
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

  function matchFilters(code) {
    if (is10(code) && !tFilter.ten) return false;
    if (isState(code) && !tFilter.state) return false;

    const r = ratingByCode.get(code);
    const ratingOk =
      filter.all ||
      (filter.p && r === "p") ||
      (filter.l && r === "l") ||
      (filter.v && r === "v");
    if (!ratingOk) return false;

    const m = masteryByCode.get(code);
    const masteryOk =
      (m === true && mFilter.know) ||
      (m === false && mFilter.dont) ||
      (m === null && mFilter.unk);
    if (!masteryOk) return false;

    return true;
  }

  function poolFromFilters() {
    let pool = data.filter(([code]) => matchFilters(code));
    if (cbWeakOnly.checked) {
      pool = pool.filter(([code]) => {
        const s = statsByCode.get(code) || defaultStats();
        const m = masteryByCode.get(code);
        return (m === null) || (m === false) || (s.total < 2) || (errorRate(code) >= 0.35);
      });
    }
    return pool;
  }

  function refreshChipDisables() {
    const simulate = (mutator, el) => {
      const snap = { f: { ...filter }, m: { ...mFilter }, t: { ...tFilter } };
      mutator();
      const cnt = data.filter(([code]) => matchFilters(code)).length;
      Object.assign(filter, snap.f);
      Object.assign(mFilter, snap.m);
      Object.assign(tFilter, snap.t);
      setDisabled(el, cnt === 0);
    };

    simulate(() => {
      if (filter.all) { filter.all = false; filter.p = true; filter.l = false; filter.v = false; }
      else filter.p = !filter.p;
      if (!filter.p && !filter.l && !filter.v) filter.all = true;
    }, chipP);

    simulate(() => {
      if (filter.all) { filter.all = false; filter.p = false; filter.l = true; filter.v = false; }
      else filter.l = !filter.l;
      if (!filter.p && !filter.l && !filter.v) filter.all = true;
    }, chipL);

    simulate(() => {
      if (filter.all) { filter.all = false; filter.p = false; filter.l = false; filter.v = true; }
      else filter.v = !filter.v;
      if (!filter.p && !filter.l && !filter.v) filter.all = true;
    }, chipV);

    simulate(() => { mFilter.know = !mFilter.know; if (!mFilter.know && !mFilter.dont && !mFilter.unk) mFilter.know = true; }, chipKnow);
    simulate(() => { mFilter.dont = !mFilter.dont; if (!mFilter.know && !mFilter.dont && !mFilter.unk) mFilter.dont = true; }, chipDont);
    simulate(() => { mFilter.unk = !mFilter.unk; if (!mFilter.know && !mFilter.dont && !mFilter.unk) mFilter.unk = true; }, chipUnk);

    simulate(() => { tFilter.ten = !tFilter.ten; if (!tFilter.ten && !tFilter.state) tFilter.ten = true; }, chip10);
    simulate(() => { tFilter.state = !tFilter.state; if (!tFilter.ten && !tFilter.state) tFilter.state = true; }, chipState);

    setDisabled(chipAll, false);
  }

  function clickAll() {
    if (chipAll.classList.contains("disabled")) return;
    filter.all = true; filter.p = false; filter.l = false; filter.v = false;
    refreshChipUI(); refreshChipDisables(); buildTestFromFilters();
  }
  function clickRating(which) {
    const el = which === "p" ? chipP : which === "l" ? chipL : chipV;
    if (el.classList.contains("disabled")) return;
    if (filter.all) {
      filter.all = false;
      filter.p = which === "p";
      filter.l = which === "l";
      filter.v = which === "v";
    } else {
      filter[which] = !filter[which];
      if (!filter.p && !filter.l && !filter.v) filter.all = true;
    }
    refreshChipUI(); refreshChipDisables(); buildTestFromFilters();
  }
  function clickMastery(which) {
    const el = which === "know" ? chipKnow : which === "dont" ? chipDont : chipUnk;
    if (el.classList.contains("disabled")) return;
    mFilter[which] = !mFilter[which];
    if (!mFilter.know && !mFilter.dont && !mFilter.unk) mFilter[which] = true;
    refreshChipUI(); refreshChipDisables(); buildTestFromFilters();
  }
  function clickType(which) {
    const el = which === "ten" ? chip10 : chipState;
    if (el.classList.contains("disabled")) return;
    tFilter[which] = !tFilter[which];
    if (!tFilter.ten && !tFilter.state) tFilter[which] = true;
    refreshChipUI(); refreshChipDisables(); buildTestFromFilters();
  }

  chipAll.addEventListener("click", clickAll);
  chipP.addEventListener("click", () => clickRating("p"));
  chipL.addEventListener("click", () => clickRating("l"));
  chipV.addEventListener("click", () => clickRating("v"));
  chipKnow.addEventListener("click", () => clickMastery("know"));
  chipDont.addEventListener("click", () => clickMastery("dont"));
  chipUnk.addEventListener("click", () => clickMastery("unk"));
  chip10.addEventListener("click", () => clickType("ten"));
  chipState.addEventListener("click", () => clickType("state"));

  [selMode, selDir, selScenario, selTimer, cbWeakOnly, cbAdaptive, cbStress, cbSRS, cbFlip]
    .forEach(el => el.addEventListener("change", () => buildTestFromFilters()));

  // ========= TEST ENGINE =========
  let pool = [];  // [{code, meaning}]
  let queue = [];  // current shuffled queue
  let srsQueue = [];  // SRS repeat queue
  let cur = null;
  let curAnswered = false;
  let curStartTs = 0;
  let timerTick = null;
  let timerBarEl = null;

  // Session counters
  let asked = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let rtSum = 0;
  let rtN = 0;

  // FIX: single definition of sessionLimit used everywhere
  let sessionLimit = 0;

  let session = null; // { items:[] }

  function mode() { return selMode.value; }

  function getSessionLimit(poolSize) {
    if (mode() === "exam") return 20;
    // For other modes, do one full pass through the pool (at least 10, no more than pool size)
    return Math.max(10, Math.min(poolSize, 60));
  }

  function effectiveDirection() {
    if (cbFlip.checked) {
      return (asked % 2 === 0) ? "code2meaning" : "meaning2code";
    }
    return selDir.value;
  }

  function scenarioText(code, meaning) {
    const cat = categoryOf(code, meaning);
    if (selScenario.value === "plain") return "";
    if (selScenario.value === "scenario") {
      if (cat === "Dopravní") return "Situace: dopravní incident – vyber správné hlášení.";
      if (cat === "Násilné") return "Situace: krizová událost – vyber správné hlášení.";
      if (cat === "Kódové stavy") return "Situace: měníš režim hlídky – vyber správné označení.";
      return "Situace: rádio provoz – vyber správné hlášení.";
    }
    return `Rádio: „Dispatch, potvrď ${is10(code) ? "10-code" : "kód"}."`;
  }

  function adaptiveWeight(code) {
    const s = statsByCode.get(code) || defaultStats();
    const m = masteryByCode.get(code);
    let w = 1;
    if (cbAdaptive.checked) {
      w += Math.min(6, s.wrong);
      w += Math.round(errorRate(code) * 6);
      if (m === null) w += 2;
      if (m === false) w += 3;
      if (s.total < 2) w += 2;
    }
    return clamp(w, 1, 18);
  }

  // Build a finite queue that covers the pool once (adaptive weighted)
  function buildQueueFromPool(basePool) {
    const bag = [];
    for (const [code, meaning] of basePool) {
      const w = adaptiveWeight(code);
      for (let i = 0; i < w; i++) bag.push({ code, meaning });
    }
    // Draw at most sessionLimit unique-ish picks
    const out = [];
    const used = new Set();
    const tries = Math.min(sessionLimit * 4, bag.length * 3);
    for (let i = 0; i < tries && out.length < sessionLimit; i++) {
      const pick = bag[Math.floor(Math.random() * bag.length)];
      if (!pick) continue;
      const key = pick.code + "|" + Math.floor(out.length / 4);
      if (used.has(key)) continue;
      used.add(key);
      out.push(pick);
    }
    // If we couldn't fill sessionLimit, pad with shuffled base
    if (out.length < sessionLimit) {
      const base = shuffle(basePool.map(([code, meaning]) => ({ code, meaning })));
      for (const item of base) {
        if (out.length >= sessionLimit) break;
        if (!out.find(x => x.code === item.code)) out.push(item);
      }
    }
    return shuffle(out);
  }

  function resetSession() {
    asked = 0; correct = 0; wrong = 0; skipped = 0; rtSum = 0; rtN = 0;
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

  function updateTopBar() {
    qNum.textContent = String(asked);
    scoreOk.textContent = String(correct);
    scoreAll.textContent = String(correct + wrong + skipped);
    rtAvg.textContent = rtN ? `${Math.round(rtSum / rtN)} ms` : "–";

    const pct = sessionLimit ? (asked / sessionLimit) * 100 : 0;
    bar.style.width = `${clamp(pct, 0, 100)}%`;
  }

  function stopTimer() {
    if (timerTick) { clearInterval(timerTick); timerTick = null; }
    timerBarEl = null;
  }

  function startTimerIfNeeded() {
    stopTimer();
    const v = selTimer.value;
    if (v === "off") return;

    const totalMs = Number(v) * 1000;
    const wrap = document.querySelector(".timerWrap");
    timerBarEl = wrap ? wrap.querySelector(".timerFill") : null;
    const start = now();

    timerTick = setInterval(() => {
      const elapsed = now() - start;
      const left = clamp(totalMs - elapsed, 0, totalMs);
      const frac = totalMs ? (left / totalMs) : 0;
      if (timerBarEl) timerBarEl.style.width = `${Math.round(frac * 100)}%`;
      if (left <= 0) {
        stopTimer();
        if (!curAnswered) answer(null, true, true);
      }
    }, 50);
  }

  function makeOptions(dir, code, meaning) {
    const letters = ["A", "B", "C", "D"];
    const correctText = dir === "code2meaning" ? meaning : code;
    const pool = dir === "code2meaning" ? allMeanings : allCodes;
    const distractors = pickDistractors(pool, correctText, 3);
    const opts = shuffle([correctText, ...distractors]);
    return { letters, opts, correctIndex: opts.indexOf(correctText) };
  }

  function shouldAutoNext() {
    return (mode() === "learning" || mode() === "speed");
  }

  function nextQuestion() {
    // FIX: check session limit properly
    if (asked >= sessionLimit) {
      endReport();
      return;
    }

    let pick = null;

    // SRS: bring back wrong items periodically
    if (cbSRS.checked && srsQueue.length && asked > 0 && asked % 3 === 0) {
      pick = srsQueue.shift();
    }

    if (!pick) {
      if (queue.length === 0) {
        // Queue exhausted before limit – rebuild to fill remaining questions
        const remaining = sessionLimit - asked;
        if (remaining <= 0) { endReport(); return; }
        queue = shuffle(pool.map(x => ({ code: x.code, meaning: x.meaning })));
      }
      pick = queue.shift();
    }

    if (!pick) { endReport(); return; }

    const dir = effectiveDirection();
    cur = { code: pick.code, meaning: pick.meaning, dir };
    curAnswered = false;
    curStartTs = now();

    renderQuestion();
    startTimerIfNeeded();
  }

  function renderQuestion() {
    const { code, meaning, dir } = cur;
    const sc = scenarioText(code, meaning);
    const { letters, opts, correctIndex } = makeOptions(dir, code, meaning);

    const main = (dir === "code2meaning")
      ? `<div class="qCode">${code}</div><div class="qPrompt">${sc || "Vyber správný význam"}</div>`
      : `<div class="qCode" style="font-size:18px;letter-spacing:.2px;">${meaning}</div><div class="qPrompt">${sc || "Vyber správný kód"}</div>`;

    document.body.classList.toggle("stressLow", !!cbStress.checked);

    testArea.innerHTML = `
      <div class="qBox">
        ${main}
        <div class="timerWrap" style="${selTimer.value === "off" ? "display:none" : ""}">
          <div class="timerFill"></div>
        </div>
        <div class="opts" id="opts"></div>
        <div class="feedback" id="fb"></div>
      </div>
    `;

    const optsEl = $("opts");
    const fb = $("fb");
    let locked = false;

    opts.forEach((text, i) => {
      const b = document.createElement("div");
      b.className = "optBtn";
      b.innerHTML = `<div class="letter">${letters[i]}</div><div class="optText">${text}</div>`;
      b.addEventListener("click", () => {
        if (locked) return;
        locked = true;
        answer(i, false, false, { opts, correctIndex, dir, fb, optsEl });
      });
      optsEl.appendChild(b);
    });

    // Store for timer/next fallback
    testArea.dataset.correctIndex = String(correctIndex);
    testArea.dataset.dir = dir;
    testArea.dataset.code = code;
    testArea.dataset.opts = JSON.stringify(opts);

    updateTopBar();
  }

  function answer(choiceIndex, autoWrong = false, timedOut = false, injected) {
    if (!cur || curAnswered) return;
    curAnswered = true;
    stopTimer();

    const code = cur.code;
    const meaning = cur.meaning;

    const opts = injected?.opts || JSON.parse(testArea.dataset.opts || "[]");
    const correctIndex = injected?.correctIndex ?? Number(testArea.dataset.correctIndex ?? -1);

    const rt = now() - curStartTs;
    const isSkipped = (choiceIndex === null);
    const ok = !isSkipped && (choiceIndex === correctIndex);

    asked++;
    if (isSkipped) skipped++;
    else if (ok) correct++;
    else wrong++;

    if (!isSkipped) { rtSum += rt; rtN++; }

    bumpStats(code, ok && !isSkipped, isSkipped ? 0 : rt);
    if (!isSkipped) setMastery(code, ok);

    if (cbSRS.checked && !isSkipped && !ok) {
      srsQueue.push({ code, meaning });
    }

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

    if (optsEl) {
      [...optsEl.querySelectorAll(".optBtn")].forEach((b, idx) => {
        if (idx === correctIndex) b.classList.add("correct");
        if (choiceIndex !== null && idx === choiceIndex && !ok) b.classList.add("wrong");
      });
    }

    if (mode() !== "hardcore") {
      if (isSkipped) {
        fb.textContent = timedOut ? "Čas vypršel ❌" : "Přeskočeno ❌";
        fb.className = "feedback bad";
      } else {
        fb.textContent = ok ? "Správně ✅" : "Špatně ❌";
        fb.className = "feedback " + (ok ? "ok" : "bad");
      }
    } else {
      fb.textContent = "";
      fb.className = "feedback";
    }

    updateTopBar();

    // FIX: auto-next only moves forward; no double-call risk
    if (shouldAutoNext()) {
      setTimeout(() => {
        if (curAnswered) nextQuestion();
      }, 650);
    }
  }

  function onNextPressed() {
    if (!cur) return;
    if (!curAnswered) {
      // Mark as skipped/wrong, then advance
      answer(null, true, false);
      // FIX: only advance if auto-next won't do it
      if (!shouldAutoNext()) {
        setTimeout(() => nextQuestion(), 300);
      }
      return;
    }
    // already answered → go to next (unless auto-next is already scheduled)
    if (!shouldAutoNext()) {
      nextQuestion();
    }
  }

  btnNext.addEventListener("click", () => onNextPressed());
  btnRestart.addEventListener("click", () => buildTestFromFilters());

  // ========= BUILD TEST =========
  function buildTestFromFilters() {
    refreshChipUI();
    refreshChipDisables();

    const base = poolFromFilters();
    pool = base.map(([code, meaning]) => ({ code, meaning }));

    sessionLimit = getSessionLimit(pool.length);
    qTotal.textContent = String(sessionLimit);

    resetSession();

    if (pool.length === 0) {
      testArea.innerHTML = `<div class="empty">Nemáš nic v poolu. Zkus změnit filtry (chipy) nebo hodnocení.</div>`;
      updateTopBar();
      return;
    }

    queue = buildQueueFromPool(base);
    nextQuestion();
  }

  // ========= REPORT / RESULTS =========
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }

  function pickTopFails(limit = 8) {
    const arr = data.map(([code]) => {
      const s = statsByCode.get(code) || defaultStats();
      return { code, wrong: s.wrong || 0, total: s.total || 0, rate: (s.total ? s.wrong / s.total : 0) };
    });
    arr.sort((A, B) => {
      if (B.wrong !== A.wrong) return B.wrong - A.wrong;
      return B.rate - A.rate;
    });
    return arr.filter(x => x.total > 0).slice(0, limit);
  }

  function categoryBreakdownFromSession() {
    const map = new Map();
    const ensure = (cat) => {
      if (!map.has(cat)) map.set(cat, { ok: 0, wrong: 0, skip: 0, total: 0 });
      return map.get(cat);
    };
    for (const it of session.items) {
      const meaning = codeToMeaning.get(it.code) || "";
      const cat = categoryOf(it.code, meaning);
      const s = ensure(cat);
      s.total++;
      if (it.skipped) s.skip++;
      else if (it.ok) s.ok++;
      else s.wrong++;
    }
    return [...map.entries()].map(([cat, s]) => ({ cat, ...s }));
  }

  function endReport() {
    stopTimer();
    document.body.classList.remove("stressLow");
    cur = null;

    const total = session.items.length;
    const ok = session.items.filter(x => x.ok).length;
    const sk = session.items.filter(x => x.skipped).length;
    const wr = total - ok - sk;
    const accuracy = pct(ok, Math.max(1, total));
    const okDeg = Math.round((accuracy / 100) * 360);

    const rts = session.items.filter(x => typeof x.rt === "number" && x.rt > 0).map(x => x.rt);
    const avgRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;

    let u = 0, n = 0, k = 0;
    for (const m of masteryByCode.values()) {
      if (m === true) u++; else if (m === false) n++; else k++;
    }

    const cats = categoryBreakdownFromSession();
    const catMax = Math.max(1, ...cats.map(x => x.total));
    const catRows = cats.map(c => {
      const w = Math.round((c.total / catMax) * 100);
      const acc = pct(c.ok, c.total);
      return `
        <div class="barRow">
          <div class="barLabel">${c.cat}</div>
          <div class="barTrack"><div class="barFill blue" style="--w:${w}%"></div></div>
          <div class="barValue">${acc}%</div>
        </div>
      `;
    }).join("");

    const top = pickTopFails(8).map(x => {
      const meaning = codeToMeaning.get(x.code) || "";
      return `<div class="li"><div><b>${x.code}</b> <small>${meaning}</small></div><div class="liStat">${x.wrong}/${x.total}</div></div>`;
    }).join("");

    const maxPart = Math.max(1, ok, wr, sk);

    testArea.innerHTML = `
      <div class="qBox">
        <div class="resultsHeader">
          <h2>Výsledky</h2>
          <p>Přehled session + dlouhodobé slabiny</p>
        </div>

        <div class="resultGrid">
          <div class="resCard">
            <div class="resTitle">Úspěšnost</div>
            <div class="donutWrap">
              <div class="donut" style="--okDeg:${okDeg}deg">
                <div class="donutCenter">
                  <div class="donutLabel">Accuracy</div>
                  <div class="donutValue">${accuracy}%</div>
                </div>
              </div>
            </div>
            <div class="smallRow"><span>Správně</span><span><b>${ok}</b></span></div>
            <div class="smallRow"><span>Špatně</span><span><b>${wr}</b></span></div>
            <div class="smallRow"><span>Přeskočeno</span><span><b>${sk}</b></span></div>
            <div class="smallRow"><span>Avg RT</span><span><b>${avgRt ? (avgRt + " ms") : "–"}</b></span></div>
          </div>

          <div class="resCard">
            <div class="resTitle">Rozpad odpovědí</div>
            <div class="bars">
              <div class="barRow">
                <div class="barLabel">Správně</div>
                <div class="barTrack"><div class="barFill ok"   style="--w:${pct(ok, Math.max(1, maxPart))}%"></div></div>
                <div class="barValue">${pct(ok, total)}%</div>
              </div>
              <div class="barRow">
                <div class="barLabel">Špatně</div>
                <div class="barTrack"><div class="barFill bad"  style="--w:${pct(wr, Math.max(1, maxPart))}%"></div></div>
                <div class="barValue">${pct(wr, total)}%</div>
              </div>
              <div class="barRow">
                <div class="barLabel">Přeskočeno</div>
                <div class="barTrack"><div class="barFill skip" style="--w:${pct(sk, Math.max(1, maxPart))}%"></div></div>
                <div class="barValue">${pct(sk, total)}%</div>
              </div>
            </div>

            <div class="resTitle" style="margin-top:14px;">Kategorie (session)</div>
            <div class="bars">
              ${catRows || `<div class="empty">Žádná data.</div>`}
            </div>

            <div class="resTitle" style="margin-top:14px;">Stav znalostí (globálně)</div>
            <div class="bars">
              <div class="barRow">
                <div class="barLabel">UMÍ</div>
                <div class="barTrack"><div class="barFill ok"   style="--w:${pct(u, u + n + k)}%"></div></div>
                <div class="barValue">${u}</div>
              </div>
              <div class="barRow">
                <div class="barLabel">NEUMÍ</div>
                <div class="barTrack"><div class="barFill bad"  style="--w:${pct(n, u + n + k)}%"></div></div>
                <div class="barValue">${n}</div>
              </div>
              <div class="barRow">
                <div class="barLabel">NEZNÁM</div>
                <div class="barTrack"><div class="barFill blue" style="--w:${pct(k, u + n + k)}%"></div></div>
                <div class="barValue">${k}</div>
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

        <div class="toggleRow" style="margin-top:14px;justify-content:center;gap:12px;">
          <button class="btn" id="btnAgain"   type="button">Znovu test</button>
          <button class="btn" id="btnGoStudy" type="button">Zpět do učení</button>
        </div>
      </div>
    `;

    $("btnAgain").addEventListener("click", () => buildTestFromFilters());
    $("btnGoStudy").addEventListener("click", () => show("study"));

    qNum.textContent = String(total);
    scoreOk.textContent = String(ok);
    scoreAll.textContent = String(total);
    rtAvg.textContent = avgRt ? `${avgRt} ms` : "–";
    bar.style.width = "100%";
  }

  // ========= Boot =========
  refreshChipUI();
  refreshChipDisables();
  if (panelTest.classList.contains("active")) buildTestFromFilters();

  // ========= GSAP ANIMATIONS =========
  (function initGSAP() {
    const gs = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gs) return;

    // Register plugin
    if (ST) gs.registerPlugin(ST);

    // Topbar entrance
    gs.from("#topbar", { y: -40, opacity: 0, duration: 0.55, ease: "power3.out", delay: 0.05 });

    // Initial panel cards stagger
    gs.from(".panel.active .gsap-card", { y: 28, opacity: 0, duration: 0.45, stagger: 0.09, ease: "power3.out", delay: 0.20 });

    // Footer
    gs.from(".footer", { y: 20, opacity: 0, duration: 0.40, ease: "power2.out", delay: 0.55 });

    // Scroll-reveal for study rows
    if (ST) {
      ST.batch("#studyList .row", {
        onEnter: els => gs.from(els, { x: -18, opacity: 0, duration: 0.30, stagger: 0.04, ease: "power2.out" }),
        once: true,
        start: "top 92%"
      });

      ST.batch(".heatPill", {
        onEnter: els => gs.from(els, { scale: 0.80, opacity: 0, duration: 0.22, stagger: 0.02, ease: "back.out(1.7)" }),
        once: true,
        start: "top 95%"
      });

      ST.batch(".stat", {
        onEnter: els => gs.from(els, { y: 12, opacity: 0, duration: 0.22, stagger: 0.04, ease: "power2.out" }),
        once: true,
        start: "top 95%"
      });
    }

    // Chip spring bounce on click
    document.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        gs.fromTo(chip, { scale: 0.88 }, { scale: 1, duration: 0.55, ease: "elastic.out(1.2, 0.5)" });
      });
    });

    // Badge counter animate in testTop (live updates handled by JS)
    // Hover glow on optBtn
    document.addEventListener("mouseover", e => {
      const btn = e.target.closest(".optBtn");
      if (btn && !btn.classList.contains("correct") && !btn.classList.contains("wrong")) {
        gs.to(btn, { scale: 1.015, duration: 0.15, ease: "power1.out" });
      }
    });
    document.addEventListener("mouseout", e => {
      const btn = e.target.closest(".optBtn");
      if (btn) gs.to(btn, { scale: 1, duration: 0.18, ease: "power1.out" });
    });
  })();

  // ========= ANALYSIS =========
  function renderAnalysis() {
    const body = $("analysisBody");
    if (!body) return;

    // Compute stats
    let u = 0, n = 0, k = 0;
    for (const m of masteryByCode.values()) {
      if (m === true) u++; else if (m === false) n++; else k++;
    }
    const totalCodes = data.length;

    let rP = 0, rL = 0, rV = 0, rN = 0;
    for (const r of ratingByCode.values()) {
      if (r === "p") rP++; else if (r === "l") rL++; else if (r === "v") rV++; else rN++;
    }

    // Category breakdown (all-time from statsByCode)
    const catMap = new Map();
    for (const [code, meaning] of data) {
      const cat = categoryOf(code, meaning);
      if (!catMap.has(cat)) catMap.set(cat, { ok: 0, wrong: 0, total: 0 });
      const s = statsByCode.get(code) || defaultStats();
      const c = catMap.get(cat);
      c.ok += s.correct;
      c.wrong += s.wrong;
      c.total += s.total;
    }
    const cats = [...catMap.entries()].map(([cat, v]) => ({ cat, ...v })).sort((a, b) => b.total - a.total);
    const catMax = Math.max(1, ...cats.map(x => x.total));

    // Top weak codes
    const weakList = data.map(([code]) => {
      const s = statsByCode.get(code) || defaultStats();
      return { code, ...s, rate: s.total ? s.wrong / s.total : 0 };
    }).filter(x => x.total > 0).sort((a, b) => b.wrong !== a.wrong ? b.wrong - a.wrong : b.rate - a.rate).slice(0, 20);

    const masteryMax = Math.max(1, u, n, k);
    const rMax = Math.max(1, rP, rL, rV, rN);
    const totalTested = weakList.reduce((s, x) => s + (x.total > 0 ? 1 : 0), 0);

    const catRowsHTML = cats.map(c => {
      const w = Math.round((c.total / catMax) * 100);
      const acc = c.total ? Math.round((c.ok / c.total) * 100) : 0;
      const color = acc >= 70 ? "ok" : acc >= 40 ? "skip" : "bad";
      return `
        <div class="barRow">
          <div class="barLabel">${c.cat}</div>
          <div class="barTrack"><div class="barFill ${color}" style="--w:${w}%"></div></div>
          <div class="barValue">${acc}%</div>
        </div>`;
    }).join("");

    const weakRowsHTML = weakList.map((x, i) => {
      const meaning = codeToMeaning.get(x.code) || "";
      const acc = Math.round((1 - x.rate) * 100);
      const errClass = acc < 40 ? "errBad" : acc < 70 ? "errWarn" : "errOk";
      const barPct = Math.round(x.rate * 100);
      return `
        <tr>
          <td>${i + 1}</td>
          <td><b>${x.code}</b></td>
          <td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${meaning}</td>
          <td>${x.total}</td>
          <td class="${errClass}">${x.wrong}</td>
          <td>
            <div class="inlineBar">
              <div class="inlineBarTrack">
                <div class="inlineBarFill barFill ${acc < 40 ? "bad" : acc < 70 ? "skip" : "ok"}" style="--w:${barPct}%;width:${barPct}%"></div>
              </div>
              <span class="${errClass}">${acc}%</span>
            </div>
          </td>
        </tr>`;
    }).join("");

    body.innerHTML = `
      <div class="analysisGrid">
        <!-- Mastery overview -->
        <div class="resCard gsap-card">
          <div class="analysisSectionTitle">Stav znalostí</div>
          <div class="masteryGroup">
            <div class="masteryDonutWrap">
              <div class="donut" style="--okDeg:${Math.round((u / Math.max(1, totalCodes)) * 360)}deg;width:90px;height:90px;">
                <div class="donutCenter" style="width:62px;height:62px;">
                  <div class="donutLabel">UMÍ</div>
                  <div class="donutValue" style="font-size:17px;">${u}</div>
                </div>
              </div>
              <div class="masteryDonutLabel" style="color:var(--ok)">UMÍ</div>
            </div>
            <div class="masteryDonutWrap">
              <div class="donut" style="--okDeg:0deg;background:conic-gradient(rgba(248,113,113,.80) 0deg ${Math.round((n / Math.max(1, totalCodes)) * 360)}deg, rgba(30,30,50,.55) ${Math.round((n / Math.max(1, totalCodes)) * 360)}deg 360deg);width:90px;height:90px;">
                <div class="donutCenter" style="width:62px;height:62px;">
                  <div class="donutLabel">NEUMÍ</div>
                  <div class="donutValue" style="font-size:17px;">${n}</div>
                </div>
              </div>
              <div class="masteryDonutLabel" style="color:var(--bad)">NEUMÍ</div>
            </div>
            <div class="masteryDonutWrap">
              <div class="donut" style="--okDeg:0deg;background:conic-gradient(rgba(96,165,250,.75) 0deg ${Math.round((k / Math.max(1, totalCodes)) * 360)}deg, rgba(30,30,50,.55) ${Math.round((k / Math.max(1, totalCodes)) * 360)}deg 360deg);width:90px;height:90px;">
                <div class="donutCenter" style="width:62px;height:62px;">
                  <div class="donutLabel">NEZNÁM</div>
                  <div class="donutValue" style="font-size:17px;">${k}</div>
                </div>
              </div>
              <div class="masteryDonutLabel" style="color:var(--blue)">NEZNÁM</div>
            </div>
          </div>
          <div style="margin-top:14px;">
            <div class="smallRow"><span>Celkem kódů</span><b>${totalCodes}</b></div>
            <div class="smallRow"><span>Testováno</span><b>${totalTested}</b></div>
            <div class="smallRow"><span>Netestováno</span><b>${totalCodes - totalTested}</b></div>
          </div>
        </div>

        <!-- Rating breakdown -->
        <div class="resCard gsap-card">
          <div class="analysisSectionTitle">Hodnocení (Perfektně / Lehce / Vůbec)</div>
          <div class="bars" style="margin-top:8px;">
            <div class="barRow">
              <div class="barLabel">✔ Perfektně</div>
              <div class="barTrack"><div class="barFill ok" style="--w:${Math.round((rP / Math.max(1, totalCodes)) * 100)}%"></div></div>
              <div class="barValue">${rP}</div>
            </div>
            <div class="barRow">
              <div class="barLabel">➖ Lehce</div>
              <div class="barTrack"><div class="barFill skip" style="--w:${Math.round((rL / Math.max(1, totalCodes)) * 100)}%"></div></div>
              <div class="barValue">${rL}</div>
            </div>
            <div class="barRow">
              <div class="barLabel">❌ Vůbec</div>
              <div class="barTrack"><div class="barFill bad" style="--w:${Math.round((rV / Math.max(1, totalCodes)) * 100)}%"></div></div>
              <div class="barValue">${rV}</div>
            </div>
            <div class="barRow">
              <div class="barLabel">❔ Neohodnoceno</div>
              <div class="barTrack"><div class="barFill blue" style="--w:${Math.round((rN / Math.max(1, totalCodes)) * 100)}%"></div></div>
              <div class="barValue">${rN}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category breakdown full row -->
      <div class="analysisFullRow resCard gsap-card">
        <div class="analysisSectionTitle">Výkon dle kategorie (všechny časy)</div>
        <div class="catBars">
          ${catRowsHTML || '<div class="empty">Zatím žádná data – udělej pár testů.</div>'}
        </div>
      </div>

      <!-- Weakness table -->
      <div class="analysisFullRow resCard gsap-card">
        <div class="analysisSectionTitle">Top slabá místa (dle počtu chyb)</div>
        ${weakRowsHTML ? `
        <div style="overflow-x:auto;">
          <table class="weakTable">
            <thead>
              <tr>
                <th>#</th>
                <th>Kód</th>
                <th>Význam</th>
                <th>Celkem</th>
                <th>Chyby</th>
                <th style="min-width:160px;">Úspěšnost</th>
              </tr>
            </thead>
            <tbody>${weakRowsHTML}</tbody>
          </table>
        </div>` : '<div class="empty">Zatím žádná data – udělej pár testů.</div>'}
      </div>
    `;

    // Animate in
    const gs = window.gsap;
    if (gs) {
      gs.from(body.querySelectorAll(".gsap-card"), { y: 22, opacity: 0, duration: 0.32, stagger: 0.08, ease: "power3.out" });
      gs.from(body.querySelectorAll(".barFill"), { scaleX: 0, transformOrigin: "left center", duration: 0.65, stagger: 0.04, ease: "power3.out", delay: 0.20 });
    }
  }

  $("btnRefreshAnalysis") && $("btnRefreshAnalysis").addEventListener("click", renderAnalysis);

})(); // end IIFE
