// src/data/wayfinderDeeper.js
//
// Wayfinder's optional "go deeper" sections, each finished separately from
// the map: personality, how you learn, and life beyond work. Plus the one
// lookup that lets experiments point at any kind of thing (a job path, a
// way to live outside work, or a quality to practice).
//
// Two of these were asked for by name and deliberately built differently:
//
//  PERSONALITY is the Big Five, not Myers-Briggs. The official MBTI® is a
//  trademarked, paid assessment, and a large share of people get a different
//  type when they retake it weeks later — it sorts a spectrum into two boxes,
//  so anyone near the middle flips. The Big Five is the model personality
//  research actually uses, and its items are public domain (IPIP,
//  ipip.ori.org). Four of its five traits track the four Myers-Briggs
//  scales closely enough (McCrae & Costa, 1989) that the result can still say
//  "closest four-letter match: ENFJ" — clearly labelled as a translation,
//  with near-the-middle letters flagged instead of hidden.
//
//  LEARNING is preferences + techniques, not "learning styles". The idea that
//  people learn better when taught in their style (visual, auditory,
//  kinesthetic) hasn't held up when tested. Preferences are still real and
//  worth knowing — they're what keeps someone going — so this asks for them,
//  then pairs them with techniques that make learning stick for everyone.

import { PATH_MAP, EXPERIMENT_RUNGS } from './wayfinder';

// ─── Personality: Big Five ──────────────────────────────────────────────────
// Items: the 20-item Mini-IPIP (Donnellan, Oswald, Baird & Lucas, 2006), from
// the public-domain International Personality Item Pool, lightly reworded to
// first person. `r` = reverse-scored. 1–5 scale.
export const PERSONALITY_SCALE = [
  { value: 1, label: 'Not me' },
  { value: 2, label: 'Not really' },
  { value: 3, label: 'Sort of' },
  { value: 4, label: 'Mostly' },
  { value: 5, label: 'Very me' },
];

export const TRAITS = [
  {
    id: 'E', name: 'Social energy', low: 'Recharges alone', high: 'Recharges around people', letter: ['I', 'E'],
    lowTip: 'Protect some quiet time — it’s how you refuel. For “Talk” experiments, one-on-one or a message first will feel easier than a group.',
    highTip: 'Build people into your plans — study partners, crews, teams. Long solo stretches may drain you more than you notice.',
  },
  {
    id: 'A', name: 'Warmth', low: 'Direct & skeptical', high: 'Warm & accommodating', letter: ['T', 'F'],
    lowTip: 'You’re good at hard conversations and tough calls. Just check that being direct doesn’t land as not caring.',
    highTip: 'People trust you and feel looked after. Practice saying no — your time and energy are limited too.',
  },
  {
    id: 'C', name: 'Structure', low: 'Flexible & spontaneous', high: 'Organized & planned', letter: ['P', 'J'],
    lowTip: 'Big rigid schedules won’t stick. Use tiny next steps and reminders instead, and make starting easy.',
    highTip: 'You follow through, which is rarer than it sounds. Watch for burning out chasing perfect.',
  },
  {
    id: 'N', name: 'Stress response', low: 'Steady under stress', high: 'Feels things strongly', letter: null,
    lowTip: 'You stay level when things go wrong — a real asset under pressure. Check in on people who feel things harder than you.',
    highTip: 'Stress lands hard for you. That isn’t weakness, and it’s one of the parts of personality that changes most with practice — sleep, movement, and talking it out genuinely help.',
  },
  {
    id: 'O', name: 'Imagination', low: 'Practical & grounded', high: 'Imaginative & curious', letter: ['S', 'N'],
    lowTip: 'You like what works. Concrete, hands-on learning and clear goals will suit you best.',
    highTip: 'New ideas pull you in. Finishing can be the hard part — pick one thing at a time and see it through.',
  },
];

export const TRAIT_MAP = Object.fromEntries(TRAITS.map(t => [t.id, t]));

