// src/data/lifeAreaActions.js
//
// The action pool and research resources behind every Life Area sub-section.
//
// The DATABASE is the source of truth once the seed is applied — the
// area_actions and area_resources tables, edited from the Supabase dashboard
// the same way app_content is. This file is two things only:
//
//   1. The initial seed. scripts/gen-life-area-seed.mjs validates it and
//      emits the migration. Seeds insert with ON CONFLICT (key) DO NOTHING,
//      so re-running never overwrites an edit made in the dashboard.
//   2. The offline / table-missing fallback, same contract as the hardcoded
//      tips in AreaSectionScreen: the app shows these until a remote fetch
//      succeeds, and keeps showing them if it never does.
//
// No imports, so the generator can evaluate it without the React Native graph.
//
// ─── How an action is chosen ─────────────────────────────────────────────────
// age_bands is a HARD filter — the same five bands ageCategoryFromDob()
// already writes to profiles.age_category. boost_personas only re-ranks; it
// never hides anything. Every sub-section has something for every band, so no
// sub-section ever disappears for a younger user — the content scales instead.
//
// ─── Tiers ───────────────────────────────────────────────────────────────────
//   quick — two minutes or less, do it now
//   learn — a one-minute read (body is the read)
//   habit — recurring; one tap logs it
//   step  — a bigger one-off setup; the usual pick for Today's action
// featured: true marks a candidate for the Today's action slot.
//
// ─── Content rules — keep them ───────────────────────────────────────────────
// - Plain language that reads right at 10 and at 70. No condescension.
// - Money: teach the mechanism, never tell someone what THEY should do.
//   Any real-world figure with % or $ carries "(reviewed 2026)"; illustrative
//   arithmetic opens with "Imagine". The generator enforces this per sentence.
// - Minors: nothing asks a kid to contact strangers, share details, or sign up
//   for anything 13+/18+. Crisis lines are in every band.
// - No brand names of our own in user-facing content (it used to say "CTH").

export const AGE_BANDS = ['kid', 'teen', 'young_adult', 'adult', 'professional'];

const ALL = AGE_BANDS;
const KID = ['kid'];
const TEEN = ['teen'];
const KT = ['kid', 'teen'];
const TU = ['teen', 'young_adult', 'adult', 'professional'];
const YU = ['young_adult', 'adult', 'professional'];

export const ACTION_TIERS = ['quick', 'learn', 'habit', 'step'];

// What a tap does. Every one maps to something the app can already execute
// except `reminder`, which needs one small expo-notifications helper.
//   done     — log it (area_notes, [ScreenTag][Action])
//   read     — open the body in a sheet
//   timer    — WorkModeScreen with presetTitle + lifeAreaId   payload.minutes
//   task     — insert a tasks row tagged to the area
//   routine  — subscribeToPreset()                             payload.preset
//   screen   — navigate                                        payload.screen, payload.params
//   link     — open a URL                                      payload.url
//   reminder — local notification                              payload.time 'HH:MM'
export const ACTION_HANDLERS = ['done', 'read', 'timer', 'task', 'routine', 'screen', 'link', 'reminder'];

export const RESOURCE_KINDS = ['guide', 'article', 'tool', 'course', 'video', 'hotline', 'book'];

// Every sub-section in LIFE_AREAS, keyed by the screen tag area_notes already
// uses. Area ids here are the CORRECTED ones: Mindfulness (SelfCareScreen) is
// mental and Network & Community is social, whatever the screens say today.
export const SUBSECTIONS = {
  ExerciseScreen:          { area: 'physical',     title: 'Fitness & Movement' },
  NutritionScreen:         { area: 'physical',     title: 'Nutrition' },
  SleepRecoveryScreen:     { area: 'physical',     title: 'Sleep & Recovery' },
  EnergyVitalityScreen:    { area: 'physical',     title: 'Energy & Vitality' },
  WellbeingScreen:         { area: 'mental',       title: 'Emotional Well-being' },
  StressAnxietyScreen:     { area: 'mental',       title: 'Stress & Anxiety' },
  SelfCareScreen:          { area: 'mental',       title: 'Mindfulness' },
  TherapySupportScreen:    { area: 'mental',       title: 'Therapy & Support' },
  RelationshipsScreen:     { area: 'social',       title: 'Relationships' },
  NetworkScreen:           { area: 'social',       title: 'Network & Community' },
  CommunicationScreen:     { area: 'social',       title: 'Communication' },
  SocialHealthScreen:      { area: 'social',       title: 'Social Health' },
  IncomeEarningsScreen:    { area: 'financial',    title: 'Income & Earnings' },
  BudgetSpendingScreen:    { area: 'financial',    title: 'Budget & Spending' },
  SavingsInvestingScreen:  { area: 'financial',    title: 'Savings & Investing' },
  DebtCreditScreen:        { area: 'financial',    title: 'Debt & Credit' },
  HobbiesScreen:           { area: 'creative',     title: 'Hobbies & Interests' },
  ArtMusicScreen:          { area: 'creative',     title: 'Art & Music' },
  ContentMediaScreen:      { area: 'creative',     title: 'Content & Media' },
  LearningCuriosityScreen: { area: 'creative',     title: 'Learning & Curiosity' },
  CareerExplorationScreen: { area: 'professional', title: 'Career & Jobs' },
  ResearchScreen:          { area: 'professional', title: 'Skills & Learning' },
  ProjectsScreen:          { area: 'professional', title: 'Projects & Work' },
  BusinessVenturesScreen:  { area: 'professional', title: 'Business & Ventures' },
  PurposeValuesScreen:     { area: 'spiritual',    title: 'Purpose & Values' },
  ReflectionPrayerScreen:  { area: 'spiritual',    title: 'Reflection & Prayer' },
  PhilosophyWisdomScreen:  { area: 'spiritual',    title: 'Philosophy & Wisdom' },
  CommunityFaithScreen:    { area: 'spiritual',    title: 'Community & Faith' },
  PrivacyScreen:           { area: 'digital',      title: 'Privacy & Security' },
  SecurityScreen:          { area: 'digital',      title: 'Digital Security' },
  ScreenTimeFocusScreen:   { area: 'digital',      title: 'Screen Time & Focus' },
  ToolsSystemsScreen:      { area: 'digital',      title: 'Tools & Systems' },
};

let order = 0;
function S(screen, prefix, list) {
  return list.map(([tier, slug, title, o = {}]) => ({
    key: `${prefix}.${slug}`,
    screen_tag: screen,
    area_id: SUBSECTIONS[screen]?.area,
    tier,
    title,
    why: o.why || null,
    body: o.body || null,
    handler: o.handler || (tier === 'learn' ? 'read' : 'done'),
    payload: o.payload || {},
    age_bands: o.bands || ALL,
    boost_personas: o.personas || [],
    featured: !!o.featured,
    sort_order: order++,
  }));
}

let rOrder = 0;
function R(screen, prefix, list) {
  return list.map(([slug, title, url, o = {}]) => ({
    key: `${prefix}.${slug}`,
    screen_tag: screen,
    area_id: SUBSECTIONS[screen]?.area,
    title,
    url,
    description: o.desc || null,
    source: o.source || null,
    kind: o.kind || 'guide',
    cost: o.cost || 'free',
    age_bands: o.bands || ALL,
    sort_order: rOrder++,
  }));
}

/* ══════════════════════════════════════════════════════════════════════════
   ACTIONS
   ══════════════════════════════════════════════════════════════════════════ */

