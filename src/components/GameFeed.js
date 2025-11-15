// src/components/GameFeed.js
import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';

import FactorCraftGame from './FactorCraftGame';
import CoinGame from './coingame1';
import WordDetectiveGame from './WordTypeGame';
import ScienceSortGame from './ScienceSortGame';
import RecipeBuilderGame from './RecipeBuilderGame';
import FoodSortGame from './FoodSortGame';
import ExerciseMatchGame from './ExerciseMatchGame';
import BudgetBalanceGame from './BudgetBalanceGame';
import ToolMatchGame from './ToolMatchGame';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const PAGE_HEIGHT = WINDOW_HEIGHT - (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

const GAMES = [
  { id: '1', key: 'factor', title: 'FactorCraft', component: FactorCraftGame },
  { id: '2', key: 'coin', title: 'CoinGame', component: CoinGame },
  { id: '3', key: 'word', title: 'WordDetective', component: WordDetectiveGame },
  { id: '4', key: 'classify', title: 'ScienceSort', component: ScienceSortGame },
  { id: '5', key: 'recipe', title: 'RecipeBuilder', component: RecipeBuilderGame },
  { id: '6', key: 'junk', title: 'FoodSort', component: FoodSortGame },
  { id: '7', key: 'exercise', title: 'ExerciseMatch', component: ExerciseMatchGame },
  { id: '8', key: 'budget', title: 'BudgetBalance', component: BudgetBalanceGame },
  { id: '9', key: 'tools', title: 'ToolMatch', component: ToolMatchGame },
];

// simple shuffle function
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const GameFeed = forwardRef(({ initialIndex = 0 }, ref) => {
  const listRef = useRef(null);
  const [gameList, setGameList] = useState([]);

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
      listRef.current.scrollToOffset({ offset: idx * PAGE_HEIGHT, animated: true });
    },
    goToGameId: (idOrKey) => {
      const idx = gameList.findIndex(g => g.id === String(idOrKey) || g.key === idOrKey);
      if (idx >= 0 && listRef.current) {
        listRef.current.scrollToOffset({ offset: idx * PAGE_HEIGHT, animated: true });
      }
    }
  }), [gameList]);

  // center the list to allow both directions
  useEffect(() => {
    if (gameList.length && listRef.current) {
      setTimeout(() => {
        try {
          listRef.current.scrollToOffset({
            offset: (gameList.length / 2) * PAGE_HEIGHT,
            animated: false,
          });
        } catch (e) {}
      }, 100);
    }
  }, [gameList]);

  const renderItem = ({ item }) => {
    const GameComponent = item.component;
    return (
      <View style={[styles.page, { height: PAGE_HEIGHT }]}>
        <GameComponent />
      </View>
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={gameList}
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
      maxToRenderPerBatch={2}
      windowSize={3}
      onMomentumScrollEnd={(e) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        const index = Math.floor(offsetY / PAGE_HEIGHT);
        // if near end, jump back to middle to maintain illusion
        if (index < 10 || index > gameList.length - 10) {
          listRef.current.scrollToOffset({
            offset: (gameList.length / 2) * PAGE_HEIGHT,
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
    backgroundColor: '#E8F5E9', // or whatever background color your games use
  },
});

