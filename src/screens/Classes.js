// src/screens/Classes.js
import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { pickRecommendedTopics, pickRecommendedGames } from '../logic/classRecommendations';

const GRADE_BAND_KEY = '@cth_academy_grade_band';
const BANDS = ['All', 'K-2', '3-5', '6-8', '9-12'];
const BAND_LABEL = { 'K-2': 'Grades K–2', '3-5': 'Grades 3–5', '6-8': 'Grades 6–8', '9-12': 'Grades 9–12' };

export default function Classes() {
  const [open, setOpen] = useState({});
  const [band, setBand] = useState('All');
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const styles = makeStyles(c, t, s, r);

  useEffect(() => {
    AsyncStorage.getItem(GRADE_BAND_KEY).then(saved => {
      if (saved && BANDS.includes(saved)) setBand(saved);
    });
  }, []);

  const chooseBand = (next) => {
    setBand(next);
    AsyncStorage.setItem(GRADE_BAND_KEY, next);
  };

  const toggle = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const subjects = [
    {
      title: 'Math',
      icon: 'calculator',
      color: '#4A90E2',
      description: 'Numbers, algebra, geometry & more',
      children: [
        { label: 'Numbers & Operations', grade: 'K-2' },
        { label: 'Algebra & Functions', grade: '3-5' },
        { label: 'Geometry & Spatial Reasoning', grade: '3-5' },
        { label: 'Measurement', grade: 'K-2' },
        { label: 'Data, Statistics & Probability', grade: '3-5' },
        { label: 'Advanced & Elective Topics', grade: '9-12' },
      ],
    },
    {
      title: 'Language Arts',
      icon: 'book',
      color: '#E05858',
      description: 'Reading, writing & communication',
      children: [
        { label: 'Reading', grade: 'K-2' },
        { label: 'Writing', grade: 'K-2' },
        { label: 'Speaking & Listening', grade: 'K-2' },
        { label: 'Language', grade: 'K-2' },
        { label: 'Media & Digital Literacy', grade: '6-8' },
      ],
    },
    {
      title: 'Science',
      icon: 'flask',
      color: '#3AC860',
      description: 'Explore the natural world',
      children: [
        { label: 'Astronomy & Space', grade: 'K-2' },
        { label: 'Physics', grade: '3-5' },
        { label: 'Earth & Environmental', grade: 'K-2' },
        { label: 'Chemistry', grade: '3-5' },
        { label: 'Biology', grade: 'K-2' },
        { label: 'Oceanography', grade: 'K-2' },
      ],
    },
    {
      title: 'Social Sciences',
      icon: 'people',
      color: '#E0A830',
      description: 'History, geography & society',
      children: [
        { label: 'History', grade: '3-5' },
        { label: 'Geography', grade: 'K-2' },
        { label: 'Civics and Government', grade: '3-5' },
        { label: 'Psychology & Sociology', grade: '3-5' },
      ],
    },
    {
      title: 'Art & Music',
      icon: 'color-palette',
      color: '#8B4FC4',
      description: 'Express your creativity',
      children: [
        { label: 'Visual Arts', grade: 'K-2' },
        { label: 'Music', grade: 'K-2' },
      ],
    },
    {
      title: 'Home Economics & Workshop',
      icon: 'home',
      color: '#E07A30',
      description: 'Practical life skills',
      children: [
        { label: 'Nutrition & Food', grade: '3-5' },
        { label: 'Textiles, Apparel & Fashion', grade: '3-5' },
        { label: 'Family & Human Development', grade: '6-8' },
        { label: 'Household & Resource Management', grade: '3-5' },
        { label: 'Health & Wellness', grade: 'K-2' },
        { label: 'Material-working', grade: '6-8' },
        { label: 'Construction', grade: '9-12' },
        { label: 'Automotive', grade: '9-12' },
        { label: 'Tool Safety & Shop Practices', grade: '3-5' },
      ],
    },
    {
      title: 'Technology & Engineering',
      icon: 'laptop',
      color: '#5A9AE0',
      description: 'Build the future',
      comingSoon: true,
    },
    {
      title: 'Foreign Language',
      icon: 'language',
      color: '#3498DB',
      description: 'Connect with the world',
      comingSoon: true,
    },
    {
      title: 'Health & Fitness',
      icon: 'fitness',
      color: '#E05858',
      description: 'Mind and body wellness',
      comingSoon: true,
    },
    {
      title: 'Business & Finance',
      icon: 'briefcase',
      color: '#3AC860',
      description: 'Economics & entrepreneurship',
      comingSoon: true,
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

  const goToChild = (label) => {
    const screen = screenMap[label];
    if (screen) navigation.navigate(screen);
  };

  const recTopics = useMemo(() => pickRecommendedTopics(subjects, band, 3), [band]);
  const recGames  = useMemo(() => pickRecommendedGames(band, 2), [band]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Academy Classes</Text>
        <Text style={styles.headerSubtitle}>Pick a subject to build up that wing of your base</Text>
      </View>

      {/* Grade band selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bandRow}>
        {BANDS.map(b => (
          <TouchableOpacity
            key={b}
            onPress={() => chooseBand(b)}
            style={[styles.bandChip, band === b && { backgroundColor: c.teal, borderColor: c.teal }]}
          >
            <Text style={[styles.bandChipText, band === b && { color: '#fff', fontWeight: '800' }]}>
              {b === 'All' ? 'All grades' : b}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recommended for you */}
      {(recTopics.length > 0 || recGames.length > 0) && (
        <View style={styles.recSection}>
          <Text style={styles.recTitle}>Recommended for {BAND_LABEL[band] || 'you'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recRow}>
            {recTopics.map((rec, i) => (
              <TouchableOpacity
                key={'topic-' + i}
                style={[styles.recCard, { borderTopColor: rec.subjectColor }]}
                onPress={() => goToChild(rec.label)}
                activeOpacity={0.85}
              >
                <Ionicons name={rec.subjectIcon} size={18} color={rec.subjectColor} />
                <Text style={styles.recCardSubject}>{rec.subjectTitle}</Text>
                <Text style={styles.recCardLabel} numberOfLines={2}>{rec.label}</Text>
              </TouchableOpacity>
            ))}
            {recGames.map(game => (
              <TouchableOpacity
                key={'game-' + game.id}
                style={[styles.recCard, { borderTopColor: c.gold }]}
                onPress={() => navigation.navigate('Play', { gameId: game.id })}
                activeOpacity={0.85}
              >
                <Text style={{ fontSize: 18 }}>{game.icon}</Text>
                <Text style={styles.recCardSubject}>Game</Text>
                <Text style={styles.recCardLabel} numberOfLines={2}>{game.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {subjects.map((item, index) => {
        const matchingChildren = item.children
          ? (band === 'All' ? item.children : item.children.filter(ch => ch.grade === band))
          : null;

        return (
          <View key={index} style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.category, { borderTopColor: item.color }]}
              onPress={() => {
                if (item.children) toggle(item.title);
                else if (item.comingSoon) {
                  Alert.alert('Coming soon', `${item.title} classes are still being built.`);
                } else {
                  goToChild(item.title);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.iconContainer, { backgroundColor: item.color + '22' }]}>
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <View style={styles.categoryTextContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.categoryText}>{item.title}</Text>
                    {item.comingSoon && (
                      <View style={[styles.comingSoonBadge, { backgroundColor: item.color + '22', borderColor: item.color + '55' }]}>
                        <Text style={[styles.comingSoonBadgeText, { color: item.color }]}>SOON</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.categoryDescription}>{item.description}</Text>
                </View>
                {item.children && (
                  <Ionicons
                    name={open[item.title] ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={c.text4}
                    style={styles.chevron}
                  />
                )}
              </View>
            </TouchableOpacity>

            {item.children && open[item.title] && (
              <View style={styles.sublist}>
                {matchingChildren.length === 0 ? (
                  <Text style={styles.noneForBand}>No {BAND_LABEL[band] || band} content in this subject yet.</Text>
                ) : (
                  matchingChildren.map((child, subIndex) => (
                    <TouchableOpacity
                      key={subIndex}
                      style={styles.subItemContainer}
                      onPress={() => goToChild(child.label)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.subItemDot, { backgroundColor: item.color }]} />
                      <Text style={styles.subItem}>{child.label}</Text>
                      <Text style={styles.subItemGrade}>{child.grade}</Text>
                      <Ionicons name="chevron-forward" size={18} color={c.text4} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.footer} />
    </ScrollView>
  );
}

const makeStyles = (c, t, s, r) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg0,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: t.xxxl,
    fontWeight: '700',
    color: c.text1,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: t.md,
    color: c.text3,
    fontWeight: '400',
  },
  bandRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  bandChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: r.full,
    backgroundColor: c.bg1,
    borderWidth: 1,
    borderColor: c.border,
  },
  bandChipText: {
    fontSize: t.sm,
    color: c.text2,
    fontWeight: '600',
  },
  recSection: {
    marginTop: 18,
    marginBottom: 6,
  },
  recTitle: {
    fontSize: t.md,
    fontWeight: '800',
    color: c.text1,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  recRow: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
  },
  recCard: {
    width: 130,
    backgroundColor: c.bg1,
    borderRadius: r.md,
    borderWidth: 0.5,
    borderColor: c.border,
    borderTopWidth: 3,
    padding: 12,
    gap: 4,
  },
  recCardSubject: {
    fontSize: 9,
    color: c.text4,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recCardLabel: {
    fontSize: t.sm,
    color: c.text1,
    fontWeight: '700',
    lineHeight: 17,
  },
  cardWrapper: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  category: {
    padding: 18,
    borderRadius: r.lg,
    backgroundColor: c.bg1,
    borderWidth: 0.5,
    borderColor: c.border,
    borderTopWidth: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryText: {
    fontSize: t.lg,
    fontWeight: '700',
    color: c.text1,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: t.sm,
    color: c.text3,
    fontWeight: '400',
  },
  chevron: {
    marginLeft: 8,
  },
  comingSoonBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sublist: {
    backgroundColor: c.bg2,
    borderRadius: r.md,
    marginTop: 8,
    paddingVertical: 8,
  },
  noneForBand: {
    color: c.text4,
    fontSize: t.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  subItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  subItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  subItem: {
    flex: 1,
    fontSize: t.md,
    color: c.text1,
    fontWeight: '500',
  },
  subItemGrade: {
    fontSize: 10,
    color: c.text4,
    fontWeight: '700',
    marginRight: 8,
  },
  footer: {
    height: 30,
  },
});
