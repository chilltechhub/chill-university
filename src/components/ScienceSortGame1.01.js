import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const GAME_TOPICS = [
  {
    id: 'animals',
    title: 'Animal Classification',
    emoji: '🐾',
    categories: [
      { id: 'mammals', name: 'Mammals', color: '#FED7AA' },
      { id: 'reptiles', name: 'Reptiles', color: '#BBF7D0' }
    ],
    items: [
      { id: 1, text: 'Dog', emoji: '🐕', category: 'mammals', explanation: 'Dogs are mammals - they have fur and feed milk to their babies!' },
      { id: 2, text: 'Snake', emoji: '🐍', category: 'reptiles', explanation: 'Snakes are reptiles - they have scales and lay eggs!' },
      { id: 3, text: 'Cat', emoji: '🐱', category: 'mammals', explanation: 'Cats are mammals - they are warm-blooded and have fur!' },
      { id: 4, text: 'Turtle', emoji: '🐢', category: 'reptiles', explanation: 'Turtles are reptiles - they have a shell and lay eggs!' },
      { id: 5, text: 'Elephant', emoji: '🐘', category: 'mammals', explanation: 'Elephants are mammals - they are very large and nurse their babies!' },
      { id: 6, text: 'Lizard', emoji: '🦎', category: 'reptiles', explanation: 'Lizards are reptiles - they are cold-blooded with scaly skin!' },
      { id: 7, text: 'Rabbit', emoji: '🐰', category: 'mammals', explanation: 'Rabbits are mammals - they have fur and warm blood!' },
      { id: 8, text: 'Crocodile', emoji: '🐊', category: 'reptiles', explanation: 'Crocodiles are reptiles - they have tough scales and sharp teeth!' }
    ]
  },
  {
    id: 'states-matter',
    title: 'States of Matter',
    emoji: '⚗️',
    categories: [
      { id: 'solids', name: 'Solids', color: '#BFDBFE' },
      { id: 'liquids', name: 'Liquids', color: '#A5F3FC' }
    ],
    items: [
      { id: 1, text: 'Ice Cube', emoji: '🧊', category: 'solids', explanation: 'Ice is solid - it has a fixed shape and stays firm!' },
      { id: 2, text: 'Water', emoji: '💧', category: 'liquids', explanation: 'Water is liquid - it flows and takes the shape of its container!' },
      { id: 3, text: 'Rock', emoji: '🪨', category: 'solids', explanation: 'Rocks are solid - they are hard and keep their shape!' },
      { id: 4, text: 'Juice', emoji: '🧃', category: 'liquids', explanation: 'Juice is liquid - you can pour it and drink it!' },
      { id: 5, text: 'Book', emoji: '📚', category: 'solids', explanation: 'Books are solid - they have a definite shape!' },
      { id: 6, text: 'Milk', emoji: '🥛', category: 'liquids', explanation: 'Milk is liquid - it flows and can be poured!' },
      { id: 7, text: 'Apple', emoji: '🍎', category: 'solids', explanation: 'Apples are solid - they are firm and hold their shape!' },
      { id: 8, text: 'Honey', emoji: '🍯', category: 'liquids', explanation: 'Honey is liquid - it flows slowly and is sticky!' }
    ]
  }
];

