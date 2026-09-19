// src/data/quests.js
// Quests: short, self-contained lessons that end with the person doing
// something, not just reading about it.
//
// A class topic (src/screens/classes/**) teaches a subject. A quest teaches
// someone how to go and learn it themselves: a quick idea, then outside
// research with a source they judge for themselves, a check that tests the
// usual misunderstandings, and one real thing to do this week. The app can't
// be anyone's whole education. It can make the first step easy and teach the
// habit of finding out.
//
// Every quest runs through the same screen (src/screens/QuestScreen.js), so
// adding one is adding an entry here. `npm run check` validates the shape
// and the content rules below (scripts/check-quests.mjs); add
// `--check-links` to confirm every resource still loads.
//
// No imports on purpose, same as objectives.js and experienceStages.js:
// plain data a script can load without the React Native graph.
//
// ─── Shape ──────────────────────────────────────────────────────────────────
//
//   id          stable key. Used in saved progress and activity_log, so never
//               rename one that has shipped.
//   subject     gamification subject key (the 14 in gameRegistry.js); XP and
//               missions are counted against it
//   area        planner life-area key (plannerService AREAS) for the task
//   spark       { hook, points[] }: the idea in about a minute
//   research    { intro, tasks[], sourcePrompt, explainPrompt }
//   check       5-8 questions, options shown shuffled (so never write "the
//               first one" in an explanation). Either multiple choice
//                 { question, options[], answerIndex, explanation }
//               (the same shape as a class topic's `practice`) or a number
//                 { question, answer: 960, explanation }
//   doIt        { title, detail, due: 'today' | 'tomorrow' }: becomes a task
//   resources   [{ title, who, url, kind: 'read' | 'tool' | 'watch' }]
//   regulated   money content: follows the regulated-content rule below
//
// ─── Content rules (enforced by scripts/check-quests.mjs) ───────────────────
//
// Questions test the misunderstanding, not recall. A question answerable
// from the sentence just before it teaches nothing.
//
// Every real-world figure, rate or benchmark in a sentence with a $ or %
// carries "(reviewed 2026)". Worked examples are exempt when they say so:
// a sentence with "Imagine", or a check question that starts with
// "Imagine" (its options and explanation included). The 50/30/20 split is
// the rule's own definition, not a figure about the world.
//
// `regulated` quests never tell someone what they personally should do:
// no "you should", "you need to" or "you must". Teach the mechanism.
//
// Sign-up is 13+. Write for teens and adults alike.

