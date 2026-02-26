(() => {
  "use strict";

  // ═══════════════════════════════════════════════════════════
  //  DATA LAYER
  // ═══════════════════════════════════════════════════════════
  let trainingData = {};   // { category: { title: [messages] } }

  // Text is "usable" for testing when it has real content (not empty / image-only)
  function isUsableText(str) {
    if (!str) return false;
    const s = str.trim();
    if (s === "" || s === "xxx" || s === "[Příloha]") return false;
    if (s.length < 6) return false;
    return true;
  }

  // Truncate text for display
  function truncate(str, max = 220) {
    return str.length > max ? str.substring(0, max).trimEnd() + "…" : str;
  }

  async function loadData() {
    try {
      const response = await fetch("data.json");
      const rawData = await response.json();

      trainingData = {};
      rawData.forEach(item => {
        if (!trainingData[item.category]) trainingData[item.category] = {};
        // Keep all messages for Study view (including images), but tag testable ones
        trainingData[item.category][item.title] = item.messages;
      });

      renderDashboard();
    } catch (err) {
      console.error("Nepodařilo se načíst data.json:", err);
      document.getElementById("categoryGrid").innerHTML =
        '<p style="color:#ef4444;padding:24px">❌ Chyba: nepodařilo se načíst data.json. Otevřete přes lokální server.</p>';
    }
  }

  // Returns only text-usable messages for a module
  function getTestableItems(messages) {
    return messages.filter(m => isUsableText(m.content));
  }

  // ═══════════════════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════════════════
  const $ = id => document.getElementById(id);
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ═══════════════════════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════════════════════
  let activeCategory = null;
  let activeModule = null;
  let activeModuleData = [];       // all messages
  let activeTestItems = [];       // text-only messages for testing
  let currentPanel = $("panelDashboard");

  const LS_VERSION = "_v10";
  const loadObj = k => { try { return JSON.parse(localStorage.getItem(k + LS_VERSION)) || {}; } catch { return {}; } };
  const saveObj = (k, v) => localStorage.setItem(k + LS_VERSION, JSON.stringify(v));

  const statsMap = loadObj("stats");

  function getStats(modId, itemId) {
    const key = `${modId}::${itemId}`;
    if (!statsMap[key]) statsMap[key] = { correct: 0, wrong: 0, total: 0 };
    return statsMap[key];
  }

  // ═══════════════════════════════════════════════════════════
  //  NAVIGATION
  // ═══════════════════════════════════════════════════════════
  window.show = (panelId) => {
    const next = $(panelId);
    if (!next || next === currentPanel) return;
    const out = currentPanel;
    currentPanel = next;

    if (panelId === "panelDashboard") { activeCategory = null; activeModule = null; }
    if (panelId === "panelAnalysis") renderAnalysis();

    // Update tab active state
    $("btnGoHome").classList.toggle("active", panelId === "panelDashboard");
    $("btnGoAnalysis").classList.toggle("active", panelId === "panelAnalysis");

    const gs = window.gsap;
    if (gs) {
      gs.to(out, {
        opacity: 0, y: 12, duration: 0.15, onComplete: () => {
          out.classList.remove("active");
          next.classList.add("active");
          gs.fromTo(next, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.22 });
          const cards = next.querySelectorAll(".gsap-card");
          if (cards.length) gs.fromTo(cards, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.18, stagger: 0.04 });
        }
      });
    } else {
      out.classList.remove("active");
      next.classList.add("active");
    }
  };

  window.goBack = where => {
    if (where === "dashboard") show("panelDashboard");
    else if (where === "category") show("panelCategory");
  };

  window.showModuleTab = tab => {
    document.querySelectorAll(".wTab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".moduleSubPanel").forEach(p => p.classList.remove("active"));
    $(`tabModule${tab[0].toUpperCase()}${tab.slice(1)}`).classList.add("active");
    $(`module${tab[0].toUpperCase()}${tab.slice(1)}`).classList.add("active");
    if (tab === "test") startModuleTest();
  };

  // ═══════════════════════════════════════════════════════════
  //  RENDERERS — DASHBOARD & CATEGORY
  // ═══════════════════════════════════════════════════════════
  function renderDashboard() {
    const grid = $("categoryGrid");
    grid.innerHTML = "";
    const icons = { "CRIMINAL MATERIÁLY": "🔴", "MEDICAL MATERIÁLY": "🏥", "PRÁVNÍ MATERIÁLY": "⚖️", "TYPY ZASTAVENÍ": "🚔", "ZÁKLADNÍ KÓDY": "📡" };
    Object.keys(trainingData).forEach(cat => {
      const count = Object.keys(trainingData[cat]).length;
      const card = document.createElement("div");
      card.className = "catCard gsap-card";
      card.innerHTML = `<span class="catIcon">${icons[cat] || "📁"}</span><h3>${cat}</h3><span>${count} Modulů</span>`;
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
      const msgs = trainingData[cat][mod];
      const testable = getTestableItems(msgs);
      const card = document.createElement("div");
      card.className = "modCard gsap-card";
      card.innerHTML = `<span class="modIcon">📜</span><h3>${mod}</h3><span>${msgs.length} Zpráv · ${testable.length} testovatelné</span>`;
      card.onclick = () => openModule(mod);
      grid.appendChild(card);
    });
    show("panelCategory");
  }

  function openModule(mod) {
    activeModule = mod;
    activeModuleData = trainingData[activeCategory][mod];
    activeTestItems = getTestableItems(activeModuleData);
    $("moduleTitle").textContent = mod;
    showModuleTab("study");
    renderModuleStudy();
    buildModuleHeatmap();
    show("panelWorkspace");
  }

  // ═══════════════════════════════════════════════════════════
  //  STUDY VIEW
  // ═══════════════════════════════════════════════════════════
  function buildModuleHeatmap() {
    const grid = $("moduleHeatmap");
    grid.innerHTML = "";
    activeTestItems.forEach((item, i) => {
      const s = getStats(activeModule, i);
      const rate = s.total > 0 ? s.wrong / s.total : -1;
      const pill = document.createElement("div");
      pill.className = "hpill";
      pill.style.background = rate < 0 ? "rgba(255,255,255,0.05)" : rate >= 0.6 ? "#ef4444" : rate >= 0.35 ? "#f59e0b" : "#22c55e";

      // Rich tooltip: module name + question number + content preview + stats
      const statLabel = s.total === 0 ? "Neodpovězeno" : `${s.correct}/${s.total} správně (${Math.round((s.correct / s.total) * 100)}%)`;
      const preview = truncate(item.content, 80).replace(/\n/g, " ");
      pill.setAttribute("data-tooltip", `#${i + 1} — ${activeModule}\n${preview}\n${statLabel}`);
      pill.title = `#${i + 1} ${activeModule}: ${preview} — ${statLabel}`;

      // Click to jump to question
      pill.style.cursor = "pointer";
      pill.onclick = () => {
        showModuleTab("test");
        setTimeout(() => {
          testQueue = [i, ...shuffle(activeTestItems.map((_, j) => j).filter(j => j !== i))];
          testIdx = 0;
          nextQuestion();
        }, 50);
      };
      grid.appendChild(pill);
    });
  }

  // Convert Discord CDN URL to local path
  function localImagePath(url) {
    const m = url.match(/\/attachments\/(\d+)\/(\d+)\/([^?]+)/);
    if (m) return `images/${m[1]}_${m[2]}_${m[3]}`;
    return url; // fallback to CDN
  }

  function renderModuleStudy() {
    const list = $("moduleStudyList");
    list.innerHTML = "";
    activeModuleData.forEach(item => {
      const row = document.createElement("div");
      row.className = "row gsap-card";

      let contentHtml = "";
      if (item.content && item.content.trim()) {
        // Always visible — no hidden/blur
        contentHtml = `<div class="meaningCol">${item.content.replace(/\n/g, "<br>")}</div>`;
      }

      let attachmentsHtml = "";
      if (item.attachments && item.attachments.length > 0) {
        attachmentsHtml = `<div class="attachments">${item.attachments.map(url => {
          const local = localImagePath(url);
          return `<img src="${local}" class="studyImg" loading="lazy" onclick="window.open('${local}')" onerror="this.src='${url}'">`;
        }).join("")}</div>`;
      }

      if (!contentHtml && !attachmentsHtml) return;

      row.innerHTML = contentHtml + attachmentsHtml;
      list.appendChild(row);
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  TEST LOGIC
  // ═══════════════════════════════════════════════════════════
  let testIdx = 0, testScore = 0, testQueue = [];

  function startModuleTest() {
    if (activeTestItems.length < 2) {
      $("moduleTestMain").innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-dim)">
          <div style="font-size:36px;margin-bottom:12px">📎</div>
          <p>Tento modul obsahuje pouze obrázky a nemá dostatek textového obsahu pro testování.</p>
        </div>`;
      return;
    }
    // Reset DOM
    $("moduleTestMain").innerHTML = `
      <div class="qBox">
        <div class="qHeader"><span id="qProgress">Otázka 1/${activeTestItems.length}</span></div>
        <div id="qCode" class="qCode">${activeModule.toUpperCase()}</div>
        <div id="qPrompt" class="qPrompt">Načítání...</div>
        <div id="optsGrid" class="opts"></div>
        <div class="testActions">
          <button id="btnSkip" class="btnSecondary">Přeskočit</button>
          <button id="btnNext" class="btnPrimary" style="display:none">Další ›</button>
        </div>
      </div>`;
    $("moduleTestResults").classList.remove("active");
    $("moduleTestMain").classList.add("active");

    // re-bind buttons
    $("btnNext").onclick = () => { testIdx++; nextQuestion(); };
    $("btnSkip").onclick = () => { testIdx++; nextQuestion(); };

    testQueue = shuffle(activeTestItems.map((_, i) => i));
    testIdx = 0; testScore = 0;
    nextQuestion();
  }

  function nextQuestion() {
    if (testIdx >= testQueue.length) return endModuleTest();

    const idx = testQueue[testIdx];
    const correct = activeTestItems[idx];
    const correctText = correct.content.trim();

    $("qProgress").textContent = `Otázka ${testIdx + 1} / ${testQueue.length}`;
    $("qCode").textContent = activeModule.toUpperCase();

    // Show first line as a "topic hint", full text in options
    const lines = correctText.split("\n").filter(l => l.trim());
    const hint = lines.length > 1 ? lines[0].trim() : "Vyber správnou odpověď:";
    const full = correctText;

    $("qPrompt").textContent = hint;

    // Collect distractors — text from other testable items
    let pool = activeTestItems
      .filter((_, i) => i !== idx)
      .map(m => m.content.trim())
      .filter(t => t !== correctText);

    // If not enough, draw from other modules in same category
    if (pool.length < 3) {
      Object.keys(trainingData[activeCategory]).forEach(mod => {
        if (mod !== activeModule) {
          getTestableItems(trainingData[activeCategory][mod]).forEach(m => {
            if (m.content.trim() !== correctText) pool.push(m.content.trim());
          });
        }
      });
    }

    const dists = shuffle([...new Set(pool)]).slice(0, 3);
    const opts = shuffle([full, ...dists]);

    $("optsGrid").innerHTML = "";
    opts.forEach(o => {
      const b = document.createElement("button");
      b.className = "optBtn";
      b.textContent = truncate(o, 200);
      b.onclick = () => {
        const s = getStats(activeModule, idx);
        s.total++;
        if (o === full) {
          s.correct++; testScore++;
          b.classList.add("correct");
        } else {
          s.wrong++;
          b.classList.add("wrong");
          [...$("optsGrid").children].forEach(btn => {
            if (btn.textContent === truncate(full, 200)) btn.classList.add("correct");
          });
        }
        saveObj("stats", statsMap);
        [...$("optsGrid").children].forEach(btn => btn.disabled = true);
        $("btnNext").style.display = "block";
        buildModuleHeatmap();
      };
      $("optsGrid").appendChild(b);
    });

    $("btnNext").style.display = "none";
    $("moduleSource").innerHTML = "";
  }

  function endModuleTest() {
    $("moduleTestMain").classList.remove("active");
    $("moduleTestResults").classList.add("active");
    const pct = Math.round((testScore / testQueue.length) * 100);
    const grade = pct >= 90 ? "🏆 Výborně!" : pct >= 70 ? "✅ Splněno!" : pct >= 50 ? "⚡ Slabé" : "❌ Selhání";
    $("resGrade").textContent = grade;
    $("resScore").textContent = `${testScore} / ${testQueue.length}`;
    $("btnRestart").onclick = startModuleTest;
    buildModuleHeatmap();
  }

  // ═══════════════════════════════════════════════════════════
  //  ANALYSIS
  // ═══════════════════════════════════════════════════════════
  function renderAnalysis() {
    const body = $("analysisBody");
    if (!body) return;

    let totalItems = 0, masteredCount = 0, failedCount = 0;
    const catStats = [];

    Object.keys(trainingData).forEach(cat => {
      let catCorrect = 0, catTotal = 0;

      Object.keys(trainingData[cat]).forEach(mod => {
        const items = getTestableItems(trainingData[cat][mod]);
        items.forEach((_, i) => {
          totalItems++;
          const s = getStats(mod, i);
          catTotal += s.total;
          catCorrect += s.correct;
          const rate = s.total > 0 ? s.wrong / s.total : -1;
          if (rate >= 0.5 && s.total > 0) failedCount++;
          else if (s.correct >= 2 && rate < 0.2 && s.total > 0) masteredCount++;
        });
      });

      catStats.push({
        name: cat,
        accuracy: catTotal > 0 ? Math.round((catCorrect / catTotal) * 100) : 0,
        total: catTotal
      });
    });

    const neutralCount = totalItems - masteredCount - failedCount;
    const okDeg = totalItems > 0 ? Math.round((masteredCount / totalItems) * 360) : 0;

    body.innerHTML = `
      <div class="analysisGrid">
        <div class="gsap-card">
          <div class="analysisSectionTitle">Stav znalostí</div>
          <div class="masteryGroup">
            <div class="masteryDonutWrap">
              <div class="donut" style="--okDeg:${okDeg}deg;">
                <div class="donutCenter"><div class="donutValue" style="color:var(--ok)">${masteredCount}</div><div class="donutLabel">Umí</div></div>
              </div>
            </div>
            <div class="masteryDonutWrap">
              <div class="donut" style="background:conic-gradient(#ef4444 0deg ${Math.round((failedCount / totalItems) * 360)}deg, rgba(255,255,255,0.07) 0deg);">
                <div class="donutCenter"><div class="donutValue" style="color:var(--bad)">${failedCount}</div><div class="donutLabel">Neumí</div></div>
              </div>
            </div>
            <div class="masteryDonutWrap">
              <div class="donut" style="background:rgba(255,255,255,0.05);">
                <div class="donutCenter"><div class="donutValue">${neutralCount}</div><div class="donutLabel">Nezná</div></div>
              </div>
            </div>
          </div>
          <p style="text-align:center;color:var(--muted);font-size:12px;margin-top:16px;">${totalItems} celkem testovatelných položek</p>
        </div>

        <div class="gsap-card">
          <div class="analysisSectionTitle">Úspěšnost dle kategorií</div>
          ${catStats.map(c => `
            <div class="barRow">
              <div class="barLabel" title="${c.name}">${c.name}</div>
              <div class="barTrack"><div class="barFill" style="width:${c.accuracy}%"></div></div>
              <div class="barValue">${c.accuracy > 0 ? c.accuracy + "%" : "—"}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="analysisFullRow gsap-card">
        <div class="analysisSectionTitle">Heatmapa — všechny moduly</div>
        <div id="globalHeatGrid" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;"></div>
      </div>
    `;

    const globalHeat = $("globalHeatGrid");
    Object.keys(trainingData).forEach(cat => {
      Object.keys(trainingData[cat]).forEach(mod => {
        getTestableItems(trainingData[cat][mod]).forEach((item, i) => {
          const s = getStats(mod, i);
          const rate = s.total > 0 ? s.wrong / s.total : -1;
          const pill = document.createElement("div");
          pill.className = "hpill";
          pill.title = `${mod}: ${truncate(item.content, 50)}`;
          pill.style.cssText = `width:12px;height:12px;background:${rate < 0 ? "rgba(255,255,255,0.05)" : rate >= 0.6 ? "#ef4444" : rate >= 0.35 ? "#f59e0b" : "#22c55e"}`;
          globalHeat.appendChild(pill);
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  MISC HANDLERS
  // ═══════════════════════════════════════════════════════════
  $("moduleSearch").oninput = e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll("#moduleStudyList .row").forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  };

  // Reveal button removed — content is always visible

  $("btnResetAll").onclick = () => {
    if (confirm("Resetovat veškerý postup? Tato akce je nevratná.")) {
      localStorage.clear(); location.reload();
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  BOOT
  // ═══════════════════════════════════════════════════════════
  window.onload = loadData;
})();
