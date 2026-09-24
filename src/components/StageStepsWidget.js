// src/components/StageStepsWidget.js
// "What opens next, and what opens it" — the stage layer, on Home.
//
// The app opens ten stages at a time (src/data/experienceStages.js) and the
// Compass screen has always said so, but Home never did. That left the one
// question a new account actually has — why can I only see six things? —
// answered on a screen you have to go and find. Worse, "stage" and "goal"
// read as the same word from the outside, which is the confusion this card
// exists to end: it names the stage, says what the next one brings, and then
// gives the two concrete things that open it.
//
// There are exactly two, and they are the same two for everybody (see
// nextStageNeeds in src/logic/experienceStage.js):
//
//   1. finish the goal in flight — so the goal's own remaining work is
//      quoted here rather than described
//   2. gain a level — which is training, and nothing else
//
// Deliberately NOT a second copy of the goal checklist: that is GoalStepsWidget,
// which usually sits right above this. This one quotes the next step and the
// tally, and sends you to the real list for the rest.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useAccess } from '../../context/AccessContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { stageMeta } from '../logic/experienceStage';
import { MAX_STAGE } from '../data/experienceStages';
import { goToScreen } from '../logic/appRoutes';
import WidgetCard from './widgets/WidgetCard';

export default function StageStepsWidget() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { showSubtext } = useUIPrefs();
  const { stage, nextStage, activeObjective, experienceMode, loading } = useAccess();
  const { activeType } = useProfiles();

  if (loading) return null;

  const here = stageMeta(stage, activeType);
  const live = !!activeObjective?.active;

  // "Show me everything" means the stages aren't deciding anything any more,
  // so a card about what they open next would be describing a machine that
  // has been switched off.
  if (experienceMode === 'full') {
    return (
      <WidgetCard title="Your stage" icon="layers-outline" accent={accent.primary}
        action="Compass →" onAction={() => navigation.navigate('Compass')}>
        <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 19 }}>
          You chose to see everything, so nothing is waiting on a stage. Switch back on the Compass and the
          app goes by your progress again.
        </Text>
      </WidgetCard>
    );
  }

  if (!nextStage) {
    return (
      <WidgetCard title="Your stage" icon="layers-outline" accent={accent.primary}
        action="Compass →" onAction={() => navigation.navigate('Compass')}>
        <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 19 }}>
          Stage {stage} of {MAX_STAGE} — {here.label}. That's all of it: every tool, game and widget is on
          the map.
        </Text>
      </WidgetCard>
    );
  }

  // The two ways through, in the order they're worth doing. Finishing the
  // goal is first because it's the one already in progress.
  const routes = [
    live
      ? {
          key: 'goal',
          icon: 'flag-outline',
          label: activeObjective.objective.label,
          detail: activeObjective.complete
            ? `All ${activeObjective.total} steps done — claim it on the Compass.`
            : `${activeObjective.done} of ${activeObjective.total} steps. Next: ${activeObjective.nextStep?.label || 'keep going'}.`,
          cta: activeObjective.complete ? 'Claim' : 'Open',
          onPress: () => {
            const screen = !activeObjective.complete && activeObjective.nextStep?.screen;
            if (screen) goToScreen(navigation, screen);
            else navigation.navigate('Compass');
          },
        }
      : {
          key: 'goal',
          icon: 'flag-outline',
          label: 'Start a goal',
          detail: 'One goal, a few steps. Finishing any of them opens the next stage.',
          cta: 'Pick one',
          onPress: () => navigation.navigate('Compass'),
        },
    {
      key: 'level',
      icon: 'trending-up-outline',
      label: 'Gain a level',
      detail: 'Training rounds are what levels you up. Either route opens the stage — you only need one.',
      cta: 'Train',
      onPress: () => goToScreen(navigation, 'Training'),
    },
  ];

  return (
    <WidgetCard
      title={`Stage ${stage} of ${MAX_STAGE} · ${here.label}`}
      icon="layers-outline"
      accent={accent.primary}
      action="Compass →"
      onAction={() => navigation.navigate('Compass')}
    >
      {/* What's behind the next door, before what opens it — the reason
          comes before the ask, or it reads as a chore list. */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: s.md }}>
        <Ionicons name="lock-open-outline" size={14} color={accent.primary} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Next: {nextStage.label}</Text>
          {showSubtext && !!nextStage.blurb && (
            <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2, lineHeight: 17 }}>{nextStage.blurb}</Text>
          )}
        </View>
      </View>

      <Text style={{ fontSize: 10, color: c.text4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginBottom: 6 }}>
        Next steps
      </Text>

      {routes.map((route, i) => (
        <View
          key={route.key}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: s.sm,
            paddingVertical: s.sm,
            borderTopWidth: i === 0 ? 0 : 0.5, borderTopColor: c.border,
          }}
        >
          <Ionicons name={route.icon} size={15} color={c.text3} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }} numberOfLines={1}>{route.label}</Text>
            <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 1, lineHeight: 16 }}>{route.detail}</Text>
          </View>
          <TouchableOpacity
            onPress={route.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${route.cta}: ${route.label}`}
            style={{ borderWidth: 1, borderColor: accent.primary, borderRadius: r.sm, paddingHorizontal: 10, paddingVertical: 4 }}
          >
            <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>{route.cta}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </WidgetCard>
  );
}
