// src/components/HandInMoment.js
// The one celebration (docs/shake-up-plan-2026-10-21.md §6, P6): handing in
// a unit's work. It names what you made and says one mentor line. No score,
// no level. From here you can show it (it goes on your Showcase and counts
// as shown) or share it. Since P9 (§9, "one signature celebration") your
// four circles show under it, and "good at" fills a little: one more piece
// of handed-in work out of the next five.
//
// Calm view gets the same moment, quieter: no big icon.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { shareText, milestoneText } from '../logic/shareOut';
import { successHaptic } from '../logic/haptics';
import useDeliverables from '../logic/useDeliverables';
import { SCRIM, CircleFill } from '../ui';

const LINES = ['You finished it. Most people never start.', 'Handed in. That is real work, and it is yours.', 'Done and on your shelf. On to the next one.'];

export default function HandInMoment({ visible, deliverable, onShow, onClose }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const [homeView] = useSetting(SETTING_KEYS.HOME_VIEW, 'full');
  const calm = homeView === 'calm';
  const [note, setNote] = useState(null);
  const { list } = useDeliverables();
  const shown = deliverable?.status === 'shown';
  // "Good at" grows by one piece of handed-in work, five to a full circle.
  const handed = list.filter(d => d.status === 'handed' || d.status === 'shown').length;
  const fillTo = Math.min(1, handed / 5);
  const fillFrom = Math.min(1, Math.max(0, handed - 1) / 5);
  React.useEffect(() => { if (visible) { setNote(null); successHaptic?.(); } }, [visible]);
  if (!deliverable) return null;
  const line = LINES[(deliverable.title || '').length % LINES.length];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: SCRIM.strong, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 360, backgroundColor: c.bg1, borderRadius: 22, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: accent.primary }}>
          {!calm && (
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: accent.primary + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Ionicons name="checkmark-done" size={32} color={accent.primary} />
            </View>
          )}
          <Text style={{ fontSize: t.xs, fontWeight: '800', letterSpacing: 1.2, color: accent.primary }}>HANDED IN</Text>
          <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, textAlign: 'center', marginTop: 4 }}>{deliverable.title}</Text>
          <Text style={{ fontSize: t.sm, color: c.text2, textAlign: 'center', marginTop: 8, marginBottom: 14 }}>{line}</Text>
          {visible && <CircleFill fill="goodAt" from={fillFrom} to={fillTo} size={calm ? 34 : 42} style={{ marginBottom: 18 }} />}

          {!shown && onShow && (
            <TouchableOpacity onPress={onShow} accessibilityRole="button" accessibilityLabel="Show it on your Showcase"
              style={{ alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, backgroundColor: accent.primary, borderRadius: r.lg, paddingVertical: 13, marginBottom: 8 }}>
              <Ionicons name="star-outline" size={16} color={accent.onPrimary} />
              <Text style={{ fontSize: t.md, fontWeight: t.bold, color: accent.onPrimary }}>Show it</Text>
            </TouchableOpacity>
          )}
          {shown && <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary, marginBottom: 8 }}>On your Showcase.</Text>}
          <TouchableOpacity accessibilityRole="button"
            onPress={async () => {
              const res = await shareText({ title: 'Deskartes', message: milestoneText('handed', deliverable.title) });
              setNote(res === 'copied' ? 'Copied. Paste it anywhere.' : null);
            }}
            style={{ paddingVertical: 10 }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>{note || 'Share it'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" style={{ paddingVertical: 8 }}>
            <Text style={{ fontSize: t.sm, color: c.text3 }}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
