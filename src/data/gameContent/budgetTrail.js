// src/data/gameContent/budgetTrail.js
// Budget Trail v2 — a real budgeting simulation, not a single checkbox
// list compared against a threshold. Every round now has FIVE moving
// parts instead of one:
//   1. income      — cash arrives at the start of the round (a paycheck/
//                    allowance) — v1 only ever spent down a starting
//                    balance with nothing coming back in.
//   2. required[]  — one OR TWO non-negotiable bills (v1 only ever had
//                    one), so a tight round forces choosing which bill to
//                    prioritize if both can't be covered.
//   3. event       — randomly drawn each round from that band's pool
//                    (see EVENT_POOLS below) — a windfall or a shock
//                    applied automatically. Unlike v1's one hand-placed
//                    "Uh Oh" round, this can hit ANY round, so a safe
//                    route can't just be memorized.
//   4. optional[]  — 2-3 discretionary wants (up from v1's 0-1) freely
//                    toggled on/off.
//   5. a SAVINGS choice — Skip / Save some / Save a lot (see saveTiers).
//      This is the real addition: money saved moves into a separate
//      emergency fund that can bail out a bad round later (see
//      BudgetTrailGame.js's resolution logic) and is what the journey is
//      actually scored against at the end — not just "did you go
//      negative," but "did you build a real cushion."
//
// Required + chosen optional + chosen savings costing more than what's on
// hand no longer means instant game over the first time it happens — the
// shortfall is drawn from savings first (if there's enough saved up), and
// ONLY ends the journey if savings can't cover it either. That's the
// actual lesson: an emergency fund exists to absorb a shock; spending
// every dollar the moment it arrives leaves nothing to absorb one.
//
// Required costs and event severity both scale up round over round within
// a band, on top of the band-to-band scaling — a safe route through round
// 1 doesn't stay safe by round 4.

const EVENT_POOLS = {
  'K-2': [
    { label: 'A kind neighbor tips you extra!', delta: 3 },
    { label: 'A customer paid with a shiny coin — a keepsake, not spendable.', delta: -1 },
    { label: 'A cup cracked and needs replacing.', delta: -2 },
    { label: 'Nothing unusual happens this time.', delta: 0 },
  ],
  '3-5': [
    { label: 'You found a $5 bill in your coat pocket!', delta: 5 },
    { label: 'You helped a neighbor and earned a little extra.', delta: 4 },
    { label: 'You lost your library book and owe a fee.', delta: -4 },
    { label: 'Your favorite pencil case broke.', delta: -3 },
    { label: 'A quiet week — nothing unusual happens.', delta: 0 },
  ],
  '6-8': [
    { label: 'You picked up an extra shift and earned a bonus.', delta: 15 },
    { label: 'A relative sent you birthday money.', delta: 12 },
    { label: 'Your bike got a flat tire — repair time.', delta: -14 },
    { label: 'You left your jacket somewhere and had to replace it.', delta: -18 },
    { label: 'A normal week — nothing unusual happens.', delta: 0 },
  ],
  '9-12': [
    { label: 'A small tax refund shows up.', delta: 120 },
    { label: 'You picked up overtime this pay period.', delta: 90 },
    { label: "Your car's check-engine light means an unplanned repair.", delta: -160 },
    { label: 'A medical copay you weren\'t expecting.', delta: -95 },
    { label: 'Your landlord waives a small fee — nice surprise.', delta: 40 },
    { label: 'A normal pay period — nothing unusual happens.', delta: 0 },
  ],
};

