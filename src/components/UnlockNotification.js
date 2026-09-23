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
import { useUserProgress } from '../../context/UserProgressContext';
import { useTour } from '../../context/TourContext';
import { hasScreenTutorial } from '../logic/screenTutorials';
import { goToScreen } from '../logic/appRoutes';
import { MAX_STAGE } from '../data/experienceStages';
import { getFeature } from '../data/featureCatalog';
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
  const { progressEvents } = useUserProgress();
  const { startScreenTour } = useTour();

  const s = makeStyles(c, t, sp, r);

  // One celebration at a time. Finishing a game can level you up AND open a
  // stage in the same moment; the level-up popup and this one are both
  // native Modals, and two presented together is a known way to leave the
  // app unresponsive on iOS. The level-up shows first, this waits for it.
  if (progressEvents?.length) return null;

  // "Show me" means show me: open the thing, then run its tutorial, even if
  // that screen was visited before it was unlocked. The delay lets the
  // screen mount and its TourSpots measure.
  const openAndTeach = (screen) => {
    goToScreen(navigation, screen);
    if (hasScreenTutorial(screen)) setTimeout(() => startScreenTour(screen), 900);
  };

  // A new stage goes first: it's usually what just happened (every goal
  // finished and every level gained opens one), and it says what's new.
  // Stages open one at a time, so this is normally one thing, not a list.
  const stageEvent = stageEvents?.[0];
  if (stageEvent) {
    const stages = stageEvent.stages || [];
    const latest = stages[stages.length - 1];
    // Somewhere to go: the first tool the newest stage put on the map.
    const target = stages
      .flatMap(st => st.features || [])
      .map(id => getFeature(id))
      .find(f => f?.screen);
    const close = () => dismissStageEvent();
    const show = () => {
      dismissStageEvent();
      if (target) openAndTeach(target.screen);
    };
    return (
      <Modal transparent animationType="fade" visible onRequestClose={close}>
        <View style={s.overlay}>
          <View style={s.card}>
            <View style={s.iconBox}>
              <Ionicons name="sparkles-outline" size={26} color={c.teal} />
            </View>
            <Text style={s.kicker}>New in your app · stage {stageEvent.to} of {MAX_STAGE}</Text>
            <Text style={s.title}>{latest?.label || 'More of the app is open'}</Text>
            {!!latest?.blurb && <Text style={s.blurb}>{latest.blurb}</Text>}
            {stages.length > 1 && (
              <View style={s.list}>
                {stages.slice(0, -1).map(st => (
                  <View key={st.key + st.n} style={s.listRow}>
                    <Ionicons name="checkmark" size={14} color={c.teal} style={{ marginTop: 2 }} />
                    <Text style={s.listText}>Also open: {st.label}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: sp.lg }} />
            <TouchableOpacity style={s.btn} onPress={target ? show : close} activeOpacity={0.85}>
              <Text style={s.btnText}>{target ? `Show me ${target.label}` : 'Got it'}</Text>
            </TouchableOpacity>
            {target && (
              <TouchableOpacity style={s.ghost} onPress={close} activeOpacity={0.7}>
                <Text style={s.ghostText}>Later</Text>
              </TouchableOpacity>
            )}
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
    if (feature.screen) openAndTeach(feature.screen);
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
