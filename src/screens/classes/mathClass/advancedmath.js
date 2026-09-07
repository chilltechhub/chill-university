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
      learn: [
        { heading: 'SOH-CAH-TOA', body: 'In a right triangle, sine is the opposite side divided by the hypotenuse, cosine is the adjacent side divided by the hypotenuse, and tangent is the opposite side divided by the adjacent side — remembered as SOH-CAH-TOA. These ratios let you find unknown sides or angles without measuring them directly.' },
        { heading: 'The Unit Circle', body: 'The unit circle is a circle with radius 1 centered at the origin. As an angle sweeps around the circle, the x-coordinate of the point equals cosine of that angle and the y-coordinate equals sine — this extends sine and cosine to any angle, not just those inside a right triangle, and reveals patterns like sine repeating every 360°.' },
      ],
      practice: [
        { question: 'In a right triangle, the side opposite a 30° angle is 5 and the hypotenuse is 10. What is sin(30°)?', options: ['0.5', '2', '5', '10'], answerIndex: 0, explanation: 'sin(30°) = opposite / hypotenuse = 5/10 = 0.5.' },
        { question: 'On the unit circle, what is the value of sin(90°)?', options: ['0', '0.5', '1', '-1'], answerIndex: 2, explanation: 'At 90° on the unit circle, the point is (0, 1), so sin(90°) = the y-coordinate = 1.' },
      ],
      apply: {
        prompt: 'On a sunny day, measure the length of the shadow cast by a fixed-height object (like a yardstick standing upright). Use the shadow length and the object\'s height to calculate the angle of elevation of the sun using tangent.',
        checklist: ['Measured the height of an upright object', 'Measured the length of its shadow', 'Set up tan(angle) = height / shadow length', 'Solved for the angle of elevation'],
      },
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
      learn: [
        { heading: 'Complex Numbers', body: 'A complex number has the form a + bi, where a is the real part and bi is the imaginary part, built from i = √-1. Complex numbers let us find solutions to equations like x² = -1, which have no answer among the real numbers alone.' },
        { heading: 'Arithmetic and Geometric Sequences', body: 'An arithmetic sequence changes by adding the same constant each step (like 3, 7, 11, 15...), while a geometric sequence changes by multiplying by the same constant ratio each step (like 3, 6, 12, 24...). Recognizing which type a sequence is tells you whether to use an addition rule or a multiplication rule to find future terms.' },
      ],
      practice: [
        { question: 'What is the value of i²?', options: ['1', '-1', 'i', '0'], answerIndex: 1, explanation: 'By definition, i = √-1, so i² = -1.' },
        { question: 'What is the next term in the geometric sequence 2, 6, 18, 54, ___?', options: ['58', '108', '162', '216'], answerIndex: 2, explanation: 'Each term is multiplied by 3, so 54 × 3 = 162.' },
      ],
      apply: {
        prompt: 'Take a sheet of paper and fold it in half repeatedly, recording the number of layers after each fold (1, 2, 4, 8...). Identify this as a geometric sequence, find its common ratio, and predict the number of layers after 10 folds using the formula.',
        checklist: ['Folded paper and recorded layers after at least 5 folds', 'Identified the sequence as geometric', 'Found the common ratio', 'Predicted the 10th term using the geometric formula'],
      },
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
      learn: [
        { heading: 'The Derivative as Rate of Change', body: 'A derivative measures how fast something is changing at a single instant — like the exact speed of a car at one moment, not just its average speed over a trip. Graphically, it\'s the slope of the line tangent to a curve at a specific point, found by taking the limit of the slope between two points as they get infinitely close together.' },
        { heading: 'The Integral as Accumulated Area', body: 'A definite integral finds the area between a curve and the x-axis over an interval — useful for adding up an infinite number of infinitely thin slices, like total distance traveled from a speed graph. Integration and differentiation are inverse operations of each other, which is the key idea behind the Fundamental Theorem of Calculus.' },
      ],
      practice: [
        { question: 'What does the derivative of a position function represent?', options: ['Total distance traveled', 'Velocity (rate of change of position)', 'Area under the curve', 'The starting position'], answerIndex: 1, explanation: 'The derivative of position with respect to time gives velocity, the instantaneous rate of change of position.' },
        { question: 'What does a definite integral of a velocity function over a time interval represent?', options: ['The velocity at one instant', 'The acceleration', 'The total displacement over that interval', 'The slope of the velocity graph'], answerIndex: 2, explanation: 'Integrating velocity over time accumulates the total displacement traveled during that interval.' },
      ],
      apply: {
        prompt: 'Roll a ball down a ramp (or ride in a car and note the speedometer) and record its position or speed at several evenly spaced time intervals. Estimate the speed between two nearby time points using the change in position divided by the change in time, mimicking a derivative.',
        checklist: ['Recorded position or speed at several time points', 'Chose two nearby time points to compare', 'Calculated change in position divided by change in time', 'Explained how this estimate approximates the instantaneous rate of change'],
      },
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
      learn: [
        { heading: 'Sets and Logic', body: 'A set is a collection of distinct objects. The union of two sets (A ∪ B) combines everything in either set, while the intersection (A ∩ B) keeps only what\'s in both. Logical statements can be combined with AND, OR, and NOT, and a truth table lists every possible true/false outcome of a statement.' },
        { heading: 'Graph Theory Basics', body: 'A graph is made of vertices (points, also called nodes) connected by edges (lines). Graphs can model real networks, like friendships, roads, or webpages — the number of edges touching a vertex is called its degree, and finding the shortest path between two vertices is a classic graph theory problem.' },
      ],
      practice: [
        { question: 'If A = {1, 2, 3} and B = {2, 3, 4}, what is A ∩ B (the intersection)?', options: ['{1, 2, 3, 4}', '{2, 3}', '{1, 4}', '{}'], answerIndex: 1, explanation: 'The intersection contains only elements in both sets: 2 and 3.' },
        { question: 'In graph theory, what do we call the points connected by edges in a graph?', options: ['Nodes or vertices', 'Roots', 'Branches', 'Coordinates'], answerIndex: 0, explanation: 'The points in a graph are called vertices (or nodes), and the connections between them are edges.' },
      ],
      apply: {
        prompt: 'Draw a graph representing a real network you know, such as which friends are connected to which other friends, or the subway/bus stops near you. Mark vertices and edges, then find the shortest path (fewest edges) between two chosen vertices.',
        checklist: ['Drew at least 6 vertices representing a real network', 'Connected them with edges based on real relationships', 'Labeled the degree of at least 2 vertices', 'Found the shortest path between two chosen vertices'],
      },
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
