// src/screens/LessonBuilder.js
// Classroom Day Lesson Plan Builder — deliberately separate from the
// per-topic Learn/Watch/Practice/Apply content in ClassTopicScreen.js. A
// teacher picks a subject, grade band, and class-period format (45 or 90
// minutes), then builds a full lesson by picking content into the fixed
// segment template for that format (src/data/lessonPlanTemplates.js — the
// LAYOUT is hardcoded on purpose) from a content bank that lives in
// Supabase (src/api/lessonBuilderService.js — the CONTENT keeps growing,
// so it isn't hardcoded). Anything the bank doesn't cover yet can be typed
// in directly per segment. Finished plans save to `teacher_lesson_plans`
// and show up in MyLessonPlans.js.
import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import { getActivityBank, saveLessonPlan } from '../api/lessonBuilderService';
import { LESSON_FORMATS, LESSON_FORMAT_KEYS, BANK_ROLE_META, BUILDER_GRADE_BANDS } from '../data/lessonPlanTemplates';
import { CLASS_SUBJECTS } from '../data/classCatalog';

function genId() {
  return 'c' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// One pickable row inside a role's list — a bank item or a teacher-typed
// custom one. Custom items are editable inline; bank items are read-only
// (their whole point is being ready-made).
function PickRow({ item, selected, onToggle, onEditCustom, onRemoveCustom, color, c, t, s, r }) {
  return (
    <TouchableOpacity
      onPress={() => onToggle(item.id)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        paddingVertical: 8, paddingHorizontal: 10, borderRadius: r.md,
        backgroundColor: selected ? color + '18' : 'transparent',
        borderWidth: 1, borderColor: selected ? color + '55' : c.border,
        marginBottom: 6,
      }}
    >
      <Ionicons
        name={selected ? 'checkbox' : 'square-outline'}
        size={18}
        color={selected ? color : c.text4}
        style={{ marginTop: 2 }}
      />
      <View style={{ flex: 1 }}>
        {item.custom ? (
          <>
            <TextInput
              value={item.title}
              onChangeText={(txt) => onEditCustom(item.id, { title: txt })}
              placeholder="Title"
              placeholderTextColor={c.text4}
              style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, padding: 0, marginBottom: 2 }}
            />
            <TextInput
              value={item.body}
              onChangeText={(txt) => onEditCustom(item.id, { body: txt })}
              placeholder="Describe it..."
              placeholderTextColor={c.text4}
              multiline
              style={{ fontSize: t.sm, color: c.text2, padding: 0, lineHeight: 18 }}
            />
          </>
        ) : (
          <>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{item.title}</Text>
            <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 1, lineHeight: 18 }}>{item.body}</Text>
          </>
        )}
      </View>
      {item.custom && (
        <TouchableOpacity onPress={() => onRemoveCustom(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={c.text4} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// One role's pick-list (e.g. "Objectives") — bank items + custom ones +
// an "add your own" affordance. Used both for the top-level Objectives/
// Materials/Assessment lists and inside each timed segment.
function RoleBlock({ role, bank, customs, selected, onToggle, onAddCustom, onEditCustom, onRemoveCustom, color, c, t, s, r }) {
  const meta = BANK_ROLE_META[role];
  const items = [...(bank[role] || []), ...(customs[role] || [])];
  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}>
        <Ionicons name={meta.icon} size={14} color={color} />
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.4, color, textTransform: 'uppercase' }}>
          {meta.label}
        </Text>
      </View>
      {items.map((item) => (
        <PickRow
          key={item.id}
          item={item}
          selected={!!selected[item.id]}
          onToggle={(id) => onToggle(role, id)}
          onEditCustom={(id, patch) => onEditCustom(role, id, patch)}
          onRemoveCustom={(id) => onRemoveCustom(role, id)}
          color={color} c={c} t={t} s={s} r={r}
        />
      ))}
      <TouchableOpacity onPress={() => onAddCustom(role)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}>
        <Ionicons name="add-circle-outline" size={16} color={color} />
        <Text style={{ fontSize: t.sm, fontWeight: '700', color }}>Add your own</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LessonBuilder() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const builtSubjects = useMemo(() => CLASS_SUBJECTS.map(sub => ({ title: sub.title, color: sub.color, icon: sub.icon })), []);

  const [subjectTitle, setSubjectTitle] = useState(route.params?.subjectTitle || null);
  const [gradeBand, setGradeBand] = useState(route.params?.gradeBand && route.params.gradeBand !== 'All' ? route.params.gradeBand : null);
  const [format, setFormat] = useState('45');
  const [stage, setStage] = useState('setup'); // 'setup' | 'build'

  const [loadingBank, setLoadingBank] = useState(false);
  const [bank, setBank] = useState({});
  const [customs, setCustoms] = useState({});   // role -> [{id,title,body,custom:true}]
  const [selected, setSelected] = useState({}); // role -> { [id]: true }
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);

  const subject = builtSubjects.find(sub => sub.title === subjectTitle);
  const color = subject?.color || c.teal;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
  }, []);

  const startBuilding = async () => {
    if (!subjectTitle || !gradeBand) return;
    setLoadingBank(true);
    const fetched = await getActivityBank(subjectTitle, gradeBand);
    setBank(fetched);
    setCustoms({});
    setSelected({});
    setTitle(`${subjectTitle} · ${gradeBand} · ${LESSON_FORMATS[format].label}`);
    setLoadingBank(false);
    setStage('build');
  };

  const toggle = (role, id) => {
    setSelected(prev => ({ ...prev, [role]: { ...prev[role], [id]: !prev[role]?.[id] } }));
  };

  const addCustom = (role) => {
    const id = genId();
    setCustoms(prev => ({ ...prev, [role]: [...(prev[role] || []), { id, title: '', body: '', custom: true }] }));
    setSelected(prev => ({ ...prev, [role]: { ...prev[role], [id]: true } }));
  };

  const editCustom = (role, id, patch) => {
    setCustoms(prev => ({
      ...prev,
      [role]: (prev[role] || []).map(it => (it.id === id ? { ...it, ...patch } : it)),
    }));
  };

  const removeCustom = (role, id) => {
    setCustoms(prev => ({ ...prev, [role]: (prev[role] || []).filter(it => it.id !== id) }));
    setSelected(prev => {
      const next = { ...prev[role] };
      delete next[id];
      return { ...prev, [role]: next };
    });
  };

  const itemsFor = (role) => {
    const all = [...(bank[role] || []), ...(customs[role] || [])];
    return all.filter(it => selected[role]?.[it.id] && (it.title || it.body));
  };

  const template = LESSON_FORMATS[format];

  const totalPicked = useMemo(() => {
    return Object.values(selected).reduce((n, roleMap) => n + Object.values(roleMap).filter(Boolean).length, 0);
  }, [selected]);

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Sign in required', 'Sign in to save a lesson plan.');
      return;
    }
    if (totalPicked === 0) {
      Alert.alert('Nothing picked yet', 'Select or add at least one item before saving.');
      return;
    }
    setSaving(true);
    try {
      const segments = template.segments.map(seg => ({
        key: seg.key,
        label: seg.label,
        minutes: seg.minutes,
        items: seg.roles.flatMap(role => itemsFor(role).map(it => ({ title: it.title, body: it.body }))),
      }));
      const plan = {
        title: title.trim() || `${subjectTitle} · ${gradeBand}`,
        subject_title: subjectTitle,
        grade_band: gradeBand,
        format,
        objectives: itemsFor('objective').map(it => it.body),
        materials: itemsFor('material').map(it => it.body),
        assessment: itemsFor('assessment').map(it => it.body),
        segments,
      };
      const { queued } = await saveLessonPlan(userId, plan);
      Alert.alert(
        queued ? 'Saved offline' : 'Lesson plan saved',
        queued ? "It'll sync to your account once you're back online." : 'Find it any time in My Lesson Plans.',
        [{ text: 'OK', onPress: () => navigation.navigate('MyLessonPlans') }]
      );
    } catch (e) {
      Alert.alert('Could not save', e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg0 }} contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.lg }}>
        <TouchableOpacity onPress={() => (stage === 'build' ? setStage('setup') : navigation.goBack())} style={{ marginRight: 10 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>Classroom Day Builder</Text>
          <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>Build a lesson plan from the day-template</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('MyLessonPlans')}>
          <Ionicons name="folder-open-outline" size={22} color={c.teal} />
        </TouchableOpacity>
      </View>

      {stage === 'setup' && (
        <View>
          <Text style={{ fontSize: t.sm, fontWeight: '800', color: c.text2, marginBottom: 8 }}>SUBJECT</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: s.lg }}>
            {builtSubjects.map(sub => (
              <TouchableOpacity
                key={sub.title}
                onPress={() => setSubjectTitle(sub.title)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: r.full,
                  backgroundColor: subjectTitle === sub.title ? sub.color : c.bg1,
                  borderWidth: 1, borderColor: subjectTitle === sub.title ? sub.color : c.border,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                <Ionicons name={sub.icon} size={14} color={subjectTitle === sub.title ? '#fff' : sub.color} />
                <Text style={{ fontSize: t.sm, fontWeight: '700', color: subjectTitle === sub.title ? '#fff' : c.text1 }}>{sub.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: t.sm, fontWeight: '800', color: c.text2, marginBottom: 8 }}>GRADE BAND</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: s.lg }}>
            {BUILDER_GRADE_BANDS.map(band => (
              <TouchableOpacity
                key={band}
                onPress={() => setGradeBand(band)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: r.full,
                  backgroundColor: gradeBand === band ? c.teal : c.bg1,
                  borderWidth: 1, borderColor: gradeBand === band ? c.teal : c.border,
                }}
              >
                <Text style={{ fontSize: t.sm, fontWeight: '700', color: gradeBand === band ? '#fff' : c.text1 }}>{band}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: t.sm, fontWeight: '800', color: c.text2, marginBottom: 8 }}>CLASS FORMAT</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: s.xl }}>
            {LESSON_FORMAT_KEYS.map(key => (
              <TouchableOpacity
                key={key}
                onPress={() => setFormat(key)}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: r.md, alignItems: 'center',
                  backgroundColor: format === key ? c.teal : c.bg1,
                  borderWidth: 1, borderColor: format === key ? c.teal : c.border,
                }}
              >
                <Text style={{ fontSize: t.sm, fontWeight: '800', color: format === key ? '#fff' : c.text1 }}>
                  {LESSON_FORMATS[key].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={startBuilding}
            disabled={!subjectTitle || !gradeBand || loadingBank}
            activeOpacity={0.85}
            style={{
              paddingVertical: 14, borderRadius: r.lg, alignItems: 'center',
              backgroundColor: (!subjectTitle || !gradeBand) ? c.bg2 : c.teal,
            }}
          >
            {loadingBank
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize: t.md, fontWeight: '800', color: (!subjectTitle || !gradeBand) ? c.text4 : '#fff' }}>Start Building →</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {stage === 'build' && (
        <View>
          <View style={{ marginBottom: s.md }}>
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color, opacity: 0.8 }}>
              {subjectTitle?.toUpperCase()} · {gradeBand} · {template.label.toUpperCase()}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Lesson title"
              placeholderTextColor={c.text4}
              style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginTop: 4, padding: 0 }}
            />
          </View>

          <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.md }}>
            <RoleBlock role="objective" bank={bank} customs={customs} selected={selected.objective || {}} onToggle={toggle} onAddCustom={addCustom} onEditCustom={editCustom} onRemoveCustom={removeCustom} color={color} c={c} t={t} s={s} r={r} />
            <RoleBlock role="material" bank={bank} customs={customs} selected={selected.material || {}} onToggle={toggle} onAddCustom={addCustom} onEditCustom={editCustom} onRemoveCustom={removeCustom} color={color} c={c} t={t} s={s} r={r} />
          </View>

          {template.segments.map((seg) => (
            <View key={seg.key} style={{ backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 3, borderTopColor: color, padding: s.md, marginBottom: s.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{seg.label}</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: c.text4 }}>{seg.minutes} MIN</Text>
              </View>
              {seg.roles.map(role => (
                <RoleBlock key={role} role={role} bank={bank} customs={customs} selected={selected[role] || {}} onToggle={toggle} onAddCustom={addCustom} onEditCustom={editCustom} onRemoveCustom={removeCustom} color={color} c={c} t={t} s={s} r={r} />
              ))}
            </View>
          ))}

          <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.lg }}>
            <RoleBlock role="assessment" bank={bank} customs={customs} selected={selected.assessment || {}} onToggle={toggle} onAddCustom={addCustom} onEditCustom={editCustom} onRemoveCustom={removeCustom} color={color} c={c} t={t} s={s} r={r} />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
            style={{ paddingVertical: 14, borderRadius: r.lg, alignItems: 'center', backgroundColor: color, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={{ fontSize: t.md, fontWeight: '800', color: '#fff' }}>Save Plan ({totalPicked} picked)</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
