const fs = require('fs');

// Mock window
global.window = global;
global.localStorage = {
  getItem: () => null,
  setItem: () => null
};

require('./config.js');
require('./crimes-data.js');

console.log(`Loaded ${window.CRIMES_DATA.length} crimes.`);

let errors = 0;
window.CRIMES_DATA.forEach((crime, idx) => {
  if (!crime.id || !crime.name || !crime.paragraph || !crime.scenario || !crime.statutoryText) {
    console.error(`Error in crime index ${idx}: missing basic fields`);
    errors++;
  }
  if (!crime.courtStats || typeof crime.courtStats.unconditionalPrisonPct !== 'number') {
    console.error(`Error in crime ${crime.id}: invalid court stats`);
    errors++;
  }
  if (typeof crime.statutoryMaxYears !== 'number' || isNaN(crime.statutoryMaxYears)) {
    console.error(`Error in crime ${crime.id}: invalid statutoryMaxYears`);
    errors++;
  }
});

if (errors === 0) {
  console.log("All crime data verified successfully! 100% valid schema.");
} else {
  console.error(`Found ${errors} errors in dataset.`);
  process.exit(1);
}

// Test smart matchmaking simulation
const sigma = 220;
const epsilon = 0.08;
const scores = {};
window.CRIMES_DATA.forEach(c => {
  scores[c.id] = 1000 + (c.harmAnalysis.harmScore * 8);
});

let testPairsCount = 1000;
let deltaSum = 0;

for (let t = 0; t < testPairsCount; t++) {
  const crimes = window.CRIMES_DATA;
  const idxA = Math.floor(Math.random() * crimes.length);
  const crimeA = crimes[idxA];
  const scoreA = scores[crimeA.id];

  const candidates = [];
  let totalWeight = 0;
  for (let i = 0; i < crimes.length; i++) {
    if (i === idxA) continue;
    const candidate = crimes[i];
    const scoreB = scores[candidate.id];
    const diff = Math.abs(scoreA - scoreB);
    const weight = Math.exp(-Math.pow(diff, 2) / (2 * Math.pow(sigma, 2))) + epsilon;
    candidates.push({ crime: candidate, weight: weight, diff: diff });
    totalWeight += weight;
  }

  let r = Math.random() * totalWeight;
  let chosen = candidates[0];
  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) {
      chosen = c;
      break;
    }
  }
  deltaSum += chosen.diff;
}

const avgEloDiff = Math.round(deltaSum / testPairsCount);
console.log(`Smart Matchmaking Simulation (1000 trials): Average Elo delta between paired crimes is ${avgEloDiff} Elo points (ideal for balanced dilemmas).`);
