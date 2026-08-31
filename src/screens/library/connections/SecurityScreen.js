// src/screens/library/connections/SecurityScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { supabase } from '../../../api/supabaseClient';
import RelatedLinks from '../RelatedLinks';

const TIPS = [
  { icon: 'key-outline',             color: '#FFB800', title: 'Password Manager', body: 'Use Bitwarden (free) or 1Password to store and generate strong, unique passwords for every account.', link: 'https://bitwarden.com', linkLabel: 'Get Bitwarden (free)' },
  { icon: 'phone-portrait-outline',  color: '#00F0FF', title: '2-Factor Authentication', body: 'Enable 2FA on every account that offers it. Use an authenticator app (Google Authenticator, Authy) instead of SMS when possible.' },
  { icon: 'wifi-outline',            color: '#7C4DFF', title: 'Public WiFi Safety', body: 'Never do banking or login to important accounts on public WiFi without a VPN. Your traffic can be monitored.' },
  { icon: 'update-outline',          color: '#00E676', title: 'Keep Everything Updated', body: 'Software updates patch security vulnerabilities. Enable auto-updates on your phone, computer, and router.' },
  { icon: 'alert-circle-outline',    color: '#FF4081', title: 'Phishing Awareness', body: 'Never click suspicious links in emails or texts. Hover links to see where they go. Legit companies never ask for passwords via email.' },
  { icon: 'cloud-outline',           color: '#64b5f6', title: 'Backup Your Data', body: 'Keep encrypted backups of important files. Use 3-2-1 rule: 3 copies, 2 formats, 1 offsite.' },
];

const PRESETS = ['Updated a password', 'Ran a security check', 'Enabled 2FA on an account', 'Reviewed a security tip'];
const SCREEN_TAG = '[Security]';

export default function SecurityScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId,  setUserId]  = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [input,   setInput]   = useState('');
  const color = '#00E676';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  const load = async (uid) => {
    setLoading(true);
    const { data } = await supabase.from('area_notes').select('*').eq('user_id', uid).eq('area_id', 'digital')
      .ilike('content', `%${SCREEN_TAG}%`).order('created_at', { ascending: false }).limit(30);
    if (data) setEntries(data);
    setLoading(false);
  };

  const addLog = async (text) => {
    const value = text.trim();
    if (!value || !userId) return;
    const entry = { user_id: userId, area_id: 'digital', content: `${SCREEN_TAG} ${value}`, created_at: new Date().toISOString() };
    const { data } = await supabase.from('area_notes').insert(entry).select().single();
    if (data) setEntries(prev => [data, ...prev]);
    setInput(''); setShowAdd(false);
  };

  const delLog = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from('area_notes').delete().eq('id', id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: s.sm }}>
          <Ionicons name="chevron-back" size={20} color={color} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>🛡️ Digital Security</Text>
        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3 }}>Keep your accounts and data safe</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
        <View style={{ backgroundColor: color + '18', borderRadius: r.lg, padding: s.lg, borderWidth: 1, borderColor: color + '44', marginBottom: s.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
            <Ionicons name="shield-checkmark" size={20} color={color} />
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Security Essentials</Text>
          </View>
          <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>
            Most data breaches happen because of weak passwords, no 2FA, and phishing. These 6 habits eliminate 90% of your risk.
          </Text>
        </View>

        {TIPS.map((tip, i) => (
          <View key={i} style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginBottom: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: tip.color }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: tip.color + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={tip.icon} size={18} color={tip.color} />
              </View>
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{tip.title}</Text>
            </View>
            <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>{tip.body}</Text>
            {tip.link && (
              <TouchableOpacity onPress={() => Linking.openURL(tip.link)} style={{ marginTop: s.sm }}>
                <Text style={{ fontSize: t.xs, color: tip.color, fontWeight: '600' }}>{tip.linkLabel || 'Learn more →'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* ── Log ── */}
        <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginTop: s.lg, marginBottom: s.sm }}>📝 Log</Text>
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
          🔗 Related
        </Text>
        <RelatedLinks areaId="digital" color={color} c={c} t={t} s={s} r={r} />
      </ScrollView>
    </View>
  );
}
