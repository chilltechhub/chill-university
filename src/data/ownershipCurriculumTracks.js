// src/data/ownershipCurriculumTracks.js
// Levels 3B and 4 (Small Business track) and S1-S4 (Startup track).
// Same shape and same rules as ownershipCurriculum.js — see that file's header
// for why this is data rather than nine screens, and for the content duty-of-care
// note. Split across two files purely for size.

const L3B = {
  id: 'L3B',
  track: 'acquisition',
  screen: 'RealEstateAssets',
  title: 'Level 3B: Real Estate & Asset Building',
  short: 'Real Estate',
  color: '#5A9AE0',
  blurb: 'Owning the building your business operates from, and the portfolio after it.',
  outcome: 'An owner-occupied property, with rent building your equity instead of a landlord’s.',
  modules: [
    { title: 'Module 1: Commercial Real Estate Fundamentals',
      objective: 'The metrics, property classes and valuation models the market runs on.',
      lessons: [
        { key: 'l3b_asset_classes', title: 'Asset Classes & Risk Profiles', objective: 'Office, industrial, retail, multi-family (5+ units) and special purpose.', action: 'Define your buy-box: type, size, location, price range.', checklist: ['Chose target asset class', 'Defined size and location range', 'Set a price ceiling'], deliverable: 'CRE Buy-Box Specification' },
        { key: 'l3b_metrics', title: 'Core CRE Metrics', objective: 'NOI, cap rate (NOI ÷ price), cash-on-cash return and gross rent multiplier.', action: 'Run a candidate property through the metrics.', checklist: ['Calculated NOI', 'Calculated cap rate', 'Calculated cash-on-cash return'], deliverable: 'Property Performance Pro Forma' },
        { key: 'l3b_valuation', title: 'Valuation Methods', objective: 'Income capitalisation, sales comparison and replacement cost.', action: 'Value a target property using comparables and income.', checklist: ['Gathered at least 3 comparables', 'Ran the income approach', 'Reconciled to a value range'], deliverable: 'CRE Valuation Summary' },
        { key: 'l3b_occupancy', title: 'Owner-Occupied vs. Investment', objective: 'The 51% occupancy rule separates owner-occupied financing from investment financing.', action: 'Calculate the square footage your business needs.', checklist: ['Calculated business space requirement', 'Checked it clears 51% of the building', 'Noted the remainder as leasable'], deliverable: 'Owner-Occupancy Verification Form' },
      ] },
    { title: 'Module 2: Acquisition & Loan Structuring',
      objective: 'Buy with minimal cash out of pocket using federal programs.',
      lessons: [
        { key: 'l3b_504', title: 'SBA 504 for Real Estate', objective: 'The 50/40/10 split: senior lender, CDC debenture, 10% borrower equity.', action: 'Build the capital structure with bank and CDC quotes.', checklist: ['Obtained a senior lender quote', 'Contacted a CDC', 'Modelled the 50/40/10 split'], deliverable: 'SBA 504 Financing Plan' },
        { key: 'l3b_7a_re', title: 'SBA 7(a) for Real Estate', objective: 'Up to 25-year fully amortising terms for mixed projects.', action: 'Compare debt service across 15, 20 and 25-year terms.', checklist: ['Modelled all three terms', 'Compared total interest paid', 'Compared monthly payment against cash flow'], deliverable: 'Loan Amortization Comparison' },
        { key: 'l3b_conventional', title: 'Conventional & DSCR Financing', objective: '70-80% LTV, balloons, readjustments, and DSCR requirements around 1.20×-1.35× (reviewed 2026).', action: 'Stress-test the deal assuming 10% vacancy.', checklist: ['Modelled 10% vacancy', 'Recalculated DSCR under stress', 'Noted the balloon date if any'], deliverable: 'Commercial Loan Underwriting Sheet' },
        { key: 'l3b_seller', title: 'Seller Financing & Lease Options', objective: 'Master leases, contract-for-deed and carryback notes.', action: 'Draft the terms you would propose.', checklist: ['Defined the structure', 'Proposed terms and price', 'Flagged for attorney review'], deliverable: 'Lease-Option Agreement Draft' },
      ] },
    { title: 'Module 3: Underwriting & Due Diligence',
      objective: 'Find the expensive problems before closing, not after.',
      lessons: [
        { key: 'l3b_proforma', title: 'Building a Pro Forma', objective: 'Gross potential rent, vacancy loss, operating expenses and net cash flow.', action: 'Build a 10-year model for a target property.', checklist: ['Modelled gross potential rent', 'Applied a vacancy assumption', 'Itemised operating expenses', 'Projected 10 years of net cash flow'], deliverable: '10-Year CRE Financial Model' },
        { key: 'l3b_esa', title: 'Phase I Environmental Assessment', objective: 'Contamination and historical liabilities transfer with the property.', action: 'Order a Phase I ESA and work the checklist.', checklist: ['Identified an ESA vendor', 'Ordered the assessment', 'Reviewed historical site use'], deliverable: 'Phase I ESA Order & Checklist' },
        { key: 'l3b_pca', title: 'Physical Condition Assessment', objective: 'HVAC, roof, foundation, ADA compliance and deferred maintenance.', action: 'Complete a condition inspection and price the deferred maintenance.', checklist: ['Inspected major systems', 'Estimated remaining useful life for each', 'Priced deferred maintenance', 'Built a CapEx reserve figure'], deliverable: 'CapEx Reserve Schedule' },
        { key: 'l3b_zoning', title: 'Zoning, Permits & Title', objective: 'Zoning classification, conditional use, easements and title insurance.', action: 'Verify zoning and review the title commitment.', checklist: ['Confirmed zoning permits your use', 'Reviewed the title commitment', 'Identified easements or encumbrances'], deliverable: 'Zoning & Title Review Log' },
      ] },
    { title: 'Module 4: Operations & Leasing',
      objective: 'Run the property so NOI rises rather than leaks.',
      lessons: [
        { key: 'l3b_lease_types', title: 'Commercial Lease Structures', objective: 'Triple net, gross, modified gross and percentage leases.', action: 'Choose a lease type and define TI allowances.', checklist: ['Chose the lease structure', 'Defined who pays which expenses', 'Set a TI allowance'], deliverable: 'Commercial Lease Template Decisions' },
        { key: 'l3b_arms_length', title: 'Self-Leasing at Arm’s Length', objective: 'Your holding company leases to your operating company — at genuine market rent.', action: 'Establish a defensible market rent and document the lease.', checklist: ['Researched comparable market rents', 'Set rent within market range', 'Documented the lease in writing', 'Had it reviewed professionally'], deliverable: 'Inter-Company Arm’s-Length Lease' },
        { key: 'l3b_property_mgmt', title: 'Tenant Screening & Management', objective: 'Screening, rent collection, maintenance and turnover.', action: 'Write your management operating procedures.', checklist: ['Defined tenant screening criteria', 'Set the rent collection process', 'Defined a maintenance request route'], deliverable: 'Property Management Operating Manual' },
        { key: 'l3b_value_add', title: 'Value-Add Strategies', objective: 'Raising NOI through rents, sub-metering, storage, parking and layout.', action: 'Map three value-add initiatives with costs and expected NOI lift.', checklist: ['Identified 3 initiatives', 'Costed each', 'Estimated NOI impact for each'], deliverable: 'NOI Enhancement Plan' },
      ] },
    { title: 'Module 5: Portfolio Scaling & Tax',
      objective: 'Shield income and recycle equity into the next asset.',
      lessons: [
        { key: 'l3b_cost_seg', title: 'Cost Segregation', objective: 'Reclassifying components into shorter depreciation lives to front-load deductions.', action: 'Estimate the year-one benefit of a study.', checklist: ['Identified qualifying components', 'Estimated the accelerated deduction', 'Compared against study cost', 'Confirmed with your CPA'], deliverable: 'Cost Segregation Benefit Analysis' },
        { key: 'l3b_1031', title: '1031 Exchanges', objective: 'Rolling gains into a like-kind asset to defer capital gains — on a strict clock.', action: 'Map the identification and closing deadlines.', checklist: ['Noted the 45-day identification window', 'Noted the 180-day closing window', 'Identified a qualified intermediary'], deliverable: '1031 Exchange Execution Checklist' },
        { key: 'l3b_refi', title: 'Cash-Out Refinancing', objective: 'Extracting appreciated equity to fund the next down payment.', action: 'Calculate available equity and the new debt service.', checklist: ['Estimated current value', 'Calculated extractable equity at target LTV', 'Modelled new debt service against DSCR'], deliverable: 'Equity Recycling Model' },
        { key: 'l3b_entities', title: 'Multi-Entity Real Estate Structure', objective: 'Each property in its own entity under a parent, so one claim cannot reach the rest.', action: 'Map your holding structure.', checklist: ['Diagrammed parent and property entities', 'Noted ownership percentages', 'Flagged for attorney review'], deliverable: 'Real Estate Legal Structure Map' },
      ] },
  ],
};

