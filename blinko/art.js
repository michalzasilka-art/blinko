// Blinko — everything that is drawn: the twilight fair behind the game, the peg board, the balls and the power-up pictures.
// All art is code (canvas). Board units are 600 × 820 (see engine.js).
import { BW, BH, SLOTS, slotX } from './data.js';

const TAU = Math.PI * 2;
const rnd = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

/* ---------------------------------------------------------------- the fair behind everything */
export function paintScene(cv, W = 1920, H = 1080) {
  const c = cv.getContext('2d'); cv.width = W; cv.height = H;
  const r = rnd(7);
  // sky
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#120a3c'); sky.addColorStop(0.42, '#3a1d78'); sky.addColorStop(0.66, '#8a3f9e'); sky.addColorStop(0.8, '#ff8a6b'); sky.addColorStop(1, '#ffc27a');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  // big soft glow on the horizon
  let g = c.createRadialGradient(W / 2, H * 0.82, 10, W / 2, H * 0.82, W * 0.6);
  g.addColorStop(0, 'rgba(255,214,140,.55)'); g.addColorStop(1, 'rgba(255,214,140,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // stars
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = r() * H * 0.55, s = r() * 1.8 + 0.3;
    c.globalAlpha = 0.25 + r() * 0.7 * (1 - y / (H * 0.6)); c.fillStyle = '#fff';
    c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill();
  }
  c.globalAlpha = 1;
  // moon
  g = c.createRadialGradient(1540, 170, 10, 1540, 170, 160); g.addColorStop(0, 'rgba(255,240,210,.5)'); g.addColorStop(1, 'rgba(255,240,210,0)');
  c.fillStyle = g; c.fillRect(1300, 0, 500, 400);
  c.fillStyle = '#fff4dc'; c.beginPath(); c.arc(1540, 170, 46, 0, TAU); c.fill();
  c.fillStyle = 'rgba(210,190,230,.35)'; [[1525, 160, 9], [1555, 185, 6], [1548, 150, 5]].forEach(([x, y, s]) => { c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); });
  // far hills
  const hill = (y0, amp, col, seed) => {
    const rr = rnd(seed); c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    const ph = rr() * 6;
    for (let x = 0; x <= W; x += 20) c.lineTo(x, y0 + Math.sin(x / 310 + ph) * amp + Math.sin(x / 120 + ph * 2) * amp * 0.25);
    c.lineTo(W, H); c.fill();
  };
  hill(H * 0.74, 30, '#5a2b74', 3);
  // ferris wheel (left)
  ferris(c, 250, 560, 240);
  // tents (right)
  tent(c, 1580, 820, 170, '#ff5e8a', '#ffe9d6'); tent(c, 1770, 850, 130, '#4f8bff', '#e6f0ff'); tent(c, 1430, 870, 110, '#ffc93d', '#fff6dc');
  hill(H * 0.84, 22, '#3b1a58', 11);
  hill(H * 0.92, 16, '#26103f', 19);
  // string lights across the top corners
  bulbs(c, [[0, 40], [260, 120], [560, 60]], 22, r);
  bulbs(c, [[1360, 60], [1660, 130], [1920, 40]], 22, r);
  // vignette
  g = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,4,24,.55)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function ferris(c, x, y, R) {
  c.save(); c.translate(x, y);
  c.strokeStyle = 'rgba(40,16,70,.9)'; c.lineWidth = 10;
  c.beginPath(); c.moveTo(-R * 0.55, R * 1.25); c.lineTo(0, 0); c.lineTo(R * 0.55, R * 1.25); c.stroke();
  c.lineWidth = 6; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
  c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R * 0.62, 0, TAU); c.stroke();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * R, Math.sin(a) * R); c.stroke(); }
  for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU; glowDot(c, Math.cos(a) * R, Math.sin(a) * R, 4, i % 3 ? '#ffd27a' : '#ff8fd0'); }
  const cab = ['#ff5e8a', '#ffc93d', '#33d1a6', '#4f8bff', '#b28bff', '#ff973b', '#5fcf5a', '#ff5e8a'];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.2, cx = Math.cos(a) * R, cy = Math.sin(a) * R; c.fillStyle = cab[i]; c.globalAlpha = 0.85; rr(c, cx - 17, cy + 4, 34, 26, 8); c.fill(); c.globalAlpha = 1; }
  glowDot(c, 0, 0, 12, '#fff2c0');
  c.restore();
}
function tent(c, x, y, w, col, col2) {
  c.save(); c.translate(x, y);
  const h = w * 0.9, n = 6;
  for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? col2 : col; c.beginPath(); c.moveTo(0, -h); c.lineTo(-w / 2 + (i / n) * w, 0); c.lineTo(-w / 2 + ((i + 1) / n) * w, 0); c.closePath(); c.fill(); }
  c.fillStyle = 'rgba(30,10,50,.35)'; c.fillRect(-w / 2, 0, w, h * 0.45);
  for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? col2 : col; c.beginPath(); c.arc(-w / 2 + ((i + 0.5) / n) * w, 0, w / n / 2, 0, Math.PI); c.fill(); }
  c.fillStyle = 'rgba(255,220,150,.75)'; rr(c, -w * 0.12, h * 0.08, w * 0.24, h * 0.37, 6); c.fill();
  c.fillStyle = col; c.beginPath(); c.moveTo(0, -h); c.lineTo(0, -h - 26); c.lineTo(22, -h - 18); c.lineTo(0, -h - 12); c.fill();
  c.restore();
}
function bulbs(c, pts, n, r) {
  c.strokeStyle = 'rgba(30,12,40,.8)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(...pts[0]); c.quadraticCurveTo(...pts[1], ...pts[2]); c.stroke();
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = (1 - t) ** 2 * pts[0][0] + 2 * (1 - t) * t * pts[1][0] + t * t * pts[2][0], y = (1 - t) ** 2 * pts[0][1] + 2 * (1 - t) * t * pts[1][1] + t * t * pts[2][1];
    glowDot(c, x, y + 7, 6, ['#ffd27a', '#ff8fd0', '#8fe3ff', '#b4ff9a'][i % 4]);
  }
}
function glowDot(c, x, y, s, col) {
  const g = c.createRadialGradient(x, y, 0, x, y, s * 4); g.addColorStop(0, col); g.addColorStop(0.25, col + 'aa'); g.addColorStop(1, col + '00');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, s * 4, 0, TAU); c.fill();
  c.fillStyle = '#fffbe8'; c.beginPath(); c.arc(x, y, s * 0.55, 0, TAU); c.fill();
}
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
export function drawThing(c, k, R, t = 0, extra = {}) {
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
    case 'milk': c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -R * 1.4); c.quadraticCurveTo(R, 0, 0, R); c.quadraticCurveTo(-R, 0, 0, -R * 1.4); c.fill(); break;
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
export function star(c, x, y, R, r, n = 5) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU - Math.PI / 2, d = i % 2 ? r : R; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * d, y + Math.sin(a) * d); } c.closePath(); }

