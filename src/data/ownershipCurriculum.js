// src/data/ownershipCurriculum.js
//
// The full Business Ownership curriculum — both tracks, all nine levels,
// transcribed from the Chill Tech blueprint (gemini_businessrework.pdf).
//
//   Small Business (cash flow):  L1 · L2 · L3A · L3B · L4
//   Startup (venture):           S1 · S2 · S3 · S4
//
// ── Why this is data rather than nine hand-written screens ───────────────────
// Level 2 was written long-form (see classes/entrepreneurClass/
// businessArchitecture.js) with full learn cards and practice quizzes. At
// ~180 lessons that shape would be tens of thousands of lines to maintain and
// impossible to keep consistent. So the OTHER eight levels live here as
// structure — module, lesson, objective, the action the lesson ends in, and
// the artifact it drops into the Vault — and one screen renders any of them.
//
// The Action Ledger is the important part and it is verbatim from the
// blueprint: every lesson produces a real deliverable, and a level's gate
// review passes when its deliverables are complete. That's what makes this a
// build-your-business track rather than a reading list.
//
// `learn` and `practice` are optional per lesson. Where they're absent the
// lesson still renders and still produces its Vault artifact — it just has no
// concept cards or quiz yet. That's the honest state of it, and filling them
// in is incremental rather than blocking.
//
// ── Content duty of care ─────────────────────────────────────────────────────
// This material is financial and legal. It TEACHES and CHECKLISTS; it does not
// draft documents, name a defensible salary, or file anything. Anything with a
// number attached carries the year it was reviewed. See REVIEWED_ON below and
// the long note at the top of businessArchitecture.js.

export const REVIEWED_ON = '2026-09-10';

export const DISCLAIMER =
  'Education, not legal, tax, or investment advice. Rules vary by state and change year to year — confirm with a licensed attorney, CPA, or advisor before acting.';

// ─── Small Business Track ────────────────────────────────────────────────────

