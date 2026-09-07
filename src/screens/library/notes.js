// src/screens/library/notes.js
//
// SUPERSEDED — Notes Desk is now the matching type filter inside the
// Knowledge Vault (src/screens/library/knowledge.js), which carries every
// feature below. Nothing imports this file any more; the route name that
// used to point here is registered against the Knowledge Vault in
// LibraryNav.js. Kept on disk only until the merged screen has been
// exercised in a build — safe to delete after that.
//
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Alert,
  Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { supabase } from '../../api/supabaseClient';
import { addCapture, deleteCapture, updateCapture } from '../../api/captureService';
import { notesToMarkdown, notesToCSV } from '../../logic/exportUtils';
import LinkifiedText from '../../components/LinkifiedText';
import useFolders from '../../logic/useFolders';
import FolderRow from '../../components/FolderRow';
import FolderAssignSheet from '../../components/FolderAssignSheet';
import ItemLinks from '../../components/ItemLinks';
import TourSpot from '../../components/TourSpot';

const FEATURES = [
  { emoji: '✏️', icon: 'create-outline',   title: 'Quick capture',     desc: 'Write a note in seconds and find it later' },
  { emoji: '🏷️', icon: 'pricetag-outline', title: 'Tag and organize', desc: 'Add tags to find related notes fast' },
  { emoji: '📁', icon: 'folder-outline',   title: 'Sort into folders', desc: 'Keep related notes together' },
  { emoji: '🔗', icon: 'link-outline',     title: 'Link everywhere',  desc: 'Attach a note to a project, resource, or research item' },
];

const SORT_OPTIONS = [
  { key: 'recent', label: 'Newest', icon: 'time-outline' },
  { key: 'oldest', label: 'Oldest', icon: 'hourglass-outline' },
  { key: 'az',     label: 'A–Z',    icon: 'text-outline' },
];

