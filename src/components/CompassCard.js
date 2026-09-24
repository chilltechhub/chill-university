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

import React from 'react';
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
      </View>
    );
  }

  /* ── No purpose on file ── */
  if (!live && !purposeKey) {
    const suggestion = getPurpose(suggestedPurposeKey);
    return (
      <TouchableOpacity style={[s.card, { borderLeftColor: c.gold }]} onPress={goCompass} activeOpacity={0.85}>
        <Text style={s.kicker}>{showEmojis ? '🧭 ' : ''}Compass</Text>
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
    return (
      <View style={[s.card, { borderLeftColor: accent }]}>
        <TouchableOpacity onPress={goCompass} activeOpacity={0.85}>
          <Text style={[s.kicker, { color: accent }]}>
            {showEmojis ? `${purpose?.emoji} ` : ''}{purpose?.label}
          </Text>
          <Text style={s.headline}>{suggestion ? suggestion.label : 'Pick one thing to finish'}</Text>
          {showSubtext && (
            <Text style={s.sub}>
              {suggestion?.promise || 'One objective at a time. Finishing it opens more of the app.'}
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
            <Text style={[s.cta, { color: accent }]}>Choose an objective</Text>
            <Ionicons name="arrow-forward" size={14} color={accent} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  /* ── Objective live ── */
  const { objective, nextStep, done, total, complete } = activeObjective;
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
          <Text style={s.headline}>That's all {total}. Claim it.</Text>
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
            label={`Finish ${objective.label}`}
            onPress={completeActiveObjective}
            color={accent}
            style={s.claimBtn}
          />
        </>
      ) : (
        <>
          <Text style={s.nextLabel}>Next step</Text>
          <View style={s.stepRow}>
            <TouchableOpacity
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
              <Text style={s.stepLabel}>
                {nextStep.label}
                {nextStep.needed ? ` · ${nextStep.count} of ${nextStep.needed}` : ''}
              </Text>
              {showSubtext && !!nextStep.hint && <Text style={s.stepHint}>{nextStep.hint}</Text>}
              {/* Most steps look after themselves. Saying so is the
                  difference between a checklist and a chore list. */}
              {showSubtext && (nextStep.locked || !!nextStep.signal) && (
                <Text style={s.autoNote}>Ticks itself when it is done.</Text>
              )}
            </View>
            {nextStep.screen && (
              <TouchableOpacity
                style={[s.goBtn, { borderColor: accent }]}
                onPress={() => goToScreen(navigation, nextStep.screen)}
                activeOpacity={0.8}
              >
                <Text style={[s.goText, { color: accent }]}>Open</Text>
              </TouchableOpacity>
            )}
          </View>
          {showSubtext && opensStage && (
            <Text style={s.stageHint}>Finish this goal to open: {opensStage}.</Text>
          )}
          {/* A first goal has a guide. If they sent it away, this is the
              way to call it back (src/logic/useGuidedFirstGoal.js). */}
          {objective.intro && !tourActive && (
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
  sub:      { fontSize: t.xs, color: c.text3, lineHeight: 18 },

  ctaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: sp.md },
  cta:      { fontSize: t.xs, fontWeight: '800', color: c.gold, letterSpacing: 0.4 },

  nextLabel:{ fontSize: ui.name === 'plain' ? 12 : 9, color: c.text3, ...ui.eyebrow, marginBottom: 6 },
  stepRow:  { flexDirection: 'row', alignItems: 'center', gap: sp.md },
  stepLabel:{ fontSize: t.sm, fontWeight: '700', color: c.text1, lineHeight: 19 },
  stepHint: { fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 17 },
  autoNote: { fontSize: t.xs, color: c.text4, marginTop: 3, fontStyle: 'italic' },
  goBtn:    { borderWidth: 1, borderRadius: r.sm, paddingHorizontal: sp.md, paddingVertical: 6 },
  goText:   { fontSize: t.xs, fontWeight: '800' },

  previewList:{ marginTop: sp.md, gap: 4 },
  previewStep:{ fontSize: t.xs, color: c.text2, lineHeight: 18 },
  stageHint:{ fontSize: t.xs, color: c.text3, marginTop: sp.md },
  guideLink:{ marginTop: sp.md },

  claimBtn: { marginTop: sp.md },
});
