// src/components/LookAndFeel.js
// The look-and-layout controls that live on Make it yours. They used to be
// in Settings, a second home for the same choices (Settings kept Calm Home,
// backgrounds and the + corner while Make it yours had some of them too).

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { supabase } from '../api/supabaseClient';
import { STYLES, ACCENTS } from '../theme';
import { LIFE_AREAS } from '../screens/library/LifeAreaScreen';

const MODE_OPTIONS = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light',  label: 'Light',  icon: 'sunny-outline' },
  { key: 'dark',   label: 'Dark',   icon: 'moon-outline' },
];

// Mode / Style / Accent: the three appearance choices, all in ThemeContext.
export function AppearancePicker() {
  const { colors: c, typography: t, spacing: s, mode, setMode, styleName, setStyle, accentName, setAccent, accent, style, isDark } = useTheme();
  const box = { backgroundColor: c.bg1, borderRadius: style.cardRadius, padding: s.lg, marginBottom: s.md, borderWidth: style.borderWidth, borderColor: c.border };
  const heading = { fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginBottom: s.sm };
  return (
    <View style={box}>
      <Text style={heading}>Mode</Text>
      <View style={{ flexDirection: 'row', backgroundColor: c.bg2, borderRadius: style.buttonRadius, padding: 3, marginBottom: s.lg }}>
        {MODE_OPTIONS.map(m => {
          const on = mode === m.key;
          return (
            <TouchableOpacity key={m.key} onPress={() => setMode(m.key)} activeOpacity={0.8}
              accessibilityRole="button" accessibilityState={{ selected: on }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: style.buttonRadius - 2, backgroundColor: on ? c.bg1 : 'transparent' }}>
              <Ionicons name={m.icon} size={15} color={on ? accent.primary : c.text3} />
              <Text style={{ fontSize: t.sm, fontWeight: on ? t.semibold : t.medium, color: on ? c.text1 : c.text3 }}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={heading}>Style</Text>
      <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.lg }}>
        {Object.values(STYLES).map(st => {
          const on = styleName === st.name;
          return (
            <TouchableOpacity key={st.name} onPress={() => setStyle(st.name)} activeOpacity={0.85}
              accessibilityRole="button" accessibilityState={{ selected: on }}
              style={{ flex: 1, borderRadius: st.cardRadius, borderWidth: on ? 2 : 1, borderColor: on ? accent.primary : c.border, backgroundColor: c.bg0, padding: s.md }}>
              {/* A tiny sample of the style itself: its label and a card. */}
              <Text style={{ fontSize: 11, color: c.text3, ...st.sectionLabel }}>{st.name === 'plain' ? 'Today' : 'TODAY'}</Text>
              <View style={{ marginTop: 6, height: 22, borderRadius: st.cardRadius / 2, backgroundColor: c.bg1, borderWidth: st.borderWidth, borderColor: c.border, justifyContent: 'center', paddingHorizontal: 8 }}>
                <View style={{ width: '60%', height: 5, borderRadius: 3, backgroundColor: c.text4 }} />
              </View>
              <Text style={{ marginTop: s.sm, fontSize: t.sm, fontWeight: t.semibold, color: c.text1, fontFamily: st.titleFont }}>{st.label}</Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{st.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={heading}>Accent</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.lg, rowGap: s.md }}>
        {Object.entries(ACCENTS).map(([key, a]) => {
          const on = accentName === key;
          const swatch = a[isDark ? 'dark' : 'light'].primary;
          return (
            <TouchableOpacity key={key} onPress={() => setAccent(key)} activeOpacity={0.8}
              accessibilityRole="button" accessibilityLabel={`${a.label} accent`} accessibilityState={{ selected: on }}
              style={{ alignItems: 'center', gap: 4 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: on ? swatch : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: swatch, alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Ionicons name="checkmark" size={15} color={a[isDark ? 'dark' : 'light'].onPrimary} />}
                </View>
              </View>
              <Text style={{ fontSize: t.xs, color: on ? c.text1 : c.text3 }}>{a.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Which life areas you track: profiles.active_life_areas, the same column
// onboarding and the Library's "+ Add" tile write. It refreshes the shared
// profile after saving, so Home and the Library change at once (the
// Settings copy saved without telling anyone, and they showed the old
// areas until the next reload).
export function LifeAreaChips() {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const { user, profile, refreshProfile } = useUserProgress();
  const [local, setLocal] = React.useState(null);
  const saved = Array.isArray(profile?.active_life_areas) && profile.active_life_areas.length
    ? profile.active_life_areas : LIFE_AREAS.map(a => a.id);
  const active = local ?? saved;
  React.useEffect(() => { setLocal(null); }, [profile?.active_life_areas?.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (id) => {
    const next = active.includes(id) ? active.filter(x => x !== id) : [...active, id];
    if (!next.length) return; // at least one: an empty list reads as "show all"
    setLocal(next);
    if (!user?.id) return;
    const hidden = LIFE_AREAS.map(a => a.id).filter(aid => !next.includes(aid));
    const { error } = await supabase.from('profiles').update({ active_life_areas: next, hidden_life_areas: hidden }).eq('id', user.id);
    if (error) { setLocal(null); return; }
    refreshProfile?.();
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, paddingHorizontal: s.md, paddingBottom: s.md }}>
      {LIFE_AREAS.map(area => {
        const on = active.includes(area.id);
        return (
          <TouchableOpacity key={area.id} onPress={() => toggle(area.id)}
            accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={area.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: on ? area.color : c.border, backgroundColor: on ? area.color + '18' : c.bg0 }}>
            <Text style={{ fontSize: 14 }}>{area.emoji}</Text>
            <Text style={{ fontSize: t.xs, color: on ? c.text1 : c.text3, fontWeight: on ? '700' : '400' }}>{area.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
