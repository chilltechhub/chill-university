// src/screens/library/projects.js
// The Workshop — a drafting-table blueprint. Same base-camp language as the
// Library home screen ("Your Base" / "Construction Yard"): a project is a
// "build" that moves from Blueprint → Building → Shipped, sketched here on
// graph paper instead of flat app cards.

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, RefreshControl,
  Alert, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { supabase } from '../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline } from '../../api/offlineCache';
import { FONTS } from '../../theme';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { useBlueprint, CornerTicks, Stamp, RulerBar } from './blueprint';
import TourSpot from '../../components/TourSpot';

// ─── Graph-paper backdrop ───────────────────────────────────────────────────
// Defined here rather than imported so this screen's background is visible in
// one place while we chase a device-only layering bug. (Which file a component
// lives in has no effect on how it renders — but keeping it local means one
// less thing to wonder about.)
//
// Two hard-won rules, do not undo either:
//  1. Plain Views, never react-native-svg. As an <Svg> this backdrop painted
//     OVER the header/search/build list on iOS regardless of JSX order or
//     zIndex, leaving a screen of blank graph paper. It looked fine on web the
//     whole time.
//  2. Real line widths (1/2pt), never StyleSheet.hairlineWidth — a hairline is
//     ~0.33pt on a 3x screen and vanishes against this pale palette.
const GRID_STEP = 17;      // px between minor rules
const GRID_MAJOR_EVERY = 5; // every 5th rule is heavy (85px)

function WorkshopGrid({ bp }) {
  const { width, height } = useWindowDimensions();
  const rows = Math.ceil(height / GRID_STEP) + 1;
  const cols = Math.ceil(width / GRID_STEP) + 1;

  // Every box below carries EXPLICIT pixel width/height. Nothing here may
  // rely on `left:0 + right:0` edge-stretching: inside an absolutely
  // positioned parent that has no resolved size of its own, native layout can
  // collapse such a child to zero width, which renders the whole grid
  // invisible on device while looking perfect on web.
  return (
    <View
      style={{
        position: 'absolute', top: 0, left: 0, width, height,
        backgroundColor: bp.paper, overflow: 'hidden',
      }}
      pointerEvents="none"
    >
      {Array.from({ length: rows }, (_, i) => {
        const major = i % GRID_MAJOR_EVERY === 0;
        return (
          <View
            key={`h${i}`}
            style={{
              position: 'absolute', left: 0, top: i * GRID_STEP,
              width, height: major ? 2 : 1,
              backgroundColor: major ? bp.gridMajor : bp.grid,
            }}
          />
        );
      })}
      {Array.from({ length: cols }, (_, i) => {
        const major = i % GRID_MAJOR_EVERY === 0;
        return (
          <View
            key={`v${i}`}
            style={{
              position: 'absolute', top: 0, left: i * GRID_STEP,
              height, width: major ? 2 : 1,
              backgroundColor: major ? bp.gridMajor : bp.grid,
            }}
          />
        );
      })}
    </View>
  );
}

const BUILD_TYPES = [
  '🔬 Science',  '💻 Coding',   '🎨 Art',      '📝 Writing',
  '💰 Business', '🏗️ DIY',     '📚 Research', '🎯 Personal',
  '✈️ Travel',   '🎵 Music',   '📊 Finance',  '🌱 Other',
];

const EMOJIS = ['🏗️','🔨','🧱','🧰','📐','🪛','📦','🛠️','💡','🚀','⚙️','🏠'];

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

function stageFor(project) {
  if (project.is_showcase) return { key: 'showcase', label: 'SHOWROOM' };
  if (project.status === 'completed') return { key: 'completed', label: 'SHIPPED' };
  if (project.status === 'idea') return { key: 'idea', label: 'BLUEPRINT' };
  return { key: 'active', label: 'BUILDING' };
}

