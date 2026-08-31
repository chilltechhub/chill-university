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
