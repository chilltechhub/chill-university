// src/components/BudgetTrailGame.js
// Budget Trail v2 — a real budgeting simulation, not a single checkbox
// list compared against a threshold (see the design notes at the top of
// data/gameContent/budgetTrail.js for the full rationale). Every round
// now has income arriving, a randomly-drawn event already applied before
// you decide anything, one or two required bills, several optional wants,
// and a savings choice — and overspending draws from your emergency fund
// before ending the journey, instead of ending it the instant you're $1
// short. Solvability (every journey survivable playing safe, the savings
// goal reachable but not free) is verified by simulation — see the
// scratchpad script this was built with, not shipped in the repo.

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import { useUIPrefs, emojiPrefix } from '../../context/UIPrefsContext';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import RoundCompleteScreen from './RoundCompleteScreen';
import useGame from '../logic/useGame';
import useGradeLevel, { tierForLevel } from '../logic/useGradeLevel';
import { TRAIL_BANK } from '../data/gameContent/budgetTrail';

const BLURBS = {
  'K-2': 'A 3-round lemonade stand — paychecks, surprises, and your first savings jar.',
  '3-5': 'A 4-round school year — an allowance, surprise costs, and building up savings.',
  '6-8': 'A 5-round summer job — real paychecks, real surprises, real savings goals.',
  '9-12': 'A 6-round apartment budget — rent, bills, emergencies, and an emergency fund that matters.',
};

const SAVE_TIER_LABELS = ['Skip saving', 'Save some', 'Save a lot'];

