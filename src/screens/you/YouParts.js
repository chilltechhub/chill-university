// src/screens/you/YouParts.js
// The pieces You adds around the profile (docs/shake-up-plan-2026-10-21.md
// §2.2, P4): the header with its close, search, your life areas (the old
// Library → Life page, "the ground"), and the footer that holds what the top
// bar's crest menu used to, plus "What's next?". P6 adds your shelf (work
// handed in), work in the receipts with its dated firsts, and each area's
// rating then vs now.
//
// Every row that goes somewhere leaves You first (YouScreen's `leave`), so
// back from Settings lands on the app, not on the dropdown.

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAccess } from '../../../context/AccessContext';
import { LIFE_AREAS } from '../library/LifeAreaScreen';
import ProfileSwitcher from '../../components/ProfileSwitcher';
import LoginScreen from '../LoginScreen';
import TourSpot from '../../components/TourSpot';
import { useUserProgress } from '../../../context/UserProgressContext';
import useSetting, { SETTING_KEYS } from '../../logic/useSetting';
import { loadBuilds, onBuildsChange } from '../../api/buildService';
import { receipt } from '../../logic/builds';
import { receipts, momentum } from '../../logic/receipts';
import { getObjective } from '../../data/objectives';
import { todayStr } from '../../logic/dateUtils';
import useDeliverables from '../../logic/useDeliverables';
import usePath from '../../logic/usePath';
import { deliverableCounts, milestones, statusLabel } from '../../logic/deliverables';
import { UNIT_BY_ID } from '../../data/units';
import { loadRatings, onRatingsChange } from '../../api/lifeAreaRatings';

export function YouHeader({ onClose }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.sm }}>
      <Text style={{ flex: 1, fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }} accessibilityRole="header">You</Text>
      <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close You"
        style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg2 }}>
        <Ionicons name="chevron-up" size={20} color={c.text2} />
      </TouchableOpacity>
    </View>
  );
}

// The crest menu's Search, as a bar (it opens the command palette).
export function YouSearch({ onOpen }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  return (
    <TouchableOpacity onPress={onOpen} accessibilityRole="search" accessibilityLabel="Search Deskartes"
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 11,
        borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, marginBottom: s.md }}>
      <Ionicons name="search" size={16} color={c.text3} />
      <Text style={{ flex: 1, fontSize: t.sm, color: c.text3 }}>Search for a screen, a tool or a class</Text>
    </TouchableOpacity>
  );
}

// Your life areas: the old Library → Life page, now part of You (§2.1).
// "The ground" (P6): each area's latest rating out of 5 and, once it has
// two, then vs now. The shakiest answer being the ground puts a Ground fix
// first, one tap away.
export function YouGround({ onOpenArea, onOpenPath }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { isFeatureShown, experienceMode } = useAccess();
  const { user } = useUserProgress();
  const { groundFirst } = usePath();
  const [ratings, setRatings] = useState([]);
  const userId = user?.id || null;
  useEffect(() => {
    let alive = true;
    loadRatings(userId).then(l => { if (alive) setRatings(l); }).catch(() => {});
    const off = onRatingsChange((uid, l) => { if ((uid || null) === userId) setRatings(l); });
    return () => { alive = false; off(); };
  }, [userId]);
  if (experienceMode !== 'auto' && !isFeatureShown('life-areas')) return null;
  const of = (id) => {
    const mine = ratings.filter(x => x.area === id);
    if (!mine.length) return null;
    const now = mine[mine.length - 1].rating;
    return { now, change: mine.length > 1 ? now - mine[0].rating : null };
  };
  return (
    <View style={{ marginTop: s.lg }}>
      <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: 2 }}>The ground</Text>
      <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.sm }}>How each part of your life is going, 1 to 5. <Text style={{ fontWeight: t.bold, color: c.text2 }}>Tap one</Text> to rate it.</Text>
      {groundFirst && !!onOpenPath && (
        <TouchableOpacity onPress={onOpenPath} accessibilityRole="button" accessibilityLabel="Start a Ground fix"
          style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.md, marginBottom: s.sm, borderRadius: r.lg, borderWidth: 1, borderColor: accent.primary, backgroundColor: accent.primary + '10' }}>
          <Ionicons name="leaf-outline" size={16} color={accent.primary} />
          <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>You said the ground feels shakiest. <Text style={{ fontWeight: t.bold }}>One small fix first.</Text></Text>
          <Ionicons name="chevron-forward" size={15} color={accent.primary} />
        </TouchableOpacity>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
        {LIFE_AREAS.map(area => {
          const tint = area.color || c.teal;
          const rt = of(area.id);
          const trend = rt?.change == null ? '' : rt.change > 0 ? `, up ${rt.change} since your first rating` : rt.change < 0 ? `, down ${-rt.change} since your first rating` : ', same as your first rating';
          return (
            <TouchableOpacity key={area.id} onPress={() => onOpenArea(area.id)} accessibilityRole="button"
              accessibilityLabel={`${area.label}${rt ? `, ${rt.now} out of 5${trend}` : ', not rated yet'}. Open this life area`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: r.full,
                backgroundColor: tint + '18', borderWidth: 1, borderColor: tint + '55' }}>
              {!!area.icon && <Ionicons name={area.icon} size={14} color={tint} />}
              <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{area.label}</Text>
              {!!rt && <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text2 }}>{rt.now}/5</Text>}
              {!!rt?.change && <Ionicons name={rt.change > 0 ? 'arrow-up' : 'arrow-down'} size={12} color={c.text2} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function FooterRow({ icon, label, sub, onPress, c, t, s }) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={sub ? `${label}. ${sub}` : label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: 12 }}>
      <Ionicons name={icon} size={19} color={c.text2} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.md, fontWeight: '600', color: c.text1 }}>{label}</Text>
        {!!sub && <Text style={{ fontSize: t.xs, color: c.text3 }}>{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={15} color={c.text4} />
    </TouchableOpacity>
  );
}

