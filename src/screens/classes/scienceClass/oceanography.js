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
    learn: [
      { heading: 'A Big Blue World', body: "Oceans cover most of Earth's surface with salty water, and they are home to an enormous number of living things, from tiny plankton to giant whales. Ocean animals need water to breathe (through gills) or to swim to the surface for air, like dolphins and whales." },
      { heading: 'Many Kinds of Ocean Life', body: 'Fish, crabs, octopuses, sea turtles, and coral are just a few of the many kinds of animals living in the ocean, and each has special body parts to help it survive underwater, like fins for swimming or shells for protection. Plants and plant-like ocean life, like seaweed, use sunlight near the surface to grow, just like plants on land.' },
    ],
    practice: [
      { question: 'How do fish breathe underwater?', options: ['With lungs', 'With gills', 'They hold their breath', 'They do not need to breathe'], answerIndex: 1, explanation: 'Fish use gills to take oxygen directly from the water.' },
      { question: 'Which ocean animal must swim to the surface to breathe air?', options: ['A crab', 'A dolphin', 'A fish', 'A jellyfish'], answerIndex: 1, explanation: 'Dolphins are mammals and must surface to breathe air through their blowhole, unlike fish.' },
    ],
    apply: {
      prompt: 'Choose 3 ocean animals and draw or describe one special body part each uses to survive in the water (like fins, gills, or a shell).',
      checklist: ['Chose 3 different ocean animals', 'Named one special body part for each', 'Explained how that body part helps it survive'],
    },
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
    learn: [
      { heading: 'Waves and Tides', body: 'Waves are usually caused by wind blowing across the surface of the water, pushing it into rolling shapes. Tides are the regular rise and fall of ocean water levels, caused mainly by the pull of the Moon\'s gravity on Earth\'s oceans, and most coastlines get two high tides and two low tides each day.' },
      { heading: 'Ocean Currents', body: 'Currents are like rivers within the ocean — large, steady movements of water caused by wind, temperature differences, and the rotation of the Earth. Currents carry warm and cold water around the globe, which affects weather and helps sea creatures travel and find food.' },
    ],
    practice: [
      { question: 'What mainly causes ocean waves?', options: ['The Moon\'s gravity', 'Wind blowing across the water', 'Fish swimming', 'Earth spinning'], answerIndex: 1, explanation: 'Waves are primarily created by wind pushing across the surface of the ocean.' },
      { question: 'What mainly causes ocean tides?', options: ['Wind', 'The Moon\'s gravitational pull', 'Ocean currents', 'Boat traffic'], answerIndex: 1, explanation: "The Moon's gravity pulls on Earth's oceans, causing the regular rise and fall we call tides." },
    ],
    apply: {
      prompt: 'If you live near a coast, observe the tide at two different times of day (or look up a tide chart online) and note how the water line changes.',
      checklist: ['Checked or looked up the tide at two different times', 'Noted whether the water was higher or lower each time', 'Explained the change using the Moon\'s pull'],
    },
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
    learn: [
      { heading: 'Currents Shape Ecosystems and Climate', body: 'Ocean currents distribute heat around the planet, moderating regional climates — for example, the Gulf Stream keeps parts of Western Europe milder than their latitude would otherwise suggest. Currents also transport nutrients that support entire marine food webs, from plankton to whales.' },
      { heading: 'Human Impact on the Ocean', body: 'Human activities like overfishing, plastic pollution, and rising carbon dioxide emissions (which cause ocean acidification and warming) are disrupting marine ecosystems worldwide. Coral reefs, which support roughly a quarter of all marine species, are especially sensitive to small changes in ocean temperature and pH.' },
    ],
    practice: [
      { question: 'How do ocean currents affect regional climate?', options: ['They have no effect', 'They distribute heat around the planet', 'They only affect rainfall', 'They cool the entire Earth equally'], answerIndex: 1, explanation: 'Currents like the Gulf Stream carry warm or cold water that moderates the climate of nearby land regions.' },
      { question: 'Why are coral reefs especially vulnerable to climate change?', options: ['They need cold water only', 'They are sensitive to small shifts in temperature and pH', 'They do not support other species', 'They grow faster when oceans warm'], answerIndex: 1, explanation: 'Coral is highly sensitive to changes in ocean temperature and acidity, which can cause bleaching and die-offs.' },
    ],
    apply: {
      prompt: 'Research one specific human impact on the ocean (such as coral bleaching, plastic pollution, or overfishing) and outline one realistic action individuals can take to reduce it.',
      checklist: ['Chose one specific human impact on oceans', 'Explained how it affects marine ecosystems', 'Listed one realistic individual action to help'],
    },
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
