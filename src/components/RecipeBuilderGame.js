import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const RECIPES = [
  {
    id: 'peanut-butter-jelly',
    title: 'Peanut Butter & Jelly Sandwich',
    emoji: '🥪',
    steps: [
      {
        id: 'step1',
        stepNumber: 1,
        instruction: 'Get two slices of _____',
        missingWord: 'bread',
        options: ['bread', 'cheese', 'butter', 'meat']
      },
      {
        id: 'step2',
        stepNumber: 2,
        instruction: 'Spread _____ on one slice',
        missingWord: 'peanut butter',
        options: ['peanut butter', 'jelly', 'honey', 'mayo']
      },
      {
        id: 'step3',
        stepNumber: 3,
        instruction: 'Spread _____ on the other slice',
        missingWord: 'jelly',
        options: ['jelly', 'peanut butter', 'butter', 'jam']
      },
      {
        id: 'step4',
        stepNumber: 4,
        instruction: 'Put the slices _____ to finish',
        missingWord: 'together',
        options: ['together', 'apart', 'in oven', 'in fridge']
      }
    ]
  },
  {
    id: 'fruit-salad',
    title: 'Simple Fruit Salad',
    emoji: '🥗',
    steps: [
      {
        id: 'step1',
        stepNumber: 1,
        instruction: 'Get a clean _____',
        missingWord: 'bowl',
        options: ['bowl', 'plate', 'cup', 'pan']
      },
      {
        id: 'step2',
        stepNumber: 2,
        instruction: 'Wash all the fruits with _____',
        missingWord: 'water',
        options: ['water', 'soap', 'juice', 'milk']
      },
      {
        id: 'step3',
        stepNumber: 3,
        instruction: 'Cut the _____ into small pieces',
        missingWord: 'fruits',
        options: ['fruits', 'vegetables', 'meat', 'bread']
      },
      {
        id: 'step4',
        stepNumber: 4,
        instruction: 'Mix everything with a _____',
        missingWord: 'spoon',
        options: ['spoon', 'fork', 'knife', 'whisk']
      }
    ]
  },
  {
    id: 'hot-chocolate',
    title: 'Hot Chocolate',
    emoji: '☕',
    steps: [
      {
        id: 'step1',
        stepNumber: 1,
        instruction: 'Pour _____ into a mug',
        missingWord: 'milk',
        options: ['milk', 'water', 'juice', 'soda']
      },
      {
        id: 'step2',
        stepNumber: 2,
        instruction: 'Heat it in the _____',
        missingWord: 'microwave',
        options: ['microwave', 'freezer', 'sink', 'oven']
      },
      {
        id: 'step3',
        stepNumber: 3,
        instruction: 'Add _____ powder and stir',
        missingWord: 'chocolate',
        options: ['chocolate', 'coffee', 'sugar', 'flour']
      },
      {
        id: 'step4',
        stepNumber: 4,
        instruction: 'Top with _____ for extra yum!',
        missingWord: 'marshmallows',
        options: ['marshmallows', 'cheese', 'salt', 'pepper']
      }
    ]
  }
];

