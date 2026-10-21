// src/screens/studio/PartSheet.js
// Taking one part of a Build apart: how it works in under 40 words, the
// thing itself live at the top so every change shows at once, the options
// they can use now, and one question that opens the upgrades.
//
// Opening the sheet is "looking", which makes the part theirs
// (src/logic/builds.js lookAtPart). A wrong answer costs nothing.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import RichText from '../../components/RichText';
import BuildPreview from '../../components/BuildPreview';
import {
  lookAtPart, pickOption, answerCheck, isOptionOpen, partLevel, LEVEL_MADE, LEVEL_MASTERED,
} from '../../logic/builds';

export default function PartSheet({ visible, build, part, html, petName, onSignal, onChange, onClose }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const [result, setResult] = useState(null); // null | 'right' | 'wrong'
  const [chosen, setChosen] = useState(null);

  // Looking at a part makes it theirs.
  useEffect(() => {
    if (!visible || !part) return;
    setResult(null);
    setChosen(null);
    if (partLevel(build, part.id) === LEVEL_MADE) {
      onChange(lookAtPart(build, part.id));
      onSignal?.('build-part-looked', { kind: build.kind, part: part.id });
    }
  }, [visible, part?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!part || !build) return null;
  const lv = partLevel(build, part.id);
  const check = part.lesson.check;

  const answer = (i) => {
    setChosen(i);
    const out = answerCheck(build, part.id, i);
    setResult(out.right ? 'right' : 'wrong');
    if (out.right) {
      if (partLevel(build, part.id) < LEVEL_MASTERED) onSignal?.('build-part-mastered', { kind: build.kind, part: part.id });
      onChange(out.build);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: c.overlay || 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={onClose} accessibilityLabel="Close" />
      <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: s.lg, paddingBottom: s.sm }}>
          <Ionicons name={part.icon} size={20} color={accent.primary} style={{ marginRight: s.sm }} />
          <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>{part.label}</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={8}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: s.lg, paddingBottom: s.xxl }}>
          <BuildPreview html={html} height={220} scroll={build.kind !== 'game'} />

          <RichText style={{ fontSize: t.md, color: c.text2, marginTop: s.lg, lineHeight: 22 }} boldStyle={{ color: c.text1 }}>
            {part.lesson.says}
          </RichText>
          <Text style={{ fontSize: t.sm, color: accent.primary, fontWeight: t.semibold, marginTop: s.md }}>
            Try it: {part.lesson.tryIt}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.md }}>
            {part.options.map(o => {
              const open = isOptionOpen(build, part.id, o.id);
              const on = build.picks[part.id] === o.id;
              const label = o.fromPet && petName ? `Your pet · ${petName}` : o.label;
              return (
                <TouchableOpacity
                  key={o.id}
                  disabled={!open || on}
                  onPress={() => onChange(pickOption(build, part.id, o.id))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on, disabled: !open }}
                  accessibilityLabel={open ? label : `${label}, opens when you pass the check`}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: r.full, borderWidth: 1,
                    borderColor: on ? accent.primary : c.border,
                    backgroundColor: on ? accent.primaryLight : 'transparent',
                    opacity: open ? 1 : 0.55,
                  }}
                >
                  {!open && <Ionicons name="lock-closed-outline" size={12} color={c.text3} />}
                  <Text style={{ fontSize: t.sm, fontWeight: on ? t.bold : t.medium, color: on ? c.text1 : c.text2 }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: s.xl, padding: s.md, borderRadius: r.lg, backgroundColor: c.bg0, borderWidth: 0.5, borderColor: c.border }}>
            {lv >= LEVEL_MASTERED && result !== 'right' ? (
              <RichText style={{ fontSize: t.sm, color: c.text2 }} boldStyle={{ color: c.text1 }}>
                **Mastered.** Every option here is yours.
              </RichText>
            ) : (
              <>
                <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3 }}>Open the upgrades</Text>
                <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1, marginTop: 4, marginBottom: s.sm }}>{check.q}</Text>
                {check.options.map((label, i) => {
                  const picked = chosen === i;
                  const tone = picked && result === 'right' ? accent.primary : picked && result === 'wrong' ? c.error : c.border;
                  return (
                    <TouchableOpacity
                      key={label}
                      onPress={() => answer(i)}
                      disabled={result === 'right'}
                      accessibilityRole="button"
                      accessibilityState={{ selected: picked }}
                      style={{ padding: s.md, borderRadius: r.md, borderWidth: 1, borderColor: tone, marginBottom: s.sm, backgroundColor: c.bg1 }}
                    >
                      <Text style={{ fontSize: t.sm, color: c.text1 }}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
                {result === 'right' && (
                  <RichText style={{ fontSize: t.sm, color: c.text1, marginTop: 4 }} boldStyle={{ color: accent.primary }}>
                    **Got it.** The upgrades are open. Try one.
                  </RichText>
                )}
                {result === 'wrong' && (
                  <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 4 }}>
                    Not quite. Read the top again, then pick another.
                  </Text>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
