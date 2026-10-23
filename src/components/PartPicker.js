// src/components/PartPicker.js
// One part of a Studio Build as a row of choices: its everyday options open,
// its upgrades marked "not yet" with a lock. Tapping a locked one opens the
// part's 30-second lesson and its one question right here; the right answer
// masters the part (src/logic/builds.js answerCheck) and picks the upgrade.
// A wrong answer costs nothing: read it again, try when ready.
//
// A lock only holds back control, never the result (docs/north-star.md):
// the Build works the whole time.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import RichText from './RichText';
import { lookAtPart, pickOption, isOptionOpen, answerCheck } from '../logic/builds';

export default function PartPicker({ build, part, onChange, onPicked }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent, shadows } = useTheme();
  const [asking, setAsking] = useState(null); // the locked option they tapped
  const [wrong, setWrong] = useState(false);

  const choose = (o) => {
    if (!isOptionOpen(lookAtPart(build, part.id), part.id, o.id)) {
      setWrong(false);
      setAsking(a => (a === o.id ? null : o.id));
      return;
    }
    const next = pickOption(lookAtPart(build, part.id), part.id, o.id);
    if (next !== build) onChange(next);
    onPicked?.(o);
  };
  const answer = (i) => {
    const { build: next, right } = answerCheck(build, part.id, i);
    if (!right) { setWrong(true); return; }
    const picked = pickOption(next, part.id, asking);
    setAsking(null);
    setWrong(false);
    onChange(picked);
    onPicked?.(part.options.find(o => o.id === asking));
  };

  const check = part.lesson.check;
  return (
    <View style={{ marginBottom: s.md }}>
      <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: 6 }}>{part.label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {part.options.map(o => {
          const on = build.picks[part.id] === o.id;
          const open = isOptionOpen(lookAtPart(build, part.id), part.id, o.id);
          return (
            <TouchableOpacity key={o.id} onPress={() => choose(o)} accessibilityRole="button" accessibilityState={{ selected: on }}
              accessibilityLabel={open ? `${part.label}: ${o.label}` : `${o.label}, not yet. Answer one question to open it`}
              style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: r.md,
                borderWidth: 1.5, borderStyle: open ? 'solid' : 'dashed', borderColor: on ? accent.primary : c.border,
                backgroundColor: on ? accent.primary + '14' : c.bg0 }, on && shadows.sm]}>
              {!!o.accent && (
                <View style={{ width: 16, height: 16, borderRadius: 5, backgroundColor: o.bg, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: o.accent }} />
                </View>
              )}
              {!open && <Ionicons name="lock-closed" size={11} color={c.text3} />}
              <Text style={{ fontSize: t.xs, fontWeight: on ? t.bold : t.semibold, color: on ? accent.primary : open ? c.text2 : c.text3 }}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!asking && (
        <View style={{ marginTop: s.sm, padding: s.md, borderRadius: r.lg, backgroundColor: accent.primary + '0f', borderWidth: 1, borderColor: accent.primary + '44' }}>
          <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary, marginBottom: 4 }}>
            Open “{part.options.find(o => o.id === asking)?.label}”: one question
          </Text>
          <RichText style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }} boldStyle={{ color: c.text1 }}>{part.lesson.says}</RichText>
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginTop: s.sm }}>{check.q}</Text>
          {check.options.map((label, i) => (
            <TouchableOpacity key={label} onPress={() => answer(i)} accessibilityRole="button" accessibilityLabel={label}
              style={{ marginTop: 6, padding: s.sm, borderRadius: r.md, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ fontSize: t.sm, color: c.text1 }}>{label}</Text>
            </TouchableOpacity>
          ))}
          {wrong && <Text style={{ fontSize: t.xs, color: c.text2, marginTop: 6 }}>Not quite. Read it once more and try again when you're ready.</Text>}
        </View>
      )}
    </View>
  );
}
