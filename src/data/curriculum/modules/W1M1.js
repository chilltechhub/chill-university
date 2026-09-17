// src/data/curriculum/modules/W1M1.js
// Level W1 · Module 1 — Written Policies & Proper Channels
//
// Same depth template as L1M1: prose sections, key terms, a worked example,
// common mistakes, then a hands-on exercise with numbered steps and the
// Vault artifact it produces. See ModuleScreen.js for how this renders and
// moduleContent.js for the registry it plugs into.

export default {
  id: 'W1M1',
  level: 'W1',
  index: 0,
  title: 'Written Policies & Proper Channels',
  subtitle: 'Module 1',
  objective:
    'Turn "we should have a handbook" into actual written policy, with more than one way for a problem to reach you.',
  duration: '2–3 hours',

  intro: [
    'Every business has policies whether or not anyone wrote them down. The dress code is "whatever the owner said once to one person." The attendance rule is "whatever seemed fair the last time someone was late." That works fine until the day it doesn\'t — a dispute, a complaint, a termination someone thinks was unfair — and suddenly there is no record of what the rule actually was, applied to whom, or when.',
    'This module is about closing that gap. Not by writing a two-hundred-page legal document nobody reads, but by getting the handful of things that actually matter into writing: what the policies are, that at-will employment still applies, that employees acknowledged receiving them, and — just as important — more than one way for a problem to reach someone who can do something about it.',
    'The second half of this module is about that last piece specifically. A complaint process that only runs through one person\'s direct manager breaks exactly when the complaint is about that manager. Getting this right, in writing, before you need it, is what separates a business that handles a problem well from one that discovers the hard way it had no real process at all.',
  ],

  lessons: [
    {
      key: 'w1_handbook',
      title: 'Employee Handbook & Written Policy Fundamentals',
      objective: 'Why a handbook exists, the at-will disclaimer that keeps it from becoming an accidental contract, and the acknowledgment form that makes it defensible.',
      sections: [
        {
          heading: 'Why a Handbook Exists At All',
          body: 'A handbook does two things at once. For employees, it sets expectations and gives them somewhere to point when they\'re unsure — can I take this day off, what happens if I\'m late, who do I tell if something is wrong. For the employer, it\'s a documented, consistent standard that can be shown to have existed and applied to everyone the same way, rather than "whatever the owner remembered saying."\n\nThat second part matters more than most first-time employers expect. In a dispute — a demand letter, an agency complaint, a lawsuit — the question is rarely just "what happened." It\'s "what was the policy, was it written down, and was it applied consistently." A business with no written policy is arguing from memory against a plaintiff\'s attorney with time to build a narrative.',
        },
        {
          heading: 'The At-Will Disclaimer, and Why It\'s There',
          body: 'Most US states default to at-will employment: either the employer or the employee can end the relationship at any time, for any legal reason (or no stated reason), with or without notice. It\'s the baseline that gives a small employer flexibility to make staffing decisions without needing "just cause" for every one.\n\nThe trap is that a handbook can accidentally undo this. A policy that reads like a promise — "employees will receive three warnings before termination" — can be read by a court as an implied contract that limits the employer\'s at-will right, whether or not that was the intent. The standard fix isn\'t to avoid writing real policies. It\'s an explicit disclaimer stating the handbook is a guide, not a contract, and that at-will status remains in effect — paired with actually following whatever process you do commit to, consistently, for everyone.',
        },
        {
          heading: 'The Acknowledgment Form Is the Part That Actually Protects You',
          body: 'A signed (or e-signed) acknowledgment — stating the employee received the handbook, had the opportunity to read it, and understands it — is a small piece of paper that does a disproportionate amount of work later. In a dispute, it\'s frequently the single document that matters most: not because the policy itself proves the employer was right, but because it proves the employee had access to the same information as everyone else, at the time they started.\n\nKeep signed acknowledgments in each employee\'s file, and re-issue one whenever the handbook changes materially. An unsigned handbook that "everyone got a copy of" is much weaker evidence than a dated signature.',
        },
      ],
      keyTerms: [
        { term: 'At-will employment', definition: 'Either party can end the employment relationship at any time, for any legal reason, absent a contract stating otherwise.' },
        { term: 'Implied contract', definition: 'A promise, even an unintentional one in a handbook, that a court can treat as legally binding despite at-will status.' },
        { term: 'Acknowledgment form', definition: 'A signed record that an employee received and had the opportunity to read the handbook.' },
        { term: 'Policy manual', definition: 'The written set of rules and expectations — distinct from an individual employment contract.' },
      ],
      example: {
        title: 'Worked example — a disclaimer done right versus done wrong',
        body: 'Version A: "Employees who violate policy will receive a verbal warning, then a written warning, then termination." This reads as a fixed, mandatory sequence — exactly the kind of specific promise that can be read as limiting at-will status, especially if the business ever skips a step for a serious violation.\n\nVersion B: "This handbook describes current policies and is not a contract of employment. Employment remains at-will. [Business Name] may, at its discretion, use verbal counseling, written warnings, or immediate termination depending on the circumstances." This preserves flexibility while still giving employees a real sense of how issues are typically handled — the difference is "typically handled" versus "guaranteed sequence."',
      },
      pitfalls: [
        'Writing specific, mandatory discipline steps without meaning to follow them exactly, every time, for everyone.',
        'Writing the handbook once and never updating it as the business or the law changes.',
        'Not keeping a signed acknowledgment on file for every employee.',
        'Copying a generic template verbatim without adjusting it for your actual state\'s rules.',
      ],
      exercise: {
        intro: 'Build the written policy index that becomes the skeleton of a real handbook — what it needs to cover, what you already have, and what\'s missing.',
        steps: [
          { title: 'List every policy area a handbook commonly needs', detail: 'Attendance and punctuality, dress/appearance, PTO and leave, anti-harassment, safety, technology and social media use, confidentiality, and termination are the common core — add anything specific to your business.' },
          { title: 'Mark which already exist in writing versus only "in your head"', detail: 'Be honest here. Most first-time employers find most of this list is undocumented.' },
          { title: 'Draft the at-will disclaimer paragraph', detail: 'State plainly that the handbook is a guide, not a contract, and that at-will status applies.' },
          { title: 'Draft the acknowledgment-form language', detail: 'A short statement the employee signs confirming they received and had the chance to read the handbook, with a date and signature line.' },
          { title: 'Set an annual review date', detail: 'Put it on a calendar. A handbook that never gets revisited drifts out of date with your actual practices and with the law.' },
        ],
        checklist: ['Listed every policy area the handbook should cover', 'Marked which are already written vs. undocumented', 'Drafted an at-will disclaimer paragraph', 'Drafted acknowledgment-form language', 'Set an annual review date'],
        deliverable: 'Written Policy Index',
      },
    },

    {
      key: 'w1_channels',
      title: 'Complaints, Escalation & Whistleblower Protection',
      objective: 'Why one channel ("talk to your manager") isn\'t enough, and what whistleblower protection actually covers.',
      sections: [
        {
          heading: 'One Channel Is Never Enough',
          body: 'If the only stated way to raise a concern is "talk to your direct manager," the process breaks exactly in the cases that matter most — when the complaint is about that manager. A workable process needs at least two genuinely independent paths: a direct manager for routine issues, and a separate route (an owner, an HR contact, or in a very small business a specifically designated second person) for anything involving that first channel.\n\nThis isn\'t bureaucracy for its own sake. An employee who believes there\'s nowhere safe to raise a real problem either stays silent (and the problem festers) or goes straight to an outside agency (and the business loses the chance to fix it internally first). A real second channel keeps more problems solvable in-house.',
        },
        {
          heading: 'Whistleblower Protection Is Broader Than People Think',
          body: 'Employees who report legal violations in good faith — a safety hazard to OSHA, a wage violation to the Department of Labor, discrimination to the EEOC, suspected fraud to the appropriate authority — are protected from retaliation under a range of federal and state laws. Critically, this protection often applies even if the underlying complaint doesn\'t ultimately prove out, as long as the report was made in good faith rather than knowingly false.\n\nThis means an employer\'s job isn\'t to decide whether a complaint sounds credible before deciding whether retaliation is off the table. It\'s off the table the moment a good-faith report is made, full stop.',
        },
        {
          heading: 'Retaliation Is Usually the Bigger Legal Exposure',
          body: 'In practice, a surprising share of real employer liability comes not from the original incident being complained about, but from what happened to the person afterward — a sudden schedule cut, a demotion, an unusually critical performance review that appeared right after they raised something. That pattern, more than the original complaint, is often what turns a manageable situation into a serious claim.\n\nThe practical rule: once someone has made a complaint or report, treat any subsequent negative action toward them with extra scrutiny, and document the legitimate, unrelated reason for it clearly, in writing, at the time — not reconstructed later.',
        },
        {
          heading: 'Documentation Discipline',
          body: 'Every complaint handled needs a record: a timestamp, what was reported (in the reporter\'s own words where possible), who investigated it, what was found, and what the resolution was. An undocumented "we talked about it and sorted it out" is the version that loses disputes later — not because nothing was done, but because there\'s no way to show a fair, consistent process actually happened.',
        },
      ],
      keyTerms: [
        { term: 'Whistleblower protection', definition: 'Legal protection from retaliation for employees who report violations in good faith, regardless of whether the report is ultimately substantiated.' },
        { term: 'Retaliation', definition: 'A negative employment action taken because someone engaged in a protected activity, like reporting a violation — often a separate legal violation from the original complaint.' },
        { term: 'Good-faith report', definition: 'A report made with a genuine, reasonable belief it is accurate — not a knowingly false accusation.' },
        { term: 'Escalation path', definition: 'The defined route a concern travels when the first channel isn\'t appropriate or doesn\'t resolve it.' },
      ],
      example: {
        title: 'Worked example — one channel versus two',
        body: 'Single-channel business: the only stated process is "raise concerns with your manager." An employee\'s complaint is about that manager\'s conduct. There is no defined alternate route, so the employee either says nothing, quits, or files directly with a state labor agency — the business never gets a chance to address it internally, and now faces a formal complaint with no internal record showing it tried.\n\nTwo-channel business: the handbook states concerns can go to the direct manager OR to the owner/designated alternate contact directly, with a stated commitment that reports are reviewed promptly and without retaliation. The same employee raises it with the alternate contact, it gets investigated and documented, and a resolution happens — with a record showing the business took it seriously the moment it heard about it.',
      },
      pitfalls: [
        'Having only one intake channel that routes through the person the complaint might be about.',
        'Any negative action toward an employee shortly after they report something, without a clearly documented, unrelated reason.',
        'Treating "we talked about it" as sufficient instead of writing it down.',
        'Deciding internally whether a complaint "sounds credible" before deciding whether retaliation protection applies — it applies to any good-faith report.',
      ],
      exercise: {
        intro: 'Draft the complaint and escalation procedure that becomes part of the handbook — the process for the moment something actually goes wrong.',
        steps: [
          { title: 'Define at least two intake channels', detail: 'A direct manager, and a genuinely independent alternate — an owner, an HR contact, or a designated second person.' },
          { title: 'Define who investigates and on what timeline', detail: 'Name a role (not necessarily a person, if the business is small) and a reasonable window to acknowledge and begin looking into a report.' },
          { title: 'Write a plain-language non-retaliation statement', detail: 'State clearly that reporting in good faith, even if the complaint isn\'t substantiated, will not result in a negative employment action.' },
          { title: 'Build a simple documentation template', detail: 'Date, what was reported, who investigated, what was found, and the resolution — four or five fields is enough to start.' },
          { title: 'Decide when a report should go outside the business', detail: 'Some reports — serious safety hazards, suspected fraud, anything that could involve law enforcement — need an attorney or the relevant regulator involved, not just an internal fix.' },
        ],
        checklist: ['Defined at least two intake channels', 'Defined who investigates and the expected timeline', 'Wrote a plain-language non-retaliation statement', 'Built a simple documentation template', 'Noted when a report should go outside the business'],
        deliverable: 'Complaint & Escalation Procedure',
      },
    },
  ],

  wrapUp: [
    'You should now have the foundational written-policy layer a real business is expected to have — the handbook fundamentals, the disclaimer that keeps it from becoming an accidental contract, and a complaint process with more than one working channel.',
    'Module 2 covers the specific compliance areas that process exists to catch: anti-harassment and anti-discrimination obligations, worker classification risk, and the safety recordkeeping a regulator would actually ask to see.',
    'One honest note: none of this replaces an employment attorney reviewing your actual handbook before you hand it to real employees, especially once you\'re in more than one state. What this module gives you is the draft worth paying someone to review — not a substitute for that review.',
  ],
};
