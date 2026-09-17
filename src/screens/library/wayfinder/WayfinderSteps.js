// src/screens/library/wayfinder/WayfinderSteps.js
//
// The three question steps. Each is a controlled component — WayfinderScreen
// owns the state and saves on every change, so leaving halfway resumes on
// the same question instead of starting over.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { FONTS } from '../../../theme';
import {
  EXPERIENCES, EXPERIENCE_GROUPS, ACTIVITIES, ANSWER_OPTIONS,
  VALUES, MAX_VALUES, TIMELINES, ROUTES,
} from '../../../data/wayfinder';
import { skillsFromExperiences, answeredCount } from '../../../logic/wayfinderScoring';

export function StepIntro({ kicker, title, body }) {
  const { colors: c } = useTheme();
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 11, color: c.teal, fontFamily: FONTS.mono, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
        {kicker}
      </Text>
      <Text style={{ fontSize: 24, fontWeight: '700', color: c.text1, marginBottom: 8, lineHeight: 30 }}>{title}</Text>
      <Text style={{ fontSize: 14, color: c.text2, lineHeight: 21 }}>{body}</Text>
    </View>
  );
}

function GroupLabel({ children }) {
  const { colors: c } = useTheme();
  return (
    <Text style={{ fontSize: 11, color: c.text3, fontFamily: FONTS.mono, letterSpacing: 1, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

// ─── Step 1 ─────────────────────────────────────────────────────────────────
export function ExperiencesStep({ selected, onToggle }) {
  const { colors: c, radius: r } = useTheme();
  const skillCount = skillsFromExperiences(selected).length;

  return (
    <View>
      <StepIntro
        kicker="Step 1 of 3 · About 2 minutes"
        title="What have you already done?"
        body="Tap everything that’s true — paid or not, big or small. Most real skills never make it onto a résumé, and a lot of them come from getting through ordinary life."
      />

      {EXPERIENCE_GROUPS.map(group => (
        <View key={group.id}>
          <GroupLabel>{group.label}</GroupLabel>
          {EXPERIENCES.filter(e => e.group === group.id).map(exp => {
            const on = selected.includes(exp.id);
            return (
              <TouchableOpacity
                key={exp.id}
                onPress={() => onToggle(exp.id)}
                activeOpacity={0.8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8,
                  borderRadius: r.md, borderWidth: 1,
                  borderColor: on ? c.teal : c.border,
                  backgroundColor: on ? c.teal + '16' : c.bg1,
                }}
              >
                <Text style={{ fontSize: 20 }}>{exp.emoji}</Text>
                <Text style={{ flex: 1, fontSize: 14, color: on ? c.text1 : c.text2, fontWeight: on ? '600' : '400', lineHeight: 19 }}>
                  {exp.label}
                </Text>
                <View style={{
                  width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
                  borderColor: on ? c.teal : c.border, backgroundColor: on ? c.teal : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <Text style={{ fontSize: 13, color: skillCount ? c.teal : c.text3, marginTop: 10, textAlign: 'center' }}>
        {skillCount
          ? `That’s ${skillCount} real skill${skillCount === 1 ? '' : 's'} so far. You’ll see them on your map.`
          : 'None of these? That’s fine — skip ahead.'}
      </Text>
    </View>
  );
}

// ─── Step 2 ─────────────────────────────────────────────────────────────────
// One statement at a time. Answering auto-advances; the previous card is one
// tap back. Speed matters here — the first instinct is the useful answer.
export function InterestsStep({ answers, index, setIndex, onAnswer }) {
  const { colors: c, radius: r } = useTheme();
  const total = ACTIVITIES.length;
  const answered = answeredCount(answers);
  const done = index >= total;
  const activity = ACTIVITIES[Math.min(index, total - 1)];
  const current = answers[activity.id];

  return (
    <View>
      <StepIntro
        kicker="Step 2 of 3 · About 5 minutes"
        title="What pulls you in?"
        body="Don’t think about whether you’re good at it, whether it pays, or what anyone would say. Just: does it sound like something you’d enjoy?"
      />

      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.bg2, overflow: 'hidden', marginBottom: 8 }}>
        <View style={{ width: `${Math.round((answered / total) * 100)}%`, height: '100%', backgroundColor: c.teal }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <Text style={{ fontSize: 12, color: c.text3, fontFamily: FONTS.mono }}>
          {Math.min(index + 1, total)} / {total}
        </Text>
        {index > 0 && (
          <TouchableOpacity onPress={() => setIndex(Math.max(0, Math.min(index, total) - 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 12, color: c.teal, fontWeight: '600' }}>‹ Previous</Text>
          </TouchableOpacity>
        )}
      </View>

      {done ? (
        <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: 22, borderWidth: 1, borderColor: c.teal + '55', alignItems: 'center' }}>
          <Text style={{ fontSize: 34, marginBottom: 8 }}>✅</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: c.text1, marginBottom: 6 }}>All {total} answered</Text>
          <Text style={{ fontSize: 14, color: c.text2, textAlign: 'center', lineHeight: 20 }}>
            One more short step — what matters to you — and your map is ready.
          </Text>
        </View>
      ) : (
        <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: 22, borderWidth: 1, borderColor: c.border, minHeight: 150, justifyContent: 'center' }}>
          <Text style={{ fontSize: 11, color: c.text4, fontFamily: FONTS.mono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            Would you enjoy…
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '600', color: c.text1, lineHeight: 28 }}>{activity.text}</Text>
        </View>
      )}

      {!done && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          {ANSWER_OPTIONS.map(opt => {
            const on = current === opt.value;
            const tone = opt.value === 2 ? c.teal : opt.value === 1 ? c.gold : c.text3;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onAnswer(activity.id, opt.value)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: r.md,
                  borderWidth: 1.5, borderColor: on ? tone : c.border,
                  backgroundColor: on ? tone + '1f' : c.bg1,
                }}
              >
                <Ionicons name={opt.icon} size={22} color={tone} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: on ? tone : c.text2, marginTop: 6 }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Step 3 ─────────────────────────────────────────────────────────────────
export function ValuesStep({ values, onToggleValue, reality, onReality }) {
  const { colors: c, radius: r } = useTheme();
  const full = values.length >= MAX_VALUES;

  const toggleTraining = (id) => {
    const cur = reality.training || [];
    onReality({ training: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  return (
    <View>
      <StepIntro
        kicker="Step 3 of 3 · About 2 minutes"
        title="What matters to you?"
        body={`Pick up to ${MAX_VALUES}. There are no right answers, and it’s normal for these to change as your life does.`}
      />

      <Text style={{ fontSize: 12, color: full ? c.gold : c.text3, fontFamily: FONTS.mono, marginBottom: 10 }}>
        {values.length} / {MAX_VALUES} picked
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {VALUES.map(v => {
          const on = values.includes(v.id);
          const disabled = !on && full;
          return (
            <TouchableOpacity
              key={v.id}
              onPress={() => onToggleValue(v.id)}
              disabled={disabled}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on, disabled }}
              style={{
                width: '48.5%', padding: 12, borderRadius: r.md, borderWidth: 1,
                borderColor: on ? c.gold : c.border,
                backgroundColor: on ? c.gold + '1a' : c.bg1,
                opacity: disabled ? 0.45 : 1,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: on ? c.text1 : c.text2 }}>{v.emoji} {v.label}</Text>
              <Text style={{ fontSize: 12, color: c.text3, marginTop: 3, lineHeight: 16 }}>{v.blurb}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <GroupLabel>Real life</GroupLabel>
      <Text style={{ fontSize: 13, color: c.text3, lineHeight: 19, marginBottom: 12 }}>
        This doesn’t hide anything from you. It changes what shows up first, so the suggestions fit your actual situation.
      </Text>

      <Text style={{ fontSize: 14, fontWeight: '600', color: c.text1, marginBottom: 8 }}>How soon does your next move need to pay?</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {TIMELINES.map(tl => {
          const on = reality.timeline === tl.id;
          return (
            <TouchableOpacity
              key={tl.id}
              onPress={() => onReality({ timeline: on ? null : tl.id })}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: on ? c.teal : c.border, backgroundColor: on ? c.teal + '1a' : c.bg1 }}
            >
              <Text style={{ fontSize: 13, color: on ? c.teal : c.text2, fontWeight: on ? '700' : '400' }}>{tl.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ fontSize: 14, fontWeight: '600', color: c.text1, marginBottom: 8 }}>What kind of training could you actually do?</Text>
      <Text style={{ fontSize: 12, color: c.text3, marginBottom: 8 }}>Pick all that could work.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ROUTES.map(rt => {
          const on = (reality.training || []).includes(rt.id);
          return (
            <TouchableOpacity
              key={rt.id}
              onPress={() => toggleTraining(rt.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: on ? c.teal : c.border, backgroundColor: on ? c.teal + '1a' : c.bg1 }}
            >
              <Text style={{ fontSize: 13, color: on ? c.teal : c.text2, fontWeight: on ? '700' : '400' }}>{rt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
