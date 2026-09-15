// src/components/FeatureGate.js
// Two ways to apply a gate, so no screen has to reinvent either.
//
//   useFeatureGate()   for lists and grids. Gives you openGate(featureId)
//                      and a <sheet> element to drop at the end of your
//                      render. Tapping a locked tile opens the unlock sheet
//                      instead of navigating — the tap still does something,
//                      which is the difference between a gate and a bug.
//
//   <FeatureGate>      for a whole screen. Renders a locked state in place
//                      of its children. Belt-and-braces: entry points are
//                      already gated, but deep links, the command palette,
//                      a stale back stack and "I was in here before I opted
//                      out of experimental features" all bypass those.
//
// Neither is a security boundary — see the note at the top of
// src/data/featureCatalog.js. Anything that must not happen is enforced in
// SQL and stays enforced whatever this renders.

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import UnlockSheet from './UnlockSheet';
import { unlockHint } from '../logic/featureAccess';
import { FONTS } from '../theme';

/* ─── Hook: gate a list of entry points ───────────────────────────────────── */

export function useFeatureGate() {
  const { accessFor, isOpen } = useAccess();
  const [gatedFeature, setGatedFeature] = useState(null);

  const openGate = useCallback((featureId) => setGatedFeature(featureId), []);
  const closeGate = useCallback(() => setGatedFeature(null), []);

  // The common shape: "navigate there if it's open, otherwise explain."
  // Returns whether it navigated, for callers that want to know.
  const gatedNavigate = useCallback((featureId, navigate) => {
    if (isOpen(featureId)) { navigate(); return true; }
    setGatedFeature(featureId);
    return false;
  }, [isOpen]);

  const sheet = (
    <UnlockSheet
      visible={!!gatedFeature}
      featureId={gatedFeature}
      onClose={closeGate}
    />
  );

  return { accessFor, isOpen, openGate, closeGate, gatedNavigate, gatedFeature, sheet };
}

/* ─── Navigator helper ────────────────────────────────────────────────────── */

/**
 * Wraps a screen component in its gate, for use as a Stack.Screen
 * `component`. Call it at module scope — the returned component has to be a
 * stable reference or the navigator remounts the screen on every render.
 *
 * Gating at the navigator is what catches the routes that never go through a
 * tile: the command palette (src/logic/searchIndex.js lists screens directly),
 * a deep link, a stale back stack, and the case where someone was already
 * inside a screen when they switched experimental features off.
 *
 *   <Stack.Screen name="PortfolioScreen" component={gatedScreen('portfolio', PortfolioScreen)} />
 */
export function gatedScreen(featureId, Component) {
  function Gated(props) {
    return (
      <FeatureGate featureId={featureId}>
        <Component {...props} />
      </FeatureGate>
    );
  }
  Gated.displayName = `Gated(${Component.displayName || Component.name || featureId})`;
  return Gated;
}

/* ─── Component: gate a whole screen ──────────────────────────────────────── */

export default function FeatureGate({ featureId, children, fallback }) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: sp, radius: r } = useTheme();
  const { accessFor } = useAccess();
  const [sheetOpen, setSheetOpen] = useState(false);

  const access = accessFor(featureId);
  if (access.available) return children;
  if (fallback) return fallback;

  const s = makeStyles(c, t, sp, r);
  const feature = access.feature;

  return (
    <View style={s.wrap}>
      <View style={s.card}>
        <View style={s.iconBox}>
          <Ionicons
            name={access.status === 'paid' ? 'star-outline'
              : access.status === 'experimental' ? 'flask-outline'
              : 'lock-closed-outline'}
            size={26}
            color={c.text3}
          />
        </View>
        <Text style={s.title}>{feature?.label || 'Not open yet'}</Text>
        <Text style={s.blurb}>{feature?.blurb}</Text>
        <Text style={s.hint}>{unlockHint(access)}</Text>

        <TouchableOpacity style={s.primaryBtn} onPress={() => setSheetOpen(true)} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>How to open this</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.ghostBtnText}>Back</Text>
        </TouchableOpacity>
      </View>

      <UnlockSheet
        visible={sheetOpen}
        featureId={featureId}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const makeStyles = (c, t, sp, r) => StyleSheet.create({
  wrap:     { flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center', padding: sp.xl },
  card:     { width: '100%', maxWidth: 360, backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, padding: sp.xl, alignItems: 'center' },
  iconBox:  { width: 52, height: 52, borderRadius: r.md, backgroundColor: c.bg2, alignItems: 'center', justifyContent: 'center', marginBottom: sp.md },
  title:    { fontSize: t.lg, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.text1, marginBottom: sp.sm, textAlign: 'center' },
  blurb:    { fontSize: t.sm, color: c.text2, lineHeight: 20, textAlign: 'center', marginBottom: sp.sm },
  hint:     { fontSize: t.xs, color: c.text4, textAlign: 'center', marginBottom: sp.lg },
  primaryBtn:    { alignSelf: 'stretch', backgroundColor: c.teal, borderRadius: r.md, paddingVertical: sp.md, alignItems: 'center' },
  primaryBtnText:{ color: '#fff', fontSize: t.sm, fontWeight: '800' },
  ghostBtn:      { paddingVertical: sp.md },
  ghostBtnText:  { color: c.text3, fontSize: t.sm },
});
