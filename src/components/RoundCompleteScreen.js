// src/components/RoundCompleteScreen.js
// Shown between rounds instead of trickling points in per question — no
// points are earned until a round is finished and a prize is picked here.
// Three face-down prize cards, roughly scaled to how the round went (more
// correct answers → a better pool to draw from) but randomized within that
// pool, so which card is best is never obvious; tap one to reveal and bank
// it. Rush pace also shows a fact here (its one placement — the main
// question view stays fact-free to keep the pace up); Relaxed pace already
// streams facts continuously in the question view's own empty space, so it
// passes no fact and this screen skips that block entirely.
//
// Prize sizing has three levers: lower grade bands earn smaller point
// piles (a K-2 "12 points" should not equal a 9-12 "12 points" in
// effort), a round with misses in it (total > correct) pays out less than
// a clean one, and a purely-for-fun arcade game (`funGame`) pays less
// than an educational one for the same performance — points should track
// how much a game is actually teaching, not just how long it ran.
//
// Score updates the instant a card is picked (`onAward`), not after the
// reveal delay — the points bar behind this screen visibly ticks up while
// the card is still flipped face-up, so "picking a prize" reads as
// "earning points" in real time. `onAdvance` fires ~1.2s later, once the
// player has had a moment to see the reveal, and is what actually moves
// the game to the next round / ends it — callers should NOT re-add the
// points there, `onAward` already banked them.

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameTheme } from './GameShell';
import { useUIPrefs } from '../../context/UIPrefsContext';

// Grade tier (1=K-2 … 4=9-12) scales the whole prize pool down for younger
// bands — same round performance, smaller numbers, so points stay roughly
// proportional to how much the player is actually expected to know.
const GRADE_TIER_MULT = { 1: 0.5, 2: 0.75, 3: 1.0, 4: 1.3 };
// "Just for fun" arcade games (Bug Squash, Snack Catch, Speed Racer,
// Reflex Rush) pay well under half of what an educational game pays for
// the same round performance — see the `funGame` prop below.
const FUN_GAME_MULT = 0.45;

// Caps how many "correct" hits the payout formula scales with — mainly
// for the continuous arcade games (Bug Squash, Snack Catch, Speed Racer),
// which report a single round covering the WHOLE run and can rack up
// far more resolved hits than a quiz round ever would (STAGE_COUNT's
// roundLength() tops out at 12). Without this, a long, well-played arcade
// run pays out an ever-growing pile instead of a bounded "you did great"
// prize — accuracy is preserved (both numbers scale down together), only
// the absolute size is capped.
const CORRECT_CAP = 15;

function rollPrizes(correct = 0, total = 1, tier = 2, funGame = false) {
  if (total > CORRECT_CAP) {
    const scale = CORRECT_CAP / total;
    correct = Math.round(correct * scale);
    total = CORRECT_CAP;
  }
  const gradeMult = GRADE_TIER_MULT[Math.round(tier)] || GRADE_TIER_MULT[2];
  const accuracy = total > 0 ? Math.max(0, Math.min(1, correct / total)) : 1;
  // A round with a couple of misses in it still pays out (never punish
  // down to nothing — the round was still cleared), but a clean round
  // pays noticeably more: 50% accuracy → ~0.65x, 100% → 1x.
  const accuracyMult = 0.5 + 0.5 * accuracy;
  const funMult = funGame ? FUN_GAME_MULT : 1;
  const base = Math.max(6, Math.round(Math.max(correct, 0.5) * 12 * gradeMult * accuracyMult * funMult));
  const tiers = [0.6, 1.0, 1.7];
  const values = tiers.map(mult => {
    const jitter = 0.85 + Math.random() * 0.3;
    return Math.max(5, Math.round((base * mult * jitter) / 5) * 5);
  });
  return values.sort(() => Math.random() - 0.5);
}