const L4 = {
  id: 'L4',
  track: 'acquisition',
  screen: 'WealthProtection',
  title: 'Level 4: Taxes & Wealth Protection',
  short: 'Wealth Protection',
  color: '#8B4FC4',
  blurb: 'Keeping what the business earns — entity tax design, retirement vehicles, asset protection.',
  outcome: 'A structure that minimises legal tax drag and survives a claim.',
  modules: [
    { title: 'Module 1: Advanced Entity Tax Design',
      objective: 'Structure revenue across entities to reduce tax drag legally.',
      lessons: [
        { key: 'l4_scorp_salary', title: 'S-Corp Salary vs. Distribution', objective: 'A defensible reasonable salary, with the remainder as distributions exempt from the 15.3% SE tax.', action: 'Research comparable wage data for your role and document your reasoning.', checklist: ['Gathered comparable wage data', 'Documented the reasoning', 'Reviewed the figure with a CPA'], deliverable: 'Reasonable Compensation Research File',
          caution: 'This lesson does not produce a number for you. An indefensible salary is an IRS penalty — the figure must come from your CPA.' },
        { key: 'l4_qsbs', title: 'C-Corp Arbitrage & QSBS', objective: 'Section 1202 can exclude substantial gain on qualified small business stock — the eligibility rules are strict.', action: 'Audit whether your structure could qualify.', checklist: ['Checked entity type requirement', 'Checked the asset and activity tests', 'Noted holding period', 'Confirmed with a tax professional'], deliverable: 'QSBS Eligibility Review' },
        { key: 'l4_ptet', title: 'Pass-Through Entity Tax', objective: 'State-level PTET elections can move state tax above the federal SALT cap.', action: 'Check whether your state offers PTET and model the saving.', checklist: ['Confirmed your state offers PTET', 'Modelled the saving', 'Noted the election deadline'], deliverable: 'State PTET Election File' },
        { key: 'l4_nexus', title: 'Multi-State Nexus', objective: 'Income, sales and payroll obligations follow presence across state lines.', action: 'Map where you have physical, payroll or economic presence.', checklist: ['Listed states with any presence', 'Checked each state’s nexus thresholds', 'Noted registration obligations'], deliverable: 'Multi-State Tax Compliance Audit' },
      ] },
    { title: 'Module 2: Write-Offs, Credits & Offsets',
      objective: 'Claim what is legitimately available, documented properly.',
      lessons: [
        { key: 'l4_augusta', title: 'The Augusta Rule (§280A)', objective: 'Renting your residence to your business for up to 14 days a year, at market rate, with real minutes.', action: 'Establish market rate and set up proper documentation.', checklist: ['Researched comparable venue rates', 'Documented genuine business purpose', 'Prepared meeting minutes', 'Confirmed treatment with your CPA'], deliverable: 'Augusta Rule Documentation File' },
        { key: 'l4_rd', title: 'R&D Tax Credits', objective: 'Form 6765 credits for qualifying software and process development.', action: 'Log qualifying activities and associated costs.', checklist: ['Identified qualifying activities', 'Tracked associated wages and costs', 'Documented the four-part test', 'Engaged a specialist'], deliverable: 'R&D Credit Activity Log' },
        { key: 'l4_depreciation', title: 'Section 179 & Bonus Depreciation', objective: 'Writing off qualifying assets in year one instead of over a schedule.', action: 'Schedule this year’s asset purchases.', checklist: ['Listed planned purchases', 'Checked current-year limits', 'Confirmed in-service dates', 'Reviewed with your CPA'], deliverable: 'Asset Depreciation Schedule' },
        { key: 'l4_accountable_plan', title: 'Accountable Plans', objective: 'A formal plan makes reimbursements deductible to the company and tax-free to you.', action: 'Adopt a written accountable plan.', checklist: ['Drafted the plan document', 'Defined substantiation rules', 'Set the reimbursement process', 'Adopted it formally'], deliverable: 'Adopted Corporate Accountable Plan' },
      ] },
    { title: 'Module 3: Executive Retirement Vehicles',
      objective: 'Shelter profit in high-limit retirement structures.',
      lessons: [
        { key: 'l4_solo401k', title: 'The Solo 401(k)', objective: 'Contributing as both employee and employer substantially raises the annual limit.', action: 'Open a plan and set your contribution parameters.', checklist: ['Compared providers', 'Opened the plan', 'Set employee deferral', 'Set employer contribution'], deliverable: 'Solo 401(k) Adoption Agreement' },
        { key: 'l4_backdoor', title: 'Mega Backdoor Roth', objective: 'After-tax contributions converted into Roth growth — where the plan document allows it.', action: 'Confirm your plan permits after-tax contributions and in-service conversion.', checklist: ['Confirmed plan allows after-tax contributions', 'Confirmed in-service conversions', 'Modelled the annual amount'], deliverable: 'Mega Backdoor Roth Execution Log' },
        { key: 'l4_cash_balance', title: 'Defined Benefit & Cash Balance Plans', objective: 'For consistently high net income, these shelter far more than a 401(k) alone — with a funding commitment.', action: 'Get an actuarial estimate.', checklist: ['Confirmed income is consistently high enough', 'Obtained an actuarial estimate', 'Understood the ongoing funding obligation'], deliverable: 'Cash Balance Plan Feasibility Study' },
        { key: 'l4_sdira', title: 'Self-Directed Retirement Accounts', objective: 'Investing retirement funds into alternative assets — with severe prohibited-transaction rules.', action: 'Research custodians and the prohibited transaction rules.', checklist: ['Researched custodians', 'Studied prohibited transaction rules', 'Identified disqualified persons', 'Took professional advice'], deliverable: 'Self-Directed Account Research File' },
      ] },
    { title: 'Module 4: Holding Companies & Asset Protection',
      objective: 'Isolate liabilities so one claim cannot take everything.',
      lessons: [
        { key: 'l4_holdco', title: 'Parent-Child Holding Structures', objective: 'A parent holding company over separate operating, IP and property entities.', action: 'Diagram your target structure.', checklist: ['Diagrammed parent and subsidiaries', 'Assigned assets to entities', 'Noted the jurisdiction for each', 'Flagged for attorney review'], deliverable: 'Holding Company Structure Plan' },
        { key: 'l4_ip', title: 'IP Licensing Models', objective: 'Holding trademarks, code and domains in a separate entity, licensed back for a fee.', action: 'Inventory your IP and plan its ownership.', checklist: ['Inventoried all IP assets', 'Confirmed who legally owns each today', 'Planned the assignment', 'Noted licensing terms'], deliverable: 'Intellectual Property Inventory & Plan' },
        { key: 'l4_privacy', title: 'Corporate Privacy', objective: 'Registered agents and entity structures that keep home addresses off public filings.', action: 'Review what of yours is currently public.', checklist: ['Searched your own public filings', 'Identified exposed personal details', 'Researched registered agent options'],
          deliverable: 'Privacy Exposure Review',
          caution: 'Privacy is legitimate; concealment to defraud creditors is not. Structures here must be set up with an attorney, and beneficial-ownership reporting obligations may apply.' },
        { key: 'l4_charging_orders', title: 'Charging Order Protection', objective: 'Multi-member LLC statutes can limit what a personal creditor can reach — protection varies enormously by state.', action: 'Audit your operating agreements for the relevant provisions.', checklist: ['Reviewed each operating agreement', 'Checked your state’s statute', 'Noted gaps for attorney review'], deliverable: 'Asset Protection Audit Report' },
      ] },
    { title: 'Module 5: Estate & Succession',
      objective: 'Pass the enterprise on without it being dismantled by tax or probate.',
      lessons: [
        { key: 'l4_trusts', title: 'Revocable vs. Irrevocable Trusts', objective: 'Avoiding probate, and the control you trade away for protection.', action: 'List the assets that would pass through a trust.', checklist: ['Inventoried assets and titling', 'Compared revocable against irrevocable', 'Identified a trustee', 'Engaged an estate attorney'], deliverable: 'Trust Asset Assignment Schedule' },
        { key: 'l4_flp', title: 'Family Partnerships & Gifting', objective: 'Gifting non-voting interests within annual exclusion limits.', action: 'Model a multi-year gifting plan.', checklist: ['Checked current annual exclusion', 'Modelled a gifting schedule', 'Noted valuation requirements', 'Confirmed with counsel'], deliverable: 'Gift Valuation & Assignment Log' },
        { key: 'l4_dynasty', title: 'Dynasty & Perpetuity Planning', objective: 'Long-horizon trusts holding family assets across generations.', action: 'Define how assets should pass and to whom.', checklist: ['Defined beneficiaries and shares', 'Defined distribution conditions', 'Noted the governing jurisdiction'], deliverable: 'Generational Wealth Blueprint' },
        { key: 'l4_succession', title: 'Succession & Buy-Sell Funding', objective: 'Key-person insurance funding a buy-sell so heirs get liquidity and the business continues.', action: 'Obtain key-person quotes and match them to your buy-sell terms.', checklist: ['Determined required coverage', 'Obtained quotes', 'Confirmed the buy-sell terms align', 'Documented the funding mechanism'], deliverable: 'Funded Buy-Sell Policy Agreement' },
      ] },
  ],
};

