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

// ─── Capture types ────────────────────────────────────────────────────────────
const CAPTURE_TYPES = [
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
const DESTINATIONS = [
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
function ProcessModal({ item, projects, userId, onClose, onProcessed, c, t, s, r }) {
  const navigation = useNavigation();
  const [step,          setStep]          = useState('choose'); // choose | pick_project | pick_area | confirm
  const [destination,   setDestination]   = useState(null);
  const [selectedProj,  setSelectedProj]  = useState(null);
  const [selectedArea,  setSelectedArea]  = useState(null);
  const [processing,    setProcessing]    = useState(false);
  const [taskTitle,     setTaskTitle]     = useState(item.title || item.body?.slice(0, 60) || '');
  const [taskDueDate,   setTaskDueDate]   = useState('');

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
        const title = item.title || item.body?.slice(0, 80) || 'Captured item';
        const projectItem = { user_id: userId, project_id: selectedProj.id };

        // Keep a capture's meaning when it enters a project. Notes, ideas, and
        // questions belong in the project journal; links/resources are research;
        // tasks become actionable project tasks.
        if (item.type === 'task') {
          await supabase.from('project_tasks').insert({
            ...projectItem, title, priority: 3, sort_order: 0,
          });
        } else if (item.type === 'note' || item.type === 'idea') {
          await supabase.from('project_journal').insert({
            ...projectItem, title, body: item.body || item.url || title,
            type: item.type === 'idea' ? 'idea' : 'note',
          });
        } else {
          await supabase.from('project_research').insert({
            ...projectItem, title,
            type: item.type === 'video' ? 'video' : item.type === 'link' ? 'link' : 'resource',
            url: item.url || null, notes: item.body || null,
          });
        }
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('ProjectDetail', { project: selectedProj });

      } else if (destination.key === 'new_project') {
        // Navigate to projects, inbox item becomes the project seed
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('ProjectsScreen');
        Alert.alert('Create a new mission', `Use this as your starting point:\n\n"${item.title || item.body?.slice(0, 100)}"`);

      } else if (destination.key === 'idea_garden') {
        await supabase.from('garden_cores').insert({
          user_id:    userId,
          title:      item.title || item.body?.slice(0, 80) || 'New idea',
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
          content:  `${item.title ? item.title + '\n' : ''}${item.body || ''}${item.url ? '\n' + item.url : ''}`,
          created_at: now,
        });
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('NotesScreen');

      } else if (destination.key === 'research') {
        await supabase.from('captures').update({ type: 'link', status: 'active' }).eq('id', item.id);
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('ResearchScreen');

      } else if (destination.key === 'planner') {
        await supabase.from('agenda_instances').insert({
          user_id:    userId,
          title:      item.title || item.body?.slice(0, 80) || 'Captured item',
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
          content:  `${item.title ? item.title + '\n' : ''}${item.body || ''}${item.url ? '\n' + item.url : ''}`,
          created_at: now,
        });
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('LifeAreaScreen', { areaId: selectedArea.key });

      } else if (destination.key === 'resource_tool') {
        await supabase.from('captures').update({ type: 'resource', status: 'active' }).eq('id', item.id);
        await markDoneAndClose(item.id, onProcessed);
        navigation.navigate('ResourcesToolsScreen');

      } else if (destination.key === 'task') {
        await supabase.from('tasks').insert({
          user_id:   userId,
          title:     taskTitle || item.title || item.body?.slice(0, 80),
          category:  'personal',
          priority:  2,
          completed: false,
          due_date:  taskDueDate || null,
          created_at: now,
        });
        await markDoneAndClose(item.id, onProcessed);

      } else if (destination.key === 'later') {
        const laterType = item.type === 'video' ? 'watch' : 'read';
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

  const itemColor = TYPE_MAP[item.type]?.color || c.teal;

  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, maxHeight: '88%', borderTopWidth: 1, borderColor: itemColor + '44' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />

            {/* Item preview */}
            <View style={{ backgroundColor: c.bg0, borderRadius: r.lg, padding: s.md, marginBottom: s.lg, borderLeftWidth: 3, borderLeftColor: itemColor }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: 4 }}>
                <Ionicons name={TYPE_MAP[item.type]?.icon || 'document-text-outline'} size={14} color={itemColor} />
                <Text style={{ fontSize: 10, color: itemColor, fontWeight: '800', textTransform: 'uppercase' }}>{item.type}</Text>
              </View>
              <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }} numberOfLines={2}>
                {item.title || item.body?.slice(0, 100)}
              </Text>
              {item.url && <Text style={{ fontSize: 11, color: c.teal, marginTop: 3 }} numberOfLines={1}>{item.url}</Text>}
            </View>

            {/* Steps */}
            {step === 'choose' && (
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

// ─── Capture card ─────────────────────────────────────────────────────────────
function CaptureCard({ item, onProcess, onDone, c, t, s, r }) {
  const tp    = TYPE_MAP[item.type] || TYPE_MAP.note;
  const color = tp.color;

  return (
    <TouchableOpacity onPress={() => onProcess(item)} activeOpacity={0.85}
      style={{ backgroundColor: c.bg1, borderRadius: r.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border, overflow: 'hidden', flexDirection: 'row' }}>
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
          <Text style={{ fontSize: t.xs, color: color, marginTop: 2 }} numberOfLines={1}>{item.url}</Text>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: s.sm, paddingTop: s.sm, borderTopWidth: 0.5, borderTopColor: c.border }}>
          <Ionicons name="arrow-forward-circle-outline" size={13} color={color} />
          <Text style={{ fontSize: 11, color, fontWeight: '600' }}>Tap to process → send it where it belongs</Text>
        </View>
      </View>

      {/* Done button */}
      <TouchableOpacity onPress={() => onDone(item)}
        style={{ justifyContent: 'center', paddingHorizontal: s.sm, backgroundColor: c.teal + '12' }}>
        <Ionicons name="checkmark" size={18} color={c.teal} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Quick Capture Modal ──────────────────────────────────────────────────────
function QuickCaptureModal({ visible, userId, onSaved, onClose, c, t, s, r }) {
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
  const [captures,   setCaptures]   = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [showAdd,    setShowAdd]    = useState(false);
  const [processing, setProcessing] = useState(null); // item being processed
  const [view,       setView]       = useState('inbox'); // inbox | later | done

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
      let query = supabase.from('captures').select('*').eq('user_id', uid)
        .order('created_at', { ascending: false }).limit(80);

      if (view === 'inbox') query = query.eq('status', 'inbox').is('save_for_later', null);
      else if (view === 'later') query = query.eq('status', 'inbox').not('save_for_later', 'is', null);
      else query = query.eq('status', 'done').limit(30);

      const [capRes, projRes] = await Promise.all([
        query,
        supabase.from('projects').select('id,title,emoji,color,objective').eq('user_id', uid).eq('status', 'active').limit(10),
      ]);
      if (capRes.data)  setCaptures(capRes.data);
      if (projRes.data) setProjects(projRes.data);
    } catch (e) { console.warn('CaptureInbox', e); }
    setLoading(false);
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
          <TouchableOpacity onPress={() => setShowAdd(true)}
            style={{ backgroundColor: c.teal, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* View tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, paddingBottom: s.sm, gap: s.sm }}>
          {[
            { key: 'inbox', label: '📥 To Process' },
            { key: 'later', label: '🔖 For Later' },
            { key: 'done',  label: '✅ Done' },
          ].map(tab => (
            <TouchableOpacity key={tab.key} onPress={() => setView(tab.key)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: r.md, alignItems: 'center', backgroundColor: view === tab.key ? c.teal : c.bg0, borderWidth: 0.5, borderColor: view === tab.key ? c.teal : c.border }}>
              <Text style={{ fontSize: 11, fontWeight: t.bold, color: view === tab.key ? '#fff' : c.text3 }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Type filter */}
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
      </View>

      {/* List */}
      {loading ? <ActivityIndicator color={c.teal} style={{ marginTop: 40 }} /> : (
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
          <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}>
            {view === 'inbox' && (
              <View style={{ backgroundColor: c.teal + '12', borderRadius: r.md, padding: s.md, marginBottom: s.md, flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
                <Ionicons name="information-circle-outline" size={16} color={c.teal} />
                <Text style={{ fontSize: t.xs, color: c.teal, flex: 1, lineHeight: 17 }}>
                  Tap a card to process it — send it to a project, note, idea garden, planner, life area, task list, or save for later.
                </Text>
              </View>
            )}
            {filtered.map(item => (
              <CaptureCard key={item.id} item={item}
                onProcess={(item) => setProcessing(item)}
                onDone={markDone}
                c={c} t={t} s={s} r={r} />
            ))}
          </ScrollView>
        )
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
          c={c} t={t} s={s} r={r} />
      )}
    </View>
  );
}
