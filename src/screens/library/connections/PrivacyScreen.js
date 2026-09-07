// src/screens/library/connections/PrivacyScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { useUIPrefs } from '../../../../context/UIPrefsContext';
import { supabase } from '../../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../../../api/offlineCache';
import RelatedLinks from '../RelatedLinks';

const CHECKLIST = [
  { id: 'pw',    label: 'Use unique passwords for every account',  tip: 'Use a password manager like Bitwarden (free)' },
  { id: '2fa',   label: 'Enable 2FA on all important accounts',    tip: 'Start with email, then banking, then social' },
  { id: 'email', label: 'Check if your email has been breached',   tip: 'Visit haveibeenpwned.com', link: 'https://haveibeenpwned.com' },
  { id: 'perms', label: 'Review app permissions on your phone',    tip: 'Check location, mic, camera access' },
  { id: 'priv',  label: 'Set social media profiles to private',    tip: 'Review who can see your posts and info' },
  { id: 'vpn',   label: 'Use a VPN on public WiFi',               tip: 'Especially important at coffee shops, airports' },
  { id: 'data',  label: 'Review what data apps collect about you', tip: 'Check Privacy settings on iPhone or Android' },
];

const PRESETS = ['Ran a security check', 'Updated a password', 'Reviewed privacy settings', 'Enabled 2FA on an account'];

const CHECKLIST_TAG = '__CHECKLIST__:';
const SCREEN_TAG = '[Privacy]';

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const [checked,  setChecked]  = useState({});
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [input,    setInput]    = useState('');
  const color = '#64b5f6';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  const load = async (uid) => {
    setLoading(true);
    const cacheKey = `privacy_${uid}`;
    const cached = await cacheRead(cacheKey);
    if (cached) { setChecked(cached.checked || {}); setEntries(cached.entries || []); }

    if (await isOnline()) {
      const [checklistRes, logRes] = await Promise.all([
        supabase.from('area_notes').select('content').eq('user_id', uid).eq('area_id', 'digital')
          .ilike('content', `${CHECKLIST_TAG}%`).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('area_notes').select('*').eq('user_id', uid).eq('area_id', 'digital')
          .ilike('content', `%${SCREEN_TAG}%`).order('created_at', { ascending: false }).limit(30),
      ]);
      let nextChecked = checked;
      if (checklistRes.data) {
        try { nextChecked = JSON.parse(checklistRes.data.content.slice(CHECKLIST_TAG.length)); setChecked(nextChecked); } catch {}
      }
      if (logRes.data) setEntries(logRes.data);
      await cacheWrite(cacheKey, { checked: nextChecked, entries: logRes.data || [] });
    }
    setLoading(false);
  };

  const toggle = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    if (userId) {
      offlineWrite(supabase, 'area_notes', {
        user_id: userId, area_id: 'digital',
        content: CHECKLIST_TAG + JSON.stringify(next),
        created_at: new Date().toISOString(),
      });
    }
  };
  const done = Object.values(checked).filter(Boolean).length;

  const addLog = async (text) => {
    const value = text.trim();
    if (!value || !userId) return;
    const entry = { user_id: userId, area_id: 'digital', content: `${SCREEN_TAG} ${value}`, created_at: new Date().toISOString() };
    const { row: data } = await offlineWrite(supabase, 'area_notes', entry);
    if (data) setEntries(prev => [data, ...prev]);
    setInput(''); setShowAdd(false);
  };

  const delLog = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from('area_notes').delete().eq('id', id);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: s.sm }}>
          <Ionicons name="chevron-back" size={20} color={color} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{showEmojis ? '🔒 ' : ''}Privacy</Text>
        {showSubtext && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3 }}>Control your data and digital footprint</Text>}
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
        {/* Progress */}
        <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginBottom: s.lg, borderWidth: 0.5, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: s.sm }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>Privacy Score</Text>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color }}>
              {done}/{CHECKLIST.length} complete
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: c.bg2, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: color, width: `${(done / CHECKLIST.length) * 100}%` }} />
          </View>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm }}>
            {done === CHECKLIST.length ? `${showEmojis ? '🎉 ' : ''}Excellent privacy hygiene!` : done > 3 ? 'Good progress — keep going!' : 'Start with the top items first.'}
          </Text>
        </View>

        <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm }}>{showEmojis ? '🛡️ ' : ''}Privacy Checklist</Text>
        {CHECKLIST.map(item => (
          <TouchableOpacity key={item.id} onPress={() => toggle(item.id)}
            style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: checked[item.id] ? color + '44' : c.border, flexDirection: 'row', gap: s.md, alignItems: 'flex-start' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: checked[item.id] ? color : c.border, backgroundColor: checked[item.id] ? color : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              {checked[item.id] && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }, checked[item.id] && { textDecorationLine: 'line-through', color: c.text4 }]}>{item.label}</Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4, lineHeight: 18 }}>{item.tip}</Text>
              {item.link && (
                <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
                  <Text style={{ fontSize: t.xs, color, marginTop: 4, fontWeight: '600' }}>Open link →</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Log ── */}
        <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginTop: s.lg, marginBottom: s.sm }}>{showEmojis ? '📝 ' : ''}Log</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginBottom: s.md }}>
          {PRESETS.map((p, i) => (
            <TouchableOpacity key={i} onPress={() => addLog(p)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: color + '18', borderRadius: r.full, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: color + '44' }}>
              <Ionicons name="add-circle" size={12} color={color} />
              <Text style={{ fontSize: t.xs, color, fontWeight: '600' }}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {showAdd ? (
          <View style={{ gap: s.sm, marginBottom: s.md }}>
            <TextInput
              style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: color + '44', minHeight: 60, textAlignVertical: 'top' }}
              value={input} onChangeText={setInput}
              placeholder="Log something else..." placeholderTextColor={c.text4} multiline autoFocus />
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              <TouchableOpacity onPress={() => { setShowAdd(false); setInput(''); }}
                style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
                <Text style={{ color: c.text3, fontSize: t.sm }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => addLog(input)} disabled={!input.trim()}
                style={{ flex: 2, padding: s.md, alignItems: 'center', backgroundColor: color, borderRadius: r.md, opacity: !input.trim() ? 0.5 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowAdd(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: color + '18', borderRadius: r.md, padding: s.md, borderWidth: 1, borderColor: color + '33', borderStyle: 'dashed', marginBottom: s.md }}>
            <Ionicons name="add-circle" size={18} color={color} />
            <Text style={{ color, fontWeight: '600', fontSize: t.sm }}>Log something else</Text>
          </TouchableOpacity>
        )}
        {loading ? <ActivityIndicator color={color} /> : entries.map(entry => (
          <View key={entry.id} style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: color, flexDirection: 'row', alignItems: 'flex-start', gap: s.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20 }}>{entry.content.replace(SCREEN_TAG, '').trim()}</Text>
              <Text style={{ fontSize: 10, color: c.text4, marginTop: 4 }}>
                {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity onPress={() => delLog(entry.id)} style={{ padding: 2 }}>
              <Ionicons name="close" size={14} color={c.text4} />
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Related ── */}
        <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginTop: s.lg, marginBottom: s.md }}>
          {showEmojis ? '🔗 ' : ''}Related
        </Text>
        <RelatedLinks areaId="digital" color={color} c={c} t={t} s={s} r={r} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
