// src/components/BugSquashGame.js
// A fun, arcade whack-a-mole game themed around Science (bugs in the
// garden) — not trying to teach anything, just quick reflexes. Tap a bug
// before it scurries off; leave the ladybugs alone, they're helpful.

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';

const GRID_SIZE = 9;

const TIER_CONFIG = {
  'K-2':  { spawnChance: 0.35, lifeTicks: 6, friendlyChance: 0.10, tickMs: 700, duration: 45 },
  '3-5':  { spawnChance: 0.40, lifeTicks: 5, friendlyChance: 0.15, tickMs: 600, duration: 50 },
  '6-8':  { spawnChance: 0.45, lifeTicks: 4, friendlyChance: 0.20, tickMs: 500, duration: 55 },
  '9-12': { spawnChance: 0.50, lifeTicks: 3, friendlyChance: 0.25, tickMs: 400, duration: 60 },
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
  const hasEnded = useRef(false);

  const game = useGame({ subject: 'science', difficulty: 2, skillLevel: level, onGameEnd });
  const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];

  const beginRun = () => {
    hasEnded.current = false;
    setHoles(Array(GRID_SIZE).fill(null));
    setTimeLeft(cfg.duration);
    setPaused(false);
    setSquashed(0);
    setStarted(true);
  };

  // Countdown timer
  useEffect(() => {
    if (!started || !isFocused || paused || timeLeft <= 0 || hasEnded.current) return;
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (!hasEnded.current) { hasEnded.current = true; setTimeout(() => game.endGame(), 100); }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, isFocused, paused, timeLeft]);

  // Bug spawn/despawn tick
  useEffect(() => {
    if (!started || !isFocused || paused || timeLeft <= 0 || hasEnded.current) return;
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
    }, cfg.tickMs);
    return () => clearInterval(id);
  }, [started, isFocused, paused, timeLeft, cfg.tickMs, cfg.spawnChance, cfg.friendlyChance, cfg.lifeTicks]);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => setPaused(true));
    return unsub;
  }, [navigation]);

  const tapHole = (idx) => {
    const hole = holes[idx];
    if (!hole || hasEnded.current) return;
    if (hole.type === 'bug') {
      game.answer(true, { speedBonus: hole.ttl >= cfg.lifeTicks - 1 ? 5 : 0 });
      setSquashed(s => s + 1);
    } else {
      game.answer(false);
    }
    setHoles(prev => prev.map((h, i) => i === idx ? null : h));
  };

  if (!started) {
    return (
      <GradeSelectCard
        title="Bug Squash" emoji="🐛" subjectLabel="Science · Just for Fun"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Garden Guardian!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  return (
    <GameShell
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
