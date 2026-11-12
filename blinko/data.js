// Blinko — rules, numbers and question sets.
// The rules and numbers are the ones from the original prototype ("Foxino Drop"), kept as they were.

export const CONFIG = {
  physics: { gravity: 630, restitution: 0.55, wallRestitution: 0.7, maxSpeed: 950, maxTurnSeconds: 25, maxBalls: 14, stuckSpeed: 18, stuckSeconds: 0.9 },
  scoring: {
    peg: { normal: 10, mint: 25, gold: 50, vanish: 15 },
    spikePenalty: 40,
    pockets: [10, 25, 50, 75, 100, 150, 200, 300, 500],
    pocketsStart: 5, pocketsMax: 9,
    lowScoreDivisor: 5,
    coinValue: 5, turtleAttack: 3, turtleAttackCap: 30,
    xpPerCorrect: 10, boostMultiplier: 2,
  },
  board: { rowsStart: 10, rowsMax: 14 },
};

// the board is drawn in its own units: 600 wide, 820 tall
export const BW = 600, BH = 820;
export const SLOTS = 10;
export const slotX = (i) => 36 + (528 / 9) * i;

// the team pictures (the fugio crew)
export const CREW = [
  { id: 'foxino', name: 'Foxino' }, { id: 'stella', name: 'Stella' }, { id: 'pix', name: 'Pix' },
  { id: 'rob', name: 'Rob' }, { id: 'charlie', name: 'Charlie' }, { id: 'gummy', name: 'Gummy' },
  { id: 'penguin', name: 'Penguin' }, { id: 'bear', name: 'Polar Bear' }, { id: 'otter', name: 'Otter' },
  { id: 'seal', name: 'Seal' }, { id: 'turtle', name: 'Turtle' }, { id: 'axolotl', name: 'Axolotl' },
];
export const crewURL = (id) => `art/crew-${id}.webp?v=1`;

export const TEAM_COLORS = ['#ff973b', '#33d1a6', '#ff5e8a', '#4f8bff', '#ffc93d', '#b28bff', '#5fcf5a', '#ff4d5e'];
export const TEAM_NAMES = ['Fox Squad', 'Star Crew', 'Robot Brains', 'Rocket Pix', 'Gold Rush', 'Moon Owls', 'Green Giants', 'Red Comets'];
export const TEAM_CREW = ['foxino', 'stella', 'rob', 'pix', 'charlie', 'gummy', 'penguin', 'otter'];

export const POWERS = [
  { id: 'dynamite', name: 'Dynamite', c: ['#ff7a3b', '#ffd166'], blurb: 'The fuse lights on the first peg — BOOM clears the pegs around it.', scoring: 'Every peg in the blast pays out.' },
  { id: 'yoyo', name: 'Yo-Yo', c: ['#ff5e8a', '#ffb3c7'], blurb: 'Falls twice: reeled back up on its string, then dropped again.', scoring: 'Two pockets; the pegs light up again for drop 2.' },
  { id: 'bouncy', name: 'Bouncy Boi', c: ['#2fd6a8', '#c6ffe9'], blurb: 'A super-springy ball that bounces much higher.', scoring: 'Reaches more pegs.' },
  { id: 'egg', name: 'Crack the Egg', c: ['#ffd36b', '#fff7dd'], blurb: 'Cracks on impact into a bouncy chick and two shell pieces.', scoring: 'Chick + shells all score; shells pay half a pocket.' },
  { id: 'turtle', name: 'Green Turtle', c: ['#3fbf6a', '#b8f5c8'], blurb: 'A ricochet shell. Every peg it hits attacks the rival teams.', scoring: 'You keep the peg points; rivals lose 3 per hit (max 30).' },
  { id: 'cow', name: 'Cowabunga!', c: ['#8fb7ff', '#ffffff'], blurb: 'Milk splashes spray out on impact and hit extra pegs.', scoring: 'Up to 6 splashes × 3 drops.' },
  { id: 'balloon', name: 'Balloonicorn', c: ['#ff9de6', '#a6e3ff'], blurb: 'A floaty unicorn balloon with a rainbow trail and buoyant bounces.', scoring: 'A long, winding journey.' },
  { id: 'puffer', name: 'Pufferfish', c: ['#ffc24b', '#ffe9b0'], blurb: 'Puffs up during the drop and hits several pegs at once.', scoring: 'Bigger and bigger.' },
  { id: 'oinky', name: 'Oinky', c: ['#ff9fb7', '#ffe0e8'], blurb: 'A piggy bank that drops a coin on every hit.', scoring: 'Every coin adds 5 to the turn.' },
  { id: 'shark', name: 'Sharkinator', c: ['#4f7dff', '#b9d0ff'], blurb: 'Fires lasers at nearby pegs while it falls.', scoring: 'Up to 8 laser strikes.' },
  { id: 'yinyang', name: 'Yin-Yang', c: ['#2b2140', '#e9e3ff'], blurb: 'Two balls at once, from mirrored positions.', scoring: 'Both results count.' },
  { id: 'popcorn', name: 'Popcorn', c: ['#ff5a5a', '#fff1c9'], blurb: 'Pops into 5 bouncing kernels.', scoring: 'Every kernel scores pegs; kernels pay 30% of a pocket.' },
  { id: 'bowling', name: 'Bowling Ball', c: ['#35206b', '#8b6ce8'], blurb: 'A heavy ball that smashes straight through the pegs.', scoring: 'Hardly bounces; collects everything in its path.' },
  { id: 'zombie', name: 'Zombiezzz', c: ['#7fbf3f', '#d9f5b0'], blurb: 'Spawns up to 4 mini zombies as it hits pegs.', scoring: 'Mini zombies score pegs and pay 25% of a pocket.' },
  { id: 'shield', name: 'Fox Shield', c: ['#6d3de8', '#ff973b'], extra: true, blurb: 'Ignores the next spike peg.', scoring: 'Lasts until it blocks a spike.' },
  { id: 'boost', name: 'Knowledge Boost', c: ['#ffd166', '#ff973b'], extra: true, blurb: 'Answer a bonus question to double the pocket.', scoring: 'Right answer = pocket ×2.' },
];
export const powerById = (id) => POWERS.find((p) => p.id === id);

