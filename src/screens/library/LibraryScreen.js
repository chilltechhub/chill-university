// src/screens/library/LibraryScreen.js
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useUserProgress } from '../../../context/UserProgressContext';
import { supabase } from '../../api/supabaseClient';
import { LIFE_AREAS } from './LifeAreaScreen';
import LevelRing from '../../components/LevelRing';
import PlayerMatchBackground from '../../components/PlayerMatchBackground';
import useCharacterLoadout from '../../logic/useCharacterLoadout';
import useSetting, { SETTING_KEYS } from '../../logic/useSetting';
import { FONTS } from '../../theme';
import TourSpot from '../../components/TourSpot';

const { width } = Dimensions.get('window');

const LIBRARY_HUBS = [
  {
    id: 'academic',
    title: 'The Lab',
    tagline: 'Execution, projects & career archives',
    icon: 'school-outline',
    accentKey: 'teal',
    items: [
      { label: 'The Workshop', screen: 'ProjectsScreen', icon: 'hammer-outline', desc: 'Blueprints, builds & shipped work', featured: true },
      { label: 'Portfolio Archives', screen: 'PortfolioScreen', icon: 'briefcase-outline', desc: 'Mastery & showcase' },
      { label: 'Research Vault', screen: 'ResearchScreen', icon: 'book-outline', desc: 'Deep dive studies' },
      { label: 'Career Expeditions', screen: 'CareerExplorationScreen', icon: 'compass-outline', desc: 'Professional horizons' },
    ],
  },
  {
    id: 'knowledge',
    title: 'The Library',
    tagline: 'Synthesis, notes & strategic planning',
    icon: 'bulb-outline',
    accentKey: 'gold',
    items: [
      { label: 'Academy Classes', screen: 'ClassesStack', icon: 'ribbon-outline', desc: 'Structured learning modules & coursework', featured: true },
      { label: 'Idea Garden', screen: 'IdeaGardenScreen', icon: 'leaf-outline', desc: 'Cultivate & seed thoughts' },
      { label: 'Notes Desk', screen: 'NotesScreen', icon: 'document-text-outline', desc: 'Quick entries & logs' },
      { label: 'Resources & Instruments', screen: 'ResourcesToolsScreen', icon: 'bookmark-outline', desc: 'Curated references & tools' },
      { label: 'Planner', screen: 'PlannerScreen', icon: 'calendar-outline', desc: 'Agendas & key milestones' },
    ],
  },
];

