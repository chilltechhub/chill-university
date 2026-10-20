// src/data/builds.js
// The Studio's Builds: something real the app makes WITH someone, then
// hands over one part at a time (src/logic/builds.js, the Studio screens).
//
// The loop: get it (the app builds a working thing from a couple of
// answers) → take it apart (each part has a 30-second "see it, change it"
// lesson) → unlock it (understanding a part opens control of it; passing
// its one-question check opens the upgrades) → take it home (export the
// real file).
//
// ─── shape ──────────────────────────────────────────────────────────────────
//
//   kind      { id, label, medium, icon, blurb, asks, parts, deeper? }
//   asks      the 1-2 questions the app needs to make it. `fromDream` fills
//             the box from the Dream layer when it's still empty.
//   part      { id, label, icon, start, options, lesson }
//   start     the option the app picks for them.
//   option    { id, label, level, ...whatever the renderer reads }
//             level 1 opens when they've looked at the part; level 2 when
//             they've passed its check. The start option is always level 1.
//   lesson    { says, tryIt, check: { q, options, answer } }
//             `says` is under 40 words. **bold** is the one idea to keep.
//   deeper    an optional "go deeper" link into the rest of the app.
//   trophy    the room item (src/data/sceneArt.js) that mastering every
//             part of a Build of this kind puts in their Decorate tray.
//   option.fromPet  the player's own pet stands in (src/logic/studio.js
//             petLook): the app makes it with YOUR companion in it.
//   option.fromDream  filled from their Dream when they have one.
//
// Nothing here is read from the network yet. When the Studio proves
// itself, this moves to app_content like the Finds so it can change
// without a build.
//
// Hex colours in this file are the Builds' own palettes (they render
// inside the made thing, not the app), so they don't follow the theme.

