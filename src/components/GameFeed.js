// src/components/GameFeed.js
// TikTok-style vertical swipe feed between games. Only the ACTIVE page ever
// mounts a live game component — every other page renders a static
// placeholder. Before this fix, FlatList's windowSize kept 2-3 full game
// components mounted (and ticking timers) at once, which is what caused
// state to bleed between games, background timers to fire GAME_COMPLETED
// events nobody could see, and general jank while scrolling.

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';

import FactorCraftGame from './FactorCraftGame';
import CoinGame from './CoinGame';
import WordDetectiveGame from './WordTypeGame';
import ScienceSortGame from './ScienceSortGame';
import RecipeBuilderGame from './RecipeBuilderGame';
import FoodSortGame from './FoodSortGame';
import ExerciseMatchGame from './ExerciseMatchGame';
import BudgetBalanceGame from './BudgetBalanceGame';
import ToolMatchGame from './ToolMatchGame';
import WorldExplorerGame from './WorldExplorerGame';
import ArtMusicGame from './ArtMusicGame';
import TechLabGame from './TechLabGame';
import LingoMatchGame from './LingoMatchGame';
import MindGymGame from './MindGymGame';
import PeopleSkillsGame from './PeopleSkillsGame';
import CareerCompassGame from './CareerCompassGame';
import MemoryMatchGame from './MemoryMatchGame';
import BuildItGame from './BuildItGame';
import BudgetTrailGame from './BudgetTrailGame';
import CodeBreakerGame from './CodeBreakerGame';
import BugSquashGame from './BugSquashGame';
import SnackCatchGame from './SnackCatchGame';
import ReflexRushGame from './ReflexRushGame';
import SpeedRacerGame from './SpeedRacerGame';
import WordScrambleGame from './WordScrambleGame';
import WildSurvivalGame from './WildSurvivalGame';
import FactBattleGame from './FactBattleGame';
import FreeThrowFrenzyGame from './FreeThrowFrenzyGame';
import { getEnabledGames } from '../services/gameRegistry';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const PAGE_HEIGHT = WINDOW_HEIGHT - (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

// Maps gameRegistry's `component` field to the actual component.
const COMPONENT_MAP = {
  FactorCraftGame,
  CoinGame,
  WordTypeGame: WordDetectiveGame,
  ScienceSortGame,
  RecipeBuilderGame,
  FoodSortGame,
  ExerciseMatchGame,
  BudgetBalanceGame,
  ToolMatchGame,
  WorldExplorerGame,
  ArtMusicGame,
  TechLabGame,
  LingoMatchGame,
  MindGymGame,
  PeopleSkillsGame,
  CareerCompassGame,
  MemoryMatchGame,
  BuildItGame,
  BudgetTrailGame,
  CodeBreakerGame,
  BugSquashGame,
  SnackCatchGame,
  ReflexRushGame,
  SpeedRacerGame,
  WordScrambleGame,
  WildSurvivalGame,
  FactBattleGame,
  FreeThrowFrenzyGame,
};

const GAMES = getEnabledGames().map(g => ({
  id: g.id,
  key: g.id,
  title: g.name,
  icon: g.icon,
  color: g.color,
  component: COMPONENT_MAP[g.component],
}));

// simple shuffle function
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const GameFeed = forwardRef(({ initialIndex = 0, targetGameKey }, ref) => {
  const listRef = useRef(null);
  const [gameList, setGameList] = useState([]);
  const [activeIndex, setActiveIndexState] = useState(0);
  const activeIndexRef = useRef(0);

  const setActiveIndex = (idx) => {
    activeIndexRef.current = idx;
    setActiveIndexState(idx);
  };

  // shuffle and duplicate games for infinite feel
  useEffect(() => {
    const shuffled = shuffleArray(GAMES);
    // repeat list to simulate infinite loop (e.g., 100x)
    const repeated = Array.from({ length: 100 }, () => shuffled).flat();
    setGameList(repeated);
  }, []);

  useImperativeHandle(ref, () => ({
    goToIndex: (index) => {
      if (!listRef.current) return;
      const idx = Math.max(0, Math.min(index, gameList.length - 1));
      setActiveIndex(idx);
      listRef.current.scrollToOffset({ offset: idx * PAGE_HEIGHT, animated: true });
    },
    goToGameId: (idOrKey) => {
      const idx = gameList.findIndex(g => g.id === String(idOrKey) || g.key === idOrKey);
      if (idx >= 0 && listRef.current) {
        setActiveIndex(idx);
        listRef.current.scrollToOffset({ offset: idx * PAGE_HEIGHT, animated: true });
      }
    }
  }), [gameList]);

  // center the list to allow both directions
  useEffect(() => {
    if (!gameList.length || !listRef.current || !targetGameKey) return;

    // wait until your "center to middle" jump finishes
    setTimeout(() => {
      // find ALL matches
      const matches = gameList
        .map((g, i) => (g.key === targetGameKey || g.id === String(targetGameKey)) ? i : -1)
        .filter(i => i !== -1);

      if (!matches.length) return;

      // choose the one closest to the middle (prevents edge-reset issues)
      const middle = Math.floor(gameList.length / 2);
      const bestIndex = matches.reduce((best, current) =>
        Math.abs(current - middle) < Math.abs(best - middle) ? current : best
      );

      setActiveIndex(bestIndex);
      listRef.current.scrollToOffset({
        offset: bestIndex * PAGE_HEIGHT,
        animated: true,
      });
    }, 150);
  }, [gameList, targetGameKey]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = useCallback(({ item, index }) => {
    const isActive = index === activeIndex;
    if (!isActive) {
      // Static placeholder — no game logic, no timers, nothing mounted.
      return (
        <View style={[styles.page, styles.placeholder, { height: PAGE_HEIGHT }]}>
          <Text style={styles.placeholderIcon}>{item.icon}</Text>
          <Text style={[styles.placeholderTitle, item.color && { color: item.color }]}>{item.title}</Text>
        </View>
      );
    }
    const GameComponent = item.component;
    return (
      <View style={[styles.page, { height: PAGE_HEIGHT }]}>
        <GameComponent />
      </View>
    );
  }, [activeIndex]);

  return (
    <FlatList
      ref={listRef}
      data={gameList}
      extraData={activeIndex}
      keyExtractor={(_, index) => index.toString()}
      renderItem={renderItem}
      pagingEnabled
      snapToInterval={PAGE_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      getItemLayout={(_, index) => (
        { length: PAGE_HEIGHT, offset: PAGE_HEIGHT * index, index }
      )}
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={2}
      removeClippedSubviews={Platform.OS !== 'web'}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      onMomentumScrollEnd={(e) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        const index = Math.floor(offsetY / PAGE_HEIGHT);
        // if near end, jump back to middle to maintain illusion
        if (index < 10 || index > gameList.length - 10) {
          const mid = Math.floor(gameList.length / 2);
          setActiveIndex(mid);
          listRef.current.scrollToOffset({
            offset: mid * PAGE_HEIGHT,
            animated: false,
          });
        }
      }}
    />
  );
});

export default GameFeed;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: PAGE_HEIGHT,
    backgroundColor: '#0e1a2e',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 10,
    opacity: 0.5,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7a6a9a',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
