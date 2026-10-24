// src/data/units.js
// The paths' units (docs/shake-up-plan-2026-10-21.md §4.1, §4.2, P6): the
// school feel. A path is a course; a unit is one goal with four beats,
// **Learn · See it · Practise · Do it**, and one deliverable you hand in
// after a three-line self-check ("what good looks like").
//
// DRAFT WORDING. The founder reviews every unit, its deliverable and its
// sources before P6 ships (plan, founder answer 12). The review list is
// docs/p6-content-review.md. Facts are kept few on purpose: where a unit
// needs one, it links out to the source instead of restating numbers, and
// every source has a review date.
//
// Each unit becomes an objective (unitObjective below), so the objective
// engine runs it: one active at a time (user_objectives_one_active_idx),
// steps that tick themselves from signals, and `next` to the following
// unit. Ids are stored (user_objectives), so never rename one.
//
// No imports: plain data, loaded as-is by scripts.
//
//   unit      { id, path, n, loop, label, promise, why, estimate, beats,
//               deliverable, sources }
//   loop      map · taste · notice · walk · grow (the path's arc)
//   beat      { id, title, says, link?, go?, signal?, done? }
//               says   under 40 words; **bold** is the one idea to keep
//               link   { label, url } a link out (never copied in)
//               go     { screen, params, label } a screen to do it in
//               signal ticks it when that happens elsewhere; otherwise a
//                      "Done" button in the unit fires unit-beat:<unit>-<beat>
//   deliverable { kind, title, buildKind?, prompts?, items?, rubric }
//               kind   build · checklist · reflection · test
//               rubric the three "what good looks like" lines, each ticked
//                      before Hand it in
//   sources   [{ name, url, license, reviewed }] for the credits screen

export const REVIEWED = '2026-10-23';

const src = (name, url, license) => ({ name, url, license, reviewed: REVIEWED });
const S = {
  cfpb: src('Consumer Financial Protection Bureau', 'https://www.consumerfinance.gov/consumer-tools/', 'US government work (public domain)'),
  investor: src('Investor.gov (SEC)', 'https://www.investor.gov/', 'US government work (public domain)'),
  fdic: src('FDIC: Deposit insurance', 'https://www.fdic.gov/resources/deposit-insurance', 'US government work (public domain)'),
  ooh: src('BLS Occupational Outlook Handbook', 'https://www.bls.gov/ooh/', 'US government work (public domain)'),
  onet: src('O*NET OnLine', 'https://www.onetonline.org/', 'CC BY 4.0 (O*NET, US Dept. of Labor)'),
  apprentice: src('Apprenticeship.gov', 'https://www.apprenticeship.gov/', 'US government work (link out)'),
  studentAid: src('Federal Student Aid', 'https://studentaid.gov/', 'US government work (link out)'),
  careerOneStop: src('CareerOneStop', 'https://www.careeronestop.org/', 'US Dept. of Labor (link out)'),
  ged: src('GED Testing Service', 'https://ged.com/', 'Link out (their terms)'),
  hiset: src('HiSET', 'https://hiset.org/', 'Link out (their terms)'),
  gcf: src('GCFGlobal', 'https://edu.gcfglobal.org/', 'Link out (their terms)'),
};

