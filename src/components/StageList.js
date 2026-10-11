// src/components/StageList.js
// Every stage of this account's path, by name, locked ones included.
//
// "Show me all the stages titles even the locked ones" (2026-10-10): the app
// only ever named the NEXT stage, so nobody could see where the path went
// or how far along it they were. Used on Home's goal card (behind "See all
// stages") and on App Nav, which also shows each stage's one-line blurb.

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAccess } from '../../context/AccessContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { pathFor } from '../logic/experienceStage';

export default function StageList({ showBlurbs = false, style }) {
  const { colors: c, typography: t, spacing: s, accent } = useTheme();
  const { stage, experienceMode } = useAccess();
  const { activeType } = useProfiles();
  const path = pathFor(activeType);
  // "Show me everything" opens the lot, so every stage reads as open.
  const reached = experienceMode === 'full' ? path.length : stage;

  return (
    <View style={style}>
      {path.map((st, i) => {
        const n = i + 1;
        const open = n <= reached;
        const current = n === reached && experienceMode !== 'full';
        return (
          <View
            key={`${st.key}-${n}`}
            accessible
            accessibilityLabel={`Stage ${n}: ${st.label}. ${open ? (current ? 'You are here' : 'Open') : 'Locked'}`}
            style={{ flexDirection: 'row', alignItems: showBlurbs ? 'flex-start' : 'center', gap: s.sm, paddingVertical: 5 }}
          >
            <Ionicons
              name={open ? (current ? 'location' : 'checkmark-circle') : 'lock-closed-outline'}
              size={15}
              color={open ? (current ? accent.primary : c.success) : c.text4}
              style={showBlurbs ? { marginTop: 1 } : null}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.xs, color: open ? c.text1 : c.text3, fontWeight: current ? t.bold : t.regular }}>
                <Text style={{ color: c.text3 }}>{n}. </Text>{st.label}{current ? '  · you are here' : ''}
              </Text>
              {showBlurbs && !!st.blurb && (
                <Text style={{ fontSize: 11, color: c.text3, lineHeight: 15, marginTop: 1 }}>{st.blurb}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
