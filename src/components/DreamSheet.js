// src/components/DreamSheet.js
// Writing (or changing) your dream: the life you want in your own words,
// 1-3 things in it to work toward, what matters most, what you won't trade,
// and who you're becoming. Every field optional; rough is fine.
//
// If the Wayfinder has answers and a field is still empty, a "Sound like
// you?" draft offers to fill those fields (src/logic/dream.js
// draftFromWayfinder). It never overwrites anything already written.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './ui';
import RichText from './RichText';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { loadWayfinder } from '../api/wayfinderService';
import { VALUES, VALUE_MAP } from '../data/wayfinder';
import { LIFE_ZONE_MAP } from '../data/wayfinderDeeper';
import {
  DREAM_NAME, MAX_PARTS, MAX_DREAM_VALUES, MAX_WONT_TRADE, draftFromWayfinder, emptyDream, newPartId,
} from '../logic/dream';

const PART_EXAMPLES = ['the farm', 'steady money', 'time with my kids'];
const WONT_EXAMPLES = ['Sundays with my kids', 'my health', 'working for myself'];

// Their value ids read as labels; anything they typed themselves stays as is.
export const valueLabel = (v) => VALUE_MAP[v]?.label || v;

// Shows one more empty box than there are filled ones, up to the max, so a
// list never looks like homework.
const visibleRows = (list, max) => Math.min(max, Math.max(1, list.filter(x => (x.label ?? x).trim()).length + 1));