export const PERSONALITY_ITEMS = [
  { id: 'p1',  trait: 'E', text: 'I’m the life of the party.' },
  { id: 'p2',  trait: 'A', text: 'I sympathize with other people’s feelings.' },
  { id: 'p3',  trait: 'C', text: 'I get chores done right away.' },
  { id: 'p4',  trait: 'N', text: 'I have frequent mood swings.' },
  { id: 'p5',  trait: 'O', text: 'I have a vivid imagination.' },
  { id: 'p6',  trait: 'E', text: 'I don’t talk a lot.', r: true },
  { id: 'p7',  trait: 'A', text: 'I’m not interested in other people’s problems.', r: true },
  { id: 'p8',  trait: 'C', text: 'I often forget to put things back where they belong.', r: true },
  { id: 'p9',  trait: 'N', text: 'I’m relaxed most of the time.', r: true },
  { id: 'p10', trait: 'O', text: 'I’m not interested in abstract ideas.', r: true },
  { id: 'p11', trait: 'E', text: 'I talk to a lot of different people at parties.' },
  { id: 'p12', trait: 'A', text: 'I feel other people’s emotions.' },
  { id: 'p13', trait: 'C', text: 'I like order.' },
  { id: 'p14', trait: 'N', text: 'I get upset easily.' },
  { id: 'p15', trait: 'O', text: 'I have a hard time understanding abstract ideas.', r: true },
  { id: 'p16', trait: 'E', text: 'I keep in the background.', r: true },
  { id: 'p17', trait: 'A', text: 'I’m not really interested in others.', r: true },
  { id: 'p18', trait: 'C', text: 'I make a mess of things.', r: true },
  { id: 'p19', trait: 'N', text: 'I seldom feel blue.', r: true },
  { id: 'p20', trait: 'O', text: 'I don’t have a good imagination.', r: true },
];

// ─── How you learn ──────────────────────────────────────────────────────────
// `formats` maps to profiles.formats keys (reading/video/audio/game/quiz/
// hands) so the answer can feed the app's recommendations if the user asks.
export const LEARNING_PREFS = [
  { id: 'watch',    emoji: '🎬', label: 'Watching someone show me',       formats: ['video'] },
  { id: 'read',     emoji: '📖', label: 'Reading it myself',               formats: ['reading'] },
  { id: 'listen',   emoji: '🎧', label: 'Hearing it explained',            formats: ['audio'] },
  { id: 'do',       emoji: '🛠️', label: 'Jumping in and trying it',        formats: ['hands'] },
  { id: 'draw',     emoji: '🗺️', label: 'Drawing it out — maps, diagrams', formats: [] },
  { id: 'quiz',     emoji: '🎯', label: 'Quizzes and games',               formats: ['quiz', 'game'] },
  { id: 'talk',     emoji: '💬', label: 'Talking it through with people',  formats: [] },
  { id: 'alone',    emoji: '🧩', label: 'Figuring it out on my own',       formats: [] },
];

export const LEARNING_BLOCKERS = [
  { id: 'focus',   label: 'I lose focus fast' },
  { id: 'forget',  label: 'I forget it later' },
  { id: 'bored',   label: 'I get bored' },
  { id: 'start',   label: 'I don’t know where to start' },
  { id: 'time',    label: 'I don’t have time' },
  { id: 'dumb',    label: 'I feel dumb asking questions' },
];

