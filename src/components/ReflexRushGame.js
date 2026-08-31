// src/components/ReflexRushGame.js
// A fun reaction-time tester themed around Technology (testing your
// "signal response time," like a latency test). Not trying to teach
// anything — just a genre of arcade game that's fun on its own: wait for
// the signal, then tap as fast as you can. Tapping before the signal is
// the one real "mistake" — a false start.

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';

const ROUNDS = 6;

const TIER_CONFIG = {
  'K-2':  { minDelay: 1500, maxDelay: 3500, goodMs: 900 },
  '3-5':  { minDelay: 1200, maxDelay: 3200, goodMs: 700 },
  '6-8':  { minDelay: 1000, maxDelay: 3000, goodMs: 550 },
  '9-12': { minDelay: 800,  maxDelay: 2800, goodMs: 400 },
};

const BLURBS = {
  'K-2': 'Long waits, generous timing.',
  '3-5': 'A bit less warning, a bit tighter timing.',
  '6-8': 'Shorter waits — stay ready.',
  '9-12': 'Unpredictable and fast — elite reflexes.',
};

export default function ReflexRushGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('reflexrush');
  const [started, setStarted] = useState(false);

  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle | waiting | go | resolved
  const [feedback, setFeedback] = useState(null);
  const [times, setTimes] = useState([]);
  const signalTimeRef = useRef(0);
  const goTimeoutRef = useRef(null);
  const advanceTimeoutRef = useRef(null);
  const focusedRef = useRef(true);

  const game = useGame({ subject: 'technology', difficulty: 2, skillLevel: level, onGameEnd });
  const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];

  const clearPending = () => {
    if (goTimeoutRef.current) { clearTimeout(goTimeoutRef.current); goTimeoutRef.current = null; }
    if (advanceTimeoutRef.current) { clearTimeout(advanceTimeoutRef.current); advanceTimeoutRef.current = null; }
  };

  const startRound = () => {
    setPhase('waiting');
    setFeedback(null);
    const delay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);
    goTimeoutRef.current = setTimeout(() => {
      if (!focusedRef.current) return;
      signalTimeRef.current = Date.now();
      setPhase('go');
    }, delay);
  };

  const beginRun = () => {
    setRound(0);
    setTimes([]);
    setStarted(true);
    setTimeout(startRound, 300);
  };

  // Pause the round timers (not just the visible countdown) whenever the
  // screen loses focus, so a "TAP NOW!" or round-advance never fires
  // silently in the background and surprises the player when they return.
  useEffect(() => {
    const unsubBlur = navigation.addListener('blur', () => {
      focusedRef.current = false;
      clearPending();
    });
    const unsubFocus = navigation.addListener('focus', () => { focusedRef.current = true; });
    return () => { unsubBlur(); unsubFocus(); clearPending(); };
  }, [navigation]);

  const advance = useCallback((isCorrect) => {
    const willEnd = game.lives - (isCorrect ? 0 : 1) <= 0 || round + 1 >= ROUNDS;
    advanceTimeoutRef.current = setTimeout(() => {
      if (!focusedRef.current) return;
      setFeedback(null);
      if (willEnd) {
        game.endGame();
      } else {
        setRound(r => r + 1);
        startRound();
      }
    }, 1600);
  }, [game, round]);

  const handleTap = useCallback(() => {
    if (phase === 'idle' || phase === 'resolved') return;

    if (phase === 'waiting') {
      clearPending();
      setPhase('resolved');
      game.answer(false);
      setFeedback({ isCorrect: false, msg: '✗ Too soon! Wait for the signal.' });
      advance(false);
      return;
    }

    if (phase === 'go') {
      const reactionMs = Date.now() - signalTimeRef.current;
      setPhase('resolved');
      setTimes(prev => [...prev, reactionMs]);
      game.answer(true, { speedBonus: reactionMs < cfg.goodMs ? 5 : 0 });
      setFeedback({
        isCorrect: true,
        msg: reactionMs < cfg.goodMs ? `⚡ ${reactionMs}ms — great reflexes!` : `✓ ${reactionMs}ms`,
      });
      advance(true);
    }
  }, [phase, game, cfg.goodMs, advance]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Reflex Rush" emoji="⚡" subjectLabel="Technology · Just for Fun"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) {
    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
    return (
      <GameOver
        score={game.score} correct={game.correct} total={game.attempted}
        streak={game.bestStreak}
        title={avg ? `Avg Reaction: ${avg}ms!` : 'Reflex Test Complete!'}
        onPlayAgain={() => { game.reset(); setStarted(false); }}
        onQuit={() => navigation.goBack()}
      />
    );
  }

  return (
    <GameShell
      title="Reflex Rush" emoji="⚡" subject={`Technology · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={round / ROUNDS}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Round {round + 1} of {ROUNDS}</Text>

        <TouchableOpacity
          style={[s.zone, phase === 'go' && s.zoneGo, phase === 'waiting' && s.zoneWaiting]}
          onPress={handleTap}
          activeOpacity={0.85}
          disabled={phase === 'idle' || phase === 'resolved'}
        >
          <Text style={s.zoneText}>
            {phase === 'waiting' && 'Wait for it...'}
            {phase === 'go' && 'TAP NOW!'}
            {phase === 'resolved' && '...'}
          </Text>
        </TouchableOpacity>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackText, { color: feedback.isCorrect ? G.success : G.error }]}>{feedback.msg}</Text>
          </View>
        )}

        {times.length > 0 && (
          <Text style={s.history}>Times so far: {times.join('ms, ')}ms</Text>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:      { padding: 16, paddingBottom: 40, alignItems: 'center' },
  progress:    { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  zone:        { width: '100%', height: 220, borderRadius: 20, backgroundColor: G.card, borderWidth: 2, borderColor: G.border, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  zoneWaiting: { backgroundColor: '#2a0808', borderColor: G.error },
  zoneGo:      { backgroundColor: G.success + '33', borderColor: G.success },
  zoneText:    { fontSize: 24, fontWeight: '800', color: G.cream },
  feedback:    { width: '100%', backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  feedbackText:{ fontSize: 15, fontWeight: '700' },
  history:     { fontSize: 11, color: G.muted, textAlign: 'center' },
});
