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
