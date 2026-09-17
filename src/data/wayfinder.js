// src/data/wayfinder.js
//
// Content for Wayfinder — the part of the app for people who don't know yet
// what they want to do, what they're good at, or who they want to be.
//
// Everything else in the app assumes you walked in with a direction: pick a
// persona, pick a class, start a build. Wayfinder is for the step before
// that, and it's built on two ideas that hold up better than a personality
// quiz does:
//
//   1. Interests have a shape. The six themes below are Holland's RIASEC
//      model in plain words, kept in hexagon order — neighbours are related
//      (hands-on sits next to figuring-out and organizing), opposites are
//      not. It's the framework behind the U.S. Department of Labor's own
//      interest profiler, and it describes what pulls you, not a fixed
//      "type" you are. All the activity statements here are written for
//      this app; none are copied from any published inventory.
//
//   2. Nobody finds who they are by thinking harder. They find out by trying
//      things — small, cheap, real — and noticing how it felt. So the output
//      is not a verdict. It's a few paths worth testing, a ladder of
//      experiments for each, and a map that changes as the results come in.
//      "Not this" is a result, and a useful one.
//
// Written to be read by a 13-year-old and a 45-year-old alike. Nothing here
// is adult financial content, and nothing tells anyone what they personally
// should do — it shows what fits the answers and why.
//
// Keep claims general and true: "usually", "often", "rules differ by state".
// No pay figures — they go stale and vary by place; Career Expeditions and
// the BLS link carry that instead.

// ─── Themes (RIASEC, hexagon order) ─────────────────────────────────────────
export const THEMES = [
  {
    id: 'hands', short: 'Hands-on', label: 'Building & fixing', emoji: '🛠️', icon: 'hammer-outline', color: '#D9663A',
    drawn: 'Work you can see and touch — fixing, building, operating, being on your feet. You would rather do it than talk about it.',
    watch: 'A job that keeps you at a desk all day can feel like a cage, even when it pays well.',
  },
  {
    id: 'figure', short: 'Figuring out', label: 'Figuring things out', emoji: '🔍', icon: 'search-outline', color: '#3A7BD5',
    drawn: 'Understanding how things work — puzzles, problems, questions that have real answers. You would rather work it out than be told.',
    watch: 'Work with no room to dig in or ask "why" gets boring for you fast.',
  },
  {
    id: 'create', short: 'Creating', label: 'Creating & expressing', emoji: '🎨', icon: 'color-palette-outline', color: '#B45CC9',
    drawn: 'Making things that did not exist before, in your own style — visual, written, musical, or just a new way to do something ordinary.',
    watch: 'Strict rules and repetitive work drain you. A lot of creative work starts part-time next to something else — that is normal, not failing.',
  },
  {
    id: 'people', short: 'Helping', label: 'Helping people', emoji: '🤝', icon: 'heart-outline', color: '#2BB5A0',
    drawn: 'Being useful to people directly — teaching, caring, supporting, having someone’s back when it counts.',
    watch: 'Helping work burns people out when nobody is looking after them. Boundaries are a skill, not selfishness.',
  },
  {
    id: 'lead', short: 'Leading', label: 'Leading & persuading', emoji: '📣', icon: 'megaphone-outline', color: '#D9A032',
    drawn: 'Making things happen — convincing people, deciding, selling, starting something and watching it grow.',
    watch: 'Work where you have no say and no upside can feel pointless to you. Look for places where effort gets rewarded.',
  },
  {
    id: 'order', short: 'Organizing', label: 'Organizing & running things', emoji: '🗂️', icon: 'file-tray-stacked-outline', color: '#4E9A5B',
    drawn: 'Keeping things running right — systems, details, numbers, plans that actually work. People trust you with the important stuff.',
    watch: 'A chaotic workplace with no clear process can stress you out more than the work itself.',
  },
];

export const THEME_MAP = Object.fromEntries(THEMES.map(t => [t.id, t]));

// ─── Step 1 · What you've already done ──────────────────────────────────────
// The answer to "I don't know what I can do" is usually "more than you
// think, you just don't call it a skill." Most of these never make it onto a
// résumé. `skills` are written as things a person can say about themselves
// — no "you"/"your", because they're also dropped into a first-person "I'm
// someone who is good at…" sentence, and the FIRST skill of each has to
// read after "good at".
// `themes` are light signals only — doing something out of necessity is not
// the same as liking it, which is why the map shows this separately from
// what pulls you.
export const EXPERIENCE_GROUPS = [
  { id: 'work',    label: 'Work & hustle' },
  { id: 'home',    label: 'Home & family' },
  { id: 'people',  label: 'Friends & community' },
  { id: 'self',    label: 'On your own' },
];

