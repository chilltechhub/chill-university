// src/screens/DailyTasksScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useUserProgress } from '../../context/UserProgressContext';
import MissionCard from '../components/MissionCard';

export default function DailyTasksScreen({ onClose }) {
  const {
    dailyMissions,
    weeklyMissions,
    loading,
    refreshDailyMissions,
  } = useUserProgress();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDailyMissions();
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
    setRefreshing(false);
  };

  // Combine daily and soon-to-expire weekly missions as "urgent tasks"
  const urgentTasks = [
    ...(dailyMissions || []),
    ...(weeklyMissions || []).filter(mission => {
      if (!mission.expires_at) return false;
      const hoursRemaining = (new Date(mission.expires_at) - new Date()) / (1000 * 60 * 60);
      return hoursRemaining < 48; // Show weekly missions expiring in < 48 hours
    }),
  ].sort((a, b) => {
    // Sort by completion status first, then by time remaining
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    
    const aExpires = new Date(a.expires_at);
    const bExpires = new Date(b.expires_at);
    return aExpires - bExpires;
  });

  const activeTasks = urgentTasks.filter(t => t.status === 'active');
  const completedTasks = urgentTasks.filter(t => t.status === 'completed');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📝 Today's Tasks</Text>
          <Text style={styles.subtitle}>
            {activeTasks.length} active, {completedTasks.length} completed
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{activeTasks.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>
            {completedTasks.length}
          </Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {urgentTasks.length > 0
              ? `${Math.round((completedTasks.length / urgentTasks.length) * 100)}%`
              : '0%'}
          </Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {urgentTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>
                You have no urgent tasks right now. Great job!
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                <Text style={styles.refreshButtonText}>🔄 Check for new tasks</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Active Tasks */}
              {activeTasks.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🔥 Active Tasks</Text>
                    <Text style={styles.sectionCount}>{activeTasks.length}</Text>
                  </View>
                  {activeTasks.map((task) => (
                    <MissionCard
                      key={task.id}
                      mission={task}
                      onPress={() => {
                        console.log('Task pressed:', task);
                      }}
                    />
                  ))}
                </>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                    <Text style={styles.sectionTitle}>✅ Completed Today</Text>
                    <Text style={styles.sectionCount}>{completedTasks.length}</Text>
                  </View>
                  {completedTasks.map((task) => (
                    <MissionCard
                      key={task.id}
                      mission={task}
                      onPress={() => {
                        console.log('Task pressed:', task);
                      }}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Quick Actions Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => {
            // Navigate to full missions screen
            onClose();
          }}
        >
          <Text style={styles.footerButtonText}>View All Missions →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  footerButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
});