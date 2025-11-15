// components/CoinGame/index.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Button,
  TextInput,
} from 'react-native';
import { useUserProgress } from '../../../context/UserProgressContext';

import Question from './Question';
import CoinDisplay from './CoinDisplay';
import AnswerButtons from './AnswerButtons';
import CongratsBanner from './CongratsBanner';

const generateQuestion = (level) => {
  const cost = Math.floor(Math.random() * (50 + level * 5)) + 10;
  const extra = Math.random() < 0.5
    ? -Math.floor(Math.random() * 10)
    : Math.floor(Math.random() * 10);
  const coins = [25, 10, 5, 1];
  let amount = cost + extra;
  if (amount < 0) amount = cost;
  const coinSet = [];
  let remaining = amount;
  while (remaining > 0) {
    const coin = coins[Math.floor(Math.random() * coins.length)];
    if (coin <= remaining) {
      coinSet.push(coin);
      remaining -= coin;
    }
  }

  const questionTemplates = [
    `Billy wants to buy a popsicle for ${cost} cents. Does he have enough money?`,
    `Sally wants to buy a toy for ${cost} cents. Can she afford it?`,
    `Tom is buying a sandwich that costs ${cost} cents. Does he have enough coins?`,
    `Lucy wants to get a balloon for ${cost} cents. Can she buy it?`,
    `Mike is at the fair and sees cotton candy for ${cost} cents. Does he have enough?`,
    `Emma wants a sticker that costs ${cost} cents. Can she pay for it?`,
    `Jake wants a small toy car for ${cost} cents. Does he have enough coins?`,
    `Olivia wants to buy lemonade for ${cost} cents. Does she have enough money?`,
  ];
  const text = questionTemplates[
    Math.floor(Math.random() * questionTemplates.length)
  ];

  return { cost, coins: coinSet, amount, text };
};

export default function CoinGame() {
  const { recordGame } = useUserProgress();

  const [level, setLevel] = useState(1);
  const [question, setQuestion] = useState(generateQuestion(1));
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [retryMode, setRetryMode] = useState(false);
  const [userCountInput, setUserCountInput] = useState('');
  const [showCongrats, setShowCongrats] = useState(false);

  // Reset timer whenever question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [question]);

  const moveToNextQuestion = () => {
    let newCorrect = correctAnswers + 1;
    if (newCorrect >= 10) {
      if (level >= 10) {
        Alert.alert('Congratulations!', 'You finished all levels! Great job!');
        return;
      }
      setLevel((l) => l + 1);
      newCorrect = 0;
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 3000);
    }
    setCorrectAnswers(newCorrect);
    const nextQ = generateQuestion(level);
    setQuestion(nextQ);
  };

  const handleAnswer = (answer) => {
    const correct = question.amount >= question.cost;
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
      moveToNextQuestion();
    } else {
      Alert.alert(
        'Keep trying!',
        "That wasn’t the right choice. Try counting the coins carefully!",
        [{ text: 'Okay', onPress: () => setRetryMode(true) }]
      );
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
      setRetryMode(false);
      setUserCountInput('');
      moveToNextQuestion();
    } else {
      Alert.alert('Oops', 'That amount is still not quite right. Try again!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>
        Correct Answers: {correctAnswers}/10
      </Text>

      {showCongrats && <CongratsBanner level={level} />}

      <Question text={question.text} />
      <CoinDisplay coins={question.coins} />

      {!retryMode ? (
        <AnswerButtons onAnswer={handleAnswer} />
      ) : (
        <View style={styles.retryContainer}>
          <Text>How many cents do you count?</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={userCountInput}
            onChangeText={setUserCountInput}
          />
          <Button title="Submit" onPress={handleRetrySubmit} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 20,
    justifyContent: 'flex-start',
    backgroundColor: '#f0f8ff',
  },
  retryContainer: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginVertical: 10,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#4CAF50',
  },
});
