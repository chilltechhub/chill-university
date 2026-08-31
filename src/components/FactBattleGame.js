// src/components/FactBattleGame.js
// A Top-Trumps-style card battle (Science: animal stats) — draw a card,
// pick which stat to bet on before your rival's card is revealed, then
// see who wins that stat. Every deck's stat values are all distinct
// (verified in factBattle.js), so there's never an ambiguous tie.

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';
import { CARD_DECKS, STAT_LABELS } from '../data/gameContent/factBattle';

const SESSION_LENGTH = 8;
const STATS = ['Speed', 'Size', 'Lifespan'];

const BLURBS = {
  'K-2': 'Familiar animals, obvious stat differences.',
  '3-5': 'Wider animal cast, bigger stat range.',
  '6-8': 'Trickier animals, closer calls.',
  '9-12': 'Extreme records — you need real knowledge.',
};

function drawRound(deck) {
  const player = deck[Math.floor(Math.random() * deck.length)];
  let rival = deck[Math.floor(Math.random() * deck.length)];
  while (rival.name === player.name) {
    rival = deck[Math.floor(Math.random() * deck.length)];
  }
  return { player, rival };
}

export default function FactBattleGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('factbattle');
  const [started, setStarted] = useState(false);

  const [round, setRound] = useState(null);
  const [asked, setAsked] = useState(0);
  const [pickedStat, setPickedStat] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const game = useGame({ subject: 'science', difficulty: 2, skillLevel: level, onGameEnd });

  const beginRun = () => {
    setRound(drawRound(CARD_DECKS[level]));
    setAsked(0);
    setPickedStat(null);
    setFeedback(null);
    setStarted(true);
  };

  const handlePickStat = useCallback((stat) => {
    if (feedback || !round) return;
    setPickedStat(stat);
    const playerVal = round.player.stats[stat];
    const rivalVal = round.rival.stats[stat];
    const isCorrect = playerVal > rivalVal;
    game.answer(isCorrect);
    setFeedback({ isCorrect, stat, playerVal, rivalVal });

    setTimeout(() => {
      setFeedback(null);
      setPickedStat(null);
      const willEnd = game.lives - (isCorrect ? 0 : 1) <= 0 || asked + 1 >= SESSION_LENGTH;
      if (willEnd) {
        game.endGame();
      } else {
        setRound(drawRound(CARD_DECKS[level]));
        setAsked(a => a + 1);
      }
    }, 2200);
  }, [feedback, round, game, asked, level]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Fact Battle" emoji="🃏" subjectLabel="Science · Card Battle"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Battle Champion!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!round) return null;

  return (
    <GameShell
      title="Fact Battle" emoji="🃏" subject={`Science · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={asked / SESSION_LENGTH}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Round {asked + 1} of {SESSION_LENGTH}</Text>
        <Text style={s.instruction}>Pick a stat where your card wins — your rival's card is hidden!</Text>

        <View style={s.cardsRow}>
          <View style={s.card}>
            <Text style={s.cardLabel}>Your Card</Text>
            <Text style={s.cardEmoji}>{round.player.emoji}</Text>
            <Text style={s.cardName}>{round.player.name}</Text>
            {STATS.map(stat => (
              <TouchableOpacity
                key={stat}
                style={[s.statRow, pickedStat === stat && s.statRowPicked, !!feedback && s.statRowDisabled]}
                onPress={() => handlePickStat(stat)}
                disabled={!!feedback}
              >
                <Text style={s.statLabel}>{STAT_LABELS[stat].emoji} {stat}</Text>
                <Text style={s.statValue}>{round.player.stats[stat]}{STAT_LABELS[stat].unit}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.card}>
            <Text style={s.cardLabel}>Rival Card</Text>
            {feedback ? (
              <>
                <Text style={s.cardEmoji}>{round.rival.emoji}</Text>
                <Text style={s.cardName}>{round.rival.name}</Text>
                {STATS.map(stat => (
                  <View key={stat} style={[s.statRow, stat === feedback.stat && s.statRowPicked]}>
                    <Text style={s.statLabel}>{STAT_LABELS[stat].emoji} {stat}</Text>
                    <Text style={s.statValue}>{round.rival.stats[stat]}{STAT_LABELS[stat].unit}</Text>
                  </View>
                ))}
              </>
            ) : (
              <View style={s.mystery}>
                <Text style={s.mysteryText}>?</Text>
              </View>
            )}
          </View>
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackText, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ You win this round!' : '✗ Your rival wins this round.'}
            </Text>
            <Text style={s.feedbackDetail}>
              {feedback.stat}: {round.player.name} {feedback.playerVal} vs {round.rival.name} {feedback.rivalVal}
            </Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:      { padding: 16, paddingBottom: 40 },
  progress:    { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  instruction: { fontSize: 12, color: G.gold, textAlign: 'center', marginBottom: 16 },
  cardsRow:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  card:        { flex: 1, backgroundColor: G.card, borderRadius: 14, padding: 12, borderWidth: 0.5, borderColor: G.border, alignItems: 'center' },
  cardLabel:   { fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  cardEmoji:   { fontSize: 40, marginBottom: 4 },
  cardName:    { fontSize: 13, fontWeight: '700', color: G.cream, marginBottom: 10, textAlign: 'center' },
  mystery:     { width: '100%', height: 150, alignItems: 'center', justifyContent: 'center' },
  mysteryText: { fontSize: 48, color: G.faint, fontWeight: '800' },
  statRow:     { flexDirection: 'row', justifyContent: 'space-between', width: '100%', backgroundColor: G.bg, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, borderWidth: 1, borderColor: G.border },
  statRowPicked: { borderColor: G.gold, backgroundColor: G.goldL },
  statRowDisabled: { opacity: 0.7 },
  statLabel:   { fontSize: 11, color: G.muted },
  statValue:   { fontSize: 12, fontWeight: '700', color: G.cream },
  feedback:    { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  feedbackText:{ fontSize: 14, fontWeight: '700', marginBottom: 6 },
  feedbackDetail: { fontSize: 12, color: G.muted },
});
