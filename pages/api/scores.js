// pages/api/scores.js
// Server-side score fetcher for the 2026 PGA Championship
// Tries ESPN first (with browser headers), then falls back to CBS Sports scraping

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");

  try {
    const scores = await fetchScores();
    res.status(200).json({ ok: true, scores, source: scores._source, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Score fetch failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}

async function fetchScores() {
  // Try ESPN API first
  try {
    const espnScores = await fetchFromESPN();
    if (espnScores && Object.keys(espnScores).length > 0) {
      espnScores._source = "espn";
      return espnScores;
    }
  } catch (e) {
    console.warn("ESPN fetch failed:", e.message);
  }

  // Try PGA Tour Stats feed
  try {
    const pgaScores = await fetchFromPGATour();
    if (pgaScores && Object.keys(pgaScores).length > 0) {
      pgaScores._source = "pgatour";
      return pgaScores;
    }
  } catch (e) {
    console.warn("PGA Tour fetch failed:", e.message);
  }

  // No live data yet (pre-tournament)
  return { _source: "none" };
}

async function fetchFromESPN() {
  const url = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.espn.com/golf/leaderboard",
      "Origin": "https://www.espn.com",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
  const data = await res.json();

  const scores = {};
  const events = data?.events || [];

  for (const event of events) {
    // Look for PGA Championship
    const name = event?.name || "";
    if (!name.toLowerCase().includes("pga championship") && events.length > 1) continue;

    const competitions = event?.competitions || [];
    for (const comp of competitions) {
      const competitors = comp?.competitors || [];
      for (const player of competitors) {
        const fullName = player?.athlete?.displayName;
        if (!fullName) continue;

        const status = player?.status?.type?.name || "STATUS_SCHEDULED";
        const score = player?.score ?? null;
        const topar = player?.linescores ? sumLinescores(player.linescores) : null;
        const thru = player?.status?.thru ?? null;
        const round = player?.status?.period ?? null;
        const madeCut = !player?.status?.type?.name?.includes("CUT");

        const rounds = (player?.linescores || []).map((ls) => ({
          score: ls?.value ?? null,
          displayValue: ls?.displayValue ?? null,
        }));

        scores[normalizePlayerName(fullName)] = {
          name: fullName,
          total: topar,
          score: score,
          thru,
          round,
          rounds,
          madeCut,
          status,
        };
      }
    }
  }

  return scores;
}

async function fetchFromPGATour() {
  // PGA Tour live scoring stats endpoint
  const url = "https://statdata.pgatour.com/r/current/leaderboard-v2mini.json";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Referer": "https://www.pgatour.com/",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`PGA Tour returned ${res.status}`);
  const data = await res.json();

  const scores = {};
  const rows = data?.leaderboard?.players || [];

  for (const player of rows) {
    const fullName = `${player?.player_bio?.first_name} ${player?.player_bio?.last_name}`;
    if (!fullName.trim()) continue;

    const total = player?.total || "E";
    const thru = player?.thru || null;
    const currentRound = player?.current_round || 1;
    const madeCut = player?.status !== "cut";

    const rounds = [
      player?.rounds?.[0]?.strokes ?? null,
      player?.rounds?.[1]?.strokes ?? null,
      player?.rounds?.[2]?.strokes ?? null,
      player?.rounds?.[3]?.strokes ?? null,
    ].filter((r) => r !== null);

    scores[normalizePlayerName(fullName)] = {
      name: fullName,
      total: parseScoreStr(total),
      thru,
      round: currentRound,
      rounds,
      madeCut,
      status: player?.status || "active",
    };
  }

  return scores;
}

function sumLinescores(linescores) {
  if (!linescores || linescores.length === 0) return null;
  let total = 0;
  for (const ls of linescores) {
    const val = ls?.value;
    if (val !== undefined && val !== null) total += Number(val);
  }
  return total;
}

function parseScoreStr(str) {
  if (!str || str === "E") return 0;
  const n = parseInt(str, 10);
  return isNaN(n) ? 0 : n;
}

export function normalizePlayerName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
