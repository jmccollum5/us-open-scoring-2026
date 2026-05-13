# 2026 PGA Championship Pool Dashboard

Live scoring dashboard for the friend group's PGA Championship pool at Aronimink Golf Club, May 15–18, 2026.

## Pool Rules
- Each of 9 participants has 7 golfers
- **Top 4 of 7 scores count** toward team total
- Golfers who miss the cut are **capped at the cut line score**
- Lowest team total wins

## Features
- 🏆 Live team standings ranked by score
- 📊 Monte Carlo win probability simulation (5,000 simulations, updates with scores)
- 🔴 Missed cut indicators
- ⛳ Per-golfer scores with "thru" hole tracking
- 🔄 Auto-refreshes every 60 seconds
- Tries ESPN API first, then PGA Tour stats feed

## Deployment

### 1. Create GitHub repo
Go to github.com/new and create `pga-scoring-2026` (public or private).

### 2. Push files
```bash
cd pga-scoring-2026
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pga-scoring-2026.git
git push -u origin main
```

### 3. Deploy to Vercel
- Go to vercel.com → New Project → Import from GitHub
- Select `pga-scoring-2026`
- Framework: Next.js (auto-detected)
- Click Deploy

### 4. Update cut line
When the cut is announced after Round 2, update `CUT_LINE` in `lib/scoring.js`:
```js
export const CUT_LINE = 5; // update to actual cut score
```
Commit and push — Vercel will auto-redeploy.

## Score Data Sources
The `/api/scores` route tries:
1. **ESPN API** — `site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard`
2. **PGA Tour Stats** — `statdata.pgatour.com/r/current/leaderboard-v2mini.json`

If both fail (pre-tournament or outage), the dashboard shows pre-tournament odds-based win probabilities.

## Participants & Teams
| Person | Top Pick |
|--------|----------|
| Mike | Scottie Scheffler (+380) |
| Kollas | Rory McIlroy (+910) |
| Georgie | Bryson DeChambeau (+1850) |
| Corey | Jon Rahm (+1375) |
| Zach | Cameron Young (+1600) |
| Tomas | Xander Schauffele (+2000) |
| Mark | Collin Morikawa (+3800) |
| Adrian | Ludvig Aberg (+2000) |
| Jack | Justin Thomas (+4900) |