const L1 = {
  id: 'L1',
  track: 'acquisition',
  screen: 'PersonalSovereignty',
  title: 'Level 1: Personal Financial Sovereignty',
  short: 'Personal Sovereignty',
  color: '#3AC860',
  blurb: 'Cash flow, credit, debt, taxes and risk — the foundation lenders actually check.',
  outcome: 'A 700+ credit profile, a 3-6 month reserve, and clean tax records.',
  modules: [
    {
      title: 'Module 1: Cash Flow Engineering & The Surplus Ratio',
      objective: 'Stop living paycheck to paycheck by turning cash flow into an investable surplus.',
      lessons: [
        { key: 'l1_income_streams', title: 'Income Streams & Gross-to-Net',
          objective: 'Understand paystubs, withholding, FICA, and what actually reaches your account.',
          action: 'Enter your latest paystub figures into the take-home analyzer.',
          checklist: ['Recorded gross pay per period', 'Listed every withholding line', 'Calculated true monthly take-home'],
          deliverable: 'Personal Gross-to-Net Report' },
        { key: 'l1_fixed_variable', title: 'Fixed vs. Variable Outflows',
          objective: 'Separate non-negotiable living costs from discretionary spending.',
          action: 'Categorise 90 days of spending into fixed and variable.',
          checklist: ['Listed all fixed monthly costs', 'Listed variable costs from 90 days', 'Totalled each category'],
          deliverable: 'Baseline Monthly Burn Rate Profile' },
        { key: 'l1_runway', title: 'Burn Rate & Personal Runway',
          objective: 'Know how many months you could survive with zero income.',
          action: 'Set your emergency threshold and target reserve.',
          checklist: ['Calculated monthly burn', 'Divided reserves by burn for runway in months', 'Set a target reserve figure'],
          deliverable: 'Emergency Runway Calculator Log' },
        { key: 'l1_owners_surplus', title: "Building the Owner's Surplus",
          objective: 'Automate allocations so seed capital accumulates without willpower.',
          action: 'Set up automatic allocations across your accounts (a common split is 50% essentials, 20% debt/savings, 20% business seed, 10% lifestyle).',
          checklist: ['Chose an allocation split', 'Opened or identified an account per bucket', 'Set the automatic transfers'],
          deliverable: "Owner's Surplus Allocation Map" },
      ],
    },
    {
      title: 'Module 2: Credit Optimization & Borrowing Power',
      objective: 'Turn a personal credit profile from a liability into leverage for approvals.',
      lessons: [
        { key: 'l1_fico_anatomy', title: 'Anatomy of the FICO Score',
          objective: 'The five levers: payment history 35%, utilisation 30%, length 15%, mix 10%, new credit 10% (reviewed 2026).',
          action: 'Pull your credit report and record your baseline across all five factors.',
          checklist: ['Pulled reports from all three bureaus', 'Recorded the current score', 'Noted the weakest of the five factors'],
          deliverable: 'Baseline FICO Profile & Audit' },
        { key: 'l1_disputes', title: 'Errors & Dispute Mechanics',
          objective: 'Identify genuine bureau errors and understand the dispute process.',
          action: 'Review each report line by line and list anything factually inaccurate.',
          // Deliberately NOT auto-generating dispute letters: doing that for
          // someone as part of a paid subscription is what CROA regulates.
          // The lesson teaches the mechanics; the user writes their own.
          checklist: ['Reviewed all three reports line by line', 'Listed items that are factually wrong', 'Gathered supporting documentation', 'Noted the dispute route for each bureau'],
          deliverable: 'Credit Report Accuracy Review' },
        { key: 'l1_utilisation', title: 'Utilisation & Statement Timing',
          objective: 'Balances report on the statement date, not the due date — that gap is the lever.',
          action: 'Record each card statement date and set payment alerts before them.',
          checklist: ['Listed every card with its statement date', 'Calculated per-card and overall utilisation', 'Set alerts ahead of each statement date'],
          deliverable: 'Statement Date Optimization Schedule' },
        { key: 'l1_banking_ties', title: 'Banking Relationships',
          objective: 'Relationship depth and account age affect what a bank will extend.',
          action: 'Log your banking relationships and how long each has been open.',
          checklist: ['Listed each institution and account age', 'Noted existing credit lines', 'Identified one relationship worth deepening'],
          deliverable: 'Bank Scorecard & Pre-Approval Profile' },
      ],
    },
    {
      title: 'Module 3: Debt Restructuring & Liquidity Defense',
      objective: 'Clear high-interest debt without destroying your cash reserves.',
      lessons: [
        { key: 'l1_debt_inventory', title: 'Good Debt vs. Bad Debt',
          objective: 'Separate consumer debt on depreciating things from leverage on income-producing assets.',
          action: 'Inventory every liability with balance, rate and term.',
          checklist: ['Listed every debt with its balance', 'Recorded the interest rate for each', 'Recorded minimum payment and term', 'Marked each as consumer or leverage'],
          deliverable: 'Master Debt Register' },
        { key: 'l1_payoff', title: 'Snowball vs. Avalanche',
          objective: 'Mathematical optimum (highest rate first) versus psychological momentum (smallest balance first).',
          action: 'Choose a payoff method and commit a monthly overage.',
          checklist: ['Compared total interest under both methods', 'Chose a method', 'Committed a specific monthly overage', 'Set the payoff order'],
          deliverable: 'Automated Debt Payoff Schedule' },
        { key: 'l1_transfers', title: '0% APR Balance Transfers',
          objective: 'Freezing interest buys principal progress — if the transfer fee and end date are understood.',
          action: 'Check eligibility and model whether a transfer actually saves money after fees.',
          checklist: ['Identified candidate balances', 'Recorded transfer fees and promo length', 'Calculated net saving after fees', 'Noted the promo end date'],
          deliverable: 'Balance Transfer Action Plan' },
        { key: 'l1_reserve', title: 'The Liquid Reserve',
          objective: 'A 3-6 month buffer is what lets you take a calculated business risk at all.',
          action: 'Move surplus into a dedicated high-yield liquid account.',
          checklist: ['Calculated the 3-6 month target', 'Opened or designated the account', 'Set the recurring contribution'],
          deliverable: 'Liquidity Reserve Tracker' },
      ],
    },
    {
      title: 'Module 4: Personal Tax Literacy',
      objective: 'Demystify the return and lay groundwork for business tax efficiency.',
      lessons: [
        { key: 'l1_deductions', title: 'Standard vs. Itemized',
          objective: 'AGI, brackets, and which path actually applies to you.',
          action: 'Run last year’s return through a tax estimation walkthrough.',
          checklist: ['Located last year’s return', 'Identified AGI and bracket', 'Compared standard against itemised'],
          deliverable: 'Personal Tax Position Summary' },
        { key: 'l1_credits', title: 'Credits vs. Deductions',
          objective: 'Credits cut tax dollar-for-dollar; deductions only cut taxable income.',
          action: 'Work through a credit eligibility checklist.',
          checklist: ['Reviewed eligibility for each common credit', 'Listed credits you qualify for', 'Noted documentation each requires'],
          deliverable: 'Eligible Tax Credit Report' },
        { key: 'l1_records', title: 'Document Management & Audit-Proofing',
          objective: 'Receipts, mileage and records, kept so they survive scrutiny.',
          action: 'Organise the last two years of tax records into one system.',
          checklist: ['Gathered W-2s and 1099s', 'Gathered two years of returns', 'Chose one storage system', 'Set a routine for new receipts'],
          deliverable: '2-Year Tax Record Index' },
        { key: 'l1_pretax', title: 'Pre-Tax Vehicles',
          objective: 'HSAs, Traditional and Roth IRAs, and what each is actually for.',
          action: 'Check eligibility for each and open the one that fits.',
          checklist: ['Checked HSA eligibility', 'Compared Traditional and Roth treatment', 'Opened or confirmed an account', 'Set a contribution amount'],
          deliverable: 'Pre-Tax Account Registration Log' },
      ],
    },
    {
      title: 'Module 5: Risk Management & Asset Protection',
      objective: 'Protect what exists before putting it at risk in a venture.',
      lessons: [
        { key: 'l1_insurance', title: 'The Core Insurance Stack',
          objective: 'Auto, health, renters/homeowners and term life as a baseline.',
          action: 'Audit every policy’s limits and find the gaps.',
          checklist: ['Listed every active policy', 'Recorded coverage limits and deductibles', 'Identified uncovered risks'],
          deliverable: 'Insurance Coverage Gap Analysis' },
        { key: 'l1_umbrella', title: 'Liability & Umbrella Policies',
          objective: 'Shielding net worth from a judgment that exceeds your base policies.',
          action: 'Calculate net worth at risk and request an umbrella quote.',
          checklist: ['Calculated total net worth exposed', 'Compared against existing liability limits', 'Requested at least one quote'],
          deliverable: 'Umbrella Policy Quote Request' },
        { key: 'l1_estate', title: 'Estate & Beneficiary Basics',
          objective: 'Beneficiary designations often override a will — and are easy to leave stale.',
          action: 'Review and update beneficiaries on every account.',
          checklist: ['Listed every account with a beneficiary field', 'Confirmed primary beneficiaries', 'Confirmed contingent beneficiaries'],
          deliverable: 'Beneficiary Designation Summary' },
      ],
    },
  ],
};

