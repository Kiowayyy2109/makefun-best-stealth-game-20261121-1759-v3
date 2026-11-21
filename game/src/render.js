// Nightshade — all drawing: textured floors, cover props, guards with vision
// cones, dynamic lamp lighting, HUD, minimap and every screen.
import { TILE, COLS, ROWS } from './levels.js';
import { conePolygon, coneRay } from './guard.js';

const W = 1280;
const H = 720;
const lightCanvas = document.createElement('canvas');
lightCanvas.width = W;
lightCanvas.height = H;

function hash(c, r) {
  let h = (c * 374761393 + r * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, S) {
  const pal = S.level.def.palette;
  const grid = S.level.grid;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = grid[r][c];
      const x = c * TILE;
      const y = r * TILE;
      if (ch === '#') {
        ctx.fillStyle = pal.wall;
        ctx.fillRect(x, y, TILE, TILE);
        // A lighter top edge where the wall meets open floor below it.
        if (r + 1 < ROWS && grid[r + 1][c] !== '#') {
          ctx.fillStyle = pal.wallTop;
          ctx.fillRect(x, y + TILE - 6, TILE, 6);
        }
        continue;
      }
      if (ch === ',') {
        ctx.fillStyle = pal.carpet;
        ctx.fillRect(x, y, TILE, TILE);
        const nb = (cc, rr2) => (grid[rr2] && grid[rr2][cc] !== ',');
        ctx.fillStyle = pal.carpetEdge;
        if (nb(c, r - 1)) ctx.fillRect(x, y, TILE, 3);
        if (nb(c, r + 1)) ctx.fillRect(x, y + TILE - 3, TILE, 3);
        if (nb(c - 1, r)) ctx.fillRect(x, y, 3, TILE);
        if (nb(c + 1, r)) ctx.fillRect(x + TILE - 3, y, 3, TILE);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x + 9, y + 9, TILE - 18, TILE - 18);
        continue;
      }
      if (ch === 'w') {
        ctx.fillStyle = (r % 2 === 0) ? pal.woodA : pal.woodB;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(x, y, TILE, 2);
        ctx.fillRect(x + ((c * 17) % 40), y, 2, TILE);
        continue;
      }
      if (ch === 'm') {
        ctx.fillStyle = ((c + r) % 2 === 0) ? pal.mosaicA : pal.mosaicB;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      if (ch === 's') {
        ctx.fillStyle = '#0a0d1d';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(120,140,255,0.10)';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 9, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      // Marble checker with a faint vein speckle.
      ctx.fillStyle = ((c + r) % 2 === 0) ? pal.floorA : pal.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      if (hash(c, r) > 0.72) {
        ctx.fillStyle = 'rgba(255,255,255,0.045)';
        ctx.fillRect(x + 6 + hash(r, c) * 20, y + 6 + hash(c + 9, r) * 20, 8, 2);
      }
    }
  }
}

