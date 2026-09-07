// src/screens/classes/healthFitnessClass/foundations.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'handwashingHygiene',
    title: 'Handwashing & Hygiene Habits',
    grade: 'K-2',
    color: '#FF6B6B',
    description:
      'Germs are tiny living things that can make you sick. Learning to wash hands properly, and knowing when it matters most, is the single best defense against getting sick.',
    learn: [
      { heading: 'Why We Wash', body: 'Germs are so small you can\'t see them, but they can make you sick if they get into your body. Scrubbing your hands with soap and warm water lifts germs off your skin and washes them away.' },
      { heading: 'How Long & When', body: 'Wash for about 20 seconds — the time it takes to sing "Happy Birthday" twice — scrubbing between your fingers and under your nails. Always wash before eating and after using the bathroom, coughing, or playing outside.' },
    ],
    practice: [
      { question: 'How long should you wash your hands with soap and water?', options: ['5 seconds', '20 seconds', '2 minutes', 'You don\'t need soap'], answerIndex: 1, explanation: 'About 20 seconds — roughly the time it takes to sing "Happy Birthday" twice — is long enough to remove germs.' },
      { question: 'Which of these is a good time to wash your hands?', options: ['Only in the morning', 'Before eating and after the bathroom', 'Only if hands look dirty', 'Once a week'], answerIndex: 1, explanation: 'Handwashing matters most before eating and after the bathroom, coughing, or playing outside — even if hands look clean.' },
    ],
    apply: {
      prompt: 'Wash your hands properly while singing a 20-second song, then check off a hygiene tracking sheet for today.',
      checklist: ['Used soap and warm water', 'Scrubbed for about 20 seconds', 'Scrubbed between fingers and under nails', 'Dried hands with a clean towel'],
    },
    help: {
      videos: [
        { title: 'The Hand Washing Song 🧼 | Healthy Habits Kids Song | Super Simple Songs', url: 'https://www.youtube.com/watch?v=8lu587o8T3c' },
      ],
    },
  },
  {
    key: 'myPlateFoodGroups',
    title: 'MyPlate Food Groups & Balanced Meals',
    grade: '3-5',
    color: '#4D96FF',
    description:
      'Healthy bodies need a variety of foods from all 5 MyPlate groups. Learn to build a balanced plate, with fruits and vegetables filling about half of it.',
    learn: [
      { heading: 'The 5 Food Groups', body: 'MyPlate divides food into 5 groups: Fruits, Vegetables, Grains, Protein, and Dairy. Each group gives your body something different — grains give energy, protein builds muscle, and fruits and vegetables provide vitamins.' },
      { heading: 'Build a Balanced Plate', body: 'A good rule of thumb: make about half your plate fruits and vegetables, with the rest split between grains (aim for whole grains) and protein, plus a serving of dairy on the side.' },
    ],
    practice: [
      { question: 'Which two food groups should make up about half of your dinner plate?', options: ['Dairy and grains', 'Fruits and vegetables', 'Protein and dairy', 'Just protein'], answerIndex: 1, explanation: 'Filling half the plate with fruits and vegetables is the core MyPlate guideline.' },
      { question: 'How many food groups does MyPlate divide food into?', options: ['3', '4', '5', '7'], answerIndex: 2, explanation: 'MyPlate has 5 groups: Fruits, Vegetables, Grains, Protein, and Dairy.' },
    ],
    apply: {
      prompt: 'Draw a dinner plate divided into sections and fill each part with foods you like from the 5 main food groups.',
      checklist: ['Drew all 5 food groups on the plate', 'Made fruits + vegetables about half the plate', 'Labeled each section with a real food'],
    },
    help: {
      videos: [
        { title: 'MyPlate! #1: Food Groups for Kids!', url: 'https://www.youtube.com/watch?v=-0Ql8Iq6PnE' },
      ],
    },
  },
  {
    key: 'cardiovascularHeartRate',
    title: 'Cardiovascular Health & Target Heart Rate',
    grade: '6-8',
    color: '#3AC860',
    description:
      'Your heart is a muscle strengthened by aerobic exercise. Learn to measure your pulse and understand what a target heart rate zone means during exercise.',
    learn: [
      { heading: 'The Heart Is a Muscle', body: 'Aerobic exercise — running, swimming, cycling — makes your heart stronger over time, the same way lifting weights strengthens other muscles. A stronger heart pumps more blood per beat, which is why a fit person\'s resting heart rate is often lower.' },
      { heading: 'Finding Your Target Heart Rate', body: 'A rough estimate of your maximum heart rate is 220 minus your age. Your target heart rate zone during moderate exercise is usually 50–85% of that number — high enough to build fitness, low enough to sustain safely.' },
    ],
    practice: [
      { question: 'If you count 12 heartbeats in 10 seconds while resting, what is your heart rate in beats per minute (BPM)?', options: ['12 BPM', '60 BPM', '72 BPM', '120 BPM'], answerIndex: 2, explanation: '12 beats in 10 seconds × 6 = 72 BPM.' },
      { question: 'What type of exercise is best known for strengthening the heart over time?', options: ['Stretching', 'Aerobic exercise like running or swimming', 'Sitting still', 'Sleeping'], answerIndex: 1, explanation: 'Aerobic (cardio) exercise conditions the heart muscle to pump more efficiently.' },
    ],
    apply: {
      prompt: 'Measure and record your resting heart rate. Do 30 jumping jacks, measure your heart rate again immediately, and compare the two numbers.',
      checklist: ['Measured resting heart rate (BPM)', 'Did 30 jumping jacks', 'Measured heart rate right after exercise', 'Compared the two numbers and noted the difference'],
    },
    help: {
      videos: [
        { title: 'HOW TO CALCULATE TARGET HEART RATE', url: 'https://www.youtube.com/watch?v=emBa3HDVZ9Y' },
      ],
    },
  },
  {
    key: 'macronutrientEnergyBalance',
    title: 'Energy Balance & Macronutrient Calculations',
    grade: '9-12',
    color: '#8B4FC4',
    description:
      'Energy balance (Calories In vs. Calories Out) determines weight change over time. Learn how each macronutrient contributes calories, and how to calculate them from a nutrition label.',
    learn: [
      { heading: 'Calories In, Calories Out', body: 'Energy balance is the relationship between the calories your body takes in from food and the calories it burns through activity and basic functioning. Consistently taking in more than you burn leads to weight gain; consistently burning more leads to weight loss.' },
      { heading: 'What Each Macronutrient Provides', body: 'Carbohydrates and protein each provide about 4 kcal per gram, while fat provides about 9 kcal per gram — more than double. That\'s why fat-dense foods pack a lot of calories into a small amount.' },
    ],
    practice: [
      { question: 'How many total calories are in a snack with 10g Protein, 20g Carbs, and 5g Fat?', options: ['70 kcal', '120 kcal', '165 kcal', '200 kcal'], answerIndex: 2, explanation: '(10×4) + (20×4) + (5×9) = 40 + 80 + 45 = 165 kcal.' },
      { question: 'Which macronutrient provides the most calories per gram?', options: ['Carbohydrates', 'Protein', 'Fat', 'They\'re all equal'], answerIndex: 2, explanation: 'Fat provides about 9 kcal/g, more than double carbs or protein at about 4 kcal/g each.' },
    ],
    apply: {
      prompt: 'Choose a packaged food item. Read its nutrition label and calculate what percentage of its total calories comes from fat versus carbohydrates.',
      checklist: ['Recorded grams of fat, carbs, and protein from the label', 'Converted each to calories using 4/4/9 kcal per gram', 'Calculated the percentage of total calories from fat', 'Calculated the percentage of total calories from carbs'],
    },
    help: {
      videos: [
        { title: 'Macronutrients - Carbs, Protein, and Fat Explained', url: 'https://www.youtube.com/watch?v=uSMvgpxYDnc' },
      ],
    },
  },
];

export default function HealthAndFitnessScreen() {
  return <ClassTopicScreen title={'Health & Fitness'} classKey="HealthAndFitness" fallbackTopics={topics} />;
}
