// src/screens/HelpScreen.js
// Help & FAQ — reachable from the floating action button anywhere in the app.
// Shows a "this screen" card (when we know where the user came from) plus a
// general FAQ accordion covering every major area of ChillApp.

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useTour } from '../../context/TourContext';
import { SCREEN_HELP } from '../data/screenHelp';

// ─── Per-screen "what is this?" copy ──────────────────────────────────────────
// Keyed by the route name as React Navigation reports it (getCurrentRoute().name).
// Screens not listed here just skip the "About this screen" card.

// ─── General FAQ ───────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: 'How do points and rank work?',
    a: 'You earn points by completing daily missions, planner items, and training games. Your total points determine your rank, shown by the crest in the top bar and on your Profile.',
  },
  {
    q: 'What’s the difference between the Capture Inbox and Notes?',
    a: 'Capture Inbox is a temporary landing zone — jot anything down fast, then decide later where it really belongs (a project, your notes, the planner, a life area, etc.). Notes is the permanent home for quick written thoughts once you’ve decided that’s where something lives.',
  },
  {
    q: 'How do reminders work?',
    a: 'Two kinds: Calendar/Planner reminders, which you add yourself with a specific time (15 min, 30 min, 1 hour ahead, etc.); and Daily Reminders (Settings → Notifications), which nudge you in the evening if today\'s tasks are still open or your streak is at risk — no setup needed beyond flipping it on.',
  },
  {
    q: 'How does linking a parent/child account work?',
    a: 'Open Family (Settings → Family) on the child\'s account and generate an invite code — it\'s valid for 15 minutes. Enter that code in Family on the parent\'s account to link. It\'s read-only: a linked parent sees level, XP, points, and streak, and can\'t change anything on the child\'s account. Either side can unlink at any time.',
  },
  {
    q: 'What happens when I delete something?',
    a: 'Most deletable items (projects, notes, ideas, research) go to Recently Deleted first, inside the Capture Inbox screen, and are kept for a set number of days before being permanently removed — so accidental deletes are recoverable.',
  },
  {
    q: 'How do I start a new project?',
    a: 'Open the Workshop (Library → Projects) and tap the + button, or use the floating + button anywhere and choose "New Project."',
  },
  {
    q: 'Can I use ChillApp offline?',
    a: 'Some data is cached locally, but most features (planner, projects, notes) need a connection to sync with your account.',
  },
  {
    q: 'How do I switch between light and dark mode?',
    a: 'Go to Settings and toggle the theme, or leave it set to follow your device’s system setting.',
  },
  {
    q: 'Where do I manage my account or sign out?',
    a: 'Tap your crest/avatar (top-left, or the floating profile button) to open your Profile, or go to Settings for account-level options.',
  },
  {
    q: 'I’m stuck or found a bug — what do I do?',
    a: 'Check Settings for a contact/support option. In the meantime, most screens have their own explanation — tap Help from the floating button while on that screen for context-specific guidance.',
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
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
              No specific guide for this screen yet — the FAQ below covers the rest of ChillApp.
            </Text>
          </View>
        )}

        {/* FAQ */}
        <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.md }}>
          Frequently Asked Questions
        </Text>
        {FAQ.map((item, i) => {
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
                <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 20, paddingHorizontal: s.md, paddingBottom: s.md }}>
                  {item.a}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export { SCREEN_HELP };
