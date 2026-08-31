// src/screens/CaptureInbox.js
// Capture Inbox — capture anything, then route it anywhere in the app

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, Modal, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Linking, RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import { RETENTION_DAYS, getRecentlyDeleted, restoreItem, permanentlyDelete, purgeExpired } from '../api/trashService';

// ─── Recently Deleted — what a soft-deleted item looks like across kinds ───
const TRASH_KIND = {
  project:  { label: 'Project',  icon: 'hammer-outline',         color: '#c9a84c' },
  idea:     { label: 'Idea',     icon: 'leaf-outline',           color: '#4caf7d' },
  note:     { label: 'Note',     icon: 'document-text-outline',  color: '#2bb5a0' },
  research: { label: 'Research', icon: 'link-outline',           color: '#7eb8e0' },
};

function DeletedCard({ item, onRestore, onPurge, c, t, s, r }) {
  const meta = TRASH_KIND[item.kind] || TRASH_KIND.note;
  const daysGone = Math.floor((Date.now() - new Date(item.deleted_at).getTime()) / 86400000);
  const daysLeft = Math.max(0, RETENTION_DAYS - daysGone);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: meta.color + '18', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={meta.icon} size={16} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>{item.title || 'Untitled'}</Text>
        <Text style={{ fontSize: t.xs, color: c.text4, marginTop: 1 }}>
          {meta.label} · {daysLeft > 0 ? `${daysLeft}d left` : 'expiring soon'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onRestore(item)} style={{ padding: 6 }}>
        <Ionicons name="arrow-undo-outline" size={18} color={c.teal} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onPurge(item)} style={{ padding: 6 }}>
        <Ionicons name="trash-outline" size={18} color={c.error} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Capture types ────────────────────────────────────────────────────────────
// Exported so ImportScreen.js (bulk import) renders type/destination badges
// identically to this screen instead of duplicating the color/icon map.
export const CAPTURE_TYPES = [
  { key: 'note',     label: 'Note',     icon: 'document-text-outline',    color: '#2bb5a0' },
  { key: 'idea',     label: 'Idea',     icon: 'bulb-outline',             color: '#8b4fc4' },
  { key: 'link',     label: 'Link',     icon: 'link-outline',             color: '#c9a84c' },
  { key: 'task',     label: 'Task',     icon: 'checkmark-circle-outline', color: '#4caf7d' },
  { key: 'video',    label: 'Video',    icon: 'play-circle-outline',      color: '#e05858' },
  { key: 'resource', label: 'Resource', icon: 'library-outline',          color: '#3a7bd5' },
];
const TYPE_MAP = Object.fromEntries(CAPTURE_TYPES.map(t => [t.key, t]));
const URL_REGEX = /https?:\/\/[^\s]+/;

// ─── Route destinations — where a capture can go ──────────────────────────────
export const DESTINATIONS = [
  {
    key:   'project',
    label: 'Add to Project',
    icon:  'rocket-outline',
    color: '#c9a84c',
    desc:  'Send to an active mission',
  },
  {
    key:   'new_project',
    label: 'Start New Project',
    icon:  'add-circle-outline',
    color: '#00F0FF',
    desc:  'Turn this into a new mission',
  },
  {
    key:   'idea_garden',
    label: 'Plant in Idea Garden',
    icon:  'leaf-outline',
    color: '#4caf7d',
    desc:  'Add as a seed in the garden',
  },
  {
    key:   'notes',
    label: 'Save as Note',
    icon:  'document-text-outline',
    color: '#2bb5a0',
    desc:  'Add to your notes library',
  },
  {
    key:   'research',
    label: 'Add to Research',
    icon:  'search-outline',
    color: '#7eb8e0',
    desc:  'Save as a research resource',
  },
  {
    key:   'planner',
    label: 'Add to Planner',
    icon:  'calendar-outline',
    color: '#b07be0',
    desc:  'Schedule in your planner',
  },
  {
    key:   'life_area',
    label: 'Log to Life Area',
    icon:  'heart-outline',
    color: '#e05858',
    desc:  'Log in a life area',
  },
  {
    key:   'resource_tool',
    label: 'Save as Resource/Tool',
    icon:  'library-outline',
    color: '#3a7bd5',
    desc:  'Add to your resource library',
  },
  {
    key:   'task',
    label: 'Create a Task',
    icon:  'checkmark-circle-outline',
    color: '#4caf7d',
    desc:  'Turn into an actionable task',
  },
  {
    key:   'later',
    label: 'Save for Later',
    icon:  'bookmark-outline',
    color: '#f5a623',
    desc:  'Come back to this',
  },
];

// "Start New Project" only makes sense for one item at a time (which one
// becomes the seed?) — left out of the bulk destination list.
const BULK_DESTINATIONS = DESTINATIONS.filter(d => d.key !== 'new_project');

const LIFE_AREA_OPTIONS = [
  { key: 'physical',     label: 'Physical',     emoji: '💪' },
  { key: 'mental',       label: 'Mental',       emoji: '🧠' },
  { key: 'social',       label: 'Social',       emoji: '🤝' },
  { key: 'financial',    label: 'Financial',    emoji: '💰' },
  { key: 'professional', label: 'Professional', emoji: '🚀' },
  { key: 'spiritual',    label: 'Spiritual',    emoji: '✨' },
  { key: 'creative',     label: 'Creative',     emoji: '🎨' },
  { key: 'digital',      label: 'Digital',      emoji: '💻' },
];

