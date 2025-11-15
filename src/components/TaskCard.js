// src/components/TaskCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useUserProgress } from '../../context/UserProgressContext';

export default function TaskCard({ task }) {
  const { completeDailyTask } = useUserProgress();
  const { title, progress, reward } = task;
  const isComplete = progress.current >= progress.total;

  return (
    <View style={[styles.card, isComplete && styles.cardComplete]}>
      <View style={styles.header}>
        <Text style={[styles.title, isComplete && styles.titleComplete]}>
          {title}
        </Text>
        <Text style={styles.reward}>{reward} pts</Text>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(progress.current / progress.total) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress.current}/{progress.total}
        </Text>
      </View>

      {!isComplete ? (
        <TouchableOpacity
          style={styles.button}
          onPress={() => completeDailyTask(title)}
        >
          <Text style={styles.buttonText}>Mark Complete</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.completeLabel}>Completed!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardComplete: {
    backgroundColor: '#e0ffe0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleComplete: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  reward: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4caf50',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#4caf50',
  },
  progressText: {
    fontSize: 12,
    color: '#333',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  completeLabel: {
    marginTop: 10,
    color: '#4caf50',
    fontWeight: '600',
    textAlign: 'center',
  },
});
