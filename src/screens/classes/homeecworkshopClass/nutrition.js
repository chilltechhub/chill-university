// src/screens/classes/homeecworkshopClass/nutrition.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'macroMicro',
      title: 'Macronutrients & Micronutrients',
      grade: '6-8',
      color: '#4CAF50', // Green
      description:
        'Understanding the roles of proteins, carbohydrates, fats, vitamins, and minerals in health and growth.',
      help: {
        readings: [
          {
            title: 'What Are Macronutrients and Micronutrients?',
            url: 'https://health.clevelandclinic.org/macronutrients-vs-micronutrients',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'mealPlanning',
      title: 'Meal Planning & Preparation',
      grade: '6-8',
      color: '#FF9800', // Orange
      description:
        'Techniques for creating balanced meals, grocery shopping, and preparing food efficiently.',
      help: {
        readings: [
          {
            title: 'Meal Planning 101: A Complete Beginner’s Guide to Meal Prep',
            url: 'https://www.everydayhealth.com/diet-nutrition/meal-planning/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'foodSafety',
      title: 'Food Safety & Sanitation',
      grade: '3-5',
      color: '#F44336', // Red
      description:
        'Best practices to handle, store, and prepare food safely to prevent illness.',
      help: {
        readings: [
          {
            title: 'Keep Food Safe! Food Safety Basics',
            url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/steps-keep-food-safe',
          },
          {
            title: 'What Is Food Sanitation? Practices and Examples',
            url: 'https://www.fooddocs.com/post/food-sanitation',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'culinaryTechniques',
      title: 'Culinary Techniques',
      grade: '6-8',
      color: '#3F51B5', // Indigo
      description:
        'Fundamental cooking methods such as sautéing, roasting, braising, and knife skills.',
      help: {
        readings: [
          {
            title: 'Culinary Techniques and Cooking Methods',
            url: 'https://www.casaschools.com/reference-library/culinary-techniques/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'specialDiets',
      title: 'Special Diets & Cultural Foods',
      grade: '9-12',
      color: '#9C27B0', // Purple
      description:
        'Exploring dietary restrictions, allergies, and traditional cuisines from around the world.',
      help: {
        readings: [
          {
            title: '10 Dietary Restrictions All Event Planners Should Know',
            url: 'https://www.healthline.com/nutrition/most-common-dietary-restrictions',
          },
          {
            title: 'Cultural Cuisines and Traditions',
            url: 'https://www.eatright.org/food/cultural-cuisines-and-traditions',
          },
        ],
        videos: [],
      },
    },
  ];

export default function NutritionFoodScienceScreen() {
  return <ClassTopicScreen title={"Nutrition & Food Science"} classKey="NutritionAndFood" fallbackTopics={topics} />;
}
