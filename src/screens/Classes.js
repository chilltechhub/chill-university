// src/screens/Classes.js

import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function Classes() {
  const [open, setOpen] = useState({});
  const navigation = useNavigation();

  const toggle = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const subjects = [
    {
      title: 'Math',
      icon: 'calculator',
      color: '#4A90E2',
      gradient: ['#4A90E2', '#357ABD'],
      description: 'Numbers, algebra, geometry & more',
      children: [
        'Numbers & Operations',
        'Algebra & Functions',
        'Geometry & Spatial Reasoning',
        'Measurement',
        'Data, Statistics & Probability',
        'Advanced & Elective Topics',
      ],
    },
    {
      title: 'Language Arts',
      icon: 'book',
      color: '#E74C3C',
      gradient: ['#E74C3C', '#C0392B'],
      description: 'Reading, writing & communication',
      children: ['Reading', 'Writing', 'Speaking & Listening', 'Language', 'Media & Digital Literacy'],
    },
    {
      title: 'Science',
      icon: 'flask',
      color: '#27AE60',
      gradient: ['#27AE60', '#229954'],
      description: 'Explore the natural world',
      children: ['Astronomy & Space', 'Physics', 'Earth & Environmental', 'Chemistry', 'Biology', 'Oceanography'],
    },
    {
      title: 'Social Sciences',
      icon: 'people',
      color: '#F39C12',
      gradient: ['#F39C12', '#D68910'],
      description: 'History, geography & society',
      children: ['History', 'Geography', 'Civics and Government', 'Psychology & Sociology'],
    },
    {
      title: 'Art & Music',
      icon: 'color-palette',
      color: '#9B59B6',
      gradient: ['#9B59B6', '#8E44AD'],
      description: 'Express your creativity',
      children: ['Visual Arts', 'Music'],
    },
    {
      title: 'Home Economics & Workshop',
      icon: 'home',
      color: '#E67E22',
      gradient: ['#E67E22', '#CA6F1E'],
      description: 'Practical life skills',
      children: [
        'Nutrition & Food',
        'Textiles, Apparel & Fashion',
        'Family & Human Development',
        'Household & Resource Management',
        'Health & Wellness',
        'Material-working',
        'Construction',
        'Automotive',
        'Tool Safety & Shop Practices',
      ],
    },
    {
      title: 'Technology & Engineering',
      icon: 'laptop',
      color: '#16A085',
      gradient: ['#16A085', '#138D75'],
      description: 'Build the future',
    },
    {
      title: 'Foreign Language',
      icon: 'language',
      color: '#3498DB',
      gradient: ['#3498DB', '#2980B9'],
      description: 'Connect with the world',
    },
    {
      title: 'Health & Fitness',
      icon: 'fitness',
      color: '#1ABC9C',
      gradient: ['#1ABC9C', '#17A589'],
      description: 'Mind and body wellness',
    },
    {
      title: 'Business & Finance',
      icon: 'briefcase',
      color: '#34495E',
      gradient: ['#34495E', '#2C3E50'],
      description: 'Economics & entrepreneurship',
    },
  ];

  const screenMap = {
    'Numbers & Operations': 'NumbersAndOperations',
    'Algebra & Functions': 'AlgebraAndFunctions',
    'Geometry & Spatial Reasoning': 'GeometrySpatialReasoning',
    'Measurement': 'Measurement',
    'Data, Statistics & Probability': 'DataStatisticsProbability',
    'Advanced & Elective Topics': 'AdvancedMath',
    Reading: 'Reading',
    Writing: 'Writing',
    'Speaking & Listening': 'SpeakingAndListening',
    Language: 'Language',
    'Media & Digital Literacy': 'MediaDigitalLiteracy',
    'Astronomy & Space': 'AstronomyAndSpace',
    Physics: 'Physics',
    'Earth & Environmental': 'EarthAndEnvironmental',
    Chemistry: 'Chemistry',
    Biology: 'Biology',
    Oceanography: 'Oceanography',
    History: 'History',
    Geography: 'Geography',
    'Civics and Government': 'CivicsAndGovernment',
    'Psychology & Sociology': 'PsychologicalAndSociology',
    'Nutrition & Food': 'NutritionAndFood',
    'Textiles, Apparel & Fashion': 'TextilesAndApparel',
    'Family & Human Development': 'FamilyAndHumanDevelopment',
    'Household & Resource Management': 'HouseholdAndResourceManagement',
    'Health & Wellness': 'HealthAndWellness',
    'Material-working': 'MaterialWorking',
    Construction: 'Construction',
    Automotive: 'Automotive',
    'Tool Safety & Shop Practices': 'ToolSafetyAndShopPractices',
    'Visual Arts': 'VisualArt',
    Music: 'Music',
    'Home Economics & Workshop': 'HomeEconomicsAndWorkshop',
    'Technology & Engineering': 'TechnologyAndEngineering',
    'Foreign Language': 'ForeignLanguage',
    'Health & Fitness': 'HealthAndFitness',
    'Business & Finance': 'BusinessAndFinance',
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Classes</Text>
        <Text style={styles.headerSubtitle}>Choose a subject to begin your learning journey</Text>
      </View>

      {subjects.map((item, index) => (
        <View key={index} style={styles.cardWrapper}>
          <TouchableOpacity
            style={[styles.category, { backgroundColor: item.color }]}
            onPress={() => {
              if (item.children) toggle(item.title);
              else {
                const screen = screenMap[item.title];
                if (screen) navigation.navigate(screen);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.categoryHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={28} color="#FFFFFF" />
              </View>
              <View style={styles.categoryTextContainer}>
                <Text style={styles.categoryText}>{item.title}</Text>
                <Text style={styles.categoryDescription}>{item.description}</Text>
              </View>
              {item.children && (
                <Ionicons
                  name={open[item.title] ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#FFFFFF"
                  style={styles.chevron}
                />
              )}
            </View>
          </TouchableOpacity>

          {item.children && open[item.title] && (
            <View style={styles.sublist}>
              {item.children.map((child, subIndex) => (
                <TouchableOpacity
                  key={subIndex}
                  style={styles.subItemContainer}
                  onPress={() => navigation.navigate(screenMap[child])}
                  activeOpacity={0.7}
                >
                  <View style={[styles.subItemDot, { backgroundColor: item.color }]} />
                  <Text style={styles.subItem}>{child}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '400',
  },
  cardWrapper: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  category: {
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  chevron: {
    marginLeft: 8,
  },
  sublist: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  subItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  subItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  subItem: {
    flex: 1,
    fontSize: 16,
    color: '#34495E',
    fontWeight: '500',
  },
  footer: {
    height: 30,
  },
});