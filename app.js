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
    rankingSortMode: "userVotes", // 'userVotes', 'statutory', 'courtSentence'
    sessionId: null,
    isCloudConnected: false,
    // Elo a skóre činů
    crimeScores: {},
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

    try {
      const storedScores = localStorage.getItem("tresty_crime_scores");
      if (storedScores) {
        state.crimeScores = JSON.parse(storedScores) || {};
      }

      // Vždy ověříme, že každý čin i nově přidaný přestupek má záznam ve skóre
      window.CRIMES_DATA.forEach(crime => {
        if (!state.crimeScores[crime.id] || typeof state.crimeScores[crime.id].elo !== 'number') {
          state.crimeScores[crime.id] = {
            elo: 1000 + (crime.harmAnalysis.harmScore * 8),
            wins: 0,
            matches: 0
          };
        }
      });
      saveStoredScores();

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

    // Pokud je v config.js nastaven Supabase, zkusíme načíst globální data
    await syncWithCloudDatabase();
  }

  function getCrimeScore(crimeId) {
    if (!state.crimeScores[crimeId] || typeof state.crimeScores[crimeId].elo !== 'number') {
      const crime = window.CRIMES_DATA.find(c => c.id === crimeId);
      const baseElo = crime ? (1000 + (crime.harmAnalysis.harmScore * 8)) : 1000;
      state.crimeScores[crimeId] = {
        elo: baseElo,
        wins: 0,
        matches: 0
      };
      saveStoredScores();
    }
    return state.crimeScores[crimeId];
  }

  function saveStoredScores() {
    try {
      localStorage.setItem("tresty_crime_scores", JSON.stringify(state.crimeScores));
    } catch (e) {
      console.error("Nelze uložit skóre:", e);
    }
  }

  function saveStoredStats() {
    try {
      localStorage.setItem("tresty_user_stats", JSON.stringify({
        total: state.totalDilemmasAnswered,
        agreedLaw: state.agreedWithLawCount,
        agreedCourts: state.agreedCourtsCount
      }));
    } catch (e) {
      console.error("Nelze uložit statistiky:", e);
    }
  }

  // =========================================================================
  // CLOUDOVÁ SYNCHRONIZACE (SUPABASE REST API)
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
      // Test spojení dotazem na tabulku votes
      const response = await fetch(`${config.supabaseUrl}/rest/v1/votes?select=id&limit=1`, {
        method: "GET",
        headers: {
          "apikey": config.supabaseAnonKey,
          "Authorization": `Bearer ${config.supabaseAnonKey}`
        }
      });

      if (response.ok) {
        state.isCloudConnected = true;
        console.log("✅ Úspěšně připojeno k Supabase projektu:", config.supabaseUrl);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Supabase vrátilo chybu HTTP ${response.status}:`, errorText);
        state.isCloudConnected = false;
      }
    } catch (err) {
      console.warn("⚠️ Nelze se spojit se Supabase URL (zkontrolujte formát URL v config.js):", err.message);
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
      badge.innerHTML = `🟢 Cloud synchronizován`;
      badge.title = "Hlasy jsou ukládány centrálně pro všechny uživatele";
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
   * Eliminuje triviální duely (např. Vražda vs Krádež kola), zatímco zachovává
   * občasnou variabilitu pro kalibraci napříč celým spektrem.
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
    const scoreA = getCrimeScore(crimeA.id).elo;

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

          <div class="harm-analysis-box">
            <div class="harm-row">
              <span class="harm-title">Újma oběti / dotčených: </span>
              <span class="harm-desc">${crime.harmAnalysis.victimHarm}</span>
            </div>
            <div class="harm-row">
              <span class="harm-title">Dopad na společnost: </span>
              <span class="harm-desc">${crime.harmAnalysis.societalImpact}</span>
            </div>
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

    // Aktualizace Elo skóre
    const kFactor = 24;
    const scoreAObj = getCrimeScore(selectedCrime.id);
    const scoreBObj = getCrimeScore(otherCrime.id);
    const scoreA = scoreAObj.elo;
    const scoreB = scoreBObj.elo;
    const expectedA = 1 / (1 + Math.pow(10, (scoreB - scoreA) / 400));
    scoreAObj.elo += Math.round(kFactor * (1 - expectedA));
    scoreBObj.elo += Math.round(kFactor * (0 - (1 - expectedA)));
    scoreAObj.wins++;
    scoreAObj.matches++;
    scoreBObj.matches++;
    saveStoredScores();

    // Záznam do cloudu
    recordVoteToCloud(selectedCrime.id, otherCrime.id);

    // Posouzení přísnosti podle českého právního řádu
    let lawStrictId = null;
    const isPrestupekA = crimeA.delictType === "prestupek";
    const isPrestupekB = crimeB.delictType === "prestupek";

    if (!isPrestupekA && isPrestupekB) {
      // Trestný čin je vždy ze zákona závažnější než přestupek
      lawStrictId = crimeA.id;
    } else if (isPrestupekA && !isPrestupekB) {
      lawStrictId = crimeB.id;
    } else if (isPrestupekA && isPrestupekB) {
      // Porovnání dvou přestupků podle maximální pokuty nebo harmScore
      const fineA = crimeA.statutoryFineMaxKc || 0;
      const fineB = crimeB.statutoryFineMaxKc || 0;
      if (fineA > fineB) lawStrictId = crimeA.id;
      else if (fineB > fineA) lawStrictId = crimeB.id;
    } else {
      // Porovnání dvou trestných činů podle maximální sazby vězení
      if (crimeA.statutoryMaxYears > crimeB.statutoryMaxYears) {
        lawStrictId = crimeA.id;
      } else if (crimeB.statutoryMaxYears > crimeA.statutoryMaxYears) {
        lawStrictId = crimeB.id;
      }
    }

    // Posouzení přísnosti podle reálné praxe
    const severityA = (crimeA.courtStats.unconditionalPrisonPct * 0.5) + (crimeA.courtStats.avgPrisonSentenceMonths * 1.5) + (crimeA.harmAnalysis.harmScore * 0.2);
    const severityB = (crimeB.courtStats.unconditionalPrisonPct * 0.5) + (crimeB.courtStats.avgPrisonSentenceMonths * 1.5) + (crimeB.harmAnalysis.harmScore * 0.2);
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
      el.innerHTML = `<span class="verdict-tag stricter">🔴 Trestný čin (ze zákona závažnější než přestupek)</span>`;
    } else if (isPrestTarget && !isPrestOpponent) {
      el.innerHTML = `<span class="verdict-tag milder">🟢 Pouze přestupek (správní delikt bez vězení)</span>`;
    } else if (isPrestTarget && isPrestOpponent) {
      if (lawStrictId === null) {
        el.innerHTML = `<span class="verdict-tag equal">⚖️ Srovnatelná sankce přestupku</span>`;
      } else if (lawStrictId === targetCrime.id) {
        el.innerHTML = `<span class="verdict-tag stricter">🔴 Přísněji postihovaný přestupek (pokuta až ${targetCrime.statutoryFineMaxKc?.toLocaleString('cs-CZ')} Kč)</span>`;
      } else {
        el.innerHTML = `<span class="verdict-tag milder">🟢 Mírnější přestupek (pokuta do ${targetCrime.statutoryFineMaxKc?.toLocaleString('cs-CZ')} Kč)</span>`;
      }
    } else {
      if (lawStrictId === null) {
        el.innerHTML = `<span class="verdict-tag equal">⚖️ Stejná zákonná horní sazba (${targetCrime.statutoryMaxYears} let)</span>`;
      } else if (lawStrictId === targetCrime.id) {
        el.innerHTML = `<span class="verdict-tag stricter">🔴 Zákonem trestán přísněji (až ${targetCrime.statutoryMaxYears} let vs. ${opponentCrime.statutoryMaxYears} let)</span>`;
      } else {
        el.innerHTML = `<span class="verdict-tag milder">🟢 Zákonem trestán mírněji (až ${targetCrime.statutoryMaxYears} let vs. ${opponentCrime.statutoryMaxYears} let)</span>`;
      }
    }
  }

  function showResultPanel(selectedCrime, otherCrime, lawStrictId, courtStrictId) {
    const resultPanel = document.getElementById("matchup-result-panel");
    const headingEl = document.getElementById("verdict-heading-text");
    const explEl = document.getElementById("verdict-explanation-text");

    if (!resultPanel || !headingEl || !explEl) return;

    const agreedWithLaw = (lawStrictId === selectedCrime.id || lawStrictId === null);
    
    if (lawStrictId === null) {
      headingEl.innerHTML = `⚖️ Oba delikty mají srovnatelnou zákonnou závažnost`;
      explEl.innerHTML = `Váš výběr <strong>${selectedCrime.name}</strong> reflektuje specifické vnímání újmy. ${selectedCrime.statutoryText}.`;
    } else if (agreedWithLaw) {
      headingEl.innerHTML = `✓ Vaše volba se shoduje s českým právním řádem`;
      explEl.innerHTML = `Zvolili jste <strong>${selectedCrime.name}</strong> (${selectedCrime.paragraph}), který právo postihuje přísněji (${selectedCrime.statutoryText}), než <strong>${otherCrime.name}</strong> (${otherCrime.statutoryText}).`;
    } else {
      headingEl.innerHTML = `⚠️ Právní řád ČR trestá přísněji druhý delikt`;
      explEl.innerHTML = `Vybrali jste <strong>${selectedCrime.name}</strong> (${selectedCrime.statutoryText}), avšak české právo stanovuje přísnější postih u <strong>${otherCrime.name}</strong> (${otherCrime.statutoryText}).`;
    }

    resultPanel.classList.add("visible");
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // =========================================================================
  // ŽEBŘÍČEK ČINŮ (RANKING)
  // =========================================================================

  function renderRankingView() {
    const container = document.getElementById("ranking-list-container");
    if (!container) return;

    let crimes = [...window.CRIMES_DATA];

    if (state.rankingSortMode === "userVotes") {
      crimes.sort((a, b) => {
        const scoreA = getCrimeScore(a.id).elo;
        const scoreB = getCrimeScore(b.id).elo;
        return scoreB - scoreA;
      });
    } else if (state.rankingSortMode === "statutory") {
      crimes.sort((a, b) => b.statutoryMaxYears - a.statutoryMaxYears);
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
      const scoreObj = getCrimeScore(crime.id);
      const userElo = Math.round(scoreObj.elo || 1000);
      const matches = scoreObj.matches || 0;

      html += `
        <div class="ranking-item">
          <div class="rank-position ${rankClass}">#${index + 1}</div>
          <div class="rank-details">
            <div class="rank-crime-name">${crime.name}</div>
            <div class="rank-crime-meta">
              <span>${crime.paragraph}</span> • 
              <span>${crime.categoryLabel}</span> • 
              <span style="color:var(--accent-primary)">Elo: ${userElo} (${matches} zápasů)</span>
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
    renderRankingView();
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
        personaTitleEl.textContent = "Začínající soudce";
        personaDescEl.textContent = "Rozhodněte alespoň 5–10 trestních dilemat, aby systém dokázal přesně vyhodnotit váš rozhodovací profil a míru shody se zákoníkem.";
      } else if (lawPct >= 75) {
        personaTitleEl.textContent = "Důsledný legalista";
        personaDescEl.textContent = "Váš morální a právní úsudek se ve vysoké míře kryje s formálním nastavením českého trestního zákoníku. Přisuzujete vysokou váhu zákonným chráněným zájmům a systematičnosti trestního práva.";
      } else if (courtsPct > lawPct) {
        personaTitleEl.textContent = "Pragmatický soudce z praxe";
        personaDescEl.textContent = "Při hodnocení zohledňujete reálnou újmu a praktický dopad situace podobně jako soudní senáty v terénu, které často berou v potaz polehčující a přitěžující okolnosti konkrétního skutku.";
      } else {
        personaTitleEl.textContent = "Společenský reformátor";
        personaDescEl.textContent = "Vaše vnímání závažnosti trestných činů se v některých oblastech odklání od současného znění zákona – např. přísněji vnímáte zásahy do osobní důstojnosti, zranitelných osob nebo naopak hospodářskou kriminalitu velkého rozsahu.";
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
    initKeyboardNavigation();
    updateCloudStatusBadge();

    // Event listenery pro navigaci
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.addEventListener("click", () => switchTab(tab.dataset.target));
    });

    // Event listener pro další dilema
    document.getElementById("btn-next-duel")?.addEventListener("click", loadNewDuel);

    // Event listenery pro řazení v žebříčku
    document.querySelectorAll(".ranking-toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => setRankingSort(btn.dataset.sort));
    });

    // Event listenery pro vyhledávání a filtrování v katalogu
    document.getElementById("catalog-search-input")?.addEventListener("input", renderCatalogView);
    document.getElementById("catalog-category-select")?.addEventListener("change", renderCatalogView);
  }

  function resetUserStats() {
    state.totalDilemmasAnswered = 0;
    state.agreedWithLawCount = 0;
    state.agreedWithCourtsCount = 0;
    saveStoredStats();
    renderProfileView();
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
    resetUserStats
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
