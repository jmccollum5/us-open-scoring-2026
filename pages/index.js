import { useState, useEffect } from 'react';
import Head from 'next/head';

const TEAMS = {
  Jack:   ['Scottie Scheffler','Si Woo Kim','J.J. Spaun','Ben Griffin','Alex Fitzpatrick','Rickie Fowler','Akshay Bhatia'],
  Georgie:['Rory McIlroy','Viktor Hovland','Chris Gotterup','Shane Lowry','J.T. Poston','Keegan Bradley','Tom Kim'],
  Mark:   ['Jon Rahm','Tyrrell Hatton','Robert MacIntyre','Maverick McNealy','Bud Cauley','Sepp Straka','Sudarshan Yellamaraju'],
  Corey:  ['Cameron Young','Sam Burns','Justin Rose','Ryan Fox','Jake Knapp','Alex Smalley','Sahith Theegala'],
  Adrian: ['Ludvig Aberg','Justin Thomas','Brooks Koepka','Joaquin Niemann','Adam Scott','Cameron Smith','Kristoffer Reitan'],
  Zach:   ['Xander Schauffele','Patrick Reed','Hideki Matsuyama','Kurt Kitayama','Jacob Bridgeman','Nicolai Hojgaard','Nick Taylor'],
  Mike:   ['Bryson DeChambeau','Collin Morikawa','Patrick Cantlay','Jordan Spieth','Jason Day','Spencer Tibbits','David Puig'],
  Tomas:  ['Matt Fitzpatrick','Wyndham Clark','Min Woo Lee','Ryan Gerard','Corey Conners','Jackson Koivun','Michael Brennan'],
  Kollas: ['Tommy Fleetwood','Russell Henley','Harris English','Aaron Rai','Gary Woodland','Alex Noren','Sungjae Im'],
};

const COLORS = {
  Jack:'#14b8a6', Georgie:'#eab308', Mark:'#8b5cf6', Corey:'#22c55e',
  Adrian:'#ec4899', Zach:'#06b6d4', Mike:'#ef4444', Tomas:'#3b82f6', Kollas:'#f97316',
};

function parseScore(s) {
  if (!s || s === 'E') return 0;
  return parseInt(s.replace('+','')) || 0;
}