const RecipeBuilderGame = ({ 
  recipeId = 'peanut-butter-jelly',
  onGameEnd = () => {},
  onNextRecipe = () => {},
  userId = null,
  supabaseClient = null 
}) => {
  const [gameState, setGameState] = useState('ordering');
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(
    RECIPES.findIndex(r => r.id === recipeId) >= 0 
      ? RECIPES.findIndex(r => r.id === recipeId) 
      : 0
  );
  const [recipe, setRecipe] = useState(RECIPES[currentRecipeIndex]);
  const [shuffledSteps, setShuffledSteps] = useState([]);
  const [orderedSteps, setOrderedSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [fillInBlanks, setFillInBlanks] = useState({});
  const [currentFillIndex, setCurrentFillIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [answeredItems, setAnsweredItems] = useState([]);
  const [startTime] = useState(Date.now());
  const [itemStartTime, setItemStartTime] = useState(Date.now());
  const [responseTimes, setResponseTimes] = useState([]);

  useEffect(() => {
    const shuffled = [...recipe.steps].sort(() => Math.random() - 0.5);
    setShuffledSteps(shuffled);
    setOrderedSteps([]);
    
    const blanks = {};
    recipe.steps.forEach(step => {
      blanks[step.id] = null;
    });
    setFillInBlanks(blanks);
  }, [recipe]);

  const handleStepSelect = (step) => {
    if (orderedSteps.find(s => s.id === step.id)) return;
    
    const responseTime = Date.now() - itemStartTime;
    const correctPosition = step.stepNumber - 1;
    const isCorrect = orderedSteps.length === correctPosition;

    if (isCorrect) {
      setOrderedSteps([...orderedSteps, step]);
      setShuffledSteps(shuffledSteps.filter(s => s.id !== step.id));
      
      const streakBonus = streak * 3;
      setScore(score + 10 + streakBonus);
      setStreak(streak + 1);

      setFeedback({
        correct: true,
        message: `Perfect! Step ${step.stepNumber} is correct!`
      });

      setResponseTimes([...responseTimes, responseTime]);
      setAnsweredItems([
        ...answeredItems,
        {
          type: 'ordering',
          stepId: step.id,
          correct: true,
          responseTime
        }
      ]);

      setTimeout(() => {
        setFeedback(null);
        if (orderedSteps.length + 1 === recipe.steps.length) {
          setGameState('filling');
          setItemStartTime(Date.now());
        } else {
          setItemStartTime(Date.now());
        }
      }, 1500);
    } else {
      setLives(lives - 1);
      setStreak(0);

      setFeedback({
        correct: false,
        message: `Not quite! That's step ${step.stepNumber}, but we need step ${orderedSteps.length + 1} next.`
      });

      setResponseTimes([...responseTimes, responseTime]);
      setAnsweredItems([
        ...answeredItems,
        {
          type: 'ordering',
          stepId: step.id,
          correct: false,
          responseTime
        }
      ]);

      setTimeout(() => {
        setFeedback(null);
        if (lives <= 1) {
          endGame();
        } else {
          setItemStartTime(Date.now());
        }
      }, 2000);
    }
  };

  const handleWordSelect = (word) => {
    const currentStep = orderedSteps[currentFillIndex];
    const responseTime = Date.now() - itemStartTime;
    const isCorrect = word === currentStep.missingWord;

    if (isCorrect) {
      setFillInBlanks({
        ...fillInBlanks,
        [currentStep.id]: word
      });

      const streakBonus = streak * 3;
      setScore(score + 10 + streakBonus);
      setStreak(streak + 1);

      setFeedback({
        correct: true,
        message: `Yes! "${word}" is the right ingredient!`
      });

      setResponseTimes([...responseTimes, responseTime]);
      setAnsweredItems([
        ...answeredItems,
        {
          type: 'filling',
          stepId: currentStep.id,
          word: word,
          correct: true,
          responseTime
        }
      ]);

      setTimeout(() => {
        setFeedback(null);
        if (currentFillIndex + 1 < orderedSteps.length) {
          setCurrentFillIndex(currentFillIndex + 1);
          setItemStartTime(Date.now());
        } else {
          endGame();
        }
      }, 1500);
    } else {
      setLives(lives - 1);
      setStreak(0);

      setFeedback({
        correct: false,
        message: `Not quite! Try again.`
      });

      setResponseTimes([...responseTimes, responseTime]);
      setAnsweredItems([
        ...answeredItems,
        {
          type: 'filling',
          stepId: currentStep.id,
          word: word,
          correct: false,
          responseTime
        }
      ]);

      setTimeout(() => {
        setFeedback(null);
        if (lives <= 1) {
          endGame();
        } else {
          setItemStartTime(Date.now());
        }
      }, 2000);
    }
  };

  const endGame = async () => {
    setGameState('finished');
    const totalTime = Date.now() - startTime;
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000)
      : 0;

    const correctAnswers = answeredItems.filter(a => a.correct).length;
    const accuracy = answeredItems.length > 0
      ? Math.round((correctAnswers / answeredItems.length) * 100)
      : 0;

    const gameData = {
      score,
      accuracy,
      recipe: recipe.title,
      questionsAnswered: answeredItems.length,
      correctAnswers,
      totalTime: Math.round(totalTime / 1000),
      averageResponseTime: avgResponseTime,
      maxStreak: Math.max(...[0, ...answeredItems.map((_, i) => {
        let s = 0;
        for (let j = i; j >= 0; j--) {
          if (answeredItems[j].correct) s++;
          else break;
        }
        return s;
      })])
    };

    if (supabaseClient && userId) {
      try {
        await supabaseClient.from('game_sessions').insert({
          user_id: userId,
          game_type: 'recipe_builder',
          topic: recipe.id,
          score: gameData.score,
          accuracy: gameData.accuracy,
          questions_answered: gameData.questionsAnswered,
          correct_answers: gameData.correctAnswers,
          total_time: gameData.totalTime,
          average_response_time: gameData.averageResponseTime,
          max_streak: gameData.maxStreak,
          session_data: { answeredItems },
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving game session:', error);
      }
    }

    onGameEnd(gameData);
  };

  const moveToNextRecipe = () => {
    const nextIndex = currentRecipeIndex + 1;
    
    if (nextIndex < RECIPES.length) {
      setCurrentRecipeIndex(nextIndex);
      const nextRecipe = RECIPES[nextIndex];
      setRecipe(nextRecipe);
      
      const shuffled = [...nextRecipe.steps].sort(() => Math.random() - 0.5);
      setShuffledSteps(shuffled);
      setOrderedSteps([]);
      
      const blanks = {};
      nextRecipe.steps.forEach(step => {
        blanks[step.id] = null;
      });
      setFillInBlanks(blanks);

      setGameState('ordering');
      setCurrentFillIndex(0);
      setScore(0);
      setLives(3);
      setStreak(0);
      setSelectedStep(null);
      setFeedback(null);
      setAnsweredItems([]);
      setResponseTimes([]);
      setItemStartTime(Date.now());
      
      onNextRecipe(nextRecipe);
    } else {
      setCurrentRecipeIndex(0);
      const firstRecipe = RECIPES[0];
      setRecipe(firstRecipe);
      
      const shuffled = [...firstRecipe.steps].sort(() => Math.random() - 0.5);
      setShuffledSteps(shuffled);
      setOrderedSteps([]);
      
      const blanks = {};
      firstRecipe.steps.forEach(step => {
        blanks[step.id] = null;
      });
      setFillInBlanks(blanks);

      setGameState('ordering');
      setCurrentFillIndex(0);
      setScore(0);
      setLives(3);
      setStreak(0);
      setSelectedStep(null);
      setFeedback(null);
      setAnsweredItems([]);
      setResponseTimes([]);
      setItemStartTime(Date.now());
      
      onNextRecipe(firstRecipe);
    }
  };

  if (gameState === 'finished') {
    const correctAnswers = answeredItems.filter(a => a.correct).length;
    const accuracy = answeredItems.length > 0
      ? Math.round((correctAnswers / answeredItems.length) * 100)
      : 0;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.finishedContainer}>
          <View style={styles.finishedCard}>
            <Text style={styles.finishedEmoji}>👨‍🍳</Text>
            <Text style={styles.finishedTitle}>Great Cooking!</Text>
            <Text style={styles.finishedSubtitle}>You completed the recipe!</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Final Score:</Text>
                <Text style={styles.statValueLarge}>{score}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Accuracy:</Text>
                <Text style={styles.statValueGreen}>{accuracy}%</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Questions:</Text>
                <Text style={styles.statValueBlue}>{answeredItems.length}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Correct:</Text>
                <Text style={styles.statValueGreen}>{correctAnswers}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.restartButton} onPress={moveToNextRecipe}>
              <Text style={styles.restartButtonText}>
                {currentRecipeIndex + 1 < RECIPES.length 
                  ? `➡️ Next Recipe` 
                  : '🔄 Start Over'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (gameState === 'filling') {
    const currentStep = orderedSteps[currentFillIndex];

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.titleContainer}>
                <Text style={styles.emoji}>{recipe.emoji}</Text>
                <Text style={styles.title}>{recipe.title}</Text>
              </View>
              <View style={styles.livesContainer}>
                {[...Array(lives)].map((_, i) => (
                  <Text key={i} style={styles.heart}>❤️</Text>
                ))}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>Score: {score}</Text>
              </View>
              {streak > 0 && (
                <View style={styles.streakBox}>
                  <Text style={styles.streakText}>⚡ Streak: {streak}</Text>
                </View>
              )}
              <View style={styles.progressBox}>
                <Text style={styles.progressText}>
                  Fill {currentFillIndex + 1}/{orderedSteps.length}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.phaseBox}>
            <Text style={styles.phaseTitle}>📝 Phase 2: Fill in the Blanks</Text>
            <Text style={styles.phaseSubtitle}>Choose the correct ingredient for each step</Text>
          </View>

          <View style={styles.fillInCard}>
            <Text style={styles.fillInLabel}>Step {currentStep.stepNumber}</Text>
            <Text style={styles.fillInInstruction}>{currentStep.instruction}</Text>
          </View>

          <View style={styles.optionsSection}>
            <Text style={styles.optionsTitle}>Select the Missing Word:</Text>
            <View style={styles.optionsGrid}>
              {currentStep.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionCard}
                  onPress={() => handleWordSelect(option)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {feedback && (
            <View style={[
              styles.feedbackBox,
              feedback.correct ? styles.feedbackCorrect : styles.feedbackWrong
            ]}>
              <Text style={[
                styles.feedbackTitle,
                feedback.correct ? styles.feedbackTitleCorrect : styles.feedbackTitleWrong
              ]}>
                {feedback.correct ? '🎉 Correct!' : '💭 Oops!'}
              </Text>
              <Text style={styles.feedbackMessage}>{feedback.message}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <Text style={styles.emoji}>{recipe.emoji}</Text>
              <Text style={styles.title}>{recipe.title}</Text>
            </View>
            <View style={styles.livesContainer}>
              {[...Array(lives)].map((_, i) => (
                <Text key={i} style={styles.heart}>❤️</Text>
              ))}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreText}>Score: {score}</Text>
            </View>
            {streak > 0 && (
              <View style={styles.streakBox}>
                <Text style={styles.streakText}>⚡ Streak: {streak}</Text>
              </View>
            )}
            <View style={styles.progressBox}>
              <Text style={styles.progressText}>
                Order {orderedSteps.length}/{recipe.steps.length}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.phaseBox}>
          <Text style={styles.phaseTitle}>🔢 Phase 1: Put Steps in Order</Text>
          <Text style={styles.phaseSubtitle}>Tap the steps in the correct sequence</Text>
        </View>

        {orderedSteps.length > 0 && (
          <View style={styles.orderedSection}>
            <Text style={styles.sectionTitle}>✅ Correct Order:</Text>
            {orderedSteps.map((step, index) => (
              <View key={step.id} style={styles.orderedStepCard}>
                <Text style={styles.orderedStepNumber}>{index + 1}</Text>
                <Text style={styles.orderedStepText}>{step.instruction}</Text>
              </View>
            ))}
          </View>
        )}

        {shuffledSteps.length > 0 && (
          <View style={styles.shuffledSection}>
            <Text style={styles.sectionTitle}>Choose Next Step:</Text>
            <View style={styles.shuffledGrid}>
              {shuffledSteps.map((step) => (
                <TouchableOpacity
                  key={step.id}
                  style={styles.shuffledStepCard}
                  onPress={() => handleStepSelect(step)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.shuffledStepText}>{step.instruction}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {feedback && (
          <View style={[
            styles.feedbackBox,
            feedback.correct ? styles.feedbackCorrect : styles.feedbackWrong
          ]}>
            <Text style={[
              styles.feedbackTitle,
              feedback.correct ? styles.feedbackTitleCorrect : styles.feedbackTitleWrong
            ]}>
              {feedback.correct ? '🎉 Perfect!' : '💭 Not Quite!'}
            </Text>
            <Text style={styles.feedbackMessage}>{feedback.message}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F59E0B',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flexShrink: 1,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  heart: {
    fontSize: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreBox: {
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scoreText: {
    color: '#1E40AF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  streakBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  streakText: {
    color: '#92400E',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressBox: {
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  progressText: {
    color: '#4338CA',
    fontWeight: 'bold',
    fontSize: 16,
  },
  phaseBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  phaseTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  phaseSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  orderedSection: {
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  orderedStepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderedStepNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 12,
    width: 30,
  },
  orderedStepText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    fontWeight: '600',
  },
  shuffledSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  shuffledGrid: {
    gap: 12,
  },
  shuffledStepCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FCD34D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shuffledStepText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  fillInCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  fillInLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 12,
  },
  fillInInstruction: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '600',
    lineHeight: 32,
  },
  optionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#93C5FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackBox: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackCorrect: {
    backgroundColor: '#D1FAE5',
    borderWidth: 4,
    borderColor: '#10B981',
  },
  feedbackWrong: {
    backgroundColor: '#FEE2E2',
    borderWidth: 4,
    borderColor: '#EF4444',
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  feedbackTitleCorrect: {
    color: '#047857',
  },
  feedbackTitleWrong: {
    color: '#B91C1C',
  },
  feedbackMessage: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  finishedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  finishedEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  finishedSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statValueLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  statValueGreen: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statValueBlue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  restartButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default RecipeBuilderGame;