// src/components/GameFeed.js
// Vertical swipe feed between games — every entry point into Play (every
// "Start" on a game card, the Home/Games PLAY buttons) opens here, scrolled
// to whichever game it asked for, and can swipe up/down to the next one
// from there. Only the ACTIVE page ever mounts a live game component —
// every other page renders a static placeholder icon+title. Before an
// earlier fix, FlatList's windowSize kept 2-3 full game components mounted
// (and ticking timers) at once, which is what caused state to bleed
// between games, background timers to fire GAME_COMPLETED events nobody
// could see, and general jank while scrolling.
//
// This used to be FlatList over a ~2800-item shuffled "infinite feed" (the
// repeated-and-shuffled list was there so scrolling never visibly hit an
// end). Jumping that list to an arbitrary index — via scrollToOffset OR
// FlatList's own initialScrollIndex, at any non-zero index, not just a
// deep one — reliably landed the viewport off any item's real boundary on
// React Native Web, showing a black screen instead of the game. The fix
// that shipped for that made opening a *specific* game skip this feed
// entirely and render the game directly — reliable, but it meant "Start"
// on a game card no longer let you swipe to the next game at all.
//
// This version fixes the actual problem instead of routing around it: a
// plain ScrollView (not a virtualized FlatList) over the real, finite game
// list (~28 items, not thousands) — small enough that mounting every
// item's cell costs nothing (only the active one ever mounts a live game;
// the rest are a lightweight icon+text placeholder), so there's no
// virtualization math — no getItemLayout, no windowSize, no
// initialScrollIndex — left to get out of alignment with what's actually
// on screen. Scrolling to a specific game on open is one `scrollTo` call
// using the container's real measured height (see the pageHeight note
// below), the same "measure it for real, don't assume" fix that already
// made this feed's page sizing reliable. The trade-off: swiping past the
// last game stops there instead of looping back around to the first —
// worth it for "the scroll actually works," which it now does from every
// entry point, not just the two that used to open at index 0.
//
// Page sizing: `Dimensions.get('window').height` is the FULL window, but
// this feed only ever renders below whatever header sits above it (the
// points bar, the tab header, etc.) — its real available height is
// smaller. Measuring the container for real via onLayout, instead of using
// the full-window figure for every page's height/snapToInterval, is what
// makes the maths line up with what's actually on screen. Measured once
// and never again — a second measurement mid-scroll would shift every
// page's coordinates out from under a scroll position already set against
// the old ones.

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState, useMemo } from 'react';
import {
  ScrollView,
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
import TriviaCatchGame from './TriviaCatchGame';
import SurviveMonthGame from './SurviveMonthGame';
import { getEnabledGames } from '../services/gameRegistry';
import { useConfigValue } from '../../context/RemoteConfigContext';

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
  TriviaCatchGame,
  SurviveMonthGame,
};

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Shuffled once per app load (not on every render/remount — GameFeed's
// instance is reused across "Start" taps, see the notes above) so the
// swipe order isn't just the registry's fixed listing order every time.
// This is the full, code-enabled master list — a remote kill-switch
// ('disabled_games' in app_config, see the component below) filters it
// further, reactively, so the shuffled order underneath never changes
// just because a game got hidden or un-hidden mid-session.
const GAMES_MASTER = shuffle(getEnabledGames()).map(g => ({
  id: g.id,
  key: g.id,
  title: g.name,
  icon: g.icon,
  color: g.color,
  component: COMPONENT_MAP[g.component],
}));

// `initialGame` is either a numeric index or a game id/key — PlayScreen
// passes through whichever route param it got (`index` or `gameId`).
const GameFeed = forwardRef(({ initialGame }, ref) => {
  const scrollRef = useRef(null);

  // Admin-side kill switch — an array of game ids in app_config's
  // 'disabled_games' row (Supabase → Table Editor, no build/redeploy
  // needed). Filtered here, reactively, rather than baked into
  // GAMES_MASTER above, so a game hidden mid-session (config arrives
  // after this module already evaluated) disappears without a relaunch.
  const disabledIds = useConfigValue('disabled_games', []);
  const GAMES = useMemo(
    () => GAMES_MASTER.filter(g => !disabledIds.includes(g.id)),
    [disabledIds]
  );
  const indexForGame = useMemo(() => (indexOrId) => {
    if (typeof indexOrId === 'number') {
      return Math.max(0, Math.min(indexOrId, GAMES.length - 1));
    }
    const idx = GAMES.findIndex(g => g.id === indexOrId || g.key === indexOrId);
    return idx >= 0 ? idx : 0;
  }, [GAMES]);

  const startIndex = useMemo(() => indexForGame(initialGame), [initialGame, indexForGame]);

  // Set exactly once, from the first real onLayout measurement — see the
  // file header for why a second measurement later would undo the fix.
  const [pageHeight, setPageHeight] = useState(null);
  const [activeIndex, setActiveIndexState] = useState(startIndex);
  const activeIndexRef = useRef(startIndex);

  const setActiveIndex = (idx) => {
    activeIndexRef.current = idx;
    setActiveIndexState(idx);
  };

  // Scroll to the requested starting game once the container's real
  // height is known — can't scroll by pixels before that's measured.
  //
  // React Navigation reuses this same GameFeed instance across repeated
  // "Start" taps for DIFFERENT games — navigating to the 'Play' route again
  // with a new gameId updates this component's `initialGame` prop rather
  // than unmounting/remounting it. `startIndex` (above) already recomputes
  // correctly on that prop change, but `activeIndex` state was only ever
  // initialized FROM startIndex once, at first mount, and never re-synced —
  // so the SECOND, THIRD, ... "Start" tap in one session left the feed
  // showing whichever game an earlier swipe had scrolled to, not the one
  // just requested. Track which startIndex we've actually applied and
  // re-run the jump (reset both scroll position AND active index) any time
  // it changes, not just the first time.
  const appliedStartIndexRef = useRef(null);
  useEffect(() => {
    if (pageHeight == null || appliedStartIndexRef.current === startIndex) return;
    appliedStartIndexRef.current = startIndex;
    setActiveIndex(startIndex);
    const target = startIndex * pageHeight;
    const jump = () => scrollRef.current?.scrollTo({ y: target, animated: false });
    // A single requestAnimationFrame call was occasionally landing before
    // the underlying scrollable node was actually ready to accept a jump
    // (observed on React Native Web — the feed opened correctly scrolled
    // to page 0 instead of the requested game, with no error, so it went
    // unnoticed here). These are cheap, idempotent no-ops once the first
    // one lands, so retrying is just a safety net, not extra motion.
    requestAnimationFrame(jump);
    const t1 = setTimeout(jump, 60);
    const t2 = setTimeout(jump, 250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pageHeight, startIndex]);

  useImperativeHandle(ref, () => ({
    goToIndex: (indexOrId) => {
      const idx = indexForGame(indexOrId);
      setActiveIndex(idx);
      if (pageHeight != null) {
        scrollRef.current?.scrollTo({ y: idx * pageHeight, animated: true });
      }
    },
  }), [pageHeight, indexForGame]);

  const onScrollSettle = (e) => {
    if (pageHeight == null) return;
    const idx = Math.round(e.nativeEvent.contentOffset.y / pageHeight);
    const clamped = Math.max(0, Math.min(idx, GAMES.length - 1));
    if (clamped !== activeIndexRef.current) setActiveIndex(clamped);
  };

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => {
        if (pageHeight != null) return; // measured once, never again
        const h = Math.round(e.nativeEvent.layout.height);
        if (h > 0) setPageHeight(h);
      }}
    >
      {pageHeight != null && (
        <ScrollView
          ref={scrollRef}
          pagingEnabled
          snapToInterval={pageHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={onScrollSettle}
          onScrollEndDrag={onScrollSettle}
        >
          {GAMES.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <View key={item.id} style={[styles.page, { height: pageHeight }]}>
                <View style={styles.pageContent}>
                  {isActive ? (
                    <item.component />
                  ) : (
                    // Static placeholder — no game logic, no timers, nothing mounted.
                    <View style={styles.placeholder}>
                      <Text style={styles.placeholderIcon}>{item.icon}</Text>
                      <Text style={[styles.placeholderTitle, item.color && { color: item.color }]}>{item.title}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});

export default GameFeed;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#0e1a2e',
  },
  pageContent: {
    flex: 1,
    width: '100%',
  },
  placeholder: {
    flex: 1,
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
