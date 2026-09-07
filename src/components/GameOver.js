// src/components/GameOver.js
// Shared game over / results screen for ALL games

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGameTheme } from './GameShell';
import { useUIPrefs } from '../../context/UIPrefsContext';
import useGameFacts from '../logic/useGameFacts';
import { lessonsForGame, openLessonScreen } from '../data/skillLinks';
import { recordRun, accuracyFor, SKILL_THRESHOLDS } from '../logic/skillStats';

const RANKS = [
  { min: 95, label: 'Legendary', emoji: '🏆', icon: 'trophy', color: '#FFD700' },
  { min: 80, label: 'Master',    emoji: '💎', icon: 'diamond', color: '#c9a84c' },
  { min: 65, label: 'Expert',    emoji: '⚡', icon: 'flash', color: '#2bb5a0' },
  { min: 50, label: 'Skilled',   emoji: '🎯', icon: 'radio-button-on', color: '#8b4fc4' },
  { min: 0,  label: 'Apprentice',emoji: '📚', icon: 'book', color: '#7a6a9a' },
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
  gameId, // powers the round-end fact box below — see useGameFacts.js
}) {
  const G = useGameTheme();
  const s = makeStyles(G);
  const navigation = useNavigation();
  const { showEmojis } = useUIPrefs();
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const rank = getRank(accuracy);

  // Pick one fact for this results screen once the pool is in — a static
  // pick (not re-rolled on every render) since this screen doesn't loop.
  const { ready, next: nextFact } = useGameFacts(gameId);
  const [fact, setFact] = useState(null);
  useEffect(() => {
    if (ready && fact == null) setFact(nextFact());
  }, [ready]);

  // ── The games -> lessons half of the Training/Academy link ────────────
  // Every game ends here with its own id and this run's correct/total, so
  // this is the one place that can record per-game history for all 30
  // games without touching any of them (see skillStats.js), and the
  // natural place to answer "what should I go learn?" while the result is
  // still on screen.
  const [rollingAccuracy, setRollingAccuracy] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!gameId || total <= 0) return undefined;
    recordRun(gameId, { correct, total })
      .then(() => accuracyFor(gameId))
      .then(acc => { if (alive) setRollingAccuracy(acc); });
    return () => { alive = false; };
    // One write per results screen — this screen never loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // Prefer the rolling average across recent runs over this single run, so
  // one unlucky game doesn't nag someone who normally does fine here (and
  // one lucky game doesn't hide a real gap). Falls back to this run while
  // the stored history is still loading.
  const judgedAccuracy = rollingAccuracy ?? accuracy;
  const lessons = lessonsForGame(gameId);
  const struggling = judgedAccuracy < SKILL_THRESHOLDS.WEAK_BELOW;
  // Rotate which linked lesson is offered so replaying the same game
  // surfaces the whole topic list over time instead of one topic forever.
  const lesson = lessons.length ? lessons[(correct + total) % lessons.length] : null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Ornament */}
      {showEmojis && <Text style={s.ornament}>✦ · ✦</Text>}

      {/* Rank badge */}
      <View style={[s.rankBadge, { borderColor: rank.color }]}>
        {showEmojis ? (
          <Text style={s.rankEmoji}>{rank.emoji}</Text>
        ) : (
          <Ionicons name={rank.icon} size={20} color={rank.color} />
        )}
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

      {/* Linked lesson — the bridge from a game back into the Academy.
          Shown either way, with the framing flipped: a weak run gets
          "here's what would help", a strong run gets "go deeper", so the
          two halves of the app stay connected instead of the link only
          appearing as a telling-off after a bad game. */}
      {!!lesson && (
        <TouchableOpacity
          style={[s.lessonCard, { borderColor: struggling ? G.warning : G.teal }]}
          onPress={() => openLessonScreen(navigation, lesson.screen)}
          activeOpacity={0.85}
        >
          <View style={s.lessonHeader}>
            <Ionicons
              name={struggling ? 'school-outline' : 'trending-up-outline'}
              size={16}
              color={struggling ? G.warning : G.teal}
            />
            <Text style={[s.lessonEyebrow, { color: struggling ? G.warning : G.teal }]}>
              {struggling ? 'Lesson that helps' : 'Go deeper'}
            </Text>
          </View>
          <Text style={s.lessonTitle}>{lesson.topicTitle}</Text>
          <Text style={s.lessonSub}>
            {struggling
              ? `${judgedAccuracy}% on this game — this ${lesson.subjectTitle} lesson covers it`
              : `In ${lesson.subjectTitle} · Academy Classes`}
          </Text>
          <Text style={[s.lessonGo, { color: struggling ? G.warning : G.teal }]}>Open lesson →</Text>
        </TouchableOpacity>
      )}

      {/* Fact */}
      {!!fact && (
        <View style={s.factBox}>
          <Text style={s.factLabel}>{showEmojis ? '💡 ' : ''}Did You Know</Text>
          <Text style={s.factText}>{fact}</Text>
        </View>
      )}

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
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20, width: '100%' },
  statBox:     { backgroundColor: G.card, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, padding: 16, alignItems: 'center', minWidth: '44%', flex: 1 },
  statVal:     { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statLbl:     { fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1 },
  lessonCard:  { width: '100%', backgroundColor: G.card, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16 },
  lessonHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  lessonEyebrow:{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: G.cream, marginBottom: 4 },
  lessonSub:   { fontSize: 12, color: G.muted, lineHeight: 17, marginBottom: 8 },
  lessonGo:    { fontSize: 12, fontWeight: '700' },
  factBox:     { width: '100%', backgroundColor: G.card, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, padding: 14, marginBottom: 20 },
  factLabel:   { fontSize: 11, color: G.gold, fontWeight: '700', marginBottom: 4 },
  factText:    { fontSize: 13, color: G.cream, lineHeight: 18 },
  playAgainBtn:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: G.gold, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 14, width: '100%', justifyContent: 'center' },
  playAgainText:{ fontSize: 16, fontWeight: '700', color: G.bg },
  quitBtn:     { padding: 12 },
  quitText:    { fontSize: 14, color: G.muted },
});
