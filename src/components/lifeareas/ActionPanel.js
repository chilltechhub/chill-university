// src/components/lifeareas/ActionPanel.js
//
// The top of every Life Area sub-section: one Today's action, then a deck of
// a 2-minute win, a one-minute read and a habit. Tapping does the thing and
// logs it — nobody is asked "what did you do?".
//
// `aa` is the useAreaActions() result, owned by the screen so the screen's
// drawer can share the same resources and history.

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { FONTS } from '../../theme';
import { ReadSheet, TimerSheet } from './ActionSheets';
import { INK, TIER_ICONS, tierLabel, tierColor, buttonLabel, buttonIcon } from './actionUi';

function Label({ children, c, right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', color: c.text3 }}>{children}</Text>
      {right}
    </View>
  );
}

export default function ActionPanel({ aa, color, onEdit }) {
  const { colors: c, typography: t, radius: r } = useTheme();
  const [reading, setReading] = useState(null);
  const [timing, setTiming] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [note, setNote] = useState(null);
  const noteTimer = useRef(null);
  useEffect(() => () => clearTimeout(noteTimer.current), []);

  const say = (text, tone = 'ok') => {
    clearTimeout(noteTimer.current);
    setNote({ text, tone });
    noteTimer.current = setTimeout(() => setNote(null), 4000);
  };

  // What a tap means. Reads and timers open their sheet; everything else
  // happens at once and logs.
  const act = async (action) => {
    if (action.handler === 'read') return setReading(action);
    if (action.handler === 'timer') return setTiming(action);
    if (action.tier === 'habit' && aa.isDone(action.key)) return say('Already logged today.');
    setBusyKey(action.key);
    const res = await aa.run(action);
    setBusyKey(null);
    if (res.ok) say(res.message || (action.tier === 'habit' ? 'Logged. Keep it going.' : 'Done — logged for you.'));
    else say(res.message, 'warn');
  };

  const today = aa.today;
  const todayDone = today && aa.isDone(today.key);

  return (
    <View>
      <Label c={c} right={
        <TouchableOpacity onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit your actions"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: r.full, borderWidth: 1, borderColor: c.border, minHeight: 32 }}>
          <Ionicons name="create-outline" size={14} color={c.text2} />
          <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text2 }}>Make it yours</Text>
        </TouchableOpacity>
      }>
        {aa.band === 'kid' ? 'Do this today' : 'Today’s action'}
      </Label>

      {today ? (
        <View style={{ backgroundColor: todayDone ? c.teal + '18' : color + '1a', borderWidth: 1, borderColor: todayDone ? c.teal + '66' : color + '66', borderRadius: r.xl, padding: 18 }}>
          {todayDone && (
            <Text style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: c.teal, marginBottom: 6 }}>Done today</Text>
          )}
          <Text style={{ fontSize: aa.band === 'kid' ? t.xl + 2 : t.xl, fontWeight: t.bold, color: c.text1, lineHeight: aa.band === 'kid' ? 28 : 26 }}>{today.title}</Text>
          {!!today.why && <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginTop: 8 }}>{today.why}</Text>}

          {todayDone ? (
            <TouchableOpacity onPress={aa.another} accessibilityRole="button" accessibilityLabel="Show me another action"
              style={{ marginTop: 14, minHeight: 44, borderRadius: r.lg, borderWidth: 1, borderColor: c.teal + '88', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
              <Ionicons name="arrow-forward" size={16} color={c.teal} />
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.teal }}>Want another?</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => act(today)} disabled={busyKey === today.key} accessibilityRole="button"
                accessibilityLabel={`${buttonLabel(today, aa.band)}: ${today.title}`}
                style={{ marginTop: 16, minHeight: aa.band === 'kid' ? 58 : 52, borderRadius: r.lg, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14 }}>
                {busyKey === today.key
                  ? <ActivityIndicator color={INK} />
                  : <>
                      <Ionicons name={buttonIcon(today)} size={18} color={INK} />
                      <Text style={{ fontSize: aa.band === 'kid' ? t.lg : t.md, fontWeight: t.bold, color: INK }}>{buttonLabel(today, aa.band)}</Text>
                    </>}
              </TouchableOpacity>
              <TouchableOpacity onPress={aa.another} accessibilityRole="button" accessibilityLabel="Not this one — show another action" style={{ alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 12, marginTop: 4 }}>
                <Text style={{ fontSize: t.xs, color: c.text3, fontWeight: t.semibold }}>Not this one — show another</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <Text style={{ fontSize: t.sm, color: c.text3 }}>Nothing here for today — add your own with “Make it yours”.</Text>
      )}

      {aa.deck.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Label c={c}>{aa.band === 'kid' ? 'Or try one of these' : 'Or pick one'}</Label>
          <View style={{ gap: 10 }}>
            {aa.deck.map(({ slot, action }) => {
              const done = aa.isDone(action.key);
              const accent = tierColor(action.tier, c, color);
              return (
                <TouchableOpacity key={action.key} onPress={() => act(action)} disabled={busyKey === action.key}
                  accessibilityRole="button" accessibilityLabel={`${tierLabel(action.tier, aa.band)}: ${action.title}${done ? ', done today' : ''}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, padding: 12, borderRadius: r.lg,
                    backgroundColor: done ? c.teal + '14' : c.bg1, borderWidth: 1, borderColor: done ? c.teal + '66' : c.border }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? c.teal : accent + '22' }}>
                    <Ionicons name={done ? 'checkmark' : TIER_ICONS[slot]} size={done ? 20 : 17} color={done ? INK : accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: done ? c.teal : accent }}>
                      {done ? (slot === 'habit' ? 'Logged today' : 'Done') : tierLabel(action.tier, aa.band)}
                    </Text>
                    <Text style={{ fontSize: aa.band === 'kid' ? t.md + 1 : t.md, fontWeight: t.semibold, color: c.text1, marginTop: 2, lineHeight: 20 }}>{action.title}</Text>
                  </View>
                  {busyKey === action.key
                    ? <ActivityIndicator color={accent} />
                    : slot === 'habit'
                      ? <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: done ? c.teal : c.border, backgroundColor: done ? c.teal : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                          {done && <Ionicons name="checkmark" size={16} color={INK} />}
                        </View>
                      : <Ionicons name="chevron-forward" size={18} color={c.text4} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {note && (
        <View accessibilityLiveRegion="polite"
          style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: r.md,
            backgroundColor: note.tone === 'warn' ? c.gold + '1f' : c.teal + '1a' }}>
          <Ionicons name={note.tone === 'warn' ? 'information-circle' : 'checkmark-circle'} size={18} color={note.tone === 'warn' ? c.gold : c.teal} />
          <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{note.text}</Text>
        </View>
      )}

      <ReadSheet action={reading} color={color} band={aa.band} onClose={() => setReading(null)}
        onDone={async (a) => { await aa.complete(a); say('Nice — that’s logged.'); }} />
      <TimerSheet action={timing} color={color} onClose={() => setTiming(null)}
        onDone={async (a, opts) => { await aa.complete(a, opts); }} />
    </View>
  );
}
