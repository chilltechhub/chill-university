// src/data/wayfinderSituations.js
//
// "What's going on right now?" — the part of Wayfinder that starts from
// someone's actual situation instead of from their interests.
//
// Direction is hard to think about from inside a crisis, a layoff, a
// breakup, or a month of not sleeping. So each situation gives, in order:
//   now       — two or three things to steady the ground this week
//   next      — what to do once the ground is steadier
//   resources — real, free help, verified against each organization's own
//               site on 2026-09-14 (numbers AND urls — re-check before
//               changing either; a wrong hotline number is worse than none)
//   app       — the parts of this app that genuinely help with it
//   direction — one honest sentence about how to think about it
//   areas     — life areas it touches (boosts matching "ways to live it")
//
// Rules this content follows:
//  • It's general and practical, never personal medical, legal, or financial
//    advice. Where that's what someone needs, it says so and points to the
//    free version (legal aid, a doctor, a counselor).
//  • `urgent` situations lead with help, not steps, and follow safe-messaging
//    practice: hope, a person to reach, nothing else competing for attention.
//  • No dollar figures or percentages — they go stale and vary by state.
//  • U.S. resources. 988 and 211 cover the whole country.
//  • `audience: 'adult'` only means "rarely relevant to a minor" — it hides
//    for a CONFIRMED minor account. Nothing here is unsafe for a teen to read.

export const SITUATION_GROUPS = [
  { id: 'urgent',  label: 'Right now, it’s urgent' },
  { id: 'money',   label: 'Money & work' },
  { id: 'school',  label: 'School & starting out' },
  { id: 'people',  label: 'People & home' },
  { id: 'mind',    label: 'Mind & body' },
  { id: 'change',  label: 'Big changes' },
];

export const MAX_SITUATIONS = 3;

