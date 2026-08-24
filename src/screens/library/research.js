// src/screens/library/ResearchScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Linking,
  Modal, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../api/supabaseClient';

const { width } = Dimensions.get('window');

export default function ResearchScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'link' | 'note'
  const [selectedTag, setSelectedTag] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        load(user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) load(userId);
    }, [userId])
  );

  const load = async (uid) => {
    setLoading(true);
    const { data } = await supabase
      .from('captures')
      .select('*')
      .eq('user_id', uid)
      .in('type', ['link', 'note'])
      .eq('status', 'inbox')
      .order('created_at', { ascending: false });

    if (data) setEntries(data);
    setLoading(false);
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const item = {
      user_id: userId,
      type: url.trim() ? 'link' : 'note',
      title: title.trim(),
      body: notes.trim() || null,
      url: url.trim() || null,
      status: 'inbox',
      tags: tags
        .split(',')
        .map((tg) => tg.trim().toLowerCase())
        .filter(Boolean),
      source: 'manual',
    };

    const { data } = await supabase.from('captures').insert(item).select().single();
    if (data) setEntries((prev) => [data, ...prev]);

    setTitle('');
    setUrl('');
    setNotes('');
    setTags('');
    setShowAdd(false);
    setSaving(false);
  };

  const deleteEntry = async (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
    await supabase.from('captures').delete().eq('id', id);
  };

  // Extract unique tags across all entries
  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []))
  );

  const filtered = entries.filter((e) => {
    const matchSearch =
      !search ||
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.body?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    const matchTag = !selectedTag || (e.tags && e.tags.includes(selectedTag));
    return matchSearch && matchType && matchTag;
  });

  return (
    <View style={styles.container}>
      {/* Flight Control Telemetry Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>KNOWLEDGE & SOURCE INTEL</Text>
          <Text style={styles.headerTitle}>Research Vault</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={18} color="#000" />
          <Text style={styles.addBtnText}>Capture</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#00F0FF" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Scan title, notes, or web intel..."
            placeholderTextColor="#626D82"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#626D82" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Type & Tag Filters */}
      <View style={styles.filterBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Type Filters */}
          <TouchableOpacity
            style={[styles.typeChip, typeFilter === 'all' && styles.typeChipActive]}
            onPress={() => setTypeFilter('all')}
          >
            <Text style={[styles.typeChipText, typeFilter === 'all' && styles.typeChipTextActive]}>All Vault</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeChip, typeFilter === 'link' && styles.typeChipActiveCyan]}
            onPress={() => setTypeFilter('link')}
          >
            <Ionicons name="link-outline" size={12} color={typeFilter === 'link' ? '#00F0FF' : '#626D82'} />
            <Text style={[styles.typeChipText, typeFilter === 'link' && { color: '#00F0FF', fontWeight: 'bold' }]}>
              Links
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeChip, typeFilter === 'note' && styles.typeChipActiveGold]}
            onPress={() => setTypeFilter('note')}
          >
            <Ionicons name="document-text-outline" size={12} color={typeFilter === 'note' ? '#FFB800' : '#626D82'} />
            <Text style={[styles.typeChipText, typeFilter === 'note' && { color: '#FFB800', fontWeight: 'bold' }]}>
              Notes
            </Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Dynamic Tag Filters */}
          {allTags.map((tg) => {
            const isSelected = selectedTag === tg;
            return (
              <TouchableOpacity
                key={tg}
                style={[styles.tagChip, isSelected && styles.tagChipActive]}
                onPress={() => setSelectedTag(isSelected ? null : tg)}
              >
                <Text style={[styles.tagChipText, isSelected && styles.tagChipTextActive]}>#{tg}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00F0FF" />
          <Text style={styles.loadingText}>Accessing Supabase Data Stream...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="radar" size={50} color="#1F263E" />
              <Text style={styles.emptyTitle}>Vault Empty</Text>
              <Text style={styles.emptySubtitle}>No links, research papers, or notes matching criteria.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isLink = item.type === 'link';
            const accentColor = isLink ? '#00F0FF' : '#FFB800';

            return (
              <TouchableOpacity
                style={[styles.card, { borderLeftColor: accentColor }]}
                onPress={() => setSelectedEntry(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.typeIconBox, { backgroundColor: `${accentColor}15` }]}>
                    <Ionicons
                      name={isLink ? 'link-outline' : 'document-text-outline'}
                      size={18}
                      color={accentColor}
                    />
                  </View>

                  <View style={styles.cardTitleArea}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.url && (
                      <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
                        <Text style={styles.cardUrl} numberOfLines={1}>
                          {item.url}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity onPress={() => deleteEntry(item.id)} style={styles.trashBtn}>
                    <Ionicons name="trash-outline" size={16} color="#626D82" />
                  </TouchableOpacity>
                </View>

                {item.body && (
                  <Text style={styles.cardBody} numberOfLines={3}>
                    {item.body}
                  </Text>
                )}

                {item.tags?.length > 0 && (
                  <View style={styles.cardTagRow}>
                    {item.tags.map((tg) => (
                      <View key={tg} style={styles.cardTagPill}>
                        <Text style={styles.cardTagText}>#{tg}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Capture Intel Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalHeaderTitle}>⚡ CAPTURE RESEARCH INTEL</Text>

            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Title or Research Topic *"
              placeholderTextColor="#626D82"
              autoFocus
            />

            <TextInput
              style={styles.modalInput}
              value={url}
              onChangeText={setUrl}
              placeholder="Source URL (Optional)"
              placeholderTextColor="#626D82"
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Executive Summary or Synthesis Notes..."
              placeholderTextColor="#626D82"
              multiline
            />

            <TextInput
              style={styles.modalInput}
              value={tags}
              onChangeText={setTags}
              placeholder="Tags (comma separated, e.g. ai, math, robotics)"
              placeholderTextColor="#626D82"
              autoCapitalize="none"
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={save}
                disabled={!title.trim() || saving}
                style={[styles.saveBtn, (!title.trim() || saving) && { opacity: 0.5 }]}
              >
                {saving ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Encrypt & Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detailed Entry Modal */}
      <Modal visible={!!selectedEntry} transparent animationType="fade" onRequestClose={() => setSelectedEntry(null)}>
        <View style={styles.modalOverlay}>
          {selectedEntry && (
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />

              <View style={styles.detailHeader}>
                <View
                  style={[
                    styles.typeIconBox,
                    { backgroundColor: selectedEntry.type === 'link' ? 'rgba(0,240,255,0.15)' : 'rgba(255,184,0,0.15)' },
                  ]}
                >
                  <Ionicons
                    name={selectedEntry.type === 'link' ? 'link-outline' : 'document-text-outline'}
                    size={22}
                    color={selectedEntry.type === 'link' ? '#00F0FF' : '#FFB800'}
                  />
                </View>
                <Text style={styles.detailTitle}>{selectedEntry.title}</Text>
                <TouchableOpacity onPress={() => setSelectedEntry(null)}>
                  <Ionicons name="close-circle" size={24} color="#626D82" />
                </TouchableOpacity>
              </View>

              {selectedEntry.url && (
                <TouchableOpacity
                  style={styles.openUrlBanner}
                  onPress={() => Linking.openURL(selectedEntry.url)}
                >
                  <Ionicons name="compass-outline" size={16} color="#00F0FF" />
                  <Text style={styles.openUrlText} numberOfLines={1}>
                    {selectedEntry.url}
                  </Text>
                  <Ionicons name="open-outline" size={14} color="#00F0FF" />
                </TouchableOpacity>
              )}

              {selectedEntry.body && (
                <ScrollView style={styles.detailBodyContainer}>
                  <Text style={styles.detailBodyText}>{selectedEntry.body}</Text>
                </ScrollView>
              )}

              {selectedEntry.tags?.length > 0 && (
                <View style={styles.cardTagRow}>
                  {selectedEntry.tags.map((tg) => (
                    <View key={tg} style={styles.cardTagPill}>
                      <Text style={styles.cardTagText}>#{tg}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.detailFooter}>
                <TouchableOpacity
                  style={styles.deleteDetailBtn}
                  onPress={() => deleteEntry(selectedEntry.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF5252" />
                  <Text style={styles.deleteDetailText}>Delete Entry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0D17', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  headerSubtitle: { color: '#00F0FF', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00F0FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141829', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1F263E', gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: '#FFF', fontSize: 13 },
  filterBarContainer: { marginBottom: 16 },
  filterScroll: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#141829', borderWidth: 1, borderColor: '#1F263E' },
  typeChipActive: { borderColor: '#7C4DFF', backgroundColor: 'rgba(124,77,255,0.15)' },
  typeChipActiveCyan: { borderColor: '#00F0FF', backgroundColor: 'rgba(0,240,255,0.15)' },
  typeChipActiveGold: { borderColor: '#FFB800', backgroundColor: 'rgba(255,184,0,0.15)' },
  typeChipText: { color: '#626D82', fontSize: 11, fontWeight: '600' },
  typeChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  filterDivider: { width: 1, height: 16, backgroundColor: '#1F263E', marginHorizontal: 4 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#06080F', borderWidth: 1, borderColor: '#1F263E' },
  tagChipActive: { borderColor: '#00E676', backgroundColor: 'rgba(0,230,118,0.15)' },
  tagChipText: { color: '#626D82', fontSize: 10 },
  tagChipTextActive: { color: '#00E676', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#626D82', fontSize: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { color: '#626D82', fontSize: 12, marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#141829', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1F263E', borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  typeIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardTitleArea: { flex: 1 },
  cardTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  cardUrl: { color: '#00F0FF', fontSize: 11, marginTop: 2 },
  trashBtn: { padding: 4 },
  cardBody: { color: '#A0AABF', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  cardTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  cardTagPill: { backgroundColor: '#06080F', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#1F263E' },
  cardTagText: { color: '#FFB800', fontSize: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#141829', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,240,255,0.3)', maxHeight: '85%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#1F263E', alignSelf: 'center', marginBottom: 16 },
  modalHeaderTitle: { color: '#00F0FF', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  modalInput: { backgroundColor: '#06080F', borderWidth: 1, borderColor: '#1F263E', borderRadius: 10, padding: 12, color: '#FFF', fontSize: 13, marginBottom: 10 },
  modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#06080F', borderRadius: 10, borderWidth: 1, borderColor: '#1F263E' },
  cancelBtnText: { color: '#626D82', fontSize: 12, fontWeight: 'bold' },
  saveBtn: { flex: 2, paddingVertical: 12, alignItems: 'center', backgroundColor: '#00F0FF', borderRadius: 10 },
  saveBtnText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  detailTitle: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  openUrlBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#06080F', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,240,255,0.3)', marginBottom: 16 },
  openUrlText: { flex: 1, color: '#00F0FF', fontSize: 12 },
  detailBodyContainer: { maxHeight: 200, marginBottom: 16 },
  detailBodyText: { color: '#A0AABF', fontSize: 13, lineHeight: 20 },
  detailFooter: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#1F263E', paddingTop: 12, alignItems: 'flex-end' },
  deleteDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12 },
  deleteDetailText: { color: '#FF5252', fontSize: 12, fontWeight: 'bold' }
});