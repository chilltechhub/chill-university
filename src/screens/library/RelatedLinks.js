// src/screens/library/RelatedLinks.js
// Drop-in "Related" panel for any life-area (sub-)screen — lets you link
// existing Notes, Projects, and Resources to this area so they're one tap
// away instead of buried in three separate screens. Self-contained: does
// its own load/save/delete, only needs an areaId + accent color.
//
// Links are stored as area_notes rows with a "__LINK__:" content prefix so
// they never leak into any screen's plain log/notes feed — every screen
// that lists area_notes for this area_id should exclude that prefix (see
// EXCLUDE_LINK_FILTER below).

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../api/supabaseClient';

const LINK_PREFIX = '__LINK__:';
// Reusable filter for any screen's own area_notes query, so linked items
// don't show up as garbled entries in that screen's log/notes feed.
export const EXCLUDE_LINK_FILTER = (query) => query.not('content', 'ilike', `${LINK_PREFIX}%`);

const KINDS = [
  { key: 'note',     label: 'Notes',     icon: 'document-text-outline', screen: 'NotesScreen',          table: 'captures', typeVal: 'note' },
  { key: 'project',  label: 'Projects',  icon: 'rocket-outline',        screen: 'ProjectsScreen',       table: 'projects', typeVal: null },
  { key: 'resource', label: 'Resources', icon: 'bookmark-outline',      screen: 'ResourcesToolsScreen', table: 'captures', typeVal: 'resource' },
];

function encodeLink(kind, refId, title) {
  return LINK_PREFIX + JSON.stringify({ kind, refId, title });
}
function decodeLink(content) {
  try { return JSON.parse(content.slice(LINK_PREFIX.length)); }
  catch { return null; }
}

export default function RelatedLinks({ areaId, color, c, t, s, r }) {
  const navigation = useNavigation();
  const [userId,  setUserId]  = useState(null);
  const [links,   setLinks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [picker,  setPicker]  = useState(null); // KINDS[i].key while the picker modal is open
  const [search,  setSearch]  = useState('');
  const [options, setOptions] = useState([]);
  const [optLoading, setOptLoading] = useState(false);

  const load = useCallback(async (uid) => {
    setLoading(true);
    const { data } = await supabase.from('area_notes').select('*')
      .eq('user_id', uid).eq('area_id', areaId)
      .ilike('content', `${LINK_PREFIX}%`)
      .order('created_at', { ascending: false });
    setLinks((data || []).map(row => ({ id: row.id, ...decodeLink(row.content) })).filter(l => l && l.refId));
    setLoading(false);
  }, [areaId]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, [load]);

  const openPicker = async (kind) => {
    setPicker(kind);
    setSearch('');
    setOptLoading(true);
    const meta = KINDS.find(k => k.key === kind);
    let query = supabase.from(meta.table).select(meta.table === 'projects' ? 'id,title,emoji,color,status' : 'id,title,url')
      .eq('user_id', userId).is('deleted_at', null).limit(50);
    if (meta.typeVal) query = query.eq('type', meta.typeVal);
    if (meta.table === 'projects') query = query.eq('status', 'active');
    // Resources live at status 'active' (see resourcetools.js); notes stay
    // visible until archived (matches NotesScreen's own definition).
    else if (meta.typeVal === 'resource') query = query.eq('status', 'active');
    else if (meta.typeVal === 'note') query = query.neq('status', 'archived');
    const { data } = await query.order('created_at', { ascending: false });
    setOptions(data || []);
    setOptLoading(false);
  };

  const linkItem = async (kind, item) => {
    const title = item.title || item.url || 'Untitled';
    if (links.some(l => l.kind === kind && l.refId === item.id)) { setPicker(null); return; }
    const content = encodeLink(kind, item.id, title);
    const { data } = await supabase.from('area_notes').insert({
      user_id: userId, area_id: areaId, content, created_at: new Date().toISOString(),
    }).select().single();
    if (data) setLinks(prev => [{ id: data.id, kind, refId: item.id, title }, ...prev]);
    setPicker(null);
  };

  const unlink = async (id) => {
    setLinks(prev => prev.filter(l => l.id !== id));
    await supabase.from('area_notes').delete().eq('id', id);
  };

  const openTarget = (kind) => {
    const meta = KINDS.find(k => k.key === kind);
    navigation.navigate(meta.screen);
  };

  const filteredOptions = options.filter(o =>
    !search || (o.title || '').toLowerCase().includes(search.toLowerCase())
  );

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

            {loading ? null : items.length === 0 ? (
              <Text style={{ fontSize: t.xs, color: c.text4, fontStyle: 'italic' }}>Nothing linked yet</Text>
            ) : (
              items.map(item => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.sm, marginBottom: 6, borderWidth: 0.5, borderColor: c.border }}>
                  <TouchableOpacity onPress={() => openTarget(kind.key)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: t.xs, color: c.text1, flex: 1 }} numberOfLines={1}>{item.title}</Text>
                    <Ionicons name="open-outline" size={12} color={color} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => unlink(item.id)} style={{ padding: 2 }}>
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
