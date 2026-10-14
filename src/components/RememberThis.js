// src/components/RememberThis.js
// Inside Home's Today's Wisdom card: one of your own takeaways, brought back
// on a spaced schedule (api/knowledgeUse.js). It asks first and shows second,
// because trying to recall something is what makes it stick. Nothing due →
// `children` (the daily quote) shows as before.
//
//   <RememberThis userId navigation ui>{quote}</RememberThis>

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTakeawayRows, pickRemember, markReviewed, usesOf, nextGapDays } from '../api/knowledgeUse';
import { openTarget } from '../logic/openTarget';
import { successHaptic, tapHaptic } from '../logic/haptics';
import { textOn } from '../logic/contrast';

export default function RememberThis({ userId, navigation, ui = {}, children }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [item, setItem] = useState(null);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [doneMsg, setDoneMsg] = useState(null);

  useFocusEffect(useCallback(() => {
    let live = true;
    if (userId) getTakeawayRows(userId).then(rows => { if (live) { setItem(pickRemember(rows)); setShown(false); setDoneMsg(null); } });
    return () => { live = false; };
  }, [userId]));

  const finish = async (used) => {
    if (!item) return;
    setBusy(true);
    try {
      const meta = await markReviewed(item.id, { used });
      const days = nextGapDays(meta);
      const back = `Back in ${days} day${days === 1 ? '' : 's'}.`;
      if (used) {
        successHaptic();
        setDoneMsg({ used: true, lead: 'Nice.', text: `Used ${usesOf({ url_meta: meta }).length}×. ${back}` });
      } else {
        setDoneMsg({ lead: 'Okay.', text: back });
      }
    } catch (e) { console.warn('[RememberThis]', e?.message); }
    setBusy(false);
    setItem(null);
  };

  if (doneMsg) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={doneMsg.used ? 'checkmark-done' : 'time-outline'} size={15} color={doneMsg.used ? c.success || c.teal : c.text3} />
        <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}><Text style={{ fontWeight: t.bold }}>{doneMsg.lead}</Text> {doneMsg.text}</Text>
      </View>
    );
  }
  if (!item) return children;

  const takeaway = item.url_meta.takeaway;
  const useWhen = item.url_meta.use_when;
  const pill = (label, icon, onPress, filled) => (
    <TouchableOpacity key={label} onPress={onPress} disabled={busy} accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: r.full,
               borderWidth: 1, borderColor: c.teal, backgroundColor: filled ? c.teal : 'transparent', opacity: busy ? 0.5 : 1 }}>
      <Ionicons name={icon} size={14} color={filled ? textOn(c.teal) : c.teal} />
      <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: filled ? textOn(c.teal) : c.teal }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <Text style={{ fontSize: ui.name === 'plain' ? 12 : 10, color: c.gold, ...ui.eyebrow, marginBottom: 6 }}>Remember this?</Text>
      {/* The source, never the answer: a journal line's title IS its
          takeaway, so that one is named by its date instead. */}
      <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>
        {item.title && item.title.trim() !== takeaway.trim() && item.url_meta.from !== 'journal'
          ? <>The one thing from <Text style={{ fontWeight: t.bold, color: c.text1 }}>{item.title}</Text></>
          : <>Something you learned on <Text style={{ fontWeight: t.bold, color: c.text1 }}>{new Date(item.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text></>}
      </Text>
      {!shown ? (
        <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>
          {pill('Show me', 'eye-outline', () => { tapHaptic(); setShown(true); }, true)}
        </View>
      ) : (
        <>
          <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, lineHeight: 22, marginTop: s.sm }}>{takeaway}</Text>
          {!!useWhen && (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              <Ionicons name="flash-outline" size={13} color={c.teal} style={{ marginTop: 3 }} />
              <Text style={{ flex: 1, fontSize: t.sm, color: c.text2, lineHeight: 20 }}>{useWhen}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.md }}>
            {busy ? <ActivityIndicator color={c.teal} /> : <>
              {pill('I used it', 'checkmark', () => finish(true), true)}
              {/* Planning it counts as seeing it, so it doesn't ask again tomorrow. */}
              {pill('Plan it', 'calendar-outline', () => { markReviewed(item.id).catch(() => {}); openTarget(navigation, { kind: 'vault', id: item.id }); })}
              {pill('Not now', 'time-outline', () => finish(false))}
            </>}
          </View>
        </>
      )}
    </View>
  );
}
