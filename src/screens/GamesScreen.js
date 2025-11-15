// src/screens/GamesScreen.js
import React, { useRef } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import GameMenuGrid from '../components/GameMenuGrid';
import GameFeed from '../components/GameFeed';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function GamesScreen() {
  // If you want menu launches to scroll the feed on the same screen,
  // keep a ref to the feed and pass a handler to the menu.
  // Alternatively you can navigate to a dedicated Play screen (recommended).
  const feedRef = useRef(null);

  // handler for menu -> scroll feed on same screen
  const handleMenuSelect = (indexOrId) => {
    if (!feedRef.current) return;
    if (typeof indexOrId === 'number') feedRef.current.goToIndex(indexOrId);
    else feedRef.current.goToGameId(indexOrId);
  };

  return (
    <View style={styles.container}>
      {/* Top menu: give it a fixed height */}
      <View style={styles.menuWrap}>
        <GameMenuGrid onSelect={handleMenuSelect} />
      </View>

      {/* Feed: fill remaining space and be responsible for paging */}
      <View style={styles.feedWrap}>
        <GameFeed ref={feedRef} initialIndex={0} />
      </View>
    </View>
  );
}

const MENU_HEIGHT = 260; // tweak to match your design

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  menuWrap: {
    height: MENU_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  feedWrap: {
    flex: 1,
  },
});
