// src/components/BugSquashGame.js
// A fun, arcade whack-a-mole game themed around Science (bugs in the
// garden) — not trying to teach anything, just quick reflexes. Tap a bug
// before it scurries off; leave the ladybugs alone, they're helpful.
//
// No discrete rounds here (it's one continuous run), so it gets a single
// "pick a prize" screen at the very end instead of one per round — same
// manualScoring pattern as every other converted game, just with exactly
// one RoundCompleteScreen instead of several. Also ends immediately on a
// third life lost, same as every other game, instead of only stopping
// when the clock runs out.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import RoundCompleteScreen from './RoundCompleteScreen';
import useGame from '../logic/useGame';
import useGameFacts from '../logic/useGameFacts';
import useGradeLevel from '../logic/useGradeLevel';

const GRID_SIZE = 9;

// Durations trimmed from the original 45-60s down to a 15-30s range — a
// continuous reflex arcade game like this drags once the "just for fun"
// novelty wears off; a short, replayable burst suits it better.
// Spawn rate now ramps up as the clock runs down (same "speed ramps up as
// timeLeft counts down" mechanic SpeedRacer already uses) — round 1 and
// the last few seconds of a run no longer feel identical.
const TIER_CONFIG = {
  'K-2':  { spawnChance: 0.35, lifeTicks: 6, friendlyChance: 0.10, baseTickMs: 700, minTickMs: 450, speedupPerSec: 15, duration: 15 },
  '3-5':  { spawnChance: 0.40, lifeTicks: 5, friendlyChance: 0.15, baseTickMs: 600, minTickMs: 380, speedupPerSec: 15, duration: 20 },
  '6-8':  { spawnChance: 0.45, lifeTicks: 4, friendlyChance: 0.20, baseTickMs: 500, minTickMs: 320, speedupPerSec: 12, duration: 25 },
  '9-12': { spawnChance: 0.50, lifeTicks: 3, friendlyChance: 0.25, baseTickMs: 400, minTickMs: 250, speedupPerSec: 10, duration: 30 },
};

const BLURBS = {
  'K-2': 'Slow bugs, plenty of time to react.',
  '3-5': 'A bit quicker, a few more ladybugs to dodge.',
  '6-8': 'Fast bugs, less time on screen.',
  '9-12': 'Lightning fast — sharpest reflexes only.',
};

