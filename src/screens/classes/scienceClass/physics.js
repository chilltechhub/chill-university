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
    learn: [
      { heading: 'What Is a Force?', body: 'A force is simply a push or a pull. Every time you throw a ball, open a door, or kick a soccer ball, you are using a force to make something move, stop, or change direction.' },
      { heading: 'Bigger Push, Bigger Change', body: 'A bigger force makes an object speed up, slow down, or change direction more. A gentle push rolls a toy car slowly, while a hard push sends it zooming — and friction, the rubbing between surfaces, is a force that slows moving things down.' },
    ],
    practice: [
      { question: 'Which of these is an example of a force?', options: ['A color', 'A push', 'A sound', 'A smell'], answerIndex: 1, explanation: 'A push (or a pull) is a force — it can start, stop, or change an object\'s motion.' },
      { question: 'What force slows down a rolling ball on the ground?', options: ['Gravity', 'Friction', 'Magnetism', 'Light'], answerIndex: 1, explanation: 'Friction is the rubbing force between the ball and the ground that slows it down.' },
    ],
    apply: {
      prompt: 'Roll a ball or toy car on three different surfaces (like carpet, wood floor, and grass) with the same push each time, and see which surface lets it roll the farthest.',
      checklist: ['Tested on at least 3 different surfaces', 'Used about the same push each time', 'Recorded which surface let it roll farthest and guessed why'],
    },
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
    learn: [
      { heading: 'Work and Energy', body: 'In physics, "work" happens only when a force moves an object over a distance — pushing on a wall that doesn\'t budge is not scientific work. Energy is the ability to do work, and it can change forms, like when the chemical energy in food becomes kinetic energy when you run.' },
      { heading: 'Simple Machines', body: 'Simple machines like levers, pulleys, wheels, and inclined planes don\'t create new energy — they just change the size or direction of a force, making a task easier to do. A ramp, for example, lets you move something heavy upward using less force spread over a longer distance.' },
    ],
    practice: [
      { question: 'In physics, when does "work" actually happen?', options: ['Whenever you feel tired', 'When a force moves an object over a distance', 'Only when using a machine', 'When energy is destroyed'], answerIndex: 1, explanation: 'Scientific work requires a force to actually move an object across some distance.' },
      { question: 'What do simple machines like ramps and levers actually do?', options: ['Create new energy', 'Destroy energy', 'Change the size or direction of a force', 'Store electricity'], answerIndex: 2, explanation: 'Simple machines make tasks easier by changing how much force is needed or which direction it is applied, not by creating energy.' },
    ],
    apply: {
      prompt: 'Build a simple ramp (a board propped on books) and compare how much easier it feels to slide a heavy book up the ramp versus lifting it straight up.',
      checklist: ['Built a ramp at one incline', 'Tried lifting the object straight up and noted the effort', 'Tried sliding it up the ramp and compared the effort'],
    },
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
    learn: [
      { heading: 'Simple Harmonic Motion', body: 'Simple harmonic motion is a repeating back-and-forth movement, like a pendulum swinging or a spring bouncing, where the restoring force pulling the object back to center is proportional to how far it has moved. The time for one full swing, called the period, stays constant for a given pendulum length, regardless of how wide the swing is.' },
      { heading: 'Heat and Thermodynamics', body: 'Thermodynamics is the study of heat and energy transfer. Heat always flows from a hotter object to a colder one until they reach the same temperature, and the total energy in a closed system is always conserved — it just changes form, as described by the first law of thermodynamics.' },
    ],
    practice: [
      { question: 'What determines the period of a simple pendulum?', options: ['How wide it swings', 'Its length', 'Its color', 'How heavy the bob is'], answerIndex: 1, explanation: 'A pendulum\'s period depends mainly on its length (and gravity), not its swing width or mass.' },
      { question: 'According to thermodynamics, which direction does heat naturally flow?', options: ['Cold to hot', 'Hot to cold', 'It never moves', 'Randomly'], answerIndex: 1, explanation: 'Heat spontaneously flows from a hotter object to a colder one until thermal equilibrium is reached.' },
    ],
    apply: {
      prompt: 'Build a simple pendulum with string and a small weight, then test how changing the string length affects the time for 10 full swings.',
      checklist: ['Timed 10 swings at one string length', 'Changed the length and timed 10 swings again', 'Compared results and explained the relationship between length and period'],
    },
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
