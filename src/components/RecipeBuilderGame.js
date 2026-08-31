// src/components/RecipeBuilderGame.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import useGame from '../logic/useGame';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier } from '../logic/difficultyAdapter';
import { RECIPE_BANK } from '../data/gameContent/recipeBuilder';

const SESSION_RECIPES = 4;

const BLURBS = {
  'K-2': 'No-stove recipes — toast, cereal, sandwiches (4 steps).',
  '3-5': 'Stovetop basics — pancakes, pasta, salad (5 steps).',
  '6-8': 'Real cooking with safety tips (6-7 steps).',
  '9-12': 'Real technique — roux, marinating, food safety temps (7-8 steps).',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function pickRecipe(pool, avoidName) {
  const choices = pool.filter(r => r.name !== avoidName);
  const list = choices.length ? choices : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function RecipeBuilderGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel, tier: savedTier } = useGradeLevel('recipe');
  const [started, setStarted] = useState(false);

  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const [recipe, setRecipe] = useState(null);
  const [shuffled, setShuffled] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const game = useGame({ subject: 'home_ec', difficulty: adaptive.tier, skillLevel: level, onGameEnd });

  const beginRun = () => {
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    const first = pickRecipe(RECIPE_BANK[levelForTier(initial.tier)], null);
    setRecipe(first);
    setShuffled(shuffle(first.steps));
    setPlaced([]);
    setCompletedCount(0);
    setFeedback(null);
    setStarted(true);
  };

  const handlePlace = useCallback((step) => {
    if (feedback || !recipe) return;
    const expectedOrder = placed.length + 1;
    const isCorrect = step.order === expectedOrder;
    game.answer(isCorrect);

    const nextAdaptiveState = nextAdaptiveTier(adaptive, isCorrect);
    setAdaptive(nextAdaptiveState);

    if (isCorrect) {
      const newPlaced = [...placed, step];
      setPlaced(newPlaced);
      setShuffled(prev => prev.filter(s => s.order !== step.order));

      if (newPlaced.length === recipe.steps.length) {
        setFeedback({ isCorrect: true, msg: `✓ ${recipe.name} complete!`, tip: recipe.tip, done: true });
        setTimeout(() => {
          setFeedback(null);
          const newCount = completedCount + 1;
          const willEnd = newCount >= SESSION_RECIPES || game.lives <= 0;
          if (willEnd) {
            game.endGame();
          } else {
            const pool = RECIPE_BANK[levelForTier(nextAdaptiveState.tier)];
            const next = pickRecipe(pool, recipe.name);
            setCompletedCount(newCount);
            setRecipe(next);
            setShuffled(shuffle(next.steps));
            setPlaced([]);
          }
        }, 2000);
      } else {
        setFeedback({ isCorrect: true, msg: '✓ Good step!', done: false });
        setTimeout(() => setFeedback(null), 800);
      }
    } else {
      setFeedback({ isCorrect: false, msg: `✗ That's step ${step.order}, not step ${expectedOrder}`, done: false });
      setTimeout(() => setFeedback(null), 1200);
    }
  }, [feedback, placed, recipe, game, adaptive, completedCount]);

  if (!started) {
    return (
      <GradeSelectCard
        title="Recipe Builder" emoji="🍳" subjectLabel="Home Economics"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Master Chef!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (!recipe) return null;

  return (
    <GameShell
      title="Recipe Builder" emoji="🍳" subject={`Home Economics · ${levelForTier(adaptive.tier)}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={completedCount / SESSION_RECIPES}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.recipeName}>{recipe.name}</Text>
        <Text style={s.instruction}>Tap the steps in the correct order · Recipe {completedCount + 1} of {SESSION_RECIPES}</Text>

        {placed.length > 0 && (
          <View style={s.placedSection}>
            <Text style={s.sectionLabel}>Steps so far</Text>
            {placed.map((step, i) => (
              <View key={step.order} style={s.placedStep}>
                <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
                <Text style={s.placedText}>{step.text}</Text>
                <Text style={{ color: G.success, fontSize: 16 }}>✓</Text>
              </View>
            ))}
          </View>
        )}

        {placed.length < recipe.steps.length && (
          <View style={s.nextStep}>
            <Text style={s.nextStepLabel}>Step {placed.length + 1} of {recipe.steps.length}</Text>
            <Text style={s.nextStepHint}>Which step comes next?</Text>
          </View>
        )}

        <View style={s.available}>
          {shuffled.map(step => (
            <TouchableOpacity
              key={step.order}
              style={[s.stepCard, feedback && feedback.isCorrect === false && s.stepCardShake]}
              onPress={() => handlePlace(step)}
              disabled={!!feedback}
            >
              <Text style={s.stepText}>{step.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.msg}
            </Text>
            {feedback.tip && <Text style={s.tipText}>💡 {feedback.tip}</Text>}
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:         { padding: 16, paddingBottom: 40 },
  recipeName:     { fontSize: 20, fontWeight: '700', color: G.cream, textAlign: 'center', marginBottom: 4 },
  instruction:    { fontSize: 13, color: G.muted, textAlign: 'center', marginBottom: 16 },
  sectionLabel:   { fontSize: 10, color: G.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  placedSection:  { backgroundColor: G.card, borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 0.5, borderColor: G.border },
  placedStep:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: G.border },
  stepNum:        { width: 22, height: 22, borderRadius: 11, backgroundColor: G.success, alignItems: 'center', justifyContent: 'center' },
  stepNumText:    { fontSize: 11, fontWeight: '700', color: G.bg },
  placedText:     { flex: 1, fontSize: 12, color: G.muted },
  nextStep:       { backgroundColor: G.tealL, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 0.5, borderColor: G.teal, alignItems: 'center' },
  nextStepLabel:  { fontSize: 12, color: G.teal, fontWeight: '700', marginBottom: 2 },
  nextStepHint:   { fontSize: 13, color: G.cream },
  available:      { gap: 8, marginBottom: 14 },
  stepCard:       { backgroundColor: G.card, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: G.border },
  stepCardShake:  { borderColor: G.error },
  stepText:       { fontSize: 14, color: G.cream, lineHeight: 20 },
  feedback:       { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 14 },
  feedbackTitle:  { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tipText:        { fontSize: 13, color: G.gold, lineHeight: 18 },
});
