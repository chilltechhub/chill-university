// src/components/PhoneCalendar.js
// The Planner's side of src/api/phoneCalendar.js:
//   <PhoneCalendarSheet>   Planner → ⋯ → Phone calendar: connect, pick
//                          which calendars show, copy plans out
//   <PhoneEventsList>      the day's phone events, read-only, under Due

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  phoneCalendarSupported, getPhoneCalendarSettings, setPhoneCalendarSettings, connectPhoneCalendar,
  disconnectPhoneCalendar, listPhoneCalendars, getPhoneEvents, openPhoneEvent, syncPlansToPhone,
  stopCopyingPlans, onPhoneCalendarChange,
} from '../api/phoneCalendar';
import { showQuickToast } from './QuickToast';

const fmt12 = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export function PhoneCalendarSheet({ visible, onClose, userId, c, t, s, r }) {
  const [settings, setSettings] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const supported = phoneCalendarSupported();

  const load = useCallback(async () => {
    const st = await getPhoneCalendarSettings();
    setSettings(st);
    setCalendars(st.connected ? await listPhoneCalendars() : []);
  }, []);
  useEffect(() => { if (visible) { setNote(null); load(); } }, [visible, load]);

  const connect = async () => {
    setBusy(true);
    const res = await connectPhoneCalendar();
    if (res === 'denied') setNote('No access yet. Allow Calendars for Deskartes in your phone\'s Settings, then try again.');
    else if (res === 'unsupported') setNote('This phone has no calendar the app can reach.');
    await load();
    setBusy(false);
  };

  const shown = (id) => !settings?.calendarIds || settings.calendarIds.includes(id);
  const toggleCalendar = async (id) => {
    const current = settings.calendarIds || calendars.map(cl => cl.id);
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    setSettings(await setPhoneCalendarSettings({ calendarIds: next }));
  };

  const toggleCopy = async (on) => {
    setBusy(true);
    try {
      if (on) {
        await setPhoneCalendarSettings({ copyPlans: true });
        const res = await syncPlansToPhone(userId);
        showQuickToast(res.added ? `Added ${res.added} plan${res.added === 1 ? '' : 's'} to your phone calendar.` : 'Your plans will show in your phone calendar.');
      } else {
        await stopCopyingPlans();
        showQuickToast('Stopped. The Deskartes calendar was removed from your phone.');
      }
    } catch (e) {
      console.warn('[PhoneCalendarSheet] copy', e?.message);
      setNote("Couldn't reach your calendar. Try again.");
    }
    await load();
    setBusy(false);
  };

  const row = { flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: 10 };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: s.lg, paddingBottom: s.xxl, maxHeight: '85%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.sm }}>
            <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>Phone calendar</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.teal }}>Done</Text>
            </TouchableOpacity>
          </View>

          {!supported ? (
            <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>
              This works in the <Text style={{ fontWeight: t.bold, color: c.text1 }}>phone app</Text>: your Apple or Google calendar events show in your Planner, and your plans can show in your calendar.
            </Text>
          ) : !settings ? <ActivityIndicator color={c.teal} /> : !settings.connected ? (
            <View style={{ gap: s.md }}>
              <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>
                See your <Text style={{ fontWeight: t.bold, color: c.text1 }}>calendar events</Text> in your Planner. Any account on this phone works: Apple, Google, Outlook. Nothing leaves your phone.
              </Text>
              <TouchableOpacity onPress={connect} disabled={busy} accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: r.md, backgroundColor: c.teal }}>
                {busy ? <ActivityIndicator color={c.onFill} /> : <Ionicons name="calendar-outline" size={17} color={c.onFill} />}
                <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.onFill }}>Connect my calendar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView>
              <Text style={{ fontSize: 12, fontWeight: t.bold, color: c.text3, marginBottom: 4 }}>SHOW IN MY PLANNER</Text>
              {calendars.length === 0 && <Text style={{ fontSize: t.sm, color: c.text3, paddingVertical: 8 }}>No calendars found on this phone.</Text>}
              {calendars.map(cl => (
                <View key={cl.id} style={row}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: cl.color || c.text3 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, color: c.text1, fontWeight: '600' }}>{cl.title}</Text>
                    {!!cl.account && <Text style={{ fontSize: 12, color: c.text3 }}>{cl.account}</Text>}
                  </View>
                  <Switch value={shown(cl.id)} onValueChange={() => toggleCalendar(cl.id)}
                    accessibilityLabel={`Show ${cl.title} in my Planner`}
                    trackColor={{ false: c.borderStrong, true: c.teal + '88' }} thumbColor={shown(cl.id) ? c.teal : c.text3} />
                </View>
              ))}

              <View style={[row, { marginTop: s.md, borderTopWidth: 0.5, borderTopColor: c.border, paddingTop: s.md }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, color: c.text1, fontWeight: t.bold }}>Add my plans to my calendar</Text>
                  <Text style={{ fontSize: 12, color: c.text3, lineHeight: 17 }}>The next two weeks, in a calendar named "Deskartes". Kept up to date when you open the Planner.</Text>
                </View>
                {busy ? <ActivityIndicator color={c.teal} /> : (
                  <Switch value={!!settings.copyPlans} onValueChange={toggleCopy} accessibilityLabel="Add my plans to my phone calendar"
                    trackColor={{ false: c.borderStrong, true: c.teal + '88' }} thumbColor={settings.copyPlans ? c.teal : c.text3} />
                )}
              </View>

              <TouchableOpacity onPress={async () => { if (settings.copyPlans) await stopCopyingPlans(); await disconnectPhoneCalendar(); await load(); }}
                accessibilityRole="button" style={{ marginTop: s.md, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: t.sm, color: c.text3 }}><Text style={{ fontWeight: t.bold }}>Disconnect</Text> (your phone calendar isn't changed)</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
          {!!note && <Text style={{ fontSize: 12, color: c.error, marginTop: s.sm }}>{note}</Text>}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function PhoneEventsList({ date, c, t, s, r }) {
  const [events, setEvents] = useState([]);
  const load = useCallback(() => {
    if (!phoneCalendarSupported()) return;
    getPhoneEvents(date, date).then(setEvents).catch(() => setEvents([]));
  }, [date]);
  useEffect(() => { load(); return onPhoneCalendarChange(load); }, [load]);
  if (!events.length) return null;
  return (
    <View style={{ marginHorizontal: s.lg, marginBottom: s.md }} accessibilityLabel={`${events.length} event${events.length === 1 ? '' : 's'} from your phone calendar`}>
      <Text style={{ fontSize: 12, fontWeight: t.bold, color: c.text3, marginBottom: 6 }}>FROM YOUR CALENDAR</Text>
      {events.map(ev => (
        <TouchableOpacity key={ev.id} onPress={() => openPhoneEvent(ev.eventId)} accessibilityRole="button"
          accessibilityLabel={`${ev.title}, ${ev.allDay ? 'all day' : fmt12(ev.start_time)}. Opens in your calendar.`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.md, marginBottom: 6, borderRadius: r.md,
            backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: ev.color || c.text3 }}>
          <Text style={{ width: 68, fontSize: 12, color: c.text2, fontWeight: '600' }}>{ev.allDay ? 'All day' : fmt12(ev.start_time)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.sm, color: c.text1 }} numberOfLines={1}>{ev.title}</Text>
            {!!ev.calendar && <Text style={{ fontSize: 11, color: c.text3 }} numberOfLines={1}>{ev.calendar}</Text>}
          </View>
          <Ionicons name="open-outline" size={14} color={c.text3} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
