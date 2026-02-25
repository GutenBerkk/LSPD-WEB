(() => {
  "use strict";

  // ========= DATA (MODULAR) =========
  const trainingData = {
    "ZÁKLADNÍ KÓDY": {
      "10-Kódy": [
        ["10-0", "Vizuální kontakt ztracen"], ["10-1", "Změňte frekvenci"], ["10-3", "Ticho na vysílačce"], ["10-4", "Ok, rozumím"], ["10-5", "Přestávka"], ["10-6", "Zaneprázdněný"], ["10-7", "Mimo službu"], ["10-8", "Ve službě"], ["10-9", "Opakujte hlášení"], ["10-10", "Napadení"], ["10-11", "Traffic stop"], ["10-12", "Samostatná jízda"], ["10-13", "Střelba"], ["10-14", "Prodej drog"], ["10-15", "Převáží vězně"], ["10-16", "Krádež vozidla"], ["10-17", "Podezřelá osoba"], ["10-18", "Trespassing"], ["10-20", "Lokace"], ["10-22", "Ignorujte"], ["10-23", "Dorazil"], ["10-27", "Kontrola řidičáku"], ["10-28", "Kontrola SPZ"], ["10-29", "Hledaná osoba?"], ["10-30", "Hledaná osoba!"], ["10-32", "Asistence"], ["10-35", "Rozpustit perimetr"], ["10-41", "Zahájit patrolu"], ["10-42", "Ukončit patrolu"], ["10-44", "Osoba zemřela"], ["10-50", "Nehoda"], ["10-51", "Odtah"], ["10-52", "Záchranka"], ["10-60", "Únos"], ["10-66", "Bezohledný řidič"], ["10-68", "Loupež"], ["10-70", "Pěší honička"], ["10-80", "Ujíždění"], ["10-90", "Vykrádání ATM"], ["10-95", "Zadržen"], ["10-99", "Officer v tísni"]
      ],
      "Kódové stavy": [
        ["Kód-1", "Bez majáků"], ["Kód-2", "Majáky"], ["Kód-3", "Majáky a sirény"], ["Kód-4", "Pod kontrolou"], ["Kód-5", "Felony stop"], ["Kód-6", "Vyšetřování"], ["Kód-7", "Vyhnout se scéně"], ["Kód-12", "Falešný poplach"]
      ]
    },
    "MEDICAL MATERIÁLY": {
      "ems-příručka": [
        ["ZÁKLADNÍ POSTUPY", "Základní kroky: kontrola dechu, tepu, zastavení krvácení.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["TRIÁŽ", "Priorita: Červená (urgentní), Žlutá (vážná), Zelená (lehká), Černá (mrtvý).\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["VÝSLECH PACIENTA", "SAMPLE (Signs, Allergies, Medications, Past history, Last meal, Events).\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"]
      ],
      "medic-bag": [
        ["STETOSKOP", "Diagnostika a měření srdečního tepu.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["AMBU VAK", "Ruční křísicí přístroj pro ventilaci.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["GUEDEL", "Ústní vzduchovody pro průchodnost dýchacích cest.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["TERMOMETR", "Měření tělesné teploty.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"]
      ]
    },
    "PRÁVNÍ MATERIÁLY": {
      "Ústava & Dodatky": [
        ["1. DODATEK", "Svoboda projevu, náboženství, tisku, shromažďování.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["4. DODATEK", "Ochrana před neodůvodněnou prohlídkou (warrant).\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["5. DODATEK", "Právo nevypovídat, řádný proces.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["14. DODATEK", "Rovná ochrana a Due Process.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"]
      ],
      "Práva & Miranda": [
        ["MIRANDA RIGHTS", "Právo nevypovídat, právo na advokáta.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["PRÁVA ADVOKÁTA", "Přístup ke klientovi, znalost statusu, přítomnost u výslechu.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"]
      ]
    },
    "TYPY ZASTAVENÍ": {
      "Pursuit & PIT": [
        ["PIT MANEUVER", "Vyvedení vozidla z rovnováhy (do 35-40 mph).\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["BOX MANEUVER", "Zablokování vozidla 1-3 jednotkami.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"]
      ],
      "Traffic & Felony": [
        ["TRAFFIC STOP", "Dočasné zadržení řidiče za účelem vyšetřování.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"],
        ["FELONY STOP", "Vysoké riziko, důstojníci za krytem, megafon.\n\nZdroj: Discord LEO & PRÁVNÍ PŘÍRUČKA (Valtor) - https://discord.gg/JaSEDd5N6E"]
      ]
    }
  };

  const $ = (id) => document.getElementById(id);
  const now = () => Date.now();
  const shuffle = (arr) => {
    let a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ========= STATE =========
  let activeCategory = null;
  let activeModule = null;
  let activeModuleData = [];
  let currentPanel = $("panelDashboard");

  const LS_VERSION = "_v9_final";
  const loadObj = (k) => { try { return JSON.parse(localStorage.getItem(k + LS_VERSION)) || {}; } catch { return {}; } };
  const saveObj = (k, v) => localStorage.setItem(k + LS_VERSION, JSON.stringify(v));

  const masteryMap = loadObj("mastery");
  const statsMap = loadObj("stats");

  function getStats(modId, itemId) {
    const key = `${modId}_${itemId}`;
    if (!statsMap[key]) statsMap[key] = { correct: 0, wrong: 0, total: 0 };
    return statsMap[key];
  }

  // ========= NAVIGATION =========
  function show(panelId) {
    const next = $(panelId);
    if (!next || next === currentPanel) return;
    const out = currentPanel;
    currentPanel = next;

    if (panelId === "panelDashboard") {
      activeCategory = null; activeModule = null;
    }
    if (panelId === "panelAnalysis") renderAnalysis();

    const gs = window.gsap;
    if (gs) {
      gs.to(out, {
        opacity: 0, y: 15, duration: 0.15, onComplete: () => {
          out.classList.remove("active");
          next.classList.add("active");
          gs.fromTo(next, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25 });
          const cards = next.querySelectorAll(".gsap-card");
          if (cards.length) gs.fromTo(cards, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.2, stagger: 0.05 });
        }
      });
    } else {
      out.classList.remove("active");
      next.classList.add("active");
    }
  }

  window.goBack = (where) => {
    if (where === "dashboard") show("panelDashboard");
    else if (where === "category") show("panelCategory");
  };

  // ========= RENDERERS =========
  function renderDashboard() {
    const grid = $("categoryGrid");
    grid.innerHTML = "";
    Object.keys(trainingData).forEach(cat => {
      const card = document.createElement("div");
      card.className = "catCard gsap-card";
      card.innerHTML = `<span class="catIcon">📁</span><h3>${cat}</h3><span>${Object.keys(trainingData[cat]).length} Modulů</span>`;
      card.onclick = () => openCategory(cat);
      grid.appendChild(card);
    });
  }

  function openCategory(cat) {
    activeCategory = cat;
    $("categoryTitle").textContent = cat;
    const grid = $("moduleGrid");
    grid.innerHTML = "";
    Object.keys(trainingData[cat]).forEach(mod => {
      const card = document.createElement("div");
      card.className = "modCard gsap-card";
      card.innerHTML = `<span class="modIcon">📜</span><h3>${mod}</h3><span>${trainingData[cat][mod].length} Položek</span>`;
      card.onclick = () => openModule(mod);
      grid.appendChild(card);
    });
    show("panelCategory");
  }

  function openModule(mod) {
    activeModule = mod;
    activeModuleData = trainingData[activeCategory][mod];
    $("moduleTitle").textContent = mod;
    showModuleTab("study");
    renderModuleStudy();
    buildModuleHeatmap();
    show("panelWorkspace");
  }

  window.showModuleTab = (tab) => {
    document.querySelectorAll(".wTab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".moduleSubPanel").forEach(p => p.classList.remove("active"));
    $(`tabModule${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add("active");
    $(`module${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add("active");
    if (tab === "test") startModuleTest();
  };

  function buildModuleHeatmap() {
    const grid = $("moduleHeatmap");
    grid.innerHTML = "";
    activeModuleData.forEach((item) => {
      const s = getStats(activeModule, item[0]);
      const rate = s.total > 0 ? (s.wrong / s.total) : 0;
      const pill = document.createElement("div");
      pill.className = "hpill";
      pill.style.background = rate >= 0.7 ? "#ef4444" : rate >= 0.4 ? "#f59e0b" : rate > 0 ? "#10b981" : "rgba(255,255,255,0.05)";
      grid.appendChild(pill);
    });
  }

  function renderModuleStudy() {
    const list = $("moduleStudyList");
    list.innerHTML = "";
    activeModuleData.forEach(item => {
      const [code, meaning] = item;
      const row = document.createElement("div");
      row.className = "row gsap-card";
      row.innerHTML = `
        <div class="rowMain">
          <div class="codeCol"><span class="codeTag">${code}</span></div>
          <div class="meaningCol"><span class="hidden-meaning">${meaning.replace(/\n/g, '<br>')}</span></div>
        </div>
      `;
      list.appendChild(row);
    });
  }

  // ========= TEST LOGIC =========
  let testIdx = 0, testScore = 0, testQueue = [];
  function startModuleTest() {
    testQueue = shuffle(activeModuleData.map(x => x[0]));
    testIdx = 0; testScore = 0;
    $("moduleTestResults").classList.remove("active");
    $("moduleTestMain").classList.add("active");
    nextQuestion();
  }

  function nextQuestion() {
    if (testIdx >= testQueue.length) return endModuleTest();
    const code = testQueue[testIdx];
    const correctFull = activeModuleData.find(x => x[0] === code)[1];

    // STRICT SOURCE CLEANUP
    const correctClean = correctFull.split("\n\nZdroj:")[0].trim();

    $("qCode").textContent = code;
    $("qProgress").textContent = `Otázka ${testIdx + 1} / ${testQueue.length}`;

    // Clean all meanings for distractors
    const allCleanMeanings = activeModuleData.map(x => x[1].split("\n\nZdroj:")[0].trim());
    let dists = shuffle(allCleanMeanings.filter(m => m !== correctClean)).slice(0, 3);
    const opts = shuffle([correctClean, ...dists]);

    $("optsGrid").innerHTML = "";
    opts.forEach(o => {
      const b = document.createElement("button");
      b.className = "optBtn";
      b.textContent = o;
      b.onclick = () => {
        const s = getStats(activeModule, code);
        s.total++;
        if (o === correctClean) {
          s.correct++; testScore++; b.classList.add("correct");
        } else {
          s.wrong++; b.classList.add("wrong");
          [...$("optsGrid").children].forEach(btn => {
            if (btn.textContent === correctClean) btn.classList.add("correct");
          });
        }
        saveObj("stats", statsMap);
        [...$("optsGrid").children].forEach(btn => btn.disabled = true);
        $("btnNext").style.display = "block";

        // MOVE SOURCE TO FOOTER ONLY
        const sourceText = correctFull.includes("Zdroj:") ? correctFull.split("Zdroj:")[1].trim() : "";
        $("moduleSource").innerHTML = sourceText ? `<div class="fSource"><b>Zdroj:</b> ${sourceText}</div>` : "";
      };
      $("optsGrid").appendChild(b);
    });
    $("btnNext").style.display = "none";
    $("moduleSource").innerHTML = "";
  }

  $("btnNext").onclick = () => { testIdx++; nextQuestion(); };
  $("btnSkip").onclick = () => { testIdx++; nextQuestion(); };
  $("btnRestart").onclick = startModuleTest;

  function endModuleTest() {
    $("moduleTestMain").classList.remove("active");
    $("moduleTestResults").classList.add("active");
    $("resScore").textContent = `${testScore} / ${testQueue.length}`;
    buildModuleHeatmap();
  }

  // ========= ANALYSIS (GLOBAL) =========
  function renderAnalysis() {
    const body = $("analysisBody");
    if (!body) return;

    let totalItems = 0;
    let masteredCount = 0;
    let failedCount = 0;
    const categoryStats = [];

    Object.keys(trainingData).forEach(catName => {
      let catTotalScore = 0;
      let catTotalQuestions = 0;

      Object.keys(trainingData[catName]).forEach(modId => {
        trainingData[catName][modId].forEach(item => {
          totalItems++;
          const stats = getStats(modId, item[0]);
          catTotalQuestions += stats.total;
          catTotalScore += stats.correct;
          const rate = stats.total > 0 ? (stats.wrong / stats.total) : 0;
          if (rate >= 0.5 && stats.total > 0) failedCount++;
          else if (stats.correct > 2 && rate < 0.2) masteredCount++;
        });
      });

      categoryStats.push({
        name: catName,
        accuracy: catTotalQuestions > 0 ? Math.round((catTotalScore / catTotalQuestions) * 100) : 0
      });
    });

    const neutralCount = totalItems - masteredCount - failedCount;

    body.innerHTML = `
      <div class="analysisGrid">
        <div class="resCard gsap-card">
          <div class="analysisSectionTitle">Stav znalostí (Globální)</div>
          <div class="masteryGroup">
            <div class="masteryDonutWrap"><div class="donut" style="--okDeg:${Math.round((masteredCount / totalItems) * 360)}deg;"><div class="donutCenter"><div class="donutLabel">UMÍ</div><div class="donutValue">${masteredCount}</div></div></div></div>
            <div class="masteryDonutWrap"><div class="donut" style="background:#ef4444; --okDeg:0deg;"><div class="donutCenter"><div class="donutLabel">NEUMÍ</div><div class="donutValue">${failedCount}</div></div></div></div>
            <div class="masteryDonutWrap"><div class="donut" style="background:rgba(255,255,255,0.05); --okDeg:0deg;"><div class="donutCenter"><div class="donutLabel">NEZNÁM</div><div class="donutValue">${neutralCount}</div></div></div></div>
          </div>
        </div>
        <div class="resCard gsap-card">
          <div class="analysisSectionTitle">Úspěšnost dle kategorií</div>
          <div class="catBars">
            ${categoryStats.map(c => `
              <div class="barRow">
                <div class="barLabel">${c.name}</div>
                <div class="barTrack"><div class="barFill" style="width:${c.accuracy}%"></div></div>
                <div class="barValue">${c.accuracy}%</div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
      <div class="analysisFullRow resCard gsap-card">
        <div class="analysisSectionTitle">Globální Heatmapa (Všechny moduly)</div>
        <div id="globalHeatGrid" class="moduleHeatGrid" style="margin-top:15px; gap:6px;"></div>
      </div>
    `;

    const globalHeat = $("globalHeatGrid");
    Object.keys(trainingData).forEach(cat => {
      Object.keys(trainingData[cat]).forEach(mod => {
        trainingData[cat][mod].forEach(item => {
          const s = getStats(mod, item[0]);
          const rate = s.total > 0 ? (s.wrong / s.total) : 0;
          const pill = document.createElement("div");
          pill.className = "hpill";
          pill.title = `${mod}: ${item[0]}`;
          pill.style.width = "12px"; pill.style.height = "12px";
          pill.style.background = rate >= 0.7 ? "#ef4444" : rate >= 0.4 ? "#f59e0b" : rate > 0 ? "#10b981" : "rgba(255,255,255,0.05)";
          globalHeat.appendChild(pill);
        });
      });
    });
  }

  // Search
  $("moduleSearch").oninput = (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll("#moduleStudyList .row").forEach(row => {
      const txt = row.textContent.toLowerCase();
      row.style.display = txt.includes(q) ? "" : "none";
    });
  };

  let revealed = false;
  $("btnModuleReveal").onclick = () => {
    revealed = !revealed;
    document.querySelectorAll(".hidden-meaning").forEach(m => m.classList.toggle("visible", revealed));
    $("btnModuleReveal").textContent = revealed ? "🙈 Skrýt" : "👁 Odhalit vše";
  };

  // Global reset
  $("btnResetAll").onclick = () => { if (confirm("Resetovat veškerý postup?")) { localStorage.clear(); location.reload(); } };

  window.onload = renderDashboard;

})();