// ─── Resources (shared) ─────────────────────────────────────────────────────
// `phone` renders as a Call button (tel:), `url` as a Website button.
const R = {
  lifeline:   { label: '988 Suicide & Crisis Lifeline', detail: 'Call or text 988, any time. Free and confidential.', phone: '988', url: 'https://988lifeline.org' },
  textLine:   { label: 'Crisis Text Line', detail: 'Text HOME to 741741 to reach a trained counselor, any time.', url: 'https://www.crisistextline.org' },
  emergency:  { label: 'In immediate danger', detail: 'Call 911.', phone: '911' },
  dvHotline:  { label: 'National Domestic Violence Hotline', detail: 'Call 1-800-799-7233 or text START to 88788, any time. They can help you plan for safety.', phone: '18007997233', url: 'https://www.thehotline.org' },
  loveIs:     { label: 'love is respect (teens & young adults)', detail: 'Text LOVEIS to 22522 or call 1-866-331-9474 about a dating relationship.', phone: '18663319474', url: 'https://www.loveisrespect.org' },
  childhelp:  { label: 'Childhelp National Child Abuse Hotline', detail: 'Call 1-800-422-4453 if someone at home is hurting you or a kid you know.', phone: '18004224453', url: 'https://www.childhelphotline.org' },
  two11:      { label: '211', detail: 'Call 211 for local help with food, rent, utilities, and more — in many languages.', phone: '211', url: 'https://www.211.org' },
  findhelp:   { label: 'findhelp.org', detail: 'Search free and reduced-cost programs by zip code.', url: 'https://www.findhelp.org' },
  benefits:   { label: 'USA.gov benefits finder', detail: 'See which government benefits you might qualify for.', url: 'https://www.usa.gov/benefits' },
  legalAid:   { label: 'Legal Services Corporation', detail: 'Find free civil legal aid near you — eviction, custody, benefits, records.', url: 'https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help' },
  jobCenter:  { label: 'American Job Centers', detail: 'Free, in-person help with job searches, résumés, and paying for training.', url: 'https://www.careeronestop.org/LocalHelp/AmericanJobCenters/find-american-job-centers.aspx' },
  unemploy:   { label: 'Unemployment benefits by state', detail: 'Find your state’s unemployment office and how to apply.', url: 'https://www.careeronestop.org/LocalHelp/UnemploymentBenefits/unemployment-benefits.aspx' },
  apprentice: { label: 'Apprenticeship.gov', detail: 'Find paid apprenticeships — you earn while you train.', url: 'https://www.apprenticeship.gov/' },
  fafsa:      { label: 'Federal Student Aid (FAFSA)', detail: 'Apply for federal grants and aid. The application is free.', url: 'https://studentaid.gov' },
  scholarships: { label: 'CareerOneStop scholarship finder', detail: 'Search thousands of scholarships, including ones for adults going back.', url: 'https://www.careeronestop.org/Toolkit/Training/find-scholarships.aspx' },
  nami:       { label: 'NAMI HelpLine', detail: 'Call 1-800-950-6264 or text "helpline" to 62640 for mental-health information and support (not a crisis line).', phone: '18009506264', url: 'https://www.nami.org/support-education/nami-helpline/' },
  samhsa:     { label: 'SAMHSA National Helpline', detail: 'Call 1-800-662-4357 — free, confidential treatment referral, any time.', phone: '18006624357', url: 'https://www.samhsa.gov/find-help/helplines/national-helpline' },
  smart:      { label: 'SMART Recovery', detail: 'Free support meetings, in person and online.', url: 'https://smartrecovery.org' },
  gambling:   { label: 'National Council on Problem Gambling', detail: 'Help and treatment finder for gambling problems.', url: 'https://www.ncpgambling.org/help-treatment/' },
  trevor:     { label: 'The Trevor Project (LGBTQ+ young people)', detail: 'Call 1-866-488-7386 to talk to someone who gets it, any time.', phone: '18664887386', url: 'https://www.thetrevorproject.org' },
  bullying:   { label: 'StopBullying.gov', detail: 'What to do about bullying, in person or online.', url: 'https://www.stopbullying.gov' },
  volunteer:  { label: 'VolunteerMatch', detail: 'Find volunteer spots near you or online.', url: 'https://www.volunteermatch.org' },
  eldercare:  { label: 'Eldercare Locator', detail: 'Call 1-800-677-1116 to find caregiver support and respite care near you.', phone: '18006771116', url: 'https://eldercare.acl.gov' },
  psi:        { label: 'Postpartum Support International', detail: 'Call 1-800-944-4773 for support with how you’re feeling during or after pregnancy.', phone: '18009444773', url: 'https://www.postpartum.net' },
  maternal:   { label: 'National Maternal Mental Health Hotline', detail: 'Call or text 1-833-852-6262, any time, before or after a baby.', phone: '18338526262' },
  wic:        { label: 'WIC', detail: 'Food and nutrition help for pregnant people, new parents, and young kids.', url: 'https://www.fns.usda.gov/wic' },
  jan:        { label: 'Job Accommodation Network', detail: 'Free guidance on workplace accommodations and disability rights at work.', url: 'https://askjan.org' },
  vocRehab:   { label: 'State vocational rehabilitation agencies', detail: 'Every state has a program that helps people with disabilities train for and find work.', url: 'https://rsa.ed.gov/about/states' },
  reentry:    { label: 'CareerOneStop — justice-involved job seekers', detail: 'Job search help, training, and employers open to people with records.', url: 'https://www.careeronestop.org/JusticeImpacted/default.aspx' },
  bonding:    { label: 'Federal Bonding Program', detail: 'Free insurance for employers who hire people with records — worth mentioning to employers.', url: 'https://bonds4jobs.com' },
  uscisScams: { label: 'USCIS: avoid immigration scams', detail: 'How to spot fake immigration help, including “notarios.”', url: 'https://www.uscis.gov/avoid-scams' },
  dougy:      { label: 'The Dougy Center', detail: 'Grief support resources for kids, teens, and families.', url: 'https://www.dougy.org' },
};

