// src/screens/CaptureInbox.js
// One screen to capture everything — links, notes, ideas, tasks, videos
// Works offline, syncs when back online

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Modal, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import {
  getCaptures, addCapture, updateCapture, archiveCapture,
  moveToProject, saveForLater, deleteCapture,
  fetchUrlMeta, getProjects,
} from '../api/captureService';

// Capture types with icons and colors
const TYPES = [
  { key: 'all',   label: 'All',    icon: 'apps-outline' },
  { key: 'note',  label: 'Notes',  icon: 'document-text-outline' },
  { key: 'link',  label: 'Links',  icon: 'link-outline' },
  { key: 'idea',  label: 'Ideas',  icon: 'bulb-outline' },
  { key: 'video', label: 'Videos', icon: 'play-circle-outline' },
  { key: 'task',  label: 'Tasks',  icon: 'checkmark-circle-outline' },
];

const TYPE_COLORS = {
  note:  '#2bb5a0',
  link:  '#c9a84c',
  idea:  '#8b4fc4',
  video: '#e05c5c',
  task:  '#2a8a4a',
  image: '#2a4ac9',
};

const URL_REGEX = /https?:\/\/[^\s]+/;

export default function CaptureInbox() {
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const { user } = useUserProgress();
  const styles = makeStyles(c, t, s, r, sh);

  const [captures, setCaptures] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [addModal, setAddModal] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // Quick capture state
  const [draft, setDraft] = useState('');
  const [draftType, setDraftType] = useState('note');
  const [draftUrl, setDraftUrl] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [urlMeta, setUrlMeta] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const [caps, projs] = await Promise.all([
        getCaptures(user.id, { status: 'inbox' }),
        getProjects(user.id, 'active'),
      ]);
      setCaptures(caps);
      setProjects(projs);
    } catch (e) { console.warn('load', e); }
    setLoading(false);
  };

  // Auto-detect URL when typing
  const handleDraftChange = async (text) => {
    setDraft(text);
    const urlMatch = text.match(URL_REGEX);
    if (urlMatch && draftType !== 'link') {
      setDraftType('link');
      setDraftUrl(urlMatch[0]);
      setFetchingMeta(true);
      try {
        const meta = await fetchUrlMeta(urlMatch[0]);
        setUrlMeta(meta);
      } catch {}
      setFetchingMeta(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) handleDraftChange(text);
    } catch {}
  };

  const handleSave = async () => {
    if (!draft.trim() && !draftUrl) return;
    if (!user) { Alert.alert('Sign in', 'Sign in to save captures.'); return; }
    setSaving(true);
    try {
      const capture = {
        type: draftType,
        title: urlMeta?.title || (draft.length > 60 ? draft.slice(0, 57) + '...' : draft),
        body: draft,
        url: draftUrl || null,
        url_meta: urlMeta || {},
        tags: draftTags.split(',').map(t => t.trim()).filter(Boolean),
        save_for_later: draftType === 'video' ? 'watch' : draftType === 'link' ? 'read' : null,
      };
      const saved = await addCapture(user.id, capture);
      setCaptures(prev => [saved, ...prev]);
      setDraft(''); setDraftUrl(''); setDraftTags(''); setUrlMeta(null);
      setDraftType('note'); setAddModal(false);
    } catch (e) { Alert.alert('Error', 'Could not save. Try again.'); }
    setSaving(false);
  };

  const handleArchive = async (item) => {
    await archiveCapture(item.id);
    setCaptures(prev => prev.filter(c => c.id !== item.id));
    setDetailItem(null);
  };

  const handleSaveLater = async (item, type) => {
    await saveForLater(item.id, type);
    setCaptures(prev => prev.map(c => c.id === item.id ? { ...c, save_for_later: type } : c));
  };

  const handleMoveToProject = async (item, projectId) => {
    await moveToProject(item.id, projectId);
    setCaptures(prev => prev.filter(c => c.id !== item.id));
    setDetailItem(null);
  };

  const filtered = activeType === 'all'
    ? captures
    : captures.filter(c => c.type === activeType);

  if (!user) return (
    <View style={styles.centered}>
      <Text style={styles.signInText}>Sign in to use your inbox</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Text style={styles.headerSub}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeRow}>
        {TYPES.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[styles.typeChip, activeType === type.key && styles.typeChipActive]}
            onPress={() => setActiveType(type.key)}
          >
            <Ionicons
              name={type.icon}
              size={14}
              color={activeType === type.key ? '#fff' : c.text3}
            />
            <Text style={[styles.typeChipText, activeType === type.key && styles.typeChipTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Captures list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={c.teal} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📥</Text>
          <Text style={styles.emptyTitle}>Your inbox is empty</Text>
          <Text style={styles.emptySub}>Tap + to capture a link, note, or idea</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setAddModal(true)}>
            <Text style={styles.emptyBtnText}>Capture something</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: s.lg }}>
          {filtered.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.captureCard}
              onPress={() => setDetailItem(item)}
            >
              <View style={[styles.typeBar, { backgroundColor: TYPE_COLORS[item.type] || c.teal }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.captureTop}>
                  <View style={styles.captureTypePill}>
                    <Text style={[styles.captureTypeText, { color: TYPE_COLORS[item.type] || c.teal }]}>
                      {item.type}
                    </Text>
                  </View>
                  {item.save_for_later && (
                    <View style={styles.saveLaterBadge}>
                      <Text style={styles.saveLaterText}>
                        {item.save_for_later === 'watch' ? '▶ Watch later' : '📖 Read later'}
                      </Text>
                    </View>
                  )}
                </View>
                {item.title && <Text style={styles.captureTitle} numberOfLines={2}>{item.title}</Text>}
                {item.body && !item.url && (
                  <Text style={styles.captureBody} numberOfLines={3}>{item.body}</Text>
                )}
                {item.url && (
                  <Text style={styles.captureUrl} numberOfLines={1}>{item.url}</Text>
                )}
                {item.url_meta?.description && (
                  <Text style={styles.captureMeta} numberOfLines={2}>{item.url_meta.description}</Text>
                )}
                <View style={styles.captureFooter}>
                  <Text style={styles.captureDate}>
                    {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {item.tags?.length > 0 && (
                    <Text style={styles.captureTags}>{item.tags.map(t => `#${t}`).join(' ')}</Text>
                  )}
                </View>
              </View>
              {/* Quick actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => handleSaveLater(item, item.type === 'video' ? 'watch' : 'read')}
                >
                  <Ionicons name="bookmark-outline" size={16} color={c.text3} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => handleArchive(item)}
                >
                  <Ionicons name="checkmark-done-outline" size={16} color={c.text3} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Add Capture Modal */}
      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✦ Capture</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Ionicons name="close" size={22} color={c.text3} />
              </TouchableOpacity>
            </View>

            {/* Type selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginBottom: s.md }}>
              {TYPES.filter(t => t.key !== 'all').map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.draftTypeChip,
                    draftType === type.key && { backgroundColor: TYPE_COLORS[type.key] + '22', borderColor: TYPE_COLORS[type.key] }
                  ]}
                  onPress={() => setDraftType(type.key)}
                >
                  <Ionicons name={type.icon} size={14} color={draftType === type.key ? TYPE_COLORS[type.key] : c.text3} />
                  <Text style={[styles.draftTypeText, draftType === type.key && { color: TYPE_COLORS[type.key] }]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Main input */}
            <TextInput
              style={styles.mainInput}
              value={draft}
              onChangeText={handleDraftChange}
              placeholder={
                draftType === 'link' ? 'Paste a URL or type a link...' :
                draftType === 'idea' ? 'What\'s your idea?' :
                draftType === 'video' ? 'Paste a YouTube or video URL...' :
                draftType === 'task' ? 'What needs to get done?' :
                'Write a note...'
              }
              placeholderTextColor={c.text4}
              multiline
              autoFocus
            />

            {/* Paste button */}
            <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste}>
              <Ionicons name="clipboard-outline" size={14} color={c.teal} />
              <Text style={styles.pasteBtnText}>Paste from clipboard</Text>
            </TouchableOpacity>

            {/* URL meta preview */}
            {fetchingMeta && (
              <View style={styles.metaPreview}>
                <ActivityIndicator size="small" color={c.teal} />
                <Text style={styles.metaFetching}>Fetching link info...</Text>
              </View>
            )}
            {urlMeta && !fetchingMeta && (
              <View style={styles.metaPreview}>
                <Text style={styles.metaTitle} numberOfLines={1}>{urlMeta.title}</Text>
                {urlMeta.description && (
                  <Text style={styles.metaDesc} numberOfLines={2}>{urlMeta.description}</Text>
                )}
                {urlMeta.site_name && (
                  <Text style={styles.metaSite}>{urlMeta.site_name}</Text>
                )}
              </View>
            )}

            {/* Tags */}
            <TextInput
              style={styles.tagsInput}
              value={draftTags}
              onChangeText={setDraftTags}
              placeholder="Tags — comma separated (e.g. money, ideas, health)"
              placeholderTextColor={c.text4}
              autoCapitalize="none"
            />

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, (!draft.trim() && !draftUrl) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving || (!draft.trim() && !draftUrl)}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save to inbox</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail / move modal */}
      {detailItem && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setDetailItem(null)}>
          <View style={styles.detailOverlay}>
            <View style={styles.detailCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{detailItem.type}</Text>
                <TouchableOpacity onPress={() => setDetailItem(null)}>
                  <Ionicons name="close" size={22} color={c.text3} />
                </TouchableOpacity>
              </View>
              {detailItem.title && <Text style={styles.detailTitle}>{detailItem.title}</Text>}
              {detailItem.body && <Text style={styles.detailBody}>{detailItem.body}</Text>}
              {detailItem.url && (
                <Text style={styles.detailUrl}>{detailItem.url}</Text>
              )}

              <Text style={styles.actionLabel}>Move to project</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.lg }}>
                {projects.map(proj => (
                  <TouchableOpacity
                    key={proj.id}
                    style={[styles.projChip, { borderColor: proj.color }]}
                    onPress={() => handleMoveToProject(detailItem, proj.id)}
                  >
                    <Text>{proj.emoji} </Text>
                    <Text style={[styles.projChipText, { color: proj.color }]}>{proj.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.actionLabel}>Save for later</Text>
              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.lg }}>
                <TouchableOpacity
                  style={styles.laterBtn}
                  onPress={() => { handleSaveLater(detailItem, 'read'); setDetailItem(null); }}
                >
                  <Text style={styles.laterBtnText}>📖 Read later</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.laterBtn}
                  onPress={() => { handleSaveLater(detailItem, 'watch'); setDetailItem(null); }}
                >
                  <Text style={styles.laterBtnText}>▶ Watch later</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.archiveBtn} onPress={() => handleArchive(detailItem)}>
                <Ionicons name="checkmark-done" size={16} color={c.teal} />
                <Text style={styles.archiveBtnText}>Mark done / archive</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const makeStyles = (c, t, s, r, sh) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  signInText: { fontSize: t.md, color: c.text3 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: s.lg, paddingTop: s.xl,
    backgroundColor: c.headerBg, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  headerTitle: { fontSize: t.xxl, fontWeight: t.bold, color: c.text1 },
  headerSub: { fontSize: t.xs, color: c.text3, marginTop: 2 },
  addBtn: {
    backgroundColor: c.teal, width: 40, height: 40,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    ...sh.md,
  },
  typeRow: { paddingHorizontal: s.lg, paddingVertical: s.sm, gap: s.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border,
    borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 6,
  },
  typeChipActive: { backgroundColor: c.teal, borderColor: c.teal },
  typeChipText: { fontSize: t.xs, color: c.text3, fontWeight: t.medium },
  typeChipTextActive: { color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xxxl },
  emptyEmoji: { fontSize: 52, marginBottom: s.lg },
  emptyTitle: { fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginBottom: s.sm },
  emptySub: { fontSize: t.sm, color: c.text3, textAlign: 'center', marginBottom: s.xl },
  emptyBtn: {
    backgroundColor: c.teal, borderRadius: r.lg,
    paddingVertical: s.md, paddingHorizontal: s.xl,
  },
  emptyBtnText: { color: '#fff', fontWeight: t.bold, fontSize: t.md },
  captureCard: {
    flexDirection: 'row', backgroundColor: c.bg1,
    borderRadius: r.lg, marginBottom: s.sm,
    borderWidth: 0.5, borderColor: c.border,
    overflow: 'hidden', ...sh.sm,
  },
  typeBar: { width: 3 },
  captureTop: { flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: 4, padding: s.md, paddingBottom: 0 },
  captureTypePill: { backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 },
  captureTypeText: { fontSize: 10, fontWeight: t.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  saveLaterBadge: { backgroundColor: c.goldLight, borderRadius: r.full, paddingHorizontal: 6, paddingVertical: 2 },
  saveLaterText: { fontSize: 10, color: c.gold },
  captureTitle: { fontSize: t.sm, fontWeight: t.semibold, color: c.text1, paddingHorizontal: s.md, marginBottom: 3 },
  captureBody: { fontSize: t.sm, color: c.text2, paddingHorizontal: s.md, lineHeight: 18, marginBottom: 3 },
  captureUrl: { fontSize: t.xs, color: c.teal, paddingHorizontal: s.md, marginBottom: 3 },
  captureMeta: { fontSize: t.xs, color: c.text3, paddingHorizontal: s.md, marginBottom: 3 },
  captureFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: s.md, paddingBottom: s.sm, paddingTop: 4 },
  captureDate: { fontSize: 10, color: c.text4 },
  captureTags: { fontSize: 10, color: c.teal },
  quickActions: { flexDirection: 'column', padding: s.sm, gap: s.sm, justifyContent: 'center' },
  quickBtn: { padding: s.xs },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: c.modalBg, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl,
    padding: s.xl, borderTopWidth: 0.5, borderColor: c.border,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.lg },
  modalTitle: { fontSize: t.lg, fontWeight: t.bold, color: c.text1 },
  draftTypeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: c.border, borderRadius: r.full,
    paddingHorizontal: s.md, paddingVertical: 6, marginRight: s.sm,
    backgroundColor: c.bg1,
  },
  draftTypeText: { fontSize: t.xs, color: c.text3 },
  mainInput: {
    borderWidth: 1, borderColor: c.inputBorder, borderRadius: r.md,
    padding: s.md, fontSize: t.md, color: c.text1,
    backgroundColor: c.inputBg, minHeight: 100,
    textAlignVertical: 'top', marginBottom: s.sm,
  },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.md },
  pasteBtnText: { fontSize: t.xs, color: c.teal },
  metaPreview: {
    backgroundColor: c.bg2, borderRadius: r.md, padding: s.md,
    marginBottom: s.md, borderWidth: 0.5, borderColor: c.border,
  },
  metaFetching: { fontSize: t.xs, color: c.text3, marginLeft: s.sm },
  metaTitle: { fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginBottom: 3 },
  metaDesc: { fontSize: t.xs, color: c.text2, marginBottom: 3 },
  metaSite: { fontSize: 10, color: c.text3 },
  tagsInput: {
    borderWidth: 1, borderColor: c.inputBorder, borderRadius: r.md,
    padding: s.md, fontSize: t.sm, color: c.text1,
    backgroundColor: c.inputBg, marginBottom: s.md,
  },
  saveBtn: {
    backgroundColor: c.teal, borderRadius: r.md,
    paddingVertical: s.md + 2, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontWeight: t.bold, fontSize: t.md },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  detailCard: {
    backgroundColor: c.modalBg, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl,
    padding: s.xl, borderTopWidth: 0.5, borderColor: c.border, maxHeight: '80%',
  },
  detailTitle: { fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm },
  detailBody: { fontSize: t.md, color: c.text2, lineHeight: 22, marginBottom: s.md },
  detailUrl: { fontSize: t.sm, color: c.teal, marginBottom: s.lg },
  actionLabel: { fontSize: t.xs, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm, fontWeight: t.semibold },
  projChip: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 7, marginRight: s.sm,
  },
  projChipText: { fontSize: t.xs, fontWeight: t.semibold },
  laterBtn: {
    flex: 1, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border,
    borderRadius: r.md, padding: s.md, alignItems: 'center',
  },
  laterBtnText: { fontSize: t.sm, color: c.text1, fontWeight: t.medium },
  archiveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: s.sm, backgroundColor: c.tealLight, borderRadius: r.md,
    padding: s.md, borderWidth: 0.5, borderColor: c.teal,
  },
  archiveBtnText: { fontSize: t.sm, color: c.teal, fontWeight: t.semibold },
});
