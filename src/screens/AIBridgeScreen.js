// src/screens/AIBridgeScreen.js
// "Fill with AI": plan, change or clean up the app with any chatbot, free.
//
//   1. Pick what the AI works on, say what you want.
//   2. Copy the prompt (with your current items, if you share them) and
//      paste it into ChatGPT, Claude, Gemini — whatever you already use.
//   3. Paste its reply back. Every change is listed — new, edit (old → new),
//      delete — with a tick box, and nothing is saved until you apply it.
//      Undo puts it all back.
//
// The format and prompt live in src/logic/aiBridgeFormat.js, the reply
// reader in src/logic/aiBridgeParse.js, reads and writes in
// src/api/aiBridgeData.js. This screen costs nothing to run: the app never
// calls a model itself (that's the paid 'ai-import' path in ImportScreen).

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform, Linking, Share, Switch,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { useFeatureGate } from '../components/FeatureGate';
import { TARGETS, TARGET_BY_KEY, REPEAT_COUNTS, buildPrompt } from '../logic/aiBridgeFormat';
import { parseReply, resolveChanges, countChanges, FIELD_LABELS } from '../logic/aiBridgeParse';
import { loadSnapshot, applyChanges, undoChanges } from '../api/aiBridgeData';
import { ageBandFor } from '../logic/profileResolver';
import { LIFE_AREAS } from './library/LifeAreaScreen';
import { FONTS } from '../theme';

const AREA_CATALOG = LIFE_AREAS.map(a => ({
  id: a.id, label: a.label,
  sections: a.sections.map(s => ({ title: s.title, screen: s.screen, items: s.items })),
}));
const AREA_LABEL = Object.fromEntries(LIFE_AREAS.map(a => [a.id, a.label]));

const CHATBOTS = [
  { label: 'ChatGPT', url: 'https://chatgpt.com/' },
  { label: 'Claude',  url: 'https://claude.ai/new' },
  { label: 'Gemini',  url: 'https://gemini.google.com/app' },
];

