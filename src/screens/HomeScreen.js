// components/HomeScreen.js
import React, { useRef, useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import YouScreen from './YouScreen';
import GameMenuGrid from '../components/GameMenuGrid';
import GameFeed from '../components/GameFeed';
import StatsScreen from './StatsScreen';
import { useUserProgress } from '../../context/UserProgressContext';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const TABS = ['You', 'Games', 'Stats'];
export default function HomeScreen({ route }) {
  const horizontalRef = useRef(null);
  const initialTab = route?.params?.startTab ?? 0;
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [showGameFeed, setShowGameFeed] = useState(false);
  const { stats, loadingSync } = useUserProgress();
  const { loadingSync: progressLoading, recordGame } = useUserProgress();
  const [guestReset, setGuestReset] = useState(false);

  useEffect(() => {
    if (!guestReset) {
      horizontalRef.current?.scrollTo({ x: currentTab * screenWidth, animated: false });
      setGuestReset(true);
    }
  }, [guestReset]);

  const scrollToTab = (index) => {
    horizontalRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    setCurrentTab(index);
  };

  const scrollToGameFeed = () => {
    setShowGameFeed(true);
  };

  const scrollToTop = () => {
    setShowGameFeed(false);
  };

  const handleTabScroll = (e) => {
    const xOffset = e.nativeEvent.contentOffset.x;
    const page = Math.round(xOffset / screenWidth);
    setCurrentTab(page);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Sticky Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={scrollToTop}>
          <Text style={styles.name}>Cheto White</Text>
        </TouchableOpacity>

        <View style={styles.tabRow}>
          {TABS.map((tab, index) => (
            <TouchableOpacity key={tab} onPress={() => scrollToTab(index)}>
              <Text style={index === currentTab ? styles.activeTab : styles.inactiveTab}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Content */}
      {!showGameFeed ? (
        <ScrollView
          ref={horizontalRef}
          horizontal
          pagingEnabled
          onScroll={handleTabScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          {/* Page 0: Stats */}
          <View style={styles.page}>
            <YouScreen onPlay={scrollToGameFeed} />
          </View>
          

          {/* Page 1: Game Grid */}
          <View style={styles.page}>
            <GameMenuGrid />
          </View>

          {/* Page 2: You Profile */}
          <View style={styles.page}>
            <StatsScreen />
          </View>
          
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <GameFeed />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    zIndex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  activeTab: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 16,
    marginHorizontal: 12,
  },
  inactiveTab: {
    color: '#888',
    fontSize: 16,
    marginHorizontal: 12,
  },
  page: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: '#fff',
  },
});
