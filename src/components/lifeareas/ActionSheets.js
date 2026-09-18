// src/components/lifeareas/ActionSheets.js
//
// The two actions that open something before they count:
//   ReadSheet  — the one-minute read; "Done" logs it.
//   TimerSheet — a countdown for timed actions ("Sit still for one minute").
//                It runs right here rather than in Work Mode, which is
//                feature-gated: a kid's one-minute breathing exercise
//                shouldn't land on an unlock screen. Finishing logs it.

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { FONTS } from '../../theme';
import { INK, tierLabel, tierColor } from './actionUi';

function Sheet({ visible, onClose, children, c, r }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36, maxHeight: '85%' }}>
          <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 12 }} />
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close"
            style={{ position: 'absolute', right: 14, top: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={22} color={c.text3} />
          </TouchableOpacity>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function ReadSheet({ action, color, band, onClose, onDone }) {
  const { colors: c, typography: t, radius: r } = useTheme();
  const [busy, setBusy] = useState(false);
  if (!action) return null;
  const accent = tierColor(action.tier, c, color);
  return (
    <Sheet visible={!!action} onClose={onClose} c={c} r={r}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: accent, marginRight: 44 }}>
          {tierLabel(action.tier, band)}
        </Text>
        <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginTop: 6, marginRight: 44, lineHeight: 26 }}>{action.title}</Text>
        <Text style={{ fontSize: t.md, color: c.text2, lineHeight: 24, marginTop: 14 }}>{action.body}</Text>
      </ScrollView>
      <TouchableOpacity
        disabled={busy}
        onPress={async () => { setBusy(true); try { await onDone(action); } finally { setBusy(false); onClose(); } }}
        accessibilityRole="button" accessibilityLabel={band === 'kid' ? 'I read it' : 'Done, I read it'}
        style={{ marginTop: 20, height: 52, borderRadius: r.lg, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, opacity: busy ? 0.6 : 1 }}>
        <Ionicons name="checkmark" size={18} color={INK} />
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: INK }}>{band === 'kid' ? 'I read it' : 'Done — I read it'}</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

const pad = n => String(n).padStart(2, '0');

export function TimerSheet({ action, color, onClose, onDone }) {
  const { colors: c, typography: t, radius: r } = useTheme();
  const minutes = Math.max(1, Number(action?.payload?.minutes) || 5);
  const [left, setLeft] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const tick = useRef(null);

  // A new action opens a fresh timer.
  useEffect(() => {
    setLeft(minutes * 60); setRunning(false); setFinished(false);
  }, [action?.key, minutes]);

  useEffect(() => {
    if (!running) return undefined;
    tick.current = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick.current);
  }, [running]);

  useEffect(() => {
    if (running && left === 0) {
      setRunning(false);
      setFinished(true);
      onDone(action, { metrics: { minutes } });
    }
  }, [left, running]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!action) return null;
  const close = () => { setRunning(false); onClose(); };

  return (
    <Sheet visible={!!action} onClose={close} c={c} r={r}>
      <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginRight: 44, lineHeight: 24 }}>{action.title}</Text>
      {!!action.why && <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 6, lineHeight: 20 }}>{action.why}</Text>}

      <Text accessibilityLiveRegion="polite"
        style={{ fontFamily: FONTS.display, fontSize: 72, color: finished ? c.teal : c.text1, textAlign: 'center', marginVertical: 22, fontVariant: ['tabular-nums'] }}>
        {finished ? 'Done' : `${pad(Math.floor(left / 60))}:${pad(left % 60)}`}
      </Text>

      {finished ? (
        <TouchableOpacity onPress={close} accessibilityRole="button" accessibilityLabel="Logged. Close the timer"
          style={{ height: 52, borderRadius: r.lg, backgroundColor: c.teal, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: t.md, fontWeight: t.bold, color: INK }}>Logged — nice work</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => setRunning(v => !v)} accessibilityRole="button" accessibilityLabel={running ? 'Pause the timer' : 'Start the timer'}
            style={{ flex: 2, height: 52, borderRadius: r.lg, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <Ionicons name={running ? 'pause' : 'play'} size={18} color={INK} />
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: INK }}>{running ? 'Pause' : left < minutes * 60 ? 'Keep going' : 'Start'}</Text>
          </TouchableOpacity>
          {left < minutes * 60 && (
            <TouchableOpacity
              onPress={() => { setRunning(false); setFinished(true); onDone(action, { metrics: { minutes: Math.round((minutes * 60 - left) / 60) || 1 } }); }}
              accessibilityRole="button" accessibilityLabel="Finish now and log it"
              style={{ flex: 1, height: 52, borderRadius: r.lg, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text2 }}>Finish now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Sheet>
  );
}
