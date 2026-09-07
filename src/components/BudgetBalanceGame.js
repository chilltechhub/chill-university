// src/components/BudgetBalanceGame.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import RoundCompleteScreen from './RoundCompleteScreen';
import useGame from '../logic/useGame';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier, STAGE_COUNT } from '../logic/difficultyAdapter';
import { BUDGET_BANK } from '../data/gameContent/budgetBalance';

const BLURBS = {
  'K-2': 'Small budgets, obvious needs vs wants.',
  '3-5': 'Bigger budgets, sneakier "want" items.',
  '6-8': 'Savings-first thinking and fundraiser math.',
  '9-12': 'Real-world budgets — rent, loans, paychecks.',
};

// `avoid` accumulates every scenario title served this run — see the same
// note on RecipeBuilderGame's pickRecipe.
function pickNext(pool, avoid = []) {
  const choices = pool.filter(sc => !avoid.includes(sc.title));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function BudgetBalanceGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel, tier: savedTier } = useGradeLevel('budget');
  const [started, setStarted] = useState(false);

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const [sc, setSc] = useState(null);
  const [asked, setAsked] = useState(0);
  const [cuts, setCuts] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [roundComplete, setRoundComplete] = useState(null);
  const recentRef = useRef([]);

  const game = useGame({ subject: 'finance', difficulty: adaptive.tier, skillLevel: level, onGameEnd, manualScoring: true });

  const beginRun = () => {
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    const first = pickNext(BUDGET_BANK[levelForTier(initial.tier)], []);
    recentRef.current = [first.title];
    setSc(first);
    setAsked(0);
    setCuts([]);
    setFeedback(null);
    setStartTime(Date.now());
    setStarted(true);
  };

  const toggleCut = (item) => {
    if (feedback) return;
    setCuts(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]);
  };

  const totalAfterCuts = sc ? sc.expenses
    .filter(e => !cuts.includes(e.item))
    .reduce((sum, e) => sum + e.cost, 0) : 0;

  const checkAnswer = useCallback(() => {
    if (feedback || !sc) return;
    const withinBudget = totalAfterCuts <= sc.budget;
    const cutEssential = cuts.some(c => {
      const exp = sc.expenses.find(e => e.item === c);
      return exp?.essential;
    });
    const isCorrect = withinBudget && !cutEssential;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 15 ? 5 : 0 });

    const nextAdaptiveState = nextAdaptiveTier(adaptive, isCorrect);
    setAdaptive(nextAdaptiveState);

    let msg = isCorrect
      ? `✓ Budget balanced! $${totalAfterCuts} of $${sc.budget}`
      : cutEssential
        ? '✗ You cut something essential!'
        : `✗ Still $${totalAfterCuts - sc.budget} over budget!`;

    setFeedback({ isCorrect, msg, lesson: sc.lesson });

    setTimeout(() => {
      setFeedback(null);
      setCuts([]);
      setStartTime(Date.now());
      const outOfLives = game.lives - (isCorrect ? 0 : 1) <= 0;
      const newAsked = asked + 1;

      if (outOfLives) {
        game.endGame();
      } else if (isCorrect) {
        // A balanced budget is a round win — a miss just moves to the next
        // scenario with no prize pick, same as elsewhere.
        setAsked(newAsked);
        setRoundComplete({
          correct: 1, total: 1,
          roundNumber: newAsked, isLastStage: newAsked >= STAGE_COUNT, nextTier: nextAdaptiveState.tier,
        });
      } else {
        const pool = BUDGET_BANK[levelForTier(nextAdaptiveState.tier)];
        const next = pickNext(pool, recentRef.current);
        recentRef.current = [...recentRef.current, next.title];
        setSc(next);
        setAsked(newAsked);
      }
    }, 2200);
  }, [cuts, sc, totalAfterCuts, feedback, game, asked, startTime, adaptive]);

  const handleClaimPrize = useCallback(() => {
    if (roundComplete?.isLastStage) {
      setRoundComplete(null);
      game.endGame();
      return;
    }
    const pool = BUDGET_BANK[levelForTier(roundComplete.nextTier)];
    const next = pickNext(pool, recentRef.current);
    recentRef.current = [...recentRef.current, next.title];
    setSc(next);
    setRoundComplete(null);
  }, [game, roundComplete]);

  if (!started) {
    return (
      <GradeSelectCard gameId="budget"
        title="Budget Balance" emoji="💰" subjectLabel="Financial Literacy"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="budget"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Budget Master!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (roundComplete) {
    return (
      <GameShell gameId="budget" disableFactToast
        title="Budget Balance" emoji="💰" subject={`Financial Literacy · ${levelForTier(adaptive.tier)}`}
        score={game.score} lives={game.lives} streak={game.streak}
      >
        <RoundCompleteScreen
          roundNumber={roundComplete.roundNumber}
          correct={roundComplete.correct}
          total={roundComplete.total}
          streak={game.streak}
          difficulty={adaptive.tier}
          onAward={game.addPoints}
          onAdvance={handleClaimPrize}
        />
      </GameShell>
    );
  }

  if (!sc) return null;

  return (
    <GameShell gameId="budget"
      title="Budget Balance" emoji="💰" subject={`Financial Literacy · ${levelForTier(adaptive.tier)}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={asked / STAGE_COUNT}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Scenario {asked + 1} of {STAGE_COUNT}</Text>

        <View style={s.card}>
          <Text style={s.scenarioTitle}>{sc.title}</Text>
          <Text style={s.story}>{sc.story}</Text>
          <View style={s.budgetRow}>
            <Text style={s.budgetLabel}>Budget</Text>
            <Text style={s.budgetAmount}>${sc.budget}</Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>Tap items to cut (non-essentials only)</Text>

        {sc.expenses.map(exp => {
          const isCut = cuts.includes(exp.item);
          return (
            <TouchableOpacity
              key={exp.item}
              style={[s.expense, isCut && s.expenseCut, exp.essential && s.expenseEssential]}
              onPress={() => toggleCut(exp.item)}
              disabled={!!feedback}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.expenseName, isCut && s.expenseNameCut]}>{exp.item}</Text>
                {exp.essential && <Text style={s.essentialBadge}>essential</Text>}
              </View>
              <Text style={[s.expenseCost, isCut && s.expenseCostCut]}>${exp.cost}</Text>
              {isCut && <Text style={s.cutIcon}>✗</Text>}
            </TouchableOpacity>
          );
        })}

        <View style={[s.totalRow, { borderColor: totalAfterCuts <= sc.budget ? G.success : G.error }]}>
          <Text style={s.totalLabel}>Total after cuts</Text>
          <Text style={[s.totalAmount, { color: totalAfterCuts <= sc.budget ? G.success : G.error }]}>
            ${totalAfterCuts} / ${sc.budget}
          </Text>
        </View>

        {/* Fill meter — reads at a glance instead of only a colored number.
            The track's scale is whichever is bigger, spend or budget, so
            the budget line sits AT 100% width when you're under it, and
            slides back to show how far past it you've gone when you're
            over — the number still says the amount, the bar says the shape. */}
        <View style={s.meterBg}>
          <View
            style={[
              s.meterFill,
              {
                width: `${(totalAfterCuts / Math.max(totalAfterCuts, sc.budget, 1)) * 100}%`,
                backgroundColor: totalAfterCuts <= sc.budget ? G.success : G.error,
              },
            ]}
          />
          <View
            style={[
              s.meterBudgetLine,
              { left: `${(sc.budget / Math.max(totalAfterCuts, sc.budget, 1)) * 100}%` },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[s.checkBtn, feedback && { opacity: 0.5 }]}
          onPress={checkAnswer}
          disabled={!!feedback}
        >
          <Text style={s.checkBtnText}>Check Budget</Text>
        </TouchableOpacity>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.msg}
            </Text>
            <Text style={s.feedbackLesson}>{feedback.lesson}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:         { padding: 16, paddingBottom: 40 },
  progress:       { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  card:           { backgroundColor: G.card, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: G.border, marginBottom: 14 },
  scenarioTitle:  { fontSize: 16, fontWeight: '700', color: G.cream, marginBottom: 6 },
  story:          { fontSize: 13, color: G.muted, lineHeight: 18, marginBottom: 10 },
  budgetRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: G.goldL, borderRadius: 8, padding: 10, borderWidth: 0.5, borderColor: G.gold },
  budgetLabel:    { fontSize: 12, color: G.gold, fontWeight: '600' },
  budgetAmount:   { fontSize: 20, fontWeight: '700', color: G.gold },
  sectionLabel:   { fontSize: 11, color: G.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  expense:        { flexDirection: 'row', alignItems: 'center', backgroundColor: G.card, borderRadius: 10, padding: 14, marginBottom: 6, borderWidth: 0.5, borderColor: G.border },
  expenseCut:     { backgroundColor: G.error + '11', borderColor: G.error },
  expenseEssential:{ borderColor: G.teal + '66' },
  expenseName:    { fontSize: 14, color: G.cream, fontWeight: '500' },
  expenseNameCut: { textDecorationLine: 'line-through', color: G.muted },
  essentialBadge: { fontSize: 9, color: G.teal, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  expenseCost:    { fontSize: 15, fontWeight: '700', color: G.cream, marginRight: 6 },
  expenseCostCut: { color: G.muted },
  cutIcon:        { fontSize: 16, color: G.error },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderRadius: 10, padding: 12, marginVertical: 12 },
  totalLabel:     { fontSize: 13, color: G.muted },
  totalAmount:    { fontSize: 16, fontWeight: '700' },
  meterBg:        { height: 14, borderRadius: 7, backgroundColor: G.border, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  meterFill:      { height: '100%', borderRadius: 7 },
  meterBudgetLine:{ position: 'absolute', top: -2, bottom: -2, width: 2, backgroundColor: G.cream, marginLeft: -1 },
  checkBtn:       { backgroundColor: G.gold, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 12 },
  checkBtnText:   { fontSize: 15, fontWeight: '700', color: G.bg },
  feedback:       { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:  { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  feedbackLesson: { fontSize: 13, color: G.cream, lineHeight: 18 },
});
