// src/screens/library/labs.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  TextInput, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { supabase } from '../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../../api/offlineCache';

// Labs entries live in `area_notes` — the same generic log table the wellness
// and life-area screens use — tagged so they stay isolated from those screens'
// entries. There is no `labs` table, and this screen previously held everything
// in useState alone: an experiment was silently destroyed the moment the screen
// unmounted, while the empty state promised the opposite.
const LAB_AREA_ID = 'creative';
const LAB_TAG     = 'LabsScreen';

const FEATURES = [
  { emoji: '⚗️', icon: 'flask-outline',     title: 'Experiments',      desc: 'Try things without pressure — labs can fail' },
  { emoji: '🔬', icon: 'search-outline',    title: 'Prototypes',       desc: 'Build rough versions before committing' },
  { emoji: '📝', icon: 'create-outline', title: 'Keep a record', desc: 'Every experiment is saved to your account' },
  { emoji: '🚀', icon: 'rocket-outline', title: 'Ready to commit?', desc: 'Turn a lab that worked into a project in The Workshop' },
];

export default function LabsScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const [labs,   setLabs]   = useState([]);
  const [input,  setInput]  = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
    });
  }, []);

  const stripTag = (content) => (content || '').replace(/^\[[^\]]+\]\s*/, '');

  // Cache-first, same as every other logging screen — a cold offline launch
  // still shows what you wrote last time instead of an empty sandbox.
  const load = async (uid) => {
    const cached = await cacheRead(`labs_${uid}`);
    if (cached) setLabs(cached);
    if (!(await isOnline())) return;
    const { data } = await supabase.from('area_notes').select('*')
      .eq('user_id', uid).eq('area_id', LAB_AREA_ID).ilike('content', `%[${LAB_TAG}]%`)
      .order('created_at', { ascending: false }).limit(50);
    if (data) {
      const rows = data.map(r => ({ id: r.id, text: stripTag(r.content), created_at: r.created_at }));
      setLabs(rows);
      cacheWrite(`labs_${uid}`, rows);
    }
  };

  const add = async () => {
    const value = input.trim();
    if (!value) return;
    setInput('');
    if (!userId) {
      setLabs(prev => [{ id: Date.now().toString(), text: value, created_at: new Date().toISOString() }, ...prev]);
      return;
    }
    const entry = { user_id: userId, area_id: LAB_AREA_ID, content: `[${LAB_TAG}] ${value}`, created_at: new Date().toISOString() };
    try {
      const { row } = await offlineWrite(supabase, 'area_notes', entry);
      const saved = { id: row?.id || Date.now().toString(), text: value, created_at: entry.created_at };
      setLabs(prev => { const next = [saved, ...prev]; cacheWrite(`labs_${userId}`, next); return next; });
    } catch (e) { console.warn('LabsScreen add', e); }
  };

  const remove = async (id) => {
    setLabs(prev => { const next = prev.filter(n => n.id !== id); if (userId) cacheWrite(`labs_${userId}`, next); return next; });
    if (userId) await supabase.from('area_notes').delete().eq('id', id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor: c.headerBg, padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{showEmojis ? '🧪 ' : ''}Labs</Text>
        {showSubtext && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4 }}>Your sandbox for experiments and prototypes</Text>}
      </View>

      {/* Input */}
      <View style={{ flexDirection: 'row', gap: s.sm, padding: s.lg, backgroundColor: c.bg1, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TextInput
          style={{ flex: 1, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 0.5, borderColor: c.border }}
          value={input} onChangeText={setInput}
          placeholder="Start a new experiment..." placeholderTextColor={c.text4}
          onSubmitEditing={add}
        />
        <TouchableOpacity
          style={{ backgroundColor: c.teal, borderRadius: r.md, padding: s.md, alignItems: 'center', justifyContent: 'center' }}
          onPress={add}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={labs}
        keyExtractor={n => n.id}
        contentContainerStyle={{ padding: s.lg, gap: s.sm }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            {showEmojis ? <Text style={{ fontSize: 44, marginBottom: s.lg }}>🧪</Text> : <Ionicons name="flask-outline" size={40} color={c.teal} style={{ marginBottom: s.lg }} />}
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Labs</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20, marginBottom: s.xl }}>
              Your sandbox for experiments and prototypes
            </Text>
            {FEATURES.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, width: '100%', backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
                {showEmojis ? <Text style={{ fontSize: 20 }}>{f.emoji}</Text> : <Ionicons name={f.icon} size={18} color={c.teal} />}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{f.title}</Text>
                  <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.md, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.teal }}>
            <Text style={{ flex: 1, fontSize: t.sm, color: c.text1, lineHeight: 20 }}>{item.text}</Text>
            <TouchableOpacity onPress={() => remove(item.id)}>
              <Ionicons name="close-circle-outline" size={18} color={c.text4} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
