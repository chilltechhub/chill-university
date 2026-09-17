// src/screens/classes/entrepreneurClass/retailOperations.js
//
// ENTREPRENEUR track — Level R1: Retail Operations Training.
//
// Everything else in the Business Ownership Track teaches how to OWN a
// business (entity, capital, tax). This level teaches how to RUN the
// floor — the same onboarding material a retail employer hands a new
// hire on day one: customer service standards, cash handling, loss
// prevention, merchandising, receiving, and workplace safety.
//
// Two audiences get real use out of this, deliberately:
//   1. Someone opening a retail storefront, who needs actual training
//      material to hand their first employees.
//   2. Someone about to work retail themselves, who wants to walk in
//      already knowing the answers.
// Every apply block is written so its checklist doubles as that handout —
// complete all six and the Vault artifact set is close to a usable New
// Hire Training Packet, not just a personal reflection exercise.
//
// Paired games: Register Ready (quiz) and Shift Manager (strategy) in
// the Training Center apply the same material under time pressure —
// see gameContent/registerReady.js and gameContent/shiftManager.js.
//
// Same duty-of-care note as businessArchitecture.js: specific numbers
// (OSHA thresholds, labor-law specifics) vary by state/industry and
// change over time — anything numeric here is general orientation, not
// a compliance guarantee. Re-verify before each release.

import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

export const REVIEWED_ON = '2026-09-10';

const TRACK = 'R1';

const DISCLAIMER =
  'General orientation, not a compliance guarantee. Labor law, safety rules, and licensing requirements vary by state and industry — confirm specifics with your state labor department, OSHA\'s own guidance, or an employment attorney before writing a real handbook.';

