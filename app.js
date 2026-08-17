/**
 * Aplikační logika pro srovnávač trestných činů ČR
 * Obsahuje chytrý matchmaking podle závažnosti (Elo proximity)
 * a podporu pro cloudové ukládání hlasů (Supabase / localStorage).
 */

(function () {
  "use strict";

  // Stav aplikace
  const state = {
    currentPair: [null, null],
    isRevealed: false,
    userChoiceId: null,
    totalDilemmasAnswered: 0,
    agreedWithLawCount: 0,
    agreedWithCourtsCount: 0,
    categoryFilter: "all",
    rankingSortMode: "globalPublic", // 'globalPublic', 'userVotes', 'statutory', 'courtSentence'
    rankingViewMode: "flow", // 'flow' (SVG flow graf - výchozí) nebo 'list' (klasický seznam)
    flowFirstColumnMode: "public", // 'public' (Globální veřejnost ze Supabase) nebo 'user' (Vaše lokální hlasy)
    sessionId: null,
    isCloudConnected: false,
    // Lokální skóre z této hry / prohlížeče (Vaše hlasy)
    userScores: {},
    // Globální agregované skóre veřejnosti ze Supabase
    globalScores: {},
    totalGlobalVotes: 0,
    history: []
  };

  // Získání nebo vytvoření unikátního anonymního ID session uživatele
  function getSessionId() {
    let sid = localStorage.getItem("tresty_session_id");
    if (!sid) {
      sid = "usr_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      localStorage.setItem("tresty_session_id", sid);
    }
    return sid;
  }

  // Inicializace stavu z localStorage + pokus o načtení z cloudu
  async function loadStoredData() {
    state.sessionId = getSessionId();

    // 1. Inicializace výchozího globálního skóre (baseline)
    initGlobalScores();

    // 2. Načtení lokálního skóre uživatele (Vaše hlasy)
    try {
      const storedUserScores = localStorage.getItem("tresty_user_scores") || localStorage.getItem("tresty_crime_scores");
      if (storedUserScores) {
        state.userScores = JSON.parse(storedUserScores) || {};
      }

      window.CRIMES_DATA.forEach(crime => {
        if (!state.userScores[crime.id] || typeof state.userScores[crime.id].elo !== 'number') {
          const baseElo = (window.DEFAULT_CRIME_SCORES && window.DEFAULT_CRIME_SCORES[crime.id]) 
            ? window.DEFAULT_CRIME_SCORES[crime.id].elo 
            : (1000 + (crime.harmAnalysis.harmScore * 8));
          state.userScores[crime.id] = {
            elo: baseElo,
            wins: 0,
            matches: 0
          };
        }
      });
      saveStoredUserScores();

      const storedStats = localStorage.getItem("tresty_user_stats");
      if (storedStats) {
        const stats = JSON.parse(storedStats);
        state.totalDilemmasAnswered = stats.total || 0;
        state.agreedWithLawCount = stats.agreedLaw || 0;
        state.agreedWithCourtsCount = stats.agreedCourts || 0;
      }
    } catch (e) {
      console.error("Chyba při načítání dat z localStorage:", e);
    }

    // 3. Načtení a přepočet reálných hlasů veřejnosti ze Supabase
    await syncWithCloudDatabase();
  }

  function initGlobalScores() {
    window.CRIMES_DATA.forEach(crime => {
      const baseElo = (window.DEFAULT_CRIME_SCORES && window.DEFAULT_CRIME_SCORES[crime.id]) 
        ? window.DEFAULT_CRIME_SCORES[crime.id].elo 
        : (1000 + (crime.harmAnalysis.harmScore * 8));
      state.globalScores[crime.id] = {
        elo: baseElo,
        wins: 0,
        matches: 0
      };
    });
  }

  function getUserScore(crimeId) {
    if (!state.userScores[crimeId] || typeof state.userScores[crimeId].elo !== 'number') {
      const crime = window.CRIMES_DATA.find(c => c.id === crimeId);
      const baseElo = crime ? (1000 + (crime.harmAnalysis.harmScore * 8)) : 1000;
      state.userScores[crimeId] = {
        elo: baseElo,
        wins: 0,
        matches: 0
      };
    }
    return state.userScores[crimeId];
  }

  function getGlobalScore(crimeId) {
    if (!state.globalScores[crimeId] || typeof state.globalScores[crimeId].elo !== 'number') {
      const crime = window.CRIMES_DATA.find(c => c.id === crimeId);
      const baseElo = crime ? (1000 + (crime.harmAnalysis.harmScore * 8)) : 1000;
      state.globalScores[crimeId] = {
        elo: baseElo,
        wins: 0,
        matches: 0
      };
    }
    return state.globalScores[crimeId];
  }

  // Zpětná kompatibilita
  function getCrimeScore(crimeId) {
    return state.rankingSortMode === "userVotes" ? getUserScore(crimeId) : getGlobalScore(crimeId);
  }

  function saveStoredUserScores() {
    try {
      localStorage.setItem("tresty_user_scores", JSON.stringify(state.userScores));
    } catch (e) {
      console.error("Nelze uložit skóre uživatele:", e);
    }
  }

  function saveStoredStats() {
    try {
      localStorage.setItem("tresty_user_stats", JSON.stringify({
        total: state.totalDilemmasAnswered,
        agreedLaw: state.agreedWithLawCount,
        agreedCourts: state.agreedWithCourtsCount
      }));
    } catch (e) {
      console.error("Nelze uložit statistiky:", e);
    }
  }

  // =========================================================================
  // CLOUDOVÁ SYNCHRONIZACE & GLOBÁLNÍ ELO VEŘEJNOSTI (SUPABASE REST API)
  // =========================================================================

  async function syncWithCloudDatabase() {
    const config = window.TRESTY_CONFIG;
    if (!config || !config.supabaseUrl || !config.supabaseAnonKey || config.supabaseUrl.includes("vase-id") || config.supabaseUrl === "https://trestnidilemata.supabase.co") {
      console.info("ℹ️ Supabase URL zatím není nastavena na platné ID projektu. Aplikace běží v lokálním režimu.");
      state.isCloudConnected = false;
      updateCloudStatusBadge();
      return;
    }

    try {
      // 1. Reset globálního Elo na baseline před započtením hlasů
      initGlobalScores();

      // 2. Načteme všechny hlasy ze Supabase (s paginací po 1 000 záznamech)
      let allVotes = [];
      let page = 0;
      const pageSize = 1000;

      while (true) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const response = await fetch(`${config.supabaseUrl}/rest/v1/votes?select=winner_id,loser_id&order=created_at.asc`, {
          method: "GET",
          headers: {
            "apikey": config.supabaseAnonKey,
            "Authorization": `Bearer ${config.supabaseAnonKey}`,
            "Range": `${from}-${to}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) break;
        allVotes = allVotes.concat(data);
        if (data.length < pageSize) break;
        page++;
      }

      state.totalGlobalVotes = allVotes.length;
      state.isCloudConnected = true;

      // 3. Spočítáme reálné globální Elo veřejnosti ze všech odehraných duelů
      const kFactor = 24;
      allVotes.forEach(v => {
        const wId = v.winner_id;
        const lId = v.loser_id;
        if (state.globalScores[wId] && state.globalScores[lId]) {
          const scoreW = state.globalScores[wId];
          const scoreL = state.globalScores[lId];
          const expectedW = 1 / (1 + Math.pow(10, (scoreL.elo - scoreW.elo) / 400));
          scoreW.elo += Math.round(kFactor * (1 - expectedW));
          scoreL.elo += Math.round(kFactor * (0 - (1 - expectedW)));
          scoreW.wins++;
          scoreW.matches++;
          scoreL.matches++;
        }
      });

      console.log(`✅ Úspěšně načteno a přepočteno ${allVotes.length} hlasů veřejnosti ze Supabase.`);

      // Pokud je zrovna otevřený žebříček, překreslíme jej s reálnými daty
      const activeSec = document.querySelector(".view-section.active");
      if (activeSec && activeSec.id === "view-ranking") {
        renderRankingView();
      }
    } catch (err) {
      console.warn("⚠️ Nelze synchronizovat hlasy ze Supabase:", err.message);
      state.isCloudConnected = false;
    }

    updateCloudStatusBadge();
  }

  async function recordVoteToCloud(winnerId, loserId) {
    const config = window.TRESTY_CONFIG;
    if (!config || !config.supabaseUrl || !config.supabaseAnonKey || !state.isCloudConnected) return;

    try {
      // Záznam jednotlivého hlasu do tabulky `votes`
      const res = await fetch(`${config.supabaseUrl}/rest/v1/votes`, {
        method: "POST",
        headers: {
          "apikey": config.supabaseAnonKey,
          "Authorization": `Bearer ${config.supabaseAnonKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          winner_id: winnerId,
          loser_id: loserId,
          session_id: state.sessionId,
          created_at: new Date().toISOString()
        })
      });

      if (!res.ok) {
        console.warn("Chyba při ukládání hlasu do Supabase:", res.status, await res.text());
      }
    } catch (e) {
      console.warn("Chyba při odesílání hlasu do cloudu:", e.message);
    }
  }

  function updateCloudStatusBadge() {
    const badge = document.getElementById("cloud-status-badge");
    if (!badge) return;
    if (state.isCloudConnected) {
      badge.innerHTML = `🟢 Veřejnost: ${state.totalGlobalVotes} duelů`;
      badge.title = "Aplikace je propojena se Supabase databází se všemi hlasy hráčů";
      badge.style.color = "#34d399";
    } else {
      badge.innerHTML = `💾 Lokální režim`;
      badge.title = "Hlasy se ukládají v prohlížeči (nastavte config.js pro Supabase)";
      badge.style.color = "#94a3b8";
    }
  }

  // =========================================================================
  // CHYTRÝ MATCHMAKING (Vážený výběr podle podobnosti závažnosti / Elo)
  // =========================================================================

  /**
   * Vybere dvojici činů se statistickou preferencí pro podobnou závažnost.
   * Eliminuje triviální duely, zatímco zachovává variabilitu pro kalibraci.
   */
  function getSmartPair() {
    const crimes = window.CRIMES_DATA;
    if (crimes.length < 2) return [crimes[0], crimes[0]];

    const config = window.TRESTY_CONFIG?.matchmaking || { eloProximitySigma: 220, broadExplorationRate: 0.08 };
    const sigma = config.eloProximitySigma || 220;
    const epsilon = config.broadExplorationRate || 0.08;

    // 1. Náhodný výběr prvního činu A
    const idxA = Math.floor(Math.random() * crimes.length);
    const crimeA = crimes[idxA];
    const scoreA = getGlobalScore(crimeA.id).elo;

    // 2. Výpočet vah pro všechny ostatní kandidáty podle vzdálenosti v závažnosti
    const candidates = [];
    let totalWeight = 0;

    for (let i = 0; i < crimes.length; i++) {
      if (i === idxA) continue;
      const candidate = crimes[i];
      const scoreB = getCrimeScore(candidate.id).elo;
      const diff = Math.abs(scoreA - scoreB);

      // Gaussovské vážení: e^(-diff^2 / (2*sigma^2)) + epsilon
      const weight = Math.exp(-Math.pow(diff, 2) / (2 * Math.pow(sigma, 2))) + epsilon;
      candidates.push({ crime: candidate, weight: weight });
      totalWeight += weight;
    }

    // 3. Vážený náhodný výběr oponenta B
    let r = Math.random() * totalWeight;
    let crimeB = candidates[0].crime;
    for (const c of candidates) {
      r -= c.weight;
      if (r <= 0) {
        crimeB = c.crime;
        break;
      }
    }

    // Náhodné prohození stran A a B
    return Math.random() > 0.5 ? [crimeA, crimeB] : [crimeB, crimeA];
  }

  // =========================================================================
  // VYKRESLOVÁNÍ DUELU
  // =========================================================================

  function renderCrimeCard(crime, sideLetter, kbdKey) {
    const isPrestupek = crime.delictType === "prestupek";
    const typeBadge = isPrestupek
      ? `<span class="card-category-badge" style="border-color:#f59e0b; color:#fbbf24;">⚡ Přestupek</span>`
      : `<span class="card-category-badge" style="border-color:#38bdf8; color:#38bdf8;">⚖️ Trestný čin</span>`;

    return `
      <div class="crime-card" id="card-${crime.id}" data-crime-id="${crime.id}" onclick="window.App.handleVote('${crime.id}')">
        <div class="card-header-meta">
          <span class="card-option-tag" style="font-size:0.85rem; padding:0.25rem 0.65rem;">Případ ${sideLetter} (${kbdKey})</span>
        </div>

        <div class="card-scenario-box" style="margin-top:0.5rem;">
          <div class="scenario-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Popis skutku
          </div>
          <p class="scenario-text" style="font-size: 1rem; line-height: 1.6;">${crime.scenario}</p>
        </div>

        <button class="card-cta-btn" type="button">
          <span>Tento čin je závažnější</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>

        <div class="reveal-container" id="reveal-${crime.id}">
          <div class="verdict-tag-placeholder" id="verdict-tag-${crime.id}"></div>

          <!-- Právní kvalifikace odhalená až po hlasování -->
          <div style="background: var(--bg-surface-raised); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
            <div style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap; margin-bottom: 0.5rem;">
              ${typeBadge}
              <span class="card-category-badge">${crime.categoryLabel}</span>
            </div>
            <h3 class="card-title" style="margin-bottom:0.2rem; font-size:1.25rem;">${crime.name}</h3>
            <div class="card-paragraph" style="margin-bottom:0;">${crime.paragraph}</div>
          </div>

          <div class="detail-section-title">${isPrestupek ? "Zákonná sankce podle zákona o přestupcích" : "Zákonná sazba podle trestního zákoníku ČR"}</div>
          <div class="statutory-box">
            <div class="statutory-sentence" style="font-size: 1rem;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              ${crime.statutoryText}
            </div>
            <div class="statutory-legal-text">„${crime.legalText}“</div>
          </div>

          <div class="court-stats-box">
            <div class="court-stats-header">
              <span class="detail-section-title" style="margin-bottom:0;">${isPrestupek ? "Správní a přestupková praxe" : "Reálná praxe českých soudů"}</span>
              <span class="court-stats-badge">${isPrestupek ? "Městský úřad / PČR" : "MSp ČR / JakTrestame.cz"}</span>
            </div>

            ${!isPrestupek ? `
            <div class="stats-breakdown-bars">
              <div class="stat-bar-segment stat-bar-unconditional" style="width: ${crime.courtStats.unconditionalPrisonPct}%;" title="Vězení: ${crime.courtStats.unconditionalPrisonPct}%"></div>
              <div class="stat-bar-segment stat-bar-probation" style="width: ${crime.courtStats.probationPct}%;" title="Podmínka: ${crime.courtStats.probationPct}%"></div>
              <div class="stat-bar-segment stat-bar-fine" style="width: ${crime.courtStats.finePct}%;" title="Peněžitý trest: ${crime.courtStats.finePct}%"></div>
              <div class="stat-bar-segment stat-bar-other" style="width: ${crime.courtStats.otherPct}%;" title="Jiné / OPP: ${crime.courtStats.otherPct}%"></div>
            </div>

            <div class="stats-legend">
              <div class="legend-item"><span class="legend-dot" style="background:#f43f5e"></span> Vězení <span class="legend-val">${crime.courtStats.unconditionalPrisonPct} %</span></div>
              <div class="legend-item"><span class="legend-dot" style="background:#38bdf8"></span> Podmínka <span class="legend-val">${crime.courtStats.probationPct} %</span></div>
              <div class="legend-item"><span class="legend-dot" style="background:#facc15"></span> Peněžitý <span class="legend-val">${crime.courtStats.finePct} %</span></div>
              <div class="legend-item"><span class="legend-dot" style="background:#94a3b8"></span> Ostatní / OPP <span class="legend-val">${crime.courtStats.otherPct} %</span></div>
            </div>

            <div class="court-summary-text">
              <strong>Průměrná délka vězení:</strong> ${Math.round(crime.courtStats.avgPrisonSentenceMonths / 12 * 10) / 10} let (${crime.courtStats.avgPrisonSentenceMonths} měsíců).<br>
              ${crime.courtStats.avgSentenceDescription}
            </div>
            ` : `
            <div class="court-summary-text">
              <strong>Typické řešení:</strong> ${crime.courtStats.avgSentenceDescription}<br>
              U přestupků se <strong>neukládá trest odnětí svobody</strong> a zápis do Rejstříku trestů (pouze evidence přestupků u vybraných deliktů).
            </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function loadNewDuel() {
    state.isRevealed = false;
    state.userChoiceId = null;
    state.currentPair = getSmartPair();

    const [crimeA, crimeB] = state.currentPair;
    const arenaEl = document.getElementById("duel-arena");
    if (!arenaEl) return;

    arenaEl.innerHTML = `
      <div class="matchup-grid">
        ${renderCrimeCard(crimeA, "A", "← / 1")}
        <div class="versus-divider">
          <div class="vs-line"></div>
          <div class="vs-badge">VS</div>
          <div class="vs-line"></div>
        </div>
        ${renderCrimeCard(crimeB, "B", "→ / 2")}
      </div>
    `;

    const resultPanel = document.getElementById("matchup-result-panel");
    if (resultPanel) {
      resultPanel.classList.remove("visible");
    }

    updateDuelCounter();
  }

  function updateDuelCounter() {
    const counterEl = document.getElementById("duel-counter-val");
    if (counterEl) {
      counterEl.textContent = state.totalDilemmasAnswered;
    }
  }

  // =========================================================================
  // HLASOVÁNÍ & VÝPOČET
  // =========================================================================

  function handleVote(selectedCrimeId) {
    if (state.isRevealed) return;

    state.isRevealed = true;
    state.userChoiceId = selectedCrimeId;
    state.totalDilemmasAnswered++;

    const [crimeA, crimeB] = state.currentPair;
    const selectedCrime = crimeA.id === selectedCrimeId ? crimeA : crimeB;
    const otherCrime = crimeA.id === selectedCrimeId ? crimeB : crimeA;

    // 1. Aktualizace osobního lokálního skóre uživatele (Vaše hlasy)
    const kFactor = 24;
    const userScoreA = getUserScore(selectedCrime.id);
    const userScoreB = getUserScore(otherCrime.id);
    const expUserA = 1 / (1 + Math.pow(10, (userScoreB.elo - userScoreA.elo) / 400));
    userScoreA.elo += Math.round(kFactor * (1 - expUserA));
    userScoreB.elo += Math.round(kFactor * (0 - (1 - expUserA)));
    userScoreA.wins++;
    userScoreA.matches++;
    userScoreB.matches++;
    saveStoredUserScores();

    // 2. Aktualizace globálního komunitního skóre (Veřejnost)
    const globScoreA = getGlobalScore(selectedCrime.id);
    const globScoreB = getGlobalScore(otherCrime.id);
    const expGlobA = 1 / (1 + Math.pow(10, (globScoreB.elo - globScoreA.elo) / 400));
    globScoreA.elo += Math.round(kFactor * (1 - expGlobA));
    globScoreB.elo += Math.round(kFactor * (0 - (1 - expGlobA)));
    globScoreA.wins++;
    globScoreA.matches++;
    globScoreB.matches++;
    state.totalGlobalVotes++;
    updateCloudStatusBadge();

    // 3. Záznam do centrální Supabase databáze
    recordVoteToCloud(selectedCrime.id, otherCrime.id);

    // Posouzení přísnosti podle zákonné sazby
    let lawStrictId = null;
    const isPrestupekA = crimeA.delictType === "prestupek";
    const isPrestupekB = crimeB.delictType === "prestupek";

    if (!isPrestupekA && isPrestupekB) {
      // Trestný čin má vyšší zákonný postih než přestupek
      lawStrictId = crimeA.id;
    } else if (isPrestupekA && !isPrestupekB) {
      lawStrictId = crimeB.id;
    } else if (isPrestupekA && isPrestupekB) {
      // Porovnání dvou přestupků podle maximální pokuty
      const fineA = crimeA.statutoryFineMaxKc || 0;
      const fineB = crimeB.statutoryFineMaxKc || 0;
      if (fineA > fineB) lawStrictId = crimeA.id;
      else if (fineB > fineA) lawStrictId = crimeB.id;
    } else {
      // Porovnání dvou trestných činů podle maximální sazby odnětí svobody
      if (crimeA.statutoryMaxYears > crimeB.statutoryMaxYears) {
        lawStrictId = crimeA.id;
      } else if (crimeB.statutoryMaxYears > crimeA.statutoryMaxYears) {
        lawStrictId = crimeB.id;
      }
    }

    // Posouzení přísnosti podle reálné soudní praxe
    const severityA = (crimeA.courtStats.unconditionalPrisonPct * 0.5) + (crimeA.courtStats.avgPrisonSentenceMonths * 1.5) + (crimeA.harmAnalysis?.harmScore || 50) * 0.2;
    const severityB = (crimeB.courtStats.unconditionalPrisonPct * 0.5) + (crimeB.courtStats.avgPrisonSentenceMonths * 1.5) + (crimeB.harmAnalysis?.harmScore || 50) * 0.2;
    let courtStrictId = null;
    if (severityA > severityB + 3) {
      courtStrictId = crimeA.id;
    } else if (severityB > severityA + 3) {
      courtStrictId = crimeB.id;
    }

    if (lawStrictId === selectedCrimeId || lawStrictId === null) {
      state.agreedWithLawCount++;
    }
    if (courtStrictId === selectedCrimeId || courtStrictId === null) {
      state.agreedWithCourtsCount++;
    }
    saveStoredStats();

    // Vizuální aktualizace karet
    const cardA = document.getElementById(`card-${crimeA.id}`);
    const cardB = document.getElementById(`card-${crimeB.id}`);

    if (cardA && cardB) {
      cardA.classList.add("revealed");
      cardB.classList.add("revealed");

      if (selectedCrimeId === crimeA.id) cardA.classList.add("selected-user");
      if (selectedCrimeId === crimeB.id) cardB.classList.add("selected-user");
    }

    updateVerdictTag(crimeA, crimeB, lawStrictId);
    updateVerdictTag(crimeB, crimeA, lawStrictId);

    showResultPanel(selectedCrime, otherCrime, lawStrictId, courtStrictId);
  }

  function updateVerdictTag(targetCrime, opponentCrime, lawStrictId) {
    const el = document.getElementById(`verdict-tag-${targetCrime.id}`);
    if (!el) return;

    const isPrestTarget = targetCrime.delictType === "prestupek";
    const isPrestOpponent = opponentCrime.delictType === "prestupek";

    if (!isPrestTarget && isPrestOpponent) {
      el.innerHTML = `<span class="verdict-tag stricter">⚖️ Trestný čin (trestní řízení a sazba odnětí svobody)</span>`;
    } else if (isPrestTarget && !isPrestOpponent) {
      el.innerHTML = `<span class="verdict-tag milder">⚖️ Přestupek (správní řízení a peněžitá sankce)</span>`;
    } else if (isPrestTarget && isPrestOpponent) {
      if (lawStrictId === null) {
        el.innerHTML = `<span class="verdict-tag equal">⚖️ Srovnatelná zákonná pokuta</span>`;
      } else if (lawStrictId === targetCrime.id) {
        el.innerHTML = `<span class="verdict-tag stricter">⚖️ Vyšší zákonná pokuta (až ${targetCrime.statutoryFineMaxKc?.toLocaleString('cs-CZ')} Kč)</span>`;
      } else {
        el.innerHTML = `<span class="verdict-tag milder">⚖️ Nižší zákonná pokuta (do ${targetCrime.statutoryFineMaxKc?.toLocaleString('cs-CZ')} Kč)</span>`;
      }
    } else {
      if (lawStrictId === null) {
        el.innerHTML = `<span class="verdict-tag equal">⚖️ Shodná horní sazba (${targetCrime.statutoryMaxYears} let)</span>`;
      } else if (lawStrictId === targetCrime.id) {
        el.innerHTML = `<span class="verdict-tag stricter">⚖️ Vyšší zákonná sazba (až ${targetCrime.statutoryMaxYears} let vs. ${opponentCrime.statutoryMaxYears} let)</span>`;
      } else {
        el.innerHTML = `<span class="verdict-tag milder">⚖️ Nižší zákonná sazba (až ${targetCrime.statutoryMaxYears} let vs. ${opponentCrime.statutoryMaxYears} let)</span>`;
      }
    }
  }

  function showResultPanel(selectedCrime, otherCrime, lawStrictId, courtStrictId) {
    const resultPanel = document.getElementById("matchup-result-panel");
    const headingEl = document.getElementById("verdict-heading-text");
    const explEl = document.getElementById("verdict-explanation-text");

    if (!resultPanel || !headingEl || !explEl) return;

    if (lawStrictId === null) {
      headingEl.innerHTML = `⚖️ Srovnání: Oba delikty mají srovnatelnou zákonnou sazbu`;
      explEl.innerHTML = `Zákoník stanovuje pro oba delikty shodnou horní hranici postihu (${selectedCrime.statutoryText}). Vaše volba <strong>${selectedCrime.name}</strong> odráží specifické posouzení okolností konkrétního případu.`;
    } else if (lawStrictId === selectedCrime.id) {
      headingEl.innerHTML = `⚖️ Srovnání se zákonnými sazbami`;
      explEl.innerHTML = `Zvolili jste <strong>${selectedCrime.name}</strong>, u něhož zákon stanovuje vyšší horní hranici typové sazby (${selectedCrime.statutoryText}) než u deliktu <strong>${otherCrime.name}</strong> (${otherCrime.statutoryText}).`;
    } else {
      headingEl.innerHTML = `⚖️ Srovnání se zákonnými sazbami`;
      explEl.innerHTML = `Zvolili jste <strong>${selectedCrime.name}</strong> (${selectedCrime.statutoryText}). České trestní právo stanovuje vyšší horní hranici typové sazby u srovnávaného činu <strong>${otherCrime.name}</strong> (${otherCrime.statutoryText}).`;
    }

    resultPanel.classList.add("visible");
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // =========================================================================
  // ŽEBŘÍČEK ČINŮ (RANKING)
  // =========================================================================

  // =========================================================================
  // ŽEBŘÍČEK & FLOW GRAF SROVNÁNÍ 3 VARIANT
  // =========================================================================

  function renderRankingView() {
    setRankingViewMode(state.rankingViewMode || "flow");
  }

  function setRankingViewMode(mode) {
    state.rankingViewMode = mode;
    
    const btnFlow = document.getElementById("btn-view-flow");
    const btnList = document.getElementById("btn-view-list");
    const sortControls = document.getElementById("ranking-sort-controls");
    const flowWrapper = document.getElementById("ranking-flow-wrapper");
    const listContainer = document.getElementById("ranking-list-container");

    if (btnFlow) btnFlow.classList.toggle("active", mode === "flow");
    if (btnList) btnList.classList.toggle("active", mode === "list");

    if (mode === "flow") {
      if (sortControls) sortControls.style.display = "none";
      if (listContainer) listContainer.style.display = "none";
      if (flowWrapper) flowWrapper.style.display = "block";
      renderFlowBumpChart();
    } else {
      if (sortControls) sortControls.style.display = "flex";
      if (listContainer) listContainer.style.display = "flex";
      if (flowWrapper) flowWrapper.style.display = "none";
      renderRankingListView();
    }
  }

  function setFlowPerspective(mode) {
    state.flowFirstColumnMode = mode;
    document.querySelectorAll(".flow-perspective-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.perspective === mode);
    });
    renderFlowBumpChart();
  }

  function renderFlowBumpChart() {
    const svgContainer = document.getElementById("ranking-flow-svg-container");
    const insightsContainer = document.getElementById("ranking-insights-container");
    if (!svgContainer || !insightsContainer) return;

    const crimes = [...window.CRIMES_DATA];
    const totalCrimes = crimes.length;
    const isUserPersp = state.flowFirstColumnMode === "user";

    // 1. Spočítáme pořadí podle zvolené perspektivy 1. sloupce (Globální Veřejnost vs Vaše lokální hlasy)
    const firstColSorted = [...crimes].sort((a, b) => {
      const eloA = isUserPersp ? getUserScore(a.id).elo : getGlobalScore(a.id).elo;
      const eloB = isUserPersp ? getUserScore(b.id).elo : getGlobalScore(b.id).elo;
      return eloB - eloA;
    });
    const firstColRanks = {};
    firstColSorted.forEach((c, idx) => { firstColRanks[c.id] = idx + 1; });

    // Globální a uživatelské pořadí pro tooltip
    const globRanks = {};
    [...crimes].sort((a, b) => getGlobalScore(b.id).elo - getGlobalScore(a.id).elo).forEach((c, idx) => { globRanks[c.id] = idx + 1; });
    const userRanks = {};
    [...crimes].sort((a, b) => getUserScore(b.id).elo - getUserScore(a.id).elo).forEach((c, idx) => { userRanks[c.id] = idx + 1; });

    // 2. Spočítáme pořadí podle Trestního zákoníku (Sazba)
    const lawSorted = [...crimes].sort((a, b) => {
      const isPrestA = a.delictType === "prestupek";
      const isPrestB = b.delictType === "prestupek";
      if (!isPrestA && isPrestB) return -1;
      if (isPrestA && !isPrestB) return 1;
      if (isPrestA && isPrestB) return (b.statutoryFineMaxKc || 0) - (a.statutoryFineMaxKc || 0);
      if (b.statutoryMaxYears !== a.statutoryMaxYears) return b.statutoryMaxYears - a.statutoryMaxYears;
      return (b.statutoryMinYears || 0) - (a.statutoryMinYears || 0);
    });
    const lawRanks = {};
    lawSorted.forEach((c, idx) => { lawRanks[c.id] = idx + 1; });

    // 3. Spočítáme pořadí podle Soudní praxe
    const courtsSorted = [...crimes].sort((a, b) => {
      const aVal = (a.courtStats.unconditionalPrisonPct * 0.6) + (a.courtStats.avgPrisonSentenceMonths * 1.5) + (a.harmAnalysis?.harmScore || 50) * 0.2;
      const bVal = (b.courtStats.unconditionalPrisonPct * 0.6) + (b.courtStats.avgPrisonSentenceMonths * 1.5) + (b.harmAnalysis?.harmScore || 50) * 0.2;
      return bVal - aVal;
    });
    const courtsRanks = {};
    courtsSorted.forEach((c, idx) => { courtsRanks[c.id] = idx + 1; });

    // Sestavení srovnávacího seznamu
    const comparisonList = [...crimes].map(crime => {
      const pRank = firstColRanks[crime.id];
      const lRank = lawRanks[crime.id];
      const cRank = courtsRanks[crime.id];
      const delta = lRank - pRank; // Kladné = 1. sloupec trestá přísněji než zákon
      return { crime, pRank, lRank, cRank, delta };
    });

    // Insight karty (Paradoxy)
    const maxStricterPublic = [...comparisonList].sort((a, b) => b.delta - a.delta)[0];
    const maxStricterLaw = [...comparisonList].sort((a, b) => a.delta - b.delta)[0];
    const bestConsensus = [...comparisonList].sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0];

    const labelWho = isUserPersp ? "Vy" : "Veřejnost";
    const labelWho2 = isUserPersp ? "Váš výběr" : "Lidé";

    insightsContainer.innerHTML = `
      <div class="insight-card" style="border-left: 4px solid #f43f5e;">
        <div class="insight-card-header" style="color: #f43f5e;">
          <span>🚨 ${labelWho} přísnější než zákon</span>
        </div>
        <div class="insight-card-title">${maxStricterPublic.crime.name}</div>
        <div class="insight-card-desc">
          ${labelWho2} tento delikt řadí na <strong>#${maxStricterPublic.pRank}. místo</strong>, zatímco zákoník až na <strong>#${maxStricterPublic.lRank}. místo</strong> (posun o +${maxStricterPublic.delta} pozic přísněji).
        </div>
      </div>

      <div class="insight-card" style="border-left: 4px solid #38bdf8;">
        <div class="insight-card-header" style="color: #38bdf8;">
          <span>🏛️ Zákon přísnější než ${labelWho.toLowerCase()}</span>
        </div>
        <div class="insight-card-title">${maxStricterLaw.crime.name}</div>
        <div class="insight-card-desc">
          Zákoník stanovuje přísnou sazbu na <strong>#${maxStricterLaw.lRank}. místě</strong>, avšak ${isUserPersp ? 'vy čin vnímáte' : 'veřejnost čin vnímá'} na <strong>#${maxStricterLaw.pRank}. místě</strong> (o ${Math.abs(maxStricterLaw.delta)} příček mírněji).
        </div>
      </div>

      <div class="insight-card" style="border-left: 4px solid #34d399;">
        <div class="insight-card-header" style="color: #34d399;">
          <span>⚖️ Nejvyšší vzájemná shoda</span>
        </div>
        <div class="insight-card-title">${bestConsensus.crime.name}</div>
        <div class="insight-card-desc">
          Vysoká shoda: <strong>#${bestConsensus.pRank}. u vás/lidí</strong>, <strong>#${bestConsensus.lRank}. v zákoníku</strong> a <strong>#${bestConsensus.cRank}. u soudů</strong>.
        </div>
      </div>
    `;

    // Rozměry pro SVG graf
    const rowH = 38;
    const topPadding = 105;
    const svgWidth = 1140;
    const svgHeight = topPadding + (totalCrimes * rowH) + 30;

    const xP_text = 240;
    const xP_dot = 260;
    const xL_dotIn = 410;
    const xL_text = 550;
    const xL_dotOut = 690;
    const xC_dot = 840;
    const xC_text = 860;

    const categoryColors = {
      ZivotZdravi: "#f43f5e",
      SvobodaDostojnost: "#c084fc",
      MajetekHospodarstvi: "#38bdf8",
      DopravaZivotniProstredi: "#34d399",
      StatPoradek: "#facc15",
      prestupek: "#fb923c"
    };

    function getColor(crime) {
      if (crime.delictType === "prestupek") return categoryColors.prestupek;
      return categoryColors[crime.category] || "#94a3b8";
    }

    const firstColTitle = isUserPersp ? "👤 1. Vaše hlasy" : "👥 1. Hlasování veřejnosti";
    const firstColSub = isUserPersp 
      ? `Odehráno ${state.totalDilemmasAnswered} duelů (tato hra)` 
      : `Celkem ${state.totalGlobalVotes} duelů (Supabase)`;

    let svgHtml = `
      <svg class="flow-svg-canvas" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <!-- Sloupcové hlavičky s vysvětlivkami a odkazy -->
        <g class="flow-headers">
          <!-- 1. Veřejnost / Vaše hlasy -->
          <rect x="20" y="15" width="300" height="58" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
          <text x="170" y="37" fill="#38bdf8" font-size="14" font-weight="700" text-anchor="middle" font-family="system-ui, sans-serif">${firstColTitle}</text>
          <text x="170" y="58" fill="#94a3b8" font-size="12" font-weight="600" text-anchor="middle" font-family="system-ui, sans-serif">${firstColSub}</text>

          <!-- 2. Trestní zákoník -->
          <a xlink:href="https://www.zakonyprolidi.cz/cs/2009-40" target="_blank">
            <rect x="390" y="15" width="320" height="58" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1" style="cursor:pointer;"/>
            <text x="550" y="37" fill="#fbbf24" font-size="14" font-weight="700" text-anchor="middle" font-family="system-ui, sans-serif" style="cursor:pointer;">⚖️ 2. Trestní zákoník ČR</text>
            <text x="550" y="58" fill="#facc15" font-size="12" font-weight="600" text-anchor="middle" font-family="system-ui, sans-serif" style="text-decoration:underline; cursor:pointer;">Zákon č. 40/2009 Sb. ↗</text>
          </a>

          <!-- 3. Soudní praxe -->
          <a xlink:href="https://jaktrestame.cz" target="_blank">
            <rect x="780" y="15" width="340" height="58" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1" style="cursor:pointer;"/>
            <text x="950" y="37" fill="#34d399" font-size="14" font-weight="700" text-anchor="middle" font-family="system-ui, sans-serif" style="cursor:pointer;">🏛️ 3. Reálná soudní praxe</text>
            <text x="950" y="58" fill="#34d399" font-size="12" font-weight="600" text-anchor="middle" font-family="system-ui, sans-serif" style="text-decoration:underline; cursor:pointer;">Otevřená data JakTrestame.cz ↗</text>
          </a>
        </g>

        <!-- Vodící vertikální čáry pro přehlednost -->
        <line x1="${xP_dot}" y1="${topPadding - 10}" x2="${xP_dot}" y2="${svgHeight - 20}" stroke="#334155" stroke-dasharray="3 3" opacity="0.3"/>
        <line x1="${xL_dotIn}" y1="${topPadding - 10}" x2="${xL_dotIn}" y2="${svgHeight - 20}" stroke="#334155" stroke-dasharray="3 3" opacity="0.3"/>
        <line x1="${xL_dotOut}" y1="${topPadding - 10}" x2="${xL_dotOut}" y2="${svgHeight - 20}" stroke="#334155" stroke-dasharray="3 3" opacity="0.3"/>
        <line x1="${xC_dot}" y1="${topPadding - 10}" x2="${xC_dot}" y2="${svgHeight - 20}" stroke="#334155" stroke-dasharray="3 3" opacity="0.3"/>

        <!-- Flow křivky a skupiny deliktů -->
        <g id="flow-groups-container">
    `;

    comparisonList.forEach(item => {
      const { crime, pRank, lRank, cRank } = item;
      const color = getColor(crime);
      const isPrest = crime.delictType === "prestupek";

      const yP = topPadding + (pRank - 1) * rowH;
      const yL = topPadding + (lRank - 1) * rowH;
      const yC = topPadding + (cRank - 1) * rowH;

      // Bézier curve P -> L
      const c1x = xP_dot + 75;
      const c2x = xL_dotIn - 75;
      const path1 = `M ${xP_dot} ${yP} C ${c1x} ${yP}, ${c2x} ${yL}, ${xL_dotIn} ${yL}`;

      // Bézier curve L -> C
      const c3x = xL_dotOut + 75;
      const c4x = xC_dot - 75;
      const path2 = `M ${xL_dotOut} ${yL} C ${c3x} ${yL}, ${c4x} ${yC}, ${xC_dot} ${yC}`;

      const courtTxt = isPrest ? 'Správní' : crime.courtStats.unconditionalPrisonPct + ' % vězení';
      const shortName = crime.name.length > 24 ? (crime.name.substring(0, 22) + '…') : crime.name;

      svgHtml += `
        <g class="flow-crime-group" data-crime-id="${crime.id}" onmouseenter="window.App.highlightCrimeFlow('${crime.id}')" onmouseleave="window.App.resetCrimeFlow()" style="transition: opacity 0.2s ease;">
          <!-- Flow spojnice -->
          <path class="flow-path flow-path-1" d="${path1}" stroke="${color}" stroke-width="2.2" opacity="0.45"/>
          <path class="flow-path flow-path-2" d="${path2}" stroke="${color}" stroke-width="2.2" opacity="0.45"/>

          <!-- 1. Veřejnost / Vaše hlasy Sloupec -->
          <g class="flow-node-group">
            <text x="${xP_text}" y="${yP + 4}" fill="#cbd5e1" font-size="12" font-family="system-ui, sans-serif" text-anchor="end">
              <tspan fill="#38bdf8" font-weight="700">#${pRank}</tspan> ${shortName}
            </text>
            <circle class="flow-node-circle" cx="${xP_dot}" cy="${yP}" r="4.5" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
          </g>

          <!-- 2. Zákoník Sloupec -->
          <g class="flow-node-group">
            <circle class="flow-node-circle" cx="${xL_dotIn}" cy="${yL}" r="4.5" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
            <text x="${xL_text}" y="${yL + 4}" fill="#cbd5e1" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">
              <tspan fill="#fbbf24" font-weight="700">#${lRank}</tspan> ${shortName}
            </text>
            <circle class="flow-node-circle" cx="${xL_dotOut}" cy="${yL}" r="4.5" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
          </g>

          <!-- 3. Soudy Sloupec -->
          <g class="flow-node-group">
            <circle class="flow-node-circle" cx="${xC_dot}" cy="${yC}" r="4.5" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
            <text x="${xC_text}" y="${yC + 4}" fill="#cbd5e1" font-size="12" font-family="system-ui, sans-serif" text-anchor="start">
              <tspan fill="#34d399" font-weight="700">#${cRank}</tspan> ${shortName} (${courtTxt})
            </text>
          </g>
        </g>
      `;
    });

    svgHtml += `
        </g>
      </svg>
    `;

    svgContainer.innerHTML = svgHtml;
    resetCrimeFlow();
  }

  function highlightCrimeFlow(crimeId) {
    const groups = document.querySelectorAll(".flow-crime-group");
    const crime = window.CRIMES_DATA.find(c => c.id === crimeId);
    if (!crime) return;

    const tooltipBox = document.getElementById("flow-hover-tooltip-box");

    // Zvýrazníme vybraný delikt a ztlumíme ostatní
    groups.forEach(g => {
      const isTarget = g.dataset.crimeId === crimeId;
      g.classList.toggle("flow-highlighted", isTarget);
      g.classList.toggle("flow-dimmed", !isTarget);
      
      const paths = g.querySelectorAll(".flow-path");
      paths.forEach(p => {
        if (isTarget) {
          p.setAttribute("stroke-width", "4.8");
          p.setAttribute("opacity", "1");
        } else {
          p.setAttribute("stroke-width", "1.5");
          p.setAttribute("opacity", "0.1");
        }
      });

      const circles = g.querySelectorAll(".flow-node-circle");
      circles.forEach(c => {
        if (isTarget) c.setAttribute("r", "6.5");
        else c.setAttribute("r", "3.5");
      });
    });

    // Vypočteme pozice a text pro tooltip
    const isUserPersp = state.flowFirstColumnMode === "user";
    const pRankGlob = [...window.CRIMES_DATA].sort((a, b) => getGlobalScore(b.id).elo - getGlobalScore(a.id).elo).findIndex(c => c.id === crimeId) + 1;
    const pRankUser = [...window.CRIMES_DATA].sort((a, b) => getUserScore(b.id).elo - getUserScore(a.id).elo).findIndex(c => c.id === crimeId) + 1;
    const lRank = [...window.CRIMES_DATA].sort((a, b) => {
      const isPrestA = a.delictType === "prestupek";
      const isPrestB = b.delictType === "prestupek";
      if (!isPrestA && isPrestB) return -1;
      if (isPrestA && !isPrestB) return 1;
      if (isPrestA && isPrestB) return (b.statutoryFineMaxKc || 0) - (a.statutoryFineMaxKc || 0);
      return (b.statutoryMaxYears || 0) - (a.statutoryMaxYears || 0);
    }).findIndex(c => c.id === crimeId) + 1;
    const cRank = [...window.CRIMES_DATA].sort((a, b) => {
      const aVal = (a.courtStats.unconditionalPrisonPct * 0.6) + (a.courtStats.avgPrisonSentenceMonths * 1.5);
      const bVal = (b.courtStats.unconditionalPrisonPct * 0.6) + (b.courtStats.avgPrisonSentenceMonths * 1.5);
      return bVal - aVal;
    }).findIndex(c => c.id === crimeId) + 1;

    const currentRank = isUserPersp ? pRankUser : pRankGlob;
    const delta = lRank - currentRank;
    const deltaText = delta > 0 ? `▲ o ${delta} příček přísnější` : delta < 0 ? `▼ o ${Math.abs(delta)} příček mírnější` : `✓ Přesná shoda`;

    if (tooltipBox) {
      tooltipBox.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <strong style="color:var(--text-primary); font-size:1rem;">${crime.name}</strong> 
            <span style="color:var(--text-muted); font-size:0.85rem;">(${crime.paragraph})</span>
          </div>
          <div style="display:flex; gap:0.75rem; align-items:center; font-size:0.85rem; flex-wrap:wrap;">
            <span style="color:#38bdf8; font-weight:700;">👥 Veřejnost: #${pRankGlob}</span>
            <span style="color:#c084fc; font-weight:700;">👤 Vy: #${pRankUser}</span>
            <span style="color:var(--text-muted);">➔</span>
            <span style="color:#fbbf24; font-weight:700;">⚖️ Zákoník: #${lRank}</span>
            <span style="color:var(--text-muted);">➔</span>
            <span style="color:#34d399; font-weight:700;">🏛️ Soudy: #${cRank}</span>
            <span class="delta-badge ${delta > 0 ? 'stricter-public' : delta < 0 ? 'milder-public' : 'balanced'}" style="margin-left:0.5rem;">${deltaText}</span>
          </div>
        </div>
      `;
    }
  }

  function resetCrimeFlow() {
    const groups = document.querySelectorAll(".flow-crime-group");
    groups.forEach(g => {
      g.classList.remove("flow-highlighted", "flow-dimmed");
      const paths = g.querySelectorAll(".flow-path");
      paths.forEach(p => {
        p.setAttribute("stroke-width", "2.2");
        p.setAttribute("opacity", "0.45");
      });
      const circles = g.querySelectorAll(".flow-node-circle");
      circles.forEach(c => c.setAttribute("r", "4.5"));
    });

    const tooltipBox = document.getElementById("flow-hover-tooltip-box");
    if (tooltipBox) {
      tooltipBox.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%; flex-wrap:wrap; gap:0.5rem; font-size:0.85rem;">
          <div>
            <strong style="color:var(--text-primary);">Vysvětlivky sloupců:</strong> 
            <span style="color:#38bdf8; font-weight:600;">👥 Veřejnost (${state.totalGlobalVotes} duelů v databázi)</span> • 
            <span style="color:#c084fc; font-weight:600;">👤 Vaše hra (${state.totalDilemmasAnswered} duelů)</span> • 
            <a href="https://www.zakonyprolidi.cz/cs/2009-40" target="_blank" rel="noopener" class="footer-link" style="color:#fbbf24; font-weight:600; text-decoration:underline;">⚖️ Trestní zákoník ČR ↗</a> • 
            <a href="https://jaktrestame.cz" target="_blank" rel="noopener" class="footer-link" style="color:#34d399; font-weight:600; text-decoration:underline;">🏛️ Soudní praxe ↗</a>
          </div>
          <span style="color:var(--text-muted); font-style:italic;">💡 Najeďte myší na delikt pro zvýraznění toku</span>
        </div>
      `;
    }
  }

  function renderRankingListView() {
    const container = document.getElementById("ranking-list-container");
    if (!container) return;

    let crimes = [...window.CRIMES_DATA];

    if (state.rankingSortMode === "globalPublic") {
      crimes.sort((a, b) => getGlobalScore(b.id).elo - getGlobalScore(a.id).elo);
    } else if (state.rankingSortMode === "userVotes") {
      crimes.sort((a, b) => getUserScore(b.id).elo - getUserScore(a.id).elo);
    } else if (state.rankingSortMode === "statutory") {
      crimes.sort((a, b) => {
        const isPrestA = a.delictType === "prestupek";
        const isPrestB = b.delictType === "prestupek";
        if (!isPrestA && isPrestB) return -1;
        if (isPrestA && !isPrestB) return 1;
        if (isPrestA && isPrestB) return (b.statutoryFineMaxKc || 0) - (a.statutoryFineMaxKc || 0);
        return b.statutoryMaxYears - a.statutoryMaxYears;
      });
    } else if (state.rankingSortMode === "courtSentence") {
      crimes.sort((a, b) => {
        const aVal = (a.courtStats.unconditionalPrisonPct * 0.6) + (a.courtStats.avgPrisonSentenceMonths * 1.5);
        const bVal = (b.courtStats.unconditionalPrisonPct * 0.6) + (b.courtStats.avgPrisonSentenceMonths * 1.5);
        return bVal - aVal;
      });
    }

    let html = "";
    crimes.forEach((crime, index) => {
      const rankClass = index === 0 ? "top-1" : index === 1 ? "top-2" : index === 2 ? "top-3" : "";
      const globScore = getGlobalScore(crime.id);
      const userScore = getUserScore(crime.id);
      const globElo = Math.round(globScore.elo || 1000);
      const userElo = Math.round(userScore.elo || 1000);

      html += `
        <div class="ranking-item">
          <div class="rank-position ${rankClass}">#${index + 1}</div>
          <div class="rank-details">
            <div class="rank-crime-name">${crime.name}</div>
            <div class="rank-crime-meta">
              <span>${crime.paragraph}</span> • 
              <span>${crime.categoryLabel}</span> • 
              <span style="color:#38bdf8; font-weight:600;">👥 Veřejnost: ${globElo} (${globScore.matches}x)</span> • 
              <span style="color:#c084fc; font-weight:600;">👤 Vaše hra: ${userElo} (${userScore.matches}x)</span>
            </div>
          </div>
          <div class="rank-statutory">
            <div class="rank-statutory-val">${crime.statutoryText}</div>
            <div class="rank-statutory-label">${crime.delictType === 'prestupek' ? 'Sankce přestupku' : 'Zákonná sazba'}</div>
          </div>
          <div class="rank-court-stat">
            <div class="rank-court-val">${crime.delictType === 'prestupek' ? 'Správní řízení' : crime.courtStats.unconditionalPrisonPct + ' % vězení'}</div>
            <div class="rank-court-label">${crime.delictType === 'prestupek' ? 'Bez vězení' : 'Průměr: ' + (Math.round(crime.courtStats.avgPrisonSentenceMonths / 12 * 10) / 10) + ' let'}</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function setRankingSort(mode) {
    state.rankingSortMode = mode;
    document.querySelectorAll(".ranking-toggle-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sort === mode);
    });
    renderRankingListView();
  }

  // =========================================================================
  // KATALOG & ENCYKLOPEDIE
  // =========================================================================

  function renderCatalogView() {
    const grid = document.getElementById("catalog-grid-container");
    const searchVal = (document.getElementById("catalog-search-input")?.value || "").toLowerCase().trim();
    const catVal = document.getElementById("catalog-category-select")?.value || "all";

    if (!grid) return;

    let filtered = window.CRIMES_DATA.filter(crime => {
      const matchCat = (catVal === "all" || crime.category === catVal);
      const matchSearch = (
        crime.name.toLowerCase().includes(searchVal) ||
        crime.paragraph.toLowerCase().includes(searchVal) ||
        crime.scenario.toLowerCase().includes(searchVal) ||
        crime.legalText.toLowerCase().includes(searchVal)
      );
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">Žádné trestné činy neodpovídají zadanému filtru.</div>`;
      return;
    }

    let html = "";
    filtered.forEach(crime => {
      html += `
        <div class="catalog-card">
          <div class="catalog-card-header">
            <span class="card-category-badge">${crime.categoryLabel}</span>
          </div>
          <h4 class="catalog-card-title">${crime.name}</h4>
          <div class="catalog-card-p">${crime.paragraph}</div>
          <p class="catalog-scenario-brief"><strong>Případ:</strong> ${crime.scenario}</p>
          <div class="statutory-box" style="margin-bottom:0.75rem;">
            <div class="statutory-sentence" style="font-size:0.95rem;">⚖️ ${crime.statutoryText}</div>
            <div class="statutory-legal-text" style="font-size:0.75rem;">„${crime.legalText}“</div>
          </div>
          <div class="court-summary-text" style="font-size:0.75rem;">
            <strong>Soudní praxe:</strong> ${crime.courtStats.unconditionalPrisonPct} % nepodmíněně (${Math.round(crime.courtStats.avgPrisonSentenceMonths / 12 * 10) / 10} let průměr), ${crime.courtStats.probationPct} % podmínka.
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  // =========================================================================
  // PROFIL SOUDCE & STATISTIKY
  // =========================================================================

  function renderProfileView() {
    const totalEl = document.getElementById("kpi-total-dilemmas");
    const lawMatchEl = document.getElementById("kpi-law-match");
    const courtsMatchEl = document.getElementById("kpi-courts-match");
    const personaTitleEl = document.getElementById("persona-title");
    const personaDescEl = document.getElementById("persona-desc");

    if (totalEl) totalEl.textContent = state.totalDilemmasAnswered;
    
    const lawPct = state.totalDilemmasAnswered > 0 
      ? Math.round((state.agreedWithLawCount / state.totalDilemmasAnswered) * 100) 
      : 0;
    const courtsPct = state.totalDilemmasAnswered > 0 
      ? Math.round((state.agreedWithCourtsCount / state.totalDilemmasAnswered) * 100) 
      : 0;

    if (lawMatchEl) lawMatchEl.textContent = `${lawPct} %`;
    if (courtsMatchEl) courtsMatchEl.textContent = `${courtsPct} %`;

    if (personaTitleEl && personaDescEl) {
      if (state.totalDilemmasAnswered < 3) {
        personaTitleEl.textContent = "Začínající hodnotitel";
        personaDescEl.textContent = "Rozhodněte alespoň 5–10 dilemat, aby systém dokázal vyhodnotit váš rozhodovací profil a porovnat jej se zákonnými sazbami a soudní praxi.";
      } else if (lawPct >= 70) {
        personaTitleEl.textContent = "Důraz na formální sazby zákona";
        personaDescEl.textContent = "Ve svých volbách v převážné většině upřednostňujete čin s vyšší zákonnou trestní sazbou. Přisuzujete vysokou váhu zákonným chráněným zájmům a systematičnosti trestního práva.";
      } else if (courtsPct > lawPct) {
        personaTitleEl.textContent = "Důraz na reálnou soudní praxi";
        personaDescEl.textContent = "Při hodnocení častěji volíte delikty, u nichž soudy v praxi reálně sahají k nepodmíněným trestům, což zohledňuje praktický dopad a závažnost činů v terénu.";
      } else {
        personaTitleEl.textContent = "Individuální etické hodnocení";
        personaDescEl.textContent = "Vaše volby reflektují specifické vnímání škodlivosti nezávisle na formální sazbě – např. vyšší citlivost na zásahy do osobní integrity, zranitelných osob či zvířat oproti majetkovým deliktům.";
      }
    }
  }

  // =========================================================================
  // PŘEPÍNÁNÍ ZÁLOŽEK
  // =========================================================================

  function switchTab(targetTabId) {
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.target === targetTabId);
    });

    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });

    const targetSec = document.getElementById(targetTabId);
    if (targetSec) {
      targetSec.classList.add("active");
    }

    if (targetTabId === "view-ranking") {
      renderRankingView();
    } else if (targetTabId === "view-catalog") {
      renderCatalogView();
    } else if (targetTabId === "view-profile") {
      renderProfileView();
    }
  }

  // Klávesové zkratky
  function initKeyboardNavigation() {
    window.addEventListener("keydown", function (e) {
      const activeSection = document.querySelector(".view-section.active");
      if (!activeSection || activeSection.id !== "view-duel") return;

      if (!state.isRevealed) {
        if (e.key === "ArrowLeft" || e.key === "1") {
          handleVote(state.currentPair[0].id);
        } else if (e.key === "ArrowRight" || e.key === "2") {
          handleVote(state.currentPair[1].id);
        }
      } else {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          loadNewDuel();
        }
      }
    });
  }

  // Inicializace po načtení DOM
  async function init() {
    await loadStoredData();
    loadNewDuel();
    renderRankingView();
    initKeyboardNavigation();
    updateCloudStatusBadge();

    // Event listenery pro navigaci
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.addEventListener("click", () => switchTab(tab.dataset.target));
    });

    // Event listener pro další dilema
    document.getElementById("btn-next-duel")?.addEventListener("click", loadNewDuel);

    // Event listenery pro přepínání režimu žebříčku (Seznam vs Flow graf)
    document.getElementById("btn-view-list")?.addEventListener("click", () => setRankingViewMode("list"));
    document.getElementById("btn-view-flow")?.addEventListener("click", () => setRankingViewMode("flow"));

    // Event listenery pro přepínání perspektivy Flow grafu (Veřejnost vs Vaše hlasy)
    document.querySelectorAll(".flow-perspective-btn").forEach(btn => {
      btn.addEventListener("click", () => setFlowPerspective(btn.dataset.perspective));
    });

    // Event listenery pro řazení v žebříčku
    document.querySelectorAll(".ranking-toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => setRankingSort(btn.dataset.sort));
    });

    // Event listenery pro vyhledávání a filtrování v katalogu
    document.getElementById("catalog-search-input")?.addEventListener("input", renderCatalogView);
    document.getElementById("catalog-category-select")?.addEventListener("change", renderCatalogView);

    // GDPR Cookie lišta
    initCookieBanner();
  }

  // =========================================================================
  // GDPR & SPRÁVA SOUHLASU S COOKIES
  // =========================================================================

  function initCookieBanner() {
    const consent = localStorage.getItem("tresty_cookie_consent");
    const banner = document.getElementById("gdpr-cookie-banner");
    if (!consent && banner) {
      banner.style.display = "block";
    }
  }

  function handleCookieConsent(choice) {
    localStorage.setItem("tresty_cookie_consent", choice);
    
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        "analytics_storage": choice === "granted" ? "granted" : "denied"
      });
    }

    const banner = document.getElementById("gdpr-cookie-banner");
    if (banner) banner.style.display = "none";
  }

  function openPrivacyModal() {
    const modal = document.getElementById("privacy-modal");
    if (modal) modal.style.display = "flex";
  }

  function closePrivacyModal() {
    const modal = document.getElementById("privacy-modal");
    if (modal) modal.style.display = "none";
  }

  function resetUserStats() {
    state.totalDilemmasAnswered = 0;
    state.agreedWithLawCount = 0;
    state.agreedWithCourtsCount = 0;
    state.userScores = {};
    window.CRIMES_DATA.forEach(crime => {
      const baseElo = (window.DEFAULT_CRIME_SCORES && window.DEFAULT_CRIME_SCORES[crime.id]) 
        ? window.DEFAULT_CRIME_SCORES[crime.id].elo 
        : (1000 + (crime.harmAnalysis.harmScore * 8));
      state.userScores[crime.id] = {
        elo: baseElo,
        wins: 0,
        matches: 0
      };
    });
    saveStoredUserScores();
    saveStoredStats();
    renderProfileView();
    renderRankingView();
    updateDuelCounter();
    loadNewDuel();
  }

  // Export do window.App
  window.App = {
    init,
    handleVote,
    loadNewDuel,
    switchTab,
    setRankingSort,
    setRankingViewMode,
    setFlowPerspective,
    highlightCrimeFlow,
    resetCrimeFlow,
    resetUserStats,
    handleCookieConsent,
    openPrivacyModal,
    closePrivacyModal
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
