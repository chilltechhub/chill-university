import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';

// Comprehensive exercise database with detailed information
const exerciseDatabase = [
  // Chest Exercises
  {
    exercise: 'Push-ups',
    emoji: '💪',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps', 'Core'],
    difficulty: 'Beginner',
    benefits: 'Builds upper body strength and core stability. Great for functional fitness!',
    properForm: 'Keep your back straight, hands shoulder-width apart, lower until chest nearly touches ground.',
    caloriesBurned: 7,
    equipment: 'None - Bodyweight',
  },
  {
    exercise: 'Bench Press',
    emoji: '🏋️',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders', 'Triceps'],
    difficulty: 'Intermediate',
    benefits: 'Builds powerful chest muscles and upper body strength.',
    properForm: 'Lie on bench, feet flat on floor, lower bar to chest, press up explosively.',
    caloriesBurned: 8,
    equipment: 'Barbell',
  },
  {
    exercise: 'Chest Fly',
    emoji: '🦅',
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Shoulders'],
    difficulty: 'Intermediate',
    benefits: 'Stretches and strengthens chest muscles, improves flexibility.',
    properForm: 'Lie on bench, arms out wide, bring dumbbells together above chest.',
    caloriesBurned: 6,
    equipment: 'Dumbbells',
  },

  // Leg Exercises
  {
    exercise: 'Squats',
    emoji: '🦵',
    primaryMuscle: 'Legs',
    secondaryMuscles: ['Glutes', 'Core', 'Back'],
    difficulty: 'Beginner',
    benefits: 'Strengthens legs, glutes, and core. One of the best full-body exercises!',
    properForm: 'Feet shoulder-width apart, lower hips back and down, keep knees behind toes.',
    caloriesBurned: 8,
    equipment: 'None - Bodyweight',
  },
  {
    exercise: 'Lunges',
    emoji: '🚶',
    primaryMuscle: 'Legs',
    secondaryMuscles: ['Glutes', 'Core'],
    difficulty: 'Beginner',
    benefits: 'Builds leg strength, improves balance and coordination.',
    properForm: 'Step forward, lower back knee to ground, front knee at 90 degrees.',
    caloriesBurned: 7,
    equipment: 'None - Bodyweight',
  },
  {
    exercise: 'Leg Press',
    emoji: '🦿',
    primaryMuscle: 'Legs',
    secondaryMuscles: ['Glutes'],
    difficulty: 'Beginner',
    benefits: 'Safely builds leg strength without strain on back.',
    properForm: 'Feet hip-width on platform, push through heels, don\'t lock knees.',
    caloriesBurned: 7,
    equipment: 'Machine',
  },
  {
    exercise: 'Calf Raises',
    emoji: '👠',
    primaryMuscle: 'Legs',
    secondaryMuscles: [],
    difficulty: 'Beginner',
    benefits: 'Strengthens calf muscles, improves ankle stability and jumping power.',
    properForm: 'Stand on toes, lift heels high, lower slowly, keep balance.',
    caloriesBurned: 4,
    equipment: 'None - Bodyweight',
  },
  {
    exercise: 'Deadlift',
    emoji: '🏋️‍♂️',
    primaryMuscle: 'Legs',
    secondaryMuscles: ['Back', 'Glutes', 'Core'],
    difficulty: 'Advanced',
    benefits: 'Ultimate full-body strength builder. Works almost every muscle!',
    properForm: 'Feet hip-width, grip bar, keep back straight, lift with legs not back.',
    caloriesBurned: 10,
    equipment: 'Barbell',
  },

  // Back Exercises
  {
    exercise: 'Pull-ups',
    emoji: '🔝',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps', 'Shoulders', 'Core'],
    difficulty: 'Intermediate',
    benefits: 'Builds back width and strength. Great for overall upper body development!',
    properForm: 'Hang from bar, pull chin over bar, lower with control.',
    caloriesBurned: 8,
    equipment: 'Pull-up Bar',
  },
  {
    exercise: 'Rows',
    emoji: '🚣',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps', 'Shoulders'],
    difficulty: 'Beginner',
    benefits: 'Strengthens middle back, improves posture.',
    properForm: 'Hinge at hips, pull weight to chest, squeeze shoulder blades together.',
    caloriesBurned: 7,
    equipment: 'Dumbbells',
  },
  {
    exercise: 'Lat Pulldown',
    emoji: '⬇️',
    primaryMuscle: 'Back',
    secondaryMuscles: ['Biceps', 'Shoulders'],
    difficulty: 'Beginner',
    benefits: 'Builds back width, easier alternative to pull-ups.',
    properForm: 'Sit upright, pull bar to upper chest, control the weight up.',
    caloriesBurned: 6,
    equipment: 'Machine',
  },

  // Arm Exercises
  {
    exercise: 'Bicep Curls',
    emoji: '💪',
    primaryMuscle: 'Arms',
    secondaryMuscles: ['Forearms'],
    difficulty: 'Beginner',
    benefits: 'Builds arm strength and size. Classic bicep builder!',
    properForm: 'Stand tall, curl weight to shoulder, keep elbows close to body.',
    caloriesBurned: 4,
    equipment: 'Dumbbells',
  },
  {
    exercise: 'Tricep Dips',
    emoji: '🪑',
    primaryMuscle: 'Arms',
    secondaryMuscles: ['Chest', 'Shoulders'],
    difficulty: 'Intermediate',
    benefits: 'Strengthens back of arms, improves pushing power.',
    properForm: 'Hands on bench behind you, lower body, push back up.',
    caloriesBurned: 6,
    equipment: 'Bench',
  },
  {
    exercise: 'Hammer Curls',
    emoji: '🔨',
    primaryMuscle: 'Arms',
    secondaryMuscles: ['Forearms'],
    difficulty: 'Beginner',
    benefits: 'Builds arm thickness and forearm strength.',
    properForm: 'Hold dumbbells vertically, curl up, keep wrists neutral.',
    caloriesBurned: 4,
    equipment: 'Dumbbells',
  },

  // Shoulder Exercises
  {
    exercise: 'Shoulder Press',
    emoji: '🙌',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Triceps', 'Core'],
    difficulty: 'Beginner',
    benefits: 'Builds strong, defined shoulders and improves overhead strength.',
    properForm: 'Press weights overhead, keep core tight, don\'t arch back.',
    caloriesBurned: 6,
    equipment: 'Dumbbells',
  },
  {
    exercise: 'Lateral Raises',
    emoji: '🕊️',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: [],
    difficulty: 'Beginner',
    benefits: 'Creates shoulder width, improves shoulder stability.',
    properForm: 'Raise arms to sides until parallel to ground, controlled movement.',
    caloriesBurned: 4,
    equipment: 'Dumbbells',
  },
  {
    exercise: 'Front Raises',
    emoji: '⬆️',
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Core'],
    difficulty: 'Beginner',
    benefits: 'Strengthens front deltoids, improves shoulder mobility.',
    properForm: 'Raise weights forward to shoulder height, keep arms straight.',
    caloriesBurned: 4,
    equipment: 'Dumbbells',
  },

  // Core Exercises
  {
    exercise: 'Plank',
    emoji: '🪵',
    primaryMuscle: 'Core',
    secondaryMuscles: ['Shoulders', 'Back'],
    difficulty: 'Beginner',
    benefits: 'Strengthens entire core, improves posture and stability!',
    properForm: 'Forearms on ground, body straight line, hold position, don\'t sag.',
    caloriesBurned: 5,
    equipment: 'None - Bodyweight',
  },
  {
    exercise: 'Crunches',
    emoji: '📐',
    primaryMuscle: 'Core',
    secondaryMuscles: [],
    difficulty: 'Beginner',
    benefits: 'Targets abdominal muscles, builds core strength.',
    properForm: 'Lie on back, lift shoulders off ground, exhale as you crunch.',
    caloriesBurned: 4,
    equipment: 'None - Bodyweight',
  },
  {
    exercise: 'Russian Twists',
    emoji: '🌀',
    primaryMuscle: 'Core',
    secondaryMuscles: ['Obliques'],
    difficulty: 'Intermediate',
    benefits: 'Strengthens obliques and rotational core strength.',
    properForm: 'Sit with knees bent, lean back, twist side to side with weight.',
    caloriesBurned: 6,
    equipment: 'Optional Weight',
  },
  {
    exercise: 'Mountain Climbers',
    emoji: '⛰️',
    primaryMuscle: 'Core',
    secondaryMuscles: ['Legs', 'Shoulders'],
    difficulty: 'Intermediate',
    benefits: 'Cardio + core workout! Burns calories while building core strength.',
    properForm: 'Plank position, alternate bringing knees to chest quickly.',
    caloriesBurned: 9,
    equipment: 'None - Bodyweight',
  },

  // Full Body Exercises
  {
    exercise: 'Burpees',
    emoji: '🤸',
    primaryMuscle: 'Full Body',
    secondaryMuscles: ['Cardio', 'Core', 'Legs'],
    difficulty: 'Intermediate',
    benefits: 'Ultimate full-body cardio exercise! Burns maximum calories.',
    properForm: 'Squat, jump back to plank, push-up, jump feet forward, jump up.',
    caloriesBurned: 10,
    equipment: 'None - Bodyweight',
  },
  {
    exercise: 'Jumping Jacks',
    emoji: '🦘',
    primaryMuscle: 'Full Body',
    secondaryMuscles: ['Cardio', 'Legs'],
    difficulty: 'Beginner',
    benefits: 'Great warm-up exercise, improves cardiovascular health.',
    properForm: 'Jump feet apart while raising arms, return to start position.',
    caloriesBurned: 8,
    equipment: 'None - Bodyweight',
  },
  {
    exercise: 'Box Jumps',
    emoji: '📦',
    primaryMuscle: 'Legs',
    secondaryMuscles: ['Core', 'Cardio'],
    difficulty: 'Intermediate',
    benefits: 'Builds explosive leg power and improves jumping ability.',
    properForm: 'Jump onto box with both feet, land softly, step down carefully.',
    caloriesBurned: 9,
    equipment: 'Box/Platform',
  },
];

