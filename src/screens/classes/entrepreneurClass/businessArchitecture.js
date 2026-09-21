// src/screens/classes/entrepreneurClass/businessArchitecture.js
//
// ENTREPRENEUR track — Level 2: Business Architecture & Legal Basics.
// Modules 1-3 of the Level 2 curriculum (entity choice, governance docs,
// banking and the corporate veil, business credit).
//
// Every topic's `apply` block carries a `deliverable` — that's what turns the
// checklist from a throwaway to a Vault artifact (see ApplyChallenge in
// TopicLessonPanel.js). Complete all of a track's deliverables and that
// level's gate review passes (getTrackProgress in api/personaService.js).
//
// ── Two deliberate constraints on this content ───────────────────────────────
//
// 1. It TEACHES and it CHECKLISTS. It does not generate filled-in legal
//    documents, name a "reasonable salary" figure, or file anything on the
//    user's behalf. Drafting an operating agreement or a buy-sell for someone
//    else's specific situation is where unauthorized-practice-of-law and
//    tax-practice lines sit. Every topic routes the actual execution to the
//    primary source (IRS.gov, the state SOS) or to a licensed professional.
//
// 2. Dollar thresholds and tax rules change, and a stale number here costs a
//    real person real money. Anything numeric carries the year it was
//    reviewed, and REVIEWED_ON below is the date the whole file was last
//    checked. Re-verify before each release.
//
// No `grade` field on these topics on purpose — the K-12 grade band badge
// ClassTopicScreen renders would be nonsense here, and omitting it renders
// nothing.

import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';
import { usePlus } from '../../../../context/PlusContext';
import { FREE_LESSONS_PER_LEVEL } from '../../../logic/plusContent';

export const REVIEWED_ON = '2026-09-10';

// Level id used as the Vault `track`. One per curriculum level.
const TRACK = 'L2';

const DISCLAIMER =
  'Education, not legal or tax advice. Rules vary by state and change year to year — confirm anything here with your state filing office and a licensed attorney or CPA before you act on it.';

