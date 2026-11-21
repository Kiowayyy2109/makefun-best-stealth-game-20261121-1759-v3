// Nightshade — keyboard and mouse input: WASD/arrows to move, Shift to sneak,
// Q coin, F smoke, E interact, R restart, M mute, Esc/P pause, Enter to confirm.
export function makeInput(canvas) {
  const keys = {
    up: false, down: false, left: false, right: false,
    sneak: false, run: false,
  };
  const pressed = new Set();
  const mouse = { x: 0, y: 0, inside: false };
  const down = new Set();

  function keyOf(e) {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') return 'up';
    if (k === 's' || k === 'arrowdown') return 'down';
    if (k === 'a' || k === 'arrowleft') return 'left';
    if (k === 'd' || k === 'arrowright') return 'right';
    if (k === 'shift') return 'sneak';
    if (k === ' ') return 'run';
    return k;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyOf(e);
    if (['up', 'down', 'left', 'right', 'run'].includes(k) || e.key.startsWith('Arrow')) e.preventDefault();
    if (!e.repeat) pressed.add(k);
    if (k === 'up' || k === 'down' || k === 'left' || k === 'right') keys[k] = true;
    if (k === 'sneak') keys.sneak = true;
    if (k === 'run') keys.run = true;
    down.add(k);
  });
  window.addEventListener('keyup', (e) => {
    const k = keyOf(e);
    if (k === 'up' || k === 'down' || k === 'left' || k === 'right') keys[k] = false;
    if (k === 'sneak') keys.sneak = false;
    if (k === 'run') keys.run = false;
    down.delete(k);
  });
  window.addEventListener('blur', () => {
    keys.up = keys.down = keys.left = keys.right = keys.sneak = keys.run = false;
    down.clear();
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 1280;
    mouse.y = ((e.clientY - r.top) / r.height) * 720;
    mouse.inside = true;
  });
  canvas.addEventListener('mouseleave', () => { mouse.inside = false; });

  return {
    keys,
    mouse,
    // True once for each fresh key press; call once per frame.
    consume(k) {
      if (pressed.has(k)) { pressed.delete(k); return true; }
      return false;
    },
    clearPressed() { pressed.clear(); },
  };
}
