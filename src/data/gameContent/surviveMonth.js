// src/data/gameContent/surviveMonth.js
// Survive the Month — a Reigns-style day-by-day budget survival game.
// Each round is a short run of days (see difficultyAdapter.js's
// roundLength() — same "start short, grow longer" curve every other
// round-based game uses); one card is dealt per day from that band's
// pool, sampled WITHOUT replacement so a round never repeats a card, and
// each card offers 2-3 options trading Cash against Stress against
// Future Value. There's no "correct" option in the trivia sense — good
// options build Future Value and keep Stress in check at some cost;
// tempting options relieve Stress or feel free right now but usually
// cost more in the end. `good: true/false` on each option is what the
// round's "correct/total" score (and therefore its prize) is measured
// against, not whether cash went up or down.

export const SURVIVE_BANK = {
  'K-2': {
    title: 'Allowance Week',
    startingCash: 6,
    startingStress: 20,
    incomePerDay: 2,
    cardPool: [
      {
        id: 'lost_toy',
        prompt: 'You lost your favorite little toy at the park!',
        options: [
          { label: 'Buy a new one right away', cash: -4, stress: -8, good: false, tip: 'It might still turn up — buying a replacement right away can waste money.' },
          { label: 'Wait a few days to look for it', cash: 0, stress: 6, good: true, tip: 'Waiting before replacing something lost is a simple way to save money.' },
        ],
      },
      {
        id: 'friend_treat',
        prompt: 'A friend is buying a treat and asks if you want one too.',
        options: [
          { label: 'Buy one too', cash: -3, stress: -3, good: false, tip: 'Buying something just because a friend did is called peer pressure spending.' },
          { label: 'Say no thanks this time', cash: 0, stress: 2, good: true, tip: 'You can still have fun with friends without spending every time.' },
        ],
      },
      {
        id: 'chore_bonus',
        prompt: 'You did an extra chore and earned a small bonus!',
        options: [
          { label: 'Save all of it', cash: 3, stress: 0, good: true, tip: 'Extra money you save adds up faster than you might think.' },
          { label: 'Spend it right away', cash: 0, stress: -2, good: false, tip: 'Spending money the moment you get it means there\'s never any left over.' },
        ],
      },
      {
        id: 'broken_pencil',
        prompt: 'Your favorite pencil broke.',
        options: [
          { label: 'Buy a fancy new one', cash: -3, stress: -4, good: false, tip: 'A basic replacement does the same job as a fancy one for less.' },
          { label: 'Buy a simple one', cash: -1, stress: 3, good: true, tip: 'Choosing the simple option instead of the fancy one saves money.' },
        ],
      },
      {
        id: 'bake_sale',
        prompt: "There's a bake sale at school today.",
        options: [
          { label: 'Buy a treat', cash: -2, stress: -2, good: false, tip: 'Small treats add up if you buy one every single time.' },
          { label: 'Bring a snack from home instead', cash: 0, stress: 3, good: true, tip: 'Bringing your own snack instead of buying one saves money over time.' },
        ],
      },
      {
        id: 'rainy_day',
        prompt: "It's raining and you're stuck inside, bored.",
        options: [
          { label: 'Ask to buy a new game', cash: -5, stress: -6, good: false, tip: 'Being bored doesn\'t always need to be solved by buying something.' },
          { label: 'Play with toys you already have', cash: 0, stress: 4, good: true, tip: 'Free fun is still fun — you don\'t need something new every time.' },
        ],
      },
      {
        id: 'birthday_card',
        prompt: "It's your cousin's birthday this weekend.",
        options: [
          { label: 'Buy an expensive gift', cash: -6, stress: -3, good: false, tip: 'A thoughtful gift doesn\'t have to be the most expensive one.' },
          { label: 'Make a card and a small gift', cash: -2, stress: 5, good: true, tip: 'Homemade gifts can mean just as much and cost much less.' },
        ],
      },
      {
        id: 'vending_machine',
        prompt: 'You walk past a vending machine and feel like a snack.',
        options: [
          { label: 'Buy a snack', cash: -2, stress: -3, good: false, tip: 'Small "just this once" purchases are easy to make too often.' },
          { label: 'Wait until you get home', cash: 0, stress: 3, good: true, tip: 'Waiting a little while often makes the urge to spend pass.' },
        ],
      },
      {
        id: 'lemonade_stand',
        prompt: 'You want to start your own tiny lemonade stand next weekend.',
        options: [
          { label: 'Spend on fancy decorations first', cash: -5, stress: -2, good: false, tip: 'Spending before you\'ve earned anything is riskier than starting simple.' },
          { label: 'Start simple and see how it goes', cash: -1, stress: 4, good: true, tip: 'Starting small before spending a lot is a smart way to try something new.' },
        ],
      },
      {
        id: 'sticker_pack',
        prompt: 'A shiny new sticker pack catches your eye at the store.',
        options: [
          { label: 'Buy it right now', cash: -3, stress: -4, good: false, tip: 'The urge to buy something shiny fades fast if you wait a bit.' },
          { label: 'Add it to your wish list for later', cash: 0, stress: 4, good: true, tip: 'A wish list helps you decide later if you still really want it.' },
        ],
      },
      {
        id: 'found_coin',
        prompt: 'You found a coin on the sidewalk!',
        options: [
          { label: 'Save it', cash: 1, stress: 0, good: true, tip: 'Even small amounts of found money add up when you save them.' },
          { label: 'Spend it on candy', cash: 0, stress: -1, good: false, tip: 'Small windfalls are easy to spend without even noticing.' },
        ],
      },
      {
        id: 'library_fine',
        prompt: 'You kept a library book too long and owe a small fine.',
        options: [
          { label: 'Pay it right away', cash: -2, stress: 5, good: true, tip: 'Paying small debts quickly keeps them from becoming bigger problems.' },
          { label: 'Put off paying it', cash: 0, stress: -3, good: false, tip: 'Putting off a small bill doesn\'t make it go away — it just waits.' },
        ],
      },
    ],
  },

  '3-5': {
    title: 'School Week Budget',
    startingCash: 12,
    startingStress: 25,
    incomePerDay: 3,
    cardPool: [
      {
        id: 'new_game',
        prompt: 'Everyone at school is talking about a new video game.',
        options: [
          { label: 'Buy it right away', cash: -12, stress: -8, good: false, tip: 'Buying something because it\'s trending is called impulse spending.' },
          { label: 'Wait and see if you still want it in a week', cash: 0, stress: 6, good: true, tip: 'Waiting before a big purchase helps you avoid regretting it.' },
        ],
      },
      {
        id: 'lunch_money',
        prompt: 'You forgot your lunch and need to buy one at school.',
        options: [
          { label: 'Buy the fanciest lunch option', cash: -8, stress: -3, good: false, tip: 'The most expensive option isn\'t always the best value.' },
          { label: 'Get the basic lunch', cash: -4, stress: 3, good: true, tip: 'Choosing the basic option when you have to spend still saves money.' },
        ],
      },
      {
        id: 'group_project',
        prompt: 'Your group project needs poster supplies.',
        options: [
          { label: 'Buy all new supplies yourself', cash: -7, stress: -2, good: false, tip: 'Splitting a cost with a group is usually fairer than covering it alone.' },
          { label: 'Ask to split the cost with your group', cash: -3, stress: 4, good: true, tip: 'Sharing costs for a shared project is a fair way to budget.' },
        ],
      },
      {
        id: 'weekend_movie',
        prompt: 'Friends are going to the movies this weekend.',
        options: [
          { label: 'Go and buy snacks too', cash: -10, stress: -5, good: false, tip: 'Extras like snacks often cost more than the main thing itself.' },
          { label: 'Go, but skip the snacks', cash: -6, stress: 4, good: true, tip: 'Skipping the extras on an outing can cut the cost by a lot.' },
        ],
      },
      {
        id: 'savings_jar',
        prompt: 'You have some spare change lying around.',
        options: [
          { label: 'Add it to your savings jar', cash: 4, stress: 0, good: true, tip: 'Small deposits into savings add up faster than they feel like they will.' },
          { label: 'Spend it on something small', cash: 0, stress: -2, good: false, tip: 'Spare change spent right away never gets the chance to add up.' },
        ],
      },
      {
        id: 'broken_backpack',
        prompt: 'Your backpack zipper broke.',
        options: [
          { label: 'Buy a brand new backpack', cash: -15, stress: -4, good: false, tip: 'Replacing something that could be fixed is usually the pricier option.' },
          { label: 'Get it repaired instead', cash: -5, stress: 5, good: true, tip: 'Repairing something is often much cheaper than replacing it.' },
        ],
      },
      {
        id: 'app_purchase',
        prompt: 'A game app is asking you to buy a special item.',
        options: [
          { label: 'Buy the item', cash: -6, stress: -6, good: false, tip: 'In-app purchases are designed to feel small, but they add up fast.' },
          { label: 'Close the app and keep playing free', cash: 0, stress: 5, good: true, tip: 'Most games are still fun without spending real money on extras.' },
        ],
      },
      {
        id: 'birthday_money',
        prompt: 'You got some money as a birthday gift.',
        options: [
          { label: 'Save most of it', cash: 10, stress: 0, good: true, tip: 'Gift money is a great chance to build up savings.' },
          { label: 'Spend all of it right away', cash: 2, stress: -3, good: false, tip: 'Spending a windfall all at once means none of it lasts.' },
        ],
      },
      {
        id: 'club_fee',
        prompt: 'A club you want to join has a small sign-up fee.',
        options: [
          { label: 'Pay it — it seems worth it', cash: -5, stress: 6, good: true, tip: 'Spending on something you\'ll really use is different from an impulse buy.' },
          { label: 'Skip it to save the money', cash: 0, stress: -3, good: false, tip: 'Sometimes saving money means missing out on something you\'d have enjoyed.' },
        ],
      },
      {
        id: 'used_book',
        prompt: 'You want a book a classmate already read.',
        options: [
          { label: 'Buy it brand new', cash: -9, stress: -3, good: false, tip: 'Buying new when a used option exists usually costs more for no real benefit.' },
          { label: 'Ask to borrow or buy it used', cash: -2, stress: 4, good: true, tip: 'Buying used or borrowing is an easy way to spend less.' },
        ],
      },
      {
        id: 'gum_pack',
        prompt: 'You spot gum at the checkout counter.',
        options: [
          { label: 'Grab it — it\'s cheap anyway', cash: -3, stress: -3, good: false, tip: 'Checkout-line items are placed there to trigger impulse buys.' },
          { label: 'Skip it', cash: 0, stress: 3, good: true, tip: 'Skipping small checkout-line temptations adds up over time.' },
        ],
      },
      {
        id: 'field_trip_snack',
        prompt: 'The field trip gift shop has souvenirs for sale.',
        options: [
          { label: 'Buy a souvenir', cash: -8, stress: -4, good: false, tip: 'Souvenirs are marked up because they\'re sold in a place you can\'t leave easily.' },
          { label: 'Take photos instead', cash: 0, stress: 4, good: true, tip: 'A free memory can be just as good as a souvenir.' },
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
        id: 'new_sneakers',
        prompt: 'A limited-edition sneaker drop just happened online.',
        options: [
          { label: 'Buy them immediately', cash: -55, stress: -10, good: false, tip: 'Limited-time hype is designed to make you skip thinking it over.' },
          { label: 'Sleep on it before deciding', cash: 0, stress: 8, good: true, tip: 'A cooling-off period before a big purchase prevents a lot of regret.' },
        ],
      },
      {
        id: 'phone_case',
        prompt: 'Your phone case cracked.',
        options: [
          { label: 'Buy the premium designer case', cash: -35, stress: -5, good: false, tip: 'A basic case protects your phone just as well as an expensive one.' },
          { label: 'Buy a basic replacement case', cash: -12, stress: 6, good: true, tip: 'Choosing function over brand name is a simple way to save.' },
        ],
      },
      {
        id: 'friend_loan',
        prompt: 'A friend asks to borrow $20 and says they\'ll pay you back.',
        options: [
          { label: 'Lend it without a plan to get it back', cash: -20, stress: 10, good: false, tip: 'Informal loans between friends often go unpaid and strain the friendship.' },
          { label: 'Say you can\'t this time', cash: 0, stress: -3, good: true, tip: 'It\'s okay to say no to a loan you can\'t afford to lose.' },
        ],
      },
      {
        id: 'streaming_bundle',
        prompt: 'A streaming service offers a "bundle deal" upgrade.',
        options: [
          { label: 'Upgrade to the bundle', cash: -15, stress: -4, good: false, tip: 'Subscription upgrades are easy to say yes to and easy to forget you\'re paying for.' },
          { label: 'Stick with what you have', cash: 0, stress: 4, good: true, tip: 'Reviewing whether you need an upgrade before buying saves money long-term.' },
        ],
      },
      {
        id: 'car_wash_gig',
        prompt: 'You get offered a quick paid gig helping a neighbor.',
        options: [
          { label: 'Take it and save the pay', cash: 25, stress: 3, good: true, tip: 'Extra income you save instead of spend builds a real cushion.' },
          { label: 'Take it and spend the pay same-day', cash: 8, stress: -4, good: false, tip: 'Extra income spent immediately never gets a chance to help you later.' },
        ],
      },
      {
        id: 'concert_ticket',
        prompt: 'Tickets for a concert you want just went on sale.',
        options: [
          { label: 'Buy the VIP ticket', cash: -60, stress: -8, good: false, tip: 'Upgrades like VIP tickets often cost far more than the extra value they add.' },
          { label: 'Buy the regular ticket', cash: -30, stress: 6, good: true, tip: 'Getting the experience without the upgrade still gets you there.' },
          { label: 'Skip it this time', cash: 0, stress: 8, good: true, tip: 'Skipping a fun event sometimes is a valid budgeting choice, not a failure.' },
        ],
      },
      {
        id: 'broken_headphones',
        prompt: 'Your headphones stopped working.',
        options: [
          { label: 'Buy the newest premium pair', cash: -45, stress: -6, good: false, tip: 'The newest version rarely justifies its price over a solid mid-range option.' },
          { label: 'Buy a reliable budget pair', cash: -18, stress: 5, good: true, tip: 'A budget option that does the job is a smart trade-off.' },
        ],
      },
      {
        id: 'group_chat_split',
        prompt: 'A group order got placed and you owe your share.',
        options: [
          { label: 'Pay your share right away', cash: -14, stress: 5, good: true, tip: 'Settling shared costs quickly avoids awkwardness and forgotten debts.' },
          { label: 'Put off paying your share', cash: 0, stress: -2, good: false, tip: 'Delaying small debts to friends can quietly damage trust.' },
        ],
      },
      {
        id: 'impulse_app_sub',
        prompt: 'An app offers a "free trial" that auto-renews into a paid plan.',
        options: [
          { label: 'Sign up without checking the terms', cash: -10, stress: -3, good: false, tip: 'Free trials often auto-bill unless you cancel — always check the terms.' },
          { label: 'Set a reminder to cancel before it charges', cash: 0, stress: 4, good: true, tip: 'A cancellation reminder is a simple habit that avoids surprise charges.' },
        ],
      },
      {
        id: 'clothes_sale',
        prompt: 'A clothing store is having a big sale.',
        options: [
          { label: 'Buy several things because they\'re "on sale"', cash: -40, stress: -5, good: false, tip: 'A sale only saves money if you were already planning to buy it.' },
          { label: 'Buy only what you actually needed', cash: -15, stress: 5, good: true, tip: 'Sticking to your list at a sale prevents overspending on "deals."' },
        ],
      },
      {
        id: 'savings_goal',
        prompt: 'You set a goal to save toward something bigger this month.',
        options: [
          { label: 'Move money to savings before spending on anything else', cash: -20, stress: 4, good: true, tip: '"Paying yourself first" means saving happens before spending, not after.' },
          { label: 'Save whatever is left at the end, if any', cash: 0, stress: -2, good: false, tip: 'Saving "whatever is left" often means saving nothing at all.' },
        ],
      },
      {
        id: 'gas_money',
        prompt: 'You need gas money to get to your job this week.',
        options: [
          { label: 'Budget exactly what you need for gas', cash: -12, stress: 5, good: true, tip: 'Budgeting for a known, recurring cost avoids last-minute stress.' },
          { label: 'Deal with it later if it comes up', cash: 0, stress: 12, good: false, tip: 'Ignoring a predictable cost just moves the stress to later, worse.' },
        ],
      },
    ],
  },

  '9-12': {
    title: 'Independent Living Month',
    startingCash: 280,
    startingStress: 35,
    incomePerDay: 45,
    cardPool: [
      {
        id: 'flat_tire',
        prompt: 'Your tire blew out on the way to class.',
        options: [
          { label: 'Pay $150 out of savings', cash: -150, stress: -5, good: true, tip: 'Paying cash for an emergency is exactly what an emergency fund is for.' },
          { label: 'Put it on a high-interest card', cash: -10, stress: 15, good: false, tip: 'Credit feels free today, but interest quietly makes it cost more later.' },
          { label: 'Take public transit for a week instead', cash: -20, stress: 20, good: false, tip: 'Avoiding a necessary fix doesn\'t make the underlying cost disappear.' },
        ],
      },
      {
        id: 'subscription_creep',
        prompt: 'You realize you\'re paying for three streaming services you barely use.',
        options: [
          { label: 'Cancel the ones you don\'t use', cash: 25, stress: -3, good: true, tip: '"Subscription creep" — small recurring charges — quietly drains a budget.' },
          { label: 'Keep them all "just in case"', cash: -25, stress: 6, good: false, tip: 'Paying for "just in case" access is still paying for something unused.' },
        ],
      },
      {
        id: 'credit_card_offer',
        prompt: 'You get approved for a new credit card with a big spending limit.',
        options: [
          { label: 'Use it only for planned expenses you can repay', cash: 0, stress: 3, good: true, tip: 'A high limit is not the same as money you actually have.' },
          { label: 'Treat the limit as extra spending money', cash: -180, stress: 20, good: false, tip: 'Credit limits are not income — spending against them creates real debt.' },
        ],
      },
      {
        id: 'roommate_split',
        prompt: 'A shared utility bill came in higher than expected.',
        options: [
          { label: 'Pay your exact share promptly', cash: -60, stress: 4, good: true, tip: 'Paying shared costs promptly and fairly keeps roommate finances healthy.' },
          { label: 'Wait for your roommate to bring it up', cash: 0, stress: 10, good: false, tip: 'Avoiding a bill you owe doesn\'t make it smaller — it makes it awkward.' },
        ],
      },
      {
        id: 'impulse_electronics',
        prompt: 'A flash sale on electronics pops up on your phone.',
        options: [
          { label: 'Buy it — the discount is huge', cash: -220, stress: -8, good: false, tip: 'A big discount on something you didn\'t need is still an unplanned expense.' },
          { label: 'Close the ad and move on', cash: 0, stress: 5, good: true, tip: 'Flash sales are designed to create urgency you don\'t actually have.' },
        ],
      },
      {
        id: 'side_gig',
        prompt: 'You get offered freelance work with flexible hours.',
        options: [
          { label: 'Take it and save the extra income', cash: 140, stress: 8, good: true, tip: 'Extra income put toward savings builds real financial security.' },
          { label: 'Take it and immediately upgrade your lifestyle', cash: 40, stress: -4, good: false, tip: '"Lifestyle inflation" — spending more the moment you earn more — erases the benefit of a raise.' },
        ],
      },
      {
        id: 'emergency_fund_check',
        prompt: "It's a good time to check in on your emergency fund.",
        options: [
          { label: 'Set aside money toward it this month', cash: -80, stress: -6, good: true, tip: 'An emergency fund built gradually is what turns a crisis into an inconvenience.' },
          { label: 'Skip it — nothing\'s gone wrong lately', cash: 0, stress: 8, good: false, tip: 'An emergency fund is built before the emergency, not during it.' },
        ],
      },
      {
        id: 'interest_only_payment',
        prompt: 'A card statement shows a "minimum payment" option.',
        options: [
          { label: 'Pay the full balance', cash: -200, stress: 6, good: true, tip: 'Paying in full avoids interest entirely — minimum payments let it compound.' },
          { label: 'Pay just the minimum', cash: -30, stress: -3, good: false, tip: 'Minimum payments keep an account "current" while the real balance keeps growing with interest.' },
        ],
      },
      {
        id: 'grocery_vs_delivery',
        prompt: "You're too tired to cook again this week.",
        options: [
          { label: 'Order delivery again', cash: -45, stress: -8, good: false, tip: 'Convenience costs compound fast — delivery fees and markups add up over a month.' },
          { label: 'Do a quick grocery run instead', cash: -20, stress: 5, good: true, tip: 'Cooking at home is one of the most reliable ways to cut monthly costs.' },
        ],
      },
      {
        id: 'investment_pitch',
        prompt: 'A friend pitches you on a "guaranteed" investment opportunity.',
        options: [
          { label: 'Research it thoroughly before committing any money', cash: 0, stress: 4, good: true, tip: '"Guaranteed" returns are the biggest red flag in any investment pitch.' },
          { label: 'Put money in because your friend seems confident', cash: -150, stress: 18, good: false, tip: 'Confidence isn\'t evidence — investing without research risks real losses.' },
        ],
      },
      {
        id: 'rent_increase',
        prompt: 'Your landlord notifies you of a rent increase next month.',
        options: [
          { label: 'Adjust your budget now to plan ahead', cash: 0, stress: 5, good: true, tip: 'Adjusting a budget before a known cost hits avoids a scramble later.' },
          { label: 'Worry about it when the bill actually changes', cash: 0, stress: 15, good: false, tip: 'Waiting until a known cost increase hits just concentrates the stress into one bad month.' },
        ],
      },
      {
        id: 'bonus_check',
        prompt: 'You get an unexpected small bonus at work.',
        options: [
          { label: 'Split it between savings and a small treat', cash: 60, stress: -4, good: true, tip: 'Balancing saving and enjoying a windfall is healthier than doing only one.' },
          { label: 'Spend the entire bonus', cash: 20, stress: -6, good: false, tip: 'A windfall spent entirely provides no lasting benefit once it\'s gone.' },
        ],
      },
    ],
  },
};

export default SURVIVE_BANK;
