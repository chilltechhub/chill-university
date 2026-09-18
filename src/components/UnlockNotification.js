// src/components/UnlockNotification.js
// "You just opened X" — mounted once near the app root, next to
// LevelUpNotification, and reading the same kind of queue from
// AccessContext (finishing one objective can open two features, so they
// show one after another rather than merging).
//
// Deliberately quieter than the level-up popup: this is a door opening, not
// a fanfare, and it comes with somewhere to go. The one button takes you
// straight into the thing you just earned, because an unlock you have to go
// hunting for is barely an unlock.

import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { goToScreen } from '../logic/appRoutes';
import { stageMeta } from '../logic/experienceStage';
import { MAX_STAGE } from '../data/experienceStages';
import { FONTS } from '../theme';

const VIA_COPY = {
  test:      'You tested out of it — no objective needed.',
  objective: 'Earned by finishing your objective.',
  plan:      'Included with your plan.',
};

export default function UnlockNotification() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: sp, radius: r } = useTheme();
  const { unlockEvents, dismissUnlockEvent, stageEvents, dismissStageEvent } = useAccess();

  const s = makeStyles(c, t, sp, r);

  // A new experience stage goes first: it's the bigger door, and it's
  // usually what just happened (finishing a first goal opens stage 2).
  const stageEvent = stageEvents?.[0];
  if (stageEvent) {
    const meta = stageMeta(stageEvent.to);
    return (
      <Modal transparent animationType="fade" visible onRequestClose={dismissStageEvent}>
        <View style={s.overlay}>
          <View style={s.card}>
            <View style={s.iconBox}>
              <Ionicons name="sparkles-outline" size={26} color={c.teal} />
            </View>
            <Text style={s.kicker}>Stage {meta.n} of {MAX_STAGE}</Text>
            <Text style={s.title}>More of the app is open</Text>
            <Text style={s.blurb}>{meta.label}. Here’s what you can see now:</Text>
            <View style={s.list}>
              {stageEvent.lines.map(line => (
                <View key={line} style={s.listRow}>
                  <Ionicons name="checkmark" size={14} color={c.teal} style={{ marginTop: 2 }} />
                  <Text style={s.listText}>{line}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.btn} onPress={dismissStageEvent} activeOpacity={0.85}>
              <Text style={s.btnText}>Let’s see</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const event = unlockEvents?.[0];
  if (!event?.feature) return null;

  const { feature, via } = event;

  const go = () => {
    dismissUnlockEvent();
    if (feature.screen) goToScreen(navigation, feature.screen);
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismissUnlockEvent}>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.iconBox}>
            <Ionicons name={feature.icon || 'lock-open-outline'} size={26} color={c.teal} />
          </View>
          <Text style={s.kicker}>Unlocked</Text>
          <Text style={s.title}>{feature.label}</Text>
          <Text style={s.blurb}>{feature.blurb}</Text>
          <Text style={s.via}>{VIA_COPY[via] || 'It’s yours now.'}</Text>

          {feature.screen ? (
            <TouchableOpacity style={s.btn} onPress={go} activeOpacity={0.85}>
              <Text style={s.btnText}>Take a look</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btn} onPress={dismissUnlockEvent} activeOpacity={0.85}>
              <Text style={s.btnText}>Good</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.ghost} onPress={dismissUnlockEvent} activeOpacity={0.7}>
            <Text style={s.ghostText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c, t, sp, r) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: sp.xxl },
  card:    { width: '100%', maxWidth: 340, backgroundColor: c.bg1, borderRadius: r.xl, borderWidth: 1, borderColor: c.teal, padding: sp.xl, alignItems: 'center' },
  iconBox: { width: 54, height: 54, borderRadius: r.lg, backgroundColor: c.tealLight, alignItems: 'center', justifyContent: 'center', marginBottom: sp.md },
  kicker:  { fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '800' },
  title:   { fontSize: t.xl, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.text1, marginTop: 2, marginBottom: sp.sm, textAlign: 'center' },
  blurb:   { fontSize: t.sm, color: c.text2, textAlign: 'center', lineHeight: 20 },
  via:     { fontSize: t.xs, color: c.text4, textAlign: 'center', marginTop: sp.sm, marginBottom: sp.lg, fontStyle: 'italic' },
  list:    { alignSelf: 'stretch', marginTop: sp.md, marginBottom: sp.lg, gap: 6 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listText:{ flex: 1, fontSize: t.sm, color: c.text2, lineHeight: 19 },
  btn:     { alignSelf: 'stretch', backgroundColor: c.teal, borderRadius: r.md, paddingVertical: sp.md, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: t.sm, fontWeight: '800' },
  ghost:   { paddingVertical: sp.md },
  ghostText:{ color: c.text3, fontSize: t.xs },
});
