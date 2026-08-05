// src/components/RecipeBuilderGame.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { G } from './GameShell';
import GameOver from './GameOver';
import useGame from '../logic/useGame';

const RECIPES = [
  {
    name: '🥞 Pancakes',
    steps: [
      { order:1, text:'Mix flour, eggs, and milk in a bowl' },
      { order:2, text:'Heat pan on medium and add butter' },
      { order:3, text:'Pour batter and wait for bubbles' },
      { order:4, text:'Flip and cook other side' },
      { order:5, text:'Serve with syrup and fruit' },
    ],
    tip: 'Wait until bubbles form before flipping!',
  },
  {
    name: '🥗 Salad',
    steps: [
      { order:1, text:'Wash all vegetables thoroughly' },
      { order:2, text:'Chop lettuce, tomatoes, and cucumber' },
      { order:3, text:'Add toppings like croutons and cheese' },
      { order:4, text:'Drizzle dressing over the salad' },
      { order:5, text:'Toss gently and serve' },
    ],
    tip: 'Always wash vegetables before eating!',
  },
  {
    name: '🍝 Pasta',
    steps: [
      { order:1, text:'Boil salted water in a large pot' },
      { order:2, text:'Add pasta and cook for 8-10 minutes' },
      { order:3, text:'Drain pasta in a colander' },
      { order:4, text:'Heat sauce in a separate pan' },
      { order:5, text:'Mix pasta and sauce, serve hot' },
    ],
    tip: 'Salting the water adds flavor to the pasta!',
  },
  {
    name: '🥪 Sandwich',
    steps: [
      { order:1, text:'Lay out two slices of bread' },
      { order:2, text:'Spread butter or mayo on one slice' },
      { order:3, text:'Add your fillings — meat, cheese, veggies' },
      { order:4, text:'Season with salt and pepper' },
      { order:5, text:'Close sandwich and cut diagonally' },
    ],
    tip: 'Cutting diagonally makes sandwiches easier to hold!',
  },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function RecipeBuilderGame({ onGameEnd }) {
  const navigation = useNavigation();
  const [recipeIdx, setRecipeIdx] = useState(0);
  const [shuffled, setShuffled] = useState(() => shuffle(RECIPES[0].steps));
  const [placed, setPlaced]    = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'general', difficulty: 1, onGameEnd });
  const recipe = RECIPES[recipeIdx];

  const handlePlace = useCallback((step) => {
    if (feedback) return;
    const expectedOrder = placed.length + 1;
    const isCorrect = step.order === expectedOrder;
    game.answer(isCorrect);

    if (isCorrect) {
      const newPlaced = [...placed, step];
      setPlaced(newPlaced);
      setShuffled(prev => prev.filter(s => s.order !== step.order));

      if (newPlaced.length === recipe.steps.length) {
        // Recipe complete!
        setFeedback({ isCorrect: true, msg: `✓ ${recipe.name} complete!`, tip: recipe.tip, done: true });
        setTimeout(() => {
          setFeedback(null);
          const nextIdx = recipeIdx + 1;
          if (nextIdx >= RECIPES.length || game.lives <= 0) {
            game.endGame();
          } else {
            setRecipeIdx(nextIdx);
            setShuffled(shuffle(RECIPES[nextIdx].steps));
            setPlaced([]);
          }
        }, 2000);
      } else {
        setFeedback({ isCorrect: true, msg: '✓ Good step!', done: false });
        setTimeout(() => setFeedback(null), 800);
      }
    } else {
      setFeedback({ isCorrect: false, msg: `✗ That\'s step ${step.order}, not step ${expectedOrder}`, done: false });
      setTimeout(() => setFeedback(null), 1200);
    }
  }, [feedback, placed, recipe, game, recipeIdx]);

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Master Chef!"
      onPlayAgain={() => { game.reset(); setRecipeIdx(0); setShuffled(shuffle(RECIPES[0].steps)); setPlaced([]); setFeedback(null); }}
      onQuit={() => navigation.goBack()}
    />
  );

  return (
    <GameShell
      title="Recipe Builder" emoji="🍳" subject="Home Economics"
      score={game.score} lives={game.lives} streak={game.streak}
      progress={recipeIdx / RECIPES.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.recipeName}>{recipe.name}</Text>
        <Text style={s.instruction}>Tap the steps in the correct order</Text>

        {/* Placed steps */}
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

        {/* Next step indicator */}
        {placed.length < recipe.steps.length && (
          <View style={s.nextStep}>
            <Text style={s.nextStepLabel}>Step {placed.length + 1} of {recipe.steps.length}</Text>
            <Text style={s.nextStepHint}>Which step comes next?</Text>
          </View>
        )}

        {/* Available steps */}
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

        {/* Feedback */}
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

const s = StyleSheet.create({
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
