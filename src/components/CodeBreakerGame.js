// src/components/CodeBreakerGame.js
// A Mastermind-style deduction puzzle — genuinely a thinking/logic game,
// not a quiz. Guess the secret code; after each guess you're told how
// many symbols are the right color in the right spot ("exact") vs the
// right color in the wrong spot ("partial"), and use that to deduce the
// code within a limited number of guesses. Scoring logic lives in
// src/logic/mastermind.js, verified against a brute-force reference
// implementation.

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';
import { SYMBOL_POOL, TIER_CONFIG, scoreGuess, generateSecret } from '../logic/mastermind';

const SESSION_PUZZLES = 5;

const BLURBS = {
  'K-2': '3 symbols, 4 colors, repeats allowed.',
  '3-5': '4 symbols, 5 colors, repeats allowed.',
  '6-8': '4 symbols, 6 colors, no repeats.',
  '9-12': '5 symbols, 6 colors, no repeats.',
};

export default function CodeBreakerGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('codebreaker');
  const [started, setStarted] = useState(false);

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [secret, setSecret] = useState([]);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState([]);
  const [resolution, setResolution] = useState(null); // { solved: bool, msg }

  const game = useGame({ subject: 'math', difficulty: 2, skillLevel: level, onGameEnd });
  const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];
  const symbols = SYMBOL_POOL.slice(0, cfg.symbolCount);

  const startPuzzle = () => {
    setSecret(generateSecret(level));
    setGuesses([]);
    setCurrentGuess([]);
    setResolution(null);
  };

  const beginRun = () => {
    setPuzzleIndex(0);
    startPuzzle();
    setStarted(true);
  };

  const addSymbol = (sym) => {
    if (resolution || currentGuess.length >= cfg.length) return;
    setCurrentGuess(prev => [...prev, sym]);
  };

  const backspace = () => {
    if (resolution) return;
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const handleSubmit = useCallback(() => {
    if (resolution || currentGuess.length !== cfg.length) return;
    const { exact, partial } = scoreGuess(secret, currentGuess);
    const newGuesses = [...guesses, { guess: currentGuess, exact, partial }];
    setGuesses(newGuesses);

    const isSolved = exact === cfg.length;
    const outOfGuesses = !isSolved && newGuesses.length >= cfg.maxGuesses;

    if (isSolved || outOfGuesses) {
      game.answer(isSolved, { speedBonus: isSolved && newGuesses.length <= 3 ? 5 : 0 });
      setResolution({
        solved: isSolved,
        msg: isSolved
          ? `✓ Cracked it in ${newGuesses.length} guess${newGuesses.length === 1 ? '' : 'es'}!`
          : `✗ Out of guesses — the code was ${secret.join(' ')}`,
      });

      const willEnd = game.lives - (isSolved ? 0 : 1) <= 0 || puzzleIndex + 1 >= SESSION_PUZZLES;
      setTimeout(() => {
        if (willEnd) {
          game.endGame();
        } else {
          setPuzzleIndex(i => i + 1);
          startPuzzle();
        }
      }, 2400);
    } else {
      setCurrentGuess([]);
    }
  }, [resolution, currentGuess, secret, guesses, cfg, game, puzzleIndex]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Code Breaker" emoji="🕵️" subjectLabel="Logic & Deduction"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Master Codebreaker!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  return (
    <GameShell
      title="Code Breaker" emoji="🕵️" subject={`Logic & Deduction · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={puzzleIndex / SESSION_PUZZLES}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Puzzle {puzzleIndex + 1} of {SESSION_PUZZLES} · Guess {guesses.length + 1} of {cfg.maxGuesses}</Text>

        <Text style={s.instruction}>Crack the {cfg.length}-symbol code {cfg.allowRepeats ? '(repeats allowed)' : '(no repeats)'}</Text>

        {/* Current guess slots */}
        <View style={s.slotsRow}>
          {Array.from({ length: cfg.length }).map((_, i) => (
            <View key={i} style={s.slot}>
              <Text style={s.slotSymbol}>{currentGuess[i] || ''}</Text>
            </View>
          ))}
        </View>

        {/* Symbol palette */}
        <View style={s.palette}>
          {symbols.map(sym => (
            <TouchableOpacity key={sym} style={s.paletteBtn} onPress={() => addSymbol(sym)} disabled={!!resolution}>
              <Text style={s.paletteSymbol}>{sym}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.actionsRow}>
          <TouchableOpacity style={s.backBtn} onPress={backspace} disabled={!!resolution}>
            <Text style={s.backBtnText}>⌫ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.submitBtn, currentGuess.length !== cfg.length && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={currentGuess.length !== cfg.length || !!resolution}
          >
            <Text style={s.submitBtnText}>Submit Guess</Text>
          </TouchableOpacity>
        </View>

        {resolution && (
          <View style={[s.resolution, { borderColor: resolution.solved ? G.success : G.error }]}>
            <Text style={[s.resolutionText, { color: resolution.solved ? G.success : G.error }]}>{resolution.msg}</Text>
          </View>
        )}

        {/* Guess history */}
        {guesses.length > 0 && (
          <View style={s.history}>
            <Text style={s.historyLabel}>Your guesses</Text>
            {[...guesses].reverse().map((g, i) => (
              <View key={guesses.length - i} style={s.historyRow}>
                <Text style={s.historyGuess}>{g.guess.join(' ')}</Text>
                <Text style={s.historyFeedback}>🎯 {g.exact} exact · ◐ {g.partial} partial</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:        { padding: 16, paddingBottom: 40 },
  progress:      { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  instruction:   { fontSize: 13, color: G.gold, textAlign: 'center', marginBottom: 16 },
  slotsRow:      { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  slot:          { width: 48, height: 48, borderRadius: 10, backgroundColor: G.card, borderWidth: 1.5, borderColor: G.border, alignItems: 'center', justifyContent: 'center' },
  slotSymbol:    { fontSize: 22 },
  palette:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 16 },
  paletteBtn:    { width: 52, height: 52, borderRadius: 26, backgroundColor: G.card, borderWidth: 1, borderColor: G.border, alignItems: 'center', justifyContent: 'center' },
  paletteSymbol: { fontSize: 24 },
  actionsRow:    { flexDirection: 'row', gap: 12, marginBottom: 16 },
  backBtn:       { flex: 1, backgroundColor: G.card, borderWidth: 1, borderColor: G.border, borderRadius: 12, padding: 14, alignItems: 'center' },
  backBtnText:   { fontSize: 14, color: G.muted, fontWeight: '600' },
  submitBtn:     { flex: 2, backgroundColor: G.teal, borderRadius: 12, padding: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: G.bg },
  resolution:    { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  resolutionText:{ fontSize: 14, fontWeight: '700', textAlign: 'center' },
  history:       { width: '100%' },
  historyLabel:  { fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  historyRow:    { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: G.card, borderRadius: 8, padding: 10, marginBottom: 6, borderWidth: 0.5, borderColor: G.border },
  historyGuess:  { fontSize: 16 },
  historyFeedback:{ fontSize: 11, color: G.muted },
});
