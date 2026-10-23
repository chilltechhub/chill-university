// src/components/CalmHome.js
// Home's Calm view: the one next step, today's focus, and the two numbers
// that matter most for your account type. Everything else is one tap away
// ("Show all cards"). Switched from Home's own Calm button, Settings →
// Appearance or Make it yours (SETTING_KEYS.HOME_VIEW, synced).
//
// Every number is real, never a placeholder: the focus bar is today's
// Planner items and tasks due today, done over total; the two cards read the
// same rows Home's persona widgets do (src/components/widgets/).

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { getObjective } from '../data/objectives';
import { resumeFirstGoalGuide } from '../logic/useGuidedFirstGoal';
import { useRightNow } from './RightNowCard';
import CalmWeek from './CalmWeek';
import DreamCard from './DreamCard';
import PickPathNote from './PickPathNote';
import StudioCard from './StudioCard';
import TourSpot from './TourSpot';
import TodaysFind from './TodaysFind';
import { useCalmPalette, CalmPanel, CalmHeadline, CalmPill as Pill, CalmTiles, CalmShowAll, calmEyebrow as eyebrow, plural, ago } from './CalmKit';
import { supabase } from '../api/profileScopedClient';
import { isVaultRow } from '../api/captureService';
import { useVaultDocs } from './widgets/EntrepreneurWidgets';
import { getLessonState } from '../logic/lessonProgress';
import { LEVELS, levelDeliverableCount } from '../data/ownershipCurriculum';

// The two cards per account type, in order. A card whose screen this stage
// doesn't show yet gives way to the streak, then life areas.
const TILES = {
  PERSONAL:     ['habits', 'checkins'],
  STUDENT:      ['current', 'lessons'],
  BUSINESS:     ['projects', 'systems'],
  ENTREPRENEUR: ['founder', 'projects'],
};
// Same areas as SystemsCheckWidget.
const SYSTEM_AREAS = ['digital', 'professional'];