// What actually works. Each technique carries a version for specific
// preferences, so the advice meets people where they already are instead of
// telling a video person to go read a textbook.
export const TECHNIQUES = [
  {
    id: 'retrieval', title: 'Test yourself instead of rereading',
    why: 'Pulling something out of your memory strengthens it far more than looking at it again.',
    how: 'After a lesson, close it and write or say what you remember. Then check.',
    byPref: { watch: 'Pause the video every few minutes and explain what just happened before you hit play.', quiz: 'You already like quizzes — use them on purpose, right after learning, not just for fun.', read: 'Close the book at the end of each section and write down the main idea from memory.' },
    blockers: ['forget'], app: { label: 'Training games', tab: 'Training' },
  },
  {
    id: 'spacing', title: 'Spread it out',
    why: 'A little on several days sticks better than the same time crammed into one.',
    how: 'Do 15–20 minutes on three different days instead of one long session.',
    byPref: {},
    blockers: ['forget', 'time'], app: { label: 'Schedule it in the Planner', screen: 'PlannerScreen' },
  },
  {
    id: 'focus', title: 'One thing, phone in another room',
    why: 'Switching back and forth costs more attention than it feels like it does.',
    how: 'Set a timer for 20 minutes, do only that one thing, then take a real break.',
    byPref: {},
    blockers: ['focus'], app: { label: 'Work Mode timer', screen: 'WorkModeScreen' },
  },
  {
    id: 'apply', title: 'Use it on something real',
    why: 'Knowledge you use to make or fix something is easier to keep and easier to care about.',
    how: 'Pick a tiny project that needs the thing you’re learning, and learn just enough to finish it.',
    byPref: { do: 'Start with the project and look things up as you get stuck — that’s a legitimate way to learn, not a shortcut.' },
    blockers: ['bored', 'start'], app: { label: 'Start a build in the Workshop', screen: 'ProjectsScreen' },
  },
  {
    id: 'teach', title: 'Explain it to someone',
    why: 'Explaining out loud shows you exactly which part you don’t understand yet.',
    how: 'Explain it to a friend, a family member, or out loud to nobody, as if they know nothing.',
    byPref: { talk: 'Find a study buddy and take turns teaching each other one thing.', listen: 'Record yourself explaining it, then listen back.' },
    blockers: ['forget', 'dumb'], app: null,
  },
  {
    id: 'dual', title: 'Put words and pictures together',
    why: 'Most people understand more when an explanation comes with a simple picture, not either one alone.',
    how: 'Sketch a quick diagram next to your notes — boxes and arrows are enough.',
    byPref: { draw: 'You already think this way. Turn every chapter or video into one page map.', read: 'Add one quick sketch per page of notes.' },
    blockers: ['bored', 'forget'], app: null,
  },
  {
    id: 'small', title: 'Make the first step tiny',
    why: 'Starting is usually the hardest part. A step small enough to feel silly is small enough to actually do.',
    how: 'Decide the very first 10-minute action, and do only that today.',
    byPref: {},
    blockers: ['start', 'time'], app: { label: 'Academy classes', screen: 'ClassesStack' },
  },
  {
    id: 'questions', title: 'Ask questions early',
    why: 'Confusion snowballs. One question now saves an hour later — and everyone else usually has the same one.',
    how: 'Write your question down the moment you’re lost, and ask it before the end of the day.',
    byPref: { alone: 'Search it first if you like working alone — but set a limit, and ask a person if 15 minutes doesn’t crack it.' },
    blockers: ['dumb'], app: null,
  },
];

// ─── Life beyond work ───────────────────────────────────────────────────────
// Ids match LIFE_AREAS in src/screens/library/LifeAreaScreen.js so the map
// can link straight to each area. Professional is left out on purpose —
// the rest of Wayfinder already covers it.
export const LIFE_ZONES = [
  { id: 'physical',  emoji: '💪', label: 'Body & health',            placeholder: 'e.g. more energy, sleeping better' },
  { id: 'mental',    emoji: '🧠', label: 'Mind & mood',              placeholder: 'e.g. less stressed, calmer' },
  { id: 'social',    emoji: '🤝', label: 'Friends, family & love',   placeholder: 'e.g. a couple of close friends' },
  { id: 'financial', emoji: '💰', label: 'Money at home',            placeholder: 'e.g. not stressing every month' },
  { id: 'spiritual', emoji: '✨', label: 'Meaning, faith & purpose', placeholder: 'e.g. feeling like my life matters' },
  { id: 'creative',  emoji: '🎨', label: 'Creativity & play',        placeholder: 'e.g. making something again' },
  { id: 'digital',   emoji: '📱', label: 'Screens & tech habits',    placeholder: 'e.g. less scrolling' },
];

