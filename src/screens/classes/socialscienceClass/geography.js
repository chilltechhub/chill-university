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
    learn: [
      { heading: 'Seven Big Land Pieces', body: 'The world has 7 continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America. A continent is a huge piece of land, and we live on one of them right now!' },
      { heading: 'Oceans Are Everywhere', body: 'There are 5 big oceans full of salty water: the Pacific, Atlantic, Indian, Southern, and Arctic. Oceans are so big that they touch almost every continent, and a map uses blue color to show where the water is.' },
    ],
    practice: [
      { question: 'How many continents are there?', options: ['4', '5', '7', '10'], answerIndex: 2, explanation: 'There are 7 continents on Earth.' },
      { question: 'What color do maps usually use to show oceans?', options: ['Green', 'Blue', 'Red', 'Yellow'], answerIndex: 1, explanation: 'Maps use blue to show oceans and other water.' },
    ],
    apply: {
      prompt: 'Draw a big circle for the world. Draw and label 2 continents and 1 ocean on it.',
      checklist: ['Drew a circle for the world', 'Labeled 2 continents', 'Labeled 1 ocean'],
    },
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
    learn: [
      { heading: 'Countries Have Borders', body: 'A country is a piece of land with its own government, laws, and borders — invisible lines that show where one country ends and another begins. There are almost 200 countries in the world, each shown as its own color on a map.' },
      { heading: 'Flags and Culture', body: 'Every country has its own flag, made of colors and symbols that stand for its history or values. Culture is the food, language, holidays, and traditions that people in a place share — and it can be different even between countries that are neighbors.' },
    ],
    practice: [
      { question: 'What is a border?', options: ['A type of flag', 'The line that separates one country from another', 'A kind of ocean', 'A tall mountain'], answerIndex: 1, explanation: 'A border is the line that marks where one country ends and another begins.' },
      { question: 'What does "culture" include?', options: ['Only a country\'s flag', 'Food, language, and traditions people share', 'Only the weather', 'Only the money used'], answerIndex: 1, explanation: 'Culture includes the shared food, language, holidays, and traditions of a group of people.' },
    ],
    apply: {
      prompt: 'Pick one country that is not the one you live in. Find its flag and write down 2 things about its culture (like a food, language, or holiday).',
      checklist: ['Named the country', 'Drew or described its flag', 'Wrote 2 facts about its culture'],
    },
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
    learn: [
      { heading: 'Physical vs. Human Geography', body: 'Physical geography studies natural features — mountains, rivers, climate, and landforms. Human geography studies how people live: where cities form, how populations move, and how people use and change the land around them.' },
      { heading: 'Scale: From World to Address', body: 'Geography works at every scale, from the whole planet down to your street address. A continent contains countries, countries contain cities, and cities contain neighborhoods — each level connects to the ones above and below it.' },
    ],
    practice: [
      { question: 'What does human geography study?', options: ['Only mountains and rivers', 'How people live, move, and use the land', 'Only weather patterns', 'Only oceans'], answerIndex: 1, explanation: 'Human geography focuses on people — where they settle, how populations move, and how they shape the land.' },
      { question: 'Which is an example of physical geography?', options: ['A city\'s population size', 'A mountain range', 'A country\'s government', 'A local language'], answerIndex: 1, explanation: 'Mountain ranges are natural landforms, which is what physical geography studies.' },
    ],
    apply: {
      prompt: 'Write your own address (continent, country, state/region, city). Then note 1 physical geography feature (like a river or hill) and 1 human geography feature (like a road or building) near where you live.',
      checklist: ['Wrote out the full address chain', 'Named 1 physical feature nearby', 'Named 1 human-made feature nearby'],
    },
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
