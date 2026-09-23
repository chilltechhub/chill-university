// src/screens/NotificationCenterScreen.js
// The Notification Center: one place for what needs doing, what's coming up,
// and what's new — each item with the button that goes and does it.
//
//   Now       ranked notices (src/logic/notices.js): slipped plans, the next
//             plan, overdue tasks, a quest left half-way, projects with no
//             next step or gone quiet, idle ideas, a full inbox, life areas
//             due a check-in, and anything shared into the app. Each has one
//             primary action, plus Remind me / Later / Ask AI / Share where
//             they make sense.
//   Upcoming  timed plans for the next week, with a bell per plan for its
//             phone reminder, and New reminder / Plan with AI / Share my day.
//   Updates   news from Chill Tech, and "paste something in".
//
// Phone notifications are all local (src/logic/hubNotifications.js) and off
// until switched on here; the gear holds those settings.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, Switch, ActivityIndicator, Linking, Platform, TextInput, KeyboardAvoidingView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import {
  useNoticeFeed, refreshAndSync, dismissNotice, snoozeNotice, markAllSeen, setPrefs, PHONE_CAPABLE,
} from '../logic/noticeStore';
import { NOTICE_CATS, planWithAIIdea } from '../logic/notices';
import { requestPhonePermission, scheduleNoticeReminder, setPlanReminder } from '../logic/hubNotifications';
import { openTarget, targetFromInstance, TARGET_LABEL } from '../logic/openTarget';
import { listUpcoming, moveToToday, restoreDates } from '../api/reminderService';
import { addShared, getShared, removeShared, splitShared } from '../logic/shareIntake';
import { addCapture } from '../api/captureService';
import { shareText, reminderText, dayPlanText, fmtTime12, fmtDay } from '../logic/shareOut';
import ReminderComposer from '../components/ReminderComposer';
import { FONTS } from '../theme';
import { todayStr } from '../logic/dateUtils';

const LEADS = [['off', 'Off'], [0, 'At the time'], [5, '5 min'], [15, '15 min'], [30, '30 min']];
const NUDGE_TIMES = [['08:00', '8 AM'], ['12:00', 'Noon'], ['17:00', '5 PM'], ['20:00', '8 PM']];
const QUIET_STARTS = [['21:00', '9 PM'], ['21:30', '9:30 PM'], ['22:30', '10:30 PM']];
const QUIET_ENDS = [['07:00', '7 AM'], ['08:00', '8 AM'], ['09:00', '9 AM']];

function laterOptions(now) {
  const at = (days, h, m = 0) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d; };
  const inHour = new Date(now.getTime() + 3600000);
  return [
    { label: 'In 1 hour', at: inHour, say: 'in an hour' },
    ...(now.getHours() < 19 ? [{ label: 'Tonight', at: at(0, 20), say: 'tonight at 8' }] : []),
    { label: 'Tomorrow morning', at: at(1, 9), say: 'tomorrow at 9' },
    { label: 'Next week', at: at(7, 9), say: 'next week' },
  ];
}

