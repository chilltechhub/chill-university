import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const mockArticles = [
  { id: '1', title: 'Sample Breakthrough Article 1' },
  { id: '2', title: 'Sample Breakthrough Article 2' },
  { id: '3', title: 'Sample Breakthrough Article 3' },
  { id: '4', title: 'Sample Breakthrough Article 4' },
  { id: '5', title: 'Sample Breakthrough Article 5' },
];

export default function BreakthroughsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Breakthroughs</Text>
      <FlatList
        data={mockArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.articleCard}>
            <Text style={styles.articleTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 12,
  },
  list: {
    paddingBottom: 20,
  },
  articleCard: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 16,
    color: '#333',
  },
});
