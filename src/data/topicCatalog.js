// src/data/topicCatalog.js
// Every topic planned for Academy Classes, built or not. It is the roadmap,
// on screen: someone browsing a subject sees what's here now and what's
// coming, and as each topic gets a lesson, a quest or a game, its entry
// just gains a `built` link. Nothing else has to change.
//
// Source: the topic lists in the Gemini rework (newgemini_rework.pdf),
// grouped the way it grouped them. The hooks are its example angles. The
// summaries were checked and rewritten where it had the science or the
// money wrong (GPS works by distance, not angle; gut bacteria don't make
// the body's serotonin; a magnitude 7 quake releases about 32 times the
// energy of a 6, not 10; an LLC doesn't lower tax on its own; "300 words
// cover 80% of conversation" overstates it; the golden ratio's design
// claims are mostly myth; and more).
//
// Shape:
//   subject   a CLASS_SUBJECTS title (classCatalog.js)
//   groups[]  { title, topics[] }
//   topic     { id, title, hook, summary, level, built?, related? }
//     level    1 start here · 2 build on it · 3 go deeper
//     built    where it already lives: { screen, topicKey } for a class
//              topic, or { quest } for a quest (src/data/quests.js)
//     related  same shape, for a lesson that covers part of it
//
// No imports, so scripts can load it; scripts/check-wiring.mjs checks every
// `built`/`related` link points somewhere real.

const t = (id, title, hook, summary, level, links = {}) => ({ id, title, hook, summary, level, ...links });
const em = (topicKey) => ({ built: { screen: 'EverydayMath', topicKey } });

