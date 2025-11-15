// src/screens/NutritionFoodScienceScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function NutritionFoodScienceScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'macroMicro',
      title: 'Macronutrients & Micronutrients',
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

  const toggleHelp = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainTitle}>Nutrition & Food Science</Text>

      {topics.map((topic) => (
        <View key={topic.key} style={styles.card}>
          <View style={[styles.headerBar, { backgroundColor: topic.color }]}>  
            <Text style={styles.headerText}>{topic.title}</Text>
          </View>
          <View style={styles.sectionBody}>
            <Text style={styles.subtitle}>What is it?</Text>
            <Text style={styles.description}>{topic.description}</Text>

            {(topic.help.readings.length > 0 || topic.help.videos.length > 0) && (
              <TouchableOpacity
                style={styles.helpToggle}
                onPress={() => toggleHelp(topic.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.helpTitle}>
                  Need help? {openSections[topic.key] ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
            )}

            {openSections[topic.key] && (
              <View style={styles.helpContent}>
                {topic.help.readings.length > 0 && (
                  <>
                    <Text style={styles.helpLabel}>Readings</Text>
                    {topic.help.readings.map((item, idx) => (
                      <Text
                        key={idx}
                        style={styles.linkText}
                        onPress={() => Linking.openURL(item.url)}
                      >
                        • {item.title}
                      </Text>
                    ))}
                  </>
                )}
                {topic.help.videos.length > 0 && (
                  <>
                    <Text style={styles.helpLabel}>Videos</Text>
                    {topic.help.videos.map((video, idx) => (
                      <Text
                        key={idx}
                        style={styles.linkText}
                        onPress={() => Linking.openURL(video.url)}
                      >
                        • {video.title}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#555',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    color: '#444',
  },
  helpToggle: {
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  helpContent: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
  },
  helpLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  linkText: {
    fontSize: 14,
    color: '#1e88e5',
    marginLeft: 8,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
});
