// src/screens/classes/entrepreneurClass/LevelScreen.js
// A level's module index — five modules, each opening its own full page.
//
// This used to flatten a level into one long card list. That worked when a
// lesson was a paragraph and a quiz; it stopped working once lessons became
// full written guides, because a 20-lesson level rendered as an unnavigable
// wall. Now the level lists its modules and each module is its own screen
// (ModuleScreen.js).

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { useUIPrefs } from '../../../../context/UIPrefsContext';
import { getLevel, levelDeliverableCount, DISCLAIMER } from '../../../data/ownershipCurriculum';
import { hasModuleContent } from '../../../data/curriculum/moduleContent';
import { FONTS } from '../../../theme';

// level.track -> the header kicker text. Falls back to 'Acquisition Track'
// for any value not listed here, same as before this map existed.
const TRACK_KICKER = {
  startup: 'Startup Track',
  smallbiz: 'Foundations Track',
  foundations: 'Foundations Track',
  acquisition: 'Acquisition Track',
  operations: 'Operations Track',
};

export function makeLevelScreen(levelId) {
  const Screen = function CurriculumLevelScreen() {
    const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
    const { showSubtext } = useUIPrefs();
    const navigation = useNavigation();
    const level = getLevel(levelId);
    const st = makeStyles(c, t, s, r, sh);

    if (!level) return null;
    const deliverables = levelDeliverableCount(level);

    return (
      <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={st.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={level.color} />
          </TouchableOpacity>
          <Text style={[st.kicker, { color: level.color }]}>
            {TRACK_KICKER[level.track] || 'Acquisition Track'}
          </Text>
          <Text style={st.title}>{level.title}</Text>
          {showSubtext && <Text style={st.blurb}>{level.blurb}</Text>}
        </View>

        <View style={[st.outcomeCard, { borderLeftColor: level.color }]}>
          <Text style={st.outcomeLabel}>Finish this level with</Text>
          <Text style={st.outcomeText}>{level.outcome}</Text>
          <Text style={st.statLine}>
            {level.modules.length} modules · {deliverables} Vault deliverables
          </Text>
        </View>

        {level.modules.map((mod, i) => {
          const written = hasModuleContent(levelId, i);
          return (
            <TouchableOpacity
              key={mod.title}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CurriculumModule', { levelId, moduleIndex: i })}
              style={[st.moduleCard, { borderLeftColor: level.color }]}
            >
              <View style={[st.modNum, { backgroundColor: level.color + '22' }]}>
                <Text style={[st.modNumText, { color: level.color }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.modTitle}>{mod.title.replace(/^Module \d+:\s*/, '')}</Text>
                <Text style={st.modObjective} numberOfLines={2}>{mod.objective}</Text>
                <View style={st.modMeta}>
                  <Text style={st.modMetaText}>{mod.lessons.length} lessons</Text>
                  {/* Honest signal about which modules have the long-form
                      guide written and which are structure-only so far. */}
                  {written ? (
                    <View style={[st.badge, { borderColor: level.color }]}>
                      <Text style={[st.badgeText, { color: level.color }]}>FULL GUIDE</Text>
                    </View>
                  ) : (
                    <View style={[st.badge, { borderColor: c.border }]}>
                      <Text style={[st.badgeText, { color: c.text4 }]}>OUTLINE</Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={17} color={c.text4} />
            </TouchableOpacity>
          );
        })}

        <Text style={st.disclaimer}>{DISCLAIMER}</Text>
      </ScrollView>
    );
  };
  Screen.displayName = `Level_${levelId}`;
  return Screen;
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0 },
  header: { paddingHorizontal: s.lg, paddingTop: s.lg, paddingBottom: s.sm },
  kicker: {
    fontSize: 10, fontFamily: FONTS.mono, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6,
  },
  title: { fontSize: 23, fontFamily: FONTS.display, fontWeight: '800', color: c.text1, lineHeight: 29 },
  blurb: { fontSize: 13, color: c.text3, lineHeight: 19, marginTop: 6 },

  outcomeCard: {
    marginHorizontal: s.lg, marginBottom: s.md, padding: s.md,
    borderRadius: r.lg, backgroundColor: c.bg1,
    borderWidth: 1, borderColor: c.border, borderLeftWidth: 3,
  },
  outcomeLabel: {
    fontSize: 10, fontFamily: FONTS.mono, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1, color: c.text4, marginBottom: 4,
  },
  outcomeText: { fontSize: 14, color: c.text2, lineHeight: 21 },
  statLine: {
    fontSize: 10, fontFamily: FONTS.mono, color: c.text4,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8,
  },

  moduleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: s.lg, marginBottom: s.sm, padding: s.md,
    borderRadius: r.lg, backgroundColor: c.bg1,
    borderWidth: 1, borderColor: c.border, borderLeftWidth: 3,
    ...sh.sm,
  },
  modNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modNumText: { fontSize: 13, fontWeight: '800', fontFamily: FONTS.mono },
  modTitle: { fontSize: 15, fontWeight: '700', color: c.text1, lineHeight: 20 },
  modObjective: { fontSize: 12, color: c.text3, lineHeight: 17, marginTop: 3 },
  modMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  modMetaText: { fontSize: 11, color: c.text4 },
  badge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { fontSize: 8, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 0.5 },

  disclaimer: {
    fontSize: 11, color: c.text4, lineHeight: 16,
    paddingHorizontal: s.lg, marginTop: s.md,
  },
});

export default makeLevelScreen;
