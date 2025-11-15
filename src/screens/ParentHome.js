import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';
import AddChildByCode from './AddChildByCode';

const ParentHome = () => {
  const navigation = useNavigation();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('children')
        .select('id, name, avatar, grade, goals_completed, total_goals')
        .order('name', { ascending: true });

      if (error) throw error;
      setChildren(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  

  const renderChild = ({ item }) => (
    <TouchableOpacity
      style={styles.childCard}
      onPress={() => navigation.navigate('ChildDashboard', { childId: item.id })}
    >
      <Text style={styles.childName}>{item.name}</Text>
      <Text style={styles.childGrade}>Grade: {item.grade}</Text>
      <Text style={styles.progressText}>
        Goals: {item.goals_completed}/{item.total_goals}
      </Text>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${(item.goals_completed / item.total_goals) * 100}%` },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#007bff" />;
  if (error) return <Text style={styles.errorText}>Error: {error}</Text>;

 return (
  <View style={styles.container}>
    <Text style={styles.title}>Your Children</Text>

    {/* Add Child button */}
    <TouchableOpacity
      style={styles.addChildButton}
      onPress={() => navigation.navigate('AddChildByCode', { parentId: supabase.auth.getUser().id })}
    >
      <Text style={styles.addChildButtonText}>+ Add Child</Text>
    </TouchableOpacity>

    <FlatList
      data={children}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderChild}
      contentContainerStyle={{ paddingBottom: 50 }}
    />
  </View>
);

};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9fafc' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  childName: { fontSize: 20, fontWeight: '600', color: '#333' },
  childGrade: { fontSize: 14, color: '#666', marginBottom: 8 },
  progressText: { fontSize: 14, color: '#007bff' },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e4e4e4',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007bff',
  },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },

  addChildButton: {
  backgroundColor: '#007bff',
  padding: 12,
  borderRadius: 8,
  marginBottom: 15,
  alignItems: 'center',
},
addChildButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },

});

export default ParentHome;
