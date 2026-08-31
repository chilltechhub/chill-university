// src/screens/classes/homeecworkshopClass/construction.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'blueprintReading',
      title: 'Blueprint Reading & Sketching',
      grade: '9-12',
      color: '#FF5722', // Deep Orange
      description:
        'Interpreting construction blueprints and creating hand sketches to accurately plan structures.',
      help: {
        readings: [
          {
            title: 'Basic Blueprint Reading Principles',
            url: 'https://nabtu.personalearning.com/warehouse/nabtu/documents/course/387/8HR%20Blueprint%20Reading%20Principles%20-%20INST%20PPT.pdf',
          },
          {
            title: '5 Tips on How to Draw a Blueprint by Hand',
            url: 'https://www.roomsketcher.com/blog/how-to-draw-a-blueprint/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'framingStructural',
      title: 'Framing & Structural Concepts',
      grade: '9-12',
      color: '#4CAF50', // Green
      description:
        'Building structural frameworks including walls, floors, and roofs by applying carpentry principles.',
      help: {
        readings: [
          {
            title: 'Framing Carpentry',
            url: 'https://www.mycarpentry.com/framing-carpentry.html',
          },
        ],
        videos: [
          {
            title: 'Basic Structural Principles and Elements',
            url: 'https://youtu.be/u73gMakQuw0?si=iYF3S8o_7vX3vMqk',
          },
        ],
      },
    },
    {
      key: 'finishingWork',
      title: 'Drywall, Flooring & Finishing Work',
      grade: '9-12',
      color: '#3F51B5', // Indigo
      description:
        'Installing and finishing drywall, flooring materials, and carpentry trim for final project completion.',
      help: {
        readings: [
          {
            title: 'Drywall Tips and Tricks',
            url: 'https://www.finehomebuilding.com/list/drywall-tips-and-tricks',
          },
          {
            title: 'Flooring Project Tips: A Guide for DIYers and Contractors',
            url: 'https://www.41lumber.com/blogs/news/flooring-project-tips-a-guide-for-diyers-and-contractors',
          },
          {
            title: '10 Rules for Finish Carpentry',
            url: 'https://www.finehomebuilding.com/project-guides/finish-trim-carpentry/ten-rules-for-finish-carpentry',
          },
        ],
        videos: [],
      },
    },
  ];

export default function ConstructionAndCarpentryScreen() {
  return <ClassTopicScreen title={"Construction & Carpentry"} classKey="Construction" fallbackTopics={topics} />;
}