const topics = [
  {
    key: 'customerServiceStandards',
    title: 'Customer Service Standards & Recovery',
    color: '#F2994A',
    description:
      'The floor-level playbook nearly every retailer trains first: a consistent greeting, and a repeatable way to turn a complaint into a resolved customer instead of a lost one.',
    learn: [
      {
        heading: 'A Standard, Not a Script',
        body: 'Most retail onboarding starts with a simple greeting standard — acknowledge within a set window (often "within 30 seconds" or "before they finish walking in"), make eye contact, offer help. The point isn\'t robotic repetition; it\'s that every customer gets the same baseline experience regardless of which employee is on the floor that day.',
      },
      {
        heading: 'The LAST Method for a Complaint',
        body: 'Listen fully before responding. Apologize for the frustration — that\'s not the same as admitting fault, it\'s acknowledging their experience. Solve what\'s actually within your authority. Thank them for raising it, since a complaint you hear is a problem you can still fix; the ones you never hear about just walk away.',
      },
      {
        heading: 'Know Your Authority, and the Escalation Path',
        body: 'Every employee should know exactly what they can resolve on their own (a small refund, a discount within X%) and what needs a supervisor. The failure mode isn\'t needing to escalate — it\'s not knowing you need to, and either overpromising or stonewalling a customer who needed a manager five minutes ago.',
      },
      {
        heading: 'A Recovered Customer Can Be More Loyal Than One Who Never Complained',
        body: 'This shows up repeatedly in service research: a customer whose problem was resolved well often reports higher satisfaction than one who never had a problem at all. Recovery isn\'t just damage control — done right, it\'s a loyalty-building moment.',
      },
    ],
    practice: [
      { question: 'What does the "A" in the LAST de-escalation method stand for?', options: ['Argue', 'Apologize', 'Avoid', 'Accuse'], answerIndex: 1, explanation: 'Apologizing for the customer\'s frustration — not necessarily admitting the store was wrong — is what keeps the conversation moving toward resolution.' },
      { question: 'Why does a clear escalation path matter for front-line staff?', options: ['It slows every interaction down on purpose', 'It gives employees a clear line between what they can fix and what needs a manager', 'It removes any need for employee judgment', 'It only matters for large stores'], explanation: 'Without a clear line, employees either overpromise things they can\'t deliver or stonewall issues that actually needed a manager — both erode trust.' },
      { question: 'What does service research generally find about well-handled complaints?', options: ['They always cost the store money with no benefit', 'A well-resolved complaint can leave a customer more loyal than if nothing went wrong', 'Customers who complain rarely return regardless', 'Complaints should be avoided by never asking for feedback'], explanation: 'A genuinely resolved problem is a trust-building moment — it shows the business stands behind what it sells.' },
    ],
    apply: {
      prompt:
        'Write the customer-service standard you would actually hand a new hire: your greeting standard, your version of a complaint-recovery method, and a plain-language list of what a front-line employee can resolve on their own versus what needs a supervisor.',
      checklist: [
        'Wrote a specific greeting standard (timing and behavior)',
        'Wrote out a complaint-recovery method in your own words',
        'Listed what a front-line employee can resolve without approval',
        'Listed what must be escalated, and to whom',
        'Wrote one example scenario and how staff should handle it',
      ],
      deliverable: { track: TRACK, title: 'Customer Service Standards Sheet' },
    },
  },

  {
    key: 'cashHandlingPOS',
    title: 'Cash Handling & POS Controls',
    color: '#E0A830',
    description:
      'The procedures that keep a till honest: a verified starting count, controlled voids and overrides, and a documented process for the moment the numbers don\'t match.',
    learn: [
      {
        heading: 'The Float Is What Makes Over/Short Mean Anything',
        body: 'A register opens with a counted, recorded starting amount (the "float"). Without a verified starting point, an end-of-shift discrepancy is just a number with no way to explain it. Counting the float — every open, every close — is the control that makes the rest of the system work.',
      },
      {
        heading: 'Voids and Overrides Need a Second Set of Eyes',
        body: 'A single employee with unlimited authority to void a transaction, apply a discount, or process a "no-receipt" return at any amount is a control gap, not a convenience. Setting a dollar threshold above which a supervisor must approve — and logging every override — is standard practice specifically because it protects honest employees from suspicion as much as it deters dishonest ones.',
      },
      {
        heading: 'Dual Control on Cash Movement',
        body: 'Moving cash out of a register into a safe (a "cash drop") ideally involves two people who both witness and sign off on the count. No single person should ever be the only one who can say how much was in a given drawer at a given time — that protects the business and removes any employee from being the sole suspect if something\'s later unclear.',
      },
      {
        heading: 'A Discrepancy Is Data, Not a Confession',
        body: 'When a till doesn\'t balance, the instinct to quietly cover it out of pocket feels like the easy fix — and it erases the one signal that something in the process needs a look. A documented discrepancy report, reviewed for patterns over time, is what actually catches a real problem instead of letting it repeat invisibly.',
      },
    ],
    practice: [
      { question: 'Why does a register need a counted, recorded starting float?', options: ['It\'s a legal requirement in every state', 'It gives a verified starting point so an end-of-shift discrepancy actually means something', 'It speeds up the checkout process', 'It replaces the need for receipts'], explanation: 'An over/short calculation is only meaningful against a known, verified starting amount.' },
      { question: 'What is the main reason cash drops typically require two people?', options: ['It\'s faster with two people', 'So no single person is ever the sole witness to a cash count', 'It\'s only for very large stores', 'To split the work evenly'], explanation: 'Dual control protects both the business and the employee — no one person\'s word alone determines the count.' },
      { question: 'A register is short at close. What does sound cash-handling procedure recommend?', options: ['The employee quietly covers it personally', 'Document it through the real discrepancy process, not personally absorb it', 'Ignore it if it\'s under $50', 'Fire the employee immediately'], explanation: 'A personally covered shortage hides the signal that something in the process may need fixing — document it instead.' },
    ],
    apply: {
      prompt:
        'Design the cash-handling procedure you would actually run: how a register opens and closes, at what dollar amount a void or override needs supervisor approval, how a cash drop works, and exactly what happens when a till doesn\'t balance.',
      checklist: [
        'Defined the open/close float-counting procedure',
        'Set a specific dollar threshold requiring supervisor approval on voids/overrides',
        'Described the cash-drop procedure and who is involved',
        'Wrote the exact steps for a discrepancy — recount, documentation, who reviews it',
        'Decided this is never resolved by an employee covering it personally',
      ],
      deliverable: { track: TRACK, title: 'Cash Handling Procedure' },
    },
  },

  {
    key: 'lossPrevention',
    title: 'Loss Prevention & Shrink Awareness',
    color: '#E05858',
    description:
      '"Shrink" is the industry term for inventory that vanishes between receiving and the shelf — through theft, error, or damage. Most of it is preventable with training, not confrontation.',
    learn: [
      {
        heading: 'Shrink Has Several Causes, Not Just One',
        body: 'External theft (shoplifting) gets the most attention, but internal theft (employee), administrative error (miscounts, pricing mistakes), and vendor fraud all contribute too. A training program that only talks about shoplifting is only addressing part of the actual problem.',
      },
      {
        heading: 'Observe and Escalate — Never Confront',
        body: 'Nearly every retail loss-prevention program trains the same rule for front-line staff: notice details, alert a manager or LP, and never personally confront, chase, or physically detain a suspected shoplifter. It\'s a safety issue (an unknown person\'s reaction is unpredictable) and a liability issue (an employee\'s wrong guess becomes the store\'s legal problem).',
      },
      {
        heading: 'Common Theft Patterns Worth Recognizing',
        body: 'Distraction theft (one person occupies staff attention while another acts), "booster bags" (lined to defeat security tags), and returning stolen merchandise for cash are recognizable patterns — recognizing them is about awareness and reporting, not amateur detective work.',
      },
      {
        heading: 'Internal Controls Are Loss Prevention Too',
        body: 'Register voids requiring approval, dual control on cash, receiving documentation, and receipt checks at the door aren\'t separate from loss prevention — they\'re the same discipline applied to the most common actual source of shrink, which is often internal rather than external.',
      },
    ],
    practice: [
      { question: 'What is "shrink" in retail?', options: ['A discount applied at checkout', 'Inventory that goes missing between receiving and sale, from theft, error, or fraud', 'A type of clothing size chart', 'The store\'s profit margin'], explanation: 'Shrink covers external theft, internal theft, administrative error, and vendor fraud — not just shoplifting.' },
      { question: 'What is a front-line employee trained to do about a suspected shoplifter?', options: ['Chase them into the parking lot', 'Physically detain them until police arrive', 'Observe details and alert a manager or loss prevention — never confront', 'Publicly accuse them in front of other customers'], explanation: 'Confrontation and detention by untrained staff is a safety and liability risk — the trained response is observe and escalate.' },
      { question: 'Which of these is an example of an internal control that also functions as loss prevention?', options: ['A friendly greeting standard', 'Requiring supervisor approval on voids above a threshold', 'A generous return policy', 'A large storefront window'], explanation: 'Approval thresholds on voids and overrides close off a common path for internal shrink, not just external theft.' },
    ],
    apply: {
      prompt:
        'Write the loss-prevention basics you would train every new hire on: the "observe and escalate, never confront" rule stated explicitly, at least two recognizable theft patterns, and which internal controls (from your cash-handling procedure) double as loss prevention.',
      checklist: [
        'Stated the "never confront" rule in plain language',
        'Described at least two recognizable theft patterns',
        'Listed which internal controls double as loss prevention',
        'Named who staff should actually alert, and how',
        'Noted that shrink includes internal and administrative causes, not just shoplifting',
      ],
      deliverable: { track: TRACK, title: 'Loss Prevention Briefing' },
    },
  },

  {
    key: 'merchandisingStandards',
    title: 'Merchandising & Visual Standards',
    color: '#3AC860',
    description:
      'How product is displayed measurably changes what sells. A planogram and a consistent facing/zoning routine are how a store keeps that intentional instead of accidental.',
    learn: [
      {
        heading: 'A Planogram Is an Instruction, Not a Suggestion',
        body: 'A planogram is a diagram specifying exactly what product goes where, and why — often driven by sales data, vendor agreements, or eye-level placement psychology. Following it consistently is what makes a chain\'s stores (or even a single store week to week) predictable for both customers and headquarters.',
      },
      {
        heading: '"Facing" and "Zoning" Are Routine, Not One-Time',
        body: 'Facing means pulling product forward so shelves look full and labels face out. Zoning means each employee owns a section and checks it regularly, not just at opening. Both are maintenance tasks meant to happen throughout a shift during downtime — not a special project done once a week.',
      },
      {
        heading: 'Signage Has to Match What\'s Actually There',
        body: 'A price or promotional sign that doesn\'t match the product behind it is more than sloppy — in many states it can trigger real "bait and switch" or false-advertising exposure, and it\'s the single most common customer-complaint trigger at checkout.',
      },
      {
        heading: 'Seasonal Resets Are Planned, Not Improvised',
        body: 'A seasonal reset (swapping summer for back-to-school, holiday for post-holiday clearance) works best with a written plan — what comes down, what goes up, where, and by when — rather than staff improvising in the moment it needs to happen.',
      },
    ],
    practice: [
      { question: 'What is a planogram?', options: ['A staff schedule', 'A diagram specifying exact product placement on a shelf or display', 'A type of cash register', 'A customer loyalty program'], explanation: 'A planogram is the visual instruction for where product goes and why — often tied to sales data or vendor agreements.' },
      { question: 'What does "facing" a shelf mean?', options: ['Counting inventory', 'Pulling product forward so it looks full and labels face outward', 'Removing expired products', 'Rearranging a whole department'], explanation: 'Facing is a quick, repeated maintenance task — not a full reset — done throughout a shift.' },
      { question: 'Why is mismatched signage a real risk, not just an appearance issue?', options: ['It has no real consequence', 'It can trigger false-advertising or "bait and switch" exposure, and it\'s a common complaint trigger', 'Customers never notice signage', 'It only matters for online stores'], explanation: 'A sign promising a price or promotion the shelf doesn\'t match is both a customer-trust issue and, in many states, a legal one.' },
    ],
    apply: {
      prompt:
        'Build a merchandising standards sheet: how often facing/zoning happens during a shift, who owns which zone, how signage gets checked against actual product and pricing, and a simple checklist for a seasonal reset.',
      checklist: [
        'Set a facing/zoning routine (how often, who owns what)',
        'Wrote a signage-accuracy check step',
        'Listed what a seasonal reset checklist should cover',
        'Noted where planogram or layout decisions come from',
      ],
      deliverable: { track: TRACK, title: 'Merchandising Standards Sheet' },
    },
  },

  {
    key: 'inventoryReceiving',
    title: 'Inventory & Stockroom Receiving',
    color: '#4A90E2',
    description:
      'What happens the moment a delivery truck arrives determines whether your inventory records are trustworthy for the rest of the season.',
    learn: [
      {
        heading: 'Receive Against the Purchase Order, Not the Packing Slip Alone',
        body: 'Checking a delivery against your own purchase order — not just trusting the supplier\'s packing slip — is what catches short shipments, substitutions, and billing errors before they become a dispute weeks later, when the truck is long gone and memory is unreliable.',
      },
      {
        heading: 'Document Damage Before You Sign',
        body: 'Anything damaged in transit needs to be noted and photographed on the delivery paperwork before signing. A clean signature on a damaged shipment is frequently read as "accepted in good condition," which can forfeit the ability to get credited for it later.',
      },
      {
        heading: 'FIFO Keeps Perishable and Seasonal Stock Moving',
        body: 'First In, First Out — placing new stock behind existing stock rather than in front of it — keeps older inventory from expiring, going stale, or falling out of season on the shelf while fresher product sells first. Simple to say, easy to skip when you\'re in a hurry.',
      },
      {
        heading: 'Cycle Counts Beat One Giant Annual Count',
        body: 'Instead of one massive, disruptive inventory count once a year, cycle counting checks a rotating subset of items regularly. Discrepancies get caught and investigated while they\'re still recent and explainable, instead of surfacing as one large unexplained number twelve months later.',
      },
    ],
    practice: [
      { question: 'What should a delivery be checked against on receiving?', options: ['Nothing — trust the driver', 'Your own purchase order, not just the supplier\'s packing slip', 'Last month\'s delivery only', 'The store\'s total revenue'], explanation: 'Checking against your own PO catches shortages, substitutions, and billing errors the supplier\'s own paperwork won\'t flag.' },
      { question: 'Why document damage before signing for a delivery?', options: ['It\'s optional paperwork', 'An unmarked signature can be read as accepting the shipment in good condition, forfeiting a credit claim', 'It slows down the driver unnecessarily', 'Damage is always the store\'s fault regardless'], explanation: 'Noting and photographing damage at the door is what actually supports a supplier credit claim later.' },
      { question: 'What does FIFO stand for and why does it matter?', options: ['"Fill In, Fan Out" — a display technique', 'First In, First Out — placing new stock behind old so older stock sells first', 'A pricing formula', 'A type of security tag'], explanation: 'FIFO keeps older stock from expiring or going stale behind newer stock placed in front of it.' },
      { question: 'What is the advantage of cycle counting over one annual count?', options: ['It takes more total staff hours with no benefit', 'Discrepancies are caught and investigated while still recent, instead of surfacing as one unexplained annual number', 'It eliminates the need for any counting', 'It only works for very small stores'], explanation: 'Rotating, regular counts catch problems close to when they happened, when they\'re still explainable.' },
    ],
    apply: {
      prompt:
        'Write the receiving and stockroom procedure you would train on: what gets checked against the PO, the damage-documentation step, your FIFO placement rule, and a simple cycle-count schedule.',
      checklist: [
        'Wrote the PO-verification step for incoming deliveries',
        'Wrote the damage-documentation step, before signing',
        'Stated the FIFO placement rule plainly',
        'Set a cycle-count schedule (what gets counted, how often)',
      ],
      deliverable: { track: TRACK, title: 'Receiving & Stockroom Procedure' },
    },
  },

  {
    key: 'workplaceSafety',
    title: 'Workplace Safety & Emergency Procedures',
    color: '#8B4FC4',
    description:
      'The floor and stockroom basics that keep people from getting hurt — spill response, ladder use, lifting technique, and what to actually do when the alarm goes off. ' + DISCLAIMER,
    learn: [
      {
        heading: 'Employers Have a General Duty to Provide a Safe Workplace',
        body: 'In the US, OSHA\'s "general duty clause" requires employers to keep the workplace free of recognized hazards likely to cause serious harm, on top of specific standards for things like ladders, lifting, and chemical handling. Training staff to recognize and report hazards is both good practice and part of meeting that duty.',
      },
      {
        heading: 'Spills and Slip Hazards Get Handled Immediately',
        body: 'A wet floor sign out and a prompt cleanup — not "someone will notice" — is the standard, because slip-and-fall injuries are among the most common retail workplace incidents, for both customers and staff.',
      },
      {
        heading: 'Lifting and Ladder Basics Aren\'t Optional Extras',
        body: 'Lift with the legs, not the back; never overreach on a ladder — reposition it instead; never stand on the top step. These sound basic because they are, and they\'re also where a large share of preventable stockroom injuries come from.',
      },
      {
        heading: 'Every Employee Should Know the Emergency Basics Cold',
        body: 'Where the nearest exits are, where the fire extinguisher and first-aid kit live, and the actual evacuation assembly point — not figured out for the first time during an actual emergency. Any injury, even a minor one, should be documented through a real incident report, not waved off.',
      },
    ],
    practice: [
      { question: 'What does OSHA\'s "general duty clause" require of employers?', options: ['Nothing specific — it\'s symbolic', 'Keeping the workplace free of recognized hazards likely to cause serious harm', 'Only applies to factories, not retail', 'Requires a safety officer on every shift'], explanation: 'The general duty clause is a baseline requirement on top of OSHA\'s specific standards, and it applies broadly, including retail.' },
      { question: 'What is the correct immediate response to a spill on the sales floor?', options: ['Wait for someone to notice and avoid it', 'Put out a wet floor sign and clean it up promptly', 'Only handle it at closing time', 'Ask a customer to step around it'], explanation: 'Immediate signage and cleanup is the standard — an unmarked spill is a foreseeable, preventable injury waiting to happen.' },
      { question: 'What should happen after even a minor workplace injury?', options: ['Nothing, if it seems minor', 'It should be documented through a real incident report regardless of severity', 'Only the employee needs to remember it happened', 'It should only be reported if a customer saw it'], explanation: 'Under-reporting "minor" injuries is how a real hazard pattern goes unnoticed until someone is seriously hurt by the same thing.' },
    ],
    apply: {
      prompt:
        'Write the safety basics you would train on day one: the spill/slip response, one lifting and one ladder rule, where the emergency exits/extinguisher/first-aid kit are (or would be) in your actual space, and how an incident gets reported.',
      checklist: [
        'Wrote the spill/slip response procedure',
        'Wrote a lifting rule and a ladder-safety rule',
        'Identified emergency exits, extinguisher, and first-aid kit locations',
        'Wrote the incident-reporting step, for any injury regardless of severity',
        'Noted that this needs a real safety-standard review, not just this lesson, before use',
      ],
      deliverable: { track: TRACK, title: 'Workplace Safety Briefing' },
    },
  },
];

// Total deliverables in this level — what getTrackProgress() compares
// against for the Level R1 gate review, same pattern as L2.
export const R1_DELIVERABLE_COUNT = topics.filter(t => t.apply?.deliverable).length;

export default function RetailOperations() {
  return (
    <ClassTopicScreen
      title="Level R1: Retail Operations Training"
      classKey="RetailOperations"
      fallbackTopics={topics}
    />
  );
}
