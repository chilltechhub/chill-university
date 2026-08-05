// src/screens/LibraryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../api/supabaseClient';
import { LIFE_AREAS } from './LifeAreaScreen';

// ─── All library sections ─────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'academic',
    title: '🎓 Academic & Career',
    subtitle: 'Build your future',
    items: [
      { label: 'Your Projects', screen: 'ProjectsScreen',        icon: 'rocket-outline',       desc: 'Ideas you are actively building' },
      { label: 'Labs',          screen: 'LabsScreen',             icon: 'flask-outline',         desc: 'Experiments and sandboxes' },
      { label: 'Portfolio',     screen: 'PortfolioScreen',        icon: 'briefcase-outline',     desc: 'Your work and achievements' },
      { label: 'Research',      screen: 'ResearchScreen',         icon: 'search-outline',        desc: 'Topics you are digging into' },
      { label: 'Career',        screen: 'CareerExplorationScreen',icon: 'trending-up-outline',   desc: 'Jobs, paths and opportunities' },
      { label: 'Discover',      screen: 'DiscoverScreen',         icon: 'compass-outline',       desc: 'Community projects and people', highlight: true },
    ],
  },
  {
    id: 'knowledge',
    title: '💡 Knowledge Hub',
    subtitle: 'Capture and organize everything',
    items: [
      { label: 'Idea Garden',        screen: 'IdeaGardenScreen',    icon: 'leaf-outline',          desc: 'Plant and grow your ideas' },
      { label: 'Notes',              screen: 'NotesScreen',          icon: 'document-text-outline', desc: 'Quick notes and thoughts' },
      { label: 'Resources & Tools',  screen: 'ResourcesToolsScreen', icon: 'link-outline',          desc: 'Saved links and tools' },
      { label: 'Classes',            screen: 'ClassesStack',         icon: 'school-outline',        desc: 'Learn any subject', highlight: true },
      { label: 'Planner', screen: 'PlannerScreen', icon: 'book-outline', desc: 'Daily, weekly & monthly agenda' },
    ],
  },
  {
    id: 'wellness',
    title: '❤️ Wellness',
    subtitle: 'Mind and body',
    items: [
      { label: 'Nutrition',   screen: 'NutritionScreen',  icon: 'nutrition-outline',    desc: 'Food and eating habits' },
      { label: 'Exercise',    screen: 'ExerciseScreen',   icon: 'barbell-outline',      desc: 'Movement and workouts' },
      { label: 'Well-being',  screen: 'WellbeingScreen',  icon: 'heart-outline',        desc: 'Emotions and mental health' },
      { label: 'Self-care',   screen: 'SelfCareScreen',   icon: 'sparkles-outline',     desc: 'Daily self-care practices' },
      { label: 'Hobbies',     screen: 'HobbiesScreen',    icon: 'color-palette-outline',desc: 'Things you love doing' },
    ],
  },
  {
    id: 'connections',
    title: '🤝 Connections',
    subtitle: 'People and relationships',
    items: [
      { label: 'Relationships', screen: 'RelationshipsScreen', icon: 'people-outline',         desc: 'Family and close friends' },
      { label: 'Network',       screen: 'NetworkScreen',       icon: 'git-network-outline',    desc: 'Professional connections' },
      { label: 'Privacy',       screen: 'PrivacyScreen',       icon: 'lock-closed-outline',    desc: 'Your data and privacy' },
      { label: 'Security',      screen: 'SecurityScreen',      icon: 'shield-checkmark-outline',desc: 'Account security' },
    ],
  },
];