// ─── Startup Track ───────────────────────────────────────────────────────────

const S1 = {
  id: 'S1', track: 'startup', screen: 'IdeaValidation',
  title: 'Level S1: Idea Validation & Customer Discovery',
  short: 'S1 Validation', color: '#3AC860',
  blurb: 'Prove somebody wants it before you build it.',
  outcome: 'Evidence — or a decision not to build.',
  modules: [
    { title: 'Module 1: Problem Discovery', objective: 'Find a problem worth solving that you are positioned to solve.', lessons: [
      { key: 's1_advantage', title: 'The Unfair Advantage Framework', objective: 'Audit your domain expertise, technical leverage, distribution access and unique insight.', action: 'Complete a founder advantage audit.', checklist: ['Listed domain expertise', 'Listed distribution access', 'Named your unique insight'], deliverable: 'Founder Advantage Scorecard' },
      { key: 's1_severity', title: 'Problem Severity Analysis', objective: 'Hair-on-fire pain versus nice-to-have — willingness to pay follows severity.', action: 'Log your top three pain hypotheses with impact scores.', checklist: ['Wrote 3 pain hypotheses', 'Scored frequency and severity', 'Ranked them'], deliverable: 'Problem Severity Matrix' },
      { key: 's1_competitors', title: 'Competitor Landscape', objective: 'Direct, indirect and status-quo substitutes — the last is usually the real competitor.', action: 'Map five competitors on a 2×2 positioning grid.', checklist: ['Identified 5 competitors', 'Chose the two axes', 'Placed each on the grid', 'Named the status-quo alternative'], deliverable: 'Competitor Landscape Report' },
      { key: 's1_tailwinds', title: 'Regulatory & Technological Tailwinds', objective: 'Why this is possible now and was not three years ago.', action: 'Identify two macro trends making this urgent.', checklist: ['Named 2 trends', 'Evidenced each', 'Explained the "why now"'], deliverable: 'Market Opportunity Brief' },
    ] },
    { title: 'Module 2: Customer Interviews', objective: 'Get truth out of people rather than politeness.', lessons: [
      { key: 's1_momtest', title: 'The Mom Test', objective: 'Ask about past behaviour, never about hypothetical future enthusiasm.', action: 'Write a discovery script that follows the rules.', checklist: ['Wrote questions about past behaviour', 'Removed every leading question', 'Removed all pitching'], deliverable: 'Customer Interview Script' },
      { key: 's1_icp', title: 'Ideal Customer Profile', objective: 'Budget authority, pain frequency and workflow fit.', action: 'Define your ICP concretely.', checklist: ['Defined firmographics or demographics', 'Identified who holds budget', 'Noted current workaround'], deliverable: 'ICP Target Persona Sheet' },
      { key: 's1_interviews', title: 'Conducting Interviews', objective: 'Ten conversations is where patterns start to appear.', action: 'Run and record ten discovery calls.', checklist: ['Scheduled 10 interviews', 'Conducted them', 'Captured notes for each'], deliverable: 'Call Transcript & Insight Log' },
      { key: 's1_synthesis', title: 'Qualitative Synthesis', objective: 'Coding raw transcripts into recurring pains and value drivers.', action: 'Tag quotes and identify the top three requested solutions.', checklist: ['Tagged recurring themes', 'Counted frequency per theme', 'Named the top 3'], deliverable: 'Validated User Pain Synthesis' },
    ] },
    { title: 'Module 3: Market Sizing & Pricing', objective: 'Is the market big enough to matter, and what will people pay?', lessons: [
      { key: 's1_tam', title: 'TAM, SAM, SOM', objective: 'Bottom-up sizing (customers × contract value) beats top-down hand-waving.', action: 'Build a bottom-up market size.', checklist: ['Counted addressable customers', 'Set a realistic contract value', 'Calculated TAM, SAM and SOM'], deliverable: 'TAM / SAM / SOM Report' },
      { key: 's1_pricing', title: 'Value Capture & Pricing', objective: 'Subscription, usage-based, take-rate or licence.', action: 'Choose a monetisation model and justify it.', checklist: ['Compared the models', 'Chose one', 'Justified it against customer behaviour'], deliverable: 'Monetization & Pricing Strategy' },
      { key: 's1_wtp', title: 'Willingness-to-Pay Testing', objective: 'Van Westendorp price sensitivity to find the acceptable range.', action: 'Run a four-question price survey.', checklist: ['Built the 4 questions', 'Collected responses', 'Plotted the acceptable range'], deliverable: 'Price Sensitivity Benchmark' },
      { key: 's1_moat', title: 'Defensibility & Moats', objective: 'Network effects, switching costs, brand and proprietary data.', action: 'Score your potential moats honestly.', checklist: ['Scored each moat type', 'Identified the strongest', 'Noted what would have to be true'], deliverable: 'Competitive Moat Matrix' },
    ] },
    { title: 'Module 4: Smoke Testing', objective: 'Test demand before writing code.', lessons: [
      { key: 's1_landing', title: 'Landing Page Architecture', objective: 'Headline, proof, and one clear call to action.', action: 'Draft the page copy.', checklist: ['Wrote the headline', 'Wrote the value proposition', 'Defined one CTA'], deliverable: 'Landing Page Copy Blueprint' },
      { key: 's1_smoke', title: 'Smoke Tests & Waitlists', objective: 'A small ad budget buys a real conversion signal.', action: 'Put up a waitlist page and drive test traffic.', checklist: ['Published the page', 'Set a small budget', 'Ran traffic', 'Recorded conversion rate'], deliverable: 'Smoke-Test Conversion Analytics' },
      { key: 's1_concierge', title: 'Concierge & Wizard-of-Oz MVP', objective: 'Deliver the value by hand before automating it.', action: 'Manually deliver the outcome for five users.', checklist: ['Recruited 5 users', 'Delivered manually', 'Logged time per delivery', 'Captured feedback'], deliverable: 'Concierge Execution Log' },
      { key: 's1_benchmarks', title: 'Validation Benchmarks', objective: 'Judge signups, cost per lead and conversion against thresholds set in advance.', action: 'Score your results against your pre-set benchmarks.', checklist: ['Set benchmarks before looking', 'Recorded actuals', 'Made a pass/fail call'], deliverable: 'Validation Gate Scorecard' },
    ] },
    { title: 'Module 5: Venture Thesis & Gate', objective: 'Decide, on evidence, whether to build.', lessons: [
      { key: 's1_canvas', title: 'The One-Page Lean Canvas', objective: 'Problem, solution, metrics, value proposition, channels and costs on one page.', action: 'Fill out the canvas.', checklist: ['Completed every box', 'Kept it to one page'], deliverable: 'Completed 1-Page Lean Canvas' },
      { key: 's1_narrative', title: 'Founder Narrative & Why Now', objective: 'Why this team, this problem, this moment.', action: 'Draft a two-minute origin story.', checklist: ['Wrote the origin story', 'Answered "why you"', 'Answered "why now"'], deliverable: 'Founder Narrative One-Pager' },
      { key: 's1_funding_route', title: 'Venture vs. Bootstrap', objective: 'Does the market justify venture-scale returns, or is cash flow the better path?', action: 'Work through the decision explicitly.', checklist: ['Assessed market size against venture maths', 'Considered control preferences', 'Made and recorded the decision'], deliverable: 'Capital Strategy Roadmap' },
      { key: 's1_gate', title: 'S1 Gate Review', objective: 'Compile the evidence and decide whether S2 is justified.', action: 'Assemble everything from S1 into one package and make the call.', checklist: ['Compiled all S1 deliverables', 'Reviewed against benchmarks', 'Made an explicit build/no-build decision'], deliverable: 'S1 Validation Vault Package' },
    ] },
  ],
};

