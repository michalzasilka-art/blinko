// Blinko — the peg board: building a board for a round, and the ball physics of one drop.
// Board units: 600 × 820. Pegs between y 110 and 690, pocket gates at y 736, pockets to the bottom.
// The physics and scoring follow the prototype exactly (same numbers), only the code is new.
import { CONFIG, BW, BH, slotX } from './data.js';

const lowS = (v, low) => (low ? Math.max(1, Math.round(v / CONFIG.scoring.lowScoreDivisor)) : v);
export const shuffle = (a, rng = Math.random) => { const n = [...a]; for (let i = n.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [n[i], n[j]] = [n[j], n[i]]; } return n; };
export const pocketCount = (round) => Math.min(CONFIG.scoring.pocketsMax, CONFIG.scoring.pocketsStart + Math.max(0, round - 1));

// a new board for this round (it gets taller, wider-pocketed and trickier each round)
export function makeBoard(round, { spikes = true, lowScore = false, rng = Math.random } = {}) {
  const rows = Math.min(CONFIG.board.rowsMax, CONFIG.board.rowsStart + round - 1);
  const gap = 580 / (rows - 1);
  const missing = round > 1 ? Math.min(0.2, 0.05 * round) : 0;
  const pSpike = spikes && round >= 2 ? Math.min(0.12, 0.03 * round) : 0;
  const pGold = Math.min(0.15, 0.05 + 0.02 * round);
  const pVanish = Math.min(0.3, 0.15 + 0.03 * round);
  const pMint = 0.18;
  const pegs = []; let id = 1;
  for (let r = 0; r < rows; r++) {
    const even = r % 2 === 0, n = even ? 9 : 8;
    for (let c = 0; c < n; c++) {
      if (rng() < missing) continue;
      const x = (even ? 60 : 90) + c * 60, y = 110 + r * gap, u = rng();
      let kind = 'normal';
      if (u < pSpike) kind = 'spike';
      else if (u < pSpike + pGold) kind = 'gold';
      else if (u < pSpike + pGold + pMint) kind = 'mint';
      else if (u < pSpike + pGold + pMint + pVanish) kind = 'vanish';
      const pts = kind === 'spike' ? CONFIG.scoring.spikePenalty : CONFIG.scoring.peg[kind];
      pegs.push({ id: id++, x, y, r: kind === 'spike' ? 9 : 8, kind, points: lowS(pts, lowScore), alive: true, scored: false, flash: 0, row: r });
    }
  }
  const pc = pocketCount(round);
  const pockets = shuffle(CONFIG.scoring.pockets.slice(0, pc), rng).map((v) => ({ value: lowS(v, lowScore), stars: Math.min(3, Math.floor(rng() * rng() * 4)) }));
  if (!pockets.some((p) => p.stars > 0)) pockets[Math.floor(rng() * pc)].stars = 1 + Math.floor(rng() * 2);
  return { round, rows, pegs, pockets };
}

