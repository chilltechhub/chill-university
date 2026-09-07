// src/screens/library/research.js
//
// SUPERSEDED — Research Vault is now the matching type filter inside the
// Knowledge Vault (src/screens/library/knowledge.js), which carries every
// feature below. Nothing imports this file any more; the route name that
// used to point here is registered against the Knowledge Vault in
// LibraryNav.js. Kept on disk only until the merged screen has been
// exercised in a build — safe to delete after that.
//
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Linking, Share,
  Modal, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline } from '../../api/offlineCache';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import useFolders from '../../logic/useFolders';
import FolderRow from '../../components/FolderRow';
import FolderAssignSheet from '../../components/FolderAssignSheet';
import TourSpot from '../../components/TourSpot';

const { width } = Dimensions.get('window');

// ─── Auto-populated discovery catalog ──────────────────────────────────────
// Well-known research tools & databases grouped by category so a fresh
// vault never starts empty — browse Discover and one-tap save what's useful.
const CATEGORIES = [
  { id: 'encyclopedia', label: 'Encyclopedias & Reference', emoji: '📖', icon: 'book-outline', color: '#5c9ce0' },
  { id: 'papers', label: 'Academic Papers & Journals', emoji: '🔬', icon: 'flask-outline', color: '#4caf7d' },
  { id: 'ai', label: 'AI Research Assistants', emoji: '🤖', icon: 'hardware-chip-outline', color: '#9a6fd6' },
  { id: 'citations', label: 'Citations & Bibliography', emoji: '📑', icon: 'bookmark-outline', color: '#c9a84c' },
  { id: 'books', label: 'Books & Archives', emoji: '📚', icon: 'library-outline', color: '#d97a7a' },
  { id: 'data', label: 'Data & Statistics', emoji: '📊', icon: 'stats-chart-outline', color: '#3fb8cf' },
];
const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

