// src/data/curriculum/modules/W1M2.js
// Level W1 · Module 2 — Compliance, Safety & Regulatory Risk
//
// Same depth template as L1M1/W1M1. This is the most legally load-bearing
// module in the level, so REVIEWED_ON-style care applies: anything numeric
// or jurisdiction-specific is general orientation, not a compliance
// guarantee, and every lesson says so explicitly rather than once at the
// top where it's easy to skip past.

export default {
  id: 'W1M2',
  level: 'W1',
  index: 1,
  title: 'Compliance, Safety & Regulatory Risk',
  subtitle: 'Module 2',
  objective:
    'The federal baselines and recordkeeping obligations that generate the most real exposure for a small employer.',
  duration: '2–3 hours',

  intro: [
    'This module covers the three areas where a small employer\'s exposure is highest and most avoidable: harassment and discrimination compliance, worker misclassification, and safety recordkeeping. None of these are exotic — they\'re the everyday mechanics of employing people, and the mistakes that cause real damage are usually boring ones, not dramatic ones. A wrong duties-test call on one role. A "small business" assumption about safety recordkeeping that turned out to be wrong for that industry. A handbook with no training record behind it.',
    'The pattern across all three: the rules are specific, they vary by state and industry, and they change over time. This module gives you the structure to work through each one honestly for your actual business — not a static answer, because a static answer would be wrong somewhere the moment it was written. Treat every number and threshold here as a starting point to verify, not a fact to rely on.',
  ],

  lessons: [
    {
      key: 'w1_harassment',
      title: 'Anti-Harassment & Anti-Discrimination Compliance',
      objective: 'Title VII, the ADA, and the ADEA as the federal floor — and why several states require specific, recurring supervisor training on top of it.',
      sections: [
        {
          heading: 'The Federal Baseline',
          body: 'Title VII of the Civil Rights Act of 1964 prohibits employment discrimination based on race, color, religion, sex — which current EEOC guidance and case law extend to sexual orientation and gender identity — and national origin, generally for employers with 15 or more employees. The Americans with Disabilities Act (ADA) covers disability, and the Age Discrimination in Employment Act (ADEA) covers age 40 and over. Many states extend these protections further and apply them to smaller employers than the federal thresholds — a business exempt federally can still be squarely covered under its own state\'s law.',
        },
        {
          heading: 'Two Kinds of Harassment Claims',
          body: 'Quid pro quo harassment is when a job benefit — a raise, a promotion, continued employment — is explicitly or implicitly conditioned on tolerating unwelcome conduct, classically involving a supervisor with authority over the employee. Hostile work environment is broader: conduct that is severe or pervasive enough to alter the conditions of employment and create an abusive atmosphere. A hostile-environment claim doesn\'t require one dramatic incident — a pattern of smaller conduct, repeated over time, can meet the bar even when no single instance would on its own.',
        },
        {
          heading: 'Supervisor Duty and State Training Mandates',
          body: 'Supervisors generally carry a heightened duty: once a supervisor knows or reasonably should know about harassment, the employer is expected to act — and a supervisor\'s own harassing conduct can create employer liability more directly than a coworker\'s can. A number of states require specific, recurring, interactive harassment-prevention training for supervisors, and sometimes all employees, at businesses above a size threshold — these mandates are genuinely state-specific and change over time, so a training program built once and never revisited is a common gap.',
        },
      ],
      keyTerms: [
        { term: 'Title VII', definition: 'The federal law prohibiting employment discrimination based on race, color, religion, sex, and national origin, generally at 15+ employees.' },
        { term: 'Protected class', definition: 'A characteristic — race, sex, age, disability, and others — that employment law specifically prohibits discriminating against.' },
        { term: 'Hostile work environment', definition: 'Conduct severe or pervasive enough to alter the conditions of employment; can arise from a pattern rather than a single incident.' },
        { term: 'Quid pro quo harassment', definition: 'A job benefit conditioned, explicitly or implicitly, on tolerating unwelcome conduct.' },
      ],
      example: {
        title: 'Worked example — a pattern versus an isolated incident',
        body: 'One coworker makes a single off-color joke at a team lunch, is told it wasn\'t appropriate, and doesn\'t repeat it. On its own, this is unlikely to meet the "severe or pervasive" bar for a hostile-environment claim, though it should still be addressed.\n\nA different coworker makes recurring comments about a colleague\'s appearance over several months, despite being asked to stop, and a supervisor who witnessed it more than once did nothing. This is squarely the pattern a hostile-environment claim is built on — not because of any single comment, but because of the repetition, the request to stop being ignored, and a supervisor\'s inaction once they knew.',
      },
      pitfalls: [
        'Assuming "no lawsuit yet" means the business is actually compliant.',
        'Dismissing a pattern of small incidents because no single one seems serious enough on its own.',
        'Training only new hires once, with no recurring training for supervisors.',
        'Skipping or slow-walking an investigation because the complaint seems minor at first read.',
      ],
      exercise: {
        intro: 'Draft the anti-harassment policy statement that becomes part of the handbook, and check what your specific state actually requires.',
        steps: [
          { title: 'State the protected categories the policy covers', detail: 'Match your state\'s actual list — many states cover more categories than the federal floor.' },
          { title: 'State the standard of conduct expected', detail: 'Plain language: what unwelcome conduct is prohibited, described broadly enough to cover a pattern, not just single severe incidents.' },
          { title: 'Reference the complaint channels from Module 1', detail: 'The policy should point directly to the escalation procedure you already drafted, not describe a separate one.' },
          { title: 'State the non-retaliation commitment', detail: 'Reuse the language from the previous lesson\'s exercise.' },
          { title: 'Check your state\'s specific training mandate', detail: 'Look up your state labor agency\'s current requirement for supervisor and employee harassment-prevention training, and record what you found — including "none currently required" if that\'s accurate today.' },
        ],
        checklist: ['Stated the protected categories the policy covers', 'Stated the standard of conduct expected', 'Referenced the complaint channels from Module 1', 'Stated the non-retaliation commitment', 'Checked your state\'s training mandate and recorded what you found'],
        deliverable: 'Anti-Harassment Policy Statement',
      },
    },

    {
      key: 'w1_classification',
      title: 'Employment Law & Classification Risk',
      objective: 'Why misclassifying a worker is one of the most expensive mistakes a small employer makes, and why a salary alone never makes someone overtime-exempt.',
      sections: [
        {
          heading: 'Employee vs. Independent Contractor — the Most Expensive Small-Business Mistake',
          body: 'Classifying a worker as an independent contractor to avoid payroll tax, overtime, and benefits — when the actual working relationship looks like employment — is one of the costliest errors a small employer makes. It generates back payroll taxes, back overtime, penalties, and interest, often assessed years later and covering the entire misclassified period, not just the point it was caught.\n\nThe test isn\'t what the contract calls the person. The IRS looks at behavioral control (does the business direct how the work is done, not just what result is wanted), financial control (who bears the investment and profit/loss risk), and the type of relationship (is it ongoing and central to the business, or a discrete project). Some states apply a stricter test — California\'s "ABC test," for example, presumes employee status unless all three specific conditions are met. Verify your state\'s actual standard rather than assuming the federal test is the only one that applies.',
        },
        {
          heading: 'Exempt vs. Non-Exempt Doesn\'t Come From the Paycheck Label',
          body: 'Paying someone a salary does not, by itself, make them exempt from overtime under the Fair Labor Standards Act. Exemption requires meeting both a minimum salary threshold (which is periodically updated — verify the current figure rather than an old one) and a duties test — executive, administrative, or professional duties genuinely involving independent judgment and discretion, not just a title that sounds senior.\n\nA common real-world mistake: a "salaried manager" who spends most of their time on the same hands-on tasks as the hourly staff they supposedly supervise, with little actual independent authority, is frequently misclassified as exempt — the title doesn\'t control, the actual duties do.',
        },
        {
          heading: 'Documentation Before Termination',
          body: 'At-will doesn\'t mean undocumented. A termination backed by a documented history of performance issues is far more defensible than one that appears sudden — and it\'s especially important if the employee recently did something protected, like filing a complaint, taking leave, or reporting a safety hazard. Timing alone, even with a legitimate underlying reason, can suggest retaliation to an investigator or a jury if there\'s no contemporaneous record showing the real reason predates the protected activity.',
        },
      ],
      keyTerms: [
        { term: 'Independent contractor', definition: 'A worker who controls how their own work is performed and bears their own business risk — not simply someone paid on a 1099.' },
        { term: 'Exempt / non-exempt', definition: 'Whether a role is exempt from overtime requirements under the FLSA — determined by a salary threshold AND a duties test together, never by title alone.' },
        { term: 'Duties test', definition: 'The FLSA analysis of what a role actually does day to day, to determine whether it genuinely qualifies as executive, administrative, or professional.' },
        { term: 'Misclassification', definition: 'Labeling a worker as a contractor or exempt when the actual working relationship or duties don\'t support that status.' },
      ],
      example: {
        title: 'Worked example — contractor or employee?',
        body: 'A graphic designer who sets their own hours, uses their own equipment, works for several other clients simultaneously, and is paid a flat fee per project looks like a genuine contractor under most tests — real independence, real business risk of their own.\n\nA "contractor" who works set hours the business assigns, uses equipment the business provides, works exclusively for this one business, and has done so continuously for over a year looks like a misclassified employee under nearly every version of the test — regardless of what the agreement between them is titled.',
      },
      pitfalls: [
        'Classifying based on cost savings rather than the actual working relationship.',
        'Assuming "salaried" automatically means exempt from overtime.',
        'Terminating someone shortly after a complaint or leave request with no documented, unrelated performance history.',
        'Using a single national rule when your state applies a stricter contractor test.',
      ],
      exercise: {
        intro: 'Review your real or planned roles against the actual tests, not assumptions.',
        steps: [
          { title: 'List every role currently or soon to be filled', detail: 'Include anyone paid on a 1099 today.' },
          { title: 'Classify each as employee or contractor, with reasoning', detail: 'Work through behavioral control, financial control, and relationship type for each — and check whether your state applies a stricter test.' },
          { title: 'Classify each employee role as exempt or non-exempt, with reasoning', detail: 'Check the current salary threshold and apply the actual duties test — not the job title.' },
          { title: 'Check your state\'s meal and rest break rules', detail: 'These vary significantly by state and are frequently overlooked for non-exempt staff.' },
          { title: 'Set a documentation habit for performance issues going forward', detail: 'Decide, in writing, that performance concerns get a dated note going forward — before you need one for a specific termination.' },
        ],
        checklist: ['Listed every current or planned role', 'Classified each as employee or contractor, with reasoning', 'Classified each employee role as exempt or non-exempt, with reasoning', 'Checked your state\'s meal/rest break rules', 'Set a documentation habit for performance issues going forward'],
        deliverable: 'Employee Classification & Risk Worksheet',
      },
    },

    {
      key: 'w1_safety_records',
      title: 'Workplace Safety Recordkeeping & OSHA Obligations',
      objective: 'The employer-side counterpart to floor-level safety training: the OSHA 300 log, required postings, and the clock on reporting a serious incident.',
      sections: [
        {
          heading: 'The General Duty Clause, Restated for the Employer\'s Desk',
          body: 'OSHA\'s general duty clause requires a workplace free of recognized hazards likely to cause death or serious physical harm, on top of its many specific standards. Front-line safety training — spill response, ladder use, lifting technique — is what that duty looks like on the floor. This lesson is what it looks like at the employer\'s desk: the records, postings, and reporting obligations that back that training up and that a regulator would actually ask to see.',
        },
        {
          heading: 'The OSHA 300 Log and Recordkeeping Thresholds',
          body: 'Employers above a size threshold — and the threshold and exemptions shift by industry classification (NAICS code), not just headcount — are required to keep an injury and illness log (OSHA Form 300), post an annual summary (Form 300A, typically posted February through April), and in some cases submit data electronically. Some lower-risk industries are exempt from routine recordkeeping even at a larger size; some higher-risk ones have obligations at a smaller size than people assume. Verify your specific NAICS classification\'s requirement rather than guessing from headcount alone.',
        },
        {
          heading: 'Required Postings — Get Them From the Source',
          body: 'OSHA, EEOC, and state labor postings are available free, directly from the issuing agencies. This is the same trap as the EIN-filing services covered earlier in this track: third-party "compliance poster" companies sell a bundle for $50–$150 or more that covers exactly the same postings you can compile correctly, for free, from official government sources — they\'re not scams exactly, they\'re selling a convenience you don\'t need to pay for.',
        },
        {
          heading: 'Reporting a Serious Incident on a Clock',
          body: 'Separate from the routine 300 log, OSHA requires certain severe incidents to be reported directly and quickly: a work-related fatality within 8 hours, and an in-patient hospitalization, amputation, or loss of an eye within 24 hours. Missing this specific window is its own violation, independent of whatever caused the incident in the first place — which is why it needs to be a known, written procedure ahead of time, not something figured out in the moment of a crisis.',
        },
      ],
      keyTerms: [
        { term: 'OSHA 300 Log', definition: 'The required injury and illness log for covered employers, with an annual summary (Form 300A) posted each spring.' },
        { term: 'General duty clause', definition: 'OSHA\'s baseline requirement to keep a workplace free of recognized hazards likely to cause serious harm.' },
        { term: 'Recordable incident', definition: 'A work-related injury or illness meeting OSHA\'s specific criteria for the 300 log — not every minor first-aid case qualifies.' },
        { term: 'NAICS code', definition: 'The industry classification code that determines many recordkeeping thresholds and exemptions — not headcount alone.' },
      ],
      example: {
        title: 'Worked example — recordable or not',
        body: 'An employee slips in the stockroom, catches themselves, and is a little sore for a day but needs no medical treatment beyond basic first aid and misses no work. This is typically a first-aid-only case, not a recordable incident on the 300 log.\n\nA different employee falls from a step stool, is taken to urgent care, and is prescribed a few days of restricted duty before returning to normal tasks. This crosses into recordable territory — medical treatment beyond first aid and days of restricted work both trigger the log, even though it wasn\'t severe enough to trigger the 8/24-hour direct reporting requirement.',
      },
      pitfalls: [
        'Assuming being a "small business" automatically means exemption from recordkeeping — it depends on industry classification, not size alone.',
        'Buying required postings from a paid reseller instead of pulling them free from official sources.',
        'Not knowing the 8-hour/24-hour reporting clock exists until there\'s an actual incident to report.',
        'Keeping the 300 log internally but forgetting the required annual 300A posting.',
      ],
      exercise: {
        intro: 'Build the compliance posting and recordkeeping checklist a real inspection would actually check against.',
        steps: [
          { title: 'Look up your NAICS code\'s recordkeeping requirement', detail: 'Confirm whether your specific industry classification is exempt from routine OSHA recordkeeping — don\'t assume from size alone.' },
          { title: 'Source required postings directly from official agencies', detail: 'OSHA, EEOC, and your state labor department all provide current required postings free.' },
          { title: 'Set up an OSHA 300 log, or confirm in writing that you\'re exempt', detail: 'Either way, have a documented answer rather than an assumption.' },
          { title: 'Write down the severe-incident reporting clock', detail: '8 hours for a fatality, 24 hours for an in-patient hospitalization, amputation, or loss of an eye — and name who is responsible for making that call if it ever happens.' },
          { title: 'Set the annual 300A posting window on your calendar', detail: 'Typically February through April — confirm the current exact dates.' },
        ],
        checklist: ['Checked whether your industry is exempt from routine OSHA recordkeeping', 'Sourced required postings directly from official agencies, not a paid reseller', 'Set up (or confirmed you don\'t need) an OSHA 300 log', 'Wrote down the severe-incident reporting clock and who owns that call', 'Set the annual 300A posting window on your calendar'],
        deliverable: 'Safety Recordkeeping & Posting Checklist',
      },
    },
  ],

  wrapUp: [
    'You\'ve now worked through the three areas most likely to generate real regulatory or legal exposure for a small employer: harassment and discrimination compliance, worker classification, and safety recordkeeping. Each of these is boring right up until it isn\'t — the businesses that get hurt by them are almost never the ones that set out to break the rules, they\'re the ones that never checked.',
    'Module 3 is a shift in altitude, from compliance obligations to daily culture — turning the values you\'d claim to have into a code of conduct people can actually be held to consistently.',
    'Repeated because it matters: every threshold, dollar figure, and rule in this module is a starting point to verify against your actual state and industry, not a fact to build a real handbook on without a professional review.',
  ],
};
