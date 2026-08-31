// src/screens/classes/homeecworkshopClass/materialworking.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'woodworking',
      title: 'Woodworking',
      grade: '6-8',
      color: '#795548', // Brown
      description:
        'Working with wood using hand and power tools, precise measuring, joinery, and finishing techniques.',
      help: {
        readings: [
          {
            title: "A Beginner’s Guide to Hand Tools for Woodworking",
            url: 'https://www.wagnermeters.com/moisture-meters/wood-info/a-beginners-guide-to-hand-tools-for-woodworking/',
          },
          {
            title: 'Guide to Essential Woodworking Power Tools',
            url: 'https://www.tractorsupply.com/tsc/cms/life-out-here/tool-shop/tool-tips/essential-woodworking-power-tools',
          },
          {
            title: 'Layout, Measuring, and Marking',
            url: 'https://www.woodmagazine.com/woodworking-how-to/layout-measuring-marking',
          },
          {
            title: '13 Types of Wood Joinery',
            url: 'https://www.thesprucecrafts.com/wood-joinery-types-3536631',
          },
          {
            title: 'Woodworking Finishing Techniques',
            url: 'https://www.thecrucible.org/guides/woodworking/finishing-techniques/',
          },
          {
            title: 'A Complete Guide to All Types of Wood Finishes',
            url: 'https://octaneseating.com/blog/wood-finishes/',
          },
          {
            title: 'Ultimate Guide to Wood Treatment',
            url: 'https://abatec-pools.com/en/the-ultimate-guide-to-wood-treatment/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'metalworking',
      title: 'Metalworking',
      grade: '9-12',
      color: '#607D8B', // Blue Grey
      description:
        'Shaping, cutting, joining, and finishing metal using appropriate tools, safety practices, and machining techniques.',
      help: {
        readings: [
          {
            title: 'Safety Tips for Working With Metal',
            url: 'https://calderamfg.com/resources/blog/metal-working-safety-tips/',
          },
          {
            title: 'Properties of Metals: Choosing Metal for Fabrication',
            url: 'https://metaltech.us/blog/properties-of-metal-choosing-a-type-of-metal/',
          },
          {
            title: 'What is Metalworking: Forming, Cutting and Joining',
            url: 'https://www.treatstock.com/guide/article/130-what-is-metalworking-forming-cutting-and-joining',
          },
          {
            title: 'Overview of Metal Forming',
            url: 'https://www.tfgusa.com/the-ultimate-overview-of-metal-forming/',
          },
          {
            title: 'Types of Welding in Metal Fabrication',
            url: 'https://kneesengineering.co.uk/news/what-are-the-different-types-of-welding-used-in-metal-fabrication/',
          },
          {
            title: '4 Common Welding Techniques',
            url: 'https://msistructuralsteel.com/4-common-welding-techniques-metal-fabrication/',
          },
          {
            title: 'Comprehensive Guide to Soldering',
            url: 'https://www.instructables.com/A-Comprehensive-Guide-to-Soldering-Techniques-Tool/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'basicMachining',
      title: 'Basic Machining',
      grade: '9-12',
      color: '#FFEB3B', // Yellow
      description:
        'Using machine tools like lathes and mills to cut, shape, and finish metal components accurately.',
      help: {
        readings: [],
        videos: [],
      },
    },
  ];

export default function MaterialWorkingScreen() {
  return <ClassTopicScreen title={"Material Working"} classKey="MaterialWorking" fallbackTopics={topics} />;
}
