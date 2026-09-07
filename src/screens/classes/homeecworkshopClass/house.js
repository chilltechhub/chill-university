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
      learn: [
        { heading: 'A Place for Everything', body: 'Home organization works best when every item has a specific "home" — a designated spot it always returns to — so things are easy to find and put away. Grouping similar items together (like all school supplies in one bin) makes cleanup faster and keeps clutter from spreading.' },
        { heading: 'Time Management Uses Simple Tools', body: 'A daily or weekly checklist helps break big chores into small, manageable steps, and doing a little bit each day (like making your bed or tidying one shelf) is easier than one huge cleaning session. Setting a timer for a task, like 10 minutes of tidying, can make chores feel less overwhelming.' },
      ],
      practice: [
        { question: 'What does it mean to give an item a "home" in an organized space?', options: ['Throwing it away', 'Giving it one designated spot it always returns to', 'Hiding it in a random drawer', 'Buying a new one each time'], answerIndex: 1, explanation: 'A designated spot for each item makes it quick to find and easy to put away, keeping spaces tidy.' },
        { question: 'What is one benefit of using a timer for a cleaning task?', options: ['It makes the task take longer', 'It can make the task feel more manageable and less overwhelming', 'It has no effect', 'It replaces the need to clean'], answerIndex: 1, explanation: 'Breaking a chore into a short, timed burst makes it feel achievable rather than overwhelming.' },
      ],
      apply: {
        prompt: 'Pick one messy area at home (a desk, drawer, or shelf) and organize it in 15 minutes, giving each item a designated spot.',
        checklist: ['Picked one messy area', 'Set a 15-minute timer', 'Grouped similar items together', 'Gave each item a specific spot'],
      },
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
      learn: [
        { heading: 'Function Before Décor', body: 'Good interior design starts with how a room will be used — furniture placement should support traffic flow and daily activities before adding decorative elements like color or artwork. A common rule is leaving at least 30 inches of walking space in main pathways.' },
        { heading: 'Housing Options Have Tradeoffs', body: 'Renting an apartment offers flexibility and fewer maintenance responsibilities, while owning a house builds equity but comes with property taxes, repairs, and a bigger upfront cost. Comparing housing options means weighing cost, location, space needs, and long-term goals.' },
      ],
      practice: [
        { question: 'What should be considered first when arranging furniture in a room?', options: ['Wall paint color', 'How the room will be used and traffic flow', 'The most expensive furniture piece', 'Matching curtains'], answerIndex: 1, explanation: 'Function and traffic flow should guide furniture placement before decorative choices are made.' },
        { question: 'What is one advantage of renting over owning a home?', options: ['Building equity', 'More flexibility and fewer maintenance responsibilities', 'Lower total lifetime cost', 'Unlimited customization'], answerIndex: 1, explanation: 'Renters typically are not responsible for major repairs and can move more easily than homeowners.' },
      ],
      apply: {
        prompt: 'Sketch a simple floor plan for your bedroom or living room, showing furniture placement that keeps at least 30 inches of walking space in the main path.',
        checklist: ['Sketched the room outline', 'Placed furniture on the sketch', 'Marked a clear walking path', 'Checked the path is wide enough'],
      },
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
      learn: [
        { heading: 'Small Habits, Big Impact', body: 'Environmental sustainability at home means using resources — water, energy, materials — in ways that don\'t deplete them for the future. Simple habits like turning off lights when leaving a room, taking shorter showers, and unplugging unused electronics reduce both waste and utility bills.' },
        { heading: 'Energy Conservation Targets the Biggest Users', body: 'Heating and cooling systems typically use the most energy in a home, so sealing drafts around windows and doors and adjusting the thermostat a few degrees can save significant energy. Switching to LED light bulbs uses up to 75% less energy than older incandescent bulbs.' },
      ],
      practice: [
        { question: 'Which home system typically uses the most energy overall?', options: ['Lighting', 'Heating and cooling', 'Phone chargers', 'Doorbells'], answerIndex: 1, explanation: 'Heating and cooling systems are usually the largest energy consumers in a home.' },
        { question: 'About how much less energy do LED bulbs use compared to older incandescent bulbs?', options: ['About 5%', 'About 25%', 'Up to 75%', 'They use the same amount'], answerIndex: 2, explanation: 'LED bulbs are far more efficient, using up to about 75% less energy than incandescent bulbs.' },
      ],
      apply: {
        prompt: 'Do a simple energy audit of one room in your home: count the light bulbs, note if any are LED, and check for drafts around one window or door.',
        checklist: ['Counted light bulbs in the room', 'Noted bulb type (LED or not)', 'Checked for drafts', 'Suggested one improvement'],
      },
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
