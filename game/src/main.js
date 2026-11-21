// Nightshade — bootstrap and game loop: state machine (title, briefing, play,
// level-clear, win, caught, pause), alarm and detection, gadgets, and the
// staged screenshot scenes (?scene=cover|sneak|exit) used for the hand-in shots.
import { LEVELS, TILE, parseLevel } from './levels.js';
import {
  makeGuard, makeCamera, makeLaser, updateGuard, updateCamera, updateLaser,
  laserTrips, guardHearsCoin,
} from './guard.js';
import { makePlayer, updatePlayer, tossCoin, updateCoins, dropSmoke, updateSmoke, nearRelic } from './player.js';
import { makeAudio } from './audio.js';
import { makeInput } from './input.js';
import { drawGame } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const audio = makeAudio();
const input = makeInput(canvas);

const S = {
  mode: 'title',
  levelIndex: 0,
  level: null,
  guards: [],
  cameras: [],
  lasers: [],
  player: null,
  coins: [],
  smoke: [],
  time: 0,
  animT: 0,
  alarmActive: false,
  alarmT: 0,
  detections: 0,
  totalDetections: 0,
  totalTime: 0,
  rating: '',
  ratings: [],
  clearTime: '',
  totalTimeStr: '',
  nearRelic: null,
  frozen: false,
  stepAcc: 0,
};