// one drop on one board
export class Drop {
  constructor(board, opts) {
    this.board = board; this.o = opts; this.rng = opts.rng || Math.random;
    this.balls = []; this.floats = []; this.effects = []; this.coins = []; this.particles = [];
    this.time = 0; this.turnScore = 0; this.pegScore = 0; this.pocketScore = 0; this.coinScore = 0; this.attackTotal = 0;
    this.started = false; this.done = false; this.shieldUsed = false; this.timedOut = false;
    this.pocketsHit = []; this.starsEarned = 0; this.pegsHit = 0;
    this.gates = board.pockets.map(() => ({ open: false, openT: 0, hitT: -1 }));
    this.bumper = opts.movingBumper ? { x: BW / 2, y: 660, r: 18 } : null;
    this.sideBumpers = []; this.barricades = []; this.cool = new Map();
    this.lastProgress = 0; this.gatesForced = false; this.endTimer = 0; this.nextId = 1;
    this.lasers = 0; this.splashes = 0; this.zombies = 0; this.coinCount = 0;
    this.shake = 0;
    this.buildSides();
  }
  sound(name, v) { this.o.sound && this.o.sound(name, v); }
  buildSides() {
    const ys = [...new Set(this.board.pegs.map((p) => Math.round(p.y)))].sort((a, b) => a - b);
    if (ys.length < 4) return;
    const gap = ys[1] - ys[0];
    ys.forEach((y, i) => { if (i % 2 === 0 || i >= ys.length - 1) return; const left = (i - 1) % 4 === 0; this.sideBumpers.push({ x: left ? 19 : 581, y, r: 15, hitT: -1, tone: left ? 'purple' : 'orange' }); });
    this.sideBumpers.forEach((b, i) => {
      if (i === this.sideBumpers.length - 1) return;
      const left = b.x < BW / 2, y = b.y + gap * 2; if (y > 670) return;
      const x = left ? 12 : 588;
      this.barricades.push({ x1: x, y1: y - 9, x2: x + (left ? 24 : -24), y2: y + 7, r: 6, hitT: -1 });
    });
  }
  cooled(k) { const t = this.cool.get(k); if (t !== undefined && this.time - t < 0.08) return false; this.cool.set(k, this.time); return true; }
  react(b, nx, ny, sp) { if (sp < 170) return; b.impact = Math.max(b.impact || 0, Math.min(1, (sp - 100) / 320)); b.impactAngle = Math.atan2(ny, nx); }
  get dividers() { const n = this.board.pockets.length; return Array.from({ length: n - 1 }, (_, i) => ((i + 1) * BW) / n); }
  s(v) { return lowS(v, this.o.lowScore); }
  burst(x, y, color, n, sp = 160) {
    if (this.particles.length > 160) return;
    for (let i = 0; i < n; i++) { const a = this.rng() * Math.PI * 2, v = sp * (0.4 + this.rng() * 0.8); this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: 0.45 + this.rng() * 0.3, color, size: 2 + this.rng() * 2.5 }); }
  }
  openGate(i) { const g = this.gates[i]; if (!g || g.open) return; g.open = true; g.openT = 0; this.sound('gate'); }
  spawn(kind, x, y, extra = {}) {
    if (this.balls.filter((b) => !b.removed).length >= CONFIG.physics.maxBalls) return null;
    const b = { id: this.nextId++, kind, x, y, vx: (this.rng() - 0.5) * 40, vy: 0, r: 11, rest: CONFIG.physics.restitution, grav: 1, heavy: false, age: 0, hits: 0, still: 0, nudges: 0, pocketMul: 1, canPocket: true, state: 'fall', startX: x, descents: 0, maxDescents: 1, trail: [], rot: 0, impact: 0, impactAngle: 0, ...extra };
    this.balls.push(b); return b;
  }
  release(slot) {
    if (this.started) return false;
    this.started = true; this.slot = slot;
    const x = slotX(slot), p = this.o.powerUp;
    this.sound('whoosh');
    switch (p) {
      case 'dynamite': this.spawn('dynamite', x, 30, { r: 12 }); break;
      case 'yoyo': this.spawn('yoyo', x, 30, { maxDescents: 2 }); break;
      case 'bouncy': this.spawn('bouncy', x, 30, { rest: 0.95 }); break;
      case 'egg': this.spawn('egg', x, 30, { r: 13, rest: 0.35 }); break;
      case 'turtle': this.spawn('turtle', x, 30, { r: 12, rest: 0.85 }); break;
      case 'cow': this.spawn('cow', x, 30, { r: 13 }); break;
      case 'balloon': this.spawn('balloon', x, 30, { r: 14, grav: 0.28, rest: 0.8, boosts: 10 }); break;
      case 'puffer': this.spawn('puffer', x, 30, { r: 9 }); break;
      case 'oinky': this.spawn('oinky', x, 30, { r: 13 }); break;
      case 'shark': this.spawn('shark', x, 30, { r: 12, lastShot: 0 }); break;
      case 'yinyang': { const x2 = slotX(9 - slot); this.spawn('yin', x, 30); this.spawn('yang', x2 === x ? x + 20 : x2, 30); break; }
      case 'popcorn': this.spawn('popcorn', x, 30, { r: 12 }); break;
      case 'bowling': this.spawn('bowling', x, 30, { r: 15, heavy: true, rest: 0.25 }); break;
      case 'zombie': this.spawn('zombie', x, 30, { r: 12 }); break;
      default: this.spawn('normal', x, 30);
    }
    return true;
  }
  add(v, x, y, tone, text, src = 'peg') {
    if (v === 0 && !text) return;
    this.turnScore += v;
    if (src === 'peg') this.pegScore += v; else if (src === 'pocket') this.pocketScore += v; else if (src === 'coin') this.coinScore += v;
    this.floats.push({ x, y, t: 0, tone: tone || (v < 0 ? 'bad' : 'good'), text: text || (v > 0 ? `+${v}` : `${v}`), big: src === 'pocket' });
  }
  step(dt) {
    if (!this.started) return;
    if (!this.done) { const n = Math.max(1, Math.min(10, Math.ceil(dt / (1 / 240)))); for (let i = 0; i < n; i++) this.tick(dt / n); }
    for (const f of this.floats) f.t += dt;
    for (const e of this.effects) e.t += dt;
    for (const c of this.coins) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 300 * dt; }
    for (const p of this.board.pegs) p.flash = Math.max(0, p.flash - dt * 3);
    for (const b of this.sideBumpers) if (b.hitT >= 0) b.hitT += dt;
    for (const b of this.barricades) if (b.hitT >= 0) b.hitT += dt;
    for (const g of this.gates) { if (g.open) g.openT += dt; if (g.hitT >= 0) g.hitT += dt; }
    for (const p of this.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; }
    this.particles = this.particles.filter((p) => p.t < p.life);
    this.floats = this.floats.filter((f) => f.t < (f.big ? 1.6 : 1.1));
    this.effects = this.effects.filter((e) => e.t < (e.kind === 'starfly' ? 1.1 : 0.7));
    this.coins = this.coins.filter((c) => c.t < 0.9);
    this.shake = Math.max(0, this.shake - dt * 2.5);
  }
  tick(dt) {
    const P = CONFIG.physics;
    this.time += dt;
    if (this.bumper) this.bumper.x = BW / 2 + Math.sin(this.time * 0.7) * 210;
    for (const b of this.balls) {
      if (b.removed) continue;
      if (b.state === 'reel' && b.reel) {
        b.reel.t += dt / 0.9; const t = Math.min(1, b.reel.t), e = 1 - (1 - t) * (1 - t);
        b.x = b.reel.fromX + (b.reel.toX - b.reel.fromX) * e; b.y = b.reel.fromY + (30 - b.reel.fromY) * e;
        if (t >= 1) { b.state = 'fall'; b.vx = (this.rng() - 0.5) * 60; b.vy = 0; b.trail = []; b.bestY = undefined; }
        continue;
      }
      b.age += dt; b.impact = Math.max(0, (b.impact || 0) - dt * 5.5);
      if (b.life !== undefined) { b.life -= dt; if (b.life <= 0) { b.removed = true; continue; } }
      this.perTick(b, dt); if (b.removed) continue;
      b.vy += P.gravity * b.grav * dt;
      const sp = Math.hypot(b.vx, b.vy); if (sp > P.maxSpeed) { b.vx *= P.maxSpeed / sp; b.vy *= P.maxSpeed / sp; }
      const px = b.x;
      b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vx * dt * 0.05;
      if (b.x < 12 + b.r) { b.x = 12 + b.r; b.vx = Math.abs(b.vx) * P.wallRestitution; }
      if (b.x > 588 - b.r) { b.x = 588 - b.r; b.vx = -Math.abs(b.vx) * P.wallRestitution; }
      if (b.y < 12 + b.r) { b.y = 12 + b.r; b.vy = Math.abs(b.vy) * b.rest; }
      if (this.bumper) {
        const m = this.bumper, dx = b.x - m.x, dy = b.y - m.y, rr = b.r + m.r;
        if (dx * dx + dy * dy < rr * rr) {
          const d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
          b.x = m.x + nx * rr; b.y = m.y + ny * rr;
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) { this.react(b, nx, ny, -vn); b.vx -= 1.9 * vn * nx; b.vy -= 1.9 * vn * ny; m.hitT = 0; this.burst(b.x - nx * b.r, b.y - ny * b.r, '#ffffff', 5); this.sound('bump', 0.2); }
        }
      }
      this.collidePegs(b); if (b.removed) continue;
      this.collideSides(b);
      for (const dx0 of this.dividers) {
        const dx = b.x - dx0, dy = b.y - 730, rr = b.r + 5;
        if (dy < 0 && dx * dx + dy * dy < rr * rr) {
          const d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
          b.x = dx0 + nx * rr; b.y = 730 + ny * rr;
          const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= 1.5 * vn * nx; b.vy -= 1.5 * vn * ny; }
          if (Math.abs(dx) < 1) b.vx += this.rng() < 0.5 ? -40 : 40;
        } else if (b.y > 730 && Math.abs(b.x - dx0) < b.r) { b.x = dx0 + (px < dx0 ? -1 : 1) * b.r; b.vx = -b.vx * 0.5; }
      }
      if (b.canPocket && b.vy > 0 && b.y + b.r > 736 && b.y - b.vy * dt + b.r <= 738) {
        const n = this.gates.length, i = Math.max(0, Math.min(n - 1, Math.floor(b.x / (BW / n)))), g = this.gates[i];
        if (!g.open) {
          this.react(b, 0, -1, b.vy); b.y = 736 - b.r;
          const spring = this.o.springGates && !this.gates.some((q) => q.open || q.hitT >= 0);
          b.vy = spring ? -Math.max(560, Math.abs(b.vy) * 1.1) : -Math.max(140, Math.abs(b.vy) * 0.6);
          b.vx += (this.rng() - 0.5) * 80; g.hitT = 0;
          this.burst(b.x, 736, '#ffd166', 8); this.sound(spring ? 'boing' : 'gatehit', 0.1);
          this.lastProgress = this.time; this.openGate(i);
          if (spring) this.floats.push({ x: b.x, y: 700, text: 'Boing!', tone: 'info', t: 0 });
        }
      }
      if (b.y > BH - b.r - 2) { if (b.canPocket) this.land(b); else b.removed = true; continue; }
      if (b.bestY === undefined || b.y > b.bestY + 6) { b.bestY = b.y; b.bestT = b.age; }
      const stuck = b.grav >= 0.5 && b.age - (b.bestT || 0) > 2.2;
      if (stuck) { b.bestT = b.age; b.still = P.stuckSeconds + 1; }
      if (stuck || Math.hypot(b.vx, b.vy) < P.stuckSpeed) {
        b.still += dt;
        if (b.still > P.stuckSeconds) { b.still = 0; b.nudges++; b.vx = (this.rng() < 0.5 ? -1 : 1) * (140 + b.nudges * 30); b.vy = -120; }
      } else b.still = 0;
      if (Math.round(this.time * 240) % 4 === 0) { b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > (b.kind === 'balloon' ? 28 : 12)) b.trail.shift(); }
    }
    this.balls = this.balls.filter((b) => !b.removed);
    if (!this.gatesForced && this.balls.length && this.time - this.lastProgress > 6) {
      this.gatesForced = true; this.gates.forEach((_, i) => this.openGate(i));
      for (const b of this.balls) { b.vy = Math.max(b.vy, 60); b.vx *= 0.5; }
      this.floats.push({ x: BW / 2, y: 690, text: 'Gates open!', tone: 'info', t: 0 });
    }
    if (!this.timedOut && this.time > P.maxTurnSeconds) this.resolveTimeout();
    if (this.balls.length === 0) { this.endTimer += dt; if (this.endTimer > 0.9) this.done = true; }
  }
  collideSides(b) {
    for (let i = 0; i < this.sideBumpers.length; i++) {
      const s = this.sideBumpers[i], dx = b.x - s.x, dy = b.y - s.y, rr = b.r + s.r;
      if (dx * dx + dy * dy >= rr * rr) continue;
      const d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
      b.x = s.x + nx * rr; b.y = s.y + ny * rr;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        this.react(b, nx, ny, -vn);
        const out = Math.min(380, Math.max(200, -vn * 0.85));
        b.vx += (-vn + out) * nx; b.vy += (-vn + out) * ny;
        const vt = b.vx * -ny + b.vy * nx;
        if (Math.abs(vt) > 420) { const k = 420 / Math.abs(vt); b.vx = out * nx + vt * k * -ny; b.vy = out * ny + vt * k * nx; }
        if (this.cooled(`b${i}-${b.id}`)) { s.hitT = 0; this.burst(s.x + nx * s.r, s.y + ny * s.r, s.tone === 'purple' ? '#c7a6ff' : '#ffc58a', 5); this.sound('bump', 0.15); }
      }
    }
    for (let i = 0; i < this.barricades.length; i++) {
      const r = this.barricades[i], ex = r.x2 - r.x1, ey = r.y2 - r.y1;
      const t = Math.max(0, Math.min(1, ((b.x - r.x1) * ex + (b.y - r.y1) * ey) / (ex * ex + ey * ey)));
      const cx = r.x1 + ex * t, cy = r.y1 + ey * t, dx = b.x - cx, dy = b.y - cy, rr = b.r + r.r;
      if (dx * dx + dy * dy >= rr * rr) continue;
      const d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
      b.x = cx + nx * rr; b.y = cy + ny * rr;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        this.react(b, nx, ny, -vn); b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny; b.vx += (r.x2 > r.x1 ? 1 : -1) * 40;
        if (this.cooled(`r${i}-${b.id}`)) { r.hitT = 0; this.burst(cx, cy, '#ffd166', 4, 120); this.sound('peg', 0.3); }
      }
    }
  }
  resolveTimeout() {
    this.timedOut = true;
    this.floats.push({ x: BW / 2, y: BH / 2, text: 'Time! Straight down', tone: 'info', t: 0 });
    this.gates.forEach((_, i) => this.openGate(i));
    for (const b of this.balls) { b.maxDescents = b.descents + 1; if (b.canPocket) this.land(b, true); b.removed = true; }
    this.balls = [];
  }
  land(b, forced = false) {
    const n = this.board.pockets.length, i = Math.max(0, Math.min(n - 1, Math.floor(b.x / (BW / n))));
    const v = Math.round(this.board.pockets[i].value * b.pocketMul * (this.o.pocketMultiplier || 1));
    this.pocketsHit.push(i); this.lastProgress = this.time; this.openGate(i);
    const cx = (i + 0.5) * (BW / n), stars = b.pocketMul >= 1 ? this.board.pockets[i].stars : 0;
    if (stars > 0) {
      this.starsEarned += stars;
      this.floats.push({ x: b.x, y: 712, text: '★'.repeat(stars), tone: 'star', t: 0 });
      for (let k = 0; k < stars; k++) this.effects.push({ kind: 'starfly', x: cx + (k - (stars - 1) / 2) * 18, y: 788, t: -k * 0.12 });
      this.sound('star');
    }
    this.burst(cx, 760, '#ffd166', 16, 280); this.burst(cx, 760, '#ff7ac8', 10, 240);
    this.add(v, b.x, 760, 'gold', `+${v}`, 'pocket');
    this.effects.push({ kind: 'pocket', x: cx, y: 780, t: 0, p: i });
    this.sound('land', v);
    this.shake = Math.min(1, 0.25 + v / 600);
    if (!forced && b.descents + 1 < b.maxDescents) {
      b.descents++; b.state = 'reel'; b.reel = { fromX: b.x, fromY: b.y, toX: b.startX, t: 0 }; b.vx = 0; b.vy = 0;
      for (const p of this.board.pegs) if (p.alive && p.kind !== 'spike') p.scored = false;
      this.floats.push({ x: b.x, y: b.y - 40, text: 'Reel it in!', tone: 'info', t: 0 });
    } else b.removed = true;
  }
  collidePegs(b) {
    for (const p of this.board.pegs) {
      if (!p.alive) continue;
      const dx = b.x - p.x, dy = b.y - p.y, rr = b.r + p.r, d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) continue;
      const d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d;
      if (b.heavy) { this.hitPeg(b, p); p.alive = false; b.vx += nx * 25; b.vx *= 0.97; b.vy *= 0.96; this.effects.push({ kind: 'pop', x: p.x, y: p.y, t: 0, c: p.kind }); continue; }
      b.x = p.x + nx * rr; b.y = p.y + ny * rr;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        this.react(b, nx, ny, -vn);
        b.vx -= (1 + b.rest) * vn * nx; b.vy -= (1 + b.rest) * vn * ny; b.vx += (this.rng() - 0.5) * 30;
        this.hitPeg(b, p); if (b.removed) return;
      }
    }
  }
  hitPeg(b, p) {
    b.hits++;
    if (!p.scored) this.lastProgress = this.time;
    this.burst(p.x, p.y, PEG_SPARK[p.kind], p.scored ? 2 : 7);
    p.flash = 1;
    if (p.kind === 'spike') {
      if (!p.scored) {
        p.scored = true;
        if (this.o.shield && !this.shieldUsed) { this.shieldUsed = true; this.floats.push({ x: p.x, y: p.y - 14, text: 'Shield!', tone: 'info', t: 0 }); this.sound('shield'); }
        else { this.add(-p.points, p.x, p.y - 14, 'bad'); this.sound('spike'); this.shake = Math.max(this.shake, 0.35); }
      }
    } else {
      if (!p.scored) { p.scored = true; this.pegsHit++; this.add(p.points, p.x, p.y - 14, p.kind === 'gold' ? 'gold' : 'good'); }
      this.sound('peg', { row: p.row, kind: p.kind });
    }
    if (p.kind === 'vanish') { p.alive = false; this.effects.push({ kind: 'pop', x: p.x, y: p.y, t: 0, c: 'vanish' }); this.sound('bubble'); }
    this.onHit(b, p);
  }
  awardPeg(p) {
    if (!p.scored && p.kind !== 'spike') { this.pegsHit++; this.add(p.points, p.x, p.y - 14, p.kind === 'gold' ? 'gold' : 'good'); }
    p.scored = true; p.alive = false; this.effects.push({ kind: 'pop', x: p.x, y: p.y, t: 0, c: p.kind });
  }
  onHit(b, p) {
    const S = CONFIG.scoring;
    switch (b.kind) {
      case 'milk': b.removed = true; break;
      case 'dynamite': if (b.fuse === undefined) { b.fuse = 1; this.sound('fuse'); } break;
      case 'egg': this.crack(b); break;
      case 'popcorn': if (b.age > 0.2) this.pop(b); break;
      case 'turtle': {
        const v = this.s(S.turtleAttack), cap = this.s(S.turtleAttackCap);
        if (this.attackTotal + v <= cap) { this.attackTotal += v; this.floats.push({ x: p.x + 18, y: p.y - 28, text: `−${v} rivals`, tone: 'bad', t: 0 }); }
        break;
      }
      case 'cow':
        if (this.splashes < 6) {
          this.splashes++; this.effects.push({ kind: 'splash', x: p.x, y: p.y, t: 0 }); this.sound('splash');
          for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * 0.9 + (this.rng() - 0.5) * 0.3; this.spawn('milk', b.x, b.y, { r: 5, life: 0.8, canPocket: false, grav: 0.6, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 }); }
        }
        break;
      case 'oinky':
        if (this.coinCount < 15) {
          this.coinCount++; this.coins.push({ x: p.x, y: p.y, vx: (this.rng() - 0.5) * 80, vy: -220, t: 0 });
          const v = this.s(S.coinValue); this.add(v, p.x - 16, p.y - 30, 'coin', `+${v}`, 'coin'); this.sound('coin');
        }
        break;
      case 'zombie':
        if (b.hits % 2 === 0 && this.zombies < 4 && this.spawn('minizombie', b.x, b.y, { r: 7, pocketMul: 0.25, vx: (this.rng() - 0.5) * 260, vy: -160 })) {
          this.zombies++; this.floats.push({ x: b.x, y: b.y - 20, text: 'Braaains!', tone: 'info', t: 0 }); this.sound('zombie');
        }
        break;
      case 'balloon': if ((b.boosts || 0) > 0) { b.boosts--; b.vy = Math.min(b.vy, -170); } break;
    }
  }
  perTick(b, dt) {
    if (b.kind === 'puffer') b.r = Math.max(9, Math.min(21 - b.nudges * 4, 9 + b.age * 5));
    if (b.kind === 'dynamite' && b.fuse !== undefined && !b.exploded) { b.fuse -= dt; if (b.fuse <= 0) this.explode(b); }
    if (b.kind === 'dynamite' && b.fuse === undefined && b.age > 2.5) b.fuse = 0.4;
    if (b.kind === 'egg' && b.age > 1.6) this.crack(b);
    if (b.kind === 'popcorn' && b.age > 1.3) this.pop(b);
    if (b.kind === 'shark' && this.lasers < 8 && b.age - (b.lastShot || 0) > 0.45 && b.age > 0.3) {
      let best = null, bd = 67600;
      for (const p of this.board.pegs) { if (!p.alive) continue; const d = (p.x - b.x) ** 2 + (p.y - b.y) ** 2; if (d < bd && p.y > b.y - 40) { bd = d; best = p; } }
      b.lastShot = b.age;
      if (best) { this.lasers++; this.effects.push({ kind: 'laser', x: b.x, y: b.y, x2: best.x, y2: best.y, t: 0 }); this.sound('laser'); this.awardPeg(best); }
    }
  }
  explode(b) {
    b.exploded = true; b.kind = 'spent';
    this.effects.push({ kind: 'boom', x: b.x, y: b.y, t: 0, r: 115 }); this.sound('boom'); this.shake = 1;
    for (const p of this.board.pegs) if (p.alive && (p.x - b.x) ** 2 + (p.y - b.y) ** 2 < 13225) this.awardPeg(p);
    b.vy = Math.min(b.vy, -100);
  }
  crack(b) {
    if (b.removed) return;
    b.removed = true; this.effects.push({ kind: 'crack', x: b.x, y: b.y, t: 0 }); this.sound('pop');
    this.spawn('chick', b.x, b.y, { r: 10, rest: 0.8, vx: b.vx, vy: -180 });
    this.spawn('shell', b.x - 6, b.y, { r: 6, rest: 0.6, pocketMul: 0.5, vx: -160, vy: -120 });
    this.spawn('shell', b.x + 6, b.y, { r: 6, rest: 0.6, pocketMul: 0.5, vx: 160, vy: -120, flip: true });
    this.floats.push({ x: b.x, y: b.y - 24, text: 'Crack!', tone: 'info', t: 0 });
  }
  pop(b) {
    if (b.removed) return;
    b.removed = true; this.effects.push({ kind: 'crack', x: b.x, y: b.y, t: 0 }); this.sound('pop');
    for (let k = 0; k < 5; k++) { const a = -Math.PI + (k / 4) * Math.PI; this.spawn('kernel', b.x, b.y, { r: 6, rest: 0.75, pocketMul: 0.3, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220 - 60 }); }
    this.floats.push({ x: b.x, y: b.y - 24, text: 'POP!', tone: 'info', t: 0 });
  }
  result() {
    return { score: this.turnScore, pegScore: this.pegScore, pocketScore: this.pocketScore, coinScore: this.coinScore, attack: this.attackTotal, shieldUsed: this.shieldUsed, pockets: this.pocketsHit, timedOut: this.timedOut, stars: this.starsEarned, pegsHit: this.pegsHit };
  }
}
export const PEG_SPARK = { normal: '#9cc2ff', mint: '#7dffd6', gold: '#ffe27a', vanish: '#ffb3e6', spike: '#ff6b7a' };
