// The Workshop — a single build's page in the drafting notebook: bench,
// materials, and log, sketched on the same blueprint paper as projects.js.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../../api/offlineCache';
import { FONTS } from '../../theme';
import { projectToMarkdown } from '../../logic/exportUtils';
import LinkifiedText from '../../components/LinkifiedText';
import { useBlueprint, BlueprintGrid, CornerTicks, Stamp, RulerBar } from './blueprint';
import { getCoreForProject, plantProjectAsIdea } from '../../api/gardenService';

const GOLD = '#e8b34a'; // matches the gold trim used in the Idea Garden for linked builds

const NAV = [
  { id: 'workspace', label: 'Workbench', icon: 'hammer-outline' },
  { id: 'library',   label: 'Materials', icon: 'cube-outline' },
  { id: 'activity',  label: 'Build Log', icon: 'time-outline' },
];
const FILTERS = ['all', 'notes', 'ideas', 'questions', 'research', 'tasks'];
const typeMap = bp => ({
  notes:     ['Note',     'document-text-outline', bp.accent],
  ideas:     ['Idea',     'bulb-outline',           bp.stamp],
  questions: ['Question', 'help-circle-outline',    bp.draft],
  research:  ['Research', 'flask-outline',          bp.violet],
  tasks:     ['Task',     'checkbox-outline',        bp.approved],
});
const STAGE = { active: 'BUILDING', idea: 'BLUEPRINT', completed: 'SHIPPED' };
const titleFor = x => x.title || x.body?.slice(0, 90) || 'Untitled item';
const dateFor = x => x.created_at ? new Date(x.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
// Build-log entries with no body fall back to their raw `type` code
// (e.g. 'project_created') — humanize it instead of leaking the slug.
const humanizeType = t => t ? t.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) : '';

function Item({ item, bp, compact, onToggle }) {
  const s = makeStyles(bp); const TYPE = typeMap(bp);
  const [label, icon, color] = TYPE[item.kind];
  return <View style={s.item}><TouchableOpacity disabled={item.kind !== 'tasks'} onPress={() => onToggle?.(item)} style={[s.icon, { borderColor: color }]}><Ionicons name={item.kind === 'tasks' && item.completed ? 'checkmark-circle' : icon} size={17} color={color} /></TouchableOpacity><View style={{ flex: 1 }}><Text numberOfLines={compact ? 1 : 2} style={[s.itemTitle, item.completed && s.complete]}>{titleFor(item)}</Text>{!compact && <LinkifiedText numberOfLines={2} style={s.body} linkColor={bp.accent} text={item.body || item.notes || item.url || label} />}<Text style={[s.type, { color }]}>{label}{dateFor(item) ? ` · ${dateFor(item)}` : ''}</Text></View></View>;
}

function AddModal({ visible, onClose, projectId, userId, bp, refresh }) {
  const s = makeStyles(bp); const TYPE = typeMap(bp);
  const [kind, setKind] = useState('notes'); const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!title.trim() && !body.trim()) return;
    setSaving(true); const base = { user_id: userId, project_id: projectId };
    // offlineWrite queues rather than erroring when there's no connection —
    // previously this Alert'd "Could not save" and left the modal open
    // with whatever was typed, offline or on any transient failure.
    try {
      if (kind === 'tasks') await offlineWrite(supabase, 'project_tasks', { ...base, title: title.trim() || body.trim(), priority: 3, sort_order: 0 });
      else if (kind === 'research') await offlineWrite(supabase, 'project_research', { ...base, title: title.trim() || body.trim(), notes: body.trim() || null, type: 'note' });
      else await offlineWrite(supabase, 'project_journal', { ...base, title: title.trim() || null, body: body.trim() || title.trim(), type: kind === 'ideas' ? 'idea' : kind === 'questions' ? 'question' : 'note' });
    } catch (e) {
      setSaving(false);
      return Alert.alert('Could not save', e.message || 'Try again.');
    }
    setSaving(false); setTitle(''); setBody(''); refresh(); onClose();
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><KeyboardAvoidingView style={s.shade} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={s.modal}><View style={s.modalTop}><Text style={s.modalTitle}>🧰 Add to the build</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={bp.ink3} /></TouchableOpacity></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.choices}>{Object.entries(TYPE).map(([key, [label, icon, color]]) => <TouchableOpacity key={key} onPress={() => setKind(key)} style={[s.choice, kind === key && { borderColor: color, backgroundColor: color + '18' }]}><Ionicons name={icon} size={15} color={color} /><Text style={s.choiceText}>{label}</Text></TouchableOpacity>)}</ScrollView><TextInput value={title} onChangeText={setTitle} placeholder={`${TYPE[kind][0]} title`} placeholderTextColor={bp.ink3} style={s.input} /><TextInput value={body} onChangeText={setBody} placeholder="Write freely — organize later." placeholderTextColor={bp.ink3} style={[s.input, s.textarea]} multiline textAlignVertical="top" /><TouchableOpacity onPress={save} disabled={saving} style={s.save}>{saving ? <ActivityIndicator color={bp.onAccent} /> : <Text style={s.saveText}>ADD TO THE BENCH</Text>}</TouchableOpacity></View></KeyboardAvoidingView></Modal>;
}

