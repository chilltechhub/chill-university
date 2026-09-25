// src/data/curriculum/modules/L0M1.js
// Level 0 · Module 1 — The System Map
//
// Checklists and deliverables are inherited from the structural level
// (ownershipCurriculumFoundations.js) by lesson key; this file supplies depth.
// Real-world rates and rules carry "(reviewed 2026)"; illustrative arithmetic
// does not — see the regulated-content rule in guideLessons.js.

export default {
  id: 'L0M1',
  level: 'L0',
  index: 0,
  title: 'The System Map',
  subtitle: 'Module 1',
  objective:
    'Understand the two layers every dollar moves through — government and banking — and the three roles you play inside them.',
  duration: '2 hours',

  intro: [
    'Most people experience money as a series of unrelated events. A paycheck arrives smaller than expected. A credit card rate goes up for no reason anyone explains. A friend who runs a small business seems to pay less tax on more income. A bank offers 0.01% on savings and 24% on a loan. None of it seems connected, so none of it seems changeable.',
    'It is connected. Every dollar in the economy moves through two layers of infrastructure. Government writes the rules — what gets taxed, when, at what rate, what is protected and what is punished. Banking and the Federal Reserve set the price of money — what it costs to borrow, what saving earns, how much credit is available at all. Those two layers then treat people very differently depending on which of three positions they are acting from: consumer, worker, or owner.',
    'This module draws that map. It is the most conceptual module in the curriculum, and it is here first on purpose. Once you can see why the rules are shaped the way they are, the rest of this level stops being a list of tips and becomes a set of moves you can choose between — and you can recognise bad advice when it contradicts how the system actually works.',
  ],

  lessons: [
    {
      key: 'l0_three_roles',
      title: 'The Three Roles You Play',
      objective:
        'Consumer, worker and owner are not three kinds of people — they are three positions, taxed and financed in a different order.',
      sections: [
        {
          heading: 'Positions, not personalities',
          body: 'It is tempting to think of "business owners" as a different class of person. They are not. The same human is a consumer when they buy groceries, a worker when they clock in, and an owner the moment they sell something they produced or hold an asset that earns. Nearly everyone is a consumer. Most adults are workers. Far fewer are owners in any meaningful way — and that gap, more than income, explains most of the difference in how people experience the tax code and the banking system.\n\nThe useful question is never "am I a business owner?" It is: what share of my economic life happens in each position, and is that share moving?',
        },
        {
          heading: 'The consumer: taxed last, financed worst',
          body: 'A consumer spends money that has already been taxed as income, and often pays tax again at the register as sales tax. When a consumer borrows, they borrow against their future wages to buy things that usually lose value — a car, a phone, a holiday — and the bank prices that risk accordingly.\n\nThe consumer is the end of the line. Every business passes its costs and its own taxes forward into prices, and the consumer is the one who pays them and cannot pass them on to anyone.',
        },
        {
          heading: 'The worker: taxed at the source',
          body: 'A worker sells time. Tax is withheld before the money arrives, and almost nothing the worker spends to earn that income — the commute, the phone, the clothes, the laptop they use to get better at their job — reduces the tax. The order is: earn, then tax, then spend what is left.\n\nIn exchange the worker gets the most protection of any role: minimum wage and overtime law, safety rules, unemployment insurance, anti-discrimination law, employer-paid half of payroll tax. That trade — high tax friction for high protection — is the defining feature of the position, and it is a genuinely good trade for a lot of people.',
        },
        {
          heading: 'The owner: taxed after expenses',
          body: 'An owner earns, then pays the legitimate costs of producing that income, then pays tax on what remains. Rent for a workspace, equipment, software, mileage driven for the business, the wages of anyone they employ — all of it comes out before tax is calculated.\n\nOwners also get access to a different kind of credit: lending based on what a business or asset earns, not on how many hours a person can work. And they carry risk nobody else carries. No minimum wage, no unemployment insurance, no one matching payroll tax. If the business loses money, the owner does.\n\nThe tax code and the credit system reward this position because governments want what owners do — employment, housing, investment, new products. That is policy, and seeing it as policy is the first step to using it deliberately rather than resenting it.',
        },
      ],
      keyTerms: [
        { term: 'Consumer', definition: 'Anyone spending already-taxed money on goods and services for personal use.' },
        { term: 'Worker', definition: 'Anyone selling their time and labour for wages, taxed before they are paid.' },
        { term: 'Owner', definition: 'Anyone earning from something they own — a business, an asset, intellectual property — taxed after legitimate expenses.' },
        { term: 'Order of taxation', definition: 'Whether tax is taken before or after the costs of earning income. The single biggest structural difference between roles.' },
      ],
      example: {
        title: 'Worked example — one person, three roles, one laptop',
        body: 'Maya earns $55,000 as an employee and, separately, sells design work to her own clients on weekends.\n\nAs a consumer, she buys a $1,500 laptop for watching films. Already-taxed money, plus sales tax on top. Tax impact: none.\n\nAs a worker, she buys the same laptop because her employer expects her to work from home on her own device. Under current federal rules most employees cannot deduct that cost (reviewed 2026). Tax impact: none. She could ask her employer to reimburse it — which is a real, frequently skipped option.\n\nAs an owner, she buys the laptop and uses it for the client design business. It is an ordinary and necessary cost of that business, so it reduces the business\'s taxable profit. If she also uses it personally, only the business-use share counts.\n\nSame purchase. Three different outcomes. Nothing about Maya changed except which role the purchase served — and whether that role was real.',
      },
      pitfalls: [
        'Assuming "owner" means rich. A person with a side business earning $4,000 a year is operating in the owner position for that income.',
        'Assuming the worker position is a failure. Its protections are worth a great deal, and for many people a stable job plus deliberate use of its benefits beats a precarious business.',
        'Moving an expense between roles on paper without the role being real. Calling a personal purchase a business expense does not make it one — and this is the most common way people get in trouble with the IRS.',
        'Treating all income the same. Wages, business profit and investment income are taxed differently; knowing which you have is where planning starts.',
      ],
      quiz: [
        {
          question: 'Which statement best describes the difference between a worker and an owner?',
          options: [
            'Owners pay a lower tax rate because they earn more',
            'Owners pay costs first, then tax on what\'s left',
            'Owners skip payroll taxes that workers have to pay',
          ],
          answerIndex: 1,
          explain: 'It\'s about order, not status or income. A worker earns, is taxed, then spends. An owner earns, pays real costs of the business, then is taxed on the rest. Owners do pay payroll-type tax — as self-employment tax they pay both halves.',
        },
        {
          question: 'An employee buys a $1,500 laptop they use to answer work emails at home. Their employer requires remote work but doesn\'t reimburse equipment. On a federal return, under current rules, what happens?',
          options: [
            'It\'s deductible, since the job requires it',
            'Usually nothing; ask your employer to repay it',
            'Every state requires the employer to repay it',
          ],
          answerIndex: 1,
          explain: 'Most employees can\'t deduct unreimbursed work expenses on a federal return under current rules (reviewed 2026). A few states require employers to reimburse necessary expenses, so it depends where you work — but asking is free and often works.',
        },
      ],
      exercise: {
        intro: 'Map your own economic life to the three roles. Most people find they have more owner-type income than they realised — or none at all, which is equally useful to know.',
        steps: [
          { title: 'List every source of income from the last twelve months', detail: 'Wages, tips, gig payments, sales of things you made, rent from a spare room, interest, anything. Include small and irregular amounts.' },
          { title: 'Label each as worker or owner income', detail: 'Wages paid on a W-2 are worker income. Payments you receive for work you control, for your own clients, are owner income — even if small.' },
          { title: 'List your ten largest recurring expenses', detail: 'Housing, transport, phone, food, insurance, debt payments, subscriptions.' },
          { title: 'Mark which role each expense really serves', detail: 'Most will be consumer spending. Note any that genuinely and exclusively serve owner income — and be strict about it.' },
          { title: 'Estimate your split', detail: 'Roughly what percentage of your income comes from each role? Write the number down; you will come back to it in Module 5.' },
        ],
      },
    },

    {
      key: 'l0_money_creation',
      title: 'How Banks Actually Create Money',
      objective:
        'Banks don\'t lend out deposits sitting in a vault — lending creates new deposits. Knowing that changes how you read a bank\'s offer.',
      sections: [
        {
          heading: 'The story most people were taught',
          body: 'The traditional textbook version goes like this: you deposit $1,000, the bank keeps a fraction in reserve, and lends out the rest. That money is deposited somewhere else, a fraction is kept again, and the rest is lent again. Repeat, and your $1,000 "multiplies" into many thousands of dollars of lending. It is often summarised as banks lending out ten times what they hold.\n\nIt\'s a tidy story, and it is not how modern banking works. It matters that you know that, because a lot of confident financial content still repeats it — and if a source gets this wrong, treat the rest of what it says with care.',
        },
        {
          heading: 'What actually happens',
          body: 'When a bank approves a loan, it does not go and find someone else\'s deposit to hand over. It creates a new deposit in the borrower\'s account, and records the loan as an asset on its own books. That new deposit is new money. When the loan is repaid, that money is destroyed again. The Bank of England described this plainly in 2014, and central banks broadly agree on it.\n\nSo what limits how much banks lend? Not a reserve ratio — the Federal Reserve cut reserve requirements to zero in March 2020 and has not restored them (reviewed 2026). The real limits are capital requirements (a bank must hold its own capital against the risk of its loans), regulation, whether the bank expects to profit, and whether creditworthy people actually want to borrow.',
        },
        {
          heading: 'Why this matters to you',
          body: 'The practical point: a bank is not a warehouse doing you a favour by storing your money. It is a business whose core product is credit, and whose profit comes largely from the spread — the gap between what it pays depositors and what it charges borrowers.\n\nA checking account paying close to nothing, at a bank charging borrowers in the high teens or twenties on credit cards, is that spread made visible. Your deposit is a cheap source of funding for the bank. You are allowed to shop that relationship, and online banks and credit unions routinely pay depositors far more for the same insured safety.',
        },
        {
          heading: 'Insurance: what makes a deposit safe',
          body: 'The protection that actually matters for a depositor is deposit insurance. At an FDIC-insured bank, deposits are insured up to $250,000 per depositor, per bank, per ownership category (reviewed 2026). Credit unions have equivalent coverage through the NCUA.\n\nThat means a higher-paying online bank is exactly as safe, up to the insured limit, as the large bank on the corner — provided it is genuinely FDIC- or NCUA-insured. Check that directly on the FDIC or NCUA website, not on the bank\'s own marketing. Some apps that look like banks are not banks and hold your money through partners, where coverage works differently.',
        },
      ],
      keyTerms: [
        { term: 'Deposit creation', definition: 'The process by which a bank creates new money in a borrower\'s account when it makes a loan.' },
        { term: 'Spread', definition: 'The gap between the rate a bank pays depositors and the rate it charges borrowers.' },
        { term: 'Capital requirements', definition: 'Rules requiring banks to hold their own capital against the risk of their assets — the real constraint on lending.' },
        { term: 'FDIC / NCUA', definition: 'Federal insurers of bank and credit-union deposits, up to $250,000 per depositor, per institution, per ownership category (reviewed 2026).' },
      ],
      example: {
        title: 'Worked example — the cost of a comfortable bank',
        body: 'Jordan keeps $8,000 in a big-bank savings account at 0.01%. Over a year that earns $0.80.\n\nThe same $8,000 at an insured online bank paying 4% would earn about $320 in a year. The exact rate at any given moment will differ — what matters is the gap.\n\nThe difference is $319 a year for moving money between two equally insured institutions. Jordan also pays a $12 monthly maintenance fee on checking because the balance sometimes dips below a minimum: $144 a year.\n\nTotal cost of staying put: about $463 a year, for zero added safety. That is the spread and the fee structure working exactly as designed — and it is one of the easiest money leaks there is to close.',
      },
      pitfalls: [
        'Believing the "banks lend out ten times your deposit" story. Reserve requirements have been zero since 2020; capital rules and demand for credit are the real limits.',
        'Assuming a big bank is safer than a small insured one. Up to the insured limit, coverage is identical.',
        'Trusting "FDIC insured" in an app\'s marketing without checking. Some fintech apps are not banks, and coverage through a partner can have gaps.',
        'Staying in a low-yield account out of inertia. Loyalty is rarely rewarded; the spread is the bank\'s profit.',
      ],
      quiz: [
        {
          question: 'When a bank makes a $20,000 loan, where does the money come from?',
          options: [
            'It lends out $20,000 of other customers\' deposits from its vault',
            'It creates a new $20,000 deposit in the borrower\'s account',
            'The Federal Reserve prints it and sends it to the bank',
          ],
          answerIndex: 1,
          explain: 'Lending creates a new deposit. The bank records the loan as an asset and the new deposit as a liability. The deposit-lending-out story is the old textbook version, and it doesn\'t describe how modern banks operate.',
        },
        {
          question: 'Which is the real constraint on how much a bank can lend today?',
          options: [
            'A 10% reserve rule on every deposit',
            'Capital rules, profit, and loan demand',
            'The amount of cash sitting in its vault',
          ],
          answerIndex: 1,
          explain: 'The Federal Reserve cut reserve requirements to zero in March 2020 (reviewed 2026). Banks are constrained by the capital they must hold against risky loans, by regulators, by whether a loan is profitable, and by whether creditworthy borrowers want one.',
        },
        {
          question: 'You can move $10,000 from a big bank paying almost nothing to an FDIC-insured online bank paying much more. What happens to your protection?',
          options: [
            'It drops, since online banks carry more risk',
            'It stays the same up to the insured limit',
            'It ends, since online banks aren\'t covered',
          ],
          answerIndex: 1,
          explain: 'FDIC coverage is the same at any insured bank: $250,000 per depositor, per bank, per ownership category (reviewed 2026). Verify the institution on the FDIC\'s own site, not in an app\'s marketing.',
        },
      ],
      exercise: {
        intro: 'Audit every banking relationship you have. The goal is to see the spread you are on the wrong side of, and close the easy gaps.',
        steps: [
          { title: 'List every deposit account you hold', detail: 'Checking, savings, money market, certificates of deposit, and any app balance you treat as savings. Include the institution name.' },
          { title: 'Record the interest rate each pays you', detail: 'Log in and find the current annual percentage yield (APY). If you can\'t find it, it is almost certainly close to zero.' },
          { title: 'Record every fee each charges', detail: 'Monthly maintenance, minimum-balance, overdraft, out-of-network ATM, paper statement. Annualise them.' },
          { title: 'Verify insurance directly', detail: 'Use the FDIC\'s BankFind tool or the NCUA\'s credit union locator. If an app says "FDIC insured through partner banks," note which partner.' },
          { title: 'Compare against insured alternatives', detail: 'Look up what insured online banks and local credit unions currently pay on savings and whether they charge fees.' },
          { title: 'Flag the gaps', detail: 'For each account, write the yearly cost of staying put: lost interest plus fees. Decide whether to move money, and note what you decided.' },
        ],
      },
    },

    {
      key: 'l0_fed_rates',
      title: 'The Federal Reserve & The Price of Money',
      objective:
        'How one rate set in Washington reaches your credit card, your mortgage and a business line of credit — and why it moves in both directions.',
      sections: [
        {
          heading: 'What the Federal Reserve is for',
          body: 'The Federal Reserve is the United States\' central bank. Congress gave it a dual mandate: maximum employment and stable prices. It interprets stable prices as inflation of about 2% a year over time (reviewed 2026).\n\nIts main tool is a short-term interest rate — the federal funds rate, the rate banks charge each other for overnight loans. The Fed sets a target range for it. That single rate is the base price of money in the economy, and almost every other rate you encounter is built on top of it.',
        },
        {
          heading: 'How the rate reaches you',
          body: 'Banks conventionally set their prime rate at about three percentage points above the top of the federal funds target (reviewed 2026). Prime is the rate for their most creditworthy borrowers, and it becomes the base for a great deal of other lending.\n\nMost credit cards are variable: your APR is typically prime plus a margin set by your issuer. When the Fed raises its target, prime rises, and your card rate rises with it — usually within a billing cycle or two, without anyone asking you. Home equity lines and many business lines of credit work the same way.\n\nFixed-rate debt is different. A fixed-rate mortgage or fixed auto loan keeps its rate for the life of the loan, whatever the Fed does. That is why the fixed-versus-variable question matters so much more than people think when rates are moving.',
        },
        {
          heading: 'Why it cuts both ways',
          body: 'The Fed raises rates to cool an economy where prices are rising too fast. Borrowing becomes more expensive, so consumers buy less on credit, businesses delay expansion, and demand eases. The cost of that is felt most by people carrying variable-rate debt.\n\nIt lowers rates to support an economy that is weakening. Borrowing gets cheaper, which encourages spending and investment. The cost there is felt by savers, whose interest income falls.\n\nSo the same decision helps one role and hurts another. When rates are high, savers earn more and borrowers pay more. When rates are low, the opposite. Knowing which side of that you are on — and trying not to be caught heavily on the wrong side — is the practical skill.',
        },
        {
          heading: 'How each role feels it',
          body: 'A consumer with a card balance feels rising rates as a bigger monthly interest charge. A worker may feel them months later as slower hiring or smaller raises when businesses pull back. An owner feels them directly in the cost of a line of credit or an equipment loan — and indirectly as customers who spend less.\n\nThe owner is also the one best placed to plan around it: refinancing fixed debt when rates are low, holding more cash when they are high, and deciding whether an expansion still makes sense at the new cost of borrowing.',
        },
      ],
      keyTerms: [
        { term: 'Federal funds rate', definition: 'The overnight rate banks charge each other. The Fed sets a target range for it.' },
        { term: 'Prime rate', definition: 'Banks\' base rate for strong borrowers — conventionally about 3 points above the top of the fed funds target (reviewed 2026).' },
        { term: 'Variable rate', definition: 'A rate tied to an index such as prime, which moves when that index moves.' },
        { term: 'Dual mandate', definition: 'The Fed\'s legal goals: maximum employment and stable prices.' },
      ],
      example: {
        title: 'Worked example — a two-point rate rise',
        body: 'Sam carries three debts:\n\n• Credit card, $6,000 at a variable APR of 22%\n• Auto loan, $14,000 at a fixed 6.5%\n• Personal line of credit, $4,000 at a variable 12%\n\nMonthly interest today: the card costs about $110, the line of credit about $40. The auto loan payment doesn\'t change.\n\nNow rates rise two points and both variable debts follow. The card goes to 24% — about $120 a month in interest. The line goes to 14% — about $47.\n\nSam is now paying roughly $17 more a month, about $200 more a year, on the same balances, having done nothing. The fixed auto loan did not move at all. The lesson is not that fixed is always better — it is that variable-rate balances quietly carry the Fed\'s decisions straight into your budget, and they are the ones to clear first when rates are rising.',
      },
      pitfalls: [
        'Assuming your card rate is fixed. Most are variable and move with prime.',
        'Thinking rate changes only matter to homeowners. Credit cards and business lines respond faster than mortgages.',
        'Treating a rising-rate period as purely bad news. It raises what savings earn — if your cash is somewhere that pays.',
        'Trying to predict the Fed. Plan for rates to move in either direction instead of betting on one.',
      ],
      quiz: [
        {
          question: 'The Federal Reserve raises its target rate by half a point. You have a variable-rate credit card and a fixed-rate car loan. What happens?',
          options: [
            'Both payments rise at the next billing cycle',
            'The card rate rises; the car loan stays put',
            'Neither changes; the Fed only affects banks',
          ],
          answerIndex: 1,
          explain: 'Variable card APRs are usually prime plus a margin, and prime follows the fed funds target. A fixed loan keeps its rate for its whole life. That\'s why variable balances are the ones rate rises land on.',
        },
        {
          question: 'Who generally benefits when interest rates are high?',
          options: [
            'Everyone, since high rates signal a strong economy',
            'Savers earn more; variable-rate borrowers pay more',
            'Borrowers, since banks are more eager to lend',
          ],
          answerIndex: 1,
          explain: 'The same rate hurts one side and helps the other. High rates raise what deposits and Treasury bills pay, and raise what variable borrowing costs. Knowing which side you\'re on is the useful part.',
        },
      ],
      exercise: {
        intro: 'Find out how exposed you are to interest rate changes, so a Fed decision stops being something that happens to you.',
        steps: [
          { title: 'List every debt you carry', detail: 'Cards, auto, student loans, personal loans, lines of credit, mortgage, buy-now-pay-later plans.' },
          { title: 'Mark each as fixed or variable', detail: 'Check the account terms or the statement. If it says "variable" or references prime, it moves.' },
          { title: 'Calculate current monthly interest on each variable debt', detail: 'Balance × APR ÷ 12 gives a close estimate.' },
          { title: 'Model a 1-point and a 2-point rise', detail: 'Add one and two percentage points to each variable APR and recalculate the monthly interest.' },
          { title: 'Total the monthly impact', detail: 'This is your personal rate-rise exposure in dollars.' },
          { title: 'Note which debt is most exposed', detail: 'The largest variable balance at the highest rate is usually the first candidate to pay down or move to fixed.' },
        ],
      },
    },

    {
      key: 'l0_government_rules',
      title: 'Government as Rule-Writer',
      objective:
        'Taxes, regulation and protection are one system of incentives. Read the rules as signals about what the government is paying people to do.',
      sections: [
        {
          heading: 'The tax code is a set of instructions',
          body: 'The tax code raises revenue, but it also does something less obvious: it pays people to behave in particular ways. A deduction or credit is the government saying "we will charge you less if you do this."\n\nSave for retirement through a qualifying account and your taxable income drops. Hire people and their wages are a deductible business cost. Buy equipment and depreciation spreads — or accelerates — the deduction. Research new products and a credit may apply. Build or improve housing and further incentives exist. These are not loopholes. They are the stated policy, written down.\n\nRead that way, the code stops looking arbitrary. It looks like a list of things the government wants more of — and the people who pay least tax are, broadly, the people doing those things.',
        },
        {
          heading: 'Regulation sets the floor',
          body: 'Regulation is the other half of the rulebook: minimum standards everyone has to meet. Minimum wage and overtime law. Workplace safety. Fair lending. Truth in advertising. Licences for trades where mistakes hurt people.\n\nFor a worker or consumer, regulation is protection. For an owner, it is a cost of doing business — and also protection, because it stops competitors winning by cutting corners you refuse to cut. Staying compliant is usually cheaper than the alternative, and Module 5 treats compliance as exactly that: protection, not paperwork.',
        },
        {
          heading: 'Who protects each role',
          body: 'Consumer protection is enforced federally by the Federal Trade Commission and by financial regulators, and independently by every state attorney general, whose consumer protection office takes complaints and brings cases regardless of what is happening at the federal level.\n\nWorkers are covered federally by the Department of Labor (wages and hours) and OSHA (safety), with the Equal Employment Opportunity Commission handling discrimination — and by state labor departments, which often enforce stronger state rules.\n\nOwners deal with the IRS and state tax agencies, state business registration offices, and local licensing. They also have a support system many never use: Small Business Development Centers offer free consulting and training in every state, funded partly by the SBA.',
        },
        {
          heading: 'Rules change, so check the date',
          body: 'Tax rates, thresholds, deduction limits and agency priorities move — sometimes every year, sometimes dramatically with a single law. Every figure in this curriculum carries the year it was checked for that reason.\n\nThe habit worth building is simple: when you act on a rule, verify it at the source — IRS.gov, your state agency, the Department of Labor — and note the date you checked. A confident post that is two years old can be exactly wrong today.',
        },
      ],
      keyTerms: [
        { term: 'Deduction', definition: 'An amount subtracted from income before tax is calculated.' },
        { term: 'Credit', definition: 'An amount subtracted directly from the tax owed — worth more, dollar for dollar, than a deduction.' },
        { term: 'Regulation', definition: 'Rules setting minimum standards for how businesses operate.' },
        { term: 'State attorney general', definition: 'Each state\'s chief legal officer, with its own consumer protection authority independent of federal agencies.' },
      ],
      example: {
        title: 'Worked example — a deduction versus a credit',
        body: 'Two taxpayers each get a $1,000 tax break. Both are in a 22% bracket.\n\nThe first gets a $1,000 deduction. That removes $1,000 from taxable income, saving 22% of it: $220.\n\nThe second gets a $1,000 credit. That removes $1,000 from the tax bill itself: $1,000.\n\nSame headline number, a $780 difference. When someone tells you about a "$5,000 tax break," the first question is which one it is — and the answer changes its value by a factor of four or five.',
      },
      pitfalls: [
        'Reading the tax code as a set of tricks for the rich. It is mostly a published list of incentives, available to anyone who does the thing it rewards.',
        'Confusing a deduction with a credit. A credit is worth far more.',
        'Assuming protection disappears when a federal agency changes. State attorneys general and state labor departments enforce their own laws independently.',
        'Acting on an undated rule. Verify at the source and write down when you checked.',
      ],
      quiz: [
        {
          question: 'You\'re in the 22% bracket. Which is worth more: a $2,000 deduction or a $2,000 credit?',
          options: [
            'The deduction, because it lowers your income',
            'The credit, since it cuts tax dollar for dollar',
            'Same either way, since both are worth $2,000',
          ],
          answerIndex: 1,
          explain: 'The deduction lowers taxable income by $2,000, saving 22% of it — $440. The credit removes $2,000 from the bill. A credit is worth several times a same-sized deduction.',
        },
        {
          question: 'A company keeps charging you for a service you cancelled in writing, and ignores you. A federal agency that handles this kind of complaint is going through big changes. Where else can you go?',
          options: [
            'Nowhere — if the federal agency is weakened, you have no recourse',
            'Your state attorney general\'s consumer protection office',
            'Only a private lawyer',
          ],
          answerIndex: 1,
          explain: 'Every state attorney general enforces state consumer protection law independently of federal agencies. Filing with them — alongside disputing the charge with your card issuer — is often effective.',
        },
      ],
      exercise: {
        intro: 'Build your own directory of the rules and protectors that apply to you, so you know where to go before you need to.',
        steps: [
          { title: 'Find your state attorney general\'s consumer protection office', detail: 'Search your state\'s AG site for "consumer protection" and save the complaint form link.' },
          { title: 'Find your state labor department', detail: 'Note its wage-claim process and your state minimum wage, which may be higher than the federal one.' },
          { title: 'Find your state tax agency', detail: 'Note whether your state has income tax, and where you would register a business for sales tax if you ever needed to.' },
          { title: 'Locate your nearest Small Business Development Center', detail: 'The SBA site lists them. Consulting is free — note the contact.' },
          { title: 'Add the federal routes', detail: 'ReportFraud.ftc.gov for scams and bad business practices; the Department of Labor for federal wage issues.' },
          { title: 'Save it somewhere you will find it', detail: 'This directory is only useful if you can reach it on a bad day. Keep it in your Vault.' },
        ],
      },
    },
  ],

  wrapUp: [
    'You should now be holding a map: which roles your income and spending sit in, what your banks are really earning from you, how exposed your debt is to the Federal Reserve, and where to go when a rule is broken.',
    'The next three modules take each role in turn. Module 2 starts with the consumer, because it is where everyone begins and where most money quietly leaks — to inflation, to retail interest, and to rights people simply don\'t use.',
  ],
};
