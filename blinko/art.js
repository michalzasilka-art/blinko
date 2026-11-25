// Blinko — everything drawn on the board: the peg board, the nuts and the power-up pictures.
// Forest version (2026-11-25): the team ball is Hazel's acorn, whose painted face follows its mood (art/nut-<mood>.webp).
// The pictures are painted (art/*.webp); every one has a code-drawn stand-in. Board units are 600 × 820 (see engine.js).
import { BW, BH, SLOTS, slotX } from './data.js';
import { META } from './art/meta.js?v=3';

const TAU = Math.PI * 2;

export function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

/* ---------------------------------------------------------------- pictures of power-ups and balls */
// draws one ball / power-up of kind `k` centred at 0,0 with radius R (the picture is round, so it reads as a ball)
const shade = (c, R, a, b) => { const g = c.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.05); g.addColorStop(0, b); g.addColorStop(1, a); return g; };
function gloss(c, R) {
  const g = c.createRadialGradient(-R * 0.38, -R * 0.45, 0, -R * 0.38, -R * 0.45, R * 0.6); g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
}
function disc(c, R, a, b, line = '#2a1050') { c.fillStyle = shade(c, R, a, b); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.lineWidth = R * 0.09; c.strokeStyle = line; c.stroke(); }
function eyes(c, R, dx = 0.3, y = -0.1, s = 0.16, look = 0) {
  for (const sx of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.arc(sx * R * dx, R * y, R * s, 0, TAU); c.fill(); c.fillStyle = '#1b0c33'; c.beginPath(); c.arc(sx * R * dx + look * R * 0.05, R * y + R * 0.02, R * s * 0.55, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(sx * R * dx - R * 0.03, R * y - R * 0.04, R * s * 0.2, 0, TAU); c.fill(); }
}
function smile(c, R, y = 0.22, w = 0.32, open = false) {
  c.lineWidth = R * 0.09; c.strokeStyle = '#1b0c33'; c.lineCap = 'round';
  c.beginPath(); c.arc(0, R * (y - w * 0.6), R * w, 0.2 * Math.PI, 0.8 * Math.PI);
  if (open) { c.closePath(); c.fillStyle = '#b3123e'; c.fill(); } c.stroke();
}
/* painted pictures (ChatGPT, prepared by Foxino/Blinko/Art/build_art.py → art/*.webp + art/meta.js).
   The code drawings below stay as the fallback while a picture is loading (or if one is missing). */
const SPR = new Map();
export const artURL = (name) => `art/${name}.webp?v=3`;
const SPRITE_OF = { yin: 'pu-yinyang', yang: 'pu-yinyang', minizombie: 'pu-zombie', coin: 'coin', chick: 'chick', kernel: META.sprites.seed ? 'seed' : 'kernel' };
export const MOODS = ['happy', 'cheer', 'wheee', 'bonk', 'stars', 'ouch', 'dizzy', 'sad', 'love'];
const POWER_IDS = ['dynamite', 'yoyo', 'bouncy', 'egg', 'turtle', 'cow', 'balloon', 'puffer', 'oinky', 'shark', 'yinyang', 'popcorn', 'bowling', 'zombie', 'shield', 'boost'];
const PEG_SPR = { normal: 'peg-blue', mint: 'peg-mint', gold: 'peg-gold', vanish: 'peg-bubble', spike: 'peg-spike' };
export function artList() {
  const names = Object.keys(META.sprites).filter((n) => !['logo', 'podium', 'crown', 'btn-round'].includes(n) && !n.startsWith('squirrel-')); if (META.frame) names.push('board-frame');
  return names;
}
export function loadArt(onOne = () => {}) {
  const one = (n) => new Promise((res) => { const im = new Image(); im.onload = () => { SPR.set(n, im); onOne(); res(); }; im.onerror = () => { onOne(); res(); }; im.src = artURL(n); });
  return Promise.all(artList().map(one));
}
export const hasArt = (name) => SPR.has(name);
// draws a picture centred at 0,0 so that its longest side is `size`
function sprite(c, name, size) {
  const im = SPR.get(name); if (!im) return false;
  const k = size / Math.max(im.naturalWidth, im.naturalHeight); c.drawImage(im, -im.naturalWidth * k / 2, -im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k); return true;
}
export function drawThing(c, k, R, t = 0, extra = {}) {
  const name = SPRITE_OF[k] || (POWER_IDS.includes(k) ? 'pu-' + k : null);
  if (name && SPR.has(name)) {
    c.save();
    if (k === 'yin' || k === 'yang') c.rotate(Math.sin(t * 3 + (k === 'yang' ? 1.6 : 0)) * 0.3); // the twin cherries sway on their stems
    sprite(c, name, R * (k === 'coin' ? 2 : 2.3)); c.restore(); return;
  }
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  switch (k) {
    case 'dynamite': {
      c.save(); c.rotate(-0.2);
      for (let i = -1; i <= 1; i++) { c.fillStyle = shade(c, R, '#c8202e', '#ff6b5a'); rr(c, i * R * 0.56 - R * 0.28, -R * 0.82 + Math.abs(i) * R * 0.12, R * 0.56, R * 1.64 - Math.abs(i) * R * 0.24, R * 0.2); c.fill(); c.lineWidth = R * 0.08; c.strokeStyle = '#4a0d24'; c.stroke(); }
      c.fillStyle = '#ffd166'; c.fillRect(-R * 0.86, -R * 0.12, R * 1.72, R * 0.24); c.strokeRect(-R * 0.86, -R * 0.12, R * 1.72, R * 0.24);
      c.strokeStyle = '#6b4423'; c.lineWidth = R * 0.1; c.beginPath(); c.moveTo(0, -R * 0.82); c.quadraticCurveTo(R * 0.3, -R * 1.1, R * 0.15, -R * 1.25); c.stroke();
      const sp = 0.6 + Math.sin(t * 30) * 0.4; c.fillStyle = '#fff5a0'; star(c, R * 0.15, -R * 1.28, R * 0.28 * sp, R * 0.1, 6); c.fill();
      c.restore(); break;
    }
    case 'spent': disc(c, R, '#2a2a33', '#6a6a78'); c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(R * 0.2, -R * 1.4 - (t * 30 % 12), R * 0.4, 0, TAU); c.fill(); break;
    case 'yoyo': {
      disc(c, R, '#e2346a', '#ff9bbd'); c.fillStyle = '#ffd6e4'; c.beginPath(); c.arc(0, 0, R * 0.55, 0, TAU); c.fill(); c.strokeStyle = '#a3164a'; c.lineWidth = R * 0.08; c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, R * 0.16, 0, TAU); c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = R * 0.07; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -R * 1.35); c.stroke(); c.beginPath(); c.arc(0, -R * 1.45, R * 0.12, 0, TAU); c.stroke(); gloss(c, R); break;
    }
    case 'bouncy': disc(c, R, '#12a87e', '#8affd9', '#0b4d3c'); c.lineWidth = R * 0.09; c.strokeStyle = '#0b3b2e';
      c.beginPath(); c.arc(-R * 0.3, -R * 0.1, R * 0.13, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.beginPath(); c.arc(R * 0.3, -R * 0.1, R * 0.13, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      c.beginPath(); c.arc(0, R * 0.08, R * 0.42, 0.1 * Math.PI, 0.9 * Math.PI); c.closePath(); c.fillStyle = '#b3123e'; c.fill(); c.stroke(); gloss(c, R); break;
    case 'egg': c.fillStyle = shade(c, R, '#f0d79a', '#fffaf0'); c.beginPath(); c.ellipse(0, R * 0.05, R * 0.85, R, 0, 0, TAU); c.fill(); c.lineWidth = R * 0.08; c.strokeStyle = '#6b4a1e'; c.stroke();
      c.fillStyle = 'rgba(160,110,50,.35)'; [[-0.3, -0.3, 0.1], [0.35, 0.1, 0.08], [-0.1, 0.45, 0.07], [0.2, -0.5, 0.06]].forEach(([x, y, s]) => { c.beginPath(); c.arc(x * R, y * R, s * R, 0, TAU); c.fill(); });
      c.strokeStyle = '#6b4a1e'; c.lineWidth = R * 0.06; c.beginPath(); c.moveTo(-R * 0.6, -R * 0.05); c.lineTo(-R * 0.3, R * 0.1); c.lineTo(-R * 0.1, -R * 0.08); c.lineTo(R * 0.15, R * 0.12); c.stroke(); gloss(c, R * 0.9); break;
    case 'chick': disc(c, R, '#ffb800', '#fff27a', '#6b4a00'); eyes(c, R, 0.28, -0.12, 0.13); c.fillStyle = '#ff8a1e'; c.beginPath(); c.moveTo(-R * 0.18, R * 0.1); c.lineTo(R * 0.18, R * 0.1); c.lineTo(0, R * 0.36); c.closePath(); c.fill();
      c.fillStyle = '#ffcf2e'; c.beginPath(); c.ellipse(0, -R * 0.95, R * 0.15, R * 0.28, 0.4, 0, TAU); c.fill(); break;
    case 'shell': c.rotate(extra.flip ? 0.6 : -0.6); c.fillStyle = '#fff4dc'; c.beginPath(); c.arc(0, 0, R, 0, Math.PI); c.lineTo(-R, 0); c.lineTo(-R * 0.5, -R * 0.4); c.lineTo(0, 0); c.lineTo(R * 0.5, -R * 0.4); c.lineTo(R, 0); c.fill(); c.lineWidth = R * 0.14; c.strokeStyle = '#6b4a1e'; c.stroke(); break;
    case 'turtle': {
      c.fillStyle = '#7dd36b'; [[-0.75, -0.7], [0.75, -0.7], [-0.75, 0.7], [0.75, 0.7]].forEach(([x, y]) => { c.beginPath(); c.arc(x * R, y * R, R * 0.28, 0, TAU); c.fill(); });
      c.beginPath(); c.arc(0, -R * 1.02, R * 0.32, 0, TAU); c.fill(); c.fillStyle = '#1b0c33'; c.beginPath(); c.arc(-R * 0.12, -R * 1.08, R * 0.06, 0, TAU); c.arc(R * 0.12, -R * 1.08, R * 0.06, 0, TAU); c.fill();
      disc(c, R * 0.88, '#1f7a3a', '#5fd47c', '#0e3d1c'); c.strokeStyle = 'rgba(14,61,28,.75)'; c.lineWidth = R * 0.07;
      hex(c, 0, 0, R * 0.33); c.stroke(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.33, Math.sin(a) * R * 0.33); c.lineTo(Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85); c.stroke(); }
      gloss(c, R * 0.88); break;
    }
    case 'cow': disc(c, R, '#d9dde8', '#ffffff', '#2a2440'); c.fillStyle = '#2a2440';
      [[-0.45, -0.45, 0.25], [0.5, -0.2, 0.2], [0.1, 0.55, 0.2], [-0.6, 0.3, 0.14]].forEach(([x, y, s]) => { c.beginPath(); c.ellipse(x * R, y * R, s * R * 1.2, s * R, x, 0, TAU); c.fill(); });
      c.fillStyle = '#ffb3c7'; c.beginPath(); c.ellipse(0, R * 0.3, R * 0.42, R * 0.28, 0, 0, TAU); c.fill(); c.fillStyle = '#c4506f'; c.beginPath(); c.arc(-R * 0.14, R * 0.3, R * 0.06, 0, TAU); c.arc(R * 0.14, R * 0.3, R * 0.06, 0, TAU); c.fill();
      eyes(c, R, 0.28, -0.22, 0.12); c.fillStyle = '#fff2c8'; c.beginPath(); c.moveTo(-R * 0.6, -R * 0.75); c.lineTo(-R * 0.85, -R * 1.15); c.lineTo(-R * 0.4, -R * 0.88); c.moveTo(R * 0.6, -R * 0.75); c.lineTo(R * 0.85, -R * 1.15); c.lineTo(R * 0.4, -R * 0.88); c.fill(); gloss(c, R); break;
    case 'milk': c.fillStyle = '#fffdf6'; c.beginPath(); c.moveTo(0, -R * 1.4); c.quadraticCurveTo(R, 0, 0, R); c.quadraticCurveTo(-R, 0, 0, -R * 1.4); c.fill(); c.lineWidth = R * 0.22; c.strokeStyle = '#b08a5a'; c.stroke(); break;
    case 'balloon': {
      c.strokeStyle = '#fff'; c.lineWidth = R * 0.06; c.beginPath(); c.moveTo(0, R); c.quadraticCurveTo(R * 0.3, R * 1.4, 0, R * 1.8); c.stroke();
      const g = c.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#ff9de6'); g.addColorStop(1, '#8fd8ff'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, R * 0.92, R, 0, 0, TAU); c.fill(); c.lineWidth = R * 0.08; c.strokeStyle = '#5a2a80'; c.stroke();
      c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(-R * 0.15, -R * 0.85); c.lineTo(R * 0.1, -R * 1.45); c.lineTo(R * 0.2, -R * 0.82); c.fill(); c.stroke();
      eyes(c, R, 0.28, -0.05, 0.13); smile(c, R, 0.28, 0.2); gloss(c, R); break;
    }
    case 'puffer': {
      c.fillStyle = '#e09a1a'; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.save(); c.rotate(a); c.beginPath(); c.moveTo(R * 0.85, -R * 0.12); c.lineTo(R * 1.28, 0); c.lineTo(R * 0.85, R * 0.12); c.fill(); c.restore(); }
      disc(c, R, '#f0a51e', '#ffeaa0', '#6b4400'); eyes(c, R, 0.33, -0.2, 0.17); c.fillStyle = '#ff8a5c'; c.beginPath(); c.ellipse(0, R * 0.35, R * 0.16, R * 0.12, 0, 0, TAU); c.fill(); gloss(c, R); break;
    }
    case 'oinky': c.fillStyle = '#ff8fab'; c.beginPath(); c.moveTo(-R * 0.75, -R * 0.55); c.lineTo(-R * 0.55, -R * 1.1); c.lineTo(-R * 0.25, -R * 0.8); c.moveTo(R * 0.75, -R * 0.55); c.lineTo(R * 0.55, -R * 1.1); c.lineTo(R * 0.25, -R * 0.8); c.fill();
      disc(c, R, '#ff7f9f', '#ffd6e2', '#7a1f3d'); c.fillStyle = '#7a1f3d'; rr(c, -R * 0.28, -R * 0.82, R * 0.56, R * 0.12, R * 0.06); c.fill();
      eyes(c, R, 0.3, -0.25, 0.11); c.fillStyle = '#ff5c86'; c.beginPath(); c.ellipse(0, R * 0.22, R * 0.36, R * 0.26, 0, 0, TAU); c.fill(); c.fillStyle = '#7a1f3d'; c.beginPath(); c.ellipse(-R * 0.12, R * 0.22, R * 0.06, R * 0.1, 0, 0, TAU); c.ellipse(R * 0.12, R * 0.22, R * 0.06, R * 0.1, 0, 0, TAU); c.fill(); gloss(c, R); break;
    case 'shark': c.fillStyle = '#2f5fd6'; c.beginPath(); c.moveTo(-R * 0.3, -R * 0.8); c.lineTo(R * 0.15, -R * 1.45); c.lineTo(R * 0.4, -R * 0.75); c.fill();
      disc(c, R, '#2f5fd6', '#9cc0ff', '#0e2766'); c.fillStyle = '#e8f0ff'; c.beginPath(); c.ellipse(0, R * 0.42, R * 0.7, R * 0.42, 0, 0, Math.PI); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); for (let i = -3; i <= 3; i++) { c.moveTo(i * R * 0.17 - R * 0.08, R * 0.28); c.lineTo(i * R * 0.17, R * 0.46); c.lineTo(i * R * 0.17 + R * 0.08, R * 0.28); } c.fill();
      c.strokeStyle = '#0e2766'; c.lineWidth = R * 0.07; c.beginPath(); c.moveTo(-R * 0.65, R * 0.28); c.lineTo(R * 0.65, R * 0.28); c.stroke();
      c.fillStyle = '#ff3b6b'; rr(c, -R * 0.62, -R * 0.38, R * 1.24, R * 0.3, R * 0.15); c.fill(); c.fillStyle = '#ffd0dc'; c.beginPath(); c.arc(-R * 0.3, -R * 0.23, R * 0.07, 0, TAU); c.arc(R * 0.3, -R * 0.23, R * 0.07, 0, TAU); c.fill(); gloss(c, R); break;
    case 'yin': case 'yang': case 'yinyang': {
      const dark = '#2b2140', light = '#f1ecff', A = k === 'yang' ? light : dark, B = k === 'yang' ? dark : light;
      c.rotate(t * 2); c.fillStyle = A; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
      c.fillStyle = B; c.beginPath(); c.arc(0, 0, R, -Math.PI / 2, Math.PI / 2); c.arc(0, R / 2, R / 2, Math.PI / 2, -Math.PI / 2, true); c.arc(0, -R / 2, R / 2, Math.PI / 2, -Math.PI / 2); c.fill();
      c.fillStyle = A; c.beginPath(); c.arc(0, -R / 2, R * 0.15, 0, TAU); c.fill(); c.fillStyle = B; c.beginPath(); c.arc(0, R / 2, R * 0.15, 0, TAU); c.fill();
      c.lineWidth = R * 0.09; c.strokeStyle = '#7b5cff'; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke(); c.rotate(-t * 2); gloss(c, R); break;
    }
    case 'popcorn': {
      c.save(); c.beginPath(); c.moveTo(-R * 0.75, -R * 0.15); c.lineTo(R * 0.75, -R * 0.15); c.lineTo(R * 0.55, R); c.lineTo(-R * 0.55, R); c.closePath(); c.clip();
      for (let i = -4; i <= 4; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#ff4a4a'; c.fillRect(i * R * 0.2 - R * 0.1, -R, R * 0.2, R * 2.2); } c.restore();
      c.strokeStyle = '#7a1020'; c.lineWidth = R * 0.08; c.beginPath(); c.moveTo(-R * 0.75, -R * 0.15); c.lineTo(R * 0.75, -R * 0.15); c.lineTo(R * 0.55, R); c.lineTo(-R * 0.55, R); c.closePath(); c.stroke();
      [[-0.5, -0.35], [-0.15, -0.55], [0.25, -0.45], [0.55, -0.3], [0.05, -0.85], [-0.4, -0.75], [0.4, -0.78]].forEach(([x, y]) => kernel(c, x * R, y * R, R * 0.26)); break;
    }
    case 'kernel': kernel(c, 0, 0, R); break;
    case 'bowling': disc(c, R, '#251050', '#7b5ce0', '#120630'); c.fillStyle = '#0a0320'; [[-0.2, -0.35], [0.15, -0.42], [-0.02, -0.08]].forEach(([x, y]) => { c.beginPath(); c.arc(x * R, y * R, R * 0.13, 0, TAU); c.fill(); });
      c.strokeStyle = 'rgba(190,160,255,.5)'; c.lineWidth = R * 0.06; c.beginPath(); c.arc(R * 0.2, R * 0.2, R * 0.5, 0.2, 2.2); c.stroke(); gloss(c, R); break;
    case 'zombie': case 'minizombie': disc(c, R, '#5d9a2a', '#c4f08a', '#1f3a0a');
      c.strokeStyle = '#1f3a0a'; c.lineWidth = R * 0.07; c.beginPath(); c.moveTo(-R * 0.55, -R * 0.55); c.lineTo(-R * 0.1, -R * 0.75); for (let i = 0; i < 3; i++) { const x = -R * 0.45 + i * R * 0.15; c.moveTo(x, -R * 0.72 + i * R * 0.03); c.lineTo(x + R * 0.04, -R * 0.55 + i * R * 0.03); } c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(-R * 0.3, -R * 0.08, R * 0.18, 0, TAU); c.fill(); c.fillStyle = '#1b0c33'; c.beginPath(); c.arc(-R * 0.3, -R * 0.05, R * 0.08, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(R * 0.15, -R * 0.2); c.lineTo(R * 0.45, R * 0.05); c.moveTo(R * 0.45, -R * 0.2); c.lineTo(R * 0.15, R * 0.05); c.stroke();
      c.beginPath(); c.moveTo(-R * 0.35, R * 0.38); c.quadraticCurveTo(0, R * 0.55, R * 0.4, R * 0.3); c.stroke(); c.fillStyle = '#fff'; c.fillRect(-R * 0.05, R * 0.42, R * 0.12, R * 0.12); gloss(c, R); break;
    case 'shield': {
      c.beginPath(); c.moveTo(0, -R); c.lineTo(R * 0.9, -R * 0.62); c.lineTo(R * 0.82, R * 0.1); c.quadraticCurveTo(R * 0.6, R * 0.75, 0, R); c.quadraticCurveTo(-R * 0.6, R * 0.75, -R * 0.82, R * 0.1); c.lineTo(-R * 0.9, -R * 0.62); c.closePath();
      const g = c.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#8a5bff'); g.addColorStop(1, '#4b22b8'); c.fillStyle = g; c.fill(); c.lineWidth = R * 0.12; c.strokeStyle = '#ff973b'; c.stroke();
      c.fillStyle = '#ff973b'; c.beginPath(); c.moveTo(-R * 0.42, -R * 0.42); c.lineTo(-R * 0.2, -R * 0.1); c.lineTo(R * 0.2, -R * 0.1); c.lineTo(R * 0.42, -R * 0.42); c.lineTo(R * 0.36, R * 0.15); c.lineTo(0, R * 0.48); c.lineTo(-R * 0.36, R * 0.15); c.closePath(); c.fill();
      c.fillStyle = '#fff3e3'; c.beginPath(); c.moveTo(-R * 0.24, R * 0.12); c.lineTo(0, R * 0.42); c.lineTo(R * 0.24, R * 0.12); c.lineTo(0, R * 0.2); c.closePath(); c.fill(); c.fillStyle = '#1b0c33'; c.beginPath(); c.arc(-R * 0.14, R * 0.0, R * 0.06, 0, TAU); c.arc(R * 0.14, R * 0.0, R * 0.06, 0, TAU); c.fill(); break;
    }
    case 'boost': {
      const g2 = c.createRadialGradient(0, -R * 0.2, 0, 0, -R * 0.2, R * 1.4); g2.addColorStop(0, 'rgba(255,230,120,.7)'); g2.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g2; c.beginPath(); c.arc(0, -R * 0.2, R * 1.4, 0, TAU); c.fill();
      c.fillStyle = shade(c, R, '#ffb81e', '#fff3a8'); c.beginPath(); c.arc(0, -R * 0.2, R * 0.78, Math.PI * 0.8, Math.PI * 2.2); c.lineTo(R * 0.32, R * 0.55); c.lineTo(-R * 0.32, R * 0.55); c.closePath(); c.fill(); c.lineWidth = R * 0.08; c.strokeStyle = '#7a4a00'; c.stroke();
      c.fillStyle = '#8b7aa8'; rr(c, -R * 0.34, R * 0.55, R * 0.68, R * 0.38, R * 0.1); c.fill(); c.strokeStyle = '#4a3a66'; c.beginPath(); c.moveTo(-R * 0.34, R * 0.7); c.lineTo(R * 0.34, R * 0.7); c.stroke();
      c.strokeStyle = '#ff7a1e'; c.lineWidth = R * 0.08; c.beginPath(); c.moveTo(-R * 0.22, R * 0.4); c.lineTo(-R * 0.1, -R * 0.15); c.lineTo(R * 0.1, R * 0.05); c.lineTo(R * 0.22, -R * 0.4); c.stroke(); break;
    }
    case 'coin': c.fillStyle = shade(c, R, '#e8a400', '#fff0a0'); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.lineWidth = R * 0.15; c.strokeStyle = '#8a5a00'; c.stroke(); c.fillStyle = '#8a5a00'; c.font = `900 ${R * 1.2}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('5', 0, R * 0.05); break;
    default: disc(c, R, '#4f8bff', '#cfe0ff'); gloss(c, R);
  }
  c.restore();
}
function kernel(c, x, y, s) { c.fillStyle = '#fff6d8'; [[0, 0, 1], [-0.6, 0.2, 0.7], [0.6, 0.15, 0.75], [0, -0.55, 0.7]].forEach(([a, b, k]) => { c.beginPath(); c.arc(x + a * s, y + b * s, s * k * 0.75, 0, TAU); c.fill(); }); c.strokeStyle = 'rgba(160,110,40,.6)'; c.lineWidth = s * 0.12; c.beginPath(); c.arc(x, y, s * 0.75, 0, TAU); c.stroke(); c.fillStyle = '#ffcf4a'; c.beginPath(); c.arc(x + s * 0.15, y + s * 0.3, s * 0.25, 0, TAU); c.fill(); }
function hex(c, x, y, r) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
// a gold star (the painted one when it is there)
export function goldStar(c, x, y, R) {
  if (SPR.has('star')) { c.save(); c.translate(x, y); sprite(c, 'star', R * 2.5); c.restore(); return; }
  c.fillStyle = '#ffe14d'; star(c, x, y, R, R * 0.45); c.fill(); c.lineWidth = Math.max(1.2, R * 0.16); c.strokeStyle = '#7a4a00'; c.stroke();
}
export function star(c, x, y, R, r, n = 5) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU - Math.PI / 2, d = i % 2 ? r : R; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * d, y + Math.sin(a) * d); } c.closePath(); }

// a power-up picture as an image URL (for the cards and buttons)
const iconCache = new Map();
export function powerIcon(id, size = 160) {
  if (SPR.has('pu-' + id)) return artURL('pu-' + id);
  const key = id + size; if (iconCache.has(key)) return iconCache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d');
  c.translate(size / 2, size / 2 + (['dynamite', 'yoyo', 'balloon', 'shark'].includes(id) ? size * 0.08 : 0));
  drawThing(c, id === 'yinyang' ? 'yin' : id, size * 0.36, 0.3);
  const url = cv.toDataURL(); iconCache.set(key, url); return url;
}
export function pegIcon(kind, size = 64) {
  if (SPR.has(PEG_SPR[kind])) return artURL(PEG_SPR[kind]);
  const key = 'peg' + kind + size; if (iconCache.has(key)) return iconCache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d');
  c.translate(size / 2, size / 2); drawPeg(c, { kind, r: kind === 'spike' ? 9 : 8, flash: 0, icon: true }, size / 32, 0);
  const url = cv.toDataURL(); iconCache.set(key, url); return url;
}

/* ---------------------------------------------------------------- pegs */
const PEGCOL = { normal: ['#3d4fc4', '#aab8ff', '#5b6cff'], mint: ['#2e9a44', '#b6f0b0', '#3fbf5a'], gold: ['#d99a00', '#fff3b0', '#ffc21e'], vanish: ['#3fb0e0', '#e0f6ff', '#4fc3e8'], spike: ['#8a3fc4', '#e6c2ff', '#b04fe0'] };
export function drawPeg(c, p, k, time) {
  const [a, b, glow] = PEGCOL[p.kind], R = p.r * k * (p.icon ? 1 : 1.18), f = p.flash || 0;
  c.save();
  if (f > 0.02 || p.kind === 'gold') {
    const gr = R * (2.2 + f * 2.2), g = c.createRadialGradient(0, 0, R * 0.5, 0, 0, gr);
    g.addColorStop(0, glow + (f > 0.02 ? 'cc' : '55')); g.addColorStop(1, glow + '00'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, gr, 0, TAU); c.fill();
  }
  if (SPR.has(PEG_SPR[p.kind])) {
    if (p.kind === 'spike') c.rotate(Math.sin(time * 2 + (p.x || 0)) * 0.25);
    const pop = 1 + f * 0.25;
    sprite(c, PEG_SPR[p.kind], R * (p.kind === 'spike' ? 3.1 : p.kind === 'vanish' ? 2.5 : 2.3) * pop);
  } else if (p.kind === 'spike') {
    c.rotate(time * 1.2); star(c, 0, 0, R * 1.35, R * 0.62, 8); c.fillStyle = shade(c, R, a, b); c.fill(); c.lineWidth = k * 1.4; c.strokeStyle = '#5a0716'; c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, R * 0.25, 0, TAU); c.fill();
  } else if (p.kind === 'vanish') {
    c.fillStyle = 'rgba(255,120,210,.28)'; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.lineWidth = k * 1.6; c.strokeStyle = b; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(-R * 0.35, -R * 0.38, R * 0.26, R * 0.16, -0.6, 0, TAU); c.fill();
  } else {
    c.fillStyle = shade(c, R, a, b); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    c.lineWidth = k * 1.1; c.strokeStyle = 'rgba(10,4,40,.55)'; c.stroke();
    if (p.kind === 'gold') { c.fillStyle = '#fffbe0'; star(c, 0, 0, R * 0.62, R * 0.26, 4); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(-R * 0.32, -R * 0.36, R * 0.24, 0, TAU); c.fill();
  }
  if (f > 0.02) { c.globalAlpha = f; c.strokeStyle = '#fff'; c.lineWidth = k * 2; c.beginPath(); c.arc(0, 0, R * (1.2 + (1 - f) * 1.6), 0, TAU); c.stroke(); }
  c.restore();
}

/* ---------------------------------------------------------------- the board */
// pocket colours from the lowest to the highest value
const POCKET_COL = ['#7d6bd6', '#4f9fe0', '#3fb59a', '#6cbf4a', '#d9b02a', '#f08a2e', '#ec5a6e', '#c955c9', '#ffc21e'];
export const VALUE_RANK = (pockets) => { const s = [...pockets.map((p) => p.value)].sort((a, b) => a - b); return pockets.map((p) => s.indexOf(p.value)); };

export class BoardView {
  constructor(canvas) { this.cv = canvas; this.c = canvas.getContext('2d'); this.portraits = new Map(); this.time = 0; this.hover = -1; this.marq = 0; this.pocketGlow = []; }
  setSize(w, h, ratio) {
    const dpr = Math.min(3, ratio || window.devicePixelRatio || 1);
    this.W = w; this.H = h; this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr); this.dpr = dpr;
    this.F = META.frame ? 42 : 30; this.k = (h - this.F * 2) / BH; this.ox = (w - BW * this.k) / 2; this.oy = this.F;
  }
  portrait(url) {
    if (!url) return null;
    if (!this.portraits.has(url)) { const im = new Image(); im.src = url; this.portraits.set(url, im); }
    const im = this.portraits.get(url); return im.complete && im.naturalWidth ? im : null;
  }
  // which release slot is under a point on the canvas (CSS px), or -1
  slotAt(px, py) {
    const bx = (px - this.ox) / this.k, by = (py - this.oy) / this.k;
    if (bx < -10 || bx > BW + 10 || by > BH * 0.62) return -1;
    let best = 0, bd = 1e9; for (let i = 0; i < SLOTS; i++) { const d = Math.abs(slotX(i) - bx); if (d < bd) { bd = d; best = i; } }
    return best;
  }
  render(dt, s) {
    // s: { board, drop, phase, slot, team, power, reduced }
    this.time += dt; this.marq += dt * (s.drop && s.drop.started && !s.drop.done ? 9 : 2.2);
    const c = this.c, k = this.k, T = this.time;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, this.W, this.H);
    const shake = s.drop && !s.reduced ? s.drop.shake : 0;
    if (shake > 0) c.translate((Math.random() - 0.5) * shake * 10, (Math.random() - 0.5) * shake * 10);
    const painted = META.frame && SPR.get('board-frame');
    if (painted) { c.save(); c.shadowColor = 'rgba(40,20,0,.45)'; c.shadowBlur = 30; c.shadowOffsetY = 12; c.fillStyle = '#7a4a22'; rr(c, this.ox - 8, this.oy - 8, BW * k + 16, BH * k + 16, 30); c.fill(); c.restore(); }
    else this.frame(c);
    c.save(); c.translate(this.ox, this.oy); c.scale(k, k);
    // inner board
    rr(c, 0, 0, BW, BH, 22); c.save(); c.clip();
    if (SPR.has('board-inside')) { const im = SPR.get('board-inside'); c.drawImage(im, 0, 0, BW, BH); }
    else {
      const g = c.createLinearGradient(0, 0, 0, BH); g.addColorStop(0, '#fff6e2'); g.addColorStop(0.6, '#f7e3bd'); g.addColorStop(1, '#eccf9a'); c.fillStyle = g; c.fillRect(0, 0, BW, BH);
      c.strokeStyle = 'rgba(160,100,40,.07)'; c.lineWidth = 3; for (let x = 18; x < BW; x += 46) { c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 14, BH * 0.3, x - 12, BH * 0.6, x + 6, BH); c.stroke(); }
    }
    // soft sunlight from the top, a little shade at the sides
    const sp = c.createRadialGradient(BW / 2, 120, 10, BW / 2, 120, 460); sp.addColorStop(0, 'rgba(255,240,190,.45)'); sp.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = sp; c.fillRect(0, 0, BW, BH);
    const sh = c.createLinearGradient(0, 0, BW, 0); sh.addColorStop(0, 'rgba(120,70,20,.16)'); sh.addColorStop(0.12, 'rgba(120,70,20,0)'); sh.addColorStop(0.88, 'rgba(120,70,20,0)'); sh.addColorStop(1, 'rgba(120,70,20,.16)'); c.fillStyle = sh; c.fillRect(0, 0, BW, BH);
    const board = s.board, d = s.drop;
    if (board) {
      this.slots(c, s);
      this.pockets(c, board, d, s);
      if (d) this.sides(c, d);
      if (d && d.bumper) this.bumper(c, d.bumper);
      for (const p of board.pegs) { if (!p.alive) continue; c.save(); c.translate(p.x, p.y); drawPeg(c, p, 1, T); c.restore(); }
      if (d) this.fx(c, d, s);
      if (s.phase === 'aim' && s.slot >= 0) this.ghost(c, s);
    }
    c.restore(); // clip
    // inner rim
    if (!painted) { rr(c, 0, 0, BW, BH, 22); c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.18)'; c.stroke(); }
    c.restore();
    if (painted) this.framePainted(c, painted);
  }
  // the painted frame, laid around the board in 8 pieces (corners keep their shape, the straight parts stretch), with the chasing bulbs on top
  framePainted(c, im) {
    const f = META.frame, [hx, hy, hw, hh] = f.hole, L = hx, T = hy, R = f.w - hx - hw, B = f.h - hy - hh, cs = f.corner;
    const t = this.F - 6, s = t / ((L + R + T + B) / 4), bw = BW * this.k, bh = BH * this.k;
    const x0 = this.ox - L * s, y0 = this.oy - T * s, x1 = this.ox + bw + R * s, y1 = this.oy + bh + B * s;
    const sxs = [0, L + cs, f.w - R - cs, f.w], sys = [0, T + cs, f.h - B - cs, f.h];
    const dxs = [x0, x0 + (L + cs) * s, x1 - (R + cs) * s, x1], dys = [y0, y0 + (T + cs) * s, y1 - (B + cs) * s, y1];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      if (i === 1 && j === 1) continue;
      c.drawImage(im, sxs[i], sys[j], sxs[i + 1] - sxs[i], sys[j + 1] - sys[j], dxs[i] - 0.5, dys[j] - 0.5, dxs[i + 1] - dxs[i] + 1, dys[j + 1] - dys[j] + 1);
    }
    if (f.bulbs === false) return; // the wooden frame has no light bulbs
    // bulbs along the middle of the frame
    const bx = x0 + L * s / 2, by = y0 + T * s / 2, w = x1 - R * s / 2 - bx, h = y1 - B * s / 2 - by;
    const rad = Math.max(8, (f.outer || cs + t) * s - t / 2), per = 2 * (w + h - 4 * rad) + TAU * rad, n = Math.round(per / 34);
    for (let i = 0; i < n; i++) {
      const [px, py] = rperim(bx, by, w, h, rad, (i / n) * per);
      const on = ((i + Math.floor(this.marq)) % 3) === 0;
      if (on) { const gg = c.createRadialGradient(px, py, 0, px, py, 15); gg.addColorStop(0, 'rgba(255,236,150,.95)'); gg.addColorStop(1, 'rgba(255,236,150,0)'); c.fillStyle = gg; c.beginPath(); c.arc(px, py, 15, 0, TAU); c.fill(); }
      c.fillStyle = on ? '#fffbe6' : '#f0b24a'; c.beginPath(); c.arc(px, py, 5.2, 0, TAU); c.fill();
      c.lineWidth = 1.4; c.strokeStyle = 'rgba(90,30,10,.65)'; c.stroke();
      if (!on) { c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(px - 1.5, py - 1.7, 1.5, 0, TAU); c.fill(); }
    }
  }
  frame(c) {
    const x = this.ox - 22, y = 8, w = BW * this.k + 44, h = this.H - 16;
    c.save();
    c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ff5a7a'); g.addColorStop(1, '#a3164a');
    rr(c, x, y, w, h, 40); c.fillStyle = g; c.fill(); c.shadowColor = 'transparent';
    c.lineWidth = 6; c.strokeStyle = '#ffd166'; c.stroke();
    rr(c, x + 9, y + 9, w - 18, h - 18, 32); c.lineWidth = 3; c.strokeStyle = 'rgba(255,240,200,.55)'; c.stroke();
    // marquee bulbs, chasing
    const per = 2 * (w + h) - 160, n = Math.round(per / 30);
    for (let i = 0; i < n; i++) {
      const [bx, by] = perim(x + 15, y + 15, w - 30, h - 30, (i / n) * per * (2 * (w - 30 + h - 30)) / per);
      const on = ((i + Math.floor(this.marq)) % 3) === 0;
      c.fillStyle = on ? '#fff6c8' : '#c46a1e';
      if (on) { const gg = c.createRadialGradient(bx, by, 0, bx, by, 11); gg.addColorStop(0, 'rgba(255,230,140,.9)'); gg.addColorStop(1, 'rgba(255,230,140,0)'); c.fillStyle = gg; c.beginPath(); c.arc(bx, by, 11, 0, TAU); c.fill(); c.fillStyle = '#fffbe6'; }
      c.beginPath(); c.arc(bx, by, 4.2, 0, TAU); c.fill();
    }
    c.restore();
  }
  slots(c, s) {
    const aim = s.phase === 'aim' || s.phase === 'practice';
    for (let i = 0; i < SLOTS; i++) {
      const x = slotX(i), sel = s.slot === i && aim;
      c.save(); c.translate(x, 30);
      c.globalAlpha = aim ? 1 : 0.45;
      c.fillStyle = sel ? '#ffb43a' : '#9a6232'; c.beginPath(); c.arc(0, 0, 19, 0, TAU); c.fill();
      c.lineWidth = 3; c.strokeStyle = sel ? '#fff7e0' : '#6b3f1c'; c.stroke();
      c.fillStyle = sel ? '#4a2508' : '#fff3dc'; c.font = '20px "Lilita One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), 0, 1.5);
      c.restore();
    }
    if (aim && s.slot < 0) { // invite: bobbing arrows
      const b = Math.sin(this.time * 5) * 4; c.fillStyle = 'rgba(230,120,30,.85)';
      for (let i = 0; i < SLOTS; i++) { const x = slotX(i); c.beginPath(); c.moveTo(x - 7, 56 + b); c.lineTo(x + 7, 56 + b); c.lineTo(x, 65 + b); c.fill(); }
    }
  }
  ghost(c, s) {
    const x = slotX(s.slot), bob = Math.sin(this.time * 4) * 3;
    c.save(); c.setLineDash([4, 10]); c.lineWidth = 3; c.strokeStyle = 'rgba(200,110,30,.6)'; c.beginPath(); c.moveTo(x, 58); c.lineTo(x, 104); c.stroke(); c.restore();
    if (s.power === 'yinyang') { const x2 = slotX(9 - s.slot); c.save(); c.globalAlpha = 0.55; c.translate(x2, 30 + bob); drawThing(c, 'yang', 13, this.time); c.restore(); }
    c.save(); c.translate(x, 30 + bob); this.ball(c, { kind: ballKind(s.power), r: s.power === 'bowling' ? 15 : 13, rot: 0, impact: 0 }, s.team); c.restore();
  }
  pockets(c, board, d, s) {
    const n = board.pockets.length, w = BW / n, rank = VALUE_RANK(board.pockets);
    for (let i = 0; i < n; i++) {
      const p = board.pockets[i], x = i * w, col = POCKET_COL[Math.round(rank[i] * (POCKET_COL.length - 1) / Math.max(1, n - 1))];
      const fx = d ? d.effects.filter((e) => e.kind === 'pocket' && e.p === i).reduce((m, e) => Math.max(m, 1 - e.t / 0.7), 0) : 0;
      c.save();
      const g = c.createLinearGradient(0, 736, 0, BH); g.addColorStop(0, shadeHex(col, -0.45)); g.addColorStop(0.5, col); g.addColorStop(1, shadeHex(col, 0.12));
      c.fillStyle = g; c.fillRect(x, 736, w, BH - 736);
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 2.2 + i * 0.9);
      const gl = c.createRadialGradient(x + w / 2, BH + 10, 2, x + w / 2, BH + 10, w * 0.8); gl.addColorStop(0, `rgba(255,255,255,${0.3 + pulse * 0.18})`); gl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gl; c.fillRect(x, 736, w, BH - 736);
      // the basket weave
      c.save(); c.beginPath(); c.rect(x, 736, w, BH - 736); c.clip(); c.strokeStyle = 'rgba(70,35,5,.16)'; c.lineWidth = 2;
      for (let yy = 750; yy < BH; yy += 14) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
      for (let xx = x + 7, j = 0; xx < x + w; xx += 14, j++) for (let yy = 736 + (j % 2) * 7; yy < BH; yy += 14) { c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + 7); c.stroke(); }
      c.restore();
      c.fillStyle = 'rgba(70,35,5,.3)'; c.fillRect(x, 736, w, 9);
      if (fx > 0) { c.fillStyle = `rgba(255,255,255,${fx * 0.6})`; c.fillRect(x, 736, w, BH - 736); const lg = c.createLinearGradient(0, 400, 0, 736); lg.addColorStop(0, 'rgba(255,230,140,0)'); lg.addColorStop(1, `rgba(255,230,140,${fx * 0.5})`); c.fillStyle = lg; c.fillRect(x, 400, w, 336); }
      // value
      const big = n <= 6; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `${big ? 30 : n <= 7 ? 26 : 22}px "Lilita One", sans-serif`; c.lineWidth = 6; c.lineJoin = 'round'; c.strokeStyle = 'rgba(60,28,4,.9)';
      const ty = p.stars ? 796 : 782; c.strokeText(String(p.value), x + w / 2, ty); c.fillText(String(p.value), x + w / 2, ty);
      if (p.stars) { for (let j = 0; j < p.stars; j++) { const sx = x + w / 2 + (j - (p.stars - 1) / 2) * 17; goldStar(c, sx, 762, 8.5); } }
      // gate (a bar across the top of the pocket)
      const gate = d ? d.gates[i] : { open: false, openT: 0, hitT: -1 };
      const o = gate.open ? Math.min(1, gate.openT / 0.35) : 0, hit = gate.hitT >= 0 ? Math.max(0, 1 - gate.hitT / 0.3) : 0;
      if (o < 1) {
        c.globalAlpha = 1 - o; const gy = 736 - o * 18 - hit * 4;
        c.fillStyle = '#c98a4b'; rr(c, x + 6, gy - 5, w - 12, 10, 5); c.fill(); c.strokeStyle = '#5a3210'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#5a3210'; for (let b = x + 16; b < x + w - 10; b += 16) { c.beginPath(); c.arc(b, gy, 1.8, 0, TAU); c.fill(); }
        c.globalAlpha = 1;
      } else { c.fillStyle = 'rgba(150,90,30,.35)'; c.fillRect(x + 6, 732, w - 12, 3); }
      c.restore();
    }
    // dividers
    for (let i = 1; i < n; i++) {
      const x = i * w; const g = c.createLinearGradient(x - 5, 0, x + 5, 0); g.addColorStop(0, '#8a5226'); g.addColorStop(0.45, '#e2a868'); g.addColorStop(1, '#6b3c18');
      c.fillStyle = g; c.fillRect(x - 4, 730, 8, BH - 730); c.strokeStyle = 'rgba(70,30,0,.55)'; c.lineWidth = 1.2; c.strokeRect(x - 4, 730, 8, BH - 730);
      c.fillStyle = g; c.beginPath(); c.arc(x, 730, 6.5, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(x - 1.8, 728, 1.8, 0, TAU); c.fill();
    }
  }
  sides(c, d) {
    for (const b of d.sideBumpers) {
      const h = b.hitT >= 0 ? Math.max(0, 1 - b.hitT / 0.3) : 0, col = b.tone === 'purple' ? ['#6d3de8', '#c7a6ff'] : ['#ff7a1e', '#ffd0a0'];
      c.save(); c.translate(b.x, b.y); c.scale(1 + h * 0.25, 1 + h * 0.25);
      if (sprite(c, 'bumper-' + b.tone, b.r * 2.35)) { if (h > 0) { c.globalAlpha = h; c.lineWidth = 3; c.strokeStyle = '#fff'; c.beginPath(); c.arc(0, 0, b.r * 1.25, 0, TAU); c.stroke(); } c.restore(); continue; }
      c.fillStyle = shade(c, b.r, col[0], col[1]); c.beginPath(); c.arc(0, 0, b.r, 0, TAU); c.fill();
      c.lineWidth = 3; c.strokeStyle = h > 0 ? '#fff' : 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(0, 0, b.r * 0.62, 0, TAU); c.stroke();
      c.restore();
    }
    for (const r of d.barricades) {
      const h = r.hitT >= 0 ? Math.max(0, 1 - r.hitT / 0.3) : 0;
      c.save(); c.lineCap = 'round'; c.lineWidth = r.r * 2; c.strokeStyle = h > 0 ? '#e9b77a' : '#9a6232'; c.beginPath(); c.moveTo(r.x1, r.y1); c.lineTo(r.x2, r.y2); c.stroke();
      c.lineWidth = 2; c.strokeStyle = '#4a2a0c'; c.stroke();
      const mx = (r.x1 + r.x2) / 2, my = (r.y1 + r.y2) / 2; c.fillStyle = '#5fb04a'; c.beginPath(); c.ellipse(mx, my - 8, 7, 3.5, -0.6, 0, TAU); c.fill(); c.restore();
    }
  }
  bumper(c, m) {
    const h = m.hitT >= 0 && m.hitT !== undefined ? 0 : 0, t = this.time;
    c.save(); c.translate(m.x, m.y);
    const g = c.createRadialGradient(0, 0, 4, 0, 0, m.r * 2.4); g.addColorStop(0, 'rgba(255,214,90,.5)'); g.addColorStop(1, 'rgba(255,214,90,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, m.r * 2.4, 0, TAU); c.fill();
    if (SPR.has('bumper-orb')) { c.translate(0, Math.sin(t * 5) * 1.5); c.rotate(Math.sin(t * 2.4) * 0.12); sprite(c, 'bumper-orb', m.r * 3); c.restore(); return; }
    c.fillStyle = shade(c, m.r, '#1aa6d8', '#e6fbff'); c.beginPath(); c.arc(0, 0, m.r, 0, TAU); c.fill();
    c.rotate(t * 3); c.lineWidth = 3; c.strokeStyle = '#fff'; c.setLineDash([6, 6]); c.beginPath(); c.arc(0, 0, m.r * 0.65, 0, TAU); c.stroke();
    c.restore(); void h;
  }
  ball(c, b, team) {
    const R = b.r * (b.r < 9 ? 1.45 : 1.22); // drawn a little bigger than the physics nut, so it reads from the back of the room
    // squash on impact
    if (b.impact > 0.02) { c.rotate(b.impactAngle); c.scale(1 - b.impact * 0.22, 1 + b.impact * 0.12); c.rotate(-b.impactAngle); }
    const mood = nutMood(b);
    if (b.kind === 'normal') {
      // the team's acorn: a ring in the team colour behind it, the painted face for its mood on top
      c.save(); c.lineWidth = R * 0.3; c.strokeStyle = team ? team.color : '#ffb43a'; c.globalAlpha = 0.9; c.beginPath(); c.arc(0, R * 0.1, R * 1.16, 0, TAU); c.stroke(); c.restore();
      c.save(); c.rotate(Math.sin(b.rot || 0) * 0.25);
      if (!sprite(c, 'nut-' + mood, R * 2.8) && !sprite(c, 'nut-happy', R * 2.8)) drawAcorn(c, R * 1.14, mood);
      c.restore();
    } else {
      c.save();
      c.rotate(['bowling', 'turtle', 'bouncy', 'cow', 'zombie', 'minizombie', 'kernel', 'popcorn'].includes(b.kind) ? b.rot : 0);
      drawThing(c, b.kind, R, this.time, b); c.restore();
      if (b.moodT > 0) emote(c, R, mood, this.time);
    }
  }
  nutHop(c, e, s) {
    const t = e.t, life = 1.5, up = 1 - Math.pow(1 - Math.min(1, t / 0.35), 3), R = (e.r || 11) * 1.22 * (e.big ? 2 : 1.7);
    const y = e.y - up * (e.big ? 150 : 125) + Math.sin(Math.max(0, t - 0.35) * 9) * 4 * (1 - t / life);
    const pop = t < 0.18 ? 0.5 + t / 0.18 * 0.7 : t < 0.3 ? 1.2 - (t - 0.18) / 0.12 * 0.2 : 1, fade = t > life * 0.72 ? Math.max(0, 1 - (t - life * 0.72) / (life * 0.28)) : 1;
    c.save(); c.globalAlpha = fade; c.translate(e.x, y); c.scale(pop, pop);
    if (e.mood === 'love' || e.mood === 'cheer') for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1, rr = R * 1.5; if (e.mood === 'love') heart(c, Math.cos(a) * rr, Math.sin(a) * rr * 0.6 - R * 0.4, R * 0.28, '#ff5c8a'); else goldStar(c, Math.cos(a) * rr, Math.sin(a) * rr * 0.6 - R * 0.4, R * 0.24); }
    if (e.k === 'normal') { c.lineWidth = R * 0.26; c.strokeStyle = s.team ? s.team.color : '#ffb43a'; c.globalAlpha = fade * 0.9; c.beginPath(); c.arc(0, R * 0.08, R * 1.02, 0, TAU); c.stroke(); c.globalAlpha = fade; if (!sprite(c, 'nut-' + e.mood, R * 2.45)) drawAcorn(c, R, e.mood); }
    else { drawThing(c, e.k, R, this.time, e); emote(c, R, e.mood, this.time); }
    c.restore();
  }
  fx(c, d, s) {
    const T = this.time;
    // trails
    for (const b of d.balls) {
      if (b.trail.length < 2) continue;
      const rainbow = b.kind === 'balloon';
      for (let i = 1; i < b.trail.length; i++) {
        const a = i / b.trail.length; c.strokeStyle = rainbow ? `hsla(${(170 + i * 8 + T * 60) % 360},70%,62%,${a * 0.55})` : `rgba(225,140,50,${a * 0.3})`;
        c.lineWidth = (rainbow ? 7 : b.r * 1.1) * a; c.lineCap = 'round'; c.beginPath(); c.moveTo(b.trail[i - 1].x, b.trail[i - 1].y); c.lineTo(b.trail[i].x, b.trail[i].y); c.stroke();
      }
    }
    // effects under the balls
    for (const e of d.effects) {
      if (e.t < 0) continue;
      const p = e.t / 0.7;
      if (e.kind === 'boom') {
        const r = e.r * Math.min(1, e.t / 0.25); c.save(); c.globalAlpha = 1 - p;
        const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.35, '#ffd25a'); g.addColorStop(0.75, 'rgba(120,190,70,.55)'); g.addColorStop(1, 'rgba(120,190,70,0)');
        c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y, r, 0, TAU); c.fill(); c.lineWidth = 6 * (1 - p); c.strokeStyle = '#fff'; c.beginPath(); c.arc(e.x, e.y, r * 1.05, 0, TAU); c.stroke(); c.restore();
      } else if (e.kind === 'pop') {
        c.save(); c.globalAlpha = 1 - p; c.strokeStyle = PEGCOL[e.c || 'normal'] ? PEGCOL[e.c || 'normal'][2] : '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, 8 + p * 20, 0, TAU); c.stroke(); c.restore();
      } else if (e.kind === 'splash') {
        c.save(); c.globalAlpha = 1 - p; c.fillStyle = '#fffdf6'; c.strokeStyle = '#b08a5a'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.arc(e.x + Math.cos(a) * p * 26, e.y + Math.sin(a) * p * 26, 4 * (1 - p) + 1, 0, TAU); c.fill(); c.stroke(); } c.restore();
      } else if (e.kind === 'laser') {
        c.save(); c.globalAlpha = 1 - p; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,160,30,.75)'; c.lineWidth = 8; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x2, e.y2); c.stroke(); c.strokeStyle = '#fff6c0'; c.lineWidth = 3; c.stroke();
        const gg = c.createRadialGradient(e.x2, e.y2, 0, e.x2, e.y2, 22); gg.addColorStop(0, 'rgba(255,230,120,.9)'); gg.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = gg; c.beginPath(); c.arc(e.x2, e.y2, 22, 0, TAU); c.fill(); c.restore();
      } else if (e.kind === 'crack') {
        c.save(); c.globalAlpha = 1 - p; c.strokeStyle = '#c0843e'; c.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(e.x + Math.cos(a) * 10, e.y + Math.sin(a) * 10); c.lineTo(e.x + Math.cos(a) * (14 + p * 26), e.y + Math.sin(a) * (14 + p * 26)); c.stroke(); } c.restore();
      }
    }
    // particles
    for (const q of d.particles) { c.globalAlpha = Math.max(0, 1 - q.t / q.life); c.fillStyle = q.color; c.beginPath(); c.arc(q.x, q.y, q.size, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    // coins
    for (const q of d.coins) { c.save(); c.globalAlpha = Math.max(0, 1 - q.t / 0.9); c.translate(q.x, q.y); c.scale(Math.cos(q.t * 14), 1); drawThing(c, 'coin', 8); c.restore(); }
    // balls
    for (const b of d.balls) {
      c.save(); c.translate(b.x, b.y);
      if (b.kind === 'dynamite' && b.fuse !== undefined) { const fl = Math.sin(T * 40) > 0; if (fl) { c.shadowColor = '#ff5a00'; c.shadowBlur = 20; } }
      if (b.state === 'reel') { c.restore(); c.save(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(b.reel.toX, 0); c.lineTo(b.x, b.y); c.stroke(); c.translate(b.x, b.y); }
      this.ball(c, b, s.team);
      c.restore();
    }
    // a nut that just landed hops out of its basket with a face to match the prize
    for (const e of d.effects) { if (e.kind === 'nutland' && e.t >= 0) this.nutHop(c, e, s); }
    // stars flying up
    for (const e of d.effects) {
      if (e.kind !== 'starfly' || e.t < 0) continue;
      const p = Math.min(1, e.t / 1.0), ease = 1 - (1 - p) ** 3;
      const x = e.x + (BW - 40 - e.x) * ease, y = e.y + (-30 - e.y) * ease - Math.sin(p * Math.PI) * 80;
      c.save(); c.globalAlpha = 1 - Math.max(0, p - 0.8) * 5; goldStar(c, x, y, 16 * (1 - p * 0.3)); c.restore();
    }
    // score floats
    for (const f of d.floats) {
      const life = f.big ? 1.6 : 1.1, p = f.t / life, y = f.y - (f.big ? 50 : 34) * Math.min(1, f.t * 2.2);
      const col = { good: '#c6ffe9', gold: '#ffe14d', bad: '#ff8a94', info: '#ffffff', star: '#ffe14d', coin: '#ffe14d' }[f.tone] || '#fff';
      const sz = f.big ? 46 : f.tone === 'info' ? 26 : f.tone === 'star' ? 34 : 21;
      const pop = f.t < 0.12 ? 0.6 + (f.t / 0.12) * 0.6 : f.t < 0.22 ? 1.2 - ((f.t - 0.12) / 0.1) * 0.2 : 1;
      c.save(); c.globalAlpha = p > 0.75 ? Math.max(0, 1 - (p - 0.75) * 4) : 1; c.translate(Math.max(40, Math.min(BW - 40, f.x)), y); c.scale(pop, pop);
      c.font = `${sz}px "Lilita One", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      c.lineWidth = sz * 0.28; c.strokeStyle = 'rgba(30,8,60,.9)'; c.strokeText(f.text, 0, 0); c.fillStyle = col; c.fillText(f.text, 0, 0); c.restore();
    }
  }
}
// the face a nut shows now: a feeling from the last bump while it lasts, else "wheee" when it is fast and "happy" when it is calm
export function nutMood(b) {
  if (b.moodT > 0 && b.mood) return b.mood;
  return Math.hypot(b.vx || 0, b.vy || 0) > 330 ? 'wheee' : 'happy';
}
// a small feeling bubble above a power-up nut (their painted faces do not change)
function emote(c, R, mood, t) {
  const x = R * 0.95, y = -R * 1.15;
  c.save(); c.translate(x, y); c.lineJoin = 'round';
  if (mood === 'stars' || mood === 'cheer') { goldStar(c, 0, 0, R * 0.42); }
  else if (mood === 'love') { heart(c, 0, 0, R * 0.42, '#ff5c8a'); }
  else if (mood === 'ouch') { c.fillStyle = '#7fd0ff'; c.strokeStyle = '#2a6f9e'; c.lineWidth = R * 0.08; c.beginPath(); c.moveTo(0, -R * 0.45); c.quadraticCurveTo(R * 0.32, 0, 0, R * 0.22); c.quadraticCurveTo(-R * 0.32, 0, 0, -R * 0.45); c.fill(); c.stroke(); }
  else if (mood === 'dizzy') { c.rotate(t * 6); c.strokeStyle = '#7a4a1e'; c.lineWidth = R * 0.1; c.beginPath(); for (let i = 0; i < 26; i++) { const a = i * 0.5, r = i * R * 0.018; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); }
  else if (mood === 'bonk') { c.fillStyle = '#fff'; c.strokeStyle = '#6b3f1c'; c.lineWidth = R * 0.08; c.beginPath(); c.arc(0, 0, R * 0.36, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#e8572a'; c.font = `900 ${R * 0.6}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, R * 0.03); }
  c.restore();
}
export function heart(c, x, y, R, col) {
  c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = 'rgba(90,20,40,.6)'; c.lineWidth = Math.max(1, R * 0.14);
  c.beginPath(); c.moveTo(0, R * 0.85); c.bezierCurveTo(-R * 1.25, 0, -R * 0.6, -R * 0.95, 0, -R * 0.35); c.bezierCurveTo(R * 0.6, -R * 0.95, R * 1.25, 0, 0, R * 0.85); c.fill(); c.stroke(); c.restore();
}
// the code-drawn acorn (only while the painted one is missing): a round nut, a cap, a face for the mood
export function drawAcorn(c, R, mood = 'happy') {
  c.save();
  c.fillStyle = shade(c, R, '#a8501c', '#f0a060'); c.beginPath(); c.arc(0, R * 0.12, R * 0.9, 0, TAU); c.fill(); c.lineWidth = R * 0.08; c.strokeStyle = '#4a2008'; c.stroke();
  c.fillStyle = shade(c, R, '#6b3c18', '#c08a54'); c.beginPath(); c.ellipse(0, -R * 0.42, R * 0.98, R * 0.5, 0, Math.PI, TAU); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = '#6b3c18'; c.lineWidth = R * 0.14; c.beginPath(); c.moveTo(0, -R * 0.85); c.quadraticCurveTo(R * 0.15, -R * 1.15, R * 0.32, -R * 1.1); c.stroke();
  const ey = R * 0.08, ex = R * 0.32, ink = '#2a1206';
  c.fillStyle = 'rgba(255,120,120,.5)'; c.beginPath(); c.arc(-R * 0.55, R * 0.38, R * 0.15, 0, TAU); c.arc(R * 0.55, R * 0.38, R * 0.15, 0, TAU); c.fill();
  c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = R * 0.09; c.lineCap = 'round';
  const dot = (x) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(x, ey, R * 0.17, 0, TAU); c.fill(); c.fillStyle = ink; c.beginPath(); c.arc(x, ey + R * 0.02, R * 0.11, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - R * 0.04, ey - R * 0.04, R * 0.04, 0, TAU); c.fill(); };
  if (mood === 'cheer' || mood === 'love') { for (const x of [-ex, ex]) { c.beginPath(); c.arc(x, ey + R * 0.06, R * 0.13, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } }
  else if (mood === 'ouch') { for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * ex - sx * R * 0.12, ey - R * 0.1); c.lineTo(sx * ex + sx * R * 0.08, ey); c.lineTo(sx * ex - sx * R * 0.12, ey + R * 0.1); c.stroke(); } }
  else if (mood === 'stars') { for (const x of [-ex, ex]) { c.fillStyle = '#ffd23d'; star(c, x, ey, R * 0.2, R * 0.09); c.fill(); } }
  else if (mood === 'dizzy') { for (const x of [-ex, ex]) { c.beginPath(); for (let i = 0; i < 18; i++) { const a = i * 0.6, r = i * R * 0.011; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, ey + Math.sin(a) * r); } c.stroke(); } }
  else { dot(-ex); dot(ex); }
  if (mood === 'sad') { c.beginPath(); c.arc(0, R * 0.62, R * 0.2, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  else if (mood === 'bonk' || mood === 'wheee') { c.fillStyle = '#7a1630'; c.beginPath(); c.ellipse(0, R * 0.45, R * (mood === 'wheee' ? 0.2 : 0.11), R * (mood === 'wheee' ? 0.2 : 0.13), 0, 0, TAU); c.fill(); }
  else if (mood === 'ouch' || mood === 'dizzy') { c.beginPath(); c.moveTo(-R * 0.22, R * 0.45); for (let i = 1; i <= 4; i++) c.lineTo(-R * 0.22 + i * R * 0.11, R * (i % 2 ? 0.38 : 0.45)); c.stroke(); }
  else { c.beginPath(); c.arc(0, R * 0.3, R * 0.25, 0.15 * Math.PI, 0.85 * Math.PI); if (mood !== 'happy') { c.closePath(); c.fillStyle = '#7a1630'; c.fill(); } c.stroke(); }
  if (mood === 'love') { heart(c, -ex, ey, R * 0.16, '#ff5c8a'); heart(c, ex, ey, R * 0.16, '#ff5c8a'); }
  c.restore();
}
export const ballKind = (power) => (!power || power === 'shield' || power === 'boost' ? 'normal' : power === 'yinyang' ? 'yin' : power);
// a point at distance d along a rounded rectangle (clockwise from the top-left corner's end)
function rperim(x, y, w, h, r, d) {
  const sw = w - 2 * r, sh = h - 2 * r, q = (Math.PI / 2) * r, P = 2 * (sw + sh) + 4 * q; d = ((d % P) + P) % P;
  const arc = (cx, cy, a0, dd) => { const a = a0 + dd / r; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  if (d < sw) return [x + r + d, y]; d -= sw;
  if (d < q) return arc(x + w - r, y + r, -Math.PI / 2, d); d -= q;
  if (d < sh) return [x + w, y + r + d]; d -= sh;
  if (d < q) return arc(x + w - r, y + h - r, 0, d); d -= q;
  if (d < sw) return [x + w - r - d, y + h]; d -= sw;
  if (d < q) return arc(x + r, y + h - r, Math.PI / 2, d); d -= q;
  if (d < sh) return [x, y + h - r - d]; d -= sh;
  return arc(x + r, y + r, Math.PI, d);
}
function perim(x, y, w, h, d) {
  const P = 2 * (w + h); d = ((d % P) + P) % P;
  if (d < w) return [x + d, y]; d -= w; if (d < h) return [x + w, y + d]; d -= h; if (d < w) return [x + w - d, y + h]; d -= w; return [x, y + h - d];
}
function shadeHex(hex, amt) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
