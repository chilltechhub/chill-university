// src/screens/library/wayfinder/WayfinderDeeperSections.js
//
// Results for Wayfinder's "go deeper" sections. Each one renders both on the
// map and live inside its own step, so answering shows the payoff right away
// instead of making someone finish and go looking for it.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { FONTS } from '../../../theme';
import { SITUATION_MAP } from '../../../data/wayfinderSituations';
import {
  TRAITS, LEARNING_PREFS, LEARNING_BLOCKERS, LIFE_ZONE_MAP, QUALITY_MAP,
} from '../../../data/wayfinderDeeper';
import { THEME_MAP } from '../../../data/wayfinder';
import {
  personalityScores, fourLetter, personalityTips, learningPlan, situationProgress,
} from '../../../logic/wayfinderDeeper';
import { Card, Kicker, Pill, ResourceRow, SectionTitle } from './WayfinderUI';

// ─── Urgent help ────────────────────────────────────────────────────────────
// Shown at the very top of the situation step the moment an urgent situation
// is ticked, and pinned to the top of the map for as long as it's selected.
export function UrgentHelp({ situations }) {
  const { colors: c } = useTheme();
  if (!situations.length) return null;
  const resources = [];
  const seen = new Set();
  situations.forEach(s => s.resources.forEach(res => {
    if (seen.has(res.label)) return;
    seen.add(res.label);
    resources.push(res);
  }));
  return (
    <Card style={{ borderWidth: 1.5, borderColor: c.error, backgroundColor: c.error + '0d' }}>
      <Kicker color={c.error}>Help right now</Kicker>
      {situations.map(s => (
        <Text key={s.id} style={{ fontSize: 15, color: c.text1, lineHeight: 22, marginBottom: 8, fontWeight: '600' }}>{s.heard}</Text>
      ))}
      {resources.map((res, i) => <ResourceRow key={res.label} resource={res} last={i === resources.length - 1} />)}
    </Card>
  );
}

