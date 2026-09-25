// src/data/gameContent/budgetBalance.js
// Budget Balance content, tiered by grade band.
//
// The player sees a list of costs with NO need/want labels and has to make
// the list fit the budget. Tapping a row cycles it: keep → cheaper version
// (only when the row has a `swap`) → cut → keep. A plan wins when:
//   1. it's at or under budget,
//   2. no need was cut (a need can be swapped for its cheaper version), and
//   3. nothing was cut that still fit: if the money left over would cover
//      a cut want (at its cheapest version), the plan cut too much.
// Rule 3 is what makes this a puzzle. "Cut everything that isn't a need"
// never wins on its own: every scenario leaves room for some of the wants,
// and in some the needs themselves only fit once one is swapped down.
//
// Item fields:
//   item   what shows on the row
//   cost   full price
//   need   true for needs. Never shown until the plan is checked.
//   note   small context line under the item. This is where a need that
//          looks like a want (bug spray at camp, renter's insurance the
//          lease requires) gets the fact that makes it a need.
//   swap   { item, cost }: a cheaper version of the same thing
//   why    (needs) shown if the player cuts it
//
// scripts/check-games.mjs (part of `npm run check`) proves every scenario is
// solvable, that cutting every want loses, and that keeping it all is over.

export const BUDGET_BANK = {
  'K-2': [
    {
      title: 'School Supplies',
      budget: 30,
      story: 'You have $30 for school supplies. Get what the class list needs, then keep what fits.',
      expenses: [
        { item: '📓 Notebook', cost: 5, need: true, note: 'On the class list', why: 'The teacher asked every student to bring one.' },
        { item: '✏️ Pencils', cost: 3, need: true, note: 'On the class list', why: 'You need pencils every single day.' },
        { item: '🎒 Backpack', cost: 15, need: true, note: 'Your old one ripped', why: 'Without a backpack you cannot carry your things.' },
        { item: '🚗 Toy car', cost: 6 },
        { item: '⭐ Sticker pack', cost: 4 },
        { item: '🖊️ Glitter pens', cost: 8, note: 'Pencils already do the job' },
      ],
      lesson: 'Get what you need first. Then pick the extra that matters most to you.',
    },
    {
      title: 'New Pet Fish',
      budget: 25,
      story: 'You have $25 to get ready for a pet fish.',
      expenses: [
        { item: '🪣 Fish tank', cost: 12, need: true, why: 'The fish needs a home.' },
        { item: '🐠 Fish food', cost: 4, need: true, why: 'The fish has to eat every day.' },
        { item: '💧 Water drops', cost: 3, need: true, note: 'Make tap water safe for fish', why: 'Tap water can hurt a fish until the drops clean it.' },
        { item: '🏰 Castle decoration', cost: 5 },
        { item: '🧸 Toy for yourself', cost: 7 },
      ],
      lesson: 'The pet’s needs come first. Water drops look small, but the fish can’t live without them.',
    },
    {
      title: 'Beach Day',
      budget: 20,
      story: 'You have $20 for a sunny day at the beach.',
      expenses: [
        { item: '🧴 Sunscreen', cost: 6, need: true, note: 'Hot, sunny day', why: 'Sunburn hurts for days. Sunscreen keeps your skin safe.' },
        { item: '💧 Water bottle', cost: 3, need: true, why: 'You need water on a hot day.' },
        { item: '🥪 Sandwich', cost: 5, need: true, why: 'You will be there all day and need lunch.' },
        { item: '🏐 Beach ball', cost: 4 },
        { item: '🍦 Ice cream', cost: 3 },
        { item: '🕶️ Toy sunglasses', cost: 6 },
      ],
      lesson: 'Sunscreen is not a treat. On a sunny day, it is something you need.',
    },
    {
      title: 'Day Camp',
      budget: 22,
      story: 'You have $22 for a day at camp by the lake.',
      expenses: [
        { item: '🥪 Camp lunch', cost: 6, need: true, why: 'Camp is all day. You need to eat.' },
        { item: '🦟 Bug spray', cost: 4, need: true, note: 'Lots of bugs by the lake', why: 'Bug bites itch for days. Bug spray keeps them away.' },
        { item: '🩱 Swimsuit', cost: 7, need: true, note: 'Your old one is too small', why: 'You can’t swim at camp without one.' },
        { item: '🍬 Candy', cost: 3 },
        { item: '📚 Comic book', cost: 5 },
        { item: '✨ Glow stick', cost: 2 },
      ],
      lesson: 'When a little money is left, look for the extras that fit it exactly.',
    },
    {
      title: 'Rainy Walk to School',
      budget: 24,
      story: 'Rainy season is here. You have $24.',
      expenses: [
        { item: '🥾 Rain boots', cost: 10, need: true, note: 'Your old ones leak', why: 'Wet feet all day is no fun, and you walk to school.' },
        { item: '🧥 Raincoat', cost: 9, need: true, why: 'You walk to school in the rain.' },
        { item: '☂️ Umbrella with ears', cost: 5, note: 'Your raincoat has a hood' },
        { item: '🐸 Frog keychain', cost: 3 },
        { item: '🍫 Hot cocoa mix', cost: 4 },
      ],
      lesson: 'Some things are cute but do the same job as something you already have.',
    },
  ],

  '3-5': [
    {
      title: 'Grocery Run',
      budget: 30,
      story: 'You have $30 for the week’s groceries. Try the cheaper version of things before you cut the fun stuff.',
      expenses: [
        { item: '🥚 Eggs', cost: 4, need: true, why: 'Breakfast all week.' },
        { item: '🍞 Bread', cost: 3, need: true, why: 'For school lunches.' },
        { item: '🥛 Milk', cost: 4, need: true, why: 'Everybody drinks it.' },
        { item: '🥣 Name-brand cereal', cost: 6, need: true, swap: { item: '🥣 Store-brand cereal', cost: 3 }, why: 'You need breakfast. The store brand is the same cereal for less.' },
        { item: '🍪 Cookies', cost: 5 },
        { item: '🍕 Frozen pizza', cost: 7 },
        { item: '📰 Comic magazine', cost: 4 },
      ],
      lesson: 'Store brands are often the same food for less money. The savings can pay for something fun.',
    },
    {
      title: 'Soccer Season',
      budget: 40,
      story: 'Soccer starts next week. You have $40.',
      expenses: [
        { item: '🦵 Shin guards', cost: 10, need: true, note: 'The league requires them', why: 'You can’t play without them. The league won’t let you.' },
        { item: '👟 New cleats', cost: 28, need: true, swap: { item: '👟 Used cleats', cost: 12 }, why: 'You need cleats to play. Used ones work just as well.' },
        { item: '💧 Water bottle', cost: 3, need: true, why: 'Practice is hot and long.' },
        { item: '📸 Team photo', cost: 8 },
        { item: '🧦 Fancy socks', cost: 6, note: 'The team gives you plain ones' },
        { item: '🎽 Headband', cost: 4 },
      ],
      lesson: 'Brand-new isn’t always needed. Used cleats kick the ball the same way.',
    },
    {
      title: 'Class Trip',
      budget: 35,
      story: 'Your class is going to the science museum. You have $35.',
      expenses: [
        { item: '🚌 Bus fee', cost: 10, need: true, why: 'You can’t get there without the bus.' },
        { item: '🎟️ Museum ticket', cost: 12, need: true, why: 'That’s the whole trip.' },
        { item: '🍔 Café lunch', cost: 9, need: true, swap: { item: '🥪 Packed lunch', cost: 3 }, why: 'You need lunch, but a packed one works just as well.' },
        { item: '🦖 Dino souvenir', cost: 8 },
        { item: '🍿 Snack', cost: 3 },
        { item: '📷 Photo booth', cost: 5 },
      ],
      lesson: 'A packed lunch is one of the easiest ways to save money.',
    },
    {
      title: 'New School Shoes',
      budget: 40,
      story: 'Your shoes have a hole in them. You have $40.',
      expenses: [
        { item: '👟 Brand-name shoes', cost: 40, need: true, swap: { item: '👟 Store-brand shoes', cost: 22 }, why: 'You need shoes. The logo is the only difference.' },
        { item: '🧦 Socks', cost: 5, need: true, note: 'Yours are worn through', why: 'Your socks have holes too.' },
        { item: '💡 Light-up laces', cost: 6 },
        { item: '🔑 Keychain', cost: 4 },
        { item: '🥤 Slushie', cost: 3 },
      ],
      lesson: 'Paying extra for the logo means less money for everything else.',
    },
    {
      title: 'Bike to School',
      budget: 28,
      story: 'You ride your bike to school. You have $28 to get it ready.',
      expenses: [
        { item: '🛞 New tire tube', cost: 8, need: true, note: 'Your tire keeps going flat', why: 'A flat tire means walking or being late.' },
        { item: '🪖 Helmet', cost: 15, need: true, note: 'Your old one cracked', why: 'A cracked helmet won’t protect your head. Always replace it.' },
        { item: '🔔 Bell', cost: 3, note: 'You can just call out' },
        { item: '🌈 Streamers', cost: 4 },
        { item: '🧃 Juice box', cost: 2 },
        { item: '💡 Bike light', cost: 6, note: 'You only ride in daylight' },
      ],
      lesson: 'Safety gear comes first. A cracked helmet has to be replaced even if it looks fine.',
    },
  ],

  '6-8': [
    {
      title: 'Birthday Party',
      budget: 55,
      story: 'You’re throwing a party for 8 friends with $55.',
      expenses: [
        { item: '🎂 Bakery cake', cost: 30, need: true, swap: { item: '🎂 Homemade cake', cost: 12 }, why: 'It’s a birthday. There has to be cake, but it can be homemade.' },
        { item: '🍕 Pizza', cost: 24, need: true, why: 'Eight hungry guests need food.' },
        { item: '🍽️ Plates & cups', cost: 6, need: true, why: 'You need something to serve on.' },
        { item: '🎈 Decorations', cost: 10 },
        { item: '🎁 Party favors', cost: 12 },
        { item: '🔊 Speaker rental', cost: 35, note: 'A friend has a speaker' },
      ],
      lesson: 'Swapping one big item (a bakery cake) for a cheaper version can pay for the extras.',
    },
    {
      title: 'Pay Yourself First',
      budget: 40,
      story: 'You earned $50 this month and already moved $10 to savings. That leaves $40.',
      expenses: [
        { item: '📚 School supplies', cost: 15, need: true, why: 'You need them for class.' },
        { item: '🚌 Bus pass', cost: 12, need: true, why: 'It’s how you get to school.' },
        { item: '🔌 Phone charger', cost: 8, need: true, note: 'Your only one broke', why: 'A phone with no battery can’t reach your family.' },
        { item: '🎮 Video game', cost: 20 },
        { item: '👟 New shoes', cost: 25, note: 'Yours fit fine' },
        { item: '🎬 Movie with friends', cost: 9 },
        { item: '🍫 Snacks', cost: 5 },
      ],
      lesson: 'Save first, then spend what’s left. That order is the whole habit.',
    },
    {
      title: 'Car Wash Fundraiser',
      budget: 60,
      story: 'Your club has $60 to run a car wash.',
      expenses: [
        { item: '🧽 Sponges & soap', cost: 15, need: true, why: 'You can’t wash cars without them.' },
        { item: '🪧 Signs', cost: 10, need: true, why: 'Drivers need to know you’re there.' },
        { item: '🚿 Hose nozzle', cost: 8, need: true, note: 'The hose has no sprayer', why: 'Without a sprayer, rinsing takes forever.' },
        { item: '🔊 Speaker rental', cost: 25 },
        { item: '🍕 Pizza for volunteers', cost: 20 },
        { item: '👕 Matching T-shirts', cost: 30 },
      ],
      lesson: 'Pay for what makes money first. Extras come out of what’s left.',
    },
    {
      title: 'Phone Bill',
      budget: 45,
      story: 'You pay your own phone bill now. You have $45 this month.',
      expenses: [
        { item: '📱 Unlimited plan', cost: 40, need: true, swap: { item: '📱 10GB plan', cost: 20 }, note: 'You use about 6GB', why: 'You need a phone plan, but you don’t use enough data for unlimited.' },
        { item: '🛡️ Screen protector', cost: 6, need: true, note: 'Your screen already has a crack', why: 'Another drop could shatter the screen. That repair costs far more.' },
        { item: '🎵 Music app', cost: 11 },
        { item: '🎮 In-game coins', cost: 10 },
        { item: '💳 Phone case with charms', cost: 15, note: 'Your plain case works' },
      ],
      lesson: 'Check what you actually use before paying for "unlimited".',
    },
    {
      title: 'Summer Camp Packing',
      budget: 80,
      story: 'You leave for a week of camp. You have $80.',
      expenses: [
        { item: '🛏️ Sleeping bag', cost: 35, need: true, swap: { item: '🛏️ Borrowed sleeping bag', cost: 0 }, note: 'Your cousin has one to lend', why: 'You need something to sleep in. Borrowing works.' },
        { item: '🔦 Flashlight', cost: 8, need: true, note: 'On the camp list', why: 'The cabins have no lights at night.' },
        { item: '🧴 Sunscreen', cost: 7, need: true, why: 'A week outside means a lot of sun.' },
        { item: '💊 Allergy medicine', cost: 12, need: true, note: 'You get hay fever', why: 'Camp is full of grass and pollen.' },
        { item: '📷 Disposable camera', cost: 15 },
        { item: '🍬 Canteen money', cost: 20 },
        { item: '🎒 New duffel bag', cost: 30, note: 'Your old backpack fits everything' },
      ],
      lesson: 'Borrowing something you’ll use once can free up money for things you care about.',
    },
  ],

  '9-12': [
    {
      title: 'First Apartment',
      budget: 1500,
      story: 'Your take-home pay is $1,500 a month.',
      expenses: [
        { item: '🏠 Rent', cost: 850, need: true, why: 'Miss rent and you can be evicted.' },
        { item: '💡 Utilities', cost: 110, need: true, why: 'Power and water aren’t optional.' },
        { item: '📄 Renter’s insurance', cost: 15, need: true, note: 'Your lease requires it', why: 'Skipping it breaks your lease.' },
        { item: '🛒 Groceries', cost: 320, need: true, swap: { item: '🛒 Groceries with a meal plan', cost: 220 }, why: 'You have to eat, but planning meals cuts waste.' },
        { item: '📱 Unlimited phone plan', cost: 85, need: true, swap: { item: '📱 Prepaid plan', cost: 35 }, why: 'Work needs to reach you, but prepaid does that.' },
        { item: '📺 Streaming bundle', cost: 45 },
        { item: '🍽️ Dining out', cost: 120 },
        { item: '🏋️ Gym', cost: 40 },
      ],
      lesson: 'The biggest savings are usually in needs you can do cheaper, not only in cutting fun.',
    },
    {
      title: 'Loans and Bills',
      budget: 600,
      story: 'You have $600 left after rent. A friend says to skip your loan payment this month and come to a concert.',
      expenses: [
        { item: '🎓 Student loan minimum', cost: 120, need: true, why: 'A missed loan payment can hurt your credit for years.' },
        { item: '⛽ Gas', cost: 80, need: true, why: 'You drive to work.' },
        { item: '📱 Phone bill', cost: 50, need: true, why: 'You need a working phone.' },
        { item: '🚗 Car insurance', cost: 110, need: true, note: 'Required by law to drive', why: 'Driving without insurance is illegal, and one accident could ruin you.' },
        { item: '💳 Credit card minimum', cost: 35, need: true, why: 'Missing it adds late fees and damages your credit.' },
        { item: '🎫 Concert tickets', cost: 150 },
        { item: '👕 New clothes', cost: 80 },
        { item: '🥡 Takeout', cost: 60 },
      ],
      lesson: 'Minimum payments are not flexible. The fun comes out of what’s left after them.',
    },
    {
      title: 'First Paycheck',
      budget: 550,
      story: 'Your first paycheck from the warehouse job is $550 after taxes.',
      expenses: [
        { item: '🚌 Transit pass', cost: 90, need: true, why: 'It’s how you get to work.' },
        { item: '📱 Phone plan', cost: 45, need: true, why: 'Work texts you your shifts.' },
        { item: '💰 Savings transfer', cost: 100, need: true, note: 'You decided to save first', why: 'Treat savings like a bill or it never happens.' },
        { item: '🥾 Steel-toe boots', cost: 70, need: true, note: 'Required on the warehouse floor', why: 'They won’t let you work without them.' },
        { item: '👟 Sneakers', cost: 140 },
        { item: '🍔 Fast food', cost: 90 },
        { item: '🎮 Video game', cost: 70 },
        { item: '📺 Streaming', cost: 15 },
      ],
      lesson: 'Things your job requires are needs, even when they cost a lot.',
    },
    {
      title: 'Car Trouble',
      budget: 1000,
      story: 'Your car broke down and you drive to work. You have $1,000 this month.',
      expenses: [
        { item: '🏠 Rent share', cost: 500, need: true, why: 'Rent comes first.' },
        { item: '🔧 Dealer repair quote', cost: 380, need: true, swap: { item: '🔧 Independent shop quote', cost: 240 }, why: 'You need the car for work, but a second quote often saves money.' },
        { item: '🛒 Groceries', cost: 160, need: true, why: 'You have to eat.' },
        { item: '📱 Phone', cost: 40, need: true, why: 'Work needs to reach you.' },
        { item: '🏕️ Weekend trip', cost: 200 },
        { item: '📺 Streaming', cost: 20 },
        { item: '🎧 Headphones', cost: 60 },
      ],
      lesson: 'Always get a second quote on a big repair.',
    },
    {
      title: 'Health Costs',
      budget: 900,
      story: 'You have $900 this month. You have been putting off a few things.',
      expenses: [
        { item: '🏠 Rent share', cost: 450, need: true, why: 'Rent comes first.' },
        { item: '💊 Prescription (brand)', cost: 90, need: true, swap: { item: '💊 Prescription (generic)', cost: 15 }, why: 'You need the medicine. Generics use the same active ingredient.' },
        { item: '🦷 Dental cleaning copay', cost: 40, need: true, note: 'Two years overdue', why: 'Skipping cleanings turns into cavities and root canals that cost much more.' },
        { item: '🛒 Groceries', cost: 200, need: true, why: 'You have to eat.' },
        { item: '🚌 Transit pass', cost: 60, need: true, why: 'It’s how you get to work.' },
        { item: '💅 Salon visit', cost: 55 },
        { item: '🎟️ Game tickets', cost: 75 },
        { item: '🧥 Designer jacket', cost: 110 },
      ],
      lesson: 'Ask for the generic version of a prescription. Putting off checkups usually costs more later.',
    },
  ],
};

