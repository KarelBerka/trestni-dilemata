/**
 * Simulace 1000 hlasů odpovídajících Trestnímu zákoníku ČR
 * a odeslání do databáze Supabase.
 */

const fs = require('fs');

global.window = global;
global.localStorage = {
  getItem: () => null,
  setItem: () => null
};

require('./config.js');
require('./crimes-data.js');

const supabaseUrl = window.TRESTY_CONFIG.supabaseUrl;
const supabaseKey = window.TRESTY_CONFIG.supabaseAnonKey;

console.log(`📡 Připojování k Supabase: ${supabaseUrl}`);
console.log(`📚 Počet trestných činů v databázi: ${window.CRIMES_DATA.length}`);

// Inicializace Elo
const scores = {};
window.CRIMES_DATA.forEach(c => {
  scores[c.id] = {
    crime: c,
    elo: 1000 + (c.harmAnalysis.harmScore * 8),
    wins: 0,
    losses: 0,
    matches: 0
  };
});

const sigma = 220;
const epsilon = 0.08;
const totalVotesToSimulate = 1000;
const votesBatch = [];

const sessions = [
  "sim_legalist_01",
  "sim_legalist_02",
  "sim_legalist_03",
  "sim_judge_senate_a",
  "sim_judge_senate_b"
];

for (let i = 0; i < totalVotesToSimulate; i++) {
  const crimes = window.CRIMES_DATA;
  
  // 1. Chytrý výběr prvního činu
  const idxA = Math.floor(Math.random() * crimes.length);
  const crimeA = crimes[idxA];
  const scoreA = scores[crimeA.id].elo;

  // 2. Gaussovský výběr soupeře se srovnatelnou závažností
  const candidates = [];
  let totalWeight = 0;

  for (let j = 0; j < crimes.length; j++) {
    if (j === idxA) continue;
    const candidate = crimes[j];
    const scoreB = scores[candidate.id].elo;
    const diff = Math.abs(scoreA - scoreB);
    const weight = Math.exp(-Math.pow(diff, 2) / (2 * Math.pow(sigma, 2))) + epsilon;
    candidates.push({ crime: candidate, weight });
    totalWeight += weight;
  }

  let r = Math.random() * totalWeight;
  let crimeB = candidates[0].crime;
  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) {
      crimeB = c.crime;
      break;
    }
  }

  // 3. Rozhodnutí podle stávajícího práva (Trestní zákoník ČR)
  let winner = null;
  let loser = null;

  if (crimeA.statutoryMaxYears > crimeB.statutoryMaxYears) {
    winner = crimeA;
    loser = crimeB;
  } else if (crimeB.statutoryMaxYears > crimeA.statutoryMaxYears) {
    winner = crimeB;
    loser = crimeA;
  } else {
    // Při stejné horní sazbě rozhoduje minimální sazba nebo reálná soudní praxe
    if (crimeA.statutoryMinYears !== crimeB.statutoryMinYears) {
      winner = crimeA.statutoryMinYears > crimeB.statutoryMinYears ? crimeA : crimeB;
      loser = winner.id === crimeA.id ? crimeB : crimeA;
    } else {
      const sevA = (crimeA.courtStats.unconditionalPrisonPct * 0.5) + (crimeA.courtStats.avgPrisonSentenceMonths * 1.5);
      const sevB = (crimeB.courtStats.unconditionalPrisonPct * 0.5) + (crimeB.courtStats.avgPrisonSentenceMonths * 1.5);
      winner = sevA >= sevB ? crimeA : crimeB;
      loser = winner.id === crimeA.id ? crimeB : crimeA;
    }
  }

  // Aktualizace lokálního Elo modelu
  const kFactor = 24;
  const currentWinnerElo = scores[winner.id].elo;
  const currentLoserElo = scores[loser.id].elo;
  const expectedWinner = 1 / (1 + Math.pow(10, (currentLoserElo - currentWinnerElo) / 400));
  
  scores[winner.id].elo += Math.round(kFactor * (1 - expectedWinner));
  scores[loser.id].elo += Math.round(kFactor * (0 - (1 - expectedWinner)));
  scores[winner.id].wins++;
  scores[loser.id].losses++;
  scores[winner.id].matches++;
  scores[loser.id].matches++;

  const sessionId = sessions[i % sessions.length];

  votesBatch.push({
    winner_id: winner.id,
    loser_id: loser.id,
    session_id: sessionId,
    created_at: new Date(Date.now() - (totalVotesToSimulate - i) * 12000).toISOString()
  });
}

console.log(`✅ Vygenerováno 1000 duelů v souladu s Trestním zákoníkem.`);

// Odeslání do Supabase v dávkách po 200
async function uploadVotesToSupabase() {
  const batchSize = 200;
  let totalUploaded = 0;

  for (let i = 0; i < votesBatch.length; i += batchSize) {
    const chunk = votesBatch.slice(i, i + batchSize);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/votes`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(chunk)
      });

      if (res.ok) {
        totalUploaded += chunk.length;
        console.log(`🚀 Odeslána dávka ${totalUploaded}/${votesBatch.length} hlasů do Supabase.`);
      } else {
        console.error(`Chyba při odesílání dávky: ${res.status} ${await res.text()}`);
      }
    } catch (e) {
      console.error(`Chyba sítě:`, e.message);
    }
  }

  // Kontrola celkového počtu v databázi
  try {
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/votes?select=count`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Range': '0-0',
        'Prefer': 'count=exact'
      }
    });
    const contentRange = checkRes.headers.get('content-range');
    console.log(`\n🎉 Hotovo! Celkový počet hlasů v Supabase tabulce 'votes': ${contentRange || '1000+'}`);
  } catch (e) {
    console.log(`Kontrola počtu dokončena.`);
  }

  // Výpis výsledného žebříčku po 1000 hlasech
  console.log(`\n📊 Výsledný žebříček trestných činů po 1000 zákonných rozhodnutích:`);
  console.log(`------------------------------------------------------------------------------------------------`);
  const ranked = Object.values(scores).sort((a, b) => b.elo - a.elo);
  ranked.forEach((item, index) => {
    const winRate = item.matches > 0 ? Math.round((item.wins / item.matches) * 100) : 0;
    console.log(
      `${String(index + 1).padStart(2, ' ')}. ${item.crime.name.padEnd(48, ' ')} | Elo: ${String(item.elo).padStart(4, ' ')} | Výhry: ${String(winRate).padStart(3, ' ')} % (${item.wins}/${item.matches}) | Sazba: ${item.crime.statutoryText}`
    );
  });
}

uploadVotesToSupabase();
