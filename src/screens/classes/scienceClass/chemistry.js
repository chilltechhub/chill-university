// src/screens/classes/scienceClass/chemistry.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'statesOfMatter',
    title: 'Matter & States of Matter',
    grade: '3-5',
    color: '#FF6B6B',
    description:
      'Everything around us is made of matter — solid, liquid, or gas. An introduction to elements, compounds, and how matter changes state.',
    help: {
      videos: [
        {
          title: 'Chemical Elements & Compounds, Periodic Table, States of Matter — Chemistry Lesson for Children',
          url: 'https://www.youtube.com/watch?v=kwQXR6lqrj4',
        },
      ],
    },
  },
  {
    key: 'atomsElements',
    title: 'Atoms & Elements',
    grade: '6-8',
    color: '#4D96FF',
    description:
      'Atoms are the building blocks of every element. How atoms, elements, and molecules relate to each other, with real examples.',
    help: {
      videos: [
        {
          title: 'Elements and Atoms and the Periodic Table of Elements',
          url: 'https://www.youtube.com/watch?v=ozUWPUYemf4',
        },
        {
          title: 'Atoms, Elements, and Molecules with Examples | Periodic Table Chemistry',
          url: 'https://www.youtube.com/watch?v=0d6Mhm5t8eM',
        },
      ],
    },
  },
  {
    key: 'periodicTable',
    title: 'The Periodic Table',
    grade: '9-12',
    color: '#4CAF50',
    description:
      'How the periodic table organizes every known element by atomic number and electron configuration, and what that tells us about an element\'s properties.',
    help: {
      videos: [
        {
          title: 'Understanding the Periodic Table — Elements, Atoms, Isotopes',
          url: 'https://www.youtube.com/watch?v=5FZJcf8CYJQ',
        },
        {
          title: 'The periodic table | Chemistry | Khan Academy',
          url: 'https://www.youtube.com/watch?v=CtTmUlp3bBo',
        },
      ],
    },
  },
];

export default function ChemistryScreen() {
  return <ClassTopicScreen title={"Chemistry"} classKey="Chemistry" fallbackTopics={topics} />;
}
