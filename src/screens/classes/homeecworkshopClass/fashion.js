// src/screens/classes/homeecworkshopClass/fashion.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'fabricProperties',
      title: 'Fabric Properties & Selection',
      grade: '6-8',
      color: '#3F51B5', // Indigo
      description:
        'Understanding characteristics like strength, stretch, drape, and texture to choose appropriate materials.',
      help: {
        readings: [
          {
            title:
              'What Are The Properties Of FABRIC ~ Important Characteristics Of Fabrics',
            url: 'https://youtu.be/ga_Q1jNqy5w?si=OI1QSYVE8bBkDfk1',
          },
          {
            title:
              'Fabric Selection and Textiles in Fashion Design: Understanding Materials',
            url: 'https://theartcareerproject.com/fabric-selection-fashion-design-materials/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'sewingTechniques',
      title: 'Sewing Techniques & Garment Construction',
      grade: '6-8',
      color: '#009688', // Teal
      description:
        'Mastering various stitches, seams, and methods to assemble and finish clothing.',
      help: {
        readings: [
          {
            title:
              '29 Basic And Complex Sewing Techniques Sewers Should Master',
            url: 'https://sewing.com/sewing-techniques-sewers-should-master/',
          },
          {
            title: 'What is Garment Construction?',
            url: 'https://www.uphance.com/blog/what-is-garment-construction/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'fashionDesign',
      title: 'Fashion Design & Trends',
      grade: '9-12',
      color: '#E91E63', // Pink
      description:
        'Exploring how styles evolve, trend forecasting, and applying design principles to apparel.',
      help: {
        readings: [
          {
            title: 'How Do Fashion Trends Start',
            url: 'https://glamobserver.com/how-do-fashion-trends-start/',
          },
          {
            title: 'Elements and Principles of Fashion Design',
            url: 'https://www.fitnyc.edu/museum/documents/elements-and-principles-of-fashion-design.pdf',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'textileCare',
      title: 'Textile Care & Maintenance',
      grade: '3-5',
      color: '#FFC107', // Amber
      description:
        'Best practices for cleaning, storing, and preserving fabrics and garments.',
      help: {
        readings: [
          {
            title: 'Caring for Textiles',
            url: 'https://museum.gwu.edu/caring-textiles',
          },
          {
            title: 'How to Care for Your Textiles',
            url: 'https://www.ncmuseumofhistory.org/collections/how-care-your-artifacts/how-care-your-textiles',
          },
        ],
        videos: [],
      },
    },
  ];

export default function TextilesAndApparelScreen() {
  return <ClassTopicScreen title={"Textiles & Apparel"} classKey="TextilesAndApparel" fallbackTopics={topics} />;
}
