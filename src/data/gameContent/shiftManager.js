// src/data/gameContent/shiftManager.js
// Shift Manager — a Reigns-style day-by-day retail-operations survival
// game, structurally identical to surviveMonth.js: one card per shift,
// 2-3 options each, sampled without repeats from that tier's pool. Two
// resources instead of Cash/Stress:
//   Till  — the shift's operating health (payroll hours covered, sales
//           target, supplies). Hits $0 and the shift is a bust.
//   Risk  — accumulated loss-prevention/safety/compliance exposure from
//           corner-cutting. Maxing it out forces an "incident" (an audit
//           finding, a safety citation, a bad review that goes viral) —
//           expensive, but not an automatic game over, same as burnout in
//           surviveMonth.js.
// `good: true/false` on each option is what the round's correct/total
// score is measured against: "which call reflects sound retail work."
//
// Sound retail work is not "always escalate" or "always follow the
// strictest reading". Some cards reward just handling it (a return you're
// allowed to process, a coupon inside the grace period, a shift swap that
// breaks no rules), and the over-cautious answer is the wrong one. Options
// are written at similar lengths and the game shuffles them when a card is
// dealt; scripts/check-games.mjs keeps both of those true.

export const SHIFT_BANK = {
  'K-2': {
    title: 'Opening Shift Basics',
    startingTill: 30,
    startingRisk: 15,
    incomePerDay: 6,
    cardPool: [
      {
        id: 'wet_floor',
        prompt: 'A customer spills a drink near the front door.',
        options: [
          { label: 'Put out a wet-floor sign, then mop it', till: -1, risk: -6, good: true, tip: 'The sign warns people right away, and mopping fixes it.' },
          { label: 'Mop it later when the store is quiet', till: 0, risk: 8, good: false, tip: 'Someone could slip before then. Spills get cleaned right away.' },
          { label: 'Cover it with paper towels and move on', till: 0, risk: 5, good: false, tip: 'Wet paper towels are slippery too. Sign it and mop it.' },
        ],
      },
      {
        id: 'batteries',
        prompt: "A customer asks where the batteries are. You're not sure.",
        options: [
          { label: "Say you'll find out, and ask a coworker", till: 1, risk: -2, good: true, tip: 'Finding the real answer is better than guessing.' },
          { label: 'Point to an aisle that seems right', till: -1, risk: 3, good: false, tip: 'A wrong guess sends them wandering. It is okay to say "let me check."' },
          { label: "Tell them you don't work in that section", till: -1, risk: 2, good: false, tip: 'Customers don\'t know sections. Help them find it.' },
        ],
      },
      {
        id: 'line_waiting',
        prompt: 'Three people are waiting in your line. A coworker waves you over to chat.',
        options: [
          { label: 'Wave back and keep checking people out', till: 1, risk: -1, good: true, tip: 'Customers first. Chat when the line is empty.' },
          { label: "Go over quickly, it's only a minute", till: -2, risk: 3, good: false, tip: 'A minute feels long when you are the one waiting.' },
        ],
      },
      {
        id: 'break_time',
        prompt: 'Your break starts now, but you are halfway through ringing up a customer.',
        options: [
          { label: 'Finish this customer, then take your break', till: 1, risk: -1, good: true, tip: 'Finish what you started, then rest.' },
          { label: 'Stop right away, breaks are on a schedule', till: -2, risk: 4, good: false, tip: 'Leaving a customer mid-sale is confusing and rude.' },
          { label: 'Skip your break so nobody has to cover', till: 0, risk: 3, good: false, tip: 'Breaks matter. Tell a manager if it is hard to take one.' },
        ],
      },
      {
        id: 'dropped_jar',
        prompt: 'A customer drops a jar of pickles. It breaks, and they look embarrassed.',
        options: [
          { label: "Make sure they're okay, then clean it up", till: -1, risk: -4, good: true, tip: 'Accidents happen. Kindness and a quick cleanup are the job.' },
          { label: 'Tell them they have to pay for the jar', till: 1, risk: 4, good: false, tip: 'Most stores do not charge customers for accidents.' },
          { label: 'Hand them a broom so they can clean it up', till: 0, risk: 6, good: false, tip: 'Broken glass is a job for staff, not customers.' },
        ],
      },
      {
        id: 'sold_out',
        prompt: 'A customer is upset because the toy they wanted is sold out.',
        options: [
          { label: 'Say sorry and offer to check another store', till: 1, risk: -3, good: true, tip: 'Staying calm and offering a next step turns a bad day around.' },
          { label: 'Explain it is not your fault it sold out', till: -1, risk: 3, good: false, tip: 'True, but it does not help them. Offer a next step.' },
          { label: 'Give them space and walk away until they calm down', till: -1, risk: 4, good: false, tip: 'Walking away makes people more upset.' },
        ],
      },
      {
        id: 'done_early',
        prompt: 'You finished your job early.',
        options: [
          { label: 'Ask your supervisor what to do next', till: 1, risk: -2, good: true, tip: 'Asking for the next job shows you are someone they can count on.' },
          { label: 'Sit in the back and play on your phone', till: 0, risk: 4, good: false, tip: 'You are still on the clock.' },
          { label: "Go home early since you're done", till: 0, risk: 5, good: false, tip: 'Leaving before your shift ends without asking is walking off the job.' },
        ],
      },
      {
        id: 'fire_exit',
        prompt: 'Delivery boxes are stacked in front of the emergency exit.',
        options: [
          { label: 'Move the boxes out of the way now', till: 0, risk: -6, good: true, tip: 'An exit has to be clear every minute, not later.' },
          { label: 'Tell the manager at the end of your shift', till: 0, risk: 7, good: false, tip: 'If there is a fire before then, people cannot get out. Fix it now.' },
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
        prompt: 'Shoes come back 40 days later with no receipt. Policy says store credit at the lowest recent price.',
        options: [
          { label: 'Offer store credit, like the policy says', till: 1, risk: -3, good: true, tip: 'The policy already has an answer for this. Use it.' },
          { label: 'Give a full cash refund to keep them happy', till: -4, risk: 6, good: false, tip: 'Cash refunds with no receipt are how return fraud works.' },
          { label: "Say you can't take returns without a receipt", till: -1, risk: 3, good: false, tip: 'The policy allows store credit. A flat no is wrong here.' },
        ],
      },
      {
        id: 'receipt_return',
        prompt: 'A customer has a receipt and wants to return a shirt within 30 days. You are trained on returns.',
        options: [
          { label: 'Process the return yourself', till: 1, risk: -1, good: true, tip: 'You are allowed to do this. Handle it and keep the line moving.' },
          { label: 'Call a manager to approve it first', till: -2, risk: 1, good: false, tip: 'Calling a manager for something you can do slows everyone down.' },
          { label: 'Offer store credit instead of a refund', till: 0, risk: 3, good: false, tip: 'With a receipt inside 30 days, the customer gets a refund.' },
        ],
      },
      {
        id: 'no_barcode',
        prompt: "An item won't scan and has no price tag.",
        options: [
          { label: 'Call for a quick price check', till: 0, risk: -2, good: true, tip: 'A price check is fair to the customer and the store.' },
          { label: 'Guess a price that seems close', till: -1, risk: 4, good: false, tip: 'Guessing over and over loses the store money, or overcharges people.' },
          { label: 'Give it to them free for the trouble', till: -3, risk: 3, good: false, tip: 'That is not your call to make.' },
        ],
      },
      {
        id: 'shelf_price',
        prompt: 'The shelf tag says $5, but the item rings up at $8.',
        options: [
          { label: 'Charge $5 and tell someone to fix the tag', till: -1, risk: -3, good: true, tip: 'Most stores honor the posted price. Then fix the tag.' },
          { label: 'Charge $8, since the register is right', till: 1, risk: 4, good: false, tip: 'Charging more than the posted price angers customers, and in many places it breaks the law.' },
          { label: 'Tell them to pick a different item', till: -1, risk: 3, good: false, tip: 'The mistake was the store\'s, not theirs.' },
        ],
      },
      {
        id: 'frozen_register',
        prompt: 'Your register freezes and a line is forming.',
        options: [
          { label: 'Move the line to another register, tell a manager', till: 0, risk: -2, good: true, tip: 'Keep people moving and get the right person to fix it.' },
          { label: 'Keep restarting it yourself until it finally works again', till: -3, risk: 4, good: false, tip: 'Ten minutes of restarts is ten minutes of waiting customers.' },
        ],
      },
      {
        id: 'warranty',
        prompt: 'Your manager wants everyone to offer the extended warranty today.',
        options: [
          { label: "Offer it once and accept a 'no'", till: 1, risk: -1, good: true, tip: 'One honest mention does the job without pushing anyone.' },
          { label: 'Keep asking until most people say yes', till: 2, risk: 5, good: false, tip: 'Pushy selling leads to returns and complaints.' },
          { label: "Don't bring it up, it feels pushy", till: -1, risk: 1, good: false, tip: 'Offering once is part of the job, and some people want it.' },
        ],
      },
      {
        id: 'slow_hour',
        prompt: 'It is a slow hour with no customers.',
        options: [
          { label: 'Restock and straighten the shelves', till: 1, risk: -2, good: true, tip: 'Slow time is for getting the store ready for busy time.' },
          { label: 'Stand at the register in case someone comes', till: 0, risk: 1, good: false, tip: 'You can see the door from the aisles. Get something done.' },
          { label: 'Check your phone until someone walks in', till: 0, risk: 3, good: false, tip: 'Managers notice how slow time gets used.' },
        ],
      },
      {
        id: 'damaged_delivery',
        prompt: 'A delivery arrives with two boxes crushed.',
        options: [
          { label: 'Note the damage on the slip before you sign', till: 0, risk: -3, good: true, tip: 'Noting damage before you sign is how the store gets credit.' },
          { label: 'Sign for it now so the driver can get going', till: -3, risk: 3, good: false, tip: 'A clean signature means the store pays for the damage.' },
          { label: 'Refuse the whole delivery', till: -2, risk: 1, good: false, tip: 'The rest of it is fine and you need it. Just note the damage.' },
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
        id: 'suspicious_pair',
        prompt: 'One person keeps you busy with questions while their friend hangs around an unlocked case.',
        options: [
          { label: 'Quietly tell a manager and keep an eye out', till: 0, risk: -4, good: true, tip: 'Watch and report. Never confront or accuse on your own.' },
          { label: 'Walk over and ask them what they are doing', till: -2, risk: 8, good: false, tip: 'Confronting people is unsafe, and if you are wrong it is a big problem.' },
          { label: 'Ignore it, security is not your job', till: -3, risk: 6, good: false, tip: 'Reporting what you see is everyone\'s job.' },
        ],
      },
      {
        id: 'call_outs',
        prompt: "Two people called out on the busiest day. You're the shift lead.",
        options: [
          { label: 'Cover registers and the door first, then call people in', till: -2, risk: -2, good: true, tip: 'Protect the busiest spots first, then find backup.' },
          { label: 'Keep the plan as scheduled and hope it works', till: -6, risk: 9, good: false, tip: 'Staff gaps on a busy day get worse, not better.' },
          { label: 'Run a register yourself and leave the floor empty', till: -1, risk: 5, good: false, tip: 'A lead stuck on one register can\'t see the rest of the store.' },
        ],
      },
      {
        id: 'escalation',
        prompt: 'A cashier sends an angry customer to you.',
        options: [
          { label: 'Listen to them again, then offer what you can', till: 1, risk: -3, good: true, tip: 'A fresh ear and real options are what an escalation needs.' },
          { label: 'Tell them the cashier already answered', till: -3, risk: 4, good: false, tip: 'Repeating "no" without listening makes it worse.' },
          { label: 'Give them whatever they are asking for', till: -4, risk: 3, good: false, tip: 'Giving in every time teaches people to yell.' },
        ],
      },
      {
        id: 'skimmer',
        prompt: 'One card reader has an odd piece stuck over the slot.',
        options: [
          { label: 'Close that register and report it', till: -2, risk: -6, good: true, tip: 'A skimmer steals card numbers from every customer who uses it.' },
          { label: 'Pull the piece off and keep going', till: 0, risk: 5, good: false, tip: 'It is evidence. Leave it for the manager or police.' },
          { label: "Assume it's fine and keep the line moving", till: 1, risk: 9, good: false, tip: 'Skimmers are made to look like they belong.' },
        ],
      },
      {
        id: 'coupon_grace',
        prompt: "A regular's coupon expired yesterday. Store rules let you take coupons up to 7 days late.",
        options: [
          { label: 'Accept the coupon', till: -1, risk: -1, good: true, tip: 'The rule says you can. Using it keeps a regular happy.' },
          { label: "Refuse it, since it's expired", till: 1, risk: 3, good: false, tip: 'The grace period is there for exactly this.' },
          { label: 'Call a manager to decide', till: -1, risk: 1, good: false, tip: 'You already know the rule. No need to hold the line.' },
        ],
      },
      {
        id: 'overtime',
        prompt: 'An associate is about to go into overtime during the rush.',
        options: [
          { label: 'Get it approved, or send them home', till: -1, risk: -3, good: true, tip: 'Overtime has to be approved and paid. That is the law.' },
          { label: 'Have them clock out but keep helping', till: 1, risk: 8, good: false, tip: 'Unpaid work is wage theft, even if they agree to it.' },
        ],
      },
      {
        id: 'tag_alarm',
        prompt: 'The door alarm beeps as a customer who paid walks out.',
        options: [
          { label: 'Politely ask them to step back in for a quick check', till: 0, risk: -2, good: true, tip: 'It is usually a tag someone forgot. A friendly check fixes it.' },
          { label: 'Stand in the doorway so they cannot leave', till: -1, risk: 6, good: false, tip: 'Physically stopping a customer is unsafe and against most store rules.' },
          { label: 'Follow them into the parking lot', till: -1, risk: 7, good: false, tip: 'Chasing people is dangerous for everyone.' },
        ],
      },
      {
        id: 'gift_cards',
        prompt: 'A nervous older customer on the phone wants $500 in gift cards "to pay a bill."',
        options: [
          { label: 'Gently ask who told them to pay with gift cards', till: 0, risk: -4, good: true, tip: 'Real bills are never paid with gift cards. That is a common scam.' },
          { label: 'Ring it up, since how they pay a bill is their business', till: 2, risk: 5, good: false, tip: 'Scammers love gift cards because the money can\'t be traced.' },
          { label: 'Refuse to sell them any gift cards', till: -1, risk: 2, good: false, tip: 'Ask and explain. Flatly refusing does not help them see the scam.' },
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
        id: 'short_register',
        prompt: 'A register is $40 short at close after two recounts.',
        options: [
          { label: 'Log the shortage and tell your manager', till: -2, risk: -5, good: true, tip: 'A logged shortage is data. A pattern of them points to a real problem.' },
          { label: 'Cover the $40 yourself so it balances', till: -2, risk: 8, good: false, tip: 'Covering it hides the record that something needs a look.' },
          { label: "Borrow it from tomorrow's starting cash", till: 0, risk: 7, good: false, tip: 'Moving money between drawers hides the problem and creates a new one.' },
        ],
      },
      {
        id: 'price_match',
        prompt: 'A customer wants a price match that is above your approval limit.',
        options: [
          { label: 'Explain your limit and bring in a manager', till: 0, risk: -3, good: true, tip: 'Limits are why no one person sets prices alone.' },
          { label: 'Approve it to avoid an argument', till: -4, risk: 6, good: false, tip: 'Going past your limit "just once" undoes the point of limits.' },
          { label: 'Tell them the store does not price match', till: -1, risk: 3, good: false, tip: 'It does. It just needs someone with the right approval.' },
        ],
      },
      {
        id: 'shift_swap',
        prompt: 'Two associates agreed to swap shifts. It causes no overtime and both are trained.',
        options: [
          { label: 'Approve it and update the schedule', till: 1, risk: -1, good: true, tip: 'Easy swaps that break no rules keep people happy to stay.' },
          { label: 'Say no, the schedule is already posted', till: -1, risk: 3, good: false, tip: 'Being rigid for no reason is how good people quit.' },
          { label: 'Make them ask the store manager', till: -1, risk: 1, good: false, tip: 'This is exactly the kind of thing a shift lead can handle.' },
        ],
      },
      {
        id: 'cash_drop',
        prompt: "It's time for the midday cash drop, and your second person is on break.",
        options: [
          { label: 'Wait a few minutes or grab another trained person', till: -1, risk: -4, good: true, tip: 'Two people on a cash drop protects everyone. A short wait is fine.' },
          { label: 'Do it alone this one time to stay on schedule', till: 1, risk: 7, good: false, tip: 'A solo drop leaves no one able to vouch for you if cash goes missing.' },
        ],
      },
      {
        id: 'minor_injury',
        prompt: 'An associate slipped in the stockroom and scraped their arm.',
        options: [
          { label: 'Do first aid and file an incident report', till: -1, risk: -6, good: true, tip: 'Reports catch hazards that keep hurting people, and protect the worker.' },
          { label: "Tell them to shake it off, since it's only a scrape", till: 0, risk: 9, good: false, tip: 'Small injuries can turn out worse. And the hazard is still there.' },
          { label: 'Only file a report if it gets worse', till: 0, risk: 6, good: false, tip: 'A late report is harder to trust and harder to act on.' },
        ],
      },
      {
        id: 'raise_request',
        prompt: 'Your best seller asks you for a raise. You do not set pay.',
        options: [
          { label: 'Bring their numbers to the store manager', till: 0, risk: -2, good: true, tip: 'Backing a good worker with facts is how raises get approved.' },
          { label: 'Promise them a raise so they don\'t leave for another store', till: 0, risk: 6, good: false, tip: 'A promise you can\'t keep costs more trust than a "let me ask."' },
          { label: 'Tell them pay is not your department', till: -1, risk: 3, good: false, tip: 'True, but good leads speak up for their people.' },
        ],
      },
      {
        id: 'void_pattern',
        prompt: "One associate's register shows small voids, always right before their shift ends.",
        options: [
          { label: 'Write down the dates and tell loss prevention', till: 0, risk: -5, good: true, tip: 'Theft checks need records and the right people. Not a floor argument.' },
          { label: 'Confront them on the floor and ask for answers', till: -1, risk: 7, good: false, tip: 'Accusing someone before it is confirmed can backfire badly.' },
          { label: "Let it go, it's only a few dollars", till: -2, risk: 6, good: false, tip: 'Small patterns that go unchecked tend to grow.' },
        ],
      },
      {
        id: 'holiday_shift',
        prompt: 'Nobody wants the holiday shift. One quiet associate keeps getting it.',
        options: [
          { label: 'Use a fair rotation or a sign-up sheet', till: -1, risk: -3, good: true, tip: 'Fair rules for unpopular shifts stop burnout and complaints.' },
          { label: 'Keep giving it to whoever never complains', till: 1, risk: 5, good: false, tip: 'Leaning on the quiet person is how you lose them.' },
        ],
      },
    ],
  },
};

export default SHIFT_BANK;
