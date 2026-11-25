// Blinko (forest version: Hazel the squirrel and the nuts) — rules, numbers and question sets.
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
export const TEAM_NAMES = ['Fox Squad', 'Star Crew', 'Robot Brains', 'Rocket Pix', 'Acorn Gang', 'Owl Pals', 'Leaf Team', 'Berry Bunch'];
export const TEAM_CREW = ['foxino', 'stella', 'rob', 'pix', 'charlie', 'gummy', 'penguin', 'otter'];

export const POWERS = [
  { id: 'dynamite', name: 'Pinecone Pop', c: ['#b5651d', '#ffd59a'], blurb: 'Wakes up on the first peg, then POP! A shower of seeds clears the pegs around it.', scoring: 'Every peg in the pop pays out.' },
  { id: 'yoyo', name: 'Yo-Yo Nut', c: ['#c98a4b', '#ffe2b8'], blurb: 'Falls twice: pulled back up on its string, then dropped again.', scoring: 'Two baskets; the pegs light up again for drop 2.' },
  { id: 'bouncy', name: 'Bouncy Peanut', c: ['#e3a93b', '#fff1cc'], blurb: 'A super-springy peanut that bounces much higher.', scoring: 'Reaches more pegs.' },
  { id: 'egg', name: 'Robin’s Egg', c: ['#6fcbe0', '#e9fbff'], blurb: 'Cracks on a bump into a bouncy chick and two shell pieces.', scoring: 'Chick + shells all score; shells pay half a basket.' },
  { id: 'turtle', name: 'Hedgehog', c: ['#a0704a', '#f3d9b8'], blurb: 'Rolls up in a ball. Every peg it hits tickles the other teams.', scoring: 'You keep the peg points; the other teams lose 3 per hit (max 30).' },
  { id: 'cow', name: 'Coconut', c: ['#8a5a32', '#fff7ec'], blurb: 'Coconut milk splashes out on every bump and hits extra pegs.', scoring: 'Up to 6 splashes × 3 drops.' },
  { id: 'balloon', name: 'Dandelion', c: ['#9fd8ff', '#ffffff'], blurb: 'A floaty dandelion puff that drifts and bobs, with a trail of seeds.', scoring: 'A long, winding journey.' },
  { id: 'puffer', name: 'Puffball', c: ['#e8b85a', '#fff3d6'], blurb: 'A mushroom puffball that puffs up bigger as it falls and hits several pegs at once.', scoring: 'Bigger and bigger.' },
  { id: 'oinky', name: 'Nut Bank', c: ['#ff9fb7', '#ffe0e8'], blurb: 'A piggy money box that drops a golden acorn on every bump.', scoring: 'Every golden acorn adds 5 to the turn.' },
  { id: 'shark', name: 'Firefly', c: ['#ffcf2e', '#fff8c8'], blurb: 'A glowing firefly that zaps nearby pegs with little beams of light.', scoring: 'Up to 8 light zaps.' },
  { id: 'yinyang', name: 'Twin Cherries', c: ['#e8304a', '#ffd0d6'], blurb: 'Two cherries at once, from mirrored spots.', scoring: 'Both results count.' },
  { id: 'popcorn', name: 'Sunflower', c: ['#ffc21e', '#fff1c9'], blurb: 'Pops into 5 bouncing sunflower seeds.', scoring: 'Every seed scores pegs; seeds pay 30% of a basket.' },
  { id: 'bowling', name: 'Mighty Walnut', c: ['#6b4423', '#d9a877'], blurb: 'A big, heavy walnut that rolls straight through the pegs.', scoring: 'Hardly bounces; collects everything in its path.' },
  { id: 'zombie', name: 'Ladybugs', c: ['#e8303a', '#ffd0d0'], blurb: 'A mummy ladybug: up to 4 baby ladybugs join in as it hits pegs.', scoring: 'The babies score pegs and pay 25% of a basket.' },
  { id: 'shield', name: 'Acorn Helmet', c: ['#8a5a2b', '#ffd166'], extra: true, blurb: 'Keeps your nut safe from the next prickly thistle.', scoring: 'Lasts until it blocks a thistle.' },
  { id: 'boost', name: 'Wise Owl', c: ['#b07a3c', '#ffe9a8'], extra: true, blurb: 'Answer a bonus question to double the basket.', scoring: 'Right answer = basket × 2.' },
];
export const powerById = (id) => POWERS.find((p) => p.id === id);

export const PEGS = [
  { kind: 'normal', label: 'Berry', pts: 10 },
  { kind: 'mint', label: 'Clover', pts: 25 },
  { kind: 'gold', label: 'Gold', pts: 50 },
  { kind: 'vanish', label: 'Dewdrop', pts: 15, note: 'pops' },
  { kind: 'spike', label: 'Thistle', pts: -40 },
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
