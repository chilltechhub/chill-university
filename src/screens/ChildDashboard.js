import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../api/supabaseClient';

const ChildDashboard = ({ route }) => {
  const { childId } = route.params;
  const [childData, setChildData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildData();
  }, [childId]);

  const fetchChildData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('children')
        .select(
          `
          id, name, grade, 
          goals_completed, total_goals, 
          missions_completed, total_missions, 
          xp, rank, streak_days
        `
        )
        .eq('id', childId)
        .single();

      if (error) throw error;
      setChildData(data);
    } catch (err) {
      console.error('Error fetching child data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#007bff" />;
  if (!childData) return <Text style={styles.errorText}>Child data not found</Text>;

  const progressPercent = (childData.goals_completed / childData.total_goals) * 100;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{childData.name}'s Dashboard</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Grade:</Text>
        <Text style={styles.value}>{childData.grade}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Goals Progress:</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.subtext}>
          {childData.goals_completed}/{childData.total_goals} goals completed
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Missions:</Text>
        <Text style={styles.value}>
          {childData.missions_completed}/{childData.total_missions}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Experience (XP):</Text>
        <Text style={styles.value}>{childData.xp}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Rank:</Text>
        <Text style={styles.value}>{childData.rank}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Streak:</Text>
        <Text style={styles.value}>{childData.streak_days} days</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9fafc' },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333' },
  value: { fontSize: 16, color: '#555', marginTop: 4 },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e4e4e4',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#28a745',
  },
  subtext: { fontSize: 12, color: '#777', marginTop: 4 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
});

export default ChildDashboard;
