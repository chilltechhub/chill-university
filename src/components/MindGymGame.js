// src/components/MindGymGame.js
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
import { MIND_BANK } from '../data/gameContent/mindGym';

const BLURBS = {
  'K-2': 'Naming feelings and calming down.',
  '3-5': 'Mindfulness, growth mindset, and gratitude.',
  '6-8': 'Self-talk, reframing, and emotional regulation.',
  '9-12': 'Resilience, burnout, and asking for help.',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.prompt));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function MindGymGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const { level, setLevel, tier: savedTier } = useGradeLevel('mindgym');
  const [started, setStarted] = useState(false);
  const [pace, setPace] = useState('relaxed');

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [q, setQ] = useState(null);
  const [opts, setOpts] = useState([]);
  // Rounds within a run — shorter first round, longer as you clear more
  // (see roundLength() in difficultyAdapter.js). No points land until a
  // round finishes and its prize is picked (see RoundCompleteScreen).
  const [stage, setStage] = useState(0);
  const [stageAsked, setStageAsked] = useState(0);
  const [stageCorrect, setStageCorrect] = useState(0);
  const [roundComplete, setRoundComplete] = useState(null); // { correct, total, roundNumber, isLastStage }
  const stageTarget = roundLength(stage);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  // Relaxed pace streams a fact in the question view's own empty space;
  // Rush pace shows one fact per round instead, on RoundCompleteScreen —
  // either way it's the SAME pool, just a different rhythm.
  const { next: nextFact } = useGameFacts('mindgym');
  const [fact, setFact] = useState(null);
  // Relaxed pace: a fresh fact every few questions, not every one — see factCountRef below.
  const factCountRef = useRef(0);

  const game = useGame({ subject: 'mental', difficulty: adaptive.tier, skillLevel: level, onGameEnd, manualScoring: true });

  const beginRun = (selectedPace = 'relaxed') => {
    setPace(selectedPace);
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    const first = pickNext(MIND_BANK[levelForTier(initial.tier)], []);
    recentRef.current = [first.prompt];
    setQ(first);
    setOpts(shuffle(first.options));
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
        const pool = MIND_BANK[levelForTier(tier)];
        const next = pickNext(pool, recentRef.current);
        recentRef.current = [...recentRef.current, next.prompt];
        setQ(next);
        setOpts(shuffle(next.options));
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    factCountRef.current += 1;
    setFact(factCountRef.current % 3 === 0 ? nextFact() : null);
  }, [nextFact]);

  const handleAnswer = useCallback((opt) => {
    if (selected || !q) return;
    setSelected(opt);
    const isCorrect = opt === q.correct;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 4 ? 5 : 0 });
    setFeedback({ isCorrect, explanation: q.explanation, correct: q.correct });

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
    }, 1900);
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
      <GradeSelectCard gameId="mindgym" showPace
        title="Mind Gym" emoji="🧠" subjectLabel="Mental Wellness"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="mindgym"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Mind Gym Champion!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );


  if (roundComplete) {
    return (
      <GameShell gameId="mindgym" disableFactToast
      title="Mind Gym" emoji="🧠" subject={`Mental Wellness · ${levelForTier(adaptive.tier)}`}
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
    <GameShell gameId="mindgym" disableFactToast
      title="Mind Gym" emoji="🧠" subject={`Mental Wellness · ${levelForTier(adaptive.tier)}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={stageAsked / stageTarget}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Round {stage + 1} of {STAGE_COUNT} · Question {stageAsked + 1} of {stageTarget}</Text>

        <View style={s.card}>
          <Text style={s.prompt}>{q.prompt}</Text>
        </View>

        <RushTimerBar active={pace === 'rush' && !feedback} durationMs={4000} resetKey={q} onExpire={() => handleAnswer('__TIMEOUT__')} />
        <View style={s.options}>
          {opts.map(opt => {
            let bg = G.card, border = G.border;
            if (selected) {
              if (opt === q.correct) { bg = G.success + '22'; border = G.success; }
              else if (opt === selected) { bg = G.error + '22'; border = G.error; }
            }
            return (
              <TouchableOpacity
                key={opt}
                style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(opt)}
                disabled={!!selected}
              >
                <Text style={s.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ Correct!' : `✗ It's "${feedback.correct}"`}
            </Text>
            <Text style={s.feedbackText}>{feedback.explanation}</Text>
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
  scroll:      { padding: 16, paddingBottom: 40 },
  progress:    { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  card:        { backgroundColor: G.card, borderRadius: 16, padding: 22, borderWidth: 0.5, borderColor: G.border, marginBottom: 16, alignItems: 'center' },
  prompt:      { fontSize: 17, color: G.cream, textAlign: 'center', lineHeight: 24, fontWeight: '600' },
  options:     { gap: 10, marginBottom: 16 },
  option:      { borderWidth: 1, borderRadius: 12, padding: 16 },
  optionText:  { fontSize: 14, color: G.cream, lineHeight: 18 },
  feedback:    { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 6 },
  feedbackText:{ fontSize: 13, color: G.cream, lineHeight: 18 },
  factBox:     { backgroundColor: G.card, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, padding: 14, marginTop: 16 },
  factLabel:   { fontSize: 11, color: G.gold, fontWeight: '700', marginBottom: 4 },
  factText:    { fontSize: 13, color: G.cream, lineHeight: 18 },
});
