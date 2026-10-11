// src/screens/HelpScreen.js
// Help & FAQ — reachable from the floating action button anywhere in the app.
// Shows a "this screen" card (when we know where the user came from) plus a
// general FAQ accordion covering every major area of Deskartes.

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useTour } from '../../context/TourContext';
import { SCREEN_HELP } from '../data/screenHelp';
import { useAccess } from '../../context/AccessContext';
import { SUPPORT_EMAIL } from '../config/legal';
import RichText from '../components/RichText';

// ─── Per-screen "what is this?" copy ──────────────────────────────────────────
// Keyed by the route name as React Navigation reports it (getCurrentRoute().name).
// Screens not listed here just skip the "About this screen" card.

// ─── General FAQ ───────────────────────────────────────────────────────────────
// Short answers, the key words in **bold** (RichText renders them). The
// names match the screens: Vault, Workshop, the picture menu (top left).
const FAQ = [
  {
    q: 'How do points and levels work?',
    a: 'You earn points for **daily drills**, **planner items**, **project steps** and **games**. Points raise your **level**, shown at the top of every screen.',
  },
  {
    q: 'Inbox or Vault: where does something go?',
    a: '**Inbox** = jot it now, sort it later. **Vault** = things you keep: notes, links and tools. From the Inbox, tap an item to send it to the Vault, the Planner or a project.',
  },
  {
    q: 'How do reminders work?',
    a: 'Give a Planner item a **time** and turn on **Reminder**. Or tap the **bell** → **New reminder**. **Daily Reminders** (Settings → Notifications) nudge you if your streak is at risk.',
  },
  {
    q: 'How does linking a parent and child account work?',
    a: 'On the child\'s account: **Settings → Family → make a code** (valid 15 minutes). Enter it on the parent\'s account. **Read-only**: the parent sees level, points and streak, nothing else. Either side can unlink.',
  },
  {
    q: 'What happens when I delete something?',
    a: 'It goes to **Recently Deleted** (Inbox → Deleted) for a few days, so you can **undo** it.',
  },
  {
    q: 'How do I start a project?',
    a: 'Tap **+** → **New Project**. Or **Library → Build → The Workshop → New Project**.',
  },
  {
    q: 'Can I use Deskartes offline?',
    a: 'You can see what was last loaded, and new notes wait to sync. Most things need a connection.',
  },
  {
    q: 'How do I switch light and dark mode?',
    a: '**Settings → Appearance → Mode**.',
  },
  {
    q: 'Where do I manage my account or sign out?',
    a: 'Tap **your picture** (top left) → **Settings**. Sign Out is near the bottom.',
  },
  {
    q: 'What’s free, and what’s in Plus?',
    plusOnly: true,
    a: '**Free, and staying free**: learning, games, classes, the Planner, capture, projects and Fill with AI. **Plus** (optional subscription) adds the business and startup courses (the first lesson of each level is free), Deep Insights, AI Import, Custom Objectives and Organizations. The Plus screen shows the price before you buy.',
  },
  {
    q: 'How do I cancel or restore Plus?',
    plusOnly: true,
    a: 'Cancel in your **App Store or Google Play** subscriptions at least **24 hours** before the period ends; you keep Plus until then. Deleting the app or your account does **not** cancel a store subscription. New phone: open Plus and tap **Restore purchases**.',
  },
  {
    q: 'Why can’t I see some tools?',
    a: 'Some open **as you use the app**: **App Nav** lists what opens each one. Some courses and community features are limited by **age**.',
  },
  {
    q: 'How do I delete my account or get a copy of my data?',
    a: '**Settings → Export My Data** for a copy. **Settings → Delete Account** removes everything for good (you type DELETE to confirm). A parent can also email ' + SUPPORT_EMAIL + ' to delete a child’s account.',
  },
  {
    q: 'I’m stuck or found a bug. What do I do?',
    a: 'Email **' + SUPPORT_EMAIL + '** (Settings → Contact support) and say what you were doing. For help on any screen: tap **your picture** → **Screen Tutorial**.',
  },
];

function ChevronRow({ open }) {
  const { colors: c } = useTheme();
  return <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={c.text4} />;
}

export default function HelpScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { startTour } = useTour();
  // Plus questions only once Plus can actually be bought.
  const { plusOnSale } = useAccess();
  const fromScreen = route.params?.fromScreen;
  const screenInfo = fromScreen ? SCREEN_HELP[fromScreen] : null;
  const [openIdx, setOpenIdx] = useState(screenInfo ? -1 : 0);

  const takeTour = () => {
    navigation.navigate('MainTabs');
    setTimeout(startTour, 300);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: s.md,
        paddingHorizontal: s.lg, paddingTop: s.md, paddingBottom: s.md,
        backgroundColor: c.headerBg, borderBottomWidth: 0.5, borderBottomColor: c.border,
      }}>
        <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1 }}>Help & FAQ</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
        {/* Guided tour */}
        <TouchableOpacity
          onPress={takeTour}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: s.md,
            backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg,
            borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.gold,
            marginBottom: s.lg,
          }}
        >
          <Ionicons name="school-outline" size={22} color={c.gold} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Take the Guided Tour</Text>
            <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>A minute-long walkthrough of the app's main features</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.text4} />
        </TouchableOpacity>

        {/* About this screen */}
        {screenInfo && (
          <View style={{
            backgroundColor: c.tealLight, borderRadius: r.lg, padding: s.lg,
            borderWidth: 1, borderColor: c.teal + '55', marginBottom: s.xl,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
              <Ionicons name="information-circle" size={18} color={c.teal} />
              <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.bold, textTransform: 'uppercase', letterSpacing: 1 }}>
                About this screen
              </Text>
            </View>
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: 4 }}>{screenInfo.title}</Text>
            <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>{screenInfo.body}</Text>
          </View>
        )}
        {fromScreen && !screenInfo && (
          <View style={{
            backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg,
            borderWidth: 0.5, borderColor: c.border, marginBottom: s.xl,
          }}>
            <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 20 }}>
              No specific guide for this screen yet — the FAQ below covers the rest of Deskartes.
            </Text>
          </View>
        )}

        {/* FAQ */}
        <Text style={{ fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.md }}>
          Frequently Asked Questions
        </Text>
        {FAQ.filter(item => !item.plusOnly || plusOnSale).map((item, i) => {
          const open = openIdx === i;
          return (
            <View key={i} style={{
              backgroundColor: c.bg1, borderRadius: r.md, marginBottom: s.sm,
              borderWidth: 0.5, borderColor: c.border, overflow: 'hidden',
            }}>
              <TouchableOpacity
                onPress={() => setOpenIdx(open ? -1 : i)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.md }}
              >
                <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{item.q}</Text>
                <ChevronRow open={open} />
              </TouchableOpacity>
              {open && (
                <RichText style={{ fontSize: t.sm, color: c.text3, lineHeight: 20, paddingHorizontal: s.md, paddingBottom: s.md }} boldStyle={{ color: c.text1 }}>{item.a}</RichText>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export { SCREEN_HELP };
