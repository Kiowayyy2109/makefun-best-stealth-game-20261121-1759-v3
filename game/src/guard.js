// Nightshade — guard, camera and laser logic: patrols, vision cones with
// raycast line-of-sight, suspicion that rises and falls, chase, search and alarm.
import { TILE, COLS, ROWS, isSolid, blocksSight, isLowCover } from './levels.js';

export const CONE_HALF = 0.61; // radians, ~35 degrees each side
export const GUARD_RANGE = 235;

function guardSpeed(kind) {
  if (kind === 'heavy') return 34;
  if (kind === 'scout') return 118;
  return 62;
}

function guardRange(kind) {
  if (kind === 'heavy') return 285;
  if (kind === 'scout') return 195;
  return GUARD_RANGE;
}

function guardCone(kind) {
  if (kind === 'heavy') return 0.96;
  return CONE_HALF;
}

// Build one guard from a patrol definition. Waypoints are tile coordinates.
export function makeGuard(def, index, spawn) {
  const path = def.path.map(([c, r]) => ({ x: (c + 0.5) * TILE, y: (r + 0.5) * TILE }));
  const start = path[0] || { x: spawn.x, y: spawn.y };
  return {
    kind: def.kind || 'patrol',
    path,
    wp: 1 % Math.max(path.length, 1),
    x: start.x, y: start.y,
    angle: path.length > 1 ? Math.atan2(path[1].y - start.y, path[1].x - start.x) : -Math.PI / 2,
    speed: guardSpeed(def.kind) * (def.speed || 1),
    range: guardRange(def.kind),
    cone: guardCone(def.kind),
    pause: def.pause || 1,
    pauseLeft: 0,
    scanT: index * 1.7,
    state: 'patrol', // patrol | wary | chase | search
    suspicion: 0,
    lastSeen: null,
    searchT: 0,
    searchTarget: null,
    stuckT: 0,
    steps: [],
    stepT: 0,
  };
}

export function makeCamera(def) {
  return {
    x: (def.tx + 0.5) * TILE, y: (def.ty + 0.5) * TILE,
    base: def.base, sweep: def.sweep, speed: def.speed, range: def.range,
    t: Math.random() * 6.28,
    angle: def.base,
    spotting: false,
  };
}

export function makeLaser(def) {
  return {
    x1: (def.x1 + 0.5) * TILE, y1: (def.y1 + 0.5) * TILE,
    x2: (def.x2 + 0.5) * TILE, y2: (def.y2 + 0.5) * TILE,
    period: def.period, duty: def.duty, phase: def.phase || 0,
    on: true,
  };
}

// True when the straight line from (x0,y0) to (x1,y1) crosses no tall cover.
export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const c = Math.floor((x0 + dx * t) / TILE);
    const r = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(level.tall, c, r)) return false;
  }
  return true;
}

// Raycast one cone edge: march out until a tall tile stops the ray.
export function coneRay(level, x, y, angle, range) {
  const step = 7;
  let d = step;
  while (d < range) {
    const px = x + Math.cos(angle) * d;
    const py = y + Math.sin(angle) * d;
    const c = Math.floor(px / TILE);
    const r = Math.floor(py / TILE);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS || blocksSight(level.tall, c, r)) break;
    d += step;
  }
  return { x: x + Math.cos(angle) * d, y: y + Math.sin(angle) * d, d };
}

// Polygon of the guard's visible cone, clipped by walls.
export function conePolygon(level, g) {
  const rays = 26;
  const pts = [{ x: g.x, y: g.y }];
  for (let i = 0; i <= rays; i++) {
    const a = g.angle - g.cone + (2 * g.cone * i) / rays;
    pts.push(coneRay(level, g.x, g.y, a, g.range));
  }
  return pts;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(g, target, rate, dt) {
  const d = angleDiff(target, g.angle);
  const step = Math.max(-rate * dt, Math.min(rate * dt, d));
  g.angle += step;
}

function moveGuard(level, g, tx, ty, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const vx = (dx / dist) * g.speed * dt;
  const vy = (dy / dist) * g.speed * dt;
  const nx = g.x + vx;
  const ny = g.y + vy;
  if (!hitsSolid(level, nx, g.y)) g.x = nx;
  if (!hitsSolid(level, g.x, ny)) g.y = ny;
  g.angle = Math.atan2(dy, dx);
  return dist < 6;
}

function hitsSolid(level, x, y) {
  const r = 11;
  const pts = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
  return pts.some(([px, py]) => isSolid(level.grid, Math.floor(px / TILE), Math.floor(py / TILE)));
}

// Can this guard see the player right now? Returns a visibility factor 0..1.
export function guardSees(level, g, p, smoke) {
  const dx = p.x - g.x;
  const dy = p.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > g.range) return 0;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, g.angle)) > g.cone) return 0;
  if (!hasLineOfSight(level, g.x, g.y, p.x, p.y)) return 0;
  if (smoke.some((s) => Math.hypot(p.x - s.x, p.y - s.y) < s.r + 10)) return 0;
  // Sneaking behind low cover hides the player even inside a cone.
  if (p.sneaking) {
    const pc = Math.floor(p.x / TILE);
    const pr = Math.floor(p.y / TILE);
    if (isLowCover(level.grid, pc, pr)) return 0;
  }
  let vis = 1 - dist / (g.range * 1.15);
  vis = Math.max(0.25, vis);
  // Lamp light makes the player easier to spot; shadow pools hide them.
  const pc = Math.floor(p.x / TILE);
  const pr = Math.floor(p.y / TILE);
  if (level.grid[pr] && level.grid[pr][pc] === 's') vis *= 0.45;
  for (const lamp of level.lamps) {
    if (Math.hypot(p.x - lamp.x, p.y - lamp.y) < 95) { vis *= 1.6; break; }
  }
  if (p.running) vis *= 1.5;
  if (p.sneaking) vis *= 0.55;
  return Math.min(1, vis);
}

