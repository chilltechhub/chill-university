// src/screens/library/resourcetools.js
//
// SUPERSEDED — Resources & Instruments is now the matching type filter inside the
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
  Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline } from '../../api/offlineCache';
import { fetchContentPool } from '../../api/remoteConfigService';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { LIFE_AREAS } from './LifeAreaScreen';
import useFolders from '../../logic/useFolders';
import FolderRow from '../../components/FolderRow';
import FolderAssignSheet from '../../components/FolderAssignSheet';
import TourSpot from '../../components/TourSpot';

// ─── Auto-populated discovery catalog ──────────────────────────────────────
// Curated, well-known sites grouped by life area so a fresh account never
// starts empty — users browse Discover and one-tap save what's useful.
//
// The live list now comes from Supabase (app_content, type='featured_resource';
// see remoteConfigService.fetchContentPool) so it can be edited/expanded any
// time with no app update. FALLBACK_CATALOG below is what renders before
// that fetch resolves, and what's used if it ever fails or comes back empty.
const GENERAL_META = { id: 'general', label: 'General', emoji: '🌐', icon: 'globe-outline', color: '#5c9ce0' };
const AREA_MAP = Object.fromEntries([...LIFE_AREAS, GENERAL_META].map((a) => [a.id, a]));
const FILTER_AREAS = [...LIFE_AREAS, GENERAL_META];

