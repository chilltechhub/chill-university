// src/screens/classes/mathClass/algebraandfunctions.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'patterns',
      title: 'Patterns & Relationships',
      grade: '3-5',
      color: '#9C27B0', // bright purple
      description:
        'Identifying and describing regularities in numbers or shapes, using tables, charts, or simple rules to predict what comes next.',
      help: {
        readings: [
          {
            title: 'Recognizing Patterns (LibreTexts)',
            url: 'https://math.libretexts.org/Courses/Coalinga_College/Math_for_Educators_(MATH_010A_and_010B_CID120)/05%3A_Problem_Solving/5.06%3A_Recognizing_Patterns',
          },
        ],
        videos: [
          {
            title: 'Finding the Rule for the Pattern (using a table)',
            url: 'https://youtu.be/OlUBFXfLE0c?feature=shared',
          },
        ],
      },
    },
    {
      key: 'expressions',
      title: 'Expressions & Equations',
      grade: '6-8',
      color: '#03A9F4', // bright sky blue
      description:
        'Writing and manipulating symbolic expressions (e.g., 3x + 5), solving equations and inequalities (linear, quadratic), and understanding equivalent forms.',
      help: {
        readings: [
          {
            title: 'Equivalent Expressions Guide',
            url: 'https://thirdspacelearning.com/us/math-resources/topic-guides/algebra/equivalent-expressions/',
          },
        ],
        videos: [
          {
            title: 'Writing Algebraic Expressions',
            url: 'https://youtu.be/o_Ubm7OI8t4?feature=shared',
          },
          {
            title: 'How To Solve Linear Inequalities (Basic Introduction)',
            url: 'https://youtu.be/DrZJKdXlZ3I?feature=shared',
          },
          {
            title: 'Quadratic Equation Explained Step-by-Step',
            url: 'https://youtu.be/gagj6GHZqnE?feature=shared',
          },
          {
            title: 'The Quadratic Formula Song',
            url: 'https://youtu.be/VOXYMRcWbF8?feature=shared',
          },
          {
            title: 'How To Solve Quadratic Equations Using The Quadratic Formula',
            url: 'https://youtu.be/IlNAJl36-10?feature=shared',
          },
        ],
      },
    },
    {
      key: 'functions',
      title: 'Functions & Modeling',
      grade: '9-12',
      color: '#FF9800', // bright orange
      description:
        'Interpreting and using the idea of a function—an input–output relationship—to model real-world situations with linear, quadratic, exponential, or other function types.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Input-Output Relationships (basic)',
            url: 'https://youtu.be/XAJ8LdOLmlk?feature=shared',
          },
        ],
      },
    },
  ];

export default function AlgebraFunctionsScreen() {
  return <ClassTopicScreen title={"Algebra & Functions"} classKey="AlgebraAndFunctions" fallbackTopics={topics} />;
}
