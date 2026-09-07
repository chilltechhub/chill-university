// src/screens/library/discover/MentorsScreen.js
// The only place in Discover with a user-to-user channel, so it carries the
// safety rules the rest of the section doesn't need:
//
//   * request_mentor() refuses outright for minor/child accounts — this screen
//     shows them a read-only explanation rather than a broken button.
//   * A request is one structured row a mentor receives, not a chat. There is
//     no reply thread, and no way for a mentor to initiate contact.
//   * hourly_rate is displayed but nothing here takes payment. Arranging money
//     in-app would pull App Store commission rules in; that's a deliberate
//     boundary, not an oversight.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert,
  ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { useUIPrefs } from '../../../../context/UIPrefsContext';
import { useUserProgress } from '../../../../context/UserProgressContext';
import {
  getMentors, requestMentor, blockUser,
  COMMUNITY_NOT_CONFIGURED, MINORS_CANNOT_REQUEST,
} from '../../../api/communityService';
import { communityAccess, restrictionMessage } from '../../../logic/accountAccess';

export default function MentorsScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis } = useUIPrefs();
  const { profile } = useUserProgress();

  const [mentors, setMentors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const [notConfigured, setNC]  = useState(false);
  const [subject, setSubject]   = useState(null);
  const [target, setTarget]     = useState(null);   // mentor being messaged
  const [message, setMessage]   = useState('');
  const [sending, setSending]   = useState(false);

  const { restricted: isRestricted, reason: restrictReason } = communityAccess(profile);

  const load = useCallback(async () => {
    try {
      setMentors(await getMentors({ subject, limit: 50 }));
      setNC(false);
    } catch (e) {
      if (e.message === COMMUNITY_NOT_CONFIGURED) setNC(true);
      else console.warn('Mentors load', e.message);
    }
    setLoading(false);
  }, [subject]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefresh(true); await load(); setRefresh(false); };

  const send = async () => {
    if (!target) return;
    setSending(true);
    try {
      await requestMentor(target.id, message.trim());
      setMentors(prev => prev.map(m => m.id === target.id ? { ...m, already_requested: true } : m));
      setTarget(null); setMessage('');
      Alert.alert('Request sent', `${target.display_name} will see your request. They'll reach out if it's a fit.`);
    } catch (e) {
      if (e.message === MINORS_CANNOT_REQUEST) {
        Alert.alert('Not available', 'Mentor requests are only available on adult accounts.');
      } else {
        Alert.alert('Could not send', 'Something went wrong — try again.');
      }
    }
    setSending(false);
  };

  const promptBlock = (mentor) => {
    Alert.alert(`Hide ${mentor.display_name}?`, 'You will stop seeing them across the community.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Hide', style: 'destructive', onPress: async () => {
        setMentors(prev => prev.filter(m => m.id !== mentor.id));
        try { await blockUser(mentor.id); } catch { load(); }
      } },
    ]);
  };

  // Built from what mentors actually list, so the filter row can never offer a
  // subject with nothing behind it.
  const subjects = [...new Set(mentors.flatMap(m => m.subjects || []))].sort();

  const Header = (
    <View style={{ backgroundColor: c.headerBg, padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
      <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>
        {showEmojis ? '🧙 ' : ''}Mentors &amp; Experts
      </Text>
      <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3 }}>Learn from people who&apos;ve done it</Text>
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

      {subjects.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: s.lg, paddingVertical: s.sm, gap: s.sm }}
          style={{ flexGrow: 0, backgroundColor: c.bg1, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
          {[null, ...subjects].map((sub, i) => (
            <TouchableOpacity key={i} onPress={() => setSubject(sub)}
              style={{ borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 6, borderWidth: 1,
                       backgroundColor: subject === sub ? c.teal + '22' : c.bg0,
                       borderColor: subject === sub ? c.teal : c.border }}>
              <Text style={{ fontSize: t.xs, color: subject === sub ? c.teal : c.text3 }}>{sub || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? <ActivityIndicator color={c.teal} style={{ marginTop: 48 }} /> : (
        <ScrollView
          contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
        >
          {isRestricted && (
            <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.md, marginBottom: s.md,
                           borderWidth: 1, borderColor: c.border, flexDirection: 'row', gap: s.sm, alignItems: 'flex-start' }}>
              <Ionicons name="shield-checkmark-outline" size={16} color={c.teal} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: t.xs, color: c.text3, lineHeight: 17 }}>
                {restrictionMessage(restrictReason, { action: 'Contacting mentors' })}
                {restrictReason === 'minor' ? ' A parent or teacher linked to your account can arrange help.' : ''}
              </Text>
            </View>
          )}

          {mentors.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 56 }}>
              {showEmojis
                ? <Text style={{ fontSize: 48, marginBottom: s.lg }}>🧙</Text>
                : <Ionicons name="people-outline" size={44} color={c.teal} style={{ marginBottom: s.lg }} />}
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' }}>
                No mentors listed yet
              </Text>
              <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20 }}>
                Mentors are added by hand while this is new, so the list stays small and vetted
                rather than open to anyone.
              </Text>
            </View>
          ) : mentors.map(mentor => (
            <View key={mentor.id}
              style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.md, marginBottom: s.sm,
                       borderWidth: 0.5, borderColor: c.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.md }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c.teal + '22',
                               borderWidth: 1.5, borderColor: c.teal, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 17 }}>🧙</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>{mentor.display_name}</Text>
                  {mentor.rating_count > 0 && (
                    <Text style={{ fontSize: 11, color: c.gold, marginTop: 1 }}>
                      ★ {Number(mentor.rating).toFixed(1)} · {mentor.rating_count} review{mentor.rating_count === 1 ? '' : 's'}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => promptBlock(mentor)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="ellipsis-horizontal" size={15} color={c.text4} />
                </TouchableOpacity>
              </View>

              {!!mentor.bio && (
                <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginTop: s.sm }}>{mentor.bio}</Text>
              )}

              {!!mentor.subjects?.length && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: s.sm }}>
                  {mentor.subjects.map((sub, i) => (
                    <View key={i} style={{ backgroundColor: c.bg0, borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 0.5, borderColor: c.border }}>
                      <Text style={{ fontSize: 10, color: c.text3 }}>{sub}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s.md }}>
                <Text style={{ fontSize: t.xs, color: c.text4 }}>
                  {mentor.hourly_rate ? `From $${Number(mentor.hourly_rate).toFixed(0)}/hr · arranged directly` : 'Rate discussed directly'}
                </Text>
                <TouchableOpacity
                  disabled={isRestricted || mentor.already_requested}
                  onPress={() => { setTarget(mentor); setMessage(''); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: r.full,
                           paddingHorizontal: s.md, paddingVertical: 7,
                           backgroundColor: (isRestricted || mentor.already_requested) ? c.border : c.teal }}>
                  <Ionicons name={mentor.already_requested ? 'checkmark' : 'paper-plane-outline'} size={13} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: t.xs, fontWeight: '700' }}>
                    {mentor.already_requested ? 'Requested' : 'Request'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Request sheet */}
      <Modal visible={!!target} transparent animationType="slide" onRequestClose={() => setTarget(null)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, padding: s.xl, paddingBottom: 40 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.sm }}>
              <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.text1 }}>Request {target?.display_name}</Text>
              <TouchableOpacity onPress={() => setTarget(null)}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.lg, lineHeight: 17 }}>
              They&apos;ll see this once. Say what you&apos;re working on and what you want help with.
            </Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: c.teal, borderRadius: r.md, padding: s.md, fontSize: t.sm,
                       color: c.text1, backgroundColor: c.bg0, minHeight: 110, textAlignVertical: 'top', marginBottom: s.md }}
              value={message} onChangeText={setMessage} multiline maxLength={1000} autoFocus
              placeholder="I'm working on… I'd like help with…" placeholderTextColor={c.text4}
            />
            <Text style={{ fontSize: 11, color: c.text4, marginBottom: s.md, lineHeight: 16 }}>
              Don&apos;t share your address, school, phone number or anything else private in a first message.
            </Text>
            <TouchableOpacity onPress={send} disabled={sending || !message.trim()}
              style={{ backgroundColor: message.trim() ? c.teal : c.border, borderRadius: r.md, paddingVertical: 14, alignItems: 'center' }}>
              {sending ? <ActivityIndicator color="#fff" />
                       : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Send request</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
