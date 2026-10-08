// The Workshop — a single build's page in the drafting notebook: bench,
// materials, and log, sketched on the same blueprint paper as projects.js.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../api/profileScopedClient';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../../api/offlineCache';
import { FONTS } from '../../theme';
import { projectToMarkdown } from '../../logic/exportUtils';
import LinkifiedText from '../../components/LinkifiedText';
import { useBlueprint, BlueprintGrid, CornerTicks, Stamp, RulerBar } from './blueprint';
import { getCoreForProject, plantProjectAsIdea } from '../../api/gardenService';
import ReminderComposer from '../../components/ReminderComposer';
import { shareText, projectText } from '../../logic/shareOut';
import { todayStr, addDays, daysBetween } from '../../logic/dateUtils';
import { useAccess } from '../../../context/AccessContext';
import { formatTime12 } from '../../components/TimePickerField';
import TimeChips from '../../components/TimeChips';
import { WEEKDAY_KEYS, daysLabel, sessionDates } from '../../logic/aiBridgeFormat';
import { listProjectSessions, scheduleWorkSessions } from '../../api/workSessions';
import { recordAction } from '../../logic/gamificationService';
import { advanceNextAction } from '../../api/nextActionService';
import MiniCalendar from '../../components/MiniCalendar';
import { findSplitProject, splitTaskIntoProject, finishPartOf, partOf } from '../../api/splitTaskService';
import { projectProgress } from '../../logic/projectProgress';

const GOLD = '#e8b34a'; // matches the gold trim used in the Idea Garden for linked builds

const NAV = [
  { id: 'workspace', label: 'Workbench', icon: 'hammer-outline' },
  { id: 'library',   label: 'Materials', icon: 'cube-outline' },
  { id: 'activity',  label: 'Project log', icon: 'time-outline' },
];
const FILTERS = ['all', 'notes', 'ideas', 'questions', 'research', 'tasks'];
const typeMap = bp => ({
  notes:     ['Note',     'document-text-outline', bp.accent],
  ideas:     ['Idea',     'bulb-outline',           bp.stamp],
  questions: ['Question', 'help-circle-outline',    bp.draft],
  research:  ['Research', 'flask-outline',          bp.violet],
  tasks:     ['Task',     'checkbox-outline',        bp.approved],
});
const STAGE = { active: 'IN PROGRESS', idea: 'IDEA', completed: 'DONE' };
// Blueprint → Building → Shipped. The hero's stage chips are the one place a
// build changes stage; the Workshop's filters and Home's desk (active only)
// read the same `status` column.
const STAGE_ORDER = ['idea', 'active', 'completed'];
const STAGE_MILESTONE = { idea: '💡 Back to an idea', active: '🔨 In progress', completed: '✅ Done' };
const titleFor = x => x.title || x.body?.slice(0, 90) || 'Untitled item';
const dateFor = x => x.created_at ? new Date(x.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
// Build-log entries with no body fall back to their raw `type` code
// (e.g. 'project_created') — humanize it instead of leaking the slug.
const humanizeType = t => t ? t.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) : '';
// 'YYYY-MM-DD' → "Oct 12", read as a local day (new Date('2026-10-12') is UTC midnight).
const dayLabel = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };
const shortDay = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
// "in 3 days", "today", "2 days late"
const daysAway = iso => { const n = daysBetween(todayStr(), iso); return n === 0 ? 'today' : n === 1 ? 'tomorrow' : n > 1 ? `in ${n} days` : `${-n} day${n === -1 ? '' : 's'} late`; };
// "due Oct 4 · in 3 days", "due today", "2 days late"
const dueWords = iso => { const n = daysBetween(todayStr(), iso); return n < 0 ? daysAway(iso) : n < 2 ? `due ${daysAway(iso)}` : `due ${shortDay(iso)} · ${daysAway(iso)}`; };
// The plan's order: oldest batch first, and inside a batch (one AI plan is
// one insert) the order it was written in.
const planOrder = (a, b) => (new Date(a.created_at) - new Date(b.created_at)) || ((a.sort_order || 0) - (b.sort_order || 0));
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
// Quick picks, plus "Pick a day" (MiniCalendar) for a real deadline: only
// "in 1 week / 1 month" meant a task due Friday, or a project due the 15th,
// couldn't be entered at all (2026-10-07).
const DUE_CHOICES = [{ label: 'None', days: null }, { label: '1 week', days: 7 }, { label: '2 weeks', days: 14 }, { label: '1 month', days: 30 }, { label: '3 months', days: 90 }];
const TASK_DUE_CHOICES = [{ label: 'None', days: null }, { label: 'Today', days: 0 }, { label: 'Tomorrow', days: 1 }, { label: '1 week', days: 7 }, { label: '2 weeks', days: 14 }];
const isoToDate = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const dateToIso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const calColors = bp => ({ bg: bp.paper, text: bp.ink, muted: bp.ink3 });

function Item({ item, bp, compact, onToggle, onOpen }) {
  const s = makeStyles(bp); const TYPE = typeMap(bp);
  const [label, icon, color] = TYPE[item.kind];
  const due = item.kind === 'tasks' && item.due_date && !item.completed ? item.due_date : null;
  const late = due && due < todayStr();
  return <View style={s.item}><TouchableOpacity accessibilityRole="button" accessibilityLabel={item.kind === 'tasks' ? (item.completed ? 'Mark not done' : 'Mark done') : 'Item type'} disabled={item.kind !== 'tasks'} onPress={() => onToggle?.(item)} style={[s.icon, { borderColor: color }]}><Ionicons name={item.kind === 'tasks' && item.completed ? 'checkmark-circle' : icon} size={17} color={color} /></TouchableOpacity><TouchableOpacity style={{ flex: 1 }} disabled={!(onOpen && item.kind === 'tasks')} onPress={() => onOpen?.(item)} accessibilityRole={onOpen && item.kind === 'tasks' ? 'button' : undefined} accessibilityHint={onOpen && item.kind === 'tasks' ? 'Opens this task' : undefined}><Text numberOfLines={compact ? 1 : 2} style={[s.itemTitle, item.completed && s.complete]}>{titleFor(item)}</Text>{!compact && <LinkifiedText numberOfLines={2} style={s.body} linkColor={bp.accent} text={item.body || item.notes || item.url || label} />}<Text style={[s.type, { color }]}>{label}{due ? '' : dateFor(item) ? ` · ${dateFor(item)}` : ''}{due ? <Text style={{ color: late ? bp.stamp : color }}>{` · ${dueWords(due)}`}</Text> : null}</Text></TouchableOpacity></View>;
}

