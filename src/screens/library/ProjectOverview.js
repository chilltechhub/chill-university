// The Project Overview — one project, explained. The project page
// (ProjectDetail) is the working view: next step, tasks, deadlines. This is
// the page behind its "About this project" row: what the project is, why it
// matters to the person (in their own words), where it fits in their life,
// how far along it is, its pieces, and what they've learned doing it.
// Same blueprint paper as the project page.
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../api/profileScopedClient';
import { FONTS } from '../../theme';
import { useBlueprint, BlueprintGrid, RulerBar } from './blueprint';
import { useAccess } from '../../../context/AccessContext';
import { AREAS } from '../../api/plannerService';
import { areasForProject, linkProjectToArea, unlinkAreaRow } from '../../api/areaLinks';
import { notesLinkedTo, noteLine } from '../../api/vaultLinks';
import { listProjectSessions } from '../../api/workSessions';
import { getCoreForProject } from '../../api/gardenService';
import { partOf } from '../../api/splitTaskService';
import { openTarget } from '../../logic/openTarget';
import { todayStr, daysBetween } from '../../logic/dateUtils';
import { formatTime12 } from '../../components/TimePickerField';

const STAGE = { idea: 'IDEA', active: 'IN PROGRESS', completed: 'DONE' };
const TYPE_LABEL = c => String(c || '').replace(/^\S+\s+/, '') || 'General';
// 'YYYY-MM-DD' → "Oct 12" read as a local day; a timestamp (created_at) is
// UTC, so it goes through Date to land on the local day it happened.
const day = v => {
  if (!v) return '';
  const str = String(v);
  if (str.length > 10) return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const weekday = iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); };

