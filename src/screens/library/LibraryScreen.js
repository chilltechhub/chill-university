// src/screens/LibraryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../api/supabaseClient';
import { LIFE_AREAS } from './LifeAreaScreen';

const { width } = Dimensions.get('window');

// Conversions for Roman Numerals to enhance the royal theme
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const LIBRARY_HUBS = [
  {
    id: 'academic',
    title: 'Grand Academic Wing',
    numeral: 'I',
    tagline: 'Execution, Projects & Career Archives',
    icon: 'school-outline',
    accent: '#800020', // Burgundy
    items: [
      { label: 'Projects Shelf', screen: 'ProjectsScreen', icon: 'folder-open-outline', desc: 'Active builds & active ventures', featured: true },
      { label: 'Portfolio Archives', screen: 'PortfolioScreen', icon: 'briefcase-outline', desc: 'Mastery & showcase' },
      { label: 'Research Vault', screen: 'ResearchScreen', icon: 'book-outline', desc: 'Deep dive studies' },
      { label: 'Career Expeditions', screen: 'CareerExplorationScreen', icon: 'compass-outline', desc: 'Professional horizons' },
    ],
  },
  {
    id: 'knowledge',
    title: 'Hall of Knowledge & Intel',
    numeral: 'II',
    tagline: 'Synthesis, Notes & Strategic Planning',
    icon: 'bulb-outline',
    accent: '#C5A059', // Brass Gold
    items: [
      { label: 'Academy Classes', screen: 'ClassesStack', icon: 'ribbon-outline', desc: 'Structured learning modules & coursework', featured: true },
      { label: 'Idea Garden', screen: 'IdeaGardenScreen', icon: 'leaf-outline', desc: 'Cultivate & seed thoughts' },
      { label: 'Notes Desk', screen: 'NotesScreen', icon: 'document-text-outline', desc: 'Quick entries & logs' },
      { label: 'Resources & Instruments', screen: 'ResourcesToolsScreen', icon: 'bookmark-outline', desc: 'Curated references & tools' },
      { label: 'Grand Planner', screen: 'PlannerScreen', icon: 'calendar-outline', desc: 'Agendas & key milestones' },
    ],
  },
];

