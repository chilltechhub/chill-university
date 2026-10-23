// src/components/PickPathNote.js
// A one-time note on Home for an account made before the welcome
// (docs/shake-up-plan-2026-10-21.md §7.2 Boot): "Pick your path". Not a
// wizard: one tap writes profiles.metadata.path_key, "Not now" closes it,
// and either way it doesn't come back (PICK_PATH_NOTE_SEEN, synced). New
// accounts already have a path from the welcome, so they never see it.
// Nothing reads the path yet; it's there for the tailoring that lands in
// P3 and P6.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import RichText from './RichText';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { mergeProfileMetadata } from '../api/accessService';
import { PATH_KITS } from '../data/pathKits';

export default function PickPathNote({ userId, style }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { profile, refreshProfile } = useUserProgress();
  const [seen, setSeen, ready] = useSetting(SETTING_KEYS.PICK_PATH_NOTE_SEEN, false);
  const [picked, setPicked] = useState(null);

  if (!userId || !ready || !profile || (seen && !picked)) return null;
  if (profile.metadata?.path_key && !picked) return null;

  const pick = async (key) => {
    setPicked(key);
    setSeen(true);
    await mergeProfileMetadata(userId, { path_key: key });
    try { await refreshProfile?.(); } catch { /* the note already says it's saved */ }
  };

  if (picked) {
    return (
      <View style={[{ marginHorizontal: s.lg, padding: s.md, borderRadius: r.lg, backgroundColor: accent.primary + '14' }, style]}>
        <RichText style={{ fontSize: t.sm, color: c.text1 }} boldStyle={{ color: accent.primary }}>
          {`Saved. Your path: **${PATH_KITS[picked].label}**.`}
        </RichText>
      </View>
    );
  }

  return (
    <View style={[{ marginHorizontal: s.lg, padding: s.lg, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 1, borderColor: accent.primary }, style]}>
      <RichText style={{ fontSize: t.md, color: c.text1 }} boldStyle={{ color: accent.primary }}>
        **Pick your path.** One at a time, a step a day.
      </RichText>
      <View style={{ marginTop: s.sm, gap: 6 }}>
        {Object.entries(PATH_KITS).map(([key, kit]) => (
          <TouchableOpacity key={key} onPress={() => pick(key)} accessibilityRole="button" accessibilityLabel={`${kit.label}. ${kit.blurb}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.sm, borderRadius: r.md, backgroundColor: c.bg0 }}>
            <Ionicons name={kit.icon} size={16} color={accent.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{kit.label}</Text>
              <Text style={{ fontSize: t.xs, color: c.text3 }}>{kit.blurb}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity onPress={() => setSeen(true)} accessibilityRole="button" style={{ alignSelf: 'flex-start', marginTop: s.sm, paddingVertical: 4 }}>
        <Text style={{ fontSize: t.sm, color: c.text3 }}>Not now</Text>
      </TouchableOpacity>
    </View>
  );
}
