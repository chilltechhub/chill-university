// src/screens/classes/scienceClass/physics.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'forcesMotion',
    title: 'Forces & Motion',
    grade: '3-5',
    color: '#FF6B6B',
    description:
      'How pushes and pulls make things move, speed up, slow down, or change direction.',
    help: {
      videos: [
        {
          title: 'FORCE & MOTION How Things Move *Explained* | Science for Kids!',
          url: 'https://www.youtube.com/watch?v=rfeVlNL7d9U',
        },
        {
          title: 'Motion in a Straight Line: Crash Course Physics #1',
          url: 'https://www.youtube.com/watch?v=ZM8ECpBuQYE',
        },
      ],
    },
  },
  {
    key: 'energyWorkMachines',
    title: 'Energy, Work & Simple Machines',
    grade: '6-8',
    color: '#4D96FF',
    description:
      'What "work" means in physics, how energy moves and transforms, and how simple machines make work easier.',
    help: {
      videos: [
        {
          title: 'Work, Energy, and Power: Crash Course Physics #9',
          url: 'https://www.youtube.com/watch?v=w4QFJb9a8vo',
        },
        {
          title: 'Force and motion | Science for kids | Energy | Machines | Types of force',
          url: 'https://www.youtube.com/watch?v=NnejP0Zn75M',
        },
      ],
    },
  },
  {
    key: 'motionThermodynamics',
    title: 'Advanced Motion & Thermodynamics',
    grade: '9-12',
    color: '#4CAF50',
    description:
      'Repeating motion like springs and pendulums (simple harmonic motion), plus the basics of heat, energy transfer, and thermodynamics.',
    help: {
      videos: [
        {
          title: 'Simple Harmonic Motion: Crash Course Physics #16',
          url: 'https://www.youtube.com/watch?v=jxstE6A_CYQ',
        },
        {
          title: 'Thermodynamics: Crash Course Physics #23',
          url: 'https://www.youtube.com/watch?v=4i1MUWJoI0U',
        },
      ],
    },
  },
];

export default function PhysicsScreen() {
  return <ClassTopicScreen title={"Physics"} classKey="Physics" fallbackTopics={topics} />;
}
