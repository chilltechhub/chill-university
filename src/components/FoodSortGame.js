import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';

// Comprehensive food database with nutritional information
const foodDatabase = [
  // Fruits
  { food: 'Apple', emoji: '🍎', category: 'Healthy', group: 'Fruit', calories: 95, benefit: 'Rich in fiber and vitamin C, helps keep your heart healthy!', nutrients: ['Fiber', 'Vitamin C'] },
  { food: 'Banana', emoji: '🍌', category: 'Healthy', group: 'Fruit', calories: 105, benefit: 'High in potassium, gives you energy and helps muscles work!', nutrients: ['Potassium', 'Vitamin B6'] },
  { food: 'Orange', emoji: '🍊', category: 'Healthy', group: 'Fruit', calories: 62, benefit: 'Packed with vitamin C to boost your immune system!', nutrients: ['Vitamin C', 'Folate'] },
  { food: 'Strawberry', emoji: '🍓', category: 'Healthy', group: 'Fruit', calories: 32, benefit: 'Low in calories, high in antioxidants for healthy skin!', nutrients: ['Vitamin C', 'Manganese'] },
  { food: 'Watermelon', emoji: '🍉', category: 'Healthy', group: 'Fruit', calories: 46, benefit: 'Keeps you hydrated and is full of vitamins A and C!', nutrients: ['Vitamin A', 'Vitamin C'] },
  { food: 'Grapes', emoji: '🍇', category: 'Healthy', group: 'Fruit', calories: 69, benefit: 'Contains antioxidants that protect your cells!', nutrients: ['Vitamin K', 'Antioxidants'] },
  
  // Vegetables
  { food: 'Carrot', emoji: '🥕', category: 'Healthy', group: 'Vegetable', calories: 25, benefit: 'Great for your eyes! Full of vitamin A and beta-carotene.', nutrients: ['Vitamin A', 'Beta-carotene'] },
  { food: 'Broccoli', emoji: '🥦', category: 'Healthy', group: 'Vegetable', calories: 31, benefit: 'A superfood with vitamins C, K, and fiber for strong bones!', nutrients: ['Vitamin C', 'Vitamin K', 'Fiber'] },
  { food: 'Tomato', emoji: '🍅', category: 'Healthy', group: 'Vegetable', calories: 18, benefit: 'Rich in lycopene and vitamin C, helps your heart!', nutrients: ['Vitamin C', 'Lycopene'] },
  { food: 'Lettuce', emoji: '🥬', category: 'Healthy', group: 'Vegetable', calories: 5, benefit: 'Very low calorie, full of water and vitamins A and K!', nutrients: ['Vitamin A', 'Vitamin K'] },
  { food: 'Cucumber', emoji: '🥒', category: 'Healthy', group: 'Vegetable', calories: 16, benefit: 'Hydrating and refreshing, great for your skin!', nutrients: ['Vitamin K', 'Water'] },
  { food: 'Bell Pepper', emoji: '🫑', category: 'Healthy', group: 'Vegetable', calories: 31, benefit: 'Has more vitamin C than oranges! Boosts immunity.', nutrients: ['Vitamin C', 'Vitamin A'] },
  
  // Proteins
  { food: 'Chicken Breast', emoji: '🍗', category: 'Healthy', group: 'Protein', calories: 165, benefit: 'Lean protein helps build strong muscles!', nutrients: ['Protein', 'B Vitamins'] },
  { food: 'Fish', emoji: '🐟', category: 'Healthy', group: 'Protein', calories: 206, benefit: 'Rich in omega-3 fatty acids for a healthy brain!', nutrients: ['Protein', 'Omega-3'] },
  { food: 'Eggs', emoji: '🥚', category: 'Healthy', group: 'Protein', calories: 78, benefit: 'Complete protein with all essential amino acids!', nutrients: ['Protein', 'Vitamin D'] },
  { food: 'Nuts', emoji: '🥜', category: 'Healthy', group: 'Protein', calories: 161, benefit: 'Healthy fats and protein, good for your brain!', nutrients: ['Healthy Fats', 'Protein'] },
  
  // Dairy
  { food: 'Milk', emoji: '🥛', category: 'Healthy', group: 'Dairy', calories: 122, benefit: 'Builds strong bones with calcium and vitamin D!', nutrients: ['Calcium', 'Vitamin D'] },
  { food: 'Yogurt', emoji: '🍦', category: 'Healthy', group: 'Dairy', calories: 100, benefit: 'Probiotics for a healthy digestive system!', nutrients: ['Probiotics', 'Calcium'] },
  { food: 'Cheese', emoji: '🧀', category: 'Moderate', group: 'Dairy', calories: 113, benefit: 'Good source of calcium, but eat in moderation!', nutrients: ['Calcium', 'Protein'] },
  
  // Grains
  { food: 'Brown Rice', emoji: '🍚', category: 'Healthy', group: 'Grain', calories: 216, benefit: 'Whole grain with fiber, gives long-lasting energy!', nutrients: ['Fiber', 'B Vitamins'] },
  { food: 'Oatmeal', emoji: '🥣', category: 'Healthy', group: 'Grain', calories: 158, benefit: 'High in fiber, helps lower cholesterol!', nutrients: ['Fiber', 'Iron'] },
  { food: 'Whole Wheat Bread', emoji: '🍞', category: 'Healthy', group: 'Grain', calories: 128, benefit: 'Whole grains provide energy and important nutrients!', nutrients: ['Fiber', 'B Vitamins'] },
  
  // Junk/Unhealthy Foods
  { food: 'Candy', emoji: '🍬', category: 'Junk', group: 'Sweet', calories: 150, benefit: 'High in sugar with no nutrients. Can cause tooth decay and energy crashes.', nutrients: ['Sugar'] },
  { food: 'Soda', emoji: '🥤', category: 'Junk', group: 'Drink', calories: 140, benefit: 'Lots of sugar and no nutritional value. Bad for teeth and weight.', nutrients: ['Sugar', 'Empty Calories'] },
  { food: 'Chips', emoji: '🍟', category: 'Junk', group: 'Snack', calories: 274, benefit: 'High in unhealthy fats and salt. Can lead to weight gain.', nutrients: ['Sodium', 'Trans Fats'] },
  { food: 'Donut', emoji: '🍩', category: 'Junk', group: 'Sweet', calories: 269, benefit: 'High in sugar and unhealthy fats. Very low in nutrients.', nutrients: ['Sugar', 'Trans Fats'] },
  { food: 'Ice Cream', emoji: '🍨', category: 'Moderate', group: 'Sweet', calories: 207, benefit: 'High in sugar and fat. Okay as an occasional treat!', nutrients: ['Calcium', 'Sugar'] },
  { food: 'Pizza', emoji: '🍕', category: 'Moderate', group: 'Mixed', calories: 285, benefit: 'Can be okay with veggies, but often high in calories and fat.', nutrients: ['Carbs', 'Fat', 'Protein'] },
  { food: 'Burger', emoji: '🍔', category: 'Moderate', group: 'Mixed', calories: 354, benefit: 'Has protein but often high in fat and calories. Choose wisely!', nutrients: ['Protein', 'Fat'] },
  { food: 'Cookies', emoji: '🍪', category: 'Junk', group: 'Sweet', calories: 142, benefit: 'High in sugar and fat. Save for special occasions!', nutrients: ['Sugar', 'Fat'] },
  { food: 'Cotton Candy', emoji: '🍭', category: 'Junk', group: 'Sweet', calories: 171, benefit: 'Almost pure sugar with zero nutritional value.', nutrients: ['Sugar'] },
  { food: 'Hot Dog', emoji: '🌭', category: 'Moderate', group: 'Processed', calories: 314, benefit: 'Processed meat high in sodium. Not the healthiest choice.', nutrients: ['Sodium', 'Protein'] },
];

