import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Modal } from 'react-native';
import * as Animatable from 'react-native-animatable';

// Expanded scenarios with difficulty levels
const scenarios = [
  {
    difficulty: 'Easy',
    budget: 100,
    expenses: [
      { item: '🍎 Food', cost: 50, essential: true },
      { item: '🧸 Toy', cost: 30, essential: false },
      { item: '👕 Clothes', cost: 40, essential: true },
      { item: '🎬 Movie Ticket', cost: 20, essential: false },
    ],
    correctCuts: ['🧸 Toy', '🎬 Movie Ticket'],
    explanation: 'Great job! Food and clothes are NEEDS. Toys and movies are WANTS!',
    lesson: '💡 Needs keep us safe. Wants are nice but come second!',
  },
  {
    difficulty: 'Easy',
    budget: 80,
    expenses: [
      { item: '📚 School Supplies', cost: 30, essential: true },
      { item: '🍬 Candy', cost: 10, essential: false },
      { item: '🏠 Rent', cost: 50, essential: true },
      { item: '🎮 Video Game', cost: 40, essential: false },
    ],
    correctCuts: ['🍬 Candy', '🎮 Video Game'],
    explanation: 'Excellent! School and rent are needs!',
    lesson: '💡 Housing and education help us grow!',
  },
  {
    difficulty: 'Medium',
    budget: 120,
    expenses: [
      { item: '💧 Water Bill', cost: 40, essential: true },
      { item: '🍦 Ice Cream', cost: 15, essential: false },
      { item: '🚌 Bus Pass', cost: 30, essential: true },
      { item: '🎧 Headphones', cost: 60, essential: false },
    ],
    correctCuts: ['🍦 Ice Cream', '🎧 Headphones'],
    explanation: 'Perfect! Water and transport are needs!',
    lesson: '💡 Ask: Do I need this or want it?',
  },
  {
    difficulty: 'Medium',
    budget: 150,
    expenses: [
      { item: '⚡ Electricity', cost: 60, essential: true },
      { item: '🍕 Restaurant', cost: 40, essential: false },
      { item: '💊 Medicine', cost: 50, essential: true },
      { item: '👟 Designer Shoes', cost: 80, essential: false },
    ],
    correctCuts: ['🍕 Restaurant', '👟 Designer Shoes'],
    explanation: 'Awesome! Power and medicine are needs!',
    lesson: '💡 Choose what works, not what\'s fancy!',
  },
  {
    difficulty: 'Hard',
    budget: 200,
    expenses: [
      { item: '🏥 Doctor', cost: 80, essential: true },
      { item: '📱 New Phone', cost: 120, essential: false },
      { item: '🍎 Groceries', cost: 70, essential: true },
      { item: '🎨 Art Supplies', cost: 35, essential: false },
      { item: '☕ Coffee Shop', cost: 25, essential: false },
    ],
    correctCuts: ['📱 New Phone', '🎨 Art Supplies', '☕ Coffee Shop'],
    explanation: 'Outstanding! Health and food are needs!',
    lesson: '💡 Big buys wait until old one breaks!',
  },
  {
    difficulty: 'Hard',
    budget: 180,
    expenses: [
      { item: '🚗 Insurance', cost: 90, essential: true },
      { item: '🎪 Concert', cost: 60, essential: false },
      { item: '🥗 Food', cost: 65, essential: true },
      { item: '🧴 Fancy Shampoo', cost: 30, essential: false },
      { item: '🎁 Gift', cost: 45, essential: false },
    ],
    correctCuts: ['🎪 Concert', '🧴 Fancy Shampoo', '🎁 Gift'],
    explanation: 'Brilliant! Insurance and food are needs!',
    lesson: '💡 Best gifts come from the heart!',
  },
  {
    difficulty: 'Expert',
    budget: 160,
    expenses: [
      { item: '📖 Textbooks', cost: 75, essential: true },
      { item: '🎯 Hobby Class', cost: 50, essential: false },
      { item: '🏃 Gym', cost: 40, essential: false },
      { item: '🍽️ Kitchen Tools', cost: 45, essential: true },
      { item: '🎬 Streaming', cost: 15, essential: false },
    ],
    correctCuts: ['🎯 Hobby Class', '🏃 Gym', '🎬 Streaming'],
    explanation: 'Expert! Books and tools are needs!',
    lesson: '💡 Find free alternatives for wants!',
  },
  {
    difficulty: 'Expert',
    budget: 220,
    expenses: [
      { item: '🦷 Dentist', cost: 100, essential: true },
      { item: '🎮 Gaming Console', cost: 150, essential: false },
      { item: '🧺 Laundry', cost: 30, essential: true },
      { item: '🍔 Fast Food', cost: 35, essential: false },
      { item: '📱 Phone Plan', cost: 60, essential: true },
      { item: '🎭 Theme Park', cost: 85, essential: false },
    ],
    correctCuts: ['🎮 Gaming Console', '🍔 Fast Food', '🎭 Theme Park'],
    explanation: 'Master! Health and hygiene are needs!',
    lesson: '💡 Theme park = groceries for a week!',
  },
];