export default function ProjectOverview() {
  const bp = useBlueprint(); const s = makeStyles(bp);
  const navigation = useNavigation(); const route = useRoute();
  const { purpose } = useAccess();
  const [project, setProject] = useState(route.params?.project || null);
  const [info, setInfo] = useState(null); // everything else, loaded together
  const [userId, setUserId] = useState(null);
  const [why, setWhy] = useState(route.params?.project?.description || '');
  const [savingWhy, setSavingWhy] = useState(false);
  const [busyArea, setBusyArea] = useState(null);

  const load = useCallback(async () => {
    const id = route.params?.project?.id;
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    const [fresh, tasks, log, sessions, areas, core, notes, pieces] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).maybeSingle().then(r => r.data),
      supabase.from('project_tasks').select('id,title,due_date,completed').eq('project_id', id).then(r => r.data || []),
      supabase.from('project_milestones').select('type,date,created_at').eq('project_id', id).order('created_at', { ascending: false }).then(r => r.data || []),
      listProjectSessions(id).catch(() => []),
      areasForProject(id),
      user ? getCoreForProject(user.id, id).catch(() => null) : null,
      notesLinkedTo('project', id),
      // Pieces split off this project (splitTaskService): their links say so.
      supabase.from('projects').select('id,title,status,emoji').is('deleted_at', null)
        .filter('links', 'cs', JSON.stringify([{ kind: 'part-of', project_id: id }])).then(r => r.data || []),
    ]);
    if (fresh) { setProject(fresh); setWhy(fresh.description || ''); }
    setInfo({ tasks, log, sessions, areas, core, notes, pieces });
  }, [route.params?.project?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const saveWhy = async () => {
    const text = why.trim();
    if (text === (project?.description || '')) return;
    setSavingWhy(true);
    const { error } = await supabase.from('projects').update({ description: text || null, updated_at: new Date().toISOString() }).eq('id', project.id);
    if (error) Alert.alert('Could not save', 'Something went wrong — try again.');
    else setProject(p => ({ ...p, description: text || null }));
    setSavingWhy(false);
  };

  // One tap adds or removes the project from a part of life (the same link
  // the Life Area page's "Related → Projects" makes).
  const toggleArea = async (areaId) => {
    if (!userId || busyArea) return;
    setBusyArea(areaId);
    try {
      const row = info.areas.find(a => a.areaId === areaId);
      if (row) {
        await unlinkAreaRow(row.id);
        setInfo(i => ({ ...i, areas: i.areas.filter(a => a.id !== row.id) }));
      } else {
        const id = await linkProjectToArea(userId, areaId, project);
        setInfo(i => ({ ...i, areas: [...i.areas, { id, areaId }] }));
      }
    } catch (e) { Alert.alert('Could not change that', 'Something went wrong — try again.'); }
    setBusyArea(null);
  };

  const openProject = async (id) => {
    const { data } = await supabase.from('projects').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
    if (data) navigation.push('ProjectDetail', { project: data });
  };

  if (!project) return null;
  const color = project.color || bp.accent;
  const loading = !info;
  const tasks = info?.tasks || [];
  const done = tasks.filter(t => t.completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : null;
  const nextDue = tasks.filter(t => !t.completed && t.due_date).sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  const stepsDone = (info?.log || []).filter(m => m.type === 'step_done').length;
  const lastWorked = (info?.log || [])[0]?.date || (info?.log || [])[0]?.created_at;
  const daysLeft = project.due_date ? daysBetween(todayStr(), project.due_date) : null;
  const linkedAreas = new Set((info?.areas || []).map(a => a.areaId));
  const parent = partOf(project);
  const nextSession = (info?.sessions || [])[0];

  const section = (title, icon, children) => (
    <View style={s.section}>
      <View style={s.sectionHead}><Ionicons name={icon} size={14} color={color} /><Text style={s.sectionTitle}>{title}</Text></View>
      {children}
    </View>
  );
  const fact = (label, value) => value ? <View style={s.fact} key={label}><Text style={s.factLabel}>{label}</Text><Text style={s.factValue}>{value}</Text></View> : null;

  return (
    <View style={s.screen}>
      <BlueprintGrid bp={bp} />
      <View style={{ flex: 1, zIndex: 1 }}>
        <View style={s.top}>
          <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={bp.ink} />
          </TouchableOpacity>
          <Text style={s.back}>ABOUT THIS PROJECT</Text>
        </View>
        {/* "handled": a tap on an area chip while the why box is focused
            links the area, instead of only closing the keyboard. */}
        <ScrollView contentContainerStyle={s.content} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled">
          <Text style={s.stage}>{STAGE[project.status || 'active']} · {TYPE_LABEL(project.category).toUpperCase()}</Text>
          <Text style={s.title}>{project.emoji || '🏗️'} {project.title}</Text>
          {parent ? (
            <TouchableOpacity onPress={() => openProject(parent.project_id)} accessibilityRole="button">
              <Text style={[s.small, { color }]}>🧩 Part of {parent.title} →</Text>
            </TouchableOpacity>
          ) : null}

          {section('WHAT IT IS', 'document-text-outline', <>
            <Text style={s.body}>{project.objective || 'No goal written yet. Open the project and tap its title or goal to add one.'}</Text>
            <View style={s.facts}>
              {fact('Started', day(project.created_at))}
              {fact('Finish by', project.due_date ? `${day(project.due_date)}${project.status === 'completed' ? '' : daysLeft > 1 ? ` · ${daysLeft} days left` : daysLeft === 1 ? ' · tomorrow' : daysLeft === 0 ? ' · today' : ` · ${-daysLeft} days late`}` : 'No date yet')}
              {fact('Next step', project.next_action || 'None set')}
            </View>
          </>)}

          {section('WHY IT MATTERS TO YOU', 'heart-outline', <>
            <Text style={s.hint}>In your own words: what you get when it's done. Reading this on a slow day helps.</Text>
            <TextInput
              style={[s.why, { borderColor: why.trim() ? color : bp.border }]}
              value={why} onChangeText={setWhy} onBlur={saveWhy} multiline
              placeholder="e.g. Food I grew myself, and not depending on a grocery store."
              placeholderTextColor={bp.ink3}
              accessibilityLabel="Why this project matters to you" />
            {savingWhy ? <ActivityIndicator size="small" color={color} style={{ alignSelf: 'flex-start' }} /> : null}
          </>)}

          {section('WHERE IT FITS IN YOUR LIFE', 'compass-outline', <>
            {purpose ? <Text style={s.body}>You came here to {purpose.you}.{purpose.key === 'build' ? ' This is it.' : ''}</Text> : null}
            <Text style={s.hint}>Tap the parts of your life it helps. It shows up on those Life Area pages too.</Text>
            <View style={s.chips}>
              {Object.entries(AREAS).map(([key, a]) => {
                const on = linkedAreas.has(key);
                return (
                  <TouchableOpacity key={key} onPress={() => toggleArea(key)} disabled={loading || !!busyArea}
                    accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={a.label}
                    style={[s.chip, on && { backgroundColor: a.color + '26', borderColor: a.color }]}>
                    <Text style={[s.chipText, on && { color: bp.ink, fontWeight: '800' }]}>{a.emoji} {a.label}</Text>
                    {busyArea === key ? <ActivityIndicator size="small" color={a.color} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.body}>
              {nextSession
                ? `${info.sessions.length} work session${info.sessions.length === 1 ? '' : 's'} on your calendar. Next: ${weekday(nextSession.date)}${nextSession.start_time ? ` at ${formatTime12(nextSession.start_time.slice(0, 5))}` : ''}.`
                : loading ? '' : 'No work time on your calendar yet. Schedule some from the project page.'}
            </Text>
          </>)}

          {section('HOW FAR ALONG', 'stats-chart-outline', loading ? <ActivityIndicator color={color} /> : <>
            {pct != null ? <><RulerBar pct={pct} color={color} bp={bp} height={10} /><Text style={s.small}>{done} of {tasks.length} tasks done · {pct}%</Text></> : <Text style={s.body}>No tasks yet.</Text>}
            <View style={s.facts}>
              {fact('Next deadline', nextDue ? `${nextDue.title} · ${day(nextDue.due_date)}` : null)}
              {fact('Steps finished', stepsDone ? String(stepsDone) : null)}
              {fact('Last worked on', lastWorked ? day(lastWorked) : null)}
            </View>
          </>)}

          {!loading && (info.pieces.length > 0 || info.core) ? section('ITS PIECES', 'git-branch-outline', <>
            {info.pieces.map(p => (
              <TouchableOpacity key={p.id} style={s.row} onPress={() => openProject(p.id)} accessibilityRole="button">
                <Ionicons name={p.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={p.status === 'completed' ? bp.approved : color} />
                <Text style={s.rowText} numberOfLines={2}>{p.title}</Text>
                <Ionicons name="chevron-forward" size={14} color={bp.ink3} />
              </TouchableOpacity>
            ))}
            {info.core ? (
              <TouchableOpacity style={s.row} onPress={() => openTarget(navigation, { kind: 'idea', id: info.core.id })} accessibilityRole="button">
                <Ionicons name="leaf-outline" size={16} color={color} />
                <Text style={s.rowText} numberOfLines={2}>Its idea in the Garden: {info.core.title}</Text>
                <Ionicons name="chevron-forward" size={14} color={bp.ink3} />
              </TouchableOpacity>
            ) : null}
          </>) : null}

          {section('WHAT YOU\'VE LEARNED', 'bulb-outline', loading ? null : info.notes.length ? <>
            {info.notes.map(n => (
              <TouchableOpacity key={n.id} style={s.row} onPress={() => openTarget(navigation, { kind: 'vault', id: n.id })} accessibilityRole="button">
                <Ionicons name="document-text-outline" size={16} color={color} />
                <Text style={s.rowText} numberOfLines={3}>{noteLine(n)}</Text>
                <Ionicons name="chevron-forward" size={14} color={bp.ink3} />
              </TouchableOpacity>
            ))}
          </> : (
            <TouchableOpacity onPress={() => openTarget(navigation, { kind: 'screen', key: 'KnowledgeScreen' })} accessibilityRole="button">
              <Text style={s.body}>Nothing yet. In the Knowledge Vault, open a note and link it to this project under "Linked". <Text style={{ color, fontWeight: '700' }}>Open the Vault →</Text></Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const makeStyles = bp => StyleSheet.create({
  screen: { flex: 1, backgroundColor: bp.paper },
  top: { height: 56, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { color: bp.ink3, fontSize: 11, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 1.2, flex: 1 },
  content: { padding: 18, paddingBottom: 56 },
  stage: { color: bp.ink3, fontSize: 11, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  title: { color: bp.ink, fontSize: 24, fontFamily: FONTS.display, fontWeight: '800', marginBottom: 6 },
  section: { borderWidth: 1, borderColor: bp.border, borderRadius: 4, backgroundColor: bp.panel, padding: 14, marginTop: 16, gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: bp.ink2, fontSize: 11, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 1 },
  body: { color: bp.ink, fontSize: 14, lineHeight: 20 },
  hint: { color: bp.ink3, fontSize: 12, lineHeight: 17 },
  small: { color: bp.ink3, fontSize: 12, marginTop: 2 },
  facts: { gap: 6, marginTop: 4 },
  fact: { flexDirection: 'row', gap: 10 },
  factLabel: { color: bp.ink3, fontSize: 12, width: 104, fontFamily: FONTS.mono, fontWeight: '700' },
  factValue: { color: bp.ink, fontSize: 13, flex: 1, lineHeight: 18 },
  why: { borderWidth: 1, borderRadius: 4, minHeight: 64, padding: 10, color: bp.ink, fontSize: 14, lineHeight: 20, backgroundColor: bp.paper, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: bp.border, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: bp.paper },
  chipText: { color: bp.ink2, fontSize: 12.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: bp.border },
  rowText: { flex: 1, color: bp.ink, fontSize: 13.5, lineHeight: 19 },
});
