// src/screens/library/ProjectsScreen.js
// Mission Control — space theme, real Supabase data

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, RefreshControl,
  Alert, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../api/supabaseClient';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all',            label: 'All Missions',     icon: 'planet-outline',              color: '#00F0FF' },
  { id: 'active',         label: 'Active Missions',  icon: 'rocket-outline',              color: '#00F0FF' },
  { id: 'completed',      label: 'Completed',        icon: 'checkmark-circle-outline',    color: '#00E676' },
  { id: 'idea',           label: 'Stargazer Ideas',  icon: 'bulb-outline',                color: '#FFB800' },
  { id: 'showcase',       label: 'Hall of Fame',     icon: 'trophy-outline',              color: '#FF4081' },
];

const PROJECT_TYPES = [
  '🔬 Science',  '💻 Coding',   '🎨 Art',      '📝 Writing',
  '💰 Business', '🏗️ DIY',     '📚 Research', '🎯 Personal',
  '✈️ Travel',   '🎵 Music',   '📊 Finance',  '🌱 Other',
];

const COLORS = [
  '#00F0FF','#c9a84c','#7C4DFF','#FF4081',
  '#00E676','#FFB800','#e07a30','#FF6B6B',
];

const EMOJIS = ['🚀','💡','🔬','🎨','💻','📝','🏗️','💰','🎯','🌟','⚡','🔥','🌙','🛸','🌊','🦋'];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ─── New Mission Modal ────────────────────────────────────────────────────────
function NewMissionModal({ visible, userId, onCreated, onClose }) {
  const [title,     setTitle]     = useState('');
  const [objective, setObjective] = useState('');
  const [emoji,     setEmoji]     = useState('🚀');
  const [color,     setColor]     = useState(COLORS[0]);
  const [type,      setType]      = useState('');
  const [saving,    setSaving]    = useState(false);

  const reset = () => {
    setTitle(''); setObjective(''); setEmoji('🚀');
    setColor(COLORS[0]); setType('');
  };

  const launch = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('projects').insert({
        user_id:      userId,
        title:        title.trim(),
        objective:    objective.trim() || null,
        emoji, color, cover_color: color, banner_emoji: emoji,
        category:     type || 'general',
        status:       'active',
        sort_order:   0,
      }).select().single();
      if (error) throw error;

      await supabase.from('project_milestones').insert({
        user_id: userId, project_id: data.id,
        title: '🚀 Mission launched', type: 'project_created',
        date: new Date().toISOString().split('T')[0],
      });

      onCreated(data);
      reset();
    } catch (e) {
      Alert.alert('Error', 'Could not create project');
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.sheetTitle}>🛸 Launch New Mission</Text>

          {/* Preview */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={[m.previewCircle, { backgroundColor: color + '22', borderColor: color }]}>
              <Text style={{ fontSize: 40 }}>{emoji}</Text>
            </View>
            <Text style={[m.previewName, { color }]}>{title || 'Mission Name'}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
            <TextInput style={[m.input, { borderColor: color }]}
              value={title} onChangeText={setTitle}
              placeholder="Mission name..." placeholderTextColor="#626D82"
              autoFocus />
            <TextInput style={[m.input, { borderColor: '#1F263E', minHeight: 60, textAlignVertical: 'top' }]}
              value={objective} onChangeText={setObjective}
              placeholder="Mission objective (optional)" placeholderTextColor="#626D82"
              multiline />

            <Text style={m.label}>MISSION ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {EMOJIS.map(em => (
                  <TouchableOpacity key={em} onPress={() => setEmoji(em)}
                    style={[m.emojiBtn, emoji === em && { borderColor: color, backgroundColor: color + '22' }]}>
                    <Text style={{ fontSize: 22 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={m.label}>MISSION COLOR</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {COLORS.map(col => (
                <TouchableOpacity key={col} onPress={() => setColor(col)}
                  style={[m.colorDot, { backgroundColor: col }, color === col && m.colorDotSel]} />
              ))}
            </View>

            <Text style={m.label}>MISSION TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {PROJECT_TYPES.map(pt => (
                  <TouchableOpacity key={pt} onPress={() => setType(pt)}
                    style={[m.typeChip, type === pt && { borderColor: color, backgroundColor: color + '22' }]}>
                    <Text style={[m.typeText, type === pt && { color }]}>{pt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity onPress={() => { reset(); onClose(); }} style={m.cancelBtn}>
                <Text style={{ color: '#8E9BB0', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={launch} disabled={!title.trim() || saving}
                style={[m.launchBtn, { backgroundColor: color, opacity: (!title.trim() || saving) ? 0.5 : 1 }]}>
                {saving ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={{ color: '#000', fontWeight: '800', fontSize: 15 }}>🚀 Launch</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const m = StyleSheet.create({
  sheet:       { backgroundColor: '#0B0D17', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, maxHeight: '92%', borderTopWidth: 1, borderColor: '#1F263E' },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: '#1F263E', alignSelf: 'center', marginBottom: 20 },
  sheetTitle:  { color: '#FFF', fontSize: 20, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  previewCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  previewName: { fontSize: 15, fontWeight: '700' },
  input:       { backgroundColor: '#141829', borderRadius: 10, padding: 14, fontSize: 15, color: '#FFF', borderWidth: 1 },
  label:       { color: '#626D82', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 },
  emojiBtn:    { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', backgroundColor: '#141829' },
  colorDot:    { width: 32, height: 32, borderRadius: 16 },
  colorDotSel: { borderWidth: 3, borderColor: '#FFF' },
  typeChip:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#1F263E', backgroundColor: '#141829' },
  typeText:    { color: '#8E9BB0', fontSize: 12 },
  cancelBtn:   { flex: 1, backgroundColor: '#141829', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1F263E' },
  launchBtn:   { flex: 2, borderRadius: 10, padding: 14, alignItems: 'center' },
});

// ─── Project card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onPress, onFavorite }) {
  const color = project.color || '#00F0FF';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={pc.card}>
      {/* Left thumbnail strip */}
      <View style={[pc.strip, { backgroundColor: color + '22', borderRightColor: color }]}>
        <Text style={{ fontSize: 28 }}>{project.emoji || '🚀'}</Text>
      </View>

      {/* Content */}
      <View style={pc.content}>
        <View style={pc.topRow}>
          {project.category && project.category !== 'general' && (
            <View style={[pc.typeBadge, { backgroundColor: color + '18', borderColor: color + '55' }]}>
              <Text style={[pc.typeText, { color }]}>{project.category}</Text>
            </View>
          )}
          <Text style={pc.date}>{timeAgo(project.updated_at || project.created_at)}</Text>
        </View>

        <Text style={pc.title} numberOfLines={1}>{project.title}</Text>
        {project.objective && (
          <Text style={pc.objective} numberOfLines={1}>{project.objective}</Text>
        )}

        <View style={pc.actions}>
          <TouchableOpacity onPress={onPress}
            style={[pc.enterBtn, { backgroundColor: color + '18', borderColor: color + '44' }]}>
            <Ionicons name="play" size={11} color={color} />
            <Text style={[pc.enterText, { color }]}>Enter Command</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => onFavorite(project)}>
              <Ionicons name={project.is_favorite ? 'star' : 'star-outline'} size={18} color="#FFB800" />
            </TouchableOpacity>
            <Ionicons name="share-social-outline" size={18} color="#626D82" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const pc = StyleSheet.create({
  card:      { flexDirection: 'row', backgroundColor: '#141829', borderRadius: 14, borderWidth: 1, borderColor: '#1F263E', marginBottom: 12, overflow: 'hidden' },
  strip:     { width: 72, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1 },
  content:   { flex: 1, padding: 12 },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  typeText:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  date:      { color: '#626D82', fontSize: 10 },
  title:     { color: '#FFF', fontSize: 15, fontWeight: 'bold', marginBottom: 3 },
  objective: { color: '#8E9BB0', fontSize: 11, marginBottom: 10, lineHeight: 15 },
  actions:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  enterBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1 },
  enterText: { fontSize: 11, fontWeight: '700' },
});

// ─── Main ProjectsScreen ──────────────────────────────────────────────────────
export default function ProjectsScreen() {
  const navigation = useNavigation();
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [showNew,    setShowNew]    = useState(false);
  const [search,     setSearch]     = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { if (userId) load(userId); }, [userId]));

  const load = async (uid) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('projects').select('*').eq('user_id', uid)
        .order('updated_at', { ascending: false });
      if (data) setProjects(data);
    } catch (e) { console.warn('ProjectsScreen', e); }
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); if (userId) await load(userId); setRefreshing(false); };

  const toggleFavorite = async (proj) => {
    const val = !proj.is_favorite;
    setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, is_favorite: val } : p));
    await supabase.from('projects').update({ is_favorite: val }).eq('id', proj.id);
  };

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all'       ? true
      : filter === 'active'    ? p.status === 'active'
      : filter === 'completed' ? p.status === 'completed'
      : filter === 'idea'      ? p.status === 'idea'
      : filter === 'showcase'  ? p.is_showcase
      : true;
    return matchSearch && matchFilter;
  });

  const hero    = projects.find(p => p.status === 'active');
  const favs    = projects.filter(p => p.is_favorite);
  const active  = projects.filter(p => p.status === 'active').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0D17' }}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>MISSION CONTROL</Text>
          <Text style={s.headerTitle}>Projects Command</Text>
        </View>
        <TouchableOpacity style={s.launchBtn} onPress={() => setShowNew(true)}>
          <Ionicons name="add-circle" size={18} color="#000" />
          <Text style={s.launchText}>Launch Project</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={15} color="#626D82" style={{ marginRight: 8 }} />
        <TextInput style={s.searchInput}
          value={search} onChangeText={setSearch}
          placeholder="Search missions..." placeholderTextColor="#626D82" />
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#00F0FF" /> : (
        <ScrollView showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00F0FF" />}
          contentContainerStyle={{ paddingBottom: 60 }}>

          {/* Hero — Continue Mission */}
          {hero && filter === 'all' && !search && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>⚡ CONTINUE MISSION</Text>
              <TouchableOpacity
                style={s.heroCard}
                onPress={() => navigation.navigate('ProjectDetail', { project: hero })}
                activeOpacity={0.88}>
                {/* Color gradient top */}
                <View style={[s.heroBanner, { backgroundColor: (hero.color || '#00F0FF') + '33', borderBottomColor: (hero.color || '#00F0FF') + '55' }]}>
                  <Text style={{ fontSize: 48 }}>{hero.emoji || '🚀'}</Text>
                </View>
                <View style={s.heroBody}>
                  <View style={s.heroTopRow}>
                    <View style={[s.heroBadge, { borderColor: hero.color || '#00F0FF', backgroundColor: (hero.color || '#00F0FF') + '18' }]}>
                      <Text style={[s.heroBadgeText, { color: hero.color || '#00F0FF' }]}>
                        {hero.category || 'ACTIVE'}
                      </Text>
                    </View>
                    <Text style={s.heroMeta}>Updated {timeAgo(hero.updated_at)}</Text>
                  </View>
                  <Text style={s.heroTitle}>{hero.title}</Text>
                  {hero.objective && (
                    <Text style={s.heroObj} numberOfLines={2}>{hero.objective}</Text>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
                    <View style={[s.enterBtn, { backgroundColor: (hero.color || '#00F0FF') + '22', borderColor: hero.color || '#00F0FF' }]}>
                      <Ionicons name="play" size={12} color={hero.color || '#00F0FF'} />
                      <Text style={[s.enterText, { color: hero.color || '#00F0FF' }]}>Enter Command Center</Text>
                    </View>
                    <Ionicons name={hero.is_favorite ? 'star' : 'star-outline'} size={18} color="#FFB800" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Category filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catBar}>
            {CATEGORIES.map(cat => {
              const isAct = filter === cat.id;
              return (
                <TouchableOpacity key={cat.id} onPress={() => setFilter(cat.id)}
                  style={[s.catChip, isAct && { borderColor: cat.color }]}>
                  <Ionicons name={cat.icon} size={15} color={isAct ? cat.color : '#8E9BB0'} />
                  <Text style={[s.catText, isAct && { color: '#FFF', fontWeight: '700' }]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Stats row */}
          {filter === 'all' && !search && (
            <View style={s.statsRow}>
              {[
                { label: 'TOTAL', val: projects.length,                            color: '#00F0FF' },
                { label: 'ACTIVE', val: active,                                    color: '#00E676' },
                { label: 'COMPLETE', val: projects.filter(p=>p.status==='completed').length, color: '#FFB800' },
                { label: 'STARRED', val: favs.length,                              color: '#FF4081' },
              ].map(st => (
                <View key={st.label} style={s.statCard}>
                  <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Projects list */}
          <View style={s.section}>
            {filter !== 'all' || search ? (
              <Text style={s.sectionLabel}>🛰️ {filtered.length} MISSION{filtered.length !== 1 ? 'S' : ''}</Text>
            ) : (
              <Text style={s.sectionLabel}>🛰️ ALL FLEET ({filtered.length})</Text>
            )}

            {filtered.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🛸</Text>
                <Text style={s.emptyTitle}>{search ? 'No missions found' : 'No missions yet'}</Text>
                <Text style={s.emptyText}>{search ? 'Try a different search' : 'Tap Launch Project to begin'}</Text>
              </View>
            ) : (
              filtered.map(proj => (
                <ProjectCard key={proj.id} project={proj}
                  onPress={() => navigation.navigate('ProjectDetail', { project: proj })}
                  onFavorite={toggleFavorite}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}

      <NewMissionModal
        visible={showNew} userId={userId}
        onCreated={(proj) => {
          setProjects(prev => [proj, ...prev]);
          setShowNew(false);
          navigation.navigate('ProjectDetail', { project: proj });
        }}
        onClose={() => setShowNew(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerSub:   { color: '#00F0FF', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  launchBtn:   { backgroundColor: '#00F0FF', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, gap: 6 },
  launchText:  { color: '#000', fontWeight: '800', fontSize: 13 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141829', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#1F263E', marginBottom: 16 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#FFF' },
  section:     { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel:{ color: '#626D82', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  heroCard:    { backgroundColor: '#141829', borderRadius: 16, borderWidth: 1, borderColor: '#1F263E', overflow: 'hidden' },
  heroBanner:  { height: 100, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1 },
  heroBody:    { padding: 16 },
  heroTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroBadge:   { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  heroBadgeText:{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  heroMeta:    { color: '#626D82', fontSize: 11 },
  heroTitle:   { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  heroObj:     { color: '#8E9BB0', fontSize: 13, lineHeight: 18 },
  enterBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  enterText:   { fontSize: 12, fontWeight: '700' },
  catBar:      { paddingLeft: 20, marginBottom: 16 },
  catChip:     { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#141829', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#1F263E' },
  catText:     { color: '#8E9BB0', fontSize: 12 },
  statsRow:    { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard:    { flex: 1, backgroundColor: '#141829', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1F263E' },
  statVal:     { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel:   { color: '#626D82', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyTitle:  { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  emptyText:   { color: '#626D82', fontSize: 14 },
});