// `screen` targets are Library stack routes; `stage` targets are Wayfinder's
// own sections.
const APP = {
  map:        { label: 'Wayfinder paths', stage: 'map', icon: 'navigate-circle-outline' },
  steps:      { label: 'Wayfinder’s three steps', stage: 'experiences', icon: 'navigate-circle-outline' },
  life:       { label: 'Life beyond work', stage: 'life', icon: 'leaf-outline' },
  learning:   { label: 'How you learn', stage: 'learning', icon: 'school-outline' },
  personality:{ label: 'Your personality', stage: 'personality', icon: 'person-outline' },
  planner:    { label: 'Planner', screen: 'PlannerScreen', icon: 'calendar-outline' },
  review:     { label: 'Weekly Review', screen: 'WeeklyReviewScreen', icon: 'calendar-clear-outline' },
  workMode:   { label: 'Work Mode focus timer', screen: 'WorkModeScreen', icon: 'timer-outline' },
  portfolio:  { label: 'Portfolio', screen: 'PortfolioScreen', icon: 'briefcase-outline' },
  academy:    { label: 'Academy classes', screen: 'ClassesStack', icon: 'ribbon-outline' },
  mental:     { label: 'Mental life area', screen: 'LifeAreaScreen', params: { areaId: 'mental' }, icon: 'happy-outline' },
  physical:   { label: 'Physical life area', screen: 'LifeAreaScreen', params: { areaId: 'physical' }, icon: 'fitness-outline' },
  social:     { label: 'Social life area', screen: 'LifeAreaScreen', params: { areaId: 'social' }, icon: 'people-outline' },
  financial:  { label: 'Financial life area', screen: 'LifeAreaScreen', params: { areaId: 'financial' }, icon: 'wallet-outline' },
  discover:   { label: 'Discover — people on similar paths', screen: 'DiscoverScreen', icon: 'people-outline' },
};

