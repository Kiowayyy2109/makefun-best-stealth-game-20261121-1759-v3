// Nightshade — level definitions: five hand-built vaults, one per level.
// Map legend (32 columns x 18 rows, tile = 40px):
//   # wall   . marble floor   , carpet   w wood floor   m mosaic floor   s shadow pool
//   C crate  D desk  B bookshelf  S statue  P plant  T curtain  F fountain (tall cover: B/S/F block sight)
//   L lamp (warm light pool)   R relic   X exit   p player start   G guard spawn   K camera mount
//   | vertical laser   - horizontal laser
// Patrols, cameras and lasers are listed per level with tile coordinates.

export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;

export const LEVELS = [
  {
    name: 'The Marble Gallery',
    sub: 'Level 1 — two patrollers, learn their rhythm',
    palette: {
      floorA: '#2b3350', floorB: '#252c46', carpet: '#5e1e28', carpetEdge: '#8a2f3a',
      wall: '#39456b', wallTop: '#4d5a85', accent: '#e8b64c', light: '#ffd9a0',
      woodA: '#4a3423', woodB: '#41301f', mosaicA: '#31456b', mosaicB: '#2b3d60',
    },
    map: [
      '################################',
      '#......s.......##.......R......#',
      '#..C...........##..............#',
      '#..............##..B..R..B.....#',
      '#..D.....,,,,,,##,,,,,,,,,,....#',
      '#......,,,,,,,,##,,,,,,,,,,.L..#',
      '#..P....,,,,,,,##,,,,,,,,,,....#',
      '#......,,,,,,,,##,,,,,,,,,,....#',
      '#..s....,,,,,,,##,,,,,,,,,,....#',
      '#......,,,,,,,,##,,,,,,,,,,....#',
      '#..............##..............#',
      '#..B.....B.....##..C........C..#',
      '#..............##..............#',
      '#..R...........##.......s......#',
      '#..............##....D.........#',
      '#..G...........##..........G...#',
      '#..p...........##....L.....X...#',
      '################################',
    ],
    patrols: [
      { kind: 'patrol', path: [[4, 15], [4, 3], [14, 3], [14, 15]], pause: 1.2, speed: 1.0 },
      { kind: 'patrol', path: [[27, 15], [27, 3], [18, 3], [18, 15]], pause: 1.2, speed: 1.0 },
    ],
    cameras: [],
    lasers: [],
  },
  {
    name: 'The Crimson Antechamber',
    sub: 'Level 2 — three patrollers and a watching sentry',
    palette: {
      floorA: '#47222b', floorB: '#3e1e26', carpet: '#7a1f2e', carpetEdge: '#a83244',
      wall: '#5d2b35', wallTop: '#7a3a46', accent: '#f0c35c', light: '#ffb08a',
      woodA: '#54301e', woodB: '#4a2a1a', mosaicA: '#5b2a3a', mosaicB: '#522634',
    },
    map: [
      '################################',
      '#R.....s....######....s.....R..#',
      '#...........######.............#',
      '#..B...C....######....C...B....#',
      '#...........######.............#',
      '#..D....,,,,,######,,,,,....D..#',
      '#......,,,,,######,,,,,........#',
      '#..P....,,,,,######,,,,,....P..#',
      '#......,,,,,######,,,,,........#',
      '#..s....,,,,,######,,,,,....s..#',
      '#......,,,,,######,,,,,........#',
      '#...........######.............#',
      '#..C....L...######...L....C....#',
      '#...........######.............#',
      '#..G........######........G....#',
      '#...........######.............#',
      '#..p....R...######...s.....X...#',
      '################################',
    ],
    patrols: [
      { kind: 'patrol', path: [[3, 14], [3, 2], [13, 2], [13, 14]], pause: 1.0, speed: 1.05 },
      { kind: 'patrol', path: [[28, 14], [28, 2], [18, 2], [18, 14]], pause: 1.0, speed: 1.05 },
      { kind: 'patrol', path: [[15, 8], [8, 8], [8, 16], [23, 16], [23, 8]], pause: 0.8, speed: 1.1 },
      { kind: 'sentry', path: [[15, 1]], pause: 0, speed: 0 },
    ],
    cameras: [],
    lasers: [],
  },
  {
    name: 'The Emerald Grand Hall',
    sub: 'Level 3 — sweeping security cameras over open floor',
    palette: {
      floorA: '#1e3d2f', floorB: '#1a3529', carpet: '#14532f', carpetEdge: '#1f7a44',
      wall: '#2c5240', wallTop: '#3a6b54', accent: '#ffd76a', light: '#ffe6b0',
      woodA: '#3d2c1c', woodB: '#362718', mosaicA: '#1f4d3a', mosaicB: '#1c4534',
    },
    map: [
      '################################',
      '#R......s...####....s.......R..#',
      '#..........####................#',
      '#..S...C...####...C...S........#',
      '#..........####................#',
      '#..,,,,,,,,,####,,,,,,,,,......#',
      '#..,,,,,,,,,####,,,,,,,,,.L....#',
      '#..,,,,,,,,,####,,,,,,,,,......#',
      '#..,,,,,,,,,####,,,,,,,,,......#',
      '#..,,,,,,,,,####,,,,,,,,,......#',
      '#..,,,,,,,,,####,,,,,,,,,......#',
      '#..,,,,,,,,,####,,,,,,,,,......#',
      '#..F....D...####...D..L.F......#',
      '#..........####................#',
      '#..G.......####.......G........#',
      '#..........####................#',
      '#..p...R...####...s........X...#',
      '################################',
    ],
    patrols: [
      { kind: 'patrol', path: [[3, 14], [3, 2], [13, 2], [13, 14]], pause: 1.0, speed: 1.1 },
      { kind: 'patrol', path: [[28, 14], [28, 2], [18, 2], [18, 14]], pause: 1.0, speed: 1.1 },
      { kind: 'patrol', path: [[15, 12], [6, 12], [6, 5], [25, 5], [25, 12]], pause: 0.7, speed: 1.15 },
    ],
    cameras: [
      { tx: 15, ty: 1, base: Math.PI / 2, sweep: 1.1, speed: 0.55, range: 300 },
      { tx: 16, ty: 16, base: -Math.PI / 2, sweep: 1.1, speed: 0.55, range: 300 },
    ],
    lasers: [],
  },
  {
    name: 'The Obsidian Inner Vault',
    sub: 'Level 4 — cameras and blinking laser tripwires',
    palette: {
      floorA: '#241d33', floorB: '#1f1930', carpet: '#3d2a5e', carpetEdge: '#5b3f8a',
      wall: '#352a4d', wallTop: '#4a3a68', accent: '#c9a6ff', light: '#e0c8ff',
      woodA: '#33241e', woodB: '#2c1f1a', mosaicA: '#2e2447', mosaicB: '#292040',
    },
    map: [
      '################################',
      '#R....s.....####.....s......R..#',
      '#..........####................#',
      '#..B...C...####...C...B........#',
      '#..........####................#',
      '#..mmmmmmmmmm####mmmmmmmmmm....#',
      '#..mmmmmmmmmm####mmmmmmmmmm.L..#',
      '#..mmmmmmmmmm####mmmmmmmmmm....#',
      '#..mmmmmmmmmm####mmmmmmmmmm....#',
      '#..mmmmmmmmmm####mmmmmmmmmm....#',
      '#..mmmmmmmmmm####mmmmmmmmmm....#',
      '#..mmmmmmmmmm####mmmmmmmmmm....#',
      '#..S....D...####...D....S......#',
      '#..........####................#',
      '#..G.......####.......G........#',
      '#..........####................#',
      '#..p...R...####...s........X...#',
      '################################',
    ],
    patrols: [
      { kind: 'patrol', path: [[3, 14], [3, 2], [13, 2], [13, 14]], pause: 0.9, speed: 1.15 },
      { kind: 'patrol', path: [[28, 14], [28, 2], [18, 2], [18, 14]], pause: 0.9, speed: 1.15 },
      { kind: 'patrol', path: [[15, 12], [7, 12], [7, 5], [24, 5], [24, 12]], pause: 0.6, speed: 1.2 },
      { kind: 'patrol', path: [[10, 8], [21, 8]], pause: 0.5, speed: 1.2 },
    ],
    cameras: [
      { tx: 15, ty: 1, base: Math.PI / 2, sweep: 1.0, speed: 0.7, range: 320 },
      { tx: 16, ty: 16, base: -Math.PI / 2, sweep: 1.0, speed: 0.7, range: 320 },
    ],
    lasers: [
      { x1: 15, y1: 4, x2: 15, y2: 13, period: 3.2, duty: 0.55, phase: 0 },
      { x1: 16, y1: 4, x2: 16, y2: 13, period: 3.2, duty: 0.55, phase: 1.6 },
      { x1: 4, y1: 9, x2: 13, y2: 9, period: 4.0, duty: 0.5, phase: 0.8 },
      { x1: 18, y1: 9, x2: 27, y2: 9, period: 4.0, duty: 0.5, phase: 2.4 },
    ],
  },
  {
    name: 'The Moonlit Rooftop Garden',
    sub: 'Level 5 — a heavy guard, a fast scout, and the Gilded Vault',
    palette: {
      floorA: '#1c2f45', floorB: '#182a3e', carpet: '#1e4d3a', carpetEdge: '#2a7a58',
      wall: '#2b4258', wallTop: '#3d5a75', accent: '#ffe9a8', light: '#cfe8ff',
      woodA: '#4a3626', woodB: '#40301f', mosaicA: '#22405c', mosaicB: '#1e3850',
    },
    map: [
      '################################',
      '#R.....s....######....s......R.#',
      '#..........######..............#',
      '#..P...C....######....C...P....#',
      '#..........######..............#',
      '#..wwwwLwwwww######wwwwwwwwww..#',
      '#..wwwwwwwwww######wwwwwwwwww..#',
      '#..wwwwwwwwww######wwwwwwwwww..#',
      '#..wwwwwwwwww######wwwwwwwwww..#',
      '#..wwwwwwwwww######wwwwwwwwww..#',
      '#..wwwwwwwwww######wwwwwwwwww..#',
      '#..wwwwwwwwww######wwwwwwwwww..#',
      '#..F....D...######...D....F....#',
      '#..........######..............#',
      '#..G.......######.......G......#',
      '#..........######..............#',
      '#..p...R...######...s.......X..#',
      '################################',
    ],
    patrols: [
      { kind: 'heavy', path: [[15, 8], [7, 8], [7, 16], [24, 16], [24, 8]], pause: 1.4, speed: 0.55 },
      { kind: 'scout', path: [[3, 14], [3, 2], [13, 2], [13, 14]], pause: 0.4, speed: 1.9 },
      { kind: 'patrol', path: [[28, 14], [28, 2], [18, 2], [18, 14]], pause: 0.9, speed: 1.15 },
      { kind: 'patrol', path: [[10, 12], [21, 12], [21, 5], [10, 5]], pause: 0.7, speed: 1.2 },
    ],
    cameras: [
      { tx: 15, ty: 1, base: Math.PI / 2, sweep: 1.2, speed: 0.6, range: 320 },
      { tx: 16, ty: 16, base: -Math.PI / 2, sweep: 1.2, speed: 0.6, range: 320 },
    ],
    lasers: [],
  },
];