const funFacts = [
  '🏦 $1/day = $365/year!',
  '🐷 First piggy banks: 1600s!',
  '💰 Save early = success!',
  '📊 50% needs, 30% wants, 20% save!',
  '🎯 Budget = reach goals!',
  '🛍️ Wait 24hrs before buying!',
];

const BudgetBalanceGame = ({ onGameEnd }) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [selectedCuts, setSelectedCuts] = useState([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    setStartTime(Date.now());
    setSelectedCuts([]);
    setShowHint(false);
  }, [currentScenarioIndex]);

  useEffect(() => {
    if (streak > maxStreak) setMaxStreak(streak);
  }, [streak]);

  const toggleCut = (item) => {
    if (selectedCuts.includes(item)) {
      setSelectedCuts(selectedCuts.filter((cut) => cut !== item));
    } else {
      setSelectedCuts([...selectedCuts, item]);
    }
  };

  const useHint = () => {
    setShowHint(true);
    setHintsUsed(hintsUsed + 1);
  };

  const checkAnswer = () => {
    const responseTime = (Date.now() - startTime) / 1000;
    const currentScenario = scenarios[currentScenarioIndex];
    
    const totalCost = currentScenario.expenses
      .filter((expense) => !selectedCuts.includes(expense.item))
      .reduce((sum, expense) => sum + expense.cost, 0);
    
    const withinBudget = totalCost <= currentScenario.budget;
    const allCutsValid = selectedCuts.every((cut) => {
      const expense = currentScenario.expenses.find(e => e.item === cut);
      return expense && !expense.essential;
    });
    const keptEssentials = currentScenario.expenses.filter(e => e.essential && !selectedCuts.includes(e.item));
    const allEssentialsKept = keptEssentials.length === currentScenario.expenses.filter(e => e.essential).length;

    let basePoints = 10;
    let streakBonus = streak * 5;
    let timeBonus = responseTime < 10 ? 5 : responseTime < 20 ? 3 : 0;
    let difficultyMultiplier = currentScenario.difficulty === 'Expert' ? 2 : 
                              currentScenario.difficulty === 'Hard' ? 1.5 : 1;
    
    const isCorrect = withinBudget && allCutsValid && allEssentialsKept;

    if (isCorrect) {
      const earnedPoints = Math.round((basePoints + streakBonus + timeBonus) * difficultyMultiplier);
      setScore(score + earnedPoints);
      setStreak(streak + 1);
      setCorrectAnswers(correctAnswers + 1);
      
      const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
      
      setResultData({
        isCorrect: true,
        message: currentScenario.explanation,
        lesson: currentScenario.lesson,
        funFact: randomFact,
        points: earnedPoints,
        timeBonus: timeBonus,
      });
      setShowResultModal(true);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      
      let errorMessage = '';
      if (!withinBudget) {
        errorMessage = `💸 Over budget by $${totalCost - currentScenario.budget}!`;
      } else if (!allCutsValid) {
        errorMessage = `⚠️ You cut essential items!`;
      } else {
        errorMessage = `🤔 Cut more wants!`;
      }
      
      setResultData({
        isCorrect: false,
        message: errorMessage,
        lesson: currentScenario.lesson,
        explanation: currentScenario.explanation,
        livesLeft: newLives,
      });
      setShowResultModal(true);
    }
  };

  const handleNextAction = () => {
    setShowResultModal(false);
    if (resultData.isCorrect || (resultData.livesLeft > 0)) {
      if (currentScenarioIndex + 1 < scenarios.length) {
        setCurrentScenarioIndex(currentScenarioIndex + 1);
      } else {
        endGame();
      }
    } else {
      endGame();
    }
  };

  const endGame = () => {
    const accuracy = scenarios.length > 0 ? (correctAnswers / scenarios.length) * 100 : 0;
    const rank = accuracy >= 90 ? '🏆 Budget Master!' : 
                accuracy >= 70 ? '⭐ Money Manager!' : 
                accuracy >= 50 ? '📊 Learning Saver' : '🌱 Beginning Budgeter';
    
    const gameData = {
      score,
      accuracy: accuracy.toFixed(1),
      topic: 'Financial Literacy - Budgeting',
      scenariosCompleted: currentScenarioIndex + 1,
      correctAnswers,
      maxStreak,
      hintsUsed,
      rank,
    };
    
    Alert.alert(
      '🎉 Complete!',
      `${rank}\n\n📊 Score: ${score}\n✅ ${correctAnswers}/${scenarios.length}\n🎯 ${gameData.accuracy}%\n🔥 Streak: ${maxStreak}`,
      [{ text: '🎊 Finish', onPress: () => onGameEnd(gameData) }]
    );
  };

  const currentScenario = scenarios[currentScenarioIndex];
  const totalSelectedCost = currentScenario.expenses
    .filter((expense) => !selectedCuts.includes(expense.item))
    .reduce((sum, expense) => sum + expense.cost, 0);
  const remaining = currentScenario.budget - totalSelectedCost;

  const ResultModal = () => (
    <Modal visible={showResultModal} animationType="fade" transparent={true}>
      <View style={styles.resultOverlay}>
        <Animatable.View 
          animation={resultData?.isCorrect ? "bounceIn" : "shake"}
          style={[styles.resultCard, resultData?.isCorrect ? styles.correctCard : styles.wrongCard]}
        >
          <Text style={styles.resultTitle}>
            {resultData?.isCorrect ? '✅ Correct!' : '❌ Not Quite!'}
          </Text>
          
          <Text style={styles.resultMessage}>{resultData?.message}</Text>
          
          {resultData?.isCorrect && (
            <>
              <View style={styles.pointsBox}>
                <Text style={styles.pointsText}>
                  +{resultData.points} points!
                  {resultData.timeBonus > 0 && ` ⚡+${resultData.timeBonus}`}
                </Text>
              </View>
              <View style={styles.funFactBox}>
                <Text style={styles.funFactText}>{resultData.funFact}</Text>
              </View>
            </>
          )}
          
          <View style={styles.lessonBox}>
            <Text style={styles.lessonText}>{resultData?.lesson || resultData?.explanation}</Text>
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNextAction}>
            <Text style={styles.nextButtonText}>
              {resultData?.livesLeft === 0 ? '📊 Results' : 
               currentScenarioIndex + 1 < scenarios.length ? '➡️ Next' : '🏁 Finish'}
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </Modal>
  );

  return (
  <View style={styles.container}>
    <ResultModal />

    <Text style={styles.header}>💰 Budget Balance</Text>

    <View style={styles.topSection}>
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>
          Lv {currentScenarioIndex + 1}/{scenarios.length} • {currentScenario.difficulty}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentScenarioIndex + 1) / scenarios.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{score}</Text>
          <Text style={styles.statLabel}>Score</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🔥{streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{Array(lives).fill('❤️').join('')}</Text>
          <Text style={styles.statLabel}>Lives</Text>
        </View>
      </View>
    </View>

    <View style={styles.budgetCard}>
      <View style={styles.budgetRow}>
        <Text style={styles.budgetLabel}>💵 Budget:</Text>
        <Text style={styles.budgetAmount}>${currentScenario.budget}</Text>
      </View>
      <View style={styles.budgetRow}>
        <Text style={styles.spendingLabel}>💳 Spending:</Text>
        <Text style={styles.spendingAmount}>${totalSelectedCost}</Text>
      </View>
      <View style={styles.budgetRow}>
        <Text
          style={[
            styles.remainingLabel,
            remaining >= 0 ? styles.positive : styles.negative,
          ]}
        >
          {remaining >= 0 ? '✅' : '⚠️'} Left:
        </Text>
        <Text
          style={[
            styles.remainingAmount,
            remaining >= 0 ? styles.positive : styles.negative,
          ]}
        >
          ${remaining}
        </Text>
      </View>
    </View>

    <Text style={styles.instruction}>Tap to ✂️ CUT:</Text>

    <FlatList
      data={currentScenario.expenses}
      keyExtractor={(item, index) => `${currentScenarioIndex}-${index}`}
      contentContainerStyle={styles.expenseListContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: expense }) => (
        <TouchableOpacity
          style={[
            styles.expenseButton,
            selectedCuts.includes(expense.item) && styles.cutButton,
          ]}
          onPress={() => toggleCut(expense.item)}
        >
          <Text
            style={[
              styles.expenseText,
              selectedCuts.includes(expense.item) && styles.cutText,
            ]}
          >
            {selectedCuts.includes(expense.item) ? '✂️ ' : ''}
            {expense.item}
          </Text>
          <View style={styles.expenseRight}>
            {showHint && <Text style={styles.hintBadge}>{expense.essential ? '🔒' : '💭'}</Text>}
            <Text
              style={[
                styles.costText,
                selectedCuts.includes(expense.item) && styles.cutText,
              ]}
            >
              ${expense.cost}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />

    <View style={styles.bottomButtons}>
      <TouchableOpacity
        style={[styles.hintButton, showHint && styles.hintButtonActive]}
        onPress={useHint}
        disabled={showHint}
      >
        <Text style={styles.hintButtonText}>{showHint ? '💡 On' : '💡 Hint'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.checkButton, remaining < 0 && styles.overBudgetButton]}
        onPress={checkAnswer}
      >
        <Text style={styles.checkButtonText}>
          {remaining >= 0 ? '✅ Check Answer' : '⚠️ Over Budget'}
        </Text>
      </TouchableOpacity>
    </View>

    <Text style={styles.footerFact}>
      {funFacts[currentScenarioIndex % funFacts.length]}
    </Text>
  </View>
);

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginVertical: 4,
  },
  topSection: {
    marginHorizontal: 8,
  },
  progressSection: {
    marginBottom: 4,
  },
  progressText: {
    fontSize: 10,
    color: '#558B2F',
    textAlign: 'center',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#C8E6C9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  statBox: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    elevation: 1,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 9,
    color: '#555',
  },
  budgetCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 6,
    marginHorizontal: 8,
    marginTop: 6,
    elevation: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  budgetLabel: { fontSize: 11, fontWeight: '600', color: '#1976D2' },
  budgetAmount: { fontSize: 12, fontWeight: 'bold', color: '#1976D2' },
  spendingLabel: { fontSize: 11, fontWeight: '600', color: '#F57C00' },
  spendingAmount: { fontSize: 12, fontWeight: 'bold', color: '#F57C00' },
  remainingLabel: { fontSize: 11, fontWeight: '600' },
  remainingAmount: { fontSize: 12, fontWeight: 'bold' },
  positive: { color: '#2E7D32' },
  negative: { color: '#C62828' },
  instruction: {
    textAlign: 'center',
    color: '#424242',
    fontWeight: '600',
    fontSize: 11,
    marginTop: 6,
  },
  expenseListContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  expenseButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#66BB6A',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  cutButton: { backgroundColor: '#BDBDBD', opacity: 0.8 },
  expenseText: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  cutText: { textDecorationLine: 'line-through' },
  expenseRight: { flexDirection: 'row', alignItems: 'center' },
  costText: { fontSize: 12, color: '#FFF', fontWeight: 'bold' },
  hintBadge: { fontSize: 12, marginRight: 4 },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
    marginBottom: 2,
  },
  hintButton: {
    backgroundColor: '#FFA726',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  hintButtonActive: { backgroundColor: '#FFB74D' },
  hintButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  checkButton: {
    backgroundColor: '#43A047',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  overBudgetButton: { backgroundColor: '#E53935' },
  checkButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  footerFact: {
    textAlign: 'center',
    color: '#388E3C',
    fontSize: 10,
    marginBottom: 4,
  },
});


export default BudgetBalanceGame;