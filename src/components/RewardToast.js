// src/components/RewardToast.js
// The small "you earned something" moment, wherever you are in the app.
//
// Two kinds:
// - Your pet found a coin. The pet keeps wandering and finding coins on every
//   screen (being in the app is what it rewards; src/logic/useCoinRewards.js),
//   but off Training you can't see it happen, only a number ticking up. Your
//   pet, a spinning coin and "+1" drop in under the top bar.
// - Real work counts. Finishing a planner item, a project step, a life-area
//   action, a goal or a check-in earns a little XP (record_action,
//   20260930140000): a check, "+5 XP" and what it was for.
//
// It holds for a couple of seconds and leaves; rewards of the same kind that
// land close together add up ("+2"). Coins aren't shown on Training, where
// the pet is on screen eating them with its own "+1". Never blocks a tap.
// With Reduce Motion on, it fades without the drop, bounce or spin. A screen
// reader hears the first reward of a run.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, StyleSheet, AccessibilityInfo, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { onServerAward } from '../logic/gamificationService';
import { readEquippedPet } from '../logic/useCharacterLoadout';
import PetCompanion from './PetCompanion';

const HOLD_MS = 2600;
const TOP_BAR_CLEARANCE = 58; // sits just under the top bar

export default function RewardToast({ hideCoins }) {
  const { colors: c, typography: t } = useTheme();
  const insets = useSafeAreaInsets();
  const { level, points, rank, streakDays, gameplayStats } = useUserProgress();
  const statsRef = useRef(null);
  statsRef.current = { level, points, rank, streakDays, played: gameplayStats?.totalProblemsAttempted || 0 };

  const [kind, setKind] = useState(null); // 'coin' | 'action' | null (hidden)
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [label, setLabel] = useState(null);
  const [pet, setPet] = useState(null);
  const enter = useRef(new Animated.Value(0)).current; // 0 gone, 1 in place
  const pop = useRef(new Animated.Value(1)).current;   // the "+N" bounce
  const spin = useRef(new Animated.Value(0)).current;  // the coin turning
  const kindRef = useRef(null);
  const hideCoinsRef = useRef(hideCoins);
  hideCoinsRef.current = hideCoins;
  const reduceMotion = useRef(false);
  const holdTimer = useRef(null);
  // Bumped by every reward. A fade-out only clears the toast if it's still
  // the latest one and the fade really finished: Animated also calls the
  // callback when a new reward interrupts the fade, and that used to wipe
  // the reward that had just arrived.
  const generation = useRef(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then(v => { reduceMotion.current = !!v; })
      .catch(() => {});
    return () => clearTimeout(holdTimer.current);
  }, []);

  useEffect(() => onServerAward((pts, xp, source, meta) => {
    let next;
    if (source === 'pet-coin' && pts && !hideCoinsRef.current) next = { kind: 'coin', amount: pts };
    else if (source === 'real-action' && xp) next = { kind: 'action', amount: xp, label: meta?.label || 'Done' };
    if (!next) return;

    const myGen = ++generation.current;
    const fresh = kindRef.current !== next.kind; // nothing showing, or a different kind
    kindRef.current = next.kind;
    setKind(next.kind);
    setTotal(prev => (fresh ? next.amount : prev + next.amount));
    setCount(prev => (fresh ? 1 : prev + 1));
    if (next.label) setLabel(next.label);
    const still = reduceMotion.current;

    // Fresh: drop in from nothing. Otherwise spring back to fully shown,
    // which also stops a fade-out that had started.
    if (fresh) enter.setValue(0);
    Animated.spring(enter, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
    if (fresh) {
      if (next.kind === 'coin') readEquippedPet(statsRef.current).then(setPet).catch(() => setPet(null));
      AccessibilityInfo.announceForAccessibility?.(next.kind === 'coin'
        ? `Your pet found a coin. Plus ${next.amount} point${next.amount === 1 ? '' : 's'}.`
        : `${next.label}. Plus ${next.amount} XP.`);
    }
    if (!still) {
      pop.setValue(1.45);
      Animated.spring(pop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
      if (next.kind === 'coin') {
        spin.setValue(0);
        Animated.timing(spin, { toValue: 2, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
      }
    }

    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      const clear = () => {
        if (generation.current !== myGen) return; // a newer reward owns the toast now
        kindRef.current = null;
        setKind(null);
        setTotal(0);
        setCount(0);
      };
      Animated.timing(enter, { toValue: 0, duration: 240, useNativeDriver: true }).start(({ finished }) => {
        if (finished) clear();
      });
      // And by the clock, in case the animation never gets to finish (the app
      // went to the background mid-fade, say): the toast must still go away.
      holdTimer.current = setTimeout(clear, 320);
    }, HOLD_MS);
  }), [enter, pop, spin]);

  if (!kind) return null;

  const still = reduceMotion.current;
  const isCoin = kind === 'coin';
  const accent = isCoin ? c.gold : c.teal;
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
          backgroundColor: c.bg1, borderRadius: 999, paddingVertical: 6,
          paddingLeft: isCoin && pet ? 6 : 10, paddingRight: 14,
          borderWidth: 1, borderColor: accent,
          shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
        }}
      >
        {isCoin ? (
          <>
            {pet ? <PetCompanion pet={pet} size={28} /> : null}
            <Animated.View style={[st.coin, { transform: [{ scaleX: still ? 1 : coinScaleX }] }]}>
              <Text style={st.coinText}>1¢</Text>
            </Animated.View>
          </>
        ) : (
          <Ionicons name="checkmark-circle" size={22} color={c.teal} />
        )}
        <Animated.Text style={{ fontSize: t.md, fontWeight: '900', color: accent, transform: [{ scale: pop }] }}>
          +{total}{isCoin ? '' : ' XP'}
        </Animated.Text>
        <Text style={{ fontSize: t.xs, fontWeight: '600', color: c.text2 }}>
          {isCoin
            ? (count > 1 ? `Your pet found ${count} coins` : 'Your pet found a coin')
            : (count > 1 ? `${count} things done` : label)}
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
