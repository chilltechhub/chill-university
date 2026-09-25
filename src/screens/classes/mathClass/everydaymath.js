// src/screens/classes/mathClass/everydaymath.js
// Everyday Math: the math people use at a till, in a kitchen, on a job site
// and in a news feed. Twenty topics in five modules, each ending in a real
// task rather than a worksheet. The practice games for them (Better Deal,
// Number Crunch, Line It Up, Sort It Out) are linked per topic through
// src/data/skillLinks.js.
//
// From the Gemini rework, checked on the way in. Two claims it made are
// deliberately taught differently here: 8 ÷ 2(2 + 2) is ambiguous rather
// than "16, and 1 is an error", and a ping-pong-ball bus holds hundreds of
// thousands of balls (its per-ball volume was off).
//
// Money topics follow the regulated-content rule: real-world figures carry
// "(reviewed 2026)", examples say "Imagine", and nothing tells the reader
// what they personally should do.
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const MONEY = '#2E9E6B';
const WORKSHOP = '#E07A30';
const ALGEBRA = '#4A90E2';
const GEOMETRY = '#8B4FC4';
const DATA = '#D35454';

const M1 = 'Module 1 · Everyday money & shopping';
const M2 = 'Module 2 · Kitchen, workshop & measurement';
const M3 = 'Module 3 · Pre-algebra & logic';
const M4 = 'Module 4 · Geometry & space';
const M5 = 'Module 5 · Everyday data & chance';

const MIF = (title, path) => ({ title: `${title} (Math is Fun)`, url: `https://www.mathsisfun.com/${path}` });

