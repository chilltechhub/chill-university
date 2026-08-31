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
