// src/screens/library/wayfinder/WayfinderModules.js
//
// The question steps for Wayfinder's "go deeper" sections: what's going on
// right now, personality, how you learn, and life beyond work. Controlled
// components — WayfinderScreen owns the state and saves every answer.

import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { FONTS } from '../../../theme';
import { SITUATION_GROUPS, MAX_SITUATIONS } from '../../../data/wayfinderSituations';
import {
  PERSONALITY_ITEMS, PERSONALITY_SCALE, LEARNING_PREFS, LEARNING_BLOCKERS,
  LIFE_ZONES, MAX_LIFE_ZONES, QUALITIES, MAX_QUALITIES,
} from '../../../data/wayfinderDeeper';
import { personalityAnswered } from '../../../logic/wayfinderDeeper';
import { StepHeader, ChoiceRow, Chip, Kicker } from './WayfinderUI';
import { UrgentHelp, PersonalitySection } from './WayfinderDeeperSections';

// ─── What's going on ────────────────────────────────────────────────────────
export function SituationStep({ options, selected, onToggle }) {
  const { colors: c } = useTheme();
  const full = selected.length >= MAX_SITUATIONS;
  const urgent = options.filter(s => s.urgent && selected.includes(s.id));

  return (
    <View>
      <StepHeader
        kicker="Start from where you are"
        title="What’s going on right now?"
        body={`Pick up to ${MAX_SITUATIONS}. You’ll get a plan for each — what to do this week, free help, and how to think about what’s next.`}
      />

      {/* Urgent help appears the moment it's ticked, above everything else —
          not after pressing a button at the bottom of a long list. */}
      <UrgentHelp situations={urgent} />

      {SITUATION_GROUPS.map(group => {
        const items = options.filter(s => s.group === group.id);
        if (!items.length) return null;
        return (
          <View key={group.id}>
            <Kicker style={{ marginTop: 16, color: group.id === 'urgent' ? c.error : c.text3 }}>{group.label}</Kicker>
            {items.map(s => {
              const on = selected.includes(s.id);
              return (
                <ChoiceRow
                  key={s.id}
                  emoji={s.emoji}
                  label={s.label}
                  sub={s.blurb}
                  on={on}
                  color={s.urgent ? c.error : c.teal}
                  // Urgent ones can always be ticked, even at the limit.
                  disabled={!on && full && !s.urgent}
                  onPress={() => onToggle(s.id)}
                />
              );
            })}
          </View>
        );
      })}

      <Text style={{ fontSize: 12.5, color: c.text3, lineHeight: 18, marginTop: 12, textAlign: 'center' }}>
        This points you to real, free help. It isn’t a replacement for a doctor, counselor, or lawyer — it helps you find one.
      </Text>
    </View>
  );
}

// ─── Personality ────────────────────────────────────────────────────────────
export function PersonalityStep({ answers, index, setIndex, onAnswer }) {
  const { colors: c, radius: r } = useTheme();
  const total = PERSONALITY_ITEMS.length;
  const answered = personalityAnswered(answers);
  const done = index >= total;
  const item = PERSONALITY_ITEMS[Math.min(index, total - 1)];
  const current = answers[item.id];

  return (
    <View>
      <StepHeader
        kicker="Go deeper · about 3 minutes"
        title="Your personality"
        body="20 quick statements. Answer for how you usually are — not how you wish you were. There’s no good or bad result."
      />

      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.bg2, overflow: 'hidden', marginBottom: 8 }}>
        <View style={{ width: `${Math.round((answered / total) * 100)}%`, height: '100%', backgroundColor: c.teal }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <Text style={{ fontSize: 12, color: c.text3, fontFamily: FONTS.mono }}>{Math.min(index + 1, total)} / {total}</Text>
        {index > 0 && (
          <TouchableOpacity onPress={() => setIndex(Math.max(0, Math.min(index, total) - 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 12, color: c.teal, fontWeight: '600' }}>‹ Previous</Text>
          </TouchableOpacity>
        )}
      </View>

      {done ? (
        answered >= total ? <PersonalitySection answers={answers} /> : (
          <Text style={{ fontSize: 14, color: c.text2 }}>A few statements were skipped — tap Previous to finish them.</Text>
        )
      ) : (
        <>
          <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: 22, borderWidth: 1, borderColor: c.border, minHeight: 120, justifyContent: 'center' }}>
            <Text style={{ fontSize: 11, color: c.text4, fontFamily: FONTS.mono, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>How much is this you?</Text>
            <Text style={{ fontSize: 20, fontWeight: '600', color: c.text1, lineHeight: 28 }}>{item.text}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 14 }}>
            {PERSONALITY_SCALE.map(opt => {
              const on = current === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => onAnswer(item.id, opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 2, borderRadius: r.md, borderWidth: 1.5, borderColor: on ? c.teal : c.border, backgroundColor: on ? c.teal + '1f' : c.bg1, minHeight: 64 }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: on ? c.teal : c.text3 }}>{opt.value}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: on ? c.teal : c.text2, marginTop: 4, textAlign: 'center' }}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

// ─── How you learn ──────────────────────────────────────────────────────────
export function LearningStep({ learning, onChange }) {
  const { colors: c } = useTheme();
  const toggle = (key, id) => {
    const cur = learning[key] || [];
    onChange({ [key]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] });
  };

  return (
    <View>
      <StepHeader
        kicker="Go deeper · about a minute"
        title="How you learn"
        body="What works for you when you pick up something new, and what gets in the way. Pick as many as are true."
      />

      <Kicker>I like learning by…</Kicker>
      {LEARNING_PREFS.map(p => (
        <ChoiceRow key={p.id} emoji={p.emoji} label={p.label} on={(learning.prefs || []).includes(p.id)} onPress={() => toggle('prefs', p.id)} />
      ))}

      <Kicker style={{ marginTop: 16 }}>What gets in the way</Kicker>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {LEARNING_BLOCKERS.map(b => (
          <Chip key={b.id} label={b.label} on={(learning.blockers || []).includes(b.id)} onPress={() => toggle('blockers', b.id)} color={c.gold} />
        ))}
      </View>
    </View>
  );
}

