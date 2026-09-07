// src/data/gameContent/buildIt.js
// Build It! content — spatial construction puzzles, tiered by grade band.
// Unlike Recipe Builder (strict step ORDER), slots here can be filled in
// any order; the challenge is matching the right piece to the right slot
// out of a bank that also contains a few decoy pieces that don't belong
// anywhere.
//
// Decoys are same-domain near-misses on purpose: a REAL part/step/term
// from this project's own subject that just isn't one of ITS slots (e.g.
// a real plant cell organelle that isn't one of the four this project
// asks for) — so a kid has to actually know the material, instead of
// spotting a swimming pool has no place in a house and winning by
// elimination. A couple of projects (Build a Sentence, U.S. Government,
// Circuit with Resistor, Career Building Blocks, Personal Finance) already
// had decoys built this way; the rest were fixed to match.

export const BUILD_BANK = {
  'K-2': [
    {
      name: 'Simple House',
      emoji: '🏠',
      slots: [
        { key: 'foundation', label: 'Foundation', correct: { id: 'concrete-base', label: 'Concrete base' } },
        { key: 'walls', label: 'Walls', correct: { id: 'wood-walls', label: 'Wooden walls' } },
        { key: 'roof', label: 'Roof', correct: { id: 'pointed-roof', label: 'Pointed roof' } },
      ],
      decoys: [{ id: 'fence', label: 'Garden fence' }, { id: 'porch', label: 'Front porch' }],
    },
    {
      name: 'Growing Tree',
      emoji: '🌳',
      slots: [
        { key: 'roots', label: 'Roots', correct: { id: 'roots', label: 'Roots that soak up water' } },
        { key: 'trunk', label: 'Trunk', correct: { id: 'trunk', label: 'A thick, tall trunk' } },
        { key: 'branches', label: 'Branches', correct: { id: 'branches', label: 'Branches reaching out' } },
        { key: 'leaves', label: 'Leaves', correct: { id: 'leaves', label: 'Green leaves' } },
      ],
      decoys: [{ id: 'petals', label: 'Flower petals' }, { id: 'bark', label: 'Rough tree bark' }],
    },
  ],

  '3-5': [
    {
      name: 'Two-Story House',
      emoji: '🏠',
      slots: [
        { key: 'foundation', label: 'Foundation', correct: { id: 'foundation', label: 'A poured concrete slab' } },
        { key: 'frame', label: 'Frame', correct: { id: 'frame', label: 'A wooden frame skeleton' } },
        { key: 'walls', label: 'Walls', correct: { id: 'walls', label: 'Walls that enclose each room' } },
        { key: 'roof', label: 'Roof', correct: { id: 'roof', label: 'A shingled roof' } },
        { key: 'windows', label: 'Windows', correct: { id: 'windows', label: 'Windows that let in light' } },
      ],
      decoys: [{ id: 'door', label: 'Front door' }, { id: 'chimney', label: 'Chimney' }],
    },
    {
      name: 'Plant Structure',
      emoji: '🌱',
      slots: [
        { key: 'roots', label: 'Roots', correct: { id: 'p-roots', label: 'Absorb water and nutrients' } },
        { key: 'stem', label: 'Stem', correct: { id: 'p-stem', label: 'Carries water up the plant' } },
        { key: 'leaves', label: 'Leaves', correct: { id: 'p-leaves', label: 'Make food using sunlight' } },
        { key: 'flower', label: 'Flower', correct: { id: 'p-flower', label: 'Attracts pollinators' } },
      ],
      decoys: [
        { id: 'fruit', label: 'Makes seeds so the plant can reproduce' },
        { id: 'bark', label: 'Protects the plant from insects and disease' },
      ],
    },
    {
      name: 'Build a Sentence',
      emoji: '📝',
      slots: [
        { key: 'subject', label: 'Subject', correct: { id: 's-subject', label: 'The dog' } },
        { key: 'verb', label: 'Verb', correct: { id: 's-verb', label: 'chased' } },
        { key: 'object', label: 'Object', correct: { id: 's-object', label: 'the ball' } },
      ],
      decoys: [{ id: 's-adv', label: 'Quickly' }, { id: 's-adj', label: 'Blue' }],
    },
  ],

  '6-8': [
    {
      name: 'Simple Circuit',
      emoji: '🔌',
      slots: [
        { key: 'power', label: 'Power Source', correct: { id: 'battery', label: 'Battery' } },
        { key: 'wire', label: 'Conductor', correct: { id: 'wire', label: 'Copper wire' } },
        { key: 'switch', label: 'Switch', correct: { id: 'switch', label: 'On/off switch' } },
        { key: 'load', label: 'Load', correct: { id: 'bulb', label: 'Light bulb' } },
      ],
      decoys: [{ id: 'resistor', label: 'Resistor' }, { id: 'fuse', label: 'Fuse' }],
    },
    {
      name: 'Plant Cell',
      emoji: '🧫',
      slots: [
        { key: 'wall', label: 'Cell Wall', correct: { id: 'c-wall', label: 'Rigid outer layer for support' } },
        { key: 'nucleus', label: 'Nucleus', correct: { id: 'c-nucleus', label: 'Holds the cell\'s DNA' } },
        { key: 'chloroplast', label: 'Chloroplast', correct: { id: 'c-chloroplast', label: 'Site of photosynthesis' } },
        { key: 'vacuole', label: 'Vacuole', correct: { id: 'c-vacuole', label: 'Stores water and nutrients' } },
      ],
      decoys: [
        { id: 'mitochondria', label: 'Mitochondria — makes energy for the cell' },
        { id: 'membrane', label: 'Cell membrane — controls what enters and exits' },
      ],
    },
    {
      name: 'U.S. Government',
      emoji: '🏛️',
      slots: [
        { key: 'legislative', label: 'Legislative Branch', correct: { id: 'congress', label: 'Congress — makes laws' } },
        { key: 'executive', label: 'Executive Branch', correct: { id: 'president', label: 'President — enforces laws' } },
        { key: 'judicial', label: 'Judicial Branch', correct: { id: 'court', label: 'Supreme Court — interprets laws' } },
      ],
      decoys: [{ id: 'mayor', label: 'Local mayor' }, { id: 'council', label: 'City council' }],
    },
  ],

  '9-12': [
    {
      name: 'Circuit with Resistor',
      emoji: '🔌',
      slots: [
        { key: 'power', label: 'Power Source', correct: { id: 'r-battery', label: 'Battery' } },
        { key: 'conductor', label: 'Conductor', correct: { id: 'r-wire', label: 'Copper wire' } },
        { key: 'resistor', label: 'Resistor', correct: { id: 'r-resistor', label: 'Limits current flow' } },
        { key: 'switch', label: 'Switch', correct: { id: 'r-switch', label: 'On/off switch' } },
        { key: 'load', label: 'Load', correct: { id: 'r-bulb', label: 'Light bulb' } },
        { key: 'ground', label: 'Ground', correct: { id: 'r-ground', label: 'Completes the return path' } },
      ],
      decoys: [{ id: 'capacitor', label: 'Capacitor' }, { id: 'transformer', label: 'Transformer' }],
    },
    {
      name: 'Career Building Blocks',
      emoji: '💼',
      slots: [
        { key: 'education', label: 'Education', correct: { id: 'k-education', label: 'Building relevant skills and knowledge' } },
        { key: 'resume', label: 'Résumé', correct: { id: 'k-resume', label: 'A summary of your experience' } },
        { key: 'networking', label: 'Networking', correct: { id: 'k-network', label: 'Building professional relationships' } },
        { key: 'interview', label: 'Interview', correct: { id: 'k-interview', label: 'Showing you fit the role' } },
        { key: 'followup', label: 'Follow-up', correct: { id: 'k-followup', label: 'A thank-you note after the interview' } },
      ],
      decoys: [{ id: 'ghost', label: 'Ghosting the employer' }, { id: 'ignore', label: 'Ignoring feedback' }],
    },
    {
      name: 'Personal Finance Foundation',
      emoji: '🏦',
      slots: [
        { key: 'emergency', label: 'Emergency Fund', correct: { id: 'f-emergency', label: 'Cash saved for surprises' } },
        { key: 'budget', label: 'Budget', correct: { id: 'f-budget', label: 'A plan for income and expenses' } },
        { key: 'debt', label: 'Debt Payoff', correct: { id: 'f-debt', label: 'Paying down what you owe' } },
        { key: 'investing', label: 'Investing', correct: { id: 'f-investing', label: 'Growing money over the long term' } },
        { key: 'insurance', label: 'Insurance', correct: { id: 'f-insurance', label: 'Protection against big losses' } },
      ],
      decoys: [{ id: 'impulse', label: 'Impulse spending' }, { id: 'payday', label: 'Payday loans' }],
    },
  ],
};

export default BUILD_BANK;