const S2 = {
  id: 'S2', track: 'startup', screen: 'ProductEngineering',
  title: 'Level S2: Product Engineering & MVP',
  short: 'S2 Product', color: '#4A90E2',
  blurb: 'Build the smallest thing that delivers the value, without burying yourself in debt.',
  outcome: 'A live product in real users’ hands.',
  modules: [
    { title: 'Module 1: Scoping & Feature Pruning', objective: 'Isolate the one workflow that matters.', lessons: [
      { key: 's2_mvs', title: 'Minimal Viable Scope', objective: 'One core workflow, delivered well.', action: 'Define the single feature required to launch.', checklist: ['Named the core workflow', 'Listed what is explicitly excluded'], deliverable: 'Minimal Viable Scope Document' },
      { key: 's2_stories', title: 'User Story Mapping', objective: 'As a [user] I want to [action] so that [benefit].', action: 'Write the story backlog.', checklist: ['Wrote stories for each persona', 'Covered the full core journey'], deliverable: 'Product User Story Backlog' },
      { key: 's2_moscow', title: 'MoSCoW Prioritisation', objective: 'Must, Should, Could, Won’t — and Won’t is the important one.', action: 'Categorise every feature request.', checklist: ['Sorted all features', 'Made the Won’t list explicit'], deliverable: 'Prioritized Feature Matrix' },
      { key: 's2_feasibility', title: 'Technical Feasibility Audit', objective: 'API dependencies, scaling bottlenecks and platform limits.', action: 'Audit dependencies and risks.', checklist: ['Listed third-party dependencies', 'Flagged single points of failure', 'Noted rate limits and costs'], deliverable: 'Tech Risk & Dependency Log' },
    ] },
    { title: 'Module 2: Stack & Architecture', objective: 'Pick tools you can actually move fast in.', lessons: [
      { key: 's2_stack', title: 'No-Code vs. Low-Code vs. Full-Code', objective: 'Match the tool to the team and the deadline.', action: 'Choose and justify your stack.', checklist: ['Chose frontend and backend', 'Justified against team skills', 'Noted the migration path if you outgrow it'], deliverable: 'Technical Stack Blueprint' },
      { key: 's2_schema', title: 'Database & Schema Design', objective: 'Model entities and relationships before writing features on top of them.', action: 'Draw the entity relationship diagram.', checklist: ['Listed entities', 'Defined relationships', 'Noted indexes and constraints'], deliverable: 'Database Entity Relationship Diagram' },
      { key: 's2_apis', title: 'API & Integration Architecture', objective: 'Endpoints, webhooks and third-party integrations.', action: 'Map your integrations and data flows.', checklist: ['Listed integrations', 'Mapped data flow for each', 'Noted secret handling'], deliverable: 'System Architecture & API Map' },
      { key: 's2_security', title: 'Security, Compliance & Isolation', objective: 'HTTPS, authentication, row-level access control, and knowing which regimes apply to you.', action: 'Work through a security checklist before launch.', checklist: ['Enforced HTTPS', 'Implemented authentication', 'Implemented per-user data isolation', 'Identified applicable compliance regimes'], deliverable: 'Security & Compliance Checklist' },
    ] },
    { title: 'Module 3: UI/UX & Prototyping', objective: 'Find the confusion before you build it.', lessons: [
      { key: 's2_wireframes', title: 'Wireframing the Critical Path', objective: 'Onboarding, the primary action, and account management.', action: 'Sketch low-fidelity wireframes.', checklist: ['Wireframed onboarding', 'Wireframed the core action', 'Wireframed account management'], deliverable: 'Low-Fi UX Wireframe Specs' },
      { key: 's2_design_system', title: 'Design System', objective: 'Components, type, colour and dark mode, decided once.', action: 'Define your component and style rules.', checklist: ['Defined colour tokens', 'Defined type scale', 'Built core components', 'Checked contrast accessibility'], deliverable: 'UI Component & Style Guide' },
      { key: 's2_prototype', title: 'Clickable Prototype', objective: 'Navigable enough to test before it is real.', action: 'Publish an interactive prototype.', checklist: ['Linked the core flow', 'Made it shareable'], deliverable: 'Interactive Prototype Link' },
      { key: 's2_usability', title: 'Usability Testing', objective: 'Five users surfaces most of the serious friction.', action: 'Run five tests and log the friction points.', checklist: ['Recruited 5 testers', 'Ran the sessions', 'Logged every friction point', 'Prioritised the fixes'], deliverable: 'Usability Audit & Fix List' },
    ] },
    { title: 'Module 4: Build Operations', objective: 'Ship repeatedly without breaking things.', lessons: [
      { key: 's2_devs', title: 'In-House vs. Agency vs. Offshore', objective: 'Contracts, milestones and — critically — who owns the code.', action: 'Get an IP assignment clause into every developer contract.', checklist: ['Defined milestones and deliverables', 'Included an explicit IP assignment', 'Had it reviewed by an attorney'], deliverable: 'Executed Developer IP Agreement' },
      { key: 's2_cicd', title: 'Pipelines & Environments', objective: 'Repository, branches, staging and automated deploys.', action: 'Set up the repo and deployment pipeline.', checklist: ['Created the repository', 'Set up main and staging branches', 'Automated deploys', 'Protected the main branch'], deliverable: 'Code Repository & CI/CD Pipeline Log' },
      { key: 's2_sprints', title: 'Sprint Cadence', objective: 'Two-week cycles with grooming, review and retrospective.', action: 'Set up the board and the first sprint.', checklist: ['Chose a tool', 'Loaded the backlog', 'Planned sprint one'], deliverable: 'Active 2-Week Sprint Board' },
      { key: 's2_tech_debt', title: 'Managing Technical Debt', objective: 'Velocity now against maintainability later, decided deliberately.', action: 'Set your code review and test coverage rules.', checklist: ['Defined PR review rules', 'Set a test coverage expectation', 'Created a debt register'], deliverable: 'Code Review & Quality Guidelines' },
    ] },
    { title: 'Module 5: Telemetry & Launch', objective: 'Know what happens after release.', lessons: [
      { key: 's2_telemetry', title: 'Product Telemetry', objective: 'Signup, onboarding and key-action events, defined before launch.', action: 'Implement the core event schema.', checklist: ['Defined the events', 'Implemented tracking', 'Verified events arrive'], deliverable: 'Product Event Tracking Schema' },
      { key: 's2_errors', title: 'Error Monitoring', objective: 'Crash reporting and performance monitoring from day one.', action: 'Integrate an error monitoring SDK.', checklist: ['Integrated the SDK', 'Verified a test error arrives', 'Set alerting'], deliverable: 'Error Monitoring Dashboard' },
      { key: 's2_beta', title: 'Soft-Launch Beta Cohort', objective: 'A small private cohort finds what internal testing cannot.', action: 'Onboard a private beta group and collect structured feedback.', checklist: ['Recruited the cohort', 'Onboarded them', 'Collected structured feedback', 'Triaged the issues'], deliverable: 'Private Beta Cohort Report' },
      { key: 's2_ship', title: 'App Store & Web Deployment', objective: 'Store submissions, certificates, domains and DNS.', action: 'Deploy to production or submit your store build.', checklist: ['Prepared store listing or domain', 'Completed the submission or deploy', 'Verified production works'], deliverable: 'Live Production Deployment Log' },
    ] },
  ],
};

