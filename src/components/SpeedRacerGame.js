// src/components/SpeedRacerGame.js
// A fun, arcade racing game — not tied to a subject, just speed. Switch
// lanes to dodge oncoming traffic; the road gets faster the longer you
// survive, like a real race ramping up.
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

const LANES = 3;
const BOTTOM_ROW = 5;
const LANE_HEIGHT = 260;
const OBSTACLES = ['🚧', '🚙', '🪨', '🛢️'];

// Durations trimmed from the original 45-60s down to a 15-30s range — a
// continuous reflex arcade game like this drags once the "just for fun"
// novelty wears off; a short, replayable burst suits it better.
const TIER_CONFIG = {
  'K-2':  { baseTickMs: 800, minTickMs: 500, speedupPerSec: 6,  spawnChance: 0.35, duration: 15 },
  '3-5':  { baseTickMs: 700, minTickMs: 400, speedupPerSec: 8,  spawnChance: 0.40, duration: 20 },
  '6-8':  { baseTickMs: 600, minTickMs: 320, speedupPerSec: 9,  spawnChance: 0.45, duration: 25 },
  '9-12': { baseTickMs: 500, minTickMs: 250, speedupPerSec: 10, spawnChance: 0.50, duration: 30 },
};

const BLURBS = {
  'K-2': 'Slow start, gentle speed-up.',
  '3-5': 'A steady climb in speed.',
  '6-8': 'Fast, with a quick ramp-up.',
  '9-12': 'Brutal top speed — best reflexes only.',
};

let nextObstacleId = 1;

export default function SpeedRacerGame({ onGameEnd }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('speedracer');
  const [started, setStarted] = useState(false);

  const [obstacles, setObstacles] = useState([]);
  const [carLane, setCarLane] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [distance, setDistance] = useState(0);
  const [roundComplete, setRoundComplete] = useState(null);
  const hasEnded = useRef(false);
  const carLaneRef = useRef(1);
  // Refs (not state) for the round-end tally — obstacles resolve rapidly
  // enough that a state closure read at the exact end-of-run moment could
  // be a tick stale; refs are always current.
  const dodgedRef = useRef(0);
  const crashedRef = useRef(0);

  const { next: nextFact } = useGameFacts('speedracer');
  const game = useGame({ subject: 'general', difficulty: 2, skillLevel: level, onGameEnd, manualScoring: true });
  const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];

  // One-shot ending for this continuous game — called either when the
  // clock runs out or the third life is lost.
  const finishRun = useCallback(() => {
    if (hasEnded.current) return;
    hasEnded.current = true;
    setRoundComplete({
      correct: dodgedRef.current,
      total: dodgedRef.current + crashedRef.current,
      fact: nextFact(),
    });
  }, [nextFact]);

  const beginRun = () => {
    hasEnded.current = false;
    dodgedRef.current = 0;
    crashedRef.current = 0;
    setObstacles([]);
    setCarLane(1);
    carLaneRef.current = 1;
    setTimeLeft(cfg.duration);
    setPaused(false);
    setDistance(0);
    setRoundComplete(null);
    setStarted(true);
  };

  const handleClaimPrize = useCallback(() => {
    setRoundComplete(null);
    game.endGame();
  }, [game]);

  const moveCar = (lane) => {
    carLaneRef.current = lane;
    setCarLane(lane);
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

  // Traffic tick — speed ramps up as timeLeft counts down
  useEffect(() => {
    if (!started || !isFocused || paused || timeLeft <= 0 || hasEnded.current) return;
    const elapsed = cfg.duration - timeLeft;
    const tickMs = Math.max(cfg.minTickMs, cfg.baseTickMs - elapsed * cfg.speedupPerSec);
    const id = setInterval(() => {
      setDistance(d => d + 1);
      setObstacles(prev => {
        const advanced = prev.map(o => ({ ...o, row: o.row + 1 }));
        const surviving = [];
        for (const o of advanced) {
          if (o.row >= BOTTOM_ROW) {
            const crashed = o.lane === carLaneRef.current;
            game.answer(!crashed);
            if (crashed) {
              crashedRef.current += 1;
              if (game.lives - 1 <= 0) { setTimeout(() => finishRun(), 0); }
            } else {
              dodgedRef.current += 1;
            }
          } else {
            surviving.push(o);
          }
        }
        if (Math.random() < cfg.spawnChance) {
          const lane = Math.floor(Math.random() * LANES);
          const emoji = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
          surviving.push({ id: nextObstacleId++, lane, row: 0, emoji });
        }
        return surviving;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [started, isFocused, paused, timeLeft, cfg.duration, cfg.minTickMs, cfg.baseTickMs, cfg.speedupPerSec, cfg.spawnChance, game]);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => setPaused(true));
    return unsub;
  }, [navigation]);

  if (!started) {
    return (
      <GradeSelectCard gameId="speedracer"
        title="Speed Racer" emoji="🏎️" subjectLabel="Just for Fun"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="speedracer"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Checkered Flag!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (roundComplete) {
    return (
      <GameShell gameId="speedracer" disableFactToast
        title="Speed Racer" emoji="🏎️" subject={`Racing · ${level}`}
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
    <GameShell gameId="speedracer"
      title="Speed Racer" emoji="🏎️" subject={`Racing · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      timeLeft={timeLeft}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.hint}>Switch lanes to dodge the traffic!</Text>
        <Text style={s.count}>Distance: {distance}m</Text>

        <View style={s.field}>
          {Array.from({ length: LANES }).map((_, lane) => (
            <View key={lane} style={s.lane}>
              {obstacles.filter(o => o.lane === lane).map(o => (
                <Text key={o.id} style={[s.obstacleEmoji, { top: (o.row / BOTTOM_ROW) * LANE_HEIGHT }]}>
                  {o.emoji}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={s.carRow}>
          {Array.from({ length: LANES }).map((_, lane) => (
            <TouchableOpacity
              key={lane}
              style={[s.carSlot, carLane === lane && s.carSlotActive]}
              onPress={() => moveCar(lane)}
            >
              <Text style={s.carEmoji}>🏎️</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:  { padding: 16, paddingBottom: 40, alignItems: 'center' },
  hint:    { fontSize: 13, color: G.gold, textAlign: 'center', marginBottom: 6 },
  count:   { fontSize: 12, color: G.muted, textAlign: 'center', marginBottom: 12 },
  field:   { flexDirection: 'row', width: '100%', height: LANE_HEIGHT, marginBottom: 10, backgroundColor: G.card, borderRadius: 8 },
  lane:    { flex: 1, position: 'relative', borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: G.border },
  obstacleEmoji: { position: 'absolute', left: '50%', marginLeft: -14, fontSize: 26 },
  carRow:  { flexDirection: 'row', width: '100%', gap: 8 },
  carSlot: { flex: 1, height: 56, borderRadius: 12, backgroundColor: G.card, borderWidth: 1, borderColor: G.border, alignItems: 'center', justifyContent: 'center' },
  carSlotActive: { borderColor: G.gold, backgroundColor: G.goldL },
  carEmoji: { fontSize: 26 },
});