// Fitness tips that rotate
const fitnessTips = [
  "💪 Regular exercise makes your heart stronger and helps you feel great!",
  "🏃 Aim for at least 60 minutes of activity every day!",
  "🧘 Stretching before and after exercise prevents injuries!",
  "💧 Stay hydrated! Drink water before, during, and after exercise.",
  "😴 Your muscles grow and recover while you sleep - get 8-10 hours!",
  "🥗 Exercise works best when combined with healthy eating!",
  "🎯 Start slow and gradually increase intensity to avoid injury.",
  "🔥 Warm up for 5-10 minutes before exercising to prepare muscles!",
  "⏰ Consistency is key - exercise regularly, not just once in a while!",
  "👥 Exercise with friends or family - it's more fun together!",
];

// Muscle group information
const muscleGroupInfo = {
  'Chest': {
    emoji: '🫀',
    description: 'The pectoral muscles in your chest help with pushing movements.',
    importance: 'Strong chest muscles improve posture and upper body strength.',
  },
  'Legs': {
    emoji: '🦵',
    description: 'Your leg muscles (quads, hamstrings, calves) are the largest in your body!',
    importance: 'Strong legs help you run, jump, and do daily activities with ease.',
  },
  'Back': {
    emoji: '🔙',
    description: 'Back muscles help with pulling movements and support your spine.',
    importance: 'A strong back improves posture and prevents back pain.',
  },
  'Arms': {
    emoji: '💪',
    description: 'Your arm muscles include biceps (front) and triceps (back).',
    importance: 'Strong arms help with lifting, carrying, and pushing objects.',
  },
  'Shoulders': {
    emoji: '🙌',
    description: 'Shoulder muscles (deltoids) allow you to lift your arms in all directions.',
    importance: 'Strong shoulders improve mobility and prevent injury.',
  },
  'Core': {
    emoji: '🎯',
    description: 'Your core includes abs and back muscles that stabilize your body.',
    importance: 'A strong core improves balance, posture, and protects your spine.',
  },
  'Full Body': {
    emoji: '🤸',
    description: 'Full body exercises work multiple muscle groups at once!',
    importance: 'These exercises burn the most calories and improve overall fitness.',
  },
};

