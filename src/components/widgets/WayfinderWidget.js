// src/components/widgets/WayfinderWidget.js
//
// Home's window into Wayfinder (src/screens/library/wayfinder/). Three honest
// states and nothing dressed up as a measurement:
//
//   never started — the invitation, said plainly
//   partway       — how far in, and a way back to the same question
//   has a map     — their own "who I'm becoming" words (or their leading
//                   themes if they haven't written those yet) and the one
//                   experiment on the go, with a direct "how did it go?"

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { loadWayfinder } from '../../api/wayfinderService';
import { findItem, findRung } from '../../data/wayfinderDeeper';
import { SITUATION_MAP } from '../../data/wayfinderSituations';
import {
  progressOf, composeStatement, leadingThemes, interestScores, isFlatProfile,
} from '../../logic/wayfinderScoring';
import { situationProgress } from '../../logic/wayfinderDeeper';
import WidgetCard, { Bar } from './WidgetCard';

export function WayfinderWidget({ userId, onOpen }) {
  const { colors: c, typography: t, spacing: s, radius: r, style: ui, accent: themeAccent } = useTheme();
  const [state, setState] = useState(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    loadWayfinder(userId)
      .then(loaded => { if (alive) setState(loaded); })
      .catch(() => { if (alive) setState(undefined); });
    return () => { alive = false; };
  }, [userId]));

  const accent = themeAccent.primary;
  const progress = state ? progressOf(state) : null;
  const situations = (state?.situations || []).map(id => SITUATION_MAP[id]).filter(Boolean);
  const neverStarted = state === undefined
    || (state && !progress.hasMap && state.stage === 'intro' && progress.done === 0 && !situations.length);

  // Someone who picked a situation has a plan even without a map — and an
  // urgent one should be one tap from the help, not buried in a sub-screen.
  const planLine = situations.length ? (
    <TouchableOpacity
      onPress={() => onOpen?.({ stage: 'plan' })}
      accessibilityRole="button"
      style={{ marginBottom: s.md, paddingBottom: s.md, borderBottomWidth: 0.5, borderBottomColor: c.border }}
    >
      {situations.map(sit => {
        const { done, total } = situationProgress(state, sit.id);
        return (
          <Text key={sit.id} style={{ fontSize: t.sm, color: sit.urgent ? c.error : c.text2, marginBottom: 2 }} numberOfLines={1}>
            {sit.emoji} {sit.urgent ? 'Help is one tap away' : `${sit.label} · ${done}/${total} steps`}
          </Text>
        );
      })}
    </TouchableOpacity>
  ) : null;

  if (state === null) {
    return <WidgetCard title="Wayfinder" icon="navigate-circle-outline" accent={accent} loading />;
  }

  if (neverStarted) {
    return (
      <WidgetCard
        title="Wayfinder"
        icon="navigate-circle-outline"
        accent={accent}
        empty={{
          text: 'Not sure what you want to do — or who you want to be? Most people aren’t. Wayfinder helps you find out by trying small things, not by guessing.',
          cta: 'Start · about 10 min',
          onPress: () => onOpen?.(),
        }}
      />
    );
  }

  if (!progress.hasMap) {
    return (
      <WidgetCard title="Wayfinder" icon="navigate-circle-outline" accent={accent} action="Continue →" onAction={() => onOpen?.()}>
        {planLine}
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>You’re partway to your map</Text>
        <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4 }}>
          Step {Math.min(progress.done + 1, progress.total)} of {progress.total} — it picks up right where you left off.
        </Text>
        <Bar pct={(progress.done / progress.total) * 100} color={accent} />
      </WidgetCard>
    );
  }

  const statement = composeStatement(state.statement);
  const interest = interestScores(state.interests);
  const leading = isFlatProfile(interest) ? [] : leadingThemes(interest);
  const active = state.experiments.find(x => x.status === 'active');
  const tried = state.experiments.filter(x => x.status === 'done').length;

  return (
    <WidgetCard title="Who I’m becoming" icon="navigate-circle-outline" accent={accent} action="My map →" onAction={() => onOpen?.()}>
      {planLine}
      {statement ? (
        <Text style={{ fontSize: t.sm + 1, color: c.text1, lineHeight: 21, fontStyle: 'italic' }} numberOfLines={7}>{statement}</Text>
      ) : leading.length ? (
        <Text style={{ fontSize: t.sm + 1, color: c.text2, lineHeight: 20 }}>
          You lean toward {leading.map(l => `${l.theme.emoji} ${l.theme.label.toLowerCase()}`).join(' and ')}.
        </Text>
      ) : (
        <Text style={{ fontSize: t.sm + 1, color: c.text2, lineHeight: 20 }}>
          Nothing jumped out yet — trying a few different things will say more than more questions.
        </Text>
      )}

      <View style={{ marginTop: s.md, paddingTop: s.md, borderTopWidth: 0.5, borderTopColor: c.border }}>
        {active ? (
          <>
            <Text style={{ fontSize: t.xs, color: c.text3, ...ui.eyebrow }}>
              Experiment · {findRung(findItem(active.pathId)?.kind, active.rung)?.label} · {findItem(active.pathId)?.title}
            </Text>
            <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 4, lineHeight: 18 }} numberOfLines={2}>{active.text}</Text>
            <TouchableOpacity
              onPress={() => onOpen?.({ reflectId: active.id })}
              accessibilityRole="button"
              style={{ marginTop: s.sm, alignSelf: 'flex-start', paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: r.full, backgroundColor: accent }}
            >
              <Text style={{ fontSize: t.xs, color: themeAccent.onPrimary, fontWeight: t.bold }}>Did it? Say how it went</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => onOpen?.()} accessibilityRole="button">
            <Text style={{ fontSize: t.sm, color: c.text2 }}>
              {tried
                ? `${tried} experiment${tried === 1 ? '' : 's'} tried. `
                : ''}
              <Text style={{ color: accent, fontWeight: t.bold }}>Pick your next small experiment →</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </WidgetCard>
  );
}
