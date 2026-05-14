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
  // Try PGA Tour full leaderboard first
  try {
    const scores = await fetchFromPGATourV2();
    if (scores && Object.keys(scores).length > 5) {
      scores._source = "pgatour";
      return scores;
    }
  } catch (e) {
    console.warn("PGA Tour v2 failed:", e.message);
  }

  // Try PGA Tour mini leaderboard
  try {
    const scores = await fetchFromPGATourMini();
    if (scores && Object.keys(scores).length > 5) {
      scores._source = "pgatour";
      return scores;
    }
  } catch (e) {
    console.warn("PGA Tour mini failed:", e.message);
  }

  // Try ESPN
  try {
    const scores = await fetchFromESPN();
    if (scores && Object.keys(scores).length > 5) {
      scores._source = "espn";
      return scores;
    }
  } catch (e) {
    console.warn("ESPN failed:", e.message);
  }

  return { _source: "none" };
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchFromPGATourV2() {
  const url = "https://statdata.pgatour.com/r/current/leaderboard-v2.json";
  const res = await fetch(url, {
    headers: { ...HEADERS, "Referer": "https://www.pgatour.com/" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`PGA Tour v2 returned ${res.status}`);
  const data = await res.json();
  return parsePGATourData(data);
}

async function fetchFromPGATourMini() {
  const url = "https://statdata.pgatour.com/r/current/leaderboard-v2mini.json";
  const res = await fetch(url, {
    headers: { ...HEADERS, "Referer": "https://www.pgatour.com/" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`PGA Tour mini returned ${res.status}`);
  const data = await res.json();
  return parsePGATourData(data);
}

function parsePGATourData(data) {
  const scores = {};
  const rows = data?.leaderboard?.players || [];

  for (const player of rows) {
    const first = player?.player_bio?.first_name || "";
    const last = player?.player_bio?.last_name || "";
    const fullName = `${first} ${last}`.trim();
    if (!fullName) continue;

    const totalStr = player?.total || "E";
    const total = parseScoreStr(totalStr);
    const thru = player?.thru ?? null;
    const round = player?.current_round ?? 1;
    const madeCut = player?.status !== "cut" && player?.status !== "CUT";

    const rounds = (player?.rounds || []).map(r => r?.strokes ?? null).filter(r => r !== null);

    scores[normalizeName(fullName)] = {
      name: fullName,
      total,
      thru,
      round,
      rounds,
      madeCut,
      status: player?.status || "active",
    };
  }
  return scores;
}

async function fetchFromESPN() {
  const url = "https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard";
  const res = await fetch(url, {
    headers: { ...HEADERS, "Referer": "https://www.espn.com/golf/leaderboard", "Origin": "https://www.espn.com" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
  const data = await res.json();

  const scores = {};
  for (const event of (data?.events || [])) {
    for (const comp of (event?.competitions || [])) {
      for (const player of (comp?.competitors || [])) {
        const fullName = player?.athlete?.displayName;
        if (!fullName) continue;
        const madeCut = !player?.status?.type?.name?.includes("CUT");
        const rounds = (player?.linescores || []).map(ls => ls?.value ?? null).filter(v => v !== null);
        const total = rounds.reduce((s, v) => s + Number(v), 0) || null;
        scores[normalizeName(fullName)] = {
          name: fullName,
          total,
          thru: player?.status?.thru ?? null,
          round: player?.status?.period ?? null,
          rounds,
          madeCut,
          status: player?.status?.type?.name || "active",
        };
      }
    }
  }
  return scores;
}

function parseScoreStr(str) {
  if (!str || str === "E") return 0;
  const n = parseInt(str, 10);
  return isNaN(n) ? 0 : n;
}

function normalizeName(name) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
}
