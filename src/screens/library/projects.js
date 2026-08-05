// src/screens/library/projects.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../api/supabaseClient';

const STATUS_OPTIONS = ['active','on_hold','completed','archived'];
const STATUS_COLORS  = { active:'#2bb5a0', on_hold:'#c9a84c', completed:'#3ac860', archived:'#7a6a9a' };
const STATUS_LABELS  = { active:'Active', on_hold:'On Hold', completed:'Done', archived:'Archived' };

const EMOJIS = ['🚀','💡','🎯','🔥','⚡','🌟','📱','🎨','🔬','💰','📚','🏗️','🎮','🌱'];

export default function ProjectsScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [userId,    setUserId]    = useState(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState('active');

  // Form
  const [title,    setTitle]    = useState('');
  const [goal,     setGoal]     = useState('');
  const [deadline, setDeadline] = useState('');
  const [emoji,    setEmoji]    = useState('🚀');
  const [status,   setStatus]   = useState('active');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); loadProjects(user.id); }
      else setLoading(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { if (userId) loadProjects(userId); }, [userId]));

  const loadProjects = async (uid) => {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').eq('user_id', uid).order('sort_order');
    if (data) setProjects(data);
    setLoading(false);
  };

  const saveProject = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const item = {
      user_id: userId, title: title.trim(), description: goal.trim() || null,
      emoji, status, due_date: deadline || null,
      color: STATUS_COLORS[status], sort_order: projects.length,
    };
    if (selected) {
      await supabase.from('projects').update(item).eq('id', selected.id);
    } else {
      await supabase.from('projects').insert(item);
    }
    await loadProjects(userId);
    resetForm();
    setSaving(false);
  };

  const deleteProject = async (id) => {
    Alert.alert('Delete Project', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('projects').delete().eq('id', id);
        setProjects(prev => prev.filter(p => p.id !== id));
      }},
    ]);
  };

  const resetForm = () => {
    setTitle(''); setGoal(''); setDeadline(''); setEmoji('🚀');
    setStatus('active'); setSelected(null); setShowAdd(false);
  };

  const openEdit = (proj) => {
    setSelected(proj); setTitle(proj.title); setGoal(proj.description || '');
    setDeadline(proj.due_date || ''); setEmoji(proj.emoji || '🚀');
    setStatus(proj.status); setShowAdd(true);
  };

  const filtered = projects.filter(p => p.status === filter);

  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor:c.headerBg, padding:s.lg, borderBottomWidth:0.5, borderBottomColor:c.border, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <View>
          <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1 }}>🚀 Projects</Text>
          <Text style={{ fontSize:t.xs, color:c.text3, marginTop:3 }}>{projects.length} total · {projects.filter(p=>p.status==='active').length} active</Text>
        </View>
        <TouchableOpacity style={{ backgroundColor:c.teal, borderRadius:r.lg, paddingHorizontal:s.lg, paddingVertical:s.sm, flexDirection:'row', alignItems:'center', gap:5 }} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color:'#fff', fontWeight:t.bold, fontSize:t.sm }}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:s.lg, paddingVertical:s.sm, gap:s.sm }}>
        {STATUS_OPTIONS.map(st => (
          <TouchableOpacity key={st}
            style={{ paddingHorizontal:s.md, paddingVertical:6, borderRadius:r.full, borderWidth:1, borderColor: filter===st ? STATUS_COLORS[st] : c.border, backgroundColor: filter===st ? STATUS_COLORS[st]+'22' : 'transparent' }}
            onPress={() => setFilter(st)}>
            <Text style={{ fontSize:t.xs, fontWeight: filter===st ? t.bold : t.regular, color: filter===st ? STATUS_COLORS[st] : c.text3 }}>{STATUS_LABELS[st]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? <ActivityIndicator style={{ flex:1 }} color={c.teal} /> : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          contentContainerStyle={{ padding:s.lg, gap:s.sm, paddingBottom:40 }}
          ListEmptyComponent={
            <View style={{ alignItems:'center', paddingTop:60 }}>
              <Text style={{ fontSize:44 }}>🚀</Text>
              <Text style={{ fontSize:t.lg, fontWeight:t.bold, color:c.text1, marginTop:s.lg, marginBottom:s.sm }}>No {STATUS_LABELS[filter]} projects</Text>
              <Text style={{ fontSize:t.sm, color:c.text3 }}>Tap + New to start one</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ backgroundColor:c.bg1, borderRadius:r.lg, padding:s.lg, borderWidth:0.5, borderColor:c.border, borderLeftWidth:3, borderLeftColor:STATUS_COLORS[item.status] || c.teal }}
              onPress={() => openEdit(item)}
            >
              <View style={{ flexDirection:'row', alignItems:'center', gap:s.sm, marginBottom:s.sm }}>
                <Text style={{ fontSize:22 }}>{item.emoji || '🚀'}</Text>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:t.md, fontWeight:t.bold, color:c.text1 }}>{item.title}</Text>
                  {item.description && <Text style={{ fontSize:t.xs, color:c.text3, marginTop:2 }} numberOfLines={1}>{item.description}</Text>}
                </View>
                <TouchableOpacity onPress={() => deleteProject(item.id)}>
                  <Ionicons name="trash-outline" size={16} color={c.text4} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection:'row', gap:s.sm }}>
                <View style={{ backgroundColor:STATUS_COLORS[item.status]+'22', borderRadius:r.full, paddingHorizontal:8, paddingVertical:3 }}>
                  <Text style={{ fontSize:10, color:STATUS_COLORS[item.status], fontWeight:t.bold }}>{STATUS_LABELS[item.status]}</Text>
                </View>
                {item.due_date && <Text style={{ fontSize:t.xs, color:c.text4, alignSelf:'center' }}>📅 {item.due_date}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={resetForm}>
        <KeyboardAvoidingView style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor:c.bg1, borderTopLeftRadius:r.xl, borderTopRightRadius:r.xl, padding:s.xl, paddingBottom:40, maxHeight:'85%' }}>
            <View style={{ width:36, height:4, borderRadius:2, backgroundColor:c.border, alignSelf:'center', marginBottom:s.lg }} />
            <Text style={{ fontSize:t.lg, fontWeight:t.bold, color:c.text1, marginBottom:s.lg }}>{selected ? 'Edit Project' : 'New Project'}</Text>

            {/* Emoji picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:s.md }}>
              {EMOJIS.map(em => (
                <TouchableOpacity key={em} onPress={() => setEmoji(em)}
                  style={{ width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', marginRight:8, borderWidth:2, borderColor: emoji===em ? c.gold : 'transparent', backgroundColor: emoji===em ? c.goldLight : 'transparent' }}>
                  <Text style={{ fontSize:20 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.md, color:c.text1, backgroundColor:c.bg0, marginBottom:s.sm }} value={title} onChangeText={setTitle} placeholder="Project title *" placeholderTextColor={c.text4} autoFocus />
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.sm, minHeight:60, textAlignVertical:'top' }} value={goal} onChangeText={setGoal} placeholder="Goal or description" placeholderTextColor={c.text4} multiline />
            <TextInput style={{ borderWidth:1, borderColor:c.border, borderRadius:r.md, padding:s.md, fontSize:t.sm, color:c.text1, backgroundColor:c.bg0, marginBottom:s.md }} value={deadline} onChangeText={setDeadline} placeholder="Deadline (e.g. 2025-12-31)" placeholderTextColor={c.text4} />

            {/* Status */}
            <View style={{ flexDirection:'row', gap:s.sm, marginBottom:s.lg }}>
              {STATUS_OPTIONS.slice(0,3).map(st => (
                <TouchableOpacity key={st} onPress={() => setStatus(st)}
                  style={{ flex:1, paddingVertical:8, borderRadius:r.md, borderWidth:1, alignItems:'center', borderColor: status===st ? STATUS_COLORS[st] : c.border, backgroundColor: status===st ? STATUS_COLORS[st]+'22' : 'transparent' }}>
                  <Text style={{ fontSize:t.xs, color: status===st ? STATUS_COLORS[st] : c.text3, fontWeight: status===st ? t.bold : t.regular }}>{STATUS_LABELS[st]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection:'row', gap:s.sm }}>
              <TouchableOpacity onPress={resetForm} style={{ flex:1, padding:s.md, alignItems:'center', backgroundColor:c.bg0, borderRadius:r.md, borderWidth:0.5, borderColor:c.border }}>
                <Text style={{ color:c.text3, fontSize:t.sm }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveProject} disabled={!title.trim()||saving}
                style={{ flex:2, padding:s.md, alignItems:'center', backgroundColor:c.teal, borderRadius:r.md, opacity:(!title.trim()||saving)?0.5:1 }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color:'#fff', fontWeight:t.bold, fontSize:t.sm }}>{selected ? 'Save Changes' : 'Create Project'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