// Feedback Display Component
const FeedbackDisplay = ({ show, correct, exerciseItem, onNext }) => {
  const fadeAnim = new Animated.Value(0);
  const muscleInfo = muscleGroupInfo[exerciseItem.primaryMuscle];

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
      <ScrollView style={styles.feedbackScrollView}>
        <View style={[
          styles.feedbackCard,
          correct ? styles.correctCard : styles.incorrectCard
        ]}>
          <Text style={styles.feedbackEmoji}>
            {correct ? '✅' : '❌'}
          </Text>
          <Text style={styles.feedbackTitle}>
            {correct ? 'Perfect!' : 'Keep Learning!'}
          </Text>
          
          {/* Exercise Info */}
          <View style={styles.exerciseInfoCard}>
            <Text style={styles.exerciseEmoji}>{exerciseItem.emoji}</Text>
            <Text style={styles.exerciseName}>{exerciseItem.exercise}</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{exerciseItem.difficulty}</Text>
            </View>
            <Text style={styles.primaryMuscle}>
              Primary: <Text style={styles.boldText}>{exerciseItem.primaryMuscle}</Text>
            </Text>
            {exerciseItem.secondaryMuscles.length > 0 && (
              <Text style={styles.secondaryMuscles}>
                Also works: {exerciseItem.secondaryMuscles.join(', ')}
              </Text>
            )}
          </View>

          {/* Muscle Group Info */}
          <View style={styles.muscleGroupCard}>
            <Text style={styles.muscleGroupTitle}>
              {muscleInfo.emoji} About {exerciseItem.primaryMuscle} Muscles
            </Text>
            <Text style={styles.muscleGroupDescription}>{muscleInfo.description}</Text>
            <Text style={styles.muscleGroupImportance}>
              Why it matters: {muscleInfo.importance}
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitCard}>
            <Text style={styles.benefitTitle}>💪 Benefits:</Text>
            <Text style={styles.benefitText}>{exerciseItem.benefits}</Text>
          </View>

          {/* Proper Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>✅ Proper Form:</Text>
            <Text style={styles.formText}>{exerciseItem.properForm}</Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Calories/min</Text>
              <Text style={styles.statValue}>{exerciseItem.caloriesBurned}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Equipment</Text>
              <Text style={styles.statValue}>{exerciseItem.equipment}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextButtonText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// Progress Bar Component
const ProgressBar = ({ current, total }) => {
  const progress = (current / total) * 100;
  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>Exercise {current + 1} of {total}</Text>
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
          {index < lives ? '💚' : '🖤'}
        </Text>
      ))}
    </View>
  );
};

// Main Game Component
const ExerciseMatchGame = ({ onGameEnd }) => {
  // Shuffle questions for variety
  const [questions] = useState(() => {
    const shuffled = [...exerciseDatabase].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 15); // Use 15 random exercises
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
    fitnessTips[Math.floor(Math.random() * fitnessTips.length)]
  );
  const [answersDisabled, setAnswersDisabled] = useState(false);

  // All possible muscle groups
  const allMuscleGroups = ['Chest', 'Legs', 'Back', 'Arms', 'Shoulders', 'Core', 'Full Body'];

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
    const isCorrect = selectedAnswer === currentQuestion.primaryMuscle;

    setResponseTimes([...responseTimes, responseTime]);
    setLastAnswerCorrect(isCorrect);

    if (isCorrect) {
      // Scoring: base points + streak bonus + speed bonus
      const speedBonus = responseTime < 4 ? 5 : 0;
      const streakBonus = streak * 3;
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
        topic: 'Exercise & Muscle Groups',
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

  // Get answer options for current question
  const getAnswerOptions = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswer = currentQuestion.primaryMuscle;
    
    // Get 3 wrong answers
    const wrongAnswers = allMuscleGroups
      .filter(group => group !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    // Combine and shuffle
    return [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  };

  // Check if game is over
  const gameOver = (lives <= 0) || (currentQuestionIndex >= questions.length);
  
  if (gameOver) {
    const accuracy = (correctAnswers / questions.length) * 100;
    return (
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>🏆 Workout Complete! 🏆</Text>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Fitness Results:</Text>
            <Text style={styles.statLine}>Final Score: <Text style={styles.statValue}>{score}</Text></Text>
            <Text style={styles.statLine}>Accuracy: <Text style={styles.statValue}>{accuracy.toFixed(1)}%</Text></Text>
            <Text style={styles.statLine}>Correct Answers: <Text style={styles.statValue}>{correctAnswers}/{questions.length}</Text></Text>
            <Text style={styles.statLine}>Best Streak: <Text style={styles.statValue}>{bestStreak} 🔥</Text></Text>
            <Text style={styles.statLine}>Avg Response Time: <Text style={styles.statValue}>
              {(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)}s
            </Text></Text>
          </View>

          <View style={styles.learningCard}>
            <Text style={styles.learningTitle}>💪 What You Learned:</Text>
            <Text style={styles.learningText}>
              • Different exercises target specific muscle groups{'\n'}
              • Chest exercises help with pushing movements{'\n'}
              • Leg exercises build your strongest muscles{'\n'}
              • Core exercises improve balance and posture{'\n'}
              • Full body exercises burn the most calories{'\n'}
              • Proper form prevents injuries and maximizes results{'\n'}
              • Regular exercise makes you stronger and healthier!
            </Text>
          </View>

          <View style={styles.motivationCard}>
            <Text style={styles.motivationTitle}>🌟 Keep Moving!</Text>
            <Text style={styles.motivationText}>
              Exercise isn't just about muscles - it helps your heart, brain, and mood too! 
              Try to stay active every day, even if it's just playing outside or dancing to music.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.playAgainButton}
            onPress={() => {
              if (onGameEnd) {
                onGameEnd({
                  score,
                  accuracy: accuracy.toFixed(1),
                  topic: 'Exercise & Muscle Groups',
                  questionsAnswered: questions.length,
                  correctAnswers,
                  restart: true,
                });
              }
            }}
          >
            <Text style={styles.playAgainText}>Train Again! 💪</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answerOptions = getAnswerOptions();

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.header}>💪 Exercise Match Game 🏋️</Text>

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

        {/* Tip */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>{currentTip}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.exerciseEmojiLarge}>{currentQuestion.emoji}</Text>
          <Text style={styles.questionText}>
            Which muscle group does
          </Text>
          <Text style={styles.exerciseNameHighlight}>
            {currentQuestion.exercise}
          </Text>
          <Text style={styles.questionText}>
            primarily work?
          </Text>
        </View>

        {/* Answer Buttons */}
        <View style={styles.answerGrid}>
          {answerOptions.map((option, index) => {
            const muscleInfo = muscleGroupInfo[option];
            return (
              <TouchableOpacity
                key={index}
                style={styles.answerButton}
                onPress={() => handleAnswer(option)}
                disabled={answersDisabled}
              >
                <Text style={styles.answerEmoji}>{muscleInfo.emoji}</Text>
                <Text style={styles.answerText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 Think about which body part moves the most during this exercise!
          </Text>
        </View>

        {/* Feedback Modal */}
        <FeedbackDisplay
          show={showFeedback}
          correct={lastAnswerCorrect}
          exerciseItem={currentQuestion}
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
    backgroundColor: '#FFF3E0',
  },
  container: {
    flex: 1,
    padding: 10,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 12,
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
    color: '#E65100',
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
    backgroundColor: '#FFE0B2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
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
    color: '#1565C0',
    fontWeight: '500',
  },
  questionCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseEmojiLarge: {
    fontSize: 50,
    marginBottom: 10,
  },
  questionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginVertical: 5,
  },
  exerciseNameHighlight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
    marginVertical: 10,
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  answerButton: {
    width: '48%',
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  answerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  answerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFF9C4',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FBC02D',
  },
  infoText: {
    fontSize: 14,
    color: '#F57F17',
    textAlign: 'center',
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  feedbackScrollView: {
    flex: 1,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginVertical: 20,
  },
  correctCard: {
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  incorrectCard: {
    borderWidth: 4,
    borderColor: '#FF9800',
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
  exerciseInfoCard: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  exerciseEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  difficultyBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  primaryMuscle: {
    fontSize: 16,
    color: '#666',
    marginVertical: 5,
  },
  secondaryMuscles: {
    fontSize: 14,
    color: '#999',
    marginTop: 3,
    fontStyle: 'italic',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#E65100',
    fontSize: 18,
  },
  muscleGroupCard: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  muscleGroupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 10,
  },
  muscleGroupDescription: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  muscleGroupImportance: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
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
  formCard: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  formText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
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
    color: '#E65100',
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
  learningCard: {
    backgroundColor: '#FFF3E0',
    padding: 25,
    borderRadius: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  learningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 15,
    textAlign: 'center',
  },
  learningText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  motivationCard: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 15,
    width: '100%',
    marginBottom: 20,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    textAlign: 'center',
  },
  playAgainButton: {
    backgroundColor: '#FF9800',
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

export default ExerciseMatchGame;