const S3 = {
  id: 'S3', track: 'startup', screen: 'GoToMarket',
  title: 'Level S3: Go-To-Market & Growth',
  short: 'S3 Growth', color: '#E0A830',
  blurb: 'Find product-market fit, then find the channel that repeatably brings people in.',
  outcome: 'A repeatable acquisition channel with economics that work.',
  modules: [
    { title: 'Module 1: Measuring Product-Market Fit', objective: 'Know whether you have it, honestly.', lessons: [
      { key: 's3_pmf_survey', title: 'The Sean Ellis PMF Survey', objective: '"How disappointed would you be if this disappeared?" — 40% very disappointed is the common benchmark.', action: 'Run the survey with active users.', checklist: ['Sent to active users', 'Collected responses', 'Calculated the percentage'], deliverable: 'PMF Score Benchmark Report' },
      { key: 's3_retention', title: 'Retention Curves', objective: 'A curve that flattens means real retention; one that keeps falling means none.', action: 'Plot 30 and 90-day cohort retention.', checklist: ['Built cohorts by signup month', 'Plotted retention', 'Checked whether it flattens'], deliverable: 'User Retention Cohort Chart' },
      { key: 's3_power_users', title: 'Power User Analysis', objective: 'What the top 10% do differently is the product you should build.', action: 'Interview your most active users.', checklist: ['Identified the top 10%', 'Interviewed several', 'Documented common behaviour'], deliverable: 'Power User Insights Brief' },
      { key: 's3_pivot', title: 'Pivot Mechanics', objective: 'Which of segment, problem, feature or pricing to change — and when.', action: 'Evaluate your signals against pivot thresholds.', checklist: ['Reviewed PMF and retention signals', 'Considered each pivot type', 'Made an explicit decision'], deliverable: 'PMF & Pivot Decision Log' },
    ] },
    { title: 'Module 2: Acquisition Channels', objective: 'Test broadly, then concentrate.', lessons: [
      { key: 's3_bullseye', title: 'The Bullseye Framework', objective: 'Test many channels cheaply, then go deep on the one that works.', action: 'Run three low-budget channel experiments.', checklist: ['Chose 3 channels', 'Set a budget and success metric each', 'Ran them', 'Compared cost per acquisition'], deliverable: 'Growth Channel Experiment Matrix' },
      { key: 's3_outbound', title: 'B2B Outbound', objective: 'Domain warming, targeted lists and personalised sequences.', action: 'Launch an outbound campaign to your ICP.', checklist: ['Built a targeted list', 'Warmed the sending domain', 'Wrote a personalised sequence', 'Tracked reply rate'], deliverable: 'B2B Outbound Campaign Results' },
      { key: 's3_paid', title: 'Paid Performance Marketing', objective: 'Structured experiments with hard CAC caps.', action: 'Run a capped ad experiment with conversion tracking.', checklist: ['Set a CAC cap', 'Implemented conversion tracking', 'Ran the experiment', 'Recorded actual CAC'], deliverable: 'Paid Acquisition Performance Log' },
      { key: 's3_plg', title: 'Product-Led Growth', objective: 'Freemium, trials and self-serve upgrade paths.', action: 'Design the self-serve funnel and its paywall.', checklist: ['Defined the free tier', 'Defined the upgrade trigger', 'Designed the paywall moment'], deliverable: 'PLG Funnel Conversion Specs' },
    ] },
    { title: 'Module 3: Conversion Optimisation', objective: 'Get more from the traffic you already have.', lessons: [
      { key: 's3_ttv', title: 'Activation & Time-to-Value', objective: 'The "aha" moment should arrive in the first minute.', action: 'Audit onboarding and remove two friction screens.', checklist: ['Mapped every onboarding step', 'Identified the aha moment', 'Removed at least 2 steps', 'Measured the change'], deliverable: 'Optimized Onboarding Flow Map' },
      { key: 's3_funnel', title: 'Sales Funnel Optimisation', objective: 'Pricing page, checkout and paywall drop-off.', action: 'Improve the pricing page and add social proof.', checklist: ['Reviewed pricing page clarity', 'Added social proof', 'Measured drop-off before and after'], deliverable: 'High-Converting Sales Funnel Blueprint' },
      { key: 's3_ab', title: 'A/B Testing', objective: 'Structuring an experiment that produces a trustworthy answer.', action: 'Run a headline or pricing experiment.', checklist: ['Formed a hypothesis', 'Calculated required sample size', 'Ran to significance', 'Recorded the result'], deliverable: 'A/B Experiment Plan & Results' },
      { key: 's3_lifecycle', title: 'Lifecycle Email & Push', objective: 'Trigger-based welcome, activation and re-engagement sequences.', action: 'Build a five-part onboarding sequence.', checklist: ['Mapped the triggers', 'Wrote 5 messages', 'Set the timing', 'Measured open and action rates'], deliverable: 'Lifecycle Email Automation Map' },
    ] },
    { title: 'Module 4: Retention & Referral', objective: 'Keep them, and let them bring others.', lessons: [
      { key: 's3_dunning', title: 'Involuntary Churn & Dunning', objective: 'Failed cards cause a surprising share of churn, and it is recoverable.', action: 'Turn on automated retry sequences.', checklist: ['Enabled smart retries', 'Set up failure notifications', 'Measured recovery rate'], deliverable: 'Involuntary Churn Recovery Plan' },
      { key: 's3_health', title: 'Usage Alerts & Customer Success', objective: 'Declining usage predicts cancellation — intervene before it.', action: 'Set up alerts for accounts going quiet.', checklist: ['Defined a health score', 'Set the alert threshold', 'Defined the intervention'], deliverable: 'Health Score & Account Alert System' },
      { key: 's3_viral', title: 'Referral & Viral Loops', objective: 'Build the invite into the product rather than bolting it on.', action: 'Implement referral links with a reward.', checklist: ['Designed the incentive', 'Implemented referral links', 'Tracked referrals per user'], deliverable: 'Referral Program Incentive Spec' },
      { key: 's3_expansion', title: 'Expansion Revenue', objective: 'Seats, add-ons and annual upgrades from existing customers.', action: 'Run an upgrade campaign to power users.', checklist: ['Identified upgrade candidates', 'Designed the offer', 'Ran the campaign', 'Measured expansion revenue'], deliverable: 'Expansion Revenue Campaign Brief' },
    ] },
    { title: 'Module 5: Unit Economics', objective: 'Prove growth makes money rather than burning it.', lessons: [
      { key: 's3_ltv_cac', title: 'LTV vs. CAC', objective: 'A ratio of 3:1 or better is the conventional health marker.', action: 'Calculate real LTV, CAC and gross margin from billing data.', checklist: ['Calculated ARPU and churn', 'Calculated LTV', 'Calculated fully-loaded CAC', 'Computed the ratio'], deliverable: 'Unit Economics Scorecard' },
      { key: 's3_payback', title: 'CAC Payback Period', objective: 'Under twelve months keeps cash flow survivable.', action: 'Calculate payback by channel.', checklist: ['Calculated payback per channel', 'Compared against 12 months', 'Identified the worst channel'], deliverable: 'CAC Payback Period Analysis' },
      { key: 's3_blended', title: 'Blended vs. Paid Metrics', objective: 'Blending organic into paid hides whether ad spend actually works.', action: 'Build a dashboard separating paid from organic.', checklist: ['Separated the sources', 'Calculated CAC for each', 'Built the comparison view'], deliverable: 'Blended Growth Analytics Dashboard' },
      { key: 's3_playbook', title: 'The Growth Playbook', objective: 'Document what worked so someone else can run it.', action: 'Write the winning channels up as a repeatable SOP.', checklist: ['Documented each winning channel', 'Wrote step-by-step process', 'Noted the benchmarks'], deliverable: 'Scalable Growth Playbook' },
    ] },
  ],
};

