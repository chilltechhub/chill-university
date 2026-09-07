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
    learn: [
      { heading: 'Emotions Show Up in Your Body', body: 'Emotions are not just thoughts — they show up in your body too, like a fast heartbeat when you are scared or a smile when you are happy. Your face and body often tell others how you feel even before you say any words.' },
      { heading: 'Stress and Feelings Are Connected', body: 'Stress happens when something feels hard or worrying, like a big test or a fight with a friend. Too much stress for too long can make your body feel tired or sick, so it helps to notice stress early and find ways to calm down, like deep breathing or talking to someone.' },
    ],
    practice: [
      { question: 'How do emotions often show up besides in your thoughts?', options: ['They never show up anywhere else', 'In your body, like your heartbeat or face', 'Only in your dreams', 'Only when you are alone'], answerIndex: 1, explanation: 'Emotions show up physically too, like a racing heart when scared or a smile when happy.' },
      { question: 'What can happen if stress lasts too long?', options: ['Nothing changes at all', 'It can make your body feel tired or unwell', 'It always makes you stronger', 'It disappears on its own instantly'], answerIndex: 1, explanation: 'Long-lasting stress can affect the body and make a person feel tired or unwell.' },
    ],
    apply: {
      prompt: 'For one day, notice 3 moments when you feel an emotion. Write down the emotion, what your body did (like your face or heartbeat), and what caused it.',
      checklist: ['Recorded 3 different emotional moments', 'Described a body signal for each', 'Named what caused each emotion'],
    },
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
    learn: [
      { heading: 'Groups Change Behavior', body: 'People often act differently in a group than they would by themselves — a behavior called conformity. Someone might go along with what everyone else is doing, even if they privately disagree, because fitting in feels safer than standing out.' },
      { heading: 'Social Influence Is Powerful', body: 'The people around us — friends, family, and even strangers — shape our choices without us always noticing. This can be positive, like a friend encouraging you to try harder, or negative, like feeling pressured to do something you know is not a good idea.' },
    ],
    practice: [
      { question: 'What is conformity?', options: ['Always disagreeing with a group', 'Going along with a group even if you privately disagree', 'Making decisions completely alone', 'Ignoring everyone around you'], answerIndex: 1, explanation: 'Conformity is adjusting your behavior to match a group, sometimes even against your own private opinion.' },
      { question: 'Can social influence be a good thing?', options: ['No, it is always bad', 'Yes, like a friend encouraging positive behavior', 'It only affects adults', 'It only happens online'], answerIndex: 1, explanation: 'Social influence can be positive, such as friends motivating each other to do better.' },
    ],
    apply: {
      prompt: 'Think of a time you did something differently because you were in a group versus alone. Write 2-3 sentences describing what happened and whether the group\'s influence was positive or negative.',
      checklist: ['Described a real group situation', 'Explained how behavior changed', 'Judged whether the influence was positive or negative'],
    },
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
    learn: [
      { heading: 'Psychology vs. Sociology', body: 'Psychology is the scientific study of the mind and individual behavior — how a single person thinks, feels, and acts. Sociology studies people at a broader level: how groups, institutions, and social structures shape human behavior and how individuals develop within society.' },
      { heading: 'Socialization Across a Lifetime', body: 'Socialization is the lifelong process by which people learn the norms, values, and roles of their society, starting with family and expanding to schools, peer groups, and media. This process explains why people from different cultures or generations can hold very different beliefs about what is "normal."' },
    ],
    practice: [
      { question: 'What is the main focus of psychology?', options: ['Government structures', 'The mind and individual behavior', 'International trade', 'Weather patterns'], answerIndex: 1, explanation: 'Psychology is the scientific study of the mind and individual behavior.' },
      { question: 'What does sociology study that psychology typically does not?', options: ['Individual dreams', 'How groups and social structures shape behavior', 'Brain chemistry', 'Personal memory'], answerIndex: 1, explanation: 'Sociology looks at the broader level of groups, institutions, and social structures, not just the individual mind.' },
    ],
    apply: {
      prompt: 'Interview someone from a different generation than you (a parent, grandparent, or older sibling). Ask what "normal" behavior for teenagers looked like when they were young, then compare it to today in 3-4 sentences.',
      checklist: ['Conducted the interview', 'Recorded what was considered normal in their generation', 'Compared it to today in your own words'],
    },
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
