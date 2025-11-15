import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, FontAwesome, Ionicons } from '@expo/vector-icons';

// Question bank
const QUESTIONS = [
  { id: 1, question: "What type of word is 'quickly'?", word: "quickly", sentence: "The rabbit ran quickly through the garden.", correct: "adverb", options: ["noun", "verb", "adverb", "adjective"], explanation: "'Quickly' describes HOW the rabbit ran. Words that describe verbs are adverbs!" },
  { id: 2, question: "What type of word is 'happy'?", word: "happy", sentence: "The happy dog wagged its tail.", correct: "adjective", options: ["noun", "verb", "adverb", "adjective"], explanation: "'Happy' describes the dog. Words that describe nouns are adjectives!" },
  { id: 3, question: "What type of word is 'playground'?", word: "playground", sentence: "The children played at the playground.", correct: "noun", options: ["noun", "verb", "adverb", "adjective"], explanation: "'Playground' is a person, place, or thing. That makes it a noun!" },
  { id: 4, question: "What type of word is 'jumped'?", word: "jumped", sentence: "The frog jumped over the log.", correct: "verb", options: ["noun", "verb", "adverb", "adjective"], explanation: "'Jumped' is an action word. Action words are verbs!" },
  { id: 5, question: "What type of word is 'colorful'?", word: "colorful", sentence: "She painted a colorful picture.", correct: "adjective", options: ["noun", "verb", "adverb", "adjective"], explanation: "'Colorful' describes the picture. Describing words are adjectives!" },
  { id: 6, question: "What type of word is 'teacher'?", word: "teacher", sentence: "Our teacher reads us stories every day.", correct: "noun", options: ["noun", "verb", "adverb", "adjective"], explanation: "'Teacher' is a person. People are nouns!" },
  { id: 7, question: "What type of word is 'slowly'?", word: "slowly", sentence: "The turtle moved slowly across the path.", correct: "adverb", options: ["noun", "verb", "adverb", "adjective"], explanation: "'Slowly' tells us HOW the turtle moved. These words are adverbs!" },
  { id: 8, question: "What type of word is 'giggled'?", word: "giggled", sentence: "The baby giggled at the funny face.", correct: "verb", options: ["noun", "verb", "adverb", "adjective"], explanation: "'Giggled' is something the baby did. Action words are verbs!" }
];

