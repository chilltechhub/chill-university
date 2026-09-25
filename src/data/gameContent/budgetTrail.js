// src/data/gameContent/budgetTrail.js
// Budget Trail — a multi-round budget with money coming in, bills going out,
// surprises, and a savings goal. Each round:
//   1. income arrives, plus any `payback` earned by earlier choices, minus
//      any `skipCost` coming due from something skipped last round
//   2. a random event from the band's pool (windfall or shock)
//   3. required bills
//   4. optional items, freely toggled. They are NOT all the same kind:
//        plain wants          cost money, nothing else
//        payback: n           an investment: +$n income every later round
//                             (a bigger lemonade sign, a bike for a paper
//                             route). Worth it early, pointless late.
//        skipCost: {cost,label}  cheap maintenance now; skip it and a
//                             bigger bill arrives next round (fix the
//                             leaky tire before it blows out)
//      Nothing on screen says which is which: the flavor line describes the
//      item honestly and the player has to judge. The round's feedback
//      reveals what each choice did.
//   5. a savings choice (Skip / Some / A lot). Money saved goes into an
//      emergency fund that covers a shortfall later and is what the
//      journey is scored against at the end.
//
// A shortfall is drawn from savings first and only ends the journey when
// savings can't cover it either.
//
// scripts/check-games.mjs plays every band thousands of times with fixed
// strategies and fails if the easy ones work:
//   buy everything         must usually miss the goal
//   buy nothing            must usually miss the goal (skipping the
//                          investments and repairs costs more than it saves)
//   invest + fix, no wants must usually reach it

const EVENT_POOLS = {
  'K-2': [
    { label: 'A neighbor tips you extra!', delta: 3 },
    { label: 'Your pitcher cracked. You need a new one.', delta: -2 },
    { label: 'A few lemons went bad.', delta: -1 },
    { label: 'A normal day.', delta: 0 },
    { label: 'A normal day.', delta: 0 },
  ],
  '3-5': [
    { label: 'You found $5 in your coat pocket!', delta: 5 },
    { label: 'You helped a neighbor and earned a little extra.', delta: 3 },
    { label: 'You lost a library book and owe a fee.', delta: -4 },
    { label: 'Your pencil case broke.', delta: -3 },
    { label: 'A quiet week.', delta: 0 },
  ],
  '6-8': [
    { label: 'You picked up an extra shift.', delta: 20 },
    { label: 'A relative sent birthday money.', delta: 15 },
    { label: 'You left your jacket somewhere and had to replace it.', delta: -18 },
    { label: 'Your phone screen cracked. Repair time.', delta: -25 },
    { label: 'A normal week.', delta: 0 },
  ],
  '9-12': [
    { label: 'A small tax refund shows up.', delta: 120 },
    { label: 'You picked up overtime.', delta: 90 },
    { label: 'An unexpected medical copay.', delta: -95 },
    { label: 'Your laptop charger died.', delta: -70 },
    { label: 'A normal month.', delta: 0 },
  ],
};

