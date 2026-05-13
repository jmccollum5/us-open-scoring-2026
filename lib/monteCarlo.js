// lib/monteCarlo.js
// Monte Carlo simulation for pool win probability
// Runs N simulations, each time drawing remaining hole scores for all golfers,
// determines top-4 team total per simulation, tallies wins.

const SIMULATIONS = 5000;
const TOTAL_HOLES = 72; // 4 rounds x 18 holes

/**
 * Run Monte Carlo simulation and return win probability per team.
 * @param {Array} teams - from picks.js
 * @param {Object} scores - from /api/scores, keyed by normalized name
 * @param {number} cutScore - the cut line score (relative to par)
 * @returns {Array} [{ name, winPct, avgScore }]
 */
export function runMonteCarlo(teams, scores, cutScore = 8) {
  const teamWins = new Array(teams.length).fill(0);
  const teamTotals = teams.map(() => []);

  for (let sim = 0; sim < SIMULATIONS; sim++) {
    const simTeamScores = teams.map((team) => {
      const golferScores = team.picks.map((pick) => {
        return simulateGolferTotal(pick, scores, cutScore);
      });
      // Top 4 scores (lowest = best in golf)
      golferScores.sort((a, b) => a - b);
      const top4 = golferScores.slice(0, 4).reduce((s, v) => s + v, 0);
      return top4;
    });

    teams.forEach((_, i) => teamTotals[i].push(simTeamScores[i]));

    // Find winner (lowest score)
    const minScore = Math.min(...simTeamScores);
    const winners = simTeamScores.reduce((acc, s, i) => {
      if (s === minScore) acc.push(i);
      return acc;
    }, []);
    // Split win credit on ties
    winners.forEach((wi) => {
      teamWins[wi] += 1 / winners.length;
    });
  }

  return teams.map((team, i) => ({
    name: team.name,
    color: team.color,
    winPct: (teamWins[i] / SIMULATIONS) * 100,
    avgScore: teamTotals[i].reduce((s, v) => s + v, 0) / SIMULATIONS,
  }));
}

/**
 * Simulate a single golfer's total score for remaining holes.
 */
function simulateGolferTotal(pick, scores, cutScore) {
  const normalized = normalizePlayerName(pick.name);
  const playerData = findPlayerScore(normalized, scores);

  // If player has missed cut, return cut score
  if (playerData && playerData.madeCut === false) {
    return cutScore;
  }

  // If no live data yet, simulate all 72 holes from odds
  if (!playerData || playerData.total === null || playerData.total === undefined) {
    return simulateFromOdds(pick.odds);
  }

  const currentTotal = playerData.total ?? 0;
  const holesPlayed = getHolesPlayed(playerData);
  const holesRemaining = Math.max(0, TOTAL_HOLES - holesPlayed);

  if (holesRemaining === 0) return currentTotal;

  // Sample remaining strokes based on field-relative skill
  const skillFactor = oddsToSkillFactor(pick.odds);
  const remainingScore = sampleRemainingScore(holesRemaining, skillFactor);

  return currentTotal + remainingScore;
}

function getHolesPlayed(playerData) {
  if (!playerData) return 0;
  const round = Math.max(0, (playerData.round || 1) - 1);
  const thru = playerData.thru ?? 0;
  return round * 18 + (thru === "F" ? 18 : Number(thru) || 0);
}

/**
 * Simulate from pre-tournament odds only (pre-round).
 * Better odds → expected lower score.
 */
function simulateFromOdds(odds) {
  // American odds to implied probability
  const prob = oddsToImpliedProb(odds);

  // Map win probability to expected score relative to par over 72 holes
  // Field average roughly +4 for a 72-hole major (cut survivors)
  // Favorites expected to finish lower
  const expectedScore = oddsToExpectedScore(prob);
  const sigma = 6; // standard deviation of outcomes

  return Math.round(expectedScore + sampleNormal(0, sigma));
}

function oddsToImpliedProb(odds) {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function oddsToExpectedScore(prob) {
  // Rough mapping: +100% win prob → -20 (hypothetical), 0% → +15
  // Realistic range: favorite ~-10 to -15, longshot +8 to +12
  if (prob > 0.2) return -12;
  if (prob > 0.1) return -8;
  if (prob > 0.05) return -5;
  if (prob > 0.02) return -2;
  if (prob > 0.01) return 1;
  return 4;
}

function oddsToSkillFactor(odds) {
  // Returns expected score-per-hole relative to par
  // Favorites < 0, longshots > 0
  const prob = oddsToImpliedProb(odds);
  const expectedTotal = oddsToExpectedScore(prob);
  return expectedTotal / TOTAL_HOLES; // per hole
}

function sampleRemainingScore(holesRemaining, skillFactor) {
  // Each hole: par = 0, birdie = -1, eagle = -2, bogey = +1, double = +2
  // skill factor adjusts the mean
  let total = 0;
  for (let h = 0; h < holesRemaining; h++) {
    total += sampleHoleScore(skillFactor);
  }
  return total;
}

function sampleHoleScore(skillFactor) {
  const r = Math.random();
  // Adjusted probabilities by skill
  const skill = Math.max(-0.05, Math.min(0.05, skillFactor));
  // Eagle: rare
  if (r < 0.01) return -2;
  // Birdie
  if (r < 0.18 + skill * 3) return -1;
  // Par
  if (r < 0.68 + skill * 2) return 0;
  // Bogey
  if (r < 0.90) return 1;
  // Double+
  return 2;
}

function sampleNormal(mean, std) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

function findPlayerScore(normalizedName, scores) {
  if (!scores) return null;
  if (scores[normalizedName]) return scores[normalizedName];
  // fuzzy match: check if normalized name is contained
  for (const [key, val] of Object.entries(scores)) {
    if (key === "_source") continue;
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return val;
    }
  }
  return null;
}

export function normalizePlayerName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
