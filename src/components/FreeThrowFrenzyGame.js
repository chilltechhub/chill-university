// src/components/FreeThrowFrenzyGame.js
// A timing-based sports mini-game (Health/PE) — a power marker sweeps
// back and forth; tap SHOOT when it's in the target zone. Classic
// "power meter" sports-game mechanic, no physics engine needed.

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';

const SESSION_SHOTS = 8;

const TIER_CONFIG = {
  'K-2':  { targetWidth: 36, sweepSpeed: 3, tickMs: 30 },
  '3-5':  { targetWidth: 28, sweepSpeed: 4, tickMs: 28 },
  '6-8':  { targetWidth: 20, sweepSpeed: 5, tickMs: 26 },
  '9-12': { targetWidth: 14, sweepSpeed: 6, tickMs: 24 },
};

const BLURBS = {
  'K-2': 'Wide target zone, slow sweep.',
  '3-5': 'A tighter zone, a bit faster.',
  '6-8': 'Narrow zone, quick sweep.',
  '9-12': 'Pinpoint accuracy needed — fast sweep.',
};

function randomTargetCenter(width) {
  const half = width / 2;
  return half + Math.random() * (100 - width);
}

export default function FreeThrowFrenzyGame({ onGameEnd }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('freethrow');
  const [started, setStarted] = useState(false);

  const [shotIndex, setShotIndex] = useState(0);
  const [markerPos, setMarkerPos] = useState(0);
  const [targetCenter, setTargetCenter] = useState(50);
  const [feedback, setFeedback] = useState(null);
  const [made, setMade] = useState(0);
  const directionRef = useRef(1);

  const game = useGame({ subject: 'health', difficulty: 2, skillLevel: level, onGameEnd });
  const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];

  const beginRun = () => {
    setShotIndex(0);
    setMarkerPos(0);
    setTargetCenter(randomTargetCenter(cfg.targetWidth));
    directionRef.current = 1;
    setFeedback(null);
    setMade(0);
    setStarted(true);
  };

  useEffect(() => {
    if (!started || !isFocused || feedback) return;
    const id = setInterval(() => {
      setMarkerPos(prev => {
        let next = prev + directionRef.current * cfg.sweepSpeed;
        if (next >= 100) { next = 100; directionRef.current = -1; }
        if (next <= 0) { next = 0; directionRef.current = 1; }
        return next;
      });
    }, cfg.tickMs);
    return () => clearInterval(id);
  }, [started, isFocused, feedback, cfg.sweepSpeed, cfg.tickMs]);

  // Pause the sweep on blur, and — critically — clear that pause on focus.
  // Without the focus half of this, navigating away mid-shot would freeze
  // the game permanently (the SHOOT button stays disabled forever since
  // nothing else ever clears a paused `feedback`).
  useEffect(() => {
    const unsubBlur = navigation.addListener('blur', () => setFeedback(f => f || { paused: true }));
    const unsubFocus = navigation.addListener('focus', () => setFeedback(f => (f && f.paused) ? null : f));
    return () => { unsubBlur(); unsubFocus(); };
  }, [navigation]);

  const handleShoot = () => {
    if (feedback) return;
    const distance = Math.abs(markerPos - targetCenter);
    const isMake = distance <= cfg.targetWidth / 2;
    const isSwish = distance <= cfg.targetWidth / 6;
    game.answer(isMake, { speedBonus: isSwish ? 5 : 0 });
    if (isMake) setMade(m => m + 1);
    setFeedback({ isCorrect: isMake, msg: isMake ? (isSwish ? '🎯 Swish! Perfect shot!' : '✓ Nothing but net!') : '✗ Off the rim!' });

    setTimeout(() => {
      setFeedback(null);
      const willEnd = game.lives - (isMake ? 0 : 1) <= 0 || shotIndex + 1 >= SESSION_SHOTS;
      if (willEnd) {
        game.endGame();
      } else {
        setShotIndex(i => i + 1);
        setMarkerPos(0);
        directionRef.current = 1;
        setTargetCenter(randomTargetCenter(cfg.targetWidth));
      }
    }, 1400);
  };

  if (!started) {
    return (
      <GradeSelectCard
        title="Free Throw Frenzy" emoji="🏀" subjectLabel="Health · Sports"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title={`${made}/${SESSION_SHOTS} Shots Made!`}
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  const targetLeft = targetCenter - cfg.targetWidth / 2;

  return (
    <GameShell
      title="Free Throw Frenzy" emoji="🏀" subject={`Health · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={shotIndex / SESSION_SHOTS}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Shot {shotIndex + 1} of {SESSION_SHOTS} · Made: {made}</Text>
        <Text style={s.hint}>Tap SHOOT when the marker is in the target zone!</Text>

        <View style={s.meter}>
          <View style={[s.targetZone, { left: `${targetLeft}%`, width: `${cfg.targetWidth}%` }]} />
          <View style={[s.marker, { left: `${markerPos}%` }]} />
        </View>

        <TouchableOpacity style={[s.shootBtn, !!feedback && s.shootBtnDisabled]} onPress={handleShoot} disabled={!!feedback}>
          <Text style={s.shootBtnText}>🏀 SHOOT</Text>
        </TouchableOpacity>

        {feedback && !feedback.paused && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackText, { color: feedback.isCorrect ? G.success : G.error }]}>{feedback.msg}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:     { padding: 16, paddingBottom: 40, alignItems: 'center' },
  progress:   { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  hint:       { fontSize: 13, color: G.gold, textAlign: 'center', marginBottom: 24 },
  meter:      { width: '100%', height: 24, backgroundColor: G.card, borderRadius: 12, borderWidth: 1, borderColor: G.border, marginBottom: 24, position: 'relative', overflow: 'hidden' },
  targetZone: { position: 'absolute', top: 0, bottom: 0, backgroundColor: G.success + '55' },
  marker:     { position: 'absolute', top: -4, bottom: -4, width: 6, marginLeft: -3, backgroundColor: G.gold, borderRadius: 3 },
  shootBtn:   { width: '100%', backgroundColor: G.gold, borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginBottom: 16 },
  shootBtnDisabled: { opacity: 0.5 },
  shootBtnText: { fontSize: 18, fontWeight: '800', color: G.bg, letterSpacing: 1 },
  feedback:   { width: '100%', backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  feedbackText:{ fontSize: 15, fontWeight: '700' },
});
