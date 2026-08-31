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
