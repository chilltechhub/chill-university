// src/data/ownershipCurriculumFoundations.js
//
// Level 0 — How Money Systems Work.
//
// The lens every other level uses. Before entity selection, SBA loans or
// cost segregation make sense, someone needs a working model of the board the
// game is played on: how government writes the rules, how banks and the
// Federal Reserve price money, and how the same economy treats a person
// completely differently depending on whether they are acting as a CONSUMER,
// a WORKER, or an OWNER.
//
// The arc of the level is deliberate: map the system (M1), then take each
// role in turn — what it's exposed to, what protects it, where the traps are
// (M2–M4) — and finish with a concrete plan to move up (M5).
//
// ── The honest version of "the system rewards owners" ────────────────────────
// It's true that the tax code and commercial credit are built to reward
// people who build businesses and buy productive assets. It's also true that
// a lot of what circulates online about exploiting that ("turn your hobby into
// an LLC and write everything off", "depreciation takes your taxes to zero")
// gets ordinary people audited, penalised, or into debt they can't service.
// This level teaches the real mechanism, including the limits, because the
// people it's for are exactly the ones who can least afford to learn those
// limits from an IRS notice. Every lesson ends in something a person can
// actually do to improve their position, starting from wherever they are —
// and a lot of that is available without ever starting a business.
//
// Same shape as ownershipCurriculum.js. The long-form pages for every module
// live in curriculum/modules/L0M*.js and inherit checklists and deliverables
// from here by lesson key, so the Vault contract has exactly one source.