const S4 = {
  id: 'S4', track: 'startup', screen: 'VentureScale',
  title: 'Level S4: Venture Scale & Exit',
  short: 'S4 Scale', color: '#8B4FC4',
  blurb: 'Institutional metrics, real fundraising, a leadership team, and the exit.',
  outcome: 'A company that can be funded, governed and eventually sold.',
  modules: [
    { title: 'Module 1: Venture Financials', objective: 'The metrics institutional investors actually judge.', lessons: [
      { key: 's4_mrr', title: 'MRR & ARR', objective: 'Net new MRR = new + expansion − churn − contraction.', action: 'Build an MRR waterfall.', checklist: ['Separated new, expansion, churn and contraction', 'Built the monthly waterfall', 'Calculated net new MRR'], deliverable: 'MRR Waterfall & Growth Dashboard' },
      { key: 's4_nrr', title: 'Net Revenue Retention', objective: 'Above 100% means you grow without adding a single customer.', action: 'Calculate NRR by annual cohort.', checklist: ['Built annual cohorts', 'Calculated expansion and churn per cohort', 'Computed NRR'], deliverable: 'Net Revenue Retention Report' },
      { key: 's4_burn', title: 'Burn Multiple & Efficiency', objective: 'Net burn ÷ net new ARR — how much you spend to add a dollar.', action: 'Calculate burn multiple and runway.', checklist: ['Calculated monthly net burn', 'Calculated net new ARR', 'Computed the multiple', 'Calculated runway in months'], deliverable: 'Capital Efficiency & Runway Model' },
      { key: 's4_model', title: 'The 3-Way Financial Model', objective: 'Integrated P&L, cash flow and balance sheet with hiring drivers.', action: 'Build a three-year model.', checklist: ['Built the P&L', 'Built cash flow', 'Built the balance sheet', 'Linked hiring drivers'], deliverable: 'Venture Financial Model (3-Year)' },
    ] },
    { title: 'Module 2: Institutional Fundraising', objective: 'Seed to Series A, run properly.', lessons: [
      { key: 's4_vc_mechanics', title: 'How VC Funds Work', objective: 'Fund lifecycles, power-law returns and what LPs expect.', action: 'Build a target list of funds that invest at your stage and sector.', checklist: ['Filtered by stage', 'Filtered by sector', 'Checked check size', 'Found warm intro routes'], deliverable: 'Investor Pipeline & Outbound CRM' },
      { key: 's4_dataroom', title: 'The Data Room', objective: 'Legal, financial, technical, customer and cap table, organised before diligence starts.', action: 'Assemble a structured virtual data room.', checklist: ['Created the folder structure', 'Uploaded corporate documents', 'Uploaded financials', 'Uploaded the cap table', 'Set access controls'], deliverable: 'Institutional Virtual Data Room' },
      { key: 's4_termsheet', title: 'Term Sheet Negotiation', objective: 'Valuation, liquidation preference, anti-dilution, protective provisions and board seats.', action: 'Analyse a term sheet clause by clause.', checklist: ['Reviewed the preference structure', 'Reviewed anti-dilution', 'Reviewed board composition', 'Had counsel review it'], deliverable: 'Term Sheet Analysis & Summary' },
      { key: 's4_venture_debt', title: 'Venture Debt & Non-Dilutive Capital', objective: 'Revenue-based financing and venture debt to extend runway without dilution.', action: 'Compare non-dilutive offers against an equity round.', checklist: ['Collected offers', 'Modelled cost against dilution', 'Checked covenants'], deliverable: 'Venture Debt Comparison Sheet' },
    ] },
    { title: 'Module 3: Leadership & Scale Hiring', objective: 'Build the team that runs it without you.', lessons: [
      { key: 's4_vp_hiring', title: 'Hiring Executive Leadership', objective: 'Recruiting and onboarding your first VPs.', action: 'Write the job description and success scorecard for your first VP hire.', checklist: ['Defined the role', 'Wrote measurable success criteria', 'Defined the interview process'], deliverable: 'Executive Hiring Scorecard' },
      { key: 's4_esop', title: 'Option Pool & Equity Compensation', objective: 'A 10-15% pool with four-year vesting and a one-year cliff is conventional.', action: 'Establish the pool and grant schedule.', checklist: ['Sized the pool', 'Set the vesting schedule', 'Documented grant approval', 'Had counsel review'], deliverable: 'ESOP Equity Grant Schedule' },
      { key: 's4_okrs', title: 'Org Structure & OKRs', objective: 'Pods, objectives and communication rhythm.', action: 'Set company and department OKRs for the quarter.', checklist: ['Set company objectives', 'Cascaded to departments', 'Defined measurable key results', 'Set the review cadence'], deliverable: 'Quarterly OKR Execution Board' },
      { key: 's4_sales_comp', title: 'Sales Compensation', objective: 'Quotas, on-target earnings and commission structure.', action: 'Build the compensation plan for account executives.', checklist: ['Set quota and OTE', 'Defined the commission structure', 'Modelled cost against gross margin'], deliverable: 'Sales Compensation Plan' },
    ] },
    { title: 'Module 4: Governance & Compliance', objective: 'Be the kind of company an enterprise will buy from.', lessons: [
      { key: 's4_board', title: 'Board Management', objective: 'Quarterly meetings, board decks and investor updates.', action: 'Build a standard board deck template.', checklist: ['Built the template', 'Defined the standing metrics', 'Set the meeting cadence'], deliverable: 'Quarterly Board Deck Template' },
      { key: 's4_soc2', title: 'Enterprise Readiness & SOC 2', objective: 'The security controls enterprise buyers require before signing.', action: 'Complete a readiness checklist.', checklist: ['Documented security policies', 'Implemented access controls', 'Set up vendor risk review', 'Scoped an audit'], deliverable: 'SOC 2 Compliance Audit Readiness' },
      { key: 's4_international', title: 'International Expansion', objective: 'Multi-currency, local tax and global hiring via employers of record.', action: 'Research the requirements for your first international market.', checklist: ['Chose a target market', 'Researched entity and tax requirements', 'Compared EOR providers'], deliverable: 'Global Expansion Requirements Brief' },
      { key: 's4_ip_patents', title: 'IP & Patent Portfolio', objective: 'Trademarks, patents and defensible protection.', action: 'File a trademark or provisional patent.', checklist: ['Ran a clearance search', 'Prepared the filing', 'Filed it', 'Diarised the deadlines'], deliverable: 'IP & Patent Filing Record' },
    ] },
    { title: 'Module 5: Exit & M&A', objective: 'Sell well, or don’t sell — but know how it works.', lessons: [
      { key: 's4_acquirers', title: 'Strategic Acquirer Mapping', objective: 'Identify likely acquirers early and build relationships before you need them.', action: 'Map ten potential acquirers and why each would buy.', checklist: ['Listed 10 acquirers', 'Noted strategic rationale for each', 'Identified relationship routes'], deliverable: 'M&A Strategic Acquirer Map' },
      { key: 's4_loi', title: 'LOI Negotiation', objective: 'Asset versus stock purchase, and which clauses actually bind you.', action: 'Analyse the key clauses of a letter of intent.', checklist: ['Identified the deal structure', 'Reviewed exclusivity', 'Reviewed the earnout if any', 'Had counsel review'], deliverable: 'LOI Evaluation & Term Summary' },
      { key: 's4_diligence', title: 'M&A Due Diligence', objective: 'Code audits, IP chain of custody, and tax and legal disclosure.', action: 'Run a pre-diligence audit on yourself before a buyer does.', checklist: ['Audited IP chain of custody', 'Confirmed all contractor assignments', 'Reviewed contracts for change-of-control', 'Compiled disclosures'], deliverable: 'M&A Due Diligence Audit Log' },
      { key: 's4_earnout', title: 'Post-Merger & Earnouts', objective: 'Retention packages, employment terms and earnout targets you can actually hit.', action: 'Model the deal structure and earnout conditions.', checklist: ['Modelled consideration split', 'Assessed earnout achievability', 'Reviewed employment terms', 'Had counsel review'], deliverable: 'Final M&A Exit Blueprint' },
    ] },
  ],
};

