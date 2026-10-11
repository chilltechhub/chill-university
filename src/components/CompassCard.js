// src/components/CompassCard.js
// Home's answer to "what am I meant to do here?" — the single highest card
// on the dashboard, because it is the one thing that should survive a person
// having thirty seconds and no patience.
//
// It has four states, and never more than one thing to tap:
//
//   first goal      → nothing in flight and the first goal not done yet:
//                     the profile type's simple first goal, offered
//                     directly. A brand-new account isn't asked what it's
//                     here for — it's handed one small thing to do
//                     (FIRST_GOALS in src/data/experienceStages.js).
//   no purpose yet  → "what are you here for?", which is the only question
//                     worth asking someone staring at an app this big
//   no objective    → the objective that matches their purpose, offered once
//   objective live  → the NEXT STEP. Not the list of steps, not the progress
//                     ring with the list underneath. One step, one tick box.
//                     Shown whether or not a purpose is set.
//
// Everything else the Compass knows (the full path, what it unlocks, the
// locked/experimental/paid rosters) lives on CompassScreen. Home gets the
// one line; the screen gets the detail. Putting the roster here would
// recreate the exact wall of options this feature exists to remove.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useAccess } from '../../context/AccessContext';
import { getPurpose, getObjective, objectivesForPurpose } from '../data/objectives';
import { featuresUnlockedBy } from '../data/featureCatalog';
import { goToScreen } from '../logic/appRoutes';
import { resumeFirstGoalGuide } from '../logic/useGuidedFirstGoal';
import { useTour } from '../../context/TourContext';
import { Button } from './ui';
import { textOn } from '../logic/contrast';
import { finishLabel } from '../logic/featureAccess';
import RichText from './RichText';
import TourSpot from './TourSpot';
import StageList from './StageList';
import { MAX_STAGE } from '../data/experienceStages';

