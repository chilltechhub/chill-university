// src/screens/learn/UnitScreen.js
// One unit (docs/shake-up-plan-2026-10-21.md §4.1, P6): its beats (Learn ·
// See it · Practise, or a Ground fix's rate · fix · re-rate), then the
// deliverable, its three-line self-check and Hand it in. Afterwards:
// feedback you got, show it, and on to the next unit.
//
// The unit is an objective (src/data/units.js), so only one runs at a time:
// starting this one sets the other aside. A beat with its own signal ticks
// when you do it wherever it lives; the rest have a Done button here.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useAccess } from '../../../context/AccessContext';
import RichText from '../../components/RichText';
import MapCard from '../../components/MapCard';
import HandInMoment from '../../components/HandInMoment';
import TourSpot from '../../components/TourSpot';
import ShareWorkSheet from '../../components/ShareWorkSheet';
import { UNIT_BY_ID } from '../../data/units';
import { MAPS } from '../../data/maps';
import { PATH_KITS } from '../../data/pathKits';
import { getObjective } from '../../data/objectives';
import useDeliverables from '../../logic/useDeliverables';
import { deliverableForUnit } from '../../api/deliverableService';
import { loadBuilds, onBuildsChange } from '../../api/buildService';
import { buildTitle } from '../../logic/builds';
import { touch, canHandIn, handInMissing, handIn, show, statusLabel, aimForLabel, addFeedback, markChanged } from '../../logic/deliverables';
import { goToScreen } from '../../logic/appRoutes';
import { recordAction } from '../../logic/gamificationService';
import { todayStr } from '../../logic/dateUtils';
import { FAB_CLEARANCE } from '../../../context/FabPositionContext';