// ── What do I like? (default) ─────────────────────────────────────────────
const LIKE = [
  {
    id: 'unit-like-1', path: 'like', n: 1, loop: 'map',
    label: 'A page about you',
    promise: 'A real web page about you. Yours to change.',
    why: 'Making something about you shows what you care about faster than any quiz.',
    estimate: 'About 10 minutes',
    beats: [
      { id: 'learn', title: 'What a portfolio is', says: 'A portfolio is **proof you can show**, not a list of claims. One page, a few real things, your words.' },
      { id: 'see', title: 'See one', says: 'Open the Studio and look at a page the app makes. **Every part can be taken apart.**', go: { screen: 'StudioScreen', label: 'Open the Studio' } },
      { id: 'practise', title: 'Change one part', says: 'Pick one part of your page and **make it yours**: a colour, a line, a card.', go: { screen: 'StudioScreen', label: 'Change a part' }, signal: 'build-part-looked' },
    ],
    deliverable: { kind: 'build', buildKind: 'page', title: 'A page about you',
      rubric: ['It says who I am in one line', 'It shows at least one thing I made or did', 'I changed at least one part myself'] },
    sources: [],
  },
  {
    id: 'unit-like-2', path: 'like', n: 2, loop: 'taste',
    label: 'Three tastes',
    promise: 'Try three small things. Write one line about each.',
    why: 'You find out what you like by **trying**, not by thinking about it.',
    estimate: 'Three short sessions',
    beats: [
      { id: 'learn', title: 'What a taste is', says: 'A taste is **ten minutes with something new**: a tool, a free class, a video, a real-life try. Small on purpose.' },
      { id: 'see', title: "Today's Find", says: "Every day the app picks one **free, useful thing** to try. That's a taste ready to go.", go: { screen: 'Training', label: 'See today\'s Find' } },
      { id: 'practise', title: 'Try one', says: 'Try one Find and tap **I tried it**.', go: { screen: 'Training', label: 'Try a Find' }, signal: 'find-tried' },
    ],
    deliverable: { kind: 'reflection', title: 'My taste log',
      prompts: ['Taste 1: what I tried, and one line on how it felt', 'Taste 2: what I tried, and one line', 'Taste 3: what I tried, and one line'],
      rubric: ['Three different things, not one thing three times', 'One honest line each, even "not for me"', 'I marked which one I want more of'] },
    sources: [],
  },
  {
    id: 'unit-like-3', path: 'like', n: 3, loop: 'notice',
    label: 'What pulls me',
    promise: 'Name the pattern in what you tried.',
    why: 'A pull you can **name** is one you can follow on purpose.',
    estimate: 'About 15 minutes',
    beats: [
      { id: 'learn', title: 'Noticing', says: 'Look back at your tastes. **What made time go fast?** That is the clue, not what sounded impressive.' },
      { id: 'see', title: 'Your sparks', says: 'What you make and try fills **What you love**, one of your four circles on You.', go: { screen: 'Profile', label: 'See your circles' } },
      { id: 'practise', title: 'Try one more', says: 'One more taste in the direction that pulled you.', go: { screen: 'Training', label: 'Find one' }, signal: 'find-tried' },
    ],
    deliverable: { kind: 'reflection', title: 'What pulls me',
      prompts: ['What made time go fast', 'What I kept thinking about afterwards', 'What I want to try next because of it'],
      rubric: ['It names real things I did', 'It says why, not just what', 'It ends with one next try'] },
    sources: [],
  },
  {
    id: 'unit-like-4', path: 'like', n: 4, loop: 'walk',
    label: 'A rough dream',
    promise: 'Put a rough picture of the life you want into words.',
    why: 'A direction beats a destination. **Rough is fine.**',
    estimate: 'About 15 minutes',
    beats: [
      { id: 'learn', title: 'Four circles', says: 'What you **love**, what you are **good at**, what the **world needs**, what you can **get paid for**. Where they overlap is worth walking toward.' },
      { id: 'see', title: 'Your circles', says: 'You shows your four circles, filled from what you have done.', go: { screen: 'Profile', label: 'See your circles' } },
      { id: 'practise', title: 'Write the Dream', says: 'Write or update your **Dream**: one rough line about the life you want.', go: { screen: 'Profile', label: 'Open your Dream' }, signal: 'dream-saved' },
    ],
    deliverable: { kind: 'reflection', title: 'My rough dream',
      prompts: ['What I love doing', 'What I am getting good at', 'Who it could help, or what someone would pay for'],
      rubric: ['Each circle has at least one real thing in it', 'It is in my words', 'It names one small next step'] },
    sources: [],
  },
  {
    id: 'unit-like-5', path: 'like', n: 5, loop: 'grow',
    label: 'Pick a path',
    promise: 'Choose where to go next. You can change it any time.',
    why: 'Picking is how you **start walking**. Nothing here is forever.',
    estimate: 'About 10 minutes',
    beats: [
      { id: 'learn', title: 'The paths', says: "**What's next for me**, **Money on my own**, **Job to career**. Each is a few units with something real at the end." },
      { id: 'see', title: 'Look at one', says: 'Open My path and read the first unit of another path.', go: { screen: 'PathScreen', label: 'See the paths' } },
      { id: 'practise', title: 'Talk to someone', says: 'Tell one person which path you are thinking about. **Saying it out loud** makes it real.' },
    ],
    deliverable: { kind: 'reflection', title: 'My next path',
      prompts: ['The path I pick', 'Why this one, in one line', 'The first thing I will do on it'],
      rubric: ['It names one path', 'The why connects to what pulled me', 'The first thing is doable this week'] },
    sources: [],
  },
];