function drawProp(ctx, S, ch, x, y, time) {
  const pal = S.level.def.palette;
  if (ch === 'C') {
    ctx.fillStyle = '#6b4a26';
    ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
    ctx.strokeStyle = '#3f2a14';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + TILE - 4, y + TILE - 4);
    ctx.moveTo(x + TILE - 4, y + 4); ctx.lineTo(x + 4, y + TILE - 4);
    ctx.stroke();
  } else if (ch === 'D') {
    ctx.fillStyle = '#5d3d20';
    rr(ctx, x + 3, y + 6, TILE - 6, TILE - 14, 4);
    ctx.fill();
    ctx.fillStyle = '#f2ead8';
    ctx.fillRect(x + 10, y + 12, 14, 10);
    ctx.fillStyle = '#2a1a0e';
    ctx.fillRect(x + 26, y + 26, 4, 4);
  } else if (ch === 'B') {
    ctx.fillStyle = '#3a2417';
    ctx.fillRect(x + 3, y + 2, TILE - 6, TILE - 4);
    const cols = ['#b8443c', '#3c6fb8', '#c9a13b', '#4a9a5c', '#8a4fb8'];
    for (let s = 0; s < 3; s++) {
      for (let b = 0; b < 5; b++) {
        ctx.fillStyle = cols[(b + s) % 5];
        ctx.fillRect(x + 6 + b * 6, y + 6 + s * 11, 4, 9);
      }
    }
  } else if (ch === 'S') {
    ctx.fillStyle = '#5a5f6e';
    ctx.fillRect(x + 8, y + 28, TILE - 16, 8);
    ctx.fillStyle = '#8b90a3';
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + 13, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 13, y + 18, 14, 12);
    ctx.fillStyle = '#aab0c2';
    ctx.beginPath();
    ctx.arc(x + TILE / 2, y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (ch === 'P') {
    ctx.fillStyle = '#a85c33';
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 24); ctx.lineTo(x + 30, y + 24); ctx.lineTo(x + 27, y + 36); ctx.lineTo(x + 13, y + 36);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3f8a4d';
    for (const [dx, dy, rr2] of [[-7, -4, 8], [7, -5, 8], [0, -10, 9]]) {
      ctx.beginPath();
      ctx.arc(x + TILE / 2 + dx, y + 20 + dy, rr2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ch === 'T') {
    ctx.fillStyle = '#7a2430';
    ctx.fillRect(x + 2, y + 2, 10, TILE - 4);
    ctx.fillRect(x + TILE - 12, y + 2, 10, TILE - 4);
    ctx.fillStyle = '#a83244';
    ctx.fillRect(x + 5, y + 2, 4, TILE - 4);
    ctx.fillRect(x + TILE - 9, y + 2, 4, TILE - 4);
  } else if (ch === 'F') {
    ctx.fillStyle = '#5a5f6e';
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f8fc9';
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9fd4ff';
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + TILE / 2, 5 + Math.sin(time * 3) * 1.5, 0, Math.PI * 2); ctx.fill();
  } else if (ch === 'L') {
    const flick = 0.86 + Math.sin(time * 9 + x) * 0.07 + Math.sin(time * 23 + y) * 0.05;
    ctx.strokeStyle = '#2c2f3d';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + TILE / 2, y + TILE - 4); ctx.lineTo(x + TILE / 2, y + 10); ctx.stroke();
    const g = ctx.createRadialGradient(x + TILE / 2, y + 10, 2, x + TILE / 2, y + 10, 26 * flick);
    g.addColorStop(0, 'rgba(255,230,160,0.95)');
    g.addColorStop(0.4, 'rgba(255,200,110,0.45)');
    g.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + 10, 26 * flick, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(x + TILE / 2, y + 10, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawRelics(ctx, S, time) {
  for (const r of S.level.relics) {
    if (r.taken) continue;
    const pulse = 1 + Math.sin(time * 3 + r.bob) * 0.12;
    const g = ctx.createRadialGradient(r.x, r.y, 2, r.x, r.y, 30 * pulse);
    g.addColorStop(0, 'rgba(255,215,90,0.85)');
    g.addColorStop(1, 'rgba(255,215,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(r.x, r.y, 30 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(r.x, r.y + Math.sin(time * 2 + r.bob) * 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd75e';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#8a6414';
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }
}

function drawExit(ctx, S, time) {
  const e = S.level.exit;
  if (!e) return;
  const open = S.player.relics >= 3;
  const cx = e.x, cy = e.y;
  if (open) {
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 52 + Math.sin(time * 4) * 6);
    g.addColorStop(0, 'rgba(90,255,150,0.8)');
    g.addColorStop(1, 'rgba(90,255,150,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0d2b18';
    ctx.fillRect(cx - 16, cy - 18, 32, 36);
    ctx.fillStyle = '#5aff96';
    ctx.fillRect(cx - 12, cy - 14, 24, 28);
    ctx.fillStyle = '#0d2b18';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', cx, cy - 26);
  } else {
    ctx.fillStyle = '#3d1220';
    ctx.fillRect(cx - 16, cy - 18, 32, 36);
    ctx.strokeStyle = '#c23b4e';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 16, cy - 18, 32, 36);
    ctx.strokeStyle = '#e8b64c';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy - 2, 6, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#e8b64c';
    ctx.fillRect(cx - 5, cy - 2, 10, 9);
    ctx.fillStyle = '#ff8a9a';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED', cx, cy - 26);
  }
}

function drawCones(ctx, S) {
  for (const g of S.guards) {
    const poly = conePolygon(S.level, g);
    const hot = g.state === 'chase' || g.state === 'wary';
    const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.range);
    grad.addColorStop(0, hot ? 'rgba(255,70,60,0.34)' : 'rgba(255,210,90,0.26)');
    grad.addColorStop(1, hot ? 'rgba(255,70,60,0.05)' : 'rgba(255,210,90,0.04)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
  }
  for (const cam of S.cameras) {
    const poly = [];
    poly.push({ x: cam.x, y: cam.y });
    for (let i = 0; i <= 14; i++) {
      const a = cam.angle - 0.42 + (0.84 * i) / 14;
      poly.push(coneRay(S.level, cam.x, cam.y, a, cam.range));
    }
    const grad = ctx.createRadialGradient(cam.x, cam.y, 8, cam.x, cam.y, cam.range);
    grad.addColorStop(0, cam.spotting ? 'rgba(255,60,50,0.4)' : 'rgba(255,120,60,0.2)');
    grad.addColorStop(1, 'rgba(255,120,60,0.03)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGuard(ctx, S, g, time) {
  // Fading footstep dots: they tell the player where a guard has been.
  for (const s of g.steps) {
    ctx.fillStyle = `rgba(200,210,255,${(s.t / 0.9) * 0.35})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  const heavy = g.kind === 'heavy';
  const scout = g.kind === 'scout';
  const R = heavy ? 15 : scout ? 11 : 13;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(g.x, g.y + R * 0.8, R, R * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  // Body: dark uniform with a rim the eye can find against any floor.
  ctx.fillStyle = heavy ? '#2e2438' : '#232a45';
  ctx.beginPath(); ctx.arc(g.x, g.y, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8fa3d9';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (heavy) {
    ctx.fillStyle = '#4a3a5e';
    ctx.fillRect(g.x - R - 3, g.y - 4, 6, 8);
    ctx.fillRect(g.x + R - 3, g.y - 4, 6, 8);
  }
  if (scout) {
    ctx.strokeStyle = '#d94f4f';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(g.x, g.y, R - 3, 0, Math.PI * 2); ctx.stroke();
  }
  // Helmet + facing tick: the direction the guard looks.
  ctx.fillStyle = '#3d4a75';
  ctx.beginPath(); ctx.arc(g.x, g.y - 2, R * 0.55, 0, Math.PI * 2); ctx.fill();
  const fx = g.x + Math.cos(g.angle) * (R + 7);
  const fy = g.y + Math.sin(g.angle) * (R + 7);
  ctx.strokeStyle = '#ffd75e';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(fx, fy); ctx.stroke();
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, Math.PI * 2); ctx.fill();
  // Suspicion arc + mark above the head.
  if (g.suspicion > 4) {
    const frac = g.suspicion / 100;
    ctx.strokeStyle = g.state === 'chase' ? '#ff5040' : g.state === 'wary' ? '#ffcf4d' : '#c9d4ff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(g.x, g.y - R - 8, 9, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
    if (g.state === 'chase' || g.suspicion >= 55) {
      ctx.fillStyle = '#ff5040';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - R - 20);
    } else if (g.state === 'wary' || g.suspicion >= 25) {
      ctx.fillStyle = '#ffcf4d';
      ctx.font = 'bold 17px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - R - 20);
    }
  }
}

function drawPlayer(ctx, S, time) {
  const p = S.player;
  for (const s of p.steps) {
    ctx.fillStyle = `rgba(255,215,90,${(s.t / 0.7) * 0.3})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  const R = p.sneaking ? 10 : 12;
  // Hooded cloak: near-black with a gold trim ring so the thief reads at a glance.
  ctx.fillStyle = '#14121f';
  ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e8b64c';
  ctx.lineWidth = 2;
  ctx.stroke();
  const hx = p.x + Math.cos(p.facing) * 6;
  const hy = p.y + Math.sin(p.facing) * 6;
  ctx.fillStyle = '#2c2740';
  ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath(); ctx.arc(hx + Math.cos(p.facing) * 3, hy + Math.sin(p.facing) * 3, 2, 0, Math.PI * 2); ctx.fill();
  if (p.sneaking) {
    ctx.fillStyle = '#8fa3d9';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneak', p.x, p.y - R - 8);
  }
  // Running noise ring: guards hear it, and the player sees why.
  if (p.noiseT > 0) {
    ctx.strokeStyle = `rgba(255,120,90,${p.noiseT * 1.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.noiseR * (1 - p.noiseT), 0, Math.PI * 2); ctx.stroke();
  }
}

function drawCoinsSmoke(ctx, S) {
  for (const c of S.coins) {
    if (!c.landed) {
      ctx.fillStyle = '#ffd75e';
      ctx.beginPath(); ctx.arc(c.x, c.y - 8, 5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#e8b64c';
      ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6414';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (c.ring > 0) {
      ctx.strokeStyle = `rgba(255,215,90,${c.ring})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(c.x, c.y, (1 - c.ring) * 90 + 8, 0, Math.PI * 2); ctx.stroke();
    }
  }
  for (const s of S.smoke) {
    const g = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r);
    g.addColorStop(0, 'rgba(210,215,230,0.85)');
    g.addColorStop(1, 'rgba(210,215,230,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawLasers(ctx, S, time) {
  for (const l of S.lasers) {
    if (!l.on) {
      // Blinking off: show the faint emitter dots so the timing reads.
      ctx.fillStyle = 'rgba(255,80,80,0.5)';
      ctx.beginPath(); ctx.arc(l.x1, l.y1, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(l.x2, l.y2, 4, 0, Math.PI * 2); ctx.fill();
      continue;
    }
    const blink = 0.65 + Math.sin(time * 10) * 0.25;
    ctx.strokeStyle = `rgba(255,60,70,${blink})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,180,180,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.fillStyle = '#ff5050';
    ctx.beginPath(); ctx.arc(l.x1, l.y1, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(l.x2, l.y2, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawLighting(ctx, S, time) {
  const lc = lightCanvas.getContext('2d');
  lc.clearRect(0, 0, W, H);
  lc.globalCompositeOperation = 'source-over';
  lc.fillStyle = 'rgba(3,5,14,0.52)';
  lc.fillRect(0, 0, W, H);
  lc.globalCompositeOperation = 'destination-out';
  const punch = (x, y, r) => {
    const g = lc.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    lc.fillStyle = g;
    lc.beginPath(); lc.arc(x, y, r, 0, Math.PI * 2); lc.fill();
  };
  for (const lamp of S.level.lamps) {
    const flick = 210 + Math.sin(time * 9 + lamp.phase) * 10 + Math.sin(time * 23 + lamp.phase * 2) * 6;
    punch(lamp.x, lamp.y, flick);
  }
  punch(S.player.x, S.player.y, 165);
  for (const r of S.level.relics) if (!r.taken) punch(r.x, r.y, 70);
  if (S.player.relics >= 3 && S.level.exit) punch(S.level.exit.x, S.level.exit.y, 120);
  for (const s of S.smoke) punch(s.x, s.y, s.r * 0.9);
  ctx.drawImage(lightCanvas, 0, 0);
  // Warm lamp glow laid over the dark, so lit floor reads as dangerous.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const lamp of S.level.lamps) {
    const flick = 0.16 + Math.sin(time * 9 + lamp.phase) * 0.03;
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, 210);
    g.addColorStop(0, `rgba(255,190,100,${flick})`);
    g.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 210, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawHUD(ctx, S) {
  const maxSus = Math.max(0, ...S.guards.map((g) => g.suspicion), S.cameras.some((c) => c.spotting) ? 80 : 0);
  ctx.fillStyle = 'rgba(5,7,16,0.82)';
  ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = 'rgba(232,182,76,0.9)';
  ctx.fillRect(0, 46, W, 2);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(S.level.def.name, 14, 20);
  ctx.fillStyle = '#9aa5c9';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(S.level.def.sub, 14, 38);
  // Relics, gadgets, timer.
  let x = 560;
  ctx.textAlign = 'left';
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(x + i * 26, 22);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = i < S.player.relics ? '#ffd75e' : 'rgba(255,215,94,0.25)';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeStyle = '#8a6414';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
  }
  x = 650;
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`RELICS ${S.player.relics}/3`, x, 27);
  x = 770;
  ctx.fillStyle = S.player.coins > 0 ? '#ffd75e' : '#777';
  ctx.fillText(`COIN [Q] x${S.player.coins}`, x, 27);
  x = 900;
  ctx.fillStyle = S.player.smoke > 0 ? '#d2d7e6' : '#777';
  ctx.fillText(`SMOKE [F] x${S.player.smoke}`, x, 27);
  const t = Math.max(0, Math.floor(S.time));
  ctx.fillStyle = '#f2ead8';
  ctx.fillText(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, 1085, 27);
  // Detection meter.
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(1150, 14, 110, 12);
  ctx.fillStyle = maxSus > 70 ? '#ff5040' : maxSus > 35 ? '#ffcf4d' : '#7ad07a';
  ctx.fillRect(1150, 14, 110 * (maxSus / 100), 12);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('SEEN', 1150, 40);
  // Alarm banner.
  if (S.alarmActive) {
    const blink = Math.sin(S.time * 10) > 0;
    ctx.fillStyle = blink ? 'rgba(200,30,30,0.9)' : 'rgba(140,20,20,0.9)';
    ctx.fillRect(0, 48, W, 26);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!!  ALARM — THE GUARDS ARE COMING FOR YOU  !!', W / 2, 66);
  }
  // Objective + controls footer.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(5,7,16,0.75)';
  ctx.fillRect(0, H - 26, W, 26);
  ctx.fillStyle = '#c9d4ff';
  ctx.font = '12px system-ui, sans-serif';
  const obj = S.player.relics >= 3 ? 'All relics stolen — reach the glowing EXIT unseen!' : `Steal 3 relics, then slip out the EXIT unseen.  (${S.player.relics}/3)`;
  ctx.fillText(obj, 14, H - 9);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#8fa0c9';
  ctx.fillText('WASD move · SHIFT sneak · SPACE run · Q coin · F smoke · E take · R retry · M mute', W - 14, H - 9);
  // Near-relic prompt.
  if (S.nearRelic) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd75e';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('Press  E  —  take the relic', W / 2, H - 40);
  }
}

function drawMinimap(ctx, S) {
  const mw = 200, mh = 116;
  // Top-right, under the HUD bar: the bottom-right corner stays clear for the exit.
  const x0 = W - mw - 14, y0 = 56;
  const sx = mw / (COLS * TILE), sy = mh / (ROWS * TILE);
  ctx.fillStyle = 'rgba(5,7,16,0.85)';
  ctx.fillRect(x0, y0, mw, mh);
  ctx.strokeStyle = '#e8b64c';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x0, y0, mw, mh);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MAP', x0 + 6, y0 + 12);
  const grid = S.level.grid;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] === '#') {
        ctx.fillStyle = '#5a6a95';
        ctx.fillRect(x0 + c * TILE * sx, y0 + r * TILE * sy, TILE * sx + 0.5, TILE * sy + 0.5);
      }
    }
  }
  for (const l of S.lasers) {
    if (!l.on) continue;
    ctx.strokeStyle = '#ff5050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 + l.x1 * sx, y0 + l.y1 * sy);
    ctx.lineTo(x0 + l.x2 * sx, y0 + l.y2 * sy);
    ctx.stroke();
  }
  if (S.level.exit) {
    ctx.fillStyle = S.player.relics >= 3 ? '#5aff96' : '#c23b4e';
    ctx.fillRect(x0 + S.level.exit.x * sx - 3, y0 + S.level.exit.y * sy - 3, 6, 6);
  }
  for (const r of S.level.relics) {
    if (r.taken) continue;
    ctx.fillStyle = '#ffd75e';
    ctx.fillRect(x0 + r.x * sx - 2, y0 + r.y * sy - 2, 4, 4);
  }
  for (const cam of S.cameras) {
    ctx.fillStyle = '#ff8a3c';
    ctx.beginPath(); ctx.arc(x0 + cam.x * sx, y0 + cam.y * sy, 3, 0, Math.PI * 2); ctx.fill();
  }
  for (const g of S.guards) {
    ctx.fillStyle = g.state === 'chase' ? '#ff4030' : '#ff7070';
    ctx.beginPath(); ctx.arc(x0 + g.x * sx, y0 + g.y * sy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff7070';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 + g.x * sx, y0 + g.y * sy);
    ctx.lineTo(x0 + (g.x + Math.cos(g.angle) * 22) * sx, y0 + (g.y + Math.sin(g.angle) * 22) * sy);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath(); ctx.arc(x0 + S.player.x * sx, y0 + S.player.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(4,6,14,0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent || '#e8b64c';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(title, W / 2, 210);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '20px Georgia, serif';
  let y = 258;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 32;
  }
  return y;
}

export function drawGame(ctx, S, time) {
  drawFloor(ctx, S);
  const grid = S.level.grid;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const ch = grid[r][c];
      if ('CDBSPTFL'.includes(ch)) drawProp(ctx, S, ch, c * TILE, r * TILE, time);
    }
  }
  drawRelics(ctx, S, time);
  drawExit(ctx, S, time);
  drawLasers(ctx, S, time);
  // Darkness first, then cones, guards and the thief on top of it: the judge
  // must see the cones and the figures against the floor at a glance.
  drawLighting(ctx, S, time);
  drawCones(ctx, S);
  for (const cam of S.cameras) {
    ctx.fillStyle = '#3a3f52';
    ctx.fillRect(cam.x - 8, cam.y - 8, 16, 16);
    ctx.fillStyle = cam.spotting ? '#ff4030' : '#ff8a3c';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 5, 0, Math.PI * 2); ctx.fill();
  }
  drawCoinsSmoke(ctx, S);
  for (const g of S.guards) drawGuard(ctx, S, g, time);
  drawPlayer(ctx, S, time);

  if (S.mode === 'title') {
    const y = panel(ctx, 'NIGHTSHADE', [
      'The Gilded Vault III — a top-down stealth game',
      'Five vaults. Fifteen relics. One way out unseen.',
      'Patrols to learn · vision cones to dodge · cover to hide behind',
      'Coins to distract · smoke to vanish · shadows to live in',
    ], '#e8b64c');
    ctx.fillStyle = '#c9d4ff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('WASD / arrows — move      SHIFT — sneak      SPACE — run', W / 2, y + 26);
    ctx.fillText('Q — toss a coin      F — smoke bomb      E — take a relic', W / 2, y + 52);
    ctx.fillStyle = Math.sin(time * 4) > 0 ? '#ffd75e' : '#f2ead8';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Press ENTER to begin the heist', W / 2, y + 104);
    ctx.fillStyle = '#8fa0c9';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('An original game: guards, cones, cover, gadgets, lighting — no borrowed art or names.', W / 2, y + 140);
  } else if (S.mode === 'brief') {
    const y = panel(ctx, S.level.def.name, [
      S.level.def.sub,
      'Steal all 3 relics, then reach the EXIT unseen.',
      'Stay out of the cones. Crouch behind crates and desks to hide.',
      'Shadow pools slow detection — lamplight speeds it up.',
    ], '#e8b64c');
    ctx.fillStyle = Math.sin(time * 4) > 0 ? '#ffd75e' : '#f2ead8';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Press ENTER to slip inside', W / 2, y + 60);
  } else if (S.mode === 'clear') {
    const y = panel(ctx, 'VAULT CLEARED', [
      `Stealth rating: ${S.rating}`,
      `Time ${S.clearTime}  ·  Times spotted ${S.detections}  ·  Relics 3 / 3`,
      S.rating === 'GHOST' ? 'Not a single guard knew you were there.' : S.rating === 'SILENT' ? 'Seen only in passing — the vault never knew.' : 'Loud in places, but the relics are yours.',
    ], '#5aff96');
    ctx.fillStyle = Math.sin(time * 4) > 0 ? '#ffd75e' : '#f2ead8';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Press ENTER for the next vault', W / 2, y + 60);
  } else if (S.mode === 'win') {
    const y = panel(ctx, 'THE GILDED VAULT IS YOURS', [
      'All five vaults emptied. Fifteen relics. One shadow.',
      `Total time ${S.totalTime}  ·  Times spotted ${S.totalDetections}`,
      `Ratings: ${S.ratings.join('  ·  ')}`,
    ], '#ffd75e');
    ctx.fillStyle = Math.sin(time * 4) > 0 ? '#ffd75e' : '#f2ead8';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Press R to play again', W / 2, y + 60);
  } else if (S.mode === 'caught') {
    const y = panel(ctx, 'CAUGHT!', [
      'A guard closed in and the alarm brought the whole vault down.',
      'Watch the cones. Wait for the patrol to turn. Use the shadows.',
    ], '#ff5040');
    ctx.fillStyle = Math.sin(time * 4) > 0 ? '#ffd75e' : '#f2ead8';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Press R to retry this vault', W / 2, y + 60);
  } else if (S.mode === 'pause') {
    const y = panel(ctx, 'PAUSED', [
      'The vault waits. The guards do not.',
      'WASD move · SHIFT sneak · SPACE run · Q coin · F smoke · E take',
    ], '#c9d4ff');
    ctx.fillStyle = '#f2ead8';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Press Esc or P to keep sneaking', W / 2, y + 50);
  } else {
    drawHUD(ctx, S);
    drawMinimap(ctx, S);
  }
}
