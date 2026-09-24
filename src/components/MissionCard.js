// src/components/MissionCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SUBJECT_CONFIG } from '../../context/UserProgressContext';

const CRITERIA_ICON = {
  questions_answered: '📋',
  correct_answers:    '🎯',
  topic_completed:    '🏫',
  game_completed:     '🏁',
  perfect_game:       '💯',
  play_subject:       '📚',
};

// `how`, `upNext` and `onPlay` come from src/logic/useDrillPlan.js for a
// daily drill: one line on how to do it (naming the game when there is one),
// a marker on the one to do next, and a button straight into a game that
// counts. Weekly and achievement cards just don't pass them.
export default function MissionCard({ mission, onPress, how, upNext = false, onPlay, playLabel = 'Play' }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  // Works with BOTH normalized shape (from context) and raw shape (from Supabase)
  const title       = mission?.title       || mission?.missions?.title       || 'Mission';
  const description = mission?.description || mission?.missions?.description || '';
  const xpReward    = mission?.reward?.xp  || mission?.missions?.xp_reward  || 0;
  const ptReward    = mission?.reward?.points || mission?.missions?.point_reward || 0;
  const progress    = mission?.progress    || mission?.current_value  || 0;
  const target      = mission?.target      || mission?.target_value   || 1;
  const status      = mission?.status      || 'active';
  const subject     = mission?.subject     || 'general';
  const criteriaType= mission?.criteriaType || mission?.missions?.criteria?.type;

  if (!title) return null;

  const pct         = target > 0 ? Math.min((progress / target) * 100, 100) : 0;
  const isCompleted = status === 'completed' || status === 'claimed';
  const isClaimed   = status === 'claimed';
  const isExpired   = status === 'expired';
  const almostThere = !isCompleted && !isExpired && pct >= 75;
  const cfg         = SUBJECT_CONFIG[subject] || SUBJECT_CONFIG.general;
  const icon        = CRITERIA_ICON[criteriaType] || cfg.icon;
  const st          = styles(c, t, s, r);

  return (
    <TouchableOpacity
      style={[
        st.card,
        upNext && !isCompleted && st.cardNext,
        isCompleted && st.cardCompleted,
        isExpired   && st.cardExpired,
      ]}
      onPress={onPress}
      disabled={isExpired || isClaimed}
      activeOpacity={0.8}
    >
      <View style={[st.accentBar, { backgroundColor: isCompleted ? c.teal : cfg.color }]} />

      <View style={st.body}>
        {/* Header */}
        <View style={st.headerRow}>
          <View style={st.iconWrap}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {upNext && !isCompleted && <Text style={st.upNext}>UP NEXT</Text>}
            <Text style={st.title} numberOfLines={1}>{title}</Text>
            <Text style={st.subjectLabel}>{cfg.name}</Text>
          </View>
          {isCompleted && !isClaimed && (
            <View style={st.doneBadge}>
              <Text style={st.doneBadgeText}>✓ Done</Text>
            </View>
          )}
          {isClaimed && (
            <View style={st.claimedBadge}>
              <Text style={st.claimedBadgeText}>Claimed</Text>
            </View>
          )}
        </View>

        {/* How to do it beats the template's own description, which was
            written before the games it names existed ("math activities"). */}
        {how ? <Text style={st.how}>{how}</Text>
          : description ? <Text style={st.description}>{description}</Text> : null}

        {/* Progress */}
        <View style={st.progressRow}>
          <Text style={st.progressText}>{progress} / {target}</Text>
          {almostThere ? (
            <Text style={st.almostText}>🔥 Almost there!</Text>
          ) : (
            <Text style={[st.pctText, isCompleted && { color: c.teal }]}>{Math.round(pct)}%</Text>
          )}
        </View>
        <View style={st.barBg}>
          <View style={[st.barFill, { width: `${pct}%`, backgroundColor: isCompleted ? c.teal : cfg.color }]} />
        </View>

        {/* Rewards, and the way in */}
        <View style={[st.rewardsRow, { alignItems: 'center' }]}>
          <Text style={st.rewardPts}>⭐ {ptReward} pts</Text>
          <Text style={st.rewardXp}>✨ {xpReward} XP</Text>
          <View style={{ flex: 1 }} />
          {onPlay && !isCompleted && !isExpired && (
            <TouchableOpacity
              onPress={onPlay}
              accessibilityRole="button"
              accessibilityLabel={`${playLabel} for ${title}`}
              style={[st.playBtn, upNext && st.playBtnNext]}
            >
              <Text style={[st.playText, upNext && { color: '#fff' }]}>{playLabel} ▸</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = (c, t, s, r) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: c.bg1,
    borderRadius: r.lg,
    marginBottom: s.md,
    borderWidth: 0.5,
    borderColor: c.border,
    overflow: 'hidden',
  },
  cardCompleted: { borderColor: c.teal, borderWidth: 1 },
  cardNext:      { borderColor: c.gold, borderWidth: 1.5 },
  upNext:        { fontSize: 9, fontWeight: t.bold, color: c.gold, letterSpacing: 1, marginBottom: 1 },
  how:           { fontSize: t.sm, color: c.text2, marginBottom: s.sm, lineHeight: 19 },
  playBtn:       { borderWidth: 1, borderColor: c.gold, borderRadius: r.md, paddingHorizontal: 12, paddingVertical: 5 },
  playBtnNext:   { backgroundColor: c.gold },
  playText:      { fontSize: t.xs, fontWeight: t.bold, color: c.gold },
  cardExpired:   { opacity: 0.45 },
  accentBar: { width: 4 },
  body: { flex: 1, padding: s.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm },
  iconWrap: {
    width: 36, height: 36, borderRadius: r.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: c.bg2,
  },
  title: { fontSize: t.sm, fontWeight: t.bold, color: c.text1 },
  subjectLabel: { fontSize: t.xs, color: c.text3, marginTop: 1 },
  doneBadge: { backgroundColor: c.teal, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  doneBadgeText: { color: '#fff', fontSize: 10, fontWeight: t.bold },
  claimedBadge: { backgroundColor: c.text4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  claimedBadgeText: { color: '#fff', fontSize: 10, fontWeight: t.bold },
  description: { fontSize: t.xs, color: c.text3, marginBottom: s.sm, lineHeight: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressText: { fontSize: t.xs, color: c.text3 },
  pctText: { fontSize: t.xs, color: c.text4 },
  almostText: { fontSize: t.xs, color: c.gold, fontWeight: t.bold },
  barBg: { height: 6, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden', marginBottom: s.sm },
  barFill: { height: 6, borderRadius: 3 },
  rewardsRow: { flexDirection: 'row', gap: s.lg },
  rewardPts: { fontSize: t.xs, fontWeight: t.semibold, color: c.gold },
  rewardXp: { fontSize: t.xs, fontWeight: t.semibold, color: c.teal },
});
