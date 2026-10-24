// src/screens/today/InstanceModal.js
// The Planner's Add / Edit sheet. Moved out of PlannerScreen.js for the
// shake-up (docs/shake-up-plan-2026-10-21.md P1).

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native';
import { BusyDot, Skeleton, SCRIM } from '../../ui';
import { Ionicons } from '@expo/vector-icons';
import TimePickerField from '../../components/TimePickerField';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { supabase } from '../../api/profileScopedClient';
import { AREAS, getScheduledTitles, findPlansOn, insertInstances, updateInstance, deleteInstances } from '../../api/plannerService';
import { isSamePlan } from '../../logic/plannerLayout';
import { repeatDates } from '../../logic/aiBridgeFormat';
import { schedulePlanReminder, cancelPlanReminder, hasScheduledReminder } from '../../logic/planReminderActions';
import { markManualReminder, setPlanReminder } from '../../logic/hubNotifications';
import { getQuest } from '../../data/quests';
import { suggestionsForArea } from '../../data/plannerSuggestions';
import MiniCalendar from '../../components/MiniCalendar';
import { CLASS_SUBJECTS, CLASS_SCREEN_MAP } from '../../data/classCatalog';
import { getEnabledGames, getGame } from '../../services/gameRegistry';
import { REPEAT_UNITS, toISO } from './plannerShared';

// ─── Add / Edit instance modal ────────────────────────────────────────────────
// `defaultArea`: where a new item starts (the area being filtered to, else
// the person's own first life area; it was always Physical, which a Student
// who never picked Physical got as the default for a study block).
// `goalIdea`: the running goal's Planner step can name one ({ title,
// cadence, area } on the step in objectives.js), shown first in the ideas.
// `mine` means the title is the person's own words from onboarding, so it
// goes straight into the box instead of waiting as a suggestion.
export default function InstanceModal({ visible, instance, userId, date, initialTime = null, onSave, onDelete, onClose, defaultArea = 'physical', goalIdea = null, c, t, s, r }) {
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
  // Shown above Save instead of an Alert. On web an Alert is a blocking
  // browser dialog, and in a preview that never shows it the sheet just
  // looked frozen after "Add" (2026-10-10, scheduling a movement block that
  // was already on the planner).
  const [saveError,   setSaveError]   = useState(null);
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
    setSaveError(null);
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
    if (!visible || isEdit) return;
    let alive = true;
    getScheduledTitles(userId)
      .then(titles => { if (alive) setScheduledTitles(titles); })
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
    setSaveError(null);
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
        const existing = await findPlansOn(userId, dates);
        const free = dates.filter(d => !existing.some(x => isSamePlan(x, { ...basePayload, date: d })));
        if (!free.length) {
          setSaving(false);
          setSaveError(`“${basePayload.title}” is already on your planner ${dates.length > 1 ? 'on those days' : 'that day'}. Pick another day or change the name.`);
          return;
        }
        rows = free.map(d => ({ ...basePayload, date: d }));
      }

      // plannerService: the account's rows, or the phone's for a guest.
      const writeRows = (list) => (isEdit ? updateInstance(instance.id, list[0]) : insertInstances(userId, list));

      let savedRows;
      try {
        savedRows = await writeRows(rows.map(row => ({ ...row, ...linkFields })));
      } catch (error) {
        // supabase/migrations/20260905150000_planner_links.sql hasn't been
        // run yet on this database — the link_type/link_screen/link_id
        // columns don't exist. Rather than blocking Add/Edit entirely until
        // the user applies it, retry once without them so everything else
        // still works; the link itself is just silently dropped this once.
        const missingLinkColumns = error?.code === 'PGRST204'
          || /link_type|link_screen|link_id/i.test(error?.message || '');
        if (!missingLinkColumns) throw error;
        console.warn('planner link columns missing — retrying without them; run the migration to enable links', error);
        savedRows = await writeRows(rows);
      }

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
      setSaveError(`Couldn't save. ${e?.message || 'Something went wrong, try again.'}`);
    }
    setSaving(false);
  };

  const deleteInstance = () => {
    Alert.alert('Remove', 'Remove this item from your agenda?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        // Cancels its phone reminder too.
        try { await deleteInstances([instance.id]); } catch (e) { console.warn('InstanceModal delete', e?.message); }
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
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: SCRIM.strong, justifyContent: 'flex-end' }}
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
                <Ionicons name="trash-outline" size={18} color={c.error} />
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
              <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Repeats · makes it a habit</Text>
              <View style={{ flexDirection: 'row', gap: s.sm }}>
                {['once','daily','weekly','monthly'].map(cad => (
                  <TouchableOpacity key={cad} onPress={() => setCadence(cad)}
                    style={{ flex: 1, padding: s.sm, borderRadius: r.md, borderWidth: 1, alignItems: 'center', borderColor: cadence === cad ? areaColor : c.border, backgroundColor: cadence === cad ? areaColor + '22' : 'transparent' }}>
                    <Text style={{ fontSize: t.xs, color: cadence === cad ? areaColor : c.text3, fontWeight: cadence === cad ? t.bold : t.regular, textTransform: 'capitalize' }}>{cad}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* "What is a habit? I had no way to label one" (2026-10-10).
                  A habit is anything that repeats: it's what the Habits card
                  on Home counts. Say so where the choice is made. */}
              {cadence !== 'once' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: r.full, backgroundColor: areaColor + '22' }}>
                    <Ionicons name="repeat" size={11} color={areaColor} />
                    <Text style={{ fontSize: 11, fontWeight: t.bold, color: areaColor }}>Habit</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 11, color: c.text3 }}>
                    {isEdit ? 'Changes here apply to this day only.'
                      : `Every ${REPEAT_UNITS[cadence].slice(0, -1)}, for good. Stop it any time.`}
                  </Text>
                </View>
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
                loadingProjects ? <Skeleton lines={2} style={{ marginTop: s.sm }} /> :
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

            {!!saveError && (
              <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', padding: s.sm, borderRadius: r.md, backgroundColor: c.errorLight }}>
                <Ionicons name="alert-circle-outline" size={15} color={c.error} style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: t.xs, color: c.text1 }}>{saveError}</Text>
              </View>
            )}

            {/* Save */}
            <TouchableOpacity onPress={save} disabled={!title.trim() || saving}
              style={{ backgroundColor: areaColor, borderRadius: r.md, padding: s.lg, alignItems: 'center', opacity: (!title.trim() || saving) ? 0.5 : 1 }}>
              {saving
                ? <BusyDot color={c.onFill} />
                : <Text style={{ color: c.onFill, fontWeight: t.bold, fontSize: t.md }}>{isEdit ? 'Save Changes' : 'Add to Agenda'}</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
