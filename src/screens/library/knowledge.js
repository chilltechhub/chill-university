// src/screens/library/knowledge.js
// The Knowledge Vault — one home for everything you save to read, reference,
// or write down. It replaces three separate screens that were all storing
// their rows in the same `captures` table anyway:
//
//   Notes Desk               → item kind 'note'      (captures.type 'note')
//   Research Vault           → 'bookmark' / 'paper'  (captures.type 'link')
//   Resources & Instruments  → 'tool'                (captures.type 'resource')
//
// Nothing about the data changed, so every row those screens ever wrote shows
// up here untouched: the kind is *derived* from the columns already on the row
// (type + url), with url_meta.kind as an override once someone reclassifies an
// item by hand. The old routes still exist (see LibraryNav.js) and land here
// with the matching type filter pre-selected, so links from the Capture Inbox,
// Home, life areas, and item cross-links all keep working.
//
// Folders were three separate AsyncStorage namespaces ('notes', 'research',
// 'resources'); useFolders now merges those into one 'knowledge' namespace on
// first read, keeping folder ids so every item stays in the folder it was in.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Linking, Share,
  Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../../api/offlineCache';
import { fetchContentPool } from '../../api/remoteConfigService';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { LIFE_AREAS } from './LifeAreaScreen';
import { RESEARCH_CATEGORIES, RESEARCH_CATALOG, RESOURCE_CATALOG } from '../../data/knowledgeCatalogs';
import { notesToMarkdown, notesToCSV } from '../../logic/exportUtils';
import useFolders from '../../logic/useFolders';
import FolderRow from '../../components/FolderRow';
import FolderAssignSheet from '../../components/FolderAssignSheet';
import ItemLinks from '../../components/ItemLinks';
import LinkifiedText from '../../components/LinkifiedText';
import TourSpot from '../../components/TourSpot';

// ─── Item kinds ────────────────────────────────────────────────────────────
// One row shape, four profiles layered over it. `type`/`status` are what
// actually gets written to `captures`, and they match exactly what the three
// old screens wrote, so nothing new appears (or disappears) anywhere else.
export const KINDS = {
  note:     { label: 'Note',     plural: 'Notes',     emoji: '📝', icon: 'document-text-outline', colorKey: 'gold',      type: 'note',     status: 'inbox'  },
  bookmark: { label: 'Bookmark', plural: 'Bookmarks', emoji: '🔗', icon: 'link-outline',          colorKey: 'teal',      type: 'link',     status: 'inbox'  },
  paper:    { label: 'Paper',    plural: 'Papers',    emoji: '🎓', icon: 'school-outline',        colorKey: 'purple',    type: 'link',     status: 'inbox'  },
  tool:     { label: 'Tool',     plural: 'Tools',     emoji: '🛠️', icon: 'construct-outline',     colorKey: 'financial', type: 'resource', status: 'active' },
};
const KIND_KEYS = ['note', 'bookmark', 'paper', 'tool'];

const GENERAL_META = { id: 'general', label: 'General', emoji: '🌐', icon: 'globe-outline', color: '#5c9ce0' };
const AREA_MAP = Object.fromEntries([...LIFE_AREAS, GENERAL_META].map((a) => [a.id, a]));
const FILTER_AREAS = [...LIFE_AREAS, GENERAL_META];
const CATEGORY_MAP = Object.fromEntries(RESEARCH_CATEGORIES.map((cat) => [cat.id, cat]));

// Sort options — the union of what the three screens each offered.
const SORT_OPTIONS = [
  { key: 'recent',  label: 'Newest',        icon: 'time-outline' },
  { key: 'oldest',  label: 'Oldest',        icon: 'hourglass-outline' },
  { key: 'az',      label: 'A–Z',           icon: 'text-outline' },
  { key: 'starred', label: 'Starred First', icon: 'star-outline' },
  { key: 'visits',  label: 'Most Opened',   icon: 'flame-outline' },
  { key: 'area',    label: 'Life Area',     icon: 'apps-outline' },
];

const FEATURES = [
  { emoji: '✏️', icon: 'create-outline',      title: 'Quick capture',     desc: 'Write a note in seconds and find it later' },
  { emoji: '🔗', icon: 'link-outline',        title: 'Save any link',     desc: 'Bookmarks, papers, and tools in one list' },
  { emoji: '🏷️', icon: 'pricetag-outline',    title: 'Tag and organize',  desc: 'Add tags to find related items fast' },
  { emoji: '📁', icon: 'folder-outline',      title: 'Sort into folders', desc: 'Notes, links, and tools can share a folder' },
  { emoji: '🧭', icon: 'compass-outline',     title: 'Discover',          desc: 'One-tap save from curated research tools & sites' },
  { emoji: '🧩', icon: 'git-network-outline', title: 'Link everywhere',   desc: 'Attach any item to a project or another item' },
];

// ─── Classification ────────────────────────────────────────────────────────
// Anything that looks academic gets filed as a paper rather than a plain
// bookmark. Deliberately a heuristic on the URL only — it runs on paste, and
// the type chips in the add sheet override it.
const PAPER_HOSTS = [
  'arxiv.org', 'biorxiv.org', 'medrxiv.org', 'ssrn.com', 'jstor.org', 'doi.org',
  'pubmed.ncbi.nlm.nih.gov', 'ncbi.nlm.nih.gov', 'scholar.google', 'semanticscholar.org',
  'researchgate.net', 'sciencedirect.com', 'springer.com', 'link.springer.com',
  'nature.com', 'science.org', 'plos.org', 'acm.org', 'ieee.org', 'ieeexplore.ieee.org',
  'jamanetwork.com', 'thelancet.com', 'bmj.com', 'cell.com', 'pnas.org', 'doaj.org',
  'core.ac.uk', 'osf.io', 'zenodo.org', 'hal.science',
];
const DOI_RE = /\b10\.\d{4,9}\/[-._;()/:a-z0-9]+/i;

