// src/screens/library/PortfolioScreen.js
// Commander Portfolio — light/dark theme, auto-populated from Supabase

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Linking, Modal, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../api/supabaseClient';
import { useTheme } from '../../../context/ThemeContext';

// ─── Suit/badge maps ──────────────────────────────────────────────────────────
const SUIT_COLORS = {
  teal:'#2bb5a0',gold:'#c9a84c',purple:'#8b4fc4',
  red:'#e05858',blue:'#3a7bd5',green:'#3ac860',
  orange:'#e07a30',silver:'#9a9aa8',
};
const HELMET_EMOJI  = { classic:'🪖', visor:'⛑️', bubble:'🌐', stealth:'🕶️' };
const BADGE_EMOJI   = { explorer:'🧭', builder:'🏗️', scholar:'📚', guardian:'🛡️', pioneer:'🌟', creator:'🎨' };

const SECTIONS = [
  { key: 'projects',    label: 'Projects',    icon: 'rocket-outline',        accentKey: 'cyan'   },
  { key: 'skills',      label: 'Skills',      icon: 'flash-outline',         accentKey: 'gold'   },
  { key: 'experience',  label: 'Experience',  icon: 'briefcase-outline',     accentKey: 'green'  },
  { key: 'research',    label: 'Research',    icon: 'flask-outline',         accentKey: 'purple' },
  { key: 'passions',    label: 'Passions',    icon: 'color-palette-outline', accentKey: 'pink'   },
];