// Past this, some free chatbot tiers start cutting the prompt off.
const LONG_PROMPT = 60000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dt.getDay()]} ${MONTHS[m - 1]} ${d}`;
}
function fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
const listWords = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] || '');
const host = (url) => String(url || '').replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0];
const clip = (s, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function fmtValue(v, field) {
  if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return '(empty)';
  if (field === 'time') return fmtTime(v);
  if (field === 'remind') return v === false ? 'off' : v === true ? 'on' : v === 0 ? 'at the time' : `${v} min before`;
  if (field === 'date') return fmtDate(v);
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (Array.isArray(v)) return clip(v.join(', '), 50);
  return clip(String(v).replace(/\s+/g, ' '), 50);
}

// Title + one grey line for a change row.
function describe(ch) {
  const f = ch.fields || {};
  const cur = ch.current || {};
  const pick = (k) => (k in f ? f[k] : cur[k]);
  const kids = (ch.children || []).filter(k => k.status === 'ok');
  const kidCount = (kind, word) => {
    const n = kids.filter(k => k.kind === kind).length;
    return n ? `${n} ${word}${n === 1 ? '' : 's'}` : null;
  };
  let title = pick('title') || (pick('body') ? clip(String(pick('body')), 60) : pick('url'))
    || (ch.ref && !ch.current ? `Item ${ch.ref}` : '(untitled)');
  let sub = [];
  switch (ch.target) {
    case 'projects':
      sub = [pick('stage'), pick('type'), kidCount('task', 'task'), kidCount('note', 'note'), kidCount('link', 'link')];
      break;
    case 'ideas':
      sub = [pick('stage'), kidCount('petal', 'petal')];
      break;
    case 'vault':
      sub = [pick('kind'), pick('url') ? host(pick('url')) : null, pick('area') ? AREA_LABEL[pick('area')] : null];
      break;
    case 'planner': {
      const n = ch.op === 'create' ? (REPEAT_COUNTS[f.repeat] || 1) : 1;
      sub = [fmtDate(pick('date')), fmtTime(pick('time')), pick('minutes') ? `${pick('minutes')} min` : null,
        pick('area') ? AREA_LABEL[pick('area')] : null, n > 1 ? `${f.repeat} ×${n}` : null];
      break;
    }
    case 'life_areas':
      if (ch.kind === 'note') {
        title = clip(f.text || '', 90);
        sub = ['Note', AREA_LABEL[f.area], f.section];
      } else {
        sub = [AREA_LABEL[pick('area')], pick('section'), pick('type')];
      }
      break;
    case 'portfolio':
      sub = [pick('section'), pick('tag')];
      break;
    default:
  }
  return { title, sub: sub.filter(Boolean).join(' · ') };
}

export default function AIBridgeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { user, profile } = useUserProgress();
  const { isOpen, openGate, sheet } = useFeatureGate();
  const userId = user?.id || null;
  const isKid = ageBandFor(profile) === 'kid';

  const startTarget = TARGET_BY_KEY[route.params?.target] ? route.params.target : 'projects';
  const [targets, setTargets] = useState([startTarget]);
  const [everything, setEverything] = useState(!!route.params?.everything);
  const [share, setShare] = useState(true);
  const [idea, setIdea] = useState(route.params?.idea || '');

  const [prompt, setPrompt] = useState('');
  const [building, setBuilding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [notice, setNotice] = useState(null);

  const [reply, setReply] = useState('');
  const [checking, setChecking] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [review, setReview] = useState(null); // { changes, warnings }
  const [selected, setSelected] = useState(() => new Set());
  const [showAllWarnings, setShowAllWarnings] = useState(false);

  const [applying, setApplying] = useState(null); // { done, total }
  const [result, setResult] = useState(null);     // { applied, failed, undo, touched, lifeArea }
  const [undoing, setUndoing] = useState(false);
  const [undone, setUndone] = useState(null);     // { failed }

  const featureOpen = (key) => {
    const f = TARGET_BY_KEY[key].feature;
    return !f || isOpen(f);
  };
  const openKeys = TARGETS.map(x => x.key).filter(featureOpen);
  const activeKeys = everything ? openKeys : targets;
  const placeholder = everything
    ? 'e.g. Here is everything on my mind this week: school stuff, a side hustle idea, gym plans, and some links I want to keep.'
    : TARGET_BY_KEY[targets[0]]?.placeholder;

  // Anything that changes the prompt makes the copied one stale.
  const stale = () => { setCopied(false); setPrompt(''); };

  // "Ask AI" from a notice (or any caller) arrives with a place and a
  // starting request. The screen may already be open in the stack, so this
  // re-reads them each time new ones are passed (`at` changes on every call).
  useEffect(() => {
    const p = route.params || {};
    if (!p.at && !p.idea) return;
    if (TARGET_BY_KEY[p.target]) setTargets([p.target]);
    setEverything(!!p.everything);
    if (p.idea) setIdea(p.idea);
    setResult(null); setReview(null); setReply(''); setReplyError(null);
    stale();
  }, [route.params?.at, route.params?.idea]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTarget = (key) => {
    const f = TARGET_BY_KEY[key].feature;
    if (f && !isOpen(f)) { openGate(f); return; }
    stale();
    setEverything(false);
    setTargets(prev => (prev.includes(key)
      ? (prev.length > 1 ? prev.filter(k => k !== key) : prev)
      : [...prev, key]));
  };

  // ── Step 2: the prompt ────────────────────────────────────────────────────

  const makePrompt = async () => {
    const snapshot = share && userId ? await loadSnapshot(userId, activeKeys, AREA_CATALOG) : null;
    return buildPrompt({
      targets: activeKeys, idea, today: new Date(), areaCatalog: AREA_CATALOG, snapshot, sortEverything: everything,
    });
  };

  const copyPrompt = async () => {
    setBuilding(true);
    setNotice(null);
    try {
      const p = await makePrompt();
      setPrompt(p);
      await Clipboard.setStringAsync(p);
      setCopied(true);
    } catch (e) {
      console.warn('AIBridge prompt', e);
      setNotice('Couldn’t load your items for the prompt. Check your connection, or turn off sharing and try again.');
    }
    setBuilding(false);
  };

  const sharePrompt = async () => {
    setBuilding(true);
    setNotice(null);
    try {
      const p = prompt || await makePrompt();
      setPrompt(p);
      await Share.share({ message: p });
      setCopied(true);
    } catch (e) {
      console.warn('AIBridge share', e);
      setNotice('Sharing didn’t open. Use Copy prompt instead.');
    }
    setBuilding(false);
  };

  // ── Step 3: the reply ─────────────────────────────────────────────────────

  const pasteReply = async () => {
    try {
      const txt = await Clipboard.getStringAsync();
      if (txt) { setReply(txt); setReplyError(null); setReview(null); } else setReplyError('Your clipboard is empty. Copy the AI’s reply first.');
    } catch {
      setReplyError('This device blocked reading the clipboard. Long-press the box below and choose Paste instead.');
    }
  };

  const checkReply = async () => {
    setReplyError(null);
    setReview(null);
    setResult(null);
    setUndone(null);
    const parsed = parseReply(reply, {
      today: new Date(), areaCatalog: AREA_CATALOG,
      defaultTarget: !everything && targets.length === 1 ? targets[0] : null,
    });
    if (!parsed.ok) { setReplyError(parsed.message); return; }
    setChecking(true);
    try {
      const keys = [...new Set(parsed.changes.map(ch => ch.target))];
      const snap = userId ? await loadSnapshot(userId, keys, AREA_CATALOG) : {};
      const resolved = resolveChanges(parsed.changes, snap).map(ch => (featureOpen(ch.target) ? ch : { ...ch, status: 'locked' }));
      setReview({ changes: resolved, warnings: parsed.warnings });
      setSelected(new Set(resolved.filter(ch => ch.status === 'ok').map(ch => ch.key)));
      setShowAllWarnings(false);
    } catch (e) {
      console.warn('AIBridge check', e);
      setReplyError('Couldn’t load your current items to compare against. Check your connection and try again.');
    }
    setChecking(false);
  };

  const toggleChange = (key) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const counts = useMemo(() => (review ? countChanges(review.changes, selected) : null), [review, selected]);
  const total = counts ? counts.create + counts.update + counts.delete : 0;

  const apply = async () => {
    if (!userId) { setReplyError('Sign in to save changes. Guest data isn’t kept.'); return; }
    const picked = review.changes.filter(ch => ch.status === 'ok' && selected.has(ch.key));
    setApplying({ done: 0, total: picked.length });
    try {
      const res = await applyChanges(userId, review.changes, selected, (done, all) => setApplying({ done, total: all }));
      const failedKeys = new Set(res.failed.map(f => f.key));
      const touched = [...new Set(picked.filter(ch => !failedKeys.has(ch.key)).map(ch => ch.target))];
      const lifeArea = picked.find(ch => ch.target === 'life_areas')?.fields?.area
        || picked.find(ch => ch.target === 'life_areas')?.current?.area || null;
      setResult({
        ...res, touched, lifeArea,
        failedTitles: res.failed.map(f => ({ ...f, title: describe(review.changes.find(ch => ch.key === f.key)).title })),
      });
      setReview(null);
      setReply('');
    } catch (e) {
      setReplyError(e?.message || 'Something went wrong. Nothing else was changed.');
    }
    setApplying(null);
  };

  const undo = async () => {
    setUndoing(true);
    const res = await undoChanges(result.undo);
    setUndone(res);
    setUndoing(false);
  };

  const startOver = () => {
    setResult(null); setUndone(null); setReview(null); setReply(''); setReplyError(null);
    setIdea(''); stale();
  };

  const openTarget = (key) => {
    const tgt = TARGET_BY_KEY[key];
    if (key === 'life_areas') navigation.navigate('LifeAreaScreen', { areaId: result?.lifeArea || 'physical' });
    else navigation.navigate(tgt.route);
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const card = { backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 0.5, borderColor: c.border, marginBottom: s.lg };
  const stepTitle = (n, label) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.md }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.teal, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{n}</Text>
      </View>
      <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, flex: 1 }}>{label}</Text>
    </View>
  );
  const chip = ({ key, label, emoji, on, locked, onPress }) => (
    <TouchableOpacity key={key} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.md, paddingVertical: 8, borderRadius: r.full,
        backgroundColor: on ? c.teal : c.bg0, borderWidth: 1, borderColor: on ? c.teal : c.border, opacity: locked ? 0.55 : 1,
      }}>
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: on ? '#fff' : c.text2 }}>{label}</Text>
      {locked && <Ionicons name="lock-closed" size={11} color={c.text3} />}
    </TouchableOpacity>
  );
  const button = ({ label, icon, onPress, disabled, busy, tone = c.teal, outline }) => (
    <TouchableOpacity onPress={onPress} disabled={disabled || busy}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.sm, borderRadius: r.lg, paddingVertical: s.md, paddingHorizontal: s.lg,
        backgroundColor: outline ? 'transparent' : tone, borderWidth: outline ? 1 : 0, borderColor: tone, opacity: disabled ? 0.5 : 1, flexGrow: 1,
      }}>
      {busy ? <ActivityIndicator color={outline ? tone : '#fff'} size="small" /> : icon ? <Ionicons name={icon} size={16} color={outline ? tone : '#fff'} /> : null}
      <Text style={{ color: outline ? tone : '#fff', fontWeight: t.bold, fontSize: t.sm }}>{label}</Text>
    </TouchableOpacity>
  );

  const OP_STYLE = {
    create: { label: 'NEW', color: c.success },
    update: { label: 'EDIT', color: c.teal },
    delete: { label: 'DELETE', color: c.error },
  };
  const KID_ICON = { create: 'add', update: 'create-outline', delete: 'close' };

  const renderChange = (ch) => {
    const d = describe(ch);
    const live = ch.status === 'ok';
    const on = live && selected.has(ch.key);
    const op = ch.merged ? { label: 'ADD TO', color: c.teal } : OP_STYLE[ch.op];
    const kids = (ch.children || []).filter(k => k.status !== 'noop');
    const shownKids = kids.slice(0, 8);
    const reason = ch.status === 'locked' ? `${TARGET_BY_KEY[ch.target].label} is still locked, so this can’t be saved yet.`
      : ch.status === 'noop' ? 'Nothing here actually changes.' : null;
    return (
      <TouchableOpacity key={ch.key} disabled={!live} onPress={() => toggleChange(ch.key)} activeOpacity={0.7}
        style={{ flexDirection: 'row', gap: s.sm, paddingVertical: s.md, borderTopWidth: 0.5, borderTopColor: c.border, opacity: live ? 1 : 0.5 }}>
        <Ionicons name={!live ? 'remove-circle-outline' : on ? 'checkbox' : 'square-outline'} size={20} color={on ? op.color : c.text4} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <View style={{ backgroundColor: op.color + '22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: op.color, letterSpacing: 0.5 }}>{op.label}</Text>
            </View>
            <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1, flexShrink: 1, textDecorationLine: ch.op === 'delete' ? 'line-through' : 'none' }}>{d.title}</Text>
          </View>
          {!!d.sub && <Text style={{ fontSize: 11, color: c.text3, marginTop: 2 }}>{d.sub}</Text>}
          {ch.diff.map(df => (
            <Text key={df.field} style={{ fontSize: 11, color: c.text2, marginTop: 3 }}>
              <Text style={{ fontWeight: '700' }}>{FIELD_LABELS[df.field] || df.field}: </Text>
              <Text style={{ color: c.text4, textDecorationLine: 'line-through' }}>{fmtValue(df.from, df.field)}</Text>
              <Text>{'  →  '}{fmtValue(df.to, df.field)}</Text>
            </Text>
          ))}
          {shownKids.map((k, i) => {
            const kd = describe({ ...k, target: '' });
            const tone = k.status !== 'ok' ? c.text4 : k.op === 'delete' ? c.error : k.op === 'create' ? c.success : c.teal;
            const doneOnly = k.op === 'update' && k.diff.length === 1 && k.diff[0].field === 'done';
            return (
              <View key={`${ch.key}-k${i}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 3 }}>
                <Ionicons name={doneOnly ? (k.diff[0].to ? 'checkmark' : 'arrow-undo') : KID_ICON[k.op]} size={12} color={tone} style={{ marginTop: 1 }} />
                <Text style={{ fontSize: 11, color: k.status === 'ok' ? c.text2 : c.text4, flex: 1, textDecorationLine: k.op === 'delete' ? 'line-through' : 'none' }}>
                  {k.kind}: {kd.title}{doneOnly ? (k.diff[0].to ? ' (done)' : ' (not done)') : ''}
                  {k.op === 'update' && !doneOnly ? `  (${k.diff.map(df => FIELD_LABELS[df.field] || df.field).join(', ').toLowerCase()})` : ''}
                  {k.status === 'missing' ? `  (${k.warnings[k.warnings.length - 1] || 'skipped'})` : ''}
                </Text>
              </View>
            );
          })}
          {kids.length > shownKids.length && (
            <Text style={{ fontSize: 11, color: c.text3, marginTop: 3 }}>and {kids.length - shownKids.length} more</Text>
          )}
          {!!reason && <Text style={{ fontSize: 11, color: c.text3, marginTop: 4 }}>{reason}</Text>}
          {ch.warnings.map((w, i) => (
            <Text key={i} style={{ fontSize: 11, color: c.gold, marginTop: 3 }}>{w}</Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const reviewGroups = review
    ? TARGETS.map(tg => ({ tg, items: review.changes.filter(ch => ch.target === tg.key) })).filter(g => g.items.length)
    : [];
  const liveCount = review ? review.changes.filter(ch => ch.status === 'ok').length : 0;
  const breakdown = counts
    ? [counts.create && `${counts.create} new`, counts.update && `${counts.update} edited`, counts.delete && `${counts.delete} deleted`].filter(Boolean)
    : [];
  const saveLabel = liveCount === 0 || total === 0
    ? 'Nothing to save'
    : `Save ${total} change${total === 1 ? '' : 's'}${breakdown.length > 1 || counts.delete ? ` (${breakdown.join(', ')})` : ''}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ backgroundColor: c.bg1, borderBottomWidth: 0.5, borderBottomColor: c.border, padding: s.lg, paddingTop: s.xl, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.xxl, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1 }}>✨ Fill with AI</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Plan, change or clean up anything using any AI chatbot. Free.</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">

          {result ? (
            // ── Done ──────────────────────────────────────────────────────
            <View style={card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
                <Ionicons name={undone ? 'arrow-undo-circle' : result.failed.length ? 'alert-circle' : 'checkmark-circle'} size={24}
                  color={undone ? c.text3 : result.failed.length ? c.gold : c.success} />
                <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, flex: 1 }}>
                  {undone
                    ? (undone.failed.length ? 'Mostly undone' : 'All undone')
                    : `${result.applied} change${result.applied === 1 ? '' : 's'} saved`}
                </Text>
              </View>
              {undone && !!undone.failed.length && (
                <Text style={{ fontSize: 12, color: c.error, marginBottom: s.sm }}>
                  {undone.failed.length} step{undone.failed.length === 1 ? '' : 's'} couldn’t be undone. Deleted projects, ideas and vault items can still be restored from Recently Deleted in the Capture Inbox.
                </Text>
              )}
              {!undone && result.failedTitles.map(f => (
                <Text key={f.key} style={{ fontSize: 12, color: c.error, marginBottom: 4 }}>✕ {f.title}: {f.message}</Text>
              ))}
              {!undone && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.sm }}>
                  {result.touched.map(k => (
                    <TouchableOpacity key={k} onPress={() => openTarget(k)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 12 }}>{TARGET_BY_KEY[k].emoji}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>Open {TARGET_BY_KEY[k].label}</Text>
                      <Ionicons name="chevron-forward" size={12} color={c.teal} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.lg }}>
                {!undone && result.undo.length > 0 && button({ label: 'Undo all of it', icon: 'arrow-undo', onPress: undo, busy: undoing, tone: c.error, outline: true })}
                {button({ label: 'Do something else', icon: 'sparkles', onPress: startOver })}
              </View>
            </View>
          ) : (
            <>
              {/* ── 1. What and why ─────────────────────────────────────── */}
              <View style={card}>
                {stepTitle(1, 'What should the AI work on?')}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
                  {TARGETS.map(tg => chip({
                    key: tg.key, label: tg.label, emoji: tg.emoji,
                    on: !everything && targets.includes(tg.key), locked: !featureOpen(tg.key),
                    onPress: () => toggleTarget(tg.key),
                  }))}
                  {chip({ key: 'all', label: 'Everything', emoji: '✨', on: everything, onPress: () => { stale(); setEverything(v => !v); } })}
                </View>
                <Text style={{ fontSize: 11, color: c.text3, marginTop: s.sm }}>
                  {everything
                    ? 'The AI sorts what you say into whichever places fit.'
                    : targets.map(k => TARGET_BY_KEY[k].blurb).join(' · ')}
                </Text>

                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginTop: s.lg, marginBottom: s.sm }}>What do you want?</Text>
                <TextInput
                  value={idea}
                  onChangeText={(v) => { setIdea(v); if (copied) stale(); }}
                  placeholder={placeholder}
                  placeholderTextColor={c.text4}
                  multiline
                  textAlignVertical="top"
                  style={{ minHeight: 90, maxHeight: 200, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md }}
                />
                <Text style={{ fontSize: 11, color: c.text4, marginTop: 4 }}>
                  Optional. Leave it blank and type it into the chatbot instead. Try things like "add", "rename", "mark done", "delete the old ones", "reorganize".
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginTop: s.lg }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Share my current items</Text>
                    <Text style={{ fontSize: 11, color: c.text3, marginTop: 2 }}>
                      {share
                        ? `What’s in your ${everything ? 'app' : listWords(activeKeys.map(k => TARGET_BY_KEY[k].label))} goes into the prompt, so the AI can change and delete things, not just add.`
                        : 'The AI only adds new things. It can’t see or change what you have.'}
                    </Text>
                  </View>
                  <Switch value={share} onValueChange={(v) => { setShare(v); stale(); }} trackColor={{ true: c.teal }} />
                </View>
                {share && !userId && (
                  <Text style={{ fontSize: 11, color: c.gold, marginTop: s.sm }}>Sign in to share your items. As a guest, the AI can only add.</Text>
                )}
              </View>

              {/* ── 2. The prompt ────────────────────────────────────────── */}
              <View style={card}>
                {stepTitle(2, 'Copy the prompt into your AI')}
                {isKid && (
                  <View style={{ flexDirection: 'row', gap: s.sm, backgroundColor: c.goldLight, borderRadius: r.md, padding: s.md, marginBottom: s.md }}>
                    <Ionicons name="people-outline" size={16} color={c.gold} />
                    <Text style={{ flex: 1, fontSize: 11, color: c.gold }}>Most AI chatbots are for ages 13 and up. Ask a parent or guardian to do this part with you.</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: s.sm, flexWrap: 'wrap' }}>
                  {button({ label: copied ? 'Copied! Copy again' : 'Copy prompt', icon: copied ? 'checkmark' : 'copy-outline', onPress: copyPrompt, busy: building })}
                  {Platform.OS !== 'web' && button({ label: 'Share to app', icon: 'share-outline', onPress: sharePrompt, disabled: building, outline: true })}
                </View>
                {!!notice && <Text style={{ fontSize: 12, color: c.error, marginTop: s.sm }}>{notice}</Text>}
                {!!prompt && prompt.length > LONG_PROMPT && (
                  <Text style={{ fontSize: 11, color: c.gold, marginTop: s.sm }}>
                    This prompt is long ({Math.round(prompt.length / 1000)}k characters). Some free chatbots cut long messages off. If yours does, pick fewer places.
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginTop: s.md, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 12, color: c.text3 }}>Then open:</Text>
                  {CHATBOTS.map(b => (
                    <TouchableOpacity key={b.label} onPress={() => Linking.openURL(b.url)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 5 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>{b.label}</Text>
                      <Ionicons name="open-outline" size={11} color={c.teal} />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={{ fontSize: 11, color: c.text4, marginTop: s.sm }}>
                  Paste it in, answer any questions it asks, and ask for changes until you like the plan. Whatever you paste goes to that chatbot’s company, not to us.
                </Text>
                {!!prompt && (
                  <TouchableOpacity onPress={() => setShowPrompt(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: s.md }}>
                    <Ionicons name={showPrompt ? 'chevron-up' : 'chevron-down'} size={14} color={c.text3} />
                    <Text style={{ fontSize: 12, color: c.text3, fontWeight: '700' }}>{showPrompt ? 'Hide' : 'Show'} the prompt</Text>
                  </TouchableOpacity>
                )}
                {showPrompt && !!prompt && (
                  <ScrollView automaticallyAdjustKeyboardInsets style={{ maxHeight: 260, marginTop: s.sm, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }} nestedScrollEnabled>
                    <Text selectable style={{ fontSize: 11, fontFamily: FONTS.mono, color: c.text2, padding: s.md }}>{prompt}</Text>
                  </ScrollView>
                )}
              </View>

              {/* ── 3. The reply ─────────────────────────────────────────── */}
              <View style={card}>
                {stepTitle(3, 'Paste the AI’s reply')}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: s.sm }}>
                  <TouchableOpacity onPress={pasteReply} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: s.sm, paddingVertical: 4 }}>
                    <Ionicons name="clipboard-outline" size={13} color={c.teal} />
                    <Text style={{ fontSize: 11, color: c.teal, fontWeight: '700' }}>Paste from clipboard</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  value={reply}
                  onChangeText={(v) => { setReply(v); setReplyError(null); if (review) setReview(null); }}
                  placeholder="Paste the whole reply, or just its code block."
                  placeholderTextColor={c.text4}
                  multiline
                  textAlignVertical="top"
                  style={{ minHeight: 110, maxHeight: 240, fontSize: 12, fontFamily: FONTS.mono, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md }}
                />
                {!!replyError && (
                  <View style={{ flexDirection: 'row', gap: s.sm, backgroundColor: c.errorLight, borderRadius: r.md, padding: s.md, marginTop: s.sm }}>
                    <Ionicons name="alert-circle-outline" size={16} color={c.error} />
                    <Text style={{ flex: 1, fontSize: 12, color: c.error }}>{replyError}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', marginTop: s.md }}>
                  {button({ label: checking ? 'Checking…' : 'Check the changes', icon: 'git-compare-outline', onPress: checkReply, busy: checking, disabled: !reply.trim() })}
                </View>
              </View>

              {/* ── Review ───────────────────────────────────────────────── */}
              {review && (
                <View style={card}>
                  <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Review before saving</Text>
                  <Text style={{ fontSize: 12, color: c.text3, marginTop: 2 }}>
                    Tap a change to leave it out. Nothing is saved until you press the button at the bottom.
                  </Text>

                  {review.warnings.length > 0 && (
                    <View style={{ backgroundColor: c.goldLight, borderRadius: r.md, padding: s.md, marginTop: s.md }}>
                      {(showAllWarnings ? review.warnings : review.warnings.slice(0, 3)).map((w, i) => (
                        <Text key={i} style={{ fontSize: 11, color: c.gold, marginBottom: 2 }}>• {w}</Text>
                      ))}
                      {review.warnings.length > 3 && (
                        <TouchableOpacity onPress={() => setShowAllWarnings(v => !v)}>
                          <Text style={{ fontSize: 11, color: c.gold, fontWeight: '700', marginTop: 2 }}>
                            {showAllWarnings ? 'Show fewer' : `Show all ${review.warnings.length} notes`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {reviewGroups.map(({ tg, items }) => (
                    <View key={tg.key} style={{ marginTop: s.lg }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: c.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
                        {tg.emoji} {tg.label}
                      </Text>
                      {items.map(renderChange)}
                    </View>
                  ))}

                  <View style={{ flexDirection: 'row', gap: s.md, marginTop: s.lg }}>
                    <TouchableOpacity onPress={() => setSelected(new Set(review.changes.filter(ch => ch.status === 'ok').map(ch => ch.key)))}>
                      <Text style={{ fontSize: 12, color: c.teal, fontWeight: '700' }}>Select all</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelected(new Set())}>
                      <Text style={{ fontSize: 12, color: c.text4, fontWeight: '700' }}>Select none</Text>
                    </TouchableOpacity>
                  </View>

                  {counts.delete > 0 && (
                    <Text style={{ fontSize: 11, color: c.text3, marginTop: s.md }}>
                      Deleted projects, ideas and vault items go to Recently Deleted for 7 days. Everything else can be put back with Undo right after.
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', marginTop: s.md }}>
                    {button({
                      label: applying ? `Saving ${applying.done}/${applying.total}…` : saveLabel,
                      icon: 'save-outline', onPress: apply, busy: !!applying, disabled: total === 0,
                      tone: counts.delete > 0 ? c.error : c.teal,
                    })}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {sheet}
    </View>
  );
}
