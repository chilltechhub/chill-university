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
      learn: [
        { heading: 'The Big Three: Macronutrients', body: 'Macronutrients are the nutrients your body needs in large amounts: proteins build and repair muscle, carbohydrates are the body\'s main energy source, and fats support hormone production and help absorb certain vitamins. Every food is a mix of these three in different proportions.' },
        { heading: 'The Small but Mighty: Micronutrients', body: 'Micronutrients — vitamins and minerals like vitamin C, iron, and calcium — are needed only in small amounts but are essential for things like immune function, strong bones, and healthy blood. A varied diet of fruits, vegetables, proteins, and whole grains is the easiest way to get enough of both macro- and micronutrients.' },
      ],
      practice: [
        { question: 'Which of these is a macronutrient?', options: ['Vitamin C', 'Iron', 'Protein', 'Calcium'], answerIndex: 2, explanation: 'Protein, along with carbohydrates and fats, is one of the three macronutrients needed in large amounts.' },
        { question: 'What is the main job of carbohydrates in the body?', options: ['Building muscle', 'Providing energy', 'Fighting infection', 'Strengthening bones'], answerIndex: 1, explanation: 'Carbohydrates are broken down into glucose, the body\'s primary source of energy.' },
      ],
      apply: {
        prompt: 'Look at the nutrition label on a food item at home. Identify how many grams of protein, carbohydrates, and fat it contains per serving.',
        checklist: ['Found a food with a nutrition label', 'Recorded grams of protein', 'Recorded grams of carbohydrates', 'Recorded grams of fat'],
      },
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
      learn: [
        { heading: 'Plan Before You Shop', body: 'A good meal plan starts with picking recipes for the week, checking what you already have, and writing a grocery list organized by store section. This saves money, cuts down on food waste, and avoids last-minute unhealthy choices.' },
        { heading: 'Balance Every Plate', body: 'A well-planned meal usually includes a protein, a whole grain or starch, and vegetables or fruit — filling roughly half the plate with produce. Prepping ingredients in batches (like chopping vegetables or cooking rice ahead of time) makes weeknight cooking much faster.' },
      ],
      practice: [
        { question: 'What should you do before writing a grocery list?', options: ['Go to the store immediately', 'Check what food you already have at home', 'Buy only snacks', 'Skip planning meals'], answerIndex: 1, explanation: 'Checking your pantry and fridge first prevents buying duplicates and reduces food waste.' },
        { question: 'A balanced meal typically fills about half the plate with what?', options: ['Dessert', 'Vegetables or fruit', 'Bread only', 'Soda'], answerIndex: 1, explanation: 'Filling half the plate with vegetables or fruit is a simple way to build a balanced, nutrient-rich meal.' },
      ],
      apply: {
        prompt: 'Plan one balanced dinner for your family this week: pick a protein, a grain or starch, and a vegetable, then write a short grocery list for it.',
        checklist: ['Chose a protein', 'Chose a grain or starch', 'Chose a vegetable or fruit', 'Wrote a grocery list'],
      },
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
      learn: [
        { heading: 'Wash, Separate, Cook, Chill', body: 'The four keys to food safety: wash your hands and surfaces often, keep raw meat separate from other foods, cook food to a safe temperature, and chill leftovers quickly.' },
        { heading: 'Measuring Matters Too', body: 'Safe cooking also means measuring correctly — liquid measuring cups (clear, with a spout) for liquids, and dry measuring cups (leveled off flat with a knife) for dry ingredients like flour or sugar.' },
      ],
      practice: [
        { question: 'Which tool should you use to measure 1/2 cup of milk?', options: ['A dry measuring cup', 'A clear liquid measuring cup', 'A tablespoon', 'Your hands'], answerIndex: 1, explanation: 'Liquids get measured in a clear cup with a spout so you can check the line at eye level.' },
        { question: 'Why should raw meat be kept separate from other foods while cooking?', options: ['It smells bad', 'To keep germs from spreading to other food (cross-contamination)', 'It cooks faster alone', 'It is more expensive'], answerIndex: 1, explanation: "Raw meat can carry germs that spread to other foods if they touch — that's called cross-contamination." },
      ],
      apply: {
        prompt: 'Find a measuring cup or spoon at home. Measure 1 cup of water and pour it into a clear glass, photographing your measurement at eye level.',
        checklist: ['Found a measuring cup', 'Measured exactly 1 cup', 'Checked the level at eye height', 'Took a photo'],
      },
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
      learn: [
        { heading: 'Dry Heat vs. Moist Heat', body: 'Sautéing and roasting are "dry heat" methods that use hot pans or oven air to brown food and build flavor quickly. Braising is a "moist heat" method that cooks tougher cuts of meat slowly in liquid until they become tender.' },
        { heading: 'Knife Skills Come First', body: 'Before you can sauté or braise anything, you need consistent knife cuts — like dicing, mincing, and julienning — so food cooks evenly. Always cut with fingertips curled under (the "claw grip") and keep the knife blade away from your body.' },
      ],
      practice: [
        { question: 'Which cooking method uses liquid and long, slow cooking to tenderize tough meat?', options: ['Sautéing', 'Braising', 'Searing only', 'Deep frying'], answerIndex: 1, explanation: 'Braising combines searing with slow cooking in liquid, which breaks down tough fibers over time.' },
        { question: 'What is the "claw grip" used for in knife skills?', options: ['Holding the pan handle', 'Protecting your fingertips while cutting', 'Sharpening the blade', 'Stirring sauce'], answerIndex: 1, explanation: 'Curling your fingertips under while gripping the food keeps them safely away from the blade.' },
      ],
      apply: {
        prompt: 'With adult supervision, practice the claw grip by dicing one vegetable (like a carrot or bell pepper) into evenly sized pieces.',
        checklist: ['Used the claw grip', 'Cut pieces roughly the same size', 'Kept fingertips away from the blade', 'Had adult supervision'],
      },
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
      learn: [
        { heading: 'Restrictions Have Different Causes', body: 'Dietary restrictions can come from allergies (an immune reaction that can be life-threatening, like a peanut allergy), intolerances (digestive discomfort, like lactose intolerance), medical needs (like diabetes), or personal/religious choices (like vegetarianism, veganism, halal, or kosher). Understanding the difference matters when cooking for others.' },
        { heading: 'Cultural Cuisine Reflects History', body: 'Traditional cuisines developed around the ingredients, climate, and trade routes available in a region — for example, rice-based dishes in much of Asia or corn-based dishes across Latin America. Learning about cultural foods builds respect for the traditions and history behind them, not just the flavors.' },
      ],
      practice: [
        { question: 'Which of these is an example of a food allergy rather than a lifestyle choice?', options: ['Vegetarianism', 'A peanut allergy', 'Following a kosher diet', 'Veganism'], answerIndex: 1, explanation: 'A peanut allergy is an immune system reaction and can be medically serious, unlike a chosen diet.' },
        { question: 'Why do traditional cuisines often differ so much by region?', options: ['Random chance', 'Available ingredients, climate, and trade history shaped local cooking', 'All cuisines are actually the same', 'Governments require it'], answerIndex: 1, explanation: 'What grows locally and what trade brought in over centuries shaped each region\'s traditional dishes.' },
      ],
      apply: {
        prompt: 'Research one traditional dish from a culture different from your own. Note its main ingredients and one dietary restriction (allergy, intolerance, or religious rule) that would affect whether someone could eat it.',
        checklist: ['Chose a dish from another culture', 'Listed its main ingredients', 'Identified a related dietary restriction', 'Wrote a short summary'],
      },
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
