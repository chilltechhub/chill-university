// src/components/FactorCraftGame.js
// Math tile game — select tiles that equal the target using the given operation
// Preserves all original game logic, replaces Alert with inline feedback,
// applies royal library theme via GameShell

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import GameShell, { G } from './GameShell';
import GameOver from './GameOver';
import useGame from '../logic/useGame';

const OPERATIONS = ['add', 'subtract', 'multiply', 'divide'];
const OP_SYMBOLS  = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
const OP_COLORS   = { add: G.teal, subtract: G.warning, multiply: '#2196F3', divide: G.purple };

function buildRound(level) {
  const numberRange = Math.min(10 + level * 5, 100);
  const tileCount   = Math.min(6 + Math.floor(level / 2), 12);
  let newTarget = 0, solution = [], newOp = '', attempts = 0;

  while (attempts < 100) {
    attempts++;
    newOp = OPERATIONS[Math.floor(Math.random() * OPERATIONS.length)];
    const pickCount = Math.min(2 + Math.floor(level / 3), 4);
    solution = Array.from({ length: pickCount }, () => Math.floor(Math.random() * numberRange) + 1);
    if (newOp === 'divide') solution = solution.map(n => n === 0 ? 1 : n);

    switch (newOp) {
      case 'add':      newTarget = solution.reduce((a, b) => a + b, 0); break;
      case 'subtract': solution.sort((a, b) => b - a); newTarget = solution.slice(1).reduce((a, b) => a - b, solution[0]); break;
      case 'multiply': newTarget = solution.reduce((a, b) => a * b, 1); break;
      case 'divide': {
        const denom = solution.slice(1);
        if (denom.includes(0)) continue;
        const r = denom.reduce((a, b) => a / b, solution[0]);
        if (!Number.isInteger(r) || r <= 0) continue;
        newTarget = r; break;
      }
    }
    if (Number.isFinite(newTarget) && Number.isInteger(newTarget) && newTarget > 0 && newTarget <= 500) break;
  }

  let tiles = [...solution];
  while (tiles.length < tileCount) tiles.push(Math.floor(Math.random() * numberRange) + 1);
  return { tiles: tiles.sort(() => Math.random() - 0.5), target: newTarget, operation: newOp };
}

function calcResult(nums, op) {
  switch (op) {
    case 'add':      return nums.reduce((a, b) => a + b, 0);
    case 'subtract': return nums.slice(1).reduce((a, b) => a - b, nums[0]);
    case 'multiply': return nums.reduce((a, b) => a * b, 1);
    case 'divide': {
      const denom = nums.slice(1);
      if (denom.includes(0)) return null;
      const r = denom.reduce((a, b) => a / b, nums[0]);
      return Number.isInteger(r) ? r : null;
    }
    default: return null;
  }
}

