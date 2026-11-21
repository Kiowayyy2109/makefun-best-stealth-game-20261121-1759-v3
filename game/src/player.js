// Nightshade — the thief: movement (walk / sneak / run), noise rings,
// the coin-toss and smoke-bomb gadgets, and relic pickups.
import { TILE, isSolid } from './levels.js';

export const WALK_SPEED = 150;
export const SNEAK_SPEED = 82;
export const RUN_SPEED = 235;

export function makePlayer(x, y) {
  return {
    x, y, r: 12,
    vx: 0, vy: 0,
    facing: -Math.PI / 2,
    moving: false,
    sneaking: false,
    running: false,
    coins: 3,
    smoke: 2,
    relics: 0,
    noiseT: 0,
    noiseR: 0,
    stepT: 0,
    steps: [],
  };
}

function hitsSolid(level, x, y, r) {
  const pts = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
  return pts.some(([px, py]) => isSolid(level.grid, Math.floor(px / TILE), Math.floor(py / TILE)));
}

// Move the player one frame. Returns the distance travelled (for footstep sounds).
export function updatePlayer(level, p, keys, dt) {
  let ix = 0, iy = 0;
  if (keys.left) ix -= 1;
  if (keys.right) ix += 1;
  if (keys.up) iy -= 1;
  if (keys.down) iy += 1;
  p.moving = ix !== 0 || iy !== 0;
  p.sneaking = !!keys.sneak && p.moving;
  p.running = !!keys.run && p.moving && !p.sneaking;
  const speed = p.sneaking ? SNEAK_SPEED : p.running ? RUN_SPEED : WALK_SPEED;
  let moved = 0;
  if (p.moving) {
    const len = Math.hypot(ix, iy);
    const nx = p.x + (ix / len) * speed * dt;
    const ny = p.y + (iy / len) * speed * dt;
    if (!hitsSolid(level, nx, p.y, p.r)) { moved += Math.abs(nx - p.x); p.x = nx; }
    if (!hitsSolid(level, p.x, ny, p.r)) { moved += Math.abs(ny - p.y); p.y = ny; }
    p.facing = Math.atan2(iy, ix);
  }
  // Running is loud: a noise ring guards can hear, fading over half a second.
  if (p.running && p.moving) {
    p.noiseT = 0.45;
    p.noiseR = 130;
  } else {
    p.noiseT = Math.max(0, p.noiseT - dt);
  }
  // Footstep dots so the player can read their own trail.
  p.stepT -= dt;
  if (p.moving && p.stepT <= 0) {
    p.steps.push({ x: p.x, y: p.y, t: 0.7 });
    p.stepT = p.sneaking ? 0.42 : p.running ? 0.16 : 0.26;
  }
  p.steps.forEach((s) => { s.t -= dt; });
  p.steps = p.steps.filter((s) => s.t > 0);
  return moved;
}

// Toss a coin toward the facing direction (or the mouse, when given).
// It lands, clinks, and every guard nearby walks over to look.
export function tossCoin(p, coins, mouse) {
  if (p.coins <= 0) return null;
  p.coins -= 1;
  let ang = p.facing;
  if (mouse) ang = Math.atan2(mouse.y - p.y, mouse.x - p.x);
  const dist = 190;
  const coin = {
    x: p.x + Math.cos(ang) * dist,
    y: p.y + Math.sin(ang) * dist,
    t: 0,
    ring: 0,
    landed: false,
  };
  coins.push(coin);
  return coin;
}

export function updateCoins(coins, dt) {
  for (const c of coins) {
    c.t += dt;
    if (c.t > 0.35 && !c.landed) { c.landed = true; c.ring = 1; }
    if (c.landed && c.ring > 0) c.ring = Math.max(0, c.ring - dt * 1.4);
  }
  return coins.filter((c) => c.t < 6);
}

// Drop a smoke bomb at the player's feet: a cloud that blocks every cone.
export function dropSmoke(p, smoke) {
  if (p.smoke <= 0) return null;
  p.smoke -= 1;
  const cloud = { x: p.x, y: p.y, r: 78, t: 4.5 };
  smoke.push(cloud);
  return cloud;
}

export function updateSmoke(smoke, dt) {
  for (const s of smoke) s.t -= dt;
  return smoke.filter((s) => s.t > 0);
}

// The nearest untaken relic within reach, for the E prompt.
export function nearRelic(level, p) {
  for (const r of level.relics) {
    if (!r.taken && Math.hypot(r.x - p.x, r.y - p.y) < 34) return r;
  }
  return null;
}