export const TRAIL_BANK = {
  'K-2': {
    title: 'Lemonade Stand Summer',
    startingBalance: 3,
    savingsGoal: 12,
    saveTiers: [0, 3, 6],
    eventPool: EVENT_POOLS['K-2'],
    rounds: [
      {
        title: 'Opening Day',
        story: 'Your lemonade stand is open for business!',
        income: 8,
        required: [{ label: 'Lemons & sugar', cost: 3 }],
        optional: [
          { label: 'Bigger sign', cost: 2, flavor: 'More people will see your stand from the street', payback: 3 },
          { label: 'Sparkly stickers', cost: 3, flavor: 'Makes your stand look cool' },
        ],
      },
      {
        title: 'Hot Weekend',
        story: 'It is going to be really hot this weekend.',
        income: 8,
        required: [{ label: 'Cups', cost: 2 }, { label: 'Lemons', cost: 3 }],
        optional: [
          { label: 'Bag of ice', cost: 2, flavor: 'On hot days, people want it cold', payback: 4 },
          { label: 'Tape for the wobbly table', cost: 1, flavor: 'One leg wiggles when you pour', skipCost: { cost: 5, label: 'The table tipped over. Spilled lemonade and cups' } },
          { label: 'Fancy pitcher', cost: 4, flavor: 'Pours the same as your old one' },
        ],
      },
      {
        title: 'Last Big Day',
        story: 'Summer is almost over. One more busy day!',
        income: 8,
        required: [{ label: 'Cups', cost: 2 }, { label: 'Lemons', cost: 3 }],
        optional: [
          { label: 'Balloons', cost: 3, flavor: 'Fun to look at' },
          { label: 'Toy from the store', cost: 4, flavor: 'Something just for you' },
        ],
      },
    ],
    lesson: 'Some spending helps you earn more, like a sign people can see. Other spending is just for fun. Saving a little each time adds up.',
  },

  '3-5': {
    title: 'Dog-Walking Business',
    startingBalance: 5,
    savingsGoal: 30,
    saveTiers: [0, 5, 10],
    eventPool: EVENT_POOLS['3-5'],
    rounds: [
      {
        title: 'Getting Started',
        story: 'You walk dogs for neighbors after school.',
        income: 12,
        required: [{ label: 'Poop bags', cost: 3 }],
        optional: [
          { label: 'Flyers for the neighborhood', cost: 4, flavor: 'More neighbors will know you walk dogs', payback: 5 },
          { label: 'Cool sunglasses', cost: 5, flavor: 'You would look great on walks' },
        ],
      },
      {
        title: 'Rainy Week',
        story: 'It rained all week. Your sneakers have a small hole.',
        income: 12,
        required: [{ label: 'Poop bags', cost: 3 }, { label: 'Dog treats', cost: 3 }],
        optional: [
          { label: 'Shoe patch kit', cost: 2, flavor: 'Fixes the hole before it gets bigger', skipCost: { cost: 12, label: 'The hole ripped open. New sneakers' } },
          { label: 'Video game', cost: 8, flavor: 'Something fun for rainy days' },
        ],
      },
      {
        title: 'Busy Season',
        story: 'Lots of families are going on vacation.',
        income: 13,
        required: [{ label: 'Poop bags', cost: 3 }, { label: 'Dog treats', cost: 3 }],
        optional: [
          { label: 'Second leash', cost: 3, flavor: 'Walk two dogs at once', payback: 6 },
          { label: 'Snack after walks', cost: 3, flavor: 'Yummy after a long walk' },
        ],
      },
      {
        title: 'Last Week of Summer',
        story: 'School starts soon.',
        income: 13,
        required: [{ label: 'Poop bags', cost: 3 }, { label: 'Dog treats', cost: 3 }],
        optional: [
          { label: 'Movie with friends', cost: 7, flavor: 'A fun way to end summer' },
          { label: 'Stickers', cost: 3, flavor: 'For your notebook' },
        ],
      },
    ],
    lesson: 'Spending that helps you earn, like flyers, can pay for itself. Fixing small problems early costs less than fixing big ones later.',
  },

  '6-8': {
    title: 'Summer Lawn-Mowing Job',
    startingBalance: 20,
    savingsGoal: 180,
    saveTiers: [0, 25, 50],
    eventPool: EVENT_POOLS['6-8'],
    rounds: [
      {
        title: 'First Customers',
        story: 'You mow lawns on your street.',
        income: 70,
        required: [{ label: 'Gas for the mower', cost: 15 }],
        optional: [
          { label: 'Edge trimmer', cost: 25, flavor: 'Neater lawns, so you can charge more per yard', payback: 18 },
          { label: 'New sneakers', cost: 35, flavor: 'Your old ones still work fine' },
        ],
      },
      {
        title: 'Blade Trouble',
        story: 'The mower blade is getting dull.',
        income: 70,
        required: [{ label: 'Gas for the mower', cost: 15 }, { label: 'Phone bill', cost: 20 }],
        optional: [
          { label: 'Blade sharpening', cost: 10, flavor: 'A dull blade strains the mower engine', skipCost: { cost: 70, label: 'The mower overheated. Repair shop' } },
          { label: 'Concert ticket', cost: 35, flavor: 'A band you really like' },
        ],
      },
      {
        title: 'Word Gets Around',
        story: 'Neighbors are asking about your service.',
        income: 70,
        required: [{ label: 'Gas for the mower', cost: 15 }, { label: 'Phone bill', cost: 20 }],
        optional: [
          { label: 'Printed business cards', cost: 12, flavor: 'Hand them out after each job', payback: 15 },
          { label: 'Streaming subscription', cost: 12, flavor: 'Shows to watch at night' },
        ],
      },
      {
        title: 'Heat Wave',
        story: 'It is really hot, and grass grows slower.',
        income: 70,
        required: [{ label: 'Gas for the mower', cost: 15 }, { label: 'Phone bill', cost: 20 }],
        optional: [
          { label: 'New headphones', cost: 25, flavor: 'Yours still work' },
          { label: 'Pizza night with friends', cost: 15, flavor: 'A fun break' },
        ],
      },
      {
        title: 'End of Summer',
        story: 'One more stretch before school starts.',
        income: 70,
        required: [{ label: 'Gas for the mower', cost: 15 }, { label: 'Phone bill', cost: 20 }],
        optional: [
          { label: 'Trip with friends', cost: 40, flavor: 'A big want, and the price shows it' },
          { label: 'New backpack', cost: 20, flavor: 'Yours is worn, but it can last a bit longer' },
        ],
      },
    ],
    lesson: 'The best spending pays you back: tools that let you charge more, and upkeep that stops a costly breakdown.',
  },

  '9-12': {
    title: 'First Apartment',
    startingBalance: 300,
    savingsGoal: 1100,
    saveTiers: [0, 125, 250],
    eventPool: EVENT_POOLS['9-12'],
    rounds: [
      {
        title: 'Move-In',
        story: 'First month in your own place. You work retail full time.',
        income: 1900,
        required: [{ label: 'Rent', cost: 1150 }, { label: 'Utilities', cost: 140 }, { label: 'Groceries', cost: 310 }, { label: 'Car payment', cost: 200 }],
        optional: [
          { label: 'Online certification course', cost: 250, flavor: 'Qualifies you for a shift-lead role that pays more', payback: 150 },
          { label: 'Nice furniture set', cost: 300, flavor: 'The secondhand couch works fine' },
        ],
      },
      {
        title: 'Settling In',
        story: 'Your car has a slow leak in one tire.',
        income: 1900,
        required: [{ label: 'Rent', cost: 1150 }, { label: 'Utilities', cost: 140 }, { label: 'Groceries', cost: 310 }, { label: 'Car payment', cost: 200 }],
        optional: [
          { label: 'Tire repair', cost: 40, flavor: 'The leak is getting worse', skipCost: { cost: 220, label: 'Blowout on the highway. New tire and a tow' } },
          { label: 'New TV', cost: 280, flavor: 'Your laptop works for now' },
        ],
      },
      {
        title: 'Staying Covered',
        story: 'Your car insurance is due along with everything else.',
        income: 1900,
        required: [{ label: 'Rent', cost: 1150 }, { label: 'Car insurance', cost: 180 }, { label: 'Groceries', cost: 310 }, { label: 'Car payment', cost: 200 }],
        optional: [
          { label: 'Meal-prep containers & cookbook', cost: 40, flavor: 'Cook for the week on Sundays', payback: 60 },
          { label: 'Dining out', cost: 150, flavor: 'A few dinners with friends' },
        ],
      },
      {
        title: 'A Rough Month',
        story: 'Bills keep coming whether or not anything goes wrong.',
        income: 1900,
        required: [{ label: 'Rent', cost: 1150 }, { label: 'Utilities', cost: 140 }, { label: 'Groceries', cost: 310 }, { label: 'Car payment', cost: 200 }],
        optional: [
          { label: 'Weekend trip', cost: 250, flavor: 'Memorable, and not cheap' },
          { label: 'Gym membership', cost: 50, flavor: 'Free workouts at home are an option' },
        ],
      },
      {
        title: 'Staying On Track',
        story: 'Another month: rent, insurance, groceries.',
        income: 1900,
        required: [{ label: 'Rent', cost: 1150 }, { label: 'Car insurance', cost: 180 }, { label: 'Groceries', cost: 310 }, { label: 'Car payment', cost: 200 }],
        optional: [
          { label: 'Phone upgrade', cost: 300, flavor: 'Your phone still works' },
          { label: 'Concert tickets', cost: 140, flavor: 'A night out' },
        ],
      },
      {
        title: 'Rent Again',
        story: 'Another month, another rent payment. This is the real rhythm of it.',
        income: 1900,
        required: [{ label: 'Rent', cost: 1150 }, { label: 'Utilities', cost: 140 }, { label: 'Groceries', cost: 310 }, { label: 'Car payment', cost: 200 }],
        optional: [
          { label: 'Guest-room furniture', cost: 280, flavor: 'No guests booked yet' },
          { label: 'Dining out', cost: 150, flavor: 'A treat' },
        ],
      },
    ],
    lesson: 'Rent comes back every month. An emergency fund keeps one bad month from becoming a crisis, and skills and upkeep often pay for themselves.',
  },
};

export default TRAIL_BANK;
