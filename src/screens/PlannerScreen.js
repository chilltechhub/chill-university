// src/screens/PlannerScreen.js
// Full agenda/planner — time-based + list view, full CRUD, reminders, sync.
// Its parts live in src/screens/today/ (docs/shake-up-plan-2026-10-21.md P1);
// this file holds the state and wires them together. What's on a day comes
// from useDayPlan, the same read as Home's Today card and Calm's week.
//
// A guest plans too: their plans stay on the phone (plannerService.js), and
// only copying them to the phone's calendar asks for an account.

import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useAccess } from '../../context/AccessContext';
import { supabase } from '../api/profileScopedClient';
import { getInstances, extendRepeatingPlans, deleteInstances, getInstancesBetween } from '../api/plannerService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { duplicateIds } from '../logic/plannerLayout';
import { useProfiles } from '../../context/ProfileAccountsContext';
import useViewScope, { SCOPE_PROFILE } from '../logic/useViewScope';
import PlanDetailSheet from '../components/PlanDetailSheet';
import { SkeletonRows } from '../components/Skeleton';
import { PhoneCalendarSheet } from '../components/PhoneCalendar';
import { syncPlansToPhoneSoon } from '../api/phoneCalendar';
import { buildIcs } from '../logic/calendarExport';
import { shareFile } from '../logic/shareFile';
import { TIME_MODE_KEY, toISO, addDays, getWeekDays, goalIdeaFor } from './today/plannerShared';
import InstanceModal from './today/InstanceModal';
import DayView from './today/DayView';
import WeekView from './today/WeekView';
import MonthView from './today/MonthView';
import SidePanel from './today/SidePanel';
import PlannerHeader from './today/PlannerHeader';
import { plannerMenuItems, AreaFilterSheet, GuestSignInSheet } from './today/PlannerOptions';