export const QUESTS = [
  // ── Learning how to learn ────────────────────────────────────────────────
  {
    id: 'feynman',
    title: 'The Feynman Technique',
    tagline: 'Find the gaps in what you think you know.',
    subject: 'mental',
    subjectLabel: 'Learning skills',
    area: 'mental',
    minutes: 10,
    icon: 'bulb-outline',
    color: '#8B5CF6',
    spark: {
      hook: 'Rereading your notes feels like studying. The words look familiar, so your brain decides it knows them. But recognizing an idea is not the same as being able to explain it from scratch, and a test, a job or a conversation asks for the second one.',
      points: [
        'Explain the idea in plain words, as if to someone who has never heard of it.',
        'Wherever you stall or reach for a big word, you have found a gap. Go back to a source for just that part, then explain it again.',
        'Pulling an idea out of your own memory, called retrieval practice, is one of the best-tested ways to make it stick. Explaining from memory is a form of it.',
        'It is named after the physicist Richard Feynman, who was known for explaining hard ideas simply. The step-by-step version was written up later by other people, based on how he worked.',
      ],
    },
    research: {
      intro: 'Try it on something real.',
      tasks: [
        'Pick one idea you learned recently or want to understand: how Wi-Fi works, what inflation is, how a vaccine works, anything.',
        'Without looking anything up, explain it to yourself in 3 or 4 short sentences. Notice exactly where you stall or use a word you could not define.',
        'Find one good source on that exact part. Read only enough to fill the gap.',
        'Write your explanation again below, gap filled, with no jargon.',
      ],
      sourcePrompt: 'The source you used to fill the gap',
      explainPrompt: 'Your explanation, gap filled (3 or 4 sentences, no jargon)',
    },
    check: [
      {
        question: 'Why can rereading your notes make you feel more ready than you are?',
        options: [
          'The words feel familiar, and familiar feels like understanding',
          'Rereading tires your eyes, so you remember less',
          'Notes are usually full of mistakes',
          'It only works if you read out loud',
        ],
        answerIndex: 0,
        explanation: 'Recognizing something is not the same as recalling it. A test asks you to produce the idea, not to recognize it on a page.',
      },
      {
        question: 'You write "chloroplasts convert light energy" in your explanation of photosynthesis. What does the technique say to do?',
        options: [
          'Leave it. It is the correct term',
          'Check you could say what that means in plain words, and study the part you can\'t',
          'Add more technical terms so it sounds complete',
          'Move on to a new topic',
        ],
        answerIndex: 1,
        explanation: 'Jargon is not wrong, but it can hide a gap. If you can\'t unpack a term, that is exactly the part to study.',
      },
      {
        question: 'Where does the technique tell you to spend your study time?',
        options: [
          'Rereading the whole chapter from the start',
          'On the exact spot where your explanation broke down',
          'On the parts you already explain well',
          'Memorizing definitions word for word',
        ],
        answerIndex: 1,
        explanation: 'The point of explaining is to find the weak spot. Studying everything again spends most of your time on what you already know.',
      },
      {
        question: 'Which of these is retrieval practice?',
        options: [
          'Highlighting the key sentences',
          'Closing the book and writing down what you remember',
          'Reading a summary someone else wrote',
          'Copying your notes out neatly',
        ],
        answerIndex: 1,
        explanation: 'Pulling an idea out of memory strengthens it. Highlighting, summaries and recopying all keep the answer in front of you.',
      },
      {
        question: 'Which explanation of inflation is the most Feynman-style?',
        options: [
          'A sustained increase in the general price level that reduces purchasing power.',
          'Prices across the board go up over time, so the same money buys less than it used to.',
          'A macroeconomic phenomenon driven by monetary expansion.',
          'What the central bank measures with the CPI.',
        ],
        answerIndex: 1,
        explanation: 'The textbook version is correct, but "general price level" and "purchasing power" each need explaining. The plain version says the same thing in words anyone can follow.',
      },
      {
        question: 'An analogy helps an explanation when it…',
        options: [
          'connects the new idea to something the listener already knows',
          'replaces the facts with a story',
          'makes the explanation longer',
          'uses as many comparisons as possible',
        ],
        answerIndex: 0,
        explanation: 'A good analogy is a bridge to something familiar. It should make the real idea clearer, not stand in for it.',
      },
    ],
    doIt: {
      title: 'Explain one thing you learned today, out loud, in 30 seconds',
      detail: 'Next time you finish a video, article or class, stop and explain the main idea out loud in plain words, to a friend or to no one. Notice where you stall. That is what to look up.',
      due: 'today',
    },
    resources: [
      { title: 'The Feynman Technique', who: 'Farnam Street', url: 'https://fs.blog/feynman-technique/', kind: 'read' },
      { title: 'Retrieval practice', who: 'The Learning Scientists', url: 'https://www.learningscientists.org/retrieval-practice', kind: 'read' },
      { title: 'Guides and research on retrieval practice', who: 'RetrievalPractice.org', url: 'https://www.retrievalpractice.org/', kind: 'read' },
    ],
  },

  // ── Money ────────────────────────────────────────────────────────────────
  {
    id: 'budget-50-30-20',
    title: 'The 50/30/20 Budget',
    tagline: 'Three buckets instead of tracking every coffee.',
    subject: 'finance',
    subjectLabel: 'Money',
    area: 'financial',
    minutes: 12,
    icon: 'wallet-outline',
    color: '#10B981',
    regulated: true,
    spark: {
      hook: 'Tracking every purchase is tiring, and most people give it up within weeks. The 50/30/20 rule skips the line-by-line tracking and splits take-home pay, the money that actually lands in your account after taxes, into three buckets: 50% for needs, 30% for wants and 20% for savings and extra debt payments.',
      points: [
        'Needs: what it costs to live and get to work. Rent, utilities, groceries, transport, and the minimum payment on any debt.',
        'Wants: the things that make life better but could be cut. Eating out, subscriptions, hobbies, most shopping.',
        'Savings and debt: money for later, plus anything paid on a debt beyond the minimum.',
        'It was popularized by Elizabeth Warren and her daughter Amelia Warren Tyagi in their 2005 book All Your Worth. It is a starting point, not a pass-or-fail test.',
      ],
    },
    research: {
      intro: 'Put real numbers on it.',
      tasks: [
        'Imagine a monthly take-home pay of $3,200. Work out each bucket with a calculator or a spreadsheet.',
        'Look up what a one-bedroom apartment usually rents for where you live. HUD\'s Fair Market Rent tool (below) or a rental listings site both work.',
        'Compare that rent with the needs bucket from the first step. How much of the bucket would rent alone use, before food or transport?',
      ],
      sourcePrompt: 'Where you found the rent figure',
      explainPrompt: 'What did you find? The rent figure, how it compares with the needs bucket, and what that would mean for the other two buckets',
    },
    check: [
      {
        question: 'Imagine a take-home pay of $3,200 a month. How much goes in the wants bucket? (Numbers only.)',
        answer: 960,
        explanation: 'Wants get 30%: 0.30 × 3,200 = $960. Needs get $1,600 and savings and debt get $640.',
      },
      {
        question: 'Imagine you pay the $150 minimum on a student loan, plus an extra $200 on top. Where does each part go?',
        options: [
          'The minimum is a need. The extra is savings and debt',
          'The minimum is a want. The extra is a need',
          'Both are wants',
          'Both are needs',
        ],
        answerIndex: 0,
        explanation: 'The minimum is required, so it is a need. Paying extra is a choice that clears the debt faster, which is what the third bucket is for.',
      },
      {
        question: 'Imagine your needs take 65% of your pay. What does the rule treat as the bucket to adjust first?',
        options: [
          'Wants, while looking for ways to bring needs down over time',
          'Savings, cut to nothing for good',
          'None. Put the difference on a credit card',
          'None. The rule only works at exactly 50%',
        ],
        answerIndex: 0,
        explanation: 'Wants are the flexible bucket. Where rent is high, needs often run over half, which is why the split is a starting point rather than a test you pass or fail.',
      },
      {
        question: 'Which of these is a want, not a need?',
        options: ['A streaming subscription', 'The electric bill', 'Bus fare to work', 'This week\'s groceries'],
        answerIndex: 0,
        explanation: 'Nice to have and possible to cancel. The others keep the lights on, get you to work and feed you.',
      },
      {
        question: 'Why does the rule use take-home pay instead of your salary?',
        options: [
          'Take-home pay is what you can actually spend, after taxes and deductions',
          'Salary is always smaller than take-home pay',
          'Banks require it',
          'It makes the buckets bigger',
        ],
        answerIndex: 0,
        explanation: 'Salary includes money you never see, like taxes and deductions taken before payday. A plan built on it spends money you don\'t have.',
      },
      {
        question: 'Why do many people stick with 50/30/20 when they gave up on tracking every purchase?',
        options: [
          'It is a few decisions a month instead of hundreds',
          'It guarantees you will never overspend',
          'Banks enforce the limits for you',
          'It ignores small purchases, so they don\'t count',
        ],
        answerIndex: 0,
        explanation: 'Fewer decisions means less to keep up with. It guarantees nothing, but a plan that is easy to keep beats a perfect one that gets abandoned.',
      },
    ],
    doIt: {
      title: 'Sort your 5 biggest expenses into needs, wants and savings',
      detail: 'Look at the last 30 days: a bank app, receipts, or whatever money you handle. Put the five biggest things into needs, wants or savings and debt. No income of your own yet? Use a family bill with permission, or the imaginary month from this quest.',
      due: 'today',
    },
    resources: [
      { title: 'Your Money, Your Goals toolkit', who: 'Consumer Financial Protection Bureau', url: 'https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/', kind: 'tool' },
      { title: 'Fair Market Rent lookup', who: 'U.S. Department of Housing and Urban Development', url: 'https://www.huduser.gov/portal/datasets/fmr.html', kind: 'tool' },
      { title: 'Money basics', who: 'MyMoney.gov', url: 'https://www.mymoney.gov/', kind: 'read' },
    ],
  },

  // ── Technology ───────────────────────────────────────────────────────────
  {
    id: 'password-strength',
    title: 'What Makes a Password Strong',
    tagline: 'Length and randomness beat clever symbols.',
    subject: 'technology',
    subjectLabel: 'Tech',
    area: 'digital',
    minutes: 10,
    icon: 'key-outline',
    color: '#0EA5E9',
    spark: {
      hook: 'Swapping letters for symbols (P@ssw0rd!) feels clever, but cracking tools try those swaps first. What makes a password hard to guess is how many possibilities an attacker has to work through, and that comes from length and randomness.',
      points: [
        'When a site\'s password file leaks, attackers guess offline as fast as their hardware allows. Against passwords stored with a fast method, a single gaming graphics card can try tens of billions of guesses a second (reviewed 2026).',
        'Every extra character multiplies the possibilities. Eight random characters from the whole keyboard give about 6.6 quadrillion options. Six random words from a 7,776-word list give about 221 sextillion, over 30 million times more.',
        'Random means random. "correct horse battery staple" became famous as an example, so it is now on every cracking list. Words you pick yourself are far easier to guess than words picked by dice or a generator.',
        'The bigger danger is reuse. When one site leaks, attackers try the same email and password everywhere else. A different password for every site, a password manager to remember them, and two-step sign-in cover that.',
      ],
    },
    research: {
      intro: 'Never type a real password into a website to "test" it. Do the math instead, and check your accounts the safe way.',
      tasks: [
        'Open EFF\'s dice passphrase page (below) and read how it picks random words. Real dice or a generator both work.',
        'Using the numbers above, work out roughly how long 8 random characters would last at 10 billion guesses a second, then six random words. Possibilities ÷ 10,000,000,000 = seconds.',
        'Optional: check whether your email address shows up in known data breaches at Have I Been Pwned.',
      ],
      sourcePrompt: 'One source you used',
      explainPrompt: 'Why does length beat symbols? Explain it in your own words, with your numbers',
    },
    check: [
      {
        question: 'How many different 4-digit PINs are there, from 0000 to 9999? (Numbers only.)',
        answer: 10000,
        explanation: 'Ten choices for each of four digits: 10 × 10 × 10 × 10 = 10,000. Two more digits make it 1,000,000.',
      },
      {
        question: 'Why is P@ssword1! weak even though it has a capital, a number and a symbol?',
        options: [
          'It is a common word with common swaps, which cracking tools try early',
          'It is too long',
          'Most sites don\'t allow symbols',
          'It has no spaces',
        ],
        answerIndex: 0,
        explanation: 'Tools start with common words and the usual tweaks (a capital first, @ for a, a number and ! at the end). Following the pattern puts you near the front of the line.',
      },
      {
        question: 'Four words you chose from your favorite things, or four words picked by rolling dice. Which is stronger?',
        options: [
          'The dice words. People\'s own choices are predictable',
          'Your words. They are more personal',
          'They are the same. Four words is four words',
          'Neither. Passphrases don\'t work',
        ],
        answerIndex: 0,
        explanation: 'Attackers try common words, names and favorites first. Dice give every word on the list the same chance, so there is no shortcut.',
      },
      {
        question: 'Which change adds the most strength to a random passphrase?',
        options: [
          'Adding two more random words',
          'Changing an "a" to "@"',
          'Adding ! at the end',
          'Capitalizing the first letter',
        ],
        answerIndex: 0,
        explanation: 'Each random word from a 7,776-word list multiplies the possibilities by 7,776. The others are patterns tools already try.',
      },
      {
        question: 'You use the same password for your email and a game site. The game site gets hacked. What is the risk?',
        options: [
          'Attackers try that email and password on other sites, including your email',
          'Only the game account is affected',
          'Nothing, because the sites aren\'t connected',
          'Your password gets stronger',
        ],
        answerIndex: 0,
        explanation: 'This is called credential stuffing. A different password on every site means one leak opens one door, not all of them.',
      },
      {
        question: 'What does the U.S. standards agency NIST now say about making people change passwords every few months?',
        options: [
          'Services shouldn\'t force it. Change a password when there are signs it was stolen',
          'Everyone should change every password every 90 days',
          'Change passwords weekly',
          'Never change a password, even after a breach',
        ],
        answerIndex: 0,
        explanation: 'NIST\'s guidance says services shall not force regular changes, and shall force one when there is evidence a password was compromised (reviewed 2026). Forced changes pushed people toward Password1, Password2 and so on.',
      },
    ],
    doIt: {
      title: 'Give your email a unique passphrase and turn on two-step sign-in',
      detail: 'Your email can reset almost every other account, so start there. Make the passphrase with a password manager or dice. For the second step, an authenticator app is harder to hijack than text-message codes.',
      due: 'today',
    },
    resources: [
      { title: 'Dice-generated passphrases', who: 'Electronic Frontier Foundation', url: 'https://www.eff.org/dice', kind: 'tool' },
      { title: 'Use strong passwords', who: 'CISA', url: 'https://www.cisa.gov/secure-our-world/use-strong-passwords', kind: 'read' },
      { title: 'Digital Identity Guidelines: Authentication (SP 800-63B)', who: 'NIST', url: 'https://pages.nist.gov/800-63-4/sp800-63b.html', kind: 'read' },
      { title: 'Have I Been Pwned', who: 'Troy Hunt', url: 'https://haveibeenpwned.com/', kind: 'tool' },
      { title: 'Password Strength (the comic)', who: 'xkcd', url: 'https://xkcd.com/936/', kind: 'read' },
    ],
  },

  // ── Health ───────────────────────────────────────────────────────────────
  {
    id: 'morning-light',
    title: 'Light and Your Body Clock',
    tagline: 'A free sleep upgrade, right outside your door.',
    subject: 'health',
    subjectLabel: 'Health',
    area: 'physical',
    minutes: 10,
    icon: 'sunny-outline',
    color: '#F59E0B',
    spark: {
      hook: 'Your body runs on a roughly 24-hour clock, kept by a small cluster of brain cells called the suprachiasmatic nucleus (SCN). The strongest signal it uses to set the time is light reaching your eyes.',
      points: [
        'Bright light in the morning shifts your clock earlier, so you get sleepy earlier at night. Bright light late in the evening shifts it later.',
        'In the evening your brain releases melatonin, a hormone that helps bring on sleep. Bright light late at night, including a screen close to your face, holds it back.',
        'Outside is far brighter than it looks. A lit room is usually 50 to 500 lux. An overcast day is around 1,000, and full daylight is 10,000 or more.',
        'Teens\' clocks naturally run later than adults\', which is part of why early mornings are hard. Morning light is one of the few things that nudges the clock back.',
      ],
    },
    research: {
      intro: 'Measure it yourself.',
      tasks: [
        'Get a free light-meter app (search "lux meter"). No phone? Look up typical lux levels instead.',
        'Measure three places: a room with the lights on, next to a window, and outside. Hold the phone where your eyes would be. Never point it, or your eyes, at the sun.',
        'Write the three numbers down. Phone readings are rough, but the gaps between places are what matter.',
      ],
      sourcePrompt: 'The app or source you used',
      explainPrompt: 'Your three readings, and what surprised you',
    },
    check: [
      {
        question: 'Why is sitting next to a window weaker than stepping outside?',
        options: [
          'You get far less light. Glass reflects some, and indoors you see only a slice of the sky',
          'Glass blocks all the light that affects your clock',
          'Light only counts if it touches your skin',
          'Windows make light too blue',
        ],
        answerIndex: 0,
        explanation: 'Ordinary window glass lets visible light through. The difference is how much: indoors you get a fraction of what the open sky gives.',
      },
      {
        question: 'What does bright light soon after waking do to your body clock?',
        options: [
          'Shifts it earlier, so you get sleepy earlier at night',
          'Shifts it later',
          'Resets it to exactly 24 hours',
          'Nothing. The clock ignores light',
        ],
        answerIndex: 0,
        explanation: 'Morning light moves the clock earlier and evening light moves it later. That is why the timing of light matters as much as the amount.',
      },
      {
        question: 'Why can late-night screen time make it harder to fall asleep?',
        options: [
          'Bright light late in the day holds back melatonin and pushes your clock later',
          'Screens make the room hot',
          'Phones use up the oxygen in the room',
          'It can\'t. Screens have no effect on sleep',
        ],
        answerIndex: 0,
        explanation: 'Melatonin rises in the evening to bring on sleep. Bright light close to your eyes tells the clock it is still daytime.',
      },
      {
        question: 'Compared with a lit room, an overcast day outside is…',
        options: ['several times brighter or more', 'about the same', 'darker', 'exactly twice as bright'],
        answerIndex: 0,
        explanation: 'Rooms are usually 50 to 500 lux. An overcast day is around 1,000 and full daylight 10,000 or more. Our eyes adjust, so it doesn\'t look that different.',
      },
      {
        question: 'Why do so many teens find early mornings hard?',
        options: [
          'Their body clocks naturally shift later during the teen years',
          'Teens need less sleep than adults',
          'Teens don\'t make melatonin',
          'It is only ever bad habits',
        ],
        answerIndex: 0,
        explanation: 'During the teen years melatonin starts later in the evening. Habits matter too, but the shift itself is biological.',
      },
      {
        question: 'Which way of getting morning light is both safe and effective?',
        options: [
          'Spend time outside and look around normally, never straight at the sun',
          'Look directly at the sun for a few seconds',
          'Sit indoors facing a wall',
          'Look at your phone at full brightness',
        ],
        answerIndex: 0,
        explanation: 'Being outside does the work. You don\'t need to look at the sun, and staring at it can damage your eyes.',
      },
    ],
    doIt: {
      title: 'Three mornings: 10 minutes outside within an hour of waking',
      detail: 'Walk, sit, or have breakfast outside. Don\'t look at the sun. After the third morning, rate your Physical area and note how bedtime and mornings felt.',
      due: 'tomorrow',
    },
    resources: [
      { title: 'Circadian rhythms', who: 'National Institute of General Medical Sciences (NIH)', url: 'https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx', kind: 'read' },
      { title: 'Your sleep/wake cycle', who: 'National Heart, Lung, and Blood Institute (NIH)', url: 'https://www.nhlbi.nih.gov/health/sleep/sleep-wake-cycle', kind: 'read' },
      { title: 'Teens and sleep', who: 'Sleep Foundation', url: 'https://www.sleepfoundation.org/teens-and-sleep', kind: 'read' },
    ],
  },
];

