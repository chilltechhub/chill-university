// src/components/RushTimerBar.js
// Optional, Rush-pace-only urgency bar shown above a question's options.
// Rides on top of each game's EXISTING speed-bonus window (the same
// `speed < Xs` check already feeding game.answer's speedBonus argument),
// so durationMs should just match whatever threshold that game already
// uses for its speed bonus.
//
// `onExpire` fires once when the bar hits 0 while still active — callers
// treat that as a forced miss (same as picking the wrong answer) so
// running out the clock in Rush mode actually costs something instead of
// silently doing nothing. Passing `onExpire` is optional; a caller that
// omits it gets the old purely-visual behavior.
//
// `resetKey` restarts the countdown — pass something that changes every
// new question (the question object itself, or its prompt string).
//
// Ticks down by a fixed step on a fixed interval rather than computing
// from elapsed wall-clock time — a step-based countdown can only ever move
// one notch per tick, so a delayed tick (e.g. a backgrounded/throttled tab)
// can't make it skip straight to 0 the way an elapsed-time calculation
// would on a late tick.

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';

const STEPS = 30; // how many ticks the bar takes to drain, regardless of durationMs

export default function RushTimerBar({ active, durationMs = 4000, resetKey, color, trackColor, onExpire }) {
  const [pct, setPct] = useState(100);
  const intervalRef = useRef(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; }
    expiredRef.current = false;
    if (!active) { setPct(100); return; }

    setPct(100);
    const stepMs = Math.max(16, durationMs / STEPS);
    intervalRef.current = setInterval(() => {
      setPct(prev => {
        const next = prev - 100 / STEPS;
        if (next <= 0) {
          if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; }
          return 0;
        }
        return next;
      });
    }, stepMs);

    return () => {
      if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, resetKey, durationMs]);

  // Fires onExpire as its own effect (not from inside the setPct updater
  // above) — updater functions should stay pure, and calling a
  // caller-supplied side effect from inside one risks double-firing under
  // React's concurrent/strict-mode re-invocation of updaters.
  useEffect(() => {
    if (active && pct <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      if (onExpireRef.current) onExpireRef.current();
    }
  }, [active, pct]);

  if (!active) return null;

  return (
    <View style={[styles.track, trackColor && { backgroundColor: trackColor }]}>
      <View style={[styles.fill, color && { backgroundColor: color }, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // flexDirection:'row' + alignSelf/flexShrink on the fill: Views default to
  // column flex with alignItems:'stretch', which can override a child's
  // explicit percentage width — same class of RN/web flex-stretch gotcha as
  // GameFeed's page-content sizing earlier this session.
  track: { flexDirection: 'row', height: 5, borderRadius: 3, overflow: 'hidden', width: '100%', marginBottom: 10, backgroundColor: '#2d1f4e' },
  fill: { alignSelf: 'flex-start', flexShrink: 0, height: '100%', borderRadius: 3, backgroundColor: '#c9a84c' },
});
