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
import { buildScreenTutorial } from '../logic/screenTutorials';
import { GAME_REGISTRY } from '../services/gameRegistry';
import { markScreensSeen } from '../logic/useFirstVisitTutorial';
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
  const { unlockEvents, dismissUnlockEvent, dismissAllUnlockEvents, stageEvents, dismissStageEvent } = useAccess();
  // Everything earned in the same moment goes on ONE card. Claiming a goal
  // used to open a stage popup and then one "Unlocked" popup per feature the
  // goal opened: three taps of "Later" before seeing what to do next.
  const unlockedFeatures = (unlockEvents || []).map(e => e.feature).filter(Boolean);
  const { progressEvents } = useUserProgress();
  const { startLesson, active: tourActiveNow } = useTour();

  const s = makeStyles(c, t, sp, r);

  // One celebration at a time. Finishing a game can level you up AND open a
  // stage in the same moment; the level-up popup and this one are both
  // native Modals, and two presented together is a known way to leave the
  // app unresponsive on iOS. The level-up shows first, this waits for it.
  if (progressEvents?.length) return null;

  // "Show me" means show me: take them to the thing, say what it is in one
  // bubble, then the screen's basics (its first-visit steps, not the whole
  // walkthrough — the user found those too long). The delay lets the
  // screen mount and its TourSpots measure. Home is the exception: what
  // arrives there is widgets, and Home explains each new one itself.
  const openAndTeach = (screen, what) => {
    goToScreen(navigation, screen);
    if (screen === 'Home') return;
    // Marked seen here, since this is the screen's introduction: without it
    // the same basics would run again on the next visit.
    markScreensSeen([screen]);
    const basics = buildScreenTutorial(screen, null, { firstVisit: true })
      .filter(step => step.id || !/No specific walkthrough/.test(step.body));
    const lead = what ? [{ title: `New · ${what.title}`, body: what.body }] : [];
    const steps = [...lead, ...basics];
    if (steps.length) setTimeout(() => startLesson(steps), 900);
  };

  // A new stage goes first: it's usually what just happened (every goal
  // finished and every level gained opens one), and it says what's new.
  // Stages open one at a time, so this is normally one thing, not a list.
  // Same rule as LevelUpNotification: not over a running walkthrough.
  if (tourActiveNow) return null;
  const stageEvent = stageEvents?.[0];
  if (stageEvent) {
    const stages = stageEvent.stages || [];
    const latest = stages[stages.length - 1];
    // Somewhere to go, always: the first tool the newest stage put on the
    // map; else its new games, in Training; else Home, where anything new
    // is a widget and gets explained there.
    const feature = stages
      .flatMap(st => st.features || [])
      .map(id => getFeature(id))
      .find(f => f?.screen);
    const games = stages.flatMap(st => st.games || []).map(id => GAME_REGISTRY[id]?.name).filter(Boolean);
    const target = feature
      ? { screen: feature.screen, label: feature.label, what: { title: feature.label, body: feature.blurb } }
      : games.length
        ? { screen: 'Training', label: 'the new games', what: { title: games.join(', '), body: `New in Training: ${games.join(', ')}. Tap Enter Training, then swipe up or down to find them.` } }
        : { screen: 'Home', label: 'what’s new', what: null };
    const close = () => { dismissStageEvent(); dismissAllUnlockEvents?.(); };
    const show = () => {
      close();
      openAndTeach(target.screen, target.what);
    };
    const alsoOpen = [
      ...stages.slice(0, -1).map(st => ({ key: st.key + st.n, label: st.label })),
      ...unlockedFeatures.map(f => ({ key: 'f-' + f.id, label: f.label })),
    ];
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
            {alsoOpen.length > 0 && (
              <View style={s.list}>
                {alsoOpen.map(item => (
                  <View key={item.key} style={s.listRow}>
                    <Ionicons name="checkmark" size={14} color={c.teal} style={{ marginTop: 2 }} />
                    <Text style={s.listText}>Also open: {item.label}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: sp.lg }} />
            <TouchableOpacity style={s.btn} onPress={show} activeOpacity={0.85}>
              <Text style={s.btnText}>{`Take me to ${target.label}`}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghost} onPress={close} activeOpacity={0.7}>
              <Text style={s.ghostText}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const event = unlockEvents?.[0];
  if (!event?.feature) return null;

  const { feature, via } = event;
  const others = unlockedFeatures.slice(1);
  const done = () => (others.length ? dismissAllUnlockEvents?.() : dismissUnlockEvent());

  const go = () => {
    done();
    if (feature.screen) openAndTeach(feature.screen, { title: feature.label, body: feature.blurb });
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={done}>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.iconBox}>
            <Ionicons name={feature.icon || 'lock-open-outline'} size={26} color={c.teal} />
          </View>
          <Text style={s.kicker}>Unlocked</Text>
          <Text style={s.title}>{feature.label}</Text>
          <Text style={s.blurb}>{feature.blurb}</Text>
          <Text style={s.via}>{VIA_COPY[via] || 'It’s yours now.'}</Text>
          {others.length > 0 && (
            <View style={s.list}>
              {others.map(f => (
                <View key={f.id} style={s.listRow}>
                  <Ionicons name="checkmark" size={14} color={c.teal} style={{ marginTop: 2 }} />
                  <Text style={s.listText}>Also unlocked: {f.label}</Text>
                </View>
              ))}
            </View>
          )}

          {feature.screen ? (
            <TouchableOpacity style={s.btn} onPress={go} activeOpacity={0.85}>
              <Text style={s.btnText}>Take me there</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btn} onPress={done} activeOpacity={0.85}>
              <Text style={s.btnText}>Good</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.ghost} onPress={done} activeOpacity={0.7}>
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
