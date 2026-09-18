// src/components/lifeareas/ActionEditSheet.js
//
// "Make it yours": every action this sub-section offers this person, and
// what they can change about each one —
//   star     pin it to the top (it becomes a Today's-action candidate)
//   eye      hide it (it can come back any time)
//   title    reword it in their own words
//   time     change a reminder's time, or a timer's length
//   reset    back to the original wording
// plus adding their own. Stored per person in user_area_actions; the pool
// itself is never touched.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { FONTS } from '../../theme';
import { formatTime } from '../../api/areaActionsService';
import { INK, tierLabel, tierColor } from './actionUi';

const TIER_ORDER = { step: 0, quick: 1, learn: 2, habit: 3 };
const ADD_TIERS = ['habit', 'quick', 'step'];
const validTime = s => /^([01]?\d|2[0-3]):[0-5]\d$/.test(s.trim());
const toHHMM = s => { const [h, m] = s.trim().split(':'); return `${String(h).padStart(2, '0')}:${m}`; };

function Row({ action, aa, color, c, t, r, onError }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(action.title);
  const [timeDraft, setTimeDraft] = useState(action.payload?.time || '');
  const accent = tierColor(action.tier, c, color);
  const guard = p => p.catch(e => onError(e?.message || 'Couldn’t save that.'));

  const saveTitle = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === action.title) return;
    guard(aa.reword(action, { title: next }));
  };

  return (
    <View style={{ backgroundColor: c.bg0, borderWidth: 1, borderColor: action.pinned ? c.gold + '99' : c.border, borderRadius: r.lg, padding: 12, opacity: action.hidden ? 0.5 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: accent }}>{tierLabel(action.tier, aa.band)}</Text>
            {action.custom && <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: c.gold }}>YOURS</Text>}
            {action.edited && <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: c.gold }}>EDITED</Text>}
            {action.hidden && <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: c.text3 }}>HIDDEN</Text>}
          </View>

          {editing ? (
            <View style={{ marginTop: 6, gap: 8 }}>
              <TextInput value={draft} onChangeText={setDraft} autoFocus maxLength={120}
                onSubmitEditing={saveTitle} returnKeyType="done" accessibilityLabel="Action wording"
                style={{ fontSize: t.md, color: c.text1, backgroundColor: c.bg1, borderWidth: 1, borderColor: color + '88', borderRadius: r.md, paddingHorizontal: 10, paddingVertical: 8 }} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => { setDraft(action.title); setEditing(false); }} style={{ flex: 1, minHeight: 40, borderRadius: r.md, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: t.sm, color: c.text2 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveTitle} style={{ flex: 2, minHeight: 40, borderRadius: r.md, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: INK }}>Save wording</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setDraft(action.title); setEditing(true); }} accessibilityRole="button" accessibilityHint="Reword this action">
              <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1, marginTop: 3, lineHeight: 20, textDecorationLine: action.hidden ? 'line-through' : 'none' }}>
                {action.title} <Ionicons name="pencil" size={12} color={c.text4} />
              </Text>
            </TouchableOpacity>
          )}

          {action.handler === 'reminder' && !action.hidden && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Ionicons name="time-outline" size={14} color={c.text3} />
              <TextInput value={timeDraft} onChangeText={setTimeDraft} placeholder="22:30" placeholderTextColor={c.text4}
                keyboardType="numbers-and-punctuation" maxLength={5} accessibilityLabel="Reminder time, 24-hour"
                onEndEditing={() => { if (validTime(timeDraft) && toHHMM(timeDraft) !== action.payload?.time) guard(aa.retime(action, { time: toHHMM(timeDraft) })); }}
                style={{ width: 70, fontFamily: FONTS.mono, fontSize: t.sm, color: c.text1, backgroundColor: c.bg1, borderWidth: 1, borderColor: validTime(timeDraft) ? c.border : c.gold, borderRadius: r.sm, paddingHorizontal: 8, paddingVertical: 5 }} />
              <Text style={{ fontSize: t.xs, color: c.text3 }}>{validTime(timeDraft) ? formatTime(toHHMM(timeDraft)) : '24-hour, like 22:30'}</Text>
            </View>
          )}

          {action.handler === 'timer' && !action.hidden && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <TouchableOpacity onPress={() => guard(aa.retime(action, { minutes: Math.max(1, (action.payload?.minutes || 5) - 1) }))}
                accessibilityRole="button" accessibilityLabel="One minute shorter"
                style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="remove" size={16} color={c.text2} />
              </TouchableOpacity>
              <Text style={{ fontFamily: FONTS.mono, fontSize: t.sm, color: c.text1, minWidth: 54, textAlign: 'center' }}>{action.payload?.minutes} min</Text>
              <TouchableOpacity onPress={() => guard(aa.retime(action, { minutes: Math.min(120, (action.payload?.minutes || 5) + 1) }))}
                accessibilityRole="button" accessibilityLabel="One minute longer"
                style={{ width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={16} color={c.text2} />
              </TouchableOpacity>
            </View>
          )}

          {action.edited && !editing && (
            <TouchableOpacity onPress={() => guard(aa.reset(action)).then(() => setTimeDraft(action.original?.payload?.time || ''))}
              style={{ alignSelf: 'flex-start', paddingVertical: 6 }}>
              <Text style={{ fontSize: t.xs, color: c.text3, textDecorationLine: 'underline' }}>Back to the original: “{action.original?.title}”</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => guard(aa.togglePin(action))} accessibilityRole="button"
          accessibilityLabel={action.pinned ? `Unpin ${action.title}` : `Pin ${action.title}`}
          style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: action.pinned ? c.gold : c.border, backgroundColor: action.pinned ? c.gold + '22' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={action.pinned ? 'star' : 'star-outline'} size={17} color={action.pinned ? c.gold : c.text3} />
        </TouchableOpacity>
        {action.custom ? (
          <TouchableOpacity onPress={() => guard(aa.removeCustom(action))} accessibilityRole="button" accessibilityLabel={`Delete ${action.title}`}
            style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trash-outline" size={17} color={c.text3} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => guard(aa.toggleHidden(action))} accessibilityRole="button"
            accessibilityLabel={action.hidden ? `Show ${action.title}` : `Hide ${action.title}`}
            style={{ width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={action.hidden ? 'eye-off-outline' : 'eye-outline'} size={17} color={c.text3} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ActionEditSheet({ visible, onClose, aa, color, title }) {
  const { colors: c, typography: t, radius: r } = useTheme();
  const [newTitle, setNewTitle] = useState('');
  const [newTier, setNewTier] = useState('habit');
  const [error, setError] = useState(null);

  const sorted = aa.all.slice().sort((a, b) =>
    (Number(a.hidden) - Number(b.hidden))
    || (Number(b.pinned) - Number(a.pinned))
    || ((TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9))
    || ((a.sort_order ?? 0) - (b.sort_order ?? 0)));

  const add = () => {
    if (!newTitle.trim()) return;
    aa.addCustom({ title: newTitle, tier: newTier }).catch(e => setError(e?.message || 'Couldn’t add that.'));
    setNewTitle('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', paddingTop: 10 }}>
          <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1 }}>Make it yours</Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>
                {aa.userId ? `${title} · only you see these changes` : 'Sign in to keep these changes — guest changes last this visit'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Done editing"
              style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: r.md, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: INK }}>Done</Text>
            </TouchableOpacity>
          </View>

          {!!error && (
            <TouchableOpacity onPress={() => setError(null)} style={{ marginHorizontal: 20, marginBottom: 8, padding: 10, borderRadius: r.md, backgroundColor: c.gold + '22' }}>
              <Text style={{ fontSize: t.sm, color: c.text1 }}>{error} (tap to dismiss)</Text>
            </TouchableOpacity>
          )}

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 36, gap: 8 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: 2, paddingHorizontal: 4 }}>
              Star to pin one to the top. Tap the wording to change it. Hidden ones can come back any time.
            </Text>
            {sorted.map(a => (
              <Row key={a.key} action={a} aa={aa} color={color} c={c} t={t} r={r} onError={setError} />
            ))}

            <View style={{ marginTop: 10, padding: 12, borderRadius: r.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, gap: 10 }}>
              <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Add your own</Text>
              <TextInput value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Read 10 pages before sleep"
                placeholderTextColor={c.text4} maxLength={120} onSubmitEditing={add} returnKeyType="done"
                accessibilityLabel="Your own action"
                style={{ fontSize: t.md, color: c.text1, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border, borderRadius: r.md, paddingHorizontal: 10, paddingVertical: 9 }} />
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {ADD_TIERS.map(tier => (
                  <TouchableOpacity key={tier} onPress={() => setNewTier(tier)} accessibilityRole="radio" accessibilityState={{ checked: newTier === tier }}
                    style={{ minHeight: 34, paddingHorizontal: 12, borderRadius: r.full, borderWidth: 1, borderColor: newTier === tier ? color : c.border, backgroundColor: newTier === tier ? color + '22' : 'transparent', justifyContent: 'center' }}>
                    <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: newTier === tier ? c.text1 : c.text3 }}>{tierLabel(tier, aa.band)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={add} disabled={!newTitle.trim()} accessibilityRole="button" accessibilityLabel="Add your action"
                style={{ minHeight: 44, borderRadius: r.md, backgroundColor: color, alignItems: 'center', justifyContent: 'center', opacity: newTitle.trim() ? 1 : 0.45 }}>
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: INK }}>Add it</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
