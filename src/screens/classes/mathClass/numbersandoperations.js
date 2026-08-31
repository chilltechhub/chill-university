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