// Cheapest version of an item: its swap if it has one.
export function minCost(exp) {
  return exp.swap ? Math.min(exp.cost, exp.swap.cost) : exp.cost;
}

// Grade a plan. `choice[i]` is 'keep' | 'swap' | 'cut' for sc.expenses[i].
// Returns { ok, total, cutNeeds[], overBy, roomFor } so the screen can say
// exactly what went wrong.
export function gradePlan(sc, choice) {
  let total = 0;
  const cutNeeds = [];
  sc.expenses.forEach((e, i) => {
    const c = choice[i] || 'keep';
    if (c === 'cut') { if (e.need) cutNeeds.push(e); return; }
    total += c === 'swap' && e.swap ? e.swap.cost : e.cost;
  });
  const left = sc.budget - total;
  // A cut want that still fits in what's left — the cheapest one, so the
  // message names the most obvious miss.
  const roomFor = left < 0 ? null : sc.expenses
    .filter((e, i) => (choice[i] === 'cut') && !e.need && minCost(e) <= left)
    .sort((a, b) => minCost(a) - minCost(b))[0] || null;
  return {
    ok: left >= 0 && cutNeeds.length === 0 && !roomFor,
    total, cutNeeds, overBy: Math.max(0, -left), roomFor,
  };
}

export default BUDGET_BANK;