export default function Home() {
  const [players, setPlayers] = useState({});
  const [cutLine, setCutLine] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('leaderboard'); // 'leaderboard' or 'teams'

  const fetchScores = async () => {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();

      if (!data.events?.[0]) throw new Error('No event data');

      const event = data.events[0];
      const competitors = event.competitions?.[0]?.competitors || [];
      const cut = event.competitions?.[0]?.cutLines?.[0]?.displayValue;
      if (cut) setCutLine(parseScore(cut));

      const playerMap = {};
      for (const c of competitors) {
        const name = c.athlete?.displayName;
        if (!name) continue;
        const scoreStr = c.score?.displayValue || 'E';
        const score = parseScore(scoreStr);
        const status = c.status?.type?.name || '';
        const position = c.status?.position?.displayName || '';
        const thru = c.status?.thru || '';
        const madeCut = !status.includes('CUT') && !status.includes('WD') && !status.includes('DQ');

        playerMap[name] = {
          score,
          scoreStr,
          status,
          position,
          thru,
          madeCut,
          isCut: status.includes('CUT'),
          isWD: status.includes('WD') || status.includes('DQ'),
        };
      }

      setPlayers(playerMap);
      setLastUpdated(new Date().toLocaleTimeString());
      setLoading(false);
      setError(null);
    } catch (e) {
      setError('Score data unavailable — round may not have started yet');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate team scores
  const teamScores = Object.entries(TEAMS).map(([name, golfers]) => {
    const scores = golfers.map(g => {
      const p = players[g];
      if (!p) return { golfer: g, score: 0, scoreStr: '-', counting: false, isCut: false, isWD: false, thru: '', status: 'upcoming' };

      let effectiveScore = p.score;
      if ((p.isCut || p.isWD) && cutLine !== null) {
        effectiveScore = cutLine;
      }

      return {
        golfer: g,
        score: effectiveScore,
        scoreStr: p.scoreStr,
        counting: false,
        isCut: p.isCut,
        isWD: p.isWD,
        thru: p.thru,
        status: p.status,
        madeCut: p.madeCut,
      };
    });

    // Sort by score, pick top 4
    const sorted = [...scores].sort((a, b) => a.score - b.score);
    const top4 = sorted.slice(0, 4).map(s => s.golfer);
    scores.forEach(s => { s.counting = top4.includes(s.golfer); });

    const total = sorted.slice(0, 4).reduce((sum, s) => sum + s.score, 0);

    return { name, golfers: scores, total, sorted };
  }).sort((a, b) => a.total - b.total);

  const formatScore = (score, str) => {
    if (!str || str === '-') return '-';
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : `${score}`;
  };

  return (
    <>
      <Head>
        <title>US Open 2026 — Pool Leaderboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#0a0c0e;--surface:#111418;--surface2:#1a1f26;--border:#2a3040;
          --blue:#4a90d9;--text:#e8eaed;--muted:#8892a0;--green:#22c55e;--red:#ef4444;--r:10px;
        }
        body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
        .hdr{background:linear-gradient(180deg,#0a0f1a 0%,var(--bg) 100%);border-bottom:1px solid var(--border);padding:16px;text-align:center;position:sticky;top:0;z-index:50}
        .hdr-eye{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--blue);margin-bottom:3px}
        .hdr-title{font-family:'Bebas Neue',cursive;font-size:clamp(26px,7vw,44px);letter-spacing:2px;line-height:1;margin-bottom:2px}
        .hdr-sub{font-size:11px;color:var(--muted);margin-bottom:12px}
        .tabs{display:flex;gap:8px;justify-content:center;margin-bottom:4px}
        .tab{padding:6px 18px;border-radius:20px;border:1px solid var(--border);background:var(--surface2);color:var(--muted);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}
        .tab.active{background:var(--blue);border-color:var(--blue);color:#fff}
        .updated{font-size:10px;color:var(--muted);margin-top:6px}
        .wrap{max-width:720px;margin:0 auto;padding:14px}

        /* LEADERBOARD VIEW */
        .lb-row{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:var(--r);background:var(--surface);border:1px solid var(--border);margin-bottom:5px;transition:border-color .15s}
        .lb-row:hover{border-color:#333}
        .lb-pos{font-family:'Bebas Neue',cursive;font-size:18px;color:var(--muted);width:28px;text-align:center;flex-shrink:0}
        .lb-pos.gold{color:#f59e0b}
        .lb-pos.silver{color:#9ca3af}
        .lb-pos.bronze{color:#b45309}
        .lb-name{flex:1}
        .lb-name-main{font-family:'Bebas Neue',cursive;font-size:20px;letter-spacing:1px}
        .lb-name-sub{font-size:11px;color:var(--muted);margin-top:1px}
        .lb-score{font-family:'Bebas Neue',cursive;font-size:26px;text-align:right;flex-shrink:0}
        .lb-score.under{color:var(--green)}
        .lb-score.over{color:var(--red)}
        .lb-score.even{color:var(--text)}
        .lb-bar{height:3px;background:var(--border);border-radius:2px;margin-top:6px;overflow:hidden}
        .lb-bar-fill{height:100%;border-radius:2px;transition:width .5s}

        /* TEAM VIEW */
        .team-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:14px;margin-bottom:10px}
        .team-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .team-name{font-family:'Bebas Neue',cursive;font-size:22px;letter-spacing:1px;display:flex;align-items:center;gap:8px}
        .team-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
        .team-total{font-family:'Bebas Neue',cursive;font-size:28px}
        .team-total.under{color:var(--green)}
        .team-total.over{color:var(--red)}
        .team-total.even{color:var(--text)}
        .golfer-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:13px}
        .golfer-row:last-child{border-bottom:none}
        .golfer-name{flex:1;font-weight:500}
        .golfer-name.cut{color:var(--muted);text-decoration:line-through}
        .golfer-score{font-weight:600;width:36px;text-align:right}
        .golfer-score.under{color:var(--green)}
        .golfer-score.over{color:var(--red)}
        .golfer-score.even{color:var(--text)}
        .golfer-thru{font-size:11px;color:var(--muted);width:30px;text-align:right}
        .counting-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
        .badge{font-size:9px;font-weight:600;padding:1px 5px;border-radius:3px;margin-left:4px}
        .badge-cut{background:rgba(239,68,68,.15);color:var(--red)}
        .badge-counting{background:rgba(34,197,94,.15);color:var(--green)}

        .loading{text-align:center;padding:60px 20px;color:var(--muted)}
        .error{text-align:center;padding:40px 20px;color:var(--muted);font-size:13px}
        .rank-badge{font-size:10px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:2px 8px;color:var(--muted);margin-left:6px}
      `}</style>

      <div className="hdr">
        <div className="hdr-eye">Shinnecock Hills · Southampton, NY</div>
        <div className="hdr-title">US Open 2026</div>
        <div className="hdr-sub">Pool Leaderboard · Top 4 scores count · Cut = {cutLine !== null ? (cutLine > 0 ? `+${cutLine}` : cutLine === 0 ? 'E' : cutLine) : 'TBD'}</div>
        <div className="tabs">
          <button className={`tab ${view === 'leaderboard' ? 'active' : ''}`} onClick={() => setView('leaderboard')}>🏆 Standings</button>
          <button className={`tab ${view === 'teams' ? 'active' : ''}`} onClick={() => setView('teams')}>👥 Teams</button>
        </div>
        {lastUpdated && <div className="updated">Updated {lastUpdated} · auto-refreshes every 30s</div>}
      </div>

      <div className="wrap">
        {loading && <div className="loading">Loading scores...</div>}
        {error && <div className="error">⛳ {error}</div>}

        {!loading && view === 'leaderboard' && (
          <>
            {teamScores.map((team, i) => {
              const scoreClass = team.total < 0 ? 'under' : team.total > 0 ? 'over' : 'even';
              const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
              const top4names = team.sorted.slice(0, 4).map(s => s.golfer);
              return (
                <div key={team.name} className="lb-row">
                  <div className={`lb-pos ${posClass}`}>{i + 1}</div>
                  <div className="lb-name">
                    <div className="lb-name-main" style={{ color: COLORS[team.name] }}>{team.name}</div>
                    <div className="lb-name-sub">{top4names.join(' · ')}</div>
                  </div>
                  <div className={`lb-score ${scoreClass}`}>
                    {team.total === 0 ? 'E' : team.total > 0 ? `+${team.total}` : team.total}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {!loading && view === 'teams' && (
          <>
            {teamScores.map((team, rank) => {
              const totalClass = team.total < 0 ? 'under' : team.total > 0 ? 'over' : 'even';
              return (
                <div key={team.name} className="team-card" style={{ borderColor: COLORS[team.name] + '55' }}>
                  <div className="team-header">
                    <div className="team-name">
                      <div className="team-dot" style={{ background: COLORS[team.name] }} />
                      {team.name}
                      <span className="rank-badge">#{rank + 1}</span>
                    </div>
                    <div className={`team-total ${totalClass}`}>
                      {team.total === 0 ? 'E' : team.total > 0 ? `+${team.total}` : team.total}
                    </div>
                  </div>
                  {team.golfers.map(g => {
                    const scoreClass = g.score < 0 ? 'under' : g.score > 0 ? 'over' : 'even';
                    const isCapped = (g.isCut || g.isWD) && cutLine !== null;
                    return (
                      <div key={g.golfer} className="golfer-row">
                        <div className={`counting-dot`} style={{ background: g.counting ? COLORS[team.name] : 'transparent', border: `1.5px solid ${g.counting ? COLORS[team.name] : 'var(--border)'}` }} />
                        <div className={`golfer-name ${g.isCut || g.isWD ? 'cut' : ''}`}>
                          {g.golfer}
                          {g.isCut && <span className="badge badge-cut">CUT</span>}
                          {g.isWD && <span className="badge badge-cut">WD</span>}
                          {g.counting && !g.isCut && !g.isWD && <span className="badge badge-counting">counting</span>}
                        </div>
                        <div className="golfer-thru">{g.thru ? `F${g.thru !== 'F' ? ` ${g.thru}` : ''}` : ''}</div>
                        <div className={`golfer-score ${scoreClass}`}>
                          {g.scoreStr === '-' ? '-' : isCapped ? `${formatScore(g.score, g.scoreStr)}*` : formatScore(g.score, g.scoreStr)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
              • = counting toward team total · * = capped at cut line · top 4 scores count
            </div>
          </>
        )}
      </div>
    </>
  );
}