export const EXPERIENCES = [
  // Work & hustle
  { id: 'retail', group: 'work', emoji: '🛒', label: 'Worked a register or a retail floor',
    skills: ['Handling money accurately', 'Staying calm with upset customers', 'Working fast when it gets busy'], themes: ['order', 'people', 'lead'] },
  { id: 'food', group: 'work', emoji: '🍳', label: 'Worked in food service or a kitchen',
    skills: ['Juggling several things during a rush', 'Pulling together with a team under pressure', 'Following safety routines'], themes: ['hands', 'order', 'people'] },
  { id: 'labor', group: 'work', emoji: '🧱', label: 'Did physical work — moving, landscaping, construction, cleaning',
    skills: ['Using tools safely', 'Stamina for long, physical days', 'Finishing a job to a standard'], themes: ['hands'] },
  { id: 'warehouse', group: 'work', emoji: '📦', label: 'Worked in a warehouse or on a line',
    skills: ['Following a process exactly', 'Watching out for safety', 'Staying consistent over a long shift'], themes: ['hands', 'order'] },
  { id: 'driving', group: 'work', emoji: '🚗', label: 'Delivered, drove, or did gig work',
    skills: ['Planning routes and time', 'Working without a boss watching', 'Handling whatever the day brings'], themes: ['hands', 'order'] },
  { id: 'selling', group: 'work', emoji: '🏷️', label: 'Sold things — resold, ran a stand, a side hustle',
    skills: ['Pricing something so it sells', 'Getting people interested', 'Keeping track of what came in and out'], themes: ['lead', 'order'] },
  { id: 'babysit', group: 'work', emoji: '🧸', label: 'Babysat or watched younger kids',
    skills: ['Being responsible for someone’s safety', 'Patience', 'Keeping kids busy and out of trouble'], themes: ['people'] },

  // Home & family
  { id: 'caregiving', group: 'home', emoji: '🩹', label: 'Helped take care of a family member',
    skills: ['Keeping track of medicine and appointments', 'Patience when it is hard', 'Speaking up for someone who needs it'], themes: ['people', 'order'] },
  { id: 'translating', group: 'home', emoji: '🗣️', label: 'Translated or handled paperwork for family',
    skills: ['Explaining complicated things simply', 'Dealing with offices and forms', 'Being trusted with important information'], themes: ['people', 'order'] },
  { id: 'household', group: 'home', emoji: '🏠', label: 'Ran a household — bills, groceries, schedules',
    skills: ['Budgeting', 'Planning ahead', 'Juggling a lot of priorities at once'], themes: ['order', 'lead'] },
  { id: 'fixing', group: 'home', emoji: '🔧', label: 'Fixed things around the house, a car, or a bike',
    skills: ['Tracking down what’s actually wrong', 'Using tools', 'Learning from videos and manuals'], themes: ['hands', 'figure'] },
  { id: 'cooking', group: 'home', emoji: '🥘', label: 'Cooked regularly for other people',
    skills: ['Planning a meal from start to finish', 'Adapting when something runs out', 'Timing several things at once'], themes: ['hands', 'create', 'people'] },

  // Friends & community
  { id: 'advice', group: 'people', emoji: '💬', label: 'Been the friend people come to for advice',
    skills: ['Listening without jumping in', 'Reading how people are really feeling', 'Keeping things private'], themes: ['people'] },
  { id: 'events', group: 'people', emoji: '🎉', label: 'Organized a trip, party, or event',
    skills: ['Getting a group of people to agree', 'Planning the details', 'Fixing things when plans fall apart'], themes: ['lead', 'order'] },
  { id: 'team', group: 'people', emoji: '🏀', label: 'Played on a team — sports, band, esports',
    skills: ['Practicing even when it is boring', 'Working toward something as a group', 'Taking feedback and getting better'], themes: ['people', 'hands'] },
  { id: 'volunteer', group: 'people', emoji: '🙌', label: 'Volunteered, or helped out at a place of worship or community event',
    skills: ['Reliably showing up', 'Working with all kinds of people', 'Doing work that serves others'], themes: ['people', 'lead'] },
  { id: 'moderating', group: 'people', emoji: '🛡️', label: 'Ran or moderated a group chat, Discord, or online community',
    skills: ['Setting rules and enforcing them fairly', 'Calming down arguments', 'Growing a community'], themes: ['lead', 'people', 'order'] },

  // On your own
  { id: 'gaming', group: 'self', emoji: '🎮', label: 'Got really good at a competitive game',
    skills: ['Thinking in strategies', 'Learning from losing', 'Making fast decisions under pressure'], themes: ['figure', 'lead'] },
  { id: 'making', group: 'self', emoji: '🎬', label: 'Made art, music, videos, or designs',
    skills: ['Making something from nothing', 'Finishing projects', 'Sharing work publicly'], themes: ['create'] },
  { id: 'writing', group: 'self', emoji: '✍️', label: 'Wrote a lot — stories, posts, journals, fan fiction',
    skills: ['Writing clearly', 'An original voice', 'Sticking with a long project'], themes: ['create'] },
  { id: 'tech', group: 'self', emoji: '💻', label: 'Built a PC, modded a game, or taught yourself some code',
    skills: ['Troubleshooting technical problems', 'Self-teaching technical skills', 'Patience with things that do not work yet'], themes: ['figure', 'hands'] },
  { id: 'selftaught', group: 'self', emoji: '📚', label: 'Taught yourself something hard from videos or books',
    skills: ['Learning without a teacher', 'Keeping at it when it is confusing', 'Finding good sources'], themes: ['figure'] },
  // No theme on purpose. It isn't an interest — it's evidence.
  { id: 'hardtime', group: 'self', emoji: '🌱', label: 'Got through something really hard',
    skills: ['Keeping going when it is hard', 'Knowing when to ask for help'], themes: [] },
];