export default function LibraryScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { level, points, rank, streakDays } = useUserProgress();
  const { background: playerBackground } = useCharacterLoadout({ level, points, rank, streakDays });
  // Set from Settings → Appearance, not on this screen itself.
  const [bgMode] = useSetting(SETTING_KEYS.LIBRARY_BACKGROUND, 'plain');

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [areaQueue, setAreaQueue] = useState({});
  const [trophies, setTrophies] = useState([]);

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
      const todayStr = new Date().toISOString().split('T')[0];
      const [areasRes, trophyRes, agendaRes] = await Promise.all([
        supabase.from('life_areas').select('*').eq('user_id', uid).order('sort_order'),
        supabase.from('projects').select('id,title,emoji,color,updated_at').eq('user_id', uid).eq('status', 'completed').is('deleted_at', null).order('updated_at', { ascending: false }).limit(6),
        supabase.from('agenda_instances').select('area').eq('user_id', uid).eq('date', todayStr).eq('completed', false).eq('skipped', false),
      ]);
      if (areasRes.data) setLifeAreas(areasRes.data);
      if (trophyRes.data) setTrophies(trophyRes.data);

      // Today's remaining agenda items per life area, for the base-bubble dots.
      const queue = {};
      (agendaRes.data || []).forEach(row => { queue[row.area] = (queue[row.area] || 0) + 1; });
      setAreaQueue(queue);
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
        <ActivityIndicator size="large" color={c.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bgMode === 'player' && <PlayerMatchBackground background={playerBackground} />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.gold} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Library</Text>
          </View>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => navigation.navigate('CaptureInbox')}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.captureBtnText}>Capture</Text>
          </TouchableOpacity>
        </View>

        {/* ── Life areas ── */}
        <TourSpot id="library-life-areas">
        <View style={styles.sectionContainer}>
          <View style={styles.baseGrid}>
            {LIFE_AREAS.map((area) => {
              const saved = lifeAreas.find((a) => a.label?.toLowerCase() === area.label.toLowerCase());
              const rating = saved?.progress || 0;
              const queued = areaQueue[area.id] || 0;
              const areaColor = area.color || c.teal;
              return (
                <TouchableOpacity
                  key={area.id}
                  style={styles.bubbleWrap}
                  onPress={() =>
                    navigation.navigate('LifeAreaScreen', {
                      areaId: area.id,
                      rating,
                      lastCheck: saved?.last_check_date || null,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <LevelRing pct={(rating / 5) * 100} size={48} strokeWidth={3} color={areaColor} trackColor={c.bg2}>
                    <View style={[styles.bubble, { backgroundColor: areaColor + '1c' }]}>
                      <Text style={styles.areaEmoji}>{area.emoji}</Text>
                      {queued > 0 && (
                        <View style={[styles.bubbleDot, { backgroundColor: areaColor }]}>
                          <Text style={styles.bubbleDotText}>{queued}</Text>
                        </View>
                      )}
                    </View>
                  </LevelRing>
                  <Text style={styles.areaLabel} numberOfLines={1}>{area.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        </TourSpot>

        {/* ── Trophy Hall ── */}
        {trophies.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trophy Hall</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PortfolioScreen')}>
                <Text style={styles.sectionAction}>Portfolio →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
              {trophies.map((tr) => (
                <TouchableOpacity
                  key={tr.id}
                  style={styles.trophyCard}
                  onPress={() => navigation.navigate('PortfolioScreen')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.trophyIcon}>🏆</Text>
                  <Text style={styles.trophyTitle} numberOfLines={2}>{tr.emoji ? `${tr.emoji} ` : ''}{tr.title}</Text>
                  <Text style={styles.trophyDate}>
                    {tr.updated_at ? new Date(tr.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Shipped'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Library wings ── */}
        {LIBRARY_HUBS.map((hub, hIdx) => {
          const accent = c[hub.accentKey] || c.teal;
          return (
            <View key={hub.id} style={styles.hubContainer}>
              <View style={styles.hubHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hubTitle}>{hub.title}</Text>
                  <Text style={styles.hubTagline}>{hub.tagline}</Text>
                </View>
              </View>

              {/* Asymmetric grid — featured item takes full width */}
              <View style={styles.gridContainer}>
                {hub.items.map((item, idx) => {
                  if (item.featured) {
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.featuredCard, { borderLeftColor: accent }]}
                        onPress={() => navigation.navigate(item.screen)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.featuredLabel}>{item.label}</Text>
                          <Text style={styles.featuredDesc}>{item.desc}</Text>
                        </View>
                        <View style={[styles.featuredIconBg, { backgroundColor: accent + '18' }]}>
                          <Ionicons name={item.icon} size={24} color={accent} />
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
                        <Ionicons name={item.icon} size={18} color={c.text1} />
                        <Ionicons name="arrow-forward" size={12} color={accent} />
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
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c, t, s, r) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg0 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg0 },
    scrollContent: { paddingBottom: 60, paddingTop: 54 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: t.xxxl,
      fontFamily: FONTS.display,
      fontWeight: '800',
      color: c.text1,
    },
    captureBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.teal,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: r.xl,
    },
    captureBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    sectionContainer: { marginBottom: 28 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: FONTS.displaySemibold,
      fontWeight: '800',
      color: c.text1,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    sectionAction: { fontSize: 12, fontFamily: FONTS.mono, color: c.teal, fontWeight: '700' },
    carouselContainer: { paddingHorizontal: 20, gap: 12 },
    /* ── Life areas — small bubbles ── */
    baseGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      paddingHorizontal: 20,
      rowGap: 14,
      columnGap: 8,
    },
    bubbleWrap: { alignItems: 'center', width: 60 },
    bubble: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
    },
    bubbleDot: {
      position: 'absolute', top: -3, right: -3,
      minWidth: 14, height: 14, borderRadius: 7, paddingHorizontal: 3,
      alignItems: 'center', justifyContent: 'center',
    },
    bubbleDotText: { fontSize: 8, fontFamily: FONTS.mono, fontWeight: '800', color: '#fff' },
    areaEmoji: { fontSize: 16 },
    areaLabel: { fontSize: 9, fontWeight: '700', color: c.text1, textAlign: 'center', marginTop: 5 },
    /* ── Trophy Hall ── */
    trophyCard: {
      width: 130,
      backgroundColor: c.bg1, borderRadius: r.md, padding: 12,
      borderWidth: 0.5, borderColor: c.border, borderTopWidth: 2, borderTopColor: c.gold,
    },
    trophyIcon: { fontSize: 18, marginBottom: 6 },
    trophyTitle: { fontSize: 12, fontWeight: '700', color: c.text1, lineHeight: 16, marginBottom: 4 },
    trophyDate: { fontSize: 9, fontFamily: FONTS.mono, color: c.text4 },
    /* Wing (hub) styling */
    hubContainer: { paddingHorizontal: 20, marginBottom: 32 },
    hubHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    hubTitle: { fontSize: 17, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.text1 },
    hubTagline: { fontSize: 11, color: c.text3 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    /* Featured full-width card */
    featuredCard: {
      width: '100%',
      backgroundColor: c.bg1,
      borderRadius: r.lg,
      padding: 16,
      borderWidth: 0.5,
      borderColor: c.border,
      borderLeftWidth: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    featuredLabel: { fontSize: 15, fontWeight: '700', color: c.text1, marginBottom: 2 },
    featuredDesc: { fontSize: 12, color: c.text3 },
    featuredIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },
    /* Standard half-width card */
    standardGridCard: {
      width: (width - 50) / 2,
      backgroundColor: c.bg1,
      borderRadius: r.lg,
      padding: 12,
      borderWidth: 0.5,
      borderColor: c.border,
      justifyContent: 'space-between',
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardLabel: { fontSize: 13, fontWeight: '700', color: c.text1, marginBottom: 2 },
    cardDesc: { fontSize: 11, color: c.text3, lineHeight: 15 },
  });
