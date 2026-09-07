// src/screens/classes/homeecworkshopClass/health.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'personalHygiene',
      title: 'Personal Hygiene & Self-Care',
      grade: 'K-2',
      color: '#009688', // Teal
      description:
        'Practicing proper hygiene habits and self-care routines to maintain cleanliness and overall health.',
      learn: [
        { heading: 'Everyday Hygiene Habits', body: 'Washing your hands with soap for 20 seconds, brushing your teeth twice a day, and taking a bath or shower regularly are simple habits that keep germs away and help your body stay healthy. These habits are most helpful when they become part of your daily routine, like right after using the bathroom or before eating.' },
        { heading: 'Self-Care Means Taking Care of You', body: 'Self-care includes getting enough sleep, eating healthy food, and taking time to rest or play — it helps your body and mind feel good. Asking a grown-up for help when you\'re not feeling well or need new hygiene supplies is part of taking care of yourself too.' },
      ],
      practice: [
        { question: 'How long should you wash your hands with soap to clean them well?', options: ['2 seconds', 'About 20 seconds', '1 minute', 'You don\'t need soap'], answerIndex: 1, explanation: 'Washing with soap for about 20 seconds — roughly the time it takes to hum a short song twice — helps remove germs effectively.' },
        { question: 'Which of these is an example of self-care?', options: ['Skipping meals', 'Getting enough sleep', 'Staying up all night', 'Ignoring when you feel sick'], answerIndex: 1, explanation: 'Getting enough sleep helps your body and mind rest and stay healthy, making it an important self-care habit.' },
      ],
      apply: {
        prompt: 'With a grown-up, make a simple daily hygiene checklist (like washing hands, brushing teeth, and bathing) and check it off for one full day.',
        checklist: ['Made a hygiene checklist', 'Included hand washing', 'Included teeth brushing', 'Checked off each item for one day'],
      },
      help: {
        readings: [
          {
            title: 'Creating a Personal Hygiene Routine: Tips and Benefits',
            url: 'https://www.healthline.com/health/personal-hygiene',
          },
          {
            title: '7 Tips for Practicing Self-Care',
            url: 'https://turningpointcare.com/blog/7-tips-for-practicing-self-care/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'stressManagement',
      title: 'Stress Management & Mental Health',
      grade: '6-8',
      color: '#9C27B0', // Purple
      description:
        'Techniques to manage stress, support mental well-being, and recognize signs of emotional health needs.',
      learn: [
        { heading: 'Stress Has Warning Signs', body: 'Stress can show up as physical signs (headaches, trouble sleeping), emotional signs (feeling irritable or overwhelmed), or behavioral signs (avoiding friends, changes in appetite). Recognizing these early signs helps you respond before stress builds up too much.' },
        { heading: 'Coping Strategies That Actually Help', body: 'Techniques like deep breathing, physical activity, talking to a trusted friend or adult, and breaking big problems into smaller steps can reduce stress in healthy ways. It\'s normal to need support sometimes — reaching out to a counselor, teacher, or trusted adult is a sign of strength, not weakness.' },
      ],
      practice: [
        { question: 'Which of these is a physical sign of stress?', options: ['Trouble sleeping', 'Getting straight A\'s', 'Feeling well-rested', 'Having no opinions'], answerIndex: 0, explanation: 'Stress often shows up physically, including through sleep problems, headaches, or fatigue.' },
        { question: 'What is a healthy way to cope with stress?', options: ['Bottling up feelings and avoiding everyone', 'Talking to a trusted friend or adult', 'Ignoring the problem completely', 'Skipping sleep to worry more'], answerIndex: 1, explanation: 'Talking to someone you trust is a healthy coping strategy that can help you process stress and find solutions.' },
      ],
      apply: {
        prompt: 'The next time you feel stressed this week, try one coping technique (deep breathing, a short walk, or talking to someone) and write a sentence about how it made you feel.',
        checklist: ['Noticed a stressful moment', 'Tried one coping technique', 'Wrote how it felt before', 'Wrote how it felt after'],
      },
      help: {
        readings: [
          {
            title: 'Caring for Your Mental Health',
            url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health',
          },
          {
            title: 'Managing Stress',
            url: 'https://www.cdc.gov/mental-health/living-with/index.html',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'firstAid',
      title: 'First Aid & Safety Basics',
      grade: '6-8',
      color: '#F44336', // Red
      description:
        'Basic emergency response skills to treat common injuries and ensure safety in everyday situations.',
      learn: [
        { heading: 'Check, Call, Care', body: 'The basic first aid sequence is: check the scene and person for danger, call for help (an adult or 911) if it\'s serious, and care for the injury using safe, simple steps. For a minor cut, that means washing your hands, rinsing the wound, applying pressure to stop bleeding, and covering it with a clean bandage.' },
        { heading: 'Know When to Get an Adult', body: 'Small scrapes and minor burns can often be treated with basic first aid, but deep cuts, heavy bleeding, burns that blister badly, or any injury involving trouble breathing always need an adult or emergency services right away. First aid is about helping safely — it\'s never worth risking your own safety to help someone else.' },
      ],
      practice: [
        { question: 'What is the correct first step when treating a minor cut?', options: ['Cover it immediately without cleaning', 'Wash your hands before touching the wound', 'Ignore it', 'Apply a bandage over dirt'], answerIndex: 1, explanation: 'Washing your hands first helps prevent introducing germs into the wound.' },
        { question: 'When should you always get an adult for help with an injury?', options: ['For any small paper cut', 'When there is heavy bleeding or trouble breathing', 'Only if it doesn\'t hurt', 'Never, kids should always handle it alone'], answerIndex: 1, explanation: 'Serious signs like heavy bleeding or breathing trouble mean it is time to get an adult or call emergency services immediately.' },
      ],
      apply: {
        prompt: 'With an adult, find or put together a basic first aid kit at home and identify what each item is used for (bandages, antiseptic wipes, gauze, etc.).',
        checklist: ['Located or assembled a first aid kit', 'Identified at least 4 items', 'Explained what each item is for', 'Checked with an adult where the kit is stored'],
      },
      help: {
        readings: [
          {
            title: 'First Aid Steps',
            url: 'https://www.redcross.org/take-a-class/first-aid/performing-first-aid/first-aid-steps?srsltid=AfmBOooDbmE2tmoBx-6eEkKe-6YMl_PMe-0hQ0gdC3fCKaSY10k_6Zbo',
          },
          {
            title: 'Basic First Aid Skills Everyone Should Learn',
            url: 'https://www.idahomedicalacademy.com/basic-first-aid-skills-everyone-should-learn/',
          },
          {
            title: 'Cuts and Scrapes: First Aid',
            url: 'https://www.mayoclinic.org/first-aid/first-aid-cuts/basics/art-20056711',
          },
        ],
        videos: [],
      },
    },
  ];

export default function HealthAndWellnessScreen() {
  return <ClassTopicScreen title={"Health & Wellness"} classKey="HealthAndWellness" fallbackTopics={topics} />;
}