// ─── Step 2 · What pulls you in ─────────────────────────────────────────────
// Five per theme. Everyday and concrete, so they can be answered by someone
// who has never done any of them — the question is "does this sound good",
// not "are you qualified".
const ACTIVITIES_BY_THEME = {
  hands: [
    'Take apart something broken to see if you can fix it',
    'Build something real with tools — a shelf, a bike, a PC',
    'Work outside most of the day, whatever the weather',
    'Learn to drive or run a big machine — a forklift, a boat, a crane',
    'Cook a big meal for a lot of people',
  ],
  figure: [
    'Figure out why a game, app, or machine is acting weird',
    'Read about how the body, the brain, or space actually works',
    'Stick with a hard puzzle even if it takes hours',
    'Dig through numbers to find a pattern nobody noticed',
    'Test an idea with an experiment to see if it is really true',
  ],
  create: [
    'Design how something looks — a logo, an outfit, a room',
    'Write a story, a song, or a script',
    'Make videos, music, or art and share it',
    'Perform in front of people — act, play, do comedy',
    'Invent a completely new way to do something ordinary',
  ],
  people: [
    'Teach someone a skill until it finally clicks for them',
    'Take care of someone who is sick, hurt, or elderly',
    'Be the person someone calls when something goes wrong',
    'Coach a team, or help a kid get better at something',
    'Help a stranger sort out a confusing problem',
  ],
  lead: [
    'Talk someone into trying something you believe in',
    'Sell something — at a stand, online, anywhere',
    'Take charge when a group cannot decide what to do',
    'Start your own thing — a side hustle, a club, a channel',
    'Negotiate a better deal or price',
  ],
  order: [
    'Keep track of money coming in and going out',
    'Organize a messy space so everything has a place',
    'Work through a checklist carefully so nothing gets missed',
    'Plan a schedule or an event down to the details',
    'Be the reliable one who keeps a system running smoothly',
  ],
};

// Interleaved across themes so the questions don't arrive in six obvious
// blocks — answering "not me" five times in a row to the same theme teaches
// the person the test instead of asking them something. Two alternating
// round orders (indexes into THEMES), chosen so no theme ever follows
// itself, including across the join between rounds.
const ROUND_ORDERS = [[0, 3, 1, 4, 2, 5], [4, 1, 5, 2, 0, 3]];

export const ACTIVITIES = (() => {
  const out = [];
  for (let i = 0; i < 5; i++) {
    ROUND_ORDERS[i % 2].forEach((t) => {
      const theme = THEMES[t];
      out.push({ id: `${theme.id}_${i}`, theme: theme.id, text: ACTIVITIES_BY_THEME[theme.id][i] });
    });
  }
  return out;
})();

export const ANSWER_OPTIONS = [
  { value: 2, label: 'Yes, that', icon: 'thumbs-up-outline' },
  { value: 1, label: 'Maybe',     icon: 'help-outline' },
  { value: 0, label: 'Not me',    icon: 'thumbs-down-outline' },
];

// ─── Step 3 · What matters ──────────────────────────────────────────────────
export const MAX_VALUES = 5;