export const BUILD_KINDS = [
  /* ── A page ─────────────────────────────────────────────────────────── */
  {
    id: 'page',
    label: 'A page about you',
    medium: 'Web',
    icon: 'globe-outline',
    blurb: 'Your own web page. A real file that opens in any browser.',
    trophy: { art: 'trophyPage', name: 'Page Tome' },
    asks: [
      { key: 'name', label: 'Your first name', max: 40, placeholder: 'e.g. Sam', hint: 'A first name is plenty.' },
      { key: 'line', label: 'One line about you', max: 90, placeholder: 'e.g. Learning to fix bikes. Building a repair shop.', fromDream: 'becoming' },
    ],
    parts: [
      {
        id: 'layout', label: 'Layout', icon: 'grid-outline', start: 'center',
        options: [
          { id: 'center', label: 'Centered card', level: 1 },
          { id: 'split', label: 'Side by side', level: 1 },
          { id: 'bento', label: 'Bento grid', level: 2 },
        ],
        lesson: {
          says: 'Layout is **where things sit**. Most pages use an invisible grid of rows and columns, and every block snaps to it.',
          tryIt: 'Switch the layout and watch every block move.',
          check: { q: 'What decides where things sit on a page?', options: ['The layout grid', 'The font you pick', 'The colour scheme'], answer: 0 },
        },
      },
      {
        id: 'colors', label: 'Colours', icon: 'color-palette-outline', start: 'calm',
        options: [
          { id: 'calm', label: 'Calm', level: 1, bg: '#f6f5f1', card: '#ffffff', ink: '#1f2328', soft: '#5c6370', accent: '#2f7d6d' },
          { id: 'night', label: 'Night', level: 1, bg: '#11151c', card: '#1a202b', ink: '#eef1f5', soft: '#9aa4b2', accent: '#7cc4b5' },
          { id: 'sunrise', label: 'Sunrise', level: 1, bg: '#fff4ea', card: '#ffffff', ink: '#2a1d14', soft: '#7a5c48', accent: '#e0663a' },
          { id: 'neon', label: 'Neon', level: 2, bg: '#0b0618', card: '#160d2e', ink: '#f4ecff', soft: '#b6a3d9', accent: '#ff3fb4' },
          { id: 'paper', label: 'Paper', level: 2, bg: '#efe8d8', card: '#f8f3e7', ink: '#2b2620', soft: '#6b6153', accent: '#8a3b2a' },
        ],
        lesson: {
          says: 'Good palettes use **one strong colour** and lots of quiet ones. Text needs strong contrast with what is behind it, or nobody can read it.',
          tryIt: 'Try a light palette, then a dark one.',
          check: { q: 'Why does text need contrast with its background?', options: ['It looks a lot fancier', 'So people can read it', 'The page loads faster'], answer: 1 },
        },
      },
      {
        id: 'type', label: 'Fonts', icon: 'text-outline', start: 'sans',
        options: [
          { id: 'sans', label: 'Modern (sans)', level: 1, head: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', body: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', track: '-0.01em', weight: 700 },
          { id: 'serif', label: 'Classic (serif)', level: 1, head: 'Georgia, Times New Roman, serif', body: 'Georgia, Times New Roman, serif', track: '0', weight: 700 },
          { id: 'mono', label: 'Techy (mono)', level: 1, head: 'ui-monospace, Menlo, Consolas, monospace', body: 'ui-monospace, Menlo, Consolas, monospace', track: '0', weight: 700 },
          { id: 'display', label: 'Poster (big + bold)', level: 2, head: 'Impact, Arial Black, system-ui, sans-serif', body: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', track: '-0.01em', weight: 900, upper: true },
        ],
        lesson: {
          says: 'Fonts have voices. **Serif** feels classic, **sans** feels modern, **mono** feels techy. Pros use one for headings and maybe one more for text. Never five.',
          tryIt: 'Give your page each voice and see which one sounds like you.',
          check: { q: 'How many fonts does a clean page usually use?', options: ['One or two', 'Four or five', 'As many as fit'], answer: 0 },
        },
      },
      {
        id: 'block', label: 'Extra block', icon: 'cube-outline', start: 'links',
        options: [
          { id: 'links', label: 'Links', level: 1 },
          { id: 'quote', label: 'A quote', level: 1 },
          { id: 'dream', label: 'Where I’m headed', level: 1, fromDream: true },
          { id: 'skills', label: 'What I’m learning', level: 2 },
        ],
        lesson: {
          says: 'A **component** is a reusable block. Real sites are stacks of them: a nav bar, a card, a button. Swap one and the rest stays put.',
          tryIt: 'Swap the extra block for a different one.',
          check: { q: 'What is a component?', options: ['A whole website at once', 'A reusable block', 'A special kind of font'], answer: 1 },
        },
      },
    ],
  },

  /* ── A game ─────────────────────────────────────────────────────────── */
  {
    id: 'game',
    label: 'A game',
    medium: 'Game',
    icon: 'game-controller-outline',
    blurb: 'A catch game starring your pet. Play it, change it, send it.',
    trophy: { art: 'trophyGame', name: 'Game Key' },
    asks: [
      { key: 'name', label: 'Name your game', max: 40, placeholder: 'e.g. Snack Attack' },
    ],
    parts: [
      {
        id: 'hero', label: 'Player', icon: 'happy-outline', start: 'pet',
        options: [
          { id: 'pet', label: 'Your pet', level: 1, fromPet: true, emoji: '🐱', catches: '🐟' },
          { id: 'cat', label: '🐱 Cat', level: 1, emoji: '🐱', catches: '🐟' },
          { id: 'rocket', label: '🚀 Rocket', level: 1, emoji: '🚀', catches: '⭐' },
          { id: 'basket', label: '🧺 Basket', level: 1, emoji: '🧺', catches: '🍎' },
          { id: 'dragon', label: '🐉 Dragon', level: 2, emoji: '🐉', catches: '💎' },
        ],
        lesson: {
          says: 'The thing you control is a **sprite**: a picture drawn at an x,y spot. The game redraws it about 60 times a second. That’s all animation is.',
          tryIt: 'Swap the player, then play a round.',
          check: { q: 'How does a game make a sprite look like it moves?', options: ['It redraws it, fast', 'It plays a short video', 'The phone shakes it'], answer: 0 },
        },
      },
      {
        id: 'speed', label: 'Speed', icon: 'speedometer-outline', start: 'normal',
        options: [
          { id: 'slow', label: 'Slow', level: 1, px: 4 },
          { id: 'normal', label: 'Normal', level: 1, px: 7 },
          { id: 'fast', label: 'Fast', level: 1, px: 11 },
          { id: 'zoom', label: 'Zoom', level: 2, px: 16 },
        ],
        lesson: {
          says: 'Speed is a **variable**: a named number the game reads every frame. Change one number and the whole game feels different.',
          tryIt: 'Make the player slow, then fast. Feel the difference.',
          check: { q: 'What is a variable in a game?', options: ['A bug in the code', 'A named number', 'One level of the game'], answer: 1 },
        },
      },
      {
        id: 'challenge', label: 'Challenge', icon: 'trending-up-outline', start: 'steady',
        options: [
          { id: 'gentle', label: 'Gentle', level: 1, every: 70, fall: 2.2, ramp: 0 },
          { id: 'steady', label: 'Steady', level: 1, every: 48, fall: 3.2, ramp: 0 },
          { id: 'ramp', label: 'Gets harder', level: 2, every: 60, fall: 2.4, ramp: 1 },
        ],
        lesson: {
          says: 'Good games start easy and get harder slowly. That’s a **difficulty curve**. Too flat is boring, too steep and people quit.',
          tryIt: 'Try gentle, then steady. Which one would you play twice?',
          check: { q: 'What makes a good difficulty curve?', options: ['Hard from the very start', 'It never changes at all', 'Easy, then slowly harder'], answer: 2 },
        },
      },
      {
        id: 'goal', label: 'Win rule', icon: 'trophy-outline', start: 'catch20',
        options: [
          { id: 'catch20', label: 'Catch 20', level: 1, rule: 'catch', target: 20 },
          { id: 'survive', label: 'Miss 3 and out', level: 1, rule: 'lives', target: 3 },
          { id: 'endless', label: 'High score', level: 2, rule: 'endless', target: 0 },
        ],
        lesson: {
          says: 'Every game needs a **win rule** or a lose rule. Without one it’s a toy, not a game. The rule is what gives a round its tension.',
          tryIt: 'Switch the rule and play once each way.',
          check: { q: 'What turns a toy into a game?', options: ['Much better graphics', 'A rule to win or lose', 'Loud sound effects'], answer: 1 },
        },
      },
    ],
  },

  /* ── A beat ─────────────────────────────────────────────────────────── */
  {
    id: 'beat',
    label: 'A beat',
    medium: 'Music',
    icon: 'musical-notes-outline',
    blurb: 'A looping beat with drums and a melody. Change how it feels.',
    trophy: { art: 'trophyBeat', name: 'Beat Elixir' },
    asks: [
      { key: 'name', label: 'Name your track', max: 40, placeholder: 'e.g. Late Bus Home' },
    ],
    parts: [
      {
        id: 'tempo', label: 'Tempo', icon: 'pulse-outline', start: 'mid',
        options: [
          { id: 'chill', label: 'Chill · 80', level: 1, bpm: 80 },
          { id: 'mid', label: 'Groove · 100', level: 1, bpm: 100 },
          { id: 'dance', label: 'Dance · 124', level: 1, bpm: 124 },
          { id: 'rush', label: 'Rush · 150', level: 2, bpm: 150 },
        ],
        lesson: {
          says: '**Tempo** is speed, counted in beats per minute (BPM). Around 80 feels laid back. Past 120, people start to move.',
          tryIt: 'Play it at 80, then at 124.',
          check: { q: 'What does BPM measure?', options: ['How loud it is', 'How fast it is', 'How long it is'], answer: 1 },
        },
      },
      {
        id: 'drums', label: 'Drums', icon: 'radio-outline', start: 'four',
        options: [
          { id: 'four', label: 'Four on the floor', level: 1, kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14] },
          { id: 'boombap', label: 'Boom bap', level: 1, kick: [0, 7, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
          { id: 'trap', label: 'Rolling hats', level: 2, kick: [0, 11], snare: [8], hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
        ],
        lesson: {
          says: 'A drum **pattern** is a grid of 16 boxes, one bar of music. A kick on every 4th box is the heartbeat of dance music. Move the hits, change the style.',
          tryIt: 'Swap the pattern and listen to where the kick lands.',
          check: { q: 'In a 16-box bar, a kick on every 4th box is…', options: ['Four on the floor', 'A minor melody', 'A slower tempo'], answer: 0 },
        },
      },
      {
        id: 'scale', label: 'Notes', icon: 'musical-note-outline', start: 'minor',
        options: [
          { id: 'major', label: 'Bright (major)', level: 1, steps: [0, 2, 4, 5, 7, 9, 11, 12] },
          { id: 'minor', label: 'Moody (minor)', level: 1, steps: [0, 2, 3, 5, 7, 8, 10, 12] },
          { id: 'penta', label: 'No wrong notes (pentatonic)', level: 2, steps: [0, 2, 4, 7, 9, 12, 14, 16] },
        ],
        lesson: {
          says: 'A **scale** is the set of notes that sound good together. Major sounds bright, minor sounds moody. Same melody, different feeling.',
          tryIt: 'Play the melody bright, then moody.',
          check: { q: 'Which scale usually sounds moody?', options: ['Major', 'Minor', 'Both'], answer: 1 },
        },
      },
      {
        id: 'sound', label: 'Sound', icon: 'volume-high-outline', start: 'triangle',
        options: [
          { id: 'sine', label: 'Soft', level: 1, wave: 'sine' },
          { id: 'triangle', label: 'Warm', level: 1, wave: 'triangle' },
          { id: 'square', label: 'Retro game', level: 1, wave: 'square' },
          { id: 'sawtooth', label: 'Buzzy synth', level: 2, wave: 'sawtooth' },
        ],
        lesson: {
          says: 'Every sound is a **wave**. Its shape is why a flute and an old game console sound different, even on the same note.',
          tryIt: 'Play the same melody soft, then retro.',
          check: { q: 'What makes two instruments on the same note sound different?', options: ['The wave shape', 'The tempo used', 'The volume knob'], answer: 0 },
        },
      },
    ],
  },

  /* ── A business ─────────────────────────────────────────────────────── */
  {
    id: 'business',
    label: 'A small business',
    medium: 'Business',
    icon: 'storefront-outline',
    blurb: 'A one-page offer for something you could sell. Test it on real people.',
    trophy: { art: 'trophyBusiness', name: 'First Coin Purse' },
    asks: [
      { key: 'idea', label: 'What could you sell?', max: 60, placeholder: 'e.g. Bike repairs' },
      { key: 'who', label: 'Who is it for?', max: 60, placeholder: 'e.g. students on campus' },
    ],
    deeper: { label: 'Business Foundations class', route: 'Training', params: { screen: 'ClassesStack' } },
    parts: [
      {
        id: 'headline', label: 'Headline', icon: 'megaphone-outline', start: 'outcome',
        options: [
          { id: 'outcome', label: 'The result', level: 1 },
          { id: 'problem', label: 'Problem → fix', level: 1 },
          { id: 'beforeafter', label: 'Before / after', level: 2 },
        ],
        lesson: {
          says: 'People buy **outcomes**, not features. A good headline says what changes for them, in their words, not yours.',
          tryIt: 'Try each headline. Which would make you stop scrolling?',
          check: { q: 'What should a headline sell?', options: ['All of your skills', 'What changes for them', 'Your lowest price'], answer: 1 },
        },
      },
      {
        id: 'price', label: 'How you charge', icon: 'cash-outline', start: 'perjob',
        options: [
          { id: 'perjob', label: 'Per job', level: 1 },
          { id: 'monthly', label: 'Monthly plan', level: 1 },
          { id: 'firstfree', label: 'First one free', level: 2 },
        ],
        lesson: {
          says: 'How you charge is your **business model**. Same skill, different money: per job is simple, a monthly plan is steady, a free first try lowers the risk.',
          tryIt: 'Switch models and read the offer as a customer.',
          check: { q: 'What is a business model?', options: ['Your logo and colours', 'How you make money', 'A big spreadsheet'], answer: 1 },
        },
      },
      {
        id: 'proof', label: 'Why trust you', icon: 'shield-checkmark-outline', start: 'story',
        options: [
          { id: 'story', label: 'Your story', level: 1 },
          { id: 'promise', label: 'A promise', level: 1 },
          { id: 'result', label: 'A real result', level: 2 },
        ],
        lesson: {
          says: 'People buy from people they **trust**. One honest line of proof beats ten big claims. Never invent one.',
          tryIt: 'Swap the proof. Which one would you believe?',
          check: { q: 'What builds trust fastest?', options: ['Lots of big claims', 'One honest proof', 'Exclamation marks!'], answer: 1 },
        },
      },
      {
        id: 'action', label: 'Next step', icon: 'arrow-forward-circle-outline', start: 'message',
        options: [
          { id: 'message', label: 'Message me', level: 1 },
          { id: 'book', label: 'Book a time', level: 1 },
          { id: 'waitlist', label: 'Join the list', level: 2 },
        ],
        lesson: {
          says: 'Every page needs **one** next step, the call to action. Two buttons is like no buttons: people freeze and leave.',
          tryIt: 'Change the next step and picture tapping it.',
          check: { q: 'How many main buttons should an offer page have?', options: ['One', 'Three', 'Five'], answer: 0 },
        },
      },
    ],
  },
];

export const BUILD_KIND_MAP = Object.fromEntries(BUILD_KINDS.map(k => [k.id, k]));
