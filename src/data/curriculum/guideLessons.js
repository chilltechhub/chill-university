// src/data/curriculum/guideLessons.js
//
// Short-form teaching, delivered by the guide character.
//
// ── Where this sits ──────────────────────────────────────────────────────────
// The ownership curriculum has three depths now, and a module can be at any
// of them without anything breaking:
//
//   structural   ownershipCurriculum.js — every module has this. Lesson
//                titles, objectives, actions, checklists, Vault deliverables.
//   short form   THIS FILE — a two-minute walkthrough: the guide summarises
//                the module in a few speech bubbles and checks the one thing
//                people reliably get wrong.
//   long form    curriculum/modules/ — 200+ lines of prose, worked examples,
//                key terms and pitfalls. Three written so far.
//
// A module with no entry here simply doesn't offer the "Teach me this"
// button. Coverage is incremental and never blocking.
//
// ── The rule for anything regulated ──────────────────────────────────────────
// This is education, not advice — see DISCLAIMER in ownershipCurriculum.js,
// which the walkthrough shows before the first lesson of any level.
//
// So: teach the MECHANISM, give the number, stamp the year it was checked,
// and never tell someone what they personally should do.
//
//   yes  "Self-employed you pay both halves of FICA — 15.3% (reviewed 2026).
//         That gap is the reason the S-Corp election exists at all."
//   no   "You should elect S-Corp once you clear $40k."
//
// Every figure below carries "(reviewed 2026)" for the same reason the rest
// of the curriculum does: rates and thresholds move, and an unstamped number
// silently becomes a lie.
//
// ── Shape ────────────────────────────────────────────────────────────────────
// Keyed `${levelId}M${moduleNumber}`, matching moduleContent.js.
//
//   summary  [{ title, body }]   one speech bubble each
//   quiz     [{ question, options, answerIndex, explain }]
//
// Quiz questions test the misconception, not recall. A question whose answer
// is obvious from the bubble immediately before it teaches nothing.

