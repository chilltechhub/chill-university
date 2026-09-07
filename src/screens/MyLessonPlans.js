// src/screens/MyLessonPlans.js
// A teacher's saved Classroom Day Lesson Plan Builder plans (see
// LessonBuilder.js + src/api/lessonBuilderService.js). List + expand to
// view + delete; editing happens by rebuilding in LessonBuilder.
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import { listLessonPlans, deleteLessonPlan } from '../api/lessonBuilderService';
import { CLASS_SUBJECTS } from '../data/classCatalog';

function Section({ heading, color, children }) {
  if (!children) return null;
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.5, color, marginBottom: 4 }}>
        {heading.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function PlanCard({ plan, color, c, t, s, r, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: s.md, borderRadius: r.lg, overflow: 'hidden', backgroundColor: c.bg1, borderWidth: 1, borderColor: color + '55' }}>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: s.md, paddingHorizontal: s.lg, backgroundColor: color + '18' }}
      >
        <Ionicons name="clipboard" size={18} color={color} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color, opacity: 0.8 }}>
            {plan.subject_title?.toUpperCase()} · {plan.grade_band} · {plan.format} MIN
          </Text>
          <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginTop: 1 }}>{plan.title}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(plan)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginRight: 6 }}>
          <Ionicons name="trash-outline" size={18} color={c.text4} />
        </TouchableOpacity>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={c.text4} />
      </TouchableOpacity>

      {open && (
        <View style={{ paddingHorizontal: s.lg, paddingVertical: s.md }}>
          {plan.objectives?.length > 0 && (
            <Section heading="Objectives" color={color}>
              {plan.objectives.map((obj, i) => (
                <Text key={i} style={{ fontSize: t.sm, lineHeight: 19, color: c.text2, marginBottom: 2 }}>• {obj}</Text>
              ))}
            </Section>
          )}
          {plan.materials?.length > 0 && (
            <Section heading="Materials" color={color}>
              {plan.materials.map((mat, i) => (
                <Text key={i} style={{ fontSize: t.sm, lineHeight: 19, color: c.text2, marginBottom: 2 }}>• {mat}</Text>
              ))}
            </Section>
          )}
          {(plan.segments || []).map((seg, i) => (
            seg.items?.length > 0 && (
              <Section key={i} heading={`${seg.label} (${seg.minutes} min)`} color={color}>
                {seg.items.map((it, j) => (
                  <View key={j} style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{it.title}</Text>
                    <Text style={{ fontSize: t.sm, lineHeight: 19, color: c.text2 }}>{it.body}</Text>
                  </View>
                ))}
              </Section>
            )
          ))}
          {plan.assessment?.length > 0 && (
            <Section heading="Assessment" color={color}>
              {plan.assessment.map((a, i) => (
                <Text key={i} style={{ fontSize: t.sm, lineHeight: 19, color: c.text2, marginBottom: 2 }}>• {a}</Text>
              ))}
            </Section>
          )}
        </View>
      )}
    </View>
  );
}

export default function MyLessonPlans() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;
    setUserId(uid || null);
    if (!uid) { setLoading(false); return; }
    const rows = await listLessonPlans(uid);
    setPlans(rows);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (plan) => {
    Alert.alert('Delete lesson plan?', plan.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setPlans(prev => prev.filter(p => p.id !== plan.id));
          try { await deleteLessonPlan(plan.id); } catch (e) { console.warn('deleteLessonPlan', e.message); }
        },
      },
    ]);
  };

  const colorFor = (subjectTitle) => CLASS_SUBJECTS.find(sub => sub.title === subjectTitle)?.color || c.teal;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg0 }} contentContainerStyle={{ padding: s.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.lg }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, flex: 1 }}>My Lesson Plans</Text>
        <TouchableOpacity onPress={() => navigation.navigate('LessonBuilder')}>
          <Ionicons name="add-circle" size={26} color={c.teal} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={c.teal} style={{ marginTop: 30 }} />
      ) : !userId ? (
        <Text style={{ color: c.text3, fontSize: t.sm, textAlign: 'center', marginTop: 30 }}>Sign in to save and view lesson plans.</Text>
      ) : plans.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="clipboard-outline" size={40} color={c.text4} />
          <Text style={{ color: c.text3, fontSize: t.sm, marginTop: 10, textAlign: 'center' }}>
            No lesson plans yet. Build your first one from the Classroom Day Builder.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('LessonBuilder')}
            style={{ marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: r.full, backgroundColor: c.teal }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Build a Lesson</Text>
          </TouchableOpacity>
        </View>
      ) : (
        plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} color={colorFor(plan.subject_title)} c={c} t={t} s={s} r={r} onDelete={handleDelete} />
        ))
      )}
    </ScrollView>
  );
}
