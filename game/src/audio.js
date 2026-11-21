// Nightshade — synthesized sound effects, no audio files: every sound is built
// from WebAudio oscillators and filtered noise at run time.
export function makeAudio() {
  const a = {
    ctx: null,
    muted: false,
    humNodes: null,
    ensure() {
      if (!a.ctx) {
        try { a.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ }
      }
      if (a.ctx && a.ctx.state === 'suspended') a.ctx.resume();
      return a.ctx;
    },
    tone(freq, dur, type, vol, slideTo) {
      const ctx = a.ensure();
      if (!ctx || a.muted) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol, freq) {
      const ctx = a.ensure();
      if (!ctx || a.muted) return;
      const t = ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = freq || 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol || 0.1, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t);
    },
    footstep(sneaking, running) {
      a.noise(0.07, sneaking ? 0.02 : running ? 0.09 : 0.05, running ? 1400 : 700);
    },
    coin() {
      a.tone(1567, 0.12, 'triangle', 0.14);
      setTimeout(() => a.tone(2093, 0.18, 'triangle', 0.1), 70);
    },
    smoke() { a.noise(0.5, 0.16, 500); },
    pickup() {
      a.tone(880, 0.1, 'sine', 0.12);
      setTimeout(() => a.tone(1318, 0.16, 'sine', 0.12), 90);
    },
    alert() {
      a.tone(220, 0.35, 'sawtooth', 0.14, 440);
      setTimeout(() => a.tone(330, 0.3, 'sawtooth', 0.12, 660), 120);
    },
    cameraHum() {
      const ctx = a.ensure();
      if (!ctx || a.muted || a.humNodes) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 58;
      g.gain.value = 0.018;
      o.connect(g).connect(ctx.destination);
      o.start();
      a.humNodes = { o, g };
    },
    stopHum() {
      if (a.humNodes) { try { a.humNodes.o.stop(); } catch (e) {} a.humNodes = null; }
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => a.tone(f, 0.28, 'triangle', 0.13), i * 130));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => setTimeout(() => a.tone(f, 0.3, 'sawtooth', 0.08), i * 150));
    },
    unlock() {
      a.tone(660, 0.12, 'sine', 0.12);
      setTimeout(() => a.tone(990, 0.2, 'sine', 0.12), 110);
    },
    toggleMute() {
      a.muted = !a.muted;
      if (a.muted) a.stopHum();
      return a.muted;
    },
  };
  return a;
}
