// src/components/SnackCatchGame.js
// A fun, arcade catching game themed around Health — move your basket
// between 3 lanes to catch healthy snacks and dodge junk food. Not trying
// to teach nutrition facts here, just quick reflexes with a food skin.

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';

const LANES = 3;
const BOTTOM_ROW = 5;
const LANE_HEIGHT = 260;

const HEALTHY = ['🍎', '🥦', '🍓', '🥕', '🍌', '🥗'];
const JUNK = ['🍩', '🍔', '🍟', '🍭', '🥤'];

const TIER_CONFIG = {
  'K-2':  { tickMs: 700, spawnChance: 0.30, junkChance: 0.20, duration: 45 },
  '3-5':  { tickMs: 600, spawnChance: 0.35, junkChance: 0.30, duration: 50 },
  '6-8':  { tickMs: 500, spawnChance: 0.40, junkChance: 0.35, duration: 55 },
  '9-12': { tickMs: 400, spawnChance: 0.45, junkChance: 0.40, duration: 60 },
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
  const hasEnded = useRef(false);
  const basketLaneRef = useRef(1);

  const game = useGame({ subject: 'health', difficulty: 2, skillLevel: level, onGameEnd });
  const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];

  const beginRun = () => {
    hasEnded.current = false;
    setItems([]);
    setBasketLane(1);
    basketLaneRef.current = 1;
    setTimeLeft(cfg.duration);
    setPaused(false);
    setCaught(0);
    setStarted(true);
  };

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
          if (!hasEnded.current) { hasEnded.current = true; setTimeout(() => game.endGame(), 100); }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [started, isFocused, paused, timeLeft]);

  // Falling items tick
  useEffect(() => {
    if (!started || !isFocused || paused || timeLeft <= 0 || hasEnded.current) return;
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
                setCaught(c => c + 1);
              } else {
                game.answer(false);
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
    }, cfg.tickMs);
    return () => clearInterval(id);
  }, [started, isFocused, paused, timeLeft, cfg.tickMs, cfg.spawnChance, cfg.junkChance, game]);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => setPaused(true));
    return unsub;
  }, [navigation]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Snack Catch" emoji="🧺" subjectLabel="Health · Just for Fun"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Snack Catcher Champ!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  return (
    <GameShell
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
