// src/components/AboutPageSheet.js
// "About this page" (docs/shake-up-plan-2026-10-21.md §7.3, P7): one sheet,
// four short parts, from src/data/pageInfo.js: what this is for, how it
// helps you (your path and starting point), what you can do here (each a
// button that does it), and Show me (the page's spotlight).
//
// Mounted once in App.js, outside the screens (it gets the navigation ref,
// like the + button). Anything opens it with openAboutPage(route, params)
// (src/logic/guide/guideState.js). It always works: the "Page notes" switch
// only silences the automatic notes.

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useTour } from '../../context/TourContext';
import RichText from './RichText';
import usePath from '../logic/usePath';
import { onAboutPage, getTodayView } from '../logic/guide/guideState';
import { surfaceForRoute } from '../logic/guide/surfaces';
import { pageInfoFor } from '../data/pageInfo';
import { goToScreen } from '../logic/appRoutes';
import { peekSetting, SETTING_KEYS } from '../logic/useSetting';
import { Sheet, Button } from '../ui';

export default function AboutPageSheet({ navigationRef }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { startLesson } = useTour();
  const { pathKey, startPoint } = usePath();
  const [at, setAt] = useState(null); // { route, params }

  useEffect(() => onAboutPage(setAt), []);
  if (!at) return null;

  const calm = peekSetting(SETTING_KEYS.HOME_VIEW, 'full') === 'calm';
  const surface = surfaceForRoute(at.route, { params: at.params, calm, view: getTodayView() });
  const info = pageInfoFor(surface, at.route, { pathKey, startPoint });
  const close = () => setAt(null);
  const go = (a) => { close(); setTimeout(() => goToScreen(navigationRef?.current, a.screen, a.params ? { ...a.params, at: Date.now() } : undefined), 150); };
  const showMe = () => { const steps = info.show; close(); setTimeout(() => startLesson(steps), 400); };

  const label = (txt) => <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: c.text3, marginTop: s.md, marginBottom: 4 }}>{txt}</Text>;

  return (
    <Sheet visible onClose={close} eyebrow="ABOUT THIS PAGE" title={info?.title} maxHeight="80%">
          {!info ? (
            <Text style={{ fontSize: t.md, color: c.text2, marginTop: s.sm }}>Nothing written for this page yet. <Text style={{ fontWeight: t.bold }}>Help</Text> has the rest.</Text>
          ) : (
            <>
              {label('WHAT THIS IS FOR')}
              <RichText style={{ fontSize: t.md, color: c.text2 }} boldStyle={{ color: c.text1 }}>{info.what}</RichText>
              {!!info.helps && (
                <>
                  {label('HOW IT HELPS YOU')}
                  <RichText style={{ fontSize: t.md, color: c.text2 }} boldStyle={{ color: c.text1 }}>{info.helps}</RichText>
                </>
              )}
              {!!info.actions.length && (
                <>
                  {label('WHAT YOU CAN DO HERE')}
                  <View style={{ gap: s.sm }}>
                    {info.actions.map(a => (
                      <TouchableOpacity key={a.label} onPress={() => go(a)} accessibilityRole="button" accessibilityLabel={a.label}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 11, borderRadius: r.lg, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0 }}>
                        <Ionicons name={a.icon || 'arrow-forward'} size={17} color={accent.primary} />
                        <Text style={{ flex: 1, fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{a.label}</Text>
                        <Ionicons name="chevron-forward" size={15} color={c.text3} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.lg, marginTop: s.lg }}>
            {!!info?.show?.length && (
              <Button label="Show me" icon="eye-outline" size="sm" fullWidth={false} onPress={showMe} accessibilityLabel="Show me around this page" />
            )}
            <TouchableOpacity onPress={() => go({ screen: 'Help', params: { fromScreen: at.route } })} accessibilityRole="button" accessibilityLabel="Open Help">
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text3 }}>Help</Text>
            </TouchableOpacity>
          </View>
    </Sheet>
  );
}