const FALLBACK_CATALOG = [
  // General & reference
  { id: 'g1', areaId: 'general', emoji: '🌐', title: 'Wikipedia', url: 'https://www.wikipedia.org', desc: 'The free encyclopedia' },
  { id: 'g2', areaId: 'general', emoji: '🔢', title: 'Wolfram Alpha', url: 'https://www.wolframalpha.com', desc: 'Computational knowledge engine' },
  { id: 'g3', areaId: 'general', emoji: '📚', title: 'Khan Academy', url: 'https://www.khanacademy.org', desc: 'Free courses on every subject' },
  { id: 'g4', areaId: 'general', emoji: '🎓', title: 'Coursera', url: 'https://www.coursera.org', desc: 'University courses online' },
  { id: 'g5', areaId: 'general', emoji: '🏛️', title: 'edX', url: 'https://www.edx.org', desc: 'Free courses from top universities' },
  { id: 'g6', areaId: 'general', emoji: '🔎', title: 'Google Scholar', url: 'https://scholar.google.com', desc: 'Search academic papers & citations' },
  { id: 'g7', areaId: 'general', emoji: '🗄️', title: 'Archive.org', url: 'https://archive.org', desc: 'Free books, media & web history' },
  { id: 'g8', areaId: 'general', emoji: '🦉', title: 'Duolingo', url: 'https://www.duolingo.com', desc: 'Learn a new language for free' },
  { id: 'g9', areaId: 'general', emoji: '🎤', title: 'TED', url: 'https://www.ted.com', desc: 'Ideas worth spreading, in talk form' },
  { id: 'g10', areaId: 'general', emoji: '📝', title: 'Notion', url: 'https://www.notion.so', desc: 'Notes, docs & project management' },
  { id: 'g11', areaId: 'general', emoji: '🤖', title: 'Claude', url: 'https://claude.ai', desc: 'AI assistant for research & writing' },
  { id: 'g12', areaId: 'general', emoji: '✍️', title: 'Grammarly', url: 'https://www.grammarly.com', desc: 'Writing & grammar assistant' },
  { id: 'g13', areaId: 'general', emoji: '🎬', title: 'YouTube', url: 'https://www.youtube.com', desc: 'Video tutorials on anything' },
  { id: 'g14', areaId: 'general', emoji: '📊', title: 'Google Sheets', url: 'https://sheets.google.com', desc: 'Free spreadsheets' },

  // Physical
  { id: 'p1', areaId: 'physical', emoji: '🍎', title: 'MyFitnessPal', url: 'https://www.myfitnesspal.com', desc: 'Track meals, calories & macros' },
  { id: 'p2', areaId: 'physical', emoji: '🏃', title: 'Strava', url: 'https://www.strava.com', desc: 'Track runs, rides & workouts' },
  { id: 'p3', areaId: 'physical', emoji: '🩺', title: 'Mayo Clinic', url: 'https://www.mayoclinic.org', desc: 'Trusted medical information' },
  { id: 'p4', areaId: 'physical', emoji: '😴', title: 'Sleep Foundation', url: 'https://www.sleepfoundation.org', desc: 'Sleep science & better rest' },
  { id: 'p5', areaId: 'physical', emoji: '🏋️', title: 'CDC: Physical Activity', url: 'https://www.cdc.gov/physical-activity/index.html', desc: 'Exercise guidelines & health tips' },
  { id: 'p6', areaId: 'physical', emoji: '💊', title: 'WebMD', url: 'https://www.webmd.com', desc: 'Symptoms, conditions & health news' },

  // Mental
  { id: 'm1', areaId: 'mental', emoji: '🧘', title: 'Headspace', url: 'https://www.headspace.com', desc: 'Guided meditation & mindfulness' },
  { id: 'm2', areaId: 'mental', emoji: '🌙', title: 'Calm', url: 'https://www.calm.com', desc: 'Sleep, meditation & relaxation' },
  { id: 'm3', areaId: 'mental', emoji: '💬', title: 'BetterHelp', url: 'https://www.betterhelp.com', desc: 'Online therapy & counseling' },
  { id: 'm4', areaId: 'mental', emoji: '🧠', title: 'Psychology Today', url: 'https://www.psychologytoday.com', desc: 'Find therapists & mental health articles' },
  { id: 'm5', areaId: 'mental', emoji: '🤝', title: 'NAMI', url: 'https://www.nami.org', desc: 'Mental health support & education' },
  { id: 'm6', areaId: 'mental', emoji: '👂', title: '7 Cups', url: 'https://www.7cups.com', desc: 'Free emotional support & listening' },

  // Social
  { id: 's1', areaId: 'social', emoji: '👥', title: 'Meetup', url: 'https://www.meetup.com', desc: 'Find local groups & events' },
  { id: 's2', areaId: 'social', emoji: '🏘️', title: 'Nextdoor', url: 'https://nextdoor.com', desc: 'Connect with your local neighborhood' },
  { id: 's3', areaId: 'social', emoji: '🎟️', title: 'Eventbrite', url: 'https://www.eventbrite.com', desc: 'Discover events near you' },
  { id: 's4', areaId: 'social', emoji: '🐝', title: 'Bumble BFF', url: 'https://bumble.com/bff', desc: 'Make new friends' },
  { id: 's5', areaId: 'social', emoji: '🌍', title: 'InterNations', url: 'https://www.internations.org', desc: 'Global community & expat network' },

  // Financial
  { id: 'f1', areaId: 'financial', emoji: '💳', title: 'NerdWallet', url: 'https://www.nerdwallet.com', desc: 'Personal finance advice & tools' },
  { id: 'f2', areaId: 'financial', emoji: '📈', title: 'Investopedia', url: 'https://www.investopedia.com', desc: 'Learn investing & finance terms' },
  { id: 'f3', areaId: 'financial', emoji: '🧾', title: 'YNAB', url: 'https://www.ynab.com', desc: 'Zero-based budgeting tool' },
  { id: 'f4', areaId: 'financial', emoji: '📉', title: 'Credit Karma', url: 'https://www.creditkarma.com', desc: 'Free credit score & monitoring' },
  { id: 'f5', areaId: 'financial', emoji: '🏦', title: 'Investor.gov', url: 'https://www.investor.gov', desc: 'Official U.S. investor education' },
  { id: 'f6', areaId: 'financial', emoji: '💵', title: 'Bankrate', url: 'https://www.bankrate.com', desc: 'Compare rates & financial products' },

  // Creative
  { id: 'c1', areaId: 'creative', emoji: '🎨', title: 'Skillshare', url: 'https://www.skillshare.com', desc: 'Creative classes on everything' },
  { id: 'c2', areaId: 'creative', emoji: '🖼️', title: 'Behance', url: 'https://www.behance.net', desc: 'Showcase & discover creative work' },
  { id: 'c3', areaId: 'creative', emoji: '✏️', title: 'Domestika', url: 'https://www.domestika.org', desc: 'Courses for creative professionals' },
  { id: 'c4', areaId: 'creative', emoji: '🎬', title: 'MasterClass', url: 'https://www.masterclass.com', desc: 'Learn from the best in their field' },
  { id: 'c5', areaId: 'creative', emoji: '📌', title: 'Pinterest', url: 'https://www.pinterest.com', desc: 'Visual inspiration & mood boards' },
  { id: 'c6', areaId: 'creative', emoji: '🎵', title: 'SoundCloud', url: 'https://soundcloud.com', desc: 'Share & discover music' },

  // Professional
  { id: 'pr1', areaId: 'professional', emoji: '💼', title: 'LinkedIn', url: 'https://www.linkedin.com', desc: 'Professional networking' },
  { id: 'pr2', areaId: 'professional', emoji: '📖', title: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning', desc: 'Career & business courses' },
  { id: 'pr3', areaId: 'professional', emoji: '🏢', title: 'Glassdoor', url: 'https://www.glassdoor.com', desc: 'Company reviews & salaries' },
  { id: 'pr4', areaId: 'professional', emoji: '🔍', title: 'Indeed', url: 'https://www.indeed.com', desc: 'Job search' },
  { id: 'pr5', areaId: 'professional', emoji: '💻', title: 'freeCodeCamp', url: 'https://www.freecodecamp.org', desc: 'Learn to code for free' },
  { id: 'pr6', areaId: 'professional', emoji: '🚀', title: 'The Muse', url: 'https://www.themuse.com', desc: 'Career advice & job search' },

  // Spiritual
  { id: 'sp1', areaId: 'spiritual', emoji: '📖', title: 'Bible Gateway', url: 'https://www.biblegateway.com', desc: 'Read scripture in any translation' },
  { id: 'sp2', areaId: 'spiritual', emoji: '⏱️', title: 'Insight Timer', url: 'https://insighttimer.com', desc: 'Free meditation & mindfulness' },
  { id: 'sp3', areaId: 'spiritual', emoji: '☸️', title: 'Tricycle', url: 'https://tricycle.org', desc: 'Buddhist teachings & practice' },
  { id: 'sp4', areaId: 'spiritual', emoji: '✨', title: 'YouVersion Bible App', url: 'https://www.bible.com', desc: 'Bible reading plans' },
  { id: 'sp5', areaId: 'spiritual', emoji: '🪷', title: 'Plum Village', url: 'https://plumvillage.org', desc: 'Mindfulness practice community' },

  // Digital
  { id: 'd1', areaId: 'digital', emoji: '🔓', title: 'Have I Been Pwned', url: 'https://haveibeenpwned.com', desc: 'Check if your data was breached' },
  { id: 'd2', areaId: 'digital', emoji: '🔑', title: '1Password', url: 'https://1password.com', desc: 'Password manager' },
  { id: 'd3', areaId: 'digital', emoji: '🛡️', title: 'EFF', url: 'https://www.eff.org', desc: 'Digital rights & privacy advocacy' },
  { id: 'd4', areaId: 'digital', emoji: '✉️', title: 'Proton Mail', url: 'https://proton.me', desc: 'Private, encrypted email' },
  { id: 'd5', areaId: 'digital', emoji: '⏳', title: 'Freedom', url: 'https://freedom.to', desc: 'Block distractions & apps' },
];

const SORT_OPTIONS = [
  { key: 'recent', label: 'Newest', icon: 'time-outline' },
  { key: 'az', label: 'A–Z', icon: 'text-outline' },
  { key: 'area', label: 'Life Area', icon: 'apps-outline' },
  { key: 'visits', label: 'Most Opened', icon: 'flame-outline' },
];

// A saved resource's life area is whichever area-id it carries as a tag.
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

const normalizeUrl = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export default function ResourcesToolsScreen() {
  const navigation = useNavigation();
  const { colors: c } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const styles = makeStyles(c);

  const [userId, setUserId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('mine'); // 'mine' | 'discover'
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState(null); // null = all
  const [sortBy, setSortBy] = useState('recent');
  const [folderFilter, setFolderFilter] = useState(null);
  const [assigningEntry, setAssigningEntry] = useState(null);

  const { folders, createFolder, renameFolder, deleteFolder } = useFolders('resources', userId);

  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [formArea, setFormArea] = useState(null);
  const [saving, setSaving] = useState(false);

  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  // Remote Discover catalog — falls back to FALLBACK_CATALOG until this
  // resolves, or forever if it fails/is empty.
  useEffect(() => {
    fetchContentPool('featured_resource').then((rows) => {
      if (rows.length) {
        setCatalog(rows.map((r) => ({
          id: r.id, areaId: r.key, emoji: r.meta?.emoji, title: r.title, url: r.meta?.url, desc: r.body,
        })));
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
    const cacheKey = `resource_tools_${uid}`;
    const cached = await cacheRead(cacheKey);
    if (cached) setEntries(cached);

    if (await isOnline()) {
      const { data } = await supabase
        .from('captures')
        .select('*')
        .eq('user_id', uid)
        .eq('type', 'resource')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (data) { setEntries(data); cacheWrite(cacheKey, data); }
    }
    setLoading(false);
  };

  const savedIdForUrl = (u) => entries.find((e) => e.url === u)?.id || null;

  const addResource = async ({ title: t, url: u, body, areaId, tags = [], source = 'manual' }) => {
    const finalTags = Array.from(new Set([
      ...(areaId && areaId !== 'general' ? [areaId] : []),
      ...tags,
    ]));
    const item = {
      user_id: userId,
      type: 'resource',
      status: 'active',
      title: t,
      body: body || null,
      url: u,
      url_meta: source === 'catalog' ? { source } : {},
      tags: finalTags,
      source,
    };
    const { data, error } = await supabase.from('captures').insert(item).select().single();
    if (!error && data) setEntries((prev) => [data, ...prev]);
    return { data, error };
  };

  const removeEntry = async (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    // Soft delete — moves to Recently Deleted in the Capture Inbox for 7 days.
    await supabase.from('captures').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  };

  const toggleCatalogItem = (cat) => {
    const existingId = savedIdForUrl(cat.url);
    if (existingId) {
      removeEntry(existingId);
    } else {
      addResource({ title: cat.title, url: cat.url, body: cat.desc, areaId: cat.areaId, source: 'catalog' });
    }
  };

  const openLink = (item) => {
    if (!item.url) return;
    Linking.openURL(item.url);
    if (item.id) {
      const visits = (item.url_meta?.visits || 0) + 1;
      const nextMeta = { ...(item.url_meta || {}), visits, lastOpenedAt: new Date().toISOString() };
      setEntries((prev) => prev.map((e) => (e.id === item.id ? { ...e, url_meta: nextMeta } : e)));
      supabase.from('captures').update({ url_meta: nextMeta }).eq('id', item.id).then(() => {});
    }
  };

  const shareResource = (item) => {
    Share.share({ message: item.url ? `${item.title} — ${item.url}` : item.title }).catch(() => {});
  };

  const assignFolder = (item, folderId) => {
    const nextMeta = { ...(item.url_meta || {}), folder: folderId || undefined };
    if (!folderId) delete nextMeta.folder;
    setEntries((prev) => prev.map((e) => (e.id === item.id ? { ...e, url_meta: nextMeta } : e)));
    supabase.from('captures').update({ url_meta: nextMeta }).eq('id', item.id).then(() => {});
    setAssigningEntry(null);
  };

  const handleDeleteFolder = (folderId) => {
    deleteFolder(folderId);
    if (folderFilter === folderId) setFolderFilter(null);
    entries.filter((e) => e.url_meta?.folder === folderId).forEach((e) => assignFolder(e, null));
  };

  const saveCustom = async () => {
    if (!title.trim() || !url.trim()) return;
    const finalUrl = normalizeUrl(url);
    if (savedIdForUrl(finalUrl)) {
      Alert.alert('Already saved', 'This link is already in your list.');
      return;
    }
    setSaving(true);
    const tags = tagsInput.split(',').map((tg) => tg.trim().toLowerCase()).filter(Boolean);
    await addResource({
      title: title.trim(),
      url: finalUrl,
      body: notes.trim() || null,
      areaId: formArea,
      tags,
      source: 'manual',
    });
    setTitle(''); setUrl(''); setNotes(''); setTagsInput(''); setFormArea(null);
    setShowAdd(false);
    setSaving(false);
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const matchesSearch = (title_, desc_) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return title_?.toLowerCase().includes(q) || desc_?.toLowerCase().includes(q);
  };

  const mineFiltered = useMemo(() => {
    let list = entries.filter((e) => {
      const areaId = getItemAreaId(e);
      const matchArea = !areaFilter || areaId === areaFilter;
      const matchFolder = !folderFilter || e.url_meta?.folder === folderFilter;
      return matchArea && matchFolder && matchesSearch(e.title, e.body);
    });
    if (sortBy === 'az') {
      list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'visits') {
      list = [...list].sort((a, b) => (b.url_meta?.visits || 0) - (a.url_meta?.visits || 0));
    } else if (sortBy === 'area') {
      return withAreaHeaders(list, getItemAreaId);
    }
    // 'recent' — already ordered by created_at desc from the query
    return list;
  }, [entries, search, areaFilter, sortBy, folderFilter]);

  const discoverFiltered = useMemo(() => {
    const list = catalog.filter((item) => {
      const matchArea = !areaFilter || item.areaId === areaFilter;
      return matchArea && matchesSearch(item.title, item.desc);
    });
    return withAreaHeaders(list, (item) => item.areaId);
  }, [catalog, search, areaFilter]);

  const areaCounts = useMemo(() => {
    const counts = {};
    entries.forEach((e) => { const aid = getItemAreaId(e); counts[aid] = (counts[aid] || 0) + 1; });
    return counts;
  }, [entries]);

  const data = tab === 'mine' ? mineFiltered : discoverFiltered;

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
            <Text style={styles.headerSubtitle}>KNOWLEDGE & TOOLS</Text>
            <Text style={styles.headerTitle}>Resources</Text>
          </View>
        </View>
        <TourSpot id="resources-list">
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
        </TourSpot>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'mine' && styles.tabBtnActive]}
          onPress={() => setTab('mine')}
        >
          <Ionicons name="bookmark" size={13} color={tab === 'mine' ? c.teal : c.text3} />
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>My List ({entries.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'discover' && styles.tabBtnActive]}
          onPress={() => setTab('discover')}
        >
          <Ionicons name="compass" size={13} color={tab === 'discover' ? c.teal : c.text3} />
          <Text style={[styles.tabText, tab === 'discover' && styles.tabTextActive]}>Discover</Text>
        </TouchableOpacity>
      </View>

      {/* Search + sort */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={c.teal} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={tab === 'mine' ? 'Search your list...' : 'Search resources to add...'}
            placeholderTextColor={c.text4}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={c.text4} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sort Selector (My List only) */}
      {tab === 'mine' && (
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
                  style={[styles.areaChip, isActive && { borderColor: c.teal, backgroundColor: c.teal + '22' }]}
                  onPress={() => setSortBy(opt.key)}
                >
                  <Ionicons name={opt.icon} size={12} color={isActive ? c.teal : c.text3} />
                  <Text style={[styles.areaChipText, isActive && { color: c.teal, fontWeight: 'bold' }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Folders (My List only) */}
      {tab === 'mine' && (
        <FolderRow
          folders={folders}
          activeFolderId={folderFilter}
          onSelect={setFolderFilter}
          onCreate={createFolder}
          onRename={renameFolder}
          onDelete={handleDeleteFolder}
        />
      )}

      {/* Life area filter chips */}
      <View style={styles.filterBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.areaChip, !areaFilter && styles.areaChipActive]}
            onPress={() => setAreaFilter(null)}
          >
            <Text style={[styles.areaChipText, !areaFilter && styles.areaChipTextActive]}>All</Text>
          </TouchableOpacity>
          {FILTER_AREAS.map((area) => {
            const isSelected = areaFilter === area.id;
            const count = tab === 'mine' ? areaCounts[area.id] : null;
            return (
              <TouchableOpacity
                key={area.id}
                style={[
                  styles.areaChip,
                  isSelected && { borderColor: area.color, backgroundColor: area.color + '22' },
                ]}
                onPress={() => setAreaFilter(isSelected ? null : area.id)}
              >
                {showEmojis ? <Text style={{ fontSize: 12 }}>{area.emoji}</Text> : <Ionicons name={area.icon} size={12} color={area.color} />}
                <Text style={[styles.areaChipText, isSelected && { color: area.color, fontWeight: 'bold' }]}>
                  {area.label}{count ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading && tab === 'mine' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.teal} />
          <Text style={styles.loadingText}>Loading your resources...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => (item.__header ? item.key : item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name={tab === 'mine' ? 'bookmark-outline' : 'compass-outline'} size={46} color={c.border} />
              <Text style={styles.emptyTitle}>{tab === 'mine' ? 'Nothing saved yet' : 'No matches'}</Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'mine'
                  ? 'Browse Discover to add curated sites, or tap Add for your own link.'
                  : 'Try a different search or life area.'}
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
              const saved = !!savedIdForUrl(item.url);
              const area = AREA_MAP[item.areaId];
              return (
                <View style={[styles.card, { borderLeftColor: area.color }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.typeIconBox, { backgroundColor: area.color + '22' }]}>
                      {showEmojis ? <Text style={{ fontSize: 17 }}>{item.emoji}</Text> : <Ionicons name={area.icon} size={16} color={area.color} />}
                    </View>
                    <TouchableOpacity style={styles.cardTitleArea} onPress={() => Linking.openURL(item.url)}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                      {showSubtext && <Text style={styles.cardBody} numberOfLines={2}>{item.desc}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={styles.iconBtn}>
                      <Ionicons name="open-outline" size={17} color={c.text3} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleCatalogItem(item)} style={styles.iconBtn}>
                      <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={17} color={saved ? c.gold : c.text3} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            // My List card
            const areaId = getItemAreaId(item);
            const area = AREA_MAP[areaId];
            const visits = item.url_meta?.visits || 0;
            const folder = folders.find((f) => f.id === item.url_meta?.folder);
            return (
              <View style={[styles.card, { borderLeftColor: area.color }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.typeIconBox, { backgroundColor: area.color + '22' }]}>
                    {showEmojis ? <Text style={{ fontSize: 17 }}>{item.url_meta?.emoji || area.emoji}</Text> : <Ionicons name={area.icon} size={16} color={area.color} />}
                  </View>
                  <TouchableOpacity style={styles.cardTitleArea} onPress={() => openLink(item)}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    {item.url && <Text style={styles.cardUrl} numberOfLines={1}>{item.url}</Text>}
                  </TouchableOpacity>
                </View>

                {item.body && <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>}

                <View style={styles.cardFooter}>
                  <View style={styles.cardTagRow}>
                    <View style={[styles.areaPill, { borderColor: area.color + '55', backgroundColor: area.color + '18' }]}>
                      <Text style={[styles.areaPillText, { color: area.color }]}>{showEmojis ? `${area.emoji} ` : ''}{area.label}</Text>
                    </View>
                    {folder && (
                      <View style={[styles.areaPill, { borderColor: folder.color + '55', backgroundColor: folder.color + '18' }]}>
                        <Text style={[styles.areaPillText, { color: folder.color }]}>{showEmojis ? '📁 ' : ''}{folder.name}</Text>
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
                    <TouchableOpacity onPress={() => openLink(item)} style={styles.iconBtn}>
                      <Ionicons name="open-outline" size={16} color={c.teal} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => shareResource(item)} style={styles.iconBtn}>
                      <Ionicons name="share-outline" size={16} color={c.text3} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeEntry(item.id)} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={16} color={c.text4} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Add Resource Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalHeaderTitle}>{showEmojis ? '🔗 ' : ''}ADD RESOURCE</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <TextInput
              style={styles.modalInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Name *"
              placeholderTextColor={c.text4}
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              value={url}
              onChangeText={setUrl}
              placeholder="URL *"
              placeholderTextColor={c.text4}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)..."
              placeholderTextColor={c.text4}
              multiline
            />
            <TextInput
              style={styles.modalInput}
              value={tagsInput}
              onChangeText={setTagsInput}
              placeholder="Tags (comma separated)"
              placeholderTextColor={c.text4}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>Life area (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <TouchableOpacity
                style={[styles.areaChip, !formArea && styles.areaChipActive]}
                onPress={() => setFormArea(null)}
              >
                <Text style={[styles.areaChipText, !formArea && styles.areaChipTextActive]}>General</Text>
              </TouchableOpacity>
              {LIFE_AREAS.map((area) => {
                const isSelected = formArea === area.id;
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[styles.areaChip, isSelected && { borderColor: area.color, backgroundColor: area.color + '22' }]}
                    onPress={() => setFormArea(isSelected ? null : area.id)}
                  >
                    {showEmojis ? <Text style={{ fontSize: 12 }}>{area.emoji}</Text> : <Ionicons name={area.icon} size={12} color={area.color} />}
                    <Text style={[styles.areaChipText, isSelected && { color: area.color, fontWeight: 'bold' }]}>{area.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveCustom}
                disabled={!title.trim() || !url.trim() || saving}
                style={[styles.saveBtn, (!title.trim() || !url.trim() || saving) && { opacity: 0.5 }]}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save to List</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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

  searchRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10, gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg1, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: c.text1, fontSize: 13 },
  sortLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 },
  sortLabel: { color: c.text4, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  filterBarContainer: { marginBottom: 12 },
  filterScroll: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  areaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border, marginRight: 8 },
  areaChipActive: { borderColor: c.purple, backgroundColor: c.purple + '22' },
  areaChipText: { color: c.text3, fontSize: 11, fontWeight: '600' },
  areaChipTextActive: { color: c.text1, fontWeight: 'bold' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: c.text3, fontSize: 12 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { color: c.text1, fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { color: c.text3, fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 30 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, paddingBottom: 4 },
  sectionHeaderText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  sectionHeaderCount: { color: c.text4, fontSize: 10, fontWeight: '600' },

  card: { backgroundColor: c.bg1, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.border, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIconBox: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  cardTitleArea: { flex: 1 },
  cardTitle: { color: c.text1, fontSize: 14, fontWeight: 'bold' },
  cardUrl: { color: c.teal, fontSize: 11, marginTop: 2 },
  cardBody: { color: c.text2, fontSize: 12, lineHeight: 17, marginTop: 6 },
  iconBtn: { padding: 6 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  areaPill: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  areaPillText: { fontSize: 10, fontWeight: '700' },
  visitsPill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: c.bg2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  visitsPillText: { color: c.text4, fontSize: 10, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 2, borderTopColor: c.teal, maxHeight: '88%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 16 },
  modalHeaderTitle: { color: c.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 16 },
  modalInput: { backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, color: c.text1, fontSize: 13, marginBottom: 10 },
  modalTextArea: { minHeight: 70, textAlignVertical: 'top' },
  modalLabel: { color: c.text3, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  modalActionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: c.bg2, borderRadius: 10, borderWidth: 1, borderColor: c.border },
  cancelBtnText: { color: c.text3, fontSize: 12, fontWeight: 'bold' },
  saveBtn: { flex: 2, paddingVertical: 12, alignItems: 'center', backgroundColor: c.teal, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