/**
 * The footer. `go(key)` is YouScreen's: it leaves You, then opens the row.
 * Guests get Sign in; an account gets Notifications and Insights.
 */
export function YouFooter({ signedIn, go, onClose }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { isScreenVisible } = useAccess();
  const [signIn, setSignIn] = useState(false);
  const rows = [
    { key: 'next', icon: 'chatbubble-ellipses-outline', label: "What's next?", sub: 'Your guide, on the step you are on' },
    signedIn && { key: 'notifications', icon: 'notifications-outline', label: 'Notifications' },
    { key: 'workmode', icon: 'timer-outline', label: 'Work Mode', sub: 'A focus session' },
    signedIn && { key: 'insights', icon: 'analytics-outline', label: 'Insights', sub: 'Your weeks in real life' },
    { key: 'yours', icon: 'options-outline', label: 'Make it yours', sub: 'Look, layout and features' },
    { key: 'settings', icon: 'settings-outline', label: 'Settings', sub: 'Account, reminders, privacy' },
    // My class: only with Organizations switched on.
    signedIn && isScreenVisible('Organization') && { key: 'organization', icon: 'school-outline', label: 'My class', sub: 'A class, team or group you joined' },
    { key: 'about', icon: 'information-circle-outline', label: 'About this page', sub: 'What the page you were on is for' },
    { key: 'tour', icon: 'map-outline', label: 'Show me around' },
    { key: 'help', icon: 'help-circle-outline', label: 'Help' },
  ].filter(Boolean);
  return (
    <View style={{ marginTop: s.xl }}>
      {/* Which profile the app is showing ("Day Job", "Home"). It sat in the top bar. */}
      {signedIn && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
          <Text style={{ fontSize: t.sm, color: c.text3 }}>Profile</Text>
          <ProfileSwitcher />
        </View>
      )}
      <View style={{ borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, paddingHorizontal: s.lg }}>
        {rows.map(({ key, ...row }) => <FooterRow key={key} {...row} onPress={() => go(key)} c={c} t={t} s={s} />)}
        {!signedIn && <FooterRow icon="log-in-outline" label="Sign in" sub="Your progress, on any device" onPress={() => setSignIn(true)} c={c} t={t} s={s} />}
      </View>
      <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close You"
        style={{ alignSelf: 'center', alignItems: 'center', marginTop: s.lg, padding: s.sm }}>
        <Ionicons name="chevron-up" size={22} color={c.text3} />
        <Text style={{ fontSize: t.xs, color: c.text3 }}>Close</Text>
      </TouchableOpacity>
      <Modal visible={signIn} animationType="slide" onRequestClose={() => setSignIn(false)}>
        <LoginScreen onSuccess={() => setSignIn(false)} onClose={() => setSignIn(false)} />
      </Modal>
    </View>
  );
}

/**
 * Receipts, not a score (shake-up P5, §6.2): what you made, tried and did,
 * from what's already saved. Before units and deliverables (P6) that's your
 * Builds, your goal steps and the Finds you tried. Momentum sits under it
 * (switchable), and your level last, in small type: it's below the dream.
 */