function drawEvent(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function BudgetTrailGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const { level, setLevel } = useGradeLevel('trail');
  const [started, setStarted] = useState(false);

  const [journey, setJourney] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [cash, setCash] = useState(0);
  const [savings, setSavings] = useState(0);
  const [event, setEvent] = useState(null);
  const [selected, setSelected] = useState([]);
  const [saveTierIdx, setSaveTierIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [roundComplete, setRoundComplete] = useState(null);
  const journeyFailedRef = useRef(false);

  const game = useGame({ subject: 'finance', difficulty: 2, skillLevel: level, onGameEnd, manualScoring: true });

  const loadRound = (j, idx, cashOnHand) => {
    const round = j.rounds[idx];
    const drawn = drawEvent(j.eventPool);
    setEvent(drawn);
    setCash(cashOnHand + round.income + drawn.delta);
    setSelected(round.optional.map(() => false));
    setSaveTierIdx(0);
    setFeedback(null);
    setStartTime(Date.now());
  };

  const beginRun = () => {
    const j = TRAIL_BANK[level];
    setJourney(j);
    setRoundIndex(0);
    setSavings(0);
    journeyFailedRef.current = false;
    loadRound(j, 0, j.startingBalance);
    setStarted(true);
  };

  const toggleOptional = (i) => {
    if (feedback) return;
    setSelected(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const round = journey?.rounds[roundIndex];
  const requiredSum = round ? round.required.reduce((sum, r) => sum + r.cost, 0) : 0;
  const optSum = round ? round.optional.reduce((sum, o, i) => selected[i] ? sum + o.cost : sum, 0) : 0;
  const wantsTotal = requiredSum + optSum;
  const saveAmount = journey ? journey.saveTiers[saveTierIdx] : 0;

  const handleConfirm = useCallback(() => {
    if (feedback || !round || !journey) return;
    const speed = (Date.now() - startTime) / 1000;

    let outcome, newCash, newSavings, msg, isCorrect;

    if (cash >= wantsTotal + saveAmount) {
      // Best case — covered bills, wants, AND the savings contribution.
      newCash = cash - wantsTotal - saveAmount;
      newSavings = savings + saveAmount;
      isCorrect = true;
      outcome = 'great';
      msg = saveAmount > 0
        ? `Covered everything and saved $${saveAmount}. $${newCash} left on hand.`
        : `Covered everything with $${newCash} left on hand.`;
    } else if (cash >= wantsTotal) {
      // Covered bills + wants, but nothing left to save this round.
      newCash = cash - wantsTotal;
      newSavings = savings;
      isCorrect = true;
      outcome = 'okay';
      msg = `Covered bills and wants, but nothing left to save this round.`;
    } else {
      // Short on bills + wants alone — draw the gap from savings.
      const shortfall = wantsTotal - cash;
      if (savings >= shortfall) {
        newCash = 0;
        newSavings = savings - shortfall;
        isCorrect = true;
        outcome = 'dipped';
        msg = `Short by $${shortfall} — covered it from your emergency fund.`;
      } else {
        newCash = cash - wantsTotal; // goes negative, shown as the real gap
        newSavings = savings;
        isCorrect = false;
        outcome = 'fail';
        msg = `Short by $${shortfall}, and your emergency fund only had $${savings}.`;
      }
    }

    game.answer(isCorrect, { speedBonus: speed < 20 ? 5 : 0 });
    setCash(newCash);
    setSavings(newSavings);
    setFeedback({ isCorrect, outcome, msg });

    setTimeout(() => {
      setFeedback(null);
      if (!isCorrect) {
        journeyFailedRef.current = true;
        game.endGame();
        return;
      }
      const nextIdx = roundIndex + 1;
      const isLastStage = nextIdx >= journey.rounds.length;
      setRoundComplete({ correct: 1, total: 1, roundNumber: roundIndex + 1, isLastStage });
    }, 2600);
  }, [feedback, round, journey, cash, wantsTotal, saveAmount, savings, game, roundIndex, startTime]);

  const handleClaimPrize = useCallback(() => {
    setRoundComplete(null);
    if (roundComplete?.isLastStage) {
      game.endGame();
      return;
    }
    const nextIdx = roundIndex + 1;
    setRoundIndex(nextIdx);
    loadRound(journey, nextIdx, cash);
  }, [game, roundComplete, roundIndex, journey, cash]);

  if (!started) {
    return (
      <GradeSelectCard gameId="trail"
        title="Budget Trail" emoji="🧳" subjectLabel="Financial Strategy"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) {
    const goalMet = !journeyFailedRef.current && journey && savings >= journey.savingsGoal;
    const halfGoal = !journeyFailedRef.current && journey && savings >= journey.savingsGoal * 0.5;
    const title = journeyFailedRef.current
      ? 'Journey Over'
      : goalMet ? `${emojiPrefix('💎', showEmojis)}Financially Secure!`
      : halfGoal ? 'Getting By'
      : 'Paycheck to Paycheck';
    return (
      <GameOver gameId="trail"
        score={game.score} correct={game.correct} total={game.attempted}
        streak={game.bestStreak} title={title}
        onPlayAgain={() => { game.reset(); setStarted(false); }}
        onQuit={() => navigation.goBack()}
      />
    );
  }

  if (roundComplete) {
    return (
      <GameShell gameId="trail" disableFactToast
        title="Budget Trail" emoji="🧳" subject={`Financial Strategy · ${level}`}
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

  if (!round || !event) return null;

  const spendable = cash;
  const totalOut = wantsTotal + saveAmount;
  const fits = totalOut <= spendable;

  return (
    <GameShell gameId="trail"
      title="Budget Trail" emoji="🧳" subject={`Financial Strategy · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={roundIndex / journey.rounds.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.journeyTitle}>{journey.title}</Text>
        <Text style={s.progress}>Round {roundIndex + 1} of {journey.rounds.length}</Text>

        <View style={s.resourceRow}>
          <View style={[s.resourceCard, { borderColor: fits ? G.success : G.error }]}>
            <Text style={s.resourceLabel}>Cash on Hand</Text>
            <Text style={[s.resourceAmount, { color: fits ? G.success : G.error }]}>${cash}</Text>
          </View>
          <View style={[s.resourceCard, { borderColor: G.gold }]}>
            <Text style={s.resourceLabel}>Emergency Fund</Text>
            <Text style={[s.resourceAmount, { color: G.gold }]}>${savings}</Text>
            <View style={s.savingsBarBg}>
              <View style={[s.savingsBarFill, { width: `${Math.max(0, Math.min(100, (savings / Math.max(journey.savingsGoal, 1)) * 100))}%` }]} />
            </View>
            <Text style={s.savingsGoalText}>Goal: ${journey.savingsGoal}</Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.roundTitle}>{round.title}</Text>
          <Text style={s.story}>{round.story}</Text>
        </View>

        <View style={s.eventRow}>
          <Text style={s.eventText}>{emojiPrefix('💰', showEmojis)}Income this round: +${round.income}</Text>
          {event.delta !== 0 && (
            <Text style={[s.eventText, { color: event.delta > 0 ? G.success : G.error }]}>
              {emojiPrefix(event.delta > 0 ? '✨' : '⚡', showEmojis)}{event.label} ({event.delta > 0 ? '+' : ''}${event.delta})
            </Text>
          )}
        </View>

        <Text style={s.sectionLabel}>Required</Text>
        {round.required.map(r => (
          <View key={r.label} style={s.requiredRow}>
            <Text style={s.requiredLabel}>{r.label}</Text>
            <Text style={s.requiredCost}>${r.cost}</Text>
          </View>
        ))}

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
                <View style={{ flex: 1 }}>
                  <Text style={s.optionalName}>{opt.label}</Text>
                  <Text style={s.optionalFlavor}>{opt.flavor}</Text>
                </View>
                <Text style={s.optionalCost}>${opt.cost}</Text>
                <View style={[s.checkbox, selected[i] && s.checkboxChecked]}>
                  {selected[i] && <Text style={s.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={s.sectionLabel}>Pay yourself first</Text>
        <View style={s.saveTierRow}>
          {journey.saveTiers.map((amt, i) => (
            <TouchableOpacity
              key={i}
              style={[s.saveTierBtn, saveTierIdx === i && s.saveTierBtnActive]}
              onPress={() => !feedback && setSaveTierIdx(i)}
              disabled={!!feedback}
            >
              <Text style={[s.saveTierLabel, saveTierIdx === i && s.saveTierLabelActive]}>{SAVE_TIER_LABELS[i]}</Text>
              <Text style={[s.saveTierAmount, saveTierIdx === i && s.saveTierLabelActive]}>{amt > 0 ? `$${amt}` : '—'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.totalRow, { borderColor: fits ? G.success : G.error }]}>
          <Text style={s.totalLabel}>Total this round</Text>
          <Text style={[s.totalAmount, { color: fits ? G.success : G.error }]}>${totalOut}</Text>
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
            <Text style={[s.feedbackText, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.outcome === 'great' ? '✓ ' : feedback.outcome === 'okay' ? '~ ' : feedback.outcome === 'dipped' ? '⚠ ' : '✗ '}
              {feedback.msg}
            </Text>
            {(feedback.outcome === 'dipped' || feedback.outcome === 'fail') && (
              <Text style={s.lessonText}>{emojiPrefix('💡', showEmojis)}{journey.lesson}</Text>
            )}
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
  resourceRow:    { flexDirection: 'row', gap: 10, marginBottom: 14 },
  resourceCard:   { flex: 1, backgroundColor: G.card, borderWidth: 1.5, borderRadius: 14, padding: 12, alignItems: 'center' },
  resourceLabel:  { fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  resourceAmount: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  savingsBarBg:   { width: '100%', height: 6, borderRadius: 3, backgroundColor: G.border, overflow: 'hidden', marginBottom: 4 },
  savingsBarFill: { height: '100%', borderRadius: 3, backgroundColor: G.gold },
  savingsGoalText:{ fontSize: 9, color: G.muted },
  card:           { backgroundColor: G.card, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: G.border, marginBottom: 12 },
  roundTitle:     { fontSize: 15, fontWeight: '700', color: G.cream, marginBottom: 4 },
  story:          { fontSize: 13, color: G.muted, lineHeight: 18 },
  eventRow:       { backgroundColor: G.card, borderRadius: 10, padding: 10, marginBottom: 12, gap: 4 },
  eventText:      { fontSize: 12, color: G.cream, fontWeight: '600' },
  sectionLabel:   { fontSize: 11, color: G.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  requiredRow:    { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: G.tealL, borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: G.teal, marginBottom: 8 },
  requiredLabel:  { fontSize: 13, color: G.teal, fontWeight: '700' },
  requiredCost:   { fontSize: 15, color: G.teal, fontWeight: '800' },
  optionalRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: G.card, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: G.border },
  optionalRowSelected: { borderColor: G.gold, backgroundColor: G.goldL },
  optionalName:   { fontSize: 13, color: G.cream, fontWeight: '600' },
  optionalFlavor: { fontSize: 11, color: G.muted, marginTop: 2 },
  optionalCost:   { fontSize: 14, fontWeight: '700', color: G.cream, marginRight: 10, marginLeft: 8 },
  checkbox:       { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: G.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:{ backgroundColor: G.gold, borderColor: G.gold },
  checkmark:      { color: G.bg, fontWeight: '800', fontSize: 13 },
  saveTierRow:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
  saveTierBtn:    { flex: 1, backgroundColor: G.card, borderWidth: 1, borderColor: G.border, borderRadius: 10, padding: 10, alignItems: 'center' },
  saveTierBtnActive: { borderColor: G.gold, backgroundColor: G.goldL },
  saveTierLabel:  { fontSize: 11, color: G.muted, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  saveTierLabelActive: { color: G.gold },
  saveTierAmount: { fontSize: 14, color: G.cream, fontWeight: '800' },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  totalLabel:     { fontSize: 13, color: G.muted },
  totalAmount:    { fontSize: 16, fontWeight: '700' },
  confirmBtn:     { backgroundColor: G.gold, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 12 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: G.bg },
  feedback:       { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackText:   { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  lessonText:     { fontSize: 13, color: G.gold, lineHeight: 18 },
});
