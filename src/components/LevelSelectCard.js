// src/components/LevelSelectCard.js
// Shared "choose your skill level" start screen shown before every game
// begins. Keeps the picker UI/behavior identical across all 9 games.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { G } from './GameShell';
import { SKILL_LEVELS } from '../logic/useSkillLevel';

export default function LevelSelectCard({
  title,
  emoji = '🎮',
  subjectLabel,
  blurbs = {},
  level,
  onSelectLevel,
  onStart,
  onQuit,
}) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity style={s.quitBtn} onPress={onQuit || (() => navigation.goBack())}>
          <Ionicons name="close" size={20} color={G.muted} />
        </TouchableOpacity>

        <Text style={s.emoji}>{emoji}</Text>
        <Text style={s.title}>{title}</Text>
        {!!subjectLabel && <Text style={s.subject}>{subjectLabel}</Text>}

        <Text style={s.prompt}>Choose your skill level</Text>

        {SKILL_LEVELS.map(l => {
          const active = l.key === level;
          return (
            <TouchableOpacity
              key={l.key}
              style={[s.tierCard, active && s.tierCardActive]}
              onPress={() => onSelectLevel(l.key)}
              activeOpacity={0.85}
            >
              <Text style={s.tierEmoji}>{l.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.tierLabel, active && s.tierLabelActive]}>{l.label}</Text>
                {!!blurbs[l.key] && <Text style={s.tierBlurb}>{blurbs[l.key]}</Text>}
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color={G.teal} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={s.startBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={s.startBtnText}>Start ▸</Text>
        </TouchableOpacity>

        <Text style={s.hint}>
          Difficulty keeps adjusting while you play — a hot streak levels you up, a couple of misses ease you back down.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
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
  startBtn:    { width: '100%', backgroundColor: G.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 10, marginBottom: 14 },
  startBtnText:{ fontSize: 16, fontWeight: '800', color: G.bg, letterSpacing: 1 },
  hint:        { fontSize: 11, color: G.faint, textAlign: 'center', lineHeight: 16, paddingHorizontal: 8 },
});