// ─── Operations Track ────────────────────────────────────────────────────────
// Not "how to own a business" — how to actually run one once people work for
// you. Employer-side compliance, risk, and culture: the policies a real
// company needs in writing, the channels a complaint or a safety concern
// travels through, and the record a regulator or a plaintiff's attorney
// would actually ask for. See retailOperations.js for the front-line/
// employee-behavior counterpart to this level's employer-obligation angle —
// deliberately not duplicated here.

const W1 = {
  id: 'W1',
  track: 'operations',
  screen: 'WorkplaceCompliance',
  title: 'Level W1: Workplace Compliance & Culture',
  short: 'Workplace Compliance',
  color: '#C0392B',
  blurb: 'The employer-side policies, compliance obligations, and escalation channels that protect the business and its people — written to become a real employee handbook.',
  outcome: 'A written policy set — handbook fundamentals, complaint channels, anti-harassment policy, classification review, safety recordkeeping, and a code of conduct — ready to hand to real employees.',
  modules: [
    { title: 'Module 1: Written Policies & Proper Channels',
      objective: 'Turn "we should have a handbook" into actual written policy, with more than one way for a problem to reach you.',
      lessons: [
        { key: 'w1_handbook', title: 'Employee Handbook & Written Policy Fundamentals',
          objective: 'Why a handbook exists, the at-will disclaimer that keeps it from becoming an accidental contract, and the acknowledgment form that makes it defensible.',
          action: 'Build your written policy index — every policy area a real handbook needs — and mark what you already have in writing versus what only exists in your head.',
          checklist: ['Listed every policy area the handbook should cover', 'Marked which are already written vs. undocumented', 'Drafted an at-will disclaimer paragraph', 'Drafted acknowledgment-form language', 'Set an annual review date'],
          deliverable: 'Written Policy Index' },
        { key: 'w1_channels', title: 'Complaints, Escalation & Whistleblower Protection',
          objective: 'Why one channel ("talk to your manager") isn\'t enough, and what whistleblower protection actually covers.',
          action: 'Draft your complaint and escalation procedure: at least two intake channels, who investigates, and a documentation standard.',
          checklist: ['Defined at least two intake channels', 'Defined who investigates and the expected timeline', 'Wrote a plain-language non-retaliation statement', 'Built a simple documentation template', 'Noted when a report should go outside the business'],
          deliverable: 'Complaint & Escalation Procedure' },
      ] },
    { title: 'Module 2: Compliance, Safety & Regulatory Risk',
      objective: 'The federal baselines and recordkeeping obligations that generate the most real exposure for a small employer.',
      lessons: [
        { key: 'w1_harassment', title: 'Anti-Harassment & Anti-Discrimination Compliance',
          objective: 'Title VII, the ADA, and the ADEA as the federal floor — and why several states require specific, recurring supervisor training on top of it.',
          action: 'Draft your anti-harassment policy statement and check your state\'s specific training mandate.',
          checklist: ['Stated the protected categories the policy covers', 'Stated the standard of conduct expected', 'Referenced the complaint channels from Module 1', 'Stated the non-retaliation commitment', 'Checked your state\'s training mandate and recorded what you found'],
          deliverable: 'Anti-Harassment Policy Statement',
          caution: 'Requirements vary by state and change over time — verify current thresholds and any mandatory training rules with your state labor agency or an employment attorney before relying on this.' },
        { key: 'w1_classification', title: 'Employment Law & Classification Risk',
          objective: 'Why misclassifying a worker is one of the most expensive mistakes a small employer makes, and why a salary alone never makes someone overtime-exempt.',
          action: 'Review your real or planned roles: classify each as employee/contractor and exempt/non-exempt, with your reasoning.',
          checklist: ['Listed every current or planned role', 'Classified each as employee or contractor, with reasoning', 'Classified each employee role as exempt or non-exempt, with reasoning', 'Checked your state\'s meal/rest break rules', 'Set a documentation habit for performance issues going forward'],
          deliverable: 'Employee Classification & Risk Worksheet' },
        { key: 'w1_safety_records', title: 'Workplace Safety Recordkeeping & OSHA Obligations',
          objective: 'The employer-side counterpart to floor-level safety training: the OSHA 300 log, required postings, and the clock on reporting a serious incident.',
          action: 'Build your compliance posting and recordkeeping checklist.',
          checklist: ['Checked whether your industry is exempt from routine OSHA recordkeeping', 'Sourced required postings directly from official agencies, not a paid reseller', 'Set up (or confirmed you don\'t need) an OSHA 300 log', 'Wrote down the severe-incident reporting clock and who owns that call', 'Set the annual 300A posting window on your calendar'],
          deliverable: 'Safety Recordkeeping & Posting Checklist' },
      ] },
    { title: 'Module 3: Workplace Culture & Conduct',
      objective: 'Turn stated values into enforceable, consistently applied expectations.',
      lessons: [
        { key: 'w1_conduct', title: 'Code of Conduct & Progressive Discipline',
          objective: 'Why a code of conduct has to be specific to be enforceable, and why inconsistent discipline is itself a legal risk.',
          action: 'Draft your code of conduct and a progressive-discipline ladder.',
          checklist: ['Wrote specific, enforceable conduct expectations', 'Built a progressive discipline ladder (verbal, written, final, termination)', 'Defined what gets documented at each step', 'Committed to applying it the same way regardless of role'],
          deliverable: 'Code of Conduct & Discipline Ladder' },
        { key: 'w1_privacy', title: 'Data Privacy, Confidentiality & Trade Secrets Basics',
          objective: 'Customer PII, payment data, and business confidential information — what a written policy needs to say and who it binds.',
          action: 'Draft a confidentiality and data-handling policy covering customer data, payment data, and business trade secrets.',
          checklist: ['Listed the categories of sensitive data your business handles', 'Wrote the expected handling rule for each', 'Defined who signs an NDA or confidentiality agreement, and when', 'Noted what happens to access when someone leaves'],
          deliverable: 'Confidentiality & Data Handling Policy' },
      ] },
  ],
};

export const EXTRA_LEVELS = [L3B, L4, S1, S2, S3, S4, W1];
export default EXTRA_LEVELS;
