// src/components/GameMenuGrid.js
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

// This list's keys must match the ids/keys used in GameFeed's GAMES array
const gameThumbnails = [
  { id: 'factor', key: 'factor', title: 'Factor Crafter', image: require('../../assets/snack-icon.png') },
  { id: 'coin', key: 'coin', title: 'Coin Game', image: require('../../assets/snack-icon.png') },
  { id: 'word', key: 'word', title: 'Word Detective', image: null },
  { id: 'extra-1', key: 'extra-1', title: 'Extra Game', image: null },
];

export default function GameMenuGrid({ onSelect }) {
  const navigation = useNavigation();

  const handlePress = (item, index) => {
    if (typeof onSelect === 'function') {
      // prefer local scrolling if parent provided onSelect
      onSelect(index);
      return;
    }
    // otherwise, navigate to 'Play' screen and pass index (ensure Play screen exists)
    navigation.navigate('Play', { index });
  };

  return (
    <FlatList
      data={gameThumbnails}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.grid}
      renderItem={({ item, index }) => (
        <TouchableOpacity style={styles.card} onPress={() => handlePress(item, index)}>
          {item.image ? (
            <Image source={item.image} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.title}>{item.title}</Text>
            </View>
          )}
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
    backgroundColor: '#eee',
    width: screenWidth / 2.3,
    height: 120,
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
});
