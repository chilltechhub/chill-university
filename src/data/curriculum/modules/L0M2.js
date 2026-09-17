// src/data/curriculum/modules/L0M2.js
// Level 0 · Module 2 — The Consumer: Defending Your Purchasing Power
//
// Checklists and deliverables inherit from ownershipCurriculumFoundations.js
// by lesson key. Worked-example arithmetic is exact (checked by script), not
// rounded by eye — a curriculum about the cost of credit can't get the cost of
// credit wrong.

export default {
  id: 'L0M2',
  level: 'L0',
  index: 1,
  title: 'The Consumer — Defending Your Purchasing Power',
  subtitle: 'Module 2',
  objective:
    'Stop losing money quietly: to inflation, to retail interest, and to rights nobody told you that you have.',
  duration: '2–3 hours',

  intro: [
    'Everyone is a consumer, and the consumer position is where the system extracts the most with the least fuss. Not through anything dramatic — through small, continuous losses that are designed not to feel like losses. Cash that shrinks while it sits. A card balance that costs more each month than the thing you bought with it. A fee that renews every year. A reporting error on a credit file that quietly raises the rate on everything you borrow.',
    'None of these requires a business, an investment account or any special knowledge to fix. They require knowing how each one works, and then doing a few specific things once. That is why this module comes before anything about ownership: the fastest improvement most people can make to their financial life is not earning more, it is ceasing to leak what they already have.',
    'It is also, frankly, where a great deal of predatory marketing lives. So along with the mechanics, this module covers the rights federal and state law already give you — free credit reports, the right to dispute, protection from abusive debt collectors, chargebacks on cards — which most people never use.',
  ],

  lessons: [
    {
      key: 'l0_inflation',
      title: 'Inflation & The Real Return on Cash',
      objective:
        'The interest a bank shows you is the nominal rate. What matters is what\'s left after inflation — and for most checking accounts, that number is negative.',
      sections: [
        {
          heading: 'What inflation actually measures',
          body: 'Inflation is the rate at which prices rise across the economy. In the United States the headline measure is the Consumer Price Index, published monthly by the Bureau of Labor Statistics, which tracks the cost of a basket of goods and services households actually buy. The Federal Reserve targets about 2% inflation a year over time, measured slightly differently (reviewed 2026).\n\nA 2% target means the system is designed so that a dollar buys a little less every year. That is not a malfunction — mild, predictable inflation is considered healthier than falling prices. But it has a direct consequence for anyone holding cash: money that earns nothing is losing value on purpose.',
        },
        {
          heading: 'Nominal versus real',
          body: 'The rate your bank advertises is the nominal return. The real return is roughly the nominal rate minus inflation.\n\nCash at 0.01% during 3% inflation has a real return of about −3%. It is shrinking by around three cents per dollar per year in what it can buy. Cash at 4% during 3% inflation has a real return of about +1%. It is growing, slowly, in actual purchasing power.\n\nA quick way to feel the difference is the rule of 72: divide 72 by the inflation rate to estimate how many years it takes for money to lose half its purchasing power. At 3% that is about 24 years. Money left in a near-zero account through your working life loses most of what it could buy.',
        },
        {
          heading: 'Where cash can live — and what each is for',
          body: 'This is education about how each option works, not advice about what you personally should hold.\n\nHigh-yield savings accounts at insured online banks and credit unions pay variable rates that tend to move with the Federal Reserve, with the same deposit insurance as any bank. They suit an emergency fund well: safe, instantly available, earning something.\n\nMoney market accounts are similar bank products, sometimes with check-writing.\n\nTreasury bills are short-term loans to the U.S. government, bought through TreasuryDirect or a brokerage, maturing in weeks to a year. Their interest is exempt from state and local income tax (reviewed 2026), which matters in high-tax states.\n\nI Bonds pay a rate that includes an inflation adjustment, but you can\'t redeem them for the first 12 months, and cashing out before five years forfeits the last three months\' interest (reviewed 2026). They suit money you know you won\'t need soon.\n\nBroad stock market index funds have historically outpaced inflation over long periods — but they can and do fall sharply, sometimes for years. Money you may need within a few years generally doesn\'t belong there, because you could be forced to sell at a loss exactly when you need it.',
        },
        {
          heading: 'The two-bucket idea',
          body: 'The practical move is to stop treating "cash" as one thing. Money you need to cover emergencies and near-term costs should be safe and liquid, but it doesn\'t have to earn nothing. Money beyond that — genuinely idle cash with no job — is the portion inflation eats fastest, and it deserves a deliberate decision rather than a default.\n\nNobody can tell you the right split without knowing your situation, and this lesson won\'t pretend to. What it can do is make sure the default isn\'t "all of it, at zero, forever."',
        },
      ],
      keyTerms: [
        { term: 'Consumer Price Index (CPI)', definition: 'The main U.S. inflation measure, published monthly by the Bureau of Labor Statistics.' },
        { term: 'Nominal return', definition: 'The advertised interest rate, before accounting for inflation.' },
        { term: 'Real return', definition: 'Roughly the nominal return minus inflation — what your money gains in purchasing power.' },
        { term: 'Treasury bill', definition: 'Short-term U.S. government debt; interest is exempt from state and local income tax (reviewed 2026).' },
      ],
      example: {
        title: 'Worked example — $10,000 over five years',
        body: 'Assume steady 3% inflation for five years.\n\nLeft in an account paying 0.01%, $10,000 grows to about $10,005 in dollars — but it buys what roughly $8,630 buys today. It lost around $1,370 of purchasing power while appearing to grow.\n\nIn an insured account paying 4% over the same period, it grows to about $12,167 in dollars, which buys what roughly $10,495 buys today. A real gain of about $495.\n\nThe gap between the two outcomes is nearly $1,900 of real purchasing power, from the same money with the same deposit insurance. Rates will not be exactly 3% and 4% in practice; the size of the gap is the point.',
      },
      pitfalls: [
        'Reading "my balance went up" as "my money grew." In real terms it may have shrunk.',
        'Chasing the highest yield with money you might need tomorrow. Liquidity and safety come first for an emergency fund.',
        'Putting short-term money in the stock market because "it always goes up." Over short periods it frequently doesn\'t.',
        'Buying I Bonds with money you might need within a year — you can\'t redeem them for 12 months.',
      ],
      quiz: [
        {
          question: 'Your savings account pays 1% and inflation is running at 3%. What\'s happening to your money?',
          options: [
            'It\'s growing at 1% a year',
            'It\'s losing roughly 2% of its purchasing power a year',
            'It\'s safe, because the balance never goes down',
          ],
          answerIndex: 1,
          explain: 'The balance rises, but prices rise faster. Real return is roughly 1% − 3% = −2%. The number on screen going up and your money actually growing aren\'t the same thing.',
        },
        {
          question: 'You live in a state with a high income tax. What\'s one feature of Treasury bill interest worth knowing?',
          options: [
            'It\'s completely tax-free',
            'It\'s exempt from state and local income tax, though federal tax still applies',
            'It\'s taxed at a higher rate than bank interest',
          ],
          answerIndex: 1,
          explain: 'Treasury interest is federally taxable but exempt from state and local income tax (reviewed 2026). In a high-tax state, that can make a T-bill\'s after-tax return noticeably better than a bank account paying the same headline rate.',
        },
      ],
      exercise: {
        intro: 'Find out what your cash is actually earning after inflation, account by account.',
        steps: [
          { title: 'List every account holding cash', detail: 'Checking, savings, money market, app balances, cash at home you think of as savings.' },
          { title: 'Record each balance and its interest rate', detail: 'Use the APY from your account. If you can\'t find it, treat it as zero.' },
          { title: 'Look up current inflation from the source', detail: 'The Bureau of Labor Statistics publishes the latest CPI change. Note the figure and the date.' },
          { title: 'Calculate the real return on each account', detail: 'Interest rate minus inflation. Write the result next to each balance — most checking accounts will be negative.' },
          { title: 'Decide how much cash you need liquid', detail: 'Your emergency reserve from Level 1, or a rough figure of a few months\' essential costs if you haven\'t done that yet.' },
          { title: 'Identify idle cash', detail: 'Anything above that liquid amount sitting at near-zero. Note it — you\'ve found money inflation is eating, and a decision to make about it.' },
        ],
      },
    },

    {
      key: 'l0_retail_credit',
      title: 'The True Cost of Retail Credit',
      objective:
        'APR, compounding and the minimum-payment trap — why retail credit is priced to be carried, and how to use it without paying for it.',
      sections: [
        {
          heading: 'Why consumer credit costs so much',
          body: 'Retail credit — credit cards, store cards, many personal loans — is unsecured. If you don\'t pay, there is nothing for the lender to repossess. It is lent against your future wages, often to buy things that lose value immediately. The lender prices that risk into the rate, and credit card APRs commonly sit in the 20s (reviewed 2026).\n\nA business line of credit secured by a company\'s cash flow, or a mortgage secured by a house, is cheaper because the lender has something to fall back on. This is the consumer position\'s biggest financial disadvantage in one sentence: it borrows the most expensive money in the system.',
        },
        {
          heading: 'How card interest actually accrues',
          body: 'An APR of 24% sounds like 24% a year, but cards typically charge interest daily on your balance, at the APR divided by 365. Interest is added to the balance, and tomorrow\'s interest is calculated on a slightly larger number. That is compounding working against you.\n\nThe critical detail is the grace period. On most cards, if you pay your full statement balance by the due date, new purchases accrue no interest at all. Carry even part of the balance past the due date and you usually lose the grace period — interest starts on new purchases from the day you make them, until you pay in full again.',
        },
        {
          heading: 'The minimum-payment trap',
          body: 'The minimum payment is usually calculated as a small percentage of the balance plus that month\'s interest, with a small dollar floor. It is designed to keep the account in good standing, not to pay the debt off.\n\nBecause the minimum is a percentage of the balance, it shrinks as the balance shrinks. So your payment falls each month, most of it keeps going to interest, and the debt drags on for decades. Federal law requires your statement to show how long minimum payments would take to clear the balance and what they would cost in total. Most people have never read that box. It is one of the most useful pieces of paper you receive.',
        },
        {
          heading: 'Using credit without paying for it',
          body: 'Paid in full every month, a credit card is effectively a free short-term loan with fraud protection and sometimes rewards. Carried as a balance, it is one of the most expensive forms of borrowing that exists.\n\nRewards only work in the first case. A card paying 2% back on spending is worth something only if no interest is ever paid; a carried balance at a typical card APR erases a year of rewards in a month or two.\n\nIf you do carry balances, the moves in order of impact are: stop adding to them; pay more than the minimum, and hold the payment amount fixed rather than letting it shrink; call your issuer and ask for a lower rate — especially with a good payment history — which works more often than people expect; and consider whether a genuinely lower-cost option exists. Level 1, Module 3 covers payoff strategy in depth.',
        },
        {
          heading: 'Buy now, pay later and car loans',
          body: 'Buy-now-pay-later plans split a purchase into instalments, often with no interest if every payment is on time. The risk is not usually the individual plan; it\'s stacking several at once until the combined payments no longer fit, and late fees on missed instalments.\n\nAuto loans are the other big consumer borrowing category. A car begins losing value the moment you drive it away, while the loan balance falls slowly — so a long loan term can leave you owing more than the car is worth for years. That matters if the car is written off or you need to sell.',
        },
      ],
      keyTerms: [
        { term: 'APR', definition: 'Annual percentage rate — the yearly cost of borrowing, charged on cards as a daily rate.' },
        { term: 'Grace period', definition: 'The window in which paying your full statement balance means no interest on purchases. Usually lost if you carry a balance.' },
        { term: 'Minimum payment', definition: 'The smallest payment that keeps an account current — usually a shrinking percentage of the balance plus interest.' },
        { term: 'Unsecured debt', definition: 'Debt with no collateral behind it, priced higher because the lender can\'t repossess anything.' },
      ],
      example: {
        title: 'Worked example — the same $150, two different outcomes',
        body: 'A $5,000 card balance at 24% APR, with no new purchases.\n\nOption A: pay a fixed $250 every month. Paid off in 26 months. Total interest about $1,449.\n\nOption B: pay a fixed $150 every month. Paid off in 56 months. Total interest about $3,322.\n\nOption C: pay only the minimum, calculated here as that month\'s interest plus 1% of the balance, with a $25 floor. The first minimum payment is also $150 — identical to Option B. But because it shrinks as the balance falls, the debt takes about 234 months — 19 and a half years — to clear, and costs about $8,887 in interest.\n\nOptions B and C start with the exact same payment. The only difference is whether you let the payment shrink. That single habit costs $5,565 and fifteen extra years.',
      },
      pitfalls: [
        'Paying "the minimum" and assuming progress is being made. Check the minimum-payment box on your statement.',
        'Letting your payment shrink as the minimum shrinks. Fix the dollar amount instead.',
        'Carrying a balance for the rewards. Interest erases rewards almost immediately.',
        'Never asking for a lower rate. A call to the issuer is free and frequently works for customers who pay on time.',
        'Stacking several buy-now-pay-later plans until the combined payments don\'t fit.',
      ],
      quiz: [
        {
          question: 'Your minimum payment this month is $150. You pay exactly the minimum every month from now on. What happens?',
          options: [
            'You pay $150 a month until it\'s gone',
            'Your payment shrinks as the balance shrinks, so the debt can take many years and cost far more',
            'The card issuer is required to clear the debt within five years',
          ],
          answerIndex: 1,
          explain: 'Minimums are mostly a percentage of the balance, so they fall as the balance falls. On a $5,000 balance at 24%, holding $150 fixed clears it in under five years; paying the shrinking minimum takes about 19 and a half years.',
        },
        {
          question: 'You have a card with 2% cash back and you carry a $3,000 balance at 22%. How do the rewards compare to the interest?',
          options: [
            'The rewards more than cover the interest',
            'They roughly cancel out',
            'The interest is far larger — carrying a balance makes rewards pointless',
          ],
          answerIndex: 2,
          explain: 'Carrying $3,000 at 22% costs about $660 a year in interest. To earn $660 in 2% rewards you\'d need to spend $33,000 on the card. Rewards only pay if the balance is cleared in full every month.',
        },
      ],
      exercise: {
        intro: 'Put an honest monthly price tag on every consumer debt you carry, so you can see which one is costing you most.',
        steps: [
          { title: 'List every consumer debt', detail: 'Credit cards, store cards, auto loans, personal loans and buy-now-pay-later plans.' },
          { title: 'Record balance, APR and minimum payment for each', detail: 'Take these from the latest statement, not from memory.' },
          { title: 'Calculate the monthly interest cost of each', detail: 'Balance × APR ÷ 12. This is what that debt costs you just to keep it.' },
          { title: 'Read the minimum-payment box on each card statement', detail: 'Write down how many years minimum payments would take, and the total cost shown.' },
          { title: 'Rank your debts by monthly interest', detail: 'The top of this list is where extra money does the most work.' },
          { title: 'Call the issuer at the top of the list', detail: 'Ask whether they can lower your APR. Note the date, who you spoke to and the answer. A no costs nothing; a yes compounds.' },
        ],
      },
    },

    {
      key: 'l0_consumer_rights',
      title: 'Your Rights as a Consumer',
      objective:
        'Federal law gives you free credit reports, the right to dispute errors, protection from abusive collectors, and chargeback rights on cards. Most people use none of them.',
      sections: [
        {
          heading: 'Your credit report is yours to check — for free',
          body: 'The Fair Credit Reporting Act gives you the right to see what the three nationwide credit bureaus — Equifax, Experian and TransUnion — hold about you. Free reports are available weekly at AnnualCreditReport.com (reviewed 2026). That is the official site; others with similar names may try to sell you something.\n\nErrors on credit reports are common: accounts that aren\'t yours, debts reported as unpaid after they were paid, the same debt listed twice, wrong personal details. An error can push up the interest rate on everything you borrow, and you won\'t know unless you look.',
        },
        {
          heading: 'Disputing an error yourself',
          body: 'If something on a report is inaccurate, you can dispute it directly with the bureau, online or in writing, and with the company that supplied the information. The bureau generally has to investigate within 30 days (reviewed 2026) and correct or delete information it can\'t verify.\n\nYou don\'t need to pay anyone to do this. Services charging to "repair" credit can\'t legally do anything you can\'t do yourself for free, and they can\'t remove accurate negative information. Be very wary of anyone promising to.\n\nTwo more free protections are worth knowing: a credit freeze, free at each bureau, blocks new credit being opened in your name until you lift it; and you can opt out of prescreened credit offers through OptOutPrescreen.com (reviewed 2026).',
        },
        {
          heading: 'Protection from debt collectors',
          body: 'The Fair Debt Collection Practices Act governs third-party debt collectors. They can\'t harass you, threaten actions they can\'t take, call at unreasonable hours, or misrepresent what you owe. They must give you written information about the debt, and you have the right to dispute it in writing and request verification (reviewed 2026).\n\nYou can also tell a collector in writing to stop contacting you. That doesn\'t erase a valid debt, but it does stop the calls, and it moves the matter to writing — which is where your rights are easiest to enforce.',
        },
        {
          heading: 'Card protections and chargebacks',
          body: 'Credit cards carry protections debit cards do not. Under the Fair Credit Billing Act, you can dispute a billing error — a charge you didn\'t make, goods never delivered, a wrong amount — by writing to the issuer within 60 days of the statement date (reviewed 2026). For unauthorised use, your liability on a credit card is capped at $50 (reviewed 2026), and most issuers waive even that.\n\nDebit cards are covered by a different law with weaker protection: your liability for unauthorised transactions depends on how fast you report them, and money is gone from your account while a dispute is resolved (reviewed 2026). This is one of the strongest practical reasons to use a credit card — paid in full — for online purchases.',
        },
        {
          heading: 'Where to complain when it goes wrong',
          body: 'Your state attorney general\'s consumer protection office takes complaints and enforces state law. The Federal Trade Commission collects fraud and bad-business reports at ReportFraud.ftc.gov. Federal financial regulators also take complaints about banks and lenders, though agency structures and priorities have been changing (reviewed 2026) — which is exactly why the state route is worth knowing.\n\nA written complaint creates a record, and companies often resolve issues once a regulator is copied in.',
        },
      ],
      keyTerms: [
        { term: 'FCRA', definition: 'Fair Credit Reporting Act — your right to see your credit reports and dispute inaccuracies.' },
        { term: 'FDCPA', definition: 'Fair Debt Collection Practices Act — limits on how third-party debt collectors can treat you.' },
        { term: 'Fair Credit Billing Act', definition: 'Your right to dispute credit card billing errors in writing within 60 days (reviewed 2026).' },
        { term: 'Credit freeze', definition: 'A free lock that stops new credit being opened in your name until you lift it.' },
      ],
      example: {
        title: 'Worked example — a collection that wasn\'t yours to pay',
        body: 'Andre applies for an apartment and is told his credit is poor. He pulls his reports from AnnualCreditReport.com and finds a $1,200 medical collection on one of them — for a bill his insurer paid two years ago.\n\nHe gathers the insurer\'s explanation of benefits showing the claim was paid, and files a dispute with that bureau online, attaching it. He also sends a written dispute to the collection agency, asking them to verify the debt.\n\nWithin about a month the bureau reports the item deleted, because the collector couldn\'t verify it. Andre spent an evening and paid nothing. A credit repair company advertising to people in his situation would have charged a monthly fee to send essentially the same dispute.',
      },
      pitfalls: [
        'Paying a company to do what the law lets you do for free. Anyone promising to remove accurate negative information is not being honest.',
        'Using a lookalike site instead of AnnualCreditReport.com.',
        'Using a debit card for online purchases where a credit card\'s protections would be stronger.',
        'Disputing by phone only. Write it down — written disputes preserve your rights and create a record.',
        'Missing the 60-day window on a card billing dispute.',
      ],
      quiz: [
        {
          question: 'A company offers to "remove negative items" from your credit report for $99 a month. What\'s true?',
          options: [
            'They have special access that lets them delete things you can\'t',
            'Anything they can legitimately do, you can do yourself for free — and accurate negative information can\'t be removed',
            'This is the only way to fix a report',
          ],
          answerIndex: 1,
          explain: 'You can dispute errors directly with the bureaus at no cost. Inaccurate items can be removed; accurate ones generally can\'t, by anyone. Promises otherwise are a warning sign.',
        },
        {
          question: 'Someone makes an unauthorised $900 purchase with your card. Which card leaves you better protected?',
          options: [
            'A debit card — the money comes straight from the bank',
            'A credit card — your liability is capped at $50 and the money isn\'t missing from your account while it\'s resolved',
            'They\'re protected identically',
          ],
          answerIndex: 1,
          explain: 'Credit card liability for unauthorised use is capped at $50 (reviewed 2026), and issuers commonly waive it. With a debit card, protection depends on how fast you report, and the money is gone from your account during the dispute.',
        },
      ],
      exercise: {
        intro: 'Use the rights you already have. This is an evening of work that can change the interest rate on everything you borrow for years.',
        steps: [
          { title: 'Pull all three reports from AnnualCreditReport.com', detail: 'Type the address directly. Download or save each report.' },
          { title: 'Check each report line by line', detail: 'Look for accounts you don\'t recognise, wrong balances, paid debts shown as unpaid, duplicate entries and wrong personal details.' },
          { title: 'Dispute anything inaccurate', detail: 'File with the bureau reporting it, attach any proof you have, and keep a copy. Note the date so you can follow up after 30 days.' },
          { title: 'Decide on a credit freeze', detail: 'If you aren\'t planning to apply for credit soon, a free freeze at all three bureaus blocks identity thieves. You can lift it when you need to.' },
          { title: 'Opt out of prescreened offers if you want to', detail: 'OptOutPrescreen.com cuts unsolicited credit offers — and the temptation that comes with them.' },
          { title: 'Save the complaint routes', detail: 'Your state attorney general\'s consumer protection page and ReportFraud.ftc.gov, in your Vault.' },
        ],
      },
    },

    {
      key: 'l0_consumption_to_production',
      title: 'From Consumption to Production',
      objective:
        'Every dollar a consumer spends has already been taxed. The first move up the ladder is redirecting friction costs into something that produces.',
      sections: [
        {
          heading: 'The consumer\'s double friction',
          body: 'When a worker spends, the money has already been taxed as income. Then, in most states, sales tax is added at the register. That is the consumer\'s structural position: paying for things with the most-taxed money there is.\n\nA business buying the same thing for a genuine business purpose deducts it before income tax, and often doesn\'t pay sales tax on items bought for resale. That isn\'t a trick. It\'s the order of taxation from Module 1, showing up at the checkout.',
        },
        {
          heading: 'What "moving to production" really means',
          body: 'A lot of online content turns this idea into "start an LLC and write off your life." That is not what it means, and following that advice gets people audited — Module 4 and Module 5 cover exactly where the line is.\n\nWhat it actually means is shifting some of your money and time from things that only consume toward things that produce: savings that earn more than inflation, skills that raise what you can earn, and — when the time is right — real income-producing activity. A consumer who frees $200 a month and routes it somewhere that earns has moved up, whether or not they ever form a company.',
        },
        {
          heading: 'Friction costs: the easiest money you\'ll ever find',
          body: 'Friction costs are payments that buy you nothing, or much less than you think: subscriptions you don\'t use, insurance you haven\'t shopped in years, bank fees, late fees, interest on balances that could be cleared, a phone plan with far more data than you use.\n\nThey matter more than their size suggests, for two reasons. They are recurring, so one afternoon of cancelling saves money every month indefinitely. And cutting them requires no ongoing willpower — unlike trying to spend less on food or going out, which works for a few weeks and then drifts back.',
        },
        {
          heading: 'Redirect before you spend it',
          body: 'The failure mode is predictable: you cancel $120 of subscriptions, and within two months that $120 has been absorbed into ordinary spending without anyone deciding it should be. The money wasn\'t saved; it was just moved.\n\nThe fix is to redirect the exact amount on the same day. Set an automatic transfer for the amount you freed, timed to arrive after payday, into a separate account. Now the saving is real, visible, and it grows. Level 1 Module 1 builds this into a full allocation system; this is the first step of it.',
        },
      ],
      keyTerms: [
        { term: 'Friction cost', definition: 'A recurring payment that buys little or nothing — unused subscriptions, avoidable fees, interest on clearable balances.' },
        { term: 'Production', definition: 'Using money or time to generate future income or value, rather than immediate consumption.' },
        { term: 'Sales tax', definition: 'Tax added at purchase in most states — paid by consumers on top of already-taxed income.' },
        { term: 'Automatic redirect', definition: 'A scheduled transfer of freed-up money, set up at the moment it\'s freed, so it can\'t be absorbed into spending.' },
      ],
      example: {
        title: 'Worked example — an afternoon worth $2,100 a year',
        body: 'Priya goes through three months of statements and finds:\n\n• Two streaming services she hasn\'t opened in months — $26\n• A gym membership she stopped using — $40\n• An app subscription from a free trial — $10\n• Car insurance she hasn\'t compared in four years; a comparison saves $38 a month\n• A $12 monthly checking fee, which a different account type removes\n• Overdraft fees averaging $50 a month; a balance alert and a small buffer stop them\n\nTotal: $176 a month, $2,112 a year, from about three hours of work.\n\nThe same day, she sets a $176 automatic transfer into a separate high-yield savings account. A year later that money is $2,112 plus interest, not a vague sense that she "spent less." Nothing about her daily life feels different.',
      },
      pitfalls: [
        'Freeing up money and not redirecting it. Without an automatic transfer it disappears into ordinary spending within weeks.',
        'Mistaking "move to production" for "invent business expenses." That isn\'t production, it\'s tax risk.',
        'Attacking small daily spending first. Recurring friction costs usually pay more and need no ongoing willpower.',
        'Buying expensive "invest in yourself" courses on credit. Production that starts with high-interest debt is usually consumption in disguise.',
      ],
      quiz: [
        {
          question: 'You cancel $150 a month of subscriptions you don\'t use. What makes that a real saving?',
          options: [
            'Nothing else — cancelling them saves the money automatically',
            'Setting an automatic transfer of that $150 somewhere separate the same day',
            'Spending it on something more useful instead',
          ],
          answerIndex: 1,
          explain: 'Freed money that stays in your checking account gets absorbed into ordinary spending without anyone deciding it should. Redirecting the exact amount automatically is what turns a cancellation into savings you can see.',
        },
        {
          question: 'Which is the most accurate description of "shifting from consumer to producer"?',
          options: [
            'Forming an LLC so personal purchases become tax deductions',
            'Moving money and time toward things that earn or build future income — savings, skills, and real income-producing activity',
            'Buying assets on credit as quickly as possible',
          ],
          answerIndex: 1,
          explain: 'The LLC-for-deductions version gets people into trouble; personal purchases don\'t become deductible because a company exists. Real production is anything that grows future earning power, and it starts well before any business.',
        },
      ],
      exercise: {
        intro: 'Find your friction costs, cut the ones that buy you nothing, and route the savings somewhere that grows before they vanish.',
        steps: [
          { title: 'Pull three months of statements from every account and card', detail: 'Recurring charges hide in the account you look at least.' },
          { title: 'List every recurring charge', detail: 'Anything that appears more than once, plus annual renewals.' },
          { title: 'Mark each as used, underused or forgotten', detail: 'Be honest. "I might use it" usually means underused.' },
          { title: 'Cancel or renegotiate at least two', detail: 'Include at least one shopped insurance policy or a fee you can remove by switching account type.' },
          { title: 'Total the monthly amount you freed', detail: 'Write the exact figure down.' },
          { title: 'Set the automatic transfer today', detail: 'Same amount, scheduled for the day after payday, into a separate account you name after its purpose.' },
        ],
      },
    },
  ],

  wrapUp: [
    'You now know what your cash earns after inflation, what each debt costs you every month, which rights you have and have used, and how much you\'ve freed and redirected. That is the consumer position defended.',
    'Module 3 moves to the worker position — the paycheck. It covers why a raise never lowers your take-home pay (and the one situation where it can feel like it does), the parts of your pay you may not be collecting, and the protections the law gives you at work.',
  ],
};
