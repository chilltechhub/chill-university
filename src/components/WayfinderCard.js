// src/components/WayfinderCard.js
// Home's answer to "what am I meant to do here?" — the single highest card
// on the dashboard, because it is the one thing that should survive a person
// having thirty seconds and no patience.
//
// It has exactly three states, and never more than one thing to tap:
//
//   no purpose yet  → "what are you here for?", which is the only question
//                     worth asking someone staring at an app this big
//   no objective    → the objective that matches their purpose, offered once
//   objective live  → the NEXT STEP. Not the list of steps, not the progress
//                     ring with the list underneath. One step, one tick box.
//
// Everything else the Wayfinder knows (the full path, what it unlocks, the
// locked/experimental/paid rosters) lives on WayfinderScreen. Home gets the
// one line; the screen gets the detail. Putting the roster here would
// recreate the exact wall of options this feature exists to remove.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useAccess } from '../../context/AccessContext';
import { getPurpose } from '../data/objectives';
import { featuresUnlockedBy } from '../data/featureCatalog';
import { goToScreen } from '../logic/appRoutes';
import { FONTS } from '../theme';

export default function WayfinderCard() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: sp, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const {
    purposeKey, purpose, suggestedPurposeKey, activeObjective,
    toggleStep, completeActiveObjective, loading,
  } = useAccess();

  const s = makeStyles(c, t, sp, r);

  // Nothing to say until the first load settles — an empty prompt that
  // flickers into a live objective is worse than a beat of nothing.
  if (loading) return null;

  const goWayfinder = () => navigation.navigate('Wayfinder');

  /* ── No purpose on file ── */
  if (!purposeKey) {
    const suggestion = getPurpose(suggestedPurposeKey);
    return (
      <TouchableOpacity style={[s.card, { borderLeftColor: c.gold }]} onPress={goWayfinder} activeOpacity={0.85}>
        <Text style={s.kicker}>{showEmojis ? '🧭 ' : ''}Wayfinder</Text>
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
  if (!activeObjective || !activeObjective.active) {
    return (
      <TouchableOpacity style={[s.card, { borderLeftColor: accent }]} onPress={goWayfinder} activeOpacity={0.85}>
        <Text style={[s.kicker, { color: accent }]}>
          {showEmojis ? `${purpose?.emoji} ` : ''}{purpose?.label}
        </Text>
        <Text style={s.headline}>Pick one thing to finish</Text>
        {showSubtext && <Text style={s.sub}>One objective at a time. Finishing it opens more of the app.</Text>}
        <View style={s.ctaRow}>
          <Text style={[s.cta, { color: accent }]}>Choose an objective</Text>
          <Ionicons name="arrow-forward" size={14} color={accent} />
        </View>
      </TouchableOpacity>
    );
  }

  /* ── Objective live ── */
  const { objective, nextStep, done, total, complete } = activeObjective;
  const unlocks = featuresUnlockedBy(objective.id);

  return (
    <View style={[s.card, { borderLeftColor: accent }]}>
      <TouchableOpacity onPress={goWayfinder} activeOpacity={0.8}>
        <View style={s.topRow}>
          <Text style={[s.kicker, { color: accent }]} numberOfLines={1}>
            {showEmojis ? `${purpose?.emoji} ` : ''}{objective.label}
          </Text>
          <Text style={s.count}>{done}/{total}</Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: `${(done / Math.max(total, 1)) * 100}%`, backgroundColor: accent }]} />
        </View>
      </TouchableOpacity>

      {complete ? (
        <>
          <Text style={s.headline}>That's all four. Claim it.</Text>
          {showSubtext && unlocks.length > 0 && (
            <Text style={s.sub}>Opens {unlocks.map(f => f.label).join(' and ')}.</Text>
          )}
          <TouchableOpacity
            style={[s.claimBtn, { backgroundColor: accent }]}
            onPress={completeActiveObjective}
            activeOpacity={0.85}
          >
            <Ionicons name="trophy-outline" size={15} color="#fff" />
            <Text style={s.claimText}>Finish {objective.label}</Text>
          </TouchableOpacity>
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
              <Text style={s.stepLabel}>{nextStep.label}</Text>
              {showSubtext && !!nextStep.hint && <Text style={s.stepHint}>{nextStep.hint}</Text>}
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
        </>
      )}
    </View>
  );
}

const makeStyles = (c, t, sp, r) => StyleSheet.create({
  card:     { backgroundColor: c.bg1, borderRadius: r.lg, padding: sp.lg, marginHorizontal: sp.lg, marginBottom: sp.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3 },
  kicker:   { flex: 1, fontSize: 10, color: c.gold, textTransform: 'uppercase', letterSpacing: 1.1, fontWeight: '800' },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  count:    { fontSize: 10, fontFamily: FONTS.mono, color: c.text3 },
  track:    { height: 4, borderRadius: 2, backgroundColor: c.bg3, overflow: 'hidden', marginTop: sp.sm, marginBottom: sp.md },
  fill:     { height: 4, borderRadius: 2 },

  headline: { fontSize: t.md, fontWeight: '800', color: c.text1, marginTop: sp.sm, marginBottom: 4 },
  sub:      { fontSize: t.xs, color: c.text3, lineHeight: 18 },

  ctaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: sp.md },
  cta:      { fontSize: t.xs, fontWeight: '800', color: c.gold, letterSpacing: 0.4 },

  nextLabel:{ fontSize: 9, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  stepRow:  { flexDirection: 'row', alignItems: 'center', gap: sp.md },
  stepLabel:{ fontSize: t.sm, fontWeight: '700', color: c.text1, lineHeight: 19 },
  stepHint: { fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 17 },
  goBtn:    { borderWidth: 1, borderRadius: r.sm, paddingHorizontal: sp.md, paddingVertical: 6 },
  goText:   { fontSize: t.xs, fontWeight: '800' },

  claimBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: r.md, paddingVertical: sp.md, marginTop: sp.md },
  claimText:{ color: '#fff', fontSize: t.sm, fontWeight: '800' },
});
