// src/screens/MissionsScreen.js
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
import { colors, typography, spacing } from '../theme';

export default function MissionsScreen({ onClose, initialTab = 'daily' }) {
  const {
    dailyMissions,
    weeklyMissions,
    longtermMissions,
    loading,
    refreshDailyMissions,
    refreshWeeklyMissions,
  } = useUserProgress();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      if (activeTab === 'daily') {
        await refreshDailyMissions();
      } else if (activeTab === 'weekly') {
        await refreshWeeklyMissions();
      }
    } catch (error) {
      console.error('Error refreshing missions:', error);
    }
    
    setRefreshing(false);
  };

  const getMissionsForTab = () => {
    switch (activeTab) {
      case 'daily':
        return dailyMissions || [];
      case 'weekly':
        return weeklyMissions || [];
      case 'longterm':
        return longtermMissions || [];
      default:
        return [];
    }
  };

  const missions = getMissionsForTab();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Missions</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'daily' && styles.activeTab]}
          onPress={() => setActiveTab('daily')}
        >
          <Text style={[styles.tabText, activeTab === 'daily' && styles.activeTabText]}>
            Daily
          </Text>
          {dailyMissions && dailyMissions.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{dailyMissions.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>
            Weekly
          </Text>
          {weeklyMissions && weeklyMissions.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{weeklyMissions.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'longterm' && styles.activeTab]}
          onPress={() => setActiveTab('longterm')}
        >
          <Text style={[styles.tabText, activeTab === 'longterm' && styles.activeTabText]}>
            Achievements
          </Text>
          {longtermMissions && longtermMissions.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{longtermMissions.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading missions...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {missions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {activeTab === 'daily' ? '📋' : activeTab === 'weekly' ? '📅' : '🏆'}
              </Text>
              <Text style={styles.emptyTitle}>No missions yet</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'daily'
                  ? 'Daily missions will appear here once generated.'
                  : activeTab === 'weekly'
                  ? 'Keep playing to unlock weekly challenges.'
                  : 'Complete missions to earn achievement badges.'}
              </Text>
            </View>

          ) : (
            <>
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onPress={() => {
                    // Handle mission press (e.g., show details modal)
                    console.log('Mission pressed:', mission);
                  }}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {activeTab === 'daily'
            ? '💡 Daily missions reset at midnight'
            : activeTab === 'weekly'
            ? '💡 Weekly missions reset on Sunday'
            : '💡 Complete missions to earn achievement badges'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 30,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  activeTabText: {
    color: colors.primary,
  },
  tabBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
    color: colors.textMuted,
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
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  refreshButton: {
    backgroundColor: colors.primary,
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
    backgroundColor: colors.surface,
    padding: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});