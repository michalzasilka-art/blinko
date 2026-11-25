// Blinko — all sounds are made live with Web Audio (no sound files).
let ctx = null, master = null, muted = false, lastPeg = 0, pegCount = 0;
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33];

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    ctx = new C();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(comp); comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export const unlock = () => ac();
export const setMuted = (m) => { muted = m; if (master) master.gain.value = m ? 0 : 0.55; };
export const isMuted = () => muted;

function tone(freq, dur, type = 'sine', vol = 0.1, { at = 0, slide = 1, attack = 0.005, pan = 0 } = {}) {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + 0.02 + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out = g;
  if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
  o.connect(g); out.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol = 0.1, { at = 0, f = 1200, q = 0.8, type = 'bandpass', slide = 1 } = {}) {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + 0.02 + at, n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = buf;
  const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (slide !== 1) fl.frequency.exponentialRampToValueAtTime(f * slide, t + dur); fl.Q.value = q;
  const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
const note = (semi, base = 523.25) => base * Math.pow(2, semi / 12);

export function sfx(name, v) {
  if (muted) return;
  const c = ac(); if (!c) return;
  switch (name) {
    case 'peg': {
      const now = c.currentTime; if (now - lastPeg < 0.025) return; lastPeg = now;
      const row = v && v.row !== undefined ? v.row : 5, kind = v && v.kind;
      const semi = PENTA[Math.min(PENTA.length - 1, 14 - row)] - 5;
      const f = note(semi, kind === 'gold' ? 659 : 523.25);
      tone(f, 0.18, 'triangle', 0.07); tone(f * 2, 0.12, 'sine', 0.03);
      if (kind === 'gold') tone(f * 3, 0.25, 'sine', 0.03, { at: 0.03 });
      pegCount++; break;
    }
    case 'bump': tone(180, 0.18, 'sine', 0.14, { slide: 2.2 }); tone(360, 0.1, 'triangle', 0.05); break;
    case 'bubble': tone(700, 0.12, 'sine', 0.08, { slide: 2.4 }); break;
    case 'spike': tone(520, 0.22, 'triangle', 0.08, { slide: 0.55 }); tone(390, 0.25, 'sine', 0.05, { at: 0.08, slide: 0.6 }); break; // a soft "ouch"
    case 'shield': [784, 1047, 1568].forEach((f, i) => tone(f, 0.25, 'triangle', 0.06, { at: i * 0.05 })); break;
    case 'gate': tone(440, 0.12, 'square', 0.025, { slide: 1.5 }); break;
    case 'gatehit': tone(300, 0.15, 'triangle', 0.08, { slide: 1.6 }); break;
    case 'boing': tone(160, 0.45, 'sine', 0.16, { slide: 3.5 }); tone(320, 0.3, 'triangle', 0.05, { slide: 2.5 }); break;
    case 'land': {
      const big = (v || 0) >= 200;
      [0, 4, 7, 12].forEach((s, i) => tone(note(s, big ? 659 : 523), 0.35, 'triangle', 0.08, { at: i * 0.06 }));
      if (big) [16, 19, 24].forEach((s, i) => tone(note(s, 659), 0.4, 'sine', 0.05, { at: 0.25 + i * 0.07 }));
      noise(0.3, 0.04, { f: 3000, q: 0.5, slide: 0.4 }); break;
    }
    case 'star': [0, 7, 12, 19].forEach((s, i) => tone(note(s, 1046), 0.3, 'sine', 0.05, { at: 0.1 + i * 0.07 })); break;
    case 'whoosh': noise(0.35, 0.06, { f: 500, slide: 4 }); break;
    case 'boom': noise(0.5, 0.18, { f: 900, type: 'lowpass', slide: 0.3, q: 0.4 }); tone(180, 0.35, 'sine', 0.16, { slide: 0.5 }); [0, 4, 7, 12].forEach((k, i) => tone(note(k, 784), 0.18, 'triangle', 0.04, { at: 0.08 + i * 0.05 })); break; // the pinecone's poof
    case 'fuse': [0, 2, 4].forEach((k, i) => tone(note(k, 988), 0.1, 'sine', 0.03, { at: i * 0.12 })); break; // the pinecone wakes up
    case 'pop': tone(500, 0.08, 'square', 0.05, { slide: 2 }); noise(0.08, 0.08, { f: 2500 }); break;
    case 'coin': tone(988, 0.08, 'square', 0.035); tone(1319, 0.25, 'square', 0.035, { at: 0.07 }); break;
    case 'laser': tone(1760, 0.12, 'sine', 0.05, { slide: 1.3 }); tone(2637, 0.15, 'sine', 0.025, { at: 0.04 }); break; // the firefly's twinkle
    case 'splash': noise(0.2, 0.07, { f: 1500, slide: 0.5 }); break;
    case 'zombie': tone(1568, 0.06, 'sine', 0.05); tone(2093, 0.08, 'sine', 0.04, { at: 0.07 }); break; // a baby ladybug's chirp
    case 'click': tone(700, 0.05, 'triangle', 0.06); break;
    case 'select': tone(880, 0.07, 'triangle', 0.06); tone(1320, 0.09, 'sine', 0.04, { at: 0.05 }); break;
    case 'flip': noise(0.12, 0.05, { f: 2000, slide: 1.8 }); tone(600, 0.1, 'triangle', 0.04, { slide: 1.5 }); break;
    case 'right': tone(660, 0.12, 'triangle', 0.1); tone(990, 0.25, 'triangle', 0.1, { at: 0.1 }); tone(1320, 0.3, 'sine', 0.05, { at: 0.18 }); break;
    case 'wrong': tone(300, 0.3, 'sine', 0.1, { slide: 0.6 }); tone(240, 0.35, 'triangle', 0.06, { at: 0.12, slide: 0.7 }); break;
    case 'start': [392, 523, 659, 784].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, { at: i * 0.09 })); break;
    case 'tick': tone(1200, 0.04, 'square', 0.03); break;
    case 'tally': tone(1500 + Math.random() * 300, 0.03, 'square', 0.015); break;
    case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i > 4 ? 0.6 : 0.25, 'triangle', 0.09, { at: i * 0.13 })); break;
    case 'drumroll': for (let i = 0; i < 18; i++) noise(0.06, 0.03 + i * 0.003, { at: i * 0.06, f: 300, q: 0.5 }); break;
  }
}
