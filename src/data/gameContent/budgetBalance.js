// src/data/gameContent/budgetBalance.js
// Budget Balance content, tiered by grade band.

export const BUDGET_BANK = {
  'K-2': [
    {
      title: 'School Supplies Budget',
      budget: 35,
      story: 'You have $35 for school. Pick which items to cut to stay in budget.',
      expenses: [
        { item: '📓 Notebooks', cost: 8,  essential: true },
        { item: '✏️ Pencils',   cost: 3,  essential: true },
        { item: '🎒 Backpack',  cost: 20, essential: true },
        { item: '🧸 Toy',       cost: 12, essential: false },
        { item: '🎬 Movie Ticket', cost: 10, essential: false },
      ],
      lesson: 'Always buy what you need first, then wants with leftover money.',
    },
    {
      title: 'Lunch Money',
      budget: 15,
      story: 'You have $15 for lunch this week. What can you cut?',
      expenses: [
        { item: '🍱 Lunch Box',   cost: 8, essential: true },
        { item: '💧 Water Bottle', cost: 2, essential: true },
        { item: '🍬 Candy',       cost: 4, essential: false },
        { item: '🎮 Video Game',  cost: 6, essential: false },
      ],
      lesson: 'Needs first, wants second — always.',
    },
    {
      title: 'Pet Care Budget',
      budget: 20,
      story: 'You have $20 to prepare for a new pet fish. What do you cut?',
      expenses: [
        { item: '🐠 Fish Food',       cost: 5,  essential: true },
        { item: '🪣 Fish Tank',       cost: 12, essential: true },
        { item: '🎨 Tank Decorations', cost: 8, essential: false },
        { item: '🕹️ Toy for Yourself', cost: 6, essential: false },
      ],
      lesson: 'Your pet’s basic needs come first — decorations and personal treats come after.',
    },
  ],

  '3-5': [
    {
      title: 'Weekend Fun Budget',
      budget: 20,
      story: 'You have $20 for the weekend. What do you cut to stay in budget?',
      expenses: [
        { item: '🚌 Bus Fare',   cost: 4,  essential: true },
        { item: '🥪 Lunch',      cost: 7,  essential: true },
        { item: '🍦 Ice Cream',  cost: 5,  essential: false },
        { item: '🎧 Headphones', cost: 15, essential: false },
      ],
      lesson: 'Transport and food are needs — entertainment is a want.',
    },
    {
      title: 'Grocery Run',
      budget: 25,
      story: 'You have $25 for groceries. What gets cut?',
      expenses: [
        { item: '🥚 Eggs',   cost: 4,  essential: true },
        { item: '🍞 Bread',  cost: 3,  essential: true },
        { item: '🥛 Milk',   cost: 4,  essential: true },
        { item: '🍕 Restaurant', cost: 14, essential: false },
        { item: '👟 Designer Shoes', cost: 60, essential: false },
      ],
      lesson: 'Basic food is essential. Dining out and luxury items are wants.',
    },
    {
      title: 'Class Trip Budget',
      budget: 35,
      story: 'You have $35 for the class trip. What gets cut?',
      expenses: [
        { item: '🚌 Bus Fee',       cost: 10, essential: true },
        { item: '🎟️ Museum Ticket', cost: 12, essential: true },
        { item: '🥪 Lunch',         cost: 6,  essential: true },
        { item: '🍫 Snack',         cost: 5,  essential: false },
        { item: '🎁 Souvenir',      cost: 12, essential: false },
      ],
      lesson: 'Trip essentials — transportation, entry fees, and food — come before souvenirs.',
    },
  ],

  '6-8': [
    {
      title: 'Birthday Budget',
      budget: 40,
      story: 'You have $40 for your birthday party. What stays?',
      expenses: [
        { item: '🎂 Cake',        cost: 20, essential: true },
        { item: '🎈 Decorations', cost: 10, essential: true },
        { item: '📱 New Phone',   cost: 300, essential: false },
        { item: '🎨 Art Supplies', cost: 15, essential: false },
        { item: '☕ Coffee Shop', cost: 25, essential: false },
      ],
      lesson: "A $300 phone isn't a party necessity — stay focused on what the event needs.",
    },
    {
      title: 'Allowance Savings Goal',
      budget: 40,
      story: 'You earn $50 this month. Save 20% ($10) first — that leaves $40 to spend. What do you cut?',
      expenses: [
        { item: '🎒 School Supplies', cost: 15, essential: true },
        { item: '🚌 Bus Pass',        cost: 10, essential: true },
        { item: '🎮 Video Game',      cost: 20, essential: false },
        { item: '👟 New Shoes',       cost: 25, essential: false },
      ],
      lesson: 'Paying yourself first — saving before spending — is one of the most powerful money habits you can build.',
    },
    {
      title: 'Team Fundraiser Budget',
      budget: 60,
      story: 'Your club raised $60 for a car wash fundraiser. What gets cut to stay in budget?',
      expenses: [
        { item: '🧽 Sponges & Soap', cost: 15, essential: true },
        { item: '🪧 Signs',          cost: 10, essential: true },
        { item: '🎵 Speaker Rental', cost: 40, essential: false },
        { item: '🍕 Pizza for Volunteers', cost: 20, essential: false },
      ],
      lesson: 'Fundraiser costs should directly support the goal — extras like music are optional.',
    },
  ],

  '9-12': [
    {
      title: 'First Apartment Budget',
      budget: 1200,
      story: 'Your monthly income is $1,200 after tax. What do you cut to make rent work?',
      expenses: [
        { item: '🏠 Rent',                 cost: 750, essential: true },
        { item: '💡 Utilities',            cost: 100, essential: true },
        { item: '🛒 Groceries',            cost: 200, essential: true },
        { item: '🎮 Streaming Subscriptions', cost: 60, essential: false },
        { item: '🍽️ Dining Out',           cost: 150, essential: false },
      ],
      lesson: 'Rent and utilities are fixed needs — subscriptions and dining out are the flexible spending you control.',
    },
    {
      title: 'Student Loan Awareness',
      budget: 300,
      story: 'You have $300 left over after your paycheck and fixed bills. A friend suggests skipping your loan payment to buy concert tickets. What do you cut to stay responsible?',
      expenses: [
        { item: '🎓 Loan Minimum Payment', cost: 120, essential: true },
        { item: '🚗 Gas',                  cost: 60,  essential: true },
        { item: '📱 Phone Bill',           cost: 50,  essential: true },
        { item: '🎫 Concert Tickets',      cost: 150, essential: false },
        { item: '👕 New Clothes',          cost: 80,  essential: false },
      ],
      lesson: 'Missing a loan payment can hurt your credit score for years — it should never be the "flexible" expense you cut.',
    },
    {
      title: 'First Paycheck Budget',
      budget: 500,
      story: 'Your part-time job paycheck after taxes is $500 this month. What do you cut to stay on budget?',
      expenses: [
        { item: '🚌 Transportation',       cost: 80,  essential: true },
        { item: '📱 Phone Plan',           cost: 40,  essential: true },
        { item: '💰 Savings Transfer',     cost: 100, essential: true },
        { item: '👟 Sneakers',             cost: 150, essential: false },
        { item: '🍔 Fast Food',            cost: 90,  essential: false },
        { item: '🎮 Video Game',           cost: 60,  essential: false },
      ],
      lesson: "Treat a 'pay yourself first' savings transfer as a fixed need, not something to skip when money feels tight.",
    },
  ],
};

export default BUDGET_BANK;