export default function DreamSheet({ visible, onClose, dream, onSave, userId }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const [life, setLife] = useState('');
  const [parts, setParts] = useState([]);
  const [values, setValues] = useState([]);
  const [wont, setWont] = useState([]);
  const [becoming, setBecoming] = useState('');
  const [wf, setWf] = useState(null);
  const [usedDraft, setUsedDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftNo, setDraftNo] = useSetting(SETTING_KEYS.DREAM_DRAFT_DISMISSED, false);

  // Fresh copy each time it opens.
  useEffect(() => {
    if (!visible) return;
    const d = dream || emptyDream();
    setLife(d.life || '');
    setParts(d.parts?.length ? d.parts.map(p => ({ ...p })) : []);
    setValues(d.values || []);
    setWont(d.wontTrade || []);
    setBecoming(d.becoming || '');
    setUsedDraft(false);
    setSaving(false);
    loadWayfinder(userId).then(setWf).catch(() => setWf(null));
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // The draft compares against what's in the boxes now, so it disappears
  // once those fields are filled (by the draft or by hand).
  const draft = useMemo(() => (
    draftNo || usedDraft ? null : draftFromWayfinder(
      { life, parts: parts.filter(p => p.label.trim()), values, wontTrade: wont, becoming },
      wf, (id) => LIFE_ZONE_MAP[id]?.label || id,
    )
  ), [wf, draftNo, usedDraft, life, parts, values, wont, becoming]);

  const useDraft = () => {
    if (draft.values) setValues(draft.values);
    if (draft.becoming) setBecoming(draft.becoming);
    if (draft.parts) setParts(draft.parts.map(label => ({ id: newPartId(), label })));
    setUsedDraft(true);
  };

  const setPart = (i, label) => setParts((prev) => {
    const next = [...prev];
    next[i] = { id: next[i]?.id || newPartId(), label };
    return next;
  });
  const setWontAt = (i, text) => setWont((prev) => { const next = [...prev]; next[i] = text; return next; });
  const toggleValue = (id) => setValues((prev) => (
    prev.includes(id) ? prev.filter(v => v !== id) : prev.length >= MAX_DREAM_VALUES ? prev : [...prev, id]
  ));

  const save = async () => {
    setSaving(true);
    try {
      await onSave?.({
        life,
        parts: parts.filter(p => p.label.trim()),
        values,
        wontTrade: wont,
        becoming,
      }, usedDraft ? 'wayfinder' : 'typed');
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const input = { fontSize: t.md, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md };
  const label = (md) => (
    <RichText style={{ fontSize: t.sm, color: c.text2, marginTop: s.lg, marginBottom: s.sm }} boldStyle={{ color: c.text1 }}>{md}</RichText>
  );
  const partRows = visibleRows(parts, MAX_PARTS);
  const wontRows = visibleRows(wont, MAX_WONT_TRADE);
  // Values they typed themselves (not Wayfinder ids) still show, picked.
  const ownValues = values.filter(v => !VALUE_MAP[v]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: c.overlay || 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={onClose} accessibilityLabel="Close" />
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: s.lg, paddingBottom: s.xs }}>
            <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>{DREAM_NAME}</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={8}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
          </View>
          <ScrollView automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: s.lg, paddingBottom: s.xxl }}>
            <RichText style={{ fontSize: t.sm, color: c.text3 }} boldStyle={{ color: c.text2 }}>
              **Rough is fine.** Change it any time. Only you see it.
            </RichText>

            {!!draft && (
              <View style={{ marginTop: s.md, padding: s.md, borderRadius: r.lg, backgroundColor: accent.primaryLight, borderWidth: 1, borderColor: accent.primary + '55' }}>
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Sound like you?</Text>
                <Text style={{ fontSize: 12, color: c.text2, marginTop: 2, marginBottom: s.sm }}>From your Wayfinder answers.</Text>
                {!!draft.values && <Text style={{ fontSize: t.sm, color: c.text1 }}>Matters most: <Text style={{ fontWeight: t.bold }}>{draft.values.map(valueLabel).join(', ')}</Text></Text>}
                {!!draft.parts && <Text style={{ fontSize: t.sm, color: c.text1, marginTop: 2 }}>Working toward: <Text style={{ fontWeight: t.bold }}>{draft.parts.join(', ')}</Text></Text>}
                {!!draft.becoming && <Text style={{ fontSize: t.sm, color: c.text1, marginTop: 2 }}>Becoming: <Text style={{ fontWeight: t.bold }}>{draft.becoming}</Text></Text>}
                <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md }}>
                  <Button label="Use it" size="sm" fullWidth={false} onPress={useDraft} />
                  <Button label="Not me" size="sm" variant="ghost" fullWidth={false} onPress={() => setDraftNo(true)} />
                </View>
              </View>
            )}

            {label('A normal **Tuesday** in the life you want')}
            <TextInput
              value={life} onChangeText={setLife} multiline maxLength={600}
              placeholder="e.g. Up early on a small farm. Fix a neighbor's truck. Home by 5 for dinner."
              placeholderTextColor={c.text4} accessibilityLabel="A normal Tuesday in the life you want"
              style={[input, { minHeight: 96, textAlignVertical: 'top' }]}
            />

            {label('**1-3 things** in that life to work toward')}
            {Array.from({ length: partRows }).map((_, i) => (
              <TextInput key={`part-${i}`}
                value={parts[i]?.label || ''} onChangeText={(v) => setPart(i, v)} maxLength={80}
                placeholder={`e.g. ${PART_EXAMPLES[i]}`} placeholderTextColor={c.text4}
                accessibilityLabel={`Thing to work toward ${i + 1}`}
                style={[input, { marginBottom: s.sm }]}
              />
            ))}

            {label(`What matters most · pick **up to ${MAX_DREAM_VALUES}**`)}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
              {[...ownValues.map(v => ({ id: v, label: v })), ...VALUES].map((v) => {
                const on = values.includes(v.id);
                return (
                  <TouchableOpacity key={v.id} onPress={() => toggleValue(v.id)}
                    accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={v.label}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: r.full, borderWidth: 1,
                      borderColor: on ? accent.primary : c.border, backgroundColor: on ? accent.primaryLight : 'transparent' }}>
                    <Text style={{ fontSize: 13, fontWeight: on ? t.bold : t.medium, color: on ? c.text1 : c.text2 }}>
                      {v.emoji ? `${v.emoji} ` : ''}{v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {label("What you **won't trade** for it")}
            {Array.from({ length: wontRows }).map((_, i) => (
              <TextInput key={`wont-${i}`}
                value={wont[i] || ''} onChangeText={(v) => setWontAt(i, v)} maxLength={80}
                placeholder={`e.g. ${WONT_EXAMPLES[i]}`} placeholderTextColor={c.text4}
                accessibilityLabel={`Something you won't trade ${i + 1}`}
                style={[input, { marginBottom: s.sm }]}
              />
            ))}

            {label("Who you're **becoming**")}
            <TextInput
              value={becoming} onChangeText={setBecoming} maxLength={80}
              placeholder="e.g. someone who finishes things" placeholderTextColor={c.text4}
              accessibilityLabel="Who you're becoming"
              style={input}
            />

            <Button label="Save" icon="checkmark" busy={saving} onPress={save} style={{ marginTop: s.xl }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