export default function CompassCard() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: sp, radius: r, style: ui, accent: themeAccent } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const {
    purposeKey, purpose, suggestedPurposeKey, activeObjective,
    toggleStep, completeActiveObjective, loading,
    nextStage, firstGoalId, startFirstGoal, completedObjectiveIds, startObjective,
  } = useAccess();

  const { active: tourActive } = useTour();
  const s = makeStyles(c, t, sp, r, ui);

  // Nothing to say until the first load settles — an empty prompt that
  // flickers into a live objective is worse than a beat of nothing.
  if (loading) return null;

  const goCompass = () => navigation.navigate('Compass');
  const live = !!activeObjective?.active;

  /* ── Nothing in flight, first goal not done: offer it ── */
  const firstGoal = getObjective(firstGoalId);
  const introDone = completedObjectiveIds.some(id => getObjective(id)?.intro);
  if (!live && firstGoal && !introDone) {
    return (
      <View style={[s.card, { borderLeftColor: themeAccent.primary }]}>
        <Text style={[s.kicker, { color: themeAccent.primary }]}>{showEmojis ? '🎯 ' : ''}Your first goal</Text>
        <Text style={s.headline}>{firstGoal.label}</Text>
        {showSubtext && <Text style={s.sub}>{firstGoal.promise}</Text>}
        <View style={s.previewList}>
          {firstGoal.steps.map((step, i) => (
            <Text key={step.id} style={s.previewStep}>{i + 1}. {step.label}</Text>
          ))}
        </View>
        <Button
          icon="play"
          label={`Start · ${firstGoal.estimate.toLowerCase()}`}
          onPress={() => { startFirstGoal(); resumeFirstGoalGuide(); }}
          style={s.claimBtn}
        />
        <WhatsNext />
      </View>
    );
  }

  /* ── No purpose on file ── */
  if (!live && !purposeKey) {
    const suggestion = getPurpose(suggestedPurposeKey);
    return (
      <TouchableOpacity style={[s.card, { borderLeftColor: c.gold }]} onPress={goCompass} activeOpacity={0.85}>
        <Text style={s.kicker}>{showEmojis ? '🧭 ' : ''}Your aim</Text>
        <Text style={s.headline}>What are you here for?</Text>
        {showSubtext && (
          <Text style={s.sub}>
            {suggestion
              ? `Going by your setup, probably "${suggestion.label}". Confirm it and the app points there.`
              : 'Pick one thing to aim at and the app will lead with it instead of everything at once.'}
          </Text>
        )}
        <View style={s.ctaRow}>
          <Text style={s.cta}>Set my purpose</Text>
          <Ionicons name="arrow-forward" size={14} color={c.gold} />
        </View>
        <WhatsNext />
      </TouchableOpacity>
    );
  }

  const accent = c[purpose?.accentKey] || c.teal;

  /* ── Purpose, but nothing in flight ── */
  // Finishing one goal hands over the next one rather than sending someone
  // back to a list: the best-matching objective they haven't done is offered
  // here with one tap. The full list is still a tap away on the Compass.
  if (!live) {
    const suggestion = objectivesForPurpose(purposeKey).find(o => !completedObjectiveIds.includes(o.id));
    // Once every goal for their purpose is done, the next best one comes from
    // another purpose. It used to keep their purpose's label ("Learn a real
    // skill" over a habits goal), so say whose it is, and that the set they
    // were on is finished.
    // A goal on the purpose's own `path` (objectives.js) belongs to it even
    // when its `purpose` field is another one: "Improve parts of my life"
    // leads with Steady State, a wellbeing goal. Counting those as a
    // crossover said "You've finished every … goal" after the first.
    const onPath = !!suggestion && (purpose?.path || []).includes(suggestion.id);
    const crossover = !!suggestion && !!purposeKey && suggestion.purpose !== purposeKey && !onPath;
    const shown = crossover ? getPurpose(suggestion.purpose) : purpose;
    return (
      <View style={[s.card, { borderLeftColor: accent }]}>
        <TouchableOpacity onPress={goCompass} activeOpacity={0.85}>
          <Text style={[s.kicker, { color: accent }]}>
            {showEmojis && shown?.emoji ? `${shown.emoji} ` : ''}{crossover ? `Next up · ${shown?.label || 'something new'}` : purpose?.label}
          </Text>
          <Text style={s.headline}>{suggestion ? suggestion.label : 'Pick one thing to finish'}</Text>
          {showSubtext && (
            <Text style={s.sub}>
              {crossover ? `You've finished every "${purpose?.label}" goal. ` : ''}
              {suggestion?.promise || 'One goal at a time. Finishing it opens more of the app.'}
            </Text>
          )}
        </TouchableOpacity>
        {suggestion ? (
          <>
            <Button
              icon="play"
              label={`Start · ${suggestion.estimate ? suggestion.estimate.toLowerCase() : 'next goal'}`}
              onPress={() => startObjective(suggestion.id)}
              color={accent}
              style={s.claimBtn}
            />
            <TouchableOpacity onPress={goCompass} activeOpacity={0.7} style={s.ctaRow}>
              <Text style={[s.cta, { color: accent }]}>Choose a different one</Text>
              <Ionicons name="arrow-forward" size={14} color={accent} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={goCompass} activeOpacity={0.7} style={s.ctaRow}>
            <Text style={[s.cta, { color: accent }]}>Choose a goal</Text>
            <Ionicons name="arrow-forward" size={14} color={accent} />
          </TouchableOpacity>
        )}
        <WhatsNext />
      </View>
    );
  }

  /* ── Objective live ── */
  const { objective, nextStep, done, total, complete, steps = [] } = activeObjective;
  // The whole goal lives on this one card: finished steps ticked above the
  // next one, later ones greyed below it. There used to be a separate "Your
  // steps" card with the same list, and the stage card quoted the next step
  // as well, so a new account saw its first goal three times over.
  const nextAt = steps.findIndex(st => st.id === nextStep?.id);
  const before = nextAt >= 0 ? steps.slice(0, nextAt) : [];
  const after = nextAt >= 0 ? steps.slice(nextAt + 1) : [];
  const miniStep = (st) => (
    <View key={st.id} style={s.miniRow}>
      <Ionicons
        name={st.done ? 'checkmark-circle' : 'ellipse-outline'}
        size={15}
        color={st.done ? c.success : c.text4}
      />
      <Text style={[s.miniLabel, st.done && s.miniDone]} numberOfLines={1}>{st.label}</Text>
    </View>
  );
  const unlocks = featuresUnlockedBy(objective.id);
  // Every finished goal opens the next stage, so say which one — the reason
  // worth saying out loud to someone who can only see a handful of tools.
  const opensStage = nextStage?.label || null;

  return (
    <View style={[s.card, { borderLeftColor: accent }]}>
      <TouchableOpacity onPress={goCompass} activeOpacity={0.8}>
        <View style={s.topRow}>
          <Text style={[s.kicker, { color: accent }]} numberOfLines={1}>
            {showEmojis && purpose?.emoji ? `${purpose.emoji} ` : ''}{objective.label}
          </Text>
          <Text style={s.count}>{done}/{total}</Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: `${(done / Math.max(total, 1)) * 100}%`, backgroundColor: accent }]} />
        </View>
      </TouchableOpacity>

      {complete ? (
        <>
          <Text style={s.headline}>{total === 2 ? "That's both." : `That's all ${total}.`} Claim it.</Text>
          {showSubtext && (unlocks.length > 0 || opensStage) && (
            <Text style={s.sub}>
              {[
                unlocks.length > 0 ? `Opens ${unlocks.map(f => f.label).join(' and ')}.` : null,
                opensStage ? `Next in your app: ${opensStage}.` : null,
              ].filter(Boolean).join(' ')}
            </Text>
          )}
          <Button
            icon="trophy-outline"
            label={finishLabel(objective.label)}
            onPress={completeActiveObjective}
            color={accent}
            style={s.claimBtn}
          />
        </>
      ) : (
        <>
          {before.map(miniStep)}
          <Text style={s.nextLabel}>Next step</Text>
          <View style={s.stepRow}>
            <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: false, disabled: !!nextStep.locked }} accessibilityLabel={nextStep.locked ? `${nextStep.label} (ticks itself)` : `Mark done: ${nextStep.label}`}
              onPress={() => !nextStep.locked && toggleStep(nextStep.id)}
              disabled={nextStep.locked}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={nextStep.locked ? 'ellipse-outline' : 'square-outline'}
                size={20}
                color={nextStep.locked ? c.text4 : accent}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.stepLabel} numberOfLines={3}>
                {nextStep.label}
                {nextStep.needed ? ` · ${nextStep.count} of ${nextStep.needed}` : ''}
              </Text>
              {showSubtext && !!nextStep.hint && <RichText style={s.stepHint} boldStyle={{ color: c.text1 }}>{nextStep.hint}</RichText>}
              {/* Most steps look after themselves. Saying so is the
                  difference between a checklist and a chore list. */}
              {showSubtext && (nextStep.locked || !!nextStep.signal) && !/ticks itself/i.test(nextStep.hint || '') && (
                <Text style={s.autoNote}>Ticks itself when it is done.</Text>
              )}
              {/* A step the app can't see happen ("teach it to someone") is
                  ticked by hand, and nothing said so: the square read as
                  decoration next to steps that tick themselves. */}
              {showSubtext && !nextStep.locked && !nextStep.signal && (
                <Text style={s.autoNote}>Tick the box when you've done it.</Text>
              )}
            </View>
            {nextStep.screen && (
              // The one filled button on Home: this is the thing to do next.
              // It was a small outline while Study/Play above were the
              // loudest buttons on the screen.
              <TouchableOpacity
                style={[s.goBtn, { borderColor: accent, backgroundColor: accent }]}
                onPress={() => goToScreen(navigation, nextStep.screen, nextStep.params)}
                activeOpacity={0.8}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Open: ${nextStep.label}`}
              >
                <Text style={[s.goText, { color: textOn(accent) }]}>Open</Text>
              </TouchableOpacity>
            )}
          </View>
          {after.length > 0 && <View style={{ marginTop: sp.sm }}>{after.map(miniStep)}</View>}
          {/* Every goal has the guide now, not only the first. If it was
              sent away, this calls it back (src/logic/useGuidedFirstGoal.js). */}
          {!tourActive && (
            <Button
              variant="secondary"
              size="sm"
              icon="chatbubble-ellipses-outline"
              label="Show me how"
              color={accent}
              fullWidth={false}
              onPress={resumeFirstGoalGuide}
              style={s.guideLink}
            />
          )}
        </>
      )}
      <WhatsNext live />
    </View>
  );
}

// "What's next" — the stage card, folded into the goal card. They were two
// cards saying nearly the same thing one under the other ("too clumpy",
// 2026-10-10), and "What opens next" became just "What's next". App Nav (the
// Compass screen's new name) is one tap from here, and every stage, locked
// ones included, one more.
function WhatsNext({ live = false }) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: sp, radius: r, accent } = useTheme();
  const { nextStage, experienceMode, stage } = useAccess();
  const [open, setOpen] = useState(false);
  const full = experienceMode === 'full';

  return (
    <View style={{ marginTop: sp.md, paddingTop: sp.md, borderTopWidth: 0.5, borderTopColor: c.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: sp.sm }}>
        <Ionicons name="lock-open-outline" size={14} color={accent.primary} />
        <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }} numberOfLines={2}>
          {full
            ? <Text style={{ fontWeight: t.bold }}>Everything is open.</Text>
            : nextStage
              ? <>What's next: <Text style={{ fontWeight: t.bold }}>{nextStage.label}</Text></>
              : <Text style={{ fontWeight: t.bold }}>Everything is open.</Text>}
        </Text>
        <TourSpot id="home-appnav" radius={8}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Compass')}
            accessibilityRole="button" accessibilityLabel="Open App Nav"
            hitSlop={8}
            style={{ borderWidth: 1, borderColor: accent.primary, borderRadius: r.sm, paddingHorizontal: 10, paddingVertical: 4 }}
          >
            <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>App Nav</Text>
          </TouchableOpacity>
        </TourSpot>
      </View>
      {!full && !!nextStage && (
        <RichText style={{ fontSize: t.xs, color: c.text3, marginTop: 4, lineHeight: 17 }} boldStyle={{ color: c.text1 }}>
          {live ? '**Finish this goal**' : '**Finish a goal**'}{' or **gain a level** in Training to open it.'}
        </RichText>
      )}
      <TouchableOpacity
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button" accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: sp.sm, alignSelf: 'flex-start' }}
        hitSlop={6}
      >
        <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>
          {open ? 'Hide stages' : `See all ${MAX_STAGE} stages`}{!full ? ` · you're on ${stage}` : ''}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={13} color={accent.primary} />
      </TouchableOpacity>
      {open && <StageList style={{ marginTop: 4 }} />}
    </View>
  );
}

