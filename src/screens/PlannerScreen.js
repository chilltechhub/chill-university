// src/screens/PlannerScreen.js
// Full agenda/planner — time-based + list view, full CRUD, reminders, sync

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
  Dimensions, TextInput, Modal, KeyboardAvoidingView,
  Platform, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import SignInPrompt from '../components/SignInPrompt';
import TimePickerField from '../components/TimePickerField';
import { useUserProgress } from '../../context/UserProgressContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useAccess } from '../../context/AccessContext';
import { supabase } from '../api/profileScopedClient';
import {
  AREAS, getInstances, getPresetComponents,
  getUserSubscriptions, generateInstances, extendRepeatingPlans, clearSeriesStopped,
  completeInstance, skipInstance, rescheduleInstance, addNoteToInstance,
  deleteInstances, getInstancesBetween,
} from '../api/plannerService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fmt12, timeRange, hourRange, layoutDay, byTime, duplicateIds, isSamePlan } from '../logic/plannerLayout';
import { repeatDates } from '../logic/aiBridgeFormat';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { buildProfileLookup } from '../data/personas';
import useViewScope, { SCOPE_PROFILE } from '../logic/useViewScope';
import { schedulePlanReminder, cancelPlanReminder, hasScheduledReminder } from '../logic/planReminderActions';
import { markManualReminder, setPlanReminder } from '../logic/hubNotifications';
import { getQuest } from '../data/quests';
import { suggestionsForArea } from '../data/plannerSuggestions';
import DailyCheckin from '../components/DailyCheckin';
import MiniCalendar from '../components/MiniCalendar';
import PlanDetailSheet from '../components/PlanDetailSheet';
import TourSpot from '../components/TourSpot';
import FillWithAIButton from '../components/FillWithAIButton';
import MoreMenu from '../components/MoreMenu';
import { CLASS_SUBJECTS, CLASS_SCREEN_MAP } from '../data/classCatalog';
import { getEnabledGames, getGame } from '../services/gameRegistry';
import { dateStr } from '../logic/dateUtils';
import { buildIcs } from '../logic/calendarExport';
import { shareFile } from '../logic/shareFile';
import { textOn } from '../logic/contrast';
import { getDueItems, setDueItemDone } from '../api/deadlinesService';
import { openTarget } from '../logic/openTarget';

const { width: SW } = Dimensions.get('window');
const PANEL_W      = Math.min(SW * 0.82, 370);
const VIEWS        = ['Daily', 'Weekly', 'Monthly'];
const HOUR_H       = 80; // px per hour in time view
const DAY_START    = 6;  // 6am, unless something is planned earlier
const DAY_END      = 22; // 10pm, unless something runs later
const MIN_BOX_MINUTES = 30; // shortest an item is drawn, so its title fits
const UNTIMED_PREVIEW = 3;  // any-time items shown before "Show all"
const TIME_MODE_KEY = '@cth_planner_time_mode';
const REPEAT_UNITS = { daily: 'days', weekly: 'weeks', monthly: 'months' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toISO(d) { return dateStr(d); } // local calendar, not UTC
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function getWeekDays(anchor) {
  const base = new Date(anchor);
  base.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(base, i));
}
function isOverdue(instance) {
  if (instance.completed || instance.skipped) return false;
  const today = toISO(new Date());
  return instance.date < today;
}

// The running goal's next Planner step, as the new-item sheet should open.
// "Put one small habit in the Planner" comes right after onboarding asked
// for "a habit you want to hold", so that answer is the habit: asking for
// it a second time, in a blank box, was the first thing a new account hit.
function goalIdeaFor(objective, baseline) {
  if (!objective?.active || objective.complete) return null;
  const idea = objective.nextStep?.idea;
  if (!idea) return null;
  const own = typeof baseline?.habit_target === 'string' ? baseline.habit_target.trim() : '';
  if (idea.title || !own || objective.nextStep.id !== 'habit') return idea;
  return { ...idea, title: own, mine: true };
}

