// src/components/ShiftManagerGame.js
// Shift Manager — a Reigns-style day-by-day retail-operations survival
// game. Structurally identical to SurviveMonthGame.js (same round/resource/
// burnout-equivalent shape) with two renamed resources:
//   Till  — the shift's operating health. Hits $0 and the shift is a bust.
//   Risk  — accumulated loss-prevention/safety/compliance exposure. Maxing
//           it forces an "incident" (an audit finding, a citation, a viral
//           bad review) — costly, but a softer warning than an outright
//           failure, same as surviveMonth.js's burnout.
// See data/gameContent/shiftManager.js for why the four grade-band keys
// are reused as experience tiers rather than literal school grades.

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
import { SHIFT_BANK } from '../data/gameContent/shiftManager';
import { shuffle } from '../logic/optionOrder';

const TIER_LABELS = {
  'K-2': 'Opening Shift', '3-5': 'Weekday Lead', '6-8': 'Holiday Rush', '9-12': 'Shift Lead',
};

const BLURBS = {
  'K-2': 'Basic floor calls — spills, coverage, and staying presentable.',
  '3-5': 'Returns, deliveries, and register hiccups on a busy weekday.',
  '6-8': 'Loss prevention calls and staffing gaps during the holiday rush.',
  '9-12': 'Till discrepancies, dual control, and real compliance calls.',
};

const RISK_MAX = 100;

