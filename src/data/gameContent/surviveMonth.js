// src/data/gameContent/surviveMonth.js
// Survive the Month — a Reigns-style day-by-day budget survival game.
// Each round is a short run of days (see difficultyAdapter.js's
// roundLength()); one card is dealt per day from that band's pool, sampled
// without replacement, and each card offers 2-3 options trading Cash
// against Stress. `good: true/false` on each option is what the round's
// correct/total score is measured against.
//
// "Good" is NOT "spend the least". Roughly half the cards reward spending:
// fixing something before it gets worse, paying a small debt, the sturdier
// version that lasts, a planned bit of fun. And the wrong answer is often
// the too-cheap one: skipping sunscreen, riding on bad brakes, never going
// out with friends. The game shuffles each card's options when it's dealt.
// scripts/check-games.mjs fails if "always pick the cheapest" or "always
// pick the longest answer" starts working again, or if playing every good
// option could overdraft a week.

export const SURVIVE_BANK = {
  'K-2': {
    title: 'Allowance Week',
    startingCash: 6,
    startingStress: 20,
    incomePerDay: 2,
    cardPool: [
      {
        id: 'lost_toy',
        prompt: 'You lost your favorite toy at the park!',
        options: [
          { label: 'Buy a new one right away', cash: -4, stress: -5, good: false, tip: 'It might still turn up. Look before you buy again.' },
          { label: 'Go back and look for it first', cash: 0, stress: 3, good: true, tip: 'Looking first is free. Lost things turn up a lot.' },
        ],
      },
      {
        id: 'friend_party',
        prompt: "Your best friend's birthday party is on Saturday.",
        options: [
          { label: 'Skip the party so you spend nothing', cash: 0, stress: 8, good: false, tip: 'Friends matter too. A small gift or a card is plenty.' },
          { label: 'Make a card and bring a small gift', cash: -2, stress: -4, good: true, tip: 'A small gift and a card you made show you care.' },
          { label: 'Buy the biggest toy in the store', cash: -6, stress: -2, good: false, tip: 'A gift does not have to be the biggest one to be a good one.' },
        ],
      },
      {
        id: 'floppy_shoe',
        prompt: 'The bottom of your shoe is coming loose.',
        options: [
          { label: 'Keep wearing it the way it is', cash: 0, stress: 6, good: false, tip: 'A floppy sole can trip you, and the rip gets bigger.' },
          { label: 'Buy glue and fix it with a grown-up', cash: -1, stress: -2, good: true, tip: 'Fixing something early is cheap. Waiting makes it worse.' },
        ],
      },
      {
        id: 'chore_bonus',
        prompt: 'You did an extra chore and earned $3!',
        options: [
          { label: 'Save it for something you really want', cash: 3, stress: 0, good: true, tip: 'Saved money grows into something bigger.' },
          { label: 'Spend all of it on candy today', cash: 0, stress: -2, good: false, tip: 'Money spent right away is gone before it can add up.' },
        ],
      },
      {
        id: 'sunscreen',
        prompt: "It's swim day at camp, and you are out of sunscreen.",
        options: [
          { label: 'Skip sunscreen this one time', cash: 0, stress: 8, good: false, tip: 'A sunburn hurts for days. Sunscreen is worth the money.' },
          { label: 'Buy a small bottle of sunscreen', cash: -2, stress: -2, good: true, tip: 'Some things keep you safe. Those are worth paying for.' },
        ],
      },
      {
        id: 'vending_machine',
        prompt: "You walk past a snack machine. You're not hungry.",
        options: [
          { label: 'Buy a snack anyway', cash: -2, stress: -1, good: false, tip: 'Buying food when you are not hungry wastes money.' },
          { label: 'Keep walking to class', cash: 0, stress: 1, good: true, tip: 'If you do not need it right now, you can wait.' },
        ],
      },
      {
        id: 'library_fine',
        prompt: 'You kept a library book too long. You owe $3.',
        options: [
          { label: 'Pay the $3 now', cash: -3, stress: -4, good: true, tip: 'Paying small debts fast keeps them small.' },
          { label: 'Hide from the librarian for a while', cash: 0, stress: 6, good: false, tip: 'Hiding from a debt does not make it go away.' },
        ],
      },
      {
        id: 'rainy_day',
        prompt: "It's raining and you're bored inside.",
        options: [
          { label: 'Ask to buy a new game', cash: -5, stress: -4, good: false, tip: 'Being bored does not always need a new thing.' },
          { label: 'Build a blanket fort', cash: 0, stress: -3, good: true, tip: 'Free fun is still fun.' },
        ],
      },
      {
        id: 'water_bottle',
        prompt: 'You need a water bottle. The $1 one leaks. The $3 one does not.',
        options: [
          { label: 'Buy the $1 bottle', cash: -1, stress: 5, good: false, tip: 'A leaky bottle means buying another one soon. Cheap can cost more.' },
          { label: 'Buy the $3 bottle', cash: -3, stress: -1, good: true, tip: 'Something that lasts can be worth a little more.' },
        ],
      },
      {
        id: 'sticker_pack',
        prompt: 'A shiny sticker pack catches your eye at the store.',
        options: [
          { label: 'Buy it right now', cash: -3, stress: -3, good: false, tip: 'The wish to buy something shiny fades if you wait a bit.' },
          { label: 'Put it on your wish list', cash: 0, stress: 2, good: true, tip: 'A wish list helps you decide later if you still want it.' },
        ],
      },
      {
        id: 'lemonade_stand',
        prompt: 'You want to start a lemonade stand next weekend.',
        options: [
          { label: 'Buy fancy decorations first', cash: -5, stress: -2, good: false, tip: 'Spend a lot before you earn anything and you might lose it.' },
          { label: 'Start with a simple sign', cash: -1, stress: 2, good: true, tip: 'Start small. Spend more once it works.' },
          { label: 'Give up, it costs money', cash: 0, stress: 3, good: false, tip: 'A tiny start costs very little and could earn you money.' },
        ],
      },
      {
        id: 'friend_lunch',
        prompt: 'Your friend forgot their lunch today.',
        options: [
          { label: 'Share half your sandwich', cash: 0, stress: -2, good: true, tip: 'Sharing helps a friend and costs you nothing extra.' },
          { label: 'Give them all your money', cash: -4, stress: 3, good: false, tip: 'Being kind does not mean giving away everything you have.' },
          { label: 'Act like you did not hear', cash: 0, stress: 4, good: false, tip: 'Helping a friend does not always cost money.' },
        ],
      },
    ],
  },

  '3-5': {
    title: 'School Week Budget',
    startingCash: 20,
    startingStress: 25,
    incomePerDay: 3,
    cardPool: [
      {
        id: 'trending_game',
        prompt: 'Everyone at school is talking about a new $12 video game.',
        options: [
          { label: 'Buy it today before it sells out', cash: -12, stress: -6, good: false, tip: 'Buying because everyone else is buying is called impulse spending.' },
          { label: 'Wait a week and see if you still want it', cash: 0, stress: 3, good: true, tip: 'Waiting before a big purchase helps you avoid regret.' },
        ],
      },
      {
        id: 'forgot_lunch',
        prompt: 'You forgot your lunch at home.',
        options: [
          { label: 'Skip lunch to save the money', cash: 0, stress: 8, good: false, tip: 'Going hungry all afternoon is not a good way to save. This is what money is for.' },
          { label: 'Buy the basic school lunch', cash: -4, stress: -2, good: true, tip: 'When you have to spend, the basic option does the job.' },
          { label: 'Buy the fanciest lunch they have', cash: -8, stress: -2, good: false, tip: 'The most expensive option is not always the best value.' },
        ],
      },
      {
        id: 'group_project',
        prompt: 'Your group project needs $8 of poster supplies.',
        options: [
          { label: 'Pay for all of it so the group likes you', cash: -8, stress: 1, good: false, tip: 'A shared project is a shared cost.' },
          { label: 'Ask everyone to chip in $2 each', cash: -2, stress: 2, good: true, tip: 'Splitting costs evenly is fair and easy.' },
          { label: 'Say you have no money when you do', cash: 0, stress: 5, good: false, tip: 'Dodging your share leaves it on someone else.' },
        ],
      },
      {
        id: 'movies',
        prompt: 'Your friends are going to the movies on Saturday.',
        options: [
          { label: 'Go, and bring snacks from home', cash: -6, stress: -4, good: true, tip: 'Fun with friends matters. Skipping the extras makes it cheaper.' },
          { label: 'Go and get the big snack combo', cash: -11, stress: -5, good: false, tip: 'The snacks can cost almost as much as the ticket.' },
          { label: 'Stay home, even though you have the money', cash: 0, stress: 6, good: false, tip: 'A budget with no fun in it is hard to stick to.' },
        ],
      },
      {
        id: 'spare_change',
        prompt: 'You find $4 in spare change around your room.',
        options: [
          { label: 'Put it in your savings jar', cash: 4, stress: 0, good: true, tip: 'Small deposits add up faster than you think.' },
          { label: 'Spend it at the corner store', cash: 0, stress: -2, good: false, tip: 'Spare change spent right away never gets to add up.' },
        ],
      },
      {
        id: 'backpack_zipper',
        prompt: 'Your backpack zipper broke.',
        options: [
          { label: 'Buy a brand-new $15 backpack', cash: -15, stress: -3, good: false, tip: 'Replacing something that can be fixed usually costs more.' },
          { label: 'Pay $5 to get the zipper fixed', cash: -5, stress: -2, good: true, tip: 'Repairing is often much cheaper than replacing.' },
          { label: 'Carry your books in your arms', cash: 0, stress: 7, good: false, tip: 'You will drop and lose things. A cheap fix is worth it.' },
        ],
      },
      {
        id: 'in_app',
        prompt: 'A game on your tablet wants you to buy gems.',
        options: [
          { label: 'Buy a small pack of gems', cash: -6, stress: -4, good: false, tip: 'In-app purchases are made to feel small, but they add up fast.' },
          { label: 'Keep playing for free', cash: 0, stress: 2, good: true, tip: 'Most games are still fun without paying for extras.' },
        ],
      },
      {
        id: 'birthday_money',
        prompt: 'Your grandma gave you $10 for your birthday.',
        options: [
          { label: 'Save most of it and spend a little', cash: 8, stress: -3, good: true, tip: 'Saving most and enjoying a little is a healthy balance.' },
          { label: 'Spend all of it today', cash: 1, stress: -3, good: false, tip: 'Spending a gift all at once means none of it lasts.' },
        ],
      },
      {
        id: 'club_fee',
        prompt: "The robotics club costs $5 to join. You've wanted to for months.",
        options: [
          { label: 'Pay the $5 and join', cash: -5, stress: -3, good: true, tip: 'Spending on something you really want and will use is what money is for.' },
          { label: 'Skip it to keep the $5', cash: 0, stress: 4, good: false, tip: 'Saving is great, but not if you miss what you were saving for.' },
        ],
      },
      {
        id: 'library_book',
        prompt: 'You want to read a book your classmate liked.',
        options: [
          { label: 'Buy it brand-new for $9', cash: -9, stress: -2, good: false, tip: 'Buying new when you can borrow costs more for the same story.' },
          { label: 'Borrow it from the library', cash: 0, stress: 1, good: true, tip: 'The library is free. Use it.' },
        ],
      },
      {
        id: 'sneakers',
        prompt: 'You need sneakers. A $5 pair falls apart fast. A $9 pair lasts all year.',
        options: [
          { label: 'Buy the $5 pair', cash: -5, stress: 3, good: false, tip: 'If you buy the cheap pair twice, you pay $10.' },
          { label: 'Buy the $9 pair', cash: -9, stress: -1, good: true, tip: 'Paying a bit more for something that lasts can save money.' },
        ],
      },
      {
        id: 'flat_tire',
        prompt: 'Your bike tire is flat, and you ride it to school.',
        options: [
          { label: 'Walk to school for a few weeks', cash: 0, stress: 6, good: false, tip: 'You will be late and tired. A patch kit is cheap.' },
          { label: 'Buy a $4 patch kit and fix it', cash: -4, stress: -2, good: true, tip: 'Small fixes keep bigger problems away.' },
        ],
      },
    ],
  },

  '6-8': {
    title: 'Part-Time Job Week',
    startingCash: 45,
    startingStress: 30,
    incomePerDay: 18,
    cardPool: [
      {
        id: 'sneaker_drop',
        prompt: 'A limited-edition sneaker drop just went live: $55.',
        options: [
          { label: 'Buy them before they sell out', cash: -55, stress: -8, good: false, tip: 'Countdown timers are there to stop you thinking it over.' },
          { label: 'Sleep on it before deciding', cash: 0, stress: 4, good: true, tip: 'A cooling-off period prevents a lot of regret.' },
        ],
      },
      {
        id: 'phone_case',
        prompt: 'Your phone case cracked and fell off.',
        options: [
          { label: 'Buy a basic $12 case', cash: -12, stress: -2, good: true, tip: 'A basic case protects just as well as a designer one.' },
          { label: 'Go without a case for now', cash: 0, stress: 6, good: false, tip: 'One drop could mean a $200 screen repair.' },
          { label: 'Buy the $35 designer case', cash: -35, stress: -3, good: false, tip: 'You are paying for the brand, not more protection.' },
        ],
      },
      {
        id: 'friend_loan',
        prompt: 'A friend asks to borrow $20 for a concert. You need that $20 for your bus pass.',
        options: [
          { label: "Lend it anyway, they're your friend", cash: -20, stress: 10, good: false, tip: 'Only lend money you could afford never to get back.' },
          { label: 'Say no and explain you need it for the bus', cash: 0, stress: 2, good: true, tip: 'It is okay to say no when the money already has a job.' },
          { label: 'Lend half and hope for the best', cash: -10, stress: 6, good: false, tip: 'Half your bus money is still bus money you will be short.' },
        ],
      },
      {
        id: 'streaming',
        prompt: 'You pay for two streaming apps but only watch one.',
        options: [
          { label: "Cancel the one you don't watch", cash: 8, stress: -1, good: true, tip: 'Small monthly charges you forget about drain a budget.' },
          { label: 'Keep both, just in case', cash: -8, stress: 2, good: false, tip: 'Paying "just in case" is still paying for nothing.' },
        ],
      },
      {
        id: 'extra_shifts',
        prompt: 'Your manager offers you extra shifts during exam week.',
        options: [
          { label: 'Take every shift they offer', cash: 50, stress: 25, good: false, tip: 'More money is not worth failing exams or burning out.' },
          { label: 'Take one shift on the weekend', cash: 18, stress: 3, good: true, tip: 'Some extra pay without wrecking your study time.' },
        ],
      },
      {
        id: 'concert',
        prompt: 'A band you love is in town. Regular tickets are $30, VIP is $60. You budgeted $30 for fun.',
        options: [
          { label: 'Buy the regular ticket', cash: -30, stress: -8, good: true, tip: 'You planned for this. Enjoying fun you budgeted for is the point.' },
          { label: 'Buy the VIP ticket', cash: -60, stress: -8, good: false, tip: 'The upgrade costs double your fun budget for a slightly better view.' },
          { label: 'Skip it and save the $30', cash: 0, stress: 6, good: false, tip: 'If you planned for fun, skipping it makes the budget harder to stick to.' },
        ],
      },
      {
        id: 'headphones',
        prompt: 'Your headphones broke. You use them every day on the bus.',
        options: [
          { label: 'Buy a solid $18 pair', cash: -18, stress: -3, good: true, tip: 'A mid-range pair that lasts is good value for something you use daily.' },
          { label: 'Buy the $45 newest model', cash: -45, stress: -4, good: false, tip: 'The newest version rarely justifies its price.' },
          { label: 'Grab the $4 gas-station pair', cash: -4, stress: 4, good: false, tip: 'They will break in weeks. Buying cheap over and over costs more.' },
        ],
      },
      {
        id: 'group_order',
        prompt: 'Your friends ordered pizza together. You owe $14.',
        options: [
          { label: 'Pay your share right away', cash: -14, stress: -2, good: true, tip: 'Paying friends back quickly keeps things easy.' },
          { label: 'Wait until someone asks', cash: 0, stress: 4, good: false, tip: 'Waiting to be asked makes friends feel awkward.' },
        ],
      },
      {
        id: 'free_trial',
        prompt: 'An app offers a free trial that turns into $10 a month.',
        options: [
          { label: 'Sign up and figure it out later', cash: -10, stress: -2, good: false, tip: 'Free trials count on you forgetting to cancel.' },
          { label: 'Set a reminder to cancel before it charges', cash: 0, stress: 1, good: true, tip: 'A reminder is an easy habit that stops surprise charges.' },
        ],
      },
      {
        id: 'clothing_sale',
        prompt: 'The store is having a 50% off sale. You need new jeans.',
        options: [
          { label: 'Buy just the jeans', cash: -15, stress: -2, good: true, tip: 'A sale saves money on what you already planned to buy.' },
          { label: "Buy four things since it's half off", cash: -40, stress: -3, good: false, tip: 'Half off something you did not need is not saving.' },
          { label: 'Skip the jeans and wait for a bigger sale', cash: 0, stress: 4, good: false, tip: 'Waiting on something you need for a better deal can backfire.' },
        ],
      },
      {
        id: 'pay_yourself_first',
        prompt: "It's payday. You want $100 saved by summer.",
        options: [
          { label: 'Move $20 to savings first', cash: -20, stress: 2, good: true, tip: 'Saving first, then spending, is how savings actually happen.' },
          { label: "Save whatever's left at the end", cash: 0, stress: -2, good: false, tip: '"Whatever is left" usually turns out to be nothing.' },
        ],
      },
      {
        id: 'bike_brakes',
        prompt: 'Your bike brakes squeal and feel weak.',
        options: [
          { label: 'Pay $15 to get them fixed', cash: -15, stress: -3, good: true, tip: 'Safety fixes come first. They are cheap next to an accident.' },
          { label: 'Keep riding, just go slower', cash: 0, stress: 8, good: false, tip: 'Weak brakes fail when you need them most.' },
        ],
      },
    ],
  },

  '9-12': {
    title: 'Independent Living Month',
    startingCash: 400,
    startingStress: 35,
    incomePerDay: 60,
    cardPool: [
      {
        id: 'tire_blowout',
        prompt: 'Your tire blew out. You drive to work.',
        options: [
          { label: 'Pay $150 for a new tire now', cash: -150, stress: -5, good: true, tip: 'This is what cash on hand is for. The car gets you to your paycheck.' },
          { label: 'Put it on a 29% card and pay the minimum', cash: -10, stress: 12, good: false, tip: 'At 29%, paying only the minimum can double what the tire costs.' },
          { label: 'Drive on the spare for a month', cash: 0, stress: 10, good: false, tip: 'Spares are made for short trips, not weeks of commuting.' },
        ],
      },
      {
        id: 'subscriptions',
        prompt: 'You find three streaming services on your statement. You use one.',
        options: [
          { label: 'Cancel the two you never use', cash: 25, stress: -3, good: true, tip: 'Forgotten subscriptions quietly drain a budget.' },
          { label: 'Keep them all, just in case', cash: -25, stress: 4, good: false, tip: '"Just in case" access is still paying for nothing.' },
        ],
      },
      {
        id: 'credit_limit',
        prompt: 'You got a new credit card with a $3,000 limit.',
        options: [
          { label: 'Use it for planned costs and pay it off monthly', cash: 0, stress: 2, good: true, tip: 'Paid off every month, a card builds credit and costs nothing.' },
          { label: 'Use it for the things you have been wanting', cash: -180, stress: 15, good: false, tip: 'A credit limit is borrowed money, not extra income.' },
        ],
      },
      {
        id: 'utility_bill',
        prompt: 'The shared electric bill came in high. Your share is $60.',
        options: [
          { label: 'Pay your share the day it arrives', cash: -60, stress: -3, good: true, tip: 'Paying shared bills fast keeps roommates on good terms.' },
          { label: 'Wait for your roommate to ask', cash: 0, stress: 8, good: false, tip: 'Avoiding a bill you owe does not make it smaller.' },
        ],
      },
      {
        id: 'cavity',
        prompt: 'The dentist found a small cavity. A filling costs $90.',
        options: [
          { label: 'Get the filling now', cash: -90, stress: -3, good: true, tip: 'Small problems stay cheap when you fix them early.' },
          { label: 'Wait until it actually hurts', cash: 0, stress: 4, good: false, tip: 'A cavity keeps growing. A $90 filling can become a $1,000 root canal.' },
        ],
      },
      {
        id: 'certification',
        prompt: 'Your job offers a free certification course, three evenings a month.',
        options: [
          { label: 'Sign up for the course', cash: 0, stress: 6, good: true, tip: 'Free training toward a raise is one of the best deals there is.' },
          { label: 'Skip it, evenings are for resting', cash: 0, stress: -3, good: false, tip: 'Rest matters, but a free path to higher pay is rare.' },
        ],
      },
      {
        id: 'emergency_fund',
        prompt: "Nothing's gone wrong lately. You have no emergency fund yet.",
        options: [
          { label: 'Move $80 into an emergency fund', cash: -80, stress: -4, good: true, tip: 'An emergency fund is built before the emergency, not during it.' },
          { label: 'Skip it while things are calm', cash: 0, stress: 4, good: false, tip: 'Calm months are the easiest time to build a cushion.' },
        ],
      },
      {
        id: 'card_statement',
        prompt: 'Your card statement: $120 balance, $25 minimum payment.',
        options: [
          { label: 'Pay the full $120', cash: -120, stress: -2, good: true, tip: 'Paying in full means you pay no interest at all.' },
          { label: 'Pay the $25 minimum', cash: -25, stress: 5, good: false, tip: 'Paying the minimum lets interest pile up on the rest.' },
        ],
      },
      {
        id: 'too_tired',
        prompt: "You're too tired to cook again this week.",
        options: [
          { label: 'Order delivery again', cash: -45, stress: -6, good: false, tip: 'Delivery fees and markups add up fast over a month.' },
          { label: 'Grab easy meals at the grocery store', cash: -20, stress: -2, good: true, tip: 'Easy grocery meals cost a fraction of delivery.' },
          { label: 'Skip dinner', cash: 0, stress: 8, good: false, tip: 'Going hungry is not a plan. Cheap easy food is.' },
        ],
      },
      {
        id: 'guaranteed_investment',
        prompt: 'A friend pitches a "guaranteed" investment that doubles your money.',
        options: [
          { label: 'Research it before putting in anything', cash: 0, stress: 3, good: true, tip: '"Guaranteed" high returns are the classic sign of a scam.' },
          { label: 'Put in $150 since your friend is sure', cash: -150, stress: 15, good: false, tip: 'Confidence is not evidence.' },
        ],
      },
      {
        id: 'health_insurance',
        prompt: 'Health insurance through work starts next month for $60 a month.',
        options: [
          { label: 'Enroll in the plan', cash: -60, stress: -5, good: true, tip: 'One emergency room visit can cost thousands without insurance.' },
          { label: "Skip it, you're young and healthy", cash: 0, stress: 2, good: false, tip: 'Accidents happen to healthy people too.' },
        ],
      },
      {
        id: 'bonus',
        prompt: 'You got a $100 bonus at work.',
        options: [
          { label: 'Save most of it and enjoy a little', cash: 70, stress: -4, good: true, tip: 'Saving most and enjoying some is healthier than doing only one.' },
          { label: 'Spend the whole thing this weekend', cash: 0, stress: -6, good: false, tip: 'A bonus spent in one weekend leaves nothing behind.' },
        ],
      },
    ],
  },
};

export default SURVIVE_BANK;
