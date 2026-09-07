// src/screens/classes/scienceClass/earth.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'weatherClimate',
    title: 'Weather & Climate',
    grade: 'K-2',
    color: '#FF6B6B',
    description:
      'The difference between weather (day to day) and climate (the pattern over time), and a look at some of Earth\'s most extreme weather.',
    learn: [
      { heading: 'Weather vs. Climate', body: 'Weather is what is happening outside right now, like rain, sun, or snow today. Climate is the usual pattern of weather in a place over many years, like how a desert is usually hot and dry while the North Pole is usually cold and icy.' },
      { heading: 'Extreme Weather', body: 'Sometimes weather gets very big and powerful, like thunderstorms, hurricanes, blizzards, and tornadoes. These extreme events can be dangerous, which is why scientists watch the sky closely and warn people ahead of time so they can stay safe.' },
    ],
    practice: [
      { question: 'Which one describes climate rather than weather?', options: ['It is raining right now', 'Deserts are usually hot and dry', 'It is snowing today', 'There is a rainbow outside'], answerIndex: 1, explanation: 'Climate describes the usual, long-term pattern of weather in a place, not what is happening in one moment.' },
      { question: 'Why do scientists track extreme weather like hurricanes?', options: ['For fun', 'To warn people and help keep them safe', 'To make it rain', 'To change the climate'], answerIndex: 1, explanation: 'Tracking extreme weather lets scientists warn people in advance so they can prepare and stay safe.' },
    ],
    apply: {
      prompt: 'Keep a simple weather journal for 5 days: write or draw whether it was sunny, rainy, cloudy, or windy each day.',
      checklist: ['Recorded weather for at least 5 days', 'Noted the warmest and coldest day', 'Guessed whether the week matched what you\'d expect for your climate'],
    },
    help: {
      videos: [
        {
          title: "Earth's Most Extreme Weather | SciShow Kids Compilation",
          url: 'https://www.youtube.com/watch?v=XnQy_aKpMcw',
        },
      ],
    },
  },
  {
    key: 'rocksSoil',
    title: 'Rocks & Soil',
    grade: '3-5',
    color: '#4D96FF',
    description:
      'How rocks form and change over time, how sedimentary rock builds up in layers, and how weathering breaks rock down into soil.',
    learn: [
      { heading: 'Three Kinds of Rock', body: 'Igneous rock forms when hot melted rock cools and hardens, sedimentary rock forms when layers of sand, mud, and shells press together over time, and metamorphic rock forms when heat and pressure change an existing rock into something new. Rocks are always slowly changing between these types over long stretches of time.' },
      { heading: 'From Rock to Soil', body: 'Weathering is the process of wind, water, ice, and plant roots slowly breaking big rocks into smaller and smaller pieces. Over a very long time, this broken-down rock mixes with dead plant and animal material to become soil, the loose ground that plants grow in.' },
    ],
    practice: [
      { question: 'How does sedimentary rock typically form?', options: ['Melted rock cooling quickly', 'Layers of sediment pressing together over time', 'Sudden heat and pressure', 'Volcanic eruptions'], answerIndex: 1, explanation: 'Sedimentary rock builds up as layers of sand, mud, and other material get pressed together over long periods.' },
      { question: 'What is weathering?', options: ['Rock forming underground', 'Wind, water, and ice breaking rock down', 'Rock melting into lava', 'Soil turning into rock'], answerIndex: 1, explanation: 'Weathering is the gradual breakdown of rock by forces like wind, water, ice, and plant roots.' },
    ],
    apply: {
      prompt: 'Collect 3 different rocks or pebbles from outside and examine them with a magnifying glass, noting their color, texture, and any visible layers or crystals.',
      checklist: ['Collected at least 3 different rocks', 'Described the texture and color of each', 'Guessed which rock type (igneous, sedimentary, or metamorphic) each might be'],
    },
    help: {
      videos: [
        {
          title: 'The Building Blocks of Earth: Rocks | SciShow Kids',
          url: 'https://www.youtube.com/watch?v=TuY1NhrKIeM',
        },
        {
          title: 'The Many Layers of Sedimentary Rocks | SciShow Kids',
          url: 'https://www.youtube.com/watch?v=b5eGg3TxIKc',
        },
        {
          title: 'Weathering and Soil — How Soil Is Formed',
          url: 'https://www.youtube.com/watch?v=aOop-vS58jc',
        },
      ],
    },
  },
  {
    key: 'earthsLayers',
    title: "Earth's Layers & Structure",
    grade: '6-8',
    color: '#4CAF50',
    description:
      "What's beneath our feet: the crust, mantle, outer core, and inner core, and how each layer differs.",
    learn: [
      { heading: 'Four Main Layers', body: "Earth has four main layers: the thin, rocky crust we live on, the hot, slowly flowing mantle beneath it, the liquid metal outer core, and the solid metal inner core at the very center. Each layer gets hotter and denser the deeper you go." },
      { heading: 'Why It Matters', body: "The mantle's slow-flowing rock drives the movement of the tectonic plates that make up Earth's crust, which causes earthquakes, volcanoes, and mountain building over millions of years. The spinning liquid outer core also generates Earth's magnetic field, which shields us from harmful solar radiation." },
    ],
    practice: [
      { question: 'Which layer of Earth do we live on top of?', options: ['The mantle', 'The crust', 'The outer core', 'The inner core'], answerIndex: 1, explanation: 'The crust is the thin, rocky outermost layer where we live.' },
      { question: "What does the movement of Earth's outer core help create?", options: ['Ocean tides', "Earth's magnetic field", 'Weather patterns', 'The atmosphere'], answerIndex: 1, explanation: "The spinning liquid metal outer core generates Earth's protective magnetic field." },
    ],
    apply: {
      prompt: 'Make a model of Earth\'s layers using a hard-boiled egg (or a drawing): the shell is the crust, the egg white is the mantle, and the yolk is the core.',
      checklist: ['Identified or built a model with 3-4 distinct layers', 'Labeled each layer with its name', 'Noted which layer is thickest and which is hottest'],
    },
    help: {
      videos: [
        {
          title: 'Layers of the Earth | Science For Kids',
          url: 'https://www.youtube.com/watch?v=PFzTZJHKkZE',
        },
      ],
    },
  },
];

export default function EarthEnvironmentalScreen() {
  return <ClassTopicScreen title={"Earth & Environmental"} classKey="EarthAndEnvironmental" fallbackTopics={topics} />;
}