export const TRAIL_BANK = {
  'K-2': {
    title: 'Lemonade Stand Summer',
    startingBalance: 10,
    savingsGoal: 10,
    saveTiers: [0, 2, 4],
    eventPool: EVENT_POOLS['K-2'],
    rounds: [
      {
        title: 'Opening Day',
        story: 'Your lemonade stand is open for business!',
        income: 6,
        required: [{ label: 'Cups', cost: 3 }],
        optional: [
          { label: 'Sticker decorations', cost: 3, flavor: 'Makes your stand look cool' },
          { label: 'Bigger sign', cost: 2, flavor: 'More customers might stop by' },
        ],
      },
      {
        title: 'Restocking',
        story: 'You need more lemons and sugar to keep selling.',
        income: 7,
        required: [{ label: 'Lemons', cost: 3 }, { label: 'Sugar', cost: 2 }],
        optional: [
          { label: 'Fancy pitcher', cost: 4, flavor: 'Looks nice, pours the same' },
          { label: 'Ice for cold lemonade', cost: 2, flavor: 'Customers like it cold' },
        ],
      },
      {
        title: 'Big Weekend Sale',
        story: 'A big event is coming — everyone will be thirsty!',
        income: 8,
        required: [{ label: 'Extra cups', cost: 3 }, { label: 'Extra sugar', cost: 3 }],
        optional: [
          { label: 'Balloons for the stand', cost: 3, flavor: 'Festive, but not needed' },
          { label: 'A helper for the day', cost: 4, flavor: 'Could sell more, costs more' },
        ],
      },
    ],
    lesson: 'Saving a little bit each round means you have something ready when a surprise cost shows up.',
  },

  '3-5': {
    title: 'School Year Budget',
    startingBalance: 25,
    savingsGoal: 20,
    saveTiers: [0, 3, 6],
    eventPool: EVENT_POOLS['3-5'],
    rounds: [
      {
        title: 'First Week',
        story: "It's the first week of school.",
        income: 12,
        required: [{ label: 'Backpack', cost: 8 }],
        optional: [
          { label: 'Trendy lunchbox', cost: 5, flavor: 'Looks cool, works the same as any other' },
          { label: 'Extra notebooks', cost: 3, flavor: 'Nice to have spares' },
        ],
      },
      {
        title: 'Getting Ready',
        story: 'You need books and supplies for class.',
        income: 14,
        required: [{ label: 'Textbooks', cost: 9 }, { label: 'Pencils & folders', cost: 4 }],
        optional: [
          { label: 'New video game', cost: 8, flavor: "Fun, but doesn't help at school" },
          { label: 'Art supplies', cost: 4, flavor: 'For a project you actually have' },
        ],
      },
      {
        title: 'Field Trip',
        story: 'Your class is going on a trip.',
        income: 12,
        required: [{ label: 'Field trip fee', cost: 10 }],
        optional: [
          { label: 'Souvenir', cost: 5, flavor: "A keepsake, but it's not the trip itself" },
          { label: 'Snack money', cost: 3, flavor: 'A little extra for the day' },
        ],
      },
      {
        title: 'Science Fair',
        story: 'Surprise! You need supplies for the science fair.',
        income: 14,
        required: [{ label: 'Science fair supplies', cost: 12 }, { label: 'Poster board', cost: 4 }],
        optional: [
          { label: 'Fancy display stand', cost: 6, flavor: 'Extra polish, not required to enter' },
        ],
      },
    ],
    lesson: "Unplanned costs come up — keeping some money saved means a surprise doesn't sink you.",
  },

  '6-8': {
    title: 'Summer Job Budget',
    startingBalance: 60,
    savingsGoal: 85,
    saveTiers: [0, 10, 20],
    eventPool: EVENT_POOLS['6-8'],
    rounds: [
      {
        title: 'Getting to Work',
        story: 'You need a bus pass for your summer job.',
        income: 90,
        required: [{ label: 'Bus pass', cost: 20 }],
        optional: [
          { label: 'New sneakers', cost: 30, flavor: 'Your old ones still work fine' },
          { label: 'Coffee runs', cost: 15, flavor: 'Adds up fast over a month' },
        ],
      },
      {
        title: 'Staying Connected',
        story: 'Your phone bill is due.',
        income: 95,
        required: [{ label: 'Phone bill', cost: 25 }, { label: 'Bus pass renewal', cost: 20 }],
        optional: [
          { label: 'Concert ticket', cost: 35, flavor: "A real want — you'll love it, but it's not free" },
          { label: 'Streaming subscription', cost: 12, flavor: 'Small, but it repeats every round' },
        ],
      },
      {
        title: 'Back to School Prep',
        story: 'You need supplies for the coming school year.',
        income: 100,
        required: [{ label: 'School supplies', cost: 22 }, { label: 'Bus pass renewal', cost: 20 }],
        optional: [
          { label: 'New clothes', cost: 28, flavor: 'Nice to have, not urgent' },
          { label: 'New headphones', cost: 18, flavor: "Your current pair still works" },
        ],
      },
      {
        title: 'A Big Ask',
        story: 'Your family needs help with a car insurance down payment.',
        income: 90,
        required: [{ label: 'Car insurance help', cost: 40 }, { label: 'Bus pass renewal', cost: 20 }],
        optional: [
          { label: "A friend's birthday gift", cost: 15, flavor: 'Thoughtful, but optional this round' },
        ],
      },
      {
        title: "Summer's End",
        story: 'One last stretch before summer job season wraps up.',
        income: 95,
        required: [{ label: 'Phone bill', cost: 25 }, { label: 'Bus pass renewal', cost: 20 }],
        optional: [
          { label: 'End-of-summer trip with friends', cost: 40, flavor: 'A big want, and it shows in the price' },
          { label: 'New backpack for fall', cost: 20, flavor: 'Yours is getting worn out, but it can wait' },
        ],
      },
    ],
    lesson: "The rounds you can't predict are exactly why you keep a cushion instead of spending everything that comes in.",
  },

  '9-12': {
    title: 'First Apartment Budget',
    startingBalance: 400,
    savingsGoal: 500,
    saveTiers: [0, 50, 100],
    eventPool: EVENT_POOLS['9-12'],
    rounds: [
      {
        title: 'Move-In',
        story: 'Your first month of rent is due.',
        income: 1800,
        required: [{ label: 'Rent', cost: 900 }, { label: 'Utility deposit', cost: 150 }],
        optional: [
          { label: 'Nice furniture upgrade', cost: 300, flavor: 'Basic furniture would work fine' },
          { label: 'Premium cable package', cost: 80, flavor: 'A cheaper plan covers the basics' },
        ],
      },
      {
        title: 'Settling In',
        story: 'Time to stock the fridge and get the utilities running.',
        income: 1800,
        required: [{ label: 'Rent', cost: 900 }, { label: 'Utilities', cost: 120 }],
        optional: [
          { label: 'Dining out', cost: 150, flavor: 'Cooking at home costs a fraction of this' },
          { label: 'New TV', cost: 250, flavor: "Your laptop screen works for now" },
        ],
      },
      {
        title: 'Staying Covered',
        story: 'Your insurance premium and groceries are both due.',
        income: 1850,
        required: [{ label: 'Rent', cost: 900 }, { label: 'Insurance premium', cost: 180 }, { label: 'Groceries', cost: 220 }],
        optional: [
          { label: 'Gym membership', cost: 60, flavor: 'A home workout is free' },
        ],
      },
      {
        title: 'A Rough Month',
        story: 'Bills keep coming whether or not anything went wrong this month.',
        income: 1800,
        required: [{ label: 'Rent', cost: 900 }, { label: 'Utilities', cost: 130 }, { label: 'Groceries', cost: 220 }],
        optional: [
          { label: 'Weekend trip', cost: 250, flavor: 'Memorable, but not cheap' },
        ],
      },
      {
        title: 'Staying On Track',
        story: 'Another routine month — rent, insurance, and groceries.',
        income: 1850,
        required: [{ label: 'Rent', cost: 900 }, { label: 'Insurance premium', cost: 180 }, { label: 'Groceries', cost: 220 }],
        optional: [
          { label: 'New phone upgrade', cost: 300, flavor: 'Your current phone still works' },
          { label: 'Concert tickets', cost: 140, flavor: "A fun want, not a need" },
        ],
      },
      {
        title: 'Rent Again',
        story: 'Another month, another rent payment — this is the real rhythm of it.',
        income: 1800,
        required: [{ label: 'Rent', cost: 900 }, { label: 'Utilities', cost: 130 }],
        optional: [
          { label: 'Furniture for the guest room', cost: 280, flavor: 'Nice, but no guests booked yet' },
          { label: 'Dining out', cost: 150, flavor: 'A treat, not a requirement' },
        ],
      },
    ],
    lesson: 'Rent comes back every single month — an emergency fund is what keeps one bad month from becoming a crisis.',
  },
};

export default TRAIL_BANK;