export default function LibraryScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [projects, setProjects] = useState([]);

  const styles = makeStyles(c, t, s, r);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadAll(user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) loadAll(userId);
    }, [userId])
  );

  const loadAll = async (uid) => {
    try {
      const [areasRes, projRes] = await Promise.all([
        supabase.from('life_areas').select('*').eq('user_id', uid).order('sort_order'),
        supabase.from('projects').select('id,title,emoji,color,status').eq('user_id', uid).eq('status', 'active').limit(5),
      ]);
      if (areasRes.data) setLifeAreas(areasRes.data);
      if (projRes.data) setProjects(projRes.data);
    } catch (e) {
      console.warn('LibraryScreen load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefresh(true);
    if (userId) await loadAll(userId);
    setRefresh(false);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#C5A059" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C5A059" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Royal Header ── */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <Text style={styles.headerSubtitle}>ACADEMIA ARCHIVES</Text>
              <Text style={styles.bulletDivider}>•</Text>
              <Text style={styles.headerSubtitle}>EST. 2026</Text>
            </View>
            <Text style={styles.headerTitle}>Royal Library</Text>
          </View>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => navigation.navigate('CaptureInbox')}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            <Text style={styles.captureBtnText}>Inscribe</Text>
          </TouchableOpacity>
        </View>

        {/* ── Life Areas Section: Regal Leather Scrolls ── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#800020" />
              <Text style={styles.sectionTitle}>Life Area Domains</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('LifeAreaScreen')}>
              <Text style={styles.sectionAction}>Audit Deck →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
            {LIFE_AREAS.map((area, index) => {
              const saved = lifeAreas.find((a) => a.label?.toLowerCase() === area.label.toLowerCase());
              const rating = saved?.progress || 0;
              return (
                <TouchableOpacity
                  key={area.id}
                  style={styles.royalTomeCard}
                  onPress={() =>
                    navigation.navigate('LifeAreaScreen', {
                      areaId: area.id,
                      rating,
                      lastCheck: saved?.last_check_date || null,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <View style={styles.tomeTopBar}>
                    <Text style={styles.romanNumeral}>{ROMAN_NUMERALS[index] || 'I'}</Text>
                    <View style={[styles.statusDot, { backgroundColor: area.color || '#C5A059' }]} />
                  </View>
                  
                  <View style={styles.tomeInner}>
                    <View style={styles.sealCircle}>
                      <Text style={styles.areaEmoji}>{area.emoji}</Text>
                    </View>
                    <Text style={styles.areaLabel} numberOfLines={1}>
                      {area.label}
                    </Text>
                    
                    {/* Tier Level Dots */}
                    <View style={styles.ratingDotsRow}>
                      {[1, 2, 3, 4, 5].map((step) => (
                        <View
                          key={step}
                          style={[
                            styles.ratingDot,
                            step <= rating && { backgroundColor: area.color || '#C5A059' },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Active Endeavors (Banner Style) ── */}
        {projects.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="compass-outline" size={16} color="#800020" />
                <Text style={styles.sectionTitle}>Active Endeavors</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ProjectsScreen')}>
                <Text style={styles.sectionAction}>View All →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
              {projects.map((proj) => (
                <TouchableOpacity
                  key={proj.id}
                  style={styles.endeavorPill}
                  onPress={() => navigation.navigate('ProjectsScreen')}
                >
                  <View style={[styles.projColorIndicator, { backgroundColor: proj.color || '#C5A059' }]} />
                  <Text style={styles.projEmoji}>{proj.emoji || '📜'}</Text>
                  <Text style={styles.projTitle} numberOfLines={1}>
                    {proj.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Dynamic Library Hubs ── */}
        {LIBRARY_HUBS.map((hub) => (
          <View key={hub.id} style={styles.hubContainer}>
            <View style={styles.hubHeader}>
              <View style={[styles.hubBadge, { borderColor: hub.accent }]}>
                <Text style={[styles.hubNumeral, { color: hub.accent }]}>{hub.numeral}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hubTitle}>{hub.title}</Text>
                <Text style={styles.hubTagline}>{hub.tagline}</Text>
              </View>
            </View>

            {/* Asymmetric Grid (Featured item takes full width) */}
            <View style={styles.gridContainer}>
              {hub.items.map((item, idx) => {
                if (item.featured) {
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.featuredCard, { borderLeftColor: hub.accent }]}
                      onPress={() => navigation.navigate(item.screen)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.featuredBadge}>
                          <Text style={styles.featuredText}>PRIMARY WING</Text>
                        </View>
                        <Text style={styles.featuredLabel}>{item.label}</Text>
                        <Text style={styles.featuredDesc}>{item.desc}</Text>
                      </View>
                      <View style={[styles.featuredIconBg, { backgroundColor: `${hub.accent}12` }]}>
                        <Ionicons name={item.icon} size={24} color={hub.accent} />
                      </View>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.standardGridCard}
                    onPress={() => navigation.navigate(item.screen)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cardTopRow}>
                      <Ionicons name={item.icon} size={18} color="#0F1B29" />
                      <Ionicons name="arrow-forward" size={12} color="#C5A059" />
                    </View>
                    <Text style={styles.cardLabel}>{item.label}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c, t, s, r) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F5EE', // Cream Alabaster Light Mode
    },
    loading: {
      flex: 1,
      alignItems: 'center',
      justify: 'center',
      backgroundColor: '#F7F5EE',
    },
    scrollContent: {
      paddingBottom: 60,
      paddingTop: 54,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    bulletDivider: {
      fontSize: 10,
      color: '#C5A059',
    },
    headerSubtitle: {
      fontSize: 10,
      fontWeight: '800',
      color: '#C5A059',
      letterSpacing: 1.5,
    },
    headerTitle: {
      fontSize: 30,
      fontWeight: '800',
      color: '#0F1B29',
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    captureBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#800020',
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 20,
      shadowColor: '#800020',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 4,
    },
    captureBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    sectionContainer: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      justify: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: '#800020',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    sectionAction: {
      fontSize: 12,
      color: '#C5A059',
      fontWeight: '700',
    },
    carouselContainer: {
      paddingHorizontal: 20,
      gap: 12,
    },
    /* Royal Tome / Scroll Cards */
    royalTomeCard: {
      width: 115,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: '#E2DBD0',
      shadowColor: '#0F1B29',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    tomeTopBar: {
      flexDirection: 'row',
      justify: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    romanNumeral: {
      fontSize: 10,
      fontWeight: '800',
      color: '#C5A059',
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    tomeInner: {
      alignItems: 'center',
    },
    sealCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F7F5EE',
      alignItems: 'center',
      justify: 'center',
      borderWidth: 1,
      borderColor: '#E2DBD0',
      marginBottom: 8,
    },
    areaEmoji: {
      fontSize: 18,
    },
    areaLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#0F1B29',
      textAlign: 'center',
      marginBottom: 8,
    },
    ratingDotsRow: {
      flexDirection: 'row',
      gap: 4,
    },
    ratingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#E2DBD0',
    },
    /* Endeavors Pill */
    endeavorPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2DBD0',
    },
    projColorIndicator: {
      width: 4,
      height: 16,
      borderRadius: 2,
    },
    projEmoji: {
      fontSize: 14,
    },
    projTitle: {
      fontSize: 12,
      color: '#0F1B29',
      fontWeight: '600',
    },
    /* Hubs Styling */
    hubContainer: {
      paddingHorizontal: 20,
      marginBottom: 32,
    },
    hubHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    hubBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      alignItems: 'center',
      justify: 'center',
      backgroundColor: '#FFFFFF',
    },
    hubNumeral: {
      fontSize: 12,
      fontWeight: '800',
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    hubTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#0F1B29',
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    hubTagline: {
      fontSize: 11,
      color: '#6E7687',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    /* Featured Full-Width Card */
    featuredCard: {
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E2DBD0',
      borderLeftWidth: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justify: 'space-between',
      shadowColor: '#0F1B29',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    featuredBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#F7F5EE',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: '#E2DBD0',
    },
    featuredText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#C5A059',
      letterSpacing: 0.8,
    },
    featuredLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: '#0F1B29',
      marginBottom: 2,
    },
    featuredDesc: {
      fontSize: 12,
      color: '#6E7687',
    },
    featuredIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justify: 'center',
      marginLeft: 12,
    },
    /* Standard Half-Width Card */
    standardGridCard: {
      width: (width - 50) / 2,
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: '#E2DBD0',
      justify: 'space-between',
      shadowColor: '#0F1B29',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.02,
      shadowRadius: 4,
      elevation: 1,
    },
    cardTopRow: {
      flexDirection: 'row',
      justify: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    cardLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#0F1B29',
      marginBottom: 2,
    },
    cardDesc: {
      fontSize: 11,
      color: '#6E7687',
      lineHeight: 15,
    },
  });