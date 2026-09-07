// src/components/FoodSortGame.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import { useUIPrefs } from '../../context/UIPrefsContext';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import RushTimerBar from './RushTimerBar';
import RoundCompleteScreen from './RoundCompleteScreen';
import useGame from '../logic/useGame';
import useGameFacts from '../logic/useGameFacts';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier, roundLength, STAGE_COUNT } from '../logic/difficultyAdapter';
import { FOOD_BANK, NUTRITION_TIPS } from '../data/gameContent/foodSort';

const BLURBS = {
  'K-2': 'Obvious healthy vs junk food picks.',
  '3-5': 'Adds "moderate" foods — pizza, cheese, juice.',
  '6-8': 'Sneaky ones — granola bars, trail mix, sports drinks.',
  '9-12': 'Nutrition science — glycemic index, processed protein, additives.',
};

function getCatConfig(G) {
  return {
    Healthy:  { color: G.success, label: '✓ Healthy',  bg: G.success + '22' },
    Moderate: { color: G.warning, label: '~ Moderate', bg: G.warning + '22' },
    Junk:     { color: G.error,   label: '✗ Junk',     bg: G.error + '22' },
  };
}

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.food));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function FoodSortGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const CAT_CONFIG = getCatConfig(G);
  const { level, setLevel, tier: savedTier } = useGradeLevel('junk');
  const [started, setStarted] = useState(false);
  const [pace, setPace] = useState('relaxed');

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [q, setQ] = useState(null);
  // Rounds within a run — shorter first round, longer as you clear more
  // (see roundLength() in difficultyAdapter.js). No points land until a
  // round finishes and its prize is picked (see RoundCompleteScreen).
  const [stage, setStage] = useState(0);
  const [stageAsked, setStageAsked] = useState(0);
  const [stageCorrect, setStageCorrect] = useState(0);
  const [roundComplete, setRoundComplete] = useState(null); // { correct, total, roundNumber, isLastStage }
  const stageTarget = roundLength(stage);
  const [tip] = useState(() => NUTRITION_TIPS[Math.floor(Math.random() * NUTRITION_TIPS.length)]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  // Relaxed pace streams a fact in the question view's own empty space;
  // Rush pace shows one fact per round instead, on RoundCompleteScreen —
  // either way it's the SAME pool, just a different rhythm.
  const { next: nextFact } = useGameFacts('junk');
  const [fact, setFact] = useState(null);
  // Relaxed pace: a fresh fact every few questions, not every one — see factCountRef below.
  const factCountRef = useRef(0);

  const game = useGame({ subject: 'health', difficulty: adaptive.tier, skillLevel: level, onGameEnd, manualScoring: true });

  const beginRun = (selectedPace = 'relaxed') => {
    setPace(selectedPace);
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    const first = pickNext(FOOD_BANK[levelForTier(initial.tier)], []);
    recentRef.current = [first.food];
    setQ(first);
    setStage(0);
    setStageAsked(0);
    setStageCorrect(0);
    setRoundComplete(null);
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    factCountRef.current = 0;
    setFact(nextFact());
    setStarted(true);
  };

  const loadNext = useCallback((tier) => {
        const pool = FOOD_BANK[levelForTier(tier)];
        const next = pickNext(pool, recentRef.current);
        recentRef.current = [...recentRef.current, next.food];
        setQ(next);
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    factCountRef.current += 1;
    setFact(factCountRef.current % 3 === 0 ? nextFact() : null);
  }, [nextFact]);

  const handleAnswer = useCallback((cat) => {
    if (selected || !q) return;
    setSelected(cat);
    const isCorrect = cat === q.category;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 3 ? 5 : 0 });
    setFeedback({ isCorrect, fact: q.fact, correct: q.category });

    const nextAdaptiveState = nextAdaptiveTier(adaptive, isCorrect);
    setAdaptive(nextAdaptiveState);

    setTimeout(() => {
      const newStageAsked = stageAsked + 1;
      const newStageCorrect = stageCorrect + (isCorrect ? 1 : 0);
      const outOfLives = game.lives - (isCorrect ? 0 : 1) <= 0;
      const stageDone = newStageAsked >= stageTarget;

      if (outOfLives) {
        game.endGame();
      } else if (stageDone) {
        setStageAsked(newStageAsked);
        setStageCorrect(newStageCorrect);
        setRoundComplete({
          correct: newStageCorrect, total: newStageAsked,
          roundNumber: stage + 1, isLastStage: stage + 1 >= STAGE_COUNT,
        });
      } else {
        setStageAsked(newStageAsked);
        setStageCorrect(newStageCorrect);
        loadNext(nextAdaptiveState.tier);
      }
    }, 1800);
  }, [selected, q, startTime, game, stage, stageAsked, stageCorrect, stageTarget, loadNext, adaptive]);

  const handleClaimPrize = useCallback(() => {
    if (roundComplete?.isLastStage) {
      setRoundComplete(null);
      game.endGame();
    } else {
      setStage(s => s + 1);
      setStageAsked(0);
      setStageCorrect(0);
      setRoundComplete(null);
      loadNext(adaptive.tier);
    }
  }, [game, roundComplete, adaptive.tier, loadNext]);

  if (!started) {
    return (
      <GradeSelectCard gameId="junk" showPace
        title="Food Sort" emoji="🍎" subjectLabel="Health"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="junk"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Nutrition Expert!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );


  if (roundComplete) {
    return (
      <GameShell gameId="junk" disableFactToast
      title="Food Sort" emoji="🍎" subject={`Health & Nutrition · ${levelForTier(adaptive.tier)}`}
        score={game.score} lives={game.lives} streak={game.streak}
      >
        <RoundCompleteScreen
          roundNumber={roundComplete.roundNumber}
          correct={roundComplete.correct}
          total={roundComplete.total}
          streak={game.streak}
          difficulty={adaptive.tier}
          fact={pace === 'rush' ? fact : null}
          onAward={game.addPoints}
          onAdvance={handleClaimPrize}
        />
      </GameShell>
    );
  }

  if (!q) return null;

  return (
    <GameShell gameId="junk" disableFactToast
      title="Food Sort" emoji="🍎" subject={`Health & Nutrition · ${levelForTier(adaptive.tier)}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={stageAsked / stageTarget}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Round {stage + 1} of {STAGE_COUNT} · {stageAsked + 1} / {stageTarget}</Text>

        <View style={s.tipBanner}>
          <Text style={s.tipText}>{tip}</Text>
        </View>

        <View style={s.foodCard}>
          <Text style={s.foodEmoji}>{q.emoji}</Text>
          <Text style={s.foodName}>Is {q.food.replace(/^\S+\s/, '')} healthy, moderate, or junk food?</Text>
        </View>

        <RushTimerBar active={pace === 'rush' && !feedback} durationMs={3000} resetKey={q} onExpire={() => handleAnswer('__TIMEOUT__')} />
        <View style={s.options}>
          {Object.entries(CAT_CONFIG).map(([cat, cfg]) => {
            let bg = cfg.bg, border = cfg.color;
            if (selected && cat !== q.category) { bg = G.card; border = G.border; }
            if (selected && cat === q.category) { bg = G.success + '33'; border = G.success; }
            return (
              <TouchableOpacity
                key={cat}
                style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(cat)}
                disabled={!!selected}
              >
                <Text style={[s.optionText, { color: cfg.color }]}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ Correct!' : `✗ It's ${feedback.correct}!`}
            </Text>
            <Text style={s.feedbackFact}>{q.fact}</Text>
          </View>
        )}

        {pace === 'relaxed' && !!fact && (
          <View style={s.factBox}>
            <Text style={s.factLabel}>{showEmojis ? '💡 ' : ''}Did You Know</Text>
            <Text style={s.factText}>{fact}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:       { padding: 16, paddingBottom: 40 },
  progress:     { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  tipBanner:    { backgroundColor: G.goldL, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 0.5, borderColor: G.gold },
  tipText:      { fontSize: 12, color: G.gold, lineHeight: 16 },
  foodCard:     { backgroundColor: G.card, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 0.5, borderColor: G.border, marginBottom: 16 },
  foodEmoji:    { fontSize: 60, marginBottom: 14 },
  foodName:     { fontSize: 17, fontWeight: '600', color: G.cream, textAlign: 'center' },
  options:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  option:       { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  optionText:   { fontSize: 14, fontWeight: '700' },
  feedback:     { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 6 },
  feedbackFact: { fontSize: 13, color: G.cream, lineHeight: 18 },
  factBox:     { backgroundColor: G.card, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, padding: 14, marginTop: 16 },
  factLabel:   { fontSize: 11, color: G.gold, fontWeight: '700', marginBottom: 4 },
  factText:    { fontSize: 13, color: G.cream, lineHeight: 18 },
});