export const LIFE_ZONE_MAP = Object.fromEntries(LIFE_ZONES.map(z => [z.id, z]));
export const MAX_LIFE_ZONES = 3;

// "Who do you want to be?" — qualities, each with one practice small enough
// to try this week. Practices, not verdicts: nobody is told they lack these.
export const MAX_QUALITIES = 3;

export const QUALITIES = [
  { id: 'patient',     emoji: '⏳', label: 'Patient',       practice: 'When you feel rushed or annoyed this week, take one slow breath before you answer.' },
  { id: 'brave',       emoji: '🦁', label: 'Brave',         practice: 'Do one small thing this week that makes you a little nervous.' },
  { id: 'disciplined', emoji: '🧱', label: 'Disciplined',   practice: 'Pick one tiny daily habit and don’t miss two days in a row.' },
  { id: 'kind',        emoji: '💛', label: 'Kind',          practice: 'Do one kind thing a day for a week that nobody asked for.' },
  { id: 'honest',      emoji: '🪞', label: 'Honest',        practice: 'Once this week, say what you actually think — kindly — instead of what’s easy.' },
  { id: 'confident',   emoji: '🌟', label: 'Confident',     practice: 'Each night, write down one thing you did well that day.' },
  { id: 'calm',        emoji: '🌊', label: 'Calm',          practice: 'When stress spikes, take a slow five-minute walk before reacting.' },
  { id: 'generous',    emoji: '🎁', label: 'Generous',      practice: 'Give time, attention, or help this week without keeping score.' },
  { id: 'curious',     emoji: '🔭', label: 'Curious',       practice: 'Ask one person a question about their life you’ve never asked.' },
  { id: 'reliable',    emoji: '⚓', label: 'Reliable',      practice: 'This week, only promise what you’ll really do — then do it.' },
  { id: 'joyful',      emoji: '🎈', label: 'Joyful',        practice: 'Put one thing on your calendar this week purely for fun.' },
  { id: 'forgiving',   emoji: '🕊️', label: 'Forgiving',     practice: 'Let go of one small grudge. You don’t have to tell anyone.' },
  { id: 'grateful',    emoji: '🙏', label: 'Grateful',      practice: 'Before bed, write down three good things from the day.' },
  { id: 'focused',     emoji: '🎯', label: 'Focused',       practice: 'Do one 20-minute block with your phone in another room.' },
  { id: 'openminded',  emoji: '🚪', label: 'Open-minded',   practice: 'Listen to someone you disagree with, without planning your reply.' },
  { id: 'present',     emoji: '🍃', label: 'Present',       practice: 'Eat one meal a day this week with no screen.' },
];

export const QUALITY_MAP = Object.fromEntries(QUALITIES.map(q => [`q_${q.id}`, q]));

// Ways to live it outside work. Same themes as job paths (so "Creating"
// people see creative things here too), plus `zones` so picking "Friends,
// family & love" as something to change surfaces the social ones. Every
// first step is free or close to it, and reachable by a teenager.
// Ids are prefixed `l_` so they can never collide with a job path id.
export const LIFE_RUNGS = [
  { id: 'first',  label: 'Dip in',          effort: 'This week',   days: 7,  icon: 'water-outline' },
  { id: 'next',   label: 'Make it regular', effort: 'A few weeks', days: 21, icon: 'repeat-outline' },
  { id: 'deeper', label: 'Go deeper',       effort: 'A season',    days: 60, icon: 'trending-up-outline' },
];

