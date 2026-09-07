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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { useUserProgress } from '../../../context/UserProgressContext';
import { supabase } from '../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline } from '../../api/offlineCache';
import { LIFE_AREAS } from './LifeAreaScreen';
import LevelRing from '../../components/LevelRing';
import PlayerMatchBackground from '../../components/PlayerMatchBackground';
import useCharacterLoadout from '../../logic/useCharacterLoadout';
import useSetting, { SETTING_KEYS } from '../../logic/useSetting';
import { FONTS } from '../../theme';
import TourSpot from '../../components/TourSpot';
import { todayStr } from '../../logic/dateUtils';

// Exported so onboarding's "Look & Layout" step (MultiStepOnboarding.js)
// and Settings' "Library Sections" editor share this exact list instead of
// keeping their own copy that could drift out of sync.
export const LIBRARY_HUBS = [
  {
    id: 'academic',
    title: 'The Lab',
    tagline: 'Execution, projects & career archives',
    icon: 'school-outline',
    accentKey: 'teal',
    items: [
      { label: 'The Workshop', screen: 'ProjectsScreen', icon: 'hammer-outline', desc: 'Blueprints, builds & shipped work', featured: true },
      { label: 'Portfolio Archives', screen: 'PortfolioScreen', icon: 'briefcase-outline', desc: 'Mastery & showcase' },
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
      // One entry, three former ones: Notes Desk, the Research Vault, and
      // Resources & Instruments were all reading and writing the same
      // `captures` rows, so they're now type filters inside one screen.
      { label: 'Knowledge Vault', screen: 'KnowledgeScreen', icon: 'library-outline', desc: 'Notes, bookmarks, papers & tools' },
      { label: 'Planner', screen: 'PlannerScreen', icon: 'calendar-outline', desc: 'Agendas & key milestones' },
      // Discover was a registered route with help copy and tour steps written
      // for it, but no entry point anywhere in the app — unreachable in a
      // shipped build until it was listed here.
      { label: 'Discover', screen: 'DiscoverScreen', icon: 'people-outline', desc: 'Breakthroughs, projects & mentors' },
    ],
  },
];

