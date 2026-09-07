// src/components/TriviaCatchGame.js
// Pilot from the Training Center field report: reuses Snack Catch's
// falling-lane arcade shell to deliver real quiz content (World Explorer's
// bank) instead of a generic healthy/junk sort. Snack Catch itself is left
// untouched — this is a new, separate game so the working arcade original
// carries no risk from the experiment.
//
// Mechanically different from Snack Catch's independent per-tick spawns:
// here a ROUND is one question, and its 3 answer chips (the correct one +
// 2 distractors, pulled from the shared quiz bank's 4-option shape) fall
// together, one per lane, on a single timed animation. Move the catcher
// into the lane you think is correct before they land — no reading a list
// of buttons, just stand in the right spot in time.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import RoundCompleteScreen from './RoundCompleteScreen';
import useGame from '../logic/useGame';
import useGradeLevel, { tierForLevel } from '../logic/useGradeLevel';
import { STAGE_COUNT } from '../logic/difficultyAdapter';
import { WORLD_BANK } from '../data/gameContent/worldExplorer';

const LANES = 3;
const LANE_HEIGHT = 260;
const CHIP_HEIGHT = 56;

const TIER_CONFIG = {
  'K-2':  { fallMs: 4400 },
  '3-5':  { fallMs: 3700 },
  '6-8':  { fallMs: 3000 },
  '9-12': { fallMs: 2400 },
};

const BLURBS = {
  'K-2': 'Slow-falling answers — plenty of time to catch the right one.',
  '3-5': 'A steadier fall — read fast, move faster.',
  '6-8': 'Quicker falls, less time to think it through.',
  '9-12': 'Fast falls — know it cold or miss it.',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.prompt));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

// Exactly 3 chips per round — the correct answer plus 2 distractors — since
// this shell only has 3 lanes for them to fall through.
function buildRound(q) {
  const wrongs = shuffle(q.options.filter(o => o !== q.correct)).slice(0, LANES - 1);
  const labels = shuffle([q.correct, ...wrongs]);
  return labels.map((label, lane) => ({ lane, label, isCorrect: label === q.correct }));
}

