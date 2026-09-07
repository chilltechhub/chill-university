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
      learn: [
        { heading: 'The Right Tool for the Job', body: 'We use a ruler to measure how long something is, a scale to measure how heavy it is, a measuring cup to measure how much liquid it holds, and a clock to measure time. Picking the right tool and the right unit (like inches for a pencil, not miles!) helps your measurement make sense.' },
        { heading: 'Big Units and Small Units', body: 'Some units are bigger than others for measuring the same kind of thing — a foot is longer than an inch, and a gallon holds more than a cup. When you measure with a smaller unit, you need a bigger number to describe the same amount.' },
      ],
      practice: [
        { question: 'Which is longer: an inch or a foot?', options: ['An inch', 'A foot', 'They are the same', 'Neither measures length'], answerIndex: 1, explanation: 'A foot equals 12 inches, so a foot is longer.' },
        { question: 'Which tool would you use to find out how much a puppy weighs?', options: ['A ruler', 'A clock', 'A scale', 'A measuring cup'], answerIndex: 2, explanation: 'A scale measures weight.' },
      ],
      apply: {
        prompt: 'Find 5 objects around your home. Use a ruler to measure the length of each one in inches, and write down which object was the longest and which was the shortest.',
        checklist: ['Measured 5 different objects with a ruler', 'Wrote down each length', 'Identified the longest object', 'Identified the shortest object'],
      },
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
      learn: [
        { heading: 'Perimeter and Area', body: 'Perimeter is the distance around the outside of a shape — add up the length of every side. Area is the amount of flat space inside a shape — for a rectangle, multiply length by width, since you\'re counting how many unit squares fit inside.' },
        { heading: 'Volume Adds a Third Dimension', body: 'Volume measures how much space is inside a 3D solid, like a box. For a rectangular box, multiply length × width × height — you\'re stacking layers of area on top of each other, one layer for each unit of height.' },
      ],
      practice: [
        { question: 'What is the perimeter of a rectangle with length 8 cm and width 5 cm?', options: ['13 cm', '26 cm', '40 cm', '20 cm'], answerIndex: 1, explanation: 'Perimeter = 2(length + width) = 2(8 + 5) = 26 cm.' },
        { question: 'What is the area of a rectangle with length 6 in and width 4 in?', options: ['10 in²', '20 in²', '24 in²', '48 in²'], answerIndex: 2, explanation: 'Area = length × width = 6 × 4 = 24 square inches.' },
      ],
      apply: {
        prompt: 'Measure the length and width of a room, a table, or a book at home. Calculate its perimeter and area, then find or estimate a third dimension (like height) to calculate volume for a box-shaped object.',
        checklist: ['Measured length and width of a chosen object', 'Calculated the perimeter', 'Calculated the area', 'Measured a box-shaped object and calculated its volume'],
      },
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
      learn: [
        { heading: 'Classifying Angles', body: 'An acute angle measures less than 90 degrees (a narrow opening), a right angle measures exactly 90 degrees (like a square corner), and an obtuse angle measures more than 90 but less than 180 degrees (a wide opening). A protractor lets you measure the exact degree of any angle.' },
        { heading: 'Angle Sums in Polygons', body: 'The three angles inside any triangle always add up to 180 degrees, no matter the triangle\'s shape. For any polygon, you can find the sum of interior angles with the formula (n − 2) × 180°, where n is the number of sides.' },
      ],
      practice: [
        { question: 'An angle measures 120°. What type of angle is it?', options: ['Acute', 'Right', 'Obtuse', 'Straight'], answerIndex: 2, explanation: 'An angle between 90° and 180° is obtuse.' },
        { question: 'A triangle has angles of 50° and 60°. What is the third angle?', options: ['60°', '70°', '80°', '90°'], answerIndex: 1, explanation: 'The three angles must sum to 180°: 180 − 50 − 60 = 70°.' },
      ],
      apply: {
        prompt: 'Find or print a protractor. Measure at least 5 angles around your home (corners of books, picture frames, door openings) and classify each one as acute, right, or obtuse.',
        checklist: ['Measured at least 5 real angles with a protractor', 'Recorded each angle\'s degree measure', 'Classified each as acute, right, or obtuse', 'Found at least one example of each type'],
      },
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
      learn: [
        { heading: 'Map Scale', body: 'A map scale, like "1 inch = 10 miles," is a ratio that lets you convert a measured distance on the map into a real-world distance. Measure the distance between two points on the map with a ruler, then multiply by the scale to find the actual distance.' },
        { heading: 'Elapsed Time and Scheduling', body: 'Elapsed time is how much time passes between a start and an end point — useful for reading bus schedules, cooking, or planning a trip. Break the calculation into chunks (minutes to the next hour, then whole hours, then remaining minutes) to avoid mixing up base-60 minutes with base-10 numbers.' },
      ],
      practice: [
        { question: 'On a map with a scale of 1 inch = 20 miles, two cities are 3.5 inches apart. How far apart are they in real life?', options: ['23.5 miles', '60 miles', '70 miles', '80 miles'], answerIndex: 2, explanation: '3.5 × 20 = 70 miles.' },
        { question: 'A movie starts at 6:45 PM and ends at 9:10 PM. How long is the movie?', options: ['2 hours 5 minutes', '2 hours 25 minutes', '2 hours 15 minutes', '3 hours 5 minutes'], answerIndex: 1, explanation: 'From 6:45 to 9:00 is 2 hours 15 minutes; from 9:00 to 9:10 is 10 more minutes, totaling 2 hours 25 minutes.' },
      ],
      apply: {
        prompt: 'Find a real map (or print one) with a scale shown. Measure the distance between two real places you know using a ruler, then use the scale to calculate the actual distance and estimate how long a trip would take driving at 60 mph.',
        checklist: ['Found a map with a stated scale', 'Measured map distance between two points with a ruler', 'Converted to real-world distance using the scale', 'Estimated travel time at a given speed'],
      },
      help: {
        readings: [],
        videos: [],
      },
    },
  ];

export default function MeasurementScreen() {
  return <ClassTopicScreen title={"Measurement"} classKey="Measurement" fallbackTopics={topics} />;
}
