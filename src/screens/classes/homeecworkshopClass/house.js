// src/screens/classes/homeecworkshopClass/house.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'homeOrganization',
      title: 'Home Organization & Time Management',
      grade: '3-5',
      color: '#FF5722', // Deep Orange
      description:
        'Techniques to keep home orderly and strategies to manage daily tasks efficiently.',
      help: {
        readings: [
          {
            title: '59 Home Organization Ideas for a Tidier Space',
            url: 'https://www.architecturaldigest.com/story/home-organization-ideas',
          },
          {
            title: 'Time Management: 10 Strategies for Better Time Management',
            url: 'https://extension.uga.edu/publications/detail.html?number=C1042&title=time-management-10-strategies-for-better-time-management',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'interiorDesign',
      title: 'Interior Design & Housing Choices',
      grade: '9-12',
      color: '#3F51B5', // Indigo
      description:
        'Basics of arranging living spaces, decorating principles, and evaluating housing options.',
      help: {
        readings: [
          {
            title: 'Beginners Guide To Interior Decorating',
            url: 'https://katrinaandco.com/blogs/katrina-co-blog/beginners-guide-to-interior-decorating?srsltid=AfmBOoqCBgacyeA7qb7XIKhyexWZ16UqkRlni0S4iVPe59JHxAVExWGe',
          },
          {
            title: 'Pros and Cons of Different Housing Options',
            url: 'https://www.marketprohomebuyers.com/pros-and-cons-of-different-housing-options/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'sustainability',
      title: 'Environmental Sustainability & Energy Conservation',
      grade: '9-12',
      color: '#4CAF50', // Green
      description:
        'Practices to reduce environmental impact, conserve resources, and save energy at home.',
      help: {
        readings: [
          {
            title: 'Defining Environmental Sustainability',
            url: 'https://sphera.com/resources/glossary/what-is-environmental-sustainability/',
          },
          {
            title: 'Sustainable Living Tips',
            url: 'https://www.conservation.org/act/sustainable-living-tips',
          },
          {
            title: 'What is Energy Conservation? Your Guide',
            url: 'https://www.digitalenergyby5.com/blog/what-is-energy-conservation/',
          },
        ],
        videos: [],
      },
    },
  ];

export default function HouseholdAndResourceManagementScreen() {
  return <ClassTopicScreen title={"Household & Resource Management"} classKey="HouseholdAndResourceManagement" fallbackTopics={topics} />;
}
