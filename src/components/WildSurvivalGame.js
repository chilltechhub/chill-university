// src/components/WildSurvivalGame.js
// A multi-round survival scenario (Science) — not a quiz. Your stamina
// carries over between rounds; picking the wise option costs less than
// picking the risky one, and stamina hitting zero ends the run
// immediately. Verified by simulation in wildSurvival.js: the wise path
// always makes it to the end, the risky path always runs out first.

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel from '../logic/useGradeLevel';
import { SURVIVAL_BANK } from '../data/gameContent/wildSurvival';

const BLURBS = {
  'K-2': 'A gentle 5-round backyard camping trip.',
  '3-5': 'A 5-round day hike.',
  '6-8': 'A tougher 6-round mountain trek.',
  '9-12': 'A high-stakes 6-round wilderness emergency.',
};

export default function WildSurvivalGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('survival');
  const [started, setStarted] = useState(false);

  const [journey, setJourney] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [stamina, setStamina] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const game = useGame({ subject: 'science', difficulty: 2, skillLevel: level, onGameEnd });

  const beginRun = () => {
    const j = SURVIVAL_BANK[level];
    setJourney(j);
    setRoundIndex(0);
    setStamina(j.startingStamina);
    setFeedback(null);
    setStarted(true);
  };

  const handleChoice = useCallback((choiceKey) => {
    if (feedback || !journey) return;
    const round = journey.rounds[roundIndex];
    const choice = round[choiceKey];
    const isCorrect = choiceKey === 'wise';
    game.answer(isCorrect);

    const newStamina = Math.min(100, stamina + choice.delta);
    setStamina(newStamina);
    setFeedback({
      isCorrect,
      msg: `${choice.label} (${choice.delta > 0 ? '+' : ''}${choice.delta} stamina)`,
      survived: newStamina > 0,
    });

    setTimeout(() => {
      setFeedback(null);
      if (newStamina <= 0) {
        game.endGame();
        return;
      }
      const nextIdx = roundIndex + 1;
      if (nextIdx >= journey.rounds.length) {
        game.endGame();
      } else {
        setRoundIndex(nextIdx);
      }
    }, 2000);
  }, [feedback, journey, roundIndex, stamina, game]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Wild Survival" emoji="🏕️" subjectLabel="Science · Survival"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title={stamina > 0 ? 'You Survived!' : "Didn't Make It..."}
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!journey) return null;
  const round = journey.rounds[roundIndex];

  return (
    <GameShell
      title="Wild Survival" emoji="🏕️" subject={`Science · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={roundIndex / journey.rounds.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.journeyTitle}>{journey.title}</Text>
        <Text style={s.progress}>Round {roundIndex + 1} of {journey.rounds.length}</Text>

        <View style={[s.staminaCard, { borderColor: stamina > 40 ? G.success : stamina > 15 ? G.warning : G.error }]}>
          <Text style={s.staminaLabel}>Stamina</Text>
          <Text style={[s.staminaAmount, { color: stamina > 40 ? G.success : stamina > 15 ? G.warning : G.error }]}>{Math.max(0, stamina)}</Text>
          <View style={s.staminaBarBg}>
            <View style={[s.staminaBarFill, { width: `${Math.max(0, Math.min(100, stamina))}%`, backgroundColor: stamina > 40 ? G.success : stamina > 15 ? G.warning : G.error }]} />
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.story}>{round.story}</Text>
        </View>

        <View style={s.choices}>
          <TouchableOpacity style={s.choiceBtn} onPress={() => handleChoice('wise')} disabled={!!feedback}>
            <Text style={s.choiceText}>{round.wise.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.choiceBtn} onPress={() => handleChoice('risky')} disabled={!!feedback}>
            <Text style={s.choiceText}>{round.risky.label}</Text>
          </TouchableOpacity>
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.warning }]}>
            <Text style={[s.feedbackText, { color: feedback.isCorrect ? G.success : G.warning }]}>{feedback.msg}</Text>
            {!feedback.survived && <Text style={s.lessonText}>💡 {journey.lesson}</Text>}
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:        { padding: 16, paddingBottom: 40 },
  journeyTitle:  { fontSize: 18, fontWeight: '700', color: G.cream, textAlign: 'center' },
  progress:      { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  staminaCard:   { backgroundColor: G.card, borderWidth: 1.5, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 14 },
  staminaLabel:  { fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  staminaAmount: { fontSize: 30, fontWeight: '800', marginBottom: 8 },
  staminaBarBg:  { width: '100%', height: 8, backgroundColor: G.border, borderRadius: 4, overflow: 'hidden' },
  staminaBarFill:{ height: 8, borderRadius: 4 },
  card:          { backgroundColor: G.card, borderRadius: 14, padding: 18, borderWidth: 0.5, borderColor: G.border, marginBottom: 16, alignItems: 'center' },
  story:         { fontSize: 16, color: G.cream, textAlign: 'center', lineHeight: 22 },
  choices:       { gap: 10, marginBottom: 16 },
  choiceBtn:     { backgroundColor: G.card, borderWidth: 1, borderColor: G.border, borderRadius: 12, padding: 16 },
  choiceText:    { fontSize: 14, color: G.cream, textAlign: 'center', fontWeight: '600' },
  feedback:      { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14 },
  feedbackText:  { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  lessonText:    { fontSize: 13, color: G.gold, lineHeight: 18, textAlign: 'center' },
});