export const TOPIC_CATALOG = [
  // ── Math ──────────────────────────────────────────────────────────────────
  {
    subject: 'Math',
    groups: [
      { title: 'Everyday money & shopping', topics: [
        t('math-discounts', 'Percentages & discounts', '20% Off vs. $15 Off: Which Saves You More?', 'Sale prices, stacked discounts, and spotting a "sale" that isn\'t a deal.', 1, em('discounts')),
        t('math-unit-pricing', 'Unit pricing', 'The Grocery Store Price Trap', 'Price per ounce or gram, to see whether the jumbo size really is cheaper.', 1, em('unitPricing')),
        t('math-tips-tax', 'Mental math for tips & tax', 'The 10% Shift Trick', 'Find 10% by moving the decimal, then halve and double for 5%, 15% and 20%.', 1, em('tipsTax')),
        t('math-simple-interest', 'Simple interest', 'The True Cost of Layaway or Short-Term Loans', 'I = P × r × t, and how a small fee on a short loan becomes a huge yearly rate.', 2, em('simpleInterest')),
      ] },
      { title: 'Kitchen, workshop & practical measurement', topics: [
        t('math-recipe-fractions', 'Fractions & recipe scaling', 'Halving and Tripling a Cookie Recipe', 'Multiplying and dividing fractions to scale a recipe up or down.', 1, em('recipeFractions')),
        t('math-perimeter-area', 'Perimeter vs. area', 'How Much Paint or Carpet Do I Need?', 'Length around the edge for trim and fencing; surface for flooring and paint.', 1, em('perimeterArea')),
        t('math-conversions', 'Unit conversions', 'Metric vs. Imperial in Daily Life', 'Grams and ounces, miles and kilometers, Celsius and Fahrenheit.', 2, em('unitConversions')),
        t('math-volume', 'Volume & capacity', 'Will It All Fit in the Box?', 'Cubic inches and liters for storage, luggage and containers.', 2, em('volumeCapacity')),
      ] },
      { title: 'Pre-algebra & logical thinking', topics: [
        t('math-order-ops', 'Order of operations', 'Why Viral Math Memes Confuse the Internet', 'Operator precedence, and why some famous puzzles are really badly written.', 1, em('orderOfOperations')),
        t('math-solve-x', 'Solving for x', 'Finding the Missing Item on the Receipt', 'One-variable equations for a missing price, with and without tax.', 2, em('solvingForX')),
        t('math-negatives', 'Negative numbers', 'Below Zero: Elevation, Cold Weather & Overdrafts', 'Adding and subtracting across zero with balances and temperatures.', 1, em('negativeNumbers')),
        t('math-ratios', 'Ratios & proportions', 'Mixing Paint, Concrete, or Gasoline', 'Part-to-part ratios like 50:1 fuel mix, scaled to any batch size.', 2, em('ratios')),
      ] },
      { title: 'Basic geometry & spatial skills', topics: [
        t('math-345', 'The 3-4-5 rule', 'How Builders Make Perfectly Square Corners', 'Right triangles and the Pythagorean theorem with only a tape measure.', 2, em('threeFourFive')),
        t('math-angles', 'Angles in the wild', 'Solar Panels & Roof Pitches', 'Acute, right and obtuse angles, and slope as rise over run.', 1, em('anglesInTheWild')),
        t('math-scale', 'Scale maps & blueprints', 'Reading the Map Legend', 'Turning a measurement on paper into a real distance.', 2, em('scaleMaps')),
        t('math-tessellations', 'Symmetry & tessellations', 'The Math of Floor Tiling', 'Why some shapes tile with no gaps: the angles at each corner add to 360°.', 2, em('tessellations')),
      ] },
      { title: 'Everyday data & probability', topics: [
        t('math-mean-median', 'Mean & median', 'What\'s Your Typical Video Game Score?', 'When the average misleads, and when the middle value is the honest one.', 1, em('meanMedian')),
        t('math-probability', 'Basic probability', 'Coin Flips & Dice Rolls', 'Single-event odds, and what "40% chance of rain" really means.', 1, em('probability')),
        t('math-charts', 'Reading visual charts', 'Tracking Your Daily Screen Time', 'Bar, line and pie charts, and the tricks that make small changes look big.', 1, em('readingCharts')),
        t('math-fermi', 'Fermi estimation', 'How Many Ping Pong Balls Fit in a Bus?', 'Breaking a huge unknown into small, sensible guesses.', 3, em('fermiEstimation')),
      ] },
      { title: 'Personal finance & wealth mechanics', topics: [
        t('math-exponential', 'Exponential vs. linear growth', 'The $1,000 Cash vs. The Doubling Penny', 'Compound growth against steady growth. (A penny doubled daily from day 1 passes $1,000 on day 18.)', 2, { related: { screen: 'BusinessAndFinance', topicKey: 'compoundInterest' } }),
        t('math-amortization', 'Loan amortization', 'Where Does My Mortgage Payment Actually Go?', 'Why early loan payments are mostly interest, and how that shifts over time.', 3),
        t('math-tax-brackets', 'Marginal tax brackets', 'The Pay Raise Trap Myth', 'A higher bracket only taxes the dollars above the line. Benefit cliffs are a separate thing, and they are real.', 2),
        t('math-tvm', 'Time value of money & inflation', 'What Will $100,000 Buy in 30 Years?', 'Discounting future money against inflation.', 3),
        t('math-margins', 'Unit rates & profit margins', 'Bulk Buy vs. Hidden Cost', 'Markup versus margin, and cost per unit.', 2),
      ] },
      { title: 'Risk, probability & decision science', topics: [
        t('math-expected-value', 'Expected value', 'Why the House Always Wins', 'Long-run payouts in roulette, lotteries and extended warranties.', 2),
        t('math-bayes', 'Bayes\' theorem', 'Understanding False Positives', 'Why a positive result on a rare condition can still probably be wrong.', 3),
        t('math-correlation', 'Correlation vs. causation', 'Spurious Correlations in Big Data', 'Confounding variables and the statistics behind misleading headlines.', 2),
        t('math-skew', 'Mean vs. median in skewed data', 'Why Average Salary Figures Lie', 'How a few extreme values distort income and house-price averages.', 2, { related: { screen: 'EverydayMath', topicKey: 'meanMedian' } }),
        t('math-chart-scams', 'Misleading data visualization', 'Spotting the Chart Scam', 'Truncated axes, distorted pies and cherry-picked dates.', 2, { related: { screen: 'EverydayMath', topicKey: 'readingCharts' } }),
      ] },
      { title: 'Business, strategy & economics', topics: [
        t('math-break-even', 'Linear equations & break-even', 'Pricing Your Side Hustle', 'The sales volume that covers fixed costs plus the cost of each unit.', 2),
        t('math-game-theory', 'Game theory & Nash equilibrium', 'The Pricing War Dilemma', 'Competitor strategy through the prisoner\'s dilemma.', 3),
        t('math-optimization', 'Optimization & quadratics', 'Finding Peak Profit', 'Plotting price against revenue to find the top of the curve.', 3),
        t('math-systems', 'Systems of equations', 'Resource & Inventory Allocation', 'Several unknowns, several constraints, one plan.', 3),
      ] },
      { title: 'Technology, cryptography & computer science', topics: [
        t('math-modular', 'Modular arithmetic & encryption', 'The Clock Math Guarding Your Passwords', 'How remainders underpin public-key encryption like RSA.', 3),
        t('math-graphs', 'Graph theory & logistics', 'The Delivery Route Optimization', 'Shortest paths through a network, the idea behind Dijkstra\'s algorithm.', 3),
        t('math-vectors', 'Vectors & transformations', 'How Video Game Engines Move Objects', 'Matrices that scale, rotate and move objects in 2D and 3D.', 3),
        t('math-markov', 'Markov chains', 'How Auto-Complete Guesses Your Next Word', 'A simple word-prediction table: the ancestor of modern autocomplete, which now uses neural networks.', 3),
      ] },
      { title: 'Spatial design, geometry & physics', topics: [
        t('math-surface-volume', 'Surface area & volume optimization', 'The Can Maker\'s Dilemma', 'The container shape that holds the most for the least material.', 3),
        t('math-trig', 'Trigonometry & trilateration', 'How GPS Pinpoints Your Phone', 'GPS works from distances to satellites (trilateration), not angles. Trigonometry measures heights and distances you can\'t reach.', 3),
        t('math-fractals', 'Fractals & the coastline paradox', 'Why You Can\'t Measure a Coastline', 'Self-similar shapes in nature, antennas and computer graphics.', 3),
        t('math-golden-ratio', 'The golden ratio', 'The Geometry of Great UI', 'What the golden ratio is, where it really shows up, and why many claims about it in art and design don\'t hold up.', 2),
      ] },
      { title: 'Conceptual calculus', topics: [
        t('math-derivatives', 'Derivatives: rates of change', 'Speed vs. Acceleration', 'Instant rates of change, from a speedometer to marginal cost.', 3),
        t('math-integrals', 'Integrals: accumulation', 'Calculating Total Power Usage', 'Adding up a changing rate over time.', 3),
        t('math-limits', 'Limits & infinite series', 'Zeno\'s Paradox & Continuous Compounding', 'How infinitely many small pieces can add up to a finite total.', 3),
      ] },
      { title: 'Everyday applied problem solving', topics: [
        t('math-log-scales', 'Logarithmic scales', 'Decibels, Earthquakes, and pH', 'Each step on a log scale multiplies. A magnitude 7 quake shakes about 10 times harder than a 6 and releases about 32 times the energy.', 2),
        t('math-scale-models', 'Proportion & scale models', 'Architectural Blueprints to Scale Models', 'Keeping proportions right when converting between sizes.', 2),
      ] },
    ],
  },

  // ── Language Arts ─────────────────────────────────────────────────────────
  {
    subject: 'Language Arts',
    groups: [
      { title: 'Learning how to learn', topics: [
        t('la-feynman', 'The Feynman Technique', 'Master Any Topic in 4 Steps', 'Explain it simply to find the gaps in what you know.', 1, { built: { quest: 'feynman' } }),
        t('la-active-recall', 'Active recall & spaced repetition', 'Why Rereading Tricks You', 'Testing yourself on a schedule beats rereading, and why.', 1),
        t('la-source-evaluation', 'Evaluating sources', 'Who Made This, and Why?', 'Checking who wrote something, when, and what evidence it shows.', 1, { related: { screen: 'MediaDigitalLiteracy', topicKey: 'evaluatingSources' } }),
      ] },
      { title: 'Critical media literacy & rhetoric', topics: [
        t('la-bias-fallacies', 'Spotting bias & fallacies', 'The Clickbait Audit', 'Strawmen, personal attacks and confirmation bias in headlines and posts.', 1, { related: { screen: 'MediaDigitalLiteracy', topicKey: 'identifyingPurposeBias' } }),
        t('la-ethos-pathos-logos', 'Ethos, pathos, logos', 'The Super Bowl Ad Deconstruction', 'How ads use credibility, emotion and logic to persuade.', 2),
        t('la-fact-opinion', 'Fact vs. opinion vs. inference', 'Reading Between the Lines', 'Telling stated facts, personal views and reasonable deductions apart.', 1),
        t('la-propaganda', 'Propaganda & persuasion', 'Visual Rhetoric in Memes & Posters', 'How layout, type and wording steer opinion.', 2),
      ] },
      { title: 'Practical communication & synthesis', topics: [
        t('la-summary', 'Concise synthesis', 'The 280-Character Summary', 'Cutting a long report to its core without losing what matters.', 2),
        t('la-active-passive', 'Active vs. passive voice', 'Who Actually Did It?', 'Rewriting "mistakes were made" so it says who made them.', 1),
        t('la-register', 'Tone & register', 'Code-Switching from Text to Proposal', 'Turning a casual idea into a formal email or summary.', 2, { related: { screen: 'Language', topicKey: 'registersStyleChoices' } }),
        t('la-cer', 'Claim, evidence, reasoning', 'The Bulletproof Argument', 'A three-part structure for pitching an idea or winning a debate.', 2, { related: { screen: 'Writing', topicKey: 'opinionArgumentative' } }),
      ] },
      { title: 'Analytical reading & story structure', topics: [
        t('la-heros-journey', 'The hero\'s journey', 'Mapping Blockbusters & Myths', 'The stages of the monomyth across myths, movies and games.', 2),
        t('la-motivation', 'Character motivation & conflict', 'Unpacking the Villain', 'Inner and outer drives behind complex characters.', 2),
        t('la-subtext', 'Subtext & symbolism', 'What the Blue Curtain Actually Means', 'How repeated images, colors and settings carry meaning, and when they don\'t.', 3, { related: { screen: 'Reading', topicKey: 'literaryDevices' } }),
        t('la-citation', 'Using textual evidence', 'The Citation Challenge', 'Quoting just enough to support a point, without plagiarizing.', 2, { related: { screen: 'Writing', topicKey: 'citingEvidence' } }),
      ] },
      { title: 'Word power & mechanics', topics: [
        t('la-roots', 'Etymology & root words', 'Unlocking 100 Words with 1 Root', 'Greek and Latin roots like chron, path and scrib for decoding new words.', 1, { related: { screen: 'Reading', topicKey: 'wordRootsAffixes' } }),
        t('la-connotation', 'Connotation vs. denotation', 'Slim, Skinny, or Slender?', 'How near-synonyms carry different feelings.', 1, { related: { screen: 'Language', topicKey: 'nuancesWordMeaning' } }),
        t('la-punctuation', 'Punctuation that changes meaning', 'Punctuation That Changes the Law', 'Commas and dashes that change a sentence, including a real lawsuit decided by a missing Oxford comma.', 2, { related: { screen: 'Language', topicKey: 'punctuationMechanics' } }),
      ] },
    ],
  },

  // ── Social Sciences ───────────────────────────────────────────────────────
  {
    subject: 'Social Sciences',
    groups: [
      { title: 'Psychology & human behavior', topics: [
        t('ss-cognitive-bias', 'Cognitive biases in action', 'The Confirmation Bias Experiment', 'How search results and existing beliefs build echo chambers.', 1),
        t('ss-habit-loops', 'Conditioning & habit loops', 'Gamifying Your Own Brain', 'Cues, routines and rewards, in habits and in the apps that use them.', 1),
        t('ss-social-proof', 'Social proof & the bystander effect', 'Why Crowds Don\'t Always Help', 'What the studies on conformity and shared responsibility found.', 2, { related: { screen: 'PsychologicalAndSociology', topicKey: 'socialThinking' } }),
        t('ss-dissonance', 'Cognitive dissonance', 'Why We Justify Bad Choices', 'How people resolve the gap between what they believe and what they did.', 2),
      ] },
      { title: 'Civics, law & government', topics: [
        t('ss-local-gov', 'How local government works', 'Where Do Your Taxes Actually Go?', 'City budgets, zoning boards and how public services are paid for.', 1),
        t('ss-free-speech', 'Landmark rights & free speech', 'Speech vs. Harassment', 'Key Supreme Court cases on the limits of the First Amendment.', 2, { related: { screen: 'CivicsAndGovernment', topicKey: 'rulesRightsConstitution' } }),
        t('ss-lobbying', 'Interest groups & lobbying', 'Follow the Money in Policy', 'How bills move through committees and who tries to shape them.', 2, { related: { screen: 'CivicsAndGovernment', topicKey: 'congressLawmaking' } }),
        t('ss-systems', 'Systems of power', 'Democracy vs. Autocracy vs. Technocracy', 'Who decides, and who they answer to, under different systems.', 2),
      ] },
      { title: 'History & primary sources', topics: [
        t('ss-historiography', 'Historiography & perspective', 'Who Wrote the History Book?', 'How two countries teach the same war differently.', 2),
        t('ss-primary-secondary', 'Primary vs. secondary sources', 'Letters from the Trenches', 'Original letters, photos and treaties against later interpretations.', 1),
        t('ss-cause-effect', 'Cause-and-effect networks', 'The Butterfly Effect of the Printing Press', 'How one invention fed revolutions, literacy and shifts in power.', 2),
        t('ss-historical-empathy', 'Historical empathy', 'Decisions in Crisis', 'Judging past choices, like the Cuban Missile Crisis, by what leaders knew then.', 3),
      ] },
      { title: 'Sociology & cultural geography', topics: [
        t('ss-demographics', 'Demographics & population pyramids', 'Predicting the Future of Nations', 'Reading age charts to anticipate jobs, schools and retirement systems.', 2),
        t('ss-urban-planning', 'Urban planning & social design', 'How City Layouts Shape Community', 'Walkable neighborhoods versus car-dependent ones, and how people get around and meet.', 2),
        t('ss-globalization', 'Cultural diffusion & globalization', 'The Global Journey of Your Sneakers', 'The supply chains and labor behind everyday things.', 2, { related: { screen: 'Geography', topicKey: 'humanPhysicalGeography' } }),
        t('ss-incentives', 'Incentives & systemic design', 'Why Good People Follow Bad Systems', 'How rules and rewards shape behavior in organizations and societies.', 3),
      ] },
    ],
  },

  // ── Science ───────────────────────────────────────────────────────────────
  {
    subject: 'Science',
    groups: [
      { title: 'Brain & focus', topics: [
        t('sci-circadian', 'Circadian rhythms & light', 'Setting Your Internal Clock', 'How light reaching your eyes sets the body clock that times sleep.', 1, { built: { quest: 'morning-light' } }),
        t('sci-dopamine', 'What dopamine actually does', 'Understanding the Reward Circuit', 'Dopamine is about motivation and learning more than pleasure, and what research does and doesn\'t support about "dopamine detox".', 2),
        t('sci-caffeine', 'Caffeine & sleep pressure', 'Adenosine & The Caffeine Hack', 'How caffeine blocks the brain\'s build-up of sleepiness, and why a late coffee can cost you deep sleep.', 2),
        t('sci-neuroplasticity', 'Neuroplasticity & skill learning', 'How the Brain Rewires Itself', 'Practice, recall and sleep, and how they turn effort into skill.', 2),
      ] },
      { title: 'Body & physiology', topics: [
        t('sci-blood-sugar', 'Blood sugar & energy', 'The Science of Energy Crashes', 'What blood sugar does after a meal, and what the evidence says about fiber, protein and meal order.', 2),
        t('sci-gut-brain', 'The gut microbiome', 'Feeding Your Second Brain', 'Gut cells make most of the body\'s serotonin, but it doesn\'t reach the brain. What gut bacteria really do with fiber.', 3),
        t('sci-breathing', 'Breathing & the stress response', 'Calming the Alarm System', 'How slow breathing and long exhales can settle the body\'s stress response.', 1),
        t('sci-muscle', 'How muscle grows', 'The Mechanics of Strength', 'Training load, protein and recovery, and how they build muscle.', 2),
      ] },
      { title: 'Kitchen chemistry', topics: [
        t('sci-maillard', 'The Maillard reaction vs. caramelization', 'The Chemistry of Flavor', 'Why browning creates flavor, and why a pinch of baking soda speeds it up.', 2),
        t('sci-acids-bases', 'Acids, bases & cleaning', 'Stop Mixing Vinegar and Baking Soda', 'They cancel each other out. Use alkaline cleaners for grease and acids for hard-water scale, and never mix bleach with ammonia or acids.', 1),
        t('sci-emulsions', 'Emulsions', 'Making Oil and Water Mix', 'How egg yolk and mustard hold dressings and mayonnaise together.', 2),
        t('sci-skincare', 'Skincare chemistry', 'Active Ingredients in the Lab', 'What common active ingredients do, and how to read the claims on the label.', 3),
      ] },
      { title: 'Home physics', topics: [
        t('sci-heat-loss', 'Heat transfer & home efficiency', 'Why Your House Loses Heat', 'Conduction, convection and radiation, and what an insulation R-value means.', 2, { related: { screen: 'Physics', topicKey: 'motionThermodynamics' } }),
        t('sci-co2', 'Indoor air & CO₂', 'The CO₂ Stagnation Effect', 'Measuring CO₂ in a closed room, and what studies agree and disagree on about stuffy air and thinking.', 2),
        t('sci-humidity', 'Humidity, dew point & mold', 'The Physics of Comfort', 'Relative humidity versus dew point, and keeping mold away.', 2),
        t('sci-soundproofing', 'Sound & noise insulation', 'Soundproofing Your Space', 'How sound travels through walls, and why foam panels mostly don\'t block it.', 3),
      ] },
      { title: 'Environment & household health', topics: [
        t('sci-plastics', 'Plastics in the kitchen', 'Plastics in the Kitchen', 'What is known and unknown about chemicals leaching from heated plastic, and simple alternatives.', 2),
        t('sci-water', 'Water chemistry & filtration', 'Hard Water vs. Pure Water', 'Hard and soft water, what filters actually remove, and reading your water quality report.', 2),
        t('sci-sunscreen', 'UV & sunscreen', 'UV-A vs. UV-B Radiation', 'UV-A ages skin and UV-B burns it. Both chemical and mineral filters work mostly by absorbing UV.', 1),
      ] },
    ],
  },

  // ── Art & Music ───────────────────────────────────────────────────────────
  {
    subject: 'Art & Music',
    groups: [
      { title: 'Color, light & visual design', topics: [
        t('art-color-branding', 'Color in branding & spaces', 'Why Tech Is Blue and Fast Food Is Red', 'Hue, saturation and contrast, and what color can and can\'t do to people.', 1, { related: { screen: 'VisualArt', topicKey: 'elementsPrinciples' } }),
        t('art-light-temp', 'Light temperature & mood', 'Warm vs. Cool Light in Photography & Decor', 'Color temperature in kelvins, and key, fill and back light.', 2, { related: { screen: 'VisualArt', topicKey: 'photographyDigital' } }),
        t('art-rule-of-thirds', 'The rule of thirds & visual hierarchy', 'Guiding the Human Eye', 'Grids, focal points and empty space in photos, slides and rooms.', 1),
        t('art-typography', 'Typography & legibility', 'The Psychology of Fonts', 'Size, spacing, line length and contrast, and what makes text easy to read.', 2),
      ] },
      { title: 'Music theory & sound', topics: [
        t('mus-harmony', 'Consonance & dissonance', 'Why Minor Chords Sound Sad', 'Sound waves and frequency ratios, and how much of "minor sounds sad" is learned culture.', 2, { related: { screen: 'Music', topicKey: 'harmonyMelody' } }),
        t('mus-tempo', 'Tempo & energy', 'Pacing Your Brain & Heart', 'Beats per minute, and how music changes how work and exercise feel.', 1, { related: { screen: 'Music', topicKey: 'rhythmMeter' } }),
        t('mus-earworm', 'The anatomy of an earworm', 'Deconstructing Pop Song Hooks', 'Verse, chorus and bridge, syncopation, and tension and release.', 2),
        t('mus-spatial', 'Acoustics & spatial audio', 'Panning, Reverb, and Soundstage', 'How EQ and panning place sounds around you in headphones.', 3, { related: { screen: 'Music', topicKey: 'recordingTechniques' } }),
      ] },
      { title: 'Production, film & media', topics: [
        t('mus-leitmotif', 'Film scoring & leitmotifs', 'How Music Tells the Story First', 'Recurring themes that announce a character before anyone speaks.', 2),
        t('art-framing', 'Camera framing & visual storytelling', 'Power Dynamic Shots', 'High and low angles, color grading and lenses, and what they signal.', 2),
        t('mus-sampling', 'Sampling, remixing & copyright', 'Where Originality Meets Borrowing', 'The Amen break across decades of music, and sampling versus interpolation.', 3, { related: { screen: 'Music', topicKey: 'synthesisSampling' } }),
        t('art-interior', 'Interior design & spatial balance', 'Aesthetics of Living Spaces', 'Contrast, texture, scale and walkways in a room.', 2, { related: { screen: 'HouseholdAndResourceManagement', topicKey: 'interiorDesign' } }),
      ] },
      { title: 'Aesthetics & creative practice', topics: [
        t('art-golden-ratio', 'The golden ratio in design', 'Nature\'s Blueprint in Art', 'Where the ratio really appears, and the popular claims about famous art that don\'t stand up.', 2),
        t('art-critique', 'How to critique art', 'How to Critique Art Objectively', 'Describe, analyze, interpret, evaluate: talking about work beyond "I just like it."', 1, { related: { screen: 'VisualArt', topicKey: 'artHistoryCriticism' } }),
        t('mus-active-listening', 'Active listening', 'Deconstructing a Mix', 'Training your ear to pick out the bass line, rhythm parts and vocal doubles.', 2, { related: { screen: 'Music', topicKey: 'criticalListening' } }),
      ] },
    ],
  },

  // ── Home Economics & Workshop ─────────────────────────────────────────────
  {
    subject: 'Home Economics & Workshop',
    groups: [
      { title: 'Home maintenance & safety', topics: [
        t('he-shutoffs', 'Emergency shutoffs', 'Stopping a House Emergency in 30 Seconds', 'Finding the main water valve and the breaker panel. If you smell gas, leave and call the gas company from outside.', 1),
        t('he-anchors', 'Drywall repair & wall anchors', 'Hanging Heavy Objects Without Destroying Walls', 'Matching the anchor to the weight, and patching holes cleanly.', 2),
        t('he-plumbing', 'Basic plumbing', 'Clearing Clogs & Fixing Running Toilets', 'P-traps, toilet flappers, and clearing drains without harsh chemicals.', 2),
        t('he-hvac', 'Heating, cooling & airflow', 'Extending Appliance Lifespan', 'Filter ratings, airflow and seasonal upkeep that lower bills.', 2),
      ] },
      { title: 'Cooking fundamentals', topics: [
        t('he-knife', 'Knife skills & blade care', 'Prep Work at Chef Speed', 'The pinch grip, basic cuts, and honing versus sharpening.', 1, { related: { screen: 'NutritionAndFood', topicKey: 'culinaryTechniques' } }),
        t('he-seasoning', 'Flavor balancing', 'Fixing a Ruined Dish in Real Time', 'Using salt, fat, acid, heat and sweetness to rescue a dish.', 2),
        t('he-food-safety', 'Food safety & storage', 'Meal Prep Without Food Poisoning', 'The 40°F–140°F danger zone (USDA), cross-contamination, and freezing safely.', 1, { related: { screen: 'NutritionAndFood', topicKey: 'foodSafety' } }),
        t('he-cookware', 'Cookware care', 'The Cast Iron & Stainless Steel Playbook', 'Seasoning cast iron, stopping food sticking to steel, and making pans last.', 2),
      ] },
      { title: 'Textiles & garment care', topics: [
        t('he-sewing', 'Hand sewing & repairs', 'Saving Your Favorite Clothes', 'Running stitch, backstitch and reattaching buttons.', 1, { related: { screen: 'TextilesAndApparel', topicKey: 'sewingTechniques' } }),
        t('he-laundry', 'Laundry & fabric care', 'Reading Clothing Tags Like a Pro', 'Care symbols, natural versus synthetic fibers, and avoiding shrinking.', 1, { related: { screen: 'TextilesAndApparel', topicKey: 'textileCare' } }),
        t('he-hemming', 'Hemming & simple tailoring', 'Custom-Fitting Your Wardrobe', 'Measuring, pinning and hemming pants or sleeves.', 2),
        t('he-stains', 'Stain removal', 'The Protein vs. Oil Stain Matrix', 'Matching the treatment to the stain before it goes in the wash.', 2),
      ] },
      { title: 'Tools & carpentry', topics: [
        t('he-hardware', 'Screws, bolts & nails', 'Screws, Bolts, and Nails Decoded', 'Drive types, wood versus machine screws, and what survives outdoors.', 1),
        t('he-power-tools', 'Power tool basics', 'Drilling, Driving & Sawing Safely', 'Clutch settings, pilot holes, bits, and preventing kickback.', 2, { related: { screen: 'ToolSafetyAndShopPractices', topicKey: 'ppe' } }),
        t('he-measuring', 'Measuring & marking', 'Measure Twice, Cut Once', 'Tape-hook play, blade width (kerf) and square layout lines.', 1, { related: { screen: 'MaterialWorking', topicKey: 'woodworking' } }),
        t('he-finishing', 'Sanding & finishing', 'Prep to Paint or Stain', 'Grit order, stains, and protective topcoats.', 2),
      ] },
      { title: 'Preventive upkeep', topics: [
        t('he-seasonal', 'Seasonal home care', 'The Twice-a-Year Maintenance Audit', 'Weatherstripping, water heaters, gutters and seals.', 2),
        t('he-small-engines', 'Small engine care', 'Keeping Equipment Alive for Decades', 'Oil, spark plugs, filters, and storing gas engines for winter.', 3, { related: { screen: 'Automotive', topicKey: 'engineFundamentals' } }),
      ] },
    ],
  },

  // ── Technology & Engineering ──────────────────────────────────────────────
  {
    subject: 'Technology & Engineering',
    groups: [
      { title: 'Cybersecurity & digital self-defense', topics: [
        t('tech-passwords', 'Password strength', 'Why "P@ssword1" Cracks in Seconds', 'Length and randomness beat symbols, and why reuse is the bigger risk.', 1, { built: { quest: 'password-strength' } }),
        t('tech-phishing', 'Phishing & social engineering', 'Spotting the Fake Before Clicking', 'Spoofed addresses, lookalike domains and pressure tactics.', 1),
        t('tech-vpn', 'VPNs & network privacy', 'What VPNs Shield (and What They Don\'t)', 'Encryption on public Wi-Fi, and the tracking a VPN can\'t stop.', 2),
        t('tech-2fa', 'Two-step sign-in & "Log in with Google"', 'How "Log in with Google" Works', 'Sign-in tokens, authenticator codes, and why text-message codes can be hijacked.', 2),
      ] },
      { title: 'Web & cloud', topics: [
        t('tech-dns', 'DNS & routing', 'Tracing a Click Around the World', 'How a web address becomes a server somewhere, step by step.', 2),
        t('tech-apis', 'APIs & webhooks', 'How Apps Talk to Each Other', 'Requests, responses and JSON behind the apps you use.', 2, { related: { screen: 'TechnologyAndEngineering', topicKey: 'restfulApis' } }),
        t('tech-https', 'HTTPS & encryption', 'The Digital Handshake', 'How public and private keys protect a payment over an open network.', 3),
        t('tech-cloud', 'Where "the cloud" lives', 'Where Does "The Cloud" Actually Live?', 'Data centers, virtual machines and why things stay up when servers fail.', 2),
      ] },
      { title: 'Computer systems', topics: [
        t('tech-cpu-ram', 'CPU, memory & storage', 'The Silicon Orchestra', 'How a processor, RAM and an SSD work together.', 1),
        t('tech-binary', 'Binary & logic gates', 'How Switches Think', 'Building AND, OR and NOT from switches, and how 1s and 0s become software.', 2, { related: { screen: 'TechnologyAndEngineering', topicKey: 'algorithmsSequencing' } }),
        t('tech-git', 'Version control with Git', 'Time Travel for Digital Work', 'Commits, branches and merges for code or any shared project.', 2),
        t('tech-os', 'Operating systems', 'The Master Traffic Controller', 'How an OS shares the processor and memory between apps.', 3),
      ] },
      { title: 'Engineering thinking & physical design', topics: [
        t('tech-root-cause', 'Root cause analysis', 'The 5 Whys & Fault Trees', 'Systematic troubleshooting for software or hardware.', 1),
        t('tech-redundancy', 'Redundancy & fail-safes', 'Designing Systems That Keep Working', 'Backups in aircraft, websites and machines, and why nothing is truly fail-proof.', 2),
        t('tech-3d-printing', '3D printing & CAD', 'From Digital Pixels to Physical Plastic', 'Slicer settings, layer height, infill and materials.', 2, { related: { screen: 'TechnologyAndEngineering', topicKey: 'cadModeling' } }),
        t('tech-iot', 'Microcontrollers & sensors', 'Making Everyday Objects Smart', 'Connecting sensors to an Arduino or Raspberry Pi to automate things.', 3),
      ] },
      { title: 'AI, data & automation', topics: [
        t('tech-llms', 'How LLMs predict text', 'Demystifying Generative AI', 'Tokens, training and "temperature", explained without heavy math.', 2),
        t('tech-automation', 'Scripting & automation', 'Building Your First Bot', 'Small scripts for repetitive tasks, and respecting sites\' rules.', 2),
        t('tech-big-o', 'Algorithms & speed', 'Why Some Software Runs Slow', 'An intuitive take on Big O, from sorting books to searching lists.', 3),
      ] },
    ],
  },

  // ── Foreign Language (and world cultures) ────────────────────────────────
  {
    subject: 'Foreign Language',
    groups: [
      { title: 'How to learn a language', topics: [
        t('fl-frequency', 'High-frequency vocabulary', 'Start With the Words People Actually Use', 'Why a core of a few hundred to a couple of thousand common words covers most everyday speech.', 1),
        t('fl-srs', 'Spaced repetition & memory tricks', 'Hacking the Forgetting Curve', 'Review schedules and memorable images that make new words stick.', 1),
        t('fl-input', 'Comprehensible input', 'Learning From What You Understand', 'Krashen\'s idea of learning from input just above your level, and what it gets right.', 2),
        t('fl-phonetics', 'Pronunciation & the IPA', 'Training Your Mouth for New Sounds', 'Using the phonetic alphabet to learn rolled Rs, nasal vowels and tones.', 2),
      ] },
      { title: 'Language & mind', topics: [
        t('fl-relativity', 'Does language shape thought?', 'Does Your Language Change How You Think?', 'The Sapir-Whorf idea, and what the evidence does and doesn\'t show.', 3),
        t('fl-untranslatable', 'Untranslatable words', 'Decoding "Ikigai", "Schadenfreude", and "Saudade"', 'Words that capture a culture\'s values and feelings.', 1),
        t('fl-politeness', 'Politeness & formality', 'Formality Levels from Tokyo to Madrid', 'Tú and usted, tu and vous, and Japanese keigo.', 2, { related: { screen: 'ForeignLanguage', topicKey: 'greetingsManners' } }),
        t('fl-loanwords', 'Loanwords & language change', 'How English Borrowed From Everyone', 'How trade, conquest and the internet blend languages.', 2),
      ] },
      { title: 'Communicating across cultures', topics: [
        t('fl-context', 'High- and low-context communication', 'Saying "No" Without Saying "No"', 'Direct versus indirect styles, as a rough model rather than a rule about people.', 2),
        t('fl-proxemics', 'Body language & personal space', 'Personal Space Across Borders', 'Gestures, eye contact and distance norms around the world.', 1),
        t('fl-hospitality', 'Hospitality & gift-giving', 'The Unwritten Rules of the Guest', 'Host duties and how gifts are offered and received.', 2),
        t('fl-time', 'How cultures see time', 'What "On Time" Means Around the World', 'Schedules as strict versus flexible, and the misunderstandings that follow.', 2),
      ] },
      { title: 'World societies', topics: [
        t('fl-individualism', 'Individualism & collectivism', 'The "Me" vs. "We" Dynamic', 'Family duty, workplace hierarchy and community, through Hofstede\'s model.', 2),
        t('fl-rites', 'Rites of passage', 'How World Cultures Mark Adulthood', 'Quinceañeras, bar and bat mitzvahs, Seijin no Hi and land diving.', 1),
        t('fl-foodways', 'Foodways & culinary heritage', 'Why Food Is a Cultural Fingerprint', 'How geography, religion and trade shaped national dishes.', 1, { related: { screen: 'NutritionAndFood', topicKey: 'specialDiets' } }),
        t('fl-endangered', 'Cities & endangered languages', 'Mega-Cities and Vanishing Languages', 'Modernization, and the work to keep endangered languages alive.', 3),
      ] },
    ],
  },

  // ── Health & Fitness ──────────────────────────────────────────────────────
  {
    subject: 'Health & Fitness',
    groups: [
      { title: 'Movement & training', topics: [
        t('hf-overload', 'Progressive overload', 'Work Smarter, Not Just Harder', 'Adding challenge gradually to build strength without injury.', 1),
        t('hf-zones', 'Heart-rate zones', 'The Engine vs. The Turbo', 'Easy aerobic work versus hard intervals, and what each builds.', 2, { related: { screen: 'HealthAndFitness', topicKey: 'cardiovascularHeartRate' } }),
        t('hf-mobility', 'Joint mobility', 'Moving Well for Life', 'Mobility versus stretching, and movement that can ease stiffness.', 1),
        t('hf-posture', 'Posture & ergonomics', 'Un-Sitting Your Spine', 'Desk setups and short movement breaks for long days of sitting.', 1),
      ] },
      { title: 'Nutrition & energy', topics: [
        t('hf-macros', 'Protein, fats & carbs', 'Protein, Fats, and Carbs Decoded', 'What each does, and how meals affect fullness.', 1, { related: { screen: 'HealthAndFitness', topicKey: 'macronutrientEnergyBalance' } }),
        t('hf-micros', 'Vitamins & minerals', 'The Silent Energy Robbers', 'Common shortfalls like vitamin D and iron, food sources, and why to ask a doctor before supplements.', 2, { related: { screen: 'NutritionAndFood', topicKey: 'macroMicro' } }),
        t('hf-hydration', 'Hydration & electrolytes', 'Water Isn\'t Always Enough', 'Sodium, potassium and fluids, and when plain water is plenty.', 2),
        t('hf-ultra-processed', 'Ultra-processed foods', 'Decoding the Bliss Point', 'How food engineering makes some foods hard to stop eating.', 2),
      ] },
      { title: 'Sleep & recovery', topics: [
        t('hf-sleep-stages', 'Sleep stages', 'What Happens While You Sleep', 'Deep sleep and REM, and what each does for body and memory.', 1),
        t('hf-hrv', 'Heart-rate variability', 'Reading Your Internal Barometer', 'What HRV on a wearable measures, and how far to trust it.', 3),
        t('hf-recovery', 'Recovery & rest days', 'Growing on the Rest Days', 'Why rest builds fitness, and what research does and doesn\'t show about saunas and cold plunges.', 2),
      ] },
      { title: 'Mind & stress', topics: [
        t('hf-stress', 'Stress & the body', 'Resetting the Fight-or-Flight Response', 'What long-term stress does to the body, and ways to switch it off.', 1, { related: { screen: 'HealthAndWellness', topicKey: 'stressManagement' } }),
        t('hf-gut-brain', 'The gut-brain connection', 'Microbes and Mental Health', 'What is and isn\'t known about gut health and mood.', 3),
        t('hf-attention', 'Protecting your attention', 'Protecting Your Focus', 'Notifications, feeds and overload, and practical limits that work.', 1),
      ] },
      { title: 'Prevention & long-term health', topics: [
        t('hf-bloodwork', 'Understanding common blood tests', 'Reading Your Own Health Dashboard', 'What routine blood tests measure, and questions to ask your doctor about the results.', 3),
        t('hf-healthspan', 'Healthspan vs. lifespan', 'The Longevity Equation', 'Strength, balance and fitness as the basis of staying independent.', 2),
        t('hf-immune', 'Immune system basics', 'Building Your Internal Shield', 'Innate and adaptive immunity, and how sleep, activity and food support them.', 2),
      ] },
    ],
  },

  // ── Business & Finance ────────────────────────────────────────────────────
  {
    subject: 'Business & Finance',
    groups: [
      { title: 'Money management & debt', topics: [
        t('bf-credit', 'Credit scores', 'Demystifying the 3-Digit Score', 'Payment history, how much of your limit you use, and account age, and why they change loan rates.', 2),
        t('bf-debt-payoff', 'Snowball vs. avalanche', 'Psychology vs. Math in Debt', 'Paying the smallest balance first versus the highest rate first.', 2),
        t('bf-budgeting', 'Budgeting systems', 'Giving Every Dollar a Job', '50/30/20 and zero-based budgets, without tracking burnout.', 1, { built: { quest: 'budget-50-30-20' } }),
        t('bf-emergency-fund', 'Emergency funds', 'Building the Financial Airbag', 'Working out your real monthly costs, and what a cushion is for.', 1, { related: { screen: 'BusinessAndFinance', topicKey: 'budgetingFixedVariable' } }),
      ] },
      { title: 'Investing & markets', topics: [
        t('bf-index-funds', 'Index funds vs. stock picking', 'Why Most Fund Managers Trail the Index', 'Diversification, fees, and what the long-term data on actively managed funds shows.', 2),
        t('bf-stocks', 'What a stock is', 'Owning a Slice of the Company', 'Shares, market value, the P/E ratio and dividends.', 2),
        t('bf-bonds', 'Bonds & interest rates', 'The Fixed Income Balance', 'Why bond prices fall when interest rates rise.', 3),
        t('bf-allocation', 'Asset allocation & time horizon', 'Mixing Investments by Goal and Timeline', 'How stocks, bonds and cash differ in risk, and why the timeline matters.', 3, { related: { screen: 'BusinessAndFinance', topicKey: 'compoundInterest' } }),
      ] },
      { title: 'Entrepreneurship & business economics', topics: [
        t('bf-unit-economics', 'Unit economics', 'Can This Business Actually Make Money?', 'The cost to win a customer against what a customer is worth over time.', 2),
        t('bf-pricing', 'Pricing strategy', 'Cost-Plus vs. Value-Based Pricing', 'Pricing from your costs versus from what customers will pay.', 2),
        t('bf-mvp', 'Minimum viable product', 'Testing Ideas Before Spending Thousands', 'Landing pages, pre-orders and prototypes that test demand cheaply.', 1),
        t('bf-subscriptions', 'Subscriptions & churn', 'The Recurring Revenue Engine', 'Monthly recurring revenue, cancellations and keeping customers.', 3),
      ] },
      { title: 'Financial statements', topics: [
        t('bf-pnl', 'The income statement', 'Top-Line Revenue to Bottom-Line Profit', 'From sales through costs and expenses to profit.', 2),
        t('bf-cash-flow', 'Cash flow vs. profit', 'Why Profitable Businesses Go Bankrupt', 'Profit on paper versus cash that can pay the bills this week.', 2),
        t('bf-balance-sheet', 'The balance sheet', 'Assets = Liabilities + Equity', 'What a business owns, what it owes, and what\'s left.', 3),
      ] },
      { title: 'Housing, taxes & contracts', topics: [
        t('bf-rent-buy', 'Renting vs. buying', 'The Hidden Costs of Owning a Home', 'Taxes, insurance, repairs and fees next to rent, and what the down payment could have earned.', 3),
        t('bf-tax-basics', 'Taxes, deductions & business types', 'How Business Taxes Work', 'What a deduction is, and sole proprietorships versus LLCs. An LLC doesn\'t lower tax by itself.', 3),
        t('bf-contracts', 'Contract basics', 'Reading the Fine Print', 'Key clauses like scope, termination and non-competes, and when to get advice.', 2),
      ] },
    ],
  },
];

// Every catalog topic, flat, with its subject and group attached.
export function allCatalogTopics() {
  return TOPIC_CATALOG.flatMap(s => s.groups.flatMap(g => g.topics.map(topic => ({ ...topic, subject: s.subject, group: g.title }))));
}

export function catalogForSubject(subject) {
  return TOPIC_CATALOG.find(s => s.subject === subject) || null;
}

// "12 of 40 ready": counts for a subject, or the whole catalog.
export function catalogCounts(subject) {
  const topics = subject
    ? (catalogForSubject(subject)?.groups || []).flatMap(g => g.topics)
    : allCatalogTopics();
  return { total: topics.length, built: topics.filter(tp => tp.built).length };
}

export const LEVEL_LABELS = { 1: 'Start here', 2: 'Build on it', 3: 'Go deeper' };
