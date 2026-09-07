// src/components/SurviveMonthGame.js
// Survive the Month — a Reigns-style day-by-day budget survival game.
// One card per day, 2-3 trade-off options each (Cash vs. Stress vs.
// "good" financial habit), sampled without repeats from that band's pool
// (see data/gameContent/surviveMonth.js). Cash hitting $0 or below ends
// the run immediately (an overdraft); Stress maxing out forces an
// automatic "burnout" expense instead of ending things outright — a
// second, softer warning before the hard failure.
//
// Each round is its own short week (day count grows via the shared
// roundLength() curve, same as every other round-based game), and
// resets cash/stress fresh — deliberately: this is meant to be a quick,
// replayable "try a different strategy" loop, not one long carried-over
// balance like Budget Trail.

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
import { roundLength, STAGE_COUNT } from '../logic/difficultyAdapter';
import { SURVIVE_BANK } from '../data/gameContent/surviveMonth';

const BLURBS = {
  'K-2': 'A 7-ish day allowance week — small choices, small stakes.',
  '3-5': 'A school week budget — trending games, group projects, spare change.',
  '6-8': 'A part-time job week — sneaker drops, subscriptions, gig income.',
  '9-12': 'A month of independent living — rent, credit, and real emergency funds.',
};

const STRESS_MAX = 100;

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function SurviveMonthGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const { level, setLevel } = useGradeLevel('survivemonth');
  const [started, setStarted] = useState(false);

  const [bank, setBank] = useState(null);
  const [week, setWeek] = useState(0);
  const [deck, setDeck] = useState([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [cash, setCash] = useState(0);
  const [stress, setStress] = useState(0);
  const [goodChoices, setGoodChoices] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [roundComplete, setRoundComplete] = useState(null);
  const journeyFailedRef = useRef(false);

  const game = useGame({ subject: 'finance', difficulty: 2, skillLevel: level, onGameEnd, manualScoring: true });

  const startWeek = (b, weekNum) => {
    const days = roundLength(weekNum);
    const picked = shuffle(b.cardPool).slice(0, Math.min(days, b.cardPool.length));
    setDeck(picked);
    setDayIndex(0);
    setCash(b.startingCash);
    setStress(b.startingStress);
    setGoodChoices(0);
    setFeedback(null);
    setBurnout(null);
  };

  const beginRun = () => {
    const b = SURVIVE_BANK[level];
    setBank(b);
    setWeek(0);
    journeyFailedRef.current = false;
    startWeek(b, 0);
    setStarted(true);
  };

  const card = deck[dayIndex];

  const finishWeek = useCallback((finalGoodChoices, daysPlayed) => {
    const nextWeek = week + 1;
    setRoundComplete({
      correct: finalGoodChoices, total: daysPlayed,
      roundNumber: week + 1, isLastStage: nextWeek >= STAGE_COUNT,
    });
  }, [week]);

  const applyOutcome = useCallback((cashDelta, stressDelta, isGood, tip) => {
    const speed = 0;
    game.answer(isGood, { speedBonus: speed });

    const newCash = cash + cashDelta;
    const newStressRaw = stress + stressDelta;

    if (newCash <= 0) {
      setCash(newCash);
      setFeedback({ tip, fail: true, cashDelta, stressDelta, msg: 'Overdraft — your cash balance hit $0.' });
      setTimeout(() => { journeyFailedRef.current = true; game.endGame(); }, 2200);
      return;
    }

    if (newStressRaw >= STRESS_MAX) {
      // Burnout — forced emergency spending, stress relieved but at a real cost.
      const emergencyCost = Math.round(newCash * 0.2);
      const afterBurnout = newCash - emergencyCost;
      setCash(afterBurnout);
      setStress(50);
      setBurnout({ cost: emergencyCost });
      if (afterBurnout <= 0) {
        setFeedback({ tip, fail: true, cashDelta, stressDelta, msg: `Burnout forced $${emergencyCost} in emergency spending — that wiped you out.` });
        setTimeout(() => { journeyFailedRef.current = true; game.endGame(); }, 2600);
        return;
      }
      setFeedback({ tip, fail: false, cashDelta, stressDelta, msg: `Stress maxed out — burnout forced $${emergencyCost} in emergency spending.` });
    } else {
      setCash(newCash);
      setStress(newStressRaw);
      setFeedback({ tip, fail: false, cashDelta, stressDelta, msg: null });
    }

    const newGood = goodChoices + (isGood ? 1 : 0);
    setGoodChoices(newGood);

    setTimeout(() => {
      setFeedback(null);
      setBurnout(null);
      const nextDay = dayIndex + 1;
      if (nextDay >= deck.length) {
        finishWeek(newGood, deck.length);
      } else {
        // Next day's paycheck/allowance arrives before that day's card —
        // a steady trickle to balance against, not a pile to coast on.
        setCash(c => c + bank.incomePerDay);
        setDayIndex(nextDay);
      }
    }, 2200);
  }, [cash, stress, goodChoices, dayIndex, deck.length, game, finishWeek, bank]);

  const handleChoice = (opt) => {
    if (feedback) return;
    applyOutcome(opt.cash, opt.stress, opt.good, opt.tip);
  };

  const handleClaimPrize = useCallback(() => {
    setRoundComplete(null);
    if (roundComplete?.isLastStage) {
      game.endGame();
      return;
    }
    const nextWeek = week + 1;
    setWeek(nextWeek);
    startWeek(bank, nextWeek);
  }, [game, roundComplete, week, bank]);

  if (!started) {
    return (
      <GradeSelectCard gameId="survivemonth"
        title="Survive the Month" emoji="📅" subjectLabel="Financial Strategy"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) {
    const title = journeyFailedRef.current ? 'Ran Out of Cash' : 'Survived the Month!';
    return (
      <GameOver gameId="survivemonth"
        score={game.score} correct={game.correct} total={game.attempted}
        streak={game.bestStreak} title={title}
        onPlayAgain={() => { game.reset(); setStarted(false); }}
        onQuit={() => navigation.goBack()}
      />
    );
  }

  if (roundComplete) {
    return (
      <GameShell gameId="survivemonth" disableFactToast
        title="Survive the Month" emoji="📅" subject={`Financial Strategy · ${level}`}
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

  if (!card) return null;

  const stressColor = stress >= 75 ? G.error : stress >= 45 ? G.warning : G.success;

  return (
    <GameShell gameId="survivemonth"
      title="Survive the Month" emoji="📅" subject={`Financial Strategy · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={dayIndex / deck.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.weekTitle}>{bank.title}</Text>
        <Text style={s.progress}>Week {week + 1} of {STAGE_COUNT} · Day {dayIndex + 1} of {deck.length}</Text>

        <View style={s.resourceRow}>
          <View style={[s.resourceCard, { borderColor: cash > 0 ? G.success : G.error }]}>
            <Text style={s.resourceLabel}>Cash</Text>
            <Text style={[s.resourceAmount, { color: cash > 0 ? G.success : G.error }]}>${cash}</Text>
          </View>
          <View style={[s.resourceCard, { borderColor: stressColor }]}>
            <Text style={s.resourceLabel}>Stress</Text>
            <Text style={[s.resourceAmount, { color: stressColor }]}>{Math.min(stress, STRESS_MAX)}</Text>
            <View style={s.stressBarBg}>
              <View style={[s.stressBarFill, { width: `${Math.min(100, (stress / STRESS_MAX) * 100)}%`, backgroundColor: stressColor }]} />
            </View>
          </View>
          <View style={[s.resourceCard, { borderColor: G.gold }]}>
            <Text style={s.resourceLabel}>Good Choices</Text>
            <Text style={[s.resourceAmount, { color: G.gold }]}>{goodChoices}</Text>
          </View>
        </View>

        {burnout && (
          <View style={s.burnoutBanner}>
            <Text style={s.burnoutText}>{emojiPrefix('🔥', showEmojis)}Burnout! Emergency spending: -${burnout.cost}</Text>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.prompt}>{card.prompt}</Text>
        </View>

        {/* No cash/stress preview here on purpose — real decisions don't
            come with a spreadsheet attached. The actual effect only shows
            up in the feedback panel below, after you've committed. */}
        <View style={s.options}>
          {card.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[s.optionBtn, feedback && { opacity: 0.6 }]}
              onPress={() => handleChoice(opt)}
              disabled={!!feedback}
            >
              <Text style={s.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.fail ? G.error : G.border }]}>
            {feedback.msg && (
              <Text style={[s.feedbackMsg, { color: feedback.fail ? G.error : G.gold }]}>{feedback.msg}</Text>
            )}
            <View style={s.revealRow}>
              {feedback.cashDelta !== 0 && (
                <Text style={[s.deltaText, { color: feedback.cashDelta > 0 ? G.success : G.error }]}>
                  {feedback.cashDelta > 0 ? '+' : ''}${feedback.cashDelta}
                </Text>
              )}
              {feedback.stressDelta !== 0 && (
                <Text style={[s.deltaText, { color: feedback.stressDelta > 0 ? G.error : G.success }]}>
                  {feedback.stressDelta > 0 ? '+' : ''}{feedback.stressDelta} stress
                </Text>
              )}
            </View>
            <Text style={s.tipText}>{emojiPrefix('💡', showEmojis)}{feedback.tip}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:         { padding: 16, paddingBottom: 40 },
  weekTitle:      { fontSize: 18, fontWeight: '700', color: G.cream, textAlign: 'center' },
  progress:       { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 },
  resourceRow:    { flexDirection: 'row', gap: 8, marginBottom: 14 },
  resourceCard:   { flex: 1, backgroundColor: G.card, borderWidth: 1.5, borderRadius: 14, padding: 10, alignItems: 'center' },
  resourceLabel:  { fontSize: 9, color: G.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  resourceAmount: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  stressBarBg:    { width: '100%', height: 5, borderRadius: 3, backgroundColor: G.border, overflow: 'hidden' },
  stressBarFill:  { height: '100%', borderRadius: 3 },
  burnoutBanner:  { backgroundColor: G.error + '22', borderWidth: 1, borderColor: G.error, borderRadius: 10, padding: 10, marginBottom: 12 },
  burnoutText:    { fontSize: 12, color: G.error, fontWeight: '700', textAlign: 'center' },
  card:           { backgroundColor: G.card, borderRadius: 16, padding: 22, alignItems: 'center', borderWidth: 0.5, borderColor: G.border, marginBottom: 16 },
  prompt:         { fontSize: 16, color: G.cream, textAlign: 'center', lineHeight: 22, fontWeight: '600' },
  options:        { gap: 10, marginBottom: 16 },
  optionBtn:      { backgroundColor: G.card, borderWidth: 1, borderColor: G.border, borderRadius: 12, padding: 14 },
  optionLabel:    { fontSize: 14, color: G.cream, fontWeight: '600' },
  revealRow:      { flexDirection: 'row', gap: 12, marginBottom: 8 },
  deltaText:      { fontSize: 12, fontWeight: '700' },
  feedback:       { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14 },
  feedbackMsg:    { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  tipText:        { fontSize: 12, color: G.cream, lineHeight: 17 },
});