// ── What's next for me (incl. trades) ─────────────────────────────────────
const NEXT = [
  {
    id: 'unit-next-1', path: 'next', n: 1, loop: 'map',
    label: 'The map after school',
    promise: 'Every road, side by side: college, trades, work and more.',
    why: 'You can only choose between roads **you can see**.',
    estimate: 'About 20 minutes',
    beats: [
      { id: 'learn', title: 'The roads', says: 'College, community college, a **trade or apprenticeship**, a job, the military, a gap year. Each costs and pays off differently.' },
      { id: 'see', title: 'The map', says: 'Read the map cards. Each says **what it takes, what it costs and a first step**, with a source.', map: 'afterSchool' },
      { id: 'practise', title: 'Star two', says: 'Pick the **two roads** you would like to look at closer.' },
    ],
    deliverable: { kind: 'reflection', title: 'My two roads',
      prompts: ['Road 1, and why it interests me', 'Road 2, and why', 'One question I have about each'],
      rubric: ['Two different roads', 'A real reason for each', 'A question I could get answered'] },
    sources: [S.ooh, S.apprentice, S.studentAid],
  },
  {
    id: 'unit-next-2', path: 'next', n: 2, loop: 'taste',
    label: 'Try two roads',
    promise: 'Get a real look at both: a visit, a shadow day, a free intro.',
    why: 'An hour on the inside **beats a week of reading**.',
    estimate: 'Two short tries',
    beats: [
      { id: 'learn', title: 'Ways to try', says: 'A campus visit, **shadowing** someone at work, a free intro class, a call with someone doing it.' },
      { id: 'see', title: 'Find one near you', says: 'CareerOneStop lists local training and apprenticeships.', link: { label: 'Open CareerOneStop', url: 'https://www.careeronestop.org/' } },
      { id: 'practise', title: 'Plan it', says: 'Put one try **on a real day** in Today.', go: { screen: 'PlannerScreen', label: 'Plan a try' }, signal: 'planner-item-added' },
    ],
    deliverable: { kind: 'reflection', title: 'What I saw',
      prompts: ['Try 1: what I did and what surprised me', 'Try 2: what I did and what surprised me', 'Which one I could see myself in'],
      rubric: ['I actually did both, not just read', 'One surprise each', 'An honest lean'] },
    sources: [S.careerOneStop],
  },
  {
    id: 'unit-next-3', path: 'next', n: 3, loop: 'notice',
    label: 'Compare them',
    promise: 'Side by side: time, cost, what you would do all day.',
    why: 'Writing it down **turns a feeling into a choice**.',
    estimate: 'About 20 minutes',
    beats: [
      { id: 'learn', title: 'What to compare', says: '**Time** to get there, **cost**, what a normal day looks like, and what it leads to.' },
      { id: 'see', title: 'Real numbers', says: 'The Occupational Outlook Handbook has pay and training for most jobs.', link: { label: 'Open the Handbook', url: 'https://www.bls.gov/ooh/' } },
      { id: 'practise', title: 'Make the sheet', says: 'Build your **compare sheet** in the Studio.', go: { screen: 'StudioScreen', params: { start: 'plan' }, label: 'Make the compare sheet' }, signal: 'build-made:plan' },
    ],
    deliverable: { kind: 'build', buildKind: 'plan', title: 'My compare sheet',
      rubric: ['Both roads on one page', 'Time, cost and a normal day for each', 'Where I found the numbers'] },
    sources: [S.ooh],
  },
  {
    id: 'unit-next-4', path: 'next', n: 4, loop: 'walk',
    label: 'Decide and plan',
    promise: 'One page: the road you pick and the first three steps.',
    why: 'A decision with **dates on it** is a plan. Without them it is a wish.',
    estimate: 'About 20 minutes',
    beats: [
      { id: 'learn', title: 'A decision plan', says: 'Say the choice, the **reason**, the first three steps and **when**. You can change it later.' },
      { id: 'see', title: 'Money for it', says: 'If school is on your road, Federal Student Aid explains the FAFSA.', link: { label: 'Open studentaid.gov', url: 'https://studentaid.gov/' } },
      { id: 'practise', title: 'Make the plan', says: 'Build your **decision plan**.', go: { screen: 'StudioScreen', params: { start: 'plan' }, label: 'Make the plan' }, signal: 'build-exported:plan' },
    ],
    deliverable: { kind: 'build', buildKind: 'plan', title: 'My decision plan',
      rubric: ['One road, said plainly', 'Three steps with dates', 'One person I will tell'] },
    sources: [S.studentAid],
  },
  {
    id: 'unit-next-5', path: 'next', n: 5, loop: 'grow',
    label: 'First real step',
    promise: 'Book the first step. On a real day.',
    why: 'The first step is the one **most people never take**.',
    estimate: 'One step',
    beats: [
      { id: 'learn', title: 'Booked, not planned', says: 'An application sent, a visit **booked**, a call scheduled. Something with a date someone else knows about.' },
      { id: 'see', title: 'Apprenticeships', says: 'Apprenticeship.gov lists paid apprenticeships you can apply to.', link: { label: 'Open Apprenticeship.gov', url: 'https://www.apprenticeship.gov/' } },
      { id: 'practise', title: 'Put it on Today', says: 'Add the step to **a real day**.', go: { screen: 'PlannerScreen', label: 'Plan it' }, signal: 'planner-item-added' },
    ],
    deliverable: { kind: 'checklist', title: 'First step booked',
      items: ['I picked the step', 'I booked or sent it', 'It is on a day in Today'],
      rubric: ['Someone else knows about it', 'It has a date', 'I know what comes after'] },
    sources: [S.apprentice],
  },
];