export const isPaperUrl = (raw) => {
  if (!raw) return false;
  const u = raw.toLowerCase();
  if (/\.pdf(\?|#|$)/.test(u)) return true;
  if (DOI_RE.test(u)) return true;
  return PAPER_HOSTS.some((h) => u.includes(h));
};

// What kind a stored row is. url_meta.kind wins (someone reclassified it by
// hand); otherwise it comes from the columns the old screens already wrote.
export const rowKind = (row) => {
  const explicit = row?.url_meta?.kind;
  if (explicit && KINDS[explicit]) return explicit;
  if (row?.type === 'resource') return 'tool';
  if (row?.type === 'note') return 'note';
  return isPaperUrl(row?.url) ? 'paper' : 'bookmark';
};

const normalizeUrl = (raw) => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

// Same trim the Notes Desk used, so note titles keep looking the way they did.
const deriveTitle = (body) => {
  const trimmed = (body || '').trim();
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
};

const parseTags = (raw) => (raw || '').split(',').map((tg) => tg.trim().toLowerCase()).filter(Boolean);

// A saved item's life area is whichever area-id it carries as a tag — the
// convention Resources & Instruments established, now used by every kind.
const getItemAreaId = (item) => {
  const tags = item.tags || [];
  const hit = LIFE_AREAS.find((a) => tags.includes(a.id));
  return hit ? hit.id : 'general';
};

// Interleave section headers into an already-bucketed list, following the
// canonical life-area order (with General last).
const withAreaHeaders = (list, getAreaId) => {
  const buckets = {};
  list.forEach((item) => {
    const aid = getAreaId(item);
    if (!buckets[aid]) buckets[aid] = [];
    buckets[aid].push(item);
  });
  const out = [];
  FILTER_AREAS.forEach((area) => {
    const items = buckets[area.id];
    if (items && items.length) {
      out.push({ __header: true, key: `h_${area.id}`, label: area.label, emoji: area.emoji, icon: area.icon, color: area.color, count: items.length });
      items.forEach((it) => out.push(it));
    }
  });
  return out;
};

const withCategoryHeaders = (list) => {
  const buckets = {};
  list.forEach((item) => {
    if (!buckets[item.catId]) buckets[item.catId] = [];
    buckets[item.catId].push(item);
  });
  const out = [];
  RESEARCH_CATEGORIES.forEach((cat) => {
    const items = buckets[cat.id];
    if (items && items.length) {
      out.push({ __header: true, key: `h_${cat.id}`, label: cat.label, emoji: cat.emoji, icon: cat.icon, color: cat.color, count: items.length });
      items.forEach((it) => out.push(it));
    }
  });
  return out;
};

const citationLine = (citation) => {
  if (!citation) return '';
  return [citation.author, citation.source, citation.year].filter(Boolean).join(' · ');
};

// ─── Add / edit form ───────────────────────────────────────────────────────
// One sheet for all four kinds. Shared fields stay put as you switch kinds so
// nothing typed gets thrown away; the citation block only shows for papers.
function ItemForm({ kind, setKind, title, setTitle, url, setUrl, body, setBody, tagsTxt, setTagsTxt,
  citation, setCitation, areaId, setAreaId, autoKind, c, styles, showEmojis }) {
  return (
    <>
      <Text style={styles.modalLabel}>Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {KIND_KEYS.map((k) => {
          const meta = KINDS[k];
          const color = c[meta.colorKey] || c.teal;
          const isSelected = kind === k;
          return (
            <TouchableOpacity
              key={k}
              style={[styles.chip, isSelected && { borderColor: color, backgroundColor: `${color}22` }]}
              onPress={() => setKind(k)}
            >
              {showEmojis ? <Text style={{ fontSize: 12 }}>{meta.emoji}</Text> : <Ionicons name={meta.icon} size={12} color={color} />}
              <Text style={[styles.chipText, isSelected && { color, fontWeight: 'bold' }]}>{meta.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TextInput
        style={styles.modalInput}
        value={title}
        onChangeText={setTitle}
        placeholder={kind === 'note' ? 'Title (optional — the first line is used)' : 'Title or name *'}
        placeholderTextColor={c.text4}
      />

      {kind !== 'note' && (
        <>
          <TextInput
            style={styles.modalInput}
            value={url}
            onChangeText={setUrl}
            placeholder={kind === 'tool' ? 'URL *' : 'Source URL (optional)'}
            placeholderTextColor={c.text4}
            autoCapitalize="none"
            keyboardType="url"
          />
          {autoKind && autoKind !== kind && (
            <TouchableOpacity style={styles.autoHint} onPress={() => setKind(autoKind)}>
              <Ionicons name="sparkles-outline" size={12} color={c.teal} />
              <Text style={styles.autoHintText}>
                That link looks like a {KINDS[autoKind].label.toLowerCase()} — tap to file it as one.
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <TextInput
        style={[styles.modalInput, styles.modalTextArea]}
        value={body}
        onChangeText={setBody}
        placeholder={kind === 'note' ? 'Write your note...' : 'Summary or notes (optional)...'}
        placeholderTextColor={c.text4}
        multiline
      />

      <TextInput
        style={styles.modalInput}
        value={tagsTxt}
        onChangeText={setTagsTxt}
        placeholder="Tags (comma separated)"
        placeholderTextColor={c.text4}
        autoCapitalize="none"
      />

      {kind === 'paper' && (
        <>
          <Text style={styles.modalLabel}>Citation</Text>
          <TextInput
            style={styles.modalInput}
            value={citation.author}
            onChangeText={(v) => setCitation({ ...citation, author: v })}
            placeholder="Author(s)"
            placeholderTextColor={c.text4}
          />
          <TextInput
            style={styles.modalInput}
            value={citation.source}
            onChangeText={(v) => setCitation({ ...citation, source: v })}
            placeholder="Journal or publisher"
            placeholderTextColor={c.text4}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[styles.modalInput, { flex: 1 }]}
              value={citation.year}
              onChangeText={(v) => setCitation({ ...citation, year: v })}
              placeholder="Year"
              placeholderTextColor={c.text4}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.modalInput, { flex: 2 }]}
              value={citation.doi}
              onChangeText={(v) => setCitation({ ...citation, doi: v })}
              placeholder="DOI"
              placeholderTextColor={c.text4}
              autoCapitalize="none"
            />
          </View>
        </>
      )}

      <Text style={styles.modalLabel}>Life area (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        <TouchableOpacity
          style={[styles.chip, !areaId && styles.chipActive]}
          onPress={() => setAreaId(null)}
        >
          <Text style={[styles.chipText, !areaId && styles.chipTextActive]}>General</Text>
        </TouchableOpacity>
        {LIFE_AREAS.map((area) => {
          const isSelected = areaId === area.id;
          return (
            <TouchableOpacity
              key={area.id}
              style={[styles.chip, isSelected && { borderColor: area.color, backgroundColor: `${area.color}22` }]}
              onPress={() => setAreaId(isSelected ? null : area.id)}
            >
              {showEmojis ? <Text style={{ fontSize: 12 }}>{area.emoji}</Text> : <Ionicons name={area.icon} size={12} color={area.color} />}
              <Text style={[styles.chipText, isSelected && { color: area.color, fontWeight: 'bold' }]}>{area.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
}

// ─── Add sheet ─────────────────────────────────────────────────────────────
function AddItemModal({ visible, defaultKind, onClose, onSave, c, styles, showEmojis }) {
  const [kind, setKind] = useState(defaultKind);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [tagsTxt, setTagsTxt] = useState('');
  const [citation, setCitation] = useState({ author: '', source: '', year: '', doi: '' });
  const [areaId, setAreaId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setKind(defaultKind);
    setTitle(''); setUrl(''); setBody(''); setTagsTxt('');
    setCitation({ author: '', source: '', year: '', doi: '' });
    setAreaId(null);
  }, [visible, defaultKind]);

  // Auto-classification: a pasted URL decides bookmark vs paper. Once a kind
  // is picked by hand it only *suggests*, via the hint under the URL field.
  const autoKind = useMemo(() => {
    if (!url.trim()) return null;
    return isPaperUrl(normalizeUrl(url)) ? 'paper' : 'bookmark';
  }, [url]);

  // A URL typed into what started as a note means it isn't a note any more.
  useEffect(() => {
    if (kind === 'note' && url.trim()) setKind(autoKind || 'bookmark');
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsUrl = kind === 'tool';
  const hasTitle = !!title.trim() || (kind === 'note' && !!body.trim());
  const canSave = hasTitle && (!needsUrl || !!url.trim());

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    const ok = await onSave({
      kind,
      title: title.trim() || deriveTitle(body),
      url: normalizeUrl(url),
      body: body.trim(),
      tags: parseTags(tagsTxt),
      citation,
      areaId,
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalHeaderTitle}>{showEmojis ? '⚡ ' : ''}ADD TO VAULT</Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <ItemForm
              kind={kind} setKind={setKind}
              title={title} setTitle={setTitle}
              url={url} setUrl={setUrl}
              body={body} setBody={setBody}
              tagsTxt={tagsTxt} setTagsTxt={setTagsTxt}
              citation={citation} setCitation={setCitation}
              areaId={areaId} setAreaId={setAreaId}
              autoKind={autoKind}
              c={c} styles={styles} showEmojis={showEmojis}
            />
          </ScrollView>

          <View style={styles.modalActionRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              disabled={!canSave || saving}
              style={[styles.saveBtn, (!canSave || saving) && { opacity: 0.5 }]}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save to Vault</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Detail drawer ─────────────────────────────────────────────────────────
// One sheet, four profiles: notes open straight into their body, links get a
// URL banner and open/visit tracking, papers add citation fields, and every
// kind gets tags, life area, folder, and cross-links.
function DetailModal({ item, folders, onClose, onSave, onDelete, onAssignFolder, onLinksChange,
  onToggleStar, onOpenLink, onShare, c, t, s, r, styles, showEmojis }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editKind, setEditKind] = useState('note');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [tagsTxt, setTagsTxt] = useState('');
  const [citation, setCitation] = useState({ author: '', source: '', year: '', doi: '' });
  const [areaId, setAreaId] = useState(null);

  const resetFrom = (src) => {
    if (!src) return;
    const k = rowKind(src);
    const cit = src.url_meta?.citation || {};
    setEditKind(k);
    setTitle(src.title || '');
    setUrl(src.url || '');
    setBody(src.body || (k === 'note' ? src.title || '' : ''));
    // The life-area tag is edited through the area chips, not the tag field.
    setTagsTxt((src.tags || []).filter((tg) => !LIFE_AREAS.some((a) => a.id === tg)).join(', '));
    setCitation({ author: cit.author || '', source: cit.source || '', year: cit.year || '', doi: cit.doi || '' });
    const aid = getItemAreaId(src);
    setAreaId(aid === 'general' ? null : aid);
  };

  useEffect(() => { resetFrom(item); setEditing(false); }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;

  const kind = rowKind(item);
  const meta = KINDS[kind];
  const accent = c[meta.colorKey] || c.teal;
  const folder = folders.find((f) => f.id === item.url_meta?.folder);
  const area = AREA_MAP[getItemAreaId(item)];
  const visits = item.url_meta?.visits || 0;
  const cite = citationLine(item.url_meta?.citation);
  const doi = item.url_meta?.citation?.doi;

  const save = async () => {
    setSaving(true);
    await onSave(item, {
      kind: editKind,
      title: title.trim() || deriveTitle(body),
      url: normalizeUrl(url),
      body: body.trim(),
      tags: parseTags(tagsTxt),
      citation,
      areaId,
    });
    setSaving(false);
    setEditing(false);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          <View style={styles.detailHeader}>
            <View style={[styles.typeIconBox, { backgroundColor: `${accent}22` }]}>
              {showEmojis ? <Text style={{ fontSize: 17 }}>{item.url_meta?.emoji || meta.emoji}</Text> : <Ionicons name={meta.icon} size={18} color={accent} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailKind, { color: accent }]}>{meta.label.toUpperCase()}</Text>
              <Text style={styles.detailTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
            </View>
            <TouchableOpacity onPress={() => onToggleStar(item)} style={styles.iconBtn}>
              <Ionicons name={item.url_meta?.starred ? 'star' : 'star-outline'} size={19} color={item.url_meta?.starred ? c.gold : c.text4} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="close-circle" size={22} color={c.text4} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {editing ? (
              <>
                <ItemForm
                  kind={editKind} setKind={setEditKind}
                  title={title} setTitle={setTitle}
                  url={url} setUrl={setUrl}
                  body={body} setBody={setBody}
                  tagsTxt={tagsTxt} setTagsTxt={setTagsTxt}
                  citation={citation} setCitation={setCitation}
                  areaId={areaId} setAreaId={setAreaId}
                  autoKind={null}
                  c={c} styles={styles} showEmojis={showEmojis}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                  <TouchableOpacity onPress={() => { resetFrom(item); setEditing(false); }} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={save} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {!!item.url && (
                  <TouchableOpacity style={styles.openUrlBanner} onPress={() => onOpenLink(item)}>
                    <Ionicons name="compass-outline" size={16} color={c.teal} />
                    <Text style={styles.openUrlText} numberOfLines={1}>{item.url}</Text>
                    <Ionicons name="open-outline" size={14} color={c.teal} />
                  </TouchableOpacity>
                )}

                {!!cite && (
                  <View style={styles.citationBox}>
                    <Text style={styles.citationText}>{cite}</Text>
                    {!!doi && (
                      <TouchableOpacity onPress={() => Linking.openURL(`https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}`)}>
                        <Text style={styles.citationDoi}>DOI: {doi}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {!!(item.body || kind === 'note') && (
                  <LinkifiedText
                    text={item.body || item.title}
                    style={styles.detailBodyText}
                    linkColor={c.teal}
                  />
                )}

                <View style={styles.detailActionRow}>
                  <TouchableOpacity onPress={() => setEditing(true)} style={styles.detailAction}>
                    <Ionicons name="pencil-outline" size={15} color={c.teal} />
                    <Text style={[styles.detailActionText, { color: c.teal }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onAssignFolder(item)} style={styles.detailAction}>
                    <Ionicons name={folder ? 'folder' : 'folder-outline'} size={15} color={folder ? folder.color : c.text3} />
                    <Text style={[styles.detailActionText, folder && { color: folder.color }]}>
                      {folder ? folder.name : 'Folder'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onShare(item)} style={styles.detailAction}>
                    <Ionicons name="share-outline" size={15} color={c.text3} />
                    <Text style={styles.detailActionText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.detailAction}>
                    <Ionicons name="trash-outline" size={15} color={c.error} />
                    <Text style={[styles.detailActionText, { color: c.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardTagRow}>
                  <View style={[styles.pill, { borderColor: `${area.color}55`, backgroundColor: `${area.color}18` }]}>
                    <Text style={[styles.pillText, { color: area.color }]}>{showEmojis ? `${area.emoji} ` : ''}{area.label}</Text>
                  </View>
                  {item.tags?.map((tg) => (
                    <View key={tg} style={styles.tagPill}>
                      <Text style={styles.tagPillText}>#{tg}</Text>
                    </View>
                  ))}
                  {visits > 0 && (
                    <View style={styles.visitsPill}>
                      <Ionicons name="flame-outline" size={10} color={c.text4} />
                      <Text style={styles.visitsPillText}>{visits}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.linkedHeader, { color: accent }]}>{showEmojis ? '🔗 ' : ''}Linked</Text>
                <ItemLinks
                  links={item.url_meta?.links || []}
                  onChange={(links) => onLinksChange(item, links)}
                  excludeId={item.id}
                  color={accent} c={c} t={t} s={s} r={r}
                />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────
export default function KnowledgeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const styles = makeStyles(c);

  const [userId, setUserId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState(route.params?.initialTab === 'discover' ? 'discover' : 'vault');
  // Discover keeps both curated catalogs — they group the same kind of thing
  // along two different, both-useful axes, so they stay two sources.
  const [discoverSource, setDiscoverSource] = useState('research');
  const [catalog, setCatalog] = useState(RESOURCE_CATALOG);

  const [kindFilter, setKindFilter] = useState(route.params?.initialType || 'all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [areaFilter, setAreaFilter] = useState(null);
  const [catFilter, setCatFilter] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [folderFilter, setFolderFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [input, setInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [assigningEntry, setAssigningEntry] = useState(null);

  // One folder namespace for the whole vault, seeded from the three the old
  // screens each kept on their own.
  const { folders, createFolder, renameFolder, deleteFolder } =
    useFolders('knowledge', userId, ['notes', 'research', 'resources']);

  // The old route names are aliases for this screen, each with its own type
  // filter — arriving through a different one should move the pills rather
  // than silently keep whatever was selected last time.
  useEffect(() => {
    if (route.params?.initialType) setKindFilter(route.params.initialType);
  }, [route.params?.initialType]);

  // focusId — the command palette (and anything else linking to one saved
  // item) lands here and opens that item's detail sheet directly, rather
  // than dropping you in a list to find it again. Cleared once used so
  // navigating back later doesn't reopen it.
  useEffect(() => {
    const focusId = route.params?.focusId;
    if (!focusId) return;
    const hit = entries.find((e) => e.id === focusId);
    if (!hit) return;
    setDetailItem(hit);
    navigation.setParams({ focusId: undefined });
  }, [route.params?.focusId, entries, navigation]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  // Remote Discover catalog — falls back to RESOURCE_CATALOG until this
  // resolves, or forever if it fails/is empty.
  useEffect(() => {
    fetchContentPool('featured_resource').then((rows) => {
      if (rows.length) {
        setCatalog(rows.map((row) => ({
          id: row.id, areaId: row.key, emoji: row.meta?.emoji, title: row.title, url: row.meta?.url, desc: row.body,
        })));
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) load(userId);
    }, [userId])
  );

  // Everything the three old screens showed, in one pass. The status rules
  // below are exactly theirs, ORed together, so no row that used to be
  // visible is dropped and none that used to be hidden turns up:
  //   notes      — anything not archived (Notes Desk)
  //   links      — inbox or active       (Research Vault)
  //   resources  — active                (Resources & Instruments)
  const isVisibleRow = (row) => {
    if (row.type === 'note') return true;
    if (row.type === 'link') return ['inbox', 'active'].includes(row.status);
    if (row.type === 'resource') return row.status === 'active';
    return false;
  };

  const load = async (uid) => {
    setLoading(true);
    const cacheKey = `knowledge_vault_${uid}`;
    const cached = await cacheRead(cacheKey);
    if (cached) setEntries(cached);

    if (await isOnline()) {
      const { data } = await supabase
        .from('captures')
        .select('*')
        .eq('user_id', uid)
        .in('type', ['note', 'link', 'resource'])
        .neq('status', 'archived')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (data) {
        const rows = data.filter(isVisibleRow);
        setEntries(rows);
        cacheWrite(cacheKey, rows);
      }
    }
    setLoading(false);
  };

  // ── Writes ────────────────────────────────────────────────────────────────
  const patchLocal = (id, patch) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    setDetailItem((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  };

  // Optimistic everywhere: the row on screen updates first, the write follows.
  const patchEntry = async (id, patch, { silent = true } = {}) => {
    patchLocal(id, patch);
    const { error } = await supabase
      .from('captures')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error && !silent) Alert.alert('Could not save', error.message || 'Try again.');
  };

  // Universal duplicate check — one URL or DOI can only be in the vault once,
  // whatever kind it was saved as.
  const findDuplicate = (url, doi) => {
    const u = (url || '').trim().toLowerCase().replace(/\/+$/, '');
    const d = (doi || '').trim().toLowerCase();
    return entries.find((e) => {
      if (u && (e.url || '').trim().toLowerCase().replace(/\/+$/, '') === u) return true;
      if (d && (e.url_meta?.citation?.doi || '').trim().toLowerCase() === d) return true;
      return false;
    }) || null;
  };

  // Tags carry the life area (the convention Resources & Instruments set), so
  // the area chip and the free tags merge into one array on write.
  const buildTags = (tags, areaId) => Array.from(new Set([
    ...(areaId && areaId !== 'general' ? [areaId] : []),
    ...(tags || []),
  ]));

  const insertItem = async ({ kind, title, url, body, tags, citation, areaId, urlMeta = {}, source = 'manual' }) => {
    const meta = KINDS[kind];
    const cleanCitation = citation && Object.values(citation).some(Boolean)
      ? Object.fromEntries(Object.entries(citation).filter(([, v]) => v))
      : null;
    const item = {
      user_id: userId,
      type: meta.type,
      status: meta.status,
      title: title || null,
      body: body || null,
      url: url || null,
      url_meta: {
        ...urlMeta,
        kind,
        ...(cleanCitation ? { citation: cleanCitation } : {}),
      },
      tags: buildTags(tags, areaId),
      source,
    };
    // offlineWrite, not a bare insert: a save made with no connection gets
    // queued and replayed instead of being lost, which is what the Notes Desk
    // did (via captureService.addCapture) and what every kind gets now.
    const { row } = await offlineWrite(supabase, 'captures', item);
    if (row) setEntries((prev) => [row, ...prev]);
    return row;
  };

  const saveNewItem = async ({ kind, title, url, body, tags, citation, areaId }) => {
    const dupe = (url || citation?.doi) ? findDuplicate(url, citation?.doi) : null;
    if (dupe) {
      Alert.alert(
        'Already in your vault',
        `"${dupe.title || dupe.url}" is already saved as a ${KINDS[rowKind(dupe)].label.toLowerCase()}.`
      );
      return false;
    }
    return !!(await insertItem({ kind, title, url, body, tags, citation, areaId }));
  };

  // Quick note composer — the same one-line capture the Notes Desk opened with.
  const addQuickNote = async () => {
    if (!input.trim() || !userId) return;
    setSavingNote(true);
    const body = input.trim();
    const saved = await insertItem({
      kind: 'note',
      title: deriveTitle(body),
      body,
      tags: parseTags(tagsInput),
      areaId: areaFilter,
    });
    if (saved) { setInput(''); setTagsInput(''); }
    setSavingNote(false);
  };

  const saveEdits = async (item, { kind, title, url, body, tags, citation, areaId }) => {
    const meta = KINDS[kind];
    const cleanCitation = citation && Object.values(citation).some(Boolean)
      ? Object.fromEntries(Object.entries(citation).filter(([, v]) => v))
      : null;
    const nextMeta = { ...(item.url_meta || {}), kind };
    if (cleanCitation) nextMeta.citation = cleanCitation; else delete nextMeta.citation;
    // status is only rewritten when the underlying capture type changes (and
    // the old status might not keep the row visible). Editing an item that
    // was routed somewhere — status 'organized', say — must not quietly drop
    // it back into the Capture Inbox.
    const statusPatch = meta.type === item.type ? {} : { status: meta.status };
    await patchEntry(item.id, {
      type: meta.type,
      ...statusPatch,
      title: title || null,
      body: body || null,
      url: url || null,
      tags: buildTags(tags, areaId),
      url_meta: nextMeta,
    }, { silent: false });
  };

  // Soft delete — moves to Recently Deleted in the Capture Inbox for 7 days.
  const removeEntry = async (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (detailItem?.id === id) setDetailItem(null);
    const { error } = await supabase.from('captures').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) Alert.alert('Could not delete', error.message || 'Try again.');
  };

  const toggleStar = (item) => {
    patchEntry(item.id, { url_meta: { ...(item.url_meta || {}), starred: !item.url_meta?.starred } });
  };

  const openLink = (item) => {
    if (!item.url) return;
    Linking.openURL(item.url);
    if (!item.id) return;
    patchEntry(item.id, {
      url_meta: {
        ...(item.url_meta || {}),
        visits: (item.url_meta?.visits || 0) + 1,
        lastOpenedAt: new Date().toISOString(),
      },
    });
  };

  const shareItem = (item) => {
    Share.share({ message: item.url ? `${item.title} — ${item.url}` : item.title }).catch(() => {});
  };

  const assignFolder = (item, folderId) => {
    const nextMeta = { ...(item.url_meta || {}) };
    if (folderId) nextMeta.folder = folderId; else delete nextMeta.folder;
    patchEntry(item.id, { url_meta: nextMeta });
    setAssigningEntry(null);
  };

  const handleDeleteFolder = (folderId) => {
    deleteFolder(folderId);
    if (folderFilter === folderId) setFolderFilter(null);
    // Clear the folder off any entries that were in it, rather than leaving
    // them silently pointing at a folder that no longer exists.
    entries.filter((e) => e.url_meta?.folder === folderId).forEach((e) => assignFolder(e, null));
  };

  const updateLinks = (item, links) => {
    patchEntry(item.id, { url_meta: { ...(item.url_meta || {}), links } });
  };

  // ── Discover ──────────────────────────────────────────────────────────────
  const savedIdForUrl = (u) => entries.find((e) => e.url === u)?.id || null;

  const toggleResearchCatalogItem = (cat) => {
    const existingId = savedIdForUrl(cat.url);
    if (existingId) { removeEntry(existingId); return; }
    insertItem({
      kind: isPaperUrl(cat.url) ? 'paper' : 'bookmark',
      title: cat.title,
      url: cat.url,
      body: cat.desc,
      tags: [cat.catId],
      urlMeta: { emoji: cat.emoji, category: cat.catId, source: 'catalog' },
      source: 'catalog',
    });
  };

  const toggleResourceCatalogItem = (cat) => {
    const existingId = savedIdForUrl(cat.url);
    if (existingId) { removeEntry(existingId); return; }
    insertItem({
      kind: 'tool',
      title: cat.title,
      url: cat.url,
      body: cat.desc,
      tags: [],
      areaId: cat.areaId,
      urlMeta: { emoji: cat.emoji, source: 'catalog' },
      source: 'catalog',
    });
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const decorated = useMemo(
    () => entries.map((e) => ({ ...e, __kind: rowKind(e), __area: getItemAreaId(e) })),
    [entries]
  );

  const kindCounts = useMemo(() => {
    const counts = { all: decorated.length };
    decorated.forEach((e) => { counts[e.__kind] = (counts[e.__kind] || 0) + 1; });
    return counts;
  }, [decorated]);

  const areaCounts = useMemo(() => {
    const counts = {};
    decorated.forEach((e) => { counts[e.__area] = (counts[e.__area] || 0) + 1; });
    return counts;
  }, [decorated]);

  // Catalog category tags and life-area tags stay out of the chip row so it
  // reflects the user's own organization, the way the Research Vault's did.
  const allTags = useMemo(() => Array.from(new Set(
    decorated.flatMap((e) => e.tags || [])
      .filter((tg) => !CATEGORY_MAP[tg] && !LIFE_AREAS.some((a) => a.id === tg))
  )), [decorated]);

  // One search box over everything: title, body, URL, tags, and citations.
  const matchesSearch = (e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const cit = e.url_meta?.citation || {};
    return [e.title, e.body, e.url, cit.author, cit.source, cit.year, cit.doi, ...(e.tags || [])]
      .some((v) => (v || '').toString().toLowerCase().includes(q));
  };

  const filtered = useMemo(() => {
    let list = decorated.filter((e) => (
      (kindFilter === 'all' || e.__kind === kindFilter)
      && (!areaFilter || e.__area === areaFilter)
      && (!folderFilter || e.url_meta?.folder === folderFilter)
      && (!selectedTag || (e.tags || []).includes(selectedTag))
      && matchesSearch(e)
    ));
    if (sortBy === 'oldest') list = [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortBy === 'az') list = [...list].sort((a, b) => (a.title || a.body || '').localeCompare(b.title || b.body || ''));
    else if (sortBy === 'starred') list = [...list].sort((a, b) => (b.url_meta?.starred ? 1 : 0) - (a.url_meta?.starred ? 1 : 0));
    else if (sortBy === 'visits') list = [...list].sort((a, b) => (b.url_meta?.visits || 0) - (a.url_meta?.visits || 0));
    else if (sortBy === 'area') return withAreaHeaders(list, (e) => e.__area);
    // 'recent' — already ordered by created_at desc from the query
    return list;
  }, [decorated, kindFilter, areaFilter, folderFilter, selectedTag, search, sortBy]);

  const researchDiscover = useMemo(() => withCategoryHeaders(
    RESEARCH_CATALOG.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchCat = !catFilter || item.catId === catFilter;
      const matchSearch = !q || item.title.toLowerCase().includes(q) || (item.desc || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    })
  ), [search, catFilter]);

  const resourceDiscover = useMemo(() => withAreaHeaders(
    catalog.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchArea = !areaFilter || item.areaId === areaFilter;
      const matchSearch = !q || item.title.toLowerCase().includes(q) || (item.desc || '').toLowerCase().includes(q);
      return matchArea && matchSearch;
    }),
    (item) => item.areaId
  ), [catalog, search, areaFilter]);

  const data = tab === 'vault'
    ? filtered
    : (discoverSource === 'research' ? researchDiscover : resourceDiscover);

  const activeFilterCount = (sortBy !== 'recent' ? 1 : 0) + (areaFilter ? 1 : 0) + (selectedTag ? 1 : 0);

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderSectionHeader = (item) => (
    <View style={styles.sectionHeader}>
      {showEmojis ? <Text style={{ fontSize: 13 }}>{item.emoji}</Text> : <Ionicons name={item.icon} size={13} color={item.color} />}
      <Text style={[styles.sectionHeaderText, { color: item.color }]}>{item.label}</Text>
      <Text style={styles.sectionHeaderCount}>{item.count}</Text>
    </View>
  );

  const renderDiscoverCard = (item, accentColor, accentIcon, onToggle) => {
    const saved = !!savedIdForUrl(item.url);
    return (
      <View style={[styles.card, { borderLeftColor: accentColor }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIconBox, { backgroundColor: `${accentColor}22` }]}>
            {showEmojis ? <Text style={{ fontSize: 17 }}>{item.emoji}</Text> : <Ionicons name={accentIcon} size={16} color={accentColor} />}
          </View>
          <TouchableOpacity style={styles.cardTitleArea} onPress={() => Linking.openURL(item.url)}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            {showSubtext && <Text style={styles.cardBody} numberOfLines={2}>{item.desc}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={styles.iconBtn}>
            <Ionicons name="open-outline" size={17} color={c.text3} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onToggle(item)} style={styles.iconBtn}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={17} color={saved ? c.gold : c.text3} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderVaultCard = (item) => {
    const kind = item.__kind;
    const meta = KINDS[kind];
    const accent = c[meta.colorKey] || c.teal;
    const area = AREA_MAP[item.__area];
    const folder = folders.find((f) => f.id === item.url_meta?.folder);
    const visits = item.url_meta?.visits || 0;
    const starred = !!item.url_meta?.starred;
    const linkCount = item.url_meta?.links?.length || 0;
    const cite = citationLine(item.url_meta?.citation);

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: accent }]}
        onPress={() => setDetailItem(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeIconBox, { backgroundColor: `${accent}22` }]}>
            {showEmojis && item.url_meta?.emoji
              ? <Text style={{ fontSize: 17 }}>{item.url_meta.emoji}</Text>
              : <Ionicons name={meta.icon} size={16} color={accent} />}
          </View>
          <View style={styles.cardTitleArea}>
            {kind === 'note' ? (
              <LinkifiedText
                text={item.body || item.title}
                style={styles.cardNoteBody}
                linkColor={c.teal}
                numberOfLines={4}
              />
            ) : (
              <>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {!!item.url && (
                  <TouchableOpacity onPress={() => openLink(item)}>
                    <Text style={styles.cardUrl} numberOfLines={1}>{item.url}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            {!!cite && <Text style={styles.citationInline} numberOfLines={1}>{cite}</Text>}
          </View>
          <TouchableOpacity onPress={() => toggleStar(item)} style={styles.iconBtn}>
            <Ionicons name={starred ? 'star' : 'star-outline'} size={16} color={starred ? c.gold : c.text4} />
          </TouchableOpacity>
        </View>

        {kind !== 'note' && !!item.body && <Text style={styles.cardBody} numberOfLines={3}>{item.body}</Text>}

        <View style={styles.cardFooter}>
          <View style={styles.cardTagRow}>
            <View style={[styles.pill, { borderColor: `${accent}55`, backgroundColor: `${accent}18` }]}>
              <Text style={[styles.pillText, { color: accent }]}>{showEmojis ? `${meta.emoji} ` : ''}{meta.label}</Text>
            </View>
            {item.__area !== 'general' && (
              <View style={[styles.pill, { borderColor: `${area.color}55`, backgroundColor: `${area.color}18` }]}>
                <Text style={[styles.pillText, { color: area.color }]}>{showEmojis ? `${area.emoji} ` : ''}{area.label}</Text>
              </View>
            )}
            {folder && (
              <View style={[styles.pill, { borderColor: `${folder.color}55`, backgroundColor: `${folder.color}18` }]}>
                <Text style={[styles.pillText, { color: folder.color }]}>{showEmojis ? '📁 ' : ''}{folder.name}</Text>
              </View>
            )}
            {item.tags?.filter((tg) => tg !== item.__area).map((tg) => (
              <View key={tg} style={styles.tagPill}>
                <Text style={styles.tagPillText}>#{tg}</Text>
              </View>
            ))}
            {linkCount > 0 && (
              <View style={styles.visitsPill}>
                <Ionicons name="link" size={10} color={c.text4} />
                <Text style={styles.visitsPillText}>{linkCount}</Text>
              </View>
            )}
            {visits > 0 && (
              <View style={styles.visitsPill}>
                <Ionicons name="flame-outline" size={10} color={c.text4} />
                <Text style={styles.visitsPillText}>{visits}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => setAssigningEntry(item)} style={styles.iconBtn}>
              <Ionicons name={folder ? 'folder' : 'folder-outline'} size={16} color={folder ? folder.color : c.text4} />
            </TouchableOpacity>
            {!!item.url && (
              <TouchableOpacity onPress={() => openLink(item)} style={styles.iconBtn}>
                <Ionicons name="open-outline" size={16} color={c.teal} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => shareItem(item)} style={styles.iconBtn}>
              <Ionicons name="share-outline" size={16} color={c.text3} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeEntry(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={16} color={c.text4} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Export ────────────────────────────────────────────────────────────────
  // Exports whatever the filters are currently showing, so "export my papers"
  // or "export this folder" works, not just everything at once.
  const exportAs = async (fmt) => {
    const rows = filtered.filter((row) => !row.__header);
    if (rows.length === 0) { Alert.alert('Nothing to export', 'Save something first.'); return; }
    const text = fmt === 'markdown' ? notesToMarkdown(rows) : notesToCSV(rows);
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', `${rows.length} item${rows.length === 1 ? '' : 's'} copied as ${fmt === 'markdown' ? 'Markdown' : 'CSV'}.`);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen'))}
            style={{ padding: 2 }}
          >
            <Ionicons name="chevron-back" size={22} color={c.teal} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubtitle}>NOTES · LINKS · PAPERS · TOOLS</Text>
            <Text style={styles.headerTitle}>Knowledge Vault</Text>
          </View>
        </View>
        {entries.length > 0 && (
          <>
            <TouchableOpacity onPress={() => exportAs('markdown')} style={styles.headerIconBtn}>
              <Ionicons name="document-text-outline" size={16} color={c.text2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => exportAs('csv')} style={styles.headerIconBtn}>
              <Ionicons name="grid-outline" size={16} color={c.text2} />
            </TouchableOpacity>
          </>
        )}
        <TourSpot id="research-list">
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </TourSpot>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'vault' && styles.tabBtnActive]}
          onPress={() => setTab('vault')}
        >
          <Ionicons name="library" size={13} color={tab === 'vault' ? c.teal : c.text3} />
          <Text style={[styles.tabText, tab === 'vault' && styles.tabTextActive]}>My Vault ({entries.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'discover' && styles.tabBtnActive]}
          onPress={() => setTab('discover')}
        >
          <Ionicons name="compass" size={13} color={tab === 'discover' ? c.teal : c.text3} />
          <Text style={[styles.tabText, tab === 'discover' && styles.tabTextActive]}>Discover</Text>
        </TouchableOpacity>
      </View>

      {/* Search + filter toggle */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={c.teal} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={tab === 'vault' ? 'Search notes, links, papers, tools...' : 'Search the catalog...'}
            placeholderTextColor={c.text4}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={c.text4} />
            </TouchableOpacity>
          ) : null}
        </View>
        {tab === 'vault' && (
          <TouchableOpacity
            onPress={() => setShowFilters((v) => !v)}
            style={[styles.filterToggle, (showFilters || activeFilterCount > 0) && { borderColor: c.teal, backgroundColor: `${c.teal}18` }]}
          >
            <Ionicons name="options-outline" size={16} color={activeFilterCount > 0 ? c.teal : c.text3} />
            {activeFilterCount > 0 && <Text style={styles.filterToggleCount}>{activeFilterCount}</Text>}
          </TouchableOpacity>
        )}
      </View>

      {tab === 'vault' ? (
        <>
          {/* Type pills */}
          <TourSpot id="resources-list">
            <View style={styles.filterBarContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.chip, kindFilter === 'all' && styles.chipActive]}
                  onPress={() => setKindFilter('all')}
                >
                  <Text style={[styles.chipText, kindFilter === 'all' && styles.chipTextActive]}>All ({kindCounts.all || 0})</Text>
                </TouchableOpacity>
                {KIND_KEYS.map((k) => {
                  const meta = KINDS[k];
                  const color = c[meta.colorKey] || c.teal;
                  const isSelected = kindFilter === k;
                  return (
                    <TouchableOpacity
                      key={k}
                      style={[styles.chip, isSelected && { borderColor: color, backgroundColor: `${color}22` }]}
                      onPress={() => setKindFilter(isSelected ? 'all' : k)}
                    >
                      {showEmojis ? <Text style={{ fontSize: 12 }}>{meta.emoji}</Text> : <Ionicons name={meta.icon} size={12} color={color} />}
                      <Text style={[styles.chipText, isSelected && { color, fontWeight: 'bold' }]}>
                        {meta.plural}{kindCounts[k] ? ` (${kindCounts[k]})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TourSpot>

          {/* Advanced filters — sort, life area, tags */}
          {showFilters && (
            <>
              <View style={styles.filterBarContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  <View style={styles.sortLabelWrap}>
                    <Ionicons name="swap-vertical-outline" size={13} color={c.text4} />
                    <Text style={styles.sortLabel}>Sort</Text>
                  </View>
                  {SORT_OPTIONS.map((opt) => {
                    const isActive = sortBy === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.chip, isActive && { borderColor: c.teal, backgroundColor: `${c.teal}22` }]}
                        onPress={() => setSortBy(opt.key)}
                      >
                        <Ionicons name={opt.icon} size={12} color={isActive ? c.teal : c.text3} />
                        <Text style={[styles.chipText, isActive && { color: c.teal, fontWeight: 'bold' }]}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.filterBarContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  <View style={styles.sortLabelWrap}>
                    <Ionicons name="apps-outline" size={13} color={c.text4} />
                    <Text style={styles.sortLabel}>Area</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.chip, !areaFilter && styles.chipActive]}
                    onPress={() => setAreaFilter(null)}
                  >
                    <Text style={[styles.chipText, !areaFilter && styles.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {FILTER_AREAS.map((area) => {
                    const isSelected = areaFilter === area.id;
                    const count = areaCounts[area.id];
                    return (
                      <TouchableOpacity
                        key={area.id}
                        style={[styles.chip, isSelected && { borderColor: area.color, backgroundColor: `${area.color}22` }]}
                        onPress={() => setAreaFilter(isSelected ? null : area.id)}
                      >
                        {showEmojis ? <Text style={{ fontSize: 12 }}>{area.emoji}</Text> : <Ionicons name={area.icon} size={12} color={area.color} />}
                        <Text style={[styles.chipText, isSelected && { color: area.color, fontWeight: 'bold' }]}>
                          {area.label}{count ? ` (${count})` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {allTags.length > 0 && (
                <View style={styles.filterBarContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <View style={styles.sortLabelWrap}>
                      <Ionicons name="pricetag-outline" size={13} color={c.text4} />
                      <Text style={styles.sortLabel}>Tags</Text>
                    </View>
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
              )}
            </>
          )}

          {/* Folders — shared by every kind now, so one folder can hold a
              note, a paper, and a tool at the same time */}
          <FolderRow
            folders={folders}
            activeFolderId={folderFilter}
            onSelect={setFolderFilter}
            onCreate={createFolder}
            onRename={renameFolder}
            onDelete={handleDeleteFolder}
          />

          {/* Quick note composer */}
          <TourSpot id="notes-input">
            <View style={styles.composer}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={styles.composerInput}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Write a note..."
                  placeholderTextColor={c.text4}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.composerBtn, savingNote && { opacity: 0.6 }]}
                  onPress={addQuickNote}
                  disabled={savingNote}
                >
                  {savingNote ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="add" size={20} color="#fff" />}
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.composerTags}
                value={tagsInput}
                onChangeText={setTagsInput}
                placeholder="Tags (comma separated, optional)"
                placeholderTextColor={c.text4}
                onSubmitEditing={addQuickNote}
              />
            </View>
          </TourSpot>
        </>
      ) : (
        <>
          {/* Discover source switch */}
          <View style={styles.filterBarContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity
                style={[styles.chip, discoverSource === 'research' && styles.chipActive]}
                onPress={() => setDiscoverSource('research')}
              >
                <Ionicons name="flask-outline" size={12} color={discoverSource === 'research' ? c.text1 : c.text3} />
                <Text style={[styles.chipText, discoverSource === 'research' && styles.chipTextActive]}>Research Tools</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, discoverSource === 'areas' && styles.chipActive]}
                onPress={() => setDiscoverSource('areas')}
              >
                <Ionicons name="globe-outline" size={12} color={discoverSource === 'areas' ? c.text1 : c.text3} />
                <Text style={[styles.chipText, discoverSource === 'areas' && styles.chipTextActive]}>Life Area Picks</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Category (research tools) or life area (curated sites) filter */}
          <View style={styles.filterBarContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {discoverSource === 'research' ? (
                <>
                  <TouchableOpacity
                    style={[styles.chip, !catFilter && styles.chipActive]}
                    onPress={() => setCatFilter(null)}
                  >
                    <Text style={[styles.chipText, !catFilter && styles.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {RESEARCH_CATEGORIES.map((cat) => {
                    const isSelected = catFilter === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.chip, isSelected && { borderColor: cat.color, backgroundColor: `${cat.color}22` }]}
                        onPress={() => setCatFilter(isSelected ? null : cat.id)}
                      >
                        {showEmojis ? <Text style={{ fontSize: 12 }}>{cat.emoji}</Text> : <Ionicons name={cat.icon} size={12} color={cat.color} />}
                        <Text style={[styles.chipText, isSelected && { color: cat.color, fontWeight: 'bold' }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.chip, !areaFilter && styles.chipActive]}
                    onPress={() => setAreaFilter(null)}
                  >
                    <Text style={[styles.chipText, !areaFilter && styles.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {FILTER_AREAS.map((area) => {
                    const isSelected = areaFilter === area.id;
                    return (
                      <TouchableOpacity
                        key={area.id}
                        style={[styles.chip, isSelected && { borderColor: area.color, backgroundColor: `${area.color}22` }]}
                        onPress={() => setAreaFilter(isSelected ? null : area.id)}
                      >
                        {showEmojis ? <Text style={{ fontSize: 12 }}>{area.emoji}</Text> : <Ionicons name={area.icon} size={12} color={area.color} />}
                        <Text style={[styles.chipText, isSelected && { color: area.color, fontWeight: 'bold' }]}>{area.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </View>
        </>
      )}

      {/* List */}
      {loading && tab === 'vault' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.teal} />
          <Text style={styles.loadingText}>Loading your knowledge vault...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => (item.__header ? item.key : `${item.id}`)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {showEmojis
                ? <Text style={{ fontSize: 42 }}>{tab === 'vault' ? '🗂️' : '🧭'}</Text>
                : <Ionicons name={tab === 'vault' ? 'library-outline' : 'compass-outline'} size={46} color={c.border} />}
              <Text style={styles.emptyTitle}>
                {tab === 'vault' && entries.length === 0 ? 'Your vault is empty' : 'No matches'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'discover'
                  ? 'Try a different search or category.'
                  : entries.length === 0
                    ? 'Everything you write down or save for later lives here.'
                    : 'Try a different search, type, folder, or filter.'}
              </Text>
              {tab === 'vault' && entries.length === 0 && (
                <View style={{ width: '100%', marginTop: 20, gap: 8 }}>
                  {FEATURES.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      {showEmojis ? <Text style={{ fontSize: 20 }}>{f.emoji}</Text> : <Ionicons name={f.icon} size={18} color={c.teal} />}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.featureTitle}>{f.title}</Text>
                        <Text style={styles.featureDesc}>{f.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => {
            if (item.__header) return renderSectionHeader(item);
            if (tab === 'discover') {
              const meta = discoverSource === 'research'
                ? (CATEGORY_MAP[item.catId] || GENERAL_META)
                : (AREA_MAP[item.areaId] || GENERAL_META);
              const onToggle = discoverSource === 'research' ? toggleResearchCatalogItem : toggleResourceCatalogItem;
              return renderDiscoverCard(item, meta.color, meta.icon, onToggle);
            }
            return renderVaultCard(item);
          }}
        />
      )}

      <AddItemModal
        visible={showAdd}
        defaultKind={kindFilter === 'all' ? 'bookmark' : kindFilter}
        onClose={() => setShowAdd(false)}
        onSave={saveNewItem}
        c={c} styles={styles} showEmojis={showEmojis}
      />

      {detailItem && (
        <DetailModal
          item={detailItem}
          folders={folders}
          onClose={() => setDetailItem(null)}
          onSave={saveEdits}
          onDelete={removeEntry}
          onAssignFolder={setAssigningEntry}
          onLinksChange={updateLinks}
          onToggleStar={toggleStar}
          onOpenLink={openLink}
          onShare={shareItem}
          c={c} t={t} s={s} r={r}
          styles={styles} showEmojis={showEmojis}
        />
      )}

      <FolderAssignSheet
        visible={!!assigningEntry}
        folders={folders}
        currentFolderId={assigningEntry?.url_meta?.folder || null}
        onAssign={(folderId) => assignFolder(assigningEntry, folderId)}
        onClose={() => setAssigningEntry(null)}
        onCreateFolder={createFolder}
      />
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14, gap: 6 },
  headerSubtitle: { color: c.teal, fontSize: 9, letterSpacing: 1.5, fontWeight: '800' },
  headerTitle: { color: c.text1, fontSize: 22, fontWeight: 'bold' },
  headerIconBtn: { backgroundColor: c.bg1, borderRadius: 10, padding: 8, borderWidth: 0.5, borderColor: c.border },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.teal, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border },
  tabBtnActive: { borderColor: c.teal, backgroundColor: c.teal + '18' },
  tabText: { color: c.text3, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: c.teal, fontWeight: 'bold' },

  searchRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg1, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: c.text1, fontSize: 13 },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 12, backgroundColor: c.bg1, borderRadius: 12, borderWidth: 1, borderColor: c.border },
  filterToggleCount: { color: c.teal, fontSize: 11, fontWeight: 'bold' },

  filterBarContainer: { marginBottom: 10 },
  filterScroll: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  sortLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 },
  sortLabel: { color: c.text4, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border, marginRight: 8 },
  chipActive: { borderColor: c.purple, backgroundColor: c.purple + '22' },
  chipText: { color: c.text3, fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: c.text1, fontWeight: 'bold' },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border, marginRight: 8 },
  tagChipActive: { borderColor: c.financial, backgroundColor: c.financial + '22' },
  tagChipText: { color: c.text3, fontSize: 10 },
  tagChipTextActive: { color: c.financial, fontWeight: 'bold' },

  composer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: c.bg1, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: c.border, gap: 8, marginBottom: 10 },
  composerInput: { flex: 1, backgroundColor: c.bg0, borderRadius: 10, padding: 12, fontSize: 13, color: c.text1, borderWidth: 0.5, borderColor: c.border },
  composerBtn: { backgroundColor: c.teal, borderRadius: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  composerTags: { backgroundColor: c.bg0, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 11, color: c.text1, borderWidth: 0.5, borderColor: c.border },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: c.text3, fontSize: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { color: c.text1, fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { color: c.text3, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 30 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.bg1, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: c.border },
  featureTitle: { color: c.text1, fontSize: 13, fontWeight: '700' },
  featureDesc: { color: c.text3, fontSize: 11, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, paddingBottom: 4 },
  sectionHeaderText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  sectionHeaderCount: { color: c.text4, fontSize: 10, fontWeight: '600' },

  card: { backgroundColor: c.bg1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.border, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  typeIconBox: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cardTitleArea: { flex: 1 },
  cardTitle: { color: c.text1, fontSize: 14, fontWeight: 'bold' },
  cardNoteBody: { color: c.text1, fontSize: 13, lineHeight: 19 },
  cardUrl: { color: c.teal, fontSize: 11, marginTop: 2 },
  cardBody: { color: c.text2, fontSize: 12, lineHeight: 17, marginTop: 6 },
  citationInline: { color: c.text4, fontSize: 10.5, marginTop: 3, fontStyle: 'italic' },
  iconBtn: { padding: 6 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardTagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, flex: 1 },
  pill: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  pillText: { fontSize: 10, fontWeight: '700' },
  tagPill: { backgroundColor: c.bg2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: c.border },
  tagPillText: { color: c.gold, fontSize: 10 },
  visitsPill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: c.bg2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  visitsPillText: { color: c.text4, fontSize: 10, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 2, borderTopColor: c.teal, maxHeight: '88%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 16 },
  modalHeaderTitle: { color: c.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  modalInput: { backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text1, fontSize: 13, marginBottom: 10 },
  modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
  modalLabel: { color: c.text3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: c.bg2, borderRadius: 10, borderWidth: 1, borderColor: c.border },
  cancelBtnText: { color: c.text3, fontSize: 12, fontWeight: 'bold' },
  saveBtn: { flex: 2, paddingVertical: 12, alignItems: 'center', backgroundColor: c.teal, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  autoHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 10, paddingHorizontal: 4 },
  autoHintText: { color: c.teal, fontSize: 11, flex: 1 },

  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  detailKind: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  detailTitle: { color: c.text1, fontSize: 16, fontWeight: 'bold' },
  detailBodyText: { color: c.text2, fontSize: 13, lineHeight: 20, marginBottom: 4 },
  detailActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 16, marginBottom: 14 },
  detailAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailActionText: { color: c.text3, fontWeight: '700', fontSize: 12 },
  openUrlBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.bg2, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.teal + '4d', marginBottom: 12 },
  openUrlText: { flex: 1, color: c.teal, fontSize: 12 },
  citationBox: { backgroundColor: c.bg2, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: c.border, marginBottom: 12 },
  citationText: { color: c.text2, fontSize: 12, fontStyle: 'italic' },
  citationDoi: { color: c.teal, fontSize: 11, marginTop: 4, fontWeight: '600' },
  linkedHeader: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginTop: 18, marginBottom: 10 },
});