const L3A = {
  id: 'L3A',
  track: 'acquisition',
  screen: 'CapitalFunding',
  title: 'Level 3A: Capital & Funding',
  short: 'Capital & Funding',
  color: '#E0A830',
  blurb: 'SBA debt, grants, alternative lending and equity — how money actually gets raised.',
  outcome: 'A lender-ready underwriting package and a funded facility.',
  modules: [
    {
      title: 'Module 1: Capital Architecture & Cost of Capital',
      objective: 'Evaluate capital structures and avoid predatory financing.',
      lessons: [
        { key: 'l3a_wacc', title: 'Weighted Average Cost of Capital',
          objective: 'Debt is cheaper and non-dilutive but demands cash flow; equity is expensive and dilutive but patient.',
          action: 'Model your target debt-to-equity mix.',
          checklist: ['Listed each capital source and its cost', 'Calculated blended cost of capital', 'Chose a target mix'],
          deliverable: 'Capital Cost Matrix' },
        { key: 'l3a_dscr', title: 'Debt Service Coverage Ratio',
          objective: 'DSCR = net operating income ÷ total debt service. Commercial lenders commonly want 1.15×–1.25× (reviewed 2026).',
          action: 'Calculate your live DSCR from your P&L.',
          checklist: ['Calculated net operating income', 'Totalled annual debt service', 'Computed the ratio', 'Compared against a 1.25× threshold'],
          deliverable: 'Lender DSCR Scorecard' },
        { key: 'l3a_stack', title: 'The Capital Stack & Seniority',
          objective: 'Senior debt, then subordinated/mezzanine, then preferred equity, then common — who gets paid first.',
          action: 'Map your current liabilities into tiers.',
          checklist: ['Listed every obligation', 'Assigned each to a tier', 'Noted collateral on each'],
          deliverable: 'Visual Capital Stack Diagram' },
        { key: 'l3a_mca', title: 'Spotting Predatory Debt & MCAs',
          objective: 'Merchant cash advances quote a factor rate, not an APR — the true annualised cost is often enormous.',
          action: 'Convert any daily/weekly-holdback financing you hold into a true APR.',
          checklist: ['Listed every advance or short-term facility', 'Calculated true APR for each', 'Flagged anything above a sane threshold', 'Sketched a refinance route'],
          deliverable: 'Toxic Debt Refinance Plan' },
      ],
    },
    {
      title: 'Module 2: SBA Loan Programs & Underwriting',
      objective: 'Master the federal debt programs and what underwriters require.',
      lessons: [
        { key: 'l3a_7a', title: 'The SBA 7(a) Masterclass',
          objective: 'Working capital, acquisitions and equipment. Up to $5M, with owner equity injection typically 10-15% (reviewed 2026).',
          action: 'Draft your business plan and use-of-funds breakdown.',
          checklist: ['Stated the loan amount sought', 'Broke down use of funds line by line', 'Documented the equity injection source'],
          deliverable: 'SBA 7(a) Use of Funds Statement' },
        { key: 'l3a_504', title: 'SBA 504 & Fixed Assets',
          objective: 'The 50/40/10 structure: senior lender, CDC debenture, borrower equity.',
          action: 'Define your project scope and identify a CDC partner.',
          checklist: ['Defined the asset being financed', 'Modelled the 50/40/10 split', 'Identified a local CDC'],
          deliverable: 'SBA 504 Project Outline' },
        { key: 'l3a_microloans', title: 'Microloans & CAPLines',
          objective: 'Smaller and faster facilities for inventory and payroll gaps.',
          action: 'Find SBA micro-lenders serving your region.',
          checklist: ['Located regional micro-lenders', 'Compared terms', 'Noted application requirements'],
          deliverable: 'Microloan Application Package' },
        { key: 'l3a_package', title: 'Assembling the Underwriting Package',
          objective: 'Form 1919, Form 413, three years of returns, interim P&Ls, debt schedule and projections.',
          action: 'Compile every required document into one package.',
          checklist: ['Gathered 3 years business and personal returns', 'Prepared interim P&L and balance sheet', 'Completed the personal financial statement', 'Built a 2-year projection', 'Assembled into one file'],
          deliverable: 'Master SBA Underwriting Package' },
      ],
    },
    {
      title: 'Module 3: Non-Dilutive Grant Capital',
      objective: 'Source and win money that never has to be repaid.',
      lessons: [
        { key: 'l3a_federal_grants', title: 'Federal Grants & SBIR/STTR',
          objective: 'Grants.gov, SAM.gov, and the Phase I/II research programs.',
          action: 'Register on SAM.gov and search the SBIR/STTR databases.',
          checklist: ['Completed SAM.gov registration', 'Obtained a UEI', 'Searched relevant solicitations', 'Shortlisted candidates'],
          deliverable: 'SAM.gov UEI Confirmation & Grant Pipeline' },
        { key: 'l3a_state_grants', title: 'State & Local Economic Development',
          objective: 'SSBCI programs, job-creation credits and municipal pools.',
          action: 'Search your state and county programs.',
          checklist: ['Searched state economic development site', 'Checked county and municipal programs', 'Listed each with deadline and amount'],
          deliverable: 'State Grant Opportunities List' },
        { key: 'l3a_corporate_grants', title: 'Corporate & Foundation Grants',
          objective: 'Corporate small-business programs and community foundations — and how to spot the scams among them.',
          action: 'Shortlist legitimate programs and note their criteria.',
          checklist: ['Listed candidate programs', 'Verified each is legitimate and free to apply', 'Recorded eligibility criteria and deadlines'],
          deliverable: 'Corporate Grant Shortlist' },
        { key: 'l3a_grant_writing', title: 'Grant Writing & Budget Compliance',
          objective: 'A winning narrative plus an audit-proof budget, and the reporting that follows an award.',
          action: 'Draft the narrative and budget for your strongest candidate.',
          checklist: ['Drafted the problem and solution narrative', 'Built a line-item budget', 'Checked every stated eligibility rule', 'Noted post-award reporting duties'],
          deliverable: 'Grant Proposal Master Draft' },
      ],
    },
    {
      title: 'Module 4: Alternative & Private Debt',
      objective: 'Equipment finance, receivables, and unsecured lines.',
      lessons: [
        { key: 'l3a_179', title: 'Equipment Financing & Section 179',
          objective: 'Structuring equipment purchases so the deduction and the cash flow both work.',
          action: 'Log planned equipment purchases and model the deduction.',
          checklist: ['Listed planned purchases with costs', 'Checked current Section 179 limits', 'Compared lease against purchase', 'Confirmed treatment with your CPA'],
          deliverable: 'Section 179 Equipment Log' },
        { key: 'l3a_factoring', title: 'Asset-Based Lending & Factoring',
          objective: 'Turning receivables into cash without waiting 30-90 days — at a cost.',
          action: 'Evaluate factoring rates against your receivables ageing.',
          checklist: ['Pulled the AR ageing report', 'Collected factoring quotes', 'Calculated effective annualised cost'],
          deliverable: 'Receivables Liquidity Summary' },
        { key: 'l3a_credit_lines', title: 'Unsecured Commercial Lines',
          objective: 'Multi-bank relationships and what actually qualifies a business for an unsecured line.',
          action: 'Identify which institutions you qualify with today.',
          checklist: ['Listed banks with an existing relationship', 'Checked stated qualification criteria', 'Noted what your file is missing'],
          deliverable: 'Unsecured Business Credit Portfolio' },
        { key: 'l3a_seller_finance', title: 'Seller Financing & Earnouts',
          objective: 'Seller notes and earnouts to acquire with minimal cash out of pocket.',
          action: 'Draft the terms you would propose to a seller.',
          checklist: ['Defined the purchase structure', 'Proposed note terms', 'Defined earnout triggers', 'Flagged it for attorney review'],
          deliverable: 'Seller Finance Term Sheet' },
      ],
    },
    {
      title: 'Module 5: Equity Financing',
      objective: 'Raise private capital without losing control of the company.',
      lessons: [
        { key: 'l3a_pitch', title: 'Pitch Decks & Valuation',
          objective: 'A ten-slide deck, and the comparable/DCF/First-Chicago methods behind a number.',
          action: 'Build the deck from your real numbers.',
          checklist: ['Built all ten slides', 'Used real financials, not placeholders', 'Stated the raise amount and use of funds', 'Prepared a valuation rationale'],
          deliverable: 'Investor Pitch Deck' },
        { key: 'l3a_angels', title: 'Angel Networks & Family Offices',
          objective: 'Sourcing accredited investors regionally and how introductions actually happen.',
          action: 'Build a targeted investor pipeline.',
          checklist: ['Listed regional angel groups', 'Identified warm introduction routes', 'Built a tracker with status per contact'],
          deliverable: 'Investor CRM & Outreach List' },
        { key: 'l3a_safe', title: 'SAFEs & Convertible Notes',
          objective: 'Deferring the valuation argument to a later priced round — and what caps and discounts cost you.',
          action: 'Model how a SAFE converts under different future valuations.',
          checklist: ['Modelled conversion at several valuations', 'Understood cap versus discount effects', 'Calculated resulting dilution', 'Flagged terms for attorney review'],
          deliverable: 'SAFE Terms Analysis' },
        { key: 'l3a_captable', title: 'Cap Table & Term Sheets',
          objective: 'Liquidation preferences, anti-dilution, protective provisions and board seats.',
          action: 'Build your cap table and model post-raise dilution.',
          checklist: ['Listed all current holders and share counts', 'Modelled post-money ownership', 'Reviewed preference and anti-dilution terms', 'Noted board composition'],
          deliverable: 'Dynamic Capitalization Table' },
      ],
    },
  ],
};

