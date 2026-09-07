// src/screens/classes/mathClass/numbersandoperations.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'counting',
      title: 'Counting & Cardinality',
      grade: 'K-2',
      // Bright red background
      color: '#FF6B6B',
      description:
        'Understanding how to count objects, recognize that the last number in a count names the quantity, and use place-value concepts (e.g., ones, tens, hundreds) to represent and compare numbers.',
      learn: [
        { heading: 'What is Counting On?', body: 'Addition means combining groups. "Counting on" is a shortcut: instead of counting every object from 1, start at the bigger number and count up. For 5 + 3, start at 5, then count "6, 7, 8."' },
        { heading: 'Why It Works', body: 'The last number you say when counting a group always names how many are in it — that\'s the cardinality principle. Starting from the bigger number just skips counting the smaller group one-by-one.' },
      ],
      practice: [
        { question: 'What is 6 + 3? Start at 6 and count on 3 steps.', options: ['8', '9', '10', '7'], answerIndex: 1, explanation: '6, then count on 3: 7, 8, 9.' },
        { question: 'If you count a pile of blocks and the last number you say is "12," how many blocks are there?', options: ['1', '12', 'Depends on the color', 'You have to count twice'], answerIndex: 1, explanation: 'The last number counted names the total — that\'s cardinality.' },
      ],
      apply: {
        prompt: 'Grab 7 small objects (coins, blocks, or spoons). Add 2 more. Count on out loud to find the total, then take a photo of your group.',
        checklist: ['Started with 7 objects', 'Added 2 more objects', 'Counted on out loud from 7', 'Said the total out loud'],
      },
      help: {
        videos: [
          {
            title: 'Counting',
            url: 'https://youtu.be/mKSNQuQrsm0?feature=shared',
          },
          {
            title: 'Cardinal counting principle',
            url: 'https://youtu.be/ieRYzlFWWUg?feature=shared',
          },
          {
            title: 'Counting and cardinality',
            url: 'https://youtu.be/aSDi_PN2YoA?feature=shared',
          },
          {
            title: 'Place Value Song For Kids | Ones, Tens, & Hundreds',
            url: 'https://youtu.be/a4FXl4zb3E4?feature=shared',
          },
          {
            title: 'Place Value',
            url: 'https://youtu.be/T5Qf0qSSJFI?feature=shared',
          },
        ],
      },
    },
    {
      key: 'whole',
      title: 'Whole Number Operations',
      grade: '3-5',
      // Bright blue background
      color: '#4D96FF',
      description:
        'Mastery of addition, subtraction, multiplication, and division with nonnegative integers, including strategies (e.g., regrouping, arrays) and properties (commutative, associative).',
      learn: [
        { heading: 'Regrouping to Add & Subtract', body: 'When a column adds up to more than 9, you "regroup" — trade 10 ones for 1 ten and carry it to the next column. Subtraction works in reverse: if the top digit is too small, borrow a ten from the next column and break it into 10 ones.' },
        { heading: 'Arrays and Properties of Multiplication', body: 'An array of rows and columns (like 4 rows of 6 dots) shows multiplication as repeated groups. The commutative property means 4 × 6 gives the same total as 6 × 4 — just turn the array on its side. The associative property lets you group factors differently, like (2 × 3) × 4 = 2 × (3 × 4), without changing the answer.' },
      ],
      practice: [
        { question: 'What is 47 + 38?', options: ['75', '85', '95', '815'], answerIndex: 1, explanation: 'Add ones: 7+8=15, write 5 and regroup 1 ten. Add tens: 4+3+1=8, giving 85.' },
        { question: 'Which shows the commutative property of multiplication?', options: ['3 × 5 = 5 × 3', '3 × (5 × 2) = (3 × 5) × 2', '3 × 1 = 3', '3 × 0 = 0'], answerIndex: 0, explanation: 'The commutative property says you can swap the order of factors and get the same product.' },
      ],
      apply: {
        prompt: 'Use 24 small objects (coins, beans, or blocks). Arrange them into an array (like 4 rows of 6) to model a multiplication fact, then solve a two-digit addition problem with regrouping using paper and pencil.',
        checklist: ['Built an array with 24 objects', 'Wrote the multiplication fact the array shows', 'Solved a two-digit addition problem that needs regrouping', 'Explained out loud where the regrouped ten went'],
      },
      help: {
        videos: [
          {
            title: 'Multiplying whole numbers',
            url: 'https://youtu.be/SuC_ufEOHQc?feature=shared',
          },
          {
            title: 'Dividing whole numbers',
            url: 'https://youtu.be/oNxjGOxTaOc?feature=shared',
          },
          {
            title: 'Adding whole numbers',
            url: 'https://youtu.be/-MiH40ZUwq4?feature=shared',
          },
          {
            title: 'Subtracting whole numbers',
            url: 'https://youtu.be/gIHYlZcr_1Y?feature=shared',
          },
          {
            title: 'Regrouping whole number place values',
            url: 'https://youtu.be/i7lqWXKuhhQ?feature=shared',
          },
          {
            title: 'Multiplication with Arrays',
            url: 'https://youtu.be/QphXFi30aFk?feature=shared',
          },
          {
            title:
              'Multiplication Properties | Commutative, Associative, Identity, & Zero',
            url: 'https://youtu.be/Doqt7bb8Gno?feature=shared',
          },
        ],
      },
    },
    {
      key: 'fractions',
      title: 'Fractions & Decimals',
      grade: '6-8',
      // Bright green background
      color: '#4CAF50',
      description:
        'Representing parts of a whole or group, comparing and ordering fractional and decimal values, and performing operations (addition, subtraction, multiplication, division) on them.',
      learn: [
        { heading: 'Fractions and Decimals Are the Same Idea', body: 'A fraction like 3/4 and a decimal like 0.75 both describe part of a whole — the fraction shows a division (3 ÷ 4) and the decimal shows the same value in tenths, hundredths, and so on. To compare them, it helps to convert to a common form, like giving fractions the same denominator or writing both as decimals.' },
        { heading: 'Adding vs. Multiplying Fractions', body: 'To add or subtract fractions, the denominators must match first (find a common denominator), because you can only combine same-size pieces. To multiply fractions, you multiply straight across (numerator × numerator, denominator × denominator) — no common denominator needed, because you\'re finding "a part of a part."' },
      ],
      practice: [
        { question: 'Which fraction is equivalent to 0.75?', options: ['1/2', '2/3', '3/4', '4/5'], answerIndex: 2, explanation: '3 ÷ 4 = 0.75, so 3/4 and 0.75 name the same value.' },
        { question: 'What is 1/4 + 1/2?', options: ['1/6', '2/6', '3/4', '1/2'], answerIndex: 2, explanation: 'Rewrite 1/2 as 2/4, then add: 1/4 + 2/4 = 3/4.' },
      ],
      apply: {
        prompt: 'Find a recipe (or make one up) that uses fractional measurements, like 3/4 cup flour or 1/2 teaspoon salt. Double the recipe by adding each fractional amount to itself, then rewrite every fraction in the recipe as a decimal.',
        checklist: ['Listed at least 3 fractional measurements from the recipe', 'Doubled each amount using fraction addition or multiplication', 'Converted each original fraction to a decimal', 'Checked that equivalent fractions and decimals match'],
      },
      help: {
        videos: [
          {
            title: 'Comparing and Ordering Fractions, Decimals, and Percents',
            url: 'https://youtu.be/5vv--qrUJXo?feature=shared',
          },
          {
            title: 'Converting Fractions to Decimals Song',
            url: 'https://youtu.be/WV5VY76Pf5U?feature=shared',
          },
          {
            title: 'Compare & Order Fractions by Equivalency',
            url: 'https://youtu.be/bj5fSn96Cns?feature=shared',
          },
          {
            title: 'Comparing Decimal Numbers',
            url: 'https://youtu.be/rALUd3wW29s?feature=shared',
          },
          {
            title: 'Adding and Subtracting Fractions',
            url: 'https://youtu.be/5juto2ze8Lg?feature=shared',
          },
          {
            title: 'Multiplication and Division of Fractions',
            url: 'https://youtu.be/Q9MCRjrrd6E?feature=shared',
          },
          {
            title: 'Adding & Subtracting Decimals Song',
            url: 'https://youtu.be/n-OcbG1FlBQ?feature=shared',
          },
          {
            title: 'How to Multiply Decimals and Divide Decimals',
            url: 'https://youtu.be/jtstmHefBW8?feature=shared',
          },
        ],
      },
    },
    {
      key: 'rational',
      title: 'Rational & Real Numbers',
      grade: '9-12',
      // Bright orange background
      color: '#FFB74D',
      description:
        'Extending number sense to include negatives, fractional and decimal numbers, and recognizing that both rational (e.g., ¾, –2) and irrational (e.g., √2, π) numbers fill out the number line.',
      learn: [
        { heading: 'What Makes a Number Rational', body: 'A rational number can be written as a ratio of two integers, a/b, with b not zero — that includes whole numbers, negatives, fractions, and decimals that terminate (0.5) or repeat forever in a pattern (0.333...). Every rational number\'s decimal form either ends or repeats.' },
        { heading: 'Irrational Numbers Fill the Gaps', body: 'Irrational numbers, like √2 or π, cannot be written as a simple fraction — their decimals go on forever with no repeating pattern. Together, the rational and irrational numbers make up the real numbers, which fill every point on the number line with no gaps.' },
      ],
      practice: [
        { question: 'Which of these numbers is irrational?', options: ['3/4', '0.5', '√2', '-7'], answerIndex: 2, explanation: '√2 cannot be written as a ratio of integers and its decimal never ends or repeats, so it is irrational.' },
        { question: 'Why is 0.333... (repeating) a rational number?', options: ['It is negative', 'It can be written as the fraction 1/3', 'It has a decimal point', 'It is greater than 1'], answerIndex: 1, explanation: 'Any repeating decimal can be written as a ratio of two integers, which is the definition of rational.' },
      ],
      apply: {
        prompt: 'Draw a number line from -3 to 3 on paper. Plot these six numbers on it in the correct order: -2, 1/2, π, -1.5, √2, and 7/4. Label each point as rational or irrational.',
        checklist: ['Drew a number line from -3 to 3', 'Plotted all six numbers in correct order', 'Labeled each as rational or irrational', 'Explained why π and √2 are irrational'],
      },
      help: {
        videos: [
          {
            title: 'Natural, Whole, Integers, Rational, Irrational, Real, Imaginary',
            url: 'https://youtu.be/WxXZaP8Y8pI?feature=shared',
          },
          {
            title: 'An Intro to Rational and Irrational Numbers',
            url: 'https://youtu.be/Th9mT4TxvOI?feature=shared',
          },
        ],
      },
    },
  ];

export default function ClassesScreen() {
  return <ClassTopicScreen title={"Numbers & Operations"} classKey="NumbersAndOperations" fallbackTopics={topics} />;
}
