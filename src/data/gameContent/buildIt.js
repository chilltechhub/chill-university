// src/data/gameContent/buildIt.js
// Build It! content — spatial construction puzzles, tiered by grade band.
// Unlike Recipe Builder (strict step ORDER), slots here can be filled in
// any order; the challenge is matching the right piece to the right slot
// out of a bank that also contains a few decoy pieces that don't belong
// anywhere.
//
// Slots are NAMED (Roots, Switch, Budget) and pieces DESCRIBE a job ("soaks
// up water from the soil"), so a match means knowing what each part does.
// A piece never repeats its slot's name; that turned it into word
// matching ("Roof" goes with "Pointed roof").
//
// Decoys describe the job of a REAL related part that just isn't one of
// this project's slots (a chimney in the house, a fuse in the circuit, a
// cover letter next to the résumé). They must not also fit a slot: an
// earlier version offered "Rough tree bark" as wrong for a tree and "Makes
// seeds" as wrong next to a Flower slot, which were both actually right.

export const BUILD_BANK = {
  'K-2': [
    {
      name: 'Simple House',
      emoji: '🏠',
      slots: [
        { key: 'foundation', label: 'Foundation', correct: { id: 'h-foundation', label: 'Holds the house steady on the ground' } },
        { key: 'walls', label: 'Walls', correct: { id: 'h-walls', label: 'Keeps the wind out on every side' } },
        { key: 'roof', label: 'Roof', correct: { id: 'h-roof', label: 'Keeps the rain off the top' } },
      ],
      decoys: [{ id: 'h-door', label: 'Lets people in and out' }, { id: 'h-window', label: 'Lets the sunlight in' }],
    },
    {
      name: 'Growing Tree',
      emoji: '🌳',
      slots: [
        { key: 'roots', label: 'Roots', correct: { id: 't-roots', label: 'Soak up water from the soil' } },
        { key: 'trunk', label: 'Trunk', correct: { id: 't-trunk', label: 'Holds the whole tree up tall' } },
        { key: 'branches', label: 'Branches', correct: { id: 't-branches', label: 'Spread the leaves out wide' } },
        { key: 'leaves', label: 'Leaves', correct: { id: 't-leaves', label: 'Make food from sunlight' } },
      ],
      decoys: [{ id: 't-bark', label: 'Covers the trunk like skin' }, { id: 't-seed', label: 'Grows into a brand-new tree' }],
    },
    {
      name: 'Bicycle',
      emoji: '🚲',
      slots: [
        { key: 'wheels', label: 'Wheels', correct: { id: 'b-wheels', label: 'Roll along the ground' } },
        { key: 'pedals', label: 'Pedals', correct: { id: 'b-pedals', label: 'Your feet push them to go' } },
        { key: 'handlebars', label: 'Handlebars', correct: { id: 'b-handlebars', label: 'Steer where you are going' } },
        { key: 'seat', label: 'Seat', correct: { id: 'b-seat', label: 'Where you sit while riding' } },
      ],
      decoys: [{ id: 'b-bell', label: 'Rings to warn people' }, { id: 'b-light', label: 'Lights the road at night' }],
    },
  ],

  '3-5': [
    {
      name: 'Two-Story House',
      emoji: '🏠',
      slots: [
        { key: 'foundation', label: 'Foundation', correct: { id: 'foundation', label: 'Spreads the weight into the ground' } },
        { key: 'frame', label: 'Frame', correct: { id: 'frame', label: 'The skeleton everything attaches to' } },
        { key: 'walls', label: 'Walls', correct: { id: 'walls', label: 'Divide the inside into rooms' } },
        { key: 'roof', label: 'Roof', correct: { id: 'roof', label: 'Sheds rain and snow' } },
        { key: 'windows', label: 'Windows', correct: { id: 'windows', label: 'Let in light and fresh air' } },
      ],
      decoys: [{ id: 'chimney', label: 'Carries smoke out of the fireplace' }, { id: 'plumbing', label: 'Moves water in and out' }],
    },
    {
      name: 'Plant Structure',
      emoji: '🌱',
      slots: [
        { key: 'roots', label: 'Roots', correct: { id: 'p-roots', label: 'Absorb water and nutrients' } },
        { key: 'stem', label: 'Stem', correct: { id: 'p-stem', label: 'Carries water up the plant' } },
        { key: 'leaves', label: 'Leaves', correct: { id: 'p-leaves', label: 'Make food using sunlight' } },
        { key: 'flower', label: 'Flower', correct: { id: 'p-flower', label: 'Attracts pollinators like bees' } },
      ],
      decoys: [
        { id: 'fruit', label: 'Protects seeds and helps spread them' },
        { id: 'tuber', label: 'Stores extra food underground' },
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
      decoys: [{ id: 's-adv', label: 'quickly' }, { id: 's-adj', label: 'blue' }],
    },
  ],

  '6-8': [
    {
      name: 'Simple Circuit',
      emoji: '🔌',
      slots: [
        { key: 'power', label: 'Power Source', correct: { id: 'battery', label: 'Pushes charge around the loop' } },
        { key: 'wire', label: 'Conductor', correct: { id: 'wire', label: 'Gives current a path to flow' } },
        { key: 'switch', label: 'Switch', correct: { id: 'switch', label: 'Opens or closes the loop' } },
        { key: 'load', label: 'Load', correct: { id: 'bulb', label: 'Turns electricity into light' } },
      ],
      decoys: [{ id: 'resistor', label: 'Limits how much current flows' }, { id: 'fuse', label: 'Melts to cut power if overloaded' }],
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
        { id: 'mitochondria', label: 'Releases energy from sugar' },
        { id: 'membrane', label: 'Controls what enters and exits' },
      ],
    },
    {
      name: 'U.S. Government',
      emoji: '🏛️',
      slots: [
        { key: 'legislative', label: 'Legislative Branch', correct: { id: 'congress', label: 'Congress' } },
        { key: 'executive', label: 'Executive Branch', correct: { id: 'president', label: 'The President' } },
        { key: 'judicial', label: 'Judicial Branch', correct: { id: 'court', label: 'The Supreme Court' } },
      ],
      decoys: [{ id: 'governor', label: 'State governors' }, { id: 'council', label: 'City councils' }],
    },
  ],

  '9-12': [
    {
      name: 'Circuit with Resistor',
      emoji: '🔌',
      slots: [
        { key: 'power', label: 'Power Source', correct: { id: 'r-battery', label: 'Supplies the voltage' } },
        { key: 'conductor', label: 'Conductor', correct: { id: 'r-wire', label: 'Carries current between parts' } },
        { key: 'resistor', label: 'Resistor', correct: { id: 'r-resistor', label: 'Limits current flow' } },
        { key: 'switch', label: 'Switch', correct: { id: 'r-switch', label: 'Breaks or completes the loop' } },
        { key: 'load', label: 'Load', correct: { id: 'r-bulb', label: 'Turns energy into light or motion' } },
        { key: 'ground', label: 'Ground', correct: { id: 'r-ground', label: 'Completes the return path' } },
      ],
      decoys: [{ id: 'capacitor', label: 'Stores charge, then releases it' }, { id: 'transformer', label: 'Steps voltage up or down' }],
    },
    {
      name: 'Career Building Blocks',
      emoji: '💼',
      slots: [
        { key: 'education', label: 'Education', correct: { id: 'k-education', label: 'Building relevant skills and knowledge' } },
        { key: 'resume', label: 'Résumé', correct: { id: 'k-resume', label: 'A one-page summary of your experience' } },
        { key: 'networking', label: 'Networking', correct: { id: 'k-network', label: 'Building professional relationships' } },
        { key: 'interview', label: 'Interview', correct: { id: 'k-interview', label: 'Showing in person that you fit the role' } },
        { key: 'followup', label: 'Follow-up', correct: { id: 'k-followup', label: 'A thank-you note after the interview' } },
      ],
      decoys: [{ id: 'cover', label: 'A letter on why you fit this job' }, { id: 'refs', label: 'People who can vouch for your work' }],
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
      decoys: [{ id: 'sinking', label: 'Cash saved for a planned purchase' }, { id: 'credit', label: 'A score of how you handle credit' }],
    },
  ],
};

export default BUILD_BANK;
