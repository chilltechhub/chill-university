// src/components/WordTypeGame.js
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
import { WORD_BANK, WORD_TYPE_COLORS } from '../data/gameContent/wordDetective';

const BLURBS = {
  'K-2': 'Simple sentences — noun, verb, adjective, adverb.',
  '3-5': 'Trickier sentences, plus pronouns, prepositions & conjunctions.',
  '6-8': 'Multi-use words, linking verbs & relative pronouns.',
  '9-12': 'Gerunds, participles, interjections & complex clause structure.',
};

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.word + q.sentence));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function WordTypeGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const { level, setLevel, tier: savedTier } = useGradeLevel('word');
  const [started, setStarted] = useState(false);
  const [pace, setPace] = useState('relaxed');

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [q, setQ] = useState(null);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  // Rounds within a run — shorter first round, longer as you clear more
  // (see roundLength() in difficultyAdapter.js). No points land until a
  // round finishes and its prize is picked (see RoundCompleteScreen).
  const [stage, setStage] = useState(0);
  const [stageAsked, setStageAsked] = useState(0);
  const [stageCorrect, setStageCorrect] = useState(0);
  const [roundComplete, setRoundComplete] = useState(null); // { correct, total, roundNumber, isLastStage }
  const stageTarget = roundLength(stage);

  // Relaxed pace streams a fact in the question view's own empty space;
  // Rush pace shows one fact per round instead, on RoundCompleteScreen —
  // either way it's the SAME pool, just a different rhythm.
  const { next: nextFact } = useGameFacts('word');
  const [fact, setFact] = useState(null);
  // Relaxed pace: a fresh fact every few questions, not every one — see factCountRef below.
  const factCountRef = useRef(0);

  const game = useGame({ subject: 'language_arts', difficulty: adaptive.tier, skillLevel: level, onGameEnd, manualScoring: true });

  const beginRun = (selectedPace = 'relaxed') => {
    setPace(selectedPace);
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    recentRef.current = [];
    const first = pickNext(WORD_BANK[levelForTier(initial.tier)], []);
    recentRef.current = [first.word + first.sentence];
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
    const pool = WORD_BANK[levelForTier(tier)];
    const nextQ = pickNext(pool, recentRef.current);
    recentRef.current = [...recentRef.current, nextQ.word + nextQ.sentence];
    setQ(nextQ);
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    factCountRef.current += 1;
    setFact(factCountRef.current % 3 === 0 ? nextFact() : null);
  }, [nextFact]);

  const handleAnswer = useCallback((option) => {
    if (selected || !q) return;
    setSelected(option);
    const isCorrect = option === q.correct;
    const speed = (Date.now() - startTime) / 1000;
    const speedBonus = speed < 3 ? 5 : 0;
    game.answer(isCorrect, { speedBonus });
    setFeedback({ isCorrect, explanation: q.explanation });

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
  }, [selected, q, startTime, game, adaptive, stage, stageAsked, stageCorrect, stageTarget, loadNext]);

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
      <GradeSelectCard gameId="word" showPace
        title="Word Detective" emoji="📖" subjectLabel="Language Arts"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) {
    return (
      <GameOver gameId="word"
        score={game.score} correct={game.correct} total={game.attempted}
        streak={game.bestStreak} title="Case Closed, Detective!"
        onPlayAgain={() => { game.reset(); setStarted(false); }}
        onQuit={() => navigation.goBack()}
      />
    );
  }

  if (roundComplete) {
    return (
      <GameShell gameId="word" disableFactToast
        title="Word Detective"
        emoji="📖"
        subject={`Language Arts · ${levelForTier(adaptive.tier)}`}
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
    <GameShell gameId="word" disableFactToast
      title="Word Detective"
      emoji="📖"
      subject={`Language Arts · ${levelForTier(adaptive.tier)}`}
      score={game.score}
      lives={game.lives}
      streak={game.streak}
      progress={stageAsked / stageTarget}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Round {stage + 1} of {STAGE_COUNT} · Question {stageAsked + 1} of {stageTarget}</Text>

        <View style={s.card}>
          <Text style={s.label}>What type of word is...</Text>
          <View style={s.wordBadge}>
            <Text style={s.word}>"{q.word}"</Text>
          </View>
          <Text style={s.sentence}>
            {q.sentence.split(q.word).map((part, i, arr) => (
              <Text key={i}>
                {part}
                {i < arr.length - 1 && (
                  <Text style={s.highlight}>{q.word}</Text>
                )}
              </Text>
            ))}
          </Text>
        </View>

        <RushTimerBar active={pace === 'rush' && !feedback} durationMs={3000} resetKey={q} onExpire={() => handleAnswer('__TIMEOUT__')} />
        <View style={s.options}>
          {q.options.map(opt => {
            let bg = G.card;
            let border = G.border;
            if (selected) {
              if (opt === q.correct) { bg = G.success + '33'; border = G.success; }
              else if (opt === selected && !feedback?.isCorrect) { bg = G.error + '33'; border = G.error; }
            }
            return (
              <TouchableOpacity
                key={opt}
                style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(opt)}
                disabled={!!selected}
              >
                <View style={[s.optionDot, { backgroundColor: WORD_TYPE_COLORS[opt] || G.muted }]} />
                <Text style={s.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ Correct!' : '✗ Not quite!'}
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
  card:        { backgroundColor: G.card, borderRadius: 16, padding: 20, borderWidth: 0.5, borderColor: G.border, marginBottom: 16, alignItems: 'center' },
  label:       { fontSize: 13, color: G.muted, marginBottom: 12 },
  wordBadge:   { backgroundColor: G.goldL, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 14, borderWidth: 0.5, borderColor: G.gold },
  word:        { fontSize: 22, fontWeight: '700', color: G.gold },
  sentence:    { fontSize: 15, color: G.cream, textAlign: 'center', lineHeight: 22 },
  highlight:   { color: G.gold, fontWeight: '700' },
  options:     { gap: 10, marginBottom: 16 },
  option:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 16 },
  optionDot:   { width: 10, height: 10, borderRadius: 5 },
  optionText:  { fontSize: 16, fontWeight: '600', color: G.cream, textTransform: 'capitalize' },
  feedback:    { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 6 },
  feedbackText:{ fontSize: 13, color: G.cream, lineHeight: 18 },
  factBox:     { backgroundColor: G.card, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, padding: 14, marginTop: 16 },
  factLabel:   { fontSize: 11, color: G.gold, fontWeight: '700', marginBottom: 4 },
  factText:    { fontSize: 13, color: G.cream, lineHeight: 18 },
});
