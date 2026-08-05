// src/screens/library/research.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Alert, Linking,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../api/supabaseClient';

export default function ResearchScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [title,    setTitle]    = useState('');
  const [url,      setUrl]      = useState('');
  const [notes,    setNotes]    = useState('');
  const [tags,     setTags]     = useState('');
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { if (userId) load(userId); }, [userId]));

  const load = async (uid) => {
    setLoading(true);
    const { data } = await supabase.from('captures').select('*')
      .eq('user_id', uid).in('type', ['link','note']).eq('status','inbox')
      .order('created_at', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const item = {
      user_id: userId, type: url.trim() ? 'link' : 'note',
      title: title.trim(), body: notes.trim() || null,
      url: url.trim() || null, status: 'inbox',
      tags: tags.split(',').map(tg => tg.trim()).filter(Boolean),
      source: 'manual',
    };
    const { data } = await supabase.from('captures').insert(item).select().single();
    if (data) setEntries(prev => [data, ...prev]);
    setTitle(''); setUrl(''); setNotes(''); setTags(''); setShowAdd(false);
    setSaving(false);
  };

  const deleteEntry = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from('captures').delete().eq('id', id);
  };

  const filtered = entries.filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.body?.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <View>
          <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>🔬 Research</Text>
          <Text style={{ fontSize:t.xs, color:c.text3, marginTop:3 }}>Links, notes and sources</Text>
        </View>
        <TouchableOpacity style={{ backgroundColor:c.teal, borderRadius:r.lg, paddingHorizontal:s.lg, paddingVertical:s.sm, flexDirection:'row', alignItems:'center', gap:5 }} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color:'#fff', fontWeight:t.bold, fontSize:t.sm }}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding:s.lg, paddingBottom:s.sm }}>
        <View style={{ flexDirection:'row', alignItems:'center', backgroundColor:c.bg1, borderRadius:r.md, paddingHorizontal:s.md, borderWidth:0.5, borderColor:c.border }}>
          <Ionicons name="search" size={16} color={c.text3} />
          <TextInput style={{ flex:1, padding:s.sm, fontSize:t.sm, color:c.text1 }} value={search} onChangeText={setSearch} placeholder="Search research..." placeholderTextColor={c.text4} />
        </View>
      </View>

      {loading ? <ActivityIndicator style={{ flex:1 }} color={c.teal} /> : (
        <FlatList
          data={filtered}
          keyExtractor={e => e.id}
          contentContainerStyle={{ paddingHorizontal:s.lg, gap:s.sm, paddingBottom:40 }}
          ListEmptyComponent={
            <View style={{ alignItems:'center', paddingTop:60 }}>
              <Text style={{ fontSize:44 }}>🔬</Text>
              <Text style={{ fontSize:t.lg, fontWeight:t.bold, color:c.text1, marginTop:s.lg, marginBottom:s.sm }}>No research yet</Text>
              <Text style={{ fontSize:t.sm, color:c.text3, textAlign:'center' }}>Save links and notes from your research</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor:c.bg1, borderRadius:r.lg, padding:s.lg, borderWidth:0.5, borderColor:c.border, borderLeftWidth:3, borderLeftColor: item.type==='link' ? c.teal : c.gold }}>
              <View style={{ flexDirection:'row', alignItems:'flex-start', gap:s.sm }}>
                <Ionicons name={item.type==='link' ? 'link-outline' : 'document-text-outline'} size={18} color={item.type==='link' ? c.teal : c.gold} style={{ marginTop:2 }} />
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:t.sm, fontWeight:t.bold, color:c.text1, marginBottom:3 }}>{item.title}</Text>
                  {item.url && (
                    <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
                      <Text style={{ fontSize:t.xs, color:c.teal }} numberOfLines={1}>{item.url}</Text>
                    </TouchableOpacity>
                  )}
                  {item.body && <Text style={{ fontSize:t.xs, color:c.text3, marginTop:4, lineHeight:16 }} numberOfLines={3}>{item.body}</Text>}
                  {item.tags?.length > 0 && (
                    <Text style={{ fontSize:10, color:c.gold, marginTop:4 }}>{item.tags.map(tg => '#'+tg).join(' ')}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => deleteEntry(item.id)} style={{ padding:4 }}>
                  <Ionicons name="trash-outline" size={15} color={c.text4} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor:c.bg1, borderTopLeftRadius:r.xl, borderTopRightRadius:r.xl, padding:s.xl, paddingBottom:40 }}>
            <View style={{ width:36, height:4, borderRadius:2, backgroundColor:c.border, alignSelf:'center', marginBottom:s.lg }} />
            <Text style={{ fontSize:t.lg, fontWeight:t.bold, color:c.text1, marginBottom:s.lg }}>Add Research</Text>
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.sm }} value={title} onChangeText={setTitle} placeholder="Title *" placeholderTextColor={c.text4} autoFocus />
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.sm }} value={url} onChangeText={setUrl} placeholder="URL (optional)" placeholderTextColor={c.text4} autoCapitalize="none" />
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.sm, minHeight:60, textAlignVertical:'top' }} value={notes} onChangeText={setNotes} placeholder="Notes..." placeholderTextColor={c.text4} multiline />
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.lg }} value={tags} onChangeText={setTags} placeholder="Tags (comma separated)" placeholderTextColor={c.text4} autoCapitalize="none" />
            <View style={{ flexDirection:'row', gap:s.sm }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex:1, padding:s.md, alignItems:'center', backgroundColor:c.bg0, borderRadius:r.md, borderWidth:0.5, borderColor:c.border }}>
                <Text style={{ color:c.text3 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={!title.trim()||saving} style={{ flex:2, padding:s.md, alignItems:'center', backgroundColor:c.teal, borderRadius:r.md, opacity:(!title.trim()||saving)?0.5:1 }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color:'#fff', fontWeight:t.bold }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
