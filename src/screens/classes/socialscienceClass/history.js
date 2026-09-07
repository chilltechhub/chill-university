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
    learn: [
      { heading: 'Rivers Made Farming Possible', body: 'Long ago, people moved around a lot to hunt animals and gather plants. Near big rivers like the Indus, the water and soil were so good for growing food that people could stay in one place and farm all year.' },
      { heading: 'From Farms to Cities', body: 'When farmers grew more food than their families needed, other people did not have to farm anymore — they could build houses, make tools, or trade instead. That is how small farming villages near the Indus grew into big, busy cities.' },
    ],
    practice: [
      { question: 'Why did early people settle near rivers like the Indus?', options: ['Rivers were fun to swim in', 'Rivers gave water and good soil for farming', 'Rivers had no animals nearby', 'Rivers made travel impossible'], answerIndex: 1, explanation: 'A steady water supply and rich soil let people farm instead of always moving around.' },
      { question: 'What happened when farmers grew extra food?', options: ['Everyone still had to farm', 'Some people could do other jobs, and villages grew into cities', 'The extra food was thrown away', 'People stopped living near the river'], answerIndex: 1, explanation: 'Extra food freed some people to build, make tools, or trade, which helped villages grow into cities.' },
    ],
    apply: {
      prompt: 'Draw a simple map showing a river with a village on its bank. Label 3 things the river gives the village (like water, fish, or good soil).',
      checklist: ['Drew a river on the map', 'Drew a village next to the river', 'Labeled 3 things the river provides'],
    },
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
    learn: [
      { heading: 'River Valley Civilizations', body: 'Early civilizations like Mesopotamia and Ancient Egypt grew up along major rivers — the Tigris, Euphrates, and Nile. River valleys provided fertile soil, fresh water, and easy transportation.' },
      { heading: 'Why the Nile Mattered', body: 'The Nile flooded predictably every year, depositing rich silt on its banks. That silt let ancient Egyptian farmers grow surplus food — freeing some people to become builders, priests, and rulers instead of full-time farmers.' },
    ],
    practice: [
      { question: 'Why was the Nile River essential to ancient Egyptian civilization?', options: ['It never flooded', 'It provided fertile soil for farming and a trade route', 'It was too dangerous to settle near', 'It froze every winter'], answerIndex: 1, explanation: 'Annual flooding deposited fertile silt, and the river also worked as a highway for trade.' },
      { question: 'What do Mesopotamia, Egypt, and the Indus Valley civilizations have in common?', options: ['They were all islands', 'They all formed near major rivers', 'They had no agriculture', 'They were all in the same country'], answerIndex: 1, explanation: 'All three grew up in river valleys, which supplied water, fertile soil, and transportation.' },
    ],
    apply: {
      prompt: 'Find a world map. Identify 2 modern countries that sit along historical river valleys and list 1 natural advantage that location still provides today.',
      checklist: ['Found country #1 on a river valley', 'Found country #2 on a river valley', 'Wrote 1 modern advantage for each'],
    },
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
    learn: [
      { heading: 'A Loaded Word', body: 'Historians once defined "civilization" using a checklist — cities, writing, government, monuments — and judged societies as more or less "advanced" by it. Today most historians treat that checklist skeptically: it was built from a Western viewpoint and often ignored complex societies, like nomadic or oral cultures, that did not fit the mold.' },
      { heading: 'Collapse Is Not Simple', body: 'Civilizations that seem to "collapse," like the Bronze Age societies of the eastern Mediterranean, rarely vanish for one reason. Historians point to combinations of causes — climate shifts, trade breakdowns, invasions, and internal unrest — that stack up and make a society lose the complexity it once had.' },
    ],
    practice: [
      { question: 'Why do many historians today question the traditional "checklist" definition of civilization?', options: ['It has too many categories', 'It reflects a Western bias and excludes societies that do not fit it', 'It is too scientific', 'All historians have always agreed on it'], answerIndex: 1, explanation: 'The checklist approach judged societies by criteria rooted in a Western perspective, sidelining societies organized differently.' },
      { question: 'According to historians, what usually causes a civilization to collapse?', options: ['A single sudden event', 'Multiple combined factors like climate, trade, and conflict', 'Collapse never actually happens', 'Only foreign invasion'], answerIndex: 1, explanation: 'Collapse is typically the result of several stacked pressures rather than one isolated cause.' },
    ],
    apply: {
      prompt: 'Pick one historical or modern society. List 3 factors that could cause it to become unstable (like environment, economy, or conflict), and explain how they might combine.',
      checklist: ['Named the society', 'Listed 3 destabilizing factors', 'Explained how the factors could combine'],
    },
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
