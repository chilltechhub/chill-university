// src/screens/library/discover/FellowScholarsScreen.js
// People whose declared topics overlap yours, ranked by how much overlap.
//
// One interaction, deliberately: a high five. It's a counter — no text, no
// thread, no channel to abuse — which is exactly why it can stay open to every
// account when a message box could not. A list of people you can do literally
// nothing with reads as broken; a message box between strangers in an app with
// minors in it is a different and much larger decision.
//
// Rate-limited server-side to once per person per 24h, so it stays a signal
// rather than something to farm. get_fellow_scholars already excludes minors
// from the results entirely.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { useUIPrefs } from '../../../../context/UIPrefsContext';
import {
  getFellowScholars, blockUser, sendKudos,
  COMMUNITY_NOT_CONFIGURED, ALREADY_SENT_TODAY,
} from '../../../api/communityService';

const CREST_COLORS = {
  teal: '#2bb5a0', gold: '#c9a84c', purple: '#8b4fc4', red: '#e05858',
  blue: '#3a7bd5', green: '#3ac860', orange: '#e07a30', silver: '#9a9aa8',
};
const BADGE_EMOJIS = {
  explorer: '🧭', builder: '🏗️', scholar: '📚',
  guardian: '🛡️', pioneer: '🌟', creator: '🎨',
};

export default function FellowScholarsScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis } = useUIPrefs();

  const [people, setPeople]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const [notConfigured, setNC]  = useState(false);
  const [busyId, setBusyId]     = useState(null);

  const load = useCallback(async () => {
    try {
      setPeople(await getFellowScholars(40));
      setNC(false);
    } catch (e) {
      if (e.message === COMMUNITY_NOT_CONFIGURED) setNC(true);
      else console.warn('FellowScholars load', e.message);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefresh(true); await load(); setRefresh(false); };

  const highFive = async (person) => {
    setBusyId(person.id);
    // Optimistic — the tap should register instantly. The only realistic
    // failure is the 24h limit, and in that case the optimistic state was
    // already correct, so it's the one error we don't roll back.
    setPeople(prev => prev.map(p => p.id === person.id
      ? { ...p, kudos_sent_recently: true, kudos_received: (p.kudos_received || 0) + 1 }
      : p));
    try {
      const total = await sendKudos(person.id);
      setPeople(prev => prev.map(p => p.id === person.id ? { ...p, kudos_received: total } : p));
    } catch (e) {
      if (e.message !== ALREADY_SENT_TODAY) {
        setPeople(prev => prev.map(p => p.id === person.id
          ? { ...p, kudos_sent_recently: false, kudos_received: Math.max(0, (p.kudos_received || 1) - 1) }
          : p));
      }
    }
    setBusyId(null);
  };

  const promptBlock = (person) => {
    Alert.alert(`Hide ${person.display_name}?`, 'You will stop seeing them here and in every community feed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Hide', style: 'destructive', onPress: async () => {
        setPeople(prev => prev.filter(p => p.id !== person.id));
        try { await blockUser(person.id); } catch { load(); }
      } },
    ]);
  };

  const Header = (
    <View style={{ backgroundColor: c.headerBg, padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
      <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>
        {showEmojis ? '🎓 ' : ''}Fellow Scholars
      </Text>
      <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3 }}>People learning what you&apos;re learning</Text>
    </View>
  );

  if (notConfigured) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg0 }}>
        {Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xl }}>
          <Ionicons name="cloud-offline-outline" size={44} color={c.text4} style={{ marginBottom: s.lg }} />
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' }}>
            Community isn&apos;t switched on yet
          </Text>
          <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20 }}>
            Run the community_discover migration and this section fills in.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {Header}
      {loading ? <ActivityIndicator color={c.teal} style={{ marginTop: 48 }} /> : (
        <ScrollView
          contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
        >
          {people.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 56 }}>
              {showEmojis
                ? <Text style={{ fontSize: 48, marginBottom: s.lg }}>🎓</Text>
                : <Ionicons name="school-outline" size={44} color={c.teal} style={{ marginBottom: s.lg }} />}
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' }}>
                Nobody to show yet
              </Text>
              <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20 }}>
                As more people join and pick their topics, the ones closest to your interests
                show up here. Adding topics in Settings sharpens the match.
              </Text>
            </View>
          ) : people.map(person => {
            const crest = CREST_COLORS[person.suit_color] || c.teal;
            const topics = (person.topics || '')
              .replace(/^\{|\}$/g, '')
              .split(',')
              .map(x => x.trim().replace(/^"|"$/g, ''))
              .filter(Boolean)
              .slice(0, 4);
            const sent = !!person.kudos_sent_recently;
            return (
              <View key={person.id}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.md, backgroundColor: c.bg1,
                         borderRadius: r.lg, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: crest,
                               backgroundColor: crest + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 17 }}>{BADGE_EMOJIS[person.badge] || '🧭'}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }} numberOfLines={1}>
                    {person.display_name}
                  </Text>
                  <Text style={{ fontSize: 11, color: crest, fontWeight: '600', marginTop: 1 }}>
                    LV {person.level}
                    {person.shared_topics > 0 && ` · ${person.shared_topics} topic${person.shared_topics === 1 ? '' : 's'} in common`}
                  </Text>
                  {topics.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: s.sm }}>
                      {topics.map((topic, i) => (
                        <View key={i} style={{ backgroundColor: c.bg0, borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 0.5, borderColor: c.border }}>
                          <Text style={{ fontSize: 10, color: c.text3 }}>{topic}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={{ alignItems: 'flex-end', gap: s.sm }}>
                  <TouchableOpacity onPress={() => promptBlock(person)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="ellipsis-horizontal" size={15} color={c.text4} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={sent || busyId === person.id}
                    onPress={() => highFive(person)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: r.full,
                             paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1,
                             backgroundColor: sent ? c.teal + '1f' : c.bg0,
                             borderColor: sent ? c.teal : c.border }}>
                    <Ionicons name={sent ? 'checkmark' : 'hand-right-outline'} size={12}
                      color={sent ? c.teal : c.text3} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: sent ? c.teal : c.text3 }}>
                      {person.kudos_received > 0 ? person.kudos_received : 'High five'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