export default function LibraryScreen() {
  const navigation  = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();

  const [userId,    setUserId]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefresh]   = useState(false);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [expanded,  setExpanded]  = useState({ academic: true, knowledge: false, wellness: false, connections: false });
  const [areaIdx,   setAreaIdx]   = useState(0);

  const styles = makeStyles(c, t, s, r, sh);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadAll(user.id); }
      else setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    if (userId) loadAll(userId);
  }, [userId]));

  const loadAll = async (uid) => {
    try {
      const [areasRes, projRes] = await Promise.all([
        supabase.from('life_areas').select('*').eq('user_id', uid).order('sort_order'),
        supabase.from('projects').select('id,title,emoji,color,status').eq('user_id', uid).eq('status','active').limit(6),
      ]);
      if (areasRes.data) setLifeAreas(areasRes.data);
      if (projRes.data)  setProjects(projRes.data);
    } catch (e) { console.warn('LibraryScreen', e); }
    setLoading(false);
  };

  const onRefresh = async () => { setRefresh(true); if (userId) await loadAll(userId); setRefresh(false); };

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (loading) return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={c.gold} />
    </View>
  );

  const areaDef   = LIFE_AREAS[areaIdx];
  const savedArea = lifeAreas.find(a => a.label?.toLowerCase() === areaDef?.label?.toLowerCase());
  const areaRating = savedArea?.progress || 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerDay}>Your</Text>
            <Text style={styles.headerTitle}>Library ✦</Text>
          </View>
          <TouchableOpacity
            style={styles.inboxBtn}
            onPress={() => navigation.navigate('CaptureInbox')}
          >
            <Ionicons name="add-circle" size={28} color={c.teal} />
            <Text style={styles.inboxLabel}>Capture</Text>
          </TouchableOpacity>
        </View>

        {/* ── Life Areas ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>Life Areas</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LifeAreaScreen', { areaId: areaDef?.id, rating: areaRating })}>
              <Text style={styles.sectionAction}>Weekly check-in →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
              {LIFE_AREAS.map((area, i) => {
                const saved  = lifeAreas.find(a => a.label?.toLowerCase() === area.label.toLowerCase());
                const rating = saved?.progress || 0;
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[styles.areaChip, { borderTopColor: area.color }]}
                    onPress={() => navigation.navigate('LifeAreaScreen', { areaId: area.id, rating, lastCheck: saved?.last_check_date || null, linkedItems: [] })}
                  >
                    <Text style={styles.areaEmoji}>{area.emoji}</Text>
                    <Text style={styles.areaName}>{area.label}</Text>
                    <View style={styles.areaBar}>
                      <View style={[styles.areaFill, { width: `${(rating/5)*100}%`, backgroundColor: area.color }]} />
                    </View>
                    <Text style={[styles.areaRating, { color: area.color }]}>{rating || '—'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* ── Active Projects snapshot ── */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>Active Projects</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProjectsScreen')}>
                <Text style={styles.sectionAction}>See all →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -s.lg }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm }}>
                {projects.map(proj => (
                  <TouchableOpacity
                    key={proj.id}
                    style={[styles.projCard, { borderLeftColor: proj.color || c.teal }]}
                    onPress={() => navigation.navigate('ProjectsScreen')}
                  >
                    <Text style={{ fontSize: 22 }}>{proj.emoji || '🚀'}</Text>
                    <Text style={styles.projTitle} numberOfLines={2}>{proj.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Browse Shelves ── */}
        <View style={[styles.section, { marginBottom: 4 }]}>
          <Text style={styles.sectionLabel}>Browse Shelves</Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.id} style={styles.shelf}>
            {/* Shelf header */}
            <TouchableOpacity
              style={styles.shelfHead}
              onPress={() => toggle(section.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.shelfTitle}>{section.title}</Text>
                <Text style={styles.shelfSub}>{section.subtitle}</Text>
              </View>
              <Ionicons
                name={expanded[section.id] ? 'chevron-up' : 'chevron-down'}
                size={16} color={c.text3}
              />
            </TouchableOpacity>

            {/* Shelf items */}
            {expanded[section.id] && (
              <View style={styles.shelfBody}>
                {section.items.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.shelfItem, item.highlight && styles.shelfItemHL]}
                    onPress={() => navigation.navigate(item.screen)}
                  >
                    <View style={[styles.shelfIcon, { backgroundColor: item.highlight ? c.tealLight : c.bg2 }]}>
                      <Ionicons name={item.icon} size={16} color={item.highlight ? c.teal : c.text3} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.shelfItemLabel, item.highlight && { color: c.teal }]}>
                        {item.label}
                      </Text>
                      <Text style={styles.shelfItemDesc}>{item.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={c.text4} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: c.bg0 },
  loading:        { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg0 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: s.lg, paddingTop: s.xl, backgroundColor: c.headerBg, borderBottomWidth: 1, borderBottomColor: c.border },
  headerDay:      { fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle:    { fontSize: t.xxl, fontWeight: t.bold, color: c.text1 },
  inboxBtn:       { alignItems: 'center', gap: 2 },
  inboxLabel:     { fontSize: 9, color: c.teal, textTransform: 'uppercase', letterSpacing: 0.8 },
  section:        { paddingHorizontal: s.lg, paddingTop: s.xl, marginBottom: s.sm },
  sectionHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.md },
  sectionLabel:   { fontSize: t.xs, fontWeight: t.semibold, color: c.gold, textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionAction:  { fontSize: t.xs, color: c.teal },
  areaChip:       { width: 82, backgroundColor: c.bg1, borderRadius: r.md, padding: s.sm + 2, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 3, alignItems: 'center', gap: 4 },
  areaEmoji:      { fontSize: 18 },
  areaName:       { fontSize: 9, fontWeight: t.bold, color: c.text1, textAlign: 'center' },
  areaBar:        { width: '100%', height: 2, backgroundColor: c.bg2, borderRadius: 1, overflow: 'hidden' },
  areaFill:       { height: 2, borderRadius: 1 },
  areaRating:     { fontSize: 11, fontWeight: t.bold },
  projCard:       { width: 120, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, gap: 6 },
  projTitle:      { fontSize: t.xs, fontWeight: t.semibold, color: c.text1, lineHeight: 16 },
  shelf:          { marginBottom: 2 },
  shelfHead:      { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg1, paddingVertical: s.md, paddingHorizontal: s.lg, borderLeftWidth: 3, borderLeftColor: c.teal, borderBottomWidth: 0.5, borderBottomColor: c.border },
  shelfTitle:     { fontSize: t.sm, fontWeight: t.semibold, color: c.text1 },
  shelfSub:       { fontSize: 10, color: c.text3, marginTop: 1 },
  shelfBody:      { backgroundColor: c.bg0, paddingVertical: s.xs },
  shelfItem:      { flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: s.sm + 2, paddingHorizontal: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border },
  shelfItemHL:    { backgroundColor: c.tealLight + '55' },
  shelfIcon:      { width: 32, height: 32, borderRadius: r.sm, alignItems: 'center', justifyContent: 'center' },
  shelfItemLabel: { fontSize: t.sm, fontWeight: t.medium, color: c.text1 },
  shelfItemDesc:  { fontSize: t.xs, color: c.text3, marginTop: 1 },
});