export default function RoundCompleteScreen({
  roundNumber,
  correct,
  total,
  streak = 0,
  difficulty = 2,   // grade tier, 1-4 — see GRADE_TIER_MULT above
  funGame = false,  // true for arcade "just for fun" games — see FUN_GAME_MULT above
  fact,             // string → shown here (Rush pace, or an arcade game's single end-of-run screen); omit for Relaxed
  onAward,          // (points) => void — called the instant a card is tapped, so score updates live
  onAdvance,        // () => void — called ~1.2s later, once the reveal has been seen
}) {
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const [prizes] = useState(() => rollPrizes(correct, total, difficulty, funGame));
  const [picked, setPicked] = useState(null);

  const handlePick = useCallback((i) => {
    if (picked !== null) return;
    setPicked(i);
    onAward(prizes[i]);
    setTimeout(() => onAdvance(), 1200);
  }, [picked, prizes, onAward, onAdvance]);

  return (
    <View style={s.wrap}>
      {showEmojis && <Text style={s.ornament}>✦ · ✦</Text>}
      <Text style={s.title}>Round {roundNumber} Complete!</Text>
      <Text style={s.stats}>
        {correct}/{total} correct{streak >= 3 ? `  ·  ${showEmojis ? '🔥 ' : ''}${streak} streak` : ''}
      </Text>

      {!!fact && (
        <View style={s.factBox}>
          <Text style={s.factLabel}>{showEmojis ? '💡 ' : ''}Did You Know</Text>
          <Text style={s.factText}>{fact}</Text>
        </View>
      )}

      <Text style={s.prompt}>
        {picked === null ? 'Pick a prize!' : `+${prizes[picked]} points!`}
      </Text>

      <View style={s.prizeRow}>
        {prizes.map((pts, i) => {
          const isPicked = picked === i;
          const isOther = picked !== null && !isPicked;
          return (
            <TouchableOpacity
              key={i}
              style={[s.prizeCard, isPicked && s.prizeCardPicked, isOther && s.prizeCardDim]}
              onPress={() => handlePick(i)}
              disabled={picked !== null}
              activeOpacity={0.85}
            >
              {showEmojis ? (
                <Text style={s.prizeEmoji}>{isPicked ? '🎉' : '🎁'}</Text>
              ) : (
                <Ionicons name={isPicked ? 'sparkles' : 'gift-outline'} size={30} color={isPicked ? G.gold : G.faint} style={{ marginBottom: 6 }} />
              )}
              {isPicked ? (
                <Text style={s.prizePts}>+{pts}</Text>
              ) : (
                <Text style={s.prizeMystery}>?</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (G) => StyleSheet.create({
  wrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: G.bg },
  ornament:    { fontSize: 12, color: G.gold, letterSpacing: 8, marginBottom: 14 },
  title:       { fontSize: 22, fontWeight: '700', color: G.cream, textAlign: 'center', marginBottom: 6 },
  stats:       { fontSize: 13, color: G.muted, marginBottom: 20 },
  factBox:     { width: '100%', backgroundColor: G.card, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, padding: 14, marginBottom: 22 },
  factLabel:   { fontSize: 11, color: G.gold, fontWeight: '700', marginBottom: 4 },
  factText:    { fontSize: 13, color: G.cream, lineHeight: 18 },
  prompt:      { fontSize: 15, fontWeight: '700', color: G.gold, marginBottom: 16 },
  prizeRow:    { flexDirection: 'row', gap: 14 },
  prizeCard:   { width: 84, height: 100, borderRadius: 16, backgroundColor: G.card, borderWidth: 1.5, borderColor: G.border, alignItems: 'center', justifyContent: 'center' },
  prizeCardPicked: { borderColor: G.gold, backgroundColor: G.goldL },
  prizeCardDim: { opacity: 0.35 },
  prizeEmoji:  { fontSize: 32, marginBottom: 6 },
  prizeMystery:{ fontSize: 20, fontWeight: '800', color: G.faint },
  prizePts:    { fontSize: 16, fontWeight: '800', color: G.gold },
});