function Section({ title, bp, children, empty }) { const s = makeStyles(bp); return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{React.Children.count(children) ? children : <Text style={s.empty}>{empty}</Text>}</View>; }

export default function ProjectDetailScreen() {
  const navigation = useNavigation(); const route = useRoute(); const [project, setProject] = useState(route.params?.project); const [userId, setUserId] = useState(null); const [tab, setTab] = useState('workspace'); const [filter, setFilter] = useState('all'); const [objects, setObjects] = useState([]); const [activity, setActivity] = useState([]); const [rawData, setRawData] = useState({ tasks: [], journal: [], research: [], milestones: [] }); const [loading, setLoading] = useState(true); const [adding, setAdding] = useState(false); const [gardenCore, setGardenCore] = useState(null); const [planting, setPlanting] = useState(false); const [editingTitle, setEditingTitle] = useState(false); const [titleDraft, setTitleDraft] = useState(route.params?.project?.title || ''); const [savingTitle, setSavingTitle] = useState(false); const [editingNext, setEditingNext] = useState(false); const [nextDraft, setNextDraft] = useState(route.params?.project?.next_action || ''); const [savingNext, setSavingNext] = useState(false);
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

    const [auth, tasks, journal, research, milestones] = await Promise.all([supabase.auth.getUser(), supabase.from('project_tasks').select('*').eq('project_id', project.id).order('created_at', { ascending: false }), supabase.from('project_journal').select('*').eq('project_id', project.id).order('created_at', { ascending: false }), supabase.from('project_research').select('*').eq('project_id', project.id).order('created_at', { ascending: false }), supabase.from('project_milestones').select('*').eq('project_id', project.id).order('created_at', { ascending: false })]);
    const uid = auth.data?.user?.id || null; setUserId(uid);
    const raw = { tasks: tasks.data || [], journal: journal.data || [], research: research.data || [], milestones: milestones.data || [] };
    applyRaw(raw);
    await cacheWrite(cacheKey, raw);
    setLoading(false);
    if (uid) { try { setGardenCore(await getCoreForProject(uid, project.id)); } catch (e) { console.warn('garden link lookup error', e); } }
  }, [project?.id]);
  useEffect(() => { load(); }, [load]); useFocusEffect(useCallback(() => { load(); }, [load]));
  if (!project) return null; const color = project.color || bp.accent; const filtered = filter === 'all' ? objects : objects.filter(x => x.kind === filter); const next = objects.filter(x => x.kind === 'tasks' && !x.completed).slice(0, 3); const questions = objects.filter(x => x.kind === 'questions').slice(0, 3); const recent = objects.filter(x => x.kind !== 'tasks').slice(0, 4); const toggle = async x => { await supabase.from('project_tasks').update({ completed: !x.completed, completed_at: !x.completed ? new Date().toISOString() : null }).eq('id', x.id); load(); };
  const totalTasks = rawData.tasks.length; const doneTasks = rawData.tasks.filter(t => t.completed).length; const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : null;
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
  const saveNext = async () => {
    const next = nextDraft.trim();
    if (next === (project.next_action || '')) { setEditingNext(false); return; }
    setSavingNext(true);
    try {
      await supabase.from('projects').update({ next_action: next || null, updated_at: new Date().toISOString() }).eq('id', project.id);
      setProject(p => ({ ...p, next_action: next || null }));
    } catch (e) {
      console.warn('save next_action error', e);
      Alert.alert('Could not save', 'Something went wrong — try again.');
      setNextDraft(project.next_action || '');
    }
    setSavingNext(false);
    setEditingNext(false);
  };
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><BlueprintGrid bp={bp} /><View style={{ flex: 1, zIndex: 1 }}><View style={s.top}><TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color={bp.ink} /></TouchableOpacity><Text style={s.back}>WORKSHOP</Text><TouchableOpacity onPress={gardenAction} disabled={planting} style={s.exportBtn}>{planting ? <ActivityIndicator size="small" color={GOLD} /> : <Ionicons name="leaf" size={17} color={gardenCore ? GOLD : bp.ink3} />}</TouchableOpacity><TouchableOpacity onPress={exportProject} style={s.exportBtn}><Ionicons name="share-outline" size={17} color={bp.ink3} /></TouchableOpacity><TouchableOpacity onPress={() => navigation.navigate('WorkModeScreen', { project })} style={[s.add, { borderColor: color, marginRight: 6 }]}><Ionicons name="timer-outline" size={15} color={color} /><Text style={[s.addText, { color }]}>WORK</Text></TouchableOpacity><TouchableOpacity onPress={() => setAdding(true)} style={[s.add, { borderColor: color }]}><Ionicons name="add" size={17} color={color} /><Text style={[s.addText, { color }]}>ADD</Text></TouchableOpacity></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}><View style={[s.hero, { borderColor: bp.border }]}><CornerTicks color={color} /><View style={s.heroTopRow}><Stamp label={STAGE[project.status] || (project.status || 'active').toUpperCase()} color={color} /></View>{editingTitle ? <View style={s.titleEditRow}><TextInput style={s.titleInput} value={titleDraft} onChangeText={setTitleDraft} autoFocus selectTextOnFocus onSubmitEditing={saveTitle} onBlur={saveTitle} returnKeyType="done" />{savingTitle ? <ActivityIndicator size="small" color={color} /> : <TouchableOpacity onPress={saveTitle}><Ionicons name="checkmark-circle" size={22} color={color} /></TouchableOpacity>}</View> : <TouchableOpacity onPress={() => { setTitleDraft(project.title); setEditingTitle(true); }} style={s.titleRow}><View style={gardenCore ? s.nameGoldRing : null}><Text style={s.projectTitle}>{project.emoji || '🏗️'} {project.title}</Text></View><Ionicons name="pencil" size={14} color={bp.ink3} style={{ marginLeft: 8 }} /></TouchableOpacity>}{project.objective ? <Text style={s.objective}>{project.objective}</Text> : null}{editingNext ? <View style={[s.nextRow, { borderColor: color }]}><Ionicons name="flag" size={13} color={color} /><TextInput style={s.nextInput} value={nextDraft} onChangeText={setNextDraft} placeholder="What's the next physical step?" placeholderTextColor={bp.ink3} autoFocus onSubmitEditing={saveNext} onBlur={saveNext} returnKeyType="done" />{savingNext ? <ActivityIndicator size="small" color={color} /> : <TouchableOpacity onPress={saveNext}><Ionicons name="checkmark-circle" size={20} color={color} /></TouchableOpacity>}</View> : <TouchableOpacity onPress={() => { setNextDraft(project.next_action || ''); setEditingNext(true); }} style={[s.nextRow, { borderColor: project.next_action ? color : bp.border, borderStyle: project.next_action ? 'solid' : 'dashed' }]}><Ionicons name="flag" size={13} color={project.next_action ? color : bp.ink3} /><Text style={[s.nextText, !project.next_action && s.nextTextEmpty]} numberOfLines={2}>{project.next_action || 'Set the next action for this build →'}</Text><Ionicons name="pencil" size={12} color={bp.ink3} /></TouchableOpacity>}{totalTasks > 0 && <View style={s.heroProgress}><RulerBar pct={pct} color={color} bp={bp} height={10} /><Text style={s.heroProgressText}>{doneTasks}/{totalTasks} TASKS DONE · {pct}%</Text></View>}</View><View style={s.tabs}>{NAV.map(x => <TouchableOpacity key={x.id} onPress={() => setTab(x.id)} style={[s.tab, tab === x.id && { borderColor: color, backgroundColor: color + '14' }]}><Ionicons name={x.icon} size={15} color={tab === x.id ? color : bp.ink3} /><Text style={[s.tabText, tab === x.id && { color, fontWeight: '800' }]}>{x.label.toUpperCase()}</Text></TouchableOpacity>)}</View>{loading ? <ActivityIndicator size="large" color={color} style={{ marginTop: 52 }} /> : tab === 'workspace' ? <><TouchableOpacity onPress={() => setAdding(true)} style={[s.capture, { borderColor: color }]}><Ionicons name="add-circle-outline" size={21} color={color} /><View><Text style={s.captureTitle}>What are you building?</Text><Text style={s.captureSub}>Capture a thought, question, task, or research note.</Text></View></TouchableOpacity><Section title="NEXT ON THE BENCH" bp={bp} empty="No tasks queued — add one when you're ready to build.">{next.map(x => <Item key={x.id} item={x} bp={bp} compact onToggle={toggle} />)}</Section><Section title="OPEN QUESTIONS" bp={bp} empty="Questions keep the build moving.">{questions.map(x => <Item key={x.id} item={x} bp={bp} compact />)}</Section><Section title="FROM THE WORKSHOP" bp={bp} empty="Your recent notes, ideas, and research will appear here.">{recent.map(x => <Item key={`${x.kind}-${x.id}`} item={x} bp={bp} />)}</Section></> : tab === 'library' ? <><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{FILTERS.map(x => <TouchableOpacity key={x} onPress={() => setFilter(x)} style={[s.filter, filter === x && { backgroundColor: color, borderColor: color }]}><Text style={[s.filterText, filter === x && { color: bp.onAccent }]}>{x === 'all' ? 'Everything' : `${TYPE[x][0]}s`}</Text></TouchableOpacity>)}</ScrollView><Section title={filter === 'all' ? 'EVERYTHING IN THIS BUILD' : `${TYPE[filter][0].toUpperCase()}S`} bp={bp} empty="Nothing here yet. Add the first item.">{filtered.map(x => <Item key={`${x.kind}-${x.id}`} item={x} bp={bp} onToggle={toggle} />)}</Section></> : <Section title="BUILD LOG" bp={bp} empty="Meaningful work will become your build history.">{activity.map(x => <View key={x.id} style={s.activity}><View style={[s.dot, { backgroundColor: color }]} /><View style={{ flex: 1 }}><Text style={s.itemTitle}>{titleFor(x)}</Text><LinkifiedText numberOfLines={2} style={s.body} linkColor={bp.accent} text={x.body || humanizeType(x.type) || 'Milestone'} /><Text style={s.type}>{dateFor(x)}</Text></View></View>)}</Section>}</ScrollView><AddModal visible={adding} onClose={() => setAdding(false)} projectId={project.id} userId={userId} bp={bp} refresh={load} /></View></KeyboardAvoidingView>;
}

