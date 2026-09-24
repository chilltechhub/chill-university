// src/screens/CompassScreen.js
// The Compass — the app explaining itself in terms of what you came for.
//
// Five sections, in this order on purpose:
//   1. Purpose        the one thing you said you're here for (changeable)
//   2. The objective  one achievement, four steps, one of them highlighted
//   3. Start here     the handful of open features that serve your purpose
//   4. Up next        what's locked, what opens it, what you can test out of
//   5. Rough & Plus   experimental work and the paid tier, kept last and
//                     kept honest — neither is dressed up as a reward
//
// The rosters are ranked against the purpose (rankForPurpose in
// src/logic/featureAccess.js), never filtered by it. What they leave out is
// the stage's call (src/data/experienceStages.js): a new account sees the
// tools its profile type has opened so far and one first goal; locked tools
// arrive with the last stage ('doors'), except the ones the goal in flight
// opens, which always show. Labs sits there too, and Plus once it's on sale.
// Somebody who'd rather see it all has one switch, here and in Settings.

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useAccess } from '../../context/AccessContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { PURPOSES, objectivesForPurpose, getPurpose, getObjective } from '../data/objectives';
import { stageMeta } from '../logic/experienceStage';
import { MAX_STAGE } from '../data/experienceStages';
import { FEATURES, featuresUnlockedBy } from '../data/featureCatalog';
import { unlockHint } from '../logic/featureAccess';
import { goToScreen } from '../logic/appRoutes';
import LockBadge from '../components/LockBadge';
import UnlockSheet from '../components/UnlockSheet';
import { FONTS } from '../theme';

// The three words this screen runs on. Written out because "purpose",
// "objective" and "stage" are three different things here and, read cold,
// all three sound like "goal" — which is how somebody ends up asking what
// the Compass is while standing on it.
const EXPLAINER_TERMS = [
  {
    word: 'Purpose',
    text: 'The one thing you are here for. Picked once, changeable any time. Everything the app leads with is ordered around it.',
  },
  {
    word: 'Objective',
    text: 'Your goal: one finishable achievement, a few steps, days rather than months. Exactly one runs at a time, because the whole point is that there is one answer to "what now".',
  },
  {
    word: 'Steps',
    text: 'What the goal breaks into. Most tick themselves the moment you actually do the thing — the rest are the handful nothing can honestly observe, so you tick those yourself.',
  },
  {
    word: 'Stage',
    text: 'How much of the app is on the map right now. It is not something you choose or work on; it opens as you finish goals and gain levels.',
  },
];