function fmt(t) {
  const s = Math.max(0, Math.floor(t));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function loadLevel(i) {
  const def = LEVELS[i];
  const level = parseLevel(def);
  S.levelIndex = i;
  S.level = level;
  S.guards = def.patrols.map((p, idx) => makeGuard(p, idx, level.spawns[idx % Math.max(level.spawns.length, 1)] || level.start));
  S.cameras = def.cameras.map(makeCamera);
  S.lasers = def.lasers.map(makeLaser);
  S.player = makePlayer(level.start.x, level.start.y);
  S.coins = [];
  S.smoke = [];
  S.time = 0;
  S.detections = 0;
  S.alarmActive = false;
  S.alarmT = 0;
  S.nearRelic = null;
  S.stepAcc = 0;
}

function ratingFor(detections) {
  if (detections === 0) return 'GHOST';
  if (detections <= 2) return 'SILENT';
  return 'SHADOW';
}

function raiseAlarm(sourceX, sourceY) {
  if (!S.alarmActive) {
    S.detections += 1;
    audio.alert();
  }
  S.alarmActive = true;
  S.alarmT = 6;
  for (const g of S.guards) {
    if (g.kind === 'sentry') continue;
    if (g.state !== 'chase') {
      g.state = 'chase';
      g.suspicion = 100;
      g.lastSeen = { x: sourceX, y: sourceY, t: S.time };
    }
  }
}

function levelClear() {
  const rating = ratingFor(S.detections);
  S.rating = rating;
  S.ratings.push(rating);
  S.clearTime = fmt(S.time);
  S.totalTime += S.time;
  S.totalDetections += S.detections;
  audio.win();
  if (S.levelIndex >= LEVELS.length - 1) {
    S.totalTimeStr = fmt(S.totalTime);
    S.mode = 'win';
    setStatus('You cleared every vault. The Gilded Vault is yours.');
  } else {
    S.mode = 'clear';
    setStatus(`Vault cleared with a ${rating} rating.`);
  }
}

// Staged scenes for the hand-in screenshots: the real game, posed mid-play.
function stageScene(name) {
  S.frozen = true;
  if (name === 'cover') {
    loadLevel(2);
    S.mode = 'play';
    S.player.x = 8.5 * TILE;
    S.player.y = 8.5 * TILE;
    S.player.relics = 2;
    S.player.facing = 0;
    S.level.relics[0].taken = true;
    S.level.relics[1].taken = true;
    const g0 = S.guards[0];
    g0.x = 5.5 * TILE; g0.y = 8.5 * TILE;
    g0.angle = 0;
    g0.suspicion = 100;
    g0.state = 'chase';
    g0.lastSeen = { x: S.player.x, y: S.player.y, t: 0 };
    const g1 = S.guards[1];
    g1.x = 24.5 * TILE; g1.y = 6.5 * TILE;
    g1.angle = Math.PI * 0.75;
    g1.suspicion = 62;
    g1.state = 'wary';
    g1.lastSeen = { x: S.player.x, y: S.player.y, t: 0 };
    S.guards[2].x = 20.5 * TILE; S.guards[2].y = 12.5 * TILE;
    S.guards[2].angle = -Math.PI / 2;
    S.alarmActive = true;
    S.alarmT = 99;
    S.time = 73;
    dropSmoke(S.player, S.smoke);
    S.smoke[0].x = S.player.x + 40;
    S.smoke[0].y = S.player.y + 30;
  } else if (name === 'sneak') {
    loadLevel(1);
    S.mode = 'play';
    S.player.x = 9.5 * TILE;
    S.player.y = 6.5 * TILE;
    S.player.facing = -Math.PI / 2;
    S.player.sneaking = true;
    S.player.relics = 1;
    S.level.relics[0].taken = true;
    const g0 = S.guards[0];
    g0.x = 9.5 * TILE; g0.y = 3.5 * TILE;
    g0.angle = Math.PI / 2;
    g0.suspicion = 44;
    g0.state = 'wary';
    g0.lastSeen = { x: S.player.x, y: S.player.y, t: 0 };
    S.guards[1].x = 24.5 * TILE; S.guards[1].y = 10.5 * TILE;
    S.guards[1].angle = Math.PI;
    S.time = 41;
  } else if (name === 'exit') {
    loadLevel(3);
    S.mode = 'play';
    for (const r of S.level.relics) r.taken = true;
    S.player.relics = 3;
    const e = S.level.exit;
    S.player.x = e.x - 2.5 * TILE;
    S.player.y = e.y;
    S.player.facing = 0;
    S.guards[0].x = 20.5 * TILE; S.guards[0].y = 12.5 * TILE;
    S.guards[0].angle = -Math.PI / 2;
    S.guards[0].suspicion = 18;
    S.guards[1].x = 26.5 * TILE; S.guards[1].y = 6.5 * TILE;
    S.guards[1].angle = Math.PI / 2;
    S.guards[2].x = 7.5 * TILE; S.guards[2].y = 8.5 * TILE;
    S.guards[2].angle = 0;
    S.time = 128;
    audio.unlock();
  }
}

function update(dt) {
  S.animT += dt;
  if (S.frozen) return;
  if (S.mode !== 'play') return;
  S.time += dt;
  const p = S.player;
  const oldX = p.x, oldY = p.y;
  const moved = updatePlayer(S.level, p, input.keys, dt);
  S.stepAcc += moved;
  if (S.stepAcc > 95) {
    S.stepAcc = 0;
    audio.footstep(p.sneaking, p.running);
  }
  // Running is loud: nearby guards come to look.
  if (p.running && p.moving) {
    for (const g of S.guards) {
      if (g.state === 'chase') continue;
      if (Math.hypot(g.x - p.x, g.y - p.y) < 150) guardHearsCoin(g, p.x, p.y);
    }
  }
  // Gadgets.
  if (input.consume('q')) {
    const coin = tossCoin(p, S.coins, input.mouse.inside ? input.mouse : null);
    if (coin) audio.coin();
  }
  if (input.consume('f')) {
    if (dropSmoke(p, S.smoke)) audio.smoke();
  }
  if (input.consume('e')) {
    const r = nearRelic(S.level, p);
    if (r) {
      r.taken = true;
      p.relics += 1;
      audio.pickup();
      if (p.relics >= 3) audio.unlock();
    }
  }
  S.nearRelic = nearRelic(S.level, p);
  // Coins landing draw guards over.
  const landed = S.coins.filter((c) => c.landed && c.ring > 0.85);
  S.coins = updateCoins(S.coins, dt);
  for (const c of landed) {
    for (const g of S.guards) guardHearsCoin(g, c.x, c.y);
  }
  S.smoke = updateSmoke(S.smoke, dt);
  // Cameras.
  let cameraSeen = false;
  for (const cam of S.cameras) {
    if (updateCamera(S.level, cam, p, S.smoke, dt, S.time) > 0) cameraSeen = true;
  }
  if (cameraSeen && !S.alarmActive) raiseAlarm(p.x, p.y);
  if (S.cameras.length > 0) audio.cameraHum();
  // Lasers.
  for (const l of S.lasers) {
    updateLaser(l, S.time);
    if (laserTrips(l, p.x, p.y, oldX, oldY)) raiseAlarm(p.x, p.y);
  }
  // Guards.
  let anyChase = false;
  for (const g of S.guards) {
    const wasChase = g.state === 'chase';
    updateGuard(S.level, g, p, S.smoke, dt, S.time, (x, y) => {
      if (!S.alarmActive) raiseAlarm(x, y);
    });
    if (g.state === 'chase' && !wasChase && !S.alarmActive) raiseAlarm(p.x, p.y);
    if (g.state === 'chase') anyChase = true;
    if (g.state === 'chase' && Math.hypot(g.x - p.x, g.y - p.y) < 24) {
      S.mode = 'caught';
      audio.stopHum();
      audio.lose();
      setStatus('Caught! A guard closed in on you.');
      return;
    }
  }
  if (S.alarmActive) {
    S.alarmT -= dt;
    if (S.alarmT <= 0 && !anyChase) S.alarmActive = false;
  }
  // Exit: open only once all three relics are stolen.
  const e = S.level.exit;
  if (e && p.relics >= 3 && Math.hypot(p.x - e.x, p.y - e.y) < 26) {
    audio.stopHum();
    levelClear();
  }
}

function handleKeys() {
  if (input.consume('m')) {
    const muted = audio.toggleMute();
    setStatus(muted ? 'Sound muted.' : 'Sound on.');
  }
  if (S.mode === 'title' && input.consume('enter')) {
    S.mode = 'brief';
    audio.ensure();
    setStatus(`${S.level.def.name}. ${S.level.def.sub}`);
  } else if (S.mode === 'brief' && input.consume('enter')) {
    S.mode = 'play';
    setStatus('Slip past the guards. Steal 3 relics, then reach the exit unseen.');
  } else if (S.mode === 'clear' && input.consume('enter')) {
    loadLevel(S.levelIndex + 1);
    S.mode = 'brief';
    setStatus(`${S.level.def.name}. ${S.level.def.sub}`);
  } else if ((S.mode === 'caught' || S.mode === 'win') && input.consume('r')) {
    if (S.mode === 'win') {
      S.ratings = [];
      S.totalTime = 0;
      S.totalDetections = 0;
    }
    loadLevel(S.mode === 'win' ? 0 : S.levelIndex);
    S.mode = 'brief';
  } else if (S.mode === 'play' && (input.consume('escape') || input.consume('p'))) {
    S.mode = 'pause';
    audio.stopHum();
  } else if (S.mode === 'pause' && (input.consume('escape') || input.consume('p'))) {
    S.mode = 'play';
  } else if (S.mode === 'play' && input.consume('r')) {
    loadLevel(S.levelIndex);
  }
}

loadLevel(0);
// Debug hook for automated play-testing: the live state, read-only from outside.
window.__nightshade = S;
const scene = new URLSearchParams(window.location.search).get('scene');
if (scene === 'cover' || scene === 'sneak' || scene === 'exit') {
  stageScene(scene);
  setStatus(`Nightshade, ${S.level.def.name}.`);
} else {
  setStatus('Nightshade — The Gilded Vault III. Press Enter to begin the heist.');
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handleKeys();
  update(dt);
  drawGame(ctx, S, S.animT);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