export const PEGS = [
  { kind: 'normal', label: 'Peg', pts: 10 },
  { kind: 'mint', label: 'Mint', pts: 25 },
  { kind: 'gold', label: 'Gold', pts: 50 },
  { kind: 'vanish', label: 'Bubble', pts: 15, note: 'pops' },
  { kind: 'spike', label: 'Spike', pts: -40 },
];

// question sets (from the prototype). `pic` is the painted picture (art/<pic>.webp); `image` is the symbol shown if the picture is missing
export const SETS = [
  {
    id: 'vocab-a2', title: 'Everyday words', subject: 'English', level: 'A2', icon: '🍎', pic: 'q-apple',
    questions: [
      { id: 'v1', type: 'image', prompt: 'What is this in English?', image: '🍎', pic: 'q-apple', answer: 'apple', also: ['an apple'], explanation: 'An apple is a round fruit. We say “an apple” because it starts with a vowel sound.' },
      { id: 'v2', type: 'text', prompt: 'Opposite of “expensive”?', answer: 'cheap', also: ['inexpensive'], explanation: 'Cheap (or inexpensive) means it does not cost much money.' },
      { id: 'v3', type: 'clue', prompt: 'Guess the word from the clues.', clues: ['It has pages.', 'You read it.', 'You can borrow it from a library.'], answer: 'book', explanation: 'A book has pages and you can read it or borrow it from a library.' },
      { id: 'v4', type: 'image', prompt: 'Name this animal.', image: '🦒', pic: 'q-giraffe', answer: 'giraffe', explanation: 'A giraffe is the tallest animal on land. Spelling: g-i-r-a-f-f-e.' },
      { id: 'v5', type: 'text', prompt: 'Past tense of “go”?', answer: 'went', explanation: '“Go” is irregular: go → went → gone.' },
      { id: 'v6', type: 'clue', prompt: 'Which job is it?', clues: ['Works in a hospital.', 'Helps sick people.', 'Is not a nurse.'], answer: 'doctor', also: ['physician'], explanation: 'A doctor examines and treats patients in a hospital or clinic.' },
      { id: 'v7', type: 'image', prompt: 'What’s the weather like?', image: '🌧️', pic: 'q-rain', answer: 'rainy', also: ['it’s raining', 'rain'], explanation: 'We say “It’s rainy” or “It’s raining”.' },
      { id: 'v8', type: 'text', prompt: 'Plural of “child”?', answer: 'children', explanation: '“Child” has an irregular plural: children.' },
      { id: 'v9', type: 'text', prompt: 'Complete: I’m hungry, I want to ___ something.', answer: 'eat', explanation: 'When you’re hungry you eat. When you’re thirsty you drink.' },
      { id: 'v10', type: 'image', prompt: 'What do you wear on your feet?', image: '👟', pic: 'q-shoes', answer: 'shoes', also: ['trainers', 'sneakers'], explanation: 'Trainers (UK) / sneakers (US) are sports shoes.' },
      { id: 'v11', type: 'clue', prompt: 'Which room?', clues: ['There is a fridge.', 'You cook here.'], answer: 'kitchen', explanation: 'The kitchen is where you cook and keep food.' },
      { id: 'v12', type: 'text', prompt: 'Synonym of “big”?', answer: 'large', also: ['huge', 'enormous'], explanation: 'Large is a common synonym; huge and enormous mean very big.' },
    ],
  },
  {
    id: 'vocab-colors', title: 'Colours & Shapes', subject: 'English', level: 'A1', icon: '🔺', pic: 'q-triangle',
    questions: [
      { id: 'c1', type: 'image', prompt: 'What colour is it?', image: '🟣', pic: 'q-purple', answer: 'purple', explanation: 'Purple is Foxino’s favourite colour!' },
      { id: 'c2', type: 'image', prompt: 'Name this shape.', image: '🔺', pic: 'q-triangle', answer: 'triangle', explanation: 'A triangle has three sides.' },
      { id: 'c3', type: 'text', prompt: 'Red + yellow = ?', answer: 'orange', explanation: 'Mixing red and yellow makes orange.' },
      { id: 'c4', type: 'image', prompt: 'What colour is it?', image: '🟢', pic: 'q-green', answer: 'green', explanation: 'Green — like grass and leaves.' },
      { id: 'c5', type: 'clue', prompt: 'Guess the shape.', clues: ['It is round.', 'It has no corners.'], answer: 'circle', explanation: 'A circle is perfectly round with no corners.' },
      { id: 'c6', type: 'image', prompt: 'Name this shape.', image: '⭐', pic: 'star', answer: 'star', explanation: 'A star usually has five points.' },
    ],
  },
];
