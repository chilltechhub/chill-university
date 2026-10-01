// src/components/CoinRewardToast.js
// "Your pet found a coin", wherever you are in the app.
//
// The pet keeps wandering and finding coins on every screen (being in the
// app is what it rewards; src/logic/useCoinRewards.js), but on Home or the
// Library you can't see it happen, only a number in the top bar ticking up.
// This makes the moment visible: your pet, a spinning coin and "+1" drop in
// under the top bar, hold for a couple of seconds and leave. Coins that land
// close together add up in the same toast ("+2").
//
// Not shown on Training, where the pet is on screen eating the coin with its
// own "+1". Never blocks a tap. With Reduce Motion on, it fades without the
// drop, bounce or spin. A screen reader hears the first coin of a run.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, AccessibilityInfo, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { onServerAward } from '../logic/gamificationService';
import { readEquippedPet } from '../logic/useCharacterLoadout';
import PetCompanion from './PetCompanion';

const HOLD_MS = 2600;
const TOP_BAR_CLEARANCE = 58; // sits just under the top bar

export default function CoinRewardToast({ hidden }) {
  const { colors: c, typography: t } = useTheme();
  const insets = useSafeAreaInsets();
  const { level, points, rank, streakDays } = useUserProgress();
  const statsRef = useRef(null);
  statsRef.current = { level, points, rank, streakDays };
  const [pet, setPet] = useState(null);

  const [total, setTotal] = useState(0);
  const [shown, setShown] = useState(false);
  const enter = useRef(new Animated.Value(0)).current; // 0 gone, 1 in place
  const pop = useRef(new Animated.Value(1)).current;   // the "+N" bounce
  const spin = useRef(new Animated.Value(0)).current;  // the coin turning
  const shownRef = useRef(false);
  const hiddenRef = useRef(hidden);
  hiddenRef.current = hidden;
  const reduceMotion = useRef(false);
  const holdTimer = useRef(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(v => { reduceMotion.current = !!v; })
      .catch(() => {});
    return () => clearTimeout(holdTimer.current);
  }, []);

  useEffect(() => onServerAward((pts, _xp, source) => {
    if (source !== 'pet-coin' || !pts || hiddenRef.current) return;
    const first = !shownRef.current;
    shownRef.current = true;
    setShown(true);
    setTotal(prev => (first ? pts : prev + pts));
    const still = reduceMotion.current;

    if (first) {
      readEquippedPet(statsRef.current).then(setPet).catch(() => setPet(null));
      enter.setValue(0);
      Animated.spring(enter, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
      AccessibilityInfo.announceForAccessibility?.(`Your pet found a coin. Plus ${pts} point${pts === 1 ? '' : 's'}.`);
    }
    if (!still) {
      pop.setValue(1.45);
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
      spin.setValue(0);
      Animated.timing(spin, { toValue: 2, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
    }

    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      Animated.timing(enter, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => {
        shownRef.current = false;
        setShown(false);
        setTotal(0);
      });
    }, HOLD_MS);
  }), [enter, pop, spin]);

  if (!shown) return null;

  const still = reduceMotion.current;
  const coins = total; // 1 point per coin
  // Two half-turns: full width → edge-on → full width, twice.
  const coinScaleX = spin.interpolate({ inputRange: [0, 0.5, 1, 1.5, 2], outputRange: [1, 0.15, 1, 0.15, 1] });

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 60 }]} pointerEvents="none">
      <Animated.View
        accessible={false}
        style={{
          position: 'absolute', top: insets.top + TOP_BAR_CLEARANCE, right: 12,
          opacity: enter,
          transform: still ? [] : [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
          ],
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: c.bg1, borderRadius: 999, paddingVertical: 6, paddingLeft: pet ? 6 : 12, paddingRight: 14,
          borderWidth: 1, borderColor: c.gold,
          shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
        }}
      >
        {pet ? <PetCompanion pet={pet} size={28} /> : null}
        <Animated.View style={[st.coin, { transform: [{ scaleX: still ? 1 : coinScaleX }] }]}>
          <Text style={st.coinText}>1¢</Text>
        </Animated.View>
        <Animated.Text style={{ fontSize: t.md, fontWeight: '900', color: c.gold, transform: [{ scale: pop }] }}>
          +{total}
        </Animated.Text>
        <Text style={{ fontSize: t.xs, fontWeight: '600', color: c.text2 }}>
          {coins > 1 ? `Your pet found ${coins} coins` : 'Your pet found a coin'}
        </Text>
      </Animated.View>
    </View>
  );
}

// Same coin as the one the pet eats on Training (CharacterWalker.js).
const st = StyleSheet.create({
  coin: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#b0703f', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#e0a878',
  },
  coinText: { fontSize: 11, fontWeight: '900', color: '#fff2e0' },
});
