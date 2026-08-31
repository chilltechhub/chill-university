// src/screens/classes/scienceClass/space.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'solarSystem',
    title: 'The Sun, Moon & Solar System',
    grade: 'K-2',
    color: '#FF6B6B',
    description:
      'A tour of our solar system — the Sun, the planets, and our Moon — and how they all fit together.',
    help: {
      videos: [
        {
          title: 'Space for Kids | Learn About Planets, The Sun & the Solar System',
          url: 'https://www.youtube.com/watch?v=j9TsI_klm1s',
        },
        {
          title: 'Exploring Our Solar System: Planets and Space for Kids — FreeSchool',
          url: 'https://www.youtube.com/watch?v=Qd6nLM2QlWw',
        },
      ],
    },
  },
  {
    key: 'starsGalaxies',
    title: 'Stars & Galaxies',
    grade: '6-8',
    color: '#4D96FF',
    description:
      'Zooming out from our solar system to our home galaxy, the Milky Way, and the billions of stars it contains.',
    help: {
      videos: [
        {
          title: 'Get to Know Your Galaxy! | Astronomy for Kids',
          url: 'https://www.youtube.com/watch?v=DtiRn0Ecpjc',
        },
        {
          title: 'The Milky Way for Children, Galaxies and Space: Astronomy for Kids — FreeSchool',
          url: 'https://www.youtube.com/watch?v=RubnGwhcT6E',
        },
      ],
    },
  },
  {
    key: 'spaceExploration',
    title: 'Beyond Our Galaxy & Space Exploration',
    grade: '9-12',
    color: '#4CAF50',
    description:
      "Our place in the wider universe — what lies beyond the Milky Way, and how astronomers study galaxies far beyond our own.",
    help: {
      videos: [
        {
          title: 'Beyond the Solar System — Exploring the Galaxies of the Universe',
          url: 'https://www.youtube.com/watch?v=v2d-9hjxai8',
        },
      ],
    },
  },
];

export default function AstronomySpaceScreen() {
  return <ClassTopicScreen title={"Astronomy & Space"} classKey="AstronomyAndSpace" fallbackTopics={topics} />;
}