const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export default function UnitScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { activeObjective, activeObjectiveId, completedObjectiveIds = [], startObjective, signalAction, completeActiveObjective } = useAccess();
  const { list, save, userId } = useDeliverables();
  const unit = UNIT_BY_ID[route.params?.unitId];
  const [builds, setBuilds] = useState([]);
  const [text, setText] = useState({});
  const [fb, setFb] = useState({ who: '', said: '', change: '' });
  const [moment, setMoment] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  // The next unit opens in place (setParams): start it at the top.
  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo?.({ y: 0, animated: false }); }, [route.params?.unitId]);

  useEffect(() => {
    let alive = true;
    loadBuilds(userId).then(l => { if (alive) setBuilds(l); }).catch(() => {});
    const off = onBuildsChange((uid, l) => { if ((uid || null) === userId) setBuilds(l); });
    return () => { alive = false; off(); };
  }, [userId]);

  const d = useMemo(() => (unit ? deliverableForUnit(list, unit.id) : null), [list, unit]);
  useEffect(() => { if (d) setText(Object.fromEntries(Object.entries(d.content || {}).filter(([, v]) => typeof v === 'string'))); }, [d?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Work handed in before the unit started (the welcome's page is unit 1 of
  // What do I like?) ticks the unit's last step as soon as it runs.
  const handedAlready = d && (d.status === 'handed' || d.status === 'shown');
  const doOpen = activeObjectiveId === unit?.id && activeObjective?.steps?.some(x => x.id === 'do' && !x.done);
  useEffect(() => {
    if (handedAlready && doOpen) signalAction('deliverable-handed-in', { unit: unit.id });
  }, [handedAlready, doOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!unit || !d) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg0, padding: s.lg }}>
        <Text style={{ color: c.text2 }}>This unit isn't here any more.</Text>
      </SafeAreaView>
    );
  }

  const active = activeObjectiveId === unit.id;
  const finished = completedObjectiveIds.includes(unit.id);
  const steps = active ? activeObjective?.steps || [] : [];
  const stepDone = (id) => finished || !!steps.find(x => x.id === id)?.done;
  const other = !active && activeObjectiveId ? getObjective(activeObjectiveId) : null;
  const kit = PATH_KITS[unit.path];
  const def = unit.deliverable;
  const made = def.buildKind ? builds.filter(b => b.kind === def.buildKind) : [];
  const ref = made.find(b => b.id === d.ref) || null;
  const handed = d.status === 'handed' || d.status === 'shown';
  const allBeatsDone = unit.beats.every(b => stepDone(b.id));
  const unitComplete = active && activeObjective?.complete;
  const nextUnit = getObjective(unit.id)?.next ? UNIT_BY_ID[getObjective(unit.id).next] : null;

  const update = (patch) => save(touch(d, patch));
  const setContent = (i, v) => update({ content: { ...d.content, [i]: v } });
  const beatDone = (beat) => signalAction('unit-beat', { beat: `${unit.id}-${beat.id}` });

  const startUnit = async () => {
    setBusy(true);
    try { await startObjective(unit.id); } finally { setBusy(false); }
  };
  const handInNow = async () => {
    const next = handIn(d);
    await save(next);
    signalAction('deliverable-handed-in', { unit: unit.id });
    recordAction('deliverable_handed_in', next.id);
    setMoment(true);
  };
  const showIt = async () => {
    const next = show(d);
    await save(next);
    recordAction('deliverable_shown', next.id);
  };
  const finishUnit = async () => {
    setBusy(true);
    try {
      await completeActiveObjective();
      if (nextUnit) {
        await startObjective(nextUnit.id);
        navigation.setParams({ unitId: nextUnit.id });
      }
    } finally { setBusy(false); }
  };

  const card = { padding: s.lg, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md };
  const button = (label, onPress, icon, { primary = true, disabled = false, a11y } = {}) => (
    <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={a11y || label} accessibilityState={{ disabled }}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, alignSelf: primary ? 'stretch' : 'flex-start',
        paddingHorizontal: s.md, paddingVertical: primary ? 12 : 8, borderRadius: r.lg, marginTop: s.sm,
        backgroundColor: primary ? (disabled ? c.bg2 : accent.primary) : 'transparent', borderWidth: primary ? 0 : 1, borderColor: accent.primary }}>
      {!!icon && <Ionicons name={icon} size={16} color={primary ? (disabled ? c.text3 : accent.onPrimary) : accent.primary} />}
      <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: primary ? (disabled ? c.text3 : accent.onPrimary) : accent.primary }}>{label}</Text>
    </TouchableOpacity>
  );
  const tick = (on, onPress, label) => (
    <TouchableOpacity key={label} onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: !!on }} accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.sm, paddingVertical: 6 }}>
      <Ionicons name={on ? 'checkbox' : 'square-outline'} size={20} color={on ? accent.primary : c.text3} />
      <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg0 }} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: s.lg, paddingBottom: FAB_CLEARANCE }}>
        <TouchableOpacity onPress={() => (navigation.canGoBack() ? navigation.goBack() : goToScreen(navigation, 'PathScreen'))}
          accessibilityRole="button" accessibilityLabel="Back to My path" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: s.sm }}>
          <Ionicons name="chevron-back" size={18} color={accent.primary} />
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.primary }}>My path</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: accent.primary }}>
          {(kit?.label || '').toUpperCase()}{unit.path !== 'ground' ? ` · UNIT ${unit.n}` : ''}
        </Text>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginTop: 2 }} accessibilityRole="header">{unit.label}</Text>
        <Text style={{ fontSize: t.md, color: c.text2, marginTop: 4 }}>{unit.promise}</Text>
        <RichText style={{ fontSize: t.sm, color: c.text3, marginTop: 4, marginBottom: s.md }} boldStyle={{ color: c.text2 }}>{unit.why}</RichText>

        {!active && !finished && (
          <View style={[card, { borderColor: accent.primary, borderWidth: 1 }]}>
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Start this unit</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>{unit.estimate}. One unit at a time{other ? `: this sets aside "${other.label}"` : ''}.</Text>
            {button('Start', startUnit, 'play', { disabled: busy })}
          </View>
        )}
        {finished && (
          <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: s.sm }]}>
            <Ionicons name="checkmark-circle" size={20} color={accent.primary} />
            <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>Unit done. {nextUnit ? <Text style={{ fontWeight: t.bold }}>Next: {nextUnit.label}</Text> : 'This path is done.'}</Text>
          </View>
        )}

        {/* The beats */}
        {unit.beats.map((beat, i) => {
          const done = stepDone(beat.id);
          const map = beat.map ? MAPS[beat.map] : null;
          const body = (
            <View style={card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
                <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={done ? accent.primary : c.text3} />
                <Text style={{ flex: 1, fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{beat.title}</Text>
                <Text style={{ fontSize: 11, color: c.text3 }}>{i + 1} of {unit.beats.length + 1}</Text>
              </View>
              <RichText style={{ fontSize: t.sm, color: c.text2, marginTop: 6 }} boldStyle={{ color: c.text1 }}>{beat.says}</RichText>
              {map && (
                <View style={{ gap: s.sm, marginTop: s.sm }}>
                  {map.cards.map(m => <MapCard key={m.id} card={m} />)}
                </View>
              )}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                {!!beat.link && button(`${beat.link.label} ↗`, () => Linking.openURL(beat.link.url).catch(() => {}), 'open-outline', { primary: false, a11y: `${beat.link.label}, opens a website` })}
                {!!beat.go && button(beat.go.label, () => goToScreen(navigation, beat.go.screen, beat.go.params), 'arrow-forward', { primary: false })}
                {active && !done && !beat.signal && button('Done', () => beatDone(beat), 'checkmark', { primary: false, a11y: `${beat.title}: done` })}
              </View>
              {/* Done before the unit started? Say so: it fires the beat's own signal. */}
              {active && !done && !!beat.signal && (
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: s.sm, marginTop: 6 }}>
                  <Text style={{ fontSize: t.xs, color: c.text3 }}>Ticks itself when you do it.</Text>
                  <TouchableOpacity onPress={() => { const [name, value] = beat.signal.split(':'); signalAction(name, value ? { v: value } : {}); }}
                    accessibilityRole="button" accessibilityLabel={`${beat.title}: I did it already`} hitSlop={6}>
                    <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>I did it already</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
          // The first step's card is where the guided unit points.
          return i === 0 ? <TourSpot key={beat.id} id="unit-beats">{body}</TourSpot> : <View key={beat.id}>{body}</View>;
        })}

        {/* Do it: the deliverable. Its title row is where the guided unit
            says "then hand it in" (unit-handin). */}
        <View style={[card, { borderColor: accent.primary, borderWidth: 1 }]}>
          <TourSpot id="unit-handin">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
            <Ionicons name={handed ? 'checkmark-done-circle' : 'document-text-outline'} size={20} color={accent.primary} />
            <Text style={{ flex: 1, fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Do it: {def.title}</Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: c.bg2 }}>
              <Text style={{ fontSize: 11, fontWeight: t.bold, color: c.text2 }}>{statusLabel(d)}</Text>
            </View>
          </View>
          </TourSpot>

          {!handed && (
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: s.sm }}>
              <Text style={{ fontSize: t.xs, color: c.text3 }}>{aimForLabel(d, todayStr()) || 'When do you want it by?'}</Text>
              {[['This week', 6], ['Next week', 13]].map(([label, n]) => (
                <TouchableOpacity key={label} onPress={() => update({ aimFor: plusDays(n) })} accessibilityRole="button" accessibilityLabel={`Aim for ${label.toLowerCase()}`}
                  style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: c.border }}>
                  <Text style={{ fontSize: 11, fontWeight: t.bold, color: c.text2 }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* The work itself, by kind */}
          {def.kind === 'build' && !handed && (
            <View style={{ marginTop: s.sm }}>
              {made.length ? made.slice(0, 3).map(b => tick(d.ref === b.id, () => update({ ref: d.ref === b.id ? null : b.id }), `Hand in "${buildTitle(b)}"`)) : (
                <Text style={{ fontSize: t.sm, color: c.text3 }}>Make it in the Studio. It takes a minute.</Text>
              )}
              {button(made.length ? 'Open the Studio' : 'Make it', () => goToScreen(navigation, 'StudioScreen', { start: def.buildKind, at: Date.now() }), 'color-wand-outline', { primary: !made.length })}
            </View>
          )}
          {def.kind === 'build' && handed && ref && (
            <Text style={{ fontSize: t.sm, color: c.text2, marginTop: s.sm }}>Handed in: <Text style={{ fontWeight: t.bold }}>{buildTitle(ref)}</Text></Text>
          )}
          {def.kind === 'checklist' && (
            <View style={{ marginTop: s.sm }}>
              {(def.items || []).map((item, i) => tick(d.content?.[i] === true, handed ? undefined : () => setContent(i, !(d.content?.[i] === true)), item))}
            </View>
          )}
          {(def.kind === 'reflection' || def.kind === 'test') && (
            <View style={{ marginTop: s.sm, gap: s.sm }}>
              {(def.prompts || []).map((p, i) => (
                <View key={i}>
                  <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text2, marginBottom: 4 }}>{p}</Text>
                  <TextInput value={text[i] ?? ''} editable={!handed} multiline maxLength={400}
                    onChangeText={(v) => setText(prev => ({ ...prev, [i]: v }))}
                    onBlur={() => { if ((text[i] ?? '') !== (d.content?.[i] ?? '')) setContent(i, text[i] ?? ''); }}
                    accessibilityLabel={p}
                    style={{ minHeight: 44, padding: 10, borderRadius: r.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0, color: c.text1, fontSize: t.sm }} />
                </View>
              ))}
            </View>
          )}

          {/* What good looks like */}
          <Text style={{ fontSize: t.xs, fontWeight: '800', letterSpacing: 0.6, color: c.text3, marginTop: s.md }}>WHAT GOOD LOOKS LIKE</Text>
          {(def.rubric || []).map((line, i) => tick(d.checks?.[i], handed ? undefined : () => update({ checks: (def.rubric || []).map((_, j) => (j === i ? !d.checks?.[j] : !!d.checks?.[j])) }), line))}

          {!handed && (
            <>
              {!active && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm }}>Start the unit to hand it in.</Text>}
              {active && !canHandIn(d, unit) && (
                <Text style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm }}>{handInMissing(d, unit).join(' · ')}</Text>
              )}
              {button('Hand it in', handInNow, 'checkmark-done', { disabled: !active || !canHandIn(d, unit) })}
            </>
          )}
          {handed && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
              {d.status !== 'shown' && button('Show it on my Showcase', showIt, 'star-outline', { primary: false })}
              {/* Take it home, a picture card, ask for feedback, a link (shake-up P8) */}
              {button('Share it', () => setSharing(true), 'share-outline', { primary: false, a11y: 'Share it: take it home, ask for feedback or make a link' })}
            </View>
          )}
        </View>

        {/* Feedback I got (after hand-in) */}
        {handed && (
          <View style={card}>
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Feedback I got</Text>
            <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Showed it to someone? Write what they said. Only you see this.</Text>
            {(d.feedback || []).map((f, i) => (
              <View key={i} style={{ marginTop: s.sm, paddingTop: s.sm, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <Text style={{ fontSize: t.sm, color: c.text1 }}><Text style={{ fontWeight: t.bold }}>{f.who || 'Someone'}:</Text> {f.said}</Text>
                {!!f.change && tick(f.changed, () => save(markChanged(d, i, !f.changed)), `I changed it: ${f.change}`)}
              </View>
            ))}
            {['who', 'said', 'change'].map(k => (
              <TextInput key={k} value={fb[k]} onChangeText={(v) => setFb(prev => ({ ...prev, [k]: v }))} maxLength={k === 'said' ? 400 : 120}
                placeholder={{ who: 'Who (e.g. my aunt)', said: 'What they said', change: "What I'll change (optional)" }[k]} placeholderTextColor={c.text3}
                accessibilityLabel={{ who: 'Who gave the feedback', said: 'What they said', change: 'What you will change' }[k]}
                style={{ marginTop: s.sm, padding: 10, borderRadius: r.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0, color: c.text1, fontSize: t.sm }} />
            ))}
            {button('Add it', async () => { await save(addFeedback(d, fb)); setFb({ who: '', said: '', change: '' }); }, 'add', { primary: false, disabled: !fb.said.trim() && !fb.who.trim() })}
          </View>
        )}

        {unitComplete && !finished && (
          <View style={[card, { borderColor: accent.primary, borderWidth: 1 }]}>
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Every step is done.</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>{nextUnit ? `Next: ${nextUnit.label}.` : 'That is the last unit on this path.'}</Text>
            {button(nextUnit ? 'Finish and start the next unit' : 'Finish the unit', finishUnit, 'flag', { disabled: busy })}
          </View>
        )}
        {active && !allBeatsDone && handed && (
          <Text style={{ fontSize: t.xs, color: c.text3 }}>Tick the beats above to finish the unit.</Text>
        )}
        {!!unit.sources?.length && (
          <Text style={{ fontSize: 11, color: c.text3, marginTop: s.sm }}>Sources: {unit.sources.map(x => x.name).join(', ')} · checked {unit.sources[0].reviewed}</Text>
        )}
      </ScrollView>
      <HandInMoment visible={moment} deliverable={d} onShow={async () => { await showIt(); }} onClose={() => setMoment(false)} />
      <ShareWorkSheet visible={sharing} target={{ kind: 'deliverable', deliverable: d }} onClose={() => setSharing(false)} />
    </SafeAreaView>
  );
}
