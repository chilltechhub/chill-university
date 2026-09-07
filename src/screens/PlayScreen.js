// src/screens/PlayScreen.js
import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import GameFeed from '../components/GameFeed';
import { useRoute } from '@react-navigation/native';

export default function PlayScreen() {
  const route = useRoute();
  const { index, gameId } = route.params || {};

  // Every "Start" everywhere (Training grid, skill cards, Classes
  // recommendations, HomeScreen's game picker) passes a specific gameId;
  // the two generic "just start playing something" PLAY buttons pass a
  // numeric index instead. GameFeed opens scrolled to whichever one this
  // is and lets you swipe up/down to the next from there — see
  // GameFeed.js for why this used to bypass the feed entirely instead.
  const initialGame = gameId != null ? gameId : (typeof index === 'number' ? index : 0);

  return (
    <View style={styles.container}>
      <GameFeed initialGame={initialGame} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#000', // games might want full-bleed backgrounds; make it neutral
  },
});