// ─── Situation plan ─────────────────────────────────────────────────────────
export function SituationPlan({ situation, done = [], onToggleStep, onOpenApp }) {
  const { colors: c, radius: r } = useTheme();
  const doneSet = new Set(done);

  const StepList = ({ items, prefix, title }) => (
    <View style={{ marginTop: 12 }}>
      <Kicker>{title}</Kicker>
      {items.map((text, i) => {
        const key = `${prefix}${i}`;
        const on = doneSet.has(key);
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onToggleStep(situation.id, key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={{ flexDirection: 'row', gap: 10, paddingVertical: 7 }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: on ? c.success : c.border, backgroundColor: on ? c.success : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              {on && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: on ? c.text3 : c.text1, lineHeight: 20, textDecorationLine: on ? 'line-through' : 'none' }}>{text}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Card style={situation.urgent ? { borderColor: c.error, borderWidth: 1.5 } : null}>
      <Text style={{ fontSize: 13, color: c.text3, marginBottom: 4 }}>{situation.emoji} {situation.label}</Text>
      <Text style={{ fontSize: 16, color: c.text1, lineHeight: 23, fontWeight: '600' }}>{situation.heard}</Text>

      <StepList items={situation.now} prefix="n" title="This week" />
      {situation.next.length > 0 && <StepList items={situation.next} prefix="x" title="After that" />}

      {situation.resources.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <Kicker>Free help</Kicker>
          {situation.resources.map((res, i) => <ResourceRow key={res.label} resource={res} last={i === situation.resources.length - 1} />)}
        </View>
      )}

      {situation.app.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <Kicker>In this app</Kicker>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {situation.app.map(link => (
              <TouchableOpacity
                key={link.label}
                onPress={() => onOpenApp(link)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: r.full, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0 }}
              >
                <Ionicons name={link.icon} size={14} color={c.teal} />
                <Text style={{ fontSize: 12.5, color: c.text1, fontWeight: '600' }}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={{ marginTop: 16, flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: c.border }}>
        <Ionicons name="navigate-outline" size={16} color={c.teal} style={{ marginTop: 2 }} />
        <Text style={{ flex: 1, fontSize: 14, color: c.text2, lineHeight: 20, fontStyle: 'italic' }}>{situation.direction}</Text>
      </View>
    </Card>
  );
}

export function SituationsSummary({ state, onOpen }) {
  const { colors: c } = useTheme();
  const list = (state.situations || []).map(id => SITUATION_MAP[id]).filter(Boolean);
  if (!list.length) return null;
  return (
    <>
      <SectionTitle title="Where you are right now" sub="Your plan for what’s going on — tap to see it." />
      {list.map(s => {
        const { done, total } = situationProgress(state, s.id);
        return (
          <TouchableOpacity key={s.id} onPress={onOpen} activeOpacity={0.85} accessibilityRole="button">
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, ...(s.urgent ? { borderColor: c.error, borderWidth: 1.5 } : null) }}>
              <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: c.text1 }}>{s.label}</Text>
                <Text style={{ fontSize: 12.5, color: done === total ? c.success : c.text3, marginTop: 2 }}>
                  {done === total ? 'Every step done' : `${done} of ${total} steps done`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color={c.text4} />
            </Card>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

// ─── Personality ────────────────────────────────────────────────────────────
export function PersonalitySection({ answers }) {
  const { colors: c } = useTheme();
  const scores = personalityScores(answers);
  const code = fourLetter(scores);
  if (!code) return null;
  const tips = personalityTips(scores);
  const close = code.letters.filter(l => l.close);

  return (
    <Card>
      <Kicker>Closest four-letter match</Kicker>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
        {code.letters.map(l => (
          <View key={l.trait} style={{ width: 46, height: 54, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: l.close ? c.bg2 : c.teal + '1f', borderWidth: 1, borderColor: l.close ? c.border : c.teal + '66', borderStyle: l.close ? 'dashed' : 'solid' }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: l.close ? c.text3 : c.teal, fontFamily: FONTS.display }}>{l.letter}</Text>
          </View>
        ))}
      </View>
      {close.length > 0 && (
        <Text style={{ fontSize: 12.5, color: c.text3, lineHeight: 18, marginBottom: 4 }}>
          Dashed letters are close to the middle — you could read as {close.map(l => `${l.letter} or ${l.other}`).join(', ')}. That’s normal, and it’s exactly where four-letter types tend to flip.
        </Text>
      )}
      <Text style={{ fontSize: 12, color: c.text4, lineHeight: 17, marginBottom: 14 }}>
        Translated from the Big Five, the personality model researchers actually use. It isn’t the official MBTI® assessment, and it describes tendencies — not a box.
      </Text>

      {TRAITS.map(trait => {
        const score = scores[trait.id];
        if (score === null) return null;
        return (
          <View key={trait.id} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: c.text1, marginBottom: 6 }}>{trait.name}</Text>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: c.bg2 }}>
              <View style={{ position: 'absolute', left: `${Math.min(97, Math.max(0, score))}%`, top: -4, width: 16, height: 16, marginLeft: -8, borderRadius: 8, backgroundColor: c.teal, borderWidth: 2, borderColor: c.bg1 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 11.5, color: score < 50 ? c.text1 : c.text3 }}>{trait.low}</Text>
              <Text style={{ fontSize: 11.5, color: score >= 50 ? c.text1 : c.text3 }}>{trait.high}</Text>
            </View>
          </View>
        );
      })}

      <Kicker style={{ marginTop: 4 }}>How you work best</Kicker>
      {tips.map(({ trait, tip }) => (
        <View key={trait.id} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <Ionicons name="bulb-outline" size={15} color={c.gold} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, fontSize: 13.5, color: c.text2, lineHeight: 20 }}>
            <Text style={{ fontWeight: '700', color: c.text1 }}>{trait.name}: </Text>{tip}
          </Text>
        </View>
      ))}
    </Card>
  );
}

// ─── Learning ───────────────────────────────────────────────────────────────
export function LearningSection({ learning, onOpenLink, onUseForRecs, canUseForRecs, usedForRecs }) {
  const { colors: c } = useTheme();
  const plan = learningPlan(learning);
  const prefs = (learning.prefs || []).map(id => LEARNING_PREFS.find(p => p.id === id)).filter(Boolean);

  return (
    <Card>
      {prefs.length > 0 && (
        <>
          <Kicker>You like learning by</Kicker>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {prefs.map(p => <Pill key={p.id} text={`${p.emoji} ${p.label}`} color={c.text1} />)}
          </View>
        </>
      )}
      <Text style={{ fontSize: 13, color: c.text3, lineHeight: 19, marginBottom: 12 }}>
        You may have heard people are “visual” or “hands-on” learners and should stick to that. When researchers tested it, matching lessons to a style didn’t help people learn more. Your preferences still matter — they’re what keeps you going. These make learning stick for everyone:
      </Text>
      {plan.map(({ tech, how, matchedBlockers }) => (
        <View key={tech.id} style={{ paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: c.border }}>
          <Text style={{ fontSize: 14.5, fontWeight: '700', color: c.text1 }}>{tech.title}</Text>
          <Text style={{ fontSize: 13.5, color: c.text2, lineHeight: 20, marginTop: 3 }}>{how}</Text>
          <Text style={{ fontSize: 12.5, color: c.text3, lineHeight: 18, marginTop: 3 }}>
            {matchedBlockers.length
              ? `Helps with “${matchedBlockers.map(id => LEARNING_BLOCKERS.find(x => x.id === id)?.label).join('” and “')}.” `
              : ''}{tech.why}
          </Text>
          {tech.app && (
            <TouchableOpacity onPress={() => onOpenLink(tech.app)} style={{ marginTop: 6, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 13, color: c.teal, fontWeight: '600' }}>{tech.app.label} →</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      {canUseForRecs && (
        <TouchableOpacity onPress={onUseForRecs} disabled={usedForRecs} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, opacity: usedForRecs ? 0.6 : 1 }}>
          <Ionicons name={usedForRecs ? 'checkmark-circle' : 'sparkles-outline'} size={16} color={c.teal} />
          <Text style={{ fontSize: 13.5, color: c.teal, fontWeight: '700' }}>
            {usedForRecs ? 'Using these for your recommendations' : 'Use my preferences for app recommendations'}
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

// ─── Life beyond work ───────────────────────────────────────────────────────
export function LifePathCard({ result, activeHere, onPress }) {
  const { colors: c, radius: r } = useTheme();
  const { path, reasons } = result;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: 14, borderWidth: 1, borderColor: activeHere ? c.teal + '88' : c.border, marginBottom: 10 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {path.themes.map(id => <View key={id} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: THEME_MAP[id].color }} />)}
          {!path.themes.length && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.purple }} />}
        </View>
        <Text style={{ flex: 1, fontSize: 15.5, fontWeight: '700', color: c.text1 }}>{path.title}</Text>
        <Ionicons name="chevron-forward" size={17} color={c.text4} />
      </View>
      <Text style={{ fontSize: 13, color: c.text2, lineHeight: 19, marginTop: 6 }} numberOfLines={2}>{path.what}</Text>
      {(activeHere || reasons.length > 0) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {activeHere && <Pill text="In progress" color={c.teal} />}
          {reasons.slice(0, 2).map(rs => <Pill key={rs.text} text={rs.text} color={c.text3} />)}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function LifeSection({ state, picks, onOpenPath, onPractice, onEdit, showHeader = true }) {
  const { colors: c, radius: r } = useTheme();
  const zones = state.life?.zones || [];
  const qualities = state.life?.qualities || [];
  const active = new Set(state.experiments.filter(x => x.status === 'active').map(x => x.pathId));
  const doneQualities = new Set(state.experiments.filter(x => x.status === 'done').map(x => x.pathId));
  const started = !!state.life?.doneAt || zones.length > 0 || qualities.length > 0;

  return (
    <>
      {showHeader && (
        <SectionTitle
          title="Beyond work: ways to live it"
          sub={started ? 'Direction isn’t only about a job. These fit what pulls you and what you want to change.' : 'Direction isn’t only about a job. A few that fit what pulls you — tell us more to sharpen them.'}
        />
      )}

      {zones.length > 0 && (
        <Card tone="inset" style={{ paddingVertical: 12 }}>
          <Kicker>Where you want life to feel different</Kicker>
          {zones.map(id => (
            <Text key={id} style={{ fontSize: 13.5, color: c.text1, lineHeight: 20, marginBottom: 2 }}>
              {LIFE_ZONE_MAP[id].emoji} <Text style={{ fontWeight: '700' }}>{LIFE_ZONE_MAP[id].label}</Text>
              {state.life.wants?.[id] ? <Text style={{ color: c.text2 }}> — {state.life.wants[id]}</Text> : null}
            </Text>
          ))}
        </Card>
      )}

      {picks.map(res => (
        <LifePathCard key={res.path.id} result={res} activeHere={active.has(res.path.id)} onPress={() => onOpenPath(res.path.id)} />
      ))}

      {qualities.length > 0 && (
        <>
          <Kicker style={{ marginTop: 8 }}>Who you want to be — one practice each</Kicker>
          {qualities.map(id => {
            const q = QUALITY_MAP[`q_${id}`];
            const itemId = `q_${id}`;
            const inProgress = active.has(itemId);
            return (
              <Card key={id} style={{ paddingVertical: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: c.text1 }}>{q.emoji} {q.label}</Text>
                <Text style={{ fontSize: 13.5, color: c.text2, lineHeight: 20, marginTop: 4 }}>{q.practice}</Text>
                <TouchableOpacity
                  onPress={() => onPractice(id)}
                  disabled={inProgress}
                  style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: r.full, borderWidth: 1, borderColor: c.teal, backgroundColor: inProgress ? c.teal + '18' : 'transparent' }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: c.teal }}>
                    {inProgress ? 'Practicing this week' : doneQualities.has(itemId) ? 'Practice again' : 'Try it this week'}
                  </Text>
                </TouchableOpacity>
              </Card>
            );
          })}
        </>
      )}

      {!started && onEdit && (
        <TouchableOpacity onPress={onEdit} activeOpacity={0.85}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: c.teal + '77' }}>
            <Ionicons name="leaf-outline" size={22} color={c.teal} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '700', color: c.text1 }}>What do you want outside of work?</Text>
              <Text style={{ fontSize: 12.5, color: c.text3, marginTop: 2 }}>Pick what to change and who you want to be · 2 min</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={c.teal} />
          </Card>
        </TouchableOpacity>
      )}
    </>
  );
}

// ─── Go deeper cards ────────────────────────────────────────────────────────
export function GoDeeper({ items, onOpen }) {
  const { colors: c, radius: r } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
      {items.map(item => (
        <TouchableOpacity
          key={item.stage}
          onPress={() => onOpen(item.stage)}
          activeOpacity={0.85}
          accessibilityRole="button"
          style={{ width: '48%', flexGrow: 1, backgroundColor: c.bg1, borderRadius: r.md, padding: 12, borderWidth: 1, borderColor: item.done ? c.success + '66' : c.border }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Ionicons name={item.icon} size={18} color={c.teal} />
            {item.done && <Ionicons name="checkmark-circle" size={16} color={c.success} />}
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: c.text1, marginTop: 8 }}>{item.title}</Text>
          <Text style={{ fontSize: 12, color: c.text3, marginTop: 2, lineHeight: 16 }}>{item.done ? item.doneLabel : item.sub}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