const makeStyles = (c, t, sp, r, ui) => StyleSheet.create({
  card:     { backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: sp.lg, marginHorizontal: sp.lg, marginBottom: sp.md, borderWidth: ui.borderWidth, borderColor: c.border, borderLeftWidth: 3 },
  kicker:   { flex: 1, fontSize: ui.name === 'plain' ? 12 : 10, color: c.gold, ...ui.eyebrow },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  count:    { fontSize: ui.name === 'plain' ? 12 : 10, fontFamily: ui.numberFont, color: c.text3, fontVariant: ['tabular-nums'] },
  track:    { height: 4, borderRadius: 2, backgroundColor: c.bg3, overflow: 'hidden', marginTop: sp.sm, marginBottom: sp.md },
  fill:     { height: 4, borderRadius: 2 },

  headline: { fontSize: t.md, fontWeight: '800', color: c.text1, marginTop: sp.sm, marginBottom: 4 },
  miniRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  miniLabel:{ flex: 1, fontSize: t.xs, color: c.text3 },
  miniDone: { textDecorationLine: 'line-through', color: c.text3 },
  sub:      { fontSize: t.xs, color: c.text3, lineHeight: 18 },

  ctaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: sp.md },
  cta:      { fontSize: t.xs, fontWeight: '800', color: c.gold, letterSpacing: 0.4 },

  nextLabel:{ fontSize: ui.name === 'plain' ? 12 : 9, color: c.text3, ...ui.eyebrow, marginBottom: 6 },
  stepRow:  { flexDirection: 'row', alignItems: 'center', gap: sp.md },
  stepLabel:{ fontSize: t.sm, fontWeight: '700', color: c.text1, lineHeight: 19 },
  stepHint: { fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 17 },
  autoNote: { fontSize: t.xs, color: c.text3, marginTop: 3, fontStyle: 'italic' },
  goBtn:    { borderWidth: 1, borderRadius: r.sm, paddingHorizontal: sp.lg, paddingVertical: 9, minHeight: 36, justifyContent: 'center' },
  goText:   { fontSize: t.sm, fontWeight: '800' },

  previewList:{ marginTop: sp.md, gap: 4 },
  previewStep:{ fontSize: t.xs, color: c.text2, lineHeight: 18 },
  stageHint:{ fontSize: t.xs, color: c.text3, marginTop: sp.md },
  guideLink:{ marginTop: sp.md },

  claimBtn: { marginTop: sp.md },
});
