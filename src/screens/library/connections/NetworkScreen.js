// src/screens/library/connections/NetworkScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { supabase } from '../../../api/supabaseClient';
import RelatedLinks, { EXCLUDE_LINK_FILTER } from '../RelatedLinks';

const TYPES = [
  { key: 'colleague', label: 'Colleague', emoji: '💼', color: '#c9a84c' },
  { key: 'mentor',    label: 'Mentor',    emoji: '🧠', color: '#b07be0' },
  { key: 'community', label: 'Community', emoji: '🌐', color: '#4caf7d' },
  { key: 'industry',  label: 'Industry',  emoji: '🏭', color: '#7eb8e0' },
];

export default function NetworkScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId,  setUserId]  = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name,    setName]    = useState('');
  const [role,    setRole]    = useState('');
  const [note,    setNote]    = useState('');
  const [type,    setType]    = useState('colleague');
  const color = '#c9a84c';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  const load = async (uid) => {
    setLoading(true);
    const { data } = await EXCLUDE_LINK_FILTER(supabase.from('area_notes').select('*').eq('user_id', uid).eq('area_id', 'professional'))
      .order('created_at', { ascending: false }).limit(50);
    if (data) setEntries(data);
    setLoading(false);
  };

  const add = async () => {
    if (!name.trim()) return;
    const content = JSON.stringify({ name: name.trim(), role: role.trim(), note: note.trim(), type });
    const { data } = await supabase.from('area_notes').insert({ user_id: userId, area_id: 'professional', content, created_at: new Date().toISOString() }).select().single();
    if (data) setEntries(prev => [data, ...prev]);
    setName(''); setRole(''); setNote(''); setType('colleague'); setShowAdd(false);
  };

  const del = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from('area_notes').delete().eq('id', id);
  };

  const parse = (entry) => { try { return JSON.parse(entry.content); } catch { return { name: entry.content, role: '', note: '', type: 'colleague' }; } };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: s.sm }}>
          <Ionicons name="chevron-back" size={20} color={color} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>🤝 Network</Text>
        <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3 }}>Your professional connections and community</Text>
      </View>

      <TouchableOpacity onPress={() => setShowAdd(true)}
        style={{ margin: s.lg, flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: color + '18', borderRadius: r.md, padding: s.md, borderWidth: 1, borderColor: color + '33', borderStyle: 'dashed' }}>
        <Ionicons name="person-add-outline" size={18} color={color} />
        <Text style={{ color, fontWeight: '600', fontSize: t.sm }}>Add a connection</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color={color} style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: s.lg, paddingBottom: 60 }}>
          {entries.map(entry => {
            const p = parse(entry);
            const tp = TYPES.find(x => x.key === p.type) || TYPES[0];
            return (
              <View key={entry.id} style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginBottom: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: tp.color }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tp.color + '22', borderWidth: 1.5, borderColor: tp.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{tp.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>{p.name}</Text>
                    {p.role ? <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{p.role}</Text> : null}
                  </View>
                  <TouchableOpacity onPress={() => del(entry.id)}>
                    <Ionicons name="close" size={16} color={c.text4} />
                  </TouchableOpacity>
                </View>
                {p.note ? <Text style={{ fontSize: t.sm, color: c.text3, marginTop: s.sm, lineHeight: 19 }}>{p.note}</Text> : null}
              </View>
            );
          })}
          {entries.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: s.lg }}>🤝</Text>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>No connections yet</Text>
              <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center' }}>Add colleagues, mentors, and community contacts.</Text>
            </View>
          )}

          <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginTop: s.lg, marginBottom: s.md }}>
            🔗 Related
          </Text>
          <RelatedLinks areaId="professional" color={color} c={c} t={t} s={s} r={r} />
        </ScrollView>
      )}

      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 48 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>Add Connection</Text>
            <TextInput style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: color + '44', marginBottom: s.sm }}
              value={name} onChangeText={setName} placeholder="Name *" placeholderTextColor={c.text4} autoFocus />
            <TextInput style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.sm }}
              value={role} onChangeText={setRole} placeholder="Role / Company" placeholderTextColor={c.text4} />
            <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.sm }}>
              {TYPES.map(tp => (
                <TouchableOpacity key={tp.key} onPress={() => setType(tp.key)}
                  style={{ flex: 1, alignItems: 'center', padding: s.sm, borderRadius: r.md, borderWidth: 1.5, borderColor: type === tp.key ? tp.color : c.border, backgroundColor: type === tp.key ? tp.color + '22' : 'transparent' }}>
                  <Text style={{ fontSize: 16 }}>{tp.emoji}</Text>
                  <Text style={{ fontSize: 9, color: type === tp.key ? tp.color : c.text3, fontWeight: type === tp.key ? t.bold : t.regular, marginTop: 2 }}>{tp.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, minHeight: 50, textAlignVertical: 'top', marginBottom: s.md }}
              value={note} onChangeText={setNote} placeholder="Notes (optional)" placeholderTextColor={c.text4} multiline />
            <View style={{ flexDirection: 'row', gap: s.sm }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
                <Text style={{ color: c.text3 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={add} disabled={!name.trim()} style={{ flex: 2, padding: s.md, alignItems: 'center', backgroundColor: color, borderRadius: r.md, opacity: !name.trim() ? 0.5 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: t.bold }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
