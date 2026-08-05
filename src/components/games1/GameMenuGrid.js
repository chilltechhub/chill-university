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

// Must match GameFeed keys
const gameThumbnails = [
  { key: 'factor', title: 'Factor Craft', image: null },
  { key: 'coin', title: 'Coin Game', image: null },
  { key: 'word', title: 'Word Detective', image: null },
  { key: 'classify', title: 'Science Sort', image: null },
  { key: 'recipe', title: 'Recipe Builder', image: null },
  { key: 'junk', title: 'Food Sort', image: null },
  { key: 'exercise', title: 'Exercise Match', image: null },
  { key: 'budget', title: 'Budget Balance', image: null },
  { key: 'tools', title: 'Tool Match', image: null },
];

export default function GameMenuGrid({ onSelectKey }) {
  const navigation = useNavigation();

  const handlePress = (item) => {
    // If parent provided a handler (likely Game screen w/ ref to GameFeed)
    if (typeof onSelectKey === 'function') {
      onSelectKey(item.key);
      return;
    }

    // Fallback: navigate and let Play screen handle routing
    navigation.navigate('Play', { gameId: item.key });
  };

  return (
    <FlatList
      data={gameThumbnails}
      keyExtractor={(item) => item.key}
      numColumns={2}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
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
    paddingBottom: 300,
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
    paddingHorizontal: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
