// src/data/curriculum/modules/L1M1.js
// Level 1 · Module 1 — Cash Flow Engineering & The Surplus Ratio
//
// This is the depth template every module follows. Shape:
//
//   intro        long-form framing — why this module exists at all
//   lessons[]    each a full page: sections of prose, a worked example,
//                key terms, common mistakes, then a hands-on exercise with
//                numbered steps and the Vault artifact it produces
//   wrapUp       what you should now have, and what it unlocks next
//
// Written to be read, not skimmed. Someone starting a business has usually
// never had any of this explained properly, and a bullet list doesn't teach
// it — so sections run to real paragraphs with concrete numbers.

export default {
  id: 'L1M1',
  level: 'L1',
  index: 0,
  title: 'Cash Flow Engineering & The Surplus Ratio',
  subtitle: 'Module 1',
  objective:
    'Turn an ordinary paycheck into a system that reliably produces surplus — the money that eventually becomes your seed capital.',
  duration: '2–3 hours, plus a month of tracking',

  intro: [
    'Almost every business that dies young dies of the same thing: it ran out of money before it found its footing. Not a bad idea, not a lazy founder — it simply ran out of runway. And the single biggest factor in how much runway you get is decided before the business exists at all, in how your personal finances are arranged.',
    'This module is about engineering a surplus. Not budgeting in the sense of denying yourself coffee, but building a repeatable structure where a known amount of money moves out of your spending reach every month and accumulates somewhere you have decided in advance. That accumulated pile is what lets you take a calculated risk later, and it is what a lender looks at when deciding whether you can absorb a bad quarter.',
    'There is a second reason this comes first. Every later level in this track assumes you can answer questions like "what is your monthly burn?" and "how many months could you survive with no income?" — and assumes the answers are written down rather than guessed at. Underwriters ask. Investors ask. You will need the number long before anyone asks you for it.',
  ],

  lessons: [
    {
      key: 'l1_income_streams',
      title: 'Income Streams & The Gross-to-Net Reality',
      objective: 'Understand what actually arrives in your account, and why it is so much less than the number on your offer letter.',
      sections: [
        {
          heading: 'The number you were hired at is not the number you get',
          body: 'A salary is quoted in gross terms — the total before anything is removed. What lands in your account is net pay, and the gap between them is usually somewhere between 20% and 35% depending on where you live and how you are set up. People routinely plan their lives against the gross figure and then wonder why the maths never works.\n\nThe deductions fall into a few buckets. Federal income tax is withheld based on the information you supplied on your W-4. Social Security and Medicare — together called FICA — are taken at a flat rate on your wages, currently 7.65% for an employee with the employer matching that amount separately (reviewed 2026). Then state and sometimes local income tax, if your state levies one. Then anything voluntary: health insurance premiums, retirement contributions, HSA or FSA deposits.',
        },
        {
          heading: 'Why this matters more once you own a business',
          body: 'As an employee, your employer pays half of your FICA. When you become self-employed, you pay both halves — the full 15.3% — and it is called self-employment tax. This single fact is behind a large share of the tax planning in Level 4, and it is the reason the S-Corp election exists as a strategy at all.\n\nSo the habit of reading a paystub carefully is not busywork. It is the beginning of understanding a cost that is about to roughly double for you, and understanding it now makes the later decisions legible rather than mysterious.',
        },
        {
          heading: 'Variable and irregular income',
          body: 'If your income is commission-based, freelance, seasonal, or otherwise lumpy, do not average it and move on. Take the lowest three months from the last year and treat that as your planning baseline. Anything above it is surplus rather than expected income.\n\nThis feels pessimistic and it is deliberately so. Planning against your average means that in a bad month you are structurally short, which is when people reach for credit cards at 24% interest. Planning against your floor means bad months are survivable and good months visibly accelerate you.',
        },
      ],
      keyTerms: [
        { term: 'Gross pay', definition: 'Total earnings before any deduction.' },
        { term: 'Net pay', definition: 'What actually reaches your bank account.' },
        { term: 'FICA', definition: 'Social Security and Medicare tax. 7.65% as an employee; 15.3% once self-employed (reviewed 2026).' },
        { term: 'Withholding', definition: 'Tax your employer removes and sends to the government on your behalf, based on your W-4.' },
      ],
      example: {
        title: 'Worked example — a $60,000 salary',
        body: 'Gross monthly pay is $5,000. From that:\n\n• Federal withholding, roughly $480\n• FICA at 7.65%, $383\n• State tax at 4%, $200\n• Health insurance premium, $180\n• 401(k) at 5%, $250\n\nTotal deductions: $1,493. Net pay: $3,507.\n\nSo a "sixty thousand dollar job" delivers about $42,000 a year in spendable money — 70% of the headline. If this person had been planning against $5,000 a month, they were planning against money that never existed. Note also the $250 going to the 401(k): that is not lost, it is deferred. The true "gone" figure is $1,243.',
      },
      pitfalls: [
        'Planning your life against gross pay. It is the single most common budgeting error.',
        'Forgetting that bonuses and commissions are often withheld at a different, higher rate.',
        'Treating a 401(k) or HSA contribution as an expense. It is savings that happens to move automatically.',
        'Averaging irregular income instead of planning against its floor.',
      ],
      exercise: {
        intro: 'Build your real gross-to-net picture from actual documents rather than memory. You will use this number in every module that follows.',
        steps: [
          { title: 'Gather your last three paystubs', detail: 'Three, not one — so you can see what varies. If you are self-employed, use your last three months of deposits instead.' },
          { title: 'Write down gross pay for each period', detail: 'Note the pay frequency too. Weekly, biweekly (26 per year) and semi-monthly (24 per year) are different and people conflate them constantly.' },
          { title: 'List every deduction line by name and amount', detail: 'Do not lump them together. You want to see federal, FICA, state, insurance, and retirement separately, because you will act on them differently later.' },
          { title: 'Separate true deductions from deferred savings', detail: 'Retirement and HSA contributions are yours. Mark them as savings, not as money lost.' },
          { title: 'Calculate your true monthly net', detail: 'If paid biweekly, multiply per-period net by 26 and divide by 12 — do not multiply by 2. That error hides two full paychecks a year.' },
          { title: 'Record your planning baseline', detail: 'If your income is steady, that is your monthly net. If it is irregular, it is the lowest of your last twelve months.' },
        ],
        checklist: [
          'Recorded gross pay per period',
          'Listed every withholding line separately',
          'Separated deferred savings from true deductions',
          'Calculated true monthly take-home',
          'Set a planning baseline figure',
        ],
        deliverable: 'Personal Gross-to-Net Report',
      },
    },

    {
      key: 'l1_fixed_variable',
      title: 'Fixed vs. Variable Outflows',
      objective: 'Separate what you are contractually committed to from what you actually choose each month — because only one of them can be changed quickly.',
      sections: [
        {
          heading: 'The distinction that makes a budget actionable',
          body: 'Fixed costs are the ones that arrive whether or not you pay attention: rent or mortgage, insurance premiums, loan payments, subscriptions, phone plans. The amount is set by a contract and changing it requires a decision, sometimes a negotiation, occasionally a move.\n\nVariable costs move with your behaviour: groceries, fuel, eating out, shopping, entertainment. They are the ones people try to attack first because they feel controllable, and they are also where most budgets quietly fail, because willpower is not a system.\n\nThe reason to separate them is that they respond to completely different interventions. A fixed cost is fixed until you renegotiate or cancel it — but when you do, the saving repeats every month forever with no ongoing effort. A variable cost can be cut today and creeps straight back next month unless something structural changed.',
        },
        {
          heading: 'Where the real money usually is',
          body: 'Most people attack the $6 coffee and ignore the $180 insurance premium they have not shopped in four years. One of those is worth $180 a month once you deal with it; the other is worth $120 a month and requires sustained self-denial forever.\n\nThe highest-value first pass is almost always: shop your insurance, audit your subscriptions, and check whether any fixed loan is refinanceable. Those three usually free more money in an afternoon than six months of variable-cost discipline, and once done they stay done.',
        },
        {
          heading: 'The subscription problem',
          body: 'Recurring small charges are engineered to sit below the threshold at which you would notice them. Eight subscriptions at $12 is $96 a month, $1,152 a year, and almost nobody can list all eight from memory.\n\nThe reliable way to find them is not memory — it is going through three months of statements line by line and writing down every charge that repeats. Expect to find at least one you had genuinely forgotten about, and expect at least one to be a free trial that converted.',
        },
      ],
      keyTerms: [
        { term: 'Fixed cost', definition: 'Same amount each period, set by contract or commitment.' },
        { term: 'Variable cost', definition: 'Changes month to month based on your choices.' },
        { term: 'Discretionary spending', definition: 'Variable costs you could stop entirely without material consequence.' },
        { term: 'Lifestyle creep', definition: 'The tendency for fixed costs to rise to absorb any increase in income.' },
      ],
      example: {
        title: 'Worked example — finding $340 a month',
        body: 'From our $3,507 net-pay earner:\n\nFixed: rent $1,200 · car payment $310 · car insurance $145 · phone $85 · internet $70 · subscriptions $96 · gym $45. Total $1,951.\n\nVariable (three-month average): groceries $420 · fuel $160 · eating out $290 · shopping $180 · entertainment $90. Total $1,140.\n\nTotal outflow $3,091 against $3,507 net, leaving $416.\n\nNow the fixed-cost pass. Shopping the car insurance brings $145 down to $95. Cancelling four unused subscriptions removes $52. Dropping the unused gym removes $45. That is $142 a month recovered, permanently, from about two hours of work — and no behaviour change at all. Add a deliberate $200 cut to eating out and shopping, and surplus goes from $416 to $758.',
      },
      pitfalls: [
        'Estimating from memory. Always work from actual statements — people underestimate variable spending by 20–30% routinely.',
        'Using one month as your sample. Use three, so annual and irregular costs show up.',
        'Forgetting annual charges. An $80 yearly renewal is $6.67 a month and belongs in the fixed column.',
        'Cutting variable costs first. The fixed-cost pass pays more and requires no ongoing willpower.',
      ],
      exercise: {
        intro: 'Categorise ninety days of real spending. This is the most tedious exercise in the level and the one that changes the most for people.',
        steps: [
          { title: 'Export or open three months of account and card statements', detail: 'Every account. Money hides in the one you rarely look at.' },
          { title: 'Mark every charge as fixed or variable', detail: 'When unsure, ask: would this arrive if I did nothing at all this month? If yes, it is fixed.' },
          { title: 'Flag every repeating charge', detail: 'Anything appearing in all three months. This is your subscription and commitment list.' },
          { title: 'Convert annual charges to a monthly figure', detail: 'Divide by twelve and include them, or they will ambush you.' },
          { title: 'Total each column', detail: 'Fixed total and variable total, then both against your net pay from the previous lesson.' },
          { title: 'Run the fixed-cost pass', detail: 'For each fixed line ask: can this be cancelled, renegotiated, or shopped? Do the three highest-value ones now.' },
        ],
        checklist: [
          'Listed all fixed monthly costs',
          'Listed variable costs from 90 days of real statements',
          'Identified every repeating subscription',
          'Converted annual charges to monthly',
          'Totalled each category against net pay',
          'Acted on at least three fixed-cost reductions',
        ],
        deliverable: 'Baseline Monthly Burn Rate Profile',
      },
    },

    {
      key: 'l1_runway',
      title: 'Burn Rate & Personal Runway',
      objective: 'Calculate how many months you could survive with zero income — the number that decides how much risk you can responsibly take.',
      sections: [
        {
          heading: 'Runway is the number that governs everything',
          body: 'Your burn rate is what it costs to keep your life running for a month. Your runway is your liquid reserves divided by that burn — the number of months you could continue with no income arriving at all.\n\nThis number quietly sets the ceiling on every business decision you will make. Someone with two months of runway must take the first client who offers, at whatever rate, and cannot walk away from a bad deal. Someone with nine months can be selective, can turn down work that would trap them, and can survive the gap between launching and earning. The second person is not braver. They are better capitalised.',
        },
        {
          heading: 'Survival burn versus comfortable burn',
          body: 'Calculate two numbers, not one. Your comfortable burn is what you spend now. Your survival burn is what you would spend if income stopped tomorrow and you cut everything non-essential — the stripped version: housing, utilities, food, insurance, minimum debt payments, transport to work.\n\nThe gap between them is usually large, and it is genuinely good news. A $3,100 comfortable burn might have a $2,100 survival burn. With $12,000 saved, that is four months of comfort or nearly six months of survival. In a crisis you get the second number, and knowing it in advance turns a panic into a plan.',
        },
        {
          heading: 'How much is enough',
          body: 'The conventional guidance is three to six months of expenses, and it is reasonable. But the right answer depends on your situation: a dual-income household with stable employment sits safely at three, while a single earner with variable income and dependants should be closer to nine.\n\nIf you intend to start a business, add the expected time to first revenue on top. Most businesses take longer than the founder predicted to produce meaningful income. If your plan says three months, hold six.',
        },
        {
          heading: 'What counts as reserve',
          body: 'Only genuinely liquid money counts. Cash and high-yield savings count. A brokerage account partly counts, with the caveat that you may be forced to sell at a bad moment. Retirement accounts do not count — early withdrawal triggers tax and penalty and destroys compounding you cannot rebuy. Credit is not a reserve; an available credit line is a liability waiting to happen, not an asset.',
        },
      ],
      keyTerms: [
        { term: 'Burn rate', definition: 'Total monthly cost of running your life.' },
        { term: 'Runway', definition: 'Liquid reserves ÷ monthly burn, expressed in months.' },
        { term: 'Survival burn', definition: 'Burn after stripping everything non-essential.' },
        { term: 'Liquid', definition: 'Convertible to spendable cash within days, without penalty.' },
      ],
      example: {
        title: 'Worked example — two founders, same idea',
        body: 'Both have a $3,100 monthly burn and a $2,100 survival burn.\n\nFounder A has $6,200 saved. Comfortable runway: 2 months. Survival runway: 2.9 months. Founder A must generate revenue almost immediately, will accept the first client at any price, and cannot refuse a contract that is bad for them.\n\nFounder B has $19,000 saved. Comfortable runway: 6.1 months. Survival runway: 9 months. Founder B can spend two months on customer discovery before building anything, can decline a client who would consume all their time at a low rate, and can absorb a slow first quarter.\n\nSame idea, same ability. Wildly different odds — and the difference was decided months earlier, by a savings rate.',
      },
      pitfalls: [
        'Counting retirement accounts as reserves. The penalty and lost compounding make this a last resort, not a buffer.',
        'Counting available credit as runway. Credit is a liability you have not used yet.',
        'Calculating only comfortable burn and never working out the survival figure.',
        'Forgetting that leaving a job usually means buying your own health insurance — a new fixed cost precisely when income stops.',
      ],
      exercise: {
        intro: 'Produce both burn numbers and your true runway, then set a target.',
        steps: [
          { title: 'Total your comfortable monthly burn', detail: 'Fixed plus variable from the previous lesson.' },
          { title: 'Build the survival version', detail: 'Strip every non-essential line. Keep housing, utilities, food, insurance, minimum debt payments and essential transport. Add health insurance if leaving a job would mean buying it.' },
          { title: 'Total your genuinely liquid reserves', detail: 'Cash and savings. Exclude retirement accounts and all credit.' },
          { title: 'Divide reserves by each burn figure', detail: 'You now have comfortable runway and survival runway, in months.' },
          { title: 'Set your target reserve', detail: 'Choose a month count based on your stability and dependants, then multiply by burn. That is your target figure.' },
          { title: 'Calculate the gap and a monthly contribution', detail: 'Target minus current, divided by how many months you will take to get there. That figure feeds directly into the next lesson.' },
        ],
        checklist: [
          'Calculated comfortable monthly burn',
          'Calculated survival monthly burn',
          'Totalled genuinely liquid reserves',
          'Calculated runway in months for both figures',
          'Set a target reserve amount',
          'Calculated the required monthly contribution to reach it',
        ],
        deliverable: 'Emergency Runway Calculator Log',
      },
    },

    {
      key: 'l1_owners_surplus',
      title: "Building the Owner's Surplus",
      objective: 'Automate the allocation so surplus accumulates structurally, without depending on you remembering or resisting anything.',
      sections: [
        {
          heading: 'Why automation beats discipline',
          body: 'The standard approach is to spend through the month and save whatever survives. It fails reliably, because spending expands to fill available money and because "whatever is left" is a decision you have to win thirty times a month.\n\nInverting it removes the contest. The allocation happens automatically on payday, before you have seen the money as spendable. What remains in the checking account is genuinely yours to spend, and you can spend all of it without guilt, because the allocation already happened. This is the entire trick: not more willpower, fewer decisions.',
        },
        {
          heading: 'A starting allocation',
          body: 'One common split is 50% essentials, 20% debt and savings, 20% business seed capital, 10% lifestyle. Treat it as a starting shape, not a rule — if your rent alone is 45% of net pay, the 50% essentials bucket is already fiction and you need a version that matches reality.\n\nWhat matters far more than the exact percentages is that a business seed bucket exists at all and is separate. Seed capital mixed into general savings gets spent on emergencies and never accumulates. In its own account, with its own name, it becomes real — and watching it grow is what keeps the plan alive on the months when nothing else is going well.',
        },
        {
          heading: 'Separate accounts are the mechanism',
          body: 'Buckets need to be physically separate accounts, not mental categories inside one balance. A single account showing $8,000 reads as $8,000 available, whatever you have told yourself about which portion is spoken for.\n\nA workable structure: a checking account that receives income and pays fixed costs; a savings account for the emergency reserve; a separate account for business seed capital; and if self-employed, a tax holdback account. Most banks allow several accounts at no cost, and the friction of moving money between them is a feature rather than an annoyance.',
        },
        {
          heading: 'Timing it to payday',
          body: 'Schedule the automatic transfers for the day after payday. Money that sits in checking for two weeks gets spent; money that leaves the day it arrives is never psychologically available.\n\nStart smaller than feels right. An allocation you can actually sustain for twelve months beats an ambitious one you abandon in six weeks — and the habit is worth more than the first year\'s amount. You can raise it once it is boring.',
        },
      ],
      keyTerms: [
        { term: 'Pay yourself first', definition: 'Allocating to savings before spending, rather than saving the remainder.' },
        { term: 'Seed capital', definition: 'Money set aside specifically to start or buy a business.' },
        { term: 'Tax holdback', definition: 'A separate account holding money owed in future tax, so it is not accidentally spent.' },
        { term: 'Sinking fund', definition: 'Saving monthly toward a known future cost, so it never arrives as a shock.' },
      ],
      example: {
        title: 'Worked example — allocating $3,507',
        body: 'Applying a realistic version of the split to our earner, after the fixed-cost pass freed $142:\n\n• Essentials (rent, utilities, insurance, groceries, transport): $1,950 — 56%\n• Debt and emergency savings: $700 — 20%\n• Business seed capital: $500 — 14%\n• Lifestyle, spent freely and without guilt: $357 — 10%\n\nEssentials run above the textbook 50% because rent is what it is. The business seed bucket is smaller than the template suggests — and it still accumulates $6,000 in a year, which is enough to form an entity, cover the first year of compliance, and fund a genuine validation budget.\n\nThe $357 lifestyle figure is deliberate. A plan with no room to enjoy anything gets abandoned, and an abandoned plan saves nothing at all.',
      },
      pitfalls: [
        'Keeping buckets as mental categories in one account. It does not work; the balance reads as available.',
        'Setting an allocation so aggressive you abandon it. Sustainable beats optimal.',
        'Transferring manually. If it needs a decision each month, it will eventually not happen.',
        'Skipping the lifestyle bucket entirely. Plans with no slack do not survive contact with a real year.',
      ],
      exercise: {
        intro: 'Set up the accounts and the automatic transfers. This is the lesson where the module stops being analysis and becomes a standing system.',
        steps: [
          { title: 'Choose your allocation percentages', detail: 'Start from 50/20/20/10 and adjust to your actual essentials figure. It must add to 100% and it must be achievable.' },
          { title: 'Open the accounts you are missing', detail: 'At minimum: emergency savings and business seed. Name them explicitly in your banking app — "Seed Capital" behaves differently in your head from "Savings 2".' },
          { title: 'Calculate the dollar amount per bucket', detail: 'Apply your percentages to your planning baseline from lesson one, not to gross pay.' },
          { title: 'Schedule automatic transfers for the day after payday', detail: 'Set them up now, in the banking app, while you are here. An intention scheduled for later is not a system.' },
          { title: 'Run it for one full month and adjust', detail: 'If you ended up moving money back out of a bucket, the allocation was too aggressive. Lower it — that is information, not failure.' },
          { title: 'Diarise a quarterly review', detail: 'Raise the seed allocation whenever income rises, before the increase gets absorbed by lifestyle creep.' },
        ],
        checklist: [
          'Chose an allocation split that matches real essentials',
          'Opened and named a separate account per bucket',
          'Calculated the dollar amount for each bucket',
          'Scheduled the automatic transfers',
          'Ran one full month and adjusted',
          'Set a quarterly review reminder',
        ],
        deliverable: "Owner's Surplus Allocation Map",
      },
    },
  ],

  wrapUp: [
    'You should now be holding four things: a true net income figure, a categorised picture of where it goes, two burn numbers with a runway in months, and an automated allocation moving money into a named seed account every payday.',
    'That combination is what the rest of this track stands on. Module 2 takes your credit profile and turns it from a passive score into something you deliberately shape, because it is the other half of what any lender evaluates — and unlike your income, it can be improved substantially within a few months.',
    'One honest note before moving on: if running these numbers revealed that your outflow exceeds your income, do not skip ahead. That gap is the single highest-return problem you have, and no amount of business structuring later compensates for it.',
  ],
};
