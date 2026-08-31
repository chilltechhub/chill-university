// src/screens/classes/mathClass/measurement.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'units',
      title: 'Units & Conversions',
      grade: 'K-2',
      color: '#2196F3', // Bright blue
      description:
        'Selecting and converting among metric and customary units for length, weight/mass, volume/capacity, time, and temperature.',
      help: {
        readings: [
          {
            title:
              'Conversion Between the Metric and US Customary Systems of Measurement',
            url: 'https://math.libretexts.org/Courses/Rio_Hondo/Math_150%3A_Survey_of_Mathematics/06%3A_Measurement_and_Geometry/6.01%3A_Measurement/6.1.03%3A_Conversion_Between_the_Metric_and_US_Customary_Systems_of_Measurement',
          },
          {
            title: 'Converting Temperatures (CK-12)',
            url: 'https://flexbooks.ck12.org/cbook/ck-12-cbse-maths-class-6/section/6.10/primary/lesson/temperature-conversion/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'perimeter',
      title: 'Perimeter, Area & Volume',
      grade: '3-5',
      color: '#8BC34A', // Bright green
      description:
        'Calculating lengths around shapes, sizes of surfaces, and capacities of solids using standard formulas.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Perimeter, Area, and Volume Explained',
            url: 'https://youtu.be/2UEUWC313QY?feature=shared',
          },
        ],
      },
    },
    {
      key: 'angles',
      title: 'Angle Measurement',
      grade: '6-8',
      color: '#FF5722', // Deep orange
      description:
        'Measuring and classifying angles (acute, right, obtuse), and applying protractors and angle-sum properties in polygons.',
      help: {
        readings: [
          {
            title: 'How to determine acute; right; obtuse (Math is Fun)',
            url: 'https://www.mathsisfun.com/angles.html',
          },
          {
            title:
              'Sum of Angles in a Polygon (Cuemath)',
            url: 'https://www.cuemath.com/geometry/sum-of-angles-in-a-polygon/',
          },
        ],
        videos: [
          {
            title:
              'How To Use A Protractor To Measure And Draw Angles Explained From The Right And Left Side',
            url: 'https://youtu.be/CHJ7_q4cCuE?feature=shared',
          },
          {
            title: 'ANGLE THEOREMS',
            url: 'https://youtu.be/Bq1QyT-HZrU?feature=shared',
          },
          {
            title:
              'How To Calculate The Interior Angles and Exterior Angles of a Regular Polygon',
            url: 'https://youtu.be/OEzEo4XqzJQ?feature=shared',
          },
        ],
      },
    },
    {
      key: 'applications',
      title: 'Applications',
      grade: '9-12',
      color: '#FFEB3B', // Bright yellow
      description:
        'Applying measurement skills to real-life contexts such as reading maps (scale), cooking (units), and scheduling (time).',
      help: {
        readings: [],
        videos: [],
      },
    },
  ];

export default function MeasurementScreen() {
  return <ClassTopicScreen title={"Measurement"} classKey="Measurement" fallbackTopics={topics} />;
}
