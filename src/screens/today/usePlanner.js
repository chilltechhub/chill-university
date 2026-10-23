// src/screens/today/usePlanner.js
// The Planner's state and actions, in one hook, so the old Planner screen
// and Today (the Planner as the dashboard, docs/shake-up-plan-2026-10-21.md
// P3) run the same code: the day and view, the life-area filter, the add and
// edit sheets, the item sheet, links in (todayParams.js), repeats, phone
// sync, the .ics export and "Tidy up duplicates".
//
// `calendarScope`: Today's Week and Month use the calendar's profile scope
// (its 'all' default), so people who relied on the calendar showing every
// profile still see every profile there (§3.4). The Day keeps the
// Planner's own scope.
//
// PlannerSheets renders the sheets the hook opens.

import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserProgress } from '../../../context/UserProgressContext';
import { useAccess } from '../../../context/AccessContext';
import { useProfiles } from '../../../context/ProfileAccountsContext';
import { supabase } from '../../api/profileScopedClient';
import { getInstances, extendRepeatingPlans, deleteInstances, getInstancesBetween } from '../../api/plannerService';
import { duplicateIds } from '../../logic/plannerLayout';
import useViewScope, { SCOPE_PROFILE, SCOPE_ALL } from '../../logic/useViewScope';
import { syncPlansToPhoneSoon } from '../../api/phoneCalendar';
import { buildIcs } from '../../logic/calendarExport';
import { shareFile } from '../../logic/shareFile';
import { todayParamsAction } from '../../logic/todayParams';
import PlanDetailSheet from '../../components/PlanDetailSheet';
import { PhoneCalendarSheet } from '../../components/PhoneCalendar';
import { TIME_MODE_KEY, toISO, addDays, getWeekDays, goalIdeaFor } from './plannerShared';
import InstanceModal from './InstanceModal';
import SidePanel from './SidePanel';
import { plannerMenuItems, AreaFilterSheet, GuestSignInSheet } from './PlannerOptions';

