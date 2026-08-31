// src/screens/classes/homeecworkshopClass/health.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'personalHygiene',
      title: 'Personal Hygiene & Self-Care',
      grade: 'K-2',
      color: '#009688', // Teal
      description:
        'Practicing proper hygiene habits and self-care routines to maintain cleanliness and overall health.',
      help: {
        readings: [
          {
            title: 'Creating a Personal Hygiene Routine: Tips and Benefits',
            url: 'https://www.healthline.com/health/personal-hygiene',
          },
          {
            title: '7 Tips for Practicing Self-Care',
            url: 'https://turningpointcare.com/blog/7-tips-for-practicing-self-care/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'stressManagement',
      title: 'Stress Management & Mental Health',
      grade: '6-8',
      color: '#9C27B0', // Purple
      description:
        'Techniques to manage stress, support mental well-being, and recognize signs of emotional health needs.',
      help: {
        readings: [
          {
            title: 'Caring for Your Mental Health',
            url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health',
          },
          {
            title: 'Managing Stress',
            url: 'https://www.cdc.gov/mental-health/living-with/index.html',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'firstAid',
      title: 'First Aid & Safety Basics',
      grade: '6-8',
      color: '#F44336', // Red
      description:
        'Basic emergency response skills to treat common injuries and ensure safety in everyday situations.',
      help: {
        readings: [
          {
            title: 'First Aid Steps',
            url: 'https://www.redcross.org/take-a-class/first-aid/performing-first-aid/first-aid-steps?srsltid=AfmBOooDbmE2tmoBx-6eEkKe-6YMl_PMe-0hQ0gdC3fCKaSY10k_6Zbo',
          },
          {
            title: 'Basic First Aid Skills Everyone Should Learn',
            url: 'https://www.idahomedicalacademy.com/basic-first-aid-skills-everyone-should-learn/',
          },
          {
            title: 'Cuts and Scrapes: First Aid',
            url: 'https://www.mayoclinic.org/first-aid/first-aid-cuts/basics/art-20056711',
          },
        ],
        videos: [],
      },
    },
  ];

export default function HealthAndWellnessScreen() {
  return <ClassTopicScreen title={"Health & Wellness"} classKey="HealthAndWellness" fallbackTopics={topics} />;
}
