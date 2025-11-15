// src/screens/PlayScreen.js
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import GameFeed from '../components/GameFeed';
import { useRoute } from '@react-navigation/native';

export default function PlayScreen() {
  const route = useRoute();
  const { index, gameId } = route.params || {};
  const feedRef = useRef(null);

  useEffect(() => {
    if (typeof index === 'number' && feedRef.current) {
      feedRef.current.goToIndex(index);
    } else if (gameId && feedRef.current) {
      feedRef.current.goToGameId(gameId);
    }
  }, [index, gameId]);

  // If you have a top nav/header height, apply the same offset logic you used for PAGE_HEIGHT
  return (
    <View style={styles.container}>
      <GameFeed ref={feedRef} initialIndex={typeof index === 'number' ? index : 0} />
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