const topics = [
  // ── Module 1 ──────────────────────────────────────────────────────────────
  {
    key: 'discounts',
    module: M1,
    title: '20% Off or $15 Off?',
    grade: '6-8',
    color: MONEY,
    description: 'Percent discounts versus dollar discounts, the break-even price, and why stacked discounts never simply add up.',
    learn: [
      { heading: 'Why it matters', body: 'A "$15 off" sticker isn\'t always better than "20% off". Which one wins depends on the price of the thing you\'re buying.' },
      { heading: 'Percent versus flat', body: 'A flat discount saves the same dollars whatever the price. A percent discount grows with the price: 20% off is $20 on a $100 item, but only $8 on a $40 one.' },
      { heading: 'Find the break-even price', body: 'Divide the flat amount by the percent as a decimal: $15 ÷ 0.20 = $75. Above $75, the 20% saves more. Below it, the $15 does. At exactly $75 they tie.' },
      { heading: 'Stacked discounts', body: '20% off and then another 10% off is not 30% off. You pay 0.80 × 0.90 = 0.72 of the price, which is 28% off. Each discount applies to what is left, not to the original price.' },
      { heading: 'Cheat sheet', body: 'Break-even price = flat discount ÷ percent (as a decimal).\nStacked discounts: multiply what you pay each time (0.80 × 0.90), then subtract from 1.' },
    ],
    practice: [
      { question: 'Imagine a coat that costs $120. Which saves more: 20% off, or $15 off?', options: ['$15 off', '20% off', 'They save the same', 'Not enough information'], answerIndex: 1, explanation: '20% of $120 is $24, which beats $15. The price is above the $75 break-even.' },
      { question: 'Imagine a shirt that costs $40. Which saves more: 20% off, or $15 off?', options: ['20% off', 'They save the same', '$15 off', 'Neither saves anything'], answerIndex: 2, explanation: '20% of $40 is only $8. Below the $75 break-even, the flat $15 wins.' },
      { question: 'A store takes 20% off, then another 10% off the sale price. What is the total discount?', options: ['30%', '32%', '2%', '28%'], answerIndex: 3, explanation: 'You pay 0.80 × 0.90 = 0.72 of the original price, so the total discount is 28%, not 30%.' },
    ],
    apply: {
      prompt: 'Next time you shop, in a store or online, find two items with different kinds of discount. Work out the real savings on each before deciding.',
      checklist: ['Found a percent discount and a dollar discount', 'Worked out the dollar savings for each', 'Checked which side of the break-even price each item was on', 'Noted which deal actually saved more'],
    },
    help: { readings: [MIF('Percentages', 'percentage.html')], videos: [] },
  },
  {
    key: 'unitPricing',
    module: M1,
    title: 'The Grocery Store Price Trap',
    grade: '3-5',
    color: MONEY,
    description: 'Comparing the price per ounce, gram or item, so the big box only wins when it really is cheaper.',
    learn: [
      { heading: 'Why it matters', body: 'Bigger packages are often cheaper per ounce, but not always. Stores count on shoppers assuming the family size is the better deal.' },
      { heading: 'Unit price', body: 'Unit price = total price ÷ number of units. Work it out for every option in the same unit (ounces, grams or items), then compare.' },
      { heading: 'Step by step', body: 'Imagine 12 oz for $3.60: $3.60 ÷ 12 = $0.30 an ounce.\nAnd 18 oz for $5.04: $5.04 ÷ 18 = $0.28 an ounce.\nThe 18 oz box is cheaper per ounce, even though its sticker price is higher.' },
      { heading: 'Watch out for', body: 'Different units side by side. A price per pound and a price per ounce can\'t be compared until you convert (16 ounces = 1 pound). Many shelf tags show a unit price, but check they use the same unit.' },
      { heading: 'Cheat sheet', body: 'Unit price = price ÷ quantity. Same unit for every option. The cheapest per unit wins, as long as you will actually use it all.' },
    ],
    practice: [
      { question: 'Imagine 12 oz for $3.60, or 18 oz for $5.04. Which is cheaper per ounce?', options: ['12 oz for $3.60', 'They cost the same per ounce', '18 oz for $5.04', 'You can\'t tell without the brand'], answerIndex: 2, explanation: '$3.60 ÷ 12 = $0.30 an ounce. $5.04 ÷ 18 = $0.28 an ounce.' },
      { question: 'Imagine one tag says $0.25 per ounce and another says $3.60 per pound. Which is cheaper?', options: ['$0.25 per ounce', '$3.60 per pound', 'They are the same', 'They can\'t be compared'], answerIndex: 1, explanation: '$3.60 ÷ 16 ounces = $0.225 an ounce, which is less than $0.25.' },
      { question: 'The bulk bag is cheaper per unit, but half of it usually goes bad before you use it. What does that do to the real price?', options: ['Nothing: unit price is unit price', 'About doubles your real cost per use', 'Halves it, since you bought in bulk', 'Makes it free after the first half'], answerIndex: 1, explanation: 'You paid the full price for twice what you used. A deal only counts for what gets used.' },
    ],
    apply: {
      prompt: 'At a store or on a grocery site, find one product sold in two or more sizes. Work out the unit price of each and see which is really cheaper.',
      checklist: ['Picked one product sold in at least two sizes', 'Wrote down each price and size', 'Worked out each unit price in the same unit', 'Checked it against the shelf tag, if there was one'],
    },
    help: { readings: [MIF('Unit price', 'definitions/unit-price.html')], videos: [] },
  },
  {
    key: 'tipsTax',
    module: M1,
    title: 'The 10% Shift Trick',
    grade: '6-8',
    color: MONEY,
    description: 'Working out tips and tax in your head by moving the decimal point, then halving and doubling.',
    learn: [
      { heading: 'Why it matters', body: 'You don\'t need a phone to work out a 15% or 20% tip. One move of the decimal point gets you most of the way.' },
      { heading: 'The trick', body: 'To find 10%, move the decimal point one place to the left: $48.00 becomes $4.80. Everything else is built from that.' },
      { heading: 'Step by step', body: 'Imagine a $48 bill.\n10%: $4.80.\n5%: half of 10%, $2.40.\n15%: 10% + 5% = $7.20.\n20%: double 10%, $9.60.' },
      { heading: 'Watch out for', body: 'Doubling or halving before you move the decimal. And know whether you are tipping on the bill before tax or the total after it. It\'s a small difference, but it\'s a choice.' },
      { heading: 'Cheat sheet', body: '10% = move the decimal one place left.\n5% = half of that.\n15% = 10% + 5%.\n20% = 10% × 2.\n1% = move it two places.' },
    ],
    practice: [
      { question: 'Imagine a $64 bill. What is a 15% tip?', options: ['$6.40', '$12.80', '$9.60', '$8.60'], answerIndex: 2, explanation: '10% is $6.40, 5% is $3.20, and together they make $9.60.' },
      { question: 'Imagine an $82 bill. What is a 20% tip?', options: ['$16.40', '$8.20', '$18.20', '$20.82'], answerIndex: 0, explanation: '10% is $8.20. Double it for $16.40.' },
      { question: 'Imagine 7% sales tax on a $30 item. What is a quick way to work it out?', options: ['Move the decimal once: $3.00', 'Add $7', 'Seven times 1%: 7 × $0.30 = $2.10', 'Divide $30 by 7'], answerIndex: 2, explanation: '1% is $0.30 (move the decimal two places), so 7% is 7 × $0.30 = $2.10.' },
    ],
    apply: {
      prompt: 'Next time you eat out or order delivery, work out 15% and 20% in your head before looking at the suggested tip.',
      checklist: ['Found 10% by moving the decimal', 'Worked out 15% and 20% without a calculator', 'Compared your numbers with the suggested amounts', 'Checked whether the suggestion was based on the total before or after tax'],
    },
    help: { readings: [MIF('Percentages', 'percentage.html')], videos: [] },
  },
  {
    key: 'simpleInterest',
    module: M1,
    title: 'The True Cost of Borrowing',
    grade: '6-8',
    color: MONEY,
    description: 'Simple interest (I = P × r × t), and how a small fee on a short loan turns into a very large yearly rate.',
    learn: [
      { heading: 'Why it matters', body: '"Only $15 to borrow $100" sounds cheap until you notice the loan lasts two weeks. How long you borrow for changes everything.' },
      { heading: 'Simple interest', body: 'Interest = principal × rate × time, or I = P × r × t. P is the amount borrowed, r is the yearly rate as a decimal, and t is the time in years.' },
      { heading: 'Step by step', body: 'Imagine borrowing $500 at 10% a year for 2 years.\nI = 500 × 0.10 × 2 = $100.\nYou pay back $500 + $100 = $600.' },
      { heading: 'Short loans', body: 'Payday loans usually charge a fee for every $100 borrowed. The CFPB says a fee of $15 per $100 for two weeks is common, which works out to a yearly rate of almost 400% (reviewed 2026). A yearly rate lets you compare loans of different lengths fairly.' },
      { heading: 'Watch out for', body: 'Putting months straight into t. Six months is t = 0.5, not t = 6. And most real loans and credit cards charge interest on interest, which costs more than this simple formula shows.' },
      { heading: 'Cheat sheet', body: 'Total to pay back = P + (P × r × t). Time goes in years. To compare loans, compare yearly rates, not fees.' },
    ],
    practice: [
      { question: 'Imagine borrowing $500 at 10% simple interest for 2 years. How much do you pay back in total?', options: ['$510', '$550', '$1,000', '$600'], answerIndex: 3, explanation: '$500 × 0.10 × 2 = $100 of interest, so $600 in total.' },
      { question: 'Imagine a 6-month loan at 12% a year. What is t in I = P × r × t?', options: ['6', '0.5', '12', '0.06'], answerIndex: 1, explanation: 't is in years, so 6 months is 0.5.' },
      { question: 'Imagine two loans: a $15 fee to borrow $100 for two weeks, or 25% a year. Which costs more over a year?', options: ['The 25% a year loan', 'They cost the same', 'The $15 fee loan', 'A fee can\'t be compared with a rate'], answerIndex: 2, explanation: '$15 per $100 every two weeks is 15% per two weeks. Over 26 two-week periods that is about 390% a year, far more than 25%.' },
    ],
    apply: {
      prompt: 'Find the terms of one real way to borrow: a store card, a buy-now-pay-later plan, a car loan ad or a payday offer. Work out what it would cost to borrow $100 for a year.',
      checklist: ['Found one real offer and its rate or fee', 'Turned the rate into a decimal and the time into years', 'Worked out the interest on $100 for a year', 'Compared it with one other offer'],
    },
    help: {
      readings: [
        MIF('Interest', 'money/interest.html'),
        { title: 'What are the costs and fees for a payday loan? (CFPB)', url: 'https://www.consumerfinance.gov/ask-cfpb/what-are-the-costs-and-fees-for-a-payday-loan-en-1589/' },
      ],
      videos: [],
    },
  },

  // ── Module 2 ──────────────────────────────────────────────────────────────
  {
    key: 'recipeFractions',
    module: M2,
    title: 'Halving and Tripling a Recipe',
    grade: '3-5',
    color: WORKSHOP,
    description: 'Multiplying and dividing fractions to scale a recipe up or down without ruining it.',
    learn: [
      { heading: 'Why it matters', body: 'A recipe for 4 and a table of 12 means tripling every amount, fractions included.' },
      { heading: 'Scaling a fraction', body: 'To multiply a fraction by a whole number, multiply the top and keep the bottom: 3 × 3/4 = 9/4. To halve a fraction, double the bottom: half of 3/4 is 3/8.' },
      { heading: 'Step by step', body: 'Triple 3/4 cup: 3 × 3/4 = 9/4.\n9 ÷ 4 = 2 remainder 1, so 9/4 = 2 1/4 cups.\nHalve 2/3 cup: 2/6, which is 1/3 cup.' },
      { heading: 'Watch out for', body: 'Multiplying the top and the bottom. 3 × 3/4 is 9/4, not 9/12 (that is still 3/4). And baking times and pan sizes don\'t always scale the way ingredients do.' },
      { heading: 'Cheat sheet', body: 'Times a whole number: multiply the top.\nHalf of it: double the bottom.\nImproper to mixed: divide top by bottom, and the remainder goes over the bottom.' },
    ],
    practice: [
      { question: 'A recipe needs 2/3 cup of sugar. You triple it. How much sugar?', options: ['2/9 cup', '6/9 cup', '2 cups', '1 1/3 cups'], answerIndex: 2, explanation: '3 × 2/3 = 6/3 = 2 cups.' },
      { question: 'Half of 3/4 teaspoon is…', options: ['3/8 teaspoon', '3/2 teaspoons', '1/4 teaspoon', '6/8 teaspoon'], answerIndex: 0, explanation: 'Halving doubles the bottom number: 3/8.' },
      { question: 'What is 9/4 as a mixed number?', options: ['4 1/9', '2 1/4', '1 3/4', '2 1/2'], answerIndex: 1, explanation: '9 ÷ 4 = 2 remainder 1, so 2 1/4.' },
    ],
    apply: {
      prompt: 'Pick a real recipe and rewrite it for twice as many people, or half as many. Make it if you can.',
      checklist: ['Chose a recipe with at least 3 fraction amounts', 'Scaled every ingredient', 'Turned improper fractions into mixed numbers', 'Checked whether the pan size or cooking time needs to change too'],
    },
    help: { readings: [MIF('Multiplying fractions', 'fractions_multiplication.html')], videos: [] },
  },
  {
    key: 'perimeterArea',
    module: M2,
    title: 'How Much Paint or Carpet?',
    grade: '3-5',
    color: WORKSHOP,
    description: 'Perimeter for things that go around the edge, area for things that cover a surface, and how to tell which a job needs.',
    learn: [
      { heading: 'Why it matters', body: 'Baseboard trim and fencing are bought by length. Carpet and flooring are bought by area. Mixing them up means buying the wrong amount.' },
      { heading: 'The difference', body: 'Perimeter is the distance around the edge, in feet or meters. Area is the flat space inside, in square feet or square meters.' },
      { heading: 'Step by step', body: 'A room 10 ft by 12 ft:\nPerimeter = 10 + 12 + 10 + 12 = 44 feet of trim.\nArea = 10 × 12 = 120 square feet of flooring.' },
      { heading: 'Watch out for', body: 'Ordering square feet of trim, or linear feet of carpet. Real jobs also need a little extra for cuts and mistakes, so installers usually buy more than the exact figure.' },
      { heading: 'Cheat sheet', body: 'Perimeter = 2 × (length + width).\nArea = length × width.\nGoes around the edge: perimeter. Covers the surface: area.' },
    ],
    practice: [
      { question: 'You\'re fencing a yard 15 m by 20 m. How much fencing?', options: ['35 m', '300 m', '70 m', '600 m'], answerIndex: 2, explanation: 'Fencing goes around the edge: 2 × (15 + 20) = 70 m.' },
      { question: 'You\'re tiling a kitchen floor 15 ft by 20 ft. How many square feet of tile?', options: ['70 sq ft', '300 sq ft', '35 sq ft', '150 sq ft'], answerIndex: 1, explanation: 'Tiles cover the surface: 15 × 20 = 300 square feet.' },
      { question: 'Which job needs perimeter, not area?', options: ['Carpeting a bedroom', 'Painting a ceiling', 'Trim around a room', 'Laying sod on a lawn'], answerIndex: 2, explanation: 'Trim runs along the edge of the floor. The others cover a surface.' },
    ],
    apply: {
      prompt: 'Measure a room at home. Work out how much baseboard trim and how much flooring it would need.',
      checklist: ['Measured the length and width', 'Worked out the perimeter for trim', 'Worked out the area for flooring', 'Took the doorways off the trim, to be exact'],
    },
    help: { readings: [MIF('Area', 'area.html'), MIF('Perimeter', 'geometry/perimeter.html')], videos: [] },
  },
  {
    key: 'unitConversions',
    module: M2,
    title: 'Metric and Imperial in Daily Life',
    grade: '6-8',
    color: WORKSHOP,
    description: 'Quick conversions between miles and kilometers, kilograms and pounds, Celsius and Fahrenheit, and when an estimate is close enough.',
    learn: [
      { heading: 'Why it matters', body: 'Recipes, tools, road signs and weather apps switch between systems. A few anchor numbers cover most of it.' },
      { heading: 'Anchor numbers', body: '1 mile ≈ 1.6 kilometers.\n1 kilogram ≈ 2.2 pounds.\n1 inch = 2.54 centimeters, exactly.\n1 US gallon ≈ 3.8 liters.' },
      { heading: 'Temperature', body: 'Exact: °F = °C × 9/5 + 32. Quick estimate: double the °C and add 30. 20°C is 70°F by the shortcut, and exactly 68°F.' },
      { heading: 'Watch out for', body: 'Dividing when you should multiply. Going to a smaller unit (kilometers from miles, pounds from kilograms) gives a bigger number. And the temperature shortcut drifts at the extremes: 40°C gives 110 by the shortcut, but it is really 104°F.' },
      { heading: 'Cheat sheet', body: 'Miles to km: × 1.6.\nKg to lb: × 2.2.\n°C to °F: × 9/5 + 32, or double and add 30 for a rough guess.' },
    ],
    practice: [
      { question: 'About how many kilometers is 5 miles?', options: ['3 km', '8 km', '50 km', '5.6 km'], answerIndex: 1, explanation: '5 × 1.6 = 8 km.' },
      { question: 'A package weighs 5 kg. About how many pounds is that?', options: ['2.3 lb', '7.2 lb', '11 lb', '50 lb'], answerIndex: 2, explanation: '5 × 2.2 = 11 pounds.' },
      { question: 'It\'s 25°C. What is that in °F, exactly?', options: ['80°F', '77°F', '57°F', '45°F'], answerIndex: 1, explanation: '25 × 9/5 + 32 = 45 + 32 = 77°F. The shortcut gives 80°F: close, not exact.' },
    ],
    apply: {
      prompt: 'Find three measurements around you in one system (a recipe, a road sign, a product label, the weather) and convert each to the other.',
      checklist: ['Found three real measurements', 'Converted each with an anchor number', 'Checked one with the exact conversion', 'Noted where the quick estimate was close enough'],
    },
    help: {
      readings: [
        { title: 'Approximate conversions from US customary to metric (NIST)', url: 'https://www.nist.gov/pml/owm/approximate-conversions-us-customary-measures-metric' },
        MIF('Temperature conversion', 'temperature-conversion.html'),
      ],
      videos: [],
    },
  },
  {
    key: 'volumeCapacity',
    module: M2,
    title: 'Will It All Fit?',
    grade: '6-8',
    color: WORKSHOP,
    description: 'The volume of box shapes in cubic units, and converting to the liters and gallons containers are sold in.',
    learn: [
      { heading: 'Why it matters', body: 'Moving boxes, a car trunk, a fish tank, a bag of soil: whether it fits is a volume question.' },
      { heading: 'Volume', body: 'For a box shape, volume = length × width × height. The answer is in cubic units: cubic inches, cubic feet, or liters.' },
      { heading: 'Step by step', body: 'A box 20 in × 10 in × 15 in:\n20 × 10 × 15 = 3,000 cubic inches.\nA US gallon is 231 cubic inches, so the box would hold about 13 gallons.' },
      { heading: 'Watch out for', body: 'Mixing units. Convert every side to the same unit before multiplying: 2 feet by 6 inches by 6 inches is 24 × 6 × 6 = 864 cubic inches, not 2 × 6 × 6. And 1 cubic foot is 12 × 12 × 12 = 1,728 cubic inches, not 12.' },
      { heading: 'Cheat sheet', body: 'Volume = length × width × height.\n1 cubic foot = 1,728 cubic inches.\n1 US gallon = 231 cubic inches.\n1 liter ≈ 61 cubic inches.' },
    ],
    practice: [
      { question: 'A box is 2 ft × 3 ft × 4 ft. What is its volume?', options: ['9 cubic feet', '24 cubic feet', '24 square feet', '12 cubic feet'], answerIndex: 1, explanation: '2 × 3 × 4 = 24, and it is three dimensions, so cubic feet.' },
      { question: 'How many cubic inches are in 1 cubic foot?', options: ['12', '144', '1,728', '36'], answerIndex: 2, explanation: '12 × 12 × 12 = 1,728. 144 is the number of square inches in a square foot.' },
      { question: 'A tank is 30 in × 12 in × 12 in. Roughly how many gallons does it hold?', options: ['About 54 gallons', 'About 19 gallons', 'About 4 gallons', 'About 360 gallons'], answerIndex: 1, explanation: '30 × 12 × 12 = 4,320 cubic inches. 4,320 ÷ 231 ≈ 18.7 gallons.' },
    ],
    apply: {
      prompt: 'Measure a box, a drawer or a car trunk. Work out its volume, then how many of something (shoeboxes, gallon jugs) would fit.',
      checklist: ['Measured all three sides in the same unit', 'Worked out the volume', 'Converted it to gallons or liters, or counted how many items fit', 'Checked the answer by actually trying, if you could'],
    },
    help: { readings: [MIF('Volume', 'definitions/volume.html'), MIF('US standard volume', 'measure/us-standard-volume.html')], videos: [] },
  },

  // ── Module 3 ──────────────────────────────────────────────────────────────
  {
    key: 'orderOfOperations',
    module: M3,
    title: 'Why Viral Math Problems Start Fights',
    grade: '6-8',
    color: ALGEBRA,
    description: 'The order of operations, and why a few famous internet problems are really arguments about badly written math.',
    learn: [
      { heading: 'Why it matters', body: 'Calculators, spreadsheets and code all follow the same order of operations. Knowing it means your answers match theirs.' },
      { heading: 'The order', body: 'Parentheses first, then exponents, then multiplication and division from left to right, then addition and subtraction from left to right. Multiplication doesn\'t come before division: they share a step, and you go left to right.' },
      { heading: 'Step by step', body: '6 + 2 × 4: multiply first, 2 × 4 = 8, then 6 + 8 = 14.\n(6 + 2) × 4: parentheses first, 8 × 4 = 32.\n20 ÷ 4 × 5: left to right, 5 × 5 = 25.' },
      { heading: 'The famous one', body: '8 ÷ 2(2 + 2) gives 16 by the strict left-to-right rule. But many textbooks and some calculators treat 2(4) as one unit and get 1. Both camps have a point, because the expression is ambiguous. The real lesson is to write math so it can only be read one way: (8 ÷ 2)(2 + 2), or 8 ÷ (2(2 + 2)).' },
      { heading: 'Watch out for', body: 'Doing multiplication before division, or addition before subtraction, when they sit side by side. 10 − 4 + 3 is 9, not 3.' },
      { heading: 'Cheat sheet', body: 'Parentheses, then exponents, then × and ÷ left to right, then + and − left to right.' },
    ],
    practice: [
      { question: 'What is 6 + 2 × 4?', options: ['32', '14', '16', '24'], answerIndex: 1, explanation: 'Multiply first: 2 × 4 = 8. Then 6 + 8 = 14.' },
      { question: 'What is 20 ÷ 4 × 5?', options: ['1', '100', '25', '4'], answerIndex: 2, explanation: 'Division and multiplication share a step, so go left to right: 20 ÷ 4 = 5, then 5 × 5 = 25.' },
      { question: 'People argue over whether 8 ÷ 2(2 + 2) is 16 or 1. What is the real problem?', options: ['Everyone who says 1 is wrong', 'Everyone who says 16 is wrong', 'The expression can be read two ways', 'Calculators are broken'], answerIndex: 2, explanation: 'Implied multiplication like 2(4) is read differently by different conventions. Writing it clearly ends the argument.' },
    ],
    apply: {
      prompt: 'Find a viral math puzzle online. Solve it both ways people argue about, then rewrite it with parentheses so only one answer is possible.',
      checklist: ['Found a real viral math puzzle', 'Solved it with the strict left-to-right rule', 'Checked whether it can be read another way', 'Rewrote it so only one answer is possible'],
    },
    help: { readings: [MIF('Order of operations', 'operation-order-pemdas.html')], videos: [] },
  },
  {
    key: 'solvingForX',
    module: M3,
    title: 'The Missing Item on the Receipt',
    grade: '6-8',
    color: ALGEBRA,
    description: 'Using one-step and two-step equations to find a missing number, like a smudged price on a receipt.',
    learn: [
      { heading: 'Why it matters', body: 'You know the total and most of the items. Algebra finds the one you don\'t know.' },
      { heading: 'The idea', body: 'Write what you know as an equation, then undo each operation on both sides until x is alone. Whatever you do to one side, do to the other.' },
      { heading: 'Step by step', body: 'Imagine items of $12 and $15 plus one missing price, $45 in total.\n12 + 15 + x = 45\n27 + x = 45\nSubtract 27 from both sides: x = 18. The missing item was $18.' },
      { heading: 'With tax', body: 'Imagine a total of $54.00 that includes 8% tax. Then subtotal × 1.08 = 54. Divide both sides by 1.08, and the subtotal is $50.00.' },
      { heading: 'Watch out for', body: 'Undoing with the same operation instead of the opposite one. To undo + 27, subtract 27. To undo × 1.08, divide by 1.08. Imagine taking 8% off the $54 total instead: that gives $49.68, which is wrong, because the tax was 8% of the smaller number.' },
      { heading: 'Cheat sheet', body: 'Undo + with −, − with +, × with ÷, ÷ with ×. Do the same thing to both sides.' },
    ],
    practice: [
      { question: 'Imagine x + $8.50 = $20.00. What is x?', options: ['$28.50', '$11.50', '$12.50', '$1.50'], answerIndex: 1, explanation: 'Subtract $8.50 from both sides: x = $11.50.' },
      { question: 'Imagine a total of $54 that includes 8% tax. What was the price before tax?', options: ['$49.68', '$46.00', '$50.00', '$58.32'], answerIndex: 2, explanation: '1.08 × subtotal = 54, so subtotal = 54 ÷ 1.08 = $50. Taking 8% off $54 gives $49.68, which is wrong, because the tax was 8% of the smaller number.' },
      { question: '3x = 24. Which step gets x alone?', options: ['Subtract 3 from both sides', 'Divide both sides by 3', 'Multiply both sides by 3', 'Add 3 to both sides'], answerIndex: 1, explanation: 'x is multiplied by 3, so undo it by dividing: x = 8.' },
    ],
    apply: {
      prompt: 'Take a real receipt. Cover one item\'s price, then use the total and the other items to work it out. Check against the receipt.',
      checklist: ['Covered one price on a real receipt', 'Wrote the equation', 'Solved for the missing price', 'Checked it, including any tax'],
    },
    help: { readings: [MIF('Introduction to algebra', 'algebra/introduction.html')], videos: [] },
  },
  {
    key: 'negativeNumbers',
    module: M3,
    title: 'Below Zero',
    grade: '6-8',
    color: ALGEBRA,
    description: 'Adding and subtracting negative numbers, with bank balances, temperatures and elevations.',
    learn: [
      { heading: 'Why it matters', body: 'An overdrawn account, a temperature below freezing, a depth below sea level: they are all negative numbers.' },
      { heading: 'The rules', body: 'Adding a negative is the same as subtracting: 10 + (−3) = 7. Subtracting a negative is the same as adding: 5 − (−3) = 8.' },
      { heading: 'Step by step', body: 'Imagine a balance of −$15 and a deposit of $50: −15 + 50 = $35.\nIt is −5°C and drops 10 more: −5 − 10 = −15°C.\nFrom −5°C to 15°C: 15 − (−5) = 20 degrees warmer.' },
      { heading: 'Watch out for', body: '"Two negatives make a positive" is true for multiplying, (−2) × (−3) = 6, but not for adding: (−2) + (−3) = −5.' },
      { heading: 'Cheat sheet', body: 'Adding a negative = subtracting.\nSubtracting a negative = adding.\nThe distance between two numbers = the bigger one minus the smaller one.' },
    ],
    practice: [
      { question: 'Imagine a balance of −$20 and a deposit of $30. What is the new balance?', options: ['−$50', '$10', '$50', '−$10'], answerIndex: 1, explanation: '−20 + 30 = 10.' },
      { question: 'What is −10 − 15?', options: ['5', '−5', '−25', '25'], answerIndex: 2, explanation: 'Start at −10 and go 15 further down: −25.' },
      { question: 'What is (−2) + (−3)?', options: ['5', '−5', '6', '−1'], answerIndex: 1, explanation: 'Adding two negatives goes further below zero. "Two negatives make a positive" is a rule for multiplying.' },
    ],
    apply: {
      prompt: 'Track a real temperature over a day or a week, or keep a practice ledger with a withdrawal that goes below zero. Write each change as a signed number.',
      checklist: ['Recorded at least 5 values that cross zero', 'Wrote each change as a signed number', 'Worked out the biggest rise and the biggest drop', 'Checked the total change from start to finish'],
    },
    help: { readings: [MIF('Positive and negative numbers', 'positive-negative-integers.html')], videos: [] },
  },
  {
    key: 'ratios',
    module: M3,
    title: 'Mixing Paint, Concrete or Fuel',
    grade: '6-8',
    color: ALGEBRA,
    description: 'Part-to-part ratios, and scaling a mix up or down without changing it.',
    learn: [
      { heading: 'Why it matters', body: 'A two-stroke engine that needs a 50:1 fuel mix, concrete mixed 1:2:3, paint tinted 3:1. Get the ratio wrong and the job fails.' },
      { heading: 'Ratios', body: 'A ratio A:B means A parts of one thing for every B parts of another. To scale it, multiply or divide both sides by the same number.' },
      { heading: 'Step by step', body: 'A 50:1 gas-to-oil mix for 1 gallon of gas (128 fluid ounces):\n128 ÷ 50 = 2.56 fluid ounces of oil.\nFor 2.5 gallons (320 fl oz): 320 ÷ 50 = 6.4 fl oz.' },
      { heading: 'Watch out for', body: 'Confusing part-to-part with part-to-whole. Paint mixed 3:1 is 3 parts blue to 1 part white, so blue is 3/4 of the whole. For 12 gallons in total, that is 9 blue and 3 white. For engines and chemicals, the maker\'s ratio is the one that counts.' },
      { heading: 'Cheat sheet', body: 'Scale a ratio by multiplying both sides by the same number.\nTotal parts = A + B.\nShare of A = A ÷ (A + B).' },
    ],
    practice: [
      { question: 'Paint is mixed 3:1 blue to white, 12 gallons in total. How much blue?', options: ['4 gallons', '3 gallons', '9 gallons', '36 gallons'], answerIndex: 2, explanation: '3 + 1 = 4 parts, so each part is 12 ÷ 4 = 3 gallons. Blue is 3 parts: 9 gallons.' },
      { question: 'A 50:1 mix for 1 gallon (128 fl oz) of gas needs about how much oil?', options: ['50 fl oz', '2.56 fl oz', '6.4 fl oz', '0.5 fl oz'], answerIndex: 1, explanation: '128 ÷ 50 = 2.56 fluid ounces.' },
      { question: 'A drink is mixed 1:4, syrup to water. What fraction of it is syrup?', options: ['1/4', '1/5', '4/5', '1/3'], answerIndex: 1, explanation: '1 part syrup out of 1 + 4 = 5 parts: 1/5. 1:4 compares syrup with water, not with the whole drink.' },
    ],
    apply: {
      prompt: 'Find a real mix ratio: a cleaning product, a drink concentrate, a plant fertilizer or a fuel mix. Work out the amounts for one batch size you would actually use.',
      checklist: ['Found a real ratio on a label or in instructions', 'Chose a batch size you would use', 'Worked out each amount', 'Checked it matches the maker\'s directions'],
    },
    help: { readings: [MIF('Ratios', 'numbers/ratio.html')], videos: [] },
  },

  // ── Module 4 ──────────────────────────────────────────────────────────────
  {
    key: 'threeFourFive',
    module: M4,
    title: 'How Builders Make Square Corners',
    grade: '6-8',
    color: GEOMETRY,
    description: 'The 3-4-5 rule and the Pythagorean theorem, used with nothing but a tape measure.',
    learn: [
      { heading: 'Why it matters', body: 'Builders don\'t carry giant protractors. A tape measure and three numbers tell them whether a corner is square.' },
      { heading: 'The idea', body: 'In a right triangle, a² + b² = c², where c is the longest side. 3² + 4² = 9 + 16 = 25 = 5², so a triangle with sides 3, 4 and 5 always has a 90° corner.' },
      { heading: 'Step by step', body: 'Measure 3 feet along one wall from the corner and mark it.\nMeasure 4 feet along the other wall and mark it.\nMeasure between the marks. Exactly 5 feet means the corner is square.' },
      { heading: 'Watch out for', body: 'Assuming any three numbers make a right triangle. 4, 5 and 6 don\'t: 16 + 25 = 41, not 36. If the diagonal is longer than 5, the corner is wider than 90°. If it is shorter, the corner is narrower.' },
      { heading: 'Cheat sheet', body: 'Right-triangle sets: 3-4-5, 6-8-10, 5-12-13, 8-15-17. For big corners, a larger multiple like 6-8-10 is more accurate.' },
    ],
    practice: [
      { question: 'Two sides measure 6 ft and 8 ft. For a square corner, the diagonal should be…', options: ['14 ft', '10 ft', '12 ft', '9 ft'], answerIndex: 1, explanation: '6-8-10 is double 3-4-5. 36 + 64 = 100 = 10².' },
      { question: 'You measure 3 ft and 4 ft, and the diagonal is 5.2 ft. The corner is…', options: ['exactly square', 'wider than 90°', 'narrower than 90°', 'impossible to tell'], answerIndex: 1, explanation: 'A longer diagonal means the two sides spread wider than a right angle.' },
      { question: 'Which set of sides makes a right triangle?', options: ['4, 5, 6', '2, 3, 4', '5, 12, 13', '6, 7, 8'], answerIndex: 2, explanation: '25 + 144 = 169 = 13².' },
    ],
    apply: {
      prompt: 'Check a real corner (a room, a table, a garden bed, a book) with the 3-4-5 rule, in whatever unit fits.',
      checklist: ['Marked 3 units along one side', 'Marked 4 units along the other', 'Measured the diagonal', 'Decided whether it is square, wider or narrower'],
    },
    help: { readings: [MIF('Pythagoras\' theorem', 'pythagoras.html')], videos: [] },
  },
  {
    key: 'anglesInTheWild',
    module: M4,
    title: 'Angles, Ramps and Roof Pitch',
    grade: '6-8',
    color: GEOMETRY,
    description: 'Acute, right and obtuse angles, and how slope is written as rise over run on roofs and ramps.',
    learn: [
      { heading: 'Why it matters', body: 'A roof\'s pitch, a wheelchair ramp, the tilt of a solar panel: all angles, all with real consequences.' },
      { heading: 'Kinds of angle', body: 'Acute is less than 90°. Right is exactly 90°. Obtuse is between 90° and 180°. A straight line is 180°.' },
      { heading: 'Rise over run', body: 'Slopes are often written as rise over run. A roof that rises 6 inches for every 12 inches across is a "6 in 12" pitch, about 27°. In the US, the ADA standard for a wheelchair ramp is at most 1 inch of rise for every 12 inches of run, about 4.8° (reviewed 2026).' },
      { heading: 'Solar panels', body: 'A common rule of thumb for a fixed solar panel is a tilt close to your latitude, so it faces the sun most squarely on average across the year.' },
      { heading: 'Watch out for', body: 'Measuring from the wrong line. Roof pitch and ramp slope are measured from the horizontal, not from the wall.' },
      { heading: 'Cheat sheet', body: 'Acute < 90° < obtuse < 180°.\nSlope = rise ÷ run.\nSteeper means more rise for the same run.' },
    ],
    practice: [
      { question: 'An angle of 110° is…', options: ['acute', 'right', 'obtuse', 'straight'], answerIndex: 2, explanation: 'It is more than 90° and less than 180°.' },
      { question: 'A ramp rises 2 feet over a run of 12 feet. Compared with a 1-in-12 ramp, it is…', options: ['gentler', 'steeper', 'the same', 'impossible to tell'], answerIndex: 1, explanation: '1 in 12 would rise 1 foot over 12 feet. This rises 2, so it is twice as steep.' },
      { question: 'Which roof is steeper: a 4 in 12 pitch or an 8 in 12 pitch?', options: ['4 in 12', 'They are the same', '8 in 12', 'It depends on the house'], answerIndex: 2, explanation: '8 inches of rise per 12 across is more than 4 per 12.' },
    ],
    apply: {
      prompt: 'Find three real angles or slopes: a ramp, a staircase, a roof, a laptop screen. Classify each angle, and estimate the rise over run of one slope.',
      checklist: ['Found three real angles or slopes', 'Classified each as acute, right or obtuse', 'Measured or estimated the rise and run of one slope', 'Compared it with the 1-in-12 ramp standard'],
    },
    help: { readings: [MIF('Angles', 'angles.html')], videos: [] },
  },
  {
    key: 'scaleMaps',
    module: M4,
    title: 'Reading the Map Legend',
    grade: '6-8',
    color: GEOMETRY,
    description: 'Scale on maps and blueprints, and turning a measurement on paper into a real distance.',
    learn: [
      { heading: 'Why it matters', body: 'Maps and floor plans are drawn small on purpose. The scale tells you how to turn them back into real distances.' },
      { heading: 'Scale', body: 'A scale like 1 inch = 15 miles, or 1/4 inch = 1 foot on a floor plan, links a distance on paper to a distance in the world.' },
      { heading: 'Step by step', body: 'Legend: 1 inch = 15 miles.\nMeasured on the map: 3.5 inches.\n3.5 × 15 = 52.5 miles.' },
      { heading: 'Watch out for', body: 'Forgetting the units, or measuring a winding road as a straight line. The straight line is always the shortest distance, and the road is longer.' },
      { heading: 'Cheat sheet', body: 'Real distance = map distance × scale factor.\nMap distance = real distance ÷ scale factor.' },
    ],
    practice: [
      { question: 'A blueprint uses 1 in = 5 ft. A wall measures 4.5 in. How long is the real wall?', options: ['9.5 ft', '22.5 ft', '0.9 ft', '45 ft'], answerIndex: 1, explanation: '4.5 × 5 = 22.5 feet.' },
      { question: 'On a map where 1 cm = 2 km, two towns are 7 cm apart. How far is that?', options: ['3.5 km', '9 km', '14 km', '70 km'], answerIndex: 2, explanation: '7 × 2 = 14 km, in a straight line.' },
      { question: 'A floor plan uses 1/4 in = 1 ft. A room is 3 inches long on the plan. How long is the real room?', options: ['12 ft', '3 ft', '0.75 ft', '4 ft'], answerIndex: 0, explanation: 'Each quarter inch is a foot, and 3 inches holds 12 quarter inches: 12 feet.' },
    ],
    apply: {
      prompt: 'Use a paper map or a map app\'s scale bar to measure the straight-line distance between two places you know. Compare it with the driving or walking distance.',
      checklist: ['Found the map\'s scale', 'Measured the straight-line distance on the map', 'Converted it to a real distance', 'Compared it with the route distance'],
    },
    help: { readings: [MIF('Scale drawing', 'definitions/scale-drawing.html')], videos: [] },
  },
  {
    key: 'tessellations',
    module: M4,
    title: 'The Math of Floor Tiles',
    grade: '6-8',
    color: GEOMETRY,
    description: 'Why some shapes tile a floor with no gaps and others can\'t, and how symmetry shows up in patterns.',
    learn: [
      { heading: 'Why it matters', body: 'Tile, brick, fabric and game boards all repeat a shape with no gaps and no overlaps. That is called a tessellation.' },
      { heading: 'The rule', body: 'Where corners meet, the angles have to add up to exactly 360°. Squares: 4 × 90°. Equilateral triangles: 6 × 60°. Regular hexagons: 3 × 120°.' },
      { heading: 'Why pentagons fail', body: 'A regular pentagon\'s corner is 108°. Three make 324°, which leaves a 36° gap, and four make 432°, which is too many. So regular pentagons can\'t tile a floor alone.' },
      { heading: 'Mixing shapes', body: 'Regular octagons can\'t tile alone: 135° + 135° = 270° leaves a gap. Put a square in each gap and 135 + 135 + 90 = 360. That is the classic octagon-and-square floor.' },
      { heading: 'Cheat sheet', body: 'Only three regular shapes tile alone: triangles, squares and hexagons. Any triangle, and any four-sided shape, will tile if you rotate copies of it.' },
    ],
    practice: [
      { question: 'Which regular shape can NOT tile a floor by itself?', options: ['Square', 'Equilateral triangle', 'Regular pentagon', 'Regular hexagon'], answerIndex: 2, explanation: 'Its 108° corners can\'t add up to exactly 360°.' },
      { question: 'At a corner where regular hexagons meet, how many hexagons touch?', options: ['2', '3', '4', '6'], answerIndex: 1, explanation: '3 × 120° = 360°.' },
      { question: 'Octagons leave gaps when tiled alone. What fills them in the classic pattern?', options: ['Triangles', 'Squares', 'Pentagons', 'Circles'], answerIndex: 1, explanation: '135° + 135° + 90° = 360°.' },
    ],
    apply: {
      prompt: 'Find three tiled or repeating patterns: a floor, a wall, a fabric, a sidewalk. Name the shapes and count how many meet at one corner.',
      checklist: ['Found three real repeating patterns', 'Named the shapes in each', 'Counted how many meet at a corner', 'Checked the angles add up to 360°'],
    },
    help: { readings: [MIF('Tessellation', 'geometry/tessellation.html')], videos: [] },
  },

  // ── Module 5 ──────────────────────────────────────────────────────────────
  {
    key: 'meanMedian',
    module: M5,
    title: 'What\'s Your Typical Score?',
    grade: '6-8',
    color: DATA,
    description: 'Mean versus median, and why one extreme number can make an average misleading.',
    learn: [
      { heading: 'Why it matters', body: 'One terrible game drags your average down. One mansion makes a street look rich. Knowing which middle to use keeps the numbers honest.' },
      { heading: 'Two kinds of middle', body: 'The mean is the total divided by how many values there are. The median is the middle value once they are in order. An extreme value (an outlier) pulls the mean toward it but barely moves the median.' },
      { heading: 'Step by step', body: 'Scores: 0, 10, 11, 12, 14.\nMean: 47 ÷ 5 = 9.4.\nMedian: the middle one, 11.\nThe median describes a typical game better. The 0 was one disconnect.' },
      { heading: 'Watch out for', body: 'Using the mean for things with a few huge values, like incomes or house prices. That is why reports on pay often give the median. With an even number of values, the median is halfway between the middle two.' },
      { heading: 'Cheat sheet', body: 'Mean = sum ÷ count (pulled by outliers).\nMedian = the middle value in order (resists outliers).' },
    ],
    practice: [
      { question: 'Data: 2, 3, 3, 4, 100. What describes a typical value best?', options: ['The mean, 22.4', 'The median, 3', 'The largest, 100', 'The range, 98'], answerIndex: 1, explanation: 'The 100 drags the mean far above every other value. The median ignores it.' },
      { question: 'What is the median of 4, 8, 6, 10?', options: ['6', '8', '7', '7.5'], answerIndex: 2, explanation: 'In order: 4, 6, 8, 10. The middle two are 6 and 8, so the median is 7.' },
      { question: 'Why do reports on pay often give the median income?', options: ['It is always bigger', 'High earners skew the mean', 'The mean is not allowed', 'It is easier to work out'], answerIndex: 1, explanation: 'A small number of huge incomes lift the mean above what most people earn. The median stays with the middle.' },
    ],
    apply: {
      prompt: 'Take 5 to 10 numbers from your own life: game scores, daily steps, minutes of screen time. Work out the mean and the median. Is there an outlier?',
      checklist: ['Collected 5 to 10 real numbers', 'Worked out the mean', 'Worked out the median', 'Decided which one describes a typical day better, and why'],
    },
    help: { readings: [MIF('Median', 'median.html'), MIF('Mean', 'mean.html')], videos: [] },
  },
  {
    key: 'probability',
    module: M5,
    title: 'Coin Flips, Dice and "40% Chance of Rain"',
    grade: '6-8',
    color: DATA,
    description: 'Single-event probability, what a weather forecast\'s percentage actually means, and the gambler\'s fallacy.',
    learn: [
      { heading: 'Why it matters', body: 'Forecasts, games and risks are all given as chances. Reading them right changes decisions.' },
      { heading: 'The formula', body: 'Probability = favorable outcomes ÷ total possible outcomes, when every outcome is equally likely. Rolling a 5 or a 6 on one die: 2 ÷ 6 = 1/3, about 33%.' },
      { heading: 'The forecast', body: 'A 40% chance of rain doesn\'t mean rain for 40% of the day, or over 40% of the area. The National Weather Service defines it as the chance that the forecast location gets at least 0.01 inch of rain.' },
      { heading: 'Watch out for', body: 'The gambler\'s fallacy. After five heads in a row, tails is not "due". A fair coin has no memory, and the next flip is still 1/2.' },
      { heading: 'Cheat sheet', body: 'Probability = favorable ÷ total.\nIt runs from 0 (never) to 1 (certain).\nIndependent events don\'t remember the past.' },
    ],
    practice: [
      { question: 'What is the chance of drawing an ace from a full deck of 52 cards?', options: ['1/52', '1/13', '1/4', '4/13'], answerIndex: 1, explanation: '4 aces out of 52 cards: 4/52 = 1/13, about 7.7%.' },
      { question: 'A fair coin lands heads five times in a row. The chance of heads on the next flip is…', options: ['less than 1/2, because tails is due', 'more than 1/2, because it\'s on a streak', 'exactly 1/2', '1/32'], answerIndex: 2, explanation: 'Each flip is independent. The coin doesn\'t know what happened before.' },
      { question: 'The forecast says a 40% chance of rain. What does that mean?', options: ['Rain for 40% of the day', 'Rain over 40% of the area', 'A 40% chance of any rain here', 'Definite rain, but only light'], answerIndex: 2, explanation: 'That is the National Weather Service\'s own definition: the chance of at least 0.01 inch at that point.' },
    ],
    apply: {
      prompt: 'Flip a coin or roll a die 30 times and record the results. Compare what happened with what probability predicts. Then check tomorrow\'s forecast and what its percentage means.',
      checklist: ['Did 30 flips or rolls and recorded each one', 'Compared the counts with the expected share', 'Noticed any streaks, and remembered they aren\'t "due" to end', 'Read tomorrow\'s chance of rain the right way'],
    },
    help: {
      readings: [
        MIF('Probability', 'data/probability.html'),
        { title: 'What does "chance of rain" mean? (National Weather Service)', url: 'https://www.weather.gov/ffc/pop' },
      ],
      videos: [],
    },
  },
  {
    key: 'readingCharts',
    module: M5,
    title: 'Spotting a Misleading Chart',
    grade: '6-8',
    color: DATA,
    description: 'Reading bar, line and pie charts, and catching the tricks that make small differences look huge.',
    learn: [
      { heading: 'Why it matters', body: 'Charts persuade faster than numbers do, which is exactly why they get bent.' },
      { heading: 'Check the axis', body: 'See where the vertical axis starts. Bars starting at 50 instead of 0 make 52 and 58 look like a fourfold difference, when 58 is only about 12 percent more than 52.' },
      { heading: 'Other tricks', body: 'A time window picked to show only the rise. Pie slices that don\'t add up to the whole. 3D effects that make the front slice look bigger. Two lines drawn on different scales.' },
      { heading: 'Watch out for', body: 'Judging by bar height alone. Read the numbers on the axis first.' },
      { heading: 'Cheat sheet', body: '1. Where does the axis start?\n2. What are the real values?\n3. What time range is shown, and what was left out?' },
    ],
    practice: [
      { question: 'A bar chart\'s vertical axis runs from 90 to 100. What does that do?', options: ['Nothing', 'Makes the chart more accurate', 'Makes small differences look big', 'Hides the largest value'], answerIndex: 2, explanation: 'Cutting off the bottom 90 makes a difference of 2 or 3 look like most of the bar.' },
      { question: 'Bars show 52 hours and 58 hours, and the axis starts at 50, so the taller bar looks four times as tall. How much bigger is it really?', options: ['4 times', 'About 12 percent', 'About 50 percent', '6 times'], answerIndex: 1, explanation: '58 − 52 = 6, and 6 ÷ 52 ≈ 0.115, about 12 percent.' },
      { question: 'A company\'s chart shows sales rising, starting from its worst month ever. What is the trick?', options: ['Too many colors', 'A cherry-picked time window', 'A missing title', 'Using a line chart'], answerIndex: 1, explanation: 'Starting at the lowest point makes almost any trend look like growth.' },
    ],
    apply: {
      prompt: 'Find a chart in a news article, an ad or a social post. Check its axis, its time range and its source, and decide whether it\'s fair.',
      checklist: ['Found a real chart', 'Checked where the axis starts', 'Checked the time range and what might be missing', 'Decided whether it is fair, and why'],
    },
    help: { readings: [{ title: 'Misleading graph (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Misleading_graph' }], videos: [] },
  },
  {
    key: 'fermiEstimation',
    module: M5,
    title: 'How Many Ping-Pong Balls Fit in a Bus?',
    grade: '9-12',
    color: DATA,
    description: 'Fermi estimation: breaking an impossible-sounding question into small guesses to get the right order of magnitude.',
    learn: [
      { heading: 'Why it matters', body: 'Engineers, founders and scientists often need a rough number fast. Being within a factor of ten is usually enough to make a decision.' },
      { heading: 'The method', body: 'Break the question into pieces you can guess, estimate each piece, and multiply. Errors in different pieces tend to partly cancel out.' },
      { heading: 'Step by step', body: 'The inside of a bus: about 8 ft wide, 6 ft tall and 30 ft long. That is roughly 1,400 cubic feet, or about 2.5 million cubic inches.\nA ping-pong ball is about 1.6 inches across, so each takes up roughly a 1.6-inch cube: about 4 cubic inches.\n2,500,000 ÷ 4 ≈ 600,000. The answer is in the hundreds of thousands, not the thousands or the tens of millions.' },
      { heading: 'Watch out for', body: 'Getting stuck hunting for exact numbers. Round boldly, and write every assumption down, so you can fix whichever one turns out to be wrong.' },
      { heading: 'Cheat sheet', body: 'Question → pieces → a guess for each → multiply → check the answer is sensible.' },
    ],
    practice: [
      { question: 'Roughly how many ping-pong balls fit in a school bus?', options: ['About 6,000', 'Hundreds of thousands', 'About 60 million', 'About 600'], answerIndex: 1, explanation: 'About 2.5 million cubic inches ÷ about 4 cubic inches a ball ≈ 600,000.' },
      { question: 'The classic question: how many piano tuners work in Chicago? The Fermi answer is on the order of…', options: ['10', '100', '10,000', '1,000,000'], answerIndex: 1, explanation: 'Working from population, pianos per household and tunings per year lands at around a hundred.' },
      { question: 'What makes an estimate a good Fermi estimate?', options: ['It is exactly right', 'Close enough, assumptions shown', 'It uses lots of decimal places', 'It avoids guessing entirely'], answerIndex: 1, explanation: 'The goal is the right order of magnitude, with reasoning someone else can check.' },
    ],
    apply: {
      prompt: 'Pick a question with no easy answer: how many words you read in a year, or how many slices of pizza your town eats a week. Estimate it Fermi-style and write down every assumption.',
      checklist: ['Chose a question with no easy answer', 'Broke it into at least 3 pieces', 'Wrote down a guess for each piece', 'Multiplied it out and checked it was sensible'],
    },
    help: { readings: [{ title: 'Fermi problem (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Fermi_problem' }], videos: [] },
  },
];

export default function EverydayMath() {
  return <ClassTopicScreen title={'Everyday Math'} classKey="EverydayMath" fallbackTopics={topics} />;
}