const CATALOG = [
  { id: 'e1', catId: 'encyclopedia', emoji: '📖', title: 'Wikipedia', url: 'https://www.wikipedia.org', desc: 'The free encyclopedia' },
  { id: 'e2', catId: 'encyclopedia', emoji: '📘', title: 'Encyclopaedia Britannica', url: 'https://www.britannica.com', desc: 'Trusted general reference' },
  { id: 'e3', catId: 'encyclopedia', emoji: '🔢', title: 'Wolfram Alpha', url: 'https://www.wolframalpha.com', desc: 'Computational knowledge engine' },
  { id: 'e4', catId: 'encyclopedia', emoji: '🏛️', title: 'Stanford Encyclopedia of Philosophy', url: 'https://plato.stanford.edu', desc: 'Rigorous, peer-reviewed philosophy reference' },

  { id: 'p1', catId: 'papers', emoji: '🔎', title: 'Google Scholar', url: 'https://scholar.google.com', desc: 'Search academic papers & citations' },
  { id: 'p2', catId: 'papers', emoji: '🧬', title: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov', desc: 'Medical & life sciences research' },
  { id: 'p3', catId: 'papers', emoji: '📄', title: 'arXiv', url: 'https://arxiv.org', desc: 'Preprints in physics, math, CS & more' },
  { id: 'p4', catId: 'papers', emoji: '🧠', title: 'Semantic Scholar', url: 'https://www.semanticscholar.org', desc: 'AI-powered research paper search' },
  { id: 'p5', catId: 'papers', emoji: '📰', title: 'JSTOR', url: 'https://www.jstor.org', desc: 'Academic journals, books & primary sources' },
  { id: 'p6', catId: 'papers', emoji: '🔓', title: 'DOAJ', url: 'https://doaj.org', desc: 'Directory of Open Access Journals' },

  { id: 'a1', catId: 'ai', emoji: '🤖', title: 'Claude', url: 'https://claude.ai', desc: 'AI assistant for research & writing' },
  { id: 'a2', catId: 'ai', emoji: '💬', title: 'ChatGPT', url: 'https://chat.openai.com', desc: 'AI assistant for research & writing' },
  { id: 'a3', catId: 'ai', emoji: '🔍', title: 'Perplexity', url: 'https://www.perplexity.ai', desc: 'AI answer engine with cited sources' },
  { id: 'a4', catId: 'ai', emoji: '🧪', title: 'Elicit', url: 'https://elicit.com', desc: 'AI research assistant for literature review' },
  { id: 'a5', catId: 'ai', emoji: '✅', title: 'Consensus', url: 'https://consensus.app', desc: 'AI search engine for scientific papers' },

  { id: 'c1', catId: 'citations', emoji: '📎', title: 'Zotero', url: 'https://www.zotero.org', desc: 'Free citation & reference manager' },
  { id: 'c2', catId: 'citations', emoji: '🗂️', title: 'Mendeley', url: 'https://www.mendeley.com', desc: 'Reference manager & academic network' },
  { id: 'c3', catId: 'citations', emoji: '🖊️', title: 'Citation Machine', url: 'https://www.citationmachine.net', desc: 'Generate citations in any style' },
  { id: 'c4', catId: 'citations', emoji: '✍️', title: 'Purdue OWL', url: 'https://owl.purdue.edu', desc: 'Writing & citation style guides' },

  { id: 'b1', catId: 'books', emoji: '📕', title: 'Google Books', url: 'https://books.google.com', desc: 'Search & preview millions of books' },
  { id: 'b2', catId: 'books', emoji: '🗄️', title: 'Archive.org', url: 'https://archive.org', desc: 'Free books, media & web history' },
  { id: 'b3', catId: 'books', emoji: '📗', title: 'Project Gutenberg', url: 'https://www.gutenberg.org', desc: '70,000+ free public-domain ebooks' },
  { id: 'b4', catId: 'books', emoji: '📔', title: 'Open Library', url: 'https://openlibrary.org', desc: 'One web page for every book ever published' },

  { id: 'd1', catId: 'data', emoji: '🌍', title: 'Our World in Data', url: 'https://ourworldindata.org', desc: 'Research & data on world problems' },
  { id: 'd2', catId: 'data', emoji: '📊', title: 'Statista', url: 'https://www.statista.com', desc: 'Statistics & market data' },
  { id: 'd3', catId: 'data', emoji: '🏦', title: 'World Bank Open Data', url: 'https://data.worldbank.org', desc: 'Global development data' },
  { id: 'd4', catId: 'data', emoji: '🏛️', title: 'U.S. Census Bureau', url: 'https://www.census.gov', desc: 'Official U.S. demographic data' },
];

const SORT_OPTIONS = [
  { key: 'recent', label: 'Newest', icon: 'time-outline' },
  { key: 'oldest', label: 'Oldest', icon: 'hourglass-outline' },
  { key: 'az', label: 'A–Z', icon: 'text-outline' },
  { key: 'starred', label: 'Starred First', icon: 'star-outline' },
  { key: 'visits', label: 'Most Opened', icon: 'flame-outline' },
];

// Interleave category headers into an already-bucketed catalog list.
const withCategoryHeaders = (list) => {
  const buckets = {};
  list.forEach((item) => {
    if (!buckets[item.catId]) buckets[item.catId] = [];
    buckets[item.catId].push(item);
  });
  const out = [];
  CATEGORIES.forEach((cat) => {
    const items = buckets[cat.id];
    if (items && items.length) {
      out.push({ __header: true, key: `h_${cat.id}`, label: cat.label, emoji: cat.emoji, icon: cat.icon, color: cat.color, count: items.length });
      items.forEach((it) => out.push(it));
    }
  });
  return out;
};

export default function ResearchScreen() {
  const navigation = useNavigation();
  const { colors: c } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const styles = makeStyles(c);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [tab, setTab] = useState('vault'); // 'vault' | 'discover'

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters, search & sort
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'link' | 'note'
  const [selectedTag, setSelectedTag] = useState(null);
  const [catFilter, setCatFilter] = useState(null); // Discover-only category filter
  const [sortBy, setSortBy] = useState('recent');
  const [folderFilter, setFolderFilter] = useState(null);
  const [assigningEntry, setAssigningEntry] = useState(null);

  const { folders, createFolder, renameFolder, deleteFolder } = useFolders('research', userId);

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
    const cacheKey = `research_vault_${uid}`;
    const cached = await cacheRead(cacheKey);
    if (cached) setEntries(cached);

    if (await isOnline()) {
      const { data } = await supabase
        .from('captures')
        .select('*')
        .eq('user_id', uid)
        .in('type', ['link', 'note'])
        // 'inbox' = captured here directly or via Discover; 'active' = routed
        // in from the Capture Inbox's "Add to Research" destination.
        .in('status', ['inbox', 'active'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (data) { setEntries(data); cacheWrite(cacheKey, data); }
    }
    setLoading(false);
  };

  const isSavedUrl = (u) => entries.some((e) => e.url === u);
  const savedIdForUrl = (u) => entries.find((e) => e.url === u)?.id || null;

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const finalUrl = url.trim();
    if (finalUrl && isSavedUrl(finalUrl)) {
      setSaving(false);
      return;
    }
    const item = {
      user_id: userId,
      type: finalUrl ? 'link' : 'note',
      title: title.trim(),
      body: notes.trim() || null,
      url: finalUrl || null,
      url_meta: {},
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

  const addFromCatalog = async (cat) => {
    const existingId = savedIdForUrl(cat.url);
    if (existingId) {
      deleteEntry(existingId);
      return;
    }
    const item = {
      user_id: userId,
      type: 'link',
      title: cat.title,
      body: cat.desc,
      url: cat.url,
      url_meta: { emoji: cat.emoji, category: cat.catId, source: 'catalog' },
      status: 'inbox',
      tags: [cat.catId],
      source: 'catalog',
    };
    const { data } = await supabase.from('captures').insert(item).select().single();
    if (data) setEntries((prev) => [data, ...prev]);
  };

  const deleteEntry = async (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
    // Soft delete — moves to Recently Deleted in the Capture Inbox for 7 days.
    await supabase.from('captures').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  };

  const toggleStar = (item) => {
    const starred = !item.url_meta?.starred;
    const nextMeta = { ...(item.url_meta || {}), starred };
    setEntries((prev) => prev.map((e) => (e.id === item.id ? { ...e, url_meta: nextMeta } : e)));
    if (selectedEntry?.id === item.id) setSelectedEntry((prev) => ({ ...prev, url_meta: nextMeta }));
    supabase.from('captures').update({ url_meta: nextMeta }).eq('id', item.id).then(() => {});
  };

  const openLink = (item) => {
    if (!item.url) return;
    Linking.openURL(item.url);
    const visits = (item.url_meta?.visits || 0) + 1;
    const nextMeta = { ...(item.url_meta || {}), visits, lastOpenedAt: new Date().toISOString() };
    setEntries((prev) => prev.map((e) => (e.id === item.id ? { ...e, url_meta: nextMeta } : e)));
    if (selectedEntry?.id === item.id) setSelectedEntry((prev) => ({ ...prev, url_meta: nextMeta }));
    supabase.from('captures').update({ url_meta: nextMeta }).eq('id', item.id).then(() => {});
  };

  const shareEntry = (item) => {
    Share.share({ message: item.url ? `${item.title} — ${item.url}` : item.title }).catch(() => {});
  };

  const assignFolder = (item, folderId) => {
    const nextMeta = { ...(item.url_meta || {}), folder: folderId || undefined };
    if (!folderId) delete nextMeta.folder;
    setEntries((prev) => prev.map((e) => (e.id === item.id ? { ...e, url_meta: nextMeta } : e)));
    if (selectedEntry?.id === item.id) setSelectedEntry((prev) => ({ ...prev, url_meta: nextMeta }));
    supabase.from('captures').update({ url_meta: nextMeta }).eq('id', item.id).then(() => {});
    setAssigningEntry(null);
  };

  const handleDeleteFolder = (folderId) => {
    deleteFolder(folderId);
    if (folderFilter === folderId) setFolderFilter(null);
    // Clear the folder off any entries that were in it, rather than leaving
    // them silently pointing at a folder that no longer exists.
    entries.filter((e) => e.url_meta?.folder === folderId).forEach((e) => assignFolder(e, null));
  };

  // Extract unique tags across all entries (excludes catalog category tags so
  // the chip row stays focused on the user's own organization)
  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []).filter((tg) => !CATEGORY_MAP[tg]))
  );

  const vaultFiltered = useMemo(() => {
    let list = entries.filter((e) => {
      const matchSearch =
        !search ||
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.body?.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || e.type === typeFilter;
      const matchTag = !selectedTag || (e.tags && e.tags.includes(selectedTag));
      const matchFolder = !folderFilter || e.url_meta?.folder === folderFilter;
      return matchSearch && matchType && matchTag && matchFolder;
    });
    if (sortBy === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'az') {
      list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'starred') {
      list = [...list].sort((a, b) => (b.url_meta?.starred ? 1 : 0) - (a.url_meta?.starred ? 1 : 0));
    } else if (sortBy === 'visits') {
      list = [...list].sort((a, b) => (b.url_meta?.visits || 0) - (a.url_meta?.visits || 0));
    }
    // 'recent' — already ordered by created_at desc from the query
    return list;
  }, [entries, search, typeFilter, selectedTag, sortBy, folderFilter]);

  const discoverFiltered = useMemo(() => {
    const list = CATALOG.filter((item) => {
      const matchCat = !catFilter || item.catId === catFilter;
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.desc.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    return withCategoryHeaders(list);
  }, [search, catFilter]);

  const data = tab === 'vault' ? vaultFiltered : discoverFiltered;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen'))}
            style={{ padding: 2 }}
          >
            <Ionicons name="chevron-back" size={22} color={c.teal} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSubtitle}>KNOWLEDGE & SOURCE INTEL</Text>
            <Text style={styles.headerTitle}>Research Vault</Text>
          </View>
        </View>
        <TourSpot id="research-list">
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Capture</Text>
        </TouchableOpacity>
        </TourSpot>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'vault' && styles.tabBtnActive]}
          onPress={() => setTab('vault')}
        >
          <Ionicons name="book" size={13} color={tab === 'vault' ? c.teal : c.text3} />
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={c.teal} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={tab === 'vault' ? 'Scan title, notes, or web intel...' : 'Search research tools & databases...'}
            placeholderTextColor={c.text4}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={c.text4} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sort Selector (Vault only) */}
      {tab === 'vault' && (
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
                  style={[styles.typeChip, isActive && styles.typeChipActiveCyan]}
                  onPress={() => setSortBy(opt.key)}
                >
                  <Ionicons name={opt.icon} size={12} color={isActive ? c.teal : c.text3} />
                  <Text style={[styles.typeChipText, isActive && { color: c.teal, fontWeight: 'bold' }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Folders (Vault only) */}
      {tab === 'vault' && (
        <FolderRow
          folders={folders}
          activeFolderId={folderFilter}
          onSelect={setFolderFilter}
          onCreate={createFolder}
          onRename={renameFolder}
          onDelete={handleDeleteFolder}
        />
      )}

      {/* Type & Tag Filters (Vault) / Category Filters (Discover) */}
      <View style={styles.filterBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {tab === 'vault' ? (
            <>
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
                <Ionicons name="link-outline" size={12} color={typeFilter === 'link' ? c.teal : c.text3} />
                <Text style={[styles.typeChipText, typeFilter === 'link' && { color: c.teal, fontWeight: 'bold' }]}>
                  Links
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeChip, typeFilter === 'note' && styles.typeChipActiveGold]}
                onPress={() => setTypeFilter('note')}
              >
                <Ionicons name="document-text-outline" size={12} color={typeFilter === 'note' ? c.gold : c.text3} />
                <Text style={[styles.typeChipText, typeFilter === 'note' && { color: c.gold, fontWeight: 'bold' }]}>
                  Notes
                </Text>
              </TouchableOpacity>

              <View style={styles.filterDivider} />

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
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.typeChip, !catFilter && styles.typeChipActive]}
                onPress={() => setCatFilter(null)}
              >
                <Text style={[styles.typeChipText, !catFilter && styles.typeChipTextActive]}>All</Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => {
                const isSelected = catFilter === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.typeChip, isSelected && { borderColor: cat.color, backgroundColor: cat.color + '22' }]}
                    onPress={() => setCatFilter(isSelected ? null : cat.id)}
                  >
                    {showEmojis ? <Text style={{ fontSize: 12 }}>{cat.emoji}</Text> : <Ionicons name={cat.icon} size={12} color={cat.color} />}
                    <Text style={[styles.typeChipText, isSelected && { color: cat.color, fontWeight: 'bold' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>

      {/* Main Content List */}
      {loading && tab === 'vault' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.teal} />
          <Text style={styles.loadingText}>Loading your research vault...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(e) => (e.__header ? e.key : e.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="radar" size={50} color={c.border} />
              <Text style={styles.emptyTitle}>{tab === 'vault' ? 'Vault Empty' : 'No matches'}</Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'vault'
                  ? 'No links, research papers, or notes matching criteria.'
                  : 'Try a different search or category.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.__header) {
              return (
                <View style={styles.sectionHeader}>
                  {showEmojis ? <Text style={{ fontSize: 13 }}>{item.emoji}</Text> : <Ionicons name={item.icon} size={13} color={item.color} />}
                  <Text style={[styles.sectionHeaderText, { color: item.color }]}>{item.label}</Text>
                  <Text style={styles.sectionHeaderCount}>{item.count}</Text>
                </View>
              );
            }

            if (tab === 'discover') {
              const saved = isSavedUrl(item.url);
              const cat = CATEGORY_MAP[item.catId];
              return (
                <View style={[styles.card, { borderLeftColor: cat.color }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.typeIconBox, { backgroundColor: cat.color + '22' }]}>
                      {showEmojis ? <Text style={{ fontSize: 17 }}>{item.emoji}</Text> : <Ionicons name={cat.icon} size={16} color={cat.color} />}
                    </View>
                    <TouchableOpacity style={styles.cardTitleArea} onPress={() => Linking.openURL(item.url)}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                      {showSubtext && <Text style={styles.cardBody} numberOfLines={2}>{item.desc}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={styles.trashBtn}>
                      <Ionicons name="open-outline" size={17} color={c.text3} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => addFromCatalog(item)} style={styles.trashBtn}>
                      <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={17} color={saved ? c.gold : c.text3} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            const isLink = item.type === 'link';
            const accentColor = isLink ? c.teal : c.gold;
            const starred = !!item.url_meta?.starred;
            const visits = item.url_meta?.visits || 0;
            const folder = folders.find((f) => f.id === item.url_meta?.folder);

            return (
              <TouchableOpacity
                style={[styles.card, { borderLeftColor: accentColor }]}
                onPress={() => setSelectedEntry(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.typeIconBox, { backgroundColor: accentColor + '22' }]}>
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
                      <TouchableOpacity onPress={() => openLink(item)}>
                        <Text style={styles.cardUrl} numberOfLines={1}>
                          {item.url}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity onPress={() => setAssigningEntry(item)} style={styles.trashBtn}>
                    <Ionicons name={folder ? 'folder' : 'folder-outline'} size={16} color={folder ? folder.color : c.text4} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleStar(item)} style={styles.trashBtn}>
                    <Ionicons name={starred ? 'star' : 'star-outline'} size={16} color={starred ? c.gold : c.text4} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteEntry(item.id)} style={styles.trashBtn}>
                    <Ionicons name="trash-outline" size={16} color={c.text4} />
                  </TouchableOpacity>
                </View>

                {item.body && (
                  <Text style={styles.cardBody} numberOfLines={3}>
                    {item.body}
                  </Text>
                )}

                {(item.tags?.length > 0 || visits > 0 || folder) && (
                  <View style={styles.cardTagRow}>
                    {folder && (
                      <View style={[styles.cardTagPill, { borderColor: folder.color + '55', backgroundColor: folder.color + '18' }]}>
                        <Text style={[styles.cardTagText, { color: folder.color }]}>{showEmojis ? '📁 ' : ''}{folder.name}</Text>
                      </View>
                    )}
                    {item.tags?.map((tg) => (
                      <View key={tg} style={styles.cardTagPill}>
                        <Text style={styles.cardTagText}>#{tg}</Text>
                      </View>
                    ))}
                    {visits > 0 && (
                      <View style={styles.visitsPill}>
                        <Ionicons name="flame-outline" size={10} color={c.text4} />
                        <Text style={styles.visitsPillText}>{visits}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Capture Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalHeaderTitle}>{showEmojis ? '⚡ ' : ''}CAPTURE RESEARCH</Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Title or Research Topic *"
              placeholderTextColor={c.text4}
              autoFocus
            />

            <TextInput
              style={styles.modalInput}
              value={url}
              onChangeText={setUrl}
              placeholder="Source URL (Optional)"
              placeholderTextColor={c.text4}
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Summary or synthesis notes..."
              placeholderTextColor={c.text4}
              multiline
            />

            <TextInput
              style={styles.modalInput}
              value={tags}
              onChangeText={setTags}
              placeholder="Tags (comma separated, e.g. ai, math, robotics)"
              placeholderTextColor={c.text4}
              autoCapitalize="none"
            />
            </ScrollView>

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
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save to Vault</Text>
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
                    { backgroundColor: (selectedEntry.type === 'link' ? c.teal : c.gold) + '22' },
                  ]}
                >
                  <Ionicons
                    name={selectedEntry.type === 'link' ? 'link-outline' : 'document-text-outline'}
                    size={22}
                    color={selectedEntry.type === 'link' ? c.teal : c.gold}
                  />
                </View>
                <Text style={styles.detailTitle}>{selectedEntry.title}</Text>
                <TouchableOpacity onPress={() => toggleStar(selectedEntry)}>
                  <Ionicons
                    name={selectedEntry.url_meta?.starred ? 'star' : 'star-outline'}
                    size={20}
                    color={selectedEntry.url_meta?.starred ? c.gold : c.text4}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelectedEntry(null)}>
                  <Ionicons name="close-circle" size={24} color={c.text4} />
                </TouchableOpacity>
              </View>

              {selectedEntry.url && (
                <TouchableOpacity
                  style={styles.openUrlBanner}
                  onPress={() => openLink(selectedEntry)}
                >
                  <Ionicons name="compass-outline" size={16} color={c.teal} />
                  <Text style={styles.openUrlText} numberOfLines={1}>
                    {selectedEntry.url}
                  </Text>
                  <Ionicons name="open-outline" size={14} color={c.teal} />
                </TouchableOpacity>
              )}

              {selectedEntry.body && (
                <ScrollView style={styles.detailBodyContainer}>
                  <Text style={styles.detailBodyText}>{selectedEntry.body}</Text>
                </ScrollView>
              )}

              <TouchableOpacity style={styles.folderRowBtn} onPress={() => setAssigningEntry(selectedEntry)}>
                {(() => {
                  const folder = folders.find((f) => f.id === selectedEntry.url_meta?.folder);
                  return (
                    <>
                      <Ionicons name={folder ? 'folder' : 'folder-outline'} size={15} color={folder ? folder.color : c.text3} />
                      <Text style={[styles.folderRowText, folder && { color: folder.color, fontWeight: 'bold' }]}>
                        {folder ? folder.name : 'No Folder'}
                      </Text>
                    </>
                  );
                })()}
                <Text style={styles.folderRowChange}>Change</Text>
              </TouchableOpacity>

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
                  style={styles.shareDetailBtn}
                  onPress={() => shareEntry(selectedEntry)}
                >
                  <Ionicons name="share-outline" size={16} color={c.text3} />
                  <Text style={styles.shareDetailText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteDetailBtn}
                  onPress={() => deleteEntry(selectedEntry.id)}
                >
                  <Ionicons name="trash-outline" size={16} color={c.error} />
                  <Text style={styles.deleteDetailText}>Delete Entry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 14 },
  headerSubtitle: { color: c.teal, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  headerTitle: { color: c.text1, fontSize: 24, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.teal, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border },
  tabBtnActive: { borderColor: c.teal, backgroundColor: c.teal + '18' },
  tabText: { color: c.text3, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: c.teal, fontWeight: 'bold' },

  searchContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg1, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: c.text1, fontSize: 13 },
  sortLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 },
  sortLabel: { color: c.text4, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  filterBarContainer: { marginBottom: 16 },
  filterScroll: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border, marginRight: 8 },
  typeChipActive: { borderColor: c.purple, backgroundColor: c.purple + '22' },
  typeChipActiveCyan: { borderColor: c.teal, backgroundColor: c.teal + '22' },
  typeChipActiveGold: { borderColor: c.gold, backgroundColor: c.gold + '22' },
  typeChipText: { color: c.text3, fontSize: 11, fontWeight: '600' },
  typeChipTextActive: { color: c.text1, fontWeight: 'bold' },
  filterDivider: { width: 1, height: 16, backgroundColor: c.border, marginHorizontal: 4 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border, marginRight: 8 },
  tagChipActive: { borderColor: c.financial, backgroundColor: c.financial + '22' },
  tagChipText: { color: c.text3, fontSize: 10 },
  tagChipTextActive: { color: c.financial, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: c.text3, fontSize: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { color: c.text1, fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { color: c.text3, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 30 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, paddingBottom: 4 },
  sectionHeaderText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  sectionHeaderCount: { color: c.text4, fontSize: 10, fontWeight: '600' },

  card: { backgroundColor: c.bg1, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  typeIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardTitleArea: { flex: 1 },
  cardTitle: { color: c.text1, fontSize: 14, fontWeight: 'bold' },
  cardUrl: { color: c.teal, fontSize: 11, marginTop: 2 },
  trashBtn: { padding: 4 },
  cardBody: { color: c.text2, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  cardTagRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 },
  cardTagPill: { backgroundColor: c.bg2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: c.border },
  cardTagText: { color: c.gold, fontSize: 10 },
  visitsPill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: c.bg2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  visitsPillText: { color: c.text4, fontSize: 10, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 2, borderTopColor: c.teal, maxHeight: '85%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 16 },
  modalHeaderTitle: { color: c.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  modalInput: { backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text1, fontSize: 13, marginBottom: 10 },
  modalTextArea: { minHeight: 80, textAlignVertical: 'top' },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: c.bg2, borderRadius: 10, borderWidth: 1, borderColor: c.border },
  cancelBtnText: { color: c.text3, fontSize: 12, fontWeight: 'bold' },
  saveBtn: { flex: 2, paddingVertical: 12, alignItems: 'center', backgroundColor: c.teal, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  detailTitle: { flex: 1, color: c.text1, fontSize: 16, fontWeight: 'bold' },
  openUrlBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.bg2, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.teal + '4d', marginBottom: 16 },
  openUrlText: { flex: 1, color: c.teal, fontSize: 12 },
  detailBodyContainer: { maxHeight: 200, marginBottom: 16 },
  folderRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.bg2, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.border, marginBottom: 16 },
  folderRowText: { flex: 1, color: c.text2, fontSize: 12.5 },
  folderRowChange: { color: c.teal, fontSize: 11, fontWeight: 'bold' },
  detailBodyText: { color: c.text2, fontSize: 13, lineHeight: 20 },
  detailFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 12 },
  shareDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12 },
  shareDetailText: { color: c.text3, fontSize: 12, fontWeight: 'bold' },
  deleteDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12 },
  deleteDetailText: { color: c.error, fontSize: 12, fontWeight: 'bold' }
});