export const SITUATIONS = [
  // ── Urgent ────────────────────────────────────────────────────────────────
  {
    id: 'crisis', group: 'urgent', urgent: true, emoji: '🆘', audience: 'all',
    label: 'I’m in a really dark place',
    blurb: 'Thinking about hurting yourself, or feeling like there’s no way through.',
    heard: 'Thank you for saying it. You don’t have to figure anything out right now — the only step is reaching one person.',
    now: [
      'Call or text 988 right now. You can say exactly what you told this app.',
      'Or tell one person you trust how bad it is — a friend, family member, teacher, or coach.',
      'If you can, don’t stay alone tonight.',
    ],
    next: [
      'When you’re through tonight, keep talking to someone — a counselor or doctor can help with what comes next.',
      'Wayfinder will still be here when you’re ready. There is a way through this, even if you can’t see it yet.',
    ],
    resources: [R.lifeline, R.textLine, R.emergency, R.trevor],
    app: [],
    direction: 'Right now the only direction that matters is toward another person.',
    areas: ['mental'],
  },
  {
    id: 'unsafe', group: 'urgent', urgent: true, emoji: '🛡️', audience: 'all',
    label: 'I don’t feel safe at home or with someone',
    blurb: 'Someone is hurting, threatening, or controlling you.',
    heard: 'You deserve to be safe. This isn’t your fault, and you don’t have to handle it alone.',
    now: [
      'If you’re in danger right now, call 911.',
      'Reach a hotline below — it’s free and confidential, and they help people make a safety plan that fits their situation.',
      'Tell a trusted adult or friend what’s happening.',
    ],
    next: [
      'If someone checks your phone, hotline advocates can help you find a safer way to reach out.',
      'If there’s a legal side — a protective order, housing, custody — free legal aid can help.',
    ],
    resources: [R.emergency, R.dvHotline, R.childhelp, R.loveIs, R.legalAid],
    app: [],
    direction: 'Safety first. Everything else in this app can wait.',
    areas: ['social', 'mental'],
  },

  // ── Money & work ──────────────────────────────────────────────────────────
  {
    id: 'lostjob', group: 'money', emoji: '📦', audience: 'all', needsIncome: true,
    label: 'I just lost my job',
    blurb: 'Laid off, fired, or hours cut to nothing.',
    heard: 'That’s a real hit — to money and to how you feel about yourself. Both are fixable.',
    now: [
      'Apply for unemployment right away. Benefits usually count from when you apply, so waiting can cost you (rules differ by state).',
      'List your must-pays — rent, utilities, phone, food — and call anyone you’ll be late with before you’re late. Many have hardship options.',
      'Tell people you’re looking. A lot of jobs get filled through someone who knows someone.',
    ],
    next: [
      'Put the skills from your Wayfinder map into your résumé — including the ones you never called skills.',
      'Keep a routine: a set start time, a few hours of applications, then something that isn’t job hunting.',
      'Take the nearest paycheck if you need it, and keep testing a better direction on the side.',
    ],
    resources: [R.unemploy, R.jobCenter, R.two11, R.benefits],
    app: [APP.map, APP.portfolio, APP.planner],
    direction: 'This is a forced reset — and a reset is a chance to aim somewhere better, not just somewhere fast.',
    areas: ['financial', 'professional', 'mental'],
  },
  {
    id: 'hatejob', group: 'money', emoji: '🔒', audience: 'all',
    label: 'I’m stuck in a job I hate',
    blurb: 'It pays the bills, and it’s wearing you down.',
    heard: 'Feeling trapped by the thing that keeps the lights on is exhausting. Wanting more isn’t ungrateful.',
    now: [
      'Write down exactly what you hate: the work itself, the people, the hours, the pay, or the boss. The fix is different for each.',
      'Don’t quit yet. Decide what you’re moving toward first.',
    ],
    next: [
      'Run one small Wayfinder experiment a week on your own time.',
      'Put away a little from each check, even a small amount, so leaving becomes possible.',
      'If it’s one specific problem — a schedule, a manager — ask whether a transfer or change is possible before walking out.',
    ],
    resources: [R.jobCenter, R.apprentice],
    app: [APP.map, APP.review, APP.portfolio],
    direction: 'The job is paying for your next move. Treat it as temporary, and every week you test something is a week closer.',
    areas: ['professional', 'mental'],
  },
  {
    id: 'broke', group: 'money', emoji: '🧾', audience: 'adult', needsIncome: true,
    label: 'Money is really tight or I’m behind on bills',
    blurb: 'Choosing which bill to pay, or scared of what’s next.',
    heard: 'Money stress takes up real mental space — that’s well documented, not a character flaw.',
    now: [
      'Call 211 or search findhelp.org for help with food, utilities, and rent near you.',
      'Call the companies you’re behind with before they call you, and ask about hardship plans or payment arrangements.',
      'Cover the essentials first: housing, utilities, food, and getting to work.',
    ],
    next: [
      'Put every bill and its due date in the Planner so nothing surprises you.',
      'Be careful with “fast cash” — payday and title loans often cost far more than they look.',
      'If you’re facing eviction or a lawsuit, get free legal aid before the court date.',
    ],
    resources: [R.two11, R.findhelp, R.benefits, R.legalAid],
    app: [APP.planner, APP.financial, APP.map],
    direction: 'Steady the ground first. Direction gets easier to think about once next week isn’t on fire.',
    areas: ['financial', 'mental'],
  },
  {
    id: 'nowork', group: 'money', emoji: '⏸️', audience: 'all',
    label: 'Not working and not in school',
    blurb: 'Between things, and the days are starting to blur.',
    heard: 'Being in between is not being behind. A lot of people are here and don’t talk about it.',
    now: [
      'Pick one thing to do every weekday at the same time — a walk, a video lesson, one application. Routine comes before motivation.',
      'Do Wayfinder’s three steps if you haven’t yet.',
    ],
    next: [
      'Try one free thing out of the house: a library class, a volunteer shift, a community college info session.',
      'Look into paid apprenticeships and job-training programs — some pay you while you learn.',
    ],
    resources: [R.jobCenter, R.apprentice, R.volunteer],
    app: [APP.steps, APP.planner, APP.life],
    direction: 'The way out is small and a little boring: a daily routine and one experiment a week.',
    areas: ['professional', 'mental', 'social'],
  },

  // ── School & starting out ─────────────────────────────────────────────────
  {
    id: 'graduating', group: 'school', emoji: '🎓', audience: 'all',
    label: 'Finishing school and don’t know what’s next',
    blurb: 'Everyone keeps asking what the plan is.',
    heard: 'You don’t need a life plan. You need a good next step for the next year or so.',
    now: [
      'Do Wayfinder’s steps and pick two paths to test.',
      'Write down your real options side by side: a job, a program, an apprenticeship, college, or a gap year with a plan.',
    ],
    next: [
      'Talk to three people who are a few years ahead of you on different paths.',
      'Fill out the FAFSA if any kind of school or training is on the list — it’s free.',
    ],
    resources: [R.fafsa, R.apprentice, R.jobCenter],
    app: [APP.steps, APP.academy, APP.planner],
    direction: 'Most people change direction several times. Your first choice is a starting point, not a life sentence.',
    areas: ['professional', 'financial'],
  },
  {
    id: 'backtoschool', group: 'school', emoji: '📚', audience: 'adult',
    label: 'I want to go back to school but can’t afford it',
    blurb: 'Training could change things, and the cost is in the way.',
    heard: 'Wanting to invest in yourself is a good instinct. There’s more help than most people know about.',
    now: [
      'Fill out the FAFSA — it’s free, and it’s how you get federal grants, which don’t have to be paid back if you qualify.',
      'Call your local community college’s financial aid office and ask what you’d qualify for.',
    ],
    next: [
      'Ask your employer about tuition help — some offer it and few people use it.',
      'Look at shorter routes first: certificates and paid apprenticeships usually cost less and pay sooner.',
      'Test the direction with a Wayfinder experiment before you borrow for it.',
    ],
    resources: [R.fafsa, R.scholarships, R.apprentice, R.jobCenter],
    app: [APP.map, APP.learning, APP.academy],
    direction: 'Pick the program for the life you want, not the life for the program.',
    areas: ['professional', 'financial'],
  },
  {
    id: 'schoolstruggle', group: 'school', emoji: '📉', audience: 'all',
    label: 'Struggling in school',
    blurb: 'Grades slipping, falling behind, or dreading going.',
    heard: 'Struggling in school says very little about how smart you are. Usually something about the setup isn’t working yet.',
    now: [
      'Tell one teacher or counselor you’re struggling. It’s their job, and it usually helps more than people expect.',
      'Pick your hardest class and ask exactly what you need to do to pass it.',
    ],
    next: [
      'Try the techniques in “How you learn” — testing yourself beats rereading.',
      'Notice whether something else is going on — sleep, stress, home, or trouble focusing. Those are worth telling someone about.',
    ],
    resources: [R.nami],
    app: [APP.learning, APP.workMode, APP.academy],
    direction: 'Fix the setup before judging yourself.',
    areas: ['mental'],
  },
  {
    id: 'bullied', group: 'school', emoji: '🫂', audience: 'all',
    label: 'Being bullied or left out',
    blurb: 'At school, online, or with people who are supposed to be friends.',
    heard: 'What’s happening says more about them than about you. You don’t have to just take it.',
    now: [
      'Tell an adult you trust — a parent, teacher, coach, or counselor.',
      'If it’s online, screenshot it, then block and report the accounts.',
    ],
    next: [
      'Find one place where you fit — a club, team, class, or group built around something you like.',
      'If it’s making you feel hopeless, talk to someone today. 988 is for that too.',
    ],
    resources: [R.bullying, R.lifeline, R.trevor],
    app: [APP.life, APP.discover],
    direction: 'Your job right now is to get support and find even one place where you’re welcome.',
    areas: ['social', 'mental'],
  },

  // ── People & home ─────────────────────────────────────────────────────────
  {
    id: 'lonely', group: 'people', emoji: '🌙', audience: 'all',
    label: 'Lonely, or new somewhere',
    blurb: 'Moved, lost touch with people, or just don’t have your people yet.',
    heard: 'Loneliness is really common, and it’s fixable — just not by one big night out.',
    now: [
      'Say yes to one small social thing this week, even if you leave early.',
      'Send one message to someone you’ve lost touch with. Keep it simple.',
    ],
    next: [
      'Join something that meets regularly. Seeing the same people again and again is how friendships actually form.',
      'Volunteer — it gives you people and something to talk about.',
    ],
    resources: [R.volunteer, R.two11],
    app: [APP.life, APP.social, APP.discover],
    direction: 'Friendship is built by repetition. Pick one place and keep showing up.',
    areas: ['social'],
  },
  {
    id: 'breakup', group: 'people', emoji: '💔', audience: 'all',
    label: 'Going through a breakup or divorce',
    blurb: 'A relationship ended and a lot of your life went with it.',
    heard: 'This hurts, and it can shake who you think you are. That usually passes — and something clearer can come after.',
    now: [
      'Tell a couple of people what’s going on. Let them help.',
      'Keep the basics going: sleep, food, moving your body.',
      'Hold off on big decisions for a few weeks if you can.',
    ],
    next: [
      'Pick up something that’s just yours — an old hobby or a new one.',
      'If there’s a legal side — divorce, custody, a shared lease — get real legal advice. Free legal aid exists.',
      'If the relationship was controlling or abusive, a hotline can help you stay safe.',
    ],
    resources: [R.legalAid, R.dvHotline, R.lifeline],
    app: [APP.life, APP.personality, APP.mental],
    direction: 'This is a chance to find out who you are on your own. That’s exactly what this part of the app is for.',
    areas: ['social', 'mental'],
  },
  {
    id: 'family', group: 'people', emoji: '🏠', audience: 'all',
    label: 'Conflict with family at home',
    blurb: 'Constant fighting, not being understood, or tension you can’t escape.',
    heard: 'Not feeling okay at home affects everything else. It makes sense that it’s hard to focus on anything.',
    now: [
      'When it gets heated, step away. You can come back to the conversation later.',
      'Talk to someone outside it — a counselor, relative, or a friend’s parent.',
    ],
    next: [
      'Pick one thing to talk about calmly, at a calm time, starting with “I feel… when…”.',
      'Build time outside the house into your week — practice, a job, the library, a friend’s place.',
      'If anyone is hurting you, that’s not normal family conflict — reach Childhelp or 911.',
    ],
    resources: [R.childhelp, R.textLine, R.lifeline],
    app: [APP.life, APP.mental],
    direction: 'You can’t control other people. You can control where your energy goes and who you ask for help.',
    areas: ['social', 'mental'],
  },
  {
    id: 'caregiver', group: 'people', emoji: '🤲', audience: 'all',
    label: 'Taking care of someone full time',
    blurb: 'A parent, partner, child, or grandparent depends on you.',
    heard: 'Caring for someone is real work and real skill. You still count too.',
    now: [
      'Write down what you do in a normal week. Seeing it on paper makes it easier to ask for help.',
      'Ask one person for one specific thing — an afternoon, a ride, a meal.',
    ],
    next: [
      'Look for respite care and caregiver support near you — the Eldercare Locator or 211 can point you there.',
      'Keep one thing that’s yours, even an hour a week.',
    ],
    resources: [R.eldercare, R.two11, R.nami],
    app: [APP.life, APP.planner, APP.portfolio],
    direction: 'The skills you’re using right now are on your Wayfinder map. They’ll matter later, too.',
    areas: ['social', 'mental', 'physical'],
  },
  {
    id: 'newparent', group: 'people', emoji: '🍼', audience: 'all',
    label: 'New parent, or about to be',
    blurb: 'Everything is reorganizing around someone small.',
    heard: 'Your whole life just shifted. Being tired and unsure is part of it, not a sign you’re doing it wrong.',
    now: [
      'Sleep when you can, and accept help when it’s offered.',
      'Check whether you qualify for WIC — food help for parents and young kids.',
    ],
    next: [
      'Keep an eye on how you’re feeling. Feeling low or anxious for more than a couple of weeks around a baby is common and treatable — tell a doctor.',
      'Keep one small thing that’s still yours.',
    ],
    resources: [R.maternal, R.psi, R.wic, R.two11],
    app: [APP.life, APP.planner],
    direction: 'Who you are still matters. It’s just getting a new chapter.',
    areas: ['physical', 'social', 'financial'],
  },

  // ── Mind & body ───────────────────────────────────────────────────────────
  {
    id: 'burnout', group: 'mind', emoji: '🪫', audience: 'all',
    label: 'Burned out and exhausted',
    blurb: 'Running on empty, and rest doesn’t seem to fix it.',
    heard: 'Burnout isn’t laziness. It’s what happens when you give more than you get back for too long.',
    now: [
      'Cut or postpone one thing this week. Anything.',
      'Protect your sleep like it’s an appointment.',
    ],
    next: [
      'For a week, notice what drains you and what refills you. Write it down.',
      'If the exhaustion doesn’t lift, see a doctor — it can have physical causes too.',
    ],
    resources: [R.nami, R.lifeline],
    app: [APP.planner, APP.workMode, APP.mental, APP.review],
    direction: 'Don’t make big life decisions from empty. Refill first, then pick a direction.',
    areas: ['mental', 'physical'],
  },
  {
    id: 'down', group: 'mind', emoji: '🌧️', audience: 'all',
    label: 'Feeling down or anxious a lot',
    blurb: 'It’s been heavy for a while, not just a bad day.',
    heard: 'You’re not broken, and you’re not the only one. This is common and it’s treatable.',
    now: [
      'Tell one person how you’ve actually been feeling.',
      'Get outside and move a little each day — it’s one of the better-supported ways to lift mood.',
    ],
    next: [
      'Talk to a doctor or counselor. Getting support is a skill, not a weakness.',
      'If it ever turns into thoughts of not wanting to be here, call or text 988 right away.',
    ],
    resources: [R.nami, R.lifeline, R.textLine, R.trevor],
    app: [APP.mental, APP.physical, APP.life],
    direction: 'Feeling better usually comes before knowing where you’re going, not after.',
    areas: ['mental', 'physical'],
  },
  {
    id: 'quitting', group: 'mind', emoji: '🔁', audience: 'all',
    label: 'Trying to cut back or quit something',
    blurb: 'Drinking, drugs, vaping, gambling, gaming — something has too much hold.',
    heard: 'Deciding to change it is the hard part, and you’ve started.',
    now: [
      'Tell one person you’re trying.',
      'Notice your triggers — times, places, people, feelings — and change one of them this week.',
      'Stopping some substances suddenly, like alcohol, can be medically dangerous. Talk to a doctor before you quit cold.',
    ],
    next: [
      'Get support — free, confidential help is available any time.',
      'Fill the time it used to take with something on your “Life beyond work” list.',
    ],
    resources: [R.samhsa, R.smart, R.gambling],
    app: [APP.life, APP.planner, APP.physical],
    direction: 'Most people need more than one try. A slip is information, not the end.',
    areas: ['physical', 'mental'],
  },
  {
    id: 'health', group: 'mind', emoji: '🩺', audience: 'all',
    label: 'A health problem or disability changed what I can do',
    blurb: 'Your body or health isn’t what it was, and plans have to change.',
    heard: 'Losing what you could do is a real loss. It’s okay to grieve it and still look forward.',
    now: [
      'Write down what you can still do, and what you most want back.',
      'Ask your doctor what’s realistic over the next few months.',
    ],
    next: [
      'Contact your state’s vocational rehabilitation program — they help people with disabilities train for and find work.',
      'Look for paths and activities that fit how your body works now.',
    ],
    resources: [R.vocRehab, R.jan, R.benefits],
    app: [APP.map, APP.life, APP.physical],
    direction: 'What changed is how, not whether. A lot of this is finding new routes to what you care about.',
    areas: ['physical', 'professional', 'mental'],
  },

  // ── Big changes ───────────────────────────────────────────────────────────
  {
    id: 'reentry', group: 'change', emoji: '🚪', audience: 'adult', needsIncome: true,
    label: 'Just got out of jail or prison',
    blurb: 'Starting over, with a record in the way.',
    heard: 'Your past is part of your story, not the end of it.',
    now: [
      'Get your documents in order — state ID, Social Security card, birth certificate. A lot depends on them.',
      'Call 211 for housing, food, and reentry programs near you.',
    ],
    next: [
      'Look for employers and job programs open to people with records — American Job Centers can help.',
      'Mention the Federal Bonding Program to employers — it insures them for hiring you, free.',
      'Ask free legal aid whether your record can be sealed or expunged.',
      'Some fields and licenses are more open to people with records than others — ask before you pay for training.',
    ],
    resources: [R.reentry, R.bonding, R.legalAid, R.two11],
    app: [APP.map, APP.portfolio, APP.planner],
    direction: 'Build proof of who you are now: steady work, skills on paper, people who’ll vouch for you.',
    areas: ['professional', 'financial', 'social'],
  },
  {
    id: 'newcountry', group: 'change', emoji: '🌍', audience: 'all',
    label: 'New to this country',
    blurb: 'New language, new systems, starting from scratch.',
    heard: 'You’ve already done one of the hardest things a person can do.',
    now: [
      'Call 211 for local help — they can connect you in many languages.',
      'Find free English classes at your public library or community college, if you need them.',
    ],
    next: [
      'Get immigration legal help only from a licensed attorney or a DOJ-accredited representative — never a “notario.”',
      'If you had a career back home, ask a job center how to get your credentials recognized here.',
    ],
    resources: [R.two11, R.uscisScams, R.jobCenter, R.legalAid],
    app: [APP.map, APP.portfolio, APP.discover],
    direction: 'Your experience from before still counts. Part of the work is translating it.',
    areas: ['professional', 'social', 'financial'],
  },
  {
    id: 'emptynest', group: 'change', emoji: '🪺', audience: 'adult',
    label: 'Retired, or the kids grew up — now what?',
    blurb: 'More time than you’ve had in years, and no clear shape to it.',
    heard: 'Decades of experience and more freedom than you’ve had in a long time. That’s a lot to work with.',
    now: [
      'List what you’ve missed doing and what you’ve always wondered about.',
      'Put one regular thing on the calendar — structure matters more than people expect.',
    ],
    next: [
      'Try volunteering, mentoring, or a class.',
      'Consider part-time or “encore” work in something that matters to you.',
    ],
    resources: [R.volunteer],
    app: [APP.life, APP.map, APP.personality],
    direction: 'This is exactly the kind of open question Wayfinder is for.',
    areas: ['social', 'spiritual', 'creative'],
  },
  {
    id: 'grief', group: 'change', emoji: '🕯️', audience: 'all',
    label: 'Grieving someone',
    blurb: 'Someone important is gone.',
    heard: 'There’s no right way to grieve and no timeline you have to meet.',
    now: [
      'Let people help with practical things — meals, rides, errands.',
      'Keep the basics: eat, sleep, get outside a little.',
    ],
    next: [
      'Grief support groups exist in most places — 211 or a local hospice can point you to one.',
      'If grief turns into feeling hopeless, reach out — 988 is there for that too.',
    ],
    resources: [R.two11, R.dougy, R.lifeline],
    app: [APP.mental, APP.life],
    direction: 'Grief can reshuffle what matters to you. When you’re ready — not before — Wayfinder can help you look at what’s next.',
    areas: ['mental', 'social', 'spiritual'],
  },
  {
    id: 'lost', group: 'change', emoji: '🌀', audience: 'all',
    label: 'I just feel stuck and lost',
    blurb: 'Nothing’s wrong exactly — you just don’t know where you’re going.',
    heard: 'That’s one of the most common feelings there is, and it usually means you’re ready for something.',
    now: [
      'Do Wayfinder’s three steps — about ten minutes.',
      'Pick the smallest experiment on your map and do it this week.',
    ],
    next: [
      'Look at “Life beyond work” too — direction isn’t only about jobs.',
      'Take the personality questions — sometimes it helps to see yourself described from outside.',
    ],
    resources: [],
    app: [APP.steps, APP.life, APP.personality],
    direction: 'Stuck usually means thinking in circles. Doing something small breaks the loop better than more thinking.',
    areas: ['mental', 'spiritual'],
  },
];

export const SITUATION_MAP = Object.fromEntries(SITUATIONS.map(s => [s.id, s]));

// Confirmed minors don't see `audience: 'adult'` situations. Unknown age
// (guests) sees everything — none of it is unsafe, and a guest may be the
// adult who most needs "behind on bills".
export function situationsFor({ confirmedMinor = false } = {}) {
  return confirmedMinor ? SITUATIONS.filter(s => s.audience !== 'adult') : SITUATIONS;
}