function timeAgo(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Process Modal — where do you want to send this? ─────────────────────────
function ProcessModal({ item, projects, userId, onClose, onProcessed, onUpdated, onDeleted, c, t, s, r }) {
  const navigation = useNavigation();
  const [step,          setStep]          = useState('choose'); // choose | pick_project | pick_area | confirm
  const [destination,   setDestination]   = useState(null);
  const [selectedProj,  setSelectedProj]  = useState(null);
  const [selectedArea,  setSelectedArea]  = useState(null);
  const [processing,    setProcessing]    = useState(false);
  const [taskTitle,     setTaskTitle]     = useState(item.title || item.body?.slice(0, 60) || '');
  const [taskDueDate,   setTaskDueDate]   = useState('');

  // The item being processed, kept editable — starts as the inbox row and
  // picks up any edits saved below, so whichever destination you pick uses
  // the corrected info, not the original capture.
  const [current,   setCurrent]   = useState(item);
  const [editing,   setEditing]   = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl,   setEditUrl]   = useState('');
  const [editBody,  setEditBody]  = useState('');
  const [editTags,  setEditTags]  = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const startEditing = () => {
    setEditTitle(current.title || '');
    setEditUrl(current.url || '');
    setEditBody(current.body || '');
    setEditTags((current.tags || []).join(', '));
    setEditing(true);
  };

  const saveEdits = async () => {
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    try {
      const patch = {
        title: editTitle.trim(),
        url:   editUrl.trim() || null,
        body:  editBody.trim() || null,
        tags:  editTags.split(',').map(tg => tg.trim().toLowerCase()).filter(Boolean),
      };
      await supabase.from('captures').update(patch).eq('id', item.id);
      // Keep the task-title field in sync too, unless the user already typed
      // a custom one there themselves.
      setTaskTitle(prev => (!prev || prev === current.title) ? patch.title : prev);
      setCurrent(prev => ({ ...prev, ...patch }));
      onUpdated?.(item.id, patch);
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Could not save changes. Try again.');
    }
    setSavingEdit(false);
  };

  const confirmDelete = () => {
    Alert.alert('Delete this item?', `"${current.title || 'Untitled'}" will be moved to Recently Deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await supabase.from('captures').update({ deleted_at: new Date().toISOString() }).eq('id', item.id);
          onDeleted?.(item.id);
        } catch (e) {
          Alert.alert('Error', 'Could not delete. Try again.');
        }
      }},
    ]);
  };

  const handleDestination = (dest) => {
    setDestination(dest);
    if (dest.key === 'project')    { setStep('pick_project'); return; }
    if (dest.key === 'life_area')  { setStep('pick_area');    return; }
    if (dest.key === 'task')       { setStep('task_details'); return; }
    setStep('confirm');
  };

  const process = async () => {
    setProcessing(true);
    try {
      const now = new Date().toISOString();

      if (destination.key === 'project' && selectedProj) {
        const title = current.title || current.body?.slice(0, 80) || 'Captured item';
        const projectItem = { user_id: userId, project_id: selectedProj.id };

        // Keep a capture's meaning when it enters a project. Notes, ideas, and
        // questions belong in the project journal; links/resources are research;
        // tasks become actionable project tasks.
        if (current.type === 'task') {
          await supabase.from('project_tasks').insert({
            ...projectItem, title, priority: 3, sort_order: 0,
          });
        } else if (current.type === 'note' || current.type === 'idea') {
          await supabase.from('project_journal').insert({
            ...projectItem, title, body: current.body || current.url || title,
            type: current.type === 'idea' ? 'idea' : 'note',
          });
        } else {
          await supabase.from('project_research').insert({
            ...projectItem, title,
            type: current.type === 'video' ? 'video' : current.type === 'link' ? 'link' : 'resource',
            url: current.url || null, notes: current.body || null,
          });
        }
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('ProjectDetail', { project: selectedProj });

      } else if (destination.key === 'new_project') {
        // Navigate to projects, inbox item becomes the project seed
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('ProjectsScreen');
        Alert.alert('Create a new mission', `Use this as your starting point:\n\n"${current.title || current.body?.slice(0, 100)}"`);

      } else if (destination.key === 'idea_garden') {
        await supabase.from('garden_cores').insert({
          user_id:    userId,
          title:      current.title || current.body?.slice(0, 80) || 'New idea',
          plant_type: 'seed',
          color:      '#4caf7d',
          color_light:'#e1f5ee',
          created_at: now,
        });
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('IdeaGardenScreen');

      } else if (destination.key === 'notes') {
        await supabase.from('area_notes').insert({
          user_id:  userId,
          area_id:  'general',
          content:  `${current.title ? current.title + '\n' : ''}${current.body || ''}${current.url ? '\n' + current.url : ''}`,
          created_at: now,
        });
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('NotesScreen');

      } else if (destination.key === 'research') {
        // status: 'active' (not markDoneAndClose's 'done') — the Research
        // Vault reads status: 'inbox'/'active' items, so overwriting it to
        // 'done' here would make the item vanish from both screens.
        await supabase.from('captures').update({ type: 'link', status: 'active' }).eq('id', item.id);
        onProcessed(item.id, 'active');
        navigation.navigate('ResearchScreen');

      } else if (destination.key === 'planner') {
        await supabase.from('agenda_instances').insert({
          user_id:    userId,
          title:      current.title || current.body?.slice(0, 80) || 'Captured item',
          area:       'professional',
          cadence:    'once',
          date:       new Date().toISOString().split('T')[0],
          completed:  false,
          skipped:    false,
          created_at: now,
        });
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('PlannerScreen');

      } else if (destination.key === 'life_area' && selectedArea) {
        await supabase.from('area_notes').insert({
          user_id:  userId,
          area_id:  selectedArea.key,
          content:  `${current.title ? current.title + '\n' : ''}${current.body || ''}${current.url ? '\n' + current.url : ''}`,
          created_at: now,
        });
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('LifeAreaScreen', { areaId: selectedArea.key });

      } else if (destination.key === 'resource_tool') {
        // status: 'active' (not markDoneAndClose's 'done') — Resources &
        // Tools reads status: 'active' items, so overwriting it to 'done'
        // here would make the item vanish before it ever showed up there.
        await supabase.from('captures').update({ type: 'resource', status: 'active' }).eq('id', item.id);
        onProcessed(item.id, 'active');
        navigation.navigate('ResourcesToolsScreen');

      } else if (destination.key === 'task') {
        await supabase.from('tasks').insert({
          user_id:   userId,
          title:     taskTitle || current.title || current.body?.slice(0, 80),
          category:  'personal',
          priority:  2,
          completed: false,
          due_date:  taskDueDate || null,
          created_at: now,
        });
        await markDoneAndClose(item.id, onProcessed);

      } else if (destination.key === 'later') {
        const laterType = current.type === 'video' ? 'watch' : 'read';
        await supabase.from('captures').update({ save_for_later: laterType }).eq('id', item.id);
        onProcessed(item.id, 'later');
      }

      onClose();
    } catch (e) {
      Alert.alert('Error', 'Could not process. Try again.');
      console.warn('process', e);
    }
    setProcessing(false);
  };

  const markDoneAndClose = async (id, callback) => {
    await supabase.from('captures').update({ status: 'done' }).eq('id', id);
    callback(id, 'done');
  };

  const itemColor = TYPE_MAP[current.type]?.color || c.teal;

  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, maxHeight: '88%', borderTopWidth: 1, borderColor: itemColor + '44' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />

            {/* Item preview — editable */}
            <View style={{ backgroundColor: c.bg0, borderRadius: r.lg, padding: s.md, marginBottom: s.lg, borderLeftWidth: 3, borderLeftColor: itemColor }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: editing ? s.md : 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, flex: 1 }}>
                  <Ionicons name={TYPE_MAP[current.type]?.icon || 'document-text-outline'} size={14} color={itemColor} />
                  <Text style={{ fontSize: 10, color: itemColor, fontWeight: '800', textTransform: 'uppercase' }}>{current.type}</Text>
                </View>
                {!editing && step === 'choose' && (
                  <View style={{ flexDirection: 'row', gap: s.md }}>
                    <TouchableOpacity onPress={startEditing} style={{ padding: 2 }}>
                      <Ionicons name="pencil-outline" size={16} color={c.text3} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={confirmDelete} style={{ padding: 2 }}>
                      <Ionicons name="trash-outline" size={16} color={c.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {editing ? (
                <View>
                  <TextInput
                    style={{ backgroundColor: c.bg1, borderRadius: r.sm, padding: s.sm, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.sm }}
                    value={editTitle} onChangeText={setEditTitle}
                    placeholder="Title" placeholderTextColor={c.text4} autoFocus
                  />
                  <TextInput
                    style={{ backgroundColor: c.bg1, borderRadius: r.sm, padding: s.sm, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.sm }}
                    value={editUrl} onChangeText={setEditUrl}
                    placeholder="URL (optional)" placeholderTextColor={c.text4} autoCapitalize="none"
                  />
                  <TextInput
                    style={{ backgroundColor: c.bg1, borderRadius: r.sm, padding: s.sm, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.sm, minHeight: 60, textAlignVertical: 'top' }}
                    value={editBody} onChangeText={setEditBody}
                    placeholder="Notes (optional)" placeholderTextColor={c.text4} multiline
                  />
                  <TextInput
                    style={{ backgroundColor: c.bg1, borderRadius: r.sm, padding: s.sm, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.md }}
                    value={editTags} onChangeText={setEditTags}
                    placeholder="Tags (comma separated)" placeholderTextColor={c.text4} autoCapitalize="none"
                  />
                  <View style={{ flexDirection: 'row', gap: s.sm }}>
                    <TouchableOpacity onPress={() => setEditing(false)}
                      style={{ flex: 1, padding: s.sm, alignItems: 'center', backgroundColor: c.bg1, borderRadius: r.sm, borderWidth: 0.5, borderColor: c.border }}>
                      <Text style={{ color: c.text3, fontWeight: '600', fontSize: t.xs }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={saveEdits} disabled={!editTitle.trim() || savingEdit}
                      style={{ flex: 2, padding: s.sm, alignItems: 'center', backgroundColor: c.teal, borderRadius: r.sm, opacity: !editTitle.trim() ? 0.5 : 1 }}>
                      {savingEdit ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={{ color: '#fff', fontWeight: '700', fontSize: t.xs }}>Save changes</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }} numberOfLines={2}>
                    {current.title || current.body?.slice(0, 100)}
                  </Text>
                  {current.body && current.body !== current.title && (
                    <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3, lineHeight: 16 }} numberOfLines={3}>{current.body}</Text>
                  )}
                  {current.url && (
                    <TouchableOpacity onPress={() => Linking.openURL(current.url)}>
                      <Text style={{ fontSize: 11, color: c.teal, marginTop: 3, textDecorationLine: 'underline' }} numberOfLines={1}>{current.url}</Text>
                    </TouchableOpacity>
                  )}
                  {current.tags?.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {current.tags.map((tg, i) => (
                        <View key={i} style={{ backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 9, color: c.text4 }}>#{tg}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Steps */}
            {!editing && step === 'choose' && (
              <>
                <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.md }}>
                  Where does this go?
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  {DESTINATIONS.map(dest => (
                    <TouchableOpacity key={dest.key} onPress={() => handleDestination(dest)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: dest.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={dest.icon} size={18} color={dest.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{dest.label}</Text>
                        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{dest.desc}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={c.text4} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity onPress={onClose}
                  style={{ marginTop: s.md, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
                  <Text style={{ color: c.text3, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'pick_project' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.lg }}>
                  <TouchableOpacity onPress={() => setStep('choose')}>
                    <Ionicons name="chevron-back" size={20} color={c.teal} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Choose a Project</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                  {projects.length === 0 ? (
                    <Text style={{ color: c.text3, textAlign: 'center', paddingVertical: 30 }}>No active projects yet</Text>
                  ) : (
                    projects.map(proj => (
                      <TouchableOpacity key={proj.id} onPress={() => { setSelectedProj(proj); setStep('confirm'); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: proj.color ? proj.color + '44' : c.border }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: (proj.color || c.teal) + '22', borderWidth: 1.5, borderColor: proj.color || c.teal, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 22 }}>{proj.emoji || '🚀'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{proj.title}</Text>
                          {proj.objective && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }} numberOfLines={1}>{proj.objective}</Text>}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={c.text4} />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            )}

            {step === 'pick_area' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.lg }}>
                  <TouchableOpacity onPress={() => setStep('choose')}>
                    <Ionicons name="chevron-back" size={20} color={c.teal} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Choose a Life Area</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                  {LIFE_AREA_OPTIONS.map(area => (
                    <TouchableOpacity key={area.key} onPress={() => { setSelectedArea(area); setStep('confirm'); }}
                      style={{ width: '47%', flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border }}>
                      <Text style={{ fontSize: 22 }}>{area.emoji}</Text>
                      <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{area.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {step === 'task_details' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.lg }}>
                  <TouchableOpacity onPress={() => setStep('choose')}>
                    <Ionicons name="chevron-back" size={20} color={c.teal} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Create Task</Text>
                </View>
                <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: 6 }}>Task title</Text>
                <TextInput style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: '#4caf7d' + '66', marginBottom: s.md }}
                  value={taskTitle} onChangeText={setTaskTitle} autoFocus />
                <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: 6 }}>Due date (optional)</Text>
                <TextInput style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.lg }}
                  value={taskDueDate} onChangeText={setTaskDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={c.text4} />
                <TouchableOpacity onPress={() => { setDestination(DESTINATIONS.find(d => d.key === 'task')); process(); }}
                  disabled={!taskTitle.trim() || processing}
                  style={{ backgroundColor: '#4caf7d', borderRadius: r.md, padding: s.md, alignItems: 'center', opacity: !taskTitle.trim() ? 0.5 : 1 }}>
                  {processing ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ color: '#fff', fontWeight: t.bold }}>Create Task</Text>}
                </TouchableOpacity>
              </>
            )}

            {step === 'confirm' && destination && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.xl }}>
                  <TouchableOpacity onPress={() => setStep(destination.key === 'project' ? 'pick_project' : destination.key === 'life_area' ? 'pick_area' : 'choose')}>
                    <Ionicons name="chevron-back" size={20} color={c.teal} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Confirm</Text>
                </View>

                <View style={{ alignItems: 'center', paddingVertical: s.xl }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: destination.color + '22', borderWidth: 2, borderColor: destination.color, alignItems: 'center', justifyContent: 'center', marginBottom: s.md }}>
                    <Ionicons name={destination.icon} size={28} color={destination.color} />
                  </View>
                  <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>{destination.label}</Text>
                  {selectedProj && <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: 4 }}>→ {selectedProj.emoji} {selectedProj.title}</Text>}
                  {selectedArea && <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: 4 }}>→ {selectedArea.emoji} {selectedArea.label}</Text>}
                  <Text style={{ fontSize: t.xs, color: c.text3, textAlign: 'center', lineHeight: 18 }}>
                    This item will be sent to {destination.label.toLowerCase()} and marked as done in your inbox.
                  </Text>
                </View>

                <TouchableOpacity onPress={process} disabled={processing}
                  style={{ backgroundColor: destination.color, borderRadius: r.md, padding: s.md + 2, alignItems: 'center', opacity: processing ? 0.7 : 1 }}>
                  {processing ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>Send it →</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Bulk Process Modal — send several items to the same place at once ───────
function BulkProcessModal({ items, projects, userId, onClose, onProcessed, c, t, s, r }) {
  const navigation = useNavigation();
  const [step,         setStep]         = useState('choose'); // choose | pick_project | pick_area | task_details | confirm
  const [destination,  setDestination]  = useState(null);
  const [selectedProj, setSelectedProj] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [taskDueDate,  setTaskDueDate]  = useState('');
  const [processing,   setProcessing]   = useState(false);
  const [progress,     setProgress]     = useState({ done: 0, total: items.length });

  const handleDestination = (dest) => {
    setDestination(dest);
    if (dest.key === 'project')    { setStep('pick_project'); return; }
    if (dest.key === 'life_area')  { setStep('pick_area');    return; }
    if (dest.key === 'task')       { setStep('task_details'); return; }
    setStep('confirm');
  };

  const process = async () => {
    setProcessing(true);
    setProgress({ done: 0, total: items.length });
    let saved = 0, skipped = 0;
    const now = new Date().toISOString();

    for (const it of items) {
      try {
        const title = it.title || it.body?.slice(0, 80) || 'Captured item';

        if (destination.key === 'project' && selectedProj) {
          const projectItem = { user_id: userId, project_id: selectedProj.id };
          if (it.type === 'task') {
            await supabase.from('project_tasks').insert({ ...projectItem, title, priority: 3, sort_order: 0 });
          } else if (it.type === 'note' || it.type === 'idea') {
            await supabase.from('project_journal').insert({
              ...projectItem, title, body: it.body || it.url || title,
              type: it.type === 'idea' ? 'idea' : 'note',
            });
          } else {
            await supabase.from('project_research').insert({
              ...projectItem, title,
              type: it.type === 'video' ? 'video' : it.type === 'link' ? 'link' : 'resource',
              url: it.url || null, notes: it.body || null,
            });
          }
          await supabase.from('captures').update({ status: 'done' }).eq('id', it.id);

        } else if (destination.key === 'idea_garden') {
          await supabase.from('garden_cores').insert({
            user_id: userId, title, plant_type: 'seed',
            color: '#4caf7d', color_light: '#e1f5ee', created_at: now,
          });
          await supabase.from('captures').update({ status: 'done' }).eq('id', it.id);

        } else if (destination.key === 'notes') {
          await supabase.from('area_notes').insert({
            user_id: userId, area_id: 'general',
            content: `${it.title ? it.title + '\n' : ''}${it.body || ''}${it.url ? '\n' + it.url : ''}`,
            created_at: now,
          });
          await supabase.from('captures').update({ status: 'done' }).eq('id', it.id);

        } else if (destination.key === 'research') {
          // status: 'active', not 'done' — Research Vault reads this row directly.
          await supabase.from('captures').update({ type: 'link', status: 'active' }).eq('id', it.id);

        } else if (destination.key === 'planner') {
          await supabase.from('agenda_instances').insert({
            user_id: userId, title, area: 'professional', cadence: 'once',
            date: new Date().toISOString().split('T')[0],
            completed: false, skipped: false, created_at: now,
          });
          await supabase.from('captures').update({ status: 'done' }).eq('id', it.id);

        } else if (destination.key === 'life_area' && selectedArea) {
          await supabase.from('area_notes').insert({
            user_id: userId, area_id: selectedArea.key,
            content: `${it.title ? it.title + '\n' : ''}${it.body || ''}${it.url ? '\n' + it.url : ''}`,
            created_at: now,
          });
          await supabase.from('captures').update({ status: 'done' }).eq('id', it.id);

        } else if (destination.key === 'resource_tool') {
          // status: 'active', not 'done' — Resources & Tools reads this row directly.
          await supabase.from('captures').update({ type: 'resource', status: 'active' }).eq('id', it.id);

        } else if (destination.key === 'task') {
          await supabase.from('tasks').insert({
            user_id: userId, title, category: 'personal', priority: 2,
            completed: false, due_date: taskDueDate || null, created_at: now,
          });
          await supabase.from('captures').update({ status: 'done' }).eq('id', it.id);

        } else if (destination.key === 'later') {
          const laterType = it.type === 'video' ? 'watch' : 'read';
          await supabase.from('captures').update({ save_for_later: laterType }).eq('id', it.id);
        }
        saved++;
      } catch (e) {
        console.warn('BulkProcessModal: failed for', it.id, e.message || e);
        skipped++;
      }
      setProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }

    setProcessing(false);
    onProcessed(items.map(it => it.id), { saved, skipped, destination: destination.label });
  };

  const backFromConfirm = () => setStep(
    destination?.key === 'project' ? 'pick_project' : destination?.key === 'life_area' ? 'pick_area' : 'choose'
  );

  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, maxHeight: '88%', borderTopWidth: 1, borderColor: c.teal + '44' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />

            {/* Selection summary */}
            <View style={{ backgroundColor: c.bg0, borderRadius: r.lg, padding: s.md, marginBottom: s.lg, borderLeftWidth: 3, borderLeftColor: c.teal, flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
              <Ionicons name="layers-outline" size={18} color={c.teal} />
              <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, flex: 1 }}>
                {items.length} item{items.length === 1 ? '' : 's'} selected
              </Text>
            </View>

            {step === 'choose' && (
              <>
                <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.md }}>
                  Send all of them where?
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  {BULK_DESTINATIONS.map(dest => (
                    <TouchableOpacity key={dest.key} onPress={() => handleDestination(dest)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: dest.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={dest.icon} size={18} color={dest.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{dest.label}</Text>
                        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{dest.desc}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={c.text4} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity onPress={onClose}
                  style={{ marginTop: s.md, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
                  <Text style={{ color: c.text3, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'pick_project' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.lg }}>
                  <TouchableOpacity onPress={() => setStep('choose')}>
                    <Ionicons name="chevron-back" size={20} color={c.teal} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Choose a Project</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                  {projects.length === 0 ? (
                    <Text style={{ color: c.text3, textAlign: 'center', paddingVertical: 30 }}>No active projects yet</Text>
                  ) : (
                    projects.map(proj => (
                      <TouchableOpacity key={proj.id} onPress={() => { setSelectedProj(proj); setStep('confirm'); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: proj.color ? proj.color + '44' : c.border }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: (proj.color || c.teal) + '22', borderWidth: 1.5, borderColor: proj.color || c.teal, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 22 }}>{proj.emoji || '🚀'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{proj.title}</Text>
                          {proj.objective && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }} numberOfLines={1}>{proj.objective}</Text>}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={c.text4} />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            )}

            {step === 'pick_area' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.lg }}>
                  <TouchableOpacity onPress={() => setStep('choose')}>
                    <Ionicons name="chevron-back" size={20} color={c.teal} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Choose a Life Area</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                  {LIFE_AREA_OPTIONS.map(area => (
                    <TouchableOpacity key={area.key} onPress={() => { setSelectedArea(area); setStep('confirm'); }}
                      style={{ width: '47%', flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border }}>
                      <Text style={{ fontSize: 22 }}>{area.emoji}</Text>
                      <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{area.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {step === 'task_details' && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.lg }}>
                  <TouchableOpacity onPress={() => setStep('choose')}>
                    <Ionicons name="chevron-back" size={20} color={c.teal} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Create {items.length} Tasks</Text>
                </View>
                <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: s.md, lineHeight: 17 }}>
                  Each item's own title becomes its own task. Set a due date to apply to all of them (optional).
                </Text>
                <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: 6 }}>Due date (optional)</Text>
                <TextInput style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.lg }}
                  value={taskDueDate} onChangeText={setTaskDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={c.text4} />
                <TouchableOpacity onPress={() => setStep('confirm')}
                  style={{ backgroundColor: '#4caf7d', borderRadius: r.md, padding: s.md, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: t.bold }}>Continue</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'confirm' && destination && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.xl }}>
                  <TouchableOpacity onPress={backFromConfirm}>
                    <Ionicons name="chevron-back" size={20} color={c.teal} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Confirm</Text>
                </View>

                <View style={{ alignItems: 'center', paddingVertical: s.xl }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: destination.color + '22', borderWidth: 2, borderColor: destination.color, alignItems: 'center', justifyContent: 'center', marginBottom: s.md }}>
                    <Ionicons name={destination.icon} size={28} color={destination.color} />
                  </View>
                  <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>{destination.label}</Text>
                  {selectedProj && <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: 4 }}>→ {selectedProj.emoji} {selectedProj.title}</Text>}
                  {selectedArea && <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: 4 }}>→ {selectedArea.emoji} {selectedArea.label}</Text>}
                  <Text style={{ fontSize: t.xs, color: c.text3, textAlign: 'center', lineHeight: 18 }}>
                    All {items.length} items will be sent to {destination.label.toLowerCase()} and marked as done in your inbox.
                  </Text>
                </View>

                <TouchableOpacity onPress={process} disabled={processing}
                  style={{ backgroundColor: destination.color, borderRadius: r.md, padding: s.md + 2, alignItems: 'center', opacity: processing ? 0.7 : 1 }}>
                  {processing
                    ? <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>Sending {progress.done} of {progress.total}…</Text>
                    : <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>Send all {items.length} →</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Capture card ─────────────────────────────────────────────────────────────
function CaptureCard({ item, onProcess, onDone, selectMode, selected, onToggleSelect, onEnterSelectMode, c, t, s, r }) {
  const tp    = TYPE_MAP[item.type] || TYPE_MAP.note;
  const color = tp.color;

  return (
    <TouchableOpacity
      onPress={() => selectMode ? onToggleSelect(item.id) : onProcess(item)}
      onLongPress={() => !selectMode && onEnterSelectMode(item.id)}
      activeOpacity={0.85}
      style={{
        backgroundColor: c.bg1, borderRadius: r.lg, marginBottom: s.sm,
        borderWidth: selected ? 1.5 : 0.5, borderColor: selected ? c.teal : c.border,
        overflow: 'hidden', flexDirection: 'row',
      }}>
      {selectMode && (
        <View style={{ justifyContent: 'center', paddingLeft: s.md, paddingRight: 2 }}>
          <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={selected ? c.teal : c.text4} />
        </View>
      )}
      <View style={{ width: 4, backgroundColor: color }} />
      <View style={{ flex: 1, padding: s.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: 5 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color + '18', borderRadius: r.full, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Ionicons name={tp.icon} size={10} color={color} />
            <Text style={{ fontSize: 9, color, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.type}</Text>
          </View>
          {item.save_for_later && (
            <View style={{ backgroundColor: c.gold + '22', borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, color: c.gold }}>{item.save_for_later === 'watch' ? '▶ Watch' : '📖 Read'} later</Text>
            </View>
          )}
          <Text style={{ fontSize: 10, color: c.text4, marginLeft: 'auto' }}>{timeAgo(item.created_at)}</Text>
        </View>

        {item.title && (
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, lineHeight: 20, marginBottom: 3 }} numberOfLines={2}>{item.title}</Text>
        )}
        {item.body && item.body !== item.title && !item.url && (
          <Text style={{ fontSize: t.xs, color: c.text3, lineHeight: 17 }} numberOfLines={2}>{item.body}</Text>
        )}
        {item.url && (
          <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
            <Text style={{ fontSize: t.xs, color: color, marginTop: 2, textDecorationLine: 'underline' }} numberOfLines={1}>{item.url}</Text>
          </TouchableOpacity>
        )}
        {item.tags?.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
            {item.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={{ backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 9, color: c.text4 }}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Process prompt */}
        {!selectMode && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: s.sm, paddingTop: s.sm, borderTopWidth: 0.5, borderTopColor: c.border }}>
            <Ionicons name="arrow-forward-circle-outline" size={13} color={color} />
            <Text style={{ fontSize: 11, color, fontWeight: '600' }}>Tap to process → send it where it belongs</Text>
          </View>
        )}
      </View>

      {/* Done button */}
      {!selectMode && (
        <TouchableOpacity onPress={() => onDone(item)}
          style={{ justifyContent: 'center', paddingHorizontal: s.sm, backgroundColor: c.teal + '12' }}>
          <Ionicons name="checkmark" size={18} color={c.teal} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── Quick Capture Modal ──────────────────────────────────────────────────────
// Exported so the global floating action button can pop this up from
// anywhere without navigating to the full Capture Inbox screen.
export function QuickCaptureModal({ visible, userId, onSaved, onClose, c, t, s, r }) {
  const [draft,  setDraft]  = useState('');
  const [type,   setType]   = useState('note');
  const [tags,   setTags]   = useState('');
  const [saving, setSaving] = useState(false);
  const [url,    setUrl]    = useState(null);

  const handleText = (text) => {
    setDraft(text);
    const match = text.match(URL_REGEX);
    if (match) { setUrl(match[0]); if (type === 'note') setType('link'); }
    else setUrl(null);
  };

  const paste = async () => {
    try { const text = await Clipboard.getStringAsync(); if (text) handleText(text); } catch {}
  };

  const save = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const { data, error } = await supabase.from('captures').insert({
        user_id:    userId,
        type,
        title:      draft.length > 80 ? draft.slice(0, 77) + '...' : draft,
        body:       draft,
        url:        url,
        tags:       tagList,
        status:     'inbox',
        created_at: new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      onSaved(data);
      setDraft(''); setType('note'); setTags(''); setUrl(null);
    } catch (e) {
      Alert.alert('Error', 'Could not save. Try again.');
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, borderTopWidth: 0.5, borderColor: c.border }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.lg }}>
            <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1 }}>⚡ Quick Capture</Text>
            <TouchableOpacity onPress={() => { setDraft(''); setType('note'); setTags(''); onClose(); }}>
              <Ionicons name="close" size={22} color={c.text3} />
            </TouchableOpacity>
          </View>

          {/* Type chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.md }}>
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              {CAPTURE_TYPES.map(tp => (
                <TouchableOpacity key={tp.key} onPress={() => setType(tp.key)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: s.md, paddingVertical: 7, borderRadius: r.full, borderWidth: 1.5, borderColor: type === tp.key ? tp.color : c.border, backgroundColor: type === tp.key ? tp.color + '18' : c.bg0 }}>
                  <Ionicons name={tp.icon} size={13} color={type === tp.key ? tp.color : c.text3} />
                  <Text style={{ fontSize: t.xs, color: type === tp.key ? tp.color : c.text3, fontWeight: type === tp.key ? t.bold : t.regular }}>{tp.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Main input */}
          <TextInput
            style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: (TYPE_MAP[type]?.color || c.teal) + '55', minHeight: 80, textAlignVertical: 'top', marginBottom: s.sm }}
            value={draft} onChangeText={handleText}
            placeholder={type === 'idea' ? "What's the idea? Don't filter it." : type === 'task' ? 'What needs to get done?' : type === 'link' ? 'Paste URL or describe the link...' : 'Capture it...'}
            placeholderTextColor={c.text4} multiline autoFocus />

          {url && (
            <Text style={{ fontSize: 11, color: c.teal, marginBottom: s.sm }} numberOfLines={1}>🔗 {url}</Text>
          )}

          <TouchableOpacity onPress={paste}
            style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, alignSelf: 'flex-start', backgroundColor: c.teal + '18', borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 6, marginBottom: s.md }}>
            <Ionicons name="clipboard-outline" size={13} color={c.teal} />
            <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: '600' }}>Paste from clipboard</Text>
          </TouchableOpacity>

          <TextInput style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.md }}
            value={tags} onChangeText={setTags}
            placeholder="Tags: money, ideas, health..." placeholderTextColor={c.text4} autoCapitalize="none" />

          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ color: c.text3 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={!draft.trim() || saving}
              style={{ flex: 2, backgroundColor: c.teal, borderRadius: r.md, padding: s.md, alignItems: 'center', opacity: (!draft.trim() || saving) ? 0.5 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontWeight: t.bold }}>Capture → Process later</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main CaptureInbox ────────────────────────────────────────────────────────
export default function CaptureInbox() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const navigation = useNavigation();
  const [captures,   setCaptures]   = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [showAdd,    setShowAdd]    = useState(false);
  const [processing, setProcessing] = useState(null); // item being processed
  const [view,       setView]       = useState('inbox'); // inbox | later | done | trash
  const [deletedItems, setDeletedItems] = useState([]);
  const [selectMode,  setSelectMode]  = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false); // opens BulkProcessModal

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadAll(user.id); }
      else setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    if (userId) loadAll(userId);
  }, [userId, view]));

  const loadAll = async (uid) => {
    setLoading(true);
    try {
      if (view === 'trash') {
        // Sweep anything past the retention window before showing the list —
        // there's no server-side cron, so this is where that happens.
        await purgeExpired(uid).catch(e => console.warn('purge error', e));
        setDeletedItems(await getRecentlyDeleted(uid));
      } else {
        let query = supabase.from('captures').select('*').eq('user_id', uid).is('deleted_at', null)
          .order('created_at', { ascending: false }).limit(80);

        if (view === 'inbox') query = query.eq('status', 'inbox').is('save_for_later', null);
        else if (view === 'later') query = query.eq('status', 'inbox').not('save_for_later', 'is', null);
        else query = query.eq('status', 'done').limit(30);

        const [capRes, projRes] = await Promise.all([
          query,
          supabase.from('projects').select('id,title,emoji,color,objective').eq('user_id', uid).eq('status', 'active').is('deleted_at', null).limit(10),
        ]);
        if (capRes.data)  setCaptures(capRes.data);
        if (projRes.data) setProjects(projRes.data);
      }
    } catch (e) { console.warn('CaptureInbox', e); }
    setLoading(false);
  };

  const handleRestore = async (item) => {
    setDeletedItems(prev => prev.filter(x => !(x.kind === item.kind && x.id === item.id)));
    try { await restoreItem(item.kind, item.id); }
    catch (e) { Alert.alert('Could not restore', e.message || 'Try again.'); if (userId) loadAll(userId); }
  };

  const handlePurgeOne = (item) => {
    Alert.alert('Delete forever?', `"${item.title || 'Untitled'}" will be permanently deleted. This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Forever', style: 'destructive', onPress: async () => {
        setDeletedItems(prev => prev.filter(x => !(x.kind === item.kind && x.id === item.id)));
        try { await permanentlyDelete(item.kind, item.id); }
        catch (e) { Alert.alert('Could not delete', e.message || 'Try again.'); if (userId) loadAll(userId); }
      }},
    ]);
  };

  const onRefresh = async () => { setRefreshing(true); if (userId) await loadAll(userId); setRefreshing(false); };

  const markDone = async (item) => {
    setCaptures(prev => prev.filter(c => c.id !== item.id));
    await supabase.from('captures').update({ status: 'done' }).eq('id', item.id);
  };

  const onProcessed = (itemId, result) => {
    setCaptures(prev => prev.filter(c => c.id !== itemId));
    setProcessing(null);
  };

  // ── Multi-select ──────────────────────────────────────────────────────────
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const enterSelectMode = (firstId) => {
    setSelectMode(true);
    setSelectedIds(new Set(firstId ? [firstId] : []));
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => setSelectedIds(new Set(filtered.map(it => it.id)));

  const bulkMarkDone = async () => {
    const ids = Array.from(selectedIds);
    setCaptures(prev => prev.filter(c => !selectedIds.has(c.id)));
    exitSelectMode();
    await supabase.from('captures').update({ status: 'done' }).in('id', ids);
  };

  const bulkDelete = () => {
    const n = selectedIds.size;
    Alert.alert(`Delete ${n} item${n === 1 ? '' : 's'}?`, `They'll be moved to Recently Deleted for ${RETENTION_DAYS} days.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const ids = Array.from(selectedIds);
        setCaptures(prev => prev.filter(c => !selectedIds.has(c.id)));
        exitSelectMode();
        await supabase.from('captures').update({ deleted_at: new Date().toISOString() }).in('id', ids);
      }},
    ]);
  };

  const onBulkProcessed = (ids, { saved, skipped, destination }) => {
    setCaptures(prev => prev.filter(c => !ids.includes(c.id)));
    setBulkProcessing(false);
    exitSelectMode();
    if (skipped > 0) {
      Alert.alert('Mostly done', `${saved} sent to ${destination}, ${skipped} failed. Try the failed ones again individually.`);
    }
  };

  const filtered = captures.filter(item => filter === 'all' || item.type === filter);
  const inbox    = captures.filter(c => c.status === 'inbox').length;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor: c.bg1, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: s.lg, paddingTop: s.xl }}>
          <View>
            <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>📥 Inbox</Text>
            <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Capture now, route it later</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            {view !== 'trash' && (
              <TouchableOpacity onPress={() => selectMode ? exitSelectMode() : enterSelectMode(null)}
                style={{ backgroundColor: selectMode ? c.teal : c.bg0, borderWidth: 1, borderColor: selectMode ? c.teal : c.border, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={selectMode ? 'close' : 'checkbox-outline'} size={20} color={selectMode ? '#fff' : c.text3} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('ImportScreen')}
              style={{ backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="download-outline" size={20} color={c.gold} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(true)}
              style={{ backgroundColor: c.teal, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* View tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, paddingBottom: s.sm, gap: s.sm }}>
          {[
            { key: 'inbox', label: '📥 To Process' },
            { key: 'later', label: '🔖 For Later' },
            { key: 'done',  label: '✅ Done' },
            { key: 'trash', label: '🗑️ Deleted' },
          ].map(tab => (
            <TouchableOpacity key={tab.key} onPress={() => setView(tab.key)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: r.md, alignItems: 'center', backgroundColor: view === tab.key ? c.teal : c.bg0, borderWidth: 0.5, borderColor: view === tab.key ? c.teal : c.border }}>
              <Text style={{ fontSize: 11, fontWeight: t.bold, color: view === tab.key ? '#fff' : c.text3 }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Type filter */}
        {view !== 'trash' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: s.lg, paddingBottom: s.sm, gap: s.sm }}>
            <TouchableOpacity onPress={() => setFilter('all')}
              style={{ paddingHorizontal: s.md, paddingVertical: 5, borderRadius: r.full, borderWidth: 1, borderColor: filter === 'all' ? c.teal : c.border, backgroundColor: filter === 'all' ? c.teal + '18' : 'transparent' }}>
              <Text style={{ fontSize: 11, color: filter === 'all' ? c.teal : c.text4, fontWeight: filter === 'all' ? '700' : '400' }}>All</Text>
            </TouchableOpacity>
            {CAPTURE_TYPES.map(tp => (
              <TouchableOpacity key={tp.key} onPress={() => setFilter(tp.key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: s.md, paddingVertical: 5, borderRadius: r.full, borderWidth: 1, borderColor: filter === tp.key ? tp.color : c.border, backgroundColor: filter === tp.key ? tp.color + '18' : 'transparent' }}>
                <Ionicons name={tp.icon} size={11} color={filter === tp.key ? tp.color : c.text4} />
                <Text style={{ fontSize: 11, color: filter === tp.key ? tp.color : c.text4, fontWeight: filter === tp.key ? '700' : '400' }}>{tp.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* List */}
      {loading ? <ActivityIndicator color={c.teal} style={{ marginTop: 40 }} /> : view === 'trash' ? (
        deletedItems.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <Text style={{ fontSize: 56, marginBottom: s.lg }}>🗑️</Text>
            <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Nothing deleted</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20 }}>
              Deleted projects, ideas, notes, and research show up here for {RETENTION_DAYS} days before they're gone for good.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}>
            <View style={{ backgroundColor: c.teal + '12', borderRadius: r.md, padding: s.md, marginBottom: s.md, flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
              <Ionicons name="information-circle-outline" size={16} color={c.teal} />
              <Text style={{ fontSize: t.xs, color: c.teal, flex: 1, lineHeight: 17 }}>
                Kept for {RETENTION_DAYS} days, then removed automatically. Restore or delete forever any time before that.
              </Text>
            </View>
            {deletedItems.map(item => (
              <DeletedCard key={`${item.kind}-${item.id}`} item={item}
                onRestore={handleRestore} onPurge={handlePurgeOne}
                c={c} t={t} s={s} r={r} />
            ))}
          </ScrollView>
        )
      ) : (
        filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <Text style={{ fontSize: 56, marginBottom: s.lg }}>
              {view === 'inbox' ? '📥' : view === 'later' ? '🔖' : '✅'}
            </Text>
            <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>
              {view === 'inbox' ? 'Inbox is clear!' : view === 'later' ? 'Nothing saved for later' : 'Nothing done yet'}
            </Text>
            <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', marginBottom: s.xl, lineHeight: 20 }}>
              {view === 'inbox'
                ? 'Capture a link, idea, note, or task — then process it into the right place in your app.'
                : view === 'later'
                ? 'When you mark something "read later" or "watch later" it shows up here.'
                : 'Items you process or mark done appear here.'}
            </Text>
            {view === 'inbox' && (
              <TouchableOpacity onPress={() => setShowAdd(true)}
                style={{ backgroundColor: c.teal, borderRadius: r.lg, paddingVertical: s.md, paddingHorizontal: s.xl }}>
                <Text style={{ color: '#fff', fontWeight: t.bold }}>⚡ Capture something</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: selectMode ? 130 : 80 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}>
            {selectMode ? (
              <View style={{ backgroundColor: c.teal + '12', borderRadius: r.md, padding: s.md, marginBottom: s.md, flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
                <Ionicons name="checkbox-outline" size={16} color={c.teal} />
                <Text style={{ fontSize: t.xs, color: c.teal, flex: 1, lineHeight: 17 }}>
                  Tap items to select them, then send them all to the same place at once.
                </Text>
                <TouchableOpacity onPress={selectAllVisible}>
                  <Text style={{ fontSize: 11, color: c.teal, fontWeight: '800' }}>Select all</Text>
                </TouchableOpacity>
              </View>
            ) : view === 'inbox' && (
              <View style={{ backgroundColor: c.teal + '12', borderRadius: r.md, padding: s.md, marginBottom: s.md, flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
                <Ionicons name="information-circle-outline" size={16} color={c.teal} />
                <Text style={{ fontSize: t.xs, color: c.teal, flex: 1, lineHeight: 17 }}>
                  Tap a card to process it — send it to a project, note, idea garden, planner, life area, task list, or save for later. Long-press to select several at once.
                </Text>
              </View>
            )}
            {filtered.map(item => (
              <CaptureCard key={item.id} item={item}
                onProcess={(item) => setProcessing(item)}
                onDone={markDone}
                selectMode={selectMode}
                selected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onEnterSelectMode={enterSelectMode}
                c={c} t={t} s={s} r={r} />
            ))}
          </ScrollView>
        )
      )}

      {/* Bulk action bar */}
      {selectMode && (
        <View style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          backgroundColor: c.bg1, borderTopWidth: 0.5, borderTopColor: c.border,
          paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.xl,
          flexDirection: 'row', alignItems: 'center', gap: s.md,
        }}>
          <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>
            {selectedIds.size} selected
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={bulkDelete} disabled={selectedIds.size === 0}
            style={{ padding: s.sm, opacity: selectedIds.size === 0 ? 0.35 : 1 }}>
            <Ionicons name="trash-outline" size={20} color={c.error} />
          </TouchableOpacity>
          <TouchableOpacity onPress={bulkMarkDone} disabled={selectedIds.size === 0}
            style={{ padding: s.sm, opacity: selectedIds.size === 0 ? 0.35 : 1 }}>
            <Ionicons name="checkmark-circle-outline" size={20} color={c.teal} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setBulkProcessing(true)} disabled={selectedIds.size === 0}
            style={{ backgroundColor: c.teal, borderRadius: r.md, paddingHorizontal: s.lg, paddingVertical: s.sm, opacity: selectedIds.size === 0 ? 0.35 : 1 }}>
            <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Process</Text>
          </TouchableOpacity>
        </View>
      )}

      <QuickCaptureModal
        visible={showAdd} userId={userId}
        onSaved={(item) => { setCaptures(prev => [item, ...prev]); setShowAdd(false); }}
        onClose={() => setShowAdd(false)}
        c={c} t={t} s={s} r={r} />

      {processing && (
        <ProcessModal
          item={processing} projects={projects} userId={userId}
          onClose={() => setProcessing(null)}
          onProcessed={onProcessed}
          onUpdated={(id, patch) => setCaptures(prev => prev.map(cap => cap.id === id ? { ...cap, ...patch } : cap))}
          onDeleted={(id) => { setCaptures(prev => prev.filter(cap => cap.id !== id)); setProcessing(null); }}
          c={c} t={t} s={s} r={r} />
      )}

      {bulkProcessing && selectedIds.size > 0 && (
        <BulkProcessModal
          items={captures.filter(cap => selectedIds.has(cap.id))}
          projects={projects} userId={userId}
          onClose={() => setBulkProcessing(false)}
          onProcessed={onBulkProcessed}
          c={c} t={t} s={s} r={r} />
      )}
    </View>
  );
}