export const AREA_ACTIONS = [

  /* ─── PHYSICAL ─────────────────────────────────────────────────────────── */

  ...S('ExerciseScreen', 'fit', [
    ['quick', 'ten-squats', "Do 10 squats right now", { featured: true,
      why: "Short bursts of movement add up. Every bit counts toward your day." }],
    ['quick', 'stretch-minute', "Stand up and stretch for one minute", {
      why: "Sitting for a long time makes muscles stiff. Moving resets them." }],
    ['step', 'walk-15', "Go for a 15-minute walk", { featured: true, handler: 'timer', payload: { minutes: 15 },
      why: "A brisk walk is real exercise. No gym or gear needed." }],
    ['step', 'strength-plan', "Put two strength sessions in your week", { bands: YU, handler: 'routine', payload: { preset: 'physical_starter' },
      why: "Muscle work twice a week is half of the adult guideline, and the half most people skip." }],
    ['learn', 'kids-how-much', "How much should kids and teens move?", { bands: KT,
      body: "Kids and teens aged 6 to 17 need about 60 minutes of activity every day. It doesn't have to be all at once. Biking to a friend's, playing tag and shooting hoops all count. Try to include things that make you breathe hard, things that build strength like climbing, and things that make bones strong, like jumping." }],
    ['learn', 'adults-enough', "What 'enough exercise' actually means", { bands: YU,
      body: "Adults are advised to get about 150 minutes of moderate activity a week, which is 30 minutes on five days, plus muscle-strengthening work on two days. Moderate means you can talk but not sing. Brisk walking counts. If that feels far off, any amount beats none, and the biggest health gain comes from going from nothing to something." }],
    ['habit', 'move-20', "Move for 20 minutes today", { why: "Walking, dancing, sport, chores. It all counts." }],
    ['habit', 'play-outside', "Play outside for an hour", { bands: KID, why: "Running around outside is exercise that doesn't feel like it." }],
  ]),

  ...S('NutritionScreen', 'food', [
    ['quick', 'water-now', "Drink a glass of water now", { featured: true,
      why: "Mild thirst can feel like tiredness or hunger." }],
    ['quick', 'add-plant', "Add one fruit or vegetable to your next meal", {
      why: "Adding is easier than cutting out, and it crowds out the rest." }],
    ['learn', 'half-plate', "The half-plate trick", {
      body: "An easy way to eat well without counting anything: fill half your plate with fruits and vegetables, a quarter with protein like beans, eggs, fish or chicken, and a quarter with grains, ideally whole grains like brown rice or whole-wheat bread. It works at home, at school and at a restaurant, and nobody has to track a single calorie." }],
    ['learn', 'labels', "Reading a nutrition label in 30 seconds", { bands: TU,
      body: "Start with serving size, because every number on the label is for that amount and packages often hold more than one serving. Then check added sugars and sodium, which most people get too much of, and fiber and protein, which help you stay full. In the percent daily value column, 5% or less is low and 20% or more is high (reviewed 2026)." }],
    ['habit', 'water-meals', "Drink water with every meal", { why: "One simple anchor instead of counting glasses." }],
    ['habit', 'breakfast', "Eat breakfast before school", { bands: KT, why: "It's hard to focus in class on an empty stomach." }],
    ['step', 'prep-lunch', "Prep tomorrow's lunch tonight", { bands: YU, featured: true,
      why: "Deciding in advance is easier than deciding when you're hungry." }],
    ['step', 'help-cook', "Help make one meal this week", { bands: KT, featured: true,
      why: "People who help cook tend to try more foods, and it's a skill for life." }],
  ]),

  ...S('SleepRecoveryScreen', 'sleep', [
    ['quick', 'charge-outside', "Charge your phone or tablet outside your bedroom", { featured: true,
      why: "If it's out of reach, it can't keep you up." }],
    ['quick', 'dim-lights', "Dim the lights an hour before bed", {
      why: "Bright light tells your brain it's still daytime." }],
    ['learn', 'brain-sleep', "What your brain does while you sleep", { bands: KID,
      body: "Sleep isn't your brain switching off. It's your brain doing homework. While you sleep, it sorts out what you learned today and stores it so you remember it tomorrow. It also helps you grow and fight off colds. Kids your age need about 9 to 12 hours a night. If mornings are a struggle, an earlier bedtime usually helps more than anything else." }],
    ['learn', 'teen-marks', "Why late nights cost you marks", { bands: TEEN,
      body: "Teens need about 8 to 10 hours of sleep, and most get less. That matters for school: sleep is when your brain moves what you studied into long-term memory, so staying up late to cram can undo the studying. Your body clock also shifts later in the teen years, which is why falling asleep early feels hard. A fixed wake-up time and less light at night help reset it." }],
    ['learn', 'sleep-debt', "Sleep debt doesn't repay at weekends", { bands: YU,
      body: "Adults need at least 7 hours a night. Sleeping in on Saturday can make you feel better, but it doesn't fully undo a week of short nights, and a big weekend lie-in shifts your body clock, which makes Sunday night harder. A consistent wake time, even on days off, does more for sleep quality than any single long night." }],
    ['habit', 'no-screens', "No screens in the last hour before bed", { why: "The light and the scrolling both keep your brain awake." }],
    ['habit', 'same-bedtime', "In bed at the same time every night", { bands: KT, why: "A steady bedtime makes falling asleep easier." }],
    ['habit', 'same-wake', "Same wake time every day, weekends too", { bands: YU, why: "Your wake time sets your body clock more than your bedtime does." }],
    ['step', 'wind-down', "Set a wind-down reminder for tonight", { bands: TU, featured: true, handler: 'reminder', payload: { time: '22:30' },
      why: "A cue at a fixed time beats relying on willpower at midnight." }],
    ['step', 'pick-bedtime', "Pick a bedtime and tell your family", { bands: KID, featured: true,
      why: "When everyone knows it, it's easier to stick to." }],
  ]),

  ...S('EnergyVitalityScreen', 'energy', [
    ['quick', 'daylight', "Step outside for five minutes of daylight", { featured: true,
      why: "Daylight, especially in the morning, helps set your body clock and lift energy." }],
    ['quick', 'move-two', "Get up and move for two minutes", {
      why: "An energy dip after sitting is often your body asking to move." }],
    ['learn', 'afternoon-crash', "Why you crash in the afternoon", {
      body: "Most people have a natural energy dip in the early afternoon. It's part of your body clock, not a sign something is wrong. A heavy lunch, too little sleep and not drinking enough make it worse. A short walk, some daylight or a glass of water usually help more than a sugary snack or a caffeinated drink, which tend to give a quick lift and then a second dip." }],
    ['learn', 'caffeine', "Caffeine lasts longer than you think", { bands: TU,
      body: "Caffeine can still be working in your body six hours after you drink it, so an afternoon coffee, energy drink or cola can make it harder to fall asleep, even if you don't feel wired. Poor sleep then makes you more tired the next day, and the cycle repeats. Energy drinks can carry far more caffeine than a can of soda, and aren't recommended for kids and teens." }],
    ['habit', 'outside-daily', "Get outside in daylight today", { why: "Even a cloudy day is far brighter than indoors." }],
    ['step', 'checkup', "Check when your last check-up was", { bands: YU, featured: true, handler: 'task',
      why: "Check-ups can catch problems before they cause symptoms." }],
    ['step', 'water-bottle', "Pack a water bottle for tomorrow", { bands: KT, featured: true,
      why: "If it's with you, you'll actually drink it." }],
  ]),

  /* ─── MENTAL ───────────────────────────────────────────────────────────── */

  ...S('WellbeingScreen', 'mood', [
    ['quick', 'name-it', "Name how you feel in one word", { featured: true,
      why: "Putting a feeling into words can make it less intense." }],
    ['quick', 'one-good', "Write down one good thing from today", {
      why: "Your brain notices problems automatically. Good things need a nudge." }],
    ['learn', 'all-ok', "All feelings are OK", { bands: KID,
      body: "Everyone feels angry, sad, scared or jealous sometimes, even grown-ups. Having a big feeling doesn't make you bad. What matters is what you do with it: take a breath, say what you feel out loud, or tell someone you trust. Feelings are like weather. Even a big storm passes." }],
    ['learn', 'information', "Feelings are information, not instructions", { bands: TU,
      body: "Every feeling is trying to tell you something. Anger often means something feels unfair, sadness that you've lost something that mattered, worry that something important is uncertain. You don't have to act on a feeling, and you don't have to push it away either. Noticing it, naming it and asking what it's pointing at is usually enough to take the edge off." }],
    ['habit', 'check-in', "Check in with how I'm feeling", { why: "Ten seconds, once a day. Patterns show up fast." }],
    ['step', 'enjoy-15', "Do something you enjoy for 15 minutes", { featured: true, handler: 'timer', payload: { minutes: 15 },
      why: "Small, planned bits of enjoyment are one of the most reliable mood lifts." }],
  ]),

  ...S('StressAnxietyScreen', 'stress', [
    ['quick', 'breathe-4-6', "Breathe in for 4, out for 6, five times", { featured: true,
      why: "A longer out-breath signals your body to calm down." }],
    ['quick', 'grounding', "Try 5-4-3-2-1 grounding", {
      why: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste." }],
    ['learn', 'physical-worry', "Why worry feels so physical", {
      body: "When your brain spots a threat, like a test, an argument or a deadline, it gets your body ready to act: faster heart, quick breathing, tense muscles, a jittery stomach. That's the stress response, and it's useful in short bursts. The trouble is it can switch on for things you can't fight or run from. Slow breathing, moving your body, or naming what's worrying you all send the 'safe now' signal back." }],
    ['learn', 'stress-vs-anxiety', "Stress vs. anxiety", { bands: TU,
      body: "Stress is usually about something specific happening now, like a deadline or a conflict, and eases when it's over. Anxiety is worry that sticks around even without a clear cause, or that's much bigger than the situation. Both are common. If worry gets in the way of school, work, sleep or friendships for weeks at a time, that's a good moment to talk to a doctor or counselor. Anxiety responds well to treatment." }],
    ['habit', 'real-break', "Take one real break today", { why: "Away from the screen, the desk and the problem." }],
    ['step', 'worry-to-step', "Write down what's worrying you, then one next step", { featured: true,
      why: "Getting it on paper turns a cloud of worry into something you can act on." }],
  ]),

  ...S('SelfCareScreen', 'mind', [
    ['quick', 'listen-minute', "Sit still for one minute and just listen", { featured: true, handler: 'timer', payload: { minutes: 1 },
      why: "Noticing sounds pulls your attention into right now." }],
    ['quick', 'slow-snack', "Eat your next snack slowly, noticing the taste", {
      why: "Anything done with full attention is mindfulness practice." }],
    ['learn', 'what-it-is', "What mindfulness actually is", {
      body: "Mindfulness just means paying attention to what's happening right now, on purpose, without judging it. You don't need to empty your mind. Minds wander, that's what they do. The practice is noticing you've drifted and gently coming back. Even a minute of this, done most days, can make it easier to stay calm when things get busy." }],
    ['habit', 'mindful-minute', "Take a mindful minute", { why: "Short and daily beats long and rare." }],
    ['step', 'guided-5', "Try a 5-minute guided meditation", { featured: true, handler: 'link',
      payload: { url: 'https://www.uclahealth.org/uclamindful/guided-meditations' },
      why: "Free, short, and someone else does the guiding." }],
    ['step', 'body-scan', "Do a body scan before bed", { bands: KT, handler: 'timer', payload: { minutes: 5 },
      why: "Notice each part of your body, from your toes to your head." }],
  ]),

  ...S('TherapySupportScreen', 'support', [
    ['quick', 'save-988', "Save 988 in your phone", { featured: true,
      why: "Call or text 988 any time, day or night, if you're struggling or worried about someone. Free and confidential (US)." }],
    ['quick', 'one-person', "Think of one person you could talk to if things got hard", {
      why: "Knowing who, before you need them, makes reaching out easier." }],
    ['learn', 'brave-to-ask', "It's brave to ask for help", { bands: KID,
      body: "When something is really bothering you, at home, at school, online or inside your head, telling a grown-up you trust is one of the bravest things you can do. That might be a parent, a teacher, a school counselor, a coach or a relative. You don't have to have the right words. 'Can I talk to you about something?' is enough." }],
    ['learn', 'what-therapy-is', "What therapy is actually like", { bands: TU,
      body: "Therapy is a regular conversation with a trained professional whose whole job is helping you understand what's going on and find ways to handle it. It isn't only for a crisis. Lots of people go for stress, relationships, grief or feeling stuck. The first session is mostly getting to know each other. If the first therapist isn't a good fit, trying another is normal, not failure." }],
    ['habit', 'check-trusted', "Check in with someone I trust", { why: "Support works best as a habit, not an emergency." }],
    ['step', 'two-adults', "Write down two grown-ups you trust", { bands: KID, featured: true,
      why: "So you know exactly who to go to." }],
    ['step', 'school-counselor', "Find out who your school counselor is", { bands: TEEN, featured: true,
      why: "Talking to them is free, and it's what they're there for." }],
    ['step', 'what-covered', "Find out what counseling your work, school or insurance covers", { bands: YU, featured: true, handler: 'task',
      why: "Many people have free sessions available and never use them." }],
  ]),

  /* ─── SOCIAL ───────────────────────────────────────────────────────────── */

  ...S('RelationshipsScreen', 'rel', [
    ['quick', 'say-hi', "Send someone a message just to say hi", { featured: true,
      why: "Small check-ins keep relationships warm between big moments." }],
    ['quick', 'appreciate', "Tell someone one specific thing you appreciate about them", {
      why: "Specific beats general. 'Thanks for waiting for me' lands harder than 'you're great'." }],
    ['learn', 'good-friend', "How to be a good friend", { bands: KID,
      body: "Good friends listen, take turns, keep promises and stick up for each other. Everyone has fallings-out sometimes. Saying sorry when you've hurt someone, and meaning it, fixes more than most people expect. And a good friend is someone who makes you feel good about yourself, not worse." }],
    ['learn', 'small-moments', "Small moments matter more than big ones", {
      body: "Strong relationships are built less by grand gestures and more by small everyday moments: noticing when someone wants your attention and turning toward them by looking up, answering, or asking a question. Researchers who study couples, friends and families keep finding the same thing. People who respond to these little bids for connection feel closer over time." }],
    ['learn', 'healthy', "What healthy relationships have in common", { bands: TU,
      body: "Respect, honesty, trust and being able to disagree safely. In a healthy relationship, whether friends, family or dating, you can say no without fear, have your own friends and time, and aren't checked on or controlled. Jealousy that turns into rules about who you can see, or someone reading your phone, isn't a sign of love. If something feels off, talking to someone you trust is a good first step." }],
    ['habit', 'real-convo', "Have one real conversation today", { why: "Not about logistics. About how someone actually is." }],
    ['step', 'plan-time', "Plan time with someone you care about this week", { featured: true, handler: 'task',
      why: "Good intentions become plans only when there's a day attached." }],
  ]),

  ...S('NetworkScreen', 'net', [
    ['quick', 'hello-new', "Say hello to a neighbor or classmate you don't usually talk to", { featured: true,
      why: "Every close friend was once someone you didn't know." }],
    ['quick', 'reconnect', "Message someone you haven't talked to in a while", {
      why: "Old connections are easier to warm up than new ones are to start." }],
    ['learn', 'weak-ties', "Why people you barely know matter", {
      body: "Your close friends tend to know the same people and hear about the same things you do. The people you know a little, like a neighbor, a teammate, or someone from a class or club, connect you to different circles. That's why new opportunities, from a job lead to a new hobby group, often come through acquaintances rather than best friends." }],
    ['habit', 'talk-new', "Talk to someone new", { why: "One new name a week adds up to a lot by the end of the year." }],
    ['step', 'club', "Find one club, team or group to try", { bands: KT, featured: true,
      why: "Doing something together is the easiest way to make friends." }],
    ['step', 'local-group', "Find one local group or volunteer opportunity", { bands: YU, featured: true, handler: 'task',
      why: "Shared activity builds connection faster than small talk." }],
  ]),

  ...S('CommunicationScreen', 'talk', [
    ['quick', 'follow-up', "In your next conversation, ask one follow-up question", { featured: true,
      why: "Follow-up questions show you're actually listening." }],
    ['quick', 'i-feel', "Rewrite one complaint as an 'I feel… when… because…' sentence", {
      why: "It turns an accusation into something the other person can hear." }],
    ['learn', 'i-statements', "How 'I' statements work", {
      body: "'You never listen' starts a fight. 'I feel ignored when I'm interrupted, because what I'm saying matters to me' starts a conversation. Talking about your own feelings and what happened, instead of labeling the other person, makes people less defensive, so they're more likely to actually hear you. It feels awkward at first. It gets easier." }],
    ['learn', 'boundaries', "Boundaries are about you, not them", { bands: TU,
      body: "A boundary is a limit on what you will do, not a rule for what someone else must do. 'You can't yell at me' is hard to enforce. 'If the yelling starts, I'll leave the room and we can talk later' is completely in your control. Clear, calm and followed through: that's what makes a boundary work." }],
    ['habit', 'no-interrupt', "Listen without interrupting in one conversation", { why: "Harder than it sounds. Worth it every time." }],
    ['step', 'say-it', "Use an 'I feel' sentence with someone today", { bands: KID, featured: true,
      why: "Telling people how you feel helps them understand you." }],
    ['step', 'avoided-talk', "Plan how you'll say the thing you've been avoiding", { bands: TU, featured: true,
      why: "Writing the first sentence down makes the conversation far easier to start." }],
  ]),

  ...S('SocialHealthScreen', 'socialh', [
    ['quick', 'catch-up', "Text or call a friend just to catch up", { featured: true,
      why: "No reason needed. That's the point." }],
    ['quick', 'phone-away', "Put your phone away during your next meal with someone", {
      why: "Even a phone face-down on the table makes conversations shallower." }],
    ['learn', 'loneliness', "Loneliness is a signal, not a flaw", {
      body: "Feeling lonely is your brain's way of saying you need more connection, the way hunger tells you to eat. It happens to everyone, including people surrounded by others, because it's about feeling close, not how many people are around. The fix usually starts small: one conversation, one shared activity, one person you see regularly." }],
    ['habit', 'in-person', "Spend time with someone in person", { why: "Messages help. Being there helps more." }],
    ['step', 'hangout', "Plan one in-person hangout this week", { featured: true, handler: 'task',
      why: "A plan with a day on it actually happens." }],
  ]),

  /* ─── FINANCIAL ────────────────────────────────────────────────────────── */

  ...S('IncomeEarningsScreen', 'income', [
    ['quick', 'where-from', "Write down where your money comes from", {
      why: "Allowance, gifts, a paycheck, side work. Seeing it all is the first step." }],
    ['learn', 'where-money-comes', "Where money comes from", { bands: KID,
      body: "Money usually comes from doing work that someone else values: making something, fixing something, helping with something, or teaching something. Grown-ups get paid for their jobs. Kids can earn too, by doing extra chores, helping neighbors, or selling something they made. The more useful or rare the thing you can do, the more people will pay for it." }],
    ['learn', 'gross-net', "Gross pay vs. take-home pay", { bands: TU,
      body: "The pay you're offered, called gross pay, isn't what lands in your account. Before you get it, money comes out for taxes, and often for things like health insurance or retirement savings. What's left is net, or take-home, pay. That's the number that actually pays the bills, so it's the one to plan with. Your first payslip shows where each deduction goes." }],
    ['learn', 'second-stream', "Why a second income stream matters", { bands: YU,
      body: "If all your money comes from one place, losing it means losing everything at once. A second source, like freelance work, a side project, or a skill you can sell, spreads that risk out. It doesn't need to be big to matter. Even a small, steady amount can cover a bill, build savings, or become a fallback if your main income stops." }],
    ['habit', 'log-earned', "Log money I earned this week", { why: "Tracking income is how you notice it growing, or not." }],
    ['step', 'extra-job', "Ask a grown-up about one extra job you could do to earn money", { bands: KID, featured: true,
      why: "Earning your own money feels different from being given it." }],
    ['step', 'three-ways', "List three ways you could earn money at your age", { bands: TEEN, featured: true,
      why: "Babysitting, tutoring, pet-sitting, yard work. There are more options than it seems." }],
    ['step', 'payslip', "Check your last payslip line by line", { bands: YU, featured: true,
      why: "Mistakes happen, and every deduction should be one you recognize." }],
  ]),

  ...S('BudgetSpendingScreen', 'budget', [
    ['quick', 'count-money', "Count how much money you have saved", { bands: KT, featured: true,
      why: "Knowing your number makes every choice clearer." }],
    ['quick', 'check-balance', "Check your account balance right now", { bands: YU, featured: true,
      why: "Most overspending happens when we're guessing." }],
    ['learn', 'needs-wants', "Needs vs. wants", { bands: KID,
      body: "A need is something you can't do without: food, a home, clothes that fit. A want is something nice to have, like a new game, candy or the latest sneakers. Wants aren't bad! But when money is limited, needs come first. Before buying something, ask: do I need this, or do I want it? And will I still want it next week?" }],
    ['learn', 'wait-24', "The 24-hour rule", { bands: TU,
      body: "Before any purchase you didn't plan, wait 24 hours. If you still want it tomorrow, it's probably a real want. If you've forgotten about it, you just saved money. Stores and apps are designed to make buying fast and emotional, with countdown timers, 'only 2 left' and one-tap checkout. A pause is the simplest defense there is." }],
    ['learn', 'split', "A simple way to split your money", { bands: YU,
      body: "One common starting point is 50/30/20: about half of take-home pay for needs like rent, food and bills, about a third for wants, and a fifth for savings or paying down debt (reviewed 2026). It's a rule of thumb, not a law. In expensive cities, needs often take more. The point is to decide the split on purpose instead of finding out at the end of the month." }],
    ['habit', 'wait-a-day', "Wait a day before buying something I didn't plan", { why: "The want that survives a night's sleep is the real one." }],
    ['step', 'subscriptions', "List every subscription you pay for", { bands: YU, handler: 'task',
      why: "Most people find at least one they forgot about." }],
  ]),

  ...S('SavingsInvestingScreen', 'save', [
    ['quick', 'jar', "Put some of your next money in your savings jar", { bands: KT, featured: true,
      why: "Saving first means you don't spend it by accident." }],
    ['quick', 'move-small', "Move a small amount into savings today", { bands: YU, featured: true,
      why: "The habit matters more than the amount." }],
    ['learn', 'three-jars', "Save, spend, share", { bands: KID,
      body: "One simple way to handle money: split it into three jars. Spend is for things you want now. Save is for something bigger later, so you don't spend it by accident. Share is for giving to someone or something you care about. Even putting a little in the Save jar each time adds up faster than you'd think." }],
    ['learn', 'compound', "How compound interest works", { bands: TU,
      body: "When savings earn interest, next year you earn interest on the interest too. Imagine putting away $100 that grows 5% a year: after one year it's $105, and in the second year you earn interest on $105, not $100. Over decades that snowball gets big, which is why starting early matters more than starting with a lot." }],
    ['learn', 'emergency-fund', "What an emergency fund is for", { bands: YU,
      body: "An emergency fund is money set aside only for surprises: a car repair, a medical bill, losing a job. Without one, an emergency often goes on a credit card and turns into debt. Many guides suggest working toward three to six months of essential expenses (reviewed 2026), but even a small starting cushion changes how a surprise bill feels. It's usually kept somewhere separate and easy to reach." }],
    ['learn', 'diversification', "What diversification means", { bands: YU,
      body: "Owning shares in one company means your money rides on that one company. Owning a little of hundreds, which is what an index fund does, means one company failing barely moves your total. That spread is diversification. It doesn't remove risk: when the whole market falls, a diversified fund falls too. It removes the risk of betting everything on being right about one thing." }],
    ['learn', 'fdic', "Savings accounts are insured, up to a point", { bands: YU,
      body: "In the US, money in a bank covered by the FDIC is insured up to $250,000 per depositor, per bank, per account type (reviewed 2026). If the bank fails, you get it back. Investments like stocks and funds aren't insured this way, and their value can go down. Banks that are covered say 'Member FDIC', and credit unions say NCUA." }],
    ['habit', 'save-something', "Put something into savings", { why: "Any amount. The streak is the point." }],
    ['step', 'make-jars', "Make three jars: Spend, Save, Share", { bands: KID, featured: true,
      why: "Label them, and split any money you get between them." }],
    ['step', 'save-goal', "Pick one thing to save for and write down the price", { bands: TEEN, featured: true,
      why: "A goal with a number on it is much easier to save toward." }],
    ['step', 'employer-match', "Find out if your employer matches retirement savings", { bands: YU, handler: 'task',
      why: "Some employers add money when you contribute. Not knowing is how people miss it." }],
  ]),

  ...S('DebtCreditScreen', 'debt', [
    ['quick', 'pay-back', "Pay back anything you've borrowed from a friend", { bands: KT, featured: true,
      why: "Paying back on time is how people learn they can trust you." }],
    ['quick', 'credit-report', "Check your credit report for free", { bands: YU, featured: true, handler: 'link',
      payload: { url: 'https://www.annualcreditreport.com' },
      why: "Free weekly reports from all three bureaus. Errors happen, and you can dispute them." }],
    ['learn', 'borrowing', "What borrowing means", { bands: KID,
      body: "Borrowing means using something that isn't yours yet and promising to give it back. If a friend lends you some money, you owe them that money back. Grown-ups borrow from banks too, but banks charge extra for it, called interest, so you pay back more than you borrowed. That's why people try to borrow only when they really need to." }],
    ['learn', 'credit-score', "How credit scores work", { bands: TU,
      body: "A credit score is a number, usually between 300 and 850, that tells lenders how reliably you've paid back what you borrowed. It's built from your history: paying on time, how much of your available credit you use, how long you've had credit, and how often you apply for more. You can't build one until you have credit in your name, but understanding it now means you won't damage it by accident later." }],
    ['learn', 'minimums', "Why minimum payments cost so much", { bands: YU,
      body: "Credit cards often charge interest above 20% a year (reviewed 2026). Paying only the minimum keeps the account in good standing, but much of that payment goes to interest, so the balance barely shrinks, and a few hundred dollars can take years to clear. Anything paid above the minimum goes straight to the balance and shortens that time a lot." }],
    ['learn', 'avalanche-snowball', "Avalanche vs. snowball", { bands: YU,
      body: "Two common ways to pay off several debts. Avalanche: pay minimums on everything, then put every extra dollar on the highest interest rate first. It costs the least overall. Snowball: put extra on the smallest balance first. You clear whole debts sooner, which keeps many people motivated. The math favors avalanche; the one that works is the one you'll stick to." }],
    ['habit', 'on-time', "Pay back what I owe on time", { why: "Friends, family or a lender. On time is the whole game." }],
    ['step', 'ask-credit', "Ask a parent or guardian how credit works in real life", { bands: TEEN,
      why: "Real examples teach more than any definition." }],
    ['step', 'list-debts', "List every debt with its balance and interest rate", { bands: YU,
      why: "You can't choose a payoff order until you can see them side by side." }],
  ]),

  /* ─── CREATIVE ─────────────────────────────────────────────────────────── */

  ...S('HobbiesScreen', 'hobby', [
    ['quick', 'fun-10', "Spend 10 minutes on something just for fun", { featured: true, handler: 'timer', payload: { minutes: 10 },
      why: "No goal, no score. Just because you like it." }],
    ['quick', 'always-wanted', "Write down three things you've always wanted to try", {
      why: "A list turns 'someday' into options." }],
    ['learn', 'why-hobbies', "Why hobbies matter more than they seem", {
      body: "A hobby is one of the few things you do purely because you like it: no grades, no pay, no one to impress. That's exactly why it helps. It gives your mind a break from pressure, builds skills that surprise you later, and connects you with people who like the same thing. You don't have to be good at it. That's not the point." }],
    ['habit', 'hobby-today', "Do my hobby today", { why: "Even 10 minutes keeps it alive." }],
    ['step', 'new-thing', "Try one new thing this week", { featured: true, handler: 'task',
      why: "You can't know you'd love something until you've tried it." }],
  ]),

  ...S('ArtMusicScreen', 'art', [
    ['quick', 'draw-5', "Draw anything for five minutes", { featured: true, handler: 'timer', payload: { minutes: 5 },
      why: "Quantity comes before quality. Just start." }],
    ['quick', 'one-song', "Listen to one song all the way through, doing nothing else", {
      why: "Really listening is a skill, and it's where making music starts." }],
    ['learn', 'practice-talent', "Practice beats talent", {
      body: "Most people who seem naturally talented just practiced more, often in ways you didn't see. Short, focused practice, like 15 minutes working on one specific thing, beats hours of noodling around. Pick one small skill, like a chord change or drawing hands, and repeat it until it feels easier. Then pick the next one." }],
    ['habit', 'practice', "Practice my art or instrument", { why: "A little, often. That's how every artist got good." }],
    ['step', 'finish-small', "Make something small and finish it", { featured: true,
      why: "Finished and imperfect teaches more than perfect and abandoned." }],
  ]),

  ...S('ContentMediaScreen', 'media', [
    ['quick', 'one-idea', "Write down one idea for something you'd like to make", { featured: true,
      why: "Ideas vanish fast. Catch them when they show up." }],
    ['quick', 'study-creator', "Look at how one creator you like structures their work", {
      why: "Notice how they start, what they cut, how they end." }],
    ['learn', 'share-safe', "Stay safe when you share online", { bands: KT,
      body: "Before you post anything, check it doesn't show your full name, school, address, or anything that shows where you are right now, like a street sign or your uniform. Keep accounts private and only accept people you know in real life. If anyone online makes you uncomfortable or asks for photos, stop replying and tell an adult you trust. That's never overreacting." }],
    ['learn', 'consistency', "Consistency beats going viral", { bands: YU,
      body: "Most creators who grow do it by posting regularly for a long time, not by one post blowing up. A schedule you can actually keep, even once a week, builds an audience and your skills at the same time. Every piece is also practice: your hundredth video will be far better than your first, and you only get there by making the first ninety-nine." }],
    ['habit', 'make-something', "Work on something I'm making", { why: "Progress, not perfection." }],
    ['step', 'share-family', "Make something and share it with family or friends first", { bands: KT, featured: true,
      why: "People who know you give the kindest, most useful feedback." }],
    ['step', 'plan-three', "Plan your next three pieces", { bands: YU, handler: 'task',
      why: "Knowing what's next removes the blank-page problem." }],
  ]),

  ...S('LearningCuriosityScreen', 'curious', [
    ['quick', 'look-up', "Look up one thing you've always wondered about", { featured: true,
      why: "Curiosity grows when you feed it." }],
    ['quick', 'read-10', "Read for ten minutes", { handler: 'timer', payload: { minutes: 10 },
      why: "Anything you like. Books, articles, comics all count." }],
    ['learn', 'curiosity-sticks', "Curiosity makes things stick", {
      body: "You remember things better when you actually want to know the answer. So before you learn something, ask yourself a question about it first, like 'why does that happen?' or 'how would I explain this?' Trying to answer before you look it up, even if you get it wrong, makes the real answer stick much better." }],
    ['habit', 'learn-one', "Learn one new thing today", { why: "Small facts connect into big understanding." }],
    ['step', 'explore-month', "Pick a book, course or topic to explore this month", { featured: true, handler: 'task',
      why: "A month is long enough to go deep, short enough to finish." }],
  ]),

  /* ─── PROFESSIONAL ─────────────────────────────────────────────────────── */

  ...S('CareerExplorationScreen', 'career', [
    ['quick', 'three-jobs', "Write down three jobs that sound interesting", {
      why: "Don't filter. Just notice what pulls you." }],
    ['learn', 'grown-ups-do', "What do grown-ups actually do all day?", { bands: KID,
      body: "There are thousands of different jobs, and many you've never heard of. Someone designs roller coasters, someone tests video games, someone looks after zoo animals, someone builds bridges. A great way to find out what jobs are really like is to ask the grown-ups around you: What do you do all day? What's the best part? What's the hardest?" }],
    ['learn', 'dont-know-yet', "You don't need to know what you want yet", { bands: TU,
      body: "Most people don't pick a career once and stick to it. They try things, learn what they like and don't, and adjust. The fastest way to figure it out isn't thinking harder, it's small experiments: reading about a job, talking to someone who does it, trying a short version of it. Each one tells you more than any quiz can." }],
    ['habit', 'learn-job', "Learn about one job this week", { why: "Every job you learn about widens what feels possible." }],
    ['step', 'ask-adult-job', "Ask a grown-up what their job is really like", { bands: KID, featured: true,
      why: "The best part, the hardest part, and how they got there." }],
    ['step', 'wayfinder', "Take the Wayfinder to see which paths fit you", { bands: TU, featured: true, handler: 'screen',
      payload: { screen: 'WayfinderScreen' },
      why: "Built for when you're not sure what you want." }],
    ['step', 'ooh', "Look up one job in the Occupational Outlook Handbook", { bands: TU, handler: 'link',
      payload: { url: 'https://www.bls.gov/ooh/' },
      why: "What the job involves, what training it needs, and whether it's growing." }],
  ]),

  ...S('ResearchScreen', 'skills', [
    ['quick', 'quiz-self', "Quiz yourself on something you learned this week", { featured: true, personas: ['STUDENT'],
      why: "Pulling information out of memory strengthens it more than re-reading." }],
    ['learn', 'test-yourself', "Study smarter: test yourself", { personas: ['STUDENT'],
      body: "Re-reading notes feels productive but doesn't stick well. What works much better: closing the book and trying to recall what you learned, with flashcards, practice questions, or explaining it out loud. Spreading that practice over several days, instead of cramming the night before, makes it last even longer. These two techniques, retrieval and spacing, are among the best-supported findings in learning research." }],
    ['habit', 'practice-15', "Practice a skill for 15 minutes", { why: "Fifteen minutes a day is over 90 hours a year." }],
    ['step', 'pick-skill', "Pick one skill to get better at this month", { featured: true, handler: 'task',
      why: "One skill, measurably better, beats five skills a little busier." }],
  ]),

  ...S('ProjectsScreen', 'projects', [
    ['quick', 'next-step', "Write the very next step for one project", { featured: true,
      why: "A clear next step is the difference between a project and a wish." }],
    ['quick', 'focus-25', "Start a 25-minute focus session", { handler: 'timer', payload: { minutes: 25 },
      why: "One block of real focus moves more than a day of half-attention." }],
    ['learn', 'finish-small', "Finish small, then grow", {
      body: "Big projects stall because the finish line is too far away to feel real. Break it into pieces small enough to finish in one sitting, and decide what 'done' looks like for each. Finishing something small gives you momentum and something real to show, which is far more motivating than a half-built big thing." }],
    ['habit', 'project-time', "Work on a project", { why: "Even a little keeps it moving and keeps it in your head." }],
    ['step', 'open-workshop', "Open the Workshop and pick one project to move forward", { featured: true, handler: 'screen',
      payload: { screen: 'ProjectsScreen' },
      why: "Choose one. Momentum comes from focus." }],
  ]),

  ...S('BusinessVenturesScreen', 'venture', [
    ['quick', 'problem', "Write down one problem you've noticed people complaining about", {
      why: "Every business starts as a problem someone wants solved." }],
    ['learn', 'what-business', "What is a business?", { bands: KID,
      body: "A business is a way of making money by solving a problem for people. A lemonade stand solves 'I'm thirsty.' A dog-walking service solves 'I'm too busy to walk my dog.' Every business needs three things: something people want, a way to reach them, and a price that covers what it costs to make, with a bit left over. That bit left over is called profit." }],
    ['learn', 'talk-first', "Talk to customers before you build", { bands: TU, personas: ['ENTREPRENEUR', 'BUSINESS'],
      body: "The most common way new businesses fail is building something nobody wants. Before spending money or months building, talk to people who have the problem you want to solve. Ask how they deal with it now and what it costs them, not whether they like your idea, because people are polite. If they're already paying or struggling to solve it, that's a real signal." }],
    ['learn', 'revenue-profit', "Revenue isn't profit", { bands: YU, personas: ['ENTREPRENEUR', 'BUSINESS'],
      body: "Revenue is all the money coming in. Profit is what's left after every cost: materials, tools, fees, your time, and taxes. A business can have lots of revenue and still lose money. Knowing your real cost per sale, before you set a price, is one of the first things worth working out." }],
    ['habit', 'move-task', "Move one venture task forward", { why: "Ventures are built in small, steady steps." }],
    ['step', 'people-pay', "Think of something you could make or do that people would pay for", { bands: KID, featured: true,
      why: "That's how every business begins." }],
    ['step', 'three-people', "Talk to three people who have the problem you want to solve", { bands: TU, featured: true, handler: 'task',
      personas: ['ENTREPRENEUR', 'BUSINESS'],
      why: "Three conversations will tell you more than a month of planning." }],
  ]),

  /* ─── SPIRITUAL ────────────────────────────────────────────────────────── */

  ...S('PurposeValuesScreen', 'purpose', [
    ['quick', 'three-matter', "Write down three things that matter most to you", { featured: true,
      why: "Naming them is the first step to living by them." }],
    ['learn', 'compass', "Values are a compass, not a destination", {
      body: "A goal is something you finish, like passing a test. A value is a direction you keep choosing, like being kind, curious or brave. You never 'complete' it. When you know your values, hard choices get easier: you ask which option looks more like the person you want to be. And on days a goal goes wrong, you can still live a value." }],
    ['habit', 'live-value', "Do one thing that matches my values", { why: "Values show up in actions, not intentions." }],
    ['step', 'top-value', "Pick your top value and one way to live it this week", { featured: true, handler: 'task',
      why: "A value with a plan becomes a habit." }],
    ['step', 'mission', "Write your personal mission in one sentence", { bands: YU,
      why: "Short enough to remember, clear enough to decide with." }],
  ]),

  ...S('ReflectionPrayerScreen', 'reflect', [
    ['quick', 'quiet-minute', "Take one quiet minute to reflect, pray or breathe", { featured: true, handler: 'timer', payload: { minutes: 1 },
      why: "One minute of stillness resets more than you'd expect." }],
    ['quick', 'grateful', "Write down one thing you're grateful for", {
      why: "Specific gratitude beats general. Name the thing." }],
    ['learn', 'why-reflect', "Why reflection helps", {
      body: "Taking a few quiet minutes to look back on your day, through prayer, meditation, journaling or just sitting still, helps you notice what went well, what you'd do differently, and what you care about. People of many faiths, and of none, have practiced some form of this for thousands of years. It works best as a small daily habit rather than a big occasional one." }],
    ['habit', 'reflect-daily', "Reflect, pray or meditate today", { why: "Whatever form fits you. Daily is what matters." }],
    ['step', 'went-well', "Answer tonight: what went well today, and why?", { featured: true,
      why: "The 'why' is the part that teaches you something." }],
  ]),

  ...S('PhilosophyWisdomScreen', 'wisdom', [
    ['quick', 'quote', "Read one short quote and decide if you agree", { featured: true,
      why: "Disagreeing with a thinker is still thinking." }],
    ['learn', 'big-questions', "Big questions are allowed", { bands: KID,
      body: "Why are we here? What makes something fair? Is it ever OK to break a rule? These are philosophy questions, and you're never too young to wonder about them. Philosophers don't just find answers. They practice asking good questions, listening to different views, and changing their mind when there's a better reason. You can do that too, starting with any question that makes you curious." }],
    ['learn', 'control', "What's in your control, and what isn't", { bands: TU,
      body: "The Stoic philosopher Epictetus, who began life enslaved, taught one idea that still helps people today: split what's in your control from what isn't. Your effort, your words and how you respond are yours. Other people's opinions, the weather and the past are not. Putting your energy only into the first list is a surprisingly powerful way to worry less." }],
    ['habit', 'big-question', "Think about one big question", { why: "Five minutes of real thinking, no phone." }],
    ['step', 'hard-lesson', "Write down one lesson you learned the hard way", { featured: true,
      why: "Your own experience is wisdom too. Write it down so you keep it." }],
    ['step', 'classic', "Read one chapter of a philosophy classic", { bands: TU, handler: 'link',
      payload: { url: 'https://www.gutenberg.org/ebooks/2680' },
      why: "Marcus Aurelius wrote Meditations as a private notebook. It's free." }],
  ]),

  ...S('CommunityFaithScreen', 'faith', [
    ['quick', 'kind-thing', "Do one small kind thing for someone today", { featured: true,
      why: "Small kindnesses ripple further than you'll see." }],
    ['learn', 'helping-helps', "Helping others helps you too", {
      body: "Volunteering and small acts of kindness are good for the people you help, and research keeps finding they're good for the helper too, linked to better mood and a stronger sense of purpose. It doesn't have to be big or organized. Helping a neighbor, joining a service day with your school or faith community, or checking on someone who's alone all count." }],
    ['habit', 'kind-helpful', "Do something kind or helpful", { why: "One a day. They add up." }],
    ['step', 'help-unasked', "Help out at home or school without being asked", { bands: KID, featured: true,
      why: "Noticing what needs doing is a superpower." }],
    ['step', 'volunteer', "Find one volunteer opportunity near you", { bands: TU, featured: true, handler: 'task',
      why: "Giving an afternoon connects you to people and to purpose." }],
    ['step', 'show-up', "If you're part of a faith or community group, plan to show up this week", { handler: 'task',
      why: "Belonging grows from showing up regularly." }],
  ]),

  /* ─── DIGITAL ──────────────────────────────────────────────────────────── */

  ...S('PrivacyScreen', 'privacy', [
    ['quick', 'private', "Check that your accounts are set to private", { featured: true,
      why: "Public by default is common. Private by choice is safer." }],
    ['quick', 'location-off', "Turn off location for one app that doesn't need it", {
      why: "Many apps ask for location they don't need to work." }],
    ['learn', 'never-share', "Never share these online", { bands: KT,
      body: "Some things should stay offline: your full name together with your school, your home address, your phone number, passwords, and photos that show where you are right now. People online aren't always who they say they are. If someone you only know online asks for personal information, photos, or to keep a secret, stop talking to them and tell a trusted adult." }],
    ['learn', 'data-product', "When it's free, your data often pays", { bands: TU,
      body: "When an app or site is free, it often makes money from what it learns about you, like what you click, where you go and who you talk to, usually to sell ads. That's not always bad, but it's worth knowing. Checking privacy settings, turning off location for apps that don't need it, and thinking twice before sharing personal details keeps more of your life yours." }],
    ['habit', 'think-share', "Think before I share", { why: "Once it's online, it's hard to take back." }],
    ['step', 'breach', "Check if your email has been in a data breach", { bands: TU, featured: true, handler: 'link',
      payload: { url: 'https://haveibeenpwned.com' },
      why: "If it has, change that password anywhere you reused it." }],
    ['step', 'location-review', "Review which apps can see your location", { handler: 'done',
      why: "Settings, then Privacy, then Location. Two minutes, big difference." }],
  ]),

  ...S('SecurityScreen', 'security', [
    ['quick', 'update-now', "Update your phone or computer now", { featured: true,
      why: "Updates fix security holes attackers already know about." }],
    ['learn', 'passwords-secret', "Keep passwords secret, even from friends", { bands: KID,
      body: "Your password is like the key to your house. You wouldn't hand copies to friends, even best friends. Friendships change, and someone with your password can post as you or read your messages. The only people who should know your passwords are you and a parent or guardian who helps keep you safe online." }],
    ['learn', 'strong-password', "What makes a strong password", { bands: TU,
      body: "Length beats complexity. A long passphrase made of four or more random words is easier to remember and harder to crack than a short jumble like 'P@ss1'. The most important rule is never reusing a password: when one site gets breached, attackers try that same password everywhere else. A password manager remembers them all so you don't have to." }],
    ['learn', 'two-step', "Two-step login stops most account takeovers", { bands: TU,
      body: "Two-factor authentication means logging in needs something you know, your password, and something you have, like your phone or a security key. Even if your password leaks, someone without your phone can't get in. An authenticator app is safer than text-message codes, but any second step is far better than none. Email is the place to start, since it can reset everything else." }],
    ['habit', 'lock-devices', "Lock my devices when I step away", { why: "An unlocked phone is an open door." }],
    ['step', 'enable-2fa', "Turn on two-step login for your email", { bands: TU, featured: true,
      why: "Your email can reset every other account you have." }],
    ['step', 'password-manager', "Set up a password manager", { bands: YU, handler: 'link',
      payload: { url: 'https://bitwarden.com' },
      why: "Free options exist. One strong password protects all the others." }],
  ]),

  ...S('ScreenTimeFocusScreen', 'focus', [
    ['quick', 'phone-away-30', "Put your phone in another room for 30 minutes", { featured: true, handler: 'timer', payload: { minutes: 30 },
      why: "Out of sight really is out of mind." }],
    ['quick', 'notif-off', "Turn off notifications for one app", {
      why: "Most notifications are there for the app's benefit, not yours." }],
    ['learn', 'notifications', "Why notifications break focus", {
      body: "Every buzz or banner pulls your attention away, and getting back into deep focus can take several minutes, not seconds. Many apps are designed to keep you checking, with streaks, endless feeds and red badges. Turning off notifications you don't need, and putting your phone out of sight while you work or study, is one of the easiest ways to get more done in less time." }],
    ['habit', 'phone-free', "Phone-free while working or studying", { why: "Focus is a skill. Every session strengthens it." }],
    ['step', 'check-screen-time', "Check your screen time for last week", { featured: true,
      why: "Most people are surprised. The number is where change starts." }],
    ['step', 'media-plan', "Make a family media plan together", { bands: KT, handler: 'link',
      payload: { url: 'https://www.healthychildren.org/English/fmp/Pages/MediaPlan.aspx' },
      why: "Rules everyone agrees on are easier to keep." }],
  ]),

  ...S('ToolsSystemsScreen', 'tools', [
    ['quick', 'delete-five', "Delete five apps or files you don't use", { featured: true,
      why: "Less clutter, less distraction, more space." }],
    ['quick', 'capture-all', "Capture everything on your mind right now", { handler: 'screen',
      payload: { screen: 'CaptureInbox' },
      why: "Two minutes emptying your head, then decide what matters." }],
    ['learn', 'out-of-head', "Get it out of your head", {
      body: "Your brain is great at having ideas and bad at holding reminders. Every to-do you're trying to remember takes up attention. Writing things down in one trusted place, a notes app, a planner, or the Capture button in this app, frees your mind to focus on what you're doing now. The trick is having just one place, and checking it." }],
    ['habit', 'one-place', "Capture ideas and to-dos in one place", { why: "One inbox beats five sticky notes." }],
    ['step', 'school-folders', "Organize your schoolwork into folders", { bands: KT, featured: true,
      why: "Finding things fast means less stress before a deadline." }],
    ['step', 'automate', "Automate one thing you do every week", { bands: YU, featured: true, handler: 'task',
      why: "A bill on autopay or a recurring reminder is time back, forever." }],
  ]),
];

/* ══════════════════════════════════════════════════════════════════════════
   RESOURCES — for going deeper. Free and non-commercial first.
   verify with: node scripts/gen-life-area-seed.mjs --check-links
   ══════════════════════════════════════════════════════════════════════════ */

export const AREA_RESOURCES = [

  ...R('ExerciseScreen', 'fit', [
    ['move-your-way', "Move Your Way", 'https://odphp.health.gov/moveyourway', { source: 'US Dept. of Health', desc: "How much activity you need, by age, with ideas to fit it in." }],
    ['cdc-activity', "CDC: Physical Activity Guidelines", 'https://www.cdc.gov/physical-activity-basics/guidelines/index.html', { source: 'CDC', desc: "Official guidelines for kids, teens and adults.", bands: TU }],
    ['couch-5k', "NHS Couch to 5K", 'https://www.nhs.uk/live-well/exercise/running-and-aerobic-exercises/get-running-with-couch-to-5k/', { source: 'NHS', kind: 'course', desc: "A free 9-week plan from not running to running 5K.", bands: TU }],
  ]),

  ...R('NutritionScreen', 'food', [
    ['myplate', "MyPlate", 'https://www.myplate.gov', { source: 'USDA', desc: "Build a balanced plate, with guides for every age." }],
    ['nutrition-source', "The Nutrition Source", 'https://nutritionsource.hsph.harvard.edu', { source: 'Harvard T.H. Chan School of Public Health', kind: 'article', desc: "Research-backed answers on food and health.", bands: TU }],
    ['kidshealth-food', "KidsHealth: Food & Fitness", 'https://kidshealth.org/en/kids/center/fitness-nutrition-center.html', { source: 'Nemours', kind: 'article', desc: "Eating well, explained for kids.", bands: KID }],
  ]),

  ...R('SleepRecoveryScreen', 'sleep', [
    ['sleep-foundation', "Sleep Foundation", 'https://www.sleepfoundation.org', { source: 'Sleep Foundation', kind: 'article', desc: "Sleep science and practical tips, reviewed by doctors." }],
    ['cdc-sleep', "CDC: Sleep", 'https://www.cdc.gov/sleep/index.html', { source: 'CDC', desc: "How much sleep each age needs, and why it matters." }],
    ['teens-sleep', "KidsHealth: Common Sleep Problems", 'https://kidshealth.org/en/teens/sleep.html', { source: 'Nemours', kind: 'article', desc: "Why teens struggle to sleep and what helps.", bands: TEEN }],
  ]),

  ...R('EnergyVitalityScreen', 'energy', [
    ['myhealthfinder', "MyHealthfinder", 'https://odphp.health.gov/myhealthfinder', { source: 'US Dept. of Health', kind: 'tool', desc: "Which check-ups and screenings are recommended for you.", bands: YU }],
    ['medlineplus', "MedlinePlus", 'https://medlineplus.gov', { source: 'National Library of Medicine', kind: 'article', desc: "Trusted health information, without the ads.", bands: TU }],
    ['kidshealth-caffeine', "KidsHealth: Caffeine", 'https://kidshealth.org/en/teens/caffeine.html', { source: 'Nemours', kind: 'article', desc: "What caffeine does and how much is too much.", bands: KT }],
  ]),

  ...R('WellbeingScreen', 'mood', [
    ['kidshealth-feelings', "KidsHealth: Feelings", 'https://kidshealth.org/en/kids/feeling/', { source: 'Nemours', kind: 'article', desc: "Understanding big feelings, for kids.", bands: KID }],
    ['greater-good', "Greater Good Science Center", 'https://greatergood.berkeley.edu', { source: 'UC Berkeley', kind: 'article', desc: "The science of a meaningful, happy life.", bands: TU }],
    ['nimh-caring', "Caring for Your Mental Health", 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health', { source: 'National Institute of Mental Health', desc: "Everyday ways to look after your mind.", bands: TU }],
  ]),

  ...R('StressAnxietyScreen', 'stress', [
    ['nimh-anxiety', "Anxiety Disorders", 'https://www.nimh.nih.gov/health/topics/anxiety-disorders', { source: 'National Institute of Mental Health', desc: "Signs, causes and treatments that work.", bands: TU }],
    ['adaa', "Anxiety & Depression Association of America", 'https://adaa.org', { source: 'ADAA', desc: "Self-help tools and ways to find support.", bands: TU }],
    ['kidshealth-stress', "KidsHealth: Stress", 'https://kidshealth.org/en/kids/stress.html', { source: 'Nemours', kind: 'article', desc: "What stress is and how to handle it, for kids.", bands: KID }],
  ]),

  ...R('SelfCareScreen', 'mind', [
    ['ucla-meditations', "UCLA Mindful: Guided Meditations", 'https://www.uclahealth.org/uclamindful/guided-meditations', { source: 'UCLA Health', kind: 'tool', desc: "Free guided meditations, from 3 minutes up." }],
    ['ggia', "Greater Good in Action", 'https://ggia.berkeley.edu', { source: 'UC Berkeley', kind: 'tool', desc: "Short, research-tested practices for calm and focus.", bands: TU }],
  ]),

  ...R('TherapySupportScreen', 'support', [
    ['988', "988 Suicide & Crisis Lifeline", 'https://988lifeline.org', { source: '988 Lifeline', kind: 'hotline', desc: "Call or text 988, any time. Free and confidential (US)." }],
    ['crisis-text', "Crisis Text Line", 'https://www.crisistextline.org', { source: 'Crisis Text Line', kind: 'hotline', desc: "Text HOME to 741741 to reach a trained volunteer (US)." }],
    ['find-helpline', "Find A Helpline", 'https://findahelpline.com', { source: 'ThroughLine', kind: 'hotline', desc: "Free, confidential helplines in your country." }],
    ['teen-line', "Teen Line", 'https://teenline.org', { source: 'Teen Line', kind: 'hotline', desc: "Teens talking with trained teens.", bands: TEEN }],
    ['samhsa', "SAMHSA National Helpline", 'https://www.samhsa.gov/find-help/helplines/national-helpline', { source: 'SAMHSA', kind: 'hotline', desc: "Free referrals for mental health and substance use, 24/7.", bands: YU }],
    ['find-therapist', "Find a Therapist", 'https://www.psychologytoday.com/us/therapists', { source: 'Psychology Today', kind: 'tool', desc: "Search therapists by location, issue and insurance.", bands: YU }],
  ]),

  ...R('RelationshipsScreen', 'rel', [
    ['kidshealth-bullies', "KidsHealth: Dealing With Bullies", 'https://kidshealth.org/en/kids/bullies.html', { source: 'Nemours', kind: 'article', desc: "What to do about bullying, and how friends can help.", bands: KID }],
    ['loveisrespect', "love is respect", 'https://www.loveisrespect.org', { source: 'love is respect', kind: 'hotline', desc: "Healthy relationships, and support if one isn't. Text LOVEIS to 22522.", bands: TU }],
    ['gottman', "The Gottman Institute Blog", 'https://www.gottman.com/blog/', { source: 'The Gottman Institute', kind: 'article', desc: "Research on what makes relationships last.", bands: YU }],
  ]),

  ...R('NetworkScreen', 'net', [
    ['volunteermatch', "VolunteerMatch", 'https://www.volunteermatch.org', { source: 'VolunteerMatch', kind: 'tool', desc: "Find volunteer opportunities near you or online.", bands: TU }],
    ['idealist', "Idealist", 'https://www.idealist.org', { source: 'Idealist', kind: 'tool', desc: "Volunteer roles, internships and jobs with nonprofits.", bands: YU }],
  ]),

  ...R('CommunicationScreen', 'talk', [
    ['active-listening', "Active Listening Practice", 'https://ggia.berkeley.edu/practice/active_listening', { source: 'UC Berkeley', kind: 'guide', desc: "A step-by-step practice for listening well.", bands: TU }],
    ['cnvc', "Center for Nonviolent Communication", 'https://www.cnvc.org', { source: 'CNVC', kind: 'article', desc: "The method behind 'I feel' conversations.", bands: YU }],
    ['kidshealth-talk', "KidsHealth: Talking to Your Parents", 'https://kidshealth.org/en/teens/talk-to-parents.html', { source: 'Nemours', kind: 'article', desc: "How to start the conversations that feel hard.", bands: KT }],
  ]),

  ...R('SocialHealthScreen', 'socialh', [
    ['sg-advisory', "Our Epidemic of Loneliness and Isolation", 'https://www.hhs.gov/sites/default/files/surgeon-general-social-connection-advisory.pdf', { source: 'US Surgeon General', kind: 'article', desc: "Why connection matters for health, and what helps.", bands: YU }],
    ['social-connection', "Foundation for Social Connection", 'https://www.social-connection.org', { source: 'Foundation for Social Connection', kind: 'article', desc: "Research and tools for building connection.", bands: YU }],
    ['kidshealth-lonely-kids', "KidsHealth: What to Do When You Feel Lonely", 'https://kidshealth.org/en/kids/feel-lonely.html', { source: 'Nemours', kind: 'article', desc: "Small steps that help when you feel left out.", bands: KID }],
    ['kidshealth-lonely-teens', "KidsHealth: Loneliness", 'https://kidshealth.org/en/teens/lonely.html', { source: 'Nemours', kind: 'article', desc: "Why loneliness happens and how to ease it.", bands: TEEN }],
  ]),

  ...R('IncomeEarningsScreen', 'income', [
    ['money-as-you-grow', "Money as You Grow", 'https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/', { source: 'CFPB', desc: "Money lessons and activities by age.", bands: KT }],
    ['ngpf', "Next Gen Personal Finance", 'https://www.ngpf.org', { source: 'NGPF', kind: 'course', desc: "Free personal finance lessons built for students.", bands: ['teen', 'young_adult'] }],
    ['mymoney', "MyMoney.gov", 'https://www.mymoney.gov', { source: 'US Treasury', desc: "The basics of earning, saving and spending.", bands: YU }],
  ]),

  ...R('BudgetSpendingScreen', 'budget', [
    ['khan-pf', "Khan Academy: Personal Finance", 'https://www.khanacademy.org/college-careers-more/personal-finance', { source: 'Khan Academy', kind: 'course', desc: "Free lessons on budgeting, saving and credit.", bands: TU }],
    ['ymyg', "Your Money, Your Goals", 'https://www.consumerfinance.gov/consumer-tools/educator-tools/your-money-your-goals/', { source: 'CFPB', kind: 'tool', desc: "Free worksheets for tracking spending and bills.", bands: YU }],
    ['maygrow-budget', "Money as You Grow", 'https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/', { source: 'CFPB', desc: "Needs, wants and first money choices.", bands: KID }],
  ]),

  ...R('SavingsInvestingScreen', 'save', [
    ['compound-calc', "Compound Interest Calculator", 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator', { source: 'SEC / Investor.gov', kind: 'tool', desc: "See how savings grow over time.", bands: TU }],
    ['intro-investing', "Introduction to Investing", 'https://www.investor.gov/introduction-investing', { source: 'SEC / Investor.gov', desc: "Official, unbiased investing basics. Nothing to sell you.", bands: YU }],
    ['fdic', "Understanding Deposit Insurance", 'https://www.fdic.gov/resources/deposit-insurance/understanding-deposit-insurance', { source: 'FDIC', desc: "What's protected in a bank account, and what isn't.", bands: YU }],
    ['maygrow-save', "Money as You Grow", 'https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/', { source: 'CFPB', desc: "Saving activities for kids.", bands: KID }],
  ]),

  ...R('DebtCreditScreen', 'debt', [
    ['annual-report', "AnnualCreditReport.com", 'https://www.annualcreditreport.com', { source: 'Equifax, Experian & TransUnion', kind: 'tool', desc: "The only official site for free credit reports.", bands: YU }],
    ['cfpb-credit', "Credit Reports and Scores", 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/', { source: 'CFPB', desc: "How credit works, and how to fix report errors.", bands: TU }],
    ['maygrow-debt', "Money as You Grow", 'https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/', { source: 'CFPB', desc: "Borrowing and paying back, explained for kids.", bands: KID }],
  ]),

  ...R('HobbiesScreen', 'hobby', [
    ['instructables', "Instructables", 'https://www.instructables.com', { source: 'Instructables', kind: 'guide', desc: "Step-by-step projects for almost anything." }],
    ['libby', "Libby", 'https://libbyapp.com', { source: 'OverDrive', kind: 'tool', desc: "Free ebooks and audiobooks with a library card." }],
  ]),

  ...R('ArtMusicScreen', 'art', [
    ['music-lab', "Chrome Music Lab", 'https://musiclab.chromeexperiments.com', { source: 'Google', kind: 'tool', desc: "Play with rhythm, melody and sound. No sign-up." }],
    ['musictheory', "musictheory.net", 'https://www.musictheory.net', { source: 'musictheory.net', kind: 'course', desc: "Free lessons and ear-training exercises.", bands: TU }],
    ['drawabox', "Drawabox", 'https://drawabox.com', { source: 'Drawabox', kind: 'course', desc: "A free, structured course in drawing fundamentals.", bands: TU }],
  ]),

  ...R('ContentMediaScreen', 'media', [
    ['digital-citizenship', "Digital Citizenship", 'https://www.commonsense.org/education/digital-citizenship', { source: 'Common Sense Education', kind: 'course', desc: "Staying safe and kind while creating online.", bands: KT }],
    ['canva-school', "Canva Design School", 'https://www.canva.com/designschool/', { source: 'Canva', kind: 'course', cost: 'freemium', desc: "Free lessons on layout, color and type.", bands: TU }],
    ['yt-creators', "YouTube Creators", 'https://www.youtube.com/creators/', { source: 'YouTube', kind: 'guide', desc: "How to plan, make and grow a channel.", bands: YU }],
  ]),

  ...R('LearningCuriosityScreen', 'curious', [
    ['space-place', "NASA Space Place", 'https://spaceplace.nasa.gov', { source: 'NASA', kind: 'article', desc: "Space and Earth science games and explainers.", bands: KID }],
    ['crash-course', "Crash Course", 'https://thecrashcourse.com', { source: 'Crash Course', kind: 'video', desc: "Fast, fun video courses on dozens of subjects.", bands: TU }],
    ['gutenberg', "Project Gutenberg", 'https://www.gutenberg.org', { source: 'Project Gutenberg', kind: 'book', desc: "Over 70,000 free classic books." }],
  ]),

  ...R('CareerExplorationScreen', 'career', [
    ['bls-k12', "Career Exploration for Students", 'https://www.bls.gov/k12/', { source: 'Bureau of Labor Statistics', kind: 'guide', desc: "What people do at work, sorted by what you like.", bands: KID }],
    ['mynextmove', "My Next Move", 'https://www.mynextmove.org', { source: 'US Dept. of Labor', kind: 'tool', desc: "Find careers from your interests.", bands: TU }],
    ['ooh', "Occupational Outlook Handbook", 'https://www.bls.gov/ooh/', { source: 'Bureau of Labor Statistics', desc: "What a job involves, training needed, and outlook.", bands: TU }],
    ['careeronestop', "CareerOneStop", 'https://www.careeronestop.org', { source: 'US Dept. of Labor', kind: 'tool', desc: "Training, job search and local help.", bands: YU }],
  ]),

  ...R('ResearchScreen', 'skills', [
    ['khan', "Khan Academy", 'https://www.khanacademy.org', { source: 'Khan Academy', kind: 'course', desc: "Free lessons from basic math to college level." }],
    ['learning-scientists', "The Learning Scientists", 'https://www.learningscientists.org', { source: 'The Learning Scientists', kind: 'guide', desc: "Six study strategies backed by research.", bands: TU }],
    ['freecodecamp', "freeCodeCamp", 'https://www.freecodecamp.org', { source: 'freeCodeCamp', kind: 'course', desc: "Learn to code for free, with certifications.", bands: TU }],
    ['mit-ocw', "MIT OpenCourseWare", 'https://ocw.mit.edu', { source: 'MIT', kind: 'course', desc: "Free materials from thousands of MIT courses.", bands: YU }],
  ]),

  ...R('ProjectsScreen', 'projects', [
    ['scratch', "Scratch", 'https://scratch.mit.edu', { source: 'MIT', kind: 'tool', desc: "Make your own games and animations.", bands: KT }],
    ['team-playbook', "Team Playbook", 'https://www.atlassian.com/team-playbook', { source: 'Atlassian', kind: 'guide', desc: "Free exercises for planning and running projects.", bands: YU }],
  ]),

  ...R('BusinessVenturesScreen', 'venture', [
    ['ja', "Junior Achievement", 'https://jausa.ja.org', { source: 'Junior Achievement USA', kind: 'course', desc: "Entrepreneurship and money programs for students.", bands: KT }],
    ['sba-guide', "SBA Business Guide", 'https://www.sba.gov/business-guide', { source: 'US Small Business Administration', desc: "Plan, launch and manage a business, step by step.", bands: YU }],
    ['score', "SCORE", 'https://www.score.org', { source: 'SCORE', kind: 'tool', desc: "Free mentoring from experienced business owners.", bands: YU }],
  ]),

  ...R('PurposeValuesScreen', 'purpose', [
    ['via', "VIA Character Strengths Survey", 'https://www.viacharacter.org', { source: 'VIA Institute on Character', kind: 'tool', desc: "Find your top strengths. Free, with a youth version." }],
    ['gg-purpose', "Greater Good: Purpose", 'https://greatergood.berkeley.edu/topic/purpose', { source: 'UC Berkeley', kind: 'article', desc: "What research says about finding purpose.", bands: TU }],
  ]),

  ...R('ReflectionPrayerScreen', 'reflect', [
    ['three-good-things', "Three Good Things", 'https://ggia.berkeley.edu/practice/three-good-things', { source: 'UC Berkeley', kind: 'guide', desc: "A short nightly reflection practice." }],
    ['ucla-reflect', "UCLA Mindful: Guided Meditations", 'https://www.uclahealth.org/uclamindful/guided-meditations', { source: 'UCLA Health', kind: 'tool', desc: "Free guided sessions for quiet reflection." }],
  ]),

  ...R('PhilosophyWisdomScreen', 'wisdom', [
    ['crash-philosophy', "Crash Course Philosophy", 'https://thecrashcourse.com/courses/philosophy/', { source: 'Crash Course', kind: 'video', desc: "Short, free videos on the big questions.", bands: TU }],
    ['meditations', "Meditations, by Marcus Aurelius", 'https://www.gutenberg.org/ebooks/2680', { source: 'Project Gutenberg', kind: 'book', desc: "A Roman emperor's private notebook. Free.", bands: TU }],
    ['sep', "Stanford Encyclopedia of Philosophy", 'https://plato.stanford.edu', { source: 'Stanford University', kind: 'article', desc: "Deep, free, expert entries on every major idea.", bands: YU }],
  ]),

  ...R('CommunityFaithScreen', 'faith', [
    ['rak', "Random Acts of Kindness Foundation", 'https://www.randomactsofkindness.org', { source: 'RAK Foundation', kind: 'guide', desc: "Kindness ideas for home, school and work." }],
    ['volunteermatch-faith', "VolunteerMatch", 'https://www.volunteermatch.org', { source: 'VolunteerMatch', kind: 'tool', desc: "Find ways to serve near you.", bands: TU }],
  ]),

  ...R('PrivacyScreen', 'privacy', [
    ['be-internet-awesome', "Be Internet Awesome", 'https://beinternetawesome.withgoogle.com', { source: 'Google', kind: 'course', desc: "Online safety games and lessons for kids.", bands: KT }],
    ['hibp', "Have I Been Pwned", 'https://haveibeenpwned.com', { source: 'Troy Hunt', kind: 'tool', desc: "Check if your email was in a data breach.", bands: TU }],
    ['eff-ssd', "Surveillance Self-Defense", 'https://ssd.eff.org', { source: 'EFF', kind: 'guide', desc: "Practical privacy guides from a digital-rights nonprofit.", bands: YU }],
    ['ftc-online', "Identity Theft & Online Security", 'https://consumer.ftc.gov/identity-theft-and-online-security', { source: 'FTC', desc: "Protect your identity and spot scams.", bands: YU }],
  ]),

  ...R('SecurityScreen', 'security', [
    ['cisa', "Secure Our World", 'https://www.cisa.gov/secure-our-world', { source: 'CISA', desc: "Four simple steps to stay safe online." }],
    ['bitwarden', "Bitwarden", 'https://bitwarden.com', { source: 'Bitwarden', kind: 'tool', cost: 'freemium', desc: "An open-source password manager with a free plan.", bands: TU }],
  ]),

  ...R('ScreenTimeFocusScreen', 'focus', [
    ['media-plan', "Family Media Plan", 'https://www.healthychildren.org/English/fmp/Pages/MediaPlan.aspx', { source: 'American Academy of Pediatrics', kind: 'tool', desc: "Build screen-time rules together as a family.", bands: KT }],
    ['digital-wellbeing', "Digital Wellbeing", 'https://wellbeing.google', { source: 'Google', kind: 'guide', desc: "Tools and tips for a healthier relationship with tech." }],
    ['humane-tech', "Center for Humane Technology", 'https://www.humanetech.com', { source: 'Center for Humane Technology', kind: 'article', desc: "How apps are designed to hold attention.", bands: TU }],
  ]),

  ...R('ToolsSystemsScreen', 'tools', [
    ['applied-digital', "Applied Digital Skills", 'https://applieddigitalskills.withgoogle.com', { source: 'Google', kind: 'course', desc: "Free lessons on everyday digital tools.", bands: TU }],
    ['missing-semester', "The Missing Semester", 'https://missing.csail.mit.edu', { source: 'MIT', kind: 'course', desc: "The computer skills school never teaches.", bands: YU }],
  ]),
];
