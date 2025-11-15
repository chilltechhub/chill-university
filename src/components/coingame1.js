import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useUserProgress } from '../../context/UserProgressContext';

// Generate questions that progressively teach coin counting
const generateQuestion = (level) => {
  // Progressive difficulty: start with fewer coins and simpler amounts
  const maxCoins = Math.min(3 + level, 10);
  const cost = Math.floor(Math.random() * (30 + level * 10)) + 10;
  
  // At lower levels, ensure higher success rate by giving exact or slightly more
  const exactMatch = level <= 3 ? Math.random() < 0.6 : Math.random() < 0.4;
  
  let amount;
  if (exactMatch) {
    amount = cost; // Exact amount
  } else {
    // Either slightly short or over
    const diff = Math.floor(Math.random() * (5 + level * 2)) + 1;
    amount = Math.random() < 0.5 ? cost - diff : cost + diff;
  }
  
  // Ensure amount is positive
  if (amount < 0) amount = cost;
  
  // Generate coins that add up to the amount
  const coins = [25, 10, 5, 1];
  const coinSet = [];
  let remaining = amount;
  
  // For lower levels, prefer using larger coins first (easier to count)
  if (level <= 3) {
    for (let coin of coins) {
      while (remaining >= coin && coinSet.length < maxCoins) {
        coinSet.push(coin);
        remaining -= coin;
      }
      if (remaining === 0) break;
    }
  } else {
    // Higher levels: more random coin selection (harder to count)
    while (remaining > 0 && coinSet.length < maxCoins) {
      const coin = coins[Math.floor(Math.random() * coins.length)];
      if (coin <= remaining) {
        coinSet.push(coin);
        remaining -= coin;
      }
    }
  }

  const names = ['Billy', 'Sally', 'Tom', 'Lucy', 'Mike', 'Emma', 'Jake', 'Olivia', 'Noah', 'Ava'];
  const items = ['popsicle', 'toy', 'candy', 'sticker', 'balloon', 'pencil', 'eraser', 'notebook'];
  const name = names[Math.floor(Math.random() * names.length)];
  const item = items[Math.floor(Math.random() * items.length)];
  
  const text = `${name} wants to buy a ${item} for ${cost}¢. Does ${name} have enough money?`;

  return { cost, coins: coinSet, amount, text, name };
};

// Congratulations Banner Component
function CongratsBanner({ level }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>
        🎉 Level {level} Complete! 🎉
      </Text>
    </View>
  );
}

