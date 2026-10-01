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

import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { successHaptic } from '../logic/haptics';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTour } from '../../context/TourContext';
import { shareText, milestoneText } from '../logic/shareOut';

export default function LevelUpNotification() {
  const { colors: c } = useTheme();
  const { progressEvents, dismissProgressEvent } = useUserProgress();
  const s = makeStyles(c);

  // Waits while the guide or a tour is talking: a Modal paints over the
  // overlay, and "Level Up!" landed on top of the guide's "claim your goal"
  // bubble. It shows the moment that walkthrough ends.
  const { active: tourActive } = useTour();
  const event = progressEvents?.[0];
  const shownKey = event && !tourActive ? JSON.stringify(event) : null;
  useEffect(() => { if (shownKey) successHaptic(); }, [shownKey]);
  if (!event || tourActive) return null;

  const isLevel = event.type === 'level';
  const shareable = isLevel || !!event.newTier;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismissProgressEvent}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.ornament}>✦ · ✦</Text>
          <Text style={s.bigEmoji}>{isLevel ? '⭐' : event.newTier ? (event.rankLabel?.emoji || '🏆') : '🎁'}</Text>
          <Text style={s.title}>{isLevel ? 'Level Up!' : event.newTier ? 'New Tier!' : 'Unlocked!'}</Text>
          <Text style={s.subtitle}>
            {isLevel
              ? `You reached Level ${event.to}`
              : event.newTier
                ? `You're now ${event.rankLabel?.label || `Rank ${event.to}`}`
                : 'Your points opened something new'}
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

          <TouchableOpacity style={s.btn} onPress={dismissProgressEvent} activeOpacity={0.85} accessibilityRole="button">
            <Text style={s.btnText}>Nice!</Text>
          </TouchableOpacity>
          {shareable && (
            <ShareMilestone
              text={milestoneText(isLevel ? 'level' : 'tier', isLevel ? event.to : (event.rankLabel?.label || `Rank ${event.to}`))}
              s={s}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// Says "Copied" when the share sheet wasn't there and it went to the clipboard.
function ShareMilestone({ text, s }) {
  const [note, setNote] = useState(null);
  return (
    <TouchableOpacity
      style={s.shareBtn}
      accessibilityRole="button"
      onPress={async () => {
        const res = await shareText({ title: 'Deskartes', message: text });
        setNote(res === 'copied' ? 'Copied, paste it anywhere' : null);
      }}
    >
      <Text style={s.shareText}>{note || 'Share it'}</Text>
    </TouchableOpacity>
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
  shareBtn:   { marginTop: 10, paddingVertical: 10, paddingHorizontal: 16 },
  shareText:  { fontSize: 14, fontWeight: '700', color: c.gold, textAlign: 'center' },
});
