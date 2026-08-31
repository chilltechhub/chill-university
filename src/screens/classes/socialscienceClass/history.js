// src/screens/classes/socialscienceClass/history.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'earlyCivilizations',
    title: 'Early Civilizations',
    grade: '3-5',
    color: '#FF6B6B',
    description:
      'How the first great civilizations rose around rivers like the Indus, and how a steady water supply let farming — and cities — grow.',
    help: {
      videos: [
        {
          title: 'Indus Valley Civilization: Crash Course World History #2',
          url: 'https://www.youtube.com/watch?v=n7ndRwqJYDM',
        },
        {
          title: 'Water and Classical Civilizations: Crash Course World History 222',
          url: 'https://www.youtube.com/watch?v=rP54LFFSZ1Q',
        },
      ],
    },
  },
  {
    key: 'ancientCivilizations',
    title: 'Ancient Civilizations',
    grade: '6-8',
    color: '#4D96FF',
    description:
      'Two of the ancient world\'s most influential civilizations: Mesopotamia, in the Fertile Crescent, and Ancient Egypt along the Nile.',
    help: {
      videos: [
        {
          title: 'Mesopotamia: Crash Course World History #3',
          url: 'https://www.youtube.com/watch?v=sohXPx_XZ6Y',
        },
        {
          title: 'Ancient Egypt: Crash Course World History #4',
          url: 'https://www.youtube.com/watch?v=Z3Wvw6BivVI',
        },
      ],
    },
  },
  {
    key: 'rethinkingHistory',
    title: 'Rethinking Civilization',
    grade: '9-12',
    color: '#4CAF50',
    description:
      'What historians actually mean by "civilization," why the label is more complicated than it sounds, and how even great civilizations can collapse.',
    help: {
      videos: [
        {
          title: 'Rethinking Civilization — Crash Course World History 201',
          url: 'https://www.youtube.com/watch?v=wyzi9GNZFMU',
        },
        {
          title: 'The End of Civilization (In the Bronze Age): Crash Course World History 211',
          url: 'https://www.youtube.com/watch?v=ErOitC7OyHk',
        },
      ],
    },
  },
];

export default function HistoryScreen() {
  return <ClassTopicScreen title={"History"} classKey="History" fallbackTopics={topics} />;
}