// ── Money on my own ───────────────────────────────────────────────────────
const MONEY = [
  {
    id: 'unit-money-1', path: 'money', n: 1, loop: 'map',
    label: 'Read your pay stub',
    promise: 'Know where every line on it goes.',
    why: 'You cannot plan around money you **do not understand yet**.',
    estimate: 'About 15 minutes',
    beats: [
      { id: 'learn', title: 'Gross and net', says: '**Gross** is what you earned. **Net** is what lands. The lines between are taxes and deductions.' },
      { id: 'see', title: 'A walkthrough', says: 'The CFPB has plain guides to pay, banking and budgets.', link: { label: 'Open the CFPB tools', url: 'https://www.consumerfinance.gov/consumer-tools/' } },
      { id: 'practise', title: 'Find yours', says: 'Find **gross**, **net** and **one deduction** on your own stub (or a sample).' },
    ],
    deliverable: { kind: 'checklist', title: 'My pay stub, read',
      items: ['I found my gross pay', 'I found my net pay', 'I named one deduction and what it is for'],
      rubric: ['I can say the difference in one line', 'I know what each deduction pays for', 'I know my net per month'] },
    sources: [S.cfpb],
  },
  {
    id: 'unit-money-2', path: 'money', n: 2, loop: 'taste',
    label: 'Your money sheet',
    promise: 'One page: what you are saving for and how it grows.',
    why: 'Money with a **goal and a number** starts to move.',
    estimate: 'About 20 minutes',
    beats: [
      { id: 'learn', title: 'A plan on one page', says: 'Name the **goal**, the amount you can put in, and watch the growth. **Small and steady** beats big and rare.' },
      { id: 'see', title: 'The same math', says: 'Investor.gov has the government\'s free compound calculator.', link: { label: 'Open the calculator', url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator' } },
      { id: 'practise', title: 'Make the sheet', says: 'Make your **money sheet** in the Studio.', go: { screen: 'StudioScreen', params: { start: 'money' }, label: 'Make the money sheet' }, signal: 'build-made:money' },
    ],
    deliverable: { kind: 'build', buildKind: 'money', title: 'My money sheet',
      rubric: ['It names a real goal', 'The amount is one I could really put in', 'I changed at least one part myself'] },
    sources: [S.investor],
  },
  {
    id: 'unit-money-3', path: 'money', n: 3, loop: 'notice',
    label: 'An account that fits',
    promise: 'Open or check a bank or credit union account.',
    why: 'A safe place for money is **the floor everything else stands on**.',
    estimate: 'About 20 minutes',
    beats: [
      { id: 'learn', title: 'What to check', says: '**Fees**, minimums, and whether it is insured. Banks: FDIC. Credit unions: NCUA.' },
      { id: 'see', title: 'Insured, explained', says: 'The FDIC explains what deposit insurance covers.', link: { label: 'Open the FDIC page', url: 'https://www.fdic.gov/resources/deposit-insurance' } },
      { id: 'practise', title: 'Check yours', says: 'Look up the fees on **your own account**, or one you might open.' },
    ],
    deliverable: { kind: 'checklist', title: 'My account, checked',
      items: ['I know the monthly fee (or that there is none)', 'I know if there is a minimum balance', 'I checked it is insured'],
      rubric: ['I looked it up, not guessed', 'I know one fee I could avoid', 'I know where to find this again'] },
    sources: [S.fdic, S.cfpb],
  },
  {
    id: 'unit-money-4', path: 'money', n: 4, loop: 'walk',
    label: 'A $500 cushion',
    promise: 'A plan for a small cushion, so one surprise is not a crisis.',
    why: 'A small cushion **changes what a bad week costs you**.',
    estimate: 'About 15 minutes',
    beats: [
      { id: 'learn', title: 'Why a cushion', says: 'A car fix or a missed shift. **A little set aside** keeps it from turning into debt.' },
      { id: 'see', title: 'Small amounts', says: 'Split the target into **weekly bits** you would barely notice.' },
      { id: 'practise', title: 'Put it on Today', says: 'Add a **weekly money check** to Today, in Financial.', go: { screen: 'PlannerScreen', label: 'Plan it' }, signal: 'planner-item-added:financial' },
    ],
    deliverable: { kind: 'reflection', title: 'My cushion plan',
      prompts: ['How much a week, and from where', 'Where it will sit', 'What it is for, and what it is not for'],
      rubric: ['The weekly amount is real for me', 'It sits somewhere separate', 'I know when I would use it'] },
    sources: [S.cfpb],
  },
  {
    id: 'unit-money-5', path: 'money', n: 5, loop: 'grow',
    label: 'Make it automatic',
    promise: 'Set one money move to happen by itself.',
    why: 'What happens **without you deciding** every time is what lasts.',
    estimate: 'About 10 minutes',
    beats: [
      { id: 'learn', title: 'Pay yourself first', says: 'An **automatic transfer on payday**, even small, saves before spending gets a vote.' },
      { id: 'see', title: 'How others do it', says: 'Look at your bank app for **scheduled transfers**.' },
      { id: 'practise', title: 'Set it up', says: 'Set up **one** automatic move.' },
    ],
    deliverable: { kind: 'checklist', title: 'One automation set up',
      items: ['I picked the amount', 'I set the day (payday or the day after)', 'It is set up and running'],
      rubric: ['It runs without me', 'The amount will not cause a shortfall', 'I know how to change or stop it'] },
    sources: [S.cfpb],
  },
];

// ── Job to career ─────────────────────────────────────────────────────────
const CAREER = [
  {
    id: 'unit-career-1', path: 'career', n: 1, loop: 'map',
    label: 'What fits',
    promise: 'Find careers that match what you like and can do.',
    why: 'A good fit is **specific**. "Something better" is not a direction.',
    estimate: 'About 20 minutes',
    beats: [
      { id: 'learn', title: 'Fit', says: 'Fit is **what you do all day**, who you do it with, and what it pays. Not just the title.' },
      { id: 'see', title: 'Career cards', says: 'Career Explorer shows careers with what they take.', go: { screen: 'CareerExplorationScreen', label: 'Open Career Explorer' } },
      { id: 'practise', title: 'Look one up', says: '**Look up one career** on O*NET: tasks, skills, outlook.', link: { label: 'Open O*NET', url: 'https://www.onetonline.org/' } },
    ],
    deliverable: { kind: 'reflection', title: 'Three that fit',
      prompts: ['Career 1, and the task that pulls me', 'Career 2, and why', 'Career 3, and why'],
      rubric: ['Three specific careers', 'A real task for each, not just the title', 'One I could start toward this year'] },
    sources: [S.onet, S.ooh],
  },
  {
    id: 'unit-career-2', path: 'career', n: 2, loop: 'taste',
    label: 'One real conversation',
    promise: 'Talk to one person who does the work.',
    why: 'Fifteen minutes with someone **in the job** beats any article.',
    estimate: 'One chat',
    beats: [
      { id: 'learn', title: 'An informational chat', says: 'You ask; they talk. **Not a job interview.** Three questions, fifteen minutes, a thank-you.' },
      { id: 'see', title: 'Good questions', says: '"What is a normal day?" "What do you wish you knew?" "How did you start?"' },
      { id: 'practise', title: 'Ask someone', says: 'Send **one message** asking for fifteen minutes.' },
    ],
    deliverable: { kind: 'reflection', title: 'What I learned',
      prompts: ['Who I talked to and what they do', 'The most surprising thing they said', 'What I will do because of it'],
      rubric: ['A real conversation happened', 'One surprise', 'One next action'] },
    sources: [],
  },
  {
    id: 'unit-career-3', path: 'career', n: 3, loop: 'notice',
    label: 'The skill gap',
    promise: 'Name the one skill between you and the next job.',
    why: 'One skill you can **name** is one you can learn.',
    estimate: 'About 15 minutes',
    beats: [
      { id: 'learn', title: 'Gap, not wall', says: 'Compare what the job asks for with **what you can already show**. The gap is usually one or two things.' },
      { id: 'see', title: 'What jobs ask for', says: 'O*NET lists the skills each job uses most.', link: { label: 'Open O*NET', url: 'https://www.onetonline.org/' } },
      { id: 'practise', title: 'Pick the skill', says: 'Pick **one** skill to learn first.' },
    ],
    deliverable: { kind: 'reflection', title: 'My skill gap',
      prompts: ['The job I am aiming at', 'What I can already show', 'The one skill to learn first, and where'],
      rubric: ['A specific job', 'Honest about what I have', 'One skill and one place to learn it'] },
    sources: [S.onet],
  },
  {
    id: 'unit-career-4', path: 'career', n: 4, loop: 'walk',
    label: 'Proof project',
    promise: 'Learn the skill by making something that shows it.',
    why: 'Proof is **something someone can see**. A certificate is a claim.',
    estimate: 'A few sessions',
    beats: [
      { id: 'learn', title: 'A class for it', says: 'Pick a **class or lesson** for the skill. Learn just enough to make something.', go: { screen: 'ClassesStack', label: 'Open Classes' } },
      { id: 'see', title: 'Start small', says: 'One small thing that **uses the skill for real**.' },
      { id: 'practise', title: 'Start the project', says: 'Start it as a project in the **Workshop**.', go: { screen: 'ProjectsScreen', label: 'Start a project' }, signal: 'project-started' },
    ],
    deliverable: { kind: 'reflection', title: 'My proof project',
      prompts: ['What I made', 'The skill it shows', 'Where someone can see it'],
      rubric: ['It is finished enough to show', 'It uses the skill for real', 'I can explain one choice I made'] },
    sources: [],
  },
  {
    id: 'unit-career-5', path: 'career', n: 5, loop: 'grow',
    label: 'Resume and one application',
    promise: 'A resume that leads with proof, and one real application.',
    why: 'An application sent is **a door you can walk through**.',
    estimate: 'About 30 minutes',
    beats: [
      { id: 'learn', title: 'A resume that works', says: 'Lead with **what you did and what changed**. Short lines. Your proof project near the top.' },
      { id: 'see', title: 'Free help', says: 'CareerOneStop has free resume guides and job search tools.', link: { label: 'Open CareerOneStop', url: 'https://www.careeronestop.org/' } },
      { id: 'practise', title: 'Make the resume', says: 'Build your **resume** in the Studio.', go: { screen: 'StudioScreen', params: { start: 'resume' }, label: 'Make the resume' }, signal: 'build-made:resume' },
    ],
    deliverable: { kind: 'build', buildKind: 'resume', title: 'My resume',
      rubric: ['It leads with what I did', 'My proof project is on it', 'I sent it to one real job'] },
    sources: [S.careerOneStop],
  },
];

// ── GED (laid over What's next, for the GED starting point) ───────────────
const GED = [
  {
    id: 'unit-ged-1', path: 'next', overlay: 'ged', n: 1, loop: 'map',
    label: 'Which test, where',
    promise: 'Find out which high school equivalency test your state uses.',
    why: 'States differ. **Knowing yours** saves wasted study.',
    estimate: 'About 10 minutes',
    beats: [
      { id: 'learn', title: 'Two tests', says: 'Most states use the **GED** or the **HiSET**. Your state decides which, and the rules.' },
      { id: 'see', title: 'GED by state', says: 'GED.com lists each state\'s rules and prices.', link: { label: 'Open GED.com', url: 'https://ged.com/' } },
      { id: 'practise', title: 'HiSET too', says: 'Check HiSET as well, in case your state uses it.', link: { label: 'Open HiSET', url: 'https://hiset.org/' } },
    ],
    deliverable: { kind: 'checklist', title: 'My test, found',
      items: ['I know which test my state uses', 'I know the cost or that it is free', 'I know where to sign up'],
      rubric: ['From the official site, not a guess', 'Written down where I can find it', 'I know the next step'] },
    sources: [S.ged, S.hiset],
  },
  {
    id: 'unit-ged-2', path: 'next', overlay: 'ged', n: 2, loop: 'taste',
    label: 'A free practice test',
    promise: 'Take one practice test to see where you are.',
    why: 'A starting score is **not a grade**. It is a map.',
    estimate: 'About an hour',
    beats: [
      { id: 'learn', title: 'Practice, not pressure', says: 'A practice test tells you **what to study**, so you do not study what you already know.' },
      { id: 'see', title: 'Where to take one', says: 'The official site has practice tests.', link: { label: 'Open GED.com', url: 'https://ged.com/' } },
      { id: 'practise', title: 'Plan it', says: 'Put the practice test **on a day** in Today.', go: { screen: 'PlannerScreen', label: 'Plan it' }, signal: 'planner-item-added' },
    ],
    deliverable: { kind: 'test', title: 'My first practice score',
      prompts: ['Which subject', 'My score, or how it went'],
      rubric: ['I took it, start to end', 'I wrote down the result', 'No shame: it is a starting point'] },
    sources: [S.ged],
  },
  {
    id: 'unit-ged-3', path: 'next', overlay: 'ged', n: 3, loop: 'notice',
    label: 'Your weakest subject',
    promise: 'Name the subject to start with.',
    why: 'Starting with the **hardest one** frees up the rest.',
    estimate: 'About 10 minutes',
    beats: [
      { id: 'learn', title: 'Four subjects', says: 'The GED has four: **math, reading and writing, science, social studies**. You can take them one at a time.' },
      { id: 'see', title: 'Free lessons', says: 'GCFGlobal has free lessons for most of them.', link: { label: 'Open GCFGlobal', url: 'https://edu.gcfglobal.org/' } },
      { id: 'practise', title: 'Pick one', says: 'Pick the subject you will start with.' },
    ],
    deliverable: { kind: 'reflection', title: 'Where I start',
      prompts: ['The subject', 'Why this one first', 'Where I will learn it'],
      rubric: ['One subject', 'Based on the practice score', 'A real place to learn it'] },
    sources: [S.ged, S.gcf],
  },
  {
    id: 'unit-ged-4', path: 'next', overlay: 'ged', n: 4, loop: 'walk',
    label: 'A study plan on Today',
    promise: 'Short study blocks, on real days.',
    why: 'Thirty minutes most days **beats one long night**.',
    estimate: 'About 10 minutes',
    beats: [
      { id: 'learn', title: 'Short and often', says: 'Short blocks you **actually keep** beat long ones you skip.' },
      { id: 'see', title: 'Your week', says: 'Look at your week in Today and find **three open times**.', go: { screen: 'Home', label: 'Open Today' } },
      { id: 'practise', title: 'Add a block', says: 'Add a repeating **study block**.', go: { screen: 'PlannerScreen', label: 'Plan a study block' }, signal: 'planner-item-added' },
    ],
    deliverable: { kind: 'checklist', title: 'My study plan',
      items: ['Three blocks a week on Today', 'Each block names the subject', 'One person knows my plan'],
      rubric: ['The times are realistic for my week', 'It repeats', 'I know what each block is for'] },
    sources: [],
  },
  {
    id: 'unit-ged-5', path: 'next', overlay: 'ged', n: 5, loop: 'grow',
    label: 'A passing practice score',
    promise: 'Pass a practice test in your first subject.',
    why: 'A passing practice score means **you are ready to book the real one**.',
    estimate: 'A few weeks',
    beats: [
      { id: 'learn', title: 'Ready check', says: 'When your practice score passes, **book the real test** while it is fresh.' },
      { id: 'see', title: 'Booking', says: 'You book the real test on the official site.', link: { label: 'Open GED.com', url: 'https://ged.com/' } },
      { id: 'practise', title: 'Take it again', says: 'Take the practice test again in the same subject.' },
    ],
    deliverable: { kind: 'test', title: 'Passed practice test',
      prompts: ['The subject', 'My new score'],
      rubric: ['It passed the practice mark', 'Better than my first try', 'The real test is my next step'] },
    sources: [S.ged],
  },
];

// ── Ground fix: one short unit per life area ──────────────────────────────
// Rate it, one small fix this week (a plan on Today in that area), rate it
// again, then hand in "My reset plan". The re-rate is its own step with its
// own signal (LifeAreaScreen fires 'area-rerated:<area>' when an area
// already has a rating), so it never waits on the calendar.
export const GROUND_AREAS = [
  ['physical', 'Physical'], ['mental', 'Mental'], ['social', 'Social'], ['financial', 'Financial'],
  ['creative', 'Creative'], ['professional', 'Professional'], ['spiritual', 'Spiritual'], ['digital', 'Digital'],
];
const GROUND = GROUND_AREAS.map(([area, label]) => ({
  id: `unit-ground-${area}`, path: 'ground', n: 1, loop: 'walk', area,
  label: `Ground fix: ${label}`,
  promise: `One small fix for your ${label.toLowerCase()} life, this week.`,
  why: 'Steady ground first. **Everything else stands on it.**',
  estimate: 'A week of small steps',
  beats: [
    { id: 'rate', title: 'Rate it', says: `How is your **${label.toLowerCase()}** life right now, 1 to 5? Only you see it.`, go: { screen: 'LifeAreaScreen', params: { areaId: area }, label: 'Rate it' }, signal: `area-rated:${area}` },
    { id: 'fix', title: 'One small fix', says: 'Pick **one small thing** and put it on a day this week.', go: { screen: 'PlannerScreen', label: 'Plan the fix' }, signal: `planner-item-added:${area}` },
    { id: 'rerate', title: 'Then vs now', says: 'After the fix, **rate it again**. Any change counts, even none.', go: { screen: 'LifeAreaScreen', params: { areaId: area }, label: 'Rate it again' }, signal: `area-rerated:${area}` },
  ],
  deliverable: { kind: 'reflection', title: 'My reset plan',
    prompts: ['Where I was', 'What I changed', "What's next"],
    rubric: ['It says where I started, honestly', 'It names the one thing I did', 'It has one next step'] },
  sources: [],
}));

export const UNITS = [...LIKE, ...NEXT, ...MONEY, ...CAREER, ...GED, ...GROUND];
export const UNIT_BY_ID = Object.fromEntries(UNITS.map(u => [u.id, u]));
export const MAP_SOURCES = S;

/** A path's units, in order. The GED starting point gets its units first on What's next. */
export function unitsForPath(pathKey, { startPoint = null, area = null } = {}) {
  if (pathKey === 'ground') return GROUND.filter(u => !area || u.area === area);
  const list = UNITS.filter(u => u.path === pathKey && !u.overlay);
  if (pathKey === 'next' && startPoint === 'ged') return [...GED, ...list];
  return list;
}

// The signal a beat ticks on: its own, or the unit's "Done" button.
export const beatSignal = (unit, beat) => beat.signal || `unit-beat:${unit.id}-${beat.id}`;
export const handInSignal = (unit) => `deliverable-handed-in:${unit.id}`;

// A unit as an objective for the engine (src/data/objectives.js appends
// these). Steps open the unit itself, where each beat has its button.
function unitObjective(unit, i, list) {
  const purpose = { like: 'explore', next: 'direction', money: 'money', career: 'career', ground: 'areas' }[unit.path];
  const following = unit.path === 'ground' ? null : (list[i + 1]?.path === unit.path ? list[i + 1].id : null);
  return {
    id: unit.id,
    purpose,
    unit: true,
    label: unit.label,
    promise: unit.promise,
    why: unit.why.replace(/\*\*/g, ''),
    estimate: unit.estimate,
    steps: [
      ...unit.beats.map(b => ({
        id: b.id, label: b.title, hint: b.says, screen: 'UnitScreen', params: { unitId: unit.id }, signal: beatSignal(unit, b),
      })),
      { id: 'do', label: `Hand it in: ${unit.deliverable.title}`, hint: 'Run the self-check, then **Hand it in**.', screen: 'UnitScreen', params: { unitId: unit.id }, signal: handInSignal(unit) },
    ],
    // Your first unit handed in opens the Showcase: there's something to
    // put on it now (shake-up P6). The server checks this against
    // objective_unlocks (20261023120000_shakeup_p6.sql).
    unlocks: ['portfolio'],
    next: following || null,
  };
}

const ORDER = [...LIKE, ...NEXT, ...MONEY, ...CAREER, ...GED, ...GROUND];
// GED leads into What's next unit 1 when it's done.
export const UNIT_OBJECTIVES = ORDER.map((u, i, list) => {
  const o = unitObjective(u, i, list);
  if (u.id === 'unit-ged-5') o.next = 'unit-next-1';
  return o;
});