// ─── Life beyond work ───────────────────────────────────────────────────────
export function LifeStep({ life, onChange }) {
  const { colors: c, radius: r } = useTheme();
  const zones = life.zones || [];
  const qualities = life.qualities || [];

  const toggleZone = (id) => {
    if (zones.includes(id)) onChange({ zones: zones.filter(z => z !== id) });
    else if (zones.length < MAX_LIFE_ZONES) onChange({ zones: [...zones, id] });
  };
  const toggleQuality = (id) => {
    if (qualities.includes(id)) onChange({ qualities: qualities.filter(q => q !== id) });
    else if (qualities.length < MAX_QUALITIES) onChange({ qualities: [...qualities, id] });
  };

  return (
    <View>
      <StepHeader
        kicker="Go deeper · about 2 minutes"
        title="Life beyond work"
        body="Who you want to be is bigger than a job. This is about the rest of it."
      />

      <Text style={{ fontSize: 15, fontWeight: '700', color: c.text1, marginBottom: 4 }}>A year from now, where do you want life to feel different?</Text>
      <Text style={{ fontSize: 12.5, color: c.text3, marginBottom: 10 }}>Pick up to {MAX_LIFE_ZONES}.</Text>
      {LIFE_ZONES.map(z => {
        const on = zones.includes(z.id);
        return (
          <View key={z.id}>
            <ChoiceRow emoji={z.emoji} label={z.label} on={on} disabled={!on && zones.length >= MAX_LIFE_ZONES} onPress={() => toggleZone(z.id)} />
            {on && (
              <TextInput
                value={life.wants?.[z.id] || ''}
                onChangeText={v => onChange({ wants: { ...(life.wants || {}), [z.id]: v } })}
                placeholder={`What would better look like? ${z.placeholder}`}
                placeholderTextColor={c.text4}
                maxLength={120}
                style={{ marginTop: -2, marginBottom: 12, marginLeft: 12, borderRadius: r.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0, color: c.text1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5 }}
              />
            )}
          </View>
        );
      })}

      <Text style={{ fontSize: 15, fontWeight: '700', color: c.text1, marginTop: 18, marginBottom: 4 }}>Who do you want to be?</Text>
      <Text style={{ fontSize: 12.5, color: c.text3, marginBottom: 10 }}>
        Pick up to {MAX_QUALITIES} qualities you want more of. Everyone’s working on something — each one comes with a small practice.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {QUALITIES.map(q => {
          const on = qualities.includes(q.id);
          return (
            <Chip key={q.id} label={`${q.emoji} ${q.label}`} on={on} disabled={!on && qualities.length >= MAX_QUALITIES} onPress={() => toggleQuality(q.id)} color={c.purple} />
          );
        })}
      </View>
    </View>
  );
}