// ─── Add-life-area picker — the hidden ones from onboarding, addable later ──
function AddAreaModal({ visible, hidden, onAdd, onClose, c, t, s, r }) {
  const { showEmojis, showSubtext } = useUIPrefs();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, padding: s.xl, paddingBottom: 40, maxHeight: '75%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.lg }}>
            <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.text1 }}>Add a Life Area</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
          </View>
          {hidden.length === 0 ? (
            <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', paddingVertical: s.xl }}>
              All eight life areas are already showing.
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {hidden.map(area => (
                <TouchableOpacity
                  key={area.id}
                  onPress={() => onAdd(area.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}
                >
                  {showEmojis ? <Text style={{ fontSize: 22 }}>{area.emoji}</Text> : <Ionicons name={area.icon} size={20} color={area.color || c.teal} />}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>{area.label}</Text>
                    {showSubtext && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }} numberOfLines={1}>{area.subtitle}</Text>}
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={c.teal} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function LibraryScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const { level, points, rank, streakDays } = useUserProgress();
  const { background: playerBackground } = useCharacterLoadout({ level, points, rank, streakDays });
  // Set from Settings → Appearance, not on this screen itself.
  const [bgMode] = useSetting(SETTING_KEYS.LIBRARY_BACKGROUND, 'plain');
  // Set from Settings → Library Sections, or onboarding's Look & Layout step.
  const [hiddenSections] = useSetting(SETTING_KEYS.HIDDEN_LIBRARY_SECTIONS, []);

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [areaQueue, setAreaQueue] = useState({});
  const [trophies, setTrophies] = useState([]);
  const [activeAreaIds, setActiveAreaIds] = useState(null); // null = show all (no onboarding pick on file, or legacy account)
  const [showAddArea, setShowAddArea] = useState(false);

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
    const cacheKey = `library_hub_${uid}`;
    try {
      const cached = await cacheRead(cacheKey);
      if (cached) {
        setLifeAreas(cached.lifeAreas || []);
        setTrophies(cached.trophies || []);
        setActiveAreaIds(cached.activeAreaIds ?? null);
        setAreaQueue(cached.areaQueue || {});
      }

      if (!(await isOnline())) return; // cached hub is as current as we can get right now

      const today = todayStr();
      const [areasRes, trophyRes, agendaRes, profileRes] = await Promise.all([
        supabase.from('life_areas').select('*').eq('user_id', uid).order('sort_order'),
        supabase.from('projects').select('id,title,emoji,color,updated_at').eq('user_id', uid).eq('status', 'completed').is('deleted_at', null).order('updated_at', { ascending: false }).limit(6),
        supabase.from('agenda_instances').select('area').eq('user_id', uid).eq('date', today).eq('completed', false).eq('skipped', false),
        supabase.from('profiles').select('active_life_areas').eq('id', uid).maybeSingle(),
      ]);
      if (areasRes.data) setLifeAreas(areasRes.data);
      if (trophyRes.data) setTrophies(trophyRes.data);
      // An empty array means "picked zero on purpose" (still show all, since
      // an empty Library is worse than a slightly-too-full one) — only a
      // genuinely unset column (never onboarded through the picker, or a
      // pre-existing account) means "show everything".
      const picked = profileRes.data?.active_life_areas;
      const activeAreaIds = picked && picked.length > 0 ? picked : null;
      setActiveAreaIds(activeAreaIds);

      // Today's remaining agenda items per life area, for the base-bubble dots.
      const areaQueue = {};
      (agendaRes.data || []).forEach(row => { areaQueue[row.area] = (areaQueue[row.area] || 0) + 1; });
      setAreaQueue(areaQueue);

      await cacheWrite(cacheKey, {
        lifeAreas: areasRes.data || [],
        trophies: trophyRes.data || [],
        activeAreaIds,
        areaQueue,
      });
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

  const addArea = async (areaId) => {
    const next = [...(activeAreaIds || LIFE_AREAS.map(a => a.id)), areaId];
    setActiveAreaIds(next);
    setShowAddArea(false);
    if (userId) {
      const hidden = LIFE_AREAS.map(a => a.id).filter(id => !next.includes(id));
      await supabase.from('profiles').update({ active_life_areas: next, hidden_life_areas: hidden }).eq('id', userId);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={c.gold} />
      </View>
    );
  }

  const visibleAreas = activeAreaIds ? LIFE_AREAS.filter(a => activeAreaIds.includes(a.id)) : LIFE_AREAS;
  const hiddenAreas = activeAreaIds ? LIFE_AREAS.filter(a => !activeAreaIds.includes(a.id)) : [];

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
          <TourSpot id="library-capture">
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => navigation.navigate('CaptureInbox')}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.captureBtnText}>Capture</Text>
          </TouchableOpacity>
          </TourSpot>
        </View>

        {/* ── Life areas ── */}
        <TourSpot id="library-life-areas">
        <View style={styles.sectionContainer}>
          <View style={styles.baseGrid}>
            {visibleAreas.map((area) => {
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
                      {showEmojis ? <Text style={styles.areaEmoji}>{area.emoji}</Text> : <Ionicons name={area.icon} size={16} color={areaColor} />}
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
            {hiddenAreas.length > 0 && (
              <TouchableOpacity style={styles.bubbleWrap} onPress={() => setShowAddArea(true)} activeOpacity={0.85}>
                <View style={[styles.bubble, styles.addBubble]}>
                  <Ionicons name="add" size={20} color={c.text3} />
                </View>
                <Text style={styles.areaLabel} numberOfLines={1}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        </TourSpot>

        {/* ── Trophy Hall ── */}
        {trophies.length > 0 && (
          <TourSpot id="library-trophy-hall">
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
                  {showEmojis ? <Text style={styles.trophyIcon}>🏆</Text> : <Ionicons name="trophy-outline" size={16} color={c.gold} style={{ marginBottom: 6 }} />}
                  <Text style={styles.trophyTitle} numberOfLines={2}>{tr.emoji ? `${tr.emoji} ` : ''}{tr.title}</Text>
                  <Text style={styles.trophyDate}>
                    {tr.updated_at ? new Date(tr.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Shipped'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          </TourSpot>
        )}

        {/* ── Library wings ── */}
        {LIBRARY_HUBS.map((hub) => {
          const accent = c[hub.accentKey] || c.teal;
          const visibleItems = hub.items.filter(item => !hiddenSections.includes(item.screen));
          if (visibleItems.length === 0) return null;
          return (
            <View key={hub.id} style={styles.hubContainer}>
              <TourSpot id={`hub-section-${hub.id}`}>
              <View style={styles.hubHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hubTitle}>{hub.title}</Text>
                  {showSubtext && <Text style={styles.hubTagline}>{hub.tagline}</Text>}
                </View>
              </View>
              </TourSpot>

              {/* Asymmetric grid — featured item takes full width */}
              <View style={styles.gridContainer}>
                {visibleItems.map((item, idx) => {
                  if (item.featured) {
                    return (
                      <TourSpot key={idx} id={`hub-${item.screen}`} style={{ width: '100%' }}>
                        <TouchableOpacity
                          style={[styles.featuredCard, { borderLeftColor: accent }]}
                          onPress={() => navigation.navigate(item.screen)}
                          activeOpacity={0.8}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.featuredLabel}>{item.label}</Text>
                            {showSubtext && <Text style={styles.featuredDesc}>{item.desc}</Text>}
                          </View>
                          <View style={[styles.featuredIconBg, { backgroundColor: accent + '18' }]}>
                            <Ionicons name={item.icon} size={24} color={accent} />
                          </View>
                        </TouchableOpacity>
                      </TourSpot>
                    );
                  }

                  return (
                    <TourSpot key={idx} id={`hub-${item.screen}`} style={styles.standardGridSpot}>
                      <TouchableOpacity
                        style={styles.standardGridCard}
                        onPress={() => navigation.navigate(item.screen)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.cardTopRow}>
                          <Ionicons name={item.icon} size={18} color={c.text1} />
                          <Ionicons name="arrow-forward" size={12} color={accent} />
                        </View>
                        <Text style={styles.cardLabel}>{item.label}</Text>
                        {showSubtext && (
                          <Text style={styles.cardDesc} numberOfLines={2}>
                            {item.desc}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </TourSpot>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <AddAreaModal
        visible={showAddArea}
        hidden={hiddenAreas}
        onAdd={addArea}
        onClose={() => setShowAddArea(false)}
        c={c} t={t} s={s} r={r}
      />
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
    addBubble: {
      backgroundColor: c.bg2,
      borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed',
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
    /* Standard card — flexGrow/flexBasis, not a fixed width, so a lone
       leftover item (after hiding sections, or few Library sections
       overall) stretches to fill its row instead of sitting at a fixed
       half-width next to an empty gap. Two side by side still split ~evenly. */
    standardGridSpot: { flexGrow: 1, flexBasis: '46%' },
    standardGridCard: {
      flex: 1,
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
