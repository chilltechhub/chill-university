// src/components/GradeSelectCard.js
// Shared "choose your grade band" start screen shown before every game
// begins — replaces LevelSelectCard.js (Beginner/Intermediate/Advanced,
// now unused). Same picker UI/behavior across every game, old and new.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useGameTheme } from './GameShell';
import { GRADE_BANDS } from '../logic/useGradeLevel';
import { useUIPrefs } from '../../context/UIPrefsContext';

export default function GradeSelectCard({
  title,
  emoji = '🎮',
  subjectLabel,
  blurbs = {},
  level,
  onSelectLevel,
  onStart,
  onQuit,
  gameId, // unused here — every caller still passes it through for GameShell/GameOver's facts (see useGameFacts.js); kept so call sites don't need to special-case this one
  showPace = false, // only games wired for Rush pace (see RushTimerBar.js) show this — the rest ignore the extra onStart(pace) arg entirely
}) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const [pace, setPace] = useState('relaxed');

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity style={s.quitBtn} onPress={onQuit || (() => navigation.goBack())}>
          <Ionicons name="close" size={20} color={G.muted} />
        </TouchableOpacity>

        {showEmojis ? <Text style={s.emoji}>{emoji}</Text> : <Ionicons name="game-controller-outline" size={40} color={G.gold} style={{ marginBottom: 6 }} />}
        <Text style={s.title}>{title}</Text>
        {!!subjectLabel && <Text style={s.subject}>{subjectLabel}</Text>}

        <Text style={s.prompt}>Choose your grade band</Text>

        {GRADE_BANDS.map(b => {
          const active = b.key === level;
          return (
            <TouchableOpacity
              key={b.key}
              style={[s.tierCard, active && s.tierCardActive]}
              onPress={() => onSelectLevel(b.key)}
              activeOpacity={0.85}
            >
              {showEmojis ? <Text style={s.tierEmoji}>{b.emoji}</Text> : <Ionicons name={b.icon} size={22} color={active ? G.teal : G.muted} />}
              <View style={{ flex: 1 }}>
                <Text style={[s.tierLabel, active && s.tierLabelActive]}>{b.label}</Text>
                {!!blurbs[b.key] && <Text style={s.tierBlurb}>{blurbs[b.key]}</Text>}
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color={G.teal} />}
            </TouchableOpacity>
          );
        })}

        {showPace && (
          <>
            <Text style={s.prompt}>Pace</Text>
            <View style={s.paceRow}>
              <TouchableOpacity
                style={[s.paceBtn, pace === 'relaxed' && s.paceBtnActive]}
                onPress={() => setPace('relaxed')}
                activeOpacity={0.85}
              >
                {showEmojis ? <Text style={s.paceEmoji}>🌤️</Text> : <Ionicons name="partly-sunny-outline" size={20} color={pace === 'relaxed' ? G.gold : G.muted} style={{ marginBottom: 4 }} />}
                <Text style={[s.paceLabel, pace === 'relaxed' && s.paceLabelActive]}>Relaxed</Text>
                <Text style={s.paceBlurb}>Take your time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.paceBtn, pace === 'rush' && s.paceBtnActive]}
                onPress={() => setPace('rush')}
                activeOpacity={0.85}
              >
                {showEmojis ? <Text style={s.paceEmoji}>⚡</Text> : <Ionicons name="flash-outline" size={20} color={pace === 'rush' ? G.gold : G.muted} style={{ marginBottom: 4 }} />}
                <Text style={[s.paceLabel, pace === 'rush' && s.paceLabelActive]}>Rush</Text>
                <Text style={s.paceBlurb}>Beat the clock</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity style={s.startBtn} onPress={() => onStart(pace)} activeOpacity={0.85}>
          <Text style={s.startBtnText}>Start ▸</Text>
        </TouchableOpacity>

        <Text style={s.hint}>
          Difficulty keeps adjusting while you play — a hot streak levels you up, a couple of misses ease you back down.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (G) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: G.bg },
  scroll:      { padding: 20, paddingBottom: 40, alignItems: 'center' },
  quitBtn:     { alignSelf: 'flex-start', padding: 6, marginBottom: 4 },
  emoji:       { fontSize: 48, marginBottom: 6 },
  title:       { fontSize: 22, fontWeight: '800', color: G.cream, textAlign: 'center' },
  subject:     { fontSize: 12, color: G.muted, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, marginBottom: 20 },
  prompt:      { fontSize: 14, fontWeight: '700', color: G.gold, marginBottom: 12, alignSelf: 'flex-start' },
  tierCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', backgroundColor: G.card, borderWidth: 1.5, borderColor: G.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  tierCardActive: { borderColor: G.teal, backgroundColor: G.tealL },
  tierEmoji:   { fontSize: 26 },
  tierLabel:   { fontSize: 15, fontWeight: '700', color: G.cream },
  tierLabelActive: { color: G.teal },
  tierBlurb:   { fontSize: 12, color: G.muted, marginTop: 2, lineHeight: 16 },
  paceRow:     { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 6 },
  paceBtn:     { flex: 1, alignItems: 'center', backgroundColor: G.card, borderWidth: 1.5, borderColor: G.border, borderRadius: 14, paddingVertical: 12 },
  paceBtnActive: { borderColor: G.gold, backgroundColor: G.goldL },
  paceEmoji:   { fontSize: 22, marginBottom: 4 },
  paceLabel:   { fontSize: 14, fontWeight: '700', color: G.cream },
  paceLabelActive: { color: G.gold },
  paceBlurb:   { fontSize: 10.5, color: G.muted, marginTop: 1 },
  startBtn:    { width: '100%', backgroundColor: G.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 10, marginBottom: 14 },
  startBtnText:{ fontSize: 16, fontWeight: '800', color: G.bg, letterSpacing: 1 },
  hint:        { fontSize: 11, color: G.faint, textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },
});