// How fast suspicion rises while seen: nearer + brighter = faster.
export function detectionRate(vis) {
  return 14 + vis * 62;
}

export function updateGuard(level, g, p, smoke, dt, time, onNoise) {
  // Footstep trail for the renderer's "footsteps hint where a guard is".
  g.stepT -= dt;
  if (g.stepT <= 0 && (g.state === 'patrol' || g.state === 'chase')) {
    g.steps.push({ x: g.x, y: g.y, t: 0.9 });
    g.stepT = 0.28;
  }
  g.steps.forEach((s) => { s.t -= dt; });
  g.steps = g.steps.filter((s) => s.t > 0);

  const vis = guardSees(level, g, p, smoke);
  if (vis > 0) {
    g.suspicion += detectionRate(vis) * dt;
    g.lastSeen = { x: p.x, y: p.y, t: time };
    if (g.suspicion >= 100) {
      g.suspicion = 100;
      if (g.state !== 'chase') { g.state = 'chase'; g.searchT = 0; }
    } else if (g.suspicion >= 55) {
      if (g.state === 'patrol') g.state = 'wary';
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - 16 * dt);
    if (g.state === 'wary' && g.suspicion < 25) g.state = 'patrol';
  }

  if (g.kind === 'sentry') {
    // A sentry never leaves its post: it slowly scans back and forth.
    g.scanT += dt;
    g.angle = -Math.PI / 2 + Math.sin(g.scanT * 0.5) * 1.15;
    if (g.state === 'chase' && g.lastSeen) {
      // A sentry that spots the thief raises the alarm for the others.
      onNoise(g.lastSeen.x, g.lastSeen.y, 420);
    }
    return;
  }

  if (g.state === 'chase' && g.lastSeen) {
    const arrived = moveGuard(level, g, g.lastSeen.x, g.lastSeen.y, dt * 1.35);
    if (arrived || time - g.lastSeen.t > 2.2) {
      g.state = 'search';
      g.searchT = 5;
      g.searchTarget = { ...g.lastSeen };
    }
    return;
  }

  if (g.state === 'search') {
    g.searchT -= dt;
    if (g.searchTarget) {
      const arrived = moveGuard(level, g, g.searchTarget.x, g.searchTarget.y, dt);
      if (arrived) {
        g.scanT += dt;
        g.angle += Math.sin(g.scanT * 2.2) * 1.6 * dt;
      }
    }
    if (g.searchT <= 0) { g.state = 'patrol'; g.suspicion = 20; }
    return;
  }

  if (g.state === 'wary' && g.lastSeen) {
    // Wary guards stop and stare toward where they thought they saw something.
    turnToward(g, Math.atan2(g.lastSeen.y - g.y, g.lastSeen.x - g.x), 2.4, dt);
    return;
  }

  // Patrol: walk the waypoints, pausing and looking around at each one.
  if (g.pauseLeft > 0) {
    g.pauseLeft -= dt;
    g.scanT += dt;
    g.angle += Math.sin(g.scanT * 1.8) * 1.1 * dt;
    if (g.pauseLeft <= 0) g.wp = (g.wp + 1) % g.path.length;
    return;
  }
  const target = g.path[g.wp];
  if (target && moveGuard(level, g, target.x, target.y, dt)) {
    g.pauseLeft = g.pause;
  }
}

// A thrown coin: guards that hear it walk over to investigate.
export function guardHearsCoin(g, x, y) {
  if (g.kind === 'sentry') return;
  if (Math.hypot(g.x - x, g.y - y) > 300) return;
  g.state = 'search';
  g.searchT = 4;
  g.searchTarget = { x, y };
  g.suspicion = Math.max(g.suspicion, 35);
}

export function updateCamera(level, cam, p, smoke, dt, time) {
  cam.t += dt;
  cam.angle = cam.base + Math.sin(cam.t * cam.speed) * cam.sweep;
  const dx = p.x - cam.x;
  const dy = p.y - cam.y;
  const dist = Math.hypot(dx, dy);
  cam.spotting = false;
  if (dist > cam.range) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), cam.angle)) > 0.42) return 0;
  if (!hasLineOfSight(level, cam.x, cam.y, p.x, p.y)) return 0;
  if (smoke.some((s) => Math.hypot(p.x - s.x, p.y - s.y) < s.r + 10)) return 0;
  cam.spotting = true;
  return 34 * dt; // cameras raise the alarm fast
}

export function updateLaser(laser, time) {
  const phase = ((time + laser.phase) % laser.period) / laser.period;
  laser.on = phase < laser.duty;
  return laser.on;
}

// True when the player crosses an active laser line.
export function laserTrips(laser, px, py, ox, oy) {
  if (!laser.on) return false;
  const x1 = laser.x1, y1 = laser.y1, x2 = laser.x2, y2 = laser.y2;
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  const dNow = Math.hypot(px - cx, py - cy);
  const t2 = Math.max(0, Math.min(1, ((ox - x1) * dx + (oy - y1) * dy) / len2));
  const dOld = Math.hypot(ox - (x1 + t2 * dx), oy - (y1 + t2 * dy));
  return dNow < 12 && dOld >= 12;
}
