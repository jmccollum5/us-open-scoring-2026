// All picks for the 2026 PGA Championship pool
// Each player has the golfer name as it appears on official leaderboards
// and the DraftKings opening odds (American format)

export const TEAMS = [
  {
    name: "Mike",
    color: "#ef4444",
    picks: [
      { name: "Scottie Scheffler", odds: 380 },
      { name: "Justin Rose", odds: 4700 },
      { name: "Patrick Cantlay", odds: 5200 },
      { name: "Jason Day", odds: 12500 },
      { name: "Ben Griffin", odds: 10500 },
      { name: "Rasmus Hojgaard", odds: 21000 },
      { name: "Aaron Rai", odds: 28000 },
    ],
  },
  {
    name: "Kollas",
    color: "#f97316",
    picks: [
      { name: "Rory McIlroy", odds: 910 },
      { name: "Rickie Fowler", odds: 7200 },
      { name: "Adam Scott", odds: 7000 },
      { name: "Alex Smalley", odds: 16000 },
      { name: "Keegan Bradley", odds: 13000 },
      { name: "Daniel Berger", odds: 20000 },
      { name: "Nick Taylor", odds: 20000 },
    ],
  },
  {
    name: "Georgie",
    color: "#eab308",
    picks: [
      { name: "Bryson DeChambeau", odds: 1850 },
      { name: "Viktor Hovland", odds: 5900 },
      { name: "Jordan Spieth", odds: 6300 },
      { name: "Kristoffer Reitan", odds: 14000 },
      { name: "Sungjae Im", odds: 14500 },
      { name: "Maverick McNealy", odds: 9800 },
      { name: "Cameron Smith", odds: 35000 },
    ],
  },
  {
    name: "Corey",
    color: "#22c55e",
    picks: [
      { name: "Jon Rahm", odds: 1375 },
      { name: "Shane Lowry", odds: 9800 },
      { name: "Sam Burns", odds: 6800 },
      { name: "Min Woo Lee", odds: 6400 },
      { name: "Wyndham Clark", odds: 19500 },
      { name: "Harris English", odds: 11500 },
      { name: "Max Homa", odds: 33000 },
    ],
  },
  {
    name: "Zach",
    color: "#06b6d4",
    picks: [
      { name: "Cameron Young", odds: 1600 },
      { name: "Russell Henley", odds: 5000 },
      { name: "Kurt Kitayama", odds: 8800 },
      { name: "Robert MacIntyre", odds: 6700 },
      { name: "Matt McCarty", odds: 24000 },
      { name: "Alex Noren", odds: 17500 },
      { name: "Haotong Li", odds: 38000 },
    ],
  },
  {
    name: "Tomas",
    color: "#6366f1",
    picks: [
      { name: "Xander Schauffele", odds: 2000 },
      { name: "Matt Fitzpatrick", odds: 2300 },
      { name: "J.J. Spaun", odds: 9400 },
      { name: "Nicolai Hojgaard", odds: 7000 },
      { name: "Alex Fitzpatrick", odds: 15500 },
      { name: "Sahith Theegala", odds: 20000 },
      { name: "Ryan Gerard", odds: 26000 },
    ],
  },
  {
    name: "Mark",
    color: "#a855f7",
    picks: [
      { name: "Collin Morikawa", odds: 3800 },
      { name: "Tyrrell Hatton", odds: 5900 },
      { name: "Si Woo Kim", odds: 5800 },
      { name: "Sepp Straka", odds: 10500 },
      { name: "Akshay Bhatia", odds: 10000 },
      { name: "Corey Conners", odds: 15500 },
      { name: "David Puig", odds: 12000 },
    ],
  },
  {
    name: "Adrian",
    color: "#ec4899",
    picks: [
      { name: "Ludvig Aberg", odds: 2000 },
      { name: "Brooks Koepka", odds: 3700 },
      { name: "Patrick Reed", odds: 8200 },
      { name: "Chris Gotterup", odds: 7600 },
      { name: "Harry Hall", odds: 13500 },
      { name: "Jacob Bridgeman", odds: 14500 },
      { name: "Michael Thorbjornsen", odds: 13000 },
    ],
  },
  {
    name: "Jack",
    color: "#14b8a6",
    picks: [
      { name: "Justin Thomas", odds: 4900 },
      { name: "Tommy Fleetwood", odds: 2700 },
      { name: "Hideki Matsuyama", odds: 8000 },
      { name: "Gary Woodland", odds: 11000 },
      { name: "Joaquin Niemann", odds: 10000 },
      { name: "Thomas Detry", odds: 14500 },
      { name: "Bud Cauley", odds: 28000 },
    ],
  },
];

// Name aliases to match ESPN/PGA leaderboard name variations
export const NAME_ALIASES = {
  "Rasmus Hojgaard": ["Rasmus Højgaard", "R. Hojgaard", "R. Højgaard"],
  "Nicolai Hojgaard": ["Nicolai Højgaard", "N. Hojgaard", "N. Højgaard"],
  "Alex Fitzpatrick": ["A. Fitzpatrick"],
  "Matt Fitzpatrick": ["M. Fitzpatrick"],
  "Min Woo Lee": ["M.W. Lee", "Min-Woo Lee"],
  "J.J. Spaun": ["J.J. Spaun", "JJ Spaun"],
  "Si Woo Kim": ["Si-Woo Kim", "S.W. Kim"],
};
