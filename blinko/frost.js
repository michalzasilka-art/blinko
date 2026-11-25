/* Blinko at Christmas: the "right answer" moment (2026-11-25, the user: "frozen edges of your screen, snowing, congratulations").
   Frost grows in from the edges of the screen (corners first, a ragged front), a flurry of snow falls in front of everything,
   and "Congratulations!" with who got it right. Then the frost melts back to the edges and the snow falls away.
   game.js calls prepareFrost() once after loading and freeze() when the teacher taps Right. */

const GROW = 0.95, HOLD = 2.2, MELT = 0.8, SNOW_FOR = 2.2; // seconds
const MW = 480, MH = 270, FRONT = 0.07;                      // the freezing mask (stretched over the stage) and how soft its front is

let frostImg = null, maskCv = null, mctx = null, maskData = null, grow = null;
let cv = null, cx = null, run = null, raf = 0, dotSpr = null, flakeSpr = null;

// value noise for a ragged freezing front
const hash = (x, y) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
const fbm = (x, y) => vnoise(x / 30, y / 30) * 0.55 + vnoise(x / 12 + 17, y / 12 + 9) * 0.3 + vnoise(x / 5 + 3, y / 5 + 31) * 0.15;

export function prepareFrost(url, canvas) {
  cv = canvas; cx = cv.getContext('2d'); cv.width = 1920; cv.height = 1080;
  // when each bit of the screen freezes (0 = first): the corners, then along the edges, then inward
  grow = new Float32Array(MW * MH); let lo = Infinity, hi = -Infinity;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const u = x / (MW - 1), v = y / (MH - 1), dx = Math.min(u, 1 - u) * (16 / 9), dy = Math.min(v, 1 - v);
    const g = Math.min(dx, dy) + Math.hypot(dx, dy) * 0.28 + (fbm(x, y) - 0.5) * 0.2;
    grow[y * MW + x] = g; if (g < lo) lo = g; if (g > hi) hi = g;
  }
  const top = lo + (hi - lo) * 0.62; // the frost stops at the edges: the middle never freezes
  for (let i = 0; i < grow.length; i++) grow[i] = (grow[i] - lo) / (top - lo);
  maskCv = document.createElement('canvas'); maskCv.width = MW; maskCv.height = MH; mctx = maskCv.getContext('2d');
  maskData = mctx.createImageData(MW, MH); for (let i = 0; i < maskData.data.length; i += 4) { maskData.data[i] = maskData.data[i + 1] = maskData.data[i + 2] = 255; }
  dotSpr = sprite(64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  flakeSpr = sprite(96, (c) => {
    c.translate(48, 48); c.strokeStyle = '#fff'; c.lineCap = 'round'; c.shadowColor = 'rgba(150,210,255,.9)'; c.shadowBlur = 8;
    for (let k = 0; k < 6; k++) { c.rotate(Math.PI / 3); c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -38); c.stroke(); c.lineWidth = 4; c.beginPath(); c.moveTo(0, -20); c.lineTo(-11, -30); c.moveTo(0, -20); c.lineTo(11, -30); c.stroke(); }
  });
  return new Promise((res) => { const im = new Image(); im.onload = () => { frostImg = im; res(true); }; im.onerror = () => res(false); im.src = url; });
}
function sprite(n, draw) { const c = document.createElement('canvas'); c.width = c.height = n; draw(c.getContext('2d')); return c; }

// the moment; text = the "Congratulations!" element (its CSS animation runs alongside)
export function freeze({ text, reduced = false }) {
  if (!cv) return;
  run = { t: 0, reduced, text, flakes: [], spawn: 0, maskT: -1, maskM: -1 };
  if (!reduced) for (let i = 0; i < 140; i++) run.flakes.push(newFlake(Math.random() * -900)); // a curtain already on its way in
  cv.classList.add('on');
  if (text) { text.classList.remove('on'); void text.offsetWidth; text.classList.add('on'); }
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
}
export const freezing = () => !!run;
// stop the moment at once (a wrong answer came while the frost was still on)
export function unfreeze(text) {
  if (run) { run = null; cx.clearRect(0, 0, 1920, 1080); cv.classList.remove('on'); }
  if (text) text.classList.remove('on');
}

