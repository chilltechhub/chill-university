// src/components/DreamCard.js
// The top of Home: the life someone wants, in their own words
// (docs/north-star.md, "Dream at the top"). Everything below it, goals,
// projects, today, is meant to point back at this.
//
// Empty, it asks once and plainly. "Later" turns the ask into a one-line
// link for two weeks: no nagging, and it never blocks anything.
//
// variant 'card' is Home's full view; 'calm' sits inside Calm Home's panel
// and uses its palette (CalmKit.js).

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Card, Eyebrow, Button } from './ui';
import { CalmPill, calmEyebrow } from './CalmKit';
import DreamSheet, { valueLabel } from './DreamSheet';
import useDream from '../logic/useDream';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { DREAM_NAME } from '../logic/dream';
import { useAccess } from '../../context/AccessContext';

const LATER_DAYS = 14;
const ASK = 'What do you want your life to look like?';

export default function DreamCard({ userId, variant = 'card', pal }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { dream, loading, empty, save } = useDream(userId);
  const [laterUntil, setLaterUntil] = useSetting(SETTING_KEYS.DREAM_LATER_UNTIL, null);
  const [open, setOpen] = useState(false);
  // Saving it ticks "Write the Dream" (What's next, unit 2). Above the early
  // return: below it, the first render had one hook fewer than the next
  // (stress test 2026-10-24, "change in the order of Hooks").
  const { signalAction } = useAccess();

  if (loading) return null;
  const snoozed = empty && laterUntil && Date.parse(laterUntil) > Date.now();
  const later = () => setLaterUntil(new Date(Date.now() + LATER_DAYS * 86400000).toISOString());
  const saveAndSignal = async (patch) => { const res = await save(patch); signalAction('dream-saved'); return res; };
  const sheet = <DreamSheet visible={open} onClose={() => setOpen(false)} dream={dream} onSave={saveAndSignal} userId={userId} />;

  const partsLine = dream?.parts?.map(p => p.label) || [];
  const valuesLine = (dream?.values || []).map(valueLabel);

  // ── Calm Home ─────────────────────────────────────────────────────────────
  if (variant === 'calm' && pal) {
    return (
      <View style={{ marginTop: s.lg }}>
        {empty ? (
          snoozed ? (
            <TouchableOpacity onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Write your dream">
              <Text style={{ fontSize: 13, color: pal.text2 }}>✦ {DREAM_NAME} · <Text style={{ fontWeight: '800', color: pal.text }}>Write a rough line</Text></Text>
            </TouchableOpacity>
          ) : (
            <View style={{ backgroundColor: pal.glass, borderWidth: 1, borderColor: pal.glassEdge, borderRadius: 22, padding: s.lg }}>
              <Text style={{ ...calmEyebrow, color: pal.eyebrow }}>{DREAM_NAME}</Text>
              <Text style={{ fontSize: 17, lineHeight: 23, fontWeight: '700', color: pal.text, marginTop: 8 }}>{ASK}</Text>
              <Text style={{ fontSize: 13, color: pal.text2, marginTop: 4 }}>Rough is fine. Change it any time.</Text>
              <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md }}>
                <CalmPill label="Write a rough line" icon="create-outline" onPress={() => setOpen(true)} pal={pal} solid />
                <CalmPill label="Later" onPress={later} pal={pal} a11y="Ask me later" />
              </View>
            </View>
          )
        ) : (
          <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.85} accessibilityRole="button"
            accessibilityLabel={`${DREAM_NAME}: ${dream.life || partsLine.join(', ')}. Edit`}>
            <Text style={{ ...calmEyebrow, color: pal.eyebrow }}>{DREAM_NAME}</Text>
            {!!dream.life && (
              <Text numberOfLines={3} style={{ fontSize: 16, lineHeight: 23, color: pal.text, marginTop: 6, fontStyle: 'italic' }}>{dream.life}</Text>
            )}
            {partsLine.length > 0 && (
              <Text style={{ fontSize: 13, color: pal.text2, marginTop: 6 }}>
                Working toward {partsLine.map((p, i) => (
                  <Text key={p}>{i ? ' · ' : ''}<Text style={{ fontWeight: '800', color: pal.text }}>{p}</Text></Text>
                ))}
              </Text>
            )}
          </TouchableOpacity>
        )}
        {sheet}
      </View>
    );
  }

  // ── Full Home ─────────────────────────────────────────────────────────────
  if (empty && snoozed) {
    return (
      <View style={{ marginHorizontal: s.lg, marginBottom: s.md }}>
        <TouchableOpacity onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Write your dream"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 }}>
          <Ionicons name="sparkles-outline" size={14} color={c.text3} />
          <Text style={{ fontSize: t.sm, color: c.text3 }}>{DREAM_NAME} · <Text style={{ fontWeight: t.bold, color: c.text2 }}>Write a rough line</Text></Text>
        </TouchableOpacity>
        {sheet}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={{ marginHorizontal: s.lg }}>
        <Card tone="accent">
          <Eyebrow>{DREAM_NAME}</Eyebrow>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, lineHeight: 24 }}>{ASK}</Text>
          <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 4 }}>Rough is fine. Change it any time.</Text>
          <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md }}>
            <Button label="Write a rough line" icon="create-outline" size="sm" fullWidth={false} onPress={() => setOpen(true)} />
            <Button label="Later" size="sm" variant="ghost" fullWidth={false} onPress={later} accessibilityLabel="Ask me later" />
          </View>
        </Card>
        {sheet}
      </View>
    );
  }

  return (
    <View style={{ marginHorizontal: s.lg }}>
      {/* Tinted: it's theirs, in their words (Home's card rule). */}
      <Card tone="accent" onPress={() => setOpen(true)} accessibilityLabel={`${DREAM_NAME}: ${dream.life || partsLine.join(', ')}. Edit`}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Eyebrow style={{ flex: 1 }}>{DREAM_NAME}</Eyebrow>
          <Ionicons name="pencil" size={14} color={c.text3} />
        </View>
        {!!dream.life && (
          <Text numberOfLines={4} style={{ fontSize: t.md, lineHeight: 22, color: c.text1, fontStyle: 'italic' }}>{dream.life}</Text>
        )}
        {partsLine.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: s.sm }}>
            {partsLine.map(p => (
              <View key={p} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: r.full, backgroundColor: accent.primaryLight }}>
                <Text style={{ fontSize: 13, fontWeight: t.bold, color: c.text1 }}>{p}</Text>
              </View>
            ))}
          </View>
        )}
        {valuesLine.length > 0 && (
          <Text style={{ fontSize: t.sm, color: c.text2, marginTop: s.sm }}>
            Matters most: <Text style={{ fontWeight: t.bold, color: c.text1 }}>{valuesLine.join(' · ')}</Text>
          </Text>
        )}
        {dream.wontTrade.length > 0 && (
          <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 2 }}>
            Won't trade: <Text style={{ fontWeight: t.bold, color: c.text1 }}>{dream.wontTrade.join(' · ')}</Text>
          </Text>
        )}
        {!!dream.becoming && (
          <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 2 }}>
            Becoming: <Text style={{ fontWeight: t.bold, color: c.text1 }}>{dream.becoming}</Text>
          </Text>
        )}
      </Card>
      {sheet}
    </View>
  );
}
