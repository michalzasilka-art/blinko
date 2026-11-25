// Blinko — the game: setup, teams, the turn flow, the panels and the final podium.
// The turn flow is the prototype's ("Foxino Drop"): answer → (stars unlock power-up cards) → pick a release spot → drop → score.
import { CONFIG, SETS, POWERS, PEGS, CREW, TEAM_COLORS, TEAM_NAMES, TEAM_CREW, crewURL, powerById, THEME, WORDS } from './data.js';
import { makeBoard, Drop, shuffle } from './engine.js';
import { BoardView, powerIcon, pegIcon, ballKind, loadArt, artList, artURL, META, COOKIE, cookieURL } from './art.js';
import { sfx, unlock, setMuted, isMuted } from './sound.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Christmas: the reindeer, the elf and the snowman host instead of Hazel; candy on the setup screen
const XMAS_FRIENDS = THEME === 'xmas' && !!META.sprites['reindeer-happy'];
const ART_SWAP = XMAS_FRIENDS ? { 'squirrel-hold': 'trio-hold', 'pu-turtle': 'deco-gingerbread', 'nut-wheee': 'cookie-wheee' } : {};
document.querySelectorAll('img[data-art]').forEach((im) => { im.src = artURL(ART_SWAP[im.dataset.art] || im.dataset.art); });
if (THEME === 'xmas') { const tl = document.querySelector('#scr-setup .tagline'); if (tl) tl.textContent = 'Answer · Power up · Drop the cookie!'; }
// candy along the top of the board (Christmas): a candy cane, a heap of sweets and a lollipop sit on the frame, never over the pegs
if (XMAS_FRIENDS) document.querySelector('.board-wrap').insertAdjacentHTML('beforebegin', ['cane', 'candies', 'lollipop'].map((d) => `<img class="deco deco-${d}" src="${artURL('deco-' + d)}" alt="" onerror="this.remove()">`).join(''));
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------ settings + teams (remembered) */
const DEFAULTS = { setId: SETS[0].id, teamCount: 4, rounds: 4, timeLimit: 0, mode: 'turn', spikes: true, lowScore: false, repeat: true, springGates: true, movingBumper: true, powers: Object.fromEntries(POWERS.map((p) => [p.id, true])) };
const settings = { ...DEFAULTS, ...store.get('blinko.settings', {}) };
settings.powers = { ...DEFAULTS.powers, ...(settings.powers || {}) };
const teamsSetup = store.get('blinko.teams', null) || TEAM_NAMES.map((name, i) => ({ name, color: TEAM_COLORS[i], crew: TEAM_CREW[i] }));
const save = () => { store.set('blinko.settings', settings); store.set('blinko.teams', teamsSetup); };
setMuted(store.get('blinko.muted', false));

/* ------------------------------------------------------------ stage scaling (16:9, letterboxed) */
const stage = $('#stage');
let scale = 1;
function fit() {
  scale = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transformOrigin = '0 0';
  stage.style.transform = `translate(${(innerWidth - 1920 * scale) / 2 - innerWidth / 2}px, ${(innerHeight - 1080 * scale) / 2 - innerHeight / 2}px) scale(${scale})`;
  view && view.setSize(748, 990, scale * (devicePixelRatio || 1));
}
addEventListener('resize', fit);
/* ------------------------------------------------------------ screens */
let screen = 'setup';
function show(id) {
  screen = id;
  $$('.screen').forEach((s) => s.classList.toggle('on', s.id === 'scr-' + id));
  if (id === 'setup') renderSetup();
  if (id === 'teams') renderTeams();
}