// ─── New Build Modal ───────────────────────────────────────────────────────
function NewBuildModal({ visible, userId, bp, buildColors, onCreated, onClose, initialType }) {
  const s = makeModalStyles(bp);
  const { showEmojis } = useUIPrefs();
  const [title,     setTitle]     = useState('');
  const [objective, setObjective] = useState('');
  const [emoji,     setEmoji]     = useState('🏗️');
  const [color,     setColor]     = useState(buildColors[0]);
  const [type,      setType]      = useState(initialType || '');
  const [saving,    setSaving]    = useState(false);

  // A career (or any deep link) can land here with a build type already
  // chosen — sync it in whenever the sheet opens, not just on first mount.
  useEffect(() => {
    if (visible && initialType) setType(initialType);
  }, [visible, initialType]);

  const reset = () => {
    setTitle(''); setObjective(''); setEmoji('🏗️');
    setColor(buildColors[0]); setType(initialType || '');
  };

  const start = async () => {
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
        title: '🏗️ Build started', type: 'project_created',
        date: new Date().toISOString().split('T')[0],
      });

      onCreated(data);
      reset();
    } catch (e) {
      Alert.alert('Error', 'Could not start this build');
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'rgba(4,16,28,0.68)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetEyebrow}>NEW BUILD · DRAFT SHEET</Text>
          <Text style={s.sheetTitle}>{showEmojis ? '🏗️ ' : ''}Start a New Build</Text>

          {/* Preview */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={[s.previewBox, { backgroundColor: color + '18', borderColor: color }]}>
              <Text style={{ fontSize: 36 }}>{emoji}</Text>
            </View>
            <Text style={[s.previewName, { color }]}>{title || 'BUILD NAME'}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
            <TextInput style={[s.input, { borderColor: color }]}
              value={title} onChangeText={setTitle}
              placeholder="Build name..." placeholderTextColor={bp.ink3}
              autoFocus />
            <TextInput style={[s.input, { borderColor: bp.border, minHeight: 60, textAlignVertical: 'top' }]}
              value={objective} onChangeText={setObjective}
              placeholder="What are you building? (optional)" placeholderTextColor={bp.ink3}
              multiline />

            <Text style={s.label}>BUILD ICON</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {EMOJIS.map(em => (
                  <TouchableOpacity key={em} onPress={() => setEmoji(em)}
                    style={[s.emojiBtn, emoji === em && { borderColor: color, backgroundColor: color + '18' }]}>
                    <Text style={{ fontSize: 20 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={s.label}>BUILD COLOR</Text>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {buildColors.map(col => (
                <TouchableOpacity key={col} onPress={() => setColor(col)}
                  style={[s.colorSwatch, { backgroundColor: col }, color === col && s.colorSwatchSel]} />
              ))}
            </View>

            <Text style={s.label}>BUILD TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {BUILD_TYPES.map(pt => (
                  <TouchableOpacity key={pt} onPress={() => setType(pt)}
                    style={[s.typeChip, type === pt && { borderColor: color, backgroundColor: color + '18' }]}>
                    <Text style={[s.typeText, type === pt && { color }]}>{pt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity onPress={() => { reset(); onClose(); }} style={s.cancelBtn}>
                <Text style={{ color: bp.ink2, fontWeight: '700', fontFamily: FONTS.mono, fontSize: 12 }}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={start} disabled={!title.trim() || saving}
                style={[s.startBtn, { backgroundColor: color, opacity: (!title.trim() || saving) ? 0.5 : 1 }]}>
                {saving ? <ActivityIndicator color={bp.onStamp} size="small" />
                  : <Text style={{ color: bp.onStamp, fontWeight: '800', fontFamily: FONTS.mono, fontSize: 13, letterSpacing: 0.5 }}>{showEmojis ? '🏗️ ' : ''}START BUILDING</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeModalStyles = bp => StyleSheet.create({
  sheet:       { backgroundColor: bp.panel, borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 24, paddingBottom: 48, maxHeight: '92%', borderTopWidth: 1, borderColor: bp.border },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: bp.border, alignSelf: 'center', marginBottom: 16 },
  sheetEyebrow:{ color: bp.ink3, fontSize: 9, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 2, textAlign: 'center', marginBottom: 4 },
  sheetTitle:  { color: bp.ink, fontSize: 19, fontFamily: FONTS.displaySemibold, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  previewBox:  { width: 72, height: 72, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  previewName: { fontSize: 12, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 0.5 },
  input:       { backgroundColor: bp.paper, borderRadius: 4, padding: 14, fontSize: 15, color: bp.ink, borderWidth: 1 },
  label:       { color: bp.ink3, fontSize: 10, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 },
  emojiBtn:    { width: 40, height: 40, borderRadius: 5, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', backgroundColor: bp.paper },
  colorSwatch: { width: 30, height: 30, borderRadius: 4 },
  colorSwatchSel: { borderWidth: 3, borderColor: bp.ink },
  typeChip:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 4, borderWidth: 1, borderColor: bp.border, backgroundColor: bp.paper },
  typeText:    { color: bp.ink2, fontSize: 12 },
  cancelBtn:   { flex: 1, backgroundColor: bp.paper, borderRadius: 4, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: bp.border },
  startBtn:    { flex: 2, borderRadius: 4, padding: 14, alignItems: 'center' },
});

// ─── Build card ─────────────────────────────────────────────────────────────
function BuildCard({ project, bp, onPress, onFavorite, onDelete }) {
  const s = makeCardStyles(bp);
  const color = project.color || bp.accent;
  const stage = stageFor(project);
  const total = project.tasks?.total || 0;
  const done  = project.tasks?.done || 0;
  const pct   = total > 0 ? Math.round((done / total) * 100) : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[s.card, { borderLeftColor: color }]}>
      <View style={s.topRow}>
        <View style={[s.icon, { borderColor: color }]}>
          <Text style={{ fontSize: 19 }}>{project.emoji || '🏗️'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.badgeRow}>
            <Stamp label={stage.label} color={color} />
            {project.category && project.category !== 'general' && (
              <Text style={s.categoryText} numberOfLines={1}>{project.category}</Text>
            )}
            <Text style={s.date}>{timeAgo(project.updated_at || project.created_at)}</Text>
          </View>
          <Text style={s.title} numberOfLines={1}>{project.title}</Text>
          {project.objective ? (
            <Text style={s.objective} numberOfLines={1}>{project.objective}</Text>
          ) : null}
        </View>
      </View>

      {project.next_action ? (
        <View style={s.nextActionRow}>
          <Ionicons name="flag" size={11} color={color} />
          <Text style={[s.nextActionText, { color }]} numberOfLines={1}>{project.next_action}</Text>
        </View>
      ) : null}

      {total > 0 && (
        <View style={{ marginTop: 11 }}>
          <RulerBar pct={pct} color={color} bp={bp} />
          <Text style={s.progressText}>{done}/{total} TASKS · {pct}%</Text>
        </View>
      )}

      <View style={s.actions}>
        <View style={[s.outlineBtn, { borderColor: color }]}>
          <Ionicons name="hammer-outline" size={11} color={color} />
          <Text style={[s.outlineBtnText, { color }]}>ENTER WORKSHOP</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <TouchableOpacity onPress={() => onFavorite(project)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name={project.is_favorite ? 'star' : 'star-outline'} size={17} color={bp.stamp} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(project)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="trash-outline" size={17} color={bp.danger} />
          </TouchableOpacity>
          <Ionicons name="share-social-outline" size={17} color={bp.ink3} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const makeCardStyles = bp => StyleSheet.create({
  card:      { backgroundColor: bp.panel, borderRadius: 3, borderWidth: 1, borderColor: bp.border, borderLeftWidth: 3, marginBottom: 12, padding: 13 },
  topRow:    { flexDirection: 'row', gap: 11 },
  icon:      { width: 42, height: 42, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, backgroundColor: bp.paper },
  badgeRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  categoryText: { color: bp.ink3, fontSize: 10, flexShrink: 1 },
  date:      { color: bp.ink3, fontSize: 10, marginLeft: 'auto', fontFamily: FONTS.mono },
  title:     { color: bp.ink, fontSize: 14.5, fontWeight: '700', marginBottom: 2 },
  objective: { color: bp.ink2, fontSize: 12, lineHeight: 16 },
  progressText: { fontSize: 9.5, fontFamily: FONTS.mono, color: bp.ink3, marginTop: 5, letterSpacing: 0.4 },
  nextActionRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  nextActionText: { fontSize: 11, fontWeight: '700', flexShrink: 1 },
  actions:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 },
  outlineBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 3, paddingHorizontal: 9, paddingVertical: 5 },
  outlineBtnText: { fontSize: 10, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 0.3 },
});

// ─── Main ProjectsScreen ──────────────────────────────────────────────────────
export default function ProjectsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const bp = useBlueprint();
  const s = makeStyles(bp);
  const { showEmojis } = useUIPrefs();
  const buildColors = [bp.accent, bp.stamp, bp.approved, bp.violet, bp.draft, bp.ink2];

  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [showNew,    setShowNew]    = useState(false);
  const [search,     setSearch]     = useState('');

  const STAGES = [
    { id: 'all',       label: 'All Builds',   icon: 'apps-outline',              color: bp.accent },
    { id: 'active',    label: 'Building',     icon: 'hammer-outline',            color: bp.accent },
    { id: 'idea',      label: 'Blueprints',   icon: 'bulb-outline',              color: bp.draft },
    { id: 'completed', label: 'Shipped',      icon: 'checkmark-circle-outline',  color: bp.approved },
    { id: 'showcase',  label: 'Showroom',     icon: 'trophy-outline',            color: bp.stamp },
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { if (userId) load(userId); }, [userId]));

  // A deep link (e.g. Career Expeditions' "Start a build") can arrive with
  // a build type already chosen and ask us to jump straight to the sheet.
  useFocusEffect(useCallback(() => {
    if (route.params?.autoOpen) {
      setShowNew(true);
      navigation.setParams({ autoOpen: false });
    }
  }, [route.params?.autoOpen]));

  const load = async (uid) => {
    setLoading(true);
    const cacheKey = `projects_list_${uid}`;
    try {
      const cached = await cacheRead(cacheKey);
      if (cached) setProjects(cached);

      if (!(await isOnline())) { setLoading(false); return; }

      const { data } = await supabase
        .from('projects').select('*').eq('user_id', uid).is('deleted_at', null)
        .order('updated_at', { ascending: false });
      const list = data || [];
      let withTasks = [];
      if (list.length) {
        const ids = list.map(p => p.id);
        const { data: taskRows } = await supabase
          .from('project_tasks').select('project_id, completed').in('project_id', ids);
        const byProject = {};
        (taskRows || []).forEach(tk => {
          if (!byProject[tk.project_id]) byProject[tk.project_id] = { total: 0, done: 0 };
          byProject[tk.project_id].total += 1;
          if (tk.completed) byProject[tk.project_id].done += 1;
        });
        withTasks = list.map(p => ({ ...p, tasks: byProject[p.id] || null }));
        setProjects(withTasks);
      } else {
        setProjects([]);
      }
      await cacheWrite(cacheKey, withTasks);
    } catch (e) { console.warn('ProjectsScreen', e); }
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); if (userId) await load(userId); setRefreshing(false); };

  const toggleFavorite = async (proj) => {
    const val = !proj.is_favorite;
    setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, is_favorite: val } : p));
    await supabase.from('projects').update({ is_favorite: val }).eq('id', proj.id);
  };

  const deleteProject = (proj) => {
    Alert.alert('Delete this build?', `"${proj.title}" moves to Recently Deleted in the Capture Inbox, kept for 7 days before it's gone for good.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setProjects(prev => prev.filter(p => p.id !== proj.id));
        try {
          const { error } = await supabase.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', proj.id);
          if (error) throw error;
        } catch (e) {
          console.warn('delete project error', e);
          Alert.alert('Could not delete', 'Something went wrong — try again.');
          if (userId) load(userId);
        }
      }},
    ]);
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
  const heroTotal = hero?.tasks?.total || 0;
  const heroDone  = hero?.tasks?.done || 0;
  const heroPct   = heroTotal > 0 ? Math.round((heroDone / heroTotal) * 100) : null;

  return (
    <View style={s.screen}>
      <WorkshopGrid bp={bp} />

      {/* Pinned chrome — header, rule, and search stay put while the builds
          scroll beneath them. Kept OUTSIDE the ScrollView (rather than as
          sticky headers) so their layout never depends on scroll-content
          measurement. backgroundColor: 'transparent' on these layers is
          load-bearing: an opaque one would hide the grid behind it. */}
      <View style={{ zIndex: 1, backgroundColor: 'transparent' }}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen'))}
              style={{ padding: 2 }}
            >
              <Ionicons name="chevron-back" size={22} color={bp.accent} />
            </TouchableOpacity>
            <View>
              <Text style={s.headerSub}>DRAFTING TABLE</Text>
              <Text style={s.headerTitle}>The Workshop</Text>
            </View>
          </View>
          <TourSpot id="projects-add">
          <TouchableOpacity style={s.newBtn} onPress={() => setShowNew(true)}>
            <Ionicons name="add" size={15} color={bp.onStamp} />
            <Text style={s.newBtnText}>NEW BUILD</Text>
          </TouchableOpacity>
          </TourSpot>
        </View>
        <View style={s.headerRuleWrap}>
          <View style={s.headerRuleThick} />
          <View style={s.headerRuleThin} />
        </View>

        {/* Search */}
        <TourSpot id="projects-search">
        <View style={s.searchWrap}>
          <Ionicons name="search" size={15} color={bp.ink3} style={{ marginRight: 8 }} />
          <TextInput style={s.searchInput}
            value={search} onChangeText={setSearch}
            placeholder="Search builds..." placeholderTextColor={bp.ink3} />
        </View>
        </TourSpot>
      </View>

      <ScrollView
        style={{ flex: 1, zIndex: 1, backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={bp.accent} />}
        contentContainerStyle={{ paddingBottom: 60, backgroundColor: 'transparent' }}
      >

        {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={bp.accent} /> : (
          <>

            {/* Hero — Continue Building */}
            {hero && filter === 'all' && !search && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>SHEET 01 — CONTINUE BUILDING</Text>
                <TouchableOpacity
                  style={s.heroCard}
                  onPress={() => navigation.navigate('ProjectDetail', { project: hero })}
                  activeOpacity={0.88}>
                  <CornerTicks color={hero.color || bp.accent} />
                  <View style={s.heroTop}>
                    <View style={[s.emojiBox, { borderColor: hero.color || bp.accent, backgroundColor: (hero.color || bp.accent) + '14' }]}>
                      <Text style={{ fontSize: 26 }}>{hero.emoji || '🏗️'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.heroBadgeRow}>
                        <Stamp label={stageFor(hero).label} color={hero.color || bp.accent} />
                        <Text style={s.heroMeta}>UPD {timeAgo(hero.updated_at)}</Text>
                      </View>
                      <Text style={s.heroTitle}>{hero.title}</Text>
                    </View>
                  </View>
                  {hero.objective && (
                    <Text style={s.heroObj} numberOfLines={2}>{hero.objective}</Text>
                  )}
                  <View style={[s.heroNextRow, { borderColor: hero.next_action ? (hero.color || bp.accent) : bp.border, borderStyle: hero.next_action ? 'solid' : 'dashed' }]}>
                    <Ionicons name="flag" size={12} color={hero.next_action ? (hero.color || bp.accent) : bp.ink3} />
                    <Text style={[s.heroNextText, !hero.next_action && s.heroNextTextEmpty]} numberOfLines={1}>
                      {hero.next_action || 'No next action set — open the build to set one'}
                    </Text>
                  </View>
                  {heroTotal > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <RulerBar pct={heroPct} color={hero.color || bp.accent} bp={bp} height={11} />
                      <Text style={s.progressText}>{heroDone}/{heroTotal} TASKS DONE · {heroPct}%</Text>
                    </View>
                  )}
                  <View style={s.heroFooter}>
                    <View style={[s.outlineBtnLg, { borderColor: hero.color || bp.accent }]}>
                      <Ionicons name="hammer-outline" size={13} color={hero.color || bp.accent} />
                      <Text style={[s.outlineBtnLgText, { color: hero.color || bp.accent }]}>ENTER WORKSHOP</Text>
                    </View>
                    <Ionicons name={hero.is_favorite ? 'star' : 'star-outline'} size={18} color={bp.stamp} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Stage filter */}
            <TourSpot id="projects-list">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catBar}>
              {STAGES.map(stage => {
                const isAct = filter === stage.id;
                return (
                  <TouchableOpacity key={stage.id} onPress={() => setFilter(stage.id)}
                    style={[s.catChip, isAct && { borderColor: stage.color, backgroundColor: stage.color + '16' }]}>
                    <Ionicons name={stage.icon} size={14} color={isAct ? stage.color : bp.ink3} />
                    <Text style={[s.catText, isAct && { color: stage.color, fontWeight: '800' }]}>{stage.label.toUpperCase()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            </TourSpot>

            {/* Stats row */}
            {filter === 'all' && !search && (
              <View style={s.statsRow}>
                {[
                  { label: 'TOTAL', val: projects.length, color: bp.accent },
                  { label: 'BUILDING', val: active, color: bp.ink },
                  { label: 'SHIPPED', val: projects.filter(p=>p.status==='completed').length, color: bp.approved },
                  { label: 'STARRED', val: favs.length, color: bp.stamp },
                ].map(st => (
                  <View key={st.label} style={[s.statCard, { borderTopColor: st.color }]}>
                    <Text style={[s.statVal, { color: st.color }]}>{st.val}</Text>
                    <Text style={s.statLabel}>{st.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Builds list */}
            <View style={s.section}>
              {filter !== 'all' || search ? (
                <Text style={s.sectionLabel}>{filtered.length} BUILD{filtered.length !== 1 ? 'S' : ''} ON SHEET</Text>
              ) : (
                <Text style={s.sectionLabel}>ALL BUILDS ({filtered.length})</Text>
              )}

              {filtered.length === 0 ? (
                <View style={s.empty}>
                  {showEmojis ? <Text style={{ fontSize: 40, marginBottom: 12 }}>🧰</Text> : <Ionicons name="construct-outline" size={36} color={bp.ink2} style={{ marginBottom: 12 }} />}
                  <Text style={s.emptyTitle}>{search ? 'No builds found' : 'No builds yet'}</Text>
                  <Text style={s.emptyText}>{search ? 'Try a different search' : 'Tap New Build to start your first project'}</Text>
                </View>
              ) : (
                filtered.map(proj => (
                  <BuildCard key={proj.id} project={proj} bp={bp}
                    onPress={() => navigation.navigate('ProjectDetail', { project: proj })}
                    onFavorite={toggleFavorite}
                    onDelete={deleteProject}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <NewBuildModal
        visible={showNew} userId={userId} bp={bp} buildColors={buildColors}
        initialType={route.params?.presetType}
        onCreated={(proj) => {
          setProjects(prev => [{ ...proj, tasks: null }, ...prev]);
          setShowNew(false);
          navigation.navigate('ProjectDetail', { project: proj });
        }}
        onClose={() => setShowNew(false)}
      />
    </View>
  );
}

const makeStyles = bp => StyleSheet.create({
  screen:      { flex: 1, backgroundColor: bp.paper },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerSub:   { color: bp.ink3, fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 2, fontWeight: '800' },
  headerTitle: { color: bp.ink, fontSize: 26, fontFamily: FONTS.display, fontWeight: '800' },
  newBtn:      { backgroundColor: bp.stamp, flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 4, gap: 5 },
  newBtnText:  { color: bp.onStamp, fontWeight: '800', fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: 0.4 },
  headerRuleWrap: { marginHorizontal: 20, marginBottom: 16 },
  headerRuleThick: { height: 2, backgroundColor: bp.ink },
  headerRuleThin:  { height: 1, backgroundColor: bp.border, marginTop: 3 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: bp.panel, marginHorizontal: 20, borderRadius: 4, paddingHorizontal: 14, borderWidth: 1, borderColor: bp.border, marginBottom: 18 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: bp.ink },
  section:     { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel:{ color: bp.ink3, fontSize: 10.5, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  heroCard:    { backgroundColor: bp.panel, borderRadius: 4, borderWidth: 1, borderColor: bp.border, padding: 16 },
  heroTop:     { flexDirection: 'row', gap: 12, alignItems: 'center' },
  emojiBox:    { width: 54, height: 54, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  heroBadgeRow:{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 5 },
  heroMeta:    { color: bp.ink3, fontSize: 10, fontFamily: FONTS.mono, marginLeft: 'auto' },
  heroTitle:   { color: bp.ink, fontSize: 19, fontFamily: FONTS.display, fontWeight: '800' },
  heroObj:     { color: bp.ink2, fontSize: 13, lineHeight: 18, marginTop: 11 },
  heroNextRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: bp.paper },
  heroNextText: { flex: 1, color: bp.ink, fontSize: 12.5, fontWeight: '700' },
  heroNextTextEmpty: { color: bp.ink3, fontWeight: '600', fontStyle: 'italic' },
  progressText: { fontSize: 10, fontFamily: FONTS.mono, color: bp.ink3, marginTop: 6, letterSpacing: 0.4 },
  heroFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  outlineBtnLg:{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 3, paddingHorizontal: 11, paddingVertical: 7 },
  outlineBtnLgText: { fontSize: 11.5, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 0.4 },
  catBar:      { paddingLeft: 20, marginBottom: 16 },
  catChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: bp.panel, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 3, marginRight: 9, borderWidth: 1, borderColor: bp.border },
  catText:     { color: bp.ink3, fontSize: 10.5, fontFamily: FONTS.mono, letterSpacing: 0.4 },
  statsRow:    { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard:    { flex: 1, backgroundColor: bp.panel, borderRadius: 3, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: bp.border, borderTopWidth: 3 },
  statVal:     { fontSize: 20, fontFamily: FONTS.mono, fontWeight: '800', marginBottom: 2 },
  statLabel:   { color: bp.ink3, fontSize: 8.5, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 1 },
  empty:       { alignItems: 'center', paddingVertical: 56 },
  emptyTitle:  { color: bp.ink, fontSize: 17, fontWeight: 'bold', marginBottom: 6 },
  emptyText:   { color: bp.ink3, fontSize: 13 },
});
