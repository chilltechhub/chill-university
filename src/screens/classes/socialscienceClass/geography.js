// src/screens/classes/socialscienceClass/geography.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'mapsContinentsOceans',
    title: 'Maps, Continents & Oceans',
    grade: 'K-2',
    color: '#FF6B6B',
    description:
      'Learning to read a world map and name the seven continents and the oceans that surround them.',
    help: {
      videos: [
        {
          title: 'The CONTINENTS for Kids — Geography for Kids',
          url: 'https://www.youtube.com/watch?v=ZsxL2g51VIE',
        },
        {
          title: 'World Maps for Kids 🗺️ Learn Continents, Countries & Oceans in a Fun Way!',
          url: 'https://www.youtube.com/watch?v=4FDcTxvJq1w',
        },
      ],
    },
  },
  {
    key: 'countriesCulturesFlags',
    title: 'Countries, Cultures & Flags',
    grade: '3-5',
    color: '#4D96FF',
    description:
      'Exploring countries around the world — their names, borders, and flags — and getting a first look at how cultures differ from place to place.',
    help: {
      videos: [
        {
          title: 'COUNTRIES of the World for Kids — Learn Continents, Countries Map, Names and Flags',
          url: 'https://www.youtube.com/watch?v=eWXZ7-_o_R4',
        },
        {
          title: '🌍 Around the World 🌍 Countries, Continents & Flags — Geography for kids',
          url: 'https://www.youtube.com/watch?v=NM1dQmzDD6o',
        },
      ],
    },
  },
  {
    key: 'humanPhysicalGeography',
    title: 'Human & Physical Geography',
    grade: '6-8',
    color: '#4CAF50',
    description:
      'How geography connects: continents and countries are made up of cities, addresses, and communities of real people.',
    help: {
      videos: [
        {
          title: 'Geography for Kids | Discover Continents, Countries & Addresses',
          url: 'https://www.youtube.com/watch?v=2xXdifntJDs',
        },
      ],
    },
  },
];

export default function GeographyScreen() {
  return <ClassTopicScreen title={"Geography"} classKey="Geography" fallbackTopics={topics} />;
}
