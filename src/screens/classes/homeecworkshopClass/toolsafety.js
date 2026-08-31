// src/screens/classes/homeecworkshopClass/toolsafety.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'ppe',
      title: 'Personal Protective Equipment (PPE)',
      grade: '3-5',
      color: '#607D8B', // Blue Grey
      description:
        'Using gloves, goggles, ear protection, and appropriate clothing to stay safe while working with tools.',
      help: {
        readings: [
          {
            title: 'Personal Protective Equipment',
            url: 'https://www.osha.gov/personal-protective-equipment',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'maintenanceOrganization',
      title: 'Tool Maintenance & Organization',
      grade: '6-8',
      color: '#FF9800', // Orange
      description:
        'Regular cleaning, sharpening, and proper storage of tools, plus techniques for organizing your workspace.',
      help: {
        readings: [],
        videos: [
          {
            title:
              'Workshop Maintenance: Hand Tools and Machine Care',
            url: 'https://youtu.be/kSmkQfw19CQ?si=aj60e19KrdVf9yjK',
          },
          {
            title: '11 Simple Ways to Organize Any Workshop',
            url: 'https://youtu.be/sSaKwxtrNmk?si=Z9h5X56eL6ktscgW',
          },
        ],
      },
    },
    {
      key: 'ergonomicsCleanup',
      title: 'Workshop Ergonomics & Clean‑up',
      grade: '9-12',
      color: '#8E24AA', // Purple
      description:
        'Setting up tools and workstations for proper posture, efficient workflow, and routine cleaning for safety and productivity.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Shop Ergonomics',
            url: 'https://youtu.be/8a6515TaZ3s?si=YjtKYSNDfuBtv5pp',
          },
          {
            title:
              '11 Ways to Keep Your Workshop Neat and Tidy',
            url: 'https://www.familyhandyman.com/list/tips-for-a-tidy-workshop/?srsltid=AfmBOorVUDyzl8JWBGe3kFjD2oTj-MWxjk8ZKuVFdsr-kbHBJT1t_yC6',
          },
        ],
      },
    },
  ];

export default function ToolSafetyAndShopPracticesScreen() {
  return <ClassTopicScreen title={"Tool Safety & Shop Practices"} classKey="ToolSafetyAndShopPractices" fallbackTopics={topics} />;
}
