// src/screens/classes/homeecworkshopClass/family.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'lifeStages',
      title: 'Life Stages & Relationships',
      grade: '6-8',
      color: '#FF5722', // Deep Orange
      description:
        'Understanding developmental stages from infancy through adulthood and key relationship types.',
      help: {
        readings: [
          {
            title:
              'What Is Human Development and Why Is It Important?',
            url:
              'https://online.maryville.edu/online-bachelors-degrees/human-development-and-family-studies/resources/stages-of-human-development/',
          },
          {
            title:
              '6 Types of Relationships and Their Effect on Your Life',
            url:
              'https://www.verywellmind.com/6-types-of-relationships-and-their-effect-on-your-life-5209431',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'parentingChildDev',
      title: 'Parenting & Child Development',
      grade: '9-12',
      color: '#4CAF50', // Green
      description:
        'Guidance on effective parenting strategies and understanding milestones in child growth.',
      help: {
        readings: [
          {
            title:
              '9 Steps to More Effective Parenting',
            url:
              'https://kidshealth.org/en/parents/nine-steps.html',
          },
          {
            title:
              'Child Development Guide: Ages and Stages',
            url:
              'https://choc.org/ages-stages/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'agingElderCare',
      title: 'Aging & Elder Care',
      grade: '9-12',
      color: '#3F51B5', // Indigo
      description:
        'Insights on healthy aging, elder care practices, and safety for older adults.',
      help: {
        readings: [
          {
            title: 'Ageing and health (WHO)',
            url: 'https://www.who.int/news-room/fact-sheets/detail/ageing-and-health',
          },
          {
            title:
              'Home Safety Tips for Older Adults',
            url:
              'https://www.nia.nih.gov/health/aging-place/home-safety-tips-older-adults',
          },
        ],
        videos: [],
      },
    },
  ];

export default function FamilyAndHumanDevelopmentScreen() {
  return <ClassTopicScreen title={"Family & Human Development"} classKey="FamilyAndHumanDevelopment" fallbackTopics={topics} />;
}
