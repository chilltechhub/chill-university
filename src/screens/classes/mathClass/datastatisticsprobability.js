// src/screens/classes/mathClass/datastatisticsprobability.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'collection',
      title: 'Data Collection & Representation',
      grade: '3-5',
      color: '#9C27B0', // Bright purple
      description:
        'Gathering data through surveys or experiments and displaying it in tables, bar graphs, line plots, histograms, or box plots.',
      help: {
        readings: [],
        videos: [
          {
            title:
              'Science of Data Visualization | Bar, scatter plot, line, histograms, pie, box plots, bubble chart',
            url: 'https://youtu.be/csXmVBw8cdo?feature=shared',
          },
        ],
      },
    },
    {
      key: 'descriptive',
      title: 'Descriptive Statistics',
      grade: '6-8',
      color: '#E91E63', // Bright pink
      description:
        'Summarizing data sets using measures of central tendency (mean, median, mode) and spread (range, interquartile range, standard deviation).',
      help: {
        readings: [
          {
            title:
              'Interquartile Range vs. Standard Deviation: What’s the Difference?',
            url:
              'https://www.statology.org/interquartile-range-vs-standard-deviation/',
          },
        ],
        videos: [
          {
            title: 'Mean, Median, Mode, and Range - How To Find It!',
            url: 'https://youtu.be/A1mQ9kD-i9I?feature=shared',
          },
          {
            title:
              'Standard Deviation, Variance, Range and Interquartile Range - Measures of dispersion',
            url: 'https://youtu.be/WnMXXWWlylo?feature=shared',
          },
        ],
      },
    },
    {
      key: 'probability',
      title: 'Probability',
      grade: '6-8',
      color: '#03A9F4', // Bright sky blue
      description:
        'Calculating the likelihood of simple and compound events, using basic counting methods (permutations, combinations), and understanding theoretical vs. experimental probability.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Basic Probability',
            url: 'https://youtu.be/KzfWUEJjG18?si=Q-XZEX9GvoLzpxJ6',
          },
        ],
      },
    },
    {
      key: 'inference',
      title: 'Statistical Inference',
      grade: '9-12',
      color: '#4CAF50', // Bright green
      description:
        '(High school) Designing samples, making estimates (confidence intervals), and testing hypotheses to draw conclusions about populations from data.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Understanding Statistical Inference',
            url: 'https://youtu.be/tFRXsngz4UQ?si=vQEOTf5SdXlM9jtS',
          },
        ],
      },
    },
  ];

export default function DataStatisticsScreen() {
  return <ClassTopicScreen title={"Data, Statistics & Probability"} classKey="DataStatisticsProbability" fallbackTopics={topics} />;
}