// Extension included deliberately: Metro resolves either way, but it lets this
// data be imported and checked by plain Node in a test without a bundler.
import EXTRA_LEVELS from './ownershipCurriculumTracks.js';
import L0 from './ownershipCurriculumFoundations.js';

// Level 2 is intentionally absent here: it's written long-form as a real
// class screen (classes/entrepreneurClass/businessArchitecture.js) with full
// learn cards and practice quizzes. It's the depth target the other levels
// grow toward, not an exception to the model.
// L0 leads: it's the map of the system every later level operates inside.
export const LEVELS = [L0, L1, L3A, ...EXTRA_LEVELS];

// Two genuinely different paths, which the blueprint itself separates: L1-L4
// is buying and owning an existing cash-flow business (and the real estate
// under it); S1-S4 is building something new that may never have revenue for
// a year. They share Level 1 and Level 2 as foundations but diverge sharply
// after that, and telling someone on the wrong one to follow the other is
// actively unhelpful.
export const ACQUISITION_TRACK = LEVELS.filter(l => l.track === 'acquisition');
export const STARTUP_TRACK = LEVELS.filter(l => l.track === 'startup');

export const TRACKS = [
  {
    key: 'acquisition',
    title: 'Acquisition & Ownership',
    tagline: 'Buy or build a business that pays you from day one',
    description:
      'For someone who wants an operating business with real cash flow — bought, inherited, or grown from a service they already sell. Runs through personal finances, legal structure, SBA debt, commercial property, and the tax structures that protect what it earns.',
    forYouIf: [
      'You want income from the business relatively soon',
      'You would rather own something proven than invent something new',
      'Bank debt and property interest you more than investors do',
    ],
    color: '#E0A830',
    emoji: '🏛️',
  },
  {
    key: 'startup',
    title: 'Startup & Venture',
    tagline: 'Build something new, prove it, then scale it',
    description:
      'For someone building a product that does not exist yet. Runs through validating the idea before building, shipping an MVP, finding a repeatable growth channel, and raising institutional money if the market justifies it.',
    forYouIf: [
      'You have an idea rather than an existing customer base',
      'You can survive a stretch with little or no revenue',
      'The market could plausibly be very large',
    ],
    color: '#8B4FC4',
    emoji: '🚀',
  },
];