// Coin Display Component with visual coins
function CoinDisplay({ coins }) {
  const getCoinDisplay = (value) => {
    switch (value) {
      case 25: return { emoji: '🪙', label: '25¢', color: '#C0C0C0' };
      case 10: return { emoji: '🪙', label: '10¢', color: '#FFA500' };
      case 5: return { emoji: '🪙', label: '5¢', color: '#FFD700' };
      case 1: return { emoji: '🪙', label: '1¢', color: '#CD7F32' };
      default: return { emoji: '🪙', label: `${value}¢`, color: '#999' };
    }
  };

  return (
    <View style={styles.coinContainer}>
      <Text style={styles.coinTitle}>Your Coins:</Text>
      <View style={styles.coinsGrid}>
        {coins.map((coin, index) => {
          const display = getCoinDisplay(coin);
          return (
            <View key={index} style={[styles.coin, { backgroundColor: display.color }]}>
              <Text style={styles.coinEmoji}>{display.emoji}</Text>
              <Text style={styles.coinLabel}>{display.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Feedback Component to show teaching moments
function FeedbackDisplay({ show, correct, userAmount, cost, name }) {
  if (!show) return null;
  
  const difference = userAmount - cost;
  
  return (
    <View style={[styles.feedbackContainer, correct ? styles.correctFeedback : styles.incorrectFeedback]}>
      <Text style={styles.feedbackTitle}>
        {correct ? '✅ Correct!' : '❌ Not quite!'}
      </Text>
      <Text style={styles.feedbackText}>
        {name} has <Text style={styles.boldText}>{userAmount}¢</Text>
      </Text>
      <Text style={styles.feedbackText}>
        The item costs <Text style={styles.boldText}>{cost}¢</Text>
      </Text>
      <Text style={styles.feedbackText}>
        {difference >= 0 
          ? `✓ ${name} has ${difference === 0 ? 'exactly' : `${difference}¢ more than`} enough!`
          : `✗ ${name} needs ${Math.abs(difference)}¢ more.`
        }
      </Text>
    </View>
  );
}

export default function CoinGame() {
  const { recordGame } = useUserProgress();

  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState(generateQuestion(1));
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [retryMode, setRetryMode] = useState(false);
  const [userCountInput, setUserCountInput] = useState('');
  const [showCongrats, setShowCongrats] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  // Reset timer whenever question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setShowFeedback(false);
  }, [question]);

  const moveToNextQuestion = () => {
    let newCorrect = correctAnswers + 1;
    if (newCorrect >= 10) {
      if (level >= 10) {
        Alert.alert('🏆 Champion!', 'You finished all 10 levels! You\'re a coin counting master!', [
          { text: 'Play Again', onPress: () => {
            setLevel(1);
            setCorrectAnswers(0);
            setQuestion(generateQuestion(1));
          }}
        ]);
        return;
      }
      setLevel((l) => l + 1);
      newCorrect = 0;
      setShowCongrats(true);
      setTimeout(() => {
        setShowCongrats(false);
        setQuestion(generateQuestion(level + 1));
      }, 2500);
    } else {
      setTimeout(() => {
        setQuestion(generateQuestion(level));
      }, 2000);
    }
    setCorrectAnswers(newCorrect);
  };

  const handleAnswer = (userAnswer) => {
    const hasEnough = question.amount >= question.cost;
    const correct = userAnswer === hasEnough; // Fixed logic bug!
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const willLevelUp = correct && correctAnswers + 1 >= 10;
    const pts = correct ? (willLevelUp ? 20 : 10) : 0;

    // Record this attempt
    recordGame(
      'CoinGame',
      timeTaken,
      correct ? 1 : 0,
      1,
      willLevelUp,
      pts
    );

    // Show feedback first
    setLastAnswerCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      // Move to next question after showing feedback
      setTimeout(() => {
        moveToNextQuestion();
      }, 2000);
    } else {
      // Enter retry mode after feedback
      setTimeout(() => {
        setRetryMode(true);
      }, 2000);
    }
  };

  const handleRetrySubmit = () => {
    const counted = parseInt(userCountInput, 10);
    const correct = counted === question.amount;
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const willLevelUp = correct && correctAnswers + 1 >= 10;
    const pts = correct ? (willLevelUp ? 20 : 10) : 0;

    // Record this attempt
    recordGame(
      'CoinGame',
      timeTaken,
      correct ? 1 : 0,
      1,
      willLevelUp,
      pts
    );

    if (correct) {
      Alert.alert('Perfect! 🎯', `Yes! You counted ${question.amount}¢ correctly!`, [
        { text: 'Continue', onPress: () => {
          setRetryMode(false);
          setUserCountInput('');
          setShowFeedback(false);
          moveToNextQuestion();
        }}
      ]);
    } else {
      const difference = Math.abs(counted - question.amount);
      Alert.alert(
        'Try Again 🤔', 
        `You counted ${counted}¢, but the actual total is ${difference}¢ ${counted > question.amount ? 'less' : 'more'}. Count each coin carefully!`
      );
    }
  };

  const getTip = () => {
    const tips = [
      '💡 Tip: Count quarters (25¢) first, then dimes (10¢), nickels (5¢), and pennies (1¢)!',
      '💡 Tip: Write down each coin value as you count!',
      '💡 Tip: Group coins of the same value together!',
      '💡 Tip: Start with the biggest coins to make counting easier!',
    ];
    return tips[level % tips.length];
  };

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.levelText}>Level {level}</Text>
          <Text style={styles.score}>Progress: {correctAnswers}/10</Text>
        </View>

        {showCongrats && <CongratsBanner level={level} />}

        {/* Tip */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>{getTip()}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.text}</Text>
        </View>

        {/* Coin Display */}
        <CoinDisplay coins={question.coins} />

        {/* Feedback */}
        <FeedbackDisplay 
          show={showFeedback}
          correct={lastAnswerCorrect}
          userAmount={question.amount}
          cost={question.cost}
          name={question.name}
        />

        {/* Answer Buttons or Retry Input */}
        {!retryMode ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.yesButton]} 
              onPress={() => handleAnswer(true)}
              disabled={showFeedback}
            >
              <Text style={styles.buttonText}>✓ Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.noButton]} 
              onPress={() => handleAnswer(false)}
              disabled={showFeedback}
            >
              <Text style={styles.buttonText}>✗ No</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.retryContainer}>
            <Text style={styles.retryTitle}>🧮 Let's count together!</Text>
            <Text style={styles.retryText}>
              Count each coin carefully and add them up.
            </Text>
            <Text style={styles.retryLabel}>How many cents total?</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={userCountInput}
              onChangeText={setUserCountInput}
              placeholder="Enter total cents"
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleRetrySubmit}
            >
              <Text style={styles.submitButtonText}>Check My Answer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  banner: {
    backgroundColor: '#FFD700',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFA500',
  },
  bannerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tipContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  questionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  coinContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coinTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  coinsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  coin: {
    width: 70,
    height: 70,
    borderRadius: 35,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  coinEmoji: {
    fontSize: 24,
  },
  coinLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  feedbackContainer: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
  },
  correctFeedback: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  incorrectFeedback: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 16,
    marginVertical: 4,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 15,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  yesButton: {
    backgroundColor: '#4CAF50',
  },
  noButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryContainer: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#FF9800',
  },
  retryText: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  retryLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});