export default function BugSquashGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const isFocused = useIsFocused();
  const { level, setLevel } = useGradeLevel('bugsquash');
  const [started, setStarted] = useState(false);

  const [holes, setHoles] = useState(() => Array(GRID_SIZE).fill(null));
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [squashed, setSquashed] = useState(0);
  const [roundComplete, setRoundComplete] = useState(null);
  const hasEnded = useRef(false);
  // Refs (not state) for the round-end tally — taps fire rapidly enough
  // that a state closure read at the exact end-of-run moment could be a
  // tick stale; refs are always current.
  const squashedRef = useRef(0);
  const missedRef = useRef(0);

  const { next: nextFact } = useGameFacts('bugsquash');
  const game = useGame({ subject: 'science', difficulty: 2, skillLevel: level, onGameEnd, manualScoring: true });
  const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];

  // One-shot ending for this continuous game — called either when the
  // clock runs out or the third life is lost.
  const finishRun = useCallback(() => {
    if (hasEnded.current) return;
    hasEnded.current = true;
    setRoundComplete({
      correct: squashedRef.current,
      total: squashedRef.current + missedRef.current,
      fact: nextFact(),
    });
  }, [nextFact]);

  const beginRun = () => {
    hasEnded.current = false;
    squashedRef.current = 0;
    missedRef.current = 0;
    setHoles(Array(GRID_SIZE).fill(null));
    setTimeLeft(cfg.duration);
    setPaused(false);
    setSquashed(0);
    setRoundComplete(null);
    setStarted(true);
  };

  // Countdown timer
  useEffect(() => {
    if (!started || !isFocused || paused || timeLeft <= 0 || hasEnded.current) return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (!hasEnded.current) setTimeout(() => finishRun(), 100);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, isFocused, paused, timeLeft, finishRun]);

  // Bug spawn/despawn tick — spawn interval ramps up as timeLeft counts down.
  useEffect(() => {
    if (!started || !isFocused || paused || timeLeft <= 0 || hasEnded.current) return;
    const elapsed = cfg.duration - timeLeft;
    const tickMs = Math.max(cfg.minTickMs, cfg.baseTickMs - elapsed * cfg.speedupPerSec);
    const id = setInterval(() => {
      setHoles(prev => prev.map(hole => {
        if (hole) {
          const nextTtl = hole.ttl - 1;
          return nextTtl > 0 ? { ...hole, ttl: nextTtl } : null;
        }
        if (Math.random() < cfg.spawnChance) {
          const type = Math.random() < cfg.friendlyChance ? 'friendly' : 'bug';
          return { type, ttl: cfg.lifeTicks };
        }
        return null;
      }));
    }, tickMs);
    return () => clearInterval(id);
  }, [started, isFocused, paused, timeLeft, cfg.duration, cfg.baseTickMs, cfg.minTickMs, cfg.speedupPerSec, cfg.spawnChance, cfg.friendlyChance, cfg.lifeTicks]);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => setPaused(true));
    return unsub;
  }, [navigation]);

  const tapHole = (idx) => {
    const hole = holes[idx];
    if (!hole || hasEnded.current) return;
    if (hole.type === 'bug') {
      game.answer(true, { speedBonus: hole.ttl >= cfg.lifeTicks - 1 ? 5 : 0 });
      squashedRef.current += 1;
      setSquashed(s => s + 1);
    } else {
      game.answer(false);
      missedRef.current += 1;
      if (game.lives - 1 <= 0) { finishRun(); return; }
    }
    setHoles(prev => prev.map((h, i) => i === idx ? null : h));
  };

  const handleClaimPrize = useCallback(() => {
    setRoundComplete(null);
    game.endGame();
  }, [game]);

  if (!started) {
    return (
      <GradeSelectCard gameId="bugsquash"
        title="Bug Squash" emoji="🐛" subjectLabel="Science · Just for Fun"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="bugsquash"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Garden Guardian!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (roundComplete) {
    return (
      <GameShell gameId="bugsquash" disableFactToast
        title="Bug Squash" emoji="🐛" subject={`Science · ${level}`}
        score={game.score} lives={game.lives} streak={game.streak}
      >
        <RoundCompleteScreen
          roundNumber={1}
          correct={roundComplete.correct}
          total={roundComplete.total}
          streak={game.streak}
          difficulty={2}
          funGame
          fact={roundComplete.fact}
          onAward={game.addPoints}
          onAdvance={handleClaimPrize}
        />
      </GameShell>
    );
  }

  return (
    <GameShell gameId="bugsquash"
      title="Bug Squash" emoji="🐛" subject={`Science · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      timeLeft={timeLeft}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.hint}>Tap the bugs 🪲 — leave the ladybugs 🐞 alone!</Text>
        <Text style={s.count}>Squashed: {squashed}</Text>
        <View style={s.grid}>
          {holes.map((hole, idx) => (
            <TouchableOpacity key={idx} style={s.hole} onPress={() => tapHole(idx)} activeOpacity={0.7}>
              {hole && (
                <Text style={s.bugEmoji}>{hole.type === 'friendly' ? '🐞' : '🪲'}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:   { padding: 16, paddingBottom: 40, alignItems: 'center' },
  hint:     { fontSize: 13, color: G.gold, textAlign: 'center', marginBottom: 6 },
  count:    { fontSize: 12, color: G.muted, textAlign: 'center', marginBottom: 16 },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'center' },
  hole:     {
    width: '28%', height: 90, margin: '2%', borderRadius: 45,
    backgroundColor: '#2a2010', borderWidth: 2, borderColor: '#3d2f18',
    alignItems: 'center', justifyContent: 'center',
  },
  bugEmoji: { fontSize: 36 },
});