// ─── Main PlannerScreen ───────────────────────────────────────────────────────
export default function PlannerScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis } = useUIPrefs();
  const navigation = useNavigation();
  const { signalAction } = useAccess();

  const [userId,      setUserId]  = useState(null);
  const [view,        setView]    = useState('Daily');
  const [anchor,      setAnchor]  = useState(new Date());
  const [activeAreas, setAreas]   = useState(new Set());
  const [panelOpen,   setPanel]   = useState(false);
  const [filterOpen, setFilterOpen] = useState(false); // the life-area sheet
  const [phoneCalOpen, setPhoneCalOpen] = useState(false); // Phone calendar sheet
  const [loading,     setLoading] = useState(true);
  const [refreshKey,  setRefresh] = useState(0);
  // Plans copied to the phone's "Deskartes" calendar stay in step: on open
  // and after changes here, a burst of them gathered into one sync. A no-op
  // unless turned on (phoneCalendar.js).
  useEffect(() => {
    if (userId) syncPlansToPhoneSoon(userId);
  }, [userId, refreshKey]);
  // By time of day unless the person switched to the list; the choice is
  // remembered on this device.
  const [timeMode,    setTimeModeState] = useState(true);
  const setTimeMode = (next) => setTimeModeState(prev => {
    const value = typeof next === 'function' ? next(prev) : next;
    AsyncStorage.setItem(TIME_MODE_KEY, value ? 'time' : 'list').catch(() => {});
    return value;
  });
  useEffect(() => {
    AsyncStorage.getItem(TIME_MODE_KEY)
      .then(v => { if (v === 'list') setTimeModeState(false); })
      .catch(() => {});
  }, []);
  // The item whose detail sheet is open.
  const [detail,     setDetail]   = useState(null);
  const [modalTime,  setModalTime]= useState(null);
  // Edit modal
  const [editInst,   setEditInst] = useState(null);
  const [showModal,  setShowModal]= useState(false);
  const [modalDate,  setModalDate]= useState(null);

  // The planner defaults the opposite way to the calendar: a task list is
  // context-specific work, so merging every profile's into one is noise. The
  // calendar defaults to 'all' because you only have one actual day and need
  // to see clashes. See useViewScope.js.
  const { showingAll, toggle: toggleScope } = useViewScope('planner', SCOPE_PROFILE);
  const { profiles, active: activeProfile } = useProfiles();

  // Re-read when the account changes, so signing in from the guest prompt
  // opens the planner without leaving the screen.
  const { user: signedInUser, profile: progressProfile } = useUserProgress();
  const { activeObjective, lastSignalDetail } = useAccess();
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user ? user.id : null);
      setLoading(false);
    });
  }, [signedInUser?.id]);

  // Keep repeating habits going past the days first written for them (see
  // extendRepeatingPlans). Once a day; redraws only if it added anything.
  useEffect(() => {
    if (!userId) return;
    extendRepeatingPlans(userId)
      .then(added => { if (added) setRefresh(k => k + 1); })
      .catch(e => console.warn('planner top-up', e?.message));
  }, [userId, activeProfile?.id]);

  const toggleArea = (key) => {
    if (key === 'all') { setAreas(new Set()); return; }
    setAreas(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const today      = new Date();
  const isToday    = toISO(anchor) === toISO(today);
  const weekDays   = getWeekDays(anchor);

  const prevPeriod = () => {
    const d = new Date(anchor);
    if (view === 'Daily')   d.setDate(d.getDate() - 1);
    if (view === 'Weekly')  d.setDate(d.getDate() - 7);
    if (view === 'Monthly') d.setMonth(d.getMonth() - 1);
    setAnchor(d);
  };
  const nextPeriod = () => {
    const d = new Date(anchor);
    if (view === 'Daily')   d.setDate(d.getDate() + 1);
    if (view === 'Weekly')  d.setDate(d.getDate() + 7);
    if (view === 'Monthly') d.setMonth(d.getMonth() + 1);
    setAnchor(d);
  };
  const onDayPress = (day) => { setAnchor(day); setView('Daily'); };

  const periodLabel = () => {
    if (view === 'Daily')   return anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (view === 'Weekly')  return `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    if (view === 'Monthly') return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  // The same, short enough to share a row with the view and the filter.
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

  // "Edit" on the detail sheet from Home or the Library lands here with the
  // row, on that item's day.
  const route = useRoute();
  const editParam = route.params?.editInstance;
  useEffect(() => {
    if (!editParam) return;
    setView('Daily');
    setAnchor(new Date(editParam.date + 'T00:00:00'));
    openEdit(editParam);
    navigation.setParams({ editInstance: undefined });
  }, [editParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Review & reschedule" from the Notification Center: today, with the
  // from-earlier card already open.
  const [reviewAt, setReviewAt] = useState(0);
  const reviewParam = route.params?.review;
  useEffect(() => {
    if (!reviewParam) return;
    setView('Daily');
    setAnchor(new Date());
    setReviewAt(Date.now());
    navigation.setParams({ review: undefined });
  }, [reviewParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Something just scheduled from elsewhere (the Capture Inbox) opens on its
  // own day, so it's on screen rather than on a day nobody is looking at.
  const dateParam = route.params?.date;
  useEffect(() => {
    if (!dateParam) return;
    setView('Daily');
    setAnchor(new Date(dateParam + 'T00:00:00'));
    navigation.setParams({ date: undefined });
  }, [dateParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // "+ Plan" on a life area's calendar (AreaPlanCalendar): the add sheet,
  // open on that day, already in that area.
  const [addArea, setAddArea] = useState(null);
  const addParam = route.params?.addFor;
  useEffect(() => {
    if (!addParam) return;
    const day = addParam.date ? new Date(addParam.date + 'T00:00:00') : new Date();
    setView('Daily');
    setAnchor(day);
    setAddArea(addParam.area || null);
    setEditInst(null); setModalDate(toISO(day)); setModalTime(null); setShowModal(true);
    navigation.setParams({ addFor: undefined });
  }, [addParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Copies of the same item on the same day at the same time — what pasting
  // an AI reply twice used to leave behind. Looks a month back and four ahead.
  // The next 30 days as a calendar file (audit 4.6). One-way: the phone's
  // calendar gets a copy; the Planner stays the one you edit.
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

  const removeDuplicates = async () => {
    try {
      const rows = await getInstancesBetween(userId, toISO(addDays(new Date(), -30)), toISO(addDays(new Date(), 120)));
      const extra = duplicateIds(rows);
      if (!extra.length) { Alert.alert('No duplicates', 'Nothing on your planner is in there twice.'); return; }
      const n = extra.length;
      Alert.alert('Remove duplicates', `Found ${n} extra ${n === 1 ? 'copy' : 'copies'} of items already planned for the same day and time. Keep one of each and remove the rest?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: `Remove ${n}`, style: 'destructive', onPress: async () => {
          try { await deleteInstances(extra); } catch (e) { Alert.alert("Couldn't remove them", 'Something went wrong — try again.'); }
          setRefresh(k => k + 1);
        } },
      ]);
    } catch (e) {
      console.warn('removeDuplicates', e);
      Alert.alert("Couldn't check", 'Something went wrong — try again.');
    }
  };

  // NOTE: no full-screen loading gate. The first visit is the one with no
  // cache behind it, so a spinner over the whole screen meant the header —
  // and the <TourSpot id="planner-add"> in it — did not exist yet when the
  // guide arrived pointing at Add. The spotlight had nothing to trace, so
  // the highlight box simply never appeared, and only on the first visit,
  // because every later one renders straight from cache. The header is
  // static chrome anyway; only the agenda below it needs to wait.

  // No account: plan on the phone. Signing in from the top bar re-reads
  // userId above and the account's plans take over.
  const guest = !loading && !userId;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>

      {/* ── Header ── */}
      <PlannerHeader
        view={view} onView={setView}
        isToday={isToday} label={periodLabel()} shortLabel={shortPeriodLabel()}
        onPrev={prevPeriod} onNext={nextPeriod} onToday={() => setAnchor(new Date())}
        onAdd={openAdd}
        // Fill with AI writes into the account.
        showFillWithAI={!guest}
        menuItems={plannerMenuItems({
          view, timeMode, guest, profileCount: profiles.length, showingAll,
          onIdeas: () => setPanel(true),
          onToggleTime: () => setTimeMode(m => !m),
          onPhoneCalendar: () => setPhoneCalOpen(true),
          onExport: exportCalendar,
          onDuplicates: removeDuplicates,
          onWeeklyReview: () => navigation.navigate('WeeklyReviewScreen'),
          onToggleScope: toggleScope,
        })}
        areaCount={activeAreas.size} onFilter={() => setFilterOpen(true)}
        showEmojis={showEmojis}
        c={c} t={t} s={s} r={r}
      />

      {/* ── Content ── */}
      {loading ? (
        <SkeletonRows count={4} style={{ padding: s.lg }} />
      ) : view === 'Daily' ? (
        <DayView
          key={`daily-${toISO(anchor)}-${showingAll ? 'all' : 'one'}`}
          userId={userId} date={anchor} onAdd={openAdd}
          reviewAt={reviewAt}
          quickArea={activeAreas.size === 1 ? [...activeAreas][0] : (progressProfile?.active_life_areas?.[0] || 'physical')}
          onQuickAdded={(saved) => {
            // Same as a save from the Add sheet: counts for a goal step, and
            // a new habit gets topped up as far as the others.
            signalAction('planner-item-added', { area: saved?.area });
            if (saved?.cadence && saved.cadence !== 'once' && userId) {
              extendRepeatingPlans(userId, { force: true }).catch(e => console.warn('planner top-up', e?.message));
            }
            setRefresh(k => k + 1);
          }}
          activeAreas={activeAreas} timeMode={timeMode}
          onOpen={setDetail}
          showingAll={showingAll}
          refreshKey={refreshKey} c={c} t={t} s={s} r={r}
        />
      ) : view === 'Weekly' ? (
        <WeekView userId={userId} anchor={anchor} activeAreas={activeAreas}
          onDayPress={onDayPress} refreshKey={refreshKey} showingAll={showingAll} c={c} t={t} s={s} />
      ) : (
        <MonthView userId={userId} anchor={anchor} activeAreas={activeAreas}
          onDayPress={onDayPress} refreshKey={refreshKey} showingAll={showingAll} c={c} t={t} s={s} />
      )}

      {guest ? (
        <GuestSignInSheet visible={phoneCalOpen} onClose={() => setPhoneCalOpen(false)}
          icon="phone-portrait-outline" title="Copy plans to your phone's calendar"
          body="Sign in, and your plans stay in step with your phone's calendar."
          c={c} t={t} s={s} />
      ) : (
        <PhoneCalendarSheet visible={phoneCalOpen} onClose={() => { setPhoneCalOpen(false); setRefresh(k => k + 1); }}
          userId={userId} c={c} t={t} s={s} r={r} />
      )}

      {/* ── Life-area filter ── */}
      <AreaFilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)}
        activeAreas={activeAreas} onToggle={toggleArea} c={c} t={t} s={s} />

      {/* ── Side panel ── */}
      <SidePanel
        visible={panelOpen} onClose={() => setPanel(false)}
        userId={userId}
        // An idea added counts like any new plan for a goal step.
        onAdded={(comp) => { signalAction('planner-item-added', { area: comp?.area }); setRefresh(k => k + 1); }}
        c={c} t={t} s={s} r={r}
      />

      {/* ── Item details ── */}
      <PlanDetailSheet
        instance={detail}
        onClose={() => setDetail(null)}
        onChanged={() => setRefresh(k => k + 1)}
        onEdit={openEdit}
        navigation={navigation}
      />

      {/* ── Add/Edit modal ── */}
      <InstanceModal
        visible={showModal}
        instance={editInst}
        userId={userId}
        date={modalDate}
        initialTime={modalTime}
        defaultArea={addArea || (activeAreas.size === 1 ? [...activeAreas][0] : (progressProfile?.active_life_areas?.[0] || 'physical'))}
        goalIdea={addArea ? null : goalIdeaFor(activeObjective, activeProfile?.baseline, lastSignalDetail?.('area-rated')?.area || null)}
        onSave={(saved) => {
          setShowModal(false);
          setAddArea(null);
          setRefresh(k => k + 1);
          // A new plan is what ticks "put one habit / study block / routine
          // in the Planner" on a first goal. Edits don't count.
          if (!editInst) signalAction('planner-item-added', { area: saved?.area });
          // A new habit is written a week ahead; run the top-up now so it
          // reaches as far as every other habit straight away, instead of
          // looking like it stops after 7 days until tomorrow's top-up.
          if (!editInst && saved?.cadence && saved.cadence !== 'once' && userId) {
            extendRepeatingPlans(userId, { force: true })
              .then(added => { if (added) setRefresh(k => k + 1); })
              .catch(e => console.warn('planner top-up', e?.message));
          }
        }}
        onDelete={() => { setShowModal(false); setRefresh(k => k + 1); }}
        onClose={() => { setShowModal(false); setAddArea(null); }}
        c={c} t={t} s={s} r={r}
      />
    </View>
  );
}
