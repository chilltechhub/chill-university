// src/components/IkigaiCircles.js
// The four circles on You (shake-up P6): what you love, what you're good
// at, what the world needs, what you can be paid for, each filled from what
// you did and said (src/logic/ikigai.js). Not a test result: a circle with
// nothing in it says what would fill it. Your shakiest one is marked.
//
// `onGo(screen)` is You's: it leaves You, then opens the screen.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import TourSpot from './TourSpot';
import useDream from '../logic/useDream';
import usePath from '../logic/usePath';
import useDeliverables from '../logic/useDeliverables';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { ikigaiCircles } from '../logic/ikigai';
import { loadBuilds, onBuildsChange } from '../api/buildService';
import { cacheRead } from '../api/offlineCache';
import { kindOf, receipt } from '../logic/builds';
import { UNIT_BY_ID } from '../data/units';
import { valueLabel } from './DreamSheet';
import { CAREERS } from '../screens/library/careerexplore';

const TINT = { love: '#E0607E', goodAt: '#4F9D69', needs: '#3D8BD9', paid: '#D9A23D' };

export default function IkigaiCircles({ onGo }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { list, userId } = useDeliverables();
  const { dream } = useDream(userId);
  const { shakiest } = usePath();
  const [findState] = useSetting(SETTING_KEYS.TODAYS_FIND, null);
  const [builds, setBuilds] = useState([]);
  const [careerIds, setCareerIds] = useState([]);

  useEffect(() => {
    let alive = true;
    loadBuilds(userId).then(l => { if (alive) setBuilds(l || []); }).catch(() => {});
    const off = onBuildsChange((uid, l) => { if ((uid || null) === userId) setBuilds(l || []); });
    if (userId) cacheRead(`career_targets_${userId}`).then(ids => { if (alive && Array.isArray(ids)) setCareerIds(ids); }).catch(() => {});
    return () => { alive = false; off(); };
  }, [userId]);

  const model = useMemo(() => {
    const handed = list.filter(d => d.status === 'handed' || d.status === 'shown');
    return ikigaiCircles({
      made: builds.map(b => kindOf(b)?.label),
      tastes: Array.isArray(findState?.tried) ? findState.tried.length : 0,
      handedIn: handed.map(d => d.title),
      mastered: builds.reduce((n, b) => n + (receipt(b).mastered || 0), 0),
      values: (dream?.values || []).map(valueLabel),
      careers: careerIds.map(id => CAREERS.find(x => x.id === id)?.title),
      paidWork: handed.filter(d => ['money', 'career'].includes(UNIT_BY_ID[d.unitKey]?.path)).map(d => d.title),
      shakiest,
    });
  }, [list, builds, findState, dream, careerIds, shakiest]);

  return (
    <TourSpot id="you-circles" style={{ width: '100%' }}>
      <View style={{ width: '100%', marginTop: s.md }}>
        <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }} accessibilityRole="header">Your four circles</Text>
        <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2, marginBottom: s.sm }}>{model.line}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
          {model.circles.map(circle => {
            const tint = TINT[circle.key];
            return (
              <View key={circle.key} accessible accessibilityLabel={`${circle.label}${circle.shakiest ? ', your shakiest' : ''}. ${circle.items.length ? circle.items.join(', ') : circle.empty}`}
                style={{ flexGrow: 1, flexBasis: '46%', minWidth: 140, padding: s.md, borderRadius: r.xl, backgroundColor: tint + '14', borderWidth: circle.shakiest ? 1.5 : 0.5, borderColor: circle.shakiest ? tint : tint + '55' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: tint + '30' }}>
                    <Ionicons name={circle.icon} size={14} color={tint} />
                  </View>
                  <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{circle.label}</Text>
                </View>
                {circle.shakiest && <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.6, color: tint, marginTop: 6 }}>START HERE</Text>}
                {circle.items.length ? circle.items.map(it => (
                  <Text key={it} style={{ fontSize: t.xs, color: c.text2, marginTop: 4 }} numberOfLines={1}>· {it}</Text>
                )) : (
                  <>
                    <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 6 }}>{circle.empty}</Text>
                    {!!circle.go && !!onGo && (
                      <TouchableOpacity onPress={() => onGo(circle.go.screen)} accessibilityRole="button" accessibilityLabel={circle.go.label} style={{ marginTop: 6 }}>
                        <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: tint }}>{circle.go.label} →</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </TourSpot>
  );
}
