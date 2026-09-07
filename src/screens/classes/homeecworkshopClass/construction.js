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
      learn: [
        { heading: 'Blueprints Speak a Visual Language', body: 'Blueprints use standardized symbols and lines — like solid lines for walls, dashed lines for hidden features, and specific symbols for doors, windows, and electrical outlets — so any builder can read the same plan the same way. A scale (like 1/4 inch = 1 foot) tells you how the drawing\'s measurements relate to the real, full-size structure.' },
        { heading: 'Sketching Plans Before Building', body: 'Hand sketches let builders and designers quickly explore layout ideas before committing to a formal, precise blueprint, using simple tools like graph paper, a ruler, and a pencil. Getting comfortable sketching to scale — even roughly — helps you catch spacing problems early, before construction begins.' },
      ],
      practice: [
        { question: 'On a blueprint, what does a dashed line typically represent?', options: ['A visible wall', 'A hidden feature, like something behind another structure', 'The scale of the drawing', 'A colored accent'], answerIndex: 1, explanation: 'Dashed lines are a standard blueprint convention showing features that are hidden from the current view.' },
        { question: 'What does a blueprint scale of 1/4 inch = 1 foot tell you?', options: ['The drawing is full size', 'Every 1/4 inch on paper represents 1 real foot', 'The building is 1/4 foot tall', 'It has no relationship to real measurements'], answerIndex: 1, explanation: 'A scale defines the ratio between the drawing\'s measurements and the actual size of the structure.' },
      ],
      apply: {
        prompt: 'Using graph paper, sketch a simple floor plan of one room in your home, choosing a scale (like 1 square = 1 foot) and labeling doors and windows.',
        checklist: ['Chose and noted a scale', 'Drew the room outline to scale', 'Labeled at least one door', 'Labeled at least one window'],
      },
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
      learn: [
        { heading: 'Framing Creates the Skeleton', body: 'Framing is the wood or metal skeleton of a building — studs form vertical wall supports spaced at regular intervals (commonly 16 inches apart), joists support floors, and rafters or trusses form the roof structure. This skeleton carries the building\'s loads down to the foundation.' },
        { heading: 'Loads Must Travel Down Safely', body: 'Structural framing has to transfer weight — from the roof, through walls, down to the foundation — without any weak points, which is why headers (extra-strong beams) are placed above doors and windows to redirect the load around the opening. Understanding load paths is what separates a load-bearing wall (structural) from a non-load-bearing wall (just a divider).' },
      ],
      practice: [
        { question: 'What is the typical spacing for wall studs in standard framing?', options: ['16 inches apart', '10 feet apart', '1 inch apart', 'There is no standard spacing'], answerIndex: 0, explanation: '16 inches on center is a very common standard spacing for wall studs in residential framing.' },
        { question: 'What is the purpose of a header above a door or window opening?', options: ['Decoration only', 'To redirect structural load around the opening', 'To block sound', 'To hold up the roof shingles'], answerIndex: 1, explanation: 'A header is a strong beam that carries the load from above and transfers it around the opening to the studs on either side.' },
      ],
      apply: {
        prompt: 'Look at a wall in your home (or photos of a house under construction) and try to identify where studs likely are, using the standard 16-inch spacing as a guide (you can look for outlet or switch locations as clues).',
        checklist: ['Chose a wall to examine', 'Estimated stud spacing', 'Noted any clues used (outlets, trim, etc.)', 'Sketched your findings'],
      },
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
      learn: [
        { heading: 'Drywall Needs Multiple Steps', body: 'Installing drywall involves hanging panels on the wall framing, then taping the seams and applying joint compound in several thin coats, sanding smooth between coats, before it\'s ready to paint. Rushing the drying and sanding steps is the most common reason drywall seams show through paint later.' },
        { heading: 'Finishing Work Is the Final Layer', body: 'Flooring and trim carpentry (like baseboards and door casings) are usually the last steps in a project because they finish and protect the edges where other materials meet. Choosing flooring means balancing durability, water resistance, and cost — vinyl and tile handle moisture well, while hardwood offers a classic look but needs more care.' },
      ],
      practice: [
        { question: 'Why do drywall installers apply joint compound in several thin coats instead of one thick coat?', options: ['To waste material', 'Thin coats dry and sand more evenly, preventing seams from showing later', 'It is required by law', 'Thick coats are illegal'], answerIndex: 1, explanation: 'Multiple thin coats dry more evenly and sand smoother, which prevents visible seams once painted.' },
        { question: 'Why is trim carpentry like baseboards usually installed near the end of a project?', options: ['It has to go first', 'It finishes and covers the edges where other materials meet', 'Trim is never actually needed', 'It has nothing to do with other materials'], answerIndex: 1, explanation: 'Trim covers transitions and gaps between materials like flooring and walls, so it goes on after those are in place.' },
      ],
      apply: {
        prompt: 'Compare two flooring materials (like vinyl and hardwood) for a room in your home, noting which handles moisture better and which costs more.',
        checklist: ['Chose two flooring materials', 'Compared moisture resistance', 'Compared approximate cost', 'Picked which would suit a specific room and why'],
      },
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