export const VALUES = [
  { id: 'security',     emoji: '🧾', label: 'Steady money',        blurb: 'Knowing the bills are covered' },
  { id: 'wealth',       emoji: '📈', label: 'Earning a lot',       blurb: 'Room to build real wealth' },
  { id: 'freedom',      emoji: '🕊️', label: 'Freedom',             blurb: 'Control over my time and how I work' },
  { id: 'helping',      emoji: '🤲', label: 'Helping people',      blurb: 'Work that makes someone’s life better' },
  { id: 'creativity',   emoji: '✨', label: 'Creativity',          blurb: 'Making things that did not exist' },
  { id: 'stability',    emoji: '⚓', label: 'Stability',           blurb: 'A routine I can count on' },
  { id: 'adventure',    emoji: '🧭', label: 'Variety',             blurb: 'Not the same day twice' },
  { id: 'respect',      emoji: '🏅', label: 'Respect',             blurb: 'Being known as good at what I do' },
  { id: 'learning',     emoji: '🌱', label: 'Always learning',     blurb: 'Getting better, never bored' },
  { id: 'family',       emoji: '🏡', label: 'Time for family',     blurb: 'Room for the people I love' },
  { id: 'fairness',     emoji: '⚖️', label: 'Fairness',            blurb: 'Standing up for people, doing right' },
  { id: 'building',     emoji: '🏗️', label: 'Owning something',    blurb: 'Something with my name on it' },
  { id: 'teamwork',     emoji: '👥', label: 'A good crew',         blurb: 'Working alongside people I trust' },
  { id: 'independence', emoji: '🎧', label: 'Working on my own',   blurb: 'Space to focus without people hovering' },
  { id: 'outdoors',     emoji: '🌤️', label: 'Moving, not sitting', blurb: 'Outside or on my feet, not stuck at a desk' },
  { id: 'faith',        emoji: '🕯️', label: 'Faith & purpose',     blurb: 'Living in line with what I believe' },
  { id: 'community',    emoji: '🏘️', label: 'My community',        blurb: 'Lifting up the place I come from' },
  { id: 'mastery',      emoji: '🎯', label: 'Mastery',             blurb: 'Being really, really good at one thing' },
];

export const VALUE_MAP = Object.fromEntries(VALUES.map(v => [v.id, v]));

// ─── Real life ──────────────────────────────────────────────────────────────
// Suggestions that ignore someone's actual situation aren't advice, they're
// a brochure. These two answers re-rank paths; they never hide one.
export const TIMELINES = [
  { id: 'now',  label: 'I need income soon' },
  { id: 'year', label: 'Within a year or so' },
  { id: 'time', label: 'I have time to train' },
];

export const ROUTES = [
  { id: 'onjob',      label: 'Learn on the job',        paid: true  },
  { id: 'apprentice', label: 'Paid apprenticeship',     paid: true  },
  { id: 'cert',       label: 'Certificate (weeks–months)', paid: false },
  { id: 'self',       label: 'Teach myself',            paid: false },
  { id: 'college2',   label: '2-year college',          paid: false },
  { id: 'college4',   label: '4-year college or more',  paid: false },
];

export const ROUTE_MAP = Object.fromEntries(ROUTES.map(r => [r.id, r]));

