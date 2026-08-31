// src/screens/classes/languageartClass/speakinglistening.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    // Comprehension & Collaboration (Teal)
    {
      key: 'activeListening',
      title: 'Active Listening',
      grade: 'K-2',
      color: '#009688',
      description:
        'Focusing fully on the speaker, understanding their message, and responding thoughtfully.',
      help: {
        videos: [
          {
            title: '3 Ways To Be A Better Listener',
            url: 'https://youtu.be/mnUp7WgZ2TU?si=N8seRIklqHtmCjUr',
          },
        ],
      },
    },
    {
      key: 'participatingDiscussions',
      title: 'Participating in Discussions',
      grade: '3-5',
      color: '#009688',
      description:
        'Engaging respectfully with others by sharing ideas, asking questions, and building on peers’ contributions.',
      help: {
        videos: [
          {
            title: 'All About Social Skill for Kids',
            url: 'https://youtu.be/Myf2CUx9E60?si=dJ1JbVX3HozDDq0B',
          },
        ],
      },
    },
    {
      key: 'askingAnsweringQuestions',
      title: 'Asking & Answering Questions',
      grade: 'K-2',
      color: '#009688',
      description:
        'Formulating clear questions and providing thoughtful answers in conversations or group settings.',
      help: {
        videos: [
          {
            title: 'Daily Use Questions and Answers For Kids',
            url: 'https://youtu.be/jW6uB7KmB8s?si=r6C6MDPUOfPzxIvO',
          },
        ],
      },
    },

    // Presentation of Knowledge & Ideas (Amber)
    {
      key: 'oralPresentations',
      title: 'Oral Presentations',
      grade: '6-8',
      color: '#FFC107',
      description:
        'Organizing and delivering information verbally to inform or persuade an audience.',
      help: {
        videos: [],
      },
    },
    {
      key: 'storytellingDramaticReadings',
      title: 'Storytelling & Dramatic Readings',
      grade: '3-5',
      color: '#FFC107',
      description:
        'Using expressive voice and gestures to tell stories or perform excerpts from texts.',
      help: {
        videos: [],
      },
    },
    {
      key: 'multimediaVisualAids',
      title: 'Use of Multimedia/Visual Aids',
      grade: '9-12',
      color: '#FFC107',
      description:
        'Incorporating images, slides, or audio to enhance understanding during a presentation.',
      help: {
        videos: [],
      },
    },
  ];

export default function SpeakingAndListening() {
  return <ClassTopicScreen title={"Speaking & Listening"} classKey="SpeakingAndListening" fallbackTopics={topics} />;
}
