import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const domainSections = [
  {
    id: 'academic',
    title: '🎓 Academic & Career',
    color: '#4A90E2',
    cards: [
      {
        title: 'Discover',
        subtitle: 'Connect with the community',
        items: [
          { label: 'Projects & Collaborations', screen: 'DiscoverScreen', badge: null },
          { label: 'Breakthroughs', screen: 'BreakthroughsScreen', badge: null },
          { label: 'Fellow Scholars', screen: 'FellowScholarsScreen', badge: null },
          { label: 'Top Talent', screen: 'TopTalentScreen', badge: null },
          { label: 'Mentors & Experts', screen: 'MentorsScreen', badge: null },
        ],
      },
      {
        title: 'Your Work',
        subtitle: 'Build and showcase',
        items: [
          { label: 'Projects', screen: 'ProjectsScreen', badge: '3' },
          { label: 'Labs', screen: 'LabsScreen', badge: null },
          { label: 'Portfolio', screen: 'PortfolioScreen', badge: null },
        ],
      },
      {
        title: 'Growth & Exploration',
        subtitle: 'Plan your path',
        items: [
          { label: 'Research', screen: 'ResearchScreen', badge: null },
          { label: 'Career Exploration', screen: 'CareerExplorationScreen', badge: null },
        ],
      },
    ],
  },
  {
    id: 'knowledge',
    title: '💡 Knowledge Hub',
    color: '#F5A623',
    cards: [
      {
        title: 'Create & Organize',
        subtitle: 'Your intellectual workspace',
        items: [
          { label: 'Idea Garden', screen: 'IdeaGardenScreen', badge: '12' },
          { label: 'Notes', screen: 'NotesScreen', badge: null },
          { label: 'Resources & Tools', screen: 'ResourcesToolsScreen', badge: null },
        ],
      },
    ],
  },
  {
    id: 'wellness',
    title: '🌱 Personal Wellness',
    color: '#7ED321',
    cards: [
      {
        title: 'Physical Health',
        subtitle: 'Body & energy',
        items: [
          { label: 'Nutrition', screen: 'NutritionScreen', badge: null },
          { label: 'Exercise & Movement', screen: 'ExerciseScreen', badge: null },
        ],
      },
      {
        title: 'Mental & Emotional',
        subtitle: 'Mind & spirit',
        items: [
          { label: 'Emotional Well-being', screen: 'WellbeingScreen', badge: null },
          { label: 'Self-care', screen: 'SelfCareScreen', badge: null },
          { label: 'Hobbies & Interests', screen: 'HobbiesScreen', badge: null },
        ],
      },
    ],
  },
  {
    id: 'connections',
    title: '🤝 Connections & Security',
    color: '#BD10E0',
    cards: [
      {
        title: 'Your Circle',
        subtitle: 'Relationships that matter',
        items: [
          { label: 'Relationships', screen: 'RelationshipsScreen', badge: null },
          { label: 'Network', screen: 'NetworkScreen', badge: null },
        ],
      },
      {
        title: 'Privacy & Safety',
        subtitle: 'Protect what matters',
        items: [
          { label: 'Privacy Settings', screen: 'PrivacyScreen', badge: null },
          { label: 'Security', screen: 'SecurityScreen', badge: null },
        ],
      },
    ],
  },
];

export default function LibraryScreen() {
  const navigation = useNavigation();
  const [expandedSections, setExpandedSections] = useState({
    academic: true,
    knowledge: false,
    wellness: false,
    connections: false,
  });

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Overview Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Library</Text>
        <Text style={styles.headerSubtitle}>
          Everything you need to grow and thrive
        </Text>
      </View>

      {/* Quick Stats - Optional, can be developed later */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Active Projects</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Ideas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
      </View>

      {/* Domain Sections */}
      {domainSections.map((section) => (
        <View key={section.id} style={styles.domainSection}>
          {/* Section Header */}
          <TouchableOpacity
            style={[styles.sectionHeader, { borderLeftColor: section.color }]}
            onPress={() => toggleSection(section.id)}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.expandIcon}>
              {expandedSections[section.id] ? '−' : '+'}
            </Text>
          </TouchableOpacity>

          {/* Cards in Section */}
          {expandedSections[section.id] && (
            <View style={styles.cardsContainer}>
              {section.cards.map((card, cardIndex) => (
                <View key={cardIndex} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{card.title}</Text>
                      <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.itemsContainer}>
                    {card.items.map((item, itemIndex) => (
                      <TouchableOpacity
                        key={itemIndex}
                        style={styles.item}
                        onPress={() => navigation.navigate(item.screen)}
                      >
                        <Text style={styles.itemText}>{item.label}</Text>
                        {item.badge && (
                          <View style={[styles.badge, { backgroundColor: section.color }]}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  domainSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  expandIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: '#999',
  },
  cardsContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  itemsContainer: {
    gap: 6,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  itemText: {
    fontSize: 15,
    color: '#333',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 20,
  },
});