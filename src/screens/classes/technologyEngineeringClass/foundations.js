// src/screens/classes/technologyEngineeringClass/foundations.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'algorithmsSequencing',
    title: 'Algorithms & Sequencing',
    grade: 'K-2',
    color: '#FF6B6B',
    description:
      'An algorithm is a step-by-step set of instructions to finish a task. Computers need instructions in the exact right order — this is an introduction to sequencing through everyday, unplugged examples.',
    learn: [
      { heading: 'What Is an Algorithm?', body: 'An algorithm is just a set of steps, done in order, to get something done — like a recipe for a cake, or the steps to brush your teeth. If you skip a step or do them in the wrong order, it doesn\'t work right.' },
      { heading: 'Order Matters', body: 'Putting on socks before shoes works — putting on shoes before socks doesn\'t! Sequencing means thinking carefully about which step has to happen first, second, and last.' },
    ],
    practice: [
      { question: 'Put these steps in order to put on shoes: 1) Tie laces, 2) Put on socks, 3) Slip feet into shoes.', options: ['1, 2, 3', '2, 3, 1', '3, 2, 1', '2, 1, 3'], answerIndex: 1, explanation: 'Socks go on first, then shoes, then you tie the laces.' },
      { question: 'What do we call a list of steps done in the right order to finish a task?', options: ['A guess', 'An algorithm', 'A question', 'A color'], answerIndex: 1, explanation: 'An algorithm is a step-by-step set of instructions.' },
    ],
    apply: {
      prompt: 'Write or draw a 4-step algorithm telling a friend how to make a paper airplane or draw a smiley face.',
      checklist: ['Listed exactly 4 steps', 'Put the steps in the correct order', 'Tested it by having someone follow the steps'],
    },
    help: {
      videos: [
        { title: 'What are Algorithms? | Computer Science for Kids Part 5 | Grades K-2', url: 'https://www.youtube.com/watch?v=578hB0E6y4o' },
        { title: 'Sequencing - Coding Concepts Explained for Kids', url: 'https://www.youtube.com/watch?v=QbhQ6G61SMs' },
      ],
    },
  },
  {
    key: 'blockCodingLoops',
    title: 'Block-Based Coding & Loops',
    grade: '3-5',
    color: '#4D96FF',
    description:
      'An introduction to visual, block-based programming (like Scratch), focused on using loops to repeat instructions instead of writing the same block over and over.',
    learn: [
      { heading: 'What a Loop Does', body: 'A loop repeats a set of instructions a certain number of times (or forever) so you don\'t have to write the same block again and again. Instead of stacking 10 "move forward" blocks, you put 1 "move forward" block inside a "repeat 10" loop.' },
      { heading: 'Loops Save Work — and Catch Bugs', body: 'Loops make programs shorter and easier to fix — change the number in the loop once, and every repetition updates. But a loop that repeats a mistake also repeats it 10 times, so testing what\'s inside the loop first is important.' },
    ],
    practice: [
      { question: 'If a block inside a "Repeat 4 Times" loop says "Turn Right 90 Degrees," what shape path will your character trace?', options: ['A straight line', 'A full turn back to where it started (like a square)', 'It won\'t move', 'A zigzag'], answerIndex: 1, explanation: 'Four 90-degree turns add up to 360 degrees — a full turn, like tracing a square.' },
      { question: 'Why use a loop instead of copying a block 10 times?', options: ['Loops run slower', 'Loops make it easy to change how many times something repeats', 'Loops use more blocks', 'There is no difference'], answerIndex: 1, explanation: 'A loop lets you change one number instead of editing 10 separate blocks.' },
    ],
    apply: {
      prompt: 'Write a short block-style pseudo-code routine (on paper or in Scratch) that makes a character walk forward 3 steps, jump, and repeat that whole sequence 3 times using a loop.',
      checklist: ['Wrote the walk + jump sequence', 'Wrapped it in a "repeat 3" loop instead of copying it 3 times', 'Checked the total number of walk steps matches (3 steps × 3 repeats = 9)'],
    },
    help: {
      videos: [
        { title: 'Scratch Coding Tutorial - Basic Loops', url: 'https://www.youtube.com/watch?v=m57Gmc7wFIM' },
        { title: 'Coding with Loops and If Statements in Scratch', url: 'https://www.youtube.com/watch?v=OWwGMYj5Efg' },
      ],
    },
  },
  {
    key: 'cadModeling',
    title: '3D Modeling & CAD Fundamentals',
    grade: '6-8',
    color: '#3AC860',
    description:
      'Computer-Aided Design (CAD) builds 3D digital objects using primitive shapes. Introduces additive (joining parts) and subtractive (cutting holes) modeling using free tools like Tinkercad.',
    learn: [
      { heading: 'Building With Primitive Shapes', body: 'CAD programs build objects out of "primitive" shapes — cubes, cylinders, spheres, cones — the same way a sculpture can be built from simple blocks of clay. You move, resize, and combine these shapes to build more complex objects.' },
      { heading: 'Additive vs. Subtractive Modeling', body: 'Additive modeling joins solid shapes together, like stacking blocks. Subtractive modeling uses a shape as a "hole" to cut material away from another shape — grouping a solid cylinder with a hole-shaped cylinder turns a solid rod into a hollow pipe.' },
    ],
    practice: [
      { question: 'What modeling technique removes volume from an object to create a window or socket?', options: ['Additive modeling', 'Subtractive modeling (hole grouping)', 'Coloring', 'Rotating'], answerIndex: 1, explanation: 'Subtractive modeling uses a "hole" shape to cut material away, like drilling a hole through a block.' },
      { question: 'To turn a solid cylinder into a pipe in a CAD program, what would you do?', options: ['Change its color', 'Group it with a smaller hole-cylinder set to "hole"', 'Make it bigger', 'Delete it'], answerIndex: 1, explanation: 'Grouping a solid shape with a same-shaped "hole" cuts out the inside, leaving a hollow pipe.' },
    ],
    apply: {
      prompt: 'Sketch a 3D object (like a mug or a pencil holder) on paper and break down which primitive shapes — and which additive/subtractive steps — you would combine to build it in a CAD program.',
      checklist: ['Sketched the object', 'Listed at least 2 primitive shapes used', 'Identified at least 1 subtractive (hole) step'],
    },
    help: {
      videos: [
        { title: 'Introduction to TinkerCAD', url: 'https://www.youtube.com/watch?v=uCqxyweqQ1Q' },
        { title: 'Getting Started in Tinkercad: A Tutorial for Complete Beginners', url: 'https://www.youtube.com/watch?v=60xfIu-lqAs' },
      ],
    },
  },
  {
    key: 'restfulApis',
    title: 'RESTful APIs & Web Communication',
    grade: '9-12',
    color: '#8B4FC4',
    description:
      'How software applications talk to each other over the web. Covers REST architecture and the standard HTTP verbs — GET, POST, PUT/PATCH, and DELETE.',
    learn: [
      { heading: 'What an API Does', body: 'An API (Application Programming Interface) lets one piece of software ask another for data or actions, without needing to know how it works internally. A RESTful API does this over standard web requests, usually exchanging data as JSON.' },
      { heading: 'The Four Core HTTP Verbs', body: 'GET fetches data without changing anything. POST creates something new (like submitting a form). PUT or PATCH updates something that already exists. DELETE removes it. A status code like 200 OK tells you whether the request succeeded.' },
    ],
    practice: [
      { question: 'Which HTTP method should a client send when submitting a new user registration form?', options: ['GET', 'POST', 'DELETE', 'PATCH'], answerIndex: 1, explanation: 'POST is used to create a new resource, like a new user account.' },
      { question: 'A GET request to an API returns status code 200. What does that mean?', options: ['The request failed', 'The server is down', 'The request succeeded and returned data', 'The data was deleted'], answerIndex: 2, explanation: '200 OK means the request was successful.' },
    ],
    apply: {
      prompt: 'Use a browser developer console or a free tool like Postman to send a GET request to a public API (e.g. api.github.com/users/octocat) and find the JSON field containing the account name.',
      checklist: ['Sent a GET request to a real public API', 'Read the JSON response', 'Found and wrote down the specific field requested', 'Noted the response status code'],
    },
    help: {
      videos: [
        { title: 'HTTP Methods Explained: GET, POST, PUT, DELETE - REST API Basics with Express.js', url: 'https://www.youtube.com/watch?v=aHx9x-nmRio' },
        { title: 'REST API Fundamentals: Learn to Use GET, POST, PUT, & DELETE', url: 'https://www.youtube.com/watch?v=PfujVETI-i4' },
      ],
    },
  },
];

export default function TechnologyAndEngineeringScreen() {
  return <ClassTopicScreen title={'Technology & Engineering'} classKey="TechnologyAndEngineering" fallbackTopics={topics} />;
}
