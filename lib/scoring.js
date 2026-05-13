// lib/scoring.js
// Pool scoring rules:
//   - Each team has 7 golfers
//   - Top 4 scores count toward team total
//   - Golfers who miss the cut are capped at the cut line score

import { TEAMS, NAME_ALIASES } from "./picks.js";

export const CUT_LINE = 8; // Will be updated when cut is announced; ~+8 is typical for PGA Champ

/**
 * Given raw scores from the API, compute each team's standing.
 */
export function computeStandings(rawScores) {
  return TEAMS.map((team) => {
    const golfers = team.picks.map((pick) => {
      const playerData = resolvePlayer(pick.name, rawScores);
      return buildGolferEntry(pick, playerData);
    });

    // Sort: missed cut last, then by score
    const sorted = [...golfers].sort((a, b) => {
      if (a.madeCut && !b.madeCut) return -1;
      if (!a.madeCut && b.madeCut) return 1;
      return a.displayScore - b.displayScore;
    });

    // Top 4 count
    const top4 = sorted.slice(0, 4);
    const teamTotal = top4.reduce((sum, g) => sum + g.displayScore, 0);
    const allScored = golfers.every((g) => g.score !== null);

    return {
      name: team.name,
      color: team.color,
      golfers: sorted,
      teamTotal: allScored ? teamTotal : null,
      top4Names: new Set(top4.map((g) => g.name)),
    };
  });
}

function buildGolferEntry(pick, playerData) {
  if (!playerData) {
    return {
      name: pick.name,
      score: null,
      displayScore: 0,
      thru: null,
      round: null,
      rounds: [],
      madeCut: true,
      status: "scheduled",
    };
  }

  const madeCut = playerData.madeCut !== false;
  const rawScore = playerData.total ?? null;

  // If missed cut, cap at cut line
  const displayScore = !madeCut
    ? Math.max(rawScore ?? CUT_LINE, CUT_LINE)
    : (rawScore ?? 0);

  return {
    name: pick.name,
    score: rawScore,
    displayScore,
    thru: playerData.thru,
    round: playerData.round,
    rounds: playerData.rounds || [],
    madeCut,
    status: playerData.status || "active",
  };
}

/**
 * Resolve a pick name to a player in the scores object,
 * handling common name variations and diacritics.
 */
export function resolvePlayer(pickName, scores) {
  if (!scores || Object.keys(scores).length === 0) return null;

  const normalized = normalizeName(pickName);

  // Direct match
  if (scores[normalized]) return scores[normalized];

  // Check aliases
  const aliases = NAME_ALIASES[pickName] || [];
  for (const alias of aliases) {
    const aliasKey = normalizeName(alias);
    if (scores[aliasKey]) return scores[aliasKey];
  }

  // Fuzzy: check if any score key is a substring match
  for (const [key, val] of Object.entries(scores)) {
    if (key === "_source") continue;
    const keyNorm = normalizeName(key);
    if (keyNorm === normalized) return val;
    // Try last name match as fallback
    const lastName = normalized.split(" ").pop();
    if (lastName.length > 3 && keyNorm.endsWith(lastName)) return val;
  }

  return null;
}

export function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z\s.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatScore(score) {
  if (score === null || score === undefined) return "–";
  if (score === 0) return "E";
  if (score > 0) return `+${score}`;
  return `${score}`;
}

export function formatThru(thru, round) {
  if (!thru && !round) return "–";
  if (thru === "F" || thru === 18) return round === 4 ? "F" : `F${round - 1}`;
  if (!thru) return `R${round}`;
  return `Thru ${thru}`;
}
