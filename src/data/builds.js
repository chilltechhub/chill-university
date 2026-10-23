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
//             the box from the Dream layer when it's still empty. `fill`
//             is what the welcome's "Make it for me" puts in; a first-name
//             ask has none, so the person types their own.
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
//   growNext  the first real step once it grows into their own Workshop
//             project ("Grow it into a project" on the Build screen).
//   freeTools where to take it next WITHOUT paying: free (mostly open-source)
//             software that does what people usually pay license fees for.
//             { name, what, url, adult? }. `adult` hides one from under-18s
//             (its own terms say so).
//
// The belief behind freeTools (docs/north-star.md, in the founder's words):
// "non-engineer people can finally witness what awesome things software
// can do for them if they don't have to pay extensive money and license
// costs for it."
//
// Nothing here is read from the network yet. When the Studio proves
// itself, this moves to app_content like the Finds so it can change
// without a build.
//
// Hex colours in this file are the Builds' own palettes (they render
// inside the made thing, not the app), so they don't follow the theme.

export const BUILD_KINDS = [
  /* ── A portfolio page (the founder's Descartes builder) ─────────────── */
  // The welcome's flagship project. Its words are answers; its bio,
  // skills, project cards, sections, quote and contact are content
  // (src/logic/builds.js normalizeContent), edited freely in the builder
  // (src/components/PortfolioEditor.js). Its look is parts, like any Build.
  {
    id: 'page',
    label: 'A portfolio page',
    medium: 'Web',
    icon: 'globe-outline',
    blurb: 'Your own website: hero, skills, projects. Every part yours to change.',
    trophy: { art: 'trophyPage', name: 'Page Tome' },
    growNext: 'Add one real project card: something you made or are making',
    freeTools: [
      { name: 'VS Code', what: 'A free code editor. Open your page’s file and change anything in it.', url: 'https://code.visualstudio.com' },
      { name: 'GitHub Pages', what: 'Free hosting: put a page like yours on the web for anyone to visit.', url: 'https://pages.github.com' },
      { name: 'Netlify Drop', what: 'Drag your file onto the page and it’s online. Free.', url: 'https://app.netlify.com/drop', adult: true },
    ],
    asks: [
      { key: 'name', label: 'Your name', max: 40, placeholder: 'e.g. Sam Rivera', hint: 'A first name is plenty.' },
      { key: 'line', label: 'Headline or role', max: 90, placeholder: 'e.g. Student & Web Developer', fromDream: 'becoming' },
    ],
    parts: [
      {
        id: 'colors', label: 'Colours', icon: 'color-palette-outline', start: 'calm',
        options: [
          { id: 'calm', label: 'Calm', level: 1, bg: '#f6f5f1', card: '#ffffff', ink: '#1f2328', soft: '#5c6370', accent: '#2f7d6d' },
          { id: 'night', label: 'Night', level: 1, bg: '#11151c', card: '#1a202b', ink: '#eef1f5', soft: '#9aa4b2', accent: '#7cc4b5' },
          { id: 'sunrise', label: 'Sunrise', level: 1, bg: '#fff4ea', card: '#ffffff', ink: '#2a1d14', soft: '#7a5c48', accent: '#e0663a' },
          { id: 'synth', label: 'Dark Synth', level: 1, bg: '#0b0f17', card: '#111827', ink: '#f8fafc', soft: '#94a3b8', accent: '#818cf8' },
          { id: 'slate', label: 'Minimal Slate', level: 1, bg: '#090a0f', card: '#12141d', ink: '#f1f5f9', soft: '#94a3b8', accent: '#cbd5e1' },
          { id: 'emerald', label: 'Cyber Emerald', level: 1, bg: '#02120d', card: '#062018', ink: '#ecfdf5', soft: '#86b7a3', accent: '#10b981' },
          { id: 'editorial', label: 'Warm Editorial', level: 1, bg: '#140f0c', card: '#201814', ink: '#fdf6ec', soft: '#c4a98a', accent: '#f59e0b' },
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
          { id: 'mono', label: 'Developer (mono)', level: 1, head: 'ui-monospace, Menlo, Consolas, monospace', body: 'ui-monospace, Menlo, Consolas, monospace', track: '0', weight: 700 },
          { id: 'display', label: 'Poster (big + bold)', level: 2, head: 'Impact, Arial Black, system-ui, sans-serif', body: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', track: '-0.01em', weight: 900, upper: true },
        ],
        lesson: {
          says: 'Fonts have voices. **Serif** feels classic, **sans** feels modern, **mono** feels techy. Pros use one for headings and maybe one more for text. Never five.',
          tryIt: 'Give your page each voice and see which one sounds like you.',
          check: { q: 'How many fonts does a clean page usually use?', options: ['One or two', 'Four or five', 'As many as fit'], answer: 0 },
        },
      },
      {
        id: 'corners', label: 'Corners', icon: 'square-outline', start: 'smooth',
        options: [
          { id: 'smooth', label: 'Smooth', level: 1, radius: 18 },
          { id: 'standard', label: 'Standard', level: 1, radius: 10 },
          { id: 'sharp', label: 'Sharp', level: 1, radius: 0 },
          { id: 'pill', label: 'Pill', level: 2, radius: 28 },
        ],
        lesson: {
          says: 'Corner **radius** sets a mood: round feels friendly, sharp feels precise. Use one style everywhere so the page feels like one thing.',
          tryIt: 'Switch corners and watch every card and button change.',
          check: { q: 'Why use one corner style everywhere?', options: ['It makes the file smaller', 'The page feels like one thing', 'Browsers require it'], answer: 1 },
        },
      },
      {
        id: 'layout', label: 'Layout', icon: 'grid-outline', start: 'center',
        options: [
          { id: 'center', label: 'Classic column', level: 1 },
          { id: 'split', label: 'Side by side', level: 1 },
          { id: 'bento', label: 'Bento grid', level: 2 },
        ],
        lesson: {
          says: 'Layout is **where things sit**. Most pages use an invisible grid of rows and columns, and every block snaps to it.',
          tryIt: 'Switch the layout and watch every block move.',
          check: { q: 'What decides where things sit on a page?', options: ['The layout grid', 'The font you pick', 'The colour scheme'], answer: 0 },
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
    growNext: 'Get one friend to play it and write down what they said',
    freeTools: [
      { name: 'Godot', what: 'A free, open-source game engine. Real games ship with it. No royalties, ever.', url: 'https://godotengine.org' },
      { name: 'Krita', what: 'Free, open-source painting. Draw your own sprites.', url: 'https://krita.org' },
    ],
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
    growNext: 'Record ten seconds of your own sound in Audacity',
    freeTools: [
      { name: 'LMMS', what: 'Free, open-source music making: patterns, synths and a full mixer.', url: 'https://lmms.io' },
      { name: 'Audacity', what: 'A free, open-source audio editor. Record your voice, cut and clean sound.', url: 'https://www.audacityteam.org' },
    ],
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
    growNext: 'Show the offer to one real person and ask what they would pay',
    freeTools: [
      { name: 'LibreOffice', what: 'A free office suite: documents, spreadsheets, slides. Opens Word and Excel files.', url: 'https://www.libreoffice.org' },
      { name: 'Inkscape', what: 'Free, open-source drawing. Make your own logo.', url: 'https://inkscape.org' },
    ],
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

  /* ── An AI helper ───────────────────────────────────────────────────── */
  // What AI can do for you, on free tools: a ready-to-use instruction set
  // for any chatbot, built from the parts that make AI useful (and honest).
  {
    id: 'ai',
    label: 'An AI helper',
    medium: 'AI',
    icon: 'sparkles-outline',
    blurb: 'Your own AI assistant for one job. Works in any free AI chat.',
    trophy: { art: 'trophyAi', name: 'Prompt Scroll' },
    growNext: 'Use your helper for one real task this week, and note what it got wrong',
    asks: [
      { key: 'task', label: 'What should it help you with?', max: 90, placeholder: 'e.g. plan cheap, healthy dinners for a week' },
      { key: 'name', label: 'Name your helper', max: 30, placeholder: 'e.g. Dinner Buddy' },
    ],
    freeTools: [
      { name: 'Ollama', what: 'Free and open source. Runs AI models on your own computer: no account, no subscription.', url: 'https://ollama.com' },
    ],
    parts: [
      {
        id: 'role', label: 'Role', icon: 'person-outline', start: 'planner',
        options: [
          { id: 'planner', label: 'Practical planner', level: 1, say: 'You are a practical planner who turns goals into small, doable steps.' },
          { id: 'tutor', label: 'Patient tutor', level: 1, say: 'You are a patient tutor. Explain things simply and check that I follow.' },
          { id: 'coach', label: 'Honest coach', level: 1, say: 'You are an honest coach. Tell me the truth kindly, even when it is not what I want to hear.' },
          { id: 'critic', label: 'Friendly critic', level: 2, say: 'You are a friendly critic. Push back on my ideas and point out what could go wrong.' },
        ],
        lesson: {
          says: 'Telling an AI **who to be** changes everything it says. A tutor explains, a coach pushes, a planner makes steps. Same AI, different job.',
          tryIt: 'Switch the role and read the instructions change.',
          check: { q: 'What does giving an AI a role do?', options: ['Makes it run faster', 'Shapes its answers', 'Unlocks paid features'], answer: 1 },
        },
      },
      {
        id: 'tone', label: 'Tone', icon: 'chatbubble-ellipses-outline', start: 'plain',
        options: [
          { id: 'plain', label: 'Plain words', level: 1, say: 'Use plain words. No jargon.' },
          { id: 'short', label: 'Short and direct', level: 1, say: 'Keep answers short and direct.' },
          { id: 'warm', label: 'Encouraging', level: 1, say: 'Be encouraging, but never flatter me.' },
          { id: 'twelve', label: 'Like I’m 12', level: 2, say: 'Explain things like I am 12, with one everyday example.' },
        ],
        lesson: {
          says: 'AI copies the **tone** you ask for. Ask for plain words and you get plain words. If it rambles, usually nobody told it not to.',
          tryIt: 'Pick a tone you’d actually want to read every day.',
          check: { q: 'An AI keeps rambling. What’s the fix?', options: ['Ask for short answers', 'Restart your phone', 'Pay for a bigger plan'], answer: 0 },
        },
      },
      {
        id: 'format', label: 'Answer shape', icon: 'list-outline', start: 'steps',
        options: [
          { id: 'steps', label: 'Numbered steps', level: 1, say: 'Answer as numbered steps I can follow.' },
          { id: 'bullets', label: 'Short list', level: 1, say: 'Answer as a short bullet list.' },
          { id: 'table', label: 'Compare in a table', level: 2, say: 'When there are options, compare them in a small table: cost, time and the catch.' },
        ],
        lesson: {
          says: 'The **format** is the shape of the answer: steps, a list, a table. Pick the shape you’ll actually use, and the answer becomes something you can do.',
          tryIt: 'Choose the shape that fits your task.',
          check: { q: 'What’s the best format for a recipe?', options: ['One long paragraph', 'Numbered steps', 'A poem about food'], answer: 1 },
        },
      },
      {
        id: 'honesty', label: 'Honesty rule', icon: 'shield-checkmark-outline', start: 'unsure',
        options: [
          { id: 'unsure', label: 'Say when unsure', level: 1, say: 'If you are not sure, say so. Never make things up.' },
          { id: 'askfirst', label: 'Ask me first', level: 1, say: 'Before you answer, ask me two or three questions so you get it right.' },
          { id: 'check', label: 'Tell me what to check', level: 2, say: 'Tell me which parts of your answer I should double-check, and where to check them.' },
        ],
        lesson: {
          says: 'AI can **sound sure and still be wrong**. It predicts likely words; it doesn’t check facts. Asking it to admit doubt keeps you safe.',
          tryIt: 'Pick the rule that would catch a mistake on your task.',
          check: { q: 'Why double-check what an AI tells you?', options: ['It can be wrong but sound sure', 'It is secretly lying on purpose', 'Free AI always gives fake facts'], answer: 0 },
        },
      },
    ],
  },
  /* ── A money plan (the Wealth Engine) ───────────────────────────────── */
  {
    id: 'money',
    label: 'A money plan',
    medium: 'Money',
    icon: 'trending-up-outline',
    blurb: 'Watch a small amount grow. Real compound math.',
    trophy: { art: 'trophyMoney', name: 'Gold Stack' },
    growNext: 'Set up one automatic transfer on payday, even a small one',
    freeTools: [
      { name: 'Investor.gov calculator', what: 'The US government’s free compound calculator. Same math, more options.', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' },
      { name: 'LibreOffice Calc', what: 'A free spreadsheet. Build your own plan, cell by cell.', url: 'https://www.libreoffice.org' },
    ],
    asks: [
      { key: 'goal', label: 'What are you saving for?', max: 40, placeholder: 'e.g. My own place', fill: 'My own place', hint: 'Anything. It names your plan.' },
      { key: 'monthly', label: 'How much a month could you put away?', max: 7, placeholder: 'e.g. 50', fill: '50', hint: 'A guess is fine. You can slide it later.' },
    ],
    parts: [
      {
        id: 'growth', label: 'Growth rate', icon: 'trending-up-outline', start: 'steady',
        options: [
          { id: 'cash', label: 'Savings account (2%)', level: 1, rate: 2 },
          { id: 'steady', label: 'Steady (5%)', level: 1, rate: 5 },
          { id: 'index', label: 'Index fund average (7%)', level: 2, rate: 7 },
        ],
        lesson: {
          says: '**Compound growth** means your money earns money, then that money earns money too. Small amounts plus time can snowball.',
          tryIt: 'Switch the rate and watch the end number.',
          check: { q: 'What makes compound growth snowball?', options: ['Saving one big amount once', 'Growth that earns more growth', 'Checking the balance daily'], answer: 1 },
        },
      },
      {
        id: 'time', label: 'Time', icon: 'hourglass-outline', start: 'ten',
        options: [
          { id: 'five', label: '5 years', level: 1, years: 5 },
          { id: 'ten', label: '10 years', level: 1, years: 10 },
          { id: 'thirty', label: '30 years', level: 2, years: 30 },
        ],
        lesson: {
          says: 'Time matters more than the amount. **Starting early** beats saving more later, because every year of growth builds on the last one.',
          tryIt: 'Stretch the time and see the curve bend upward.',
          check: { q: 'Why does starting early matter so much?', options: ['Each year grows on the last', 'Banks pay young savers more', 'Prices never go up over time'], answer: 0 },
        },
      },
      {
        id: 'view', label: 'The view', icon: 'bar-chart-outline', start: 'chart',
        options: [
          { id: 'chart', label: 'Growth chart', level: 1 },
          { id: 'table', label: 'Year by year', level: 1 },
          { id: 'real', label: 'After prices rise', level: 2 },
        ],
        lesson: {
          says: 'A chart shows the **shape**: slow, then steep. A table shows the exact numbers. Pros look at both before they decide anything.',
          tryIt: 'Flip between the chart and the table.',
          check: { q: 'What does a growth chart show best?', options: ['The exact cents for each year', 'Which bank you should pick', 'The shape of growth over time'], answer: 2 },
        },
      },
      {
        id: 'colors', label: 'Colours', icon: 'color-palette-outline', start: 'mint',
        options: [
          { id: 'mint', label: 'Mint', level: 1, bg: '#f2f7f4', card: '#ffffff', ink: '#16241d', soft: '#5b6d63', accent: '#1f8a5b', alt: '#9cc9b2' },
          { id: 'night', label: 'Night', level: 1, bg: '#0f1418', card: '#182027', ink: '#eef3f6', soft: '#93a3ae', accent: '#4fd1a1', alt: '#2c5c4c' },
          { id: 'gold', label: 'Gold', level: 2, bg: '#17130a', card: '#221c10', ink: '#fbf3df', soft: '#bfae86', accent: '#e8b33c', alt: '#6b5520' },
        ],
        lesson: {
          says: 'Money pages use **colour as meaning**: green for growth, red for loss. Keep it consistent and people read the numbers at a glance.',
          tryIt: 'Try a light palette, then a dark one.',
          check: { q: 'Why keep colours consistent on a money page?', options: ['So numbers read at a glance', 'It makes the page load faster', 'Banks require it by law'], answer: 0 },
        },
      },
      {
        id: 'model', label: 'The model', icon: 'flask-outline', start: 'fire',
        options: [
          { id: 'fire', label: 'Freedom number (FIRE)', level: 1 },
          { id: 'allocation', label: 'Where it sits', level: 1 },
          { id: 'market', label: 'Supply & demand lab', level: 2 },
        ],
        lesson: {
          says: 'A **model** is a simple version of the real thing you can play with. Change one input, watch one output. That’s how economists think.',
          tryIt: 'Switch the model, then move its sliders.',
          check: { q: 'What is a model for?', options: ['Predicting the future exactly', 'Testing one change at a time', 'Replacing real numbers'], answer: 1 },
        },
      },
    ],
  },

  /* ── A story map (the Narrative Engine) ─────────────────────────────── */
  {
    id: 'story',
    label: 'A story map',
    medium: 'Writing',
    icon: 'book-outline',
    blurb: 'Turn one idea into a plot with a hook.',
    trophy: { art: 'trophyStory', name: 'Story Book' },
    growNext: 'Write the first scene: the hook, and one page after it',
    freeTools: [
      { name: 'Manuskript', what: 'Free, open-source planner for long stories: characters, plot, scenes.', url: 'https://www.theologeek.ch/manuskript/' },
      { name: 'Project Gutenberg', what: '70,000+ free classic books. Read how the greats open a story.', url: 'https://www.gutenberg.org' },
    ],
    asks: [
      { key: 'title', label: 'Your story’s title', max: 50, placeholder: 'e.g. The Last Bus Home', fill: 'The Last Bus Home' },
      { key: 'premise', label: 'What happens, in one line', max: 120, placeholder: 'e.g. A kid finds a bus that only runs at 3am.', fill: 'A kid finds a bus that only runs at 3am.', hint: 'Who wants what, and what’s in the way.' },
    ],
    parts: [
      {
        id: 'shape', label: 'Story shape', icon: 'analytics-outline', start: 'mountain',
        options: [
          { id: 'mountain', label: 'Rise and fall', level: 1 },
          { id: 'three', label: 'Three acts', level: 1 },
          { id: 'journey', label: 'Hero’s journey', level: 2 },
        ],
        lesson: {
          says: 'Most stories follow a **shape**: set it up, build tension, hit a peak, then land. Readers feel it even when they can’t name it.',
          tryIt: 'Switch shapes and tap each point on the curve.',
          check: { q: 'What does a story’s shape describe?', options: ['How long each chapter runs', 'How tension rises and falls', 'Which of the words rhyme'], answer: 1 },
        },
      },
      {
        id: 'hook', label: 'Opening hook', icon: 'flash-outline', start: 'question',
        options: [
          { id: 'question', label: 'A question', level: 1 },
          { id: 'action', label: 'Mid-action', level: 1 },
          { id: 'voice', label: 'A line of dialogue', level: 2 },
        ],
        lesson: {
          says: 'The **hook** is your first line’s one job: make them need the second line. A question, a moment of action or a voice all work.',
          tryIt: 'Swap the hook and read the first line out loud.',
          check: { q: 'What is a hook’s job?', options: ['Explain the whole plot up front', 'List every character by name', 'Make them read the next line'], answer: 2 },
        },
      },
      {
        id: 'appeal', label: 'The pull', icon: 'magnet-outline', start: 'pathos',
        options: [
          { id: 'pathos', label: 'Feeling (pathos)', level: 1 },
          { id: 'logos', label: 'Reason (logos)', level: 1 },
          { id: 'ethos', label: 'Trust (ethos)', level: 2 },
        ],
        lesson: {
          says: 'Every message pulls by **feeling, reason or trust**. The Greeks called them pathos, logos and ethos. Strong writing leans on one and touches the others.',
          tryIt: 'Pick the pull, then slide the mix.',
          check: { q: 'Which pull works through emotion?', options: ['Pathos', 'Logos', 'Ethos'], answer: 0 },
        },
      },
      {
        id: 'colors', label: 'Colours', icon: 'color-palette-outline', start: 'ink',
        options: [
          { id: 'ink', label: 'Ink', level: 1, bg: '#f5f1e8', card: '#fffdf8', ink: '#22201c', soft: '#6f685c', accent: '#b4442f', alt: '#e3d5bf' },
          { id: 'dusk', label: 'Dusk', level: 1, bg: '#16131f', card: '#211c2e', ink: '#f1ecfa', soft: '#a69cbc', accent: '#f0a35e', alt: '#3d3355' },
          { id: 'neon', label: 'Neon', level: 2, bg: '#0b0618', card: '#160d2e', ink: '#f4ecff', soft: '#b6a3d9', accent: '#ff3fb4', alt: '#3a1f6e' },
        ],
        lesson: {
          says: 'Colour sets the **mood** before anyone reads a word. Warm paper feels like a book; dark and neon feel like a film.',
          tryIt: 'Give your story each mood.',
          check: { q: 'What does colour set before anyone reads?', options: ['The word count', 'The mood', 'The plot twist'], answer: 1 },
        },
      },
    ],
  },

  /* ── An argument map (the Socratic Canvas + Logic Gate Lab) ─────────── */
  {
    id: 'logic',
    label: 'An argument map',
    medium: 'Logic',
    icon: 'git-network-outline',
    blurb: 'Test an idea: your claim, your reasons, the other side.',
    trophy: { art: 'trophyLogic', name: 'Logic Charm' },
    growNext: 'Ask one person who disagrees for their best reason, and add it',
    freeTools: [
      { name: 'Logisim Evolution', what: 'Free circuit simulator. Build real logic gates, then a tiny computer.', url: 'https://github.com/logisim-evolution/logisim-evolution' },
      { name: 'Stanford Encyclopedia of Philosophy', what: 'Free, expert-written articles on logic and arguments.', url: 'https://plato.stanford.edu' },
    ],
    asks: [
      { key: 'claim', label: 'Something you believe', max: 100, placeholder: 'e.g. School should start later.', fill: 'School should start later.', hint: 'One sentence. Big or small.' },
      { key: 'reason', label: 'Your best reason', max: 120, placeholder: 'e.g. Teens learn better with more sleep.', fill: 'Teens learn better with more sleep.' },
    ],
    parts: [
      {
        id: 'map', label: 'The map', icon: 'git-network-outline', start: 'tree',
        options: [
          { id: 'tree', label: 'Claim and reasons', level: 1 },
          { id: 'versus', label: 'Both sides', level: 1 },
          { id: 'socratic', label: 'Socratic questions', level: 2 },
        ],
        lesson: {
          says: 'An argument is a **claim plus reasons**. Mapping it shows the gaps: a reason that doesn’t really support the claim stands out fast.',
          tryIt: 'Switch to Both sides and fill in the other view.',
          check: { q: 'What is an argument made of?', options: ['A loud opinion, repeated', 'A claim plus its reasons', 'A list of facts on their own'], answer: 1 },
        },
      },
      {
        id: 'gate', label: 'Logic gate', icon: 'toggle-outline', start: 'and',
        options: [
          { id: 'and', label: 'AND', level: 1 },
          { id: 'or', label: 'OR', level: 1 },
          { id: 'xor', label: 'XOR (one, not both)', level: 2 },
          { id: 'nand', label: 'NAND (not both)', level: 2 },
          { id: 'nor', label: 'NOR (neither)', level: 2 },
          { id: 'implies', label: 'IF … THEN', level: 2 },
        ],
        lesson: {
          says: '**AND** needs both reasons true. **OR** needs just one. Computers run on these same gates, billions of times a second.',
          tryIt: 'Flip each reason true or false and watch the claim.',
          check: { q: 'When is “A AND B” true?', options: ['When either one is true', 'When both are false', 'Only when both are true'], answer: 2 },
        },
      },
      {
        id: 'trap', label: 'Thinking trap', icon: 'warning-outline', start: 'strawman',
        options: [
          { id: 'strawman', label: 'Straw man', level: 1 },
          { id: 'slope', label: 'Slippery slope', level: 1 },
          { id: 'authority', label: 'Because they said so', level: 2 },
        ],
        lesson: {
          says: 'A **fallacy** is a thinking trap: it sounds right but doesn’t hold. Naming one is the fastest way to argue fairly.',
          tryIt: 'Read the trap, then check your own reason for it.',
          check: { q: 'What is a fallacy?', options: ['Reasoning that sounds right but fails', 'A fact you can look up and check', 'A strong, fair reason for a claim'], answer: 0 },
        },
      },
      {
        id: 'colors', label: 'Colours', icon: 'color-palette-outline', start: 'chalk',
        options: [
          { id: 'chalk', label: 'Chalkboard', level: 1, bg: '#18241f', card: '#203029', ink: '#eef5ef', soft: '#a7bcb0', accent: '#f2d16b', alt: '#2f4a3e' },
          { id: 'paper', label: 'Paper', level: 1, bg: '#f4f3ef', card: '#ffffff', ink: '#1d2126', soft: '#626a74', accent: '#3f6fd8', alt: '#dfe5f2' },
          { id: 'circuit', label: 'Circuit', level: 2, bg: '#06100f', card: '#0c1c1a', ink: '#d9fff7', soft: '#6fb3a6', accent: '#2ef2c2', alt: '#13403a' },
        ],
        lesson: {
          says: 'Diagrams need **contrast** between lines and background. If the arrows blur into the page, nobody can follow the reasoning.',
          tryIt: 'Try each board and see which reads clearest.',
          check: { q: 'Why do diagram lines need contrast?', options: ['It looks more expensive', 'So people can follow them', 'It uses less ink'], answer: 1 },
        },
      },
    ],
  },

  /* ── A graph lab (the Vector Geometry Proof Engine) ─────────────────── */
  {
    id: 'math',
    label: 'A graph lab',
    medium: 'Math',
    icon: 'shapes-outline',
    blurb: 'Drag a slider, watch the shape change. Then prove it.',
    trophy: { art: 'trophyMath', name: 'Proof Shield' },
    growNext: 'Find one real thing that changes over time and sketch its graph',
    freeTools: [
      { name: 'GeoGebra', what: 'Free graphing, geometry and 3D math. Used in classrooms everywhere.', url: 'https://www.geogebra.org' },
      { name: 'Desmos', what: 'Free graphing calculator. Type a rule, see its shape.', url: 'https://www.desmos.com/calculator' },
    ],
    asks: [
      { key: 'name', label: 'Name your lab', max: 40, placeholder: 'e.g. Rocket Lab', fill: 'My Graph Lab' },
      { key: 'about', label: 'Something that grows or changes', max: 50, placeholder: 'e.g. A plant’s height', fill: 'A plant’s height', hint: 'It labels your graph.' },
    ],
    parts: [
      {
        id: 'curve', label: 'The curve', icon: 'pulse-outline', start: 'line',
        options: [
          { id: 'line', label: 'Straight line', level: 1 },
          { id: 'parabola', label: 'Parabola', level: 1 },
          { id: 'wave', label: 'Wave', level: 1 },
          { id: 'growth', label: 'Exponential', level: 2 },
          { id: 'cubic', label: 'Cubic', level: 2 },
          { id: 'gaussian', label: 'Bell curve', level: 2 },
        ],
        lesson: {
          says: 'A **function** is a rule: put in x, get out y. Its graph draws every answer at once, so you can see the rule’s shape.',
          tryIt: 'Pick a curve, then drag its sliders.',
          check: { q: 'What is a function?', options: ['A colour scheme for charts', 'A rule that turns x into y', 'A random set of dots'], answer: 1 },
        },
      },
      {
        id: 'slope', label: 'Slope', icon: 'trending-up-outline', start: 'off',
        options: [
          { id: 'off', label: 'Hidden', level: 1 },
          { id: 'tangent', label: 'Tangent line', level: 1 },
          { id: 'area', label: 'Area under it', level: 2 },
        ],
        lesson: {
          says: '**Slope** is how steep the curve is at one spot: rise over run. Calculus is mostly measuring slope and area, very precisely.',
          tryIt: 'Turn on the tangent and slide the point.',
          check: { q: 'What does slope measure?', options: ['How many points there are', 'How long the line is', 'How steep it is at a spot'], answer: 2 },
        },
      },
      {
        id: 'proof', label: 'Proof card', icon: 'triangle-outline', start: 'pythagoras',
        options: [
          { id: 'pythagoras', label: 'Pythagoras', level: 1 },
          { id: 'circle', label: 'Unit circle', level: 1 },
          { id: 'vectors', label: 'Adding vectors', level: 2 },
          { id: 'thales', label: 'Thales’ circle', level: 2 },
        ],
        lesson: {
          says: 'A **proof** shows something is always true, not just in the cases you tried. Pythagoras: in every right triangle, a² + b² = c².',
          tryIt: 'Drag the sides and watch the equation hold.',
          check: { q: 'What does a proof show?', options: ['It is always true', 'It worked one time', 'Most people agree'], answer: 0 },
        },
      },
      {
        id: 'colors', label: 'Colours', icon: 'color-palette-outline', start: 'graph',
        options: [
          { id: 'graph', label: 'Graph paper', level: 1, bg: '#f7f8fb', card: '#ffffff', ink: '#1b2230', soft: '#5f6b7d', accent: '#e0533d', alt: '#dde3ee' },
          { id: 'blueprint', label: 'Blueprint', level: 1, bg: '#0e2a4a', card: '#123459', ink: '#eaf3ff', soft: '#9fbde0', accent: '#ffd25e', alt: '#2a5585' },
          { id: 'neon', label: 'Neon', level: 2, bg: '#07070f', card: '#10101e', ink: '#f0f0ff', soft: '#9a9ac8', accent: '#39f3ff', alt: '#25254a' },
        ],
        lesson: {
          says: 'A graph’s grid should be **quiet** and its curve **loud**. One strong colour for the thing you’re studying; soft lines for everything else.',
          tryIt: 'Try each paper and see what pops.',
          check: { q: 'What should stand out most on a graph?', options: ['The grid lines', 'The page border', 'The curve you’re studying'], answer: 2 },
        },
      },
    ],
  },

  /* ── A body dashboard (the Bio-Performance Lab) ─────────────────────── */
  // General know-how only: no weight, no calories, no age stored. Under-18s
  // use the Studio too, and a guest's age is unknown.
  {
    id: 'body',
    label: 'A body dashboard',
    medium: 'Health',
    icon: 'pulse-outline',
    blurb: 'How your heart, water and sleep work, on one page.',
    trophy: { art: 'trophyBody', name: 'Vital Flask' },
    growNext: 'Pick one: a 10-minute walk, a glass of water or a set bedtime. Do it today',
    freeTools: [
      { name: 'MedlinePlus', what: 'Free, trusted health info from the US National Library of Medicine.', url: 'https://medlineplus.gov' },
      { name: 'OpenTracks', what: 'Free, open-source activity tracker for Android. No account, no ads.', url: 'https://opentracksapp.com' },
    ],
    asks: [
      { key: 'name', label: 'Your first name', max: 40, placeholder: 'e.g. Sam' },
      { key: 'move', label: 'A way you like to move', max: 40, placeholder: 'e.g. Walking, hoops, dancing', fill: 'Walking', hint: 'Anything counts.' },
    ],
    parts: [
      {
        id: 'goal', label: 'Training goal', icon: 'barbell-outline', start: 'endurance',
        options: [
          { id: 'endurance', label: 'Endurance', level: 1 },
          { id: 'strength', label: 'Strength', level: 1 },
          { id: 'recovery', label: 'Recovery', level: 2 },
        ],
        lesson: {
          says: 'Your body **adapts to what you ask of it**. Long and easy builds your engine; heavy and short builds muscle; rest is when both happen.',
          tryIt: 'Pick a goal and read the week it plans.',
          check: { q: 'When does your body get stronger?', options: ['During the hardest set', 'While it rests after', 'Only on game days'], answer: 1 },
        },
      },
      {
        id: 'heart', label: 'Heart', icon: 'heart-outline', start: 'talk',
        options: [
          { id: 'talk', label: 'The talk test', level: 1 },
          { id: 'zones', label: 'Heart-rate zones', level: 1 },
          { id: 'recovery', label: 'Recovery check', level: 2 },
        ],
        lesson: {
          says: 'Your heart has **zones**. Easy effort builds your base; hard effort builds speed. Most movement should feel easy enough to talk through.',
          tryIt: 'Slide the effort and read what it feels like.',
          check: { q: 'Most training should feel…', options: ['As hard as you can go', 'Easy enough to talk', 'Painful every single time'], answer: 1 },
        },
      },
      {
        id: 'water', label: 'Water', icon: 'water-outline', start: 'cups',
        options: [
          { id: 'cups', label: 'Cups today', level: 1 },
          { id: 'active', label: 'Plus when I move', level: 1 },
          { id: 'heat', label: 'Hot-day plan', level: 2 },
        ],
        lesson: {
          says: 'Your body is about **60% water**, and it loses some all day. Thirst and pale-yellow pee are your best simple guides.',
          tryIt: 'Tap a cup each time you drink.',
          check: { q: 'What is a simple sign you’re drinking enough?', options: ['Never feeling thirsty at all', 'Drinking only at meals', 'Pale-yellow pee'], answer: 2 },
        },
      },
      {
        id: 'sleep', label: 'Sleep', icon: 'moon-outline', start: 'window',
        options: [
          { id: 'window', label: 'Sleep window', level: 1 },
          { id: 'cycles', label: '90-minute cycles', level: 1 },
          { id: 'winddown', label: 'Wind-down plan', level: 2 },
        ],
        lesson: {
          says: 'Sleep is when your body **repairs and remembers**. Teens need about 8 to 10 hours, adults 7 to 9. A steady wake-up time helps most.',
          tryIt: 'Set your wake-up time and see your window.',
          check: { q: 'What helps sleep the most?', options: ['A steady wake-up time', 'Sleeping in on weekends', 'A big late snack'], answer: 0 },
        },
      },
      {
        id: 'colors', label: 'Colours', icon: 'color-palette-outline', start: 'fresh',
        options: [
          { id: 'fresh', label: 'Fresh', level: 1, bg: '#f1f7fa', card: '#ffffff', ink: '#14232c', soft: '#58707e', accent: '#e2475b', alt: '#cfe6f0' },
          { id: 'night', label: 'Night', level: 1, bg: '#0d1219', card: '#151d27', ink: '#e9f0f7', soft: '#8b9cb0', accent: '#ff6b81', alt: '#243246' },
          { id: 'pulse', label: 'Pulse', level: 2, bg: '#140a0d', card: '#22111a', ink: '#ffeef2', soft: '#c497a5', accent: '#ff2e63', alt: '#4b1f2e' },
        ],
        lesson: {
          says: 'Dashboards put the **most important number** biggest and brightest. Everything else stays calm so your eye knows where to land.',
          tryIt: 'Try each palette and notice where your eye goes.',
          check: { q: 'What should be biggest on a dashboard?', options: ['The company logo up top', 'The most important number', 'The menu with every link'], answer: 1 },
        },
      },
    ],
  },

  /* ── A launchpad (the Developer Launchpad + habit matrix) ───────────── */
  // Momentum, never streaks (docs/north-star.md): it counts what you did,
  // never the days you missed.
  {
    id: 'launch',
    label: 'A launchpad',
    medium: 'Focus',
    icon: 'speedometer-outline',
    blurb: 'Your links, a focus timer and what you did. One page.',
    trophy: { art: 'trophyLaunch', name: 'Momentum Amulet' },
    growNext: 'Run one focus timer on the thing you named, then tick today',
    freeTools: [
      { name: 'freeCodeCamp', what: 'Free, full coding courses with certificates. No paywall.', url: 'https://www.freecodecamp.org' },
      { name: 'Super Productivity', what: 'Free, open-source to-do list with a focus timer built in.', url: 'https://super-productivity.com' },
    ],
    asks: [
      { key: 'name', label: 'Your first name', max: 40, placeholder: 'e.g. Sam' },
      { key: 'focus', label: 'What are you working on?', max: 60, placeholder: 'e.g. Learning to code', fill: 'Learning something new', hint: 'One thing. It goes on the timer.' },
    ],
    parts: [
      {
        id: 'timer', label: 'Focus timer', icon: 'timer-outline', start: 'pomodoro',
        options: [
          { id: 'short', label: '10 minutes', level: 1, mins: 10 },
          { id: 'pomodoro', label: '25 minutes', level: 1, mins: 25 },
          { id: 'deep', label: '50 minutes', level: 2, mins: 50 },
        ],
        lesson: {
          says: 'Short, timed bursts beat long, foggy hours. **One task per timer**, then a real break. Your brain treats the timer as a promise.',
          tryIt: 'Start the timer on the thing you named.',
          check: { q: 'What goes in one focus timer?', options: ['Every task at once', 'Checking messages too', 'One task'], answer: 2 },
        },
      },
      {
        id: 'board', label: 'Momentum board', icon: 'grid-outline', start: 'week',
        options: [
          { id: 'week', label: 'This week', level: 1 },
          { id: 'month', label: 'This month', level: 1 },
          { id: 'notes', label: 'With notes', level: 2 },
        ],
        lesson: {
          says: 'Track **what you did**, not what you missed. A board of done things shows momentum; a broken chain only shows guilt.',
          tryIt: 'Tick today on the board.',
          check: { q: 'What does a momentum board track?', options: ['What you did', 'Every day you missed', 'Other people’s progress'], answer: 0 },
        },
      },
      {
        id: 'habits', label: 'Habit matrix', icon: 'apps-outline', start: 'three',
        options: [
          { id: 'one', label: 'One habit', level: 1, count: 1 },
          { id: 'three', label: 'Three habits', level: 1, count: 3 },
          { id: 'five', label: 'Five habits', level: 2, count: 5 },
        ],
        lesson: {
          says: 'Fewer habits stick better. **Two or three** at once is plenty; add one only when the others run on their own.',
          tryIt: 'Name your habits and tick what you did today.',
          check: { q: 'How many new habits work best at once?', options: ['Ten, to cover everything', 'Two or three', 'One new one every day'], answer: 1 },
        },
      },
      {
        id: 'links', label: 'Launch links', icon: 'link-outline', start: 'learn',
        options: [
          { id: 'learn', label: 'Learning links', level: 1 },
          { id: 'make', label: 'Making links', level: 1 },
          { id: 'code', label: 'Coding links', level: 2 },
        ],
        lesson: {
          says: 'A launchpad puts your tools **one tap away**. Less hunting means you start sooner, and starting is the hard part.',
          tryIt: 'Swap the set of links for the work you do.',
          check: { q: 'Why keep your tools one tap away?', options: ['It looks busier', 'You start sooner', 'It saves battery'], answer: 1 },
        },
      },
      {
        id: 'colors', label: 'Colours', icon: 'color-palette-outline', start: 'terminal',
        options: [
          { id: 'terminal', label: 'Terminal', level: 1, bg: '#0a0f0b', card: '#111a13', ink: '#d8f5dd', soft: '#7fa688', accent: '#3ddc84', alt: '#1d3322', mono: true },
          { id: 'calm', label: 'Calm', level: 1, bg: '#f6f5f1', card: '#ffffff', ink: '#1f2328', soft: '#5c6370', accent: '#2f7d6d', alt: '#dfe9e5' },
          { id: 'synth', label: 'Synth', level: 2, bg: '#120b24', card: '#1d1338', ink: '#f3eaff', soft: '#ab9bd3', accent: '#ff7ad9', alt: '#3a2670' },
        ],
        lesson: {
          says: 'A tool you open every day should feel **calm to look at**. Low clutter and one accent colour make it easy to come back to.',
          tryIt: 'Pick the look you’d want to open every morning.',
          check: { q: 'What makes a daily tool easy to come back to?', options: ['Low clutter, one accent', 'Lots of flashing colours', 'Every feature on screen'], answer: 0 },
        },
      },
    ],
  },
];

export const BUILD_KIND_MAP = Object.fromEntries(BUILD_KINDS.map(k => [k.id, k]));
