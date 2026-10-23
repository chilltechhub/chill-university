// src/components/TodaysFind.js
// One useful tool or idea a day, on Home under the Dream
// (docs/refocus-plan-2026-10-18.md: Find → Understand → Use → Remember).
//
// The Finds are the Vault's curated Discover list (src/api/findsCatalog.js),
// picked by src/logic/todaysFind.js: the person's own life areas first, the
// same one all day, never one they've tried or waved off.
//
//   Open it      opens the tool in its own app or site
//   I tried it   saves it to the Vault with a use (Used 1×), and the card
//                stays on it for the day: one a day, never a feed
//   Not for me   the next one, a few times a day; then More Finds
//   More Finds   the Vault's Discover tab, on this Find's life area
//   Make with it after trying it: a Studio Build in the medium that fits
//                the Find's area (docs/studio-plan.md: find → make)
//
// variant 'card' is Home's full view; 'calm' is one line inside Calm Home.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { useAccess } from '../../context/AccessContext';
import { Card, Eyebrow, Button } from './ui';
import { calmEyebrow } from './CalmKit';
import TourSpot from './TourSpot';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { todayStr } from '../logic/dateUtils';
import { ageBandFor } from '../logic/profileResolver';
import { loadFinds, findAllowed, markFindTried, BUNDLED_FINDS } from '../api/findsCatalog';
import {
  pickTodaysFind, findKey, readFindState, declinesLeft, withDecline, withTried, EMPTY_FIND_STATE,
} from '../logic/todaysFind';
import { recordAction } from '../logic/gamificationService';

// The catalog's areaId values are the eight life areas (plus 'general').
// Labels inline rather than importing LifeAreaScreen into Home's tree.
const AREA_LABEL = {
  physical: 'Physical', mental: 'Mental', social: 'Social', financial: 'Financial',
  creative: 'Creative', professional: 'Professional', spiritual: 'Spiritual', digital: 'Digital',
};

// Which Studio Build a Find leads to, by its life area. Areas with no
// natural thing to make (yet) offer none.
const MAKE_FOR_AREA = { creative: 'beat', professional: 'business', financial: 'business', digital: 'page', social: 'page', general: 'ai' };

export default function TodaysFind({ userId, variant = 'card', pal }) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s } = useTheme();
  const { profile } = useUserProgress();
  const { signalAction } = useAccess();
  const [stateRaw, setStateRaw, ready] = useSetting(SETTING_KEYS.TODAYS_FIND, EMPTY_FIND_STATE);
  const [finds, setFinds] = useState(BUNDLED_FINDS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    loadFinds().then(list => { if (alive) setFinds(list); });
    return () => { alive = false; };
  }, []);

  const day = todayStr();
  const state = readFindState(stateRaw);
  const band = ageBandFor(profile);
  const areas = Array.isArray(profile?.active_life_areas) ? profile.active_life_areas : [];
  const allowed = useMemo(() => finds.filter(f => findAllowed(f, band)), [finds, band]);

  const triedToday = state.triedDay === day
    ? allowed.find(f => findKey(f) === state.triedKey) || null
    : null;
  const find = triedToday || pickTodaysFind(allowed, {
    day, seed: userId || 'guest', areas, skip: [...state.tried, ...state.declined],
  });

  if (!ready || !find) return null;

  const areaLabel = AREA_LABEL[find.areaId];
  const left = declinesLeft(state, day);

  const open = () => {
    signalAction('find-opened');
    Linking.openURL(find.url).catch(() => {});
  };
  const tried = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (userId) await markFindTried(userId, find, { note: "Tried it from Today's Find" });
      setStateRaw(withTried(state, find, day));
      signalAction('find-tried');
      recordAction('taste_logged', find.id);
    } finally {
      setBusy(false);
    }
  };
  const notForMe = () => setStateRaw(withDecline(state, find, day));
  const makeKind = MAKE_FOR_AREA[find.areaId] || null;
  const makeWith = () => {
    navigation.navigate('Library');
    setTimeout(() => navigation.navigate('Library', { screen: 'StudioScreen', params: { start: makeKind, at: Date.now() } }), 0);
  };
  const more = () => navigation.navigate('KnowledgeScreen', {
    initialTab: 'discover', ...(find.areaId && find.areaId !== 'general' ? { initialArea: find.areaId } : {}),
  });

  // ── Calm Home: one line ───────────────────────────────────────────────────
  if (variant === 'calm' && pal) {
    return (
      <TouchableOpacity onPress={open} accessibilityRole="link" accessibilityLabel={`Today's Find: ${find.title}. Open it`}
        style={{ marginTop: s.md, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ ...calmEyebrow, color: pal.eyebrow }}>Today's Find</Text>
        <Text style={{ flex: 1, fontSize: 14, color: pal.text2 }} numberOfLines={1}>
          {find.emoji ? `${find.emoji} ` : ''}<Text style={{ fontWeight: '800', color: pal.text }}>{find.title}</Text>
          {triedToday ? ' · tried' : ''}
        </Text>
        <Ionicons name="open-outline" size={14} color={pal.text2} />
      </TouchableOpacity>
    );
  }

  // ── Full Home ─────────────────────────────────────────────────────────────
  return (
    <View style={{ marginHorizontal: s.lg }}>
      <TourSpot id="home-todays-find">
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Eyebrow style={{ flex: 1 }}>Today's Find{areaLabel ? ` · ${areaLabel}` : ''}</Eyebrow>
            {!triedToday && (
              <TouchableOpacity onPress={more} hitSlop={8} accessibilityRole="button" accessibilityLabel="More Finds">
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text2 }}>More Finds</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.sm }}>
            {!!find.emoji && <Text style={{ fontSize: 22, lineHeight: 28 }}>{find.emoji}</Text>}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, lineHeight: 24 }}>{find.title}</Text>
              {!!find.desc && <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 2 }}>{find.desc}</Text>}
              {!!find.insteadOf && (
                <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text2, marginTop: 4 }}>Free instead of {find.insteadOf}</Text>
              )}
            </View>
          </View>
          {!!find.summary && !triedToday && (
            <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginTop: s.sm }}>{find.summary}</Text>
          )}

          {triedToday ? (
            <View style={{ marginTop: s.md }}>
              <Text style={{ fontSize: t.sm, color: c.text2 }}>
                <Text style={{ fontWeight: t.bold, color: c.text1 }}>Nice. You tried it.</Text>{userId ? " It's in your Vault." : ''} Next Find <Text style={{ fontWeight: t.bold, color: c.text1 }}>tomorrow</Text>.
              </Text>
              <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>
                {makeKind ? (
                  <Button label="Make something with it" icon="color-wand-outline" size="sm" fullWidth={false} onPress={makeWith} />
                ) : (
                  <Button label="Open it" icon="open-outline" size="sm" variant="secondary" fullWidth={false} onPress={open} />
                )}
                <Button label="More Finds" size="sm" variant="ghost" fullWidth={false} onPress={more} />
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginTop: s.md }}>
              <Button label="Open it" icon="open-outline" size="sm" fullWidth={false} onPress={open} />
              <Button label="I tried it" icon="checkmark" size="sm" variant="secondary" fullWidth={false} onPress={tried} busy={busy} />
              {left > 0 && (
                <Button label="Not for me" size="sm" variant="ghost" fullWidth={false} onPress={notForMe}
                  accessibilityLabel={`Not for me. Show a different Find`} />
              )}
            </View>
          )}
        </Card>
      </TourSpot>
    </View>
  );
}
