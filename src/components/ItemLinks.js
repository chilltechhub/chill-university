// src/components/ItemLinks.js
// Generic "linked items" picker + display for attaching ONE record (a note,
// a resource, etc.) to existing Resources, Projects, or Research items.
//
// Unlike RelatedLinks.js (area-scoped — links live as separate area_notes
// rows), this is item-scoped: the caller owns a plain array of
// {kind, refId, title} objects — typically stored in that record's own
// url_meta.links — and gets the updated array back via onChange. Nothing
// here touches the database directly; persisting is the caller's job.

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient';

const KINDS = [
  { key: 'resource', label: 'Resources', icon: 'bookmark-outline', screen: 'ResourcesToolsScreen', table: 'captures', typeVal: 'resource' },
  { key: 'project',  label: 'Projects',  icon: 'rocket-outline',   screen: 'ProjectsScreen',        table: 'projects', typeVal: null },
  { key: 'research', label: 'Research',  icon: 'search-outline',   screen: 'ResearchScreen',        table: 'captures', typeVal: 'link' },
];

export default function ItemLinks({ links = [], onChange, excludeId, color, c, t, s, r }) {
  const navigation = useNavigation();
  const [userId,  setUserId]  = useState(null);
  const [picker,  setPicker]  = useState(null); // KINDS[i].key while the picker modal is open
  const [search,  setSearch]  = useState('');
  const [options, setOptions] = useState([]);
  const [optLoading, setOptLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id); });
  }, []);

  const openPicker = async (kind) => {
    setPicker(kind);
    setSearch('');
    setOptLoading(true);
    const meta = KINDS.find(k => k.key === kind);
    let query = supabase.from(meta.table).select(meta.table === 'projects' ? 'id,title,emoji,color,status' : 'id,title,url')
      .eq('user_id', userId).is('deleted_at', null).limit(50);
    if (meta.typeVal) query = query.eq('type', meta.typeVal);
    if (meta.table === 'projects') query = query.eq('status', 'active');
    else if (meta.typeVal === 'resource') query = query.eq('status', 'active');
    else if (meta.typeVal === 'link') query = query.in('status', ['inbox', 'active']);
    const { data } = await query.order('created_at', { ascending: false });
    setOptions((data || []).filter(o => o.id !== excludeId));
    setOptLoading(false);
  };

  const linkItem = (kind, item) => {
    if (links.some(l => l.kind === kind && l.refId === item.id)) { setPicker(null); return; }
    onChange([...links, { kind, refId: item.id, title: item.title || item.url || 'Untitled' }]);
    setPicker(null);
  };

  const unlink = (kind, refId) => onChange(links.filter(l => !(l.kind === kind && l.refId === refId)));

  const openTarget = (kind) => navigation.navigate(KINDS.find(k => k.key === kind).screen);

  const filteredOptions = options.filter(o => !search || (o.title || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <View>
      {KINDS.map(kind => {
        const items = links.filter(l => l.kind === kind.key);
        return (
          <View key={kind.key} style={{ marginBottom: s.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: s.sm }}>
              <Ionicons name={kind.icon} size={13} color={color} />
              <Text style={{ fontSize: t.xs, color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, flex: 1 }}>{kind.label}</Text>
              <TouchableOpacity onPress={() => openPicker(kind.key)} disabled={!userId}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: color + '18', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Ionicons name="add" size={12} color={color} />
                <Text style={{ fontSize: 10, color, fontWeight: '700' }}>Link</Text>
              </TouchableOpacity>
            </View>

            {items.length === 0 ? (
              <Text style={{ fontSize: t.xs, color: c.text4, fontStyle: 'italic' }}>Nothing linked yet</Text>
            ) : (
              items.map(item => (
                <View key={`${item.kind}_${item.refId}`} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.sm, marginBottom: 6, borderWidth: 0.5, borderColor: c.border }}>
                  <TouchableOpacity onPress={() => openTarget(kind.key)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: t.xs, color: c.text1, flex: 1 }} numberOfLines={1}>{item.title}</Text>
                    <Ionicons name="open-outline" size={12} color={color} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => unlink(kind.key, item.refId)} style={{ padding: 2 }}>
                    <Ionicons name="close" size={13} color={c.text4} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        );
      })}

      {/* Picker modal */}
      <Modal visible={!!picker} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 40, maxHeight: '75%' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>
              Link a {KINDS.find(k => k.key === picker)?.label.replace(/s$/, '')}
            </Text>
            <TextInput
              style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, marginBottom: s.md }}
              value={search} onChangeText={setSearch}
              placeholder="Search..." placeholderTextColor={c.text4} />
            {optLoading ? <ActivityIndicator color={color} style={{ marginTop: 20 }} /> : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {filteredOptions.length === 0 ? (
                  <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', paddingVertical: 30 }}>Nothing found</Text>
                ) : filteredOptions.map(item => (
                  <TouchableOpacity key={item.id} onPress={() => linkItem(picker, item)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
                    {item.emoji ? <Text style={{ fontSize: 16 }}>{item.emoji}</Text> : <Ionicons name="document-outline" size={16} color={color} />}
                    <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }} numberOfLines={1}>{item.title || item.url || 'Untitled'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setPicker(null)}
              style={{ marginTop: s.md, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ color: c.text3, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
