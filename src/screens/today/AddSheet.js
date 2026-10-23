// src/screens/today/AddSheet.js
// Today's + Add (docs/shake-up-plan-2026-10-21.md §2.4, §3.2): every way
// something gets onto your day, in one sheet, because the FAB steps aside
// on Today. Plan something (the Planner's Add/Edit sheet), a reminder, a
// note, and from ideas; then "Bring stuff in": Fill with AI, Plan from a
// link and the Capture Inbox.
//
// A guest plans on the phone; the rest saves to an account, so those rows
// ask to sign in instead.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccess } from '../../../context/AccessContext';
import ReminderComposer from '../../components/ReminderComposer';
import { QuickNoteModal } from '../../components/FloatingActionButton';
import { QuickCaptureModal } from '../CaptureInbox';
import { showQuickToast } from '../../components/QuickToast';
import { openTarget } from '../../logic/openTarget';
import { GuestSignInSheet } from './PlannerOptions';

export default function AddSheet({ visible, onClose, guest, userId, onPlan, onIdeas, navigation, c, t, s, r }) {
  const { signalAction } = useAccess();
  const [open, setOpen] = useState(null); // 'reminder' | 'note' | 'capture' | 'link' | 'signin'

  const pick = (key, fn) => () => {
    onClose();
    if (guest && key !== 'plan') { setOpen('signin'); return; }
    if (fn) fn(); else setOpen(key);
  };
  const row = (key, icon, label, hint, fn, color = c.teal) => (
    <TouchableOpacity key={key} onPress={pick(key, fn)} accessibilityRole="button" accessibilityLabel={`${label}. ${hint}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.xl, paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '1f', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{label}</Text>
        <Text style={{ fontSize: t.xs, color: c.text3 }}>{guest && key !== 'plan' ? 'With an account' : hint}</Text>
      </View>
      {guest && key !== 'plan' && <Ionicons name="lock-closed-outline" size={14} color={c.text3} />}
    </TouchableOpacity>
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
          <Pressable onPress={() => {}} style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: s.sm, paddingBottom: s.xxl }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.sm }} />
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, paddingHorizontal: s.xl, marginBottom: s.xs }}>Add to your day</Text>
            {row('plan', 'add-circle-outline', 'Plan something', 'A task, habit or block of time', onPlan)}
            {row('reminder', 'notifications-outline', 'Reminder', 'A time to be nudged', null, c.gold)}
            {row('note', 'document-text-outline', 'Note', 'Straight to your Knowledge Vault', null)}
            {row('ideas', 'grid-outline', 'From ideas', 'Habits and routines to add', onIdeas)}
            <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text3, paddingHorizontal: s.xl, marginTop: s.sm, letterSpacing: 0.6 }}>BRING STUFF IN</Text>
            {row('ai', 'sparkles-outline', 'Fill with AI', 'Paste a plan from any chatbot', () => navigation.navigate('AIBridgeScreen', { target: 'planner' }), c.purple || c.teal)}
            {row('link', 'link-outline', 'Plan from a link', 'A video or page, turned into a plan', null)}
            {row('capture', 'file-tray-full-outline', 'Capture Inbox', 'Save it now, sort it later', null)}
          </Pressable>
        </Pressable>
      </Modal>

      <ReminderComposer visible={open === 'reminder'} onClose={() => setOpen(null)} userId={userId}
        onSaved={() => { setOpen(null); showQuickToast('Reminder set. It is on your plan.'); }} />
      <QuickNoteModal visible={open === 'note'} userId={userId}
        onSaved={() => { setOpen(null); showQuickToast('Note saved to your Knowledge Vault.'); }}
        onClose={() => setOpen(null)} c={c} t={t} s={s} r={r} />
      <QuickCaptureModal visible={open === 'capture'} userId={userId}
        onSaved={() => { setOpen(null); signalAction('inbox-captured'); showQuickToast('Captured. It is in your inbox.'); }}
        onUse={(dest, row) => {
          setOpen(null);
          signalAction('inbox-captured');
          openTarget(navigation, { kind: 'inbox', params: { openCapture: row.id, ...(dest === 'plan_ai' ? { plan: true } : { dest }), at: Date.now() } });
        }}
        onClose={() => setOpen(null)} c={c} t={t} s={s} r={r} />
      <QuickCaptureModal visible={open === 'link'} mode="plan" userId={userId}
        onSaved={(saved) => {
          setOpen(null);
          signalAction('inbox-captured');
          if (saved?.id) openTarget(navigation, { kind: 'inbox', params: { openCapture: saved.id, plan: true, at: Date.now() } });
        }}
        onClose={() => setOpen(null)} c={c} t={t} s={s} r={r} />
      <GuestSignInSheet visible={open === 'signin'} onClose={() => setOpen(null)}
        icon="person-add-outline" title="Save it to an account"
        body="Notes, reminders and captures keep across devices. Plans stay on this phone until you sign in."
        c={c} t={t} s={s} />
    </>
  );
}
