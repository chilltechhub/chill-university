// src/screens/studio/MissionScreen.js
// One Software for You mission, in four beats on one screen:
//
//   1 Learn      the cards, one at a time ("Next"), so it's never a wall
//   2 See it     the app does it live: a real Build made on the spot, a
//                free tool beside a paid one, or their own files
//   3 Practise   one question at a time, instant feedback and the why
//   4 Do it      the real step, recorded when it's actually done
//
// Done when practised and the real step is done (src/logic/softwarePath.js).
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useUserProgress } from '../../../context/UserProgressContext';
import { useAccess } from '../../../context/AccessContext';
import { Button, SectionLabel } from '../../components/ui';
import RichText from '../../components/RichText';
import BuildPreview from '../../components/BuildPreview';
import PetCompanion from '../../components/PetCompanion';
import usePath from './usePath';
import { PATH_MISSION_MAP, SOFTWARE_PATH } from '../../data/softwarePath';
import { loadFinds, findAllowed, markFindTried, BUNDLED_FINDS } from '../../api/findsCatalog';
import { ageBandFor } from '../../logic/profileResolver';
import { newBuild, buildTitle, buildFilename } from '../../logic/builds';
import { renderBuild } from '../../logic/buildRender';
import { missionState, markSeen, recordPractice, markTried, shuffledOptions } from '../../logic/softwarePath';
import { companionLine } from '../../logic/studio';
import { recordAction } from '../../logic/gamificationService';