// ─── Paths ──────────────────────────────────────────────────────────────────
// Six per theme, deliberately weighted toward work you can reach without a
// four-year degree — that's who this is for. `themes[0]` is the main one.
// `careerId` links to a full write-up in Career Expeditions
// (src/screens/library/careerexplore.js CAREERS) where one exists.
// `try` is the path's own hands-on experiment; the generic rungs of the
// ladder come from EXPERIMENT_RUNGS below.
export const PATHS = [
  // Building & fixing
  { id: 'electrician', title: 'Electrician', role: 'an electrician', themes: ['hands', 'figure'], routes: ['apprentice', 'cert'], values: ['security', 'mastery', 'independence'],
    what: 'Wires homes and buildings and keeps the power running safely. Most electricians train through a paid apprenticeship.',
    try: 'Look up electrical apprenticeship programs near you — search your city plus "electrical apprenticeship" — and read what they ask for to apply.' },
  { id: 'hvac', title: 'HVAC technician', role: 'an HVAC technician', themes: ['hands', 'figure'], routes: ['cert', 'apprentice', 'onjob'], values: ['security', 'independence', 'helping'],
    what: 'Installs and repairs heating and air conditioning. Every day is a different building and a different problem.',
    try: 'Next time something at home stops working, find a repair video and try to follow it. Notice whether hunting for the problem felt fun or annoying.' },
  { id: 'mechanic', title: 'Auto or diesel mechanic', role: 'a mechanic', themes: ['hands', 'figure'], routes: ['cert', 'onjob', 'college2'], values: ['mastery', 'independence', 'building'],
    what: 'Diagnoses and fixes cars, trucks, and heavy equipment. A lot of it is detective work before any wrench comes out.',
    try: 'Learn one real maintenance job from a video — check the oil, change a tire, fix a bike chain — and do it start to finish.' },
  { id: 'welder', title: 'Welder or fabricator', role: 'a welder', themes: ['hands', 'create'], routes: ['cert', 'apprentice'], values: ['security', 'mastery', 'outdoors'],
    what: 'Joins and shapes metal for buildings, ships, pipelines, and custom work. Good welders are in demand in a lot of places.',
    try: 'Find a community college or makerspace near you with an intro welding class and check when the next one starts.' },
  { id: 'cook', title: 'Cook or chef', role: 'a cook or chef', themes: ['hands', 'create'], routes: ['onjob', 'cert'], values: ['creativity', 'teamwork', 'adventure'],
    what: 'Runs a station or a whole kitchen. Fast, physical, creative — and you see people enjoy what you made.',
    try: 'Cook one meal for four or more people from a recipe you have never made. Time it. Did the pressure feel good or bad?' },
  { id: 'outdoor', title: 'Parks, landscaping, or forestry work', role: 'someone who works in parks or landscaping', themes: ['hands', 'people'], routes: ['onjob', 'cert', 'college2'], values: ['outdoors', 'independence', 'community'],
    what: 'Takes care of land, trees, trails, and green spaces. Outside nearly every day.',
    try: 'Sign up for one park cleanup, trail day, or community garden shift.' },

  // Figuring things out
  { id: 'itsupport', title: 'IT support technician', role: 'an IT support tech', themes: ['figure', 'people'], routes: ['cert', 'self', 'onjob'], values: ['security', 'learning', 'helping'],
    what: 'Fixes computers, networks, and accounts when they break — and explains it to the person who is stressed about it. A common first step into tech.',
    try: 'Fix one tech problem for a family member or friend, and write down every step you took to find the cause.' },
  { id: 'cyber', title: 'Cybersecurity analyst', role: 'a cybersecurity analyst', themes: ['figure', 'order'], routes: ['cert', 'college4', 'self'], values: ['learning', 'security', 'fairness'], careerId: '14',
    what: 'Protects systems from attackers by thinking like one. Lots of puzzles, lots of learning, and it never stays the same.',
    try: 'Spend an hour on a free beginner hacking puzzle site built for learners, like picoCTF.' },
  { id: 'developer', title: 'Software developer', role: 'a software developer', themes: ['figure', 'create'], routes: ['self', 'college4', 'cert'], values: ['creativity', 'freedom', 'learning'], careerId: '7',
    what: 'Builds apps, websites, and tools. Plenty of working developers are self-taught — what counts is what you can show you built.',
    try: 'Do the first hour of a free beginner course like freeCodeCamp or Harvard’s CS50, and notice whether you want to keep going.' },
  { id: 'labtech', title: 'Lab or medical technician', role: 'a lab technician', themes: ['figure', 'people'], routes: ['college2', 'cert'], values: ['helping', 'stability', 'learning'],
    what: 'Runs the tests doctors rely on — blood work, samples, imaging. Science that helps real patients, without med school.',
    try: 'Look up medical lab technician programs at your nearest community college and read what a week of classes looks like.' },
  { id: 'data', title: 'Data analyst', role: 'a data analyst', themes: ['figure', 'order'], routes: ['self', 'cert', 'college4'], values: ['learning', 'independence', 'security'],
    what: 'Turns messy numbers into answers a business can act on. Spreadsheets first, fancier tools later.',
    try: 'Track something for a week — spending, sleep, game stats — in a spreadsheet, then make one chart. Was finding the pattern satisfying?' },
  { id: 'scientist', title: 'Scientist or researcher', role: 'a scientist', themes: ['figure', 'create'], routes: ['college4'], values: ['learning', 'mastery', 'fairness'], careerId: '21',
    what: 'Asks questions nobody has answered yet and designs ways to find out. A long road through school, but a real one.',
    try: 'Help with real research online — Zooniverse lets anyone classify data for actual science projects.' },

  // Creating & expressing
  { id: 'designer', title: 'Graphic or UX designer', role: 'a designer', themes: ['create', 'figure'], routes: ['self', 'cert', 'college4'], values: ['creativity', 'freedom', 'respect'], careerId: '2',
    what: 'Decides how things look and how they feel to use — logos, websites, apps, packaging. Your portfolio matters more than your paperwork.',
    try: 'Redesign something ugly you use every day — a flyer, a menu, an app screen — in a free tool like Canva or Figma.' },
  { id: 'video', title: 'Video editor or content creator', role: 'a video editor or creator', themes: ['create', 'lead'], routes: ['self', 'onjob'], values: ['creativity', 'freedom', 'building'], careerId: '20',
    what: 'Shoots and edits video for brands, channels, and productions. The skills are learnable free; the hard part is consistency.',
    try: 'Make a 60-second video about something you know well. Post it, or just show it to one person and ask what worked.' },
  { id: 'writer', title: 'Writer or copywriter', role: 'a professional writer', themes: ['create', 'order'], routes: ['self', 'college4'], values: ['creativity', 'independence', 'mastery'], careerId: '17',
    what: 'Writes the words people read — ads, websites, instructions, articles, scripts. Businesses pay for clear writing.',
    try: 'Write one page explaining something you know how to do, clear enough that a stranger could follow it.' },
  { id: 'beauty', title: 'Barber, stylist, or tattoo artist', role: 'a barber, stylist, or tattoo artist', themes: ['create', 'people'], routes: ['cert', 'apprentice'], values: ['creativity', 'building', 'community'],
    what: 'Creative work done on real people, with regulars who come back to you. Licensing and apprenticeship rules differ by state.',
    try: 'Ask someone who cuts hair, does nails, or tattoos how they got licensed or trained — and what they would do differently.' },
  { id: 'sound', title: 'Sound or stage technician', role: 'a sound or stage tech', themes: ['create', 'hands'], routes: ['onjob', 'cert', 'self'], values: ['creativity', 'teamwork', 'adventure'],
    what: 'Runs the sound, lights, and gear that make shows, services, and events work. Lots of people start by volunteering.',
    try: 'Volunteer to help run sound or lights at a school, community, or place-of-worship event.' },
  { id: 'gamedev', title: 'Game developer', role: 'a game developer', themes: ['create', 'figure'], routes: ['self', 'college4'], values: ['creativity', 'mastery', 'teamwork'], careerId: '15',
    what: 'Designs and builds games — code, art, sound, and how it feels to play. Small finished games teach more than big unfinished ones.',
    try: 'Make a tiny playable game in a free beginner tool like Scratch or GDevelop over one weekend.' },

  // Helping people
  { id: 'nursing', title: 'Nursing (CNA → LPN → RN)', role: 'a nurse or nursing assistant', themes: ['people', 'figure'], routes: ['cert', 'college2', 'college4'], values: ['helping', 'security', 'respect'], careerId: '19',
    what: 'Cares for patients hands-on. It is a ladder: a nursing assistant certificate is often a short program, and each rung builds toward the next.',
    try: 'Look up nursing assistant (CNA) programs near you and see how long they take and what they cost.' },
  { id: 'teaching', title: 'Teacher or teaching assistant', role: 'a teacher', themes: ['people', 'create'], routes: ['college4', 'onjob', 'college2'], values: ['helping', 'stability', 'community'], careerId: '22',
    what: 'Helps people learn — in classrooms, after-school programs, or one-on-one. Teaching assistant jobs are a way in before a degree.',
    try: 'Tutor one person — a sibling, a neighbor, a classmate — for an hour. Notice how it felt when it clicked for them.' },
  { id: 'counseling', title: 'Counselor or social worker', role: 'a counselor or social worker', themes: ['people', 'lead'], routes: ['college4'], values: ['helping', 'fairness', 'community'],
    what: 'Supports people through hard stretches of life and connects them to help. School counselor, social worker, and therapist are different jobs with different training.',
    try: 'Read what a school counselor, a social worker, and a therapist each actually do, and write down which one sounds most like you.' },
  { id: 'emt', title: 'EMT or paramedic', role: 'an EMT or paramedic', themes: ['people', 'hands'], routes: ['cert'], values: ['helping', 'adventure', 'teamwork'],
    what: 'First on the scene when someone is hurt. Intense, physical, and it matters in the moment.',
    try: 'Take a CPR and first-aid class — the Red Cross and many fire departments run them.' },
  { id: 'fitness', title: 'Coach, trainer, or rehab aide', role: 'a coach or trainer', themes: ['people', 'hands'], routes: ['cert', 'onjob', 'college2'], values: ['helping', 'outdoors', 'mastery'],
    what: 'Helps people get stronger, recover from injuries, or get better at a sport.',
    try: 'Help one person stick to a workout or practice plan for a week, and check in with them every day.' },
  { id: 'hr', title: 'HR or recruiting', role: 'someone in HR or recruiting', themes: ['people', 'order'], routes: ['onjob', 'college4'], values: ['helping', 'teamwork', 'fairness'], careerId: '23',
    what: 'Hires people, helps them when work goes wrong, and makes sure they are treated fairly.',
    try: 'Help a friend rewrite their résumé or practice answering interview questions.' },

  // Leading & persuading
  { id: 'sales', title: 'Sales', role: 'someone in sales', themes: ['lead', 'people'], routes: ['onjob'], values: ['wealth', 'freedom', 'respect'],
    what: 'Connects people with something they need and gets paid for closing. Many sales jobs pay partly on commission, so good months and slow months both happen.',
    try: 'Sell five of something — old clothes, baked goods, a small service — and write down which pitch worked.' },
  { id: 'business', title: 'Running your own business', role: 'a small business owner', themes: ['lead', 'order'], routes: ['self', 'onjob'], values: ['building', 'freedom', 'community'],
    what: 'Solving a problem people will pay for, and building something that is yours. Most businesses start small and local.',
    try: 'Pick one problem people near you already pay to solve — lawns, hair, rides, repairs — and write down what you would charge and who would pay.' },
  { id: 'manager', title: 'Store or restaurant manager', role: 'a store or restaurant manager', themes: ['lead', 'order'], routes: ['onjob'], values: ['respect', 'teamwork', 'security'],
    what: 'Runs the shift, the schedule, and the team. A lot of managers started on the front line of the same place.',
    try: 'Ask a shift lead or manager what they actually do all day that nobody sees.' },
  { id: 'marketing', title: 'Marketing', role: 'someone in marketing', themes: ['lead', 'create'], routes: ['self', 'college4'], values: ['creativity', 'wealth', 'learning'], careerId: '24',
    what: 'Figures out how to get the right people to notice something and care. Part creative, part numbers.',
    try: 'Pick a small local business with a weak social media page and write three posts you think would work better.' },
  { id: 'product', title: 'Product manager', role: 'a product manager', themes: ['lead', 'figure'], routes: ['onjob', 'college4'], values: ['building', 'teamwork', 'learning'], careerId: '18',
    what: 'Decides what an app or product should do next and gets a team to build it. Usually a job people move into after another role.',
    try: 'Write down three things that annoy you about an app you use every day, and how you would fix the worst one.' },
  { id: 'organizer', title: 'Community organizer or advocate', role: 'a community organizer', themes: ['lead', 'people'], routes: ['onjob', 'college4'], values: ['fairness', 'community', 'helping'],
    what: 'Brings people together to change something in their neighborhood, school, or workplace.',
    try: 'Go to one local public meeting — school board, city council, a tenants’ or neighborhood group — and notice who gets listened to and why.' },

  // Organizing & running things
  { id: 'bookkeeping', title: 'Bookkeeper or accountant', role: 'a bookkeeper or accountant', themes: ['order', 'figure'], routes: ['cert', 'college2', 'college4'], values: ['security', 'stability', 'mastery'], careerId: '25',
    what: 'Keeps a business’s money straight. Bookkeeping can start with a certificate; accounting usually means a degree.',
    try: 'Track every dollar you spend for two weeks and sort it into categories. Did organizing it feel calming or tedious?' },
  { id: 'admin', title: 'Office or medical administrator', role: 'an office or clinic administrator', themes: ['order', 'people'], routes: ['onjob', 'cert'], values: ['stability', 'teamwork', 'helping'],
    what: 'Keeps an office, clinic, or school running — schedules, records, the front desk, and the people calling in.',
    try: 'Offer to organize something messy for a family member — paperwork, a calendar, a closet — and notice how it feels while you do it.' },
  { id: 'logistics', title: 'Logistics coordinator', role: 'a logistics coordinator', themes: ['order', 'lead'], routes: ['onjob', 'cert', 'college4'], values: ['security', 'teamwork', 'mastery'],
    what: 'Gets things from where they are to where they need to be, on time. Warehouses, shipping, and supply chains all run on this.',
    try: 'Plan a real trip or event with a budget and a schedule, down to the hour.' },
  { id: 'paralegal', title: 'Paralegal', role: 'a paralegal', themes: ['order', 'figure'], routes: ['cert', 'college2'], values: ['fairness', 'stability', 'learning'],
    what: 'Does the research and paperwork that lawyers depend on. Law work without law school.',
    try: 'Watch a public court hearing — many courts stream them online — and notice what work had to happen before it started.' },
  { id: 'pharmtech', title: 'Pharmacy technician', role: 'a pharmacy technician', themes: ['order', 'people'], routes: ['cert', 'onjob'], values: ['helping', 'stability', 'security'],
    what: 'Fills prescriptions and helps patients at the counter. Careful, detailed work in healthcare.',
    try: 'Ask a pharmacist or pharmacy tech what the job is really like on a busy day.' },
  { id: 'dispatch', title: 'Dispatcher', role: 'a dispatcher', themes: ['order', 'people'], routes: ['onjob', 'cert'], values: ['helping', 'teamwork', 'stability'],
    what: 'Coordinates people on the move — 911 calls, trucks, repair crews. Calm on the phone while a lot happens at once.',
    try: 'Watch a day-in-the-life video of a 911 or trucking dispatcher and notice whether the pressure sounds exciting or exhausting.' },
];

