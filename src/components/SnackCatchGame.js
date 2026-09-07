// src/components/SnackCatchGame.js
// A fun, arcade catching game themed around Health — move your basket
// between 3 lanes to catch healthy snacks and dodge junk food. Not trying
// to teach nutrition facts here, just quick reflexes with a food skin.
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

const HEALTHY = ['🍎', '🥦', '🍓', '🥕', '🍌', '🥗'];
const JUNK = ['🍩', '🍔', '🍟', '🍭', '🥤'];

// Durations trimmed from the original 45-60s down to a 15-30s range — a
// continuous reflex arcade game like this drags once the "just for fun"
// novelty wears off; a short, replayable burst suits it better. Fall rate
// also ramps up as timeLeft counts down (same mechanic SpeedRacer uses)
// so the last stretch of a run is genuinely harder than the first.
const TIER_CONFIG = {
  'K-2':  { baseTickMs: 700, minTickMs: 450, speedupPerSec: 15, spawnChance: 0.30, junkChance: 0.20, duration: 15 },
  '3-5':  { baseTickMs: 600, minTickMs: 380, speedupPerSec: 15, spawnChance: 0.35, junkChance: 0.30, duration: 20 },
  '6-8':  { baseTickMs: 500, minTickMs: 320, speedupPerSec: 12, spawnChance: 0.40, junkChance: 0.35, duration: 25 },
  '9-12': { baseTickMs: 400, minTickMs: 250, speedupPerSec: 10, spawnChance: 0.45, junkChance: 0.40, duration: 30 },
};

const BLURBS = {
  'K-2': 'Slow-falling snacks, mostly healthy.',
  '3-5': 'A steady mix of healthy and junk.',
  '6-8': 'Faster falls, more junk to dodge.',
  '9-12': 'Fast and crowded — stay sharp.',
};

let nextItemId = 1;

export default function SnackCatchGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const isFocused = useIsFocused();
  const { level, setLevel } = useGradeLevel('snackcatch');
  const [started, setStarted] = useState(false);

  const [items, setItems] = useState([]);
  const [basketLane, setBasketLane] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [caught, setCaught] = useState(0);
  const [roundComplete, setRoundComplete] = useState(null);
  const hasEnded = useRef(false);
  const basketLaneRef = useRef(1);
  // Refs (not state) for the round-end tally — items resolve rapidly
  // enough that a state closure read at the exact end-of-run moment could
  // be a tick stale; refs are always current.
  const caughtRef = useRef(0);
  const missedRef = useRef(0);

  const { next: nextFact } = useGameFacts('snackcatch');
  const game = useGame({ subject: 'health', difficulty: 2, skillLevel: level, onGameEnd, manualScoring: true });
  const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];

  // One-shot ending for this continuous game — called either when the
  // clock runs out or the third life is lost.
  const finishRun = useCallback(() => {
    if (hasEnded.current) return;
    hasEnded.current = true;
    setRoundComplete({
      correct: caughtRef.current,
      total: caughtRef.current + missedRef.current,
      fact: nextFact(),
    });
  }, [nextFact]);

  const beginRun = () => {
    hasEnded.current = false;
    caughtRef.current = 0;
    missedRef.current = 0;
    setItems([]);
    setBasketLane(1);
    basketLaneRef.current = 1;
    setTimeLeft(cfg.duration);
    setPaused(false);
    setCaught(0);
    setRoundComplete(null);
    setStarted(true);
  };

  const handleClaimPrize = useCallback(() => {
    setRoundComplete(null);
    game.endGame();
  }, [game]);

  const moveBasket = (lane) => {
    basketLaneRef.current = lane;
    setBasketLane(lane);
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

  // Falling items tick — fall rate ramps up as timeLeft counts down.
  useEffect(() => {
    if (!started || !isFocused || paused || timeLeft <= 0 || hasEnded.current) return;
    const elapsed = cfg.duration - timeLeft;
    const tickMs = Math.max(cfg.minTickMs, cfg.baseTickMs - elapsed * cfg.speedupPerSec);
    const id = setInterval(() => {
      setItems(prev => {
        const advanced = prev.map(it => ({ ...it, row: it.row + 1 }));
        const surviving = [];
        for (const it of advanced) {
          if (it.row >= BOTTOM_ROW) {
            const caughtIt = it.lane === basketLaneRef.current;
            if (caughtIt) {
              if (it.type === 'healthy') {
                game.answer(true);
                caughtRef.current += 1;
                setCaught(c => c + 1);
              } else {
                game.answer(false);
                missedRef.current += 1;
                if (game.lives - 1 <= 0) { setTimeout(() => finishRun(), 0); }
              }
            }
            // resolved either way — remove from play
          } else {
            surviving.push(it);
          }
        }
        if (Math.random() < cfg.spawnChance) {
          const lane = Math.floor(Math.random() * LANES);
          const isJunk = Math.random() < cfg.junkChance;
          const emoji = isJunk ? JUNK[Math.floor(Math.random() * JUNK.length)] : HEALTHY[Math.floor(Math.random() * HEALTHY.length)];
          surviving.push({ id: nextItemId++, lane, row: 0, type: isJunk ? 'junk' : 'healthy', emoji });
        }
        return surviving;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [started, isFocused, paused, timeLeft, cfg.duration, cfg.baseTickMs, cfg.minTickMs, cfg.speedupPerSec, cfg.spawnChance, cfg.junkChance, game, finishRun]);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => setPaused(true));
    return unsub;
  }, [navigation]);

  if (!started) {
    return (
      <GradeSelectCard gameId="snackcatch"
        title="Snack Catch" emoji="🧺" subjectLabel="Health · Just for Fun"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="snackcatch"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Snack Catcher Champ!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (roundComplete) {
    return (
      <GameShell gameId="snackcatch" disableFactToast
        title="Snack Catch" emoji="🧺" subject={`Health · ${level}`}
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
    <GameShell gameId="snackcatch"
      title="Snack Catch" emoji="🧺" subject={`Health · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      timeLeft={timeLeft}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.hint}>Catch the healthy snacks 🍎 — dodge the junk 🍩!</Text>
        <Text style={s.count}>Caught: {caught}</Text>

        <View style={s.field}>
          {Array.from({ length: LANES }).map((_, lane) => (
            <View key={lane} style={s.lane}>
              {items.filter(it => it.lane === lane).map(it => (
                <Text
                  key={it.id}
                  style={[s.itemEmoji, { top: (it.row / BOTTOM_ROW) * LANE_HEIGHT }]}
                >
                  {it.emoji}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={s.basketRow}>
          {Array.from({ length: LANES }).map((_, lane) => (
            <TouchableOpacity
              key={lane}
              style={[s.basketSlot, basketLane === lane && s.basketSlotActive]}
              onPress={() => moveBasket(lane)}
            >
              <Text style={s.basketEmoji}>🧺</Text>
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
  field:   { flexDirection: 'row', width: '100%', height: LANE_HEIGHT, marginBottom: 10 },
  lane:    { flex: 1, position: 'relative', borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: G.border },
  itemEmoji: { position: 'absolute', left: '50%', marginLeft: -14, fontSize: 28 },
  basketRow: { flexDirection: 'row', width: '100%', gap: 8 },
  basketSlot: { flex: 1, height: 56, borderRadius: 12, backgroundColor: G.card, borderWidth: 1, borderColor: G.border, alignItems: 'center', justifyContent: 'center' },
  basketSlotActive: { borderColor: G.gold, backgroundColor: G.goldL },
  basketEmoji: { fontSize: 26 },
});
