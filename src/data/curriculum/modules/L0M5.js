// src/data/curriculum/modules/L0M5.js
// Level 0 · Module 5 — Moving Up: Your Personal Upgrade Plan
//
// The payoff module. Everything before this explains the system; this one
// turns it into moves, sequenced by where a person actually starts — including
// the large number of people for whom "moving up" is getting fully paid and
// protected as a worker, not starting a business.
//
// Checklists and deliverables inherit from ownershipCurriculumFoundations.js.
// Side-business tax arithmetic is exact (checked by script).

export default {
  id: 'L0M5',
  level: 'L0',
  index: 4,
  title: 'Moving Up — Your Personal Upgrade Plan',
  subtitle: 'Module 5',
  objective:
    'Turn everything in this level into a sequence of real moves, starting from exactly where you are today.',
  duration: '2–3 hours, then 90 days of doing',

  intro: [
    'The previous four modules explained how the system works: who writes the rules, how money is priced, and how the same economy treats consumers, workers and owners differently. Understanding that is valuable. It changes nothing until it turns into action.',
    'This module is the action. It starts with an honest snapshot of where you stand, then covers the two moves that most often change a person\'s trajectory — starting a real side business safely, and staying compliant so a small operation can\'t be wiped out by one notice — and ends with a dated 90-day plan built around your actual starting point.',
    'One thing to say plainly before starting. Moving up does not have to mean becoming a business owner. For someone buried in high-interest debt, moving up means stopping the losses. For someone with a stable job, it may mean collecting every dollar of compensation they are owed and building savings that outrun inflation. Ownership is the top of the ladder, not a requirement for climbing it — and trying to jump straight to it from an unstable base is one of the most common ways people end up worse off.',
  ],

  lessons: [
    {
      key: 'l0_role_audit',
      title: 'Where You Stand Today',
      objective:
        'An honest snapshot: where your money comes from, where it goes, what you owe, what protects you, and what you\'re exposed to.',
      sections: [
        {
          heading: 'Why a snapshot comes first',
          body: 'People tend to plan from how their finances feel rather than from what they are. A good month feels like security; a bad week feels like crisis. Neither is a reliable basis for decisions.\n\nA snapshot fixes that. It puts five numbers side by side: income by role, monthly outflow, what your debt costs, how many months you could survive with no income, and your biggest single exposure. You already produced most of the inputs in the earlier modules. This lesson assembles them into one page and uses it to decide where to start.',
        },
        {
          heading: 'The three starting tiers',
          body: 'Most people fall into one of three starting positions. Placing yourself honestly is the most important step in the module, because the right first moves are completely different for each.\n\nStabilise. Monthly outflow meets or exceeds income, high-interest balances are growing or not shrinking, there\'s little or no emergency cushion, or bills are sometimes late. The priority is stopping losses. Building anything on top of an active leak doesn\'t hold.\n\nCapture. Cash flow is stable and bills are paid, but value is being left unclaimed: an uncollected employer match, idle cash earning nothing, avoidable fees, pay below market rate, rights not used, a withholding setup that\'s wrong. The priority is collecting what you\'re already owed.\n\nBuild. Cash flow is stable, value is being captured, there\'s a real surplus and a growing reserve. The priority is putting that surplus to work: skills, investments, a side business, and eventually the ownership levels in this curriculum.',
        },
        {
          heading: 'Naming your biggest exposure',
          body: 'Alongside the tier, write down the one thing most likely to set you back badly. It might be a single income with no reserve, a large variable-rate balance, no health coverage, a job at real risk, a car loan worth more than the car, or depending on a benefit with a cliff just above your income.\n\nNaming it matters because plans tend to optimise for growth and ignore fragility. One unplanned event hitting an unprotected exposure can undo a year of progress. Reducing the biggest exposure is often worth more than any growth move on your list.',
        },
      ],
      keyTerms: [
        { term: 'Stabilise tier', definition: 'Outflow meets or exceeds income, or high-cost debt is growing. Priority: stop losses.' },
        { term: 'Capture tier', definition: 'Stable cash flow, but unclaimed value. Priority: collect what you\'re owed.' },
        { term: 'Build tier', definition: 'Stable and capturing, with a real surplus. Priority: put surplus to work.' },
        { term: 'Exposure', definition: 'A single risk that could set you back badly if it happened.' },
      ],
      example: {
        title: 'Worked example — a filled-in snapshot',
        body: 'Marcus, 31, warehouse lead.\n\nIncome by role: $3,900 a month net from his job (worker). $300 a month from occasional furniture repair for neighbours (owner, informal).\n\nOutflow: $3,850 a month. Surplus: $350.\n\nDebt: $7,200 on two cards at 23% and 25%, costing about $145 a month in interest. A car loan at a fixed 7%.\n\nReserve: $900 — about a week of expenses.\n\nBiggest exposure: one income, one week of reserve, and card balances that grow faster than he pays them down.\n\nTier: Stabilise, leaning toward Capture. He is not in crisis, but $145 a month in interest is nearly half his surplus, and a single car repair would go on a card. His employer offers a 3% match he doesn\'t use. His repair work is real but unrecorded.\n\nThe snapshot makes the order obvious: stop the card interest and build a small buffer first, then collect the match, then formalise the repair work. A plan starting with "launch a furniture business" would be building on a leak.',
      },
      pitfalls: [
        'Placing yourself in the Build tier because it feels better. Starting from the wrong tier produces the wrong plan.',
        'Planning from how finances feel this week rather than from real numbers.',
        'Focusing only on growth and ignoring your biggest exposure.',
        'Leaving informal income out of the snapshot. Cash repair work, resale and gig income are real owner-type income.',
      ],
      quiz: [
        {
          question: 'Someone has $600 a month of surplus, $9,000 on cards at 24%, and no emergency fund. They want to start investing in index funds. What does the tier model suggest comes first?',
          options: [
            'Investing, because starting early matters most',
            'Stabilising: pay down the 24% debt and save a cushion',
            'Starting a side business to earn more money first',
          ],
          answerIndex: 1,
          explain: 'Paying down a 24% balance is a guaranteed 24% "return"; no investment reliably beats that. Without a cushion, the next surprise lands back on the card. Stabilise first, then build.',
        },
        {
          question: 'Why name a single "biggest exposure" in the snapshot?',
          options: [
            'Lenders ask for it on a loan application',
            'One unprotected risk can undo the progress',
            'It matters less once your income is growing',
          ],
          answerIndex: 1,
          explain: 'Plans naturally chase growth and overlook fragility. Reducing the one thing most likely to set you back is often the highest-value move available.',
        },
      ],
      exercise: {
        intro: 'Assemble one page from the work you\'ve already done in this level, and place yourself honestly.',
        steps: [
          { title: 'Record monthly income by role', detail: 'From your role map in Module 1. Include informal income.' },
          { title: 'Record monthly outflow and surplus', detail: 'Surplus is income minus outflow. If it\'s negative, write it as negative.' },
          { title: 'Record total debt and its monthly cost', detail: 'From your retail debt report in Module 2 — total balance and total monthly interest.' },
          { title: 'Record your reserve in months', detail: 'Liquid savings ÷ monthly essential costs.' },
          { title: 'Name your biggest exposure', detail: 'One sentence. The thing most likely to set you back badly.' },
          { title: 'Place yourself in a tier', detail: 'Stabilise, Capture or Build — using the definitions, not how you\'d like to feel. Write one sentence explaining why.' },
        ],
      },
    },

    {
      key: 'l0_side_business',
      title: 'The Side-Business Bridge',
      objective:
        'A real side business opens the owner\'s rulebook to a worker. A fake one — or a job relabelled as contracting — opens an audit. Here is the difference.',
      sections: [
        {
          heading: 'Why a side business is the bridge',
          body: 'For most people the path from worker to owner doesn\'t start with quitting a job. It starts alongside one. A side business lets someone test demand, build skills and a customer base, and learn the owner\'s side of taxes and compliance — while the job keeps paying the bills and provides benefits.\n\nIt\'s also the point where Module 4\'s rulebook actually starts to apply: genuine business expenses become deductible against that business\'s income, and a real track record begins to form.',
        },
        {
          heading: 'What a real side business is — and what it isn\'t',
          body: 'A real side business has customers who pay you, work that you control, and a genuine intention to make a profit. It can be small. Repairing furniture for paying neighbours counts. Selling products you make counts. Freelance services for your own clients count.\n\nThree things are not side businesses, whatever the paperwork says. Your employer\'s work relabelled as contracting is a job with fewer protections — potentially misclassification, as Module 3 covered. A hobby with a business name attached is still a hobby, and its expenses aren\'t deductible under current rules (reviewed 2026). And a company formed to make personal spending look deductible is not a business at all; it\'s tax risk with a logo.',
        },
        {
          heading: 'Check your job before you start',
          body: 'Read your employment agreement and handbook before launching anything. Look for three things. A moonlighting or conflict-of-interest policy, which may require disclosure. A non-compete or non-solicitation clause, which may restrict working in the same field or with the same clients — enforceability varies a great deal by state. And an intellectual property assignment clause, which may give your employer rights over things you create, especially using their equipment, their time or related to their business.\n\nKeeping side work on your own devices, on your own time and outside your employer\'s line of business avoids most of the trouble people get into here.',
        },
        {
          heading: 'Setting it up cleanly from day one',
          body: 'You don\'t need to form an LLC to start; a sole proprietorship begins the moment you do business. Whether an LLC is worth it depends on your liability risk, and Level 2 covers that decision. Many sole proprietors get a free EIN from the IRS anyway, so they can give clients that number instead of their Social Security number.\n\nWhat you do need from day one: a separate bank account, so business and personal money never mix; a simple record of every dollar in and out; any licence your city, county or state requires for the activity; and a habit of saving for tax on every payment you receive.',
        },
        {
          heading: 'How side income is taxed — and how to pay it',
          body: 'Side business profit is reported on Schedule C. Once net self-employment earnings reach $400 in a year, self-employment tax applies (reviewed 2026), on top of income tax.\n\nBecause no employer is withholding tax from that income, you have to arrange to pay it during the year. There are two ways. You can make quarterly estimated tax payments, which are generally required if you expect to owe $1,000 or more (reviewed 2026). Or — often simpler for someone with a job — you can increase the withholding at your day job using a new W-4, so the extra tax on your side income comes out of your paycheck. Withholding is treated as paid evenly through the year, which can help avoid underpayment penalties even if you adjust it late.',
        },
      ],
      keyTerms: [
        { term: 'Sole proprietorship', definition: 'A business run by one person without forming an entity — it exists as soon as you do business.' },
        { term: 'Schedule C', definition: 'The tax form where a sole proprietor reports business income and expenses.' },
        { term: 'Estimated tax', definition: 'Quarterly payments on income with no withholding — generally required if you expect to owe $1,000 or more (reviewed 2026).' },
        { term: 'IP assignment clause', definition: 'A term in an employment agreement that may give an employer rights over things you create.' },
      ],
      example: {
        title: 'Worked example — how much to set aside',
        body: 'Tanya does bookkeeping for three small local businesses in the evenings. In a year she earns $12,000 and has $2,500 of genuine expenses — software, a portion of her internet and phone, and a course. Net profit: $9,500.\n\nSelf-employment tax: 15.3% of 92.35% of $9,500 — about $1,342.\n\nIncome tax: her day job puts her in the 12% bracket. After deducting half her self-employment tax, roughly $1,059 of income tax is due on the side profit.\n\nTotal: about $2,401 — roughly a quarter of her profit, before any other deductions she may qualify for.\n\nSo she moves 25% of every client payment into a separate tax account the day it arrives. Instead of quarterly estimates, she files a new W-4 at her day job so an extra $200 a month is withheld — $2,400 a year. At tax time there\'s no surprise bill, and the money was never sitting in her spending account to be tempted by.',
      },
      pitfalls: [
        'Relabelling your employer\'s work as a side business. That\'s losing protections, not gaining owner status.',
        'Starting side work without reading your employment agreement\'s moonlighting, non-compete and IP clauses.',
        'Mixing side-business money into your personal account.',
        'Spending every payment and facing a large tax bill in April.',
        'Forming an LLC mainly to make personal spending deductible. It doesn\'t work that way.',
        'Spending heavily before you have a single paying customer.',
      ],
      quiz: [
        {
          question: 'You have a day job and start earning side-business profit. What\'s one simple alternative to making quarterly estimated tax payments?',
          options: [
            'None; quarterly payments are the only way',
            'More withholding at the day job via a W-4',
            'Paying it all in April with no penalty at all',
          ],
          answerIndex: 1,
          explain: 'Extra withholding from a paycheck can cover tax on side income, and withholding is treated as paid evenly through the year — which can help avoid underpayment penalties. Waiting until April with no payments can trigger them.',
        },
        {
          question: 'You design logos for your own clients at night, but you used your employer\'s laptop and your agreement has an IP assignment clause. What\'s the risk?',
          options: [
            'None, because you did the work on your own time',
            'Your employer may be able to claim the work',
            'Your clients own everything you make, automatically',
          ],
          answerIndex: 1,
          explain: 'IP clauses vary, and using employer equipment strengthens an employer\'s potential claim. Reading the agreement and keeping side work entirely on your own devices and time avoids most disputes.',
        },
        {
          question: 'At what point does self-employment tax generally apply to side-business profit?',
          options: [
            'Only once profit passes $10,000 in a year',
            'Once net earnings reach $400 in a year',
            'Never, as long as you also have a W-2 job',
          ],
          answerIndex: 1,
          explain: 'Self-employment tax generally applies once net self-employment earnings are $400 or more (reviewed 2026), whether or not you also have a job. It\'s why a quarter of profit is a sensible starting set-aside.',
        },
      ],
      exercise: {
        intro: 'Decide whether a side business is right for you now — and if it is, set it up so it helps rather than hurts.',
        steps: [
          { title: 'Describe the service or product and who pays for it', detail: 'One sentence each. If you can\'t name who pays, the first job is finding out whether anyone will — see Level S1.' },
          { title: 'Confirm it isn\'t your employer\'s work relabelled', detail: 'Your own clients, your own control, your own profit — or it isn\'t a side business.' },
          { title: 'Read your employment agreement', detail: 'Check moonlighting, non-compete, non-solicitation and IP assignment clauses. Note anything that applies.' },
          { title: 'Check licence requirements', detail: 'Search your city, county and state for licences required for your specific activity.' },
          { title: 'Open a separate account', detail: 'Every business dollar goes in and out of it. Nothing personal.' },
          { title: 'Set your tax set-aside', detail: 'Start at 25% of every payment into a separate savings account, and decide between quarterly estimates and extra W-4 withholding.' },
          { title: 'Start your records today', detail: 'A spreadsheet or bookkeeping app: date, amount, what it was, receipt saved.' },
        ],
      },
    },

    {
      key: 'l0_compliance_protection',
      title: 'Compliance as Protection',
      objective:
        'Licences, sales tax, estimated payments and employer obligations aren\'t paperwork for its own sake — they are what stop a small operation being wiped out by one notice.',
      sections: [
        {
          heading: 'Why compliance is protection',
          body: 'For a large company, a compliance failure is a line item. For a small operation, one audit or back-tax notice with penalties and interest can wipe out a year of profit — or more. The owners hit hardest are rarely doing anything malicious. They simply didn\'t know an obligation existed until a letter arrived.\n\nCompliance is cheapest at the start. Registering, collecting and filing correctly from day one costs time. Fixing two years of missed obligations costs money, stress and sometimes personal liability. This lesson is a map of the obligations that most often catch small owners out.',
        },
        {
          heading: 'Registration and licences',
          body: 'Depending on your activity and location, you may need a general business licence from your city or county, an occupational or professional licence for regulated trades, a state registration, and a "doing business as" filing if you operate under a name other than your own. Home-based businesses sometimes need a home occupation permit.\n\nRequirements vary enormously by place and activity, so the only reliable answer comes from your own city, county and state websites — or your local Small Business Development Center, which will help for free.',
        },
        {
          heading: 'Sales tax and trust fund taxes',
          body: 'Most states charge sales tax on at least some goods and services. If what you sell is taxable, you generally have to register with the state before collecting it, collect it from customers, and remit it on a schedule. Selling online into other states can create obligations there too once your sales pass that state\'s economic threshold, which differs from state to state (reviewed 2026).\n\nSales tax you collect, and payroll tax you withhold from employees, are called trust fund taxes: the money belongs to the government, and you\'re holding it on its behalf. Treat them accordingly. Spending that money to keep a business afloat is one of the most dangerous things an owner can do, because the people responsible for unpaid payroll withholding can be held personally liable for it (reviewed 2026) — regardless of any LLC.',
        },
        {
          heading: 'Estimated taxes and deadlines',
          body: 'Owners without withholding generally pay estimated tax quarterly. The federal due dates are generally April 15, June 15, September 15 and January 15 (reviewed 2026).\n\nThe safe harbour rules are the useful part. You can generally avoid an underpayment penalty by paying at least 100% of the previous year\'s total tax through withholding and estimates — or 110% if your previous year\'s adjusted gross income was above $150,000 (reviewed 2026). That gives a new or growing business a predictable target even when this year\'s income is hard to forecast.',
        },
        {
          heading: 'When you pay other people',
          body: 'Paying a contractor: collect a W-9 before you pay them, and file a 1099-NEC if payments reach the IRS reporting threshold, which was changed recently (reviewed 2026) — check the current figure before year-end.\n\nHiring an employee brings a larger set: an EIN, Form I-9 employment eligibility verification, a W-4, payroll tax withholding and deposits, state new-hire reporting, state unemployment insurance registration, and workers\' compensation insurance in most states (reviewed 2026). Level W1 covers employer obligations in depth; the key point here is to set these up before the first paycheck, not after.\n\nKeep tax records for at least three years, and longer in several situations — IRS guidance sets out when (reviewed 2026). Check FinCEN\'s current beneficial ownership reporting requirements for your entity too, since those rules have changed.',
        },
      ],
      keyTerms: [
        { term: 'Trust fund taxes', definition: 'Sales tax collected and payroll tax withheld — money held on the government\'s behalf.' },
        { term: 'Economic nexus', definition: 'A sales tax obligation in a state created by sales volume there, even without a physical presence.' },
        { term: 'Safe harbour', definition: 'Paying at least a set share of last year\'s tax to avoid an underpayment penalty (reviewed 2026).' },
        { term: 'Form W-9', definition: 'The form you collect from a contractor to get their taxpayer information before paying them.' },
      ],
      example: {
        title: 'Worked example — the market stall that didn\'t collect',
        body: 'Jess sells handmade candles at weekend markets and online. Over two years she sells $30,000 of candles, which are taxable in her state. She never registered for sales tax because she didn\'t realise small sellers needed to.\n\nA state notice arrives. Candles were taxable at a combined 7% where she sold them, so she owes about $2,100 in sales tax she never collected — plus penalties and interest. She can\'t go back and charge two years of customers, so it all comes out of her own pocket.\n\nIf she had registered on day one, the tax would have been added at checkout and paid by customers. The obligation was identical either way. The only thing that changed was who paid it — and the answer turned into Jess, because she found out from a letter instead of a checklist.',
      },
      pitfalls: [
        'Assuming small operations are exempt from sales tax, licences or registration. Often they aren\'t.',
        'Spending collected sales tax or withheld payroll tax to cover a cash shortfall.',
        'Missing estimated tax deadlines because no one sends a reminder.',
        'Paying contractors without collecting a W-9 first.',
        'Hiring an employee before setting up payroll, new-hire reporting and workers\' compensation.',
        'Discarding records too soon.',
      ],
      quiz: [
        {
          question: 'A business is short of cash. The owner considers using sales tax collected from customers to cover rent this month. What\'s the problem?',
          options: [
            'None; it\'s the business\'s money until it\'s due',
            'That money is the government\'s, and you can be liable',
            'It\'s fine, because the LLC protects you personally',
          ],
          answerIndex: 1,
          explain: 'Sales tax collected and payroll tax withheld are trust fund taxes. They were never the business\'s money, and unpaid trust fund taxes are pursued aggressively — in the case of payroll withholding, potentially from the responsible individuals personally (reviewed 2026).',
        },
        {
          question: 'Your new business\'s income is unpredictable this year. How can you generally avoid an underpayment penalty without knowing exactly what you\'ll earn?',
          options: [
            'You can\'t; you have to guess your income right',
            'Pay at least last year\'s total tax during the year',
            'Pay once in December when your income is final',
          ],
          answerIndex: 1,
          explain: 'The safe harbour rules let you base payments on last year\'s tax, which you already know: 100% of it, or 110% if last year\'s AGI was above $150,000 (reviewed 2026). That gives a predictable target even when this year is uncertain.',
        },
      ],
      exercise: {
        intro: 'Audit your obligations in every role and fix the gaps before someone else finds them.',
        steps: [
          { title: 'Check business licence requirements', detail: 'City, county and state websites for your specific activity. Note each requirement and whether you have it.' },
          { title: 'Check whether you owe sales tax', detail: 'Is what you sell taxable in your state? Do you sell into other states? Note registration status.' },
          { title: 'Check estimated tax', detail: 'Do you have income without withholding? Calculate a safe harbour target from last year\'s return.' },
          { title: 'List registration and filing deadlines', detail: 'Annual reports, licence renewals, sales tax filing periods, estimated tax dates.' },
          { title: 'List obligations for anyone you pay', detail: 'Contractors — W-9s and 1099 threshold. Employees — the full payroll setup, before the first paycheck.' },
          { title: 'Put every deadline in your calendar', detail: 'With a reminder a week before. An obligation without a reminder is the one that gets missed.' },
        ],
      },
    },

    {
      key: 'l0_upgrade_plan',
      title: 'Your 90-Day Upgrade Plan',
      objective:
        'Three months, sequenced by impact: stop the losses first, capture what you\'re already owed, then build toward ownership.',
      sections: [
        {
          heading: 'Why order matters more than ambition',
          body: 'The sequence — stop losses, capture what\'s owed, then build — isn\'t a preference. It\'s arithmetic.\n\nA dollar of 24% card debt paid off is a guaranteed 24% return. No investment reliably beats that. A dollar of employer match collected is an immediate 100% return. Those moves come first because nothing later in the plan earns as much, as safely. And building on top of an active leak — investing while card balances grow, or launching a business with no cushion — means the first bad month undoes the progress.\n\nNinety days is long enough to change a trajectory and short enough to stay concrete. The plan below is built in three thirty-day blocks, differently for each starting tier.',
        },
        {
          heading: 'If you\'re starting in Stabilise',
          body: 'Days 1–30: Stop new losses. Stop adding to card balances. Pull your credit reports and dispute any errors. Call your highest-rate card issuer and ask for a lower APR. Set up a low-balance alert and a small buffer to end overdraft fees. Check whether you qualify for assistance you aren\'t receiving — 211, the free referral line and website, connects people to local help with bills, food and housing.\n\nDays 31–60: Cut friction costs from Module 2 and redirect the amount to your highest-rate debt, as a fixed monthly payment that never shrinks. If debt feels unmanageable, a nonprofit credit counselling agency can review options — be very cautious of for-profit debt settlement companies charging large fees.\n\nDays 61–90: Build a starter reserve, even a small one, so the next surprise doesn\'t go back on a card. Capture any employer match you can afford, since that return beats everything else except clearing the costliest debt.',
        },
        {
          heading: 'If you\'re starting in Capture',
          body: 'Days 1–30: Collect what\'s already yours. Raise retirement contributions to capture the full match. Check your W-4 so you\'re not lending the government a large refund. Move idle cash above your reserve to an insured account that pays. Review your benefits guide for anything unused.\n\nDays 31–60: Check your job against your rights from Module 3 — classification, overtime, minimum wage. Research your market rate from at least two sources.\n\nDays 61–90: Act on the research. Hold the pay conversation or begin a targeted job search, and enrol in the one portable skill or credential you chose — ideally paid for by your employer. If you have free time and a skill people would pay for, start validating a side business: talk to potential customers before spending anything.',
        },
        {
          heading: 'If you\'re starting in Build',
          body: 'Days 1–30: Confirm your reserve target and keep contributing. Work through Levels 1 and 2 of this curriculum, so personal finances and legal structure are solid before any real risk is taken.\n\nDays 31–60: If you have a side-business idea, validate it with real conversations — Level S1, Module 2 is built for exactly this — and aim for a first paying customer. Set up the separate account and tax set-aside before that first payment arrives.\n\nDays 61–90: Complete your compliance audit from the previous lesson. Then choose your direction: the Acquisition & Ownership track if you want a cash-flowing business and the property under it, or Startup & Venture if you\'re building something new. Both start from what you now understand.',
        },
        {
          heading: 'Measuring whether it\'s working — and free help',
          body: 'Track five numbers monthly: surplus, total monthly cost of debt, reserve in months, total compensation captured, and the share of income coming from owner-type activity. Re-run the role map from Module 1 at day 90. Direction matters more than size — a surplus moving from −$50 to +$150 is a real change.\n\nYou don\'t have to do this alone, and much of the best help is free. VITA sites offer free tax preparation for people who generally earn below an income limit set by the IRS (reviewed 2026). Small Business Development Centers offer free business consulting. SCORE provides free volunteer business mentors. Nonprofit credit counsellors help with debt. Your state attorney general and labor department enforce your rights. Paying someone for help any of these offer free should always be a conscious choice, not a default.',
        },
      ],
      keyTerms: [
        { term: 'Sequencing', definition: 'Doing moves in order of guaranteed return and risk reduction: stop losses, capture, then build.' },
        { term: 'Guaranteed return', definition: 'The certain benefit of a move like clearing a 24% balance or collecting a match — not dependent on markets.' },
        { term: 'VITA', definition: 'The IRS Volunteer Income Tax Assistance program — free tax preparation for eligible taxpayers.' },
        { term: 'SCORE', definition: 'A nonprofit network providing free volunteer mentoring to small business owners.' },
      ],
      example: {
        title: 'Worked example — Marcus\'s 90 days',
        body: 'Marcus, from the snapshot lesson, starts in Stabilise.\n\nDays 1–30: He stops using both cards. His reports show a duplicated account, which he disputes. One issuer lowers his APR from 25% to 21% after a five-minute call. He sets a low-balance alert, and the overdraft fees stop.\n\nDays 31–60: He cancels $95 of unused subscriptions and sets a fixed $300 payment on the highest-rate card, instead of the shrinking minimum.\n\nDays 61–90: He builds his reserve from $900 to $1,500 and starts contributing 3% to capture his employer\'s match. He opens a separate account for his repair work and starts recording every job.\n\nAt day 90: about $95 a month of friction gone, overdraft fees at zero, a lower APR on his worst card, a balance shrinking every month instead of drifting, the match captured, and his repair income visible for the first time. He hasn\'t earned a single extra dollar from his job. His position has changed completely, and the repair work is ready to become a real side business from a stable base.',
      },
      pitfalls: [
        'Jumping to the Build tier\'s moves from a Stabilise position.',
        'Investing while carrying high-interest debt that costs more than the investment can reliably earn.',
        'Making a plan without dates. A move without a date is a wish.',
        'Paying for help that\'s available free — tax preparation, business consulting, credit counselling.',
        'Using a for-profit debt settlement company without understanding its fees and the damage to your credit.',
        'Measuring only income. Surplus, cost of debt and reserve tell you far more.',
      ],
      quiz: [
        {
          question: 'You have $300 a month to put to work. You carry a card at 24% and your employer offers a match you aren\'t collecting. Which order makes most sense?',
          options: [
            'Invest it all in the stock market for growth',
            'Get the full match, then hit the 24% card',
            'Keep it in checking until you have more',
          ],
          answerIndex: 1,
          explain: 'A match is an immediate 100% return and clearing 24% debt is a guaranteed 24% return. Neither depends on markets. Those come before investing — which is exactly why sequencing matters more than ambition.',
        },
        {
          question: 'Which of these is generally available free?',
          options: [
            'Tax prep through VITA, if you qualify',
            'Credit repair, if you ask the right company',
            'Nothing; real help always costs money',
          ],
          answerIndex: 0,
          explain: 'VITA offers free tax preparation for eligible taxpayers (reviewed 2026), Small Business Development Centers and SCORE provide free business help, and nonprofit credit counsellors help with debt. Paying for any of these should be a deliberate choice.',
        },
      ],
      exercise: {
        intro: 'Build your own dated 90-day plan from your snapshot. This is the deliverable the whole level has been building toward.',
        steps: [
          { title: 'Confirm your starting tier', detail: 'From your snapshot. If you\'re between two, start in the lower one.' },
          { title: 'Pick your three highest-impact moves', detail: 'Use the tier guidance above. Prioritise guaranteed returns and your biggest exposure.' },
          { title: 'Put them in order, with a date for each', detail: 'Days 1–30, 31–60, 61–90. Add each date to your planner.' },
          { title: 'Define "done" for each move', detail: 'Specific and checkable: "APR lowered or refused," not "look into my card."' },
          { title: 'Choose the five numbers you\'ll track', detail: 'Surplus, debt cost, reserve months, compensation captured, owner-income share. Record today\'s values.' },
          { title: 'Set 30-day and 90-day review dates', detail: 'At each review, update the numbers and adjust the next block. At day 90, re-run your role map from Module 1.' },
        ],
      },
    },
  ],

  wrapUp: [
    'You now hold the full picture: how the system works, how it treats each role, where the real advantages and traps are, and a dated plan built around your actual starting point.',
    'The rest of this curriculum builds on this level. Level 1 turns your finances into a surplus engine. Level 2 builds the legal structure. From there the Acquisition & Ownership and Startup & Venture tracks take you as far up the ladder as you want to go — from a base that won\'t give way under you.',
    'And if your 90 days are about stopping losses and collecting what you\'re owed rather than starting anything, that isn\'t the small version of this. For a lot of people, it\'s the most valuable thing in the entire curriculum.',
  ],
};
