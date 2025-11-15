import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Modal } from 'react-native';
import * as Animatable from 'react-native-animatable';

const { height, width } = Dimensions.get('window');

// Expanded question data with more educational content
const questions = [
  {
    tool: '🔨 Hammer',
    emoji: '🔨',
    correctAnswer: 'Hammering nails into wood',
    distractors: ['Mixing eggs in a bowl', 'Cutting wood into pieces', 'Digging holes in dirt'],
    explanation: 'A hammer is used to drive nails into wood or walls to fasten things together!',
    funFact: 'The first hammers were just stones! Ancient humans used rocks to hammer things over 3 million years ago!',
    safetyTip: '🦺 Always wear safety goggles when hammering!',
    category: 'Construction',
  },
  {
    tool: '🥄 Whisk',
    emoji: '🥄',
    correctAnswer: 'Mixing eggs and batter',
    distractors: ['Painting walls', 'Screwing screws in', 'Hammering nails'],
    explanation: 'A whisk is used to mix ingredients smoothly, like eggs, cream, or cake batter!',
    funFact: 'Whisks can have up to 12 wires! The more wires, the fluffier your mixture gets!',
    safetyTip: '🧼 Always wash your whisk before and after cooking!',
    category: 'Cooking',
  },
  {
    tool: '🪚 Saw',
    emoji: '🪚',
    correctAnswer: 'Cutting wood into pieces',
    distractors: ['Digging holes', 'Mixing ingredients', 'Painting surfaces'],
    explanation: 'A saw has sharp teeth that cut through wood, plastic, or metal when you push and pull!',
    funFact: 'Some saws can cut through a tree trunk in just minutes! That\'s because the teeth work together!',
    safetyTip: '⚠️ Saws are very sharp! Only use them with adult supervision!',
    category: 'Construction',
  },
  {
    tool: '🪣 Shovel',
    emoji: '⛏️',
    correctAnswer: 'Digging holes in the ground',
    distractors: ['Hammering nails', 'Mixing cake batter', 'Screwing bolts'],
    explanation: 'A shovel has a flat blade perfect for digging, lifting dirt, or moving sand!',
    funFact: 'Shovels have been around for over 5,000 years! They helped build the pyramids!',
    safetyTip: '💪 Bend your knees when digging to protect your back!',
    category: 'Gardening',
  },
  {
    tool: '🖌️ Paintbrush',
    emoji: '🎨',
    correctAnswer: 'Painting walls and surfaces',
    distractors: ['Cutting materials', 'Digging trenches', 'Mixing eggs'],
    explanation: 'A paintbrush has soft bristles that spread paint evenly on walls, canvas, or furniture!',
    funFact: 'Artist paintbrushes can be made from horse hair, pig bristles, or synthetic materials!',
    safetyTip: '🧽 Clean your brush right after painting so it lasts longer!',
    category: 'Art & Decoration',
  },
  {
    tool: '🪛 Screwdriver',
    emoji: '🔧',
    correctAnswer: 'Turning screws to fasten things',
    distractors: ['Painting furniture', 'Hammering nails', 'Cutting materials'],
    explanation: 'A screwdriver turns screws clockwise to tighten or counter-clockwise to loosen!',
    funFact: 'There are over 30 types of screwdriver heads! The most common are flathead and Phillips!',
    safetyTip: '👆 Always use the right size screwdriver for your screw!',
    category: 'Construction',
  },
  {
    tool: '🔧 Wrench',
    emoji: '🔧',
    correctAnswer: 'Tightening nuts and bolts',
    distractors: ['Cutting pipes', 'Painting metal', 'Digging trenches'],
    explanation: 'A wrench grips nuts and bolts to tighten or loosen them. Plumbers and mechanics use them a lot!',
    funFact: 'The adjustable wrench was invented in 1892 and can fit many different sized bolts!',
    safetyTip: '🤝 Always turn a wrench away from your body for safety!',
    category: 'Construction',
  },
  {
    tool: '📏 Ruler',
    emoji: '📏',
    correctAnswer: 'Measuring lengths and drawing straight lines',
    distractors: ['Hammering small nails', 'Cutting paper', 'Mixing paint'],
    explanation: 'A ruler measures how long or wide things are in inches or centimeters!',
    funFact: 'The longest ruler ever made was 100 feet long! That\'s as long as a blue whale!',
    safetyTip: '📐 Metal rulers can be sharp on the edges - handle with care!',
    category: 'Measurement',
  },
  {
    tool: '✂️ Scissors',
    emoji: '✂️',
    correctAnswer: 'Cutting paper, fabric, and thread',
    distractors: ['Measuring distances', 'Hammering tacks', 'Mixing liquids'],
    explanation: 'Scissors have two sharp blades that slide past each other to cut materials!',
    funFact: 'Scissors were invented in ancient Egypt around 1500 BC! They were made of bronze!',
    safetyTip: '🚶 Never run with scissors! Always walk and carry them pointing down!',
    category: 'Cutting',
  },
  {
    tool: '🪛 Drill',
    emoji: '🔩',
    correctAnswer: 'Making holes in wood or walls',
    distractors: ['Cutting wood lengthwise', 'Painting surfaces', 'Measuring angles'],
    explanation: 'A drill spins a sharp bit very fast to make holes in wood, metal, or walls!',
    funFact: 'The first electric drill was invented in 1889 and weighed 10 pounds!',
    safetyTip: '👷 Always secure what you\'re drilling before you start!',
    category: 'Construction',
  },
  {
    tool: '🪠 Plunger',
    emoji: '🚽',
    correctAnswer: 'Unclogging drains and toilets',
    distractors: ['Hammering down tiles', 'Mixing cement', 'Cutting pipes'],
    explanation: 'A plunger uses suction to push and pull water, which unclogs blocked pipes!',
    funFact: 'Plungers work by creating pressure changes that push blockages through pipes!',
    safetyTip: '🧤 Wear gloves when using a plunger for hygiene!',
    category: 'Plumbing',
  },
  {
    tool: '🪜 Ladder',
    emoji: '🪜',
    correctAnswer: 'Reaching high places safely',
    distractors: ['Measuring heights', 'Cutting tall items', 'Digging deep holes'],
    explanation: 'A ladder has rungs (steps) that let you safely climb up to reach high places!',
    funFact: 'The longest ladder ever used by firefighters was 135 feet tall!',
    safetyTip: '⚖️ Always have someone hold the ladder steady when you climb!',
    category: 'Safety Equipment',
  },
];

