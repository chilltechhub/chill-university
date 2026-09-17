// src/data/competencyTests.js
// The test-out banks — one per `testable` feature in featureCatalog.js.
//
// The deal, and it is deliberately a hard one: ONE attempt. Pass and the
// feature opens now, no objective required. Fail and the test route closes
// on that feature permanently — the objective path becomes the only way in.
//
// That asymmetry is the feature. A retryable quiz is a lock that opens to
// patience, which is the grind it was meant to skip. One attempt makes it a
// real claim: "I already know this." Which is why:
//
//   - every question is about judgement, not recall. Nothing here can be
//     answered by having read the screen's help text;
//   - `explain` is shown after the attempt either way. Failing should teach
//     you the thing, not just close a door;
//   - the pass mark is high (all but one). Scraping through on a coin flip
//     would make the unlock meaningless in both directions.
//
// Server side, public.record_test_attempt() (see the 20260915 migration)
// applies passMark and enforces the one-attempt rule against the unique
// index, so this file being client-side data doesn't make the rule optional.
//
// Shape:
//   { featureId, title, intro, passMark, questions: [
//       { id, prompt, options: [string], answer: index, explain }
//   ]}

const TESTS = {
  portfolio: {
    featureId: 'portfolio',
    title: 'Portfolio readiness',
    intro: 'Four questions about what belongs in a portfolio and what quietly ruins one.',
    passMark: 3,
    questions: [
      {
        id: 'q1',
        prompt: 'You have six projects: four half-finished, two shipped. What goes in?',
        options: [
          'All six — it shows range',
          'The two shipped ones',
          'The four in progress, since they show current work',
          'Whichever two look most impressive in a screenshot',
        ],
        answer: 1,
        explain: 'A portfolio is evidence of finishing. Work in progress is a promise; shipped work is a fact.',
      },
      {
        id: 'q2',
        prompt: 'What makes an entry useful to somebody reading it cold?',
        options: [
          'A long description of every technical decision',
          'The title and a screenshot',
          'What the problem was, what you did, and what came of it',
          'The list of tools you used',
        ],
        answer: 2,
        explain: 'Problem, action, outcome. Tools are trivia; outcomes are why anyone is reading.',
      },
      {
        id: 'q3',
        prompt: 'A project failed. It went nowhere and you stopped. Does it belong?',
        options: [
          'Never — a portfolio is for wins',
          'Yes, if you can say concretely what you learned and changed after it',
          'Yes, always. Honesty is the point',
          'Only if nobody else saw it fail',
        ],
        answer: 1,
        explain: 'A failure with a specific lesson attached is evidence of judgement. A failure listed bare is just noise.',
      },
      {
        id: 'q4',
        prompt: 'How often is it worth pruning?',
        options: [
          'Never — remove nothing, it is a record',
          'Every time you add something, cut the weakest entry',
          'Once a year, regardless',
          'Only when someone complains it is too long',
        ],
        answer: 1,
        explain: 'A portfolio is judged by its weakest entry, not its best. Adding without cutting is how it gets worse as it grows.',
      },
    ],
  },

  'career-map': {
    featureId: 'career-map',
    title: 'Career navigation',
    intro: 'Four questions about aiming at something rather than browsing.',
    passMark: 3,
    questions: [
      {
        id: 'q1',
        prompt: 'Which of these is an actual career target?',
        options: [
          '"Something in tech"',
          '"A better job"',
          '"Junior data analyst at a mid-size company, within a year"',
          '"More money"',
        ],
        answer: 2,
        explain: 'A target names a role, a rough context and a horizon. Everything else is a mood.',
      },
      {
        id: 'q2',
        prompt: 'You want a role you are not qualified for yet. First move?',
        options: [
          'Apply anyway and see what happens',
          'Find what the role actually requires, and build one piece of evidence for the biggest gap',
          'Take a general course in the field',
          'Wait until you are qualified',
        ],
        answer: 1,
        explain: 'Gap, then evidence for the gap. General courses are the comfortable move because they postpone finding out what is missing.',
      },
      {
        id: 'q3',
        prompt: 'What does exploring ten career paths at once usually produce?',
        options: [
          'A well-informed decision',
          'Nothing, plus the feeling of having worked',
          'A ranked shortlist',
          'Useful breadth for interviews',
        ],
        answer: 1,
        explain: 'Open-ended exploring feels productive and commits to nothing. Two or three, seriously, beats ten browsed.',
      },
      {
        id: 'q4',
        prompt: 'The most reliable evidence you could do a job is:',
        options: [
          'A certificate in the subject',
          'Having read widely about the field',
          'Something you made that resembles the work',
          'A confident interview answer',
        ],
        answer: 2,
        explain: 'Artefacts beat claims. A thing that looks like the work is the only one of these the other side can check.',
      },
    ],
  },

  'weekly-review': {
    featureId: 'weekly-review',
    title: 'Reviewing a week',
    intro: 'Four questions about looking back in a way that changes next week.',
    passMark: 3,
    questions: [
      {
        id: 'q1',
        prompt: 'What is a weekly review actually for?',
        options: [
          'Recording what you did',
          'Deciding what to stop, continue and start',
          'Measuring productivity',
          'Keeping a journal',
        ],
        answer: 1,
        explain: 'A review that produces no decision is a diary entry. The output is a changed next week.',
      },
      {
        id: 'q2',
        prompt: 'You planned five things and finished one. The most useful question is:',
        options: [
          'How do I get more disciplined?',
          'Why did I think five was realistic?',
          'Which app would help me do five?',
          'How do I make up the other four next week?',
        ],
        answer: 1,
        explain: 'Repeatedly missing a target usually means the target was wrong, not that you are weak. Fix the estimate first.',
      },
      {
        id: 'q3',
        prompt: 'A goal has sat untouched for four weeks running. Best response?',
        options: [
          'Carry it forward again',
          'Break it into smaller pieces and carry those forward',
          'Drop it, or make it the only thing next week',
          'Move it to a someday list and forget it',
        ],
        answer: 2,
        explain: 'Four weeks of not doing it is data. Either it matters enough to be the only thing, or it does not matter.',
      },
      {
        id: 'q4',
        prompt: 'When is the review most useful?',
        options: [
          'At the same time every week, whether or not the week went well',
          'When you feel you have made enough progress to review',
          'At the end of a month, in one go',
          'Whenever something goes wrong',
        ],
        answer: 0,
        explain: 'The weeks you least want to review are the ones with the most to learn. A fixed slot is what gets you through those.',
      },
    ],
  },

  'work-mode': {
    featureId: 'work-mode',
    title: 'Deep work',
    intro: 'Four questions about focus sessions that actually produce something.',
    passMark: 3,
    questions: [
      {
        id: 'q1',
        prompt: 'Before starting a focus block, the single most important thing is:',
        options: [
          'Clearing all notifications',
          'Knowing exactly what the block is meant to produce',
          'Blocking out a long enough stretch',
          'Having the right music on',
        ],
        answer: 1,
        explain: 'A defined output turns a block into work. Without it you get an hour of tidying with the phone face down.',
      },
      {
        id: 'q2',
        prompt: 'Twenty minutes in you remember an urgent, unrelated task. Do you:',
        options: [
          'Handle it — urgent is urgent',
          'Write it down and keep going',
          'End the session and restart later',
          'Decide the session was a failure',
        ],
        answer: 1,
        explain: 'Capturing it costs five seconds and stops your head chewing on it. Almost nothing is as urgent as it feels mid-session.',
      },
      {
        id: 'q3',
        prompt: 'Which is the better first focus block on a new project?',
        options: [
          'Three hours, to get real momentum',
          'Twenty-five minutes on the smallest concrete piece',
          'An hour of research and planning',
          'However long it takes to finish something',
        ],
        answer: 1,
        explain: 'Long first blocks mostly get abandoned. A small finished piece is the thing that makes a second block happen.',
      },
      {
        id: 'q4',
        prompt: 'A session ends with the goal unfinished. That session was:',
        options: [
          'Wasted',
          'Fine, if you noted exactly where you stopped and what is next',
          'Fine regardless — the time was spent',
          'A sign the goal was too hard',
        ],
        answer: 1,
        explain: 'The cost of deep work is re-entry. A note saying where you were is what makes tomorrow cheap.',
      },
    ],
  },

  'import-hub': {
    featureId: 'import-hub',
    title: 'Bulk import judgement',
    intro: 'Four questions about moving a lot of material without burying yourself.',
    passMark: 3,
    questions: [
      {
        id: 'q1',
        prompt: 'You import 200 bookmarks in one go. What have you produced?',
        options: [
          'A well-stocked library',
          'A 200-item inbox nobody will ever process',
          'A backup',
          'A search index',
        ],
        answer: 1,
        explain: 'Imported is not processed. Anything that lands in an inbox is work you have promised yourself, not work you have done.',
      },
      {
        id: 'q2',
        prompt: 'Best way to import a large archive?',
        options: [
          'All at once, then sort later',
          'In small batches you process before importing the next',
          'Only the newest items',
          'Manually, one at a time',
        ],
        answer: 1,
        explain: 'Batches keep the inbox a queue instead of a landfill. "Sort later" is where archives go to die.',
      },
      {
        id: 'q3',
        prompt: 'An imported item has no obvious home. Right move?',
        options: [
          'Leave it in the inbox until it becomes clear',
          'Create a new folder for it',
          'Archive or delete it — no home usually means no need',
          'File it under Miscellaneous',
        ],
        answer: 2,
        explain: 'Items with no home are almost always items with no use. Keeping them is the expensive option.',
      },
      {
        id: 'q4',
        prompt: 'What should you check before a large import?',
        options: [
          'That you have enough storage',
          'That the source is worth keeping at all',
          'That the format is supported',
          'That it is backed up elsewhere',
        ],
        answer: 1,
        explain: 'The filter belongs before the import, not after. Importing first guarantees you will keep things you would never have chosen.',
      },
    ],
  },

  'lesson-builder': {
    featureId: 'lesson-builder',
    title: 'Planning a lesson',
    intro: 'Four questions about teaching someone else, not studying yourself.',
    passMark: 3,
    questions: [
      {
        id: 'q1',
        prompt: 'A lesson plan should start from:',
        options: [
          'The material you want to cover',
          'What the learner should be able to do afterwards',
          'How long the session is',
          'The activities you enjoy running',
        ],
        answer: 1,
        explain: 'Coverage is a teacher-side metric. What they can do afterwards is the only one that matters.',
      },
      {
        id: 'q2',
        prompt: 'You have 40 minutes and 60 minutes of material. Best response?',
        options: [
          'Talk faster',
          'Cut a third of the material',
          'Run over',
          'Set the rest as homework',
        ],
        answer: 1,
        explain: 'Rushed material is not taught, it is recited. Cutting is the skill.',
      },
      {
        id: 'q3',
        prompt: 'How do you know mid-lesson whether it is landing?',
        options: [
          'Ask "does that make sense?"',
          'Watch for confused faces',
          'Have them do something small and look at the result',
          'Check at the end with a quiz',
        ],
        answer: 2,
        explain: '"Does that make sense?" reliably returns yes. A small piece of work returns the truth while you can still act on it.',
      },
      {
        id: 'q4',
        prompt: 'Best use of the last five minutes?',
        options: [
          'One more example',
          'Having them say or write what they took from it',
          'Setting homework',
          'Previewing next time',
        ],
        answer: 1,
        explain: 'Retrieval at the end is worth more than another input, and it tells you what to fix before next time.',
      },
    ],
  },

  'savings-investing': {
    featureId: 'savings-investing',
    title: 'Saving and investing basics',
    intro: 'Four questions about the order things go in.',
    passMark: 3,
    questions: [
      {
        id: 'q1',
        prompt: 'What normally comes before investing?',
        options: [
          'A strong month of income',
          'A cash buffer and no high-interest debt',
          'Understanding the market',
          'A brokerage account',
        ],
        answer: 1,
        explain: 'Investing while carrying 20% interest debt is paying to borrow. The buffer is what stops one bad month undoing everything.',
      },
      {
        id: 'q2',
        prompt: 'An emergency fund is best held as:',
        options: [
          'Index funds, so it grows',
          'Cash you can reach in a day or two',
          'Whatever has the highest rate',
          'Spread across several investments',
        ],
        answer: 1,
        explain: 'An emergency fund is judged on availability, not return. Anything that can be down 30% on the day you need it is not one.',
      },
      {
        id: 'q3',
        prompt: 'The most reliable lever on long-term savings is:',
        options: [
          'Picking better investments',
          'Timing when you buy',
          'The share of income you save, kept up over years',
          'Switching to lower-fee products',
        ],
        answer: 2,
        explain: 'Rate and consistency dominate selection over a long horizon. Fees matter, selection matters less than people hope.',
      },
      {
        id: 'q4',
        prompt: '"I will invest whatever is left at the end of the month" usually means:',
        options: [
          'A sensible flexible approach',
          'Nothing gets invested',
          'You invest more in good months',
          'You need to earn more first',
        ],
        answer: 1,
        explain: 'There is never anything left. Moving it first, automatically, is the entire trick.',
      },
    ],
  },

  'debt-credit': {
    featureId: 'debt-credit',
    title: 'Debt and credit',
    intro: 'Four questions about order of attack.',
    passMark: 3,
    questions: [
      {
        id: 'q1',
        prompt: 'Several debts, limited money. Which costs you least overall?',
        options: [
          'Pay the smallest balance first',
          'Pay the highest interest rate first',
          'Split evenly across all of them',
          'Pay the oldest first',
        ],
        answer: 1,
        explain: 'Highest rate first is arithmetically cheapest. Smallest-first is a motivation strategy — a real one, but it costs money.',
      },
      {
        id: 'q2',
        prompt: 'Minimum payments on a credit card mostly cover:',
        options: [
          'The balance',
          'Interest and a sliver of principal',
          'Fees only',
          'A fixed share of the balance',
        ],
        answer: 1,
        explain: 'Which is why minimums alone can run for a decade on a balance you could clear in two years.',
      },
      {
        id: 'q3',
        prompt: 'What usually damages a credit score most?',
        options: [
          'Checking your own score',
          'Closing an old account',
          'Missed payments',
          'Carrying a small balance',
        ],
        answer: 2,
        explain: 'Payment history dominates. Checking your own score is not a hard inquiry at all.',
      },
      {
        id: 'q4',
        prompt: 'A 0% balance transfer is a good idea when:',
        options: [
          'You need more spending room',
          'You have a concrete plan to clear it before the rate ends',
          'The fee is under 5%',
          'Your current rate is high',
        ],
        answer: 1,
        explain: 'It buys time, nothing else. Without a plan for the window, you arrive at the end owing the same amount at a worse rate.',
      },
    ],
  },
};

export function getTest(featureId) {
  return TESTS[featureId] || null;
}

export function hasTest(featureId) {
  return !!TESTS[featureId];
}

// Grades a { [questionId]: optionIndex } answer map. Returns the tally the
// app sends to public.record_test_attempt(), plus per-question results so
// the review screen can show what was missed and why — shown on a pass and
// a fail alike, since a closed door that taught you nothing is just a wall.
export function gradeTest(featureId, answers = {}) {
  const test = getTest(featureId);
  if (!test) return null;

  const results = test.questions.map(q => {
    const picked = answers[q.id];
    return {
      id: q.id,
      prompt: q.prompt,
      picked: picked ?? null,
      correct: picked === q.answer,
      correctIndex: q.answer,
      correctLabel: q.options[q.answer],
      pickedLabel: picked != null ? q.options[picked] : null,
      explain: q.explain,
    };
  });

  const score = results.filter(r => r.correct).length;
  return {
    featureId,
    score,
    total: test.questions.length,
    passMark: test.passMark,
    passed: score >= test.passMark,
    results,
  };
}

export default TESTS;
