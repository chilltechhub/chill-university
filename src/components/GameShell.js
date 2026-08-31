// src/components/GameShell.js
// Shared wrapper for ALL games — themed header, score/lives/streak display.
// Usage: wrap your game content in <GameShell>
//
// Every game gets its palette from useGameTheme(), which switches between
// DARK_G and LIGHT_G based on the app's light/dark setting (context/ThemeContext.js)
// — the same setting that drives every non-game screen. The key NAMES
// (G.bg, G.card, G.cream, G.muted, ...) stay identical between palettes;
// only which hex value each name resolves to changes, so every game's
// existing `G.xxx` style references work unchanged in both themes.

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const DARK_G = {
  bg:       '#0e1a2e',
  card:     '#150e28',
  border:   '#2d1f4e',
  gold:     '#c9a84c',
  goldL:    '#2a1f06',
  teal:     '#2bb5a0',
  tealL:    '#0a2825',
  purple:   '#8b4fc4',
  cream:    '#e8dfc8',
  muted:    '#7a6a9a',
  faint:    '#4a3a6a',
  success:  '#3ac860',
  error:    '#e05858',
  warning:  '#e0a830',
  white:    '#ffffff',
};

// Mirrors context/ThemeContext.js's light "Daylight" palette so a game
// dropped into light mode looks like it belongs next to every other screen,
// not like a dark panel bolted on.
const LIGHT_G = {
  bg:       '#eef1f6',
  card:     '#ffffff',
  border:   '#c7cedd',
  gold:     '#9a7228',
  goldL:    '#f5e8c8',
  teal:     '#1a8a7a',
  tealL:    '#e0f4f0',
  purple:   '#6b3fa0',
  cream:    '#161b28',
  muted:    '#7a839c',
  faint:    '#a7b0c6',
  success:  '#2a8a4a',
  error:    '#c43030',
  warning:  '#c97a10',
  white:    '#ffffff',
};

/** The game palette for whichever theme (light/dark) is currently active. */
export function useGameTheme() {
  const { isDark } = useTheme();
  return isDark ? DARK_G : LIGHT_G;
}

// Kept for any stray reference — always resolves to the dark palette, so
// prefer useGameTheme() inside components. Every game component in this
// app calls useGameTheme() instead.
export const G = DARK_G;

// Hearts display
function Hearts({ lives, max = 3 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Text key={i} style={{ fontSize: 16 }}>
          {i < lives ? '❤️' : '🖤'}
        </Text>
      ))}
    </View>
  );
}

export default function GameShell({
  title,
  emoji = '🎮',
  subject,         // e.g. 'Math' 'Science'
  score = 0,
  lives = 3,
  maxLives = 3,
  streak = 0,
  timeLeft = null, // show timer if provided
  progress = null, // 0-1 for progress bar
  children,
  onQuit,
}) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);

  const handleQuit = () => {
    if (onQuit) onQuit();
    else navigation.goBack();
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.quitBtn} onPress={handleQuit}>
          <Ionicons name="close" size={20} color={G.muted} />
        </TouchableOpacity>

        <View style={s.titleArea}>
          <Text style={s.emoji}>{emoji}</Text>
          <View>
            <Text style={s.title} numberOfLines={1}>{title}</Text>
            {subject && <Text style={s.subject}>{subject}</Text>}
          </View>
        </View>

        {timeLeft !== null && (
          <View style={[s.timePill, timeLeft <= 10 && s.timePillUrgent]}>
            <Ionicons name="timer-outline" size={12} color={timeLeft <= 10 ? G.error : G.muted} />
            <Text style={[s.timeText, timeLeft <= 10 && { color: G.error }]}>{timeLeft}s</Text>
          </View>
        )}
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        {/* Score */}
        <View style={s.statItem}>
          <Text style={s.statLabel}>Score</Text>
          <Text style={s.statValue}>{score}</Text>
        </View>

        {/* Lives */}
        <View style={s.statItem}>
          <Text style={s.statLabel}>Lives</Text>
          <Hearts lives={lives} max={maxLives} />
        </View>

        {/* Streak */}
        <View style={s.statItem}>
          <Text style={s.statLabel}>Streak</Text>
          <View style={s.streakRow}>
            <Text style={s.statValue}>{streak}</Text>
            {streak >= 3 && <Text style={{ fontSize: 12, marginLeft: 2 }}>🔥</Text>}
          </View>
        </View>
      </View>

      {/* Progress bar */}
      {progress !== null && (
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
      )}

      {/* Game content */}
      <View style={s.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (G) => StyleSheet.create({
  safe:       { flex: 1, backgroundColor: G.bg },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: G.card, borderBottomWidth: 0.5, borderBottomColor: G.border },
  quitBtn:    { padding: 6, marginRight: 8 },
  titleArea:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji:      { fontSize: 22 },
  title:      { fontSize: 15, fontWeight: '700', color: G.cream },
  subject:    { fontSize: 10, color: G.muted, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.8 },
  timePill:   { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: G.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  timePillUrgent: { backgroundColor: '#3a0808' },
  timeText:   { fontSize: 12, color: G.muted, fontVariant: ['tabular-nums'] },
  statsBar:   { flexDirection: 'row', backgroundColor: G.card, paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: G.border, justifyContent: 'space-between' },
  statItem:   { alignItems: 'center', gap: 3 },
  statLabel:  { fontSize: 9, color: G.faint, textTransform: 'uppercase', letterSpacing: 1 },
  statValue:  { fontSize: 16, fontWeight: '700', color: G.gold },
  streakRow:  { flexDirection: 'row', alignItems: 'center' },
  progressBg: { height: 3, backgroundColor: G.border },
  progressFill:{ height: 3, backgroundColor: G.teal },
  content:    { flex: 1 },
});