export default function FactorCraftGame({ onGameEnd }) {
  const navigation = useNavigation();
  const isFocused  = useIsFocused();

  const [round, setRound]           = useState(() => buildRound(1));
  const [selected, setSelected]     = useState([]);
  const [level, setLevel]           = useState(1);
  const [levelCorrect, setLC]       = useState(0);
  const [combo, setCombo]           = useState(0);
  const [timeLeft, setTimeLeft]     = useState(60);
  const [paused, setPaused]         = useState(false);
  const [feedback, setFeedback]     = useState(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const game = useGame({ subject: 'math', difficulty: Math.min(Math.ceil(level / 3), 3), onGameEnd });
  const hasEnded = useRef(false);

  // Timer
  useEffect(() => {
    if (!isFocused || paused || timeLeft <= 0 || hasEnded.current) return;
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
  }, [isFocused, paused, timeLeft]);

  useEffect(() => {
    const unsub = navigation.addListener('blur', () => setPaused(true));
    return unsub;
  }, [navigation]);

  const nextRound = useCallback((currentLevel, currentLC, bonusTime = 0) => {
    setSelected([]);
    setFeedback(null);
    const newLC = currentLC + 1;
    const needForLevel = 5 + Math.floor(currentLevel / 2);
    if (newLC >= needForLevel) {
      const nextLevel = currentLevel + 1;
      setLevel(nextLevel);
      setLC(0);
      setTimeLeft(t => Math.min(t + 10 + bonusTime, 90));
      setRound(buildRound(nextLevel));
    } else {
      setLC(newLC);
      if (bonusTime) setTimeLeft(t => Math.min(t + bonusTime, 90));
      setRound(buildRound(currentLevel));
    }
  }, []);

  const checkAnswer = useCallback(() => {
    if (selected.length < 2 || feedback || hasEnded.current) return;
    const nums = selected.map(i => round.tiles[i]);
    const result = calcResult(nums, round.operation);

    if (result === null) {
      setFeedback({ isCorrect: false, msg: 'Invalid calculation — try different tiles' });
      return;
    }

    const isCorrect = result === round.target;
    const pts = game.answer(isCorrect, { speedBonus: combo > 2 ? 5 : 0 });

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setFeedback({ isCorrect: true, msg: newCombo > 1 ? `${newCombo}x Combo! ✓` : '✓ Correct!' });
      setTimeout(() => nextRound(level, levelCorrect, newCombo > 3 ? 5 : 0), 1200);
    } else {
      setCombo(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,  duration: 50, useNativeDriver: true }),
      ]).start();
      setFeedback({ isCorrect: false, msg: `Got ${result}, need ${round.target}` });
      setTimeout(() => { setFeedback(null); setSelected([]); }, 1400);
    }
  }, [selected, round, feedback, combo, game, level, levelCorrect, nextRound, shakeAnim]);

  const toggleTile = (idx) => {
    if (paused || feedback) return;
    setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  if (game.done || hasEnded.current) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Math Master!"
      onPlayAgain={() => {
        game.reset(); hasEnded.current = false;
        setLevel(1); setLC(0); setCombo(0); setTimeLeft(60);
        setRound(buildRound(1)); setSelected([]); setFeedback(null);
      }}
      onQuit={() => navigation.goBack()}
    />
  );

  const opColor = OP_COLORS[round.operation];
  const currentNums = selected.map(i => round.tiles[i]);
  const currentResult = currentNums.length >= 2 ? calcResult(currentNums, round.operation) : null;

  return (
    <GameShell
      title="Factor Craft" emoji="🔢" subject="Math"
      score={game.score} lives={game.lives} streak={game.streak}
      timeLeft={timeLeft} progress={levelCorrect / (5 + Math.floor(level / 2))}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.levelRow}>
          <Text style={s.levelText}>Level {level}</Text>
          {combo > 1 && <Text style={s.comboText}>🔥 {combo}x Combo</Text>}
        </View>

        {/* Target */}
        <View style={[s.targetCard, { borderColor: opColor }]}>
          <Text style={s.targetLabel}>Make</Text>
          <Text style={[s.targetNum, { color: opColor }]}>{round.target}</Text>
          <Text style={s.targetOp}>using <Text style={{ color: opColor, fontWeight: '700' }}>{OP_SYMBOLS[round.operation]}</Text></Text>
        </View>

        {/* Live preview */}
        <View style={s.preview}>
          {selected.length >= 2 && (
            <>
              <Text style={s.previewExpr}>
                {currentNums.join(` ${OP_SYMBOLS[round.operation]} `)} ={' '}
                <Text style={{ color: currentResult === round.target ? G.success : G.error }}>
                  {currentResult ?? '?'}
                </Text>
              </Text>
            </>
          )}
          {selected.length < 2 && (
            <Text style={s.previewHint}>Select at least 2 tiles</Text>
          )}
        </View>

        {/* Tiles */}
        <Animated.View style={[s.tilesGrid, { transform: [{ translateX: shakeAnim }] }]}>
          {round.tiles.map((num, i) => {
            const isSel = selected.includes(i);
            return (
              <TouchableOpacity
                key={i}
                style={[s.tile, isSel && s.tileSelected, isSel && { borderColor: opColor }]}
                onPress={() => toggleTile(i)}
              >
                <Text style={[s.tileNum, isSel && { color: opColor }]}>{num}</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Feedback */}
        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackText, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.msg}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.clearBtn} onPress={() => setSelected([])}>
            <Text style={s.clearBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.checkBtn, selected.length < 2 && s.checkBtnDisabled]}
            onPress={checkAnswer}
            disabled={selected.length < 2 || !!feedback}
          >
            <Text style={s.checkBtnText}>Check ✓</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GameShell>
  );
}

const s = StyleSheet.create({
  scroll:          { padding: 16, paddingBottom: 40 },
  levelRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelText:       { fontSize: 12, color: G.muted, textTransform: 'uppercase', letterSpacing: 1 },
  comboText:       { fontSize: 13, fontWeight: '700', color: G.gold },
  targetCard:      { backgroundColor: G.card, borderWidth: 1.5, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 },
  targetLabel:     { fontSize: 12, color: G.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  targetNum:       { fontSize: 48, fontWeight: '800', lineHeight: 54 },
  targetOp:        { fontSize: 13, color: G.muted, marginTop: 4 },
  preview:         { backgroundColor: G.card, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 14, borderWidth: 0.5, borderColor: G.border, minHeight: 44 },
  previewExpr:     { fontSize: 18, color: G.cream, fontWeight: '600' },
  previewHint:     { fontSize: 13, color: G.faint },
  tilesGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  tile:            { width: 60, height: 60, backgroundColor: G.card, borderRadius: 12, borderWidth: 1, borderColor: G.border, alignItems: 'center', justifyContent: 'center' },
  tileSelected:    { backgroundColor: G.border },
  tileNum:         { fontSize: 20, fontWeight: '700', color: G.cream },
  feedback:        { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  feedbackText:    { fontSize: 15, fontWeight: '700' },
  actions:         { flexDirection: 'row', gap: 12 },
  clearBtn:        { flex: 1, backgroundColor: G.card, borderWidth: 1, borderColor: G.border, borderRadius: 12, padding: 14, alignItems: 'center' },
  clearBtnText:    { fontSize: 15, color: G.muted, fontWeight: '600' },
  checkBtn:        { flex: 2, backgroundColor: G.teal, borderRadius: 12, padding: 14, alignItems: 'center' },
  checkBtnDisabled:{ opacity: 0.4 },
  checkBtnText:    { fontSize: 15, fontWeight: '700', color: G.bg },
});