const ClassificationSortGame = ({ 
  topicId = 'animals',
  onGameEnd = () => {},
  onNextTopic = () => {},
  userId = null,
  supabaseClient = null 
}) => {
  const [gameState, setGameState] = useState('playing');
  const [currentTopicIndex, setCurrentTopicIndex] = useState(
    GAME_TOPICS.findIndex(t => t.id === topicId) >= 0 
      ? GAME_TOPICS.findIndex(t => t.id === topicId) 
      : 0
  );
  const [topic, setTopic] = useState(GAME_TOPICS[currentTopicIndex]);
  const [items, setItems] = useState([]);
  const [categoryItems, setCategoryItems] = useState({});
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [answeredItems, setAnsweredItems] = useState([]);
  const [startTime] = useState(Date.now());
  const [itemStartTime, setItemStartTime] = useState(Date.now());
  const [responseTimes, setResponseTimes] = useState([]);

  useEffect(() => {
    const shuffled = [...topic.items].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    
    const cats = {};
    topic.categories.forEach(cat => {
      cats[cat.id] = [];
    });
    setCategoryItems(cats);
  }, [topic]);

  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  const handleCategorySelect = (categoryId) => {
    if (!selectedItem) return;

    const responseTime = Date.now() - itemStartTime;
    const isCorrect = selectedItem.category === categoryId;
    
    setFeedback({
      correct: isCorrect,
      item: selectedItem,
      message: selectedItem.explanation
    });

    setResponseTimes([...responseTimes, responseTime]);
    setAnsweredItems([
      ...answeredItems,
      {
        itemId: selectedItem.id,
        correct: isCorrect,
        category: categoryId,
        responseTime
      }
    ]);

    if (isCorrect) {
      const streakBonus = streak * 5;
      setScore(score + 15 + streakBonus);
      setStreak(streak + 1);

      setCategoryItems({
        ...categoryItems,
        [categoryId]: [...categoryItems[categoryId], selectedItem]
      });

      setItems(items.filter(i => i.id !== selectedItem.id));

      setTimeout(() => {
        setFeedback(null);
        setSelectedItem(null);
        if (items.length <= 1) {
          endGame();
        } else {
          setItemStartTime(Date.now());
        }
      }, 2000);
    } else {
      setLives(lives - 1);
      setStreak(0);

      setTimeout(() => {
        setFeedback(null);
        setSelectedItem(null);
        if (lives <= 1) {
          endGame();
        } else {
          setItemStartTime(Date.now());
        }
      }, 2500);
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
      topic: topic.title,
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
          game_type: 'classification_sort',
          topic: topic.id,
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

  const moveToNextTopic = () => {
    const nextIndex = currentTopicIndex + 1;
    
    if (nextIndex < GAME_TOPICS.length) {
      // Move to next topic
      setCurrentTopicIndex(nextIndex);
      const nextTopic = GAME_TOPICS[nextIndex];
      setTopic(nextTopic);
      
      const shuffled = [...nextTopic.items].sort(() => Math.random() - 0.5);
      setItems(shuffled);
      
      const cats = {};
      nextTopic.categories.forEach(cat => {
        cats[cat.id] = [];
      });
      setCategoryItems(cats);

      setGameState('playing');
      setScore(0);
      setLives(3);
      setStreak(0);
      setSelectedItem(null);
      setFeedback(null);
      setAnsweredItems([]);
      setResponseTimes([]);
      setItemStartTime(Date.now());
      
      onNextTopic(nextTopic);
    } else {
      // No more topics, restart from beginning
      setCurrentTopicIndex(0);
      const firstTopic = GAME_TOPICS[0];
      setTopic(firstTopic);
      
      const shuffled = [...firstTopic.items].sort(() => Math.random() - 0.5);
      setItems(shuffled);
      
      const cats = {};
      firstTopic.categories.forEach(cat => {
        cats[cat.id] = [];
      });
      setCategoryItems(cats);

      setGameState('playing');
      setScore(0);
      setLives(3);
      setStreak(0);
      setSelectedItem(null);
      setFeedback(null);
      setAnsweredItems([]);
      setResponseTimes([]);
      setItemStartTime(Date.now());
      
      onNextTopic(firstTopic);
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
            <Text style={styles.finishedEmoji}>🏆</Text>
            <Text style={styles.finishedTitle}>Amazing Work!</Text>
            <Text style={styles.finishedSubtitle}>You sorted {answeredItems.length} items!</Text>

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
                <Text style={styles.statLabel}>Items Sorted:</Text>
                <Text style={styles.statValueBlue}>{answeredItems.length}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Correct:</Text>
                <Text style={styles.statValueGreen}>{correctAnswers}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.restartButton} onPress={moveToNextTopic}>
              <Text style={styles.restartButtonText}>
                {currentTopicIndex + 1 < GAME_TOPICS.length 
                  ? `➡️ Next Topic` 
                  : '🔄 Start Over'}
              </Text>
            </TouchableOpacity>
          </View>
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
              <Text style={styles.emoji}>{topic.emoji}</Text>
              <Text style={styles.title}>{topic.title}</Text>
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
                {topic.items.length - items.length}/{topic.items.length}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            📱 Tap an item, then tap a category to sort it!
          </Text>
        </View>

        <View style={styles.categoriesRow}>
          {topic.categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryBox,
                { backgroundColor: category.color },
                selectedItem && styles.categoryBoxActive
              ]}
              onPress={() => handleCategorySelect(category.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoryTitle}>{category.name}</Text>
              <View style={styles.categoryItemsContainer}>
                {categoryItems[category.id] && categoryItems[category.id].map((item) => (
                  <View key={item.id} style={styles.sortedItem}>
                    <Text style={styles.sortedItemEmoji}>{item.emoji}</Text>
                    <Text style={styles.sortedItemText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.itemsTitle}>Tap to Select, Then Tap a Category</Text>
            <View style={styles.itemsGrid}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    selectedItem && selectedItem.id === item.id && styles.itemCardSelected
                  ]}
                  onPress={() => handleItemSelect(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <Text style={styles.itemText}>{item.text}</Text>
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
              {feedback.correct ? '🎉 Perfect!' : '💭 Try Again!'}
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
    backgroundColor: '#A78BFA',
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
  },
  emoji: {
    fontSize: 24,
  },
  title: {
    fontSize:20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  heart: {
    fontSize: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBox: {
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scoreText: {
    color: '#4338CA',
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
    backgroundColor: '#DDD6FE',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  progressText: {
    color: '#5B21B6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  categoryBox: {
    flex: 1,
    borderRadius: 24,
    padding: 15,
    minHeight: 150,
    borderWidth: 3,
    borderColor: '#9CA3AF',
  },
  categoryBoxActive: {
    borderColor: '#3B82F6',
    borderWidth: 4,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  categoryItemsContainer: {
    gap: 6,
  },
  sortedItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sortedItemEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  sortedItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  itemsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    width: (width - 100) / 4,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemCardSelected: {
    backgroundColor: '#3B82F6',
    borderWidth: 4,
    borderColor: '#1E40AF',
  },
  itemEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  feedbackBox: {
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
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

export default ClassificationSortGame;