// a power-up picture as an image URL (for the cards and buttons)
const iconCache = new Map();
export function powerIcon(id, size = 160) {
  const key = id + size; if (iconCache.has(key)) return iconCache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d');
  c.translate(size / 2, size / 2 + (['dynamite', 'yoyo', 'balloon', 'shark'].includes(id) ? size * 0.08 : 0));
  drawThing(c, id === 'yinyang' ? 'yin' : id, size * 0.36, 0.3);
  const url = cv.toDataURL(); iconCache.set(key, url); return url;
}
export function pegIcon(kind, size = 64) {
  const key = 'peg' + kind + size; if (iconCache.has(key)) return iconCache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d');
  c.translate(size / 2, size / 2); drawPeg(c, { kind, r: kind === 'spike' ? 9 : 8, flash: 0, icon: true }, size / 32, 0);
  const url = cv.toDataURL(); iconCache.set(key, url); return url;
}

/* ---------------------------------------------------------------- pegs */
const PEGCOL = { normal: ['#3e6dff', '#cfe0ff', '#7fb0ff'], mint: ['#0faa7e', '#b8ffe8', '#3dffc4'], gold: ['#e09a00', '#fff3b0', '#ffd23d'], vanish: ['#ff5fbf', '#ffe0f4', '#ff9ee0'], spike: ['#d01e3a', '#ffb0b8', '#ff4d5e'] };
export function drawPeg(c, p, k, time) {
  const [a, b, glow] = PEGCOL[p.kind], R = p.r * k * (p.icon ? 1 : 1.18), f = p.flash || 0;
  c.save();
  if (f > 0.02 || p.kind === 'gold') {
    const gr = R * (2.2 + f * 2.2), g = c.createRadialGradient(0, 0, R * 0.5, 0, 0, gr);
    g.addColorStop(0, glow + (f > 0.02 ? 'cc' : '55')); g.addColorStop(1, glow + '00'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, gr, 0, TAU); c.fill();
  }
  if (p.kind === 'spike') {
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
const POCKET_COL = ['#4a3ad8', '#2f8fe0', '#18b08a', '#4fbf3f', '#e0b020', '#ff8a2e', '#ff4f7a', '#d23fd8', '#ffd84a'];
export const VALUE_RANK = (pockets) => { const s = [...pockets.map((p) => p.value)].sort((a, b) => a - b); return pockets.map((p) => s.indexOf(p.value)); };

export class BoardView {
  constructor(canvas) { this.cv = canvas; this.c = canvas.getContext('2d'); this.portraits = new Map(); this.time = 0; this.hover = -1; this.marq = 0; this.pocketGlow = []; }
  setSize(w, h, ratio) {
    const dpr = Math.min(3, ratio || window.devicePixelRatio || 1);
    this.W = w; this.H = h; this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr); this.dpr = dpr;
    this.F = 30; this.k = (h - this.F * 2) / BH; this.ox = (w - BW * this.k) / 2; this.oy = this.F;
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
    this.frame(c);
    c.save(); c.translate(this.ox, this.oy); c.scale(k, k);
    // inner board
    rr(c, 0, 0, BW, BH, 22); c.save(); c.clip();
    const g = c.createLinearGradient(0, 0, 0, BH); g.addColorStop(0, '#1d1557'); g.addColorStop(0.6, '#2a1a68'); g.addColorStop(1, '#3a1d6e'); c.fillStyle = g; c.fillRect(0, 0, BW, BH);
    // soft light spots
    const sp = c.createRadialGradient(BW / 2, 140, 10, BW / 2, 140, 420); sp.addColorStop(0, 'rgba(140,120,255,.28)'); sp.addColorStop(1, 'rgba(140,120,255,0)'); c.fillStyle = sp; c.fillRect(0, 0, BW, BH);
    c.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 20; y < 730; y += 30) for (let x = (y / 30) % 2 ? 15 : 30; x < BW; x += 30) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); }
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
    rr(c, 0, 0, BW, BH, 22); c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.18)'; c.stroke();
    c.restore();
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
      c.fillStyle = sel ? '#ffd166' : 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(0, 0, 19, 0, TAU); c.fill();
      c.lineWidth = 2.5; c.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,.35)'; c.stroke();
      c.fillStyle = sel ? '#3a1068' : '#fff'; c.font = '20px "Lilita One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), 0, 1.5);
      c.restore();
    }
    if (aim && s.slot < 0) { // invite: bobbing arrows
      const b = Math.sin(this.time * 5) * 4; c.fillStyle = 'rgba(255,209,102,.9)';
      for (let i = 0; i < SLOTS; i++) { const x = slotX(i); c.beginPath(); c.moveTo(x - 7, 56 + b); c.lineTo(x + 7, 56 + b); c.lineTo(x, 65 + b); c.fill(); }
    }
  }
  ghost(c, s) {
    const x = slotX(s.slot), bob = Math.sin(this.time * 4) * 3;
    c.save(); c.setLineDash([4, 10]); c.lineWidth = 3; c.strokeStyle = 'rgba(255,209,102,.55)'; c.beginPath(); c.moveTo(x, 58); c.lineTo(x, 104); c.stroke(); c.restore();
    if (s.power === 'yinyang') { const x2 = slotX(9 - s.slot); c.save(); c.globalAlpha = 0.55; c.translate(x2, 30 + bob); drawThing(c, 'yang', 13, this.time); c.restore(); }
    c.save(); c.translate(x, 30 + bob); this.ball(c, { kind: ballKind(s.power), r: s.power === 'bowling' ? 15 : 13, rot: 0, impact: 0 }, s.team); c.restore();
  }
  pockets(c, board, d, s) {
    const n = board.pockets.length, w = BW / n, rank = VALUE_RANK(board.pockets);
    for (let i = 0; i < n; i++) {
      const p = board.pockets[i], x = i * w, col = POCKET_COL[Math.round(rank[i] * (POCKET_COL.length - 1) / Math.max(1, n - 1))];
      const fx = d ? d.effects.filter((e) => e.kind === 'pocket' && e.p === i).reduce((m, e) => Math.max(m, 1 - e.t / 0.7), 0) : 0;
      c.save();
      const g = c.createLinearGradient(0, 736, 0, BH); g.addColorStop(0, col); g.addColorStop(1, shadeHex(col, -0.45));
      c.fillStyle = g; c.fillRect(x, 736, w, BH - 736);
      c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x, 736, w, 10);
      if (fx > 0) { c.fillStyle = `rgba(255,255,255,${fx * 0.6})`; c.fillRect(x, 736, w, BH - 736); const lg = c.createLinearGradient(0, 400, 0, 736); lg.addColorStop(0, 'rgba(255,230,140,0)'); lg.addColorStop(1, `rgba(255,230,140,${fx * 0.5})`); c.fillStyle = lg; c.fillRect(x, 400, w, 336); }
      // value
      const big = n <= 6; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `${big ? 30 : n <= 7 ? 26 : 22}px "Lilita One", sans-serif`; c.lineWidth = 5; c.strokeStyle = 'rgba(20,6,50,.7)';
      const ty = p.stars ? 796 : 782; c.strokeText(String(p.value), x + w / 2, ty); c.fillText(String(p.value), x + w / 2, ty);
      if (p.stars) { for (let j = 0; j < p.stars; j++) { const sx = x + w / 2 + (j - (p.stars - 1) / 2) * 17; c.fillStyle = '#ffe14d'; star(c, sx, 762, 8.5, 3.8); c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#7a4a00'; c.stroke(); } }
      // gate (a bar across the top of the pocket)
      const gate = d ? d.gates[i] : { open: false, openT: 0, hitT: -1 };
      const o = gate.open ? Math.min(1, gate.openT / 0.35) : 0, hit = gate.hitT >= 0 ? Math.max(0, 1 - gate.hitT / 0.3) : 0;
      if (o < 1) {
        c.globalAlpha = 1 - o; const gy = 736 - o * 18 - hit * 4;
        c.fillStyle = '#ffd166'; rr(c, x + 6, gy - 5, w - 12, 10, 5); c.fill(); c.strokeStyle = '#7a4a00'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#7a4a00'; for (let b = x + 16; b < x + w - 10; b += 16) { c.beginPath(); c.arc(b, gy, 1.8, 0, TAU); c.fill(); }
        c.globalAlpha = 1;
      } else { c.fillStyle = 'rgba(255,209,102,.35)'; c.fillRect(x + 6, 732, w - 12, 3); }
      c.restore();
    }
    // dividers
    for (let i = 1; i < n; i++) {
      const x = i * w; const g = c.createLinearGradient(x - 5, 0, x + 5, 0); g.addColorStop(0, '#b8a6ff'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#8a76e0');
      c.fillStyle = g; c.fillRect(x - 3.5, 730, 7, BH - 730); c.beginPath(); c.arc(x, 730, 6, 0, TAU); c.fill(); c.strokeStyle = 'rgba(40,10,80,.6)'; c.lineWidth = 1.5; c.stroke();
    }
  }
  sides(c, d) {
    for (const b of d.sideBumpers) {
      const h = b.hitT >= 0 ? Math.max(0, 1 - b.hitT / 0.3) : 0, col = b.tone === 'purple' ? ['#6d3de8', '#c7a6ff'] : ['#ff7a1e', '#ffd0a0'];
      c.save(); c.translate(b.x, b.y); c.scale(1 + h * 0.25, 1 + h * 0.25);
      c.fillStyle = shade(c, b.r, col[0], col[1]); c.beginPath(); c.arc(0, 0, b.r, 0, TAU); c.fill();
      c.lineWidth = 3; c.strokeStyle = h > 0 ? '#fff' : 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(0, 0, b.r * 0.62, 0, TAU); c.stroke();
      c.restore();
    }
    for (const r of d.barricades) {
      const h = r.hitT >= 0 ? Math.max(0, 1 - r.hitT / 0.3) : 0;
      c.save(); c.lineCap = 'round'; c.lineWidth = r.r * 2; c.strokeStyle = h > 0 ? '#fff6c8' : '#ffc93d'; c.beginPath(); c.moveTo(r.x1, r.y1); c.lineTo(r.x2, r.y2); c.stroke();
      c.lineWidth = 2; c.strokeStyle = '#7a4a00'; c.stroke(); c.restore();
    }
  }
  bumper(c, m) {
    const h = m.hitT >= 0 && m.hitT !== undefined ? 0 : 0, t = this.time;
    c.save(); c.translate(m.x, m.y);
    const g = c.createRadialGradient(0, 0, 4, 0, 0, m.r * 2.4); g.addColorStop(0, 'rgba(120,240,255,.5)'); g.addColorStop(1, 'rgba(120,240,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, m.r * 2.4, 0, TAU); c.fill();
    c.fillStyle = shade(c, m.r, '#1aa6d8', '#e6fbff'); c.beginPath(); c.arc(0, 0, m.r, 0, TAU); c.fill();
    c.rotate(t * 3); c.lineWidth = 3; c.strokeStyle = '#fff'; c.setLineDash([6, 6]); c.beginPath(); c.arc(0, 0, m.r * 0.65, 0, TAU); c.stroke();
    c.restore(); void h;
  }
  ball(c, b, team) {
    const R = b.r * (b.r < 9 ? 1.35 : 1.1); // drawn a little bigger than the physics ball, so it reads from the back of the room
    // squash on impact
    if (b.impact > 0.02) { c.rotate(b.impactAngle); c.scale(1 - b.impact * 0.22, 1 + b.impact * 0.12); c.rotate(-b.impactAngle); }
    if (b.kind === 'normal') {
      const im = team && this.portrait(team.img);
      c.save(); c.rotate(b.rot * 0.15);
      c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fillStyle = team ? team.color : '#fff'; c.fill();
      c.save(); c.beginPath(); c.arc(0, 0, R * 0.84, 0, TAU); c.clip(); if (im) c.drawImage(im, -R * 0.84, -R * 0.84, R * 1.68, R * 1.68); else { c.fillStyle = '#fff'; c.fill(); } c.restore();
      c.restore();
      c.lineWidth = 1.6; c.strokeStyle = 'rgba(20,6,40,.6)'; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
      gloss(c, R);
    } else {
      c.rotate(['bowling', 'turtle', 'bouncy', 'cow', 'zombie', 'minizombie', 'kernel', 'popcorn'].includes(b.kind) ? b.rot : 0);
      drawThing(c, b.kind, R, this.time, b);
    }
  }
  fx(c, d, s) {
    const T = this.time;
    // trails
    for (const b of d.balls) {
      if (b.trail.length < 2) continue;
      const rainbow = b.kind === 'balloon';
      for (let i = 1; i < b.trail.length; i++) {
        const a = i / b.trail.length; c.strokeStyle = rainbow ? `hsla(${(i * 25 + T * 200) % 360},90%,65%,${a * 0.7})` : `rgba(255,230,160,${a * 0.35})`;
        c.lineWidth = (rainbow ? 7 : b.r * 1.1) * a; c.lineCap = 'round'; c.beginPath(); c.moveTo(b.trail[i - 1].x, b.trail[i - 1].y); c.lineTo(b.trail[i].x, b.trail[i].y); c.stroke();
      }
    }
    // effects under the balls
    for (const e of d.effects) {
      if (e.t < 0) continue;
      const p = e.t / 0.7;
      if (e.kind === 'boom') {
        const r = e.r * Math.min(1, e.t / 0.25); c.save(); c.globalAlpha = 1 - p;
        const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, r); g.addColorStop(0, '#fffbe0'); g.addColorStop(0.35, '#ffb02e'); g.addColorStop(0.75, 'rgba(255,80,40,.6)'); g.addColorStop(1, 'rgba(255,80,40,0)');
        c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y, r, 0, TAU); c.fill(); c.lineWidth = 6 * (1 - p); c.strokeStyle = '#fff'; c.beginPath(); c.arc(e.x, e.y, r * 1.05, 0, TAU); c.stroke(); c.restore();
      } else if (e.kind === 'pop') {
        c.save(); c.globalAlpha = 1 - p; c.strokeStyle = PEGCOL[e.c || 'normal'] ? PEGCOL[e.c || 'normal'][2] : '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(e.x, e.y, 8 + p * 20, 0, TAU); c.stroke(); c.restore();
      } else if (e.kind === 'splash') {
        c.save(); c.globalAlpha = 1 - p; c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.arc(e.x + Math.cos(a) * p * 26, e.y + Math.sin(a) * p * 26, 4 * (1 - p) + 1, 0, TAU); c.fill(); } c.restore();
      } else if (e.kind === 'laser') {
        c.save(); c.globalAlpha = 1 - p; c.lineCap = 'round'; c.strokeStyle = '#ff3b6b'; c.lineWidth = 7; c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x2, e.y2); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke(); c.restore();
      } else if (e.kind === 'crack') {
        c.save(); c.globalAlpha = 1 - p; c.strokeStyle = '#fff6d8'; c.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(e.x + Math.cos(a) * 10, e.y + Math.sin(a) * 10); c.lineTo(e.x + Math.cos(a) * (14 + p * 26), e.y + Math.sin(a) * (14 + p * 26)); c.stroke(); } c.restore();
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
    // stars flying up
    for (const e of d.effects) {
      if (e.kind !== 'starfly' || e.t < 0) continue;
      const p = Math.min(1, e.t / 1.0), ease = 1 - (1 - p) ** 3;
      const x = e.x + (BW - 40 - e.x) * ease, y = e.y + (-30 - e.y) * ease - Math.sin(p * Math.PI) * 80;
      c.save(); c.globalAlpha = 1 - Math.max(0, p - 0.8) * 5; c.fillStyle = '#ffe14d'; star(c, x, y, 16 * (1 - p * 0.3), 7); c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#7a4a00'; c.stroke(); c.restore();
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
export const ballKind = (power) => (!power || power === 'shield' || power === 'boost' ? 'normal' : power === 'yinyang' ? 'yin' : power);
function perim(x, y, w, h, d) {
  const P = 2 * (w + h); d = ((d % P) + P) % P;
  if (d < w) return [x + d, y]; d -= w; if (d < h) return [x + w, y + d]; d -= h; if (d < w) return [x + w - d, y + h]; d -= w; return [x, y + h - d];
}
function shadeHex(hex, amt) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
