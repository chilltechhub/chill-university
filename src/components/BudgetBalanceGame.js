// src/components/BudgetBalanceGame.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { G } from './GameShell';
import GameOver from './GameOver';
import useGame from '../logic/useGame';

const SCENARIOS = [
  {
    title: 'School Supplies Budget',
    budget: 30, difficulty: 1,
    story: 'You have $30 for school. Pick which items to cut to stay in budget.',
    expenses: [
      { item:'📓 Notebooks',    cost:8,  essential:true },
      { item:'✏️ Pencils',      cost:3,  essential:true },
      { item:'🎒 Backpack',     cost:20, essential:true },
      { item:'🧸 Toy',          cost:12, essential:false },
      { item:'🎬 Movie Ticket', cost:10, essential:false },
    ],
    lesson: 'Always buy what you need first, then wants with leftover money.',
  },
  {
    title: 'Lunch Money',
    budget: 15, difficulty: 1,
    story: 'You have $15 for lunch this week. What can you cut?',
    expenses: [
      { item:'🍱 Lunch Box',    cost:8,  essential:true },
      { item:'💧 Water Bottle', cost:2,  essential:true },
      { item:'🍬 Candy',        cost:4,  essential:false },
      { item:'🎮 Video Game',   cost:6,  essential:false },
    ],
    lesson: 'Needs first, wants second — always.',
  },
  {
    title: 'Weekend Fun Budget',
    budget: 20, difficulty: 2,
    story: 'You have $20 for the weekend. What do you cut to stay in budget?',
    expenses: [
      { item:'🚌 Bus Fare',     cost:4,  essential:true },
      { item:'🥪 Lunch',        cost:7,  essential:true },
      { item:'🍦 Ice Cream',    cost:5,  essential:false },
      { item:'🎧 Headphones',   cost:15, essential:false },
    ],
    lesson: 'Transport and food are needs — entertainment is a want.',
  },
  {
    title: 'Grocery Run',
    budget: 25, difficulty: 2,
    story: 'You have $25 for groceries. What gets cut?',
    expenses: [
      { item:'🥚 Eggs',         cost:4,  essential:true },
      { item:'🍞 Bread',        cost:3,  essential:true },
      { item:'🥛 Milk',         cost:4,  essential:true },
      { item:'🍕 Restaurant',   cost:14, essential:false },
      { item:'👟 Designer Shoes',cost:60,essential:false },
    ],
    lesson: 'Basic food is essential. Dining out and luxury items are wants.',
  },
  {
    title: 'Birthday Budget',
    budget: 40, difficulty: 3,
    story: 'You have $40 for your birthday party. What stays?',
    expenses: [
      { item:'🎂 Cake',         cost:20, essential:true },
      { item:'🎈 Decorations',  cost:10, essential:true },
      { item:'📱 New Phone',    cost:300,essential:false },
      { item:'🎨 Art Supplies', cost:15, essential:false },
      { item:'☕ Coffee Shop',  cost:25, essential:false },
    ],
    lesson: 'A $300 phone isn\'t a party necessity — stay focused on what the event needs.',
  },
];

export default function BudgetBalanceGame({ onGameEnd }) {
  const navigation = useNavigation();
  const [idx, setIdx]         = useState(0);
  const [cuts, setCuts]       = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'general', difficulty: 2, onGameEnd });
  const sc = SCENARIOS[idx];

  const toggleCut = (item) => {
    if (feedback) return;
    setCuts(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]);
  };

  const totalAfterCuts = sc.expenses
    .filter(e => !cuts.includes(e.item))
    .reduce((sum, e) => sum + e.cost, 0);

  const checkAnswer = useCallback(() => {
    if (feedback) return;
    const withinBudget = totalAfterCuts <= sc.budget;
    const cutEssential = cuts.some(c => {
      const exp = sc.expenses.find(e => e.item === c);
      return exp?.essential;
    });
    const isCorrect = withinBudget && !cutEssential;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 15 ? 5 : 0 });

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
      if (game.lives - (isCorrect ? 0 : 1) <= 0 || idx >= SCENARIOS.length - 1) {
        game.endGame();
      } else {
        setIdx(i => i + 1);
      }
    }, 2200);
  }, [cuts, sc, totalAfterCuts, feedback, game, idx, startTime]);

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Budget Master!"
      onPlayAgain={() => { game.reset(); setIdx(0); setCuts([]); setFeedback(null); }}
      onQuit={() => navigation.goBack()}
    />
  );

  return (
    <GameShell
      title="Budget Balance" emoji="💰" subject="Financial Literacy"
      score={game.score} lives={game.lives} streak={game.streak}
      progress={idx / SCENARIOS.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Scenario {idx + 1} of {SCENARIOS.length}</Text>

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

        {/* Running total */}
        <View style={[s.totalRow, { borderColor: totalAfterCuts <= sc.budget ? G.success : G.error }]}>
          <Text style={s.totalLabel}>Total after cuts</Text>
          <Text style={[s.totalAmount, { color: totalAfterCuts <= sc.budget ? G.success : G.error }]}>
            ${totalAfterCuts} / ${sc.budget}
          </Text>
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

const s = StyleSheet.create({
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
  checkBtn:       { backgroundColor: G.gold, borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 12 },
  checkBtnText:   { fontSize: 15, fontWeight: '700', color: G.bg },
  feedback:       { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:  { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  feedbackLesson: { fontSize: 13, color: G.cream, lineHeight: 18 },
});
