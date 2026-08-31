// src/components/FloatingActionButton.js
// Global floating action button — one tap away from the most common actions,
// from anywhere in the app.
//
// Everything that *creates* something (note, reminder, project, capture) is
// a self-contained popup, not a navigation. This component is rendered as a
// sibling of the root navigator, two levels above the Library tab's own
// nested stack — calling navigation.navigate('NotesScreen') (etc.) from out
// here is fragile: it only resolves if that nested stack has already been
// mounted at least once, and throws "action not handled by any navigator"
// otherwise. Popups sidestep that entirely, and they're quicker to use too
// — no leaving the screen you're on just to jot something down.
//
// Profile / Settings / Help are real navigations because they're root-level
// screens (direct siblings of MainTabs in the root stack), so they resolve
// correctly no matter what tab or nested screen is currently active.
//
// Design decisions (why icon-only vs icon+text):
//   - The FAB itself is icon-only (+/×). It's the single anchor control the
//     whole screen already trains the eye on — a label would be redundant.
//   - Every speed-dial action is icon + text and shares the same row
//     treatment. There are 9 destinations and several share a similar
//     silhouette (calendar vs reminder-bell vs note), so a label removes
//     any guessing.
//
// A small standalone circle beside the main FAB — not one of the list
// actions — opens a corner picker that repositions the FAB itself, live,
// via context/FabPositionContext.js, not useSetting()/AsyncStorage
// directly. useSetting only re-reads on screen focus, and the FAB isn't a
// Screen, so it would never see a change made in Settings without a full
// app reload. The shared context re-renders both the FAB and Settings the
// instant either one changes it.

import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Platform, Modal,
  TextInput, KeyboardAvoidingView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { useFabPosition } from '../../context/FabPositionContext';
import { supabase } from '../api/supabaseClient';
import { addCapture } from '../api/captureService';
import CalendarModal from './CalendarModal';
import { QuickCaptureModal } from '../screens/CaptureInbox';
import LoginScreen from '../screens/LoginScreen';

// Root-stack screens that replace MainTabs entirely (no bottom tab bar showing).
const NO_TABBAR_ROUTES = new Set(['Profile', 'Settings', 'Play', 'PlayGame', 'Leaderboard']);

// Ordered top-to-bottom in the speed dial; the LAST entry ends up closest to
// the FAB (bottom), so the most-reached-for actions go last.
const ACTIONS = [
  { key: 'profile',  label: 'Profile',        icon: 'person-circle-outline',    colorKey: 'gold' },
  { key: 'help',     label: 'Help',           icon: 'help-circle-outline',      colorKey: 'purple' },
  { key: 'settings', label: 'Settings',       icon: 'settings-outline',         colorKey: 'text3' },
  { key: 'project',  label: 'New Project',    icon: 'hammer-outline',           colorKey: 'gold' },
  { key: 'calendar', label: 'Calendar',       icon: 'calendar-outline',         colorKey: 'teal' },
  { key: 'reminder', label: 'New Reminder',   icon: 'notifications-outline',    color: '#c9a84c' },
  { key: 'note',     label: 'New Note',       icon: 'document-text-outline',    color: '#2bb5a0' },
  { key: 'inbox',    label: 'Capture Inbox',  icon: 'file-tray-full-outline',   color: '#3a7bd5' },
];

// 2x2 grid, laid out the way the corners actually sit on screen.
const POSITION_OPTIONS = [
  { key: 'top-left',     glyph: '↖', label: 'Top Left' },
  { key: 'top-right',    glyph: '↗', label: 'Top Right' },
  { key: 'bottom-left',  glyph: '↙', label: 'Bottom Left' },
  { key: 'bottom-right', glyph: '↘', label: 'Bottom Right' },
];

const FAB_SIZE     = 56;
const MOVE_BTN_SIZE = 32;
const TAB_BAR_H = Platform.OS === 'ios' ? 66 : 52;
// Rough visible height of TopBar.js — it isn't a fixed constant there
// (padding + content), so this is a comfortable overestimate rather than a
// pixel-exact measurement. Only matters for the 'top' FAB position.
const TOPBAR_H = 60;

