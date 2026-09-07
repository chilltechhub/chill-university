// src/screens/classes/businessFinanceClass/foundations.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'needsWants',
    title: 'Needs vs. Wants',
    grade: 'K-2',
    color: '#FF6B6B',
    description:
      'The foundation of every money decision: telling the difference between something you truly need to survive and stay healthy, and something that would just be nice to have.',
    learn: [
      { heading: 'What Is a Need?', body: 'A need is something you must have to survive and stay healthy — food, water, a safe place to live, and warm clothes. Without needs, you can\'t stay healthy or safe.' },
      { heading: 'What Is a Want?', body: 'A want is something nice to have, but you could live without it — toys, candy, video games. Smart spending means taking care of needs first, then deciding what wants are worth saving for.' },
    ],
    practice: [
      { question: 'Is a winter coat a Need or a Want?', options: ['Need', 'Want', 'Neither', 'Both equally'], answerIndex: 0, explanation: 'A winter coat keeps you safe and healthy in cold weather, which makes it a need.' },
      { question: 'Which of these is a Want, not a Need?', options: ['Drinking water', 'A video game', 'A place to sleep', 'A winter coat'], answerIndex: 1, explanation: 'A video game is fun to have but isn\'t required to survive or stay healthy — that makes it a want.' },
    ],
    apply: {
      prompt: 'Look around your room. Draw 2 things that are Needs and 2 things that are Wants, labeling each one.',
      checklist: ['Drew 2 Needs', 'Drew 2 Wants', 'Labeled each drawing correctly'],
    },
    help: {
      videos: [
        { title: 'Needs Vs Wants | Lesson for Kids', url: 'https://www.youtube.com/watch?v=IlFOepd4pTE' },
      ],
    },
  },
  {
    key: 'earnSaveSpendGive',
    title: 'Earn, Save, Spend & Give',
    grade: '3-5',
    color: '#4D96FF',
    description:
      'Money earned from chores or gifts can be split on purpose into jars — Spend, Save, and Give — building healthy money habits early instead of spending everything right away.',
    learn: [
      { heading: 'The Three-Jar System', body: 'Splitting money into three jars — Spend (everyday small treats), Save (bigger goals you\'re working toward), and Give (helping others) — turns money decisions into a habit instead of a guess.' },
      { heading: 'A Little Bit, Every Time', body: 'Every time money comes in — allowance, a birthday gift, or money earned from a chore — divide it among the jars right away. Even putting $1 out of every $10 into Save builds a habit that grows over time.' },
    ],
    practice: [
      { question: 'If you earn $10 doing yard work and put 20% into your Save jar, how much goes into Save?', options: ['$1.00', '$2.00', '$5.00', '$10.00'], answerIndex: 1, explanation: '20% of $10 is $2.00 (10 × 0.20 = 2).' },
      { question: 'What is the purpose of the "Give" jar?', options: ['Buying video games', 'Saving for college', 'Helping others or a cause you care about', 'Paying rent'], answerIndex: 2, explanation: 'The Give jar sets money aside specifically to help others, like a charity or a gift.' },
    ],
    apply: {
      prompt: 'Create a savings goal tracker on paper for an item you want to buy, showing how much you need to save each week to buy it in 4 weeks.',
      checklist: ['Named the savings goal item and its price', 'Divided the total by 4 weeks', 'Drew a tracker with 4 weekly boxes to check off'],
    },
    help: {
      videos: [
        { title: "Elmo's Spend, Share, and Save Jars | Financial Education", url: 'https://www.youtube.com/watch?v=oqgtFqd8nHo' },
      ],
    },
  },
  {
    key: 'budgetingFixedVariable',
    title: 'Budgeting & Fixed vs. Variable Costs',
    grade: '6-8',
    color: '#3AC860',
    description:
      'A budget tracks income and expenses. Learn to tell the difference between fixed expenses (the same every month) and variable expenses (that change), and build a simple budget.',
    learn: [
      { heading: 'Fixed vs. Variable Expenses', body: 'Fixed expenses stay the same every month, like a phone plan or a streaming subscription. Variable expenses change based on choices, like groceries, gas, or eating out — you have more control over these.' },
      { heading: 'Building a Simple Budget', body: 'A budget starts by listing income, then fixed expenses (so you know what\'s locked in), then variable expenses, and finally what\'s left over for saving. Listing fixed expenses first makes sure the essentials are always covered.' },
    ],
    practice: [
      { question: 'Is a $15 monthly streaming membership a fixed or variable expense?', options: ['Fixed expense', 'Variable expense', 'Neither', 'It depends on the day'], answerIndex: 0, explanation: 'A subscription that charges the same amount every month is a fixed expense.' },
      { question: 'Which of these is a variable expense?', options: ['Rent', 'A monthly phone plan', 'Groceries', 'A yearly gym membership fee'], answerIndex: 2, explanation: 'Grocery costs change month to month based on choices, making them variable.' },
    ],
    apply: {
      prompt: 'Build a mock monthly budget for a student who earns $100/month from tutoring. Allocate income across fixed subscriptions, variable spending, and savings.',
      checklist: ['Listed at least 1 fixed expense with an amount', 'Listed at least 1 variable expense with an amount', 'Set aside an amount for savings', 'Total allocated equals $100'],
    },
    help: {
      videos: [
        { title: 'Budgeting Lesson 3: Fixed vs. Variable Expenses | RETHINK Financial Education Curriculum', url: 'https://www.youtube.com/watch?v=Llg5HNnpKdU' },
      ],
    },
  },
  {
    key: 'compoundInterest',
    title: 'The Power of Compound Interest',
    grade: '9-12',
    color: '#8B4FC4',
    description:
      'Simple interest pays only on the original amount saved or borrowed. Compound interest pays on the principal AND on interest already earned — and starting early gives it exponential leverage.',
    learn: [
      { heading: 'Simple vs. Compound Interest', body: 'Simple interest only ever grows based on your original principal. Compound interest, A = P(1 + r/n)^(nt), grows based on the principal PLUS all the interest already earned — so the growth accelerates the longer money stays invested.' },
      { heading: 'Time Is the Real Advantage', body: 'The compounding curve stays fairly flat for the first several years, then steepens sharply — which is why starting to save even small amounts early beats saving larger amounts later, purely because of extra time compounding.' },
    ],
    practice: [
      { question: 'If you invest $1,000 at 10% annual interest compounded yearly, how much do you have after 2 years?', options: ['$1,100', '$1,200', '$1,210', '$1,000'], answerIndex: 2, explanation: 'Year 1: $1,000 × 1.10 = $1,100. Year 2: $1,100 × 1.10 = $1,210 (interest earns interest).' },
      { question: 'What makes compound interest different from simple interest?', options: ['Compound interest is always a lower rate', 'Compound interest grows on principal plus previously earned interest', 'Simple interest grows faster', 'There is no real difference'], answerIndex: 1, explanation: 'Compound interest reinvests earned interest, so future interest is calculated on a growing balance.' },
    ],
    apply: {
      prompt: 'Use an online compound interest calculator to compute the difference at age 60 between investing $100/month starting at age 20 versus starting at age 30 (assuming a 7% average annual return).',
      checklist: ['Calculated the total at age 60 starting at age 20', 'Calculated the total at age 60 starting at age 30', 'Found the dollar difference between the two', 'Wrote 1 sentence explaining why the earlier start wins'],
    },
    help: {
      videos: [
        { title: 'COMPOUND INTEREST explained for beginners 2023 (including rule of 72)', url: 'https://www.youtube.com/watch?v=JWhkxNLOGFk' },
      ],
    },
  },
];

export default function BusinessAndFinanceScreen() {
  return <ClassTopicScreen title={'Business & Finance'} classKey="BusinessAndFinance" fallbackTopics={topics} />;
}
