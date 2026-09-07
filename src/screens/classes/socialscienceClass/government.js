// src/screens/classes/socialscienceClass/government.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'rulesRightsConstitution',
    title: 'Rules, Rights & the Constitution',
    grade: '3-5',
    color: '#FF6B6B',
    description:
      'Why communities need rules, who makes them, and a kid-friendly introduction to the Constitution — the document that lays out America\'s rules.',
    learn: [
      { heading: 'Why We Need Rules', body: 'Rules keep people safe and fair to each other, whether at home, at school, or in a whole country. Without rules, it would be hard to know what is okay to do and what is not, and it would be easier for people to get hurt or treated unfairly.' },
      { heading: 'The Constitution Is Our Rulebook', body: 'The Constitution is the most important set of rules for the United States. It explains how the government is set up, what jobs different leaders have, and what rights every citizen gets to keep, like freedom of speech.' },
    ],
    practice: [
      { question: 'Why do communities need rules?', options: ['To make life boring', 'To keep people safe and treat everyone fairly', 'Rules are not actually needed', 'Only adults need rules'], answerIndex: 1, explanation: 'Rules help keep people safe and make sure everyone is treated fairly.' },
      { question: 'What is the Constitution?', options: ['A list of state capitals', 'The document that sets up America\'s government and rights', 'A map of the country', 'A book of songs'], answerIndex: 1, explanation: 'The Constitution lays out how the U.S. government works and protects citizens\' rights.' },
    ],
    apply: {
      prompt: 'Write 3 rules for your own classroom or home. Next to each rule, explain in 1 sentence why it is fair or helpful.',
      checklist: ['Wrote 3 rules', 'Explained why each rule is fair or helpful', 'Rules make sense for the setting chosen'],
    },
    help: {
      videos: [
        {
          title: 'The Constitution for Kids — Who makes the Rules?',
          url: 'https://www.youtube.com/watch?v=NmwzK1Ba7v0',
        },
        {
          title: 'Constitution for Kids | What It Is and Why It Matters',
          url: 'https://www.youtube.com/watch?v=jsTB7gSfDPI',
        },
      ],
    },
  },
  {
    key: 'congressLawmaking',
    title: 'How Congress & Lawmaking Work',
    grade: '6-8',
    color: '#4D96FF',
    description:
      'Article 1 of the Constitution sets up Congress — the branch of government that makes laws — and explains why it has two chambers.',
    learn: [
      { heading: 'Two Chambers, One Congress', body: 'Article 1 of the Constitution creates Congress, the legislative branch, and splits it into two chambers: the House of Representatives and the Senate. This "bicameral" design was a compromise — the House is based on state population, while the Senate gives every state 2 seats regardless of size.' },
      { heading: 'How a Bill Becomes a Law', body: 'A proposed law, called a bill, has to pass both the House and the Senate in the same form before it goes to the President. This two-chamber process forces lawmakers to debate and compromise, which slows things down but is meant to prevent hasty or one-sided laws.' },
    ],
    practice: [
      { question: 'What are the two chambers of Congress?', options: ['The House and the Senate', 'The Senate and the Supreme Court', 'The House and the Cabinet', 'The Senate and the Presidency'], answerIndex: 0, explanation: 'Congress is bicameral, made up of the House of Representatives and the Senate.' },
      { question: 'How are seats in the Senate assigned to states?', options: ['Based on population', 'Every state gets exactly 2 seats', 'Based on land area', 'States take turns each year'], answerIndex: 1, explanation: 'Every state gets 2 senators no matter its population, unlike the House, which is based on population.' },
    ],
    apply: {
      prompt: 'Pick a rule you wish existed at your school. Write it as a short "bill," then explain how you would get 2 different groups (like students and teachers) to agree to it, just like the House and Senate must agree.',
      checklist: ['Wrote the bill as a short rule', 'Identified the 2 groups that must agree', 'Explained how you would get them to agree'],
    },
    help: {
      videos: [
        {
          title: 'The Constitution for Kids — The Legislative Branch (Article 1)',
          url: 'https://www.youtube.com/watch?v=NJw564qLCQ8',
        },
        {
          title: 'The Bicameral Congress: Crash Course Government and Politics #2',
          url: 'https://www.youtube.com/watch?v=n9defOwVWS8',
        },
      ],
    },
  },
  {
    key: 'constitutionGovernment',
    title: 'The Constitution & U.S. Government',
    grade: '9-12',
    color: '#4CAF50',
    description:
      'The compromises that shaped the Constitution, and how federalism divides power between national and state government.',
    learn: [
      { heading: 'Compromises That Built the Constitution', body: 'The Constitutional Convention of 1787 was full of disagreement, especially between large and small states over representation. The Great Compromise created a bicameral Congress — a House based on population and a Senate with equal representation — while the Three-Fifths Compromise, later erased by the 13th and 14th Amendments, dealt with how enslaved people were counted.' },
      { heading: 'Federalism Divides Power', body: 'Federalism is the system that splits governing power between the national government and the state governments, each with its own responsibilities. Some powers, like declaring war, belong only to the federal government; others, like running local schools, are mostly left to the states; and some, like taxation, are shared by both.' },
    ],
    practice: [
      { question: 'What did the Great Compromise establish?', options: ['A single-chamber legislature', 'A bicameral Congress with a population-based House and equal-representation Senate', 'The abolition of slavery', 'Direct election of the President'], answerIndex: 1, explanation: 'The Great Compromise balanced large and small states by creating two chambers with different representation rules.' },
      { question: 'What does federalism describe?', options: ['Power held only by the President', 'Power divided between national and state governments', 'Power held only by the courts', 'Power divided among foreign nations'], answerIndex: 1, explanation: 'Federalism is a system of government where power is shared between a national government and state governments.' },
    ],
    apply: {
      prompt: 'Choose 3 government powers (like building roads, printing money, running schools, and declaring war). Research and sort each one as a federal power, a state power, or a shared power.',
      checklist: ['Chose 3 government powers', 'Correctly classified each as federal, state, or shared', 'Briefly explained the reasoning for one'],
    },
    help: {
      videos: [
        {
          title: 'The Constitution, the Articles, and Federalism: Crash Course US History #8',
          url: 'https://www.youtube.com/watch?v=bO7FQsCcbD8',
        },
        {
          title: 'Constitutional Compromises: Crash Course Government and Politics #5',
          url: 'https://www.youtube.com/watch?v=kCCmuftyj8A',
        },
      ],
    },
  },
];

export default function CivicsGovernmentScreen() {
  return <ClassTopicScreen title={"Civics & Government"} classKey="CivicsAndGovernment" fallbackTopics={topics} />;
}