// ─── Quick Note popup ───────────────────────────────────────────────────────
function QuickNoteModal({ visible, userId, onSaved, onClose, c, t, s, r }) {
  const [body,   setBody]   = useState('');
  const [tags,   setTags]   = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setBody(''); setTags(''); };
  const close = () => { reset(); onClose(); };

  const save = async () => {
    if (!body.trim() || !userId) return;
    setSaving(true);
    try {
      const tagList = tags.split(',').map(tg => tg.trim().toLowerCase()).filter(Boolean);
      const saved = await addCapture(userId, {
        type: 'note',
        title: body.length > 80 ? body.slice(0, 77) + '...' : body,
        body: body.trim(),
        tags: tagList,
        source: 'manual',
      });
      onSaved(saved);
      reset();
    } catch (e) {
      Alert.alert('Error', 'Could not save. Try again.');
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, borderTopWidth: 0.5, borderColor: c.border }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.lg }}>
            <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1 }}>📝 New Note</Text>
            <TouchableOpacity onPress={close}>
              <Ionicons name="close" size={22} color={c.text3} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: '#2bb5a066', minHeight: 90, textAlignVertical: 'top', marginBottom: s.sm }}
            value={body} onChangeText={setBody}
            placeholder="Write a note..." placeholderTextColor={c.text4}
            multiline autoFocus
          />
          <TextInput
            style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.lg }}
            value={tags} onChangeText={setTags}
            placeholder="Tags: money, ideas, health..." placeholderTextColor={c.text4} autoCapitalize="none"
          />
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <TouchableOpacity onPress={close} style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ color: c.text3 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={!body.trim() || saving}
              style={{ flex: 2, backgroundColor: '#2bb5a0', borderRadius: r.md, padding: s.md, alignItems: 'center', opacity: (!body.trim() || saving) ? 0.5 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: t.bold }}>Save Note</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Quick Project popup ────────────────────────────────────────────────────
