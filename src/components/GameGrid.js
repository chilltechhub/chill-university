// components/GameGrid.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const dummyGames = Array.from({ length: 8 }, (_, i) => ({
  id: `game-${i + 1}`,
  title: `Game ${i + 1}`,
}));

export default function GameGrid() {
  return (
    <FlatList
      data={dummyGames}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 10,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ececec',
    width: screenWidth / 2.4,
    height: 120,
    margin: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