// Educational tips that rotate
const nutritionTips = [
  "🌈 Eat a rainbow! Different colored foods have different vitamins.",
  "💧 Drink plenty of water! Your body needs it to stay healthy.",
  "🥗 Fill half your plate with fruits and vegetables!",
  "🏃 Healthy eating gives you energy to play and learn!",
  "🦷 Too much sugar can hurt your teeth and make you tired.",
  "💪 Protein helps build strong muscles and helps you grow!",
  "🧠 Omega-3 from fish helps your brain work better!",
  "🦴 Calcium from milk and cheese makes your bones strong!",
  "👀 Vitamin A from carrots helps you see in the dark!",
  "🛡️ Vitamin C boosts your immune system to fight colds!",
];

// Feedback Display Component
const FeedbackDisplay = ({ show, correct, foodItem, onNext }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (show) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [show]);

  if (!show) return null;

  return (
    <Animated.View style={[
      styles.feedbackOverlay,
      { opacity: fadeAnim }
    ]}>
      <View style={[
        styles.feedbackCard,
        correct ? styles.correctCard : styles.incorrectCard
      ]}>
        <Text style={styles.feedbackEmoji}>
          {correct ? '✅' : '❌'}
        </Text>
        <Text style={styles.feedbackTitle}>
          {correct ? 'Correct!' : 'Not Quite!'}
        </Text>
        
        <View style={styles.foodInfoCard}>
          <Text style={styles.foodEmoji}>{foodItem.emoji}</Text>
          <Text style={styles.foodName}>{foodItem.food}</Text>
          <Text style={styles.foodCategory}>
            Category: <Text style={styles.boldText}>{foodItem.category}</Text>
          </Text>
          <Text style={styles.foodGroup}>
            Food Group: <Text style={styles.boldText}>{foodItem.group}</Text>
          </Text>
          <Text style={styles.foodCalories}>
            Calories: {foodItem.calories} per serving
          </Text>
        </View>

        <View style={styles.benefitCard}>
          <Text style={styles.benefitTitle}>💡 Learn:</Text>
          <Text style={styles.benefitText}>{foodItem.benefit}</Text>
        </View>

        <View style={styles.nutrientsCard}>
          <Text style={styles.nutrientsTitle}>Key Nutrients:</Text>
          <View style={styles.nutrientsList}>
            {foodItem.nutrients.map((nutrient, index) => (
              <View key={index} style={styles.nutrientTag}>
                <Text style={styles.nutrientText}>{nutrient}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Progress Bar Component
const ProgressBar = ({ current, total }) => {
  const progress = (current / total) * 100;
  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>Question {current + 1} of {total}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

// Lives Display Component
const LivesDisplay = ({ lives }) => {
  return (
    <View style={styles.livesContainer}>
      <Text style={styles.livesLabel}>Lives: </Text>
      {[...Array(3)].map((_, index) => (
        <Text key={index} style={styles.heart}>
          {index < lives ? '❤️' : '🖤'}
        </Text>
      ))}
    </View>
  );
};

// Main Game Component
const FoodSortGame = ({ onGameEnd }) => {
  // Shuffle questions for variety
  const [questions] = useState(() => {
    const shuffled = [...foodDatabase].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20); // Use 20 random questions
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [currentTip] = useState(() => 
    nutritionTips[Math.floor(Math.random() * nutritionTips.length)]
  );
  const [answersDisabled, setAnswersDisabled] = useState(false);

  // Start timer when question loads
  useEffect(() => {
    setStartTime(Date.now());
    setShowFeedback(false);
    setAnswersDisabled(false);
  }, [currentQuestionIndex]);

  const handleAnswer = (selectedAnswer) => {
    if (answersDisabled) return;
    setAnswersDisabled(true);

    const responseTime = (Date.now() - startTime) / 1000;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.category;

    setResponseTimes([...responseTimes, responseTime]);
    setLastAnswerCorrect(isCorrect);

    if (isCorrect) {
      // Scoring: base points + streak bonus + speed bonus
      const speedBonus = responseTime < 3 ? 5 : 0;
      const streakBonus = streak * 2;
      const points = 10 + streakBonus + speedBonus;
      
      setScore(prevScore => prevScore + points);
      setStreak(prevStreak => {
        const newStreak = prevStreak + 1;
        if (newStreak > bestStreak) setBestStreak(newStreak);
        return newStreak;
      });
      setCorrectAnswers(prev => prev + 1);
    } else {
      setLives(prevLives => prevLives - 1);
      setStreak(0);
    }

    setShowFeedback(true);
  };

  const handleNext = () => {
    const isGameOver = lives <= 1 && !lastAnswerCorrect;
    const isLastQuestion = currentQuestionIndex >= questions.length - 1;

    if (isGameOver || isLastQuestion) {
      // Calculate final statistics
      const totalQuestions = currentQuestionIndex + 1;
      const accuracy = ((correctAnswers + (lastAnswerCorrect ? 1 : 0)) / totalQuestions) * 100;
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      const gameData = {
        score,
        accuracy: accuracy.toFixed(1),
        topic: 'Nutrition & Food Categorization',
        questionsAnswered: totalQuestions,
        correctAnswers: correctAnswers + (lastAnswerCorrect ? 1 : 0),
        averageResponseTime: avgResponseTime.toFixed(1),
        bestStreak,
        finalLives: lives - (lastAnswerCorrect ? 0 : 1),
      };

      // Call the onGameEnd callback if provided
      if (onGameEnd) {
        onGameEnd(gameData);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Check if game is over
  const gameOver = (lives <= 0) || (currentQuestionIndex >= questions.length);
  
  if (gameOver) {
    const accuracy = (correctAnswers / questions.length) * 100;
    return (
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>🎉 Game Complete! 🎉</Text>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Results:</Text>
            <Text style={styles.statLine}>Final Score: <Text style={styles.statValue}>{score}</Text></Text>
            <Text style={styles.statLine}>Accuracy: <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text></Text>
            <Text style={styles.statLine}>Correct Answers: <Text style={styles.statValue}>{correctAnswers}/{questions.length}</Text></Text>
            <Text style={styles.statLine}>Best Streak: <Text style={styles.statValue}>{bestStreak}</Text></Text>
            <Text style={styles.statLine}>Avg Response Time: <Text style={styles.statValue}>
              {(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)}s
            </Text></Text>
          </View>

          <View style={styles.learningCard}>
            <Text style={styles.learningTitle}>🌟 What You Learned:</Text>
            <Text style={styles.learningText}>
              • Healthy foods give your body the nutrients it needs{'\n'}
              • Fruits and vegetables are packed with vitamins{'\n'}
              • Proteins help build strong muscles{'\n'}
              • Junk food has lots of sugar and few nutrients{'\n'}
              • Balance is key - enjoy treats in moderation!
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.playAgainButton}
            onPress={() => {
              if (onGameEnd) {
                onGameEnd({
                  score,
                  accuracy: accuracy.toFixed(1),
                  topic: 'Nutrition & Food Categorization',
                  questionsAnswered: questions.length,
                  correctAnswers,
                  restart: true,
                });
              }
            }}
          >
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.header}>🍎 Food Sort Challenge 🥦</Text>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statNumber}>{score}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={[styles.statNumber, styles.streakNumber]}>
              {streak > 0 ? `🔥 ${streak}` : '0'}
            </Text>
          </View>
          <LivesDisplay lives={lives} />
        </View>

        {/* Progress */}
        <ProgressBar current={currentQuestionIndex} total={questions.length} />

        {/* Tip of the day */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>{currentTip}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.foodEmojiLarge}>{currentQuestion.emoji}</Text>
          <Text style={styles.questionText}>
            Is <Text style={styles.foodNameHighlight}>{currentQuestion.food}</Text> healthy or junk food?
          </Text>
        </View>

        {/* Answer Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.healthyButton]}
            onPress={() => handleAnswer('Healthy')}
            disabled={answersDisabled}
          >
            <Text style={styles.buttonEmoji}>✅</Text>
            <Text style={styles.buttonText}>Healthy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.moderateButton]}
            onPress={() => handleAnswer('Moderate')}
            disabled={answersDisabled}
          >
            <Text style={styles.buttonEmoji}>⚖️</Text>
            <Text style={styles.buttonText}>Moderate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.junkButton]}
            onPress={() => handleAnswer('Junk')}
            disabled={answersDisabled}
          >
            <Text style={styles.buttonEmoji}>❌</Text>
            <Text style={styles.buttonText}>Junk</Text>
          </TouchableOpacity>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 Think about the nutrients and health benefits!
          </Text>
        </View>

        {/* Feedback Modal */}
        <FeedbackDisplay
          show={showFeedback}
          correct={lastAnswerCorrect}
          foodItem={currentQuestion}
          onNext={handleNext}
        />
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  streakNumber: {
    color: '#FF6F00',
  },
  livesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livesLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  heart: {
    fontSize: 18,
    marginHorizontal: 2,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#C8E6C9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  tipContainer: {
    backgroundColor: '#FFF9C4',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  tipText: {
    fontSize: 14,
    color: '#F57F17',
    fontWeight: '500',
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodEmojiLarge: {
    fontSize: 80,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  foodNameHighlight: {
    fontWeight: 'bold',
    color: '#2E7D32',
    fontSize: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 18,
    margin: 5,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  healthyButton: {
    backgroundColor: '#4CAF50',
  },
  moderateButton: {
    backgroundColor: '#FF9800',
  },
  junkButton: {
    backgroundColor: '#F44336',
  },
  buttonEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#E1F5FE',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0288D1',
  },
  infoText: {
    fontSize: 14,
    color: '#01579B',
    textAlign: 'center',
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  correctCard: {
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  incorrectCard: {
    borderWidth: 4,
    borderColor: '#F44336',
  },
  feedbackEmoji: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 15,
  },
  feedbackTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  foodInfoCard: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  foodEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  foodCategory: {
    fontSize: 16,
    color: '#666',
    marginVertical: 3,
  },
  foodGroup: {
    fontSize: 16,
    color: '#666',
    marginVertical: 3,
  },
  foodCalories: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333',
  },
  benefitCard: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  nutrientsCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  nutrientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 10,
  },
  nutrientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nutrientTag: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    margin: 4,
  },
  nutrientText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameOverContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 30,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  statLine: {
    fontSize: 16,
    color: '#666',
    marginVertical: 6,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#2E7D32',
    fontSize: 18,
  },
  learningCard: {
    backgroundColor: '#E8F5E9',
    padding: 25,
    borderRadius: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  learningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
    textAlign: 'center',
  },
  learningText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  playAgainButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default FoodSortGame;