// Both tracks lean on Levels 1 and 2 regardless of which you pick — personal
// solvency and a clean legal entity are prerequisites either way.
export const SHARED_FOUNDATION_LEVELS = ['L0', 'L1', 'L2'];

export function getLevel(id) {
  return LEVELS.find(l => l.id === id) || null;
}

// Flattens a level into the `topics` shape ClassTopicScreen renders, wiring
// each lesson's action into an Apply block whose checklist persists to the
// Vault. Module titles ride along as a `module` field so the screen can group.
export function levelToTopics(level) {
  if (!level) return [];
  const out = [];
  level.modules.forEach((mod, mi) => {
    mod.lessons.forEach((lesson) => {
      out.push({
        key: lesson.key,
        title: lesson.title,
        color: level.color,
        module: mod.title,
        moduleIndex: mi,
        description: lesson.objective + (lesson.caution ? ' — ' + lesson.caution : ''),
        learn: lesson.learn,
        practice: lesson.practice,
        apply: {
          prompt: lesson.action,
          checklist: lesson.checklist || [],
          deliverable: { track: level.id, title: lesson.deliverable },
        },
      });
    });
  });
  return out;
}

// How many Vault artifacts a level contains — the denominator for its gate
// review (getTrackProgress in api/personaService.js).
export function levelDeliverableCount(level) {
  if (!level) return 0;
  return level.modules.reduce((n, m) => n + m.lessons.filter(l => l.deliverable).length, 0);
}

export default LEVELS;
