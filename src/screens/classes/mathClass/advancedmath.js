// src/screens/classes/mathClass/advancedmath.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'trigonometry',
      title: 'Trigonometry',
      grade: '9-12',
      color: '#673AB7', // Deep purple
      description:
        'Defining sine, cosine, and tangent ratios in right and non-right triangles; exploring unit-circle definitions, graph behavior, and identities.',
      help: {
        readings: [
          {
            title: 'Sine; Cosine; Tangent (Math is Fun)',
            url: 'https://www.mathsisfun.com/sine-cosine-tangent.html',
          },
        ],
        videos: [
          {
            title: 'Intro to Trigonometry - sine, cosine, and tangent ratios',
            url: 'https://youtu.be/Q9mjsjOenQQ?si=koZN_KFMj-8p77ck',
          },
          {
            title: 'Non Right angled Trigonometry, the Sine and Cosine rules',
            url: 'https://youtu.be/5iYQCdL-bz4?si=_DrZADRqE-YeZgLa',
          },
          {
            title: 'The Unit Circle, Basic Introduction, Trigonometry',
            url: 'https://youtu.be/57VrEiEPD1I?si=8M13tnSCCSfQ9Nhnaa',
          },
        ],
      },
    },
    {
      key: 'precalculus',
      title: 'Precalculus',
      grade: '9-12',
      color: '#00BCD4', // Bright cyan
      description:
        'Delving into complex numbers, vectors, parametric and polar equations, advanced function families, and sequence/series fundamentals.',
      help: {
        readings: [
          {
            title: 'Intro to complex numbers (Khan Academy)',
            url: 'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:complex/x2ec2f6f830c9fb89:complex-num/a/intro-to-complex-numbers',
          },
          {
            title: 'Vectors (BYJU\'s)',
            url: 'https://byjus.com/maths/vectors/',
          },
          {
            title: 'Sequence and Series (BYJU\'s)',
            url: 'https://byjus.com/maths/sequence-and-series/',
          },
        ],
        videos: [
          {
            title:
              'Parametric Equations Introduction, Eliminating The Parameter t, Graphing Plane Curves, Precalculus',
            url: 'https://youtu.be/97pe-QlSGqA?si=JIYJlufBcOZbLSqf',
          },
          {
            title: 'Function Families',
            url: 'https://youtu.be/JzaeBxmvHl8?si=hiH5OcZFKKEGWqZB',
          },
        ],
      },
    },
    {
      key: 'calculus',
      title: 'Calculus',
      grade: '9-12',
      color: '#FF9800', // Bright orange
      description:
        'Introducing limits and continuity, computing derivatives and integrals, and applying them to rate-of-change and area-under-curve problems.',
      help: {
        readings: [
          {
            title: 'Derivatives and Integrals (BYJU\'s)',
            url: 'https://byjus.com/maths/calculus/',
          },
        ],
        videos: [
          {
            title: 'Limits and Continuity',
            url: 'https://youtu.be/9brk313DjV8?si=AhPWiFxsra9naUJ-',
          },
          {
            title: 'Derivatives and Rate of Change',
            url: 'https://youtu.be/xLE4C7y5Pn4?si=Q13q7N70Bl__c3p5',
          },
          {
            title:
              'Finding The Area Under The Curve Using Definite Integrals',
            url: 'https://youtu.be/UjTTx2eYrx8?si=Y8zqAQAH5E3dBf8s',
          },
        ],
      },
    },
    {
      key: 'discrete',
      title: 'Discrete Mathematics',
      grade: '9-12',
      color: '#8BC34A', // Light green
      description:
        '(Elective) Investigating logic and set theory, graph theory basics, recursion, and combinatorial reasoning for algorithmic thinking.',
      help: {
        readings: [
          {
            title: 'Graph Theory (DataCamp)',
            url:
              'https://www.datacamp.com/tutorial/introduction-to-graph-theory',
          },
        ],
        videos: [
          {
            title: 'Logic and Set Theory',
            url: 'https://youtu.be/dH4RHHsTf6Q?si=YBf1_L4W-s3Ul7l6',
          },
          {
            title: 'Recursive Formulas For Sequences',
            url: 'https://youtu.be/IFHZQ6MaG6w?si=SoCKhh_iesFq6uBW',
          },
        ],
      },
    },
  ];

export default function AdvancedElectiveTopicsScreen() {
  return <ClassTopicScreen title={"Advanced & Elective Topics"} classKey="AdvancedMath" fallbackTopics={topics} />;
}
