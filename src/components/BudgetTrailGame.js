// src/components/BudgetTrailGame.js
// A multi-round resource-management strategy game — not a quiz. Your
// balance CARRIES OVER between rounds, so an optional purchase now can
// leave you short for a bigger cost later. Running out of money ends the
// journey immediately, which is the whole point: every journey is
// winnable if you never overspend, and every journey punishes buying
// everything offered (verified by simulation in the content file).

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';
import { TRAIL_BANK } from '../data/gameContent/budgetTrail';

const BLURBS = {
  'K-2': 'A 3-round lemonade stand budget.',
  '3-5': 'A 4-round school year budget.',
  '6-8': 'A 5-round summer job budget.',
  '9-12': 'A 6-round first-apartment budget.',
};

export default function BudgetTrailGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('trail');
  const [started, setStarted] = useState(false);

  const [journey, setJourney] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [balance, setBalance] = useState(0);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'finance', difficulty: 2, skillLevel: level, onGameEnd });

  const beginRun = () => {
    const j = TRAIL_BANK[level];
    setJourney(j);
    setRoundIndex(0);
    setBalance(j.startingBalance);
    setSelected(j.rounds[0].optional.map(() => false));
    setFeedback(null);
    setStartTime(Date.now());
    setStarted(true);
  };

  const toggleOptional = (i) => {
    if (feedback) return;
    setSelected(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const round = journey?.rounds[roundIndex];
  const optSum = round ? round.optional.reduce((sum, o, i) => selected[i] ? sum + o.cost : sum, 0) : 0;
  const total = round ? round.required.cost + optSum : 0;

  const handleConfirm = useCallback(() => {
    if (feedback || !round) return;
    const isCorrect = total <= balance;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 20 ? 5 : 0 });

    const newBalance = balance - total;
    setBalance(newBalance);
    setFeedback({
      isCorrect,
      msg: isCorrect
        ? `✓ Round complete! $${newBalance} left.`
        : `✗ You needed $${total} but only had $${balance}. Journey over.`,
    });

    setTimeout(() => {
      setFeedback(null);
      if (!isCorrect) { game.endGame(); return; }
      const nextIdx = roundIndex + 1;
      if (nextIdx >= journey.rounds.length) {
        game.endGame();
      } else {
        setRoundIndex(nextIdx);
        setSelected(journey.rounds[nextIdx].optional.map(() => false));
        setStartTime(Date.now());
      }
    }, 2400);
  }, [feedback, round, total, balance, game, roundIndex, journey, startTime]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Budget Trail" emoji="🧳" subjectLabel="Financial Strategy"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Trail Complete!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!round) return null;

  return (
    <GameShell
      title="Budget Trail" emoji="🧳" subject={`Financial Strategy · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={roundIndex / journey.rounds.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.journeyTitle}>{journey.title}</Text>
        <Text style={s.progress}>Round {roundIndex + 1} of {journey.rounds.length}</Text>

        <View style={[s.balanceCard, { borderColor: balance >= total ? G.success : G.error }]}>
          <Text style={s.balanceLabel}>Current Balance</Text>
          <Text style={[s.balanceAmount, { color: balance >= total ? G.success : G.error }]}>${balance}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.roundTitle}>{round.title}</Text>
          <Text style={s.story}>{round.story}</Text>
        </View>

        <View style={s.requiredRow}>
          <Text style={s.requiredLabel}>Required: {round.required.label}</Text>
          <Text style={s.requiredCost}>${round.required.cost}</Text>
        </View>

        {round.optional.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Optional — your choice</Text>
            {round.optional.map((opt, i) => (
              <TouchableOpacity
                key={opt.label}
                style={[s.optionalRow, selected[i] && s.optionalRowSelected]}
                onPress={() => toggleOptional(i)}
                disabled={!!feedback}
              >
                <Text style={s.optionalName}>{opt.label}</Text>
                <Text style={s.optionalCost}>${opt.cost}</Text>
                <View style={[s.checkbox, selected[i] && s.checkboxChecked]}>
                  {selected[i] && <Text style={s.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={[s.totalRow, { borderColor: total <= balance ? G.success : G.error }]}>
          <Text style={s.totalLabel}>Total this round</Text>
          <Text style={[s.totalAmount, { color: total <= balance ? G.success : G.error }]}>${total}</Text>
        </View>

        <TouchableOpacity
          style={[s.confirmBtn, feedback && { opacity: 0.5 }]}
          onPress={handleConfirm}
          disabled={!!feedback}
        >
          <Text style={s.confirmBtnText}>Confirm Round</Text>
        </TouchableOpacity>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackText, { color: feedback.isCorrect ? G.success : G.error }]}>{feedback.msg}</Text>
            {!feedback.isCorrect && <Text style={s.lessonText}>💡 {journey.lesson}</Text>}
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:         { padding: 16, paddingBottom: 40 },
  journeyTitle:   { fontSize: 18, fontWeight: '700', color: G.cream, textAlign: 'center' },
  progress:       { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  balanceCard:    { backgroundColor: G.card, borderWidth: 1.5, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 14 },
  balanceLabel:   { fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  balanceAmount:  { fontSize: 30, fontWeight: '800' },
  card:           { backgroundColor: G.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: G.border, marginBottom: 12 },
  roundTitle:     { fontSize: 15, fontWeight: '700', color: G.cream, marginBottom: 4 },
  story:          { fontSize: 13, color: G.muted, lineHeight: 18 },
  requiredRow:    { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: G.tealL, borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: G.teal, marginBottom: 12 },
  requiredLabel:  { fontSize: 13, color: G.teal, fontWeight: '700' },
  requiredCost:   { fontSize: 15, color: G.teal, fontWeight: '800' },
  sectionLabel:   { fontSize: 11, color: G.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  optionalRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: G.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: G.border },
  optionalRowSelected: { borderColor: G.gold, backgroundColor: G.goldL },
  optionalName:   { flex: 1, fontSize: 13, color: G.cream },
  optionalCost:   { fontSize: 14, fontWeight: '700', color: G.cream, marginRight: 10 },
  checkbox:       { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: G.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:{ backgroundColor: G.gold, borderColor: G.gold },
  checkmark:      { color: G.bg, fontWeight: '800', fontSize: 13 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 12 },
  totalLabel:     { fontSize: 13, color: G.muted },
  totalAmount:    { fontSize: 16, fontWeight: '700' },
  confirmBtn:     { backgroundColor: G.gold, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 12 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: G.bg },
  feedback:       { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackText:   { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  lessonText:     { fontSize: 13, color: G.gold, lineHeight: 18 },
});