const L0 = {
  id: 'L0',
  track: 'foundations',
  screen: 'MoneySystems',
  title: 'Level 0: How Money Systems Work',
  short: 'Money Systems',
  color: '#2A9D8F',
  blurb: 'Government, banking and taxes — and why the same economy treats consumers, workers and owners so differently.',
  outcome: 'A clear map of where you sit in the system today, what protects you, what it costs you, and a 90-day plan to move up.',
  modules: [
    {
      title: 'Module 1: The System Map',
      objective: 'Understand the two layers every dollar moves through — government and banking — and the three roles you play inside them.',
      lessons: [
        { key: 'l0_three_roles', title: 'The Three Roles You Play',
          objective: 'Consumer, worker and owner are not three kinds of people — they are three positions, taxed and financed in a different order.',
          action: 'Map every source of income and every major expense you have to the role it belongs to.',
          checklist: ['Listed every income source', 'Labelled each as worker or owner income', 'Listed your largest recurring expenses', 'Noted which role pays for each', 'Estimated what share of your income comes from each role'],
          deliverable: 'Personal Economic Role Map' },
        { key: 'l0_money_creation', title: 'How Banks Actually Create Money',
          objective: 'Banks don\'t lend out deposits sitting in a vault — lending creates new deposits. Knowing that changes how you read a bank\'s offer.',
          action: 'Audit every bank and credit union relationship you have: what it pays you, what it charges you, and whether it is insured.',
          checklist: ['Listed every deposit account and institution', 'Recorded the interest rate each pays you', 'Recorded every fee each charges', 'Confirmed FDIC or NCUA coverage for each', 'Flagged any account paying well below available alternatives'],
          deliverable: 'Bank Relationship & Yield Audit' },
        { key: 'l0_fed_rates', title: 'The Federal Reserve & The Price of Money',
          objective: 'How one rate set in Washington reaches your credit card, your mortgage and a business line of credit — and why it moves in both directions.',
          action: 'List every debt you carry and model what happens to it if rates rise or fall.',
          checklist: ['Listed every debt with its current rate', 'Marked each as fixed or variable', 'Modelled a 1-point and 2-point rate rise on each variable debt', 'Totalled the monthly impact', 'Noted which debt is most exposed'],
          deliverable: 'Interest Rate Risk Assessment' },
        { key: 'l0_government_rules', title: 'Government as Rule-Writer',
          objective: 'Taxes, regulation and protection are one system of incentives. Read the rules as signals about what the government is paying people to do.',
          action: 'Build a directory of the agencies and rules that touch you in each role — including the ones that exist to protect you.',
          checklist: ['Found your state attorney general\'s consumer protection office', 'Found your state labor department', 'Found your state tax agency', 'Located your nearest Small Business Development Center', 'Noted the complaint route for each'],
          deliverable: 'Rules & Protections Directory' },
      ],
    },
    {
      title: 'Module 2: The Consumer — Defending Your Purchasing Power',
      objective: 'Stop losing money quietly: to inflation, to retail interest, and to rights nobody told you that you have.',
      lessons: [
        { key: 'l0_inflation', title: 'Inflation & The Real Return on Cash',
          objective: 'The interest a bank shows you is the nominal rate. What matters is what\'s left after inflation — and for most checking accounts, that number is negative.',
          action: 'Calculate the real return on every place you currently hold cash.',
          checklist: ['Listed every account holding cash', 'Recorded each balance and interest rate', 'Looked up the current inflation rate from an official source', 'Calculated the real return on each', 'Identified money that sits idle beyond your emergency needs'],
          deliverable: 'Cash Real-Return Analysis' },
        { key: 'l0_retail_credit', title: 'The True Cost of Retail Credit',
          objective: 'APR, compounding and the minimum-payment trap — why retail credit is priced to be carried, and how to use it without paying for it.',
          action: 'Calculate what each consumer debt actually costs you every month and how long minimum payments would take to clear it.',
          checklist: ['Listed every card, auto loan and consumer loan', 'Recorded balance, APR and minimum payment for each', 'Calculated the monthly interest cost of each', 'Checked each statement\'s minimum-payment payoff estimate', 'Ranked debts by cost'],
          deliverable: 'Retail Debt Cost Report' },
        { key: 'l0_consumer_rights', title: 'Your Rights as a Consumer',
          objective: 'Federal law gives you free credit reports, the right to dispute errors, protection from abusive collectors, and chargeback rights on cards. Most people use none of them.',
          action: 'Exercise the rights you already have: pull your reports, check them, and set up your protections.',
          checklist: ['Pulled free reports from all three bureaus via AnnualCreditReport.com', 'Checked each for accounts or details you don\'t recognise', 'Opted out of prescreened credit offers if you want to', 'Noted the written dispute route for each bureau', 'Saved the complaint routes for your state attorney general and the FTC'],
          deliverable: 'Consumer Rights Action Log' },
        { key: 'l0_consumption_to_production', title: 'From Consumption to Production',
          objective: 'Every dollar a consumer spends has already been taxed. The first move up the ladder is redirecting friction costs into something that produces.',
          action: 'Find the recurring costs that buy you nothing and redirect that exact amount somewhere automatic.',
          checklist: ['Listed every recurring charge from three months of statements', 'Marked each as used, underused or forgotten', 'Cancelled or renegotiated at least two', 'Calculated the monthly amount freed', 'Set an automatic transfer of that amount'],
          deliverable: 'Friction Cost Redirect Plan' },
      ],
    },
    {
      title: 'Module 3: The Worker — Getting Full Value From a Paycheck',
      objective: 'Understand exactly how employment income is taxed, what your pay really includes, the protections the law gives you, and how workers build leverage.',
      lessons: [
        { key: 'l0_tax_order_worker', title: 'Earn, Tax, Spend: How a Paycheck Is Taxed',
          objective: 'Withholding, marginal versus effective rates, and why a raise never lowers your take-home pay — with one real exception people rarely hear about.',
          action: 'Work out your actual effective tax rate from your own documents, and check whether you face a benefits cliff.',
          checklist: ['Located last year\'s tax return or W-2', 'Recorded total income and total federal tax', 'Calculated your effective federal rate', 'Identified your marginal bracket', 'Checked whether any benefit you receive phases out as income rises'],
          deliverable: 'Personal Effective Tax Rate Worksheet' },
        { key: 'l0_total_comp', title: 'Your Paycheck Is Not Your Pay',
          objective: 'Employer match, health coverage, HSA eligibility and payroll contributions are compensation. Leaving any of it unclaimed is a pay cut you agreed to without noticing.',
          action: 'Write down your total compensation — every dollar of value, not just salary — and find anything you\'re leaving unclaimed.',
          checklist: ['Recorded base pay', 'Found your employer retirement match formula', 'Checked whether you contribute enough to capture the full match', 'Recorded the employer share of health premiums', 'Checked HSA eligibility', 'Totalled all compensation'],
          deliverable: 'Total Compensation Statement' },
        { key: 'l0_worker_rights', title: 'Your Rights at Work',
          objective: 'Minimum wage, overtime, safety, unemployment insurance, anti-retaliation and classification — what the law guarantees, and where to go when it isn\'t honoured.',
          action: 'Check your own job against the protections that apply to it.',
          checklist: ['Confirmed whether you are classified exempt or non-exempt', 'Checked your state minimum wage against your pay', 'Checked whether you are paid correctly for overtime hours', 'Confirmed whether you are an employee or contractor, and why', 'Saved your state labor department\'s complaint route'],
          deliverable: 'Workplace Rights Checklist' },
        { key: 'l0_earning_power', title: 'How Workers Build Leverage',
          objective: 'Income tied to hours has a ceiling. Skills, market rate, negotiation and portable credentials are how a worker raises it.',
          action: 'Research your market rate and build a concrete plan to raise your earning power.',
          checklist: ['Researched market pay for your role from at least two sources', 'Compared it to your current pay', 'Listed the skills that command higher pay in your field', 'Chose one skill or credential to build', 'Set a date for a pay conversation or job search'],
          deliverable: 'Earning Power Growth Plan' },
      ],
    },
    {
      title: 'Module 4: The Owner — How the System Rewards Building',
      objective: 'Why owners are taxed after expenses, how entity structure changes the math, how commercial credit works, and which government incentives are real.',
      lessons: [
        { key: 'l0_tax_order_owner', title: 'Earn, Spend, Tax: How Owners Are Taxed',
          objective: 'A business deducts ordinary and necessary expenses before tax. The line between a real business expense and a personal one is where people get into trouble.',
          action: 'Review expenses you believe are business expenses against the test the IRS actually applies.',
          checklist: ['Listed every expense you treat as business', 'Tested each as ordinary and necessary', 'Separated personal-use portions of mixed-use items', 'Checked you have records supporting each', 'Assessed whether your activity is a business or a hobby'],
          deliverable: 'Business Expense Legitimacy Review' },
        { key: 'l0_entity_ladder', title: 'The Entity Tax Ladder',
          objective: 'W-2, sole proprietor, S-Corp and C-Corp are taxed differently on the same dollar. The real savings are usually smaller than advertised — and sometimes negative.',
          action: 'Model your own numbers across structures, including the costs each structure adds, then take the model to a CPA.',
          checklist: ['Estimated your net business profit', 'Modelled self-employment tax as a sole proprietor', 'Modelled payroll tax under an S-Corp at a salary range', 'Listed the added costs of each structure', 'Calculated the net difference', 'Noted the questions to take to a CPA'],
          deliverable: 'Entity Tax Comparison Model',
          caution: 'This models the mechanism. It does not set a salary for you — a defensible reasonable salary has to come from a CPA looking at your actual role and market data.' },
        { key: 'l0_leverage', title: 'Commercial Credit & Leverage',
          objective: 'Borrowing to fund something that earns more than it costs is how owners grow with other people\'s money. The same math, run on the downside, is how businesses fail.',
          action: 'For one planned investment, compare debt against equity or savings — and run the version where it goes wrong.',
          checklist: ['Defined one investment and its cost', 'Estimated its expected return', 'Compared the return to the cost of borrowing', 'Modelled the outcome if it earns half as much', 'Noted any personal guarantee involved', 'Recorded a decision and your reasoning'],
          deliverable: 'Debt vs. Equity Capital Plan' },
        { key: 'l0_incentives', title: 'Government Incentives — What\'s Real and What\'s Hype',
          objective: 'Depreciation, the R&D credit and pass-through deductions are genuine policy incentives. The limits on them are just as real, and most online advice skips those.',
          action: 'Identify which incentives genuinely apply to your situation and which ones don\'t.',
          checklist: ['Listed the incentives you have heard about', 'Checked each one\'s basic eligibility rules', 'Noted which apply to your income type', 'Checked the passive activity limits on any rental plans', 'Listed questions for a tax professional'],
          deliverable: 'Tax Incentive Eligibility Review' },
      ],
    },
    {
      title: 'Module 5: Moving Up — Your Personal Upgrade Plan',
      objective: 'Turn everything in this level into a sequence of real moves, starting from exactly where you are today.',
      lessons: [
        { key: 'l0_role_audit', title: 'Where You Stand Today',
          objective: 'An honest snapshot: where your money comes from, where it goes, what you owe, what protects you, and what you\'re exposed to.',
          action: 'Pull the deliverables from this level into one snapshot of your economic position.',
          checklist: ['Recorded monthly income by role', 'Recorded monthly outflow and surplus', 'Recorded total debt and its average cost', 'Recorded liquid savings in months of expenses', 'Named your single biggest exposure'],
          deliverable: 'Economic Position Snapshot' },
        { key: 'l0_side_business', title: 'The Side-Business Bridge',
          objective: 'A real side business opens the owner\'s rulebook to a worker. A fake one — or a job relabelled as contracting — opens an audit. Here is the difference.',
          action: 'Test whether a side business is right for you now, and if it is, set it up cleanly from day one.',
          checklist: ['Described the service or product and who pays for it', 'Confirmed it is not your employer\'s work relabelled', 'Checked local licence requirements', 'Opened a separate account for it', 'Set aside a percentage of every payment for tax', 'Set up a record-keeping habit'],
          deliverable: 'Side-Business Launch Checklist' },
        { key: 'l0_compliance_protection', title: 'Compliance as Protection',
          objective: 'Licences, sales tax, estimated payments and employer obligations aren\'t paperwork for its own sake — they are what stop a small operation being wiped out by one notice.',
          action: 'Audit your obligations in every role and fix the gaps before someone else finds them.',
          checklist: ['Checked business licence requirements', 'Checked whether you owe sales tax anywhere', 'Checked whether you owe estimated quarterly tax', 'Checked registration and reporting deadlines', 'Listed employer obligations if you have or plan helpers', 'Set calendar reminders for each deadline'],
          deliverable: 'Regulatory & Compliance Audit Log' },
        { key: 'l0_upgrade_plan', title: 'Your 90-Day Upgrade Plan',
          objective: 'Three months, sequenced by impact: stop the losses first, capture what you\'re already owed, then build toward ownership.',
          action: 'Build a dated, sequenced 90-day plan from your snapshot.',
          checklist: ['Chose your starting tier honestly', 'Picked the three highest-impact moves', 'Put each move in sequence with a date', 'Defined how you will know each is done', 'Set a 30-day and 90-day review date'],
          deliverable: '90-Day Economic Upgrade Plan' },
      ],
    },
  ],
};

export default L0;
