// src/screens/classes/scienceClass/biology.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'livingThings',
    title: 'Living Things & Classification',
    grade: 'K-2',
    color: '#FF6B6B',
    description:
      'What makes something alive, and how living things get the energy they need to grow. An introduction to sorting plants and animals by what they eat and how they live.',
    learn: [
      { heading: 'Living or Non-Living?', body: 'Living things need food, water, air, and room to grow — like plants, animals, and people. Non-living things do not eat, breathe, or grow on their own — like rocks, toys, and chairs.' },
      { heading: 'Tricky Cases', body: 'A toy robot can move on its own, but it doesn\'t eat, grow, or need air — so it\'s non-living. A seed looks still, but it drinks water and grows into a plant — so it\'s living.' },
    ],
    practice: [
      { question: 'Is a tree living or non-living?', options: ['Living', 'Non-living'], answerIndex: 0, explanation: 'A tree drinks water, uses sunlight, and grows — that makes it living.' },
      { question: 'Which of these is non-living?', options: ['A dog', 'A rock', 'A flower', 'A person'], answerIndex: 1, explanation: "A rock doesn't eat, breathe, or grow." },
    ],
    apply: {
      prompt: 'Walk around your room or yard. Find 2 living things and 2 non-living things, and photograph or draw a checklist of them.',
      checklist: ['Found 1st living thing', 'Found 2nd living thing', 'Found 1st non-living thing', 'Found 2nd non-living thing'],
    },
    help: {
      videos: [
        {
          title: 'Feed Me: Classifying Organisms — Crash Course Kids',
          url: 'https://www.youtube.com/watch?v=AHCOzc143Ec',
        },
      ],
    },
  },
  {
    key: 'cellsBodySystems',
    title: 'Cells & Body Systems',
    grade: '6-8',
    color: '#4D96FF',
    description:
      'The cell as the basic unit of life, and how animal cells are organized to build tissues, organs, and body systems that work together.',
    learn: [
      { heading: 'The Cell: Life\'s Basic Unit', body: 'Every living thing is made of cells, the smallest units that can carry out the functions of life. A cell has a nucleus that controls its activities, a cell membrane that holds it together, and organelles like mitochondria that produce energy for the cell to use.' },
      { heading: 'From Cells to Systems', body: 'Similar cells group together to form tissues, tissues combine to form organs like the heart or lungs, and organs work together as organ systems, like the circulatory or respiratory system. This organization lets a complex body like yours carry out life functions no single cell could manage alone.' },
    ],
    practice: [
      { question: 'What part of the cell controls its activities?', options: ['The cell membrane', 'The nucleus', 'The mitochondria', 'The cytoplasm'], answerIndex: 1, explanation: 'The nucleus acts as the control center of the cell, directing its activities.' },
      { question: 'What is the correct order of organization from smallest to largest?', options: ['Organ, tissue, cell, system', 'Cell, tissue, organ, system', 'System, organ, tissue, cell', 'Tissue, cell, system, organ'], answerIndex: 1, explanation: 'Cells combine into tissues, tissues form organs, and organs work together as organ systems.' },
    ],
    apply: {
      prompt: 'Pick one body system (like the digestive or circulatory system) and diagram its main organs, labeling the job each organ does.',
      checklist: ['Chose one body system', 'Listed at least 3 organs in that system', 'Wrote one job for each organ'],
    },
    help: {
      videos: [
        {
          title: 'A Tour of the Cell: Crash Course Biology #23',
          url: 'https://www.youtube.com/watch?v=jsDxw63QqK0',
        },
        {
          title: 'Eukaryopolis — The City of Animal Cells: Crash Course Biology #4',
          url: 'https://www.youtube.com/watch?v=cj8dDTHGJBY',
        },
      ],
    },
  },
  {
    key: 'cellProcesses',
    title: 'How Cells Live & Reproduce',
    grade: '9-12',
    color: '#4CAF50',
    description:
      'How a cell copies itself through mitosis, and how mitochondria turn food into usable energy through cellular respiration.',
    learn: [
      { heading: 'Mitosis: Copying a Cell', body: 'Mitosis is the process by which one cell divides into two identical daughter cells, each with a complete copy of the original DNA. It proceeds through distinct phases — prophase, metaphase, anaphase, and telophase — and is how your body grows, replaces worn-out cells, and heals wounds.' },
      { heading: 'Cellular Respiration', body: 'Cellular respiration is the process mitochondria use to convert glucose (sugar) and oxygen into usable energy (ATP), releasing carbon dioxide and water as byproducts. This is essentially the reverse of photosynthesis, and it happens continuously in nearly every cell in your body to power everything you do.' },
    ],
    practice: [
      { question: 'What is the main purpose of mitosis?', options: ['To create sperm and egg cells', 'To produce two identical daughter cells for growth and repair', 'To break down glucose for energy', 'To combine two different cells'], answerIndex: 1, explanation: 'Mitosis produces two genetically identical daughter cells, allowing organisms to grow and repair tissue.' },
      { question: 'What do mitochondria produce during cellular respiration?', options: ['Oxygen', 'DNA', 'Usable energy (ATP)', 'Chlorophyll'], answerIndex: 2, explanation: 'Mitochondria convert glucose and oxygen into ATP, the energy currency cells use to function.' },
    ],
    apply: {
      prompt: 'Track your breathing rate before and after one minute of exercise (like jumping jacks) to see cellular respiration\'s oxygen demand in action.',
      checklist: ['Counted resting breaths per minute', 'Did 1 minute of exercise', 'Counted breaths per minute right after and explained the change using cellular respiration'],
    },
    help: {
      videos: [
        {
          title: 'Mitosis & the Cell Cycle: How Cells Clone Themselves: Crash Course Biology #29',
          url: 'https://www.youtube.com/watch?v=skPOXcVvS5c',
        },
        {
          title: 'Cellular Respiration: Do Cells Breathe?: Crash Course Biology #27',
          url: 'https://www.youtube.com/watch?v=HeO3yagexTw',
        },
      ],
    },
  },
];

export default function BiologyScreen() {
  return <ClassTopicScreen title={"Biology"} classKey="Biology" fallbackTopics={topics} />;
}
