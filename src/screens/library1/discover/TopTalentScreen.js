import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../../api/supabaseClient';

export default function TopTalentScreen({ navigation }) {
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    fetchTopUsers();
  }, []);

  const fetchTopUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_id, total_points, learning_level')
      .order('total_points', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching top users:', error);
    } else {
      setTopUsers(data);
    }
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <Text style={styles.rank}>#{index + 1}</Text>
      <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.points}>{item.total_points} pts</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Top Talent</Text>
      <FlatList
        data={topUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  rank: { fontSize: 18, fontWeight: '700', width: 30 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  username: { fontSize: 16, fontWeight: '600' },
  points: { fontSize: 14, color: 'gray' },
});