export default function CompassScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: sp, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const {
    purposeKey, purpose, suggestedPurposeKey, choosePurpose,
    activeObjective, completedObjectiveIds, startObjective, toggleStep,
    completeActiveObjective, abandonActiveObjective,
    accessFor, rankedFeatures, experimentalOn, setExperimental, isPlus,
    stage, nextStage, firstGoalId, experienceMode, setExperienceMode, can, plusOnSale,
  } = useAccess();
  const { activeType } = useProfiles();
  // Locked tools, Labs and Plus are the last stage's to show ('doors').
  const showAll = can('doors');

  // null means "nobody has touched it": open while the first goal is still
  // in front of them, collapsed once one is behind them. An explicit tap
  // wins from then on.
  const [explainerOpen, setExplainerOpen] = useState(null);
  const [pickingPurpose, setPickingPurpose] = useState(false);
  const [pickingObjective, setPickingObjective] = useState(false);
  const [gatedFeature, setGatedFeature] = useState(null);

  const s = makeStyles(c, t, sp, r);
  const accent = c[purpose?.accentKey] || c.gold;

  /* ── Rosters ────────────────────────────────────────────────────────────
     rankedFeatures already drops hidden entries (experimental, not opted
     in). The experimental section below needs those back, so it ranks the
     raw catalog itself rather than asking the context for a second list. */

  const openFeatures = useMemo(
    () => rankedFeatures.filter(e => e.access.available && e.feature.screen).slice(0, 6),
    [rankedFeatures]
  );

  const lockedFeatures = useMemo(
    () => rankedFeatures.filter(e => e.access.status === 'locked'),
    [rankedFeatures]
  );

  const experimentalFeatures = useMemo(
    () => FEATURES.filter(f => f.gate === 'experimental').map(f => ({ feature: f, access: accessFor(f.id) })),
    [accessFor]
  );

  const paidFeatures = useMemo(
    () => FEATURES.filter(f => f.gate === 'paid').map(f => ({ feature: f, access: accessFor(f.id) })),
    [accessFor]
  );

  // Until a first goal is done, it's the only one offered — the full list
  // of fifteen is exactly the wall starting simple exists to avoid.
  const introDone = completedObjectiveIds.some(id => getObjective(id)?.intro);
  const showExplainer = explainerOpen === null ? !introDone : explainerOpen;
  const objectiveChoices = useMemo(() => {
    const first = getObjective(firstGoalId);
    if (!introDone && first) return [first];
    return objectivesForPurpose(purposeKey);
  }, [purposeKey, introDone, firstGoalId]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */

  const pickPurpose = async (key) => {
    setPickingPurpose(false);
    await choosePurpose(key);
  };

  const beginObjective = async (objectiveId) => {
    const swapping = activeObjective?.active && activeObjective.objective.id !== objectiveId;
    if (swapping) {
      Alert.alert(
        'Swap objectives?',
        `"${activeObjective.objective.label}" gets set aside at ${activeObjective.done}/${activeObjective.total}. Your ticks are kept if you come back to it.`,
        [
          { text: 'Keep going', style: 'cancel' },
          { text: 'Swap', style: 'destructive', onPress: async () => { setPickingObjective(false); await startObjective(objectiveId); } },
        ]
      );
      return;
    }
    setPickingObjective(false);
    await startObjective(objectiveId);
  };

  const claim = async () => {
    const res = await completeActiveObjective();
    if (res?.error && !res?.missingSchema) {
      Alert.alert('Could not finish it', 'Something went wrong saving that — try again in a moment.');
    }
  };

  const dropObjective = () => {
    Alert.alert(
      'Set this aside?',
      'It goes back to the list with your ticks intact. You can pick it up again any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set aside', style: 'destructive', onPress: abandonActiveObjective },
      ]
    );
  };

  const openFeature = (entry) => {
    // goToScreen, not navigate: this screen is on the root stack and most
    // features live two navigators down. See src/logic/appRoutes.js.
    if (entry.access.available && entry.feature.screen) goToScreen(navigation, entry.feature.screen);
    else setGatedFeature(entry.feature.id);
  };

  /* ── Render ───────────────────────────────────────────────────────────── */

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        <View style={s.header}>
          <Text style={s.headerTitle}>Compass</Text>
          {showSubtext && <Text style={s.headerSub}>One purpose, one objective, and what each one opens.</Text>}
        </View>

        {/* ── What this screen is ──
            "What is the Compass?" and "is that the same thing as the
            stages?" are the two questions this screen was getting asked,
            which means it was answering neither. Open by default until a
            first goal has been finished, collapsed after that — the
            explanation earns its space once and then gets out of the way. */}
        <View style={s.explainer}>
          <TouchableOpacity
            style={s.explainerHead}
            onPress={() => setExplainerOpen(!showExplainer)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ expanded: showExplainer }}
          >
            <Ionicons name="help-circle-outline" size={16} color={c.teal} />
            <Text style={s.explainerTitle}>What is the Compass?</Text>
            <Ionicons name={showExplainer ? 'chevron-up' : 'chevron-down'} size={15} color={c.text4} />
          </TouchableOpacity>
          {showExplainer && (
            <View style={s.explainerBody}>
              <Text style={s.explainerLead}>
                The app can do a great many things, which is the problem this screen solves. It keeps one
                answer to "what now" instead of handing you a directory.
              </Text>
              {EXPLAINER_TERMS.map(term => (
                <View key={term.word} style={s.termRow}>
                  <Text style={s.termWord}>{term.word}</Text>
                  <Text style={s.termText}>{term.text}</Text>
                </View>
              ))}
              <View style={s.explainerNote}>
                <Ionicons name="git-compare-outline" size={13} color={c.gold} style={{ marginTop: 2 }} />
                <Text style={s.explainerNoteText}>
                  <Text style={{ fontWeight: '800', color: c.text2 }}>Stages are not goals.</Text>{' '}
                  A goal is the thing you are doing. A stage is how much of the app is on the map while you
                  do it. Finishing a goal — or gaining a level — opens the next stage, so the two move
                  together, but you never pick a stage and you cannot work on one directly.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Where you are — so a short list reads as "not yet", not "that's all" ── */}
        <View style={s.stageCard}>
          <Text style={s.stageKicker}>Stage {stage} of {MAX_STAGE} · {stageMeta(stage, activeType).label}</Text>
          <Text style={s.stageText}>
            {experienceMode === 'full'
              ? 'You chose to see everything. Switch back and the app goes by your progress again.'
              : nextStage
                ? `${nextStage.text} to open the next stage: ${nextStage.label}.`
                : 'Everything is on show.'}
          </Text>
          {(experienceMode === 'full' || !showAll) && (
            <TouchableOpacity onPress={() => setExperienceMode(experienceMode === 'full' ? 'auto' : 'full')} activeOpacity={0.7}>
              <Text style={[s.inlineAction, { color: c.teal, marginTop: sp.sm }]}>
                {experienceMode === 'full' ? 'Go by my progress' : 'Show me everything now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 1. Purpose ── */}
        <View style={[s.section, { borderLeftColor: accent }]}>
          <Text style={s.sectionKicker}>Your purpose</Text>
          {purpose ? (
            <>
              <Text style={s.purposeLabel}>
                {showEmojis ? `${purpose.emoji} ` : ''}{purpose.label}
              </Text>
              {showSubtext && <Text style={s.purposeBlurb}>{purpose.blurb}</Text>}
              <TouchableOpacity onPress={() => setPickingPurpose(v => !v)} activeOpacity={0.7}>
                <Text style={[s.inlineAction, { color: accent }]}>
                  {pickingPurpose ? 'Never mind' : 'Change it'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.purposeLabel}>Not set yet</Text>
              <Text style={s.purposeBlurb}>
                {suggestedPurposeKey
                  ? `From your setup answers, "${getPurpose(suggestedPurposeKey)?.label}" looks closest. Confirm or pick another.`
                  : 'Pick one and everything below reorders around it.'}
              </Text>
              <TouchableOpacity onPress={() => setPickingPurpose(true)} activeOpacity={0.7}>
                <Text style={[s.inlineAction, { color: accent }]}>Choose a purpose</Text>
              </TouchableOpacity>
            </>
          )}

          {(pickingPurpose || !purpose) && (
            <View style={s.purposeGrid}>
              {PURPOSES.map(p => {
                const picked = p.key === purposeKey;
                const suggested = p.key === suggestedPurposeKey && !purposeKey;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[s.purposeTile, picked && { borderColor: c[p.accentKey] || c.teal, backgroundColor: (c[p.accentKey] || c.teal) + '14' }]}
                    onPress={() => pickPurpose(p.key)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.purposeEmoji}>{p.emoji}</Text>
                    <Text style={s.purposeTileLabel} numberOfLines={2}>{p.label}</Text>
                    {suggested && <Text style={s.suggestTag}>Suggested</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── 2. The objective ── */}
        <SectionHead
          title="The objective"
          action={activeObjective?.active ? 'Set aside' : null}
          onAction={dropObjective}
          c={c} t={t} sp={sp}
        />

        {activeObjective?.active ? (
          <View style={s.objectiveCard}>
            <View style={s.objTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.objTitle}>{activeObjective.objective.label}</Text>
                <Text style={s.objPromise}>{activeObjective.objective.promise}</Text>
              </View>
              <Text style={s.objCount}>{activeObjective.done}/{activeObjective.total}</Text>
            </View>

            <View style={s.track}>
              <View style={[s.fill, { width: `${(activeObjective.done / Math.max(activeObjective.total, 1)) * 100}%`, backgroundColor: accent }]} />
            </View>

            {activeObjective.steps.map((step, i) => {
              const isNext = !step.done && activeObjective.nextStep?.id === step.id;
              return (
                <View key={step.id} style={[s.stepRow, isNext && { backgroundColor: accent + '10', borderColor: accent }]}>
                  <TouchableOpacity
                    onPress={() => !step.locked && toggleStep(step.id)}
                    disabled={step.locked}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={step.done ? 'checkmark-circle' : step.locked ? 'ellipse-outline' : 'square-outline'}
                      size={20}
                      color={step.done ? accent : c.text4}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.stepLabel, step.done && s.stepDone]}>
                      {i + 1}. {step.label}
                      {step.needed && !step.done ? ` · ${step.count} of ${step.needed}` : ''}
                    </Text>
                    {showSubtext && !!step.hint && <Text style={s.stepHint}>{step.hint}</Text>}
                    {/* Which steps look after themselves, said out loud. It
                        was only ever said for `auto` counter steps, so the
                        far more common signal steps looked like chores
                        somebody had to remember to come back and tick. */}
                    {!step.done && step.locked && (
                      <Text style={s.autoNote}>Ticks itself — the app is already counting this one.</Text>
                    )}
                    {!step.done && !step.locked && !!step.signal && (
                      <Text style={s.autoNote}>
                        {step.needed
                          ? `Ticks itself once you have done it ${step.needed} times.`
                          : 'Ticks itself when you do it — no need to come back here.'}
                      </Text>
                    )}
                  </View>
                  {step.screen && !step.done && (
                    <TouchableOpacity
                      style={[s.goBtn, { borderColor: accent }]}
                      onPress={() => goToScreen(navigation, step.screen, step.params)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.goText, { color: accent }]}>Open</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <View style={s.unlockNote}>
              <Ionicons name="lock-open-outline" size={13} color={c.text3} />
              <Text style={s.unlockNoteText}>
                {[
                  featuresUnlockedBy(activeObjective.objective.id).length > 0
                    ? `Finishing this opens ${featuresUnlockedBy(activeObjective.objective.id).map(f => f.label).join(' and ')}.`
                    : null,
                  nextStage
                    ? `It also opens the next stage of the app: ${nextStage.label}.`
                    : null,
                ].filter(Boolean).join(' ') || 'Finishing this is its own reward — nothing gated behind it.'}
              </Text>
            </View>

            {activeObjective.complete && (
              <TouchableOpacity style={[s.claimBtn, { backgroundColor: accent }]} onPress={claim} activeOpacity={0.85}>
                <Ionicons name="trophy-outline" size={16} color="#fff" />
                <Text style={s.claimText}>Finish it</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setPickingObjective(v => !v)} activeOpacity={0.7}>
              <Text style={s.inlineActionMuted}>
                {pickingObjective ? 'Never mind' : 'Work on something else instead'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.objectiveCard}>
            <Text style={s.objTitle}>Nothing in flight</Text>
            <Text style={s.objPromise}>
              One at a time. Pick the one that matches what you're here for and the rest of the app
              gets out of the way until it's done.
            </Text>
            <TouchableOpacity onPress={() => setPickingObjective(true)} activeOpacity={0.7}>
              <Text style={[s.inlineAction, { color: accent }]}>Pick an objective</Text>
            </TouchableOpacity>
          </View>
        )}

        {(pickingObjective || !activeObjective?.active) && (
          <View style={s.pickList}>
            {objectiveChoices.map(o => {
              const done = completedObjectiveIds.includes(o.id);
              const isActive = activeObjective?.objective.id === o.id && activeObjective.active;
              const p = getPurpose(o.purpose);
              return (
                <TouchableOpacity
                  key={o.id}
                  style={[s.pickRow, done && s.pickRowDone]}
                  onPress={() => !done && !isActive && beginObjective(o.id)}
                  disabled={done || isActive}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1 }}>
                    <View style={s.pickTopRow}>
                      <Text style={s.pickLabel}>{o.label}</Text>
                      {done && <Ionicons name="checkmark-circle" size={15} color={c.teal} />}
                    </View>
                    <Text style={s.pickPromise} numberOfLines={2}>{o.promise}</Text>
                    <Text style={s.pickMeta}>
                      {showEmojis ? `${p?.emoji} ` : ''}{p?.short} · {o.estimate}
                      {o.unlocks?.length ? ` · opens ${o.unlocks.length}` : ''}
                    </Text>
                  </View>
                  {!done && !isActive && <Ionicons name="arrow-forward" size={15} color={c.text4} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── 3. Start here ── */}
        {openFeatures.length > 0 && (
          <>
            <SectionHead title={purpose ? `For ${purpose.short.toLowerCase()}` : 'Start here'} c={c} t={t} sp={sp} />
            <View style={s.rosterWrap}>
              {openFeatures.map(entry => (
                <FeatureRow key={entry.feature.id} entry={entry} onPress={() => openFeature(entry)} c={c} t={t} sp={sp} r={r} showSubtext={showSubtext} />
              ))}
            </View>
          </>
        )}

        {/* ── 4. Up next ── */}
        {lockedFeatures.length > 0 && (
          <>
            <SectionHead title="Up next" c={c} t={t} sp={sp} />
            {showSubtext && (
              <Text style={s.sectionNote}>
                Each one opens by finishing an objective — or, where there's a check, by showing you
                already know it. One attempt at each check.
              </Text>
            )}
            <View style={s.rosterWrap}>
              {lockedFeatures.map(entry => (
                <FeatureRow key={entry.feature.id} entry={entry} onPress={() => openFeature(entry)} c={c} t={t} sp={sp} r={r} showSubtext={showSubtext} />
              ))}
            </View>
          </>
        )}

        {/* ── 5. Rough & Plus — the last stage only ('doors') ── */}
        {showAll && (<>
        {/* ── 5a. Experimental ── */}
        <SectionHead title="Rough edges" c={c} t={t} sp={sp} />
        <View style={s.toggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleLabel}>Experimental features</Text>
            <Text style={s.toggleSub}>
              Work that isn't finished — thin empty states, layouts still moving around, things that
              may be rebuilt. Off by default so you never land in one by accident.
            </Text>
          </View>
          <Switch
            value={experimentalOn}
            onValueChange={setExperimental}
            trackColor={{ false: c.bg3, true: c.purple }}
            thumbColor="#fff"
          />
        </View>
        <View style={s.rosterWrap}>
          {experimentalFeatures.map(entry => (
            <FeatureRow key={entry.feature.id} entry={entry} onPress={() => openFeature(entry)} c={c} t={t} sp={sp} r={r} showSubtext={showSubtext} />
          ))}
        </View>

        {/* ── 5b. Plus — only once it can actually be bought ── */}
        {(plusOnSale || isPlus) && (<>
        <SectionHead title="Plus" c={c} t={t} sp={sp} />
        {showSubtext && (
          <Text style={s.sectionNote}>
            {isPlus
              ? 'Your plan covers these.'
              : 'The deep end. Everything else in the app works the same without it.'}
          </Text>
        )}
        <View style={s.rosterWrap}>
          {paidFeatures.map(entry => (
            <FeatureRow key={entry.feature.id} entry={entry} onPress={() => openFeature(entry)} c={c} t={t} sp={sp} r={r} showSubtext={showSubtext} />
          ))}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Plus')}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: sp.lg }}
        >
          <Ionicons name={isPlus ? 'star' : 'star-outline'} size={15} color={c.gold} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: c.gold }}>{isPlus ? 'Your plan' : 'See Plus'}</Text>
        </TouchableOpacity>
        </>)}
        </>)}
      </ScrollView>

      <UnlockSheet
        visible={!!gatedFeature}
        featureId={gatedFeature}
        onClose={() => setGatedFeature(null)}
      />
    </View>
  );
}

/* ─── Bits ────────────────────────────────────────────────────────────────── */

function SectionHead({ title, action, onAction, c, t, sp }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: sp.xl, marginTop: sp.xl, marginBottom: sp.sm }}>
      <Text style={{ fontSize: t.xs, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.gold, textTransform: 'uppercase', letterSpacing: 1.2 }}>
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={{ fontSize: t.xs, fontFamily: FONTS.mono, color: c.text3 }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function FeatureRow({ entry, onPress, c, t, sp, r, showSubtext }) {
  const { feature, access } = entry;
  const hint = unlockHint(access);
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row', alignItems: 'center', gap: sp.md,
        backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border,
        padding: sp.md, marginBottom: sp.sm, opacity: access.available ? 1 : 0.85,
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{ width: 34, height: 34, borderRadius: r.sm, backgroundColor: c.bg2, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={feature.icon} size={17} color={access.available ? c.text1 : c.text4} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.sm }}>
          <Text style={{ fontSize: t.sm, fontWeight: '700', color: access.available ? c.text1 : c.text2 }} numberOfLines={1}>
            {feature.label}
          </Text>
          <LockBadge access={access} size="xs" />
        </View>
        {showSubtext && (
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 17 }} numberOfLines={2}>
            {feature.blurb}
          </Text>
        )}
        {!!hint && !access.available && (
          <Text style={{ fontSize: 10, color: c.text4, marginTop: 3, fontStyle: 'italic' }} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </View>
      <Ionicons name={access.available ? 'arrow-forward' : 'information-circle-outline'} size={14} color={c.text4} />
    </TouchableOpacity>
  );
}

const makeStyles = (c, t, sp, r) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0 },
  scroll:    { paddingBottom: 60, paddingTop: sp.lg },

  header:      { paddingHorizontal: sp.xl, marginBottom: sp.lg },
  headerTitle: { fontSize: t.xxxl, fontFamily: FONTS.display, fontWeight: '800', color: c.text1 },
  headerSub:   { fontSize: t.xs, color: c.text3, marginTop: 4, lineHeight: 18 },

  explainer:      { marginHorizontal: sp.xl, marginBottom: sp.lg, backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border },
  explainerHead:  { flexDirection: 'row', alignItems: 'center', gap: sp.sm, padding: sp.md },
  explainerTitle: { flex: 1, fontSize: t.sm, fontWeight: '800', color: c.text1 },
  explainerBody:  { paddingHorizontal: sp.md, paddingBottom: sp.md, gap: sp.sm },
  explainerLead:  { fontSize: t.xs, color: c.text3, lineHeight: 18 },
  termRow:        { borderLeftWidth: 2, borderLeftColor: c.teal, paddingLeft: sp.sm },
  termWord:       { fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginBottom: 2 },
  termText:       { fontSize: t.xs, color: c.text2, lineHeight: 18 },
  explainerNote:  { flexDirection: 'row', gap: 6, backgroundColor: c.gold + '12', borderRadius: r.md, padding: sp.sm, marginTop: 2 },
  explainerNoteText: { flex: 1, fontSize: t.xs, color: c.text3, lineHeight: 18 },

  stageCard:   { marginHorizontal: sp.xl, marginBottom: sp.lg, backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, padding: sp.md },
  stageKicker: { fontSize: 10, color: c.teal, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginBottom: 4 },
  stageText:   { fontSize: t.xs, color: c.text2, lineHeight: 18 },

  section:      { backgroundColor: c.bg1, marginHorizontal: sp.xl, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, padding: sp.lg },
  sectionKicker:{ fontSize: 10, color: c.text4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginBottom: 6 },
  sectionNote:  { fontSize: t.xs, color: c.text3, paddingHorizontal: sp.xl, marginBottom: sp.sm, lineHeight: 18 },

  purposeLabel: { fontSize: t.lg, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.text1 },
  purposeBlurb: { fontSize: t.xs, color: c.text3, marginTop: 4, lineHeight: 18 },
  inlineAction: { fontSize: t.xs, fontWeight: '800', marginTop: sp.md },
  inlineActionMuted: { fontSize: t.xs, color: c.text4, marginTop: sp.md, textAlign: 'center' },

  purposeGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: sp.sm, marginTop: sp.md },
  purposeTile:  { width: '31%', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 1, borderColor: c.border, padding: sp.sm, alignItems: 'center', minHeight: 84, justifyContent: 'center' },
  purposeEmoji: { fontSize: 20, marginBottom: 4 },
  purposeTileLabel: { fontSize: 10, fontWeight: '700', color: c.text1, textAlign: 'center', lineHeight: 14 },
  suggestTag:   { fontSize: 8, color: c.teal, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 3 },

  objectiveCard:{ backgroundColor: c.bg1, marginHorizontal: sp.xl, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, padding: sp.lg },
  objTopRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: sp.md },
  objTitle:     { fontSize: t.md, fontWeight: '800', color: c.text1 },
  objPromise:   { fontSize: t.xs, color: c.text3, marginTop: 3, lineHeight: 18 },
  objCount:     { fontSize: t.xs, fontFamily: FONTS.mono, color: c.text3 },
  track:        { height: 4, borderRadius: 2, backgroundColor: c.bg3, overflow: 'hidden', marginTop: sp.md, marginBottom: sp.md },
  fill:         { height: 4, borderRadius: 2 },

  stepRow:   { flexDirection: 'row', alignItems: 'center', gap: sp.md, paddingVertical: sp.sm, paddingHorizontal: sp.sm, borderRadius: r.sm, borderWidth: 1, borderColor: 'transparent', marginBottom: 4 },
  stepLabel: { fontSize: t.sm, color: c.text1, fontWeight: '600', lineHeight: 19 },
  stepDone:  { color: c.text4, textDecorationLine: 'line-through' },
  stepHint:  { fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 17 },
  autoNote:  { fontSize: 10, color: c.text4, marginTop: 2, fontStyle: 'italic' },
  goBtn:     { borderWidth: 1, borderRadius: r.sm, paddingHorizontal: sp.sm, paddingVertical: 5 },
  goText:    { fontSize: 10, fontWeight: '800' },

  unlockNote:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: sp.md, paddingTop: sp.md, borderTopWidth: 0.5, borderTopColor: c.border },
  unlockNoteText:{ flex: 1, fontSize: t.xs, color: c.text3, lineHeight: 17 },

  claimBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: r.md, paddingVertical: sp.md, marginTop: sp.md },
  claimText: { color: '#fff', fontSize: t.sm, fontWeight: '800' },

  pickList:    { paddingHorizontal: sp.xl, marginTop: sp.sm },
  pickRow:     { flexDirection: 'row', alignItems: 'center', gap: sp.md, backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: sp.md, marginBottom: sp.sm },
  pickRowDone: { opacity: 0.55 },
  pickTopRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickLabel:   { fontSize: t.sm, fontWeight: '700', color: c.text1 },
  pickPromise: { fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 17 },
  pickMeta:    { fontSize: 10, color: c.text4, marginTop: 4 },

  rosterWrap:  { paddingHorizontal: sp.xl },

  toggleCard:  { flexDirection: 'row', alignItems: 'center', gap: sp.md, backgroundColor: c.bg1, marginHorizontal: sp.xl, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: sp.md, marginBottom: sp.md },
  toggleLabel: { fontSize: t.sm, fontWeight: '700', color: c.text1 },
  toggleSub:   { fontSize: t.xs, color: c.text3, marginTop: 3, lineHeight: 17 },
});