// ─── Detail / edit modal ──────────────────────────────────────────────────────
function NoteDetailModal({ note, folders, onClose, onSave, onDelete, onAssignFolder, onLinksChange, c, t, s, r }) {
  const { showEmojis } = useUIPrefs();
  const [body,    setBody]    = useState('');
  const [tagsTxt, setTagsTxt] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    setBody(note?.body || note?.title || '');
    setTagsTxt((note?.tags || []).join(', '));
    setEditing(false);
  }, [note?.id]);

  if (!note) return null;
  const folder = folders.find(f => f.id === note.url_meta?.folder);

  const save = async () => {
    if (!body.trim()) return;
    setSaving(true);
    const trimmed = body.trim();
    const tags = tagsTxt.split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    await onSave(note.id, { body: trimmed, title: trimmed.length > 80 ? trimmed.slice(0, 77) + '...' : trimmed, tags });
    setEditing(false);
    setSaving(false);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: s.xl, paddingBottom: 40, maxHeight: '90%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.md }}>
            <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>{showEmojis ? '📝 ' : ''}Note</Text>
            {folder && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: folder.color + '18', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 }}>
                <Ionicons name="folder" size={11} color={folder.color} />
                <Text style={{ fontSize: 10, color: folder.color, fontWeight: '700' }}>{folder.name}</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={20} color={c.text3} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {editing ? (
              <>
                <TextInput
                  style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.gold + '55', minHeight: 100, textAlignVertical: 'top' }}
                  value={body} onChangeText={setBody} multiline autoFocus
                  placeholder="Write your note..." placeholderTextColor={c.text4}
                />
                <TextInput
                  style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.xs, color: c.text1, borderWidth: 1, borderColor: c.border, marginTop: s.sm }}
                  value={tagsTxt} onChangeText={setTagsTxt}
                  placeholder="Tags (comma separated)" placeholderTextColor={c.text4} autoCapitalize="none"
                />
                <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.md }}>
                  <TouchableOpacity onPress={() => { setEditing(false); setBody(note.body || note.title || ''); setTagsTxt((note.tags || []).join(', ')); }}
                    style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
                    <Text style={{ color: c.text3, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={save} disabled={!body.trim() || saving}
                    style={{ flex: 2, padding: s.md, alignItems: 'center', backgroundColor: c.gold, borderRadius: r.md, opacity: !body.trim() ? 0.5 : 1 }}>
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <LinkifiedText text={note.body || note.title} style={{ fontSize: t.md, color: c.text1, lineHeight: 22 }} linkColor={c.teal} />
                {note.tags?.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                    {note.tags.map(tg => (
                      <View key={tg} style={{ backgroundColor: c.bg2, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 9, color: c.text4 }}>#{tg}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 18, marginTop: 16 }}>
                  <TouchableOpacity onPress={() => setEditing(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="pencil-outline" size={15} color={c.teal} />
                    <Text style={{ color: c.teal, fontWeight: '700', fontSize: 12 }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onAssignFolder(note)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="folder-outline" size={15} color={c.text3} />
                    <Text style={{ color: c.text3, fontWeight: '700', fontSize: 12 }}>Folder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(note.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="trash-outline" size={15} color={c.error || '#e05858'} />
                    <Text style={{ color: c.error || '#e05858', fontWeight: '700', fontSize: 12 }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Text style={{ fontSize: t.xs, color: c.gold, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginTop: 22, marginBottom: 10 }}>
              {showEmojis ? '🔗 ' : ''}Linked
            </Text>
            <ItemLinks
              links={note.url_meta?.links || []}
              onChange={(links) => onLinksChange(note, links)}
              excludeId={note.id}
              color={c.gold} c={c} t={t} s={s} r={r}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function NotesScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const [userId, setUserId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showSort, setShowSort] = useState(false);
  const [folderFilter, setFolderFilter] = useState(null);
  const [assigningNote, setAssigningNote] = useState(null);
  const [detailNote, setDetailNote] = useState(null);

  const { folders, createFolder, renameFolder, deleteFolder } = useFolders('notes', userId);

  const load = useCallback(async (uid) => {
    const { data, error } = await supabase
      .from('captures').select('*')
      .eq('user_id', uid).eq('type', 'note').neq('status', 'archived').is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (!error && data) setNotes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, [load]);

  useFocusEffect(useCallback(() => { if (userId) load(userId); }, [userId, load]));

  const add = async () => {
    if (!input.trim() || !userId) return;
    setSaving(true);
    const body = input.trim();
    const tags = tagsInput.split(',').map(tg => tg.trim().toLowerCase()).filter(Boolean);
    try {
      const saved = await addCapture(userId, {
        type: 'note',
        title: body.length > 80 ? body.slice(0, 77) + '...' : body,
        body,
        tags,
        source: 'manual',
      });
      setNotes(prev => [saved, ...prev]);
      setInput('');
      setTagsInput('');
    } catch (e) {
      Alert.alert('Could not save', e.message || 'Try again.');
    }
    setSaving(false);
  };

  const remove = async (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (detailNote?.id === id) setDetailNote(null);
    try { await deleteCapture(id); } catch (e) { Alert.alert('Could not delete', e.message || ''); }
  };

  const patchNote = async (id, patch) => {
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...patch } : n)));
    setDetailNote(prev => (prev?.id === id ? { ...prev, ...patch } : prev));
    try { await updateCapture(id, patch); } catch (e) { Alert.alert('Could not save', e.message || ''); }
  };

  const assignFolder = (note, folderId) => {
    const nextMeta = { ...(note.url_meta || {}) };
    if (folderId) nextMeta.folder = folderId; else delete nextMeta.folder;
    patchNote(note.id, { url_meta: nextMeta });
    setAssigningNote(null);
  };

  const handleDeleteFolder = (folderId) => {
    deleteFolder(folderId);
    if (folderFilter === folderId) setFolderFilter(null);
    notes.filter(n => n.url_meta?.folder === folderId).forEach(n => assignFolder(n, null));
  };

  const updateLinks = (note, links) => {
    patchNote(note.id, { url_meta: { ...(note.url_meta || {}), links } });
  };

  const exportAs = async (kind) => {
    if (notes.length === 0) { Alert.alert('Nothing to export', 'Write a note first.'); return; }
    const text = kind === 'markdown' ? notesToMarkdown(notes) : notesToCSV(notes);
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${notes.length} note${notes.length === 1 ? '' : 's'} copied as ${kind === 'markdown' ? 'Markdown' : 'CSV'}.`);
  };

  // ── Derived list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = notes.filter(n => {
      const matchFolder = !folderFilter || n.url_meta?.folder === folderFilter;
      const q = search.trim().toLowerCase();
      const matchSearch = !q
        || (n.body || n.title || '').toLowerCase().includes(q)
        || (n.tags || []).some(tg => tg.includes(q));
      return matchFolder && matchSearch;
    });
    if (sortBy === 'oldest') list = [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortBy === 'az') list = [...list].sort((a, b) => (a.title || a.body || '').localeCompare(b.title || b.body || ''));
    // 'recent' — already ordered by created_at desc from the query
    return list;
  }, [notes, search, sortBy, folderFilter]);

  const activeSort = SORT_OPTIONS.find(o => o.key === sortBy);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ backgroundColor: c.headerBg, padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen'))}
            style={{ padding: 2, marginTop: 2 }}
          >
            <Ionicons name="chevron-back" size={22} color={c.teal} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{showEmojis ? '📝 ' : ''}Notes</Text>
            {showSubtext && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 4 }}>Quick notes and thoughts, saved to your account</Text>}
          </View>
        </View>
        {notes.length > 0 && (
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <TouchableOpacity onPress={() => exportAs('markdown')} style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: 8, borderWidth: 0.5, borderColor: c.border }}>
              <Ionicons name="document-text-outline" size={16} color={c.text2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => exportAs('csv')} style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: 8, borderWidth: 0.5, borderColor: c.border }}>
              <Ionicons name="grid-outline" size={16} color={c.text2} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Input */}
      <TourSpot id="notes-input">
      <View style={{ padding: s.lg, backgroundColor: c.bg1, borderBottomWidth: 0.5, borderBottomColor: c.border, gap: s.sm }}>
        <View style={{ flexDirection: 'row', gap: s.sm }}>
          <TextInput
            style={{ flex: 1, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 0.5, borderColor: c.border }}
            value={input} onChangeText={setInput}
            placeholder="Write a note..." placeholderTextColor={c.text4}
            multiline
          />
          <TouchableOpacity
            style={{ backgroundColor: c.teal, borderRadius: r.md, padding: s.md, alignItems: 'center', justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
            onPress={add} disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="add" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
        <TextInput
          style={{ backgroundColor: c.bg0, borderRadius: r.md, paddingHorizontal: s.md, paddingVertical: 8, fontSize: t.xs, color: c.text1, borderWidth: 0.5, borderColor: c.border }}
          value={tagsInput} onChangeText={setTagsInput}
          placeholder="Tags (comma separated, optional)" placeholderTextColor={c.text4}
          onSubmitEditing={add}
        />
      </View>
      </TourSpot>

      {/* Search + sort */}
      <View style={{ flexDirection: 'row', paddingHorizontal: s.lg, paddingTop: s.md, gap: s.sm }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg1, borderRadius: r.md, paddingHorizontal: s.md, borderWidth: 0.5, borderColor: c.border, gap: 8 }}>
          <Ionicons name="search" size={15} color={c.text3} />
          <TextInput
            style={{ flex: 1, paddingVertical: 9, fontSize: t.xs, color: c.text1 }}
            value={search} onChangeText={setSearch}
            placeholder="Search notes..." placeholderTextColor={c.text4}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={c.text4} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => setShowSort(v => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
          <Ionicons name={activeSort.icon} size={15} color={c.teal} />
          <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={12} color={c.text3} />
        </TouchableOpacity>
      </View>

      {showSort && (
        <View style={{ marginHorizontal: s.lg, marginTop: s.sm, backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, overflow: 'hidden' }}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.key} onPress={() => { setSortBy(opt.key); setShowSort(false); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: s.md, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: c.border, backgroundColor: sortBy === opt.key ? c.teal + '10' : 'transparent' }}>
              <Ionicons name={opt.icon} size={13} color={sortBy === opt.key ? c.teal : c.text3} />
              <Text style={{ flex: 1, fontSize: t.xs, color: sortBy === opt.key ? c.teal : c.text2, fontWeight: sortBy === opt.key ? 'bold' : '400' }}>{opt.label}</Text>
              {sortBy === opt.key && <Ionicons name="checkmark" size={14} color={c.teal} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Folders */}
      <View style={{ marginTop: s.md }}>
        <FolderRow
          folders={folders}
          activeFolderId={folderFilter}
          onSelect={setFolderFilter}
          onCreate={createFolder}
          onRename={renameFolder}
          onDelete={handleDeleteFolder}
        />
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={c.teal} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={n => n.id}
          contentContainerStyle={{ padding: s.lg, paddingTop: 0, gap: s.sm }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              {showEmojis ? <Text style={{ fontSize: 44, marginBottom: s.lg }}>📝</Text> : <Ionicons name="document-text-outline" size={40} color={c.teal} style={{ marginBottom: s.lg }} />}
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>
                {notes.length === 0 ? 'Notes' : 'No matches'}
              </Text>
              <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20, marginBottom: s.xl }}>
                {notes.length === 0 ? 'Quick notes and thoughts captured anywhere' : 'Try a different search or folder'}
              </Text>
              {notes.length === 0 && FEATURES.map((f, i) => (
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
          renderItem={({ item }) => {
            const folder = folders.find(f => f.id === item.url_meta?.folder);
            const linkCount = item.url_meta?.links?.length || 0;
            return (
              <TouchableOpacity onPress={() => setDetailNote(item)} activeOpacity={0.8}
                style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.gold }}>
                <LinkifiedText text={item.body || item.title} style={{ fontSize: t.sm, color: c.text1, lineHeight: 20 }} linkColor={c.teal} numberOfLines={4} />

                {(item.tags?.length > 0 || folder || linkCount > 0) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 8 }}>
                    {folder && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: folder.color + '18', borderRadius: r.full, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Ionicons name="folder" size={9} color={folder.color} />
                        <Text style={{ fontSize: 9, color: folder.color, fontWeight: '700' }}>{folder.name}</Text>
                      </View>
                    )}
                    {item.tags?.map(tg => (
                      <View key={tg} style={{ backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 9, color: c.text4 }}>#{tg}</Text>
                      </View>
                    ))}
                    {linkCount > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.bg2, borderRadius: r.full, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Ionicons name="link" size={9} color={c.text4} />
                        <Text style={{ fontSize: 9, color: c.text4 }}>{linkCount}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: c.border }}>
                  <TouchableOpacity onPress={() => setAssigningNote(item)}>
                    <Ionicons name={folder ? 'folder' : 'folder-outline'} size={16} color={folder ? folder.color : c.text4} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(item.id)}>
                    <Ionicons name="close-circle-outline" size={16} color={c.text4} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {detailNote && (
        <NoteDetailModal
          note={detailNote}
          folders={folders}
          onClose={() => setDetailNote(null)}
          onSave={patchNote}
          onDelete={remove}
          onAssignFolder={setAssigningNote}
          onLinksChange={updateLinks}
          c={c} t={t} s={s} r={r}
        />
      )}

      <FolderAssignSheet
        visible={!!assigningNote}
        folders={folders}
        currentFolderId={assigningNote?.url_meta?.folder || null}
        onAssign={(folderId) => assignFolder(assigningNote, folderId)}
        onClose={() => setAssigningNote(null)}
        onCreateFolder={createFolder}
      />
    </KeyboardAvoidingView>
  );
}