// `enabled` false: mounted but asleep (Home with DASHBOARD_V2 off), so it
// reads no links, syncs nothing and tops nothing up.
export default function usePlanner({ route, navigation, calendarScope = false, enabled = true } = {}) {
  const { signalAction, activeObjective, lastSignalDetail } = useAccess();
  const { user: signedInUser, profile: progressProfile } = useUserProgress();
  const { profiles, active: activeProfile } = useProfiles();

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('Daily');
  const [anchor, setAnchor] = useState(() => new Date());
  const [activeAreas, setAreas] = useState(() => new Set());
  const [panelOpen, setPanel] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [phoneCalOpen, setPhoneCalOpen] = useState(false);
  const [refreshKey, setRefresh] = useState(0);
  const [detail, setDetail] = useState(null);
  const [modalTime, setModalTime] = useState(null);
  const [editInst, setEditInst] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [addArea, setAddArea] = useState(null);
  const [reviewAt, setReviewAt] = useState(0);
  const bump = useCallback(() => setRefresh(k => k + 1), []);

  // The Planner defaults to this profile only (a task list is context
  // work); the calendar to every profile (you only have one actual day).
  // See useViewScope.js.
  const plannerScope = useViewScope('planner', SCOPE_PROFILE);
  const calScope = useViewScope('calendar', SCOPE_ALL);
  const scope = calendarScope && view !== 'Daily' ? calScope : plannerScope;
  const { showingAll, toggle: toggleScope } = scope;

  // Re-read when the account changes, so signing in from a guest prompt
  // opens the account's plans without leaving the screen.
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user ? user.id : null);
      setLoading(false);
    });
  }, [signedInUser?.id]);

  // Plans copied to the phone's calendar stay in step: a burst of changes
  // gathers into one sync (phoneCalendar.js syncPlansToPhoneSoon), so Today
  // refreshing often still syncs at most once per change.
  useEffect(() => { if (enabled && userId) syncPlansToPhoneSoon(userId); }, [enabled, userId, refreshKey]);

  // Repeating habits keep going past the days first written for them. Once
  // a day (extendRepeatingPlans keeps the date); redraws only if it added.
  useEffect(() => {
    if (!enabled || !userId) return;
    extendRepeatingPlans(userId)
      .then(added => { if (added) bump(); })
      .catch(e => console.warn('planner top-up', e?.message));
  }, [enabled, userId, activeProfile?.id, bump]);

  // By time of day unless the person switched to the list; remembered here.
  const [timeMode, setTimeModeState] = useState(true);
  const setTimeMode = useCallback((next) => setTimeModeState(prev => {
    const value = typeof next === 'function' ? next(prev) : next;
    AsyncStorage.setItem(TIME_MODE_KEY, value ? 'time' : 'list').catch(() => {});
    return value;
  }), []);
  useEffect(() => {
    AsyncStorage.getItem(TIME_MODE_KEY).then(v => { if (v === 'list') setTimeModeState(false); }).catch(() => {});
  }, []);

  const toggleArea = (key) => {
    if (key === 'all') { setAreas(new Set()); return; }
    setAreas(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  };

  const today = new Date();
  const isToday = toISO(anchor) === toISO(today);
  const weekDays = getWeekDays(anchor);
  // Is today on screen? (Says when "Back to today" means something.)
  const showsToday = view === 'Daily' ? isToday
    : view === 'Weekly' ? weekDays.some(d => toISO(d) === toISO(today))
      : anchor.getMonth() === today.getMonth() && anchor.getFullYear() === today.getFullYear();
  const step = (dir) => {
    const d = new Date(anchor);
    if (view === 'Daily') d.setDate(d.getDate() + dir);
    if (view === 'Weekly') d.setDate(d.getDate() + 7 * dir);
    if (view === 'Monthly') d.setMonth(d.getMonth() + dir);
    setAnchor(d);
  };
  const onDayPress = (day) => { setAnchor(day); setView('Daily'); };
  const periodLabel = () => {
    if (view === 'Daily') return anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (view === 'Weekly') return `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  const shortPeriodLabel = () => {
    if (view === 'Daily') return anchor.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (view === 'Weekly') {
      const [first, last] = [weekDays[0], weekDays[6]];
      const from = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return first.getMonth() === last.getMonth()
        ? `${from} – ${last.getDate()}`
        : `${from} – ${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return anchor.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // `time` comes from tapping an empty slot in the time-of-day view.
  const openAdd = (time = null) => { setEditInst(null); setModalDate(toISO(anchor)); setModalTime(typeof time === 'string' ? time : null); setShowModal(true); };
  const openEdit = (inst) => { setEditInst(inst); setModalDate(inst.date); setModalTime(null); setShowModal(true); };

  // Links in: editInstance, review, date, addFor, view (todayParams.js).
  const params = route?.params;
  useEffect(() => {
    const act = enabled ? todayParamsAction(params, toISO(new Date())) : null;
    if (!act) return;
    setView(act.view);
    if (act.date) setAnchor(new Date(`${act.date}T00:00:00`));
    if (act.edit) openEdit(act.edit);
    if (act.review) setReviewAt(Date.now());
    if (act.add) {
      setAddArea(act.add.area);
      setEditInst(null); setModalDate(act.date); setModalTime(null); setShowModal(true);
    }
    navigation?.setParams?.(Object.fromEntries(act.used.map(k => [k, undefined])));
  }, [enabled, params?.editInstance, params?.review, params?.date, params?.addFor, params?.view]); // eslint-disable-line react-hooks/exhaustive-deps

  // The next 30 days as a calendar file. One-way: the phone's calendar gets
  // a copy; the Planner stays the one you edit.
  const exportCalendar = async () => {
    try {
      const from = new Date();
      const rows = await getInstances(userId, { weekStart: toISO(from), weekEnd: toISO(addDays(from, 30)), allProfiles: showingAll });
      const { ics, count } = buildIcs(rows || []);
      if (!count) { Alert.alert('Nothing to add yet', 'Nothing is planned for the next 30 days.'); return; }
      const how = await shareFile({ filename: 'deskartes-plan.ics', content: ics, mimeType: 'text/calendar', uti: 'com.apple.ical.ics', dialogTitle: 'Add to my calendar' });
      if (how === 'downloaded') Alert.alert('Calendar file ready', `${count} item${count === 1 ? '' : 's'} from the next 30 days. Open deskartes-plan.ics to add ${count === 1 ? 'it' : 'them'} to your calendar.`);
    } catch (e) {
      console.warn('exportCalendar', e);
      Alert.alert("Couldn't make the calendar file", 'Something went wrong — try again.');
    }
  };

  // Copies of the same item on the same day at the same time (pasting an AI
  // reply twice). Looks a month back and four ahead.
  const removeDuplicates = async () => {
    try {
      const rows = await getInstancesBetween(userId, toISO(addDays(new Date(), -30)), toISO(addDays(new Date(), 120)));
      const extra = duplicateIds(rows);
      if (!extra.length) { Alert.alert('No duplicates', 'Nothing on your planner is in there twice.'); return; }
      const n = extra.length;
      Alert.alert('Tidy up duplicates', `Found ${n} extra ${n === 1 ? 'copy' : 'copies'} of items already planned for the same day and time. Keep one of each and remove the rest?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: `Remove ${n}`, style: 'destructive', onPress: async () => {
          try { await deleteInstances(extra); } catch (e) { Alert.alert("Couldn't remove them", 'Something went wrong — try again.'); }
          bump();
        } },
      ]);
    } catch (e) {
      console.warn('removeDuplicates', e);
      Alert.alert("Couldn't check", 'Something went wrong — try again.');
    }
  };

  // A new plan from any add flow: counts for a goal step, and a new habit is
  // topped up as far as the others straight away.
  const afterAdded = (saved, { edited = false } = {}) => {
    bump();
    if (edited) return;
    signalAction('planner-item-added', { area: saved?.area });
    if (saved?.cadence && saved.cadence !== 'once' && userId) {
      extendRepeatingPlans(userId, { force: true })
        .then(added => { if (added) bump(); })
        .catch(e => console.warn('planner top-up', e?.message));
    }
  };

  const guest = !loading && !userId;
  const defaultArea = activeAreas.size === 1 ? [...activeAreas][0] : (progressProfile?.active_life_areas?.[0] || 'physical');
  const menuItems = (extra = {}) => plannerMenuItems({
    view, timeMode, guest, profileCount: profiles.length, showingAll,
    onIdeas: () => setPanel(true),
    onToggleTime: () => setTimeMode(m => !m),
    onPhoneCalendar: () => setPhoneCalOpen(true),
    onExport: exportCalendar,
    onDuplicates: removeDuplicates,
    onWeeklyReview: () => navigation?.navigate('WeeklyReviewScreen'),
    onToggleScope: toggleScope,
    ...extra,
  });

  return {
    userId, loading, guest, view, setView, anchor, setAnchor, isToday, showsToday, weekDays,
    activeAreas, toggleArea, timeMode, setTimeMode, showingAll, toggleScope,
    refreshKey, bump, reviewAt, defaultArea,
    prev: () => step(-1), next: () => step(1), goToday: () => setAnchor(new Date()), onDayPress,
    periodLabel, shortPeriodLabel, openAdd, openEdit, setDetail, afterAdded,
    openFilter: () => setFilterOpen(true), openIdeas: () => setPanel(true), openPhoneCalendar: () => setPhoneCalOpen(true),
    exportCalendar, removeDuplicates, menuItems,
    // For PlannerSheets.
    sheets: {
      panelOpen, setPanel, filterOpen, setFilterOpen, phoneCalOpen, setPhoneCalOpen,
      detail, setDetail, showModal, setShowModal, editInst, modalDate, modalTime, addArea, setAddArea,
      goalIdea: () => (addArea ? null : goalIdeaFor(activeObjective, activeProfile?.baseline, lastSignalDetail?.('area-rated')?.area || null)),
    },
  };
}

// The sheets usePlanner opens: phone calendar (or the guest's sign-in ask),
// the life-area filter, Add from ideas, the item sheet and Add/Edit.
export function PlannerSheets({ planner: p, navigation, c, t, s, r }) {
  const sh = p.sheets;
  return (
    <>
      {p.guest ? (
        <GuestSignInSheet visible={sh.phoneCalOpen} onClose={() => sh.setPhoneCalOpen(false)}
          icon="phone-portrait-outline" title="Copy plans to your phone's calendar"
          body="Sign in, and your plans stay in step with your phone's calendar."
          c={c} t={t} s={s} />
      ) : (
        <PhoneCalendarSheet visible={sh.phoneCalOpen} onClose={() => { sh.setPhoneCalOpen(false); p.bump(); }}
          userId={p.userId} c={c} t={t} s={s} r={r} />
      )}
      <AreaFilterSheet visible={sh.filterOpen} onClose={() => sh.setFilterOpen(false)}
        activeAreas={p.activeAreas} onToggle={p.toggleArea} c={c} t={t} s={s} />
      <SidePanel visible={sh.panelOpen} onClose={() => sh.setPanel(false)} userId={p.userId}
        // An idea added counts like any new plan for a goal step.
        onAdded={(comp) => p.afterAdded(comp)}
        c={c} t={t} s={s} r={r} />
      <PlanDetailSheet instance={sh.detail} onClose={() => sh.setDetail(null)}
        onChanged={p.bump} onEdit={p.openEdit} navigation={navigation} />
      <InstanceModal
        visible={sh.showModal}
        instance={sh.editInst}
        userId={p.userId}
        date={sh.modalDate}
        initialTime={sh.modalTime}
        defaultArea={sh.addArea || p.defaultArea}
        goalIdea={sh.goalIdea()}
        onSave={(saved) => {
          const edited = !!sh.editInst;
          sh.setShowModal(false);
          sh.setAddArea(null);
          // A new plan is what ticks "put one habit / study block in the
          // Planner" on a first goal. Edits don't count.
          p.afterAdded(saved, { edited });
        }}
        onDelete={() => { sh.setShowModal(false); p.bump(); }}
        onClose={() => { sh.setShowModal(false); sh.setAddArea(null); }}
        c={c} t={t} s={s} r={r}
      />
    </>
  );
}
