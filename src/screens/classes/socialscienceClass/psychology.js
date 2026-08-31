// src/screens/classes/socialscienceClass/psychology.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'understandingEmotions',
    title: 'Understanding Emotions',
    grade: '3-5',
    color: '#FF6B6B',
    description:
      'What emotions are, how they show up in our bodies and faces, and how stress connects to our feelings and health.',
    help: {
      videos: [
        {
          title: 'Feeling All the Feels: Crash Course Psychology #25',
          url: 'https://www.youtube.com/watch?v=gAMbkJk6gnE',
        },
        {
          title: 'Emotion, Stress, and Health: Crash Course Psychology #26',
          url: 'https://www.youtube.com/watch?v=4KbSRXP0wik',
        },
      ],
    },
  },
  {
    key: 'socialThinking',
    title: 'How We Think & Relate to Others',
    grade: '6-8',
    color: '#4D96FF',
    description:
      'Why people act differently in groups than alone, and how the people around us shape our choices and behavior.',
    help: {
      videos: [
        {
          title: 'Social Thinking: Crash Course Psychology #37',
          url: 'https://www.youtube.com/watch?v=h6HLDV0T5Q8',
        },
        {
          title: 'Social Influence: Crash Course Psychology #38',
          url: 'https://www.youtube.com/watch?v=UGxGDdQnC1Y',
        },
      ],
    },
  },
  {
    key: 'introPsychSociety',
    title: 'Intro to Psychology & Society',
    grade: '9-12',
    color: '#4CAF50',
    description:
      'What psychology actually studies, and how sociology looks at how people grow and connect within a wider society.',
    help: {
      videos: [
        {
          title: 'Intro to Psychology: Crash Course Psychology #1',
          url: 'https://www.youtube.com/watch?v=vo4pMVb0R6M',
        },
        {
          title: 'Social Development: Crash Course Sociology #13',
          url: 'https://www.youtube.com/watch?v=WbBm_YLwowc',
        },
      ],
    },
  },
];

export default function PsychologySociologyScreen() {
  return <ClassTopicScreen title={"Psychology & Sociology"} classKey="PsychologicalAndSociology" fallbackTopics={topics} />;
}
