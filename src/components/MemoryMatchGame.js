// src/components/MemoryMatchGame.js
// A real memory/matching game — flip two cards, keep them if they match.
// Unlike the quiz games, a mismatch here is normal exploratory play (you're
// gathering information), not a wrong answer — so mismatches don't cost a
// life. Only successful matches feed the scoring system.

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import RoundCompleteScreen from './RoundCompleteScreen';
import useGame from '../logic/useGame';
import useGradeLevel, { tierForLevel } from '../logic/useGradeLevel';
import { MEMORY_BANK } from '../data/gameContent/memoryMatch';

const PAIR_COUNT = { 'K-2': 6, '3-5': 8, '6-8': 8, '9-12': 10 };

const BLURBS = {
  'K-2': '6 pairs — colors, shapes, and animals.',
  '3-5': '8 pairs — vocabulary across subjects.',
  '6-8': '8 pairs — trickier academic terms.',
  '9-12': '10 pairs — advanced concepts.',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function buildBoard(bandKey) {
  const count = PAIR_COUNT[bandKey] || 6;
  const pool = shuffle(MEMORY_BANK[bandKey]).slice(0, count);
  const cards = [];
  pool.forEach((pair, i) => {
    cards.push({ id: `${i}-term`, pairId: i, text: pair.term, type: 'term' });
    cards.push({ id: `${i}-def`, pairId: i, text: pair.definition, type: 'definition' });
  });
  return { cards: shuffle(cards), totalPairs: pool.length };
}

export default function MemoryMatchGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('memory');
  const [started, setStarted] = useState(false);

  const [cards, setCards] = useState([]);
  const [totalPairs, setTotalPairs] = useState(0);
  const [matchedPairIds, setMatchedPairIds] = useState(() => new Set());
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [locked, setLocked] = useState(false);
  const [roundComplete, setRoundComplete] = useState(null);
  const flipStartRef = useRef(Date.now());
  const matchedCountRef = useRef(0);

  const game = useGame({ subject: 'general', difficulty: 2, skillLevel: level, onGameEnd, manualScoring: true });

  const beginRun = () => {
    const board = buildBoard(level);
    setCards(board.cards);
    setTotalPairs(board.totalPairs);
    setMatchedPairIds(new Set());
    matchedCountRef.current = 0;
    setFlippedIndices([]);
    setLocked(false);
    flipStartRef.current = Date.now();
    setStarted(true);
  };

  const handleCardPress = useCallback((idx) => {
    if (locked || flippedIndices.includes(idx) || matchedPairIds.has(cards[idx]?.pairId)) return;

    if (flippedIndices.length === 0) {
      flipStartRef.current = Date.now();
      setFlippedIndices([idx]);
      return;
    }

    if (flippedIndices.length === 1) {
      const first = flippedIndices[0];
      const pair = [first, idx];
      setFlippedIndices(pair);

      if (cards[first].pairId === cards[idx].pairId) {
        const speed = (Date.now() - flipStartRef.current) / 1000;
        game.answer(true, { speedBonus: speed < 3 ? 5 : 0 });
        setTimeout(() => {
          matchedCountRef.current += 1;
          setMatchedPairIds(prev => {
            const next = new Set(prev);
            next.add(cards[first].pairId);
            return next;
          });
          setFlippedIndices([]);
          if (matchedCountRef.current >= totalPairs) {
            setTimeout(() => setRoundComplete({ correct: totalPairs, total: totalPairs, roundNumber: 1, isLastStage: true }), 300);
          }
        }, 500);
      } else {
        setLocked(true);
        setTimeout(() => {
          setFlippedIndices([]);
          setLocked(false);
          flipStartRef.current = Date.now();
        }, 900);
      }
    }
  }, [locked, flippedIndices, matchedPairIds, cards, game, totalPairs]);

  const handleClaimPrize = useCallback(() => {
    setRoundComplete(null);
    game.endGame();
  }, [game]);

  if (!started) {
    return (
      <GradeSelectCard gameId="memory"
        title="Memory Match" emoji="🧩" subjectLabel="Mixed Knowledge"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="memory"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Memory Master!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (roundComplete) {
    return (
      <GameShell gameId="memory" disableFactToast
        title="Memory Match" emoji="🧩" subject={`Mixed Knowledge · ${level}`}
        score={game.score} lives={game.lives} streak={game.streak}
      >
        <RoundCompleteScreen
          roundNumber={roundComplete.roundNumber}
          correct={roundComplete.correct}
          total={roundComplete.total}
          streak={game.streak}
          difficulty={tierForLevel(level)}
          onAward={game.addPoints}
          onAdvance={handleClaimPrize}
        />
      </GameShell>
    );
  }

  return (
    <GameShell gameId="memory"
      title="Memory Match" emoji="🧩" subject={`Mixed Knowledge · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={totalPairs ? matchedPairIds.size / totalPairs : 0}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>{matchedPairIds.size} of {totalPairs} pairs found</Text>
        <View style={s.grid}>
          {cards.map((card, idx) => {
            const isMatched = matchedPairIds.has(card.pairId);
            const isFlipped = isMatched || flippedIndices.includes(idx);
            return (
              <TouchableOpacity
                key={card.id}
                style={[s.card, isFlipped && s.cardFlipped, isMatched && s.cardMatched]}
                onPress={() => handleCardPress(idx)}
                activeOpacity={0.8}
                disabled={isMatched}
              >
                {isFlipped ? (
                  <Text style={s.cardText} numberOfLines={4}>{card.text}</Text>
                ) : (
                  <Text style={s.cardBack}>?</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:   { padding: 12, paddingBottom: 40, alignItems: 'center' },
  progress: { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  card:     {
    width: '22%', height: 92, margin: '1.5%', borderRadius: 10,
    backgroundColor: G.border, borderWidth: 1, borderColor: G.faint,
    alignItems: 'center', justifyContent: 'center', padding: 4,
  },
  cardFlipped: { backgroundColor: G.card, borderColor: G.teal },
  cardMatched: { backgroundColor: G.success + '22', borderColor: G.success },
  cardBack:    { fontSize: 22, color: G.muted, fontWeight: '700' },
  cardText:    { fontSize: 9, color: G.cream, textAlign: 'center', lineHeight: 12 },
});
