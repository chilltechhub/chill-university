// src/data/gameContent/shiftManager.js
// Shift Manager — a Reigns-style day-by-day retail-operations survival
// game, structurally identical to surviveMonth.js: one card per shift,
// 2-3 trade-off options each, sampled without repeats from that tier's
// pool. Two resources instead of Cash/Stress:
//   Till  — the shift's operating health (payroll hours covered, sales
//           target, supplies). Hits $0 and the shift is a bust.
//   Risk  — accumulated loss-prevention/safety/compliance exposure from
//           corner-cutting. Maxing it out forces an "incident" (an audit
//           finding, a safety citation, a bad review that goes viral) —
//           expensive, but not an automatic game over, same as burnout in
//           surviveMonth.js.
// `good: true/false` on each option is what the round's correct/total
// score is measured against — it's "which call reflects sound retail
// management," not simply "which one made more money this instant."

export const SHIFT_BANK = {
  'K-2': {
    title: 'Opening Shift Basics',
    startingTill: 30,
    startingRisk: 15,
    incomePerDay: 6,
    cardPool: [
      {
        id: 'wet_floor',
        prompt: 'A customer spills a drink near the entrance.',
        options: [
          { label: 'Put out a wet floor sign and mop it up right away', till: -1, risk: -6, good: true, tip: 'A quick wet-floor sign and cleanup is the single most basic slip-and-fall prevention step in retail.' },
          { label: 'Leave it — someone will notice and avoid it', till: 0, risk: 10, good: false, tip: 'An unmarked spill is how a customer or coworker gets hurt, and a lawsuit costs far more than two minutes with a mop.' },
        ],
      },
      {
        id: 'unattended_register',
        prompt: 'A coworker asks you to watch their register while they run to the back.',
        options: [
          { label: 'Ask them to lock it or grab a manager to cover it properly', till: 0, risk: -4, good: true, tip: 'An unattended open register is an easy target — proper coverage takes ten extra seconds.' },
          { label: 'Just keep an eye on it from across the store', till: 0, risk: 8, good: false, tip: '"Keeping an eye on it" from a distance does not actually prevent someone from walking up to an open drawer.' },
        ],
      },
      {
        id: 'name_tag',
        prompt: 'You forgot your name tag today.',
        options: [
          { label: 'Ask if there\'s a spare or borrow a clipboard tag for the shift', till: 0, risk: -2, good: true, tip: 'Small as it seems, being identifiable is part of the basic trust customers expect from staff.' },
          { label: 'Just work without one — nobody will notice', till: 0, risk: 3, good: false, tip: 'It usually does get noticed, and it\'s an easy first thing for a manager to flag.' },
        ],
      },
      {
        id: 'messy_shelf',
        prompt: 'It\'s a slow ten minutes with no customers in your section.',
        options: [
          { label: 'Straighten and re-face the shelves', till: 1, risk: -2, good: true, tip: 'Using downtime for tidying is standard, expected, and makes the next customer\'s experience better.' },
          { label: 'Sit on your phone until someone walks up', till: 0, risk: 4, good: false, tip: 'A manager walking by during a "dead" ten minutes sees exactly how that time gets used.' },
        ],
      },
      {
        id: 'customer_question',
        prompt: 'A customer asks a product question you don\'t know the answer to.',
        options: [
          { label: 'Say you\'ll check and ask a coworker or manager', till: 0, risk: -2, good: true, tip: 'Getting the real answer beats guessing — a wrong answer can cost a sale or a return later.' },
          { label: 'Make up an answer that sounds plausible', till: 0, risk: 6, good: false, tip: 'A confident wrong answer is worse than "let me check" — it can lead to a return, a complaint, or a safety issue depending on the product.' },
        ],
      },
      {
        id: 'break_time',
        prompt: 'Your scheduled break is right in the middle of a small rush.',
        options: [
          { label: 'Let a manager know and take it a few minutes late once it clears', till: 1, risk: -1, good: true, tip: 'Communicating a short delay, rather than either skipping the break entirely or walking off mid-rush, is the balanced call.' },
          { label: 'Walk off exactly on schedule no matter what\'s happening at the counter', till: -2, risk: 5, good: false, tip: 'Leaving a live rush with zero coverage or communication creates chaos your coworkers have to absorb.' },
        ],
      },
    ],
  },

  '3-5': {
    title: 'Weekday Rush',
    startingTill: 45,
    startingRisk: 20,
    incomePerDay: 9,
    cardPool: [
      {
        id: 'no_receipt_return',
        prompt: 'A customer wants to return an item with no receipt, past the normal window.',
        options: [
          { label: 'Offer store credit at the lowest recent sale price, per policy', till: 1, risk: -3, good: true, tip: 'This is the standard middle-ground most retailers train for exactly this situation — neither a flat refusal nor a full cash refund.' },
          { label: 'Just give a full cash refund to avoid an argument', till: -4, risk: 6, good: false, tip: 'Caving on policy under pressure is exactly how "no receipt" returns quietly become a shrink category of their own.' },
        ],
      },
      {
        id: 'price_check',
        prompt: 'The scanner won\'t read a barcode and there\'s no visible tag.',
        options: [
          { label: 'Do a manual price check before ringing it up', till: 0, risk: -2, good: true, tip: 'Guessing a price either shortchanges the store or overcharges the customer — a quick check avoids both.' },
          { label: 'Estimate a price that seems close', till: -1, risk: 4, good: false, tip: 'An estimated price, done enough times across a shift, adds up to real revenue lost — or real customer complaints.' },
        ],
      },
      {
        id: 'late_delivery',
        prompt: 'A supplier delivery arrives with two boxes visibly damaged in transit.',
        options: [
          { label: 'Note the damage on the delivery slip before signing and photograph it', till: 0, risk: -3, good: true, tip: 'Documenting damage at the door is what actually gets you credited by the supplier — signing clean paperwork on damaged goods forfeits that.' },
          { label: 'Sign for it as-is to get the driver moving faster', till: -3, risk: 3, good: false, tip: 'A clean signature on a damaged shipment usually means the store eats the cost, not the supplier.' },
        ],
      },
      {
        id: 'register_down',
        prompt: 'One POS terminal freezes mid-transaction with a line forming.',
        options: [
          { label: 'Move the customer to another open register and flag the frozen one for IT/a manager', till: 0, risk: -2, good: true, tip: 'Keeping the line moving while flagging the actual problem is the balance — panicking or ignoring it both make things worse.' },
          { label: 'Keep restarting it yourself for ten minutes while the line grows', till: -3, risk: 4, good: false, tip: 'A growing line during a fixable-but-stuck problem is its own cost — escalate faster than that.' },
        ],
      },
      {
        id: 'upsell_pressure',
        prompt: 'A manager pushes hard for everyone to upsell the extended warranty on every sale today.',
        options: [
          { label: 'Mention it once when genuinely relevant, and respect a "no thanks"', till: 1, risk: -1, good: true, tip: 'A single relevant mention, respected when declined, keeps the sale honest without leaving money on the table.' },
          { label: 'Keep pushing every customer until most of them say yes just to end the conversation', till: 2, risk: 5, good: false, tip: 'Short-term numbers look good, but pressured upsells are exactly the kind of thing that turns into complaints, chargebacks, and reviews.' },
        ],
      },
      {
        id: 'coworker_shortcut',
        prompt: 'A coworker suggests skipping the cash-count verification step to save time before close.',
        options: [
          { label: 'Do the count anyway — it\'s a control, not a suggestion', till: 0, risk: -3, good: true, tip: 'Verification steps exist specifically for the days everyone feels rushed — skipping them "just this once" is how discrepancies go unexplained.' },
          { label: 'Skip it just this once to get out on time', till: 0, risk: 6, good: false, tip: 'One skipped count is rarely caught — until the day it would have caught something real.' },
        ],
      },
      {
        id: 'fitting_room',
        prompt: 'The fitting room area is unstaffed and starting to pile up with unreturned items.',
        options: [
          { label: 'Rotate someone through briefly to reset it and log any damaged items found', till: 0, risk: -2, good: true, tip: 'An unmonitored fitting room is both a shrink risk and a presentation problem — a quick rotation handles both.' },
          { label: 'Leave it until closing when there\'s more time', till: -1, risk: 4, good: false, tip: 'A pile of unreturned merchandise sitting for hours is easy cover for items to go missing.' },
        ],
      },
    ],
  },

  '6-8': {
    title: 'Holiday Rush Week',
    startingTill: 60,
    startingRisk: 25,
    incomePerDay: 12,
    cardPool: [
      {
        id: 'distraction_theft',
        prompt: 'Two customers seem to be working together — one asking rapid-fire questions while the other lingers near an unlocked case.',
        options: [
          { label: 'Discreetly alert a manager or loss prevention and keep serving normally', till: 0, risk: -4, good: true, tip: 'This is the trained response: observe and escalate, never confront or accuse on your own.' },
          { label: 'Confront them directly and ask what they\'re doing', till: -2, risk: 8, good: false, tip: 'Direct confrontation by front-line staff is both a safety risk and, if you\'re wrong, a liability risk for the store.' },
        ],
      },
      {
        id: 'understaffed_holiday',
        prompt: 'Two call-outs on the busiest day of the week and you\'re the shift lead.',
        options: [
          { label: 'Re-cover critical stations first (entrance, registers) and call for backup before pulling from elsewhere', till: -2, risk: -2, good: true, tip: 'Prioritizing entrance and registers first protects the highest-risk and highest-throughput points before anything else.' },
          { label: 'Leave the floor as scheduled and hope it works out', till: -6, risk: 9, good: false, tip: 'An unaddressed staffing gap on the busiest day tends to compound — long lines, unwatched exits, and frustrated customers all at once.' },
        ],
      },
      {
        id: 'angry_customer_escalation',
        prompt: 'A cashier escalates an angry customer to you after their own de-escalation attempt didn\'t work.',
        options: [
          { label: 'Introduce yourself, listen fresh, and offer what\'s within your authority to resolve', till: 1, risk: -3, good: true, tip: 'A fresh ear and real authority to act is usually what an escalation actually needed — repeating the same conversation rarely helps.' },
          { label: 'Back the cashier without hearing the customer out again', till: -3, risk: 4, good: false, tip: 'Skipping straight to "the employee was right" without listening tends to escalate rather than resolve.' },
        ],
      },
      {
        id: 'skimmer_suspicion',
        prompt: 'One card reader looks slightly different from its neighbors — a small attachment over the slot.',
        options: [
          { label: 'Take that register offline and report it before anyone else uses it', till: -2, risk: -6, good: true, tip: 'A card skimmer left in place can compromise every customer who uses that reader — losing one register for an hour is far cheaper than that.' },
          { label: 'Assume it\'s fine and keep the line moving', till: 1, risk: 9, good: false, tip: 'Skimmers are built to look like they belong — assuming it\'s fine is exactly the gap they rely on.' },
        ],
      },
      {
        id: 'overtime_decision',
        prompt: 'The floor is still slammed at closing time and one associate is approaching overtime.',
        options: [
          { label: 'Check labor rules and either authorize the OT properly or send them home and cover the gap yourself', till: -1, risk: -3, good: true, tip: 'Unauthorized or unrecorded overtime is a real wage-and-hour compliance issue — handle it through the actual process, not by ignoring the clock.' },
          { label: 'Just let the clock keep running without logging it properly', till: 1, risk: 7, good: false, tip: 'Off-the-books or unlogged overtime is one of the more common sources of labor-law exposure in retail.' },
        ],
      },
      {
        id: 'damaged_return_fraud',
        prompt: 'A customer returns a clearly used, damaged item claiming it arrived that way, without a receipt.',
        options: [
          { label: 'Follow the documented no-receipt/damaged-item policy and involve a manager if it\'s outside your authority', till: 0, risk: -3, good: true, tip: 'Return fraud is a real shrink category — following the actual documented process (rather than a gut call either way) is what protects both the store and honest customers.' },
          { label: 'Refuse outright without checking policy, to be safe', till: 0, risk: 3, good: false, tip: 'An inconsistent refusal that isn\'t backed by actual policy creates its own complaints and inconsistency across shifts.' },
        ],
      },
      {
        id: 'exit_alarm',
        prompt: 'The security tag alarm sounds as a customer who paid is walking out.',
        options: [
          { label: 'Politely ask them to step back in so a tag can be checked — no physical stop', till: 0, risk: -2, good: true, tip: 'A polite check-in resolves the (usually accidental) false alarm without any legal or safety risk.' },
          { label: 'Physically block the exit until it\'s sorted out', till: -1, risk: 6, good: false, tip: 'Physically detaining a customer — even with good intentions — is exactly what most retail training explicitly prohibits, for safety and liability reasons.' },
        ],
      },
    ],
  },

  '9-12': {
    title: 'Shift Lead Gauntlet',
    startingTill: 80,
    startingRisk: 30,
    incomePerDay: 15,
    cardPool: [
      {
        id: 'till_discrepancy',
        prompt: 'A register is $40 short at close after two recounts.',
        options: [
          { label: 'Document it per the actual discrepancy procedure and flag it up — don\'t cover it personally', till: -2, risk: -5, good: true, tip: 'A properly logged discrepancy is a data point that might reveal a real process problem. Covering it personally hides that signal entirely.' },
          { label: 'Quietly cover the $40 yourself so it balances on paper', till: -2, risk: 8, good: false, tip: 'Personally covering a shortage erases the record that something needs investigating — and sets a precedent that discrepancies just get absorbed.' },
        ],
      },
      {
        id: 'price_match_pressure',
        prompt: 'A customer wants a price match well outside your approval limit.',
        options: [
          { label: 'Explain your limit clearly and involve a manager for anything beyond it', till: 0, risk: -3, good: true, tip: 'Approval limits exist precisely so no single person can unilaterally set pricing outside policy — respecting yours, even under pressure, is the job.' },
          { label: 'Approve it yourself to avoid an awkward conversation', till: -4, risk: 6, good: false, tip: 'Overriding your own authority "just this once" undermines the entire point of having authority limits at all.' },
        ],
      },
      {
        id: 'dual_control_drop',
        prompt: 'It\'s time for the midday cash drop and your usual second person is on break.',
        options: [
          { label: 'Wait a few minutes or pull in another verified staff member — keep dual control intact', till: -1, risk: -4, good: true, tip: 'Dual control on cash drops protects everyone involved — a short delay is a much smaller cost than breaking that control.' },
          { label: 'Do the drop alone this one time to stay on schedule', till: 1, risk: 7, good: false, tip: 'A single "just this once" solo drop is exactly the kind of gap that both invites and can\'t rule out theft.' },
        ],
      },
      {
        id: 'safety_incident',
        prompt: 'An associate reports a minor injury from a fall in the stockroom.',
        options: [
          { label: 'File the incident report immediately per procedure, regardless of how minor it seems', till: -1, risk: -6, good: true, tip: 'Under-the-radar "minor" injuries that go unreported are how a pattern (a hazard that keeps hurting people) never gets fixed — and it\'s often a legal reporting requirement besides.' },
          { label: 'Tell them to shake it off since it\'s not serious', till: 0, risk: 9, good: false, tip: 'Dismissing an injury report — even a minor one — both risks the employee\'s wellbeing and creates real liability if it turns out to be worse than it looked.' },
        ],
      },
      {
        id: 'closing_understaffed',
        prompt: 'You\'re closing alone tonight because the second closer no-showed.',
        options: [
          { label: 'Call a manager for guidance on closing-alone policy before proceeding', till: -1, risk: -5, good: true, tip: 'Many retailers explicitly restrict solo closing for safety reasons (cash handling, walking to a car alone) — checking policy beats guessing under pressure.' },
          { label: 'Just close alone as usual without checking anything', till: 1, risk: 6, good: false, tip: 'Skipping the check might be fine ninety-nine times — it\'s the hundredth that a policy like this exists to prevent.' },
        ],
      },
      {
        id: 'employee_theft_suspicion',
        prompt: 'You notice a pattern of small voids on one associate\'s register, always right before their shift ends.',
        options: [
          { label: 'Document the pattern with specifics and report it to a manager or loss prevention — don\'t confront alone', till: 0, risk: -5, good: true, tip: 'Internal-theft investigations need documentation and the right people involved — a shift lead confronting alone can compromise the investigation and create legal exposure.' },
          { label: 'Confront them directly on the floor and demand an explanation', till: -1, risk: 7, good: false, tip: 'A direct floor confrontation, before anything is actually confirmed, can be a defamation and workplace-conduct risk even if the suspicion turns out to be right.' },
        ],
      },
      {
        id: 'schedule_favoritism',
        prompt: 'You need volunteers for an unpopular holiday shift and one associate keeps getting picked.',
        options: [
          { label: 'Rotate it fairly or use a transparent method (sign-up, seniority rule) instead of always picking the same person', till: -1, risk: -3, good: true, tip: 'Consistent, fair scheduling isn\'t just good management — it avoids real claims of favoritism or retaliation that can become HR or legal issues.' },
          { label: 'Keep assigning it to whoever is easiest to lean on', till: 1, risk: 5, good: false, tip: 'Leaning on the same person repeatedly because they don\'t push back is how burnout and turnover — and sometimes real complaints — build quietly.' },
        ],
      },
    ],
  },
};

export default SHIFT_BANK;