const WordDetectiveGame = ({ onGameEnd = () => {} }) => {
  const [gameState, setGameState] = useState('playing'); // playing, finished
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [responseTimes, setResponseTimes] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const totalQuestions = QUESTIONS.length;
  const correctAnswers = answeredQuestions.filter(q => q.correct).length;
  const accuracy = answeredQuestions.length > 0 
    ? Math.round((correctAnswers / answeredQuestions.length) * 100) 
    : 0;

  useEffect(() => setQuestionStartTime(Date.now()), [currentQuestionIndex]);

  const handleAnswerSelect = (answer) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correct;
    setIsCorrect(correct);
    setShowFeedback(true);

    const responseTime = Date.now() - questionStartTime;
    setResponseTimes([...responseTimes, responseTime]);

    if (correct) {
      setScore(score + 10 + streak * 5);
      setStreak(streak + 1);
    } else {
      setLives(lives - 1);
      setStreak(0);
    }

    setAnsweredQuestions([...answeredQuestions, { questionId: currentQuestion.id, correct, answer, responseTime }]);

    setTimeout(() => {
      if (correct || lives > 1) nextQuestion();
      else endGame();
    }, 1500);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else endGame();
  };

  const endGame = () => {
    setGameState('finished');
    const totalTime = Date.now() - startTime;
    const avgResponseTime = responseTimes.length ? Math.round(responseTimes.reduce((a,b)=>a+b,0)/responseTimes.length/1000) : 0;
    onGameEnd({ score, accuracy, topic: 'Parts of Speech', questionsAnswered: answeredQuestions.length, correctAnswers, totalTime: Math.round(totalTime/1000), averageResponseTime: avgResponseTime });
  };

  const restartGame = () => {
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setLives(3);
    setStreak(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnsweredQuestions([]);
    setStartTime(Date.now());
    setResponseTimes([]);
    setQuestionStartTime(Date.now());
  };

  if (gameState === 'finished') {
    return (
      <View style={styles.container}>
        <View style={styles.centerCard}>
          <MaterialCommunityIcons name="trophy" size={64} color="#FFD700" />
          <Text style={styles.title}>Great Job, Detective!</Text>
          <Text style={styles.subtitle}>You've completed the case!</Text>

          <View style={styles.stats}>
            <Text>Final Score: {score}</Text>
            <Text>Accuracy: {accuracy}%</Text>
            <Text>Questions Answered: {answeredQuestions.length}/{totalQuestions}</Text>
            <Text>Correct Answers: {correctAnswers}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={restartGame}>
            <MaterialCommunityIcons name="rotate-left" size={24} color="#fff" />
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={32} color="#9f7aea" />
          <Text style={styles.title}>Word Detective</Text>
        </View>
        <View style={styles.lives}>
          {[...Array(lives)].map((_,i)=><FontAwesome key={i} name="heart" size={32} color="red" />)}
        </View>
      </View>

      {/* Question Card */}
      <View style={styles.questionCard}>
        <Text style={styles.question}>{currentQuestion.question}</Text>
        <Text style={styles.sentence}>
          {currentQuestion.sentence.split(currentQuestion.word).map((part,i,arr)=>(
            <Text key={i}>
              {part}
              {i<arr.length-1 && <Text style={styles.highlight}>{currentQuestion.word}</Text>}
            </Text>
          ))}
        </Text>

        {/* Options */}
        <View style={styles.options}>
          {currentQuestion.options.map(option=>{
            let bgColor = '#ddd';
            if(showFeedback && option === currentQuestion.correct) bgColor='green';
            else if(showFeedback && option===selectedAnswer && !isCorrect) bgColor='red';
            else if(selectedAnswer===option && !showFeedback) bgColor='#9f7aea';

            return (
              <TouchableOpacity key={option} style={[styles.optionButton, {backgroundColor:bgColor}]} onPress={()=>handleAnswerSelect(option)} disabled={showFeedback}>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <View style={[styles.feedback, {backgroundColor: isCorrect ? '#d4edda' : '#f8d7da'}]}>
            <Text style={[styles.feedbackTitle, {color: isCorrect ? '#155724' : '#721c24'}]}>
              {isCorrect ? '🎉 Correct!' : '💭 Not quite!'}
            </Text>
            <Text style={styles.feedbackText}>{currentQuestion.explanation}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1, backgroundColor: '#e0c3fc' },
  centerCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', marginVertical: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginVertical: 8 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 16 },
  stats: { marginVertical:16 },
  button: { flexDirection:'row', alignItems:'center', justifyContent:'center', padding:16, backgroundColor:'#9f7aea', borderRadius:16, marginTop:16 },
  buttonText:{ color:'#fff', fontWeight:'bold', marginLeft:8 },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  headerLeft: { flexDirection:'row', alignItems:'center', gap:8 },
  lives: { flexDirection:'row', gap:8 },
  questionCard:{ backgroundColor:'#fff', borderRadius:24, padding:16 },
  question:{ fontSize:20, fontWeight:'bold', marginBottom:8 },
  sentence:{ fontSize:16, marginBottom:16 },
  highlight:{ fontWeight:'bold', color:'#9f7aea', backgroundColor:'#e9d5ff', paddingHorizontal:4 },
  options:{ flexDirection:'row', flexWrap:'wrap', gap:8 },
  optionButton:{ flex:1, padding:12, borderRadius:16, margin:4, alignItems:'center', justifyContent:'center' },
  optionText:{ fontSize:16, fontWeight:'bold', color:'#fff' },
  feedback:{ padding:16, borderRadius:16, marginTop:16 },
  feedbackTitle:{ fontSize:20, fontWeight:'bold', marginBottom:8 },
  feedbackText:{ fontSize:16 }
});

export default WordDetectiveGame;
