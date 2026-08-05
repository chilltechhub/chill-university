// src/screens/library/wellness/NutritionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { supabase } from '../../../api/supabaseClient';

const CATEGORIES = ['Meals', 'Snacks', 'Drinks', 'Supplements'];

export default function NutritionScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [entries,  setEntries]  = useState([]);
  const [input,    setInput]    = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading,  setLoading]  = useState(false);
  const [userId,   setUserId]   = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadEntries(user.id); }
    });
  }, []);

  const loadEntries = async (uid) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('area_notes')
        .select('*')
        .eq('user_id', uid)
        .eq('area_id', 'physical')
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setEntries(data);
    } catch (e) { console.warn('NutritionScreen', e); }
    setLoading(false);
  };

  const addEntry = async () => {
    if (!input.trim()) return;
    const entry = {
      user_id:    userId,
      area_id:    'physical',
      content:    `[${category}] ${input.trim()}`,
      created_at: new Date().toISOString(),
    };
    if (userId) {
      const { data, error } = await supabase.from('area_notes').insert(entry).select().single();
      if (!error && data) setEntries(prev => [data, ...prev]);
    } else {
      setEntries(prev => [{ ...entry, id: Date.now().toString() }, ...prev]);
    }
    setInput('');
  };

  const deleteEntry = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (userId) await supabase.from('area_notes').delete().eq('id', id);
  };

  const accentColor = c.teal;

  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border }}>
        <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>🥗 Nutrition</Text>
        <Text style={{ fontSize:t.xs, color:c.text3, marginTop:4 }}>Track and reflect on your food habits</Text>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:s.lg, paddingVertical:s.sm, gap:s.sm }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat}
            style={{ paddingHorizontal:s.md, paddingVertical:6, borderRadius:r.full, borderWidth:1,
              borderColor: category===cat ? accentColor : c.border,
              backgroundColor: category===cat ? accentColor+'22' : 'transparent' }}
            onPress={() => setCategory(cat)}>
            <Text style={{ fontSize:t.xs, fontWeight: category===cat ? t.bold : t.regular,
              color: category===cat ? accentColor : c.text3 }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={{ flexDirection:'row', gap:s.sm, paddingHorizontal:s.lg, paddingBottom:s.sm, backgroundColor:c.bg1, borderBottomWidth:0.5, borderBottomColor:c.border }}>
        <TextInput
          style={{ flex:1, backgroundColor:c.bg0, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, borderWidth:0.5, borderColor:c.border }}
          value={input} onChangeText={setInput}
          placeholder="Log a meal or food..." placeholderTextColor={c.text4}
          onSubmitEditing={addEntry}
        />
        <TouchableOpacity
          style={{ backgroundColor:accentColor, borderRadius:r.md, padding:s.md, alignItems:'center', justifyContent:'center' }}
          onPress={addEntry}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Entries */}
      {loading ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={e => e.id}
          contentContainerStyle={{ padding:s.lg, gap:s.sm, paddingBottom:40 }}
          ListEmptyComponent={
            <View style={{ alignItems:'center', paddingTop:60 }}>
              <Text style={{ fontSize:44, marginBottom:s.lg }}>🥗</Text>
              <Text style={{ fontSize:t.md, color:c.text3, textAlign:'center' }}>
                Log your first food to get started
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection:'row', alignItems:'flex-start', gap:s.md, backgroundColor:c.bg1, borderRadius:r.md, padding:s.md, borderWidth:0.5, borderColor:c.border, borderLeftWidth:3, borderLeftColor:accentColor }}>
              <View style={{ flex:1 }}>
                <Text style={{ fontSize:t.sm, color:c.text1, lineHeight:20 }}>{item.content}</Text>
                <Text style={{ fontSize:t.xs, color:c.text4, marginTop:4 }}>
                  {new Date(item.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteEntry(item.id)} style={{ padding:4 }}>
                <Ionicons name="trash-outline" size={15} color={c.text4} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