const topics = [
  {
    key: 'entitySelection',
    title: 'Entity Structure & Liability',
    color: '#8B4FC4',
    description:
      'Sole proprietorship, LLC, S-Corp election, or C-Corp. The choice decides who is personally on the hook when something goes wrong, how profit is taxed, and whether you can ever take outside investment. ' + DISCLAIMER,
    learn: [
      {
        heading: 'Operating Under Your Own Name Has No Wall',
        body: 'A sole proprietorship is the default the moment you start doing business without forming anything. It is free and instant, and it offers zero separation: a business debt, a lawsuit, or an unpaid supplier reaches your personal bank account, your car, and potentially your home. Formal entities exist to put a legal wall between "the business owes this" and "you owe this."',
      },
      {
        heading: 'The LLC Is the Common Starting Point',
        body: 'A Limited Liability Company is registered with a state, not the federal government. Single-member or multi-member, it is by default a pass-through for tax purposes — the business itself pays no income tax, and profit or loss lands on the owners\' personal returns. The liability wall is the point; the tax treatment is mostly unchanged from a sole proprietorship at this stage.',
      },
      {
        heading: 'S-Corp Is an Election, Not an Entity',
        body: 'An LLC can elect to be taxed as an S-Corporation by filing IRS Form 2553. The reason people do it: self-employment tax runs 15.3% on net profit, and an S-Corp owner pays that only on a reasonable salary they take, not on the remaining distributions. The cost: payroll, more bookkeeping, and a salary figure you must be able to defend. Guidance commonly puts the break-even somewhere around $40,000-$50,000 of consistent net profit (reviewed 2026) — but that is a rule of thumb, not a threshold in the tax code, and the right number for you depends on your numbers. This is a conversation for a CPA.',
      },
      {
        heading: 'C-Corp Is for Raising Money',
        body: 'A C-Corporation is a separate taxpayer: the company pays corporate tax, and dividends to owners are taxed again — "double taxation." It is the right answer anyway when you need to issue stock options, bring on venture investors, or have many shareholders, because that is the structure those systems are built around. For a cash-flow business with no outside investors, it usually adds tax drag for nothing.',
      },
    ],
    practice: [
      {
        question: 'What is the main thing a sole proprietorship does NOT give you?',
        options: [
          'The ability to earn revenue',
          'Separation between business and personal liability',
          'A way to file taxes',
          'Permission to have customers',
        ],
        answerIndex: 1,
        explanation: 'A sole proprietor can do business and file taxes fine. What is missing is the liability wall — business debts and lawsuits reach personal assets.',
      },
      {
        question: 'An S-Corporation is best described as:',
        options: [
          'A type of entity you register with your state',
          'A tax election an eligible entity can make with the IRS',
          'A kind of business bank account',
          'A federal business license',
        ],
        answerIndex: 1,
        explanation: 'You form an LLC (or corporation) at the state level, then elect S-Corp tax treatment with the IRS via Form 2553. It is a tax status, not a separate entity type.',
      },
      {
        question: 'Which situation most clearly points toward a C-Corporation?',
        options: [
          'A one-person landscaping business wanting liability protection',
          'A freelancer with $30k of annual profit',
          'A startup planning to raise venture capital and issue employee stock options',
          'A rental property held for cash flow',
        ],
        answerIndex: 2,
        explanation: 'Venture investors and stock option plans are built around C-Corp stock. The other three generally take on double taxation for no benefit.',
      },
      {
        question: 'What does "pass-through taxation" mean for a default LLC?',
        options: [
          'The LLC pays tax, then owners pay again on distributions',
          'The LLC pays no income tax itself; profit and loss land on the owners\' returns',
          'No tax is owed on the profit at all',
          'Tax is deferred until the business is sold',
        ],
        answerIndex: 1,
        explanation: 'Pass-through means the entity is not a separate income taxpayer — the profit or loss flows to the owners and is taxed on their personal returns. It is not tax-free.',
      },
    ],
    apply: {
      prompt:
        'Build your own entity decision record. Write down, in your own words: what your business actually does, who could plausibly sue you or bill you, whether you expect outside investors, and your rough expected annual profit. Then note which structure you are leaning toward and the one question you want to ask a CPA or attorney before filing. You are producing a decision record, not a filing.',
      checklist: [
        'Described what the business does and who its customers are',
        'Listed the realistic liability risks (who could sue or bill you)',
        'Decided whether outside investors are part of the plan',
        'Estimated expected annual net profit',
        'Noted which structure you are leaning toward, and why',
        'Wrote down the specific question to ask a CPA or attorney',
      ],
      deliverable: { track: TRACK, title: 'Entity Selection Decision Matrix' },
    },
  },

  {
    key: 'einSetup',
    title: 'Federal Tax ID (EIN)',
    color: '#4A90E2',
    description:
      'An Employer Identification Number is the business equivalent of a Social Security number, and it is what a bank asks for first. It is free, it comes straight from the IRS, and a lot of websites charge for it anyway.',
    learn: [
      {
        heading: 'It Is Free, Directly From the IRS',
        body: 'EINs are issued at no cost through the IRS website, and the online application typically issues the number immediately during business hours. A search for "get an EIN" surfaces many third-party services that charge $50-$300 to submit the same free form on your behalf. They are not scams exactly, but they are selling you a form you can file yourself in about fifteen minutes. Go to irs.gov directly and check the URL before entering anything.',
      },
      {
        heading: 'What You Need Before You Start',
        body: 'The application asks for your legal business name exactly as registered with the state, your entity type, the responsible party\'s name and taxpayer ID, the business address, and what the business does. Get your formation paperwork back from the state first — if the name on the EIN does not match the name on the formation documents, you will spend more time fixing it than filing it took.',
      },
      {
        heading: 'Keep the Confirmation Letter Forever',
        body: 'The IRS issues a CP 575 confirmation notice. Banks, payment processors, lenders, and payroll providers all ask for it, sometimes years later, and getting a replacement is slow. Save the PDF in at least two places the moment you receive it. This is the first document that belongs in your permanent business records.',
      },
      {
        heading: 'Also Check Your Current Reporting Obligations',
        body: 'Separate from the EIN, US entities have at times been subject to beneficial-ownership reporting with FinCEN under the Corporate Transparency Act, and those requirements have changed materially more than once. Do not rely on this lesson, or any course, for whether you currently owe a report — check FinCEN\'s own site or ask your attorney, because the answer as of today may differ from the answer when this was written.',
      },
    ],
    practice: [
      {
        question: 'How much does the IRS charge to issue an EIN?',
        options: ['$0', '$49', '$99', 'It depends on the state'],
        answerIndex: 0,
        explanation: 'Nothing. The IRS issues EINs free. Any fee you pay is to a third party for filing a form you can submit yourself.',
      },
      {
        question: 'Why should you complete your state formation filing before applying for an EIN?',
        options: [
          'The IRS rejects applications filed on the same day',
          'So the legal name on the EIN matches the name registered with the state',
          'EINs expire after 30 days',
          'The state issues the EIN, not the IRS',
        ],
        answerIndex: 1,
        explanation: 'A mismatch between your EIN record and your formation documents causes problems at banks and with payroll later, and it is tedious to correct.',
      },
      {
        question: 'What is the CP 575 notice?',
        options: [
          'A tax bill',
          'The IRS letter confirming your EIN',
          'A state business license',
          'An annual report form',
        ],
        answerIndex: 1,
        explanation: 'CP 575 is the IRS confirmation of your EIN assignment. Banks and lenders ask for it; replacements are slow, so save it immediately.',
      },
    ],
    apply: {
      prompt:
        'Apply for your EIN directly at irs.gov — confirm the URL before entering any information — then store the confirmation where you will still be able to find it in five years. Record here that it is done and where the document lives.',
      checklist: [
        'Confirmed state formation is complete and noted the exact legal name',
        'Applied at irs.gov directly (no third-party filing service)',
        'Received the EIN',
        'Saved the CP 575 confirmation in two separate places',
        'Noted where those copies live',
        'Checked current FinCEN beneficial-ownership requirements, or asked an attorney',
      ],
      deliverable: { track: TRACK, title: 'EIN & Federal Registration Record' },
    },
  },

  {
    key: 'operatingAgreement',
    title: 'Operating Agreement Essentials',
    color: '#3AC860',
    description:
      'The document that says who owns what, who decides what, and what happens when someone wants out. Most states do not require one. Skipping it is how business partnerships end in court. ' + DISCLAIMER,
    learn: [
      {
        heading: 'What It Actually Governs',
        body: 'An operating agreement sets out ownership percentages, how much each member contributed, how profits and losses are split, who can sign contracts or spend money, how decisions get voted on, and what happens when a member dies, leaves, or wants to sell. Without one, your state\'s default LLC statute decides all of that for you, and the defaults are rarely what the owners would have chosen.',
      },
      {
        heading: 'Single-Member LLCs Still Need One',
        body: 'It feels pointless to write an agreement with yourself, and it is exactly the document a court looks for when deciding whether your LLC is a real separate entity or just you with extra paperwork. It also gets requested by banks, and by any buyer or lender doing diligence later. It is short for a single-member LLC. Write it anyway.',
      },
      {
        heading: 'The Exit Terms Are the Whole Point',
        body: 'Buy-sell provisions — what triggers a buyout, how the business gets valued, and how the payout is funded — are the clauses nobody wants to negotiate while everyone is excited, and the only ones that matter once something goes wrong. Agreeing on a valuation method while you are still friendly is far easier than arguing about a number when one of you wants out.',
      },
      {
        heading: 'Templates Are a Starting Point, Not a Filing',
        body: 'A template shows you which questions exist. It cannot know your state\'s statute, your ownership split, or your partner\'s situation. Use one to draft your answers and identify what you need to decide — then have an attorney review it before anyone signs. The cost of that review is small next to the cost of a partnership dispute.',
      },
    ],
    practice: [
      {
        question: 'If an LLC has no operating agreement, what governs how it works?',
        options: [
          'Nothing — the members decide case by case',
          'Federal LLC law',
          'The default provisions in that state\'s LLC statute',
          'The IRS',
        ],
        answerIndex: 2,
        explanation: 'State default rules fill the gap, and they may split profits or allocate control in ways the owners never intended.',
      },
      {
        question: 'Why does a single-member LLC still benefit from an operating agreement?',
        options: [
          'It is federally required',
          'It helps show the LLC is a genuinely separate entity, and banks and buyers ask for it',
          'It reduces the tax rate',
          'It replaces the need to register with the state',
        ],
        answerIndex: 1,
        explanation: 'It is evidence of separateness if liability protection is ever challenged, and it gets requested in banking and diligence.',
      },
      {
        question: 'Which clause matters most when a co-owner wants to leave?',
        options: [
          'The business purpose statement',
          'The registered agent designation',
          'The buy-sell provisions and valuation method',
          'The fiscal year end',
        ],
        answerIndex: 2,
        explanation: 'Buy-sell terms define the trigger, the valuation method, and how the buyout is funded — the things that are nearly impossible to agree on after a relationship sours.',
      },
    ],
    apply: {
      prompt:
        'Draft your answers to the questions an operating agreement has to settle — ownership split, capital contributed, how profits are distributed, who can commit the business to spending, how disputes get resolved, and what happens if an owner exits. Write your positions down, then book the attorney review. You are preparing to have a document drafted, not drafting the final one.',
      checklist: [
        'Wrote down ownership percentages for every member',
        'Recorded what each member contributed (cash, equipment, work)',
        'Decided how profits and losses get distributed',
        'Defined who can sign contracts and approve spending, and at what limit',
        'Chose a dispute-resolution approach',
        'Agreed a buyout trigger and a valuation method in writing',
        'Identified an attorney to review it before signing',
      ],
      deliverable: { track: TRACK, title: 'Operating Agreement Decision Sheet' },
    },
  },

  {
    key: 'businessBanking',
    title: 'Business Banking Architecture',
    color: '#E0A830',
    description:
      'Opening the account is twenty minutes. Setting it up so your bookkeeping is not a nightmare in April, and so your tax money is not accidentally spent, is the part most people skip.',
    learn: [
      {
        heading: 'What the Bank Will Ask For',
        body: 'Expect to bring your EIN confirmation, your state formation documents, your operating agreement, and personal identification for anyone with significant ownership or signing authority. Some banks also check ChexSystems, a banking history database — past overdrafts or closed accounts can affect approval, which is one reason personal banking history matters before you get here.',
      },
      {
        heading: 'Three Accounts, Not One',
        body: 'A common structure is an operating checking account for day-to-day money in and out, a savings account for reserves, and a separate tax holdback account. The tax account is the one that changes lives: if you move a set percentage of every payment received into it immediately, quarterly tax time stops being a crisis. Money you never see in your operating balance is money you do not accidentally spend.',
      },
      {
        heading: 'Credit Unions vs. Commercial Banks',
        body: 'Large commercial banks offer better integrations, more branches, and faster access to bigger lending products. Regional banks and credit unions often offer lower fees, real humans who know your account, and more flexibility on small business lending where a national underwriting model would just decline you. Many owners end up with both, for exactly those reasons.',
      },
      {
        heading: 'Connect It to Bookkeeping on Day One',
        body: 'Linking the account to bookkeeping software from the first transaction means your records build themselves. Doing it a year later means reconstructing a year of transactions from memory and statements, which is both miserable and the thing that produces the unclear books lenders reject.',
      },
    ],
    practice: [
      {
        question: 'What does a separate tax holdback account accomplish?',
        options: [
          'It lowers the amount of tax owed',
          'It keeps money set aside for taxes out of spendable operating balance',
          'It is required by the IRS',
          'It eliminates quarterly filings',
        ],
        answerIndex: 1,
        explanation: 'It changes nothing about what you owe — it changes whether the money is still there when it is due.',
      },
      {
        question: 'Which document is a bank LEAST likely to ask for when opening a business account?',
        options: [
          'EIN confirmation letter',
          'State formation documents',
          'Your high school transcript',
          'Photo ID for owners with signing authority',
        ],
        answerIndex: 2,
        explanation: 'Banks verify the entity and the people authorized to act for it. Education records are irrelevant.',
      },
      {
        question: 'Why connect the business account to bookkeeping software immediately?',
        options: [
          'It is legally required',
          'So records build automatically instead of being reconstructed later',
          'It increases your credit limit',
          'It replaces the need for a CPA',
        ],
        answerIndex: 1,
        explanation: 'Automatic capture from transaction one is the difference between clean books and a year-end reconstruction project.',
      },
    ],
    apply: {
      prompt:
        'Open your business accounts and set the structure up properly: operating, reserve, and a tax holdback with a standing percentage you move on every payment received. Then connect the operating account to your bookkeeping.',
      checklist: [
        'Gathered EIN letter, formation documents, operating agreement, and ID',
        'Opened a business operating checking account',
        'Opened a reserve or savings account',
        'Opened a tax holdback account and chose a holdback percentage',
        'Connected the operating account to bookkeeping software',
        'Recorded which institution holds each account',
      ],
      deliverable: { track: TRACK, title: 'Business Banking Setup Record' },
    },
  },

  {
    key: 'corporateVeil',
    title: 'Protecting the Corporate Veil',
    color: '#E05858',
    description:
      'Forming an LLC creates liability protection. Behaving as though it does not exist destroys it. Courts can disregard the entity and reach your personal assets — and the usual cause is bookkeeping, not fraud. ' + DISCLAIMER,
    learn: [
      {
        heading: 'What "Piercing the Veil" Means',
        body: 'If a court finds the entity was never genuinely separate from its owner, it can set the liability shield aside and hold the owner personally responsible for business obligations. The business kept its registration the whole time. The protection still failed, because protection comes from how you operate, not from the certificate.',
      },
      {
        heading: 'Commingling Is the Most Common Cause',
        body: 'Paying a personal bill from the business account. Depositing a business check into personal checking. Using the business card for groceries because it was in your hand. Each instance is small; the pattern is evidence that there is no real separation. If you need money out of the business, take a documented owner\'s draw or salary, then spend it from your personal account.',
      },
      {
        heading: 'The Other Three Causes',
        body: 'Undercapitalization — never putting enough money in for the business to plausibly meet its obligations. Ignoring formalities — no operating agreement, no records of significant decisions, no documentation of who approved what. Misrepresentation — letting customers or suppliers believe they are dealing with you personally rather than the company. Each one weakens the same argument.',
      },
      {
        heading: 'Document Money Moving In, Too',
        body: 'When you put personal money into the business, record whether it is a loan to the company (with terms) or a capital contribution (buying more equity). Left undocumented, it can be recharacterized later — potentially as taxable revenue — and it muddies exactly the separateness you are trying to evidence.',
      },
    ],
    practice: [
      {
        question: 'What is the most common behavior that undermines LLC liability protection?',
        options: [
          'Filing taxes late',
          'Commingling business and personal funds',
          'Having only one member',
          'Operating in more than one city',
        ],
        answerIndex: 1,
        explanation: 'Mixing the money is the most frequently cited evidence that no real separation exists between owner and entity.',
      },
      {
        question: 'You need $500 from your business for a personal expense. The cleanest approach is:',
        options: [
          'Pay the expense directly from the business account',
          'Use the business debit card and note it later',
          'Take a documented owner\'s draw to your personal account, then pay from there',
          'Ask a customer to pay you personally',
        ],
        answerIndex: 2,
        explanation: 'A documented draw keeps the separation intact and creates the paper trail. Paying personal costs directly from business funds is textbook commingling.',
      },
      {
        question: 'Why document personal money you put INTO the business?',
        options: [
          'To claim it twice as a deduction',
          'So it is clearly a loan or a capital contribution, not unrecorded income',
          'Because banks require it monthly',
          'It is not necessary',
        ],
        answerIndex: 1,
        explanation: 'Undocumented injections can be recharacterized — possibly as taxable revenue — and weaken the separateness record.',
      },
      {
        question: 'Which of these is NOT a typical veil-piercing factor?',
        options: [
          'Undercapitalization',
          'Ignoring corporate formalities and record-keeping',
          'Letting customers think they contract with you personally',
          'Having a business in a competitive industry',
        ],
        answerIndex: 3,
        explanation: 'Market competitiveness is irrelevant. The factors all concern whether the entity was treated as genuinely separate.',
      },
    ],
    apply: {
      prompt:
        'Run a commingling audit on the last 90 days. Go through every business-account transaction and flag anything personal, and every personal-account transaction that was really a business cost. Write down what you find and the rule you will follow going forward. Then repeat this monthly — the value is in it being a habit, not a one-off.',
      checklist: [
        'Reviewed 90 days of business account activity line by line',
        'Flagged every personal expense paid from business funds',
        'Flagged every business expense paid from personal funds',
        'Recorded how each flagged item will be corrected or reclassified',
        'Documented any owner contributions as a loan or capital contribution',
        'Wrote down the going-forward rule for taking money out',
        'Set a recurring monthly reminder to repeat this audit',
      ],
      deliverable: { track: TRACK, title: 'Corporate Veil Audit Log' },
    },
  },

  {
    key: 'businessCredit',
    title: 'Building a Business Credit Profile',
    color: '#5A9AE0',
    description:
      'A credit file in the business name, separate from yours. It takes months of deliberate activity to build, which is why it has to start long before you need it.',
    learn: [
      {
        heading: 'Business Credit Is a Separate System',
        body: 'Dun & Bradstreet, Experian Business, and Equifax Business maintain files on companies, distinct from consumer credit bureaus. A D-U-N-S number from Dun & Bradstreet is free to request and is what most business credit activity reports against. Your personal credit still matters — most small business lending asks for a personal guarantee — but a real business file is what eventually lets the company borrow on its own standing.',
      },
      {
        heading: 'Net-30 Vendor Accounts Are the On-Ramp',
        body: 'A business file needs reported payment history, and a new company has none. Net-30 trade accounts — suppliers who invoice you and give you thirty days to pay — are the usual starting point because several of them report to business bureaus. Order things the business genuinely needs, pay early rather than merely on time, and you build a history from real operating activity instead of manufactured activity.',
      },
      {
        heading: 'Consistency of Your Business Identity Matters',
        body: 'Bureaus match records on name, address, and phone. "Chill Tech LLC" at one address and "Chill Tech, L.L.C." at another can become two thin files rather than one solid one. Write your exact legal name, address, and phone number down once and use that form everywhere — every application, every vendor, every listing.',
      },
      {
        heading: 'Be Skeptical of Anyone Selling Shortcuts',
        body: 'Business credit is an area thick with services promising large funding amounts fast, often charging substantial fees for introductions to the same free vendor programs. There is no legitimate way to build a months-long payment history in two weeks. If a pitch involves misstating revenue, using someone else\'s credit profile, or paying thousands for "guaranteed approvals," the downside lands on you, not on them.',
      },
    ],
    practice: [
      {
        question: 'What is a D-U-N-S number?',
        options: [
          'A federal tax ID',
          'A free business identifier from Dun & Bradstreet used in business credit reporting',
          'A state license number',
          'A type of business loan',
        ],
        answerIndex: 1,
        explanation: 'It is Dun & Bradstreet\'s identifier for a business, free to request, and the anchor for much business credit reporting. Distinct from an EIN.',
      },
      {
        question: 'Why do Net-30 vendor accounts help a new business credit file?',
        options: [
          'They are interest-free loans',
          'They generate reported payment history from real purchases',
          'They replace the need for a business bank account',
          'They raise your personal credit score',
        ],
        answerIndex: 1,
        explanation: 'A file needs reported history. Trade accounts that report to business bureaus create it out of purchases the business was making anyway.',
      },
      {
        question: 'Why use exactly the same legal name, address, and phone everywhere?',
        options: [
          'It is legally mandated',
          'Bureaus match on those fields — variations can fragment one file into several thin ones',
          'It lowers vendor prices',
          'It speeds up EIN issuance',
        ],
        answerIndex: 1,
        explanation: 'Inconsistent identity data splits your history across partial records instead of building one strong file.',
      },
      {
        question: 'A service offers "$150k in business credit, guaranteed, in 14 days" for a $5,000 fee. The best read is:',
        options: [
          'A good deal worth taking',
          'Normal industry pricing',
          'A warning sign — real payment history cannot be built in two weeks, and the risk lands on you',
          'Required for building business credit',
        ],
        answerIndex: 2,
        explanation: 'Speed and guarantees are the tell. Building a file takes months of reported activity, and any misstatement on an application is the owner\'s liability.',
      },
    ],
    apply: {
      prompt:
        'Set up the foundations of a business credit profile: lock down one consistent business identity, request your D-U-N-S number, and open two or three Net-30 accounts with suppliers you actually buy from. Then record the due dates so you can pay early.',
      checklist: [
        'Wrote down the exact legal name, address, and phone to use everywhere',
        'Requested a D-U-N-S number from Dun & Bradstreet directly',
        'Identified two or three Net-30 vendors the business genuinely buys from',
        'Confirmed which of those vendors report to business credit bureaus',
        'Opened at least one Net-30 account',
        'Recorded payment due dates with reminders set to pay early',
      ],
      deliverable: { track: TRACK, title: 'Business Credit Profile Tracker' },
    },
  },
];

// Total deliverables in this level — what getTrackProgress() compares against
// for the Level 2 gate review.
export const L2_DELIVERABLE_COUNT = topics.filter(t => t.apply?.deliverable).length;

export default function BusinessArchitecture() {
  // Plus: the level's first lesson is free, the rest open the paywall.
  const { contentLocked } = usePlus();
  return (
    <ClassTopicScreen
      lockAfter={contentLocked ? FREE_LESSONS_PER_LEVEL : null}
      title="Level 2: Business Architecture"
      classKey="BusinessArchitecture"
      fallbackTopics={topics}
    />
  );
}