export default function NotificationCenterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { user } = useUserProgress();
  const userId = user?.id || null;
  const feed = useNoticeFeed();
  const prefs = feed.prefs;

  const [tab, setTab] = useState(route.params?.tab || 'now');
  const [loading, setLoading] = useState(!feed.data);
  const [upcoming, setUpcoming] = useState(null);
  const [composer, setComposer] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [shared, setShared] = useState(null);
  const [later, setLater] = useState(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const say = useCallback((text, undo) => {
    clearTimeout(toastTimer.current);
    setToast({ text, undo });
    toastTimer.current = setTimeout(() => setToast(null), undo ? 7000 : 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const loadUpcoming = useCallback(async () => {
    try { setUpcoming(await listUpcoming(userId)); } catch { setUpcoming([]); }
  }, [userId]);

  const reload = useCallback(async (force = true) => {
    await refreshAndSync(userId, { force });
    setLoading(false);
    loadUpcoming();
  }, [userId, loadUpcoming]);

  useFocusEffect(useCallback(() => {
    reload(true).then(() => markAllSeen());
  }, [reload]));

  // Arriving from the share sheet (ShareIntentListener) or a notice deep link.
  useEffect(() => {
    if (route.params?.tab) setTab(route.params.tab);
    const id = route.params?.openShared;
    if (id) getShared(id).then(item => { if (item) setShared(item); });
  }, [route.params?.tab, route.params?.openShared]);

  const nowNotices = feed.visible.filter(n => n.cat !== 'news');
  const news = feed.visible.filter(n => n.cat === 'news');

  // ── Actions ───────────────────────────────────────────────────────────────

  const open = async (target) => {
    const ok = await openTarget(navigation, target);
    if (!ok) say('That isn’t there any more.');
  };

  const askAI = (ai) => navigation.navigate('MainTabs', {
    screen: 'Library', params: { screen: 'AIBridgeScreen', params: { target: ai.target, idea: ai.idea, everything: ai.everything, at: Date.now() } },
  });

  const runPrimary = async (n, btn) => {
    if (btn.target) return open(btn.target);
    switch (btn.action) {
      case 'reschedule-overdue': {
        try {
          const before = await moveToToday(btn.payload);
          await reload(true);
          say(`Moved ${before.length} to today.`, async () => { await restoreDates(before); await reload(true); say('Put back.'); });
        } catch { say('Couldn’t move them. Check your connection.'); }
        return;
      }
      case 'turn-on-reminders': return turnOnReminders(15);
      case 'open-settings': return Linking.openSettings().catch(() => {});
      case 'file-shared': {
        const item = await getShared(btn.payload);
        if (item) setShared(item); else reload(true);
        return;
      }
      default:
    }
  };

  const turnOnReminders = async (lead) => {
    const ok = await requestPhonePermission();
    if (!ok) { say('Notifications are blocked. Allow them in your phone’s settings.'); return; }
    await setPrefs({ autoRemind: lead });
    await reload(true);
    say(lead === 0 ? 'You’ll get a reminder when each timed plan starts.' : `You’ll get a reminder ${lead} min before each timed plan.`);
  };

  const changePref = async (patch) => {
    const wantsPhone = (patch.autoRemind !== undefined && patch.autoRemind !== 'off') || patch.dailyNudge === true;
    if (wantsPhone && PHONE_CAPABLE && !(await requestPhonePermission())) {
      say('Notifications are blocked. Allow them in your phone’s settings.');
      return;
    }
    await setPrefs(patch);
    await refreshAndSync(userId, { force: false, sync: true });
  };

  const snooze = async (n, opt) => {
    setLater(null);
    await snoozeNotice(n.id, opt.at);
    const phoned = PHONE_CAPABLE && await scheduleNoticeReminder(n, opt.at);
    say(phoned ? `We’ll remind you ${opt.say}.` : `Hidden until ${opt.say}.`);
  };

  const toggleBell = async (item) => {
    if (!PHONE_CAPABLE) { say('Phone reminders only work in the app on your phone.'); return; }
    if (!item.reminderOn && !(await requestPhonePermission())) { say('Notifications are blocked. Allow them in your phone’s settings.'); return; }
    const lead = prefs.autoRemind === 'off' ? 0 : Number(prefs.autoRemind) || 0;
    const on = await setPlanReminder(item, !item.reminderOn, lead);
    setUpcoming(list => list.map(x => (x.id === item.id ? { ...x, reminderOn: on } : x)));
    say(on ? 'Reminder on.' : 'Reminder off for this one.');
  };

  // A box to paste into by hand, which needs no permission. Reading the
  // clipboard directly is a shortcut that phones and browsers may block.
  const pasteIn = () => { setPasteText(''); setPasteError(null); setPasteOpen(true); };
  const pasteFromClipboard = async () => {
    try {
      const txt = await Clipboard.getStringAsync();
      if (txt?.trim()) { setPasteText(txt); setPasteError(null); } else setPasteError('Your clipboard is empty. Copy a link or some text first.');
    } catch {
      setPasteError('This device blocked reading the clipboard. Long-press the box above and choose Paste instead.');
    }
  };
  const addPasted = async () => {
    if (!pasteText.trim()) { setPasteError('Paste or type something first.'); return; }
    const item = await addShared(splitShared(pasteText));
    setPasteOpen(false);
    if (item) setShared(item);
  };

  const shareOut = async (message, title) => {
    const res = await shareText({ title, message });
    if (res === 'copied') say('Copied to your clipboard.');
    if (res === 'failed') say('Couldn’t share that.');
  };

  // ── Shared-item sheet actions ─────────────────────────────────────────────

  const sharedLabel = (it) => (it?.url ? it.url.replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0] : (it?.text || '').slice(0, 60));

  const fileShared = async (kind) => {
    const it = shared;
    if (!it) return;
    try {
      if (kind === 'save') {
        if (!userId) { say('Sign in to save things.'); return; }
        await addCapture(userId, {
          type: it.url ? 'link' : 'note',
          title: it.url ? (it.text?.split('\n')[0].slice(0, 120) || sharedLabel(it)) : it.text.split('\n')[0].slice(0, 120),
          body: it.url ? (it.text || null) : it.text,
          url: it.url, source: 'share',
        });
        say('Saved to your Capture Inbox.');
      } else if (kind === 'remind') {
        setComposer({ title: it.text?.split('\n')[0].slice(0, 100) || `Check out ${sharedLabel(it)}`, notes: it.url || null });
      } else if (kind === 'ai') {
        askAI({ everything: true, idea: `I saved this and want to do something with it:\n${[it.text, it.url].filter(Boolean).join('\n')}\n\nHelp me decide where it belongs (a note, a task, a project or a plan) and set it up.` });
      } else if (kind === 'open' && it.url) {
        Linking.openURL(it.url).catch(() => {});
        return;
      }
      await removeShared(it.id);
      await dismissNotice(`shared:${it.id}`);
      setShared(null);
      reload(true);
    } catch {
      say('Couldn’t do that. Check your connection.');
    }
  };

  // ── Pieces ────────────────────────────────────────────────────────────────

  const TONE = { teal: c.teal, gold: c.gold, error: c.error, success: c.success, purple: c.purple };
  const pill = (label, icon, onPress, { tone = c.teal, filled = false, key } = {}) => (
    <TouchableOpacity key={key || label} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: s.md, paddingVertical: 6, borderRadius: r.full,
        backgroundColor: filled ? tone : 'transparent', borderWidth: 1, borderColor: filled ? tone : `${tone}66` }}>
      {!!icon && <Ionicons name={icon} size={13} color={filled ? '#fff' : tone} />}
      {!!label && <Text style={{ fontSize: 12, fontWeight: '700', color: filled ? '#fff' : tone }}>{label}</Text>}
    </TouchableOpacity>
  );
  const iconBtn = (icon, label, onPress) => (
    <TouchableOpacity onPress={onPress} accessibilityLabel={label} hitSlop={8} style={{ padding: 6 }}>
      <Ionicons name={icon} size={17} color={c.text3} />
    </TouchableOpacity>
  );

  const NoticeCard = ({ n }) => {
    const tone = TONE[n.tone] || c.teal;
    return (
      <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: tone, padding: s.md, marginBottom: s.md }}>
        <View style={{ flexDirection: 'row', gap: s.md }}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${tone}1f`, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={n.icon} size={17} color={tone} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{n.title}</Text>
            {!!n.body && <Text style={{ fontSize: 12, color: c.text3, marginTop: 2, lineHeight: 17 }}>{n.body}</Text>}
          </View>
          {n.cat !== 'setup' && iconBtn('close', 'Dismiss', () => dismissNotice(n.id))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s.sm, marginTop: s.md, marginLeft: 46 }}>
          {n.primary && pill(n.primary.label, null, () => runPrimary(n, n.primary), { tone, filled: true })}
          {n.secondary && pill(n.secondary.label, null, () => runPrimary(n, n.secondary), { tone })}
          {n.ai && pill('Ask AI', 'sparkles', () => askAI(n.ai), { tone: c.purple })}
          {n.remind && pill('', 'alarm-outline', () => setComposer(n.remind), { tone: c.text3, key: 'remind' })}
          {n.snooze && pill('Later', 'time-outline', () => setLater(n), { tone: c.text3 })}
          {!!n.share && pill('', 'share-outline', () => shareOut(n.share, n.title), { tone: c.text3, key: 'share' })}
        </View>
      </View>
    );
  };

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const renderNow = () => (
    <>
      <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.lg, flexWrap: 'wrap' }}>
        {pill('Plan my day with AI', 'sparkles', () => askAI({ target: 'planner', idea: planWithAIIdea(feed.visible) }), { tone: c.purple, filled: true })}
        {pill('New reminder', 'alarm-outline', () => setComposer({}), { tone: c.teal })}
      </View>
      {loading && !feed.data ? <ActivityIndicator color={c.teal} style={{ marginTop: s.xl }} /> : nowNotices.length ? (
        nowNotices.map(n => <NoticeCard key={n.id} n={n} />)
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: s.xxl }}>
          <Text style={{ fontSize: 36 }}>✨</Text>
          <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginTop: s.sm }}>You’re all caught up</Text>
          <Text style={{ fontSize: 12, color: c.text3, marginTop: 4, textAlign: 'center' }}>Nothing needs you right now. Set a reminder, or plan ahead with AI.</Text>
        </View>
      )}
    </>
  );

  const byDay = useMemo(() => {
    const groups = [];
    for (const i of upcoming || []) {
      const g = groups.find(x => x.date === i.date);
      if (g) g.items.push(i); else groups.push({ date: i.date, items: [i] });
    }
    return groups;
  }, [upcoming]);
  const todayIso = todayStr();

  const renderUpcoming = () => (
    <>
      <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.md, flexWrap: 'wrap' }}>
        {pill('New reminder', 'alarm-outline', () => setComposer({}), { filled: true })}
        {pill('Plan with AI', 'sparkles', () => askAI({ target: 'planner', idea: 'Help me plan reminders and times for my week.' }), { tone: c.purple })}
        {pill('Share my day', 'share-outline', () => shareOut(dayPlanText((upcoming || []).filter(i => i.date === byDay[0]?.date), byDay[0] ? fmtDay(byDay[0].date) : 'today'), 'My plan'), { tone: c.text3 })}
      </View>
      {PHONE_CAPABLE && prefs.autoRemind === 'off' && (upcoming || []).length > 0 && (
        <TouchableOpacity onPress={() => turnOnReminders(15)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.tealLight, borderRadius: r.md, padding: s.md, marginBottom: s.md }}>
          <Ionicons name="notifications-outline" size={16} color={c.teal} />
          <Text style={{ flex: 1, fontSize: 12, color: c.teal }}>Get a reminder 15 min before every timed plan. Tap to turn on.</Text>
        </TouchableOpacity>
      )}
      {upcoming === null ? <ActivityIndicator color={c.teal} style={{ marginTop: s.xl }} /> : byDay.length === 0 ? (
        <Text style={{ fontSize: 12, color: c.text3, textAlign: 'center', marginTop: s.xl }}>
          No timed plans in the next week. Add a reminder, or give Planner items a time.
        </Text>
      ) : byDay.map(g => (
        <View key={g.date} style={{ marginBottom: s.lg }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: c.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>
            {g.date === todayIso ? 'Today' : fmtDay(g.date)}
          </Text>
          {g.items.map(i => {
            const tgt = targetFromInstance(i);
            return (
              <TouchableOpacity key={i.id} onPress={() => open(tgt || { kind: 'planner' })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, paddingVertical: s.sm, paddingHorizontal: s.md, marginBottom: 6 }}>
                <Text style={{ width: 62, fontSize: 12, fontFamily: FONTS.mono, color: c.text2 }}>{fmtTime12(i.start_time)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, color: c.text1 }} numberOfLines={1}>{i.title}</Text>
                  {!!tgt && <Text style={{ fontSize: 11, color: c.teal, marginTop: 1 }}>{TARGET_LABEL[tgt.kind]}</Text>}
                </View>
                {iconBtn('share-outline', 'Share', () => shareOut(reminderText(i), i.title))}
                {PHONE_CAPABLE && iconBtn(i.reminderOn ? 'notifications' : 'notifications-off-outline', i.reminderOn ? 'Turn reminder off' : 'Turn reminder on', () => toggleBell(i))}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </>
  );

  const renderUpdates = () => (
    <>
      {news.map(n => <NoticeCard key={n.id} n={n} />)}
      {!news.length && <Text style={{ fontSize: 12, color: c.text3, marginBottom: s.lg }}>No news from Chill Tech right now.</Text>}
      <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, padding: s.lg }}>
        <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Bring things into Deskartes</Text>
        <Text style={{ fontSize: 12, color: c.text3, marginTop: 4, lineHeight: 17 }}>
          Copy a link or some text anywhere, then paste it here to save it, get a reminder, or plan it with AI.
          {Platform.OS !== 'web' ? ' In the latest app build you can also tap Share in Safari, TikTok, Notes and more, then pick Deskartes.' : ''}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: s.md }}>
          {pill('Paste something in', 'clipboard-outline', pasteIn, { filled: true })}
        </View>
      </View>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const TABS = [['now', 'Now', nowNotices.length], ['upcoming', 'Upcoming', (upcoming || []).length], ['updates', 'Updates', news.length]];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ backgroundColor: c.bg1, borderBottomWidth: 0.5, borderBottomColor: c.border, paddingHorizontal: s.lg, paddingTop: s.xl, paddingBottom: s.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md }}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back" style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={22} color={c.teal} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: t.xxl, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1 }}>🔔 Notifications</Text>
          <TouchableOpacity onPress={() => setShowSettings(true)} accessibilityLabel="Notification settings" style={{ padding: 4 }}>
            <Ionicons name="settings-outline" size={20} color={c.text2} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md }}>
          {TABS.map(([k, l, n]) => (
            <TouchableOpacity key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: s.md, paddingVertical: 6, borderRadius: r.full, backgroundColor: tab === k ? c.teal : 'transparent' }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: tab === k ? '#fff' : c.text2 }}>{l}</Text>
              {n > 0 && (
                <View style={{ minWidth: 18, paddingHorizontal: 4, height: 18, borderRadius: 9, backgroundColor: tab === k ? '#ffffff33' : c.bg2, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: tab === k ? '#fff' : c.text2 }}>{n}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: 100 }}>
        {!userId && (
          <Text style={{ fontSize: 12, color: c.gold, marginBottom: s.md }}>Sign in to see reminders and plans. Guests only get app news here.</Text>
        )}
        {tab === 'now' ? renderNow() : tab === 'upcoming' ? renderUpcoming() : renderUpdates()}
      </ScrollView>

      {!!toast && (
        <View style={{ position: 'absolute', left: s.lg, right: s.lg, bottom: s.xl, flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.text1, borderRadius: r.lg, paddingVertical: s.md, paddingHorizontal: s.lg }}>
          <Text style={{ flex: 1, fontSize: 13, color: c.bg0 }}>{toast.text}</Text>
          {!!toast.undo && (
            <TouchableOpacity onPress={() => { const u = toast.undo; setToast(null); u(); }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: c.teal }}>Undo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Paste something in ────────────────────────────────────────── */}
      <Modal visible={pasteOpen} transparent animationType="slide" onRequestClose={() => setPasteOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setPasteOpen(false)} />
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: s.lg, paddingBottom: s.xxl }}>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>Paste something in</Text>
          <TextInput
            value={pasteText} onChangeText={(v) => { setPasteText(v); setPasteError(null); }}
            placeholder="A link, a note, a message, anything" placeholderTextColor={c.text4}
            multiline textAlignVertical="top" autoFocus
            style={{ minHeight: 90, maxHeight: 200, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md }}
          />
          {!!pasteError && <Text style={{ fontSize: 12, color: c.error, marginTop: s.sm }}>{pasteError}</Text>}
          <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md, flexWrap: 'wrap' }}>
            {pill('Add it', 'add', addPasted, { filled: true })}
            {pill('From clipboard', 'clipboard-outline', pasteFromClipboard, { tone: c.text3 })}
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Later ─────────────────────────────────────────────────────── */}
      <Modal visible={!!later} transparent animationType="fade" onRequestClose={() => setLater(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: s.xl }} activeOpacity={1} onPress={() => setLater(null)}>
          <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg }}>
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>Bring this back…</Text>
            {later && laterOptions(new Date()).map(o => (
              <TouchableOpacity key={o.label} onPress={() => snooze(later, o)} style={{ paddingVertical: s.md, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <Text style={{ fontSize: t.sm, color: c.text1 }}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Something shared in ───────────────────────────────────────── */}
      <Modal visible={!!shared} transparent animationType="slide" onRequestClose={() => setShared(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setShared(null)} />
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: s.lg, paddingBottom: s.xxl }}>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>What should happen with this?</Text>
          <View style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginTop: s.md }}>
            {!!shared?.text && <Text style={{ fontSize: 13, color: c.text1 }} numberOfLines={4}>{shared.text}</Text>}
            {!!shared?.url && <Text style={{ fontSize: 12, color: c.teal, marginTop: shared?.text ? 4 : 0 }} numberOfLines={2}>{shared.url}</Text>}
          </View>
          {[
            ['save', 'file-tray-full-outline', 'Save it', 'Into your Capture Inbox to sort later'],
            ['remind', 'alarm-outline', 'Remind me', 'Pick a time, and it goes in your Planner'],
            ['ai', 'sparkles-outline', 'Plan it with AI', 'Let your chatbot decide where it belongs'],
            ...(shared?.url ? [['open', 'open-outline', 'Open the link', null]] : []),
          ].map(([k, icon, l, sub]) => (
            <TouchableOpacity key={k} onPress={() => fileShared(k)} style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: s.md, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
              <Ionicons name={icon} size={20} color={k === 'ai' ? c.purple : c.teal} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{l}</Text>
                {!!sub && <Text style={{ fontSize: 11, color: c.text3 }}>{sub}</Text>}
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={async () => { await removeShared(shared.id); await dismissNotice(`shared:${shared.id}`); setShared(null); reload(true); }} style={{ paddingVertical: s.md }}>
            <Text style={{ fontSize: t.sm, color: c.error, fontWeight: '600' }}>Throw it away</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Settings ──────────────────────────────────────────────────── */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setShowSettings(false)} />
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' }}>
          <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: s.xxl }}>
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>Notification settings</Text>

            {PHONE_CAPABLE ? (
              <>
                {feed.permission === 'denied' && (
                  <TouchableOpacity onPress={() => Linking.openSettings().catch(() => {})} style={{ backgroundColor: c.errorLight, borderRadius: r.md, padding: s.md, marginTop: s.md }}>
                    <Text style={{ fontSize: 12, color: c.error }}>Your phone is blocking notifications from Deskartes. Tap to open settings.</Text>
                  </TouchableOpacity>
                )}
                <SettingLabel c={c} s={s} text="Remind me before timed plans" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                  {LEADS.map(([v, l]) => pill(l, null, () => changePref({ autoRemind: v }), { filled: prefs.autoRemind === v, key: `lead-${v}` }))}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s.lg }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>One daily nudge</Text>
                    <Text style={{ fontSize: 11, color: c.text3 }}>At most one a day: the most useful thing from Now.</Text>
                  </View>
                  <Switch value={prefs.dailyNudge} onValueChange={v => changePref({ dailyNudge: v })} trackColor={{ true: c.teal }} />
                </View>
                {prefs.dailyNudge && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.sm }}>
                    {NUDGE_TIMES.map(([v, l]) => pill(l, null, () => changePref({ nudgeTime: v }), { filled: prefs.nudgeTime === v, key: `nudge-${v}` }))}
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s.lg }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Quiet hours</Text>
                    <Text style={{ fontSize: 11, color: c.text3 }}>No nudges at night. Reminders you set still go off.</Text>
                  </View>
                  <Switch value={prefs.quiet.on} onValueChange={v => changePref({ quiet: { ...prefs.quiet, on: v } })} trackColor={{ true: c.teal }} />
                </View>
                {prefs.quiet.on && (
                  <>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.sm, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: c.text3, width: 40 }}>From</Text>
                      {QUIET_STARTS.map(([v, l]) => pill(l, null, () => changePref({ quiet: { ...prefs.quiet, start: v } }), { filled: prefs.quiet.start === v, key: `qs-${v}` }))}
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.sm, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: c.text3, width: 40 }}>Until</Text>
                      {QUIET_ENDS.map(([v, l]) => pill(l, null, () => changePref({ quiet: { ...prefs.quiet, end: v } }), { filled: prefs.quiet.end === v, key: `qe-${v}` }))}
                    </View>
                  </>
                )}
                <TouchableOpacity onPress={() => { setShowSettings(false); navigation.navigate('Settings'); }} style={{ marginTop: s.md }}>
                  <Text style={{ fontSize: 12, color: c.teal }}>Daily Drills and streak reminders are in Settings →</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ fontSize: 12, color: c.text3, marginTop: s.md }}>Phone notifications are set up in the app on your phone. Here you can choose what shows in the center.</Text>
            )}

            <SettingLabel c={c} s={s} text="Show in Now" />
            {NOTICE_CATS.map(cat => (
              <View key={cat.key} style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: 6 }}>
                <Ionicons name={cat.icon} size={16} color={c.text3} />
                <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{cat.label}</Text>
                <Switch value={prefs.cats[cat.key] !== false} onValueChange={v => changePref({ cats: { ...prefs.cats, [cat.key]: v } })} trackColor={{ true: c.teal }} />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <ReminderComposer
        visible={!!composer}
        userId={userId}
        initial={composer || {}}
        onClose={() => setComposer(null)}
        onSaved={() => reload(true)}
      />
    </View>
  );
}

function SettingLabel({ c, s, text }) {
  return <Text style={{ fontSize: 11, fontWeight: '800', color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginTop: s.xl, marginBottom: s.sm }}>{text}</Text>;
}