function newFlake(y) {
  const z = Math.random(), star = Math.random() < 0.12;
  return { x: Math.random() * 2040 - 60, y, z, star, r: star ? 22 + z * 26 : 6 + z * z * 24, vy: 170 + z * 330, vx: -40 + Math.random() * 80, sw: Math.random() * 6.3, rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 1.6, a: 0.55 + z * 0.45 };
}

let last = 0;
function step(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
  const r = run; if (!r) { raf = 0; return; }
  r.t += dt;
  const t = r.t, end = GROW + HOLD + MELT;
  // the freezing front (T) and the melt (m)
  const front = r.reduced ? 1 + FRONT : (1 + FRONT) * (1 - Math.pow(1 - Math.min(1, t / GROW), 2.2));
  const mp = Math.max(0, Math.min(1, (t - GROW - HOLD) / MELT)), m = 1 - mp * mp * (3 - 2 * mp);
  const fr = r.reduced ? front : front - mp * 0.45; // melting: the frost goes back toward the edges as it fades
  cx.clearRect(0, 0, 1920, 1080);
  if (frostImg && m > 0.002) {
    if (Math.abs(fr - r.maskT) > 0.002 || Math.abs(m - r.maskM) > 0.004) {
      const d = maskData.data;
      for (let i = 0, j = 3; i < grow.length; i++, j += 4) { const f = (fr - grow[i]) / FRONT; d[j] = f <= 0 ? 0 : f >= 1 ? 255 * m : 255 * f * m; }
      mctx.putImageData(maskData, 0, 0); r.maskT = fr; r.maskM = m;
    }
    cx.imageSmoothingEnabled = true;
    cx.drawImage(maskCv, 0, 0, 1920, 1080);                         // where it has frozen so far
    cx.globalCompositeOperation = 'source-in'; cx.drawImage(frostImg, 0, 0, 1920, 1080);
    cx.globalCompositeOperation = 'destination-over';                // a cold haze behind the crystals
    const h = cx.createRadialGradient(960, 540, 300, 960, 540, 1150);
    h.addColorStop(0, 'rgba(200,230,255,0)'); h.addColorStop(0.55, `rgba(205,232,255,${0.18 * m * Math.min(1, front)})`); h.addColorStop(1, `rgba(225,242,255,${0.55 * m * Math.min(1, front)})`);
    cx.fillStyle = h; cx.fillRect(0, 0, 1920, 1080);
    cx.globalCompositeOperation = 'source-over';
  }
  // the snow flurry, in front of everything
  if (!r.reduced) {
    if (t < SNOW_FOR) { r.spawn += dt * 115; while (r.spawn >= 1) { r.spawn--; r.flakes.push(newFlake(-60 - Math.random() * 60)); } }
    const fade = t > end - 0.4 ? Math.max(0, (end + 0.5 - t) / 0.9) : 1;
    for (const f of r.flakes) {
      f.y += f.vy * dt; f.sw += dt * 1.6; f.x += (f.vx + Math.sin(f.sw) * 40) * dt; f.rot += f.vr * dt;
      cx.globalAlpha = f.a * fade;
      if (f.star) { cx.save(); cx.translate(f.x, f.y); cx.rotate(f.rot); cx.drawImage(flakeSpr, -f.r, -f.r, f.r * 2, f.r * 2); cx.restore(); }
      else cx.drawImage(dotSpr, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    }
    cx.globalAlpha = 1;
    r.flakes = r.flakes.filter((f) => f.y < 1140);
  }
  if (t > end + 0.5 || (r.reduced && t > end)) { run = null; cx.clearRect(0, 0, 1920, 1080); cv.classList.remove('on'); if (r.text) r.text.classList.remove('on'); raf = 0; return; }
  raf = requestAnimationFrame(step);
}