export default function TriviaCatchGame({ onGameEnd }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('triviacatch');
  const [started, setStarted] = useState(false);

  const [q, setQ] = useState(null);
  const [chips, setChips] = useState([]);
  const [catcherLane, setCatcherLane] = useState(1);
  const [asked, setAsked] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [recent, setRecent] = useState([]);
  const [roundComplete, setRoundComplete] = useState(null);
  const fallAnim = useRef(new Animated.Value(0)).current;
  const catcherLaneRef = useRef(1);
  const advanceTimeoutRef = useRef(null);

  const game = useGame({ subject: 'social_studies', difficulty: 2, skillLevel: level, onGameEnd, manualScoring: true });
  const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];

  const moveCatcher = (lane) => { catcherLaneRef.current = lane; setCatcherLane(lane); };

  const loadRound = (question, avoidList) => {
    setQ(question);
    setChips(buildRound(question));
    fallAnim.setValue(0);
    setFeedback(null);
    return [...avoidList, question.prompt];
  };

  const beginRun = () => {
    const first = pickNext(WORLD_BANK[level], []);
    setRecent(loadRound(first, []));
    setAsked(0);
    setCatcherLane(1);
    catcherLaneRef.current = 1;
    setStarted(true);
  };

  const resolveRound = useCallback(() => {
    const caught = chips.find(c => c.lane === catcherLaneRef.current);
    const isCorrect = !!caught?.isCorrect;
    game.answer(isCorrect);
    setFeedback({ isCorrect, explanation: q?.explanation, correctLabel: q?.correct });

    advanceTimeoutRef.current = setTimeout(() => {
      const outOfLives = game.lives - (isCorrect ? 0 : 1) <= 0;
      const isLastRound = asked + 1 >= STAGE_COUNT;

      if (outOfLives || (isLastRound && !isCorrect)) {
        game.endGame();
      } else if (isCorrect) {
        setAsked(a => a + 1);
        setRoundComplete({ correct: 1, total: 1, roundNumber: asked + 1, isLastStage: isLastRound });
      } else {
        const next = pickNext(WORLD_BANK[level], recent);
        setRecent(r => loadRound(next, r));
        setAsked(a => a + 1);
      }
    }, 2000);
  }, [chips, game, q, asked, level, recent]);

  const handleClaimPrize = useCallback(() => {
    setRoundComplete(null);
    if (roundComplete?.isLastStage) {
      game.endGame();
      return;
    }
    const next = pickNext(WORLD_BANK[level], recent);
    setRecent(r => loadRound(next, r));
  }, [game, roundComplete, level, recent]);

  // One timed fall per round instead of Snack Catch's continuous tick spawn
  // — resolves itself the instant the chips land.
  useEffect(() => {
    if (!started || !isFocused || !q || feedback) return;
    fallAnim.setValue(0);
    const anim = Animated.timing(fallAnim, { toValue: 1, duration: cfg.fallMs, useNativeDriver: false });
    anim.start(({ finished }) => { if (finished) resolveRound(); });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, started, isFocused]);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => fallAnim.stopAnimation());
    return () => { unsub(); if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  if (!started) {
    return (
      <GradeSelectCard gameId="triviacatch"
        title="Trivia Catch" emoji="🎯" subjectLabel="Social Studies · Arcade Pilot"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="triviacatch"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Catch Champion!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (roundComplete) {
    return (
      <GameShell gameId="triviacatch" disableFactToast
        title="Trivia Catch" emoji="🎯" subject={`Social Studies · ${level}`}
        score={game.score} lives={game.lives} streak={game.streak}
      >
        <RoundCompleteScreen
          roundNumber={roundComplete.roundNumber}
          correct={roundComplete.correct}
          total={roundComplete.total}
          streak={game.streak}
          difficulty={tierForLevel(level)}
          onAward={game.addPoints}
          onAdvance={handleClaimPrize}
        />
      </GameShell>
    );
  }

  if (!q) return null;

  return (
    <GameShell gameId="triviacatch"
      title="Trivia Catch" emoji="🎯" subject={`Social Studies · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={asked / STAGE_COUNT}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Round {asked + 1} of {STAGE_COUNT}</Text>

        <View style={s.promptCard}>
          <Text style={s.prompt}>{q.prompt}</Text>
        </View>
        <Text style={s.hint}>Stand under the right answer before it lands!</Text>

        <View style={s.field}>
          {Array.from({ length: LANES }).map((_, lane) => {
            const chip = chips.find(c => c.lane === lane);
            return (
              <View key={lane} style={s.lane}>
                {chip && !feedback && (
                  <Animated.View
                    style={[
                      s.chip,
                      { top: fallAnim.interpolate({ inputRange: [0, 1], outputRange: [0, LANE_HEIGHT - CHIP_HEIGHT] }) },
                    ]}
                  >
                    <Text style={s.chipText} numberOfLines={4}>{chip.label}</Text>
                  </Animated.View>
                )}
              </View>
            );
          })}
        </View>

        <View style={s.catcherRow}>
          {Array.from({ length: LANES }).map((_, lane) => (
            <TouchableOpacity
              key={lane}
              style={[s.catcherSlot, catcherLane === lane && s.catcherSlotActive]}
              onPress={() => moveCatcher(lane)}
              disabled={!!feedback}
            >
              <Text style={s.catcherEmoji}>🧢</Text>
            </TouchableOpacity>
          ))}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ Caught it!' : `✗ It was "${feedback.correctLabel}"`}
            </Text>
            <Text style={s.feedbackText}>{feedback.explanation}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:      { padding: 16, paddingBottom: 40, alignItems: 'center' },
  progress:    { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  promptCard:  { backgroundColor: G.card, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: G.border, marginBottom: 8, width: '100%' },
  prompt:      { fontSize: 15, color: G.cream, textAlign: 'center', lineHeight: 21, fontWeight: '600' },
  hint:        { fontSize: 12, color: G.gold, textAlign: 'center', marginBottom: 14 },
  field:       { flexDirection: 'row', width: '100%', height: LANE_HEIGHT, marginBottom: 10, backgroundColor: G.card, borderRadius: 8 },
  lane:        { flex: 1, position: 'relative', borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: G.border },
  chip:        { position: 'absolute', left: 4, right: 4, minHeight: CHIP_HEIGHT, borderRadius: 10, backgroundColor: G.gold, alignItems: 'center', justifyContent: 'center', padding: 6 },
  chipText:    { fontSize: 11, fontWeight: '700', color: G.bg, textAlign: 'center', lineHeight: 14 },
  catcherRow:  { flexDirection: 'row', width: '100%', gap: 8, marginBottom: 16 },
  catcherSlot: { flex: 1, height: 56, borderRadius: 12, backgroundColor: G.card, borderWidth: 1, borderColor: G.border, alignItems: 'center', justifyContent: 'center' },
  catcherSlotActive: { borderColor: G.gold, backgroundColor: G.goldL },
  catcherEmoji: { fontSize: 26 },
  feedback:    { width: '100%', backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14 },
  feedbackTitle:{ fontSize: 14, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  feedbackText:{ fontSize: 12, color: G.cream, lineHeight: 17, textAlign: 'center' },
});