// Tool categories for learning
const categories = {
  'Construction': '🏗️ Construction tools help us build and fix things!',
  'Cooking': '👨‍🍳 Cooking tools help us prepare delicious meals!',
  'Gardening': '🌱 Gardening tools help us work with plants and soil!',
  'Art & Decoration': '🎨 Art tools help us create beautiful things!',
  'Measurement': '📐 Measurement tools help us be precise!',
  'Cutting': '✂️ Cutting tools help us shape materials!',
  'Plumbing': '🚰 Plumbing tools help us fix water systems!',
  'Safety Equipment': '🦺 Safety equipment helps us stay safe!',
};

const ToolMatchGame = ({ onGameEnd }) => {
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [animationTrigger, setAnimationTrigger] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  // Start timer when question loads
  useEffect(() => {
    setStartTime(Date.now());
    setSelectedAnswer(null);
    setShowExplanation(false);
  }, [currentQuestionIndex]);

  // Update max streak
  useEffect(() => {
    if (streak > maxStreak) {
      setMaxStreak(streak);
    }
  }, [streak]);

  // Handle player answer
  const handleAnswer = (selectedAnswer) => {
    if (showExplanation) return; // Prevent multiple clicks

    const responseTime = (Date.now() - startTime) / 1000;
    setResponseTimes([...responseTimes, responseTime]);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    setSelectedAnswer(selectedAnswer);
    setIsCorrectAnswer(isCorrect);
    setShowExplanation(true);

    // Calculate points
    let points = 10;
    if (responseTime < 5) points += 5; // Speed bonus
    if (streak >= 3) points += streak * 2; // Streak bonus

    if (isCorrect) {
      setScore(score + points);
      setStreak(streak + 1);
      setCorrectAnswers(correctAnswers + 1);
      setAnimationTrigger('correct');
      setAnsweredQuestions([...answeredQuestions, { ...currentQuestion, correct: true }]);
    } else {
      setLives(lives - 1);
      setStreak(0);
      setAnimationTrigger('wrong');
      setAnsweredQuestions([...answeredQuestions, { ...currentQuestion, correct: false }]);
    }
  };

  // Move to next question or end game
  const goToNextQuestion = () => {
    setAnimationTrigger(null);
    setShowExplanation(false);
    setSelectedAnswer(null);

    if (lives <= 0) {
      endGame();
    } else if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      endGame();
    }
  };

  // End game
  const endGame = () => {
    const totalQuestions = currentQuestionIndex + 1;
    const accuracy = (correctAnswers / totalQuestions) * 100;
    const avgResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length || 0;
    
    const rank = accuracy >= 90 ? '🏆 Tool Master!' : 
                accuracy >= 70 ? '⭐ Handy Helper!' : 
                accuracy >= 50 ? '🔧 Tool Learner!' : '🌱 Beginner Builder!';

    const gameData = {
      score,
      accuracy: accuracy.toFixed(1),
      topic: 'Tool Recognition & Usage',
      questionsAnswered: totalQuestions,
      correctAnswers,
      averageResponseTime: avgResponseTime.toFixed(1),
      maxStreak,
      rank,
    };

    Alert.alert(
      '🎉 Game Complete!',
      `${rank}\n\n📊 Final Score: ${score}\n✅ Correct: ${correctAnswers}/${totalQuestions}\n🎯 Accuracy: ${gameData.accuracy}%\n🔥 Best Streak: ${maxStreak}\n⏱️ Avg Time: ${gameData.averageResponseTime}s\n\n${accuracy >= 70 ? 'Amazing! You know your tools!' : 'Keep learning! Practice makes perfect!'}`,
      [{ text: '🎊 Finish', onPress: () => onGameEnd(gameData) }]
    );
  };

  // Current question and shuffled answers
  const currentQuestion = questions[currentQuestionIndex];
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    // Shuffle answers when question changes
    const shuffled = [currentQuestion.correctAnswer, ...currentQuestion.distractors]
      .sort(() => Math.random() - 0.5);
    setAnswers(shuffled);
  }, [currentQuestionIndex]);

  // Tutorial screen
  if (showTutorial) {
    return (
      <View style={styles.container}>
        <View style={styles.tutorialContainer}>
          <Text style={styles.tutorialTitle}>🔧 Tool Match Game! 🛠️</Text>
          <Text style={styles.tutorialSubtitle}>Learn about tools and how to use them!</Text>
          
          <View style={styles.tutorialSection}>
            <Text style={styles.tutorialHeader}>🎮 How to Play:</Text>
            <Text style={styles.tutorialText}>1️⃣ Read the tool name</Text>
            <Text style={styles.tutorialText}>2️⃣ Pick what it's used for</Text>
            <Text style={styles.tutorialText}>3️⃣ Learn cool facts!</Text>
            <Text style={styles.tutorialText}>4️⃣ Beat your high streak!</Text>
          </View>

          <View style={styles.tutorialSection}>
            <Text style={styles.tutorialHeader}>🎯 Scoring:</Text>
            <Text style={styles.tutorialText}>✓ 10 points per correct answer</Text>
            <Text style={styles.tutorialText}>⚡ +5 bonus for quick answers (&lt;5s)</Text>
            <Text style={styles.tutorialText}>🔥 Streak bonuses for multiple wins!</Text>
            <Text style={styles.tutorialText}>❤️ You have 3 lives - use them wisely!</Text>
          </View>

          <View style={styles.tutorialSection}>
            <Text style={styles.tutorialHeader}>📚 You'll Learn:</Text>
            <Text style={styles.tutorialText}>🔨 What each tool does</Text>
            <Text style={styles.tutorialText}>🎓 Interesting facts</Text>
            <Text style={styles.tutorialText}>🦺 Important safety tips</Text>
          </View>

          <TouchableOpacity 
            style={styles.startButton} 
            onPress={() => setShowTutorial(false)}
          >
            <Text style={styles.startButtonText}>🚀 Let's Play!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Explanation modal
  const ExplanationModal = () => (
    <Modal
      visible={showExplanation}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <Animatable.View 
          animation={isCorrectAnswer ? "bounceIn" : "shake"}
          style={[
            styles.modalContent,
            isCorrectAnswer ? styles.correctModal : styles.wrongModal
          ]}
        >
          <Text style={styles.modalTitle}>
            {isCorrectAnswer ? '✅ Correct!' : '❌ Oops!'}
          </Text>
          
          <View style={styles.modalToolBox}>
            <Text style={styles.modalToolEmoji}>{currentQuestion.emoji}</Text>
            <Text style={styles.modalToolName}>{currentQuestion.tool}</Text>
          </View>

          <Text style={styles.modalExplanation}>{currentQuestion.explanation}</Text>
          
          <View style={styles.modalFactBox}>
            <Text style={styles.modalFactTitle}>💡 Fun Fact:</Text>
            <Text style={styles.modalFactText}>{currentQuestion.funFact}</Text>
          </View>

          <View style={styles.modalSafetyBox}>
            <Text style={styles.modalSafetyText}>{currentQuestion.safetyTip}</Text>
          </View>

          <View style={styles.modalCategoryBox}>
            <Text style={styles.modalCategoryText}>
              {categories[currentQuestion.category]}
            </Text>
          </View>

          {isCorrectAnswer && (
            <Text style={styles.modalPoints}>+{10 + (streak > 3 ? streak * 2 : 0)} points!</Text>
          )}

          <TouchableOpacity 
            style={styles.modalButton}
            onPress={goToNextQuestion}
          >
            <Text style={styles.modalButtonText}>
              {lives <= 0 ? '📊 See Results' : 
               currentQuestionIndex + 1 < questions.length ? '➡️ Next Tool' : '🏁 Finish'}
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ExplanationModal />

      {/* Header */}
      <Animatable.Text
        animation={animationTrigger === 'correct' ? 'pulse' : animationTrigger === 'wrong' ? 'shake' : null}
        style={styles.header}
      >
        🔧 Tool Match 🛠️
      </Animatable.Text>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Streak</Text>
          <Text style={styles.statValue}>🔥 {streak}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Lives</Text>
          <Text style={styles.statValue}>
            {Array(lives).fill('❤️').join(' ')}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Tool Display */}
      <Animatable.View
        animation="zoomIn"
        duration={600}
        style={styles.toolCard}
      >
        <Text style={styles.toolEmoji}>{currentQuestion.emoji}</Text>
        <Text style={styles.toolName}>{currentQuestion.tool}</Text>
        <Text style={styles.question}>What is this tool used for?</Text>
      </Animatable.View>

      {/* Answer Buttons */}
      <View style={styles.answersContainer}>
        {answers.map((answer, index) => (
          <Animatable.View
            key={`${currentQuestionIndex}-${index}`}
            animation="fadeInUp"
            delay={index * 100}
            style={styles.answerButtonWrapper}
          >
            <TouchableOpacity
              style={[
                styles.answerButton,
                selectedAnswer === answer && isCorrectAnswer && styles.correctButton,
                selectedAnswer === answer && !isCorrectAnswer && styles.wrongButton,
              ]}
              onPress={() => handleAnswer(answer)}
              disabled={showExplanation}
              activeOpacity={0.8}
            >
              <Text style={styles.answerButtonText}>{answer}</Text>
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </View>

      {/* Category hint */}
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>
          💭 Hint: Think about {currentQuestion.category.toLowerCase()}
        </Text>
      </View>
    </View>
  );
};

// Compact styles that fit on one screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FE',
    paddingTop: 5,
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  tutorialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tutorialTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0277BD',
    marginBottom: 8,
    textAlign: 'center',
  },
  tutorialSubtitle: {
    fontSize: 16,
    color: '#0288D1',
    marginBottom: 20,
    textAlign: 'center',
  },
  tutorialSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    width: '100%',
  },
  tutorialHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01579B',
    marginBottom: 8,
  },
  tutorialText: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 4,
  },
  startButton: {
    backgroundColor: '#FFCA28',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#01579B',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0277BD',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 8,
    minWidth: 90,
    alignItems: 'center',
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0277BD',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    color: '#01579B',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#B3E5FC',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0288D1',
  },
  toolCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  toolEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  toolName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0277BD',
    marginBottom: 8,
  },
  question: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
  },
  answersContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 10,
  },
  answerButtonWrapper: {
    marginBottom: 10,
  },
  answerButton: {
    backgroundColor: '#FFCA28',
    padding: 14,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  correctButton: {
    backgroundColor: '#66BB6A',
  },
  wrongButton: {
    backgroundColor: '#EF5350',
  },
  answerButtonText: {
    fontSize: 15,
    color: '#01579B',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hintBox: {
    backgroundColor: '#FFF9C4',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#F57F17',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
    elevation: 10,
  },
  correctModal: {
    borderWidth: 3,
    borderColor: '#66BB6A',
  },
  wrongModal: {
    borderWidth: 3,
    borderColor: '#EF5350',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalToolBox: {
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#E1F5FE',
    borderRadius: 12,
  },
  modalToolEmoji: {
    fontSize: 50,
    marginBottom: 5,
  },
  modalToolName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0277BD',
  },
  modalExplanation: {
    fontSize: 16,
    color: '#424242',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  modalFactBox: {
    backgroundColor: '#FFF9C4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  modalFactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 5,
  },
  modalFactText: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 18,
  },
  modalSafetyBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF5350',
  },
  modalSafetyText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '600',
  },
  modalCategoryBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  modalCategoryText: {
    fontSize: 13,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalPoints: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#0288D1',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
});

export default ToolMatchGame;