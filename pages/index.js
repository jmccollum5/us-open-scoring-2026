import { useState, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";
import { TEAMS } from "../lib/picks.js";
import { computeStandings, formatScore, formatThru } from "../lib/scoring.js";
import { runMonteCarlo } from "../lib/monteCarlo.js";

const REFRESH_INTERVAL = 60 * 1000;

export default function Home() {
  const [rawScores, setRawScores] = useState(null);
  const [source, setSource] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simDone, setSimDone] = useState(false);
  const [winProbs, setWinProbs] = useState([]);
  const [probsAnimated, setProbsAnimated] = useState(false);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Score fetch failed");
      setRawScores(data.scores);
      setSource(data.source);
      setUpdatedAt(data.updatedAt);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchScores]);

  useEffect(() => {
    if (rawScores === null) return;
    setSimDone(false);
    setProbsAnimated(false);
    const t = setTimeout(() => {
      const probs = runMonteCarlo(TEAMS, rawScores);
      probs.sort((a, b) => b.winPct - a.winPct);
      setWinProbs(probs);
      setSimDone(true);
      setTimeout(() => setProbsAnimated(true), 80);
    }, 50);
    return () => clearTimeout(t);
  }, [rawScores]);

  const standings = useMemo(() => {
    if (!rawScores) return TEAMS.map((t) => ({
      name: t.name,
      color: t.color,
      golfers: t.picks.map((p) => ({
        name: p.name, score: null, displayScore: 0,
        thru: null, round: null, rounds: [], madeCut: true, status: "scheduled",
      })),
      teamTotal: null,
      top4Names: new Set(),
    }));
    const s = computeStandings(rawScores);
    return s.sort((a, b) => {
      if (a.teamTotal === null && b.teamTotal === null) return 0;
      if (a.teamTotal === null) return 1;
      if (b.teamTotal === null) return -1;
      return a.teamTotal - b.teamTotal;
    });
  }, [rawScores]);

  const isLive = source && source !== "none";
  const pretournament = !isLive;

  return (
    <>
      <Head>
        <title>2026 PGA Championship Pool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⛳</text></svg>" />
      </Head>

      <div className="app">
        <header className="header">
          <div className="header-inner">
            <div className="header-logo">
              <div className="header-badge">
                <span className="header-eyebrow">Pool Leaderboard</span>
                <h1 className="header-title">2026 PGA Championship</h1>
                <p className="header-subtitle">Aronimink Golf Club · Newtown Square, PA · May 15–18</p>
              </div>
            </div>
            <div className="header-meta">
              <span className={`status-pill ${pretournament ? "pretournament" : ""}`}>
                <span className="status-dot" />
                {pretournament ? "Pre-Tournament" : "Live"}
              </span>
              {updatedAt && (
                <span className="update-time">
                  Updated {new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
        </header>

        <section className="win-prob-section">
          <p className="section-label">Win Probability · Monte Carlo Simulation</p>
          <div className="win-prob-card">
            {!simDone ? (
              <div style={{ color: "var(--text-dim)", fontSize: 12, textAlign: "center", padding: "8px 0" }}>
                Running simulation…
              </div>
            ) : (
              <div className="win-prob-grid">
                {winProbs.map((team) => {
                  const maxPct = winProbs[0]?.winPct || 100;
                  const barWidth = probsAnimated ? `${(team.winPct / maxPct) * 100}%` : "0%";
                  return (
                    <div key={team.name} className="win-prob-row">
                      <span className="win-prob-name">{team.name}</span>
                      <div className="win-prob-bar-track">
                        <div
                          className="win-prob-bar-fill"
                          style={{
                            width: barWidth,
                            background: `linear-gradient(90deg, ${team.color}99, ${team.color})`,
                          }}
                        />
                      </div>
                      <span className="win-prob-pct">{team.winPct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="standings-section">
          <p className="section-label">Team Standings · Top 4 of 7 Count</p>
          {loading ? (
            <div className="center-message">
              <div className="spinner" />
              <span>Fetching live scores…</span>
            </div>
          ) : error ? (
            <div className="center-message">
              <span style={{ color: "var(--red)" }}>⚠ {error}</span>
              <button className="refresh-btn" onClick={fetchScores}>Retry</button>
            </div>
          ) : (
            <div className="standings-grid">
              {standings.map((team, rank) => (
                <TeamCard key={team.name} team={team} rank={rank + 1} />
              ))}
            </div>
          )}
        </section>

        <footer className="footer">
          <p>Auto-refreshes every 60 seconds · Top 4 of 7 golfers count · Missed cut capped at cut line</p>
          {source && <p style={{ marginTop: 4 }}>Data source: {source === "none" ? "Pre-tournament" : source.toUpperCase()}</p>}
        </footer>
      </div>
    </>
  );
}

function TeamCard({ team, rank }) {
  const [open, setOpen] = useState(false);

  const totalStr = team.teamTotal === null ? "–" : formatScore(team.teamTotal);
  const totalClass =
    team.teamTotal === null ? "pending"
    : team.teamTotal < 0 ? "under"
    : team.teamTotal > 0 ? "over"
    : "even";

  return (
    <div className="team-card">
      <div className="team-card-header" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setOpen((o) => !o)}>
        <div className="team-header-left">
          <span className={`team-rank ${rank <= 3 ? "top3" : ""}`}>{rank}</span>
          <span className="team-color-dot" style={{ background: team.color }} />
          <span className="team-name">{team.name}</span>
          <span style={{ fontSize: 11, color: "var(--text-dim)", marginLeft: 4, transition: "transform 0.25s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
        </div>
        <span className={`team-total ${totalClass}`}>{totalStr}</span>
      </div>
      <div style={{ maxHeight: open ? "500px" : "0px", overflow: "hidden", transition: "max-height 0.3s ease" }}>
        {team.golfers.map((golfer) => {
          const counts = team.top4Names.has(golfer.name);
          const scoreStr = golfer.score === null ? "–" : formatScore(golfer.displayScore);
          const scoreClass =
            golfer.score === null ? "pending"
            : !golfer.madeCut ? "over"
            : golfer.displayScore < 0 ? "under"
            : golfer.displayScore > 0 ? "over"
            : "even";
          return (
            <div key={golfer.name} className={`golfer-row${counts ? " counts" : ""}${!golfer.madeCut ? " cut" : ""}`}>
              <div className="golfer-name-wrap">
                {counts && <span className="golfer-counts-dot" />}
                <span className="golfer-name">{golfer.name}</span>
                {!golfer.madeCut && <span className="golfer-cut-badge">CUT</span>}
              </div>
              <span className="golfer-thru">{formatThru(golfer.thru, golfer.round)}</span>
              <span className={`golfer-score ${scoreClass}`}>{scoreStr}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