export default function ShiftManagerGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const { level, setLevel } = useGradeLevel('shiftmanager', { byAge: false });
  const [started, setStarted] = useState(false);

  const [bank, setBank] = useState(null);
  const [week, setWeek] = useState(0);
  const [deck, setDeck] = useState([]);
  const [dayIndex, setDayIndex] = useState(0);
  const [till, setTill] = useState(0);
  const [risk, setRisk] = useState(0);
  const [goodChoices, setGoodChoices] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [incident, setIncident] = useState(null);
  const [roundComplete, setRoundComplete] = useState(null);
  const journeyFailedRef = useRef(false);

  const game = useGame({ subject: 'career', difficulty: 2, skillLevel: level, onGameEnd, manualScoring: true });

  const startWeek = (b, weekNum) => {
    const days = roundLength(weekNum);
    // Options are shuffled too: the content lists the good one wherever it
    // was written, and a fixed order turns the game into "always tap the top".
    const picked = shuffle(b.cardPool)
      .slice(0, Math.min(days, b.cardPool.length))
      .map(card => ({ ...card, options: shuffle(card.options) }));
    setDeck(picked);
    setDayIndex(0);
    setTill(b.startingTill);
    setRisk(b.startingRisk);
    setGoodChoices(0);
    setFeedback(null);
    setIncident(null);
  };

  const beginRun = () => {
    const b = SHIFT_BANK[level];
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

  const applyOutcome = useCallback((tillDelta, riskDelta, isGood, tip) => {
    game.answer(isGood, { speedBonus: 0 });

    const newTill = till + tillDelta;
    const newRiskRaw = risk + riskDelta;

    if (newTill <= 0) {
      setTill(newTill);
      setFeedback({ tip, fail: true, tillDelta, riskDelta, msg: 'Shift went bust — the till dropped to $0.' });
      setTimeout(() => { journeyFailedRef.current = true; game.endGame(); }, 2200);
      return;
    }

    if (newRiskRaw >= RISK_MAX) {
      // Incident — a forced compliance/safety/reputation cost, risk relieved
      // afterward, same "softer warning" shape as surviveMonth's burnout.
      const incidentCost = Math.round(newTill * 0.2);
      const afterIncident = newTill - incidentCost;
      setTill(afterIncident);
      setRisk(50);
      setIncident({ cost: incidentCost });
      if (afterIncident <= 0) {
        setFeedback({ tip, fail: true, tillDelta, riskDelta, msg: `An incident forced a $${incidentCost} cost — that wiped out the till.` });
        setTimeout(() => { journeyFailedRef.current = true; game.endGame(); }, 2600);
        return;
      }
      setFeedback({ tip, fail: false, tillDelta, riskDelta, msg: `Risk maxed out — an incident forced a $${incidentCost} cost.` });
    } else {
      setTill(newTill);
      setRisk(newRiskRaw);
      setFeedback({ tip, fail: false, tillDelta, riskDelta, msg: null });
    }

    const newGood = goodChoices + (isGood ? 1 : 0);
    setGoodChoices(newGood);

    setTimeout(() => {
      setFeedback(null);
      setIncident(null);
      const nextDay = dayIndex + 1;
      if (nextDay >= deck.length) {
        finishWeek(newGood, deck.length);
      } else {
        // Next shift's baseline sales trickle in before that day's card —
        // a steady stream to balance against, not a pile to coast on.
        setTill(c => c + bank.incomePerDay);
        setDayIndex(nextDay);
      }
    }, 2200);
  }, [till, risk, goodChoices, dayIndex, deck.length, game, finishWeek, bank]);

  const handleChoice = (opt) => {
    if (feedback) return;
    applyOutcome(opt.till, opt.risk, opt.good, opt.tip);
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
      <GradeSelectCard gameId="shiftmanager"
        title="Shift Manager" emoji="🏪" subjectLabel="Retail Operations"
        blurbs={BLURBS} tierLabels={TIER_LABELS} pickerPrompt="Choose your shift difficulty"
        level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) {
    const title = journeyFailedRef.current ? 'Shift Went Bust' : 'Shift Complete!';
    return (
      <GameOver gameId="shiftmanager"
        score={game.score} correct={game.correct} total={game.attempted}
        streak={game.bestStreak} title={title}
        onPlayAgain={() => { game.reset(); setStarted(false); }}
        onQuit={() => navigation.goBack()}
      />
    );
  }

  if (roundComplete) {
    return (
      <GameShell gameId="shiftmanager" disableFactToast
        title="Shift Manager" emoji="🏪" subject={`Retail Operations · ${TIER_LABELS[level]}`}
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

  const riskColor = risk >= 75 ? G.error : risk >= 45 ? G.warning : G.success;

  return (
    <GameShell gameId="shiftmanager"
      title="Shift Manager" emoji="🏪" subject={`Retail Operations · ${TIER_LABELS[level]}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={dayIndex / deck.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.weekTitle}>{bank.title}</Text>
        <Text style={s.progress}>Round {week + 1} of {STAGE_COUNT} · Shift {dayIndex + 1} of {deck.length}</Text>

        <View style={s.resourceRow}>
          <View style={[s.resourceCard, { borderColor: till > 0 ? G.success : G.error }]}>
            <Text style={s.resourceLabel}>Till</Text>
            <Text style={[s.resourceAmount, { color: till > 0 ? G.success : G.error }]}>${till}</Text>
          </View>
          <View style={[s.resourceCard, { borderColor: riskColor }]}>
            <Text style={s.resourceLabel}>Risk</Text>
            <Text style={[s.resourceAmount, { color: riskColor }]}>{Math.min(risk, RISK_MAX)}</Text>
            <View style={s.riskBarBg}>
              <View style={[s.riskBarFill, { width: `${Math.min(100, (risk / RISK_MAX) * 100)}%`, backgroundColor: riskColor }]} />
            </View>
          </View>
          <View style={[s.resourceCard, { borderColor: G.gold }]}>
            <Text style={s.resourceLabel}>Sound Calls</Text>
            <Text style={[s.resourceAmount, { color: G.gold }]}>{goodChoices}</Text>
          </View>
        </View>

        {incident && (
          <View style={s.incidentBanner}>
            <Text style={s.incidentText}>{emojiPrefix('🚨', showEmojis)}Incident! Compliance cost: -${incident.cost}</Text>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.prompt}>{card.prompt}</Text>
        </View>

        {/* No till/risk preview here on purpose — real shift decisions don't
            come with the outcome pre-labeled. The effect only shows up in
            the feedback panel below, after you've committed. */}
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
              {feedback.tillDelta !== 0 && (
                <Text style={[s.deltaText, { color: feedback.tillDelta > 0 ? G.success : G.error }]}>
                  {feedback.tillDelta > 0 ? '+' : ''}${feedback.tillDelta}
                </Text>
              )}
              {feedback.riskDelta !== 0 && (
                <Text style={[s.deltaText, { color: feedback.riskDelta > 0 ? G.error : G.success }]}>
                  {feedback.riskDelta > 0 ? '+' : ''}{feedback.riskDelta} risk
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
  riskBarBg:      { width: '100%', height: 5, borderRadius: 3, backgroundColor: G.border, overflow: 'hidden' },
  riskBarFill:    { height: '100%', borderRadius: 3 },
  incidentBanner: { backgroundColor: G.error + '22', borderWidth: 1, borderColor: G.error, borderRadius: 10, padding: 10, marginBottom: 12 },
  incidentText:   { fontSize: 12, color: G.error, fontWeight: '700', textAlign: 'center' },
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