// Parse one level's map into a runtime object: walkable grid, tall-cover grid,
// lamps, relics, exit, player start, guard spawns and camera mounts.
export function parseLevel(def) {
  const grid = [];
  const tall = [];
  const lamps = [];
  const relics = [];
  let exit = null;
  let start = { x: 2.5 * TILE, y: 16.5 * TILE };
  const spawns = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push([]);
    tall.push([]);
    const row = def.map[r] || '';
    for (let c = 0; c < COLS; c++) {
      const ch = row[c] || '#';
      const cx = (c + 0.5) * TILE;
      const cy = (r + 0.5) * TILE;
      grid[r].push(ch);
      tall[r].push(ch === '#' || ch === 'B' || ch === 'S' || ch === 'F');
      if (ch === 'L') lamps.push({ x: cx, y: cy, phase: (c * 7 + r * 13) % 10 });
      if (ch === 'R') relics.push({ x: cx, y: cy, taken: false, bob: (c + r) % 6 });
      if (ch === 'X') exit = { x: cx, y: cy, tx: c, ty: r };
      if (ch === 'p') start = { x: cx, y: cy };
      if (ch === 'G') spawns.push({ x: cx, y: cy });
    }
  }
  return { def, grid, tall, lamps, relics, exit, start, spawns };
}

// A tile is solid (blocks movement) when it is a wall or a prop.
export function isSolid(grid, c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  const ch = grid[r][c];
  return ch === '#' || ch === 'C' || ch === 'D' || ch === 'B' || ch === 'S' || ch === 'P' || ch === 'F' || ch === 'T';
}

// Tall cover blocks a guard's line of sight.
export function blocksSight(tall, c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
  return tall[r][c];
}

// Low cover hides a sneaking player only (crates, desks, plants, curtains).
export function isLowCover(grid, c, r) {
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false;
  const ch = grid[r][c];
  return ch === 'C' || ch === 'D' || ch === 'P' || ch === 'T';
}