export default function CalmHome({
  personaKey, userId, profileId,
  weekday, streakDays,
  activities = [], desk = [],
  focus, plan = [], onOpenDay,
  checkInDue = [], lifeAreaStats = [], activeBuilds = [],
  canOpen = () => true,
  onOpenPick, onDonePick, onOpenGoal, onEditFocus, onOpenScreen, onOpenProfile, onShowAll,
  headerStyle,
  // Today (DASHBOARD_V2, shake-up P3): Calm draws the same board as Full,
  // in the calm style. `order` is the Full layout's visible calm-capable
  // keys (CALM_WIDGETS), in its order; `nextPick` is the shared next step
  // (src/logic/nextStep.js), so both views name the same one. The Studio
  // lives in Make now, so it isn't here.
  v2 = false, order = null, nextPick = null, onActPick, room = null,
}) {
  const { spacing: s } = useTheme();
  const keys = useMemo(() => (TILES[personaKey] || TILES.PERSONAL).filter(k => !v2 || k !== 'streak'), [personaKey, v2]);
  const pal = useCalmPalette();

  // ── The headline: the one next step ──────────────────────────────────────
  // Something timed or late wins; then the goal you're on (or the first goal,
  // same offer as CompassCard); then whatever is for today or top of the desk.
  const { activeObjective: goal, firstGoalId, completedObjectiveIds = [], startFirstGoal } = useAccess();
  const pick = useRightNow(activities, desk);
  const step = goal?.active ? goal.nextStep : null;
  const firstGoal = !goal?.active && getObjective(firstGoalId);
  const offerFirst = firstGoal && !completedObjectiveIds.some(id => getObjective(id)?.intro);
  const urgent = pick && ['now', 'soon', 'late', 'rest'].includes(pick.kind);
  const hero = urgent
    ? { label: pick.label, title: pick.title, ref: pick.item?.ref, kind: pick.kind }
    : step ? { label: `Your goal · ${goal.done}/${goal.total}`, title: step.label, goal: true }
    : offerFirst ? { label: 'Your first goal', title: firstGoal.label, start: true }
    : pick ? { label: pick.label, title: pick.title, ref: pick.item?.ref, kind: pick.kind }
    : null;
  const heroDone = hero?.ref && (hero.ref._src === 'planner' || hero.ref._src === 'task');
  // The guide walks the full board, so Home shows it while the guide runs.
  const startFirst = () => { startFirstGoal(); resumeFirstGoalGuide(); };
  const openHero = hero?.start ? startFirst : hero?.goal ? onOpenGoal : hero?.ref ? () => onOpenPick?.(hero.ref, hero.kind) : null;

  // ── Today's plan, done / total ────────────────────────────────────────────
  const planned = plan.filter(p => !p.skipped);
  const planDone = planned.filter(p => p.completed).length;
  const planPct = planned.length ? Math.round((planDone / planned.length) * 100) : 0;

  // ── Data only some account types need ─────────────────────────────────────
  // Lessons this week: every lesson answered on the account (activity_log,
  // gameId 'lesson:<topic>'), plus ones finished on this device.
  const [lessons, setLessons] = useState(null);
  useFocusEffect(useCallback(() => {
    if (!keys.includes('lessons')) return undefined;
    let alive = true;
    (async () => {
      const since = Date.now() - 7 * 86400000;
      const [st, logged] = await Promise.all([
        getLessonState(userId).catch(() => ({ done: {}, last: null })),
        userId
          ? supabase.from('activity_log').select('gameId:metadata->>gameId').eq('user_id', userId)
            .eq('activity_type', 'QUESTION_ANSWERED').like('metadata->>gameId', 'lesson:%')
            .gte('created_at', new Date(since).toISOString()).limit(1000)
          : { data: [] },
      ]);
      const week = new Set((logged?.data || []).map(r => String(r.gameId).slice('lesson:'.length)));
      Object.entries(st.done || {}).forEach(([k, d]) => { if (d?.at && Date.parse(d.at) >= since) week.add(k); });
      const last = st.last && !st.done?.[st.last.topicKey] ? st.last : null;
      if (alive) setLessons({ count: week.size, last });
    })().catch(() => { if (alive) setLessons({ count: 0, last: null }); });
    return () => { alive = false; };
  }, [userId, keys]));
  const docs = useVaultDocs(keys.includes('founder') ? userId : null, profileId);

  // "Working on": the active project touched most recently; with none, the
  // newest thing in the Knowledge Vault or Capture Inbox (isVaultRow is the
  // Vault's own rule, so the two never disagree).
  const [current, setCurrent] = useState(undefined); // undefined = loading
  useFocusEffect(useCallback(() => {
    if (!keys.includes('current')) return undefined;
    let alive = true;
    (async () => {
      if (!userId) { setCurrent({ project: null, captures: [] }); return; }
      const [proj, caps] = await Promise.all([
        supabase.from('projects').select('id, title, emoji, color, next_action, due_date')
          .eq('user_id', userId).eq('status', 'active').is('deleted_at', null)
          .order('updated_at', { ascending: false }).limit(1),
        supabase.from('captures').select('id, title, type, status, created_at, deleted_at')
          .eq('user_id', userId).is('deleted_at', null)
          .order('created_at', { ascending: false }).limit(30),
      ]);
      const captures = (caps.data || []).filter(r => r.status === 'inbox' || isVaultRow(r));
      if (alive) setCurrent({ project: proj.data?.[0] || null, captures });
    })().catch(() => { if (alive) setCurrent({ project: null, captures: [] }); });
    return () => { alive = false; };
  }, [userId, keys]));

  const tiles = (() => {
    const make = {
      habits: () => {
        const rows = planned.filter(p => p.src === 'planner' && p.cadence === 'daily');
        const done = rows.filter(p => p.completed).length;
        return {
          label: 'Habits', screen: 'PlannerScreen',
          value: rows.length ? `${done}/${rows.length}` : '0',
          unit: rows.length ? 'done today' : 'habits yet',
          sub: rows.length ? (done === rows.length ? 'All done' : null) : 'Add one →',
        };
      },
      current: () => {
        if (current === undefined) return { label: 'Working on', screen: null, value: '…', unit: '' };
        const p = current.project;
        if (p && canOpen('ProjectsScreen')) {
          return {
            label: 'Project', screen: 'ProjectsScreen',
            title: p.title,
            sub: p.next_action ? `Next: ${p.next_action}` : 'No next step set',
            open: () => onOpenScreen?.('ProjectDetail', { project: p }),
          };
        }
        const cap = current.captures.find(r => canOpen(r.status === 'inbox' ? 'CaptureInbox' : 'KnowledgeScreen'));
        if (!cap) return null;
        const inbox = cap.status === 'inbox';
        return {
          label: inbox ? 'Inbox' : 'Vault', screen: inbox ? 'CaptureInbox' : 'KnowledgeScreen',
          title: cap.title || 'Untitled',
          sub: `Added ${ago(cap.created_at)}`,
        };
      },
      lessons: () => {
        const n = lessons ? lessons.count : null;
        const last = lessons?.last;
        return {
          label: 'Learning', screen: 'ClassesStack',
          value: n == null ? '…' : String(n),
          unit: plural(n, 'lesson this week', 'lessons this week'),
          sub: last ? `Pick up: ${last.title}` : n === 0 ? 'Start one →' : null,
        };
      },
      checkins: () => {
        const n = checkInDue.length;
        const first = checkInDue[0];
        // "All current" only means something once an area has been rated.
        const rated = lifeAreaStats.some(a => a.lastCheck);
        return {
          label: 'Life areas', screen: 'LifeAreaScreen',
          value: String(n),
          unit: plural(n, 'check-in due', 'check-ins due'),
          sub: n ? checkInDue.slice(0, 2).map(x => x.area.label).join(', ') : rated ? 'All current' : 'Rate one →',
          open: first
            ? () => onOpenScreen?.('LifeAreaScreen', { areaId: first.area.id, rating: first.rating, lastCheck: first.lastCheck })
            : () => onOpenScreen?.('Library'),
        };
      },
      projects: () => {
        const n = activeBuilds.length;
        const late = activities.filter(a => a._src === 'due' && /late/i.test(a.notes || '')).length;
        const next = activeBuilds.find(p => p.next_action)?.next_action;
        return {
          label: 'Projects', screen: 'ProjectsScreen',
          value: String(n),
          unit: plural(n, 'active project', 'active projects'),
          sub: late ? `${late} late` : next ? `Next: ${next}` : n ? null : 'Start one →',
          warn: late > 0,
        };
      },
      systems: () => {
        const rated = lifeAreaStats.filter(a => SYSTEM_AREAS.includes(a.area.id) && a.rating > 0);
        // Ratings are 1-5 (LifeAreaScreen), so this is an average out of 5.
        const avg = rated.length ? Math.round((rated.reduce((n, a) => n + a.rating, 0) / rated.length) * 10) / 10 : null;
        const ages = rated.map(a => a.days).filter(d => d != null);
        const oldest = ages.length ? Math.max(...ages) : null;
        return {
          label: 'Systems', screen: 'Library',
          value: avg == null ? '—' : `${avg}/5`,
          unit: 'systems rating',
          sub: avg == null ? 'Rate them →' : oldest == null ? null : oldest === 0 ? 'Checked today' : `Checked ${oldest}d ago`,
          warn: oldest != null && oldest >= 14,
        };
      },
      founder: () => {
        const levels = (LEVELS || []).map(l => {
          const total = levelDeliverableCount(l) || 0;
          const done = Math.min(total, (docs || []).filter(d => d.track === l.id && d.status === 'complete').length);
          return { l, total, done };
        }).filter(x => x.total > 0);
        const total = levels.reduce((n, x) => n + x.total, 0);
        const done = levels.reduce((n, x) => n + x.done, 0);
        const current = levels.find(x => x.done < x.total);
        return {
          label: 'Founder path', screen: 'ClassesStack',
          value: docs === null ? '…' : `${done}/${total}`,
          unit: 'deliverables done',
          sub: current ? `Now: ${current.l.short || current.l.title}` : total ? 'All done' : null,
        };
      },
      // Momentum, not a streak (shake-up P5): `streakDays` is days you did
      // something this week (receipts.js momentum). The key stays 'streak'.
      streak: () => ({
        label: 'This week', screen: null, open: onOpenProfile,
        value: String(streakDays || 0),
        unit: plural(streakDays || 0, 'day you did something', 'days you did something'),
        sub: null,
      }),
    };
    const built = {};
    [...keys, 'streak', 'checkins'].forEach(k => { if (!(k in built)) built[k] = make[k](); });
    const ok = (k) => !!built[k] && (!built[k].screen || built[k].screen === 'Library' || canOpen(built[k].screen));
    const shown = keys.filter(ok);
    // Early on a type's own screens may not be open yet (or a card has
    // nothing to show): the streak, then life areas (rating one is
    // everyone's first goal step), fill in.
    // Today (v2) shows no streak: Calm's only number is what's done today.
    (v2 ? ['checkins'] : ['streak', 'checkins']).forEach(k => { if (shown.length < 2 && !shown.includes(k) && ok(k)) shown.push(k); });
    return shown.slice(0, 2).map(k => ({ key: k, ...built[k] }));
  })();

  // ── Today's version of the same pieces (v2) ─────────────────────────────
  const heroBlock = (h) => (
    <View key="nextStep">
      {/* The one next step (the after-welcome tour ends here) */}
      <TourSpot id="calm-next" style={{ marginTop: s.xl, marginBottom: s.sm }}>
        <CalmHeadline pal={pal} onPress={h.onPress}
          label={h.label} title={h.title} a11y={`${h.label}. ${h.title}`} />
      </TourSpot>
      <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.lg }}>
        {h.done && <Pill label="Done" icon="checkmark" onPress={h.done} pal={pal} solid a11y={`Mark ${h.title} done`} />}
        {!!h.onPress && <Pill label={h.action} icon={h.icon} onPress={h.onPress} pal={pal} solid={!h.done} a11y={`${h.action}: ${h.title}`} />}
      </View>
    </View>
  );
  const pickHero = () => {
    if (!nextPick) return { label: 'Today', title: 'One clear next step.', action: 'Plan my day', icon: 'arrow-forward', onPress: () => onOpenScreen?.('PlannerScreen') };
    const ref = nextPick.action?.ref;
    const canTick = ref && (ref._src === 'planner' || ref._src === 'task');
    if (nextPick.kind === 'first') return { label: nextPick.label, title: nextPick.title, action: nextPick.action.label, icon: 'play', onPress: startFirst };
    return { label: nextPick.label, title: nextPick.title, action: nextPick.action.label, icon: 'arrow-forward',
      onPress: () => onActPick?.(nextPick), done: canTick ? () => onDonePick?.(ref) : null };
  };
  const dayBlock = () => (
    <View key="yourDay" style={{ backgroundColor: pal.glass, borderWidth: 1, borderColor: pal.glassEdge, borderRadius: 22, padding: s.lg, marginBottom: s.md }}>
      <TouchableOpacity onPress={onEditFocus} activeOpacity={0.8} accessibilityRole="button"
        accessibilityLabel={focus ? `Today's focus: ${focus}. Change it` : "Set today's focus"}>
        <Text style={{ ...eyebrow, color: pal.eyebrow }}>Today's focus</Text>
        <Text numberOfLines={2} style={{ fontSize: 19, lineHeight: 26, fontWeight: '700', color: focus ? pal.text : pal.text2, marginTop: 8 }}>
          {focus || 'Tap to pick one thing for today'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onOpenScreen?.('PlannerScreen')} activeOpacity={0.8} accessibilityRole="button"
        accessibilityLabel={planned.length ? `Today: ${planned.length} things, ${planDone} done. Open your day` : 'Nothing planned today. Plan your day'}
        style={{ marginTop: s.md }}>
        <Text style={{ fontSize: 13, color: pal.text2 }}>
          {planned.length
            ? <><Text style={{ fontWeight: '800', color: pal.text }}>Today: {planned.length} {planned.length === 1 ? 'thing' : 'things'}</Text> · {planDone} done</>
            : <>Nothing planned today · <Text style={{ fontWeight: '800', color: pal.text }}>Plan →</Text></>}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (v2) {
    const sections = {
      dream: <DreamCard key="dream" userId={userId} variant="calm" pal={pal} />,
      find: <TodaysFind key="find" userId={userId} variant="calm" pal={pal} />,
      nextStep: heroBlock(pickHero()),
      yourDay: dayBlock(),
      // Your room on Today, as a still frame (shake-up P5).
      room: room ? <View key="room">{room}</View> : null,
    };
    return (
      <View style={{ paddingHorizontal: s.lg, paddingTop: s.xs }}>
        <CalmPanel id="calmHomePanel" pal={pal}>
          <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 }, headerStyle]}>
            <Text style={{ fontSize: 13, color: pal.text2, ...eyebrow, fontWeight: '600' }}>{weekday}</Text>
          </View>
          <PickPathNote userId={userId} style={{ marginHorizontal: 0 }} />
          {(order || ['dream', 'nextStep', 'yourDay', 'find']).map(k => sections[k] || null)}
          {/* Up to two of the path's own tiles */}
          <CalmTiles tiles={tiles} pal={pal} onOpenScreen={onOpenScreen} />
        </CalmPanel>
        <CalmWeek userId={userId} refreshKey={plan} onOpenDay={onOpenDay} openLabel="Open day →" />
        <CalmShowAll label="Show my desk" a11y="Show every card on Today" onPress={onShowAll} />
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: s.lg, paddingTop: s.md }}>
      <CalmPanel id="calmHomePanel" pal={pal}>

        {/* Day · days this week (momentum, never a streak) */}
        <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 20 }, headerStyle]}>
          <Text style={{ fontSize: 13, color: pal.text2, ...eyebrow, fontWeight: '600' }}>{weekday}</Text>
          {(streakDays || 0) > 0 && (
            <TouchableOpacity onPress={onOpenProfile} hitSlop={8} accessibilityRole="button"
              accessibilityLabel={`You did something on ${streakDays} day${streakDays === 1 ? '' : 's'} this week. Open You`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="checkmark-circle" size={14} color={pal.eyebrow} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: pal.text }}>{streakDays} day{streakDays === 1 ? '' : 's'} this week</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* The life they want, above the next step (docs/north-star.md) */}
        <PickPathNote userId={userId} style={{ marginHorizontal: 0 }} />
        <DreamCard userId={userId} variant="calm" pal={pal} />
        <StudioCard variant="calm" pal={pal} />
        <TodaysFind userId={userId} variant="calm" pal={pal} />

        {/* The one next step (the after-welcome tour ends here) */}
        <TourSpot id="calm-next" style={{ marginTop: s.xl, marginBottom: s.sm }}>
          <CalmHeadline pal={pal} onPress={openHero}
            label={hero ? hero.label : 'Today'} title={hero ? hero.title : 'One clear next step.'}
            a11y={hero ? `${hero.label}. ${hero.title}` : 'Nothing planned yet'} />
        </TourSpot>
        <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.lg }}>
          {heroDone && (
            <Pill label="Done" icon="checkmark" onPress={() => onDonePick?.(hero.ref)} pal={pal} solid
              a11y={`Mark ${hero.title} done`} />
          )}
          {hero?.start && <Pill label={firstGoal.estimate ? `Start · ${firstGoal.estimate.toLowerCase()}` : 'Start'} icon="play" onPress={startFirst} pal={pal} solid />}
          {openHero && !hero?.start && hero?.kind !== 'rest' && <Pill label="Open" icon="arrow-forward" onPress={openHero} pal={pal} a11y={`Open ${hero.title}`} />}
          {!hero && <Pill label="Plan my day" icon="arrow-forward" onPress={() => onOpenScreen?.('PlannerScreen')} pal={pal} solid />}
        </View>

        {/* Today's focus + how much of today's plan is done */}
        <View style={{ backgroundColor: pal.glass, borderWidth: 1, borderColor: pal.glassEdge, borderRadius: 22, padding: s.lg }}>
          <TouchableOpacity onPress={onEditFocus} activeOpacity={0.8} accessibilityRole="button"
            accessibilityLabel={focus ? `Today's focus: ${focus}. Change it` : "Set today's focus"}>
            <Text style={{ ...eyebrow, color: pal.eyebrow }}>Today's focus</Text>
            <Text numberOfLines={2} style={{ fontSize: 19, lineHeight: 26, fontWeight: '700', color: focus ? pal.text : pal.text2, marginTop: 8 }}>
              {focus || 'Tap to pick one thing for today'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onOpenScreen?.('PlannerScreen')} activeOpacity={0.8} accessibilityRole="button"
            accessibilityLabel={planned.length ? `${planDone} of ${planned.length} planned today done. Open the Planner` : 'Nothing planned today. Open the Planner'}
            style={{ marginTop: s.md }}>
            {planned.length > 0 && (
              <View style={{ height: 8, borderRadius: 4, backgroundColor: pal.track, overflow: 'hidden' }}>
                <View style={{ width: `${Math.max(planPct, planDone ? 4 : 0)}%`, height: '100%', borderRadius: 4, backgroundColor: pal.fill }} />
              </View>
            )}
            <Text style={{ fontSize: 13, color: pal.text2, marginTop: 8 }}>
              {planned.length
                ? <><Text style={{ fontWeight: '800', color: pal.text }}>{planDone} of {planned.length}</Text> planned today done</>
                : <>Nothing planned today · <Text style={{ fontWeight: '800', color: pal.text }}>Plan →</Text></>}
            </Text>
          </TouchableOpacity>
        </View>

        {/* The two numbers for your account type */}
        <CalmTiles tiles={tiles} pal={pal} onOpenScreen={onOpenScreen} />
      </CalmPanel>

      <CalmWeek userId={userId} refreshKey={plan} onOpenDay={onOpenDay} />

      <CalmShowAll label="Show all cards" a11y="Show all your Home cards" onPress={onShowAll} />
    </View>
  );
}