/* ------------------------------------------------------------ setup screen */
function seg(name, opts, val, cls = '') {
  return `<div class="seg ${cls}" data-seg="${name}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
}
function tog(name, label) { return `<button class="tog ${settings[name] ? 'on' : ''}" data-tog="${name}"><span>${label}</span><i class="sw"></i></button>`; }
function renderSetup() {
  $('#setupMain').innerHTML = `
    <div class="field wide"><label>Question set</label><div class="sets">${SETS.map((s) => `<button class="set ${s.id === settings.setId ? 'on' : ''}" data-set="${s.id}"><span class="em">${qPic(s, 'qp-set')}</span><span><b>${esc(s.title)}</b><small>${s.subject} · ${s.level} · ${s.questions.length} questions</small></span></button>`).join('')}</div></div>
    <div class="field"><label>Teams</label>${seg('teamCount', [2, 3, 4, 5, 6, 7, 8].map((n) => [n, n]), settings.teamCount)}</div>
    <div class="field"><label>Rounds</label>${seg('rounds', [1, 2, 3, 4, 5, 6, 8].map((n) => [n, n]), settings.rounds)}</div>
    <div class="field"><label>Time to answer</label>${seg('timeLimit', [[0, 'Off'], [20, '20 s'], [30, '30 s'], [60, '60 s']], settings.timeLimit)}</div>
    <div class="field"><label>Mode</label>${seg('mode', [['turn', 'Team turns'], ['class', 'Everyone answers']], settings.mode, 'text')}</div>
    <div class="field wide"><label>Board extras</label><div class="toggles">
      ${tog('spikes', WORDS.spikes)}${tog('springGates', 'Spring gates')}${tog('movingBumper', WORDS.bumper)}
      ${tog('repeat', 'Repeat questions')}${tog('lowScore', 'Small numbers')}
    </div></div>`;
  $('#powerGrid').innerHTML = POWERS.map((p) => `<button class="pw ${settings.powers[p.id] ? '' : 'off'} ${p.extra ? 'extra' : ''}" data-pw="${p.id}" title="${esc(p.blurb)}"><img src="${powerIcon(p.id, 168)}" alt=""><span>${esc(p.name)}</span></button>`).join('');
}
$('#scr-setup').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  unlock();
  const sg = b.closest('[data-seg]');
  if (sg && b.dataset.v !== undefined) { const k = sg.dataset.seg, v = b.dataset.v; settings[k] = isNaN(+v) ? v : +v; sfx('select'); }
  else if (b.dataset.set) { settings.setId = b.dataset.set; sfx('select'); }
  else if (b.dataset.tog) { settings[b.dataset.tog] = !settings[b.dataset.tog]; sfx('click'); }
  else if (b.dataset.pw) { const id = b.dataset.pw; settings.powers[id] = !settings.powers[id]; sfx(settings.powers[id] ? 'select' : 'click'); }
  else return;
  save(); renderSetup();
});

/* ------------------------------------------------------------ teams screen */
function renderTeams() {
  const n = settings.teamCount, grid = $('#teamGrid');
  grid.className = 'team-grid n' + n;
  grid.style.gridTemplateColumns = `repeat(${n <= 4 ? n : Math.ceil(n / 2)}, minmax(0, 1fr))`;
  grid.innerHTML = teamsSetup.slice(0, n).map((t, i) => `
    <div class="tcard" style="--c:${t.color};animation-delay:${i * 0.06}s" data-i="${i}">
      <button class="pic" data-crew="${i}" style="background-image:url(${crewURL(t.crew)})" aria-label="Change picture"></button>
      <input value="${esc(t.name)}" maxlength="18" data-name="${i}" aria-label="Team name">
      <div class="dots">${TEAM_COLORS.map((c) => `<button data-col="${i}" data-c="${c}" class="${c === t.color ? 'on' : ''}" style="background:${c}" aria-label="Colour"></button>`).join('')}</div>
    </div>`).join('');
}
$('#teamGrid').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.crew !== undefined) {
    const t = teamsSetup[+b.dataset.crew], used = teamsSetup.slice(0, settings.teamCount).map((x) => x.crew);
    let i = CREW.findIndex((c) => c.id === t.crew);
    for (let k = 0; k < CREW.length; k++) { i = (i + 1) % CREW.length; if (!used.includes(CREW[i].id)) break; }
    t.crew = CREW[i].id; sfx('flip');
  } else if (b.dataset.col !== undefined) { teamsSetup[+b.dataset.col].color = b.dataset.c; sfx('select'); }
  else return;
  save(); renderTeams();
});
$('#teamGrid').addEventListener('input', (e) => { const i = e.target.dataset.name; if (i !== undefined) { teamsSetup[+i].name = e.target.value; save(); } });
$('#teamGrid').addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });

/* ------------------------------------------------------------ the game state (the prototype's rules) */
let g = null;           // game state
let drop = null;        // the drop running on the board
let practice = null;    // practice drop state
let paused = false;
const view = new BoardView($('#board'));
fit();

const enabledPowers = () => POWERS.filter((p) => settings.powers[p.id]).map((p) => p.id);
const team = () => g.teams[g.turn];
const teamImg = (t) => crewURL(t.crew);
// Hazel the squirrel and the team's acorn (painted faces, art/squirrel-<pose>.webp and art/nut-<mood>.webp)
const hazel = (pose) => artURL('squirrel-' + pose);
const nutPic = (mood) => artURL('nut-' + mood);
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
// the team's ball for the panels: at Christmas its cookie (icing in the team's colour), else the acorn in a ring of the team's colour
const nutBall = (t, mood = 'happy', cls = 'ball nut') => {
  const u = COOKIE && cookieURL(mood, t.color);
  return u ? `<span class="${cls} cookie" style="--c:${t.color}"><img src="${u}" alt=""></span>` : `<span class="${cls}" style="--c:${t.color}"><img src="${nutPic(mood)}" alt=""></span>`;
};
// who shows how an answer felt: Hazel, or at Christmas the reindeer, the elf or the snowman (sad when it was wrong)
const FRIENDS = ['reindeer', 'elf', 'snowman'];
let lastFriend = '';
const friendPic = (right) => {
  if (!XMAS_FRIENDS) return hazel(right ? 'cheer' : 'oops');
  const who = pickOne(FRIENDS.filter((f) => f !== lastFriend)); lastFriend = who;
  return artURL(who + (right ? '-happy' : '-sad'));
};
// how a turn's score feels
const scoreMood = (v) => (v >= 150 ? 'love' : v >= 60 ? 'cheer' : v > 0 ? 'happy' : 'sad');

/* Hazel and the acorn show how they feel about an answer: a short moment over the board while the game carries on */
let feelT = 0;
function feel(right, t) {
  const el = $('#feel'); if (!el) return;
  el.style.setProperty('--c', t ? t.color : '#ffb43a');
  el.className = 'feel ' + (right ? 'yay' : 'aww');
  el.innerHTML = `<div class="say">${right ? pickOne(WORDS.yay) : pickOne(WORDS.aww)}</div>
    <img class="hz${XMAS_FRIENDS ? ' friend' : ''}" src="${friendPic(right)}" alt=""><span class="nutpop">${nutBall(t || { color: '#ffb43a' }, right ? 'cheer' : 'sad', 'ball nut big')}</span>`;
  void el.offsetWidth; el.classList.add('on');
  if (right && THEME === 'xmas') sfx('jingle');
  if (right && !reduced) leafBurst(960, 560, 70);
  clearTimeout(feelT); feelT = setTimeout(() => el.classList.remove('on'), right ? 2000 : 1800);
}
const set = () => SETS.find((s) => s.id === settings.setId) || SETS[0];
const snap = () => { const { undo, ...rest } = g; return JSON.parse(JSON.stringify(rest)); };

function nextQuestion(force = false) {
  if (g.qPtr >= g.queue.length) {
    if (!settings.repeat && !force) { g.phase = 'final'; g.outOfQuestions = true; g.question = null; return; }
    g.queue = shuffle(g.queue); g.qPtr = 0;
  }
  g.question = g.queue[g.qPtr++]; g.revealed = false; g.clueStep = 0; g.phase = 'question'; g.marks = {}; g.qStart = performance.now();
  g.board = makeBoard(g.round, { spikes: settings.spikes, lowScore: settings.lowScore }); g.boardFresh = true; // the board you will drop on (shown while you answer)
}
function newGame() {
  const n = settings.teamCount;
  g = {
    totalRounds: settings.rounds, round: 1, turn: 0, phase: 'question', mode: settings.mode,
    teams: teamsSetup.slice(0, n).map((t, i) => ({ id: 't' + (i + 1), name: t.name.trim() || TEAM_NAMES[i], color: t.color, crew: t.crew, score: 0, xp: 0, correct: 0, answered: 0, shield: 0, stars: 0 })),
    queue: shuffle(set().questions), qPtr: 0, question: null, revealed: false, clueStep: 0, answers: [], offer: [], power: null, pocketMul: 1,
    board: null, slot: -1, lastResult: null, undo: null, outOfQuestions: false, classDrop: false, classRight: {}, marks: {},
  };
  shownScores = g.teams.map(() => 0);
  nextQuestion(true);
}
function record(i, correct, bonus = false) {
  const t = g.teams[i], q = g.question;
  t.answered++; if (correct) { t.correct++; t.xp += CONFIG.scoring.xpPerCorrect; }
  g.answers.push({ qid: q.id, prompt: q.prompt, answer: q.answer, teamId: t.id, correct, round: g.round, bonus });
}
function toAim() {
  g.phase = 'aim'; g.slot = -1; drop = null; g.aimAt = performance.now();
  if (!g.board || !g.boardFresh) g.board = makeBoard(g.round, { spikes: settings.spikes, lowScore: settings.lowScore });
  g.boardFresh = false;
}
function offerOrAim(eligible = true) {
  const en = enabledPowers(), n = Math.min(3, team().stars);
  if (eligible && en.length && n > 0) { team().stars = 0; g.phase = 'powerup'; g.offer = shuffle(en).slice(0, Math.min(n, en.length)); g.power = null; g.pocketMul = 1; return; }
  g.offer = []; g.power = null; g.pocketMul = 1; toAim();
}
function judge(correct) {
  if (g.phase !== 'question') return;
  g.undo = snap(); record(g.turn, correct); g.revealed = true;
  sfx(correct ? 'right' : 'wrong'); feel(correct, team());
  if (correct) offerOrAim(true); else g.phase = 'explain';
  render();
}
function judgeAll() {
  if (g.phase !== 'question' || g.teams.some((t) => typeof g.marks[t.id] !== 'boolean')) return;
  g.undo = snap(); g.revealed = true;
  g.teams.forEach((t, i) => record(i, g.marks[t.id]));
  g.classRight = { ...g.marks }; g.turn = 0; g.classDrop = true;
  sfx('start'); const any = g.teams.some((x) => g.marks[x.id]); feel(any, any ? g.teams.find((x) => g.marks[x.id]) : team()); offerOrAim(!!g.classRight[team().id]); render();
}
function pickPower(id) {
  if (g.phase !== 'powerup') return;
  sfx('select');
  if (id === 'boost') {
    if (g.qPtr >= g.queue.length) { g.queue = shuffle(g.queue); g.qPtr = 0; }
    g.question = g.queue[g.qPtr++]; g.phase = 'boost'; g.power = 'boost'; g.revealed = false; g.clueStep = 0; g.qStart = performance.now();
  } else if (id === 'shield') { team().shield++; g.power = 'shield'; toAim(); }
  else { g.power = id; toAim(); }
  render();
}
function judgeBoost(correct) {
  if (g.phase !== 'boost') return;
  record(g.turn, correct, true); g.pocketMul = correct ? CONFIG.scoring.boostMultiplier : 1; g.revealed = true;
  sfx(correct ? 'right' : 'wrong'); feel(correct, team()); toast(correct ? 'Basket × 2!' : 'No boost this time');
  toAim(); render();
}
function release() {
  if (g.phase !== 'aim' || g.slot < 0) return;
  g.phase = 'drop'; g.undo = null;
  drop = new Drop(g.board, { powerUp: g.power, shield: team().shield > 0, pocketMultiplier: g.pocketMul, lowScore: settings.lowScore, springGates: settings.springGates, movingBumper: settings.movingBumper, sound: sfx });
  drop.release(g.slot);
  render();
}
function finishDrop() {
  const r = drop.result();
  g.teams.forEach((t, i) => {
    if (i === g.turn) { t.score = Math.max(0, t.score + r.score); t.stars = Math.min(3, t.stars + r.stars); if (r.shieldUsed) t.shield = Math.max(0, t.shield - 1); }
    else t.score = Math.max(0, t.score - r.attack);
  });
  g.lastResult = r; g.phase = 'result';
  render();
}
function next() {
  if (g.phase !== 'result' && g.phase !== 'explain') return;
  sfx('click');
  Object.assign(g, { undo: null, board: null, power: null, offer: [], pocketMul: 1, lastResult: null, slot: -1 }); drop = null;
  if (g.classDrop) {
    if (g.turn + 1 < g.teams.length) { g.turn++; offerOrAim(!!g.classRight[team().id]); render(); return; }
    g.round++; g.turn = 0; g.classDrop = false;
  } else { g.turn++; if (g.turn >= g.teams.length) { g.turn = 0; g.round++; } }
  if (g.round > g.totalRounds) g.phase = 'final'; else nextQuestion();
  render();
}
function undo() { if (g.undo && ['explain', 'powerup', 'aim'].includes(g.phase)) { const u = g.undo; g = { ...u, undo: null }; drop = null; sfx('flip'); render(); } }
function addRounds() { g.totalRounds += 2; g.round = Math.min(g.round, g.totalRounds); g.outOfQuestions = false; g.turn = 0; g.classDrop = false; nextQuestion(true); show('game'); render(); }

/* ------------------------------------------------------------ rendering the game panels */
let panelKey = '';
function render() {
  if (!g) return;
  if (g.phase === 'final') { showFinal(); return; }
  $('#roundChip').textContent = `Round ${Math.min(g.round, g.totalRounds)} of ${g.totalRounds}`;
  $('#modeChip').textContent = g.mode === 'class' ? (g.classDrop ? `Every team drops · ${g.turn + 1} of ${g.teams.length}` : 'Everyone answers') : 'Team turns';
  $('#scr-game').className = 'screen on n' + g.teams.length;
  renderScores();
  const key = [g.phase, g.turn, g.round, g.qPtr, g.revealed, g.clueStep, g.power, JSON.stringify(g.marks || {}), g.offer.join()].join('|');
  if (key !== panelKey) { panelKey = key; $('#panel').innerHTML = panelHTML(); }
}
// a question's picture: the painted one when we have it, else its symbol
const qPic = (o, cls = 'qp') => (o.pic && META.sprites[o.pic] ? `<img class="${cls}" src="${artURL(o.pic)}" alt="">` : o.image || o.icon || '');
const turnHead = (t, label) => `<div class="turn" style="--c:${t.color}"><span class="pic" style="background-image:url(${teamImg(t)})"></span><span><small>${label}</small><b>${esc(t.name)}</b></span></div>`;
function questionCard(q, tag, compact = false) {
  if (compact) return `<div class="qcard compact"><div class="tag">${tag}</div><div class="prompt">${esc(q.prompt)}${q.type === 'image' ? ' ' + qPic(q, 'qp-s') : ''}</div><div class="answer"><small>Answer</small><b>${esc(q.answer)}</b>${q.also && q.also.length ? `<span>Also OK: ${q.also.map(esc).join(', ')}</span>` : ''}</div></div>`;
  let body = '';
  if (q.type === 'image') body = `<div class="img">${qPic(q)}</div>`;
  else if (q.type === 'clue') body = `<ul class="clues">${q.clues.map((c, i) => `<li class="${i <= g.clueStep || g.revealed ? '' : 'hid'}">${esc(c)}</li>`).join('')}</ul>`;
  const ans = g.revealed ? `<div class="answer"><small>Answer</small><b>${esc(q.answer)}</b>${q.also && q.also.length ? `<span>Also OK: ${q.also.map(esc).join(', ')}</span>` : ''}</div>` : '';
  const tl = settings.timeLimit && !g.revealed ? `<div class="timer" id="timer" style="--p:1"><span>${settings.timeLimit}</span></div>` : '';
  return `<div class="qcard ${q.type === 'text' ? 'big' : ''}">${tl}<div class="tag">${tag}</div><div class="prompt">${esc(q.prompt)}</div>${body}${ans}</div>`;
}
function panelHTML() {
  const t = team(), q = g.question;
  switch (g.phase) {
    case 'question': {
      if (g.mode === 'class') {
        const head = `<div class="turn" style="--c:#ffd166"><span class="pic" style="background-image:url(${crewURL('foxino')})"></span><span><small>Every team</small><b>Write your answer!</b></span></div>`;
        if (!g.revealed) return head + questionCard(q, `Round ${g.round} · question`) + `<div class="actions">${clueBtn(q)}<button class="btn gold xl block" data-act="reveal">Show answer</button></div>`;
        const all = g.teams.every((x) => typeof g.marks[x.id] === 'boolean');
        return questionCard(q, 'Mark every team', true) + `<div class="marks">${g.teams.map((x) => `<div class="mark" style="--c:${x.color}"><span class="pic" style="background-image:url(${teamImg(x)})"></span><b>${esc(x.name)}</b><button class="y ${g.marks[x.id] === true ? 'on' : ''}" data-mark="${x.id}" data-v="1">✓</button><button class="n ${g.marks[x.id] === false ? 'on' : ''}" data-mark="${x.id}" data-v="0">✗</button></div>`).join('')}</div>
          <div class="actions"><button class="btn gold lg block ${all ? 'pulse' : ''}" data-act="confirm" ${all ? '' : 'disabled'}>Confirm answers</button></div>`;
      }
      const stars = t.stars ? `<div class="badge" style="margin-bottom:14px">${'★'.repeat(t.stars)} ${t.stars} star${t.stars > 1 ? 's' : ''} — a right answer unlocks power-ups!</div>` : '';
      if (!g.revealed) return turnHead(t, 'Your turn') + stars + questionCard(q, `Round ${g.round} · question`) + `<div class="actions">${clueBtn(q)}<button class="btn gold xl block" data-act="reveal">Show answer</button></div>`;
      return turnHead(t, 'Was it right?') + questionCard(q, `Round ${g.round} · question`) + `<div class="actions judge"><button class="btn good xl block" data-act="right"><span class="mk">✓ </span>Right</button><button class="btn bad xl block" data-act="wrong"><span class="mk">✗ </span>Wrong</button></div>`;
    }
    case 'explain':
      return turnHead(t, 'Not this time') + `<div class="qcard"><div class="tag">The answer</div><div class="prompt">${esc(q.prompt)}${q.type === 'image' ? ' ' + qPic(q, 'qp-s') : ''}</div><div class="answer"><small>Answer</small><b>${esc(q.answer)}</b></div><div class="explain">${esc(q.explanation || '')}</div></div>
        <div class="actions"><button class="btn gold xl block" data-act="next">${nextLabel()} →</button><button class="link undo" data-act="undo">Undo — it was right</button></div>`;
    case 'powerup': {
      const n = g.offer.length;
      return turnHead(t, 'Power-up time!') + `<div class="big-msg"><h2>Pick ONE!</h2><p>Your ${'★'.repeat(n)} revealed ${n} card${n > 1 ? 's' : ''}.</p></div>
        <div class="cards">${g.offer.map((id) => { const p = powerById(id); return `<button class="pcard" data-pick="${id}" style="--a:${p.c[0]};--b:${p.c[1]}"><img src="${powerIcon(id, 200)}" alt=""><span><b>${esc(p.name)}</b><p>${esc(p.blurb)}</p><em>${esc(p.scoring)}</em></span></button>`; }).join('')}</div>
        <div class="actions"><button class="btn ghost lg block" data-act="skipPower">Skip — my ${WORDS.ball}</button>${g.undo ? '<button class="link undo" data-act="undo">Undo the marking</button>' : ''}</div>`;
    }
    case 'boost':
      if (!g.revealed) return turnHead(t, WORDS.owl) + questionCard(q, 'Bonus question · right = basket × 2') + `<div class="actions">${clueBtn(q)}<button class="btn gold xl block" data-act="reveal">Show answer</button></div>`;
      return turnHead(t, WORDS.owl) + questionCard(q, 'Bonus question') + `<div class="actions judge"><button class="btn good xl block" data-act="boostYes"><span class="mk">✓ </span>Right</button><button class="btn bad xl block" data-act="boostNo"><span class="mk">✗ </span>Wrong</button></div>`;
    case 'aim': {
      const p = g.power ? powerById(g.power) : null;
      const pic = p && !['shield', 'boost'].includes(p.id) ? `<img class="ball" src="${powerIcon(p.id, 260)}" alt="">` : nutBall(t, 'happy');
      const extras = [g.pocketMul > 1 ? '<span class="badge">🦉 Basket × 2</span>' : '', t.shield ? `<span class="badge">${WORDS.helmetReady}</span>` : ''].join(' ');
      return turnHead(t, WORDS.dropIt) + `<div class="ballbox">${pic}<h3>${p && !['shield', 'boost'].includes(p.id) ? esc(p.name) : 'Your ' + WORDS.ball}</h3><p>${p && !['shield', 'boost'].includes(p.id) ? esc(p.blurb) : WORDS.aimHint}</p><div>${extras}</div></div>
        <div class="actions"><div class="tapdrop"><span class="tap-arrow" aria-hidden="true">➜</span><span><b>Tap a number</b> at the top of the board: the ${WORDS.ball} drops from there straight away!</span></div>${g.undo ? '<button class="link undo" data-act="undo">Undo the marking</button>' : ''}</div>`;
    }
    case 'drop':
      return turnHead(t, 'Dropping…') + (g.power && !['shield', 'boost'].includes(g.power) ? `<div class="inplay"><img src="${powerIcon(g.power, 200)}" alt=""><b>${esc(powerById(g.power).name)}</b></div>` : '') + `<div class="live"><small>Turn score</small><div class="num" id="liveNum">0</div><div class="breakdown" id="liveBd"></div></div>`;
    case 'result': {
      const r = g.lastResult, rows = [['Pegs', r.pegScore], ['Basket', r.pocketScore]];
      if (r.coinScore) rows.push(['Golden acorns', r.coinScore]);
      if (r.attack) rows.push(['Other teams lose', -r.attack]);
      return turnHead(t, 'Turn score') + `<div class="live">${nutBall(t, scoreMood(r.score), 'ball nut mood')}<div class="num ${r.score < 0 ? 'neg' : ''}">${r.score > 0 ? '+' : ''}${r.score}</div>
        <div class="breakdown">${rows.map(([l, v], i) => `<div class="${v < 0 ? 'neg' : 'pos'}" style="animation-delay:${i * 0.1}s"><span>${l}</span><b>${v > 0 ? '+' : ''}${v}</b></div>`).join('')}
        ${r.stars ? `<div class="pos" style="animation-delay:.4s"><span>Stars for next time</span><b style="color:#ffe14d">${'★'.repeat(r.stars)}</b></div>` : ''}
        ${r.shieldUsed ? `<div class="pos"><span>${WORDS.helmetBlocked}</span><b>✓</b></div>` : ''}</div></div>
        <div class="actions"><button class="btn gold xl block pulse" data-act="next">${nextLabel()} →</button></div>`;
    }
    case 'practice':
      return `<div class="big-msg" style="margin-top:20px"><h2>Practice drop</h2><p>Tap a number at the top of the board to drop ${WORDS.aBall}. Try it a few times — it does not count!</p></div>
        <div class="ballbox">${nutBall(g.teams[0], 'wheee')}<p>${WORDS.practice}</p></div>
        <div class="actions"><button class="btn-pic start pulse" data-act="endPractice" aria-label="Start"><span>START</span></button></div>`;
  }
  return '';
}
const clueBtn = (q) => (q.type === 'clue' && g.clueStep < q.clues.length - 1 ? '<button class="btn violet lg block" data-act="clue">Next clue</button>' : '');
function nextLabel() {
  if (g.classDrop) return g.turn + 1 < g.teams.length ? 'Next team' : (g.round >= g.totalRounds ? 'See the winners' : 'Next question');
  const last = g.turn + 1 >= g.teams.length && g.round >= g.totalRounds;
  return last ? 'See the winners' : 'Next team';
}

// scoreboard
let shownScores = [], scoreKey = '';
function renderScores() {
  const ranks = [...g.teams].map((t, i) => [t.score, i]).sort((a, b) => b[0] - a[0]);
  const rankOf = (i) => ranks.findIndex((r) => r[0] === g.teams[i].score) + 1; // teams with the same score share a place
  const anyScore = g.teams.some((t) => t.score > 0);
  const key = g.teams.map((t) => [t.stars, t.shield, t.name, rankOf(g.teams.indexOf(t))].join()).join('|') + '|' + g.turn + g.phase + anyScore;
  if (key !== scoreKey) {
    scoreKey = key;
    $('#scores').innerHTML = g.teams.map((t, i) => `<div class="srow ${i === g.turn && g.phase !== 'practice' && !(g.mode === 'class' && !g.classDrop) ? 'on' : ''}" style="--c:${t.color}">
      ${anyScore ? `<span class="rk ${rankOf(i) === 1 ? 'r1' : ''}">${rankOf(i)}</span>` : ''}
      <span class="pic" style="background-image:url(${teamImg(t)})">${COOKIE && cookieURL('happy', t.color) ? `<img class="tcookie" src="${cookieURL('happy', t.color)}" alt="">` : ''}</span>
      <span class="nm"><b>${esc(t.name)}</b><span class="st">${[0, 1, 2].map((k) => `<i class="${k < t.stars ? 'on' : ''}"></i>`).join('')}${t.shield ? `<img class="sh-ic" src="${powerIcon('shield', 52)}" alt="shield">` : ''}</span></span>
      <span class="sc" data-sc="${i}">${Math.round(shownScores[i] || 0)}</span></div>`).join('');
  }
}
function tickScores(dt) {
  if (!g) return;
  g.teams.forEach((t, i) => {
    const cur = shownScores[i] || 0, target = t.score + (i === g.turn && drop && g.phase === 'drop' ? 0 : 0);
    if (Math.abs(cur - target) < 0.5) { if (cur !== target) { shownScores[i] = target; paintScore(i, target, 0); } return; }
    const nv = cur + (target - cur) * Math.min(1, dt * 5) + Math.sign(target - cur) * 0.5;
    shownScores[i] = Math.abs(nv - target) < 1 ? target : nv; paintScore(i, shownScores[i], Math.sign(target - cur));
    if (Math.random() < 0.3) sfx('tally');
  });
}
function paintScore(i, v, dir) {
  const el = $(`[data-sc="${i}"]`); if (!el) return;
  el.textContent = Math.round(v);
  if (dir) { el.classList.remove('up', 'down'); void el.offsetWidth; el.classList.add(dir > 0 ? 'up' : 'down'); }
}
function renderLegend() {
  $('#legend').innerHTML = PEGS.map((p) => `<div><img src="${pegIcon(p.kind, 108)}" alt=""><b class="${p.pts < 0 ? 'neg' : ''}">${p.pts > 0 ? '+' : ''}${p.pts}</b>${p.label}</div>`).join('') + '<div class="note">★ in a basket = a power-up card later</div>';
}

/* ------------------------------------------------------------ the frame loop */
let last = performance.now(), liveShown = 0;
const preview = { board: null, drop: null };
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
  if (screen === 'game' && g) {
    if (!paused) {
      if (drop && drop.started) for (let k = 0; k < (window.__fast || 1); k++) drop.step(dt);
      if (g.phase === 'drop' && drop && drop.done) finishDrop();
      if (practice && practice.started) { practice.step(dt); if (practice.done && !practice.floats.length) practice = null; }
      if ((g.phase === 'question' || g.phase === 'boost') && settings.timeLimit && !g.revealed) tickTimer();
    }
    // before the ball is released, a resting copy of the drop shows the bumpers and gates of this board
    const shownBoard = g.phase === 'practice' ? g.practiceBoard : g.board || g.lastBoard;
    if (shownBoard && preview.board !== shownBoard) { preview.board = shownBoard; preview.drop = new Drop(shownBoard, { springGates: settings.springGates, movingBumper: settings.movingBumper }); }
    const d = (g.phase === 'practice' ? practice : drop) || (shownBoard ? preview.drop : null);
    view.render(paused ? 0 : dt, { board: shownBoard, drop: d, phase: g.phase === 'practice' ? (practice ? 'drop' : 'practice') : g.phase, slot: g.slot, team: { color: team().color, img: teamImg(team()) }, power: g.power, reduced });
    if (g.board) g.lastBoard = g.board;
    if (g.phase === 'drop' && drop) {
      const v = drop.turnScore; liveShown += (v - liveShown) * Math.min(1, dt * 10);
      const el = $('#liveNum'); if (el) { el.textContent = (Math.round(liveShown) > 0 ? '+' : '') + Math.round(liveShown); el.classList.toggle('neg', v < 0); }
      const bd = $('#liveBd'), bdh = `<div class="pos"><span>Pegs hit</span><b>${drop.pegsHit}</b></div>${drop.starsEarned ? `<div class="pos"><span>Stars</span><b style="color:#ffe14d">${'★'.repeat(Math.min(6, drop.starsEarned))}</b></div>` : ''}${drop.attackTotal ? `<div class="neg"><span>Rivals lose</span><b>−${drop.attackTotal}</b></div>` : ''}`;
      if (bd && bd.dataset.h !== bdh) { bd.dataset.h = bdh; bd.innerHTML = bdh; }
    } else liveShown = 0;
    tickScores(dt);
  }
  confettiStep(dt); snowStep(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

let lastSec = -1;
function tickTimer() {
  const el = $('#timer'); if (!el) return;
  const left = Math.max(0, settings.timeLimit - (performance.now() - g.qStart) / 1000);
  el.style.setProperty('--p', left / settings.timeLimit); el.querySelector('span').textContent = Math.ceil(left);
  el.classList.toggle('low', left < 5.5);
  const s = Math.ceil(left); if (s !== lastSec) { lastSec = s; if (s <= 5 && s > 0) sfx('tick'); }
  if (left <= 0) { toast("Time's up!"); sfx('wrong'); g.revealed = true; g.clueStep = 99; render(); }
}

/* ------------------------------------------------------------ board input */
$('#board').addEventListener('pointerdown', (e) => {
  if (!g || paused) return;
  unlock();
  const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 748, y = (e.clientY - r.top) / r.height * 990;
  const slot = view.slotAt(x, y); if (slot < 0) return;
  if (g.phase === 'aim') {
    // picking the spot IS the drop (the user's note "Drop", 2026-11-25): the ball falls from the tapped spot at once.
    // release() only works in the 'aim' phase, so a second tap (or a double tap) cannot drop a second ball.
    if (performance.now() - (g.aimAt || 0) < 250) return; // ignore a tap that started before the board was ready
    g.slot = slot; sfx('select'); release();
  } else if (g.phase === 'practice' && !practice) {
    g.slot = slot; practice = new Drop(g.practiceBoard = makeBoard(1, { spikes: false }), { springGates: settings.springGates, movingBumper: settings.movingBumper, sound: sfx });
    practice.release(slot);
  }
});

// with a mouse (or a whiteboard pen that hovers) the ball follows the pointer above the board, so you see where it will fall
$('#board').addEventListener('pointermove', (e) => {
  if (!g || paused || g.phase !== 'aim' || e.pointerType === 'touch') return;
  const r = e.currentTarget.getBoundingClientRect(), slot = view.slotAt((e.clientX - r.left) / r.width * 748, (e.clientY - r.top) / r.height * 990);
  g.slot = slot;
});
$('#board').addEventListener('pointerleave', () => { if (g && g.phase === 'aim') g.slot = -1; });

/* ------------------------------------------------------------ buttons */
stage.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act],[data-pick],[data-mark]'); if (!b) return;
  unlock();
  if (b.dataset.pick) return pickPower(b.dataset.pick);
  if (b.dataset.mark) { g.marks[b.dataset.mark] = b.dataset.v === '1'; sfx(b.dataset.v === '1' ? 'select' : 'click'); render(); return; }
  act(b.dataset.act);
});
function act(a) {
  switch (a) {
    case 'toTeams': sfx('start'); show('teams'); break;
    case 'toSetup': sfx('click'); show('setup'); break;
    case 'howto': openHowto(false); break;
    case 'start': sfx('start'); openHowto(true); break;
    case 'practice': closeHowto(); beginGame(true); break;
    case 'skipHowto': closeHowto(); beginGame(false); break;
    case 'closeHowto': closeHowto(); break;
    case 'endPractice': practice = null; g.phase = 'question'; g.slot = -1; g.qStart = performance.now(); sfx('start'); render(); break;
    case 'reveal': g.revealed = true; g.clueStep = 99; sfx('flip'); render(); break;
    case 'clue': g.clueStep++; sfx('flip'); render(); break;
    case 'right': judge(true); break;
    case 'wrong': judge(false); break;
    case 'confirm': judgeAll(); break;
    case 'boostYes': judgeBoost(true); break;
    case 'boostNo': judgeBoost(false); break;
    case 'skipPower': sfx('click'); g.power = null; toAim(); render(); break;
    case 'drop': release(); break;
    case 'next': next(); break;
    case 'undo': undo(); break;
    case 'pause': pause(true); $('#pauseOv').classList.add('on'); break;
    case 'resume': pause(false); $('#pauseOv').classList.remove('on'); break;
    case 'home': $('#pauseOv').classList.remove('on'); $('#homeOv').classList.add('on'); pause(true); break;
    case 'stay': $('#homeOv').classList.remove('on'); pause(false); break;
    case 'leave': $('#homeOv').classList.remove('on'); paused = false; g = null; drop = null; practice = null; show('setup'); break;
    case 'mute': setMuted(!isMuted()); store.set('blinko.muted', isMuted()); $('#muteBtn').classList.toggle('muted', isMuted()); break;
    case 'fullscreen': if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); break;
    case 'again': sfx('start'); confettiStop(); beginGame(false); break;
    case 'addRounds': confettiStop(); addRounds(); break;
    case 'newSetup': confettiStop(); g = null; show('setup'); break;
  }
}
$('#muteBtn').classList.toggle('muted', isMuted());

let pausedAt = 0;
function pause(on) {
  if (on && !paused) pausedAt = performance.now();
  if (!on && paused && g) g.qStart += performance.now() - pausedAt;
  paused = on; last = performance.now();
}
function beginGame(withPractice) {
  newGame(); panelKey = ''; scoreKey = '';
  show('game'); renderLegend();
  if (withPractice) { g.phase = 'practice'; g.practiceBoard = makeBoard(1, { spikes: false }); }
  render();
}

/* ------------------------------------------------------------ how to play */
function openHowto(starting) {
  const ic = (ids) => ids.map((id) => `<img src="${powerIcon(id, 172)}" alt="">`).join('');
  $('#howto').innerHTML = `<div class="glass howto"><h2 class="title">How to play</h2><div class="steps">
    <div class="step"><span class="n">1</span><h3>Answer the question</h3><div class="pics">${META.sprites['q-mark'] ? `<img src="${artURL('q-mark')}" alt="">` : '<span style="font-size:80px">?</span>'}</div><p>The team answers. The teacher shows the answer and taps <b>Right</b> or <b>Wrong</b>. ${settings.mode === 'class' ? 'In “Everyone answers” mode every team writes an answer, then every team drops.' : ''}</p></div>
    <div class="step"><span class="n">2</span><h3>Collect stars, pick a power-up</h3><div class="pics">${ic(['dynamite', 'balloon', 'popcorn'])}</div><p>Land in baskets with ★ to collect stars. On your next right answer each star turns over one power-up card (up to 3) — pick ONE or skip it.</p></div>
    <div class="step"><span class="n">3</span><h3>Drop the ${WORDS.ball}</h3><div class="pics"><img src="${pegIcon('gold', 120)}" alt=""><img src="${pegIcon('mint', 120)}" alt=""><img src="${pegIcon('spike', 120)}" alt=""></div><p>${WORDS.howto3}</p></div>
  </div><div class="row">${starting ? '<button class="btn ghost lg" data-act="skipHowto">Skip — start now</button><button class="btn gold xl pulse" data-act="practice">Practice drop ▶</button>' : '<button class="btn gold xl" data-act="closeHowto">Got it!</button>'}</div></div>`;
  $('#howto').classList.add('on');
}
function closeHowto() { $('#howto').classList.remove('on'); }

/* ------------------------------------------------------------ final screen */
function showFinal() {
  if (screen === 'final') return;
  show('final');
  const sorted = [...g.teams].sort((a, b) => b.score - a.score), top = sorted[0];
  const tie = sorted.length > 1 && sorted[1].score === top.score;
  $('#winTitle').textContent = g.outOfQuestions ? 'Out of questions — final scores' : tie ? "It's a tie!" : `${top.name} wins!`;
  const pod = [sorted[1], sorted[0], sorted[2]].map((t, k) => t ? `<div class="pod p${[2, 1, 3][k]}" style="--c:${t.color}"><span class="pic" style="background-image:url(${teamImg(t)})"></span><b>${esc(t.name)}</b><span class="ps">${t.score}</span><div class="block">${[2, 1, 3][k]}</div></div>` : '').join('');
  if (META.podium) {
    const P = META.podium, order = [sorted[1], sorted[0], sorted[2]], xs = [1 / 6, 1 / 2, 5 / 6];
    $('#podium').innerHTML = `<div class="podium-pic" style="aspect-ratio:${P.w}/${P.h}"><img class="pod-img" src="${artURL('podium')}" alt="">` + order.map((t, k) => t ? `<div class="pp p${[2, 1, 3][k]}" style="left:${xs[k] * 100}%;bottom:${(1 - P.tops[k] / P.h) * 100}%;--c:${t.color}"><b>${esc(t.name)}</b><span class="ps">${t.score}</span><span class="pic" style="background-image:url(${teamImg(t)})">${k === 1 && !tie && META.sprites.crown ? `<img class="crown" src="${artURL('crown')}" alt="">` : ''}</span></div>` : '').join('') + '</div>';
  } else $('#podium').innerHTML = pod;
  $('#podium').insertAdjacentHTML('beforeend', (XMAS_FRIENDS && g.teams.length > 5 ? '' : `<img class="hz-pod${XMAS_FRIENDS ? ' trio' : ''}" src="${XMAS_FRIENDS ? artURL('trio-cheer') : hazel('cheer')}" alt="">`));
  $('#finScores').innerHTML = sorted.map((t, i) => `<div class="frow" style="--c:${t.color}"><span class="pic" style="background-image:url(${teamImg(t)})"></span><b>${i + 1}. ${esc(t.name)}<span class="xp">${t.correct}/${t.answered} right · ${t.xp} XP</span></b><span class="sc">${t.score}</span></div>`).join('');
  const total = g.answers.length, right = g.answers.filter((a) => a.correct).length;
  const wrong = [], seen = new Set(); g.answers.filter((a) => !a.correct).forEach((a) => { if (!seen.has(a.qid)) { seen.add(a.qid); wrong.push(a); } });
  $('#learn').innerHTML = `<div class="overall"><b>${total ? Math.round(right / total * 100) : 0}%</b><small>of answers were right</small></div>
    ${g.teams.map((t) => `<div class="acc"><div class="top"><span>${esc(t.name)}</span><span>${t.answered ? Math.round(t.correct / t.answered * 100) : 0}%</span></div><div class="bar"><i data-w="${t.answered ? t.correct / t.answered * 100 : 0}"></i></div></div>`).join('')}
    <div class="review"><h4>Practise these again</h4>${wrong.length ? wrong.map((a) => `<div>${esc(a.prompt)} → <b>${esc(a.answer)}</b></div>`).join('') : '<div class="none">No wrong answers — brilliant!</div>'}</div>`;
  setTimeout(() => $$('#learn .bar i').forEach((i) => { i.style.width = i.dataset.w + '%'; }), 300);
  sfx('drumroll'); setTimeout(() => { sfx('win'); if (THEME === 'xmas') sfx('jingle'); confettiStart(); }, 1300);
}

/* ------------------------------------------------------------ confetti */
const cc = $('#confetti'), cx = cc.getContext('2d'); cc.width = 1920; cc.height = 1080;
let bits = [], confettiOn = false;
function confettiStart() { confettiOn = true; }
function confettiStop() { confettiOn = false; bits = []; cx.clearRect(0, 0, 1920, 1080); }
// a burst of autumn leaves and gold from one point (a right answer)
function leafBurst(x, y, n) {
  const cols = THEME === 'xmas' ? ['#e8303a', '#ffd23d', '#2fa84f', '#ffffff', '#ffffff', '#c9e8ff'] : ['#ff9f1c', '#ffcf2e', '#e8572a', '#7cc255', '#c0702a', '#ffe08a'];
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 380 + Math.random() * 620; bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 420, g: 900, r: Math.random() * 6, vr: (Math.random() - 0.5) * 14, w: 12 + Math.random() * 12, h: 8 + Math.random() * 8, c: cols[i % cols.length] }); }
}
function confettiStep(dt) {
  if (!confettiOn && !bits.length) return;
  if (confettiOn && bits.length < 260) for (let i = 0; i < 4; i++) bits.push({ x: Math.random() * 1920, y: -20, vx: (Math.random() - 0.5) * 120, vy: 150 + Math.random() * 200, r: Math.random() * 6, vr: (Math.random() - 0.5) * 10, w: 10 + Math.random() * 10, h: 6 + Math.random() * 8, c: TEAM_COLORS[(Math.random() * 8) | 0] });
  cx.clearRect(0, 0, 1920, 1080);
  for (const b of bits) { b.vy += (b.g || 0) * dt; b.x += b.vx * dt + Math.sin(b.y / 40) * 1.2; b.y += b.vy * dt; b.r += b.vr * dt; cx.save(); cx.translate(b.x, b.y); cx.rotate(b.r); cx.scale(1, Math.cos(b.r * 2)); cx.fillStyle = b.c; cx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); cx.restore(); }
  bits = bits.filter((b) => b.y < 1120);
  if (screen !== 'final') confettiOn = false;
}

/* ------------------------------------------------------------ falling snow behind the screens (Christmas only) */
const snowCv = $('#snow'), sx = snowCv && THEME === 'xmas' ? snowCv.getContext('2d') : null;
const newFlake = (anywhere) => { const z = Math.random(); return { x: Math.random() * 1920, y: anywhere ? Math.random() * 1080 : -12, r: 1.6 + z * 4.4, vy: 22 + z * 64, sw: Math.random() * 6.3, a: 0.45 + z * 0.5 }; };
let flakes = [];
if (sx) { snowCv.width = 1920; snowCv.height = 1080; flakes = Array.from({ length: reduced ? 50 : 150 }, () => newFlake(true)); } else if (snowCv) snowCv.remove();
let snowDrawn = false;
function snowStep(dt) {
  if (!sx || (reduced && snowDrawn)) return;
  snowDrawn = true; sx.clearRect(0, 0, 1920, 1080); sx.fillStyle = '#fff';
  for (const f of flakes) {
    if (!reduced) { f.y += f.vy * dt; f.sw += dt * 0.9; f.x += Math.sin(f.sw) * 14 * dt; if (f.y > 1092) Object.assign(f, newFlake(false)); }
    sx.globalAlpha = f.a; sx.beginPath(); sx.arc(f.x, f.y, f.r, 0, Math.PI * 2); sx.fill();
  }
  sx.globalAlpha = 1;
}

/* ------------------------------------------------------------ toast + keyboard */
let toastT = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1600); }
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || !g || screen !== 'game' || paused) return;
  const k = e.key;
  if (/^[0-9]$/.test(k) && (g.phase === 'aim')) { g.slot = k === '0' ? 9 : +k - 1; sfx('select'); release(); } // a number key drops from that spot
  else if ((k === ' ' || k === 'Enter') && (g.phase === 'question' || g.phase === 'boost') && !g.revealed) { e.preventDefault(); act('reveal'); }
  else if ((k === 'Enter' || k === ' ') && (g.phase === 'result' || g.phase === 'explain')) { e.preventDefault(); next(); }
});

/* ------------------------------------------------------------ test hooks */
window.BL = {
  get g() { return g; }, get drop() { return drop; }, act, show, settings,
  start(n = 4, mode = 'turn') { settings.teamCount = n; settings.mode = mode; beginGame(false); },
  aim(slot = 4) { g.slot = slot; render(); }, release, judge, pickPower, next,
  fast(n = 6) { window.__fast = n; },
  stars(n = 3) { team().stars = n; render(); },
};

// ?demo=<state> opens the game straight in one state (for checking the design at full size)
function runDemo(d) {
  const n = +(new URLSearchParams(location.search).get('teams') || 4);
  if (d === 'setup') return;
  if (d === 'teams') { settings.teamCount = n; return show('teams'); }
  if (d === 'howto') { settings.teamCount = n; show('teams'); return openHowto(true); }
  settings.teamCount = n; settings.mode = d.startsWith('class') ? 'class' : 'turn'; if (d === 'timer') settings.timeLimit = 30;
  beginGame(d === 'practice');
  const qid = new URLSearchParams(location.search).get('q'), qq = qid && SETS.flatMap((x) => x.questions).find((x) => x.id === qid); if (qq) { g.question = qq; panelKey = ''; render(); }
  if (d === 'practice' || d === 'question' || d === 'timer' || d === 'class') return;
  g.teams.forEach((t, i) => { t.score = [320, 545, 190, 410, 260, 75, 480, 130][i]; t.stars = [3, 1, 0, 2, 0, 1, 0, 0][i]; }); shownScores = g.teams.map((t) => t.score); scoreKey = '';
  if (d === 'final') { g.teams.forEach((t) => { t.answered = 4; t.correct = 3; t.xp = 30; }); g.answers = [{ qid: 'v2', prompt: 'Opposite of “expensive”?', answer: 'cheap', correct: false }, { qid: 'v5', prompt: 'Past tense of “go”?', answer: 'went', correct: true }, { qid: 'v8', prompt: 'Plural of “child”?', answer: 'children', correct: true }]; g.phase = 'final'; return render(); }
  act('reveal'); if (d === 'reveal') return;
  if (d === 'classmark') { g.marks = { t1: true, t2: false }; panelKey = ''; return render(); }
  if (d === 'explain') return judge(false);
  judge(true); if (d === 'powerup') return;
  if (g.phase === 'powerup') pickPower(d === 'drop' ? 'popcorn' : d === 'aimpower' ? 'balloon' : g.offer[0]);
  if (d === 'aim' || d === 'aimpower') { g.slot = 6; return render(); }
  g.slot = 3; release();
  if (d === 'drop') return setTimeout(() => { paused = true; }, 2200);
  window.__fast = 12; // 'result'
}

/* ------------------------------------------------------------ loading: every picture first, then the game appears */
(function boot() {
  const BG = THEME === 'xmas' && (META.own || []).includes('bg-xmas') ? 'bg-xmas' : 'bg-forest';
  const pics = [BG, 'logo', ...(XMAS_FRIENDS ? ['trio-hold', 'trio-cheer', 'deco-gingerbread', 'deco-cane', 'deco-lollipop', 'deco-candies', ...FRIENDS.flatMap((f) => [f + '-happy', f + '-sad'])] : ['squirrel-hold', 'squirrel-cheer', 'squirrel-oops']), ...Object.keys(META.buttons), 'btn-round', 'podium', 'crown'].filter((n) => n === BG || n === 'logo' || META.sprites[n] || META.buttons[n] || (n === 'podium' && META.podium)).map(artURL)
    .concat(CREW.map((c) => crewURL(c.id)));
  const total = pics.length + artList().length + 1; let done = 0;
  const bar = $('#loadBar'), tick = () => { done++; if (bar) bar.style.width = Math.round(done / total * 100) + '%'; };
  const img = (src) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = () => { tick(); res(); }; im.src = src; });
  const fonts = (document.fonts ? document.fonts.load('40px "Lilita One"').then(() => document.fonts.ready) : Promise.resolve()).catch(() => {}).then(tick);
  const all = Promise.all([loadArt(tick), fonts, ...pics.map(img)]);
  Promise.race([all, new Promise((r) => setTimeout(r, 12000))]).then(() => {
    show('setup');
    const demo = new URLSearchParams(location.search).get('demo'); if (demo) { document.body.classList.add('noanim'); runDemo(demo); }
    const l = $('#loader'); if (l) { l.classList.add('gone'); setTimeout(() => l.remove(), 700); }
  });
})();
