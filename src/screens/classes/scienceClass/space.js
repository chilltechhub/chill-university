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
    learn: [
      { heading: 'Our Sun and Planets', body: 'The Sun is a giant ball of hot, glowing gas at the center of our solar system. Eight planets, including Earth, travel around the Sun in big circles called orbits. The Sun gives us light and heat, and without it nothing on Earth could live.' },
      { heading: 'Our Moon', body: 'The Moon travels around the Earth, not the Sun. It does not make its own light — we see it glow because it reflects sunlight, like a mirror. The Moon changes shape in the sky over about a month; that is called its phases.' },
    ],
    practice: [
      { question: 'What is at the center of our solar system?', options: ['The Moon', 'The Sun', 'Earth', 'A star cluster'], answerIndex: 1, explanation: 'The Sun sits at the center, and the planets orbit around it.' },
      { question: 'Why does the Moon appear to glow at night?', options: ['It makes its own light', 'It reflects sunlight', 'It is on fire', 'It is made of light'], answerIndex: 1, explanation: "The Moon has no light of its own — we see sunlight bouncing off it." },
    ],
    apply: {
      prompt: 'Watch the Moon every night for a week (or look at photos online) and draw what shape it is each night.',
      checklist: ['Drew or noted the Moon shape for at least 5 nights', 'Circled the night it looked most "full"', 'Circled the night it looked most "thin" or hidden'],
    },
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
    learn: [
      { heading: 'What Is a Galaxy?', body: 'A galaxy is a huge collection of stars, gas, dust, and planets all held together by gravity. Our solar system is just one tiny part of the Milky Way galaxy, which contains hundreds of billions of stars arranged in a spinning, spiral shape.' },
      { heading: 'Stars Are Suns', body: 'Every star you see at night is a giant ball of burning gas, just like our Sun — they only look small and dim because they are unimaginably far away. Stars come in different sizes, colors, and temperatures, and some are much bigger and hotter than our own Sun.' },
    ],
    practice: [
      { question: 'What galaxy is our solar system located in?', options: ['Andromeda', 'The Milky Way', 'The Sombrero Galaxy', 'The Orion Nebula'], answerIndex: 1, explanation: 'Our solar system is one small part of the spiral-shaped Milky Way galaxy.' },
      { question: 'Why do stars look tiny in the night sky even though many are bigger than the Sun?', options: ['They are actually small', 'They are extremely far away', 'They are dying out', 'They are made of ice'], answerIndex: 1, explanation: 'Stars are so far from Earth that their enormous size appears as a tiny point of light.' },
    ],
    apply: {
      prompt: 'On a clear night, go outside (or use a stargazing app) and try to spot a patch of sky that looks hazy or "milky" — that band is part of our own Milky Way galaxy viewed from inside it.',
      checklist: ['Found a dark viewing spot away from bright lights', 'Located or identified the Milky Way band or a star app equivalent', 'Counted how many individual stars you could see with just your eyes'],
    },
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
    learn: [
      { heading: 'A Universe of Galaxies', body: 'Beyond the Milky Way lie billions of other galaxies, each containing billions of stars of its own, spread across the observable universe. Galaxies come in different shapes — spiral, elliptical, and irregular — and are grouped into clusters held together by gravity.' },
      { heading: 'How We Study Them', body: 'Astronomers use telescopes that detect visible light, radio waves, and infrared radiation to study galaxies too far away to visit. Because light takes time to travel, looking at a distant galaxy means seeing it as it looked millions or billions of years ago.' },
    ],
    practice: [
      { question: 'Which of these is NOT a common galaxy shape?', options: ['Spiral', 'Elliptical', 'Irregular', 'Cubic'], answerIndex: 3, explanation: 'Galaxies are generally classified as spiral, elliptical, or irregular — not cubic.' },
      { question: 'Why does looking at a distant galaxy show us the past?', options: ['Telescopes are old technology', 'Light takes time to travel across space', 'Galaxies move backward in time', 'Old photos are used'], answerIndex: 1, explanation: 'Because light travels at a fixed speed, light from far away left its source long ago, so we see it as it was in the past.' },
    ],
    apply: {
      prompt: 'Research one real galaxy other than the Milky Way (such as Andromeda) and create a short fact sheet about its shape, distance from Earth, and how it was discovered.',
      checklist: ['Named the galaxy and its shape', 'Recorded its approximate distance from Earth in light-years', 'Noted the telescope or method used to study it'],
    },
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
