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
    learn: [
      { heading: 'Three States of Matter', body: 'A solid holds its own shape, like an ice cube or a rock. A liquid takes the shape of whatever container it is in but keeps the same amount of space, like water. A gas spreads out to fill any space it is in, like the air around us.' },
      { heading: 'Changing State', body: 'Adding heat can turn a solid into a liquid (melting) and a liquid into a gas (evaporating), while removing heat does the opposite (freezing and condensing). The matter itself stays the same stuff — only its state changes, like water freezing into ice and melting back again.' },
    ],
    practice: [
      { question: 'What happens when you heat an ice cube until it becomes water?', options: ['Freezing', 'Melting', 'Evaporating', 'Condensing'], answerIndex: 1, explanation: 'Melting is the change from a solid to a liquid caused by adding heat.' },
      { question: 'Which state of matter spreads out to fill its whole container?', options: ['Solid', 'Liquid', 'Gas', 'None of these'], answerIndex: 2, explanation: 'Gas particles spread apart to fill all the available space in a container.' },
    ],
    apply: {
      prompt: 'Put an ice cube in a cup and watch it change state over an hour, checking on it every 15 minutes.',
      checklist: ['Recorded what the ice looked like at the start', 'Checked and noted changes every 15 minutes', 'Described the state change(s) you observed by the end'],
    },
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
    learn: [
      { heading: 'Atoms and Elements', body: 'An atom is the smallest unit of matter that still has the properties of an element. An element is a pure substance made of only one type of atom — like oxygen, gold, or hydrogen — and there are about 118 known elements, each listed on the periodic table.' },
      { heading: 'Molecules Are Combinations', body: 'When two or more atoms bond together, they form a molecule. Some molecules are made of one element, like O2 (two oxygen atoms), while others are compounds made of different elements bonded together, like H2O (water), which is two hydrogen atoms and one oxygen atom.' },
    ],
    practice: [
      { question: 'What is an element?', options: ['A mix of different atoms', 'A pure substance made of one type of atom', 'A type of molecule only', 'A liquid'], answerIndex: 1, explanation: 'An element is a pure substance made up of only one kind of atom.' },
      { question: 'What does the formula H2O tell you?', options: ['1 hydrogen atom and 2 oxygen atoms', '2 hydrogen atoms and 1 oxygen atom', '2 hydrogen molecules', 'Pure oxygen'], answerIndex: 1, explanation: 'H2O means each water molecule is made of two hydrogen atoms bonded to one oxygen atom.' },
    ],
    apply: {
      prompt: 'Look at the ingredient list on 3 household items (like table salt, baking soda, and water) and research what elements make up each one.',
      checklist: ['Listed 3 household substances', 'Identified the elements in each (e.g. salt = sodium + chlorine)', 'Noted whether each is an element or a compound'],
    },
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
    learn: [
      { heading: 'Organized by Atomic Number', body: 'The periodic table arranges all known elements in order of atomic number — the number of protons in one atom of that element. Elements are grouped into rows (periods) and columns (groups), and elements in the same column share similar chemical properties because they have the same number of electrons in their outer shell.' },
      { heading: 'Predicting Properties', body: 'Because of its organization, the periodic table lets scientists predict how an element will behave before ever testing it — for example, elements in the leftmost column (alkali metals) are all highly reactive with water. Metals, nonmetals, and metalloids each occupy their own regions of the table.' },
    ],
    practice: [
      { question: 'What determines an element\'s position (atomic number) on the periodic table?', options: ['Its color', 'The number of protons in its atoms', 'Its melting point', 'Its weight in grams'], answerIndex: 1, explanation: 'Atomic number is defined by the number of protons in an atom, and elements are arranged in order of this number.' },
      { question: 'Why do elements in the same column of the periodic table behave similarly?', options: ['They are the same size', 'They have similar outer electron arrangements', 'They are all metals', 'They were discovered together'], answerIndex: 1, explanation: 'Elements in the same group share a similar number of outer-shell electrons, which drives similar chemical behavior.' },
    ],
    apply: {
      prompt: 'Pick 3 elements from different regions of the periodic table (a metal, a nonmetal, and a noble gas) and research one real-world use for each.',
      checklist: ['Chose one metal, one nonmetal, and one noble gas', 'Found each element\'s atomic number', 'Recorded one real-world use for each element'],
    },
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