export const LIFE_PATHS = [
  // Building & fixing
  { id: 'l_garden', title: 'Grow something', themes: ['hands'], zones: ['physical', 'spiritual'], values: ['outdoors', 'independence'],
    what: 'Plants, a garden bed, or herbs on a windowsill. Slow, calming, and you get to eat the results.',
    steps: { first: 'Grow one thing from seed or a cutting — herbs on a windowsill count.', next: 'Join a community garden or help someone with theirs a few times.', deeper: 'Grow enough of one thing to cook with or give away.' } },
  { id: 'l_make', title: 'Fix and build things', themes: ['hands', 'figure'], zones: ['creative', 'mental'], values: ['mastery', 'independence'],
    what: 'Bikes, furniture, electronics, a PC — the satisfaction of making something work with your hands.',
    steps: { first: 'Fix one broken thing at home using a video guide.', next: 'Take a free class at a makerspace, library, or hardware store.', deeper: 'Build one thing from scratch — a shelf, a bike, a PC.' } },
  { id: 'l_outdoors', title: 'Get outdoors', themes: ['hands'], zones: ['physical', 'spiritual', 'mental'], values: ['outdoors', 'adventure'],
    what: 'Walks, trails, parks, water. One of the simplest resets there is.',
    steps: { first: 'Take a 30-minute walk somewhere green with your phone in your pocket.', next: 'Pick one park or trail and go every weekend for a month.', deeper: 'Join an outdoor group or plan a day trip with someone experienced.' } },
  { id: 'l_sport', title: 'Play a sport or train', themes: ['hands', 'people'], zones: ['physical', 'social'], values: ['teamwork', 'mastery'],
    what: 'Pickup games, a gym routine, martial arts, dance — moving with a goal.',
    steps: { first: 'Try one drop-in class or pickup game.', next: 'Pick one and go twice a week for a month.', deeper: 'Join a rec league, team, or sign up for an event.' } },
  { id: 'l_cook', title: 'Cook for people', themes: ['hands', 'create'], zones: ['physical', 'social', 'creative'], values: ['family', 'creativity'],
    what: 'Feeding yourself well, and feeding the people you care about.',
    steps: { first: 'Cook one new recipe this week.', next: 'Cook for friends or family once a week for a month.', deeper: 'Learn one kind of food really well, or teach someone your best recipe.' } },

  // Figuring things out
  { id: 'l_strategy', title: 'Strategy games & puzzles', themes: ['figure'], zones: ['mental', 'social'], values: ['mastery', 'learning'],
    what: 'Chess, strategy games, puzzles — getting better at thinking, against real people.',
    steps: { first: 'Play a few games of chess or a strategy game against real people.', next: 'Learn one strategy on purpose and practice it for two weeks.', deeper: 'Join a club or enter a local tournament.' } },
  { id: 'l_rabbithole', title: 'Learn something just because', themes: ['figure'], zones: ['mental', 'creative'], values: ['learning'],
    what: 'Space, history, languages, how the brain works — curiosity with no grade attached.',
    steps: { first: 'Pick a question you’ve always wondered about and spend an hour on it.', next: 'Take a free online course and finish the first part.', deeper: 'Teach what you learned to someone, or write it up.' } },
  { id: 'l_nature', title: 'Nature watching & citizen science', themes: ['figure', 'hands'], zones: ['spiritual', 'mental'], values: ['outdoors', 'learning'],
    what: 'Birds, bugs, plants, stars — noticing the world, and helping real scientists do it.',
    steps: { first: 'Photograph a plant or bird and identify it with a free app like iNaturalist or Merlin.', next: 'Log what you see on one walk a week for a month.', deeper: 'Contribute to a real research project on iNaturalist or Zooniverse.' } },
  { id: 'l_read', title: 'Read, and talk about it', themes: ['figure', 'create'], zones: ['mental', 'social'], values: ['learning', 'independence'],
    what: 'Books you actually picked. Library cards are free, and so are audiobooks through most libraries.',
    steps: { first: 'Read one chapter of a book you chose yourself.', next: 'Finish a book this month.', deeper: 'Join or start a book club.' } },

  // Creating & expressing
  { id: 'l_music', title: 'Make music', themes: ['create'], zones: ['creative', 'social'], values: ['creativity', 'mastery'],
    what: 'An instrument, singing, making beats — something that sounds like you.',
    steps: { first: 'Learn one song or beat from a free video or app.', next: 'Practice 15 minutes a day for two weeks.', deeper: 'Play with other people, or share a recording.' } },
  { id: 'l_art', title: 'Draw, paint, or design', themes: ['create'], zones: ['creative', 'mental'], values: ['creativity', 'independence'],
    what: 'Sketchbooks, digital art, photography — seeing things and putting them down your way.',
    steps: { first: 'Fill one page. Doodles count.', next: 'Make something small every day for two weeks.', deeper: 'Take a class, or share your work with one person.' } },
  { id: 'l_journal', title: 'Write for yourself', themes: ['create', 'figure'], zones: ['mental', 'spiritual'], values: ['independence', 'creativity'],
    what: 'Journaling, stories, poems. Writing is one of the most direct ways to find out what you think.',
    steps: { first: 'Write for 10 minutes about anything. Nobody will read it.', next: 'Write three times a week for a month.', deeper: 'Write something to share — a story, a post, a letter to someone.' } },
  { id: 'l_perform', title: 'Perform', themes: ['create', 'lead'], zones: ['creative', 'social'], values: ['creativity', 'adventure'],
    what: 'Theater, improv, open mics, dance — being seen doing something you made.',
    steps: { first: 'Go watch an open mic, improv night, or community theater show.', next: 'Take a beginner class.', deeper: 'Sign up for an open mic or an audition.' } },

  // Helping people
  { id: 'l_volunteer', title: 'Volunteer', themes: ['people'], zones: ['social', 'spiritual'], values: ['helping', 'community'],
    what: 'Food banks, shelters, cleanups, your place of worship — useful work with people around you.',
    steps: { first: 'Sign up for one volunteer shift near you.', next: 'Go back to the same place a few times so people get to know you.', deeper: 'Take on a regular role there.' } },
  { id: 'l_mentor', title: 'Help someone younger', themes: ['people'], zones: ['social', 'spiritual'], values: ['helping', 'community'],
    what: 'Tutoring, coaching, or just being the person you needed when you were younger.',
    steps: { first: 'Help one younger person with something you know how to do.', next: 'Tutor or coach someone once a week for a month.', deeper: 'Join a mentoring or tutoring program.' } },
  { id: 'l_people', title: 'Invest in your people', themes: ['people'], zones: ['social'], values: ['family', 'teamwork'],
    what: 'The friends and family you already have, on purpose instead of by accident.',
    steps: { first: 'Message one person you miss.', next: 'Set a standing time to call or see one friend or family member.', deeper: 'Host something small — a meal, a game night.' } },
  { id: 'l_animals', title: 'Care for animals', themes: ['people', 'hands'], zones: ['spiritual', 'physical', 'mental'], values: ['helping', 'outdoors'],
    what: 'Shelters, fostering, walking dogs — calm, physical, and they’re always glad to see you.',
    steps: { first: 'Visit or volunteer at an animal shelter.', next: 'Offer to walk a neighbor’s dog regularly.', deeper: 'Foster an animal, if your home allows it.' } },

  // Leading & persuading
  { id: 'l_organize', title: 'Bring people together', themes: ['lead', 'people'], zones: ['social'], values: ['community', 'teamwork'],
    what: 'Game nights, pickup games, clubs, meetups — being the reason a group exists.',
    steps: { first: 'Invite a few people to do one thing together.', next: 'Make it a regular thing.', deeper: 'Start a club, group, or event.' } },
  { id: 'l_cause', title: 'Stand up for something', themes: ['lead', 'people'], zones: ['spiritual', 'social'], values: ['fairness', 'community'],
    what: 'A cause, a neighborhood issue, your school — putting effort behind what you believe.',
    steps: { first: 'Learn about one local issue you care about.', next: 'Go to a public meeting or join a group working on it.', deeper: 'Help lead a project, or speak up at a meeting.' } },
  { id: 'l_challenge', title: 'Take on a personal challenge', themes: ['lead', 'hands'], zones: ['physical', 'mental'], values: ['mastery', 'adventure'],
    what: 'A 30-day challenge, a first 5K, a skill you said you’d never do — proving something to yourself.',
    steps: { first: 'Pick a 30-day challenge: steps, pushups, no soda, reading.', next: 'Track it every single day in the Planner.', deeper: 'Do a bigger one with other people, like a charity walk or run.' } },

  // Organizing & running things
  { id: 'l_money', title: 'Take control of your money', themes: ['order'], zones: ['financial', 'mental'], values: ['security', 'stability'],
    what: 'Knowing where it goes, so it stops being a constant background worry.',
    steps: { first: 'Write down everything you spend for one week.', next: 'Make a simple plan: bills, saving, and fun.', deeper: 'Build a small emergency cushion, a little at a time.' } },
  { id: 'l_space', title: 'Make your space work for you', themes: ['order', 'create'], zones: ['mental', 'physical'], values: ['stability', 'independence'],
    what: 'A room that calms you down instead of stressing you out.',
    steps: { first: 'Clear one surface or corner completely.', next: 'Do a 10-minute reset of your space every night for two weeks.', deeper: 'Rearrange one room around how you actually live.' } },
  { id: 'l_rhythm', title: 'Build a daily rhythm', themes: ['order'], zones: ['physical', 'mental'], values: ['stability', 'mastery'],
    what: 'A steady wake time and a couple of anchors that make every other good thing easier.',
    steps: { first: 'Pick a wake-up time and keep it for a week.', next: 'Add one small morning or evening habit in the Planner.', deeper: 'Do a Weekly Review every week for a month.' } },
  { id: 'l_screens', title: 'Reset your screen habits', themes: ['order', 'figure'], zones: ['digital', 'mental'], values: ['independence', 'freedom'],
    what: 'Using your phone on purpose, instead of it using you.',
    steps: { first: 'Check your screen time and choose one app to cut back on.', next: 'Keep the first hour of your day phone-free for a week.', deeper: 'Swap one hour of scrolling a day for something else on this list.' } },

  // Meaning — no theme on purpose; it's for everyone
  { id: 'l_meaning', title: 'Explore meaning, faith, or purpose', themes: [], zones: ['spiritual', 'mental'], values: ['faith', 'community'],
    what: 'Faith, meditation, philosophy, service — whatever helps you answer “what is my life for?”',
    steps: { first: 'Spend 10 quiet minutes with the question: what do I want my life to stand for?', next: 'Visit a place of worship, meditation group, or discussion group that interests you.', deeper: 'Commit to a regular practice — prayer, meditation, service, or study.' } },
];