export const GUIDE_LESSONS = {
  // ── L0 · How Money Systems Work ───────────────────────────────────────────
  // All five modules also have long-form guides (curriculum/modules/L0M*.js).
  // Quizzes here deliberately target the misconceptions the long form spends
  // the most time correcting — the ones that cost ordinary people money.
  L0M1: {
    summary: [
      { title: 'Three positions, not three kinds of people',
        body: "You're a consumer at the checkout, a worker on the clock, an owner the moment you sell something you produced. What differs is the ORDER of taxation: a worker is taxed before the costs of earning, an owner after legitimate costs." },
      { title: 'Banks create money when they lend',
        body: "A loan doesn't hand over someone else's deposit — it creates a new one. Reserve requirements have been zero since March 2020 (reviewed 2026); capital rules and demand for credit are the real limits. Your deposit is cheap funding for the bank, so shop it." },
      { title: 'One rate reaches everything',
        body: "The Federal Reserve sets a target for the federal funds rate. Prime is conventionally about 3 points above it (reviewed 2026), and most credit cards are prime plus a margin. Variable balances carry the Fed's decisions straight into your budget." },
    ],
    quiz: [
      { question: "Someone online says banks lend out ten times your deposit. What's closer to true?",
        options: ['Exactly right — that\'s the reserve multiplier', 'Lending creates new deposits; capital rules and credit demand limit it', 'Banks can only lend out money they physically hold'],
        answerIndex: 1,
        explain: "That multiplier story is outdated. Reserve requirements have been zero since 2020 (reviewed 2026). A source that repeats it deserves extra caution on everything else." },
      { question: 'A $1,000 tax credit versus a $1,000 deduction, in a 22% bracket. Which saves more?',
        options: ['The deduction', 'The credit — about $1,000 against roughly $220', 'They save the same'],
        answerIndex: 1,
        explain: "A deduction lowers taxable income, so it saves your rate times the amount. A credit comes straight off the bill. Always ask which one a 'tax break' actually is." },
    ],
  },

  L0M2: {
    summary: [
      { title: 'Nominal is not real',
        body: "The rate a bank shows is nominal. Real return is roughly that rate minus inflation. Cash at 0.01% during 3% inflation loses about 3% of its buying power a year while the balance appears to grow." },
      { title: 'The minimum payment shrinks — on purpose',
        body: "Minimums are mostly a percentage of the balance, so they fall as it falls. $5,000 at 24%: a fixed $150 clears it in 56 months. The shrinking minimum starts at the same $150 and takes about 19 and a half years." },
      { title: 'Rights you already have',
        body: "Free weekly credit reports at AnnualCreditReport.com, the right to dispute errors yourself, limits on debt collectors, and a $50 liability cap on unauthorised credit card use (reviewed 2026). No one needs to be paid to use them." },
    ],
    quiz: [
      { question: 'You carry $3,000 at 22% on a card paying 2% cash back. What are the rewards worth?',
        options: ['More than the interest', 'About the same', 'Far less — roughly $660 a year in interest would need $33,000 of spending to offset'],
        answerIndex: 2,
        explain: 'Rewards only pay when the balance is cleared in full every month. Carried balances erase them almost immediately.' },
      { question: "A company offers to remove negative items from your credit report for a monthly fee. What's true?",
        options: ['They can delete things you can\'t', 'You can dispute errors free yourself, and accurate items can\'t be removed by anyone', 'It\'s the only legal way to fix a report'],
        answerIndex: 1,
        explain: "Inaccurate items can be disputed directly with the bureaus at no cost. Promises to remove accurate negative information are a warning sign." },
    ],
  },

  L0M3: {
    summary: [
      { title: 'A raise never lowers take-home — from brackets',
        body: "Brackets currently run from 10% to 37% (reviewed 2026), and each rate applies only to income inside that bracket. Crossing a threshold taxes only the dollars above it." },
      { title: 'The real exception is a benefits cliff',
        body: "If a raise pushes a household past the limit for Medicaid, a childcare subsidy or similar, it can lose more in benefits than it gained in pay. Know your programs' limits and plan the jump." },
      { title: 'Your pay is bigger than your salary',
        body: "Employer match, health premiums the employer pays, and the employer's half of FICA (reviewed 2026) are all compensation. Contributing below the match is a pay cut you didn't negotiate." },
    ],
    quiz: [
      { question: 'Your employer matches 100% up to 5% of pay. You contribute 3%. What\'s happening?',
        options: ['You get the full match', 'You leave 2% of your salary in employer money unclaimed every year', 'The match only starts above 5%'],
        answerIndex: 1,
        explain: 'The match follows your contribution up to the cap. Contributing the full 5% is an immediate 100% return on the extra 2%.' },
      { question: 'You\'re paid a $50,000 salary and told that means no overtime. Is that automatically true?',
        options: ['Yes, salaried always means exempt', 'No — exemption also needs duties that meet legal tests', 'Only if your title says manager'],
        answerIndex: 1,
        explain: "Overtime exemption requires both a salary threshold and qualifying duties. Neither salary alone nor a job title decides it." },
    ],
  },

  L0M4: {
    summary: [
      { title: 'Owners are taxed after expenses',
        body: "A business deducts costs that are ordinary and necessary for it. Only the business share of mixed-use items counts, and a hobby's expenses aren't deductible at all under current rules (reviewed 2026)." },
      { title: 'A write-off is not free',
        body: "Self-employed in a 22% bracket, a legitimate $1,000 expense saves roughly $350 across income and self-employment tax. You still spent the other $650. Spending just to get a deduction always leaves you poorer." },
      { title: 'Real incentives have real limits',
        body: "Rental losses generally can't offset wages once modified AGI passes $150,000 (reviewed 2026). Depreciation mostly moves tax between years. Anything promising near-zero tax with no conditions is leaving the conditions out." },
    ],
    quiz: [
      { question: 'LLC nets $100,000; S-Corp election with a $60,000 salary. Roughly what does that save in payroll-type tax, before added costs?',
        options: ['$15,300', '$6,120 — 15.3% of the $40,000', 'About $4,950, and less after payroll and filing costs'],
        answerIndex: 2,
        explain: "Sole-proprietor self-employment tax is 15.3% of 92.35% of profit (reviewed 2026) — about $14,130. Payroll tax on a $60,000 salary is $9,180. The $6,120 figure skips the 92.35% step and every cost the S-Corp adds." },
      { question: 'Does forming a single-member LLC lower your taxes by default?',
        options: ['Yes, automatically', 'No — it\'s taxed like a sole proprietorship unless you elect otherwise', 'Yes, it becomes a 21% corporation'],
        answerIndex: 1,
        explain: 'An LLC is a legal structure. Tax treatment only changes with an election, such as S-Corp status.' },
    ],
  },

  L0M5: {
    summary: [
      { title: 'Start from the right tier',
        body: "Stabilise: stop losses. Capture: collect what you're owed. Build: put a real surplus to work. The right first moves are completely different for each, and starting from the wrong one produces the wrong plan." },
      { title: 'Order beats ambition',
        body: "Clearing 24% debt is a guaranteed 24% return; an employer match is an immediate 100%. Nothing later in the plan earns as much, as safely — so those come before investing or launching anything." },
      { title: 'A real side business, set up clean',
        body: "Your own paying customers, your control, a separate account, and about a quarter of every payment set aside for tax. Self-employment tax generally starts once net earnings reach $400 (reviewed 2026)." },
    ],
    quiz: [
      { question: 'You have a day job and new side-business profit. What\'s a simple alternative to quarterly estimated payments?',
        options: ['There isn\'t one', 'Increase withholding at your day job with a new W-4', 'Pay it all in April, penalty-free'],
        answerIndex: 1,
        explain: 'Extra paycheck withholding can cover tax on side income, and withholding is treated as paid evenly through the year — which can help avoid underpayment penalties.' },
      { question: 'A struggling business uses sales tax it collected to pay rent. What\'s the risk?',
        options: ['None — it\'s the business\'s money until it\'s due', 'Collected sales tax is held for the government; spending it creates serious liability that can reach the owner', 'None, if it\'s an LLC'],
        answerIndex: 1,
        explain: "Collected sales tax and withheld payroll tax are trust fund taxes. They were never the business's money, and an LLC doesn't shield responsible people from unpaid payroll withholding (reviewed 2026)." },
    ],
  },

  // ── L1 · Personal Financial Sovereignty ───────────────────────────────────
  // M1 also has a full long-form module (curriculum/modules/L1M1.js). The
  // short form is not a replacement — it's the version you can do on a bus.
  L1M1: {
    summary: [
      { title: 'Why this comes first',
        body: "Most businesses that die young don't die of a bad idea. They run out of money before they find their footing. How much runway you get is largely decided before the business exists, by how your personal finances are arranged." },
      { title: 'Gross is not net',
        body: "The salary you were hired at is the gross figure. What lands in your account is net — usually 20–35% less once federal tax, FICA and any state tax come out (reviewed 2026). Planning your life against the gross number is why the maths never seems to work." },
      { title: 'The number you will be asked for',
        body: "Surplus is what's left every month after everything real. Every later level assumes you can state your monthly burn and how long you'd survive with no income. Lenders ask. Investors ask. Work it out before someone makes you." },
    ],
    quiz: [
      { question: 'You go from employed to self-employed. What happens to FICA?',
        options: ['Nothing — it is the same either way', 'It roughly doubles for you', 'You stop paying it entirely'],
        answerIndex: 1,
        explain: 'As an employee you pay 7.65% and your employer quietly pays the matching half. Self-employed, both halves are yours — 15.3% (reviewed 2026). That single change is behind most of the tax planning in Level 4.' },
      { question: 'Your income is commission-based and swings a lot. What should you plan against?',
        options: ['The 12-month average', 'Your best months, to stay motivated', 'The lowest three months of the last year'],
        answerIndex: 2,
        explain: 'Planning against the average means a bad month leaves you structurally short — which is when people reach for credit at 24%. Planning against the floor makes bad months survivable and good months visibly accelerate you.' },
    ],
  },

  L1M2: {
    summary: [
      { title: 'A score is five levers, not a mood',
        body: "FICO is payment history 35%, utilisation 30%, length of history 15%, credit mix 10%, new credit 10% (reviewed 2026). Nothing else moves it. Knowing the weights tells you which lever is worth pulling." },
      { title: 'Utilisation is the fast one',
        body: "Payment history is the biggest lever but the slowest — it's built over years. Utilisation is nearly as heavy and resets monthly, which makes it the only lever that can move a score meaningfully in one cycle." },
      { title: 'Why a lender cares',
        body: "Business borrowing early on is underwritten against you personally. A small business loan will usually want a personal guarantee, so your personal score is the business's borrowing power until the business has its own file." },
    ],
    quiz: [
      { question: 'Which lever can realistically move your score the most in a single month?',
        options: ['Payment history', 'Credit utilisation', 'Length of credit history'],
        answerIndex: 1,
        explain: 'Utilisation is 30% of the score and recalculates every statement cycle. Payment history is heavier at 35% but is a record of years — you cannot change last year. Length of history only moves with time.' },
      { question: 'You have a new LLC with no borrowing history. What is a bank most likely to underwrite against?',
        options: ['The LLC only — it is a separate legal person', 'You personally, via a personal guarantee', 'Nothing; new entities cannot borrow'],
        answerIndex: 1,
        explain: 'Limited liability separates you for most claims, but a lender to a business with no track record will normally require a personal guarantee — which puts your personal file back in the frame. Building the business credit profile is what eventually changes that.' },
    ],
  },

  L1M3: {
    summary: [
      { title: 'Order of attack',
        body: "Two common orderings: avalanche pays the highest interest rate first and costs the least in total; snowball pays the smallest balance first and produces a visible win sooner. Avalanche wins on arithmetic; snowball wins on the ones people actually finish." },
      { title: 'Liquidity is separate from debt',
        body: "Cash you can reach without borrowing is what stops a surprise from becoming new debt. It is not an investment and it is not supposed to earn much — its whole job is being available on the day something breaks." },
      { title: 'Restructuring changes the terms, not the total',
        body: "Consolidation, balance transfers and refinancing move a balance to a different rate or term. They can cut cost genuinely, but the balance does not shrink because it moved. Watch the transfer fee and what the rate becomes after any promotional window." },
    ],
    quiz: [
      { question: 'What does a 0% balance transfer actually do to the amount you owe?',
        options: ['Reduces it by the promotional discount', 'Nothing — it moves it to a different rate and term', 'Clears it if paid within the promo window'],
        answerIndex: 1,
        explain: 'The balance moves, it does not shrink. It can still be a real saving if the interest avoided beats the transfer fee — but only if you also know what rate it reverts to when the promotional period ends.' },
    ],
  },

  L1M4: {
    summary: [
      { title: 'Deduction versus credit',
        body: "A deduction reduces the income you are taxed on. A credit reduces the tax itself. A $1,000 credit is worth $1,000; a $1,000 deduction is worth $1,000 times your marginal rate. They are not interchangeable, and people routinely treat them as if they are." },
      { title: 'Marginal is not average',
        body: "Being 'in the 24% bracket' does not mean 24% of everything. Brackets are marginal: only the income above each threshold is taxed at that rate (reviewed 2026). This is why 'a raise pushed me into a higher bracket so I take home less' is almost never true." },
      { title: 'Withholding is an estimate',
        body: "Your W-4 tells your employer roughly how much to hold back. A refund means you over-estimated and lent the money interest-free; a bill means you under-estimated. Neither is a reward or a punishment — both are just the estimate being off." },
    ],
    quiz: [
      { question: 'You are in the 22% bracket. Which is worth more to you — a $1,000 deduction or a $1,000 credit?',
        options: ['The deduction', 'The credit', 'They are equivalent'],
        answerIndex: 1,
        explain: 'The credit takes $1,000 straight off the tax owed. The deduction takes $1,000 off taxable income, which at 22% saves you $220. Roughly a 4.5× difference for the same headline number.' },
      { question: 'A raise moves part of your income into a higher bracket. What happens to your take-home?',
        options: ['It can fall — the higher rate applies to everything', 'It rises; only the income above the threshold is taxed higher', 'It stays flat until the next bracket'],
        answerIndex: 1,
        explain: 'Brackets are marginal. Only the portion above the threshold is taxed at the higher rate, so more gross always means more net. The belief otherwise causes people to turn down raises and extra work.' },
    ],
  },

  L1M5: {
    summary: [
      { title: 'Insurance is for what you cannot absorb',
        body: "The test is not 'is this likely' but 'could I write the cheque if it happened'. Small, affordable losses are cheaper to self-insure. Rare and ruinous ones are exactly what a policy is for — that is the whole trade." },
      { title: 'Liability follows the person without a structure',
        body: "Operating as a sole proprietor means there is no legal line between you and the business. A claim against the business is a claim against your personal assets. Level 3 is largely about drawing that line properly." },
      { title: 'Protection is layered',
        body: "Entity structure, insurance and titling do different jobs and none of them replaces the others. An LLC does not pay a claim; insurance does not stop a creditor reaching a personally-held asset." },
    ],
    quiz: [
      { question: 'What is the clearest reason to insure a risk rather than absorb it?',
        options: ['It is likely to happen', 'It would be unaffordable if it did happen', 'The premium is low'],
        answerIndex: 1,
        explain: 'Frequency is not the deciding factor — magnitude is. Frequent small costs are usually cheaper paid directly. Insurance earns its price on the rare loss you could not write a cheque for.' },
    ],
  },

  // ── L3A · Capital & Funding ────────────────────────────────────────────────
  L3AM1: {
    summary: [
      { title: 'Capital has a price either way',
        body: "Debt costs interest and has to be repaid on a schedule. Equity costs a share of everything the business ever earns, forever, and cannot be handed back. Founders often treat equity as free because nothing leaves the bank account this month." },
      { title: 'The capital stack',
        body: "Who gets paid first if things go wrong. Senior secured debt sits at the top, then unsecured debt, then preferred equity, then common equity — which is usually you. Position in that stack explains most of what a term sheet is arguing about." },
      { title: 'Match the term to the asset',
        body: "Borrow long for things that last long, short for things that turn over quickly. Financing a ten-year asset on a two-year note is how a profitable business ends up unable to make a payment." },
    ],
    quiz: [
      { question: 'Where does a founder’s common equity normally sit in the capital stack?',
        options: ['First — it is the founder’s company', 'Last, after all debt and preferred equity', 'Alongside senior secured debt'],
        answerIndex: 1,
        explain: 'Common equity is the residual claim: paid only after everyone else. That is exactly why it carries the most upside and the most risk, and why giving it away cheaply is expensive in a way that is invisible on day one.' },
      { question: 'Why is financing a 10-year asset with a 2-year loan risky even for a profitable business?',
        options: ['The interest rate is always higher', 'Repayment outruns what the asset produces, creating a cash squeeze', 'Lenders will not allow it'],
        answerIndex: 1,
        explain: 'It is a timing mismatch, not a profitability problem. The asset earns over ten years but the debt demands repayment in two, so the business can be genuinely profitable and still miss a payment.' },
    ],
  },

  L3AM2: {
    summary: [
      { title: 'The SBA does not lend',
        body: "It guarantees. You borrow from a bank or a CDC; the SBA promises to cover part of the loss if you default. That guarantee is why a lender will consider a business it would otherwise turn down — the credit decision is still the lender's." },
      { title: '7(a) versus 504',
        body: "7(a) is the general-purpose program — working capital, equipment, acquisition. 504 is for fixed assets like real estate and heavy equipment, structured across a senior lender, a CDC debenture and borrower equity (reviewed 2026)." },
      { title: 'What underwriting looks at',
        body: "Cash-flow coverage first: can the business service the debt from what it actually earns. Then collateral, then the personal guarantee, then your own credit file. A strong idea with thin coverage fails on the first test." },
    ],
    quiz: [
      { question: 'Who actually lends you the money in an SBA 7(a) loan?',
        options: ['The Small Business Administration', 'A bank or approved lender, with an SBA guarantee behind it', 'The Treasury, via the SBA'],
        answerIndex: 1,
        explain: 'The SBA guarantees a portion against default; the money and the credit decision come from the lender. This is why two banks can reach opposite conclusions on the same SBA-eligible borrower.' },
      { question: 'Which program is designed for buying commercial real estate?',
        options: ['7(a)', '504', 'Neither — SBA does not finance property'],
        answerIndex: 1,
        explain: '504 exists for long-lived fixed assets and is structured across a senior lender, a CDC debenture and borrower equity (reviewed 2026). 7(a) is the flexible general-purpose program and can be used more broadly.' },
    ],
  },

  L3AM3: {
    summary: [
      { title: 'Non-dilutive means you keep the company',
        body: "A grant is not repaid and takes no ownership. That makes it the cheapest capital that exists — and the reason it is competitive, slow, and heavily conditioned on doing what you said you would do with it." },
      { title: 'Grants buy a specific outcome',
        body: "Funders are purchasing a result: research, jobs, a service in a particular place. Applications fail most often for being about what the applicant wants rather than what the funder is trying to cause." },
      { title: 'The cost is compliance',
        body: "Reporting, restricted spending categories, and audit exposure. Free money with strings and paperwork is still cheaper than equity, but it is not free of work — budget the admin time before accepting." },
    ],
    quiz: [
      { question: 'What is the real cost of grant capital?',
        options: ['Interest, at a subsidised rate', 'Reporting, restricted use and compliance work', 'A small equity share'],
        answerIndex: 1,
        explain: 'No repayment and no dilution is exactly why it is called non-dilutive. What you pay instead is administrative: restricted spending, reporting obligations, and the audit exposure that comes with accepting public or institutional money.' },
    ],
  },

  L3AM4: {
    summary: [
      { title: 'Speed has a price',
        body: "Private credit, revenue-based financing and merchant cash advances fund fast and underwrite loosely. That convenience shows up as cost — often far above a bank rate once expressed as an annual figure." },
      { title: 'Factor rate is not an interest rate',
        body: "A 1.3 factor on $50,000 means repaying $65,000. If that is repaid over six months rather than a year, the effective annualised cost is roughly double what the factor makes it look. Always convert before comparing." },
      { title: 'Read what it attaches to',
        body: "Daily or weekly sweeps against receipts, blanket liens on business assets, confessions of judgment. These terms decide what happens on a bad month, which is the only month they matter." },
    ],
    quiz: [
      { question: 'A lender offers $50,000 at a 1.3 factor rate, repaid over 6 months. What do you repay?',
        options: ['$51,300', '$65,000', '$50,000 plus 1.3% interest'],
        answerIndex: 1,
        explain: '$50,000 × 1.3 = $65,000. And because it is repaid in six months rather than twelve, the effective annualised cost is roughly twice what the factor number suggests — which is why factor rates and interest rates cannot be compared directly.' },
    ],
  },

  L3AM5: {
    summary: [
      { title: 'Equity is permanent',
        body: "Debt ends when it is repaid. Equity does not end. A share sold at the seed stage is a share of every outcome afterwards, including one nobody has imagined yet." },
      { title: 'Valuation sets the price of a share',
        body: "Pre-money is the agreed value before the investment; post-money is pre-money plus the money in. Your dilution is the raise divided by the post-money figure — which is why arguing about valuation is arguing about how much of the company you keep." },
      { title: 'The terms can matter more than the number',
        body: "Liquidation preference, participation, anti-dilution and board composition can move who gets what far more than headline valuation. A high valuation on aggressive terms is frequently worse than a lower one on clean terms." },
    ],
    quiz: [
      { question: 'You raise $1M at a $4M pre-money valuation. What share of the company have you sold?',
        options: ['25%', '20%', '10%'],
        answerIndex: 1,
        explain: 'Post-money is $4M + $1M = $5M, and $1M ÷ $5M = 20%. Reading the dilution off the pre-money figure instead gives 25% and is one of the most common errors founders make at their first raise.' },
      { question: 'Two offers: a higher valuation with a 2× participating preference, or a lower one with a clean 1× non-participating. Which needs more scrutiny?',
        options: ['The lower valuation — less money now', 'The higher valuation — the preference can consume the upside', 'Neither; valuation is what matters'],
        answerIndex: 1,
        explain: 'A participating preference pays the investor their multiple first AND lets them share the remainder. On many realistic exits that leaves founders with less than the lower-valuation, clean-terms offer would have.' },
    ],
  },

  // ── S1 · Idea Validation & Customer Discovery ──────────────────────────────
  S1M1: {
    summary: [
      { title: 'Start from a problem, not a product',
        body: "Ideas that begin as a solution tend to go looking for a problem to justify themselves. Ideas that begin as a problem you have watched people work around already have evidence attached." },
      { title: 'Frequency and pain',
        body: "The problems worth solving are frequent, expensive, or both. A rare annoyance is not a business no matter how elegant the fix, because nobody changes behaviour for something that irritates them twice a year." },
      { title: 'Why you',
        body: "Unfair advantage is unglamorous: access to the customer, domain knowledge others lack, or a channel you already own. If anyone could build this and reach the same buyers as easily, the idea is not the hard part." },
    ],
    quiz: [
      { question: 'Which is the stronger starting signal for a venture?',
        options: ['An elegant solution looking for its market', 'A frequent, expensive problem people already work around', 'A large market with no obvious competitor'],
        answerIndex: 1,
        explain: 'An existing workaround is proof that the pain is real enough to spend effort on today — before you have built anything. A market with no competitor more often means no market than an untapped one.' },
    ],
  },

  S1M2: {
    summary: [
      { title: 'People are polite, not honest',
        body: "Asked whether they would use your product, most people say yes because the social cost of saying no is higher than the cost of the lie. Their answer tells you nothing about what they will do." },
      { title: 'Ask about the past, not the future',
        body: "'Would you buy this?' is a prediction and people are bad at those. 'Tell me the last time you had this problem — what did you do?' is a memory, and memories contain what actually happened, including what they already paid to fix it." },
      { title: 'Never pitch in a discovery interview',
        body: "The moment you describe your solution, you have told them what you want to hear and the interview is over. Keep the product out of the room until you have the story of the problem." },
    ],
    quiz: [
      { question: 'Which interview question produces the most reliable signal?',
        options: ['"Would you pay $20/month for this?"', '"Walk me through the last time this problem came up — what did you do?"', '"Do you think this is a good idea?"'],
        answerIndex: 1,
        explain: 'The first two are predictions and invite politeness. The third asks about a real past event, which surfaces the workaround they already use and what it already costs them — facts rather than forecasts.' },
      { question: 'Why avoid describing your solution during discovery?',
        options: ['They might copy it', 'It signals the answer you want and contaminates everything after', 'It uses up interview time'],
        answerIndex: 1,
        explain: 'Once someone knows what you are hoping to hear, agreement becomes the path of least resistance. The interview stops being evidence and becomes a mirror.' },
    ],
  },

  S1M3: {
    summary: [
      { title: 'TAM, SAM, SOM',
        body: "Total addressable market is everyone who could ever buy. Serviceable available market is those you could actually reach with your model. Serviceable obtainable market is what you could realistically win. Most pitch decks quote the first and mean the third." },
      { title: 'Build it bottom-up',
        body: "Top-down — '1% of a $10B market' — is a number with no mechanism behind it. Bottom-up multiplies customers you could actually reach by a price you have evidence for, and survives being questioned." },
      { title: 'Price is positioning',
        body: "Price signals what the product is, not just what it costs. Pricing far below the value delivered attracts the customers who churn hardest and starves the business of the margin it needs to serve them well." },
    ],
    quiz: [
      { question: 'Which market estimate would an investor take seriously?',
        options: ['1% of a $10B total market', '4,000 reachable businesses × $200/month, from named segments', 'The market grew 30% last year'],
        answerIndex: 1,
        explain: 'The bottom-up figure has a mechanism you can interrogate — where the 4,000 comes from, why $200. "1% of a big number" is arithmetic dressed as a plan, and every experienced investor has seen it a thousand times.' },
    ],
  },

  S1M4: {
    summary: [
      { title: 'Test demand before supply',
        body: "A smoke test measures whether people will act before the thing exists — a landing page, a pre-order, a concierge version you deliver by hand. It buys evidence at a fraction of the cost of building." },
      { title: 'Intent has to cost something',
        body: "Signal quality tracks what the action costs. An email address is weak, a card detail is strong, a payment is strongest. Free interest is abundant and means almost nothing." },
      { title: 'Be honest about what you are testing',
        body: "Taking money for something that does not exist has a line between validation and misrepresentation. Pre-orders with a clear delivery expectation and a refund path stay the right side of it." },
    ],
    quiz: [
      { question: 'Which smoke-test result is the strongest evidence of demand?',
        options: ['500 email signups', '40 people who entered card details to reserve a spot', '10,000 page views'],
        answerIndex: 1,
        explain: 'Signal quality scales with what the action costs the person. Views cost nothing, an email address nearly nothing. Handing over payment details is a real commitment, which is why forty of those beat five hundred signups.' },
    ],
  },

  S1M5: {
    summary: [
      { title: 'A thesis is falsifiable',
        body: "'We believe X customers have Y problem and will pay Z' can be shown wrong. 'There is a big opportunity in this space' cannot, which is why it survives contact with evidence and teaches you nothing." },
      { title: 'Decide the gate in advance',
        body: "Write down what result would make you stop, before you run the test. Deciding afterwards means you will reinterpret whatever you get — and the sunk cost will do the interpreting." },
      { title: 'Not building is a real outcome',
        body: "The point of validation is to find out cheaply. A no that cost you three weeks is a success. It is only a failure if you spend a year proving the same thing." },
    ],
    quiz: [
      { question: 'When should you decide what evidence would make you abandon the idea?',
        options: ['After the results are in, with full context', 'Before running the test', 'You should not — commitment is what carries a founder through'],
        answerIndex: 1,
        explain: 'Set afterwards, the bar moves to wherever the results landed — that is motivated reasoning, and sunk cost makes it nearly irresistible. Written down in advance, the test can actually tell you something.' },
    ],
  },

  // ── L3B · Real Estate & Asset Building ──────────────────────────────
  L3BM1: {
    summary: [
      { title: 'Commercial is priced on income',
        body: "A house is priced by what similar houses sold for. Commercial property is priced by what it earns. That single difference is why you can raise the value of a building by raising its rent roll \u2014 and why a badly run property sells at a discount to an identical one next door." },
      { title: 'NOI and the cap rate',
        body: "Net operating income is rent minus operating expenses, before financing. Cap rate is NOI divided by price. Rearranged, price equals NOI divided by cap rate \u2014 so at a 7% cap, every extra $1,000 of annual NOI is roughly $14,000 of value." },
      { title: 'The 51% rule',
        body: "If your own business occupies at least 51% of the building, it can be financed as owner-occupied, which opens SBA programs and better terms. Below that it is an investment property and priced accordingly (reviewed 2026)." },
    ],
    quiz: [
      { question: 'You add $7,000 of annual NOI to a building in a 7% cap-rate market. Roughly what happens to its value?',
        options: ['It rises about $7,000', 'It rises about $100,000', 'Nothing until you sell'],
        answerIndex: 1,
        explain: 'Value = NOI \u00f7 cap rate, so $7,000 \u00f7 0.07 = $100,000. This is the whole logic of value-add: a modest, permanent increase in income is multiplied into a large increase in price.' },
      { question: 'Your business will occupy 60% of a building you are buying. Why does that number matter?',
        options: ['It sets the property tax rate', 'It qualifies the purchase as owner-occupied, opening SBA financing', 'It determines the depreciation schedule'],
        answerIndex: 1,
        explain: 'Clearing 51% owner-occupancy is what moves a purchase from investment financing into owner-occupied programs (reviewed 2026). The remainder can still be leased out.' },
    ],
  },

  L3BM2: {
    summary: [
      { title: 'The 504 split',
        body: "SBA 504 for real estate is conventionally structured 50/40/10 \u2014 a senior lender at 50%, a CDC debenture at 40%, and 10% borrower equity (reviewed 2026). The appeal is obvious: a large fixed asset with a comparatively small cash outlay." },
      { title: 'DSCR is the gate',
        body: "Debt service coverage ratio is NOI divided by annual debt payments. Lenders commonly want somewhere around 1.20\u00d7\u20131.35\u00d7 (reviewed 2026) \u2014 meaning the property must earn comfortably more than the loan costs. A deal that pencils at exactly 1.0\u00d7 does not get financed." },
      { title: 'Seller financing exists',
        body: "Not every purchase runs through a bank. Master leases, contract-for-deed and carryback notes let a motivated seller finance part of the price. Terms are negotiable in ways bank products are not \u2014 and correspondingly need a lawyer." },
    ],
    quiz: [
      { question: 'A property produces $120,000 NOI and the annual debt service is $100,000. What is the DSCR?',
        options: ['0.83\u00d7', '1.20\u00d7', '20%'],
        answerIndex: 1,
        explain: '$120,000 \u00f7 $100,000 = 1.20\u00d7 \u2014 just at the low end of what lenders commonly ask for (reviewed 2026). Below 1.0\u00d7 the property does not cover its own loan.' },
      { question: 'In a conventional SBA 504 structure, roughly how much comes from the borrower?',
        options: ['10%', '40%', '50%'],
        answerIndex: 0,
        explain: 'The conventional split is 50% senior lender, 40% CDC debenture, 10% borrower equity (reviewed 2026). That low equity requirement is the main reason 504 is attractive for owner-occupied property.' },
    ],
  },

  L3BM3: {
    summary: [
      { title: 'A pro forma is an argument',
        body: "Gross potential rent, minus vacancy, minus operating expenses, equals net cash flow. Every one of those lines is an assumption, and a seller's pro forma is written to sell. Rebuild it with your own vacancy and expense numbers before believing any of it." },
      { title: 'Contamination transfers with the property',
        body: "A Phase I environmental assessment reviews historical site use for contamination risk. This matters because environmental liability can follow the property to the new owner \u2014 you can inherit a cleanup obligation you had nothing to do with." },
      { title: 'Find the expensive problems first',
        body: "Roof, HVAC, foundation, ADA compliance. A physical condition assessment prices the deferred maintenance so it becomes a negotiating position rather than a surprise in month three. Zoning and title do the same for legal problems." },
    ],
    quiz: [
      { question: 'Why does a Phase I environmental assessment matter to a buyer specifically?',
        options: ['It is required for insurance', 'Environmental liability can transfer to the new owner', 'It sets the property tax basis'],
        answerIndex: 1,
        explain: 'Contamination liability attaches to the property, so a buyer can inherit a cleanup obligation created decades earlier. The assessment is how that risk gets found while you can still walk away or renegotiate.' },
    ],
  },

  L3BM4: {
    summary: [
      { title: 'Who pays for what',
        body: "Triple net means the tenant pays taxes, insurance and maintenance on top of rent. Gross means the landlord absorbs them. The headline rent figures are not comparable between the two \u2014 a lower NNN rent can be better income than a higher gross one." },
      { title: 'Self-leasing has to be real',
        body: "A common structure is a holding company owning the property and leasing it to your operating company. It only works if the lease is at genuine market rent with real documentation. A below-market or undocumented lease invites the whole arrangement to be recharacterised." },
      { title: 'Value-add is income engineering',
        body: "Sub-metering utilities, adding storage or parking, re-leasing at market, reconfiguring layout. Each raises NOI permanently, and NOI divided by cap rate is the valuation \u2014 which is why operators chase small recurring gains." },
    ],
    quiz: [
      { question: 'Your holding company leases the building to your operating company. What makes that arrangement defensible?',
        options: ['Keeping the rent well below market so the operating company thrives', 'A documented lease at genuine market rent', 'Common ownership means no lease is needed'],
        answerIndex: 1,
        explain: 'Arm\u2019s length means the terms look like what an unrelated party would agree to. Below-market or undocumented rent between entities you control is exactly what gets the structure challenged.' },
    ],
  },

  L3BM5: {
    summary: [
      { title: 'Cost segregation front-loads deductions',
        body: "A building depreciates over decades, but its components \u2014 fixtures, certain finishes, land improvements \u2014 have shorter lives. A cost segregation study reclassifies them, pulling deductions forward. It changes timing, not the total." },
      { title: 'The 1031 clock is strict',
        body: "A like-kind exchange defers capital gains by rolling proceeds into another property, on a hard timetable: 45 days to identify the replacement and 180 days to close (reviewed 2026). Miss either and the exchange fails and the gain is recognised." },
      { title: 'One entity per property',
        body: "Holding each property in its own entity under a parent is about containment: a claim arising at one building cannot reach the others. The cost is more filings, more bank accounts and more bookkeeping." },
    ],
    quiz: [
      { question: 'What are the two deadlines in a 1031 exchange?',
        options: ['30 days to identify, 90 to close', '45 days to identify, 180 to close', 'One year for both'],
        answerIndex: 1,
        explain: '45 days to identify the replacement property and 180 days to close (reviewed 2026). Both run from the sale, both are strict, and missing either means the deferral is lost and the gain becomes taxable.' },
      { question: 'What does cost segregation actually change?',
        options: ['The total depreciation you can ever claim', 'When you can claim it \u2014 pulling deductions into earlier years', 'The purchase price basis'],
        answerIndex: 1,
        explain: 'It is a timing strategy. Reclassifying components into shorter lives accelerates deductions into earlier years, which is valuable for cash flow \u2014 but the total claimed over the asset\u2019s life is unchanged.' },
    ],
  },

  // ── L4 · Taxes & Wealth Protection ──────────────────────────────────
  // The highest-stakes content in the track. Every figure carries its review
  // year, every strategy is described as a mechanism with its conditions, and
  // nothing here tells anyone what to do \u2014 the disclaimer leads the walkthrough.
  L4M1: {
    summary: [
      { title: 'Why the S-Corp election exists',
        body: "Self-employment tax is 15.3% on business profit (reviewed 2026). An S-Corp election splits that profit into a salary (which pays it) and distributions (which do not). The saving is real, and so is the condition attached to it." },
      { title: 'Reasonable salary is the condition',
        body: "The salary has to be defensible for the work actually performed \u2014 comparable to what you would pay someone else to do your job. Paying yourself an implausibly small salary to shrink the taxed portion is the single most examined feature of the structure." },
      { title: 'Presence creates obligations',
        body: "Nexus means income, sales and payroll obligations follow your presence across state lines \u2014 employees, inventory, sometimes just enough sales volume. Operating in several states without checking this is a common and expensive oversight." },
    ],
    quiz: [
      { question: 'What is the constraint on an S-Corp salary/distribution split?',
        options: ['Salary must be at least half of profit', 'Salary must be reasonable for the work actually performed', 'There is no constraint; the split is the owner\u2019s choice'],
        answerIndex: 1,
        explain: 'The test is reasonableness for the role \u2014 what you would have to pay someone else to do your job. There is no universal percentage, which is exactly why an implausibly low salary attracts scrutiny.' },
      { question: 'What does self-employment tax apply to that an S-Corp distribution does not?',
        options: ['Nothing \u2014 both are treated the same', 'The 15.3% Social Security and Medicare charge (reviewed 2026)', 'State income tax only'],
        answerIndex: 1,
        explain: 'SE tax is the 15.3% covering both halves of Social Security and Medicare (reviewed 2026). Distributions are not subject to it, which is the entire arithmetic behind the election \u2014 and why the salary portion is scrutinised.' },
    ],
  },

  L4M2: {
    summary: [
      { title: 'The Augusta rule has real conditions',
        body: "\u00a7280A lets you rent your residence to your business for up to 14 days a year without that income being taxable to you (reviewed 2026). The conditions are the point: genuine business use, documented market rate, and real minutes of a real meeting." },
      { title: 'Section 179 and bonus depreciation',
        body: "Both let you deduct qualifying assets in year one rather than over a schedule. Like cost segregation, this is a timing shift \u2014 valuable when cash flow matters, but it is not extra money and the asset cannot be deducted twice." },
      { title: 'An accountable plan is paperwork that pays',
        body: "Without a formal plan, reimbursing yourself for business expenses can be treated as taxable income. With one, the reimbursement is deductible to the company and tax-free to you. The difference is a written policy and kept receipts." },
    ],
    quiz: [
      { question: 'What makes an Augusta-rule (\u00a7280A) arrangement hold up?',
        options: ['Staying under 14 days is sufficient on its own', 'Genuine business use, documented market rate, and real meeting records', 'Owning the property through the business'],
        answerIndex: 1,
        explain: 'The day count is one condition, not the whole test (reviewed 2026). Documentation of a real meeting at a defensible market rate is what makes it a business expense rather than a paper transaction.' },
      { question: 'Section 179 lets you deduct an asset in year one. What does that change?',
        options: ['The total deduction over the asset\u2019s life', 'The timing \u2014 deductions move into the current year', 'The asset\u2019s purchase price'],
        answerIndex: 1,
        explain: 'It accelerates rather than adds. Taking it now means it is not available later, which is a genuine cash-flow benefit but not a larger deduction overall.' },
    ],
  },

  L4M3: {
    summary: [
      { title: 'Wearing both hats',
        body: "In a solo 401(k) you contribute as the employee and again as the employer, which lifts the combined annual limit well above what an employee-only plan allows (reviewed 2026). Being the whole company is the reason it works." },
      { title: 'Defined benefit plans trade flexibility for room',
        body: "For consistently high, stable net income, a defined benefit or cash balance plan can shelter substantially more than a 401(k). The trade is a funding commitment \u2014 you are promising future contributions, which is uncomfortable in a bad year." },
      { title: 'Self-directed accounts have hard edges',
        body: "Retirement funds can hold alternative assets, but prohibited-transaction rules are strict and unforgiving: no personal benefit, no dealing with disqualified persons. Breaching them can disqualify the whole account, not just the offending transaction." },
    ],
    quiz: [
      { question: 'Why can a solo 401(k) accept more than an ordinary employee 401(k)?',
        options: ['Higher limits apply to the self-employed generally', 'You contribute in both the employee and employer capacities', 'Contributions are not capped'],
        answerIndex: 1,
        explain: 'Being both parties means both contribution types are available to you, lifting the combined limit (reviewed 2026). It is not that the rules are looser \u2014 it is that you occupy both roles.' },
      { question: 'What is the risk of a prohibited transaction in a self-directed retirement account?',
        options: ['A penalty on that transaction', 'The whole account can lose its tax-advantaged status', 'The transaction is simply reversed'],
        answerIndex: 1,
        explain: 'The consequence is disproportionate to the mistake: disqualification can apply to the entire account rather than just the offending trade. That severity is why the rules are worth reading before, not after.' },
    ],
  },

  L4M4: {
    summary: [
      { title: 'Separation is the whole idea',
        body: "A parent holding company sits above separate entities for operations, intellectual property and property. The point is containment: a claim arising in the operating business should not be able to reach the building or the trademarks." },
      { title: 'IP licensing back to the operator',
        body: "Trademarks, code and domains held in one entity and licensed to the operating company for a fee. Like self-leasing, it only holds if the licence is documented and the fee is defensible \u2014 the paperwork is the protection." },
      { title: 'Charging order protection varies enormously',
        body: "Multi-member LLC statutes in some states limit a personal creditor to a charging order rather than seizing the interest. How strong that is depends heavily on the state, and it is one of the least portable assumptions in this whole level." },
    ],
    quiz: [
      { question: 'What is the point of holding IP in a separate entity from operations?',
        options: ['It reduces the tax rate on licence income', 'A claim against the operating business cannot reach the IP', 'It is required in order to register a trademark'],
        answerIndex: 1,
        explain: 'Containment. If the operating company is sued, assets held elsewhere and properly licensed are outside that claim \u2014 provided the licence is real and documented rather than a label on a diagram.' },
      { question: 'How much should you rely on charging order protection?',
        options: ['It is uniform federal protection', 'It varies enormously by state and needs checking where you are', 'It applies only to single-member LLCs'],
        answerIndex: 1,
        explain: 'This is state statute, not federal, and the strength differs sharply between states. Assuming the protection you read about in one state applies in yours is a common and costly error.' },
    ],
  },

  L4M5: {
    summary: [
      { title: 'Revocable versus irrevocable',
        body: "A revocable trust avoids probate and you keep control \u2014 which also means the assets are still effectively yours for creditor and estate purposes. An irrevocable trust gives up that control, and the protection is what you get in exchange." },
      { title: 'Gifting non-voting interests',
        body: "Transferring non-voting interests moves economic value to the next generation while you keep control of the business. Annual exclusion limits govern how much can move without eating into lifetime exemption (reviewed 2026)." },
      { title: 'A buy-sell needs funding',
        body: "An agreement saying what happens when an owner dies is only half of it. Key-person insurance funds the purchase so heirs get liquidity and the surviving owners get the shares \u2014 an unfunded buy-sell is a promise nobody can keep." },
    ],
    quiz: [
      { question: 'What do you give up to get the protection an irrevocable trust offers?',
        options: ['Nothing \u2014 it is the strictly better option', 'Control over the assets placed in it', 'The ability to avoid probate'],
        answerIndex: 1,
        explain: 'Control is exactly the trade. A revocable trust keeps control and avoids probate but leaves the assets effectively yours; irrevocability is what creates the separation, and it is difficult to undo.' },
      { question: 'Why does a buy-sell agreement usually need insurance behind it?',
        options: ['Insurers require it before writing a policy', 'It provides the cash to actually execute the purchase', 'It reduces the valuation of the shares'],
        answerIndex: 1,
        explain: 'The agreement establishes what should happen; the funding establishes that it can. Without the liquidity, surviving owners may be contractually obliged to buy shares they cannot afford.' },
    ],
  },

  // ── S2 · Product Engineering & MVP ───────────────────────────────
  S2M1: {
    summary: [
      { title: 'One workflow, done well',
        body: "Minimal viable scope is not a worse version of everything. It is one complete workflow that genuinely works, end to end. Ten half-finished features teach you nothing because nobody can get through any of them." },
      { title: 'Won\u2019t is the important column',
        body: "MoSCoW sorts work into Must, Should, Could and Won\u2019t. Teams treat the first three as the exercise, but the value is in Won\u2019t \u2014 writing down what you are deliberately not building is what stops scope creeping back in by accident." },
      { title: 'Check feasibility before you promise',
        body: "API rate limits, platform restrictions, a dependency that does not do the thing its marketing implies. These are cheap to discover during scoping and expensive to discover in week six." },
    ],
    quiz: [
      { question: 'Which is the better MVP?',
        options: ['Eight features at 60% each', 'One core workflow that works completely', 'Every feature, behind a waitlist'],
        answerIndex: 1,
        explain: 'A user cannot complete a job with eight partial features, so you learn nothing from watching them try. One workflow that actually works produces real behaviour to observe \u2014 which is the only reason to ship early.' },
    ],
  },

  S2M2: {
    summary: [
      { title: 'Match the tool to the team',
        body: "No-code, low-code and full-code are not a quality ranking. The right choice is the one the people you actually have can move fastest in. A sophisticated stack nobody on the team knows is slower than a simple one they do." },
      { title: 'Model the data first',
        body: "Schema decisions are the hardest to reverse. Features are rewritten routinely; a data model with the wrong relationships gets migrated painfully, months later, while it is in production and holding real customer data." },
      { title: 'Security is not a later phase',
        body: "HTTPS, real authentication and row-level access control belong in the first build. Retrofitting access control onto a system that assumed everyone could see everything is close to a rewrite \u2014 and which regimes apply to you depends on what data you hold and where." },
    ],
    quiz: [
      { question: 'Which decision is hardest to reverse later?',
        options: ['Which UI framework you picked', 'The database schema and its relationships', 'Your hosting provider'],
        answerIndex: 1,
        explain: 'UI and hosting get swapped routinely. A wrong data model has to be migrated in production with live customer data, and every feature built on top of it has to be revisited \u2014 which is why it is worth slowing down for.' },
    ],
  },

  S2M3: {
    summary: [
      { title: 'Wireframe the path that matters',
        body: "Onboarding, the primary action, account management. Those three carry almost all of the real usage. Polishing a settings page before the primary action is clear is a way of feeling productive while avoiding the hard part." },
      { title: 'Decide the system once',
        body: "Components, type scale, colour, dark mode \u2014 settled up front. Deciding them per-screen is how an app ends up with six button styles and a dark mode that half the screens ignore." },
      { title: 'Five users finds most of it',
        body: "Usability testing has sharply diminishing returns. A handful of people attempting a real task surfaces the majority of serious friction, and they find it faster than any amount of internal discussion about what users will probably do." },
    ],
    quiz: [
      { question: 'Roughly how many users does it take to surface most serious usability problems?',
        options: ['Around five', 'At least fifty, for statistical validity', 'It cannot be known without analytics'],
        answerIndex: 0,
        explain: 'Usability testing is not a statistical exercise \u2014 it is observation. The same few blockers show up almost immediately, which is why a handful of sessions beats waiting for enough traffic to be significant.' },
    ],
  },

  S2M4: {
    summary: [
      { title: 'Who owns the code',
        body: "The single most important clause when you use an agency or contractor. Absent explicit assignment, the developer may own what they wrote \u2014 and that surfaces during acquisition diligence, at the worst possible moment." },
      { title: 'Environments before speed',
        body: "A repository, a staging environment and automated deploys are not bureaucracy. They are what makes shipping repeatedly safe. Deploying straight to production by hand works right up until the day it does not." },
      { title: 'Technical debt is a decision, not an accident',
        body: "Taking a shortcut to hit a date is legitimate. Taking one without writing down what you did and why is how it becomes permanent \u2014 the person who has to unpick it later will not know it was deliberate." },
    ],
    quiz: [
      { question: 'You hire an agency to build your MVP. Which contract term matters most?',
        options: ['The payment schedule', 'Explicit assignment of IP ownership to you', 'The sprint cadence'],
        answerIndex: 1,
        explain: 'Without explicit assignment the developer may retain ownership of what they wrote. It rarely causes friction day to day \u2014 it causes it during acquisition diligence, when chain of custody on the code is examined line by line.' },
    ],
  },

  S2M5: {
    summary: [
      { title: 'Define the events before you launch',
        body: "Signup, onboarding completion, the key action. Instrumented after launch, you have no baseline and cannot tell whether a change helped. The first week of data is the one you can never go back and collect." },
      { title: 'Error monitoring from day one',
        body: "Crash reporting and performance monitoring on release, not after the first outage. Most users do not report a bug \u2014 they leave, and without monitoring the only signal is a number quietly going down." },
      { title: 'A small private cohort',
        body: "A soft launch to a handful of real users finds what internal testing structurally cannot: people who do not know how it is supposed to work, on devices you do not own, with data you did not anticipate." },
    ],
    quiz: [
      { question: 'Why define analytics events before launch rather than after?',
        options: ['It is faster to implement', 'Without a baseline you cannot tell whether later changes helped', 'Analytics providers require it'],
        answerIndex: 1,
        explain: 'Improvement is measured against a starting point. Instrument afterwards and the launch period \u2014 the most informative data you will ever have \u2014 is simply gone, and you are left guessing whether things got better.' },
    ],
  },

  // ── S3 · Go-To-Market & Growth ───────────────────────────────────
  S3M1: {
    summary: [
      { title: 'The disappointment question',
        body: "\u201cHow would you feel if you could no longer use this?\u201d Around 40% answering \u2018very disappointed\u2019 is the conventional benchmark for product-market fit (reviewed 2026). It works because it measures dependence rather than approval." },
      { title: 'Read the retention curve, not the signups',
        body: "Plot the share of a cohort still active over time. A curve that flattens means a group of people genuinely kept using it. A curve that keeps sloping to zero means you have acquisition and no fit \u2014 and more marketing makes that worse, not better." },
      { title: 'Study the top 10%',
        body: "Your power users are doing something different: a particular workflow, a particular reason. That behaviour is frequently the actual product, and the rest of the feature set is scaffolding around it." },
    ],
    quiz: [
      { question: 'Signups are climbing but every cohort\u2019s retention curve trends to zero. What does that mean?',
        options: ['Product-market fit, held back by onboarding', 'No fit \u2014 you have acquisition without retention', 'Normal; all curves reach zero eventually'],
        answerIndex: 1,
        explain: 'A curve that never flattens means nobody is sticking. Spending more on acquisition against that is pouring water into a bucket with no bottom \u2014 the growth looks real in signups and disappears in actives.' },
      { question: 'What is the conventional Sean Ellis benchmark for product-market fit?',
        options: ['40% would be very disappointed to lose it', '80% satisfaction score', '25% month-over-month growth'],
        answerIndex: 0,
        explain: 'Around 40% answering \u2018very disappointed\u2019 is the usual marker (reviewed 2026). Satisfaction scores measure politeness; this measures whether losing the product would actually hurt.' },
    ],
  },

  S3M2: {
    summary: [
      { title: 'Test wide, then commit',
        body: "The bullseye approach: try many channels cheaply, find the one or two that work for your product, then go deep. Most startups do the opposite \u2014 commit early to the channel the founder is most comfortable with." },
      { title: 'Paid needs a hard cap',
        body: "Run paid acquisition as an experiment with a customer-acquisition-cost ceiling decided in advance. Without a cap, spend expands to fill the budget and the question of whether it works never gets answered." },
      { title: 'Product-led means the product sells',
        body: "Freemium, trials and self-serve upgrades work when the product demonstrates value before anyone talks to sales. If it needs explaining before it is useful, product-led growth will underperform however good the funnel is." },
    ],
    quiz: [
      { question: 'What is the discipline that makes a paid channel test meaningful?',
        options: ['A large enough budget to reach significance', 'A CAC ceiling set before you start spending', 'Running it for at least a quarter'],
        answerIndex: 1,
        explain: 'Without a ceiling agreed in advance, there is always a reason to keep spending and the experiment never concludes. The cap is what turns spend into an answer.' },
    ],
  },

  S3M3: {
    summary: [
      { title: 'Time to value is the metric',
        body: "How long before a new user gets something worth having. If the \u2018aha\u2019 is buried behind setup, most people never reach it \u2014 and they churn believing the product does not work rather than that they did not finish configuring it." },
      { title: 'Find the drop-off before optimising',
        body: "Pricing page, checkout, paywall. Measure where people actually leave before redesigning anything. Optimising a step nobody abandons is effort spent where there was no problem." },
      { title: 'An A/B test needs a hypothesis',
        body: "Decide the metric and the sample before running it. Peeking at results and stopping when the numbers look good produces conclusions that do not survive contact with the next month\u2019s data." },
    ],
    quiz: [
      { question: 'Why is stopping an A/B test as soon as it looks significant a problem?',
        options: ['It wastes remaining traffic', 'Peeking and stopping on a favourable reading manufactures false positives', 'Tests must run a minimum of 30 days'],
        answerIndex: 1,
        explain: 'Random variation means a metric will drift across a threshold at some point. Stopping the moment it does selects for noise, which is why the sample and the metric are fixed before the test starts.' },
    ],
  },

  S3M4: {
    summary: [
      { title: 'Some churn is just a failed card',
        body: "Involuntary churn \u2014 expired or declined cards \u2014 is a meaningful share of cancellations and is largely recoverable. Dunning, retry schedules and a clear notice win back customers who never intended to leave." },
      { title: 'Usage predicts cancellation',
        body: "Declining engagement shows up before the cancel click. Alerting on it lets you intervene while there is still a relationship, rather than sending a win-back email after the decision is already made." },
      { title: 'Build the invite in',
        body: "Referral works when sharing is part of using the product \u2014 inviting a collaborator, sending a result. A referral programme bolted onto a product nobody shares is a discount, not a loop." },
    ],
    quiz: [
      { question: 'A chunk of your monthly churn is expired cards. What is that called and what should it prompt?',
        options: ['Voluntary churn \u2014 improve the product', 'Involuntary churn \u2014 dunning and retry logic', 'Seasonal churn \u2014 wait it out'],
        answerIndex: 1,
        explain: 'Involuntary churn is a payments problem wearing a retention costume. Retries, card-update prompts and clear notices recover customers who never decided to leave at all.' },
    ],
  },

  S3M5: {
    summary: [
      { title: 'LTV against CAC',
        body: "Lifetime value divided by customer acquisition cost. A ratio around 3:1 or better is the conventional health marker (reviewed 2026). Below roughly 1:1 you are paying more to acquire a customer than they will ever be worth." },
      { title: 'Payback period is the cash constraint',
        body: "Even a healthy ratio can kill you if it takes three years to recover the acquisition cost. Under twelve months is the usual comfort line (reviewed 2026), because that is what keeps cash flow survivable while you grow." },
      { title: 'Blending hides the truth',
        body: "Dividing total spend by total customers mixes organic signups into paid performance and makes bad ad spend look acceptable. Paid CAC has to be measured against paid acquisitions alone or the number means nothing." },
    ],
    quiz: [
      { question: 'Your blended CAC looks healthy but most signups are organic. What is the risk?',
        options: ['None \u2014 blended is the standard measure', 'Organic is subsidising paid, hiding that ad spend is unprofitable', 'It overstates lifetime value'],
        answerIndex: 1,
        explain: 'Free customers dragged into the average make paid look cheaper than it is. Measured alone, the paid channel may be losing money on every acquisition \u2014 and scaling it makes that worse in direct proportion to spend.' },
      { question: 'LTV:CAC is 4:1 but payback takes 30 months. What is the problem?',
        options: ['There is none; the ratio is strong', 'The cash is gone long before it returns, which can be fatal while growing', 'The LTV must be miscalculated'],
        answerIndex: 1,
        explain: 'Ratio is profitability; payback is survival. A business can be genuinely profitable per customer and still run out of money, because the cash goes out today and comes back over two and a half years.' },
    ],
  },

  // ── S4 · Venture Scale & Exit ───────────────────────────────────
  S4M1: {
    summary: [
      { title: 'Net new MRR has four parts',
        body: "New plus expansion, minus churn, minus contraction. Reporting only the first two is how a company convinces itself it is growing while the base quietly erodes underneath \u2014 and investors reconstruct all four regardless." },
      { title: 'Net revenue retention above 100%',
        body: "NRR measures what happens to existing customers alone. Above 100% means expansion outweighs churn \u2014 revenue grows without a single new customer. It is the metric that most separates a good SaaS business from an average one." },
      { title: 'Burn multiple',
        body: "Net burn divided by net new ARR: how many dollars you spend to add a dollar of recurring revenue. It answers efficiency in one number, which is why it survived the shift away from growth-at-any-cost." },
    ],
    quiz: [
      { question: 'Net revenue retention is 115%. What does that mean?',
        options: ['You are winning 15% more new customers', 'Existing customers alone grow revenue 15%, before any new ones', 'Churn is 15%'],
        answerIndex: 1,
        explain: 'NRR looks only at the existing base. Above 100% means expansion is outrunning churn and contraction, so revenue would grow even if acquisition stopped entirely \u2014 which is why investors weigh it so heavily.' },
      { question: 'Which figure tells you how efficiently growth is being bought?',
        options: ['Gross revenue', 'Burn multiple \u2014 net burn \u00f7 net new ARR', 'Headcount growth'],
        answerIndex: 1,
        explain: 'It reduces efficiency to one ratio: dollars spent per dollar of new recurring revenue. Two companies can grow identically while one spends three times as much to do it.' },
    ],
  },

  S4M2: {
    summary: [
      { title: 'Power law changes the conversation',
        body: "A venture fund expects most investments to return little and a very small number to return the entire fund. That shapes everything \u2014 they are not evaluating whether you will succeed modestly, they are evaluating whether you could be the outlier." },
      { title: 'The data room is built before diligence',
        body: "Legal, financial, technical, customer and cap table, organised in advance. Assembling it under time pressure during diligence signals disorganisation at exactly the moment you are being judged on operational maturity." },
      { title: 'Terms outweigh valuation',
        body: "Liquidation preference, anti-dilution, protective provisions and board composition decide who controls the company and who gets paid first. A higher valuation on aggressive terms is often worse than a lower one on clean terms." },
    ],
    quiz: [
      { question: 'Why does a VC\u2019s power-law model matter when you pitch?',
        options: ['They need every investment to return capital', 'They are assessing outlier potential, not modest success', 'They prefer profitable businesses over growing ones'],
        answerIndex: 1,
        explain: 'A fund is built on the expectation that a small number of investments return everything. A solid business with a modest ceiling can be a fine company and still be a poor fit for that model \u2014 which is not a judgement on the business.' },
    ],
  },

  S4M3: {
    summary: [
      { title: 'Your first VPs change the company',
        body: "An executive hire is not a senior individual contributor. They bring a way of operating that propagates through everyone they hire, which is why the wrong one is so expensive and so slow to undo." },
      { title: 'The option pool and the cliff',
        body: "A 10\u201315% pool with four-year vesting and a one-year cliff is the conventional shape (reviewed 2026). The cliff exists so someone who leaves in month eight leaves with nothing vested \u2014 it protects the pool from short tenures." },
      { title: 'Who the pool actually dilutes',
        body: "In most priced rounds the option pool is created out of the pre-money valuation, meaning existing shareholders absorb it rather than the incoming investor. It is one of the quieter terms and one of the more consequential." },
    ],
    quiz: [
      { question: 'An option pool is expanded pre-money as part of a round. Who is diluted?',
        options: ['The incoming investor', 'Existing shareholders, including the founders', 'It is shared equally'],
        answerIndex: 1,
        explain: 'Created out of the pre-money valuation, the pool comes from the existing cap table before the new money lands. It is often negotiated as an afterthought and can move founder ownership by several percentage points.' },
      { question: 'What does a one-year cliff do?',
        options: ['Delays the whole grant by a year', 'Nothing vests before twelve months; the first year then vests at once', 'Caps vesting at one year of service'],
        answerIndex: 1,
        explain: 'Leave before the cliff and nothing has vested. Reach it and the first year vests in a block, with the remainder vesting incrementally over the rest of the schedule (reviewed 2026).' },
    ],
  },

  S4M4: {
    summary: [
      { title: 'A board is managed, not endured',
        body: "Quarterly meetings with a deck sent in advance, and investor updates between them. Boards that only hear from you when something is wrong become adversarial; boards kept informed become useful." },
      { title: 'SOC 2 is a sales gate',
        body: "Enterprise buyers frequently cannot sign without it. It is a security-controls audit and it takes months, so it belongs in the plan before the deal that depends on it rather than after \u2014 it is procurement infrastructure, not paperwork." },
      { title: 'Hiring abroad without an entity',
        body: "An employer of record hires someone in another country on your behalf, handling local tax and employment law. It is how most companies test a market before deciding whether a real subsidiary is justified." },
    ],
    quiz: [
      { question: 'When should SOC 2 be started?',
        options: ['Once an enterprise deal requires it', 'Before the deal that will depend on it, since it takes months', 'Only if you handle payment data'],
        answerIndex: 1,
        explain: 'It is an audit over a period, not a form. Starting when a buyer asks means the deal waits on an observation window \u2014 which is how a signed intent quietly becomes a lost quarter.' },
    ],
  },

  S4M5: {
    summary: [
      { title: 'Map acquirers early',
        body: "The companies most likely to buy you are usually visible years ahead \u2014 partners, competitors, adjacent platforms. Relationships built before you need them produce better outcomes than a banker-run process from cold." },
      { title: 'Asset versus stock purchase',
        body: "In an asset purchase the buyer takes selected assets and leaves most liabilities behind. In a stock purchase they take the company whole, liabilities included. Buyers usually prefer the first, sellers the second, and the tax treatment differs \u2014 it is one of the most consequential lines in an LOI." },
      { title: 'Earnouts are the part to read closely',
        body: "A portion of the price contingent on hitting post-close targets. The risk is that you no longer control the business you are being measured on \u2014 so the targets, and who decides whether they were met, matter more than the headline number." },
    ],
    quiz: [
      { question: 'A buyer proposes an asset purchase rather than a stock purchase. What is the usual implication for the seller?',
        options: ['It is simpler and generally better for the seller', 'Selected assets transfer while liabilities and tax treatment differ, often less favourably', 'The two are legally equivalent'],
        answerIndex: 1,
        explain: 'Buyers prefer asset purchases because they can leave unknown liabilities behind. The tax treatment and what actually transfers differ significantly, which is why this clause is negotiated early rather than left to the lawyers at the end.' },
      { question: 'What is the main risk in an earnout?',
        options: ['It always pays out less than agreed', 'You are measured on a business you no longer control', 'It delays closing indefinitely'],
        answerIndex: 1,
        explain: 'Post-close, the acquirer sets budgets, priorities and often the accounting. Targets that were achievable under your control can become unreachable under theirs, which is why definitions and measurement rights are the substance of the clause.' },
    ],
  },

  // ── W1 · Workplace Compliance & Culture ──────────────────────────
  // M1 and M2 also have long-form modules. Employment law is state-variable
  // and the federal positions below are floors, not ceilings \u2014 said explicitly
  // in the copy rather than left for the reader to assume.
  W1M1: {
    summary: [
      { title: 'A handbook sets expectations both ways',
        body: "It tells people what is expected and tells you what you committed to. That second half is why wording matters \u2014 a handbook that reads like a set of promises can be argued to be one." },
      { title: 'The at-will disclaimer',
        body: "Without a clear disclaimer, a handbook can be read as an implied employment contract \u2014 particularly if it describes disciplinary steps as guaranteed. The disclaimer, and an acknowledgment form each employee signs, is what keeps it a policy document." },
      { title: 'One channel is not enough',
        body: "\u2018Talk to your manager\u2019 fails precisely when the manager is the problem. A second route \u2014 another named person, or an external line \u2014 is what makes a complaints process usable in the cases that matter most." },
    ],
    quiz: [
      { question: 'Why does a handbook need an explicit at-will disclaimer?',
        options: ['It is required federally for all employers', 'Without it, the handbook can be argued to be an implied contract', 'It shortens the notice period'],
        answerIndex: 1,
        explain: 'A document that describes guaranteed disciplinary steps and ongoing entitlements starts to look like terms of employment. The disclaimer plus a signed acknowledgment is what keeps it a statement of policy.' },
      { question: 'What is the weakness of routing every complaint through the line manager?',
        options: ['It is slower than a written form', 'It fails when the manager is the subject of the complaint', 'It creates too much documentation'],
        answerIndex: 1,
        explain: 'The single most serious category of complaint is the one about the person you are told to report to. A second, independent route is what makes the process work in exactly those cases.' },
    ],
  },

  W1M2: {
    summary: [
      { title: 'Federal is the floor',
        body: "Title VII, the ADA and the ADEA set a national baseline. Several states impose more \u2014 including specific, recurring supervisor training. Compliance means the federal floor plus whatever your state adds, which is not the same everywhere (reviewed 2026)." },
      { title: 'A salary does not make someone exempt',
        body: "This is one of the most expensive misunderstandings a small employer can hold. Overtime exemption depends on the duties actually performed and the salary basis and level tests together \u2014 paying a flat salary does not by itself remove overtime obligations (reviewed 2026)." },
      { title: 'Contractor or employee is not a choice',
        body: "Classification follows the working relationship \u2014 control, integration, economic dependence \u2014 not the label on the agreement or the worker\u2019s preference. Misclassification brings back pay, back taxes and penalties." },
    ],
    quiz: [
      { question: 'You pay someone a fixed annual salary. Are they automatically exempt from overtime?',
        options: ['Yes \u2014 salaried means exempt', 'No \u2014 exemption depends on duties plus the salary basis and level tests', 'Only if they manage other people'],
        answerIndex: 1,
        explain: 'Salary alone never establishes exemption. The duties actually performed have to meet an exemption category as well as the salary tests (reviewed 2026), and getting this wrong produces back-pay liability across every affected week.' },
      { question: 'A worker signs an agreement stating they are an independent contractor. What determines their real status?',
        options: ['The signed agreement', 'The actual working relationship \u2014 control, integration, economic dependence', 'How they file their taxes'],
        answerIndex: 1,
        explain: 'The label does not control the classification. Agencies look at how the work is actually directed and how integrated the person is, which is why a contractor treated like an employee is legally an employee.' },
    ],
  },

  W1M3: {
    summary: [
      { title: 'Specific is enforceable',
        body: "\u2018Be professional\u2019 cannot be enforced because nobody can say what breached it. A code of conduct has to describe observable behaviour to be applied consistently \u2014 and consistency is the whole point of writing it down." },
      { title: 'Inconsistent discipline is itself the risk',
        body: "Two people do the same thing and only one is disciplined: that inconsistency is what turns a personnel matter into a discrimination claim. Progressive discipline works because it is documented and applied the same way each time." },
      { title: 'Confidentiality has to name what it covers',
        body: "Customer personal data, payment information, business confidential material \u2014 different categories with different obligations. A policy that says \u2018keep things confidential\u2019 without naming what and who it binds is decoration." },
    ],
    quiz: [
      { question: 'Two employees commit the same policy breach; only one is disciplined. What is the main exposure?',
        options: ['A morale problem', 'Inconsistent enforcement supporting a discrimination claim', 'Nothing, if the policy allows discretion'],
        answerIndex: 1,
        explain: 'Differential treatment for the same conduct is the pattern discrimination claims are built on. Documented, consistently applied discipline is the defence \u2014 which is why the record matters as much as the decision.' },
    ],
  },
};

export function getGuideLesson(levelId, moduleIndex) {
  return GUIDE_LESSONS[`${levelId}M${moduleIndex + 1}`] || null;
}

export function hasGuideLesson(levelId, moduleIndex) {
  return !!getGuideLesson(levelId, moduleIndex);
}

/**
 * Turn a module's short-form entry into tour steps.
 *
 * The disclaimer leads, always. This is regulated content and the walkthrough
 * is the one place a reader meets it without having scrolled past a header.
 */
export function buildGuideLessonSteps(levelId, moduleIndex, { moduleTitle, disclaimer } = {}) {
  const lesson = getGuideLesson(levelId, moduleIndex);
  if (!lesson) return null;

  const steps = [];
  if (disclaimer) {
    steps.push({
      id: null,
      title: moduleTitle || 'Before we start',
      body: disclaimer,
    });
  }
  for (const part of lesson.summary) {
    steps.push({ id: null, title: part.title, body: part.body });
  }
  for (const q of lesson.quiz || []) {
    steps.push({ id: null, title: 'Quick check', body: null, quiz: q });
  }
  return steps;
}