// Which quest each account type meets first. Everyone can open every quest;
// this only decides which one Home suggests next.
export const QUEST_ORDER = {
  PERSONAL:     ['morning-light', 'budget-50-30-20', 'feynman', 'password-strength'],
  STUDENT:      ['feynman', 'morning-light', 'password-strength', 'budget-50-30-20'],
  BUSINESS:     ['password-strength', 'budget-50-30-20', 'feynman', 'morning-light'],
  ENTREPRENEUR: ['budget-50-30-20', 'password-strength', 'feynman', 'morning-light'],
};

// XP for finishing a quest the first time. Between a finished game (30 per
// tier) and a finished level (50 per tier): a quest asks for real work
// outside the app, so it is worth more than one run of a game.
export const QUEST_XP = 100;

// The "can you trust it?" questions every quest asks about its source. The
// habit being taught is the one that outlasts any single topic.
export const SOURCE_KINDS = [
  'Government or public agency',
  'University or research group',
  'Expert or professional organization',
  'News outlet',
  'Company selling something',
  'Personal blog, video or post',
  'Not sure',
];
export const SOURCE_CHECKS = [
  'I know who made it',
  'It\'s recent enough for this topic',
  'It shows where its facts come from',
];

export function getQuest(id) {
  return QUESTS.find(q => q.id === id) || null;
}

export function questsInOrder(type) {
  const order = QUEST_ORDER[type] || QUEST_ORDER.PERSONAL;
  return order.map(getQuest).filter(Boolean);
}
