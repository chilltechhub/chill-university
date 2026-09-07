// src/screens/classes/homeecworkshopClass/automotive.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'engineFundamentals',
      title: 'Engine Fundamentals & Maintenance',
      grade: '9-12',
      color: '#D32F2F', // Red
      description:
        'Basics of how car engines work and essential maintenance tasks to keep them running smoothly.',
      learn: [
        { heading: 'The Four-Stroke Cycle', body: 'Most car engines run on a four-stroke cycle: intake (fuel and air enter the cylinder), compression (the piston squeezes the mixture), combustion (a spark ignites it, pushing the piston down for power), and exhaust (spent gases leave). This cycle repeats hundreds of times per minute to keep the car moving.' },
        { heading: 'Maintenance Prevents Bigger Problems', body: 'Routine maintenance like changing the oil, checking coolant levels, and replacing air filters keeps an engine running smoothly and prevents expensive damage — motor oil lubricates moving parts and breaks down over time, so most vehicles need it changed every 5,000-7,500 miles. Ignoring warning lights or unusual noises can turn a small, cheap fix into a major repair.' },
      ],
      practice: [
        { question: 'What are the four strokes of a standard car engine cycle, in order?', options: ['Exhaust, compression, intake, combustion', 'Intake, compression, combustion, exhaust', 'Combustion, intake, exhaust, compression', 'Compression, exhaust, intake, combustion'], answerIndex: 1, explanation: 'The four-stroke cycle runs intake, compression, combustion, then exhaust, in that repeating order.' },
        { question: 'Why does motor oil need to be changed regularly?', options: ['It changes color for fun', 'It breaks down over time and loses its ability to lubricate properly', 'Cars run better with less oil', 'It has no real function'], answerIndex: 1, explanation: 'Oil degrades with heat and use, so regular changes keep engine parts properly lubricated and protected.' },
      ],
      apply: {
        prompt: 'With an adult, check your family car\'s owner\'s manual (or look up the model online) to find the recommended oil change interval and what type of oil it uses.',
        checklist: ['Found the owner\'s manual or looked up the model', 'Noted the recommended oil change interval', 'Noted the oil type recommended', 'Checked when the car was last serviced, if known'],
      },
      help: {
        readings: [
          {
            title: "A Beginner’s Guide to Understanding Car Engines",
            url: 'https://beachautomotive.com/blog/a-beginners-guide-to-understanding-car-engines',
          },
        ],
        videos: [
          {
            title: 'Top 10 Car Engine Maintenance Tips For Beginners',
            url: 'https://youtu.be/FLUrVBnuqSo?si=kVSOywjXHsDqVwNh',
          },
        ],
      },
    },
    {
      key: 'brakeSteering',
      title: 'Brake, Suspension & Steering Systems',
      grade: '9-12',
      color: '#FF9800', // Orange
      description:
        'Understanding how brake, suspension, and steering components work and their maintenance.',
      learn: [
        { heading: 'Brakes Convert Motion to Heat', body: 'Most cars use disc brakes, where a caliper squeezes brake pads against a spinning rotor, using friction to slow the wheel — this friction converts the car\'s motion into heat. Brake pads wear down over time and need replacement, often signaled by a squealing sound when the pads get thin.' },
        { heading: 'Suspension and Steering Work Together', body: 'The suspension system (springs, shocks, and struts) absorbs bumps in the road and keeps tires in contact with the pavement, while the steering system translates the driver turning the wheel into the front tires actually turning. Worn suspension parts can cause a bouncy ride or uneven tire wear, both signs it\'s time for an inspection.' },
      ],
      practice: [
        { question: 'What happens when disc brakes are applied?', options: ['A caliper squeezes pads against a rotor to create friction', 'The engine automatically shuts off', 'The steering wheel locks', 'Nothing physical happens'], answerIndex: 0, explanation: 'Disc brakes work by squeezing pads against a spinning rotor, using friction to slow the wheel.' },
        { question: 'What is one common sign that a car\'s suspension may be worn?', options: ['A perfectly smooth, quiet ride', 'A bouncy ride or uneven tire wear', 'Better fuel economy', 'Brighter headlights'], answerIndex: 1, explanation: 'Worn suspension components often cause a bouncy ride and can lead to uneven tire wear over time.' },
      ],
      apply: {
        prompt: 'With an adult, inspect one tire on a family vehicle and check the tread wear pattern — even wear across the tire is a good sign, while wear only on one edge may signal a suspension or alignment issue.',
        checklist: ['Inspected one tire with an adult', 'Checked the tread wear pattern', 'Noted whether wear looked even or uneven', 'Discussed findings with the adult'],
      },
      help: {
        readings: [
          {
            title: 'How the Brake System Works',
            url: 'https://www.wagnerbrake.com/technical/parts-matter/driver-education-and-vehicle-safety/how-the-brake-system-works.html',
          },
          {
            title: 'What Is Suspension in a Car?',
            url: 'https://www.uti.edu/blog/automotive/car-suspension',
          },
          {
            title: 'Different Types of Steering Systems',
            url: 'https://www.xtramileautocare.com/blog/what-are-the-different-types-of-steering-systems',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'electricalDiagnostics',
      title: 'Electrical Diagnostics & Repair',
      grade: '9-12',
      color: '#03A9F4', // Sky Blue
      description:
        'Techniques to diagnose and repair common auto electrical issues, including wiring and battery systems.',
      learn: [
        { heading: 'The Battery Powers the System', body: 'A car battery provides the electrical power to start the engine and run electronics when the engine is off, while the alternator recharges the battery and powers the electrical system once the engine is running. A weak battery is one of the most common reasons a car won\'t start, especially in cold weather.' },
        { heading: 'Diagnosing Starts with a Multimeter', body: 'Technicians use a multimeter to check voltage at the battery and connections, helping pinpoint whether a problem is a dead battery, a bad connection (like corroded terminals), or a failing alternator. Following wiring diagrams carefully matters because auto electrical systems carry enough current to cause sparks, burns, or damage if shorted incorrectly.' },
      ],
      practice: [
        { question: 'What is the main job of the alternator in a car\'s electrical system?', options: ['To start the engine only', 'To recharge the battery and power electronics while the engine runs', 'To steer the car', 'To cool the engine'], answerIndex: 1, explanation: 'The alternator generates electricity while the engine runs, recharging the battery and powering the car\'s electrical systems.' },
        { question: 'What tool do technicians commonly use to check a car\'s electrical voltage?', options: ['A wrench', 'A multimeter', 'A tire gauge', 'A screwdriver'], answerIndex: 1, explanation: 'A multimeter measures voltage, current, and resistance, making it the standard tool for diagnosing electrical issues.' },
      ],
      apply: {
        prompt: 'With an adult, locate the battery in a family car and check the terminals for any visible corrosion (a white or greenish crusty buildup).',
        checklist: ['Located the battery with an adult', 'Checked both terminals', 'Noted whether corrosion was present', 'Reported findings to the adult'],
      },
      help: {
        readings: [
          {
            title: 'Auto Electrical Repair Guide: Diagnosis, Fixes & Prevention',
            url: 'https://mayautomotivellc.com/blog/auto-electrical-repair-guide/',
          },
        ],
        videos: [],
      },
    },
  ];

export default function AutomotiveTechnologyScreen() {
  return <ClassTopicScreen title={"Automotive Technology"} classKey="Automotive" fallbackTopics={topics} />;
}
