// src/data/curriculum/modules/L0M3.js
// Level 0 · Module 3 — The Worker: Getting Full Value From a Paycheck
//
// Checklists and deliverables inherit from ownershipCurriculumFoundations.js.
// The tax-bracket example uses deliberately rounded, labelled-illustrative
// brackets rather than the current year's thresholds, which the IRS resets
// annually — the mechanism is the lesson, not the exact cut-offs.

export default {
  id: 'L0M3',
  level: 'L0',
  index: 2,
  title: 'The Worker — Getting Full Value From a Paycheck',
  subtitle: 'Module 3',
  objective:
    'Understand exactly how employment income is taxed, what your pay really includes, the protections the law gives you, and how workers build leverage.',
  duration: '2–3 hours',

  intro: [
    'Most adults spend most of their economic life in the worker position, and it is the position people understand least about their own situation. Pay stubs are opaque. Tax brackets are widely misunderstood — to the point that people turn down raises believing they will take home less. Benefits are treated as small print rather than as money. And the protections the law gives workers mostly go unused, because nobody explains them until something has already gone wrong.',
    'There is a popular line of thinking that the worker position is a trap to escape as fast as possible. This module takes a different view. The worker position trades higher tax friction for real protection and stability, and for a lot of people that is a good trade. The problem is rarely the position itself — it is not collecting everything the position actually offers.',
    'So this module is about extracting full value from a paycheck: understanding the tax on it, claiming all the pay that isn\'t in the salary figure, knowing and using your rights, and building the kind of leverage that raises what your time is worth. Every one of these improves someone\'s life without requiring them to take on the risks of ownership.',
  ],

  lessons: [
    {
      key: 'l0_tax_order_worker',
      title: 'Earn, Tax, Spend: How a Paycheck Is Taxed',
      objective:
        'Withholding, marginal versus effective rates, and why a raise never lowers your take-home pay — with one real exception people rarely hear about.',
      sections: [
        {
          heading: 'Withholding: tax before you see it',
          body: 'A worker is taxed at the source. Your employer calculates federal income tax from the information on your W-4 form, removes it from each paycheck, and sends it to the IRS. Social Security and Medicare — FICA — come out too, at 7.65% of wages for an employee, with the employer paying a matching 7.65% on top that never appears on your stub (reviewed 2026). State income tax, where it exists, follows the same pattern.\n\nAt tax time, your return reconciles what was withheld with what you actually owed. A refund is not a bonus — it means too much was withheld during the year, and you lent the government that money for free. A bill means too little was withheld. Adjusting your W-4 is how you change that balance.',
        },
        {
          heading: 'Brackets: the most misunderstood idea in personal finance',
          body: 'Federal income tax is progressive. Income is divided into brackets, currently running from 10% up to 37% (reviewed 2026), and each bracket\'s rate applies only to the income that falls inside that bracket.\n\nYour marginal rate is the rate on your last dollar of income — the highest bracket you reach. Your effective rate is your total tax divided by your income, and it is always lower than your marginal rate, because your earlier dollars were taxed at lower rates.\n\nThe myth goes: "if my raise pushes me into a higher bracket, all my income gets taxed at the higher rate and I\'ll take home less." That is not how brackets work. Only the dollars above the threshold are taxed at the higher rate. In the federal income tax system on its own, earning more always means keeping more.',
        },
        {
          heading: 'The real exception: the benefits cliff',
          body: 'There is one situation where a raise genuinely can leave someone worse off, and it has nothing to do with tax brackets. Many means-tested programs — Medicaid, subsidised childcare, housing assistance, SNAP, marketplace health insurance subsidies — phase out or stop entirely as income rises past a threshold.\n\nIf a $2,000 raise pushes a household just past a limit and costs them a childcare subsidy worth $6,000 a year, the household is $4,000 worse off. This is called a benefits cliff, and it affects working families far more than the bracket myth ever affects anyone.\n\nThe point is not to avoid raises. It\'s to see the cliff coming: know which benefits you receive, find their income limits, and plan the jump — for example, negotiating a raise large enough to clear the cliff, or timing it — rather than being blindsided.',
        },
        {
          heading: 'Why workers carry the highest tax friction',
          body: 'Put the pieces together and the worker\'s position becomes clear. Tax comes out before the money arrives. Almost nothing spent to earn the income reduces it — commuting, work clothes and, for most employees, unreimbursed work equipment are not deductible on a federal return under current rules (reviewed 2026). And there is no way to defer that tax, except through the specific accounts the government created for that purpose — which is the next lesson.\n\nThat friction is the price of the protection and stability the position brings. The goal of this module is to make sure you\'re paying no more of it than you have to.',
        },
      ],
      keyTerms: [
        { term: 'Withholding', definition: 'Tax an employer removes from each paycheck based on your W-4.' },
        { term: 'Marginal rate', definition: 'The tax rate on your last dollar of income.' },
        { term: 'Effective rate', definition: 'Total tax divided by total income — always lower than the marginal rate.' },
        { term: 'Benefits cliff', definition: 'A point where earning slightly more causes a means-tested benefit to stop, leaving a household worse off overall.' },
      ],
      example: {
        title: 'Worked example — a $10,000 raise, with illustrative brackets',
        body: 'These brackets are rounded for the example; real thresholds are set by the IRS each year. Say 10% applies to the first $12,000 of taxable income, 12% from $12,000 to $50,000, and 22% from $50,000 to $100,000.\n\nBefore the raise, taxable income is $45,000. Tax: 10% of $12,000 is $1,200, plus 12% of the next $33,000 is $3,960 — $5,160 in total. Effective rate 11.5%. Marginal rate 12%.\n\nAfter a $10,000 raise, taxable income is $55,000 — "into the 22% bracket." Tax: $1,200, plus 12% of $38,000 is $4,560, plus 22% of just the $5,000 above $50,000 is $1,100 — $6,860 in total. Effective rate 12.5%.\n\nThe raise added $1,700 of federal income tax. The worker keeps $8,300 of the $10,000. Only $5,000 was ever taxed at 22%. Nobody took home less.',
      },
      pitfalls: [
        'Turning down a raise or overtime because of a bracket. Only the income above the threshold is taxed at the higher rate.',
        'Treating a big refund as good news. It means you over-withheld and lent the government money for free all year.',
        'Ignoring benefits cliffs. They are the one place earning more can genuinely cost you — and they can be planned around.',
        'Assuming your employer\'s withholding is automatically right. If you have more than one job or side income, it often isn\'t.',
      ],
      quiz: [
        {
          question: 'A raise moves part of your income into a higher tax bracket. What happens to your take-home pay from federal income tax alone?',
          options: [
            'It falls, since all of your pay is taxed at the higher rate',
            'It rises; only dollars above the line get the higher rate',
            'It stays the same, since the two effects cancel out',
          ],
          answerIndex: 1,
          explain: 'Brackets apply only to the income inside them. Your earlier dollars are taxed exactly as before. In the income tax system alone, earning more always means keeping more.',
        },
        {
          question: 'Is there any real situation where earning a little more can leave a household worse off?',
          options: [
            'No, earning more always leaves you better off',
            'Yes, if it makes you lose a benefit like Medicaid',
            'Yes, any time you move up into a new tax bracket',
          ],
          answerIndex: 1,
          explain: 'That\'s the benefits cliff. It\'s caused by programs that phase out at income limits, not by tax brackets. Knowing your programs\' limits lets you plan the jump rather than be surprised by it.',
        },
      ],
      exercise: {
        intro: 'Work out what you actually pay in tax, as a percentage, and check whether a benefits cliff sits anywhere near your income.',
        steps: [
          { title: 'Find last year\'s return, or your W-2', detail: 'If you filed, the return has everything. If not, your W-2 shows wages and federal tax withheld.' },
          { title: 'Record total income and total federal income tax', detail: 'Use total tax on the return, not the amount withheld — withholding is what was taken, not what was owed.' },
          { title: 'Calculate your effective federal rate', detail: 'Total federal income tax ÷ total income. Most people are surprised how much lower it is than their bracket.' },
          { title: 'Identify your marginal bracket', detail: 'Look up the current year\'s brackets on IRS.gov and find the highest one your taxable income reaches.' },
          { title: 'List any means-tested benefits you receive', detail: 'Health coverage, childcare, housing, food assistance, marketplace insurance subsidies.' },
          { title: 'Find each benefit\'s income limit', detail: 'Note how far below the limit you are. If a raise or side income could cross it, write down the size of the cliff.' },
        ],
      },
    },

    {
      key: 'l0_total_comp',
      title: 'Your Paycheck Is Not Your Pay',
      objective:
        'Employer match, health coverage, HSA eligibility and payroll contributions are compensation. Leaving any of it unclaimed is a pay cut you agreed to without noticing.',
      sections: [
        {
          heading: 'Salary is only part of what you earn',
          body: 'An employer\'s cost of employing you is well above your salary. On top of pay they pay the employer half of FICA, contribute to unemployment insurance, usually pay a large share of health insurance premiums, and may match retirement contributions, fund an HSA, or cover training, commuting or other benefits.\n\nAll of that is compensation — money spent on you, in exchange for your work. Total compensation is the right number to think about when you judge a job, compare two offers, or decide whether a pay rise is fair. Salary alone is often a misleading number.',
        },
        {
          heading: 'The retirement match: the best return most people ever see',
          body: 'Many employers match contributions to a 401(k) or similar plan. A common structure is something like 100% of what you contribute up to 4% of pay, or 50% up to 6% — the exact formula is in your plan documents.\n\nA 100% match is an immediate 100% return on the money you put in, before any investment growth, and it reduces your taxable income at the same time if you use a traditional pre-tax account. No other legal, low-risk investment comes close.\n\nThe common mistake is contributing less than the match requires. Contribute 2% when the employer matches up to 4%, and half the available match is simply left behind — a pay cut you didn\'t negotiate and probably didn\'t notice.\n\nCheck your plan\'s vesting schedule too. Employer contributions sometimes vest over several years, which means you keep them only if you stay long enough. That\'s worth knowing before you change jobs.',
        },
        {
          heading: 'Health coverage and the HSA',
          body: 'Employer-sponsored health insurance is one of the largest parts of total compensation. Your share of the premium is visible on your stub; the employer\'s share — often much larger — is not. Your W-2 typically reports the total cost of coverage, which is a good place to see it.\n\nIf you\'re enrolled in a high-deductible health plan, you may be eligible for a Health Savings Account. An HSA has an unusual triple tax advantage: contributions go in before tax, growth isn\'t taxed, and withdrawals for qualified medical costs aren\'t taxed either. Unlike a flexible spending account, HSA money isn\'t lost at year-end — it rolls over and stays yours, even if you change jobs. Some employers contribute to it as well. Eligibility rules have been changing, so check your plan\'s current status directly (reviewed 2026).',
        },
        {
          heading: 'The benefits people forget',
          body: 'Other benefits are frequently left unclaimed simply because nobody reads the benefits guide: tuition assistance, commuter benefits paid pre-tax, employee assistance programs offering free counselling or legal consultations, life and disability insurance, dependent care accounts, and equipment or home-office reimbursement.\n\nSocial Security is also part of the picture. Each year of covered work earns credits — 40 credits, roughly ten years of work, are generally needed to qualify for retirement benefits (reviewed 2026). Your earnings history is visible in a free my Social Security account, and it\'s worth checking for errors, because mistakes in that record reduce future benefits.',
        },
      ],
      keyTerms: [
        { term: 'Total compensation', definition: 'Salary plus the value of every benefit and employer contribution made on your behalf.' },
        { term: 'Employer match', definition: 'An employer contribution to your retirement account, tied to how much you contribute.' },
        { term: 'Vesting', definition: 'The schedule over which employer contributions become permanently yours.' },
        { term: 'HSA', definition: 'Health Savings Account — pre-tax contributions, tax-free growth and tax-free qualified withdrawals, for people on eligible high-deductible plans.' },
      ],
      example: {
        title: 'Worked example — a $52,000 job that pays more than $52,000',
        body: 'Luis earns a $52,000 salary. His employer matches 100% of his 401(k) contributions up to 4% of pay, and pays $7,000 of his annual health premium.\n\nHe currently contributes 2%, or $1,040. His employer matches that $1,040. But the full match available is 4%, or $2,080 — so he is leaving $1,040 of free employer money on the table every year.\n\nHis total compensation is really: $52,000 salary + $2,080 potential match + $7,000 health premium + roughly $3,978 employer payroll tax = about $65,000. If he raises his contribution to 4%, he collects the full match, and because it\'s pre-tax, his take-home falls by less than the extra $1,040 he\'s contributing.\n\nWhen a competitor offers him $55,000 with no match and a cheaper health plan, the salary looks like a raise. On total compensation, it may be a pay cut.',
      },
      pitfalls: [
        'Contributing less than the full employer match. It\'s the most common unclaimed pay there is.',
        'Comparing job offers on salary alone. Health coverage and match can outweigh a few thousand dollars of salary.',
        'Leaving a job without checking vesting. A few months\' wait can be worth a lot of employer contributions.',
        'Using a flexible spending account like an HSA. FSA money is generally use-it-or-lose-it; HSA money rolls over and stays yours.',
        'Never reading the benefits guide. Tuition, counselling and legal help are often sitting there unused.',
      ],
      quiz: [
        {
          question: 'Your employer matches 100% of contributions up to 5% of pay. You contribute 3%. What\'s happening?',
          options: [
            'You\'re getting the full match already',
            'You\'re leaving 2% of pay unclaimed',
            'You get no match until you reach 5%',
          ],
          answerIndex: 1,
          explain: 'The match follows your contribution up to the cap. At 3% you get 3% matched; contributing 5% would bring in another 2% of your salary from your employer every year — an immediate 100% return on that money.',
        },
        {
          question: 'Two job offers: $58,000 with no retirement match and a costly health plan, or $54,000 with a 4% match and an employer that covers most of your health premium. Which pays more?',
          options: [
            'The $58,000 one, since salary is what counts',
            'It depends; the $54,000 one may be worth more',
            'They come out equal once taxes are counted',
          ],
          answerIndex: 1,
          explain: 'A 4% match on $54,000 is $2,160 a year, and employer health premium contributions are often worth thousands more. Salary alone can make the lower-value offer look like the better one.',
        },
      ],
      exercise: {
        intro: 'Write out your real total compensation and find anything you\'re entitled to but not collecting.',
        steps: [
          { title: 'Record your base pay', detail: 'Annual salary, or hourly rate × typical annual hours.' },
          { title: 'Find your retirement match formula', detail: 'Your plan documents or HR portal will state it. Write it exactly — e.g. "100% up to 4%".' },
          { title: 'Check your current contribution against the match', detail: 'If you contribute less than the match cap, calculate how much employer money you\'re leaving unclaimed each year.' },
          { title: 'Find the employer share of your health premium', detail: 'Your benefits portal or W-2 (which usually reports total coverage cost) will show it.' },
          { title: 'Check HSA eligibility and any employer HSA contribution', detail: 'Only relevant on a qualifying high-deductible plan — confirm your plan\'s current status.' },
          { title: 'List every other benefit in the guide', detail: 'Tuition, commuter, counselling, insurance, reimbursements. Mark any you\'re not using.' },
          { title: 'Total it', detail: 'Salary plus the value of everything else. That is the figure to use when judging a raise or a new offer.' },
        ],
      },
    },

    {
      key: 'l0_worker_rights',
      title: 'Your Rights at Work',
      objective:
        'Minimum wage, overtime, safety, unemployment insurance, anti-retaliation and classification — what the law guarantees, and where to go when it isn\'t honoured.',
      sections: [
        {
          heading: 'Wages and overtime',
          body: 'The Fair Labor Standards Act sets the federal floor. The federal minimum wage is $7.25 an hour (reviewed 2026), but many states and cities set higher minimums, and you\'re entitled to whichever is highest where you work.\n\nNon-exempt employees must be paid at least one and a half times their regular rate for hours over 40 in a workweek. Being exempt from overtime requires both a salary above a federal threshold — $684 a week at the federal level (reviewed 2026), with some states setting higher thresholds — and a job whose actual duties meet specific tests. A salary alone does not make someone exempt, and a job title certainly doesn\'t. "Salaried, so no overtime" is one of the most common wage violations there is.',
        },
        {
          heading: 'Employee or contractor — it isn\'t your employer\'s choice',
          body: 'Whether you\'re an employee or an independent contractor depends on the reality of the work, not on what a contract calls you. If the business controls when, where and how you work, supplies your tools and treats the work as part of its core operation, you are very likely an employee, whatever the paperwork says. Tests differ between the IRS, the Department of Labor and some states, which apply stricter rules.\n\nMisclassification costs workers a great deal. A misclassified "contractor" pays both halves of payroll tax as self-employment tax, gets no overtime, no minimum wage protection, no unemployment insurance and usually no workers\' compensation. If you think you\'ve been misclassified, the IRS\'s Form SS-8 requests a determination, and your state labor department takes complaints.',
        },
        {
          heading: 'Safety, unemployment and retaliation',
          body: 'OSHA gives you the right to a workplace free of recognised serious hazards, to report hazards, and to file a complaint — and it prohibits retaliation for doing so.\n\nUnemployment insurance is run by each state and funded by employers. If you lose your job through no fault of your own, you are usually eligible to claim, and people who were wrongly treated as contractors often still qualify. Apply promptly; eligibility and deadlines are set by your state.\n\nFederal law also prohibits discrimination based on protected characteristics, enforced by the Equal Employment Opportunity Commission, and forbids retaliation against employees who complain about discrimination, wages or safety.',
        },
        {
          heading: 'You can talk about your pay',
          body: 'Many workers believe discussing pay with co-workers is forbidden. For most private-sector employees who aren\'t supervisors, the National Labor Relations Act protects the right to discuss wages and working conditions with colleagues (reviewed 2026). A workplace rule banning those conversations is often itself unlawful.\n\nA growing number of states also require employers to include pay ranges in job postings. Between those two things, you have more access to real pay information than ever — and pay information is the raw material of the next lesson.',
        },
      ],
      keyTerms: [
        { term: 'Non-exempt', definition: 'An employee entitled to overtime pay for hours over 40 in a workweek.' },
        { term: 'Exempt', definition: 'An employee excluded from overtime — which requires meeting both a salary threshold and duties tests.' },
        { term: 'Misclassification', definition: 'Treating someone who is legally an employee as an independent contractor.' },
        { term: 'Form SS-8', definition: 'The IRS form used to request a determination of whether a worker is an employee or a contractor.' },
      ],
      example: {
        title: 'Worked example — what misclassification costs',
        body: 'Rosa works shifts at a warehouse. The manager sets her schedule, she uses the company\'s equipment, and she does the same work as the employees beside her — but she\'s paid as a "contractor," $40,000 a year.\n\nAs a contractor she owes self-employment tax: about $5,652. As an employee she\'d pay FICA of $3,060, with the employer covering the other half. That\'s roughly $2,592 more tax falling on Rosa.\n\nShe regularly works five extra hours a week at $20 an hour. As a non-exempt employee, those hours would pay an extra $10 an hour in overtime premium — about $2,500 a year over 50 weeks. As a contractor she gets none of it.\n\nAdd no unemployment insurance if she\'s let go and no workers\' comp if she\'s injured. The label on her paperwork is costing her more than $5,000 a year and a safety net — and based on how the work is actually controlled, it\'s very likely wrong.',
      },
      pitfalls: [
        'Assuming salaried means no overtime. Exemption needs both a salary threshold and qualifying duties.',
        'Accepting a contractor label for work that is controlled like a job. The reality of the work decides, not the contract.',
        'Believing pay discussions are banned. For most private-sector non-supervisory workers they\'re protected.',
        'Waiting to file for unemployment. Deadlines are set by your state and delays can cost weeks of benefits.',
        'Complaining without a record. Keep dated notes of hours, pay and anything said — documentation is what makes a claim work.',
      ],
      quiz: [
        {
          question: 'Your employer pays you a salary of $50,000 and says that means you don\'t get overtime. Is that automatically true?',
          options: [
            'Yes, being salaried always makes you exempt',
            'No, your actual duties must pass legal tests',
            'Yes, as long as your title says "manager"',
          ],
          answerIndex: 1,
          explain: 'Overtime exemption needs both a salary above the threshold and duties that qualify. Neither a salary on its own nor a title decides it. Misapplying this is one of the most common wage violations.',
        },
        {
          question: 'A company sets your hours, supervises how you work and provides your equipment, but calls you an independent contractor. What decides whether you\'re really an employee?',
          options: [
            'Whatever the contract you signed says',
            'How the work is actually controlled',
            'Whether you asked to be a contractor',
          ],
          answerIndex: 1,
          explain: 'Classification follows the reality of the relationship. Control over when, where and how you work points strongly toward employee status regardless of the label. Form SS-8 and your state labor department can address it.',
        },
      ],
      exercise: {
        intro: 'Check your own job against the protections that apply to it. Most people find everything is fine — and some find something worth money.',
        steps: [
          { title: 'Confirm your classification', detail: 'Check your pay stub or offer letter for "exempt" or "non-exempt," and whether you receive a W-2 or a 1099.' },
          { title: 'Compare your pay to your state and local minimum wage', detail: 'Use your state labor department\'s site. Tipped and youth rules can differ.' },
          { title: 'Check overtime', detail: 'If you\'re non-exempt, confirm hours over 40 in a week are paid at 1.5 times your rate. If you\'re told you\'re exempt, check the duties tests on the Department of Labor site.' },
          { title: 'Test your contractor status if you get a 1099', detail: 'Who controls your hours, methods and tools? If the answers point to the company, note it.' },
          { title: 'Start a simple record', detail: 'Dates, hours worked, pay received. Keep it somewhere that isn\'t a work device or account.' },
          { title: 'Save your state labor department\'s complaint route', detail: 'Keep it in your Vault alongside the federal Department of Labor wage-and-hour contact.' },
        ],
      },
    },

    {
      key: 'l0_earning_power',
      title: 'How Workers Build Leverage',
      objective:
        'Income tied to hours has a ceiling. Skills, market rate, negotiation and portable credentials are how a worker raises it.',
      sections: [
        {
          heading: 'The hour ceiling',
          body: 'A worker\'s income is price × hours. Hours are capped by the week and by your health; working more of them has sharply diminishing returns. That leaves price — what an hour of your work is worth to someone — as the lever with real room to move.\n\nIt also affects borrowing. Lenders underwrite workers on debt-to-income ratio: how much of your gross monthly income existing debt payments consume. That ratio sets a hard ceiling on what you can borrow for a home or a car, and the only ways to raise it are paying debt down or raising income. Earning power is borrowing power.',
        },
        {
          heading: 'Know your market rate',
          body: 'You can\'t negotiate what you don\'t know. The Bureau of Labor Statistics publishes pay data by occupation and area. Job postings in states with pay-transparency laws list real ranges. Salary data sites add another view, as do people doing the job — and, as the last lesson covered, discussing pay with colleagues is generally protected.\n\nGather at least two independent sources and write down the range for your role, level and location. That range is your anchor for everything else in this lesson.',
        },
        {
          heading: 'Raises, promotions and moving jobs',
          body: 'Internal raises tend to be incremental. Changing employers resets your pay against the current market, and job-switchers have often seen larger pay increases than people who stayed, according to the Federal Reserve Bank of Atlanta\'s wage growth tracking (reviewed 2026).\n\nThat doesn\'t mean jumping jobs constantly — tenure builds vesting, reputation and internal promotion paths. It means your current employer\'s offer is one data point, not the whole market, and a credible outside offer is often the most effective negotiating tool a worker has.',
        },
        {
          heading: 'Skills that travel',
          body: 'The most durable leverage is skill that\'s valuable to more than one employer: a licence, a certification, a technical ability, a track record you can show. Skills specific to one company\'s internal systems raise your value only there.\n\nPortable skills are also the bridge to the owner position. A worker who can do something valuable for multiple clients is one step from being able to sell it directly — which is exactly where Module 5 picks up. Choosing what to learn next is partly choosing which door you want open later.',
        },
        {
          heading: 'Negotiating well',
          body: 'Negotiation goes better when it\'s specific. Lead with the market range you researched, not with what you need. Talk about the value you\'ve added in concrete terms. Negotiate total compensation — if salary can\'t move, extra match, remote days, training budget or a title can. Ask for any agreement in writing.\n\nAnd time it: during a review cycle, after a clear win, or when you hold another offer. A pay conversation six weeks after the budget was set is fighting the calendar.',
        },
      ],
      keyTerms: [
        { term: 'Market rate', definition: 'What employers currently pay for a given role, level and location.' },
        { term: 'Debt-to-income ratio', definition: 'Monthly debt payments ÷ gross monthly income — a key lender limit on how much a worker can borrow.' },
        { term: 'Portable skill', definition: 'An ability valuable to many employers or clients, not just your current one.' },
        { term: 'Total compensation negotiation', definition: 'Negotiating across salary, match, benefits, flexibility and training rather than salary alone.' },
      ],
      example: {
        title: 'Worked example — a negotiation built on data',
        body: 'Keisha is a medical billing specialist earning $44,000. She checks Bureau of Labor Statistics data for her area and three local postings with listed ranges. The picture: $46,000 to $54,000 for her experience level, with a coding certification commanding the top of that range.\n\nAt her review she says: "Based on current listings and BLS data for our area, this role pays $46,000 to $54,000. Over the last year I cut our claim rejection rate from 12% to 7%. I\'d like to discuss moving to $50,000."\n\nHer manager can offer $47,500 now. Keisha asks for the rest in another form: the company pays for her certification course and exam, and agrees in writing to a pay review when she passes.\n\nShe\'s up $3,500 immediately, has a paid path to the top of her market range, and gains a portable credential worth something to every billing department in the country — not just this one.',
      },
      pitfalls: [
        'Negotiating from what you need rather than what the market pays. Employers respond to market data and value added.',
        'Treating your current employer\'s view as the whole market. Outside offers and posted ranges are the real benchmark.',
        'Investing only in skills tied to one employer\'s systems.',
        'Accepting a verbal promise of a future raise. Ask for it in writing, with a date or condition.',
        'Negotiating salary alone when the budget is fixed. Match, training, flexibility and title are often easier to move.',
      ],
      quiz: [
        {
          question: 'Your manager says there\'s no budget for a salary increase this year. What\'s the most useful next move?',
          options: [
            'Accept it and bring it up again next year',
            'Negotiate other perks and a review date',
            'Start interviewing elsewhere right away',
          ],
          answerIndex: 1,
          explain: 'A fixed salary budget often leaves other levers free. Training and credentials raise your future market rate, and a written review date turns a vague "later" into a commitment.',
        },
        {
          question: 'Why does raising income matter for more than just monthly spending?',
          options: [
            'It doesn\'t; the monthly budget is all that matters',
            'Lenders weigh debt-to-income when you borrow',
            'Higher income raises your credit score directly',
          ],
          answerIndex: 1,
          explain: 'Credit scores don\'t include income, but lenders\' debt-to-income limits do. For a worker, earning power sets a ceiling on borrowing power — for a home, a car, or eventually a business.',
        },
      ],
      exercise: {
        intro: 'Find out what your work is worth on the open market, and build a specific plan to close the gap.',
        steps: [
          { title: 'Research market pay from at least two sources', detail: 'BLS occupational wage data for your area, plus job postings that list pay ranges.' },
          { title: 'Write down the range for your role, level and location', detail: 'Low, middle and high. Note which skills or credentials sit at the top.' },
          { title: 'Compare it to your total compensation', detail: 'Use the figure from the Total Compensation lesson, not salary alone.' },
          { title: 'List three concrete results you\'ve delivered', detail: 'Numbers where possible — time saved, errors cut, revenue helped, customers served.' },
          { title: 'Choose one portable skill or credential to build', detail: 'Pick the one that most moves you toward the top of the range and is valued beyond your current employer. Check whether your employer will pay for it.' },
          { title: 'Set a date', detail: 'For a pay conversation at your next review, or for starting a job search. Put it in your planner.' },
        ],
      },
    },
  ],

  wrapUp: [
    'You now know your real tax rate and whether a benefits cliff is near, your true total compensation and anything you\'ve been leaving unclaimed, whether your job honours the protections the law gives you, and what your work is worth on the open market.',
    'For a lot of people, that alone is a meaningful raise — collected match, correct overtime, a negotiated increase — without any new risk. Module 4 turns to the owner position: why owners are taxed after expenses, where the line between a business expense and a personal one really is, and how much the famous tax strategies are actually worth.',
  ],
};
