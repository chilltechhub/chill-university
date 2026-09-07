// src/components/LevelUpNotification.js
// Celebratory in-app popup for a level-up or rank-up, mounted once near
// the app root (see App.js, alongside MissionsOverlay). Reads its queue
// from UserProgressContext — `checkProgressEvents` there compares each
// fresh profile load against the last one it saw and pushes an event
// here whenever level or rank actually improved; useGame's endGame()
// refreshes the profile right after a session ends, which is what makes
// a level-up notification able to appear right after finishing a game,
// not just on next app launch.
//
// Shows one event at a time — `dismissProgressEvent` pops the queue, so
// a session that crossed two thresholds at once (e.g. leveled up AND
// ranked up from one big game) shows them back to back instead of
// merging into one confusing popup.

import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';

export default function LevelUpNotification() {
  const { colors: c } = useTheme();
  const { progressEvents, dismissProgressEvent } = useUserProgress();
  const s = makeStyles(c);

  const event = progressEvents?.[0];
  if (!event) return null;

  const isLevel = event.type === 'level';

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismissProgressEvent}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.ornament}>✦ · ✦</Text>
          <Text style={s.bigEmoji}>{isLevel ? '⭐' : (event.rankLabel?.emoji || '🏆')}</Text>
          <Text style={s.title}>{isLevel ? 'Level Up!' : 'Rank Up!'}</Text>
          <Text style={s.subtitle}>
            {isLevel
              ? `You reached Level ${event.to}`
              : `You're now ${event.rankLabel?.label || `Rank ${event.to}`}`}
          </Text>

          {event.unlocks.length > 0 && (
            <View style={s.unlockBox}>
              <Text style={s.unlockLabel}>🎁 You unlocked</Text>
              {event.unlocks.map((u, i) => (
                <View key={i} style={s.unlockRow}>
                  <Text style={s.unlockEmoji}>{u.emoji}</Text>
                  <Text style={s.unlockName}>{u.name}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={s.btn} onPress={dismissProgressEvent} activeOpacity={0.85}>
            <Text style={s.btnText}>Nice!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c) => StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card:       { width: '100%', maxWidth: 340, backgroundColor: c.bg1, borderRadius: 20, borderWidth: 1.5, borderColor: c.gold, padding: 26, alignItems: 'center' },
  ornament:   { fontSize: 12, color: c.gold, letterSpacing: 8, marginBottom: 10 },
  bigEmoji:   { fontSize: 48, marginBottom: 8 },
  title:      { fontSize: 22, fontWeight: '800', color: c.text1, marginBottom: 4 },
  subtitle:   { fontSize: 14, color: c.text3, marginBottom: 18, textAlign: 'center' },
  unlockBox:  { width: '100%', backgroundColor: c.bg2, borderRadius: 14, borderWidth: 0.5, borderColor: c.border, padding: 14, marginBottom: 18 },
  unlockLabel:{ fontSize: 11, color: c.gold, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  unlockRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  unlockEmoji:{ fontSize: 16 },
  unlockName: { fontSize: 13, color: c.text1, fontWeight: '600' },
  btn:        { width: '100%', backgroundColor: c.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnText:    { fontSize: 15, fontWeight: '800', color: c.bg1 },
});