// Time on the calendar for this build: the same days each week at one time,
// for a few weeks. Each session is a Planner row that opens this project.
function WorkTimeModal({ visible, onClose, project, userId, bp, onSaved }) {
  const s = makeStyles(bp);
  const [days, setDays] = useState([6]); const [time, setTime] = useState('10:00'); const [minutes, setMinutes] = useState(60); const [weeks, setWeeks] = useState(4); const [remind, setRemind] = useState(Platform.OS !== 'web'); const [saving, setSaving] = useState(false);
  const dates = sessionDates({ days, weeks, start: addDays(todayStr(), 1) });
  const count = dates.length;
  // The real first day, not "tomorrow": Saturday sessions picked on a
  // Wednesday start on Saturday.
  const firstDay = dates[0] ? dayLabel(typeof dates[0] === 'string' ? dates[0] : dates[0].date) : '';
  const chip = (on, label, onPress, key) => <TouchableOpacity key={key || label} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.choice, on && { borderColor: bp.accent, backgroundColor: bp.accent + '18' }]}><Text style={[s.choiceText, on && { color: bp.ink }]}>{label}</Text></TouchableOpacity>;
  const save = async () => {
    if (!days.length || saving) return;
    setSaving(true);
    try {
      const res = await scheduleWorkSessions(userId, project, { days, time: time || null, minutes, weeks, remind: remind && time ? 15 : false });
      onSaved?.(res.rows.length); onClose();
    } catch (e) { Alert.alert('Could not schedule', e.message || 'Try again.'); }
    setSaving(false);
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={s.shade}><View style={s.modal}><View style={s.modalTop}><Text style={s.modalTitle}>🗓️ Schedule work time</Text><TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose}><Ionicons name="close" size={22} color={bp.ink3} /></TouchableOpacity></View>
    <Text style={s.fieldLabel}>WHICH DAYS</Text><View style={[s.choices, { flexDirection: 'row', flexWrap: 'wrap' }]}>{WEEK_ORDER.map(d => chip(days.includes(d), WEEKDAY_KEYS[d].charAt(0).toUpperCase() + WEEKDAY_KEYS[d].slice(1), () => setDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]), `d${d}`))}</View>
    <Text style={s.fieldLabel}>WHAT TIME</Text><TimeChips value={time} onChange={setTime} radius={4} colors={{ on: bp.accent, off: bp.paper, text: bp.ink2, textOn: bp.ink, border: bp.border }} style={{ marginBottom: 14 }} />
    <Text style={s.fieldLabel}>HOW LONG EACH TIME</Text><View style={[s.choices, { flexDirection: 'row', flexWrap: 'wrap' }]}>{[30, 60, 90, 120, 180].map(m => chip(minutes === m, m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? 's' : ''}`, () => setMinutes(m), `m${m}`))}</View>
    <Text style={s.fieldLabel}>FOR HOW LONG</Text><View style={[s.choices, { flexDirection: 'row', flexWrap: 'wrap' }]}>{[1, 2, 4, 8, 12].map(w => chip(weeks === w, `${w} week${w === 1 ? '' : 's'}`, () => setWeeks(w), `w${w}`))}</View>
    {Platform.OS !== 'web' && <TouchableOpacity onPress={() => setRemind(v => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: remind }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}><Ionicons name={remind ? 'checkbox' : 'square-outline'} size={18} color={bp.accent} /><Text style={s.choiceText}>Phone reminder 15 minutes before{time ? '' : ' (needs a time)'}</Text></TouchableOpacity>}
    <Text style={[s.body, { marginBottom: 12 }]}>{days.length ? `${daysLabel(days)}${time ? ` at ${formatTime12(time)}` : ''}: ${count} session${count === 1 ? '' : 's'}${firstDay ? `, first one ${firstDay}` : ''}. They show in your Planner and open this project.` : 'Pick at least one day.'}</Text>
    <TouchableOpacity onPress={save} disabled={saving || !days.length} style={[s.save, !days.length && { opacity: 0.5 }]}>{saving ? <ActivityIndicator color={bp.onAccent} /> : <Text style={s.saveText}>ADD {count} SESSION{count === 1 ? '' : 'S'} TO MY PLANNER</Text>}</TouchableOpacity></View></View></Modal>;
}

// One task, tapped open: mark it done, or make it its own small project
// (splitTaskService) — the way a long build gets a piece you can finish.
function TaskSheet({ task, project, userId, bp, onClose, onToggle, onOpenProject }) {
  const s = makeStyles(bp);
  const [split, setSplit] = useState(undefined); // undefined = looking, null = none
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setSplit(undefined); setBusy(false);
    if (!task) return undefined;
    let live = true;
    findSplitProject(task.id).then(p => { if (live) setSplit(p || null); });
    return () => { live = false; };
  }, [task]);
  if (!task) return null;
  const makeProject = async () => {
    setBusy(true);
    try { onOpenProject(await splitTaskIntoProject(userId, project, task), true); }
    catch (e) { console.warn('split task', e); Alert.alert('Could not make the project', 'Something went wrong — try again.'); setBusy(false); }
  };
  const row = (icon, label, onPress, primary) => <TouchableOpacity key={label} onPress={onPress} disabled={busy} accessibilityRole="button" style={[primary ? s.save : s.choice, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }, busy && { opacity: 0.5 }]}><Ionicons name={icon} size={16} color={primary ? bp.onAccent : bp.ink2} /><Text style={primary ? s.saveText : s.choiceText}>{label}</Text></TouchableOpacity>;
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><View style={s.shade}><View style={s.modal}><View style={s.modalTop}><Text style={[s.modalTitle, { flex: 1 }]} numberOfLines={3}>{task.title}</Text><TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose}><Ionicons name="close" size={22} color={bp.ink3} /></TouchableOpacity></View>
    {task.due_date ? <Text style={[s.type, { marginBottom: 8 }]}>{task.completed ? 'DONE' : dueWords(task.due_date).toUpperCase()}</Text> : null}
    {task.notes ? <Text style={[s.body, { marginBottom: 14 }]}>{task.notes}</Text> : null}
    {row(task.completed ? 'arrow-undo-outline' : 'checkmark-circle-outline', task.completed ? 'Not done yet' : 'Mark done', () => { onToggle(task); onClose(); }, !task.completed)}
    {split === undefined ? <ActivityIndicator color={bp.accent} style={{ marginVertical: 10 }} />
      : split ? row('open-outline', `Open its project: ${split.title}`, () => onOpenProject(split, false))
      : !task.completed ? <>{row('git-branch-outline', 'Make it its own project', makeProject)}<Text style={[s.body, { marginTop: -2 }]}>A small project you can finish on its own. It stays in this plan, and ticks here when you mark it done.</Text></> : null}
  </View></View></Modal>;
}

// When the whole build should be done. Stored on projects.due_date.
function DueModal({ visible, onClose, current, bp, onPick }) {
  const s = makeStyles(bp);
  const [picking, setPicking] = useState(false);
  const close = () => { setPicking(false); onClose(); };
  const pick = (iso) => { setPicking(false); onPick(iso); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}><View style={s.shade}><View style={s.modal}><View style={s.modalTop}><Text style={s.modalTitle}>🏁 Finish by</Text><TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={close}><Ionicons name="close" size={22} color={bp.ink3} /></TouchableOpacity></View>
    {current ? <Text style={[s.body, { marginBottom: 12 }]}>Now: {dayLabel(current)}</Text> : null}
    <View style={[s.choices, { flexDirection: 'row', flexWrap: 'wrap' }]}>{DUE_CHOICES.map(o => <TouchableOpacity key={o.label} onPress={() => pick(o.days == null ? null : addDays(todayStr(), o.days))} accessibilityRole="button" style={s.choice}><Text style={s.choiceText}>{o.days == null ? 'No date' : `In ${o.label}`}</Text></TouchableOpacity>)}<TouchableOpacity onPress={() => setPicking(v => !v)} accessibilityRole="button" accessibilityState={{ expanded: picking }} style={[s.choice, picking && { borderColor: bp.accent, backgroundColor: bp.accent + '18' }]}><Ionicons name="calendar-outline" size={14} color={bp.accent} /><Text style={s.choiceText}>Pick a day</Text></TouchableOpacity></View>
    {picking ? <View style={{ marginTop: 12 }}><MiniCalendar value={current ? isoToDate(current) : new Date()} onChange={d => pick(dateToIso(d))} color={bp.accent} colors={calColors(bp)} minIso={todayStr()} /></View> : null}</View></View></Modal>;
}

function AddModal({ visible, onClose, projectId, userId, bp, refresh }) {
  const s = makeStyles(bp); const TYPE = typeMap(bp);
  const [kind, setKind] = useState('notes'); const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [saving, setSaving] = useState(false); const [dueIn, setDueIn] = useState(null); const [dueOn, setDueOn] = useState(null); const [pickingDue, setPickingDue] = useState(false);
  const save = async () => {
    if (!title.trim() && !body.trim()) return;
    setSaving(true); const base = { user_id: userId, project_id: projectId };
    // offlineWrite queues rather than erroring when there's no connection —
    // previously this Alert'd "Could not save" and left the modal open
    // with whatever was typed, offline or on any transient failure.
    try {
      if (kind === 'tasks') await offlineWrite(supabase, 'project_tasks', { ...base, title: title.trim() || body.trim(), notes: title.trim() && body.trim() ? body.trim() : null, due_date: dueOn || (dueIn == null ? null : addDays(todayStr(), dueIn)), priority: 3, sort_order: 0 });
      else if (kind === 'research') await offlineWrite(supabase, 'project_research', { ...base, title: title.trim() || body.trim(), notes: body.trim() || null, type: 'note' });
      else await offlineWrite(supabase, 'project_journal', { ...base, title: title.trim() || null, body: body.trim() || title.trim(), type: kind === 'ideas' ? 'idea' : kind === 'questions' ? 'question' : 'note' });
    } catch (e) {
      setSaving(false);
      return Alert.alert('Could not save', e.message || 'Try again.');
    }
    setSaving(false); setTitle(''); setBody(''); setDueIn(null); setDueOn(null); setPickingDue(false); refresh(); onClose();
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><KeyboardAvoidingView style={s.shade} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={s.modal}><View style={s.modalTop}><Text style={s.modalTitle}>🧰 Add to the project</Text><TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose}><Ionicons name="close" size={22} color={bp.ink3} /></TouchableOpacity></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.choices}>{Object.entries(TYPE).map(([key, [label, icon, color]]) => <TouchableOpacity key={key} onPress={() => setKind(key)} style={[s.choice, kind === key && { borderColor: color, backgroundColor: color + '18' }]}><Ionicons name={icon} size={15} color={color} /><Text style={s.choiceText}>{label}</Text></TouchableOpacity>)}</ScrollView><TextInput value={title} onChangeText={setTitle} placeholder={`${TYPE[kind][0]} title`} placeholderTextColor={bp.ink3} style={s.input} /><TextInput value={body} onChangeText={setBody} placeholder="Write freely — organize later." placeholderTextColor={bp.ink3} style={[s.input, s.textarea]} multiline textAlignVertical="top" />{kind === 'tasks' ? <><Text style={s.fieldLabel}>DUE</Text><View style={[s.choices, { flexDirection: 'row', flexWrap: 'wrap' }]}>{TASK_DUE_CHOICES.map(o => { const on = !dueOn && dueIn === o.days; return <TouchableOpacity key={o.label} onPress={() => { setDueIn(o.days); setDueOn(null); setPickingDue(false); }} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.choice, on && { borderColor: bp.accent, backgroundColor: bp.accent + '18' }]}><Text style={s.choiceText}>{o.label}</Text></TouchableOpacity>; })}<TouchableOpacity onPress={() => setPickingDue(v => !v)} accessibilityRole="button" accessibilityState={{ selected: !!dueOn, expanded: pickingDue }} style={[s.choice, (dueOn || pickingDue) && { borderColor: bp.accent, backgroundColor: bp.accent + '18' }]}><Ionicons name="calendar-outline" size={14} color={bp.accent} /><Text style={s.choiceText}>{dueOn ? shortDay(dueOn) : 'Pick a day'}</Text></TouchableOpacity></View>{pickingDue ? <View style={{ marginBottom: 12 }}><MiniCalendar value={dueOn ? isoToDate(dueOn) : new Date()} onChange={d => { setDueOn(dateToIso(d)); setPickingDue(false); }} color={bp.accent} colors={calColors(bp)} minIso={todayStr()} /></View> : null}</> : null}<TouchableOpacity onPress={save} disabled={saving} style={s.save}>{saving ? <ActivityIndicator color={bp.onAccent} /> : <Text style={s.saveText}>ADD TO THE BENCH</Text>}</TouchableOpacity></View></KeyboardAvoidingView></Modal>;
}

function Section({ title, bp, children, empty }) { const s = makeStyles(bp); return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{React.Children.count(children) ? children : <Text style={s.empty}>{empty}</Text>}</View>; }

export default function ProjectDetailScreen() {
  const navigation = useNavigation(); const route = useRoute(); const [project, setProject] = useState(route.params?.project); const [userId, setUserId] = useState(null); const [tab, setTab] = useState('workspace'); const [filter, setFilter] = useState('all'); const [objects, setObjects] = useState([]); const [activity, setActivity] = useState([]); const [rawData, setRawData] = useState({ tasks: [], journal: [], research: [], milestones: [] }); const [loading, setLoading] = useState(true); const [adding, setAdding] = useState(false); const [gardenCore, setGardenCore] = useState(null); const [planting, setPlanting] = useState(false); const [editingTitle, setEditingTitle] = useState(false); const [titleDraft, setTitleDraft] = useState(route.params?.project?.title || ''); const [savingTitle, setSavingTitle] = useState(false); const [editingNext, setEditingNext] = useState(false); const [nextDraft, setNextDraft] = useState(route.params?.project?.next_action || ''); const [savingNext, setSavingNext] = useState(false); const [remindOpen, setRemindOpen] = useState(false); const [savingStage, setSavingStage] = useState(false); const [openTask, setOpenTask] = useState(null); const { signalAction } = useAccess();
  // Work time on the calendar (planner rows linked here), and the sheets
  // that set it and the finish date.
  const [sessions, setSessions] = useState([]); const [workOpen, setWorkOpen] = useState(false); const [dueOpen, setDueOpen] = useState(false);
  const bp = useBlueprint();
  const s = makeStyles(bp);
  const TYPE = typeMap(bp);
  // Applies a raw {tasks, journal, research, milestones} bundle (fresh or
  // cached — same shape either way) to state.
  const applyRaw = (raw) => {
    const journals = (raw.journal || []).map(x => ({ ...x, kind: x.type === 'idea' ? 'ideas' : x.type === 'question' ? 'questions' : 'notes' }));
    const all = [...(raw.tasks || []).map(x => ({ ...x, kind: 'tasks' })), ...journals, ...(raw.research || []).map(x => ({ ...x, kind: 'research', body: x.notes }))].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setObjects(all);
    setActivity([...(raw.milestones || []), ...journals.filter(x => x.kind === 'notes')].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setRawData({ tasks: raw.tasks || [], journal: raw.journal || [], research: raw.research || [], milestones: raw.milestones || [] });
  };

  const load = useCallback(async () => {
    if (!project?.id) return; setLoading(true);
    const cacheKey = `project_detail_${project.id}`;

    const cached = await cacheRead(cacheKey);
    if (cached) applyRaw(cached);

    if (!(await isOnline())) { setLoading(false); return; }

    // The row itself too: callers pass whatever they had (Home's desk sends
    // id, title and next action only), which left the finish date and the
    // description blank when a project was opened from Home.
    const [auth, tasks, journal, research, milestones, fresh] = await Promise.all([supabase.auth.getUser(), supabase.from('project_tasks').select('*').eq('project_id', project.id).order('created_at', { ascending: false }), supabase.from('project_journal').select('*').eq('project_id', project.id).order('created_at', { ascending: false }), supabase.from('project_research').select('*').eq('project_id', project.id).order('created_at', { ascending: false }), supabase.from('project_milestones').select('*').eq('project_id', project.id).order('created_at', { ascending: false }), supabase.from('projects').select('*').eq('id', project.id).maybeSingle()]);
    if (fresh?.data) setProject(p => ({ ...p, ...fresh.data }));
    const uid = auth.data?.user?.id || null; setUserId(uid);
    const raw = { tasks: tasks.data || [], journal: journal.data || [], research: research.data || [], milestones: milestones.data || [] };
    applyRaw(raw);
    await cacheWrite(cacheKey, raw);
    setLoading(false);
    listProjectSessions(project.id).then(setSessions).catch(e => console.warn('work sessions load error', e));
    if (uid) { try { setGardenCore(await getCoreForProject(uid, project.id)); } catch (e) { console.warn('garden link lookup error', e); } }
  }, [project?.id]);
  useEffect(() => { load(); }, [load]); useFocusEffect(useCallback(() => { load(); }, [load]));
  if (!project) return null; const color = project.color || bp.accent; const filtered = filter === 'all' ? objects : objects.filter(x => x.kind === filter); const openTasks = rawData.tasks.filter(x => !x.completed).sort(planOrder).map(x => ({ ...x, kind: 'tasks' })); const next = openTasks.slice(0, 3); const nextIds = new Set(next.map(x => x.id)); /* tasks already under Next on the bench show their due date there; Deadlines lists the rest, not the same ones again */ const deadlines = openTasks.filter(x => x.due_date && !nextIds.has(x.id)).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 4); const upcoming = sessions.filter(x => !x.completed).slice(0, 4); const dueLate = !!project.due_date && project.status !== 'completed' && project.due_date < todayStr(); const questions = objects.filter(x => x.kind === 'questions').slice(0, 3); const recent = objects.filter(x => x.kind !== 'tasks').slice(0, 4); const toggle = async x => { await supabase.from('project_tasks').update({ completed: !x.completed, completed_at: !x.completed ? new Date().toISOString() : null }).eq('id', x.id); if (!x.completed) recordAction('project_step', x.id); load(); };
  const totalTasks = rawData.tasks.length; const doneTasks = rawData.tasks.filter(t => t.completed).length; const { pct, allTasksDone } = projectProgress({ total: totalTasks, done: doneTasks, status: project.status, nextAction: project.next_action });
  // Share sends readable text through the phone's share sheet; a long press
  // still copies the full Markdown export.
  const shareProject = async () => { const res = await shareText({ title: project.title, message: projectText(project, rawData.tasks) }); if (res === 'copied') Alert.alert('Copied', 'Project summary copied to your clipboard.'); };
  const exportProject = async () => { const md = projectToMarkdown(project, rawData); await Clipboard.setStringAsync(md); Alert.alert('Copied', `"${project.title}" copied as Markdown.`); };
  const gardenAction = async () => {
    if (gardenCore) { navigation.navigate('IdeaGardenScreen', { focusCoreId: gardenCore.id }); return; }
    if (!userId || planting) return;
    setPlanting(true);
    try {
      const core = await plantProjectAsIdea(userId, project);
      setGardenCore(core);
      Alert.alert('🌱 Planted', `"${project.title}" now has an idea in the Garden — they stay in sync.`, [
        { text: 'Stay here', style: 'cancel' },
        { text: 'View in Garden', onPress: () => navigation.navigate('IdeaGardenScreen', { focusCoreId: core.id }) },
      ]);
    } catch (e) {
      console.warn('plant error', e);
      const missingColumn = /project_id/.test(e?.message || '');
      Alert.alert('Could not plant this idea', missingColumn
        ? 'Run the latest database migration first (supabase/migrations/20260826_link_garden_cores_to_projects.sql).'
        : 'Something went wrong — try again.');
    }
    setPlanting(false);
  };
  const saveTitle = async () => {
    const next = titleDraft.trim();
    if (!next || next === project.title) { setTitleDraft(project.title); setEditingTitle(false); return; }
    setSavingTitle(true);
    try {
      await supabase.from('projects').update({ title: next, updated_at: new Date().toISOString() }).eq('id', project.id);
      if (gardenCore) await supabase.from('garden_cores').update({ title: next, updated_at: new Date().toISOString() }).eq('id', gardenCore.id);
      setProject(p => ({ ...p, title: next }));
    } catch (e) {
      console.warn('rename error', e);
      Alert.alert('Could not rename', 'Something went wrong — try again.');
      setTitleDraft(project.title);
    }
    setSavingTitle(false);
    setEditingTitle(false);
  };
  const setStage = async (status) => {
    if (!project?.id || savingStage || status === (project.status || 'active')) return;
    setSavingStage(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from('projects').update({ status, updated_at: now }).eq('id', project.id);
    if (error) {
      console.warn('project stage error', error);
      Alert.alert('Could not move this project', 'Something went wrong — try again.');
    } else {
      setProject(p => ({ ...p, status }));
      if (status === 'completed') {
        signalAction('project-shipped');
        // A piece of a bigger build: tick its task there too. The "Part of"
        // line says so; no pop-up, since finishing also lands on the goal.
        await finishPartOf(userId, project);
      }
      // The build log is where "I finished this" gets remembered.
      await supabase.from('project_milestones').insert({ user_id: userId, project_id: project.id, title: STAGE_MILESTONE[status], type: status === 'completed' ? 'project_shipped' : 'stage_changed', date: todayStr() });
      load();
    }
    setSavingStage(false);
  };
  // Project to project is a push: navigate('ProjectDetail') from a project
  // page counts as "already open" under the Library router and stays put.
  const openParent = async () => {
    const link = partOf(project);
    if (!link) return;
    const { data } = await supabase.from('projects').select('*').eq('id', link.project_id).is('deleted_at', null).maybeSingle();
    if (data) navigation.push('ProjectDetail', { project: data });
    else Alert.alert('Not found', "That project isn't there anymore.");
  };
  const saveNext = async () => {
    const next = nextDraft.trim();
    if (next === (project.next_action || '')) { setEditingNext(false); return; }
    setSavingNext(true);
    try {
      const { error } = await supabase.from('projects').update({ next_action: next || null, updated_at: new Date().toISOString() }).eq('id', project.id);
      if (error) throw error;
      setProject(p => ({ ...p, next_action: next || null }));
      if (next) signalAction('project-next-set');
    } catch (e) {
      console.warn('save next_action error', e);
      Alert.alert('Could not save', 'Something went wrong — try again.');
      setNextDraft(project.next_action || '');
    }
    setSavingNext(false);
    setEditingNext(false);
  };
  // The ✓ on the next action: it's done. Logged to the project log and
  // counted (nextActionService), then the box opens for the step after it.
  const finishNext = async () => {
    if (!project.next_action || savingNext) return;
    setSavingNext(true);
    try {
      // With open tasks, the soonest one steps up; the box only opens when
      // the plan has nothing left.
      const upcoming = await advanceNextAction(userId, project, { done: true, next: null });
      setProject(p => ({ ...p, next_action: upcoming }));
      setNextDraft(upcoming || '');
      setEditingNext(!upcoming);
      load();
    } catch (e) {
      console.warn('finish next_action error', e);
      Alert.alert('Could not save', 'Something went wrong — try again.');
    }
    setSavingNext(false);
  };
  const setDue = async (due) => {
    setDueOpen(false);
    const { error } = await supabase.from('projects').update({ due_date: due, updated_at: new Date().toISOString() }).eq('id', project.id);
    if (error) { Alert.alert('Could not save', 'Something went wrong — try again.'); return; }
    setProject(p => ({ ...p, due_date: due }));
  };
  // Fill with AI on this build: its tasks, notes and links go in the prompt
  // with refs, so the reply adds to them instead of starting a new project.
  const planWithAI = () => navigation.navigate('AIBridgeScreen', {
    target: 'projects', at: Date.now(),
    idea: `Help me plan my project "${project.title}". Look at what it already has, then add what's missing: the remaining steps as tasks in order, deliverables with realistic due dates${project.due_date ? ` (I want it done by ${project.due_date})` : ''}, and notes on materials, tools and costs. Don't repeat tasks it already has.`,
  });
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><BlueprintGrid bp={bp} /><View style={{ flex: 1, zIndex: 1 }}><View style={s.top}><TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color={bp.ink} /></TouchableOpacity><Text style={s.back}>WORKSHOP</Text><TouchableOpacity onPress={gardenAction} disabled={planting} style={s.exportBtn}>{planting ? <ActivityIndicator size="small" color={GOLD} /> : <Ionicons name="leaf" size={17} color={gardenCore ? GOLD : bp.ink3} />}</TouchableOpacity><TouchableOpacity onPress={planWithAI} style={s.exportBtn} accessibilityRole="button" accessibilityLabel="Plan this project with AI"><Ionicons name="sparkles-outline" size={17} color={bp.ink3} /></TouchableOpacity><TouchableOpacity onPress={() => setRemindOpen(true)} style={s.exportBtn} accessibilityLabel="Remind me about this project"><Ionicons name="alarm-outline" size={17} color={bp.ink3} /></TouchableOpacity><TouchableOpacity onPress={shareProject} onLongPress={exportProject} style={s.exportBtn} accessibilityLabel="Share project"><Ionicons name="share-outline" size={17} color={bp.ink3} /></TouchableOpacity><TouchableOpacity onPress={() => navigation.navigate('WorkModeScreen', { project })} style={[s.add, { borderColor: color, marginRight: 6 }]}><Ionicons name="timer-outline" size={15} color={color} /><Text style={[s.addText, { color }]}>WORK</Text></TouchableOpacity><TouchableOpacity onPress={() => setAdding(true)} style={[s.add, { borderColor: color }]}><Ionicons name="add" size={17} color={color} /><Text style={[s.addText, { color }]}>ADD</Text></TouchableOpacity></View><ScrollView automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false} contentContainerStyle={s.content}><View style={[s.hero, { borderColor: bp.border }]}><CornerTicks color={color} /><View style={[s.heroTopRow, { gap: 6, flexWrap: 'wrap' }]}>{STAGE_ORDER.map(st => { const on = (project.status || 'active') === st; return <TouchableOpacity key={st} onPress={() => setStage(st)} disabled={on || savingStage} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`Move to ${STAGE[st]}`} style={{ borderWidth: 1, borderColor: on ? color : bp.border, backgroundColor: on ? color : 'transparent', borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4 }}><Text style={{ color: on ? bp.onAccent : bp.ink3, fontFamily: FONTS.mono, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>{STAGE[st]}</Text></TouchableOpacity>; })}{savingStage ? <ActivityIndicator size="small" color={color} /> : null}</View>{editingTitle ? <View style={s.titleEditRow}><TextInput style={s.titleInput} value={titleDraft} onChangeText={setTitleDraft} autoFocus selectTextOnFocus onSubmitEditing={saveTitle} onBlur={saveTitle} returnKeyType="done" />{savingTitle ? <ActivityIndicator size="small" color={color} /> : <TouchableOpacity accessibilityLabel="Done" accessibilityRole="button" onPress={saveTitle}><Ionicons name="checkmark-circle" size={22} color={color} /></TouchableOpacity>}</View> : <TouchableOpacity onPress={() => { setTitleDraft(project.title); setEditingTitle(true); }} style={s.titleRow}><View style={gardenCore ? s.nameGoldRing : null}><Text style={s.projectTitle}>{project.emoji || '🏗️'} {project.title}</Text></View><Ionicons name="pencil" size={14} color={bp.ink3} style={{ marginLeft: 8 }} /></TouchableOpacity>}{project.objective ? <Text style={s.objective}>{project.objective}</Text> : null}{partOf(project) ? <TouchableOpacity onPress={openParent} accessibilityRole="button" style={{ marginTop: 6 }}><Text style={[s.type, { marginTop: 0, color }]}>🧩 PART OF {String(partOf(project).title || 'A BIGGER BUILD').toUpperCase()}{project.status === 'completed' ? ' · TICKED THERE ✓' : ''} →</Text></TouchableOpacity> : null}<TouchableOpacity onPress={() => setDueOpen(true)} accessibilityRole="button" accessibilityLabel="Set a finish date" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}><Ionicons name="flag-outline" size={13} color={dueLate ? bp.stamp : bp.ink3} /><Text style={[s.type, { marginTop: 0, color: dueLate ? bp.stamp : bp.ink3 }]}>{project.due_date ? `FINISH BY ${shortDay(project.due_date).toUpperCase()}${project.status === 'completed' ? '' : ` · ${(daysBetween(todayStr(), project.due_date) > 1 ? `${daysBetween(todayStr(), project.due_date)} days left` : daysAway(project.due_date)).toUpperCase()}`}` : 'SET A FINISH DATE'}</Text></TouchableOpacity>{editingNext ? <View style={[s.nextRow, { borderColor: color }]}><Ionicons name="flag" size={13} color={color} /><TextInput style={s.nextInput} value={nextDraft} onChangeText={setNextDraft} placeholder="What's the next physical step?" placeholderTextColor={bp.ink3} autoFocus onSubmitEditing={saveNext} onBlur={saveNext} returnKeyType="done" />{savingNext ? <ActivityIndicator size="small" color={color} /> : <TouchableOpacity accessibilityLabel="Done" accessibilityRole="button" onPress={saveNext}><Ionicons name="checkmark-circle" size={20} color={color} /></TouchableOpacity>}</View> : <TouchableOpacity onPress={() => { setNextDraft(project.next_action || ''); setEditingNext(true); }} style={[s.nextRow, { borderColor: project.next_action ? color : bp.border, borderStyle: project.next_action ? 'solid' : 'dashed' }]}><Ionicons name="flag" size={13} color={project.next_action ? color : bp.ink3} /><Text style={[s.nextText, !project.next_action && s.nextTextEmpty]} numberOfLines={2}>{project.next_action || 'Set the next action for this project →'}</Text>{project.next_action ? <TouchableOpacity onPress={finishNext} disabled={savingNext} accessibilityRole="button" accessibilityLabel={`Done: ${project.next_action}. Set the next step`} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }} style={{ marginRight: 6 }}>{savingNext ? <ActivityIndicator size="small" color={color} /> : <Ionicons name="checkmark-circle-outline" size={20} color={color} />}</TouchableOpacity> : null}<Ionicons name="pencil" size={12} color={bp.ink3} /></TouchableOpacity>}{project.status === 'completed' ? <TouchableOpacity onPress={() => navigation.navigate('PortfolioScreen')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}><Ionicons name="ribbon-outline" size={13} color={color} /><Text style={{ color, fontSize: 12, fontWeight: '700' }}>Done. Add it to your Portfolio →</Text></TouchableOpacity> : null}{totalTasks > 0 && <View style={s.heroProgress}><RulerBar pct={pct} color={color} bp={bp} height={10} /><Text style={s.heroProgressText}>{doneTasks}/{totalTasks} TASKS DONE · {pct}%{project.next_action && project.status !== 'completed' ? ' · NEXT STEP OPEN' : ''}</Text>{allTasksDone && project.status !== 'completed' ? <TouchableOpacity onPress={() => setStage('completed')} disabled={savingStage} accessibilityRole="button" style={{ marginTop: 6 }}><Text style={{ color, fontSize: 12, fontWeight: '700' }}>All tasks done. Mark the project Done →</Text></TouchableOpacity> : null}</View>}</View><View style={s.tabs}>{NAV.map(x => <TouchableOpacity key={x.id} onPress={() => setTab(x.id)} style={[s.tab, tab === x.id && { borderColor: color, backgroundColor: color + '14' }]}><Ionicons name={x.icon} size={15} color={tab === x.id ? color : bp.ink3} /><Text style={[s.tabText, tab === x.id && { color, fontWeight: '800' }]}>{x.label.toUpperCase()}</Text></TouchableOpacity>)}</View>{loading ? <ActivityIndicator size="large" color={color} style={{ marginTop: 52 }} /> : tab === 'workspace' ? <><TouchableOpacity onPress={() => setAdding(true)} style={[s.capture, { borderColor: color }]}><Ionicons name="add-circle-outline" size={21} color={color} /><View><Text style={s.captureTitle}>What are you building?</Text><Text style={s.captureSub}>Capture a thought, question, task, or research note.</Text></View></TouchableOpacity><Section title="NEXT ON THE BENCH" bp={bp} empty="No tasks queued — add one when you're ready to start.">{next.map(x => <Item key={x.id} item={x} bp={bp} compact onToggle={toggle} onOpen={setOpenTask} />)}</Section>{deadlines.length ? <Section title="DEADLINES" bp={bp}>{deadlines.map(x => <Item key={x.id} item={x} bp={bp} compact onToggle={toggle} onOpen={setOpenTask} />)}</Section> : null}<View style={s.section}><View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 11 }}><Text style={[s.sectionTitle, { flex: 1, marginBottom: 0 }]}>WORK TIME</Text><TouchableOpacity onPress={() => setWorkOpen(true)} accessibilityRole="button" accessibilityLabel="Schedule work time" style={[s.add, { borderColor: color }]}><Ionicons name="calendar-outline" size={14} color={color} /><Text style={[s.addText, { color }]}>SCHEDULE</Text></TouchableOpacity></View>{upcoming.length ? upcoming.map(x => <View key={x.id} style={s.item}><View style={[s.icon, { borderColor: color }]}><Ionicons name="calendar-outline" size={16} color={color} /></View><View style={{ flex: 1 }}><Text style={s.itemTitle} numberOfLines={1}>{dayLabel(x.date)}{x.start_time ? ` · ${formatTime12(x.start_time.slice(0, 5))}` : ''}</Text><Text style={s.type}>{x.duration_minutes ? `${x.duration_minutes} MIN` : 'ANY LENGTH'}{x.date === todayStr() ? ' · TODAY' : ''}</Text></View></View>) : <Text style={s.empty}>No time set aside yet. Time on the calendar is what gets a build finished.</Text>}{sessions.length > upcoming.length ? <TouchableOpacity onPress={() => navigation.navigate('PlannerScreen')}><Text style={[s.type, { color }]}>+{sessions.length - upcoming.length} MORE IN YOUR PLANNER →</Text></TouchableOpacity> : null}</View><Section title="OPEN QUESTIONS" bp={bp} empty="Questions keep the project moving.">{questions.map(x => <Item key={x.id} item={x} bp={bp} compact />)}</Section><Section title="FROM THE WORKSHOP" bp={bp} empty="Your recent notes, ideas, and research will appear here.">{recent.map(x => <Item key={`${x.kind}-${x.id}`} item={x} bp={bp} />)}</Section></> : tab === 'library' ? <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{FILTERS.map(x => <TouchableOpacity key={x} onPress={() => setFilter(x)} style={[s.filter, filter === x && { backgroundColor: color, borderColor: color }]}><Text style={[s.filterText, filter === x && { color: bp.onAccent }]}>{x === 'all' ? 'Everything' : `${TYPE[x][0]}s`}</Text></TouchableOpacity>)}</ScrollView><Section title={filter === 'all' ? 'EVERYTHING IN THIS PROJECT' : `${TYPE[filter][0].toUpperCase()}S`} bp={bp} empty="Nothing here yet. Add the first item.">{filtered.map(x => <Item key={`${x.kind}-${x.id}`} item={x} bp={bp} onToggle={toggle} onOpen={setOpenTask} />)}</Section></> : <Section title="PROJECT LOG" bp={bp} empty="Meaningful work will become your project history.">{activity.map(x => <View key={x.id} style={s.activity}><View style={[s.dot, { backgroundColor: color }]} /><View style={{ flex: 1 }}><Text style={s.itemTitle}>{titleFor(x)}</Text><LinkifiedText numberOfLines={2} style={s.body} linkColor={bp.accent} text={x.body || humanizeType(x.type) || 'Milestone'} /><Text style={s.type}>{dateFor(x)}</Text></View></View>)}</Section>}</ScrollView><WorkTimeModal visible={workOpen} onClose={() => setWorkOpen(false)} project={project} userId={userId} bp={bp} onSaved={() => { signalAction('planner-item-added', { area: 'professional' }); load(); }} /><TaskSheet task={openTask} project={project} userId={userId} bp={bp} onClose={() => setOpenTask(null)} onToggle={toggle} onOpenProject={(p, created) => { setOpenTask(null); if (created) { signalAction('project-started'); load(); } navigation.push('ProjectDetail', { project: p }); }} /><DueModal visible={dueOpen} onClose={() => setDueOpen(false)} current={project.due_date} bp={bp} onPick={setDue} /><AddModal visible={adding} onClose={() => setAdding(false)} projectId={project.id} userId={userId} bp={bp} refresh={load} /></View><ReminderComposer visible={remindOpen} userId={userId} onClose={() => setRemindOpen(false)} initial={{ title: project.next_action || `Work on ${project.title}`, target: { kind: 'project', id: project.id }, targetLabel: project.title, area: 'professional' }} /></KeyboardAvoidingView>;
}

const makeStyles = bp => StyleSheet.create({ screen:{flex:1,backgroundColor:bp.paper},top:{height:56,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:10},back:{color:bp.ink3,fontSize:11,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:1.2,flex:1},exportBtn:{padding:6},add:{flexDirection:'row',alignItems:'center',gap:4,borderWidth:1,borderRadius:4,paddingHorizontal:10,paddingVertical:6},addText:{fontSize:11,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:0.4},content:{padding:18,paddingBottom:48},hero:{borderWidth:1,borderRadius:4,padding:16,marginBottom:22,backgroundColor:bp.panel},heroTopRow:{flexDirection:'row',marginBottom:9},nameGoldRing:{alignSelf:'flex-start',borderWidth:1.5,borderColor:GOLD,borderRadius:10,paddingHorizontal:8},titleRow:{flexDirection:'row',alignItems:'center'},titleEditRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:7},titleInput:{flex:1,color:bp.ink,fontSize:20,fontFamily:FONTS.display,fontWeight:'800',borderBottomWidth:1.5,borderBottomColor:bp.accent,paddingVertical:2},projectTitle:{color:bp.ink,fontSize:22,fontFamily:FONTS.display,fontWeight:'800',marginBottom:7},objective:{color:bp.ink2,fontSize:14,lineHeight:20},nextRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:11,borderWidth:1,borderRadius:4,paddingHorizontal:10,paddingVertical:9,backgroundColor:bp.paper},nextText:{flex:1,color:bp.ink,fontSize:12.5,fontWeight:'700',lineHeight:17},nextTextEmpty:{color:bp.ink3,fontWeight:'600',fontStyle:'italic'},nextInput:{flex:1,color:bp.ink,fontSize:12.5,fontWeight:'700',paddingVertical:0},heroProgress:{marginTop:14},heroProgressText:{fontSize:11,fontFamily:FONTS.mono,color:bp.ink3,marginTop:6,letterSpacing:0.4},tabs:{flexDirection:'row',gap:8,marginBottom:20},tab:{flex:1,paddingVertical:9,flexDirection:'row',gap:5,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:bp.border,borderRadius:4,backgroundColor:bp.panel},tabText:{fontSize:11.5,fontFamily:FONTS.mono,fontWeight:'700',color:bp.ink3,letterSpacing:0.3},capture:{padding:15,borderWidth:1,borderRadius:4,backgroundColor:bp.panel,flexDirection:'row',gap:11,alignItems:'center'},captureTitle:{color:bp.ink,fontSize:15,fontWeight:'700'},captureSub:{color:bp.ink3,fontSize:12,marginTop:3},section:{marginTop:26},sectionTitle:{color:bp.ink,fontSize:13,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:1,marginBottom:11},empty:{color:bp.ink3,fontSize:13,lineHeight:19,paddingVertical:9},item:{flexDirection:'row',gap:11,backgroundColor:bp.panel,borderRadius:4,borderWidth:1,borderColor:bp.border,padding:12,marginBottom:8},icon:{width:34,height:34,borderRadius:4,borderWidth:1.5,alignItems:'center',justifyContent:'center',backgroundColor:bp.paper},itemTitle:{color:bp.ink,fontSize:14,fontWeight:'700',lineHeight:19},complete:{color:bp.ink3,textDecorationLine:'line-through'},body:{color:bp.ink2,fontSize:12,lineHeight:18,marginTop:2},type:{fontSize:11,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:.5,marginTop:5,color:bp.ink3},filters:{gap:7,paddingBottom:2},filter:{paddingHorizontal:12,paddingVertical:8,borderRadius:4,backgroundColor:bp.panel,borderWidth:1,borderColor:bp.border},filterText:{color:bp.ink2,fontSize:11.5,fontFamily:FONTS.mono,fontWeight:'700'},activity:{flexDirection:'row',gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:bp.border},dot:{width:8,height:8,borderRadius:4,marginTop:5},fieldLabel:{color:bp.ink3,fontSize:11,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:0.8,marginBottom:6},shade:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(4,16,28,0.68)'},modal:{backgroundColor:bp.panel,padding:20,borderTopLeftRadius:14,borderTopRightRadius:14,borderTopWidth:1,borderColor:bp.border},modalTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},modalTitle:{color:bp.ink,fontSize:17,fontFamily:FONTS.displaySemibold,fontWeight:'800'},choices:{gap:8,paddingBottom:14},choice:{flexDirection:'row',alignItems:'center',gap:5,padding:9,borderWidth:1,borderColor:bp.border,borderRadius:4,backgroundColor:bp.paper},choiceText:{color:bp.ink2,fontSize:12,fontWeight:'700'},input:{borderWidth:1,borderColor:bp.border,borderRadius:4,color:bp.ink,padding:12,fontSize:14,marginBottom:10,backgroundColor:bp.paper},textarea:{height:110},save:{backgroundColor:bp.accent,alignItems:'center',padding:14,borderRadius:4},saveText:{color:bp.onAccent,fontSize:12.5,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:0.5} });