export const PATH_MAP = Object.fromEntries(PATHS.map(p => [p.id, p]));

// ─── The experiment ladder ──────────────────────────────────────────────────
// Four rungs, cheapest first. Each one is a real thing to do this week, not
// a thing to think about. `days` sets the due date when it lands in tasks,
// `minutes` its estimate.
// `{role}` is replaced with the path's `role` ("an electrician") — the
// title alone doesn't take an article cleanly ("a Nursing (CNA → LPN → RN)").
export const EXPERIMENT_RUNGS = [
  { id: 'look', label: 'Look', effort: '15 minutes', days: 2, minutes: 15, icon: 'eye-outline', taskTitle: 'Watch a day in the life: {title}',
    template: 'Watch a "day in the life" video from {role}. Write down one part that sounded great and one that sounded awful.' },
  { id: 'talk', label: 'Talk', effort: 'About an hour', days: 7, minutes: 60, icon: 'chatbubbles-outline', taskTitle: 'Talk to {role}',
    template: 'Talk to {role} — someone you know, or someone a parent, teacher, counselor, or coworker can introduce you to.',
    questions: [
      'What does a normal day actually look like?',
      'What do you wish you’d known before you started?',
      'How would someone like me take a first step?',
    ] },
  { id: 'try', label: 'Try', effort: 'An afternoon', days: 7, minutes: 120, icon: 'flask-outline', taskTitle: 'Try it out: {title}', template: null /* the path's own `try` */ },
  { id: 'do', label: 'Do', effort: 'A few weeks', days: 21, minutes: null, icon: 'rocket-outline', taskTitle: 'Get real time around the work: {title}',
    template: 'Get real time around the work of {role} — a volunteer shift, a part-time job, shadowing someone, or a small project of your own.' },
];

