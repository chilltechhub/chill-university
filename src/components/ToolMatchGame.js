// src/components/ToolMatchGame.js
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier } from '../logic/difficultyAdapter';
import { TOOL_BANK } from '../data/gameContent/toolMatch';

const SESSION_LENGTH = 14;

const BLURBS = {
  'K-2': 'Common hand tools everyone recognizes.',
  '3-5': 'Shop staples — saws, wrenches, ladders, levels.',
  '6-8': 'Power tools & the safety gear that goes with them.',
  '9-12': 'Precision instruments & pro-level shop equipment.',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function pickNext(pool, avoid) {
  const choices = pool.filter(q => !avoid.includes(q.tool));
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function ToolMatchGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel, tier: savedTier } = useGradeLevel('tools');
  const [started, setStarted] = useState(false);

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [q, setQ] = useState(null);
  const [opts, setOpts] = useState([]);
  const [asked, setAsked] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'home_ec', difficulty: adaptive.tier, skillLevel: level, onGameEnd });

  const beginRun = () => {
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    const first = pickNext(TOOL_BANK[levelForTier(initial.tier)], []);
    recentRef.current = [first.tool];
    setQ(first);
    setOpts(shuffle([first.correct, ...first.distractors]));
    setAsked(0);
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    setStarted(true);
  };

  const handleAnswer = useCallback((opt) => {
    if (selected || !q) return;
    setSelected(opt);
    const isCorrect = opt === q.correct;
    const speed = (Date.now() - startTime) / 1000;
    const speedBonus = speed < 4 ? 5 : 0;
    game.answer(isCorrect, { speedBonus });
    setFeedback({ isCorrect, explanation: q.explanation, funFact: q.funFact, tip: q.tip });

    const nextAdaptiveState = nextAdaptiveTier(adaptive, isCorrect);
    setAdaptive(nextAdaptiveState);

    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      setStartTime(Date.now());
      const willEnd = game.lives - (isCorrect ? 0 : 1) <= 0 || asked + 1 >= SESSION_LENGTH;
      if (willEnd) {
        game.endGame();
      } else {
        const pool = TOOL_BANK[levelForTier(nextAdaptiveState.tier)];
        const next = pickNext(pool, recentRef.current);
        recentRef.current = [...recentRef.current.slice(-4), next.tool];
        setQ(next);
        setOpts(shuffle([next.correct, ...next.distractors]));
        setAsked(a => a + 1);
      }
    }, 2200);
  }, [selected, q, startTime, game, asked, adaptive]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Tool Match" emoji="🔧" subjectLabel="Home Economics"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Tools Mastered!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!q) return null;

  return (
    <GameShell
      title="Tool Match" emoji="🔧" subject={`Home Economics · ${levelForTier(adaptive.tier)}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={asked / SESSION_LENGTH}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Tool {asked + 1} of {SESSION_LENGTH}</Text>

        <View style={s.toolCard}>
          <Text style={s.toolEmoji}>{q.tool.split(' ')[0]}</Text>
          <Text style={s.toolName}>{q.tool.replace(/^\S+\s/, '')}</Text>
          <Text style={s.toolQuestion}>What is this tool used for?</Text>
        </View>

        <View style={s.options}>
          {opts.map(opt => {
            let bg = G.card, border = G.border;
            if (selected) {
              if (opt === q.correct) { bg = G.success + '22'; border = G.success; }
              else if (opt === selected) { bg = G.error + '22'; border = G.error; }
            }
            return (
              <TouchableOpacity key={opt} style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(opt)} disabled={!!selected}>
                <Text style={s.optionText}>{opt}</Text>
                {selected && opt === q.correct && <Text style={{ color: G.success, fontSize: 18 }}>✓</Text>}
                {selected && opt === selected && !feedback?.isCorrect && <Text style={{ color: G.error, fontSize: 18 }}>✗</Text>}
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
            <View style={s.factBox}>
              <Text style={s.factLabel}>💡 Fun Fact</Text>
              <Text style={s.factText}>{feedback.funFact}</Text>
            </View>
            <Text style={s.tipText}>🦺 {feedback.tip}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:     { padding: 16, paddingBottom: 40 },
  progress:   { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  toolCard:   { backgroundColor: G.card, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 0.5, borderColor: G.border, marginBottom: 16 },
  toolEmoji:  { fontSize: 52, marginBottom: 8 },
  toolName:   { fontSize: 22, fontWeight: '700', color: G.cream, marginBottom: 6 },
  toolQuestion:{ fontSize: 13, color: G.muted },
  options:    { gap: 10, marginBottom: 16 },
  option:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16 },
  optionText: { fontSize: 14, color: G.cream, flex: 1 },
  feedback:   { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16, gap: 10 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700' },
  feedbackText:{ fontSize: 13, color: G.cream, lineHeight: 18 },
  factBox:    { backgroundColor: G.border, borderRadius: 8, padding: 10 },
  factLabel:  { fontSize: 11, color: G.gold, fontWeight: '600', marginBottom: 4 },
  factText:   { fontSize: 12, color: G.cream, lineHeight: 16 },
  tipText:    { fontSize: 12, color: G.muted, fontStyle: 'italic' },
});
