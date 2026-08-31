// src/screens/library/wellness/WellnessAreaScreen.js
// Reusable base component for all wellness sub-screens

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { supabase } from '../../../api/supabaseClient';
import RelatedLinks, { EXCLUDE_LINK_FILTER } from '../RelatedLinks';

export default function WellnessAreaScreen({
  title, emoji, areaId, categories, accentColor,
  description, entryPlaceholder, presets,
}) {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const [entries,  setEntries]  = useState([]);
  const [input,    setInput]    = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [view,     setView]     = useState('log'); // log | related

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  const load = async (uid) => {
    setLoading(true);
    const { data } = await EXCLUDE_LINK_FILTER(supabase.from('area_notes').select('*')
      .eq('user_id', uid).eq('area_id', areaId))
      .order('created_at', { ascending: false }).limit(40);
    if (data) setEntries(data);
    setLoading(false);
  };

  const add = async (text) => {
    const value = (text ?? input).trim();
    if (!value) return;
    const entry = {
      user_id: userId, area_id: areaId,
      content: `[${category}] ${value}`,
      created_at: new Date().toISOString(),
    };
    if (userId) {
      const { data } = await supabase.from('area_notes').insert(entry).select().single();
      if (data) setEntries(prev => [data, ...prev]);
    } else {
      setEntries(prev => [{ ...entry, id: Date.now().toString() }, ...prev]);
    }
    setInput(''); setShowAdd(false);
  };

  const del = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (userId) await supabase.from('area_notes').delete().eq('id', id);
  };

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const date = new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: s.sm }}>
          <Ionicons name="chevron-back" size={20} color={accentColor} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: accentColor + '22', borderWidth: 1.5, borderColor: accentColor, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24 }}>{emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1 }}>{title}</Text>
            {description && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{description}</Text>}
          </View>
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: s.md, gap: s.sm }}>
          {categories.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
              style={{ paddingHorizontal: s.md, paddingVertical: 6, borderRadius: r.full, borderWidth: 1, borderColor: category === cat ? accentColor : c.border, backgroundColor: category === cat ? accentColor + '22' : 'transparent' }}>
              <Text style={{ fontSize: t.xs, fontWeight: category === cat ? t.bold : t.regular, color: category === cat ? accentColor : c.text3 }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Log / Related toggle */}
        <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md }}>
          {['log', 'related'].map(v => (
            <TouchableOpacity key={v} onPress={() => setView(v)}
              style={{ flex: 1, paddingVertical: 7, borderRadius: r.md, alignItems: 'center', backgroundColor: view === v ? accentColor : c.bg2 }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: view === v ? '#fff' : c.text3 }}>{v === 'log' ? '📝 Log' : '🔗 Related'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {view === 'related' ? (
        <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <RelatedLinks areaId={areaId} color={accentColor} c={c} t={t} s={s} r={r} />
        </ScrollView>
      ) : (
        <>
          {/* Presets — one-tap log, no typing required */}
          {presets?.length > 0 && (
            <View style={{ paddingHorizontal: s.lg, paddingTop: s.md, backgroundColor: c.bg1, flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
              {presets.map((p, i) => (
                <TouchableOpacity key={i} onPress={() => add(p)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: accentColor + '18', borderRadius: r.full, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: accentColor + '44' }}>
                  <Ionicons name="add-circle" size={12} color={accentColor} />
                  <Text style={{ fontSize: t.xs, color: accentColor, fontWeight: '600' }}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Add entry */}
          <View style={{ padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border, backgroundColor: c.bg1 }}>
            {showAdd ? (
              <View style={{ gap: s.sm }}>
                <TextInput
                  style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: accentColor + '44', minHeight: 60, textAlignVertical: 'top' }}
                  value={input} onChangeText={setInput}
                  placeholder={entryPlaceholder || `Log a ${category.toLowerCase()} entry...`}
                  placeholderTextColor={c.text4} multiline autoFocus />
                <View style={{ flexDirection: 'row', gap: s.sm }}>
                  <TouchableOpacity onPress={() => { setShowAdd(false); setInput(''); }}
                    style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
                    <Text style={{ color: c.text3, fontSize: t.sm }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => add()} disabled={!input.trim()}
                    style={{ flex: 2, padding: s.md, alignItems: 'center', backgroundColor: accentColor, borderRadius: r.md, opacity: !input.trim() ? 0.5 : 1 }}>
                    <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowAdd(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: accentColor + '18', borderRadius: r.md, padding: s.md, borderWidth: 1, borderColor: accentColor + '33', borderStyle: 'dashed' }}>
                <Ionicons name="add-circle" size={20} color={accentColor} />
                <Text style={{ fontSize: t.sm, color: accentColor, fontWeight: '600' }}>Add {category} entry</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Entries */}
          {loading ? <ActivityIndicator color={accentColor} style={{ marginTop: 40 }} /> : (
            <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
              {Object.keys(grouped).length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <Text style={{ fontSize: 48, marginBottom: s.lg }}>{emoji}</Text>
                  <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Nothing logged yet</Text>
                  <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center' }}>Tap the button above to start tracking your {title.toLowerCase()}.</Text>
                </View>
              ) : (
                Object.entries(grouped).map(([date, dayEntries]) => (
                  <View key={date} style={{ marginBottom: s.lg }}>
                    <Text style={{ fontSize: t.xs, color: accentColor, fontWeight: t.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>{date}</Text>
                    {dayEntries.map(entry => (
                      <View key={entry.id} style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: accentColor, flexDirection: 'row', alignItems: 'flex-start', gap: s.sm }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20 }}>{entry.content}</Text>
                          <Text style={{ fontSize: 10, color: c.text4, marginTop: 4 }}>
                            {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => del(entry.id)} style={{ padding: 2 }}>
                          <Ionicons name="close" size={14} color={c.text4} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}
