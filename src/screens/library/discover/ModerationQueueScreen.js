// src/screens/library/discover/ModerationQueueScreen.js
// Human review for anything the automated filter quarantined or users reported.
//
// App Review 1.2 and Play's UGC policy both expect a person in the loop, not
// just "three reports auto-hide it". Auto-hiding is a holding action; this is
// where a decision actually gets made, and it's what makes a published
// turnaround commitment (24 hours is the usual expectation) possible to honour.
//
// Reachable from Settings only when profiles.is_admin is true. The gate is
// enforced in the RPCs — get_moderation_queue and admin_set_post_state both
// raise NOT_AN_ADMIN — so hiding the entry point is presentation, not security.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import {
  getModerationQueue, setPostState,
  COMMUNITY_NOT_CONFIGURED, NOT_AN_ADMIN,
} from '../../../api/communityService';

const KIND_LABEL = { breakthrough: 'Breakthrough', showcase: 'Showcase', project: 'Project' };

function ageOf(iso) {
  const hrs = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (hrs < 1) return 'under an hour';
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function ModerationQueueScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const [error, setError]       = useState(null); // 'not_configured' | 'not_admin'
  const [busyId, setBusyId]     = useState(null);

  const load = useCallback(async () => {
    try {
      setItems(await getModerationQueue(100));
      setError(null);
    } catch (e) {
      if (e.message === COMMUNITY_NOT_CONFIGURED) setError('not_configured');
      else if (e.message === NOT_AN_ADMIN) setError('not_admin');
      else console.warn('ModerationQueue load', e.message);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefresh(true); await load(); setRefresh(false); };

  const decide = async (item, state) => {
    setBusyId(item.id);
    try {
      await setPostState(item.id, state);
      setItems(prev => prev.filter(x => x.id !== item.id));
    } catch {
      Alert.alert('Could not update', 'Try again in a moment.');
    }
    setBusyId(null);
  };

  const confirmRemove = (item) => {
    Alert.alert('Take this post down?', 'It stops being visible to everyone. This is reversible in the database but not from here.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take down', style: 'destructive', onPress: () => decide(item, 'removed') },
    ]);
  };

  const Header = (
    <View style={{ backgroundColor: c.headerBg, padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
      <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>Moderation</Text>
      <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3 }}>
        {items.length > 0 ? `${items.length} awaiting review · oldest first` : 'Reported and quarantined posts'}
      </Text>
    </View>
  );

  if (error) {
    const copy = error === 'not_admin'
      ? { head: 'Admins only', body: 'This account doesn’t have the admin flag set. Set profiles.is_admin to true for the accounts that handle reports.' }
      : { head: 'Community isn’t switched on yet', body: 'Run the community_discover migration and this fills in.' };
    return (
      <View style={{ flex: 1, backgroundColor: c.bg0 }}>
        {Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xl }}>
          <Ionicons name={error === 'not_admin' ? 'lock-closed-outline' : 'cloud-offline-outline'}
            size={44} color={c.text4} style={{ marginBottom: s.lg }} />
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' }}>{copy.head}</Text>
          <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20 }}>{copy.body}</Text>
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
          {items.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name="checkmark-done-outline" size={44} color={c.teal} style={{ marginBottom: s.lg }} />
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Queue is clear</Text>
              <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20 }}>
                Nothing reported and nothing held back by the filter.
              </Text>
            </View>
          ) : items.map(item => {
            const reported = item.report_count > 0;
            const flag = reported ? c.error || '#e05858' : c.gold;
            return (
              <View key={item.id}
                style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.md, marginBottom: s.sm,
                         borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: flag }}>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: 8, flexWrap: 'wrap' }}>
                  <View style={{ backgroundColor: flag + '1f', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, color: flag, fontWeight: '700' }}>
                      {reported ? `${item.report_count} report${item.report_count === 1 ? '' : 's'}` : 'Filtered'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: c.text4 }}>
                    {KIND_LABEL[item.kind] || item.kind} · {item.author_name} · waiting {ageOf(item.created_at)}
                  </Text>
                </View>

                {!!item.report_reasons?.length && (
                  <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: 8 }}>
                    Reported as: {item.report_reasons.join(', ')}
                  </Text>
                )}

                <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1, lineHeight: 20 }}>{item.title}</Text>
                {!!item.body && (
                  <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginTop: 4 }}>{item.body}</Text>
                )}
                {!!item.link && (
                  <TouchableOpacity onPress={() => Linking.openURL(item.link)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: s.sm }}>
                    <Ionicons name="link-outline" size={13} color={c.teal} />
                    <Text style={{ fontSize: t.xs, color: c.teal, flex: 1 }} numberOfLines={1}>{item.link}</Text>
                  </TouchableOpacity>
                )}

                <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md }}>
                  <TouchableOpacity
                    disabled={busyId === item.id}
                    onPress={() => decide(item, 'visible')}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                             backgroundColor: c.teal, borderRadius: r.md, paddingVertical: 10 }}>
                    <Ionicons name="checkmark" size={15} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: t.xs }}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={busyId === item.id}
                    onPress={() => confirmRemove(item)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                             backgroundColor: c.bg0, borderWidth: 1, borderColor: c.error || '#e05858',
                             borderRadius: r.md, paddingVertical: 10 }}>
                    <Ionicons name="close" size={15} color={c.error || '#e05858'} />
                    <Text style={{ color: c.error || '#e05858', fontWeight: '700', fontSize: t.xs }}>Take down</Text>
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