const makeStyles = bp => StyleSheet.create({ screen:{flex:1,backgroundColor:bp.paper},top:{height:56,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:10},back:{color:bp.ink3,fontSize:11,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:1.2,flex:1},exportBtn:{padding:6},add:{flexDirection:'row',alignItems:'center',gap:4,borderWidth:1,borderRadius:4,paddingHorizontal:10,paddingVertical:6},addText:{fontSize:11,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:0.4},content:{padding:18,paddingBottom:48},hero:{borderWidth:1,borderRadius:4,padding:16,marginBottom:22,backgroundColor:bp.panel},heroTopRow:{flexDirection:'row',marginBottom:9},nameGoldRing:{alignSelf:'flex-start',borderWidth:1.5,borderColor:GOLD,borderRadius:10,paddingHorizontal:8},titleRow:{flexDirection:'row',alignItems:'center'},titleEditRow:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:7},titleInput:{flex:1,color:bp.ink,fontSize:20,fontFamily:FONTS.display,fontWeight:'800',borderBottomWidth:1.5,borderBottomColor:bp.accent,paddingVertical:2},projectTitle:{color:bp.ink,fontSize:22,fontFamily:FONTS.display,fontWeight:'800',marginBottom:7},objective:{color:bp.ink2,fontSize:14,lineHeight:20},nextRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:11,borderWidth:1,borderRadius:4,paddingHorizontal:10,paddingVertical:9,backgroundColor:bp.paper},nextText:{flex:1,color:bp.ink,fontSize:12.5,fontWeight:'700',lineHeight:17},nextTextEmpty:{color:bp.ink3,fontWeight:'600',fontStyle:'italic'},nextInput:{flex:1,color:bp.ink,fontSize:12.5,fontWeight:'700',paddingVertical:0},heroProgress:{marginTop:14},heroProgressText:{fontSize:10,fontFamily:FONTS.mono,color:bp.ink3,marginTop:6,letterSpacing:0.4},tabs:{flexDirection:'row',gap:8,marginBottom:20},tab:{flex:1,paddingVertical:9,flexDirection:'row',gap:5,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:bp.border,borderRadius:4,backgroundColor:bp.panel},tabText:{fontSize:10.5,fontFamily:FONTS.mono,fontWeight:'700',color:bp.ink3,letterSpacing:0.3},capture:{padding:15,borderWidth:1,borderRadius:4,backgroundColor:bp.panel,flexDirection:'row',gap:11,alignItems:'center'},captureTitle:{color:bp.ink,fontSize:15,fontWeight:'700'},captureSub:{color:bp.ink3,fontSize:12,marginTop:3},section:{marginTop:26},sectionTitle:{color:bp.ink,fontSize:13,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:1,marginBottom:11},empty:{color:bp.ink3,fontSize:13,lineHeight:19,paddingVertical:9},item:{flexDirection:'row',gap:11,backgroundColor:bp.panel,borderRadius:4,borderWidth:1,borderColor:bp.border,padding:12,marginBottom:8},icon:{width:34,height:34,borderRadius:4,borderWidth:1.5,alignItems:'center',justifyContent:'center',backgroundColor:bp.paper},itemTitle:{color:bp.ink,fontSize:14,fontWeight:'700',lineHeight:19},complete:{color:bp.ink3,textDecorationLine:'line-through'},body:{color:bp.ink2,fontSize:12,lineHeight:18,marginTop:2},type:{fontSize:10,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:.5,marginTop:5,color:bp.ink3},filters:{gap:7,paddingBottom:2},filter:{paddingHorizontal:12,paddingVertical:8,borderRadius:4,backgroundColor:bp.panel,borderWidth:1,borderColor:bp.border},filterText:{color:bp.ink2,fontSize:11.5,fontFamily:FONTS.mono,fontWeight:'700'},activity:{flexDirection:'row',gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:bp.border},dot:{width:8,height:8,borderRadius:4,marginTop:5},shade:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(4,16,28,0.68)'},modal:{backgroundColor:bp.panel,padding:20,borderTopLeftRadius:14,borderTopRightRadius:14,borderTopWidth:1,borderColor:bp.border},modalTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},modalTitle:{color:bp.ink,fontSize:17,fontFamily:FONTS.displaySemibold,fontWeight:'800'},choices:{gap:8,paddingBottom:14},choice:{flexDirection:'row',alignItems:'center',gap:5,padding:9,borderWidth:1,borderColor:bp.border,borderRadius:4,backgroundColor:bp.paper},choiceText:{color:bp.ink2,fontSize:12,fontWeight:'700'},input:{borderWidth:1,borderColor:bp.border,borderRadius:4,color:bp.ink,padding:12,fontSize:14,marginBottom:10,backgroundColor:bp.paper},textarea:{height:110},save:{backgroundColor:bp.accent,alignItems:'center',padding:14,borderRadius:4},saveText:{color:bp.onAccent,fontSize:12.5,fontFamily:FONTS.mono,fontWeight:'800',letterSpacing:0.5} });
