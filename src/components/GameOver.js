// src/components/GameOver.js
// Shared game over / results screen for ALL games

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameTheme } from './GameShell';

const RANKS = [
  { min: 95, label: 'Legendary', emoji: '🏆', color: '#FFD700' },
  { min: 80, label: 'Master',    emoji: '💎', color: '#c9a84c' },
  { min: 65, label: 'Expert',    emoji: '⚡', color: '#2bb5a0' },
  { min: 50, label: 'Skilled',   emoji: '🎯', color: '#8b4fc4' },
  { min: 0,  label: 'Apprentice',emoji: '📚', color: '#7a6a9a' },
];

function getRank(accuracy) {
  return RANKS.find(r => accuracy >= r.min) || RANKS[RANKS.length - 1];
}

export default function GameOver({
  score = 0,
  correct = 0,
  total = 0,
  streak = 0,
  timeSeconds = null,
  xpEarned = 0,
  pointsEarned = 0,
  title = 'Quest Complete!',
  onPlayAgain,
  onQuit,
}) {
  const G = useGameTheme();
  const s = makeStyles(G);
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const rank = getRank(accuracy);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Ornament */}
      <Text style={s.ornament}>✦ · ✦</Text>

      {/* Rank badge */}
      <View style={[s.rankBadge, { borderColor: rank.color }]}>
        <Text style={s.rankEmoji}>{rank.emoji}</Text>
        <Text style={[s.rankLabel, { color: rank.color }]}>{rank.label}</Text>
      </View>

      <Text style={s.title}>{title}</Text>

      {/* Score hero */}
      <View style={s.scoreHero}>
        <Text style={s.scoreNum}>{score}</Text>
        <Text style={s.scoreLabel}>points earned</Text>
      </View>

      {/* Rewards */}
      {(xpEarned > 0 || pointsEarned > 0) && (
        <View style={s.rewardsRow}>
          {xpEarned > 0 && (
            <View style={s.rewardPill}>
              <Text style={s.rewardText}>+{xpEarned} XP</Text>
            </View>
          )}
          {pointsEarned > 0 && (
            <View style={[s.rewardPill, { borderColor: G.gold, backgroundColor: G.goldL }]}>
              <Text style={[s.rewardText, { color: G.gold }]}>+{pointsEarned} pts</Text>
            </View>
          )}
        </View>
      )}

      {/* Stats grid */}
      <View style={s.statsGrid}>
        <StatBox s={s} label="Accuracy" value={`${accuracy}%`} icon="stats-chart" color={accuracy >= 70 ? G.success : G.warning} />
        <StatBox s={s} label="Correct" value={`${correct}/${total}`} icon="checkmark-circle" color={G.teal} />
        <StatBox s={s} label="Best Streak" value={streak} icon="flame" color={G.gold} />
        {timeSeconds !== null && (
          <StatBox s={s} label="Time" value={`${timeSeconds}s`} icon="timer" color={G.purple} />
        )}
      </View>

      {/* Buttons */}
      <TouchableOpacity style={s.playAgainBtn} onPress={onPlayAgain}>
        <Ionicons name="refresh" size={18} color={G.bg} />
        <Text style={s.playAgainText}>Play Again</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.quitBtn} onPress={onQuit}>
        <Text style={s.quitText}>← Back to games</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatBox({ s, label, value, icon, color }) {
  return (
    <View style={s.statBox}>
      <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 4 }} />
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

const makeStyles = (G) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: G.bg },
  content:     { alignItems: 'center', padding: 24, paddingBottom: 48 },
  ornament:    { fontSize: 12, color: G.gold, letterSpacing: 8, marginBottom: 16 },
  rankBadge:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16 },
  rankEmoji:   { fontSize: 24 },
  rankLabel:   { fontSize: 16, fontWeight: '700' },
  title:       { fontSize: 22, fontWeight: '700', color: G.cream, marginBottom: 20, textAlign: 'center' },
  scoreHero:   { alignItems: 'center', marginBottom: 16 },
  scoreNum:    { fontSize: 56, fontWeight: '800', color: G.gold, letterSpacing: -2 },
  scoreLabel:  { fontSize: 13, color: G.muted, marginTop: -4 },
  rewardsRow:  { flexDirection: 'row', gap: 8, marginBottom: 24 },
  rewardPill:  { borderWidth: 1, borderColor: G.teal, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: G.tealL },
  rewardText:  { fontSize: 14, fontWeight: '700', color: G.teal },
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 28, width: '100%' },
  statBox:     { backgroundColor: G.card, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, padding: 16, alignItems: 'center', minWidth: '44%', flex: 1 },
  statVal:     { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statLbl:     { fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1 },
  playAgainBtn:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: G.gold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 14, width: '100%', justifyContent: 'center' },
  playAgainText:{ fontSize: 16, fontWeight: '700', color: G.bg },
  quitBtn:     { padding: 12 },
  quitText:    { fontSize: 14, color: G.muted },
});