export const RUNG_MAP = Object.fromEntries(EXPERIMENT_RUNGS.map(r => [r.id, r]));

export function experimentText(path, rungId) {
  const rung = RUNG_MAP[rungId];
  if (!rung || !path) return '';
  if (rungId === 'try') return path.try;
  return rung.template.replace('{role}', path.role);
}

// Short enough for a task row; the full experiment text goes in its notes.
export function experimentTaskTitle(path, rungId) {
  const rung = RUNG_MAP[rungId];
  if (!rung || !path) return '';
  return rung.taskTitle.replace('{title}', path.title).replace('{role}', path.role);
}

// ─── After an experiment ────────────────────────────────────────────────────
export const REFLECT_ENERGY = [
  { value: -1, label: 'Drained',   emoji: '🪫' },
  { value: 0,  label: 'Neutral',   emoji: '😐' },
  { value: 1,  label: 'Energized', emoji: '⚡' },
];

export const REFLECT_CURIOSITY = [
  { value: -1, label: 'Less curious', emoji: '🚪' },
  { value: 0,  label: 'About the same', emoji: '↔️' },
  { value: 1,  label: 'Want to know more', emoji: '🔭' },
];

// ─── Who I'm becoming ───────────────────────────────────────────────────────
// Sentence stems, each pre-filled from the map and freely editable. The
// point isn't a slogan — it's something true enough to reread on a bad day.
export const STATEMENT_STEMS = [
  { key: 'self',      stem: 'I’m someone who',        placeholder: 'stays calm when things get hectic' },
  { key: 'care',      stem: 'What matters to me is',  placeholder: 'steady money and time for my family' },
  { key: 'grow',      stem: 'I’m working on being more', placeholder: 'patient and reliable' },
  { key: 'exploring', stem: 'Right now I’m exploring', placeholder: 'whether hands-on work like HVAC fits me' },
  { key: 'next',      stem: 'My next small step is',  placeholder: 'talking to my cousin who’s an electrician' },
];

// ─── Outside links ──────────────────────────────────────────────────────────
export const LINKS = {
  interestProfiler: { label: 'O*NET Interest Profiler (U.S. Dept. of Labor)', url: 'https://www.mynextmove.org/explore/ip' },
  outlook:          { label: 'Occupational Outlook Handbook — pay, training, and job outlook', url: 'https://www.bls.gov/ooh/' },
  apprenticeships:  { label: 'Apprenticeship.gov — find a paid apprenticeship', url: 'https://www.apprenticeship.gov/' },
  support:          { label: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org' },
};
