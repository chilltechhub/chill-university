// src/data/gameContent/budgetTrail.js
// Budget Trail — a multi-round resource-management strategy game (not a
// quiz). Balance CARRIES OVER between rounds, so early spending choices
// affect whether you can afford a later round's required cost. Every
// journey is solvable end-to-end if you never buy an optional item, and
// every journey fails at some round if you buy every optional offered —
// verified by simulation, not just by eye.

export const TRAIL_BANK = {
  'K-2': {
    title: 'Lemonade Stand Trip',
    startingBalance: 23,
    rounds: [
      { title: 'Setting Up', story: 'You need cups for your lemonade stand.', required: { label: 'Cups', cost: 5 }, optional: [{ label: 'Fun sticker decorations', cost: 8 }] },
      { title: 'Restocking', story: 'You need more lemons.', required: { label: 'Lemons', cost: 6 }, optional: [{ label: 'Extra pitcher', cost: 5 }] },
      { title: 'Big Weekend Sale', story: 'A big event is coming — you need extra sugar and cups!', required: { label: 'Sugar & cups', cost: 9 }, optional: [] },
    ],
    lesson: 'Saving a little each round means you have enough when a big cost shows up.',
  },

  '3-5': {
    title: 'School Year Savings',
    startingBalance: 45,
    rounds: [
      { title: 'Setting Up', story: 'It\'s the first week of school.', required: { label: 'Backpack', cost: 8 }, optional: [{ label: 'Trendy lunchbox', cost: 7 }] },
      { title: 'Getting Ready', story: 'You need books for class.', required: { label: 'Textbooks', cost: 10 }, optional: [{ label: 'New video game', cost: 6 }] },
      { title: 'Field Trip', story: 'Your class is going on a trip.', required: { label: 'Field trip fee', cost: 9 }, optional: [{ label: 'Souvenir', cost: 5 }] },
      { title: 'Science Fair', story: 'Surprise! You need supplies for the science fair.', required: { label: 'Science fair supplies', cost: 12 }, optional: [] },
    ],
    lesson: 'Unplanned costs come up — keeping a buffer means a surprise doesn\'t sink you.',
  },

  '6-8': {
    title: 'Summer Job Savings',
    startingBalance: 130,
    rounds: [
      { title: 'Getting to Work', story: 'You need a bus pass for your summer job.', required: { label: 'Bus pass', cost: 15 }, optional: [{ label: 'New sneakers', cost: 25 }] },
      { title: 'Staying Connected', story: 'Your phone bill is due.', required: { label: 'Phone bill', cost: 20 }, optional: [{ label: 'Concert ticket', cost: 30 }] },
      { title: 'Back to School Prep', story: 'You need supplies for the coming year.', required: { label: 'School supplies', cost: 18 }, optional: [{ label: 'Streaming subscription', cost: 12 }] },
      { title: 'Uh Oh', story: 'Unexpected! Your family needs help with a car insurance down payment.', required: { label: 'Car insurance down payment', cost: 40 }, optional: [] },
      { title: 'A Friend\'s Birthday', story: 'A close friend\'s birthday is coming up.', required: { label: 'Birthday gift', cost: 15 }, optional: [{ label: 'Fancy wrapping & extras', cost: 10 }] },
    ],
    lesson: 'The rounds you can\'t predict are exactly why you keep a cushion.',
  },

  '9-12': {
    title: 'First Apartment Savings',
    startingBalance: 2600,
    rounds: [
      { title: 'Move-In', story: 'Your first month of rent is due.', required: { label: 'First month rent', cost: 700 }, optional: [{ label: 'Nice furniture upgrade', cost: 300 }] },
      { title: 'Getting Set Up', story: 'The utility company needs a deposit.', required: { label: 'Utility deposit', cost: 150 }, optional: [{ label: 'Premium cable package', cost: 80 }] },
      { title: 'Settling In', story: 'Time to stock the fridge.', required: { label: 'Groceries', cost: 200 }, optional: [{ label: 'Dining out', cost: 120 }] },
      { title: 'Uh Oh', story: 'Unexpected! Your car needs a repair.', required: { label: 'Car repair', cost: 450 }, optional: [] },
      { title: 'Staying Covered', story: 'Your insurance premium is due.', required: { label: 'Insurance premium', cost: 180 }, optional: [{ label: 'Gym membership', cost: 60 }] },
      { title: 'Rent Again', story: 'Another month, another rent payment.', required: { label: 'Rent due again', cost: 700 }, optional: [{ label: 'Weekend trip', cost: 250 }] },
    ],
    lesson: 'Rent comes back around every month — treat it as non-negotiable before anything optional.',
  },
};

export default TRAIL_BANK;
