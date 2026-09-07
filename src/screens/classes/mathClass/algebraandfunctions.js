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
      learn: [
        { heading: 'Finding the Rule in a Pattern', body: 'A pattern like 3, 6, 9, 12 has a rule you can describe in words: "start at 3 and add 3 each time." Once you know the rule, you can predict any term without listing every number in between.' },
        { heading: 'Using Tables to See Relationships', body: 'A table with an "input" column and "output" column helps you spot a pattern between two changing quantities, like the number of tables and the number of chairs needed. Look at how the output changes each time the input goes up by 1 — that tells you the rule.' },
      ],
      practice: [
        { question: 'What is the next number in the pattern: 5, 10, 15, 20, ___?', options: ['22', '24', '25', '30'], answerIndex: 2, explanation: 'The rule is "add 5 each time," so 20 + 5 = 25.' },
        { question: 'A table shows: 1 table seats 4, 2 tables seat 8, 3 tables seat 12. How many people can sit at 5 tables?', options: ['16', '18', '20', '24'], answerIndex: 2, explanation: 'The rule is "multiply the number of tables by 4," so 5 × 4 = 20.' },
      ],
      apply: {
        prompt: 'Using buttons, coins, or dried beans, build a growing pattern (like adding 2 more objects to each row). Make a table recording the row number and the number of objects, then predict how many objects would be in row 10.',
        checklist: ['Built at least 3 rows of a growing pattern', 'Recorded row number and object count in a table', 'Described the rule in words', 'Predicted the count for row 10 using the rule'],
      },
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
      learn: [
        { heading: 'Expressions vs. Equations', body: 'An expression like 3x + 5 is a phrase with numbers, variables, and operations — it has no equals sign and no single answer until you plug in a value for x. An equation, like 3x + 5 = 20, states that two expressions are equal, and solving it means finding the value of x that makes it true.' },
        { heading: 'Solving by Balancing', body: 'An equation is like a balanced scale: whatever you do to one side (add, subtract, multiply, divide), you must do to the other side to keep it balanced. Quadratic equations (with an x²) often need factoring or the quadratic formula because there can be two solutions instead of one.' },
      ],
      practice: [
        { question: 'What is the value of the expression 3x + 5 when x = 4?', options: ['12', '17', '9', '20'], answerIndex: 1, explanation: '3 × 4 = 12, then 12 + 5 = 17.' },
        { question: 'Solve for x: 2x + 6 = 20', options: ['x = 6', 'x = 7', 'x = 8', 'x = 13'], answerIndex: 2, explanation: 'Subtract 6 from both sides to get 2x = 14, then divide both sides by 2 to get x = 8.' },
      ],
      apply: {
        prompt: 'Imagine you are saving money and start with $10 that grows by $3 every week. Write an expression for your total money after w weeks, then write and solve an equation to find how many weeks it takes to reach $34.',
        checklist: ['Wrote the expression 10 + 3w', 'Set the expression equal to 34 as an equation', 'Solved the equation by balancing both sides', 'Checked the answer by substituting it back in'],
      },
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
      learn: [
        { heading: 'What Makes a Relation a Function', body: 'A function is a rule that assigns exactly one output to each input — written f(x), read "f of x." If you graph it, every vertical line crosses the graph at most once; if an input ever produced two different outputs, it wouldn\'t be a function.' },
        { heading: 'Choosing the Right Model', body: 'Real data suggests which function family fits: if the value changes by the same amount each step, it\'s linear; if it changes by the same percentage each step, it\'s exponential (like compound interest or population growth); if it rises then falls symmetrically, it may be quadratic (like a thrown ball\'s height).' },
      ],
      practice: [
        { question: 'If f(x) = 2x + 3, what is f(5)?', options: ['10', '11', '13', '8'], answerIndex: 2, explanation: 'f(5) = 2(5) + 3 = 10 + 3 = 13.' },
        { question: 'A savings account grows by 5% each year. What type of function best models the balance over time?', options: ['Linear', 'Quadratic', 'Exponential', 'Constant'], answerIndex: 2, explanation: 'A constant percentage change year after year is the hallmark of exponential growth.' },
      ],
      apply: {
        prompt: 'Drop a ball from a fixed height and measure how high it bounces back, three times in a row. Record height vs. bounce number in a table, then decide whether a linear or exponential function better models the pattern and explain why.',
        checklist: ['Recorded bounce height for at least 3 bounces', 'Made a table of bounce number vs. height', 'Compared successive differences and ratios', 'Chose linear or exponential and justified the choice'],
      },
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
