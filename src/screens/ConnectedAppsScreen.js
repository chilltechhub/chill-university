// src/screens/ConnectedAppsScreen.js
// Make it yours → Connected apps (docs/connections-plan-2026-10-18.md).
//
// People use different apps; Deskartes meets them there. Every app says,
// in plain words, what it READS and what it WRITES, and each can be switched
// off. Phase A goes through the phone's own hubs (share sheet, calendar,
// Reminders, files). The rest are listed as "Coming next" with a Request
// button, so the votes decide what gets built.
//
// Named "Connected apps", not "Connections": src/screens/library/connections/
// is people (network, relationships).

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import RichText from '../components/RichText';
import { Button } from '../components/ui';
import { PhoneCalendarSheet } from '../components/PhoneCalendar';
import { showQuickToast } from '../components/QuickToast';
import { useFeatureGate } from '../components/FeatureGate';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { goToScreen } from '../logic/appRoutes';
import { CONNECTORS, CONNECTOR_GROUPS } from '../data/connectorsCatalog';
import { CONNECTOR_IMPL, requestApp, loadConnectors } from '../connectors';
import { listReminderLists, getRemindersSettings, setReminderLists } from '../connectors/appleReminders';
import { exportPlanIcs, exportAllData } from '../connectors/files';


export default function ConnectedAppsScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { gatedNavigate, sheet: unlockSheet } = useFeatureGate();
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState({});
  const [busy, setBusy] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [listIds, setListIds] = useState(null);
  // Also on this device (a synced setting), so the button says Requested
  // straight away, guests included.
  const [requested, setRequested] = useSetting(SETTING_KEYS.APP_REQUESTS, []);

  // The bundled list first, then app_content's version (new apps can be
  // added there with no app update).
  const [connectors, setConnectors] = useState(CONNECTORS);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null)).catch(() => {});
    loadConnectors().then(setConnectors).catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    const next = {};
    for (const [id, impl] of Object.entries(CONNECTOR_IMPL)) {
      try { next[id] = await impl.status(); } catch { next[id] = 'off'; }
    }
    setStatus(next);
    if (next['apple-reminders'] === 'on') {
      setLists(await listReminderLists());
      setListIds((await getRemindersSettings()).listIds);
    }
  }, []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const run = async (key, fn) => {
    setBusy(key);
    try { await fn(); } finally { setBusy(null); refresh(); }
  };

  const connectReminders = () => run('apple-reminders', async () => {
    const res = await CONNECTOR_IMPL['apple-reminders'].connect();
    if (res === 'denied') showQuickToast("No access yet. Allow Reminders for Deskartes in your iPhone's Settings.");
  });
  const pullReminders = () => run('apple-reminders-pull', async () => {
    const res = await CONNECTOR_IMPL['apple-reminders'].pull(userId);
    showQuickToast(res.added ? `${res.added} reminder${res.added === 1 ? '' : 's'} in your Inbox` : 'Nothing new to bring in');
  });
  const disconnect = (id) => run(id, () => CONNECTOR_IMPL[id].disconnect());
  const toggleList = async (id) => {
    const all = lists.map(l => l.id);
    const current = listIds || all;
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    const saved = await setReminderLists(next.length === all.length ? null : next);
    setListIds(saved.listIds);
  };
  const exportIcs = () => run('files-ics', async () => {
    if (!userId) { showQuickToast('Sign in to export your plans'); return; }
    const { count, how } = await exportPlanIcs(userId);
    if (!count) showQuickToast('Nothing is planned for the next 30 days');
    else if (how === 'downloaded') showQuickToast(`Calendar file ready: ${count} item${count === 1 ? '' : 's'}`);
  });
  const exportData = () => run('files-data', exportAllData);
  const request = async (id) => {
    if (!requested.includes(id)) setRequested([...requested, id]);
    if (userId) await requestApp(userId, id);
    showQuickToast('Thanks. Most-asked apps get built first.');
  };

  // ── Pieces ────────────────────────────────────────────────────────────────
  const card = { backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md, padding: s.md };
  const Pill = ({ label, tone }) => (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: tone === 'on' ? accent.primary + '22' : c.bg2 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: tone === 'on' ? accent.primary : c.text3 }}>{label}</Text>
    </View>
  );
  const Line = ({ label, text }) => (
    <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3, lineHeight: 17 }}>
      <Text style={{ fontWeight: '800', color: c.text2 }}>{label} </Text>{text}
    </Text>
  );
  const Head = ({ children }) => (
    <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: c.text3, marginBottom: s.sm, marginTop: s.sm }}>{children}</Text>
  );

  const phoneOnly = (conn) => !conn.platforms?.includes(Platform.OS === 'web' ? 'web' : Platform.OS);

  const actionsFor = (conn) => {
    const impl = CONNECTOR_IMPL[conn.id];
    const supported = impl?.supported?.();
    if (!supported) {
      return (
        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm }}>
          {phoneOnly(conn)
            ? (conn.platforms?.length === 1 && conn.platforms[0] === 'ios' ? 'Works in the iPhone app.' : 'Works in the phone app.')
            : 'Not available here yet.'}
        </Text>
      );
    }
    const on = status[conn.id] === 'on';
    switch (conn.id) {
      case 'share-sheet':
        return <RichText style={{ fontSize: t.xs, color: c.text2, marginTop: s.sm }} boldStyle={{ color: c.text1 }}>{conn.how}</RichText>;
      case 'phone-calendar':
        return (
          <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>
            <Button label={on ? 'Settings' : 'Connect'} size="sm" fullWidth={false} variant={on ? 'secondary' : 'primary'} onPress={() => setCalendarOpen(true)} />
          </View>
        );
      case 'apple-reminders':
        return on ? (
          <View style={{ marginTop: s.sm }}>
            {lists.map(l => {
              const shown = (listIds || lists.map(x => x.id)).includes(l.id);
              return (
                <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: l.color || c.text3, marginRight: 8 }} />
                  <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{l.title}</Text>
                  <Switch value={shown} onValueChange={() => toggleList(l.id)} accessibilityLabel={`Bring in ${l.title}`} />
                </View>
              );
            })}
            <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>
              <Button label="Bring them in now" icon="download-outline" size="sm" fullWidth={false} busy={busy === 'apple-reminders-pull'} onPress={pullReminders} />
              <Button label="Disconnect" size="sm" variant="ghost" fullWidth={false} onPress={() => disconnect('apple-reminders')} />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>
            <Button label="Connect" size="sm" fullWidth={false} busy={busy === 'apple-reminders'} onPress={connectReminders} />
          </View>
        );
      case 'files':
        return (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.sm }}>
            <Button label="Import" icon="download-outline" size="sm" fullWidth={false}
              onPress={() => gatedNavigate('import-hub', () => goToScreen(navigation, 'ImportScreen'))} />
            <Button label="Calendar file" icon="calendar-outline" size="sm" variant="secondary" fullWidth={false} busy={busy === 'files-ics'} onPress={exportIcs} />
            <Button label="All my data" icon="archive-outline" size="sm" variant="ghost" fullWidth={false} busy={busy === 'files-data'} onPress={exportData} />
          </View>
        );
      default:
        return null;
    }
  };

  const statusPill = (conn) => {
    if (conn.status !== 'live') return null;
    if (!CONNECTOR_IMPL[conn.id]?.supported?.()) return <Pill label="Phone app" />;
    return status[conn.id] === 'on' ? <Pill label="On" tone="on" /> : <Pill label="Off" />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={c.text2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.xxl, fontWeight: '800', color: c.text1 }}>Connected apps</Text>
          <RichText style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }} boldStyle={{ color: c.text1 }}>
            **Bring in** what you do elsewhere. **Send out** your next step.
          </RichText>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingTop: s.sm, paddingBottom: 100 }}>
        {CONNECTOR_GROUPS.map(group => (
          <View key={group.key}>
            <Head>{group.label}</Head>
            {connectors.filter(conn => conn.group === group.key).map(conn => (
              <View key={conn.id} style={card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: accent.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={conn.icon} size={17} color={accent.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: '800', color: c.text1 }}>{conn.name}</Text>
                    {!!conn.examples && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 1 }}>{conn.examples}</Text>}
                  </View>
                  {conn.status === 'live' ? statusPill(conn) : (
                    requested.includes(conn.id)
                      ? <Pill label="Requested" tone="on" />
                      : <Button label="Request" size="sm" variant="secondary" fullWidth={false} onPress={() => request(conn.id)}
                          accessibilityLabel={`Request ${conn.name}`} />
                  )}
                </View>
                <Line label="Reads:" text={conn.reads} />
                <Line label="Writes:" text={conn.writes} />
                {conn.status === 'live' && actionsFor(conn)}
              </View>
            ))}
          </View>
        ))}

        <RichText style={{ fontSize: t.xs, color: c.text3, lineHeight: 18, marginTop: s.sm }} boldStyle={{ color: c.text1 }}>
          **Your data stays yours.** Each app only reads what it says here, and only once you connect it. **Disconnect any time.**
        </RichText>
      </ScrollView>

      <PhoneCalendarSheet visible={calendarOpen} onClose={() => { setCalendarOpen(false); refresh(); }} userId={userId} c={c} t={t} s={s} r={r} />
      {unlockSheet}
    </View>
  );
}
