// src/components/WordScrambleGame.js
// A word-unscramble puzzle (Language Arts) — tap letters to spell the
// word before you run out of lives. A hint is always shown.

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';
import { SCRAMBLE_BANK } from '../data/gameContent/wordScramble';

const SESSION_LENGTH = 5;

const BLURBS = {
  'K-2': 'Short 3-4 letter words.',
  '3-5': '5-6 letter everyday words.',
  '6-8': 'Longer academic vocabulary.',
  '9-12': 'Advanced, multi-syllable words.',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function scrambleWord(word) {
  const letters = word.split('').map((letter, i) => ({ id: `${i}-${letter}`, letter }));
  let attempts = 0;
  let shuffled = shuffle(letters);
  while (attempts < 10 && shuffled.map(l => l.letter).join('') === word) {
    shuffled = shuffle(letters);
    attempts++;
  }
  return shuffled;
}

function pickNext(pool, avoid) {
  const choices = pool.filter(w => !avoid.includes(w.word));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function WordScrambleGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('scramble');
  const [started, setStarted] = useState(false);

  const [current, setCurrent] = useState(null);
  const [pool, setPool] = useState([]);
  const [guess, setGuess] = useState([]);
  const [asked, setAsked] = useState(0);
  const [recent, setRecent] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const game = useGame({ subject: 'language_arts', difficulty: 2, skillLevel: level, onGameEnd });

  const loadWord = (entry, avoidList) => {
    setCurrent(entry);
    setPool(scrambleWord(entry.word));
    setGuess([]);
    setFeedback(null);
    return [...avoidList.slice(-3), entry.word];
  };

  const beginRun = () => {
    const first = pickNext(SCRAMBLE_BANK[level], []);
    setRecent(loadWord(first, []));
    setAsked(0);
    setStarted(true);
  };

  const tapPoolTile = (tile) => {
    if (feedback) return;
    setPool(prev => prev.filter(t => t.id !== tile.id));
    setGuess(prev => [...prev, tile]);
  };

  const tapGuessTile = (tile) => {
    if (feedback) return;
    setGuess(prev => prev.filter(t => t.id !== tile.id));
    setPool(prev => [...prev, tile]);
  };

  const handleCheck = useCallback(() => {
    if (feedback || !current || guess.length !== current.word.length) return;
    const attempt = guess.map(t => t.letter).join('');
    const isCorrect = attempt === current.word;
    game.answer(isCorrect);
    setFeedback({ isCorrect, msg: isCorrect ? `✓ ${current.word} — correct!` : `✗ It was ${current.word}` });

    setTimeout(() => {
      const willEnd = game.lives - (isCorrect ? 0 : 1) <= 0 || asked + 1 >= SESSION_LENGTH;
      if (willEnd) {
        game.endGame();
      } else {
        const next = pickNext(SCRAMBLE_BANK[level], recent);
        setRecent(loadWord(next, recent));
        setAsked(a => a + 1);
      }
    }, 1800);
  }, [feedback, current, guess, game, asked, level, recent]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Word Scramble" emoji="🔤" subjectLabel="Language Arts"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Word Wizard!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!current) return null;

  return (
    <GameShell
      title="Word Scramble" emoji="🔤" subject={`Language Arts · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={asked / SESSION_LENGTH}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Word {asked + 1} of {SESSION_LENGTH}</Text>
        <Text style={s.hint}>💡 {current.hint}</Text>

        <View style={s.guessRow}>
          {current.word.split('').map((_, i) => (
            <TouchableOpacity
              key={i}
              style={s.guessSlot}
              onPress={() => guess[i] && tapGuessTile(guess[i])}
              disabled={!guess[i] || !!feedback}
            >
              <Text style={s.guessLetter}>{guess[i]?.letter || ''}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.poolRow}>
          {pool.map(tile => (
            <TouchableOpacity key={tile.id} style={s.tile} onPress={() => tapPoolTile(tile)} disabled={!!feedback}>
              <Text style={s.tileLetter}>{tile.letter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[s.checkBtn, (guess.length !== current.word.length || !!feedback) && s.checkBtnDisabled]}
          onPress={handleCheck}
          disabled={guess.length !== current.word.length || !!feedback}
        >
          <Text style={s.checkBtnText}>Check Word</Text>
        </TouchableOpacity>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackText, { color: feedback.isCorrect ? G.success : G.error }]}>{feedback.msg}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:      { padding: 16, paddingBottom: 40, alignItems: 'center' },
  progress:    { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  hint:        { fontSize: 14, color: G.gold, textAlign: 'center', marginBottom: 24 },
  guessRow:    { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 24 },
  guessSlot:   { width: 42, height: 48, borderRadius: 8, backgroundColor: G.card, borderWidth: 1.5, borderColor: G.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  guessLetter: { fontSize: 20, fontWeight: '700', color: G.cream },
  poolRow:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 24 },
  tile:        { width: 44, height: 50, borderRadius: 8, backgroundColor: G.gold, alignItems: 'center', justifyContent: 'center' },
  tileLetter:  { fontSize: 20, fontWeight: '800', color: G.bg },
  checkBtn:    { width: '100%', backgroundColor: G.teal, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  checkBtnDisabled: { opacity: 0.4 },
  checkBtnText:{ fontSize: 15, fontWeight: '700', color: G.bg },
  feedback:    { width: '100%', backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  feedbackText:{ fontSize: 15, fontWeight: '700' },
});