// ─── Add / Edit instance modal ────────────────────────────────────────────────
// `defaultArea`: where a new item starts (the area being filtered to, else
// the person's own first life area; it was always Physical, which a Student
// who never picked Physical got as the default for a study block).
// `goalIdea`: the running goal's Planner step can name one ({ title,
// cadence, area } on the step in objectives.js), shown first in the ideas.
// `mine` means the title is the person's own words from onboarding, so it
// goes straight into the box instead of waiting as a suggestion.
function InstanceModal({ visible, instance, userId, date, initialTime = null, onSave, onDelete, onClose, defaultArea = 'physical', goalIdea = null, c, t, s, r }) {
  const { showEmojis } = useUIPrefs();
  const [title,       setTitle]       = useState('');
  const [area,        setArea]        = useState('physical');
  const [cadence,     setCadence]     = useState('daily');
  const [selectedDate,setSelectedDate]= useState(new Date());
  const [showCal,     setShowCal]     = useState(false);
  const [timeVal,     setTimeVal]     = useState('');
  const [duration,    setDuration]    = useState('');
  const [notes,       setNotes]       = useState('');
  const [reminder,    setReminder]    = useState(false);
  const [reminderMin, setReminderMin] = useState(15);
  const [saving,      setSaving]      = useState(false);
  // Duration, reminder, link and notes sit behind "More options". With all
  // of them showing, the Add button was below the bottom of the sheet and a
  // first habit meant scrolling past four optional fields to find it.
  const [moreOpen,    setMoreOpen]    = useState(false);
  // Link to Class / Project / Game — see supabase/migrations/20260905150000_planner_links.sql.
  // linkScreen carries a ClassesStack screen name for 'class' or a
  // gameRegistry id for 'game'; linkId carries a projects.id for 'project'.
  // Only one of the two is ever meaningful, matching the columns' own split.
  const [linkType,    setLinkType]    = useState(null);
  const [linkScreen,  setLinkScreen]  = useState(null);
  const [linkId,      setLinkId]      = useState(null);
  const [linkLabel,   setLinkLabel]   = useState('');
  const [linkSubject, setLinkSubject] = useState(null); // class-picker browsing state only
  const [projects,       setProjects]       = useState(null); // null = not fetched yet
  const [loadingProjects, setLoadingProjects] = useState(false);
  // Titles already on the agenda, so a suggestion is never something the
  // person has plainly already scheduled. Fetched once per opening of a NEW
  // item; an edit never shows suggestions, so it never pays for this.
  const [scheduledTitles, setScheduledTitles] = useState([]);
  const isEdit = !!instance;

  useEffect(() => {
    setShowCal(false);
    if (instance) {
      setTitle(instance.title || '');
      setArea(instance.area || 'physical');
      setCadence(instance.cadence || 'daily');
      setSelectedDate(instance.date ? new Date(instance.date + 'T00:00:00') : new Date());
      setTimeVal(instance.start_time || '');
      setDuration(instance.duration_minutes ? String(instance.duration_minutes) : '');
      setNotes(instance.notes || '');
      setReminder(false); // corrected right after, once the id-map lookup below resolves
      hasScheduledReminder(instance.id).then(on => { setReminder(on); if (on) setMoreOpen(true); });
      setMoreOpen(!!(instance.link_type || instance.duration_minutes || instance.notes));

      // Resolve a display label for whatever's already linked, if anything.
      setLinkType(instance.link_type || null);
      setLinkScreen(instance.link_screen || null);
      setLinkId(instance.link_id || null);
      setLinkSubject(null);
      if (instance.link_type === 'class') {
        const found = Object.entries(CLASS_SCREEN_MAP).find(([, screen]) => screen === instance.link_screen);
        setLinkLabel(found ? found[0] : (instance.link_screen || ''));
      } else if (instance.link_type === 'game') {
        setLinkLabel(getGame(instance.link_screen)?.name || instance.link_screen || '');
      } else if (instance.link_type === 'project' && instance.link_id) {
        setLinkLabel('');
        supabase.from('projects').select('title').eq('id', instance.link_id).maybeSingle()
          .then(({ data }) => { if (data) setLinkLabel(data.title); });
      } else if (instance.link_type === 'quest' && instance.link_screen) {
        // Quest, idea and vault links come from reminders set elsewhere (the
        // Notification Center, a project, a quest); the picker has no button
        // for them, but they show and survive an edit like any other link.
        setLinkLabel(`Quest: ${getQuest(instance.link_screen)?.title || instance.link_screen}`);
      } else if ((instance.link_type === 'idea' || instance.link_type === 'vault') && instance.link_id) {
        const kind = instance.link_type === 'idea' ? 'Idea' : 'Vault';
        setLinkLabel(kind);
        supabase.from(instance.link_type === 'idea' ? 'garden_cores' : 'captures').select('title').eq('id', instance.link_id).maybeSingle()
          .then(({ data }) => { if (data?.title) setLinkLabel(`${kind}: ${data.title}`); });
      } else {
        setLinkLabel('');
      }
    } else {
      // A new item repeats only when asked to. It used to default to
      // "daily" while saving just the one day, so the label said daily and
      // the planner showed it once.
      setTitle(goalIdea?.mine ? goalIdea.title : ''); setArea(goalIdea?.area || defaultArea || 'physical'); setCadence(goalIdea?.cadence || 'once');
      setSelectedDate(date ? new Date(date + 'T00:00:00') : new Date());
      setTimeVal(initialTime || ''); setDuration(''); setNotes(''); setReminder(false);
      setLinkType(null); setLinkScreen(null); setLinkId(null); setLinkLabel(''); setLinkSubject(null);
      setProjects(null);
      setMoreOpen(false);
    }
  }, [instance, visible, date, initialTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lazy-load the user's open projects the first time the Project link tab
  // is opened, instead of fetching on every modal open regardless of need.
  useEffect(() => {
    if (linkType === 'project' && projects === null && userId) {
      setLoadingProjects(true);
      supabase.from('projects').select('id,title,next_action,status')
        .eq('user_id', userId).is('deleted_at', null).neq('status', 'completed')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error) setProjects(data || []);
          setLoadingProjects(false);
        });
    }
  }, [linkType]);

  const clearLink = () => { setLinkScreen(null); setLinkId(null); setLinkLabel(''); setLinkSubject(null); };
  const pickClass = (label) => {
    setLinkScreen(CLASS_SCREEN_MAP[label] || null);
    setLinkId(null);
    setLinkLabel(label);
    if (!title.trim()) setTitle(`Study: ${label}`);
  };
  const pickProject = (p) => {
    setLinkId(p.id);
    setLinkScreen(null);
    setLinkLabel(p.title);
    if (!title.trim()) setTitle(p.next_action || p.title);
  };
  const pickGame = (g) => {
    setLinkScreen(g.id);
    setLinkId(null);
    setLinkLabel(g.name);
    if (!title.trim()) setTitle(`Practice: ${g.name}`);
  };

  // What's already scheduled, for the suggestion filter above.
  useEffect(() => {
    if (!visible || isEdit || !userId) return;
    let alive = true;
    supabase.from('agenda_instances').select('title').eq('user_id', userId).limit(200)
      .then(({ data }) => { if (alive) setScheduledTitles((data || []).map(row => row.title)); })
      .catch(() => { /* suggestions just won't be de-duplicated */ });
    return () => { alive = false; };
  }, [visible, isEdit, userId]);

  // Re-offered every time the life area changes: which area this belongs to
  // is the most useful thing anyone has said by that point in the sheet.
  const suggestions = useMemo(() => {
    if (isEdit) return [];
    const base = suggestionsForArea(area, scheduledTitles);
    if (!goalIdea?.title || goalIdea.mine || scheduledTitles.includes(goalIdea.title)) return base;
    return [{ ...goalIdea, forGoal: true }, ...base.filter(sg => sg.title !== goalIdea.title)].slice(0, 4);
  }, [isEdit, area, scheduledTitles, goalIdea]);

  const applySuggestion = (sg) => {
    setTitle(sg.title);
    if (sg.cadence) setCadence(sg.cadence);
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const basePayload = {
        user_id:          userId,
        title:            title.trim(),
        area,
        cadence,
        type:             'checklist',
        date:             toISO(selectedDate),
        start_time:       timeVal || null,
        duration_minutes: duration ? parseInt(duration) : null,
        notes:            notes || null,
        completed:        false,
        skipped:          false,
      };
      const linkFields = {
        link_type:   linkType || null,
        link_screen: ['class', 'game', 'quest'].includes(linkType) ? linkScreen : null,
        link_id:     ['project', 'idea', 'vault'].includes(linkType) ? linkId : null,
      };

      // A repeat is one row per day (the same spread the AI import and the
      // reminder composer use: 7 days, 4 weeks or 3 months). Editing changes
      // only the row being edited.
      let rows = [basePayload];
      if (!isEdit) {
        const dates = cadence === 'once' ? [basePayload.date] : repeatDates(basePayload.date, cadence);
        // Skip the days it's already on, so adding the same thing twice
        // doesn't leave two of it (isSamePlan: same title and day, same time
        // or either one untimed).
        const { data: existing } = await supabase.from('agenda_instances')
          .select('title, date, start_time').eq('user_id', userId).in('date', dates);
        const free = dates.filter(d => !(existing || []).some(x => isSamePlan(x, { ...basePayload, date: d })));
        if (!free.length) {
          setSaving(false);
          Alert.alert('Already planned', `“${basePayload.title}” is already on your planner ${dates.length > 1 ? 'on those days' : 'that day'}.`);
          return;
        }
        rows = free.map(d => ({ ...basePayload, date: d }));
      }

      const writeRows = (list) => isEdit
        ? supabase.from('agenda_instances').update(list[0]).eq('id', instance.id).select()
        : supabase.from('agenda_instances').insert(list).select();

      let { data, error } = await writeRows(rows.map(row => ({ ...row, ...linkFields })));
      if (error) {
        // supabase/migrations/20260905150000_planner_links.sql hasn't been
        // run yet on this database — the link_type/link_screen/link_id
        // columns don't exist. Rather than blocking Add/Edit entirely until
        // the user applies it, retry once without them so everything else
        // still works; the link itself is just silently dropped this once.
        const missingLinkColumns = error.code === 'PGRST204'
          || /link_type|link_screen|link_id/i.test(error.message || '');
        if (!missingLinkColumns) throw error;
        console.warn('planner link columns missing — retrying without them; run the migration to enable links', error);
        ({ data, error } = await writeRows(rows));
        if (error) throw error;
      }
      const savedRows = data || [];
      // Adding a habit back that was once ended keeps it going again.
      if (!isEdit && cadence !== 'once') clearSeriesStopped(userId, basePayload).catch(() => {});

      // Schedule (or cancel) the reminder. Its notification id lives in a
      // local id map, not this row — see planReminderActions.js — so this
      // never touches (and can't clobber) whatever the user actually typed
      // in Notes above.
      // Hand-set reminders are the person's: the Notification Center's
      // automatic plan reminders leave them alone, and one switched off here
      // stays off even with those on (hubNotifications.js).
      for (const row of savedRows) {
        if (reminder && timeVal) {
          if (await schedulePlanReminder(row, reminderMin)) await markManualReminder(row.id);
        } else if (await hasScheduledReminder(row.id)) await setPlanReminder(row, false);
        else await cancelPlanReminder(row.id);
      }

      onSave(savedRows[0]);
    } catch (e) {
      console.warn('InstanceModal save', e);
      Alert.alert("Couldn't save", e?.message || 'Something went wrong — try again.');
    }
    setSaving(false);
  };

  const deleteInstance = () => {
    Alert.alert('Remove', 'Remove this item from your agenda?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await cancelPlanReminder(instance.id);
        await supabase.from('agenda_instances').delete().eq('id', instance.id);
        onDelete(instance.id);
      }},
    ]);
  };

  const areaColor = AREAS[area]?.color || c.teal;
  const REMINDER_OPTS = [
    { label: '5 min', val: 5 }, { label: '15 min', val: 15 },
    { label: '30 min', val: 30 }, { label: '1 hour', val: 60 },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '90%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 10, marginBottom: s.lg }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, marginBottom: s.lg }}>
            <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>
              {isEdit ? 'Edit Item' : 'Add to Agenda'}
            </Text>
            {isEdit && (
              <TouchableOpacity accessibilityLabel="Delete" accessibilityRole="button" onPress={deleteInstance} style={{ padding: s.sm, marginRight: s.sm }}>
                <Ionicons name="trash-outline" size={18} color={c.error || '#e05858'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose} style={{ padding: s.sm }}>
              <Ionicons name="close" size={20} color={c.text3} />
            </TouchableOpacity>
          </View>

          <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingHorizontal: s.lg, gap: s.md, paddingBottom: s.xl }}>
            {/* Title */}
            <TextInput
              style={{ borderWidth: 1, borderColor: areaColor, borderRadius: r.md, padding: s.md, fontSize: t.md, color: c.text1, backgroundColor: c.bg0 }}
              value={title} onChangeText={setTitle}
              placeholder="What are you scheduling?" placeholderTextColor={c.text4}
              autoFocus={!isEdit}
            />

            {/* Suggestions for the life area picked below — tapping one fills
                the title and the cadence it only makes sense at, both still
                editable. Hidden once there's a title, so it never nags over
                something the person is already typing. See
                src/data/plannerSuggestions.js. */}
            {suggestions.length > 0 && !title.trim() && (
              <View>
                <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>
                  {AREAS[area]?.label || 'Life area'} ideas
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                  {suggestions.map(sg => (
                    <TouchableOpacity
                      key={sg.title}
                      onPress={() => applySuggestion(sg)}
                      accessibilityRole="button"
                      accessibilityLabel={`Use suggestion: ${sg.title}, repeating ${sg.cadence}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.md, paddingVertical: 7, borderRadius: r.full, borderWidth: 1, borderStyle: 'dashed', borderColor: areaColor + '88', backgroundColor: areaColor + '10' }}
                    >
                      <Ionicons name={sg.forGoal ? 'flag' : 'add'} size={12} color={areaColor} />
                      <Text style={{ fontSize: t.xs, color: c.text2, fontWeight: sg.forGoal ? t.bold : undefined }}>{sg.title}</Text>
                      <Text style={{ fontSize: 11, color: areaColor, fontWeight: t.bold }}>{sg.cadence}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Date */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Date</Text>
              <TouchableOpacity onPress={() => setShowCal(v => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, backgroundColor: c.bg0 }}>
                <Ionicons name="calendar-outline" size={16} color={areaColor} />
                <Text style={{ flex: 1, fontSize: t.sm, color: c.text1, fontWeight: t.medium }}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
                <Ionicons name={showCal ? 'chevron-up' : 'chevron-down'} size={14} color={c.text4} />
              </TouchableOpacity>
              {showCal && (
                <View style={{ marginTop: s.sm }}>
                  <MiniCalendar value={selectedDate} onChange={(d) => { setSelectedDate(d); setShowCal(false); }}
                    color={areaColor} colors={{ bg: c.bg0, text: c.text1, muted: c.text3 }} />
                </View>
              )}
            </View>

            {/* Area picker */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Life Area</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: s.sm }}>
                  {Object.entries(AREAS).map(([key, ar]) => (
                    <TouchableOpacity key={key} onPress={() => setArea(key)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: s.sm, paddingVertical: 6, borderRadius: r.full, borderWidth: 1, borderColor: area === key ? ar.color : c.border, backgroundColor: area === key ? ar.color + '22' : 'transparent' }}>
                      <Text style={{ fontSize: 13 }}>{ar.emoji}</Text>
                      <Text style={{ fontSize: t.xs, color: area === key ? ar.color : c.text3, fontWeight: area === key ? t.bold : t.regular }}>{ar.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Cadence */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Repeats</Text>
              <View style={{ flexDirection: 'row', gap: s.sm }}>
                {['once','daily','weekly','monthly'].map(cad => (
                  <TouchableOpacity key={cad} onPress={() => setCadence(cad)}
                    style={{ flex: 1, padding: s.sm, borderRadius: r.md, borderWidth: 1, alignItems: 'center', borderColor: cadence === cad ? areaColor : c.border, backgroundColor: cadence === cad ? areaColor + '22' : 'transparent' }}>
                    <Text style={{ fontSize: t.xs, color: cadence === cad ? areaColor : c.text3, fontWeight: cadence === cad ? t.bold : t.regular, textTransform: 'capitalize' }}>{cad}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {cadence !== 'once' && (
                <Text style={{ fontSize: 11, color: c.text3, marginTop: 6 }}>
                  {isEdit ? 'Changes here apply to this day only.'
                    : `Repeats every ${REPEAT_UNITS[cadence].slice(0, -1)} until you delete it.`}
                </Text>
              )}
            </View>

            {/* Time */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Time</Text>
              <TimePickerField value={timeVal} onChange={setTimeVal} placeholder="Any time" />
            </View>

            {!moreOpen && (
              <TouchableOpacity onPress={() => setMoreOpen(true)} accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 }}>
                <Ionicons name="add-circle-outline" size={16} color={areaColor} />
                <Text style={{ fontSize: t.sm, color: areaColor, fontWeight: t.semibold }}>More options: reminder, length, notes, link</Text>
              </TouchableOpacity>
            )}

            {moreOpen && (<>
            {/* Link to Class / Project / Game */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Link to (optional)</Text>
              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
                {[
                  { key: null,      label: 'None',    icon: 'close-outline' },
                  { key: 'class',   label: 'Class',   icon: 'school-outline' },
                  { key: 'project', label: 'Project', icon: 'hammer-outline' },
                  { key: 'game',    label: 'Game',    icon: 'game-controller-outline' },
                ].map(opt => (
                  <TouchableOpacity key={opt.label} onPress={() => { setLinkType(opt.key); clearLink(); }}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: s.sm, borderRadius: r.md, borderWidth: 1, borderColor: linkType === opt.key ? areaColor : c.border, backgroundColor: linkType === opt.key ? areaColor + '22' : 'transparent' }}>
                    <Ionicons name={opt.icon} size={13} color={linkType === opt.key ? areaColor : c.text3} />
                    <Text style={{ fontSize: t.xs, color: linkType === opt.key ? areaColor : c.text3, fontWeight: linkType === opt.key ? t.bold : t.regular }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {linkType && linkLabel ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: areaColor + '15', borderRadius: r.md, padding: s.sm }}>
                  <Ionicons name="link-outline" size={13} color={areaColor} />
                  <Text style={{ flex: 1, fontSize: t.xs, color: areaColor, fontWeight: t.semibold }} numberOfLines={1}>{linkLabel}</Text>
                  <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={clearLink}>
                    <Ionicons name="close-circle" size={15} color={areaColor} />
                  </TouchableOpacity>
                </View>
              ) : null}

              {linkType === 'class' && !linkLabel && (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: s.sm }}>
                      {CLASS_SUBJECTS.filter(sub => sub.children).map(sub => (
                        <TouchableOpacity key={sub.title} onPress={() => setLinkSubject(linkSubject === sub.title ? null : sub.title)}
                          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: linkSubject === sub.title ? sub.color : c.border, backgroundColor: linkSubject === sub.title ? sub.color + '22' : 'transparent' }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: linkSubject === sub.title ? sub.color : c.text3 }}>{sub.title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  {linkSubject && (
                    <View style={{ marginTop: s.sm, gap: 6 }}>
                      {CLASS_SUBJECTS.find(sub => sub.title === linkSubject)?.children.map(ch => (
                        <TouchableOpacity key={ch.label} onPress={() => pickClass(ch.label)}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: s.sm, borderRadius: r.sm, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border }}>
                          <Text style={{ fontSize: t.xs, color: c.text1 }}>{ch.label}</Text>
                          <Ionicons name="chevron-forward" size={13} color={c.text4} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {linkType === 'project' && !linkLabel && (
                loadingProjects ? <ActivityIndicator color={areaColor} style={{ marginTop: s.sm }} /> :
                !projects || projects.length === 0 ? (
                  <Text style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm }}>No open projects in the Workshop yet.</Text>
                ) : (
                  <View style={{ gap: 6, marginTop: s.sm }}>
                    {projects.map(p => (
                      <TouchableOpacity key={p.id} onPress={() => pickProject(p)}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: s.sm, borderRadius: r.sm, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border }}>
                        <Text style={{ flex: 1, fontSize: t.xs, color: c.text1 }} numberOfLines={1}>{p.title}</Text>
                        <Ionicons name="chevron-forward" size={13} color={c.text4} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )
              )}

              {linkType === 'game' && !linkLabel && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: s.sm }}>
                  {getEnabledGames().map(g => (
                    <TouchableOpacity key={g.id} onPress={() => pickGame(g)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0 }}>
                      <Text style={{ fontSize: 11 }}>{g.icon}</Text>
                      <Text style={{ fontSize: 11, color: c.text3, fontWeight: '600' }}>{g.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Duration */}
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Duration (min)</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0 }}
                  value={duration} onChangeText={setDuration}
                  placeholder="e.g. 30" placeholderTextColor={c.text4}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Reminder */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: reminder ? s.sm : 0 }}>
                <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1 }}>{showEmojis ? '🔔 ' : ''}Reminder</Text>
                <Switch value={reminder} onValueChange={setReminder}
                  trackColor={{ false: c.borderStrong, true: areaColor + '88' }}
                  thumbColor={reminder ? areaColor : c.text3} />
              </View>
              {reminder && (
                <View style={{ flexDirection: 'row', gap: s.sm }}>
                  {REMINDER_OPTS.map(opt => (
                    <TouchableOpacity key={opt.val} onPress={() => setReminderMin(opt.val)}
                      style={{ flex: 1, padding: s.sm, borderRadius: r.md, borderWidth: 1, alignItems: 'center', borderColor: reminderMin === opt.val ? areaColor : c.border, backgroundColor: reminderMin === opt.val ? areaColor + '22' : 'transparent' }}>
                      <Text style={{ fontSize: t.xs, color: reminderMin === opt.val ? areaColor : c.text3 }}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Notes */}
            <View>
              <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Notes</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, minHeight: 60, textAlignVertical: 'top' }}
                value={notes} onChangeText={setNotes}
                placeholder="Optional notes..." placeholderTextColor={c.text4}
                multiline
              />
            </View>
            </>)}

            {/* Save */}
            <TouchableOpacity onPress={save} disabled={!title.trim() || saving}
              style={{ backgroundColor: areaColor, borderRadius: r.md, padding: s.lg, alignItems: 'center', opacity: (!title.trim() || saving) ? 0.5 : 1 }}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>{isEdit ? 'Save Changes' : 'Add to Agenda'}</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Agenda item row ──────────────────────────────────────────────────────────
// Tapping the row opens the item's detail sheet (PlanDetailSheet below); the
// circle ticks it off in place. It used to expand in place instead, which
// hid the notes and actions behind a chevron nobody associated with them.
function AgendaRow({ instance, onUpdate, onOpen, c, t, s, r }) {
  // Reads the profile list directly rather than having it drilled through
  // ListView/TimeView — the badge is only needed here, and threading a prop
  // through two intermediate components for one label isn't worth it.
  const { profiles, active } = useProfiles();
  const rowProfile = instance.profile_id && instance.profile_id !== active?.id
    ? buildProfileLookup(profiles)[instance.profile_id]
    : null;
  const [saving,   setSaving]   = useState(false);
  const area     = AREAS[instance.area] || AREAS.physical;
  const overdue  = isOverdue(instance);
  const done     = instance.completed;
  const skipped  = instance.skipped;

  const handle = async (fn) => {
    setSaving(true);
    try { const updated = await fn(instance.id); if (onUpdate) onUpdate(updated); }
    catch (e) {
      console.warn('AgendaRow', e);
      Alert.alert("Couldn't update that", 'Something went wrong — try again.');
    }
    setSaving(false);
  };

  return (
    <View style={{
      borderRadius: r.md, marginBottom: s.sm,
      backgroundColor: c.bg1, borderWidth: 0.5,
      borderColor: overdue ? '#e05858' : done ? c.border : area.color + '55',
      borderLeftWidth: 3, borderLeftColor: overdue ? '#e05858' : area.color,
      opacity: skipped ? 0.5 : 1,
    }}>
      {/* Main row */}
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: s.md, gap: s.sm }}
        onPress={() => onOpen(instance)} activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel={`${instance.title}. Show details`}>
        {/* Check circle */}
        <TouchableOpacity
          onPress={() => handle(() => completeInstance(instance.id, !done))}
          disabled={saving || skipped}
          accessibilityRole="checkbox" accessibilityState={{ checked: !!done }}
          accessibilityLabel={done ? `Mark ${instance.title} not done` : `Mark ${instance.title} done`}
          hitSlop={8}
          style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: done ? area.color : c.border, backgroundColor: done ? area.color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {saving ? <ActivityIndicator size="small" color={area.color} />
            : done ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.medium, color: done ? c.text3 : c.text1, textDecorationLine: done || skipped ? 'line-through' : 'none', flex: 1 }} numberOfLines={2}>
              {instance.title}
            </Text>
            {overdue && !done && (
              <View style={{ backgroundColor: '#e0585822', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 11, color: '#e05858', fontWeight: t.bold }}>MISSED</Text>
              </View>
            )}
            {/* Only shown when the item belongs to a profile other than the
                active one — labelling your own items with your own profile
                name on every row would be noise. */}
            {rowProfile && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: rowProfile.color + '22', borderWidth: 0.5, borderColor: rowProfile.color + '88' }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: rowProfile.color }} />
                <Text style={{ fontSize: 11, color: rowProfile.color, fontWeight: t.bold }} numberOfLines={1}>{rowProfile.name}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: s.sm, marginTop: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11 }}>{area.emoji}</Text>
            {instance.start_time ? (
              <Text style={{ fontSize: t.xs, color: c.text2, fontWeight: t.semibold }}>{timeRange(instance.start_time, instance.duration_minutes)}</Text>
            ) : instance.duration_minutes ? (
              <Text style={{ fontSize: t.xs, color: c.text3 }}>{instance.duration_minutes} min</Text>
            ) : null}
            {instance.cadence && instance.cadence !== 'once' && (
              <Text style={{ fontSize: t.xs, color: c.text3 }}>· {instance.cadence}</Text>
            )}
            {!!instance.notes && !instance.notes.startsWith('notif:') && (
              <Ionicons name="document-text-outline" size={12} color={c.text3} accessibilityLabel="Has notes" />
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={14} color={c.text4} />
      </TouchableOpacity>

      {/* Missed-item quick actions — one tap, no need to open it first.
          Do Now = completeInstance, Move = rescheduleInstance (defaults to
          today), Drop = skipInstance; see plannerService.js. */}
      {overdue && !done && !skipped && (
        <View style={{ flexDirection: 'row', gap: s.sm, paddingHorizontal: s.md, paddingBottom: s.md, flexWrap: 'wrap' }}>
          <ActionBtn label="Do Now" icon="checkmark-circle-outline" color={area.color}
            onPress={() => handle(() => completeInstance(instance.id, true))} />
          <ActionBtn label="Move to today" icon="calendar-outline" color={c.text3}
            onPress={() => handle(() => rescheduleInstance(instance.id))} />
          <ActionBtn label="Drop" icon="close-circle-outline" color="#e05858"
            onPress={() => handle(() => skipInstance(instance.id))} />
        </View>
      )}
    </View>
  );
}

function ActionBtn({ label, icon, color, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: color + '88', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={{ fontSize: 12, color, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Time-based daily view ────────────────────────────────────────────────────
// Items that overlap sit side by side (layoutDay in plannerLayout.js) rather
// than stacked on one another, the hours stretch to fit anything early or
// late, and an empty slot is a button that adds something at that time.
function TimeView({ instances, date, onUpdate, onOpen, onAddAt, c, t, s, r }) {
  const scrollRef = useRef(null);
  const scrolled  = useRef(false);
  const [gridW, setGridW] = useState(0);
  const [allUntimed, setAllUntimed] = useState(false);
  const timed   = instances.filter(i => i.start_time);
  // Open ones first. A long list of all-day habits used to push the whole
  // hour grid off the screen, so only the first few show until asked.
  const untimed = instances.filter(i => !i.start_time)
    .sort((a, b) => Number(!!a.completed || !!a.skipped) - Number(!!b.completed || !!b.skipped));
  const shownUntimed = allUntimed ? untimed : untimed.slice(0, UNTIMED_PREVIEW);
  const { start: hStart, end: hEnd } = hourRange(timed, { start: DAY_START, end: DAY_END });
  const hours = Array.from({ length: hEnd - hStart }, (_, i) => hStart + i);
  const boxes = layoutDay(timed, { minMinutes: MIN_BOX_MINUTES });
  const isToday = toISO(date) === toISO(new Date());
  const yOf = (mins) => (mins / 60 - hStart) * HOUR_H;

  // Open on now (today) or the first thing planned, not always 6am. Not
  // while there are all-day items still to do: those are the top of the
  // list, and opening past them hid a new account's first habit.
  const openUntimed = untimed.filter(i => !i.completed && !i.skipped).length;
  const scrollToStart = (gridTop) => {
    if (scrolled.current) return;
    scrolled.current = true;
    if (openUntimed > 0) return;
    const now = new Date();
    const target = isToday ? now.getHours() * 60 + now.getMinutes() : boxes[0]?.top;
    if (target == null) return;
    const y = Math.max(0, gridTop + yOf(target) - HOUR_H);
    setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 0);
  };

  // Something added "any time" goes in up top, above wherever the view
  // already scrolled to. Saving a habit and seeing nothing change read as
  // the save not working (found 2026-10-01), so go back up to show it.
  const prevUntimed = useRef(untimed.length);
  useEffect(() => {
    if (untimed.length > prevUntimed.current) scrollRef.current?.scrollTo({ y: 0, animated: true });
    prevUntimed.current = untimed.length;
  }, [untimed.length]);

  const hh = (h, m) => `${String(h).padStart(2, '0')}:${m}`;

  return (
    <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Untimed items at top */}
      {untimed.length > 0 && (
        <View style={{ padding: s.lg, paddingBottom: s.sm, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
          <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>{isToday ? 'Any time today' : 'Any time'}</Text>
          {shownUntimed.map(inst => (
            <AgendaRow key={inst.id} instance={inst} onUpdate={onUpdate} onOpen={onOpen} c={c} t={t} s={s} r={r} />
          ))}
          {untimed.length > UNTIMED_PREVIEW && (
            <TouchableOpacity onPress={() => setAllUntimed(v => !v)} accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: s.sm }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.teal }}>
                {allUntimed ? 'Show fewer' : `Show all ${untimed.length}`}
              </Text>
              <Ionicons name={allUntimed ? 'chevron-up' : 'chevron-down'} size={13} color={c.teal} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {timed.length === 0 && (
        <Text style={{ fontSize: t.xs, color: c.text3, textAlign: 'center', paddingTop: s.md }}>
          Tap a time below to plan something then.
        </Text>
      )}

      {/* Hour grid */}
      <View style={{ position: 'relative', paddingLeft: 56, paddingRight: s.lg, marginTop: s.md }}
        onLayout={(e) => scrollToStart(e.nativeEvent.layout.y)}>
        {hours.map(h => (
          <View key={h} style={{ height: HOUR_H, borderTopWidth: 0.5, borderTopColor: c.border }}>
            <Text style={{ position: 'absolute', left: -52, top: -8, fontSize: 11, color: c.text3, width: 44, textAlign: 'right' }}>
              {h % 12 || 12}{h < 12 || h === 24 ? 'am' : 'pm'}
            </Text>
            {/* Each half hour is its own "add here" button. */}
            {['00', '30'].map(m => (
              <TouchableOpacity key={m} onPress={() => onAddAt(hh(h, m))}
                accessibilityRole="button" accessibilityLabel={`Add something at ${fmt12(hh(h, m))}`}
                style={{ height: HOUR_H / 2, borderBottomWidth: m === '00' ? 0.5 : 0, borderBottomColor: c.border + '66', borderStyle: 'dashed' }} />
            ))}
          </View>
        ))}

        {/* Current time line, only on today's page. Drawn under the items so
            it doesn't read as a line struck through a title; the dot in the
            hour gutter still marks the time. */}
        {isToday && <CurrentTimeLine startHour={hStart} endHour={hEnd} />}

        {/* Timed items, laid out in columns where they overlap */}
        <View pointerEvents="box-none" onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
          style={{ position: 'absolute', left: 56, right: s.lg, top: 0, bottom: 0 }}>
          {gridW > 0 && boxes.map(({ item: inst, top, bottom, col, cols }) => {
            const area = AREAS[inst.area] || AREAS.physical;
            const colW = gridW / cols;
            const height = Math.max(((bottom - top) / 60) * HOUR_H - 2, 24);
            const done = inst.completed, skipped = inst.skipped;
            return (
              <TouchableOpacity key={inst.id} onPress={() => onOpen(inst)}
                accessibilityRole="button" accessibilityLabel={`${inst.title}, ${timeRange(inst.start_time, inst.duration_minutes)}. Show details`}
                style={{ position: 'absolute', top: yOf(top) + 1, height, left: col * colW, width: colW - 3,
                         backgroundColor: c.bg1, borderRadius: r.sm, overflow: 'hidden',
                         borderWidth: 0.5, borderColor: area.color + '88', borderLeftWidth: 3, borderLeftColor: area.color,
                         opacity: skipped ? 0.45 : 1 }}>
                <View style={{ flex: 1, backgroundColor: area.color + (done ? '14' : '2a'), paddingHorizontal: 6, paddingVertical: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {done && <Ionicons name="checkmark-circle" size={12} color={area.color} />}
                    <Text numberOfLines={height >= 52 ? 2 : 1}
                      style={{ flex: 1, fontSize: 12, fontWeight: t.bold, color: done ? c.text3 : c.text1, textDecorationLine: done || skipped ? 'line-through' : 'none' }}>
                      {inst.title}
                    </Text>
                  </View>
                  {height >= 34 && (
                    <Text numberOfLines={1} style={{ fontSize: 11, color: c.text2 }}>
                      {timeRange(inst.start_time, inst.duration_minutes)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </ScrollView>
  );
}

function CurrentTimeLine({ startHour, endHour }) {
  const now   = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  const y     = (hours - startHour) * HOUR_H;
  if (y < 0 || y > (endHour - startHour) * HOUR_H) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 50, right: 0, top: y - 5, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#e05858' }} />
      <View style={{ flex: 1, height: 1.5, backgroundColor: '#e05858' }} />
    </View>
  );
}

// ─── List daily view ──────────────────────────────────────────────────────────
function ListView({ instances, onUpdate, onOpen, onAdd, c, t, s, r }) {
  const { showEmojis } = useUIPrefs();
  const sorted   = [...instances].sort(byTime);
  const overdue  = sorted.filter(i => isOverdue(i));
  const today    = sorted.filter(i => !isOverdue(i) && !i.skipped);
  const skipped  = sorted.filter(i => i.skipped);

  const Section = ({ label, items, color }) => items.length === 0 ? null : (
    <View style={{ marginBottom: s.lg }}>
      <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: color || c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>
        {label} · {items.filter(i => i.completed).length}/{items.length}
      </Text>
      {items.map(inst => (
        <AgendaRow key={inst.id} instance={inst} onUpdate={onUpdate} onOpen={onOpen} c={c} t={t} s={s} r={r} />
      ))}
    </View>
  );

  if (instances.length === 0) return (
    <View style={{ alignItems: 'center', paddingTop: 60 }}>
      {showEmojis ? <Text style={{ fontSize: 44, marginBottom: s.lg }}>📋</Text> : <Ionicons name="clipboard-outline" size={40} color={c.text3} style={{ marginBottom: s.lg }} />}
      <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Nothing scheduled</Text>
      {/* "Tap + to add something" — with two + buttons on screen, which? And
          no reason to. A why, and the button itself. */}
      <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', paddingHorizontal: s.xl, lineHeight: 20 }}>
        A day with one thing on it is easier to start than an empty one.
      </Text>
      {!!onAdd && (
        <TouchableOpacity
          onPress={() => onAdd()}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: s.lg, backgroundColor: c.teal, borderRadius: r.lg, paddingHorizontal: s.lg, paddingVertical: 10 }}
        >
          <Ionicons name="add" size={18} color={c.onFill} />
          <Text style={{ fontSize: t.sm, color: c.onFill, fontWeight: t.bold }}>Plan something for today</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}>
      <Section label={showEmojis ? '⚠️ Missed' : 'Missed'} items={overdue} color="#e05858" />
      <Section label="Today" items={today} />
      <Section label="Skipped" items={skipped} />
    </ScrollView>
  );
}

// ─── Due ──────────────────────────────────────────────────────────────────────
// Deadlines that live outside the Planner's own rows: project tasks, plain
// tasks and whole projects' finish dates (deadlinesService.js). Before this,
// a project task due Wednesday was nowhere on Wednesday.
const DUE_KIND = { project_task: 'Project task', task: 'Task', project: 'Project finish date' };

function DueList({ items, onChange, label = 'Due', c, t, s, r }) {
  const navigation = useNavigation();
  const [busy, setBusy] = useState(null);
  if (!items.length) return null;
  const toggle = async (item) => {
    if (item.kind === 'project' || busy) return;
    setBusy(item.key);
    try { await setDueItemDone(item, !item.completed); onChange?.(); }
    catch (e) { Alert.alert('Could not update that', e.message || 'Try again.'); }
    setBusy(null);
  };
  return (
    <View style={{ paddingHorizontal: s.lg, paddingTop: s.sm, paddingBottom: s.xs }}>
      <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>
        {label} · {items.filter(i => i.completed).length}/{items.length}
      </Text>
      {items.map(item => (
        <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.gold, paddingHorizontal: s.md, paddingVertical: s.sm, marginBottom: s.xs }}>
          {item.kind === 'project' ? (
            <Ionicons name="flag-outline" size={18} color={c.gold} />
          ) : (
            <TouchableOpacity onPress={() => toggle(item)} accessibilityRole="checkbox" accessibilityState={{ checked: item.completed }}
              accessibilityLabel={`${item.title}, ${item.completed ? 'done' : 'not done'}`} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {busy === item.key ? <ActivityIndicator size="small" color={c.gold} />
                : <Ionicons name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.completed ? c.gold : c.text3} />}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={{ flex: 1 }} disabled={!item.projectId} accessibilityRole="button"
            accessibilityLabel={item.projectId ? `${item.title}. Open the project` : item.title}
            onPress={() => openTarget(navigation, { kind: 'project', id: item.projectId })}>
            <Text numberOfLines={2} style={{ fontSize: t.sm, fontWeight: t.medium, color: item.completed ? c.text3 : c.text1, textDecorationLine: item.completed ? 'line-through' : 'none' }}>
              {item.kind === 'project' ? `Finish: ${item.title}` : item.title}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: t.xs, color: c.text3, marginTop: 1 }}>
              {DUE_KIND[item.kind]}{item.projectTitle && item.kind !== 'project' ? ` · ${item.projectTitle}` : ''}
            </Text>
          </TouchableOpacity>
          {!!item.projectId && <Ionicons name="chevron-forward" size={14} color={c.text4} />}
        </View>
      ))}
    </View>
  );
}

// ─── Daily page ───────────────────────────────────────────────────────────────
function DailyPage({ userId, date, activeAreas, timeMode, onOpen, onAdd, refreshKey, showingAll, c, t, s, r }) {
  const [instances,  setInstances]  = useState([]);
  const [due,        setDue]        = useState([]);
  const [loading,    setLoading]    = useState(true);

  // activeAreas has to be a dependency here — load() reads it to filter the
  // fetched rows, so without it in the array, toggling a filter chip updates
  // the parent's state and re-renders this component with a new prop, but
  // never actually re-runs load() to apply it. The chip would visually
  // highlight while the list underneath stayed exactly as it was.
  useEffect(() => { load(); }, [date, refreshKey, activeAreas, showingAll]);

  // The spinner is for the first load only (the page remounts per day). A
  // reload after ticking or editing something swaps the rows in place, so
  // the page doesn't blank and jump back to the top after every change.
  const load = async () => {
    try {
      const iso = toISO(date);
      const [rows, dueRows] = await Promise.all([
        getInstances(userId, { date: iso, allProfiles: showingAll }),
        // Deadlines carry no life area, so an area filter leaves them out.
        activeAreas.size > 0 ? [] : getDueItems(userId, iso, iso),
      ]);
      let data = rows;
      if (activeAreas.size > 0) data = data.filter(i => activeAreas.has(i.area));
      setInstances(data);
      setDue(dueRows);
    } catch (e) { console.warn('DailyPage', e); }
    setLoading(false);
  };

  const handleUpdate = (updated) => {
    if (!updated) { load(); return; }
    setInstances(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
  };

  const completed = instances.filter(i => i.completed).length;
  const total     = instances.filter(i => !i.skipped).length;

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.teal} />;

  const sharedProps = { instances, date, onUpdate: handleUpdate, onOpen, onAdd, onAddAt: (time) => onAdd(time), c, t, s, r };

  return (
    <View style={{ flex: 1 }}>
      {/* Check-in + progress */}
      <View style={{ paddingHorizontal: s.lg, paddingTop: s.sm }}>
        <DailyCheckin userId={userId} date={toISO(date)} />
        {total > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
            <View style={{ flex: 1, height: 4, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: c.teal, width: `${(completed / total) * 100}%` }} />
            </View>
            <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.bold }}>{completed}/{total}</Text>
          </View>
        )}
      </View>
      <DueList items={due} onChange={load} label={toISO(date) === toISO(new Date()) ? 'Due today' : 'Due'} c={c} t={t} s={s} r={r} />
      {timeMode
        ? <TimeView {...sharedProps} />
        : <ListView {...sharedProps} />
      }
    </View>
  );
}

// ─── Weekly view ──────────────────────────────────────────────────────────────
function WeeklyView({ userId, anchor, activeAreas, onDayPress, refreshKey, showingAll, c, t, s }) {
  const [byDate,  setByDate]  = useState({});
  const [dueByDate, setDueByDate] = useState({});
  const [loading, setLoading] = useState(true);
  // 'grid': the week side by side, seven columns. 'list': the day rows it
  // used to be, kept for long days. Remembered per device.
  const [layout, setLayout] = useState('grid');
  useEffect(() => {
    AsyncStorage.getItem(WEEK_LAYOUT_KEY).then(v => { if (v === 'list' || v === 'grid') setLayout(v); }).catch(() => {});
  }, []);
  const pickLayout = (v) => { setLayout(v); AsyncStorage.setItem(WEEK_LAYOUT_KEY, v).catch(() => {}); };
  const weekDays = getWeekDays(anchor);
  const today    = toISO(new Date());

  // Same missing-dependency bug as DailyPage — see its comment above.
  useEffect(() => { load(); }, [anchor, refreshKey, activeAreas, showingAll]);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, dueRows] = await Promise.all([
        getInstances(userId, { weekStart: toISO(weekDays[0]), weekEnd: toISO(weekDays[6]), allProfiles: showingAll }),
        activeAreas.size > 0 ? [] : getDueItems(userId, toISO(weekDays[0]), toISO(weekDays[6])),
      ]);
      let data = rows;
      if (activeAreas.size > 0) data = data.filter(i => activeAreas.has(i.area));
      const dueMap = {};
      dueRows.forEach(d => { (dueMap[d.date] = dueMap[d.date] || []).push(d); });
      setDueByDate(dueMap);
      const map = {};
      data.forEach(inst => { if (!map[inst.date]) map[inst.date] = []; map[inst.date].push(inst); });
      Object.values(map).forEach(list => list.sort(byTime));
      setByDate(map);
    } catch (e) { console.warn('WeeklyView', e); }
    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.teal} />;

  const allItems = weekDays.flatMap(d => byDate[toISO(d)] || []);
  const allDue = weekDays.flatMap(d => dueByDate[toISO(d)] || []);
  const weekDone = allItems.filter(i => i.completed).length + allDue.filter(d => d.completed).length;
  const weekTotal = allItems.filter(i => !i.skipped).length + allDue.filter(d => d.kind !== 'project').length;

  const Toggle = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.md }}>
      <Text style={{ flex: 1, fontSize: t.xs, color: c.text3 }}>
        {weekTotal ? `${weekDone} of ${weekTotal} done this week` : 'Nothing planned this week yet'}{allDue.length ? ` · ${allDue.filter(d => !d.completed).length} due` : ''}
      </Text>
      {[['grid', 'grid-outline', 'Week grid'], ['list', 'list-outline', 'Day list']].map(([key, icon, label]) => (
        <TouchableOpacity key={key} onPress={() => pickLayout(key)} accessibilityRole="button"
          accessibilityLabel={label} accessibilityState={{ selected: layout === key }}
          style={{ padding: 6, borderRadius: 8, borderWidth: 1, borderColor: layout === key ? c.teal : c.border, backgroundColor: layout === key ? c.teal + '18' : 'transparent' }}>
          <Ionicons name={icon} size={15} color={layout === key ? c.teal : c.text3} />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (layout === 'grid') return (
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.md, paddingBottom: 80 }}>
      {Toggle}
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {weekDays.map((day, i) => {
          const iso = toISO(day);
          const items = (byDate[iso] || []).filter(x => !x.skipped);
          const dueHere = dueByDate[iso] || [];
          const isToday = iso === today;
          const missed = items.some(x => isOverdue(x));
          const blocks = [
            ...dueHere.map(d => ({ key: d.key, due: d, title: d.kind === 'project' ? `Finish: ${d.title}` : d.title, done: d.completed })),
            ...items.map(x => ({ key: x.id, inst: x, title: x.title, done: x.completed })),
          ];
          const shown = blocks.slice(0, WEEK_GRID_MAX);
          return (
            <TouchableOpacity key={iso} onPress={() => onDayPress(day)} activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}: ${items.length} planned${dueHere.length ? `, ${dueHere.length} due` : ''}. Open the day`}
              style={{ flex: 1, minWidth: 0, minHeight: 280, backgroundColor: isToday ? c.teal + '10' : c.bg1, borderRadius: 8, borderWidth: isToday ? 1.5 : 0.5, borderColor: isToday ? c.teal : missed ? c.error : c.border, paddingBottom: 4, overflow: 'hidden' }}>
              <View style={{ alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: isToday ? c.teal : c.text3 }}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <View style={{ marginTop: 2, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? c.teal : 'transparent' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: isToday ? c.onFill : c.text1 }}>{day.getDate()}</Text>
                </View>
              </View>
              {shown.map(b => {
                const color = b.due ? c.gold : (AREAS[b.inst.area]?.color || c.teal);
                const time = b.inst?.start_time ? shortTime(b.inst.start_time) : null;
                return (
                  <View key={b.key} style={{ marginTop: 3, marginHorizontal: 2, borderRadius: 4, borderLeftWidth: 2, borderLeftColor: color, backgroundColor: color + (b.done ? '12' : '26'), paddingHorizontal: 3, paddingVertical: 2, opacity: b.done ? 0.6 : 1 }}>
                    {b.due ? (
                      <Text style={{ fontSize: 11, fontWeight: '800', color: c.gold }}>{b.due.kind === 'project' ? 'FINISH' : 'DUE'}</Text>
                    ) : time ? (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: c.text2 }}>{time}</Text>
                    ) : null}
                    <Text numberOfLines={3} style={{ fontSize: 11, lineHeight: 13, color: b.done ? c.text3 : c.text1, textDecorationLine: b.done ? 'line-through' : 'none' }}>{b.title}</Text>
                  </View>
                );
              })}
              {blocks.length > shown.length && (
                <Text style={{ fontSize: 11, fontWeight: '700', color: c.text3, textAlign: 'center', marginTop: 4 }}>+{blocks.length - shown.length}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={{ fontSize: 11, color: c.text3, textAlign: 'center', marginTop: s.sm }}>Tap a day to open it.</Text>
    </ScrollView>
  );

  return (
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}>
      {Toggle}
      {weekDays.map((day, i) => {
        const iso     = toISO(day);
        const items   = byDate[iso] || [];
        const isToday = iso === today;
        const done    = items.filter(i => i.completed).length;
        const missed  = items.filter(i => isOverdue(i)).length;
        const dueHere = dueByDate[iso] || [];
        return (
          <TouchableOpacity key={i} onPress={() => onDayPress(day)}
            style={{ backgroundColor: c.bg1, borderRadius: 12, marginBottom: s.sm, borderWidth: isToday ? 1.5 : 0.5, borderColor: isToday ? c.teal : missed > 0 ? '#e05858' : c.border, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: s.md, gap: s.sm }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: isToday ? c.teal : c.bg2, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: isToday ? c.onFill : c.text1 }}>{day.getDate()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: isToday ? c.teal : c.text1 }}>
                  {day.toLocaleDateString('en-US', { weekday: 'long' })}
                </Text>
                <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 1 }}>
                  {items.length} {items.length === 1 ? 'item' : 'items'} · {done} done{missed > 0 ? ` · ${missed} missed` : ''}{dueHere.some(d => !d.completed) ? ` · ${dueHere.filter(d => !d.completed).length} due` : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={c.text4} />
            </View>
            {dueHere.map(d => (
              <View key={d.key} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 4, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <Ionicons name={d.kind === 'project' ? 'flag-outline' : d.completed ? 'checkmark-circle' : 'ellipse-outline'} size={11} color={c.gold} />
                <Text style={{ flex: 1, fontSize: t.xs, color: d.completed ? c.text3 : c.text1, textDecorationLine: d.completed ? 'line-through' : 'none' }} numberOfLines={1}>
                  {d.kind === 'project' ? `Finish: ${d.title}` : `Due: ${d.title}`}
                </Text>
              </View>
            ))}
            {items.slice(0, 3).map((inst, j) => (
              <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 4, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: AREAS[inst.area]?.color || c.teal }} />
                <Text style={{ flex: 1, fontSize: t.xs, color: inst.completed ? c.text3 : c.text1, textDecorationLine: inst.completed ? 'line-through' : 'none' }} numberOfLines={1}>{inst.title}</Text>
                {inst.start_time && <Text style={{ fontSize: 11, color: c.text3 }}>{fmt12(inst.start_time)}</Text>}
              </View>
            ))}
            {items.length > 3 && (
              <Text style={{ fontSize: t.xs, color: c.text3, padding: s.sm, paddingLeft: s.md }}>+{items.length - 3} more</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const WEEK_LAYOUT_KEY = '@cth_planner_week_layout';
const WEEK_GRID_MAX = 6;
// '14:30' -> '2:30p', '09:00' -> '9a': room for a time in a seventh of a phone.
function shortTime(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  if (!Number.isFinite(h)) return '';
  const hr = h % 12 || 12;
  return `${hr}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'a' : 'p'}`;
}

// ─── Monthly view ─────────────────────────────────────────────────────────────
function MonthlyView({ userId, anchor, activeAreas, onDayPress, refreshKey, showingAll, c, t, s }) {
  const [countByDate, setCount]   = useState({});
  const [doneByDate,  setDone]    = useState({});
  const [loading,     setLoading] = useState(true);
  const today        = toISO(new Date());
  const year         = anchor.getFullYear();
  const month        = anchor.getMonth();
  const firstDay     = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  // Same missing-dependency bug as DailyPage — see its comment above.
  useEffect(() => { load(); }, [anchor, refreshKey, activeAreas, showingAll]);

  const load = async () => {
    setLoading(true);
    try {
      let data = await getInstances(userId, { month: month + 1, year, allProfiles: showingAll });
      if (activeAreas.size > 0) data = data.filter(i => activeAreas.has(i.area));
      const cm = {}, dm = {};
      data.forEach(inst => {
        cm[inst.date] = (cm[inst.date] || 0) + 1;
        if (inst.completed) dm[inst.date] = (dm[inst.date] || 0) + 1;
      });
      setCount(cm); setDone(dm);
    } catch (e) { console.warn('MonthlyView', e); }
    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.teal} />;
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}>
      <View style={{ flexDirection: 'row', marginBottom: s.sm }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: c.text3 }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const iso     = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const count   = countByDate[iso] || 0;
          const done    = doneByDate[iso] || 0;
          const isToday = iso === today;
          const allDone = count > 0 && done === count;
          return (
            <TouchableOpacity key={day} onPress={() => onDayPress(new Date(year, month, day))}
              style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isToday ? c.teal : 'transparent', borderWidth: count > 0 && !isToday ? 1 : 0, borderColor: allDone ? c.teal : c.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: isToday ? '800' : '500', color: isToday ? c.onFill : allDone ? c.teal : c.text1 }}>{day}</Text>
              </View>
              {count > 0 && !allDone && (
                <View style={{ position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: c.gold }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Side panel (add components) ─────────────────────────────────────────────
function SidePanel({ visible, onClose, userId, onAdded, c, t, s, r }) {
  const slideX  = useRef(new Animated.Value(PANEL_W)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [selectedArea, setArea]       = useState(null);
  const [components,   setComponents] = useState([]);
  const [loading,      setLoading]    = useState(false);
  const [scheduled,    setScheduled]  = useState(new Set());
  const [busy,         setBusy]       = useState({});

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideX, { toValue: visible ? 0 : PANEL_W, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
    if (!visible) setTimeout(() => { setArea(null); setComponents([]); setScheduled(new Set()); }, 250);
  }, [visible]);

  const selectArea = async (key) => {
    setArea(key);
    setLoading(true);
    try {
      const comps = await getPresetComponents(AREAS[key].preset);
      setComponents(comps || []);
    } catch (e) { console.warn('SidePanel', e); }
    setLoading(false);
  };

  const schedule = async (comp) => {
    if (scheduled.has(comp.id) || busy[comp.id]) return;
    setBusy(prev => ({ ...prev, [comp.id]: true }));
    try {
      await generateInstances(userId, comp);
      setScheduled(prev => new Set([...prev, comp.id]));
      onAdded();
    } catch (e) { console.warn('schedule', e); }
    setBusy(prev => ({ ...prev, [comp.id]: false }));
  };

  const scheduleAll = async () => {
    for (const comp of components) {
      if (!scheduled.has(comp.id)) await schedule(comp);
    }
  };

  const areaObj   = selectedArea ? AREAS[selectedArea] : null;
  const areaColor = areaObj?.color || c.teal;
  const byGroup   = { daily: [], weekly: [], monthly: [] };
  components.forEach(comp => { if (byGroup[comp.cadence]) byGroup[comp.cadence].push(comp); });

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }}>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#000', opacity: Animated.multiply(opacity, 0.5) }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: PANEL_W, backgroundColor: c.bg0, transform: [{ translateX: slideX }], shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 20 }}>
        {/* Header */}
        <View style={{ backgroundColor: c.headerBg, padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
          <TouchableOpacity accessibilityLabel="Next" accessibilityRole="button" onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="chevron-forward" size={22} color={c.text3} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>Add to Planner</Text>
            <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Tap any item to schedule it</Text>
          </View>
        </View>

        <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 40 }}>
          {!selectedArea ? (
            <View style={{ padding: s.lg, gap: s.sm }}>
              {Object.entries(AREAS).filter(([, a]) => a.preset).map(([key, area]) => (
                <TouchableOpacity key={key} onPress={() => selectArea(key)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
                  <Text style={{ fontSize: 26 }}>{area.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{area.label}</Text>
                    <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Daily, weekly & monthly</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.text4} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ padding: s.lg }}>
              <TouchableOpacity onPress={() => { setArea(null); setComponents([]); setScheduled(new Set()); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.lg }}>
                <Ionicons name="chevron-back" size={16} color={c.teal} />
                <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.semibold }}>All areas</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.md }}>
                <Text style={{ fontSize: 22 }}>{areaObj?.emoji}</Text>
                <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: areaColor }}>{areaObj?.label}</Text>
              </View>

              {loading ? <ActivityIndicator color={areaColor} style={{ marginTop: s.xl }} /> : (
                <>
                  {components.length > 0 && scheduled.size < components.length && (
                    <TouchableOpacity onPress={scheduleAll}
                      style={{ backgroundColor: areaColor, borderRadius: r.md, padding: s.md, alignItems: 'center', marginBottom: s.lg }}>
                      <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Schedule all {components.length}</Text>
                    </TouchableOpacity>
                  )}
                  {scheduled.size === components.length && components.length > 0 && (
                    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, alignItems: 'center', marginBottom: s.lg, borderWidth: 1, borderColor: c.teal }}>
                      <Text style={{ color: c.teal, fontWeight: t.bold }}>✓ All scheduled</Text>
                    </View>
                  )}
                  {['daily','weekly','monthly'].map(cad => {
                    const items = byGroup[cad];
                    if (!items.length) return null;
                    return (
                      <View key={cad} style={{ marginBottom: s.lg }}>
                        <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>{cad}</Text>
                        {items.map(comp => {
                          const done = scheduled.has(comp.id);
                          const isBusy = busy[comp.id];
                          return (
                            <TouchableOpacity key={comp.id} onPress={() => schedule(comp)} disabled={done || isBusy}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: done ? areaColor : c.border, borderLeftWidth: 3, borderLeftColor: areaColor, opacity: done ? 0.6 : 1 }}>
                              {isBusy
                                ? <ActivityIndicator size="small" color={areaColor} style={{ width: 20 }} />
                                : <Ionicons name={done ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={done ? areaColor : c.text4} />
                              }
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: t.xs, fontWeight: t.medium, color: done ? c.text3 : c.text1, textDecorationLine: done ? 'line-through' : 'none' }}>{comp.title}</Text>
                                {comp.duration_minutes && <Text style={{ fontSize: 11, color: areaColor, marginTop: 2 }}>⏱ {comp.duration_minutes}m</Text>}
                              </View>
                              {done && <Text style={{ fontSize: 11, color: areaColor, fontWeight: t.bold }}>Added</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

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
  const [loading,     setLoading] = useState(true);
  const [refreshKey,  setRefresh] = useState(0);
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
  const { activeObjective } = useAccess();
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

  // Something just scheduled from elsewhere (the Capture Inbox) opens on its
  // own day, so it's on screen rather than on a day nobody is looking at.
  const dateParam = route.params?.date;
  useEffect(() => {
    if (!dateParam) return;
    setView('Daily');
    setAnchor(new Date(dateParam + 'T00:00:00'));
    navigation.setParams({ date: undefined });
  }, [dateParam]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!loading && !userId) return (
    <SignInPrompt
      icon="calendar-outline"
      title="Your planner lives in your account"
      body="Sign in to plan your days, set routines and get reminders. It syncs across your devices."
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>

      {/* ── Header ── */}
      <View style={{ backgroundColor: c.headerBg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        {/* Title + actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
          <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, flex: 1 }}>{showEmojis ? '📓 ' : ''}Planner</Text>
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <FillWithAIButton target="planner" />
            <TourSpot id="planner-add">
            <TouchableOpacity
              onPress={openAdd}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.teal, borderRadius: r.lg, paddingHorizontal: s.md, paddingVertical: 6 }}>
              <Ionicons name="add" size={16} color={c.onFill} />
              <Text style={{ fontSize: t.xs, color: c.onFill, fontWeight: t.bold }}>Add</Text>
            </TouchableOpacity>
            </TourSpot>
            {/* Three unlabeled icons (a chart, a clock, a grid) used to sit
                here; nobody could tell what they did. Named, in one menu. */}
            <MoreMenu items={[
              { label: 'Add from ideas', icon: 'grid-outline', onPress: () => setPanel(true) },
              view === 'Daily' && {
                label: timeMode ? 'Show as a list' : 'Show by time of day',
                icon: timeMode ? 'list' : 'time-outline',
                onPress: () => setTimeMode(m => !m),
              },
              { label: 'Add to my calendar', icon: 'calendar-outline', onPress: exportCalendar },
              { label: 'Remove duplicates', icon: 'copy-outline', onPress: removeDuplicates },
              { label: 'Weekly review', icon: 'stats-chart-outline', onPress: () => navigation.navigate('WeeklyReviewScreen') },
            ]} />
          </View>
        </View>

        {/* View switcher */}
        <TourSpot id="planner-views">
        <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, gap: s.sm, paddingBottom: s.sm }}>
          {VIEWS.map(v => (
            <TouchableOpacity key={v} onPress={() => setView(v)}
              style={{ paddingHorizontal: s.md, paddingVertical: 5, borderRadius: 20, backgroundColor: view === v ? c.teal : 'transparent', borderWidth: 1, borderColor: view === v ? c.teal : c.border }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: view === v ? c.onFill : c.text3 }}>{v}</Text>
            </TouchableOpacity>
          ))}

          {/* Widen across profiles. Only worth showing once there's more than
              one profile to widen across. */}
          {profiles.length > 1 && (
            <TouchableOpacity
              onPress={toggleScope}
              style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4,
                       paddingHorizontal: s.md, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
                       borderColor: showingAll ? c.gold : c.border,
                       backgroundColor: showingAll ? c.gold + '22' : 'transparent' }}
              accessibilityRole="button"
              accessibilityLabel={showingAll ? 'Showing all profiles. Tap to show only this profile.' : 'Showing this profile only. Tap to show all profiles.'}
            >
              <Ionicons name={showingAll ? 'layers' : 'person'} size={12} color={showingAll ? c.gold : c.text3} />
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: showingAll ? c.gold : c.text3 }}>
                {showingAll ? 'All profiles' : 'This profile'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        </TourSpot>

        {/* Period nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, paddingBottom: s.sm }}>
          <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" onPress={prevPeriod} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={18} color={c.text3} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center' }} onPress={() => setAnchor(new Date())}>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: isToday ? c.teal : c.text1 }}>{periodLabel()}</Text>
            {!isToday && view === 'Daily' && <Text style={{ fontSize: 11, color: c.text3 }}>tap to return to today</Text>}
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Next" accessibilityRole="button" onPress={nextPeriod} style={{ padding: 6 }}>
            <Ionicons name="chevron-forward" size={18} color={c.text3} />
          </TouchableOpacity>
        </View>

        {/* Area filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: s.lg, paddingVertical: s.sm, gap: s.sm }}>
          <TouchableOpacity onPress={() => toggleArea('all')}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: activeAreas.size === 0 ? c.gold : c.border, backgroundColor: activeAreas.size === 0 ? c.gold + '22' : 'transparent' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: activeAreas.size === 0 ? c.gold : c.text3 }}>All</Text>
          </TouchableOpacity>
          {Object.entries(AREAS).map(([key, area]) => {
            const active = activeAreas.has(key);
            return (
              <TouchableOpacity key={key} onPress={() => toggleArea(key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: active ? area.color : c.border, backgroundColor: active ? area.color + '22' : 'transparent' }}>
                <Text style={{ fontSize: 12 }}>{area.emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: active ? area.color : c.text3 }}>{area.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <ActivityIndicator color={c.teal} style={{ marginTop: 40 }} />
      ) : view === 'Daily' ? (
        <DailyPage
          key={`daily-${toISO(anchor)}-${showingAll ? 'all' : 'one'}`}
          userId={userId} date={anchor} onAdd={openAdd}
          activeAreas={activeAreas} timeMode={timeMode}
          onOpen={setDetail}
          showingAll={showingAll}
          refreshKey={refreshKey} c={c} t={t} s={s} r={r}
        />
      ) : view === 'Weekly' ? (
        <WeeklyView userId={userId} anchor={anchor} activeAreas={activeAreas}
          onDayPress={onDayPress} refreshKey={refreshKey} showingAll={showingAll} c={c} t={t} s={s} />
      ) : (
        <MonthlyView userId={userId} anchor={anchor} activeAreas={activeAreas}
          onDayPress={onDayPress} refreshKey={refreshKey} showingAll={showingAll} c={c} t={t} s={s} />
      )}

      {/* ── Side panel ── */}
      <SidePanel
        visible={panelOpen} onClose={() => setPanel(false)}
        userId={userId} onAdded={() => setRefresh(k => k + 1)}
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
        defaultArea={activeAreas.size === 1 ? [...activeAreas][0] : (progressProfile?.active_life_areas?.[0] || 'physical')}
        goalIdea={goalIdeaFor(activeObjective, activeProfile?.baseline)}
        onSave={(saved) => {
          setShowModal(false);
          setRefresh(k => k + 1);
          // A new plan is what ticks "put one habit / study block / routine
          // in the Planner" on a first goal. Edits don't count.
          if (!editInst) signalAction('planner-item-added', { area: saved?.area });
        }}
        onDelete={() => { setShowModal(false); setRefresh(k => k + 1); }}
        onClose={() => setShowModal(false)}
        c={c} t={t} s={s} r={r}
      />
    </View>
  );
}