// ─── Add Item Modal ───────────────────────────────────────────────────────────
function AddModal({ visible, section, onAdd, onClose, th }) {
  const [title, setTitle] = useState('');
  const [desc,  setDesc]  = useState('');
  const [link,  setLink]  = useState('');
  const [tag,   setTag]   = useState('');
  const accent = th[section?.accentKey || 'cyan'];

  const reset = () => { setTitle(''); setDesc(''); setLink(''); setTag(''); onClose(); };

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), desc: desc.trim(), link: link.trim(), tag: tag.trim() || 'General' });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[mo.sheet, { backgroundColor: th.bg1, borderTopColor: accent + '44' }]}>
          <View style={[mo.handle, { backgroundColor: th.border }]} />
          <Text style={[mo.title, { color: th.text1 }]}>Add {section?.label} Entry</Text>
          {[
            { val: title, set: setTitle, ph: 'Title *', cap: 'words' },
            { val: tag,   set: setTag,   ph: 'Tag / Category', cap: 'words' },
            { val: link,  set: setLink,  ph: 'Link / URL (optional)', cap: 'none' },
          ].map((f, i) => (
            <TextInput key={i} style={[mo.input, { backgroundColor: th.bg2, borderColor: th.border, color: th.text1 }]}
              value={f.val} onChangeText={f.set}
              placeholder={f.ph} placeholderTextColor={th.text4}
              autoFocus={i === 0} autoCapitalize={f.cap} />
          ))}
          <TextInput style={[mo.input, { backgroundColor: th.bg2, borderColor: th.border, color: th.text1, height: 70, textAlignVertical: 'top' }]}
            value={desc} onChangeText={setDesc}
            placeholder="Description & achievements" placeholderTextColor={th.text4} multiline />
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
            <TouchableOpacity onPress={reset} style={[mo.cancelBtn, { backgroundColor: th.bg2, borderColor: th.border }]}>
              <Text style={{ color: th.text3, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={submit} disabled={!title.trim()}
              style={[mo.addBtn, { backgroundColor: accent, opacity: !title.trim() ? 0.5 : 1 }]}>
              <Text style={{ color: th.bg, fontWeight: '800' }}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const mo = StyleSheet.create({
  sheet:     { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 48, borderTopWidth: 1 },
  handle:    { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  title:     { fontSize: 17, fontWeight: 'bold', marginBottom: 16 },
  input:     { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, marginBottom: 10 },
  cancelBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1 },
  addBtn:    { flex: 2, borderRadius: 10, padding: 12, alignItems: 'center' },
});

// ─── Portfolio Item Card ──────────────────────────────────────────────────────
function ItemCard({ item, accent, onDelete, th }) {
  return (
    <View style={[ic.card, { backgroundColor: th.bg1, borderColor: th.border, borderLeftColor: accent }]}>
      <View style={ic.row}>
        <View style={[ic.tag, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
          <Text style={[ic.tagText, { color: accent }]}>{item.tag || 'General'}</Text>
        </View>
        {item.source && (
          <View style={[ic.tag, { backgroundColor: th.bg2, borderColor: th.border }]}>
            <Text style={[ic.tagText, { color: th.text4 }]}>{item.source}</Text>
          </View>
        )}
        {item.status && (
          <Text style={[ic.status, { color: accent }]}>{item.status}</Text>
        )}
        <TouchableOpacity onPress={onDelete} style={{ marginLeft: 'auto', padding: 2 }}>
          <Ionicons name="trash-outline" size={15} color={th.text4} />
        </TouchableOpacity>
      </View>
      <Text style={[ic.title, { color: th.text1 }]}>{item.title}</Text>
      {item.desc ? <Text style={[ic.desc, { color: th.text3 }]}>{item.desc}</Text> : null}
      {item.link ? (
        <TouchableOpacity onPress={() => Linking.openURL(item.link)} style={ic.linkRow}>
          <Ionicons name="planet-outline" size={13} color={th.cyan} />
          <Text style={[ic.linkText, { color: th.cyan }]}>{item.link}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
const ic = StyleSheet.create({
  card:     { borderRadius: 12, padding: 14, borderWidth: 1, borderLeftWidth: 4, marginBottom: 12 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8, flexWrap: 'wrap' },
  tag:      { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  tagText:  { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  status:   { fontSize: 10, fontWeight: '800', marginLeft: 2 },
  title:    { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  desc:     { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  linkRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  linkText: { fontSize: 11, fontWeight: '600' },
});

// ─── Main PortfolioScreen ─────────────────────────────────────────────────────
export default function PortfolioScreen() {
  const { colors: rawColors } = useTheme();
  // Adapter: keeps every existing `th.xxx` reference below working unchanged,
  // now backed by the real app-wide theme instead of a screen-local copy.
  const th = {
    bg: rawColors.bg0, bg1: rawColors.bg1, bg2: rawColors.bg2,
    border: rawColors.border,
    text1: rawColors.text1, text2: rawColors.text2, text3: rawColors.text3, text4: rawColors.text4,
    cyan: rawColors.teal, gold: rawColors.gold, green: rawColors.financial,
    purple: rawColors.purple, pink: rawColors.physical,
  };

  const [loading,        setLoading]        = useState(true);
  const [profile,        setProfile]        = useState(null);
  const [activeSection,  setActiveSection]  = useState('projects');
  const [showAdd,        setShowAdd]        = useState(false);
  const [userId,         setUserId]         = useState(null);

  // Per-section data
  const [data, setData] = useState({ projects: [], skills: [], experience: [], research: [], passions: [] });

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
    setLoading(true);
    try {
      const [profileRes, projectsRes, researchRes, skillsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('projects').select('id,title,objective,category,status,emoji,color,skills,created_at').eq('user_id', uid).is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('project_research').select('id,title,type,url,notes').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
        supabase.from('project_tasks').select('project_id').eq('user_id', uid).eq('completed', true).limit(1),
      ]);

      const prof = profileRes.data || {};
      setProfile(prof);

      // ── Projects — from projects table
      const projects = (projectsRes.data || []).map(p => ({
        id: p.id, title: p.title,
        desc: p.objective || '',
        tag: p.category || 'General',
        status: p.status === 'completed' ? '✅ Complete' : p.status === 'active' ? '🚀 Active' : '💡 Idea',
        source: 'auto',
        emoji: p.emoji,
        color: p.color,
      }));

      // ── Skills — from profile.growth_areas + skills unlocked across projects + tech_level
      const skillSet = new Set();
      if (prof.tech_level)      skillSet.add(prof.tech_level.charAt(0).toUpperCase() + prof.tech_level.slice(1) + ' Tech Level');
      if (prof.active_life_areas) {
        prof.active_life_areas.forEach(area => {
          const labels = {
            physical:'Physical Wellness',mental:'Mental Wellness',social:'Communication & Social',
            financial:'Financial Literacy',professional:'Professional Development',
            spiritual:'Mindfulness',creative:'Creative Design',digital:'Digital Skills',
          };
          if (labels[area]) skillSet.add(labels[area]);
        });
      }
      // Collect skills from completed projects
      (projectsRes.data || []).forEach(p => {
        (p.skills || []).forEach(s => skillSet.add(s));
      });

      const skills = Array.from(skillSet).map((s, i) => ({
        id: 'skill_' + i, title: s, desc: '', tag: 'Skill', source: 'auto',
      }));

      // ── Research — from project_research
      const research = (researchRes.data || []).map(r => ({
        id: r.id, title: r.title,
        desc: r.notes || '',
        link: r.url || '',
        tag: r.type || 'Research',
        source: 'auto',
      }));

      // ── Passions — from active_life_areas + primary_goal
      const passionMap = {
        physical:'Health & Fitness 💪',mental:'Mental Wellness 🧠',social:'People & Community 🤝',
        financial:'Financial Growth 💰',professional:'Career Development 🚀',
        spiritual:'Mindfulness & Purpose ✨',creative:'Creativity & Art 🎨',digital:'Technology & Digital 💻',
      };
      const passions = (prof.active_life_areas || []).map((area, i) => ({
        id: 'passion_' + i,
        title: passionMap[area] || area,
        desc: '',
        tag: 'Life Area',
        source: 'auto',
      }));
      if (prof.primary_goal) {
        passions.push({ id: 'goal_0', title: prof.primary_goal, desc: 'Primary goal', tag: 'Goal', source: 'auto' });
      }

      // ── Experience — starts empty, user fills in
      setData({ projects, skills, experience: [], research, passions });

    } catch (e) { console.warn('PortfolioScreen', e); }
    setLoading(false);
  };

  const addItem = (item) => {
    const newItem = { id: Date.now().toString(), ...item };
    setData(prev => ({ ...prev, [activeSection]: [newItem, ...prev[activeSection]] }));
  };

  const deleteItem = (id) => {
    setData(prev => ({ ...prev, [activeSection]: prev[activeSection].filter(it => it.id !== id) }));
  };

  const currentSection = SECTIONS.find(s => s.key === activeSection);
  const currentItems   = data[activeSection] || [];
  const accent         = th[currentSection?.accentKey || 'cyan'];

  // Profile derived values
  const suitColor     = profile ? (SUIT_COLORS[profile.suit_color] || '#2bb5a0') : '#2bb5a0';
  const helmetEmoji   = profile ? (HELMET_EMOJI[profile.helmet_style] || '🪖')    : '🪖';
  const badgeEmoji    = profile ? (BADGE_EMOJI[profile.badge] || '🧭')             : '🧭';
  const displayName   = profile?.traveler_name || profile?.display_name || 'Commander';
  const level         = profile?.level || 1;
  const xp            = profile?.xp || 0;
  const lifeStage     = profile?.life_stage || '';
  const primaryGoal   = profile?.primary_goal || '';
  const totalProjects = data.projects.length;
  const totalSkills   = data.skills.length;
  const streak        = profile?.streak_count || 0;

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: th.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={th.cyan} size="large" />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: th.bg }}>
      <FlatList
        data={currentItems}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            {/* ── Header bar ── */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginBottom: 20 }}>
              <View>
                <Text style={{ color: th.cyan, fontSize: 10, letterSpacing: 2, fontWeight: '800' }}>COMMAND VAULT</Text>
                <Text style={{ color: th.text1, fontSize: 22, fontWeight: 'bold' }}>Portfolio</Text>
              </View>
            </View>

            {/* ── Commander profile banner ── */}
            <View style={[ph.card, { backgroundColor: th.bg1, borderColor: th.border }]}>
              {/* Traveler avatar */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <View style={{ position: 'relative' }}>
                  <View style={[ph.avatarCircle, { backgroundColor: suitColor + '22', borderColor: suitColor }]}>
                    <Text style={{ fontSize: 18 }}>{helmetEmoji}</Text>
                    <View style={[ph.suitBody, { backgroundColor: suitColor + '44' }]}>
                      <Text style={{ fontSize: 14 }}>{badgeEmoji}</Text>
                    </View>
                  </View>
                  <View style={[ph.levelBadge, { backgroundColor: th.gold }]}>
                    <Text style={[ph.levelText, { color: th.bg }]}>LVL {level}</Text>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[ph.name, { color: th.text1 }]}>{displayName}</Text>
                  {lifeStage ? <Text style={[ph.sub, { color: th.text3 }]}>{lifeStage}</Text> : null}
                  {primaryGoal ? <Text style={[ph.goal, { color: th.cyan }]}>🎯 {primaryGoal}</Text> : null}
                </View>

                <TouchableOpacity style={[ph.shareBtn, { backgroundColor: th.gold + '18', borderColor: th.gold + '55' }]}>
                  <Ionicons name="share-social-outline" size={18} color={th.gold} />
                </TouchableOpacity>
              </View>

              {/* Stats row */}
              <View style={[ph.statsRow, { borderTopColor: th.border }]}>
                {[
                  { label: 'XP EARNED',  val: xp.toLocaleString(),    color: th.gold   },
                  { label: 'PROJECTS',   val: totalProjects,            color: th.cyan   },
                  { label: 'SKILLS',     val: totalSkills,              color: th.green  },
                  { label: 'STREAK',     val: streak + 'd',             color: th.pink   },
                ].map(st => (
                  <View key={st.label} style={ph.stat}>
                    <Text style={[ph.statVal, { color: st.color }]}>{st.val}</Text>
                    <Text style={[ph.statLabel, { color: th.text4 }]}>{st.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Life areas strip ── */}
            {(profile?.active_life_areas || []).length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(profile.active_life_areas || []).map((area, i) => {
                    const areaColors = { physical:'#e05858',mental:'#8b4fc4',social:'#2bb5a0',financial:'#3ac860',professional:'#c9a84c',spiritual:'#6b9fe8',creative:'#e0a830',digital:'#5a9ae0' };
                    const areaEmojis = { physical:'💪',mental:'🧠',social:'🤝',financial:'💰',professional:'🚀',spiritual:'✨',creative:'🎨',digital:'💻' };
                    const col = areaColors[area] || th.cyan;
                    return (
                      <View key={i} style={{ alignItems: 'center', backgroundColor: col + '18', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: col + '44' }}>
                        <Text style={{ fontSize: 16 }}>{areaEmojis[area] || '⭐'}</Text>
                        <Text style={{ fontSize: 10, color: col, fontWeight: '700', marginTop: 2, textTransform: 'capitalize' }}>{area}</Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* ── Section chips ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SECTIONS.map(sec => {
                  const isAct = activeSection === sec.key;
                  const secAccent = th[sec.accentKey];
                  return (
                    <TouchableOpacity key={sec.key} onPress={() => setActiveSection(sec.key)}
                      style={[ch.chip, { backgroundColor: th.bg1, borderColor: isAct ? secAccent : th.border }]}>
                      <Ionicons name={sec.icon} size={15} color={isAct ? secAccent : th.text4} />
                      <Text style={[ch.label, { color: isAct ? th.text1 : th.text4, fontWeight: isAct ? '700' : '400' }]}>{sec.label}</Text>
                      <View style={[ch.count, { backgroundColor: isAct ? secAccent + '22' : th.bg2 }]}>
                        <Text style={[ch.countText, { color: isAct ? secAccent : th.text4 }]}>{(data[sec.key] || []).length}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* ── Section header ── */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={currentSection?.icon} size={16} color={accent} />
                <Text style={{ color: accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }}>
                  {currentSection?.label.toUpperCase()}
                </Text>
                <Text style={{ color: th.text4, fontSize: 12 }}>({currentItems.length})</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAdd(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: accent, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 }}>
                <Ionicons name="add" size={15} color={th.bg} />
                <Text style={{ color: th.bg, fontWeight: '800', fontSize: 12 }}>Add Entry</Text>
              </TouchableOpacity>
            </View>

            {/* Auto-populate notice for experience */}
            {activeSection === 'experience' && currentItems.length === 0 && (
              <View style={[{ backgroundColor: th.bg1, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: th.border, marginBottom: 12 }]}>
                <Text style={{ color: th.text4, fontSize: 12, lineHeight: 18 }}>
                  💼 Add your work history, roles, internships, and other experience here. Tap "Add Entry" to get started.
                </Text>
              </View>
            )}
          </>
        )}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', paddingVertical: 50 }}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>
              {currentSection?.icon === 'rocket-outline' ? '🛸' : '📭'}
            </Text>
            <Text style={{ color: th.text1, fontSize: 16, fontWeight: 'bold', marginBottom: 6 }}>
              No {currentSection?.label} yet
            </Text>
            <Text style={{ color: th.text4, fontSize: 13, textAlign: 'center' }}>
              {activeSection === 'projects'
                ? 'Your projects will auto-appear here as you add them in Mission Control.'
                : activeSection === 'skills'
                ? 'Skills are auto-collected from your onboarding and project work.'
                : activeSection === 'research'
                ? 'Research added inside any project appears here automatically.'
                : 'Tap Add Entry to log your work here.'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            accent={accent}
            onDelete={() => deleteItem(item.id)}
            th={th}
          />
        )}
      />

      <AddModal
        visible={showAdd}
        section={currentSection}
        onAdd={addItem}
        onClose={() => setShowAdd(false)}
        th={th}
      />
    </View>
  );
}

const ph = StyleSheet.create({
  card:        { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  avatarCircle:{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  suitBody:    { width: 32, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: -4 },
  levelBadge:  { position: 'absolute', bottom: -4, right: -4, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  levelText:   { fontSize: 9, fontWeight: '800' },
  name:        { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  sub:         { fontSize: 12, marginBottom: 4 },
  goal:        { fontSize: 12, fontWeight: '600' },
  shareBtn:    { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow:    { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  stat:        { flex: 1, alignItems: 'center' },
  statVal:     { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel:   { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
});

const ch = StyleSheet.create({
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  label:     { fontSize: 12 },
  count:     { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  countText: { fontSize: 10, fontWeight: '700' },
});
