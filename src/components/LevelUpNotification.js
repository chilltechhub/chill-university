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
// Shows everything queued on one card (summarizeProgress), and only when
// nothing else from the same moment is waiting: a new stage or feature goes
// on UnlockNotification's card, with this level-up folded into it.

import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { successHaptic } from '../logic/haptics';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTour } from '../../context/TourContext';
import { useAccess } from '../../context/AccessContext';
import useCalmMoment from '../logic/useCalmMoment';
import { shareText, milestoneText } from '../logic/shareOut';

// Everything queued, as one thing to say. A session that crossed two
// thresholds at once (a level AND a rank that opened a background) used to
// show "Level Up!" and then "Unlocked!" back to back.
export function summarizeProgress(events) {
  const list = events || [];
  if (!list.length) return null;
  const levels = list.filter(e => e.type === 'level');
  const tiers = list.filter(e => e.type === 'rank' && e.newTier);
  const seen = new Set();
  const unlocks = list.flatMap(e => e.unlocks || []).filter(u => {
    const key = `${u.emoji}|${u.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const level = levels.length ? Math.max(...levels.map(e => e.to)) : null;
  const tier = tiers.length ? tiers[tiers.length - 1] : null;
  return { level, tier, unlocks };
}

export default function LevelUpNotification() {
  const { colors: c } = useTheme();
  const { progressEvents, dismissAllProgressEvents } = useUserProgress();
  const { stageEvents, unlockEvents } = useAccess();
  const s = makeStyles(c);

  // Waits while the guide or a tour is talking: a Modal paints over the
  // overlay, and "Level Up!" landed on top of the guide's "claim your goal"
  // bubble. It shows the moment that walkthrough ends.
  const { active: tourActive } = useTour();
  // A stage or feature card waiting too means the same moment opened
  // something: UnlockNotification puts this level-up on that card instead
  // of showing a second popup.
  const accessWaiting = !!(stageEvents?.length || unlockEvents?.some(e => e.feature));
  const summary = summarizeProgress(progressEvents);
  const ready = useCalmMoment(!!summary && !tourActive && !accessWaiting);
  const shownKey = ready ? JSON.stringify(progressEvents) : null;
  useEffect(() => { if (shownKey) successHaptic(); }, [shownKey]);
  if (!ready || !summary) return null;

  const { level, tier, unlocks } = summary;
  const shareable = level != null || !!tier;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismissAllProgressEvents}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.ornament}>✦ · ✦</Text>
          <Text style={s.bigEmoji}>{level != null ? '⭐' : tier ? (tier.rankLabel?.emoji || '🏆') : '🎁'}</Text>
          <Text style={s.title}>{level != null ? 'Level Up!' : tier ? 'New Tier!' : 'Unlocked!'}</Text>
          <Text style={s.subtitle}>
            {level != null
              ? `You reached Level ${level}${tier ? ` and ${tier.rankLabel?.label || 'a new tier'}` : ''}`
              : tier
                ? `You're now ${tier.rankLabel?.label || `Rank ${tier.to}`}`
                : 'Your points opened something new'}
          </Text>

          {unlocks.length > 0 && (
            <View style={s.unlockBox}>
              <Text style={s.unlockLabel}>🎁 You unlocked</Text>
              {unlocks.map((u, i) => (
                <View key={i} style={s.unlockRow}>
                  <Text style={s.unlockEmoji}>{u.emoji}</Text>
                  <Text style={s.unlockName}>{u.name}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={s.btn} onPress={dismissAllProgressEvents} activeOpacity={0.85} accessibilityRole="button">
            <Text style={s.btnText}>Nice!</Text>
          </TouchableOpacity>
          {shareable && (
            <ShareMilestone
              text={milestoneText(level != null ? 'level' : 'tier', level != null ? level : (tier.rankLabel?.label || `Rank ${tier.to}`))}
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