// A minimal version of the Workshop's own "New Build" sheet — just enough to
// start a project. Icon, color, and type can be set from the Workshop later.
function QuickProjectModal({ visible, userId, onCreated, onClose, c, t, s, r }) {
  const [title,     setTitle]     = useState('');
  const [objective, setObjective] = useState('');
  const [saving,    setSaving]    = useState(false);

  const reset = () => { setTitle(''); setObjective(''); };
  const close = () => { reset(); onClose(); };

  const start = async () => {
    if (!title.trim() || !userId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('projects').insert({
        user_id:     userId,
        title:       title.trim(),
        objective:   objective.trim() || null,
        emoji:       '🏗️',
        color:       c.gold,
        cover_color: c.gold,
        banner_emoji:'🏗️',
        category:    'general',
        status:      'active',
        sort_order:  0,
      }).select().single();
      if (error) throw error;

      await supabase.from('project_milestones').insert({
        user_id: userId, project_id: data.id,
        title: '🏗️ Build started', type: 'project_created',
        date: new Date().toISOString().split('T')[0],
      });

      onCreated(data);
      reset();
    } catch (e) {
      Alert.alert('Error', 'Could not start this project. Try again.');
    }
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48, borderTopWidth: 0.5, borderColor: c.border }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.lg }}>
            <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1 }}>🏗️ New Project</Text>
            <TouchableOpacity onPress={close}>
              <Ionicons name="close" size={22} color={c.text3} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.md, color: c.text1, borderWidth: 1, borderColor: c.gold + '66', marginBottom: s.sm }}
            value={title} onChangeText={setTitle}
            placeholder="Project name..." placeholderTextColor={c.text4} autoFocus
          />
          <TextInput
            style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, minHeight: 60, textAlignVertical: 'top', marginBottom: s.md }}
            value={objective} onChangeText={setObjective}
            placeholder="What are you building? (optional)" placeholderTextColor={c.text4} multiline
          />
          <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: s.lg }}>
            You can set an icon, color, and type from the Workshop once it's created.
          </Text>
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <TouchableOpacity onPress={close} style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ color: c.text3 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={start} disabled={!title.trim() || saving}
              style={{ flex: 2, backgroundColor: c.gold, borderRadius: r.md, padding: s.md, alignItems: 'center', opacity: (!title.trim() || saving) ? 0.5 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: t.bold }}>Start Building</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function FloatingActionButton({ currentScreen }) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const { user } = useUserProgress();
  const insets = useSafeAreaInsets();

  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarQuickType, setCalendarQuickType] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);

  // Shared live context — also settable from Settings → Appearance, but
  // living here means the Move circle below can relocate the FAB instantly.
  const { fabPosition, setFabPosition } = useFabPosition();
  const [vSide, hSide] = fabPosition.split('-'); // 'top'|'bottom', 'left'|'right'

  const hasTabBar = !NO_TABBAR_ROUTES.has(currentScreen);
  const fabBottom = (hasTabBar ? TAB_BAR_H : 0) + insets.bottom + 16;
  const fabTop = TOPBAR_H + 16; // SafeAreaView already reserves insets.top

  const sideStyle = hSide === 'left' ? { left: 20 } : { right: 20 };
  const fabVStyle = vSide === 'top' ? { top: fabTop } : { bottom: fabBottom };
  const dialVStyle = vSide === 'top'
    ? { top: fabTop + FAB_SIZE + 14 }
    : { bottom: fabBottom + FAB_SIZE + 14 };
  const dialAlign = hSide === 'left' ? 'flex-start' : 'flex-end';
  // The dial grows away from the FAB — down when the FAB is on top, up when
  // it's on the bottom — so the most-reached-for actions (end of ACTIONS)
  // should always land nearest the FAB, whichever way that is.
  const orderedActions = vSide === 'top' ? [...ACTIONS].reverse() : ACTIONS;

  // Move-button circle sits right beside the FAB, offset inward (away from
  // the screen edge) so it's never clipped, vertically centered on it.
  const moveBtnSide = hSide === 'left'
    ? { left: 20 + FAB_SIZE + 10 }
    : { right: 20 + FAB_SIZE + 10 };
  const moveBtnV = vSide === 'top'
    ? { top: fabTop + (FAB_SIZE - MOVE_BTN_SIZE) / 2 }
    : { bottom: fabBottom + (FAB_SIZE - MOVE_BTN_SIZE) / 2 };

  const setExpanded = (next) => {
    setOpen(next);
    Animated.spring(anim, { toValue: next ? 1 : 0, useNativeDriver: true, friction: 7, tension: 60 }).start();
  };
  const toggle = () => { setPickerOpen(false); setExpanded(!open); };
  const close  = () => { if (open) setExpanded(false); setPickerOpen(false); };
  const togglePicker = () => {
    if (open) setExpanded(false); // don't show the list and the picker at once
    setPickerOpen(p => !p);
  };

  const needsSignIn = () => {
    if (user) return false;
    setShowLogin(true);
    return true;
  };

  const run = (action) => {
    close();
    switch (action.key) {
      case 'profile':
        user ? navigation.navigate('Profile') : setShowLogin(true);
        break;
      case 'inbox':
        if (!needsSignIn()) setCaptureOpen(true);
        break;
      case 'note':
        if (!needsSignIn()) setNoteOpen(true);
        break;
      case 'reminder':
        if (!needsSignIn()) { setCalendarQuickType('reminder'); setCalendarOpen(true); }
        break;
      case 'calendar':
        if (!needsSignIn()) { setCalendarQuickType(null); setCalendarOpen(true); }
        break;
      case 'project':
        if (!needsSignIn()) setProjectOpen(true);
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'help':
        navigation.navigate('Help', { fromScreen: currentScreen });
        break;
    }
  };

  // Applies immediately — this is the same context Settings reads/writes,
  // so the FAB just re-renders at the new spot on the next frame.
  const selectPosition = (posKey) => {
    setFabPosition(posKey);
    setPickerOpen(false);
  };

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const dialOpacity = anim;
  const dialScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <>
      {/* Backdrop — dims content and closes the dial/picker on outside tap */}
      {(open || pickerOpen) && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={close}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} />
        </TouchableOpacity>
      )}

      {/* Speed-dial actions */}
      <Animated.View
        pointerEvents={open ? 'box-none' : 'none'}
        style={[
          styles.dial,
          { ...sideStyle, ...dialVStyle, alignItems: dialAlign, opacity: dialOpacity, transform: [{ scale: dialScale }] },
        ]}
      >
        {orderedActions.map(a => {
          const color = a.colorKey ? c[a.colorKey] : a.color;
          return (
            <TouchableOpacity
              key={a.key}
              onPress={() => run(a)}
              activeOpacity={0.8}
              style={[styles.dialRow, { flexDirection: hSide === 'left' ? 'row-reverse' : 'row' }]}
            >
              <View style={[styles.dialLabel, sh.sm, { backgroundColor: c.bg1, borderColor: c.border }]}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.text1 }}>{a.label}</Text>
              </View>
              <View style={[styles.dialIcon, sh.sm, { backgroundColor: c.bg1, borderColor: color }]}>
                <Ionicons name={a.icon} size={18} color={color} />
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Corner picker — opened by the small "Move" circle beside the FAB */}
      {pickerOpen && (
        <View style={[styles.picker, sh.md, sideStyle, dialVStyle, { backgroundColor: c.bg1, borderColor: c.border }]}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.text2, marginBottom: 8, textAlign: 'center' }}>
            Move to…
          </Text>
          <View style={styles.pickerGrid}>
            {POSITION_OPTIONS.map(pos => {
              const active = fabPosition === pos.key;
              return (
                <TouchableOpacity
                  key={pos.key}
                  onPress={() => selectPosition(pos.key)}
                  accessibilityLabel={`Move quick actions button to ${pos.label}`}
                  style={[
                    styles.pickerCell,
                    { borderColor: active ? c.teal : c.border, backgroundColor: active ? c.teal + '18' : c.bg0 },
                  ]}
                >
                  <Text style={{ fontSize: 16, color: active ? c.teal : c.text2 }}>{pos.glyph}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Move — small circle beside the FAB, not part of the action list.
          Hidden until the FAB is opened, same as the dial actions — fades
          and scales in with them, but stays visible while the picker itself
          is open (closing the dial to show the picker shouldn't also hide
          the very button that opened it). */}
      <Animated.View
        pointerEvents={(open || pickerOpen) ? 'auto' : 'none'}
        style={[
          styles.moveBtnWrap, moveBtnSide, moveBtnV,
          { opacity: pickerOpen ? 1 : dialOpacity, transform: [{ scale: pickerOpen ? 1 : dialScale }] },
        ]}
      >
        <TouchableOpacity
          onPress={togglePicker}
          activeOpacity={0.8}
          accessibilityLabel={pickerOpen ? 'Close move button picker' : 'Move quick actions button'}
          style={[styles.moveBtn, sh.sm, { backgroundColor: c.bg1, borderColor: pickerOpen ? c.teal : c.border }]}
        >
          <Ionicons name="move-outline" size={14} color={pickerOpen ? c.teal : c.text3} />
        </TouchableOpacity>
      </Animated.View>

      {/* Main FAB — icon only */}
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.85}
        accessibilityLabel={open ? 'Close quick actions' : 'Open quick actions'}
        style={[styles.fab, sh.lg, sideStyle, fabVStyle, { backgroundColor: c.teal }]}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="add" size={28} color="#fff" />
        </Animated.View>
      </TouchableOpacity>

      {/* Calendar / Reminder */}
      <CalendarModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        userId={user?.id}
        autoAdd={calendarQuickType === 'reminder'}
        quickType={calendarQuickType}
      />

      {/* New Note */}
      <QuickNoteModal
        visible={noteOpen}
        userId={user?.id}
        onSaved={() => { setNoteOpen(false); Alert.alert('Saved', 'Note added to your account.'); }}
        onClose={() => setNoteOpen(false)}
        c={c} t={t} s={s} r={r}
      />

      {/* New Project */}
      <QuickProjectModal
        visible={projectOpen}
        userId={user?.id}
        onCreated={() => { setProjectOpen(false); Alert.alert('Project started', 'Find it in the Workshop (Library → Projects).'); }}
        onClose={() => setProjectOpen(false)}
        c={c} t={t} s={s} r={r}
      />

      {/* Capture Inbox — quick capture, same popup the Capture Inbox screen itself uses */}
      <QuickCaptureModal
        visible={captureOpen}
        userId={user?.id}
        onSaved={() => { setCaptureOpen(false); Alert.alert('Captured', 'Added to your inbox — process it anytime from Capture Inbox.'); }}
        onClose={() => setCaptureOpen(false)}
        c={c} t={t} s={s} r={r}
      />

      {/* Sign in, for actions that need an account when logged out */}
      <Modal visible={showLogin} animationType="slide" onRequestClose={() => setShowLogin(false)}>
        <LoginScreen onSuccess={() => setShowLogin(false)} onClose={() => setShowLogin(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  dial: {
    position: 'absolute',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  dialRow: {
    alignItems: 'center', gap: 10,
    marginBottom: 12,
  },
  dialLabel: {
    borderRadius: 8, borderWidth: 0.5,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  dialIcon: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  moveBtnWrap: {
    position: 'absolute',
    zIndex: 20,
  },
  moveBtn: {
    width: MOVE_BTN_SIZE, height: MOVE_BTN_SIZE, borderRadius: MOVE_BTN_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  picker: {
    position: 'absolute',
    width: 148,
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 10,
    zIndex: 20,
  },
  pickerGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  pickerCell: {
    width: '47%', aspectRatio: 1,
    borderRadius: 8, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
});
