// src/components/FactorCraftGame.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useUserProgress } from '../../context/UserProgressContext';
import { useIsFocused, useNavigation } from '@react-navigation/native';

const OPERATIONS = ['add', 'subtract', 'multiply', 'divide'];
const { width } = Dimensions.get('window');

export default function FactorCraftGame() {
  const { recordGame, completeQuestion } = useUserProgress();
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  // Game state
  const [tiles, setTiles] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [target, setTarget] = useState(12);
  const [score, setScore] = useState(0);
  const [operation, setOperation] = useState('add');
  const [level, setLevel] = useState(1);
  const [correctInLevel, setCorrectInLevel] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Session tracking
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [questionsCorrect, setQuestionsCorrect] = useState(0);
  const gameStartTimeRef = useRef(Date.now());
  const hasEndedRef = useRef(false);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const comboAnim = useRef(new Animated.Value(0)).current;

  // Initialize game on mount
  useEffect(() => {
    startNewRound();
  }, []);

  // Timer control - ONLY runs when screen is focused and not paused
  useEffect(() => {
    let interval = null;

    if (isFocused && !isPaused && timeLeft > 0 && !hasEndedRef.current) {
      // Start timer
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            // Time's up! But only trigger endGame if we're still focused
            if (isFocused && !hasEndedRef.current) {
              hasEndedRef.current = true;
              // Use setTimeout to ensure we're out of the setState call
              setTimeout(() => endGame(), 100);
            }
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    }

    // Cleanup
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isFocused, isPaused, timeLeft]);

  // Handle navigation away - save progress
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Screen lost focus - auto-pause
      setIsPaused(true);
    });

    return unsubscribe;
  }, [navigation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Save progress if game was in progress
      if (questionsAttempted > 0 && !hasEndedRef.current) {
        const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        recordGame('factorcraft', durationSeconds, questionsAttempted, questionsCorrect, 'math')
          .catch(err => console.error('Error saving on unmount:', err));
      }
    };
  }, []);

  const getOperationSymbol = (op) => ({
    add: '+',
    subtract: '−',
    multiply: '×',
    divide: '÷',
  }[op]);

  const getOperationColor = (op) => ({
    add: '#4CAF50',
    subtract: '#FF9800',
    multiply: '#2196F3',
    divide: '#9C27B0',
  }[op]);

  function startNewRound() {
    let newTarget = 0;
    let solution = [];
    let newOperation = '';
    const minValue = 1;
    const numberRange = Math.min(10 + level * 5, 100);
    const tileCount = Math.min(6 + Math.floor(level / 2), 12);

    let attempts = 0;
    while (attempts < 100) {
      attempts++;
      newOperation = OPERATIONS[Math.floor(Math.random() * OPERATIONS.length)];

      let pickCount = Math.min(2 + Math.floor(level / 3), 4);
      solution = Array.from({ length: pickCount }, () =>
        Math.floor(Math.random() * numberRange) + minValue
      );

      if (newOperation === 'divide') {
        solution = solution.map(n => (n === 0 ? 1 : n));
      }

      switch (newOperation) {
        case 'add':
          newTarget = solution.reduce((a, b) => a + b, 0);
          break;
        case 'subtract':
          solution.sort((a, b) => b - a);
          newTarget = solution.slice(1).reduce((a, b) => a - b, solution[0]);
          break;
        case 'multiply':
          newTarget = solution.reduce((a, b) => a * b, 1);
          break;
        case 'divide':
          const denom = solution.slice(1);
          if (denom.includes(0)) continue;
          const divResult = denom.reduce((a, b) => a / b, solution[0]);
          if (!Number.isInteger(divResult) || divResult <= 0) continue;
          newTarget = divResult;
          break;
      }

      if (
        Number.isFinite(newTarget) &&
        Number.isInteger(newTarget) &&
        newTarget > 0 &&
        newTarget <= 500
      ) break;
    }

    let generatedTiles = [...solution];
    while (generatedTiles.length < tileCount) {
      const randomNum = Math.floor(Math.random() * numberRange) + minValue;
      generatedTiles.push(randomNum);
    }
    generatedTiles = generatedTiles.sort(() => Math.random() - 0.5);

    setOperation(newOperation);
    setTiles(generatedTiles);
    setTarget(newTarget);
    setSelectedIndices([]);
    setShowHint(false);

    // Animate target appearance
    Animated.spring(scaleAnim, {
      toValue: 1.2,
      friction: 3,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  }

  function toggleTile(index) {
    if (isPaused || timeLeft <= 0 || hasEndedRef.current) return;
    
    setSelectedIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  }

  async function checkAnswer() {
    if (isPaused || timeLeft <= 0 || hasEndedRef.current) return;
    
    if (selectedIndices.length < 2) {
      Alert.alert('⚠️ Pick at least 2 numbers!');
      return;
    }

    const selectedNumbers = selectedIndices.map((i) => tiles[i]);
    let result;

    switch (operation) {
      case 'add':
        result = selectedNumbers.reduce((a, b) => a + b, 0);
        break;
      case 'subtract':
        result = selectedNumbers.slice(1).reduce((a, b) => a - b, selectedNumbers[0]);
        break;
      case 'multiply':
        result = selectedNumbers.reduce((a, b) => a * b, 1);
        break;
      case 'divide': {
        const denom = selectedNumbers.slice(1);
        if (denom.includes(0)) {
          Alert.alert('❌ Cannot divide by zero!');
          return;
        }
        const divResult = denom.reduce((a, b) => a / b, selectedNumbers[0]);
        if (!Number.isInteger(divResult)) {
          Alert.alert('❌ Result must be a whole number!');
          return;
        }
        result = divResult;
        break;
      }
    }

    const isCorrect = result === target;
    const needForLevelUp = 5 + Math.floor(level / 2);
    const shouldLevelUp = isCorrect && (correctInLevel + 1) >= needForLevelUp;

    // Update local stats immediately
    setQuestionsAttempted(prev => prev + 1);
    
    if (isCorrect) {
      setQuestionsCorrect(prev => prev + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      
      // Calculate points with combo multiplier
      const basePoints = shouldLevelUp ? 20 : 10;
      const bonusPoints = Math.floor(basePoints * (newCombo / 5));
      const totalPoints = basePoints + bonusPoints;

      // Update game state
      const newCorrect = shouldLevelUp ? 0 : correctInLevel + 1;
      setScore((s) => s + 1);
      setCorrectInLevel(newCorrect);
      
      if (shouldLevelUp) {
        setLevel((l) => l + 1);
        setTimeLeft((t) => t + 10); // Bonus time for level up
      }

      // Success animation
      Animated.sequence([
        Animated.timing(comboAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(comboAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Award points via context (async, but don't block UI)
      completeQuestion('math', true, totalPoints, basePoints)
        .catch(error => console.error('Error updating progress:', error));

      const message = shouldLevelUp 
        ? `🎉 Level ${level + 1}!\n+10 seconds bonus!`
        : newCombo > 1 
        ? `✅ Correct! ${newCombo}x Combo!\n+${totalPoints} pts`
        : `✅ Correct!\n+${totalPoints} pts`;

      Alert.alert(
        shouldLevelUp ? 'Level Up!' : 'Correct!',
        message,
        [{ text: 'Next', onPress: startNewRound }]
      );
    } else {
      // Wrong answer - reset combo
      setCombo(0);
      
      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      Alert.alert(
        '❌ Incorrect',
        `You got ${result}, but the target is ${target}\nCombo reset!`,
        [{ text: 'Try Again' }]
      );
    }
  }

  function giveHint() {
    if (isPaused || timeLeft <= 0 || hasEndedRef.current) return;
    
    // Find a valid solution
    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        let result;
        const nums = [tiles[i], tiles[j]];
        
        switch (operation) {
          case 'add':
            result = nums[0] + nums[1];
            break;
          case 'subtract':
            result = Math.max(nums[0], nums[1]) - Math.min(nums[0], nums[1]);
            break;
          case 'multiply':
            result = nums[0] * nums[1];
            break;
          case 'divide':
            if (nums[1] !== 0 && nums[0] % nums[1] === 0) {
              result = nums[0] / nums[1];
            } else if (nums[0] !== 0 && nums[1] % nums[0] === 0) {
              result = nums[1] / nums[0];
            }
            break;
        }

        if (result === target) {
          setShowHint(true);
          setSelectedIndices([i, j]);
          setTimeout(() => setShowHint(false), 2000);
          return;
        }
      }
    }
    
    Alert.alert('💡 Hint', 'Try different combinations!');
  }

  const endGame = async () => {
    // CRITICAL: Only show alert if we're CURRENTLY on this screen
    if (!isFocused) {
      console.log('Game ended but screen not focused - skipping alert');
      return;
    }

    // Prevent multiple calls
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    const durationSeconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
    
    // Record the complete game session
    try {
      await recordGame(
        'factorcraft',
        durationSeconds,
        questionsAttempted,
        questionsCorrect,
        'math'
      );
    } catch (error) {
      console.error('Error recording game:', error);
    }

    // Only show alert if STILL focused after async operation
    if (!isFocused) {
      console.log('Screen lost focus during save - skipping alert');
      return;
    }

    Alert.alert(
      '⏰ Time\'s Up!',
      `Final Score: ${score}\nAccuracy: ${questionsAttempted > 0 ? Math.round((questionsCorrect / questionsAttempted) * 100) : 0}%\nLevel Reached: ${level}`,
      [
        {
          text: 'Play Again',
          onPress: () => resetGame(),
        },
        {
          text: 'Exit',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
      ],
      { 
        cancelable: false,
        onDismiss: () => {
          // If alert is dismissed, reset game
          resetGame();
        }
      }
    );
  };

  const resetGame = () => {
    // Complete reset
    setScore(0);
    setLevel(1);
    setCorrectInLevel(0);
    setCombo(0);
    setTimeLeft(60);
    setQuestionsAttempted(0);
    setQuestionsCorrect(0);
    setIsPaused(false);
    hasEndedRef.current = false;
    gameStartTimeRef.current = Date.now();
    startNewRound();
  };

  const togglePause = () => {
    if (hasEndedRef.current || timeLeft <= 0) return;
    setIsPaused(!isPaused);
  };

  const progressToNextLevel = (correctInLevel / (5 + Math.floor(level / 2))) * 100;

  return (
    <View style={styles.container}>
      {/* Pause Overlay */}
      {isPaused && timeLeft > 0 && (
        <TouchableOpacity 
          style={styles.pausedOverlay}
          activeOpacity={1}
          onPress={togglePause}
        >
          <View style={styles.pausedCard}>
            <Text style={styles.pausedIcon}>⏸️</Text>
            <Text style={styles.pausedTitle}>Game Paused</Text>
            <Text style={styles.pausedText}>
              Tap anywhere to resume
            </Text>
            <Text style={styles.pausedTime}>Time Left: {timeLeft}s</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Level</Text>
          <Text style={styles.statValue}>{level}</Text>
        </View>
        
        <View style={[styles.statBox, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.statBox, 
            { backgroundColor: isPaused ? '#FFC107' : timeLeft < 10 ? '#F44336' : '#4CAF50' }
          ]}
          onPress={togglePause}
          activeOpacity={0.7}
        >
          <Text style={styles.statLabel}>{isPaused ? 'Paused' : 'Time'}</Text>
          <Text style={styles.statValue}>{isPaused ? '⏸️' : `${timeLeft}s`}</Text>
        </TouchableOpacity>
      </View>

      {/* Combo Indicator */}
      {combo > 1 && (
        <Animated.View 
          style={[
            styles.comboBar,
            {
              transform: [{
                scale: comboAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.comboText}>🔥 {combo}x COMBO!</Text>
        </Animated.View>
      )}

      {/* Level Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {correctInLevel}/{5 + Math.floor(level / 2)} to next level
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressToNextLevel}%` }]} />
        </View>
      </View>

      {/* Operation Badge */}
      <View style={[styles.operationBadge, { backgroundColor: getOperationColor(operation) }]}>
        <Text style={styles.operationText}>
          Use {getOperationSymbol(operation)}
        </Text>
      </View>

      {/* Target */}
      <Animated.View
        style={[
          styles.targetContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        <Text style={styles.targetLabel}>Target Number</Text>
        <Text style={styles.target}>{target}</Text>
      </Animated.View>

      {/* Tiles Grid */}
      <View style={styles.grid}>
        {tiles.map((num, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tile,
              selectedIndices.includes(index) && styles.tileSelected,
              showHint && selectedIndices.includes(index) && styles.tileHint,
            ]}
            onPress={() => toggleTile(index)}
            activeOpacity={0.7}
            disabled={isPaused || hasEndedRef.current}
          >
            <Text style={[
              styles.tileText,
              selectedIndices.includes(index) && styles.tileTextSelected,
            ]}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected Numbers Display */}
      {selectedIndices.length > 0 && (
        <View style={styles.selectedDisplay}>
          <Text style={styles.selectedText}>
            {selectedIndices.map(i => tiles[i]).join(` ${getOperationSymbol(operation)} `)}
            {selectedIndices.length >= 2 && ' = ?'}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.button, styles.hintButton]} 
          onPress={giveHint}
          disabled={isPaused || hasEndedRef.current}
        >
          <Text style={styles.buttonText}>💡 Hint</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.checkButton]} 
          onPress={checkAnswer}
          disabled={selectedIndices.length < 2 || isPaused || hasEndedRef.current}
        >
          <Text style={styles.buttonText}>
            {selectedIndices.length < 2 ? 'Select 2+' : 'Check ✓'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={() => setSelectedIndices([])}
          disabled={isPaused || hasEndedRef.current}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  comboBar: {
    backgroundColor: '#FF5722',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  comboText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  operationBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  operationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  targetContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  targetLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  target: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2196F3',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tile: {
    width: (width - 80) / 4,
    height: (width - 80) / 4,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tileSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
    transform: [{ scale: 0.95 }],
  },
  tileHint: {
    backgroundColor: '#FFC107',
    borderColor: '#FFA000',
  },
  tileText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  tileTextSelected: {
    color: '#fff',
  },
  selectedDisplay: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  hintButton: {
    backgroundColor: '#9C27B0',
  },
  checkButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  pausedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pausedCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  pausedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  pausedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  pausedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  pausedTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
  },
});