export function YouReceipts({ userId, onSeeAll }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { completedObjectiveIds = [], activeObjective } = useAccess();
  const { streakDays, profile, level } = useUserProgress();
  const [findState] = useSetting(SETTING_KEYS.TODAYS_FIND, null);
  const [showMomentum, setShowMomentum] = useSetting(SETTING_KEYS.SHOW_MOMENTUM, true);
  const [builds, setBuilds] = useState([]);

  useEffect(() => {
    let alive = true;
    const take = (list) => { if (alive) setBuilds((list || []).map(b => ({ receipt: receipt(b) }))); };
    loadBuilds(userId || null).then(take).catch(() => {});
    const off = onBuildsChange((uid, list) => { if ((uid || null) === (userId || null)) take(list); });
    return () => { alive = false; off(); };
  }, [userId]);

  const stepsDone = completedObjectiveIds.reduce((n, id) => n + (getObjective(id)?.steps?.length || 0), 0)
    + (activeObjective?.active ? activeObjective.done || 0 : 0);
  const tastes = Array.isArray(findState?.tried) ? findState.tried.length : 0;
  const { list: work } = useDeliverables();
  const rc = receipts({ builds, stepsDone, tastes, work: deliverableCounts(work) });
  // The firsts, with their dates (§6): never a count to chase.
  const firsts = milestones({ deliverables: work });
  const mom = momentum({ runDays: streakDays, lastActive: profile?.last_active_date, today: todayStr() });

  return (
    <TourSpot id="profile-rank" style={{ width: '100%' }}>
      <View style={{ width: '100%', marginTop: s.md, padding: s.lg, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border }}>
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }} accessibilityRole="header">Receipts</Text>
        {rc.empty ? (
          <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4 }}>What you <Text style={{ fontWeight: t.bold, color: c.text2 }}>make</Text>, try and finish shows up here. Start with one thing.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.md, marginTop: s.sm }}>
            {rc.items.map(it => (
              <View key={it.key} style={{ minWidth: 88 }} accessible accessibilityLabel={`${it.value} ${it.label}`}>
                <Text style={{ fontSize: t.xl, fontWeight: '800', color: accent.primary }}>{it.value}</Text>
                <Text style={{ fontSize: t.xs, color: c.text2 }}>{it.label}</Text>
              </View>
            ))}
          </View>
        )}
        {!!firsts.length && (
          <View style={{ marginTop: s.md, gap: 4 }}>
            {firsts.map(m => (
              <View key={m.key} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
                <Ionicons name="flag-outline" size={13} color={c.text3} />
                <Text style={{ flex: 1, fontSize: t.xs, color: c.text2 }}>{m.label}</Text>
                <Text style={{ fontSize: t.xs, color: c.text3 }}>{shortDate(m.at)}</Text>
              </View>
            ))}
          </View>
        )}
        {showMomentum !== false && !!mom.line && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginTop: s.md }}>
            <Ionicons name={mom.comeback ? 'hand-right-outline' : 'checkmark-circle-outline'} size={16} color={accent.primary} />
            <Text style={{ flex: 1, fontSize: t.sm, color: c.text2 }}>{mom.line}</Text>
            <TouchableOpacity onPress={() => setShowMomentum(false)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Hide this line">
              <Text style={{ fontSize: t.xs, color: c.text3 }}>Hide</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s.md }}>
          <Text style={{ flex: 1, fontSize: 11, color: c.text3 }}>Level {level || 1}</Text>
          {!!onSeeAll && (
            <TouchableOpacity onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="See all numbers">
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>See all numbers →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TourSpot>
  );
}

const shortDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Your shelf (shake-up P6): the work you handed in, newest first, each back
 * to its unit. The Showcase is where you show it to others.
 *   onOpen(screen, params)  You's: leaves You, then opens it
 */
export function YouShelf({ onOpen }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { list } = useDeliverables();
  const { accessFor } = useAccess();
  const done = list.filter(d => d.status === 'handed' || d.status === 'shown')
    .sort((a, b) => String(b.snapshotAt || '').localeCompare(String(a.snapshotAt || '')));
  if (!done.length) return null;
  const showcase = accessFor?.('portfolio')?.available;
  return (
    <View style={{ width: '100%', marginTop: s.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: s.sm }}>
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }} accessibilityRole="header">Your shelf</Text>
        {showcase && (
          <TouchableOpacity onPress={() => onOpen('PortfolioScreen')} accessibilityRole="button" accessibilityLabel="Open your Showcase">
            <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>Showcase →</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, overflow: 'hidden' }}>
        {done.slice(0, 5).map((d, i) => (
          <TouchableOpacity key={d.id} onPress={() => onOpen('UnitScreen', { unitId: d.unitKey })} accessibilityRole="button"
            accessibilityLabel={`${d.title}. ${statusLabel(d)}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingHorizontal: s.md, paddingVertical: 11, borderTopWidth: i ? 0.5 : 0, borderTopColor: c.border }}>
            <Ionicons name={d.status === 'shown' ? 'star' : 'checkmark-done-circle'} size={18} color={accent.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }} numberOfLines={1}>{d.title}</Text>
              <Text style={{ fontSize: t.xs, color: c.text3 }} numberOfLines={1}>{[UNIT_BY_ID[d.unitKey]?.label, statusLabel(d), shortDate(d.snapshotAt)].filter(Boolean).join(' · ')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