export const LIFE_PATH_MAP = Object.fromEntries(LIFE_PATHS.map(p => [p.id, p]));

// ─── One lookup for anything an experiment can point at ────────────────────
// kind: 'work' (PATHS), 'life' (LIFE_PATHS), 'quality' (QUALITIES).
export function findItem(id) {
  if (PATH_MAP[id]) return { kind: 'work', item: PATH_MAP[id], title: PATH_MAP[id].title };
  if (LIFE_PATH_MAP[id]) return { kind: 'life', item: LIFE_PATH_MAP[id], title: LIFE_PATH_MAP[id].title };
  if (QUALITY_MAP[id]) return { kind: 'quality', item: QUALITY_MAP[id], title: `Being ${QUALITY_MAP[id].label.toLowerCase()}` };
  return null;
}

const WORK_RUNG_MAP = Object.fromEntries(EXPERIMENT_RUNGS.map(r => [r.id, r]));
const LIFE_RUNG_MAP = Object.fromEntries(LIFE_RUNGS.map(r => [r.id, r]));
const PRACTICE_RUNG = { id: 'practice', label: 'Practice', effort: 'This week', days: 7, icon: 'sparkles-outline' };

export function findRung(kind, rungId) {
  if (kind === 'life') return LIFE_RUNG_MAP[rungId] || null;
  if (kind === 'quality') return PRACTICE_RUNG;
  return WORK_RUNG_MAP[rungId] || null;
}

export function lifeExperimentText(path, rungId) {
  return path?.steps?.[rungId] || '';
}
