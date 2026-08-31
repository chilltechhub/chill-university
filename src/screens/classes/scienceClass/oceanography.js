// src/screens/classes/scienceClass/oceanography.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'oceanBasics',
    title: 'Ocean Basics & Marine Life',
    grade: 'K-2',
    color: '#FF6B6B',
    description:
      "A first look at Earth's oceans and the huge variety of animals and plants that live in them.",
    help: {
      videos: [
        {
          title: 'Ocean Animals for Kids | Learn all about the Animals and Plants that Live in the Ocean',
          url: 'https://www.youtube.com/watch?v=8adtdg0N2-g',
        },
      ],
    },
  },
  {
    key: 'wavesTidesCurrents',
    title: 'Waves, Tides & Currents',
    grade: '3-5',
    color: '#4D96FF',
    description:
      'What causes ocean waves, tides, and currents, and how they keep the ocean constantly moving.',
    help: {
      videos: [
        {
          title: 'The Ocean in Motion — Tides, Waves, and Currents!',
          url: 'https://www.youtube.com/watch?v=t1d-8domJQ0',
        },
        {
          title: 'Easy Ocean Currents Science Experiment — What are Ocean Currents and How Do They Work?',
          url: 'https://www.youtube.com/watch?v=fKGqmnR6_pY',
        },
      ],
    },
  },
  {
    key: 'oceanEcosystems',
    title: 'Ocean Ecosystems & Human Impact',
    grade: '9-12',
    color: '#4CAF50',
    description:
      'How ocean currents shape marine ecosystems and climate, and how tides and human activity affect the plants and animals that depend on the sea.',
    help: {
      videos: [
        {
          title: 'Oceans and Marine Life – Currents, Ecosystems, and Human Impacts',
          url: 'https://www.youtube.com/watch?v=8JWu92I7G28',
        },
        {
          title: 'How Do Ocean Tides Affect Marine Life?',
          url: 'https://www.youtube.com/watch?v=fUnwvCbs96Q',
        },
      ],
    },
  },
];

export default function OceanographyScreen() {
  return <ClassTopicScreen title={"Oceanography"} classKey="Oceanography" fallbackTopics={topics} />;
}