function Beat({ n, title, done, children }) {
  const { colors: c, typography: t, spacing: s, accent } = useTheme();
  return (
    <View style={{ marginTop: s.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: done ? accent.primary : c.bg2, alignItems: 'center', justifyContent: 'center' }}>
          {done
            ? <Ionicons name="checkmark" size={15} color={accent.onPrimary} />
            : <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text2 }}>{n}</Text>}
        </View>
        <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function MissionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { profile } = useUserProgress();
  const { signalAction } = useAccess();
  const { studio, progress, update } = usePath();
  const mission = PATH_MISSION_MAP[route.params?.missionId] || SOFTWARE_PATH.missions[0];
  const index = SOFTWARE_PATH.missions.indexOf(mission);
  const state = missionState(mission, progress, studio.builds);

  // ── 1 Learn: one card at a time ─────────────────────────────────────────
  const [cards, setCards] = useState(1);
  useEffect(() => { setCards(state.seen ? mission.teach.length : 1); }, [mission.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const allCards = cards >= mission.teach.length;
  const nextCard = () => {
    const n = cards + 1;
    setCards(n);
    if (n >= mission.teach.length && !state.seen) update(markSeen(progress, mission.id));
  };

  // ── 2 See it ────────────────────────────────────────────────────────────
  const show = mission.show;
  const demoHtml = useMemo(
    () => (show.build ? renderBuild(newBuild(show.build, show.answers), studio.me) : ''),
    [show, studio.me],
  );

  // ── 3 Practise ──────────────────────────────────────────────────────────
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null); // index into shuffled options
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);
  useEffect(() => { setQi(0); setPicked(null); setRight(0); setFinished(false); }, [mission.id]);
  const q = mission.practice[qi];
  const opts = useMemo(() => (q ? shuffledOptions(q, mission.id) : []), [q, mission.id]);
  const pick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (opts[i].right) setRight(n => n + 1);
  };
  const nextQ = () => {
    if (qi + 1 < mission.practice.length) { setQi(qi + 1); setPicked(null); return; }
    setFinished(true);
    update(recordPractice(progress, mission.id, right));
  };
  const again = () => { setQi(0); setPicked(null); setRight(0); setFinished(false); };

  // ── 4 Do it ─────────────────────────────────────────────────────────────
  const band = ageBandFor(profile);
  const [finds, setFinds] = useState(BUNDLED_FINDS);
  useEffect(() => {
    if (mission.doIt.type !== 'try') return undefined;
    let alive = true;
    loadFinds().then(list => { if (alive) setFinds(list); });
    return () => { alive = false; };
  }, [mission.doIt.type]);
  const tryList = useMemo(() => {
    if (mission.doIt.type !== 'try') return [];
    const want = mission.doIt.finds;
    // Remote rows carry the bundled id as legacyId.
    const all = [...finds, ...BUNDLED_FINDS];
    const seen = new Set();
    return want.map(id => all.find(f => (f.legacyId || f.id) === id)).filter(f => {
      if (!f || seen.has(f.url) || !findAllowed(f, band)) return false;
      seen.add(f.url);
      return true;
    });
  }, [finds, band, mission.doIt]);

  const triedIt = async (f) => {
    if (studio.userId) await markFindTried(studio.userId, f, { note: 'Tried it in Software for You' }).catch(() => {});
    signalAction('find-tried');
    recordAction('taste_logged', f.id);
    update(markTried(progress, mission.id, f.legacyId || f.id));
  };
  const openStudioFor = (kind) => navigation.navigate('StudioScreen', { start: kind, at: Date.now() });
  const kindBuilds = mission.doIt.type === 'build' ? studio.builds.filter(b => b.kind === mission.doIt.kind) : [];

  const card = { padding: s.md, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 120 }}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SoftwarePathScreen'))}
          accessibilityRole="button" accessibilityLabel="Back to Software for You"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: s.md, alignSelf: 'flex-start' }}
        >
          <Ionicons name="chevron-back" size={22} color={accent.primary} />
          <Text style={{ fontSize: t.md, color: accent.primary, fontWeight: t.semibold }}>Software for You</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3 }}>Mission {index + 1} of {SOFTWARE_PATH.missions.length}</Text>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{mission.title}</Text>

        {state.done && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: s.sm, marginTop: s.md }}>
            {!!studio.pet && <PetCompanion pet={studio.pet} size={40} />}
            <View style={[card, { flex: 1, borderColor: accent.primary }]}>
              <RichText style={{ fontSize: t.sm, color: c.text2 }} boldStyle={{ color: c.text1 }}>
                {`**Mission done.** ${companionLine('mastered', mission.id).replace(/\*\*/g, '')}`}
              </RichText>
            </View>
          </View>
        )}

        {/* 1 Learn */}
        <Beat n={1} title="Learn" done={state.seen}>
          {mission.teach.slice(0, cards).map((txt, i) => (
            <View key={i} style={[card, { marginBottom: s.sm }]}>
              <RichText style={{ fontSize: t.md, lineHeight: 22, color: c.text2 }} boldStyle={{ color: c.text1 }}>{txt}</RichText>
            </View>
          ))}
          {!allCards && <Button label="Next" icon="arrow-forward" size="sm" fullWidth={false} onPress={nextCard} />}
        </Beat>

        {/* 2 See it */}
        <Beat n={2} title="See it" done={state.seen}>
          <Text style={{ fontSize: t.sm, color: c.text2, marginBottom: s.sm }}>{show.line}</Text>
          {!!show.build && <BuildPreview html={demoHtml} height={300} />}
          {!!show.compare && (
            <View style={card}>
              <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3 }}>The job</Text>
              <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>{show.compare.task}</Text>
              <View style={{ flexDirection: 'row', gap: s.sm }}>
                {[['Paid', show.compare.paid, false], ['Free', show.compare.free, true]].map(([label, what, free]) => (
                  <View key={label} style={{ flex: 1, padding: s.sm, borderRadius: r.md, backgroundColor: free ? accent.primaryLight : c.bg2 }}>
                    <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: free ? accent.primary : c.text3 }}>{label}</Text>
                    <Text style={{ fontSize: t.sm, color: c.text1, marginTop: 2 }}>{what}</Text>
                  </View>
                ))}
              </View>
              <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3, marginTop: s.md }}>Both can</Text>
              {show.compare.both.map(b => (
                <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Ionicons name="checkmark-circle" size={14} color={accent.primary} />
                  <Text style={{ fontSize: t.sm, color: c.text2 }}>{b}</Text>
                </View>
              ))}
            </View>
          )}
          {!!show.own && (
            <View style={card}>
              {studio.builds.length ? studio.builds.slice(0, 5).map(b => (
                <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 6 }}>
                  <Ionicons name="document-outline" size={18} color={accent.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{buildFilename(b)}</Text>
                    <Text style={{ fontSize: t.xs, color: c.text3 }}>{buildTitle(b)} · opens in any browser</Text>
                  </View>
                </View>
              )) : (
                <Text style={{ fontSize: t.sm, color: c.text2 }}>Nothing made yet. Anything you make in the Studio becomes a file like <Text style={{ fontWeight: t.bold, color: c.text1 }}>my-page.html</Text> that you keep.</Text>
              )}
            </View>
          )}
        </Beat>

        {/* 3 Practise */}
        <Beat n={3} title="Practise" done={state.practiced}>
          {finished ? (
            <View style={card}>
              <RichText style={{ fontSize: t.md, color: c.text2 }} boldStyle={{ color: c.text1 }}>
                {`**${right} of ${mission.practice.length} right.** ${right === mission.practice.length ? 'Every one.' : 'The why under each one is the part to keep.'}`}
              </RichText>
              <Button label="Practise again" variant="ghost" size="sm" fullWidth={false} onPress={again} style={{ marginTop: s.sm }} />
            </View>
          ) : (
            <View style={card}>
              <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3 }}>{qi + 1} of {mission.practice.length}</Text>
              <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1, marginTop: 4, marginBottom: s.sm }}>{q.q}</Text>
              {opts.map((o, i) => {
                const chosen = picked === i;
                const reveal = picked !== null;
                const tone = reveal && o.right ? accent.primary : chosen ? c.error : c.border;
                return (
                  <TouchableOpacity
                    key={o.label}
                    onPress={() => pick(i)}
                    disabled={reveal}
                    accessibilityRole="button"
                    accessibilityState={{ selected: chosen }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.md, borderRadius: r.md, borderWidth: reveal && (o.right || chosen) ? 1.5 : 1, borderColor: tone, marginBottom: s.sm, backgroundColor: c.bg0 }}
                  >
                    <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{o.label}</Text>
                    {reveal && o.right && <Ionicons name="checkmark-circle" size={18} color={accent.primary} />}
                    {chosen && !o.right && <Ionicons name="close-circle" size={18} color={c.error} />}
                  </TouchableOpacity>
                );
              })}
              {picked !== null && (
                <>
                  <RichText style={{ fontSize: t.sm, color: c.text2, marginTop: 2 }} boldStyle={{ color: c.text1 }}>
                    {`**${opts[picked].right ? 'Right.' : 'Not quite.'}** ${q.why}`}
                  </RichText>
                  <Button label={qi + 1 < mission.practice.length ? 'Next question' : 'Finish'} size="sm" fullWidth={false} onPress={nextQ} style={{ marginTop: s.sm }} />
                </>
              )}
            </View>
          )}
        </Beat>

        {/* 4 Do it */}
        <Beat n={4} title="Do it for real" done={state.did}>
          <RichText style={{ fontSize: t.md, color: c.text1, fontWeight: t.semibold }} boldStyle={{ color: c.text1 }}>{mission.doIt.label}</RichText>
          <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 2, marginBottom: s.sm }}>{mission.doIt.how}</Text>

          {mission.doIt.type === 'build' && (
            state.did ? (
              <>
                {kindBuilds.slice(0, 2).map(b => (
                  <TouchableOpacity key={b.id} onPress={() => navigation.navigate('BuildScreen', { buildId: b.id })} accessibilityRole="button"
                    style={[card, { flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }]}>
                    <Ionicons name="checkmark-circle" size={18} color={accent.primary} />
                    <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>You made {buildTitle(b)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={c.text3} />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <Button label="Make it in the Studio" icon="color-wand-outline" onPress={() => openStudioFor(mission.doIt.kind)} />
            )
          )}

          {mission.doIt.type === 'try' && tryList.map(f => {
            const done = progress.missions[mission.id]?.tried === (f.legacyId || f.id);
            return (
              <View key={f.url} style={[card, { marginBottom: s.sm, borderColor: done ? accent.primary : c.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.sm }}>
                  {!!f.emoji && <Text style={{ fontSize: 20 }}>{f.emoji}</Text>}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{f.title}</Text>
                    {!!f.insteadOf && <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text2 }}>Free instead of {f.insteadOf}</Text>}
                    {!!(f.summary || f.desc) && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{f.summary || f.desc}</Text>}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>
                  <Button label="Open it" icon="open-outline" size="sm" variant="secondary" fullWidth={false} onPress={() => Linking.openURL(f.url).catch(() => {})} />
                  {done
                    ? <Text style={{ alignSelf: 'center', fontSize: t.sm, fontWeight: t.semibold, color: accent.primary }}>✓ You tried it</Text>
                    : <Button label="I tried it" icon="checkmark" size="sm" fullWidth={false} onPress={() => triedIt(f)} />}
                </View>
              </View>
            );
          })}

          {mission.doIt.type === 'export' && (
            state.did ? (
              <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: s.sm, borderColor: accent.primary }]}>
                <Ionicons name="checkmark-circle" size={18} color={accent.primary} />
                <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>You took a Build home. It’s yours.</Text>
              </View>
            ) : studio.builds.length ? (
              <Button label="Open one of your Builds" icon="download-outline" onPress={() => navigation.navigate('BuildScreen', { buildId: studio.builds[0].id })} />
            ) : (
              <Button label="Make one first" icon="color-wand-outline" onPress={() => navigation.navigate('StudioScreen')} />
            )
          )}
        </Beat>

        {state.done && SOFTWARE_PATH.missions[index + 1] && (
          <>
            <SectionLabel label="Next mission" />
            <Button label={SOFTWARE_PATH.missions[index + 1].title} icon="arrow-forward" variant="secondary"
              onPress={() => navigation.replace('MissionScreen', { missionId: SOFTWARE_PATH.missions[index + 1].id })} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
