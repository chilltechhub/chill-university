// src/data/curriculum/modules/L0M4.js
// Level 0 · Module 4 — The Owner: How the System Rewards Building
//
// The module with the highest risk of doing harm if taught loosely. A lot of
// popular content about owner taxation is wrong in ways that cost ordinary
// people money: "write off everything," "the S-Corp saves 15.3% on
// distributions," "depreciation takes your W-2 taxes to zero." Each lesson
// teaches the real mechanism AND its limits, with exact arithmetic (checked
// by script). It never sets a salary, picks an entity, or tells someone what
// to file — that stays with a CPA.
//
// Checklists and deliverables inherit from ownershipCurriculumFoundations.js.

export default {
  id: 'L0M4',
  level: 'L0',
  index: 3,
  title: 'The Owner — How the System Rewards Building',
  subtitle: 'Module 4',
  objective:
    'Why owners are taxed after expenses, how entity structure changes the math, how commercial credit works, and which government incentives are real.',
  duration: '3 hours',

  intro: [
    'The owner position is the one the system rewards most, and it is also the one surrounded by the most misleading advice. That combination is not a coincidence. Because the real advantages are large, they attract people selling exaggerated versions of them — and the people who follow those versions are usually the ones least able to absorb an audit, a penalty or a loan they cannot service.',
    'So this module teaches the owner\'s rulebook the honest way. Every lesson covers what the rule actually allows, the arithmetic of what it is really worth, and where it stops. You will see the famous strategies — expensing, the S-Corp election, leverage, depreciation — with real numbers, including the costs and limits that promotional content leaves out.',
    'None of this tells you which structure to choose or what to file. It gives you enough understanding to have a useful conversation with a CPA and to recognise when someone is selling you something that isn\'t true.',
  ],

  lessons: [
    {
      key: 'l0_tax_order_owner',
      title: 'Earn, Spend, Tax: How Owners Are Taxed',
      objective:
        'A business deducts ordinary and necessary expenses before tax. The line between a real business expense and a personal one is where people get into trouble.',
      sections: [
        {
          heading: 'The owner\'s order of taxation',
          body: 'A worker is taxed on gross pay. A business is taxed on profit: revenue minus the legitimate costs of earning it. That is the order Module 1 described — earn, spend, then tax — and it is the single largest structural advantage of the owner position.\n\nThe test for what counts comes from the tax code: a deductible business expense must be ordinary (common and accepted in your line of business) and necessary (helpful and appropriate for the business). A photographer\'s camera passes easily. A photographer\'s family holiday does not become deductible because a few photos were taken on it.',
        },
        {
          heading: 'Mixed use and personal use',
          body: 'Many things are used partly for business and partly for personal life: a phone, a car, a laptop, internet service, a room at home. For these, only the business-use portion is deductible, and you need a reasonable basis for the percentage you claim.\n\nVehicles are the classic trap. Commuting from home to a regular workplace is personal, not business. Driving to a client, a supplier or a job site is business. Claiming 100% business use of the only car you own is a well-known audit trigger, and it is almost never true. A contemporaneous mileage log — kept at the time, not reconstructed in April — is what supports a vehicle deduction.\n\nA home office requires a space used regularly and exclusively for business. A desk in the corner of the kitchen table where the family eats doesn\'t qualify, however much work happens there.',
        },
        {
          heading: 'Business or hobby?',
          body: 'An activity has to be a genuine business — carried on with the intention of making a profit — for its expenses to be deductible. The IRS looks at factors such as whether you run it in a businesslike way, keep proper records, have the relevant expertise, put in real time, and have made or can reasonably expect to make a profit. An activity that shows a profit in three of five years is generally presumed to be for profit (reviewed 2026).\n\nIf the IRS decides it\'s a hobby, the income is still taxable but the expenses are not deductible at all under current rules (reviewed 2026). That is the worst of both outcomes, and it is exactly where "turn your hobby into a business to write it off" advice leads people who follow it without the business being real.',
        },
        {
          heading: 'A deduction is not free money',
          body: 'The phrase "write it off" makes business spending sound costless. It is not. A deduction reduces the tax on the amount spent — it does not refund the spending.\n\nFor a self-employed person, a legitimate $1,000 expense reduces both income tax and self-employment tax on that $1,000. In a 22% bracket that saves roughly $350 in total. You still spent $1,000 of your own money to save $350. Spending money you would not otherwise spend, purely to get a deduction, makes you poorer — every time.',
        },
      ],
      keyTerms: [
        { term: 'Ordinary and necessary', definition: 'The tax code\'s test for a deductible business expense — common in your trade, and helpful and appropriate for your business.' },
        { term: 'Mixed-use asset', definition: 'Something used partly for business and partly personally; only the business share is deductible.' },
        { term: 'Hobby loss rules', definition: 'Rules treating non-profit-seeking activities as hobbies, whose expenses aren\'t deductible under current rules (reviewed 2026).' },
        { term: 'Contemporaneous record', definition: 'A record made at the time of the expense or trip — what actually supports a deduction in an audit.' },
      ],
      example: {
        title: 'Worked example — a side photography business',
        body: 'Dani earns $9,000 in a year from wedding and portrait photography for paying clients.\n\nLegitimate business expenses: editing software, $360. Portfolio website, $240. A new lens used only for client work, $900. Mileage to shoots, logged at the time of each trip. Business use of her camera, which she also uses personally, at the share her booking records support. The business share of her phone.\n\nThings that are not business expenses, despite what a video told her: a family trip described as "location scouting," the full phone bill, a streaming subscription for "creative inspiration," and her daily commute to her regular day job.\n\nThe first list reduces her taxable profit and is defensible if questioned. The second list, if claimed, turns a legitimate small business into an audit waiting to happen — and could jeopardise the real deductions alongside the invented ones.',
      },
      pitfalls: [
        'Believing a deduction makes spending free. At a combined saving of roughly a third, you still pay about two thirds yourself.',
        'Claiming 100% business use of a personal vehicle or phone.',
        'Deducting commuting to a regular workplace. It\'s personal.',
        'Calling a family trip a business trip because work was mentioned.',
        'Keeping no records and reconstructing mileage at year-end. Contemporaneous records are what hold up.',
        'Running a hobby at a loss year after year and deducting it. That pattern is exactly what hobby loss rules exist for.',
      ],
      quiz: [
        {
          question: 'You\'re self-employed in the 22% bracket. You spend $1,000 on a legitimate business expense. Roughly how much does the deduction save you?',
          options: [
            '$1,000 — it\'s a write-off, so it\'s free',
            'About $350, across income tax and self-employment tax',
            'Nothing — business expenses don\'t reduce tax',
          ],
          answerIndex: 1,
          explain: 'The deduction removes $1,000 from taxable profit, cutting roughly $141 of self-employment tax and about $204 of income tax — around $350. You still spent the other $650. Spending just to get a deduction always leaves you poorer.',
        },
        {
          question: 'You buy a laptop you use about 60% for your real side business and 40% personally. What\'s deductible?',
          options: [
            'All of it, because it\'s used for the business',
            'The business-use share, if you have a reasonable basis for the percentage',
            'None of it, because it\'s used personally too',
          ],
          answerIndex: 1,
          explain: 'Mixed-use items are deductible in proportion to genuine business use. Claiming 100% of something you also use personally is one of the most common errors that surfaces in audits.',
        },
        {
          question: 'Someone tells you to turn your hobby into an LLC so you can deduct its costs. What\'s the catch?',
          options: [
            'There isn\'t one — an LLC makes any activity a business',
            'If it isn\'t genuinely run to make a profit, it can be treated as a hobby: income taxable, expenses not deductible',
            'LLCs aren\'t allowed to have expenses',
          ],
          answerIndex: 1,
          explain: 'An LLC is a legal wrapper; it doesn\'t decide whether an activity is a business for tax purposes. A real profit motive does. Treated as a hobby, the income is still taxed but the expenses aren\'t deductible under current rules (reviewed 2026).',
        },
      ],
      exercise: {
        intro: 'Test the expenses you think of as business expenses against the rule the IRS actually applies — before anyone else does.',
        steps: [
          { title: 'List every expense you treat, or plan to treat, as business', detail: 'Include recurring costs, equipment, vehicle, phone, internet, home space and travel.' },
          { title: 'Apply "ordinary and necessary" to each', detail: 'Would another business in your field reasonably have this cost? Is it genuinely helpful to earning income? Strike anything that fails.' },
          { title: 'Split mixed-use items', detail: 'For each item also used personally, estimate the business-use percentage and write down how you know — bookings, logs, hours.' },
          { title: 'Check your records', detail: 'For each expense, do you have a receipt? For vehicle use, a log made at the time? Note gaps and start recording from today.' },
          { title: 'Test business versus hobby', detail: 'Do you have paying customers, separate records, a plan to profit, and real time invested? Be honest — this decides whether any of the rest applies.' },
        ],
      },
    },

    {
      key: 'l0_entity_ladder',
      title: 'The Entity Tax Ladder',
      objective:
        'W-2, sole proprietor, S-Corp and C-Corp are taxed differently on the same dollar. The real savings are usually smaller than advertised — and sometimes negative.',
      sections: [
        {
          heading: 'Rung 1: the W-2 employee',
          body: 'As covered in Module 3, an employee pays 7.65% in FICA on wages and the employer quietly pays a matching 7.65% (reviewed 2026). Income tax is withheld. Few costs of earning the income are deductible.\n\nOne consequence people overlook: someone moving from employee to contractor at the same headline pay has taken a pay cut, because they now pay the employer\'s half of payroll tax themselves, plus their own benefits and unpaid time off. A contractor typically needs a meaningfully higher rate than an equivalent employee just to break even.',
        },
        {
          heading: 'Rung 2: sole proprietor or single-member LLC',
          body: 'By default, a one-owner business — whether operating under your own name or as a single-member LLC — is taxed on your personal return. The LLC is a legal structure that can separate liability; on its own it does not change how the income is taxed.\n\nNet profit is subject to income tax and to self-employment tax. Self-employment tax is 15.3% — both halves of Social Security and Medicare — applied to 92.35% of net self-employment earnings, with the Social Security part capped at an annual wage limit (reviewed 2026). Half of it is deductible for income tax purposes. Many owners of pass-through businesses may also qualify for a deduction of up to 20% of qualified business income, subject to limits (reviewed 2026).',
        },
        {
          heading: 'Rung 3: the S-Corporation election',
          body: 'An eligible LLC or corporation can elect to be taxed as an S-Corporation. The owner then works as an employee of their own company and must be paid a reasonable salary for the work they do. Payroll tax applies to that salary. Profit beyond the salary can be distributed without payroll tax. Income tax still applies to all of it.\n\nThat is where the saving comes from — and where its limits are. The salary can\'t be set artificially low; the IRS expects compensation that reflects what the services are worth, and scrutinises low salaries. The election also adds real costs: running payroll, a separate corporate tax return, and in some states additional fees or taxes. And paying yourself a salary can reduce the qualified business income deduction. For owners with modest profits, those costs can erase the benefit entirely.',
        },
        {
          heading: 'Rung 4: the C-Corporation',
          body: 'A C-Corporation is a separate taxpayer. It pays corporate income tax on its profit — a flat 21% at the federal level (reviewed 2026) — and when it pays dividends to its owners, they are taxed again. That is the double taxation people refer to.\n\nC-Corps make sense in specific situations: raising venture capital, issuing stock options, reinvesting most profit back into the company for years, or pursuing certain gains on qualifying small business stock. For a typical owner who takes most profit out to live on, double taxation usually makes it more expensive, not less.',
        },
        {
          heading: 'Reading the ladder honestly',
          body: 'Every rung trades something. Moving up adds complexity, cost and compliance obligations in exchange for potential tax savings that depend heavily on the size of the profit. The right structure is specific to a person\'s numbers, state, plans and risk — which is why this lesson models the mechanism and stops there. The salary figure in particular has to come from a professional looking at your actual role, not from a calculator.',
        },
      ],
      keyTerms: [
        { term: 'Self-employment tax', definition: '15.3% on 92.35% of net self-employment earnings, with Social Security capped at an annual limit (reviewed 2026).' },
        { term: 'S-Corporation election', definition: 'A tax election letting eligible businesses split owner income into salary (payroll-taxed) and distributions (not payroll-taxed).' },
        { term: 'Reasonable compensation', definition: 'The salary an S-Corp owner must be paid for services — what the work is genuinely worth, not a number chosen to cut tax.' },
        { term: 'Double taxation', definition: 'C-Corp profit taxed at the corporate level, then again when paid to owners as dividends.' },
      ],
      example: {
        title: 'Worked example — $100,000 of profit, and what the S-Corp is really worth',
        body: 'A single-owner business nets $100,000.\n\nAs a sole proprietor or default LLC: self-employment tax is 15.3% of 92.35% of $100,000 — about $14,130.\n\nAs an S-Corp paying the owner a $60,000 salary: payroll tax is 15.3% of $60,000 — $9,180. The remaining profit is distributed without payroll tax.\n\nThe difference is about $4,950 before anything else. You will often see this quoted as "15.3% of the $40,000 distribution, so $6,120." That skips the 92.35% adjustment and overstates the saving.\n\nNow subtract what the S-Corp adds. Payroll processing, a separate corporate return and any state-level fees commonly run into the low thousands of dollars a year — say $2,000 for this illustration. Paying a salary may also shrink the qualified business income deduction.\n\nRealistic net saving: roughly $3,000, not $6,120 — and entirely dependent on $60,000 being a defensible salary for the work. At $40,000 of profit instead of $100,000, the same added costs could wipe the saving out completely.',
      },
      pitfalls: [
        'Believing an LLC changes your taxes. By default it doesn\'t; the S-Corp election does, and it\'s a separate step.',
        'Quoting S-Corp savings as 15.3% of distributions. The real figure is smaller once the self-employment calculation and added costs are counted.',
        'Setting a very low salary to maximise distributions. Unreasonably low compensation is a known IRS enforcement focus.',
        'Electing S-Corp status on a small profit. Added costs can exceed the saving.',
        'Choosing a C-Corp for "the low 21% rate" (reviewed 2026) while planning to take the profit out. Dividends are taxed again.',
        'Converting from employee to contractor at the same pay. It\'s effectively a pay cut once payroll tax and benefits are counted.',
      ],
      quiz: [
        {
          question: 'Your LLC nets $100,000. You elect S-Corp status with a $60,000 salary. Roughly what does that save in payroll-type taxes, before the extra costs of running an S-Corp?',
          options: [
            '$15,300 — you avoid 15.3% on everything',
            '$6,120 — 15.3% of the $40,000 distribution',
            'About $4,950 — and less once payroll, filing and any state costs are counted',
          ],
          answerIndex: 2,
          explain: 'As a sole proprietor, self-employment tax is 15.3% of 92.35% of profit (reviewed 2026) — about $14,130. With a $60,000 salary, payroll tax is $9,180. The difference is about $4,950. Payroll services, a corporate return and state fees then reduce it further.',
        },
        {
          question: 'Forming a single-member LLC does what to your taxes by default?',
          options: [
            'Lowers them automatically',
            'Nothing — it\'s taxed like a sole proprietorship unless you make an election',
            'Makes you a corporation that pays 21%',
          ],
          answerIndex: 1,
          explain: 'An LLC is a legal structure. By default a single-member LLC is disregarded for income tax and reported on your personal return. Tax treatment only changes if you elect it, for example as an S-Corp.',
        },
        {
          question: 'An employer offers to switch you from a $50,000 salaried job to a $50,000 contract doing the same work. What\'s true?',
          options: [
            'It\'s the same pay',
            'It\'s effectively a pay cut: you\'d pay the employer\'s half of payroll tax and lose benefits and protections',
            'It\'s a raise, because you can deduct everything',
          ],
          answerIndex: 1,
          explain: 'As a contractor you owe self-employment tax on both halves, fund your own benefits, and lose overtime, unemployment insurance and more. If the work is still controlled like a job, the change may also be misclassification.',
        },
      ],
      exercise: {
        intro: 'Model the ladder with your own numbers, including what each rung costs — then take that model to a CPA rather than acting on it alone.',
        steps: [
          { title: 'Estimate your annual net business profit', detail: 'Revenue minus legitimate expenses, using your review from the previous lesson.' },
          { title: 'Model self-employment tax as a sole proprietor', detail: 'Profit × 92.35% × 15.3% (reviewed 2026). Note that the Social Security part stops at an annual wage cap — check the current figure.' },
          { title: 'Model payroll tax under an S-Corp at a salary range', detail: 'Use a low, middle and high salary. For each, salary × 15.3% (reviewed 2026). Don\'t choose the "right" one — that\'s the CPA\'s call.' },
          { title: 'List the costs each structure adds', detail: 'Payroll processing, a separate tax return, state fees or taxes, bookkeeping time. Get rough quotes where you can.' },
          { title: 'Calculate the net difference', detail: 'Tax difference minus added costs, at each salary level. Note where it turns negative.' },
          { title: 'Write the questions for a CPA', detail: 'What is a reasonable salary for my role? What does my state add? How does this affect my QBI deduction? Is it worth it at my profit?' },
        ],
      },
    },

    {
      key: 'l0_leverage',
      title: 'Commercial Credit & Leverage',
      objective:
        'Borrowing to fund something that earns more than it costs is how owners grow with other people\'s money. The same math, run on the downside, is how businesses fail.',
      sections: [
        {
          heading: 'Why owners borrow differently',
          body: 'A consumer borrows against future wages to buy things that lose value. An owner, done well, borrows against a business\'s cash flow to buy things that produce more than they cost — equipment that raises output, inventory that sells at a margin, a building that replaces rent.\n\nLenders price that difference. Commercial credit tends to be underwritten on what the business earns, measured by ratios like debt service coverage: the cash available to pay debt divided by the debt payments due. Commercial lenders commonly look for 1.25× or better (reviewed 2026) — meaning a quarter more cash than the payments require, as a buffer. Interest on business debt is generally a deductible business expense for a small business (reviewed 2026).',
        },
        {
          heading: 'The leverage equation — including the part people skip',
          body: 'The pitch for leverage goes: "borrow at 8% to earn 20%." That compares an interest rate to a return, and it leaves out something critical. A loan payment includes principal, not just interest. A five-year loan has to be repaid from cash flow over five years, so the investment must generate enough cash to cover the whole payment — not just the interest — or the business goes backwards every month.\n\nAnd returns are estimates. Payments are not. If the equipment earns half of what you forecast, the loan payment stays exactly the same. That asymmetry is the whole risk of leverage: the upside is uncertain, the obligation is fixed.',
        },
        {
          heading: 'Personal guarantees',
          body: 'For a young business without its own credit history or significant assets, lenders usually require the owner to guarantee the loan personally. SBA lenders generally require a personal guarantee from anyone owning 20% or more of the business (reviewed 2026).\n\nA personal guarantee means the liability protection of your LLC does not apply to that debt. If the business can\'t pay, the lender can come after you. "Other people\'s money" is still, in a very real sense, your money when you\'ve guaranteed it.',
        },
        {
          heading: 'Debt versus equity',
          body: 'Equity is the alternative: selling a share of the business for capital. There\'s no monthly payment and no guarantee, and if the business fails, investors lose their money rather than chasing yours. The price is ownership — permanently. A share of every future dollar of profit and of any eventual sale goes to someone else.\n\nThe rough rule of thumb: debt suits investments with predictable cash flow that can service a payment. Equity suits uncertain, high-growth bets that can\'t yet support fixed payments. Using savings avoids both costs but concentrates the risk on you. Level 3A covers capital strategy in depth; this lesson is the mental model.',
        },
        {
          heading: 'Keeping business and personal credit apart',
          body: 'Funding a business on personal credit cards puts high-cost, variable-rate consumer debt behind a business asset, and the balances raise your personal utilisation — which can hurt your personal credit precisely when you need it. Building a separate business credit profile over time, covered in Level 2, is how an owner eventually stops risking their personal finances every time the business borrows.',
        },
      ],
      keyTerms: [
        { term: 'Leverage', definition: 'Using borrowed money to fund an investment, magnifying both gains and losses.' },
        { term: 'Debt service coverage ratio', definition: 'Cash available for debt ÷ total debt payments. Lenders commonly look for 1.25× or better (reviewed 2026).' },
        { term: 'Personal guarantee', definition: 'A promise making the owner personally liable for a business debt, bypassing LLC protection.' },
        { term: 'Equity financing', definition: 'Raising money by selling ownership — no repayment, but a permanent share of the business.' },
      ],
      example: {
        title: 'Worked example — a $20,000 equipment loan, both ways',
        body: 'A small bakery can borrow $20,000 at 10% over five years for a second oven. The monthly payment is about $425 — about $5,099 a year, covering both interest and principal.\n\nThe forecast: the oven adds $6,000 a year of extra profit. That covers the $5,099 in payments with about $901 to spare. Debt service coverage for this loan: about 1.18×. It works — but it\'s already below the 1.25× buffer lenders like, so there\'s little room for error.\n\nThe downside: demand is softer than hoped and the oven adds $3,000 a year. The payment is still $5,099. The business is now short about $2,099 a year, which comes out of other cash flow or the owner\'s pocket — and if the owner signed a personal guarantee, the lender doesn\'t care which.\n\n"Borrow at 10% to earn 30%" sounds like an easy win. Once principal repayment and a realistic downside are included, it\'s a decision that deserves real scrutiny.',
      },
      pitfalls: [
        'Comparing the interest rate to the expected return and ignoring principal repayment.',
        'Forecasting only the good case. Always model half the expected return.',
        'Forgetting that a personal guarantee removes LLC protection for that debt.',
        'Funding a business on personal credit cards at consumer rates.',
        'Borrowing for things that don\'t produce cash — leverage on a cost is just debt.',
        'Giving up equity for money you could have borrowed against predictable cash flow.',
      ],
      quiz: [
        {
          question: 'A loan costs 8% interest and the equipment is expected to return 20% a year. What does that comparison leave out?',
          options: [
            'Nothing — 20% is more than 8%, so it\'s profitable',
            'Principal repayment and the risk that the return falls short while the payment stays fixed',
            'Only the tax deduction on the interest',
          ],
          answerIndex: 1,
          explain: 'Loan payments include principal, which must come from cash flow. And a forecast return can miss while the payment doesn\'t move. Both have to be modelled — especially the downside.',
        },
        {
          question: 'You form an LLC, then personally guarantee a $50,000 business loan. The business fails. What happens?',
          options: [
            'The LLC protects you, so you owe nothing',
            'The lender can pursue you personally for the guaranteed debt',
            'The debt is cancelled because the business closed',
          ],
          answerIndex: 1,
          explain: 'A personal guarantee is a direct promise from you. LLC liability protection doesn\'t extend to debts you\'ve guaranteed personally, which is why guarantees deserve serious thought.',
        },
      ],
      exercise: {
        intro: 'Take one real or planned investment and test it properly — including the version where it goes wrong.',
        steps: [
          { title: 'Define one investment and its total cost', detail: 'Equipment, inventory, a vehicle, a hire, a marketing campaign. Be specific.' },
          { title: 'Estimate the extra annual profit it produces', detail: 'Profit, not revenue. Write down your reasoning.' },
          { title: 'Calculate the annual payment if you borrow', detail: 'Use a loan calculator with the real rate and term. Include principal, not just interest.' },
          { title: 'Compare profit to payment', detail: 'Extra profit ÷ annual payment is this investment\'s coverage ratio. Note whether it clears 1.25×.' },
          { title: 'Run the downside', detail: 'Halve the expected profit. Can the business still make the payment? Where would the shortfall come from?' },
          { title: 'Compare the alternatives', detail: 'Savings, equity, a smaller start, or waiting. Note any personal guarantee involved.' },
          { title: 'Record a decision and your reasoning', detail: 'Written reasoning is what you learn from later, whichever way it goes.' },
        ],
      },
    },

    {
      key: 'l0_incentives',
      title: 'Government Incentives — What\'s Real and What\'s Hype',
      objective:
        'Depreciation, the R&D credit and pass-through deductions are genuine policy incentives. The limits on them are just as real, and most online advice skips those.',
      sections: [
        {
          heading: 'Depreciation: timing, not a gift',
          body: 'When a business buys an asset that lasts for years — equipment, vehicles, buildings — the cost is normally deducted gradually over the asset\'s useful life. That\'s depreciation. Rules such as Section 179 expensing and bonus depreciation can let a business deduct much of an asset\'s cost in the first year instead, and the size of those allowances has changed repeatedly over recent years (reviewed 2026).\n\nTwo facts get lost. First, depreciation deducts money you actually spent; it isn\'t free. Second, accelerating a deduction mostly moves tax between years, and when a depreciated asset is sold, some of that benefit can be taxed back through depreciation recapture. It\'s a genuine and valuable incentive to invest — but it is largely about when you pay tax, not whether.',
        },
        {
          heading: 'The passive loss rules: why rentals rarely zero out a salary',
          body: 'A very popular claim is that buying a rental property lets depreciation "wipe out" taxes on a regular job. For most people with salaries, that isn\'t how it works.\n\nRental real estate losses are generally passive, and passive losses can generally only offset passive income — not wages. There is a special allowance letting people who actively participate in managing their rentals deduct up to $25,000 of rental losses against other income, but it phases out between $100,000 and $150,000 of modified adjusted gross income (reviewed 2026). Above that range, the loss is generally suspended and carried forward — not lost, but not the refund the video promised.\n\nThe main way around those limits is qualifying as a real estate professional, which requires spending more than 750 hours a year and more than half of your working time in real property trades (reviewed 2026). Someone with a full-time job outside real estate usually can\'t meet that test.',
        },
        {
          heading: 'Real incentives worth knowing',
          body: 'The qualified business income deduction lets many owners of pass-through businesses deduct up to 20% of qualified business income, subject to income thresholds and limits on certain service businesses (reviewed 2026).\n\nThe research credit rewards qualifying development of new or improved products, processes or software. It has specific tests, requires documentation, and in some cases small businesses can apply it against payroll tax (reviewed 2026). It is a credit, so it is worth far more than a same-sized deduction.\n\nRetirement plans for owners, covered in Level 4, let a business owner shelter substantially more income than an employee can in an ordinary workplace plan.',
        },
        {
          heading: 'How to spot hype',
          body: 'Warning signs in tax content: a promise that taxes go to "zero" or "near zero" for ordinary earners; a strategy with no mention of eligibility tests or limits; anything framed as a secret the IRS doesn\'t want you to know; urgency and a paid course attached; and no date on the rules being described.\n\nReal incentives are published in the tax code and on IRS.gov. They have eligibility rules, documentation requirements and limits, and the people explaining them well always mention those. If a strategy sounds like it costs nothing and has no conditions, the conditions are simply being left out.',
        },
      ],
      keyTerms: [
        { term: 'Depreciation', definition: 'Deducting the cost of a long-lived asset over its useful life.' },
        { term: 'Depreciation recapture', definition: 'Tax on previously deducted depreciation when a depreciated asset is sold.' },
        { term: 'Passive activity loss rules', definition: 'Rules generally preventing passive losses, such as most rental losses, from offsetting wages.' },
        { term: 'QBI deduction', definition: 'A deduction of up to 20% of qualified business income for many pass-through owners, subject to limits (reviewed 2026).' },
      ],
      example: {
        title: 'Worked example — two rental owners, one rule',
        body: 'Both buy a rental property that produces a $9,000 loss on paper, mostly from depreciation. Both actively manage it.\n\nOwner A has a modified adjusted gross income of $90,000. That is below the phase-out range, so the special allowance can let them deduct the $9,000 loss against their wages this year (reviewed 2026).\n\nOwner B earns $160,000. That is above the $150,000 top of the phase-out range, so the special allowance is gone. The $9,000 loss is suspended and carried forward — usable against future passive income or when the property is sold, but not against this year\'s salary (reviewed 2026).\n\nSame property, same loss, very different tax result. The online claim that "real estate depreciation wipes out your W-2 taxes" is closest to true for Owner A, and false for the higher earner most likely to be targeted by it.',
      },
      pitfalls: [
        'Believing depreciation is free money. It deducts real spending, and recapture can apply on sale.',
        'Buying a rental expecting its paper loss to offset a high salary. Passive loss limits usually prevent it.',
        'Claiming real estate professional status alongside a full-time job in another field.',
        'Trusting any strategy promising "zero tax" with no mention of eligibility or limits.',
        'Acting on incentive rules without checking the current year. Several have changed repeatedly.',
      ],
      quiz: [
        {
          question: 'Someone earning $170,000 in salary buys a rental that shows a $10,000 depreciation-driven loss. Under the passive loss rules, what generally happens this year?',
          options: [
            'It reduces their taxable salary by $10,000',
            'The loss is generally suspended and carried forward, because the special allowance has phased out at that income',
            'The loss is permanently lost',
          ],
          answerIndex: 1,
          explain: 'The $25,000 special allowance phases out between $100,000 and $150,000 of modified AGI (reviewed 2026). Above that, rental losses generally can\'t offset wages — they carry forward to offset future passive income or gains on sale.',
        },
        {
          question: 'A business takes a large first-year depreciation deduction on new equipment. What\'s the most accurate description?',
          options: [
            'The equipment was effectively free',
            'It moves the deduction earlier; the cost was real, and some benefit can be taxed back if the equipment is sold',
            'The business will never pay tax on anything related to that equipment',
          ],
          answerIndex: 1,
          explain: 'Accelerated depreciation changes timing. The business still spent the money, and depreciation recapture can apply on sale. It\'s a real incentive to invest — just not a free one.',
        },
      ],
      exercise: {
        intro: 'Sort the tax incentives you\'ve heard about into the ones that genuinely apply to you and the ones that don\'t.',
        steps: [
          { title: 'List every tax strategy or incentive you\'ve heard about', detail: 'From friends, videos, courses, advertisements. Include where you heard it.' },
          { title: 'Find each one\'s eligibility rules at the source', detail: 'IRS.gov or a tax professional — not the video. Note the date you checked.' },
          { title: 'Match each to your income type', detail: 'Does it apply to wages, business profit, rental income or investment income? Many only apply to one.' },
          { title: 'Check the passive loss limits on any rental plans', detail: 'Compare your modified adjusted gross income to the phase-out range before assuming a rental loss helps this year.' },
          { title: 'Flag the hype', detail: 'Mark anything that promised near-zero tax, skipped limits, or came attached to a sales pitch.' },
          { title: 'Write your questions for a tax professional', detail: 'Only the incentives that survived the first five steps are worth a paid hour of someone\'s time.' },
        ],
      },
    },
  ],

  wrapUp: [
    'You now understand the owner\'s real advantages — taxation after expenses, structures that change the math, credit priced on cash flow, and deliberate government incentives — along with exactly where each of them stops.',
    'That combination is rarer than it should be. Most people either never learn the owner\'s rulebook or learn an exaggerated version of it that costs them. Module 5 turns everything in this level into a plan: where you stand now, how to cross from worker to owner safely if that\'s right for you, how to stay compliant, and what to do in the next 90 days.',
  ],
};
