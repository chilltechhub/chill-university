// src/screens/classes/homeecworkshopClass/family.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'lifeStages',
      title: 'Life Stages & Relationships',
      grade: '6-8',
      color: '#FF5722', // Deep Orange
      description:
        'Understanding developmental stages from infancy through adulthood and key relationship types.',
      learn: [
        { heading: 'Development Happens in Stages', body: 'Humans move through recognizable life stages — infancy, early childhood, adolescence, adulthood, and older age — each with its own physical, emotional, and social milestones, like learning to walk in infancy or forming identity in adolescence. Development doesn\'t stop at any one age; people keep growing emotionally and socially throughout life.' },
        { heading: 'Relationships Take Many Forms', body: 'Family, friendship, and romantic relationships each serve different needs and involve different levels of trust and commitment. Healthy relationships of any type share common traits — honest communication, mutual respect, and support during difficult times.' },
      ],
      practice: [
        { question: 'During which life stage does forming a personal identity become a major focus?', options: ['Infancy', 'Adolescence', 'Only old age', 'It never happens'], answerIndex: 1, explanation: 'Adolescence is widely recognized as the stage where identity formation becomes a central developmental task.' },
        { question: 'Which of these is a trait shared by healthy relationships, regardless of type?', options: ['Constant arguing', 'Mutual respect', 'Avoiding all communication', 'One person controlling the other'], answerIndex: 1, explanation: 'Mutual respect is a foundation of healthy relationships whether they are family, friendship, or romantic.' },
      ],
      apply: {
        prompt: 'Interview a family member from a different generation than you (a parent, grandparent, or older sibling) about one milestone from their life stage at your current age.',
        checklist: ['Chose a family member to interview', 'Asked about a milestone at your current age', 'Took notes on their answer', 'Compared it briefly to your own experience'],
      },
      help: {
        readings: [
          {
            title:
              'What Is Human Development and Why Is It Important?',
            url:
              'https://online.maryville.edu/online-bachelors-degrees/human-development-and-family-studies/resources/stages-of-human-development/',
          },
          {
            title:
              '6 Types of Relationships and Their Effect on Your Life',
            url:
              'https://www.verywellmind.com/6-types-of-relationships-and-their-effect-on-your-life-5209431',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'parentingChildDev',
      title: 'Parenting & Child Development',
      grade: '9-12',
      color: '#4CAF50', // Green
      description:
        'Guidance on effective parenting strategies and understanding milestones in child growth.',
      learn: [
        { heading: 'Consistency Builds Security', body: 'Effective parenting strategies emphasize consistency — clear, predictable rules and consequences help children feel secure and understand expectations. Positive reinforcement (praising good behavior) tends to be more effective long-term than only punishing bad behavior.' },
        { heading: 'Milestones Guide Expectations', body: 'Child development milestones — like a baby smiling around 2 months, walking around 12 months, or speaking in sentences around age 3 — give caregivers a general guide, but every child develops at their own pace within a normal range. Recognizing these milestones helps caregivers know when extra support might be needed.' },
      ],
      practice: [
        { question: 'Why is consistency important in parenting strategies?', options: ['It makes parenting easier for the parent only', 'It helps children feel secure and understand expectations', 'It has no real effect', 'It is only needed for teenagers'], answerIndex: 1, explanation: 'Predictable rules and responses help children feel safe and learn what is expected of them.' },
        { question: 'What are developmental milestones used for?', options: ['Punishing children who are behind', 'Giving a general guide to typical growth and development', 'Comparing children competitively', 'Replacing parental instinct entirely'], answerIndex: 1, explanation: 'Milestones are a general reference range, helping caregivers recognize typical progress and possible areas needing support.' },
      ],
      apply: {
        prompt: 'Research three developmental milestones typical for a specific age (choose an age between 1 and 5 years old) and write a short summary of what a caregiver might expect to see.',
        checklist: ['Chose a specific age', 'Listed three milestones', 'Cited where you found the information', 'Wrote a short summary'],
      },
      help: {
        readings: [
          {
            title:
              '9 Steps to More Effective Parenting',
            url:
              'https://kidshealth.org/en/parents/nine-steps.html',
          },
          {
            title:
              'Child Development Guide: Ages and Stages',
            url:
              'https://choc.org/ages-stages/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'agingElderCare',
      title: 'Aging & Elder Care',
      grade: '9-12',
      color: '#3F51B5', // Indigo
      description:
        'Insights on healthy aging, elder care practices, and safety for older adults.',
      learn: [
        { heading: 'Aging Well Involves the Whole Person', body: 'Healthy aging includes staying physically active, eating well, keeping the mind engaged, and maintaining social connections — isolation is one of the biggest risk factors for declining health in older adults. Regular checkups help catch and manage age-related conditions like high blood pressure or vision changes early.' },
        { heading: 'Home Safety Prevents Falls', body: 'Falls are a leading cause of injury for older adults, so elder care often focuses on reducing hazards: securing rugs, adding grab bars in bathrooms, improving lighting, and clearing walkways of clutter. Simple home modifications can significantly lower fall risk and help older adults stay independent longer.' },
      ],
      practice: [
        { question: 'Which of these is a major risk factor for declining health in older adults?', options: ['Regular checkups', 'Social isolation', 'Staying physically active', 'Eating balanced meals'], answerIndex: 1, explanation: 'Social isolation is strongly linked to declining physical and mental health in older adults.' },
        { question: 'What is a simple home modification that helps prevent falls?', options: ['Adding more loose rugs', 'Installing grab bars in the bathroom', 'Turning off hallway lights', 'Removing handrails'], answerIndex: 1, explanation: 'Grab bars provide extra support in areas like bathrooms where falls are common, especially on wet floors.' },
      ],
      apply: {
        prompt: 'Walk through your home (or a relative\'s home) with an adult and identify two potential fall hazards for an older adult, then suggest a fix for each.',
        checklist: ['Identified hazard #1', 'Suggested a fix for hazard #1', 'Identified hazard #2', 'Suggested a fix for hazard #2'],
      },
      help: {
        readings: [
          {
            title: 'Ageing and health (WHO)',
            url: 'https://www.who.int/news-room/fact-sheets/detail/ageing-and-health',
          },
          {
            title:
              'Home Safety Tips for Older Adults',
            url:
              'https://www.nia.nih.gov/health/aging-place/home-safety-tips-older-adults',
          },
        ],
        videos: [],
      },
    },
  ];

export default function FamilyAndHumanDevelopmentScreen() {
  return <ClassTopicScreen title={"Family & Human Development"} classKey="FamilyAndHumanDevelopment" fallbackTopics={topics} />;
}
